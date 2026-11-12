import React from 'react';
import { Menu, Sun, Moon, Activity } from 'lucide-react';
import { NavTab } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  apiConnected: boolean;
  apiLatency: number;
  customHeaderTitle?: string;
  customHeaderSubtitle?: string;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
  'status-paket': {
    title: 'Status Paket & Riwayat',
    subtitle: 'Lihat status langganan dan riwayat transaksi Anda.'
  },
  'dashboard': {
    title: 'Dashboard',
    subtitle: 'Selamat datang, Yana Periyana!'
  },
  'ai-generator': {
    title: 'AI Generator',
    subtitle: 'Generate soal otomatis dengan kecerdasan buatan untuk guru.'
  },
  'bank-soal': {
    title: 'Bank Soal Guru',
    subtitle: 'Kelola, kategorikan, dan ekspor koleksi butir soal ujian Anda.'
  },
  'ujian-live': {
    title: 'Ujian Live',
    subtitle: 'Tampilkan QR untuk siswa dan pantau siswa yang sedang mengerjakan ujian'
  },
  'token-siswa': {
    title: 'Token Siswa',
    subtitle: 'Buat dan kelola token akses ujian untuk siswa'
  },
  'nilai-siswa': {
    title: 'Rekap & Analisis Nilai Siswa',
    subtitle: 'Laporan perolehan nilai, ketuntasan belajar, dan ekspor lembar nilai.'
  },
  'riwayat-pelanggaran': {
    title: 'Riwayat Pelanggaran',
    subtitle: 'Setiap peringatan & blokir siswa saat ujian, lengkap dengan penyebabnya'
  },
  'google-forms': {
    title: 'Distribusi Google Form',
    subtitle: 'Daftar Google Form tersimpan, status aktif/non-aktif, alamat Google Form & hitungan jam mundur.'
  },
  'download-aplikasi': {
    title: 'Download Aplikasi Guru & Siswa',
    subtitle: 'Unduh aplikasi desktop & mobile untuk pelaksanaan ujian yang lebih aman.'
  },
  'yang-baru': {
    title: 'Pembaruan Fitur Terbaru',
    subtitle: 'Ketahui fitur-fitur baru dan rilis sistem soalpintar.ai.'
  },
  'perpanjang-paket': {
    title: 'Paket Langganan & Fitur',
    subtitle: 'Pilih paket terbaik untuk kebutuhan evaluasi pembelajaran mandiri atau sekolah.'
  },
  'panduan': {
    title: 'Panduan Penggunaan',
    subtitle: 'Tutorial langkah demi langkah memaksimalkan fitur soalpintar.ai.'
  },
  'settings': {
    title: 'Settings',
    subtitle: 'Konfigurasi Google Apps Script untuk membuat Google Form'
  },
  'ujian-siswa': {
    title: 'Portal Ujian Web Siswa',
    subtitle: 'Secure Exam Player: Mode aman ujian proctoring untuk siswa'
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  isDarkMode,
  onToggleTheme,
  onOpenMobileMenu,
  apiConnected,
  apiLatency,
  customHeaderTitle,
  customHeaderSubtitle
}) => {
  const currentInfo = tabTitles[currentTab] || {
    title: 'Panel Guru',
    subtitle: 'Platform Cerdas Pembuatan Soal & Ujian Online'
  };

  const title = customHeaderTitle || currentInfo.title;
  const subtitle = customHeaderSubtitle || currentInfo.subtitle;

  return (
    <header className={`px-4 lg:px-8 py-5 border-b sticky top-0 z-30 transition-colors ${
      isDarkMode
        ? 'bg-[#080d1a]/95 backdrop-blur-md border-[#151d2f]'
        : 'bg-white/95 backdrop-blur-md border-slate-200'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className={`p-2 rounded-lg lg:hidden transition-colors ${
              isDarkMode ? 'text-slate-300 hover:bg-[#151d2f]' : 'text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className={`text-xl lg:text-2xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {title}
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {currentTab !== 'token-siswa' && currentTab !== 'ujian-live' && currentTab !== 'riwayat-pelanggaran' && (
            <>
              {/* Real-time API Connection Pill */}
              <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${
                apiConnected
                  ? isDarkMode
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span className="tabular-nums font-mono text-[11px]">
                  API Real-time: {apiLatency}ms
                </span>
              </div>

              {/* Theme switcher */}
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-lg transition-colors border ${
                  isDarkMode
                    ? 'border-[#1e293b] text-slate-300 hover:text-white hover:bg-[#151d2f]'
                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
            </>
          )}

          {/* Screenshot-exact Badge Guru */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#062c21] text-emerald-400 border border-emerald-600/40 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Guru</span>
          </div>
        </div>
      </div>
    </header>
  );
};
