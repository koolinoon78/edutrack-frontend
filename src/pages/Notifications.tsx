import React, { useState } from 'react';

const NOTIFS = [
  { icon: '🔴', type: 'coral', title: 'Absence Alert Sent', body: 'Dinusha Mendis (8A) was marked absent. Parent notified via email at 8:15 AM.', time: '8:15 AM · Today', unread: true },
  { icon: '⏰', type: 'yellow', title: 'Lateness Alert', body: 'Ruwan Jayantha (11C) arrived 14 minutes late. Parent notified.', time: '8:14 AM · Today', unread: true },
  { icon: '✅', type: 'mint', title: 'Daily Summary Sent', body: 'Morning attendance summary delivered to all 1,248 parents via Brevo SMTP.', time: '8:00 AM · Today', unread: true },
  { icon: '📊', type: 'sky', title: 'Weekly Report Generated', body: 'Attendance report for Week 24 is ready. Overall rate: 92.4%.', time: 'Yesterday · 4:30 PM', unread: false },
  { icon: '⚠️', type: 'coral', title: 'High-Risk Alert', body: 'Dinusha Mendis has fallen below 60% attendance threshold. Principal notified.', time: 'Yesterday · 9:00 AM', unread: false },
  { icon: '🎉', type: 'mint', title: 'Perfect Attendance', body: 'Class 11A achieved 100% attendance for 5 consecutive days! Certificate issued.', time: '2 days ago', unread: false },
  { icon: '🔔', type: 'sky', title: 'System Update', body: 'QR scanner firmware updated. Scan speed improved by 30%.', time: '3 days ago', unread: false },
];

export default function Notifications() {
  const [filter, setFilter] = useState('All');

  const filtered = NOTIFS.filter(n => filter === 'All' || (filter === 'Unread' && n.unread));

  return (
    <div className="page-inner">
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        {['All', 'Unread', 'Alerts', 'Reports'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn-sm"
            style={{
              background: filter === f ? 'linear-gradient(135deg,#4FC3F7,#0288D1)' : 'white',
              color: filter === f ? 'white' : 'var(--text-muted)',
              border: '2px solid', borderColor: filter === f ? '#4FC3F7' : 'var(--border)',
              padding: '8px 18px',
            }}
          >
            {f} {f === 'Unread' ? `(${NOTIFS.filter(n => n.unread).length})` : ''}
          </button>
        ))}
        <button className="btn-sm sky" style={{ marginLeft: 'auto', background: 'white', color: 'var(--text-muted)', border: '2px solid var(--border)' }}>
          ✓ Mark all read
        </button>
      </div>

      {/* Email status card */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F, #0F2240)', borderRadius: 20, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 32px rgba(15,34,64,0.3)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#4FC3F7,#A8EDCB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: '0 4px 16px rgba(79,195,247,0.4)' }}>📧</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: 'white', fontSize: 15, marginBottom: 4 }}>Brevo SMTP Connected</h3>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>847 emails sent today · 0 failures · Avg delivery: 1.2s</p>
        </div>
        <span style={{ background: '#A8EDCB', color: '#1B5E20', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, fontFamily: 'Nunito' }}>● ACTIVE</span>
      </div>

      <div className="notif-list">
        {filtered.map((n, i) => (
          <div key={i} className={`notif-item ${n.unread ? 'unread' : ''}`}>
            <div className={`notif-icon ${n.type}`}>{n.icon}</div>
            <div className="notif-content" style={{ flex: 1 }}>
              <h4>{n.title}</h4>
              <p>{n.body}</p>
              <p className="notif-time">🕐 {n.time}</p>
            </div>
            {n.unread && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FC3F7', flexShrink: 0, marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
