"use client";

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout} 
      style={{ 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0.75rem 1rem', 
        color: 'var(--danger)', 
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        fontFamily: 'inherit',
        fontSize: '1rem',
        textAlign: 'left'
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 69, 58, 0.1)')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      Log Out
    </button>
  );
}
