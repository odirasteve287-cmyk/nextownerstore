import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

// ── Defined OUTSIDE AuthForm so React doesn't remount it on every keystroke ──
const inputStyle = {
  width: '100%',
  background: '#0d1117',
  border: '1.5px solid #1e2d3d',
  borderRadius: '6px',
  padding: '13px 14px 13px 46px',
  color: '#e2e8f0',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};

const iconWrap = {
  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
  color: '#0bbfaa', display: 'flex', alignItems: 'center',
};

const rightIconWrap = {
  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
  color: '#94a3b8', display: 'flex', alignItems: 'center', cursor: 'pointer',
  background: 'none', border: 'none', padding: 0,
};

function InputField({ icon, ...props }) {
  return (
    <div style={{ position: 'relative', marginBottom: '12px' }}>
      <div style={iconWrap}>{icon}</div>
      <input
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#0bbfaa'}
        onBlur={e => e.target.style.borderColor = '#1e2d3d'}
        {...props}
      />
    </div>
  );
}

function PasswordField({ icon, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', marginBottom: '12px' }}>
      <div style={iconWrap}>{icon}</div>
      <input
        style={inputStyle}
        type={show ? 'text' : 'password'}
        onFocus={e => e.target.style.borderColor = '#0bbfaa'}
        onBlur={e => e.target.style.borderColor = '#1e2d3d'}
        {...props}
      />
      <button
        type="button"
        style={rightIconWrap}
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          {show ? (
            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          ) : (
            <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>
          )}
        </svg>
      </button>
    </div>
  );
}

const IconUser  = <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconEmail = <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>;
const IconPhone = <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.26A16 16 0 0015.74 17.09l1.62-1.62a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const IconLock  = <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;

export default function AuthForm({ type: initialType, setView }) {
  const [tab, setTab] = useState(initialType === 'signup' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [acceptPromo, setAcceptPromo] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else setView('user-dashboard');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!acceptPolicy) {
      setError('Please accept the Privacy Policy');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          phone,
        }
      }
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created! Please check your email to confirm your account.');
      setTimeout(() => setView('home'), 2000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0bbfaa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Geometric background */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <polygon points="800,0 1050,0 750,800 500,800"    fill="rgba(255,255,255,0.08)" />
        <polygon points="950,0 1200,0 1200,500 900,800"   fill="rgba(255,255,255,0.06)" />
        <polygon points="600,0 820,0 560,800 340,800"     fill="rgba(0,0,0,0.06)"       />
        <polygon points="1000,0 1200,0 1200,800 1100,800" fill="rgba(255,255,255,0.05)" />
        <polygon points="700,0 900,0 650,800 450,800"     fill="rgba(255,255,255,0.04)" />
      </svg>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#0d1117',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #1e2d3d' }}>
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                padding: '16px',
                background: tab === t ? '#0d1117' : '#111827',
                border: 'none',
                borderBottom: tab === t ? '2px solid #0bbfaa' : '2px solid transparent',
                color: tab === t ? '#0bbfaa' : '#64748b',
                fontWeight: tab === t ? '600' : '400',
                fontSize: '15px',
                cursor: 'pointer',
                letterSpacing: '0.03em',
                transition: 'all 0.2s',
                marginBottom: '-2px',
                textTransform: 'capitalize',
              }}
            >
              {t === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <div style={{ padding: '28px 32px 32px' }}>
          {/* Error / Success messages */}
          {error && (
            <div style={{ background: '#2d1515', border: '1px solid #dc2626', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#1e3a2a', border: '1px solid #2ecc71', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', color: '#6fcf97', fontSize: '13px' }}>
              {success}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <InputField icon={IconEmail} type="email"    placeholder="Email"    value={email}    onChange={e => setEmail(e.target.value)}    required />
              <PasswordField icon={IconLock} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#64748b', fontSize: '13px' }}>
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#0bbfaa', width: '15px', height: '15px' }} />
                  Remember me
                </label>
                <button type="button" style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', background: '#0bbfaa', border: 'none',
                borderRadius: '6px', color: '#0d1b2a', fontWeight: '700', fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'background 0.2s', letterSpacing: '0.02em',
              }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = '#09a896')}
                onMouseLeave={e => e.currentTarget.style.background = '#0bbfaa'}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <InputField icon={IconUser}  type="text"     placeholder="Username*"    value={username} onChange={e => setUsername(e.target.value)} required />
              <InputField icon={IconEmail} type="email"    placeholder="Email*"       value={email}    onChange={e => setEmail(e.target.value)}    required />
              <InputField icon={IconPhone} type="tel"      placeholder="Contact*"     value={phone}    onChange={e => setPhone(e.target.value)}    required />
              <PasswordField icon={IconLock} placeholder="Password*"         value={password}        onChange={e => setPassword(e.target.value)} required />
              <PasswordField icon={IconLock} placeholder="Confirm Password*" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                <input type="checkbox" checked={acceptPolicy} onChange={e => setAcceptPolicy(e.target.checked)}
                  style={{ accentColor: '#0bbfaa', width: '15px', height: '15px', marginTop: '1px', flexShrink: 0 }} />
                <span>I accept the <span style={{ color: '#0bbfaa', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                <input type="checkbox" checked={acceptPromo} onChange={e => setAcceptPromo(e.target.checked)}
                  style={{ accentColor: '#0bbfaa', width: '15px', height: '15px', marginTop: '1px', flexShrink: 0 }} />
                I agree to receive promotional emails and updates
              </label>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', background: '#0bbfaa', border: 'none',
                borderRadius: '6px', color: '#0d1b2a', fontWeight: '700', fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = '#09a896')}
                onMouseLeave={e => e.currentTarget.style.background = '#0bbfaa'}
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}