import React from 'react';
import { Smartphone, Monitor, Shield, Download, CheckCircle2 } from 'lucide-react';

interface DownloadAplikasiViewProps {
  isDarkMode: boolean;
}

export const DownloadAplikasiView: React.FC<DownloadAplikasiViewProps> = ({ isDarkMode }) => {
  const apps = [
    {
      name: 'SoalPintar Exam Browser Windows',
      platform: 'Windows 10/11 (64-bit)',
      version: 'v2.8.2 Installer',
      size: '64 MB',
      icon: Monitor,
      desc: 'Aplikasi desktop untuk siswa saat ujian di lab komputer. Mengunci total fungsi Alt+Tab, tombol Windows, dan browser.'
    },
    {
      name: 'SoalPintar Mobile Safe App',
      platform: 'Android 9.0+ & iOS',
      version: 'v2.8.0 APK & App Store',
      size: '28 MB',
      icon: Smartphone,
      desc: 'Aplikasi ujian siswa untuk smartphone dan tablet dengan sensor deteksi split-screen dan floating window.'
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
          <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Unduh Aplikasi Ujian Siswa
            </h2>
            <p className="text-xs text-slate-400">
              Aplikasi pendamping siswa (Safe Exam Client) untuk mencegah kecurangan selama asesmen berlangsung.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app, i) => {
            const Icon = app.icon;
            return (
              <div
                key={i}
                className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isDarkMode ? 'bg-[#090f1d] border-[#1b253b]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {app.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">{app.platform}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {app.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700/30 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">{app.version} ({app.size})</span>
                  <button
                    onClick={() => {
                      const content = `SOALPINTAR.AI CLIENT INSTALLER CONFIG\nAplikasi: ${app.name}\nPlatform: ${app.platform}\nVersi: ${app.version}\nUkuran: ${app.size}\nServer Endpoint: https://api.soalpintar.ai/v2/exam\nStatus Kiosk Lockdown: AKTIF\n\nPetunjuk Instalasi:\n1. Ekstrak paket ke folder sistem lab sekolah.\n2. Jalankan berkas dengan hak akses Administrator.\n3. Masukkan Token Ujian yang digenerate oleh guru.`;
                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${app.name.toLowerCase().replace(/\s+/g, '-')}-config.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
