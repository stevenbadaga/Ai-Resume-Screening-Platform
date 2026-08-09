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
        <button 
          className={isEditing ? "btn-primary" : "btn-secondary"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Save Corrections' : 'Manual Correction Mode'}
        </button>
      </div>

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
    </div>
  );
}
