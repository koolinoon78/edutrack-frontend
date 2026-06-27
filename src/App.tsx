import React, { useState } from 'react';
import './index.css';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Analytics from './pages/Analytics';
import QRScanner from './pages/QRScanner';
import Notifications from './pages/Notifications';
import StudentProfile from './pages/StudentProfile';
import { clearToken } from './api';

type Role = 'admin' | 'principal' | 'scanner';
type Page = 'dashboard' | 'students' | 'analytics' | 'scanner' | 'notifications' | 'studentprofile';

const NAV_ITEMS: {
  page: Page;
  icon: string;
  label: string;
  roles: Role[];
  badge?: number;
}[] = [
  { page: 'dashboard',     icon: '📊', label: 'Dashboard',     roles: ['admin', 'principal'] },
  { page: 'scanner',       icon: '📱', label: 'QR Scanner',    roles: ['admin', 'scanner'] },
  { page: 'students',      icon: '🎒', label: 'Students',      roles: ['admin'] },
  { page: 'analytics',     icon: '📈', label: 'Analytics',     roles: ['admin', 'principal'] },
  { page: 'notifications',   icon: '🔔', label: 'Notifications',    roles: ['admin', 'principal'] },
  { page: 'studentprofile', icon: '👤', label: 'Student Profiles',  roles: ['admin', 'principal'] },
];

const PAGE_TITLES: Record<Page, { title: string; subtitle: string }> = {
  dashboard:     { title: 'Dashboard',          subtitle: 'Live school attendance overview' },
  scanner:       { title: 'QR Scanner',         subtitle: 'Scan student arrival & departure' },
  students:      { title: 'Student Directory',  subtitle: 'Manage students and QR codes' },
  analytics:     { title: 'Analytics',          subtitle: 'Trends, reports and insights' },
  notifications:   { title: 'Notifications',      subtitle: 'Parent alerts and system logs' },
  studentprofile: { title: 'Student Profiles',   subtitle: 'Deep-dive attendance analysis per student' },
};

const ROLE_LABELS: Record<Role, string> = {
  admin:     'Administrator',
  principal: 'Principal',
  scanner:   'Scan Operator',
};

export default function App() {
  const [view, setView]       = useState<'landing' | 'login' | 'app'>('landing');
  const [role, setRole]       = useState<Role>('admin');
  const [fullName, setFullName] = useState('');
  const [page, setPage]       = useState<Page>('dashboard');

  const handleLogin = (r: Role, name: string) => {
    setRole(r);
    setFullName(name);
    // Scanner role lands directly on the scanner page
    setPage(r === 'scanner' ? 'scanner' : 'dashboard');
    setView('app');
  };

  const handleLogout = () => {
    clearToken();
    setView('landing');
    setFullName('');
  };

  if (view === 'landing') {
    return <LandingPage onEnterApp={() => setView('login')} />;
  }

  if (view === 'login') {
    return <LoginPage onLogin={handleLogin} onBack={() => setView('landing')} />;
  }

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));
  const { title, subtitle } = PAGE_TITLES[page];

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏫</div>
          <div className="sidebar-logo-text">
            <h2>EduTrack</h2>
            <span>Smart Attendance</span>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>

        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <a
              key={item.page}
              href="#!"
              className={page === item.page ? 'active' : ''}
              onClick={e => { e.preventDefault(); setPage(item.page); }}
            >
              <div className="nav-icon">{item.icon}</div>
              {item.label}
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2) : role[0].toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <h4>{fullName || ROLE_LABELS[role]}</h4>
              <span>{ROLE_LABELS[role]}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 10, width: '100%', padding: '9px 0',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: 'Nunito', letterSpacing: 0.5,
            }}
          >
            ← Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="topbar-right">
            <div className="topbar-search">
              <span>🔍</span>
              <input placeholder="Search…" />
            </div>
            <button
              className="topbar-btn"
              onClick={() => setPage('notifications')}
              title="Notifications"
            >
              🔔
              <span className="notif-dot" />
            </button>
            <button
              className="topbar-btn"
              onClick={handleLogout}
              title="Sign out"
            >
              👤
            </button>
          </div>
        </header>

        {/* Page content */}
        {page === 'dashboard'     && <Dashboard />}
        {page === 'scanner'       && <QRScanner />}
        {page === 'students'      && <Students />}
        {page === 'analytics'     && <Analytics />}
        {page === 'notifications'   && <Notifications />}
        {page === 'studentprofile' && <StudentProfile />}
      </main>
    </div>
  );
}
