'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Criterion {
  category: string;
  description: string;
  isRequired: boolean;
  weight: number;
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<'explore' | 'create'>('explore');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Form State for creating a requisition
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([
    { category: 'Technical Skills', description: '5+ years experience in TypeScript, React, and Node.js', isRequired: true, weight: 5 },
    { category: 'Database', description: 'Strong PostgreSQL knowledge and relational schema design', isRequired: true, weight: 4 },
    { category: 'Cloud / DevOps', description: 'Experience with Docker containers and CI/CD pipelines', isRequired: false, weight: 3 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data || []);
      }
    } catch (e) {
      console.error('Failed to load jobs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAddCriterion = () => {
    setCriteria([...criteria, { category: '', description: '', isRequired: false, weight: 3 }]);
  };

  const handleRemoveCriterion = (idx: number) => {
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleCriterionChange = (idx: number, field: keyof Criterion, val: any) => {
    const updated = [...criteria];
    updated[idx] = { ...updated[idx], [field]: val };
    setCriteria(updated);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError(null);
    setCreateSuccess(false);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, department, description, criteria })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create requisition');
      }

      setCreateSuccess(true);
      setTitle('');
      setDescription('');
      await fetchJobs();
    } catch (err: any) {
      setCreateError(err.message || 'Error occurred while saving requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesDept = selectedDept === 'ALL' || job.department === selectedDept;
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const departments = ['ALL', 'Engineering', 'Data & AI', 'Product', 'Design', 'Operations'];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Job Board & Requisitions</h1>
            <p className="text-sm text-slate-400 mt-1">
              Explore live open positions, review AI criteria rubrics, or post new requisitions with instant candidate notifications.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1.5 self-start md:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'explore'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔍</span>
              <span>Explore Jobs ({jobs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>➕</span>
              <span>Post New Requisition</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Explore Jobs Feed */}
        {activeTab === 'explore' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-xl">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search roles, skills, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
              </div>

              {/* Department Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                      selectedDept === dept
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {dept === 'ALL' ? 'All Roles' : dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs List */}
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="text-xs text-slate-500 mt-4">Loading open positions...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
                <p className="text-base font-semibold text-slate-300">No matching jobs found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or post a new job requisition.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredJobs.map((job) => {
                  const criteriaList = job.rubrics?.[0]?.criteria || [];
                  return (
                    <div
                      key={job.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 transition shadow-xl hover:shadow-2xl backdrop-blur-xl group"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[11px] font-bold uppercase tracking-wider">
                              {job.department}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              🏢 {job.organization?.name || 'RecruitAI Tech'}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              • Posted {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition">
                            {job.title}
                          </h2>

                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 max-w-3xl">
                            {job.description || 'No detailed description provided.'}
                          </p>

                          {/* Criteria Badges */}
                          {criteriaList.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-2 items-center">
                              <span className="text-[11px] text-slate-400 font-medium mr-1">AI Evaluates:</span>
                              {criteriaList.slice(0, 3).map((c: any) => (
                                <span
                                  key={c.id}
                                  className="text-[11px] bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                                >
                                  {c.category}: {c.description.slice(0, 35)}... (w:{c.weight})
                                </span>
                              ))}
                              {criteriaList.length > 3 && (
                                <span className="text-[11px] text-indigo-400 font-medium">
                                  +{criteriaList.length - 3} more criteria
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 shrink-0 pt-2 md:pt-0 border-t sm:border-t-0 border-slate-800">
                          <Link
                            href={`/jobs/${job.id}/apply`}
                            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30 text-center flex items-center justify-center gap-1.5"
                          >
                            <span>Apply Now</span>
                            <span>&rarr;</span>
                          </Link>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {job._count?.applications || 0} applicants
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Requisition */}
        {activeTab === 'create' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
            <h2 className="text-xl font-bold text-white mb-2">Create New Job Requisition & Rubric</h2>
            <p className="text-xs text-slate-400 mb-6">
              When published, this job will immediately trigger an in-app broadcast alert to candidates across the platform.
            </p>

            {createSuccess && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
                <span>✓</span>
                <span>Job Requisition published and broadcasted to candidate feeds successfully!</span>
              </div>
            )}

            {createError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-3">
                <span>⚠️</span>
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lead Distributed Systems Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Job Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key responsibilities, team context, and role mission..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Rubric Criteria Builder */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Screening Rubric Criteria</h3>
                    <p className="text-xs text-slate-400">
                      Configure evaluation criteria and weights (1 to 5) for deterministic LLM score calculations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 text-xs font-semibold transition"
                  >
                    + Add Criterion
                  </button>
                </div>

                <div className="space-y-3">
                  {criteria.map((c, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 items-start md:items-center"
                    >
                      <input
                        type="text"
                        placeholder="Category (e.g. Technical Skills)"
                        value={c.category}
                        onChange={(e) => handleCriterionChange(i, 'category', e.target.value)}
                        className="w-full md:w-1/4 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Specific Requirement Description"
                        value={c.description}
                        onChange={(e) => handleCriterionChange(i, 'description', e.target.value)}
                        className="w-full md:flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <div className="flex items-center gap-3 w-full md:w-auto justify-between">
                        <select
                          value={c.weight}
                          onChange={(e) => handleCriterionChange(i, 'weight', Number(e.target.value))}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-400 font-semibold"
                        >
                          <option value={5}>5 - Critical</option>
                          <option value={4}>4 - High</option>
                          <option value={3}>3 - Medium</option>
                          <option value={2}>2 - Low</option>
                          <option value={1}>1 - Optional</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(i)}
                          className="text-red-400 hover:text-red-300 text-xs p-2"
                          title="Remove criterion"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {submitting ? 'Publishing & Broadcasting Notification...' : 'Publish Job & Broadcast Alert 📢'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}