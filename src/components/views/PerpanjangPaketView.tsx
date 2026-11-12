import React from 'react';
import {
  CalendarPlus,
  Check,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { availablePackages } from '../../data/mockData';
import { SubscriptionInfo } from '../../types';

interface PerpanjangPaketViewProps {
  subscription: SubscriptionInfo;
  isDarkMode: boolean;
  onSelectRenew: (pkgId: string) => void;
}

export const PerpanjangPaketView: React.FC<PerpanjangPaketViewProps> = ({
  subscription,
  isDarkMode,
  onSelectRenew
}) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
          Pilihan Paket Langganan Guru
        </span>
        <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>
          Tingkatkan Efisiensi Evaluasi Pembelajaran Anda
        </h2>
        <p className="text-sm text-slate-400">
          Sisa masa aktif Anda ({subscription.daysRemaining} hari) tidak akan pernah hangus dan akan otomatis diakumulasikan.
        </p>
      </div>

      {/* Pricing Cards 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePackages.map((pkg) => {
          const isCurrentPlan = subscription.tierName === pkg.name;

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl p-6 border flex flex-col justify-between relative transition-all duration-200 hover:-translate-y-1 ${
                pkg.recommended
                  ? 'border-emerald-500 bg-gradient-to-b from-[#0e1f38] to-[#0a1526] shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500'
                  : isDarkMode
                  ? 'border-[#1e2a42] bg-[#0e1626]'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {pkg.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500 text-slate-950 uppercase tracking-wider shadow-md">
                  Paling Diminati Guru
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {pkg.name}
                  </h3>
                  {isCurrentPlan && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-500/30">
                      Paket Aktif
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 min-h-[36px] mb-4">
                  {pkg.description}
                </p>

                <div className="mb-6 pb-6 border-b border-slate-700/40">
                  <span className="text-3xl font-extrabold text-emerald-400 tabular-nums">
                    {pkg.priceFormatted}
                  </span>
                  <span className="text-xs text-slate-400"> {pkg.period}</span>
                </div>

                {/* Features List */}
                <div className="space-y-3 text-xs mb-6">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Fasilitas Lengkap:
                  </span>
                  {pkg.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectRenew(pkg.id)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  pkg.recommended
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <CalendarPlus className="w-4 h-4" />
                <span>{isCurrentPlan ? 'Perpanjang Masa Aktif' : 'Pilih Paket Ini'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ Mini Accordion */}
      <div
        className={`p-6 rounded-2xl border ${
          isDarkMode ? 'bg-[#0e1626] border-[#1e2a42]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Pertanyaan Sering Diajukan (FAQ)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="font-bold text-slate-200">Bagaimana jika saya perpanjang sebelum masa aktif habis?</span>
            <p className="text-slate-400 mt-1">
              Sisa hari Anda saat ini ({subscription.daysRemaining} hari) tidak akan hilang. Sistem kami otomatis menambahkan 365 hari ke tanggal kedaluwarsa Anda sebelumnya.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="font-bold text-slate-200">Apakah saya mendapatkan invoice resmi untuk SPJ/BOS?</span>
            <p className="text-slate-400 mt-1">
              Ya, seluruh transaksi otomatis menerbitkan invoice digital bertanda tangan elektronik dan dapat diunduh langsung dalam format cetak standar LPJ sekolah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
