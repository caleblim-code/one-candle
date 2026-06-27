"use client";

import Link from 'next/link';

export default function TermsOfService() {
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
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '0.95rem' }}>Last updated: June 27, 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: '1.8', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>1. Acceptance of Terms</h2>
            <p>By accessing or using OneCandle (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>2. Description of Service</h2>
            <p>OneCandle is a web-based trading journal and analytics platform that allows traders to log, track, and analyze their trades. The Service includes features such as trade journaling, performance analytics, daily notes, playbook management, data export, and account tracking. OneCandle is not a broker, financial advisor, or investment platform. We do not execute trades, provide financial advice, or manage funds on your behalf.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>3. User Accounts</h2>
            <p>To use the Service, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. You must be at least 18 years of age to use the Service.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>4. User Data & Content</h2>
            <p>You retain ownership of all data you enter into the Service, including trade records, journal entries, notes, and any uploaded images. By using the Service, you grant OneCandle a limited license to store, process, and display your data solely for the purpose of providing the Service to you. We will not sell, share, or distribute your personal trading data to third parties without your explicit consent.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Upload malicious code, viruses, or any harmful content</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>6. Disclaimer</h2>
            <p>The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether express or implied. OneCandle does not guarantee that the Service will be uninterrupted, secure, or error-free. Trading involves substantial risk of loss. The analytics, reports, and insights provided by OneCandle are for informational purposes only and should not be construed as financial advice. You are solely responsible for your trading decisions.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, OneCandle shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses, resulting from your use of or inability to use the Service. In no event shall our total liability exceed the amount you paid us in the twelve (12) months preceding the claim.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>8. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion. You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will cease immediately. You may export your data before termination using our data export feature.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>9. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the updated Terms on the Service and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-color)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>10. Contact</h2>
            <p>If you have any questions about these Terms, please contact us at <Link href="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>our contact page</Link>.</p>
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
