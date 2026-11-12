import React, { useState, useEffect } from 'react';
import { NavTab, SubscriptionInfo, TransactionRecord, QuestionItem, ExamSession, StudentProgress, CheatingViolation, GoogleFormRecord, SoalBatch, ExamTokenItem } from './types';
import { initialSubscription, initialTransactions, initialQuestions, initialExamSession, initialStudents, initialViolations, availablePackages, initialBatches } from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatusPaketView } from './components/views/StatusPaketView';
import { DashboardView } from './components/views/DashboardView';
import { AiGeneratorView } from './components/views/AiGeneratorView';
import { BankSoalView } from './components/views/BankSoalView';
import { UjianLiveView } from './components/views/UjianLiveView';
import { TokenSiswaView } from './components/views/TokenSiswaView';
import { NilaiSiswaView } from './components/views/NilaiSiswaView';
import { RiwayatPelanggaranView } from './components/views/RiwayatPelanggaranView';
import { GoogleFormsView } from './components/views/GoogleFormsView';
import { DownloadAplikasiView } from './components/views/DownloadAplikasiView';
import { YangBaruView } from './components/views/YangBaruView';
import { PerpanjangPaketView } from './components/views/PerpanjangPaketView';
import { PanduanView } from './components/views/PanduanView';
import { SettingsView } from './components/views/SettingsView';
import { LoginView } from './components/views/LoginView';
import { UjianSiswaView } from './components/views/UjianSiswaView';
import { liveExamService } from './services/liveExamService';

export default function App() {
  // Check if URL contains ?token= or ?mode=ujian for Student Web Exam Mode
  const [urlToken, setUrlToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const mode = params.get('mode');
      if (token && token.trim()) {
        return token.trim().toUpperCase();
      }
      if (mode === 'ujian' || mode === 'siswa') {
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
        return 'ZJT0P4M';
      }
    }
    return null;
  });

  // Authentication state - Default to false to showcase the requested login screen
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('feri.yana111783@gmail.com');

  // Navigation tab - Default to 'dashboard'
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Currently monitored token in Ujian Live for header synchronization
  const [liveMonitoringToken, setLiveMonitoringToken] = useState<ExamTokenItem | null>(null);

  // Dark mode state - Default to true matching dark palette in screenshot
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('soalpintar_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Real-time API simulation stats
  const [apiConnected, setApiConnected] = useState(true);
  const [apiLatency, setApiLatency] = useState(24);

  // Core app state with localStorage persistence - default empty database
  const [subscription, setSubscription] = useState<SubscriptionInfo>(initialSubscription);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    try {
      const isWiped = localStorage.getItem('soalpintar_db_cleared_v1');
      if (isWiped) {
        const saved = localStorage.getItem('soalpintar_questions');
        if (saved) return JSON.parse(saved);
        return [];
      }
    } catch (e) {
      console.warn('Failed to parse cached questions:', e);
    }
    return [];
  });
  const [examSession, setExamSession] = useState<ExamSession>(initialExamSession);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [violations, setViolations] = useState<CheatingViolation[]>([]);
  const [batches, setBatches] = useState<SoalBatch[]>(() => {
    try {
      const isWiped = localStorage.getItem('soalpintar_db_cleared_v1');
      if (isWiped) {
        const saved = localStorage.getItem('soalpintar_batches');
        if (saved) return JSON.parse(saved);
        return [];
      }
    } catch (e) {
      console.warn('Failed to parse cached batches:', e);
    }
    return [];
  });
  const [googleForms, setGoogleForms] = useState<GoogleFormRecord[]>(() => {
    try {
      const isWiped = localStorage.getItem('soalpintar_db_cleared_v1');
      if (isWiped) {
        const saved = localStorage.getItem('soalpintar_google_forms');
        if (saved) {
          const parsed: GoogleFormRecord[] = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
        return [];
      }
    } catch (e) {
      console.warn('Failed to parse cached google forms:', e);
    }
    return [];
  });

  // Clean up legacy dummy simulation records and wipe database
  useEffect(() => {
    try {
      const isDbCleared = localStorage.getItem('soalpintar_db_cleared_all');
      if (!isDbCleared) {
        localStorage.removeItem('soalpintar_questions');
        localStorage.removeItem('soalpintar_batches');
        localStorage.removeItem('soalpintar_google_forms');
        localStorage.removeItem('soalpintar_token_list');
        localStorage.removeItem('soalpintar_pantau_students');
        localStorage.removeItem('soalpintar_active_exam');
        localStorage.removeItem('soalpintar_selected_live_token');
        localStorage.setItem('soalpintar_db_cleared_all', 'true');
        setQuestions([]);
        setBatches([]);
        setGoogleForms([]);
        setStudents([]);
        setViolations([]);
        setTransactions([]);
        fetch('/api/database/clear-all', { method: 'POST' }).catch(() => {});
      } else {
        localStorage.removeItem('soalpintar_pantau_students');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleClearAllDatabase = async () => {
    setQuestions([]);
    setBatches([]);
    setGoogleForms([]);
    setStudents([]);
    setViolations([]);
    setTransactions([]);
    setExamSession({
      id: `ses-${Date.now()}`,
      title: 'Belum Ada Ujian Aktif',
      token: '—',
      subject: '—',
      grade: '—',
      durationMinutes: 90,
      totalQuestions: 0,
      isActive: false,
      startTime: '—',
      totalStudents: 0,
      completedStudents: 0
    });
    setLiveMonitoringToken(null);
    try {
      localStorage.removeItem('soalpintar_questions');
      localStorage.removeItem('soalpintar_batches');
      localStorage.removeItem('soalpintar_google_forms');
      localStorage.removeItem('soalpintar_token_list');
      localStorage.removeItem('soalpintar_pantau_students');
      localStorage.removeItem('soalpintar_active_exam');
      localStorage.removeItem('soalpintar_selected_live_token');
      localStorage.setItem('soalpintar_db_cleared_all', 'true');
      window.dispatchEvent(new Event('soalpintar_tokens_updated'));
      window.dispatchEvent(new Event('soalpintar_pantau_updated'));
      window.dispatchEvent(new Event('soalpintar_selected_live_token_changed'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Failed clearing localStorage:', e);
    }
    try {
      await fetch('/api/database/clear-all', { method: 'POST' });
    } catch {}
  };

  // Persist core data in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('soalpintar_questions', JSON.stringify(questions));
    } catch (e) {
      console.warn('Failed to save questions to localStorage:', e);
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem('soalpintar_batches', JSON.stringify(batches));
    } catch (e) {
      console.warn('Failed to save batches to localStorage:', e);
    }
  }, [batches]);

  useEffect(() => {
    try {
      localStorage.setItem('soalpintar_google_forms', JSON.stringify(googleForms));

      // Sync existing items in token list with Google Forms (ONLY sync matching, do NOT auto-insert uncreated tokens)
      const existingTokenListStr = localStorage.getItem('soalpintar_token_list');
      let currentTokenList: ExamTokenItem[] = [];
      if (existingTokenListStr) {
        try {
          const parsed = JSON.parse(existingTokenListStr);
          if (Array.isArray(parsed)) currentTokenList = parsed;
        } catch {}
      }

      let updatedList = [...currentTokenList];
      let changed = false;

      googleForms.forEach((form) => {
        if (!form.token) return;
        const matchedIndex = updatedList.findIndex(
          (t) => t.token.toUpperCase() === form.token!.toUpperCase() || t.quiz.toLowerCase() === form.name.toLowerCase()
        );

        if (matchedIndex >= 0) {
          const item = updatedList[matchedIndex];
          if (
            item.token !== form.token ||
            item.quiz !== form.name ||
            item.status !== (form.status === 'Aktif' ? 'Aktif' : 'Nonaktif') ||
            item.formUrl !== form.url
          ) {
            updatedList[matchedIndex] = {
              ...item,
              token: form.token,
              quiz: form.name,
              status: form.status === 'Aktif' ? 'Aktif' : 'Nonaktif',
              formUrl: form.url,
              expiry: form.expiresAt ? new Date(form.expiresAt).toLocaleDateString('id-ID') : item.expiry
            };
            changed = true;
          }
        } else {
          // If a token was generated in Distribusi Google Form, insert it into tokenList for Token Siswa
          updatedList.unshift({
            id: `tok-${form.id}`,
            token: form.token,
            label: form.targetClass ? `${form.targetClass} - ${form.name}` : form.name,
            quiz: form.name,
            formUrl: form.url,
            violationLimit: 1,
            status: form.status === 'Aktif' ? 'Aktif' : 'Nonaktif',
            expiry: form.expiresAt ? new Date(form.expiresAt).toLocaleDateString('id-ID') : '—',
            waitingRoom: false,
            createdAt: 'Baru saja'
          });
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem('soalpintar_token_list', JSON.stringify(updatedList));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('soalpintar_tokens_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {
      console.warn('Failed to save googleForms or sync token list:', e);
    }
  }, [googleForms]);

  // Sync theme to root class and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('soalpintar_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('soalpintar_theme', 'light');
    }
  }, [isDarkMode]);

  // Periodic API Ping / Latency Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      // Small realistic jitter between 21ms and 35ms
      setApiLatency(Math.floor(20 + Math.random() * 15));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Handler for Plan Renewal / Extension
  const handleRenewPlan = (
    planName: string,
    amount: number,
    durationDays: number,
    paymentMethod: string
  ) => {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')} ${
      ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][now.getMonth()]
    } ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      invoiceNumber: `INV/${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}/SPT/${Math.floor(100000 + Math.random() * 900000)}`,
      planName,
      date: formattedDate,
      amount,
      amountFormatted: `Rp ${amount.toLocaleString('id-ID')}`,
      status: 'DISETUJUI',
      paymentMethod
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Extend subscription activeUntil by 1 year (e.g. 2027 -> 2028)
    const currentYearMatch = subscription.activeUntil.match(/\d{4}/);
    const newYear = currentYearMatch ? parseInt(currentYearMatch[0], 10) + 1 : 2028;
    const newActiveUntil = subscription.activeUntil.replace(/\d{4}/, newYear.toString());

    setSubscription((prev) => ({
      ...prev,
      tierName: planName,
      activeUntil: newActiveUntil,
      daysRemaining: prev.daysRemaining + durationDays,
      status: 'Active'
    }));
  };

  // Real-time Event Simulator during live exams
  const handleSimulateLiveEvent = () => {
    setStudents((prev) => {
      const updated = [...prev];
      const randomIndex = Math.floor(Math.random() * updated.length);
      const student = { ...updated[randomIndex] };

      if (student.status !== 'Selesai') {
        const increment = Math.floor(Math.random() * 8) + 4;
        const newProgress = Math.min(100, student.progressPercent + increment);
        student.progressPercent = newProgress;
        student.lastActive = 'Baru saja';

        if (newProgress >= 100) {
          student.status = 'Selesai';
          student.currentScore = Math.floor(75 + Math.random() * 25);
        } else if (Math.random() < 0.25 && student.violationsCount < 3) {
          // Occasional simulated tab switch violation
          student.violationsCount += 1;
          student.status = 'Terdeteksi Melanggar';

          const violationTypes: CheatingViolation['violationType'][] = [
            'Pindah Tab / Browser',
            'Layar Terbelah (Split Screen)',
            'Upaya Salin Teks (Copy-Paste)',
            'Keluar dari Fullscreen'
          ];
          const chosenType = violationTypes[Math.floor(Math.random() * violationTypes.length)];

          const newViolation: CheatingViolation = {
            id: `viol-${Date.now()}`,
            studentName: student.name,
            classGroup: student.classGroup,
            examTitle: examSession.title,
            violationType: chosenType,
            severity: student.violationsCount >= 2 ? 'Tinggi' : 'Sedang',
            timestamp: `${new Date().toLocaleTimeString('id-ID')} WIB`,
            durationSeconds: Math.floor(5 + Math.random() * 15)
          };

          setViolations((v) => [newViolation, ...v]);
        }
        updated[randomIndex] = student;
      }
      return updated;
    });
  };

  const handleSendWarning = (studentId: string) => {
    const targetStudent = students.find((s) => s.id === studentId);
    if (targetStudent) {
      const newViolation: CheatingViolation = {
        id: `viol-${Date.now()}`,
        studentName: targetStudent.name,
        classGroup: targetStudent.classGroup,
        examTitle: examSession.title,
        violationType: 'Peringatan Pengawas (Intervensi Manual)',
        severity: 'Tinggi',
        timestamp: `${new Date().toLocaleTimeString('id-ID')} WIB`,
        durationSeconds: 10
      };
      setViolations((prev) => [newViolation, ...prev]);
    }

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              lastActive: 'Peringatan Terkirim',
              violationsCount: s.violationsCount + 1,
              status: 'Terdeteksi Melanggar'
            }
          : s
      )
    );
  };

  const handleAddGoogleForm = (newForm: GoogleFormRecord) => {
    setGoogleForms((prev) => [newForm, ...prev]);
  };

  const handleUpdateGoogleForm = (updatedForm: GoogleFormRecord) => {
    let finalUrl = updatedForm.url;
    if (updatedForm.token && !finalUrl.includes(`token=${updatedForm.token}`)) {
      finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}token=${updatedForm.token}&soal=${encodeURIComponent(updatedForm.name)}`;
    }

    const finalForm: GoogleFormRecord = {
      ...updatedForm,
      url: finalUrl
    };

    setGoogleForms((prev) =>
      prev.map((f) => (f.id === finalForm.id ? finalForm : f))
    );

    // If activated, automatically update examSession and active monitoring token
    if (finalForm.status === 'Aktif' && finalForm.token) {
      setExamSession((prev) => ({
        ...prev,
        token: finalForm.token!,
        title: finalForm.name
      }));
      setLiveMonitoringToken({
        id: `tok-${finalForm.id}`,
        token: finalForm.token,
        label: finalForm.targetClass ? `${finalForm.targetClass} - ${finalForm.name}` : finalForm.name,
        quiz: finalForm.name,
        formUrl: finalForm.url,
        violationLimit: 1,
        status: 'Aktif',
        expiry: finalForm.expiresAt ? new Date(finalForm.expiresAt).toLocaleDateString('id-ID') : '—',
        waitingRoom: false,
        createdAt: 'Baru saja'
      });
      try {
        localStorage.setItem('soalpintar_selected_live_token', finalForm.token);
        localStorage.setItem('soalpintar_active_exam', JSON.stringify({
          id: finalForm.id,
          token: finalForm.token,
          name: finalForm.name,
          url: finalForm.url
        }));
        window.dispatchEvent(new Event('soalpintar_selected_live_token_changed'));
        window.dispatchEvent(new Event('soalpintar_tokens_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }
  };

  const handleToggleGoogleFormStatus = (id: string) => {
    setGoogleForms((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const willBeActive = f.status !== 'Aktif';
        const assignedToken = f.token || `SPT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        let finalUrl = f.url;
        if (willBeActive && assignedToken && !finalUrl.includes(`token=${assignedToken}`)) {
          finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}token=${assignedToken}&soal=${encodeURIComponent(f.name)}`;
        }
        const updated = {
          ...f,
          status: willBeActive ? ('Aktif' as const) : ('Nonaktif' as const),
          tokenActive: willBeActive,
          token: willBeActive ? assignedToken : f.token,
          url: finalUrl,
          tokenActivatedAt: willBeActive ? new Date().toISOString() : undefined,
          expiresAt: willBeActive
            ? new Date(Date.now() + (f.durationMinutes || 90) * 60 * 1000).toISOString()
            : undefined
        };

        if (willBeActive && updated.token) {
          setExamSession((p) => ({
            ...p,
            token: updated.token!,
            title: updated.name
          }));
          try {
            localStorage.setItem('soalpintar_selected_live_token', updated.token);
            localStorage.setItem('soalpintar_active_exam', JSON.stringify({
              id: updated.id,
              token: updated.token,
              name: updated.name,
              url: updated.url
            }));
            window.dispatchEvent(new Event('soalpintar_selected_live_token_changed'));
            window.dispatchEvent(new Event('soalpintar_tokens_updated'));
            window.dispatchEvent(new Event('storage'));
          } catch {}
        }

        return updated;
      })
    );
  };

  const handleExtendGoogleFormTime = (id: string, additionalMinutes: number) => {
    setGoogleForms((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const currentExp = f.expiresAt ? new Date(f.expiresAt).getTime() : Date.now();
        const baseTime = currentExp > Date.now() ? currentExp : Date.now();
        const newExpiry = new Date(baseTime + additionalMinutes * 60 * 1000).toISOString();
        return {
          ...f,
          status: 'Aktif',
          tokenActive: true,
          expiresAt: newExpiry,
          durationMinutes: (f.durationMinutes || 0) + additionalMinutes
        };
      })
    );
  };

  const handleActivateFormFromToken = (formName: string, token: string, expiresAt?: string, formUrl?: string) => {
    setGoogleForms((prev) => {
      let found = false;
      const updated = prev.map((f) => {
        if (f.name.toLowerCase() === formName.toLowerCase() || (f.token && f.token.toUpperCase() === token.toUpperCase())) {
          found = true;
          let targetUrl = formUrl || f.url;
          if (!targetUrl.includes('token=')) {
            targetUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}token=${token}&soal=${encodeURIComponent(formName || f.name)}`;
          }
          return {
            ...f,
            name: formName || f.name,
            status: 'Aktif' as const,
            token,
            tokenActive: true,
            tokenActivatedAt: new Date().toISOString(),
            expiresAt: expiresAt || new Date(Date.now() + 90 * 60 * 1000).toISOString(),
            url: targetUrl
          };
        }
        return f;
      });

      if (!found) {
        let validLiveFormUrl = formUrl || 'https://docs.google.com/forms/d/e/1FAIpQLScL2dlWq2uZqoU8208FMWa224h1uXqhkX7NP1hvUqG1iR3L_A/viewform';
        if (!validLiveFormUrl.includes('token=')) {
          validLiveFormUrl = `${validLiveFormUrl}${validLiveFormUrl.includes('?') ? '&' : '?'}token=${token}&soal=${encodeURIComponent(formName || 'Soal Ujian Baru')}`;
        }
        const validLiveEditUrl = 'https://docs.google.com/forms/d/1bdQB30ITgnXA2a3eS2dn6mpfzZh2BTQI9Gp_UuuT12g/edit';

        const newForm: GoogleFormRecord = {
          id: `gf-${Date.now()}`,
          name: formName || 'Soal Ujian Baru',
          url: validLiveFormUrl,
          editUrl: validLiveEditUrl,
          questionCount: 20,
          status: 'Aktif',
          token: token,
          tokenActive: true,
          tokenActivatedAt: new Date().toISOString(),
          durationMinutes: 90,
          expiresAt: expiresAt || new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          targetClass: 'Kelas 9A',
          createdAt: 'Baru saja'
        };
        return [newForm, ...updated];
      }
      return updated;
    });
  };

  const handleDeleteToken = (tokenCode: string, quizName?: string) => {
    // 1. Unlink token from Google Forms so it has no token and is Nonaktif
    setGoogleForms((prev) =>
      prev.map((f) => {
        const isMatch =
          (f.token && f.token.toUpperCase() === tokenCode.toUpperCase()) ||
          (quizName && f.name.toLowerCase() === quizName.toLowerCase());
        if (isMatch) {
          return {
            ...f,
            token: undefined,
            tokenActive: false,
            status: 'Nonaktif' as const,
            expiresAt: undefined,
            tokenActivatedAt: undefined
          };
        }
        return f;
      })
    );

    // 2. Remove token from localStorage 'soalpintar_token_list'
    try {
      const saved = localStorage.getItem('soalpintar_token_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (t: ExamTokenItem) =>
              t.token.toUpperCase() !== tokenCode.toUpperCase() &&
              (!quizName || t.quiz.toLowerCase() !== quizName.toLowerCase())
          );
          localStorage.setItem('soalpintar_token_list', JSON.stringify(filtered));
          window.dispatchEvent(new Event('soalpintar_tokens_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {
      console.warn('Failed to delete token from storage:', e);
    }
  };

  const handleDeleteGoogleForm = (id: string) => {
    const target = googleForms.find((f) => f.id === id);
    setGoogleForms((prev) => prev.filter((f) => f.id !== id));
    if (target && target.token) {
      handleDeleteToken(target.token, target.name);
    }
  };

  const handleForceSubmit = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              progressPercent: 100,
              status: 'Selesai',
              currentScore: s.currentScore || Math.floor(65 + Math.random() * 20),
              lastActive: 'Dikumpulkan Pengawas'
            }
          : s
      )
    );
  };

  // Add questions from AI or manual to bank
  const handleSaveQuestionsToBank = (
    newQuestions: QuestionItem[],
    batchInfo?: {
      topic: string;
      grade: string;
      subject?: string;
      optionsCount: number;
      batchCode?: string;
      batchId?: string;
    }
  ): SoalBatch | undefined => {
    const assignedBatchId = batchInfo?.batchId || `batch-${Date.now()}`;
    const taggedQuestions = newQuestions.map((q, idx) => ({
      ...q,
      batchId: assignedBatchId,
      id: q.id || `q-${Date.now()}-${idx}`
    }));

    setQuestions((prev) => {
      // Filter out previous questions belonging to this batch if updating
      const remaining = batchInfo?.batchId
        ? prev.filter((q) => q.batchId !== batchInfo.batchId)
        : prev;
      return [...taggedQuestions, ...remaining];
    });

    if (batchInfo) {
      const levelMatch = batchInfo.grade.match(/SMP|SMA|SD|SMK/i);
      const level = levelMatch ? levelMatch[0].toUpperCase() : 'SMP';
      const cleanTopic = batchInfo.topic.trim() || 'Paket Soal';
      const defaultCode = `BATCH-${cleanTopic.slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      let resultBatch: SoalBatch;

      setBatches((prev) => {
        const existingIdx = prev.findIndex((b) => b.id === batchInfo.batchId);
        if (existingIdx >= 0) {
          const current = prev[existingIdx];
          resultBatch = {
            ...current,
            topic: cleanTopic,
            subject: batchInfo.subject || current.subject || 'Mata Pelajaran Umum',
            level,
            grade: batchInfo.grade,
            questionCount: taggedQuestions.length,
            optionsCount: batchInfo.optionsCount || current.optionsCount || 4,
            questions: taggedQuestions
          };
          const next = [...prev];
          next[existingIdx] = resultBatch;
          return next;
        } else {
          resultBatch = {
            id: assignedBatchId,
            topic: cleanTopic,
            subject: batchInfo.subject || 'Mata Pelajaran Umum',
            level,
            grade: batchInfo.grade,
            questionCount: taggedQuestions.length,
            optionsCount: batchInfo.optionsCount || 4,
            batchCode: batchInfo.batchCode || defaultCode,
            createdAt: 'Baru saja',
            status: 'Terbit',
            formUrl: `https://docs.google.com/forms/d/e/1FAIpQLSc_${assignedBatchId}/viewform`,
            questions: taggedQuestions
          };
          return [resultBatch, ...prev];
        }
      });

      return resultBatch!;
    }
    return undefined;
  };

  const handleAddBatch = (newBatch: SoalBatch) => {
    setBatches((prev) => [newBatch, ...prev]);
  };

  const handleUpdateBatch = (updatedBatch: SoalBatch) => {
    setBatches((prev) => prev.map((b) => (b.id === updatedBatch.id ? updatedBatch : b)));
  };

  const handleDeleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleGenerateNewToken = (newToken: string) => {
    setExamSession((prev) => ({
      ...prev,
      token: newToken,
      isActive: true
    }));
    setLiveMonitoringToken((prev) => {
      if (prev) {
        return { ...prev, token: newToken, status: 'Aktif' };
      }
      return {
        id: `tok-${Date.now()}`,
        token: newToken,
        label: 'Ulangan Harian',
        quiz: 'Segitiga (SMP)',
        violationLimit: 1,
        status: 'Aktif',
        expiry: '—',
        waitingRoom: false,
        createdAt: 'Baru saja'
      };
    });
    try {
      localStorage.setItem('soalpintar_selected_live_token', newToken);
      localStorage.setItem('soalpintar_last_created_token', newToken);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('soalpintar_tokens_updated'));
        window.dispatchEvent(new Event('soalpintar_selected_live_token_changed'));
        window.dispatchEvent(new Event('storage'));
      }
    } catch {}
  };

  const [liveActiveCount, setLiveActiveCount] = useState<number>(() => {
    return liveExamService.getStudents().filter((s) => s.status === 'Mengerjakan').length;
  });

  useEffect(() => {
    const unsub = liveExamService.subscribe((list) => {
      setLiveActiveCount(list.filter((s) => s.status === 'Mengerjakan').length);
    });
    return () => unsub();
  }, []);

  // Render Student Web Exam Portal directly if token or student mode is requested in URL
  if (urlToken !== null) {
    return (
      <UjianSiswaView
        initialToken={urlToken}
        isDarkMode={isDarkMode}
        onExitStudentView={() => {
          setUrlToken(null);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', window.location.pathname);
          }
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(email) => {
          setUserEmail(email);
          setIsAuthenticated(true);
        }}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkMode ? 'bg-[#080d1a] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        liveStudentsCount={liveActiveCount}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onOpenMobileMenu={() => setMobileOpen(true)}
          apiConnected={apiConnected}
          apiLatency={apiLatency}
          customHeaderTitle={
            currentTab === 'ujian-live' && liveMonitoringToken
              ? `Ujian Live · ${liveMonitoringToken.token}`
              : undefined
          }
          customHeaderSubtitle={
            currentTab === 'ujian-live' && liveMonitoringToken
              ? `${liveMonitoringToken.label} · ${liveMonitoringToken.quiz}`
              : undefined
          }
        />

        {/* Dynamic View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {currentTab === 'status-paket' && (
            <StatusPaketView
              subscription={subscription}
              transactions={transactions}
              isDarkMode={isDarkMode}
              onRenewPlan={handleRenewPlan}
              onGoToPricing={() => setCurrentTab('perpanjang-paket')}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              subscription={subscription}
              questions={questions}
              examSession={examSession}
              students={students}
              isDarkMode={isDarkMode}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'ai-generator' && (
            <AiGeneratorView
              isDarkMode={isDarkMode}
              batches={batches}
              onSaveToBank={handleSaveQuestionsToBank}
              onUpdateBatch={handleUpdateBatch}
              onNavigate={(tab) => setCurrentTab(tab)}
              onAddGoogleForm={handleAddGoogleForm}
            />
          )}

          {currentTab === 'bank-soal' && (
            <BankSoalView
              questions={questions}
              batches={batches}
              isDarkMode={isDarkMode}
              onAddQuestion={(q) => handleSaveQuestionsToBank([q])}
              onDeleteQuestion={handleDeleteQuestion}
              onDeleteBatch={handleDeleteBatch}
              onAddBatch={handleAddBatch}
              onUpdateBatch={handleUpdateBatch}
              onAddGoogleForm={handleAddGoogleForm}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'ujian-live' && (
            <UjianLiveView
              examSession={examSession}
              students={students}
              violations={violations}
              isDarkMode={isDarkMode}
              googleForms={googleForms}
              onSimulateEvent={handleSimulateLiveEvent}
              onSendWarning={handleSendWarning}
              onForceSubmit={handleForceSubmit}
              onNavigate={(tab) => setCurrentTab(tab)}
              onMonitoringTokenChange={setLiveMonitoringToken}
            />
          )}

          {currentTab === 'token-siswa' && (
            <TokenSiswaView
              isDarkMode={isDarkMode}
              currentToken={examSession.token}
              googleForms={googleForms}
              onGenerateNewToken={handleGenerateNewToken}
              onActivateFormFromToken={handleActivateFormFromToken}
              onUpdateGoogleForm={handleUpdateGoogleForm}
              onToggleGoogleFormStatus={handleToggleGoogleFormStatus}
              onDeleteToken={handleDeleteToken}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'nilai-siswa' && (
            <NilaiSiswaView
              students={students}
              isDarkMode={isDarkMode}
            />
          )}

          {currentTab === 'riwayat-pelanggaran' && (
            <RiwayatPelanggaranView
              violations={violations}
              isDarkMode={isDarkMode}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'google-forms' && (
            <GoogleFormsView
              questions={questions}
              isDarkMode={isDarkMode}
              googleForms={googleForms}
              onAddGoogleForm={handleAddGoogleForm}
              onUpdateGoogleForm={handleUpdateGoogleForm}
              onToggleStatus={handleToggleGoogleFormStatus}
              onExtendTime={handleExtendGoogleFormTime}
              onDeleteGoogleForm={handleDeleteGoogleForm}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'download-aplikasi' && (
            <DownloadAplikasiView
              isDarkMode={isDarkMode}
            />
          )}

          {currentTab === 'yang-baru' && (
            <YangBaruView
              isDarkMode={isDarkMode}
            />
          )}

          {currentTab === 'perpanjang-paket' && (
            <PerpanjangPaketView
              subscription={subscription}
              isDarkMode={isDarkMode}
              onSelectRenew={(pkgId) => {
                const selected = availablePackages.find((p) => p.id === pkgId) || availablePackages[0];
                handleRenewPlan(selected.name, selected.price, selected.durationDays, 'QRIS Real-Time');
                setCurrentTab('status-paket');
              }}
            />
          )}

          {currentTab === 'panduan' && (
            <PanduanView
              isDarkMode={isDarkMode}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              isDarkMode={isDarkMode}
              onNavigate={(tab) => setCurrentTab(tab)}
              onClearAllDatabase={handleClearAllDatabase}
            />
          )}

          {currentTab === 'ujian-siswa' && (
            <UjianSiswaView
              initialToken={
                liveMonitoringToken?.token ||
                (typeof window !== 'undefined'
                  ? localStorage.getItem('soalpintar_last_created_token') ||
                    localStorage.getItem('soalpintar_selected_live_token')
                  : null) ||
                examSession.token ||
                'ZJT0P4M'
              }
              isDarkMode={isDarkMode}
              onExitStudentView={() => setCurrentTab('ujian-live')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
