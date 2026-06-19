"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddTradePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ticker: '',
    assetClass: 'Stocks',
    direction: 'Long',
    entryPrice: '',
    exitPrice: '',
    positionSize: '',
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: '',
    stopLoss: '',
    takeProfit: '',
    fees: '0',
    status: 'Closed',
    setupTag: '',
    mistakeTags: '',
    notes: ''
  });
  
  const [livePnl, setLivePnl] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Live P&L Calc
  useEffect(() => {
    if (formData.entryPrice && formData.exitPrice && formData.positionSize) {
      const entry = parseFloat(formData.entryPrice);
      const exit = parseFloat(formData.exitPrice);
      const size = parseFloat(formData.positionSize);
      const fees = parseFloat(formData.fees || '0');
      
      let pnl = 0;
      if (formData.direction === 'Long') {
        pnl = (exit - entry) * size - fees;
      } else {
        pnl = (entry - exit) * size - fees;
      }
      setLivePnl(pnl);
    } else {
      setLivePnl(null);
    }
  }, [formData.entryPrice, formData.exitPrice, formData.positionSize, formData.fees, formData.direction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pnl: livePnl,
          // If status is Open, we clear exit price
          exitPrice: formData.status === 'Open' ? null : formData.exitPrice,
          exitDate: formData.status === 'Open' ? null : formData.exitDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/journal');
      } else {
        setError(data.error || 'Failed to add trade');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Add Trade</h2>
      
      {error && <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Ticker / Symbol</label>
                <input required type="text" name="ticker" className="form-input" value={formData.ticker} onChange={handleChange} placeholder="e.g. AAPL" />
              </div>
              <div className="form-group">
                <label className="form-label">Asset Class</label>
                <select name="assetClass" className="form-select" value={formData.assetClass} onChange={handleChange}>
                  <option>Stocks</option>
                  <option>Options</option>
                  <option>Forex</option>
                  <option>Futures</option>
                  <option>Crypto</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Direction</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setFormData({...formData, direction: 'Long'})} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: formData.direction === 'Long' ? '1px solid var(--accent)' : '1px solid var(--border)', backgroundColor: formData.direction === 'Long' ? 'rgba(0, 224, 84, 0.1)' : 'transparent', color: formData.direction === 'Long' ? 'var(--accent)' : 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>Long</button>
                  <button type="button" onClick={() => setFormData({...formData, direction: 'Short'})} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: formData.direction === 'Short' ? '1px solid var(--danger)' : '1px solid var(--border)', backgroundColor: formData.direction === 'Short' ? 'rgba(255, 69, 58, 0.1)' : 'transparent', color: formData.direction === 'Short' ? 'var(--danger)' : 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>Short</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
                  <option>Open</option>
                  <option>Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Entry Date & Time</label>
                <input required type="datetime-local" name="entryDate" className="form-input" value={formData.entryDate} onChange={handleChange} />
              </div>

              {formData.status === 'Closed' && (
                <div className="form-group">
                  <label className="form-label">Exit Date & Time</label>
                  <input required type="datetime-local" name="exitDate" className="form-input" value={formData.exitDate} onChange={handleChange} />
                </div>
              )}
            </div>

            <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Pricing & Execution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Entry Price</label>
                <input required type="number" step="any" name="entryPrice" className="form-input mono" value={formData.entryPrice} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Position Size</label>
                <input required type="number" step="any" name="positionSize" className="form-input mono" value={formData.positionSize} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Fees / Commissions</label>
                <input type="number" step="any" name="fees" className="form-input mono" value={formData.fees} onChange={handleChange} />
              </div>
              
              {formData.status === 'Closed' && (
                <div className="form-group">
                  <label className="form-label">Exit Price</label>
                  <input required type="number" step="any" name="exitPrice" className="form-input mono" value={formData.exitPrice} onChange={handleChange} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Stop Loss (Optional)</label>
                <input type="number" step="any" name="stopLoss" className="form-input mono" value={formData.stopLoss} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Take Profit (Optional)</label>
                <input type="number" step="any" name="takeProfit" className="form-input mono" value={formData.takeProfit} onChange={handleChange} />
              </div>
            </div>

            <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Journaling</h3>
            <div className="form-group">
              <label className="form-label">Setup Tag</label>
              <input type="text" name="setupTag" className="form-input" value={formData.setupTag} onChange={handleChange} placeholder="e.g. Breakout, Reversal" />
            </div>
            <div className="form-group">
              <label className="form-label">Mistake Tags (Comma separated)</label>
              <input type="text" name="mistakeTags" className="form-input" value={formData.mistakeTags} onChange={handleChange} placeholder="e.g. FOMO, Hesitation" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea name="notes" className="form-textarea" value={formData.notes} onChange={handleChange} placeholder="What was your reasoning? How did you feel?"></textarea>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Trade'}
              </button>
            </div>
          </form>
        </div>

        {/* Live P&L Sidebar */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Live Preview</h3>
            
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Net P&L</span>
              <span className={`mono ${livePnl === null ? '' : livePnl >= 0 ? 'text-accent' : 'text-danger'}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {livePnl === null ? '--' : `${livePnl >= 0 ? '+' : ''}$${livePnl.toFixed(2)}`}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '1.5rem 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span className="text-muted">Ticker</span>
              <span className="mono">{formData.ticker.toUpperCase() || '--'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span className="text-muted">Direction</span>
              <span>{formData.direction}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span className="text-muted">Status</span>
              <span className={formData.status === 'Open' ? 'text-accent' : ''}>{formData.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
