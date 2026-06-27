import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { apiGetStudents, StudentRecord, request } from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, ArcElement, Title, Tooltip, Legend);

// ── Types ─────────────────────────────────────────────────────────────────────
interface DowEntry { day: string; absent: number; total: number; absentPct: number; }
interface MonthEntry { PRESENT: number; LATE: number; ABSENT: number; }

interface StudentProfile {
  student: { id: number; studentId: string; name: string; grade: string; parentEmail: string; };
  stats: {
    totalRecords: number; present: number; late: number; absent: number;
    attendancePct: number; absentStreak: number; avgArrivalTime: string | null;
    totalSchoolDays: number;
    riskLevel: 'GOOD' | 'WARNING' | 'HIGH_RISK' | 'NO_DATA';
  };
  heatmap: Record<string, 'PRESENT' | 'LATE' | 'ABSENT'>;
  dowPattern: DowEntry[];
  monthlyBreakdown: Record<string, MonthEntry>;
  fromDate: string;
  toDate: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US',
    { month: 'short', day: 'numeric', year: 'numeric' });
}
function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function today(): string { return new Date().toISOString().split('T')[0]; }

const RISK_CONFIG = {
  GOOD:      { color: '#22c55e', bg: '#dcfce7', label: '✅ Good Standing', border: '#86efac' },
  WARNING:   { color: '#f59e0b', bg: '#fef3c7', label: '⚠️ Needs Attention', border: '#fcd34d' },
  HIGH_RISK: { color: '#ef4444', bg: '#fee2e2', label: '🚨 High Risk',       border: '#fca5a5' },
  NO_DATA:   { color: '#94a3b8', bg: '#f1f5f9', label: '⬜ No Data Yet',     border: '#cbd5e1' },
};

const STATUS_COLOR: Record<string, string> = {
  PRESENT: '#22c55e',
  LATE:    '#f59e0b',
  ABSENT:  '#ef4444',
};

// ── Heatmap Calendar ──────────────────────────────────────────────────────────
function AttendanceHeatmap({ heatmap, fromDate, toDate }: {
  heatmap: Record<string, string>; fromDate: string; toDate: string;
}) {
  const start = new Date(fromDate + 'T00:00:00');
  const end   = new Date(toDate   + 'T00:00:00');
  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  // Group into weeks starting Monday
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  const firstDow = (days[0].getDay() + 6) % 7; // Mon=0
  for (let i = 0; i < firstDow; i++) week.push(null);
  for (const d of days) {
    const dow = (d.getDay() + 6) % 7;
    if (dow === 0 && week.length > 0) { weeks.push(week); week = []; }
    week.push(d);
  }
  if (week.length > 0) weeks.push(week);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {dayLabels.map((l, i) => (
          <div key={i} style={{ width: 22, textAlign: 'center', fontSize: 10,
            color: 'var(--text-muted)', fontWeight: 700 }}>{l}</div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', gap: 4 }}>
            {week.map((d, di) => {
              if (!d) return <div key={di} style={{ width: 22, height: 22 }} />;
              const iso = d.toISOString().split('T')[0];
              const status = heatmap[iso];
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              const bg = status ? STATUS_COLOR[status] : isWeekend ? '#f1f5f9' : '#e2e8f0';
              const opacity = status ? 1 : 0.5;
              return (
                <div key={di} title={`${iso}: ${status || (isWeekend ? 'Weekend' : 'No record')}`}
                  style={{
                    width: 22, height: 22, borderRadius: 5, background: bg,
                    opacity, cursor: 'default', transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {[['PRESENT','#22c55e'], ['LATE','#f59e0b'], ['ABSENT','#ef4444'], ['No record','#e2e8f0']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color, bg }: { label: string; value: string | number; color: string; bg: string; }) {
  return (
    <div style={{ background: bg, borderRadius: 16, padding: '18px 22px', flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase',
        letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Nunito', color }}>{value}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentProfile() {
  const [students, setStudents]       = useState<StudentRecord[]>([]);
  const [search, setSearch]           = useState('');
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [profile, setProfile]         = useState<StudentProfile | null>(null);
  const [loading, setLoading]         = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError]             = useState('');
  const [rangeDays, setRangeDays]     = useState(30);
  const [activeTab, setActiveTab]     = useState<'overview' | 'calendar' | 'patterns' | 'monthly'>('overview');

  // Load student list
  useEffect(() => {
    setStudentsLoading(true);
    apiGetStudents()
      .then(setStudents)
      .catch(() => setError('Failed to load students'))
      .finally(() => setStudentsLoading(false));
  }, []);

  // Load profile when student or range changes
  const loadProfile = useCallback(() => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    const from = daysAgo(rangeDays - 1);
    const to   = today();
    request<StudentProfile>(`/analytics/student/${selectedId}?fromDate=${from}&toDate=${to}`)
      .then(setProfile)
      .catch(e => setError(e.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [selectedId, rangeDays]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.grade.toLowerCase().includes(search.toLowerCase())
  );

  const risk = profile ? RISK_CONFIG[profile.stats.riskLevel] : null;

  // ── Charts ──────────────────────────────────────────────────────────────────
  const donutData = profile ? {
    labels: ['Present', 'Late', 'Absent'],
    datasets: [{ data: [profile.stats.present, profile.stats.late, profile.stats.absent],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      borderWidth: 0, hoverOffset: 6 }],
  } : null;

  const dowData = profile ? {
    labels: profile.dowPattern.map(d => d.day.substring(0, 3)),
    datasets: [
      { label: 'Absent %', data: profile.dowPattern.map(d => d.absentPct),
        backgroundColor: 'rgba(239,68,68,0.75)', borderRadius: 8, borderSkipped: false },
      { label: 'Days tracked', data: profile.dowPattern.map(d => d.total),
        backgroundColor: 'rgba(79,195,247,0.3)', borderRadius: 8, borderSkipped: false },
    ],
  } : null;

  const monthlyLabels = profile ? Object.keys(profile.monthlyBreakdown) : [];
  const monthlyData = profile ? {
    labels: monthlyLabels.map(k => {
      const [y, m] = k.split('-');
      return new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      { label: 'Present', data: monthlyLabels.map(k => profile.monthlyBreakdown[k].PRESENT),
        backgroundColor: '#22c55e', borderRadius: 6, borderSkipped: false },
      { label: 'Late',    data: monthlyLabels.map(k => profile.monthlyBreakdown[k].LATE),
        backgroundColor: '#f59e0b', borderRadius: 6, borderSkipped: false },
      { label: 'Absent',  data: monthlyLabels.map(k => profile.monthlyBreakdown[k].ABSENT),
        backgroundColor: '#ef4444', borderRadius: 6, borderSkipped: false },
    ],
  } : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-inner" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── LEFT: Student Picker ── */}
      <div style={{
        width: 280, flexShrink: 0, background: 'white', borderRadius: 20,
        boxShadow: 'var(--shadow)', overflow: 'hidden', position: 'sticky', top: 0,
      }}>
        <div style={{ padding: '20px 18px 12px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Select Student</h3>
          <input
            className="form-input"
            placeholder="🔍 Search name, ID, grade…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', fontSize: 13 }}
          />
        </div>
        <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          {studentsLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading…
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No students found
            </div>
          ) : filteredStudents.map(s => (
            <div
              key={s.id}
              onClick={() => { setSelectedId(s.id); setProfile(null); setActiveTab('overview'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: selectedId === s.id ? 'linear-gradient(135deg,rgba(79,195,247,0.12),rgba(168,237,203,0.08))' : 'white',
                borderLeft: selectedId === s.id ? '4px solid var(--sky)' : '4px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                background: selectedId === s.id
                  ? 'linear-gradient(135deg,var(--sky),var(--mint))'
                  : 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, fontFamily: 'Nunito',
                color: selectedId === s.id ? 'white' : 'var(--text-muted)',
              }}>
                {initials(s.fullName)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.fullName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.studentId} · Grade {s.grade}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Profile View ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Empty state */}
        {!selectedId && (
          <div style={{
            background: 'white', borderRadius: 20, boxShadow: 'var(--shadow)',
            padding: '64px 40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👤</div>
            <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>
              Select a student to view their profile
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Full attendance history, patterns, and risk analysis will appear here.
            </p>
          </div>
        )}

        {/* Loading */}
        {selectedId && loading && (
          <div style={{
            background: 'white', borderRadius: 20, boxShadow: 'var(--shadow)',
            padding: '64px 40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading profile…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 12,
            padding: '12px 18px', fontSize: 13, color: '#b91c1c', fontWeight: 600,
            marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            ⚠️ {error}
            <button onClick={() => setError('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontWeight: 800 }}>✕</button>
          </div>
        )}

        {/* Profile loaded */}
        {profile && !loading && (
          <>
            {/* ── Header Card ── */}
            <div style={{
              background: 'linear-gradient(135deg, #1E3A5F 0%, #0F2240 100%)',
              borderRadius: 20, padding: '28px 32px', marginBottom: 20,
              boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden',
            }}>
              {/* decorative blob */}
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                borderRadius: '50%', background: 'rgba(79,195,247,0.08)', pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{
                  width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--sky), var(--mint))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 900, fontFamily: 'Nunito', color: 'white',
                  boxShadow: '0 8px 24px rgba(79,195,247,0.4)',
                }}>
                  {initials(profile.student.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: 'white', fontSize: 22, marginBottom: 4 }}>{profile.student.name}</h2>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      ['🆔', profile.student.studentId],
                      ['📚', `Grade ${profile.student.grade}`],
                      ['📧', profile.student.parentEmail || '—'],
                    ].map(([icon, val]) => (
                      <span key={val} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 5 }}>
                        {icon} {val}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risk badge */}
                {risk && (
                  <div style={{
                    background: risk.bg, border: `2px solid ${risk.border}`,
                    borderRadius: 14, padding: '10px 18px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: risk.color }}>{risk.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Nunito', color: risk.color, marginTop: 2 }}>
                      {profile.stats.attendancePct}%
                    </div>
                    <div style={{ fontSize: 10, color: risk.color, opacity: 0.7 }}>Attendance Rate</div>
                  </div>
                )}
              </div>

              {/* Quick stats row */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'School Days',     val: profile.stats.totalSchoolDays, color: '#4FC3F7' },
                  { label: 'Days Recorded',    val: profile.stats.totalRecords, color: '#a78bfa' },
                  { label: 'Present',          val: profile.stats.present,      color: '#22c55e' },
                  { label: 'Late Arrivals',    val: profile.stats.late,         color: '#f59e0b' },
                  { label: 'Absences',         val: profile.stats.absent,       color: '#ef4444' },
                  { label: 'Current Streak',   val: profile.stats.absentStreak > 0 ? `${profile.stats.absentStreak} absent` : '—', color: profile.stats.absentStreak > 2 ? '#ef4444' : '#94a3b8' },
                  { label: 'Avg Arrival',      val: profile.stats.avgArrivalTime || '—', color: '#a78bfa' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{
                    flex: 1, minWidth: 90, background: 'rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Nunito', color }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Range + Tabs ── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, background: 'white', borderRadius: 14, padding: 6, boxShadow: 'var(--shadow)' }}>
                {[
                  { label: '2W',  days: 14  },
                  { label: '1M',  days: 30  },
                  { label: '3M',  days: 90  },
                  { label: '6M',  days: 180 },
                ].map(({ label, days }) => (
                  <button key={days} onClick={() => setRangeDays(days)} style={{
                    padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontWeight: 800, fontFamily: 'Nunito', fontSize: 12,
                    background: rangeDays === days ? 'linear-gradient(135deg,#4FC3F7,#0288D1)' : 'transparent',
                    color: rangeDays === days ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}>{label}</button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {fmtDate(profile.fromDate)} — {fmtDate(profile.toDate)}
              </span>
            </div>

            {/* ── Tab bar ── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white',
              borderRadius: 14, padding: 6, boxShadow: 'var(--shadow)', width: 'fit-content' }}>
              {([
                ['overview',  '📊 Overview'],
                ['calendar',  '📅 Calendar'],
                ['patterns',  '🔍 Patterns'],
                ['monthly',   '📈 Monthly'],
              ] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontFamily: 'Nunito', fontSize: 12,
                  background: activeTab === tab ? 'linear-gradient(135deg,#1E3A5F,#0F2240)' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>

            {/* ─────────── TAB: OVERVIEW ─────────── */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

                {/* Donut chart */}
                <div style={{ flex: 1, minWidth: 260, background: 'white', borderRadius: 20,
                  boxShadow: 'var(--shadow)', padding: '24px 28px' }}>
                  <h3 style={{ fontSize: 15, marginBottom: 4 }}>Attendance Breakdown</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                    {profile.stats.totalRecords} recorded days
                  </p>
                  {donutData && (
                    <div style={{ maxWidth: 220, margin: '0 auto' }}>
                      <Doughnut data={donutData} options={{
                        cutout: '72%', responsive: true,
                        plugins: {
                          legend: { position: 'bottom', labels: { font: { family: 'Nunito', weight: '700' }, padding: 16 } },
                          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} days` } },
                        },
                      }} />
                    </div>
                  )}
                </div>

                {/* Stats pills */}
                <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <StatPill label="Present" value={profile.stats.present} color="#22c55e" bg="#dcfce7" />
                    <StatPill label="Late"    value={profile.stats.late}    color="#f59e0b" bg="#fef3c7" />
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <StatPill label="Absent"     value={profile.stats.absent}         color="#ef4444" bg="#fee2e2" />
                    <StatPill label="Attendance" value={`${profile.stats.attendancePct}%`} color="#0288D1" bg="#e1f5fe" />
                  </div>

                  {/* Streak warning */}
                  {profile.stats.absentStreak >= 2 && (
                    <div style={{
                      background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 14,
                      padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 24 }}>🔴</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#c2410c' }}>
                          {profile.stats.absentStreak}-day absence streak
                        </div>
                        <div style={{ fontSize: 12, color: '#9a3412', marginTop: 2 }}>
                          Student has been absent for {profile.stats.absentStreak} consecutive school days.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Avg arrival */}
                  <div style={{
                    background: '#f5f3ff', border: '1.5px solid #e9d5ff', borderRadius: 14,
                    padding: '14px 18px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed',
                      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Average Arrival</div>
                    <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Nunito', color: '#7c3aed' }}>
                      {profile.stats.avgArrivalTime || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6d28d9', marginTop: 2 }}>
                      {profile.stats.avgArrivalTime
                        ? (profile.stats.avgArrivalTime < '08:00' ? 'Usually on time ✅' : 'Usually arriving late ⚠️')
                        : 'No arrival scans in range'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────── TAB: CALENDAR ─────────── */}
            {activeTab === 'calendar' && (
              <div style={{ background: 'white', borderRadius: 20, boxShadow: 'var(--shadow)', padding: '28px 32px' }}>
                <h3 style={{ fontSize: 15, marginBottom: 4 }}>Attendance Calendar</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
                  Daily attendance status — hover a cell for details
                </p>
                <AttendanceHeatmap
                  heatmap={profile.heatmap}
                  fromDate={profile.fromDate}
                  toDate={profile.toDate}
                />
                <div style={{ marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <h4 style={{ fontSize: 13, marginBottom: 12 }}>Day-by-day log</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                    {Object.entries(profile.heatmap).sort(([a], [b]) => b.localeCompare(a)).map(([date, status]) => (
                      <div key={date} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px',
                        borderRadius: 10, background: 'var(--bg)',
                      }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                          background: STATUS_COLOR[status],
                        }} />
                        <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{fmtDate(date)}</span>
                        <span style={{ fontSize: 12, color: STATUS_COLOR[status], fontWeight: 700, marginLeft: 'auto' }}>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────── TAB: PATTERNS ─────────── */}
            {activeTab === 'patterns' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Day-of-week chart */}
                <div style={{ background: 'white', borderRadius: 20, boxShadow: 'var(--shadow)', padding: '24px 28px' }}>
                  <h3 style={{ fontSize: 15, marginBottom: 4 }}>Day-of-Week Absence Pattern</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                    Which day does this student miss most?
                  </p>
                  {dowData && (
                    <Bar data={dowData} options={{
                      responsive: true,
                      plugins: { legend: { position: 'top', labels: { font: { family: 'Nunito', weight: '700' } } } },
                      scales: {
                        y: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Nunito' } } },
                        x: { grid: { display: false }, ticks: { font: { family: 'Nunito', weight: '700' } } },
                      },
                    }} />
                  )}
                </div>

                {/* Worst day insight */}
                {profile.dowPattern.length > 0 && (() => {
                  const worst = [...profile.dowPattern].sort((a, b) => b.absentPct - a.absentPct)[0];
                  const best  = [...profile.dowPattern].filter(d => d.total > 0).sort((a, b) => a.absentPct - b.absentPct)[0];
                  return (
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ flex: 1, background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 16, padding: '18px 22px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Worst Day</div>
                        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Nunito', color: '#b91c1c' }}>{worst.day}</div>
                        <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 4 }}>{worst.absentPct.toFixed(0)}% absence rate · {worst.absent}/{worst.total} days missed</div>
                      </div>
                      {best && (
                        <div style={{ flex: 1, background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 16, padding: '18px 22px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Best Day</div>
                          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Nunito', color: '#15803d' }}>{best.day}</div>
                          <div style={{ fontSize: 12, color: '#14532d', marginTop: 4 }}>{best.absentPct.toFixed(0)}% absence rate · {best.absent}/{best.total} days missed</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ─────────── TAB: MONTHLY ─────────── */}
            {activeTab === 'monthly' && (
              <div style={{ background: 'white', borderRadius: 20, boxShadow: 'var(--shadow)', padding: '24px 28px' }}>
                <h3 style={{ fontSize: 15, marginBottom: 4 }}>Monthly Attendance Breakdown</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Present / Late / Absent counts by month
                </p>
                {monthlyData && monthlyLabels.length > 0 ? (
                  <Bar data={monthlyData} options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top', labels: { font: { family: 'Nunito', weight: '700' } } },
                    },
                    scales: {
                      x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Nunito', weight: '700' } } },
                      y: { stacked: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Nunito' } } },
                    },
                  }} />
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: 13 }}>
                    No monthly data for this period
                  </div>
                )}

                {/* Monthly table */}
                <div style={{ marginTop: 24, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        {['Month', 'Present', 'Late', 'Absent', 'Total', 'Rate'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800,
                            fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)',
                            borderBottom: '2px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyLabels.map(k => {
                        const m = profile.monthlyBreakdown[k];
                        const total = m.PRESENT + m.LATE + m.ABSENT;
                        const rate  = total > 0 ? (((m.PRESENT + m.LATE) / total) * 100).toFixed(1) : '—';
                        const [y, mo] = k.split('-');
                        const label = new Date(+y, +mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        return (
                          <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 700 }}>{label}</td>
                            <td style={{ padding: '10px 14px', color: '#22c55e', fontWeight: 700 }}>{m.PRESENT}</td>
                            <td style={{ padding: '10px 14px', color: '#f59e0b', fontWeight: 700 }}>{m.LATE}</td>
                            <td style={{ padding: '10px 14px', color: '#ef4444', fontWeight: 700 }}>{m.ABSENT}</td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{total}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                background: rate === '—' ? '#f1f5f9' : parseFloat(rate) >= 90 ? '#dcfce7' : parseFloat(rate) >= 80 ? '#fef3c7' : '#fee2e2',
                                color:      rate === '—' ? '#94a3b8' : parseFloat(rate) >= 90 ? '#15803d' : parseFloat(rate) >= 80 ? '#92400e' : '#b91c1c',
                                borderRadius: 8, padding: '3px 10px', fontWeight: 800, fontSize: 12,
                              }}>{rate === '—' ? '—' : `${rate}%`}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
