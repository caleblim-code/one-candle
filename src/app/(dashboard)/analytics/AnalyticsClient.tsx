"use client";

import { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceArea } from 'recharts';

import useSWR from 'swr';
import DashboardLoading from '../dashboard/loading';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Helper: returns YYYY-MM-DD in the user's local timezone (avoids UTC shift from toISOString)
const toLocalDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AnalyticsClient({ accountId }: { accountId: string }) {
  const { data, error, isLoading } = useSWR(`/api/analytics/data?account=${accountId}`, fetcher);

  const [filterDate, setFilterDate] = useState('All');
  const [filterAsset, setFilterAsset] = useState('All');
  const [filterSetup, setFilterSetup] = useState('All');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [equityMode, setEquityMode] = useState<'pnl' | 'balance'>('pnl');

  const initialTrades = data?.trades || [];
  const initialJournals = data?.journals || [];
  const accountBalance = data?.accountBalance || 0;
  const transactions = data?.transactions || [];

  // Extract unique filter options
  const assetClasses = Array.from(new Set(initialTrades.map((t: any) => t.assetClass))).filter(Boolean);
  const setupTags = Array.from(new Set(initialTrades.map((t: any) => t.setupTag))).filter(Boolean);

  // 1. Filtered Trades (sorted chronologically)
  const trades = useMemo(() => {
    return initialTrades
      .filter((t: any) => {
        if (filterAsset !== 'All' && t.assetClass !== filterAsset) return false;
        if (filterSetup !== 'All' && t.setupTag !== filterSetup) return false;
        if (filterDate !== 'All') {
          const tradeDate = new Date(t.entryDate);
          const now = new Date();
          if (filterDate === 'This Month') {
            if (tradeDate.getMonth() !== now.getMonth() || tradeDate.getFullYear() !== now.getFullYear()) return false;
          }
          if (filterDate === 'This Year') {
            if (tradeDate.getFullYear() !== now.getFullYear()) return false;
          }
        }
        return true;
      })
      .sort((a: any, b: any) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
  }, [initialTrades, filterAsset, filterSetup, filterDate]);

  // 2. Top-Level Stats
  const stats = useMemo(() => {
    let grossProfit = 0;
    let grossLoss = 0;
    let wins = 0;
    let losses = 0;
    let largestWin = 0;
    let largestLoss = 0;
    let totalR = 0;
    let rCount = 0;

    trades.forEach((t: any) => {
      const pnl = t.pnl || 0;
      if (pnl > 0) {
        grossProfit += pnl;
        wins++;
        if (pnl > largestWin) largestWin = pnl;
      } else if (pnl < 0) {
        grossLoss += Math.abs(pnl);
        losses++;
        if (pnl < largestLoss) largestLoss = pnl;
      }

      // R-Multiple calculation based on price distance
      if (t.stopLoss && t.entryPrice && t.exitPrice) {
        let risk = 0;
        let reward = 0;
        if (t.direction === 'Long') {
          risk = t.entryPrice - t.stopLoss;
          reward = t.exitPrice - t.entryPrice;
        } else {
          risk = t.stopLoss - t.entryPrice;
          reward = t.entryPrice - t.exitPrice;
        }
        if (risk > 0) {
          const rMultiple = reward / risk;
          totalR += rMultiple;
          rCount++;
        }
      }
    });

    const netPnl = grossProfit - grossLoss;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const avgR = rCount > 0 ? totalR / rCount : 0;
    const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;

    return { netPnl, winRate, profitFactor, avgWin, avgLoss, avgR, total: trades.length, largestWin, largestLoss, expectancy };
  }, [trades]);

  // 3. Chart Data Preparations
  const equityData = useMemo(() => {
    let cumulative = 0;
    const sortedTrades = [...trades].sort((a, b) => {
      const dateA = a.exitDate ? new Date(a.exitDate).getTime() : new Date(a.entryDate).getTime();
      const dateB = b.exitDate ? new Date(b.exitDate).getTime() : new Date(b.entryDate).getTime();
      return dateA - dateB;
    });
    return sortedTrades.map((t: any, i: number) => {
      cumulative += (t.pnl || 0);
      const displayDate = t.exitDate ? t.exitDate : t.entryDate;
      return {
        name: `Trade ${i + 1}`,
        date: new Date(displayDate).toLocaleDateString(),
        equity: cumulative,
        pnl: t.pnl || 0
      };
    });
  }, [trades]);

  const balanceEquityData = useMemo(() => {
    if (!equityData || equityData.length === 0) return [];
    const events: { name: string; date: string; sortDate: Date; pnl: number; txAmount: number }[] = [];
    
    equityData.forEach((d: any) => {
      events.push({ name: d.name, date: d.date, sortDate: new Date(d.date), pnl: d.pnl, txAmount: 0 });
    });
    
    transactions.forEach((tx: any) => {
      const dateStr = new Date(tx.date).toLocaleDateString();
      const amt = tx.type === 'Deposit' ? tx.amount : -tx.amount;
      events.push({ name: tx.type, date: dateStr, sortDate: new Date(tx.date), pnl: 0, txAmount: amt });
    });
    
    events.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
    
    let equity = accountBalance || 0;
    const result = [{ name: 'Start', date: 'Start', equity }];
    events.forEach(e => {
      equity += e.pnl + e.txAmount;
      result.push({ name: e.name, date: e.date, equity });
    });
    return result;
  }, [equityData, transactions, accountBalance]);

  const activeEquityData = useMemo(() => {
    const baseData = equityMode === 'pnl' ? equityData : balanceEquityData;
    return baseData.map((d, index) => ({ ...d, index }));
  }, [equityMode, equityData, balanceEquityData]);

  const maxDrawdown = useMemo(() => {
    let peak = activeEquityData[0]?.equity || 0;
    let peakIndex = activeEquityData[0]?.index || 0;
    
    let currentPeak = peak;
    let currentPeakIndex = peakIndex;

    let maxDd = 0;
    let ddStart = 0;
    let ddEnd = 0;

    activeEquityData.forEach(d => {
      if (d.equity > currentPeak) {
        currentPeak = d.equity;
        currentPeakIndex = d.index;
      }
      
      const dd = currentPeak - d.equity;
      if (dd > maxDd) {
        maxDd = dd;
        ddStart = currentPeakIndex;
        ddEnd = d.index;
      }
    });
    return { value: maxDd, start: ddStart, end: ddEnd };
  }, [activeEquityData]);

  const pnlByPeriodData = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach((t: any) => {
      const d = new Date(t.entryDate).toLocaleDateString();
      map.set(d, (map.get(d) || 0) + (t.pnl || 0));
    });
    return Array.from(map.entries()).map(([date, pnl]) => ({ date, pnl }));
  }, [trades]);

  const winRateBySetupData = useMemo(() => {
    const map = new Map<string, { wins: number; total: number }>();
    trades.forEach((t: any) => {
      const tag = t.setupTag || 'None';
      const stat = map.get(tag) || { wins: 0, total: 0 };
      stat.total++;
      if ((t.pnl || 0) > 0) stat.wins++;
      map.set(tag, stat);
    });
    return Array.from(map.entries()).map(([name, stat]) => ({
      name,
      winRate: (stat.wins / stat.total) * 100,
      total: stat.total
    })).sort((a, b) => b.total - a.total);
  }, [trades]);

  const pnlByDowData = useMemo(() => {
    const map = new Map<number, number>();
    trades.forEach((t: any) => {
      const day = new Date(t.entryDate).getDay();
      map.set(day, (map.get(day) || 0) + (t.pnl || 0));
    });
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from(map.entries()).map(([day, pnl]) => ({ day: days[day], pnl, sort: day })).sort((a, b) => a.sort - b.sort);
  }, [trades]);

  const pnlByTodData = useMemo(() => {
    const map = new Map<number, number>();
    trades.forEach((t: any) => {
      const hour = new Date(t.entryDate).getHours();
      map.set(hour, (map.get(hour) || 0) + (t.pnl || 0));
    });
    return Array.from(map.entries()).map(([hour, pnl]) => ({ hour: `${hour}:00`, pnl, sort: hour })).sort((a, b) => a.sort - b.sort);
  }, [trades]);

  const longShortData = useMemo(() => {
    let longPnl = 0;
    let shortPnl = 0;

    trades.forEach((t: any) => {
      const pnl = t.pnl || 0;
      if (t.direction === 'Long') {
        longPnl += pnl;
      } else if (t.direction === 'Short') {
        shortPnl += pnl;
      }
    });

    return [
      { name: 'Long', pnl: longPnl },
      { name: 'Short', pnl: shortPnl }
    ];
  }, [trades]);

  const sessionData = useMemo(() => {
    let sydneyPnl = 0;
    let tokyoPnl = 0;
    let londonPnl = 0;
    let nyPnl = 0;

    trades.forEach((t: any) => {
      const pnl = t.pnl || 0;
      const hour = new Date(t.entryDate).getUTCHours();
      if (hour >= 21 && hour < 23) sydneyPnl += pnl;
      else if (hour >= 23 || hour < 7) tokyoPnl += pnl;
      else if (hour >= 7 && hour < 12) londonPnl += pnl;
      else if (hour >= 12 && hour < 21) nyPnl += pnl;
    });

    return [
      { name: 'Sydney', pnl: sydneyPnl },
      { name: 'Tokyo', pnl: tokyoPnl },
      { name: 'London', pnl: londonPnl },
      { name: 'New York', pnl: nyPnl }
    ];
  }, [trades]);

  const mistakeData = useMemo(() => {
    const map = new Map<string, { count: number, pnlImpact: number }>();
    trades.forEach((t: any) => {
      if (t.mistakeTags) {
        t.mistakeTags.split(',').forEach((tag: string) => {
          const tName = tag.trim();
          if (!tName) return;
          const stat = map.get(tName) || { count: 0, pnlImpact: 0 };
          stat.count++;
          stat.pnlImpact += (t.pnl || 0);
          map.set(tName, stat);
        });
      }
    });
    return Array.from(map.entries()).map(([name, stat]) => ({ name, ...stat })).sort((a, b) => b.count - a.count);
  }, [trades]);

  const mentalStateData = useMemo(() => {
    const map = new Map<string, { count: number, pnl: number }>();
    
    // Create a map of date string -> mental states
    const journalMap = new Map<string, string[]>();
    initialJournals.forEach((j: any) => {
      if (j.mentalState) {
        journalMap.set(j.date, j.mentalState.split(',').map((s: string) => s.trim()).filter(Boolean));
      }
    });

    trades.forEach((t: any) => {
      const dString = toLocalDateStr(new Date(t.entryDate));
      const states = journalMap.get(dString) || ['Untagged'];
      
      states.forEach(state => {
        const existing = map.get(state) || { count: 0, pnl: 0 };
        existing.count++;
        existing.pnl += (t.pnl || 0);
        map.set(state, existing);
      });
    });

    return Array.from(map.entries()).map(([name, stat]) => ({ name, ...stat })).sort((a, b) => b.pnl - a.pnl);
  }, [trades, initialJournals]);

  // Calendar grouping — uses exitDate (when the trade result was realized)
  const calendarTrades = useMemo(() => {
    return initialTrades.filter((t: any) => {
      if (!t.exitDate) return false; // Only closed trades with an exit date
      if (filterAsset !== 'All' && t.assetClass !== filterAsset) return false;
      if (filterSetup !== 'All' && t.setupTag !== filterSetup) return false;
      return true;
    });
  }, [initialTrades, filterAsset, filterSetup]);

  const calendarData = useMemo(() => {
    const map = new Map<string, { pnl: number, trades: any[] }>();
    calendarTrades.forEach((t: any) => {
      const dString = toLocalDateStr(new Date(t.exitDate));
      const existing = map.get(dString) || { pnl: 0, trades: [] };
      existing.pnl += (t.pnl || 0);
      existing.trades.push(t);
      map.set(dString, existing);
    });
    return map;
  }, [calendarTrades]);

  const getCalendarGrid = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    
    let firstDay = new Date(year, month, 1).getDay();
    if (firstDay === 0) firstDay = 7; 
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const grid = [];
    
    const prevPadding = firstDay - 1; 
    for (let i = prevPadding; i > 0; i--) {
      const pDay = prevMonthDays - i + 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonth = month === 0 ? 12 : month;
      const dStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
      grid.push({ date: dStr, day: pDay, data: null, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      grid.push({ date: dStr, day: i, data: calendarData.get(dStr) || null, isCurrentMonth: true });
    }
    
    const remainder = grid.length % 7;
    if (remainder !== 0) {
      const nextPadding = 7 - remainder;
      for (let i = 1; i <= nextPadding; i++) {
        const nextYear = month === 11 ? year + 1 : year;
        const nextMonth = month === 11 ? 1 : month + 2;
        const dStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        grid.push({ date: dStr, day: i, data: null, isCurrentMonth: false });
      }
    }
    return grid;
  };

  const calendarMonthlyStats = useMemo(() => {
    let pnl = 0;
    let daysWithTrades = 0;
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = calendarData.get(dStr);
      if (dayData && dayData.trades.length > 0) {
        daysWithTrades++;
        pnl += dayData.pnl;
      }
    }
    return { pnl, daysWithTrades };
  }, [calendarData, calendarViewDate]);

  const COLORS = ['#52A49A', '#DD5E56'];

  const CustomTooltip = ({ active, payload, label, formatterType }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--surface)', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <p className="text-muted" style={{ marginBottom: '0.25rem', fontSize: '0.8rem' }}>
            {payload[0].payload.name ? `${payload[0].payload.name} (${payload[0].payload.date || label})` : (label || payload[0].payload.date)}
          </p>
          <p className="mono fw-bold" style={{ color: payload[0].value >= 0 ? 'var(--accent)' : (formatterType === 'percent' ? 'var(--accent)' : 'var(--danger)') }}>
            {formatterType === 'percent' ? `${payload[0].value.toFixed(1)}%` : `$${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (error) return <div className="text-danger" style={{ padding: '2rem' }}>Failed to load analytics data.</div>;
  if (isLoading) return <DashboardLoading />;
  if (!data || !data.success) return <DashboardLoading />;

  if (initialTrades.length === 0) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        </div>
        <h2>Not Enough Data Yet</h2>
        <p className="text-muted" style={{ marginTop: '0.5rem', marginBottom: '2rem', maxWidth: '400px' }}>Your analytics engine needs data to run. Log your trades to unlock deep insights, profitability heatmaps, and performance breakdowns.</p>
        <a href="/add-trade" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Log a Trade</a>
      </div>
    );
  }

  const statCardStyle = { padding: '1.5rem', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Analytics Engine</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            <option value="All">All Time</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
          <select className="form-input" value={filterAsset} onChange={e => setFilterAsset(e.target.value)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            <option value="All">All Assets</option>
            {assetClasses.map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
          </select>
          <select className="form-input" value={filterSetup} onChange={e => setFilterSetup(e.target.value)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            <option value="All">All Setups</option>
            {setupTags.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
          </select>
        </div>
      </div>

      {/* Top Level Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Net P&L</span>
          <span className={`mono fw-bold ${stats.netPnl >= 0 ? 'text-accent' : 'text-danger'}`} style={{ fontSize: '1.5rem' }}>
            {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toFixed(2)}
          </span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Win Rate</span>
          <span className="mono fw-bold" style={{ fontSize: '1.5rem', color: stats.winRate >= 50 ? 'var(--accent)' : 'var(--danger)' }}>
            {stats.winRate.toFixed(1)}%
          </span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Profit Factor</span>
          <span className="mono fw-bold" style={{ fontSize: '1.5rem' }}>{stats.profitFactor.toFixed(2)}</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Avg Win</span>
          <span className="mono fw-bold text-accent" style={{ fontSize: '1.5rem' }}>+${stats.avgWin.toFixed(2)}</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Avg Loss</span>
          <span className="mono fw-bold text-danger" style={{ fontSize: '1.5rem' }}>-${Math.abs(stats.avgLoss).toFixed(2)}</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Avg R-Multiple</span>
          <span className="mono fw-bold" style={{ fontSize: '1.5rem', color: stats.avgR >= 1 ? 'var(--accent)' : 'var(--text-main)' }}>
            {stats.avgR.toFixed(2)}R
          </span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Expectancy</span>
          <span className="mono fw-bold" style={{ fontSize: '1.5rem', color: stats.expectancy >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
            {stats.expectancy >= 0 ? '+' : ''}${stats.expectancy.toFixed(2)}
          </span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Total Trades</span>
          <span className="mono fw-bold" style={{ fontSize: '1.5rem' }}>{stats.total}</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Largest Win</span>
          <span className="mono fw-bold text-accent" style={{ fontSize: '1.5rem' }}>+${stats.largestWin.toFixed(2)}</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Largest Loss</span>
          <span className="mono fw-bold text-danger" style={{ fontSize: '1.5rem' }}>${stats.largestLoss.toFixed(2)}</span>
        </div>
        <div className="card" style={statCardStyle}>
          <span className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Max Drawdown</span>
          <span className="mono fw-bold text-danger" style={{ fontSize: '1.5rem' }}>-${maxDrawdown.value.toFixed(2)}</span>
        </div>
      </div>

      {/* Main Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3>Cumulative Equity Curve</h3>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: equityMode === 'pnl' ? 'bold' : 'normal', backgroundColor: equityMode === 'pnl' ? 'var(--accent)' : 'transparent', color: equityMode === 'pnl' ? 'white' : 'var(--text-muted)', border: equityMode === 'pnl' ? '1px solid var(--accent)' : '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', transition: 'all 150ms ease' }} onClick={() => setEquityMode('pnl')}>Net P&L</button>
              <button style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: equityMode === 'balance' ? 'bold' : 'normal', backgroundColor: equityMode === 'balance' ? 'var(--accent)' : 'transparent', color: equityMode === 'balance' ? 'white' : 'var(--text-muted)', border: equityMode === 'balance' ? '1px solid var(--accent)' : '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', transition: 'all 150ms ease' }} onClick={() => setEquityMode('balance')}>Account Balance</button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeEquityData} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="index" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickFormatter={(val) => activeEquityData[val]?.date || ''} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                {maxDrawdown.value > 0 && maxDrawdown.start !== undefined && maxDrawdown.end !== undefined && (
                  <ReferenceArea x1={maxDrawdown.start} x2={maxDrawdown.end} strokeOpacity={0} fill="var(--danger)" fillOpacity={0.15} />
                )}
                <Area type="monotone" dataKey="equity" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Daily P&L Bars */}
        <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Daily Net P&L</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlByPeriodData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {pnlByPeriodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--accent)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by Setup */}
        <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Win Rate by Setup</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winRateBySetupData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip formatterType="percent" />} />
                <Bar dataKey="winRate" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* P&L by Time of Day */}
        <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>P&L by Time of Day (Hour)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlByTodData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {pnlByTodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--accent)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mistake Frequency */}
        <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Mistake Frequency</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mistakeData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ backgroundColor: 'var(--surface)', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <p className="text-muted" style={{ marginBottom: '0.25rem', fontSize: '0.8rem' }}>{label}</p>
                        <p className="mono fw-bold">Occurrences: {payload[0].value}</p>
                        <p className="mono fw-bold text-danger">P&L Impact: ${payload[0].payload.pnlImpact.toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="count" fill="var(--danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Tertiary Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* P&L by Mental State */}
        <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>P&L by Mental State (Daily Tags)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mentalStateData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ backgroundColor: 'var(--surface)', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <p className="text-muted" style={{ marginBottom: '0.25rem', fontSize: '0.8rem' }}>{label}</p>
                        <p className="mono fw-bold">Trades: {payload[0].payload.count}</p>
                        <p className={`mono fw-bold ${payload[0].value >= 0 ? 'text-accent' : 'text-danger'}`}>
                          P&L: {payload[0].value >= 0 ? '+' : ''}${payload[0].value.toFixed(2)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {mentalStateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--accent)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Long vs Short Performance */}
        <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Long vs Short Performance</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={longShortData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {longShortData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--accent)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trading Sessions Performance */}
        <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Trading Sessions Performance</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {sessionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--accent)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Calendar View (FTMO Style) */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Calendar Header Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-ghost" style={{ border: '1px solid var(--border)', padding: '0.4rem 1rem' }} onClick={() => setCalendarViewDate(new Date())}>Today</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border)' }} onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}>
                &lt;
              </button>
              <h3 style={{ margin: '0 1rem', minWidth: '130px', textAlign: 'center' }}>
                {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border)' }} onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))}>
                &gt;
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem' }}>
            <span className="text-muted fw-bold">Monthly stats:</span>
            <span className="mono fw-bold" style={{ backgroundColor: calendarMonthlyStats.pnl >= 0 ? '#e4f6ed' : '#fbe4e6', color: calendarMonthlyStats.pnl >= 0 ? '#00c853' : '#ff3b30', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              {calendarMonthlyStats.pnl >= 0 ? '+' : ''}${calendarMonthlyStats.pnl.toFixed(2)}
            </span>
            <span className="text-muted" style={{ backgroundColor: 'var(--surface-light)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Trading days: {calendarMonthlyStats.daysWithTrades}
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '800px', backgroundColor: 'var(--surface)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                <div key={d} style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.8rem', borderRight: '1px solid var(--border)' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {getCalendarGrid().map((cell, idx) => {
                // Ensure local time matches the date logic
                const t = new Date();
                const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
                const isToday = cell.date === todayStr;
                const hasData = cell.isCurrentMonth && cell.data && cell.data.trades.length > 0;
                const isPositive = cell.data && cell.data.pnl >= 0;
                
                let cellClass = 'calendar-cell-empty';
                if (!cell.isCurrentMonth) cellClass = 'calendar-cell-inactive';
                else if (hasData) cellClass = isPositive ? 'calendar-cell-success' : 'calendar-cell-danger';

                return (
                  <div 
                    key={idx} 
                    onClick={() => hasData && setSelectedDate(cell.date)}
                    className={cellClass}
                    style={{ 
                      minHeight: '120px', 
                      padding: '0.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      cursor: hasData ? 'pointer' : 'default',
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      opacity: cell.isCurrentMonth ? 1 : 0.5
                    }}
                  >
                    <div style={{ marginBottom: 'auto', padding: '0.2rem' }}>
                      <span className={isToday ? 'calendar-today-badge' : ''} style={{ fontSize: '0.9rem', color: cell.isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isToday ? 'bold' : 'normal', padding: isToday ? '0' : '0.2rem' }}>
                        {cell.day}
                      </span>
                    </div>
                    {hasData && (
                      <div style={{ marginTop: '0.5rem', lineHeight: '1.4' }}>
                        <div className="mono fw-bold" style={{ color: isPositive ? '#00c853' : '#ff3b30', fontSize: '1rem' }}>
                          {isPositive ? '+' : ''}${cell.data!.pnl.toFixed(2)}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                          Trades: {cell.data!.trades.length}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel for Day Details */}
      {selectedDate && (
        <>
          <div 
            onClick={() => setSelectedDate(null)}
            className="animate-fade-in"
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }}
          ></div>
          <div 
            className="animate-slide-up" // Using slide up for now, could be slide-left if we had keyframes for it
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px', backgroundColor: 'var(--surface)', borderLeft: '1px solid var(--border)', zIndex: 101, padding: '2rem', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3>Trades on {selectedDate}</h3>
              <button className="btn btn-ghost" onClick={() => setSelectedDate(null)}>Close</button>
            </div>
            
            {calendarData.get(selectedDate)?.trades.map((t: any) => (
              <div key={t.id} className="card" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--surface-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="mono fw-bold">{t.ticker.toUpperCase()}</span>
                  <span className={`mono fw-bold ${t.pnl >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  <span className={`badge ${t.direction === 'Long' ? 'win' : 'loss'}`}>{t.direction}</span>
                  {t.setupTag && <span className="badge" style={{ backgroundColor: 'var(--bg-color)' }}>{t.setupTag}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add a tiny hover-scale style dynamically */}
      <style dangerouslySetInnerHTML={{__html: `
        .hover-scale:hover { transform: scale(1.02); }
      `}} />

    </div>
  );
}
