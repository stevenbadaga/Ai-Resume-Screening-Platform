'use client';

import { useState } from 'react';

export default function ApplyPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setStatus('Uploading resume...');

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setStatus('Success! Your application has been submitted and is processing.');
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%', padding: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '3rem' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Submit Application</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Please fill out the form below and upload your resume (PDF or DOCX, max 5MB).
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>First Name</label>
            <input name="firstName" className="input-field" required placeholder="Jane" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Last Name</label>
            <input name="lastName" className="input-field" required placeholder="Doe" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
            <input name="email" type="email" className="input-field" required placeholder="jane.doe@example.com" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Resume Document</label>
            <input name="resume" type="file" accept=".pdf,.docx" className="input-field" required style={{ padding: '0.5rem' }} />
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <input name="consent" type="checkbox" required />
            I consent to my data being processed for recruitment purposes, including automated AI screening support.
          </label>

          <button type="submit" className="btn-primary" disabled={isUploading} style={{ marginTop: '1rem' }}>
            {isUploading ? 'Uploading...' : 'Submit Application'}
          </button>
        </form>

        {status && (
          <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: status.startsWith('Error') ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: status.startsWith('Error') ? 'var(--accent)' : 'var(--secondary)' }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
