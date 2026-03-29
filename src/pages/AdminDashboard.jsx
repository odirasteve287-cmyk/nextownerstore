import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

const AGENTS = [
  { name: 'Agent Sarah K.', avatar: '👩‍💼', online: false },
  { name: 'Agent James M.', avatar: '👨‍💼', online: true  },
  { name: 'Agent Amara T.', avatar: '👩‍🔬', online: false },
  { name: 'Agent Leo B.',   avatar: '🧑‍💻', online: true  },
  { name: 'Agent Nina R.',  avatar: '👩‍🎨', online: false },
];

const CATS  = ['Furniture','Electronics','Appliances','For Kids','Decor','Kitchenware','Household'];
const CONDS = ['Brand New','Like New','Excellent','Good','Fair','For Parts'];

// ── helpers ──────────────────────────────────────────────────────────────────
function Card({ children, color = '#1e2a3a' }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#151c27', border: `2px solid ${hov ? color : '#1e2a3a'}`, borderRadius: '12px', padding: '16px 18px', marginBottom: '10px', transition: 'border-color 0.2s' }}>
      {children}
    </div>
  );
}
function Btn({ children, color, hover, onClick, disabled = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={disabled ? undefined : onClick}
      onMouseEnter={() => { if (!disabled) setHov(true); }} onMouseLeave={() => setHov(false)}
      style={{ padding: '8px 16px', background: disabled ? '#1e2a3a' : hov ? hover : color, color: disabled ? 'rgba(255,255,255,0.25)' : '#fff', border: 'none', borderRadius: '7px', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );
}
function OutlineBtn({ children, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '7px 14px', background: hov ? color : 'transparent', border: `1.5px solid ${color}`, color: hov ? (color === '#ff6b6b' ? '#fff' : '#000') : color, borderRadius: '7px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}
function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', border: '2px dashed #1e2a3a', borderRadius: '12px', background: '#151c27' }}>
      <div style={{ fontSize: '2.8rem', marginBottom: '10px' }}>{icon}</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>{title}</p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem' }}>{sub}</p>
    </div>
  );
}

function FileField({ label, value, onChange, existingUrl = null, required = false }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(existingUrl);
  useEffect(() => { if (!value) setPreview(existingUrl); }, [existingUrl, value]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
        {label}{required && <span style={{ color: '#ff6b6b' }}> *</span>}
      </p>
      <div onClick={() => ref.current?.click()}
        style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', background: '#0a1018', border: `2px dashed ${value ? '#4dd4ac' : preview ? '#334155' : '#1e2a3a'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'border-color 0.2s' }}
        onMouseEnter={e => { if (!preview) e.currentTarget.style.borderColor = '#4dd4ac'; }}
        onMouseLeave={e => { if (!preview) e.currentTarget.style.borderColor = value ? '#4dd4ac' : '#1e2a3a'; }}>
        {preview ? (
          <>
            <img src={preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', borderRadius: '5px', padding: '3px 7px', fontSize: '9px', fontWeight: '700', color: '#fff' }}>Change</div>
            {value && <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(77,212,172,0.9)', borderRadius: '5px', padding: '3px 7px', fontSize: '9px', fontWeight: '700', color: '#000' }}>New</div>}
          </>
        ) : (
          <>
            <div style={{ fontSize: '1.8rem', opacity: 0.3, marginBottom: '4px' }}>📷</div>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>Click to upload</span>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) { onChange(f); setPreview(URL.createObjectURL(f)); } }} />
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard({ user, setView }) {
  const [tab,        setTab]        = useState('pending');
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [pending,    setPending]    = useState([]);
  const [listings,   setListings]   = useState([]);
  const [bookings,   setBookings]   = useState([]);
  const [convs,      setConvs]      = useState([]);
  const [msgs,       setMsgs]       = useState([]);
  const [selConv,    setSelConv]    = useState(null);
  const [replyText,  setReplyText]  = useState('');
  const [selAgent,   setSelAgent]   = useState(AGENTS[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [stats,      setStats]      = useState({ pending: 0, listings: 0, bookings: 0, messages: 0 });
  const [diag,       setDiag]       = useState([]);
  const [showDiag,   setShowDiag]   = useState(false);
  const [actionBusy, setActionBusy] = useState({});
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // edit modal
  const [editOpen,         setEditOpen]         = useState(false);
  const [editProd,         setEditProd]         = useState(null);
  const [editF,            setEditF]            = useState({});
  const [eImg0,            setEImg0]            = useState(null);
  const [eImg1,            setEImg1]            = useState(null);
  const [eImg2,            setEImg2]            = useState(null);
  const [editBusy,         setEditBusy]         = useState(false);
  const [editExistingImgs, setEditExistingImgs] = useState([null, null, null]);

  // add listing — location and business_name removed
  const [nProd,   setNProd]   = useState({ title: '', price: '', category: 'Furniture', condition: 'Like New', description: '' });
  const [nImg0,   setNImg0]   = useState(null);
  const [nImg1,   setNImg1]   = useState(null);
  const [nImg2,   setNImg2]   = useState(null);
  const [addBusy, setAddBusy] = useState(false);
  const [addMsg,  setAddMsg]  = useState({ type: '', text: '' });

  const msgsEnd    = useRef(null);
  const pickerRef  = useRef(null);
  const menuRef    = useRef(null);
  const prevMsgLen = useRef(0);

  const IS = { background: '#0e1117', border: '2px solid #1e2a3a', color: '#fff', width: '100%', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', fontSize: '0.875rem', boxSizing: 'border-box' };

  const NAV = [
    { id: 'pending',  label: 'Pending',     get count() { return stats.pending;  } },
    { id: 'listings', label: 'Listings',    get count() { return stats.listings; } },
    { id: 'add',      label: 'Add Listing', count: 0 },
    { id: 'bookings', label: 'Bookings',    get count() { return stats.bookings; } },
    { id: 'messages', label: 'Messages',    get count() { return stats.messages; } },
  ];

  const STATUS_CFG = {
    active:       { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80', label: 'Active'       },
    sold:         { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', label: 'Sold'         },
    pending:      { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: 'Pending'      },
    out_of_stock: { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c', label: 'Out of Stock' },
    _default:     { bg: '#1e2a3a',                color: '#aaa' },
  };

  useEffect(() => {
    if (user) { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }
  }, [user]);

  useEffect(() => {
    if (msgs.length > prevMsgLen.current && prevMsgLen.current !== 0) {
      msgsEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgLen.current = msgs.length;
  }, [msgs]);

  useEffect(() => {
    const fn = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
      if (menuRef.current   && !menuRef.current.contains(e.target))   setMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (!selConv) return;
    const iv = setInterval(async () => {
      const { data, error } = await supabase.from('agent_messages').select('*').eq('conversation_id', selConv.id).order('created_at', { ascending: true });
      if (!error && data) setMsgs(data);
    }, 5000);
    return () => clearInterval(iv);
  }, [selConv?.id]);

  // ── data helpers ──
  const attachImages = async (products) => {
    if (!products?.length) return products;
    const { data: imgs } = await supabase.from('product_images').select('product_id,image_url,is_primary,sort_order').in('product_id', products.map(p => p.id)).order('sort_order', { ascending: true });
    if (!imgs) return products;
    const map = {};
    imgs.forEach(i => { (map[i.product_id] = map[i.product_id] || []).push(i); });
    return products.map(p => ({ ...p, extra_imgs: map[p.id] || [] }));
  };

  const buildImages = (p) => {
    const def = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=900&h=600&fit=crop';
    if (p.extra_imgs?.length) {
      const arr = p.extra_imgs.map(i => i.image_url).filter(Boolean);
      if (arr.length) { while (arr.length < 3) arr.push(arr[arr.length - 1]); return arr.slice(0, 3); }
    }
    return [p.image_url || def, p.image_url || def, p.image_url || def];
  };

  const load = async () => {
    const log = [];
    const { data: pend, error: e1 } = await supabase.from('products').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    log.push({ label: 'pending products', ok: !e1, count: pend?.length ?? 0, error: e1?.message });
    if (!e1) setPending(await attachImages(pend || []));

    const { data: lst, error: e2 } = await supabase.from('products').select('*').in('status', ['active', 'sold']).order('created_at', { ascending: false });
    log.push({ label: 'active/sold products', ok: !e2, count: lst?.length ?? 0, error: e2?.message });
    if (!e2) setListings(await attachImages(lst || []));

    const { data: bk, error: e3 } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    log.push({ label: 'bookings', ok: !e3, count: bk?.length ?? 0, error: e3?.message });
    if (!e3) setBookings(bk || []);

    const { data: cv, error: e4 } = await supabase.from('agent_conversations').select('*').order('last_message_at', { ascending: false });
    log.push({ label: 'conversations', ok: !e4, count: cv?.length ?? 0, error: e4?.message });
    if (!e4) { setConvs(cv || []); if (cv?.length) setSelConv(prev => prev ?? cv[0]); }

    setDiag(log);
    setStats({ pending: pend?.length ?? 0, listings: lst?.length ?? 0, bookings: bk?.length ?? 0, messages: cv?.length ?? 0 });
  };

  const loadMsgs = async (conv) => {
    setSelConv(conv);
    setMobileShowChat(true);
    prevMsgLen.current = 0;
    const { data, error } = await supabase.from('agent_messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true });
    if (!error && data) setMsgs(data);
  };

  const uploadImg = async (file) => {
    if (!file) return null;
    const path = `admin/${Date.now()}_${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    return error ? null : supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const notifySeller = async (sellerId, text) => {
    if (!sellerId) return;
    try {
      const { data: rows } = await supabase.from('agent_conversations').select('id').eq('user_id', sellerId).limit(1);
      let cid;
      if (rows?.length) { cid = rows[0].id; }
      else {
        const { data: nc, error: ce } = await supabase.from('agent_conversations').insert([{ user_id: sellerId, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() }]).select().single();
        if (ce) return; cid = nc.id;
      }
      const since = new Date(Date.now() - 60000).toISOString();
      const { data: dup } = await supabase.from('agent_messages').select('id').eq('conversation_id', cid).eq('is_agent', true).eq('content', text).gte('created_at', since).limit(1);
      if (dup?.length) return;
      await supabase.from('agent_messages').insert([{ conversation_id: cid, sender_id: user.id, is_agent: true, content: `[${selAgent.name}] ${text}`, agent_name: selAgent.name, created_at: new Date().toISOString() }]);
      await supabase.from('agent_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', cid);
    } catch (err) { console.error(err); }
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
    if (!confirm(`Reject "${product.title}"? This will delete it.`)) return;
    setActionBusy(b => ({ ...b, [product.id]: 'reject' }));
    try {
      await notifySeller(product.seller_id, `❌ Your item "${product.title}" could not be approved. Please review our requirements and resubmit.`);
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) { alert('Delete failed: ' + error.message); return; }
      load();
    } catch (err) { alert(err.message); }
    finally { setActionBusy(b => { const n = { ...b }; delete n[product.id]; return n; }); }
  };

  const deleteProd = async (id) => {
    if (!confirm('Delete this listing permanently?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) load(); else alert(error.message);
  };

  const updateBooking = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) load(); else alert(error.message);
  };

  const openEdit = async (p) => {
    setEditProd(p);
    setEditF({ title: p.title || '', price: p.price || '', category: p.category || 'Furniture', condition: p.condition || 'Like New', description: p.description || '', location: p.location || '', business_name: p.business_name || '', status: p.status || 'active' });
    setEImg0(null); setEImg1(null); setEImg2(null);
    const { data: imgs } = await supabase.from('product_images').select('image_url,sort_order').eq('product_id', p.id).order('sort_order', { ascending: true });
    const slots = [null, null, null];
    imgs?.forEach(i => { if (i.sort_order < 3) slots[i.sort_order] = i.image_url; });
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

  const sendReply = async () => {
    const text = replyText.trim(); if (!text) return;
    let conv = selConv;
    if (!conv) { if (!convs.length) return; conv = convs[0]; setSelConv(conv); }
    const { data, error } = await supabase.from('agent_messages').insert([{ conversation_id: conv.id, sender_id: user.id, is_agent: true, content: `[${selAgent.name}] ${text}`, agent_name: selAgent.name, created_at: new Date().toISOString() }]).select().single();
    if (!error && data) {
      setMsgs(p => [...p, data]); setReplyText('');
      await supabase.from('agent_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conv.id);
      load();
    } else if (error) alert('Send failed: ' + error.message);
  };

  const addListing = async (e) => {
    e.preventDefault();
    if (!nImg0) { setAddMsg({ type: 'err', text: 'Main image is required.' }); return; }
    setAddBusy(true); setAddMsg({ type: '', text: '' });
    try {
      const { data: prod, error: pe } = await supabase.from('products').insert([{ seller_id: user.id, ...nProd, price: parseFloat(nProd.price), status: 'active', created_at: new Date().toISOString() }]).select().single();
      if (pe) throw pe;
      const url0 = await uploadImg(nImg0);
      if (url0) { await supabase.from('product_images').insert([{ product_id: prod.id, image_url: url0, is_primary: true, sort_order: 0 }]); await supabase.from('products').update({ image_url: url0 }).eq('id', prod.id); }
      for (const [f, ord] of [[nImg1, 1], [nImg2, 2]]) { if (f) { const u = await uploadImg(f); if (u) await supabase.from('product_images').insert([{ product_id: prod.id, image_url: u, is_primary: false, sort_order: ord }]); } }
      setNProd({ title: '', price: '', category: 'Furniture', condition: 'Like New', description: '' });
      setNImg0(null); setNImg1(null); setNImg2(null);
      setAddMsg({ type: 'ok', text: 'Listing published!' });
      load();
    } catch (err) { setAddMsg({ type: 'err', text: err.message }); }
    finally { setAddBusy(false); }
  };

  const badge = (s) => {
    const c = STATUS_CFG[s] || STATUS_CFG._default;
    return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.color }}>{c.label || s}</span>;
  };

  const ThumbStrip = ({ product }) => {
    const [sel, setSel] = useState(0);
    const imgs = buildImages(product);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#0e1117', border: '2px solid #1e2a3a' }}>
          <img src={imgs[sel]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {imgs.map((img, i) => (
            <button key={i} onClick={() => setSel(i)} style={{ width: '22px', height: '22px', borderRadius: '4px', overflow: 'hidden', padding: 0, border: `1.5px solid ${sel === i ? '#4dd4ac' : '#1e2a3a'}`, cursor: 'pointer', background: '#0e1117', opacity: sel === i ? 1 : 0.5 }}>
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Sidebar nav item ──
  const SideNavItem = ({ item }) => {
    const active = tab === item.id;
    const [hov, setHov] = useState(false);
    return (
      <button onClick={() => setTab(item.id)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: '9px', marginBottom: '2px', background: active ? '#4dd4ac' : hov ? 'rgba(77,212,172,0.08)' : 'transparent', color: active ? '#000' : hov ? '#4dd4ac' : 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: active ? '700' : '500', transition: 'all 0.15s', textAlign: 'left' }}>
        <span>{item.label}</span>
        {item.count > 0 && (
          <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: active ? 'rgba(0,0,0,0.18)' : 'rgba(77,212,172,0.15)', color: active ? '#000' : '#4dd4ac' }}>
            {item.count}
          </span>
        )}
      </button>
    );
  };

  // ── Tab content ──
  const Pages = {
    pending: () => (
      <div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,3vw,1.6rem)', color: '#4dd4ac', margin: '0 0 4px' }}>Pending Submissions</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 20px' }}>Approve or reject seller submissions</p>
        {pending.length === 0 ? <Empty icon="✅" title="All caught up!" sub="No pending submissions." />
          : pending.map(p => (
            <Card key={p.id} color="#fbbf24">
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <ThumbStrip product={p} />
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: '700', color: '#4dd4ac', margin: 0, fontSize: '1rem', flex: 1 }}>{p.title}</h3>
                    <span style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>PENDING</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: '10px' }}>
                    <span><b style={{ color: 'rgba(255,255,255,0.7)' }}>Price:</b> ${p.price}</span>
                    <span><b style={{ color: 'rgba(255,255,255,0.7)' }}>Cat:</b> {p.category}</span>
                    <span><b style={{ color: 'rgba(255,255,255,0.7)' }}>Cond:</b> {p.condition}</span>
                    <span><b style={{ color: 'rgba(255,255,255,0.7)' }}>Loc:</b> {p.location}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    <Btn color="#16a34a" hover="#15803d" disabled={!!actionBusy[p.id]} onClick={() => approve(p)}>{actionBusy[p.id] === 'approve' ? '⏳ Approving…' : '✓ Approve'}</Btn>
                    <Btn color="#dc2626" hover="#b91c1c" disabled={!!actionBusy[p.id]} onClick={() => reject(p)}>{actionBusy[p.id] === 'reject' ? '⏳ Rejecting…' : '✗ Reject'}</Btn>
                    <Btn color="#60a5fa" hover="#3b82f6" onClick={() => openEdit(p)}>✎ Edit</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>
    ),

    listings: () => (
      <div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,3vw,1.6rem)', color: '#4dd4ac', margin: '0 0 4px' }}>All Listings</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 20px' }}>Active and sold products</p>
        {listings.length === 0 ? <Empty icon="📦" title="No listings yet" sub="Add one using Add Listing." />
          : listings.map(p => (
            <Card key={p.id}>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <ThumbStrip product={p} />
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <h3 style={{ fontWeight: '700', color: '#4dd4ac', margin: '0 0 4px', fontSize: '0.95rem' }}>{p.title}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 8px' }}>{p.category} · <span style={{ color: '#4dd4ac', fontWeight: '700' }}>${p.price}</span></p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {badge(p.status)}
                    <OutlineBtn color="#60a5fa" onClick={() => openEdit(p)}>✎ Edit</OutlineBtn>
                    <OutlineBtn color="#ff6b6b" onClick={() => deleteProd(p.id)}>✕ Delete</OutlineBtn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>
    ),

    add: () => (
      <div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,3vw,1.6rem)', color: '#4dd4ac', margin: '0 0 4px' }}>Add Listing</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 20px' }}>Publish a new product to the store</p>
        <div style={{ background: '#151c27', border: '2px solid #1e2a3a', borderRadius: '12px', padding: '20px' }}>
          {addMsg.text && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', background: addMsg.type === 'ok' ? 'rgba(77,212,172,0.1)' : 'rgba(239,68,68,0.1)', color: addMsg.type === 'ok' ? '#4dd4ac' : '#fca5a5', fontSize: '0.85rem', fontWeight: '600' }}>
              {addMsg.text}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[['Title','title','text'],['Price','price','number']].map(([lbl,key,type]) => (
              <div key={key}>
                <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>{lbl}</p>
                <input className="adm-in" type={type} value={nProd[key]} onChange={e => setNProd(p => ({ ...p, [key]: e.target.value }))} style={IS} placeholder={lbl} />
              </div>
            ))}
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Category</p>
              <select className="adm-in" value={nProd.category} onChange={e => setNProd(p => ({ ...p, category: e.target.value }))} style={IS}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Condition</p>
              <select className="adm-in" value={nProd.condition} onChange={e => setNProd(p => ({ ...p, condition: e.target.value }))} style={IS}>{CONDS.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Description</p>
              <textarea className="adm-in" value={nProd.description} onChange={e => setNProd(p => ({ ...p, description: e.target.value }))} style={{ ...IS, minHeight: '90px', resize: 'vertical' }} placeholder="Describe the item…" />
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>Images</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                <FileField label="Main" value={nImg0} onChange={setNImg0} required />
                <FileField label="Image 2" value={nImg1} onChange={setNImg1} />
                <FileField label="Image 3" value={nImg2} onChange={setNImg2} />
              </div>
            </div>
          </div>
          <button onClick={addListing} disabled={addBusy}
            style={{ marginTop: '20px', width: '100%', padding: '13px', background: addBusy ? '#1e2a3a' : '#4dd4ac', color: addBusy ? 'rgba(255,255,255,0.3)' : '#000', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: addBusy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {addBusy ? '⏳ Publishing…' : '➕ Publish Listing'}
          </button>
        </div>
      </div>
    ),

    bookings: () => (
      <div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,3vw,1.6rem)', color: '#4dd4ac', margin: '0 0 4px' }}>Bookings</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 20px' }}>Manage customer bookings</p>
        {bookings.length === 0 ? <Empty icon="📅" title="No bookings yet" sub="Bookings will appear here." />
          : bookings.map(b => (
            <Card key={b.id}>
              <p style={{ color: '#4dd4ac', fontWeight: '700', margin: '0 0 4px' }}>{b.product_title || b.product_id}</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', margin: '0 0 8px' }}>{b.customer_name} · {new Date(b.created_at).toLocaleDateString()}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {badge(b.status)}
                <OutlineBtn color="#4dd4ac" onClick={() => updateBooking(b.id, 'confirmed')}>Confirm</OutlineBtn>
                <OutlineBtn color="#ff6b6b" onClick={() => updateBooking(b.id, 'cancelled')}>Cancel</OutlineBtn>
              </div>
            </Card>
          ))}
      </div>
    ),

    messages: () => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,3vw,1.6rem)', color: '#4dd4ac', margin: '0 0 4px' }}>Messages</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 16px' }}>Agent conversations</p>

        <div className="adm-msg-shell">
          {/* Left: conversation list */}
          <div className={`adm-msg-left${mobileShowChat ? ' adm-hidden' : ''}`}>
            <div style={{ padding: '12px 14px', borderBottom: '2px solid #1e2a3a', background: '#0d1520', flexShrink: 0 }}>
              <p style={{ color: '#fff', fontWeight: '700', margin: 0, fontSize: '0.86rem' }}>Conversations</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {convs.length === 0
                ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', padding: '20px 14px' }}>No conversations yet</p>
                : convs.map(cv => (
                  <button key={cv.id} onClick={() => loadMsgs(cv)}
                    style={{ width: '100%', padding: '11px 14px', background: selConv?.id === cv.id ? 'rgba(77,212,172,0.14)' : 'transparent', borderLeft: `3px solid ${selConv?.id === cv.id ? '#4dd4ac' : 'transparent'}`, borderRight: 'none', borderTop: 'none', borderBottom: '1px solid #1a2030', cursor: 'pointer', textAlign: 'left', color: 'inherit', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#4dd4ac,#2a9d7c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem', color: '#000', flexShrink: 0 }}>
                      {cv.id?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: selConv?.id === cv.id ? '#4dd4ac' : '#fff', fontWeight: '700', margin: '0 0 2px', fontSize: '0.79rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{cv.id?.slice(0, 8)}</p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.69rem', margin: 0 }}>{new Date(cv.last_message_at).toLocaleString()}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Right: chat panel */}
          <div className={`adm-msg-right${!mobileShowChat && convs.length > 0 ? ' adm-hidden-mobile' : ''}`}>
            <div style={{ padding: '11px 14px', background: '#0d1520', borderBottom: '2px solid #1e2a3a', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <button onClick={() => setMobileShowChat(false)} className="adm-back-btn"
                style={{ background: 'none', border: 'none', color: '#4dd4ac', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}>←</button>
              {selConv && (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#4dd4ac,#2a9d7c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#000', fontSize: '0.72rem', flexShrink: 0 }}>
                  {selConv.id?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#fff', fontWeight: '700', margin: 0, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selConv ? `Conv #${selConv.id?.slice(0, 8)}` : 'Select a conversation'}
                </p>
                {selConv && (
                  <p style={{ color: '#4dd4ac', fontSize: '0.69rem', margin: '1px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4dd4ac', display: 'inline-block' }} /> Active
                  </p>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!selConv && (
                <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '600', fontSize: '0.9rem' }}>Select a conversation to view messages</p>
                </div>
              )}
              {selConv && msgs.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                  No messages yet
                </div>
              )}
              {msgs.map(m => (
                <div key={m.id} style={{ alignSelf: m.is_agent ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                  {m.is_agent && <p style={{ fontSize: '10px', color: '#4dd4ac', margin: '0 0 3px', textAlign: 'right', fontWeight: '600' }}>{m.agent_name || 'Agent'}</p>}
                  <div style={{ padding: '9px 13px', borderRadius: '10px', background: m.is_agent ? 'rgba(77,212,172,0.15)' : '#1e2b27', color: 'rgba(255,255,255,0.85)', fontSize: '0.83rem', lineHeight: 1.5 }}>
                    {m.content?.replace(/^\[.+?\]\s*/, '')}
                  </div>
                  <p style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.25)', margin: '3px 2px 0', textAlign: m.is_agent ? 'right' : 'left' }}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              <div ref={msgsEnd} />
            </div>

            <div style={{ padding: '10px 12px', borderTop: '2px solid #1e2a3a', display: 'flex', gap: '8px', flexShrink: 0, background: '#0d1520' }}>
              <div ref={pickerRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button onClick={() => setShowPicker(p => !p)}
                  style={{ padding: '8px 10px', background: '#1e2a3a', border: '2px solid #2a3a4a', borderRadius: '8px', color: '#4dd4ac', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', fontFamily: 'inherit' }}>
                  {selAgent.avatar} ▾
                </button>
                {showPicker && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#0d1520', border: '2px solid #1e2a3a', borderRadius: '10px', padding: '6px', zIndex: 100, marginBottom: '4px', minWidth: '180px' }}>
                    {AGENTS.map(a => (
                      <button key={a.name} onClick={() => { setSelAgent(a); setShowPicker(false); }}
                        style={{ width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: '7px', color: a.name === selAgent.name ? '#4dd4ac' : 'rgba(255,255,255,0.7)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{a.avatar}</span><span>{a.name}</span>
                        {a.online && <span style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#4dd4ac' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                placeholder={`Reply as ${selAgent.name}…`}
                className="adm-in"
                style={{ flex: 1, background: '#0e1117', border: '2px solid #1e2a3a', color: '#fff', padding: '8px 12px', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', fontSize: '0.85rem', minWidth: 0 }} />
              <button onClick={sendReply}
                style={{ padding: '8px 16px', background: '#4dd4ac', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  // ── Mobile-only dropdown ──
  const MobileDropdown = () => (
    <div style={{ background: '#0d1520', border: '2px solid #1e2a3a', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.75)' }}>
      <nav style={{ padding: '8px' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setMenuOpen(false); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', marginBottom: '2px', borderRadius: '9px', background: tab === item.id ? '#4dd4ac' : 'transparent', color: tab === item.id ? '#000' : 'rgba(255,255,255,0.75)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: tab === item.id ? '700' : '500', textAlign: 'left' }}
            onMouseEnter={e => { if (tab !== item.id) e.currentTarget.style.background = 'rgba(77,212,172,0.08)'; }}
            onMouseLeave={e => { if (tab !== item.id) e.currentTarget.style.background = 'transparent'; }}>
            <span>{item.label}</span>
            {item.count > 0 && (
              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: tab === item.id ? 'rgba(0,0,0,0.18)' : 'rgba(77,212,172,0.15)', color: tab === item.id ? '#000' : '#4dd4ac' }}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div style={{ padding: '0 10px 10px' }}>
        <button onClick={() => { setView('home'); setMenuOpen(false); }}
          style={{ width: '100%', padding: '11px', background: 'transparent', border: '2px solid #1e2a3a', borderRadius: '9px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: '600' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4dd4ac'; e.currentTarget.style.color = '#4dd4ac'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2a3a'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
          ← Back to Store
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; } body { margin: 0; }
        .adm-in::placeholder { color: rgba(255,255,255,0.22); }
        .adm-in option { background: #111; }

        .adm-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #090d14;
          color: #fff;
          font-family: 'Poppins', -apple-system, sans-serif;
        }

        .adm-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: #0d1520;
          border-right: 2px solid #1e2a3a;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .adm-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .adm-topbar-mobile {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #090d14;
          border-bottom: 2px solid #1e2a3a;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }

        .adm-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          min-height: 0;
        }
        .adm-content::-webkit-scrollbar { width: 4px; }
        .adm-content::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 4px; }

        .adm-msg-shell {
          display: flex;
          border: 2px solid #1e2a3a;
          border-radius: 12px;
          overflow: hidden;
          height: calc(100vh - 230px);
          min-height: 380px;
        }
        .adm-msg-left {
          width: 210px;
          flex-shrink: 0;
          background: #0e1117;
          border-right: 2px solid #1e2a3a;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .adm-msg-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #0a1018;
          overflow: hidden;
        }

        .adm-hidden { display: none !important; }
        .adm-back-btn { display: none !important; }

        @media (max-width: 768px) {
          .adm-sidebar { display: none !important; }
          .adm-topbar-mobile { display: flex; }
          .adm-content { padding: 14px; }

          .adm-msg-shell {
            flex-direction: column;
            height: calc(100vh - 130px);
            min-height: 0;
          }
          .adm-msg-left {
            width: 100%;
            flex: none;
            height: 185px;
            border-right: none;
            border-bottom: 2px solid #1e2a3a;
          }
          .adm-msg-right { flex: 1; min-height: 0; }
          .adm-back-btn { display: block !important; }
          .adm-hidden-mobile { display: none !important; }
        }

        @media (min-width: 769px) {
          .adm-msg-left { display: flex !important; }
          .adm-msg-right { display: flex !important; }
        }
      `}</style>

      <div className="adm-layout">

        {/* ══ DESKTOP SIDEBAR ══ */}
        <aside className="adm-sidebar">
          <div style={{ padding: '20px 16px 16px', borderBottom: '2px solid #1e2a3a' }}>
            <p style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', fontWeight: '700', color: '#4dd4ac', margin: '0 0 2px' }}>Admin Panel</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Store Management</p>
          </div>

          <div style={{ padding: '12px 10px', borderBottom: '2px solid #1e2a3a', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[
              { v: stats.pending,  l: 'Pending',  c: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
              { v: stats.listings, l: 'Active',   c: '#4dd4ac', bg: 'rgba(77,212,172,0.08)'  },
              { v: stats.bookings, l: 'Bookings', c: '#60a5fa', bg: 'rgba(96,165,250,0.08)'  },
              { v: stats.messages, l: 'Chats',    c: '#c084fc', bg: 'rgba(192,132,252,0.08)' },
            ].map(s => (
              <div key={s.l} style={{ padding: '8px 6px', borderRadius: '8px', textAlign: 'center', background: s.bg, border: `1px solid ${s.c}22` }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: s.c, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</div>
              </div>
            ))}
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {NAV.map(item => <SideNavItem key={item.id} item={item} />)}
          </nav>

          <div style={{ padding: '12px 10px', borderTop: '2px solid #1e2a3a', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <button onClick={() => setView('home')}
              style={{ width: '100%', padding: '10px', background: 'transparent', border: '2px solid #1e2a3a', borderRadius: '9px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4dd4ac'; e.currentTarget.style.color = '#4dd4ac'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2a3a'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
              ← Back to Store
            </button>
            <button onClick={() => setShowDiag(p => !p)}
              style={{ width: '100%', padding: '8px', background: 'rgba(96,165,250,0.06)', border: '1px solid #1e2a3a', borderRadius: '8px', color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: '600' }}>
              {showDiag ? 'Hide' : 'Show'} Diagnostics
            </button>
          </div>
        </aside>

        {/* ══ MAIN AREA ══ */}
        <div className="adm-main">

          <div className="adm-topbar-mobile" ref={menuRef}>
            <button onClick={() => setMenuOpen(p => !p)} aria-label="Menu"
              style={{ width: '40px', height: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', background: menuOpen ? 'rgba(77,212,172,0.15)' : '#0e1825', border: `2px solid ${menuOpen ? '#4dd4ac' : '#1e2a3a'}`, borderRadius: '10px', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              <span style={{ display: 'block', width: '17px', height: '2px', background: '#4dd4ac', borderRadius: '2px', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
              <span style={{ display: 'block', width: '12px', height: '2px', background: '#4dd4ac', borderRadius: '2px', alignSelf: 'flex-start', marginLeft: '11px', opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
              <span style={{ display: 'block', width: '17px', height: '2px', background: '#4dd4ac', borderRadius: '2px', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#4dd4ac' }}>
              {NAV.find(n => n.id === tab)?.label}
            </span>

            <button onClick={() => setView('home')}
              style={{ padding: '7px 11px', background: 'transparent', border: '1.5px solid #1e2a3a', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: '600', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4dd4ac'; e.currentTarget.style.color = '#4dd4ac'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2a3a'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
              ← Store
            </button>

            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: '14px', right: '14px', zIndex: 999 }}>
                  <MobileDropdown />
                </div>
              </>
            )}
          </div>

          <div className="adm-content">
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>

              {showDiag && (
                <div style={{ marginBottom: '20px', background: '#0a1018', border: '2px solid #1e3a5f', borderRadius: '10px', padding: '14px 16px' }}>
                  <p style={{ fontWeight: '700', color: '#60a5fa', marginBottom: '10px', fontSize: '0.85rem', margin: '0 0 10px' }}>DB Diagnostics</p>
                  {diag.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '6px', marginBottom: '4px', background: d.ok ? 'rgba(77,212,172,0.05)' : 'rgba(239,68,68,0.08)' }}>
                      <span>{d.ok ? '✅' : '❌'}</span>
                      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', flex: 1 }}>{d.label}</span>
                      <span style={{ color: d.ok ? '#4dd4ac' : '#fca5a5', fontSize: '0.8rem', fontWeight: '700' }}>{d.ok ? `${d.count} rows` : `ERROR: ${d.error}`}</span>
                    </div>
                  ))}
                </div>
              )}

              {Pages[tab]?.()}
            </div>
          </div>
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#0d1520', border: '2px solid #1e2a3a', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '520px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: 'Georgia,serif', color: '#4dd4ac', margin: 0, fontSize: '1.1rem' }}>Edit Listing</h3>
              <button onClick={() => setEditOpen(false)} style={{ background: '#1e2a3a', border: 'none', borderRadius: '7px', color: 'rgba(255,255,255,0.5)', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['Title','title','text'],['Price','price','number'],['Location','location','text'],['Business Name','business_name','text']].map(([lbl,key,type]) => (
                <div key={key}>
                  <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>{lbl}</p>
                  <input className="adm-in" type={type} value={editF[key] || ''} onChange={e => setEditF(f => ({ ...f, [key]: e.target.value }))} style={IS} />
                </div>
              ))}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Status</p>
                <select className="adm-in" value={editF.status || 'active'} onChange={e => setEditF(f => ({ ...f, status: e.target.value }))} style={IS}>
                  {['active','sold','pending','out_of_stock'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Description</p>
                <textarea className="adm-in" value={editF.description || ''} onChange={e => setEditF(f => ({ ...f, description: e.target.value }))} style={{ ...IS, minHeight: '80px', resize: 'vertical' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>Images</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                  <FileField label="Image 1" value={eImg0} onChange={setEImg0} existingUrl={editExistingImgs[0]} required />
                  <FileField label="Image 2" value={eImg1} onChange={setEImg1} existingUrl={editExistingImgs[1]} />
                  <FileField label="Image 3" value={eImg2} onChange={setEImg2} existingUrl={editExistingImgs[2]} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setEditOpen(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '2px solid #1e2a3a', borderRadius: '9px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>Cancel</button>
              <button onClick={saveEdit} disabled={editBusy} style={{ flex: 2, padding: '11px', background: editBusy ? '#1e2a3a' : '#4dd4ac', color: editBusy ? 'rgba(255,255,255,0.3)' : '#000', border: 'none', borderRadius: '9px', fontWeight: '700', cursor: editBusy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {editBusy ? '⏳ Saving…' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
