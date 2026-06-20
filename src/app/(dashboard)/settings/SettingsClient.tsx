"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsClient({ user }: { user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    timezone: user.timezone || 'UTC',
    currency: user.currency || 'USD',
    defaultAsset: user.defaultAsset || 'Stocks',
    startingBalance: user.startingBalance || 0,
  });

  const [accounts, setAccounts] = useState<any[]>([]);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'Live Personal', balance: 0 });

  // Fetch accounts on load
  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAccounts(data);
    });
  }, []);

  const [setupTags, setSetupTags] = useState<string[]>(user.setupTags ? JSON.parse(user.setupTags) : ['Breakout', 'Pullback', 'Reversal']);
  const [mistakeTags, setMistakeTags] = useState<string[]>(user.mistakeTags ? JSON.parse(user.mistakeTags) : ['FOMO', 'Revenge Trading', 'Chasing', 'Hesitation']);
  const [newSetupTag, setNewSetupTag] = useState('');
  const [newMistakeTag, setNewMistakeTag] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleUpdate = async (e?: React.FormEvent, customData?: any) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    const payload = customData || {
      ...formData,
      setupTags: JSON.stringify(setupTags),
      mistakeTags: JSON.stringify(mistakeTags)
    };

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: 'Settings updated successfully', type: 'success' });
        router.refresh();
      } else {
        setMsg({ text: data.error || 'Update failed', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  const addSetupTag = () => {
    if (!newSetupTag.trim() || setupTags.includes(newSetupTag.trim())) return;
    const newTags = [...setupTags, newSetupTag.trim()];
    setSetupTags(newTags);
    setNewSetupTag('');
    handleUpdate(undefined, { ...formData, setupTags: JSON.stringify(newTags), mistakeTags: JSON.stringify(mistakeTags) });
  };

  const removeSetupTag = (tag: string) => {
    const newTags = setupTags.filter(t => t !== tag);
    setSetupTags(newTags);
    handleUpdate(undefined, { ...formData, setupTags: JSON.stringify(newTags), mistakeTags: JSON.stringify(mistakeTags) });
  };

  const addMistakeTag = () => {
    if (!newMistakeTag.trim() || mistakeTags.includes(newMistakeTag.trim())) return;
    const newTags = [...mistakeTags, newMistakeTag.trim()];
    setMistakeTags(newTags);
    setNewMistakeTag('');
    handleUpdate(undefined, { ...formData, setupTags: JSON.stringify(setupTags), mistakeTags: JSON.stringify(newTags) });
  };

  const removeMistakeTag = (tag: string) => {
    const newTags = mistakeTags.filter(t => t !== tag);
    setMistakeTags(newTags);
    handleUpdate(undefined, { ...formData, setupTags: JSON.stringify(setupTags), mistakeTags: JSON.stringify(newTags) });
  };

  const tabStyle = (tab: string) => ({
    background: 'none', 
    border: 'none', 
    padding: '0 0 1rem 0', 
    color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)', 
    fontWeight: activeTab === tab ? 'bold' : 'normal', 
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent', 
    fontSize: '1rem',
    cursor: 'pointer'
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <h2 style={{ marginBottom: '2rem' }}>Settings</h2>

      {msg.text && (
        <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '2rem', backgroundColor: msg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 210, 75, 0.1)', color: msg.type === 'error' ? 'var(--danger)' : 'var(--accent)', border: `1px solid ${msg.type === 'error' ? 'var(--danger)' : 'var(--accent)'}` }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('profile')} style={tabStyle('profile')}>Profile</button>
        <button onClick={() => setActiveTab('accounts')} style={tabStyle('accounts')}>Portfolios</button>
        <button onClick={() => setActiveTab('preferences')} style={tabStyle('preferences')}>Trading Preferences</button>
        <button onClick={() => setActiveTab('tags')} style={tabStyle('tags')}>Tags Management</button>
        <button onClick={() => setActiveTab('security')} style={tabStyle('security')}>Account & Security</button>
      </div>

      {activeTab === 'profile' && (
        <div className="card animate-fade-in">
          <h3 style={{ marginBottom: '1.5rem' }}>Personal Information</h3>
          <form onSubmit={handleUpdate} style={{ maxWidth: '400px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input required type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-select" value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})}>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="EST">EST (Eastern Standard Time)</option>
                <option value="CST">CST (Central Standard Time)</option>
                <option value="PST">PST (Pacific Standard Time)</option>
                <option value="GMT">GMT (Greenwich Mean Time)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '0.5rem' }}>Your Trading Portfolios</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Create and manage multiple accounts. Your dashboard and journal can be filtered by these accounts.</p>
            
            {accounts.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0' }}>Account Name</th>
                    <th style={{ padding: '0.75rem 0' }}>Type</th>
                    <th style={{ padding: '0.75rem 0' }}>Starting Balance</th>
                    <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Default</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(acc => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{acc.name}</td>
                      <td style={{ padding: '1rem 0' }}><span className="badge">{acc.type}</span></td>
                      <td style={{ padding: '1rem 0' }} className="mono">${acc.balance.toFixed(2)}</td>
                      <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                        {acc.isDefault ? (
                          <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                        ) : (
                          <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Set Default</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--surface-light)', borderRadius: '8px', marginBottom: '2rem' }}>
                <p className="text-muted">No accounts created yet.</p>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Add New Account</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Name (e.g. Apex 50k)</label>
                  <input type="text" className="form-input" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Type</label>
                  <select className="form-select" value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value})}>
                    <option>Live Personal</option>
                    <option>Demo / Paper</option>
                    <option>Prop Firm Challenge</option>
                    <option>Prop Firm Funded</option>
                    <option>IRA</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Starting Balance</label>
                  <input type="number" className="form-input" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: parseFloat(e.target.value) || 0})} />
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={async () => {
                    if (!newAccount.name) return;
                    setLoading(true);
                    const res = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAccount) });
                    if (res.ok) {
                      const acc = await res.json();
                      setAccounts([...accounts, acc]);
                      setNewAccount({ name: '', type: 'Live Personal', balance: 0 });
                    }
                    setLoading(false);
                  }}
                  disabled={loading || !newAccount.name}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="card animate-fade-in">
          <h3 style={{ marginBottom: '1.5rem' }}>Trading Preferences</h3>
          <form onSubmit={handleUpdate} style={{ maxWidth: '400px' }}>
            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <select className="form-select" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Asset Class</label>
              <select className="form-select" value={formData.defaultAsset} onChange={e => setFormData({...formData, defaultAsset: e.target.value})}>
                <option value="Stocks">Stocks</option>
                <option value="Options">Options</option>
                <option value="Futures">Futures</option>
                <option value="Crypto">Crypto</option>
                <option value="Forex">Forex</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Starting Account Balance</label>
              <input type="number" step="0.01" className="form-input" value={formData.startingBalance} onChange={e => setFormData({...formData, startingBalance: parseFloat(e.target.value) || 0})} />
              <small className="text-muted" style={{ marginTop: '0.5rem', display: 'block' }}>Used to calculate portfolio growth and % returns.</small>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '0.5rem' }}>Setup Tags</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Tags used to identify your specific trading strategies or setups.</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input type="text" className="form-input" placeholder="New setup tag..." value={newSetupTag} onChange={e => setNewSetupTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSetupTag()} />
              <button className="btn btn-primary" onClick={addSetupTag} style={{ padding: '0.5rem 1rem' }}>Add</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {setupTags.map(tag => (
                <div key={tag} className="badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}>
                  {tag}
                  <button onClick={() => removeSetupTag(tag)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>
                </div>
              ))}
              {setupTags.length === 0 && <span className="text-muted">No setup tags yet.</span>}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.5rem' }}>Mistake Tags</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Tags used to track psychological or execution errors.</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input type="text" className="form-input" placeholder="New mistake tag..." value={newMistakeTag} onChange={e => setNewMistakeTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMistakeTag()} />
              <button className="btn btn-danger" onClick={addMistakeTag} style={{ padding: '0.5rem 1rem', color: 'white', backgroundColor: 'var(--danger)' }}>Add</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {mistakeTags.map(tag => (
                <div key={tag} className="badge loss" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}>
                  {tag}
                  <button onClick={() => removeMistakeTag(tag)} style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.7, cursor: 'pointer' }}>&times;</button>
                </div>
              ))}
              {mistakeTags.length === 0 && <span className="text-muted">No mistake tags yet.</span>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>
            <form style={{ maxWidth: '400px' }} onSubmit={(e) => { e.preventDefault(); alert('Password change mockup successful'); }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input required type="password" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input required type="password" className="form-input" />
              </div>
              <button type="submit" className="btn btn-ghost">Update Password</button>
            </form>
          </div>

          <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--danger)' }}>Danger Zone</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
            <button className="btn btn-danger" onClick={() => {
              if (confirm('Are you absolutely sure? This will delete all your trades and playbooks.')) {
                alert('Account deletion initiated (Mock)');
              }
            }}>Delete Account</button>
          </div>
        </div>
      )}

    </div>
  );
}
