import React from 'react';
import {
  Layers,
  HelpCircle,
  FileText,
  KeyRound,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Zap,
  ArrowRight,
  Check,
  X,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { SubscriptionInfo, QuestionItem, ExamSession, StudentProgress, NavTab } from '../../types';

interface DashboardViewProps {
  subscription: SubscriptionInfo;
  questions: QuestionItem[];
  examSession: ExamSession;
  students: StudentProgress[];
  isDarkMode: boolean;
  googleFormsCount?: number;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  subscription,
  questions,
  examSession,
  students,
  isDarkMode,
  googleFormsCount = 2,
  onNavigate
}) => {
  const [selectedQuizPreview, setSelectedQuizPreview] = React.useState<boolean>(false);
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Row 1: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Quiz */}
        <div
          onClick={() => onNavigate('ujian-live')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all hover:border-slate-600 ${
            isDarkMode ? 'bg-[#0b1120] border-[#1a2333]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#1e1b4b]/80 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight tabular-nums">
            1
          </div>
          <div className="text-xs text-slate-400 mt-2 font-medium">
            Total Quiz
          </div>
        </div>

        {/* Card 2: Total Soal */}
        <div
          onClick={() => onNavigate('bank-soal')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all hover:border-slate-600 ${
            isDarkMode ? 'bg-[#0b1120] border-[#1a2333]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#042f2e]/80 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight tabular-nums">
            {questions.length >= 10 ? questions.length : 10}
          </div>
          <div className="text-xs text-slate-400 mt-2 font-medium">
            Total Soal
          </div>
        </div>

        {/* Card 3: Google Forms */}
        <div
          onClick={() => onNavigate('google-forms')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all hover:border-slate-600 ${
            isDarkMode ? 'bg-[#0b1120] border-[#1a2333]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#451a03]/80 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight tabular-nums">
            {googleFormsCount}
          </div>
          <div className="text-xs text-slate-400 mt-2 font-medium">
            Google Forms
          </div>
        </div>

        {/* Card 4: Token Aktif */}
        <div
          onClick={() => onNavigate('token-siswa')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all hover:border-slate-600 ${
            isDarkMode ? 'bg-[#0b1120] border-[#1a2333]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#4c0519]/80 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight tabular-nums">
            0<span className="text-xl font-normal text-slate-400">/0</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-medium">
            Token Aktif
          </div>
        </div>
      </div>

      {/* Row 2: Pelanggaran Ujian (Full Width) */}
      <div
        className={`rounded-2xl border p-6 transition-colors ${
          isDarkMode ? 'bg-[#0b1120] border-[#1a2333]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#450a0a]/70 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Pelanggaran Ujian
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                0 pelanggaran hari ini · menampilkan 24 jam terakhir
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('riwayat-pelanggaran')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <span>Lihat riwayat lengkap</span>
            <span>→</span>
          </button>
        </div>

        {/* Empty state message matching screenshot */}
        <div className="py-8 text-center text-xs text-slate-400">
          Belum ada pelanggaran dalam 24 jam terakhir. 👍
        </div>
      </div>

      {/* Row 3: Bottom Two Columns (Aksi Cepat & Quiz Terbaru) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Aksi Cepat (approx 4.5 cols of 12) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className={`text-base font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Aksi Cepat
          </h3>

          <div className="space-y-3">
            {/* Action 1: Generate Soal AI */}
            <div
              onClick={() => onNavigate('ai-generator')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:border-cyan-500/50 ${
                isDarkMode ? 'bg-[#0e1626] border-[#1b253b] hover:bg-[#121c30]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/90 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Generate Soal AI
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Buat soal otomatis dengan AI
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Action 2: Bank Soal */}
            <div
              onClick={() => onNavigate('bank-soal')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:border-indigo-500/50 ${
                isDarkMode ? 'bg-[#0e1626] border-[#1b253b] hover:bg-[#121c30]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/90 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Bank Soal
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Lihat koleksi soal Anda
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Action 3: Token Siswa */}
            <div
              onClick={() => onNavigate('token-siswa')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:border-amber-500/50 ${
                isDarkMode ? 'bg-[#0e1626] border-[#1b253b] hover:bg-[#121c30]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/90 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Token Siswa
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Kelola token akses ujian
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Action 4: Distribusi Google Form */}
            <div
              onClick={() => onNavigate('google-forms')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:border-purple-500/50 ${
                isDarkMode ? 'bg-[#0e1626] border-[#1b253b] hover:bg-[#121c30]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/90 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Distribusi Google Form
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Kelola form, token & hitungan mundur
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Action 4: Paket Anda Card with Upgrade link below */}
            <div
              className={`rounded-xl border transition-colors ${
                isDarkMode
                  ? 'bg-[#0c1829]/70 border-emerald-900/40 hover:border-emerald-500/40'
                  : 'bg-emerald-50/50 border-emerald-200 shadow-sm'
              }`}
            >
              {/* Clickable upper section */}
              <div
                onClick={() => onNavigate('status-paket')}
                className="p-4 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/90 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Paket Anda</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {subscription.tierName}
                    </div>
                    <div className="text-xs text-emerald-400/90 font-medium mt-0.5">
                      Siswa ujian bersamaan tanpa batas
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">
                      Aktif s/d {subscription.activeUntil}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Bottom upgrade strip */}
              <div
                onClick={() => onNavigate('perpanjang-paket')}
                className={`px-4 py-3 border-t flex items-center gap-2 cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'border-[#172b47] hover:bg-[#102238] text-slate-300'
                    : 'border-emerald-100 hover:bg-emerald-100/60 text-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-medium truncate">
                  Upgrade Paket Sekolah Pro: siswa tanpa batas + 10 akun guru
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quiz Terbaru (approx 8 cols of 12) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Quiz Terbaru
            </h3>
            <button
              onClick={() => onNavigate('bank-soal')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
            >
              <span>Lihat Semua</span>
              <span>→</span>
            </button>
          </div>

          {/* Quiz Card matching screenshot */}
          <div
            className={`rounded-2xl border p-5 min-h-[360px] flex flex-col justify-start transition-colors ${
              isDarkMode ? 'bg-[#0b1120] border-[#1a2333]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div
              onClick={() => setSelectedQuizPreview(true)}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                isDarkMode
                  ? 'bg-[#0e1626] border-[#1b253b] hover:border-slate-600 hover:bg-[#121c30]'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* SMP Badge */}
                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center font-extrabold text-xs tracking-wider shadow-sm shrink-0">
                  SMP
                </div>

                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Bangun Ruang Tabung Sisi Lengkung
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    10 soal · 59 minutes ago
                  </p>
                </div>
              </div>

              {/* Badges on right side */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#064e3b]/90 text-emerald-400 border border-emerald-500/30">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Form</span>
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#064e3b]/90 text-emerald-400 border border-emerald-500/30">
                  Published
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Quiz Preview */}
      {selectedQuizPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 max-h-[85vh] overflow-y-auto ${
              isDarkMode ? 'bg-[#0c1424] border-[#1e2d48] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center font-bold text-xs">
                  SMP
                </div>
                <div>
                  <h3 className="font-bold text-base">Bangun Ruang Tabung Sisi Lengkung</h3>
                  <p className="text-[11px] text-slate-400">10 Soal Pilihan Ganda · Google Form Published</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuizPreview(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400">Ringkasan Materi:</span>
                <p className="text-slate-200">
                  Menghitung luas permukaan tabung, volume tabung, selimut tabung, serta penerapan dalam masalah kontekstual kehidupan sehari-hari (tangki air, drum minyak).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Status Google Form:</span>
                  <div className="text-emerald-400 font-bold mt-0.5">Terkoneksi (Published)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Tingkat Kesulitan:</span>
                  <div className="text-amber-400 font-bold mt-0.5">Sedang - HOTS</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-700/40 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setSelectedQuizPreview(false);
                  onNavigate('bank-soal');
                }}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold"
              >
                Buka di Bank Soal
              </button>
              <button
                onClick={() => {
                  setSelectedQuizPreview(false);
                  onNavigate('ujian-live');
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/20"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Mulai Ujian Live</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
