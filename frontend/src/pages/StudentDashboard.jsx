import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function StudentDashboard() {
    const [activeTab, setActiveTab] = useState('gaps');
    const [reports, setReports] = useState([]);
    const [trends, setTrends] = useState(null);
    const [jobs, setJobs] = useState([]);
    const navigate = useNavigate();

    // Personal assessment
    const [mySkills, setMySkills] = useState('');
    const [targetRole, setTargetRole] = useState('All');
    const [personalResult, setPersonalResult] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [pathways, setPathways] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [r1, r2, r3, r4] = await Promise.all([
                axios.get(`${API}/api/reports`),
                axios.get(`${API}/api/skills/trends`).catch(() => ({ data: null })),
                axios.get(`${API}/api/jobs`),
                axios.get(`${API}/api/career-pathways`).catch(() => ({ data: [] }))
            ]);
            setReports(r1.data);
            setTrends(r2.data);
            setJobs(r3.data);
            setPathways(r4.data);
        } catch (e) { console.error(e); }
    };

    // Aggregate missing skills from all reports
    const getTopMissingSkills = () => {
        const freq = {};
        reports.forEach(r => {
            r.missingSkills.split(',').forEach(s => {
                const t = s.trim().toLowerCase();
                if (t) freq[t] = (freq[t] || 0) + 1;
            });
        });
        return Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 15);
    };

    // Personal skill assessment
    const handlePersonalAssessment = async (e) => {
        e.preventDefault();
        setAnalyzing(true);
        try {
            const filteredJobs = targetRole === 'All' ? jobs : jobs.filter(j => j.title === targetRole);
            if (filteredJobs.length === 0) {
                alert('No active jobs found for this role.');
                setAnalyzing(false);
                return;
            }
            const allJobReqs = filteredJobs.map(j => `${j.title}: ${j.requirements}`).join('. ');
            const res = await axios.post(`http://localhost:5001/analyze`, {
                syllabusText: mySkills,
                jobText: allJobReqs
            });
            setPersonalResult(res.data);
        } catch (err) {
            alert('ML engine not available');
        } finally {
            setAnalyzing(false);
        }
    };

    const topMissing = getTopMissingSkills();

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="dashboard-header">
                <h1>🔮 Student Upskilling Portal</h1>
                <button className="btn-outline" onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
            </div>

            <div className="tabs">
                <button className={`tab ${activeTab === 'gaps' ? 'active' : ''}`} onClick={() => setActiveTab('gaps')}>Market Skill Gaps</button>
                <button className={`tab ${activeTab === 'assess' ? 'active' : ''}`} onClick={() => setActiveTab('assess')}>Personal Assessment</button>
                <button className={`tab ${activeTab === 'careers' ? 'active' : ''}`} onClick={() => setActiveTab('careers')}>Career Pathways</button>
                <button className={`tab ${activeTab === 'trends' ? 'active' : ''}`} onClick={() => setActiveTab('trends')}>Skill Trends</button>
            </div>

            {/* ─── MARKET SKILL GAPS TAB ─── */}
            {activeTab === 'gaps' && (
                <div className="dashboard-grid grid-2">
                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1rem', color: 'var(--accent-danger)' }}>⚡ Hyper-Demand Missing Skills</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            These are the most frequently demanded skills by employers that are currently missing from college curricula.
                        </p>
                        {topMissing.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No gap data available yet. Ask your college to upload their syllabus!</p>
                        ) : (
                            topMissing.map(([skill, count]) => (
                                <div key={skill} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '0.5rem', borderLeft: '3px solid var(--accent-danger)' }}>
                                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{skill}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ background: 'var(--accent-danger)', height: '6px', borderRadius: '3px', width: `${Math.min(count * 30, 100)}px` }}></div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{count} reports</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1rem' }}>🧠 AI Recommended Courses</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Based on real gap analysis data</p>
                        {reports.length > 0 && (() => {
                            let recs = [];
                            try { recs = JSON.parse(reports[0].recommendations || '[]'); } catch (e) { }
                            return recs.slice(0, 8).map((rec, i) => (
                                <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '0.75rem', borderLeft: `3px solid ${i % 2 === 0 ? 'var(--primary)' : 'var(--accent-success)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{rec.course}</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rec.provider} · {rec.duration}</p>
                                        </div>
                                        <span className="skill-tag rising">{rec.level}</span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>For: {rec.skill}</span>
                                </div>
                            ));
                        })()}
                        {reports.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Recommendations will appear after gap reports are generated.</p>}
                    </div>
                </div>
            )}

            {/* ─── PERSONAL ASSESSMENT TAB ─── */}
            {activeTab === 'assess' && (
                <div className="dashboard-grid grid-2">
                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>🧬 Personal AI Assessment</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Enter the skills you currently have and we'll compare them against all active job requirements to show you exactly what you're missing.
                        </p>
                        <form onSubmit={handlePersonalAssessment}>
                            <select
                                value={targetRole}
                                onChange={e => setTargetRole(e.target.value)}
                                style={{ marginBottom: '1rem', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white' }}
                            >
                                <option value="All">All Roles (Compare against entire market)</option>
                                {[...new Set(jobs.map(j => j.title))].map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            <textarea
                                placeholder="List your skills (e.g. Python, Java, SQL, HTML, CSS, Data Structures, Git, React, Machine Learning...)"
                                rows="6" value={mySkills} onChange={e => setMySkills(e.target.value)} required
                            />
                            <button type="submit" style={{ width: '100%' }} disabled={analyzing}>
                                {analyzing ? '🔮 Scanning Matrices...' : '⚡ Run AI Assessment'}
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1rem' }}>Your Results</h2>
                        {!personalResult ? (
                            <p style={{ color: 'var(--text-muted)' }}>Enter your skills and click Analyze to see results.</p>
                        ) : (
                            <>
                                <div className="stat-card" style={{ marginBottom: '1.5rem' }}>
                                    <div className="stat-value" style={{ color: personalResult.alignment_score >= 60 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                        {personalResult.alignment_score}%
                                    </div>
                                    <div className="stat-label">Industry Readiness Score</div>
                                    <div className="score-bar-bg" style={{ marginTop: '0.5rem' }}>
                                        <div className="score-bar-fill" style={{
                                            width: `${personalResult.alignment_score}%`,
                                            background: personalResult.alignment_score >= 60 ? 'var(--accent-success)' : 'var(--accent-danger)'
                                        }}></div>
                                    </div>
                                </div>

                                <h3 style={{ color: 'var(--accent-danger)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Skills You Need to Learn ({personalResult.missing_skills?.length || 0})</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
                                    {(personalResult.missing_skills || []).map(s => <span key={s} className="skill-tag missing">{s}</span>)}
                                </div>

                                <h3 style={{ color: 'var(--accent-success)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Skills You Already Have ({personalResult.matched_skills?.length || 0})</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {(personalResult.matched_skills || []).map(s => <span key={s} className="skill-tag matched">{s}</span>)}
                                </div>

                                {personalResult.recommendations && personalResult.recommendations.length > 0 && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>🧠 AI Recommended Courses For You</h3>
                                        {personalResult.recommendations.slice(0, 5).map((rec, i) => (
                                            <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                                <strong>{rec.course}</strong> — {rec.provider} ({rec.duration})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ─── CAREER PATHWAYS TAB ─── */}
            {activeTab === 'careers' && (
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>🌐 Career Pathways (Live Neural Data)</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Based on real-time industry demand from active job postings, here are the top career paths and the required skills.</p>
                    <div className="dashboard-grid grid-3">
                        {pathways.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No live pathway data available yet. Waiting for companies to post jobs...</p> : pathways.map(path => (
                            <div key={path.title} className="glass-panel">
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{path.emoji}</div>
                                <h3 style={{ marginBottom: '0.5rem' }}>{path.title}</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-success)' }}>💎 {path.salary}</span>
                                    <span className="skill-tag rising">{path.demand}</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {path.skills.map(s => <span key={s} className="skill-tag matched">{s}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── SKILL TRENDS TAB ─── */}
            {activeTab === 'trends' && (
                <div>
                    {!trends ? (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Trend data loading... Make sure ML engine is running.</p>
                        </div>
                    ) : (
                        <>
                            <div className="dashboard-grid grid-3" style={{ marginBottom: '2rem' }}>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ color: 'var(--accent-success)' }}>🚀 {trends.rising_count}</div>
                                    <div className="stat-label">Rising Skills</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>➡️ {trends.stable_count}</div>
                                    <div className="stat-label">Stable Skills</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ color: 'var(--accent-danger)' }}>📉 {trends.declining_count}</div>
                                    <div className="stat-label">Declining Skills</div>
                                </div>
                            </div>

                            <div className="dashboard-grid grid-2">
                                <div className="glass-panel">
                                    <h2 style={{ marginBottom: '1rem', color: 'var(--accent-success)' }}>📈 Rising / Emerging Skills</h2>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {Object.entries(trends.rising_by_category || {}).map(([cat, skills]) => (
                                            <div key={cat} style={{ marginBottom: '1rem' }}>
                                                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{cat}</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                    {skills.map(s => <span key={s} className="skill-tag rising" style={{ textTransform: 'capitalize' }}>{s}</span>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass-panel">
                                    <h2 style={{ marginBottom: '1rem', color: 'var(--accent-danger)' }}>📉 Declining Skills</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Avoid over-investing in these skills as market demand is reducing.</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        {(trends.declining || []).map(s => <span key={s} className="skill-tag obsolete" style={{ textTransform: 'capitalize' }}>{s}</span>)}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
