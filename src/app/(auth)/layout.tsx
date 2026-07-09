"use client";

import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>OneCandle</span>
          </Link>
        </div>

        <div className="auth-left-content" style={{ margin: 'auto 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.2 }}>
            "Join 100,000+ traders<br/>journaling smarter."
          </h2>
          <div style={{ color: '#FFB800', letterSpacing: '4px', fontSize: '1.2rem', marginBottom: '1rem' }}>★★★★★</div>
          <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>Stop guessing. Start trading with data.</p>
        </div>

        <div className="auth-left-content" style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8, fontSize: '0.85rem', fontWeight: 500 }}>
          <span>✓ No credit card required</span>
          <span>✓ Cancel anytime</span>
          <span>✓ Loved by prop traders</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        {children}
      </div>
    </div>
  );
}
