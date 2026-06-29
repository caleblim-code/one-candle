"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function PlaybooksClient({ initialPlaybooks }: { initialPlaybooks: any[] }) {
  const [playbooks, setPlaybooks] = useState(initialPlaybooks);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const initialForm = {
    name: '',
    description: '',
    entryCriteria: '',
    exitCriteria: '',
    riskRules: '',
    chartNotes: '',
    tags: ''
  };
  const [formData, setFormData] = useState(initialForm);

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
        setPlaybooks([{ ...newPlaybook, trades: [] }, ...playbooks]);
        setIsAdding(false);
        setFormData(initialForm);
      }
    } catch (err) {
      alert('Failed to create playbook');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this playbook?')) return;
    
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
          <h3 style={{ marginBottom: '1.5rem' }}>New Playbook Strategy</h3>
          <form onSubmit={handleAdd}>
            <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div className="form-group">
                  <label className="form-label">Strategy Name</label>
                  <input required type="text" className="form-input" style={!formData.name ? { borderColor: 'var(--danger)' } : {}} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Opening Drive Breakout" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Core Idea</label>
                  <textarea className="form-textarea" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What is the psychological edge behind this setup?"></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Entry Criteria (Checklist)</label>
                  <textarea className="form-textarea" rows={4} value={formData.entryCriteria} onChange={e => setFormData({...formData, entryCriteria: e.target.value})} placeholder="- Price above VWAP&#10;- Relative volume &gt; 2x&#10;- Clear 5min flag"></textarea>
                </div>
              </div>
              <div>
                <div className="form-group">
                  <label className="form-label">Exit Criteria (Profit Targets & Trailing)</label>
                  <textarea className="form-textarea" rows={3} value={formData.exitCriteria} onChange={e => setFormData({...formData, exitCriteria: e.target.value})} placeholder="- Take 50% off at 2R&#10;- Trail stop on remaining below 9EMA"></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Risk Rules (Stop Loss & Sizing)</label>
                  <textarea className="form-textarea" rows={3} value={formData.riskRules} onChange={e => setFormData({...formData, riskRules: e.target.value})} placeholder="- Max 1% account risk&#10;- Hard stop below entry candle low"></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (Comma separated)</label>
                  <input type="text" className="form-input" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="Trend, Morning, High-Conviction" />
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ position: 'relative', width: '200px' }} disabled={loading}>
                {loading ? <span className="spinner"></span> : null}
                {loading ? 'Saving...' : 'Save Playbook'}
              </button>
            </div>
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
          {playbooks.map(p => {
            const trades = p.trades || [];
            const wins = trades.filter((t: any) => (t.pnl || 0) > 0).length;
            const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : '0.0';
            
            let totalR = 0;
            let rCount = 0;
            trades.forEach((t: any) => {
              if (t.stopLoss && t.entryPrice && t.exitPrice) {
                let risk = 0, reward = 0;
                if (t.direction === 'Long') {
                  risk = t.entryPrice - t.stopLoss;
                  reward = t.exitPrice - t.entryPrice;
                } else {
                  risk = t.stopLoss - t.entryPrice;
                  reward = t.entryPrice - t.exitPrice;
                }
                if (risk > 0) {
                  totalR += reward / risk;
                  rCount++;
                }
              }
            });
            const avgR = rCount > 0 ? (totalR / rCount).toFixed(2) : '0.00';

            return (
              <Link href={`/playbooks/${p.id}`} key={p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card hover-scale" style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 150ms ease, box-shadow 150ms ease', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>{p.name}</h3>
                    <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }} onClick={(e) => handleDelete(p.id, e)}>Delete</button>
                  </div>
                  <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', flex: 1 }}>{p.description || 'No description'}</p>
                  
                  <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Trades</div>
                      <div className="mono fw-bold">{trades.length}</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Win Rate</div>
                      <div className="mono fw-bold" style={{ color: Number(winRate) >= 50 ? 'var(--accent)' : 'inherit' }}>{winRate}%</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Avg R</div>
                      <div className="mono fw-bold" style={{ color: Number(avgR) >= 1 ? 'var(--accent)' : 'inherit' }}>{avgR}R</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-scale:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
      `}} />
    </div>
  );
}
