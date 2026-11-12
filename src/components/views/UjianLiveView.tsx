import React, { useState, useEffect } from 'react';
import {
  Radio,
  Users,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Play,
  Pause,
  RefreshCw,
  Copy,
  Check,
  Send,
  AlertTriangle,
  QrCode,
  ArrowLeft,
  ExternalLink,
  Maximize2,
  Minimize2,
  X,
  UserCheck,
  UserPlus,
  Trash2,
  Search,
  RotateCcw,
  ShieldCheck,
  Eye,
  Globe
} from 'lucide-react';
import { ExamSession, StudentProgress, CheatingViolation, NavTab, ExamTokenItem, GoogleFormRecord } from '../../types';
import confetti from 'canvas-confetti';
import { liveExamService, LiveStudentData } from '../../services/liveExamService';

type LiveStudentRow = LiveStudentData;

interface UjianLiveViewProps {
  examSession: ExamSession;
  students: StudentProgress[];
  violations: CheatingViolation[];
  isDarkMode: boolean;
  googleForms?: GoogleFormRecord[];
  onSimulateEvent: () => void;
  onSendWarning: (studentId: string) => void;
  onForceSubmit: (studentId: string) => void;
  onNavigate?: (tab: NavTab) => void;
  onMonitoringTokenChange?: (token: ExamTokenItem | null) => void;
}

export const UjianLiveView: React.FC<UjianLiveViewProps> = ({
  examSession,
  students,
  violations,
  isDarkMode,
  googleForms = [],
  onSimulateEvent,
  onSendWarning,
  onForceSubmit,
  onNavigate,
  onMonitoringTokenChange
}) => {
  // Load token list from localStorage or fallback to screenshot exact token
  const [tokenList, setTokenList] = useState<ExamTokenItem[]>(() => {
    try {
      const saved = localStorage.getItem('soalpintar_token_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse token list for Ujian Live:', e);
    }
    return [
      {
        id: 'tok-zjt0p4m',
        token: 'ZJT0P4M',
        label: 'Kelas 9B - Segitiga (SMP)',
        quiz: 'Segitiga (SMP)',
        formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScL2dlWq2uZqoU8208FMWa224h1uXqhkX7NP1hvUqG1iR3L_A/viewform?token=ZJT0P4M&soal=Segitiga',
        violationLimit: 1,
        status: 'Aktif',
        expiry: 'tanpa batas waktu',
        waitingRoom: false,
        createdAt: 'Hari ini'
      }
    ];
  });

  // Selected exam for Monitoring (syncs with active Google Form or chosen live token)
  const [monitoringToken, setMonitoringToken] = useState<ExamTokenItem | null>(() => {
    // 1. Check if user selected a token from Distribusi Google Form
    const selectedCode = typeof window !== 'undefined' ? localStorage.getItem('soalpintar_selected_live_token') : null;
    if (selectedCode) {
      const found = tokenList.find((t) => t.token.toUpperCase() === selectedCode.toUpperCase());
      if (found) return found;
    }

    // 2. Check if there is an active Google Form with a token
    const activeForm = googleForms.find((f) => f.status === 'Aktif' && f.token);
    if (activeForm && activeForm.token) {
      const found = tokenList.find((t) => t.token.toUpperCase() === activeForm.token!.toUpperCase());
      if (found) return found;
      return {
        id: `tok-${activeForm.id}`,
        token: activeForm.token,
        label: activeForm.targetClass ? `${activeForm.targetClass} - ${activeForm.name}` : activeForm.name,
        quiz: activeForm.name,
        formUrl: activeForm.url,
        violationLimit: 1,
        status: 'Aktif',
        expiry: activeForm.expiresAt ? new Date(activeForm.expiresAt).toLocaleDateString('id-ID') : 'tanpa batas waktu',
        waitingRoom: false,
        createdAt: activeForm.createdAt || 'Hari ini'
      };
    }

    return tokenList[0] || {
      id: 'tok-zjt0p4m',
      token: 'ZJT0P4M',
      label: 'Kelas 9B - Segitiga (SMP)',
      quiz: 'Segitiga (SMP)',
      formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScL2dlWq2uZqoU8208FMWa224h1uXqhkX7NP1hvUqG1iR3L_A/viewform?token=ZJT0P4M&soal=Segitiga',
      violationLimit: 1,
      status: 'Aktif',
      expiry: 'tanpa batas waktu',
      waitingRoom: false,
      createdAt: 'Hari ini'
    };
  });

  // Sync monitoring token with parent header
  useEffect(() => {
    if (onMonitoringTokenChange) {
      onMonitoringTokenChange(monitoringToken);
    }
  }, [monitoringToken, onMonitoringTokenChange]);

  // Live students table data - managed via liveExamService
  const [liveStudents, setLiveStudents] = useState<LiveStudentRow[]>(() => liveExamService.getStudents());

  // Real-time synchronization: subscribe to liveExamService, BroadcastChannel, and periodic server polling
  useEffect(() => {
    // 1. Subscribe to liveExamService listener (catches local, BroadcastChannel, and server updates)
    const unsubscribe = liveExamService.subscribe((students) => {
      setLiveStudents(students);
    });

    // 2. Sync token list from storage & sync active Google Form
    const syncTokens = () => {
      try {
        const savedTokens = localStorage.getItem('soalpintar_token_list');
        let currentTokens: ExamTokenItem[] = [];
        if (savedTokens) {
          const parsedTokens: ExamTokenItem[] = JSON.parse(savedTokens);
          if (Array.isArray(parsedTokens) && parsedTokens.length > 0) {
            currentTokens = parsedTokens;
            setTokenList(parsedTokens);
          }
        }

        // Check if an explicit active token was set
        const selectedCode = localStorage.getItem('soalpintar_selected_live_token');
        if (selectedCode) {
          const found = currentTokens.find((t) => t.token.toUpperCase() === selectedCode.toUpperCase());
          if (found) {
            setMonitoringToken(found);
            return;
          }
        }

        // Or sync with latest active Google Form
        const savedForms = localStorage.getItem('soalpintar_google_forms');
        if (savedForms) {
          const forms: GoogleFormRecord[] = JSON.parse(savedForms);
          if (Array.isArray(forms)) {
            const activeF = forms.find((f) => f.status === 'Aktif' && f.token);
            if (activeF && activeF.token) {
              const matchedTok = currentTokens.find((t) => t.token.toUpperCase() === activeF.token!.toUpperCase());
              if (matchedTok) {
                setMonitoringToken(matchedTok);
                return;
              }
            }
          }
        }

        if (monitoringToken) {
          const updatedMon = currentTokens.find((t) => t.token === monitoringToken.token);
          if (updatedMon) setMonitoringToken(updatedMon);
        }
      } catch (e) {
        console.warn('Failed to sync tokens in UjianLiveView:', e);
      }
    };

    syncTokens();
    window.addEventListener('storage', syncTokens);
    window.addEventListener('soalpintar_tokens_updated', syncTokens);
    window.addEventListener('soalpintar_selected_live_token_changed', syncTokens);

    // 3. Fast server poll every 1.5 seconds so students on any tab/device reflect immediately
    const pollTimer = setInterval(() => {
      liveExamService.syncFromServer();
    }, 1500);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', syncTokens);
      window.removeEventListener('soalpintar_tokens_updated', syncTokens);
      window.removeEventListener('soalpintar_selected_live_token_changed', syncTokens);
      clearInterval(pollTimer);
    };
  }, [monitoringToken?.token]);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Mengerjakan' | 'Diblokir' | 'Terputus' | 'Selesai'>('all');

  // Modal: Input Peserta Ujian Manual
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualStudentClass, setManualStudentClass] = useState('9B');
  const [manualStudentAbsen, setManualStudentAbsen] = useState('01');
  const [manualStudentStatus, setManualStudentStatus] = useState<'Mengerjakan' | 'Terputus' | 'Selesai' | 'Diblokir'>('Mengerjakan');

  // Real-time ticking time clock matching screenshot "Diperbarui 23.24.48"
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}.${String(d.getSeconds()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setLastUpdatedTime(
        `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}.${String(d.getSeconds()).padStart(2, '0')}`
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Modals state
  const [qrModalToken, setQrModalToken] = useState<ExamTokenItem | null>(null);
  const [isFullscreenQr, setIsFullscreenQr] = useState(false);
  const [showViolationsModal, setShowViolationsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metric counts
  const countMengerjakan = liveStudents.filter((s) => s.status === 'Mengerjakan').length;
  const countDiblokir = liveStudents.filter((s) => s.status === 'Diblokir').length;
  const countTerputus = liveStudents.filter((s) => s.status === 'Terputus').length;
  const countSelesai = liveStudents.filter((s) => s.status === 'Selesai').length;

  // Total active students count for general banner
  const totalActiveStudents = countMengerjakan;

  // Action: Izinkan Ulang (Allow retry)
  const handleIzinkanUlang = async (studentId: string, studentName: string) => {
    await liveExamService.allowRetry(studentId);
    showToast(`Siswa "${studentName}" diizinkan untuk mengulang ujian! 🔄`);
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch {
      // fallback
    }
  };

  // Action: Delete student from list
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    await liveExamService.deleteStudent(studentId);
    showToast(`Data peserta "${studentName}" berhasil dihapus.`);
  };

  // Action: Clear all simulation data & wipe database cleanly
  const handleClearSimulationData = async () => {
    await liveExamService.clearAll();
    showToast('Database simulasi berhasil dihapus dan dibersihkan! 🗑️');
  };

  // Action: Save manually inputted participant
  const handleSaveManualStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = manualStudentName.trim();
    if (!cleanName) {
      showToast('Harap masukkan nama lengkap peserta!');
      return;
    }

    const cleanClass = manualStudentClass.trim() || '9B';
    const cleanAbsen = manualStudentAbsen.trim() || '1';

    await liveExamService.registerStudent({
      name: cleanName,
      studentClass: cleanClass,
      studentAbsen: cleanAbsen,
      token: monitoringToken?.token || 'ZJT0P4M',
      quiz: monitoringToken?.quiz || 'IPA'
    });

    setShowAddStudentModal(false);
    setManualStudentName('');
    showToast(`Peserta "${cleanName}" (${cleanClass} - Absen ${cleanAbsen}) berhasil dimasukkan ke Ujian Live! ✅`);

    try {
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    } catch {
      // fallback
    }
  };

  const getStudentWebUrl = (token: string, quizName?: string) => {
    if (typeof window !== 'undefined') {
      const matchedForm = googleForms.find(
        (f) => (f.token && f.token.toUpperCase() === token.toUpperCase()) || (quizName && f.name.toLowerCase() === quizName.toLowerCase())
      );
      const fId = matchedForm?.id;
      const soalParam = encodeURIComponent(quizName || matchedForm?.name || '');
      return `${window.location.origin}${window.location.pathname}?token=${token}${fId ? `&formId=${fId}` : ''}${soalParam ? `&soal=${soalParam}` : ''}`;
    }
    return `https://soalpintar.ai/?token=${token}`;
  };

  const handleCopyStudentUrl = (token: string, quizName?: string) => {
    const url = getStudentWebUrl(token, quizName);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast(`Tautan Soal "${quizName || monitoringToken?.quiz || 'Ujian'}" (Token: ${token}) disalin! 📋`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyTokenCode = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    showToast(`Kode token ${token} disalin ke clipboard! 📋`);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSelectActiveExam = (tokenCode: string) => {
    const found = tokenList.find((t) => t.token.toUpperCase() === tokenCode.toUpperCase());
    if (found) {
      setMonitoringToken(found);
      try {
        localStorage.setItem('soalpintar_selected_live_token', found.token);
        localStorage.setItem('soalpintar_active_exam', JSON.stringify({
          token: found.token,
          name: found.quiz,
          url: found.formUrl
        }));
        window.dispatchEvent(new Event('soalpintar_selected_live_token_changed'));
        window.dispatchEvent(new Event('soalpintar_tokens_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch {}
      showToast(`Beralih pantauan ke soal: ${found.quiz} (Token: ${found.token})`);
    }
  };

  // Filter students based on search and status
  const filteredStudents = liveStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.classInfo.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return student.status === statusFilter;
  });

  // ==========================================
  // VIEW 1: PANTAU SCREENSHOT EXACT VIEW
  // ==========================================
  if (monitoringToken) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto animate-fadeIn">
        {/* Sub-header Navigation Bar Matching Screenshot */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Left: ← Semua token + Soal Ujian Aktif Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setMonitoringToken(null)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs font-medium w-fit group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Semua token</span>
            </button>

            {/* Google Form Switcher Dropdown */}
            {tokenList.length > 0 && (
              <div className="flex items-center gap-2 bg-[#0c1424] border border-[#1e2a42] rounded-xl px-3 py-1.5 shadow-sm">
                <span className="text-[11px] text-slate-400 font-semibold">Soal Ujian:</span>
                <select
                  value={monitoringToken.token}
                  onChange={(e) => handleSelectActiveExam(e.target.value)}
                  className="bg-transparent text-indigo-300 font-bold text-xs outline-none cursor-pointer hover:text-white"
                >
                  {tokenList.map((tok) => (
                    <option key={tok.id} value={tok.token} className="bg-[#0b1220] text-white">
                      {tok.quiz} (Token: {tok.token})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Diperbarui + [Salin Tautan Soal] + [Buka Soal Siswa] + Layar QR + Pelanggaran */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Real-time Indicator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Diperbarui {lastUpdatedTime}</span>
            </div>

            {/* Prominent Salin Tautan Soal Button */}
            <button
              onClick={() => handleCopyStudentUrl(monitoringToken.token, monitoringToken.quiz)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 active:scale-95"
              title={`Salin tautan soal web siswa untuk ${monitoringToken.quiz} (Token: ${monitoringToken.token})`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Salin Tautan Soal</span>
            </button>

            {/* Buka Soal Siswa Button */}
            <a
              href={getStudentWebUrl(monitoringToken.token)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#1a2238] hover:bg-[#253050] text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all no-underline shadow-sm"
              title="Buka portal ujian siswa di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Buka Soal Siswa</span>
            </a>

            {/* Layar QR Button */}
            <button
              onClick={() => setQrModalToken(monitoringToken)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1a2238] hover:bg-[#253050] text-slate-200 border border-[#273456] flex items-center gap-1.5 transition-all shadow-sm"
              title="Tampilkan layar proyektor kelas"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Layar QR</span>
            </button>

            {/* Pelanggaran Button */}
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('riwayat-pelanggaran');
                } else {
                  setShowViolationsModal(true);
                }
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1a2238] hover:bg-[#253050] text-slate-200 border border-[#273456] flex items-center gap-1.5 transition-all shadow-sm"
              title="Lihat riwayat catatan pelanggaran"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Pelanggaran</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metric Cards Matching Screenshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1. Mengerjakan */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Mengerjakan' ? 'all' : 'Mengerjakan')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'Mengerjakan'
                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-[#0c1424] border-[#172235] hover:border-slate-600/50'
            }`}
          >
            <span className="text-xs text-slate-400 font-medium">Mengerjakan</span>
            <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">
              {countMengerjakan}
            </div>
          </div>

          {/* 2. Diblokir */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Diblokir' ? 'all' : 'Diblokir')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'Diblokir'
                ? 'bg-rose-950/30 border-rose-500/50 shadow-md shadow-rose-500/10'
                : 'bg-[#0c1424] border-[#172235] hover:border-slate-600/50'
            }`}
          >
            <span className="text-xs text-slate-400 font-medium">Diblokir</span>
            <div className="text-3xl font-bold font-mono text-rose-400 mt-2">
              {countDiblokir}
            </div>
          </div>

          {/* 3. Terputus */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Terputus' ? 'all' : 'Terputus')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'Terputus'
                ? 'bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-500/10'
                : 'bg-[#0c1424] border-[#172235] hover:border-slate-600/50'
            }`}
          >
            <span className="text-xs text-slate-400 font-medium">Terputus</span>
            <div className="text-3xl font-bold font-mono text-amber-400 mt-2">
              {countTerputus}
            </div>
          </div>

          {/* 4. Selesai */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Selesai' ? 'all' : 'Selesai')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'Selesai'
                ? 'bg-sky-950/30 border-sky-500/50 shadow-md shadow-sky-500/10'
                : 'bg-[#0c1424] border-[#172235] hover:border-slate-600/50'
            }`}
          >
            <span className="text-xs text-slate-400 font-medium">Selesai</span>
            <div className="text-3xl font-bold font-mono text-sky-400 mt-2">
              {countSelesai}
            </div>
          </div>
        </div>

        {/* Main Card with Search Bar & Students Table Matching Screenshot */}
        <div className="rounded-2xl border bg-[#080f1d] border-[#172235] p-5 shadow-xl space-y-5">
          {/* Search Bar & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / kelas..."
                className="w-full bg-[#0c1424] border border-[#1e2a42] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  statusFilter === 'all' && searchQuery === ''
                    ? 'bg-[#162035] text-white border-[#223150]'
                    : 'bg-[#0c1424] text-slate-400 border-[#1e2a42] hover:text-white'
                }`}
              >
                Tampilkan semua
              </button>

              {/* Direct Input Peserta Ujian Button */}
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 active:scale-95"
                title="Input peserta ujian langsung ke Ujian Live"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Input Peserta Ujian</span>
              </button>

              {/* Buka Portal Web Siswa Button - Buka Ke Halaman / Tab Baru */}
              <a
                href={getStudentWebUrl(monitoringToken.token)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  showToast(`Membuka Portal Ujian Siswa (${monitoringToken.token}) di halaman baru... 🌐`);
                }}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#172338] hover:bg-[#203150] text-sky-300 border border-[#273a5e] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer no-underline"
                title="Buka Portal Ujian Siswa di halaman baru untuk input Nama Lengkap, Kelas, dan Absen"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Buka Portal Siswa (Web)</span>
                <ExternalLink className="w-3 h-3 text-sky-400 opacity-80" />
              </a>

              {/* Coba di Sini (Buka langsung di panel tanpa tab baru) */}
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('ujian-siswa')}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#11192e] hover:bg-[#192543] text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="Buka dan uji coba Portal Web Siswa langsung di tampilan ini"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Coba di Sini</span>
                </button>
              )}

              {/* Hapus Data Simulasi Button */}
              {liveStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSimulationData}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="Hapus seluruh data simulasi dan bersihkan tabel peserta"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Hapus Data Simulasi</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-3">SISWA & KELAS</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">PELANGGARAN</th>
                  <th className="py-3 px-4">PENYEBAB TERAKHIR</th>
                  <th className="py-3 px-4">TERAKHIR TERLIHAT</th>
                  <th className="py-3 px-2 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-slate-400 text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-sm text-slate-300">Belum ada peserta ujian aktif</div>
                        <div className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                          Data simulasi telah dibersihkan. Siswa yang mengisikan Nama Lengkap, Kelas, dan Absen di Portal Web Siswa atau melalui tombol "Input Peserta Ujian" akan langsung tampil di sini secara real-time.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-[#0c1527]/50 transition-colors">
                      {/* SISWA */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span>{student.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#111e35] text-sky-300 border border-[#1e335a]">
                            Kelas: {student.classGroup || (student.classInfo ? student.classInfo.split('·')[0].trim() : '9B')}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0d2a1f] text-emerald-300 border border-[#1b4b38]">
                            Absen: {student.absen || (student.classInfo?.includes('absen') ? student.classInfo.split('absen')[1].trim() : '1')}
                          </span>
                          {student.joinedAt && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Masuk: {student.joinedAt}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-4">
                        {student.status === 'Terputus' ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#332200] text-amber-400 border border-amber-600/30">
                            Terputus
                          </span>
                        ) : student.status === 'Selesai' ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#0e2448] text-sky-400 border border-sky-600/30">
                            Selesai
                          </span>
                        ) : student.status === 'Diblokir' ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#381018] text-rose-400 border border-rose-600/30">
                            Diblokir
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#062c21] text-emerald-400 border border-emerald-600/30 animate-pulse">
                            Mengerjakan
                          </span>
                        )}
                      </td>

                      {/* PELANGGARAN */}
                      <td className="py-4 px-4 font-mono text-slate-300 font-medium">
                        {student.violationsCount}
                      </td>

                      {/* PENYEBAB TERAKHIR */}
                      <td className="py-4 px-4 text-slate-400">
                        {student.lastCause}
                      </td>

                      {/* TERAKHIR TERLIHAT */}
                      <td className="py-4 px-4 text-slate-400">
                        {student.lastSeen}
                      </td>

                      {/* AKSI */}
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {student.status === 'Selesai' || student.status === 'Terputus' || student.status === 'Diblokir' ? (
                            <button
                              onClick={() => handleIzinkanUlang(student.id, student.name)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#152345] hover:bg-[#1c3060] text-indigo-300 border border-[#213565] transition-all active:scale-95 shadow-sm"
                              title="Izinkan siswa untuk mengulang pengerjaan ujian"
                            >
                              Izinkan ulang
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onSendWarning(student.id);
                                showToast(`Peringatan dikirimkan ke layar ${student.name}!`);
                              }}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                            >
                              Peringatan
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus peserta dari daftar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Input Peserta Ujian Langsung */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl border border-[#1e2a42] bg-[#0b1220] p-6 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold">Input Peserta Ujian</h3>
                </div>
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveManualStudent} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Nama Lengkap Peserta Ujian *
                  </label>
                  <input
                    type="text"
                    value={manualStudentName}
                    onChange={(e) => setManualStudentName(e.target.value)}
                    placeholder="Contoh: Muhammad Farhan"
                    className="w-full bg-[#080d19] border border-[#1e2a42] rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Kelas
                    </label>
                    <input
                      type="text"
                      value={manualStudentClass}
                      onChange={(e) => setManualStudentClass(e.target.value)}
                      placeholder="Contoh: 9B atau XII IPA 1"
                      className="w-full bg-[#080d19] border border-[#1e2a42] rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Nomor Absen
                    </label>
                    <input
                      type="text"
                      value={manualStudentAbsen}
                      onChange={(e) => setManualStudentAbsen(e.target.value)}
                      placeholder="01"
                      className="w-full bg-[#080d19] border border-[#1e2a42] rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Status Ujian
                  </label>
                  <select
                    value={manualStudentStatus}
                    onChange={(e) => setManualStudentStatus(e.target.value as any)}
                    className="w-full bg-[#080d19] border border-[#1e2a42] rounded-xl p-3 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Mengerjakan">Mengerjakan (Aktif Ujian)</option>
                    <option value="Terputus">Terputus (Koneksi Terputus)</option>
                    <option value="Selesai">Selesai (Sudah Mengumpulkan)</option>
                    <option value="Diblokir">Diblokir (Pelanggaran Layar)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Masukkan ke Ujian Live</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white border border-indigo-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-fadeIn max-w-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 truncate">{toastMessage}</div>
          </div>
        )}

        {/* Modal: Pelanggaran Real-Time */}
        {showViolationsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-xl rounded-3xl border border-[#1e2a42] bg-[#0b1220] p-6 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h3 className="text-base font-bold">Catatan Pelanggaran Siswa · {monitoringToken.token}</h3>
                </div>
                <button
                  onClick={() => setShowViolationsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {violations.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada pelanggaran yang terdeteksi. Sesi ujian berjalan dengan tertib.
                  </div>
                ) : (
                  violations.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{v.studentName}</span>
                          <span className="text-slate-400">({v.classGroup})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {v.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1">{v.violationType}</p>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px] shrink-0">{v.timestamp}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-700/50 flex justify-end">
                <button
                  onClick={() => setShowViolationsModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal / Fullscreen: Layar QR Proyektor */}
        {qrModalToken && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn ${
              isFullscreenQr ? 'p-0' : 'p-4'
            }`}
          >
            <div
              className={`w-full max-w-xl rounded-3xl border border-[#1e2a42] bg-[#0b1220] p-6 sm:p-8 text-center text-white shadow-2xl relative ${
                isFullscreenQr ? 'h-full max-w-none rounded-none flex flex-col justify-center' : ''
              }`}
            >
              <div className="absolute top-5 right-5 flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreenQr(!isFullscreenQr)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={isFullscreenQr ? 'Keluar Layar Penuh' : 'Layar Penuh Proyektor'}
                >
                  {isFullscreenQr ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setQrModalToken(null);
                    setIsFullscreenQr(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Layar Ujian Proyektor Kelas
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {qrModalToken.label} · {qrModalToken.quiz}
                </p>

                {/* QR Code Container */}
                <div className="my-5 p-4 bg-white rounded-3xl shadow-2xl inline-block border-4 border-indigo-500/20">
                  <svg viewBox="0 0 100 100" className="w-48 h-48 sm:w-56 sm:h-56 fill-slate-950">
                    <rect width="100" height="100" fill="white" />
                    <path d="M10,10 h25 v25 h-25 z M15,15 v15 h15 v-15 z M19,19 h7 v7 h-7 z" />
                    <path d="M65,10 h25 v25 h-25 z M70,15 v15 h15 v-15 z M74,19 h7 v7 h-7 z" />
                    <path d="M10,65 h25 v25 h-25 z M15,70 v15 h15 v-15 z M19,74 h7 v7 h-7 z" />
                    <rect x="42" y="10" width="6" height="20" />
                    <rect x="52" y="15" width="6" height="15" />
                    <rect x="40" y="42" width="20" height="20" />
                    <rect x="45" y="47" width="10" height="10" fill="white" />
                    <rect x="68" y="45" width="20" height="6" />
                    <rect x="75" y="55" width="15" height="6" />
                    <rect x="10" y="45" width="20" height="6" />
                    <rect x="40" y="70" width="15" height="20" />
                    <rect x="65" y="70" width="25" height="6" />
                    <rect x="75" y="80" width="15" height="10" />
                  </svg>
                </div>

                {/* Big Token Display */}
                <div className="space-y-1 mb-4">
                  <span className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold block">
                    Kode Akses Token Ujian:
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 tracking-widest select-all">
                      {qrModalToken.token}
                    </span>
                    <button
                      onClick={() => handleCopyTokenCode(qrModalToken.token)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Salin Kode Token"
                    >
                      {copiedToken ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Direct Link Controls */}
                <div className="w-full max-w-md p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 mb-4 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Tautan Soal Web Siswa ({qrModalToken.quiz}):</span>
                    <span className="text-emerald-400 font-bold">1 Token = 1 Soal</span>
                  </div>
                  <div className="font-mono text-indigo-300 break-all bg-black/50 p-2.5 rounded-xl border border-indigo-500/20 text-[11px]">
                    {getStudentWebUrl(qrModalToken.token)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleCopyStudentUrl(qrModalToken.token, qrModalToken.quiz)}
                      className="py-2.5 px-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-all text-xs shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Tautan Soal</span>
                    </button>
                    <a
                      href={getStudentWebUrl(qrModalToken.token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setQrModalToken(null);
                        setIsFullscreenQr(false);
                        showToast(`Membuka Portal Ujian Siswa (${qrModalToken.token}) di halaman baru... 🌐`);
                      }}
                      className="py-2.5 px-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-all border border-slate-700 text-xs no-underline cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Buka Soal Siswa</span>
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => {
                      setQrModalToken(null);
                      setIsFullscreenQr(false);
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Tutup Layar QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ALL TOKENS OVERVIEW LIST
  // ==========================================
  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fadeIn">
      {/* Banner 1: Siswa sedang ujian di akun Anda */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDarkMode ? 'bg-[#0b1220] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Siswa sedang ujian di akun Anda: <span className="font-bold">{totalActiveStudents}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Exam Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tokenList.map((tok) => {
          const isSelectedLive = examSession.token === tok.token;
          const currentWorkingCount = isSelectedLive ? totalActiveStudents : 0;
          const expiryText =
            tok.expiry === 'Tidak dibatasi' || tok.expiry === '—' || !tok.expiry
              ? 'tanpa batas waktu'
              : tok.expiry;

          return (
            <div
              key={tok.id}
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all hover:border-slate-600/60 ${
                isDarkMode ? 'bg-[#0b1220] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                {/* Token Badge */}
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-[#1c2438] text-indigo-300 border border-[#273456] tracking-wider inline-block">
                  {tok.token}
                </span>

                {/* Exam Title */}
                <h3 className={`text-base font-bold mt-3 leading-snug ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {tok.label}
                </h3>

                {/* Subject / Quiz */}
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {tok.quiz}
                </p>

                {/* Student Count & Expiry Info */}
                <p className="text-xs text-slate-400 mt-4 mb-5">
                  <strong className="text-slate-300">{currentWorkingCount}</strong> mengerjakan · {expiryText}
                </p>
              </div>

              {/* Action Buttons: Salin Tautan, Layar QR & Pantau */}
              <div className="flex items-center gap-2 pt-2">
                {/* 1. Salin Tautan */}
                <button
                  type="button"
                  onClick={() => handleCopyStudentUrl(tok.token, tok.quiz)}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#1c243c] hover:bg-[#253052] text-indigo-200 border border-[#273456] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  title={`Salin Tautan Soal untuk ${tok.quiz}`}
                >
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Salin</span>
                </button>

                {/* 2. Layar QR */}
                <button
                  type="button"
                  onClick={() => setQrModalToken(tok)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#1c243c] hover:bg-[#253052] text-indigo-200 border border-[#273456] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>Layar QR</span>
                </button>

                {/* 3. Pantau */}
                <button
                  type="button"
                  onClick={() => setMonitoringToken(tok)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border border-emerald-500/60 bg-[#062c21]/60 hover:bg-[#062c21] text-emerald-300 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Pantau</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
