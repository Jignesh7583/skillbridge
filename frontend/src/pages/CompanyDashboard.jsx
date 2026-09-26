import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Briefcase, Radio, CheckSquare, PlusCircle, MapPin, DollarSign, Award, LogOut, CheckCircle2, XCircle } from 'lucide-react';

const SECTORS = ['IT', 'Mechanical', 'Civil', 'Electronics', 'Management', 'Healthcare'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Job form
  const [jobForm, setJobForm] = useState({ title: '', description: '', requirements: '', sector: 'IT', location: '', proficiencyLevel: 'Intermediate', salaryRange: '' });

  // Industry Consultation form
  const [consultForm, setConsultForm] = useState({ sector: 'IT', district: '', requiredRoles: '', emergingSkills: '', timeline: '6 months', urgency: 'Medium', notes: '' });
  const [consultations, setConsultations] = useState([]);
  const [consultMsg, setConsultMsg] = useState('');

  useEffect(() => {
    if (!token) navigate('/login');
    fetchJobs();
    fetchConsultations();
  }, []);

  const fetchJobs = async () => {
    try { const r = await axios.get(`${API}/api/jobs`); setJobs(r.data); } catch (e) { console.error(e); }
  };
  const fetchConsultations = async () => {
    try { const r = await axios.get(`${API}/api/consultations`); setConsultations(r.data); } catch (e) { }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      let formattedSalary = jobForm.salaryRange.trim();
      if (formattedSalary && !formattedSalary.toUpperCase().includes('LPA')) {
        formattedSalary += ' LPA';
      }

      const payload = {
        ...jobForm,
        requirements: jobForm.description,
        salaryRange: formattedSalary
      };

      await axios.post(`${API}/api/jobs`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Job requisition registered successfully.');
      setTimeout(() => setMessage(''), 3000);
      setJobForm({ title: '', description: '', requirements: '', sector: 'IT', location: '', proficiencyLevel: 'Intermediate', salaryRange: '' });
      fetchJobs();
    } catch (err) { setMessage('Failed to register job posting'); }
  };

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/consultations`, consultForm, { headers: { Authorization: `Bearer ${token}` } });
      setConsultMsg('Industry demand signal submitted for regional training allocation.');
      setTimeout(() => setConsultMsg(''), 4000);
      setConsultForm({ sector: 'IT', district: '', requiredRoles: '', emergingSkills: '', timeline: '6 months', urgency: 'Medium', notes: '' });
      fetchConsultations();
    } catch (err) { setConsultMsg('Failed to submit: ' + (err.response?.data?.message || 'Server error')); }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>Employer & Industry Hub</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Job requisition telemetry, future demand signals, and academic curriculum verification
          </p>
        </div>
        <button className="btn-outline btn-sm" onClick={() => { localStorage.clear(); navigate('/'); }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {message && (
        <div style={{ background: 'oklch(0.96 0.03 145)', border: '1px solid oklch(0.90 0.05 145)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', color: 'oklch(0.35 0.12 145)', fontSize: '0.85rem' }}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Job Requisitions</button>
        <button className={`tab ${activeTab === 'consultation' ? 'active' : ''}`} onClick={() => setActiveTab('consultation')}>Industry Demand Signals</button>
        <button className={`tab ${activeTab === 'validate' ? 'active' : ''}`} onClick={() => setActiveTab('validate')}>Validate Gap Reports</button>
      </div>

      {/* ─── POST JOBS TAB ─── */}
      {activeTab === 'jobs' && (
        <div className="dashboard-grid grid-2">
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <PlusCircle size={18} color="var(--primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Post Job Requirement</h2>
            </div>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              Requirements are ingested directly into the regional NLP skill-extraction model.
            </p>
            <form onSubmit={handlePostJob}>
              <input placeholder="Job Title (e.g. Full Stack Developer, DevOps Engineer)" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required />
              <textarea placeholder="Job Description (Skills will automatically be parsed by NLP)..." rows="4" value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select value={jobForm.sector} onChange={e => setJobForm({ ...jobForm, sector: e.target.value })}>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={jobForm.proficiencyLevel} onChange={e => setJobForm({ ...jobForm, proficiencyLevel: e.target.value })}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input placeholder="Posting Location / District (e.g. Jodhpur, Jaipur)" value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} />
                <input placeholder="Compensation (e.g. 6 or 6-8 LPA)" value={jobForm.salaryRange} onChange={e => setJobForm({ ...jobForm, salaryRange: e.target.value })} required />
              </div>
              <button type="submit" style={{ width: '100%' }}>Register Job Requirement</button>
            </form>
          </div>

          <div className="glass-panel" style={{ maxHeight: '620px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Active Requisitions ({jobs.length})</h2>
            {jobs.map(job => (
              <div key={job.id} className="card-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>{job.title}</h3>
                  <span className="badge badge-success">{job.sector}</span>
                </div>
                <details style={{ fontSize: '0.825rem', color: 'var(--muted-foreground)', margin: '0.5rem 0', cursor: 'pointer' }}>
                  <summary style={{ color: 'var(--primary)', outline: 'none', fontWeight: 500 }}>View Description</summary>
                  <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: 'var(--foreground)' }}>{job.description}</p>
                </details>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.775rem', color: 'var(--muted-foreground)', marginTop: '0.65rem' }}>
                  {job.location && <span>Location: {job.location}</span>}
                  <span>Level: {job.proficiencyLevel}</span>
                  {job.salaryRange && <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{job.salaryRange}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── INDUSTRY CONSULTATION TAB ─── */}
      {activeTab === 'consultation' && (
        <div className="dashboard-grid grid-2">
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Radio size={18} color="var(--primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Forward Demand Signal</h2>
            </div>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              Signal anticipated hiring volume and emerging competencies for inclusion in upcoming district training capacity.
            </p>
            {consultMsg && (
              <div style={{ background: 'oklch(0.96 0.03 145)', border: '1px solid oklch(0.90 0.05 145)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.85rem', color: 'oklch(0.35 0.12 145)' }}>
                {consultMsg}
              </div>
            )}
            <form onSubmit={handleSubmitConsultation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select value={consultForm.sector} onChange={e => setConsultForm({ ...consultForm, sector: e.target.value })}>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="District (e.g. Jodhpur, Jaipur)" value={consultForm.district} onChange={e => setConsultForm({ ...consultForm, district: e.target.value })} required />
              </div>
              <input placeholder="Target Roles (e.g. Cloud Engineer, CNC Machinist)" value={consultForm.requiredRoles} onChange={e => setConsultForm({ ...consultForm, requiredRoles: e.target.value })} required />
              <input placeholder="Anticipated Skills (e.g. Generative AI, ROS2, Kubernetes)" value={consultForm.emergingSkills} onChange={e => setConsultForm({ ...consultForm, emergingSkills: e.target.value })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select value={consultForm.timeline} onChange={e => setConsultForm({ ...consultForm, timeline: e.target.value })}>
                  <option value="3 months">Hiring in 3 months</option>
                  <option value="6 months">Hiring in 6 months</option>
                  <option value="12 months">Hiring in 12 months</option>
                  <option value="2+ years">Long-term (2+ years)</option>
                </select>
                <select value={consultForm.urgency} onChange={e => setConsultForm({ ...consultForm, urgency: e.target.value })}>
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Urgency</option>
                </select>
              </div>
              <textarea placeholder="Notes on syllabus additions or specific laboratory tooling needed..." rows="3" value={consultForm.notes} onChange={e => setConsultForm({ ...consultForm, notes: e.target.value })} />
              <button type="submit" style={{ width: '100%' }}>Transmit Demand Signal</button>
            </form>
          </div>

          <div className="glass-panel" style={{ maxHeight: '620px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Submitted Industry Signals ({consultations.length})</h2>
            {consultations.length === 0 ? (
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No consultation signals submitted yet.</p>
            ) : consultations.slice().reverse().map(c => (
              <div key={c.id} className="card-item" style={{ borderLeft: `3px solid ${c.urgency === 'High' ? 'var(--accent-danger)' : c.urgency === 'Medium' ? 'var(--accent-warning)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{c.sector} — {c.district}</strong>
                  <span className={`badge ${c.urgency === 'High' ? 'badge-danger' : 'badge-warning'}`}>{c.urgency} Urgency</span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--muted-foreground)', margin: '0.25rem 0' }}>Roles: {c.requiredRoles}</p>
                {c.emergingSkills && <p style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 500, margin: '0.25rem 0' }}>Skills: {c.emergingSkills}</p>}
                <p style={{ fontSize: '0.775rem', color: 'var(--muted-foreground)' }}>Timeline: {c.timeline}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── VALIDATE REPORTS TAB ─── */}
      {activeTab === 'validate' && (
        <ValidateReports />
      )}
    </div>
  );
}

function ValidateReports() {
  const [reports, setReports] = useState([]);
  const [validatingId, setValidatingId] = useState(null);
  const [noteMap, setNoteMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${API}/api/reports`).then(r => {
      setReports(r.data);
      const map = {};
      r.data.forEach(rep => {
        try {
          const d = JSON.parse(rep.demandAnalysis || '{}');
          if (d.validationStatus) map[rep.id] = d.validationStatus;
        } catch (e) { }
      });
      setStatusMap(map);
    }).catch(console.error);
  }, []);

  const handleValidate = async (reportId, action) => {
    setValidatingId(reportId);
    try {
      const res = await axios.post(`${API}/api/reports/${reportId}/validate`,
        { action, note: noteMap[reportId] || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMap(prev => ({ ...prev, [reportId]: res.data.status }));
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit validation.');
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <CheckSquare size={18} color="var(--primary)" />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Validate Regional Gap Reports</h2>
      </div>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
        Verify whether algorithmic skill gap outputs reflect actual hiring difficulties encountered in your hiring pipelines.
      </p>
      {reports.length === 0 ? (
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No college syllabus reports available for review.</p>
      ) : (
        reports.map(r => {
          const status = statusMap[r.id];
          return (
            <div key={r.id} className="card-item" style={{ borderLeft: `3px solid ${status === 'Employer Validated' ? 'var(--accent-success)' : status === 'Employer Disputed' ? 'var(--accent-danger)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.65rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.15rem' }}>
                    {r.college?.name || 'Institution'} — {r.syllabus?.branch} (Sem {r.syllabus?.semester})
                  </h3>
                  <span style={{ fontSize: '0.775rem', color: 'var(--muted-foreground)' }}>
                    Calculated Alignment: <strong style={{ color: r.overallScore >= 60 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{r.overallScore}%</strong>
                  </span>
                </div>
                {status && (
                  <span className={`badge ${status === 'Employer Validated' ? 'badge-success' : 'badge-danger'}`}>
                    {status === 'Employer Validated' ? '✓' : '✗'} {status}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-danger)' }}>Missing Skills Identified: </span>
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.2rem' }}>
                  {r.missingSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag missing">{s.trim()}</span>)}
                </div>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-success)' }}>Curriculum Matches: </span>
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.2rem' }}>
                  {r.matchedSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag matched">{s.trim()}</span>)}
                </div>
              </div>

              <input
                placeholder="Optional industry feedback note (e.g. 'Confirmed: candidate lack of cloud fundamentals is our primary hiring bottleneck')"
                value={noteMap[r.id] || ''}
                onChange={e => setNoteMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                style={{ marginBottom: '0.65rem', fontSize: '0.825rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-sm btn-secondary"
                  disabled={validatingId === r.id}
                  onClick={() => handleValidate(r.id, 'validate')}
                >
                  <CheckCircle2 size={13} color="var(--accent-success)" />
                  {validatingId === r.id ? 'Submitting...' : 'Validate — Accurate Gap'}
                </button>
                <button
                  className="btn-sm btn-outline"
                  disabled={validatingId === r.id}
                  onClick={() => handleValidate(r.id, 'dispute')}
                >
                  <XCircle size={13} color="var(--accent-danger)" />
                  {validatingId === r.id ? 'Submitting...' : 'Dispute Report'}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
