export default function DashboardLoading() {
  const shimmerStyle = {
    background: 'linear-gradient(90deg, var(--surface-light) 25%, rgba(255,255,255,0.7) 50%, var(--surface-light) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
    borderRadius: '12px',
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Page title skeleton */}
      <div style={{ ...shimmerStyle, height: '32px', width: '180px', marginBottom: '2rem', borderRadius: '8px' }} />
      
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ padding: '1.5rem' }}>
            <div style={{ ...shimmerStyle, height: '14px', width: '80px', marginBottom: '0.75rem', borderRadius: '4px' }} />
            <div style={{ ...shimmerStyle, height: '28px', width: '120px', borderRadius: '6px' }} />
          </div>
        ))}
      </div>

      {/* Chart + sidebar skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ ...shimmerStyle, height: '14px', width: '140px', marginBottom: '1rem', borderRadius: '4px' }} />
          <div style={{ ...shimmerStyle, height: '300px', borderRadius: '8px' }} />
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ ...shimmerStyle, height: '14px', width: '100px', marginBottom: '1rem', borderRadius: '4px' }} />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ ...shimmerStyle, height: '48px', marginBottom: '0.75rem', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
