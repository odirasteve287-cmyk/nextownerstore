import React, { useState } from 'react';

const FAQS = [
  {
    id: 'listing',
    q: 'How do I create a listing?',
    content: (
      <div>
        <p>Listing an item on Next Owner Store is easy. To do so, you will need to:</p>
        <p>- Create an account.</p>
        <p>- Take good pictures of the item you are selling.</p>
        <p>- Upload the pictures and a detailed description of the item on the listing form. You can access the listing form by clicking the "Post Item" button on the menu.</p>
        <p>- Submit the listing form.</p>
        <br/>
        <p>Next Owner Store will review your listing and approve it if it meets the platform's conditions. If your listing does not meet the conditions, it will be rejected.</p>
        <br/>
        <p>Here are some additional tips for listing items on Next Owner Store:</p>
        <p>- Use clear and descriptive titles.</p>
        <p>- Price your items competitively.</p>
        <p>- Include all relevant information in the description, such as the condition of the item, its dimensions, and any relevant features.</p>
        <p>- Take high-quality pictures that accurately represent the item.</p>
        <p>- Respond to inquiries promptly.</p>
        <br/>
        <p>By following these tips, you can increase your chances of selling your items on Next Owner Store.</p>
      </div>
    ),
  },
  {
    id: 'payment',
    q: 'What are the payment methods accepted?',
    content: (
      <div>
        <p>We support multiple payment methods for your convenience:</p>
        <p>- Cash for local pickups.</p>
        <p>- Bank transfers.</p>
        <p>- PayPal.</p>
        <p>- Secure online payments through our platform.</p>
        <br/>
        <p>Always use secure payment methods for remote transactions to protect yourself and the buyer.</p>
      </div>
    ),
  },
  {
    id: 'shipping',
    q: 'How do I ship my item?',
    content: (
      <div>
        <p>You have multiple options for shipping:</p>
        <p>- Arrange local pickup directly with the buyer.</p>
        <p>- Use our shipping partners for discounted rates.</p>
        <p>- Choose your own preferred shipping method.</p>
        <br/>
        <p>For larger items, we recommend local pickup or freight services. Always get tracking information and insurance for valuable items.</p>
      </div>
    ),
  },
  {
    id: 'tracking',
    q: 'How do I track the status of my sale?',
    content: (
      <div>
        <p>Track your sale status in your Seller Dashboard. You'll see when buyers:</p>
        <p>- View your item.</p>
        <p>- Send messages or make offers.</p>
        <p>- Complete purchases.</p>
        <br/>
        <p>You'll also receive email notifications for all important updates throughout the process.</p>
      </div>
    ),
  },
  {
    id: 'support',
    q: 'How do I contact customer support?',
    content: (
      <div>
        <p>Contact our support team through any of the following:</p>
        <p>- The "Contact Us" page on our website.</p>
        <p>- Email us at support@nextownerstore.com.</p>
        <p>- Use the chat feature in your seller dashboard.</p>
        <br/>
        <p>Our team is available Monday–Friday, 9am–6pm EST.</p>
      </div>
    ),
  },
  {
    id: 'terms',
    q: 'What are the terms of service for selling on this platform?',
    content: (
      <div>
        <p>Our terms require the following from all sellers:</p>
        <p>- Accurate item descriptions with no misleading information.</p>
        <p>- No prohibited or illegal items.</p>
        <p>- Prompt communication with buyers.</p>
        <p>- Compliance with local laws and regulations.</p>
        <br/>
        <p>Sellers must be 18+, own the items they're selling, and follow our community guidelines. Read the full terms in our Terms of Service section.</p>
      </div>
    ),
  },
  {
    id: 'timeline',
    q: 'How long does it take for an item to be sold?',
    content: (
      <div>
        <p>Sale timelines vary based on several factors:</p>
        <p>- Item type, condition, and demand.</p>
        <p>- How competitively you price the item.</p>
        <p>- Seasonality and your location.</p>
        <br/>
        <p>Popular items in good condition priced competitively can sell within 1–3 days. Niche items may take 1–2 weeks or longer.</p>
      </div>
    ),
  },
  {
    id: 'fees',
    q: 'Are there any selling fees or commissions?',
    content: (
      <div>
        <p>No, listing items is completely free and you keep 100% of your sale price.</p>
        <br/>
        <p>We only charge a small transaction fee for secure online payment processing, which is entirely optional if you choose to accept cash or bank transfer payments directly.</p>
      </div>
    ),
  },
  {
    id: 'meeting',
    q: 'Where should I meet buyers for transactions?',
    content: (
      <div>
        <p>We recommend meeting in safe, public locations such as:</p>
        <p>- Police station parking lots.</p>
        <p>- Bank lobbies.</p>
        <p>- Shopping mall food courts.</p>
        <p>- Well-lit coffee shops during daytime hours.</p>
        <br/>
        <p>Always bring a friend if meeting at your home, and trust your instincts — if something feels off, postpone or cancel the meeting.</p>
      </div>
    ),
  },
  {
    id: 'returns',
    q: 'What is your return policy for sellers?',
    content: (
      <div>
        <p>Our platform operates on an "as-is" basis for most transactions. Once an item is sold and payment is received, the sale is typically final.</p>
        <br/>
        <p>However, we encourage sellers to be transparent about item conditions. If there's a significant discrepancy between the listing description and the actual item, we may mediate between buyer and seller to reach a fair resolution.</p>
      </div>
    ),
  },
];

export default function SellInstructions({ setView }) {
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
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            color: '#0d1b2a',
            marginBottom: 0,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}>
            <span style={{ color: '#f5c518' }}>Start</span> Selling?
          </h1>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#0d1b2a',
            padding: '0.6rem 1.5rem',
            borderRadius: '6px 6px 0 0',
            fontSize: '0.875rem',
          }}>
            <button
              onClick={() => setView && setView('home')}
              style={{ color: '#14b8a6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '500' }}
            >
              Home
            </button>
            <span style={{ color: '#64748b' }}>›</span>
            <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Sell Used Items: Fast and Efficient Selling with Next Owner Store</span>
          </div>
        </div>
      </div>

      {/* ── FAQ Section ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 4rem' }}>

        <h2 style={{
          color: '#14b8a6',
          fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
          fontWeight: '800',
          marginBottom: '2rem',
          lineHeight: 1.2,
        }}>
          Sellers Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {FAQS.map(({ id, q, content }) => (
            <div
              key={id}
              style={{
                backgroundColor: '#111827',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              <button
                onClick={() => toggle(id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: '1rem',
                }}
              >
                <span style={{ color: '#14b8a6', fontWeight: '700', fontSize: '1.5rem', lineHeight: 1.4 }}>
                  {q}
                </span>
                {openSection === id ? (
                  <span style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    backgroundColor: '#f5c518',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
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
                  <div style={{ color: '#e2e8f0', fontSize: '1rem', lineHeight: 1.85, marginTop: '1rem' }}>
                    {content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}