import React, { useState } from 'react';
import { LogIn, FileText, Check, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
  isDarkMode: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  isDarkMode
}) => {
  const [email, setEmail] = useState('feri.yana111783@gmail.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(email || 'feri.yana111783@gmail.com');
    }, 700);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
        isDarkMode
          ? 'bg-[#080d1a] text-slate-100'
          : 'bg-slate-100 text-slate-800'
      }`}
    >
      {/* Top Branding matching screenshot */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Green document logo inside dark rounded box */}
        <div className="w-16 h-16 rounded-2xl bg-[#0f172a] border border-[#1e2a42] flex items-center justify-center shadow-lg shadow-black/40 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
            <svg
              className="w-6 h-6 text-emerald-100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
        </div>

        {/* Brand Name in vibrant sky blue */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#38bdf8]">
          soalpintar.ai
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">
          Platform Ujian Online untuk Guru Indonesia
        </p>
      </div>

      {/* Main Login Card matching screenshot */}
      <div
        className={`w-full max-w-[420px] rounded-3xl p-8 border shadow-2xl transition-all ${
          isDarkMode
            ? 'bg-[#101726] border-[#1c273e]'
            : 'bg-white border-slate-200 shadow-slate-200'
        }`}
      >
        <h2
          className={`text-xl sm:text-2xl font-bold mb-6 tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          {isRegisterMode ? 'Daftar Akun Baru' : 'Masuk ke Akun'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              className={`block text-xs font-semibold ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@guru.belajar.id"
              required
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-[#e8f0fe] text-slate-900 border border-transparent outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              className={`block text-xs font-semibold ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-[#e8f0fe] text-slate-900 border border-transparent outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner tracking-widest"
            />
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 accent-blue-600 bg-white cursor-pointer"
            />
            <label
              htmlFor="rememberMe"
              className={`text-xs font-medium cursor-pointer ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Ingat saya
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-[#4f46e5] hover:bg-[#4338ca] shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>{isRegisterMode ? 'Daftar Sekarang' : 'Masuk'}</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Register Link */}
          <div className="text-center pt-2">
            <span className="text-xs text-slate-400">
              {isRegisterMode ? 'Sudah memiliki akun? ' : 'Belum Punya Akses? '}
            </span>
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs font-bold text-[#2563eb] hover:text-blue-400 hover:underline transition-colors ml-1"
            >
              {isRegisterMode ? 'Masuk Disini' : 'Daftar Disini'}
            </button>
          </div>
        </form>
      </div>

      {/* Teacher Accreditation footer note */}
      <div className="mt-8 text-center text-xs text-slate-500">
        © 2026 soalpintar.ai · Terdaftar di Asosiasi Guru & Platform Merdeka Mengajar
      </div>
    </div>
  );
};
