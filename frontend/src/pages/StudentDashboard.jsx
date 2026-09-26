import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { AlertCircle, BookOpen, Compass, TrendingUp, Sparkles, CheckCircle2, XCircle, ArrowUpRight, LogOut } from 'lucide-react';

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
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>Student Upskilling Portal</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        Curriculum market gap insights, career trajectories, and personalized AI assessments
                    </p>
                </div>
                <button className="btn-outline btn-sm" onClick={() => { localStorage.clear(); navigate('/'); }}>
                    <LogOut size={14} /> Sign Out
                </button>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <AlertCircle size={18} color="var(--accent-danger)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>High-Demand Missing Skills</h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            Most frequently demanded employer skills currently absent or under-indexed in regional curricula.
                        </p>
                        {topMissing.length === 0 ? (
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No gap data available yet. Waiting for institution syllabus uploads.</p>
                        ) : (
                            topMissing.map(([skill, count]) => (
                                <div key={skill} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--muted)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', marginBottom: '0.5rem', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent-danger)' }}>
                                    <span style={{ fontWeight: 500, fontSize: '0.875rem', textTransform: 'capitalize' }}>{skill}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <div style={{ background: 'var(--accent-danger)', height: '5px', borderRadius: 'var(--radius-sm)', width: `${Math.min(count * 30, 100)}px` }}></div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>{count} reports</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <BookOpen size={18} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>AI Recommended Courses</h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>Targeted modules based on regional curriculum gap analysis</p>
                        {reports.length > 0 && (() => {
                            let recs = [];
                            try { recs = JSON.parse(reports[0].recommendations || '[]'); } catch (e) { }
                            return recs.slice(0, 8).map((rec, i) => (
                                <div key={i} className="card-item" style={{ borderLeft: `3px solid ${i % 2 === 0 ? 'var(--primary)' : 'var(--accent-success)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem', color: 'var(--foreground)' }}>{rec.course}</h3>
                                            <p style={{ fontSize: '0.775rem', color: 'var(--muted-foreground)' }}>{rec.provider} · {rec.duration}</p>
                                        </div>
                                        <span className="skill-tag rising">{rec.level}</span>
                                    </div>
                                    <div style={{ marginTop: '0.4rem', fontSize: '0.775rem', color: 'var(--primary)', fontWeight: 500 }}>
                                        Target Skill: {rec.skill}
                                    </div>
                                </div>
                            ));
                        })()}
                        {reports.length === 0 && <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Recommendations will appear after syllabus gap reports are generated.</p>}
                    </div>
                </div>
            )}

            {/* ─── PERSONAL ASSESSMENT TAB ─── */}
            {activeTab === 'assess' && (
                <div className="dashboard-grid grid-2">
                    <div className="glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Sparkles size={18} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Personal Skill Assessment</h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            Benchmark your current skillset against active regional job vacancies to reveal precise gaps.
                        </p>
                        <form onSubmit={handlePersonalAssessment}>
                            <select
                                value={targetRole}
                                onChange={e => setTargetRole(e.target.value)}
                            >
                                <option value="All">All Roles (Compare against entire market)</option>
                                {[...new Set(jobs.map(j => j.title))].map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            <textarea
                                placeholder="Enter skills you have (e.g. Python, Java, SQL, HTML, CSS, React, Machine Learning, Data Structures...)"
                                rows="6"
                                value={mySkills}
                                onChange={e => setMySkills(e.target.value)}
                                required
                            />
                            <button type="submit" style={{ width: '100%', marginTop: '0.25rem' }} disabled={analyzing}>
                                {analyzing ? 'Analyzing against job requisitions...' : 'Run Skill Assessment'}
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Assessment Findings</h2>
                        {!personalResult ? (
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Enter your competencies and submit the assessment to calculate your market readiness.</p>
                        ) : (
                            <>
                                <div className="stat-card" style={{ marginBottom: '1.25rem', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
                                    <div>
                                        <div className="stat-label">Market Alignment Index</div>
                                        <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: personalResult.alignment_score >= 60 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                            {personalResult.alignment_score}%
                                        </div>
                                    </div>
                                    <div style={{ width: '140px' }}>
                                        <div className="score-bar-bg">
                                            <div className="score-bar-fill" style={{
                                                width: `${personalResult.alignment_score}%`,
                                                background: personalResult.alignment_score >= 60 ? 'var(--accent-success)' : 'var(--accent-danger)'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                                        <XCircle size={14} color="var(--accent-danger)" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-danger)' }}>
                                            Skills to Acquire ({personalResult.missing_skills?.length || 0})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        {(personalResult.missing_skills || []).map(s => <span key={s} className="skill-tag missing">{s}</span>)}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                                        <CheckCircle2 size={14} color="var(--accent-success)" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-success)' }}>
                                            Matched Competencies ({personalResult.matched_skills?.length || 0})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        {(personalResult.matched_skills || []).map(s => <span key={s} className="skill-tag matched">{s}</span>)}
                                    </div>
                                </div>

                                {personalResult.recommendations && personalResult.recommendations.length > 0 && (
                                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>
                                            Tailored Learning Recommendations
                                        </h3>
                                        {personalResult.recommendations.slice(0, 5).map((rec, i) => (
                                            <div key={i} className="card-item" style={{ padding: '0.65rem 0.85rem', marginBottom: '0.4rem' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>{rec.course}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{rec.provider} · {rec.duration}</div>
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
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--foreground)' }}>Market Career Trajectories</h2>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.2rem' }}>High-opportunity roles mapped directly to live regional recruitment demand.</p>
                    </div>
                    <div className="dashboard-grid grid-3">
                        {pathways.length === 0 ? (
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No active pathway data available yet. Waiting for company job listings...</p>
                        ) : pathways.map(path => (
                            <div key={path.title} className="glass-panel">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>{path.title}</h3>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', fontWeight: 600, marginTop: '0.2rem' }}>
                                            {path.salary}
                                        </div>
                                    </div>
                                    <span className="badge badge-success">{path.demand}</span>
                                </div>
                                <p style={{ fontSize: '0.775rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', fontWeight: 500 }}>Key Required Skills:</p>
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
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>Trend model telemetry loading. Ensure ML engine service is active.</p>
                        </div>
                    ) : (
                        <>
                            <div className="dashboard-grid grid-3" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{trends.rising_count}</div>
                                    <div className="stat-label">Emerging Competencies</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{trends.stable_count}</div>
                                    <div className="stat-label">Core Stable Skills</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ color: 'var(--accent-danger)' }}>{trends.declining_count}</div>
                                    <div className="stat-label">Sunsetting Technologies</div>
                                </div>
                            </div>

                            <div className="dashboard-grid grid-2">
                                <div className="glass-panel">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <TrendingUp size={18} color="var(--accent-success)" />
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Emerging / Rising Skills</h2>
                                    </div>
                                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', fontSize: '0.85rem' }}>Categories exhibiting strong upward hiring velocity.</p>
                                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                        {Object.entries(trends.rising_by_category || {}).map(([cat, skills]) => (
                                            <div key={cat} style={{ marginBottom: '1rem' }}>
                                                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat}</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                    {skills.map(s => <span key={s} className="skill-tag rising" style={{ textTransform: 'capitalize' }}>{s}</span>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="glass-panel">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <AlertCircle size={18} color="var(--accent-danger)" />
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Declining / Deprecated Skills</h2>
                                    </div>
                                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', fontSize: '0.85rem' }}>Technologies exhibiting downward job demand trends.</p>
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
