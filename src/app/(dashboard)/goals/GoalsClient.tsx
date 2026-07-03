"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import DashboardLoading from '../dashboard/loading';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function GoalsClient() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('account');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  // Form State
  const [periodType, setPeriodType] = useState('Monthly');
  const [profitTarget, setProfitTarget] = useState('');
  const [maxLoss, setMaxLoss] = useState('');
  const [targetWinRate, setTargetWinRate] = useState('');
  const [targetTrades, setTargetTrades] = useState('');
  const [maxTradesPerDay, setMaxTradesPerDay] = useState('');

  const { data, error, isLoading, mutate } = useSWR(accountId && accountId !== 'all' ? `/api/goals?account=${accountId}` : null, fetcher);
  const { data: progressData } = useSWR(accountId && accountId !== 'all' ? `/api/goals/progress?account=${accountId}` : null, fetcher);

  if (!accountId || accountId === 'all') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2>Select an Account</h2>
        <p className="text-muted">Goals are tracked per account. Please select a specific trading account from the sidebar.</p>
      </div>
    );
  }

  if (isLoading) return <DashboardLoading />;
  if (error || !data?.success) return <div className="text-danger">Failed to load goals.</div>;

  const goals = data.goals || [];
  const activeGoals = goals.filter((g: any) => g.status === 'Active');
  const archivedGoals = goals.filter((g: any) => g.status === 'Archived');
  const progress = progressData?.progress || {};

  const openNewGoalModal = () => {
    setEditingGoal(null);
    setPeriodType('Monthly');
    setProfitTarget('');
    setMaxLoss('');
    setTargetWinRate('');
    setTargetTrades('');
    setMaxTradesPerDay('');
    setModalOpen(true);
  };

  const openEditModal = (goal: any) => {
    setEditingGoal(goal);
    setPeriodType(goal.periodType);
    setProfitTarget(goal.profitTarget?.toString() || '');
    setMaxLoss(goal.maxLoss?.toString() || '');
    setTargetWinRate(goal.targetWinRate?.toString() || '');
    setTargetTrades(goal.targetTrades?.toString() || '');
    setMaxTradesPerDay(goal.maxTradesPerDay?.toString() || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      accountId,
      periodType,
      profitTarget: profitTarget ? parseFloat(profitTarget) : null,
      maxLoss: maxLoss ? parseFloat(maxLoss) : null,
      targetWinRate: targetWinRate ? parseFloat(targetWinRate) : null,
      targetTrades: targetTrades ? parseInt(targetTrades) : null,
      maxTradesPerDay: maxTradesPerDay ? parseInt(maxTradesPerDay) : null,
    };

    const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals';
    const method = editingGoal ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save');
      setModalOpen(false);
      mutate();
    } catch (err) {
      alert('Failed to save goal.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this goal?')) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      mutate();
    } catch {
      alert('Failed to delete goal.');
    }
  };

  const renderProgressBar = (label: string, current: number, target: number, reverseColors = false) => {
    if (target === null || target === undefined) return null;
    const percent = Math.min(Math.max((current / target) * 100, 0), 100);
    
    let colorClass = 'var(--accent)'; // default green
    if (reverseColors) {
      // For max loss or max trades
      if (percent > 90) colorClass = 'var(--danger)';
      else if (percent > 70) colorClass = 'var(--warning)';
    } else {
      // For profit or win rate
      if (percent < 30) colorClass = 'var(--danger)';
      else if (percent < 70) colorClass = 'var(--warning)';
    }

    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          <span className="text-muted">{label}</span>
          <span className="mono fw-bold">{current.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {target.toLocaleString()}</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${percent}%`, backgroundColor: colorClass, transition: 'width 0.3s ease' }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Trading Goals</h2>
        <button className="btn btn-primary" onClick={openNewGoalModal}>Create Goal</button>
      </div>

      <div className="grid-responsive-2" style={{ gap: '2rem', marginBottom: '3rem' }}>
        {activeGoals.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem' }}>
            <p className="text-muted">No active goals. Set a monthly or weekly target to track your progress!</p>
          </div>
        ) : (
          activeGoals.map((goal: any) => {
            const prog = progress[goal.id] || { currentPnl: 0, currentWinRate: 0, currentTrades: 0, tradesToday: 0 };
            return (
              <div key={goal.id} className="card animate-slide-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {goal.periodType} Goal 
                      <span className="badge" style={{ backgroundColor: 'var(--accent)', color: '#000' }}>Active</span>
                    </h3>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => openEditModal(goal)}>Edit</button>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  {goal.profitTarget && renderProgressBar('Profit Target ($)', prog.currentPnl, goal.profitTarget)}
                  {goal.maxLoss && renderProgressBar('Max Loss Limit ($)', prog.currentPnl < 0 ? Math.abs(prog.currentPnl) : 0, goal.maxLoss, true)}
                  {goal.targetWinRate && renderProgressBar('Win Rate (%)', prog.currentWinRate, goal.targetWinRate)}
                  {goal.targetTrades && renderProgressBar('Target Trade Volume', prog.currentTrades, goal.targetTrades)}
                  {goal.maxTradesPerDay && renderProgressBar('Max Trades Per Day (Today)', prog.tradesToday, goal.maxTradesPerDay, true)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Goal History</h3>
      {archivedGoals.length === 0 ? (
        <p className="text-muted">No past goals found.</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--surface-light)' }}>
                  <th style={{ padding: '1rem' }}>Period</th>
                  <th style={{ padding: '1rem' }}>Start</th>
                  <th style={{ padding: '1rem' }}>End</th>
                  <th style={{ padding: '1rem' }}>Profit Target</th>
                  <th style={{ padding: '1rem' }}>Max Loss</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {archivedGoals.map((g: any) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>{g.periodType}</td>
                    <td style={{ padding: '1rem' }}>{new Date(g.startDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>{new Date(g.endDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }} className="mono">{g.profitTarget ? `$${g.profitTarget}` : '--'}</td>
                    <td style={{ padding: '1rem' }} className="mono">{g.maxLoss ? `$${g.maxLoss}` : '--'}</td>
                    <td style={{ padding: '1rem' }}><span className="badge" style={{ backgroundColor: 'var(--border)' }}>Archived</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-pop-in" style={{ maxWidth: '500px', width: '100%', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Period Type</label>
                <select className="form-select" value={periodType} onChange={e => setPeriodType(e.target.value)} required disabled={!!editingGoal}>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Goals auto-renew at the end of their period.</p>
              </div>

              <div className="grid-responsive-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Profit Target ($)</label>
                  <input type="number" step="0.01" className="form-input" value={profitTarget} onChange={e => setProfitTarget(e.target.value)} placeholder="e.g. 1000" />
                </div>
                <div>
                  <label className="form-label">Max Acceptable Loss ($)</label>
                  <input type="number" step="0.01" className="form-input" value={maxLoss} onChange={e => setMaxLoss(e.target.value)} placeholder="e.g. 500" />
                </div>
                <div>
                  <label className="form-label">Target Win Rate (%)</label>
                  <input type="number" step="0.1" className="form-input" value={targetWinRate} onChange={e => setTargetWinRate(e.target.value)} placeholder="e.g. 60" />
                </div>
                <div>
                  <label className="form-label">Target Trade Count</label>
                  <input type="number" className="form-input" value={targetTrades} onChange={e => setTargetTrades(e.target.value)} placeholder="e.g. 20" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Max Trades Per Day</label>
                  <input type="number" className="form-input" value={maxTradesPerDay} onChange={e => setMaxTradesPerDay(e.target.value)} placeholder="e.g. 3 (combats overtrading)" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                {editingGoal && (
                  <button type="button" className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => handleDelete(editingGoal.id)}>Archive</button>
                )}
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
