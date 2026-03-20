import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

export default function SellerDashboard({ user, setView }) {
  const [activeTab, setActiveTab] = useState('new');
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, sold: 0 });
  const [statusFilter, setStatusFilter] = useState('all');

  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [condition, setCondition] = useState('Like New');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [detailImage1, setDetailImage1] = useState(null);
  const [detailImage2, setDetailImage2] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [postError, setPostError] = useState('');

  const [conversations, setConversations] = useState([]);
  const [selectedConvIdx, setSelectedConvIdx] = useState(0);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [agentNames, setAgentNames] = useState({});
  const msgsEndRef = useRef(null);
  const pollRef = useRef(null);
  const textareaRef = useRef(null);
  const pendingMsgSentRef = useRef(false);
  // Track whether we should auto-scroll (only after user sends a message)
  const shouldScrollRef = useRef(false);

  const categories = ['Furniture', 'Electronics', 'Appliances', 'For Kids', 'Decor', 'Household'];
  const conditions = ['Brand New', 'Like New', 'Excellent', 'Good', 'Fair', 'For Parts'];

  useEffect(() => {
    const requestedTab = sessionStorage.getItem('dashboardTab');
    if (requestedTab) {
      setActiveTab(requestedTab);
      sessionStorage.removeItem('dashboardTab');
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSellerData();
      loadProfile();
      loadConversations();
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user]);

  const [convsLoaded, setConvsLoaded] = useState(false);

  useEffect(() => {
    if (!user || !convsLoaded) return;
    const raw = sessionStorage.getItem('pendingChatMessage');
    if (!raw || pendingMsgSentRef.current) return;

    const pending = (() => { try { return JSON.parse(raw); } catch { return null; } })();
    if (!pending) return;

    pendingMsgSentRef.current = true;
    sessionStorage.removeItem('pendingChatMessage');

    handlePendingMessage(pending.text);
  }, [convsLoaded, user]);

  // ── Only scroll when shouldScrollRef is true ──
  useEffect(() => {
    if (shouldScrollRef.current) {
      msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldScrollRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedConv) {
      pollRef.current = setInterval(() => loadMessages(selectedConv, true), 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedConv]);

  const handleTextareaInput = (e) => {
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
    setNewMessage(ta.value);
  };

  const handlePendingMessage = async (text) => {
    if (!text || !user) return;
    try {
      const { data: freshConvs } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(1);

      let conv = (freshConvs && freshConvs.length > 0) ? freshConvs[0] : null;

      if (!conv) {
        const { data: newConv, error: ce } = await supabase
          .from('agent_conversations')
          .insert([{ user_id: user.id, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() }])
          .select().single();
        if (ce) { console.error('conv create error:', ce.message); return; }
        conv = newConv;
      }

      if (!conv) return;

      const { error: me } = await supabase
        .from('agent_messages')
        .insert([{ conversation_id: conv.id, sender_id: user.id, is_agent: false, content: text, created_at: new Date().toISOString() }]);

      if (me) { console.error('message insert error:', me.message); return; }

      await supabase.from('agent_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conv.id);

      const { data: convs } = await supabase
        .from('agent_conversations').select('*').eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (convs && convs.length > 0) {
        const enriched = await enrichConversations(convs);
        setConversations(enriched);
        setSelectedConv(enriched[0]);
        setSelectedConvIdx(0);
        setMobileShowChat(true);

        const { data: msgs } = await supabase
          .from('agent_messages').select('*').eq('conversation_id', enriched[0].id)
          .order('created_at', { ascending: true });
        if (msgs) {
          shouldScrollRef.current = true;
          setMessages(msgs);
        }
      }
    } catch (err) { console.error('pendingMessage error:', err.message); }
  };

  const fetchAgentNames = async (convs) => {
    const names = {};
    for (const conv of convs) {
      try {
        const { data: agentMsg } = await supabase
          .from('agent_messages').select('sender_id').eq('conversation_id', conv.id)
          .eq('is_agent', true).limit(1);

        if (agentMsg && agentMsg.length > 0) {
          const agentId = agentMsg[0].sender_id;
          const { data: profile } = await supabase
            .from('seller_profiles').select('business_name, full_name, name').eq('user_id', agentId).single();

          if (profile) {
            names[conv.id] = profile.business_name || profile.full_name || profile.name || 'Support Agent';
          } else {
            const { data: authUser } = await supabase
              .from('profiles').select('full_name, username, name').eq('id', agentId).single();
            names[conv.id] = authUser?.full_name || authUser?.username || authUser?.name || 'Support Agent';
          }
        } else {
          names[conv.id] = 'Support Team';
        }
      } catch { names[conv.id] = 'Support Team'; }
    }
    return names;
  };

  const enrichConversations = async (convs) => {
    return await Promise.all(convs.map(async (conv) => {
      const { data: lastMsg } = await supabase
        .from('agent_messages').select('content, is_agent, created_at')
        .eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1);
      return { ...conv, lastMsg: lastMsg?.[0] || null };
    }));
  };

  const loadProfile = async () => {
    const { data } = await supabase.from('seller_profiles').select('*').eq('user_id', user.id).single();
    if (data) { setBusinessName(data.business_name || ''); setLocation(data.location || ''); }
  };

  const loadConversations = async () => {
    const { data: convs, error } = await supabase
      .from('agent_conversations').select('*').eq('user_id', user.id)
      .order('last_message_at', { ascending: false });
    if (error) { console.error('convs error:', error.message); setConvsLoaded(true); return; }

    if (convs && convs.length > 0) {
      const enriched = await enrichConversations(convs);
      setConversations(enriched);
      fetchAgentNames(convs).then(names => setAgentNames(names));

      if (!selectedConv) {
        setSelectedConv(enriched[0]);
        setSelectedConvIdx(0);
        loadMessages(enriched[0]);
      }
    } else {
      setConversations([]);
    }
    setConvsLoaded(true);
  };

  const loadMessages = async (conv, silent = false) => {
    if (!conv) return;
    if (!silent) setMsgLoading(true);
    const { data, error } = await supabase
      .from('agent_messages').select('*').eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    // Do NOT auto-scroll on silent poll or initial load
    if (!error && data) setMessages(data);
    if (!silent) setMsgLoading(false);
  };

  const selectConv = (conv, idx) => {
    setSelectedConv(conv);
    setSelectedConvIdx(idx);
    loadMessages(conv);
    setMobileShowChat(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    try {
      let conv = selectedConv;
      if (!conv) {
        const { data } = await supabase
          .from('agent_conversations')
          .insert([{ user_id: user.id, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() }])
          .select().single();
        conv = data;
        setSelectedConv(data);
        setConversations([data]);
      }
      const { data: msg } = await supabase
        .from('agent_messages')
        .insert([{ conversation_id: conv.id, sender_id: user.id, is_agent: false, content: newMessage, created_at: new Date().toISOString() }])
        .select().single();
      if (msg) {
        // Only scroll when user explicitly sends a message
        shouldScrollRef.current = true;
        setMessages(p => [...p, msg]);
        setNewMessage('');
        if (textareaRef.current) { textareaRef.current.value = ''; textareaRef.current.style.height = 'auto'; }
        await supabase.from('agent_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conv.id);
        loadConversations();
      }
    } catch (err) { console.error('send error:', err.message); }
  };

  const loadSellerData = async () => {
    const { data: productsData } = await supabase
      .from('products').select('*').eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    if (productsData) {
      setProducts(productsData);
      setStats({
        total:   productsData.length,
        pending: productsData.filter(p => p.status === 'pending').length,
        active:  productsData.filter(p => p.status === 'active').length,
        sold:    productsData.filter(p => p.status === 'sold').length,
      });
      productsData.forEach(async (product) => {
        const { data: imgs } = await supabase
          .from('product_images').select('*').eq('product_id', product.id)
          .order('sort_order', { ascending: true });
        if (imgs) setProductImages(prev => ({ ...prev, [product.id]: imgs }));
      });
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Math.random()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return null;
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setUploading(true); setPostError(''); setPostSuccess(false);
    try {
      if (!itemName || !price || !description || !mainImage || !location || !businessName)
        throw new Error('Please fill in all required fields');
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{ seller_id: user.id, title: itemName, price: parseFloat(price), category, condition, description, location, business_name: businessName, status: 'pending', created_at: new Date().toISOString() }])
        .select().single();
      if (productError) throw new Error(productError.message);
      const mainUrl = await handleImageUpload(mainImage);
      if (mainUrl) {
        await supabase.from('product_images').insert([{ product_id: product.id, image_url: mainUrl, is_primary: true, sort_order: 0 }]);
        await supabase.from('products').update({ image_url: mainUrl }).eq('id', product.id);
      }
      for (const [file, order] of [[detailImage1, 1], [detailImage2, 2]]) {
        if (file) {
          const url = await handleImageUpload(file);
          if (url) await supabase.from('product_images').insert([{ product_id: product.id, image_url: url, is_primary: false, sort_order: order }]);
        }
      }
      setItemName(''); setPrice(''); setCategory('Furniture'); setCondition('Like New');
      setDescription(''); setMainImage(null); setDetailImage1(null); setDetailImage2(null);
      document.querySelectorAll('input[type="file"]').forEach(i => { i.value = ''; });
      setPostSuccess(true);
      await loadSellerData();
      setActiveTab('listings');
    } catch (err) { setPostError(`Failed to post item: ${err.message}`); }
    finally { setUploading(false); }
  };

  const filteredProducts = statusFilter === 'all' ? products : products.filter(p => p.status === statusFilter);

  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts), today = new Date(), yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return formatTime(ts);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getDateChip = (ts) => {
    const d = new Date(ts), today = new Date(), yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const messagesWithDateChips = messages.reduce((acc, msg, i) => {
    const msgDate = new Date(msg.created_at).toDateString();
    const prevDate = i > 0 ? new Date(messages[i-1].created_at).toDateString() : null;
    if (msgDate !== prevDate) acc.push({ type: 'chip', label: getDateChip(msg.created_at) });
    acc.push({ type: 'msg', msg });
    return acc;
  }, []);

  const getAgentName = (conv) => {
    if (!conv) return 'Support Team';
    return agentNames[conv.id] || 'Support Team';
  };

  const statusColor = (s) => ({
    active:   { bg: 'rgba(74,222,128,0.15)',  text: '#4ade80'  },
    pending:  { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24'  },
    sold:     { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.45)' },
    approved: { bg: 'rgba(74,222,128,0.15)',  text: '#4ade80'  },
    rejected: { bg: 'rgba(255,107,107,0.15)', text: '#ff6b6b'  },
  }[s] || { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.45)' });

  return (
    <div style={{ background: '#0e1117', minHeight: '100vh', color: '#ffffff', fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        .dash-input::placeholder { color: rgba(255,255,255,0.25); }
        .dash-input option { background: #1c1c1c; }
        .dash-input:focus { border-color: #4dd4ac !important; outline: none; }
        .dash-file { color-scheme: dark; }

        .dash-tabbar { background: #131920; border-bottom: 2px solid #1a2030; display: flex; align-items: center; padding: 0 40px; position: sticky; top: 0; z-index: 100; overflow-x: auto; }
        .dash-tabbar::-webkit-scrollbar { display: none; }
        .dash-tab { display: inline-flex; align-items: center; gap: 8px; padding: 20px 28px; color: rgba(255,255,255,0.45); font-size: 0.95rem; font-weight: 600; border: none; border-bottom: 3px solid transparent; background: none; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-family: inherit; }
        .dash-tab:hover { color: #FFD700; }
        .dash-tab.active { color: #FFD700; border-bottom-color: #FFD700; }
        .tab-badge { background: #4dd4ac; color: #000; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; margin-left: 4px; }

        .alert { padding: 13px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 0.88rem; font-weight: 500; border: 1px solid; display: flex; align-items: flex-start; gap: 10px; }
        .alert-success { background: rgba(77,212,172,0.07); border-color: #4dd4ac; color: #4dd4ac; }
        .alert-error   { background: rgba(255,107,107,0.07); border-color: #ff6b6b; color: #ff6b6b; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .form-group { margin-bottom: 18px; }
        .form-group label { display: block; margin-bottom: 7px; color: rgba(255,255,255,0.65); font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .form-control { width: 100%; padding: 12px 16px; border: 1px solid #1e2a3a; border-radius: 8px; background: #0e1117; color: #fff; font-size: 0.9rem; font-family: inherit; transition: border-color 0.2s; box-sizing: border-box; }
        .form-control:focus { outline: none; border-color: #4dd4ac; }
        .form-control::placeholder { color: rgba(255,255,255,0.22); }
        textarea.form-control { min-height: 115px; resize: vertical; }
        select.form-control { cursor: pointer; }
        select.form-control option { background: #1c1c1c; }

        .upload-zone { border: 2px dashed #1e2a3a; border-radius: 10px; padding: 28px; text-align: center; transition: border-color 0.2s; cursor: pointer; background: #0e1117; width: 100%; box-sizing: border-box; }
        .upload-zone:hover { border-color: #4dd4ac; }
        @media (max-width: 768px) { .upload-zone { border-radius: 0; border-left: none; border-right: none; margin-left: -16px; margin-right: -16px; width: calc(100% + 32px); padding: 24px 16px; } }

        .ftab { padding: 7px 15px; background: #1a2030; color: rgba(255,255,255,0.45); font-weight: 600; font-size: 0.8rem; border-radius: 20px; border: 1px solid #1e2a3a; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-family: inherit; }
        .ftab:hover { color: #4dd4ac; border-color: #4dd4ac; }
        .ftab.active { background: #4dd4ac; color: #000; border-color: #4dd4ac; }
        .ftab span { font-size: 0.72rem; font-weight: 700; opacity: 0.75; }

        .listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .listing-card { background: #151c27; border-radius: 12px; overflow: hidden; border: 1px solid #1e2a3a; transition: all 0.22s; }
        .listing-card:hover { transform: translateY(-4px); border-color: #4dd4ac; box-shadow: 0 8px 24px rgba(77,212,172,0.1); }
        .lc-img { position: relative; height: 175px; background: #111; overflow: hidden; }
        .lc-img img { width: 100%; height: 100%; object-fit: cover; }
        .lc-status-badge { position: absolute; top: 10px; right: 10px; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .lc-body { padding: 16px; }
        .lc-title { font-size: 0.95rem; font-weight: 600; color: #fff; margin-bottom: 5px; }
        .lc-price { font-size: 1.2rem; font-weight: 700; color: #4dd4ac; margin-bottom: 11px; }
        .lc-veri { padding: 8px 11px; border-radius: 7px; margin-bottom: 10px; font-size: 0.78rem; font-weight: 600; display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.25); }
        .lc-actions { display: flex; gap: 8px; padding-top: 11px; margin-top: 4px; border-top: 1px solid #1e2a3a; }
        .lc-btn { flex: 1; padding: 8px; border-radius: 7px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; border: 1px solid; font-family: inherit; transition: all 0.2s; background: transparent; }
        .btn-view { color: #4dd4ac; border-color: #4dd4ac; }
        .btn-view:hover { background: #4dd4ac; color: #000; }
        .btn-del { color: #ff6b6b; border-color: #ff6b6b; }
        .btn-del:hover { background: #ff6b6b; color: #fff; }

        /* ── Chat shell: desktop ── */
        .wa-shell {
          display: flex;
          height: calc(100vh - 200px);
          min-height: 600px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #1e2a3a;
          box-shadow: 0 16px 50px rgba(0,0,0,0.5);
        }
        .wa-left { width: 300px; flex-shrink: 0; background: #0e1117; border-right: 1px solid #1e2a3a; display: flex; flex-direction: column; }
        .wa-left-top { padding: 16px 20px; background: #131920; border-bottom: 1px solid #1e2a3a; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .wa-left-top h3 { font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0; }
        .wa-left-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }
        .wa-contact-list { flex: 1; overflow-y: auto; }
        .wa-contact { display: flex; align-items: center; gap: 13px; padding: 14px 20px; cursor: pointer; border-bottom: 1px solid #1a2030; transition: background 0.15s; border-left: 3px solid transparent; }
        .wa-contact:hover { background: rgba(77,212,172,0.07); }
        .wa-contact.active { background: rgba(77,212,172,0.14); border-left-color: #4dd4ac; }
        .wa-ava { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #4dd4ac, #2a9d7c); display: flex; align-items: center; justify-content: center; color: #000; font-weight: 700; font-size: 1rem; flex-shrink: 0; position: relative; }
        .wa-dot { width: 10px; height: 10px; background: #4dd4ac; border-radius: 50%; border: 2px solid #111; position: absolute; bottom: 1px; right: 1px; box-shadow: 0 0 5px rgba(77,212,172,0.7); }
        .wa-ci { flex: 1; min-width: 0; }
        .wa-cname { font-size: 0.88rem; font-weight: 600; color: #fff; }
        .wa-cprev { font-size: 0.75rem; color: rgba(255,255,255,0.38); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .wa-ctime { font-size: 0.68rem; color: rgba(255,255,255,0.28); }

        .wa-right { flex: 1; display: flex; flex-direction: column; background: #0a1018; background-image: radial-gradient(circle at 1px 1px, rgba(77,212,172,0.02) 1px, transparent 0); background-size: 28px 28px; min-width: 0; }
        .wa-topbar { padding: 14px 20px; background: #131920; border-bottom: 1px solid #1e2a3a; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .wa-topbar-ava { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #4dd4ac, #2a9d7c); display: flex; align-items: center; justify-content: center; color: #000; font-weight: 700; font-size: 0.92rem; flex-shrink: 0; }
        .wa-topbar-name { font-size: 0.9rem; font-weight: 600; color: #fff; margin: 0 0 2px; }
        .wa-topbar-status { font-size: 0.72rem; color: #4dd4ac; margin: 0; display: flex; align-items: center; gap: 5px; }
        .wa-topbar-status::before { content: ''; width: 6px; height: 6px; background: #4dd4ac; border-radius: 50%; display: inline-block; box-shadow: 0 0 5px rgba(77,212,172,0.6); }
        .wa-topbar-sub { font-size: 0.65rem; color: rgba(255,255,255,0.3); letter-spacing: 0.04em; text-transform: uppercase; }

        .wa-msgs { flex: 1; overflow-y: auto; padding: 22px 28px; display: flex; flex-direction: column; gap: 3px; }
        .wa-msgs::-webkit-scrollbar { width: 5px; }
        .wa-msgs::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 4px; }

        .wa-datechip { text-align: center; margin: 10px 0; }
        .wa-datechip span { background: #1a2520; color: rgba(255,255,255,0.4); font-size: 0.7rem; padding: 4px 13px; border-radius: 9px; display: inline-block; border: 1px solid rgba(77,212,172,0.1); }

        .wa-msg { display: flex; margin-bottom: 1px; }
        .wa-msg.sent { justify-content: flex-end; }
        .wa-msg.received { justify-content: flex-start; }
        .wa-msg-inner { display: flex; flex-direction: column; max-width: 72%; }
        .wa-msg.sent .wa-msg-inner { align-items: flex-end; }
        .wa-msg.received .wa-msg-inner { align-items: flex-start; }
        .wa-sender-label { font-size: 0.68rem; font-weight: 700; color: #4dd4ac; margin-bottom: 3px; padding-left: 2px; }
        .wa-bubble { width: 100%; padding: 8px 12px 6px; border-radius: 10px; word-wrap: break-word; line-height: 1.55; font-size: 0.87rem; box-shadow: 0 1px 2px rgba(0,0,0,0.35); animation: waPop 0.18s ease; }
        @keyframes waPop { from { opacity:0; transform: scale(0.95) translateY(5px); } to { opacity:1; transform: scale(1) translateY(0); } }
        .wa-msg.received .wa-bubble { background: #1e2b27; color: #e0f5ef; border-top-left-radius: 2px; }
        .wa-msg.sent .wa-bubble { background: #1d4b39; color: #e0f5ef; border-top-right-radius: 2px; }
        .wa-foot { display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 2px; }
        .wa-time { font-size: 0.62rem; color: rgba(255,255,255,0.36); }
        .wa-tick { color: #4dd4ac; font-size: 0.68rem; }

        .wa-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; padding: 40px; }
        .wa-empty-icon { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #1d4b39, #163326); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: #4dd4ac; }

        .wa-inputbar { padding: 12px 18px; background: #131920; border-top: 1px solid #1e2a3a; display: flex; align-items: flex-end; gap: 10px; flex-shrink: 0; }
        .wa-ta { flex: 1; background: #1a2230; border: 1px solid #1e2a3a; border-radius: 22px; color: #fff; font-family: inherit; font-size: 0.87rem; padding: 10px 16px; resize: none; min-height: 42px; max-height: 110px; overflow-y: hidden; line-height: 1.5; transition: border-color 0.2s; }
        .wa-ta:focus { outline: none; border-color: #4dd4ac; }
        .wa-ta::placeholder { color: rgba(255,255,255,0.28); }
        .wa-sendbtn { width: 42px; height: 42px; border-radius: 50%; background: #4dd4ac; color: #000; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; transition: all 0.2s; box-shadow: 0 2px 8px rgba(77,212,172,0.3); }
        .wa-sendbtn:hover { background: #3bc495; transform: scale(1.08); }
        .wa-sendbtn:disabled { background: #1e2a3a; cursor: default; transform: none; box-shadow: none; }

        .empty-state { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3); }
        .empty-state h3 { color: rgba(255,255,255,0.45); margin-bottom: 8px; font-size: 1rem; }

        .settings-card { background: #151c27; border: 1px solid #1e2a3a; border-radius: 14px; padding: 40px; }
        .settings-label { font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 18px; }

        /* ── Mobile overrides ── */
        @media (max-width: 768px) {
          .dash-tabbar { padding: 0 16px; }
          .dash-page { padding: 24px 16px; }
          .form-row { grid-template-columns: 1fr; }
          .listings-grid { grid-template-columns: 1fr; }

          /* Chat: full-screen height on mobile, stacked layout */
          .wa-shell {
            flex-direction: column;
            height: calc(100vh - 120px); /* much taller on mobile */
            min-height: 0;
            border-radius: 10px;
          }
          /* Contact list panel */
          .wa-left {
            width: 100%;
            flex: none;
            height: 240px;             /* fixed compact height when visible */
            border-right: none;
            border-bottom: 1px solid #1e2a3a;
          }
          .wa-left.hidden { display: none; }

          /* Chat panel fills remaining space */
          .wa-right {
            flex: 1;
            min-height: 0;
          }
          .wa-right.hidden { display: none; }

          .wa-msg-inner { max-width: 85%; }
          .wa-back-btn { display: block !important; }
        }
      `}</style>

      {/* ── Tab Bar ── */}
      <div className="dash-tabbar">
        {[
          { id: 'new',      label: 'Add New'  },
          { id: 'listings', label: 'My Ads'   },
          { id: 'messages', label: 'Messages' },
          { id: 'settings', label: 'Settings' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`dash-tab ${activeTab === id ? 'active' : ''}`}>
            {label}
            {id === 'messages' && stats.pending > 0 && (
              <span className="tab-badge">{stats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Page Content ── */}
      <div className="dash-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '44px 40px' }}>

        {postSuccess && activeTab !== 'new' && (
          <div className="alert alert-success">✓ Item submitted successfully! It will be visible after agent approval.</div>
        )}

        {/* ══ ADD NEW ══ */}
        {activeTab === 'new' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#4dd4ac', marginBottom: '4px' }}>Add New Listing</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.32)' }}>Fill in the details and submit — your listing will be reviewed before going live.</div>
            </div>
            {postSuccess && <div className="alert alert-success">✓ Listing submitted! It will be visible after admin verification.</div>}
            {postError   && <div className="alert alert-error">⚠ {postError}</div>}
            <div style={{ background: '#151c27', border: '1px solid #1e2a3a', borderRadius: '14px', padding: '40px' }}>
              <form onSubmit={handlePostSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Business Name</label>
                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required placeholder="e.g. Steve's Electronics" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} required className="form-control">
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Item Name</label>
                    <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} required placeholder='e.g. Samsung 55" TV' className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Condition</label>
                    <select value={condition} onChange={e => setCondition(e.target.value)} required className="form-control">
                      {conditions.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" placeholder="0.00" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} required placeholder="e.g. USA, Newyork" className="form-control" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} required rows="5" className="form-control" placeholder="Describe your item — condition, features, reason for selling…" />
                </div>
                <div className="form-group">
                  <label>Images</label>
                  <div className="upload-zone">
                    <div style={{ fontSize: '2rem', color: '#4dd4ac', marginBottom: '10px' }}>↑</div>
                    <div style={{ marginBottom: '16px' }}>
                      {[
                        { label: 'Main Image *', setter: setMainImage, req: true },
                        { label: 'Detail Image 1 (Optional)', setter: setDetailImage1 },
                        { label: 'Detail Image 2 (Optional)', setter: setDetailImage2 },
                      ].map(({ label, setter, req }) => (
                        <div key={label} style={{ marginBottom: '12px', textAlign: 'left' }}>
                          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                          <input type="file" accept="image/*" required={req} onChange={e => setter(e.target.files[0])}
                            style={{ width: '100%', padding: '10px', background: '#0e1117', border: '1px solid #1e2a3a', borderRadius: '8px', color: '#fff', cursor: 'pointer', colorScheme: 'dark' }} />
                        </div>
                      ))}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>JPG, PNG or GIF · 1 main + 2 optional detail images</p>
                  </div>
                </div>
                <button type="submit" disabled={uploading}
                  style={{ padding: '12px 28px', background: uploading ? 'rgba(77,212,172,0.5)' : '#4dd4ac', color: '#000', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: uploading ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit', transition: 'all 0.2s' }}
                  onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = '#3bc495'; }}
                  onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = '#4dd4ac'; }}>
                  ✈ {uploading ? 'Submitting…' : 'Submit for Verification'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ══ MY ADS ══ */}
        {activeTab === 'listings' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#4dd4ac', marginBottom: '4px' }}>My Ads</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.32)' }}>Track and manage all your listings.</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                { key: 'all',     label: 'All',     count: stats.total   },
                { key: 'pending', label: 'Pending', count: stats.pending },
                { key: 'active',  label: 'Active',  count: stats.active  },
                { key: 'sold',    label: 'Sold',    count: stats.sold    },
              ].map(({ key, label, count }) => (
                <button key={key} onClick={() => setStatusFilter(key)} className={`ftab ${statusFilter === key ? 'active' : ''}`}>
                  {label} <span>{count}</span>
                </button>
              ))}
            </div>
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '3.5rem', marginBottom: '16px', color: '#1e2a3a' }}>□</div>
                <h3>No listings found</h3>
                <p style={{ fontSize: '0.82rem' }}>You haven't posted any items in this category yet.</p>
                {statusFilter === 'all' && (
                  <button onClick={() => setActiveTab('new')}
                    style={{ marginTop: '16px', padding: '10px 24px', background: '#4dd4ac', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Post Your First Item
                  </button>
                )}
              </div>
            ) : (
              <div className="listings-grid">
                {filteredProducts.map(product => {
                  const sc = statusColor(product.status);
                  const statusLabel = { pending: 'Pending', active: 'Active', sold: 'Sold', approved: 'Approved', rejected: 'Rejected' }[product.status] || product.status;
                  const veriLabel = { pending: '⏳ Waiting for Verification', active: '✓ Live & Active', approved: '✓ Live & Approved', sold: '● Sold', rejected: '✗ Rejected' }[product.status] || product.status;
                  return (
                    <div key={product.id} className="listing-card">
                      <div className="lc-img">
                        {product.image_url
                          ? <img src={product.image_url} alt={product.title} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', background: '#111' }}>No image</div>}
                        <span className="lc-status-badge" style={{ background: sc.bg, color: sc.text }}>{statusLabel}</span>
                      </div>
                      <div className="lc-body">
                        <div className="lc-title">{product.title}</div>
                        <div className="lc-price">${parseFloat(product.price).toFixed(2)}</div>
                        <div className="lc-veri" style={{ borderLeft: `3px solid ${sc.text}`, color: sc.text }}>{veriLabel}</div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>{product.category} · {product.condition} · {product.location}</div>
                        {(product.status === 'active' || product.status === 'approved' || product.status === 'pending') && (
                          <div className="lc-actions">
                            {(product.status === 'active' || product.status === 'approved') && (
                              <button className="lc-btn btn-view" onClick={() => { sessionStorage.setItem('selectedProductId', product.id); setView('listings'); }}>👁 View</button>
                            )}
                            {product.status === 'pending' && (
                              <button className="lc-btn btn-del" onClick={async () => { if (window.confirm('Delete this listing?')) { await supabase.from('products').delete().eq('id', product.id); loadSellerData(); } }}>🗑 Delete</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ MESSAGES ══ */}
        {activeTab === 'messages' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#4dd4ac', marginBottom: '4px' }}>Messages</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.32)' }}>Your conversations with marketplace agents.</div>
            </div>

            <div className="wa-shell">
              {/* Left: thread list — hidden on mobile when chat is open */}
              <div className={`wa-left${mobileShowChat ? ' hidden' : ''}`}>
                <div className="wa-left-top">
                  <div>
                    <h3>Chats</h3>
                    <div className="wa-left-sub">Support &amp; notifications</div>
                  </div>
                </div>
                <div className="wa-contact-list">
                  {conversations.length === 0 ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💬</div>
                      <p>No conversations yet</p>
                      <p style={{ fontSize: '11px', marginTop: '6px' }}>Browse listings and tap Chat on any product to start</p>
                      <button onClick={() => { setSelectedConv(null); setMessages([]); setMobileShowChat(true); }}
                        style={{ marginTop: '14px', width: '100%', padding: '10px', background: 'rgba(77,212,172,0.1)', border: '1px solid #4dd4ac', borderRadius: '8px', color: '#4dd4ac', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', fontFamily: 'inherit' }}>
                        + Start a conversation
                      </button>
                    </div>
                  ) : conversations.map((conv, idx) => (
                    <div key={conv.id} className={`wa-contact ${selectedConvIdx === idx ? 'active' : ''}`} onClick={() => selectConv(conv, idx)}>
                      <div className="wa-ava">
                        {getAgentName(conv).charAt(0).toUpperCase()}
                        <span className="wa-dot" />
                      </div>
                      <div className="wa-ci">
                        <div className="wa-cname">{getAgentName(conv)}</div>
                        <div className="wa-cprev">{conv.lastMsg ? (conv.lastMsg.is_agent ? '🤝 ' : 'You: ') + conv.lastMsg.content : 'No messages yet'}</div>
                      </div>
                      <div className="wa-ctime">{formatDate(conv.last_message_at)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: chat panel — hidden on mobile when contact list is showing */}
              <div className={`wa-right${!mobileShowChat && conversations.length > 0 ? ' hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
                {conversations.length === 0 && !mobileShowChat ? (
                  <div className="wa-empty">
                    <div className="wa-empty-icon">💬</div>
                    <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>No messages yet</h3>
                    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.8rem', maxWidth: '260px', lineHeight: '1.6' }}>
                      Browse listings and tap <strong>Chat</strong> on any product to start a conversation with an agent.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="wa-topbar">
                      {/* Back button — visible only on mobile */}
                      <button onClick={() => setMobileShowChat(false)}
                        style={{ background: 'none', border: 'none', color: '#4dd4ac', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', display: 'none' }}
                        className="wa-back-btn">←</button>
                      <div className="wa-topbar-ava">{getAgentName(selectedConv).charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="wa-topbar-name">{getAgentName(selectedConv)}</div>
                        <div className="wa-topbar-status">Online</div>
                        <div className="wa-topbar-sub">Verified Marketplace Agent</div>
                      </div>
                    </div>

                    <div className="wa-msgs">
                      {msgLoading ? (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', paddingTop: '60px' }}>Loading…</div>
                      ) : messagesWithDateChips.length === 0 ? (
                        <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '14px' }}>👋</div>
                          <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: '6px' }}>Welcome to Support</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>How can we help you today?</p>
                        </div>
                      ) : messagesWithDateChips.map((item, i) => {
                        if (item.type === 'chip') return (
                          <div key={`chip-${i}`} className="wa-datechip"><span>{item.label}</span></div>
                        );
                        const { msg } = item;
                        const isMe = !msg.is_agent;
                        return (
                          <div key={msg.id || i} className={`wa-msg ${isMe ? 'sent' : 'received'}`}>
                            <div className="wa-msg-inner">
                              {!isMe && <div className="wa-sender-label">{getAgentName(selectedConv)}</div>}
                              <div className="wa-bubble">
                                <p style={{ fontSize: '0.875rem', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                <div className="wa-foot">
                                  <span className="wa-time">{formatTime(msg.created_at)}</span>
                                  {isMe && <span className="wa-tick">✓✓</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={msgsEndRef} />
                    </div>

                    <div className="wa-inputbar">
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={handleTextareaInput}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (newMessage.trim()) handleSendMessage(); } }}
                        placeholder="Type a message…"
                        rows={1}
                        className="wa-ta"
                      />
                      <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="wa-sendbtn">➤</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#4dd4ac', marginBottom: '4px' }}>Settings</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.32)' }}>Manage your account security.</div>
            </div>
            <div className="settings-card">
              <div className="settings-label">Change Password</div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const cur = fd.get('current_password'), nw = fd.get('new_password'), con = fd.get('confirm_password');
                if (nw !== con) { alert("Passwords don't match"); return; }
                if (nw.length < 6) { alert("Min 6 characters"); return; }
                const { error } = await supabase.auth.updateUser({ password: nw });
                if (error) alert(error.message); else { alert('Password updated!'); e.target.reset(); }
              }}>
                <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" name="current_password" className="form-control" placeholder="••••••••" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" name="new_password" className="form-control" placeholder="Min. 6 characters" required />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" name="confirm_password" className="form-control" placeholder="Repeat new password" required />
                  </div>
                </div>
                <button type="submit"
                  style={{ padding: '12px 24px', background: '#4dd4ac', color: '#000', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#3bc495'}
                  onMouseLeave={e => e.currentTarget.style.background = '#4dd4ac'}>
                  🔒 Update Password
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
