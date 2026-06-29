"use client";

import { useState, useMemo, useEffect } from 'react';

export default function DailyNotesClient({ initialJournals, initialTrades }: { initialJournals: any[], initialTrades: any[] }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [journals, setJournals] = useState(initialJournals);
  const [content, setContent] = useState('');
  const [mentalState, setMentalState] = useState('');
  const [saving, setSaving] = useState(false);

  // Load existing journal for the selected date
  useEffect(() => {
    const existing = journals.find(j => j.date === selectedDate);
    if (existing) {
      setContent(existing.content || '');
      setMentalState(existing.mentalState || '');
    } else {
      setContent('');
      setMentalState('');
    }
  }, [selectedDate, journals]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/daily-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, content, mentalState })
      });
      if (res.ok) {
        const saved = await res.json();
        setJournals(prev => {
          const filtered = prev.filter(j => j.id !== saved.id);
          return [saved, ...filtered];
        });
      }
    } catch (err) {
      alert('Failed to save journal');
    } finally {
      setSaving(false);
    }
  };

  const dayTrades = useMemo(() => {
    return initialTrades.filter(t => new Date(t.entryDate).toISOString().startsWith(selectedDate));
  }, [initialTrades, selectedDate]);

  const dayPnl = dayTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Daily Notes & Reflection</h2>
        <input 
          type="date" 
          className="form-input" 
          style={{ width: 'auto' }} 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
        />
      </div>

      <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Editor Side */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Reflection for {selectedDate}</h3>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Mental State Tags</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Calm, Disciplined, Tilted, FOMO" 
              value={mentalState} 
              onChange={e => setMentalState(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label className="form-label">Journal Entry</label>
            <textarea 
              className="form-textarea" 
              style={{ flex: 1, minHeight: '400px', fontSize: '1rem', lineHeight: '1.6', fontFamily: 'var(--font-sans)' }} 
              placeholder="How were the market conditions? Did you follow your rules? What did you learn today?" 
              value={content} 
              onChange={e => setContent(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Day's Trades Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Daily Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem' }}>Net P&L</span>
              <span className={`mono fw-bold ${dayPnl >= 0 ? 'text-accent' : 'text-danger'}`} style={{ fontSize: '1.5rem' }}>
                {dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span className="text-muted">Trades Taken</span>
              <span className="mono fw-bold">{dayTrades.length}</span>
            </div>
          </div>

          <div className="card" style={{ flex: 1, overflowY: 'auto', maxHeight: '600px' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Trades ({dayTrades.length})</h4>
            
            {dayTrades.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>No trades logged on this date.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dayTrades.map(t => (
                  <div key={t.id} style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="mono fw-bold">{t.ticker.toUpperCase()}</span>
                      <span className={`mono fw-bold ${t.pnl >= 0 ? 'text-accent' : 'text-danger'}`}>
                        {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : 'Open'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <span className={`badge ${t.direction === 'Long' ? 'win' : 'loss'}`}>{t.direction}</span>
                      {t.setupTag && <span className="badge" style={{ backgroundColor: 'var(--bg-color)' }}>{t.setupTag}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
