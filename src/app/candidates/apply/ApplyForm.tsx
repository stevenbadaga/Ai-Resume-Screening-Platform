/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';

export default function ApplyForm({ jobs }: { jobs: { id: string, title: string }[] }) {
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
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Job Requisition</label>
          <select name="jobId" className="input-field" required>
            <option value="">-- Choose a Job --</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>
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

        <button type="submit" className="btn-primary" disabled={isUploading || jobs.length === 0} style={{ marginTop: '1rem' }}>
          {isUploading ? 'Uploading...' : 'Submit Application'}
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: status.startsWith('Error') ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: status.startsWith('Error') ? 'var(--accent)' : 'var(--secondary)' }}>
          {status}
        </div>
      )}
    </>
  );
}
