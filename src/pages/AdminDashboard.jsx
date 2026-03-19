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

  // Close dropdowns when clicking outside
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

  // ── Sidebar nav content — reused in both desktop sidebar and mobile dropdown ──
  const SidebarNav = ({ inDropdown=false }) => (
    <>
      {/* Stats grid */}
      <div style={{ padding: inDropdown ? '10px 12px' : '14px', borderBottom:'2px solid #1e2a3a' }}>
        <div style={{ display:'grid', gridTemplateColumns: inDropdown ? 'repeat(4,1fr)' : '1fr 1fr', gap: inDropdown ? '6px' : '8px' }}>
          {[
            { v:stats.pending,  l:'PENDING',  c:'#fbbf24', bg:'rgba(251,191,36,0.08)'  },
            { v:stats.listings, l:'ACTIVE',   c:'#4dd4ac', bg:'rgba(77,212,172,0.08)'  },
            { v:stats.bookings, l:'BOOKINGS', c:'#60a5fa', bg:'rgba(96,165,250,0.08)'  },
            { v:stats.messages, l:'CHATS',    c:'#c084fc', bg:'rgba(192,132,252,0.08)' },
          ].map(s=>(
            <div key={s.l} style={{ padding: inDropdown ? '7px 4px' : '10px 6px', borderRadius:'8px', textAlign:'center', background:s.bg, border:`1px solid ${s.c}22` }}>
              <div style={{ fontSize: inDropdown ? '1.1rem' : '1.5rem', fontWeight:'800', color:s.c, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: inDropdown ? '8px 10px' : '10px', flex: inDropdown ? 'none' : 1 }}>
        {menuItems.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setMenuOpen(false); }} className="adm-nav"
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding: inDropdown ? '11px 14px' : '9px 13px', marginBottom:'3px', borderRadius:'9px', background:tab===item.id?'#4dd4ac':'transparent', color:tab===item.id?'#000':'#4dd4ac', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize: inDropdown ? '0.92rem' : '0.85rem', fontWeight:tab===item.id?'700':'500', transition:'all 0.15s' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'10px' }}><span>{item.icon}</span>{item.label}</span>
            {item.count > 0 && <span style={{ padding:'2px 7px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', background:tab===item.id?'rgba(0,0,0,0.2)':'rgba(77,212,172,0.15)', color:tab===item.id?'#000':'#4dd4ac' }}>{item.count}</span>}
          </button>
        ))}
      </nav>

      {/* Footer actions */}
      <div style={{ padding: inDropdown ? '10px 14px' : '12px 14px', borderTop:'2px solid #1e2a3a', display:'flex', flexDirection: inDropdown ? 'row' : 'column', flexWrap:'wrap', gap:'8px' }}>
        <button onClick={()=>{ setShowDiag(p=>!p); setMenuOpen(false); }}
          style={{ flex: inDropdown ? 1 : 'none', padding:'7px 12px', background:'rgba(96,165,250,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#60a5fa', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:'600', whiteSpace:'nowrap' }}>
          🔍 {showDiag?'Hide':'Show'} Diag
        </button>
        <button onClick={()=>{ load(); setMenuOpen(false); }}
          style={{ flex: inDropdown ? 1 : 'none', padding:'7px 12px', background:'rgba(77,212,172,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#4dd4ac', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:'600', whiteSpace:'nowrap' }}>
          ↻ Refresh
        </button>
        <button onClick={()=>setView('home')}
          style={{ flex: inDropdown ? 1 : 'none', padding:'9px 12px', background:'transparent', border:'2px solid #1e2a3a', borderRadius:'9px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.82rem', fontWeight:'600', whiteSpace:'nowrap', transition:'all 0.15s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#4dd4ac';e.currentTarget.style.color='#4dd4ac';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e2a3a';e.currentTarget.style.color='rgba(255,255,255,0.4)';}}>
          ← Back to Store
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        .adm-sb::-webkit-scrollbar{width:4px}.adm-sb::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:4px}
        .adm-in::placeholder{color:rgba(255,255,255,0.22)}.adm-in option{background:#111}
        .adm-nav:hover{background:rgba(77,212,172,0.1)!important}
        .agent-option:hover{background:rgba(77,212,172,0.1)!important}

        /* Layout */
        .adm-root   { display:flex; flex-direction:column; min-height:100vh; background:#090d14; color:#fff; font-family:'Poppins',-apple-system,sans-serif; }
        .adm-body   { display:flex; flex:1; min-height:0; }
        .adm-sidebar{ width:252px; min-width:252px; border-right:2px solid #1e2a3a; display:flex; flex-direction:column; overflow-y:auto; background:#090d14; position:sticky; top:0; max-height:100vh; }
        .adm-main   { flex:1; overflow-y:auto; padding:28px 32px; min-width:0; }

        /* Desktop sidebar header — only shown in sidebar, not dropdown */
        .sidebar-header { padding:24px 20px 18px; border-bottom:2px solid #1e2a3a; }

        /* Mobile topbar — hidden on desktop */
        .adm-topbar { display:none; }

        /* Dropdown — hidden by default, shown when .open */
        .adm-dropdown {
          position:absolute;
          top:100%;
          left:0;
          right:0;
          background:#0d1520;
          border:2px solid #1e2a3a;
          border-top:none;
          border-radius:0 0 16px 16px;
          z-index:9999;
          box-shadow:0 16px 48px rgba(0,0,0,0.8);
          max-height:80vh;
          overflow-y:auto;
          transform-origin:top center;
          transform:scaleY(0);
          opacity:0;
          pointer-events:none;
          transition:transform 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease;
        }
        .adm-dropdown.open {
          transform:scaleY(1);
          opacity:1;
          pointer-events:auto;
        }
        .adm-dropdown::-webkit-scrollbar{width:4px}
        .adm-dropdown::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:4px}

        /* Force mobile styles */
        @media (max-width:768px) {
          .adm-topbar  { 
            display: flex !important; 
            align-items: center; 
            justify-content: space-between; 
            padding: 11px 14px; 
            background: #090d14; 
            border-bottom: 2px solid #1e2a3a; 
            position: sticky; 
            top: 0; 
            z-index: 500; 
            flex-shrink: 0; 
            gap: 10px; 
          }
          .adm-sidebar { 
            display: none !important; 
          }
          .adm-main    { 
            padding: 16px 14px !important; 
          }
          .mob-col     { flex-direction:column !important; }
          .mob-acts    { flex-direction:row !important; flex-wrap:wrap !important; }
          .mob-lst-acts{ width:100% !important; flex-wrap:wrap !important; justify-content:flex-start !important; }
          .mob-form2   { grid-template-columns:1fr !important; }
          .mob-img3    { grid-template-columns:1fr 1fr !important; }
          .mob-edit2   { grid-template-columns:1fr !important; }
          .mob-edit-imgs{ grid-template-columns:1fr 1fr !important; }
          .mob-msg-grid{ grid-template-columns:1fr !important; height:auto !important; }
          .mob-conv    { height:220px !important; }
          .mob-chat    { height:460px !important; }
        }
      `}</style>

      {/* ══ MOBILE TOPBAR ══ */}
      <div className="adm-topbar">
        {/* Menu button + dropdown — wrapped in ref for outside-click detection */}
        <div ref={menuRef} style={{ position:'relative' }}>
          <button
            onClick={() => setMenuOpen(p=>!p)}
            style={{ display:'flex', alignItems:'center', gap:'8px', background:menuOpen?'#4dd4ac':'#1e2a3a', border:'none', borderRadius:'9px', padding:'9px 14px', cursor:'pointer', color:menuOpen?'#000':'#4dd4ac', fontFamily:'inherit', fontSize:'0.87rem', fontWeight:'700', transition:'all 0.2s', whiteSpace:'nowrap' }}>
            <span style={{ fontSize:'1rem' }}>{menuOpen ? '✕' : '☰'}</span>
            Menu
            {stats.pending > 0 && !menuOpen && (
              <span style={{ background:'#ef4444', color:'#fff', borderRadius:'10px', padding:'1px 6px', fontSize:'9px', fontWeight:'800', lineHeight:'14px' }}>{stats.pending}</span>
            )}
          </button>

          {/* ── Dropdown panel ── */}
          <div className={`adm-dropdown${menuOpen?' open':''}`}>
            <SidebarNav inDropdown />
          </div>
        </div>

        {/* Current tab name */}
        <span style={{ fontFamily:'Georgia,serif', fontSize:'0.92rem', fontWeight:'700', color:'#4dd4ac', flex:1, textAlign:'center' }}>
          {menuItems.find(m=>m.id===tab)?.icon} {menuItems.find(m=>m.id===tab)?.label}
        </span>

        {/* Back to store */}
        <button onClick={()=>setView('home')}
          style={{ background:'transparent', border:'1px solid #1e2a3a', borderRadius:'7px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.74rem', padding:'6px 10px', fontWeight:'600', whiteSpace:'nowrap' }}>
          ← Store
        </button>
      </div>

      {/* Backdrop — closes dropdown when tapping outside */}
      {menuOpen && (
        <div onClick={()=>setMenuOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:498, background:'rgba(0,0,0,0.45)' }} />
      )}

      <div className="adm-root">
        <div className="adm-body">

          {/* ══ DESKTOP SIDEBAR ══ */}
          <aside className="adm-sidebar adm-sb">
            {/* Header only in desktop sidebar */}
            <div className="sidebar-header">
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'3px' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'7px', background:'linear-gradient(135deg,#4dd4ac,#1e7a5e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>⚙</div>
                <span style={{ fontFamily:'Georgia,serif', fontSize:'1.15rem', fontWeight:'700', color:'#4dd4ac' }}>Admin Panel</span>
              </div>
              <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', marginLeft:'40px' }}>Store Management</p>
            </div>
            <SidebarNav />
          </aside>

          {/* ══ MAIN CONTENT ══ */}
          <main className="adm-main adm-sb">
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

              {/* ════ PENDING ════ */}
              {tab==='pending' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>Pending Submissions</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Review products submitted by sellers — approve to publish or reject to remove</p>
                  {pending.length===0 ? <Empty icon="✅" title="All caught up!" sub="No pending submissions right now." />
                    : pending.map(p=>(
                      <Card key={p.id} color="#fbbf24">
                        <div className="mob-col" style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
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
                          <div className="mob-acts" style={{ display:'flex', flexDirection:'column', gap:'7px', flexShrink:0 }}>
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

              {/* ════ LISTINGS ════ */}
              {tab==='listings' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>All Listings</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Active and sold products — edit or delete any listing</p>
                  {listings.length===0 ? <Empty icon="📦" title="No listings yet" sub="Add one using the Add Listing tab." />
                    : listings.map(p=>(
                      <Card key={p.id}>
                        <div style={{ display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
                          <ThumbStrip product={p} />
                          <div style={{ flex:1, minWidth:'120px' }}>
                            <h3 style={{ fontWeight:'700', color:'#4dd4ac', margin:'0 0 4px', fontSize:'0.95rem', wordBreak:'break-word' }}>{p.title}</h3>
                            <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', margin:'0 0 2px' }}>{p.category} · {p.condition} · <span style={{ color:'#4dd4ac', fontWeight:'700' }}>${p.price}</span></p>
                            <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', margin:0 }}>{p.location} · {p.business_name}</p>
                          </div>
                          <div className="mob-lst-acts" style={{ display:'flex', alignItems:'center', gap:'10px' }}>
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
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>Add New Listing</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Admin-created listings go live immediately — no approval required</p>
                  {addMsg.text && (
                    <div style={{ padding:'12px 16px', marginBottom:'16px', borderRadius:'8px', background:addMsg.type==='ok'?'rgba(77,212,172,0.08)':'rgba(239,68,68,0.08)', borderLeft:`4px solid ${addMsg.type==='ok'?'#4dd4ac':'#ef4444'}`, color:addMsg.type==='ok'?'#4dd4ac':'#fca5a5', fontSize:'0.85rem' }}>
                      {addMsg.type==='ok'?'✅ ':'❌ '}{addMsg.text}
                    </div>
                  )}
                  <form onSubmit={addListing} style={{ background:'#151c27', border:'2px solid #1e2a3a', borderRadius:'12px', padding:'24px' }}>
                    <div className="mob-form2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
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
                      <div className="mob-img3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                        <FileField label="Main Image *"              value={nImg0} onChange={setNImg0} />
                        <FileField label="Detail Image 1 (optional)" value={nImg1} onChange={setNImg1} />
                        <FileField label="Detail Image 2 (optional)" value={nImg2} onChange={setNImg2} />
                      </div>
                    </div>
                    <button type="submit" disabled={addBusy}
                      style={{ width:'100%', padding:'11px 32px', background:addBusy?'#2a6e5a':'#4dd4ac', color:'#000', border:'none', borderRadius:'8px', cursor:addBusy?'not-allowed':'pointer', fontWeight:'700', fontFamily:'inherit', fontSize:'0.9rem' }}>
                      {addBusy?'⏳ Publishing…':'🚀 Publish Listing'}
                    </button>
                  </form>
                </div>
              )}

              {/* ════ BOOKINGS ════ */}
              {tab==='bookings' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>Bookings</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Agent booking requests submitted via the Book An Agent form</p>
                  {bookings.length===0 ? <Empty icon="📅" title="No bookings yet" sub="Bookings from the Book An Agent form will appear here." />
                    : bookings.map(b=>(
                      <Card key={b.id} color={b.status==='pending'?'#fbbf24':b.status==='confirmed'?'#4dd4ac':'#60a5fa'}>
                        <div className="mob-col" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                              <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'linear-gradient(135deg,#4dd4ac22,#1e2a3a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>👤</div>
                              <div style={{ minWidth:0 }}>
                                <p style={{ fontWeight:'700', color:'#fff', margin:0, fontSize:'0.95rem' }}>{b.name}</p>
                                <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)', margin:0, wordBreak:'break-all' }}>{b.email} · {b.phone}</p>
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
                            {statusBadge(b.status||'pending', { pending:{bg:'rgba(251,191,36,0.12)',color:'#fbbf24',label:'Pending'}, confirmed:{bg:'rgba(77,212,172,0.12)',color:'#4dd4ac',label:'Confirmed'}, completed:{bg:'rgba(96,165,250,0.12)',color:'#60a5fa',label:'Completed'}, cancelled:{bg:'rgba(239,68,68,0.12)',color:'#f87171',label:'Cancelled'}, _default:{bg:'#1e2a3a',color:'#aaa'} })}
                            {(!b.status||b.status==='pending') && (
                              <div style={{ display:'flex', gap:'6px', marginTop:'4px', flexWrap:'wrap' }}>
                                <Btn color="#16a34a" hover="#15803d" onClick={()=>updateBooking(b.id,'confirmed')}>✓ Confirm</Btn>
                                <Btn color="#dc2626" hover="#b91c1c" onClick={()=>updateBooking(b.id,'cancelled')}>✗ Cancel</Btn>
                              </div>
                            )}
                            {b.status==='confirmed' && <Btn color="#60a5fa" hover="#3b82f6" onClick={()=>updateBooking(b.id,'completed')}>✔ Mark Done</Btn>}
                          </div>
                        </div>
                      </Card>
                    ))
                  }
                </div>
              )}

              {/* ════ MESSAGES ════ */}
              {tab==='messages' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,5vw,1.7rem)', color:'#4dd4ac', marginBottom:'6px' }}>Messages</h2>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginBottom:'20px' }}>Conversations from the seller/buyer support chat — reply as any agent</p>
                  <div className="mob-msg-grid" style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'14px', height:'580px' }}>

                    <div className="mob-conv" style={{ border:'2px solid #1e2a3a', borderRadius:'12px', overflow:'hidden', display:'flex', flexDirection:'column', background:'#151c27' }}>
                      <div style={{ padding:'12px 14px', background:'#4dd4ac', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontWeight:'700', fontSize:'0.85rem', color:'#000' }}>💬 Conversations</span>
                        <span style={{ background:'rgba(0,0,0,0.15)', color:'#000', borderRadius:'20px', padding:'1px 8px', fontSize:'10px', fontWeight:'700' }}>{convs.length}</span>
                      </div>
                      <div className="adm-sb" style={{ flex:1, overflowY:'auto' }}>
                        {convs.length===0
                          ? <p style={{ padding:'20px', textAlign:'center', fontSize:'0.8rem', color:'rgba(255,255,255,0.3)' }}>No conversations yet</p>
                          : convs.map(c=>(
                            <button key={c.id} onClick={()=>loadMsgs(c)}
                              style={{ width:'100%', padding:'12px 14px', textAlign:'left', background:selConv?.id===c.id?'rgba(77,212,172,0.12)':'transparent', borderLeft:`3px solid ${selConv?.id===c.id?'#4dd4ac':'transparent'}`, borderBottom:'1px solid #1e2a3a', border:'none', cursor:'pointer', display:'block', transition:'background 0.15s' }}
                              onMouseEnter={e=>{ if(selConv?.id!==c.id) e.currentTarget.style.background='rgba(77,212,172,0.06)'; }}
                              onMouseLeave={e=>{ if(selConv?.id!==c.id) e.currentTarget.style.background='transparent'; }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
                                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#1e2a3a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', flexShrink:0 }}>👤</div>
                                <div style={{ minWidth:0 }}>
                                  <p style={{ fontWeight:'600', fontSize:'0.82rem', color:'#fff', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.user_id?`User ${c.user_id.slice(0,8)}`:'Unknown'}</p>
                                  <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)', margin:'1px 0 0' }}>{new Date(c.last_message_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        }
                      </div>
                    </div>

                    <div className="mob-chat" style={{ border:'2px solid #1e2a3a', borderRadius:'12px', overflow:'hidden', display:'flex', flexDirection:'column', background:'#151c27' }}>
                      {selConv ? (
                        <>
                          <div style={{ padding:'12px 18px', background:'#4dd4ac', display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'rgba(0,0,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>👤</div>
                            <div>
                              <p style={{ fontWeight:'700', fontSize:'0.85rem', color:'#000', margin:0 }}>User {selConv.user_id?.slice(0,8)}</p>
                              <p style={{ fontSize:'10px', color:'rgba(0,0,0,0.5)', margin:0 }}>Active conversation</p>
                            </div>
                          </div>
                          <div className="adm-sb" style={{ flex:1, overflowY:'auto', padding:'18px', display:'flex', flexDirection:'column', gap:'10px', background:'#0a1018' }}>
                            {msgs.length===0
                              ? <div style={{ textAlign:'center', color:'rgba(255,255,255,0.2)', margin:'auto' }}><p style={{ fontSize:'1.8rem' }}>💬</p><p style={{ fontSize:'0.82rem' }}>No messages in this conversation</p></div>
                              : msgs.map((m,i)=>{
                                const agentLabel    = m.is_agent ? parseAgentName(m) : null;
                                const displayContent = m.is_agent ? stripAgentPrefix(m.content) : m.content;
                                return (
                                  <div key={i} style={{ display:'flex', justifyContent:m.is_agent?'flex-start':'flex-end' }}>
                                    <div style={{ maxWidth:'80%' }}>
                                      {m.is_agent && agentLabel && (
                                        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                                          <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'linear-gradient(135deg,#4dd4ac,#2a9d7c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', flexShrink:0 }}>{AGENTS.find(a=>a.name===agentLabel)?.avatar||'🤝'}</div>
                                          <span style={{ fontSize:'10px', fontWeight:'700', color:'#4dd4ac' }}>{agentLabel}</span>
                                        </div>
                                      )}
                                      <div style={{ padding:'10px 14px', borderRadius:'10px', background:m.is_agent?'#1d4b39':'#1e2b27', color:'#e0f5ef', borderTopLeftRadius:m.is_agent?'2px':'10px', borderTopRightRadius:m.is_agent?'10px':'2px' }}>
                                        {!m.is_agent && <p style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', margin:'0 0 4px' }}>User</p>}
                                        <p style={{ fontSize:'0.85rem', lineHeight:1.5, whiteSpace:'pre-wrap', margin:0, wordBreak:'break-word' }}>{displayContent}</p>
                                        <p style={{ fontSize:'10px', color:'rgba(224,245,239,0.35)', margin:'5px 0 0' }}>{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            }
                            <div ref={msgsEnd} />
                          </div>
                          <div style={{ padding:'12px 14px', borderTop:'2px solid #1e2a3a', background:'#131920' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                              <span style={{ fontSize:'0.72rem', fontWeight:'600', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>Replying as:</span>
                              <div ref={agentPickerRef} style={{ position:'relative', flex:1, minWidth:0 }}>
                                <button onClick={e=>{e.stopPropagation();setShowAgentPicker(p=>!p);}}
                                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'8px', padding:'7px 12px', background:'#1a2230', border:`1.5px solid ${showAgentPicker?'#4dd4ac':'#1e2a3a'}`, borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', minWidth:0 }}>
                                  <span style={{ fontSize:'1rem', flexShrink:0 }}>{selectedAgent.avatar}</span>
                                  <span style={{ flex:1, textAlign:'left', fontSize:'0.82rem', fontWeight:'600', color:'#4dd4ac', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selectedAgent.name}</span>
                                  <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.06)', padding:'2px 7px', borderRadius:'10px', flexShrink:0 }}>{selectedAgent.type}</span>
                                  <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:selectedAgent.online?'#22c55e':'#475569', flexShrink:0 }} />
                                  <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.8rem', flexShrink:0 }}>{showAgentPicker?'▲':'▼'}</span>
                                </button>
                                {showAgentPicker && (
                                  <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, right:0, background:'#151c27', border:'2px solid #1e2a3a', borderRadius:'10px', overflow:'hidden', zIndex:9999, boxShadow:'0 -8px 24px rgba(0,0,0,0.5)' }}>
                                    <div style={{ padding:'8px 12px', borderBottom:'1px solid #1e2a3a', fontSize:'0.72rem', fontWeight:'700', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Choose Agent</div>
                                    {AGENTS.map(agent=>(
                                      <button key={agent.name} className="agent-option"
                                        onClick={e=>{e.stopPropagation();setSelectedAgent(agent);setShowAgentPicker(false);}}
                                        style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:selectedAgent.name===agent.name?'rgba(77,212,172,0.12)':'transparent', border:'none', borderBottom:'1px solid #1e2a3a', cursor:'pointer', fontFamily:'inherit' }}>
                                        <span style={{ fontSize:'1.1rem' }}>{agent.avatar}</span>
                                        <div style={{ flex:1, textAlign:'left' }}>
                                          <div style={{ fontSize:'0.83rem', fontWeight:'600', color:selectedAgent.name===agent.name?'#4dd4ac':'#fff' }}>{agent.name}</div>
                                          <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', textTransform:'capitalize' }}>{agent.type} account</div>
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                                          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:agent.online?'#22c55e':'#475569' }} />
                                          <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.28)' }}>{agent.online?'Online':'Offline'}</span>
                                        </div>
                                        {selectedAgent.name===agent.name && <span style={{ color:'#4dd4ac', fontSize:'0.8rem' }}>✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ display:'flex', gap:'8px' }}>
                              <input value={replyText} onChange={e=>setReplyText(e.target.value)}
                                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendReply();}}}
                                placeholder={`Message as ${selectedAgent.name}…`} className="adm-in"
                                style={{ flex:1, background:'#1a2230', border:'1.5px solid #1e2a3a', borderRadius:'8px', color:'#fff', fontFamily:'inherit', fontSize:'0.875rem', padding:'10px 14px', outline:'none', minWidth:0 }}
                                onFocus={e=>e.target.style.borderColor='#4dd4ac'}
                                onBlur={e=>e.target.style.borderColor='#1e2a3a'} />
                              <button onClick={sendReply}
                                style={{ padding:'10px 22px', background:replyText.trim()?'#4dd4ac':'#1e2a3a', color:replyText.trim()?'#000':'rgba(255,255,255,0.2)', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0 }}
                                onMouseEnter={e=>{e.currentTarget.style.background=replyText.trim()?'#3bc495':'#253040';}}
                                onMouseLeave={e=>{e.currentTarget.style.background=replyText.trim()?'#4dd4ac':'#1e2a3a';}}>
                                Send
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'rgba(255,255,255,0.18)' }}>
                          <p style={{ fontSize:'2.5rem', marginBottom:'8px' }}>💬</p>
                          <p style={{ fontSize:'0.85rem' }}>Select a conversation</p>
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
          <div className="adm-sb" style={{ width:'100%', maxWidth:'660px', background:'#151c27', border:'2px solid #1e2a3a', borderRadius:'14px', padding:'26px', maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
              <div>
                <h3 style={{ fontFamily:'Georgia,serif', fontSize:'1.3rem', color:'#4dd4ac', margin:0 }}>Edit Listing</h3>
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', margin:'3px 0 0' }}>ID: {editProd.id.slice(0,8)}</p>
              </div>
              <button onClick={()=>setEditOpen(false)} style={{ fontSize:'1.6rem', color:'rgba(255,255,255,0.3)', background:'none', border:'none', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <div className="mob-edit2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'13px', marginBottom:'13px' }}>
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
                    {STATUSES.map(s=><option key={s} value={s}>{s==='active'?'Active — visible to buyers':s==='sold'?'Sold — marked as sold':s==='pending'?'Pending — awaiting review':'Out of Stock — temporarily unavailable'}</option>)}
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
              <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.4)', marginBottom:'12px' }}>📷 Images — click a slot to replace</p>
              <div className="mob-edit-imgs" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                <FileField label="Main Image" value={eImg0} onChange={setEImg0} existingUrl={editExistingImgs[0]} />
                <FileField label="Detail 1"   value={eImg1} onChange={setEImg1} existingUrl={editExistingImgs[1]} />
                <FileField label="Detail 2"   value={eImg2} onChange={setEImg2} existingUrl={editExistingImgs[2]} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', flexWrap:'wrap' }}>
              <OutlineBtn color="rgba(255,255,255,0.3)" onClick={()=>setEditOpen(false)}>Cancel</OutlineBtn>
              <button onClick={saveEdit} disabled={editBusy}
                style={{ padding:'10px 26px', background:editBusy?'#2a6e5a':'#4dd4ac', color:'#000', border:'none', borderRadius:'8px', cursor:editBusy?'not-allowed':'pointer', fontWeight:'700', fontFamily:'inherit' }}>
                {editBusy?'⏳ Saving…':'💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
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
