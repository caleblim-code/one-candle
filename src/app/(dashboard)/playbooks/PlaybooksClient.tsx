"use client";

import { useState } from 'react';

export default function PlaybooksClient({ initialPlaybooks }: { initialPlaybooks: any[] }) {
  const [playbooks, setPlaybooks] = useState(initialPlaybooks);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', rules: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newPlaybook = await res.json();
        setPlaybooks([newPlaybook, ...playbooks]);
        setIsAdding(false);
        setFormData({ name: '', description: '', rules: '' });
      }
    } catch (err) {
      alert('Failed to create playbook');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI
    const previous = [...playbooks];
    setPlaybooks(playbooks.filter(p => p.id !== id));
    
    try {
      const res = await fetch(`/api/playbooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (err) {
      alert('Failed to delete playbook');
      setPlaybooks(previous);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Playbooks</h2>
        <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : 'Create Playbook'}
        </button>
      </div>

      {isAdding && (
        <div className="card animate-slide-up" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>New Playbook</h3>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Setup Name</label>
              <input required type="text" className="form-input" style={!formData.name ? { borderColor: 'var(--danger)' } : {}} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Opening Drive Breakout" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Briefly describe the setup condition" />
            </div>
            <div className="form-group">
              <label className="form-label">Checklist / Rules</label>
              <textarea className="form-textarea" value={formData.rules} onChange={e => setFormData({...formData, rules: e.target.value})} placeholder="- Price must be above VWAP&#10;- Volume &gt; 1M in first 5 mins&#10;- Tight stop below entry candle"></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ position: 'relative' }} disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Saving...' : 'Save Playbook'}
            </button>
          </form>
        </div>
      )}

      {playbooks.length === 0 && !isAdding ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <h2 style={{ marginBottom: '1rem' }}>No Playbooks</h2>
          <p className="text-muted">Define your setups and rules to build consistency.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {playbooks.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>{p.name}</h3>
                <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleDelete(p.id)}>Delete</button>
              </div>
              <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>{p.description || 'No description'}</p>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Rules & Checklist</h4>
                <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  {p.rules || 'No rules defined.'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
