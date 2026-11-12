import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  HelpCircle,
  Info,
  ListOrdered,
  Target,
  FileText,
  Upload,
  ClipboardPaste,
  Database,
  ArrowRight,
  Check,
  Copy,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Save,
  ExternalLink,
  RotateCw,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuestionItem, SoalBatch, NavTab, GoogleFormRecord } from '../../types';
import { generateSoalWithAI } from '../../services/geminiService';

interface AiGeneratorViewProps {
  isDarkMode: boolean;
  batches?: SoalBatch[];
  onSaveToBank: (
    questions: QuestionItem[],
    batchInfo?: {
      topic: string;
      grade: string;
      subject?: string;
      optionsCount: number;
      batchCode?: string;
      batchId?: string;
    }
  ) => SoalBatch | undefined | void;
  onUpdateBatch?: (batch: SoalBatch) => void;
  onNavigate?: (tab: NavTab) => void;
  onAddGoogleForm?: (form: GoogleFormRecord) => void;
}

const GENERATION_STEPS = [
  {
    title: 'Membaca topik, jenjang',
    progressLabel: 'Membaca topik, jenjang...',
    targetProgress: 20
  },
  {
    title: 'Menyusun pertanyaan sesuai tingkat kognitif',
    progressLabel: 'Menyusun pertanyaan...',
    targetProgress: 42
  },
  {
    title: 'Membuat pilihan jawaban & kunci',
    progressLabel: 'Membuat pilihan jawaban & kunci...',
    targetProgress: 68
  },
  {
    title: 'Memeriksa kualitas & menghindari soal ganda',
    progressLabel: 'Memeriksa kualitas & menghindari soal ganda...',
    targetProgress: 88
  },
  {
    title: 'Menyimpan ke Bank Soal',
    progressLabel: 'Menyimpan ke Bank Soal...',
    targetProgress: 98
  }
];

function detectSubjectFromTopic(topicText: string): string {
  const t = (topicText || '').toLowerCase();
  if (
    t.includes('kerucut') ||
    t.includes('aljabar') ||
    t.includes('matematika') ||
    t.includes('bangun ruang') ||
    t.includes('pythagoras') ||
    t.includes('persamaan') ||
    t.includes('lingkaran') ||
    t.includes('pecahan') ||
    t.includes('hitung') ||
    t.includes('geometri')
  ) {
    return 'Matematika';
  }
  if (
    t.includes('fotosintesis') ||
    t.includes('sel') ||
    t.includes('tata surya') ||
    t.includes('listrik') ||
    t.includes('energi') ||
    t.includes('gaya') ||
    t.includes('ekosistem') ||
    t.includes('magnet') ||
    t.includes('ipa') ||
    t.includes('biologi') ||
    t.includes('fisika')
  ) {
    return 'Ilmu Pengetahuan Alam (IPA)';
  }
  if (
    t.includes('sejarah') ||
    t.includes('diponegoro') ||
    t.includes('proklamasi') ||
    t.includes('peta') ||
    t.includes('ekonomi') ||
    t.includes('ips') ||
    t.includes('sosiologi') ||
    t.includes('geografi')
  ) {
    return 'Ilmu Pengetahuan Sosial (IPS)';
  }
  if (
    t.includes('paragraf') ||
    t.includes('puisi') ||
    t.includes('pantun') ||
    t.includes('cerpen') ||
    t.includes('teks') ||
    t.includes('bahasa indonesia') ||
    t.includes('ejaan') ||
    t.includes('kalimat')
  ) {
    return 'Bahasa Indonesia';
  }
  if (
    t.includes('english') ||
    t.includes('grammar') ||
    t.includes('tense') ||
    t.includes('narrative') ||
    t.includes('reading') ||
    t.includes('inggris')
  ) {
    return 'Bahasa Inggris';
  }
  if (
    t.includes('agama') ||
    t.includes('fiqih') ||
    t.includes('aqidah') ||
    t.includes('quran') ||
    t.includes('hadits') ||
    t.includes('pai')
  ) {
    return 'Pendidikan Agama Islam';
  }
  return 'Matematika';
}

export const AiGeneratorView: React.FC<AiGeneratorViewProps> = ({
  isDarkMode,
  batches = [],
  onSaveToBank,
  onUpdateBatch,
  onNavigate,
  onAddGoogleForm
}) => {
  // Form state
  const [topic, setTopic] = useState('Kerucut');
  const [gradeClass, setGradeClass] = useState('SMP Kelas 9');
  const [subject, setSubject] = useState('Matematika');
  const [isSubjectManual, setIsSubjectManual] = useState(false);
  const [questionType, setQuestionType] = useState<'pilihan-ganda' | 'esai'>('pilihan-ganda');
  const [cognitiveLevel, setCognitiveLevel] = useState<'Campuran' | 'LOTS' | 'MOTS' | 'HOTS'>('Campuran');
  const [optionsCount, setOptionsCount] = useState<number>(4);
  const [learningIndicator, setLearningIndicator] = useState('');
  const [referenceMode, setReferenceMode] = useState<'tanpa' | 'upload' | 'paste' | 'bank'>('tanpa');
  const [customReferenceText, setCustomReferenceText] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Generation Modal & Progress State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(15);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [generatedList, setGeneratedList] = useState<QuestionItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Saved Batch Tracking
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedBatchId, setSavedBatchId] = useState<string>('');
  const [savedBatchTitle, setSavedBatchTitle] = useState<string>('');
  const [savedBatchCode, setSavedBatchCode] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Modals for Editing Questions & Batch
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [editBatchTitle, setEditBatchTitle] = useState('');
  const [editBatchCode, setEditBatchCode] = useState('');
  const [isAddManualModalOpen, setIsAddManualModalOpen] = useState(false);

  // Manual Question Form State
  const [manualQText, setManualQText] = useState('');
  const [manualOptA, setManualOptA] = useState('');
  const [manualOptB, setManualOptB] = useState('');
  const [manualOptC, setManualOptC] = useState('');
  const [manualOptD, setManualOptD] = useState('');
  const [manualCorrectKey, setManualCorrectKey] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [manualExp, setManualExp] = useState('');
  const [manualDiff, setManualDiff] = useState<'Mudah' | 'Sedang' | 'HOTS'>('Sedang');

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-detect subject when user types topic, unless user manually edited subject
  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
    if (!isSubjectManual) {
      setSubject(detectSubjectFromTopic(newTopic));
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Dismiss toast after 4s
  useEffect(() => {
    if (saveToast) {
      const t = setTimeout(() => setSaveToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [saveToast]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setSavedSuccess(false);
    setActiveStepIndex(0);
    setCurrentProgress(15);
    setElapsedSeconds(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    try {
      // Step 0: Membaca topik, jenjang
      setActiveStepIndex(0);
      setCurrentProgress(20);
      await new Promise((r) => setTimeout(r, 1400));

      // Step 1: Menyusun pertanyaan sesuai tingkat kognitif
      setActiveStepIndex(1);
      setCurrentProgress(42);

      const diffMap: Record<string, 'Mudah' | 'Sedang' | 'HOTS'> = {
        LOTS: 'Mudah',
        MOTS: 'Sedang',
        HOTS: 'HOTS',
        Campuran: 'HOTS'
      };

      const targetSubject = subject || detectSubjectFromTopic(topic);

      // Start actual generation concurrently
      const generationPromise = generateSoalWithAI({
        subject: targetSubject,
        grade: gradeClass || 'SMP Kelas 9',
        topic: topic || 'Kerucut',
        difficulty: diffMap[cognitiveLevel] || 'HOTS',
        count: Math.min(questionCount, 50),
        questionType: questionType === 'pilihan-ganda' ? 'Pilihan Ganda' : 'Uraian'
      });

      await new Promise((r) => setTimeout(r, 1800));

      // Step 2: Membuat pilihan jawaban & kunci
      setActiveStepIndex(2);
      setCurrentProgress(68);
      await new Promise((r) => setTimeout(r, 1800));

      // Step 3: Memeriksa kualitas & menghindari soal ganda
      setActiveStepIndex(3);
      setCurrentProgress(88);

      const items = await generationPromise;
      await new Promise((r) => setTimeout(r, 1400));

      // Step 4: Menyimpan ke Bank Soal
      setActiveStepIndex(4);
      setCurrentProgress(98);

      const cleanTopic = topic.trim() || 'Paket Soal';
      const cleanGrade = gradeClass.trim() || 'SMP Kelas 9';
      const generatedCode = `BATCH-${cleanTopic.slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newBatchId = `batch-${Date.now()}`;
      const title = `Paket ${cleanTopic} (${cleanGrade})`;

      // Save into Bank Soal immediately
      const savedBatchResult = onSaveToBank(items, {
        topic: cleanTopic,
        grade: cleanGrade,
        subject: targetSubject,
        optionsCount: optionsCount,
        batchCode: generatedCode,
        batchId: newBatchId
      });

      await new Promise((r) => setTimeout(r, 1000));

      // Step 5: Selesai 100%
      setActiveStepIndex(5);
      setCurrentProgress(100);
      await new Promise((r) => setTimeout(r, 700));

      setGeneratedList(items);
      setSavedBatchId(newBatchId);
      setSavedBatchTitle(title);
      setSavedBatchCode(generatedCode);
      setEditBatchTitle(title);
      setEditBatchCode(generatedCode);
      setSavedSuccess(true);
      setSaveToast(`✅ Berhasil Disimpan ke Bank Soal! ${items.length} butir soal telah tercatat pada ${title}.`);

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // fallback
      }
    } catch (err) {
      console.error('Error generating and saving questions:', err);
      setSaveToast('Gagal memproses soal. Silakan coba kembali.');
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  const handleCopyQuestion = (item: QuestionItem) => {
    const text =
      `${item.question}\n` +
      item.options
        .slice(0, optionsCount)
        .map((o) => `${o.key}. ${o.text}`)
        .join('\n') +
      `\n\nKunci Jawaban: ${item.correctKey}\nPembahasan: ${item.explanation}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Re-save or update batch in Bank Soal
  const handleUpdateBatchMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTitle = editBatchTitle.trim() || savedBatchTitle;
    const updatedCode = editBatchCode.trim() || savedBatchCode;

    setSavedBatchTitle(updatedTitle);
    setSavedBatchCode(updatedCode);

    onSaveToBank(generatedList, {
      topic: updatedTitle,
      grade: gradeClass,
      subject: subject,
      optionsCount: optionsCount,
      batchCode: updatedCode,
      batchId: savedBatchId
    });

    setIsEditBatchModalOpen(false);
    setSaveToast(`✅ Informasi Paket "${updatedTitle}" berhasil diperbarui di Bank Soal!`);
  };

  // Resave entire batch as a fresh duplicate in Bank Soal
  const handleResaveAsNewBatch = () => {
    const newCode = `BATCH-${topic.slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newTitle = `${savedBatchTitle} (Salinan)`;
    const newBatchId = `batch-${Date.now()}`;

    onSaveToBank(generatedList, {
      topic: newTitle,
      grade: gradeClass,
      subject: subject,
      optionsCount: optionsCount,
      batchCode: newCode,
      batchId: newBatchId
    });

    setSavedBatchId(newBatchId);
    setSavedBatchTitle(newTitle);
    setSavedBatchCode(newCode);
    setSaveToast(`✅ Paket berhasil disimpan ulang sebagai batch baru (${newCode}) di Bank Soal!`);
  };

  // Save single question edit
  const handleSaveQuestionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const updatedList = generatedList.map((q) =>
      q.id === editingQuestion.id ? editingQuestion : q
    );
    setGeneratedList(updatedList);

    // Sync to Bank Soal
    onSaveToBank(updatedList, {
      topic: savedBatchTitle || topic,
      grade: gradeClass,
      subject: subject,
      optionsCount: optionsCount,
      batchCode: savedBatchCode,
      batchId: savedBatchId
    });

    setEditingQuestion(null);
    setSaveToast('✅ Perubahan butir soal berhasil disimpan ke Bank Soal!');
  };

  // Delete single question from generated set
  const handleDeleteQuestion = (questionId: string) => {
    const updatedList = generatedList.filter((q) => q.id !== questionId);
    setGeneratedList(updatedList);

    // Sync to Bank Soal
    onSaveToBank(updatedList, {
      topic: savedBatchTitle || topic,
      grade: gradeClass,
      subject: subject,
      optionsCount: optionsCount,
      batchCode: savedBatchCode,
      batchId: savedBatchId
    });

    setSaveToast('🗑️ Soal berhasil dihapus dari paket Bank Soal.');
  };

  // Add manual question to this batch
  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQText.trim()) return;

    const newQ: QuestionItem = {
      id: `manual-ai-${Date.now()}`,
      batchId: savedBatchId,
      subject: subject,
      grade: gradeClass,
      topic: topic,
      difficulty: manualDiff,
      question: manualQText,
      options: [
        { key: 'A', text: manualOptA || 'Pilihan A' },
        { key: 'B', text: manualOptB || 'Pilihan B' },
        { key: 'C', text: manualOptC || 'Pilihan C' },
        { key: 'D', text: manualOptD || 'Pilihan D' }
      ],
      correctKey: manualCorrectKey,
      explanation: manualExp || 'Pembahasan ditambahkan oleh guru.',
      createdAt: 'Baru saja'
    };

    const updatedList = [...generatedList, newQ];
    setGeneratedList(updatedList);

    // Sync to Bank Soal
    onSaveToBank(updatedList, {
      topic: savedBatchTitle || topic,
      grade: gradeClass,
      subject: subject,
      optionsCount: optionsCount,
      batchCode: savedBatchCode,
      batchId: savedBatchId
    });

    // Reset manual form
    setManualQText('');
    setManualOptA('');
    setManualOptB('');
    setManualOptC('');
    setManualOptD('');
    setManualExp('');
    setIsAddManualModalOpen(false);
    setSaveToast('✅ Soal baru berhasil ditambahkan dan disimpan ke paket!');
  };

  // Download all questions as TXT file
  const handleDownloadQuestionsTxt = () => {
    const content =
      `========================================\n` +
      `PAKET SOAL: ${savedBatchTitle || topic}\n` +
      `Mata Pelajaran: ${subject} | Kelas: ${gradeClass}\n` +
      `Kode Batch: ${savedBatchCode} | Total: ${generatedList.length} Soal\n` +
      `Di-generate oleh AI SoalPintar pada: ${new Date().toLocaleString('id-ID')}\n` +
      `========================================\n\n` +
      generatedList
        .map((q, idx) => {
          const optsText = q.options
            .slice(0, optionsCount)
            .map((o) => `  ${o.key}. ${o.text}`)
            .join('\n');
          return (
            `No. ${idx + 1} (${q.difficulty})\n` +
            `${q.question}\n` +
            `${optsText}\n` +
            `Kunci Jawaban: ${q.correctKey}\n` +
            `Pembahasan: ${q.explanation}\n\n----------------------------------------\n`
          );
        })
        .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Paket_Soal_${(savedBatchTitle || topic).replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto relative pb-16">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300 max-w-md bg-emerald-900/90 border border-emerald-400/50 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{saveToast}</span>
          </div>
          <button
            onClick={() => setSaveToast(null)}
            className="text-emerald-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AI GENERATION MODAL / OVERLAY - EXACT REPLICA OF SCREENSHOT */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-[430px] rounded-[32px] bg-[#0c1424] border border-[#1e2a42] p-7 sm:p-8 shadow-2xl text-white select-none">
            {/* Top Concentric Circular Glowing AI Orb */}
            <div className="relative mx-auto flex items-center justify-center w-28 h-28 my-1">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/25 via-teal-400/25 to-indigo-500/35 blur-xl pointer-events-none" />
              <div className="relative w-28 h-28 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-emerald-400 via-teal-400 to-indigo-500 flex items-center justify-center shadow-lg">
                <div className="w-full h-full rounded-full bg-[#0c1424] p-[5px] flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-[#8b95f6] via-[#6366f1] to-[#4338ca] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] relative overflow-hidden">
                    <div className="absolute top-1 left-2 w-8 h-8 rounded-full bg-white/20 blur-[3px] pointer-events-none" />
                    <svg
                      className="w-10 h-10 text-white fill-current drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.5C12 7.74671 7.74671 12 2.5 12C7.74671 12 12 16.2533 12 21.5C12 16.2533 16.2533 12 21.5 12C16.2533 12 12 7.74671 12 2.5Z" />
                      <path
                        d="M18.5 2.5v3M17 4h3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <circle cx="5.5" cy="18.5" r="1.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-[22px] font-bold text-white text-center mt-5 tracking-tight">
              AI sedang menyusun {questionCount} soal
            </h3>

            {/* Subtitle: [Topic] · [Grade/Class] */}
            <p className="text-sm text-slate-400 text-center mt-1.5 mb-6 font-normal">
              {topic.trim() || 'Kerucut'} · {gradeClass.trim() || 'SMP Kelas 9'}
            </p>

            {/* Progress Info Row */}
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-2 px-0.5">
              <span>
                {activeStepIndex >= 5
                  ? 'Selesai & Tersimpan di Bank Soal!'
                  : GENERATION_STEPS[activeStepIndex]?.progressLabel || 'Menyusun pertanyaan...'}
              </span>
              <span className="text-slate-400 font-normal">{elapsedSeconds} dtk</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-[#1b273d] rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[#2dd4bf] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${currentProgress}%` }}
              />
            </div>

            {/* 5 Sequential Step Checklist */}
            <div className="space-y-3.5 px-0.5">
              {GENERATION_STEPS.map((step, idx) => {
                const isCompleted = activeStepIndex > idx;
                const isActive = activeStepIndex === idx;

                return (
                  <div key={idx} className="flex items-center gap-3">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-[#0c1424] stroke-[3]" />
                      </div>
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.7)] flex items-center justify-center shrink-0 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#334155] shrink-0" />
                    )}

                    <span
                      className={`text-sm leading-tight transition-colors ${
                        isCompleted
                          ? 'text-slate-400 font-normal'
                          : isActive
                          ? 'text-white font-semibold'
                          : 'text-[#64748b] font-normal'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tips Note */}
            <p className="text-xs text-[#818cf8] text-center mt-6 font-normal">
              {learningIndicator.trim()
                ? 'Indikator Pembelajaran disertakan: soal dibuat spesifik.'
                : 'Tips: isi Indikator Pembelajaran agar soal lebih tepat sasaran.'}
            </p>

            {/* Footer Warning */}
            <p className="text-[11px] text-slate-500 text-center mt-4">
              Jangan tutup atau muat ulang halaman ini.
            </p>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-xl transition-colors ${
          isDarkMode
            ? 'bg-[#080d1a] border-[#151e33] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Block */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 shrink-0">
            <Sparkles className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Generate Soal dengan AI</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Masukkan topik dan jenjang, AI akan buatkan soal dan menyimpannya otomatis ke Bank Soal
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Field 1: Topik / Materi */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Topik / Materi</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              placeholder="Contoh: Kerucut, Fotosintesis, Perang Diponegoro, Persamaan Kuadrat..."
              required
              className={`w-full px-4 py-3 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                isDarkMode
                  ? 'bg-[#0c1426] border-[#1b273d] text-white placeholder-slate-500 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
              }`}
            />
          </div>

          {/* Grid: Jenjang & Kelas + Mata Pelajaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 2: Jenjang & Kelas */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>Jenjang & Kelas</span>
              </label>
              <input
                type="text"
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                placeholder="Contoh: SMP Kelas 9, SMA Kelas 11, SD Kelas 6..."
                required
                className={`w-full px-4 py-3 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#0c1426] border-[#1b273d] text-white placeholder-slate-500 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
                }`}
              />
            </div>

            {/* Field 3: Mata Pelajaran */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Mata Pelajaran</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {isSubjectManual ? 'Kustom' : 'Otomatis'}
                </span>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setIsSubjectManual(true);
                }}
                placeholder="Matematika, IPA, Bahasa Indonesia, dll."
                required
                className={`w-full px-4 py-3 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#0c1426] border-[#1b273d] text-white placeholder-slate-500 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
                }`}
              />
            </div>
          </div>

          {/* Field 4: Tipe Soal */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Tipe Soal</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setQuestionType('pilihan-ganda')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                  questionType === 'pilihan-ganda'
                    ? 'border-indigo-500 bg-[#161d36] text-white shadow-sm'
                    : isDarkMode
                    ? 'border-[#1b273d] bg-[#0c1426] text-slate-400 hover:text-slate-200'
                    : 'border-slate-300 bg-slate-50 text-slate-600'
                }`}
              >
                Pilihan Ganda
              </button>
              <button
                type="button"
                onClick={() => setQuestionType('esai')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                  questionType === 'esai'
                    ? 'border-indigo-500 bg-[#161d36] text-white shadow-sm'
                    : isDarkMode
                    ? 'border-[#1b273d] bg-[#0c1426] text-slate-400 hover:text-slate-200'
                    : 'border-slate-300 bg-slate-50 text-slate-600'
                }`}
              >
                Esai / Uraian
              </button>
            </div>
          </div>

          {/* Field 5: Tingkat Kognitif (Taksonomi Bloom) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Tingkat Kognitif (Taksonomi Bloom)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'Campuran', label: 'Campuran', sub: 'C1-C6' },
                { id: 'LOTS', label: 'LOTS', sub: 'C1-C2 Mengingat' },
                { id: 'MOTS', label: 'MOTS', sub: 'C3-C4 Menerapkan' },
                { id: 'HOTS', label: 'HOTS', sub: 'C5-C6 Menganalisis' }
              ].map((lvl) => {
                const isSelected = cognitiveLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setCognitiveLevel(lvl.id as typeof cognitiveLevel)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-[#1b2444] text-white shadow-md'
                        : isDarkMode
                        ? 'border-[#1e2a42] bg-[#0c1426] text-slate-300 hover:border-slate-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-xs sm:text-sm">{lvl.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{lvl.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 6: Jumlah Pilihan Jawaban */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <ListOrdered className="w-4 h-4 text-slate-400" />
              <span>Jumlah Pilihan Jawaban</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { count: 3, sub: 'SD (A-C)' },
                { count: 4, sub: 'SMP/SMA (A-D)' },
                { count: 5, sub: 'SMA/SMK (A-E)' }
              ].map((item) => {
                const isSelected = optionsCount === item.count;
                return (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setOptionsCount(item.count)}
                    className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-[#1b2444] text-white shadow-md'
                        : isDarkMode
                        ? 'border-[#1b273d] bg-[#0c1426] text-slate-300 hover:border-slate-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-extrabold text-sm sm:text-base">{item.count}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{item.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 7: Indikator Pembelajaran (Opsional) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Target className="w-4 h-4 text-slate-400" />
              <span>
                Indikator Pembelajaran <span className="font-normal text-slate-500">(Opsional)</span>
              </span>
            </label>
            <input
              type="text"
              value={learningIndicator}
              onChange={(e) => setLearningIndicator(e.target.value)}
              placeholder="Contoh: Siswa dapat menghitung volume dan luas selimut kerucut..."
              className={`w-full px-4 py-3 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                isDarkMode
                  ? 'bg-[#0c1426] border-[#1b273d] text-white placeholder-slate-500 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
              }`}
            />
          </div>

          {/* Field 8: Materi Referensi Sub-Card (Opsional) */}
          <div
            className={`p-5 rounded-2xl border ${
              isDarkMode ? 'bg-[#0c1426] border-[#1b273d]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>
                  Materi Referensi <span className="font-normal text-slate-500">(Opsional)</span>
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                BARU
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              AI membuat soal dari materi Anda sendiri (modul, buku, slide). Teks dibaca di server; hanya bagian yang relevan yang dikirim ke AI.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'tanpa', label: 'Tanpa materi' },
                { id: 'upload', label: 'Upload file' },
                { id: 'paste', label: 'Tempel teks' },
                { id: 'bank', label: 'Bank Materi (0)' }
              ].map((btn) => {
                const isSelected = referenceMode === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setReferenceMode(btn.id as typeof referenceMode)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-[#252f4a] text-white shadow-sm'
                        : isDarkMode
                        ? 'border-[#1e2a42] bg-[#090f1d] text-slate-300 hover:text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {referenceMode === 'paste' && (
              <div className="mt-3">
                <textarea
                  rows={3}
                  value={customReferenceText}
                  onChange={(e) => setCustomReferenceText(e.target.value)}
                  placeholder="Tempel ringkasan materi atau kutipan modul ajar Anda di sini..."
                  className="w-full p-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
            )}

            {referenceMode === 'upload' && (
              <div className="mt-3 p-4 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400">
                <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                <span>Klik untuk unggah berkas PDF, DOCX, atau TXT (Maks. 10MB)</span>
              </div>
            )}
          </div>

          {/* Field 9: Jumlah Soal Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span className="text-slate-400">#</span>
                <span>Jumlah Soal</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                  Max 50 Soal
                </span>
              </div>

              <div
                className={`w-14 py-1.5 rounded-xl border text-center font-mono font-bold text-sm tabular-nums ${
                  isDarkMode
                    ? 'bg-[#0c1426] border-[#1b273d] text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {questionCount}
              </div>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">{questionCount} soal akan di-generate</p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 shadow-xl shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center justify-between gap-3 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm sm:text-base font-extrabold tracking-tight">
                    {isGenerating ? 'Sedang Memproses AI...' : `Generate ${questionCount} Soal dengan AI`}
                  </div>
                  <div className="text-[11px] text-white/80 font-normal">
                    {isGenerating
                      ? 'AI sedang bekerja & menyimpan otomatis ke Bank Soal...'
                      : 'Otomatis tersimpan ke Bank Soal & siap didistribusikan ke Google Form'}
                  </div>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-white shrink-0" />
            </button>
          </div>
        </form>
      </div>

      {/* RESULTS SECTION: PROMINENT SAVED STATUS CARD & QUESTION LIST */}
      {generatedList.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Success & Bank Soal Saved Card */}
          <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#0d1c2d] to-[#0c1424] border border-emerald-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-slate-950 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-extrabold text-white">
                      Paket Soal Berhasil Disimpan ke Bank Soal!
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                      Status: Terbit
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Paket: <span className="font-bold text-white">{savedBatchTitle || `Paket ${topic}`}</span>
                    {' • '}
                    Kode: <span className="font-mono text-cyan-300 font-bold">{savedBatchCode}</span>
                    {' • '}
                    Total: <span className="font-extrabold text-emerald-400">{generatedList.length} Soal</span>
                    {' • '}
                    Mapel: <span className="font-semibold text-slate-200">{subject}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('bank-soal')}
                    className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Buka Bank Soal ➔</span>
                  </button>
                )}

                {onNavigate && onAddGoogleForm && (
                  <button
                    type="button"
                    onClick={() => {
                      const randomToken = `SPT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                      const formRecord: GoogleFormRecord = {
                        id: `gf-${Date.now()}`,
                        name: `Asesmen AI: ${savedBatchTitle || topic} (${gradeClass})`,
                        url: `https://docs.google.com/forms/d/e/1FAIpQLS${Math.random().toString(36).substring(2, 10).toUpperCase()}/viewform`,
                        questionCount: generatedList.length,
                        status: 'Aktif',
                        token: randomToken,
                        tokenActive: true,
                        tokenActivatedAt: new Date().toISOString(),
                        durationMinutes: 90,
                        expiresAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
                        targetClass: gradeClass,
                        createdAt: 'Baru saja'
                      };
                      onAddGoogleForm(formRecord);
                      setSaveToast('Google Form berhasil dibuat & aktif dengan timer mundur!');
                      onNavigate('google-forms');
                    }}
                    className="px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Buat Google Form</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-5 pt-4 border-t border-[#1b2f3d] flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsEditBatchModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ubah Judul / Kode Paket</span>
                </button>

                <button
                  type="button"
                  onClick={handleResaveAsNewBatch}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Simpan Ulang Sebagai Batch Baru</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAddManualModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Butir Soal</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQuestionsTxt}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Unduh (.txt)</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Questions with Individual Edit & Delete controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Daftar {generatedList.length} Butir Soal Tersimpan:</span>
              <span>Klik Edit atau Hapus untuk menyesuaikan soal sewaktu-waktu</span>
            </div>

            {generatedList.map((item, index) => (
              <div
                key={item.id}
                className={`p-6 rounded-2xl border transition-colors ${
                  isDarkMode ? 'bg-[#080d1a] border-[#151e33]' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Header row of Question Card */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">
                      {item.topic || item.subject}
                    </span>
                    <span className="text-xs text-slate-500">• {item.grade}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {item.difficulty}
                    </span>
                  </div>

                  {/* Top Right Controls: Edit, Delete, Copy */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...item })}
                      title="Edit butir soal ini"
                      className="p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors border border-slate-700 bg-slate-800/80 text-cyan-300 hover:text-cyan-200 hover:bg-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(item.id)}
                      title="Hapus soal ini dari paket"
                      className="p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 hover:text-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Hapus</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyQuestion(item)}
                      title="Salin soal ke clipboard"
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors border ${
                        copiedId === item.id
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : isDarkMode
                          ? 'border-[#1b253b] text-slate-400 hover:text-white'
                          : 'border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {copiedId === item.id ? 'Tersalin' : 'Salin'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <p
                  className={`text-sm sm:text-base font-medium mb-4 leading-relaxed ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {item.question}
                </p>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {item.options.slice(0, optionsCount).map((opt) => {
                    const isCorrect = opt.key === item.correctKey;
                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition-all ${
                          isCorrect
                            ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300 font-semibold shadow-sm'
                            : isDarkMode
                            ? 'border-[#1a2336] bg-[#090f1d] text-slate-300'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded font-bold text-[11px] flex items-center justify-center shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'bg-slate-700/60 text-slate-300'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    isDarkMode
                      ? 'bg-[#090f1d] border-[#1a2336] text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Kunci Jawaban Benar: Opsi {item.correctKey}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: EDIT BUTIR SOAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0c1424] border border-cyan-500/40 shadow-2xl text-white overflow-hidden">
            <div className="p-5 border-b border-[#1b273d] flex items-center justify-between bg-[#0e172a]">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Edit Butir Soal</h3>
              </div>
              <button
                onClick={() => setEditingQuestion(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionEdit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Teks Pertanyaan</label>
                <textarea
                  rows={3}
                  value={editingQuestion.question}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, question: e.target.value })
                  }
                  required
                  className="w-full p-3 rounded-xl text-xs sm:text-sm bg-[#080d1a] border border-[#1b273d] text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Pilihan Jawaban</label>
                {editingQuestion.options.slice(0, optionsCount).map((opt, optIdx) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[optIdx] = { ...opt, text: e.target.value };
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Kunci Jawaban Benar</label>
                  <select
                    value={editingQuestion.correctKey}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        correctKey: e.target.value as 'A' | 'B' | 'C' | 'D' | 'E'
                      })
                    }
                    className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white outline-none"
                  >
                    {['A', 'B', 'C', 'D', 'E'].slice(0, optionsCount).map((k) => (
                      <option key={k} value={k}>
                        Opsi {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tingkat Kesulitan</label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        difficulty: e.target.value as 'Mudah' | 'Sedang' | 'HOTS'
                      })
                    }
                    className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white outline-none"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="HOTS">HOTS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Pembahasan / Penjelasan</label>
                <textarea
                  rows={3}
                  value={editingQuestion.explanation}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1b273d]">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
                >
                  Simpan Perubahan ke Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT JUDUL & KODE BATCH */}
      {isEditBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1424] border border-[#1e2a42] shadow-2xl text-white overflow-hidden">
            <div className="p-5 border-b border-[#1b273d] flex items-center justify-between bg-[#0e172a]">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Ubah Nama & Kode Batch</h3>
              </div>
              <button
                onClick={() => setIsEditBatchModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBatchMetadata} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nama / Judul Paket Soal</label>
                <input
                  type="text"
                  value={editBatchTitle}
                  onChange={(e) => setEditBatchTitle(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl text-xs sm:text-sm bg-[#080d1a] border border-[#1b273d] text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Kode Batch</label>
                <input
                  type="text"
                  value={editBatchCode}
                  onChange={(e) => setEditBatchCode(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl text-xs sm:text-sm bg-[#080d1a] border border-[#1b273d] text-white font-mono outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1b273d]">
                <button
                  type="button"
                  onClick={() => setIsEditBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  Perbarui di Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SOAL MANUAL KE BATCH INI */}
      {isAddManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0c1424] border border-emerald-500/40 shadow-2xl text-white overflow-hidden">
            <div className="p-5 border-b border-[#1b273d] flex items-center justify-between bg-[#0e172a]">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Tambah Soal ke Paket Ini</h3>
              </div>
              <button
                onClick={() => setIsAddManualModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualQuestion} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Pertanyaan</label>
                <textarea
                  rows={3}
                  value={manualQText}
                  onChange={(e) => setManualQText(e.target.value)}
                  placeholder="Tuliskan pertanyaan dengan jelas..."
                  required
                  className="w-full p-2.5 rounded-xl text-xs sm:text-sm bg-[#080d1a] border border-[#1b273d] text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Pilihan Jawaban</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Pilihan A"
                    value={manualOptA}
                    onChange={(e) => setManualOptA(e.target.value)}
                    required
                    className="p-2 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                  <input
                    type="text"
                    placeholder="Pilihan B"
                    value={manualOptB}
                    onChange={(e) => setManualOptB(e.target.value)}
                    required
                    className="p-2 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                  <input
                    type="text"
                    placeholder="Pilihan C"
                    value={manualOptC}
                    onChange={(e) => setManualOptC(e.target.value)}
                    className="p-2 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                  <input
                    type="text"
                    placeholder="Pilihan D"
                    value={manualOptD}
                    onChange={(e) => setManualOptD(e.target.value)}
                    className="p-2 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Kunci Jawaban Benar</label>
                  <select
                    value={manualCorrectKey}
                    onChange={(e) => setManualCorrectKey(e.target.value as 'A' | 'B' | 'C' | 'D')}
                    className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  >
                    <option value="A">Opsi A</option>
                    <option value="B">Opsi B</option>
                    <option value="C">Opsi C</option>
                    <option value="D">Opsi D</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tingkat Kesulitan</label>
                  <select
                    value={manualDiff}
                    onChange={(e) => setManualDiff(e.target.value as 'Mudah' | 'Sedang' | 'HOTS')}
                    className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="HOTS">HOTS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Pembahasan & Penjelasan</label>
                <textarea
                  rows={2}
                  value={manualExp}
                  onChange={(e) => setManualExp(e.target.value)}
                  placeholder="Langkah penyelesaian..."
                  className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1b273d]">
                <button
                  type="button"
                  onClick={() => setIsAddManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  Simpan ke Paket Ini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
