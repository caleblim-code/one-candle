"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Failed to sign up');
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
        <h1 className="mobile-only" style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '2rem' }}>OneCandle</h1>
        <h2 className="desktop-only" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create Account</h2>
        <p className="text-muted">Start your trading journal journey.</p>
      </div>
      
      {error && <div style={{ backgroundColor: 'rgba(221, 94, 86, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0, opacity: loading ? 0.6 : 1, transition: 'opacity 150ms ease' }}>
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={name} 
              onChange={e => { setName(e.target.value); setError(''); }} 
              required 
              placeholder="John Doe"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={email} 
              onChange={e => { setEmail(e.target.value); setError(''); }} 
              required 
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              style={password.length > 0 && password.length < 8 ? { borderColor: 'var(--danger)' } : {}}
              value={password} 
              onChange={e => { setPassword(e.target.value); setError(''); }} 
              required 
              placeholder="Min 8 characters"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-input" 
              style={confirmPassword.length > 0 && confirmPassword !== password ? { borderColor: 'var(--danger)' } : {}}
              value={confirmPassword} 
              onChange={e => { setConfirmPassword(e.target.value); setError(''); }} 
              required 
              placeholder="Confirm password"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', position: 'relative' }} disabled={loading}>
            {loading ? <span className="spinner"></span> : null}
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        </fieldset>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          <span className="text-muted">Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: '600' }} className="auth-link">Log in</Link>
        </div>
      </div>
  );
}
