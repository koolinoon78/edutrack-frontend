import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiScan, apiGetSummary, SummaryData } from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// QRScanner.tsx
//
// BUG FIX #2: The original "simulateScan" never called the backend. This page
// now uses the html5-qrcode library to read a real camera QR code and calls
// POST /api/attendance/scan with the result.
//
// BUG FIX #3: Stats (scanned, pending, departed) were hardcoded. They now
// load from GET /api/analytics/summary on mount and after each scan.
// ─────────────────────────────────────────────────────────────────────────────

type ScanMode = 'arrival' | 'departure';

interface ScanFeedback {
  studentName: string;
  status: string;
  time: string;
  success: boolean;
}

export default function QRScanner() {
  const [mode, setMode]           = useState<ScanMode>('arrival');
  const [scanning, setScanning]   = useState(false);
  const [feedback, setFeedback]   = useState<ScanFeedback | null>(null);
  const [error, setError]         = useState('');
  const [manualInput, setManualInput] = useState('');
  const [stats, setStats]         = useState<SummaryData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Load real stats from the backend
  const loadStats = useCallback(async () => {
    try {
      const data = await apiGetSummary();
      setStats(data);
    } catch {
      // Stats not critical — fail silently
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Core scan handler — called with a QR code string from camera or manual entry
  const handleScan = useCallback(async (qrCode: string) => {
    if (!qrCode.trim()) return;
    setScanning(true);
    setError('');
    setFeedback(null);

    try {
      const result = await apiScan(qrCode.trim(), mode === 'arrival' ? 'ARRIVAL' : 'DEPARTURE');
      setFeedback({
        studentName: result.student,
        status:      result.status,
        time:        new Date(result.time).toLocaleTimeString(),
        success:     true,
      });
      // Refresh stats after a successful scan
      loadStats();
    } catch (err: any) {
      setError(err.message || 'Scan failed. Please try again.');
      setFeedback({ studentName: '', status: '', time: '', success: false });
    } finally {
      setScanning(false);
      // Auto-clear feedback after 4 seconds
      setTimeout(() => setFeedback(null), 4000);
    }
  }, [mode, loadStats]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
      setManualInput('');
    }
  };

  // Derive display stats from the summary API
  const scannedToday  = stats ? stats.presentToday + stats.lateToday : 0;
  const absentToday   = stats ? stats.absentToday : 0;
  const totalStudents = stats ? stats.totalStudents : 0;

  return (
    <div className="page-inner">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left: Scanner */}
        <div>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {(['arrival', 'departure'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '10px 24px', fontSize: 14,
                  background: mode === m ? 'linear-gradient(135deg, #4FC3F7, #0288D1)' : 'white',
                  color: mode === m ? 'white' : 'var(--text-muted)',
                  border: '2px solid', borderColor: mode === m ? '#4FC3F7' : 'var(--border)',
                  borderRadius: 12, cursor: 'pointer', fontWeight: 700,
                  fontFamily: 'Nunito', transition: 'all 0.2s',
                  boxShadow: mode === m ? '0 4px 16px rgba(79,195,247,0.3)' : 'none',
                }}
              >
                {m === 'arrival' ? '🌅 Arrival' : '🌙 Departure'}
              </button>
            ))}
          </div>

          {/* Scanner Box */}
          <CameraScanner
            scanning={scanning}
            feedback={feedback}
            onScan={handleScan}
          />

          {/* Error */}
          {error && (
            <div style={{ background: '#FFEBEE', border: '1.5px solid #FF8A80', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#C62828', fontWeight: 600, fontFamily: 'Nunito', marginTop: 12 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Stats row — BUG FIX #3: real numbers from API */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
            {[
              { label: 'Scanned Today', val: loadingStats ? '…' : String(scannedToday), color: '#4FC3F7' },
              { label: 'Absent',        val: loadingStats ? '…' : String(absentToday),  color: '#FF8A80' },
              { label: 'Total Students',val: loadingStats ? '…' : String(totalStudents), color: '#A8EDCB' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1.5px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Nunito', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Manual entry */}
        <div>
          <div className="chart-card">
            <h3 style={{ marginBottom: 6, fontSize: 16 }}>🖊️ Manual Entry</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Type or paste a student QR token</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="form-input"
                placeholder="QR token (e.g. A3F91C7B…)"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                style={{ flex: 1 }}
              />
              <button
                onClick={handleManualSubmit}
                disabled={scanning || !manualInput.trim()}
                style={{
                  padding: '10px 18px', borderRadius: 12, fontWeight: 700,
                  fontFamily: 'Nunito', fontSize: 13, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #4FC3F7, #0288D1)', color: 'white',
                  border: 'none', whiteSpace: 'nowrap',
                  opacity: scanning || !manualInput.trim() ? 0.6 : 1,
                }}
              >
                Record
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="chart-card" style={{ marginTop: 18 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>📖 How to Scan</h3>
            {[
              { icon: '📱', text: 'Click "Start Camera" in the scanner box above' },
              { icon: '🎫', text: 'Hold the student\'s QR card up to the camera' },
              { icon: '✅', text: 'Green screen confirms attendance is recorded' },
              { icon: '🔄', text: 'Scanner auto-resets for the next student' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{step.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.text}</span>
              </div>
            ))}
          </div>

          {/* Today's summary */}
          {stats && (
            <div className="chart-card" style={{ marginTop: 18, background: 'linear-gradient(135deg, #1E3A5F, #0F2240)' }}>
              <h3 style={{ marginBottom: 12, fontSize: 15, color: 'white' }}>📊 Today's Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Present', val: stats.presentToday, color: '#A8EDCB' },
                  { label: 'Late',    val: stats.lateToday,    color: '#FFD54F' },
                  { label: 'Absent',  val: stats.absentToday,  color: '#FF8A80' },
                  { label: 'Rate',    val: `${stats.attendancePct}%`, color: '#4FC3F7' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Nunito', color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Camera Scanner Component ─────────────────────────────────────────────────
// Uses the browser's built-in BarcodeDetector API where available,
// with a fallback to manual entry for unsupported browsers.

interface CameraScannerProps {
  scanning: boolean;
  feedback: ScanFeedback | null;
  onScan: (qrCode: string) => void;
}

function CameraScanner({ scanning, feedback, onScan }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError]   = useState('');
  const [detecting, setDetecting]       = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setDetecting(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Use BarcodeDetector if available (Chrome 88+, Edge 88+)
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      if (BarcodeDetectorClass) {
        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
        setDetecting(true);
        intervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              // Extract token from full URL if needed: https://app.../scan/{token}
              const token = code.includes('/scan/') ? code.split('/scan/').pop()! : code;
              stopCamera();
              onScan(token);
            }
          } catch {
            // Detection frame error — continue
          }
        }, 300);
      } else {
        // BarcodeDetector not supported — show instructions to use manual entry
        setCameraError('Camera is live. Your browser does not support automatic QR detection. Use Manual Entry below to type the QR token instead.');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, or use Manual Entry.');
      } else {
        setCameraError('Could not start camera. Use Manual Entry below.');
      }
    }
  }, [onScan, stopCamera]);

  // Clean up on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="qr-scanner-box"
        style={{ cursor: cameraActive ? 'default' : 'pointer', width: '100%', height: 280 }}
        onClick={!cameraActive && !scanning ? startCamera : undefined}
      >
        <div className="qr-scanner-corner tl" />
        <div className="qr-scanner-corner tr" />
        <div className="qr-scanner-corner bl" />
        <div className="qr-scanner-corner br" />

        {/* Camera video feed */}
        <video
          ref={videoRef}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', borderRadius: 24,
            display: cameraActive ? 'block' : 'none',
          }}
          playsInline
          muted
        />

        {detecting && <div className="scan-line" />}

        {/* Idle state */}
        {!cameraActive && !scanning && !feedback && (
          <>
            <div className="qr-icon-center" style={{ opacity: 0.35 }}>📱</div>
            <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Nunito', fontWeight: 700 }}>
              Tap to start camera
            </div>
          </>
        )}

        {/* Processing overlay */}
        {scanning && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,34,64,0.85)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ fontSize: 40 }}>⏳</div>
            <p style={{ color: '#4FC3F7', fontFamily: 'Nunito', fontWeight: 700, fontSize: 15 }}>Recording attendance…</p>
          </div>
        )}

        {/* Success overlay */}
        {feedback && feedback.success && !scanning && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(168,237,203,0.97)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: 'Nunito', fontSize: 20, color: '#1B5E20' }}>Recorded!</h3>
            <p style={{ fontSize: 15, color: '#2E7D32', marginTop: 4, fontFamily: 'Nunito', fontWeight: 700 }}>{feedback.studentName}</p>
            <p style={{ fontSize: 13, color: '#388E3C', marginTop: 4 }}>{feedback.status} · {feedback.time}</p>
          </div>
        )}

        {/* Stop button when camera is active */}
        {cameraActive && (
          <button
            onClick={stopCamera}
            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Nunito', fontWeight: 700 }}
          >
            ✕ Stop
          </button>
        )}
      </div>

      {cameraError && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: '#FFF9C4', borderRadius: 10, fontSize: 12, color: '#F57F17', fontWeight: 600, fontFamily: 'Nunito' }}>
          ⚠️ {cameraError}
        </div>
      )}
    </div>
  );
}
