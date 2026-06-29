"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DashboardShell({
  children,
  sidebarContent,
  userInitial,
  userName,
}: {
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
  userInitial: string;
  userName: string;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)', position: 'relative' }}>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-only animate-fade-in"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        style={{ 
          width: '250px', 
          backgroundColor: 'var(--surface)', 
          borderRight: '1px solid var(--border)', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'transform 200ms ease',
          zIndex: 50,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
        className="sidebar-wrapper"
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            OneCandle
          </div>
          <button className="btn btn-ghost mobile-only" style={{ padding: '0.25rem 0.5rem', border: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>✕</button>
        </div>
        {sidebarContent}
      </aside>

      <style jsx>{`
        @media (min-width: 769px) {
          .sidebar-wrapper {
            position: static !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ height: '70px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', backgroundColor: 'var(--surface)', position: 'sticky', top: 0, zIndex: 30 }}>
          <button 
            className="btn btn-ghost mobile-only" 
            style={{ padding: '1rem', border: 'none' }}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          <div className="desktop-only"></div> {/* spacer */}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>
              {userInitial}
            </div>
            <span style={{ fontWeight: '500' }}>{userName}</span>
          </div>
        </header>
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
