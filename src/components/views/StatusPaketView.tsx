import React, { useState } from 'react';
import {
  Crown,
  Check,
  CalendarPlus,
  Receipt,
  CheckCircle2,
  Clock,
  ShieldCheck,
  QrCode,
  CreditCard,
  Download,
  Printer,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SubscriptionInfo, TransactionRecord } from '../../types';
import { availablePackages } from '../../data/mockData';

interface StatusPaketViewProps {
  subscription: SubscriptionInfo;
  transactions: TransactionRecord[];
  isDarkMode: boolean;
  onRenewPlan: (planName: string, amount: number, durationDays: number, method: string) => void;
  onGoToPricing: () => void;
}

export const StatusPaketView: React.FC<StatusPaketViewProps> = ({
  subscription,
  transactions,
  isDarkMode,
  onRenewPlan,
  onGoToPricing
}) => {
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('pkg-basic');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qris' | 'bca' | 'gopay'>('qris');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TransactionRecord | null>(null);

  const selectedPkg = availablePackages.find((p) => p.id === selectedPackageId) || availablePackages[0];

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsRenewModalOpen(false);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // fallback if canvas-confetti is not loaded
      }

      const methodNames: Record<string, string> = {
        qris: 'QRIS Real-Time',
        bca: 'BCA Virtual Account',
        gopay: 'GoPay / QRIS Instant'
      };

      onRenewPlan(
        selectedPkg.name,
        selectedPkg.price,
        selectedPkg.durationDays,
        methodNames[selectedPaymentMethod] || 'QRIS Real-Time'
      );
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Grid: Paket Saat Ini (Left 2/3) + Paket Aktif (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card: Paket Saat Ini */}
        <div
          className={`lg:col-span-2 rounded-2xl p-6 border transition-colors ${
            isDarkMode
              ? 'bg-[#0e1626] border-[#1e2a42]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Crown className="w-5 h-5 text-emerald-400" />
              </div>
              <h2
                className={`text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Paket Saat Ini
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 tracking-wider">
              {subscription.status === 'Active' ? 'AKTIF' : 'KADALUARSA'}
            </span>
          </div>

          {/* Table / List Rows matching screenshot */}
          <div
            className={`rounded-xl divide-y text-sm ${
              isDarkMode
                ? 'bg-[#090f1d] border border-[#1b253b] divide-[#162035]'
                : 'bg-slate-50 border border-slate-200 divide-slate-200'
            }`}
          >
            {/* Row 1: Tipe Paket */}
            <div className="flex items-center justify-between p-4">
              <span className="text-slate-400 font-medium">Tipe Paket</span>
              <span className="font-semibold text-emerald-400 text-base">
                {subscription.tierName}
              </span>
            </div>

            {/* Row 2: Masa Aktif Hingga */}
            <div className="flex items-center justify-between p-4">
              <span className="text-slate-400 font-medium">Masa Aktif Hingga</span>
              <span
                className={`font-bold text-base tabular-nums ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {subscription.activeUntil}
              </span>
            </div>

            {/* Row 3: Sisa Waktu */}
            <div className="flex items-center justify-between p-4">
              <span className="text-slate-400 font-medium">Sisa Waktu</span>
              <span className="font-semibold text-emerald-400 tabular-nums">
                {subscription.daysRemaining} hari lagi
              </span>
            </div>

            {/* Row 4: Status Akun */}
            <div className="flex items-center justify-between p-4">
              <span className="text-slate-400 font-medium">Status Akun</span>
              <span className="font-semibold text-emerald-400">
                {subscription.status}
              </span>
            </div>
          </div>
        </div>

        {/* Card: Paket Aktif (Call to Action Card) */}
        <div
          className={`rounded-2xl p-6 border flex flex-col justify-between transition-colors ${
            isDarkMode
              ? 'bg-[#0e1626] border-[#1e2a42]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <div className="w-12 h-12 rounded-full bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Check className="w-6 h-6 text-emerald-400 stroke-[2.5]" />
            </div>

            <h3
              className={`text-lg font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Paket Aktif
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Selamat! Anda memiliki akses penuh ke semua fitur premium.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsRenewModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 bg-emerald-800/40 hover:bg-emerald-700/60 text-emerald-300 border border-emerald-500/40 shadow-sm active:scale-[0.98]"
            >
              <CalendarPlus className="w-4 h-4 text-emerald-300" />
              <span>Perpanjang Lebih Awal</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              Sisa masa aktif tidak hangus
            </p>
          </div>
        </div>
      </div>

      {/* Card: Riwayat Transaksi */}
      <div
        className={`rounded-2xl p-6 border transition-colors ${
          isDarkMode
            ? 'bg-[#0e1626] border-[#1e2a42]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Receipt className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Riwayat Transaksi
              </h2>
              <p className="text-xs text-slate-400">
                Daftar pembayaran dan tagihan resmi yang diterbitkan.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToPricing}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            Lihat Semua Paket
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Transactions list */}
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => setSelectedInvoice(tx)}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all duration-150 hover:border-indigo-500/50 ${
                isDarkMode
                  ? 'bg-[#090f1d] border-[#1a243a] hover:bg-[#0c1426]'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div
                    className={`font-semibold text-sm ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {tx.planName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {tx.date}
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                <div
                  className={`font-bold text-sm tabular-nums ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {tx.amountFormatted}
                </div>
                <div className="text-xs font-bold text-emerald-400 tracking-wide mt-0.5">
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Perpanjang Lebih Awal */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 max-h-[90vh] overflow-y-auto ${
              isDarkMode ? 'bg-[#0c1424] border-[#1e2d48] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <CalendarPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold">Perpanjang Langganan Lebih Awal</h3>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note badge */}
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <strong>Garansi Akumulasi Masa Aktif:</strong> Sisa masa aktif Anda ({subscription.daysRemaining} hari) akan otomatis ditambahkan ke masa aktif paket baru tanpa hangus.
              </div>
            </div>

            {/* Package selector */}
            <div className="mt-5 space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pilih Durasi / Paket
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availablePackages.slice(0, 2).map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                          : isDarkMode
                          ? 'border-[#1b273d] bg-[#090f1d] hover:border-slate-600'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{pkg.name}</span>
                        {pkg.recommended && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Pilihan Terbaik
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-lg font-extrabold text-emerald-400 tabular-nums">
                        {pkg.priceFormatted}
                        <span className="text-xs text-slate-400 font-normal"> / 1 Tahun</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                        {pkg.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-6 space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Metode Pembayaran Real-Time
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('qris')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedPaymentMethod === 'qris'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : isDarkMode
                      ? 'border-[#1b273d] bg-[#090f1d] text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span>QRIS Instant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('bca')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedPaymentMethod === 'bca'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : isDarkMode
                      ? 'border-[#1b273d] bg-[#090f1d] text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>BCA Virtual Acc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('gopay')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedPaymentMethod === 'gopay'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : isDarkMode
                      ? 'border-[#1b273d] bg-[#090f1d] text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>GoPay / OVO</span>
                </button>
              </div>

              {/* QR Code Demo Preview when QRIS is selected */}
              {selectedPaymentMethod === 'qris' && (
                <div
                  className={`p-4 rounded-xl border flex items-center gap-4 ${
                    isDarkMode ? 'bg-[#090f1d] border-[#1b273d]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-20 h-20 bg-white p-1 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    {/* SVG Realistic QR simulation */}
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-900">
                      <rect width="100" height="100" fill="white" />
                      <path d="M10,10 h25 v25 h-25 z M15,15 v15 h15 v-15 z M19,19 h7 v7 h-7 z" />
                      <path d="M65,10 h25 v25 h-25 z M70,15 v15 h15 v-15 z M74,19 h7 v7 h-7 z" />
                      <path d="M10,65 h25 v25 h-25 z M15,70 v15 h15 v-15 z M19,74 h7 v7 h-7 z" />
                      <rect x="42" y="10" width="6" height="20" />
                      <rect x="52" y="15" width="6" height="15" />
                      <rect x="40" y="42" width="20" height="20" />
                      <rect x="45" y="47" width="10" height="10" fill="white" />
                      <rect x="68" y="45" width="20" height="6" />
                      <rect x="75" y="55" width="15" height="6" />
                      <rect x="10" y="45" width="20" height="6" />
                      <rect x="40" y="70" width="15" height="20" />
                      <rect x="65" y="70" width="25" height="6" />
                      <rect x="75" y="80" width="15" height="10" />
                    </svg>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-emerald-400">Scan via BCA, BRImo, Livin, GoPay, atau ShopeePay</div>
                    <div className="text-slate-400">Total Tagihan: <span className="font-bold text-white tabular-nums">{selectedPkg.priceFormatted}</span></div>
                    <div className="text-[11px] text-slate-500 font-mono">Kode Bayar: SPT-{Math.floor(100000 + Math.random() * 900000)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Total and Submit */}
            <div className="mt-6 pt-4 border-t border-slate-700/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Pembayaran</span>
                <div className="text-xl font-extrabold text-emerald-400 tabular-nums">
                  {selectedPkg.priceFormatted}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Memproses API...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Konfirmasi Pembayaran</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Invoice Details */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 ${
              isDarkMode ? 'bg-[#0c1424] border-[#1e2d48] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold">Bukti Transaksi Resmi</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div
                className={`p-4 rounded-xl border space-y-2 text-xs font-mono ${
                  isDarkMode ? 'bg-[#090f1d] border-[#1b273d]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-slate-400">Nomor Invoice:</span>
                  <span className="font-semibold text-emerald-400">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Transaksi:</span>
                  <span>{selectedInvoice.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Metode Bayar:</span>
                  <span>{selectedInvoice.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Pembayaran:</span>
                  <span className="text-emerald-400 font-bold">{selectedInvoice.status}</span>
                </div>
              </div>

              <div className="border-t border-slate-700/40 pt-3 space-y-2">
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Item Pembelian:</span>
                  <span className="text-white font-medium">{selectedInvoice.planName} (12 Bulan)</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Pajak (PPN 11%):</span>
                  <span>Termasuk</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-700/40">
                  <span>Total Terbayar:</span>
                  <span className="text-emerald-400 font-mono">{selectedInvoice.amountFormatted}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/40 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-colors ${
                  isDarkMode
                    ? 'border-[#1e2d48] text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Invoice</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
