import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Building2, UploadCloud, FileText, MapPin, Award, CheckCircle, AlertTriangle, XCircle, LogOut } from 'lucide-react';

export default function CollegeDashboard() {
    const [activeTab, setActiveTab] = useState('upload');
    const [reports, setReports] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [trainingPlans, setTrainingPlans] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Syllabus form
    const [form, setForm] = useState({ branch: '', semester: '', subjects: '', content: '', university: '', lastUpdated: '2024', targetRole: 'Data Analyst', district: 'Jaipur' });

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

    const loadDataAnalystDemo = () => {
        setForm({
            branch: 'B.Tech Computer Science (Data Analytics)',
            semester: 'Semester 5',
            university: 'Rajasthan Technical University (RTU)',
            lastUpdated: '2022',
            subjects: 'Database Management Systems, Business Spreadsheets',
            content: 'Spreadsheet Analysis with Advanced Excel, Formulas, Pivot Tables, Relational Database Management Systems, Basic SQL Queries, ER Diagrams, Relational Normalization.',
            targetRole: 'Data Analyst',
            district: 'Jaipur'
        });
    };

    const loadWebDeveloperDemo = () => {
        setForm({
            branch: 'B.Tech Computer Science & Engineering (Web Tech)',
            semester: 'Semester 5',
            university: 'Rajasthan Technical University (RTU)',
            lastUpdated: '2022',
            subjects: 'Web Technologies & Internet Programming',
            content: 'Hypertext Markup Language (HTML5), Cascading Style Sheets (CSS3), JavaScript Fundamentals, DOM Manipulation, Event Listeners, Responsive Web Layouts, Flexbox, CSS Grid.',
            targetRole: 'Web Developer',
            district: 'Jaipur'
        });
    };

    const loadCloudDevOpsDemo = () => {
        setForm({
            branch: 'B.Tech Information Technology (Cloud Infrastructure)',
            semester: 'Semester 6',
            university: 'Rajasthan Technical University (RTU)',
            lastUpdated: '2022',
            subjects: 'Operating Systems & Network Administration',
            content: 'Linux Operating System Architecture, Shell Scripting, File Permissions, TCP/IP Networking, DNS, Routing, Server Virtualization.',
            targetRole: 'Cloud & DevOps Engineer',
            district: 'Jaipur'
        });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setIsAnalyzing(true);
        try {
            await axios.post(`${API}/api/syllabus`, form, { headers: { Authorization: `Bearer ${token}` } });
            setForm({ branch: '', semester: '', subjects: '', content: '', university: '', lastUpdated: '2024', targetRole: 'Data Analyst', district: 'Jaipur' });
            fetchReports();
            setActiveTab('reports');
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
            setPlacementMsg('Placement record submitted successfully.');
            setPlacementForm({ studentEmail: '', companyName: '', jobRole: '', package: '', location: '' });
            setTimeout(() => setPlacementMsg(''), 3000);
        } catch (err) {
            alert('Failed to submit placement data.');
        }
    };

    const handlePlanForReport = (district, missingSkills) => {
        setTpForm({ district: district || 'Jaipur', targetSkills: missingSkills });
        setActiveTab('plans');
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>College & Curriculum Hub</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        Curriculum gap auditing, AI updates, district roadmaps, and graduate placement registry
                    </p>
                </div>
                <button className="btn-outline btn-sm" onClick={() => { localStorage.clear(); navigate('/'); }}>
                    <LogOut size={14} /> Sign Out
                </button>
            </div>

            <div className="tabs">
                <button className={`tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>Upload Syllabus</button>
                <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Gap Reports ({reports.length})</button>
                <button className={`tab ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>Training Plans</button>
                <button className={`tab ${activeTab === 'placements' ? 'active' : ''}`} onClick={() => setActiveTab('placements')}>Placement Data</button>
            </div>

            {placementMsg && (
                <div style={{ background: 'oklch(0.96 0.03 145)', border: '1px solid oklch(0.90 0.05 145)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', color: 'oklch(0.35 0.12 145)', fontSize: '0.85rem' }}>
                    {placementMsg}
                </div>
            )}

            {/* ─── UPLOAD SYLLABUS TAB ─── */}
            {activeTab === 'upload' && (
                <div className="dashboard-grid grid-2">
                    <div className="glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <UploadCloud size={18} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Syllabus Ingestion & Analysis</h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                            Submit department syllabi for automated evaluation against industry competencies and regional hiring requirements.
                        </p>

                        {/* Interactive Role Presets */}
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem', background: 'var(--secondary)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', marginRight: '0.2rem' }}>⚡ Load Sample Preset:</span>
                            <button
                                type="button"
                                className="btn-sm btn-secondary"
                                onClick={loadDataAnalystDemo}
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                            >
                                📊 Data Analyst (Jaipur)
                            </button>
                            <button
                                type="button"
                                className="btn-sm btn-secondary"
                                onClick={loadWebDeveloperDemo}
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                            >
                                🌐 Web Developer (Jaipur)
                            </button>
                            <button
                                type="button"
                                className="btn-sm btn-secondary"
                                onClick={loadCloudDevOpsDemo}
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                            >
                                ☁️ Cloud & DevOps (Jaipur)
                            </button>
                        </div>

                        <form onSubmit={handleUpload}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input placeholder="Program / Course (e.g. B.Tech CSE or Data Analytics Course)" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} required />
                                <input placeholder="Semester / Term (e.g. Sem 5 or Module 1)" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input placeholder="University / Institute (e.g. RTU)" value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} />
                                <input placeholder="Curriculum Year (e.g. 2022)" value={form.lastUpdated} onChange={e => setForm({ ...form, lastUpdated: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div>
                                    <input
                                        list="target-roles-list"
                                        placeholder="Target Career Role (e.g. Web Developer)"
                                        value={form.targetRole}
                                        onChange={e => setForm({ ...form, targetRole: e.target.value })}
                                        required
                                    />
                                    <datalist id="target-roles-list">
                                        <option value="Data Analyst" />
                                        <option value="Web Developer" />
                                        <option value="Frontend Developer" />
                                        <option value="Full Stack Developer" />
                                        <option value="Cloud & DevOps Engineer" />
                                        <option value="Data Scientist" />
                                        <option value="Cybersecurity Analyst" />
                                        <option value="Mobile Application Developer" />
                                    </datalist>
                                </div>
                                <div>
                                    <input
                                        list="target-districts-list"
                                        placeholder="Hiring District (e.g. Jaipur)"
                                        value={form.district}
                                        onChange={e => setForm({ ...form, district: e.target.value })}
                                    />
                                    <datalist id="target-districts-list">
                                        <option value="Jaipur" />
                                        <option value="Jodhpur" />
                                        <option value="Udaipur" />
                                        <option value="Kota" />
                                        <option value="Bangalore" />
                                        <option value="Mumbai" />
                                        <option value="Hyderabad" />
                                        <option value="Pune" />
                                        <option value="Delhi NCR" />
                                        <option value="All" />
                                    </datalist>
                                </div>
                            </div>
                            <input placeholder="Subjects / Course Modules (e.g. DBMS & SQL, Business Spreadsheets, or Module 1 to 4)" value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} />
                            <textarea placeholder="Paste syllabus content here... (Units, topics, technologies taught, e.g. Excel, Basic SQL queries...)" rows="6" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
                            <button type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isAnalyzing}>
                                {isAnalyzing ? 'Analyzing curriculum against job taxonomy...' : 'Execute Gap Analysis'}
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Institutional Overview</h2>
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
                                <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>Latest Curriculum Audit</h3>
                                <ReportCard report={reports[0]} compact onPlanNeeded={handlePlanForReport} onReportUpdated={fetchReports} />
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
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>No reports generated yet. Upload a syllabus on the Upload tab.</p>
                        </div>
                    ) : (
                        reports.map(r => <ReportCard key={r.id} report={r} onPlanNeeded={handlePlanForReport} onReportUpdated={fetchReports} />)
                    )}
                </div>
            )}

            {/* ─── TRAINING PLANS TAB ─── */}
            {activeTab === 'plans' && (
                <div className="dashboard-grid grid-2">
                    <div className="glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <MapPin size={18} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Generate District Training Plan</h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            Configure a targeted regional upskilling blueprint calculating mentor hours, infrastructure costs, and completion milestones.
                        </p>
                        <form onSubmit={handleGeneratePlan}>
                            <input placeholder="Target District (e.g. Jodhpur, Jaipur)" value={tpForm.district} onChange={e => setTpForm({ ...tpForm, district: e.target.value })} required />
                            <textarea placeholder="Target Industry Skills (comma-separated, e.g. Python, Machine Learning, AWS, Docker)" rows="3" value={tpForm.targetSkills} onChange={e => setTpForm({ ...tpForm, targetSkills: e.target.value })} required />
                            <button type="submit" style={{ width: '100%' }}>Generate Training Blueprint</button>
                        </form>
                    </div>
                    <div className="glass-panel" style={{ maxHeight: '640px', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Active District Blueprints ({trainingPlans.length})</h2>
                        {trainingPlans.length === 0 && <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No plans generated yet. Submit target parameters on the left.</p>}
                        {trainingPlans.map(p => {
                            let courses = [];
                            try { courses = JSON.parse(p.recommendedCourses || '[]'); } catch (e) { }
                            let equipment = p.equipmentNeeded;
                            let oversupplied = [];
                            try {
                                const eq = JSON.parse(p.equipmentNeeded || '{}');
                                if (eq.equipment) { equipment = eq.equipment.join(', '); oversupplied = eq.oversupplied || []; }
                            } catch (e) { }

                            return (
                                <div key={p.id} className="card-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>{p.district} District</h3>
                                        <span className="badge badge-success">{p.status || 'Active'}</span>
                                    </div>

                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Skills:</span>
                                        <div style={{ marginTop: '0.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                            {p.targetSkills.split(',').map(s => <span key={s} className="skill-tag matched">{s.trim()}</span>)}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--foreground)' }}>
                                        <strong>Trainer Quota: </strong>
                                        <span style={{ color: 'var(--muted-foreground)' }}>{p.trainerRequirements}</span>
                                    </div>
                                    <div style={{ marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--foreground)' }}>
                                        <strong>Equipment & Labs: </strong>
                                        <span style={{ color: 'var(--muted-foreground)' }}>{equipment}</span>
                                    </div>
                                    <div style={{ marginBottom: '0.65rem', fontSize: '0.8rem', color: 'var(--foreground)' }}>
                                        <strong>Timeline: </strong>
                                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{p.timeline}</span>
                                    </div>

                                    {courses.length > 0 && (
                                        <div style={{ marginBottom: '0.65rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommended Course Units:</span>
                                            {courses.map((c, i) => (
                                                <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', marginTop: '0.3rem', fontSize: '0.775rem' }}>
                                                    <strong>{c.course}</strong> — {c.provider} · {c.duration}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {oversupplied.length > 0 && (
                                        <div style={{ background: 'oklch(0.96 0.03 85)', border: '1px solid oklch(0.90 0.05 85)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'oklch(0.40 0.10 85)' }}>Notice: Market Saturation</span>
                                            <div style={{ marginTop: '0.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Award size={18} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Record Student Placement</h2>
                        </div>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            Submit verified graduate employment outcomes to correlate training interventions with hiring success.
                        </p>
                        <form onSubmit={handlePlacementSubmit}>
                            <input type="email" placeholder="Student Email Address (e.g. rahul@college.edu)" value={placementForm.studentEmail} onChange={e => setPlacementForm({ ...placementForm, studentEmail: e.target.value })} required />
                            <input placeholder="Employer / Company Name (e.g. Infosys, TCS, Swiggy)" value={placementForm.companyName} onChange={e => setPlacementForm({ ...placementForm, companyName: e.target.value })} required />
                            <input placeholder="Job Role (e.g. Software Engineer, Data Analyst)" value={placementForm.jobRole} onChange={e => setPlacementForm({ ...placementForm, jobRole: e.target.value })} required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input placeholder="Compensation Package (e.g. 7.5 LPA)" value={placementForm.package} onChange={e => setPlacementForm({ ...placementForm, package: e.target.value })} required />
                                <input placeholder="Posting Location (e.g. Pune, Bangalore)" value={placementForm.location} onChange={e => setPlacementForm({ ...placementForm, location: e.target.value })} required />
                            </div>
                            <button type="submit" style={{ width: '100%' }}>Submit Placement Record</button>
                        </form>
                    </div>
                    <div className="glass-panel">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Continuous Feedback Loop</h2>
                        <ul style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: '1.7', paddingLeft: '1.25rem' }}>
                            <li><strong>Curriculum Validation:</strong> Establishes whether updated modules converted directly into job offers.</li>
                            <li><strong>District Demand Mapping:</strong> Feeds real package and role data back into the regional intelligence model.</li>
                            <li><strong>Student Guidance:</strong> Enriches career pathway recommendations with verified hiring statistics.</li>
                            <li><strong>Accreditation Compliance:</strong> Generates auditable industry-alignment metrics for NAAC / NBA reviews.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReportCard({ report, compact, onPlanNeeded, onReportUpdated }) {
    const r = report;
    const token = localStorage.getItem('token');
    let initialRecs = [];
    try { initialRecs = JSON.parse(r.recommendations || '[]'); } catch (e) { }
    let demandAnalysis = {};
    try { demandAnalysis = JSON.parse(r.demandAnalysis || '{}'); } catch (e) { }

    const [revisionStatus, setRevisionStatus] = React.useState(demandAnalysis.revisionStatus || null);
    const [score, setScore] = React.useState(r.overallScore);
    const [missingSkills, setMissingSkills] = React.useState(r.missingSkills);
    const [matchedSkills, setMatchedSkills] = React.useState(r.matchedSkills);
    const [recs, setRecs] = React.useState(initialRecs);
    const [showReviseBox, setShowReviseBox] = React.useState(false);
    const [topicsToAppend, setTopicsToAppend] = React.useState(r.missingSkills || '');
    const [reanalyzing, setReanalyzing] = React.useState(false);
    const [reanalyzeMsg, setReanalyzeMsg] = React.useState(null);

    React.useEffect(() => {
        setScore(report.overallScore);
        setMissingSkills(report.missingSkills);
        setMatchedSkills(report.matchedSkills);
        try { setRecs(JSON.parse(report.recommendations || '[]')); } catch (e) { }
        setTopicsToAppend(report.missingSkills || '');
        let d = {};
        try { d = JSON.parse(report.demandAnalysis || '{}'); } catch (e) { }
        setRevisionStatus(d.revisionStatus || null);
    }, [report]);

    const validationStatus = demandAnalysis.validationStatus || null;
    const scoreColor = score >= 70 ? 'var(--accent-success)' : score >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)';

    const handleExecuteReanalysis = async () => {
        setReanalyzing(true);
        setReanalyzeMsg(null);
        try {
            const res = await axios.post(`${API}/api/reports/${r.id}/reanalyze`,
                { newTopics: topicsToAppend },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setScore(res.data.newScore);
            setRevisionStatus('Revised');
            setMissingSkills(res.data.report?.missingSkills || '');
            setMatchedSkills(res.data.report?.matchedSkills || '');
            if (res.data.report?.recommendations) {
                try { setRecs(JSON.parse(res.data.report.recommendations)); } catch (e) { }
            }
            setReanalyzeMsg({
                previous: res.data.previousScore,
                current: res.data.newScore,
                gain: res.data.improvement,
                text: res.data.message
            });
            if (onReportUpdated) onReportUpdated();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to re-analyze curriculum');
        } finally {
            setReanalyzing(false);
        }
    };

    return (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '1.25rem', borderLeft: `3px solid ${revisionStatus === 'Revised' ? 'var(--accent-success)' : scoreColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.2rem' }}>
                        {r.college?.name || 'Institution'} — {r.syllabus?.branch} ({r.syllabus?.semester})
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                        {r.syllabus?.university || 'State Technical University'} {r.syllabus?.subjects ? `· Modules: ${r.syllabus.subjects}` : ''} {demandAnalysis.district ? `· Location: ${demandAnalysis.district}` : ''} {demandAnalysis.targetRole ? `· Target Role: ${demandAnalysis.targetRole}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        {revisionStatus === 'Revised' && (
                            <span className="badge badge-success">✓ Curriculum Revised (Score: {score}%)</span>
                        )}
                        {validationStatus === 'Employer Validated' && (
                            <span className="badge badge-success">✓ Employer Validated</span>
                        )}
                        {validationStatus === 'Employer Disputed' && (
                            <span className="badge badge-danger">✗ Employer Disputed</span>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: scoreColor }}>{score}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 500, textTransform: 'uppercase' }}>Alignment Index</div>
                </div>
            </div>

            {/* Score Bar */}
            <div className="score-bar-bg" style={{ marginBottom: '1.25rem' }}>
                <div className="score-bar-fill" style={{ width: `${score}%`, background: scoreColor }}></div>
            </div>

            {/* Employer Validation Audit Evidence Callout */}
            {validationStatus === 'Employer Validated' && (
                <div style={{ background: 'oklch(0.97 0.02 145)', border: '1px solid oklch(0.90 0.05 145)', borderRadius: 'var(--radius)', padding: '0.65rem 0.85rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'oklch(0.35 0.12 145)', fontSize: '0.8rem' }}>
                        <CheckCircle size={14} /> Employer Validation Evidence Stored
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--foreground)', marginTop: '0.2rem' }}>
                        <strong>Validated by:</strong> {demandAnalysis.validatedBy || 'Industry Hiring Committee'}
                    </div>
                    {demandAnalysis.validationComment && (
                        <div style={{ fontSize: '0.775rem', color: 'var(--muted-foreground)', marginTop: '0.15rem', fontStyle: 'italic' }}>
                            "{demandAnalysis.validationComment}"
                        </div>
                    )}
                </div>
            )}

            {/* Closed-Loop Score Jump Notification */}
            {reanalyzeMsg && (
                <div style={{ background: 'oklch(0.96 0.03 145)', border: '1px solid oklch(0.88 0.08 145)', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, color: 'oklch(0.35 0.14 145)', fontSize: '0.875rem' }}>
                        🎉 Closed-Loop Verification: Curriculum Alignment jumped from {reanalyzeMsg.previous}% → {reanalyzeMsg.current}% (+{reanalyzeMsg.gain}% Gain)!
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--foreground)', marginTop: '0.25rem' }}>
                        The curriculum update successfully satisfied all demanded industry skills.
                    </div>
                </div>
            )}

            {/* Missing Skills */}
            <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <XCircle size={14} color="var(--accent-danger)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-danger)' }}>
                        Missing Industry Skills ({missingSkills.split(',').filter(s => s.trim()).length})
                    </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                    {missingSkills.split(',').filter(s => s.trim()).length > 0 ? (
                        missingSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag missing">{s.trim()}</span>)
                    ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-success)', fontStyle: 'italic' }}>None! All demanded skills covered.</span>
                    )}
                </div>
            </div>

            {/* Matched Skills */}
            <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <CheckCircle size={14} color="var(--accent-success)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-success)' }}>
                        Covered Competencies ({matchedSkills.split(',').filter(s => s.trim()).length})
                    </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                    {matchedSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag matched">{s.trim()}</span>)}
                </div>
            </div>

            {/* Obsolete Skills */}
            {r.obsoleteSkills && r.obsoleteSkills.trim() && (
                <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                        <AlertTriangle size={14} color="var(--accent-warning)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'oklch(0.40 0.10 85)' }}>
                            Obsolete / Deprecated Topics
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                        {r.obsoleteSkills.split(',').filter(s => s.trim()).map(s => <span key={s} className="skill-tag obsolete">{s.trim()}</span>)}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {!compact && recs.length > 0 && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>
                        Recommended Curriculum Modernizations
                    </h4>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Skill</th>
                                <th>Recommended Course Unit</th>
                                <th>Provider</th>
                                <th>Duration</th>
                                <th>Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recs.map((rec, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{rec.skill}</td>
                                    <td>{rec.course}</td>
                                    <td style={{ color: 'var(--muted-foreground)' }}>{rec.provider}</td>
                                    <td>{rec.duration}</td>
                                    <td><span className="skill-tag rising">{rec.level}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Closed-Loop Curriculum Revision Panel */}
            {!compact && (
                <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>
                                Closed-Loop Curriculum Revision Workflow
                            </span>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.1rem' }}>
                                Add validated missing competencies into the syllabus, then re-analyze to measure alignment score improvement.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {onPlanNeeded && missingSkills && (
                                <button
                                    type="button"
                                    className="btn-sm btn-outline"
                                    onClick={() => onPlanNeeded(demandAnalysis.district || 'Jaipur', missingSkills)}
                                >
                                    <MapPin size={13} /> Create District Training Plan
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn-sm btn-secondary"
                                onClick={() => setShowReviseBox(!showReviseBox)}
                            >
                                {showReviseBox ? 'Close Revision Box' : 'Revise Curriculum & Re-Analyze'}
                            </button>
                        </div>
                    </div>

                    {showReviseBox && (
                        <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.85rem', marginTop: '0.85rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                Competencies to Append into Syllabus (Auto-populated with missing skills):
                            </label>
                            <input
                                value={topicsToAppend}
                                onChange={e => setTopicsToAppend(e.target.value)}
                                placeholder="e.g. Power BI, Python, Statistics"
                                style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    className="btn-sm"
                                    onClick={handleExecuteReanalysis}
                                    disabled={reanalyzing}
                                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                                >
                                    {reanalyzing ? 'Re-analyzing with ML Engine...' : '🚀 Apply Revisions & Re-Calculate Alignment'}
                                </button>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                    Will append topics to syllabus content and invoke ML alignment engine.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
