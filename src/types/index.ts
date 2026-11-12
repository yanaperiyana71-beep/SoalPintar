export type NavTab =
  | 'dashboard'
  | 'ai-generator'
  | 'bank-soal'
  | 'google-forms'
  | 'token-siswa'
  | 'ujian-live'
  | 'nilai-siswa'
  | 'riwayat-pelanggaran'
  | 'download-aplikasi'
  | 'status-paket'
  | 'yang-baru'
  | 'perpanjang-paket'
  | 'panduan'
  | 'settings'
  | 'ujian-siswa';

export interface SubscriptionInfo {
  tierName: string;
  activeUntil: string; // e.g. "07 Sep 2027"
  daysRemaining: number;
  status: 'Active' | 'Expired' | 'Pending';
  features: string[];
}

export interface TransactionRecord {
  id: string;
  invoiceNumber: string;
  planName: string;
  date: string; // e.g. "07 Sep 2026, 00:16"
  amount: number;
  amountFormatted: string; // "Rp 103.880"
  status: 'DISETUJUI' | 'MENUNGGU' | 'DIBATALKAN';
  paymentMethod: string;
  pdfUrl?: string;
}

export interface QuestionItem {
  id: string;
  subject: string;
  grade: string;
  topic: string;
  difficulty: 'Mudah' | 'Sedang' | 'HOTS';
  question: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
  }[];
  correctKey: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  createdAt: string;
  batchId?: string;
}

export interface SoalBatch {
  id: string;
  topic: string;
  subject: string;
  level: string; // e.g. "SMP", "SMA", "SD"
  grade: string; // e.g. "SMP Kelas 9"
  questionCount: number;
  optionsCount: number;
  batchCode: string; // e.g. "Batch UKINIW07"
  createdAt: string; // e.g. "12 menit yang lalu"
  status: 'Terbit' | 'Draft';
  formUrl?: string;
  formId?: string;
  isRandomized?: boolean;
  variantName?: string;
  parentBatchId?: string;
  questions: QuestionItem[];
}

export interface ExamSession {
  id: string;
  title: string;
  token: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  startTime: string;
  endTime?: string;
  totalStudents: number;
  completedStudents: number;
}

export interface StudentProgress {
  id: string;
  name: string;
  nisn: string;
  classGroup: string;
  progressPercent: number;
  currentScore?: number;
  status: 'Sedang Mengerjakan' | 'Selesai' | 'Terdeteksi Melanggar' | 'Offline';
  violationsCount: number;
  lastActive: string;
}

export interface CheatingViolation {
  id: string;
  studentName: string;
  classGroup: string;
  examTitle: string;
  violationType: 'Pindah Tab / Browser' | 'Layar Terbelah (Split Screen)' | 'Upaya Salin Teks (Copy-Paste)' | 'Keluar dari Fullscreen' | 'Peringatan Pengawas (Intervensi Manual)';
  severity: 'Rendah' | 'Sedang' | 'Tinggi';
  timestamp: string;
  durationSeconds?: number;
}

export interface ExamTokenItem {
  id: string;
  token: string;
  label: string;
  quiz: string;
  formUrl?: string;
  violationLimit: number;
  status: 'Aktif' | 'Kedaluwarsa' | 'Nonaktif' | 'Dijeda';
  expiry: string;
  waitingRoom: boolean;
  createdAt: string;
}

export interface GoogleFormRecord {
  id: string;
  name: string;
  url: string;
  questionCount: number;
  status: 'Aktif' | 'Nonaktif' | 'Tersambung' | 'Draft';
  token?: string;
  tokenActive?: boolean;
  tokenActivatedAt?: string;
  expiresAt?: string; // ISO string for real-time countdown timer
  durationMinutes?: number;
  targetClass?: string;
  editUrl?: string;
  createdAt: string;
}

