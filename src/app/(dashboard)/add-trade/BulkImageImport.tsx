"use client";

import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';

export default function BulkImageImport({ accounts, playbooks = [], setupTagsList = [] }: { accounts: any[], playbooks?: any[], setupTagsList?: string[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountId, setAccountId] = useState(accounts.find(a => a.isDefault)?.id || (accounts.length > 0 ? accounts[0].id : ''));
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const validateRow = (data: any) => {
    const errors = [];
    if (!data.ticker) errors.push('Missing Ticker/Direction');
    if (!data.entryPrice || !data.exitPrice) errors.push('Missing Entry/Exit prices');
    if (!data.entryDate || !data.exitDate) errors.push('Missing Dates');
    
    if (!data.stopLoss) {
      errors.push('Missing Stop Loss');
    } else if (data.entryPrice) {
      const entry = parseFloat(data.entryPrice);
      const sl = parseFloat(data.stopLoss);
      if (!isNaN(entry) && !isNaN(sl)) {
        if (data.direction === 'Long' && sl >= entry) errors.push('Long SL must be < Entry');
        if (data.direction === 'Short' && sl <= entry) errors.push('Short SL must be > Entry');
      }
    }
    
    data._errors = errors;
    data._isValid = errors.length === 0;
    return data;
  };

  // Extracted parse logic from single ImageImport
  const parseText = (text: string) => {
    const data: any = { status: 'Closed', _isValid: true, _errors: [] };
    
    // 1. Ticker, Direction, Size, Broker ID
    const headMatch = text.match(/([A-Z0-9]+)\s+(buy|sell)\s+([0-9.]+)(?:\s+#?(\d+))?/i);
    if (headMatch) {
      data.ticker = headMatch[1];
      data.direction = headMatch[2].toLowerCase() === 'sell' ? 'Short' : 'Long';
      data.positionSize = headMatch[3];
      if (headMatch[4]) data.brokerTradeId = `#${headMatch[4]}`;
      
      if (['BTC', 'ETH', 'SOL', 'USDT'].some(c => data.ticker.includes(c))) data.assetClass = 'Crypto';
      else if (data.ticker.length >= 6 && !data.ticker.includes('US30') && !data.ticker.includes('NAS')) data.assetClass = 'Forex';
      else data.assetClass = 'Stocks';
    } else {
      data._isValid = false;
      data._errors.push('Could not detect Ticker/Direction');
    }

    // 2. Prices
    const priceMatch = text.match(/([0-9]{2,}[.,][0-9]+)[\s\-=>~_—]+([0-9]{2,}[.,][0-9]+)/);
    if (priceMatch) {
      data.entryPrice = priceMatch[1].replace(',', '.');
      data.exitPrice = priceMatch[2].replace(',', '.');
    }

    // 3. Dates
    const dateRegex = /\b(\d{4}[.,\/-]\d{2}[.,\/-]\d{2}\s+\d{2}:\d{2}:\d{2})\b/g;
    const dates = [...text.matchAll(dateRegex)];
    if (dates.length >= 2) {
      const formatToLocal = (mt5date: string) => {
        const [date, time] = mt5date.split(' ');
        return `${date.replace(/[.,\/]/g, '-')}T${time.slice(0,5)}`;
      };
      data.entryDate = formatToLocal(dates[0][1]);
      data.exitDate = formatToLocal(dates[1][1]);
    }

    // 4. S/L and T/P
    const slMatch = text.match(/S[/\|I1\\]?L[:;.]?\s*([0-9]+[.,]?[0-9]{0,5})/i);
    if (slMatch && slMatch[1] !== '0.00' && slMatch[1] !== '0') data.stopLoss = slMatch[1].replace(',', '.');

    const tpMatch = text.match(/(?:[Ti]\s*[/\|I1\\]?\s*[PR][:;.]?|ARE)\s*([0-9]+[.,]?[0-9]{0,5})/i);
    if (tpMatch && tpMatch[1] !== '0.00' && tpMatch[1] !== '0') data.takeProfit = tpMatch[1].replace(',', '.');

    // 5. Fees & Swap
    let totalFees = 0;
    
    // In MT5/OCR, Swap/Charges are usually negative when they are a cost, and positive if they are an earning.
    // Our backend formula is: Net P&L = Gross P&L - Fees.
    // Therefore, Fees represent a COST.
    // If Swap is -5.00 (cost), we want Fees to be +5.00.
    // If Swap is +5.00 (earning), we want Fees to be -5.00.
    const swapMatch = text.match(/Swap[:;]?\s*(-?[0-9.]+)/i);
    if (swapMatch && !isNaN(parseFloat(swapMatch[1]))) {
      totalFees -= parseFloat(swapMatch[1]);
    }
    
    const chargeMatch = text.match(/Charges[:;]?\s*(-?[0-9.]+)/i);
    if (chargeMatch && !isNaN(parseFloat(chargeMatch[1]))) {
      totalFees -= parseFloat(chargeMatch[1]);
    }
    
    if (totalFees !== 0) {
      data.fees = totalFees.toFixed(2);
    }

    // 6. PNL logic
    if (data.entryPrice && data.exitPrice) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.includes(data.entryPrice.replace('.', ',')) || line.includes(data.entryPrice)) {
          const pnlMatch = line.match(/(-?[0-9]+[.,][0-9]{1,2})\s*$/);
          if (pnlMatch) {
            let pnlVal = parseFloat(pnlMatch[1].replace(',', '.'));
            if (pnlVal.toString() !== data.entryPrice && pnlVal.toString() !== data.exitPrice) {
              const entry = parseFloat(data.entryPrice);
              const exit = parseFloat(data.exitPrice);
              const isLong = data.direction === 'Long';
              const priceWentUp = exit > entry;
              const shouldBeProfit = isLong ? priceWentUp : !priceWentUp;

              if (!shouldBeProfit && pnlVal > 0) {
                const pnlStr = pnlMatch[1];
                if (pnlStr.startsWith('2') || pnlStr.startsWith('7')) {
                  const withoutFirstDigit = parseFloat(pnlStr.substring(1).replace(',', '.'));
                  const rawDiff = Math.abs(entry - exit) * parseFloat(data.positionSize || '1');
                  
                  if (rawDiff > 0 && withoutFirstDigit > 0) {
                    const multOriginal = pnlVal / rawDiff;
                    const multStripped = withoutFirstDigit / rawDiff;
                    
                    const isPowerOf10 = (n: number) => {
                      if (n <= 0) return false;
                      const log = Math.log10(n);
                      return Math.abs(log - Math.round(log)) < 0.2;
                    };
                    
                    if (isPowerOf10(multStripped) && !isPowerOf10(multOriginal)) {
                      pnlVal = withoutFirstDigit;
                    }
                  } else if (withoutFirstDigit > 0) {
                     pnlVal = withoutFirstDigit;
                  }
                }
                pnlVal = -Math.abs(pnlVal);
              }
              if (shouldBeProfit && pnlVal < 0) {
                pnlVal = Math.abs(pnlVal);
              }
              // pnlVal is Gross Profit. totalFees is Cost. Net PNL = Gross - Cost.
              data.pnl = (pnlVal - totalFees).toFixed(2);
            }
          }
          break;
        }
      }
    }

    return validateRow(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    setError('');
    
    try {
      const worker = await Tesseract.createWorker('eng', 1);
      
      const results = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Scanning image ${i + 1} of ${files.length}...`);
        const { data: { text } } = await worker.recognize(files[i]);
        const parsed = parseText(text);
        
        let lastSetup = '';
        let lastPlaybook = '';
        try {
          lastSetup = localStorage.getItem('lastTradeSetupTag') || '';
          lastPlaybook = localStorage.getItem('lastTradePlaybookId') || '';
        } catch (e) {}

        // Initialize extra journaling fields
        parsed.setupTag = lastSetup;
        parsed.playbookId = lastPlaybook;
        parsed.mistakeTags = '';
        parsed.notes = '';
        
        results.push({ ...parsed, _isValid: parsed._isValid, _errors: parsed._errors });
      }
      
      await worker.terminate();

      setParsedRows(results);
      
      const validSet = new Set<number>();
      results.forEach((r, i) => {
        if (r._isValid) validSet.add(i);
      });
      setSelectedRows(validSet);
      
      setStep(2);

    } catch (err: any) {
      setError(err.message || 'Failed to process images');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleImport = async () => {
    const tradesToImport = parsedRows.filter((r, i) => selectedRows.has(i) && r._isValid);

    if (tradesToImport.length === 0) {
      setError('No valid trades selected for import.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let successCount = 0;
      
      // We process sequentially so we can attach the specific image to the specific created trade
      for (let i = 0; i < tradesToImport.length; i++) {
        setProgress(`Importing trade ${i + 1} of ${tradesToImport.length}...`);
        
        const row = tradesToImport[i];
        const copy = { ...row, accountId };
        
        // Clean up internal state before sending
        delete copy._isValid;
        delete copy._errors;

        // Convert local datetime strings to ISO strings so server stores the correct UTC equivalent
        if (copy.entryDate) copy.entryDate = new Date(copy.entryDate).toISOString();
        if (copy.exitDate) copy.exitDate = new Date(copy.exitDate).toISOString();

        // 1. Create Trade
        const res = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(copy),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Failed to import trade: ${copy.ticker}`);
        }
        
        const createdTrade = await res.json();
        
        successCount++;
      }

      // Save the setup and playbook from the last valid trade imported
      if (tradesToImport.length > 0) {
        try {
          const lastTrade = tradesToImport[tradesToImport.length - 1];
          if (lastTrade.setupTag) localStorage.setItem('lastTradeSetupTag', lastTrade.setupTag);
          if (lastTrade.playbookId) localStorage.setItem('lastTradePlaybookId', lastTrade.playbookId);
        } catch (e) {}
      }

      alert(`Success! ${successCount} trades imported.`);
      mutate(key => typeof key === 'string' && key.startsWith('/api/trades'), undefined, { revalidate: true });
      router.refresh();
      router.push('/journal');
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during import.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const toggleRow = (index: number) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedRows(newSet);
  };
  
  const updateRowField = (index: number, field: string, value: string) => {
    const newRows = [...parsedRows];
    newRows[index][field] = value;
    newRows[index] = validateRow(newRows[index]);
    setParsedRows(newRows);
  };

  return (
    <div className="card animate-fade-in" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        Bulk OCR Image Import
      </h3>

      {error && <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      {step === 1 && (
        <div className="animate-slide-up">
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Select Trading Account to Import Into</label>
            <select className="form-select" value={accountId} onChange={e => setAccountId(e.target.value)} style={{ maxWidth: '400px' }}>
              <option value="" disabled>Select an account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--surface-light)', position: 'relative' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="spinner" style={{ width: '40px', height: '40px', marginBottom: '1rem' }}></span>
                <p className="mono fw-bold">{progress}</p>
              </div>
            ) : (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="10" cy="13" r="2"></circle><path d="M16 17l-3-3-3 3"></path></svg>
                <h4 style={{ marginBottom: '0.5rem' }}>Upload Multiple MT5 Screenshots</h4>
                <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Select multiple trade screenshots. We will scan all of them sequentially and let you review and add journal notes before importing.</p>
                
                <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                  Select Screenshots
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <p className="text-muted" style={{ margin: 0 }}>Review parsed trades, correct any misreads, and add your playbook & notes before importing.</p>
            <div className="mono" style={{ fontSize: '0.9rem', backgroundColor: 'var(--surface-light)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
              <span className="text-accent">{Array.from(selectedRows).filter(i => parsedRows[i]._isValid).length}</span> valid trades selected
            </div>
          </div>
          
          {loading && (
             <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--surface-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="spinner"></span>
                <p className="mono fw-bold" style={{ margin: 0 }}>{progress}</p>
             </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
             {parsedRows.map((row, i) => (
               <div key={i} style={{ 
                  backgroundColor: 'var(--surface)', 
                  border: `1px solid ${selectedRows.has(i) ? 'var(--border)' : 'transparent'}`, 
                  borderLeft: `4px solid ${row._isValid ? (selectedRows.has(i) ? 'var(--accent)' : 'var(--border)') : 'var(--danger)'}`,
                  borderRadius: '8px', 
                  padding: '1.5rem',
                  opacity: selectedRows.has(i) ? 1 : 0.5,
                  transition: 'all 0.2s ease'
               }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input 
                           type="checkbox" 
                           checked={selectedRows.has(i)} 
                           onChange={() => toggleRow(i)} 
                           disabled={!row._isValid || loading}
                           style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <input 
                              type="text" 
                              value={row.ticker || ''} 
                              onChange={e => updateRowField(i, 'ticker', e.target.value)}
                              className="form-input"
                              style={{ width: '120px', fontSize: '1.1rem', fontWeight: 'bold' }}
                              placeholder="Ticker"
                           />
                           <select 
                              value={row.direction || 'Long'} 
                              onChange={e => updateRowField(i, 'direction', e.target.value)}
                              className="form-select"
                              style={{ width: '100px' }}
                           >
                              <option value="Long">Long</option>
                              <option value="Short">Short</option>
                           </select>
                           <select 
                              value={row.assetClass || 'Stocks'} 
                              onChange={e => updateRowField(i, 'assetClass', e.target.value)}
                              className="form-select"
                              style={{ width: '110px' }}
                           >
                              <option value="Stocks">Stocks</option>
                              <option value="Options">Options</option>
                              <option value="Crypto">Crypto</option>
                              <option value="Forex">Forex</option>
                           </select>
                        </div>
                     </div>
                     {!row._isValid && <span className="text-danger" style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255, 69, 58, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{row._errors.join(', ')}</span>}
                  </div>
                  
                  {/* Grid of details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Entry Date</label>
                        <input type="datetime-local" className="form-input" value={row.entryDate || ''} onChange={e => updateRowField(i, 'entryDate', e.target.value)} />
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Exit Date</label>
                        <input type="datetime-local" className="form-input" value={row.exitDate || ''} onChange={e => updateRowField(i, 'exitDate', e.target.value)} />
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Entry Price</label>
                        <input type="number" step="any" className="form-input" value={row.entryPrice || ''} onChange={e => updateRowField(i, 'entryPrice', e.target.value)} />
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Exit Price</label>
                        <input type="number" step="any" className="form-input" value={row.exitPrice || ''} onChange={e => updateRowField(i, 'exitPrice', e.target.value)} />
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Size</label>
                        <input type="number" step="any" className="form-input" value={row.positionSize || ''} onChange={e => updateRowField(i, 'positionSize', e.target.value)} />
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>P&L ($)</label>
                        <input type="number" step="any" className="form-input" value={row.pnl || ''} onChange={e => updateRowField(i, 'pnl', e.target.value)} placeholder="Auto-calculated if blank" />
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Stop Loss</label>
                        <input type="number" step="any" className="form-input" value={row.stopLoss || ''} onChange={e => updateRowField(i, 'stopLoss', e.target.value)} />
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Take Profit</label>
                        <input type="number" step="any" className="form-input" value={row.takeProfit || ''} onChange={e => updateRowField(i, 'takeProfit', e.target.value)} />
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Fees / Swap</label>
                        <input type="number" step="any" className="form-input" value={row.fees || ''} onChange={e => updateRowField(i, 'fees', e.target.value)} />
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Broker Trade ID</label>
                        <input type="text" className="form-input" value={row.brokerTradeId || ''} onChange={e => updateRowField(i, 'brokerTradeId', e.target.value)} />
                     </div>
                  </div>
                  
                  {/* Journaling section */}
                  <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Setup Tag</label>
                        <select className="form-select" value={row.setupTag || ''} onChange={e => updateRowField(i, 'setupTag', e.target.value)}>
                          <option value="">-- No Setup --</option>
                          {setupTagsList.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Playbook</label>
                        <select className="form-select" value={row.playbookId || ''} onChange={e => updateRowField(i, 'playbookId', e.target.value)}>
                          <option value="">-- No Playbook --</option>
                          {playbooks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Mistakes (comma separated)</label>
                        <input type="text" className="form-input" value={row.mistakeTags || ''} onChange={e => updateRowField(i, 'mistakeTags', e.target.value)} placeholder="e.g. FOMO, Hesitation" />
                     </div>
                     <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Journal Notes</label>
                        <textarea 
                           className="form-input" 
                           rows={2} 
                           value={row.notes || ''} 
                           onChange={e => updateRowField(i, 'notes', e.target.value)} 
                           placeholder="What went well? What went wrong?"
                           style={{ resize: 'vertical' }}
                        ></textarea>
                     </div>
                  </div>
               </div>
             ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', position: 'sticky', bottom: '2rem', backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={loading}>Back</button>
            <button className="btn btn-primary" onClick={handleImport} disabled={loading || Array.from(selectedRows).length === 0} style={{ flex: 1 }}>
              {loading ? 'Processing...' : 'Confirm & Import Selected Trades'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
