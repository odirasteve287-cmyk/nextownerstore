import React, { useState } from 'react';

const SECTIONS = [
  {
    id: 'acceptance',
    q: 'Acceptance of Terms',
    content: (
      <div>
        <p>By accessing or using Next Owner Store ("the Platform"), you agree to be bound by these Terms and Conditions.</p>
        <br/>
        <p>If you do not agree to these terms, you may not use the Platform. We reserve the right to modify these terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised terms.</p>
        <br/>
        <p>These terms apply to all visitors, users, buyers, and sellers on the Platform.</p>
      </div>
    ),
  },
  {
    id: 'eligibility',
    q: 'Eligibility',
    content: (
      <div>
        <p>To use Next Owner Store you must:</p>
        <p>- Be at least 18 years of age.</p>
        <p>- Be a legal resident of the country in which you are transacting.</p>
        <p>- Have the legal capacity to enter into a binding contract.</p>
        <p>- Not have been previously suspended or removed from the Platform.</p>
        <br/>
        <p>By registering, you represent and warrant that you meet all eligibility requirements.</p>
      </div>
    ),
  },
  {
    id: 'accounts',
    q: 'User Accounts',
    content: (
      <div>
        <p>When you create an account, you agree to:</p>
        <p>- Provide accurate, current, and complete information.</p>
        <p>- Maintain and promptly update your account information.</p>
        <p>- Keep your password confidential and not share it with anyone.</p>
        <p>- Notify us immediately of any unauthorised use of your account.</p>
        <br/>
        <p>You are solely responsible for all activity that occurs under your account. Next Owner Store is not liable for any loss or damage arising from your failure to maintain account security.</p>
      </div>
    ),
  },
  {
    id: 'listings',
    q: 'Listings and Prohibited Items',
    content: (
      <div>
        <p>Sellers must ensure all listings are accurate, honest, and comply with applicable laws. You may not list:</p>
        <p>- Stolen, counterfeit, or infringing goods.</p>
        <p>- Weapons, firearms, or ammunition.</p>
        <p>- Illegal drugs or controlled substances.</p>
        <p>- Adult or explicit content.</p>
        <p>- Items that violate any local, national, or international law.</p>
        <br/>
        <p>Next Owner Store reserves the right to remove any listing at its sole discretion and to suspend or permanently ban accounts that violate these rules.</p>
      </div>
    ),
  },
  {
    id: 'transactions',
    q: 'Transactions Between Users',
    content: (
      <div>
        <p>Next Owner Store acts as a marketplace connecting buyers and sellers. We are not a party to any transaction between users.</p>
        <br/>
        <p>By transacting on the Platform, you acknowledge that:</p>
        <p>- Contracts for sale are formed directly between buyer and seller.</p>
        <p>- Next Owner Store does not guarantee the quality, safety, or legality of items listed.</p>
        <p>- All sales are final unless otherwise agreed between buyer and seller.</p>
        <p>- Disputes are the responsibility of the parties involved, though we may assist in mediation at our discretion.</p>
      </div>
    ),
  },
  {
    id: 'fees',
    q: 'Fees and Payments',
    content: (
      <div>
        <p>Listing items on Next Owner Store is free of charge. We may charge:</p>
        <p>- A small transaction fee on sales processed through our secure payment gateway (optional).</p>
        <p>- Fees for premium listing features, where applicable.</p>
        <br/>
        <p>All fees are shown clearly before you commit to any paid feature. Fees are non-refundable except where required by law.</p>
        <br/>
        <p>We reserve the right to change our fee structure with 30 days' notice communicated via the Platform or email.</p>
      </div>
    ),
  },
  {
    id: 'conduct',
    q: 'User Conduct',
    content: (
      <div>
        <p>You agree not to use the Platform to:</p>
        <p>- Harass, abuse, threaten, or intimidate other users.</p>
        <p>- Post false, misleading, or defamatory content.</p>
        <p>- Spam other users with unsolicited messages.</p>
        <p>- Attempt to gain unauthorised access to other accounts or our systems.</p>
        <p>- Scrape, crawl, or extract data from the Platform without our written consent.</p>
        <p>- Circumvent any security measures or attempt to interfere with Platform operations.</p>
        <br/>
        <p>Violations may result in immediate account suspension or termination.</p>
      </div>
    ),
  },
  {
    id: 'ip',
    q: 'Intellectual Property',
    content: (
      <div>
        <p>All content on the Platform created by Next Owner Store — including logos, design, text, graphics, and software — is the exclusive property of Next Owner Store Ltd and protected by applicable intellectual property laws.</p>
        <br/>
        <p>By posting content (photos, descriptions, etc.) on the Platform, you grant Next Owner Store a non-exclusive, worldwide, royalty-free licence to use, display, and promote that content solely for operating and marketing the Platform.</p>
        <br/>
        <p>You retain ownership of the content you post. You may remove your listings at any time, which will revoke this licence for that content going forward.</p>
      </div>
    ),
  },
  {
    id: 'liability',
    q: 'Limitation of Liability',
    content: (
      <div>
        <p>To the maximum extent permitted by law, Next Owner Store Ltd shall not be liable for:</p>
        <p>- Any indirect, incidental, special, or consequential damages.</p>
        <p>- Loss of profits, data, goodwill, or other intangible losses.</p>
        <p>- Damages resulting from transactions between users.</p>
        <p>- Unauthorised access to or alteration of your account or data.</p>
        <br/>
        <p>Our total liability to you for any claim shall not exceed the amount you paid to us in the 12 months preceding the claim, or £100 — whichever is greater.</p>
      </div>
    ),
  },
  {
    id: 'termination',
    q: 'Termination',
    content: (
      <div>
        <p>You may close your account at any time by contacting support@nextownerstore.com.</p>
        <br/>
        <p>We may suspend or terminate your account immediately, without notice, if we determine you have violated these Terms and Conditions or acted in a way that harms other users or the Platform.</p>
        <br/>
        <p>Upon termination, your right to use the Platform ceases immediately. Sections of these terms that by their nature should survive termination (including intellectual property, liability limitations, and dispute resolution) will remain in effect.</p>
      </div>
    ),
  },
  {
    id: 'governing',
    q: 'Governing Law and Disputes',
    content: (
      <div>
        <p>These Terms and Conditions are governed by and construed in accordance with the laws of England and Wales.</p>
        <br/>
        <p>Any dispute arising out of or in connection with these terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the exclusive jurisdiction of the courts of England and Wales.</p>
      </div>
    ),
  },
];

export default function TermsAndConditions({ setView }) {
  const [openSection, setOpenSection] = useState(null);
  const toggle = (id) => setOpenSection(openSection === id ? null : id);

  return (
    <div style={{ backgroundColor: '#0d1b2a', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Hero Section ── */}
      <div style={{
        backgroundColor: '#0bbfaa',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 1200 280" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <polygon points="800,0 1050,0 750,280 500,280" fill="rgba(255,255,255,0.08)" />
          <polygon points="950,0 1200,0 1200,180 900,280" fill="rgba(255,255,255,0.06)" />
          <polygon points="600,0 820,0 560,280 340,280" fill="rgba(0,0,0,0.06)" />
          <polygon points="1000,0 1200,0 1200,280 1100,280" fill="rgba(255,255,255,0.05)" />
          <polygon points="700,0 900,0 650,280 450,280" fill="rgba(255,255,255,0.04)" />
        </svg>

        <div style={{ flex: 1 }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 0.75rem', width: '100%', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: '#0d1b2a', marginBottom: 0, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#f5c518' }}>Terms</span> &amp; Conditions
          </h1>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#0d1b2a', padding: '0.6rem 1.5rem', borderRadius: '6px 6px 0 0', fontSize: '0.875rem',
          }}>
            <button onClick={() => setView && setView('home')} style={{ color: '#14b8a6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '500' }}>
              Home
            </button>
            <span style={{ color: '#64748b' }}>›</span>
            <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Terms &amp; Conditions</span>
          </div>
        </div>
      </div>

      {/* ── Content Section ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 4rem' }}>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Last updated: January 2025. Please read these Terms and Conditions carefully before using Next Owner Store.
        </p>

        <h2 style={{ color: '#14b8a6', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: '800', marginBottom: '2rem', lineHeight: 1.2 }}>
          Terms Governing Use of the Platform
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {SECTIONS.map(({ id, q, content }) => (
            <div key={id} style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <button
                onClick={() => toggle(id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
              >
                <span style={{ color: '#14b8a6', fontWeight: '700', fontSize: '1.5rem', lineHeight: 1.4 }}>{q}</span>
                {openSection === id ? (
                  <span style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f5c518', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" fill="none" stroke="#0d1b2a" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </span>
                ) : (
                  <span style={{ color: '#f5c518', fontSize: '1.5rem', flexShrink: 0 }}>←</span>
                )}
              </button>
              {openSection === id && (
                <div style={{ padding: '0.5rem 1.5rem 1.5rem', borderTop: '1px solid #1e293b' }}>
                  <div style={{ color: '#e2e8f0', fontSize: '1rem', lineHeight: 1.85, marginTop: '1rem' }}>{content}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}