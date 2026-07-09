"use client";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-bg">
      {/* Animated ambient orbs */}
      <div className="auth-orb auth-orb-1"></div>
      <div className="auth-orb auth-orb-2"></div>
      <div className="auth-orb auth-orb-3"></div>
      <div className="auth-orb auth-orb-4"></div>

      {/* Centered card container */}
      <div className="auth-center">
        {children}
      </div>
    </div>
  );
}
