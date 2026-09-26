import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../api';

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
            setSeedMsg('Demo data loaded! Refresh to see stats.');
            fetchAll();
        } catch (e) { setSeedMsg('Seed failed'); }
        finally { setSeeding(false); }
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="dashboard-header">
                <h1>🧠 Neural Analytics Dashboard</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-warning btn-sm" onClick={handleSeed} disabled={seeding}>
                        {seeding ? 'Seeding...' : '⚡ Boot Neural Data'}
                    </button>
                    <button className="btn-outline" onClick={() => navigate('/')}>Home</button>
                </div>
            </div>

            {seedMsg && <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--accent-success)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-success)' }}>{seedMsg}</div>}

            {/* ─── OVERVIEW STATS ─── */}
            {stats && (
                <>
                    <div className="dashboard-grid grid-4" style={{ marginBottom: '2rem' }}>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.totalUsers}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.totalJobs}</div>
                            <div className="stat-label">Job Postings</div>
                        </div>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.totalReports}</div>
                            <div className="stat-label">Gap Reports</div>
                        </div>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.avgAlignment}%</div>
                            <div className="stat-label">Avg Alignment Score</div>
                        </div>
                    </div>

                    <div className="dashboard-grid grid-3" style={{ marginBottom: '2rem' }}>
                        <div className="stat-card">
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>🧑‍💻 {stats.roleBreakdown?.students || 0}</div>
                            <div className="stat-label">Students</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>🏛️ {stats.roleBreakdown?.colleges || 0}</div>
                            <div className="stat-label">Colleges</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>🤖 {stats.roleBreakdown?.companies || 0}</div>
                            <div className="stat-label">Companies</div>
                        </div>
                    </div>
                </>
            )}

            <div className="dashboard-grid grid-2" style={{ marginBottom: '2rem' }}>
                {/* ─── TOP MISSING SKILLS ─── */}
                <div className="glass-panel">
                    <h2 style={{ marginBottom: '1rem', color: 'var(--accent-danger)' }}>⚡ Critical Neural Gaps (Missing Skills)</h2>
                    {stats?.topMissingSkills?.length > 0 ? (
                        stats.topMissingSkills.map((item, i) => (
                            <div key={item.skill} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '20px' }}>#{i + 1}</span>
                                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{item.skill}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ background: 'var(--accent-danger)', height: '6px', borderRadius: '3px', width: `${Math.min(item.count * 40, 120)}px`, opacity: 0.7 }}></div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.count}x</span>
                                </div>
                            </div>
                        ))
                    ) : <p style={{ color: 'var(--text-muted)' }}>No gap data yet. Upload syllabuses to see results.</p>}
                </div>

                {/* ─── EMPLOYER SURVEY STATS ─── */}
                <div className="glass-panel">
                    <h2 style={{ marginBottom: '1rem', color: 'var(--accent-warning)' }}>🔮 Employer Pulse</h2>
                    {surveyStats ? (
                        <>
                            <div className="dashboard-grid grid-2" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ fontSize: '1.8rem' }}>
                                        {surveyStats.avgSatisfaction}/5
                                    </div>
                                    <div className="stat-label">Avg Satisfaction</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ fontSize: '1.8rem' }}>{surveyStats.total}</div>
                                    <div className="stat-label">Total Surveys</div>
                                </div>
                            </div>

                            {surveyStats.topNeededSkills?.length > 0 && (
                                <>
                                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Skills Employers Need Most</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        {surveyStats.topNeededSkills.map(item => (
                                            <span key={item.skill} className="skill-tag missing" style={{ textTransform: 'capitalize' }}>
                                                {item.skill} ({item.count})
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}

                            {surveyStats.qualityDistribution && Object.keys(surveyStats.qualityDistribution).length > 0 && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Candidate Quality Distribution</h3>
                                    {Object.entries(surveyStats.qualityDistribution).map(([quality, count]) => {
                                        const colors = { 'Poor': '#ef4444', 'Below Average': '#f59e0b', 'Average': '#eab308', 'Good': '#10b981', 'Excellent': '#6366f1' };
                                        return (
                                            <div key={quality} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', width: '120px' }}>{quality}</span>
                                                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${(count / surveyStats.total) * 100}%`, background: colors[quality] || 'var(--primary)', borderRadius: '4px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : <p style={{ color: 'var(--text-muted)' }}>No survey data yet.</p>}
                </div>
            </div>

            <div className="dashboard-grid grid-2">
                {/* ─── PLACEMENT STATS ─── */}
                <div className="glass-panel">
                    <h2 style={{ marginBottom: '1rem', color: 'var(--accent-success)' }}>💎 Acquisition Analytics</h2>
                    {placementStats ? (
                        <div className="dashboard-grid grid-3">
                            <div className="stat-card">
                                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{placementStats.totalPlaced}</div>
                                <div className="stat-label">Students Placed</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{placementStats.totalStudents}</div>
                                <div className="stat-label">Total Students</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-success)' }}>{placementStats.placementRate}%</div>
                                <div className="stat-label">Placement Rate</div>
                            </div>
                        </div>
                    ) : <p style={{ color: 'var(--text-muted)' }}>No placement data yet.</p>}
                </div>

                {/* ─── SKILL TRENDS ─── */}
                <div className="glass-panel">
                    <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>🚀 Quantum Trend Summary</h2>
                    {trends ? (
                        <>
                            <div className="dashboard-grid grid-3" style={{ marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>{trends.rising_count}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rising</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-warning)' }}>{trends.stable_count}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stable</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-danger)' }}>{trends.declining_count}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Declining</div>
                                </div>
                            </div>
                            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Top Emerging Skills</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {(trends.top_emerging || []).map(s => <span key={s} className="skill-tag rising" style={{ textTransform: 'capitalize' }}>{s}</span>)}
                            </div>
                        </>
                    ) : <p style={{ color: 'var(--text-muted)' }}>Trends loading...</p>}
                </div>
            </div>

            {/* ─── SECTOR GROWTH + PROFICIENCY DEMAND ─── */}
            <div className="dashboard-grid grid-2" style={{ marginTop: '2rem' }}>
                <div className="glass-panel">
                    <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>🌐 Neural Sector Growth</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Which sectors are generating the most job postings right now?</p>
                    {stats?.sectorGrowth?.length > 0 ? (
                        stats.sectorGrowth.map((item, i) => (
                            <div key={item.sector} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                                <span style={{ fontSize: '0.85rem', width: '110px', fontWeight: i === 0 ? 700 : 400 }}>{item.sector}</span>
                                <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(item.count / stats.sectorGrowth[0].count) * 100}%`, background: i === 0 ? 'var(--primary)' : 'var(--secondary)', borderRadius: '5px', transition: 'width 0.5s ease' }}></div>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '60px', textAlign: 'right' }}>{item.count} jobs</span>
                            </div>
                        ))
                    ) : <p style={{ color: 'var(--text-muted)' }}>No job data yet. Load demo data or have companies post jobs.</p>}
                </div>

                <div className="glass-panel">
                    <h2 style={{ marginBottom: '1rem', color: 'var(--accent-warning)' }}>🧬 Proficiency Level Demand</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>What skill level are employers looking for most? Helps training centers know what level to pitch their courses at.</p>
                    {stats?.proficiencyDemand?.length > 0 ? (
                        stats.proficiencyDemand.map((item) => {
                            const colors = { Beginner: '#10b981', Intermediate: '#6366f1', Advanced: '#f59e0b' };
                            const total = stats.proficiencyDemand.reduce((s, i) => s + i.count, 0);
                            return (
                                <div key={item.level} style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                        <span style={{ fontWeight: 600 }}>{item.level}</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.count} jobs ({Math.round((item.count / total) * 100)}%)</span>
                                    </div>
                                    <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(item.count / total) * 100}%`, background: colors[item.level] || 'var(--primary)', borderRadius: '6px', transition: 'width 0.5s ease' }}></div>
                                    </div>
                                </div>
                            );
                        })
                    ) : <p style={{ color: 'var(--text-muted)' }}>No proficiency data yet.</p>}

                    {/* Quality indicators */}
                    {(stats?.validatedCount > 0 || stats?.revisedCount > 0) && (
                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Evidence Quality Indicators</h4>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="stat-card" style={{ flex: 1, padding: '0.75rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>{stats.validatedCount}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Employer Validated Reports</div>
                                </div>
                                <div className="stat-card" style={{ flex: 1, padding: '0.75rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.revisedCount}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curricula Revised</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

