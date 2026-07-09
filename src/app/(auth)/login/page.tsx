"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Failed to login');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {/* Logo is now in layout left panel on desktop, but let's keep a mobile logo here */}
        <h1 className="mobile-only" style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '2rem' }}>OneCandle</h1>
        <h2 className="desktop-only" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
        <p className="text-muted">Log in to your journal.</p>
      </div>
      
      {error && <div style={{ backgroundColor: 'rgba(221, 94, 86, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

      <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0, opacity: loading ? 0.6 : 1, transition: 'opacity 150ms ease' }}>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            type="email" 
            className={`form-input ${error && !email ? 'border-danger' : ''}`} 
            style={error && !email ? { borderColor: 'var(--danger)' } : {}}
            value={email} 
            onChange={e => { setEmail(e.target.value); setError(''); }} 
            required 
            placeholder="you@example.com"
          />
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label className="form-label">Password</label>
            <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent)' }} className="auth-link">Forgot password?</Link>
          </div>
          <input 
            type="password" 
            className={`form-input ${error && !password ? 'border-danger' : ''}`} 
            style={error && !password ? { borderColor: 'var(--danger)' } : {}}
            value={password} 
            onChange={e => { setPassword(e.target.value); setError(''); }} 
            required 
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', position: 'relative' }} disabled={loading}>
          {loading ? <span className="spinner"></span> : null}
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      </fieldset>

      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
        <span className="text-muted">Don't have an account? </span>
        <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: '600' }} className="auth-link">Sign up</Link>
      </div>
    </div>
  );
}
