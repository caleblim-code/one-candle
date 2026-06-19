"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PlaybookDetailClient({ playbook }: { playbook: any }) {
  const trades = playbook.trades || [];

  const stats = useMemo(() => {
    let grossProfit = 0, grossLoss = 0, wins = 0, losses = 0, totalR = 0, rCount = 0;
    trades.forEach((t: any) => {
      const pnl = t.pnl || 0;
      if (pnl > 0) { grossProfit += pnl; wins++; }
      else if (pnl < 0) { grossLoss += Math.abs(pnl); losses++; }
      if (t.stopLoss && t.entryPrice) {
        const risk = Math.abs(t.entryPrice - t.stopLoss);
        if (risk > 0) { totalR += pnl / (risk * t.positionSize); rCount++; }
      }
    });
    const netPnl = grossProfit - grossLoss;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
    const avgR = rCount > 0 ? totalR / rCount : 0;
    return { netPnl, winRate, profitFactor, avgR, total: trades.length, wins, losses };
  }, [trades]);

  const equityData = useMemo(() => {
    let cum = 0;
    return trades.map((t: any, i: number) => {
      cum += (t.pnl || 0);
      return { name: `Trade ${i + 1}`, date: new Date(t.entryDate).toLocaleDateString(), equity: cum };
    });
  }, [trades]);

  const renderRulesSection = (title: string, content: string | null) => {
    if (!content) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--accent)', marginBottom: '0.75rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
        <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>
          {content}
        </div>
      </div>
    );
  };

  const statCardStyle = { padding: '1.25rem', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/playbooks" className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }}>← Back</Link>
        <h2 style={{ color: 'var(--accent)' }}>{playbook.name}</h2>
      </div>

      {playbook.description && (
        <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '1.05rem', maxWidth: '700px' }}>{playbook.description}</p>
      )}

      {/* Mini Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Total Trades</span>
          <span className="mono fw-bold" style={{ fontSize: '1.3rem' }}>{stats.total}</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Win Rate</span>
          <span className="mono fw-bold" style={{ fontSize: '1.3rem', color: stats.winRate >= 50 ? 'var(--accent)' : 'var(--danger)' }}>{stats.winRate.toFixed(1)}%</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Net P&L</span>
          <span className={`mono fw-bold ${stats.netPnl >= 0 ? 'text-accent' : 'text-danger'}`} style={{ fontSize: '1.3rem' }}>{stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toFixed(2)}</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Profit Factor</span>
          <span className="mono fw-bold" style={{ fontSize: '1.3rem' }}>{stats.profitFactor.toFixed(2)}</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Avg R-Multiple</span>
          <span className="mono fw-bold" style={{ fontSize: '1.3rem', color: stats.avgR >= 1 ? 'var(--accent)' : 'var(--text-main)' }}>{stats.avgR.toFixed(2)}R</span>
        </div>
      </div>

      {/* Two Column Layout: Rules + Equity Curve */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Strategy Rules</h3>
          {renderRulesSection('Entry Criteria', playbook.entryCriteria)}
          {renderRulesSection('Exit Criteria', playbook.exitCriteria)}
          {renderRulesSection('Risk Management', playbook.riskRules)}
          {renderRulesSection('Chart Notes', playbook.chartNotes)}
          {playbook.tags && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {playbook.tags.split(',').map((tag: string) => (
                <span key={tag} className="badge" style={{ backgroundColor: 'var(--bg-color)' }}>{tag.trim()}</span>
              ))}
            </div>
          )}
          {!playbook.entryCriteria && !playbook.exitCriteria && !playbook.riskRules && !playbook.chartNotes && (
            <p className="text-muted">No rules defined for this playbook yet.</p>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Playbook Equity Curve</h3>
          {trades.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData} margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="colorPbEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ backgroundColor: 'var(--surface)', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                          <p className="text-muted" style={{ fontSize: '0.8rem' }}>{payload[0].payload.date}</p>
                          <p className="mono fw-bold text-accent">${payload[0].value.toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Area type="monotone" dataKey="equity" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorPbEquity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="text-muted">No trades linked to this playbook yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Trades Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Trades Using This Playbook ({trades.length})</h3>
        {trades.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ticker</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Direction</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Entry</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Exit</th>
                  <th style={{ padding: '0.75rem 1rem' }}>P&L</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t: any) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>{new Date(t.entryDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }} className="mono fw-bold">{t.ticker.toUpperCase()}</td>
                    <td style={{ padding: '1rem' }}><span className={`badge ${t.direction === 'Long' ? 'win' : 'loss'}`}>{t.direction}</span></td>
                    <td style={{ padding: '1rem' }} className="mono">${t.entryPrice.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }} className="mono">{t.exitPrice ? `$${t.exitPrice.toFixed(2)}` : '--'}</td>
                    <td style={{ padding: '1rem' }} className={`mono fw-bold ${t.pnl && t.pnl >= 0 ? 'text-accent' : 'text-danger'}`}>
                      {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '--'}
                    </td>
                    <td style={{ padding: '1rem' }}><span style={{ color: t.status === 'Open' ? 'var(--accent)' : 'var(--text-muted)' }}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>No trades have been linked to this playbook yet. When adding a trade, select this playbook from the dropdown.</p>
        )}
      </div>
    </div>
  );
}
