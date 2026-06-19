"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsClient({ user }: { user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [formData, setFormData] = useState({ name: user.name || '', email: user.email || '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: 'Profile updated successfully', type: 'success' });
        router.refresh(); // Update header
      } else {
        setMsg({ text: data.error || 'Update failed', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '2rem' }}>Settings</h2>

      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('profile')} 
          style={{ background: 'none', border: 'none', padding: '0 0 1rem 0', color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', borderBottom: activeTab === 'profile' ? '2px solid var(--accent)' : '2px solid transparent', fontSize: '1rem' }}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('billing')} 
          style={{ background: 'none', border: 'none', padding: '0 0 1rem 0', color: activeTab === 'billing' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: activeTab === 'billing' ? 'bold' : 'normal', borderBottom: activeTab === 'billing' ? '2px solid var(--accent)' : '2px solid transparent', fontSize: '1rem' }}
        >
          Billing & Subscription
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="card animate-fade-in">
          <h3 style={{ marginBottom: '1.5rem' }}>Personal Information</h3>
          
          {msg.text && (
            <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', backgroundColor: msg.type === 'error' ? 'rgba(255, 69, 58, 0.1)' : 'rgba(0, 224, 84, 0.1)', color: msg.type === 'error' ? 'var(--danger)' : 'var(--accent)' }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleUpdate} style={{ maxWidth: '400px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input required type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ position: 'relative' }} disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: '0.5rem' }}>Current Plan: <span className="text-accent">Pro Plan</span></h3>
                <p className="text-muted">You are currently on the Pro tier. Your next billing date is Oct 15, 2026.</p>
              </div>
              <div className="badge win" style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>Active</div>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => alert('Mock: Redirect to Stripe Portal')}>Manage Subscription</button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Billing History</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0' }}>Date</th>
                  <th style={{ padding: '0.75rem 0' }}>Description</th>
                  <th style={{ padding: '0.75rem 0' }}>Amount</th>
                  <th style={{ padding: '0.75rem 0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 0' }}>Sep 15, 2026</td>
                  <td style={{ padding: '1rem 0' }}>Pro Plan - Monthly</td>
                  <td style={{ padding: '1rem 0' }} className="mono">$49.00</td>
                  <td style={{ padding: '1rem 0' }}><span style={{ color: 'var(--text-muted)' }}>Paid</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '1rem 0' }}>Aug 15, 2026</td>
                  <td style={{ padding: '1rem 0' }}>Pro Plan - Monthly</td>
                  <td style={{ padding: '1rem 0' }} className="mono">$49.00</td>
                  <td style={{ padding: '1rem 0' }}><span style={{ color: 'var(--text-muted)' }}>Paid</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
