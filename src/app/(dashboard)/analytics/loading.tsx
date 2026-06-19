export default function AnalyticsLoading() {
  return (
    <div className="animate-fade-in">
      <div className="skeleton" style={{ width: '250px', height: '32px', marginBottom: '2rem' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
            <div className="skeleton" style={{ width: '200px', height: '24px', marginBottom: '1.5rem' }}></div>
            <div className="skeleton" style={{ flex: 1, width: '100%', borderRadius: '8px' }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}
