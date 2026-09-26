import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { BarChart3, Database, Users, Building2, Briefcase, Award, TrendingUp, Layers, Home, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [surveyStats, setSurveyStats] = useState(null);
    const [placementStats, setPlacementStats] = useState(null);
    const [trends, setTrends] = useState(null);
    const [seeding, setSeeding] = useState(false);
    const [seedMsg, setSeedMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [s1, s2, s3, s4] = await Promise.all([
                axios.get(`${API}/api/analytics/dashboard`).catch(() => ({ data: null })),
                axios.get(`${API}/api/surveys/stats`).catch(() => ({ data: null })),
                axios.get(`${API}/api/placements/stats`).catch(() => ({ data: null })),
                axios.get(`${API}/api/skills/trends`).catch(() => ({ data: null })),
            ]);
            setStats(s1.data);
            setSurveyStats(s2.data);
            setPlacementStats(s3.data);
            setTrends(s4.data);
        } catch (e) { console.error(e); }
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            await axios.post(`${API}/api/seed`);
            setSeedMsg('Demonstration dataset generated successfully.');
            fetchAll();
        } catch (e) { setSeedMsg('Data seeding failed.'); }
        finally { setSeeding(false); }
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>System Analytics & Intelligence</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        Platform telemetry, macro skill deficits, employer validation ratios, and sector trajectory curves
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button className="btn-sm btn-secondary" onClick={handleSeed} disabled={seeding}>
                        <Database size={14} /> {seeding ? 'Seeding...' : 'Load Sample Data'}
                    </button>
                    <button className="btn-outline btn-sm" onClick={() => navigate('/')}>
                        <Home size={14} /> Home
                    </button>
                </div>
            </div>

            {seedMsg && (
                <div style={{ background: 'oklch(0.96 0.03 145)', border: '1px solid oklch(0.90 0.05 145)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', color: 'oklch(0.35 0.12 145)', fontSize: '0.85rem' }}>
                    {seedMsg}
                </div>
            )}

            {/* ─── OVERVIEW STATS ─── */}
            {stats && (
                <>
                    <div className="dashboard-grid grid-4" style={{ marginBottom: '1.5rem' }}>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.totalUsers}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.totalJobs}</div>
                            <div className="stat-label">Job Postings Ingested</div>
                        </div>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.totalReports}</div>
                            <div className="stat-label">Curriculum Gap Audits</div>
                        </div>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.avgAlignment}%</div>
                            <div className="stat-label">Mean Alignment Score</div>
                        </div>
                    </div>

                    <div className="dashboard-grid grid-3" style={{ marginBottom: '1.5rem' }}>
                        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', padding: '1rem 1.25rem' }}>
                            <div>
                                <div className="stat-label">Students Registered</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
                                    {stats.roleBreakdown?.students || 0}
                                </div>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <Users size={18} />
                            </div>
                        </div>

                        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', padding: '1rem 1.25rem' }}>
                            <div>
                                <div className="stat-label">Colleges / Polytechs</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
                                    {stats.roleBreakdown?.colleges || 0}
                                </div>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <Building2 size={18} />
                            </div>
                        </div>

                        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', padding: '1rem 1.25rem' }}>
                            <div>
                                <div className="stat-label">Employers & Companies</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
                                    {stats.roleBreakdown?.companies || 0}
                                </div>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <Briefcase size={18} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="dashboard-grid grid-2" style={{ marginBottom: '1.5rem' }}>
                {/* ─── TOP MISSING SKILLS ─── */}
                <div className="glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertCircle size={18} color="var(--accent-danger)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Critical Macro Skill Deficits</h2>
                    </div>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Top recurring skills demanded in active requisitions but absent from audited syllabi.
                    </p>
                    {stats?.topMissingSkills?.length > 0 ? (
                        stats.topMissingSkills.map((item, i) => (
                            <div key={item.skill} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', width: '18px', fontWeight: 600 }}>#{i + 1}</span>
                                    <span style={{ fontWeight: 500, fontSize: '0.85rem', textTransform: 'capitalize' }}>{item.skill}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ background: 'var(--accent-danger)', height: '5px', borderRadius: 'var(--radius-sm)', width: `${Math.min(item.count * 40, 110)}px`, opacity: 0.85 }}></div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>{item.count} audits</span>
                                </div>
                            </div>
                        ))
                    ) : <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No syllabus gap data calculated yet.</p>}
                </div>

                {/* ─── EMPLOYER SURVEY STATS ─── */}
                <div className="glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <BarChart3 size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Employer Sentiment & Feedback</h2>
                    </div>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Industry partner ratings on candidate readiness and regional workforce requirements.
                    </p>
                    {surveyStats ? (
                        <>
                            <div className="dashboard-grid grid-2" style={{ marginBottom: '1.25rem' }}>
                                <div className="stat-card" style={{ padding: '0.85rem' }}>
                                    <div className="stat-value" style={{ fontSize: '1.6rem' }}>
                                        {surveyStats.avgSatisfaction}/5
                                    </div>
                                    <div className="stat-label">Candidate Satisfaction</div>
                                </div>
                                <div className="stat-card" style={{ padding: '0.85rem' }}>
                                    <div className="stat-value" style={{ fontSize: '1.6rem' }}>{surveyStats.total}</div>
                                    <div className="stat-label">Surveys Recorded</div>
                                </div>
                            </div>

                            {surveyStats.topNeededSkills?.length > 0 && (
                                <>
                                    <h3 style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Urgent Skill Requests from Employers</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '1.25rem' }}>
                                        {surveyStats.topNeededSkills.map(item => (
                                            <span key={item.skill} className="skill-tag missing" style={{ textTransform: 'capitalize' }}>
                                                {item.skill} ({item.count})
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}

                            {surveyStats.qualityDistribution && Object.keys(surveyStats.qualityDistribution).length > 0 && (
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                                    <h3 style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Candidate Quality Breakdown</h3>
                                    {Object.entries(surveyStats.qualityDistribution).map(([quality, count]) => {
                                        const colors = { 'Poor': 'var(--accent-danger)', 'Below Average': 'var(--accent-warning)', 'Average': 'var(--accent-warning)', 'Good': 'var(--accent-success)', 'Excellent': 'var(--primary)' };
                                        return (
                                            <div key={quality} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                                <span style={{ fontSize: '0.8rem', width: '110px', color: 'var(--foreground)' }}>{quality}</span>
                                                <div style={{ flex: 1, height: '7px', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${(count / surveyStats.total) * 100}%`, background: colors[quality] || 'var(--primary)', borderRadius: 'var(--radius-sm)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', width: '30px', textAlign: 'right' }}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No employer surveys recorded yet.</p>}
                </div>
            </div>

            <div className="dashboard-grid grid-2" style={{ marginBottom: '1.5rem' }}>
                {/* ─── PLACEMENT STATS ─── */}
                <div className="glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Award size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Graduate Employment Outcomes</h2>
                    </div>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Verified hiring conversions resulting from institutional programs.
                    </p>
                    {placementStats ? (
                        <div className="dashboard-grid grid-3">
                            <div className="stat-card" style={{ padding: '0.85rem' }}>
                                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{placementStats.totalPlaced}</div>
                                <div className="stat-label">Placed Graduates</div>
                            </div>
                            <div className="stat-card" style={{ padding: '0.85rem' }}>
                                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{placementStats.totalStudents}</div>
                                <div className="stat-label">Total Cohort</div>
                            </div>
                            <div className="stat-card" style={{ padding: '0.85rem' }}>
                                <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-success)' }}>{placementStats.placementRate}%</div>
                                <div className="stat-label">Conversion Rate</div>
                            </div>
                        </div>
                    ) : <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No placement records registered yet.</p>}
                </div>

                {/* ─── SKILL TRENDS ─── */}
                <div className="glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <TrendingUp size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Market Skill Trajectories</h2>
                    </div>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Macro classification of skill velocity from ongoing job ingestion.
                    </p>
                    {trends ? (
                        <>
                            <div className="dashboard-grid grid-3" style={{ marginBottom: '1rem' }}>
                                <div className="stat-card" style={{ padding: '0.75rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>{trends.rising_count}</div>
                                    <div className="stat-label">Emerging</div>
                                </div>
                                <div className="stat-card" style={{ padding: '0.75rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-warning)' }}>{trends.stable_count}</div>
                                    <div className="stat-label">Stable</div>
                                </div>
                                <div className="stat-card" style={{ padding: '0.75rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-danger)' }}>{trends.declining_count}</div>
                                    <div className="stat-label">Declining</div>
                                </div>
                            </div>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--foreground)' }}>High-Velocity Emerging Competencies</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                {(trends.top_emerging || []).map(s => <span key={s} className="skill-tag rising" style={{ textTransform: 'capitalize' }}>{s}</span>)}
                            </div>
                        </>
                    ) : <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Trend model telemetry loading...</p>}
                </div>
            </div>

            {/* ─── SECTOR GROWTH + PROFICIENCY DEMAND ─── */}
            <div className="dashboard-grid grid-2">
                <div className="glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Layers size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Regional Sector Hiring Volume</h2>
                    </div>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Relative proportion of open requisitions categorized by industry discipline.
                    </p>
                    {stats?.sectorGrowth?.length > 0 ? (
                        stats.sectorGrowth.map((item, i) => (
                            <div key={item.sector} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.825rem', width: '100px', fontWeight: i === 0 ? 600 : 400 }}>{item.sector}</span>
                                <div style={{ flex: 1, height: '8px', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(item.count / stats.sectorGrowth[0].count) * 100}%`, background: 'var(--primary)', borderRadius: 'var(--radius-sm)', transition: 'width 0.5s ease' }}></div>
                                </div>
                                <span style={{ fontSize: '0.775rem', color: 'var(--muted-foreground)', width: '60px', textAlign: 'right' }}>{item.count} jobs</span>
                            </div>
                        ))
                    ) : <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No industry sector metrics available.</p>}
                </div>

                <div className="glass-panel">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Proficiency Level Requirements</h2>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Experience baseline distribution across active job requisitions.
                    </p>
                    {stats?.proficiencyDemand?.length > 0 ? (
                        stats.proficiencyDemand.map((item) => {
                            const colors = { Beginner: 'var(--accent-success)', Intermediate: 'var(--primary)', Advanced: 'var(--accent-warning)' };
                            const total = stats.proficiencyDemand.reduce((s, i) => s + i.count, 0);
                            return (
                                <div key={item.level} style={{ marginBottom: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.level}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{item.count} postings ({Math.round((item.count / total) * 100)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(item.count / total) * 100}%`, background: colors[item.level] || 'var(--primary)', borderRadius: 'var(--radius-sm)', transition: 'width 0.5s ease' }}></div>
                                    </div>
                                </div>
                            );
                        })
                    ) : <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No proficiency level statistics recorded.</p>}

                    {/* Evidence Quality Indicators */}
                    {(stats?.validatedCount > 0 || stats?.revisedCount > 0) && (
                        <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Loop Closure Indicators
                            </span>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <div className="stat-card" style={{ flex: 1, padding: '0.65rem' }}>
                                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-success)' }}>{stats.validatedCount}</div>
                                    <div className="stat-label">Employer Validated</div>
                                </div>
                                <div className="stat-card" style={{ flex: 1, padding: '0.65rem' }}>
                                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.revisedCount}</div>
                                    <div className="stat-label">Curricula Revised</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
