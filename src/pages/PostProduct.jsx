import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px dotted #1e3a4a', marginBottom: '0' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '1.5rem 0',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <h2 style={{ color: '#14b8a6', fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>
          {title}
        </h2>
        <svg
          width="22" height="22" fill="none" stroke="#14b8a6" strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div style={{ paddingBottom: '2rem' }}>{children}</div>}
    </div>
  );
};

const Field = ({ label, required, hint, children }) => (
  <div style={{ marginBottom: '1.75rem' }}>
    <label style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.6rem',
    }}>
      {label}
      {required && <span style={{ color: '#14b8a6' }}>*</span>}
      {hint && (
        <span title={hint} style={{
          width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #475569',
          color: '#64748b', fontSize: '0.65rem', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'help', fontWeight: '700',
        }}>i</span>
      )}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '0.85rem 1rem',
  backgroundColor: '#0d1b2a',
  border: '1px solid #1e3a4a',
  borderRadius: '6px',
  color: '#f1f5f9',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function PostProduct({ loadProducts, user, setView }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'Good',
    image_url: '',
    location: '',
    phone: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { setLoading(false); return; }

    const { error: submitError } = await supabase.from('products').insert([{
      title: formData.title,
      description: formData.description,
      price: formData.price,
      category: formData.category,
      condition: formData.condition,
      image_url: formData.image_url,
      seller_id: currentUser.id,
      status: 'active',
    }]);

    setLoading(false);
    if (!submitError) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      setFormData({ title: '', description: '', price: '', category: '', condition: 'Good', image_url: '', location: '', phone: '' });
      loadProducts();
    } else {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div style={{ backgroundColor: '#0a1520', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Page Header */}
      <div style={{
        backgroundColor: '#0d1f30',
        borderBottom: '1px solid #1e3a4a',
        padding: '2rem 1.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <button onClick={() => setView('home')} style={{ color: '#14b8a6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '500' }}>Home</button>
            <span style={{ color: '#334155' }}>›</span>
            <span style={{ color: '#94a3b8' }}>Post Item</span>
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: '700', margin: 0 }}>
            Post a New Ad
          </h1>
        </div>
      </div>

      {/* Auth prompt */}
      {!user && (
        <div style={{ maxWidth: '860px', margin: '2rem auto 0', padding: '0 1.5rem' }}>
          <div style={{
            border: '2px dashed #1e3a4a',
            borderRadius: '10px',
            padding: '1.25rem 1.5rem',
            textAlign: 'center',
            backgroundColor: '#0d1f30',
          }}>
            <p style={{ color: '#14b8a6', fontSize: '0.95rem', margin: 0 }}>
              You can also{' '}
              <button onClick={() => setView('signin')} style={{ color: '#14b8a6', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Log In
              </button>
              {' '}or{' '}
              <button onClick={() => setView('signup')} style={{ color: '#14b8a6', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Register
              </button>
              {' '}first.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div style={{ maxWidth: '860px', margin: '2rem auto', padding: '0 1.5rem 4rem', boxSizing: 'border-box' }}>
        <form onSubmit={handleSubmit}>

          {/* General Info */}
          <div style={{ backgroundColor: '#0d1f30', borderRadius: '10px', padding: '0 1.75rem', marginBottom: '1.25rem' }}>
            <Section title="General info">
              <Field label="Ad Name" required hint="Give your item a clear, descriptive name">
                <input
                  type="text"
                  placeholder="e.g. Vintage Wooden Chair"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={inputStyle}
                />
              </Field>

              <Field label="Category" required>
                <div style={{ position: 'relative' }}>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    required
                    style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                  >
                    <option value="">Category</option>
                    <option>Furniture</option>
                    <option>Electronics</option>
                    <option>Household</option>
                    <option>B4Sale</option>
                    <option>Clothing</option>
                    <option>Books</option>
                    <option>Sports</option>
                    <option>Other</option>
                  </select>
                  <svg style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </Field>
            </Section>
          </div>

          {/* Description */}
          <div style={{ backgroundColor: '#0d1f30', borderRadius: '10px', padding: '0 1.75rem', marginBottom: '1.25rem' }}>
            <Section title="Description" defaultOpen={true}>
              <Field label="Description" required hint="Include measurements, brand, age, and any wear or imperfections">
                <textarea
                  placeholder="Describe your item in detail. Include brand, age, dimensions, and any faults..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  required
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '140px' }}
                />
              </Field>

              {/* Error */}
              {error && (
                <div style={{ backgroundColor: '#1e0a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '0.9rem 1.25rem', marginBottom: '1.25rem', color: '#fca5a5', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              {/* Success */}
              {submitted && (
                <div style={{ backgroundColor: '#0a1f0a', border: '1px solid #166534', borderRadius: '8px', padding: '0.9rem 1.25rem', marginBottom: '1.25rem', color: '#86efac', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Item posted successfully!
                </div>
              )}

              {/* Submit button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', overflow: 'hidden',
                    borderRadius: '7px', border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <span style={{
                    backgroundColor: '#14b8a6', color: '#0a1520',
                    padding: '0.85rem 1.75rem',
                    fontSize: '0.95rem', fontWeight: '700',
                    letterSpacing: '0.04em',
                  }}>
                    {loading ? 'Posting...' : 'Post Your Ad'}
                  </span>
                  <span style={{
                    backgroundColor: '#0d9488', color: '#fff',
                    padding: '0.85rem 1.1rem',
                    fontSize: '1.4rem', lineHeight: 1,
                    display: 'flex', alignItems: 'center',
                  }}>
                    +
                  </span>
                </button>
              </div>
            </Section>
          </div>





        </form>
      </div>

      <style>{`
        input::placeholder, textarea::placeholder { color: #334155; }
        input:focus, textarea:focus, select:focus { border-color: #14b8a6 !important; box-shadow: 0 0 0 2px rgba(20,184,166,0.15); }
        @media (max-width: 500px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}