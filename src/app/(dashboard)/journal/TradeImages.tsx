"use client";

import { useState, useEffect, useRef } from 'react';

export default function TradeImages({ tradeId }: { tradeId: string }) {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/trades/${tradeId}/images`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setImages(data.images);
      })
      .catch(() => {});
  }, [tradeId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`/api/trades/${tradeId}/images`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImages(prev => [...prev, data.image]);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/images?imageId=${imageId}`, { method: 'DELETE' });
      if (res.ok) {
        setImages(prev => prev.filter(i => i.id !== imageId));
      }
    } catch {}
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        Screenshots ({images.length}/3)
      </h4>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {images.map((img: any) => (
          <div key={img.id} style={{ position: 'relative', width: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }}>
            <img
              src={`/uploads/trades/${img.filename}`}
              alt={img.label || 'Trade screenshot'}
              onClick={() => setLightboxSrc(`/uploads/trades/${img.filename}`)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
              style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        ))}

        {images.length < 3 && (
          <label style={{ width: '120px', height: '90px', borderRadius: '8px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.5 : 1, flexShrink: 0, transition: 'border-color 150ms ease' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {uploading ? (
              <span className="spinner" style={{ width: '20px', height: '20px' }}></span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span className="text-muted" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Add Image</span>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          className="animate-fade-in"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img
            src={lightboxSrc}
            alt="Full size"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
