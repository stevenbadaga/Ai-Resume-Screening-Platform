'use client';

import { useState, useEffect } from 'react';

interface RubricCriterion {
  category: string;
  description: string;
  isRequired: boolean;
  weight: number;
}

export default function JobsPage() {
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([
    { category: 'Technical Skills', description: '', isRequired: true, weight: 5 },
    { category: 'Experience', description: '', isRequired: true, weight: 3 },
  ]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateJob = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          department,
          description,
          criteria: rubricCriteria
        })
      });
      
      if (!res.ok) throw new Error('Failed to save job');
      
      setIsDrafting(false);
      setTitle('');
      setDepartment('');
      setDescription('');
      setRubricCriteria([
        { category: 'Technical Skills', description: '', isRequired: true, weight: 5 },
        { category: 'Experience', description: '', isRequired: true, weight: 3 }
      ]);
      fetchJobs();
    } catch (err) {
      alert('Failed to save job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Job Requisitions & Rubrics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage open positions and configure AI evaluation rubrics.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsDrafting(true)}>+ Create New Job</button>
      </div>

      {isDrafting ? (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Draft New Job Requisition</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Job Title</label>
              <input className="input-field" placeholder="e.g. Senior Full-Stack Engineer" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Department</label>
              <input className="input-field" placeholder="e.g. Engineering / Product" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Job Description</label>
              <textarea className="input-field" placeholder="Detailed role description, responsibilities, and qualifications..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>AI Screening Rubric Builder</h3>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <strong>[Guide] How Rubric Weights Work:</strong>
              <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)' }}>
                The <strong>Priority Weight (1 to 5)</strong> dictates how heavily each criterion affects the candidate's final <strong>Match Score (0-100%)</strong>. High-weight items (4-5) carry the most influence, while low-weight items (1-2) act as bonus criteria.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr 1.5fr 2.5fr 40px', gap: '0.75rem', marginBottom: '0.5rem', padding: '0 0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Category</span>
              <span>Requirement Description</span>
              <span>Requirement Type</span>
              <span>Priority Weight (Scoring Impact)</span>
              <span></span>
            </div>

            {rubricCriteria.map((criterion, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr 1.5fr 2.5fr 40px', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
                <input 
                  className="input-field" 
                  placeholder="e.g. Skill / Education" 
                  value={criterion.category}
                  onChange={(e) => {
                    const newC = [...rubricCriteria];
                    newC[index].category = e.target.value;
                    setRubricCriteria(newC);
                  }}
                />
                <input 
                  className="input-field" 
                  placeholder="e.g. 5+ years building distributed React/Node applications" 
                  value={criterion.description}
                  onChange={(e) => {
                    const newC = [...rubricCriteria];
                    newC[index].description = e.target.value;
                    setRubricCriteria(newC);
                  }}
                />
                <select 
                  className="input-field" 
                  value={criterion.isRequired ? 'required' : 'preferred'}
                  onChange={(e) => {
                    const newC = [...rubricCriteria];
                    newC[index].isRequired = e.target.value === 'required';
                    setRubricCriteria(newC);
                  }}
                >
                  <option value="required">Required (Must Have)</option>
                  <option value="preferred">Preferred (Nice to Have)</option>
                </select>
                
                <select
                  className="input-field"
                  value={criterion.weight}
                  onChange={(e) => {
                    const newC = [...rubricCriteria];
                    newC[index].weight = parseInt(e.target.value, 10) || 1;
                    setRubricCriteria(newC);
                  }}
                >
                  <option value={5}>5 - Critical Priority (Highest Weight)</option>
                  <option value={4}>4 - High Priority</option>
                  <option value={3}>3 - Medium Priority</option>
                  <option value={2}>2 - Moderate Priority</option>
                  <option value={1}>1 - Low / Bonus Skill</option>
                </select>

                <button 
                  type="button"
                  onClick={() => {
                    if (rubricCriteria.length > 1) {
                      setRubricCriteria(rubricCriteria.filter((_, i) => i !== index));
                    }
                  }}
                  disabled={rubricCriteria.length <= 1}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: rubricCriteria.length <= 1 ? 'var(--border)' : 'var(--accent)', 
                    cursor: rubricCriteria.length <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '1.2rem'
                  }}
                  title="Remove Criterion"
                >
                  &times;
                </button>
              </div>
            ))}
            
            <button 
              type="button"
              className="btn-secondary" 
              style={{ marginTop: '0.5rem', marginBottom: '2rem' }}
              onClick={() => setRubricCriteria([...rubricCriteria, { category: 'Skills', description: '', isRequired: true, weight: 3 }])}
            >
              + Add Another Criterion
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <button className="btn-secondary" onClick={() => setIsDrafting(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreateJob} disabled={isSubmitting || !title || !description}>
              {isSubmitting ? 'Saving...' : 'Save Job & Rubric'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {jobs.map((job) => (
            <div key={job.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{job.title}</h3>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', backgroundColor: job.status === 'OPEN' ? 'var(--secondary)' : 'var(--text-muted)', color: 'white', borderRadius: '1rem', fontWeight: 600 }}>
                    {job.status}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{job.department || 'General'} - Full-time</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
                  {job.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <span>Rubric Criteria: {job.rubrics?.[0]?.criteria?.length || 0}</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {job._count?.applications || 0} applicants
                </span>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No job requisitions created yet.</p>
              <button className="btn-primary" onClick={() => setIsDrafting(true)}>Create Your First Job</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}