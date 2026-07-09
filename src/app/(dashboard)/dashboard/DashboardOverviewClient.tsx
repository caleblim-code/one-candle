"use client";

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import DashboardLoading from './loading';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardOverviewClient({ accountId }: { accountId: string }) {
  const { data, error, isLoading } = useSWR(`/api/dashboard/stats?account=${accountId}`, fetcher);
  const { data: goalsData } = useSWR(accountId !== 'all' ? `/api/goals?account=${accountId}` : null, fetcher);
  const { data: goalsProgressData } = useSWR(accountId !== 'all' ? `/api/goals/progress?account=${accountId}` : null, fetcher);
  const { data: insightsData } = useSWR(`/api/insights?account=${accountId}`, fetcher);
  
  const [equityMode, setEquityMode] = useState<'pnl' | 'balance'>('pnl');

  // Safely extract data for hooks
  const chartData = data?.chartData || [];
  const transactions = data?.transactions || [];
  const accountBalance = data?.accountBalance || 0;

  // Compute account balance chart data
  const balanceChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    // Merge trades (from chartData) with transactions chronologically
    const events: { date: string; sortDate: Date; pnl: number; txAmount: number }[] = [];
    
    chartData.forEach((d: any) => {
      events.push({ date: d.date, sortDate: new Date(d.date), pnl: d.pnl, txAmount: 0 });
    });
    
    (transactions || []).forEach((tx: any) => {
      const dateStr = new Date(tx.date).toLocaleDateString();
      const amt = tx.type === 'Deposit' ? tx.amount : -tx.amount;
      events.push({ date: dateStr, sortDate: new Date(tx.date), pnl: 0, txAmount: amt });
    });
    
    events.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
    
    let equity = accountBalance || 0;
    const result = [{ date: 'Start', equity: equity }];
    events.forEach(e => {
      equity += e.pnl + e.txAmount;
      result.push({ date: e.date, equity });
    });
    return result;
  }, [chartData, transactions, accountBalance]);

  const activeChartData = equityMode === 'pnl' ? chartData : balanceChartData;

  if (error) return <div className="text-danger" style={{ padding: '2rem' }}>Failed to load dashboard data.</div>;
  if (isLoading) return <DashboardLoading />;

  const activeGoals = goalsData?.goals?.filter((g: any) => g.status === 'Active') || [];
  const goalProgress = goalsProgressData?.progress || {};

  const renderProgressBar = (label: string, current: number, target: number, reverseColors = false) => {
    if (target === null || target === undefined) return null;
    const percent = Math.min(Math.max((current / target) * 100, 0), 100);
    
    let colorClass = 'var(--accent)';
    if (reverseColors) {
      if (percent > 90) colorClass = 'var(--danger)';
      else if (percent > 70) colorClass = 'var(--warning)';
    } else {
      if (percent < 30) colorClass = 'var(--danger)';
      else if (percent < 70) colorClass = 'var(--warning)';
    }

    return (
      <div style={{ marginBottom: '1rem' }} key={label}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
          <span className="text-muted">{label}</span>
          <span className="mono fw-bold">{current.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {target.toLocaleString()}</span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${percent}%`, backgroundColor: colorClass, transition: 'width 0.3s ease' }}></div>
        </div>
      </div>
    );
  };
  if (!data || !data.success) return <DashboardLoading />;

  const { stats, recentTrades } = data;

  if (stats.totalTrades === 0) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
        <h2>Welcome to OneCandle</h2>
        <p className="text-muted" style={{ marginTop: '0.5rem', marginBottom: '2rem', maxWidth: '400px' }}>Your dashboard is currently empty. Start by logging your first trade to see your performance metrics and equity curve come to life.</p>
        <Link href="/add-trade" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Add Your First Trade</Link>
      </div>
    );
  }

  const toggleStyle = (active: boolean) => ({
    padding: '0.4rem 1rem',
    fontSize: '0.85rem',
    fontWeight: active ? 'bold' as const : 'normal' as const,
    backgroundColor: active ? 'var(--accent)' : 'transparent',
    color: active ? 'white' : 'var(--text-muted)',
    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  });

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem' }}>Dashboard Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Net P&L</div>
          <div className={`mono ${stats.totalPnl >= 0 ? 'text-accent' : 'text-danger'}`} style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats.totalPnl >= 0 ? '+' : ''}${Math.abs(stats.totalPnl).toFixed(2)}
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Win Rate</div>
          <div className="mono" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.winRate.toFixed(1)}%</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Trades</div>
          <div className="mono" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalTrades}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Avg Win / Loss</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            <span className="text-accent">+${stats.averageWin.toFixed(2)}</span> / <span className="text-danger">-${Math.abs(stats.averageLoss).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3>Equity Curve</h3>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button style={toggleStyle(equityMode === 'pnl')} onClick={() => setEquityMode('pnl')}>Net P&L</button>
              <button style={toggleStyle(equityMode === 'balance')} onClick={() => setEquityMode('balance')}>Account Balance</button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {activeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{ backgroundColor: 'var(--surface)', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <p className="text-muted" style={{ marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                              {payload[0].payload.name} ({payload[0].payload.date})
                            </p>
                            <p className="mono fw-bold" style={{ color: 'var(--accent)' }}>
                              ${Number(payload[0].value).toFixed(2)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="equity" stroke="var(--accent)" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No closed trades to show equity curve.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-responsive-2" style={{ gap: '2rem' }}>
        {/* Goals Widget */}
        <div className="card animate-slide-up" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Active Goals</h3>
            <Link href="/goals" style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600' }}>Manage &rarr;</Link>
          </div>
          {activeGoals.length === 0 ? (
            <div style={{ padding: '2rem 0', textAlign: 'center' }}>
              <p className="text-muted" style={{ marginBottom: '1rem' }}>No active goals set for this account.</p>
              <Link href="/goals" className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>Set a Goal</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeGoals.map((goal: any) => {
                const prog = goalProgress[goal.id] || { currentPnl: 0, currentWinRate: 0, currentTrades: 0, tradesToday: 0 };
                return (
                  <div key={goal.id} style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span className="fw-bold">{goal.periodType} Target</span>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Ends {new Date(goal.endDate).toLocaleDateString()}</span>
                    </div>
                    {goal.profitTarget && renderProgressBar('Profit ($)', prog.currentPnl, goal.profitTarget)}
                    {goal.maxLoss && renderProgressBar('Max Loss ($)', prog.currentPnl < 0 ? Math.abs(prog.currentPnl) : 0, goal.maxLoss, true)}
                    {goal.targetWinRate && renderProgressBar('Win Rate (%)', prog.currentWinRate, goal.targetWinRate)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Trades Widget */}
        <div className="card animate-slide-up" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0 }}>Recent Trades</h3>
            <Link href="/journal" style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600' }}>View All &rarr;</Link>
          </div>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.9rem', backgroundColor: 'var(--surface-light)' }}>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Ticker</th>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Dir</th>
                  <th style={{ padding: '0.75rem 1.5rem' }}>P&L</th>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((t: any) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }} className="mono fw-bold">{t.ticker.toUpperCase()}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span className={`badge ${t.direction === 'Long' ? 'win' : 'loss'}`}>{t.direction}</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }} className={`mono ${t.pnl && t.pnl >= 0 ? 'text-accent' : t.pnl && t.pnl < 0 ? 'text-danger' : ''}`}>
                      {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${Math.abs(t.pnl).toFixed(2)}` : '--'}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{new Date(t.entryDate).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentTrades.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent trades</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Condensed Insights Widget */}
      {insightsData && !insightsData.insufficient && insightsData.insights?.length > 0 && (
        <div className="card animate-slide-up" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span> AI Insights
            </h3>
            <Link href="/insights" style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600' }}>View All &rarr;</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {insightsData.insights.slice(0, 2).map((insight: any) => (
              <div key={insight.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{insight.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{insight.description}</div>
                </div>
                <div style={{ 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  backgroundColor: insight.severity === 'negative' ? 'rgba(221, 94, 86, 0.1)' : 'rgba(82, 164, 154, 0.1)',
                  color: insight.severity === 'negative' ? 'var(--danger)' : 'var(--success)'
                }}>
                  {insight.stat}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
