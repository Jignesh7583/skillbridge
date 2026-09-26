import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API from '../api';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'STUDENT';
  const [role, setRole] = useState(initialRole);
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '', organization: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { ...formData, role };
      const response = await axios.post(`${API}${endpoint}`, payload);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      const userRole = response.data.user.role;
      if (userRole === 'COMPANY') navigate('/company');
      else if (userRole === 'COLLEGE') navigate('/college');
      else if (userRole === 'ADMIN') navigate('/admin');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--background)' }}>
      <div style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--muted-foreground)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>SkillBridge AI</span>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.35rem', fontSize: '1.35rem', fontWeight: 700, color: 'var(--foreground)' }}>
          {isLogin ? 'Sign In to Portal' : 'Create an Account'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {isLogin ? 'Enter your credentials to access your dashboard' : 'Select your organization type to register'}
        </p>

        {!isLogin && (
          <div style={{ display: 'flex', marginBottom: '1.5rem', background: 'var(--muted)', borderRadius: 'var(--radius)', padding: '0.2rem', border: '1px solid var(--border)' }}>
            {['STUDENT', 'COLLEGE', 'COMPANY'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  flex: 1,
                  background: role === r ? 'var(--card)' : 'transparent',
                  color: role === r ? 'var(--foreground)' : 'var(--muted-foreground)',
                  padding: '0.45rem',
                  fontSize: '0.75rem',
                  fontWeight: role === r ? 600 : 500,
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: role === r ? 'var(--shadow-2xs)' : 'none',
                  border: role === r ? '1px solid var(--border)' : '1px solid transparent'
                }}>
                {r === 'STUDENT' ? 'Student' : r === 'COLLEGE' ? 'College' : 'Company'}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: 'oklch(0.96 0.03 25)', border: '1px solid oklch(0.90 0.05 25)', color: 'oklch(0.45 0.16 25)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                placeholder={role === 'STUDENT' ? 'Full Name' : 'Institution / Company Name'}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                placeholder="District / City (e.g. Jodhpur, Jaipur)"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </>
          )}
          <input
            type="email"
            placeholder="Official Email Address"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Create one' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}
