import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const CATEGORIES = ['Furniture', 'Decor', 'Kitchenware', 'Appliances', 'For Kids'];

const SOCIAL_ICONS = [
  { label: 'Facebook',  path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { label: 'X',         path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { label: 'LinkedIn',  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  { label: 'YouTube',   path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { label: 'TikTok',    path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z' },
];

export default function BookAgent({ setView }) {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '',
    categories: [], service: '',
    additionalInfo: '', agreed: false,
  });
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [submitError,  setSubmitError]  = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'categories') {
      setFormData(prev => ({
        ...prev,
        categories: checked ? [...prev.categories, value] : prev.categories.filter(c => c !== value),
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreed)                  { alert('Please agree to the Terms and Privacy Policy.'); return; }
    if (formData.categories.length === 0)  { alert('Please select at least one category.');          return; }
    if (!formData.service)                 { alert('Please select a service preference.');            return; }

    setSubmitting(true);
    setSubmitError('');

    const { error } = await supabase.from('bookings').insert([{
      name:            formData.name.trim(),
      phone:           formData.phone.trim(),
      email:           formData.email.trim(),
      categories:      formData.categories,
      service:         formData.service,
      additional_info: formData.additionalInfo.trim(),
      status:          'pending',
      created_at:      new Date().toISOString(),
    }]);

    setSubmitting(false);

    if (error) {
      console.error('Booking error:', error);
      setSubmitError(`Could not save booking: ${error.message}`);
      return;
    }

    setSubmitted(true);
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    backgroundColor: '#ffffff', border: '1px solid #334155',
    borderRadius: '6px', color: '#0f172a',
    fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const labelStyle = {
    display: 'block', color: '#e2e8f0',
    fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px',
  };

  return (
    <div style={{ backgroundColor: '#0d1b2a', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{ backgroundColor: '#0bbfaa', position: 'relative', overflow: 'hidden', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 1200 280" preserveAspectRatio="xMidYMid slice">
          <polygon points="800,0 1050,0 750,280 500,280" fill="rgba(255,255,255,0.08)" />
          <polygon points="950,0 1200,0 1200,180 900,280" fill="rgba(255,255,255,0.06)" />
          <polygon points="600,0 820,0 560,280 340,280" fill="rgba(0,0,0,0.06)" />
          <polygon points="1000,0 1200,0 1200,280 1100,280" fill="rgba(255,255,255,0.05)" />
        </svg>
        <div style={{ flex: 1 }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 0.75rem', width: '100%', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: '#0d1b2a', marginBottom: 0, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#f5c518' }}>Book</span> An Agent
          </h1>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0d1b2a', padding: '0.6rem 1.5rem', borderRadius: '6px 6px 0 0', fontSize: '0.875rem' }}>
            <button onClick={() => setView && setView('home')} style={{ color: '#14b8a6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '500' }}>Home</button>
            <span style={{ color: '#64748b' }}>›</span>
            <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Book an Agent</span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 3rem', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'start' }}>

          {/* Left */}
          <div style={{ color: '#e2e8f0', paddingTop: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#14b8a6', marginBottom: '1.5rem', lineHeight: 1.2 }}>Ready to Help!</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Finding the right support shouldn't be difficult. We're here to help with expert staff ready to answer your questions and guide you to the best solution.</p>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '2rem', fontSize: '0.95rem' }}>Our services include site visits, inventory management, valuation, photography, marketing strategy, and after-sale support. We've got you covered.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {SOCIAL_ICONS.map(({ label, path }) => (
                <a key={label} href="#" aria-label={label}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1.5px solid #2d4a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.color = '#14b8a6'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d4a6b'; e.currentTarget.style.color = '#94a3b8'; }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d={path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '2rem', border: '1px solid #1e293b', marginTop: '-100px', position: 'relative', zIndex: 3 }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ color: '#14b8a6', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>Booking Received!</h3>
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Our team will reach out to you shortly.</p>
                <button onClick={() => setView && setView('home')}
                  style={{ padding: '10px 28px', backgroundColor: '#14b8a6', color: '#0d1b2a', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
                  Back to Home
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ color: '#14b8a6', fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>BOOK AN AGENT</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>We would be delighted to receive precise information regarding your booking for our agency services.</p>

                {submitError && (
                  <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid #ef4444', color: '#fca5a5', fontSize: '0.85rem' }}>
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  <div>
                    <label style={labelStyle}>Your Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="eg: John Doe" required style={inputStyle} />
                  </div>

                  <div>
                    <label style={labelStyle}>Phone/Mobile <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select style={{ ...inputStyle, width: '130px', flexShrink: 0, cursor: 'pointer' }}>
                        <option value="+1">US +1</option>
                        <option value="+44">UK +44</option>
                        <option value="+91">India +91</option>
                        <option value="+61">AU +61</option>
                      </select>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter valid phone number" required style={{ ...inputStyle, flex: 1 }} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Email <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="e.g xyz@abc.com" required style={inputStyle} />
                  </div>

                  <div>
                    <label style={labelStyle}>What category of items do you have? <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {CATEGORIES.map(cat => (
                        <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem' }}>
                          <input type="checkbox" name="categories" value={cat} checked={formData.categories.includes(cat)} onChange={handleChange}
                            style={{ width: '16px', height: '16px', accentColor: '#14b8a6', cursor: 'pointer' }} />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Which service do you prefer: <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {[{ value: 'paid', label: 'Paid Service ($10)' }, { value: 'free', label: 'Free Service (Remote support)' }].map(opt => (
                        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem' }}>
                          <input type="radio" name="service" value={opt.value} checked={formData.service === opt.value} onChange={handleChange} required
                            style={{ width: '16px', height: '16px', accentColor: '#14b8a6', cursor: 'pointer' }} />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Additional Information</label>
                    <textarea name="additionalInfo" value={formData.additionalInfo} onChange={handleChange} rows={4}
                      placeholder="Give more details to help us understand..."
                      style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      <input type="checkbox" name="agreed" checked={formData.agreed} onChange={handleChange}
                        style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#14b8a6', cursor: 'pointer', flexShrink: 0 }} />
                      <span>I have read and agree to the{' '}
                        <button type="button" onClick={() => setView && setView('terms')} style={{ color: '#14b8a6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 'inherit' }}>Terms and Conditions</button>
                        {' '}and{' '}
                        <button type="button" onClick={() => setView && setView('privacy')} style={{ color: '#14b8a6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 'inherit' }}>Privacy Policy</button>
                      </span>
                    </label>
                  </div>

                  <button type="submit" disabled={submitting}
                    style={{ padding: '14px 32px', backgroundColor: submitting ? '#14b8a6' : '#0d1b2a', color: submitting ? '#0d1b2a' : '#ffffff', border: '2px solid #14b8a6', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', fontFamily: 'inherit', transition: 'background-color 0.2s, color 0.2s' }}
                    onMouseEnter={e => { if (!submitting) { e.currentTarget.style.backgroundColor = '#14b8a6'; e.currentTarget.style.color = '#0d1b2a'; }}}
                    onMouseLeave={e => { if (!submitting) { e.currentTarget.style.backgroundColor = '#0d1b2a'; e.currentTarget.style.color = '#ffffff'; }}}>
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>

                </form>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}