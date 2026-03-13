import React, { useState, useEffect } from 'react';

// ─── Cookie Utility ───────────────────────────────────────────────────────────
const COOKIE_KEY = 'nos_cookie_consent';
const COOKIE_PREFS_KEY = 'nos_cookie_prefs';

function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1])); } catch { return null; }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [prefs, setPrefs] = useState({
    essential: true,   // always on
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    const consent = getCookie(COOKIE_KEY);
    if (!consent) {
      // Slight delay so page loads first
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (savedPrefs) => {
    setAnimateOut(true);
    setTimeout(() => setVisible(false), 480);
    setCookie(COOKIE_KEY, { accepted: true, timestamp: Date.now() });
    setCookie(COOKIE_PREFS_KEY, savedPrefs || prefs);
  };

  const acceptAll = () => {
    const all = { essential: true, analytics: true, marketing: true, functional: true };
    setPrefs(all);
    dismiss(all);
  };

  const rejectAll = () => {
    const none = { essential: true, analytics: false, marketing: false, functional: false };
    setPrefs(none);
    dismiss(none);
  };

  const saveCustom = () => dismiss(prefs);

  if (!visible) return null;

  const togglePref = (key) => {
    if (key === 'essential') return;
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  const categories = [
    {
      key: 'essential',
      label: 'Essential',
      desc: 'Required for the site to function. Cannot be disabled.',
      locked: true,
    },
    {
      key: 'analytics',
      label: 'Analytics',
      desc: 'Help us understand how visitors interact with our marketplace.',
      locked: false,
    },
    {
      key: 'functional',
      label: 'Functional',
      desc: 'Enable enhanced features like saved searches and preferences.',
      locked: false,
    },
    {
      key: 'marketing',
      label: 'Marketing',
      desc: 'Used to deliver relevant ads and track campaign performance.',
      locked: false,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(0);   }
          to   { opacity: 0; transform: translateY(40px); }
        }
        @keyframes expandPanel {
          from { opacity: 0; max-height: 0;   }
          to   { opacity: 1; max-height: 600px; }
        }
        .nos-cookie-wrap {
          animation: slideUp 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .nos-cookie-wrap.out {
          animation: slideDown 0.44s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }
        .nos-details-panel {
          overflow: hidden;
          animation: expandPanel 0.38s ease forwards;
        }
        .nos-toggle {
          position: relative;
          width: 40px;
          height: 22px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: background-color 0.25s;
          flex-shrink: 0;
        }
        .nos-toggle::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .nos-toggle.on  { background-color: #0bbfaa; }
        .nos-toggle.off { background-color: #334155; }
        .nos-toggle.on::after  { transform: translateX(18px); }
        .nos-toggle.off::after { transform: translateX(0);    }
        .nos-toggle.locked { background-color: #1e293b; cursor: not-allowed; }
        .nos-toggle.locked::after { transform: translateX(18px); background: #64748b; }
        .nos-btn {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          padding: 11px 24px;
          transition: background-color 0.2s, color 0.2s;
          white-space: nowrap;
        }
        .nos-btn-primary {
          background-color: #0bbfaa;
          color: #0d1b2a;
        }
        .nos-btn-primary:hover { background-color: #09a896; }
        .nos-btn-ghost {
          background-color: transparent;
          color: #94a3b8;
          border: 1px solid #1e293b;
        }
        .nos-btn-ghost:hover { border-color: #64748b; color: #e2e8f0; }
        .nos-btn-outline {
          background-color: transparent;
          color: #0bbfaa;
          border: 1px solid #0bbfaa;
        }
        .nos-btn-outline:hover { background-color: #0bbfaa22; }
        @media (max-width: 639px) {
          .nos-btn-row { flex-direction: column !important; }
          .nos-btn-row .nos-btn { width: 100%; text-align: center; }
          .nos-cookie-inner { padding: 24px 20px !important; }
        }
      `}</style>

      {/* Banner */}
      <div
        className={`nos-cookie-wrap${animateOut ? ' out' : ''}`}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: '680px',
          zIndex: 9999,
        }}
      >
        <div
          className="nos-cookie-inner"
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '28px 32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {/* Cookie icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0bbfaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
                  <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01"/>
                </svg>
                <span style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '16px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' }}>
                  We value your privacy
                </span>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px', color: '#94a3b8', lineHeight: 1.65, fontStyle: 'italic' }}>
                Next Owners Store uses cookies to improve your browsing experience, personalise content, and analyse traffic. You control how your data is used.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '16px 0' }} />

          {/* Expandable details */}
          {showDetails && (
            <div className="nos-details-panel" style={{ marginBottom: '20px' }}>
              {categories.map((cat) => (
                <div key={cat.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '12px', padding: '12px 0',
                  borderBottom: '1px solid #1e293b',
                }}>
                  <div>
                    <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '3px' }}>{cat.label}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{cat.desc}</p>
                  </div>
                  <button
                    className={`nos-toggle ${cat.locked ? 'locked' : prefs[cat.key] ? 'on' : 'off'}`}
                    onClick={() => togglePref(cat.key)}
                    aria-label={`Toggle ${cat.label} cookies`}
                    title={cat.locked ? 'Always enabled' : undefined}
                  />
                </div>
              ))}
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '11px', color: '#475569', marginTop: '14px', lineHeight: 1.6 }}>
                For more information, see our{' '}
                <a href="/privacy-policy" style={{ color: '#0bbfaa', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Privacy Policy</a>
                {' '}and{' '}
                <a href="/cookie-policy" style={{ color: '#0bbfaa', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Cookie Policy</a>.
              </p>
            </div>
          )}

          {/* Button row */}
          <div className="nos-btn-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button className="nos-btn nos-btn-primary" onClick={acceptAll}>Accept All</button>
            <button className="nos-btn nos-btn-ghost" onClick={rejectAll}>Reject All</button>

            {showDetails ? (
              <button className="nos-btn nos-btn-outline" onClick={saveCustom}>Save Preferences</button>
            ) : (
              <button
                className="nos-btn nos-btn-ghost"
                onClick={() => setShowDetails(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Customise
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Hook to read saved preferences anywhere in the app ───────────────────────
export function useCookiePrefs() {
  const raw = getCookie(COOKIE_PREFS_KEY);
  return raw || { essential: true, analytics: false, marketing: false, functional: false };
}