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
    const [targetRole, setTargetRole] = useState('Data Analyst');
    const [selectedDistrict, setSelectedDistrict] = useState('Jaipur');
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

    const loadJaipurStudentDemo = () => {
        setMySkills('Excel, Basic SQL');
        setTargetRole('Data Analyst');
        setSelectedDistrict('Jaipur');
    };

    // Personal skill assessment using backend closed-loop evaluation
    const handlePersonalAssessment = async (e) => {
        e.preventDefault();
        setAnalyzing(true);
        try {
            const res = await axios.post(`${API}/api/student/evaluate`, {
                skills: mySkills,
                targetRole: targetRole !== 'All' ? targetRole : null,
                district: selectedDistrict || 'Jaipur'
            });
            setPersonalResult(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Assessment service unavailable');
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={18} color="var(--primary)" />
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Personal Skill Assessment</h2>
                            </div>
                            <button
                                type="button"
                                className="btn-sm btn-secondary"
                                onClick={loadJaipurStudentDemo}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            >
                                ⚡ Fill Jaipur Student Demo
                            </button>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            Benchmark your competencies against active regional job vacancies to reveal suitable roles, missing skills, career milestones, and local demand.
                        </p>
                        <form onSubmit={handlePersonalAssessment}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.2rem' }}>Target Role</label>
                                    <select
                                        value={targetRole}
                                        onChange={e => setTargetRole(e.target.value)}
                                    >
                                        <option value="All">All Roles</option>
                                        {[...new Set(jobs.map(j => j.title))].map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.2rem' }}>District</label>
                                    <input
                                        placeholder="District (e.g. Jaipur)"
                                        value={selectedDistrict}
                                        onChange={e => setSelectedDistrict(e.target.value)}
                                    />
                                </div>
                            </div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.2rem' }}>Your Acquired Skills</label>
                            <textarea
                                placeholder="Enter skills you have (e.g. Excel, SQL, Python, Power BI, Statistics...)"
                                rows="5"
                                value={mySkills}
                                onChange={e => setMySkills(e.target.value)}
                                required
                            />
                            <button type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={analyzing}>
                                {analyzing ? 'Evaluating skills across job taxonomy...' : 'Run Comprehensive Evaluation'}
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel" style={{ maxHeight: '720px', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Evaluation Findings</h2>
                        {!personalResult ? (
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Click "Fill Jaipur Student Demo" or enter your skills to evaluate market readiness.</p>
                        ) : (
                            <>
                                {/* 1. Overall Alignment Score */}
                                <div className="stat-card" style={{ marginBottom: '1rem', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.15rem' }}>
                                    <div>
                                        <div className="stat-label">Target Role Alignment ({personalResult.primaryTarget?.role || targetRole})</div>
                                        <div className="stat-value" style={{ fontSize: '1.6rem', marginTop: '0.2rem', color: (personalResult.alignmentScore || 0) >= 60 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                            {personalResult.alignmentScore || 0}%
                                        </div>
                                    </div>
                                    <div style={{ width: '130px' }}>
                                        <div className="score-bar-bg">
                                            <div className="score-bar-fill" style={{
                                                width: `${personalResult.alignmentScore || 0}%`,
                                                background: (personalResult.alignmentScore || 0) >= 60 ? 'var(--accent-success)' : 'var(--accent-danger)'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Missing Skills */}
                                <div style={{ marginBottom: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                                        <XCircle size={14} color="var(--accent-danger)" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-danger)' }}>
                                            Missing Industry Skills ({(personalResult.missingSkills || []).length})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        {(personalResult.missingSkills || []).map(s => <span key={s} className="skill-tag missing">{s}</span>)}
                                    </div>
                                </div>

                                {/* 3. Matched Competencies */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                                        <CheckCircle2 size={14} color="var(--accent-success)" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-success)' }}>
                                            Matched Competencies ({(personalResult.matchedSkills || []).length})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        {(personalResult.matchedSkills || []).map(s => <span key={s} className="skill-tag matched">{s}</span>)}
                                    </div>
                                </div>

                                {/* 4. Suitable Job Roles */}
                                {personalResult.suitableRoles?.length > 0 && (
                                    <div style={{ marginBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                                            Suitable Job Roles in Regional Market
                                        </h3>
                                        {personalResult.suitableRoles.slice(0, 4).map((r, idx) => (
                                            <div key={idx} className="card-item" style={{ padding: '0.65rem', marginBottom: '0.4rem', borderLeft: `3px solid ${r.matchPercentage >= 50 ? 'var(--accent-success)' : 'var(--accent-warning)'}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>{r.role}</span>
                                                    <span className="badge badge-success">{r.matchPercentage}% Match</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                                                    <span>Salary: {r.avgSalary}</span>
                                                    <span>Location: {r.location}</span>
                                                    {r.companies?.length > 0 && <span>Hiring: {r.companies.join(', ')}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 5. Recommended Courses */}
                                {personalResult.recommendations?.length > 0 && (
                                    <div style={{ marginBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                                            Targeted Course Recommendations
                                        </h3>
                                        {personalResult.recommendations.map((rec, i) => (
                                            <div key={i} className="card-item" style={{ padding: '0.55rem 0.75rem', marginBottom: '0.35rem' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--foreground)' }}>{rec.course}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{rec.provider} · {rec.duration} · Focus: {rec.skill}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 6. Career Pathway */}
                                {personalResult.careerPathway?.milestones && (
                                    <div style={{ marginBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                                            Career Progression Pathway ({personalResult.careerPathway.role})
                                        </h3>
                                        {personalResult.careerPathway.milestones.map((m, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.5rem', alignItems: 'start' }}>
                                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--foreground)' }}>{m.level}: {m.title} ({m.salary})</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Key Focus: {m.focus}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 7. Local District Demand */}
                                {personalResult.localDemand && (
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                                            Local Hiring Demand in {personalResult.localDemand.district}
                                        </h3>
                                        <div style={{ background: 'var(--muted)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', fontSize: '0.775rem' }}>
                                            <div><strong>Active Postings:</strong> {personalResult.localDemand.activeRequisitions} openings</div>
                                            <div><strong>Hiring Employers:</strong> {personalResult.localDemand.companiesHiring?.join(', ') || 'Regional Industry Partners'}</div>
                                            <div><strong>Typical Package Range:</strong> {personalResult.localDemand.salaryRange || '4-8 LPA'}</div>
                                        </div>
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
