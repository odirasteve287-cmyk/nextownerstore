import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

const AGENTS = [
  { name: 'Agent Sarah K.', avatar: '👩‍💼', online: false },
  { name: 'Agent James M.', avatar: '👨‍💼', online: true },
  { name: 'Agent Amara T.', avatar: '👩‍🔬', online: false },
  { name: 'Agent Leo B.',   avatar: '🧑‍💻', online: true },
  { name: 'Agent Nina R.',  avatar: '👩‍🎨', online: false },
];

const CATS  = ['Furniture','Electronics','Appliances','For Kids','Decor','Kitchenware','Household'];
const CONDS = ['Brand New','Like New','Excellent','Good','Fair','For Parts'];

const STATUS_CFG = {
  active:       { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80', label: 'Active'       },
  sold:         { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', label: 'Sold'         },
  pending:      { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: 'Pending'      },
  out_of_stock: { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c', label: 'Out of Stock' },
};

function Badge(props) {
  var s = props.s;
  var c = STATUS_CFG[s] || { bg: '#1e2a3a', color: '#aaa', label: s };
  return React.createElement('span', {
    style: { padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.color }
  }, c.label);
}

function Card(props) {
  var color = props.color || '#1e2a3a';
  var hov = props._hov;
  return (
    <div style={{ background: '#151c27', border: '2px solid ' + color, borderRadius: '12px', padding: '16px 18px', marginBottom: '10px' }}>
      {props.children}
    </div>
  );
}

function Btn(props) {
  var disabled = props.disabled || false;
  return (
    <button
      onClick={disabled ? undefined : props.onClick}
      style={{ padding: '8px 16px', background: disabled ? '#1e2a3a' : props.color, color: disabled ? 'rgba(255,255,255,0.25)' : '#fff', border: 'none', borderRadius: '7px', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: disabled ? 0.6 : 1 }}>
      {props.children}
    </button>
  );
}

function OutlineBtn(props) {
  var color = props.color;
  return (
    <button
      onClick={props.onClick}
      style={{ padding: '7px 14px', background: 'transparent', border: '1.5px solid ' + color, color: color, borderRadius: '7px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
      {props.children}
    </button>
  );
}

function Empty(props) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', border: '2px dashed #1e2a3a', borderRadius: '12px', background: '#151c27' }}>
      <div style={{ fontSize: '2.8rem', marginBottom: '10px' }}>{props.icon}</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>{props.title}</p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem' }}>{props.sub}</p>
    </div>
  );
}

export default function AdminDashboard({ user, setView }) {
  var [tab, setTab] = useState('pending');
  var [menuOpen, setMenuOpen] = useState(false);
  var [pending, setPending] = useState([]);
  var [listings, setListings] = useState([]);
  var [bookings, setBookings] = useState([]);
  var [convs, setConvs] = useState([]);
  var [msgs, setMsgs] = useState([]);
  var [selConv, setSelConv] = useState(null);
  var [replyText, setReplyText] = useState('');
  var [selAgent, setSelAgent] = useState(AGENTS[0]);
  var [showPicker, setShowPicker] = useState(false);
  var [stats, setStats] = useState({ pending: 0, listings: 0, bookings: 0, messages: 0 });
  var [diag, setDiag] = useState([]);
  var [showDiag, setShowDiag] = useState(false);
  var [actionBusy, setActionBusy] = useState({});
  var [editOpen, setEditOpen] = useState(false);
  var [editProd, setEditProd] = useState(null);
  var [editF, setEditF] = useState({});
  var [eImg0, setEImg0] = useState(null);
  var [eImg1, setEImg1] = useState(null);
  var [eImg2, setEImg2] = useState(null);
  var [editBusy, setEditBusy] = useState(false);
  var [editExistingImgs, setEditExistingImgs] = useState([]);
  var [nProd, setNProd] = useState({ title: '', price: '', category: 'Furniture', condition: 'Like New', description: '', location: '', business_name: '' });
  var [nImg0, setNImg0] = useState(null);
  var [nImg1, setNImg1] = useState(null);
  var [nImg2, setNImg2] = useState(null);
  var [addBusy, setAddBusy] = useState(false);
  var [addMsg, setAddMsg] = useState({ type: '', text: '' });

  var msgsEnd = useRef(null);
  var pickerRef = useRef(null);
  var menuRef = useRef(null);

  var IS = { background: '#0e1117', border: '2px solid #1e2a3a', color: '#fff', width: '100%', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', fontSize: '0.875rem', boxSizing: 'border-box' };

  useEffect(function() {
    if (user) {
      load();
      var iv = setInterval(load, 10000);
      return function() { clearInterval(iv); };
    }
  }, [user]);

  useEffect(function() {
    if (msgsEnd.current) msgsEnd.current.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  useEffect(function() {
    function fn(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', fn);
    return function() { document.removeEventListener('mousedown', fn); };
  }, []);

  useEffect(function() {
    if (!selConv) return;
    var convId = selConv.id;
    var iv = setInterval(function() {
      supabase.from('agent_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true }).then(function(res) {
        if (!res.error && res.data) setMsgs(res.data);
      });
    }, 5000);
    return function() { clearInterval(iv); };
  }, [selConv ? selConv.id : null]);

  function attachImages(products) {
    if (!products || !products.length) return Promise.resolve(products);
    var ids = products.map(function(p) { return p.id; });
    return supabase.from('product_images').select('product_id,image_url,is_primary,sort_order').in('product_id', ids).order('sort_order', { ascending: true }).then(function(res) {
      if (!res.data) return products;
      var map = {};
      res.data.forEach(function(i) {
        if (!map[i.product_id]) map[i.product_id] = [];
        map[i.product_id].push(i);
      });
      return products.map(function(p) { return Object.assign({}, p, { extra_imgs: map[p.id] || [] }); });
    });
  }

  function buildImages(p) {
    var def = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=900&h=600&fit=crop';
    if (p.extra_imgs && p.extra_imgs.length) {
      var arr = p.extra_imgs.map(function(i) { return i.image_url; }).filter(Boolean);
      if (arr.length) {
        while (arr.length < 3) arr.push(arr[arr.length - 1]);
        return arr.slice(0, 3);
      }
    }
    var base = p.image_url || def;
    return [base, base, base];
  }

  function load() {
    var log = [];
    return supabase.from('products').select('*').eq('status', 'pending').order('created_at', { ascending: false }).then(function(r1) {
      log.push({ label: 'pending', ok: !r1.error, count: r1.data ? r1.data.length : 0, error: r1.error ? r1.error.message : null });
      var p1 = r1.error ? Promise.resolve() : attachImages(r1.data || []).then(function(d) { setPending(d); });
      return supabase.from('products').select('*').in('status', ['active', 'sold']).order('created_at', { ascending: false }).then(function(r2) {
        log.push({ label: 'active/sold', ok: !r2.error, count: r2.data ? r2.data.length : 0, error: r2.error ? r2.error.message : null });
        var p2 = r2.error ? Promise.resolve() : attachImages(r2.data || []).then(function(d) { setListings(d); });
        return supabase.from('bookings').select('*').order('created_at', { ascending: false }).then(function(r3) {
          log.push({ label: 'bookings', ok: !r3.error, count: r3.data ? r3.data.length : 0, error: r3.error ? r3.error.message : null });
          if (!r3.error) setBookings(r3.data || []);
          return supabase.from('agent_conversations').select('*').order('last_message_at', { ascending: false }).then(function(r4) {
            log.push({ label: 'conversations', ok: !r4.error, count: r4.data ? r4.data.length : 0, error: r4.error ? r4.error.message : null });
            if (!r4.error) {
              setConvs(r4.data || []);
              if (r4.data && r4.data.length) setSelConv(function(prev) { return prev || r4.data[0]; });
            }
            setDiag(log);
            setStats({
              pending: r1.data ? r1.data.length : 0,
              listings: r2.data ? r2.data.length : 0,
              bookings: r3.data ? r3.data.length : 0,
              messages: r4.data ? r4.data.length : 0,
            });
          });
        });
      });
    });
  }

  function loadMsgs(conv) {
    setSelConv(conv);
    supabase.from('agent_messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true }).then(function(res) {
      if (!res.error && res.data) setMsgs(res.data);
    });
  }

  function uploadImg(file) {
    if (!file) return Promise.resolve(null);
    var ext = file.name.split('.').pop();
    var path = 'admin/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
    return supabase.storage.from('product-images').upload(path, file).then(function(res) {
      if (res.error) return null;
      return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    });
  }

  function notifySeller(sellerId, text) {
    if (!sellerId) return Promise.resolve();
    return supabase.from('agent_conversations').select('id').eq('user_id', sellerId).limit(1).then(function(r) {
      var cidPromise;
      if (r.data && r.data.length) {
        cidPromise = Promise.resolve(r.data[0].id);
      } else {
        cidPromise = supabase.from('agent_conversations').insert([{ user_id: sellerId, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() }]).select().single().then(function(nc) {
          if (nc.error) return null;
          return nc.data.id;
        });
      }
      return cidPromise.then(function(cid) {
        if (!cid) return;
        var since = new Date(Date.now() - 60000).toISOString();
        return supabase.from('agent_messages').select('id').eq('conversation_id', cid).eq('is_agent', true).eq('content', text).gte('created_at', since).limit(1).then(function(dup) {
          if (dup.data && dup.data.length) return;
          return supabase.from('agent_messages').insert([{ conversation_id: cid, sender_id: user.id, is_agent: true, content: '[' + selAgent.name + '] ' + text, agent_name: selAgent.name, created_at: new Date().toISOString() }]).then(function() {
            return supabase.from('agent_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', cid);
          });
        });
      });
    }).catch(function(err) { console.error(err); });
  }

  function approve(product) {
    if (actionBusy[product.id]) return;
    setActionBusy(function(b) { return Object.assign({}, b, { [product.id]: 'approve' }); });
    supabase.from('products').update({ status: 'active' }).eq('id', product.id).then(function(res) {
      if (res.error) { alert('Approve failed: ' + res.error.message); return; }
      return notifySeller(product.seller_id, 'Your item "' + product.title + '" is now LIVE on the marketplace!').then(function() { load(); });
    }).catch(function(err) { alert(err.message); }).finally(function() {
      setActionBusy(function(b) { var n = Object.assign({}, b); delete n[product.id]; return n; });
    });
  }

  function reject(product) {
    if (actionBusy[product.id]) return;
    if (!window.confirm('Reject "' + product.title + '"? This will delete it.')) return;
    setActionBusy(function(b) { return Object.assign({}, b, { [product.id]: 'reject' }); });
    notifySeller(product.seller_id, 'Your item "' + product.title + '" could not be approved.').then(function() {
      return supabase.from('products').delete().eq('id', product.id).then(function(res) {
        if (res.error) { alert('Delete failed: ' + res.error.message); return; }
        load();
      });
    }).catch(function(err) { alert(err.message); }).finally(function() {
      setActionBusy(function(b) { var n = Object.assign({}, b); delete n[product.id]; return n; });
    });
  }

  function deleteProd(id) {
    if (!window.confirm('Delete this listing permanently?')) return;
    supabase.from('products').delete().eq('id', id).then(function(res) {
      if (!res.error) load(); else alert(res.error.message);
    });
  }

  function updateBooking(id, status) {
    supabase.from('bookings').update({ status: status, updated_at: new Date().toISOString() }).eq('id', id).then(function(res) {
      if (!res.error) load(); else alert(res.error.message);
    });
  }

  function openEdit(p) {
    setEditProd(p);
    setEditF({ title: p.title || '', price: p.price || '', category: p.category || 'Furniture', condition: p.condition || 'Like New', description: p.description || '', location: p.location || '', business_name: p.business_name || '', status: p.status || 'active' });
    setEImg0(null); setEImg1(null); setEImg2(null);
    supabase.from('product_images').select('image_url,sort_order').eq('product_id', p.id).order('sort_order', { ascending: true }).then(function(res) {
      var slots = [null, null, null];
      if (res.data) res.data.forEach(function(i) { if (i.sort_order < 3) slots[i.sort_order] = i.image_url; });
      if (!slots[0]) slots[0] = p.image_url || null;
      setEditExistingImgs(slots);
      setEditOpen(true);
    });
  }

  function saveEdit() {
    if (!editProd) return;
    setEditBusy(true);
    var upd = Object.assign({}, editF, { price: parseFloat(editF.price), updated_at: new Date().toISOString() });
    var chain = Promise.resolve();
    if (eImg0) chain = chain.then(function() { return uploadImg(eImg0).then(function(u) { if (u) { upd.image_url = u; return supabase.from('product_images').upsert([{ product_id: editProd.id, image_url: u, is_primary: true, sort_order: 0 }]); } }); });
    if (eImg1) chain = chain.then(function() { return uploadImg(eImg1).then(function(u) { if (u) return supabase.from('product_images').upsert([{ product_id: editProd.id, image_url: u, is_primary: false, sort_order: 1 }]); }); });
    if (eImg2) chain = chain.then(function() { return uploadImg(eImg2).then(function(u) { if (u) return supabase.from('product_images').upsert([{ product_id: editProd.id, image_url: u, is_primary: false, sort_order: 2 }]); }); });
    chain.then(function() {
      return supabase.from('products').update(upd).eq('id', editProd.id).then(function(res) {
        if (res.error) throw res.error;
        setEditOpen(false); load();
      });
    }).catch(function(err) { alert('Save failed: ' + err.message); }).finally(function() { setEditBusy(false); });
  }

  function sendReply() {
    var text = replyText.trim(); if (!text) return;
    var conv = selConv;
    if (!conv) { if (!convs.length) return; conv = convs[0]; setSelConv(conv); }
    supabase.from('agent_messages').insert([{ conversation_id: conv.id, sender_id: user.id, is_agent: true, content: '[' + selAgent.name + '] ' + text, agent_name: selAgent.name, created_at: new Date().toISOString() }]).select().single().then(function(res) {
      if (!res.error && res.data) {
        setMsgs(function(p) { return p.concat([res.data]); });
        setReplyText('');
        supabase.from('agent_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conv.id).then(function() { load(); });
      } else if (res.error) alert('Send failed: ' + res.error.message);
    });
  }

  function addListing(e) {
    e.preventDefault();
    if (!nImg0) { setAddMsg({ type: 'err', text: 'Main image is required.' }); return; }
    setAddBusy(true); setAddMsg({ type: '', text: '' });
    supabase.from('products').insert([Object.assign({ seller_id: user.id }, nProd, { price: parseFloat(nProd.price), status: 'active', created_at: new Date().toISOString() })]).select().single().then(function(res) {
      if (res.error) throw res.error;
      var prodId = res.data.id;
      return uploadImg(nImg0).then(function(url0) {
        var chain = Promise.resolve();
        if (url0) {
          chain = chain.then(function() { return supabase.from('product_images').insert([{ product_id: prodId, image_url: url0, is_primary: true, sort_order: 0 }]); }).then(function() { return supabase.from('products').update({ image_url: url0 }).eq('id', prodId); });
        }
        if (nImg1) chain = chain.then(function() { return uploadImg(nImg1).then(function(u) { if (u) return supabase.from('product_images').insert([{ product_id: prodId, image_url: u, is_primary: false, sort_order: 1 }]); }); });
        if (nImg2) chain = chain.then(function() { return uploadImg(nImg2).then(function(u) { if (u) return supabase.from('product_images').insert([{ product_id: prodId, image_url: u, is_primary: false, sort_order: 2 }]); }); });
        return chain;
      });
    }).then(function() {
      setNProd({ title: '', price: '', category: 'Furniture', condition: 'Like New', description: '', location: '', business_name: '' });
      setNImg0(null); setNImg1(null); setNImg2(null);
      setAddMsg({ type: 'ok', text: 'Listing published!' });
      load();
    }).catch(function(err) { setAddMsg({ type: 'err', text: err.message }); }).finally(function() { setAddBusy(false); });
  }

  function ThumbStrip(tprops) {
    var product = tprops.product;
    var selState = useState(0);
    var sel = selState[0];
    var setSel = selState[1];
    var imgs = buildImages(product);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#0e1117', border: '2px solid #1e2a3a' }}>
          <img src={imgs[sel]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {imgs.map(function(img, i) {
            return (
              <button key={i} onClick={function() { setSel(i); }}
                style={{ width: '22px', height: '22px', borderRadius: '4px', overflow: 'hidden', padding: 0, border: '1.5px solid ' + (sel === i ? '#4dd4ac' : '#1e2a3a'), cursor: 'pointer', background: '#0e1117', opacity: sel === i ? 1 : 0.5 }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function FileField(fprops) {
    var label = fprops.label;
    var value = fprops.value;
    var onChange = fprops.onChange;
    var existingUrl = fprops.existingUrl || null;
    var ref = useRef(null);
    var prevState = useState(existingUrl);
    var prev = prevState[0];
    var setPrev = prevState[1];
    useEffect(function() { if (!value) setPrev(existingUrl); }, [existingUrl, value]);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{label}</p>
        <div onClick={function() { if (ref.current) ref.current.click(); }}
          style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', background: '#0a1018', border: '2px dashed ' + (value ? '#4dd4ac' : prev ? '#334155' : '#1e2a3a'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          {prev
            ? <><img src={prev} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /><div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.65)', borderRadius: '5px', padding: '2px 6px', fontSize: '9px', fontWeight: '700', color: '#fff' }}>Change</div></>
            : <><div style={{ fontSize: '1.8rem', opacity: 0.3 }}>+</div><span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>Click</span></>
          }
        </div>
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={function(e) { var f = e.target.files[0]; if (f) { onChange(f); setPrev(URL.createObjectURL(f)); } }} />
      </div>
    );
  }

  var NAV = [
    { id: 'pending',  icon: 'P', label: 'Pending',     count: stats.pending  },
    { id: 'listings', icon: 'L', label: 'Listings',    count: stats.listings },
    { id: 'add',      icon: '+', label: 'Add Listing', count: 0              },
    { id: 'bookings', icon: 'B', label: 'Bookings',    count: stats.bookings },
    { id: 'messages', icon: 'M', label: 'Messages',    count: stats.messages },
  ];

  var currentNav = null;
  for (var ni = 0; ni < NAV.length; ni++) { if (NAV[ni].id === tab) { currentNav = NAV[ni]; break; } }
  if (!currentNav) currentNav = NAV[0];

  function DropdownPanel() {
    return (
      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '260px', background: '#0d1520', border: '2px solid #1e2a3a', borderRadius: '14px', zIndex: 9999, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '2px solid #1e2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg,#4dd4ac,#1e7a5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, color: '#000', fontWeight: '700' }}>A</div>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '0.95rem', fontWeight: '700', color: '#4dd4ac', lineHeight: 1 }}>Admin Panel</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>Store Management</div>
          </div>
        </div>

        <div style={{ padding: '12px', borderBottom: '2px solid #1e2a3a' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { v: stats.pending,  l: 'PENDING',  c: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
              { v: stats.listings, l: 'ACTIVE',   c: '#4dd4ac', bg: 'rgba(77,212,172,0.08)'  },
              { v: stats.bookings, l: 'BOOKINGS', c: '#60a5fa', bg: 'rgba(96,165,250,0.08)'  },
              { v: stats.messages, l: 'CHATS',    c: '#c084fc', bg: 'rgba(192,132,252,0.08)' },
            ].map(function(s) {
              return (
                <div key={s.l} style={{ padding: '10px 6px', borderRadius: '8px', textAlign: 'center', background: s.bg, border: '1px solid ' + s.c + '44' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: s.c, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</div>
                </div>
              );
            })}
          </div>
        </div>

        <nav style={{ padding: '8px' }}>
          {NAV.map(function(item) {
            var active = tab === item.id;
            return (
              <button key={item.id}
                onClick={function() { setTab(item.id); setMenuOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', marginBottom: '2px', borderRadius: '9px', background: active ? '#4dd4ac' : 'transparent', color: active ? '#000' : '#4dd4ac', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.87rem', fontWeight: active ? '700' : '500' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{item.label}</span>
                {item.count > 0 && <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: active ? 'rgba(0,0,0,0.2)' : 'rgba(77,212,172,0.15)', color: active ? '#000' : '#4dd4ac' }}>{item.count}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '10px 12px', borderTop: '2px solid #1e2a3a', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <div style={{ display: 'flex', gap: '7px' }}>
            <button onClick={function() { setShowDiag(function(p) { return !p; }); setMenuOpen(false); }}
              style={{ flex: 1, padding: '8px', background: 'rgba(96,165,250,0.08)', border: '1px solid #1e2a3a', borderRadius: '8px', color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: '600' }}>
              {showDiag ? 'Hide Diag' : 'Show Diag'}
            </button>
            <button onClick={function() { load(); setMenuOpen(false); }}
              style={{ flex: 1, padding: '8px', background: 'rgba(77,212,172,0.08)', border: '1px solid #1e2a3a', borderRadius: '8px', color: '#4dd4ac', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: '600' }}>
              Refresh
            </button>
          </div>
          <button onClick={function() { setView('home'); }}
            style={{ width: '100%', padding: '9px', background: 'transparent', border: '2px solid #1e2a3a', borderRadius: '9px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: '600' }}>
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#090d14', minHeight: '100vh', color: '#fff', fontFamily: 'Poppins,-apple-system,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{ __html: '.adm-sb::-webkit-scrollbar{width:4px}.adm-sb::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:4px}.adm-in::placeholder{color:rgba(255,255,255,0.22)}.adm-in option{background:#111}' }} />

      <div style={{ position: 'sticky', top: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#090d14', borderBottom: '2px solid #1e2a3a' }}>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button onClick={function() { setMenuOpen(function(p) { return !p; }); }}
            style={{ width: '42px', height: '42px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', background: menuOpen ? 'rgba(77,212,172,0.15)' : '#0e1825', border: '2px solid ' + (menuOpen ? '#4dd4ac' : '#1e2a3a'), borderRadius: '10px', cursor: 'pointer', padding: 0 }}>
            <span style={{ display: 'block', width: '18px', height: '2px', background: '#4dd4ac', borderRadius: '2px', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
            <span style={{ display: 'block', width: '13px', height: '2px', background: '#4dd4ac', borderRadius: '2px', alignSelf: 'flex-start', marginLeft: '12px', opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
            <span style={{ display: 'block', width: '18px', height: '2px', background: '#4dd4ac', borderRadius: '2px', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {menuOpen && <DropdownPanel />}
        </div>

        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#4dd4ac' }}>{currentNav.label}</span>

        <button onClick={function() { setView('home'); }}
          style={{ padding: '7px 12px', background: 'transparent', border: '1.5px solid #1e2a3a', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: '600' }}>
          Store
        </button>
      </div>

      {menuOpen && <div onClick={function() { setMenuOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 499, background: 'rgba(0,0,0,0.5)' }} />}

      <main className="adm-sb" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {showDiag && (
            <div style={{ marginBottom: '24px', background: '#0a1018', border: '2px solid #1e3a5f', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontWeight: '700', color: '#60a5fa', marginBottom: '12px', fontSize: '0.85rem' }}>DB Diagnostics</p>
              {diag.map(function(d, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '4px', background: d.ok ? 'rgba(77,212,172,0.06)' : 'rgba(239,68,68,0.1)' }}>
                    <span style={{ color: d.ok ? '#4dd4ac' : '#fca5a5', fontSize: '0.82rem', fontWeight: '700' }}>{d.ok ? 'OK' : 'ERR'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', flex: 1 }}>{d.label}</span>
                    <span style={{ color: d.ok ? '#4dd4ac' : '#fca5a5', fontSize: '0.82rem', fontWeight: '700' }}>{d.ok ? d.count + ' rows' : d.error}</span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'pending' && (
            <div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,4vw,1.7rem)', color: '#4dd4ac', margin: '0 0 6px' }}>Pending Submissions</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 20px' }}>Approve or reject seller submissions</p>
              {pending.length === 0
                ? <Empty icon="✓" title="All caught up!" sub="No pending submissions." />
                : pending.map(function(p) {
                  return (
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
                            <Btn color="#16a34a" hover="#15803d" disabled={!!actionBusy[p.id]} onClick={function() { approve(p); }}>{actionBusy[p.id] === 'approve' ? 'Approving...' : 'Approve'}</Btn>
                            <Btn color="#dc2626" hover="#b91c1c" disabled={!!actionBusy[p.id]} onClick={function() { reject(p); }}>{actionBusy[p.id] === 'reject' ? 'Rejecting...' : 'Reject'}</Btn>
                            <Btn color="#60a5fa" hover="#3b82f6" onClick={function() { openEdit(p); }}>Edit</Btn>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}

          {tab === 'listings' && (
            <div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,4vw,1.7rem)', color: '#4dd4ac', margin: '0 0 6px' }}>All Listings</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 20px' }}>Active and sold products</p>
              {listings.length === 0
                ? <Empty icon="[]" title="No listings yet" sub="Add one using Add Listing." />
                : listings.map(function(p) {
                  return (
                    <Card key={p.id} color="#1e2a3a">
                      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <ThumbStrip product={p} />
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <h3 style={{ fontWeight: '700', color: '#4dd4ac', margin: '0 0 4px', fontSize: '0.95rem' }}>{p.title}</h3>
                          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 8px' }}>{p.category} · <span style={{ color: '#4dd4ac', fontWeight: '700' }}>${p.price}</span></p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <Badge s={p.status} />
                            <OutlineBtn color="#60a5fa" onClick={function() { openEdit(p); }}>Edit</OutlineBtn>
                            <OutlineBtn color="#ff6b6b" onClick={function() { deleteProd(p.id); }}>Delete</OutlineBtn>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}

          {tab === 'add' && (
            <div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,4vw,1.7rem)', color: '#4dd4ac', margin: '0 0 6px' }}>Add Listing</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 20px' }}>Publish a new product</p>
              <div style={{ background: '#151c27', border: '2px solid #1e2a3a', borderRadius: '12px', padding: '20px' }}>
                {addMsg.text && <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', background: addMsg.type === 'ok' ? 'rgba(77,212,172,0.1)' : 'rgba(239,68,68,0.1)', color: addMsg.type === 'ok' ? '#4dd4ac' : '#fca5a5', fontSize: '0.85rem', fontWeight: '600' }}>{addMsg.text}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[['Title','title','text'],['Price','price','number'],['Location','location','text'],['Business Name','business_name','text']].map(function(row) {
                      return (
                        <div key={row[1]}>
                          <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>{row[0]}</p>
                          <input className="adm-in" type={row[2]} value={nProd[row[1]]} onChange={function(e) { var v = e.target.value; setNProd(function(prev) { return Object.assign({}, prev, { [row[1]]: v }); }); }} style={IS} placeholder={row[0]} />
                        </div>
                      );
                    })}
                    <div>
                      <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Category</p>
                      <select className="adm-in" value={nProd.category} onChange={function(e) { var v = e.target.value; setNProd(function(p) { return Object.assign({}, p, { category: v }); }); }} style={IS}>{CATS.map(function(c) { return <option key={c}>{c}</option>; })}</select>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Condition</p>
                      <select className="adm-in" value={nProd.condition} onChange={function(e) { var v = e.target.value; setNProd(function(p) { return Object.assign({}, p, { condition: v }); }); }} style={IS}>{CONDS.map(function(c) { return <option key={c}>{c}</option>; })}</select>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Description</p>
                      <textarea className="adm-in" value={nProd.description} onChange={function(e) { var v = e.target.value; setNProd(function(p) { return Object.assign({}, p, { description: v }); }); }} style={Object.assign({}, IS, { minHeight: '90px', resize: 'vertical' })} placeholder="Describe the item..." />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignContent: 'start' }}>
                    <FileField label="Main *" value={nImg0} onChange={setNImg0} existingUrl={null} />
                    <FileField label="Image 2" value={nImg1} onChange={setNImg1} existingUrl={null} />
                    <FileField label="Image 3" value={nImg2} onChange={setNImg2} existingUrl={null} />
                  </div>
                </div>
                <button onClick={addListing} disabled={addBusy} style={{ marginTop: '20px', width: '100%', padding: '13px', background: addBusy ? '#1e2a3a' : '#4dd4ac', color: addBusy ? 'rgba(255,255,255,0.3)' : '#000', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: addBusy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {addBusy ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,4vw,1.7rem)', color: '#4dd4ac', margin: '0 0 6px' }}>Bookings</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 20px' }}>Manage customer bookings</p>
              {bookings.length === 0
                ? <Empty icon="[]" title="No bookings yet" sub="Bookings will appear here." />
                : bookings.map(function(b) {
                  return (
                    <Card key={b.id} color="#1e2a3a">
                      <p style={{ color: '#4dd4ac', fontWeight: '700', margin: '0 0 4px' }}>{b.product_title || b.product_id}</p>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', margin: '0 0 8px' }}>{b.customer_name} · {new Date(b.created_at).toLocaleDateString()}</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Badge s={b.status} />
                        <OutlineBtn color="#4dd4ac" onClick={function() { updateBooking(b.id, 'confirmed'); }}>Confirm</OutlineBtn>
                        <OutlineBtn color="#ff6b6b" onClick={function() { updateBooking(b.id, 'cancelled'); }}>Cancel</OutlineBtn>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}

          {tab === 'messages' && (
            <div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,4vw,1.7rem)', color: '#4dd4ac', margin: '0 0 6px' }}>Messages</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: '0 0 20px' }}>Agent conversations</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px,200px) 1fr', gap: '14px', minHeight: '400px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {convs.length === 0
                    ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>No conversations</p>
                    : convs.map(function(cv) {
                      return (
                        <button key={cv.id} onClick={function() { loadMsgs(cv); }}
                          style={{ padding: '10px 12px', background: selConv && selConv.id === cv.id ? 'rgba(77,212,172,0.15)' : '#151c27', border: '2px solid ' + (selConv && selConv.id === cv.id ? '#4dd4ac' : '#1e2a3a'), borderRadius: '9px', cursor: 'pointer', textAlign: 'left', color: 'inherit', fontFamily: 'inherit' }}>
                          <p style={{ color: '#4dd4ac', fontWeight: '700', margin: '0 0 2px', fontSize: '0.82rem' }}>#{cv.id ? cv.id.slice(0, 6) : ''}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', margin: 0 }}>{new Date(cv.last_message_at).toLocaleString()}</p>
                        </button>
                      );
                    })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', background: '#151c27', border: '2px solid #1e2a3a', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '260px' }}>
                    {msgs.map(function(m) {
                      return (
                        <div key={m.id} style={{ alignSelf: m.is_agent ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                          {m.is_agent && <p style={{ fontSize: '10px', color: '#4dd4ac', margin: '0 0 3px', textAlign: 'right', fontWeight: '600' }}>{m.agent_name || 'Agent'}</p>}
                          <div style={{ padding: '9px 13px', borderRadius: '10px', background: m.is_agent ? 'rgba(77,212,172,0.15)' : '#1e2a3a', color: 'rgba(255,255,255,0.85)', fontSize: '0.83rem', lineHeight: 1.5 }}>
                            {m.content ? m.content.replace(/^\[.+?\]\s*/, '') : ''}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={msgsEnd} />
                  </div>
                  <div style={{ padding: '12px', borderTop: '2px solid #1e2a3a', display: 'flex', gap: '8px' }}>
                    <div ref={pickerRef} style={{ position: 'relative' }}>
                      <button onClick={function() { setShowPicker(function(p) { return !p; }); }}
                        style={{ padding: '8px 10px', background: '#1e2a3a', border: '2px solid #2a3a4a', borderRadius: '8px', color: '#4dd4ac', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', fontFamily: 'inherit' }}>
                        {selAgent.avatar} v
                      </button>
                      {showPicker && (
                        <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#0d1520', border: '2px solid #1e2a3a', borderRadius: '10px', padding: '6px', zIndex: 100, marginBottom: '4px', minWidth: '180px' }}>
                          {AGENTS.map(function(a) {
                            return (
                              <button key={a.name} onClick={function() { setSelAgent(a); setShowPicker(false); }}
                                style={{ width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: '7px', color: a.name === selAgent.name ? '#4dd4ac' : 'rgba(255,255,255,0.7)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{a.avatar}</span><span>{a.name}</span>
                                {a.online && <span style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#4dd4ac' }} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <input value={replyText} onChange={function(e) { setReplyText(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) sendReply(); }}
                      placeholder={'Reply as ' + selAgent.name} className="adm-in"
                      style={{ flex: 1, background: '#0e1117', border: '2px solid #1e2a3a', color: '#fff', padding: '8px 12px', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', fontSize: '0.85rem' }} />
                    <button onClick={sendReply} style={{ padding: '8px 16px', background: '#4dd4ac', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Send</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="adm-sb" style={{ background: '#0d1520', border: '2px solid #1e2a3a', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Georgia,serif', color: '#4dd4ac', margin: 0 }}>Edit Listing</h3>
              <button onClick={function() { setEditOpen(false); }} style={{ background: '#1e2a3a', border: 'none', borderRadius: '7px', color: 'rgba(255,255,255,0.5)', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' }}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['Title','title','text'],['Price','price','number'],['Location','location','text'],['Business Name','business_name','text']].map(function(row) {
                return (
                  <div key={row[1]}>
                    <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>{row[0]}</p>
                    <input className="adm-in" type={row[2]} value={editF[row[1]] || ''} onChange={function(e) { var v = e.target.value; setEditF(function(f) { return Object.assign({}, f, { [row[1]]: v }); }); }} style={IS} />
                  </div>
                );
              })}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Status</p>
                <select className="adm-in" value={editF.status || 'active'} onChange={function(e) { var v = e.target.value; setEditF(function(f) { return Object.assign({}, f, { status: v }); }); }} style={IS}>
                  {['active','sold','pending','out_of_stock'].map(function(s) { return <option key={s}>{s}</option>; })}
                </select>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Description</p>
                <textarea className="adm-in" value={editF.description || ''} onChange={function(e) { var v = e.target.value; setEditF(function(f) { return Object.assign({}, f, { description: v }); }); }} style={Object.assign({}, IS, { minHeight: '80px', resize: 'vertical' })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <FileField label="Image 1" value={eImg0} onChange={setEImg0} existingUrl={editExistingImgs[0]} />
                <FileField label="Image 2" value={eImg1} onChange={setEImg1} existingUrl={editExistingImgs[1]} />
                <FileField label="Image 3" value={eImg2} onChange={setEImg2} existingUrl={editExistingImgs[2]} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={function() { setEditOpen(false); }} style={{ flex: 1, padding: '11px', background: 'transparent', border: '2px solid #1e2a3a', borderRadius: '9px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>Cancel</button>
              <button onClick={saveEdit} disabled={editBusy} style={{ flex: 2, padding: '11px', background: editBusy ? '#1e2a3a' : '#4dd4ac', color: editBusy ? 'rgba(255,255,255,0.3)' : '#000', border: 'none', borderRadius: '9px', fontWeight: '700', cursor: editBusy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {editBusy ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
