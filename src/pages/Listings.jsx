import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

// ── Product Card ──
function ProductCard({ product, onClick }) {
  const isSold = product.status === 'sold';
  return (
    <div onClick={() => onClick(product)} style={{ backgroundColor: '#000000', cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'opacity 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      {isSold && (<div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2, backgroundColor: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '4px' }}>Sold</div>)}
      {!isSold && (<div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2, backgroundColor: '#065f46', color: '#ffffff', fontSize: '10px', fontWeight: '700', padding: '4px 9px', borderRadius: '4px', fontFamily: "'Times New Roman', Times, serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Available</div>)}
      <div style={{ backgroundColor: '#111827', aspectRatio: '1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1e293b' }}>
        {product.image_url ? (<img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} loading="lazy" />) : (<span style={{ fontSize: '3rem', opacity: 0.3 }}>🏺</span>)}
      </div>
      <div style={{ padding: '14px 4px 20px' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748b', marginBottom: '5px' }}>{product.category || 'General'}</p>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '17px', fontWeight: '500', color: '#e2e8f0', marginBottom: '8px', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.title}</p>
        <span style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
          ${parseFloat(product.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

// ── Price Range Slider ──
function PriceRangeSlider({ min, max, value, onChange }) {
  const getPercent = (val) => Math.round(((val - min) / (max - min)) * 100);
  return (
    <div style={{ padding: '8px 0 16px' }}>
      <div style={{ position: 'relative', height: '4px', borderRadius: '2px', backgroundColor: '#1e293b', margin: '16px 0 24px' }}>
        <div style={{ position: 'absolute', height: '100%', borderRadius: '2px', backgroundColor: '#0bbfaa', left: `${getPercent(value[0])}%`, width: `${getPercent(value[1]) - getPercent(value[0])}%` }} />
        <input type="range" min={min} max={max} value={value[0]} onChange={e => { const v = Math.min(Number(e.target.value), value[1] - 10); onChange([v, value[1]]); }} style={{ position: 'absolute', width: '100%', height: '4px', opacity: 0, cursor: 'pointer', zIndex: value[0] > max - 10 ? 5 : 3 }} />
        <input type="range" min={min} max={max} value={value[1]} onChange={e => { const v = Math.max(Number(e.target.value), value[0] + 10); onChange([value[0], v]); }} style={{ position: 'absolute', width: '100%', height: '4px', opacity: 0, cursor: 'pointer', zIndex: 4 }} />
        <div style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', left: `${getPercent(value[0])}%`, width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#0bbfaa', border: '2px solid #0d1b2a', pointerEvents: 'none', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', left: `${getPercent(value[1])}%`, width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#0bbfaa', border: '2px solid #0d1b2a', pointerEvents: 'none', zIndex: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', color: '#94a3b8' }}>
        <span>${value[0].toLocaleString()}</span><span>${value[1].toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── Main Listings ──
export default function Listings({ products = [], refreshProducts, cart = [], setCart = () => {}, isLoggedIn = false, onNavigate }) {
  const [sortBy, setSortBy] = useState('default');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showCartPage, setShowCartPage] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const globalMin = 29; const globalMax = 2000;
  const [priceRange, setPriceRange] = useState([29, 2000]);
  const [appliedPrice, setAppliedPrice] = useState([29, 2000]);

  const PAGE_SIZE = 60;
  const [currentPage, setCurrentPage] = useState(1);

  const [listingSearch, setListingSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => { setPriceRange([29, 2000]); setAppliedPrice([29, 2000]); }, []);

  const categories = ['All', 'Furniture', 'Electronics', 'Appliances', 'For Kids', 'Decor', 'Kitchenware'];

  useEffect(() => {
    const savedCategory = sessionStorage.getItem('selectedCategory');
    if (savedCategory) { setCategoryFilter(savedCategory); sessionStorage.removeItem('selectedCategory'); }

    const savedSearch = sessionStorage.getItem('searchQuery');
    if (savedSearch) {
      setListingSearch(savedSearch);
      setAppliedSearch(savedSearch);
      sessionStorage.removeItem('searchQuery');
    }

    const selectedProductId = sessionStorage.getItem('selectedProductId');
    if (selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        supabase.from('product_images').select('*').eq('product_id', product.id).order('sort_order', { ascending: true }).then(({ data: imgs }) => {
          setSelectedProduct({ ...product, product_images: imgs || [] });
        });
      }
      sessionStorage.removeItem('selectedProductId');
    }
  }, [products]);

  const categoryCounts = categories.reduce((acc, cat) => { acc[cat] = cat === 'All' ? products.length : products.filter(p => p.category === cat).length; return acc; }, {});

  let filtered = categoryFilter === 'All' ? products : products.filter(p => p.category === categoryFilter);
  filtered = filtered.filter(p => { const price = parseFloat(p.price || 0); return price >= appliedPrice[0] && price <= appliedPrice[1]; });

  if (appliedSearch.trim()) {
    const q = appliedSearch.trim().toLowerCase();
    filtered = filtered.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return parseFloat(a.price || 0) - parseFloat(b.price || 0);
      case 'price-high': return parseFloat(b.price || 0) - parseFloat(a.price || 0);
      case 'name': return (a.title || '').localeCompare(b.title || '');
      default: return 0;
    }
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pagedProducts = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleProductClick = async (product) => {
    try {
      const { data: imgs } = await supabase.from('product_images').select('*').eq('product_id', product.id).order('sort_order', { ascending: true });
      setSelectedProduct({ ...product, product_images: imgs || [] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSelectedProduct(product);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToListings = () => setSelectedProduct(null);
  const handleViewCart = () => { setShowCartSidebar(false); setShowCartPage(true); setSelectedProduct(null); };

  const handleListingSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAppliedSearch(listingSearch);
    setCurrentPage(1);
  };

  const clearSearch = () => { setListingSearch(''); setAppliedSearch(''); setCurrentPage(1); };

  if (showCartPage) return <CartPage cart={cart} setCart={setCart} onBack={() => setShowCartPage(false)} />;
  if (selectedProduct) return (
    <>
      <ProductDetail
        product={selectedProduct}
        allProducts={products}
        onBack={handleBackToListings}
        onProductClick={handleProductClick}
        cart={cart}
        setCart={setCart}
        onShowCart={() => setShowCartSidebar(true)}
        isLoggedIn={isLoggedIn}
        onNavigate={onNavigate}
      />
      {showCartSidebar && <CartSidebar cart={cart} setCart={setCart} onClose={() => setShowCartSidebar(false)} onViewCart={handleViewCart} />}
    </>
  );

  const sortLabels = { default: 'Default sorting', 'price-low': 'Price: Low to High', 'price-high': 'Price: High to Low', name: 'Name: A to Z' };

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        .filter-drawer { transition: transform 0.3s ease; }
        .listings-search-input::placeholder { color: #475569; }
        .listings-search-input:focus { border-color: #0bbfaa !important; }
        .back-home-link { display: inline-flex; align-items: center; gap: 6px; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; color: #0bbfaa; text-decoration: none; cursor: pointer; transition: opacity 0.2s; }
        .back-home-link:hover { opacity: 0.7; }
      `}</style>

      {filterOpen && <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9998 }} />}

      {/* ── Filter Drawer ── */}
      <div className="filter-drawer" style={{ position: 'fixed', top: 0, left: 0, height: '100%', width: '300px', backgroundColor: '#000000', zIndex: 9999, boxShadow: '4px 0 32px rgba(0,0,0,0.8)', transform: filterOpen ? 'translateX(0)' : 'translateX(-100%)', display: 'flex', flexDirection: 'column', overflowY: 'auto', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 20px 0' }}><button onClick={() => setFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '26px', color: '#475569', lineHeight: 1 }}>×</button></div>
        <div style={{ padding: '8px 28px 40px' }}>
          <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '20px', fontWeight: '700', color: '#e2e8f0', marginBottom: '16px' }}>Filter by price</h3>
          <PriceRangeSlider min={globalMin} max={globalMax} value={priceRange} onChange={setPriceRange} />
          <button onClick={() => { setAppliedPrice(priceRange); setFilterOpen(false); }} style={{ padding: '9px 28px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0d1b2a', backgroundColor: '#0bbfaa', border: 'none', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif", marginBottom: '36px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#09a896'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0bbfaa'}>Apply</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '20px', fontWeight: '700', color: '#e2e8f0', margin: 0 }}>Categories</h3><span style={{ fontSize: '16px', color: '#64748b' }}>∧</span></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categories.filter(c => c !== 'All').map(cat => {
              const count = categoryCounts[cat] || 0;
              const catProduct = products.find(p => p.category === cat && p.image_url);
              return (
                <button key={cat} onClick={() => { setCategoryFilter(cat); setFilterOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#1e293b', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {catProduct ? <img src={catProduct.image_url} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.2rem', opacity: 0.4 }}>🏺</span>}
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px', color: categoryFilter === cat ? '#0bbfaa' : '#94a3b8', fontWeight: categoryFilter === cat ? '600' : '400' }}>{cat} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 32px' }}>

        {/* ── Back Home Link ── */}
        <div style={{ marginBottom: '16px' }}>
          <span
            className="back-home-link"
            onClick={() => onNavigate ? onNavigate('home') : window.history.back()}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back Home
          </span>
        </div>

        {/* ── Search Bar ── */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', fontStyle: 'italic', color: '#ffffff', marginBottom: '12px', letterSpacing: '0.06em', fontWeight: '800', textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>I am searching for...</p>
          <div style={{ display: 'flex', gap: '8px', maxWidth: '600px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={searchInputRef}
                type="text"
                className="listings-search-input"
                placeholder="Search items, categories..."
                value={listingSearch}
                onChange={e => setListingSearch(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleListingSearch(e)}
                style={{ width: '100%', padding: '12px 40px 12px 16px', fontSize: '14px', fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#e2e8f0', backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              />
              {listingSearch && (
                <button onClick={clearSearch} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#e2e8f0', fontSize: '20px', lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>
            <button
              onClick={handleListingSearch}
              style={{ padding: '12px 20px', backgroundColor: '#0bbfaa', color: '#0d1b2a', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px', fontFamily: "'Times New Roman', Times, serif", letterSpacing: '0.05em', flexShrink: 0, transition: 'background-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#09a896'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0bbfaa'}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
          {appliedSearch && (
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', color: '#94a3b8', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Showing results for <strong style={{ color: '#0bbfaa' }}>"{appliedSearch}"</strong> — {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
              <button onClick={clearSearch} style={{ backgroundColor: '#1e293b', border: '1.5px solid #ffffff', borderRadius: '4px', cursor: 'pointer', color: '#ffffff', fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Times New Roman', Times, serif", padding: '5px 14px' }}>✕ Clear Search</button>
            </p>
          )}
          {(categoryFilter !== 'All' || appliedPrice[0] !== globalMin || appliedPrice[1] !== globalMax) && (
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {categoryFilter !== 'All' && <span style={{ color: '#0bbfaa' }}>Category: {categoryFilter}</span>}
              {(appliedPrice[0] !== globalMin || appliedPrice[1] !== globalMax) && <span style={{ color: '#0bbfaa' }}>Price: ${appliedPrice[0]}–${appliedPrice[1]}</span>}
              <button onClick={() => { setCategoryFilter('All'); setAppliedPrice([globalMin, globalMax]); setPriceRange([globalMin, globalMax]); setCurrentPage(1); }} style={{ backgroundColor: '#1e293b', border: '1.5px solid #ffffff', borderRadius: '4px', cursor: 'pointer', color: '#ffffff', fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Times New Roman', Times, serif", padding: '5px 14px' }}>✕ Clear Filters</button>
            </p>
          )}
        </div>

        {/* ── Toolbar: Filter + Sort ── */}
        {showSortDropdown && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowSortDropdown(false)} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <style>{`.filter-btn-text { display: inline; } @media (max-width: 639px) { .filter-btn-text { display: none; } .filter-btn { padding: 10px 12px !important; } }`}</style>
          <button onClick={() => setFilterOpen(true)} className="filter-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e2e8f0', backgroundColor: 'transparent', border: '1.5px solid #334155', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif", transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0bbfaa'; e.currentTarget.style.color = '#0d1b2a'; e.currentTarget.style.borderColor = '#0bbfaa'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#334155'; }}>
            <svg width="14" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 14"><line x1="0" y1="2" x2="16" y2="2"/><line x1="3" y1="7" x2="13" y2="7"/><line x1="6" y1="12" x2="10" y2="12"/></svg>
            <span className="filter-btn-text">Filter</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', color: '#64748b' }}>{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</span>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowSortDropdown(!showSortDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '13px', backgroundColor: '#111827', color: '#e2e8f0', border: '1px solid #1e293b', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif", minWidth: '200px', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#0bbfaa'} onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}>
                <span>{sortLabels[sortBy]}</span>
                <svg width="10" height="6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4"/></svg>
              </button>
              {showSortDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, backgroundColor: '#111827', border: '1px solid #1e293b', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 50 }}>
                  {Object.entries(sortLabels).map(([val, label]) => (
                    <button key={val} onClick={() => { setSortBy(val); setShowSortDropdown(false); }} style={{ width: '100%', textAlign: 'left', padding: '11px 16px', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif", backgroundColor: sortBy === val ? '#1e293b' : 'transparent', color: sortBy === val ? '#0bbfaa' : '#94a3b8', fontWeight: sortBy === val ? '600' : '400' }} onMouseEnter={e => { if (sortBy !== val) e.currentTarget.style.backgroundColor = '#1e293b'; }} onMouseLeave={e => { if (sortBy !== val) e.currentTarget.style.backgroundColor = 'transparent'; }}>{label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Product Grid ── */}
        {pagedProducts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 12px' }} className="listings-grid">
            <style>{`@media (min-width: 640px) { .listings-grid { grid-template-columns: repeat(3, 1fr) !important; } } @media (min-width: 1024px) { .listings-grid { grid-template-columns: repeat(4, 1fr) !important; } } @media (min-width: 1400px) { .listings-grid { grid-template-columns: repeat(5, 1fr) !important; } }`}</style>
            {pagedProducts.map(product => (<ProductCard key={product.id} product={product} onClick={handleProductClick} />))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '1.4rem', color: '#64748b', marginBottom: '8px' }}>{products.length === 0 ? 'No products available yet' : 'No products match your filters'}</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px', color: '#475569' }}>{products.length === 0 ? 'Check back soon for new items!' : 'Try adjusting your search or filters'}</p>
            {appliedSearch && <button onClick={clearSearch} style={{ marginTop: '16px', padding: '10px 28px', backgroundColor: '#0bbfaa', color: '#0d1b2a', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Clear Search</button>}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '56px', paddingBottom: '40px', flexWrap: 'wrap' }}>
            <style>{`.pg-btn { font-family: 'Times New Roman', Times, serif; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; border: 1px solid #1e293b; background: transparent; color: #94a3b8; cursor: pointer; padding: 8px 14px; transition: all 0.15s; } .pg-btn:hover { border-color: #0bbfaa; color: #0bbfaa; } .pg-btn.active { background: #0bbfaa; border-color: #0bbfaa; color: #0d1b2a; } .pg-btn:disabled { opacity: 0.3; cursor: default; }`}</style>
            <button className="pg-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
              const show = p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
              const isDot = !show && (p === 2 && currentPage > 4) || (p === totalPages - 1 && currentPage < totalPages - 3);
              if (!show && !isDot) return null;
              if (isDot) return <span key={p} style={{ color: '#334155', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', padding: '0 4px' }}>…</span>;
              return <button key={p} className={`pg-btn${p === currentPage ? ' active' : ''}`} onClick={() => goToPage(p)}>{p}</button>;
            })}
            <button className="pg-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── AI Agent data generator ──
function getAIAgent(productId) {
  const agents = [
    { name: 'Agent Sarah K.', avatar: '👩‍💼', memberMonths: 8, type: 'private', online: false, phone: '3238006149' },
    { name: 'Agent James M.', avatar: '👨‍💼', memberMonths: 14, type: 'business', online: true, phone: '3238006149' },
    { name: 'Agent Amara T.', avatar: '👩‍🔬', memberMonths: 3, type: 'private', online: false, phone: '3238006149' },
    { name: 'Agent Leo B.', avatar: '🧑‍💻', memberMonths: 22, type: 'business', online: true, phone: '3238006149' },
    { name: 'Agent Nina R.', avatar: '👩‍🎨', memberMonths: 6, type: 'private', online: false, phone: '3238006149' },
  ];
  const idx = productId ? (productId.toString().charCodeAt(0) % agents.length) : 0;
  return agents[idx];
}

// ── Message Modal ──
function MessageModal({ onClose, agentName, productTitle, productPrice, isLoggedIn = false, onNavigate }) {
  const defaultMsg = `Hello ${agentName}, I have seen this item "${productTitle}" of $${productPrice} and I am really interested in buying it, may you provide me with payment method and delivery information.`;
  const [message, setMessage] = useState(defaultMsg);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { onClose(); if (onNavigate) onNavigate('signin'); }
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;
    sessionStorage.setItem('pendingChatMessage', JSON.stringify({ text: message, agentName, productTitle, productPrice, timestamp: new Date().toISOString() }));
    sessionStorage.setItem('dashboardTab', 'messages');
    setSent(true);
    setTimeout(() => { onClose(); if (onNavigate) onNavigate('seller-dashboard'); }, 1200);
  };

  if (!isLoggedIn) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '440px', borderRadius: '12px', border: '1px solid #1e293b', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', backgroundColor: '#111827' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', fontWeight: '700', color: '#e2e8f0' }}>Message {agentName}</h3>
          <button onClick={onClose} style={{ fontSize: '24px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', fontWeight: '600', color: '#0bbfaa' }}>Message sent!</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Taking you to your messages…</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0d1b2a' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Regarding:</p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', fontWeight: '600', color: '#0bbfaa' }}>{productTitle}</p>
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
              style={{ width: '100%', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', resize: 'none', outline: 'none', marginBottom: '16px', fontSize: '13px', backgroundColor: '#0d1b2a', color: '#e2e8f0', fontFamily: "'Cormorant Garamond', Georgia, serif", boxSizing: 'border-box' }} />
            <button onClick={handleSend} disabled={!message.trim()}
              style={{ width: '100%', padding: '12px', fontWeight: '700', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0d1b2a', backgroundColor: '#0bbfaa', border: 'none', borderRadius: '6px', cursor: message.trim() ? 'pointer' : 'default', opacity: message.trim() ? 1 : 0.5, fontFamily: "'Times New Roman', Times, serif" }}>
              Send Message
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Product Detail ──
function ProductDetail({ product = {}, allProducts = [], onProductClick, onBack, cart = [], setCart = () => {}, onShowCart = () => {}, isLoggedIn = false, onNavigate }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const defaultImage = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=900&h=600&fit=crop';
  const productData = {
    title: product?.title || 'Product',
    price: parseFloat(product?.price || 0),
    image_url: product?.image_url || defaultImage,
    description: product?.description || 'No description available.',
    category: product?.category || 'Others',
    condition: product?.condition || product?.condition_status || 'Used',
    listingId: product?.id ? String(product.id).slice(-5) : '65263',
  };

  const buildImages = () => {
    if (product?.product_images && product.product_images.length > 0) {
      const imgs = product.product_images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(i => i.image_url).filter(Boolean);
      if (imgs.length > 0) { while (imgs.length < 3) imgs.push(imgs[imgs.length - 1]); return imgs.slice(0, 3); }
    }
    if (product?.extra_images && product.extra_images.length > 0) {
      const imgs = [product.image_url, ...product.extra_images].filter(Boolean);
      while (imgs.length < 3) imgs.push(imgs[imgs.length - 1]);
      return imgs.slice(0, 3);
    }
    const base = product?.image_url || defaultImage;
    return [base, base, base];
  };

  const images = buildImages();
  const agent = getAIAgent(product?.id);
  const maskedPhone = phoneRevealed ? agent.phone : `${agent.phone.slice(0, 3)} * * * * * * *`;

  const relatedItems = allProducts
    .filter(p => p.id !== product?.id && p.category === productData.category)
    .slice(0, 3);

  // ── Related item click: fetch images then open detail, scroll to top ──
  const handleRelatedClick = async (rel) => {
    try {
      const { data: imgs } = await supabase.from('product_images').select('*').eq('product_id', rel.id).order('sort_order', { ascending: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onProductClick({ ...rel, product_images: imgs || [] });
    } catch {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onProductClick(rel);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#e2e8f0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        .detail-breadcrumb { font-size:13px; display:flex; align-items:center; gap:6px; margin-bottom:20px; flex-wrap:wrap; font-family:'Cormorant Garamond',Georgia,serif; }
        .detail-breadcrumb .crumb-link { color:#0bbfaa; cursor:pointer; transition:opacity 0.15s; }
        .detail-breadcrumb .crumb-link:hover { opacity:0.75; }
        .detail-breadcrumb .sep { color:#334155; margin:0 2px; }
        .detail-breadcrumb .crumb-current { color:#0bbfaa; opacity:0.65; }
        .detail-outer { display:flex; gap:32px; align-items:flex-start; }
        .detail-left { flex:1; min-width:0; display:flex; flex-direction:column; gap:16px; }
        .detail-right { width:300px; flex-shrink:0; display:flex; flex-direction:column; gap:16px; }
        .detail-image-wrap { display:flex; flex-direction:row; gap:12px; }
        .detail-thumbs { display:flex; flex-direction:column; gap:10px; flex-shrink:0; }
        .title-price-block-desktop { display:block; }
        .title-price-block-mobile { display:none; }
        .detail-text-offset { padding-left: 92px; }
        .related-card { display:flex; flex-direction:column; background:none; border:1px solid #1e293b; cursor:pointer; text-align:left; padding:0; overflow:hidden; transition:border-color 0.2s, transform 0.2s; }
        .related-card:hover { border-color:#0bbfaa; transform:translateY(-2px); }
        @media (max-width:639px) {
          .detail-outer { flex-direction:column; }
          .detail-right { width:100%; }
          .detail-image-wrap { flex-direction:column; }
          .detail-thumbs { flex-direction:row; order:-1; }
          .title-price-block-desktop { display:none; }
          .title-price-block-mobile { display:block; }
          .detail-text-offset { padding-left: 0; }
        }
      `}</style>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        <div className="detail-breadcrumb">
          <span className="crumb-link" onClick={onBack}>Shop</span>
          <span className="sep">&gt;</span>
          <span className="crumb-link" onClick={onBack}>Search Results</span>
          <span className="sep">&gt;</span>
          <span className="crumb-link" onClick={() => { sessionStorage.setItem('selectedCategory', productData.category); onBack(); }}>{productData.category}</span>
          <span className="sep">&gt;</span>
          <span className="crumb-current">{productData.title}</span>
        </div>
        <div className="detail-outer">
          <div className="detail-left">
            <div className="detail-image-wrap">
              <div className="detail-thumbs">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)} style={{ width: '80px', height: '80px', overflow: 'hidden', borderRadius: '0', border: `2px solid ${selectedImage === idx ? '#0bbfaa' : '#1e293b'}`, cursor: 'pointer', padding: 0, opacity: selectedImage === idx ? 1 : 0.5, transition: 'opacity 0.2s, border-color 0.2s', flexShrink: 0 }}>
                    <img src={img} alt={`View ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 0 }} />
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0, borderRadius: '0', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'relative', height: '480px', backgroundColor: '#000' }}>
                  <img src={images[selectedImage] || defaultImage} alt={productData.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 0 }} />
                  {(() => {
                    const isSold = product?.status === 'sold';
                    const isOOS = product?.status === 'out_of_stock' || product?.status === 'unavailable';
                    const label = isSold ? 'Sold' : isOOS ? 'Out of Stock' : 'Available';
                    const bg = isSold ? '#dc2626' : isOOS ? '#92400e' : '#065f46';
                    return (
                      <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 3, backgroundColor: bg, color: '#ffffff', fontSize: '11px', fontWeight: '700', padding: '5px 12px', borderRadius: '4px', fontFamily: "'Times New Roman', Times, serif", letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</div>
                    );
                  })()}
                  <button onClick={() => setShowImageModal(true)} style={{ position: 'absolute', bottom: '12px', right: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0', backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer' }}>
                    <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Title + Price desktop */}
            <div className="title-price-block-desktop detail-text-offset">
              <h1 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '26px', fontWeight: '700', color: '#0bbfaa', lineHeight: 1.3, margin: '0 0 6px 0' }}>{productData.title}</h1>
              <span style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '22px', fontWeight: '700', color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                ${productData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Item Details desktop */}
            <div className="title-price-block-desktop detail-text-offset" style={{ marginTop: '4px' }}>
              <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '10px', marginTop: 0 }}>Items Details</h2>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>{productData.description}</p>
            </div>

            {/* ── Related Items desktop ── */}
            {relatedItems.length > 0 && (
              <div className="title-price-block-desktop detail-text-offset" style={{ marginTop: '8px' }}>
                <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '14px', marginTop: 0 }}>Related Items</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {relatedItems.map(rel => (
                    <button key={rel.id} className="related-card" onClick={() => handleRelatedClick(rel)}>
                      <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', backgroundColor: '#111827', position: 'relative' }}>
                        {rel.image_url
                          ? <img src={rel.image_url} alt={rel.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                          : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem', opacity: 0.3 }}>🏺</span>}
                        <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: rel.status === 'sold' ? '#dc2626' : '#065f46', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '3px 7px', fontFamily: "'Times New Roman', Times, serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {rel.status === 'sold' ? 'Sold' : 'Available'}
                        </div>
                      </div>
                      <div style={{ padding: '10px 12px 12px' }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', color: '#0bbfaa', fontWeight: '500', margin: '0 0 4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.35 }}>{rel.title}</p>
                        <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                          ${parseFloat(rel.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="detail-right">
            {/* Mobile title + price */}
            <div className="title-price-block-mobile">
              <h1 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '22px', fontWeight: '700', color: '#0bbfaa', lineHeight: 1.3, margin: '0 0 4px 0' }}>{productData.title}</h1>
              <span style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '20px', fontWeight: '700', color: '#ffffff', display: 'block', marginBottom: '16px' }}>
                ${productData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Agent container */}
            <div style={{ border: '1px solid #1e293b', padding: '24px', backgroundColor: '#111827', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', background: 'linear-gradient(135deg, #0bbfaa 0%, #09a896 100%)', border: '2px solid #0bbfaa', flexShrink: 0 }}>{agent.avatar}</div>
                <div>
                  <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: '700', color: '#0bbfaa', marginBottom: '2px' }}>{agent.name}</h3>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '12px', color: '#64748b', margin: 0 }}>Member since: {agent.memberMonths} months</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '12px', color: '#64748b', margin: 0 }}>Account type: {agent.type}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: agent.online ? '#22c55e' : '#475569', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '12px', color: '#64748b' }}>User is {agent.online ? 'online' : 'offline'}</span>
                </div>
                <button style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', color: '#0bbfaa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px', padding: 0 }}>See all ads</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#0d1b2a', padding: '10px 14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', flexShrink: 0 }}>
                  <svg style={{ width: '16px', height: '16px', color: '#0bbfaa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <span style={{ flex: 1, fontFamily: 'monospace', fontWeight: '600', fontSize: '13px', color: '#e2e8f0', letterSpacing: '0.1em' }}>{maskedPhone}</span>
                <button onClick={() => setPhoneRevealed(r => !r)} style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0bbfaa', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  <svg style={{ width: '16px', height: '16px', color: '#0d1b2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {phoneRevealed
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                  </svg>
                </button>
              </div>
              <button onClick={() => setShowChatModal(true)}
                style={{ width: '100%', padding: '14px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e2e8f0', backgroundColor: 'transparent', border: '1.5px solid #334155', borderRadius: '0', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0bbfaa'; e.currentTarget.style.color = '#0d1b2a'; e.currentTarget.style.borderColor = '#0bbfaa'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#334155'; }}>
                Chat
              </button>
            </div>

            {showChatModal && (
              <MessageModal onClose={() => setShowChatModal(false)} agentName={agent.name} productTitle={productData.title} productPrice={productData.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} isLoggedIn={isLoggedIn} onNavigate={onNavigate} />
            )}

            {/* Description mobile */}
            <div className="detail-desc-mobile">
              <style>{`.detail-desc-mobile { display: none; } @media (max-width: 639px) { .detail-desc-mobile { display: block; border-top: 1px solid #1e293b; padding-top: 16px; } }`}</style>
              <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' }}>Items Details</h2>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px', lineHeight: 1.7, color: '#94a3b8' }}>{productData.description}</p>
            </div>

            {/* ── Related Items mobile ── */}
            {relatedItems.length > 0 && (
              <div className="detail-related-mobile">
                <style>{`.detail-related-mobile { display: none; } @media (max-width: 639px) { .detail-related-mobile { display: block; border-top: 1px solid #1e293b; padding-top: 16px; } }`}</style>
                <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>Related Items</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {relatedItems.map(rel => (
                    <button key={rel.id} onClick={() => handleRelatedClick(rel)}
                      style={{ display: 'flex', gap: '12px', background: 'none', border: '1px solid #1e293b', cursor: 'pointer', textAlign: 'left', padding: '10px', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s', alignItems: 'center' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0bbfaa'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      <div style={{ width: '60px', height: '60px', overflow: 'hidden', backgroundColor: '#111827', flexShrink: 0 }}>
                        {rel.image_url ? <img src={rel.image_url} alt={rel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.5rem', opacity: 0.3 }}>🏺</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', color: '#0bbfaa', fontWeight: '500', margin: '0 0 4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.35 }}>{rel.title}</p>
                        <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                          ${parseFloat(rel.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {showImageModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.97)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setShowImageModal(false)}>
            <button style={{ position: 'absolute', top: '16px', right: '16px', color: 'white', fontSize: '36px', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
            <img src={images[selectedImage]} alt={productData.title} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cart Sidebar ──
function CartSidebar({ cart = [], setCart, onClose, onViewCart }) {
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 50 }} onClick={onClose} />
      <div style={{ position: 'fixed', right: 0, top: 0, height: '100%', width: '384px', backgroundColor: '#111827', zIndex: 51, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.5)', borderLeft: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '20px', fontWeight: '700', color: '#e2e8f0' }}>Shopping Cart</h2>
          <button onClick={onClose} style={{ fontSize: '24px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {cart.length === 0
            ? <p style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Your cart is empty</p>
            : cart.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1e293b' }}>
                <img src={item.image_url} alt={item.title} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #1e293b' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', fontWeight: '500', color: '#e2e8f0', marginBottom: '4px' }}>{item.title}</p>
                  <p style={{ fontFamily: "'Times New Roman', Times, serif", color: '#ffffff', marginBottom: '8px' }}>${item.price}</p>
                  <button onClick={() => removeFromCart(index)} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
                </div>
              </div>
            ))}
        </div>
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid #1e293b', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#64748b' }}>Subtotal:</span>
              <span style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: '700', color: '#e2e8f0' }}>${subtotal.toFixed(2)}</span>
            </div>
            <button onClick={onViewCart} style={{ width: '100%', padding: '12px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0d1b2a', backgroundColor: '#0bbfaa', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>View Cart</button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Cart Page ──
function CartPage({ cart = [], setCart, onBack }) {
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const u = [...cart]; u[index].quantity = newQuantity; setCart(u);
  };
  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px', backgroundColor: '#000000', color: '#e2e8f0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#0bbfaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px' }}>
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Continue Shopping
        </button>
        <h1 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '40px', fontWeight: '800', color: '#ffffff', marginBottom: '32px' }}>Cart</h1>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', border: '1px solid #1e293b', backgroundColor: '#111827' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', color: '#64748b', marginBottom: '24px' }}>Your cart is empty</p>
            <button onClick={onBack} style={{ padding: '12px 32px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0d1b2a', backgroundColor: '#0bbfaa', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Start Shopping</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            <div style={{ border: '1px solid #1e293b', overflow: 'hidden', backgroundColor: '#111827' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    {['Product', 'Price', 'Quantity', 'Subtotal'].map(h => <th key={h} style={{ padding: '16px', textAlign: 'left', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: '700', color: '#64748b' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <button onClick={() => removeFromCart(index)} style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>⊗</button>
                          <img src={item.image_url || ''} alt={item.title} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #1e293b' }} />
                          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', fontWeight: '500', color: '#e2e8f0' }}>{item.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontFamily: "'Times New Roman', Times, serif", color: '#64748b' }}>${parseFloat(item.price).toFixed(2)}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #1e293b', width: 'fit-content', overflow: 'hidden' }}>
                          {[{ label: '-', action: () => updateQuantity(index, (item.quantity || 1) - 1) }, { label: item.quantity || 1, isValue: true }, { label: '+', action: () => updateQuantity(index, (item.quantity || 1) + 1) }].map((btn, i) =>
                            btn.isValue
                              ? <span key={i} style={{ padding: '6px 12px', backgroundColor: '#0d1b2a', color: '#e2e8f0', borderLeft: '1px solid #1e293b', borderRight: '1px solid #1e293b', fontFamily: "'Times New Roman', Times, serif" }}>{btn.label}</span>
                              : <button key={i} onClick={btn.action} style={{ padding: '6px 10px', backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif" }}>{btn.label}</button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontFamily: "'Times New Roman', Times, serif", fontWeight: '700', color: '#ffffff' }}>${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div style={{ padding: '24px', border: '1px solid #1e293b', backgroundColor: '#111827' }}>
                <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '24px', fontWeight: '800', color: '#ffffff', marginBottom: '24px' }}>Cart totals</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1e293b', marginBottom: '12px' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#64748b' }}>Subtotal</span>
                  <span style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: '700', color: '#e2e8f0' }}>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1e293b', marginBottom: '24px' }}>
                  <span style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: '600', color: '#e2e8f0' }}>Total</span>
                  <span style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>${subtotal.toFixed(2)}</span>
                </div>
                <button style={{ width: '100%', padding: '14px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0d1b2a', backgroundColor: '#0bbfaa', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#09a896'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0bbfaa'}>Proceed to Checkout</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
