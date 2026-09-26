import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API from '../api';
import { TrendingUp, BookOpen, MapPin, Users, Award, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/analytics/dashboard`).then(r => setStats(r.data)).catch(() => { });
  }, []);

  return (
    <div className="animate-fade-in">
      <nav className="navbar">
        <div className="navbar-brand">SkillBridge AI</div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/login"><button className="btn-outline">Sign In</button></Link>
          <Link to="/admin">
            <button className="btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} /> Admin
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ padding: '4.5rem 1.5rem', textAlign: 'center', maxWidth: '1060px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.85rem', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1.75rem' }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></span>
          Labour Market Intelligence & Curriculum Alignment Platform
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem', color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
          Bridging the Gap Between<br />Academia & Industry
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', maxWidth: '680px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          An AI-powered labour-market intelligence platform synthesizing job-posting demand, employer surveys, and emerging tech to pinpoint skill gaps and update engineering curricula.
        </p>

        <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', marginBottom: '4rem', flexWrap: 'wrap' }}>
          <Link to="/login?role=STUDENT">
            <button style={{ padding: '0.75rem 1.75rem' }}>
              Student Portal <ArrowRight size={16} />
            </button>
          </Link>
          <Link to="/login?role=COLLEGE">
            <button className="btn-secondary" style={{ padding: '0.75rem 1.75rem' }}>
              College Portal
            </button>
          </Link>
          <Link to="/login?role=COMPANY">
            <button className="btn-outline" style={{ padding: '0.75rem 1.75rem' }}>
              Employer / Industry
            </button>
          </Link>
        </div>

        {/* Live Stats */}
        {stats && (
          <div className="dashboard-grid grid-4" style={{ marginBottom: '4.5rem' }}>
            <div className="stat-card animate-count">
              <div className="stat-value">{stats.totalJobs || 0}</div>
              <div className="stat-label">Job Postings Analyzed</div>
            </div>
            <div className="stat-card animate-count">
              <div className="stat-value">{stats.totalReports || 0}</div>
              <div className="stat-label">Gap Reports Generated</div>
            </div>
            <div className="stat-card animate-count">
              <div className="stat-value">{stats.avgAlignment || 0}%</div>
              <div className="stat-label">Avg Curriculum Alignment</div>
            </div>
            <div className="stat-card animate-count">
              <div className="stat-value">{stats.totalUsers || 0}</div>
              <div className="stat-label">Registered Institutions</div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Platform Architecture & Capabilities
          </h2>
        </div>
        
        <div className="dashboard-grid grid-3">
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border)', color: 'var(--primary)' }}>
              <TrendingUp size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Labour Market Intelligence</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Real-time ingestion and NLP skill extraction across job postings to quantify emerging market demands by role and district.
            </p>
          </div>

          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border)', color: 'var(--primary)' }}>
              <BookOpen size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Curriculum Gap Analysis</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Automated syllabus parsing that detects obsolete subjects, missing industry competencies, and produces actionable curriculum diffs.
            </p>
          </div>

          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border)', color: 'var(--primary)' }}>
              <MapPin size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>District Training Plans</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              AI-generated localized upskilling blueprints calculating trainer quotas, required infrastructure, and rollout timelines.
            </p>
          </div>

          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border)', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Employer Validation</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Direct survey channels for industry partners to grade graduate readiness, dispute curriculum gaps, and request specialized courses.
            </p>
          </div>

          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border)', color: 'var(--primary)' }}>
              <Award size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Placement Outcomes</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Correlates training plan completions with placement rates and compensation packages across regional technology sectors.
            </p>
          </div>

          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border)', color: 'var(--primary)' }}>
              <Compass size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Student Career Pathways</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Personalized skill matching assessments with real-time target suggestions and tailored learning resources for students.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
