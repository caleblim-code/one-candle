export default function PlaybooksLoading() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="skeleton" style={{ width: '150px', height: '32px' }}></div>
        <div className="skeleton" style={{ width: '120px', height: '40px', borderRadius: '100px' }}></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ height: '250px', display: 'flex', flexDirection: 'column' }}>
            <div className="skeleton" style={{ width: '150px', height: '24px', marginBottom: '1rem' }}></div>
            <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '1.5rem' }}></div>
            <div className="skeleton" style={{ flex: 1, width: '100%', borderRadius: '8px' }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}
