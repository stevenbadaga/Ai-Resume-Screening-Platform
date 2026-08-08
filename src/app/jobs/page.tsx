'use client';

import { useState } from 'react';

export default function JobsPage() {
  const [isDrafting, setIsDrafting] = useState(false);
  const [rubricCriteria, setRubricCriteria] = useState([{ category: '', description: '', isRequired: true, weight: 1 }]);

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Job Requisitions & Rubrics</h1>
        <button className="btn-primary" onClick={() => setIsDrafting(true)}>+ Create New Job</button>
      </div>

      {isDrafting ? (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Draft New Job Requisition</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <input className="input-field" placeholder="Job Title (e.g. Senior Frontend Engineer)" />
            <input className="input-field" placeholder="Department" />
            <textarea className="input-field" placeholder="Job Description" rows={4} />
          </div>

          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Screening Rubric</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Define the specific criteria the AI will use to assess candidates.</p>
          
          {rubricCriteria.map((criterion, index) => (
            <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <input 
                className="input-field" 
                placeholder="Category (e.g. Skill, Experience)" 
                style={{ flex: 1 }} 
              />
              <input 
                className="input-field" 
                placeholder="Description" 
                style={{ flex: 2 }} 
              />
              <select className="input-field" style={{ flex: 1 }}>
                <option value="required">Required</option>
                <option value="preferred">Preferred</option>
              </select>
              <input 
                className="input-field" 
                type="number" 
                placeholder="Weight (1-5)" 
                style={{ width: '100px' }} 
              />
            </div>
          ))}
          
          <button 
            className="btn-secondary" 
            style={{ marginBottom: '2rem' }}
            onClick={() => setRubricCriteria([...rubricCriteria, { category: '', description: '', isRequired: true, weight: 1 }])}
          >
            + Add Criterion
          </button>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setIsDrafting(false)}>Cancel</button>
            <button className="btn-primary">Submit for Approval</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {/* Sample existing jobs */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3>Senior Backend Developer</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Engineering • Full-time</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', backgroundColor: 'var(--secondary)', color: 'white', borderRadius: '1rem' }}>Approved</span>
              <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>View Pipeline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
