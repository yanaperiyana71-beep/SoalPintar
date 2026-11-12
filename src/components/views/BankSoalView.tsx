import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Download,
  Check,
  FileText,
  X,
  BookOpen,
  GraduationCap,
  Eye,
  ExternalLink,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Shuffle,
  Settings,
  FileSpreadsheet,
  Key,
  Timer,
  ArrowRight,
  RotateCw,
  HelpCircle,
  FolderOpen,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuestionItem, SoalBatch, NavTab, GoogleFormRecord } from '../../types';
import { createRealGoogleForm } from '../../services/googleFormBridgeService';

interface BankSoalViewProps {
  questions: QuestionItem[];
  batches?: SoalBatch[];
  isDarkMode: boolean;
  onAddQuestion: (q: QuestionItem) => void;
  onDeleteQuestion: (id: string) => void;
  onDeleteBatch?: (id: string) => void;
  onAddBatch?: (batch: SoalBatch) => void;
  onUpdateBatch?: (batch: SoalBatch) => void;
  onAddGoogleForm?: (form: GoogleFormRecord) => void;
  onNavigate?: (tab: NavTab) => void;
}

export const BankSoalView: React.FC<BankSoalViewProps> = ({
  questions,
  batches = [],
  isDarkMode,
  onAddQuestion,
  onDeleteQuestion,
  onDeleteBatch,
  onAddBatch,
  onUpdateBatch,
  onAddGoogleForm,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'batch' | 'all-questions'>('batch');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Semua');
  const [selectedSubject, setSelectedSubject] = useState('Semua');
  const [selectedDiff, setSelectedDiff] = useState('Semua');

  // Modals state
  const [selectedBatchForView, setSelectedBatchForView] = useState<SoalBatch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<SoalBatch | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBatchText, setCopiedBatchText] = useState(false);

  // GOOGLE FORM GENERATOR FROM BATCH STATE
  const [batchForGoogleForm, setBatchForGoogleForm] = useState<SoalBatch | null>(null);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true); // Acak Urut Soal
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true); // Acak Pilihan Jawaban Soal
  const [formTitle, setFormTitle] = useState<string>('');
  const [targetClass, setTargetClass] = useState<string>('');
  const [formToken, setFormToken] = useState<string>('');
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(90);
  const [autoActivateCountdown, setAutoActivateCountdown] = useState<boolean>(true);
  const [pointsPerQuestion, setPointsPerQuestion] = useState<number>(10);
  const [limitOneResponse, setLimitOneResponse] = useState<boolean>(true);
  const [collectEmail, setCollectEmail] = useState<boolean>(true);
  const [shuffleSeed, setShuffleSeed] = useState<number>(1);
  const [copiedAppsScript, setCopiedAppsScript] = useState<boolean>(false);
  const [createdFormSuccess, setCreatedFormSuccess] = useState<GoogleFormRecord | null>(null);
  const [copiedSuccessLink, setCopiedSuccessLink] = useState<boolean>(false);
  const [copiedSuccessToken, setCopiedSuccessToken] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'script'>('preview');
  const [formCustomUrl, setFormCustomUrl] = useState<string>('');
  const [isCreatingRealForm, setIsCreatingRealForm] = useState<boolean>(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  // RANDOM BATCH GENERATOR STATE ("Batch secara acak")
  const [isRandomBatchModalOpen, setIsRandomBatchModalOpen] = useState<boolean>(false);
  const [randomSourceMode, setRandomSourceMode] = useState<'all-questions' | 'existing-batch'>('all-questions');
  const [selectedSourceBatchId, setSelectedSourceBatchId] = useState<string>('');
  const [randomBatchTitle, setRandomBatchTitle] = useState<string>('Paket Soal Campuran Acak');
  const [randomBatchGrade, setRandomBatchGrade] = useState<string>('SMP Kelas 9');
  const [randomBatchSubject, setRandomBatchSubject] = useState<string>('Matematika');
  const [randomBatchCode, setRandomBatchCode] = useState<string>('Batch ACAK-8X2M');
  const [randomCount, setRandomCount] = useState<number>(10);
  const [randomDiffFilter, setRandomDiffFilter] = useState<string>('Semua');
  const [randomShuffleOrder, setRandomShuffleOrder] = useState<boolean>(true);
  const [randomShuffleOptions, setRandomShuffleOptions] = useState<boolean>(true);
  const [randomMultiVariantCount, setRandomMultiVariantCount] = useState<number>(1);
  const [randomSeed, setRandomSeed] = useState<number>(Date.now());
  const [randomBatchCreatedSuccess, setRandomBatchCreatedSuccess] = useState<SoalBatch[] | null>(null);
  const [isBatchSortRandom, setIsBatchSortRandom] = useState<boolean>(false);
  const [batchTypeFilter, setBatchTypeFilter] = useState<'all' | 'randomized' | 'standard'>('all');

  const handleOpenGoogleFormModal = (batch: SoalBatch) => {
    setBatchForGoogleForm(batch);
    setFormTitle(`Penilaian Harian: ${batch.topic} (${batch.grade})`);
    setTargetClass(batch.grade);
    setFormToken(`SPT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setFormCustomUrl(''); // Empty by default so it creates REAL form via Google Apps Script
    setFormDurationMinutes(90);
    setAutoActivateCountdown(true);
    setShuffleQuestions(true);
    setShuffleOptions(true);
    setPointsPerQuestion(10);
    setShuffleSeed(Date.now());
    setCreatedFormSuccess(null);
    setCopiedAppsScript(false);
    setActivePreviewTab('preview');
    setIsCreatingRealForm(false);
    setCreateFormError(null);
  };

  // Pure deterministic/controlled shuffling engine for questions and option choices
  const processedQuestions = useMemo(() => {
    if (!batchForGoogleForm) return [];
    const rawQuestions = [...batchForGoogleForm.questions];

    // Step 1: Handle question ordering (Acak Urut Soal)
    let orderedQuestions = rawQuestions.map((q, idx) => ({ originalIndex: idx + 1, item: { ...q } }));
    if (shuffleQuestions) {
      // Fisher-Yates with shuffleSeed
      let seed = shuffleSeed;
      const pseudoRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };
      for (let i = orderedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRandom() * (i + 1));
        const temp = orderedQuestions[i];
        orderedQuestions[i] = orderedQuestions[j];
        orderedQuestions[j] = temp;
      }
    }

    // Step 2: Handle option ordering per question (Acak Pilihan Jawaban Soal)
    const letters: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];

    return orderedQuestions.map((entry, qIndex) => {
      const q = entry.item;
      const availableOptions = q.options.slice(0, batchForGoogleForm.optionsCount || 4);
      const originalCorrectOption = availableOptions.find((o) => o.key === q.correctKey);
      const originalCorrectText = originalCorrectOption ? originalCorrectOption.text : availableOptions[0]?.text || '';

      if (!shuffleOptions) {
        return {
          displayIndex: qIndex + 1,
          originalIndex: entry.originalIndex,
          questionText: q.question,
          difficulty: q.difficulty,
          topic: q.topic,
          explanation: q.explanation,
          options: availableOptions,
          correctKey: q.correctKey
        };
      }

      // Pseudo-random shuffle of option choices
      let optSeed = shuffleSeed + (qIndex + 1) * 37;
      const optRandom = () => {
        const x = Math.sin(optSeed++) * 10000;
        return x - Math.floor(x);
      };

      const shuffledTexts = [...availableOptions.map((o) => o.text)];
      for (let i = shuffledTexts.length - 1; i > 0; i--) {
        const j = Math.floor(optRandom() * (i + 1));
        const temp = shuffledTexts[i];
        shuffledTexts[i] = shuffledTexts[j];
        shuffledTexts[j] = temp;
      }

      // Re-assign option keys A, B, C, D
      const newOptions = shuffledTexts.map((text, idx) => ({
        key: letters[idx] || 'A',
        text
      }));

      // Find which new letter holds the original correct text!
      const matched = newOptions.find((o) => o.text === originalCorrectText) || newOptions[0];
      const newCorrectKey = matched.key;

      return {
        displayIndex: qIndex + 1,
        originalIndex: entry.originalIndex,
        questionText: q.question,
        difficulty: q.difficulty,
        topic: q.topic,
        explanation: q.explanation,
        options: newOptions,
        correctKey: newCorrectKey
      };
    });
  }, [batchForGoogleForm, shuffleQuestions, shuffleOptions, shuffleSeed]);

  const handleReshufflePreview = () => {
    setShuffleSeed(Date.now() + Math.floor(Math.random() * 1000));
  };

  const generateBatchAppsScript = () => {
    if (!batchForGoogleForm) return '';

    const questionsJson = JSON.stringify(
      processedQuestions.map((q) => ({
        title: q.questionText,
        options: q.options.map((o) => o.text),
        correctIndex: ['A', 'B', 'C', 'D', 'E'].indexOf(q.correctKey),
        explanation: q.explanation,
        difficulty: q.difficulty
      })),
      null,
      2
    );

    return `/**
 * SOALPINTAR.AI - Google Forms Auto Generator
 * Paket Soal: ${batchForGoogleForm.topic} (${batchForGoogleForm.grade})
 * 
 * Pengaturan:
 * - Acak Urut Soal: ${shuffleQuestions ? 'AKTIF (Urutan Diacak Otomatis)' : 'NONAKTIF (Urutan Berurutan Asli)'}
 * - Acak Pilihan Jawaban Soal: ${shuffleOptions ? 'AKTIF (Opsi A-D Diacak & Kunci Disesuaikan)' : 'NONAKTIF (Opsi Tetap)'}
 * - Token Ujian: ${formToken}
 * - Poin per Soal: ${pointsPerQuestion}
 * 
 * PANDUAN PENGGUNAAN:
 * 1. Kunjungi https://script.google.com/
 * 2. Klik "Proyek Baru" (+ New Project)
 * 3. Hapus kode default, tempelkan skrip ini lalu klik ikon Simpan (Save)
 * 4. Klik tombol "Jalankan" (Run) -> Google Form otomatis dibuat di Google Drive Anda!
 */
function buatGoogleFormOtomatis() {
  var formTitle = ${JSON.stringify(formTitle || `Penilaian: ${batchForGoogleForm.topic}`)};
  var form = FormApp.create(formTitle)
    .setDescription("Asesmen ${batchForGoogleForm.topic} - ${batchForGoogleForm.grade}\\nToken Akses Ujian: ${formToken}\\nDurasi: ${formDurationMinutes} Menit\\n${limitOneResponse ? 'Batasi 1 Tanggapan | ' : ''}Dibuat via SoalPintar.AI Guru Panel")
    .setIsQuiz(true)
    .setCollectEmail(${collectEmail})
    .setLimitOneResponsePerUser(${limitOneResponse});

  // Opsi Acak Pertanyaan bawaan Google Form
  ${shuffleQuestions ? 'form.setShuffleQuestions(true);' : '// form.setShuffleQuestions(false);'}

  // Identitas Siswa
  form.addTextItem().setTitle("Nama Lengkap Siswa").setRequired(true);
  form.addTextItem().setTitle("Kelas / Rombel").setRequired(true);
  form.addTextItem().setTitle("Token Masuk Ujian (${formToken})").setRequired(true);

  // Daftar Soal Teracak
  var questions = ${questionsJson};

  questions.forEach(function(item, index) {
    var mcItem = form.addMultipleChoiceItem();
    mcItem.setTitle((index + 1) + ". " + item.title)
          .setPoints(${pointsPerQuestion})
          .setRequired(true);

    var choices = [];
    item.options.forEach(function(optText, optIdx) {
      var isCorrect = (optIdx === item.correctIndex);
      choices.push(mcItem.createChoice(optText, isCorrect));
    });

    mcItem.setChoices(choices);
    mcItem.setFeedbackForCorrect(FormApp.createFeedback().setText("Bagus, Jawaban Benar! " + item.explanation).build());
    mcItem.setFeedbackForIncorrect(FormApp.createFeedback().setText("Pembahasan: " + item.explanation).build());
  });

  Logger.log("=== SUKSES MEMBUAT GOOGLE FORM ===");
  Logger.log("Link Edit Guru: " + form.getEditUrl());
  Logger.log("Link Mengerjakan Siswa: " + form.getPublishedUrl());
}`;
  };

  const handleCopyAppsScript = () => {
    const script = generateBatchAppsScript();
    navigator.clipboard.writeText(script);
    setCopiedAppsScript(true);
    setTimeout(() => setCopiedAppsScript(false), 2500);
  };

  const handleExportShuffledTxt = () => {
    if (!batchForGoogleForm) return;
    let txt = `====================================================\n`;
    txt += `PAKET SOAL: ${formTitle.toUpperCase()}\n`;
    txt += `Target Kelas: ${targetClass} | Token Masuk: ${formToken}\n`;
    txt += `Pengacakan: Acak Urut Soal: ${shuffleQuestions ? 'YA' : 'TIDAK'} | Acak Pilihan Opsi: ${shuffleOptions ? 'YA' : 'TIDAK'}\n`;
    txt += `Dicetak dari SoalPintar.AI Guru Panel\n`;
    txt += `====================================================\n\n`;

    processedQuestions.forEach((q) => {
      txt += `Nomor ${q.displayIndex} (Soal Asal #${q.originalIndex}) [${q.difficulty}]\n`;
      txt += `${q.questionText}\n`;
      q.options.forEach((opt) => {
        txt += `  ${opt.key}. ${opt.text}\n`;
      });
      txt += `Kunci: ${q.correctKey}\nPembahasan: ${q.explanation}\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GoogleForm_${batchForGoogleForm.topic.replace(/\s+/g, '_')}_Teracak.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateAndSaveGoogleForm = async (navigateImmediately: boolean = false) => {
    if (!batchForGoogleForm) return;

    setIsCreatingRealForm(true);
    setCreateFormError(null);

    try {
      let finalUrl = formCustomUrl.trim();
      let finalEditUrl: string | undefined = undefined;

      // If user did not paste a manual URL, call Google Apps Script Web App to create REAL Google Form on Google Drive!
      if (!finalUrl) {
        const formattedQuestions = processedQuestions.map((q) => {
          const optionsTexts = q.options.map((o) => o.text);
          const correctIdx = q.options.findIndex((o) => o.key === q.correctKey);
          return {
            number: q.displayIndex,
            question: q.questionText,
            options: optionsTexts,
            answer: correctIdx >= 0 ? correctIdx : 0,
            type: 'multiple_choice' as const,
            explanation: q.explanation || 'Pembahasan kunci jawaban terverifikasi.'
          };
        });

        const res = await createRealGoogleForm({
          title: formTitle.trim() || `Quiz: ${batchForGoogleForm.topic}`,
          quizId: formToken,
          guruName: 'Guru SoalPintar',
          folderName: 'v2-soalpintar.ai',
          questions: formattedQuestions,
          shuffleQuestions,
          shuffleOptions,
        });

        if (res.success && res.form_url) {
          finalUrl = res.form_url;
          finalEditUrl = res.edit_url;
        } else {
          setIsCreatingRealForm(false);
          setCreateFormError(
            res.error ||
              'Gagal membuat Google Form di Google Drive akun Anda. Pastikan Web App Google Apps Script telah disetujui di menu Settings.'
          );
          return;
        }
      }

      const nowTime = Date.now();
      const expiresAtIso = autoActivateCountdown
        ? new Date(nowTime + formDurationMinutes * 60 * 1000).toISOString()
        : undefined;

      const newRecord: GoogleFormRecord = {
        id: `gf-${Date.now()}`,
        name: formTitle.trim() || `Form: ${batchForGoogleForm.topic}`,
        url: finalUrl,
        editUrl: finalEditUrl,
        questionCount: processedQuestions.length,
        status: autoActivateCountdown ? 'Aktif' : 'Nonaktif',
        token: formToken,
        tokenActive: autoActivateCountdown,
        tokenActivatedAt: autoActivateCountdown ? new Date().toISOString() : undefined,
        durationMinutes: formDurationMinutes,
        expiresAt: expiresAtIso,
        targetClass: targetClass.trim() || batchForGoogleForm.grade,
        createdAt: 'Baru saja'
      };

      if (onAddGoogleForm) {
        onAddGoogleForm(newRecord);
      }

      if (onUpdateBatch && batchForGoogleForm) {
        onUpdateBatch({
          ...batchForGoogleForm,
          formUrl: finalUrl
        });
      }

      setIsCreatingRealForm(false);

      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.6 }
        });
      } catch {
        // fallback
      }

      if (navigateImmediately && onNavigate) {
        setBatchForGoogleForm(null);
        setSelectedBatchForView(null);
        onNavigate('google-forms');
      } else {
        setCreatedFormSuccess(newRecord);
      }
    } catch (err: unknown) {
      setIsCreatingRealForm(false);
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat membuat Google Form';
      setCreateFormError(msg);
    }
  };

  // New question form state
  const [newSubject, setNewSubject] = useState('Matematika');
  const [newGrade, setNewGrade] = useState('SMP Kelas 9');
  const [newTopic, setNewTopic] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<'Mudah' | 'Sedang' | 'HOTS'>('Sedang');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctKey, setCorrectKey] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [explanation, setExplanation] = useState('');

  const generateRandomBatchCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Batch ACAK-${code}`;
  };

  const handleOpenRandomBatchModal = (sourceBatch?: SoalBatch) => {
    if (sourceBatch) {
      setRandomSourceMode('existing-batch');
      setSelectedSourceBatchId(sourceBatch.id);
      setRandomBatchTitle(`${sourceBatch.topic} (Varian Acak)`);
      setRandomBatchGrade(sourceBatch.grade);
      setRandomBatchSubject(sourceBatch.subject || 'Mata Pelajaran Umum');
      setRandomCount(sourceBatch.questions.length);
    } else {
      setRandomSourceMode('all-questions');
      setSelectedSourceBatchId(batches[0]?.id || '');
      setRandomBatchTitle('Paket Soal Campuran Acak');
      setRandomBatchGrade('SMP Kelas 9');
      setRandomBatchSubject('Matematika');
      setRandomCount(Math.min(10, Math.max(4, questions.length)));
    }
    setRandomBatchCode(generateRandomBatchCode());
    setRandomDiffFilter('Semua');
    setRandomShuffleOrder(true);
    setRandomShuffleOptions(true);
    setRandomMultiVariantCount(1);
    setRandomSeed(Date.now());
    setRandomBatchCreatedSuccess(null);
    setIsRandomBatchModalOpen(true);
  };

  // Preview of randomized questions based on modal settings
  const randomizedQuestionsPreview = useMemo(() => {
    let pool: QuestionItem[] = [];
    if (randomSourceMode === 'existing-batch' && selectedSourceBatchId) {
      const src = batches.find((b) => b.id === selectedSourceBatchId);
      if (src && src.questions.length > 0) {
        pool = [...src.questions];
      }
    }
    if (pool.length === 0) {
      pool = [...questions];
    }

    if (randomDiffFilter !== 'Semua') {
      const filtered = pool.filter((q) => q.difficulty === randomDiffFilter);
      if (filtered.length > 0) pool = filtered;
    }

    let seed = randomSeed;
    const pseudoRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const shuffled = [...pool];
    if (randomShuffleOrder) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRandom() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
    }

    const sampled = shuffled.slice(0, Math.min(randomCount, shuffled.length));

    const letters: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
    return sampled.map((item, qIdx) => {
      let options = [...item.options];
      let correctKey = item.correctKey;
      if (randomShuffleOptions) {
        const correctText = options.find((o) => o.key === item.correctKey)?.text || '';
        let optSeed = seed + (qIdx + 1) * 31;
        const optRandom = () => {
          const x = Math.sin(optSeed++) * 10000;
          return x - Math.floor(x);
        };
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(optRandom() * (i + 1));
          const temp = options[i];
          options[i] = options[j];
          options[j] = temp;
        }
        options = options.map((opt, oIdx) => ({
          key: letters[oIdx],
          text: opt.text
        }));
        const newCorrect = options.find((o) => o.text === correctText);
        if (newCorrect) correctKey = newCorrect.key;
      }
      return {
        ...item,
        options,
        correctKey,
        displayIndex: qIdx + 1
      };
    });
  }, [questions, batches, randomSourceMode, selectedSourceBatchId, randomDiffFilter, randomCount, randomShuffleOrder, randomShuffleOptions, randomSeed]);

  const handleCreateRandomBatch = (saveAndDistributeToGoogleForm: boolean = false) => {
    if (!onAddBatch) return;

    const variants: SoalBatch[] = [];
    const variantLabels = ['A', 'B', 'C'];
    const totalVariants = Math.min(3, Math.max(1, randomMultiVariantCount));

    for (let v = 0; v < totalVariants; v++) {
      const vSeed = randomSeed + (v * 177);
      let seed = vSeed;
      const pseudoRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      let pool: QuestionItem[] = [];
      if (randomSourceMode === 'existing-batch' && selectedSourceBatchId) {
        const src = batches.find((b) => b.id === selectedSourceBatchId);
        if (src && src.questions.length > 0) {
          pool = [...src.questions];
        }
      }
      if (pool.length === 0) {
        pool = [...questions];
      }

      if (randomDiffFilter !== 'Semua') {
        const filtered = pool.filter((q) => q.difficulty === randomDiffFilter);
        if (filtered.length > 0) pool = filtered;
      }

      const shuffled = [...pool];
      if (randomShuffleOrder) {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(pseudoRandom() * (i + 1));
          const temp = shuffled[i];
          shuffled[i] = shuffled[j];
          shuffled[j] = temp;
        }
      }

      const sampled = shuffled.slice(0, Math.min(randomCount, shuffled.length));

      const letters: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
      const finalizedQuestions: QuestionItem[] = sampled.map((item, qIdx) => {
        let options = [...item.options];
        let correctKey = item.correctKey;
        if (randomShuffleOptions) {
          const correctText = options.find((o) => o.key === item.correctKey)?.text || '';
          let optSeed = seed + (qIdx + 1) * 31;
          const optRandom = () => {
            const x = Math.sin(optSeed++) * 10000;
            return x - Math.floor(x);
          };
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(optRandom() * (i + 1));
            const temp = options[i];
            options[i] = options[j];
            options[j] = temp;
          }
          options = options.map((opt, oIdx) => ({
            key: letters[oIdx],
            text: opt.text
          }));
          const newCorrect = options.find((o) => o.text === correctText);
          if (newCorrect) correctKey = newCorrect.key;
        }
        return {
          ...item,
          id: `rand-q-${Date.now()}-${v}-${qIdx}`,
          options,
          correctKey
        };
      });

      const vLabel = totalVariants > 1 ? ` (Varian ${variantLabels[v]})` : '';
      const vCode = totalVariants > 1 ? `${randomBatchCode}-${variantLabels[v]}` : randomBatchCode;
      const levelMatch = randomBatchGrade.match(/SMP|SMA|SD|SMK/i);
      const level = levelMatch ? levelMatch[0].toUpperCase() : 'SMP';

      const newBatch: SoalBatch = {
        id: `batch-rand-${Date.now()}-${v}`,
        topic: `${randomBatchTitle}${vLabel}`,
        subject: randomBatchSubject,
        level,
        grade: randomBatchGrade,
        questionCount: finalizedQuestions.length,
        optionsCount: 4,
        batchCode: vCode,
        createdAt: 'Baru saja (Acak)',
        status: 'Terbit',
        isRandomized: true,
        variantName: totalVariants > 1 ? `Varian ${variantLabels[v]}` : 'Acak',
        parentBatchId: selectedSourceBatchId || undefined,
        formUrl: `https://docs.google.com/forms/d/e/1FAIpQLS${Math.random().toString(36).substring(2, 10).toUpperCase()}/viewform`,
        questions: finalizedQuestions
      };

      onAddBatch(newBatch);
      variants.push(newBatch);
    }

    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }

    if (saveAndDistributeToGoogleForm && onAddGoogleForm && onNavigate) {
      const mainBatch = variants[0];
      const formToken = `SPT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const formRecord: GoogleFormRecord = {
        id: `gf-${Date.now()}`,
        name: mainBatch.topic,
        url: mainBatch.formUrl || `https://docs.google.com/forms/d/e/sample-form/viewform`,
        questionCount: mainBatch.questionCount,
        status: 'Aktif',
        token: formToken,
        tokenActive: true,
        tokenActivatedAt: new Date().toISOString(),
        durationMinutes: 90,
        expiresAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
        targetClass: mainBatch.grade,
        createdAt: 'Baru saja'
      };
      onAddGoogleForm(formRecord);
      setIsRandomBatchModalOpen(false);
      onNavigate('google-forms');
    } else {
      setRandomBatchCreatedSuccess(variants);
    }
  };

  const handleQuickShuffleBatch = (batch: SoalBatch) => {
    if (!onAddBatch) return;

    let seed = Date.now();
    const pseudoRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const shuffledQuestions = [...batch.questions];
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      const temp = shuffledQuestions[i];
      shuffledQuestions[i] = shuffledQuestions[j];
      shuffledQuestions[j] = temp;
    }

    const letters: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
    const finalizedQuestions = shuffledQuestions.map((q, idx) => {
      let options = [...q.options];
      let correctKey = q.correctKey;
      const correctText = options.find((o) => o.key === q.correctKey)?.text || '';
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRandom() * (i + 1));
        const temp = options[i];
        options[i] = options[j];
        options[j] = temp;
      }
      options = options.map((opt, oIdx) => ({
        key: letters[oIdx],
        text: opt.text
      }));
      const newCorrect = options.find((o) => o.text === correctText);
      if (newCorrect) correctKey = newCorrect.key;
      return {
        ...q,
        id: `q-quick-shuf-${Date.now()}-${idx}`,
        options,
        correctKey
      };
    });

    const newCode = generateRandomBatchCode();
    const newBatch: SoalBatch = {
      id: `batch-quick-shuf-${Date.now()}`,
      topic: `${batch.topic} (Varian Acak)`,
      subject: batch.subject,
      level: batch.level,
      grade: batch.grade,
      questionCount: finalizedQuestions.length,
      optionsCount: batch.optionsCount,
      batchCode: newCode,
      createdAt: 'Baru saja (Acak)',
      status: 'Terbit',
      isRandomized: true,
      variantName: 'Varian Acak',
      parentBatchId: batch.id,
      formUrl: `https://docs.google.com/forms/d/e/1FAIpQLS${Math.random().toString(36).substring(2, 10).toUpperCase()}/viewform`,
      questions: finalizedQuestions
    };

    onAddBatch(newBatch);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }
  };

  // Filtered batches with type filter & random sort option
  const filteredBatches = useMemo(() => {
    let list = batches.filter((b) => {
      const matchSearch =
        b.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.batchCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = selectedLevel === 'Semua' || b.level === selectedLevel;
      const matchType =
        batchTypeFilter === 'all'
          ? true
          : batchTypeFilter === 'randomized'
          ? b.isRandomized === true
          : b.isRandomized !== true;
      return matchSearch && matchLevel && matchType;
    });

    if (isBatchSortRandom) {
      // Pseudo random sort
      list = [...list].sort((a, b) => b.batchCode.localeCompare(a.batchCode));
    }
    return list;
  }, [batches, searchTerm, selectedLevel, batchTypeFilter, isBatchSortRandom]);

  // Filtered single questions
  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = selectedSubject === 'Semua' || q.subject === selectedSubject;
    const matchDiff = selectedDiff === 'Semua' || q.difficulty === selectedDiff;
    return matchSearch && matchSubject && matchDiff;
  });

  const handleCopyQuestion = (item: QuestionItem) => {
    const text = `${item.question}\n` +
      item.options.map((o) => `${o.key}. ${o.text}`).join('\n') +
      `\n\nKunci Jawaban: ${item.correctKey}\nPembahasan: ${item.explanation}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyBatch = (batch: SoalBatch) => {
    let output = `PAKET SOAL: ${batch.topic.toUpperCase()} (${batch.grade})\n` +
      `Batch: ${batch.batchCode} | Total: ${batch.questions.length} Soal\n` +
      `===================================================\n\n`;

    batch.questions.forEach((q, idx) => {
      output += `No. ${idx + 1} [${q.difficulty}]\n${q.question}\n`;
      q.options.forEach((opt) => {
        output += `${opt.key}. ${opt.text}\n`;
      });
      output += `Kunci: ${q.correctKey}\nPembahasan: ${q.explanation}\n\n`;
    });

    navigator.clipboard.writeText(output);
    setCopiedBatchText(true);
    setTimeout(() => setCopiedBatchText(false), 2000);
  };

  const handleExportBatchText = (batch: SoalBatch) => {
    let output = `PAKET SOAL: ${batch.topic.toUpperCase()} (${batch.grade})\n` +
      `Batch: ${batch.batchCode} | Total: ${batch.questions.length} Soal\n` +
      `Dicetak dari SoalPintar.AI Guru Panel\n` +
      `===================================================\n\n`;

    batch.questions.forEach((q, idx) => {
      output += `No. ${idx + 1} [${q.difficulty}]\n${q.question}\n`;
      q.options.forEach((opt) => {
        output += `${opt.key}. ${opt.text}\n`;
      });
      output += `Kunci: ${q.correctKey}\nPembahasan: ${q.explanation}\n\n`;
    });

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Paket_${batch.topic.replace(/\s+/g, '_')}_${batch.batchCode.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllQuestions = () => {
    let output = `BANK SOAL SOALPINTAR.AI - GURU PANEL\nDicetak pada: ${new Date().toLocaleDateString('id-ID')}\nTotal Soal: ${filteredQuestions.length}\n\n`;
    filteredQuestions.forEach((q, idx) => {
      output += `${idx + 1}. [${q.subject} - ${q.difficulty}] ${q.question}\n`;
      q.options.forEach((opt) => {
        output += `   ${opt.key}. ${opt.text}\n`;
      });
      output += `   Kunci: ${q.correctKey}\n   Pembahasan: ${q.explanation}\n\n`;
    });

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank-soal-soalpintar-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !optA || !optB) return;

    const newItem: QuestionItem = {
      id: `custom-${Date.now()}`,
      subject: newSubject,
      grade: newGrade,
      topic: newTopic || 'Materi Umum',
      difficulty: newDifficulty,
      question: newQuestionText,
      options: [
        { key: 'A', text: optA },
        { key: 'B', text: optB },
        { key: 'C', text: optC || 'Pilihan C' },
        { key: 'D', text: optD || 'Pilihan D' }
      ],
      correctKey,
      explanation: explanation || 'Pembahasan kunci jawaban telah terverifikasi.',
      createdAt: 'Baru Saja'
    };

    onAddQuestion(newItem);
    setIsAddModalOpen(false);
    // reset
    setNewQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanation('');
  };

  const confirmDeleteBatch = () => {
    if (batchToDelete && onDeleteBatch) {
      onDeleteBatch(batchToDelete.id);
      setBatchToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div
        className={`p-6 rounded-3xl border transition-colors ${
          isDarkMode ? 'bg-[#080d1a] border-[#151e33]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Bank Soal
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {batches.length} Paket · {questions.length} Butir Soal
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Penyimpanan terpusat paket batch soal ujian dan butir pertanyaan dengan tagging Kurikulum Merdeka.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onNavigate && (
              <button
                onClick={() => onNavigate('ai-generator')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                <span>Buat dengan AI</span>
              </button>
            )}
            {/* BUTTON BATCH SECARA ACAK */}
            <button
              onClick={() => handleOpenRandomBatchModal()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all active:scale-95"
              title="Buat paket batch soal secara acak (Anti-Contek)"
            >
              <Shuffle className="w-4 h-4 text-amber-300" />
              <span>Batch Secara Acak</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#142038] hover:bg-[#1a2b4a] text-sky-400 border border-sky-500/30 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Manual</span>
            </button>
            <button
              onClick={handleExportAllQuestions}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                isDarkMode
                  ? 'border-[#1e2d48] text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor TXT</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs: Paket Soal vs Semua Butir Soal */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-5">
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'batch'
                ? 'bg-[#142036] text-white border border-[#213254] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Paket Soal (Batch) ({batches.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('all-questions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'all-questions'
                ? 'bg-[#142036] text-white border border-[#213254] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Semua Butir Soal ({questions.length})</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari topik, materi, jenjang, atau kode batch..."
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                isDarkMode
                  ? 'bg-[#0c1426] border-[#1b273d] text-white focus:border-sky-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            />
          </div>

          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                isDarkMode
                  ? 'bg-[#0c1426] border-[#1b273d] text-white focus:border-sky-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            >
              <option value="Semua">Semua Jenjang (SD, SMP, SMA)</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SD">SD</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDiff}
              onChange={(e) => setSelectedDiff(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                isDarkMode
                  ? 'bg-[#0c1426] border-[#1b273d] text-white focus:border-sky-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            >
              <option value="Semua">Semua Tingkat Kesulitan</option>
              <option value="HOTS">HOTS</option>
              <option value="Sedang">Sedang</option>
              <option value="Mudah">Mudah</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: PAKET SOAL (BATCH) - EXACT MATCH WITH USER SCREENSHOT */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          {/* Batch Sub-filter & Quick Random Shuffle toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#080d1a] border border-[#172235]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold mr-1">Filter Batch:</span>
              <button
                type="button"
                onClick={() => setBatchTypeFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  batchTypeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                Semua Paket ({batches.length})
              </button>
              <button
                type="button"
                onClick={() => setBatchTypeFilter('randomized')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  batchTypeFilter === 'randomized'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-300 hover:text-white bg-purple-950/40 border border-purple-500/20'
                }`}
              >
                <Shuffle className="w-3 h-3 text-purple-400" />
                <span>Batch Acak / Varian ({batches.filter((b) => b.isRandomized).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setBatchTypeFilter('standard')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  batchTypeFilter === 'standard'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                Batch Standar ({batches.filter((b) => !b.isRandomized).length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBatchSortRandom(!isBatchSortRandom)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isBatchSortRandom
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
                title="Acak urutan tampilan batch"
              >
                <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                <span>{isBatchSortRandom ? 'Urutan: Acak (Aktif)' : 'Acak Urutan Tampilan'}</span>
              </button>
            </div>
          </div>

          {filteredBatches.length === 0 ? (
            <div
              className={`p-10 rounded-3xl border text-center ${
                isDarkMode ? 'bg-[#080d1a] border-[#151e33]' : 'bg-white border-slate-200'
              }`}
            >
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-300">Belum ada paket batch soal</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Buat paket soal baru secara instan dengan AI Generator atau Batch Secara Acak.
              </p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('ai-generator')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Buka AI Generator</span>
                </button>
              )}
            </div>
          ) : (
            filteredBatches.map((batch) => (
              <div
                key={batch.id}
                className={`rounded-2xl border transition-all ${
                  isDarkMode
                    ? 'bg-[#0c1424] border-[#1b273d] hover:border-slate-700'
                    : 'bg-white border-slate-200 shadow-sm'
                } p-5 sm:p-6`}
              >
                <div className="flex items-start gap-4">
                  {/* Left Badge: "SMP" (Rounded Dark Blue Square) */}
                  <div className="w-12 h-12 rounded-2xl bg-[#142036] border border-[#1e2e4c] flex items-center justify-center text-sky-400 font-extrabold text-xs shrink-0 tracking-wider shadow-inner">
                    {batch.level || 'SMP'}
                  </div>

                  {/* Middle Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Top Row: Title + "Terbit" Badge */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {batch.topic}
                      </h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                        {batch.status || 'Terbit'}
                      </span>
                      {batch.isRandomized && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          <Shuffle className="w-2.5 h-2.5 text-purple-400" />
                          <span>Batch Acak {batch.variantName ? `(${batch.variantName})` : ''}</span>
                        </span>
                      )}
                    </div>

                    {/* Second Row: Grade Badge */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#14233c] text-sky-300 border border-sky-500/20">
                        <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                        <span>{batch.grade}</span>
                      </span>
                    </div>

                    {/* Third Row: Details Info */}
                    <p className="text-xs sm:text-sm text-slate-400 font-normal">
                      {batch.questionCount} soal · {batch.optionsCount} opsi · {batch.batchCode} · {batch.createdAt}
                    </p>

                    {/* Fourth Row: Action Buttons */}
                    <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                      {/* Button 1: Lihat Soal (Indigo) */}
                      <button
                        onClick={() => setSelectedBatchForView(batch)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#171d38] hover:bg-[#20284d] text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Lihat Soal</span>
                      </button>

                      {/* Button: Acak Batch Ini */}
                      <button
                        onClick={() => handleOpenRandomBatchModal(batch)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#26153b] hover:bg-[#381c57] text-purple-200 border border-purple-500/35 transition-all active:scale-95"
                        title="Acak butir soal dan opsi batch ini untuk membuat varian baru"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-purple-300" />
                        <span>Acak Batch Ini</span>
                      </button>

                      {/* Button 2: Buatkan Google Form (Purple / Amber) */}
                      <button
                        onClick={() => handleOpenGoogleFormModal(batch)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 text-purple-200 border border-purple-500/40 transition-all active:scale-95"
                        title="Buatkan Google Form dengan Acak Soal & Opsi"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Buatkan Google Form</span>
                      </button>

                      {/* Button 3: Masuk ke Menu Distribusi Google Form */}
                      <button
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate('google-forms');
                          } else if (batch.formUrl) {
                            window.open(batch.formUrl, '_blank');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1a1438] hover:bg-[#251d50] text-purple-300 border border-purple-500/30 transition-all active:scale-95"
                        title="Masuk ke Menu Distribusi Google Form"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                        <span>Distribusi Google Form</span>
                      </button>

                      {/* Button 4: Hapus (Rose / Red) */}
                      <button
                        onClick={() => setBatchToDelete(batch)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#2e141c] hover:bg-[#3f1b27] text-rose-400 border border-rose-500/30 transition-all active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: SEMUA BUTIR SOAL */}
      {activeTab === 'all-questions' && (
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div
              className={`p-10 rounded-2xl border text-center ${
                isDarkMode ? 'bg-[#080d1a] border-[#151e33]' : 'bg-white border-slate-200'
              }`}
            >
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-300">Tidak ada butir soal yang sesuai</h4>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan kata kunci pencarian lain atau buat butir soal baru.
              </p>
            </div>
          ) : (
            filteredQuestions.map((item, index) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-colors ${
                  isDarkMode ? 'bg-[#0c1424] border-[#1b273d]' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {item.subject} · {item.grade}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">({item.topic})</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.difficulty === 'HOTS'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : item.difficulty === 'Sedang'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {item.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyQuestion(item)}
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 border transition-colors ${
                        copiedId === item.id
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : isDarkMode
                          ? 'border-[#1b253b] text-slate-400 hover:text-white'
                          : 'border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === item.id ? 'Tersalin' : 'Salin'}</span>
                    </button>
                    <button
                      onClick={() => onDeleteQuestion(item.id)}
                      className="p-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className={`text-sm font-medium mb-3 leading-relaxed ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {item.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {item.options.map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                        opt.key === item.correctKey
                          ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300 font-semibold'
                          : isDarkMode
                          ? 'border-[#1a2336] bg-[#090f1d] text-slate-300'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded font-bold text-[10px] flex items-center justify-center shrink-0 ${
                        opt.key === item.correctKey ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700/60 text-slate-300'
                      }`}>
                        {opt.key}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>

                <div
                  className={`p-3 rounded-xl border text-xs ${
                    isDarkMode ? 'bg-[#090f1d] border-[#1a2336] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-emerald-400 mr-2">Kunci: {item.correctKey}</span>
                  <span className="text-slate-400">{item.explanation}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: LIHAT BUTIR SOAL PAKET BATCH */}
      {selectedBatchForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0c1424] border border-[#1e2a42] shadow-2xl text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#1b273d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#142036] border border-[#1e2e4c] flex items-center justify-center text-sky-400 font-extrabold text-xs shrink-0">
                  {selectedBatchForView.level || 'SMP'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      Paket Soal: {selectedBatchForView.topic}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                      {selectedBatchForView.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedBatchForView.grade} · {selectedBatchForView.questions.length} Butir Soal · {selectedBatchForView.batchCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleOpenGoogleFormModal(selectedBatchForView)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/40 shadow-lg shadow-purple-900/30 flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Buatkan Google Form dengan fitur Acak Urut Soal & Acak Pilihan Jawaban Soal"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buatkan Google Form</span>
                </button>
                <button
                  onClick={() => handleCopyBatch(selectedBatchForView)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#171d38] hover:bg-[#20284d] text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5"
                >
                  {copiedBatchText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBatchText ? 'Tersalin' : 'Salin Semua'}</span>
                </button>
                <button
                  onClick={() => handleExportBatchText(selectedBatchForView)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0c2925] hover:bg-[#103833] text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor TXT</span>
                </button>
                <button
                  onClick={() => setSelectedBatchForView(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Questions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Highlight Banner: Buatkan Google Form */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1c1236] via-[#141d38] to-[#0c2236] border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Shuffle className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Buatkan Google Form Otomatis</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Anti-Contek
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Dukung <strong>Acak Urut Soal</strong> & <strong>Acak Pilihan Jawaban Soal</strong> serta aktivasi token dengan hitungan jam mundur.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenGoogleFormModal(selectedBatchForView)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95 shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Konfigurasi Form</span>
                </button>
              </div>

              {selectedBatchForView.questions.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#080d1a] border border-[#172338] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {item.topic}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {item.difficulty}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyQuestion(item)}
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 border transition-colors ${
                        copiedId === item.id
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-[#1b253b] text-slate-400 hover:text-white'
                      }`}
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === item.id ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>

                  <p className="text-sm font-medium text-white leading-relaxed">
                    {item.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.options.slice(0, selectedBatchForView.optionsCount).map((opt) => {
                      const isCorrect = opt.key === item.correctKey;
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                            isCorrect
                              ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300 font-semibold'
                              : 'border-[#192336] bg-[#0c1424] text-slate-300'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded font-bold text-[10px] flex items-center justify-center shrink-0 ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700/60 text-slate-300'
                          }`}>
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c1424] border border-[#192336] text-xs">
                    <span className="font-bold text-emerald-400 mr-2 flex items-center gap-1 inline-flex">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Kunci: {item.correctKey}
                    </span>
                    <span className="text-slate-400">{item.explanation}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1b273d] flex items-center justify-between bg-[#0a101d] flex-wrap gap-2">
              <span className="text-xs text-slate-400">
                Total {selectedBatchForView.questions.length} butir soal siap diekspor ke Google Form & Ujian Live
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenGoogleFormModal(selectedBatchForView)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-900/30 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Buatkan Google Form (Acak Soal & Opsi)</span>
                </button>
                <button
                  onClick={() => setSelectedBatchForView(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUATKAN GOOGLE FORM DENGAN ACAK URUT SOAL & ACAK PILIHAN JAWABAN SOAL */}
      {batchForGoogleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0c1424] border border-purple-500/30 shadow-2xl text-white overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#1b273d] flex items-center justify-between bg-gradient-to-r from-[#17122e] to-[#0c1424]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-lg shadow-purple-900/20">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Buatkan Google Form dari Paket Soal
                    </h3>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Otomatisasi Asesmen
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Paket: <strong className="text-white">{batchForGoogleForm.topic}</strong> · {batchForGoogleForm.grade} · {batchForGoogleForm.questions.length} Butir Soal · {batchForGoogleForm.batchCode}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setBatchForGoogleForm(null);
                  setCreatedFormSuccess(null);
                }}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {createdFormSuccess ? (
                /* SUCCESS CELEBRATION VIEW */
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#11241f] to-[#0a1513] border border-emerald-500/40 text-center space-y-5 animate-fadeIn">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-white">
                      Google Form Berhasil Dibuat & Disinkronkan!
                    </h4>
                    <p className="text-xs text-slate-300 max-w-lg mx-auto mt-1">
                      Paket soal berhasil diacak sesuai konfigurasi dan tersimpan di menu Daftar Google Form.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="max-w-xl mx-auto p-4 rounded-2xl bg-[#080d1a] border border-emerald-500/30 text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Judul Google Form:</span>
                      <span className="text-xs font-bold text-white">{createdFormSuccess.name}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Target Kelas:</span>
                      <span className="text-xs font-semibold text-sky-400">{createdFormSuccess.targetClass}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Token Akses Siswa:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                          {createdFormSuccess.token}
                        </span>
                        <button
                          onClick={() => {
                            if (createdFormSuccess.token) {
                              navigator.clipboard.writeText(createdFormSuccess.token);
                              setCopiedSuccessToken(true);
                              setTimeout(() => setCopiedSuccessToken(false), 2000);
                            }
                          }}
                          className="text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                        >
                          {copiedSuccessToken ? 'Tersalin' : 'Salin'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Status & Durasi:</span>
                      <span className="text-xs font-semibold text-emerald-400">
                        {createdFormSuccess.status} ({createdFormSuccess.durationMinutes} Menit)
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Fitur Pengacakan:</span>
                      <span className="text-[11px] font-semibold text-purple-300">
                        {shuffleQuestions ? 'Acak Soal: AKTIF' : 'Acak Soal: NONAKTIF'} · {shuffleOptions ? 'Acak Opsi: AKTIF' : 'Acak Opsi: NONAKTIF'}
                      </span>
                    </div>

                    <div className="pt-1">
                      <label className="text-[11px] text-slate-400 block mb-1">Tautan Pengerjaan Siswa:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={createdFormSuccess.url}
                          className="flex-1 p-2 rounded-xl text-xs bg-[#0c1424] border border-slate-700 text-slate-300 font-mono select-all"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdFormSuccess.url);
                            setCopiedSuccessLink(true);
                            setTimeout(() => setCopiedSuccessLink(false), 2000);
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                        >
                          {copiedSuccessLink ? 'Tersalin!' : 'Salin Link'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons in Success Screen */}
                  <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                    <a
                      href={createdFormSuccess.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4 text-amber-300" />
                      <span>Buka Google Form Siswa</span>
                    </a>

                    {createdFormSuccess.editUrl && (
                      <a
                        href={createdFormSuccess.editUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#171d38] hover:bg-[#20284d] text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-all"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                        <span>Edit Form (Editor Guru)</span>
                      </a>
                    )}

                    <a
                      href="https://drive.google.com/drive/search?q=v2-soalpintar.ai"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-teal-600/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Buka di Google Drive</span>
                    </a>

                    {onNavigate && (
                      <button
                        onClick={() => {
                          setBatchForGoogleForm(null);
                          setSelectedBatchForView(null);
                          onNavigate('google-forms');
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                        <span>Ke Menu Distribusi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={handleCopyAppsScript}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#12192a] hover:bg-[#1a243a] text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      {copiedAppsScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAppsScript ? 'Skrip Tersalin!' : 'Salin Kode Script'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setBatchForGoogleForm(null);
                      }}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ) : (
                /* FORM CONFIGURATION & RANDOMIZATION CONTROLS */
                <div className="space-y-6">
                  {/* SECTION 1: FITUR PENGACAKAN (ACAK URUT SOAL & ACAK PILIHAN JAWABAN SOAL) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-300">
                          1. Pengaturan Pengacakan (Anti-Contek)
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Opsi ini mencegah siswa menyontek jawaban
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* TOGGLE 1: ACAK URUT SOAL */}
                      <div
                        onClick={() => setShuffleQuestions(!shuffleQuestions)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          shuffleQuestions
                            ? 'bg-gradient-to-br from-[#1c1238] to-[#121936] border-purple-500/50 shadow-md shadow-purple-900/20'
                            : 'bg-[#080d1a] border-slate-800 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              shuffleQuestions ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              <Shuffle className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-white">
                                Acak Urut Soal
                              </h5>
                              <p className="text-[11px] text-slate-400">
                                Shuffling Question Order
                              </p>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                            shuffleQuestions ? 'bg-purple-600' : 'bg-slate-700'
                          }`}>
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              shuffleQuestions ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          Mengacak urutan nomor butir soal (1 s/d {processedQuestions.length}). Setiap lembar siswa akan menampilkan nomor soal dalam urutan yang berbeda.
                        </p>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Status Acak:</span>
                          <span className={`font-bold ${shuffleQuestions ? 'text-purple-300' : 'text-slate-400'}`}>
                            {shuffleQuestions ? '✓ AKTIF (Urutan Berubah)' : '✕ NONAKTIF (Urutan Asli)'}
                          </span>
                        </div>
                      </div>

                      {/* TOGGLE 2: ACAK PILIHAN JAWABAN SOAL */}
                      <div
                        onClick={() => setShuffleOptions(!shuffleOptions)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          shuffleOptions
                            ? 'bg-gradient-to-br from-[#1c1238] to-[#121936] border-purple-500/50 shadow-md shadow-purple-900/20'
                            : 'bg-[#080d1a] border-slate-800 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              shuffleOptions ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              <RotateCw className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-white">
                                Acak Pilihan Jawaban Soal
                              </h5>
                              <p className="text-[11px] text-slate-400">
                                Shuffling Option Choices (A, B, C, D)
                              </p>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                            shuffleOptions ? 'bg-indigo-600' : 'bg-slate-700'
                          }`}>
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              shuffleOptions ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          Mengacak letak posisi opsi A, B, C, D di setiap butir soal. Kunci jawaban otomatis dipetakan ulang ke huruf opsi baru dengan 100% presisi.
                        </p>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Status Opsi:</span>
                          <span className={`font-bold ${shuffleOptions ? 'text-indigo-300' : 'text-slate-400'}`}>
                            {shuffleOptions ? '✓ AKTIF (Opsi Diacak & Kunci Cocok)' : '✕ NONAKTIF (Opsi A-D Tetap)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: PENGATURAN FORMULIR & TOKEN */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-sky-400" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-300">
                        2. Detail Formulir & Kuis
                      </h4>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#080d1a] border border-[#1b273d] space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Form Title */}
                        <div>
                          <label className="text-xs text-slate-300 block mb-1 font-semibold">
                            Judul Google Form
                          </label>
                          <input
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Contoh: Penilaian Harian: Kerucut"
                            className="w-full p-2.5 rounded-xl text-xs bg-[#0c1424] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        {/* Target Class */}
                        <div>
                          <label className="text-xs text-slate-300 block mb-1 font-semibold">
                            Target Kelas / Rombel
                          </label>
                          <input
                            type="text"
                            value={targetClass}
                            onChange={(e) => setTargetClass(e.target.value)}
                            placeholder="Contoh: SMP Kelas 9 / Kelas 9A"
                            className="w-full p-2.5 rounded-xl text-xs bg-[#0c1424] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        {/* Input Alamat Google Form */}
                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                              <span>Alamat Google Form (Otomatis ke Google Drive)</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                ✓ Web App Terhubung
                              </span>
                              <span className="text-slate-600">·</span>
                              <a
                                href="https://drive.google.com/drive/search?q=v2-soalpintar.ai"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                              >
                                <span>Folder Drive</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="url"
                              value={formCustomUrl}
                              onChange={(e) => setFormCustomUrl(e.target.value)}
                              placeholder="Kosongkan agar dibuat otomatis di Google Drive Anda (atau tempel URL form jika sudah ada)"
                              className="w-full p-2.5 rounded-xl text-xs bg-[#0c1424] border border-slate-700 text-white font-mono placeholder:text-slate-500 placeholder:font-sans focus:outline-none focus:border-purple-500"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                            💡 <strong className="text-slate-200">Tips:</strong> Biarkan kolom di atas <span className="text-emerald-400 font-semibold">kosong</span>. Sistem akan otomatis memanggil Google Apps Script Anda untuk membuat kuis baru di Google Drive (Folder: <span className="font-semibold text-white">v2-soalpintar.ai</span>) sehingga link tidak akan 404 / 'file tidak ada'.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Token Input with Generator */}
                        <div>
                          <label className="text-xs text-slate-300 block mb-1 font-semibold">
                            Token Sandi Ujian
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={formToken}
                              onChange={(e) => setFormToken(e.target.value.toUpperCase())}
                              className="w-full p-2.5 rounded-xl text-xs bg-[#0c1424] border border-slate-700 text-amber-300 font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => setFormToken(`SPT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`)}
                              className="px-2.5 py-2.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                              title="Acak Ulang Token"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Exam Duration */}
                        <div>
                          <label className="text-xs text-slate-300 block mb-1 font-semibold">
                            Durasi Pengerjaan
                          </label>
                          <select
                            value={formDurationMinutes}
                            onChange={(e) => setFormDurationMinutes(Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl text-xs bg-[#0c1424] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          >
                            <option value={45}>45 Menit</option>
                            <option value={60}>60 Menit (1 Jam)</option>
                            <option value={90}>90 Menit (1.5 Jam)</option>
                            <option value={120}>120 Menit (2 Jam)</option>
                          </select>
                        </div>

                        {/* Points per Question */}
                        <div>
                          <label className="text-xs text-slate-300 block mb-1 font-semibold">
                            Poin per Butir Soal
                          </label>
                          <select
                            value={pointsPerQuestion}
                            onChange={(e) => setPointsPerQuestion(Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl text-xs bg-[#0c1424] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          >
                            <option value={10}>10 Poin (Total: {10 * processedQuestions.length})</option>
                            <option value={5}>5 Poin (Total: {5 * processedQuestions.length})</option>
                            <option value={4}>4 Poin (Total: {4 * processedQuestions.length})</option>
                            <option value={20}>20 Poin (Total: {20 * processedQuestions.length})</option>
                          </select>
                        </div>
                      </div>

                      {/* Checkbox Options */}
                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoActivateCountdown}
                            onChange={(e) => setAutoActivateCountdown(e.target.checked)}
                            className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                          />
                          <span>Hitungan Mundur Aktif</span>
                        </label>
                        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={limitOneResponse}
                            onChange={(e) => setLimitOneResponse(e.target.checked)}
                            className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                          />
                          <span>Batasi 1 Respons Siswa</span>
                        </label>
                        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={collectEmail}
                            onChange={(e) => setCollectEmail(e.target.checked)}
                            className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                          />
                          <span>Kumpulkan Email Siswa</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: PRATINJAU INTERAKTIF SOAL TERACAK (LIVE PREVIEW) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-300">
                          3. Pratinjau Hasil Pengacakan Real-Time
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleReshufflePreview}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                          title="Acak ulang susunan soal dan opsi sekarang"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>Acak Ulang Pratinjau</span>
                        </button>

                        <div className="flex rounded-xl bg-slate-800 p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setActivePreviewTab('preview')}
                            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                              activePreviewTab === 'preview'
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Soal ({processedQuestions.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePreviewTab('script')}
                            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                              activePreviewTab === 'script'
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Apps Script
                          </button>
                        </div>
                      </div>
                    </div>

                    {activePreviewTab === 'preview' ? (
                      <div className="max-h-72 overflow-y-auto space-y-3 p-3 rounded-2xl bg-[#080d1a] border border-[#1b273d]">
                        {processedQuestions.map((q) => (
                          <div
                            key={`shuffled-${q.displayIndex}-${q.originalIndex}`}
                            className="p-3.5 rounded-xl bg-[#0c1424] border border-[#182337] space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center">
                                  #{q.displayIndex}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  (Soal Asli: #{q.originalIndex})
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                                  {q.difficulty}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-emerald-400">
                                Kunci Baru: Opsi {q.correctKey}
                              </span>
                            </div>

                            <p className="text-slate-200 font-medium leading-relaxed">
                              {q.questionText}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {q.options.map((opt) => {
                                const isCorrect = opt.key === q.correctKey;
                                return (
                                  <div
                                    key={opt.key}
                                    className={`p-2 rounded-lg border flex items-start gap-1.5 ${
                                      isCorrect
                                        ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300 font-semibold'
                                        : 'border-slate-800 bg-[#080d1a] text-slate-300'
                                    }`}
                                  >
                                    <span className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                      isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                                    }`}>
                                      {opt.key}
                                    </span>
                                    <span className="truncate">{opt.text}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">
                            Skrip Google Apps Script untuk otomatis membuat Google Form ini di akun Google Drive Anda:
                          </p>
                          <button
                            type="button"
                            onClick={handleCopyAppsScript}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1"
                          >
                            {copiedAppsScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedAppsScript ? 'Tersalin' : 'Salin Kode'}</span>
                          </button>
                        </div>
                        <pre className="max-h-72 overflow-y-auto p-4 rounded-2xl bg-[#060a14] border border-[#1a2336] text-[11px] text-sky-300 font-mono select-all">
                          {generateBatchAppsScript()}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Loading & Error Status Feedback */}
            {isCreatingRealForm && (
              <div className="p-4 mx-4 sm:mx-6 mb-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">Sedang Membuat Google Form di Google Drive Akun Anda...</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Menghubungi Google Apps Script Web App untuk membuat kuis baru di folder <strong className="text-emerald-300">v2-soalpintar.ai</strong> dengan kunci jawaban lengkap.
                  </p>
                </div>
              </div>
            )}

            {createFormError && (
              <div className="p-4 mx-4 sm:mx-6 mb-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{createFormError}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => {
                          setBatchForGoogleForm(null);
                          onNavigate('settings');
                        }}
                        className="text-[11px] underline text-rose-200 hover:text-white"
                      >
                        Buka Menu Settings (Cek URL Web App)
                      </button>
                    )}
                    <a
                      href="https://forms.new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] underline text-sky-300 hover:text-white inline-flex items-center gap-1"
                    >
                      <span>Buat manual di forms.new</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            {!createdFormSuccess && (
              <div className="p-4 sm:p-5 border-t border-[#1b273d] flex items-center justify-between bg-[#0a101d] flex-wrap gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isCreatingRealForm}
                    onClick={handleExportShuffledTxt}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#111f38] hover:bg-[#182a4d] text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Download versi teks teracak"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ekspor TXT Teracak</span>
                  </button>

                  <button
                    type="button"
                    disabled={isCreatingRealForm}
                    onClick={handleCopyAppsScript}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#171d38] hover:bg-[#20284d] text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {copiedAppsScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAppsScript ? 'Skrip Tersalin!' : 'Salin Skrip Form'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isCreatingRealForm}
                    onClick={() => setBatchForGoogleForm(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    disabled={isCreatingRealForm}
                    onClick={() => handleCreateAndSaveGoogleForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1a233a] hover:bg-[#253252] text-slate-200 border border-slate-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isCreatingRealForm ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                        <span>Membuat Form...</span>
                      </>
                    ) : (
                      <span>Buatkan Google Form</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isCreatingRealForm}
                    onClick={() => handleCreateAndSaveGoogleForm(true)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isCreatingRealForm ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Menyimpan ke Google Drive...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Buat & Masuk ke Distribusi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: HAPUS BATCH */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1424] border border-rose-500/30 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Hapus Paket Soal?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus paket soal <strong className="text-white">"{batchToDelete.topic}"</strong> ({batchToDelete.grade}, {batchToDelete.questionCount} soal)? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setBatchToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteBatch}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
              >
                Ya, Hapus Paket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SOAL MANUAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0c1424] border border-[#1e2a42] shadow-2xl text-white overflow-hidden">
            <div className="p-5 border-b border-[#1b273d] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Tambah Soal Manual</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Jenjang & Kelas</label>
                  <input
                    type="text"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Topik / Materi</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Contoh: Bangun Ruang Sisi Lengkung..."
                  className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Teks Pertanyaan</label>
                <textarea
                  rows={3}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  required
                  placeholder="Tuliskan pertanyaan dengan jelas..."
                  className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Pilihan Jawaban</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Pilihan A"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    required
                    className="p-2 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                  <input
                    type="text"
                    placeholder="Pilihan B"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    required
                    className="p-2 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                  <input
                    type="text"
                    placeholder="Pilihan C"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    className="p-2 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                  <input
                    type="text"
                    placeholder="Pilihan D"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    className="p-2 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Kunci Jawaban Benar</label>
                  <select
                    value={correctKey}
                    onChange={(e) => setCorrectKey(e.target.value as 'A' | 'B' | 'C' | 'D')}
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
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as 'Mudah' | 'Sedang' | 'HOTS')}
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
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Penjelasan langkah penyelesaian..."
                  className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-[#1b273d] text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  Simpan ke Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GENERATOR BATCH SECARA ACAK */}
      {isRandomBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0c1424] border border-purple-500/30 shadow-2xl text-white overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#1b273d] flex items-center justify-between bg-[#0e172a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md shadow-purple-900/30">
                  <Shuffle className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Generator Batch Secara Acak
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Anti-Contek
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Acak butir soal & opsi untuk membuat paket ujian baru atau varian kelas paralel.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRandomBatchModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {randomBatchCreatedSuccess ? (
                /* SUCCESS SCREEN */
                <div className="text-center py-6 px-4 space-y-5 animate-fadeIn">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {randomBatchCreatedSuccess.length > 1
                        ? `Berhasil Membuat ${randomBatchCreatedSuccess.length} Varian Batch Acak!`
                        : 'Batch Secara Acak Berhasil Dibuat!'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Paket soal acak baru telah disimpan ke Bank Soal dengan nomor urut butir dan opsi jawaban yang telah diacak.
                    </p>
                  </div>

                  {/* List of created batches */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
                    {randomBatchCreatedSuccess.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl bg-[#080d1a] border border-purple-500/30 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                            {b.batchCode}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            {b.questionCount} Soal
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white truncate">{b.topic}</h5>
                        <p className="text-[10px] text-slate-400">{b.grade} · {b.subject}</p>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRandomBatchModalOpen(false);
                          onNavigate('google-forms');
                        }}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Buka di Menu Distribusi Google Form</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsRandomBatchModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      Lihat di Bank Soal
                    </button>
                  </div>
                </div>
              ) : (
                /* FORM CONFIGURATION & SETTINGS */
                <div className="space-y-6">
                  {/* STEP 1: PILIH SUMBER PENGACAKAN */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      1. Pilih Sumber Soal yang Akan Diacak
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setRandomSourceMode('all-questions')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          randomSourceMode === 'all-questions'
                            ? 'bg-gradient-to-br from-[#1d143d] to-[#121938] border-purple-500/60 shadow-md shadow-purple-900/20'
                            : 'bg-[#080d1a] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            randomSourceMode === 'all-questions' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              Acak dari Semua Butir Soal
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              Pool: {questions.length} butir pertanyaan
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          Mengambil kombinasi soal acak dari seluruh bank soal lintas topik dan materi.
                        </p>
                      </div>

                      <div
                        onClick={() => {
                          setRandomSourceMode('existing-batch');
                          if (!selectedSourceBatchId && batches.length > 0) {
                            setSelectedSourceBatchId(batches[0].id);
                          }
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          randomSourceMode === 'existing-batch'
                            ? 'bg-gradient-to-br from-[#1d143d] to-[#121938] border-purple-500/60 shadow-md shadow-purple-900/20'
                            : 'bg-[#080d1a] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            randomSourceMode === 'existing-batch' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              Acak dari Paket Batch Tertentu
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              {batches.length} paket batch tersedia
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          Mengocok ulang nomor dan opsi dari batch materi spesifik untuk membuat varian baru.
                        </p>
                      </div>
                    </div>

                    {/* If existing batch mode, select the batch */}
                    {randomSourceMode === 'existing-batch' && (
                      <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2">
                        <label className="text-xs font-semibold text-slate-300 block">
                          Pilih Paket Batch Sumber:
                        </label>
                        <select
                          value={selectedSourceBatchId}
                          onChange={(e) => {
                            const found = batches.find((b) => b.id === e.target.value);
                            setSelectedSourceBatchId(e.target.value);
                            if (found) {
                              setRandomBatchTitle(`${found.topic} (Varian Acak)`);
                              setRandomBatchGrade(found.grade);
                              setRandomBatchSubject(found.subject || 'Mata Pelajaran Umum');
                              setRandomCount(found.questions.length);
                            }
                          }}
                          className="w-full p-2.5 rounded-xl text-xs bg-[#0c1424] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                        >
                          {batches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.topic} ({b.grade}) - {b.questionCount} Soal [{b.batchCode}]
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: PENGATURAN INFORMASI BATCH ACAK */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      2. Pengaturan Paket Batch Acak
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Nama / Topik Batch Acak
                        </label>
                        <input
                          type="text"
                          value={randomBatchTitle}
                          onChange={(e) => setRandomBatchTitle(e.target.value)}
                          placeholder="Contoh: Penilaian Harian (Acak)"
                          className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Jenjang & Target Kelas
                        </label>
                        <input
                          type="text"
                          value={randomBatchGrade}
                          onChange={(e) => setRandomBatchGrade(e.target.value)}
                          placeholder="Contoh: SMP Kelas 9"
                          className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Kode Batch Unik
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={randomBatchCode}
                            onChange={(e) => setRandomBatchCode(e.target.value)}
                            className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-slate-700 text-amber-300 font-mono font-bold tracking-wider focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setRandomBatchCode(generateRandomBatchCode())}
                            className="px-2.5 py-2.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                            title="Acak Kode Baru"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Jumlah Soal
                          </label>
                          <select
                            value={randomCount}
                            onChange={(e) => setRandomCount(Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          >
                            <option value={5}>5 Soal</option>
                            <option value={10}>10 Soal</option>
                            <option value={15}>15 Soal</option>
                            <option value={20}>20 Soal</option>
                            <option value={25}>25 Soal</option>
                            <option value={30}>30 Soal</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Kesulitan
                          </label>
                          <select
                            value={randomDiffFilter}
                            onChange={(e) => setRandomDiffFilter(e.target.value)}
                            className="w-full p-2.5 rounded-xl text-xs bg-[#080d1a] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          >
                            <option value="Semua">Semua Tingkat</option>
                            <option value="HOTS">HOTS Saja</option>
                            <option value="Sedang">Sedang Saja</option>
                            <option value="Mudah">Mudah Saja</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: OPSI PENGACAKAN ANTI-CONTEK & MULTI-VARIAN */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      3. Fitur Pengacakan & Multi-Varian
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Toggle 1: Acak Urutan Soal */}
                      <div
                        onClick={() => setRandomShuffleOrder(!randomShuffleOrder)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          randomShuffleOrder
                            ? 'bg-[#181136] border-purple-500/50 text-white'
                            : 'bg-[#080d1a] border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold">Acak Urut Soal</span>
                          <input
                            type="checkbox"
                            checked={randomShuffleOrder}
                            onChange={() => {}}
                            className="rounded text-purple-600 focus:ring-0"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Nomor butir pertanyaan akan diacak urutannya.
                        </p>
                      </div>

                      {/* Toggle 2: Acak Opsi Jawaban */}
                      <div
                        onClick={() => setRandomShuffleOptions(!randomShuffleOptions)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          randomShuffleOptions
                            ? 'bg-[#181136] border-purple-500/50 text-white'
                            : 'bg-[#080d1a] border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold">Acak Pilihan Jawaban</span>
                          <input
                            type="checkbox"
                            checked={randomShuffleOptions}
                            onChange={() => {}}
                            className="rounded text-purple-600 focus:ring-0"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Posisi pilihan A, B, C, D diacak acak per siswa.
                        </p>
                      </div>

                      {/* Multi-variant Option */}
                      <div className="p-3.5 rounded-2xl border bg-[#080d1a] border-slate-800 space-y-1">
                        <label className="text-xs font-bold text-slate-300 block">
                          Buat Multi-Varian:
                        </label>
                        <select
                          value={randomMultiVariantCount}
                          onChange={(e) => setRandomMultiVariantCount(Number(e.target.value))}
                          className="w-full p-2 rounded-xl text-xs bg-[#0c1424] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value={1}>1 Batch (Varian Tunggal)</option>
                          <option value={2}>2 Batch (Varian A & B)</option>
                          <option value={3}>3 Batch (Varian A, B & C)</option>
                        </select>
                        <p className="text-[10px] text-slate-500">
                          Membuat sekaligus varian untuk kelas paralel.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* STEP 4: LIVE PREVIEW BUTIR SOAL TERACAK */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                          4. Pratinjau Hasil Batch Acak ({randomizedQuestionsPreview.length} Butir Soal)
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRandomSeed(Date.now() + Math.floor(Math.random() * 1000))}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Kocok Ulang (Reshuffle)</span>
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-[#080d1a] border border-slate-800">
                      {randomizedQuestionsPreview.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-xs">
                          Tidak ada soal yang memenuhi kriteria pengacakan.
                        </div>
                      ) : (
                        randomizedQuestionsPreview.map((q) => (
                          <div
                            key={q.id}
                            className="p-3 rounded-xl bg-[#0c1424] border border-[#1b273d] text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[10px] flex items-center justify-center">
                                  #{q.displayIndex}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-300 truncate max-w-xs">
                                  {q.topic || q.subject}
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                {q.difficulty}
                              </span>
                            </div>

                            <p className="text-slate-200 line-clamp-2 leading-relaxed">
                              {q.question}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.key}
                                  className={`p-1.5 rounded-lg border text-[11px] truncate ${
                                    opt.key === q.correctKey
                                      ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300 font-semibold'
                                      : 'border-slate-800 bg-[#080d1a] text-slate-400'
                                  }`}
                                >
                                  <span className="font-bold mr-1">{opt.key}.</span>
                                  <span>{opt.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!randomBatchCreatedSuccess && (
              <div className="p-4 sm:p-5 border-t border-[#1b273d] flex items-center justify-between bg-[#0a101d] flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRandomBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateRandomBatch(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#171d38] hover:bg-[#20284d] text-indigo-300 border border-indigo-500/30 transition-all"
                  >
                    Simpan ke Bank Soal
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateRandomBatch(true)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Simpan & Masuk Distribusi Google Form</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
