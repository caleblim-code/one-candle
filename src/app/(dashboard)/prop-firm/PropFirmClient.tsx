"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function PropFirmClient({ accounts, initialAccountId }: { accounts: any[], initialAccountId?: string }) {
  const router = useRouter();
  
  // Default to the account from URL, or the first one in the list
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccountId && accounts.some(a => a.id === initialAccountId) ? initialAccountId : (accounts[0]?.id || '')
  );

  const selectedAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);
  const rules = selectedAccount?.rules;
  const trades = selectedAccount?.trades || [];
  const payouts = selectedAccount?.payouts || [];

  // Metrics calculation
  const totalPnl = trades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
  const currentBalance = (selectedAccount?.balance || 0) + totalPnl;

  // Simple daily P&L calculation (trades closed today)
  const today = new Date().toLocaleDateString();
  const dailyPnl = trades
    .filter((t: any) => new Date(t.exitDate || t.entryDate).toLocaleDateString() === today)
    .reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);

  // Simple drawdown calculation
  let peakEquity = selectedAccount?.balance || 0;
  let runningEquity = peakEquity;
  let maxDrawdown = 0;

  trades.forEach((t: any) => {
    runningEquity += (t.pnl || 0);
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }
    const currentDrawdown = peakEquity - runningEquity;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
  });

  // Calculate unique trading days
  const tradingDays = new Set(trades.map((t: any) => new Date(t.entryDate).toLocaleDateString())).size;

  if (accounts.length === 0) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>No Prop Firm Accounts Found</h2>
        <p className="text-muted" style={{ marginTop: '1rem', marginBottom: '2rem' }}>You need to create a Prop Firm Challenge or Funded account in Settings to use this dashboard.</p>
        <button className="btn btn-primary" onClick={() => router.push('/settings')}>Go to Settings</button>
      </div>
    );
  }

  const renderProgressBar = (value: number, max: number, invertColors = false) => {
    // If no rule exists, just show a flat line
    if (!max || max <= 0) return <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', marginTop: '0.5rem' }}></div>;

    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    // For things like Profit Target, getting closer is good (green).
    // For things like Max Drawdown, getting closer is bad (red).
    let color = 'var(--accent)'; // default green
    if (invertColors) {
      if (percentage > 80) color = 'var(--danger)'; // Warning zone
      else if (percentage > 50) color = '#f59e0b'; // Amber
      else color = 'var(--accent)';
    }

    return (
      <div style={{ height: '8px', backgroundColor: 'var(--surface-light)', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: color, transition: 'width 0.3s ease' }}></div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Prop Firm Dashboard</h2>
        <select 
          className="form-select" 
          value={selectedAccountId} 
          onChange={(e) => setSelectedAccountId(e.target.value)}
          style={{ width: '250px' }}
        >
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
          ))}
        </select>
      </div>

      {!rules && (
        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309', borderRadius: '8px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>No Rules Configured:</strong> This account doesn't have its prop firm rules set up yet.</span>
          <button className="btn btn-ghost" onClick={() => router.push('/settings')} style={{ border: '1px solid currentColor' }}>Configure Rules</button>
        </div>
      )}

      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Account Balance</div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${currentBalance.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total P&L</div>
          <div className={`mono ${totalPnl >= 0 ? 'text-accent' : 'text-danger'}`} style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Win Rate</div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            {trades.length > 0 ? ((trades.filter((t: any) => t.pnl > 0).length / trades.length) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Rule Compliance Cards */}
      <h3 style={{ marginBottom: '1rem' }}>Rule Compliance</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 'bold' }}>Daily Loss Limit</span>
            <span className="mono" style={{ color: dailyPnl < 0 && Math.abs(dailyPnl) >= (rules?.maxDailyLoss || Infinity) ? 'var(--danger)' : 'inherit' }}>
              ${dailyPnl < 0 ? Math.abs(dailyPnl).toFixed(2) : '0.00'} / ${rules?.maxDailyLoss || 'N/A'}
            </span>
          </div>
          {renderProgressBar(dailyPnl < 0 ? Math.abs(dailyPnl) : 0, rules?.maxDailyLoss || 0, true)}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 'bold' }}>Max Drawdown</span>
            <span className="mono" style={{ color: maxDrawdown >= (rules?.maxTotalDrawdown || Infinity) ? 'var(--danger)' : 'inherit' }}>
              ${maxDrawdown.toFixed(2)} / ${rules?.maxTotalDrawdown || 'N/A'}
            </span>
          </div>
          {renderProgressBar(maxDrawdown, rules?.maxTotalDrawdown || 0, true)}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 'bold' }}>Profit Target</span>
            <span className="mono" style={{ color: totalPnl >= (rules?.profitTarget || Infinity) ? 'var(--accent)' : 'inherit' }}>
              ${Math.max(totalPnl, 0).toFixed(2)} / ${rules?.profitTarget || 'N/A'}
            </span>
          </div>
          {renderProgressBar(Math.max(totalPnl, 0), rules?.profitTarget || 0, false)}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 'bold' }}>Trading Days</span>
            <span className="mono">
              {tradingDays} / {rules?.minTradingDays || 'N/A'} Min
            </span>
          </div>
          {renderProgressBar(tradingDays, rules?.minTradingDays || 0, false)}
        </div>

      </div>

      {/* Payouts Section */}
      <h3 style={{ marginBottom: '1rem', marginTop: '3rem' }}>Payout History</h3>
      <div className="card">
        {payouts.length > 0 ? (
          <table className="table-mobile-cards" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0' }}>Date</th>
                <th style={{ padding: '0.75rem 0' }}>Amount</th>
                <th style={{ padding: '0.75rem 0' }}>Method</th>
                <th style={{ padding: '0.75rem 0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td data-label="Date" style={{ padding: '1rem 0' }}>{new Date(p.date).toLocaleDateString()}</td>
                  <td data-label="Amount" style={{ padding: '1rem 0', fontWeight: 'bold', color: 'var(--accent)' }} className="mono">${p.amount.toFixed(2)}</td>
                  <td data-label="Method" style={{ padding: '1rem 0' }}>{p.method || 'N/A'}</td>
                  <td data-label="Status" style={{ padding: '1rem 0' }}>
                    <span className={`badge ${p.status === 'Paid' ? 'win' : p.status === 'Rejected' ? 'loss' : ''}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No payouts logged yet. Stay disciplined!
          </div>
        )}
      </div>

    </div>
  );
}
