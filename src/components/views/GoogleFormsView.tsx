import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Save,
  ExternalLink,
  Copy,
  Trash2,
  Check,
  FileSpreadsheet,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Timer,
  Play,
  Pause,
  RefreshCw,
  Key,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Search,
  Users,
  Radio,
  X,
  FolderOpen,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuestionItem, NavTab, GoogleFormRecord } from '../../types';

interface GoogleFormsViewProps {
  questions: QuestionItem[];
  isDarkMode: boolean;
  googleForms: GoogleFormRecord[];
  onAddGoogleForm: (form: GoogleFormRecord) => void;
  onUpdateGoogleForm?: (form: GoogleFormRecord) => void;
  onToggleStatus?: (id: string) => void;
  onExtendTime?: (id: string, additionalMinutes: number) => void;
  onDeleteGoogleForm: (id: string) => void;
  onNavigate?: (tab: NavTab) => void;
}

export const GoogleFormsView: React.FC<GoogleFormsViewProps> = ({
  questions,
  isDarkMode,
  googleForms,
  onAddGoogleForm,
  onUpdateGoogleForm,
  onToggleStatus,
  onExtendTime,
  onDeleteGoogleForm,
  onNavigate
}) => {
  // Input states matching screenshot
  const [urlInput, setUrlInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [targetClassInput, setTargetClassInput] = useState('Kelas 9A');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [showAutoScript, setShowAutoScript] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter and search
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time ticking clock for countdown
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Modal: Aktifkan Token & Hitungan Jam Mundur
  const [selectedFormForActivation, setSelectedFormForActivation] = useState<GoogleFormRecord | null>(null);
  const [modalToken, setModalToken] = useState('');
  const [modalDurationMinutes, setModalDurationMinutes] = useState<number>(90);
  const [modalTargetClass, setModalTargetClass] = useState('Kelas 9A');
  const [modalUseCustomExpiry, setModalUseCustomExpiry] = useState(false);
  const [modalCustomDate, setModalCustomDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [modalCustomTime, setModalCustomTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return `${String(d.getHours()).padStart(2, '0')}:00`;
  });

  // Calculate countdown time for a form
  const getRemainingTime = (expiresAt?: string, isAktif?: boolean) => {
    if (!expiresAt || !isAktif) return null;
    const targetTime = new Date(expiresAt).getTime();
    const diffSeconds = Math.floor((targetTime - now) / 1000);

    if (diffSeconds <= 0) {
      return {
        diffSeconds: 0,
        formatted: '00:00:00',
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        isUrgent: false
      };
    }

    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const isUrgent = diffSeconds <= 900; // less than 15 mins

    return {
      diffSeconds,
      formatted,
      hours,
      minutes,
      seconds,
      isExpired: false,
      isUrgent
    };
  };

  const handleOpenActivationModal = (form: GoogleFormRecord) => {
    setSelectedFormForActivation(form);
    setModalToken(form.token || `SPT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setModalTargetClass(form.targetClass || 'Kelas 9A');
    setModalDurationMinutes(form.durationMinutes || 90);
    setModalUseCustomExpiry(false);
  };

  const handleGenerateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SPT-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setModalToken(code);
  };

  const handleConfirmActivation = () => {
    if (!selectedFormForActivation) return;

    let expiresAtIso: string;
    let durationMins = modalDurationMinutes;

    if (modalUseCustomExpiry && modalCustomDate && modalCustomTime) {
      try {
        const [h, m] = modalCustomTime.split(':');
        const customD = new Date(modalCustomDate);
        customD.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        expiresAtIso = customD.toISOString();
        durationMins = Math.max(1, Math.round((customD.getTime() - Date.now()) / (60 * 1000)));
      } catch {
        expiresAtIso = new Date(Date.now() + modalDurationMinutes * 60 * 1000).toISOString();
      }
    } else {
      expiresAtIso = new Date(Date.now() + modalDurationMinutes * 60 * 1000).toISOString();
    }

    const updated: GoogleFormRecord = {
      ...selectedFormForActivation,
      status: 'Aktif',
      token: modalToken || `SPT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      tokenActive: true,
      tokenActivatedAt: new Date().toISOString(),
      expiresAt: expiresAtIso,
      durationMinutes: durationMins,
      targetClass: modalTargetClass
    };

    if (onUpdateGoogleForm) {
      onUpdateGoogleForm(updated);
    }

    setSelectedFormForActivation(null);

    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }
  };

  const handleDirectToggleStatus = (form: GoogleFormRecord) => {
    if (form.status === 'Aktif') {
      // Deactivate immediately
      if (onUpdateGoogleForm) {
        onUpdateGoogleForm({
          ...form,
          status: 'Nonaktif',
          tokenActive: false
        });
      } else if (onToggleStatus) {
        onToggleStatus(form.id);
      }
    } else {
      // Open modal to configure duration and activate
      handleOpenActivationModal(form);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() && !labelInput.trim()) return;

    const formName = labelInput.trim() || 'Formulir Ujian Baru';
    const userUrl = urlInput.trim();
    const defaultBaseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScL2dlWq2uZqoU8208FMWa224h1uXqhkX7NP1hvUqG1iR3L_A/viewform';
    let finalUrl = userUrl;
    if (!finalUrl || finalUrl.includes('sample-form')) {
      finalUrl = `${defaultBaseUrl}?soal=${encodeURIComponent(formName)}`;
    }

    const newForm: GoogleFormRecord = {
      id: `gf-${Date.now()}`,
      name: formName,
      url: finalUrl,
      questionCount: questions.length || 10,
      status: 'Nonaktif',
      token: undefined, // Belum dibuat token (tidak otomatis)
      tokenActive: false,
      targetClass: targetClassInput,
      durationMinutes: 90,
      createdAt: 'Baru saja'
    };

    onAddGoogleForm(newForm);
    setUrlInput('');
    setLabelInput('');

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }
  };

  const handleDelete = (id: string) => {
    onDeleteGoogleForm(id);
  };

  const handleCopyFormUrl = (item: GoogleFormRecord) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(`form-${item.id}`);
    showToast(`Alamat Google Form (${item.name}) disalin ke clipboard! 📋`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyStudentLink = (item: GoogleFormRecord) => {
    let linkToCopy = item.url;
    if (typeof window !== 'undefined') {
      const activeTok = item.token || 'ZJT0P4M';
      linkToCopy = `${window.location.origin}${window.location.pathname}?token=${activeTok}&formId=${item.id}&soal=${encodeURIComponent(item.name)}`;
    }
    navigator.clipboard.writeText(linkToCopy);
    setCopiedId(`student-${item.id}`);
    showToast(`Tautan Web Siswa (${item.name}) disalin ke clipboard! 📋`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLink = (item: GoogleFormRecord) => {
    handleCopyStudentLink(item);
  };

  const handleCopyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    showToast(`Kode token ${token} disalin ke clipboard! 📋`);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  // Quick Time Extension Handler
  const handleQuickAddMinutes = (id: string, mins: number) => {
    if (onExtendTime) {
      onExtendTime(id, mins);
    } else if (onUpdateGoogleForm) {
      const target = googleForms.find((f) => f.id === id);
      if (target) {
        const curExp = target.expiresAt ? new Date(target.expiresAt).getTime() : Date.now();
        const base = curExp > Date.now() ? curExp : Date.now();
        const newExpiry = new Date(base + mins * 60 * 1000).toISOString();
        onUpdateGoogleForm({
          ...target,
          status: 'Aktif',
          tokenActive: true,
          expiresAt: newExpiry,
          durationMinutes: (target.durationMinutes || 0) + mins
        });
      }
    }

    try {
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.7 }
      });
    } catch {
      // fallback
    }
  };

  // Filtering
  const filteredForms = googleForms.filter((f) => {
    const isAktif = f.status === 'Aktif';
    if (filterTab === 'active' && !isAktif) return false;
    if (filterTab === 'inactive' && isAktif) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchToken = f.token?.toLowerCase().includes(q);
      const matchClass = f.targetClass?.toLowerCase().includes(q);
      if (!matchName && !matchToken && !matchClass) return false;
    }
    return true;
  });

  const activeCount = googleForms.filter((f) => f.status === 'Aktif').length;
  const inactiveCount = googleForms.filter((f) => f.status !== 'Aktif').length;

  const generateAutoScript = () => {
    const questionsJson = JSON.stringify(
      questions.map((q) => ({
        title: q.question,
        options: q.options.map((o) => o.text),
        correctKeyIndex: ['A', 'B', 'C', 'D'].indexOf(q.correctKey),
        explanation: q.explanation
      })),
      null,
      2
    );

    return `/**
 * SOALPINTAR.AI - Google Forms Auto Generator Script
 * 1. Buka script.google.com
 * 2. Buat proyek baru dan tempel kode ini
 * 3. Klik tombol "Jalankan" (Run) -> Google Form akan dibuat di Google Drive Anda!
 */
function buatUjianSoalPintar() {
  var form = FormApp.create("Ujian Asesmen SoalPintar")
    .setDescription("Dibuat otomatis dari Bank Soal SoalPintar.ai Guru Panel")
    .setIsQuiz(true);

  var items = ${questionsJson};

  items.forEach(function(item, index) {
    var mcItem = form.addMultipleChoiceItem();
    mcItem.setTitle((index + 1) + ". " + item.title)
          .setPoints(4);

    var choices = [];
    item.options.forEach(function(optText, optIdx) {
      var isCorrect = (optIdx === item.correctKeyIndex);
      choices.push(mcItem.createChoice(optText, isCorrect));
    });

    mcItem.setChoices(choices);
    mcItem.setFeedbackForCorrect(FormApp.createFeedback().setText("Bagus! " + item.explanation).build());
    mcItem.setFeedbackForIncorrect(FormApp.createFeedback().setText("Kunci: " + item.explanation).build());
  });

  Logger.log("Form berhasil dibuat! URL Edit: " + form.getEditUrl());
  Logger.log("Form URL Siswa: " + form.getPublishedUrl());
}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Google Forms Direct Access Hub & Alamat Google Form */}
      <div
        className={`rounded-2xl p-5 border transition-all ${
          isDarkMode
            ? 'bg-gradient-to-r from-[#171033] via-[#0d162d] to-[#0b1220] border-purple-500/30'
            : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 border-purple-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-md shadow-purple-900/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Menu Distribusi Google Form
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Kelola formulir ujian, token akses siswa, dan hitungan jam mundur. Alamat resmi Google Forms:{' '}
                <a
                  href="https://forms.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-mono font-medium underline inline-flex items-center gap-0.5"
                >
                  forms.google.com
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                atau buat formulir baru di{' '}
                <a
                  href="https://forms.new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:text-sky-300 font-mono font-medium underline inline-flex items-center gap-0.5"
                >
                  forms.new
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href="https://forms.google.com"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#171333] hover:bg-[#251d50] text-purple-200 border border-purple-500/40 shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              <span>Buka forms.google.com</span>
            </a>

            <a
              href="https://drive.google.com/drive/search?q=v2-soalpintar.ai"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0d2238] hover:bg-[#153454] text-cyan-200 border border-cyan-500/40 shadow-sm flex items-center gap-2 transition-all active:scale-95"
              title="Buka Folder v2-soalpintar.ai di Google Drive"
            >
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Buka Google Drive</span>
            </a>

            <a
              href="https://forms.new"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Buat Form Baru (forms.new)</span>
            </a>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('bank-soal')}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Buat dari Bank Soal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Banner / Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Forms */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDarkMode ? 'bg-[#0b1220] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Form Tersimpan
              </p>
              <h4 className="text-2xl font-black text-white mt-1">{googleForms.length}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Siap digunakan untuk ujian proctoring
          </p>
        </div>

        {/* Active Forms with Countdown */}
        <div
          className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
            isDarkMode
              ? 'bg-[#0b1220] border-emerald-500/30'
              : 'bg-emerald-50/50 border-emerald-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  Form & Token Aktif
                </p>
              </div>
              <h4 className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Timer className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Hitungan jam mundur sedang berjalan
          </p>
        </div>

        {/* Inactive Forms */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDarkMode ? 'bg-[#0b1220] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Form Non-Aktif / Selesai
              </p>
              <h4 className="text-2xl font-black text-slate-400 mt-1">{inactiveCount}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-slate-500/20">
              <Pause className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            Klik toggle switch untuk mengaktifkan token
          </p>
        </div>
      </div>

      {/* Main Card: Tambahkan Form Manual matching screenshot exactly */}
      <div
        className={`rounded-2xl p-6 border transition-colors ${
          isDarkMode ? 'bg-[#0b1220] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Tambahkan Form Manual
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setUrlInput('https://docs.google.com/forms/d/e/1FAIpQLSc912384918239/viewform');
                if (!labelInput) setLabelInput('Penilaian Harian Matematika HOTS');
              }}
              className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>⚡ Pakai Contoh Alamat Form</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Input 1: Alamat Google Form */}
            <div className="md:col-span-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-400">
                  Alamat Google Form (URL)
                </label>
                <a
                  href="https://forms.new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-sky-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Buka forms.new</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-[#080d1a] border-[#1e2a42] text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Input 2: Label / Nama Form */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Label / Nama Form
              </label>
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="Contoh: UTS Biologi Kelompok 1"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-[#080d1a] border-[#1e2a42] text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Input 3: Target Kelas */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Target Kelas
              </label>
              <select
                value={targetClassInput}
                onChange={(e) => setTargetClassInput(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-[#080d1a] border-[#1e2a42] text-white focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="Semua Kelas">Semua Kelas</option>
                <option value="Kelas 7A">Kelas 7A</option>
                <option value="Kelas 7B">Kelas 7B</option>
                <option value="Kelas 8A">Kelas 8A</option>
                <option value="Kelas 8B">Kelas 8B</option>
                <option value="Kelas 9A">Kelas 9A</option>
                <option value="Kelas 9B">Kelas 9B</option>
              </select>
            </div>

            {/* Submit Button: Simpan */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#5046e5] hover:bg-[#4338ca] shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Form</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Section: Daftar Google Form Tersimpan (Ada Aktif & Ada Non Aktif + Hitungan Jam Mundur) */}
      <div
        className={`rounded-2xl border overflow-hidden transition-colors ${
          isDarkMode ? 'bg-[#0b1220] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* Header toolbar with Title, Tabs (Semua / Aktif / Non Aktif), and Search */}
        <div className="p-4 sm:p-5 border-b border-slate-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Daftar Google Form Tersimpan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {googleForms.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kelola status Aktif / Non-Aktif dan pantau hitungan jam mundur ujian secara langsung
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Tabs */}
            <div className={`p-1 rounded-xl flex items-center gap-1 border ${
              isDarkMode ? 'bg-[#080d1a] border-[#172235]' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({googleForms.length})
              </button>
              <button
                onClick={() => setFilterTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterTab === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Aktif ({activeCount})
              </button>
              <button
                onClick={() => setFilterTab('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === 'inactive'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Non-Aktif ({inactiveCount})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari form atau token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-colors w-44 sm:w-52 ${
                  isDarkMode
                    ? 'bg-[#080d1a] border-[#1e2a42] text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Forms Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-slate-400 uppercase tracking-wider font-semibold text-[11px] ${
                isDarkMode ? 'bg-[#080d1a] border-[#172235]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <tr>
                <th className="py-3.5 px-5">NAMA FORMULIR</th>
                <th className="py-3.5 px-4">TOKEN SISWA</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">HITUNGAN JAM MUNDUR</th>
                <th className="py-3.5 px-4">ALAMAT GOOGLE FORM</th>
                <th className="py-3.5 px-5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-[#172235]' : 'divide-slate-200'}`}>
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-600" />
                      <p className="font-semibold">Tidak ada Google Form yang sesuai kriteria.</p>
                      <p className="text-[11px] text-slate-500">
                        {filterTab !== 'all'
                          ? `Ubah filter tab atau tambahkan form baru.`
                          : `Tambahkan Google Form manual di atas.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredForms.map((item) => {
                  const isAktif = item.status === 'Aktif';
                  const remaining = getRemainingTime(item.expiresAt, isAktif);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isAktif
                          ? isDarkMode
                            ? 'bg-emerald-950/10 hover:bg-emerald-950/20'
                            : 'bg-emerald-50/30 hover:bg-emerald-50/50'
                          : isDarkMode
                          ? 'hover:bg-[#0f172a]'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* 1. Nama Formulir */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isAktif
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {item.name}
                              </span>
                              {isAktif && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {item.questionCount} Butir Soal
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700/40 text-slate-300">
                                {item.targetClass || 'Semua Kelas'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                • {item.createdAt}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Token Siswa */}
                      <td className="py-4 px-4 font-mono">
                        {item.token ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider border shadow-sm ${
                                isAktif
                                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
                              }`}
                            >
                              {item.token}
                            </span>
                            <button
                              onClick={() => handleCopyToken(item.token!, item.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                              title="Salin Kode Token"
                            >
                              {copiedTokenId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenActivationModal(item)}
                            className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <Key className="w-3 h-3" />
                            <span>Buat Token</span>
                          </button>
                        )}
                      </td>

                      {/* 3. Status (Aktif / Non-Aktif with Toggle Switch) */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleDirectToggleStatus(item)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isAktif ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                            title={isAktif ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan Token & Hitungan Mundur'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isAktif ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Status Badge */}
                          {isAktif ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                              <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                              <span>Non-Aktif</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Hitungan Jam Mundur (Live Countdown Timer) */}
                      <td className="py-4 px-4">
                        {isAktif && remaining ? (
                          remaining.isExpired ? (
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Kedaluwarsa (00:00:00)</span>
                              </div>
                              <div>
                                <button
                                  onClick={() => handleOpenActivationModal(item)}
                                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Perpanjang / Aktifkan Lagi</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {/* Digital Clock Display */}
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl font-mono text-xs font-bold border shadow-sm transition-all ${
                                  remaining.isUrgent
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                <Timer className={`w-3.5 h-3.5 ${remaining.isUrgent ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
                                <span className="tracking-widest text-[13px]">{remaining.formatted}</span>
                                <span className="text-[10px] uppercase font-sans text-emerald-400/80">
                                  {remaining.hours > 0 ? 'WIB' : 'Mundur'}
                                </span>
                              </div>

                              {/* Quick Time Extension Buttons */}
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-500">Tambah:</span>
                                <button
                                  onClick={() => handleQuickAddMinutes(item.id, 15)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 transition-colors"
                                  title="Tambah 15 menit ke hitungan mundur"
                                >
                                  +15m
                                </button>
                                <button
                                  onClick={() => handleQuickAddMinutes(item.id, 30)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 transition-colors"
                                  title="Tambah 30 menit ke hitungan mundur"
                                >
                                  +30m
                                </button>
                                <button
                                  onClick={() => handleOpenActivationModal(item)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 border border-slate-700 transition-colors"
                                  title="Atur ulang jam dan tanggal kedaluwarsa"
                                >
                                  Atur
                                </button>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-600" />
                            <span>Menunggu Token Diaktifkan</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Alamat Google Form */}
                      <td className="py-4 px-4 text-slate-400 font-mono text-[11px] max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline flex items-center gap-1 group font-medium"
                            title="Buka Alamat Google Form di tab baru"
                          >
                            <span className="truncate max-w-[150px]">{item.url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                          <button
                            onClick={() => handleCopyFormUrl(item)}
                            className="p-1 rounded text-slate-500 hover:text-slate-200 transition-colors shrink-0"
                            title="Salin Alamat Google Form Persis Seperti Dilihat"
                          >
                            {copiedId === `form-${item.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 6. Aksi */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Buka Alamat Google Form Langsung */}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                            title="Buka Google Form Siswa (Pengerjaan)"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Edit Form in Google Forms if editUrl available */}
                          {item.editUrl && (
                            <a
                              href={item.editUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                              title="Edit Kuis di Google Forms Editor"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </a>
                          )}

                          {/* Buka di Google Drive */}
                          <a
                            href="https://drive.google.com/drive/search?q=v2-soalpintar.ai"
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                            title="Buka Folder v2-soalpintar.ai di Google Drive"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </a>

                          {/* Live Proctoring Shortcut */}
                          {isAktif && onNavigate && (
                            <button
                              onClick={() => onNavigate('ujian-live')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 transition-all flex items-center gap-1"
                              title="Pantau Live Siswa"
                            >
                              <Radio className="w-3 h-3 animate-pulse" />
                              <span className="hidden sm:inline">Ujian Live</span>
                            </button>
                          )}

                          {/* Quick Activation / Settings */}
                          <button
                            onClick={() => handleOpenActivationModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            title="Atur Token & Durasi Hitungan Mundur"
                          >
                            <Clock className="w-4 h-4" />
                          </button>

                          {/* Copy Link Web Siswa */}
                          <button
                            onClick={() => handleCopyStudentLink(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Salin Tautan Web Siswa (Pengerjaan)"
                          >
                            {copiedId === `student-${item.id}` ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete Form */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Form"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: AKTIFKAN TOKEN & HITUNGAN JAM MUNDUR */}
      {selectedFormForActivation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl transition-all ${
              isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Aktifkan Token & Hitungan Mundur
                  </h3>
                  <p className="text-xs text-slate-400">{selectedFormForActivation.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFormForActivation(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4">
              {/* Token Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kode Token Siswa
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Key className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={modalToken}
                      onChange={(e) => setModalToken(e.target.value.toUpperCase())}
                      placeholder="SPT-XXXX"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl font-mono text-sm font-bold border outline-none ${
                        isDarkMode
                          ? 'bg-[#080d1a] border-slate-700 text-emerald-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateRandomToken}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Acak</span>
                  </button>
                </div>
              </div>

              {/* Target Class */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Kelas Siswa
                </label>
                <select
                  value={modalTargetClass}
                  onChange={(e) => setModalTargetClass(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none ${
                    isDarkMode ? 'bg-[#080d1a] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  <option value="Kelas 7A">Kelas 7A</option>
                  <option value="Kelas 7B">Kelas 7B</option>
                  <option value="Kelas 8A">Kelas 8A</option>
                  <option value="Kelas 8B">Kelas 8B</option>
                  <option value="Kelas 9A">Kelas 9A</option>
                  <option value="Kelas 9B">Kelas 9B</option>
                </select>
              </div>

              {/* Hitungan Jam Mundur Preset */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Durasi Hitungan Jam Mundur Ujian
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '45 Menit', value: 45 },
                    { label: '60 Menit', value: 60 },
                    { label: '90 Menit', value: 90 },
                    { label: '120 Menit', value: 120 }
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        setModalDurationMinutes(p.value);
                        setModalUseCustomExpiry(false);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        !modalUseCustomExpiry && modalDurationMinutes === p.value
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date & Time Option */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalUseCustomExpiry(!modalUseCustomExpiry)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-300 hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Pilih Jam & Tanggal Kustom (Kedaluwarsa Spesifik)</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    modalUseCustomExpiry ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {modalUseCustomExpiry ? 'Aktif' : 'Gunakan'}
                  </span>
                </button>

                {modalUseCustomExpiry && (
                  <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Tanggal Berakhir</label>
                      <input
                        type="date"
                        value={modalCustomDate}
                        onChange={(e) => setModalCustomDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                          isDarkMode ? 'bg-[#080d1a] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Jam Berakhir (WIB)</label>
                      <input
                        type="time"
                        value={modalCustomTime}
                        onChange={(e) => setModalCustomTime(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                          isDarkMode ? 'bg-[#080d1a] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Info Banner */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5 text-xs text-indigo-300">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  Setelah diaktifkan, hitungan mundur otomatis dimulai, token langsung dapat diakses oleh siswa di aplikasi Safe Exam Browser, dan status beralih menjadi <strong>AKTIF</strong>.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() => setSelectedFormForActivation(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmActivation}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mulai Hitungan Mundur & Aktifkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional Accordion: Buat Otomatis via Google Apps Script */}
      <div
        className={`rounded-2xl border transition-colors ${
          isDarkMode ? 'bg-[#0b1220] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <button
          onClick={() => setShowAutoScript(!showAutoScript)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-slate-300 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Atau: Buat Google Form Baru Otomatis dari Bank Soal via Skrip</span>
          </div>
          {showAutoScript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAutoScript && (
          <div className="p-4 pt-0 border-t border-slate-700/30 text-xs space-y-3">
            <p className="text-slate-400">
              Salin kode berikut ke <strong>script.google.com</strong> untuk mengekspor otomatis {questions.length} butir Bank Soal menjadi formulir kuis:
            </p>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-3">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                <span className="font-mono">Google Apps Script</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateAutoScript());
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold flex items-center gap-1"
                >
                  {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedScript ? 'Tersalin' : 'Salin Skrip'}</span>
                </button>
              </div>
              <pre className="text-emerald-300/90 font-mono text-[11px] overflow-x-auto max-h-48">
                {generateAutoScript()}
              </pre>
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
      </div>
    </div>
  );
};
