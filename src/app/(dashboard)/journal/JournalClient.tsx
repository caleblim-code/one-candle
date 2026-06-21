"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import DashboardLoading from '../dashboard/loading';
import TradeImages from './TradeImages';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function JournalClient({ accountId }: { accountId: string }) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsset, setFilterAsset] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR(`/api/trades?account=${accountId}&page=${page}&limit=50`, fetcher);

  if (error) return <div className="text-danger" style={{ padding: '2rem' }}>Failed to load journal.</div>;
  if (isLoading) return <DashboardLoading />;
  
  if (!data || !data.success) return <DashboardLoading />;

  const serverTrades = data.trades || [];
  const totalPages = data.totalPages || 1;

  // Client side filters (filtering current page only for now, sufficient for phase 1)
  const filteredTrades = serverTrades.filter((t: any) => {
    const matchesSearch = t.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAsset = filterAsset === 'All' || t.assetClass === filterAsset;
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesAsset && matchesStatus;
  });

  const confirmDelete = (id: string) => {
    setTradeToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!tradeToDelete) return;
    
    setDeleteModalOpen(false);
    
    try {
      const res = await fetch(`/api/trades/${tradeToDelete}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      mutate(); // re-fetch after delete
    } catch (err) {
      alert('Failed to delete trade.');
    } finally {
      setTradeToDelete(null);
    }
  };

  if (serverTrades.length === 0 && page === 1) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📉</div>
        <h2 style={{ marginBottom: '1rem' }}>No trades yet</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>You haven't logged any trades. Get started by adding your first trade.</p>
        <Link href="/add-trade" className="btn btn-primary">Add Your First Trade</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Journal</h2>
        <Link href="/add-trade" className="btn btn-primary">Add Trade</Link>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search ticker..." 
            className="form-input" 
            style={{ width: '200px' }} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
          <select className="form-select" style={{ width: '150px' }} value={filterAsset} onChange={e => setFilterAsset(e.target.value)}>
            <option value="All">All Assets</option>
            <option value="Stocks">Stocks</option>
            <option value="Options">Options</option>
            <option value="Forex">Forex</option>
            <option value="Futures">Futures</option>
            <option value="Crypto">Crypto</option>
          </select>
          <select className="form-select" style={{ width: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--surface-light)' }}>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Ticker</th>
              <th style={{ padding: '1rem' }}>Direction</th>
              <th style={{ padding: '1rem' }}>Entry</th>
              <th style={{ padding: '1rem' }}>Exit</th>
              <th style={{ padding: '1rem' }}>Size</th>
              <th style={{ padding: '1rem' }}>P&L</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map((trade: any) => (
              <React.Fragment key={trade.id}>
                <tr 
                  onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', backgroundColor: expandedId === trade.id ? 'var(--surface-light)' : 'transparent' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--surface-light)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = expandedId === trade.id ? 'var(--surface-light)' : 'transparent'}
                >
                  <td style={{ padding: '1rem' }}>{new Date(trade.entryDate).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }} className="mono fw-bold">{trade.ticker.toUpperCase()}</td>
                  <td style={{ padding: '1rem' }}><span className={`badge ${trade.direction === 'Long' ? 'win' : 'loss'}`}>{trade.direction}</span></td>
                  <td style={{ padding: '1rem' }} className="mono">${trade.entryPrice.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }} className="mono">{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '--'}</td>
                  <td style={{ padding: '1rem' }} className="mono">{trade.positionSize}</td>
                  <td style={{ padding: '1rem' }} className={`mono ${trade.pnl && trade.pnl >= 0 ? 'text-accent' : trade.pnl && trade.pnl < 0 ? 'text-danger' : ''}`}>
                    {trade.pnl !== null ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '--'}
                  </td>
                  <td style={{ padding: '1rem' }}><span style={{ color: trade.status === 'Open' ? 'var(--accent)' : 'var(--text-muted)' }}>{trade.status}</span></td>
                </tr>
                {expandedId === trade.id && (
                  <tr>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <div className="animate-slide-up" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-light)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                          <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Trade Details</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><span className="text-muted">Broker Trade ID:</span> <span className="mono">{trade.brokerTradeId || '--'}</span></div>
                            <div><span className="text-muted">Asset Class:</span> {trade.assetClass}</div>
                            <div><span className="text-muted">Entry Time:</span> {new Date(trade.entryDate).toLocaleTimeString()}</div>
                            <div><span className="text-muted">Exit Time:</span> {trade.exitDate ? new Date(trade.exitDate).toLocaleTimeString() : '--'}</div>
                            <div><span className="text-muted">Stop Loss:</span> <span className="mono">{trade.stopLoss ? `$${trade.stopLoss}` : '--'}</span></div>
                            <div><span className="text-muted">Take Profit:</span> <span className="mono">{trade.takeProfit ? `$${trade.takeProfit}` : '--'}</span></div>
                            <div><span className="text-muted">Fees / Swap:</span> <span className="mono">${trade.fees}</span></div>
                            <div><span className="text-muted">Setup:</span> {trade.setupTag || '--'}</div>
                            <div style={{ gridColumn: '1 / -1' }}><span className="text-muted">Playbook:</span> {trade.playbook ? <span style={{ color: 'var(--accent)' }}>{trade.playbook.name}</span> : '--'}</div>
                          </div>
                          
                          {trade.mistakeTags && (
                            <div style={{ marginTop: '1rem' }}>
                              <span className="text-muted">Mistakes: </span>
                              {trade.mistakeTags.split(',').map((tag: string) => (
                                <span key={tag} className="badge loss" style={{ marginRight: '0.5rem' }}>{tag.trim()}</span>
                              ))}
                            </div>
                          )}

                          <TradeImages tradeId={trade.id} />
                        </div>
                        <div>
                          <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Notes</h4>
                          <p style={{ whiteSpace: 'pre-wrap', backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: '8px' }}>
                            {trade.notes || 'No notes provided.'}
                          </p>
                          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-danger" onClick={() => confirmDelete(trade.id)} style={{ padding: '0.5rem 1rem' }}>Delete</button>
                          </div>
                        </div>
                      </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            Showing page {page} of {totalPages} ({data.total} total trades)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-ghost" 
              style={{ padding: '0.5rem 1rem' }} 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ padding: '0.5rem 1rem' }} 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {deleteModalOpen && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-pop-in" style={{ maxWidth: '400px', width: '100%', margin: '0 1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Delete Trade</h3>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Are you sure you want to delete this trade? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setDeleteModalOpen(false); setTradeToDelete(null); }}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
