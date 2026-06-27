// ─────────────────────────────────────────────
// api.ts  —  Central API helper for EduTrack
// ─────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const TOKEN_KEY = 'edutrack_jwt';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// FIX: Robust error extraction.
// Spring Security 401s arrive BEFORE GlobalExceptionHandler fires, so the body
// may be plain-text or HTML (not JSON). We attempt JSON first and fall back
// gracefully so we never show the useless raw "[object Object]" or "Request failed".
async function extractErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const json = JSON.parse(text);
    // Spring ProblemDetail uses "detail"; some APIs use "message" or "error"
    return json.detail || json.message || json.error || `HTTP ${res.status}`;
  } catch {
    if (res.status === 401) return 'Invalid email or password';
    if (res.status === 403) return 'Access denied';
    return text.trim() || `HTTP ${res.status}`;
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const message = await extractErrorMessage(res);
    throw new Error(message);
  }

  if (res.status === 204) return undefined as unknown as T;

  return res.json();
}

// ─── Auth ──────────────────────────────────────
export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ─── Analytics ─────────────────────────────────
export interface SummaryData {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  attendancePct: number;
  date: string;
}

export async function apiGetSummary(): Promise<SummaryData> {
  return request<SummaryData>('/analytics/summary');
}

export interface TrendDay {
  date: string;
  present: number;
  late: number;
  absent: number;
  pct: number;
}

export async function apiGetTrend(days = 10): Promise<TrendDay[]> {
  return request<TrendDay[]>(`/analytics/trend?days=${days}`);
}

export interface ClassStat {
  grade: string;
  pct: number;
}

export async function apiGetClassComparison(): Promise<ClassStat[]> {
  return request<ClassStat[]>('/analytics/class-comparison');
}

export interface HighRiskStudent {
  studentId: string;
  name: string;
  grade: string;
  absences: number;
  attendancePct: number;
  parentEmail: string;
}

export async function apiGetHighRisk(since: string): Promise<HighRiskStudent[]> {
  return request<HighRiskStudent[]>(`/analytics/high-risk?since=${since}`);
}

// ─── Attendance ────────────────────────────────
export interface ScanResult {
  message: string;
  student: string;
  status: string;
  time: string;
}

export async function apiScan(qrCode: string, scanType: 'ARRIVAL' | 'DEPARTURE'): Promise<ScanResult> {
  return request<ScanResult>('/attendance/scan', {
    method: 'POST',
    body: JSON.stringify({ qrCode, scanType }),
  });
}

export interface AttendanceRecord {
  id: number;
  student: { fullName: string; grade: string; studentId: string };
  attendanceDate: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  arrivalTime?: string;
  departureTime?: string;
}

export async function apiGetToday(): Promise<AttendanceRecord[]> {
  return request<AttendanceRecord[]>('/attendance/today');
}

// ─── Students ──────────────────────────────────
export interface StudentRecord {
  id: number;
  studentId: string;
  fullName: string;
  grade: string;
  parentEmail: string;
  parentPhone?: string;
  qrCode: string;
  qrImageBase64?: string;
  active: boolean;
  attendancePct?: number;
}

export async function apiGetStudents(): Promise<StudentRecord[]> {
  return request<StudentRecord[]>('/students');
}

export async function apiCreateStudent(data: Partial<StudentRecord>): Promise<StudentRecord> {
  return request<StudentRecord>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateStudent(id: number, data: Partial<StudentRecord>): Promise<StudentRecord> {
  return request<StudentRecord>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteStudent(id: number): Promise<void> {
  return request<void>(`/students/${id}`, { method: 'DELETE' });
}

export async function apiRegenerateQr(id: number): Promise<StudentRecord> {
  return request<StudentRecord>(`/students/${id}/regenerate-qr`, { method: 'POST' });
}

// ─── Student Profile (analytics) ──────────────────────────────────────────
export async function apiGetStudentProfile(
  studentId: number,
  fromDate: string,
  toDate: string
): Promise<any> {
  return request(`/analytics/student/${studentId}?fromDate=${fromDate}&toDate=${toDate}`);
}
