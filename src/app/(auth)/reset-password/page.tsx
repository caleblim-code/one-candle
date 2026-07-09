"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Missing reset token. Please check your email link.');
      return;
    }
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An unexpected error occurred.');
    }
  };

  if (!token && status !== 'success') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ backgroundColor: 'rgba(221, 94, 86, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Invalid or missing reset link.
        </div>
        <Link href="/forgot-password" className="btn btn-primary" style={{ width: '100%' }}>Request New Link</Link>
      </div>
    );
  }

  return (
    <>
      {status === 'success' ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ backgroundColor: 'rgba(82, 164, 154, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Your password has been reset successfully!
          </div>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>Log In Now</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {status === 'error' && <div style={{ backgroundColor: 'rgba(221, 94, 86, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{message}</div>}

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              disabled={status === 'loading'}
              placeholder="Min 8 characters"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              disabled={status === 'loading'}
              placeholder="Confirm password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', position: 'relative' }} disabled={status === 'loading'}>
            {status === 'loading' ? <span className="spinner"></span> : null}
            {status === 'loading' ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPassword() {
  return (
    <div className="auth-card animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '2rem' }}>OneCandle</h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Set New Password</h2>
        <p className="text-muted">Create a new password</p>
      </div>
      <Suspense fallback={<div style={{ textAlign: 'center' }}>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
