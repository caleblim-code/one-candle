export default function JournalLoading() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="skeleton" style={{ width: '150px', height: '32px' }}></div>
        <div className="skeleton" style={{ width: '120px', height: '40px', borderRadius: '100px' }}></div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="skeleton" style={{ width: '200px', height: '40px', borderRadius: '8px' }}></div>
          <div className="skeleton" style={{ width: '150px', height: '40px', borderRadius: '8px' }}></div>
          <div className="skeleton" style={{ width: '150px', height: '40px', borderRadius: '8px' }}></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--surface-light)' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <th key={i} style={{ padding: '1rem' }}><div className="skeleton" style={{ width: '60px', height: '16px' }}></div></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                  <td key={j} style={{ padding: '1rem' }}><div className="skeleton" style={{ width: '100%', maxWidth: '80px', height: '20px' }}></div></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
