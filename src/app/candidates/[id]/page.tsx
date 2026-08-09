'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CandidateProfilePage({ params }: { params: { id: string } }) {
  // Simulating fetched data
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Alice Smith',
    job: 'Senior Frontend Engineer',
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js'],
    experience: '5 years at TechCorp as Frontend Dev.',
    rawText: 'Alice Smith\nalice@example.com\n\nSkills:\nReact, Next.js, TypeScript, Node.js\n\nExperience:\nTechCorp - Frontend Developer (2020-2025)\nBuilt responsive UIs using React and Next.js. Improved performance by 30%.'
  });

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SCREENING'>('PROFILE');
  const [decisionReason, setDecisionReason] = useState('');

  // Simulated AI Screening Results
  const screeningResults = {
    totalScore: 85,
    assessments: [
      { criterion: '5+ years React experience', result: 'MATCH', evidence: '5 years at TechCorp as Frontend Dev.', score: 5 },
      { criterion: 'Knowledge of Python', result: 'MISSING', evidence: 'No mention of Python in the resume.', score: 0 }
    ]
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
            {isEditing ? (
              <textarea 
                className="input-field" 
                rows={3}
                value={profile.skills.join(', ')}
                onChange={(e) => setProfile({...profile, skills: e.target.value.split(', ')})}
              />
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {profile.skills.map(skill => (
                  <span key={skill} style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '1rem', fontSize: '0.875rem' }}>
                    {skill.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Employment History</h3>
            {isEditing ? (
              <textarea 
                className="input-field" 
                rows={5}
                value={profile.experience}
                onChange={(e) => setProfile({...profile, experience: e.target.value})}
              />
            ) : (
              <div style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: '0.5rem', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {profile.experience}
              </div>
            )}
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
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>AI Match Score</span>
              <span style={{ color: screeningResults.totalScore > 75 ? 'var(--secondary)' : 'var(--accent)' }}>
                {screeningResults.totalScore}%
              </span>
            </h2>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              The AI evaluated this candidate against the approved job rubric. Note: This is decision-support only.
            </p>

            {screeningResults.assessments.map((assessment, idx) => (
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
                  "{assessment.evidence}"
                </p>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Override Score</button>
                </div>
              </div>
            ))}
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
              <button className="btn-primary" disabled={!decisionReason}>Shortlist & Advance</button>
              <button className="btn-secondary" disabled={!decisionReason} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Reject Candidate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
