"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CsvImport from './CsvImport';
import ImageImport from './ImageImport';

export default function AddTradePage() {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [setupTagsList, setSetupTagsList] = useState<string[]>(['Breakout', 'Pullback', 'Reversal']);
  const [mistakeTagsList, setMistakeTagsList] = useState<string[]>(['FOMO', 'Revenge Trading', 'Chasing', 'Hesitation']);
  const [defaultAsset, setDefaultAsset] = useState('Stocks');

  useEffect(() => {
    fetch('/api/playbooks').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPlaybooks(data);
    }).catch(() => {});

    fetch('/api/accounts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setAccounts(data);
        const defaultAcc = data.find(a => a.isDefault);
        if (defaultAcc) {
          setFormData(prev => ({ ...prev, accountId: defaultAcc.id }));
        } else if (data.length > 0) {
          setFormData(prev => ({ ...prev, accountId: data[0].id }));
        }
      }
    }).catch(() => {});
    
    fetch('/api/user/settings').then(r => r.json()).then(data => {
      if (data) {
        if (data.setupTags) setSetupTagsList(JSON.parse(data.setupTags));
        if (data.mistakeTags) setMistakeTagsList(JSON.parse(data.mistakeTags));
        if (data.defaultAsset) {
          setDefaultAsset(data.defaultAsset);
          setFormData(prev => ({ ...prev, assetClass: data.defaultAsset }));
        }
      }
    }).catch(() => {});
  }, []);
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
    playbookId: '',
    accountId: '',
    mistakeTags: '',
    notes: ''
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [livePnl, setLivePnl] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'manual' | 'import' | 'ocr'>('manual');

  const handleOcrParsed = (data: any) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      // Default to Closed if we successfully extracted exit price, otherwise keep Open
      status: data.exitPrice ? 'Closed' : 'Open'
    }));
    setMode('manual');
    setError(''); // clear errors if any
  };

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
      if (res.ok && data.trade) {
        // Upload images if any
        if (images.length > 0) {
          for (const file of images) {
            const formData = new FormData();
            formData.append('image', file);
            await fetch(`/api/trades/${data.trade.id}/images`, {
              method: 'POST',
              body: formData
            }).catch(() => {}); // silently fail individual image uploads for now
          }
        }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Add Trade</h2>
        <div style={{ display: 'flex', backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '0.25rem', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setMode('manual')}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: mode === 'manual' ? 'var(--surface-light)' : 'transparent', color: mode === 'manual' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: mode === 'manual' ? 600 : 400, cursor: 'pointer', transition: 'all 150ms ease' }}
          >
            Manual Entry
          </button>
          <button 
            onClick={() => setMode('import')}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: mode === 'import' ? 'var(--surface-light)' : 'transparent', color: mode === 'import' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: mode === 'import' ? 600 : 400, cursor: 'pointer', transition: 'all 150ms ease' }}
          >
            Import CSV
          </button>
          <button 
            onClick={() => setMode('ocr')}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: mode === 'ocr' ? 'var(--surface-light)' : 'transparent', color: mode === 'ocr' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: mode === 'ocr' ? 600 : 400, cursor: 'pointer', transition: 'all 150ms ease' }}
          >
            Import Image
          </button>
        </div>
      </div>
      
      {error && <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      {mode === 'import' ? (
        <CsvImport accounts={accounts} />
      ) : mode === 'ocr' ? (
        <ImageImport onParsed={handleOcrParsed} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div className="card">
          <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0, opacity: loading ? 0.6 : 1, transition: 'opacity 150ms ease' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <input required type="number" step="any" name="entryPrice" className="form-input mono" style={!formData.entryPrice ? { borderColor: 'var(--danger)' } : {}} value={formData.entryPrice} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Position Size</label>
                <input required type="number" step="any" name="positionSize" className="form-input mono" style={!formData.positionSize ? { borderColor: 'var(--danger)' } : {}} value={formData.positionSize} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Fees / Commissions</label>
                <input type="number" step="any" name="fees" className="form-input mono" value={formData.fees} onChange={handleChange} />
              </div>
              
              {formData.status === 'Closed' && (
                <div className="form-group">
                  <label className="form-label">Exit Price</label>
                  <input required type="number" step="any" name="exitPrice" className="form-input mono" style={formData.status === 'Closed' && !formData.exitPrice ? { borderColor: 'var(--danger)' } : {}} value={formData.exitPrice} onChange={handleChange} />
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

            <div className="form-group">
              <label className="form-label">Screenshots (Max 3)</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {images.map((file, i) => (
                  <div key={i} style={{ position: 'relative', width: '100px', height: '75px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setImages(images.filter((_, index) => index !== i))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', lineHeight: 1 }}>×</button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label style={{ width: '100px', height: '75px', borderRadius: '8px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span className="text-muted" style={{ fontSize: '1.5rem', lineHeight: 1 }}>+</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      if (e.target.files?.[0]) setImages([...images, e.target.files[0]]);
                    }} />
                  </label>
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary" style={{ position: 'relative' }} disabled={loading}>
                {loading ? <span className="spinner"></span> : null}
                {loading ? 'Saving...' : 'Save Trade'}
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
      )}
    </div>
  );
}
