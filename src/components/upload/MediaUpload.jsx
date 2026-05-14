'use client';
import { useState, useRef } from 'react';

export default function MediaUpload({ onUpload, onRemove, accept = 'image/*,video/*', maxSize = 500, clientId, projectId }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const maxSizeBytes = maxSize * 1024 * 1024;

  const validateAndProcessFile = async (file) => {
    setError('');
    
    if (!file) return;

    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Set local preview
    const objectUrl = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    
    setPreview(objectUrl);
    setFileData({ name: file.name, size: (file.size / (1024 * 1024)).toFixed(2) + ' MB', type });

    // Upload to server
    setIsUploading(true);
    setProgress(10); // Fake initial progress

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (clientId) formData.append('clientId', clientId);
      if (projectId) formData.append('projectId', projectId);

      // Simulate progress for UI
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await res.json();
      
      // We pass the R2 url, key, and type up to the parent form
      onUpload(data);
    } catch (err) {
      setError(err.message);
      setPreview(null);
      setFileData(null);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    validateAndProcessFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndProcessFile(file);
  };

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileData(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove();
  };

  if (preview) {
    return (
      <div style={{ position: 'relative', background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{fileData.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{fileData.size} • {fileData.type}</div>
          </div>
          <button type="button" onClick={handleRemove} className="btn-icon" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>
        
        <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000' }}>
          {fileData.type === 'video' ? (
            <video src={preview} controls style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
          ) : (
            <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{
          border: `1px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          backgroundColor: isDragging ? 'var(--bg-layer)' : 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept={accept} 
          style={{ display: 'none' }} 
          disabled={isUploading}
        />
        
        {!isUploading ? (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
              Drop image or video here
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              or <span style={{ color: 'var(--accent)' }}>browse files</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
              Max size: {maxSize}MB
            </div>
          </>
        ) : (
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 12 }}>
              Uploading... {progress}%
            </div>
            <div style={{ height: 4, width: '100%', maxWidth: '200px', background: 'var(--bg-layer)', borderRadius: 2, margin: '0 auto', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
