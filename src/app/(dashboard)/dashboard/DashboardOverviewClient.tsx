"use client";

import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import DashboardLoading from './loading';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardOverviewClient({ accountId }: { accountId: string }) {
  const { data, error, isLoading } = useSWR(`/api/dashboard/stats?account=${accountId}`, fetcher);

  if (error) return <div className="text-danger" style={{ padding: '2rem' }}>Failed to load dashboard data.</div>;
  if (isLoading) return <DashboardLoading />;
  
  if (!data || !data.success) return <DashboardLoading />;

  const { stats, chartData, recentTrades } = data;

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
          <h3 style={{ marginBottom: '1.5rem' }}>Equity Curve</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
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

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Recent Trades</h3>
          <Link href="/journal" style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600' }}>View All &rarr;</Link>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <th style={{ padding: '0.75rem 0' }}>Ticker</th>
              <th style={{ padding: '0.75rem 0' }}>Dir</th>
              <th style={{ padding: '0.75rem 0' }}>P&L</th>
              <th style={{ padding: '0.75rem 0' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentTrades.map((t: any) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 0' }} className="mono fw-bold">{t.ticker.toUpperCase()}</td>
                <td style={{ padding: '1rem 0' }}>
                  <span className={`badge ${t.direction === 'Long' ? 'win' : 'loss'}`}>{t.direction}</span>
                </td>
                <td style={{ padding: '1rem 0' }} className={`mono ${t.pnl && t.pnl >= 0 ? 'text-accent' : t.pnl && t.pnl < 0 ? 'text-danger' : ''}`}>
                  {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${Math.abs(t.pnl).toFixed(2)}` : '--'}
                </td>
                <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{new Date(t.entryDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
