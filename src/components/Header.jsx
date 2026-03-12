import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

export default function Header({ user, view, setView, cartCount = 0, isAdmin }) {
  const darkViews     = ['home', 'listings', 'userDashboard', 'user-dashboard', 'sellerDashboard', 'seller-dashboard'];
  const greenViews    = ['sell', 'blog', 'bookAgent', 'authForm', 'signin', 'signup', 'privacy', 'terms'];
  const noScrollViews = ['home', 'listings'];
  const pageTheme     = darkViews.includes(view) ? 'dark' : greenViews.includes(view) ? 'green' : undefined;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountDropdownRef = useRef(null);

  const handleNavClick = (v) => {
    setView(v);
    setIsMobileMenuOpen(false);
    setIsAccountDropdownOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // ── Theme logic ──────────────────────────────────────────────────────────
  const isDark  = pageTheme === 'dark';
  const isGreen = pageTheme === 'green';
  const lockBg  = noScrollViews.includes(view);

  const baseBg   = isDark ? '#000000' : isGreen ? '#0bbfaa' : 'transparent';
  const scrollBg = lockBg
    ? baseBg
    : isDark  ? '#111111'
    : isGreen ? '#09a896'
    : '#ffffff';

  const textColor = (isDark || isGreen) ? '#ffffff' : '#2d2d2d';
  const iconColor = (isDark || isGreen) ? '#e2e8f0' : '#555555';
  const accent    = '#f5c518';

  const navLinkStyle = {
    color: textColor,
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '0',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    transition: 'color 0.15s',
  };

  const navLinks = [
    { label: 'Home',          v: 'home'       },
    { label: 'Shop',          v: 'listings'   },
    { label: 'Book An Agent', v: 'bookAgent'  },
    { label: 'Sell',          v: 'sell'       },
    { label: 'Blog',          v: 'blog'       },
  ];

  /* ── Logo ── */
  const LogoMark = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '50%',
        backgroundColor: '#f5c518', border: '2px solid #f5c518',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: '0 0 0 2px rgba(245,197,24,0.25)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-5-5-11-5-11z" fill="#000000" opacity="0.85"/>
          <path d="M12 10c0 0-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-2-4-2-4z" fill="#f5c518"/>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.02em' }}>
          NEXT
        </span>
        <span style={{ fontSize: '11px', fontWeight: '500', color: '#ffffff', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Ownerstore
        </span>
      </div>
    </div>
  );

  /* ── Post Item button ── */
  const postItemStyle = {
    backgroundColor: isGreen ? '#f5c518' : isDark ? 'transparent' : '#fff',
    color:           isGreen ? '#0d1b2a'  : isDark ? '#ffffff'      : '#2d2d2d',
    border:          isGreen ? '1.5px solid #f5c518' : isDark ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid #c8b8a8',
    borderRadius: '2px',
    padding: '9px 18px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    transition: 'background-color 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');

        @media (max-width: 768px) {
          .hidden-mobile  { display: none !important; }
          .show-mobile    { display: flex !important; }
          .header-nav     { display: none !important; }
          .account-name   { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }

        .nav-btn:hover  { color: ${accent} !important; }
        .icon-btn:hover { color: ${accent} !important; }
      `}</style>

      {/* ── Main Header ── */}
      <header style={{
        backgroundColor: scrolled ? scrollBg : baseBg,
        borderBottom: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        transition: lockBg ? 'none' : 'background-color 0.35s ease',
        boxShadow: (scrolled && !lockBg) ? '0 2px 16px rgba(0,0,0,0.12)' : 'none',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 32px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
        }}>

          {/* Left: Logo */}
          <button
            onClick={() => handleNavClick('home')}
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            <LogoMark />
          </button>

          {/* Center: Nav Links (desktop only) */}
          <nav className="header-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, justifyContent: 'center' }}>
            {navLinks.map(({ label, v }) => (
              <button key={v} onClick={() => handleNavClick(v)} style={navLinkStyle} className="nav-btn">
                {label}
              </button>
            ))}
            {isAdmin && (
              <button onClick={() => handleNavClick('admin-dashboard')} style={{ ...navLinkStyle, color: accent }} className="nav-btn">
                Admin
              </button>
            )}
          </nav>

          {/* Right: Account + Post Item + Mobile Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>

            {/* Account dropdown – icon visible on all screens, name hidden on mobile */}
            <div ref={accountDropdownRef} style={{ position: 'relative' }} >
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                aria-label="Account"
                className="icon-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: iconColor, display: 'flex', alignItems: 'center', gap: '7px', padding: '4px', transition: 'color 0.15s' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                {user && (
                  <span className="account-name" style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.05em', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                )}
              </button>

              {isAccountDropdownOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  backgroundColor: '#000000', border: '1px solid #222',
                  borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  minWidth: '180px', zIndex: 200, overflow: 'hidden', padding: '8px 0',
                }}>
                  {user ? (
                    <>
                      <div style={{ padding: '10px 16px 12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.03em' }}>
                          {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', fontFamily: "'Cormorant Garamond', Georgia, serif", marginTop: '2px', letterSpacing: '0.02em' }}>
                          {user.email}
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleNavClick('admin-dashboard')}
                          style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '12px', letterSpacing: '0.05em', fontWeight: '700', color: '#f5c518', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          Admin Dashboard
                        </button>
                      )}
                      <button onClick={() => handleNavClick('seller-dashboard')}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '12px', letterSpacing: '0.05em', color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        My Account
                      </button>
                      <button onClick={async () => { await supabase.auth.signOut(); handleNavClick('home'); }}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '12px', letterSpacing: '0.05em', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleNavClick('signin')}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '12px', letterSpacing: '0.05em', color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Log In
                      </button>
                      <button onClick={() => handleNavClick('signup')}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '12px', letterSpacing: '0.05em', color: '#f5c518', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Register
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Desktop: Post Item button */}
            <button
              onClick={() => handleNavClick('authForm')}
              className="hidden-mobile"
              style={postItemStyle}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isGreen ? '#e6b800' : isDark ? 'rgba(255,255,255,0.1)' : '#f7f2ee';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isGreen ? '#f5c518' : isDark ? 'transparent' : '#fff';
              }}
            >
              Post Item
            </button>

            {/* Mobile: Hamburger – rightmost element */}
            <div className="show-mobile" style={{ display: 'none', alignItems: 'center' }}>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: iconColor, padding: '4px' }}
                aria-label="Open menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6"  x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}
        />
      )}

      {/* Mobile Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isMobileMenuOpen ? 0 : '-100%',
        width: '280px',
        height: '100%',
        backgroundColor: '#000000',
        zIndex: 1200,
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.6)',
      }}>
        {/* Sidebar header: Post Item + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px' }}>
          <button
            onClick={() => handleNavClick('authForm')}
            style={{ flex: 1, padding: '11px 0', fontSize: '11px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#000000', backgroundColor: '#f5c518', border: 'none', borderRadius: '3px', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif", marginRight: '12px' }}
          >
            + Post Item
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '26px', lineHeight: 1, flexShrink: 0, padding: '0 2px' }}
          >
            ×
          </button>
        </div>

        {/* Nav links – no dividers */}
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
          {navLinks.map(({ label, v }) => (
            <button
              key={v}
              onClick={() => handleNavClick(v)}
              style={{ textAlign: 'left', padding: '13px 20px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif", transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f5c518'}
              onMouseLeave={e => e.currentTarget.style.color = '#ffffff'}
            >
              {label}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin-dashboard')}
              style={{ textAlign: 'left', padding: '13px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f5c518', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Admin
            </button>
          )}
        </nav>

        {/* Account section – no dividers */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
          {user ? (
            <>
              <div style={{ padding: '0 0 8px', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: '10px', color: '#555', fontFamily: "'Cormorant Garamond', Georgia, serif", marginTop: '2px' }}>
                  {user.email}
                </div>
              </div>
              <button
                onClick={() => handleNavClick('seller-dashboard')}
                style={{ padding: '11px 14px', fontSize: '12px', fontWeight: '600', color: '#ffffff', backgroundColor: '#111', borderRadius: '4px', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.03em' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#111'}
              >
                My Account
              </button>
              <button
                onClick={async () => { await supabase.auth.signOut(); handleNavClick('home'); }}
                style={{ padding: '11px 14px', fontSize: '12px', fontWeight: '600', color: '#ef4444', backgroundColor: 'transparent', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.03em' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavClick('signin')}
                style={{ padding: '11px 14px', fontSize: '12px', fontWeight: '600', color: '#ffffff', backgroundColor: '#111', borderRadius: '4px', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.03em' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#111'}
              >
                Log In
              </button>
              <button
                onClick={() => handleNavClick('signup')}
                style={{ padding: '11px 14px', fontSize: '12px', fontWeight: '600', color: '#f5c518', backgroundColor: 'transparent', borderRadius: '4px', border: '1px solid rgba(245,197,24,0.4)', cursor: 'pointer', textAlign: 'left', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.03em' }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}