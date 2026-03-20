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

  const CATS  = ['Furniture','Electronics','Appliances','For Kids','Decor','Kitchenware','Household'];
  const CONDS = ['Brand New','Like New','Excellent','Good','Fair','For Parts'];
  const IS    = { background:'#0e1117', border:'2px solid #1e2a3a', color:'#fff', width:'100%', padding:'10px 14px', borderRadius:'8px', outline:'none', fontFamily:'inherit', fontSize:'0.875rem', boxSizing:'border-box' };

  const menuItems = [
    { id:'pending',  icon:'⏳', label:'Pending',    count: stats.pending  },
    { id:'listings', icon:'📦', label:'Listings',   count: stats.listings },
    { id:'add',      icon:'➕', label:'Add Listing', count: 0             },
    { id:'bookings', icon:'📅', label:'Bookings',   count: stats.bookings },
    { id:'messages', icon:'💬', label:'Messages',   count: stats.messages },
  ];

  const statusConfig = {
    active:       { bg:'rgba(74,222,128,0.12)', color:'#4ade80', label:'Active'       },
    sold:         { bg:'rgba(96,165,250,0.12)', color:'#60a5fa', label:'Sold'         },
    pending:      { bg:'rgba(251,191,36,0.12)', color:'#fbbf24', label:'Pending'      },
    out_of_stock: { bg:'rgba(249,115,22,0.12)', color:'#fb923c', label:'Out of Stock' },
    _default:     { bg:'#1e2a3a',              color:'#aaa'                           },
  };

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
  .adm-sidebar { display: none !important; }

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
      await notifySeller(product.seller_id, `🎉 Great news! Your item "${product.title}" has been reviewed and is now LIVE on the marketplace.`);
      load();
    } catch(err) { alert('Approve error: '+err.message); }
    finally { setActionBusy(b=>{ const n={...b}; delete n[product.id]; return n; }); }
  };

  const reject = async (product) => {
    if (actionBusy[product.id]) return;
    if (!confirm(`Reject "${product.title}"?\n\nThis will delete the listing and notify the seller.`)) return;
    setActionBusy(b=>({...b,[product.id]:'reject'}));
    try {
      await notifySeller(product.seller_id, `❌ Unfortunately, your item "${product.title}" could not be approved at this time.`);
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
  const stripAgentPrefix = (content) => content?.replace(/^\[.+?\]\s*/,'') || content;

  // ── ThumbStrip ──
  const ThumbStrip = ({ product }) => {
    const [sel, setSel] = useState(0);
    const images = buildImages(product);
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'6px', alignItems:'center', flexShrink:0 }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'8px', overflow:'hidden', background:'#0e1117', border:'2px solid #1e2a3a' }}>
          {images[sel] ? <img src={images[sel]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'1.4rem' }}>📦</span>}
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          {images.map((img,idx) => (
            <button key={idx} onClick={() => setSel(idx)}
              style={{ width:'22px', height:'22px', borderRadius:'4px', overflow:'hidden', padding:0, border:`1.5px solid ${sel===idx?'#4dd4ac':'#1e2a3a'}`, cursor:'pointer', background:'#0e1117', opacity:sel===idx?1:0.5 }}>
              <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── FileField ──
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
          style={{ width:'100%', aspectRatio:'1', borderRadius:'10px', overflow:'hidden', background:'#0a1018', border:`2px dashed ${value?'#4dd4ac':prev?'#334155':'#1e2a3a'}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}>
          {prev ? (
            <>
              <img src={prev} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
              <div style={{ position:'absolute', top:'6px', right:'6px', background:'rgba(0,0,0,0.65)', borderRadius:'5px', padding:'2px 6px', fontSize:'9px', fontWeight:'700', color:'#fff' }}>Change</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:'1.8rem', opacity:0.3 }}>📷</div>
              <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', fontWeight:'600' }}>Click</span>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleChange} />
      </div>
    );
  };

  // ── Tab content ──
  const TabContent = () => {
    if (tab === 'pending') return (
      <div>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,4vw,1.7rem)', color:'#4dd4ac', margin:'0 0 6px' }}>Pending Submissions</h2>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', margin:'0 0 20px' }}>Review products submitted by sellers</p>
        {pending.length===0 ? <Empty icon="✅" title="All caught up!" sub="No pending submissions." />
          : pending.map(p=>(
            <Card key={p.id} color="#fbbf24">
              <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
                <ThumbStrip product={p} />
                <div style={{ flex:1, minWidth:'160px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:'6px', marginBottom:'8px' }}>
                    <h3 style={{ fontWeight:'700', color:'#4dd4ac', margin:0, fontSize:'1rem', flex:1 }}>{p.title}</h3>
                    <span style={{ background:'rgba(251,191,36,0.12)', color:'#fbbf24', padding:'3px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', flexShrink:0 }}>PENDING</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 12px', fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', marginBottom:'10px' }}>
                    <span><b style={{ color:'rgba(255,255,255,0.7)' }}>Price:</b> ${p.price}</span>
                    <span><b style={{ color:'rgba(255,255,255,0.7)' }}>Cat:</b> {p.category}</span>
                    <span><b style={{ color:'rgba(255,255,255,0.7)' }}>Cond:</b> {p.condition}</span>
                    <span><b style={{ color:'rgba(255,255,255,0.7)' }}>Loc:</b> {p.location}</span>
                  </div>
                  <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
                    <Btn color="#16a34a" hover="#15803d" disabled={!!actionBusy[p.id]} onClick={()=>approve(p)}>{actionBusy[p.id]==='approve'?'⏳ Approving…':'✓ Approve'}</Btn>
                    <Btn color="#dc2626" hover="#b91c1c" disabled={!!actionBusy[p.id]} onClick={()=>reject(p)}>{actionBusy[p.id]==='reject'?'⏳ Rejecting…':'✗ Reject'}</Btn>
                    <Btn color="#60a5fa" hover="#3b82f6" onClick={()=>openEdit(p)}>✎ Edit</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))
        }
      </div>
    );

    if (tab === 'listings') return (
      <div>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,4vw,1.7rem)', color:'#4dd4ac', margin:'0 0 6px' }}>All Listings</h2>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', margin:'0 0 20px' }}>Active and sold products</p>
        {listings.length===0 ? <Empty icon="📦" title="No listings yet" sub="Add one using Add Listing." />
          : listings.map(p=>(
            <Card key={p.id}>
              <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
                <ThumbStrip product={p} />
                <div style={{ flex:1, minWidth:'160px' }}>
                  <h3 style={{ fontWeight:'700', color:'#4dd4ac', margin:'0 0 4px', fontSize:'0.95rem' }}>{p.title}</h3>
                  <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', margin:'0 0 8px' }}>{p.category} · <span style={{ color:'#4dd4ac', fontWeight:'700' }}>${p.price}</span></p>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
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
    );

    if (tab === 'add') return (
      <div>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,4vw,1.7rem)', color:'#4dd4ac', margin:'0 0 6px' }}>Add Listing</h2>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', margin:'0 0 20px' }}>Publish a new product directly to the store</p>
        <div style={{ background:'#151c27', border:'2px solid #1e2a3a', borderRadius:'12px', padding:'20px' }}>
          {addMsg.text && <div style={{ padding:'10px 14px', borderRadius:'8px', marginBottom:'16px', background:addMsg.type==='ok'?'rgba(77,212,172,0.1)':'rgba(239,68,68,0.1)', color:addMsg.type==='ok'?'#4dd4ac':'#fca5a5', fontSize:'0.85rem', fontWeight:'600' }}>{addMsg.text}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'16px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[['Title','title','text'],['Price','price','number'],['Location','location','text'],['Business Name','business_name','text']].map(([label,key,type])=>(
                <div key={key}>
                  <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', margin:'0 0 6px' }}>{label}</p>
                  <input className="adm-in" type={type} value={nProd[key]} onChange={e=>setNProd(p=>({...p,[key]:e.target.value}))} style={IS} placeholder={label} />
                </div>
              ))}
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', margin:'0 0 6px' }}>Category</p>
                <select className="adm-in" value={nProd.category} onChange={e=>setNProd(p=>({...p,category:e.target.value}))} style={IS}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', margin:'0 0 6px' }}>Condition</p>
                <select className="adm-in" value={nProd.condition} onChange={e=>setNProd(p=>({...p,condition:e.target.value}))} style={IS}>{CONDS.map(c=><option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', margin:'0 0 6px' }}>Description</p>
                <textarea className="adm-in" value={nProd.description} onChange={e=>setNProd(p=>({...p,description:e.target.value}))} style={{...IS,minHeight:'90px',resize:'vertical'}} placeholder="Describe the item..." />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', alignContent:'start' }}>
              <FileField label="Main *" value={nImg0} onChange={setNImg0} />
              <FileField label="Image 2" value={nImg1} onChange={setNImg1} />
              <FileField label="Image 3" value={nImg2} onChange={setNImg2} />
            </div>
          </div>
          <button onClick={addListing} disabled={addBusy}
            style={{ marginTop:'20px', width:'100%', padding:'13px', background:addBusy?'#1e2a3a':'#4dd4ac', color:addBusy?'rgba(255,255,255,0.3)':'#000', border:'none', borderRadius:'10px', fontWeight:'700', fontSize:'0.95rem', cursor:addBusy?'not-allowed':'pointer', fontFamily:'inherit' }}>
            {addBusy ? '⏳ Publishing…' : '➕ Publish Listing'}
          </button>
        </div>
      </div>
    );

    if (tab === 'bookings') return (
      <div>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,4vw,1.7rem)', color:'#4dd4ac', margin:'0 0 6px' }}>Bookings</h2>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', margin:'0 0 20px' }}>Manage customer bookings</p>
        {bookings.length===0 ? <Empty icon="📅" title="No bookings yet" sub="Bookings will appear here." />
          : bookings.map(b=>(
            <Card key={b.id}>
              <p style={{ color:'#4dd4ac', fontWeight:'700', margin:'0 0 4px' }}>{b.product_title||b.product_id}</p>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.8rem', margin:'0 0 8px' }}>{b.customer_name} · {new Date(b.created_at).toLocaleDateString()}</p>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                {statusBadge(b.status, statusConfig)}
                <OutlineBtn color="#4dd4ac" onClick={()=>updateBooking(b.id,'confirmed')}>Confirm</OutlineBtn>
                <OutlineBtn color="#ff6b6b" onClick={()=>updateBooking(b.id,'cancelled')}>Cancel</OutlineBtn>
              </div>
            </Card>
          ))
        }
      </div>
    );

    if (tab === 'messages') return (
      <div>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.2rem,4vw,1.7rem)', color:'#4dd4ac', margin:'0 0 6px' }}>Messages</h2>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', margin:'0 0 20px' }}>Agent conversations</p>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(160px,220px) 1fr', gap:'14px', minHeight:'400px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {convs.length===0 ? <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.82rem' }}>No conversations</p>
              : convs.map(cv=>(
                <button key={cv.id} onClick={()=>loadMsgs(cv)}
                  style={{ padding:'10px 12px', background:selConv?.id===cv.id?'rgba(77,212,172,0.15)':'#151c27', border:`2px solid ${selConv?.id===cv.id?'#4dd4ac':'#1e2a3a'}`, borderRadius:'9px', cursor:'pointer', textAlign:'left', color:'inherit', fontFamily:'inherit' }}>
                  <p style={{ color:'#4dd4ac', fontWeight:'700', margin:'0 0 2px', fontSize:'0.82rem' }}>Conv #{cv.id?.slice(0,6)}</p>
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.72rem', margin:0 }}>{new Date(cv.last_message_at).toLocaleString()}</p>
                </button>
              ))
            }
          </div>
          <div style={{ display:'flex', flexDirection:'column', background:'#151c27', border:'2px solid #1e2a3a', borderRadius:'12px', overflow:'hidden' }}>
            <div className="adm-sb" style={{ flex:1, overflowY:'auto', padding:'14px', display:'flex', flexDirection:'column', gap:'10px', minHeight:'300px' }}>
              {msgs.map(m=>(
                <div key={m.id} style={{ alignSelf:m.is_agent?'flex-end':'flex-start', maxWidth:'75%' }}>
                  {m.is_agent && <p style={{ fontSize:'10px', color:'#4dd4ac', margin:'0 0 3px', textAlign:'right', fontWeight:'600' }}>{m.agent_name||'Agent'}</p>}
                  <div style={{ padding:'9px 13px', borderRadius:'10px', background:m.is_agent?'rgba(77,212,172,0.15)':'#1e2a3a', color:'rgba(255,255,255,0.85)', fontSize:'0.83rem', lineHeight:1.5 }}>
                    {stripAgentPrefix(m.content)}
                  </div>
                </div>
              ))}
              <div ref={msgsEnd} />
            </div>
            <div style={{ padding:'12px', borderTop:'2px solid #1e2a3a', display:'flex', gap:'8px' }}>
              <div ref={agentPickerRef} style={{ position:'relative' }}>
                <button onClick={()=>setShowAgentPicker(p=>!p)}
                  style={{ padding:'8px 12px', background:'#1e2a3a', border:'2px solid #2a3a4a', borderRadius:'8px', color:'#4dd4ac', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                  {selectedAgent.avatar} ▾
                </button>
                {showAgentPicker && (
                  <div style={{ position:'absolute', bottom:'100%', left:0, background:'#0d1520', border:'2px solid #1e2a3a', borderRadius:'10px', padding:'6px', zIndex:100, marginBottom:'4px', minWidth:'180px' }}>
                    {AGENTS.map(a=>(
                      <button key={a.name} className="agent-option" onClick={()=>{ setSelectedAgent(a); setShowAgentPicker(false); }}
                        style={{ width:'100%', padding:'8px 10px', background:'transparent', border:'none', borderRadius:'7px', color:a.name===selectedAgent.name?'#4dd4ac':'rgba(255,255,255,0.7)', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:'8px' }}>
                        <span>{a.avatar}</span><span>{a.name}</span>
                        {a.online && <span style={{ marginLeft:'auto', width:'7px', height:'7px', borderRadius:'50%', background:'#4dd4ac', flexShrink:0 }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input value={replyText} onChange={e=>setReplyText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendReply()}
                placeholder={`Reply as ${selectedAgent.name}…`} className="adm-in"
                style={{ flex:1, background:'#0e1117', border:'2px solid #1e2a3a', color:'#fff', padding:'8px 12px', borderRadius:'8px', outline:'none', fontFamily:'inherit', fontSize:'0.85rem' }} />
              <button onClick={sendReply}
                style={{ padding:'8px 16px', background:'#4dd4ac', color:'#000', border:'none', borderRadius:'8px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', fontSize:'0.85rem' }}>Send</button>
            </div>
          </div>
        </div>
      </div>
    );

    return null;
  };

  // ── Dropdown panel ──
  const DropdownPanel = () => (
    <div style={{
      position:'absolute', top:'calc(100% + 8px)', left:0,
      width:'260px', background:'#0d1520',
      border:'2px solid #1e2a3a', borderRadius:'14px',
      zIndex:9999, overflow:'hidden',
      boxShadow:'0 24px 64px rgba(0,0,0,0.7)',
    }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'2px solid #1e2a3a', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:'linear-gradient(135deg,#4dd4ac,#1e7a5e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', flexShrink:0 }}>⚙</div>
        <div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'700', color:'#4dd4ac', lineHeight:1 }}>Admin Panel</div>
          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', marginTop:'2px' }}>Store Management</div>
        </div>
      </div>

      {/* Stats */}
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

      {/* Nav */}
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
            <span style={{ display:'flex', alignItems:'center', gap:'10px' }}><span>{item.icon}</span>{item.label}</span>
            {item.count > 0 && (
              <span style={{ padding:'2px 7px', borderRadius:'20px', fontSize:'10px', fontWeight:'700',
                background: tab===item.id ? 'rgba(0,0,0,0.2)' : 'rgba(77,212,172,0.15)',
                color: tab===item.id ? '#000' : '#4dd4ac' }}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:'10px 12px', borderTop:'2px solid #1e2a3a', display:'flex', flexDirection:'column', gap:'7px' }}>
        <div style={{ display:'flex', gap:'7px' }}>
          <button onClick={() => { setShowDiag(p=>!p); setMenuOpen(false); }}
            style={{ flex:1, padding:'8px', background:'rgba(96,165,250,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#60a5fa', cursor:'pointer', fontFamily:'inherit', fontSize:'0.74rem', fontWeight:'600' }}>
            🔍 {showDiag?'Hide':'Show'} Diag
          </button>
          <button onClick={() => { load(); setMenuOpen(false); }}
            style={{ flex:1, padding:'8px', background:'rgba(77,212,172,0.08)', border:'1px solid #1e2a3a', borderRadius:'8px', color:'#4dd4ac', cursor:'pointer', fontFamily:'inherit', fontSize:'0.74rem', fontWeight:'600' }}>
            ↻ Refresh
          </button>
        </div>
        <button onClick={() => setView('home')}
          style={{ width:'100%', padding:'9px 12px', background:'transparent', border:'2px solid #1e2a3a', borderRadius:'9px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.82rem', fontWeight:'600', transition:'all 0.15s' }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor='#4dd4ac'; e.currentTarget.style.color='#4dd4ac'; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor='#1e2a3a'; e.currentTarget.style.color='rgba(255,255,255,0.4)'; }}>
          ← Back to Store
        </button>
      </div>
    </div>
  );

  // ── SINGLE unified render — no isMobile split ──
  return (
    <>
      <style>{`
        *{box-sizing:border-box}body{margin:0}
        .adm-sb::-webkit-scrollbar{width:4px}.adm-sb::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:4px}
        .adm-in::placeholder{color:rgba(255,255,255,0.22)}.adm-in option{background:#111}
        .agent-option:hover{background:rgba(77,212,172,0.1)!important}
      `}</style>

      <div style={{ background:'#090d14', minHeight:'100vh', color:'#fff', fontFamily:"'Poppins',-apple-system,sans-serif", display:'flex', flexDirection:'column' }}>

        {/* ── Sticky top bar ── */}
        <div style={{
          position:'sticky', top:0, zIndex:500,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'10px 16px',
          background:'#090d14', borderBottom:'2px solid #1e2a3a',
        }}>

          {/* Hamburger + dropdown */}
          <div ref={menuRef} style={{ position:'relative' }}>
            <button
              onClick={() => setMenuOpen(p=>!p)}
              aria-label="Menu"
              style={{
                width:'42px', height:'42px',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'5px',
                background: menuOpen ? 'rgba(77,212,172,0.15)' : '#0e1825',
                border: `2px solid ${menuOpen ? '#4dd4ac' : '#1e2a3a'}`,
                borderRadius:'10px', cursor:'pointer', padding:0,
                transition:'all 0.2s',
              }}>
              <span style={{ display:'block', width:'18px', height:'2px', background:'#4dd4ac', borderRadius:'2px', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition:'transform 0.2s' }} />
              <span style={{ display:'block', width:'13px', height:'2px', background:'#4dd4ac', borderRadius:'2px', alignSelf:'flex-start', marginLeft:'12px', opacity: menuOpen ? 0 : 1, transition:'opacity 0.2s' }} />
              <span style={{ display:'block', width:'18px', height:'2px', background:'#4dd4ac', borderRadius:'2px', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition:'transform 0.2s' }} />
            </button>
            {menuOpen && <DropdownPanel />}
          </div>

          {/* Current section label */}
          <span style={{ fontSize:'0.9rem', fontWeight:'700', color:'#4dd4ac' }}>
            {menuItems.find(m=>m.id===tab)?.icon}&nbsp;{menuItems.find(m=>m.id===tab)?.label}
          </span>

          {/* Back button */}
          <button onClick={()=>setView('home')}
            style={{ padding:'7px 12px', background:'transparent', border:'1.5px solid #1e2a3a', borderRadius:'8px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.76rem', fontWeight:'600', transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='#4dd4ac'; e.currentTarget.style.color='#4dd4ac'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#1e2a3a'; e.currentTarget.style.color='rgba(255,255,255,0.4)'; }}>
            ← Store
          </button>
        </div>

        {/* Backdrop */}
        {menuOpen && (
          <div onClick={()=>setMenuOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:499, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(2px)' }} />
        )}

        {/* Main content */}
        <main className="adm-sb" style={{ flex:1, overflowY:'auto', padding:'20px 16px' }}>
          <div style={{ maxWidth:'900px', margin:'0 auto' }}>
            {showDiag && (
              <div style={{ marginBottom:'24px', background:'#0a1018', border:'2px solid #1e3a5f', borderRadius:'10px', padding:'16px' }}>
                <p style={{ fontWeight:'700', color:'#60a5fa', marginBottom:'12px', fontSize:'0.85rem' }}>🔍 Database Query Results</p>
                {diag.length===0
                  ? <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem' }}>No data — click Refresh</p>
                  : diag.map((d,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'8px 12px', borderRadius:'6px', marginBottom:'4px', background:d.ok?'rgba(77,212,172,0.06)':'rgba(239,68,68,0.1)' }}>
                      <span>{d.ok?'✅':'❌'}</span>
                      <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.82rem', flex:1 }}>{d.label}</span>
                      <span style={{ color:d.ok?'#4dd4ac':'#fca5a5', fontSize:'0.82rem', fontWeight:'700' }}>{d.ok?`${d.count} rows`:`ERROR: ${d.error}`}</span>
                    </div>
                  ))
                }
              </div>
            )}
            <TabContent />
          </div>
        </main>

        {/* Edit modal */}
        {editOpen && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div className="adm-sb" style={{ background:'#0d1520', border:'2px solid #1e2a3a', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'560px', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h3 style={{ fontFamily:'Georgia,serif', color:'#4dd4ac', margin:0 }}>Edit Listing</h3>
                <button onClick={()=>setEditOpen(false)} style={{ background:'#1e2a3a', border:'none', borderRadius:'7px', color:'rgba(255,255,255,0.5)', width:'32px', height:'32px', cursor:'pointer', fontSize:'1rem' }}>✕</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {[['Title','title','text'],['Price','price','number'],['Location','location','text'],['Business Name','business_name','text']].map(([label,key,type])=>(
                  <div key={key}>
                    <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', margin:'0 0 6px' }}>{label}</p>
                    <input className="adm-in" type={type} value={editF[key]||''} onChange={e=>setEditF(f=>({...f,[key]:e.target.value}))} style={IS} />
                  </div>
                ))}
                <div>
                  <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', margin:'0 0 6px' }}>Status</p>
                  <select className="adm-in" value={editF.status||'active'} onChange={e=>setEditF(f=>({...f,status:e.target.value}))} style={IS}>
                    {['active','sold','pending','out_of_stock'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize:'0.78rem', fontWeight:'600', color:'rgba(255,255,255,0.5)', margin:'0 0 6px' }}>Description</p>
                  <textarea className="adm-in" value={editF.description||''} onChange={e=>setEditF(f=>({...f,description:e.target.value}))} style={{...IS,minHeight:'80px',resize:'vertical'}} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                  <FileField label="Image 1" value={eImg0} onChange={setEImg0} existingUrl={editExistingImgs[0]} />
                  <FileField label="Image 2" value={eImg1} onChange={setEImg1} existingUrl={editExistingImgs[1]} />
                  <FileField label="Image 3" value={eImg2} onChange={setEImg2} existingUrl={editExistingImgs[2]} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
                <button onClick={()=>setEditOpen(false)} style={{ flex:1, padding:'11px', background:'transparent', border:'2px solid #1e2a3a', borderRadius:'9px', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>Cancel</button>
                <button onClick={saveEdit} disabled={editBusy} style={{ flex:2, padding:'11px', background:editBusy?'#1e2a3a':'#4dd4ac', color:editBusy?'rgba(255,255,255,0.3)':'#000', border:'none', borderRadius:'9px', fontWeight:'700', cursor:editBusy?'not-allowed':'pointer', fontFamily:'inherit' }}>
                  {editBusy ? '⏳ Saving…' : '✓ Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
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
