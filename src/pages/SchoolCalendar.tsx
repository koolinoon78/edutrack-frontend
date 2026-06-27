import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Holiday {
  id: string;
  date: string;
  reason: string;
}

interface MonthCalendar {
  year: number;
  month: number;
  schoolDays: string[];
  holidays: Holiday[];
  totalSchoolDays: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function toIso(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SchoolCalendar() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based

  const [calData, setCalData]   = useState<MonthCalendar | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Add holiday form
  const [addDate, setAddDate]     = useState('');
  const [addReason, setAddReason] = useState('');
  const [adding, setAdding]       = useState(false);
  const [addError, setAddError]   = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Bulk add working days
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd]     = useState('');
  const [bulkPreview, setBulkPreview] = useState<string[]>([]);

  // ── Fetch month data ────────────────────────────────────────────────────────

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await request<MonthCalendar>(`/calendar/month?year=${year}&month=${month}`);
      setCalData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };
  const goToNextMonth = () => {
    const nm = month === 12 ? 1 : month + 1;
    const ny = month === 12 ? year + 1 : year;
    setYear(ny); setMonth(nm);
    // Pre-fill bulk dates for next month
    const firstDay = new Date(ny, nm - 1, 1);
    const lastDay  = new Date(ny, nm, 0);
    setBulkStart(toIso(firstDay));
    setBulkEnd(toIso(lastDay));
  };

  // ── Add holiday ─────────────────────────────────────────────────────────────

  const handleAddHoliday = async () => {
    if (!addDate || !addReason.trim()) {
      setAddError('Please provide both a date and reason.');
      return;
    }
    setAdding(true); setAddError(''); setAddSuccess('');
    try {
      await request('/calendar/holidays', {
        method: 'POST',
        body: JSON.stringify({ date: addDate, reason: addReason.trim() }),
      });
      setAddSuccess(`Holiday added for ${addDate}`);
      setAddDate(''); setAddReason('');
      fetchMonth();
    } catch (e: any) {
      setAddError(e.message || 'Failed to add holiday');
    } finally {
      setAdding(false);
    }
  };

  // ── Remove holiday ──────────────────────────────────────────────────────────

  const handleRemoveHoliday = async (id: string, date: string) => {
    if (!window.confirm(`Remove holiday on ${date}?`)) return;
    try {
      await request(`/calendar/holidays/${id}`, { method: 'DELETE' });
      fetchMonth();
    } catch (e: any) {
      alert(e.message || 'Failed to remove holiday');
    }
  };

  // ── Bulk preview ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!bulkStart || !bulkEnd) { setBulkPreview([]); return; }
    const start = new Date(bulkStart);
    const end   = new Date(bulkEnd);
    if (start > end) { setBulkPreview([]); return; }
    const days: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) days.push(toIso(new Date(cur)));
      cur.setDate(cur.getDate() + 1);
    }
    setBulkPreview(days);
  }, [bulkStart, bulkEnd]);

  // ── Build calendar grid ─────────────────────────────────────────────────────

  const buildGrid = (): (number | null)[] => {
    const firstDow = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const grid: (number | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  };

  const schoolDaySet  = new Set(calData?.schoolDays ?? []);
  const holidayMap    = new Map<string, string>(
    (calData?.holidays ?? []).map(h => [h.date, h.reason])
  );
  const todayStr = toIso(today);

  const grid = buildGrid();

  // ── Day cell classifier ─────────────────────────────────────────────────────

  const classifyDay = (day: number): 'school' | 'holiday' | 'weekend' | 'future' => {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dow = new Date(year, month - 1, day).getDay();
    if (dow === 0 || dow === 6) return 'weekend';
    if (holidayMap.has(dateStr)) return 'holiday';
    if (schoolDaySet.has(dateStr)) return 'school';
    return 'future';
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>

      {/* ── Top row: Calendar + Holiday Manager ── */}
      <div style={styles.topRow}>

        {/* ── Calendar ── */}
        <div style={styles.card}>
          <div style={styles.calHeader}>
            <button style={styles.navBtn} onClick={prevMonth}>‹</button>
            <h2 style={styles.monthTitle}>
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <button style={styles.navBtn} onClick={nextMonth}>›</button>
          </div>

          {loading && <p style={styles.loading}>Loading…</p>}
          {error   && <p style={styles.errorText}>{error}</p>}

          {!loading && calData && (
            <>
              {/* Summary pill */}
              <div style={styles.summaryRow}>
                <span style={styles.pill('school')}>🏫 {calData.totalSchoolDays} school days</span>
                <span style={styles.pill('holiday')}>🎌 {calData.holidays.length} holidays</span>
              </div>

              {/* Day labels */}
              <div style={styles.grid7}>
                {DAY_LABELS.map(d => (
                  <div key={d} style={styles.dayLabel}>{d}</div>
                ))}
              </div>

              {/* Date cells */}
              <div style={styles.grid7}>
                {grid.map((day, i) => {
                  if (day === null) return <div key={`e${i}`} />;
                  const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const kind = classifyDay(day);
                  const isToday = dateStr === todayStr;
                  const reason = holidayMap.get(dateStr);
                  return (
                    <div
                      key={day}
                      title={reason ? `Holiday: ${reason}` : undefined}
                      style={{
                        ...styles.dayCell,
                        background: isToday
                          ? '#6366f1'
                          : kind === 'school'  ? 'rgba(34,197,94,0.15)'
                          : kind === 'holiday' ? 'rgba(239,68,68,0.15)'
                          : kind === 'weekend' ? 'transparent'
                          : 'rgba(255,255,255,0.03)',
                        color: isToday ? '#fff'
                          : kind === 'school'  ? '#4ade80'
                          : kind === 'holiday' ? '#f87171'
                          : kind === 'weekend' ? 'rgba(255,255,255,0.2)'
                          : 'rgba(255,255,255,0.4)',
                        border: isToday ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.06)',
                        fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      {day}
                      {kind === 'holiday' && <span style={styles.dot('red')} />}
                      {kind === 'school'  && <span style={styles.dot('green')} />}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={styles.legend}>
                <span style={styles.legendItem('#4ade80')}>● School day</span>
                <span style={styles.legendItem('#f87171')}>● Holiday</span>
                <span style={styles.legendItem('#818cf8')}>● Today</span>
                <span style={styles.legendItem('rgba(255,255,255,0.2)')}>● Weekend</span>
              </div>
            </>
          )}
        </div>

        {/* ── Holiday Manager ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 280 }}>

          {/* Add Holiday */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🎌 Add Holiday</h3>
            <p style={styles.cardSubtitle}>Mark a day as a school holiday (no attendance tracked)</p>

            <label style={styles.label}>Date</label>
            <input
              type="date"
              value={addDate}
              onChange={e => setAddDate(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>Reason</label>
            <input
              type="text"
              placeholder="e.g. Vesak Day, Term Break"
              value={addReason}
              onChange={e => setAddReason(e.target.value)}
              style={styles.input}
            />

            {addError   && <p style={styles.errorText}>{addError}</p>}
            {addSuccess && <p style={styles.successText}>{addSuccess}</p>}

            <button
              onClick={handleAddHoliday}
              disabled={adding}
              style={{ ...styles.btn('primary'), marginTop: 4 }}
            >
              {adding ? 'Adding…' : '+ Add Holiday'}
            </button>
          </div>

          {/* Current month holidays list */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📋 {MONTH_NAMES[month - 1]} {year} Holidays</h3>
            {calData?.holidays.length === 0 && (
              <p style={styles.emptyText}>No holidays this month</p>
            )}
            {calData?.holidays.map(h => (
              <div key={h.id} style={styles.holidayRow}>
                <div>
                  <div style={styles.holidayDate}>{h.date}</div>
                  <div style={styles.holidayReason}>{h.reason}</div>
                </div>
                <button
                  onClick={() => handleRemoveHoliday(h.id, h.date)}
                  style={styles.btn('danger')}
                  title="Remove holiday"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── School Start Time Info ── */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>⏰ School Start Time</h3>
        <div style={styles.infoBox}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7 }}>
            The absence notification runs every weekday at <strong style={{ color: '#a5b4fc' }}>9:00 AM</strong>.
            Students with no arrival scan by that time are automatically marked <strong style={{ color: '#f87171' }}>ABSENT</strong> and parents are emailed.
          </p>
          <div style={styles.configBox}>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              To change the start time, edit <code style={styles.code}>application.yml</code>:
            </p>
            <pre style={styles.pre}>{`edutrack:
  school:
    absence-check-cron: "0 0 8 * * MON-FRI"
    # ↑ Change "8" to your school's hour (24h format)
    # e.g. "0 0 7 * * MON-FRI" = 7:00 AM`}</pre>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Then update <code style={styles.code}>AbsenceScheduler.java</code> to use{' '}
              <code style={styles.code}>@Scheduled(cron = "${'{'}edutrack.school.absence-check-cron{'}'}")</code>
            </p>
          </div>
        </div>
      </div>

      {/* ── Add Working Days for Next Month ── */}
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h3 style={{ ...styles.cardTitle, marginBottom: 2 }}>📅 Plan School Working Days</h3>
            <p style={styles.cardSubtitle}>
              Preview school days in a date range (weekends excluded automatically).
              Any dates in the holiday list above will also be excluded from attendance counts.
            </p>
          </div>
          <button
            onClick={goToNextMonth}
            style={{ ...styles.btn('secondary'), whiteSpace: 'nowrap' }}
          >
            Jump to Next Month →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={styles.label}>From</label>
            <input type="date" value={bulkStart} onChange={e => setBulkStart(e.target.value)} style={styles.input} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={styles.label}>To</label>
            <input type="date" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} style={styles.input} />
          </div>
        </div>

        {bulkPreview.length > 0 && (
          <>
            <div style={styles.previewHeader}>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>{bulkPreview.length} school working days</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                {' '}(Mon–Fri, holidays excluded separately)
              </span>
            </div>
            <div style={styles.previewGrid}>
              {bulkPreview.map(d => {
                const dow = new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={d} style={styles.previewDay}>
                    <span style={styles.previewDow}>{dow}</span>
                    <span style={styles.previewDate}>{d.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 12 }}>
              💡 Tip: Use the "Add Holiday" panel to mark any of these days as holidays. The backend automatically excludes them from attendance calculations.
            </p>
          </>
        )}

        {bulkStart && bulkEnd && bulkPreview.length === 0 && (
          <p style={styles.emptyText}>No working days in this range (all weekends?)</p>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 20,
    padding: '4px 0',
  },
  topRow: {
    display: 'flex' as const,
    gap: 20,
    flexWrap: 'wrap' as const,
    alignItems: 'flex-start' as const,
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 24,
    flex: 1,
    minWidth: 300,
  } as React.CSSProperties,
  calHeader: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  monthTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    fontFamily: 'Nunito, sans-serif',
  },
  navBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as React.CSSProperties,
  summaryRow: {
    display: 'flex' as const,
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap' as const,
  },
  pill: (kind: 'school' | 'holiday') => ({
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 20,
    background: kind === 'school' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
    color: kind === 'school' ? '#4ade80' : '#f87171',
    border: `1px solid ${kind === 'school' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
  } as React.CSSProperties),
  grid7: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(7, 1fr)' as const,
    gap: 3,
  },
  dayLabel: {
    textAlign: 'center' as const,
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.3)',
    padding: '4px 0',
    letterSpacing: 0.5,
  },
  dayCell: {
    position: 'relative' as const,
    aspectRatio: '1',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 8,
    fontSize: 13,
    cursor: 'default' as const,
    transition: 'opacity 0.15s',
  },
  dot: (color: 'red' | 'green') => ({
    position: 'absolute' as const,
    bottom: 3,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: color === 'red' ? '#f87171' : '#4ade80',
  } as React.CSSProperties),
  legend: {
    display: 'flex' as const,
    gap: 12,
    marginTop: 14,
    flexWrap: 'wrap' as const,
  },
  legendItem: (color: string) => ({
    fontSize: 11,
    color,
    fontWeight: 600,
  } as React.CSSProperties),
  cardTitle: {
    margin: '0 0 4px',
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    fontFamily: 'Nunito, sans-serif',
  },
  cardSubtitle: {
    margin: '0 0 16px',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  label: {
    display: 'block' as const,
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Nunito, sans-serif',
    outline: 'none',
  } as React.CSSProperties,
  btn: (kind: 'primary' | 'secondary' | 'danger') => ({
    padding: kind === 'danger' ? '4px 10px' : '10px 18px',
    background:
      kind === 'primary' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' :
      kind === 'danger'  ? 'rgba(239,68,68,0.15)' :
      'rgba(255,255,255,0.07)',
    border: kind === 'danger' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: kind === 'danger' ? '#f87171' : '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'Nunito, sans-serif',
  } as React.CSSProperties),
  errorText: {
    color: '#f87171',
    fontSize: 13,
    margin: '6px 0 0',
  },
  successText: {
    color: '#4ade80',
    fontSize: 13,
    margin: '6px 0 0',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    margin: '4px 0',
  },
  loading: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center' as const,
    padding: 20,
  },
  holidayRow: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  holidayDate: {
    fontSize: 13,
    color: '#f87171',
    fontWeight: 700,
    fontFamily: 'Nunito, sans-serif',
  },
  holidayReason: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  infoBox: {
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 12,
    padding: 16,
  },
  configBox: {
    marginTop: 14,
    padding: 14,
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
  },
  pre: {
    margin: '10px 0 0',
    fontSize: 12,
    color: '#a5b4fc',
    fontFamily: 'monospace',
    whiteSpace: 'pre' as const,
    overflowX: 'auto' as const,
  },
  code: {
    background: 'rgba(255,255,255,0.08)',
    padding: '1px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#c4b5fd',
  } as React.CSSProperties,
  previewHeader: {
    marginBottom: 12,
    fontSize: 14,
  },
  previewGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))' as const,
    gap: 6,
  },
  previewDay: {
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 8,
    padding: '6px 0',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  previewDow: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(74,222,128,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  previewDate: {
    fontSize: 13,
    fontWeight: 700,
    color: '#4ade80',
  },
};
