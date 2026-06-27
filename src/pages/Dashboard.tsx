import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  apiGetSummary, apiGetTrend, apiGetHighRisk, apiGetToday,
  SummaryData, TrendDay, HighRiskStudent, AttendanceRecord
} from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement);

const AVATAR_COLORS = ['sky', 'mint', 'yellow', 'coral', 'purple'];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}

export default function Dashboard() {
  const [summary, setSummary]   = useState<SummaryData | null>(null);
  const [trend, setTrend]       = useState<TrendDay[]>([]);
  const [highRisk, setHighRisk] = useState<HighRiskStudent[]>([]);
  const [recent, setRecent]     = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const sinceStr = since30.toISOString().split('T')[0];

    Promise.all([
      apiGetSummary(),
      apiGetTrend(10),
      apiGetHighRisk(sinceStr),
      apiGetToday(),
    ]).then(([s, t, h, r]) => {
      setSummary(s);
      setTrend(t);
      setHighRisk(h.slice(0, 4));
      setRecent(r.slice(0, 5));
    }).catch(() => {
      // Silently degrade — show empty state
    }).finally(() => setLoading(false));
  }, []);

  const lineData = {
    labels: trend.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Attendance %',
      data: trend.map(d => d.pct),
      borderColor: '#4FC3F7',
      backgroundColor: 'rgba(79,195,247,0.1)',
      fill: true, tension: 0.4,
      pointBackgroundColor: '#4FC3F7', pointRadius: 5, pointHoverRadius: 7,
    }]
  };

  const doughnutData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{
      data: summary ? [summary.presentToday, summary.absentToday, summary.lateToday] : [0, 0, 0],
      backgroundColor: ['#A8EDCB', '#FF8A80', '#FFD54F'],
      borderWidth: 0, hoverOffset: 8,
    }]
  };

  if (loading) {
    return (
      <div className="page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Nunito', fontWeight: 700 }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-inner">
      {/* Stats */}
      <div className="stats-grid">
        {[
          { color: 'sky',    icon: '👥', val: summary ? summary.totalStudents.toLocaleString() : '—', label: 'Total Students',    dir: 'up' as const },
          { color: 'mint',   icon: '✅', val: summary ? `${summary.attendancePct}%`            : '—', label: "Today's Attendance", dir: 'up' as const },
          { color: 'yellow', icon: '⏰', val: summary ? String(summary.lateToday)               : '—', label: 'Students Late',      dir: 'up' as const },
          { color: 'coral',  icon: '❌', val: summary ? String(summary.absentToday)             : '—', label: 'Absent Today',       dir: 'down' as const },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className="stat-card-accent" />
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Attendance Trend</h3>
              <p>Last 10 school days</p>
            </div>
            <span className="chip sky">Live</span>
          </div>
          {trend.length > 0 ? (
            <Line data={lineData} options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 70, max: 100, grid: { color: '#E2EFF9' }, ticks: { callback: (v) => v + '%' } },
                x: { grid: { display: false }, ticks: { font: { size: 10 } } }
              }
            }} />
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No trend data yet
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Today's Status</h3>
              <p>{summary ? `${summary.totalStudents} students` : ''}</p>
            </div>
          </div>
          <Doughnut data={doughnutData} options={{
            responsive: true, cutout: '72%',
            plugins: {
              legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { family: 'Nunito', weight: 700 } } }
            }
          }} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        <div className="chart-card">
          <div className="section-title">
            <div>
              <h2>Recent Arrivals</h2>
              <p>Live attendance feed</p>
            </div>
            <span className="chip mint">● LIVE</span>
          </div>
          <div className="data-table-wrap">
            {recent.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 13 }}>
                No attendance records yet today.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={r.id}>
                      <td>
                        <div className="student-cell">
                          <div className={`student-avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                            {initials(r.student.fullName)}
                          </div>
                          <span style={{ fontWeight: 600 }}>{r.student.fullName}</span>
                        </div>
                      </td>
                      <td><span className="chip sky">{r.student.grade}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {r.arrivalTime ? new Date(r.arrivalTime).toLocaleTimeString() : '—'}
                      </td>
                      <td>
                        <span className={`status-badge ${r.status.toLowerCase()}`}>
                          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="section-title">
            <div>
              <h2>⚠️ High-Risk Students</h2>
              <p>Below 80% attendance (last 30 days)</p>
            </div>
          </div>
          {highRisk.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No high-risk students. Great attendance!</p>
            </div>
          ) : (
            <div className="risk-list">
              {highRisk.map((r, i) => {
                const riskColor = r.attendancePct < 60 ? '#FF8A80' : '#FFD54F';
                return (
                  <div key={r.studentId} className="risk-item">
                    <div className={`student-avatar ${i % 2 === 0 ? 'coral' : 'yellow'}`} style={{ width: 36, height: 36, fontSize: 13 }}>
                      {initials(r.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</span>
                        <span className="chip sky" style={{ fontSize: 10 }}>{r.grade}</span>
                      </div>
                      <div className="risk-bar-wrap">
                        <div className="risk-bar" style={{ width: `${r.attendancePct}%`, background: riskColor }} />
                      </div>
                    </div>
                    <span className="risk-pct" style={{ color: riskColor }}>{r.attendancePct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
