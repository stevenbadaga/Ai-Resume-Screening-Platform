/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CandidateProfileClient({ profile, screeningResults }: { profile: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any, screeningResults: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any }) {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SCREENING'>('PROFILE');
  const [decisionReason, setDecisionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleDecision = async (decision: 'ADVANCED' | 'REJECTED') => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: profile.id,
          decision,
          rationale: decisionReason
        })
      });
      
      if (!res.ok) throw new Error('Failed to save decision');
      
      alert(`Candidate successfully ${decision.toLowerCase()}!`);
      router.push('/candidates');
    } catch (err) {
      console.error(err);
      alert('Error saving decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in">
      <Link href="/candidates" style={{ color: 'var(--primary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Pipeline
      </Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>{profile.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Applied for: {profile.job}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={activeTab === 'PROFILE' ? "btn-primary" : "btn-secondary"}
            onClick={() => setActiveTab('PROFILE')}
          >
            Profile View
          </button>
          <button 
            className={activeTab === 'SCREENING' ? "btn-primary" : "btn-secondary"}
            onClick={() => setActiveTab('SCREENING')}
          >
            AI Screening Results
          </button>
        </div>
      </div>

      {activeTab === 'PROFILE' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left Column: Parsed Structured Data */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Parsed Profile</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Extracted Skills</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {profile.skills.map((skill: string) => (
                  <span key={skill} style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '1rem', fontSize: '0.875rem' }}>
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Employment History</h3>
              <div style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: '0.5rem', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {profile.experience}
              </div>
            </div>
          </div>

          {/* Right Column: Raw Evidence */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Source Evidence (Raw Text)</h2>
            <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', fontSize: '0.875rem', whiteSpace: 'pre-wrap', height: '400px', overflowY: 'auto', fontFamily: 'var(--font-geist-mono), monospace' }}>
              {profile.rawText}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Screening Results */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            {!screeningResults ? (
              <p>AI Screening is still processing or has failed.</p>
            ) : (
              <>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>AI Match Score</span>
                  <span style={{ color: screeningResults.totalScore > 75 ? 'var(--secondary)' : 'var(--accent)' }}>
                    {Math.round(screeningResults.totalScore)}%
                  </span>
                </h2>
                
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  The AI evaluated this candidate against the approved job rubric. Note: This is decision-support only.
                </p>

                {screeningResults.assessments.map((assessment: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{assessment.criterion}</strong>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        backgroundColor: assessment.result === 'MATCH' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        color: assessment.result === 'MATCH' ? 'var(--secondary)' : 'var(--accent)'
                      }}>
                        {assessment.result}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-muted)', paddingLeft: '1rem', borderLeft: '3px solid var(--primary-light)' }}>
                      &quot;{assessment.evidence}&quot;
                    </p>
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Override Score</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Final Decision Panel */}
          <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Final Decision</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              As a human recruiter, you make the authoritative decision based on the evidence above.
            </p>
            
            <textarea 
              className="input-field" 
              rows={4} 
              placeholder="Mandatory rationale for your decision..."
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn-primary" 
                disabled={!decisionReason || isSubmitting}
                onClick={() => handleDecision('ADVANCED')}
              >
                Shortlist & Advance
              </button>
              <button 
                className="btn-secondary" 
                disabled={!decisionReason || isSubmitting} 
                onClick={() => handleDecision('REJECTED')}
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                Reject Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
