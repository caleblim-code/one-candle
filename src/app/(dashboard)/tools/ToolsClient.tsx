"use client";

import { useState, useEffect } from 'react';

export default function ToolsClient() {
  const [balance, setBalance] = useState('');
  const [riskPercent, setRiskPercent] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [pipValue, setPipValue] = useState('10'); // Default roughly $10/pip for standard lot

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculatePositionSize = () => {
    const bal = parseFloat(balance);
    const risk = parseFloat(riskPercent);
    const sl = parseFloat(stopLoss);
    const pv = parseFloat(pipValue);

    if (!bal || !risk || !sl || !pv) return null;

    const riskAmount = bal * (risk / 100);
    const lots = riskAmount / (sl * pv);
    
    return {
      riskAmount: riskAmount.toFixed(2),
      lots: lots.toFixed(2)
    };
  };

  const result = calculatePositionSize();

  const getSessionStatus = (startHour: number, endHour: number) => {
    if (!currentTime) return false;
    const hour = currentTime.getUTCHours();
    // Handle wrap-around for midnight
    let isOpen = false;
    if (startHour > endHour) {
      isOpen = hour >= startHour || hour < endHour;
    } else {
      isOpen = hour >= startHour && hour < endHour;
    }
    return isOpen;
  };

  const sessions = [
    { name: 'Sydney', start: 21, end: 6, open: getSessionStatus(21, 6) },
    { name: 'Tokyo', start: 23, end: 8, open: getSessionStatus(23, 8) },
    { name: 'London', start: 7, end: 16, open: getSessionStatus(7, 16) },
    { name: 'New York', start: 12, end: 21, open: getSessionStatus(12, 21) },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2>Trading Tools</h2>
        <p className="text-muted">Calculators and real-time market data to assist your trading.</p>
      </div>

      <div className="grid-responsive-2" style={{ gap: '2rem' }}>
        
        {/* Market Sessions Clock */}
        <div className="card animate-slide-up">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Market Sessions (UTC)
          </h3>
          <p className="mono" style={{ fontSize: '1.2rem', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
            {currentTime ? currentTime.toISOString().split('T')[1].split('.')[0] + ' UTC' : '--:--:-- UTC'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--surface-light)', borderRadius: '8px', border: s.open ? '1px solid var(--accent)' : '1px solid transparent' }}>
                <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="mono text-muted" style={{ fontSize: '0.9rem' }}>
                    {String(s.start).padStart(2, '0')}:00 - {String(s.end).padStart(2, '0')}:00
                  </span>
                  {s.open ? (
                    <span className="badge" style={{ backgroundColor: '#e4f6ed', color: '#00c853' }}>OPEN</span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}>CLOSED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Margin / Position Size Calculator */}
        <div className="card animate-slide-up">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16.01" y2="14"></line><line x1="16" y1="10" x2="16.01" y2="10"></line><line x1="16" y1="18" x2="16.01" y2="18"></line><line x1="12" y1="14" x2="12.01" y2="14"></line><line x1="12" y1="10" x2="12.01" y2="10"></line><line x1="12" y1="18" x2="12.01" y2="18"></line><line x1="8" y1="14" x2="8.01" y2="14"></line><line x1="8" y1="10" x2="8.01" y2="10"></line><line x1="8" y1="18" x2="8.01" y2="18"></line></svg>
            Position Size Calculator
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Account Balance ($)</label>
              <input type="number" className="form-input" value={balance} onChange={e => setBalance(e.target.value)} placeholder="e.g. 10000" />
            </div>
            <div>
              <label className="form-label">Risk (%)</label>
              <input type="number" step="0.1" className="form-input" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} placeholder="e.g. 1" />
            </div>
            <div>
              <label className="form-label">Stop Loss (Pips)</label>
              <input type="number" className="form-input" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="e.g. 20" />
            </div>
            <div>
              <label className="form-label">Pip Value ($)</label>
              <input type="number" className="form-input" value={pipValue} onChange={e => setPipValue(e.target.value)} />
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface-light)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Results</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Risk Amount:</span>
              <span className="mono fw-bold text-danger">${result ? result.riskAmount : '0.00'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Standard Lots:</span>
              <span className="mono fw-bold text-accent" style={{ fontSize: '1.2rem' }}>{result ? result.lots : '0.00'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
