"use client";

import { useState, useEffect, Fragment } from 'react';
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
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountData, setEditingAccountData] = useState<any>(null);
  
  const [editingRulesFor, setEditingRulesFor] = useState<string | null>(null);
  const [rulesFormData, setRulesFormData] = useState<any>({
    firmName: 'Apex', maxDailyLoss: 2500, maxTotalDrawdown: 3000, profitTarget: 3000, trailingDrawdown: true, minTradingDays: 7
  });

  const PRESETS = {
    'Apex 50k': { firmName: 'Apex', maxDailyLoss: 2500, maxTotalDrawdown: 3000, profitTarget: 3000, trailingDrawdown: true, minTradingDays: 7 },
    'TopStep 50k': { firmName: 'TopStep', maxDailyLoss: 1000, maxTotalDrawdown: 2000, profitTarget: 3000, trailingDrawdown: false, minTradingDays: 5 },
    'FTMO 100k': { firmName: 'FTMO', maxDailyLoss: 5000, maxTotalDrawdown: 10000, profitTarget: 10000, trailingDrawdown: false, minTradingDays: 4 },
  };

  const loadRules = async (accountId: string) => {
    setEditingRulesFor(accountId);
    const res = await fetch(`/api/accounts/${accountId}/rules`);
    if (res.ok) {
      const data = await res.json();
      if (data) setRulesFormData(data);
    }
  };

  const saveRules = async () => {
    if (!editingRulesFor) return;
    setLoading(true);
    const res = await fetch(`/api/accounts/${editingRulesFor}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rulesFormData)
    });
    if (res.ok) {
      setMsg({ text: 'Prop firm rules saved successfully', type: 'success' });
      setEditingRulesFor(null);
    }
    setLoading(false);
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

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

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true })
    });
    if (res.ok) {
      setAccounts(accounts.map(a => ({ ...a, isDefault: a.id === id })));
    }
    setLoading(false);
  };

  const handleEditAccount = (acc: any) => {
    setEditingAccountId(acc.id);
    setEditingAccountData({ name: acc.name, type: acc.type, balance: acc.balance });
  };

  const handleSaveAccount = async () => {
    if (!editingAccountId) return;
    setLoading(true);
    const res = await fetch(`/api/accounts/${editingAccountId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingAccountData)
    });
    if (res.ok) {
      const updated = await res.json();
      setAccounts(accounts.map(a => a.id === editingAccountId ? updated : a));
      setEditingAccountId(null);
    }
    setLoading(false);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account? All associated trades will also be deleted!')) return;
    setLoading(true);
    const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const refetch = await fetch('/api/accounts').then(r => r.json());
      setAccounts(Array.isArray(refetch) ? refetch : []);
    }
    setLoading(false);
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
        <button onClick={() => setActiveTab('export')} style={tabStyle('export')}>Export Data</button>
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
                    <Fragment key={acc.id}>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>
                          {editingAccountId === acc.id ? (
                            <input type="text" className="form-input" style={{ padding: '0.25rem', fontSize: '0.9rem' }} value={editingAccountData.name} onChange={e => setEditingAccountData({...editingAccountData, name: e.target.value})} />
                          ) : acc.name}
                        </td>
                        <td style={{ padding: '1rem 0' }}>
                          {editingAccountId === acc.id ? (
                            <select className="form-select" style={{ padding: '0.25rem', fontSize: '0.9rem' }} value={editingAccountData.type} onChange={e => setEditingAccountData({...editingAccountData, type: e.target.value})}>
                              <option>Live Personal</option>
                              <option>Demo / Paper</option>
                              <option>Prop Firm Challenge</option>
                              <option>Prop Firm Funded</option>
                              <option>IRA</option>
                            </select>
                          ) : (
                            <span className="badge">{acc.type}</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 0' }} className="mono">
                          {editingAccountId === acc.id ? (
                            <input type="number" className="form-input mono" style={{ padding: '0.25rem', fontSize: '0.9rem', width: '100px' }} value={editingAccountData.balance} onChange={e => setEditingAccountData({...editingAccountData, balance: parseFloat(e.target.value) || 0})} />
                          ) : (
                            `$${acc.balance.toFixed(2)}`
                          )}
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                          {editingAccountId === acc.id ? (
                            <>
                              <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={handleSaveAccount} disabled={loading}>Save</button>
                              <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setEditingAccountId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              {acc.type.includes('Prop Firm') && (
                                <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--accent)' }} onClick={() => loadRules(acc.id)}>Configure Rules</button>
                              )}
                              <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleEditAccount(acc)}>Edit</button>
                              <button className="btn btn-ghost text-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDeleteAccount(acc.id)}>Delete</button>
                              {acc.isDefault ? (
                                <span style={{ color: 'var(--accent)', fontWeight: 'bold', display: 'inline-block', width: '80px', textAlign: 'center' }}>✓ Default</span>
                              ) : (
                                <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '80px' }} onClick={() => handleSetDefault(acc.id)} disabled={loading}>Set Default</button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                      {editingRulesFor === acc.id && (
                        <tr key={`rules-${acc.id}`}>
                          <td colSpan={4} style={{ padding: '1rem', backgroundColor: 'var(--surface-light)', borderBottom: '1px solid var(--border)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Configure Prop Firm Rules for {acc.name}</h4>
                            <div style={{ marginBottom: '1rem' }}>
                              <label className="text-muted" style={{ fontSize: '0.8rem', marginRight: '1rem' }}>Presets:</label>
                              {Object.entries(PRESETS).map(([name, preset]) => (
                                <button key={name} type="button" className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.5rem', border: '1px solid var(--border)' }} onClick={() => setRulesFormData(preset)}>{name}</button>
                              ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Firm Name</label>
                                <input type="text" className="form-input" value={rulesFormData.firmName || ''} onChange={e => setRulesFormData({...rulesFormData, firmName: e.target.value})} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Max Daily Loss ($)</label>
                                <input type="number" className="form-input" value={rulesFormData.maxDailyLoss || 0} onChange={e => setRulesFormData({...rulesFormData, maxDailyLoss: parseFloat(e.target.value)})} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Max Drawdown ($)</label>
                                <input type="number" className="form-input" value={rulesFormData.maxTotalDrawdown || 0} onChange={e => setRulesFormData({...rulesFormData, maxTotalDrawdown: parseFloat(e.target.value)})} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Profit Target ($)</label>
                                <input type="number" className="form-input" value={rulesFormData.profitTarget || 0} onChange={e => setRulesFormData({...rulesFormData, profitTarget: parseFloat(e.target.value)})} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Min Trading Days</label>
                                <input type="number" className="form-input" value={rulesFormData.minTradingDays || 0} onChange={e => setRulesFormData({...rulesFormData, minTradingDays: parseInt(e.target.value, 10)})} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
                                <input type="checkbox" id="trailingDrawdown" checked={rulesFormData.trailingDrawdown || false} onChange={e => setRulesFormData({...rulesFormData, trailingDrawdown: e.target.checked})} />
                                <label htmlFor="trailingDrawdown" className="form-label" style={{ marginBottom: 0 }}>Trailing Drawdown?</label>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <button className="btn btn-primary" onClick={saveRules} disabled={loading}>{loading ? 'Saving...' : 'Save Rules'}</button>
                              <button className="btn btn-ghost" onClick={() => setEditingRulesFor(null)}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

      {activeTab === 'export' && (
        <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '0.5rem' }}>Export My Data</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Download all of your trade data as a CSV or JSON file. This export includes every trade across all accounts, with full details including entry/exit dates, prices, P&L, setup tags, mistakes, playbook, and journal notes.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* CSV Export */}
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface-light)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'rgba(0, 210, 75, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>CSV Format</h4>
                  <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>Spreadsheet-compatible. Opens in Excel, Google Sheets, etc.</p>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={loading}
                  onClick={() => {
                    setLoading(true);
                    setMsg({ text: 'Preparing CSV export...', type: 'success' });
                    fetch('/api/user/export?format=csv')
                      .then(res => {
                        if (!res.ok) throw new Error('Export failed');
                        return res.blob();
                      })
                      .then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `onecandle_export_${new Date().toISOString().slice(0, 10)}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setMsg({ text: 'CSV downloaded successfully!', type: 'success' });
                      })
                      .catch(() => setMsg({ text: 'Export failed. Please try again.', type: 'error' }))
                      .finally(() => { setLoading(false); setTimeout(() => setMsg({ text: '', type: '' }), 3000); });
                  }}
                >
                  {loading ? <span className="spinner"></span> : null}
                  Download CSV
                </button>
              </div>

              {/* JSON Export */}
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface-light)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>JSON Format</h4>
                  <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>Machine-readable. Useful for backups or importing into other tools.</p>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', border: '1px solid var(--border)' }}
                  disabled={loading}
                  onClick={() => {
                    setLoading(true);
                    setMsg({ text: 'Preparing JSON export...', type: 'success' });
                    fetch('/api/user/export?format=json')
                      .then(res => {
                        if (!res.ok) throw new Error('Export failed');
                        return res.blob();
                      })
                      .then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `onecandle_export_${new Date().toISOString().slice(0, 10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setMsg({ text: 'JSON downloaded successfully!', type: 'success' });
                      })
                      .catch(() => setMsg({ text: 'Export failed. Please try again.', type: 'error' }))
                      .finally(() => { setLoading(false); setTimeout(() => setMsg({ text: '', type: '' }), 3000); });
                  }}
                >
                  {loading ? <span className="spinner"></span> : null}
                  Download JSON
                </button>
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--surface-light)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                <strong style={{ color: 'var(--text-color)' }}>What's included:</strong> All trades across every account — ticker, direction, asset class, entry/exit dates & prices, position size, stop loss, take profit, fees, P&L, status, setup tags, mistakes, playbook, and journal notes.
              </p>
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
