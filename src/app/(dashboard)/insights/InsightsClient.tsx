"use client";

import React from 'react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import DashboardLoading from '../dashboard/loading';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function InsightsClient() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('account') || 'all';

  const { data, error, isLoading, mutate } = useSWR(`/api/insights?account=${accountId}`, fetcher);

  if (isLoading) return <DashboardLoading />;
  if (error || !data) return <div className="text-danger" style={{ padding: '2rem' }}>Failed to load insights.</div>;

  if (data.insufficient) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧠</div>
        <h2 style={{ marginBottom: '1rem' }}>Keep Journaling!</h2>
        <p className="text-muted" style={{ maxWidth: '500px', margin: '0 auto', marginBottom: '2rem' }}>
          Our deterministic Insights Engine needs a minimum of 10 closed trades to start finding meaningful patterns in your trading behavior.
        </p>
        <div className="card" style={{ display: 'inline-block', padding: '1.5rem', backgroundColor: 'var(--surface-light)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '0.5rem' }}>
            {data.totalTrades} / 10
          </div>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>Trades Logged</div>
        </div>
      </div>
    );
  }

  const { insights } = data;

  const getIcon = (type: string) => {
    switch (type) {
      case 'Time of Day': return '⏰';
      case 'Day of Week': return '📅';
      case 'Mistake Impact': return '⚠️';
      case 'Setup Performance': return '🎯';
      case 'Playbook Performance': return '📖';
      case 'Overtrading': return '📉';
      case 'Revenge Trading': return '🔥';
      case 'Risk/Reward': return '⚖️';
      default: return '💡';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'positive': return 'var(--success)';
      case 'negative': return 'var(--danger)';
      default: return 'var(--accent)';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'positive': return 'rgba(82, 164, 154, 0.1)';
      case 'negative': return 'rgba(221, 94, 86, 0.1)';
      default: return 'rgba(82, 164, 154, 0.1)';
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>AI Trade Insights</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Data-driven patterns detected from your {data.totalTrades} closed trades.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => mutate()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
          Recalculate
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <p className="text-muted">No statistically significant patterns detected yet. Keep trading your plan!</p>
        </div>
      ) : (
        <div className="grid-responsive-2" style={{ gap: '1.5rem' }}>
          {insights.map((insight: any) => (
            <div key={insight.id} className="card animate-slide-up" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-light)', borderRadius: '8px' }}>
                    {getIcon(insight.type)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{insight.type}</div>
                    <h4 style={{ margin: '0.25rem 0 0 0' }}>{insight.title}</h4>
                  </div>
                </div>
                <div style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  backgroundColor: getSeverityBg(insight.severity),
                  color: getSeverityColor(insight.severity)
                }}>
                  {insight.stat}
                </div>
              </div>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0, flex: 1 }}>
                {insight.description}
              </p>
              {/* Optional: Add a link to Journal filtered by this insight in a future iteration */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
