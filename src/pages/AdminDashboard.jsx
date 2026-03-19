import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

const AGENTS = [
  { name: 'Agent Sarah K.',  avatar: '👩‍💼', type: 'private',  online: false },
  { name: 'Agent James M.',  avatar: '👨‍💼', type: 'business', online: true  },
  { name: 'Agent Amara T.',  avatar: '👩‍🔬', type: 'private',  online: false },
  { name: 'Agent Leo B.',    avatar: '🧑‍💻', type: 'business', online: true  },
  { name: 'Agent Nina R.',   avatar: '👩‍🎨', type: 'private',  online: false },
];

export default function AdminDashboard({ user, setView }) {
  const [tab, setTab] = useState('pending');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pending, setPending] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [convs, setConvs] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [selConv, setSelConv] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [stats, setStats] = useState({ pending: 0, listings: 0, bookings: 0, messages: 0 });
  const [showConvList, setShowConvList] = useState(true);
  const [diag, setDiag] = useState([]);
  const [showDiag, setShowDiag] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [editF, setEditF] = useState({});
  const [eImg0, setEImg0] = useState(null);
  const [eImg1, setEImg1] = useState(null);
  const [eImg2, setEImg2] = useState(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editExistingImgs, setEditExistingImgs] = useState([]);
  const [nProd, setNProd] = useState({ title: '', price: '', category: 'Furniture', condition: 'Like New', description: '', location: '', business_name: '' });
  const [nImg0, setNImg0] = useState(null);
  const [nImg1, setNImg1] = useState(null);
  const [nImg2, setNImg2] = useState(null);
  const [addBusy, setAddBusy] = useState(false);
  const [addMsg, setAddMsg] = useState({ type: '', text: '' });
  const [actionBusy, setActionBusy] = useState({});

  const msgsEnd = useRef(null);
  const agentPickerRef = useRef(null);

  const CATS = ['Furniture', 'Electronics', 'Appliances', 'For Kids', 'Decor', 'Kitchenware', 'Household'];
  const CONDS = ['Brand New', 'Like New', 'Excellent', 'Good', 'Fair', 'For Parts'];
  const STATUSES = ['active', 'sold', 'pending', 'out_of_stock'];

  const IS = {
    background: '#0e1117', border: '2px solid #1e2a3a', color: '#fff',
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    outline: 'none', fontFamily: 'inherit', fontSize: '0.875rem', boxSizing: 'border-box',
  };

  useEffect(() => {
    if (user) { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }
  }, [user]);

  useEffect(() => { msgsEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => {
    const handleClick = (e) => {
      if (agentPickerRef.current && !agentPickerRef.current.contains(e.target)) setShowAgentPicker(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!selConv) return;
    const iv = setInterval(async () => {
      const { data, error } = await supabase.from('agent_messages').select('*')
        .eq('conversation_id', selConv.id).order('created_at', { ascending: true });
      if (!error && data) setMsgs(data);
    }, 5000);
    return () => clearInterval(iv);
  }, [selConv?.id]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const attachImages = async (products) => {
    if (!products || products.length === 0) return products;
    const ids = products.map(p => p.id);
    const { data: imgs } = await supabase.from('product_images')
      .select('product_id, image_url, is_primary, sort_order')
      .in('product_id', ids).order('sort_order', { ascending: true });
    if (!imgs) return products;
    const byProd = {};
    imgs.forEach(img => { if (!byProd[img.product_id]) byProd[img.product_id] = []; byProd[img.product_id].push(img); });
    return products.map(p => ({ ...p, extra_imgs: byProd[p.id] || [] }));
  };

  const buildImages = (product) => {
    const def = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=900&h=600&fit=crop';
    if (product.extra_imgs?.length > 0) {
      const imgs = product.extra_imgs.map(i => i.image_url).filter(Boolean);
      if (imgs.length > 0) { while (imgs.length < 3) imgs.push(imgs[imgs.length - 1]); return imgs.slice(0, 3); }
    }
    const base = product.image_url || def;
    return [base, base, base];
  };

  const load = async () => {
    const log = [];
    const { data: pend, error: e1 } = await supabase.from('products').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    log.push({ label: 'products (pending)', ok: !e1, count: pend?.length ?? 0, error: e1?.message });
    if (!e1) setPending(await attachImages(pend || []));

    const { data: lst, error: e2 } = await supabase.from('products').select('*').in('status', ['active', 'sold']).order('created_at', { ascending: false });
    log.push({ label: 'products (active/sold)', ok: !e2, count: lst?.length ?? 0, error: e2?.message });
    if (!e2) setListings(await attachImages(lst || []));

    const { data: bk, error: e3 } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    log.push({ label: 'bookings', ok: !e3, count: bk?.length ?? 0, error: e3?.message });
    if (!e3) setBookings(bk || []);

    const { data: cv, error: e4 } = await supabase.from('agent_conversations').select('*').order('last_message_at', { ascending: false });
    log.push({ label: 'agent_conversations', ok: !e4, count: cv?.length ?? 0, error: e4?.message });
    if (!e4) { setConvs(cv || []); if (cv?.length > 0) setSelConv(prev => prev ?? cv[0]); }

    setDiag(log);
    setStats({ pending: pend?.length ?? 0, listings: lst?.length ?? 0, bookings: bk?.length ?? 0, messages: cv?.length ?? 0 });
  };

  const loadMsgs = async (conv) => {
    setSelConv(conv);
    setShowConvList(false);
    const { data, error } = await supabase.from('agent_messages').select('*')
      .eq('conversation_id', conv.id).order('created_at', { ascending: true });
    if (!error && data) setMsgs(data);
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    let conv = selConv;
    if (!conv) { if (!convs.length) return; conv = convs[0]; setSelConv(conv); }
    const { data, error } = await supabase.from('agent_messages').insert([{
      conversation_id: conv.id, sender_id: user.id, is_agent: true,
      content: `[${selectedAgent.name}] ${text}`, agent_name: selectedAgent.name,
      created_at: new Date().toISOString(),
    }]).select().single();
    if (!error && data) {
      setMsgs(p => [...p, data]); setReplyText('');
      await supabase.from('agent_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conv.id);
      load();
    } else if (error) alert('Send failed: ' + error.message);
  };

  const notifySeller = async (sellerId, messageText) => {
    if (!sellerId) return;
    try {
      const { data: convRows } = await supabase.from('agent_conversations').select('id').eq('user_id', sellerId).limit(1);
      let convId;
      if (convRows?.length > 0) { convId = convRows[0].id; } else {
        const { data: nc, error: ce } = await supabase.from('agent_conversations')
          .insert([{ user_id: sellerId, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() }]).select().single();
        if (ce) return; convId = nc.id;
      }
      const since = new Date(Date.now() - 60000).toISOString();
      const { data: recent } = await supabase.from('agent_messages').select('id')
        .eq('conversation_id', convId).eq('is_agent', true).eq('content', messageText).gte('created_at', since).limit(1);
      if (recent?.length > 0) return;
      await supabase.from('agent_messages').insert([{
        conversation_id: convId, sender_id: user.id, is_agent: true,
        content: `[${selectedAgent.name}] ${messageText}`, agent_name: selectedAgent.name,
        created_at: new Date().toISOString(),
      }]);
      await supabase.from('agent_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convId);
    } catch (err) { console.error('notifySeller:', err.message); }
  };

  const approve = async (product) => {
    if (actionBusy[product.id]) return;
    setActionBusy(b => ({ ...b, [product.id]: 'approve' }));
    try {
      const { error } = await supabase.from('products').update({ status: 'active' }).eq('id', product.id);
      if (error) { alert('Approve failed: ' + error.message); return; }
      await notifySeller(product.seller_id, `🎉 Your item "${product.title}" is now LIVE on the marketplace!`);
      load();
    } catch (err) { alert(err.message); }
    finally { setActionBusy(b => { const n = { ...b }; delete n[product.id]; return n; }); }
  };

  const reject = async (product) => {
    if (actionBusy[product.id]) return;
    if (!confirm(`Reject "${product.title}"?`)) return;
    setActionBusy(b => ({ ...b, [product.id]: 'reject' }));
    try {
      await notifySeller(product.seller_id, `❌ Your item "${product.title}" could not be approved. Please review our guidelines and resubmit.`);
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) { alert('Delete failed: ' + error.message); return; }
      load();
    } catch (err) { alert(err.message); }
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
    const ext = file.name.split('.').pop();
    const path = `admin/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { console.error('img upload:', error.message); return null; }
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const openEdit = async (p) => {
    setEditProd(p);
    setEditF({ title: p.title || '', price: p.price || '', category: p.category || 'Furniture', condition: p.condition || 'Like New', description: p.description || '', location: p.location || '', business_name: p.business_name || '', status: p.status || 'active' });
    setEImg0(null); setEImg1(null); setEImg2(null);
    const { data: imgs } = await supabase.from('product_images').select('image_url, sort_order').eq('product_id', p.id).order('sort_order', { ascending: true });
    const slots = [null, null, null];
    if (imgs?.length > 0) imgs.forEach(img => { if (img.sort_order < 3) slots[img.sort_order] = img.image_url; });
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
    if (!nImg0) { setAddMsg({ type: 'err', text: 'Main image is required.' }); return; }
    setAddBusy(true); setAddMsg({ type: '', text: '' });
    try {
      const { data: prod, error: pe } = await supabase.from('products').insert([{
        seller_id: user.id, ...nProd, price: parseFloat(nProd.price), status: 'active', created_at: new Date().toISOString(),
      }]).select().single();
      if (pe) throw pe;
      const url0 = await uploadImg(nImg0);
      if (url0) { await supabase.from('product_images').insert([{ product_id: prod.id, image_url: url0, is_primary: true, sort_order: 0 }]); await supabase.from('products').update({ image_url: url0 }).eq('id', prod.id); }
      for (const [f, ord] of [[nImg1, 1], [nImg2, 2]]) { if (f) { const u = await uploadImg(f); if (u) await supabase.from('product_images').insert([{ product_id: prod.id, image_url: u, is_primary: false, sort_order: ord }]); } }
      setNProd({ title: '', price: '', category: 'Furniture', condition: 'Like New', description: '', location: '', business_name: '' });
      setNImg0(null); setNImg1(null); setNImg2(null);
      document.querySelectorAll('.adm-file-in').forEach(el => { el.value = ''; });
      setAddMsg({ type: 'ok', text: 'Listing published successfully!' }); load();
    } catch (err) { setAddMsg({ type: 'err', text: err.message }); }
    finally { setAddBusy(false); }
  };

  const statusBadge = (s, map) => {
    const c = map[s] || map._default;
    return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{c.label || s}</span>;
  };

  const parseAgentName = (msg) => { if (msg.agent_name) return msg.agent_name; const m = msg.content?.match(/^\[(.+?)\]/); return m ? m[1] : null; };
  const stripAgentPrefix = (content) => content?.replace(/^\[.+?\]\s*/, '') || content;

  const statusConfig = {
    active:       { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80', label: 'Active'       },
    sold:         { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', label: 'Sold'         },
    pending:      { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: 'Pending'      },
    out_of_stock: { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c', label: 'Out of Stock' },
    _default:     { bg: '#1e2a3a',               color: '#aaa'                           },
  };

  const menuItems = [
    { id: 'pending',  icon: '⏳', label: 'Pending',     count: stats.pending  },
    { id: 'listings', icon: '📦', label: 'Listings',    count: stats.listings },
    { id: 'add',      icon: '➕', label: 'Add Listing', count: 0              },
    { id: 'bookings', icon: '📅', label: 'Bookings',    count: stats.bookings },
    { id: 'messages', icon: '💬', label: 'Messages',    count: stats.messages },
  ];

  const handleTabChange = (id) => { setTab(id); setSidebarOpen(false); if (id === 'messages') setShowConvList(true); };

  const ThumbStrip = ({ product }) => {
    const [sel, setSel] = useState(0);
    const images = buildImages(product);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', background: '#0e1117', border: '2px solid #1e2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {images[sel] ? <img src={images[sel]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>📦</span>}
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {images.map((img, idx) => (
            <button key={idx} onClick={() => setSel(idx)} style={{ width: '17px', height: '17px', borderRadius: '3px', overflow: 'hidden', padding: 0, border: `1.5px solid ${sel === idx ? '#4dd4ac' : '#1e2a3a'}`, cursor: 'pointer', background: '#0e1117', flexShrink: 0, opacity: sel === idx ? 1 : 0.5 }}>
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // FileField is defined outside this component (see bottom of file) to prevent remount/state-reset on parent re-render

  // Sidebar inner content — shared between desktop and mobile drawer
  const NavContent = () => (
    <>
      <div style={{ padding: '20px 16px 14px', borderBottom: '2px solid #1e2a3a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg,#4dd4ac,#1e7a5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>⚙</div>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '1.05rem', fontWeight: '700', color: '#4dd4ac' }}>Admin Panel</span>
        </div>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: '4px 0 0 38px' }}>Store Management</p>
      </div>
      <div style={{ padding: '12px', borderBottom: '2px solid #1e2a3a' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
          {[{ v: stats.pending, l: 'Pending', c: '#fbbf24', bg: 'rgba(251,191,36,0.08)' }, { v: stats.listings, l: 'Active', c: '#4dd4ac', bg: 'rgba(77,212,172,0.08)' }, { v: stats.bookings, l: 'Bookings', c: '#60a5fa', bg: 'rgba(96,165,250,0.08)' }, { v: stats.messages, l: 'Chats', c: '#c084fc', bg: 'rgba(192,132,252,0.08)' }].map(s => (
            <div key={s.l} style={{ padding: '8px 4px', borderRadius: '8px', textAlign: 'center', background: s.bg, border: `1px solid ${s.c}22` }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <nav style={{ padding: '10px', flex: 1 }}>
        {menuItems.map(item => (
          <button key={item.id} onClick={() => handleTabChange(item.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', marginBottom: '3px', borderRadius: '9px', background: tab === item.id ? '#4dd4ac' : 'transparent', color: tab === item.id ? '#000' : '#4dd4ac', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: tab === item.id ? '700' : '500', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (tab !== item.id) e.currentTarget.style.background = 'rgba(77,212,172,0.1)'; }}
            onMouseLeave={e => { if (tab !== item.id) e.currentTarget.style.background = 'transparent'; }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><span>{item.icon}</span>{item.label}</span>
            {item.count > 0 && <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: tab === item.id ? 'rgba(0,0,0,0.2)' : 'rgba(77,212,172,0.15)', color: tab === item.id ? '#000' : '#4dd4ac' }}>{item.count}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding: '12px 14px', borderTop: '2px solid #1e2a3a' }}>
        <button onClick={() => setShowDiag(p => !p)} style={{ width: '100%', padding: '7px 12px', background: 'rgba(96,165,250,0.08)', border: '1px solid #1e2a3a', borderRadius: '8px', color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: '600', marginBottom: '8px' }}>
          🔍 {showDiag ? 'Hide' : 'Show'} Diagnostics
        </button>
        <button onClick={load} style={{ width: '100%', padding: '7px 12px', background: 'rgba(77,212,172,0.08)', border: '1px solid #1e2a3a', borderRadius: '8px', color: '#4dd4ac', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: '600', marginBottom: '8px' }}>
          ↻ Refresh Now
        </button>
        <button onClick={() => setView('home')} style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '2px solid #1e2a3a', borderRadius: '9px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4dd4ac'; e.currentTarget.style.color = '#4dd4ac'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2a3a'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
          ← Back to Store
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .adm-sb::-webkit-scrollbar { width: 4px; }
        .adm-sb::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 4px; }
        .adm-in::placeholder { color: rgba(255,255,255,0.22); }
        .adm-in option { background: #111; }

        /* Root wrapper — normal document flow, full viewport height */
        .adm-root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
          background: #090d14;
          color: #fff;
          font-family: 'Poppins', -apple-system, sans-serif;
        }

        /* Body row: sidebar + main */
        .adm-body-row {
          display: flex;
          flex: 1;
          min-height: 0;
        }

        /* Desktop sidebar — sticky column */
        .adm-sidebar-desk {
          width: 232px;
          min-width: 232px;
          flex-shrink: 0;
          border-right: 2px solid #1e2a3a;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background: #090d14;
          position: sticky;
          top: 0;
          max-height: 100vh;
        }

        /* Main scrollable area */
        .adm-main-area {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          padding: 28px 32px;
        }

        /* Mobile topbar — hidden on desktop */
        .adm-mob-topbar { display: none; }

        /* Mobile sidebar drawer */
        .adm-mob-drawer {
          display: none;
          position: fixed;
          top: 0; left: 0;
          width: 260px;
          height: 100%;
          background: #090d14;
          border-right: 2px solid #1e2a3a;
          z-index: 9999;
          flex-direction: column;
          overflow-y: auto;
          transform: translateX(-100%);
          transition: transform 0.26s ease;
        }
        .adm-mob-drawer.open { transform: translateX(0); }

        /* Overlay behind mobile drawer */
        .adm-mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 9998;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .adm-mob-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 11px 14px;
            background: #090d14;
            border-bottom: 2px solid #1e2a3a;
            position: sticky;
            top: 0;
            z-index: 100;
            flex-shrink: 0;
          }
          .adm-sidebar-desk { display: none; }
          .adm-mob-drawer { display: flex; }
          .adm-mob-overlay { display: block; }
          .adm-main-area { padding: 14px 12px; }

          /* Cards */
          .r-card-row   { flex-direction: column !important; }
          .r-card-acts  { flex-direction: row !important; flex-wrap: wrap !important; }
          .r-lst-acts   { width: 100% !important; flex-wrap: wrap !important; justify-content: flex-start !important; }
          .r-book-row   { flex-direction: column !important; }

          /* Forms */
          .r-form-2col  { grid-template-columns: 1fr !important; }
          .r-img-3col   { grid-template-columns: 1fr !important; }
          .r-edit-2col  { grid-template-columns: 1fr !important; }
          .r-edit-imgs  { grid-template-columns: 1fr 1fr !important; }

          /* Messages */
          .r-msg-grid   { grid-template-columns: 1fr !important; height: auto !important; }
          .r-conv-panel { height: 220px !important; }
          .r-chat-panel { height: 460px !important; }
          .r-conv-hide  { display: none !important; }
          .r-chat-hide  { display: none !important; }
        }
      `}</style>

      <div className="adm-root">

        {/* ── Mobile topbar ── */}
        <div className="adm-mob-topbar">
          <button onClick={() => setSidebarOpen(p => !p)}
            style={{ background: '#1e2a3a', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#4dd4ac', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1rem' }}>☰</span> Menu
          </button>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '0.95rem', fontWeight: '700', color: '#4dd4ac' }}>⚙ Admin</span>
          {stats.pending > 0
            ? <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderRadius: '20px', padding: '3px 8px', fontSize: '11px', fontWeight: '700' }}>{stats.pending} pending</span>
            : <span style={{ width: '60px' }} />}
        </div>

        {/* ── Mobile overlay + drawer ── */}
        {sidebarOpen && <div className="adm-mob-overlay" onClick={() => setSidebarOpen(false)} />}
        <div className={`adm-mob-drawer adm-sb${sidebarOpen ? ' open' : ''}`}>
          <NavContent />
        </div>

        {/* ── Body row ── */}
        <div className="adm-body-row">

          {/* Desktop sidebar */}
          <aside className="adm-sidebar-desk adm-sb">
            <NavContent />
          </aside>

          {/* Main */}
          <main className="adm-main-area adm-sb">
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

              {showDiag && (
                <div style={{ marginBottom: '20px', background: '#0a1018', border: '2px solid #1e3a5f', borderRadius: '10px', padding: '14px' }}>
                  <p style={{ fontWeight: '700', color: '#60a5fa', marginBottom: '10px', fontSize: '0.85rem' }}>🔍 DB Diagnostics</p>
                  {diag.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '6px', marginBottom: '4px', background: d.ok ? 'rgba(77,212,172,0.06)' : 'rgba(239,68,68,0.1)', flexWrap: 'wrap' }}>
                      <span>{d.ok ? '✅' : '❌'}</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', flex: 1, minWidth: '100px' }}>{d.label}</span>
                      <span style={{ color: d.ok ? '#4dd4ac' : '#fca5a5', fontSize: '0.8rem', fontWeight: '700' }}>{d.ok ? `${d.count} rows` : 'ERROR'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ════ PENDING ════ */}
              {tab === 'pending' && (
                <div>
                  <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.15rem,5vw,1.7rem)', color: '#4dd4ac', marginBottom: '6px' }}>Pending Submissions</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem', marginBottom: '18px' }}>Approve to publish or reject to remove</p>
                  {pending.length === 0 ? <Empty icon="✅" title="All caught up!" sub="No pending submissions." /> : pending.map(p => (
                    <Card key={p.id} color="#fbbf24">
                      <div className="r-card-row" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <ThumbStrip product={p} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px', gap: '6px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontWeight: '700', color: '#4dd4ac', margin: 0, fontSize: '0.92rem', wordBreak: 'break-word', flex: 1 }}>{p.title}</h3>
                            <span style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>PENDING</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>
                            <span><b style={{ color: 'rgba(255,255,255,0.65)' }}>Price:</b> ${p.price}</span>
                            <span><b style={{ color: 'rgba(255,255,255,0.65)' }}>Cat:</b> {p.category}</span>
                            <span><b style={{ color: 'rgba(255,255,255,0.65)' }}>Cond:</b> {p.condition}</span>
                            <span><b style={{ color: 'rgba(255,255,255,0.65)' }}>Loc:</b> {p.location || '—'}</span>
                          </div>
                          <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.3)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.description}</p>
                        </div>
                        <div className="r-card-acts" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                          <Btn color="#16a34a" hover="#15803d" disabled={!!actionBusy[p.id]} onClick={() => approve(p)}>{actionBusy[p.id] === 'approve' ? '⏳' : '✓ Approve'}</Btn>
                          <Btn color="#dc2626" hover="#b91c1c" disabled={!!actionBusy[p.id]} onClick={() => reject(p)}>{actionBusy[p.id] === 'reject' ? '⏳' : '✗ Reject'}</Btn>
                          <Btn color="#60a5fa" hover="#3b82f6" onClick={() => openEdit(p)}>✎ Edit</Btn>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* ════ LISTINGS ════ */}
              {tab === 'listings' && (
                <div>
                  <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.15rem,5vw,1.7rem)', color: '#4dd4ac', marginBottom: '6px' }}>All Listings</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem', marginBottom: '18px' }}>Active and sold products</p>
                  {listings.length === 0 ? <Empty icon="📦" title="No listings yet" sub="Add one via Add Listing." /> : listings.map(p => (
                    <Card key={p.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <ThumbStrip product={p} />
                        <div style={{ flex: 1, minWidth: '110px' }}>
                          <h3 style={{ fontWeight: '700', color: '#4dd4ac', margin: '0 0 3px', fontSize: '0.88rem', wordBreak: 'break-word' }}>{p.title}</h3>
                          <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 2px' }}>{p.category} · <span style={{ color: '#4dd4ac', fontWeight: '700' }}>${p.price}</span></p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>{p.location}</p>
                        </div>
                        <div className="r-lst-acts" style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                          {statusBadge(p.status, statusConfig)}
                          <OutlineBtn color="#60a5fa" onClick={() => openEdit(p)}>✎ Edit</OutlineBtn>
                          <OutlineBtn color="#ff6b6b" onClick={() => deleteProd(p.id)}>✕ Delete</OutlineBtn>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* ════ ADD LISTING ════ */}
              {tab === 'add' && (
                <div>
                  <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.15rem,5vw,1.7rem)', color: '#4dd4ac', marginBottom: '6px' }}>Add New Listing</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem', marginBottom: '18px' }}>Admin listings go live immediately</p>
                  {addMsg.text && (
                    <div style={{ padding: '11px 14px', marginBottom: '14px', borderRadius: '8px', background: addMsg.type === 'ok' ? 'rgba(77,212,172,0.08)' : 'rgba(239,68,68,0.08)', borderLeft: `4px solid ${addMsg.type === 'ok' ? '#4dd4ac' : '#ef4444'}`, color: addMsg.type === 'ok' ? '#4dd4ac' : '#fca5a5', fontSize: '0.85rem' }}>
                      {addMsg.type === 'ok' ? '✅ ' : '❌ '}{addMsg.text}
                    </div>
                  )}
                  <form onSubmit={addListing} style={{ background: '#151c27', border: '2px solid #1e2a3a', borderRadius: '12px', padding: '18px' }}>
                    <div className="r-form-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      {[['Title *', 'title', 'text', 'Product title', true], ['Price ($) *', 'price', 'number', '0.00', true], ['Business Name', 'business_name', 'text', 'Store name'], ['Location', 'location', 'text', 'City, State']].map(([l, k, t, ph, req]) => (
                        <div key={k}>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>{l}</label>
                          <input type={t} placeholder={ph} required={req} value={nProd[k]} onChange={e => setNProd(p => ({ ...p, [k]: e.target.value }))} className="adm-in" style={IS} />
                        </div>
                      ))}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>Category</label>
                        <select value={nProd.category} onChange={e => setNProd(p => ({ ...p, category: e.target.value }))} className="adm-in" style={IS}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>Condition</label>
                        <select value={nProd.condition} onChange={e => setNProd(p => ({ ...p, condition: e.target.value }))} className="adm-in" style={IS}>{CONDS.map(c => <option key={c}>{c}</option>)}</select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>Description *</label>
                      <textarea required rows={3} value={nProd.description} onChange={e => setNProd(p => ({ ...p, description: e.target.value }))} className="adm-in" style={{ ...IS, resize: 'vertical' }} />
                    </div>
                    <div style={{ border: '2px dashed #1e2a3a', borderRadius: '10px', padding: '12px', background: '#0e1117', marginBottom: '14px' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>📷 Product Images</p>
                      <div className="r-img-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <FileField label="Main Image *" onChange={setNImg0} cls="adm-file-in" />
                        <FileField label="Detail 1" onChange={setNImg1} cls="adm-file-in" />
                        <FileField label="Detail 2" onChange={setNImg2} cls="adm-file-in" />
                      </div>
                    </div>
                    <button type="submit" disabled={addBusy} style={{ width: '100%', padding: '12px', background: addBusy ? '#2a6e5a' : '#4dd4ac', color: '#000', border: 'none', borderRadius: '8px', cursor: addBusy ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                      {addBusy ? '⏳ Publishing…' : '🚀 Publish Listing'}
                    </button>
                  </form>
                </div>
              )}

              {/* ════ BOOKINGS ════ */}
              {tab === 'bookings' && (
                <div>
                  <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.15rem,5vw,1.7rem)', color: '#4dd4ac', marginBottom: '6px' }}>Bookings</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem', marginBottom: '18px' }}>Agent booking requests</p>
                  {bookings.length === 0 ? <Empty icon="📅" title="No bookings yet" sub="Bookings will appear here." /> : bookings.map(b => (
                    <Card key={b.id} color={b.status === 'pending' ? '#fbbf24' : '#4dd4ac'}>
                      <div className="r-book-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '7px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1e2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>👤</div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontWeight: '700', color: '#fff', margin: 0, fontSize: '0.88rem' }}>{b.name}</p>
                              <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)', margin: 0, wordBreak: 'break-all' }}>{b.email}</p>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 14px', fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)' }}>
                            <span><b style={{ color: 'rgba(255,255,255,0.6)' }}>Service:</b> {b.service === 'paid' ? 'Paid' : 'Free'}</span>
                            <span><b style={{ color: 'rgba(255,255,255,0.6)' }}>Date:</b> {new Date(b.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, alignItems: 'flex-end' }}>
                          {statusBadge(b.status || 'pending', { pending: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', label: 'Pending' }, confirmed: { bg: 'rgba(77,212,172,0.12)', color: '#4dd4ac', label: 'Confirmed' }, completed: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', label: 'Completed' }, cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', label: 'Cancelled' }, _default: { bg: '#1e2a3a', color: '#aaa' } })}
                          {(!b.status || b.status === 'pending') && (
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <Btn color="#16a34a" hover="#15803d" onClick={() => updateBooking(b.id, 'confirmed')}>✓ Confirm</Btn>
                              <Btn color="#dc2626" hover="#b91c1c" onClick={() => updateBooking(b.id, 'cancelled')}>✗ Cancel</Btn>
                            </div>
                          )}
                          {b.status === 'confirmed' && <Btn color="#60a5fa" hover="#3b82f6" onClick={() => updateBooking(b.id, 'completed')}>✔ Done</Btn>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* ════ MESSAGES ════ */}
              {tab === 'messages' && (
                <div>
                  <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.15rem,5vw,1.7rem)', color: '#4dd4ac', marginBottom: '6px' }}>Messages</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem', marginBottom: '10px' }}>Reply as any agent</p>
                  {!showConvList && (
                    <button onClick={() => setShowConvList(true)} className="r-mob-back"
                      style={{ display: 'none', marginBottom: '10px', padding: '8px 14px', background: '#1e2a3a', border: 'none', borderRadius: '8px', color: '#4dd4ac', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: '600' }}>
                      ← Conversations
                    </button>
                  )}
                  <style>{`@media (max-width:768px) { .r-mob-back { display: block !important; } }`}</style>
                  <div className="r-msg-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '12px', height: '560px' }}>

                    {/* Conv list */}
                    <div className={`r-conv-panel${!showConvList ? ' r-conv-hide' : ''}`}
                      style={{ border: '2px solid #1e2a3a', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#151c27' }}>
                      <div style={{ padding: '10px 13px', background: '#4dd4ac', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <span style={{ fontWeight: '700', fontSize: '0.83rem', color: '#000' }}>💬 Conversations</span>
                        <span style={{ background: 'rgba(0,0,0,0.15)', color: '#000', borderRadius: '20px', padding: '1px 7px', fontSize: '10px', fontWeight: '700' }}>{convs.length}</span>
                      </div>
                      <div className="adm-sb" style={{ flex: 1, overflowY: 'auto' }}>
                        {convs.length === 0
                          ? <p style={{ padding: '20px', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>No conversations yet</p>
                          : convs.map(c => (
                            <button key={c.id} onClick={() => loadMsgs(c)}
                              style={{ width: '100%', padding: '11px 13px', textAlign: 'left', background: selConv?.id === c.id ? 'rgba(77,212,172,0.12)' : 'transparent', borderLeft: `3px solid ${selConv?.id === c.id ? '#4dd4ac' : 'transparent'}`, borderBottom: '1px solid #1e2a3a', border: 'none', cursor: 'pointer', display: 'block' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1e2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', flexShrink: 0 }}>👤</div>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ fontWeight: '600', fontSize: '0.8rem', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.user_id ? `User ${c.user_id.slice(0, 8)}` : 'Unknown'}</p>
                                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', margin: 0 }}>{new Date(c.last_message_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Chat */}
                    <div className={`r-chat-panel${showConvList ? ' r-chat-hide' : ''}`}
                      style={{ border: '2px solid #1e2a3a', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#151c27' }}>
                      {selConv ? (
                        <>
                          <div style={{ padding: '10px 15px', background: '#4dd4ac', display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0 }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>👤</div>
                            <div>
                              <p style={{ fontWeight: '700', fontSize: '0.82rem', color: '#000', margin: 0 }}>User {selConv.user_id?.slice(0, 8)}</p>
                              <p style={{ fontSize: '10px', color: 'rgba(0,0,0,0.5)', margin: 0 }}>Active conversation</p>
                            </div>
                          </div>
                          <div className="adm-sb" style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '9px', background: '#0a1018' }}>
                            {msgs.length === 0
                              ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', margin: 'auto' }}><p style={{ fontSize: '2rem' }}>💬</p><p style={{ fontSize: '0.8rem' }}>No messages yet</p></div>
                              : msgs.map((m, i) => {
                                const agentLabel = m.is_agent ? parseAgentName(m) : null;
                                const content = m.is_agent ? stripAgentPrefix(m.content) : m.content;
                                return (
                                  <div key={i} style={{ display: 'flex', justifyContent: m.is_agent ? 'flex-start' : 'flex-end' }}>
                                    <div style={{ maxWidth: '82%' }}>
                                      {m.is_agent && agentLabel && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                                          <span>{AGENTS.find(a => a.name === agentLabel)?.avatar || '🤝'}</span>
                                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#4dd4ac' }}>{agentLabel}</span>
                                        </div>
                                      )}
                                      <div style={{ padding: '9px 12px', borderRadius: '10px', background: m.is_agent ? '#1d4b39' : '#1e2b27', color: '#e0f5ef', borderTopLeftRadius: m.is_agent ? '2px' : '10px', borderTopRightRadius: m.is_agent ? '10px' : '2px' }}>
                                        {!m.is_agent && <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', margin: '0 0 3px' }}>User</p>}
                                        <p style={{ fontSize: '0.83rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>{content}</p>
                                        <p style={{ fontSize: '10px', color: 'rgba(224,245,239,0.35)', margin: '4px 0 0' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            <div ref={msgsEnd} />
                          </div>
                          <div style={{ padding: '9px 11px', borderTop: '2px solid #1e2a3a', background: '#131920', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
                              <span style={{ fontSize: '0.66rem', fontWeight: '600', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', flexShrink: 0 }}>As:</span>
                              <div ref={agentPickerRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                                <button onClick={e => { e.stopPropagation(); setShowAgentPicker(p => !p); }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#1a2230', border: `1.5px solid ${showAgentPicker ? '#4dd4ac' : '#1e2a3a'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0 }}>
                                  <span>{selectedAgent.avatar}</span>
                                  <span style={{ flex: 1, textAlign: 'left', fontSize: '0.76rem', fontWeight: '600', color: '#4dd4ac', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAgent.name}</span>
                                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: selectedAgent.online ? '#22c55e' : '#475569', flexShrink: 0 }} />
                                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', flexShrink: 0 }}>{showAgentPicker ? '▲' : '▼'}</span>
                                </button>
                                {showAgentPicker && (
                                  <div style={{ position: 'absolute', bottom: 'calc(100% + 5px)', left: 0, right: 0, background: '#151c27', border: '2px solid #1e2a3a', borderRadius: '10px', overflow: 'hidden', zIndex: 9999, boxShadow: '0 -8px 24px rgba(0,0,0,0.5)' }}>
                                    {AGENTS.map(agent => (
                                      <button key={agent.name} onClick={e => { e.stopPropagation(); setSelectedAgent(agent); setShowAgentPicker(false); }}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 13px', background: selectedAgent.name === agent.name ? 'rgba(77,212,172,0.12)' : 'transparent', border: 'none', borderBottom: '1px solid #1e2a3a', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        <span>{agent.avatar}</span>
                                        <span style={{ flex: 1, textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: selectedAgent.name === agent.name ? '#4dd4ac' : '#fff' }}>{agent.name}</span>
                                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: agent.online ? '#22c55e' : '#475569' }} />
                                        {selectedAgent.name === agent.name && <span style={{ color: '#4dd4ac', fontSize: '0.78rem' }}>✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '7px' }}>
                              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                                placeholder={`Reply as ${selectedAgent.name}…`} className="adm-in"
                                style={{ flex: 1, background: '#1a2230', border: '1.5px solid #1e2a3a', borderRadius: '8px', color: '#fff', fontFamily: 'inherit', fontSize: '0.85rem', padding: '9px 11px', outline: 'none', boxSizing: 'border-box', minWidth: 0 }}
                                onFocus={e => e.target.style.borderColor = '#4dd4ac'}
                                onBlur={e => e.target.style.borderColor = '#1e2a3a'} />
                              <button onClick={sendReply}
                                style={{ padding: '9px 15px', background: replyText.trim() ? '#4dd4ac' : '#1e2a3a', color: replyText.trim() ? '#000' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', flexShrink: 0, fontSize: '0.85rem' }}>
                                Send
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.18)' }}>
                          <p style={{ fontSize: '2rem' }}>💬</p>
                          <p style={{ fontSize: '0.82rem' }}>Select a conversation</p>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }}>
          <div className="adm-sb" style={{ width: '100%', maxWidth: '640px', background: '#151c27', border: '2px solid #1e2a3a', borderRadius: '14px', padding: '18px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '1.15rem', color: '#4dd4ac', margin: 0 }}>Edit Listing</h3>
              <button onClick={() => setEditOpen(false)} style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div className="r-edit-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px', marginBottom: '11px' }}>
              {[['Title', 'title', 'text'], ['Price ($)', 'price', 'number'], ['Business Name', 'business_name', 'text'], ['Location', 'location', 'text']].map(([l, k, t]) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{l}</label>
                  <input type={t} value={editF[k] || ''} onChange={e => setEditF(p => ({ ...p, [k]: e.target.value }))} className="adm-in" style={IS} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Category</label>
                <select value={editF.category || 'Furniture'} onChange={e => setEditF(p => ({ ...p, category: e.target.value }))} className="adm-in" style={IS}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Condition</label>
                <select value={editF.condition || 'Like New'} onChange={e => setEditF(p => ({ ...p, condition: e.target.value }))} className="adm-in" style={IS}>{CONDS.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Status</label>
                <div style={{ position: 'relative' }}>
                  <select value={editF.status || 'active'} onChange={e => setEditF(p => ({ ...p, status: e.target.value }))} className="adm-in" style={{ ...IS, paddingLeft: '36px', appearance: 'none', WebkitAppearance: 'none' }}>
                    <option value="active">Active — visible to buyers</option>
                    <option value="sold">Sold — marked as sold</option>
                    <option value="pending">Pending — awaiting review</option>
                    <option value="out_of_stock">Out of Stock — unavailable</option>
                  </select>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '9px', height: '9px', borderRadius: '50%', pointerEvents: 'none', background: editF.status === 'active' ? '#4ade80' : editF.status === 'sold' ? '#60a5fa' : editF.status === 'pending' ? '#fbbf24' : '#fb923c' }} />
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>▼</div>
                </div>
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>Preview:</span>
                  {statusBadge(editF.status || 'active', statusConfig)}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '11px' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Description</label>
              <textarea rows={3} value={editF.description || ''} onChange={e => setEditF(p => ({ ...p, description: e.target.value }))} className="adm-in" style={{ ...IS, resize: 'vertical' }} />
            </div>
            <div style={{ border: '2px dashed #1e2a3a', borderRadius: '8px', padding: '12px', background: '#0e1117', marginBottom: '14px' }}>
              <p style={{ fontSize: '0.76rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginBottom: '9px' }}>📷 Current Images</p>
              <div className="r-edit-imgs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '9px', marginBottom: '11px' }}>
                {[0, 1, 2].map(slot => (
                  <div key={slot} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <div style={{ width: '100%', aspectRatio: '1', borderRadius: '7px', overflow: 'hidden', background: '#1e2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {editExistingImgs[slot] ? <img src={editExistingImgs[slot]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '1.3rem' }}>📷</span>}
                    </div>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{slot === 0 ? 'Main' : `Detail ${slot}`}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.3)', marginBottom: '9px' }}>Replace images (leave blank to keep)</p>
              <div className="r-edit-imgs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '9px' }}>
                <FileField label="New Main" onChange={setEImg0} />
                <FileField label="New Detail 1" onChange={setEImg1} />
                <FileField label="New Detail 2" onChange={setEImg2} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <OutlineBtn color="rgba(255,255,255,0.3)" onClick={() => setEditOpen(false)}>Cancel</OutlineBtn>
              <button onClick={saveEdit} disabled={editBusy} style={{ padding: '10px 24px', background: editBusy ? '#2a6e5a' : '#4dd4ac', color: '#000', border: 'none', borderRadius: '8px', cursor: editBusy ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                {editBusy ? '⏳ Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Card({ children, color = '#1e2a3a' }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#151c27', border: `2px solid ${hov ? color : '#1e2a3a'}`, borderRadius: '12px', padding: '13px 14px', marginBottom: '9px', transition: 'border-color 0.2s' }}>
      {children}
    </div>
  );
}
function Btn({ children, color, hover, onClick, disabled = false }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={disabled ? undefined : onClick}
      onMouseEnter={() => { if (!disabled) setHov(true); }} onMouseLeave={() => setHov(false)}
      style={{ padding: '7px 13px', background: disabled ? '#1e2a3a' : hov ? hover : color, color: disabled ? 'rgba(255,255,255,0.25)' : '#fff', border: 'none', borderRadius: '7px', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.78rem', fontFamily: 'inherit', transition: 'background 0.15s', whiteSpace: 'nowrap', opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );
}
function OutlineBtn({ children, color, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '7px 13px', background: hov ? color : 'transparent', border: `1.5px solid ${color}`, color: hov ? (color === '#ff6b6b' ? '#fff' : '#000') : color, borderRadius: '7px', cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}
function FileField({ label, onChange, cls = '' }) {
  const [fileName, setFileName] = React.useState('');
  const inputRef = React.useRef(null);
  return (
    <div>
      <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>{label}</p>
      <input ref={inputRef} type="file" accept="image/*" className={cls}
        onChange={e => { const f = e.target.files[0]; onChange(f); setFileName(f?.name || ''); }}
        style={{ display: 'none' }} />
      <button type="button" onClick={() => inputRef.current?.click()}
        style={{ width: '100%', border: `2px dashed ${fileName ? '#4dd4ac' : '#1e2a3a'}`, borderRadius: '8px', padding: '10px', background: '#0a1018', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '1.1rem' }}>{fileName ? '✅' : '📷'}</span>
        <span style={{ fontSize: '0.7rem', color: fileName ? '#4dd4ac' : 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {fileName || 'Tap to choose'}
        </span>
      </button>
    </div>
  );
}
  return (
    <div style={{ textAlign: 'center', padding: '44px 20px', border: '2px dashed #1e2a3a', borderRadius: '12px', background: '#151c27' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '9px' }}>{icon}</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>{title}</p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>{sub}</p>
    </div>
  );
}
