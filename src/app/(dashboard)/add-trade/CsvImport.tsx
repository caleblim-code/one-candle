"use client";

import { useState } from 'react';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';

export default function CsvImport({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountId, setAccountId] = useState(accounts.find(a => a.isDefault)?.id || (accounts.length > 0 ? accounts[0].id : ''));
  
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Required DB fields
  const [mapping, setMapping] = useState<Record<string, string>>({
    ticker: '',
    direction: '',
    entryDate: '',
    entryPrice: '',
    positionSize: '',
    // Optional fields
    exitDate: '',
    exitPrice: '',
    fees: '',
    stopLoss: '',
    takeProfit: ''
  });

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setCsvHeaders(results.meta.fields);
          setCsvData(results.data);
          
          // Auto-mapping attempt
          const newMapping = { ...mapping };
          const headers = results.meta.fields.map(h => h.toLowerCase());
          
          const findHeader = (keywords: string[]) => {
            return results.meta.fields?.find(h => keywords.some(k => h.toLowerCase().includes(k))) || '';
          };

          newMapping.ticker = findHeader(['symbol', 'ticker', 'asset']);
          newMapping.direction = findHeader(['side', 'action', 'type', 'direction']);
          newMapping.entryDate = findHeader(['date', 'time', 'opened']);
          newMapping.entryPrice = findHeader(['price', 'entry', 'avg price']);
          newMapping.positionSize = findHeader(['qty', 'quantity', 'size']);
          newMapping.fees = findHeader(['fee', 'commission']);

          setMapping(newMapping);
          setStep(2);
        } else {
          setError('Could not parse CSV headers. Make sure the file has a header row.');
        }
      },
      error: (err) => {
        setError(err.message);
      }
    });
  };

  const handlePreview = () => {
    // Validate required mappings
    if (!mapping.ticker || !mapping.entryPrice || !mapping.positionSize || !mapping.entryDate) {
      setError('Please map at least Ticker, Entry Price, Position Size, and Entry Date.');
      return;
    }
    setError('');

    const processed = csvData.map((row, index) => {
      // Basic validation and mapping
      const mappedRow: any = { _originalIndex: index, _isValid: true, _errors: [] };

      const getVal = (field: string) => row[mapping[field]]?.trim() || '';

      mappedRow.ticker = getVal('ticker');
      if (!mappedRow.ticker) {
        mappedRow._isValid = false;
        mappedRow._errors.push('Missing ticker');
      }

      // Parse Direction
      const rawDir = getVal('direction').toLowerCase();
      mappedRow.direction = (rawDir.includes('sell') || rawDir.includes('short')) ? 'Short' : 'Long';

      // Parse Date
      const rawDate = getVal('entryDate');
      const parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime())) {
        mappedRow._isValid = false;
        mappedRow._errors.push(`Invalid Entry Date: ${rawDate}`);
      } else {
        mappedRow.entryDate = parsedDate.toISOString();
      }

      // Parse Numbers
      mappedRow.entryPrice = parseFloat(getVal('entryPrice').replace(/[^0-9.-]/g, ''));
      if (isNaN(mappedRow.entryPrice)) { mappedRow._isValid = false; mappedRow._errors.push('Invalid Entry Price'); }

      mappedRow.positionSize = parseFloat(getVal('positionSize').replace(/[^0-9.-]/g, ''));
      if (isNaN(mappedRow.positionSize)) { mappedRow._isValid = false; mappedRow._errors.push('Invalid Position Size'); }

      // Optional fields
      if (mapping.exitDate && getVal('exitDate')) {
        const pd = new Date(getVal('exitDate'));
        mappedRow.exitDate = isNaN(pd.getTime()) ? null : pd.toISOString();
      }
      if (mapping.exitPrice && getVal('exitPrice')) mappedRow.exitPrice = parseFloat(getVal('exitPrice').replace(/[^0-9.-]/g, ''));
      if (mapping.fees && getVal('fees')) mappedRow.fees = parseFloat(getVal('fees').replace(/[^0-9.-]/g, ''));
      if (mapping.stopLoss && getVal('stopLoss')) mappedRow.stopLoss = parseFloat(getVal('stopLoss').replace(/[^0-9.-]/g, ''));
      if (mapping.takeProfit && getVal('takeProfit')) mappedRow.takeProfit = parseFloat(getVal('takeProfit').replace(/[^0-9.-]/g, ''));

      return mappedRow;
    });

    setParsedRows(processed);
    
    // Select valid rows by default
    const validSet = new Set<number>();
    processed.forEach((r, i) => {
      if (r._isValid) validSet.add(i);
    });
    setSelectedRows(validSet);
    
    setStep(3);
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
        mutate(key => typeof key === 'string' && key.startsWith('/api/trades'), undefined, { revalidate: true });
        router.refresh();
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Bulk Import CSV
      </h3>

      {error && <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="animate-slide-up">
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Select Trading Account to Import Into</label>
            <select className="form-select" value={accountId} onChange={e => setAccountId(e.target.value)} style={{ maxWidth: '400px' }}>
              <option value="" disabled>Select an account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--surface-light)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <h4 style={{ marginBottom: '0.5rem' }}>Upload CSV File</h4>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Export your trade history from your broker as a .csv file and upload it here.</p>
            
            <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
              Select CSV File
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: MAPPING */}
      {step === 2 && (
        <div className="animate-slide-up">
          <p className="text-muted" style={{ marginBottom: '2rem' }}>Map the columns from your CSV to the correct fields in OneCandle.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {Object.keys(mapping).map((field) => (
              <div key={field} className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                  {['ticker', 'entryPrice', 'positionSize', 'entryDate'].includes(field) && <span className="text-danger" style={{ fontSize: '0.8rem' }}>*Required</span>}
                </label>
                <select 
                  className="form-select" 
                  value={mapping[field]} 
                  onChange={e => setMapping({...mapping, [field]: e.target.value})}
                  style={['ticker', 'entryPrice', 'positionSize', 'entryDate'].includes(field) && !mapping[field] ? { borderColor: 'var(--danger)' } : {}}
                >
                  <option value="">-- Ignore --</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={handlePreview}>Preview Import &rarr;</button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & SUBMIT */}
      {step === 3 && (
        <div className="animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <p className="text-muted" style={{ margin: 0 }}>Review the parsed trades before committing. Invalid rows are unchecked automatically.</p>
            <div className="mono" style={{ fontSize: '0.9rem' }}>
              <span className="text-accent">{Array.from(selectedRows).filter(i => parsedRows[i]._isValid).length}</span> valid trades selected
            </div>
          </div>

          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '600px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Import</th>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Ticker</th>
                  <th style={{ padding: '0.75rem' }}>Dir</th>
                  <th style={{ padding: '0.75rem' }}>Entry</th>
                  <th style={{ padding: '0.75rem' }}>Size</th>
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
                    <td style={{ padding: '0.75rem', color: 'var(--danger)' }}>
                      {!row._isValid && row._errors.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={loading}>Back</button>
            <button className="btn btn-primary" onClick={handleImport} disabled={loading || Array.from(selectedRows).length === 0}>
              {loading ? 'Importing...' : 'Confirm & Import Trades'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
