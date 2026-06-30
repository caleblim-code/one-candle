"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { mutate } from 'swr';

export default function EditTradePage() {
  const params = useParams();
  const tradeId = params.id as string;
  const router = useRouter();

  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [setupTagsList, setSetupTagsList] = useState<string[]>(['Breakout', 'Pullback', 'Reversal']);
  const [mistakeTagsList, setMistakeTagsList] = useState<string[]>(['FOMO', 'Revenge Trading', 'Chasing', 'Hesitation']);
  const [defaultAsset, setDefaultAsset] = useState('Stocks');

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
    playbookId: '',
    accountId: '',
    mistakeTags: '',
    notes: '',
    brokerTradeId: '',
    pnl: ''
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [livePnl, setLivePnl] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/playbooks').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPlaybooks(data);
    }).catch(() => {});

    fetch('/api/accounts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setAccounts(data);
      }
    }).catch(() => {});
    
    fetch('/api/user/settings').then(r => r.json()).then(data => {
      if (data) {
        if (data.setupTags) setSetupTagsList(JSON.parse(data.setupTags));
        if (data.mistakeTags) setMistakeTagsList(JSON.parse(data.mistakeTags));
        if (data.defaultAsset) {
          setDefaultAsset(data.defaultAsset);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tradeId) {
      fetch(`/api/trades/${tradeId}`).then(r => r.json()).then(data => {
        if (data.success && data.trade) {
          const t = data.trade;
          setFormData({
            ticker: t.ticker || '',
            assetClass: t.assetClass || 'Stocks',
            direction: t.direction || 'Long',
            entryPrice: t.entryPrice?.toString() || '',
            exitPrice: t.exitPrice?.toString() || '',
            positionSize: t.positionSize?.toString() || '',
            entryDate: t.entryDate ? new Date(t.entryDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            exitDate: t.exitDate ? new Date(t.exitDate).toISOString().slice(0, 16) : '',
            stopLoss: t.stopLoss?.toString() || '',
            takeProfit: t.takeProfit?.toString() || '',
            fees: t.fees?.toString() || '0',
            status: t.status || 'Closed',
            setupTag: t.setupTag || '',
            playbookId: t.playbookId || '',
            accountId: t.accountId || '',
            mistakeTags: t.mistakeTags || '',
            notes: t.notes || '',
            brokerTradeId: t.brokerTradeId || '',
            pnl: t.pnl?.toString() || ''
          });
        }
      }).catch(err => setError('Failed to load trade'));
    }
  }, [tradeId]);

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

  const isInvalidSL = useMemo(() => {
    if (formData.status !== 'Closed') return false;
    if (!formData.stopLoss) return true;
    if (formData.entryPrice) {
      const entry = parseFloat(formData.entryPrice);
      const sl = parseFloat(formData.stopLoss);
      if (!isNaN(entry) && !isNaN(sl)) {
        if (formData.direction === 'Long' && sl >= entry) return true;
        if (formData.direction === 'Short' && sl <= entry) return true;
      }
    }
    return false;
  }, [formData.status, formData.stopLoss, formData.entryPrice, formData.direction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!formData.ticker.trim()) errors.ticker = 'Ticker is required';
    if (!formData.entryPrice) errors.entryPrice = 'Entry price is required';
    if (!formData.positionSize) errors.positionSize = 'Position size is required';
    if (!formData.entryDate) errors.entryDate = 'Entry date is required';
    if (!formData.accountId) errors.accountId = 'Please select a trading account';
    if (formData.status === 'Closed') {
      if (!formData.exitPrice) errors.exitPrice = 'Exit price is required for closed trades';
      if (!formData.exitDate) errors.exitDate = 'Exit date is required for closed trades';
      if (!formData.pnl && livePnl === null && !formData.exitPrice) errors.pnl = 'P&L is required when exit price is missing';
      
      // Stop Loss Validation for Closed Trades
      if (!formData.stopLoss) {
        errors.stopLoss = 'Stop Loss is required. Please enter your initial Stop Loss.';
      } else if (formData.entryPrice) {
        const entry = parseFloat(formData.entryPrice);
        const sl = parseFloat(formData.stopLoss);
        if (!isNaN(entry) && !isNaN(sl)) {
          if (formData.direction === 'Long' && sl >= entry) {
            errors.stopLoss = 'Invalid SL: Stop Loss for a Long trade must be below Entry Price. Please enter your INITIAL Stop Loss, not a Breakeven stop.';
          } else if (formData.direction === 'Short' && sl <= entry) {
            errors.stopLoss = 'Invalid SL: Stop Loss for a Short trade must be above Entry Price. Please enter your INITIAL Stop Loss, not a Breakeven stop.';
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fill in all required fields highlighted below.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pnl: formData.pnl ? parseFloat(formData.pnl) : (livePnl !== null ? livePnl : null),
          entryDate: new Date(formData.entryDate).toISOString(),
          exitPrice: formData.status === 'Open' ? null : formData.exitPrice,
          exitDate: formData.status === 'Open' || !formData.exitDate ? null : new Date(formData.exitDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.trade) {
        // Handle images logic here if needed for edits in future
        mutate(key => typeof key === 'string' && (key.startsWith('/api/trades') || key.startsWith('/api/analytics')), undefined, { revalidate: true });
        router.refresh();
        router.push('/journal');
      } else {
        setError(data.error || 'Failed to update trade');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Edit Trade</h2>
      </div>
      
      {error && <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      <div className="trade-grid">
      <div className="card animate-fade-in" style={{ padding: '2rem' }}>
        <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0, opacity: loading ? 0.6 : 1, transition: 'opacity 150ms ease' }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Trading Account</label>
              <select name="accountId" className="form-select" value={formData.accountId} onChange={handleChange} required>
                <option value="" disabled>Select an account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ticker / Symbol</label>
              <input required type="text" name="ticker" className="form-input" value={formData.ticker} onChange={handleChange} placeholder="e.g. AAPL" />
            </div>
            <div className="form-group">
              <label className="form-label">Broker Trade ID (Optional)</label>
              <input type="text" name="brokerTradeId" className="form-input" value={formData.brokerTradeId} onChange={handleChange} placeholder="e.g. #352254083" />
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
          <div className="grid-responsive-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Entry Price</label>
              <input required type="number" step="any" name="entryPrice" className="form-input mono" style={!formData.entryPrice ? { borderColor: 'var(--danger)' } : {}} value={formData.entryPrice} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Position Size (Shares / Lots)</label>
              <input required type="number" step="any" name="positionSize" className="form-input mono" style={!formData.positionSize ? { borderColor: 'var(--danger)' } : {}} value={formData.positionSize} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Fees / Swap</label>
              <input type="number" step="any" name="fees" className="form-input mono" value={formData.fees} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Realized P&L ($)</label>
              <input type="number" step="any" name="pnl" className="form-input mono" value={formData.pnl} onChange={handleChange} placeholder={livePnl !== null ? `Auto-calculated: $${livePnl.toFixed(2)}` : "e.g. 43.10"} />
              <span className="text-muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Leave blank to use auto-calculated P&L.
              </span>
            </div>

            {formData.status === 'Closed' && (
              <div className="form-group">
                <label className="form-label">Exit Price</label>
                <input required type="number" step="any" name="exitPrice" className="form-input mono" style={formData.status === 'Closed' && !formData.exitPrice ? { borderColor: 'var(--danger)' } : {}} value={formData.exitPrice} onChange={handleChange} />
              </div>
            )}
              <div className="form-group">
                <label className="form-label">Stop Loss</label>
                <input type="number" step="any" name="stopLoss" className="form-input mono" value={formData.stopLoss} onChange={handleChange} style={isInvalidSL ? { borderColor: 'var(--warning, #f59e0b)' } : {}} />
              </div>
              <div className="form-group">
                <label className="form-label">Take Profit (Optional)</label>
                <input type="number" step="any" name="takeProfit" className="form-input mono" value={formData.takeProfit} onChange={handleChange} />
              </div>
            </div>

            {/* SL reminder for BE or missing SL */}
            {isInvalidSL && (
              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '0.75rem 1rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span><strong>Invalid or Missing Initial Stop Loss.</strong> It looks like this Stop Loss is missing or was moved to Breakeven/Profit. Please enter your <em>original initial</em> Stop Loss to ensure Avg R-Multiple and Risk/Reward stats are accurate.</span>
              </div>
            )}

            <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Journaling</h3>
          <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Setup Tag</label>
              <select name="setupTag" className="form-select" value={formData.setupTag} onChange={handleChange}>
                <option value="">None</option>
                {setupTagsList.map(tag => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Playbook</label>
              <select name="playbookId" className="form-select" value={formData.playbookId} onChange={handleChange}>
                <option value="">No Playbook</option>
                {playbooks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Mistake Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {mistakeTagsList.map(tag => {
                const isSelected = formData.mistakeTags.includes(tag);
                return (
                  <button 
                    key={tag} 
                    type="button"
                    onClick={() => {
                      let currentTags = formData.mistakeTags ? formData.mistakeTags.split(',').map(s => s.trim()).filter(Boolean) : [];
                      if (currentTags.includes(tag)) {
                        currentTags = currentTags.filter(t => t !== tag);
                      } else {
                        currentTags.push(tag);
                      }
                      setFormData({ ...formData, mistakeTags: currentTags.join(', ') });
                    }}
                    className="badge"
                    style={{ 
                      border: isSelected ? '1px solid var(--danger)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-light)',
                      color: isSelected ? 'var(--danger)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.9rem'
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea name="notes" className="form-textarea" value={formData.notes} onChange={handleChange} placeholder="What was your reasoning? How did you feel?"></textarea>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ position: 'relative' }} disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        </fieldset>
      </div>

      {/* Live P&L Sidebar */}
      <div>
        <div className="card" style={{ position: 'sticky', top: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Live Preview</h3>
          
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-muted">Net P&L</span>
            {(() => {
              const displayPnl = formData.pnl ? parseFloat(formData.pnl) : livePnl;
              return (
                <span className={`mono ${displayPnl === null ? '' : displayPnl >= 0 ? 'text-accent' : 'text-danger'}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {displayPnl === null ? '--' : `${displayPnl >= 0 ? '+' : ''}$${displayPnl.toFixed(2)}`}
                </span>
              );
            })()}
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
      <style jsx>{`
        .trade-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 2rem;
        }
        @media (max-width: 768px) {
          .trade-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
