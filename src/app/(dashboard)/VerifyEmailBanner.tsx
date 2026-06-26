"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailBanner({ isVerified }: { isVerified?: boolean }) {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(!isVerified);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setIsVisible(false);
    }
  }, [searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!isVisible || isVerified) return null;

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Verification email sent! Check your inbox.');
        setCooldown(60); // 60s cooldown
      } else {
        setMessage(data.error || 'Failed to resend email.');
        if (res.status === 429) setCooldown(60);
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderBottom: '1px solid rgba(234, 179, 8, 0.3)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        <span style={{ color: 'var(--text-color)', fontWeight: '500' }}>Please verify your email address. Check your inbox for a verification link.</span>
        {message && <span style={{ marginLeft: '12px', fontStyle: 'italic', color: 'var(--text-color)' }}>{message}</span>}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={handleResend}
          disabled={loading || cooldown > 0}
          style={{ background: 'none', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#fde047', cursor: (loading || cooldown > 0) ? 'not-allowed' : 'pointer', padding: '4px 12px', borderRadius: '4px', fontSize: '0.85rem', opacity: (loading || cooldown > 0) ? 0.6 : 1 }}
        >
          {loading ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Resend Email'}
        </button>
        <button onClick={() => setIsVisible(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>✕</button>
      </div>
    </div>
  );
}
