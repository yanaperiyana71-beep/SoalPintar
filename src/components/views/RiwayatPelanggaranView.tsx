import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  User,
  Download,
  CheckCircle,
  FileText,
  Shield,
  Search,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Unlock,
  Trash2,
  Filter
} from 'lucide-react';
import { CheatingViolation, NavTab, ExamTokenItem } from '../../types';
import confetti from 'canvas-confetti';

interface ViolationRecordItem {
  id: string;
  timestamp: string;
  studentName: string;
  classGroup: string;
  token: string;
  violationType: string;
  isBlocked: boolean;
  severity: 'Rendah' | 'Sedang' | 'Tinggi';
}

interface RiwayatPelanggaranViewProps {
  violations: CheatingViolation[];
  isDarkMode: boolean;
  onNavigate?: (tab: NavTab) => void;
}

export const RiwayatPelanggaranView: React.FC<RiwayatPelanggaranViewProps> = ({
  violations: initialViolations,
  isDarkMode,
  onNavigate
}) => {
  // Filter form states matching screenshot
  const [periode, setPeriode] = useState<string>('Hari ini');
  const [selectedToken, setSelectedToken] = useState<string>('Semua token');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [onlyBlocked, setOnlyBlocked] = useState<boolean>(false);

  // Applied filter state (triggers on clicking 'Terapkan')
  const [appliedFilters, setAppliedFilters] = useState({
    periode: 'Hari ini',
    token: 'Semua token',
    keyword: '',
    onlyBlocked: false
  });

  // Available tokens for dropdown
  const [availableTokens, setAvailableTokens] = useState<string[]>(['Semua token', 'ZJT0P4M']);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('soalpintar_token_list');
      if (saved) {
        const tokens: ExamTokenItem[] = JSON.parse(saved);
        const codes = tokens.map((t) => t.token);
        setAvailableTokens(['Semua token', ...Array.from(new Set(codes))]);
      }
    } catch (e) {
      console.warn('Failed to parse tokens for violations filter:', e);
    }
  }, []);

  // Violations log list
  // Initialized to empty to match screenshot default state (Total: 0, Siswa: 0, Diblokir: 0)
  const [violationsList, setViolationsList] = useState<ViolationRecordItem[]>(() => {
    try {
      const saved = localStorage.getItem('soalpintar_violations_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse violations records:', e);
    }
    // Default empty to match screenshot
    return [];
  });

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('soalpintar_violations_records', JSON.stringify(violationsList));
    } catch (e) {
      console.warn('Failed to save violations records:', e);
    }
  }, [violationsList]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Apply filters handler
  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      periode,
      token: selectedToken,
      keyword: searchKeyword.trim().toLowerCase(),
      onlyBlocked
    });
    showToast('Filter berhasil diterapkan!');
  };

  // Filtered list
  const filteredViolations = violationsList.filter((item) => {
    if (appliedFilters.token !== 'Semua token' && item.token !== appliedFilters.token) {
      return false;
    }
    if (appliedFilters.onlyBlocked && !item.isBlocked) {
      return false;
    }
    if (appliedFilters.keyword) {
      const matchName = item.studentName.toLowerCase().includes(appliedFilters.keyword);
      const matchClass = item.classGroup.toLowerCase().includes(appliedFilters.keyword);
      if (!matchName && !matchClass) return false;
    }
    return true;
  });

  // Metric computations
  const totalPelanggaran = filteredViolations.length;
  const uniqueStudentsCount = new Set(filteredViolations.map((v) => v.studentName)).size;
  const diblokirCount = filteredViolations.filter((v) => v.isBlocked).length;

  // Most common cause computation
  const causeCounts: Record<string, number> = {};
  filteredViolations.forEach((v) => {
    causeCounts[v.violationType] = (causeCounts[v.violationType] || 0) + 1;
  });
  let topCause = '—';
  let maxCount = 0;
  Object.entries(causeCounts).forEach(([cause, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topCause = `${cause} (${count} insiden)`;
    }
  });

  // Action: Unblock student
  const handleUnblock = (studentName: string) => {
    setViolationsList((prev) =>
      prev.map((v) => {
        if (v.studentName === studentName) {
          return { ...v, isBlocked: false };
        }
        return v;
      })
    );

    // Also update student status in pantau list if exists
    try {
      const savedPantau = localStorage.getItem('soalpintar_pantau_students');
      if (savedPantau) {
        const list = JSON.parse(savedPantau);
        const updated = list.map((s: { name: string; status: string }) => {
          if (s.name === studentName) {
            return { ...s, status: 'Mengerjakan', violationsCount: 0 };
          }
          return s;
        });
        localStorage.setItem('soalpintar_pantau_students', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Error updating pantau list:', e);
    }

    showToast(`Blokir untuk siswa "${studentName}" berhasil dibuka! 🔓`);
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch {
      // fallback
    }
  };

  // Action: Simulate a sample violation for testing
  const handleSimulateViolation = () => {
    const sampleViolations = [
      'Pindah Tab Browser',
      'Keluar dari Fullscreen',
      'Layar Terbelah (Split Screen)',
      'Upaya Salin Teks (Copy-Paste)',
      'Floating App / Background'
    ];
    const sampleStudents = [
      { name: 'Budi Pratama', classGroup: '9B' },
      { name: 'Yan', classGroup: '9B · absen 1' },
      { name: 'Siti Rahma', classGroup: '9A' }
    ];

    const randomStudent = sampleStudents[Math.floor(Math.random() * sampleStudents.length)];
    const randomType = sampleViolations[Math.floor(Math.random() * sampleViolations.length)];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: ViolationRecordItem = {
      id: `viol-${Date.now()}`,
      timestamp: `Hari ini, ${timeStr}`,
      studentName: randomStudent.name,
      classGroup: randomStudent.classGroup,
      token: selectedToken !== 'Semua token' ? selectedToken : 'ZJT0P4M',
      violationType: randomType,
      isBlocked: Math.random() > 0.5,
      severity: 'Tinggi'
    };

    setViolationsList((prev) => [newRecord, ...prev]);
    showToast(`Simulasi pelanggaran ditambahkan untuk ${randomStudent.name}!`);
  };

  // Action: Reset filter to screenshot state
  const handleResetToDefault = () => {
    setViolationsList([]);
    localStorage.removeItem('soalpintar_violations_records');
    setPeriode('Hari ini');
    setSelectedToken('Semua token');
    setSearchKeyword('');
    setOnlyBlocked(false);
    setAppliedFilters({
      periode: 'Hari ini',
      token: 'Semua token',
      keyword: '',
      onlyBlocked: false
    });
    showToast('Tampilan riwayat pelanggaran di-reset ke status bersih (0 insiden).');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-fadeIn">
      {/* 1. TOP FILTER BAR CARD MATCHING SCREENSHOT */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDarkMode ? 'bg-[#0c1424] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <form onSubmit={handleApplyFilter} className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3.5">
          {/* Periode Dropdown */}
          <div className="w-full lg:w-40 shrink-0">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Periode
            </label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
                isDarkMode
                  ? 'bg-[#080d19] border-[#1e2a42] text-white focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="Hari ini">Hari ini</option>
              <option value="7 hari terakhir">7 hari terakhir</option>
              <option value="30 hari terakhir">30 hari terakhir</option>
              <option value="Semua waktu">Semua waktu</option>
            </select>
          </div>

          {/* Token Dropdown */}
          <div className="w-full lg:w-44 shrink-0">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
                isDarkMode
                  ? 'bg-[#080d19] border-[#1e2a42] text-white focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {availableTokens.map((tok) => (
                <option key={tok} value={tok}>
                  {tok}
                </option>
              ))}
            </select>
          </div>

          {/* Cari siswa / kelas Input */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Cari siswa / kelas
            </label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Nama atau kelas"
              className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none ${
                isDarkMode
                  ? 'bg-[#080d19] border-[#1e2a42] text-white placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Checkbox "Hanya yang diblokir" & Button "Terapkan" */}
          <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0 pt-2 lg:pt-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyBlocked}
                onChange={(e) => setOnlyBlocked(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Hanya yang diblokir
              </span>
            </label>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#4f46e5] hover:bg-[#4338ca] shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              Terapkan
            </button>
          </div>
        </form>
      </div>

      {/* 2. 3 METRIC SUMMARY CARDS MATCHING SCREENSHOT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total pelanggaran */}
        <div
          className={`p-5 rounded-2xl border transition-colors ${
            isDarkMode ? 'bg-[#0c1424] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs text-slate-400 font-medium">Total pelanggaran</span>
          <div className="text-3xl font-bold font-mono text-white mt-2">
            {totalPelanggaran}
          </div>
        </div>

        {/* Card 2: Perangkat / siswa terlibat */}
        <div
          className={`p-5 rounded-2xl border transition-colors ${
            isDarkMode ? 'bg-[#0c1424] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs text-slate-400 font-medium">Perangkat / siswa terlibat</span>
          <div className="text-3xl font-bold font-mono text-white mt-2">
            {uniqueStudentsCount}
          </div>
        </div>

        {/* Card 3: Diblokir (batas tercapai) */}
        <div
          className={`p-5 rounded-2xl border transition-colors ${
            isDarkMode ? 'bg-[#0c1424] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs text-slate-400 font-medium">Diblokir (batas tercapai)</span>
          <div className="text-3xl font-bold font-mono text-rose-400 mt-2">
            {diblokirCount}
          </div>
        </div>
      </div>

      {/* 3. LOWER SECTION: LEFT LOG/EMPTY CARD + RIGHT PENYEBAB TERBANYAK CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Main Card (spans 3 cols) */}
        <div
          className={`lg:col-span-3 rounded-2xl border p-6 flex flex-col justify-center transition-colors min-h-[300px] ${
            isDarkMode ? 'bg-[#0c1424] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {filteredViolations.length === 0 ? (
            /* Screenshot-exact Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                <Shield className="w-8 h-8 stroke-[1.6]" />
              </div>
              <p className="text-slate-400 text-sm font-medium">
                Tidak ada pelanggaran pada filter ini.
              </p>

              {/* Simulation Helper Button */}
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={handleSimulateViolation}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Simulasi Catatan Pelanggaran</span>
                </button>
              </div>
            </div>
          ) : (
            /* Table of Violations when records exist */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-sm text-white">
                    Daftar Insiden Pelanggaran ({filteredViolations.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateViolation}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>+ Simulasi</span>
                  </button>
                  <button
                    onClick={handleResetToDefault}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
                    title="Kosongkan catatan pelanggaran"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">WAKTU</th>
                      <th className="py-2.5 px-3">SISWA</th>
                      <th className="py-2.5 px-3">TOKEN</th>
                      <th className="py-2.5 px-3">JENIS PELANGGARAN</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredViolations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {item.timestamp}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{item.studentName}</span>
                          <span className="text-[11px] text-slate-400">{item.classGroup}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-800 text-indigo-300 border border-slate-700">
                            {item.token}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {item.violationType}
                        </td>
                        <td className="py-3 px-3">
                          {item.isBlocked ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#381018] text-rose-400 border border-rose-600/30">
                              Diblokir
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/60 text-amber-400 border border-amber-600/30">
                              Peringatan
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {item.isBlocked ? (
                            <button
                              onClick={() => handleUnblock(item.studentName)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#152345] hover:bg-[#1c3060] text-indigo-300 border border-[#213565] transition-all"
                            >
                              Buka Blokir
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Card: Penyebab terbanyak (spans 1 col) */}
        <div
          className={`lg:col-span-1 rounded-2xl border p-6 flex flex-col justify-between transition-colors ${
            isDarkMode ? 'bg-[#0c1424] border-[#172235]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Penyebab terbanyak
            </h3>
            <p className="text-slate-400 text-sm mt-3 mb-6">
              {topCause}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/60">
            <p className="text-xs text-slate-400 leading-relaxed">
              Siswa yang diblokir bisa dibuka lagi dari menu{' '}
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('token-siswa');
                  }
                }}
                className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold"
              >
                Token Siswa → Kelola Perangkat
              </button>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white border border-indigo-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-fadeIn max-w-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1 truncate">{toastMessage}</div>
        </div>
      )}
    </div>
  );
};
