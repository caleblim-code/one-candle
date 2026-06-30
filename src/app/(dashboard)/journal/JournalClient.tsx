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
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

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

  // --- Single Delete ---
  const confirmDelete = (id: string) => {
    setTradeToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!tradeToDelete) return;
    
    const idToDelete = tradeToDelete;
    setDeleteModalOpen(false);
    setTradeToDelete(null);
    
    // Optimistic update: immediately remove the trade from the UI
    if (data && data.trades) {
      mutate(
        { ...data, trades: data.trades.filter((t: any) => t.id !== idToDelete) },
        false // don't revalidate immediately
      );
    }
    
    try {
      const res = await fetch(`/api/trades/${idToDelete}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      mutate(); // re-fetch after successful delete to sync
    } catch (err) {
      alert('Failed to delete trade.');
      mutate(); // rollback on error
    }
  };

  // --- Bulk Delete ---
  const toggleSelectId = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    const allIds = filteredTrades.map((t: any) => t.id);
    const allSelected = allIds.length > 0 && allIds.every((id: string) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    setBulkDeleteModalOpen(false);
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/trades/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeIds: idsToDelete })
      });
      
      if (!res.ok) throw new Error('Failed to delete trades');
      
      // Optimistic update: immediately remove selected trades from the UI
      if (data && data.trades) {
        const idSet = new Set(idsToDelete);
        mutate(
          { ...data, trades: data.trades.filter((t: any) => !idSet.has(t.id)) },
          false
        );
      }
      setSelectedIds(new Set());
      mutate(); // re-fetch to sync
    } catch (err) {
      alert('Failed to delete trades. Please try again.');
    } finally {
      setIsDeleting(false);
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
            style={{ flex: '1 1 200px' }} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
          <select className="form-select" style={{ flex: '1 1 120px' }} value={filterAsset} onChange={e => setFilterAsset(e.target.value)}>
            <option value="All">All Assets</option>
            <option value="Stocks">Stocks</option>
            <option value="Options">Options</option>
            <option value="Forex">Forex</option>
            <option value="Futures">Futures</option>
            <option value="Crypto">Crypto</option>
          </select>
          <select className="form-select" style={{ flex: '1 1 120px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table-mobile-cards" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--surface-light)' }}>
              <th style={{ padding: '1rem', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={filteredTrades.length > 0 && filteredTrades.every((t: any) => selectedIds.has(t.id))}
                  onChange={toggleSelectAll}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '1rem' }}>Entry Date</th>
              <th style={{ padding: '1rem' }}>Exit Date</th>
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
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', backgroundColor: selectedIds.has(trade.id) ? 'rgba(0, 224, 84, 0.05)' : expandedId === trade.id ? 'var(--surface-light)' : 'transparent' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = selectedIds.has(trade.id) ? 'rgba(0, 224, 84, 0.08)' : 'var(--surface-light)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = selectedIds.has(trade.id) ? 'rgba(0, 224, 84, 0.05)' : expandedId === trade.id ? 'var(--surface-light)' : 'transparent'}
                >
                  <td style={{ padding: '1rem', width: '40px' }} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(trade.id)}
                      onChange={() => toggleSelectId(trade.id)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                  </td>
                  <td data-label="Entry Date" style={{ padding: '1rem' }} onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}>{new Date(trade.entryDate).toLocaleDateString()}</td>
                  <td data-label="Exit Date" style={{ padding: '1rem' }} onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}>{trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : '--'}</td>
                  <td data-label="Ticker" style={{ padding: '1rem' }} className="mono fw-bold" onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}>{trade.ticker.toUpperCase()}</td>
                  <td data-label="Direction" style={{ padding: '1rem' }} onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}><span className={`badge ${trade.direction === 'Long' ? 'win' : 'loss'}`}>{trade.direction}</span></td>
                  <td data-label="Entry" style={{ padding: '1rem' }} className="mono" onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}>${trade.entryPrice.toFixed(2)}</td>
                  <td data-label="Exit" style={{ padding: '1rem' }} className="mono" onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}>{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '--'}</td>
                  <td data-label="Size" style={{ padding: '1rem' }} className="mono" onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}>{trade.positionSize}</td>
                  <td data-label="P&L" style={{ padding: '1rem' }} className={`mono ${trade.pnl && trade.pnl >= 0 ? 'text-accent' : trade.pnl && trade.pnl < 0 ? 'text-danger' : ''}`} onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}>
                    {trade.pnl !== null ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '--'}
                  </td>
                  <td data-label="Status" style={{ padding: '1rem' }} onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}><span style={{ color: trade.status === 'Open' ? 'var(--accent)' : 'var(--text-muted)' }}>{trade.status}</span></td>
                </tr>
                {expandedId === trade.id && (
                  <tr>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <div className="animate-slide-up" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-light)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        <div>
                          <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Trade Details</h4>
                          <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><span className="text-muted">Broker Trade ID:</span> <span className="mono">{trade.brokerTradeId || '--'}</span></div>
                            <div><span className="text-muted">Asset Class:</span> {trade.assetClass}</div>
                            <div><span className="text-muted">Entry Time:</span> {new Date(trade.entryDate).toLocaleTimeString()}</div>
                            <div><span className="text-muted">Exit Time:</span> {trade.exitDate ? new Date(trade.exitDate).toLocaleTimeString() : '--'}</div>
                            <div><span className="text-muted">Stop Loss:</span> <span className="mono">{trade.stopLoss ? `$${trade.stopLoss}` : '--'}</span></div>
                            <div><span className="text-muted">Take Profit:</span> <span className="mono">{trade.takeProfit ? `$${trade.takeProfit}` : '--'}</span></div>
                            <div>
                              <span className="text-muted">Fees / Swap:</span>{' '}
                              <span className={`mono ${trade.fees < 0 ? 'text-success' : trade.fees > 0 ? 'text-danger' : ''}`}>
                                {trade.fees < 0 ? `+$${Math.abs(trade.fees)}` : `$${trade.fees}`}
                              </span>
                            </div>
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
                          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <Link href={`/edit-trade/${trade.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Edit</Link>
                            <a href={`https://www.tradingview.com/chart/?symbol=${trade.ticker}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                              View Chart
                            </a>
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
        </div>
        
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

      {/* Bulk Delete Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="animate-slide-up" style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 100
        }}>
          <span className="mono" style={{ fontSize: '0.9rem' }}>
            <span className="text-accent fw-bold">{selectedIds.size}</span> trade{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            className="btn btn-ghost"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            onClick={() => setSelectedIds(new Set())}
            disabled={isDeleting}
          >
            Clear
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            onClick={() => setBulkDeleteModalOpen(true)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      {/* Single Delete Modal */}
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

      {/* Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-pop-in" style={{ maxWidth: '420px', width: '100%', margin: '0 1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Delete {selectedIds.size} Trade{selectedIds.size > 1 ? 's' : ''}?</h3>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Are you sure you want to delete <strong>{selectedIds.size} selected trade{selectedIds.size > 1 ? 's' : ''}</strong>? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setBulkDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleBulkDelete}>Delete All Selected</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
