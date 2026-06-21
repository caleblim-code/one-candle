"use client";

import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { useRouter } from 'next/navigation';

export default function BulkImageImport({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountId, setAccountId] = useState(accounts.find(a => a.isDefault)?.id || (accounts.length > 0 ? accounts[0].id : ''));
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

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
    } else {
      data._isValid = false;
      data._errors.push('Could not detect Entry/Exit prices');
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
    } else {
      data._isValid = false;
      data._errors.push('Could not detect Dates');
    }

    // 4. S/L and T/P
    const slMatch = text.match(/S[/\|I1\\]?L[:;.]?\s*([0-9]+[.,]?[0-9]{0,5})/i);
    if (slMatch && slMatch[1] !== '0.00' && slMatch[1] !== '0') data.stopLoss = slMatch[1].replace(',', '.');

    const tpMatch = text.match(/(?:[Ti]\s*[/\|I1\\]?\s*[PR][:;.]?|ARE)\s*([0-9]+[.,]?[0-9]{0,5})/i);
    if (tpMatch && tpMatch[1] !== '0.00' && tpMatch[1] !== '0') data.takeProfit = tpMatch[1].replace(',', '.');

    // 5. Fees
    let totalFees = 0;
    const swapMatch = text.match(/Swap[:;]?\s*(-?[0-9.]+)/i);
    if (swapMatch && !isNaN(parseFloat(swapMatch[1]))) totalFees += Math.abs(parseFloat(swapMatch[1]));
    
    const chargeMatch = text.match(/Charges[:;]?\s*(-?[0-9.]+)/i);
    if (chargeMatch && !isNaN(parseFloat(chargeMatch[1]))) totalFees += Math.abs(parseFloat(chargeMatch[1]));
    
    if (totalFees > 0) {
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
              data.pnl = pnlVal.toFixed(2);
            }
          }
          break;
        }
      }
    }

    return data;
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
        results.push({ ...parsed, _originalIndex: i });
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
    const tradesToImport = parsedRows.filter((r, i) => selectedRows.has(i) && r._isValid).map(r => {
      const copy = { ...r, accountId };
      delete copy._originalIndex;
      delete copy._isValid;
      delete copy._errors;
      return copy;
    });

    if (tradesToImport.length === 0) {
      setError('No valid trades selected for import.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/trades/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          trades: tradesToImport
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Success! ${data.count} trades imported.`);
        router.push('/journal');
      } else {
        setError(data.error || 'Failed to import trades');
      }
    } catch (err) {
      setError('An unexpected error occurred during import.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (index: number) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedRows(newSet);
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
                <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Select multiple trade screenshots. We will scan all of them sequentially and show you a preview before importing.</p>
                
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <p className="text-muted" style={{ margin: 0 }}>Review the parsed trades from your screenshots.</p>
            <div className="mono" style={{ fontSize: '0.9rem' }}>
              <span className="text-accent">{Array.from(selectedRows).filter(i => parsedRows[i]._isValid).length}</span> valid trades selected
            </div>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Import</th>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Ticker</th>
                  <th style={{ padding: '0.75rem' }}>Dir</th>
                  <th style={{ padding: '0.75rem' }}>Entry</th>
                  <th style={{ padding: '0.75rem' }}>Size</th>
                  <th style={{ padding: '0.75rem' }}>P&L</th>
                  <th style={{ padding: '0.75rem' }}>Errors</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', backgroundColor: row._isValid ? 'transparent' : 'rgba(255, 69, 58, 0.05)', opacity: selectedRows.has(i) ? 1 : 0.5 }}>
                    <td style={{ padding: '0.75rem' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.has(i)} 
                        onChange={() => toggleRow(i)} 
                        disabled={!row._isValid}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>{row.entryDate ? new Date(row.entryDate).toLocaleDateString() : '--'}</td>
                    <td style={{ padding: '0.75rem' }} className="mono fw-bold">{row.ticker || '--'}</td>
                    <td style={{ padding: '0.75rem' }}><span className={`badge ${row.direction === 'Long' ? 'win' : 'loss'}`}>{row.direction}</span></td>
                    <td style={{ padding: '0.75rem' }} className="mono">{row.entryPrice ? `$${row.entryPrice}` : '--'}</td>
                    <td style={{ padding: '0.75rem' }} className="mono">{row.positionSize || '--'}</td>
                    <td style={{ padding: '0.75rem' }} className={`mono ${parseFloat(row.pnl) >= 0 ? 'text-accent' : 'text-danger'}`}>
                      {row.pnl ? `$${row.pnl}` : '--'}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--danger)' }}>
                      {!row._isValid && row._errors.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={loading}>Back</button>
            <button className="btn btn-primary" onClick={handleImport} disabled={loading || Array.from(selectedRows).length === 0}>
              {loading ? 'Importing...' : 'Confirm & Import Trades'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
