import React, { useState } from 'react';
import { apiLogin, setToken } from '../api';

type Role = 'admin' | 'principal' | 'scanner';

const ROLES: { key: Role; label: string; icon: string; desc: string; color: string; email: string }[] = [
  { key: 'admin',     label: 'Administrator', icon: '⚙️',  desc: 'Full system access',   color: '#4FC3F7', email: 'admin@school.edu' },
  { key: 'principal', label: 'Principal',     icon: '👨‍💼', desc: 'Analytics & insights', color: '#CE93D8', email: 'principal@school.edu' },
  { key: 'scanner',   label: 'Scan Operator', icon: '📱',  desc: 'Gate QR scanning',     color: '#A8EDCB', email: 'scanner@school.edu' },
];

export default function LoginPage({
  onLogin,
  onBack,
}: {
  onLogin: (role: Role, fullName: string) => void;
  onBack: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const selected = ROLES.find(r => r.key === selectedRole)!;

  // BUG FIX #1: Login now actually calls the real backend API.
  // The original code just did setTimeout() and skipped authentication entirely.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiLogin(email, password);

      // Store JWT token for all future API calls
      setToken(data.token);

      // Map backend role string to frontend role type
      const roleMap: Record<string, Role> = {
        ADMIN:     'admin',
        PRINCIPAL: 'principal',
        SCANNER:   'scanner',
      };
      const role = roleMap[data.role] ?? 'admin';

      onLogin(role, data.fullName);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background blobs */}
      <div className="login-bg-deco" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(79,195,247,0.18) 0%, transparent 70%)', top: -150, left: -150 }} />
      <div className="login-bg-deco" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(206,147,216,0.15) 0%, transparent 70%)', bottom: -100, right: -100 }} />
      <div className="login-bg-deco" style={{ width: 250, height: 250, background: 'radial-gradient(circle, rgba(168,237,203,0.18) 0%, transparent 70%)', top: '45%', right: '18%' }} />

      {/* Floating emoji decorations */}
      {['📚', '✏️', '🏫', '⭐', '🎒', '📐'].map((emoji, i) => (
        <div key={i} className="page-deco" style={{
          top: `${10 + i * 15}%`,
          left: `${5 + i * 14}%`,
          fontSize: 48, opacity: 0.07,
          animationDelay: `${i * 1.2}s`,
          animationDuration: `${6 + i}s`,
        }}>{emoji}</div>
      ))}

      {/* Back button */}
      <button onClick={onBack} style={{
        position: 'fixed', top: 20, left: 20,
        background: 'white', border: '1.5px solid #E2EFF9',
        borderRadius: 12, padding: '8px 16px',
        cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748B',
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', zIndex: 10,
      }}>
        ← Back to Home
      </button>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏫</div>
          <h1>EduTrack</h1>
          <p>Smart School Attendance System</p>
        </div>

        {/* Role selector — auto-fills the email hint */}
        <div className="role-tabs" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {ROLES.map(r => (
            <button
              key={r.key}
              className={`role-tab ${selectedRole === r.key ? 'active' : ''}`}
              onClick={() => { setSelectedRole(r.key); setEmail(r.email); setError(''); }}
              style={selectedRole === r.key ? { borderColor: r.color, background: `${r.color}15` } : {}}
            >
              <span style={{ fontSize: 22 }}>{r.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{r.label}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'Inter' }}>{r.desc}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder={`${selectedRole}@school.edu`}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: '#FFEBEE', border: '1.5px solid #FF8A80',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#C62828', fontWeight: 600,
              marginBottom: 12, fontFamily: 'Nunito',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={loading ? { opacity: 0.7 } : {}}
          >
            {loading
              ? '⏳ Authenticating...'
              : `${selected.icon} Sign In as ${selected.label} →`}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          🔒 Secured with Spring Security + JWT
        </p>
      </div>
    </div>
  );
}
