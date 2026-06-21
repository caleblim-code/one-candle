"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      disabled={isLoggingOut}
      style={{ 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        padding: '0.75rem 1rem', 
        color: isLoggingOut ? 'var(--text-muted)' : 'var(--danger)', 
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
        fontWeight: '500',
        fontFamily: 'inherit',
        fontSize: '1rem',
        textAlign: 'left',
        opacity: isLoggingOut ? 0.7 : 1,
        transition: 'all 150ms ease',
      }}
      onMouseOver={(e) => !isLoggingOut && (e.currentTarget.style.backgroundColor = 'rgba(255, 69, 58, 0.1)')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {isLoggingOut && <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '1.5px' }} />}
      {isLoggingOut ? 'Logging out...' : 'Log Out'}
    </button>
  );
}
