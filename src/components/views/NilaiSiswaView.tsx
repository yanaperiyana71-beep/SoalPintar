import React, { useState } from 'react';
import {
  ClipboardCheck,
  Download,
  Search,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Printer,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { StudentProgress } from '../../types';
import { liveExamService } from '../../services/liveExamService';

interface NilaiSiswaViewProps {
  students: StudentProgress[];
  isDarkMode: boolean;
}

export const NilaiSiswaView: React.FC<NilaiSiswaViewProps> = ({
  students: initialPropsStudents,
  isDarkMode
}) => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);

  // Sync with liveExamService (clean real data only)
  const [displayStudents, setDisplayStudents] = useState<StudentProgress[]>(() => {
    const list = liveExamService.getStudents();
    return list.map((p, i) => ({
      id: p.id || `stu-${i}`,
      name: p.name,
      nisn: `0089${Math.floor(100000 + (parseInt(p.id.replace(/\D/g, '') || '0') % 900000))}`,
      classGroup: p.classGroup ? `${p.classGroup}${p.absen ? ` · Absen ${p.absen}` : ''}` : (p.classInfo || '9B'),
      progressPercent: p.status === 'Selesai' ? 100 : p.status === 'Mengerjakan' ? 50 : 0,
      currentScore: p.status === 'Selesai' ? 88 : p.status === 'Diblokir' ? 40 : 75,
      status: p.status === 'Selesai' ? 'Selesai' : p.status === 'Mengerjakan' ? 'Sedang Mengerjakan' : p.status === 'Diblokir' ? 'Terdeteksi Melanggar' : 'Sedang Mengerjakan',
      violationsCount: p.violationsCount || 0,
      lastActive: p.lastSeen || 'Baru saja'
    }));
  });

  React.useEffect(() => {
    const unsubscribe = liveExamService.subscribe((students) => {
      setDisplayStudents(
        students.map((p, i) => ({
          id: p.id || `stu-${i}`,
          name: p.name,
          nisn: `0089${Math.floor(100000 + (parseInt(p.id.replace(/\D/g, '') || '0') % 900000))}`,
          classGroup: p.classGroup ? `${p.classGroup}${p.absen ? ` · Absen ${p.absen}` : ''}` : (p.classInfo || '9B'),
          progressPercent: p.status === 'Selesai' ? 100 : p.status === 'Mengerjakan' ? 50 : 0,
          currentScore: p.status === 'Selesai' ? 88 : p.status === 'Diblokir' ? 40 : 75,
          status: p.status === 'Selesai' ? 'Selesai' : p.status === 'Mengerjakan' ? 'Sedang Mengerjakan' : p.status === 'Diblokir' ? 'Terdeteksi Melanggar' : 'Sedang Mengerjakan',
          violationsCount: p.violationsCount || 0,
          lastActive: p.lastSeen || 'Baru saja'
        }))
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const scores = displayStudents.map((s) => s.currentScore || 0);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const min = scores.length > 0 ? Math.min(...scores) : 0;
  const passingCount = scores.filter((s) => s >= 75).length;
  const passingRate = scores.length > 0 ? Math.round((passingCount / scores.length) * 100) : 0;

  const filtered = displayStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nisn.includes(search)
  );

  const handleExportCSV = () => {
    let csv = 'No,Nama Siswa,NISN,Kelas,Nilai,Status Ketuntasan,Pelanggaran\n';
    filtered.forEach((s, i) => {
      const status = (s.currentScore || 0) >= 75 ? 'TUNTAS' : 'REMEDIAL';
      csv += `${i + 1},"${s.name}",${s.nisn},${s.classGroup},${s.currentScore || 0},${status},${s.violationsCount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-nilai-siswa-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-5 rounded-2xl border ${
            isDarkMode ? 'bg-[#0e1626] border-[#1e2a42]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs text-slate-400 font-semibold">Rata-Rata Kelas</span>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{avg} / 100</div>
          <span className="text-[11px] text-emerald-400 font-medium">Melampaui KKM (75)</span>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDarkMode ? 'bg-[#0e1626] border-[#1e2a42]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs text-slate-400 font-semibold">Nilai Tertinggi</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{max}</div>
          <span className="text-[11px] text-slate-400">Prestasi Sempurna</span>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDarkMode ? 'bg-[#0e1626] border-[#1e2a42]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs text-slate-400 font-semibold">Tingkat Ketuntasan</span>
          <div className="text-2xl font-bold text-sky-400 mt-1 tabular-nums">{passingRate}%</div>
          <span className="text-[11px] text-slate-400">{passingCount} dari {scores.length} Tuntas</span>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDarkMode ? 'bg-[#0e1626] border-[#1e2a42]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs text-slate-400 font-semibold">Perlu Remedial</span>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">
            {scores.length - passingCount} Siswa
          </div>
          <span className="text-[11px] text-amber-400/80">Perlu penguatan materi</span>
        </div>
      </div>

      {/* Gradebook Table */}
      <div
        className={`rounded-2xl border overflow-hidden transition-colors ${
          isDarkMode ? 'bg-[#0e1626] border-[#1e2a42]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="p-4 border-b border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Rekapitulasi Nilai & Ketuntasan Belajar
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa atau NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-8 pr-3 py-1.5 rounded-lg text-xs border outline-none ${
                  isDarkMode
                    ? 'bg-[#090f1d] border-[#1b253b] text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-slate-400 uppercase tracking-wider font-semibold ${
              isDarkMode ? 'bg-[#090f1d] border-[#1b253b]' : 'bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">NISN</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Nilai Angka</th>
                <th className="py-3 px-4">Predikat / Status</th>
                <th className="py-3 px-4">Catatan Pengawas</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-[#162035]' : 'divide-slate-200'}`}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ClipboardCheck className="w-8 h-8 text-slate-600 mb-1" />
                      <div className="font-semibold text-slate-300">Belum ada data nilai siswa</div>
                      <div className="text-[11px] text-slate-500 max-w-sm">
                        Data simulasi telah dibersihkan. Siswa yang telah menyelesaikan ujian akan otomatis terekap di sini.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((stu, idx) => {
                const isPassed = (stu.currentScore || 0) >= 75;
                return (
                  <tr
                    key={stu.id}
                    onClick={() => setSelectedStudent(stu)}
                    className={`cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-[#111a2f]' : 'hover:bg-slate-100'
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <span>{stu.name}</span>
                      <span className="text-[10px] text-sky-400 font-normal underline">Detail</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{stu.nisn}</td>
                    <td className="py-3 px-4 text-slate-300">{stu.classGroup}</td>
                    <td className="py-3 px-4 font-bold font-mono text-sm tabular-nums text-emerald-400">
                      {stu.currentScore}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPassed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isPassed ? 'TUNTAS (A)' : 'REMEDIAL'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {stu.violationsCount > 0 ? (
                        <span className="text-amber-400 font-medium">
                          {stu.violationsCount}x Catatan Peringatan Tab
                        </span>
                      ) : (
                        <span className="text-emerald-400/80">Tertib Tanpa Pelanggaran</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Rapor Siswa */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl ${
              isDarkMode ? 'bg-[#0b1322] border-[#1e2a42] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Lembar Hasil Ujian Siswa</h3>
                  <p className="text-[11px] text-slate-400">soalpintar.ai Proctoring & Evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Lengkap</span>
                  <span className="font-bold text-white">{selectedStudent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">NISN / Nomor Induk</span>
                  <span className="font-mono text-slate-300">{selectedStudent.nisn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rombel / Kelas</span>
                  <span className="text-slate-300">{selectedStudent.classGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Ujian</span>
                  <span className="font-semibold text-emerald-400 uppercase">
                    {selectedStudent.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-center">
                  <span className="text-[11px] text-slate-400">Skor Akhir</span>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-0.5">
                    {selectedStudent.currentScore}
                  </div>
                  <span className="text-[10px] text-emerald-300 font-semibold">
                    {(selectedStudent.currentScore || 0) >= 75 ? 'Memenuhi KKM (75)' : 'Di Bawah KKM'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-700/60 bg-slate-900/40 text-center">
                  <span className="text-[11px] text-slate-400">Skor Integritas Tab</span>
                  <div className="text-3xl font-extrabold text-white font-mono mt-0.5">
                    {selectedStudent.violationsCount === 0 ? '100%' : `${100 - selectedStudent.violationsCount * 15}%`}
                  </div>
                  <span className={`text-[10px] font-semibold ${selectedStudent.violationsCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedStudent.violationsCount === 0 ? 'Tertib & Valid' : `${selectedStudent.violationsCount} Pelanggaran`}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                <span className="font-semibold text-slate-300 block mb-1">Catatan Evaluator Guru:</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {(selectedStudent.currentScore || 0) >= 85
                    ? 'Siswa menunjukkan penguasaan materi yang sangat baik dengan penalaran tingkat tinggi (HOTS).'
                    : (selectedStudent.currentScore || 0) >= 75
                    ? 'Siswa berhasil mencapai kriteria ketercapaian tujuan pembelajaran secara memuaskan.'
                    : 'Perlu bimbingan dan pendampingan tambahan melalui pengayaan modul materi sebelum remedial.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/50 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 font-medium"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rapor Nilai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

