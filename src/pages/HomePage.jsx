import React, { useState, useEffect, useRef } from 'react';

function ProductCard({ product, onClick }) {
  const isSold = product.status === 'sold';
  const isNew = product.condition === 'New' || product.condition_status === 'New';
  const badgeText = isSold ? 'Sold' : isNew ? 'New' : 'Used';
  const badgeBg = isSold ? '#dc2626' : '#0bbfaa';
  const price = parseFloat(product.price || 0);
  const formattedPrice = '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div
      onClick={() => onClick(product)}
      style={{ backgroundColor: '#111827', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1e293b' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ backgroundColor: '#1e293b', position: 'relative', height: '200px', overflow: 'hidden' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3rem' }}>🏺</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
          <span style={{ backgroundColor: badgeBg, color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '4px' }}>{badgeText}</span>
        </div>
      </div>
      <div style={{ padding: '14px 16px 18px' }}>
        <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '15px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.title}
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>{product.location || 'N/A'}</p>
        <div style={{ marginBottom: '10px' }}>
          <span style={{ fontFamily: "'Times New Roman', Times, serif", fontStyle: 'italic', fontWeight: '800', fontSize: '1.5rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
            {formattedPrice}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {product.views || 0} Views
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ products, addToCart, setView, user, isAdmin, onHeroVisibilityChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialFading, setTestimonialFading] = useState(false);
  const heroRef = useRef(null);

  const testimonials = [
    { quote: "Finding quality pre-owned items has never been easier. Next Owners Store connected me with exactly what I was looking for — a beautiful piece with a story worth keeping.", name: "Sarah M.", role: "Happy Buyer" },
    { quote: "I sold my vintage dining set within two days of listing it. The process was seamless and the platform truly values every item listed. Highly recommend!", name: "James K.", role: "Verified Seller" },
    { quote: "As someone who cares deeply about sustainability, Next Owners Store is exactly the kind of marketplace I want to support. Every purchase feels meaningful.", name: "Amina O.", role: "Returning Customer" },
  ];

  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current && onHeroVisibilityChange) {
        onHeroVisibilityChange(window.scrollY > heroRef.current.offsetHeight - 80);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onHeroVisibilityChange]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialFading(true);
      setTimeout(() => {
        setTestimonialIndex(i => (i + 1) % testimonials.length);
        setTestimonialFading(false);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToTestimonial = (i) => {
    setTestimonialFading(true);
    setTimeout(() => {
      setTestimonialIndex(i);
      setTestimonialFading(false);
    }, 400);
  };

  // Clicking a New Arrivals item: scroll to top first, then navigate with product ID
  const handleProductClick = (product) => {
    sessionStorage.setItem('selectedProductId', product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setView('listings'), 300);
  };

  // Hero search: store query so Listings can pick it up
  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    sessionStorage.setItem('searchQuery', searchQuery.trim());
    setView('listings');
  };

  const categoryIcons = [
    { label: 'Furniture', icon: <><rect x="8" y="40" width="64" height="12" rx="2"/><rect x="16" y="28" width="48" height="12" rx="2"/><line x1="20" y1="52" x2="20" y2="68"/><line x1="60" y1="52" x2="60" y2="68"/></> },
    { label: 'Decor', icon: <><path d="M24 56c0-8.837 7.163-16 16-16s16 7.163 16 16"/><path d="M40 40V28"/><path d="M28 44l-6-6M52 44l6-6"/><circle cx="40" cy="24" r="4"/><line x1="16" y1="56" x2="64" y2="56"/></> },
    { label: 'Appliances', icon: <><rect x="12" y="16" width="24" height="32" rx="2"/><rect x="44" y="16" width="24" height="32" rx="2"/><rect x="12" y="52" width="56" height="16" rx="2"/><circle cx="24" cy="32" r="6"/></> },
    { label: 'Electronics', icon: <><rect x="12" y="20" width="56" height="36" rx="4"/><line x1="28" y1="64" x2="52" y2="64"/><line x1="40" y1="56" x2="40" y2="64"/><circle cx="40" cy="38" r="10"/></> },
    { label: 'Kitchenware', icon: <><path d="M20 16v20a12 12 0 0024 0V16"/><line x1="32" y1="16" x2="32" y2="36"/><path d="M56 16c0 0 8 8 8 16s-8 16-8 16"/><line x1="56" y1="48" x2="56" y2="68"/></> },
    { label: 'For Kids', icon: <><circle cx="28" cy="56" r="8"/><circle cx="60" cy="56" r="8"/><path d="M36 56h16M12 56H4l8-32h40l8 32h-8"/><path d="M40 24v-8M32 20l8-8 8 8"/></> },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1b2a', position: 'relative' }}>
      <style>{`
        @keyframes testimonialFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .testimonial-content { animation: testimonialFadeIn 0.4s ease forwards; }
        .testimonial-content.fading { opacity: 0; transform: translateY(-10px); transition: opacity 0.4s, transform 0.4s; }
        .search-btn-text { display: inline; }
        @media (max-width: 639px) {
          .search-btn-text { display: none; }
          .search-btn { padding: 0 16px !important; min-width: 48px; }
        }
      `}</style>

      {/* ── Hero Section ── */}
      <section ref={heroRef} style={{ position: 'relative', backgroundColor: '#000000', overflow: 'hidden', paddingTop: '80px', paddingBottom: '64px' }}>
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '900px', margin: '0 auto', padding: '60px 24px 48px' }}>
          <h1 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 'clamp(2rem, 4.5vw, 3.8rem)', fontWeight: '800', color: '#0bbfaa', lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Your Trusted Marketplace
          </h1>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', color: '#94a3b8', lineHeight: 1.7, marginBottom: '36px', fontStyle: 'italic' }}>
            Because every item carries a precious story
          </p>

          {/* Search Bar */}
          <div style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '8px', maxWidth: '600px', margin: '0 auto 56px', display: 'flex', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', border: '1px solid #1e293b' }}>
            <input
              type="text"
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 20px', fontSize: '16px', fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#e2e8f0', backgroundColor: 'transparent', minWidth: 0 }}
            />
            <button
              onClick={handleSearch}
              className="search-btn"
              style={{ backgroundColor: '#0bbfaa', color: '#0d1b2a', border: 'none', borderRadius: '6px', padding: '14px 32px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif", display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', transition: 'background-color 0.2s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#09a896'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0bbfaa'}>
              <span className="search-btn-text">Search</span>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Category Icons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '480px', margin: '0 auto' }} className="category-grid">
            <style>{`@media (min-width: 640px) { .category-grid { display: flex !important; flex-wrap: nowrap !important; justify-content: center !important; max-width: 100% !important; } }`}</style>
            {categoryIcons.map(({ label, icon }) => (
              <button key={label} onClick={() => setView('listings')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 12px', backgroundColor: '#111827', border: '1.5px solid #1e293b', borderRadius: '10px', cursor: 'pointer', width: '100%', transition: 'background-color 0.2s, border-color 0.2s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1e293b'; e.currentTarget.style.borderColor = '#ffffff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#111827'; e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <svg viewBox="0 0 80 80" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '36px', height: '36px' }}>
                  {icon}
                </svg>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals Section ── */}
      <section style={{ backgroundColor: '#000000', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '16px' }}>New Arrivals</h2>
            <button onClick={() => setView('listings')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '12px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0bbfaa', textDecoration: 'underline', textUnderlineOffset: '4px', padding: 0 }}>
              - View All
            </button>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <h3 style={{ fontSize: '1.6rem', marginBottom: '12px', color: '#e2e8f0', fontFamily: "'Times New Roman', serif" }}>No Items Available</h3>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Be the first to add a listing!</p>
              <button onClick={() => setView('listings')} style={{ padding: '12px 32px', backgroundColor: '#0bbfaa', color: '#0d1b2a', border: 'none', borderRadius: '2px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '11px' }}>Browse Marketplace</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="new-arrivals-grid">
              <style>{`@media (min-width: 768px) { .new-arrivals-grid { grid-template-columns: repeat(3, 1fr) !important; } }`}</style>
              {products.slice(0, Math.max(12, products.length)).map((product) => {
                const price = parseFloat(product.price || 0);
                const formattedPrice = '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return (
                  <div key={product.id} onClick={() => handleProductClick(product)} style={{ cursor: 'pointer', backgroundColor: '#000000', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <div style={{ backgroundColor: '#111827', aspectRatio: '1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1e293b' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                      ) : (
                        <span style={{ fontSize: '3rem', opacity: 0.3 }}>🏺</span>
                      )}
                    </div>
                    <div style={{ padding: '14px 4px 8px' }}>
                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748b', marginBottom: '5px' }}>{product.category || 'General'}</p>
                      {/* CHANGED: color updated from #e2e8f0 to #0bbfaa (green) */}
                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '17px', fontWeight: '500', color: '#0bbfaa', marginBottom: '8px', lineHeight: 1.35 }}>{product.title}</p>
                      <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>{formattedPrice}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── About / Split Section ── */}
      <style>{`
        .about-section { position: relative; min-height: 580px; background-color: #000000; overflow: hidden; }
        .about-img { position: absolute; top: 0; right: 0; width: 50%; height: 100%; background-image: url('/queens bed.jpeg'); background-size: cover; background-position: center; z-index: 1; }
        .about-card { position: absolute; top: 50%; transform: translateY(-50%); left: calc(5% - 10px); width: calc(49% + 20px); z-index: 2; background-color: #111827; border: 1px solid #1e293b; padding: clamp(32px, 4vw, 56px) clamp(28px, 3.5vw, 52px); text-align: center; }
        @media (max-width: 767px) {
          .about-section { min-height: 480px; }
          .about-img { width: 50%; height: 70%; top: 0; right: 0; }
          .about-card { top: auto; transform: none; bottom: 5%; left: 4%; width: 80%; padding: 28px 24px; }
        }
      `}</style>
      <section className="about-section">
        <div className="about-img" />
        <div className="about-card">
          <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: '600', color: '#ffffff', lineHeight: 1.2, marginBottom: '24px', letterSpacing: '-0.01em' }}>
            We connect pre-loved items with new owners
          </h2>
          <div style={{ width: '40px', height: '1px', backgroundColor: '#0bbfaa', margin: '0 auto 24px' }} />
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', fontStyle: 'italic', color: '#94a3b8', lineHeight: 1.7, marginBottom: '36px' }}>
            Every item carries a precious story — find something that speaks to you
          </p>
          <button onClick={() => setView('listings')}
            style={{ backgroundColor: '#0bbfaa', color: '#0d1b2a', border: 'none', borderRadius: '2px', padding: '13px 32px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif", transition: 'background-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#09a896'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0bbfaa'}>
            - Explore Now
          </button>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ position: 'relative', backgroundColor: '#000000', padding: '100px 24px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', fontSize: '28rem', lineHeight: 1, color: '#0d1b2a', fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: '700', userSelect: 'none', pointerEvents: 'none', zIndex: 0 }}>"</div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '11px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0bbfaa', border: '1px solid #0bbfaa', borderRadius: '999px', padding: '8px 24px' }}>
              Testimonials
            </span>
          </div>
          <div className={`testimonial-content${testimonialFading ? ' fading' : ''}`} style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontStyle: 'italic', fontWeight: '400', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '28px' }}>
              {testimonials[testimonialIndex].quote}
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#64748b', marginBottom: '24px' }}>
              — {testimonials[testimonialIndex].name}, {testimonials[testimonialIndex].role}
            </p>
            <div style={{ width: '40px', height: '1px', backgroundColor: '#0bbfaa', margin: '0 auto 32px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => goToTestimonial(i)}
                style={{ width: i === testimonialIndex ? '28px' : '10px', height: '10px', borderRadius: '999px', backgroundColor: i === testimonialIndex ? '#0bbfaa' : '#1e293b', border: i === testimonialIndex ? 'none' : '1px solid #334155', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products Section ── */}
      <section style={{ backgroundColor: '#000000', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '16px' }}>Featured Products</h2>
            <button onClick={() => setView('listings')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '12px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0bbfaa', textDecoration: 'underline', textUnderlineOffset: '4px', padding: 0 }}>
              - View All
            </button>
          </div>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No featured products available</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }} className="featured-products-grid">
              <style>{`@media (min-width: 768px) { .featured-products-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
              {[...products]
                .sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0))
                .slice(0, 2)
                .map((product) => {
                  const price = parseFloat(product.price || 0);
                  const formattedPrice = '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return (
                    <div key={product.id} onClick={() => handleProductClick(product)}
                      style={{ cursor: 'pointer', backgroundColor: '#000000', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div style={{ backgroundColor: '#0d1b2a', aspectRatio: '1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '5rem', opacity: 0.2 }}>🏺</span>
                        )}
                      </div>
                      <div style={{ padding: '28px 24px', backgroundColor: '#000000' }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' }}>{product.category || 'General'}</p>
                        <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '22px', fontWeight: '500', color: '#e2e8f0', marginBottom: '12px', lineHeight: 1.4 }}>{product.title}</h3>
                        <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>{formattedPrice}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>

      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ position: 'fixed', bottom: '32px', right: '32px', width: '48px', height: '48px', backgroundColor: '#0bbfaa', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 50, transition: 'background-color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#09a896'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0bbfaa'}
        aria-label="Scroll to top">
        <svg width="20" height="20" fill="none" stroke="#0d1b2a" viewBox="0 0 24 24" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}