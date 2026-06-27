import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { apiGetSummary, apiGetTrend, apiGetClassComparison, SummaryData, TrendDay, ClassStat } from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, Title, Tooltip, Legend);

export default function Analytics() {
  const [summary, setSummary]   = useState<SummaryData | null>(null);
  const [trend, setTrend]       = useState<TrendDay[]>([]);
  const [classes, setClasses]   = useState<ClassStat[]>([]);
  const [loading, setLoading]   = useState(true);
  const [days, setDays]         = useState(30);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiGetSummary(),
      apiGetTrend(days),
      apiGetClassComparison(),
    ]).then(([s, t, c]) => {
      setSummary(s);
      setTrend(t);
      setClasses(c);
    }).catch(() => {
      // Degrade gracefully
    }).finally(() => setLoading(false));
  }, [days]);

  const trendChartData = {
    labels: trend.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Attendance %',
      data: trend.map(d => d.pct),
      borderColor: '#4FC3F7', backgroundColor: 'rgba(79,195,247,0.1)',
      tension: 0.4, fill: true,
    }]
  };

  const classChartData = {
    labels: classes.map(c => c.grade),
    datasets: [
      {
        label: 'Attendance %',
        data: classes.map(c => c.pct),
        backgroundColor: 'rgba(79,195,247,0.7)', borderRadius: 8, borderSkipped: false,
      },
      {
        label: 'Target 90%',
        data: classes.map(() => 90),
        backgroundColor: 'rgba(168,237,203,0.5)', borderRadius: 8, borderSkipped: false,
      }
    ]
  };

  const KPI_DATA = summary ? [
    { label: 'Overall Attendance Today', val: `${summary.attendancePct}%`, color: 'sky' },
    { label: 'Present Today',            val: String(summary.presentToday),  color: 'mint' },
    { label: 'Late Today',               val: String(summary.lateToday),     color: 'yellow' },
    { label: 'Absent Today',             val: String(summary.absentToday),   color: 'coral' },
  ] : [];

  const periodOptions = [
    { label: 'Last 7 Days',  days: 7  },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 60 Days', days: 60 },
    { label: 'Last 90 Days', days: 90 },
  ];

  return (
    <div className="page-inner">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Nunito' }}>Loading analytics…</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          {KPI_DATA.length > 0 && (
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              {KPI_DATA.map((k, i) => (
                <div key={i} className={`stat-card ${k.color}`}>
                  <div className="stat-card-accent" />
                  <div className="stat-label" style={{ marginBottom: 8, fontSize: 12 }}>{k.label}</div>
                  <div className="stat-value" style={{ fontSize: 28 }}>{k.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Period selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {periodOptions.map(p => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontFamily: 'Nunito',
                  fontSize: 12, cursor: 'pointer', border: '2px solid',
                  background: days === p.days ? 'linear-gradient(135deg,#4FC3F7,#0288D1)' : 'white',
                  color: days === p.days ? 'white' : 'var(--text-muted)',
                  borderColor: days === p.days ? '#4FC3F7' : 'var(--border)',
                }}
              >{p.label}</button>
            ))}
          </div>

          <div className="charts-row" style={{ marginBottom: 20 }}>
            {/* Class Comparison */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div><h3>Class Comparison</h3><p>Attendance % by class vs 90% target</p></div>
              </div>
              {classes.length > 0 ? (
                <Bar data={classChartData} options={{
                  responsive: true,
                  plugins: { legend: { position: 'top', labels: { font: { family: 'Nunito', weight: 700 } } } },
                  scales: {
                    y: { min: 60, max: 100, ticks: { callback: (v: number | string) => v + '%' }, grid: { color: '#E2EFF9' } },
                    x: { grid: { display: false } }
                  }
                }} />
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No class data for today
                </div>
              )}
            </div>

            {/* Summary stats panel */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div><h3>Today at a Glance</h3><p>{summary?.date}</p></div>
              </div>
              {summary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                  {[
                    { label: 'Total Students', val: summary.totalStudents, color: '#4FC3F7', bg: '#E1F5FE' },
                    { label: 'Present',        val: summary.presentToday,  color: '#43A047', bg: '#E8F5E9' },
                    { label: 'Late',           val: summary.lateToday,     color: '#F9A825', bg: '#FFF9C4' },
                    { label: 'Absent',         val: summary.absentToday,   color: '#E53935', bg: '#FFEBEE' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: item.bg }}>
                      <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#1E293B' }}>{item.label}</div>
                      <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 22, color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trend chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div><h3>Attendance Trend</h3><p>Daily attendance % over selected period</p></div>
              <span className="chip purple">Live Data</span>
            </div>
            {trend.length > 0 ? (
              <Line data={trendChartData} options={{
                responsive: true,
                plugins: { legend: { position: 'top', labels: { font: { family: 'Nunito', weight: 700 } } } },
                scales: {
                  y: { min: 60, max: 100, ticks: { callback: (v: number | string) => v + '%' }, grid: { color: '#E2EFF9' } },
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
              }} />
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No trend data for this period yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
