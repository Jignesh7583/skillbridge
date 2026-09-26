import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../api';

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

  // Survey form
  const [surveyForm, setSurveyForm] = useState({ satisfactionScore: 3, feedbackText: '', skillsNeeded: '', hiringDistrict: '', candidateQuality: 'Average' });
  const [surveys, setSurveys] = useState([]);

  // Industry Consultation form
  const [consultForm, setConsultForm] = useState({ sector: 'IT', district: '', requiredRoles: '', emergingSkills: '', timeline: '6 months', urgency: 'Medium', notes: '' });
  const [consultations, setConsultations] = useState([]);
  const [consultMsg, setConsultMsg] = useState('');

  useEffect(() => {
    if (!token) navigate('/login');
    fetchJobs();
    fetchSurveys();
    fetchConsultations();
  }, []);

  const fetchJobs = async () => {
    try { const r = await axios.get(`${API}/api/jobs`); setJobs(r.data); } catch (e) { console.error(e); }
  };
  const fetchSurveys = async () => {
    try { const r = await axios.get(`${API}/api/surveys`); setSurveys(r.data); } catch (e) { console.error(e); }
  };
  const fetchConsultations = async () => {
    try { const r = await axios.get(`${API}/api/consultations`); setConsultations(r.data); } catch (e) { }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      // Append LPA if not present
      let formattedSalary = jobForm.salaryRange.trim();
      if (formattedSalary && !formattedSalary.toUpperCase().includes('LPA')) {
        formattedSalary += ' LPA';
      }

      const payload = {
        ...jobForm,
        requirements: jobForm.description, // Skills will automatically extract from the description
        salaryRange: formattedSalary
      };

      await axios.post(`${API}/api/jobs`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Job posted successfully!');
      setTimeout(() => setMessage(''), 3000);
      setJobForm({ title: '', description: '', requirements: '', sector: 'IT', location: '', proficiencyLevel: 'Intermediate', salaryRange: '' });
      fetchJobs();
    } catch (err) { setMessage('Failed to post job'); }
  };

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/surveys`, surveyForm, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Survey submitted! Thank you for your feedback.');
      setTimeout(() => setMessage(''), 3000);
      setSurveyForm({ satisfactionScore: 3, feedbackText: '', skillsNeeded: '', hiringDistrict: '', candidateQuality: 'Average' });
      fetchSurveys();
    } catch (err) { setMessage('Failed to submit survey'); }
  };

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/consultations`, consultForm, { headers: { Authorization: `Bearer ${token}` } });
      setConsultMsg('Industry consultation submitted! This data will be used to shape district training plans.');
      setTimeout(() => setConsultMsg(''), 4000);
      setConsultForm({ sector: 'IT', district: '', requiredRoles: '', emergingSkills: '', timeline: '6 months', urgency: 'Medium', notes: '' });
      fetchConsultations();
    } catch (err) { setConsultMsg('Failed to submit: ' + (err.response?.data?.message || 'Server error')); }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <h1>🤖 AI Employer Node</h1>
        <button className="btn-outline" onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
      </div>

      {message && <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-success)', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-success)' }}>{message}</div>}

      <div className="tabs">
        <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Post Jobs</button>
        <button className={`tab ${activeTab === 'consultation' ? 'active' : ''}`} onClick={() => setActiveTab('consultation')}>Industry Consultation</button>
        <button className={`tab ${activeTab === 'validate' ? 'active' : ''}`} onClick={() => setActiveTab('validate')}>Validate Reports</button>
      </div>

      {/* ─── POST JOBS TAB ─── */}
      {activeTab === 'jobs' && (
        <div className="dashboard-grid grid-2">
          <div className="glass-panel">
            <h2 style={{ marginBottom: '1rem', color: 'var(--accent-warning)' }}>Post New Job Requirement</h2>
            <form onSubmit={handlePostJob}>
              <input placeholder="Job Title (e.g. Full Stack Developer)" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required />
              <textarea placeholder="Job Description (Skills will be automatically extracted)..." rows="4" value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select value={jobForm.sector} onChange={e => setJobForm({ ...jobForm, sector: e.target.value })}>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={jobForm.proficiencyLevel} onChange={e => setJobForm({ ...jobForm, proficiencyLevel: e.target.value })}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input placeholder="Location / District" value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} />
                <input placeholder="Salary (e.g. 6 or 4-6)" value={jobForm.salaryRange} onChange={e => setJobForm({ ...jobForm, salaryRange: e.target.value })} required />
              </div>
              <button type="submit" className="btn-warning" style={{ width: '100%' }}>Submit Job Requirement</button>
            </form>
          </div>
          <div className="glass-panel" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>All Job Postings ({jobs.length})</h2>
            {jobs.map(job => (
              <div key={job.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h3 style={{ color: 'var(--primary)' }}>{job.title}</h3>
                  <span className="skill-tag rising">{job.sector}</span>
                </div>
                <details style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0', cursor: 'pointer' }}>
                  <summary style={{ color: 'var(--primary)', outline: 'none' }}>View Job Description</summary>
                  <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{job.description}</p>
                </details>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  {job.location && <span>🌐 {job.location}</span>}
                  <span>🧬 {job.proficiencyLevel}</span>
                  {job.salaryRange && <span>💎 {job.salaryRange}</span>}
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
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--secondary)' }}>⚡ Submit Industry Signals</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Formally report your sector's upcoming skill demand so training centers can plan ahead. This is distinct from a survey — it is a forward-looking demand signal for capacity planning.
            </p>
            {consultMsg && <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid var(--primary)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{consultMsg}</div>}
            <form onSubmit={handleSubmitConsultation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select value={consultForm.sector} onChange={e => setConsultForm({ ...consultForm, sector: e.target.value })}>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="District (e.g. Jodhpur, Pune)" value={consultForm.district} onChange={e => setConsultForm({ ...consultForm, district: e.target.value })} required />
              </div>
              <input placeholder="Roles you will need to hire for (e.g. CNC Operator, React Developer)" value={consultForm.requiredRoles} onChange={e => setConsultForm({ ...consultForm, requiredRoles: e.target.value })} required />
              <input placeholder="Emerging skills you expect to need (e.g. Generative AI, ROS2)" value={consultForm.emergingSkills} onChange={e => setConsultForm({ ...consultForm, emergingSkills: e.target.value })} />
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
                  <option value="High">High — Urgent Need</option>
                </select>
              </div>
              <textarea placeholder="Additional notes for training planners..." rows="3" value={consultForm.notes} onChange={e => setConsultForm({ ...consultForm, notes: e.target.value })} />
              <button type="submit" style={{ width: '100%', background: 'var(--secondary)' }}>Submit Consultation Signal</button>
            </form>
          </div>
          <div className="glass-panel" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>Recent Consultations ({consultations.length})</h2>
            {consultations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No consultations submitted yet. Be the first to signal your sector's future demand!</p>
            ) : consultations.slice().reverse().map(c => (
              <div key={c.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '0.75rem', borderLeft: `3px solid ${c.urgency === 'High' ? 'var(--accent-danger)' : c.urgency === 'Medium' ? 'var(--accent-warning)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <strong>{c.sector} — {c.district}</strong>
                  <span className={`skill-tag ${c.urgency === 'High' ? 'missing' : 'rising'}`}>{c.urgency} Priority</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0' }}>Roles: {c.requiredRoles}</p>
                {c.emergingSkills && <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', margin: '0.3rem 0' }}>Emerging: {c.emergingSkills}</p>}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Timeline: {c.timeline}</p>
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
      // Parse existing validation statuses from demandAnalysis
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
      alert(err.response?.data?.message || 'Failed to submit validation. Make sure you are logged in as a Company.');
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '0.5rem' }}>🔍 Validate Gap Reports</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Review AI-generated gap reports and confirm whether the identified skill gaps match your real hiring experience. Your validation helps colleges trust these reports more.
      </p>
      {reports.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No reports available yet. Ask colleges to upload their syllabuses.</p>
      ) : (
        reports.map(r => {
          const status = statusMap[r.id];
          return (
            <div key={r.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '0.5rem', marginBottom: '1rem', borderLeft: `3px solid ${status === 'Employer Validated' ? 'var(--accent-success)' : status === 'Employer Disputed' ? 'var(--accent-danger)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.2rem' }}>{r.college?.name} — {r.syllabus?.branch} (Sem {r.syllabus?.semester})</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Alignment Score: <strong style={{ color: r.overallScore >= 60 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{r.overallScore}%</strong></span>
                </div>
                {status ? (
                  <span className={`skill-tag ${status === 'Employer Validated' ? 'matched' : 'missing'}`}>
                    {status === 'Employer Validated' ? '✓' : '✗'} {status}
                  </span>
                ) : null}
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--accent-danger)' }}>Missing Skills: </strong>
                {r.missingSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag missing">{s.trim()}</span>)}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--accent-success)' }}>Matched: </strong>
                {r.matchedSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag matched">{s.trim()}</span>)}
              </div>

              <input
                placeholder="Optional note (e.g. 'Confirmed — we see this gap in every candidate')"
                value={noteMap[r.id] || ''}
                onChange={e => setNoteMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-sm btn-success"
                  disabled={validatingId === r.id}
                  onClick={() => handleValidate(r.id, 'validate')}
                >
                  {validatingId === r.id ? '...' : '✓ Validate — This is accurate'}
                </button>
                <button
                  className="btn-sm btn-danger"
                  disabled={validatingId === r.id}
                  onClick={() => handleValidate(r.id, 'dispute')}
                >
                  {validatingId === r.id ? '...' : '✗ Dispute — This is wrong'}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

