"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send reset link.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An unexpected error occurred.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '2rem' }}>OneCandle</h1>
          <p className="text-muted">Reset your password</p>
        </div>
        
        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ backgroundColor: 'rgba(0, 210, 75, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly. Please check your inbox and spam folder.
            </div>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>Return to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {status === 'error' && <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{message}</div>}

            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={status === 'loading'}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', position: 'relative', marginBottom: '1.5rem' }} disabled={status === 'loading'}>
              {status === 'loading' ? <span className="spinner"></span> : null}
              {status === 'loading' ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              <Link href="/login" style={{ color: 'var(--accent)', fontWeight: '600' }}>Back to log in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
