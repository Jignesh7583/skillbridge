import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import {
    BarChart3, Database, Users, Building2, Briefcase, Award, TrendingUp,
    Layers, Home, AlertCircle, CheckCircle2, MapPin, Wrench, ShieldCheck, FileText, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [surveyStats, setSurveyStats] = useState(null);
    const [trends, setTrends] = useState(null);
    const [seeding, setSeeding] = useState(false);
    const [seedMsg, setSeedMsg] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [s1, s2, s3] = await Promise.all([
                axios.get(`${API}/api/analytics/dashboard`).catch(() => ({ data: null })),
                axios.get(`${API}/api/surveys/stats`).catch(() => ({ data: null })),
                axios.get(`${API}/api/skills/trends`).catch(() => ({ data: null })),
            ]);
            setStats(s1.data);
            setSurveyStats(s2.data);
            setTrends(s3.data);
        } catch (e) { console.error(e); }
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const res = await axios.post(`${API}/api/seed`);
            setSeedMsg(res.data.message || 'Demonstration dataset seeded successfully.');
            fetchAll();
            setTimeout(() => setSeedMsg(''), 5000);
        } catch (e) { setSeedMsg('Data seeding failed.'); }
        finally { setSeeding(false); }
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
                        Government & Directorate Command Center
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        Labour-market intelligence, curriculum alignment audits, district training roadmaps, and validation audit logs
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button className="btn-sm btn-secondary" onClick={handleSeed} disabled={seeding}>
                        <Database size={14} /> {seeding ? 'Seeding...' : 'Reset & Seed Demo Scenario'}
                    </button>
                    <button className="btn-outline btn-sm" onClick={() => navigate('/')}>
                        <Home size={14} /> Home
                    </button>
                </div>
            </div>

            {seedMsg && (
                <div style={{ background: 'oklch(0.96 0.03 145)', border: '1px solid oklch(0.90 0.05 145)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', color: 'oklch(0.35 0.12 145)', fontSize: '0.85rem' }}>
                    ✓ {seedMsg}
                </div>
            )}

            {/* Navigation Tabs for Government Requirements */}
            <div className="tabs" style={{ flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    Overview & Telemetry
                </button>
                <button className={`tab ${activeTab === 'roles-skills' ? 'active' : ''}`} onClick={() => setActiveTab('roles-skills')}>
                    1 & 2. Roles & Skill Demand
                </button>
                <button className={`tab ${activeTab === 'alignment' ? 'active' : ''}`} onClick={() => setActiveTab('alignment')}>
                    3. Curriculum Alignment
                </button>
                <button className={`tab ${activeTab === 'districts' ? 'active' : ''}`} onClick={() => setActiveTab('districts')}>
                    5. District-Wise Demand
                </button>
                <button className={`tab ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>
                    5. Training & Equipment Plans
                </button>
                <button className={`tab ${activeTab === 'validation' ? 'active' : ''}`} onClick={() => setActiveTab('validation')}>
                    4. Employer Validation Log
                </button>
                <button className={`tab ${activeTab === 'placements' ? 'active' : ''}`} onClick={() => setActiveTab('placements')}>
                    7. Placement Outcomes
                </button>
            </div>

            {/* ─── TAB 1: OVERVIEW & TELEMETRY ─── */}
            {activeTab === 'overview' && stats && (
                <>
                    <div className="dashboard-grid grid-4" style={{ marginBottom: '1.5rem' }}>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.totalJobs}</div>
                            <div className="stat-label">Job Requisitions Ingested</div>
                        </div>
                        <div className="stat-card animate-count">
                            <div className="stat-value">{stats.totalReports}</div>
                            <div className="stat-label">Curriculum Gap Audits</div>
                        </div>
                        <div className="stat-card animate-count">
                            <div className="stat-value" style={{ color: Number(stats.avgAlignment) >= 60 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                                {stats.avgAlignment}%
                            </div>
                            <div className="stat-label">Average Curriculum Alignment</div>
                        </div>
                        <div className="stat-card animate-count">
                            <div className="stat-value" style={{ color: 'var(--accent-success)' }}>
                                {stats.employerValidationStats?.validatedCount || 0}
                            </div>
                            <div className="stat-label">Employer Validations Recorded</div>
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
                                <div className="stat-label">Colleges & Polytechnics</div>
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
                                <div className="stat-label">Employers & Industry Partners</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
                                    {stats.roleBreakdown?.companies || 0}
                                </div>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <Briefcase size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-grid grid-2">
                        {/* Loop Closure Telemetry */}
                        <div className="glass-panel">
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                                Closed-Loop Alignment Governance
                            </h2>
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                Status of colleges progressing from initial gap identification to curriculum revision and industry validation.
                            </p>
                            <div className="dashboard-grid grid-3" style={{ marginBottom: '1rem' }}>
                                <div className="stat-card" style={{ padding: '0.75rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-danger)' }}>
                                        {stats.curriculumAlignment?.distribution?.critical || 0}
                                    </div>
                                    <div className="stat-label">Critical Gaps (&lt;50%)</div>
                                </div>
                                <div className="stat-card" style={{ padding: '0.75rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-warning)' }}>
                                        {stats.curriculumAlignment?.distribution?.moderate || 0}
                                    </div>
                                    <div className="stat-label">Moderate (50-75%)</div>
                                </div>
                                <div className="stat-card" style={{ padding: '0.75rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                                        {stats.curriculumAlignment?.distribution?.aligned || 0}
                                    </div>
                                    <div className="stat-label">Aligned (&gt;75%)</div>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                                <strong>Revisions Applied:</strong> {stats.employerValidationStats?.revisedCount || 0} academic programs updated curriculum based on automated gap reports.
                            </div>
                        </div>

                        {/* Macro Trajectory */}
                        <div className="glass-panel">
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                                Skill Velocity Breakdown
                            </h2>
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                Algorithmic classification of tech competencies based on current hiring rates.
                            </p>
                            {trends ? (
                                <div className="dashboard-grid grid-3">
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
                            ) : <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Loading skill trend model...</p>}
                        </div>
                    </div>
                </>
            )}

            {/* ─── TAB 2: ROLES & SKILL DEMAND ─── */}
            {activeTab === 'roles-skills' && stats && (
                <div className="dashboard-grid grid-2">
                    {/* Top Demanded Roles */}
                    <div className="glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Briefcase size={18} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Top Demanded Job Roles</h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Open vacancies aggregated from employer requisitions across industrial clusters.
                        </p>
                        {stats.topDemandedRoles?.length > 0 ? (
                            stats.topDemandedRoles.map((r, i) => (
                                <div key={r.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>
                                            #{i + 1} {r.role}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                            Districts: {r.locations?.join(', ') || 'General'} · Sector: {r.sectors?.join(', ') || 'IT'}
                                        </div>
                                    </div>
                                    <span className="badge badge-success">{r.count} postings</span>
                                </div>
                            ))
                        ) : <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No role demand data available.</p>}
                    </div>

                    {/* Top Demanded Skills vs Critical Gaps */}
                    <div className="glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <AlertCircle size={18} color="var(--accent-danger)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Demanded Skills vs. Curriculum Gaps</h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Comparison of industry-demanded skills vs skills absent in colleges.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--accent-success)', marginBottom: '0.5rem' }}>Top Demanded Skills</h3>
                                {(stats.topDemandedSkills || []).slice(0, 8).map((s, i) => (
                                    <div key={s.skill} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{s.skill}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{s.count}x</span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--accent-danger)', marginBottom: '0.5rem' }}>Top Missing Gaps</h3>
                                {(stats.topMissingSkills || []).slice(0, 8).map((s, i) => (
                                    <div key={s.skill} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{s.skill}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-danger)' }}>{s.count} reports</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB 3: CURRICULUM ALIGNMENT ─── */}
            {activeTab === 'alignment' && stats && (
                <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                                Institutional Curriculum Alignment Index
                            </h2>
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                                Audited syllabi compared against live market competency requirements.
                            </p>
                        </div>
                        <span className="badge badge-success">Mean Score: {stats.curriculumAlignment?.averageScore || 0}%</span>
                    </div>

                    <table className="data-table" style={{ marginTop: '1rem' }}>
                        <thead>
                            <tr>
                                <th>Institution</th>
                                <th>Branch / Specialization</th>
                                <th>Location</th>
                                <th>Target Role</th>
                                <th>Alignment Score</th>
                                <th>Revision Status</th>
                                <th>Employer Validation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats.curriculumAlignment?.recentReports || []).map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600 }}>{r.college}</td>
                                    <td>{r.branch}</td>
                                    <td>{r.location || 'General'}</td>
                                    <td><span className="badge badge-secondary">{r.targetRole}</span></td>
                                    <td>
                                        <strong style={{ color: r.overallScore >= 70 ? 'var(--accent-success)' : r.overallScore >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}>
                                            {r.overallScore}%
                                        </strong>
                                    </td>
                                    <td>
                                        {r.revisionStatus === 'Revised' ? (
                                            <span className="badge badge-success">✓ Revised (+{r.scoreImprovement || 60}%)</span>
                                        ) : (
                                            <span className="badge badge-warning">Initial Draft</span>
                                        )}
                                    </td>
                                    <td>
                                        {r.validationStatus === 'Employer Validated' ? (
                                            <span className="badge badge-success">✓ Verified</span>
                                        ) : (
                                            <span className="badge badge-outline">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── TAB 4: DISTRICT DEMAND ─── */}
            {activeTab === 'districts' && stats && (
                <div className="glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <MapPin size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                            District-Wise Labour Market Demand
                        </h2>
                    </div>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                        Localized hiring volume, top demanded role, and core required skills per administrative district.
                    </p>
                    <div className="dashboard-grid grid-3">
                        {(stats.districtDemand || []).map(d => (
                            <div key={d.district} className="card-item" style={{ borderLeft: d.district === 'Jaipur' ? '3px solid var(--primary)' : '3px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>{d.district}</h3>
                                    <span className="badge badge-success">{d.jobCount} Active Postings</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', marginBottom: '0.4rem' }}>
                                    <strong>Primary Role:</strong> {d.topRole}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                    <strong>Demanded Skills:</strong>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.25rem' }}>
                                        {(d.topSkills || []).map(s => (
                                            <span key={s} className="skill-tag matched" style={{ fontSize: '0.7rem' }}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── TAB 5: TRAINING RECOMMENDATIONS & EQUIPMENT GAPS ─── */}
            {activeTab === 'training' && stats && (
                <div className="dashboard-grid grid-2">
                    {/* Training Recommendations */}
                    <div className="glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <FileText size={18} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                                District Training Recommendations
                            </h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Approved regional upskilling programs aligned to employer skill gaps.
                        </p>
                        {(stats.trainingRecommendations || []).length > 0 ? (
                            stats.trainingRecommendations.map(tp => (
                                <div key={tp.id} className="card-item" style={{ marginBottom: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)' }}>{tp.district} Upskilling Plan</h3>
                                        <span className="badge badge-success">{tp.status || 'Approved'}</span>
                                    </div>
                                    <div style={{ fontSize: '0.775rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                                        <strong>Target Skills:</strong> {tp.targetSkills}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--foreground)' }}>
                                        <strong>Timeline:</strong> {tp.timeline}
                                    </div>
                                    {tp.courses?.length > 0 && (
                                        <div style={{ marginTop: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.35rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Recommended Courses:</span>
                                            <ul style={{ paddingLeft: '1.15rem', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
                                                {tp.courses.map((c, idx) => (
                                                    <li key={idx}>{c.courseName || c.course || c} {c.provider ? `(${c.provider})` : ''}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No training plans recorded yet.</p>}
                    </div>

                    {/* Trainer & Equipment Gaps */}
                    <div className="glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Wrench size={18} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                                Trainer & Lab Equipment Gaps
                            </h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Infrastructure deficits and instructor recruitment requirements per district.
                        </p>
                        <h3 style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                            Faculty & Trainer Requirements
                        </h3>
                        {(stats.trainerEquipmentGaps?.trainers || []).map((t, idx) => (
                            <div key={idx} style={{ background: 'var(--muted)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius)', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                <strong>{t.district}:</strong> {t.requirement}
                            </div>
                        ))}

                        <h3 style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--foreground)', marginTop: '1rem', marginBottom: '0.5rem' }}>
                            Lab Equipment & Hardware Needs
                        </h3>
                        {(stats.trainerEquipmentGaps?.equipment || []).map((e, idx) => (
                            <div key={idx} style={{ background: 'var(--muted)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius)', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                <strong>{e.district}:</strong> {e.needed}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── TAB 6: EMPLOYER VALIDATION & EVIDENCE LOG ─── */}
            {activeTab === 'validation' && stats && (
                <div className="glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <ShieldCheck size={18} color="var(--accent-success)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                            Employer Validation Audit Trail
                        </h2>
                    </div>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Verifiable evidence of industry hiring committees confirming or disputing algorithmic gap outputs.
                    </p>
                    <div className="dashboard-grid grid-3" style={{ marginBottom: '1.25rem' }}>
                        <div className="stat-card" style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                                {stats.employerValidationStats?.validatedCount || 0}
                            </div>
                            <div className="stat-label">Validated Reports</div>
                        </div>
                        <div className="stat-card" style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-warning)' }}>
                                {stats.employerValidationStats?.pendingValidation || 0}
                            </div>
                            <div className="stat-label">Pending Reviews</div>
                        </div>
                        <div className="stat-card" style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {stats.totalSurveys || 0}
                            </div>
                            <div className="stat-label">Surveys Ingested</div>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                        Verified Gap Reports Evidence Trail
                    </h3>
                    {(stats.employerValidationStats?.auditTrail || []).length > 0 ? (
                        stats.employerValidationStats.auditTrail.map((log, idx) => (
                            <div key={idx} className="card-item" style={{ borderLeft: '3px solid var(--accent-success)', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>
                                        {log.collegeName} ({log.district}) — Target: {log.targetRole}
                                    </span>
                                    <span className="badge badge-success">✓ {log.status}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', marginTop: '0.35rem' }}>
                                    <strong>Validated By:</strong> {log.validatedBy}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                                    "{log.comment}"
                                </div>
                                <div style={{ fontSize: '0.725rem', color: 'var(--muted-foreground)', marginTop: '0.35rem' }}>
                                    Timestamp: {new Date(log.validatedAt).toLocaleString()}
                                </div>
                            </div>
                        ))
                    ) : <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No employer validation logs recorded yet.</p>}
                </div>
            )}

            {/* ─── TAB 7: PLACEMENT OUTCOMES ─── */}
            {activeTab === 'placements' && stats && (
                <div className="glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Award size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                            Placement Outcomes & Hiring Conversions
                        </h2>
                    </div>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                        Verified graduate employment records proving closed-loop alignment between revised curricula and industry recruitment.
                    </p>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>District</th>
                                <th>Hiring Company</th>
                                <th>Designation / Role</th>
                                <th>Package</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats.placementOutcomes?.recent || []).map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}>{p.studentName}</td>
                                    <td>{p.district || p.studentLocation || 'Jaipur'}</td>
                                    <td>{p.companyName}</td>
                                    <td><span className="badge badge-secondary">{p.role}</span></td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-success)' }}>{p.package || '6.5 LPA'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
