import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../api';

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
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {!isLogin && (
          <div style={{ display: 'flex', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', padding: '0.25rem' }}>
            {['STUDENT', 'COLLEGE', 'COMPANY'].map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                style={{ flex: 1, background: role === r ? 'var(--primary)' : 'transparent', padding: '0.5rem', fontSize: '0.8rem', borderRadius: '0.4rem' }}>
                {r}
              </button>
            ))}
          </div>
        )}

        {error && <p style={{ color: 'var(--accent-danger)', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input placeholder={role === 'STUDENT' ? 'Full Name' : 'Organization Name'} value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              <input placeholder="District / City (e.g. Jodhpur)" value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </>
          )}
          <input type="email" placeholder="Email Address" value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          <input type="password" placeholder="Password" value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })} required />
          <button type="submit" style={{ width: '100%' }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
}
