import React from 'react';
import { Flame, Sparkles, Shield, Cpu, Zap, Star } from 'lucide-react';

interface YangBaruViewProps {
  isDarkMode: boolean;
}

export const YangBaruView: React.FC<YangBaruViewProps> = ({ isDarkMode }) => {
  const updates = [
    {
      version: 'v2.8.4 - Rilis Oktober 2026',
      date: '22 Oktober 2026',
      title: 'Deteksi Kecurangan Berbasis AI & Kunci Layar Penuh',
      description: 'Peningkatan algoritma anti-cheat cerdas yang mampu mendeteksi pergantian tab browser, pembagian layar (split screen), dan upaya pencarian jawaban di internet secara real-time.',
      tag: 'Keamanan'
    },
    {
      version: 'v2.7.0',
      date: '10 Oktober 2026',
      title: 'Generator Soal Asesmen Nasional (AKM) & Taksonomi Bloom C4-C6',
      description: 'AI kini mendukung pembuatan stimulus teks narasi panjang, grafik data, serta soal pilihan ganda kompleks untuk jenjang SD, SMP, hingga SMA/SMK.',
      tag: 'AI Generator'
    },
    {
      version: 'v2.6.2',
      date: '28 September 2026',
      title: 'Dukungan Rumus Matematika (LaTeX) & Simbol Kimia',
      description: 'Penulisan rumus kuadrat, integral, matriks, dan ikatan kimia kini otomatis ter-render rapi pada layar siswa tanpa perlu mengunggah gambar manual.',
      tag: 'Bank Soal'
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
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Yang Baru di soalpintar.ai
            </h2>
            <p className="text-xs text-slate-400">
              Catatan pembaruan sistem dan rilis fitur terbaru untuk dewan guru di seluruh Indonesia.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {updates.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-xl border relative pl-6 ${
                isDarkMode ? 'bg-[#090f1d] border-[#1b253b]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold font-mono text-emerald-400">{item.version}</span>
                <span className="text-[11px] text-slate-500">{item.date}</span>
              </div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
