import React, { useEffect, useRef, useState } from 'react';

const FEATURES = [
  {
    icon: '📱',
    title: 'QR Code Scanning',
    desc: 'Students scan in seconds. No queues, no paper. Arrival and departure captured instantly on any mobile device.',
    color: '#4FC3F7',
    bg: '#E1F5FE',
  },
  {
    icon: '📊',
    title: 'Live Analytics',
    desc: 'Real-time attendance trends, class comparisons, and high-risk student alerts — all in one principal dashboard.',
    color: '#A8EDCB',
    bg: '#E8F5E9',
  },
  {
    icon: '🔔',
    title: 'Parent Notifications',
    desc: 'Automated email alerts via Brevo SMTP keep parents informed the moment their child is marked absent or late.',
    color: '#CE93D8',
    bg: '#F3E5F5',
  },
  {
    icon: '🔐',
    title: 'Secure by Design',
    desc: 'JWT authentication and role-based access control ensure only the right people see the right data.',
    color: '#FFD54F',
    bg: '#FFFDE7',
  },
];

const STATS = [
  { val: '1,200+', label: 'Students Tracked', icon: '🎒' },
  { val: '98.6%', label: 'Scan Accuracy', icon: '✅' },
  { val: '< 3s', label: 'Per Attendance Mark', icon: '⚡' },
  { val: '24/7', label: 'Cloud Uptime', icon: '☁️' },
];

const HOW = [
  { step: '01', icon: '🎫', title: 'Student Gets QR Code', desc: 'Each student receives a unique QR code linked to their profile. Printed on ID card or digital.' },
  { step: '02', icon: '📷', title: 'Scan at the Gate', desc: 'The gate monitor scans using any smartphone. Arrival and departure are recorded in real time.' },
  { step: '03', icon: '☁️', title: 'Data Hits the Cloud', desc: 'Records are instantly stored in Neon PostgreSQL. No lag, no loss — even with hundreds of students.' },
  { step: '04', icon: '📬', title: 'Parents Are Notified', desc: 'Absent or late? Parents receive an automated email within minutes via Brevo SMTP.' },
];

export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F8FBFF', color: '#1E293B', overflowX: 'hidden' }}>
      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrollY > 20 ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrollY > 20 ? 'blur(12px)' : 'none',
        boxShadow: scrollY > 20 ? '0 2px 20px rgba(79,195,247,0.12)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #4FC3F7, #A8EDCB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            boxShadow: '0 4px 12px rgba(79,195,247,0.4)',
          }}>🏫</div>
          <div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 18, lineHeight: 1.1, color: '#1E3A5F' }}>EduTrack</div>
            <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1 }}>Smart Attendance</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="#features" style={{ padding: '8px 16px', borderRadius: 8, color: '#64748B', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
          <a href="#how" style={{ padding: '8px 16px', borderRadius: 8, color: '#64748B', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>How It Works</a>
          <button onClick={onEnterApp} style={{
            padding: '10px 22px', borderRadius: 12,
            background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
            color: 'white', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 14, fontFamily: "'Nunito', sans-serif",
            boxShadow: '0 4px 16px rgba(79,195,247,0.4)',
          }}>Sign In →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '100px 40px 60px',
        position: 'relative',
        background: 'linear-gradient(160deg, #E8F6FE 0%, #F0FDF4 50%, #F5F3FF 100%)',
        overflow: 'hidden',
      }}>
        {/* Background blobs */}
        {[
          { w: 500, h: 500, bg: 'radial-gradient(circle, rgba(79,195,247,0.18) 0%, transparent 70%)', top: -100, left: -150 },
          { w: 400, h: 400, bg: 'radial-gradient(circle, rgba(168,237,203,0.22) 0%, transparent 70%)', bottom: -80, right: -100 },
          { w: 300, h: 300, bg: 'radial-gradient(circle, rgba(206,147,216,0.15) 0%, transparent 70%)', top: '40%', right: '10%' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', width: b.w, height: b.h, borderRadius: '50%',
            background: b.bg, top: b.top, left: b.left, bottom: b.bottom, right: b.right,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Floating emoji decorations */}
        {['📚', '✏️', '⭐', '🎒', '📐', '🔬', '🎨', '🏆'].map((emoji, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${8 + i * 11}%`,
            left: i % 2 === 0 ? `${3 + i * 4}%` : undefined,
            right: i % 2 !== 0 ? `${2 + i * 3}%` : undefined,
            fontSize: 36, opacity: 0.08,
            animation: `float ${5 + i * 0.7}s ease-in-out ${i * 0.8}s infinite alternate`,
            userSelect: 'none',
          }}>{emoji}</div>
        ))}

        <div style={{ textAlign: 'center', maxWidth: 720, position: 'relative' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 100,
            background: 'white', border: '1.5px solid #B0E3FA',
            fontSize: 13, color: '#0288D1', fontWeight: 600,
            marginBottom: 28, boxShadow: '0 2px 12px rgba(79,195,247,0.15)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FC3F7', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Smart Attendance for Modern Schools
          </div>

          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900, fontSize: 'clamp(36px, 6vw, 68px)',
            lineHeight: 1.1, marginBottom: 24,
            color: '#1E3A5F',
          }}>
            Every Student.<br />
            <span style={{
              background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Every Second.</span><br />
            Accounted For.
          </h1>

          <p style={{
            fontSize: 18, color: '#64748B', lineHeight: 1.7,
            marginBottom: 40, maxWidth: 560, margin: '0 auto 40px',
          }}>
            EduTrack replaces paper registers with instant QR-code scanning. Principals get live analytics, parents get instant alerts, and administrators get their time back.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onEnterApp} style={{
              padding: '16px 36px', borderRadius: 16,
              background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 16, fontFamily: "'Nunito', sans-serif",
              boxShadow: '0 8px 32px rgba(79,195,247,0.45)',
              transform: 'translateY(0)', transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(79,195,247,0.55)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(79,195,247,0.45)'; }}
            >
              🚀 Enter Dashboard
            </button>
            <a href="#how" style={{
              padding: '16px 36px', borderRadius: 16,
              background: 'white', color: '#1E3A5F',
              border: '2px solid #B0E3FA', cursor: 'pointer',
              fontWeight: 700, fontSize: 16, fontFamily: "'Nunito', sans-serif",
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>See How It Works ↓</a>
          </div>
        </div>

        {/* Hero dashboard preview */}
        <div style={{
          marginTop: 64, width: '100%', maxWidth: 900,
          background: 'white', borderRadius: 24,
          boxShadow: '0 24px 80px rgba(30,58,95,0.14), 0 4px 16px rgba(79,195,247,0.1)',
          overflow: 'hidden', border: '1px solid #E2EFF9',
          transform: `perspective(1000px) rotateX(${Math.min(scrollY * 0.03, 8)}deg)`,
          transition: 'transform 0.1s',
        }}>
          {/* Fake browser bar */}
          <div style={{ background: '#F1F5F9', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #E2EFF9' }}>
            {['#FF5F57', '#FFBD2E', '#28CA41'].map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
            <div style={{ flex: 1, margin: '0 16px', background: 'white', borderRadius: 6, height: 24, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 11, color: '#94A3B8' }}>
              🔒 app.edutrack.school/dashboard
            </div>
          </div>
          {/* Fake dashboard */}
          <div style={{ padding: 24, background: '#F0F9FF' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { icon: '👥', val: '1,248', label: 'Students', color: '#E1F5FE', accent: '#4FC3F7' },
                { icon: '✅', val: '94.2%', label: 'Present Today', color: '#E8F5E9', accent: '#A8EDCB' },
                { icon: '⏰', val: '23', label: 'Late', color: '#FFFDE7', accent: '#FFD54F' },
                { icon: '❌', val: '71', label: 'Absent', color: '#FFEBEE', accent: '#FF8A80' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.color, borderRadius: 14, padding: '14px 16px', borderLeft: `4px solid ${s.accent}` }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, color: '#1E3A5F' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12 }}>
              <div style={{ background: 'white', borderRadius: 14, padding: 16, height: 120, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, color: '#1E3A5F' }}>Attendance Trend — Last 10 Days</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  {[88, 92, 91, 96, 94, 89, 93, 97, 90, 95].map((v, i) => (
                    <div key={i} style={{ flex: 1, background: `linear-gradient(180deg, #4FC3F7, #0288D1)`, borderRadius: '4px 4px 0 0', height: `${(v - 80) * 4}px`, opacity: 0.7 + i * 0.03 }} />
                  ))}
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 14, padding: 16 }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, color: '#1E3A5F', marginBottom: 10 }}>Live Feed</div>
                {[
                  { name: 'Amara P.', time: '7:42', status: 'present' },
                  { name: 'Kaveesha S.', time: '7:51', status: 'present' },
                  { name: 'Ruwan J.', time: '8:14', status: 'late' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #4FC3F7, #CE93D8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 800 }}>{s.name.split(' ').map(n => n[0]).join('')}</div>
                    <span style={{ fontSize: 12, flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: s.status === 'present' ? '#E8F5E9' : '#FFFDE7', color: s.status === 'present' ? '#43A047' : '#F9A825', fontWeight: 700 }}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ background: 'linear-gradient(135deg, #1E3A5F, #0F2240)', padding: '48px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 36, color: '#4FC3F7', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '100px 40px', background: '#F8FBFF' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 100, background: '#E1F5FE', color: '#0288D1', fontSize: 12, fontWeight: 700, marginBottom: 16, letterSpacing: 1 }}>FEATURES</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 42, color: '#1E3A5F', lineHeight: 1.2 }}>
              Everything your school needs.<br />Nothing it doesn't.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 20, padding: 32,
                border: '1.5px solid #E2EFF9',
                boxShadow: '0 4px 24px rgba(30,58,95,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(30,58,95,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(30,58,95,0.06)'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 20, border: `1.5px solid ${f.color}30` }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 20, color: '#1E3A5F', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '100px 40px', background: 'linear-gradient(160deg, #E8F6FE 0%, #F5F3FF 100%)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 100, background: '#F3E5F5', color: '#7B1FA2', fontSize: 12, fontWeight: 700, marginBottom: 16, letterSpacing: 1 }}>HOW IT WORKS</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 42, color: '#1E3A5F', lineHeight: 1.2 }}>
              From gate to guardian<br />in under 60 seconds.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {HOW.map((h, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 20, padding: 28, border: '1.5px solid #E2EFF9', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 36 }}>{h.icon}</div>
                <div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: '#4FC3F7', letterSpacing: 2, marginBottom: 6 }}>{h.step}</div>
                  <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 18, color: '#1E3A5F', marginBottom: 8 }}>{h.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section style={{ padding: '100px 40px', background: '#F8FBFF' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 100, background: '#E8F5E9', color: '#2E7D32', fontSize: 12, fontWeight: 700, marginBottom: 16, letterSpacing: 1 }}>WHO USES EDUTRACK</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 42, color: '#1E3A5F', marginBottom: 48, lineHeight: 1.2 }}>Built for three roles.<br />Powerful for all.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { emoji: '⚙️', role: 'Administrator', color: '#4FC3F7', bg: '#E1F5FE', perks: ['Manage students & QR codes', 'Control user access', 'View school-wide data', 'Configure notifications'] },
              { emoji: '👨‍💼', role: 'Principal', color: '#CE93D8', bg: '#F3E5F5', perks: ['Live analytics dashboard', 'High-risk student alerts', 'Class performance trends', 'Export attendance reports'] },
              { emoji: '📱', role: 'QR Scan Operator', color: '#A8EDCB', bg: '#E8F5E9', perks: ['Mobile-optimised scanner', 'Instant arrival/departure log', 'Works offline briefly', 'Simple one-tap interface'] },
            ].map((r, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 20, padding: 28, border: `2px solid ${r.color}40`, boxShadow: '0 4px 20px rgba(30,58,95,0.06)' }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16, margin: '0 auto 16px' }}>{r.emoji}</div>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 20, color: '#1E3A5F', marginBottom: 16 }}>{r.role}</h3>
                <ul style={{ listStyle: 'none', textAlign: 'left' }}>
                  {r.perks.map((p, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: '#64748B' }}>
                      <span style={{ color: r.color, fontWeight: 800 }}>✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 40px', background: 'linear-gradient(135deg, #1E3A5F 0%, #0F2240 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,247,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,237,203,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 40, color: 'white', marginBottom: 16 }}>Ready to transform your school's attendance?</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', marginBottom: 36 }}>Join schools already using EduTrack to keep every student safe and every parent informed.</p>
          <button onClick={onEnterApp} style={{
            padding: '18px 44px', borderRadius: 16,
            background: 'linear-gradient(135deg, #4FC3F7, #A8EDCB)',
            color: '#1E3A5F', border: 'none', cursor: 'pointer',
            fontWeight: 900, fontSize: 18, fontFamily: "'Nunito', sans-serif",
            boxShadow: '0 8px 32px rgba(79,195,247,0.35)',
          }}>Get Started Today →</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0A1628', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #4FC3F7, #A8EDCB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏫</div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>EduTrack</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>© 2026 EduTrack. Smart School Attendance & Analytics.</p>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          <span>Built with React + Spring Boot</span>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Inter:wght@400;500;600&display=swap');
        @keyframes float {
          from { transform: translateY(0px) rotate(-3deg); }
          to { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
