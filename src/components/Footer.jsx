import React from 'react';

export default function Footer({ setView, listings = [] }) {
  return (
    <footer style={{
      backgroundColor: '#000000',
      color: '#e2e8f0',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '56px 24px 0' }}>

        {/* ── Centered Logo (matching Header) ── */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#f5c518',
              border: '2px solid #f5c518',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 0 2px rgba(245,197,24,0.25)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-5-5-11-5-11z" fill="#000000" opacity="0.85"/>
                <path d="M12 10c0 0-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-2-4-2-4z" fill="#f5c518"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{
                fontSize: '22px',
                fontWeight: '800',
                color: '#ffffff',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                letterSpacing: '0.02em',
              }}>
                NEXT
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: '#ffffff',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}>
                Ownerstore
              </span>
            </div>
          </div>
        </div>

        {/* ── Horizontal Nav Links ── */}
        <nav style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px 32px',
          marginBottom: '36px',
        }}>
          {[
            { label: 'FAQs',               view: 'faq'      },
            { label: 'Blog',               view: 'blog'     },
            { label: 'Book an Agent',      view: 'bookAgent'},
            { label: 'Privacy Policy',     view: 'privacy'  },
            { label: 'Terms & Conditions', view: 'terms'    },
          ].map(({ label, view }) => (
            <button
              key={label}
              onClick={() => setView(view)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '15px',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.02em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#f5c518'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ── Social Icons ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '28px',
          marginBottom: '48px',
        }}>
          <a href="#" aria-label="Facebook" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5c518'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
            </svg>
          </a>
          <a href="#" aria-label="Instagram" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5c518'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
          <a href="#" aria-label="Twitter" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5c518'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2.174 2.25h6.967l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="#" aria-label="YouTube" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5c518'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
              <polygon fill="#000000" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
            </svg>
          </a>
          <a href="#" aria-label="TikTok" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5c518'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.53V6.75a4.85 4.85 0 01-1.01-.06z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* ── Bottom copyright bar ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '13px',
          color: 'rgba(255,255,255,0.35)',
          margin: 0,
          letterSpacing: '0.03em',
        }}>
          Copyright © 2025 Next Owners Store Ltd. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}