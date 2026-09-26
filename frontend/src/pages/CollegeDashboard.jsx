import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function CollegeDashboard() {
    const [activeTab, setActiveTab] = useState('upload');
    const [reports, setReports] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [trainingPlans, setTrainingPlans] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Syllabus form
    const [form, setForm] = useState({ branch: '', semester: '', subjects: '', content: '', university: '', lastUpdated: '2024' });

    // Training plan form
    const [tpForm, setTpForm] = useState({ district: '', targetSkills: '' });

    // Placement form
    const [placementForm, setPlacementForm] = useState({ studentEmail: '', companyName: '', jobRole: '', package: '', location: '' });
    const [placementMsg, setPlacementMsg] = useState('');

    useEffect(() => {
        if (!token) navigate('/login');
        fetchReports();
        fetchPlans();
    }, []);

    const fetchReports = async () => {
        try { const r = await axios.get(`${API}/api/reports`); setReports(r.data); } catch (e) { }
    };
    const fetchPlans = async () => {
        try { const r = await axios.get(`${API}/api/training-plans`); setTrainingPlans(r.data); } catch (e) { }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setIsAnalyzing(true);
        try {
            const res = await axios.post(`${API}/api/syllabus`, form, { headers: { Authorization: `Bearer ${token}` } });
            setForm({ branch: '', semester: '', subjects: '', content: '', university: '', lastUpdated: '2024' });
            fetchReports();
        } catch (err) {
            alert('Failed to analyze. Make sure ML engine is running.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGeneratePlan = async (e) => {
        e.preventDefault();
        try {
            const skills = tpForm.targetSkills.split(',').map(s => s.trim()).filter(Boolean);
            await axios.post(`${API}/api/training-plans`, { district: tpForm.district, targetSkills: skills });
            setTpForm({ district: '', targetSkills: '' });
            fetchPlans();
        } catch (err) {
            alert('Failed to generate plan');
        }
    };

    const handlePlacementSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/api/placements`, placementForm, { headers: { Authorization: `Bearer ${token}` } });
            setPlacementMsg('Placement record submitted successfully!');
            setPlacementForm({ studentEmail: '', companyName: '', jobRole: '', package: '', location: '' });
            setTimeout(() => setPlacementMsg(''), 3000);
        } catch (err) {
            alert('Failed to submit placement data.');
        }
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="dashboard-header">
                <h1>🏛️ Neural College Hub</h1>
                <button className="btn-outline" onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
            </div>

            <div className="tabs">
                <button className={`tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>Upload Syllabus</button>
                <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Gap Reports ({reports.length})</button>
                <button className={`tab ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>Training Plans</button>
                <button className={`tab ${activeTab === 'placements' ? 'active' : ''}`} onClick={() => setActiveTab('placements')}>Placement Data</button>
            </div>

            {placementMsg && <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-success)', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-success)' }}>{placementMsg}</div>}


            {/* ─── UPLOAD SYLLABUS TAB ─── */}
            {activeTab === 'upload' && (
                <div className="dashboard-grid grid-2">
                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1rem', color: 'var(--accent-success)' }}>⚡ Inject Syllabus Data</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Paste your syllabus content below. Our AI engine will compare it against {'>'}200 industry skills and current job requirements.
                        </p>
                        <form onSubmit={handleUpload}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input placeholder="Branch (e.g. Computer Science)" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} required />
                                <input placeholder="Semester (e.g. 5)" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input placeholder="University" value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} />
                                <input placeholder="Last Updated Year" value={form.lastUpdated} onChange={e => setForm({ ...form, lastUpdated: e.target.value })} />
                            </div>
                            <input placeholder="Subjects (comma-separated)" value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} />
                            <textarea placeholder="Paste full syllabus content here... Include topics like: Data Structures, Algorithms, Java, SQL, Operating Systems, Computer Networks, HTML, CSS..." rows="8" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
                            <button type="submit" className="btn-success" style={{ width: '100%' }} disabled={isAnalyzing}>
                                {isAnalyzing ? '🔮 Scanning Matrices...' : '⚡ Run AI Analysis'}
                            </button>
                        </form>
                    </div>
                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1rem' }}>Quick Stats</h2>
                        <div className="dashboard-grid grid-2" style={{ marginBottom: '1.5rem' }}>
                            <div className="stat-card">
                                <div className="stat-value">{reports.length}</div>
                                <div className="stat-label">Reports Generated</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.overallScore, 0) / reports.length) : 0}%</div>
                                <div className="stat-label">Avg Alignment</div>
                            </div>
                        </div>
                        {reports.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Latest Report Summary</h3>
                                <ReportCard report={reports[0]} compact />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── GAP REPORTS TAB ─── */}
            {activeTab === 'reports' && (
                <div>
                    {reports.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Upload a syllabus to generate gap analysis reports.</p>
                        </div>
                    ) : (
                        reports.map(r => <ReportCard key={r.id} report={r} />)
                    )}
                </div>
            )}

            {/* ─── TRAINING PLANS TAB ─── */}
            {activeTab === 'plans' && (
                <div className="dashboard-grid grid-2">
                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>⚡ Generate Neural District Plan</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Enter a district and target skills to generate a comprehensive training plan with courses, trainers, and equipment needs.
                        </p>
                        <form onSubmit={handleGeneratePlan}>
                            <input placeholder="District (e.g. Jodhpur)" value={tpForm.district} onChange={e => setTpForm({ ...tpForm, district: e.target.value })} required />
                            <textarea placeholder="Target Skills (comma-separated, e.g. Python, Machine Learning, AWS, Docker)" rows="3" value={tpForm.targetSkills} onChange={e => setTpForm({ ...tpForm, targetSkills: e.target.value })} required />
                            <button type="submit" style={{ width: '100%' }}>Generate Training Plan</button>
                        </form>
                    </div>
                    <div className="glass-panel" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Generated Plans ({trainingPlans.length})</h2>
                        {trainingPlans.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No plans yet. Generate one on the left.</p>}
                        {trainingPlans.map(p => {
                            let courses = [];
                            try { courses = JSON.parse(p.recommendedCourses || '[]'); } catch (e) { }
                            // Parse equipment and oversupply from stored JSON
                            let equipment = p.equipmentNeeded;
                            let oversupplied = [];
                            try {
                                const eq = JSON.parse(p.equipmentNeeded || '{}');
                                if (eq.equipment) { equipment = eq.equipment.join(', '); oversupplied = eq.oversupplied || []; }
                            } catch (e) { }
                            return (
                                <div key={p.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h3>🌐 {p.district}</h3>
                                        <span className="skill-tag rising">{p.status || 'Draft'}</span>
                                    </div>

                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🎯 Target Skills:</strong>
                                        <div style={{ marginTop: '0.25rem' }}>
                                            {p.targetSkills.split(',').map(s => <span key={s} className="skill-tag matched">{s.trim()}</span>)}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                        <strong>🤖 AI Mentors Required: </strong>
                                        <span style={{ color: 'var(--text-muted)' }}>{p.trainerRequirements}</span>
                                    </div>
                                    <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                        <strong>🖥️ Equipment: </strong>
                                        <span style={{ color: 'var(--text-muted)' }}>{equipment}</span>
                                    </div>
                                    <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                        <strong>⏱️ Timeline: </strong>
                                        <span style={{ color: 'var(--accent-warning)' }}>{p.timeline}</span>
                                    </div>

                                    {courses.length > 0 && (
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <strong style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>🧠 AI Recommended Courses:</strong>
                                            {courses.map((c, i) => (
                                                <div key={i} style={{ background: 'rgba(99,102,241,0.08)', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', marginTop: '0.3rem', fontSize: '0.8rem' }}>
                                                    <strong>{c.course}</strong> — {c.provider} · {c.duration} · {c.level}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {oversupplied.length > 0 && (
                                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                            <strong style={{ fontSize: '0.8rem', color: 'var(--accent-warning)' }}>⚠️ Oversupplied/Obsolete — Do NOT invest training capacity here:</strong>
                                            <div style={{ marginTop: '0.25rem' }}>
                                                {oversupplied.map(s => <span key={s} className="skill-tag obsolete">{s}</span>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── PLACEMENTS TAB ─── */}
            {activeTab === 'placements' && (
                <div className="dashboard-grid grid-2">
                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>💎 Submit Acquisition Data</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Report student placements to help build an evidence-based feedback loop for curriculum alignment.
                        </p>
                        <form onSubmit={handlePlacementSubmit}>
                            <input type="email" placeholder="Student Email (e.g. john@student.com)" value={placementForm.studentEmail} onChange={e => setPlacementForm({ ...placementForm, studentEmail: e.target.value })} required />
                            <input placeholder="Hiring Company (e.g. TCS, Infosys)" value={placementForm.companyName} onChange={e => setPlacementForm({ ...placementForm, companyName: e.target.value })} required />
                            <input placeholder="Job Role (e.g. Full Stack Developer)" value={placementForm.jobRole} onChange={e => setPlacementForm({ ...placementForm, jobRole: e.target.value })} required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input placeholder="Package (e.g. 8 LPA)" value={placementForm.package} onChange={e => setPlacementForm({ ...placementForm, package: e.target.value })} required />
                                <input placeholder="Location (e.g. Pune)" value={placementForm.location} onChange={e => setPlacementForm({ ...placementForm, location: e.target.value })} required />
                            </div>
                            <button type="submit" style={{ width: '100%' }}>Submit Placement Record</button>
                        </form>
                    </div>
                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1rem' }}>Why track placements?</h2>
                        <ul style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
                            <li><strong>Validate Curricula:</strong> Proves whether curriculum updates led to real-world jobs.</li>
                            <li><strong>Track Demand:</strong> Shows which companies are hiring and for which roles locally.</li>
                            <li><strong>Better ROI:</strong> Demonstrates the return on investment for skill development programs.</li>
                            <li><strong>Career Guidance:</strong> Provides real data to guide future students on which skills actually get hired.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReportCard({ report, compact, onRevised }) {
    const r = report;
    const token = localStorage.getItem('token');
    let recommendations = [];
    try { recommendations = JSON.parse(r.recommendations || '[]'); } catch (e) { }
    let demandAnalysis = {};
    try { demandAnalysis = JSON.parse(r.demandAnalysis || '{}'); } catch (e) { }

    const [revisionStatus, setRevisionStatus] = React.useState(demandAnalysis.revisionStatus || null);
    const [marking, setMarking] = React.useState(false);
    const validationStatus = demandAnalysis.validationStatus || null;
    const scoreColor = r.overallScore >= 70 ? 'var(--accent-success)' : r.overallScore >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)';

    const handleMarkRevised = async () => {
        setMarking(true);
        try {
            const res = await axios.patch(`${API}/api/reports/${r.id}/status`,
                { status: 'Revised' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRevisionStatus('Revised');
            alert('Report marked as Revised! This signals that the curriculum has been updated.');
            if (onRevised) onRevised(r.id);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to mark as revised');
        } finally { setMarking(false); }
    };

    return (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '1.5rem', borderLeft: `3px solid ${revisionStatus === 'Revised' ? 'var(--accent-success)' : scoreColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ marginBottom: '0.2rem' }}>{r.college?.name} — {r.syllabus?.branch} (Sem {r.syllabus?.semester})</h3>
                    {r.syllabus?.university && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.syllabus.university}</span>}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        {revisionStatus === 'Revised' && (
                            <span className="skill-tag matched">✓ Curriculum Revised</span>
                        )}
                        {validationStatus === 'Employer Validated' && (
                            <span className="skill-tag matched">✓ Employer Validated</span>
                        )}
                        {validationStatus === 'Employer Disputed' && (
                            <span className="skill-tag missing">✗ Employer Disputed</span>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: scoreColor }}>{r.overallScore}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alignment Score</div>
                </div>
            </div>

            {/* Score Bar */}
            <div className="score-bar-bg" style={{ marginBottom: '1.5rem' }}>
                <div className="score-bar-fill" style={{ width: `${r.overallScore}%`, background: scoreColor }}></div>
            </div>

            {/* Missing Skills */}
            <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: 'var(--accent-danger)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>❌ Missing Industry Skills ({r.missingSkills.split(',').filter(s => s.trim()).length})</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {r.missingSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag missing">{s.trim()}</span>)}
                </div>
            </div>

            {/* Matched Skills */}
            <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: 'var(--accent-success)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>✅ Matched Skills ({r.matchedSkills.split(',').filter(s => s.trim()).length})</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {r.matchedSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag matched">{s.trim()}</span>)}
                </div>
            </div>

            {/* Obsolete Skills */}
            {r.obsoleteSkills && r.obsoleteSkills.trim() && (
                <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: 'var(--accent-warning)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>⚠️ Obsolete / Outdated Topics</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {r.obsoleteSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag obsolete">{s.trim()}</span>)}
                    </div>
                </div>
            )}

            {/* Curriculum Recommendations */}
            {!compact && recommendations.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>📚 Curriculum Update Recommendations</h4>
                    <table className="data-table">
                        <thead>
                            <tr><th>Skill</th><th>Recommended Course</th><th>Provider</th><th>Duration</th><th>Level</th></tr>
                        </thead>
                        <tbody>
                            {recommendations.map((rec, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{rec.skill}</td>
                                    <td>{rec.course}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{rec.provider}</td>
                                    <td>{rec.duration}</td>
                                    <td><span className="skill-tag rising">{rec.level}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Mark as Revised Action */}
            {!compact && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {revisionStatus === 'Revised'
                            ? '✓ You have marked this curriculum as updated.'
                            : 'After updating your curriculum based on these recommendations, click the button to confirm.'}
                    </span>
                    {revisionStatus !== 'Revised' && (
                        <button
                            className="btn-sm btn-success"
                            onClick={handleMarkRevised}
                            disabled={marking}
                            style={{ whiteSpace: 'nowrap', marginLeft: '1rem' }}
                        >
                            {marking ? '...' : '✓ Mark Curriculum as Revised'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

