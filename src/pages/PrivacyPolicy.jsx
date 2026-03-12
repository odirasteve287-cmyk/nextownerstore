import React, { useState } from 'react';

const SECTIONS = [
  {
    id: 'collection',
    q: 'What information do we collect?',
    content: (
      <div>
        <p>We collect information you provide directly to us, including:</p>
        <p>- Name, email address, and password when you create an account.</p>
        <p>- Profile information such as phone number and location.</p>
        <p>- Listing details including item descriptions, photos, and pricing.</p>
        <p>- Communications between you and other users on our platform.</p>
        <p>- Payment information (processed securely — we do not store full card details).</p>
        <br/>
        <p>We also automatically collect certain information when you use Next Owner Store:</p>
        <p>- Device information (browser type, operating system, IP address).</p>
        <p>- Usage data (pages visited, time spent, links clicked).</p>
        <p>- Cookies and similar tracking technologies.</p>
      </div>
    ),
  },
  {
    id: 'use',
    q: 'How do we use your information?',
    content: (
      <div>
        <p>We use the information we collect to:</p>
        <p>- Create and manage your account.</p>
        <p>- Facilitate transactions between buyers and sellers.</p>
        <p>- Send transactional emails (listing approvals, purchase confirmations, etc.).</p>
        <p>- Respond to your enquiries and provide customer support.</p>
        <p>- Improve the platform's functionality and user experience.</p>
        <p>- Detect and prevent fraud, abuse, or other harmful activity.</p>
        <br/>
        <p>We will never sell your personal information to third parties.</p>
      </div>
    ),
  },
  {
    id: 'sharing',
    q: 'Do we share your information?',
    content: (
      <div>
        <p>We only share your information in the following circumstances:</p>
        <p>- With other users, to the extent necessary to complete a transaction (e.g. your first name and general location may be visible to buyers).</p>
        <p>- With trusted service providers who help us operate our platform (e.g. payment processors, hosting providers) — bound by confidentiality agreements.</p>
        <p>- When required by law, court order, or government authority.</p>
        <p>- To protect the rights, safety, or property of Next Owner Store, its users, or the public.</p>
        <br/>
        <p>We do not share your data with advertisers.</p>
      </div>
    ),
  },
  {
    id: 'cookies',
    q: 'Cookies and tracking technologies',
    content: (
      <div>
        <p>We use cookies and similar technologies to:</p>
        <p>- Keep you logged in between sessions.</p>
        <p>- Remember your preferences.</p>
        <p>- Analyse how the platform is used so we can improve it.</p>
        <br/>
        <p>You can control cookies through your browser settings. Disabling cookies may limit certain features of the platform.</p>
      </div>
    ),
  },
  {
    id: 'retention',
    q: 'How long do we keep your data?',
    content: (
      <div>
        <p>We retain your personal data for as long as your account is active or as needed to provide services.</p>
        <br/>
        <p>If you close your account, we will delete or anonymise your personal data within 90 days, except where we are required by law to retain it longer (e.g. transaction records for tax purposes).</p>
        <br/>
        <p>Inactive accounts may be deleted after 24 months of inactivity, with prior notice by email.</p>
      </div>
    ),
  },
  {
    id: 'rights',
    q: 'Your rights and choices',
    content: (
      <div>
        <p>You have the right to:</p>
        <p>- Access the personal data we hold about you.</p>
        <p>- Correct inaccurate or incomplete information.</p>
        <p>- Request deletion of your account and associated data.</p>
        <p>- Opt out of marketing communications at any time.</p>
        <p>- Lodge a complaint with a data protection authority if you believe your rights have been violated.</p>
        <br/>
        <p>To exercise any of these rights, contact us at privacy@nextownerstore.com.</p>
      </div>
    ),
  },
  {
    id: 'security',
    q: 'How do we protect your data?',
    content: (
      <div>
        <p>We implement industry-standard security measures including:</p>
        <p>- SSL/TLS encryption for all data transmitted between your browser and our servers.</p>
        <p>- Secure, hashed password storage.</p>
        <p>- Regular security audits and vulnerability assessments.</p>
        <p>- Restricted internal access to personal data on a need-to-know basis.</p>
        <br/>
        <p>While we take every reasonable precaution, no system is completely secure. We encourage you to use a strong, unique password and to keep your login credentials confidential.</p>
      </div>
    ),
  },
  {
    id: 'children',
    q: "Children's privacy",
    content: (
      <div>
        <p>Next Owner Store is not intended for use by anyone under the age of 18.</p>
        <br/>
        <p>We do not knowingly collect personal information from minors. If we become aware that a user is under 18, we will promptly close their account and delete all associated data.</p>
        <br/>
        <p>If you believe a minor has registered, please contact us immediately at support@nextownerstore.com.</p>
      </div>
    ),
  },
  {
    id: 'changes',
    q: 'Changes to this Privacy Policy',
    content: (
      <div>
        <p>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws.</p>
        <br/>
        <p>When we make significant changes, we will notify you by email or by placing a prominent notice on our website. The date of the most recent revision will always be shown at the top of this page.</p>
        <br/>
        <p>Continued use of the platform after any changes constitutes your acceptance of the updated policy.</p>
      </div>
    ),
  },
  {
    id: 'contact',
    q: 'How to contact us about privacy',
    content: (
      <div>
        <p>If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please reach out to us:</p>
        <p>- Email: privacy@nextownerstore.com</p>
        <p>- Support portal: available in your account dashboard.</p>
        <br/>
        <p>Our privacy team aims to respond to all enquiries within 5 business days.</p>
      </div>
    ),
  },
];

export default function PrivacyPolicy({ setView }) {
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
            <span style={{ color: '#f5c518' }}>Privacy</span> Policy
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
            <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* ── Content Section ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 4rem' }}>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Last updated: January 2025. This policy explains how Next Owner Store Ltd collects, uses, and protects your personal information.
        </p>

        <h2 style={{ color: '#14b8a6', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: '800', marginBottom: '2rem', lineHeight: 1.2 }}>
          Your Privacy Matters to Us
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