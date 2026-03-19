import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

// ── Agent list ──
const AGENTS = [
  { name: 'Agent Sarah K.',  avatar: '👩‍💼', type: 'private',  online: false },
  { name: 'Agent James M.',  avatar: '👨‍💼', type: 'business', online: true  },
  { name: 'Agent Amara T.',  avatar: '👩‍🔬', type: 'private',  online: false },
  { name: 'Agent Leo B.',    avatar: '🧑‍💻', type: 'business', online: true  },
  { name: 'Agent Nina R.',   avatar: '👩‍🎨', type: 'private',  online: false },
];

export default function AdminDashboard({ user, setView }) {
  const [tab,   setTab]   = useState('pending');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pending,   setPending]   = useState([]);
  const [listings,  setListings]  = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [convs,     setConvs]     = useState([]);
  const [msgs,      setMsgs]      = useState([]);
  const [selConv,   setSelConv]   = useState(null);
  const [selConvIdx,setSelConvIdx]= useState(0);
  const [replyText, setReplyText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [stats,     setStats]     = useState({ pending:0, listings:0, bookings:0, messages:0 });

  const [diag,      setDiag]      = useState([]);
  const [showDiag,  setShowDiag]  = useState(false);

  const [editOpen,  setEditOpen]  = useState(false);
  const [editProd,  setEditProd]  = useState(null);
  const [editF,     setEditF]     = useState({});
  const [eImg0,     setEImg0]     = useState(null);
  const [eImg1,     setEImg1]     = useState(null);
  const [eImg2,     setEImg2]     = useState(null);
  const [editBusy,  setEditBusy]  = useState(false);
  const [editExistingImgs, setEditExistingImgs] = useState([]);

  const [nProd,  setNProd]  = useState({ title:'', price:'', category:'Furniture', condition:'Like New', description:'', location:'', business_name:'' });
  const [nImg0,  setNImg0]  = useState(null);
  const [nImg1,  setNImg1]  = useState(null);
  const [nImg2,  setNImg2]  = useState(null);
  // preview URLs for new listing images
  const [nPrev0, setNPrev0] = useState(null);
  const [nPrev1, setNPrev1] = useState(null);
  const [nPrev2, setNPrev2] = useState(null);
  // preview URLs for edit images
  const [ePrev0, setEPrev0] = useState(null);
  const [ePrev1, setEPrev1] = useState(null);
  const [ePrev2, setEPrev2] = useState(null);

  const [addBusy,setAddBusy]= useState(false);
  const [addMsg, setAddMsg] = useState({ type:'', text:'' });

  const [actionBusy, setActionBusy] = useState({});

  const msgsEnd = useRef(null);
  const agentPickerRef = useRef(null);
  const textareaRef = useRef(null);
  const pollMsgsRef = useRef(null);
  const shouldScrollRef = useRef(false);

  // preview URLs for new listing images
  const [nPrev0, setNPrev0] = useState(null);
  const [nPrev1, setNPrev1] = useState(null);
  const [nPrev2, setNPrev2] = useState(null);
  // preview URLs for edit images
  const [ePrev0, setEPrev0] = useState(null);
  const [ePrev1, setEPrev1] = useState(null);
  const [ePrev2, setEPrev2] = useState(null);

  const CATS  = ['Furniture','Electronics','Appliances','For Kids','Decor','Kitchenware','Household'];
  const CONDS = ['Brand New','Like New','Excellent','Good','Fair','For Parts'];
  const STATUSES = ['active', 'sold', 'pending', 'out_of_stock'];

  const IS = { background:'#0e1117', border:'2px solid #1e2a3a', color:'#fff', width:'100%', padding:'10px 14px', borderRadius:'8px', outline:'none', fontFamily:'inherit', fontSize:'0.875rem', boxSizing:'border-box' };

  // ── Load ──
  useEffect(() => {
    if (user) { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }
  }, [user]);

  // ── Auto-scroll only when flagged ──
  useEffect(() => {
    if (shouldScrollRef.current) {
      msgsEnd.current?.scrollIntoView({ behavior:'smooth' });
      shouldScrollRef.current = false;
    }
  }, [msgs]);

  // ── Poll messages for selected conv ──
  useEffect(() => {
    if (pollMsgsRef.current) clearInterval(pollMsgsRef.current);
    if (selConv) {
      pollMsgsRef.current = setInterval(() => loadMsgs(selConv, true), 5000);
    }
    return () => { if (pollMsgsRef.current) clearInterval(pollMsgsRef.current); };
  }, [selConv]);

  // ── Agent picker outside click ──
  useEffect(() => {
    const handleClick = (e) => {
      if (agentPickerRef.current && !agentPickerRef.current.contains(e.target)) {
        setShowAgentPicker(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ── Close sidebar on tab change (mobile) ──
  const handleTabChange = (id) => {
    setTab(id);
    setSidebarOpen(false);
    // When switching to messages, reset mobile chat view
    if (id !== 'messages') setMobileShowChat(false);
  };

  // ── Helpers ──
  const attachImages = async (products) => {
    if (!products || products.length === 0) return products;
    const ids = products.map(p => p.id);
    const { data: imgs } = await supabase
      .from('product_images')
      .select('product_id, image_url, is_primary, sort_order')
      .in('product_id', ids)
      .order('sort_order', { ascending: true });
    if (!imgs) return products;
    const byProd = {};
    imgs.forEach(img => {
      if (!byProd[img.product_id]) byProd[img.product_id] = [];
      byProd[img.product_id].push(img);
    });
    return products.map(p => ({ ...p, extra_imgs: byProd[p.id] || [] }));
  };

  const buildImages = (product) => {
    const defaultImage = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=900&h=600&fit=crop';
    if (product.extra_imgs && product.extra_imgs.length > 0) {
      const imgs = product.extra_imgs.map(i => i.image_url).filter(Boolean);
      if (imgs.length > 0) {
        while (imgs.length < 3) imgs.push(imgs[imgs.length - 1]);
        return imgs.slice(0, 3);
      }
    }
    const base = product.image_url || defaultImage;
    return [base, base, base];
  };

  const enrichConversations = async (cvArr) => {
    return await Promise.all(cvArr.map(async (conv) => {
      const { data: lastMsg } = await supabase
        .from('agent_messages').select('content, is_agent, created_at')
        .eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1);
      return { ...conv, lastMsg: lastMsg?.[0] || null };
    }));
  };

  const load = async () => {
    const log = [];

    const { data: pend, error: e1 } = await supabase
      .from('products').select('*').eq('status', 'pending')
      .order('created_at', { ascending: false });
    log.push({ label:'products (pending)', ok: !e1, count: pend?.length ?? 0, error: e1?.message });
    if (!e1) setPending(await attachImages(pend || []));

    const { data: lst, error: e2 } = await supabase
      .from('products').select('*').in('status', ['active','sold'])
      .order('created_at', { ascending: false });
    log.push({ label:'products (active/sold)', ok: !e2, count: lst?.length ?? 0, error: e2?.message });
    if (!e2) setListings(await attachImages(lst || []));

    const { data: bk, error: e3 } = await supabase
      .from('bookings').select('*').order('created_at', { ascending: false });
    log.push({ label:'bookings', ok: !e3, count: bk?.length ?? 0, error: e3?.message });
    if (!e3) setBookings(bk || []);

    const { data: cv, error: e4 } = await supabase
      .from('agent_conversations').select('*')
      .order('last_message_at', { ascending: false });
    log.push({ label:'agent_conversations', ok: !e4, count: cv?.length ?? 0, error: e4?.message });
    if (!e4 && cv) {
      const enriched = await enrichConversations(cv);
      setConvs(enriched);
      if (enriched.length > 0) {
        setSelConv(prev => prev ?? enriched[0]);
      }
    }

    setDiag(log);
    setStats({
      pending:  pend?.length  ?? 0,
      listings: lst?.length   ?? 0,
      bookings: bk?.length    ?? 0,
      messages: cv?.length    ?? 0,
    });
  };

  const loadMsgs = async (conv, silent = false) => {
    if (!conv) return;
    const { data, error } = await supabase
      .from('agent_messages').select('*')
      .eq('conversation_id', conv.id).order('created_at', { ascending: true });
    if (!error && data) setMsgs(data);
  };

  const selectConv = (conv, idx) => {
    setSelConv(conv);
    setSelConvIdx(idx);
    loadMsgs(conv);
    setMobileShowChat(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text) return;

    let conv = selConv;
    if (!conv) {
      if (convs.length === 0) return;
      conv = convs[0];
      setSelConv(conv);
      setSelConvIdx(0);
      await loadMsgs(conv);
    }

    const msgContent = `[${selectedAgent.name}] ${text}`;

    const { data, error } = await supabase.from('agent_messages').insert([{
      conversation_id: conv.id,
      sender_id: user.id,
      is_agent: true,
      content: msgContent,
      agent_name: selectedAgent.name,
      created_at: new Date().toISOString(),
    }]).select().single();

    if (!error && data) {
      shouldScrollRef.current = true;
      setMsgs(p => [...p, data]);
      setReplyText('');
      if (textareaRef.current) { textareaRef.current.value = ''; textareaRef.current.style.height = 'auto'; }
      await supabase.from('agent_conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', conv.id);
      load();
    } else if (error) {
      alert('Send failed: ' + error.message);
    }
  };

  const handleTextareaInput = (e) => {
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
    setReplyText(ta.value);
  };

  const notifySeller = async (sellerId, messageText) => {
    if (!sellerId) return;
    try {
      const { data: convRows } = await supabase
        .from('agent_conversations').select('id').eq('user_id', sellerId).limit(1);
      let convId;
      if (convRows && convRows.length > 0) {
        convId = convRows[0].id;
      } else {
        const { data: newConv, error: ce2 } = await supabase
          .from('agent_conversations')
          .insert([{ user_id: sellerId, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() }])
          .select().single();
        if (ce2) return;
        convId = newConv.id;
      }
      const since = new Date(Date.now() - 60000).toISOString();
      const { data: recent } = await supabase
        .from('agent_messages').select('id')
        .eq('conversation_id', convId).eq('is_agent', true)
        .eq('content', messageText).gte('created_at', since).limit(1);
      if (recent && recent.length > 0) return;
      await supabase.from('agent_messages').insert([{
        conversation_id: convId,
        sender_id: user.id,
        is_agent: true,
        content: `[${selectedAgent.name}] ${messageText}`,
        agent_name: selectedAgent.name,
        created_at: new Date().toISOString(),
      }]);
      await supabase.from('agent_conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convId);
    } catch (err) { console.error('notifySeller exception:', err.message); }
  };

  const approve = async (product) => {
    if (actionBusy[product.id]) return;
    setActionBusy(b => ({ ...b, [product.id]: 'approve' }));
    try {
      const { error: ue } = await supabase.from('products').update({ status: 'active' }).eq('id', product.id);
      if (ue) { alert('Approve failed: ' + ue.message); return; }
      await notifySeller(product.seller_id, `🎉 Great news! Your item "${product.title}" has been reviewed and is now LIVE on the marketplace.\n\nBuyers can see it right now. We will notify you as soon as someone expresses interest in purchasing it. Thank you for listing with us!`);
      load();
    } catch (err) { alert('Approve error: ' + err.message); }
    finally { setActionBusy(b => { const n = { ...b }; delete n[product.id]; return n; }); }
  };

  const reject = async (product) => {
    if (actionBusy[product.id]) return;
    if (!confirm(`Reject "${product.title}"?\n\nThis will delete the listing and send the seller a notification.`)) return;
    setActionBusy(b => ({ ...b, [product.id]: 'reject' }));
    try {
      await notifySeller(product.seller_id, `❌ Unfortunately, your item "${product.title}" could not be approved at this time.\n\nThis may be due to incomplete information, image quality, or not meeting our listing guidelines. Please review our requirements and feel free to resubmit. Reply to this message if you have any questions.`);
      const { error: de } = await supabase.from('products').delete().eq('id', product.id);
      if (de) { alert('Delete failed: ' + de.message); return; }
      load();
    } catch (err) { alert('Reject error: ' + err.message); }
    finally { setActionBusy(b => { const n = { ...b }; delete n[product.id]; return n; }); }
  };

  const deleteProd = async (id) => {
    if (!confirm('Delete this listing permanently?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) load(); else alert('Delete error: ' + error.message);
  };

  const updateBooking = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) load(); else alert('Error: ' + error.message);
  };

  const uploadImg = async (file) => {
    if (!file) return null;
    const ext  = file.name.split('.').pop();
    const path = `admin/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return null;
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const pickImg = (file, setter, prevSetter) => {
    if (!file) return;
    setter(file);
    prevSetter(URL.createObjectURL(file));
  };
  const handleMainImageChange     = (e) => pickImg(e.target.files?.[0], setNImg0, setNPrev0);
  const handleImage1Change        = (e) => pickImg(e.target.files?.[0], setNImg1, setNPrev1);
  const handleImage2Change        = (e) => pickImg(e.target.files?.[0], setNImg2, setNPrev2);
  const handleEditMainImageChange = (e) => pickImg(e.target.files?.[0], setEImg0, setEPrev0);
  const handleEditImage1Change    = (e) => pickImg(e.target.files?.[0], setEImg1, setEPrev1);
  const handleEditImage2Change    = (e) => pickImg(e.target.files?.[0], setEImg2, setEPrev2);

  const openEdit = async (p) => {
    setEditProd(p);
    setEditF({ title:p.title||'', price:p.price||'', category:p.category||'Furniture', condition:p.condition||'Like New', description:p.description||'', location:p.location||'', business_name:p.business_name||'', status:p.status||'active' });
    setEImg0(null); setEImg1(null); setEImg2(null);
    setEPrev0(null); setEPrev1(null); setEPrev2(null);
    const { data: imgs } = await supabase
      .from('product_images').select('image_url, sort_order, is_primary')
      .eq('product_id', p.id).order('sort_order', { ascending: true });
    const slots = [null, null, null];
    if (imgs && imgs.length > 0) {
      imgs.forEach(img => { if (img.sort_order < 3) slots[img.sort_order] = img.image_url; });
    }
    if (!slots[0]) slots[0] = p.image_url || null;
    setEditExistingImgs(slots);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editProd) return;
    setEditBusy(true);
    try {
      const upd = { ...editF, price: parseFloat(editF.price), updated_at: new Date().toISOString() };
      if (eImg0) { const u = await uploadImg(eImg0); if (u) { upd.image_url = u; await supabase.from('product_images').upsert([{ product_id: editProd.id, image_url: u, is_primary: true, sort_order: 0 }]); } }
      if (eImg1) { const u = await uploadImg(eImg1); if (u) await supabase.from('product_images').upsert([{ product_id: editProd.id, image_url: u, is_primary: false, sort_order: 1 }]); }
      if (eImg2) { const u = await uploadImg(eImg2); if (u) await supabase.from('product_images').upsert([{ product_id: editProd.id, image_url: u, is_primary: false, sort_order: 2 }]); }
      const { error } = await supabase.from('products').update(upd).eq('id', editProd.id);
      if (error) throw error;
      setEditOpen(false); load();
    } catch (err) { alert('Save failed: ' + err.message); }
    finally { setEditBusy(false); }
  };

  const addListing = async (e) => {
    e.preventDefault();
    if (!nImg0) { setAddMsg({ type:'err', text:'Main image is required.' }); return; }
    setAddBusy(true); setAddMsg({ type:'', text:'' });
    try {
      const { data: prod, error: pe } = await supabase.from('products').insert([{
        seller_id: user.id, ...nProd, price: parseFloat(nProd.price),
        status: 'active', created_at: new Date().toISOString(),
      }]).select().single();
      if (pe) throw pe;
      const url0 = await uploadImg(nImg0);
      if (url0) { await supabase.from('product_images').insert([{ product_id: prod.id, image_url: url0, is_primary: true, sort_order: 0 }]); await supabase.from('products').update({ image_url: url0 }).eq('id', prod.id); }
      for (const [f, ord] of [[nImg1,1],[nImg2,2]]) { if (f) { const u = await uploadImg(f); if (u) await supabase.from('product_images').insert([{ product_id: prod.id, image_url: u, is_primary: false, sort_order: ord }]); } }
      setNProd({ title:'', price:'', category:'Furniture', condition:'Like New', description:'', location:'', business_name:'' });
      setNImg0(null); setNImg1(null); setNImg2(null);
      setNPrev0(null); setNPrev1(null); setNPrev2(null);
      setAddMsg({ type:'ok', text:'Listing published successfully!' });
      load();
    } catch (err) { setAddMsg({ type:'err', text: err.message }); }
    finally { setAddBusy(false); }
  };

  // ── Formatting helpers ──
  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '';
  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts), today = new Date(), yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return formatTime(ts);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month:'short', day:'numeric' });
  };
  const getDateChip = (ts) => {
    const d = new Date(ts), today = new Date(), yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day:'2-digit', month:'short', year:'numeric' });
  };

  const messagesWithDateChips = msgs.reduce((acc, msg, i) => {
    const msgDate = new Date(msg.created_at).toDateString();
    const prevDate = i > 0 ? new Date(msgs[i-1].created_at).toDateString() : null;
    if (msgDate !== prevDate) acc.push({ type:'chip', label: getDateChip(msg.created_at) });
    acc.push({ type:'msg', msg });
    return acc;
  }, []);

  const parseAgentName = (msg) => {
    if (msg.agent_name) return msg.agent_name;
    const match = msg.content?.match(/^\[(.+?)\]/);
    return match ? match[1] : null;
  };
  const stripAgentPrefix = (content) => content?.replace(/^\[.+?\]\s*/, '') || content;

  const convDisplayName = (conv) => conv?.user_id ? `User ${conv.user_id.slice(0,8)}` : 'Unknown';

  const statusBadge = (s, map) => {
    const c = map[s] || map._default;
    return <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', background:c.bg, color:c.color }}>{c.label || s}</span>;
  };

  const statusConfig = {
    active:       { bg:'rgba(74,222,128,0.12)',  color:'#4ade80', label:'Active'       },
    sold:         { bg:'rgba(96,165,250,0.12)',  color:'#60a5fa', label:'Sold'         },
    pending:      { bg:'rgba(251,191,36,0.12)',  color:'#fbbf24', label:'Pending'      },
    out_of_stock: { bg:'rgba(249,115,22,0.12)',  color:'#fb923c', label:'Out of Stock' },
    _default:     { bg:'#1e2a3a',               color:'#aaa'                           },
  };

  const menuItems = [
    { id:'pending',  icon:'⏳', label:'Pending',    count: stats.pending  },
    { id:'listings', icon:'📦', label:'Listings',   count: stats.listings },
    { id:'add',      icon:'➕', label:'Add Listing', count: 0             },
    { id:'bookings', icon:'📅', label:'Bookings',   count: stats.bookings },
    { id:'messages', icon:'💬', label:'Messages',   count: stats.messages },
  ];

  // ── Sub-components ──
  const ThumbStrip = ({ product }) => {
    const [sel, setSel] = useState(0);
    const images = buildImages(product);
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'6px', alignItems:'center', flexShrink:0 }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'8px', overflow:'hidden', background:'#0e1117', border:'2px solid #1e2a3a', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {images[sel] ? <img src={images[sel]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'1.4rem' }}>📦</span>}
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          {images.map((img, idx) => (
            <button key={idx} onClick={() => setSel(idx)}
              style={{ width:'22px', height:'22px', borderRadius:'4px', overflow:'hidden', padding:0, border:`1.5px solid ${sel===idx?'#4dd4ac':'#1e2a3a'}`, cursor:'pointer', background:'#0e1117', flexShrink:0, opacity:sel===idx?1:0.5, transition:'all 0.15s' }}>
              <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── ImagePicker: native file input + live preview thumbnail ──
  const ImagePicker = ({ label, onChange, preview, required=false }) => (
    <div>
      <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'6px' }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </p>
      {preview && (
        <div style={{ width:'100%', aspectRatio:'16/9', borderRadius:'8px', overflow:'hidden', marginBottom:'8px', border:'2px solid #4dd4ac', background:'#0e1117' }}>
          <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        required={required && !preview}
        onChange={onChange}
        style={{ width:'100%', padding:'10px', background:'#0e1117', border:`1px solid ${preview ? '#4dd4ac' : '#1e2a3a'}`, borderRadius:'8px', color:'#fff', cursor:'pointer', colorScheme:'dark', fontFamily:'inherit', fontSize:'0.82rem', boxSizing:'border-box' }}
      />
    </div>
  );

  return (
    <>
      {/* ══ STYLES ══ */}
      <style>{`
        .adm-sb::-webkit-scrollbar{width:4px}.adm-sb::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:4px}
        .adm-in::placeholder{color:rgba(255,255,255,0.22)}.adm-in option{background:#111}
        .adm-nav:hover{background:rgba(77,212,172,0.1)!important}
        .agent-option:hover{background:rgba(77,212,172,0.1)!important}

        /* ── WhatsApp chat styles ── */
        .wa-shell { display:flex; height:calc(100vh - 260px); min-height:520px; border-radius:14px; overflow:hidden; border:2px solid #1e2a3a; box-shadow:0 16px 50px rgba(0,0,0,0.5); }
        .wa-left { width:280px; flex-shrink:0; background:#0e1117; border-right:2px solid #1e2a3a; display:flex; flex-direction:column; }
        .wa-left-top { padding:14px 18px; background:#131920; border-bottom:1px solid #1e2a3a; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
        .wa-contact-list { flex:1; overflow-y:auto; }
        .wa-contact { display:flex; align-items:center; gap:11px; padding:12px 16px; cursor:pointer; border-bottom:1px solid #1a2030; transition:background 0.15s; border-left:3px solid transparent; }
        .wa-contact:hover { background:rgba(77,212,172,0.07); }
        .wa-contact.active { background:rgba(77,212,172,0.14); border-left-color:#4dd4ac; }
        .wa-ava { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#4dd4ac,#2a9d7c); display:flex; align-items:center; justify-content:center; color:#000; font-weight:700; font-size:0.9rem; flex-shrink:0; position:relative; }
        .wa-dot { width:9px; height:9px; background:#4dd4ac; border-radius:50%; border:2px solid #111; position:absolute; bottom:1px; right:1px; box-shadow:0 0 5px rgba(77,212,172,0.7); }
        .wa-ci { flex:1; min-width:0; }
        .wa-cname { font-size:0.84rem; font-weight:600; color:#fff; }
        .wa-cprev { font-size:0.72rem; color:rgba(255,255,255,0.35); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
        .wa-ctime { font-size:0.65rem; color:rgba(255,255,255,0.28); white-space:nowrap; }

        .wa-right { flex:1; display:flex; flex-direction:column; background:#0a1018; background-image:radial-gradient(circle at 1px 1px,rgba(77,212,172,0.02) 1px,transparent 0); background-size:28px 28px; min-width:0; }
        .wa-topbar { padding:12px 18px; background:#131920; border-bottom:1px solid #1e2a3a; display:flex; align-items:center; gap:12px; flex-shrink:0; }
        .wa-topbar-ava { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#4dd4ac,#2a9d7c); display:flex; align-items:center; justify-content:center; color:#000; font-weight:700; font-size:0.88rem; flex-shrink:0; }
        .wa-topbar-status { font-size:0.7rem; color:#4dd4ac; display:flex; align-items:center; gap:5px; }
        .wa-topbar-status::before { content:''; width:6px; height:6px; background:#4dd4ac; border-radius:50%; display:inline-block; box-shadow:0 0 5px rgba(77,212,172,0.6); }

        .wa-msgs { flex:1; overflow-y:auto; padding:18px 22px; display:flex; flex-direction:column; gap:3px; }
        .wa-msgs::-webkit-scrollbar { width:4px; }
        .wa-msgs::-webkit-scrollbar-thumb { background:#1e2a3a; border-radius:4px; }
        .wa-datechip { text-align:center; margin:10px 0; }
        .wa-datechip span { background:#1a2520; color:rgba(255,255,255,0.4); font-size:0.68rem; padding:4px 13px; border-radius:9px; display:inline-block; border:1px solid rgba(77,212,172,0.1); }
        .wa-msg { display:flex; margin-bottom:1px; }
        .wa-msg.sent { justify-content:flex-start; }
        .wa-msg.received { justify-content:flex-end; }
        .wa-msg-inner { display:flex; flex-direction:column; max-width:72%; }
        .wa-msg.sent .wa-msg-inner { align-items:flex-start; }
        .wa-msg.received .wa-msg-inner { align-items:flex-end; }
        .wa-sender-label { font-size:0.66rem; font-weight:700; color:#4dd4ac; margin-bottom:3px; padding-left:2px; }
        .wa-bubble { width:100%; padding:8px 12px 6px; border-radius:10px; word-wrap:break-word; line-height:1.55; font-size:0.85rem; box-shadow:0 1px 2px rgba(0,0,0,0.35); animation:waPop 0.18s ease; }
        @keyframes waPop { from{opacity:0;transform:scale(0.95) translateY(5px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .wa-msg.sent .wa-bubble { background:#1d4b39; color:#e0f5ef; border-top-left-radius:2px; }
        .wa-msg.received .wa-bubble { background:#1e2b27; color:#e0f5ef; border-top-right-radius:2px; }
        .wa-foot { display:flex; align-items:center; justify-content:flex-end; gap:4px; margin-top:3px; }
        .wa-time { font-size:0.6rem; color:rgba(255,255,255,0.36); }
        .wa-tick { color:#4dd4ac; font-size:0.65rem; }

        /* Agent picker & input bar */
        .wa-inputbar { padding:12px 16px; background:#131920; border-top:2px solid #1e2a3a; display:flex; flex-direction:column; gap:8px; flex-shrink:0; }
        .wa-ta { flex:1; background:#1a2230; border:1px solid #1e2a3a; border-radius:22px; color:#fff; font-family:inherit; font-size:0.85rem; padding:10px 16px; resize:none; min-height:40px; max-height:110px; overflow-y:hidden; line-height:1.5; transition:border-color 0.2s; }
        .wa-ta:focus { outline:none; border-color:#4dd4ac; }
        .wa-ta::placeholder { color:rgba(255,255,255,0.28); }
        .wa-sendbtn { width:40px; height:40px; border-radius:50%; background:#4dd4ac; color:#000; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; transition:all 0.2s; box-shadow:0 2px 8px rgba(77,212,172,0.3); }
        .wa-sendbtn:hover { background:#3bc495; transform:scale(1.08); }
        .wa-sendbtn:disabled { background:#1e2a3a; cursor:default; transform:none; box-shadow:none; }
        .wa-back-btn { display:none; background:none; border:none; color:#4dd4ac; cursor:pointer; font-size:1.2rem; padding:0 4px; }

        /* ── Mobile sidebar drawer ── */
        .mob-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:19998; }
        .mob-overlay.open { display:block; }
        .mob-drawer { position:fixed; left:0; top:0; bottom:0; width:260px; background:#090d14; z-index:19999; transform:translateX(-100%); transition:transform 0.28s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; border-right:2px solid #1e2a3a; overflow-y:auto; }
        .mob-drawer.open { transform:translateX(0); }

        /* ── Mobile top header (hamburger + title) ── */
        .mob-header { display:none; position:sticky; top:0; z-index:200; background:#0d1520; border-bottom:2px solid #1e2a3a; padding:0 16px; height:52px; align-items:center; justify-content:space-between; flex-shrink:0; }

        /* ── Desktop sidebar ── */
        .admin-sidebar-desktop { width:252px; min-width:252px; border-right:2px solid #1e2a3a; display:flex; flex-direction:column; overflow-y:auto; }

        @media (max-width: 768px) {
          .admin-dashboard { flex-direction:column !important; }
          .admin-sidebar-desktop { display:none !important; }
          .mob-header { display:flex !important; }
          .admin-main { padding:16px !important; }

          /* Messages: stack on mobile */
          .wa-shell { flex-direction:column; height:calc(100vh - 175px); min-height:0; border-radius:10px; }
          .wa-left { width:100%; flex:none; height:220px; border-right:none; border-bottom:2px solid #1e2a3a; }
          .wa-left.hidden { display:none; }
          .wa-right.hidden { display:none; }
          .wa-right { flex:1; min-height:0; }
          .wa-msg-inner { max-width:85%; }
          .wa-back-btn { display:block !important; }

          .product-card { flex-direction:column !important; gap:12px !important; }
          .product-actions { width:100% !important; flex-direction:row !important; justify-content:flex-end !important; }
          .image-grid { grid-template-columns:1fr !important; }
          .form-grid { grid-template-columns:1fr !important; }
          .edit-modal { width:95% !important; padding:16px !important; }
        }

        @media (max-width: 480px) {
          .admin-main { padding:12px !important; }
          .product-actions { flex-wrap:wrap !important; }
        }
      `}</style>

      <div className="admin-dashboard" style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', background:'#090d14', color:'#fff', fontFamily:"'Poppins',-apple-system,sans-serif", overflow:'hidden' }}>

        {/* ══ MOBILE OVERLAY + DRAWER ══ */}
        <div className={`mob-overlay${sidebarOpen?' open':''}`} onClick={() => setSidebarOpen(false)} />
        <div className={`mob-drawer adm-sb${sidebarOpen?' open':''}`}>
          <div style={{ padding:'16px 18px 14px', borderBottom:'2px solid #1e2a3a', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:'linear-gradient(135deg,#4dd4ac,#1e7a5e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>⚙</div>
              <span style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:'#4dd4ac' }}>Admin Panel</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}
              style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'1.4rem', lineHeight:1, padding:'0' }}>×</button>
          </div>
          <div style={{ padding:'12px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginBottom:'4px' }}>
              {[
                { v:stats.pending,  l:'Pending',  c:'#fbbf24', bg:'rgba(251,191,36,0.08)'  },
                { v:stats.listings, l:'Active',   c:'#4dd4ac', bg:'rgba(77,212,172,0.08)'  },
                { v:stats.bookings, l:'Bookings', c:'#60a5fa', bg:'rgba(96,165,250,0.08)'  },
                { v:stats.messages, l:'Chats',    c:'#c084fc', bg:'rgba(192,132,252,0.08)' },
              ].map(s=>(
                <div key={s.l} style={{ padding:'8px 5px', borderRadius:'8px', textAlign:'center', background:s.bg, border:`1px solid ${s.c}22` }}>
                  <div style={{ fontSize:'1.3rem', fontWeight:'800', color:s.c, lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <nav style={{ padding:'8px', flex:1 }}>
            {menuItems.map(item=>(
              <button key={item.id} onClick={() => handleTabChange(item.id)} className="adm-nav"
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 13px', marginBottom:'3px', borderRadius:'9px', background:tab===item.id?'#4dd4ac':'transparent', color:tab===item.id?'#000':'#4dd4ac', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'0.85rem', fontWeight:tab===item.id?'700':'500', transition:'all 0.15s' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'9px' }}><span>{item.icon}</span>{item.label}</span>
                {item.count > 0 && <span style={{ padding:'2px 7px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', background:tab===item.id?'rgba(0,0,0,0.2)':'rgba(77,212,172,0.15)', color:tab===item.id?'#000':'#4dd4ac' }}>{item.count}</span>}
              </button>
            ))}
          </nav>
          <div style={{ padding:'10px 12px', borderTop:'2px solid #1e2a3a' }}>
            <button onClick={() => { setShowDiag(p=>!p); setSidebarOpen(false); }}
              style={{ width:'100%', padding:'7px 12px', background:'rgba(96,165,250,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#60a5fa', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:'600', marginBottom:'6px' }}>
              🔍 {showDiag?'Hide':'Show'} Diagnostics
            </button>
            <button onClick={() => { load(); setSidebarOpen(false); }}
              style={{ width:'100%', padding:'7px 12px', background:'rgba(77,212,172,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#4dd4ac', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:'600', marginBottom:'6px' }}>
              ↻ Refresh Now
            </button>
            <button onClick={()=>setView('home')}
              style={{ width:'100%', padding:'9px 12px', background:'transparent', border:'2px solid #1e2a3a', borderRadius:'9px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.82rem', fontWeight:'600' }}>
              ← Back to Store
            </button>
          </div>
        </div>

        {/* ══ DESKTOP SIDEBAR ══ */}
        <aside className="admin-sidebar-desktop adm-sb">
          <div style={{ padding:'24px 20px 18px', borderBottom:'2px solid #1e2a3a' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'3px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'7px', background:'linear-gradient(135deg,#4dd4ac,#1e7a5e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>⚙</div>
              <span style={{ fontFamily:'Georgia,serif', fontSize:'1.15rem', fontWeight:'700', color:'#4dd4ac' }}>Admin Panel</span>
            </div>
            <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', marginLeft:'40px' }}>Store Management</p>
          </div>
          <div style={{ padding:'14px', borderBottom:'2px solid #1e2a3a' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {[
                { v:stats.pending,  l:'Pending',  c:'#fbbf24', bg:'rgba(251,191,36,0.08)'  },
                { v:stats.listings, l:'Active',   c:'#4dd4ac', bg:'rgba(77,212,172,0.08)'  },
                { v:stats.bookings, l:'Bookings', c:'#60a5fa', bg:'rgba(96,165,250,0.08)'  },
                { v:stats.messages, l:'Chats',    c:'#c084fc', bg:'rgba(192,132,252,0.08)' },
              ].map(s=>(
                <div key={s.l} style={{ padding:'10px 6px', borderRadius:'8px', textAlign:'center', background:s.bg, border:`1px solid ${s.c}22` }}>
                  <div style={{ fontSize:'1.5rem', fontWeight:'800', color:s.c, lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', marginTop:'3px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <nav style={{ padding:'10px', flex:1 }}>
            {menuItems.map(item=>(
              <button key={item.id} onClick={()=>setTab(item.id)} className="adm-nav"
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 13px', marginBottom:'3px', borderRadius:'9px', background:tab===item.id?'#4dd4ac':'transparent', color:tab===item.id?'#000':'#4dd4ac', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'0.85rem', fontWeight:tab===item.id?'700':'500', transition:'all 0.15s' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'9px' }}><span>{item.icon}</span>{item.label}</span>
                {item.count > 0 && <span style={{ padding:'2px 7px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', background:tab===item.id?'rgba(0,0,0,0.2)':'rgba(77,212,172,0.15)', color:tab===item.id?'#000':'#4dd4ac' }}>{item.count}</span>}
              </button>
            ))}
          </nav>
          <div style={{ padding:'12px 14px', borderTop:'2px solid #1e2a3a' }}>
            <button onClick={()=>setShowDiag(p=>!p)}
              style={{ width:'100%', padding:'7px 12px', background:'rgba(96,165,250,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#60a5fa', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:'600', marginBottom:'8px' }}>
              🔍 {showDiag?'Hide':'Show'} DB Diagnostics
            </button>
            <button onClick={load}
              style={{ width:'100%', padding:'7px 12px', background:'rgba(77,212,172,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#4dd4ac', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:'600', marginBottom:'8px' }}>
              ↻ Refresh Now
            </button>
            <button onClick={()=>setView('home')}
              style={{ width:'100%', padding:'9px 12px', background:'transparent', border:'2px solid #1e2a3a', borderRadius:'9px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.82rem', fontWeight:'600', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#4dd4ac';e.currentTarget.style.color='#4dd4ac';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e2a3a';e.currentTarget.style.color='rgba(255,255,255,0.4)';}}>
              ← Back to Store
            </button>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* ── Mobile top header ── */}
          <div className="mob-header">
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', flexDirection:'column', gap:'4px' }}>
                <span style={{ width:'20px', height:'2px', background:'#4dd4ac', borderRadius:'1px', display:'block' }}/>
                <span style={{ width:'14px', height:'2px', background:'#4dd4ac', borderRadius:'1px', display:'block' }}/>
                <span style={{ width:'20px', height:'2px', background:'#4dd4ac', borderRadius:'1px', display:'block' }}/>
              </button>
              <span style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'700', color:'#4dd4ac' }}>
                {menuItems.find(m=>m.id===tab)?.icon} {menuItems.find(m=>m.id===tab)?.label}
              </span>
            </div>
            <button onClick={()=>setView('home')}
              style={{ background:'transparent', border:'1px solid #1e2a3a', borderRadius:'7px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.74rem', padding:'5px 10px', fontWeight:'600' }}>
              ← Store
            </button>
          </div>

          <main className="admin-main adm-sb" style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>
            <div style={{ maxWidth:'1080px', margin:'0 auto' }}>

              {/* Diagnostics */}
              {showDiag && (
                <div style={{ marginBottom:'24px', background:'#0a1018', border:'2px solid #1e3a5f', borderRadius:'10px', padding:'16px' }}>
                  <p style={{ fontWeight:'700', color:'#60a5fa', marginBottom:'12px', fontSize:'0.85rem' }}>🔍 Database Query Results</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {diag.length===0
                      ? <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem' }}>No data yet — click Refresh Now</p>
                      : diag.map((d,i)=>(
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'8px 12px', borderRadius:'6px', background:d.ok?'rgba(77,212,172,0.06)':'rgba(239,68,68,0.1)' }}>
                          <span>{d.ok?'✅':'❌'}</span>
                          <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.82rem', flex:1 }}>{d.label}</span>
                          <span style={{ color:d.ok?'#4dd4ac':'#fca5a5', fontSize:'0.82rem', fontWeight:'700' }}>{d.ok?`${d.count} rows`:`ERROR: ${d.error}`}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* ════ PENDING ════ */}
              {tab==='pending' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.7rem', color:'#4dd4ac', marginBottom:'6px' }}>Pending Submissions</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Review products submitted by sellers — approve to publish or reject to remove</p>
                  {pending.length===0
                    ? <Empty icon="✅" title="All caught up!" sub="No pending submissions right now." />
                    : pending.map(p=>(
                      <Card key={p.id} color="#fbbf24">
                        <div className="product-card" style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                          <ThumbStrip product={p} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                              <h3 style={{ fontWeight:'700', color:'#4dd4ac', margin:0, fontSize:'1rem' }}>{p.title}</h3>
                              <span style={{ background:'rgba(251,191,36,0.12)', color:'#fbbf24', padding:'3px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', flexShrink:0, marginLeft:'10px' }}>PENDING</span>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px', fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', marginBottom:'8px' }}>
                              <span><b style={{ color:'rgba(255,255,255,0.7)' }}>Price:</b> ${p.price}</span>
                              <span><b style={{ color:'rgba(255,255,255,0.7)' }}>Category:</b> {p.category}</span>
                              <span><b style={{ color:'rgba(255,255,255,0.7)' }}>Condition:</b> {p.condition}</span>
                              <span><b style={{ color:'rgba(255,255,255,0.7)' }}>Location:</b> {p.location}</span>
                              <span style={{ gridColumn:'1/-1' }}><b style={{ color:'rgba(255,255,255,0.7)' }}>Business:</b> {p.business_name||'—'}</span>
                            </div>
                            <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.3)', margin:0, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.description}</p>
                          </div>
                          <div className="product-actions" style={{ display:'flex', flexDirection:'column', gap:'7px', flexShrink:0 }}>
                            <Btn color="#16a34a" hover="#15803d" disabled={!!actionBusy[p.id]} onClick={()=>approve(p)}>
                              {actionBusy[p.id]==='approve'?'⏳ Approving…':'✓ Approve'}
                            </Btn>
                            <Btn color="#dc2626" hover="#b91c1c" disabled={!!actionBusy[p.id]} onClick={()=>reject(p)}>
                              {actionBusy[p.id]==='reject'?'⏳ Rejecting…':'✗ Reject'}
                            </Btn>
                            <Btn color="#60a5fa" hover="#3b82f6" onClick={()=>openEdit(p)}>✎ Edit</Btn>
                          </div>
                        </div>
                      </Card>
                    ))
                  }
                </div>
              )}

              {/* ════ LISTINGS ════ */}
              {tab==='listings' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.7rem', color:'#4dd4ac', marginBottom:'6px' }}>All Listings</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Active and sold products — edit or delete any listing</p>
                  {listings.length===0
                    ? <Empty icon="📦" title="No listings yet" sub="Add one using the Add Listing tab." />
                    : listings.map(p=>(
                      <Card key={p.id}>
                        <div className="product-card" style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                          <ThumbStrip product={p} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <h3 style={{ fontWeight:'700', color:'#4dd4ac', margin:'0 0 4px', fontSize:'0.95rem' }}>{p.title}</h3>
                            <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', margin:'0 0 2px' }}>{p.category} · {p.condition} · <span style={{ color:'#4dd4ac', fontWeight:'700' }}>${p.price}</span></p>
                            <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', margin:0 }}>{p.location} · {p.business_name}</p>
                          </div>
                          <div className="product-actions" style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            {statusBadge(p.status, statusConfig)}
                            <OutlineBtn color="#60a5fa" onClick={()=>openEdit(p)}>✎ Edit</OutlineBtn>
                            <OutlineBtn color="#ff6b6b" onClick={()=>deleteProd(p.id)}>✕ Delete</OutlineBtn>
                          </div>
                        </div>
                      </Card>
                    ))
                  }
                </div>
              )}

              {/* ════ ADD LISTING ════ */}
              {tab==='add' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.7rem', color:'#4dd4ac', marginBottom:'6px' }}>Add New Listing</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Admin-created listings go live immediately — no approval required</p>
                  {addMsg.text && (
                    <div style={{ padding:'12px 16px', marginBottom:'16px', borderRadius:'8px', background:addMsg.type==='ok'?'rgba(77,212,172,0.08)':'rgba(239,68,68,0.08)', borderLeft:`4px solid ${addMsg.type==='ok'?'#4dd4ac':'#ef4444'}`, color:addMsg.type==='ok'?'#4dd4ac':'#fca5a5', fontSize:'0.85rem' }}>
                      {addMsg.type==='ok'?'✅ ':'❌ '}{addMsg.text}
                    </div>
                  )}
                  <form onSubmit={addListing} style={{ background:'#151c27', border:'2px solid #1e2a3a', borderRadius:'12px', padding:'24px' }}>
                    <div className="form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                      {[['Title *','title','text','Product title',true],['Price ($) *','price','number','0.00',true],['Business Name','business_name','text','Store name'],['Location','location','text','City, State']].map(([l,k,t,ph,req])=>(
                        <div key={k}>
                          <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'6px' }}>{l}</label>
                          <input type={t} placeholder={ph} required={req} value={nProd[k]} onChange={e=>setNProd(p=>({...p,[k]:e.target.value}))} className="adm-in" style={IS} />
                        </div>
                      ))}
                      <div>
                        <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'6px' }}>Category</label>
                        <select value={nProd.category} onChange={e=>setNProd(p=>({...p,category:e.target.value}))} className="adm-in" style={IS}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'6px' }}>Condition</label>
                        <select value={nProd.condition} onChange={e=>setNProd(p=>({...p,condition:e.target.value}))} className="adm-in" style={IS}>{CONDS.map(c=><option key={c}>{c}</option>)}</select>
                      </div>
                    </div>
                    <div style={{ marginBottom:'14px' }}>
                      <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'6px' }}>Description *</label>
                      <textarea required rows={3} value={nProd.description} onChange={e=>setNProd(p=>({...p,description:e.target.value}))} className="adm-in" style={{ ...IS, resize:'vertical' }} />
                    </div>
                    <div style={{ border:'2px dashed #1e2a3a', borderRadius:'10px', padding:'16px', background:'#0e1117', marginBottom:'16px' }}>
                      <p style={{ fontSize:'0.82rem', fontWeight:'600', color:'rgba(255,255,255,0.45)', marginBottom:'12px' }}>📷 Product Images</p>
                      <div className="image-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                        <ImagePicker label="Main Image"    onChange={handleMainImageChange}  preview={nPrev0} required />
                        <ImagePicker label="Detail Image 1" onChange={handleImage1Change}    preview={nPrev1} />
                        <ImagePicker label="Detail Image 2" onChange={handleImage2Change}    preview={nPrev2} />
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button type="submit" disabled={addBusy} style={{ padding:'11px 32px', background:addBusy?'#2a6e5a':'#4dd4ac', color:'#000', border:'none', borderRadius:'8px', cursor:addBusy?'not-allowed':'pointer', fontWeight:'700', fontFamily:'inherit', fontSize:'0.9rem' }}>
                        {addBusy?'⏳ Publishing…':'🚀 Publish Listing'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ════ BOOKINGS ════ */}
              {tab==='bookings' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.7rem', color:'#4dd4ac', marginBottom:'6px' }}>Bookings</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Agent booking requests submitted via the Book An Agent form</p>
                  {bookings.length===0
                    ? <Empty icon="📅" title="No bookings yet" sub="Bookings from the Book An Agent form will appear here." />
                    : bookings.map(b=>(
                      <Card key={b.id} color={b.status==='pending'?'#fbbf24':b.status==='confirmed'?'#4dd4ac':'#60a5fa'}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                              <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'linear-gradient(135deg,#4dd4ac22,#1e2a3a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>👤</div>
                              <div>
                                <p style={{ fontWeight:'700', color:'#fff', margin:0, fontSize:'0.95rem' }}>{b.name}</p>
                                <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)', margin:0 }}>{b.email} · {b.phone}</p>
                              </div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 20px', fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', marginBottom:'8px' }}>
                              <span><b style={{ color:'rgba(255,255,255,0.65)' }}>Service:</b> {b.service==='paid'?'Paid ($10)':'Free (Remote)'}</span>
                              <span><b style={{ color:'rgba(255,255,255,0.65)' }}>Submitted:</b> {new Date(b.created_at).toLocaleDateString()}</span>
                              <span style={{ gridColumn:'1/-1' }}><b style={{ color:'rgba(255,255,255,0.65)' }}>Categories:</b> {Array.isArray(b.categories)?b.categories.join(', '):b.categories}</span>
                            </div>
                            {b.additional_info && <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.35)', margin:0, fontStyle:'italic' }}>"{b.additional_info}"</p>}
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:'7px', flexShrink:0, alignItems:'flex-end' }}>
                            {statusBadge(b.status||'pending', {
                              pending:   { bg:'rgba(251,191,36,0.12)',  color:'#fbbf24', label:'Pending'   },
                              confirmed: { bg:'rgba(77,212,172,0.12)',  color:'#4dd4ac', label:'Confirmed' },
                              completed: { bg:'rgba(96,165,250,0.12)',  color:'#60a5fa', label:'Completed' },
                              cancelled: { bg:'rgba(239,68,68,0.12)',   color:'#f87171', label:'Cancelled' },
                              _default:  { bg:'#1e2a3a',               color:'#aaa'                       },
                            })}
                            {(!b.status||b.status==='pending') && (
                              <div style={{ display:'flex', gap:'6px', marginTop:'4px' }}>
                                <Btn color="#16a34a" hover="#15803d" onClick={()=>updateBooking(b.id,'confirmed')}>✓ Confirm</Btn>
                                <Btn color="#dc2626" hover="#b91c1c" onClick={()=>updateBooking(b.id,'cancelled')}>✗ Cancel</Btn>
                              </div>
                            )}
                            {b.status==='confirmed' && (
                              <Btn color="#60a5fa" hover="#3b82f6" onClick={()=>updateBooking(b.id,'completed')}>✔ Mark Done</Btn>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  }
                </div>
              )}

              {/* ════ MESSAGES — WhatsApp style ════ */}
              {tab==='messages' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.7rem', color:'#4dd4ac', marginBottom:'6px' }}>Messages</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Conversations from the seller/buyer support chat — reply as any agent</p>

                  <div className="wa-shell">
                    {/* ── Conversation list ── */}
                    <div className={`wa-left${mobileShowChat?' hidden':''}`}>
                      <div className="wa-left-top">
                        <div>
                          <p style={{ fontWeight:'700', fontSize:'0.88rem', color:'#fff', margin:0 }}>💬 Conversations</p>
                          <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', margin:'2px 0 0' }}>Support &amp; seller chats</p>
                        </div>
                        <span style={{ background:'rgba(77,212,172,0.12)', color:'#4dd4ac', borderRadius:'20px', padding:'2px 8px', fontSize:'10px', fontWeight:'700' }}>{convs.length}</span>
                      </div>
                      <div className="wa-contact-list adm-sb">
                        {convs.length===0
                          ? <p style={{ padding:'20px', textAlign:'center', fontSize:'0.8rem', color:'rgba(255,255,255,0.3)' }}>No conversations yet</p>
                          : convs.map((c,idx)=>(
                            <div key={c.id} className={`wa-contact${selConv?.id===c.id?' active':''}`} onClick={()=>selectConv(c,idx)}>
                              <div className="wa-ava">
                                {convDisplayName(c).charAt(0).toUpperCase()}
                                <span className="wa-dot" />
                              </div>
                              <div className="wa-ci">
                                <div className="wa-cname">{convDisplayName(c)}</div>
                                <div className="wa-cprev">
                                  {c.lastMsg
                                    ? (c.lastMsg.is_agent ? '🤝 ' : 'User: ') + stripAgentPrefix(c.lastMsg.content)
                                    : 'No messages yet'}
                                </div>
                              </div>
                              <div className="wa-ctime">{formatDate(c.last_message_at)}</div>
                            </div>
                          ))
                        }
                      </div>
                    </div>

                    {/* ── Chat panel ── */}
                    <div className={`wa-right${!mobileShowChat&&convs.length>0?' hidden':''}`}>
                      {selConv ? (
                        <>
                          {/* Topbar */}
                          <div className="wa-topbar">
                            <button className="wa-back-btn" onClick={()=>setMobileShowChat(false)}>←</button>
                            <div className="wa-topbar-ava">{convDisplayName(selConv).charAt(0).toUpperCase()}</div>
                            <div>
                              <p style={{ fontWeight:'700', fontSize:'0.88rem', color:'#fff', margin:'0 0 1px' }}>{convDisplayName(selConv)}</p>
                              <p className="wa-topbar-status" style={{ margin:0 }}>Online</p>
                            </div>
                          </div>

                          {/* Messages */}
                          <div className="wa-msgs adm-sb">
                            {messagesWithDateChips.length===0
                              ? (
                                <div style={{ textAlign:'center', paddingTop:'60px' }}>
                                  <div style={{ fontSize:'2.5rem', marginBottom:'14px' }}>👋</div>
                                  <p style={{ color:'rgba(255,255,255,0.55)', fontWeight:'600', marginBottom:'6px' }}>No messages yet</p>
                                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.82rem' }}>Start the conversation below</p>
                                </div>
                              )
                              : messagesWithDateChips.map((item,i) => {
                                if (item.type==='chip') return (
                                  <div key={`chip-${i}`} className="wa-datechip"><span>{item.label}</span></div>
                                );
                                const { msg } = item;
                                // Admin messages: sent (left-aligned green), user messages: received (right-aligned darker)
                                const isAdmin = msg.is_agent;
                                const agentLabel = isAdmin ? parseAgentName(msg) : null;
                                const displayContent = isAdmin ? stripAgentPrefix(msg.content) : msg.content;
                                return (
                                  <div key={msg.id||i} className={`wa-msg ${isAdmin?'sent':'received'}`}>
                                    <div className="wa-msg-inner">
                                      {isAdmin && agentLabel && (
                                        <div className="wa-sender-label">
                                          {AGENTS.find(a=>a.name===agentLabel)?.avatar||'🤝'} {agentLabel}
                                        </div>
                                      )}
                                      {!isAdmin && (
                                        <div style={{ fontSize:'0.66rem', fontWeight:'700', color:'#94a3b8', marginBottom:'3px', paddingRight:'2px', textAlign:'right' }}>User</div>
                                      )}
                                      <div className="wa-bubble">
                                        <p style={{ fontSize:'0.875rem', lineHeight:'1.5', margin:0, whiteSpace:'pre-wrap' }}>{displayContent}</p>
                                        <div className="wa-foot">
                                          <span className="wa-time">{formatTime(msg.created_at)}</span>
                                          {isAdmin && <span className="wa-tick">✓✓</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            }
                            <div ref={msgsEnd} />
                          </div>

                          {/* Input bar with agent picker */}
                          <div className="wa-inputbar">
                            {/* Agent picker row */}
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              <span style={{ fontSize:'0.7rem', fontWeight:'600', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>As:</span>
                              <div ref={agentPickerRef} style={{ position:'relative', flex:1 }}>
                                <button
                                  onClick={e=>{ e.stopPropagation(); setShowAgentPicker(p=>!p); }}
                                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'8px', padding:'6px 11px', background:'#1a2230', border:`1.5px solid ${showAgentPicker?'#4dd4ac':'#1e2a3a'}`, borderRadius:'8px', cursor:'pointer', transition:'border-color 0.2s', fontFamily:'inherit' }}>
                                  <span style={{ fontSize:'0.95rem' }}>{selectedAgent.avatar}</span>
                                  <span style={{ flex:1, textAlign:'left', fontSize:'0.8rem', fontWeight:'600', color:'#4dd4ac' }}>{selectedAgent.name}</span>
                                  <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.06)', padding:'2px 6px', borderRadius:'10px' }}>{selectedAgent.type}</span>
                                  <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:selectedAgent.online?'#22c55e':'#475569', flexShrink:0 }} />
                                  <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.75rem' }}>{showAgentPicker?'▲':'▼'}</span>
                                </button>
                                {showAgentPicker && (
                                  <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, right:0, background:'#151c27', border:'2px solid #1e2a3a', borderRadius:'10px', overflow:'hidden', zIndex:9999, boxShadow:'0 -8px 24px rgba(0,0,0,0.5)' }}>
                                    <div style={{ padding:'7px 12px', borderBottom:'1px solid #1e2a3a', fontSize:'0.7rem', fontWeight:'700', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Choose Agent</div>
                                    {AGENTS.map(agent=>(
                                      <button key={agent.name} className="agent-option"
                                        onClick={e=>{ e.stopPropagation(); setSelectedAgent(agent); setShowAgentPicker(false); }}
                                        style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:selectedAgent.name===agent.name?'rgba(77,212,172,0.12)':'transparent', border:'none', borderBottom:'1px solid #1e2a3a', cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' }}>
                                        <span style={{ fontSize:'1.05rem' }}>{agent.avatar}</span>
                                        <div style={{ flex:1, textAlign:'left' }}>
                                          <div style={{ fontSize:'0.81rem', fontWeight:'600', color:selectedAgent.name===agent.name?'#4dd4ac':'#fff' }}>{agent.name}</div>
                                          <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.3)', marginTop:'1px', textTransform:'capitalize' }}>{agent.type} account</div>
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                                          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:agent.online?'#22c55e':'#475569' }} />
                                          <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.28)' }}>{agent.online?'Online':'Offline'}</span>
                                        </div>
                                        {selectedAgent.name===agent.name && <span style={{ color:'#4dd4ac', fontSize:'0.8rem' }}>✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Text + send */}
                            <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
                              <textarea
                                ref={textareaRef}
                                value={replyText}
                                onChange={handleTextareaInput}
                                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(replyText.trim()) sendReply(); } }}
                                placeholder={`Message as ${selectedAgent.name}…`}
                                rows={1}
                                className="wa-ta"
                              />
                              <button onClick={sendReply} disabled={!replyText.trim()} className="wa-sendbtn">➤</button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'rgba(255,255,255,0.18)', gap:'10px' }}>
                          <p style={{ fontSize:'2.5rem' }}>💬</p>
                          <p style={{ fontSize:'0.85rem' }}>Select a conversation to reply</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* ════ EDIT MODAL ════ */}
      {editOpen && editProd && (
        <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div className="edit-modal adm-sb" style={{ width:'100%', maxWidth:'660px', background:'#151c27', border:'2px solid #1e2a3a', borderRadius:'14px', padding:'26px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
              <div>
                <h3 style={{ fontFamily:'Georgia,serif', fontSize:'1.3rem', color:'#4dd4ac', margin:0 }}>Edit Listing</h3>
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', margin:'3px 0 0' }}>ID: {editProd.id.slice(0,8)}</p>
              </div>
              <button onClick={()=>setEditOpen(false)} style={{ fontSize:'1.6rem', color:'rgba(255,255,255,0.3)', background:'none', border:'none', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <div className="form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'13px', marginBottom:'13px' }}>
              {[['Title','title','text'],['Price ($)','price','number'],['Business Name','business_name','text'],['Location','location','text']].map(([l,k,t])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'5px' }}>{l}</label>
                  <input type={t} value={editF[k]||''} onChange={e=>setEditF(p=>({...p,[k]:e.target.value}))} className="adm-in" style={IS} />
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'5px' }}>Category</label>
                <select value={editF.category||'Furniture'} onChange={e=>setEditF(p=>({...p,category:e.target.value}))} className="adm-in" style={IS}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'5px' }}>Condition</label>
                <select value={editF.condition||'Like New'} onChange={e=>setEditF(p=>({...p,condition:e.target.value}))} className="adm-in" style={IS}>{CONDS.map(c=><option key={c}>{c}</option>)}</select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'5px' }}>Listing Status</label>
                <div style={{ position:'relative' }}>
                  <select value={editF.status||'active'} onChange={e=>setEditF(p=>({...p,status:e.target.value}))} className="adm-in" style={{ ...IS, paddingLeft:'40px', appearance:'none', WebkitAppearance:'none' }}>
                    {STATUSES.map(s=>(
                      <option key={s} value={s}>
                        {s==='active'?'Active — visible to buyers':s==='sold'?'Sold — marked as sold':s==='pending'?'Pending — awaiting review':'Out of Stock — temporarily unavailable'}
                      </option>
                    ))}
                  </select>
                  <div style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', width:'10px', height:'10px', borderRadius:'50%', pointerEvents:'none', background:editF.status==='active'?'#4ade80':editF.status==='sold'?'#60a5fa':editF.status==='pending'?'#fbbf24':editF.status==='out_of_stock'?'#fb923c':'#aaa' }} />
                  <div style={{ position:'absolute', right:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'rgba(255,255,255,0.3)', fontSize:'0.8rem' }}>▼</div>
                </div>
                <div style={{ marginTop:'8px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)' }}>Preview badge:</span>
                  {statusBadge(editF.status||'active', statusConfig)}
                </div>
              </div>
            </div>
            <div style={{ marginBottom:'13px' }}>
              <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', marginBottom:'5px' }}>Description</label>
              <textarea rows={3} value={editF.description||''} onChange={e=>setEditF(p=>({...p,description:e.target.value}))} className="adm-in" style={{ ...IS, resize:'vertical' }} />
            </div>
            <div style={{ border:'2px dashed #1e2a3a', borderRadius:'8px', padding:'14px', background:'#0e1117', marginBottom:'16px' }}>
              <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.4)', marginBottom:'10px' }}>📷 Current Images</p>
              <div className="image-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'14px' }}>
                {[0,1,2].map(slot=>(
                  <div key={slot} style={{ display:'flex', flexDirection:'column', gap:'6px', alignItems:'center' }}>
                    <div style={{ width:'100%', aspectRatio:'1', borderRadius:'8px', overflow:'hidden', background:'#1e2a3a', border:'1.5px solid #1e2a3a', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {editExistingImgs[slot]
                        ? <img src={editExistingImgs[slot]} alt={`Image ${slot+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ color:'rgba(255,255,255,0.15)', fontSize:'1.6rem' }}>📷</span>}
                    </div>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
                      {slot===0?'Main':`Detail ${slot}`}{editExistingImgs[slot]?'':' — empty'}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:'0.75rem', fontWeight:'600', color:'rgba(255,255,255,0.35)', marginBottom:'10px' }}>Replace Images (leave blank to keep existing)</p>
              <div className="image-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                <ImagePicker label="New Main Image" onChange={handleEditMainImageChange} preview={ePrev0} />
                <ImagePicker label="New Detail 1"   onChange={handleEditImage1Change}    preview={ePrev1} />
                <ImagePicker label="New Detail 2"   onChange={handleEditImage2Change}    preview={ePrev2} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <OutlineBtn color="rgba(255,255,255,0.3)" onClick={()=>setEditOpen(false)}>Cancel</OutlineBtn>
              <button onClick={saveEdit} disabled={editBusy} style={{ padding:'10px 26px', background:editBusy?'#2a6e5a':'#4dd4ac', color:'#000', border:'none', borderRadius:'8px', cursor:editBusy?'not-allowed':'pointer', fontWeight:'700', fontFamily:'inherit' }}>
                {editBusy?'⏳ Saving…':'💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Shared sub-components ──
function Card({ children, color='#1e2a3a' }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:'#151c27', border:`2px solid ${hov?color:'#1e2a3a'}`, borderRadius:'12px', padding:'16px 18px', marginBottom:'10px', transition:'border-color 0.2s' }}>
      {children}
    </div>
  );
}
function Btn({ children, color, hover, onClick, disabled=false }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={disabled?undefined:onClick}
      onMouseEnter={()=>{ if(!disabled) setHov(true); }}
      onMouseLeave={()=>setHov(false)}
      style={{ padding:'8px 16px', background:disabled?'#1e2a3a':hov?hover:color, color:disabled?'rgba(255,255,255,0.25)':'#fff', border:'none', borderRadius:'7px', cursor:disabled?'not-allowed':'pointer', fontWeight:'600', fontSize:'0.8rem', fontFamily:'inherit', transition:'background 0.15s', whiteSpace:'nowrap', opacity:disabled?0.6:1 }}>
      {children}
    </button>
  );
}
function OutlineBtn({ children, color, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:'7px 14px', background:hov?color:'transparent', border:`1.5px solid ${color}`, color:hov?(color==='#ff6b6b'?'#fff':'#000'):color, borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'0.8rem', fontFamily:'inherit', transition:'all 0.15s', whiteSpace:'nowrap' }}>
      {children}
    </button>
  );
}
function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign:'center', padding:'56px 20px', border:'2px dashed #1e2a3a', borderRadius:'12px', background:'#151c27' }}>
      <div style={{ fontSize:'2.8rem', marginBottom:'10px' }}>{icon}</div>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'1rem', fontWeight:'600', marginBottom:'4px' }}>{title}</p>
      <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.82rem' }}>{sub}</p>
    </div>
  );
}
