"use client";

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsClient({ trades }: { trades: any[] }) {
  
  // Calculate P&L by Asset Class
  const assetData = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach(t => {
      map.set(t.assetClass, (map.get(t.assetClass) || 0) + (t.pnl || 0));
    });
    return Array.from(map.entries()).map(([name, pnl]) => ({ name, pnl }));
  }, [trades]);

  // Calculate Win Rate by Day of Week
  const dowData = useMemo(() => {
    const map = new Map<number, { wins: number; total: number }>();
    trades.forEach(t => {
      const day = new Date(t.entryDate).getDay(); // 0 is Sunday
      const stats = map.get(day) || { wins: 0, total: 0 };
      stats.total += 1;
      if (t.pnl > 0) stats.wins += 1;
      map.set(day, stats);
    });
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from(map.entries())
      .map(([day, stats]) => ({
        day: days[day],
        winRate: (stats.wins / stats.total) * 100,
        sort: day
      }))
      .sort((a, b) => a.sort - b.sort);
  }, [trades]);

  // Long vs Short Pie Chart
  const directionData = useMemo(() => {
    let longPnl = 0, shortPnl = 0;
    trades.forEach(t => {
      if (t.direction === 'Long') longPnl += (t.pnl || 0);
      if (t.direction === 'Short') shortPnl += (t.pnl || 0);
    });
    return [
      { name: 'Long', value: Math.abs(longPnl) },
      { name: 'Short', value: Math.abs(shortPnl) }
    ];
  }, [trades]);
  const COLORS = ['#00E054', '#FF453A'];

  if (trades.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2 style={{ marginBottom: '1rem' }}>No Data Yet</h2>
        <p className="text-muted">You need to log some closed trades to see analytics.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--surface)', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <p className="text-muted" style={{ marginBottom: '0.25rem', fontSize: '0.8rem' }}>{label || payload[0].name}</p>
          <p className="mono fw-bold" style={{ color: payload[0].value >= 0 ? 'var(--accent)' : 'var(--text-main)' }}>
            {payload[0].name === 'winRate' ? `${payload[0].value.toFixed(1)}%` : `$${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem' }}>Detailed Analytics</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Asset Class P&L */}
        <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Net P&L by Asset Class</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--accent)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by DOW */}
        <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Win Rate by Day of Week</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="winRate" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Long vs Short */}
        <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Gross P&L: Long vs Short</h3>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={directionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {directionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: COLORS[0], borderRadius: '2px' }}></div>
                <span>Long</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: COLORS[1], borderRadius: '2px' }}></div>
                <span>Short</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
