"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TradeReplayModalProps {
  trade: any;
  onClose: () => void;
}

export default function TradeReplayModal({ trade, onClose }: TradeReplayModalProps) {
  const [dataPoints, setDataPoints] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate synthetic price path
  const fullPath = useMemo(() => {
    if (!trade.entryPrice || !trade.exitPrice) return [];

    const numPoints = 100;
    const path = [];
    const entry = trade.entryPrice;
    const exit = trade.exitPrice;
    
    // Create a time scale
    const entryTime = new Date(trade.entryDate).getTime();
    const exitTime = trade.exitDate ? new Date(trade.exitDate).getTime() : entryTime + 3600 * 1000; // default 1h if no exit time
    
    // Add entry point
    path.push({
      time: entryTime,
      displayTime: new Date(entryTime).toLocaleTimeString(),
      price: entry,
      isEntry: true
    });

    // Synthetic volatility (random walk pushing towards exit)
    let currentPrice = entry;
    for (let i = 1; i < numPoints - 1; i++) {
      const progress = i / numPoints;
      // Linear interpolation point
      const expectedPrice = entry + (exit - entry) * progress;
      
      // Add some random noise (max 5% of the total move, or a fixed tiny percentage if move is 0)
      const moveDiff = Math.abs(exit - entry) || entry * 0.01;
      const noise = (Math.random() - 0.5) * moveDiff * 0.4;
      
      // Pull heavily towards expected price to ensure it ends exactly at exit
      const pullFactor = progress; // stronger pull as we get closer to end
      currentPrice = (currentPrice + noise) * (1 - pullFactor) + expectedPrice * pullFactor;

      const stepTime = entryTime + (exitTime - entryTime) * progress;
      path.push({
        time: stepTime,
        displayTime: new Date(stepTime).toLocaleTimeString(),
        price: currentPrice
      });
    }

    // Add exit point
    path.push({
      time: exitTime,
      displayTime: new Date(exitTime).toLocaleTimeString(),
      price: exit,
      isExit: true
    });

    return path;
  }, [trade]);

  // Animation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < fullPath.length) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= fullPath.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 50); // 50ms per tick (5 seconds total for 100 points)
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, fullPath.length]);

  useEffect(() => {
    setDataPoints(fullPath.slice(0, currentStep + 1));
  }, [currentStep, fullPath]);

  const handlePlayPause = () => {
    if (currentStep >= fullPath.length - 1) {
      // Reset if at the end
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const isWin = trade.pnl && trade.pnl > 0;
  const lineColor = isWin ? 'var(--success)' : 'var(--danger)';

  // Calculate Y-axis domain to include stop loss and take profit if they exist
  const allPrices = fullPath.map(p => p.price);
  if (trade.stopLoss) allPrices.push(trade.stopLoss);
  if (trade.takeProfit) allPrices.push(trade.takeProfit);
  
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card animate-pop-in" style={{ width: '90%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
              {trade.ticker.toUpperCase()} <span className={`badge ${trade.direction === 'Long' ? 'win' : 'loss'}`}>{trade.direction}</span>
            </h2>
            <p className="text-muted" style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              {new Date(trade.entryDate).toLocaleDateString()} &middot; P&L: <span className={trade.pnl >= 0 ? 'text-success' : 'text-danger'}>{trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}</span>
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Disclaimer */}
        <div style={{ backgroundColor: 'rgba(255, 171, 0, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <div style={{ color: 'var(--warning)', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase' }}>Synthetic Visualization</div>
            <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
              This replay is generated synthetically to connect your Entry and Exit prices. It does not represent actual market tick data for this duration. It is designed to help you visualize your risk/reward boundaries.
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div style={{ flex: 1, minHeight: 0, backgroundColor: 'var(--surface-light)', borderRadius: '8px', padding: '1rem', position: 'relative' }}>
          {fullPath.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="displayTime" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} minTickGap={50} />
                <YAxis 
                  domain={[minPrice - padding, maxPrice + padding]} 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val.toFixed(2)}`} 
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
                />
                
                {trade.takeProfit && (
                  <ReferenceLine y={trade.takeProfit} stroke="var(--success)" strokeDasharray="5 5" label={{ position: 'insideTopLeft', value: 'Take Profit', fill: 'var(--success)', fontSize: 12 }} />
                )}
                {trade.stopLoss && (
                  <ReferenceLine y={trade.stopLoss} stroke="var(--danger)" strokeDasharray="5 5" label={{ position: 'insideBottomLeft', value: 'Stop Loss', fill: 'var(--danger)', fontSize: 12 }} />
                )}
                {trade.entryPrice && (
                  <ReferenceLine y={trade.entryPrice} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Entry', fill: 'var(--text-muted)', fontSize: 12 }} />
                )}

                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={lineColor} 
                  strokeWidth={3} 
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isEntry) return <circle cx={cx} cy={cy} r={6} fill="var(--text-muted)" />;
                    if (payload.isExit) return <circle cx={cx} cy={cy} r={8} fill={lineColor} stroke="var(--surface)" strokeWidth={2} />;
                    return <circle cx={cx} cy={cy} r={0} />;
                  }}
                  isAnimationActive={false} // We handle animation manually
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Insufficient data to replay this trade.
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-ghost" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>
            Reset
          </button>
          <button className="btn btn-primary" style={{ width: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={handlePlayPause}>
            {isPlaying ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Pause
              </>
            ) : currentStep >= fullPath.length - 1 ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Replay
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Play
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
