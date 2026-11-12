import React, { useState } from 'react';
import { HelpCircle, ChevronRight, CheckCircle2, BookOpen, Lightbulb, Video } from 'lucide-react';

interface PanduanViewProps {
  isDarkMode: boolean;
}

export const PanduanView: React.FC<PanduanViewProps> = ({ isDarkMode }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: 'Langkah 1: Membuat Soal HOTS dengan AI',
      desc: 'Buka menu "AI Generator", tentukan Mata Pelajaran, Jenjang, dan masukkan Topik materi pelajaran. Klik tombol "Hasilkan Soal AI", lalu simpan butir-butir soal yang cocok ke dalam Bank Soal Anda.'
    },
    {
      title: 'Langkah 2: Mengatur Token & Protokol Keamanan',
      desc: 'Buka menu "Token Siswa" untuk menghasilkan kode token ujian 6 karakter. Pastikan opsi "Kunci Layar Penuh" dan "Blokir Buka Tab Baru" dicentang demi integritas pengawasan ujian.'
    },
    {
      title: 'Langkah 3: Memulai Sesi Ujian Live Real-Time',
      desc: 'Bagikan token ke siswa. Masuk ke menu "Ujian Live" untuk memantau progres pengerjaan setiap siswa detik demi detik. Jika ada siswa yang mencoba berpindah tab browser, sistem akan langsung memberikan tanda peringatan.'
    },
    {
      title: 'Langkah 4: Rekap & Ekspor Nilai',
      desc: 'Setelah ujian selesai, buka menu "Nilai Siswa". Anda dapat melihat distribusi nilai ketuntasan belajar (KKM 75) dan mengunduh berkas laporan dalam format CSV / Excel.'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div
        className={`p-6 rounded-2xl border transition-colors ${
          isDarkMode ? 'bg-[#0e1626] border-[#1e2a42]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/40">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Panduan Praktis Penggunaan Guru
            </h2>
            <p className="text-xs text-slate-400">
              Pelajari alur kerja pembuatan soal hingga evaluasi hasil belajar siswa dengan mudah.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((st, i) => (
            <div
              key={i}
              onClick={() => setActiveStep(i)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeStep === i
                  ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500'
                  : isDarkMode
                  ? 'border-[#1b253b] bg-[#090f1d] hover:border-slate-700'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-400">{st.title}</span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeStep === i ? 'rotate-90' : ''}`} />
              </div>
              {activeStep === i && (
                <p className="text-xs text-slate-300 mt-2 leading-relaxed pt-2 border-t border-slate-700/30">
                  {st.desc}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
