import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  FileSpreadsheet,
  KeyRound,
  Radio,
  ClipboardCheck,
  ShieldAlert,
  Smartphone,
  Receipt,
  Flame,
  CalendarPlus,
  HelpCircle,
  Moon,
  Sun,
  X,
  BookOpen,
  LogOut,
  Settings,
  Globe,
  ExternalLink
} from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  liveStudentsCount: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleTheme,
  mobileOpen,
  onCloseMobile,
  liveStudentsCount,
  onLogout
}) => {
  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navItemClass = (tab: NavTab) => {
    const isActive = currentTab === tab;
    if (isActive) {
      return isDarkMode
        ? 'bg-[#151e33] text-white border border-[#3b82f6]/40 shadow-sm shadow-blue-500/10'
        : 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold';
    }
    return isDarkMode
      ? 'text-slate-400 hover:text-slate-100 hover:bg-[#111827]/70'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDarkMode
            ? 'bg-[#080d1a] border-r border-[#151d2f]'
            : 'bg-white border-r border-slate-200 shadow-sm'
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-[#151d2f]' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/90 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <BookOpen className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className={`font-bold text-base tracking-tight leading-tight flex items-center gap-1.5 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                soalpintar.ai
              </div>
              <div className="text-xs text-slate-400 font-medium">Guru Panel</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleTheme}
              aria-label="Toggle Mode Gelap/Terang"
              title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-slate-400 hover:text-amber-400 hover:bg-[#151d2f]'
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Links Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-sm">
          {/* Section: General */}
          <div>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('dashboard')}`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="font-medium truncate">Dashboard</span>
            </button>
          </div>

          {/* Section: SOAL */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Soal
            </div>
            <button
              onClick={() => handleNavClick('ai-generator')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('ai-generator')}`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="font-medium truncate">AI Generator</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                AI
              </span>
            </button>

            <button
              onClick={() => handleNavClick('bank-soal')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('bank-soal')}`}
            >
              <Layers className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="font-medium truncate">Bank Soal</span>
            </button>
          </div>

          {/* Section: DISTRIBUSI */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Distribusi
            </div>
            <button
              onClick={() => handleNavClick('google-forms')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('google-forms')}`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-purple-400" />
              <span className="font-medium truncate">Distribusi Google Form</span>
            </button>

            <button
              onClick={() => handleNavClick('token-siswa')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('token-siswa')}`}
            >
              <KeyRound className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="font-medium truncate">Token Siswa</span>
            </button>

            <button
              onClick={() => handleNavClick('ujian-live')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('ujian-live')}`}
            >
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-medium truncate">Ujian Live</span>
              </div>
              {liveStudentsCount > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  Live
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('nilai-siswa')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('nilai-siswa')}`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium truncate">Nilai Siswa</span>
            </button>

            <button
              onClick={() => handleNavClick('riwayat-pelanggaran')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('riwayat-pelanggaran')}`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="font-medium truncate">Riwayat Pelanggaran</span>
            </button>

            <button
              onClick={() => handleNavClick('download-aplikasi')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('download-aplikasi')}`}
            >
              <Smartphone className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="font-medium truncate">Download Aplikasi</span>
            </button>
          </div>

          {/* Section: LANGGANAN */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Langganan
            </div>
            <button
              onClick={() => handleNavClick('status-paket')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('status-paket')}`}
            >
              <Receipt className="w-4 h-4 shrink-0 text-indigo-400" />
              <span className="font-medium truncate">Status Paket</span>
            </button>

            <button
              onClick={() => handleNavClick('yang-baru')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('yang-baru')}`}
            >
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="font-medium truncate">Yang Baru</span>
              </div>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                BARU
              </span>
            </button>

            <button
              onClick={() => handleNavClick('perpanjang-paket')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('perpanjang-paket')}`}
            >
              <CalendarPlus className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium truncate">Perpanjang Paket</span>
            </button>
          </div>

          {/* Section: BANTUAN */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Bantuan
            </div>
            <button
              onClick={() => handleNavClick('panduan')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('panduan')}`}
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="font-medium truncate">Panduan</span>
            </button>
          </div>

          {/* Section: PENGATURAN */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Pengaturan
            </div>
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${navItemClass('settings')}`}
            >
              <Settings className="w-4 h-4 shrink-0 text-indigo-400" />
              <span className="font-medium truncate">Settings</span>
            </button>
          </div>
        </div>

        {/* Footer User Info */}
        <div className={`p-3 border-t text-xs ${
          isDarkMode ? 'border-[#151d2f] text-slate-400' : 'border-slate-100 text-slate-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                GP
              </div>
              <div className="truncate">
                <div className={`font-semibold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  Bpk. Yana Periyana
                </div>
                <div className="text-[11px] text-slate-500 truncate">SMP Negeri 1</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                ● Guru
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Keluar / Ganti Akun"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
