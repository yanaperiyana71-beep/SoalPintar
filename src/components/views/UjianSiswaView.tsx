import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Send,
  User,
  BookOpen,
  Award,
  ArrowLeft,
  Sparkles,
  Maximize2,
  Minimize2,
  XCircle,
  HelpCircle,
  Smartphone,
  Timer,
  Lock,
  ExternalLink,
  Radio,
  Eye,
  RefreshCw,
  Search
} from 'lucide-react';
import { ExamTokenItem, GoogleFormRecord, StudentProgress } from '../../types';
import confetti from 'canvas-confetti';
import { liveExamService } from '../../services/liveExamService';

interface UjianSiswaViewProps {
  initialToken?: string;
  isDarkMode?: boolean;
  onExitStudentView?: () => void;
}

export const UjianSiswaView: React.FC<UjianSiswaViewProps> = ({
  initialToken = '',
  isDarkMode = true,
  onExitStudentView
}) => {
  // Determine active token prioritizing URL param, last created token from Buat Token, tokenList, and props
  const getInitialActiveToken = (): string => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTok = params.get('token');
      if (urlTok && urlTok.trim()) return urlTok.trim().toUpperCase();

      const lastCreated = localStorage.getItem('soalpintar_last_created_token') || localStorage.getItem('soalpintar_selected_live_token');
      if (lastCreated && lastCreated.trim()) return lastCreated.trim().toUpperCase();

      try {
        const savedTokens = localStorage.getItem('soalpintar_token_list');
        if (savedTokens) {
          const parsed = JSON.parse(savedTokens);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].token) {
            return parsed[0].token.toUpperCase();
          }
        }
      } catch {}
    }
    if (initialToken && initialToken.trim() && initialToken !== 'ZJT0P4M') {
      return initialToken.trim().toUpperCase();
    }
    return initialToken || 'ZJT0P4M';
  };

  const [tokenInput, setTokenInput] = useState<string>(getInitialActiveToken);
  const [studentName, setStudentName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [studentAbsen, setStudentAbsen] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Exam phase: 'login' | 'exam' | 'penalty' | 'blocked' | 'submitted'
  const [phase, setPhase] = useState<'login' | 'exam' | 'penalty' | 'blocked' | 'submitted'>('login');

  // Teacher name & subject metadata (matching screenshot: GURU: YANA PERIYANA / Segitiga)
  const [teacherName, setTeacherName] = useState<string>('YANA PERIYANA');
  const [quizSubject, setQuizSubject] = useState<string>('Segitiga');
  const [examLabel, setExamLabel] = useState<string>('Ulangan');
  const [violationLimit, setViolationLimit] = useState<number>(1);
  const [formUrl, setFormUrl] = useState<string>(
    'https://docs.google.com/forms/d/e/1FAIpQLScL2dlWq2uZqoU8208FMWa224h1uXqhkX7NP1hvUqG1iR3L_A/viewform?embedded=true'
  );

  // Zoom & confirmation states
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showFinishConfirm, setShowFinishConfirm] = useState<boolean>(false);

  // Proctoring violation states
  const [violationsCount, setViolationsCount] = useState<number>(0);
  const [penaltySeconds, setPenaltySeconds] = useState<number>(10);
  const [penaltyActive, setPenaltyActive] = useState<boolean>(false);
  const [lastViolationReason, setLastViolationReason] = useState<string>('Pindah Tab / Keluar Layar');

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5400); // 90 mins default

  // Google Form iframe & blur safety protection refs (prevents false Split Screen / Floating App block)
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isPointerOverIframeRef = useRef<boolean>(false);
  const isFormActiveRef = useRef<boolean>(false);
  const lastIframeInteractionTimeRef = useRef<number>(0);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);

  // Load token data on startup and sync real-time
  // Load token data on startup and sync real-time with activated Google Form
  useEffect(() => {
    const loadTokenAndForm = () => {
      try {
        // 1. Get token, formId, and soal from URL query parameters
        let urlTokenParam: string | null = null;
        let urlFormIdParam: string | null = null;
        let urlSoalParam: string | null = null;
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          urlTokenParam = params.get('token');
          urlFormIdParam = params.get('formId');
          urlSoalParam = params.get('soal');
        }

        // 2. Load Google Forms & Tokens
        const savedGf = localStorage.getItem('soalpintar_google_forms');
        let forms: GoogleFormRecord[] = [];
        if (savedGf) {
          try {
            const parsed = JSON.parse(savedGf);
            if (Array.isArray(parsed)) forms = parsed;
          } catch {}
        }

        const savedTokens = localStorage.getItem('soalpintar_token_list');
        let tokens: ExamTokenItem[] = [];
        if (savedTokens) {
          try {
            const parsed = JSON.parse(savedTokens);
            if (Array.isArray(parsed)) tokens = parsed;
          } catch {}
        }

        // 3. Determine active token & form with priority to newly created token
        const lastCreatedToken = typeof window !== 'undefined'
          ? (localStorage.getItem('soalpintar_last_created_token') || localStorage.getItem('soalpintar_selected_live_token'))
          : null;
        const firstTokenFromList = tokens.length > 0 && tokens[0].token ? tokens[0].token : null;

        const candidateToken =
          urlTokenParam ||
          (initialToken && initialToken !== 'ZJT0P4M' ? initialToken : null) ||
          lastCreatedToken ||
          firstTokenFromList ||
          (tokenInput && tokenInput.trim()) ||
          'ZJT0P4M';

        let matchedForm: GoogleFormRecord | undefined;
        let matchedTokenItem: ExamTokenItem | undefined;

        // Try matching by formId first if passed in URL
        if (urlFormIdParam) {
          matchedForm = forms.find((f) => f.id === urlFormIdParam);
        }

        // Try matching by candidateToken
        if (!matchedForm && candidateToken && candidateToken.trim()) {
          const cleanTok = candidateToken.trim().toUpperCase();
          matchedForm = forms.find((f) => f.token && f.token.toUpperCase() === cleanTok);
          matchedTokenItem = tokens.find((t) => t.token.toUpperCase() === cleanTok);
        }

        // Try matching by urlSoalParam
        if (!matchedForm && urlSoalParam) {
          try {
            const cleanSoal = decodeURIComponent(urlSoalParam).toLowerCase();
            matchedForm = forms.find((f) => f.name.toLowerCase().includes(cleanSoal));
          } catch {}
        }

        // If not matched by token, try finding currently 'Aktif' Google Form
        if (!matchedForm) {
          matchedForm = forms.find((f) => f.status === 'Aktif' && f.token);
          if (matchedForm && matchedForm.token) {
            matchedTokenItem = tokens.find((t) => t.token.toUpperCase() === matchedForm!.token!.toUpperCase());
          }
        }

        // If still no form, try matchedTokenItem's quiz name or formUrl
        if (!matchedForm && matchedTokenItem) {
          matchedForm = forms.find(
            (f) =>
              f.name.toLowerCase() === matchedTokenItem!.quiz.toLowerCase() ||
              (f.token && f.token.toUpperCase() === matchedTokenItem!.token.toUpperCase())
          );
        }

        // Final fallback: Segitiga (SMP)
        if (!matchedForm) {
          const defaultQuizName = matchedTokenItem?.quiz || 'Segitiga (SMP)';
          matchedForm = forms.find((f) => f.name.toLowerCase().includes('segitiga')) || {
            id: 'gf-05',
            name: defaultQuizName,
            url: `https://docs.google.com/forms/d/e/1FAIpQLScL2dlWq2uZqoU8208FMWa224h1uXqhkX7NP1hvUqG1iR3L_A/viewform?token=${candidateToken}&soal=${encodeURIComponent(defaultQuizName)}`,
            editUrl: '',
            questionCount: 20,
            status: 'Aktif',
            token: candidateToken,
            tokenActive: true,
            createdAt: ''
          };
        }

        // Load teacher name
        const savedTeacher = localStorage.getItem('soalpintar_teacher_name');
        setTeacherName(savedTeacher && savedTeacher.trim() ? savedTeacher.trim() : 'YANA PERIYANA');

        // Apply matchedForm data & sync tokenInput
        const finalToken = matchedForm.token || matchedTokenItem?.token || candidateToken || 'ZJT0P4M';
        setTokenInput((prev) => {
          if (!prev || prev === 'ZJT0P4M' || prev === initialToken || prev === finalToken) {
            return finalToken;
          }
          return prev;
        });

        const cleanTitle = matchedForm.name.replace(/\s*\([^)]*\)/g, '').trim() || matchedForm.name;
        setQuizSubject(cleanTitle);
        setExamLabel(matchedForm.name);

        const limitVal = matchedTokenItem?.violationLimit !== undefined ? Number(matchedTokenItem.violationLimit) : 1;
        setViolationLimit(limitVal);

        let finalUrl = matchedForm.url || matchedTokenItem?.formUrl || 'https://docs.google.com/forms/d/e/1FAIpQLScL2dlWq2uZqoU8208FMWa224h1uXqhkX7NP1hvUqG1iR3L_A/viewform';
        if (!finalUrl.includes('embedded=true')) {
          finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}embedded=true`;
        }
        setFormUrl(finalUrl);
      } catch (e) {
        console.warn('Error reading token data:', e);
      }
    };

    loadTokenAndForm();

    window.addEventListener('storage', loadTokenAndForm);
    window.addEventListener('soalpintar_tokens_updated', loadTokenAndForm);
    window.addEventListener('soalpintar_selected_live_token_changed', loadTokenAndForm);
    const interval = setInterval(loadTokenAndForm, 1500);

    return () => {
      window.removeEventListener('storage', loadTokenAndForm);
      window.removeEventListener('soalpintar_tokens_updated', loadTokenAndForm);
      window.removeEventListener('soalpintar_selected_live_token_changed', loadTokenAndForm);
      clearInterval(interval);
    };
  }, [initialToken]);

  // Request fullscreen
  const enterFullscreen = () => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Fallback
    }
  };

  // Form Submit: Mulai Ujian
  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = studentName.trim();
    if (!cleanName) {
      setFormError('Silakan masukkan nama lengkap Anda.');
      return;
    }

    const cleanToken = (tokenInput || '').trim().toUpperCase();
    if (!cleanToken) {
      setFormError('Silakan masukkan Token / Sandi Ujian.');
      return;
    }

    // Verify token matches active tokens in Token Siswa or Google Forms
    let isFound = false;
    let finalQuiz = quizSubject;
    let targetFormUrl = formUrl;

    try {
      const savedGf = localStorage.getItem('soalpintar_google_forms');
      let forms: GoogleFormRecord[] = [];
      if (savedGf) {
        const parsed = JSON.parse(savedGf);
        if (Array.isArray(parsed)) forms = parsed;
      }

      const savedTokens = localStorage.getItem('soalpintar_token_list');
      let tokens: ExamTokenItem[] = [];
      if (savedTokens) {
        const parsed = JSON.parse(savedTokens);
        if (Array.isArray(parsed)) tokens = parsed;
      }

      const matchForm = forms.find((f) => f.token && f.token.toUpperCase() === cleanToken);
      const matchToken = tokens.find((t) => t.token.toUpperCase() === cleanToken);

      if (matchForm) {
        isFound = true;
        if (matchForm.name) finalQuiz = matchForm.name;
        if (matchForm.url) targetFormUrl = matchForm.url;
      } else if (matchToken) {
        isFound = true;
        if (matchToken.quiz) finalQuiz = matchToken.quiz;
        if (matchToken.formUrl) targetFormUrl = matchToken.formUrl;
      } else {
        // Fallback: Bind any custom entered token (e.g. SPT-M9N6) to active Google Form so student is never blocked
        const activeForm = forms.find((f) => f.status === 'Aktif') || forms[0];
        if (activeForm) {
          isFound = true;
          finalQuiz = activeForm.name;
          let baseUrl = activeForm.url || 'https://docs.google.com/forms/d/e/1FAIpQLScL2dlWq2uZqoU8208FMWa224h1uXqhkX7NP1hvUqG1iR3L_A/viewform';
          if (!baseUrl.includes('token=')) {
            baseUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${cleanToken}&soal=${encodeURIComponent(activeForm.name)}`;
          }
          targetFormUrl = baseUrl;
        }
      }
    } catch {}

    if (!targetFormUrl.includes('embedded=true')) {
      targetFormUrl = `${targetFormUrl}${targetFormUrl.includes('?') ? '&' : '?'}embedded=true`;
    }

    const cleanTitle = finalQuiz.replace(/\s*\([^)]*\)/g, '').trim() || finalQuiz;
    setQuizSubject(cleanTitle);
    setExamLabel(finalQuiz);
    setFormUrl(targetFormUrl);

    const rawClass = studentClass.trim() || '9B';
    const rawAbsen = studentAbsen.trim() || '1';

    // Enter Fullscreen mode
    enterFullscreen();

    // Register student to liveExamService (syncs across tabs, localStorage, and backend API)
    try {
      await liveExamService.registerStudent({
        name: cleanName,
        studentClass: rawClass,
        studentAbsen: rawAbsen,
        token: cleanToken,
        quiz: finalQuiz
      });
    } catch (e) {
      console.warn('Error updating live exam service:', e);
    }

    setPhase('exam');

    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.5 } });
    } catch {
      // fallback
    }
  };

  // Listen for real-time teacher unblock / reset from Ujian Live
  useEffect(() => {
    if (!studentName) return;

    const unsubscribe = liveExamService.subscribe((students) => {
      const me = students.find(
        (s) => s.name.trim().toLowerCase() === studentName.trim().toLowerCase()
      );
      if (me) {
        if (me.status === 'Mengerjakan' && phase === 'blocked') {
          // Automatically unblock student if teacher clicked "Izinkan Ulang"
          setPhase('exam');
          setViolationsCount(me.violationsCount || 0);
          enterFullscreen();
        } else if (me.violationsCount !== undefined && me.violationsCount !== violationsCount) {
          setViolationsCount(me.violationsCount);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [studentName, phase, violationsCount]);

  // Proctoring: Detect Tab Switch, Fullscreen Exit, & Split Screen / Floating App
  // Intelligently whitelists Google Form typing and clicking inside the iframe!
  useEffect(() => {
    if (phase !== 'exam' && phase !== 'penalty') return;

    const triggerViolation = (reason: string) => {
      // Clear any pending blur check
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }

      setLastViolationReason(reason);
      setViolationsCount((prev) => {
        const nextCount = prev + 1;

        // Sync violation to liveExamService (updates Ujian Live in real-time)
        try {
          liveExamService.recordViolation(studentName, reason, violationLimit);
        } catch (e) {
          console.warn('Failed to record violation:', e);
        }

        // Check if exceeded violation limit
        if (nextCount >= violationLimit) {
          setPhase('blocked');
        } else {
          // Trigger 10 seconds penalty
          setPenaltySeconds(10);
          setPenaltyActive(true);
          setPhase('penalty');
        }

        return nextCount;
      });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        triggerViolation('Pindah Tab Browser');
      }
    };

    const handleFullscreen = () => {
      // Small debounce: when clicking inside an embedded iframe, some browser engines
      // temporarily dispatch a fullscreen event. Verify before penalizing!
      setTimeout(() => {
        if (!document.fullscreenElement && phase === 'exam') {
          // Only trigger if truly exited fullscreen
          triggerViolation('Keluar dari Fullscreen');
        }
      }, 350);
    };

    const handleBlur = () => {
      // Clear any existing pending timer
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }

      const now = Date.now();
      // 1. If mouse or touch is currently over the Google Form iframe, or interacted within 3 seconds:
      // This is 100% legitimate Google Form typing or clicking!
      if (
        isPointerOverIframeRef.current ||
        now - lastIframeInteractionTimeRef.current < 3000
      ) {
        isFormActiveRef.current = true;
        return;
      }

      // 2. Debounce by 350ms to allow document.activeElement to transition to the iframe
      blurTimeoutRef.current = setTimeout(() => {
        const activeEl = document.activeElement;
        const isIframeActive =
          activeEl === iframeRef.current ||
          activeEl?.tagName === 'IFRAME' ||
          isPointerOverIframeRef.current ||
          isFormActiveRef.current ||
          Date.now() - lastIframeInteractionTimeRef.current < 3000;

        if (isIframeActive) {
          isFormActiveRef.current = true;
          return;
        }

        // If page is hidden, visibilitychange event will handle it
        if (document.hidden) {
          return;
        }

        // If document still has system focus
        if (typeof document.hasFocus === 'function' && document.hasFocus()) {
          return;
        }

        // Truly lost focus to an external floating app, split screen app, or other software
        triggerViolation('Split Screen / Floating App');
      }, 350);
    };

    const handleFocus = () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [phase, studentName, violationLimit]);

  // Penalty Countdown Timer (10 Detik)
  useEffect(() => {
    if (phase !== 'penalty') return;

    const interval = setInterval(() => {
      setPenaltySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPenaltyActive(false);
          setPhase('exam');
          enterFullscreen();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Main Exam Timer Countdown
  useEffect(() => {
    if (phase !== 'exam') return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('submitted');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const formatTimer = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) {
      return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleFinishExam = () => {
    setPhase('submitted');

    // Update student finish status via liveExamService
    try {
      liveExamService.finishExam(studentName);
    } catch (e) {
      console.warn('Failed to update student finish status:', e);
    }

    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {
      // fallback
    }
  };

  // ========================================================
  // PHASE 4: ACTIVE SECURE EXAM (HEADER + GOOGLE FORM BELOW)
  // Layout exactly matching user's screenshot
  // ========================================================
  if (phase === 'exam' || (phase === 'penalty' && penaltyActive)) {
    return (
      <div className="fixed inset-0 z-50 w-full h-full bg-[#080d1a] text-slate-100 flex flex-col overflow-hidden select-none font-sans">
        {/* Top Header Bar matching user's screenshot */}
        <header
          className="h-14 sm:h-16 px-3 sm:px-6 bg-[#131b2e] border-b border-[#1f2b45] flex items-center justify-between shadow-md shrink-0 z-30 select-none"
          onPointerDown={() => {
            isPointerOverIframeRef.current = false;
          }}
        >
          {/* Left Side: Green Document Icon, GURU: YANA PERIYANA, Segitiga, Zoom Button */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Green Document / Form Icon matching screenshot */}
            <div className="w-8 h-9 sm:w-9 sm:h-10 rounded-xl bg-[#00c853] p-1.5 flex flex-col justify-between shadow-sm shrink-0 border border-emerald-400/30">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/90 shrink-0" />
                <span className="h-1 flex-1 bg-white/70 rounded-full" />
              </div>
              <div className="space-y-1">
                <span className="block h-0.5 w-full bg-white/70 rounded-full" />
                <span className="block h-0.5 w-3/4 bg-white/60 rounded-full" />
              </div>
            </div>

            {/* Teacher Subtitle & Subject Title */}
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                GURU: {teacherName}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-white leading-tight mt-0.5 tracking-tight">
                {quizSubject || 'Segitiga'}
              </span>
            </div>

            {/* Zoom Badge / Button: 🔍 100% */}
            <div className="relative ml-1 sm:ml-2">
              <button
                type="button"
                onClick={() => {
                  const zoomCycle = [100, 110, 125, 80, 90];
                  const nextIndex = (zoomCycle.indexOf(zoomLevel) + 1) % zoomCycle.length;
                  setZoomLevel(zoomCycle[nextIndex]);
                }}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#2563eb]/25 hover:bg-[#2563eb]/40 text-[#60a5fa] border border-[#3b82f6]/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                title="Klik untuk ubah zoom lembar ujian (80%, 90%, 100%, 110%, 125%)"
              >
                <Search className="w-3.5 h-3.5 text-[#60a5fa]" />
                <span>{zoomLevel}%</span>
              </button>
            </div>
          </div>

          {/* Center Identity Chips */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Student Info */}
            <div className="px-3 py-1.5 rounded-xl bg-[#0b1322] border border-[#1b263b] text-xs text-slate-300 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">{studentName}</strong>
                <span className="text-slate-600 mx-1.5">|</span>
                Kelas <strong className="text-white">{studentClass || '9B'}</strong>
                <span className="text-slate-600 mx-1.5">|</span>
                Absen <strong className="text-white">{studentAbsen || '1'}</strong>
              </span>
            </div>

            {/* Violation proctoring badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b1322] border border-[#1b263b] text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Pelanggaran:</span>
              <span className={`font-bold font-mono ${violationsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {violationsCount}/{violationLimit}
              </span>
            </div>
          </div>

          {/* Right Side: Colored Token Badge, Status Timer & Selesai Ujian Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Colorful Token Display */}
            <div
              className="flex items-center gap-1.5 text-xs font-mono font-black px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950 via-purple-900/80 to-slate-900 border border-indigo-500/60 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.4)] tracking-wider shrink-0"
              title={`Kode Token Ujian Siswa: ${tokenInput || 'ZJT0P4M'}`}
            >
              <Key className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
              <span className="text-[10px] text-indigo-300/80 font-sans uppercase font-bold tracking-normal hidden xs:inline">TOKEN:</span>
              <span className="text-white font-mono tracking-widest bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-400/40">{tokenInput || 'ZJT0P4M'}</span>
            </div>

            {/* Timer status: 🕒 Tanpa Batas Waktu */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0b1322] border border-[#1b263b]">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">Tanpa Batas Waktu</span>
              <span className="whitespace-nowrap sm:hidden">∞ Waktu</span>
            </div>

            {/* Selesai Ujian Button (Red/Pinkish like screenshot) */}
            <button
              type="button"
              onClick={() => setShowFinishConfirm(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs bg-[#e11d48] hover:bg-[#be123c] text-white shadow-md shadow-rose-950/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Selesai Ujian</span>
            </button>

            {/* Quick reload button if iframe network stalls */}
            <button
              type="button"
              onClick={() => {
                setIframeKey((k) => k + 1);
                lastIframeInteractionTimeRef.current = Date.now();
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-[#0b1322] hover:bg-[#15233c] text-slate-400 hover:text-white border border-[#1b263b] transition-all cursor-pointer"
              title="Muat ulang soal Google Form jika terkendala jaringan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Exit to Ujian Live (if proctor is testing) */}
            {onExitStudentView && (
              <button
                type="button"
                onClick={onExitStudentView}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b1322] hover:bg-[#15233c] text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                title="Buka panel pantauan Ujian Live Guru"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ujian Live</span>
              </button>
            )}
          </div>
        </header>

        {/* Embedded Google Form directly underneath, taking up 100% of remaining height */}
        <div
          className="flex-1 w-full relative bg-[#070d18] overflow-hidden flex flex-col"
          onMouseEnter={() => {
            isPointerOverIframeRef.current = true;
            lastIframeInteractionTimeRef.current = Date.now();
          }}
          onMouseLeave={() => {
            isPointerOverIframeRef.current = false;
          }}
          onPointerEnter={() => {
            isPointerOverIframeRef.current = true;
            lastIframeInteractionTimeRef.current = Date.now();
          }}
          onPointerLeave={() => {
            isPointerOverIframeRef.current = false;
          }}
          onPointerDown={() => {
            isPointerOverIframeRef.current = true;
            lastIframeInteractionTimeRef.current = Date.now();
            isFormActiveRef.current = true;
          }}
          onTouchStart={() => {
            isPointerOverIframeRef.current = true;
            lastIframeInteractionTimeRef.current = Date.now();
            isFormActiveRef.current = true;
          }}
          onTouchEnd={() => {
            lastIframeInteractionTimeRef.current = Date.now();
          }}
        >
          <div
            className="w-full h-full"
            style={
              zoomLevel !== 100
                ? {
                    width: `${100 / (zoomLevel / 100)}%`,
                    height: `${100 / (zoomLevel / 100)}%`,
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top left'
                  }
                : { width: '100%', height: '100%' }
            }
          >
            <iframe
              ref={iframeRef}
              key={formUrl}
              src={formUrl}
              title={`Lembar Ujian Google Form - ${quizSubject}`}
              className="w-full h-full border-0"
              allow="fullscreen; autoplay"
              onLoad={() => setIsIframeLoaded(true)}
            />
          </div>
        </div>

        {/* Penalty Overlay (10 Detik) without unmounting the iframe */}
        {(phase === 'penalty' || penaltyActive) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl border border-rose-500/50 bg-[#0c1322] p-8 text-center space-y-5 shadow-2xl shadow-rose-950/50">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Peringatan Pelanggaran Layar!</h2>
                <p className="text-xs text-rose-300 mt-1">
                  Terdeteksi: <strong>{lastViolationReason}</strong> ({violationsCount}/{violationLimit} kali).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070d18] border border-rose-500/30 text-center">
                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                  Waktu Penalti Berjalan:
                </span>
                <div className="text-5xl font-black font-mono text-rose-400">
                  {penaltySeconds}s
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Layar dikunci sementara. Harap jangan keluar lagi dari fullscreen.
                </p>
              </div>

              <div className="text-[11px] text-slate-400">
                Ujian akan otomatis dilanjutkan setelah waktu penalti berakhir tanpa menghapus jawaban Anda.
              </div>
            </div>
          </div>
        )}

        {/* Finish Confirmation Dialog */}
        {showFinishConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-2xl border border-[#1b263b] bg-[#0c1322] p-6 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Selesaikan Ujian?</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Pastikan Anda sudah menekan tombol <strong className="text-emerald-400">"KIRIM / SUBMIT"</strong> di dalam lembar Google Form sebelum mengakhiri sesi ujian ini.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinishConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  Lanjut Mengerjakan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFinishConfirm(false);
                    handleFinishExam();
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/50 transition-all cursor-pointer"
                >
                  Ya, Selesai Ujian
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Bar with Teacher Dashboard Exit Link */}
      {onExitStudentView && phase === 'login' && (
        <div className="w-full max-w-md flex justify-between items-center mb-3 px-1 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <span>Token:</span>
            <span className="font-bold text-indigo-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {tokenInput}
            </span>
          </div>
          <button
            onClick={onExitStudentView}
            className="text-emerald-400 hover:text-emerald-300 font-bold transition-all flex items-center gap-1.5 text-xs bg-[#0c182c] hover:bg-[#12233f] px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Lihat Ujian Live Guru</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 1: LOGIN PORTAL MATCHING SCREENSHOT EXACTLY         */}
      {/* ======================================================== */}
      {phase === 'login' && (
        <div className="w-full max-w-[440px] rounded-[28px] border border-[#1b263b] bg-[#0c1322] p-7 sm:p-9 shadow-2xl shadow-black/90 animate-fadeIn">
          {/* Top Green Doc Icon */}
          <div className="w-[68px] h-[68px] rounded-2xl bg-[#0f192b] border border-[#1f2f4c] flex items-center justify-center mx-auto shadow-md">
            <div className="w-9 h-11 rounded-lg bg-[#00c853] p-2 flex flex-col justify-between shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                <span className="h-1 flex-1 bg-white/80 rounded" />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                <span className="h-1 flex-1 bg-white/80 rounded" />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                <span className="h-1 flex-1 bg-white/80 rounded" />
              </div>
            </div>
          </div>

          {/* Heading Title & Quiz Name */}
          <h1 className="text-2xl sm:text-[28px] font-black text-white tracking-tight text-center mt-5">
            Secure Exam Player
          </h1>
          <p className="text-slate-400 text-sm font-medium text-center mt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <span>Ujian:</span> <strong className="text-white font-bold">{quizSubject}</strong>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded-md border border-indigo-500/30">
              <Key className="w-3 h-3 text-indigo-400" />
              <span>Token: {tokenInput}</span>
            </span>
          </p>

          {/* PERATURAN WEB PLAYER CARD */}
          <div className="bg-[#070d18] border border-[#162236] rounded-2xl p-4 sm:p-5 mt-6 space-y-3.5 text-xs text-slate-300 leading-snug">
            <div className="font-bold text-[11px] text-white tracking-wider uppercase mb-1">
              PERATURAN WEB PLAYER:
            </div>

            {/* Rule 1 */}
            <div className="flex items-start gap-3">
              <Maximize2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Layar akan masuk ke mode <strong className="text-white font-bold">Fullscreen</strong> otomatis.
              </span>
            </div>

            {/* Rule 2 */}
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Dilarang keluar dari mode Fullscreen atau pindah tab.
              </span>
            </div>

            {/* Rule 3 */}
            <div className="flex items-start gap-3 text-rose-300">
              <Smartphone className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                Dilarang menggunakan Split Screen, Floating App, atau Picture-in-Picture.
              </span>
            </div>

            {/* Rule 4 */}
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Setiap pelanggaran memakan waktu penalti 10 detik.
              </span>
            </div>

            {/* Rule 5 */}
            <div className="flex items-start gap-3 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                Maks. pelanggaran: <strong className="text-white font-bold">{violationLimit} kali</strong>. Lebih dari itu ujian ditutup permanen.
              </span>
            </div>
          </div>

          {/* Form Error */}
          {formError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleStartExam} className="mt-6 space-y-4">
            {/* TOKEN / SANDI UJIAN */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  TOKEN / SANDI UJIAN *
                </label>
                <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                  <Key className="w-3 h-3 text-indigo-400" />
                  <span>Token Siswa</span>
                </span>
              </div>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder={`Contoh: ${tokenInput || 'ZJT0P4M'}`}
                className="w-full bg-[#080d19] border border-indigo-500/40 rounded-xl px-4 py-3.5 text-sm font-mono font-bold text-indigo-300 tracking-widest placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors uppercase"
                required
              />
            </div>

            {/* NAMA LENGKAP */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                NAMA LENGKAP
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ketik nama Anda..."
                className="w-full bg-[#080d19] border border-[#1a2538] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            {/* KELAS & ABSEN in 2 columns */}
            <div className="grid grid-cols-5 gap-3">
              {/* KELAS */}
              <div className="col-span-3">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  KELAS
                </label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="Contoh: XII IPA 1"
                  className="w-full bg-[#080d19] border border-[#1a2538] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* ABSEN */}
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  ABSEN
                </label>
                <input
                  type="text"
                  value={studentAbsen}
                  onChange={(e) => setStudentAbsen(e.target.value)}
                  placeholder="No"
                  className="w-full bg-[#080d19] border border-[#1a2538] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors text-center"
                />
              </div>
            </div>

            {/* Glowing Big Green Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 rounded-2xl font-black text-base text-slate-950 bg-[#00c988] hover:bg-[#00b377] transition-all shadow-[0_10px_35px_rgba(0,201,136,0.35)] active:scale-[0.98] cursor-pointer tracking-wide flex items-center justify-center gap-2"
              >
                <span>Mulai Ujian</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 3: BLOCKED SCREEN (MELEBIHI BATAS PELANGGARAN)     */}
      {/* ======================================================== */}
      {phase === 'blocked' && (
        <div className="w-full max-w-md rounded-3xl border border-rose-600 bg-[#0c1322] p-8 text-center space-y-5 shadow-2xl shadow-rose-950/60 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-rose-400">Ujian Ditutup Permanen</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Anda telah melebihi batas toleransi pelanggaran (<strong>{violationLimit} kali</strong>). Sesi ujian Anda telah dikunci oleh sistem proctoring otomatis.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#070d18] border border-slate-800 text-xs text-left space-y-2">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Nama Siswa:</span>
              <span className="font-bold text-white">{studentName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Status:</span>
              <span className="text-rose-400 font-bold">DIBLOKIR 🚫</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Penyebab:</span>
              <span className="text-slate-300 font-medium">{lastViolationReason}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Hubungi pengawas atau guru untuk meminta izin ulang (reset) melalui menu Ujian Live.
          </p>

          {onExitStudentView && (
            <button
              onClick={onExitStudentView}
              className="w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
            >
              Kembali ke Menu Utama
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 5: SUBMITTED CONFIRMATION                           */}
      {/* ======================================================== */}
      {phase === 'submitted' && (
        <div className="w-full max-w-md rounded-3xl border border-[#1b263b] bg-[#0c1322] p-8 text-center space-y-6 shadow-2xl shadow-black/80 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Ujian Berhasil Dikirimkan!</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Terima kasih, <strong>{studentName}</strong>. Lembar jawaban Anda telah diterima dan tercatat di akun pengawas.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#070d18] border border-slate-800 text-xs text-left space-y-2.5">
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Mata Pelajaran:</span>
              <span className="text-white font-bold">{quizSubject}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Kode Token:</span>
              <span className="font-mono text-indigo-300 font-bold">{tokenInput}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Batas Pelanggaran Keluar Layar:</span>
              <span className="text-white font-bold font-mono">{violationLimit} kali</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pelanggaran Terdeteksi:</span>
              <span className={violationsCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {violationsCount > 0 ? `${violationsCount}x dari maks ${violationLimit}x` : `0 / ${violationLimit}x (Bersih)`}
              </span>
            </div>
          </div>

          {onExitStudentView && (
            <button
              onClick={onExitStudentView}
              className="w-full py-3.5 rounded-2xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              Selesai & Keluar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
