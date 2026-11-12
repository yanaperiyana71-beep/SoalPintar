import { SubscriptionInfo, TransactionRecord, QuestionItem, ExamSession, StudentProgress, CheatingViolation, SoalBatch } from '../types';

export const initialSubscription: SubscriptionInfo = {
  tierName: 'Paket Basic',
  activeUntil: '07 Sep 2027',
  daysRemaining: 318,
  status: 'Active',
  features: [
    'Unlimited AI Soal Generator (HOTS & Standar)',
    'Penyimpanan Bank Soal hingga 10.000 Soal',
    'Ujian Live Real-time hingga 100 Siswa/sesi',
    'Anti-Cheat Proctoring (Deteksi Tab & Split Screen)',
    'Ekspor Langsung ke Google Forms & Microsoft Word',
    'Analisis Butir Soal & Rekap Nilai Otomatis'
  ]
};

export const initialTransactions: TransactionRecord[] = [];

export const initialQuestions: QuestionItem[] = [];

export const initialExamSession: ExamSession = {
  id: 'ses-default',
  title: 'Belum Ada Ujian Aktif',
  token: '—',
  subject: '—',
  grade: '—',
  durationMinutes: 90,
  totalQuestions: 0,
  isActive: false,
  startTime: '—',
  totalStudents: 0,
  completedStudents: 0
};

export const initialStudents: StudentProgress[] = [];

export const initialViolations: CheatingViolation[] = [];

export const availablePackages = [
  {
    id: 'pkg-basic',
    name: 'Paket Basic',
    badge: 'Paling Populer',
    price: 103880,
    priceFormatted: 'Rp 103.880',
    period: '/ tahun',
    durationDays: 365,
    description: 'Cocok untuk guru mandiri yang ingin kemudahan membuat soal dan ujian online anti-curang.',
    features: [
      'Akses Unlimited AI Generator',
      'Bank Soal hingga 10.000 butir',
      'Ujian Live s.d. 100 siswa per sesi',
      'Deteksi Anti-Cheat (Tab & Window)',
      'Ekspor Google Forms & Word',
      'Masa aktif 1 Tahun penuh'
    ],
    recommended: true
  },
  {
    id: 'pkg-pro',
    name: 'Paket Pro Guru',
    badge: 'Super Lengkap',
    price: 189000,
    priceFormatted: 'Rp 189.000',
    period: '/ tahun',
    durationDays: 365,
    description: 'Untuk guru berdedikasi tinggi dengan fitur analisis butir soal mendalam & kisi-kisi Kurikulum Merdeka.',
    features: [
      'Semua fitur Paket Basic',
      'Ujian Live s.d. 250 siswa per sesi',
      'Generator Kisi-kisi & Rubrik Penilaian',
      'Dukungan Soal Gambar & LaTeX Formula',
      'Koreksi Otomatis Soal Uraian / Essay AI',
      'Prioritas Dukungan Teknis WhatsApp 24/7'
    ],
    recommended: false
  },
  {
    id: 'pkg-school',
    name: 'Paket Lisensi Sekolah',
    badge: 'Institusi',
    price: 649000,
    priceFormatted: 'Rp 649.000',
    period: '/ tahun',
    durationDays: 365,
    description: 'Solusi lengkap satu sekolah untuk seluruh dewan guru dan ribuan siswa sekaligus.',
    features: [
      'Akses hingga 25 Akun Guru',
      'Siswa tanpa batas (Unlimited)',
      'Server Ujian Khusus Prioritas Tinggi',
      'Domain & Logo Sekolah Sendiri',
      'Pelatihan Guru & Workshop Daring',
      'Laporan Hasil Belajar Berstandar Kemdikbud'
    ],
    recommended: false
  }
];

export const initialBatches: SoalBatch[] = [];


