export default function DashboardLoading() {
  return (
    <div className="animate-fade-in">
      <div className="skeleton" style={{ width: '250px', height: '32px', marginBottom: '2rem' }}></div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ padding: '1.5rem' }}>
            <div className="skeleton" style={{ width: '80px', height: '16px', marginBottom: '0.5rem' }}></div>
            <div className="skeleton" style={{ width: '120px', height: '32px' }}></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div className="skeleton" style={{ width: '150px', height: '24px', marginBottom: '1.5rem' }}></div>
          <div className="skeleton" style={{ flex: 1, width: '100%' }}></div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
          <div className="skeleton" style={{ width: '80px', height: '16px' }}></div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 0' }}><div className="skeleton" style={{ width: '60px', height: '16px' }}></div></th>
              <th style={{ padding: '0.75rem 0' }}><div className="skeleton" style={{ width: '40px', height: '16px' }}></div></th>
              <th style={{ padding: '0.75rem 0' }}><div className="skeleton" style={{ width: '60px', height: '16px' }}></div></th>
              <th style={{ padding: '0.75rem 0' }}><div className="skeleton" style={{ width: '80px', height: '16px' }}></div></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 0' }}><div className="skeleton" style={{ width: '60px', height: '20px' }}></div></td>
                <td style={{ padding: '1rem 0' }}><div className="skeleton" style={{ width: '50px', height: '20px' }}></div></td>
                <td style={{ padding: '1rem 0' }}><div className="skeleton" style={{ width: '80px', height: '20px' }}></div></td>
                <td style={{ padding: '1rem 0' }}><div className="skeleton" style={{ width: '100px', height: '20px' }}></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
