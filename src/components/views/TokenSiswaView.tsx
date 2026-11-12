import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Users,
  Radio,
  PlusCircle,
  Globe,
  Key,
  Copy,
  Trash2,
  Check,
  X,
  QrCode,
  Link2,
  Eye,
  EyeOff,
  Pencil,
  Pause,
  Play,
  Smartphone,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Download
} from 'lucide-react';
import { ExamTokenItem, NavTab, GoogleFormRecord } from '../../types';
import confetti from 'canvas-confetti';

interface TokenSiswaViewProps {
  isDarkMode: boolean;
  currentToken: string;
  googleForms?: GoogleFormRecord[];
  onGenerateNewToken: (token: string) => void;
  onActivateFormFromToken?: (formName: string, token: string, expiresAt?: string, formUrl?: string) => void;
  onUpdateGoogleForm?: (form: GoogleFormRecord) => void;
  onToggleGoogleFormStatus?: (id: string) => void;
  onDeleteToken?: (tokenCode: string, quizName?: string) => void;
  onNavigate?: (tab: NavTab) => void;
}

export const TokenSiswaView: React.FC<TokenSiswaViewProps> = ({
  isDarkMode,
  currentToken,
  googleForms = [],
  onGenerateNewToken,
  onActivateFormFromToken,
  onUpdateGoogleForm,
  onToggleGoogleFormStatus,
  onDeleteToken,
  onNavigate
}) => {
  // Notification alert on top
  const [notificationMsg, setNotificationMsg] = useState<string | null>(
    'Token ZJT0P4M berhasil dibuat dan otomatis disinkronkan ke Cloudflare! ✅'
  );

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Form states matching screenshot
  const [googleForm, setGoogleForm] = useState('Segitiga (SMP)');
  const [label, setLabel] = useState('');
  const [violationLimit, setViolationLimit] = useState(1);
  const [waitingRoom, setWaitingRoom] = useState(false);

  // Expiry states (Jam dan Tanggal)
  const [isExpiryActive, setIsExpiryActive] = useState<boolean>(false);
  const [activeStudentsCount, setActiveStudentsCount] = useState<number>(0);

  // Sync real-time count of active students
  useEffect(() => {
    const syncActiveCount = () => {
      try {
        const saved = localStorage.getItem('soalpintar_pantau_students');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const count = parsed.filter((s: { status: string }) => s.status === 'Mengerjakan').length;
            setActiveStudentsCount(count);
          }
        }
      } catch (e) {
        console.warn('Failed to parse pantau count in TokenSiswaView:', e);
      }
    };

    syncActiveCount();
    window.addEventListener('storage', syncActiveCount);
    window.addEventListener('soalpintar_pantau_updated', syncActiveCount);
    const interval = setInterval(syncActiveCount, 1500);

    return () => {
      window.removeEventListener('storage', syncActiveCount);
      window.removeEventListener('soalpintar_pantau_updated', syncActiveCount);
      clearInterval(interval);
    };
  }, []);
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [expiryTime, setExpiryTime] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    const hours = String(d.getHours()).padStart(2, '0');
    return `${hours}:00`;
  });
  const [showExpiryModal, setShowExpiryModal] = useState<boolean>(false);

  // Helper date formatter
  const formatIndonesianDate = (dateStr: string, timeStr: string) => {
    if (!dateStr) return '—';
    try {
      const [year, month, day] = dateStr.split('-');
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      const monthName = months[parseInt(month, 10) - 1] || month;
      return `${day} ${monthName} ${year}, ${timeStr || '23:59'} WIB`;
    } catch {
      return `${dateStr} ${timeStr}`;
    }
  };

  const getFullDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[d.getDay()] || 'Hari';
    } catch {
      return '';
    }
  };

  const setPresetMinutes = (minutes: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    setExpiryDate(`${year}-${month}-${day}`);
    setExpiryTime(`${hours}:${mins}`);
    setIsExpiryActive(true);
  };

  const setPresetDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setExpiryDate(`${year}-${month}-${day}`);
    setIsExpiryActive(true);
  };

  const setPresetTime = (timeStr: string) => {
    setExpiryTime(timeStr);
    setIsExpiryActive(true);
  };

  // Token list state - initialized with user tokens and filtering out legacy auto-mock tokens
  const [tokenList, setTokenList] = useState<ExamTokenItem[]>(() => {
    const dummyMockCodes = ['SPT-9X2K', 'SPT-4M7B', 'SPT-3F8Y', 'SPT-8K1Z'];
    try {
      const saved = localStorage.getItem('soalpintar_token_list');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (t: ExamTokenItem) => !t.token || !dummyMockCodes.includes(t.token.toUpperCase())
          );
        }
      }
    } catch (e) {
      console.warn('Failed to load token list from localStorage:', e);
    }
    // Screenshot exact default initial row for Segitiga (SMP)
    return [
      {
        id: 'tok-zjt0p4m',
        token: 'ZJT0P4M',
        label: 'Kelas 9B - Segitiga (SMP)',
        quiz: 'Segitiga (SMP)',
        formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScL2dlWq2uZqoU8208FMWa224h1uXqhkX7NP1hvUqG1iR3L_A/viewform?token=ZJT0P4M&soal=Segitiga',
        violationLimit: 1,
        status: 'Aktif',
        expiry: '—',
        waitingRoom: false,
        createdAt: '28 Okt 2026'
      }
    ];
  });

  // Save token list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('soalpintar_token_list', JSON.stringify(tokenList));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('soalpintar_tokens_updated'));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.warn('Failed to save token list to localStorage:', e);
    }
  }, [tokenList]);

  // Sync tokenList state with localStorage changes from Distribusi Google Form or App state
  useEffect(() => {
    const handleSyncTokens = () => {
      try {
        const saved = localStorage.getItem('soalpintar_token_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setTokenList((prev) => {
              if (JSON.stringify(prev) !== saved) {
                return parsed;
              }
              return prev;
            });
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleSyncTokens);
    window.addEventListener('soalpintar_tokens_updated', handleSyncTokens);
    return () => {
      window.removeEventListener('storage', handleSyncTokens);
      window.removeEventListener('soalpintar_tokens_updated', handleSyncTokens);
    };
  }, []);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Active / selected token for modals
  const [selectedTokenItem, setSelectedTokenItem] = useState<ExamTokenItem | null>(null);

  // Modals state
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showWebTokenModal, setShowWebTokenModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit token form states
  const [editLabel, setEditLabel] = useState('');
  const [editLimit, setEditLimit] = useState(1);
  const [editExpiry, setEditExpiry] = useState('—');

  // Student test web portal states
  const [studentInputToken, setStudentInputToken] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentSuccessMessage, setStudentSuccessMessage] = useState(false);

  // Generate 7-character alphanumeric token like ZJT0P4M
  const generateTokenCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();

    const code = generateTokenCode();
    const finalExpiry = isExpiryActive
      ? formatIndonesianDate(expiryDate, expiryTime)
      : '—';

    let matchedFormUrl: string | undefined;
    if (googleForms && googleForms.length > 0) {
      const match = googleForms.find(
        (f) => f.name === googleForm || f.name.toLowerCase().includes(googleForm.toLowerCase())
      );
      if (match && match.url) {
        matchedFormUrl = match.url;
      }
    }

    const newToken: ExamTokenItem = {
      id: `tok-${Date.now()}`,
      token: code,
      label: label.trim() || 'Ulangan Harian',
      quiz: googleForm || 'Segitiga (SMP)',
      formUrl: matchedFormUrl,
      violationLimit,
      status: 'Aktif',
      expiry: finalExpiry,
      waitingRoom,
      createdAt: 'Baru saja'
    };

    setTokenList((prev) => [newToken, ...prev]);
    onGenerateNewToken(code);

    try {
      localStorage.setItem('soalpintar_last_created_token', code);
      localStorage.setItem('soalpintar_selected_live_token', code);
      localStorage.setItem(
        'soalpintar_active_exam',
        JSON.stringify({
          id: `ses-${Date.now()}`,
          title: label.trim() || `Ujian ${googleForm}`,
          token: code,
          subject: googleForm || 'Segitiga (SMP)',
          grade: 'SMP',
          durationMinutes: 90,
          totalQuestions: 20,
          isActive: true,
          startTime: 'Baru saja',
          totalStudents: 0,
          completedStudents: 0
        })
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('soalpintar_tokens_updated'));
        window.dispatchEvent(new Event('soalpintar_selected_live_token_changed'));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.warn('Failed saving last created token to localStorage:', e);
    }

    let isoExpiry: string | undefined;
    if (isExpiryActive && expiryDate && expiryTime) {
      try {
        const [hours, mins] = expiryTime.split(':');
        const d = new Date(expiryDate);
        d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
        isoExpiry = d.toISOString();
      } catch {
        isoExpiry = new Date(Date.now() + 90 * 60 * 1000).toISOString();
      }
    } else {
      isoExpiry = new Date(Date.now() + 120 * 60 * 1000).toISOString();
    }

    if (onActivateFormFromToken) {
      onActivateFormFromToken(googleForm, code, isoExpiry);
    }

    // Set top notification alert matching user screenshot
    setNotificationMsg(`Token ${code} (${googleForm}) berhasil dibuat dan disinkronkan! 1 Token = 1 Alamat Soal Web Siswa. ✅`);
    showToast(`Token ${code} untuk ${googleForm} berhasil dibuat!`);

    // Reset form
    setLabel('');

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }
  };

  const handleCopy = (tok: string) => {
    navigator.clipboard.writeText(tok);
    setCopiedToken(tok);
    showToast(`Kode token ${tok} disalin ke clipboard! 📋`);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getStudentWebUrl = (tok: string, quizName?: string) => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const matchedToken = tokenList.find((t) => t.token.toUpperCase() === tok.toUpperCase());
      const targetQuiz = quizName || matchedToken?.quiz || '';
      const matchedForm = googleForms.find(
        (f) => (f.token && f.token.toUpperCase() === tok.toUpperCase()) || (targetQuiz && f.name.toLowerCase() === targetQuiz.toLowerCase())
      );
      const fId = matchedForm?.id;
      const soalParam = encodeURIComponent(targetQuiz || matchedForm?.name || '');
      return `${origin}${pathname}?token=${tok}${fId ? `&formId=${fId}` : ''}${soalParam ? `&soal=${soalParam}` : ''}`;
    }
    return `https://soalpintar.ai/ujian?token=${tok}`;
  };

  const handleCopyLink = (item: ExamTokenItem | string) => {
    const code = typeof item === 'string' ? item : item.token;
    const quizName = typeof item === 'string' ? '' : item.quiz || '';
    const studentUrl = getStudentWebUrl(code, quizName);
    navigator.clipboard.writeText(studentUrl);
    showToast(`Tautan Web Siswa ${quizName ? `[${quizName}] ` : ''}disalin! 1 Token = 1 Alamat Soal (${studentUrl}) 📋`);
  };

  const handleOpenStudentLink = (tok: string) => {
    const studentUrl = getStudentWebUrl(tok);
    window.open(studentUrl, '_blank');
    showToast(`Membuka portal ujian web siswa (${tok}) di tab baru... 🌐`);
  };

  const handleToggleStatus = (id: string) => {
    setTokenList((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
          showToast(`Status token ${t.token} (${t.quiz}) diubah menjadi ${nextStatus}!`);

          if (googleForms && googleForms.length > 0) {
            const match = googleForms.find(
              (f) => (f.token && f.token.toUpperCase() === t.token.toUpperCase()) || f.name.toLowerCase() === t.quiz.toLowerCase()
            );
            if (match) {
              if (onUpdateGoogleForm) {
                onUpdateGoogleForm({
                  ...match,
                  status: nextStatus === 'Aktif' ? 'Aktif' : 'Nonaktif',
                  tokenActive: nextStatus === 'Aktif'
                });
              } else if (onToggleGoogleFormStatus) {
                onToggleGoogleFormStatus(match.id);
              }
            }
          }

          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleTogglePause = (id: string) => {
    setTokenList((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'Dijeda' ? 'Aktif' : 'Dijeda';
          showToast(
            nextStatus === 'Dijeda'
              ? `Sesi ujian token ${t.token} (${t.quiz}) dijeda sementara!`
              : `Sesi ujian token ${t.token} (${t.quiz}) dilanjutkan kembali!`
          );

          if (googleForms && googleForms.length > 0) {
            const match = googleForms.find(
              (f) => (f.token && f.token.toUpperCase() === t.token.toUpperCase()) || f.name.toLowerCase() === t.quiz.toLowerCase()
            );
            if (match && onUpdateGoogleForm) {
              onUpdateGoogleForm({
                ...match,
                status: nextStatus === 'Aktif' ? 'Aktif' : 'Nonaktif',
                tokenActive: nextStatus === 'Aktif'
              });
            }
          }

          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const openQrModal = (tok: ExamTokenItem) => {
    setSelectedTokenItem(tok);
    setShowQrModal(true);
  };

  const openAndroidModal = (tok: ExamTokenItem) => {
    setSelectedTokenItem(tok);
    setShowAndroidModal(true);
  };

  const openEditModal = (tok: ExamTokenItem) => {
    setSelectedTokenItem(tok);
    setEditLabel(tok.label);
    setEditLimit(tok.violationLimit);
    setEditExpiry(tok.expiry);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTokenItem) return;

    setTokenList((prev) =>
      prev.map((t) => {
        if (t.id === selectedTokenItem.id) {
          return {
            ...t,
            label: editLabel.trim() || t.label,
            violationLimit: editLimit,
            expiry: editExpiry
          };
        }
        return t;
      })
    );

    setShowEditModal(false);
    showToast(`Perubahan token ${selectedTokenItem.token} berhasil disimpan!`);
  };

  const openDeleteModal = (tok: ExamTokenItem) => {
    setSelectedTokenItem(tok);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedTokenItem) return;
    const deletedTok = selectedTokenItem.token;
    const deletedQuiz = selectedTokenItem.quiz;

    // 1. Remove from local tokenList state
    setTokenList((prev) => prev.filter((t) => t.id !== selectedTokenItem.id));

    // 2. Unlink from App state & Google Forms so token is removed permanently
    if (onDeleteToken) {
      onDeleteToken(deletedTok, deletedQuiz);
    }

    if (googleForms && googleForms.length > 0 && onUpdateGoogleForm) {
      const match = googleForms.find(
        (f) =>
          (f.token && f.token.toUpperCase() === deletedTok.toUpperCase()) ||
          (deletedQuiz && f.name.toLowerCase() === deletedQuiz.toLowerCase())
      );
      if (match) {
        onUpdateGoogleForm({
          ...match,
          token: undefined,
          tokenActive: false,
          status: 'Nonaktif',
          expiresAt: undefined,
          tokenActivatedAt: undefined
        });
      }
    }

    setShowDeleteModal(false);
    showToast(`Token ${deletedTok} berhasil dihapus.`);
  };

  // Dynamically compile available options for Google Form dropdown directly from Distribusi Google Form
  const formOptions = React.useMemo(() => {
    const list: string[] = [];
    if (googleForms && googleForms.length > 0) {
      googleForms.forEach((f) => {
        if (f.name && !list.includes(f.name)) {
          list.push(f.name);
        }
      });
    }
    if (list.length === 0) {
      list.push('ASAT - Asesmen Sumatif', 'PTS Ganjil - IPA', 'Kuis Harian - Matematika HOTS', 'Penilaian Akhir Semester (PAS)');
    }
    return list;
  }, [googleForms]);

  // Keep selected dropdown form synced with available options
  useEffect(() => {
    if (formOptions.length > 0 && (!googleForm || !formOptions.includes(googleForm))) {
      setGoogleForm(formOptions[0]);
    }
  }, [formOptions]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Notification Alert (Cloudflare Sync) */}
      {notificationMsg && (
        <div
          className={`p-3.5 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-sm animate-fadeIn ${
            isDarkMode
              ? 'bg-[#04241d] border-emerald-600/30 text-emerald-400'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">
              {notificationMsg}
            </span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-emerald-500 hover:text-emerald-300 transition-colors p-1"
            title="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner 1: Panduan Penggunaan & Alternatif Kendala Perangkat */}
      <div
        className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
          isDarkMode
            ? 'bg-[#0f172a] border-[#1e293b]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Panduan Penggunaan & Alternatif Kendala Perangkat
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Ujian mendukung "Aplikasi Android" (Mode Lockdown) dan "Web Browser" (Alternatif Cepat). Baca petunjuk penyelesaian masalah spesifikasi HP/browser siswa di sini.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowGuideModal(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 flex items-center justify-center gap-2 shrink-0 shadow-md shadow-orange-500/20 active:scale-95 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          <span>Lihat Panduan Ujian</span>
        </button>
      </div>

      {/* Banner 2: Siswa sedang ujian: 0 */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          isDarkMode
            ? 'bg-[#0b1220] border-[#172235]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Siswa sedang ujian: {activeStudentsCount}
            </div>
            <div className="text-[11px] text-slate-400">
              Paket Anda tidak membatasi jumlah siswa ujian bersamaan.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate('ujian-live');
            } else {
              setShowQrModal(true);
            }
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
            isDarkMode
              ? 'bg-[#152033] border-[#22324e] text-slate-200 hover:bg-[#1b2b45]'
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ujian Live & Layar QR</span>
        </button>
      </div>

      {/* Card 3: Buat Token Baru */}
      <div
        className={`p-6 rounded-2xl border transition-colors ${
          isDarkMode
            ? 'bg-[#0b1220] border-[#172235]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-6 pb-2">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-sky-400" />
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Buat Token Baru
            </h3>
          </div>

          <a
            href={getStudentWebUrl(tokenList[0]?.token || currentToken || 'ZJT0P4M', googleForm)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              const activeTok = tokenList[0]?.token || currentToken || 'ZJT0P4M';
              showToast(`Membuka Secure Exam Player Siswa dengan Token ${activeTok}... 🌐`);
              if (onNavigate) {
                // Also allow direct in-app test navigation
                try {
                  localStorage.setItem('soalpintar_selected_live_token', activeTok);
                  localStorage.setItem('soalpintar_last_created_token', activeTok);
                  window.dispatchEvent(new Event('soalpintar_selected_live_token_changed'));
                } catch {}
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all no-underline cursor-pointer ${
              isDarkMode
                ? 'bg-[#152033] border-[#22324e] text-slate-300 hover:text-white hover:bg-[#1b2b45]'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Buka Secure Exam Player Siswa di tab baru"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Masukkan Token Versi Web</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        <form onSubmit={handleCreateToken} className="space-y-5">
          {/* 4 Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Google Form */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Google Form
              </label>
              <select
                value={googleForm}
                onChange={(e) => setGoogleForm(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none ${
                  isDarkMode
                    ? 'bg-[#080d1a] border-[#1e2a42] text-white focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {formOptions.map((formName) => (
                  <option key={formName} value={formName}>
                    {formName}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Label */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Contoh: Kelas 9A - UTS Biologi"
                className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none ${
                  isDarkMode
                    ? 'bg-[#080d1a] border-[#1e2a42] text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* 3. Batas Pelanggaran */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Batas Pelanggaran Keluar App/Fullscreen
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={violationLimit}
                onChange={(e) => setViolationLimit(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none ${
                  isDarkMode
                    ? 'bg-[#080d1a] border-[#1e2a42] text-white focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* 4. Kedaluwarsa */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  Kedaluwarsa (opsional)
                </label>
                {isExpiryActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpiryActive(false);
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                    title="Nonaktifkan batas waktu"
                  >
                    Nonaktifkan
                  </button>
                )}
              </div>

              <div
                onClick={() => setShowExpiryModal(true)}
                className={`w-full p-2.5 rounded-xl text-xs font-medium border cursor-pointer flex items-center justify-between transition-all select-none ${
                  isExpiryActive
                    ? isDarkMode
                      ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-200 hover:border-indigo-400'
                      : 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:border-indigo-400'
                    : isDarkMode
                    ? 'bg-[#080d1a] border-[#1e2a42] text-slate-400 hover:border-slate-600'
                    : 'bg-slate-50 border-slate-300 text-slate-500 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {isExpiryActive ? (
                    <>
                      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-white">
                        {formatIndonesianDate(expiryDate, expiryTime)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-500 font-mono">mm/dd/yyyy --:-- --</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox Ruang Tunggu */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isDarkMode
                ? 'bg-[#080d1a] border-[#1e2a42]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              type="checkbox"
              id="waitingRoom"
              checked={waitingRoom}
              onChange={(e) => setWaitingRoom(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded accent-indigo-600 cursor-pointer"
            />
            <label htmlFor="waitingRoom" className="text-xs cursor-pointer select-none">
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Ruang tunggu: siswa menunggu dan baru mulai serentak saat saya klik "Mulai Mengerjakan Soal"
              </span>
              <p className="text-slate-400 mt-0.5 text-[11px]">
                Berlaku untuk web dan aplikasi Android. Tombol mulai ada di menu Ujian Live → Layar QR.
              </p>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#4f46e5] hover:bg-[#4338ca] shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Buat Token</span>
          </button>
        </form>
      </div>

      {/* Card 4: Tabel Token (Daftar Token) */}
      <div
        className={`rounded-2xl border overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#0b1220] border-[#172235]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-slate-400 uppercase tracking-wider font-semibold text-[11px] ${
                isDarkMode ? 'bg-[#080d1a] border-[#172235]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <tr>
                <th className="py-3.5 px-5">TOKEN</th>
                <th className="py-3.5 px-5">LABEL</th>
                <th className="py-3.5 px-5">QUIZ</th>
                <th className="py-3.5 px-5">LIMIT</th>
                <th className="py-3.5 px-5">STATUS</th>
                <th className="py-3.5 px-5">KEDALUWARSA</th>
                <th className="py-3.5 px-5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-[#172235]' : 'divide-slate-200'}`}>
              {tokenList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-800/70 text-slate-400 flex items-center justify-center mb-3">
                        <Key className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <div className={`font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        Belum ada token
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Gunakan form di atas untuk membuat token pertama
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                tokenList.map((tok) => (
                  <tr key={tok.id} className={isDarkMode ? 'hover:bg-[#0f172a]' : 'hover:bg-slate-50'}>
                    {/* TOKEN */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#141d33] border border-[#223152] font-mono font-bold text-xs text-indigo-300 tracking-wider">
                          {tok.token}
                        </span>
                        <button
                          onClick={() => handleCopy(tok.token)}
                          className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                          title="Salin Token"
                        >
                          {copiedToken === tok.token ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* LABEL */}
                    <td className="py-3.5 px-5 font-medium text-white">{tok.label}</td>

                    {/* QUIZ */}
                    <td className="py-3.5 px-5 text-slate-200">{tok.quiz}</td>

                    {/* LIMIT */}
                    <td className="py-3.5 px-5 font-semibold text-rose-400">
                      {tok.violationLimit}x
                    </td>

                    {/* STATUS */}
                    <td className="py-3.5 px-5">
                      {tok.status === 'Aktif' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#062c21] text-emerald-400 border border-emerald-600/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Aktif</span>
                        </span>
                      ) : tok.status === 'Dijeda' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-600/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>Dijeda</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    {/* KEDALUWARSA */}
                    <td className="py-3.5 px-5 text-slate-400 font-medium">
                      {tok.expiry === 'Tidak dibatasi' || tok.expiry === '' ? '—' : tok.expiry}
                    </td>

                    {/* AKSI (7 BUTTONS MATCHING SCREENSHOT) */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. QR Code */}
                        <button
                          onClick={() => openQrModal(tok)}
                          className="p-1.5 rounded-lg bg-[#121c31] hover:bg-[#1a2948] text-indigo-400 border border-[#1f2d4d] transition-colors"
                          title="Tampilkan Layar QR Proyektor"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* 2. Salin Tautan Siswa (1 Token = 1 Alamat Soal) */}
                        <button
                          onClick={() => handleCopyLink(tok)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-950/70 hover:bg-sky-900/90 text-sky-300 border border-sky-500/40 transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                          title={`Salin Tautan Web Siswa khusus untuk Token ${tok.token} (${tok.quiz})`}
                        >
                          <Link2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>Salin Tautan</span>
                        </button>

                        {/* 3. Toggle Aktif/Nonaktif */}
                        <button
                          onClick={() => handleToggleStatus(tok.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            tok.status === 'Aktif'
                              ? 'bg-[#121c31] hover:bg-[#1a2948] text-amber-400 border-[#1f2d4d]'
                              : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                          }`}
                          title={tok.status === 'Aktif' ? 'Nonaktifkan Token' : 'Aktifkan Token'}
                        >
                          {tok.status === 'Aktif' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>

                        {/* 4. Info Aplikasi Android Siswa */}
                        <button
                          onClick={() => openAndroidModal(tok)}
                          className="p-1.5 rounded-lg bg-[#121c31] hover:bg-[#1a2948] text-cyan-400 border border-[#1f2d4d] transition-colors"
                          title="Buka Info & Link Aplikasi Android"
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>

                        {/* 5. Edit Token */}
                        <button
                          onClick={() => openEditModal(tok)}
                          className="p-1.5 rounded-lg bg-[#121c31] hover:bg-[#1a2948] text-indigo-300 border border-[#1f2d4d] transition-colors"
                          title="Edit Label & Batasan Token"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* 6. Jeda / Lanjutkan Ujian */}
                        <button
                          onClick={() => handleTogglePause(tok.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            tok.status === 'Dijeda'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : 'bg-[#121c31] hover:bg-[#1a2948] text-amber-300 border-[#1f2d4d]'
                          }`}
                          title={tok.status === 'Dijeda' ? 'Lanjutkan Ujian' : 'Jeda Ujian'}
                        >
                          {tok.status === 'Dijeda' ? (
                            <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                          ) : (
                            <Pause className="w-4 h-4" />
                          )}
                        </button>

                        {/* 7. Hapus Token */}
                        <button
                          onClick={() => openDeleteModal(tok)}
                          className="p-1.5 rounded-lg bg-[#121c31] hover:bg-[#281520] text-rose-400 border border-[#3b1d28] transition-colors"
                          title="Hapus Token"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white border border-indigo-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-fadeIn max-w-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1 truncate">{toastMessage}</div>
          {toastMessage.includes('token=') && (
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('ujian-siswa');
                } else {
                  const tokenMatch = toastMessage.match(/token=([a-zA-Z0-9]+)/);
                  const tok = tokenMatch ? tokenMatch[1] : 'ZJT0P4M';
                  handleOpenStudentLink(tok);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 flex items-center gap-1 shadow-sm"
            >
              <span>Buka</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Modal 1: Panduan Ujian & Kendala Perangkat */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 max-h-[90vh] overflow-y-auto ${
              isDarkMode ? 'bg-[#0f172a] border-[#1e2a42] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Panduan Penggunaan & Kendala Perangkat</h3>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-white block mb-1">1. Mode Lockdown Aplikasi Android:</strong>
                Siswa mengunduh aplikasi SoalPintar Client dari Play Store atau file APK. Aplikasi akan mengunci navigasi, bilah status, dan tombol beranda secara otomatis saat ujian dimulai.
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-white block mb-1">2. Mode Web Browser (Chrome / Safari / Edge):</strong>
                Digunakan untuk siswa pengguna iPhone (iOS), laptop Chromebook, atau PC lab. Sistem menggunakan API Fullscreen HTML5 & Page Visibility untuk mendeteksi siswa yang membuka tab baru atau beralih aplikasi.
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-white block mb-1">3. Solusi Kendala Baterai & Notifikasi WA:</strong>
                Instruksikan siswa mengaktifkan mode Jangan Ganggu (Do Not Disturb) sebelum ujian agar notifikasi pop-up tidak terhitung sebagai pelanggaran keluar layar.
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-700/40 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Masukkan Token Versi Web (Simulasi Portal Siswa) */}
      {showWebTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 ${
              isDarkMode ? 'bg-[#0f172a] border-[#1e2a42] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold">Portal Ujian Siswa (Versi Web)</h3>
              </div>
              <button onClick={() => setShowWebTokenModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <p className="text-slate-400">
                Tampilan ini merupakan pratinjau antarmuka yang dilihat siswa ketika membuka tautan ujian melalui browser.
              </p>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kode Token Ujian</label>
                <input
                  type="text"
                  value={studentInputToken}
                  onChange={(e) => setStudentInputToken(e.target.value.toUpperCase())}
                  placeholder="Contoh: ZJT0P4M"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-center tracking-widest text-sm outline-none"
                />
              </div>

              {(() => {
                const matched = tokenList.find((t) => t.token.toUpperCase() === studentInputToken.trim().toUpperCase());
                if (!matched) return null;
                return (
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-indigo-200">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Batas Waktu: <strong className="text-white">{matched.expiry}</strong></span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                      {matched.status}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Masukkan nama lengkap siswa..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>

              {studentSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Token valid! Membuka lembar soal ujian...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleCopyLink(studentInputToken || (tokenList[0]?.token || 'ZJT0P4M'));
                  }}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Salin Tautan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenStudentLink(studentInputToken || (tokenList[0]?.token || 'ZJT0P4M'));
                  }}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Baru</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (studentInputToken) {
                    handleOpenStudentLink(studentInputToken);
                  } else {
                    setStudentSuccessMessage(true);
                    setTimeout(() => {
                      setStudentSuccessMessage(false);
                      setShowWebTokenModal(false);
                    }, 1200);
                  }
                }}
                className="w-full py-3 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-600 text-slate-950 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Mulai Ujian Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Layar QR Code untuk Proyektor Kelas */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-3xl border p-8 text-center ${
              isDarkMode ? 'bg-[#0f172a] border-[#1e2a42] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            }`}
          >
            <div className="flex justify-end">
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">Layar Ujian Proyektor Kelas</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Tampilkan layar ini di proyektor kelas agar siswa dapat langsung scan QR atau memasukkan kode token.
              </p>

              {/* QR Code Graphic */}
              <div className="my-6 p-4 bg-white rounded-2xl shadow-xl inline-block">
                <svg viewBox="0 0 100 100" className="w-48 h-48 fill-slate-950">
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
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                  Kode Token Akses:
                </span>
                <div className="text-4xl font-extrabold font-mono text-emerald-400 tracking-wider">
                  {selectedTokenItem ? selectedTokenItem.token : tokenList.length > 0 ? tokenList[0].token : currentToken}
                </div>
                {selectedTokenItem && (
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedTokenItem.label} • {selectedTokenItem.quiz}
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowQrModal(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                >
                  Tutup Layar QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Android App Link & Lockdown Info */}
      {showAndroidModal && selectedTokenItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-4 ${
              isDarkMode ? 'bg-[#0f172a] border-[#1e2a42] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold">Aplikasi Android Siswa</h3>
              </div>
              <button onClick={() => setShowAndroidModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Untuk siswa yang menggunakan aplikasi Android <strong>SoalPintar Client (Mode Lockdown)</strong>:
              </p>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-slate-400 text-[11px]">Deep Link Langsung Masuk:</div>
                <div className="font-mono text-cyan-300 break-all select-all bg-black/40 p-2 rounded-lg border border-cyan-500/20">
                  soalpintar://exam?token={selectedTokenItem.token}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`soalpintar://exam?token=${selectedTokenItem.token}`);
                    showToast('Deep link Android berhasil disalin!');
                  }}
                  className="w-full py-1.5 rounded-lg text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Deep Link Android</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="font-semibold text-white mb-1">Paket Aplikasi (Package Name):</div>
                <div className="font-mono text-slate-300">id.soalpintar.client</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Mendukung Android 7.0 hingga 14.0 dengan auto-lock & status bar protection.
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAndroidModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Edit Token */}
      {showEditModal && selectedTokenItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-4 ${
              isDarkMode ? 'bg-[#0f172a] border-[#1e2a42] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Edit Token: {selectedTokenItem.token}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Label</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                  placeholder="Label ujian..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Batas Pelanggaran Keluar Layar
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editLimit}
                  onChange={(e) => setEditLimit(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kedaluwarsa
                </label>
                <input
                  type="text"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                  placeholder="Contoh: — atau 28 Okt 2026, 14:00 WIB"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Konfirmasi Hapus Token */}
      {showDeleteModal && selectedTokenItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 space-y-4 text-center ${
              isDarkMode ? 'bg-[#0f172a] border-[#1e2a42] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold">Hapus Token {selectedTokenItem.token}?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Siswa yang sedang mengerjakan menggunakan token ini tidak akan dapat login kembali. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Pilih Jam dan Tanggal Kedaluwarsa */}
      {showExpiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl ${
              isDarkMode
                ? 'bg-[#0b1322] border-[#1e2a42] text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Pilih Jam & Tanggal Kedaluwarsa</h3>
                  <p className="text-[11px] text-slate-400">Atur batas waktu otomatis masa aktif token ujian</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExpiryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Status Aktif */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isExpiryActive
                  ? 'border-indigo-500/40 bg-indigo-950/20'
                  : isDarkMode
                  ? 'border-slate-800 bg-slate-900/40'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isExpiryActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <div>
                  <div className="font-bold text-xs">
                    {isExpiryActive ? 'Batas Waktu Kedaluwarsa Aktif' : 'Tanpa Batas Waktu (Selamanya)'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isExpiryActive
                      ? 'Siswa tidak dapat mengakses token setelah waktu ini terlewati'
                      : 'Token akan tetap aktif sampai dihapus secara manual oleh guru'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExpiryActive(!isExpiryActive)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isExpiryActive
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                {isExpiryActive ? 'Aktif' : 'Aktifkan'}
              </button>
            </div>

            {/* Pickers: Tanggal & Jam */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kolom 1: Tanggal */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>1. Pilih Tanggal Ujian</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                  onChange={(e) => {
                    setExpiryDate(e.target.value);
                    setIsExpiryActive(true);
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#080d1a] border-[#1e2a42] text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPresetDate(0)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDate(1)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Besok
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDate(2)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Lusa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDate(7)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    +1 Minggu
                  </button>
                </div>
              </div>

              {/* Kolom 2: Jam */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>2. Pilih Jam Kedaluwarsa</span>
                </label>
                <input
                  type="time"
                  value={expiryTime}
                  style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                  onChange={(e) => {
                    setExpiryTime(e.target.value);
                    setIsExpiryActive(true);
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#080d1a] border-[#1e2a42] text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPresetTime('10:00')}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    10:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime('12:00')}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    12:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime('14:00')}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    14:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime('16:00')}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    16:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime('23:59')}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    23:59
                  </button>
                </div>
              </div>
            </div>

            {/* Shortcut Durasi Cepat */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Shortcut Durasi Cepat dari Sekarang:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPresetMinutes(45)}
                  className="p-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-indigo-950/60 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700/60 transition-all text-center"
                >
                  ⏱️ +45 Menit (1 JP)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetMinutes(90)}
                  className="p-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-indigo-950/60 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700/60 transition-all text-center"
                >
                  ⏱️ +90 Menit (2 JP)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetMinutes(120)}
                  className="p-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-indigo-950/60 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700/60 transition-all text-center"
                >
                  ⏱️ +2 Jam (Ujian)
                </button>
              </div>
            </div>

            {/* Preview Banner */}
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                isExpiryActive
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400'
              }`}
            >
              <Check className={`w-4 h-4 shrink-0 ${isExpiryActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div className="leading-snug">
                {isExpiryActive ? (
                  <span>
                    Token akan kedaluwarsa pada: <strong className="text-white">{getFullDayName(expiryDate)}, {formatIndonesianDate(expiryDate, expiryTime)}</strong>
                  </span>
                ) : (
                  <span>Token tidak memiliki batas waktu (berlaku bebas).</span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpiryActive(false);
                  setShowExpiryModal(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 font-medium"
              >
                Hapus Batas (Nonaktif)
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpiryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpiryActive(true);
                    setShowExpiryModal(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Terapkan Jam & Tanggal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
