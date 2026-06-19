import Link from 'next/link';

export default function ForgotPassword() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Forgot Password</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>This is a placeholder for the forgot password flow.</p>
        <Link href="/login" className="btn btn-primary">Back to Login</Link>
      </div>
    </div>
  );
}
