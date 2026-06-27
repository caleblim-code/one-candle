"use client";

import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Nav */}
      <nav style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--surface)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-color)', textDecoration: 'none' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          OneCandle
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/login" style={{ fontWeight: '500', color: 'var(--text-muted)', textDecoration: 'none' }}>Log In</Link>
          <Link href="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '0.95rem' }}>Last updated: June 27, 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: '1.8', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>1. Introduction</h2>
            <p>OneCandle (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading journal platform. Please read this Privacy Policy carefully. By using the Service, you consent to the data practices described in this policy.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>2. Information We Collect</h2>
            <p><strong style={{ color: 'var(--text-color)' }}>Account Information:</strong> When you register, we collect your name, email address, and encrypted password. We never store passwords in plain text.</p>
            <p style={{ marginTop: '0.75rem' }}><strong style={{ color: 'var(--text-color)' }}>Trading Data:</strong> Trade records, journal entries, daily notes, playbook configurations, account settings, and any images you upload. This data is entered by you and stored securely in our database.</p>
            <p style={{ marginTop: '0.75rem' }}><strong style={{ color: 'var(--text-color)' }}>Usage Data:</strong> We may collect information about how you access and use the Service, including your IP address, browser type, and pages visited. This data is used solely to improve the Service.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Provide, operate, and maintain the Service</li>
              <li>Process your trades and generate analytics reports</li>
              <li>Send you transactional emails (e.g., email verification, password resets)</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect and prevent fraud, abuse, or security incidents</li>
              <li>Improve and personalize the Service</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>4. Data Sharing & Third Parties</h2>
            <p>We do <strong style={{ color: 'var(--text-color)' }}>not</strong> sell, rent, or trade your personal information or trading data to third parties. We may share information only in the following limited circumstances:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong style={{ color: 'var(--text-color)' }}>Service Providers:</strong> We use trusted third-party services (e.g., Supabase for database hosting, Vercel for application hosting, Resend for transactional emails) that process data on our behalf under strict data processing agreements.</li>
              <li><strong style={{ color: 'var(--text-color)' }}>Legal Requirements:</strong> We may disclose your information if required by law, court order, or governmental regulation.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data, including:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Passwords are hashed using bcrypt before storage</li>
              <li>Sessions are encrypted using JWT with secure, httpOnly cookies</li>
              <li>All data is transmitted over HTTPS/TLS encryption</li>
              <li>Rate limiting is applied to authentication endpoints to prevent brute-force attacks</li>
              <li>Input sanitization to prevent cross-site scripting (XSS) attacks</li>
            </ul>
            <p style={{ marginTop: '0.75rem' }}>While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>6. Data Retention & Export</h2>
            <p>We retain your data for as long as your account is active. You may export all of your trading data at any time using the built-in data export feature (available in CSV and JSON formats from the Settings page). If you wish to delete your account and all associated data, please contact us through our <Link href="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>contact page</Link>.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>7. Cookies</h2>
            <p>We use essential cookies only to maintain your authenticated session. We do not use third-party tracking cookies, advertising cookies, or analytics cookies. The session cookie is httpOnly, encrypted, and set with SameSite protections.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong style={{ color: 'var(--text-color)' }}>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong style={{ color: 'var(--text-color)' }}>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong style={{ color: 'var(--text-color)' }}>Deletion:</strong> Request deletion of your data and account</li>
              <li><strong style={{ color: 'var(--text-color)' }}>Export:</strong> Download your data using our built-in export tools</li>
            </ul>
            <p style={{ marginTop: '0.75rem' }}>To exercise any of these rights, please contact us through our <Link href="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>contact page</Link>.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>9. Children&apos;s Privacy</h2>
            <p>The Service is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please reach out through our <Link href="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>contact page</Link>.</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</Link>
        </div>
        <p>&copy; 2026 OneCandle. All rights reserved.</p>
      </footer>
    </div>
  );
}
