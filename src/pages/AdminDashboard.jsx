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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [tab,      setTab]      = useState('pending');
  const [menuOpen, setMenuOpen] = useState(false);

  const [pending,   setPending]   = useState([]);
  const [listings,  setListings]  = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [convs,     setConvs]     = useState([]);
  const [msgs,      setMsgs]      = useState([]);
  const [selConv,   setSelConv]   = useState(null);
  const [replyText, setReplyText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [stats,     setStats]     = useState({ pending:0, listings:0, bookings:0, messages:0 });

  const [diag,     setDiag]     = useState([]);
  const [showDiag, setShowDiag] = useState(false);

  const [editOpen,  setEditOpen]  = useState(false);
  const [editProd,  setEditProd]  = useState(null);
  const [editF,     setEditF]     = useState({});
  const [eImg0, setEImg0] = useState(null);
  const [eImg1, setEImg1] = useState(null);
  const [eImg2, setEImg2] = useState(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editExistingImgs, setEditExistingImgs] = useState([]);

  const [nProd,   setNProd]   = useState({ title:'', price:'', category:'Furniture', condition:'Like New', description:'', location:'', business_name:'' });
  const [nImg0,   setNImg0]   = useState(null);
  const [nImg1,   setNImg1]   = useState(null);
  const [nImg2,   setNImg2]   = useState(null);
  const [addBusy, setAddBusy] = useState(false);
  const [addMsg,  setAddMsg]  = useState({ type:'', text:'' });

  const [actionBusy, setActionBusy] = useState({});

  const msgsEnd        = useRef(null);
  const agentPickerRef = useRef(null);
  const menuRef        = useRef(null);

  const CATS     = ['Furniture','Electronics','Appliances','For Kids','Decor','Kitchenware','Household'];
  const CONDS    = ['Brand New','Like New','Excellent','Good','Fair','For Parts'];
  const STATUSES = ['active','sold','pending','out_of_stock'];
  const IS       = { background:'#0e1117', border:'2px solid #1e2a3a', color:'#fff', width:'100%', padding:'10px 14px', borderRadius:'8px', outline:'none', fontFamily:'inherit', fontSize:'0.875rem', boxSizing:'border-box' };

  const menuItems = [
    { id:'pending',  icon:'⏳', label:'Pending',    count: stats.pending  },
    { id:'listings', icon:'📦', label:'Listings',   count: stats.listings },
    { id:'add',      icon:'➕', label:'Add Listing', count: 0             },
    { id:'bookings', icon:'📅', label:'Bookings',   count: stats.bookings },
    { id:'messages', icon:'💬', label:'Messages',   count: stats.messages },
  ];

  useEffect(() => {
    if (user) { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }
  }, [user]);

  useEffect(() => { msgsEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  useEffect(() => {
    const handleClick = (e) => {
      if (agentPickerRef.current && !agentPickerRef.current.contains(e.target)) setShowAgentPicker(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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

  const attachImages = async (products) => {
    if (!products?.length) return products;
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
    if (product.extra_imgs?.length) {
      const imgs = product.extra_imgs.map(i => i.image_url).filter(Boolean);
      if (imgs.length) { while (imgs.length < 3) imgs.push(imgs[imgs.length-1]); return imgs.slice(0,3); }
    }
    const base = product.image_url || def;
    return [base, base, base];
  };

  const load = async () => {
    const log = [];
    const { data: pend, error: e1 } = await supabase.from('products').select('*').eq('status','pending').order('created_at',{ascending:false});
    log.push({ label:'products (pending)', ok:!e1, count:pend?.length??0, error:e1?.message });
    if (!e1) setPending(await attachImages(pend||[]));

    const { data: lst, error: e2 } = await supabase.from('products').select('*').in('status',['active','sold']).order('created_at',{ascending:false});
    log.push({ label:'products (active/sold)', ok:!e2, count:lst?.length??0, error:e2?.message });
    if (!e2) setListings(await attachImages(lst||[]));

    const { data: bk, error: e3 } = await supabase.from('bookings').select('*').order('created_at',{ascending:false});
    log.push({ label:'bookings', ok:!e3, count:bk?.length??0, error:e3?.message });
    if (!e3) setBookings(bk||[]);

    const { data: cv, error: e4 } = await supabase.from('agent_conversations').select('*').order('last_message_at',{ascending:false});
    log.push({ label:'agent_conversations', ok:!e4, count:cv?.length??0, error:e4?.message });
    if (!e4) { setConvs(cv||[]); if (cv?.length) setSelConv(prev => prev ?? cv[0]); }

    setDiag(log);
    setStats({ pending:pend?.length??0, listings:lst?.length??0, bookings:bk?.length??0, messages:cv?.length??0 });
  };

  const loadMsgs = async (conv) => {
    setSelConv(conv);
    const { data, error } = await supabase.from('agent_messages').select('*')
      .eq('conversation_id', conv.id).order('created_at',{ascending:true});
    if (!error && data) setMsgs(data);
  };

  const sendReply = async () => {
    const text = replyText.trim(); if (!text) return;
    let conv = selConv;
    if (!conv) { if (!convs.length) return; conv = convs[0]; setSelConv(conv); }
    const msgContent = `[${selectedAgent.name}] ${text}`;
    const { data, error } = await supabase.from('agent_messages').insert([{
      conversation_id:conv.id, sender_id:user.id, is_agent:true,
      content:msgContent, agent_name:selectedAgent.name, created_at:new Date().toISOString(),
    }]).select().single();
    if (!error && data) {
      setMsgs(p=>[...p,data]); setReplyText('');
      await supabase.from('agent_conversations').update({ last_message_at:new Date().toISOString() }).eq('id',conv.id);
      load();
    } else if (error) alert('Send failed: '+error.message);
  };

  const notifySeller = async (sellerId, messageText) => {
    if (!sellerId) return;
    try {
      const { data: convRows } = await supabase.from('agent_conversations').select('id').eq('user_id',sellerId).limit(1);
      let convId;
      if (convRows?.length) { convId = convRows[0].id; }
      else {
        const { data: newConv, error: ce } = await supabase.from('agent_conversations')
          .insert([{ user_id:sellerId, created_at:new Date().toISOString(), last_message_at:new Date().toISOString() }]).select().single();
        if (ce) return; convId = newConv.id;
      }
      const since = new Date(Date.now()-60000).toISOString();
      const { data: recent } = await supabase.from('agent_messages').select('id')
        .eq('conversation_id',convId).eq('is_agent',true).eq('content',messageText).gte('created_at',since).limit(1);
      if (recent?.length) return;
      await supabase.from('agent_messages').insert([{
        conversation_id:convId, sender_id:user.id, is_agent:true,
        content:`[${selectedAgent.name}] ${messageText}`, agent_name:selectedAgent.name, created_at:new Date().toISOString(),
      }]);
      await supabase.from('agent_conversations').update({ last_message_at:new Date().toISOString() }).eq('id',convId);
    } catch(err) { console.error('notifySeller:', err.message); }
  };

  const approve = async (product) => {
    if (actionBusy[product.id]) return;
    setActionBusy(b=>({...b,[product.id]:'approve'}));
    try {
      const { error: ue } = await supabase.from('products').update({status:'active'}).eq('id',product.id);
      if (ue) { alert('Approve failed: '+ue.message); return; }
      await notifySeller(product.seller_id, `🎉 Great news! Your item "${product.title}" has been reviewed and is now LIVE on the marketplace.\n\nBuyers can see it right now. Thank you for listing with us!`);
      load();
    } catch(err) { alert('Approve error: '+err.message); }
    finally { setActionBusy(b=>{ const n={...b}; delete n[product.id]; return n; }); }
  };

  const reject = async (product) => {
    if (actionBusy[product.id]) return;
    if (!confirm(`Reject "${product.title}"?\n\nThis will delete the listing and notify the seller.`)) return;
    setActionBusy(b=>({...b,[product.id]:'reject'}));
    try {
      await notifySeller(product.seller_id, `❌ Unfortunately, your item "${product.title}" could not be approved at this time.\n\nPlease review our requirements and feel free to resubmit.`);
      const { error: de } = await supabase.from('products').delete().eq('id',product.id);
      if (de) { alert('Delete failed: '+de.message); return; }
      load();
    } catch(err) { alert('Reject error: '+err.message); }
    finally { setActionBusy(b=>{ const n={...b}; delete n[product.id]; return n; }); }
  };

  const deleteProd = async (id) => {
    if (!confirm('Delete this listing permanently?')) return;
    const { error } = await supabase.from('products').delete().eq('id',id);
    if (!error) load(); else alert('Delete error: '+error.message);
  };

  const updateBooking = async (id, status) => {
    const { error } = await supabase.from('bookings').update({status, updated_at:new Date().toISOString()}).eq('id',id);
    if (!error) load(); else alert('Error: '+error.message);
  };

  const uploadImg = async (file) => {
    if (!file) return null;
    const ext  = file.name.split('.').pop();
    const path = `admin/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return null;
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const openEdit = async (p) => {
    setEditProd(p);
    setEditF({ title:p.title||'', price:p.price||'', category:p.category||'Furniture', condition:p.condition||'Like New', description:p.description||'', location:p.location||'', business_name:p.business_name||'', status:p.status||'active' });
    setEImg0(null); setEImg1(null); setEImg2(null);
    const { data: imgs } = await supabase.from('product_images').select('image_url,sort_order,is_primary')
      .eq('product_id',p.id).order('sort_order',{ascending:true});
    const slots = [null,null,null];
    imgs?.forEach(img => { if (img.sort_order < 3) slots[img.sort_order] = img.image_url; });
    if (!slots[0]) slots[0] = p.image_url || null;
    setEditExistingImgs(slots);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editProd) return; setEditBusy(true);
    try {
      const upd = { ...editF, price:parseFloat(editF.price), updated_at:new Date().toISOString() };
      if (eImg0) { const u=await uploadImg(eImg0); if (u) { upd.image_url=u; await supabase.from('product_images').upsert([{product_id:editProd.id,image_url:u,is_primary:true,sort_order:0}]); } }
      if (eImg1) { const u=await uploadImg(eImg1); if (u) await supabase.from('product_images').upsert([{product_id:editProd.id,image_url:u,is_primary:false,sort_order:1}]); }
      if (eImg2) { const u=await uploadImg(eImg2); if (u) await supabase.from('product_images').upsert([{product_id:editProd.id,image_url:u,is_primary:false,sort_order:2}]); }
      const { error } = await supabase.from('products').update(upd).eq('id',editProd.id);
      if (error) throw error;
      setEditOpen(false); load();
    } catch(err) { alert('Save failed: '+err.message); }
    finally { setEditBusy(false); }
  };

  const addListing = async (e) => {
    e.preventDefault();
    if (!nImg0) { setAddMsg({type:'err',text:'Main image is required.'}); return; }
    setAddBusy(true); setAddMsg({type:'',text:''});
    try {
      const { data: prod, error: pe } = await supabase.from('products').insert([{
        seller_id:user.id, ...nProd, price:parseFloat(nProd.price), status:'active', created_at:new Date().toISOString(),
      }]).select().single();
      if (pe) throw pe;
      const url0 = await uploadImg(nImg0);
      if (url0) { await supabase.from('product_images').insert([{product_id:prod.id,image_url:url0,is_primary:true,sort_order:0}]); await supabase.from('products').update({image_url:url0}).eq('id',prod.id); }
      for (const [f,ord] of [[nImg1,1],[nImg2,2]]) { if (f) { const u=await uploadImg(f); if (u) await supabase.from('product_images').insert([{product_id:prod.id,image_url:u,is_primary:false,sort_order:ord}]); } }
      setNProd({title:'',price:'',category:'Furniture',condition:'Like New',description:'',location:'',business_name:''});
      setNImg0(null); setNImg1(null); setNImg2(null);
      setAddMsg({type:'ok',text:'Listing published successfully!'});
      load();
    } catch(err) { setAddMsg({type:'err',text:err.message}); }
    finally { setAddBusy(false); }
  };

  const statusBadge = (s, map) => {
    const c = map[s] || map._default;
    return <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', background:c.bg, color:c.color }}>{c.label||s}</span>;
  };
  const parseAgentName = (msg) => { if (msg.agent_name) return msg.agent_name; const m=msg.content?.match(/^\[(.+?)\]/); return m?m[1]:null; };
  const stripAgentPrefix = (content) => content?.replace(/^\[.+?\]\s*/,'') || content;

  const statusConfig = {
    active:       { bg:'rgba(74,222,128,0.12)', color:'#4ade80', label:'Active'       },
    sold:         { bg:'rgba(96,165,250,0.12)', color:'#60a5fa', label:'Sold'         },
    pending:      { bg:'rgba(251,191,36,0.12)', color:'#fbbf24', label:'Pending'      },
    out_of_stock: { bg:'rgba(249,115,22,0.12)', color:'#fb923c', label:'Out of Stock' },
    _default:     { bg:'#1e2a3a',              color:'#aaa'                           },
  };

  // ── ThumbStrip ──
  const ThumbStrip = ({ product }) => {
    const [sel, setSel] = useState(0);
    const images = buildImages(product);
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'6px', alignItems:'center', flexShrink:0 }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'8px', overflow:'hidden', background:'#0e1117', border:'2px solid #1e2a3a', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {images[sel] ? <img src={images[sel]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'1.4rem' }}>📦</span>}
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          {images.map((img,idx) => (
            <button key={idx} onClick={() => setSel(idx)}
              style={{ width:'22px', height:'22px', borderRadius:'4px', overflow:'hidden', padding:0, border:`1.5px solid ${sel===idx?'#4dd4ac':'#1e2a3a'}`, cursor:'pointer', background:'#0e1117', opacity:sel===idx?1:0.5, transition:'all 0.15s' }}>
              <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── FileField with preview ──
  const FileField = ({ label, value, onChange, existingUrl=null }) => {
    const inputRef = useRef(null);
    const [prev, setPrev] = useState(existingUrl||null);
    useEffect(() => { if (!value) setPrev(existingUrl||null); }, [existingUrl, value]);
    const handleChange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      onChange(file); setPrev(URL.createObjectURL(file));
    };
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
        <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', margin:0 }}>{label}</p>
        <div onClick={() => inputRef.current?.click()}
          style={{ width:'100%', aspectRatio:'1', borderRadius:'10px', overflow:'hidden', background:'#0a1018', border:`2px dashed ${value?'#4dd4ac':prev?'#334155':'#1e2a3a'}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'border-color 0.2s', position:'relative' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='#4dd4ac'}
          onMouseLeave={e=>e.currentTarget.style.borderColor=value?'#4dd4ac':prev?'#334155':'#1e2a3a'}>
          {prev ? (
            <>
              <img src={prev} alt="preview" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.18)' }} />
              <div style={{ position:'absolute', top:'7px', right:'7px', background:'rgba(0,0,0,0.65)', borderRadius:'6px', padding:'3px 8px', fontSize:'10px', fontWeight:'700', color:'#fff' }}>Change</div>
              <div style={{ position:'absolute', bottom:'8px', left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.75)', borderRadius:'20px', padding:'3px 10px', fontSize:'10px', fontWeight:'700', color:value?'#4dd4ac':'#94a3b8', whiteSpace:'nowrap', maxWidth:'90%', overflow:'hidden', textOverflow:'ellipsis' }}>
                {value ? `✓ ${value.name}` : 'Current image'}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:'2rem', marginBottom:'5px', opacity:0.3 }}>📷</div>
              <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', fontWeight:'600' }}>Click to choose</span>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleChange} />
      </div>
    );
  };

  // ── Hamburger Icon ──
  const HamburgerIcon = ({ open }) => (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:'5px', width:'20px' }}>
      <span style={{
        display:'block', height:'2px', borderRadius:'2px', background:'#4dd4ac',
        width: open ? '20px' : '20px',
        transform: open ? 'translateY(7px) rotate(45deg)' : 'none',
        transition:'all 0.2s ease',
      }} />
      <span style={{
        display:'block', height:'2px', borderRadius:'2px', background:'#4dd4ac',
        width:'14px',
        opacity: open ? 0 : 1,
        transition:'all 0.2s ease',
      }} />
      <span style={{
        display:'block', height:'2px', borderRadius:'2px', background:'#4dd4ac',
        width: open ? '20px' : '20px',
        transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none',
        transition:'all 0.2s ease',
      }} />
    </div>
  );

  // ── Full Dropdown Menu Content ──
  const DropdownMenu = () => (
    <div style={{
      position:'absolute',
      top:'calc(100% + 6px)',
      left:0,
      width:'260px',
      background:'#0d1520',
      border:'2px solid #1e2a3a',
      borderRadius:'14px',
      zIndex:9999,
      overflow:'hidden',
      boxShadow:'0 20px 60px rgba(0,0,0,0.6)',
    }}>
      {/* Admin Panel Header inside dropdown */}
      <div style={{ padding:'14px 16px', borderBottom:'2px solid #1e2a3a', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:'linear-gradient(135deg,#4dd4ac,#1e7a5e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', flexShrink:0 }}>⚙</div>
        <div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'700', color:'#4dd4ac', lineHeight:1 }}>Admin Panel</div>
          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', marginTop:'2px' }}>Store Management</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding:'12px', borderBottom:'2px solid #1e2a3a' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          {[
            { v:stats.pending,  l:'PENDING',  c:'#fbbf24', bg:'rgba(251,191,36,0.08)'  },
            { v:stats.listings, l:'ACTIVE',   c:'#4dd4ac', bg:'rgba(77,212,172,0.08)'  },
            { v:stats.bookings, l:'BOOKINGS', c:'#60a5fa', bg:'rgba(96,165,250,0.08)'  },
            { v:stats.messages, l:'CHATS',    c:'#c084fc', bg:'rgba(192,132,252,0.08)' },
          ].map(s=>(
            <div key={s.l} style={{ padding:'10px 6px', borderRadius:'8px', textAlign:'center', background:s.bg, border:`1px solid ${s.c}22` }}>
              <div style={{ fontSize:'1.4rem', fontWeight:'800', color:s.c, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding:'8px' }}>
        {menuItems.map(item => (
          <button key={item.id}
            onClick={() => { setTab(item.id); setMenuOpen(false); }}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 13px', marginBottom:'2px', borderRadius:'9px',
              background: tab===item.id ? '#4dd4ac' : 'transparent',
              color: tab===item.id ? '#000' : '#4dd4ac',
              border:'none', cursor:'pointer', fontFamily:'inherit',
              fontSize:'0.87rem', fontWeight: tab===item.id ? '700' : '500',
              transition:'all 0.15s',
            }}
            onMouseEnter={e=>{ if(tab!==item.id) e.currentTarget.style.background='rgba(77,212,172,0.1)'; }}
            onMouseLeave={e=>{ if(tab!==item.id) e.currentTarget.style.background='transparent'; }}>
            <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span>{item.icon}</span>{item.label}
            </span>
            {item.count > 0 && (
              <span style={{ padding:'2px 7px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', background: tab===item.id ? 'rgba(0,0,0,0.2)' : 'rgba(77,212,172,0.15)', color: tab===item.id ? '#000' : '#4dd4ac' }}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer actions */}
      <div style={{ padding:'10px 12px', borderTop:'2px solid #1e2a3a', display:'flex', flexDirection:'column', gap:'7px' }}>
        <div style={{ display:'flex', gap:'7px' }}>
          <button
            onClick={() => { setShowDiag(p=>!p); setMenuOpen(false); }}
            style={{ flex:1, padding:'8px 10px', background:'rgba(96,165,250,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#60a5fa', cursor:'pointer', fontFamily:'inherit', fontSize:'0.76rem', fontWeight:'600' }}>
            🔍 {showDiag ? 'Hide' : 'Show'} Diag
          </button>
          <button
            onClick={() => { load(); setMenuOpen(false); }}
            style={{ flex:1, padding:'8px 10px', background:'rgba(77,212,172,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#4dd4ac', cursor:'pointer', fontFamily:'inherit', fontSize:'0.76rem', fontWeight:'600' }}>
            ↻ Refresh
          </button>
        </div>
        <button
          onClick={() => setView('home')}
          style={{ width:'100%', padding:'9px 12px', background:'transparent', border:'2px solid #1e2a3a', borderRadius:'9px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.82rem', fontWeight:'600', transition:'all 0.15s' }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor='#4dd4ac'; e.currentTarget.style.color='#4dd4ac'; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor='#1e2a3a'; e.currentTarget.style.color='rgba(255,255,255,0.4)'; }}>
          ← Back to Store
        </button>
      </div>
    </div>
  );

  // ── Mobile Layout ──
  if (isMobile) {
    return (
      <div style={{ background:'#090d14', minHeight:'100vh', color:'#fff' }}>
        {/* Mobile Topbar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'11px 14px', background:'#090d14', borderBottom:'2px solid #1e2a3a',
          position:'sticky', top:0, zIndex:500,
        }}>
          {/* Hamburger button + dropdown */}
          <div ref={menuRef} style={{ position:'relative' }}>
            <button
              onClick={() => setMenuOpen(p=>!p)}
              style={{
                display:'flex', alignItems:'center', justifyContent:'center',
                width:'40px', height:'40px',
                background: menuOpen ? 'rgba(77,212,172,0.15)' : '#0e1825',
                border: `2px solid ${menuOpen ? '#4dd4ac' : '#1e2a3a'}`,
                borderRadius:'10px', cursor:'pointer',
                transition:'all 0.2s',
              }}
              aria-label="Toggle menu">
              <HamburgerIcon open={menuOpen} />
            </button>

            {menuOpen && <DropdownMenu />}
          </div>

          {/* Current tab label (center) */}
          <span style={{ fontSize:'0.92rem', fontWeight:'700', color:'#4dd4ac', flex:1, textAlign:'center' }}>
            {menuItems.find(m=>m.id===tab)?.icon} {menuItems.find(m=>m.id===tab)?.label}
          </span>

          {/* Right side placeholder for balance */}
          <div style={{ width:'40px' }} />
        </div>

        {/* Backdrop */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:498, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(2px)' }}
          />
        )}

        {/* Main Content */}
        <main style={{ padding:'16px 14px' }}>
          <div style={{ maxWidth:'1080px', margin:'0 auto' }}>
            {showDiag && (
              <div style={{ marginBottom:'24px', background:'#0a1018', border:'2px solid #1e3a5f', borderRadius:'10px', padding:'16px' }}>
                <p style={{ fontWeight:'700', color:'#60a5fa', marginBottom:'12px', fontSize:'0.85rem' }}>🔍 Database Query Results</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {diag.length===0
                    ? <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem' }}>No data yet — click Refresh</p>
                    : diag.map((d,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'8px 12px', borderRadius:'6px', background:d.ok?'rgba(77,212,172,0.06)':'rgba(239,68,68,0.1)', flexWrap:'wrap' }}>
                        <span>{d.ok?'✅':'❌'}</span>
                        <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.82rem', flex:1, minWidth:'80px' }}>{d.label}</span>
                        <span style={{ color:d.ok?'#4dd4ac':'#fca5a5', fontSize:'0.82rem', fontWeight:'700' }}>{d.ok?`${d.count} rows`:`ERROR: ${d.error}`}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {tab==='pending' && (
              <div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>Pending Submissions</h2>
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Review products submitted by sellers — approve to publish or reject to remove</p>
                {pending.length===0 ? <Empty icon="✅" title="All caught up!" sub="No pending submissions right now." />
                  : pending.map(p=>(
                    <Card key={p.id} color="#fbbf24">
                      <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                        <ThumbStrip product={p} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px', flexWrap:'wrap', gap:'6px' }}>
                            <h3 style={{ fontWeight:'700', color:'#4dd4ac', margin:0, fontSize:'1rem', wordBreak:'break-word', flex:1 }}>{p.title}</h3>
                            <span style={{ background:'rgba(251,191,36,0.12)', color:'#fbbf24', padding:'3px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', flexShrink:0 }}>PENDING</span>
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
                        <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
                          <Btn color="#16a34a" hover="#15803d" disabled={!!actionBusy[p.id]} onClick={()=>approve(p)}>{actionBusy[p.id]==='approve'?'⏳ Approving…':'✓ Approve'}</Btn>
                          <Btn color="#dc2626" hover="#b91c1c" disabled={!!actionBusy[p.id]} onClick={()=>reject(p)}>{actionBusy[p.id]==='reject'?'⏳ Rejecting…':'✗ Reject'}</Btn>
                          <Btn color="#60a5fa" hover="#3b82f6" onClick={()=>openEdit(p)}>✎ Edit</Btn>
                        </div>
                      </div>
                    </Card>
                  ))
                }
              </div>
            )}

            {tab==='listings' && (
              <div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>All Listings</h2>
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Active and sold products — edit or delete any listing</p>
                {listings.length===0 ? <Empty icon="📦" title="No listings yet" sub="Add one using the Add Listing tab." />
                  : listings.map(p=>(
                    <Card key={p.id}>
                      <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                        <ThumbStrip product={p} />
                        <div style={{ flex:1 }}>
                          <h3 style={{ fontWeight:'700', color:'#4dd4ac', margin:'0 0 4px', fontSize:'0.95rem', wordBreak:'break-word' }}>{p.title}</h3>
                          <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', margin:'0 0 2px' }}>{p.category} · {p.condition} · <span style={{ color:'#4dd4ac', fontWeight:'700' }}>${p.price}</span></p>
                          <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', margin:'0 0 8px' }}>{p.location} · {p.business_name}</p>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                            {statusBadge(p.status, statusConfig)}
                            <OutlineBtn color="#60a5fa" onClick={()=>openEdit(p)}>✎ Edit</OutlineBtn>
                            <OutlineBtn color="#ff6b6b" onClick={()=>deleteProd(p.id)}>✕ Delete</OutlineBtn>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                }
              </div>
            )}

            {tab==='add' && (
              <div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>Add Listing</h2>
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Publish a new product directly to the store</p>
                {/* Add listing form content goes here */}
              </div>
            )}

            {tab==='bookings' && (
              <div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>Bookings</h2>
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Manage customer bookings and appointments</p>
                {bookings.length===0 ? <Empty icon="📅" title="No bookings yet" sub="Bookings will appear here." />
                  : bookings.map(b=>(
                    <Card key={b.id}>
                      <p style={{ color:'#4dd4ac', fontWeight:'700', margin:'0 0 4px' }}>{b.product_title || b.product_id}</p>
                      <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.8rem', margin:'0 0 8px' }}>{b.customer_name} · {new Date(b.created_at).toLocaleDateString()}</p>
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        {statusBadge(b.status, statusConfig)}
                        <OutlineBtn color="#4dd4ac" onClick={()=>updateBooking(b.id,'confirmed')}>Confirm</OutlineBtn>
                        <OutlineBtn color="#ff6b6b" onClick={()=>updateBooking(b.id,'cancelled')}>Cancel</OutlineBtn>
                      </div>
                    </Card>
                  ))
                }
              </div>
            )}

            {tab==='messages' && (
              <div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>Messages</h2>
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Agent conversations with customers</p>
                {convs.length===0 ? <Empty icon="💬" title="No conversations yet" sub="Customer messages will appear here." />
                  : convs.map(cv=>(
                    <Card key={cv.id} color={selConv?.id===cv.id?'#4dd4ac':'#1e2a3a'}>
                      <button onClick={()=>loadMsgs(cv)} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0, color:'inherit' }}>
                        <p style={{ color:'#4dd4ac', fontWeight:'700', margin:'0 0 2px', fontSize:'0.9rem' }}>Conversation #{cv.id?.slice(0,8)}</p>
                        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.75rem', margin:0 }}>{new Date(cv.last_message_at).toLocaleString()}</p>
                      </button>
                    </Card>
                  ))
                }
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Desktop Layout ──
  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        .adm-sb::-webkit-scrollbar{width:4px}.adm-sb::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:4px}
        .adm-in::placeholder{color:rgba(255,255,255,0.22)}.adm-in option{background:#111}
        .adm-nav:hover{background:rgba(77,212,172,0.1)!important}
        .agent-option:hover{background:rgba(77,212,172,0.1)!important}
        .adm-root   { display:flex; flex-direction:column; min-height:100vh; background:#090d14; color:#fff; font-family:'Poppins',-apple-system,sans-serif; }
        .adm-body   { display:flex; flex:1; min-height:0; }
        .adm-sidebar{ width:252px; min-width:252px; border-right:2px solid #1e2a3a; display:flex; flex-direction:column; overflow-y:auto; background:#090d14; position:sticky; top:0; max-height:100vh; }
        .adm-main   { flex:1; overflow-y:auto; padding:28px 32px; min-width:0; }
        .sidebar-header { padding:24px 20px 18px; border-bottom:2px solid #1e2a3a; }
      `}</style>

      <div className="adm-root">
        <div className="adm-body">
          <aside className="adm-sidebar adm-sb">
            <div className="sidebar-header">
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'3px' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'7px', background:'linear-gradient(135deg,#4dd4ac,#1e7a5e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>⚙</div>
                <span style={{ fontFamily:'Georgia,serif', fontSize:'1.15rem', fontWeight:'700', color:'#4dd4ac' }}>Admin Panel</span>
              </div>
              <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', marginLeft:'40px' }}>Store Management</p>
            </div>

            {/* Stats */}
            <div style={{ padding:'14px', borderBottom:'2px solid #1e2a3a' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                {[
                  { v:stats.pending,  l:'PENDING',  c:'#fbbf24', bg:'rgba(251,191,36,0.08)'  },
                  { v:stats.listings, l:'ACTIVE',   c:'#4dd4ac', bg:'rgba(77,212,172,0.08)'  },
                  { v:stats.bookings, l:'BOOKINGS', c:'#60a5fa', bg:'rgba(96,165,250,0.08)'  },
                  { v:stats.messages, l:'CHATS',    c:'#c084fc', bg:'rgba(192,132,252,0.08)' },
                ].map(s=>(
                  <div key={s.l} style={{ padding:'10px 6px', borderRadius:'8px', textAlign:'center', background:s.bg, border:`1px solid ${s.c}22` }}>
                    <div style={{ fontSize:'1.5rem', fontWeight:'800', color:s.c, lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav */}
            <nav style={{ padding:'10px', flex:1 }}>
              {menuItems.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)} className="adm-nav"
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 13px', marginBottom:'3px', borderRadius:'9px', background:tab===item.id?'#4dd4ac':'transparent', color:tab===item.id?'#000':'#4dd4ac', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'0.85rem', fontWeight:tab===item.id?'700':'500', transition:'all 0.15s' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'10px' }}><span>{item.icon}</span>{item.label}</span>
                  {item.count > 0 && <span style={{ padding:'2px 7px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', background:tab===item.id?'rgba(0,0,0,0.2)':'rgba(77,212,172,0.15)', color:tab===item.id?'#000':'#4dd4ac' }}>{item.count}</span>}
                </button>
              ))}
            </nav>

            {/* Footer */}
            <div style={{ padding:'12px 14px', borderTop:'2px solid #1e2a3a', display:'flex', flexDirection:'column', gap:'8px' }}>
              <button onClick={()=>setShowDiag(p=>!p)}
                style={{ padding:'7px 12px', background:'rgba(96,165,250,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#60a5fa', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:'600' }}>
                🔍 {showDiag?'Hide':'Show'} Diag
              </button>
              <button onClick={load}
                style={{ padding:'7px 12px', background:'rgba(77,212,172,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#4dd4ac', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:'600' }}>
                ↻ Refresh
              </button>
              <button onClick={()=>setView('home')}
                style={{ padding:'9px 12px', background:'transparent', border:'2px solid #1e2a3a', borderRadius:'9px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.82rem', fontWeight:'600', transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#4dd4ac';e.currentTarget.style.color='#4dd4ac';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e2a3a';e.currentTarget.style.color='rgba(255,255,255,0.4)';}}>
                ← Back to Store
              </button>
            </div>
          </aside>

          <main className="adm-main adm-sb">
            <div style={{ maxWidth:'1080px', margin:'0 auto' }}>
              {/* Desktop tab content goes here */}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

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
      onMouseEnter={()=>{ if(!disabled) setHov(true); }} onMouseLeave={()=>setHov(false)}
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
