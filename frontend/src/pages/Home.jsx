import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API from '../api';

export default function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/analytics/dashboard`).then(r => setStats(r.data)).catch(() => { });
  }, []);

  return (
    <div className="animate-fade-in">
      <nav className="navbar">
        <div className="navbar-brand">SkillBridge AI</div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/login"><button className="btn-outline">Sign In</button></Link>
          <Link to="/admin"><button className="btn-sm" style={{ background: 'var(--accent-success)' }}>Admin</button></Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem', background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Bridging the Gap Between<br />Academia & Industry
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          A labour-market intelligence platform that combines job-posting signals, employer surveys, and emerging-technology trends to identify skill gaps, recommend curriculum updates, and generate district-level training plans.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem', flexWrap: 'wrap' }}>
          <Link to="/login?role=STUDENT">
            <button style={{ padding: '0.8rem 2rem' }}>I'm a Student</button>
          </Link>
          <Link to="/login?role=COLLEGE">
            <button className="btn-success" style={{ padding: '0.8rem 2rem' }}>College Portal</button>
          </Link>
          <Link to="/login?role=COMPANY">
            <button className="btn-warning" style={{ padding: '0.8rem 2rem' }}>Employer / Company</button>
          </Link>
        </div>

        {/* Live Stats */}
        {stats && (
          <div className="dashboard-grid grid-4" style={{ marginBottom: '4rem' }}>
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
              <div className="stat-label">Registered Users</div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <h2 style={{ marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform Capabilities</h2>
        <div className="dashboard-grid grid-3">
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔮</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Labour Market Intelligence</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Analyzes job postings to identify demand by role, skill, location, and proficiency level using NLP with 200+ skill taxonomy.
            </p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚡</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Curriculum Gap Analysis</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Maps skill gaps to courses, recommends curriculum updates, flags obsolete topics, and measures alignment scores.
            </p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌐</div>
            <h3 style={{ marginBottom: '0.5rem' }}>District Training Plans</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Generates district-level training plans with trainer requirements, equipment needs, and timeline estimates.
            </p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🧬</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Employer Surveys</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Collects employer satisfaction, candidate quality ratings, and skill requirements to validate findings.
            </p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💎</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Placement Tracking</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Tracks placement outcomes by role, location, and package to measure real-world training effectiveness.
            </p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚀</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Career Pathways</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Helps students identify high-demand skills, get personalized gap reports, and discover clear career pathways.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
