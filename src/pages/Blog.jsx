import React, { useState } from 'react';

const POSTS = [
  {
    id: 1,
    title: 'How to Buy Quality Second-Hand Furniture Without Getting Scammed',
    excerpt: 'Learn the best strategies for finding quality pre-owned furniture, what to look for, and how to avoid common pitfalls when buying second-hand.',
    date: 'January 28, 2025',
    category: 'TIPS & TRICKS',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=500&fit=crop',
    body: `Finding quality second-hand furniture can be a rewarding experience — both for your wallet and the environment. However, without the right knowledge, it's easy to end up with items that look great in photos but fall apart within months.\n\nStart by examining joinery and construction. Solid wood furniture with dovetail or mortise-and-tenon joints will outlast particleboard pieces with cam-lock hardware by decades. Knock gently on surfaces — solid wood produces a dull thud while hollow or composite materials sound thin and tinny.\n\nWhen shopping online, always ask for additional photos in natural light, and specifically request images of the underside, back panels, and any areas that might show wear. Reputable sellers will happily provide these. If a seller is evasive or rushes you, treat it as a red flag.\n\nFor upholstered pieces, check for structural integrity by pressing firmly on seat cushions and armrests. Sagging springs, broken frames, or musty odors are deal-breakers. Remember that reupholstering a sofa can cost more than the original purchase, so factor that into your pricing calculations.\n\nAlways meet in a well-lit, public or semi-public location for your first viewing. Bring a measuring tape, a small flashlight to inspect underneath and behind pieces, and a friend who can provide a second opinion. Trust your instincts — if something feels off about the item or the seller, walk away.`,
  },
  {
    id: 2,
    title: 'Recover Cash from Dead Stock: A Business Owner\'s Guide to Selling Surplus',
    excerpt: 'Discover how business owners can turn unused inventory and surplus stock into cash through smart secondhand selling strategies.',
    date: 'January 25, 2025',
    category: 'BUSINESS',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=500&fit=crop',
    body: `Dead stock is a silent killer of small business cash flow. Items sitting in a warehouse or back room represent capital that could be reinvested in growth, yet many business owners are reluctant to sell surplus goods at reduced prices for fear of undermining their brand.\n\nThe reality is that smart surplus liquidation is a sign of operational efficiency, not weakness. The key is choosing the right channel for your product type. High-value items like office equipment, furniture, and industrial tools perform well on dedicated B2B resale platforms, while consumer goods often move faster through general marketplaces.\n\nBundle slow-moving items with fast sellers to increase perceived value. A lot of ten slow-selling desk lamps might not attract individual buyers, but paired with five ergonomic chairs they become an attractive "office starter kit" for a small business or startup.\n\nTiming matters. Post listings at the end of quarters when businesses are spending remaining budgets, or in January when new-year reorganizations drive demand for office upgrades. Price aggressively but not desperately — research comparable listings and position yours 10–15% below market to generate quick interest without signaling distress.\n\nDocument everything with professional photos and accurate condition descriptions. Business buyers appreciate transparency and are far more likely to return for future purchases if the first transaction is smooth and honest.`,
  },
  {
    id: 3,
    title: 'Sustainable Shopping: Give Items a Second Life',
    excerpt: 'Why buying and selling pre-owned items is good for the planet. Discover the environmental impact of secondhand shopping and how you can make a difference.',
    date: 'January 20, 2025',
    category: 'GENERAL',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop',
    body: `The secondhand market is one of the most powerful tools we have for reducing consumption-driven environmental damage. Every item that finds a new home instead of a landfill represents a small but meaningful act of environmental responsibility.\n\nConsider the lifecycle of a smartphone. Manufacturing a single device requires mining rare earth minerals, consuming hundreds of liters of water, and emitting dozens of kilograms of CO2 — before the device ever reaches a consumer. When you buy a refurbished phone or sell your old one rather than discarding it, you extend that device's useful life and defer the environmental cost of new production.\n\nTextiles are another area where secondhand shopping has enormous impact. The fashion industry is one of the world's largest polluters, and fast fashion has accelerated the cycle of production and disposal to an unsustainable pace. Buying pre-owned clothing not only reduces demand for new production but also keeps synthetic fibers out of landfills, where they can take hundreds of years to break down.\n\nThe rise of peer-to-peer resale platforms has made sustainable shopping more accessible than ever. What was once limited to charity shops and car boot sales now spans a global marketplace of millions of items across every category imaginable. With a little patience and smart searching, it's possible to furnish an entire home or refresh a wardrobe entirely through secondhand channels.\n\nStart small. Commit to checking secondhand options before buying new for three months. The habit, once formed, tends to stick — and the savings are a welcome bonus.`,
  },
  {
    id: 4,
    title: 'Pricing Your Items Right: A Complete Guide for Sellers',
    excerpt: 'Master the art of pricing your pre-owned items competitively. Learn how to research market values and set prices that attract buyers.',
    date: 'January 15, 2025',
    category: "HOW TO's",
    image: 'https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=800&h=500&fit=crop',
    body: `Pricing is where most first-time sellers go wrong. Set your price too high and the listing sits unseen for weeks; too low and you leave money on the table and inadvertently signal that something might be wrong with the item.\n\nBegin with market research. Search for identical or near-identical items on the same platform and note the prices of recently sold listings — not just active ones. Sold prices reflect what buyers actually paid, while active listings only show what sellers hope to receive.\n\nCondition grading is crucial. Most platforms use a scale from "like new" or "mint" down to "for parts." Be ruthlessly honest in your assessment. Buyers will notice discrepancies between your description and reality immediately upon delivery, and disputes erode both your reputation and your time.\n\nFactor in the full cost of selling. Platform fees, packaging materials, postage, and your time all eat into your margin. A jacket listed at £30 might only net you £18 after a 15% platform fee, £3 in packaging, and £4 in shipping. Price accordingly.\n\nFor items with fluctuating value — electronics, collectibles, vintage fashion — check price trends over the past 30 to 90 days. Prices can move quickly based on new product releases, seasonal demand, or viral social media attention. A vintage jacket that was worth £40 three months ago might command £90 today if the style has come back into fashion.\n\nFinally, don't be afraid to negotiate. Set your asking price 10–15% above your target to give yourself negotiating room, but be prepared to move quickly when a serious buyer appears.`,
  },
  {
    id: 5,
    title: 'Safety Tips for Meeting Buyers and Sellers in Person',
    excerpt: 'Essential safety guidelines for in-person transactions. Learn about safe meeting locations, payment methods, and red flags to watch out for.',
    date: 'January 10, 2025',
    category: 'TIPS & TRICKS',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=500&fit=crop',
    body: `In-person transactions are often the fastest and most straightforward way to buy or sell locally, but they require sensible precautions to ensure everyone's safety and security.\n\nAlways choose a public meeting location. Coffee shops, shopping centre car parks, and police station "safe exchange zones" (offered by many forces worldwide) are all excellent choices. Avoid meeting at your home address, particularly for high-value items, and never share your home address before you've completed at least one successful transaction with a buyer or seller.\n\nFor high-value items, bring a friend. There is safety in numbers, and a second person can help you assess the item or transaction more objectively. Two people are also far less likely to be targeted by bad actors.\n\nCash is convenient but carries risks. Count notes carefully before handing over an item, and be aware of counterfeit currency. Bank transfer is increasingly common for larger transactions and provides a paper trail. Avoid payment apps that don't offer buyer protection for in-person sales.\n\nTrust your instincts. If a buyer or seller makes you uncomfortable — through overly pushy behaviour, requests to meet in unusual locations, or evasiveness about their identity — it is completely acceptable to cancel the meeting. Your safety is more important than any transaction.\n\nFor expensive electronics, test the item fully before paying. Power it on, check all functions, and verify serial numbers haven't been reported stolen using free online databases. A seller who refuses to allow this level of inspection should be avoided.`,
  },
  {
    id: 6,
    title: 'Photography Tips for Better Listings That Sell Faster',
    excerpt: 'Take photos that sell! Learn professional photography techniques for showcasing your items in the best light, from angles to editing.',
    date: 'January 5, 2025',
    category: "HOW TO's",
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=500&fit=crop',
    body: `A great photo can be the difference between a listing that sells in hours and one that sits for months. Buyers make split-second decisions based on thumbnails, so investing ten extra minutes in photography pays enormous dividends.\n\nNatural light is your best friend. Shoot near a large window during daylight hours and avoid harsh direct sunlight, which creates unflattering shadows. Overcast days produce beautifully diffused light that reveals texture and color accurately — ideal for clothing, furniture, and most consumer goods.\n\nUse a clean, uncluttered background. A white or light grey wall, a plain bedsheet, or a wooden floor all work well. Backgrounds with visual noise distract from the item and make your listing look unprofessional. Many experienced sellers keep a dedicated photography corner set up at all times.\n\nShoot from multiple angles. Buyers want to see the front, back, sides, and any notable details or flaws. For clothing, include a flat lay shot and an on-body or hanger shot. For furniture and electronics, show the underside, back panel, and any connectors or hardware.\n\nDon't over-edit. Adjusting brightness and contrast slightly is fine; dramatically boosting saturation to make colors appear more vivid than they are will only result in disappointed buyers and returns. Accurate representation builds trust and repeat business.\n\nFinally, photograph any flaws clearly and honestly. A small scratch shown transparently in the listing builds buyer confidence far more than a perfect-looking photo that turns out to be misleading. Buyers appreciate sellers who set accurate expectations.`,
  },
];

const CATEGORY_COLORS = {
  'TIPS & TRICKS': '#14b8a6',
  'BUSINESS': '#f5c518',
  'GENERAL': '#94a3b8',
  "HOW TO's": '#a78bfa',
};

export default function Blog({ setView }) {
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  const filtered = POSTS.filter(p => {
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
  });

  if (selectedPost) {
    return (
      <div style={{ backgroundColor: '#0d1b2a', minHeight: '100vh', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        {/* Back button */}
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1.25rem 0' }}>
          <button
            onClick={() => setSelectedPost(null)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              color: '#14b8a6', background: 'none', border: '1px solid #14b8a6',
              borderRadius: '6px', padding: '0.5rem 1rem',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
              letterSpacing: '0.04em',
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </button>
        </div>

        {/* Article */}
        <article style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
          {/* Category */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{
              color: CATEGORY_COLORS[selectedPost.category] || '#14b8a6',
              fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em',
            }}>
              {selectedPost.category}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            color: '#f1f5f9',
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: '800',
            lineHeight: 1.25,
            marginBottom: '1rem',
            fontFamily: "'Georgia', serif",
          }}>
            {selectedPost.title}
          </h1>

          {/* Date */}
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem' }}>{selectedPost.date}</p>

          {/* Hero Image */}
          <div style={{
            width: '100%', borderRadius: '12px', overflow: 'hidden',
            marginBottom: '2.5rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <img
              src={selectedPost.image}
              alt={selectedPost.title}
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '480px', objectFit: 'cover' }}
            />
          </div>

          {/* Excerpt */}
          <p style={{
            color: '#cbd5e1',
            fontSize: '1.15rem',
            lineHeight: 1.75,
            marginBottom: '2rem',
            fontStyle: 'italic',
            borderLeft: '3px solid #14b8a6',
            paddingLeft: '1.25rem',
          }}>
            {selectedPost.excerpt}
          </p>

          {/* Body */}
          <div>
            {selectedPost.body.split('\n\n').map((para, i) => (
              <p key={i} style={{
                color: '#e2e8f0',
                fontSize: '1rem',
                lineHeight: 1.85,
                marginBottom: '1.5rem',
              }}>
                {para}
              </p>
            ))}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0d1b2a', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Hero */}
      <div style={{
        backgroundColor: '#0bbfaa',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '240px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 1200 280" preserveAspectRatio="xMidYMid slice">
          <polygon points="800,0 1050,0 750,280 500,280" fill="rgba(255,255,255,0.08)" />
          <polygon points="950,0 1200,0 1200,180 900,280" fill="rgba(255,255,255,0.06)" />
          <polygon points="600,0 820,0 560,280 340,280" fill="rgba(0,0,0,0.06)" />
        </svg>
        <div style={{ flex: 1 }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 0.75rem', width: '100%', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            fontWeight: '800',
            color: '#0d1b2a',
            marginBottom: 0,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}>
            Our latest news
          </h1>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', width: '100%', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}>
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
            <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Blog</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.25rem 4rem', boxSizing: 'border-box' }}>

        {/* Search */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', maxWidth: '500px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            style={{
              flex: 1,
              padding: '0.85rem 1.25rem',
              backgroundColor: '#111827',
              border: '1px solid #1e293b',
              borderRight: 'none',
              borderRadius: '8px 0 0 8px',
              color: '#f1f5f9',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            onClick={() => {}}
            style={{
              padding: '0.85rem 1.1rem',
              backgroundColor: '#f5c518',
              border: 'none',
              borderRadius: '0 8px 8px 0',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" fill="none" stroke="#0d1b2a" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>No posts found.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {filtered.map(post => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                style={{
                  backgroundColor: '#111827',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #1e293b',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ height: '200px', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={post.image}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', display: 'block' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{
                    color: CATEGORY_COLORS[post.category] || '#14b8a6',
                    fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '0.6rem',
                  }}>
                    {post.category}
                  </span>
                  <h3 style={{
                    color: '#14b8a6',
                    fontSize: '1rem', fontWeight: '700', lineHeight: 1.4, marginBottom: '0.75rem',
                  }}>
                    {post.title}
                  </h3>
                  <p style={{
                    color: '#cbd5e1',
                    fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem', flex: 1,
                  }}>
                    {post.excerpt}
                  </p>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid #1e293b', paddingTop: '0.75rem',
                  }}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{post.date}</span>
                    <span style={{
                      color: '#14b8a6', fontSize: '0.8rem', fontWeight: '600',
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                    }}>
                      Read More
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile responsive style */}
      <style>{`
        @media (max-width: 600px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}