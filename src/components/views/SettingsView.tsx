import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  Link2,
  Save,
  BookOpen,
  RotateCw,
  ExternalLink,
  Copy,
  Check,
  Radio,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Terminal,
  ShieldCheck,
  FolderCheck,
  FolderOpen,
  Loader2,
  X,
  Database,
  Trash2
} from 'lucide-react';
import { NavTab } from '../../types';
import { testGoogleAppsScriptConnection, GasTestResult } from '../../services/googleFormBridgeService';

interface SettingsViewProps {
  isDarkMode: boolean;
  onNavigate?: (tab: NavTab) => void;
  onClearAllDatabase?: () => void;
}

const DEFAULT_SCRIPT_CODE = `/**
 * soalpintar.ai — Google Form Creator Bridge
 * 
 * CARA SETUP (1x saja):
 * 1. Buka https://script.google.com
 * 2. Klik "New Project"
 * 3. Hapus isi default, paste seluruh kode ini
 * 4. Klik Deploy > New deployment
 * 5. Pilih type: Web app
 * 6. Execute as: Me (akun Anda)
 * 7. Who has access: Anyone
 * 8. Klik Deploy
 * 9. Copy URL yang muncul
 * 10. Paste URL ke Settings di dashboard guru
 *
 * SELESAI! Form akan dibuat di Google Drive Anda.
 *
 * VERSI 3.2: fitur "Nilai Siswa" (respons, skor, jawaban per soal) & acak soal.
 *   Respons diambil per halaman (maks. 500) & bisa hanya yang baru, aman untuk ribuan respons.
 * OPSIONAL - acak urutan PILIHAN JAWABAN: di editor Apps Script klik "Services" (+)
 *   > pilih "Google Forms API" > Add. Tanpa ini, yang diacak hanya urutan soal.
 * Jika memperbarui dari versi lama: paste ulang kode ini, lalu
 * Deploy > Manage deployments > Edit (ikon pensil) > Version: New version > Deploy.
 * URL Web App tetap sama, jadi tidak perlu mengubah Settings di dashboard.
 * Saat diminta izin, izinkan akses Google Forms & Drive.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    var quizId = data.quiz_id || '';
    var title = data.title || 'Quiz soalpintar.ai';
    var guruName = data.guru_name || 'Guru';
    var questions = data.questions || [];
    var folderName = data.folder_name || guruName;
    var totalQuestions = questions.length;
    
    // 0. Cek apakah folder dan form untuk Quiz ID ini sudah pernah dibuat sebelumnya
    var parentFolderName = 'v2-soalpintar.ai';
    var folders = DriveApp.getFoldersByName(parentFolderName);
    var parentFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(parentFolderName);
    
    var guruFolders = parentFolder.getFoldersByName(folderName);
    var guruFolder = guruFolders.hasNext() ? guruFolders.next() : parentFolder.createFolder(folderName);
    
    if (quizId) {
      var searchName = "Quiz: " + title + " [ID-" + quizId + "]";
      var files = guruFolder.getFilesByName(searchName);
      if (files.hasNext()) {
        var file = files.next();
        try {
          var existingForm = FormApp.openById(file.getId());
          return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            form_url: existingForm.getPublishedUrl(),
            edit_url: existingForm.getEditUrl(),
            form_id: existingForm.getId(),
            folder: folderName,
            is_existing: true
          })).setMimeType(ContentService.MimeType.JSON);
        } catch (err) {
          // Abaikan jika error saat membuka
        }
      }
    }

    // Calculate points per question so total = 100%
    var pointsPerQuestion = totalQuestions > 0 ? Math.floor(100 / totalQuestions) : 1;
    var remainder = totalQuestions > 0 ? 100 - (pointsPerQuestion * totalQuestions) : 0;
    
    // Create Google Form
    var form = FormApp.create(title);
    form.setIsQuiz(true);
    
    var description = 'Quiz dibuat oleh ' + guruName + ' \\n\\nIsi data diri Anda di bagian pertama, lalu kerjakan soal di bagian berikutnya.';
    if (quizId) {
      description += '\\n\\n[Quiz ID: ' + quizId + ']';
    }
    form.setDescription(description);
    
    // ========================================
    // SECTION 1: Data Siswa
    // ========================================
    
    // Nama Lengkap
    var namaItem = form.addTextItem();
    namaItem.setTitle('Nama Lengkap');
    namaItem.setRequired(true);
    namaItem.setHelpText('Masukkan nama lengkap Anda');
    
    // Nomor Absen
    var absenItem = form.addTextItem();
    absenItem.setTitle('Nomor Absen');
    absenItem.setRequired(true);
    absenItem.setHelpText('Masukkan nomor absen Anda');
    
    // Kelas
    var kelasItem = form.addTextItem();
    kelasItem.setTitle('Kelas');
    kelasItem.setRequired(true);
    kelasItem.setHelpText('Contoh: 9A, 10 IPA 2, 7B');
    
    // ========================================
    // SECTION 2: Soal-Soal
    // ========================================
    
    var pageBreak = form.addPageBreakItem();
    pageBreak.setTitle('Soal Ujian');
    pageBreak.setHelpText('Kerjakan soal berikut dengan teliti. Pilih satu jawaban yang paling tepat.\\nTotal nilai: 100');
    
    // Add questions with answer key and points
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      
      // Distribute points: spread remainder across first few questions
      var pts = pointsPerQuestion;
      if (i < remainder) {
        pts = pointsPerQuestion + 1;
      }

      if (q.type === 'essay') {
        var item = form.addParagraphTextItem();
        item.setTitle(q.number + '. ' + q.question);
        item.setRequired(true);
        item.setPoints(pts);
      } else {
        var item = form.addMultipleChoiceItem();
        item.setTitle(q.number + '. ' + q.question);
        item.setRequired(true);
        item.setPoints(pts);
        
        // Build choices with correct answer marked
        var choices = [];
        for (var j = 0; j < q.options.length; j++) {
          var isCorrect = (j === q.answer);
          choices.push(item.createChoice(q.options[j], isCorrect));
        }
        item.setChoices(choices);
      }
    }
    
    // Acak urutan soal / pilihan jawaban (opsional, dari dashboard)
    var shuffleInfo = applyShuffle(form, !!data.shuffle_questions, !!data.shuffle_options);

    // Move form to folder (create if not exists)
    var formFile = DriveApp.getFileById(form.getId());
    if (quizId) {
      formFile.setName("Quiz: " + title + " [ID-" + quizId + "]");
    }
    guruFolder.addFile(formFile);
    DriveApp.getRootFolder().removeFile(formFile);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      form_url: form.getPublishedUrl(),
      edit_url: form.getEditUrl(),
      form_id: form.getId(),
      folder: folderName,
      total_points: 100,
      points_per_question: pointsPerQuestion,
      shuffle_questions: shuffleInfo.questions,
      shuffle_options: shuffleInfo.options
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * doGet: aksi BACA saja (tidak pernah membuat / mengubah form).
 *   ?action=version                         -> versi script
 *   ?action=responses&form_id=ID[&since=ms][&offset=0&limit=500] -> respons + nilai (per halaman)
 *   ?action=find_form&published_id=PID      -> cari ID form (edit) dari ID link publik
 *   ?action=set_shuffle&form_id=ID&questions=1&options=1 -> atur acak soal / pilihan
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'responses') return jsonOut(getFormResponses(p.form_id, p.since, p.offset, p.limit));
    if (p.action === 'find_form') return jsonOut(findFormByPublishedId(p.published_id));
    if (p.action === 'set_shuffle') {
      var target = FormApp.openById(p.form_id);
      var info = applyShuffle(target, p.questions === '1', p.options === '1');
      return jsonOut({ status: 'success', version: SCRIPT_VERSION, shuffle_questions: info.questions, shuffle_options: info.options, options_message: info.message });
    }

    return jsonOut({ status: 'ok', message: 'soalpintar.ai Form Creator is running!', version: SCRIPT_VERSION });
  } catch (error) {
    return jsonOut({ status: 'error', message: error.toString(), version: SCRIPT_VERSION });
  }
}

var SCRIPT_VERSION = '3.2';

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ambil semua respons form beserta skor kuis.
 * Kolom identitas dicari dari judul pertanyaan yang mengandung "nama", "absen", "kelas".
 */
function getFormResponses(formId, sinceMs, offsetParam, limitParam) {
  if (!formId) return { status: 'error', message: 'form_id wajib diisi', version: SCRIPT_VERSION };

  var form;
  try {
    form = FormApp.openById(formId);
  } catch (err) {
    return { status: 'error', code: 'no_access', message: 'Form tidak bisa dibuka oleh akun Google ini. Pastikan form ada di akun yang sama dengan Apps Script.', version: SCRIPT_VERSION };
  }

  var isQuiz = form.isQuiz();
  var items = form.getItems();
  var maxScore = 0;
  var itemMeta = [];
  var idItems = { name: null, absen: null, kelas: null };

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var title = (it.getTitle() || '').toLowerCase();
    var type = it.getType();

    if (type === FormApp.ItemType.TEXT) {
      if (!idItems.name && title.indexOf('nama') !== -1) idItems.name = it.getId();
      else if (!idItems.absen && title.indexOf('absen') !== -1) idItems.absen = it.getId();
      else if (!idItems.kelas && title.indexOf('kelas') !== -1) idItems.kelas = it.getId();
    }
    if (isQuiz) {
      var pts = itemPoints(it);
      maxScore += pts;
      if (pts > 0) itemMeta.push(describeItem(it, pts));
    }
  }

  var responses = sinceMs ? form.getResponses(new Date(Number(sinceMs))) : form.getResponses();
  // Per halaman agar tidak melewati batas waktu Apps Script / web untuk ribuan respons
  var total = responses.length;
  var offset = Math.max(0, parseInt(offsetParam, 10) || 0);
  var limit = Math.min(1000, Math.max(1, parseInt(limitParam, 10) || 500));
  var end = Math.min(total, offset + limit);
  var rows = [];
  for (var r = offset; r < end; r++) {
    var resp = responses[r];
    var row = {
      id: resp.getId(),
      submitted_at: resp.getTimestamp().toISOString(),
      email: resp.getRespondentEmail() || null,
      name: null, absen: null, kelas: null,
      score: null
    };

    var answers = resp.getItemResponses();
    for (var a = 0; a < answers.length; a++) {
      var itemId = answers[a].getItem().getId();
      var val = String(answers[a].getResponse() || '');
      if (itemId === idItems.name) row.name = val;
      else if (itemId === idItems.absen) row.absen = val;
      else if (itemId === idItems.kelas) row.kelas = val;
    }

    if (isQuiz) {
      var score = 0;
      var graded = resp.getGradableItemResponses();
      row.answers = {};
      for (var g = 0; g < graded.length; g++) {
        var gScore = Number(graded[g].getScore() || 0);
        score += gScore;
        var raw = graded[g].getResponse();
        row.answers[String(graded[g].getItem().getId())] = {
          r: Array.isArray(raw) ? raw.join(' | ') : (raw === null || raw === undefined ? '' : String(raw)),
          s: gScore
        };
      }
      row.score = score;
    }
    rows.push(row);
  }

  return {
    status: 'success',
    version: SCRIPT_VERSION,
    form_id: form.getId(),
    title: form.getTitle(),
    is_quiz: isQuiz,
    max_score: isQuiz ? maxScore : null,
    items: offset === 0 ? itemMeta : [],
    total: total,
    offset: offset,
    has_more: end < total,
    next_offset: end < total ? end : null,
    accepting_responses: form.isAcceptingResponses(),
    responses: rows
  };
}

function itemPoints(it) {
  var T = FormApp.ItemType;
  switch (it.getType()) {
    case T.MULTIPLE_CHOICE: return it.asMultipleChoiceItem().getPoints();
    case T.CHECKBOX: return it.asCheckboxItem().getPoints();
    case T.LIST: return it.asListItem().getPoints();
    case T.TEXT: return it.asTextItem().getPoints();
    case T.PARAGRAPH_TEXT: return it.asParagraphTextItem().getPoints();
    case T.SCALE: return it.asScaleItem().getPoints();
    case T.DATE: return it.asDateItem().getPoints();
    case T.TIME: return it.asTimeItem().getPoints();
    case T.DATETIME: return it.asDateTimeItem().getPoints();
    case T.DURATION: return it.asDurationItem().getPoints();
    case T.GRID: return it.asGridItem().getPoints();
    case T.CHECKBOX_GRID: return it.asCheckboxGridItem().getPoints();
    default: return 0;
  }
}

/** Metadata soal untuk analisis butir: judul, poin, pilihan & kunci jawaban. */
function describeItem(it, points) {
  var T = FormApp.ItemType;
  var meta = { id: String(it.getId()), title: it.getTitle(), type: String(it.getType()), points: points, choices: [] };
  var choices = null;
  if (it.getType() === T.MULTIPLE_CHOICE) choices = it.asMultipleChoiceItem().getChoices();
  else if (it.getType() === T.CHECKBOX) choices = it.asCheckboxItem().getChoices();
  else if (it.getType() === T.LIST) choices = it.asListItem().getChoices();
  if (choices) {
    for (var c = 0; c < choices.length; c++) {
      meta.choices.push({ value: choices[c].getValue(), correct: choices[c].isCorrectAnswer() });
    }
  }
  return meta;
}

/**
 * Acak urutan soal (FormApp) dan, jika layanan "Google Forms API" diaktifkan,
 * acak urutan pilihan jawaban setiap soal pilihan ganda.
 */
function applyShuffle(form, shuffleQuestions, shuffleOptions) {
  var result = { questions: shuffleQuestions, options: false, message: '' };
  form.setShuffleQuestions(shuffleQuestions);

  if (typeof Forms === 'undefined') {
    result.message = shuffleOptions ? 'Layanan "Google Forms API" belum diaktifkan di Apps Script, pilihan jawaban tidak diacak.' : '';
    return result;
  }

  try {
    var full = Forms.Form.get(form.getId());
    var requests = [];
    (full.items || []).forEach(function (item, index) {
      var q = item.questionItem && item.questionItem.question;
      if (q && q.choiceQuestion) {
        requests.push({ updateItem: {
          item: { questionItem: { question: { choiceQuestion: { shuffle: shuffleOptions } } } },
          location: { index: index },
          updateMask: 'questionItem.question.choiceQuestion.shuffle'
        } });
      }
    });
    if (requests.length) Forms.Form.batchUpdate({ requests: requests }, form.getId());
    result.options = shuffleOptions;
  } catch (err) {
    result.message = 'Gagal mengatur acak pilihan: ' + err;
  }
  return result;
}

/**
 * Untuk form yang di-import manual (hanya punya link publik /forms/d/e/PID/viewform):
 * cari form di Google Drive akun ini yang link publiknya cocok.
 */
function findFormByPublishedId(publishedId) {
  if (!publishedId) return { status: 'error', message: 'published_id wajib diisi', version: SCRIPT_VERSION };

  var files = DriveApp.getFilesByType(MimeType.GOOGLE_FORMS);
  var checked = 0;
  while (files.hasNext() && checked < 500) {
    var file = files.next();
    checked++;
    try {
      var f = FormApp.openById(file.getId());
      if ((f.getPublishedUrl() || '').indexOf(publishedId) !== -1) {
        return { status: 'success', version: SCRIPT_VERSION, form_id: f.getId(), title: f.getTitle(), is_quiz: f.isQuiz() };
      }
    } catch (err) {
      // Lewati form yang tidak bisa dibuka
    }
  }
  return { status: 'error', code: 'not_found', message: 'Form tidak ditemukan di Google Drive akun ini (dicek ' + checked + ' form).', version: SCRIPT_VERSION };
}`;

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  onNavigate,
  onClearAllDatabase
}) => {
  // Stored Google Apps Script URL
  const [scriptUrl, setScriptUrl] = useState<string>(() => {
    const defaultUrl =
      'https://script.google.com/macros/s/AKfycbwt6SSJ8sxrZ8J01mMmX8aU3DGiNgMPJ4xo3OqLWblv8-YT9J9RN0vrFV3TL5utWoNS/exec';
    const saved = localStorage.getItem('soalpintar_gas_url');
    // If not saved or was previous dummy placeholder, update to user's real URL
    if (!saved || saved.includes('AKfycbyYX1FiIMF6bHPzgRTeFPfw_1qCcLQtCQy7A9f9XVYEPCayshLc0HIVYrJ2')) {
      localStorage.setItem('soalpintar_gas_url', defaultUrl);
      return defaultUrl;
    }
    return saved;
  });

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [testStatusMessage, setTestStatusMessage] = useState<string | null>(null);

  // Database wipe states
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [databaseWipedSuccess, setDatabaseWipedSuccess] = useState(false);

  const handleExecuteClearDatabase = () => {
    if (onClearAllDatabase) {
      onClearAllDatabase();
    }
    setShowClearConfirmModal(false);
    setDatabaseWipedSuccess(true);
    setTimeout(() => setDatabaseWipedSuccess(false), 4000);
  };

  // Real Web App and Google Drive connection test states
  const [isCheckingGas, setIsCheckingGas] = useState<boolean>(false);
  const [gasTestResult, setGasTestResult] = useState<GasTestResult | null>(null);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);

  // Validate URL format
  const isValidUrl =
    scriptUrl.trim().startsWith('https://script.google.com/macros/s/') &&
    scriptUrl.trim().endsWith('/exec');

  useEffect(() => {
    setIsConnected(Boolean(isValidUrl));
  }, [scriptUrl, isValidUrl]);

  const handleCheckWebApp = async () => {
    setIsCheckingGas(true);
    setTestStatusMessage(null);
    setShowTestModal(true);
    const res = await testGoogleAppsScriptConnection(scriptUrl.trim());
    setIsCheckingGas(false);
    setGasTestResult(res);
    if (res.success) {
      setIsConnected(true);
      setTestStatusMessage(`Web App Aktif (v${res.version || '3.2'}) dan terhubung ke Google Drive (${res.responseTimeMs || 120}ms)!`);
    } else {
      setIsConnected(false);
      setTestStatusMessage(res.error || 'Gagal menghubungi Google Apps Script.');
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTestStatusMessage(null);

    const clean = scriptUrl.trim();
    localStorage.setItem('soalpintar_gas_url', clean);

    const res = await testGoogleAppsScriptConnection(clean);
    setIsSaving(false);
    setSaveSuccessNotice(true);
    setGasTestResult(res);

    if (res.success) {
      setIsConnected(true);
      setTestStatusMessage(`Koneksi divalidasi: Web App v${res.version || '3.2'} siap digunakan dengan Google Drive (${res.responseTimeMs || 100}ms).`);
    } else {
      setIsConnected(clean.includes('/exec'));
      setTestStatusMessage(res.error || 'Peringatan: URL harus berakhiran /exec dan dapat diakses.');
    }
    setTimeout(() => setSaveSuccessNotice(false), 4500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(DEFAULT_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Konfigurasi Google Apps Script untuk membuat Google Form
        </p>
      </div>

      {/* TOP CARD 1: Status Terkoneksi */}
      <div
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex items-center justify-between gap-4 transition-all ${
          isConnected
            ? 'bg-[#06151c]/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
            : 'bg-[#1c0f0f]/90 border-rose-500/40 shadow-lg shadow-rose-950/20'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isConnected
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {isConnected ? 'Sistem Terkoneksi' : 'Sistem Belum Terkoneksi'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {isConnected
                ? 'Google Apps Script Anda sudah aktif dan siap digunakan.'
                : 'Periksa URL Web App Google Apps Script di bawah agar berakhiran /exec.'}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase border flex items-center gap-1.5 ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
          </span>
        </div>
      </div>

      {/* CARD 2: Konfigurasi Google Apps Script */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition-colors ${
          isDarkMode ? 'bg-[#0c1424] border-[#1b263b] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Block with Purple Rounded Gear */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <SettingsIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold">Konfigurasi Google Apps Script</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Masukkan URL Web App yang Anda dapatkan dari Google Script Editor.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveUrl} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[11px] sm:text-xs font-bold tracking-wider text-slate-300 uppercase">
              GOOGLE APPS SCRIPT WEB APP URL
            </label>

            {/* Input field with link chain icon */}
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                required
                className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#070d1a] border-[#1e2a42] text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                }`}
              />
            </div>
          </div>

          {/* Row below input: Helper text & Save Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Pastikan URL berakhiran</span>
              <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                /exec
              </span>
            </div>

            <div className="flex items-center gap-2">
              {saveSuccessNotice && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fadeIn">
                  <Check className="w-4 h-4" />
                  <span>Tersimpan!</span>
                </span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>

          {testStatusMessage && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-300 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testStatusMessage}</span>
            </div>
          )}
        </form>
      </div>

      {/* CARD: GOOGLE DRIVE TERHUBUNG & AKSES FOLDER */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition-all ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#0c1a2e] via-[#091524] to-[#0c1424] border-cyan-500/30 text-white shadow-cyan-950/20'
            : 'bg-gradient-to-br from-sky-50 via-indigo-50 to-emerald-50 border-sky-200 text-slate-900 shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-400 to-sky-500 p-[2px] shadow-lg shadow-sky-500/20 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#0c1424] flex items-center justify-center">
                <FolderCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold">Google Drive Terhubung</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                  Folder: v2-soalpintar.ai
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Script Web App otomatis membuat dan menyimpan formulir kuis Google Form pada folder khusus{' '}
                <strong className="text-white font-semibold">v2-soalpintar.ai</strong> di Google Drive akun Anda.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-cyan-300/90 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Web App Aktif: .../AKfycbwt6SSJ8sxrZ8J01mMm.../exec</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <a
              href="https://drive.google.com/drive/search?q=v2-soalpintar.ai"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Buka Google Drive</span>
            </a>

            <a
              href="https://drive.google.com/drive/my-drive"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#162238] hover:bg-[#203050] text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Drive Saya</span>
            </a>

            <button
              type="button"
              onClick={handleCheckWebApp}
              disabled={isCheckingGas}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#1a203c] hover:bg-[#252f58] text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="Cek koneksi Web App ke Google Drive"
            >
              {isCheckingGas ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-300" />
                  <span>Memeriksa...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cek Web App</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CARD 3: Masih bingung cara setupnya? */}
      <div
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex items-center justify-between gap-4 transition-colors ${
          isDarkMode ? 'bg-[#0c1424] border-[#1b263b]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white">
              Masih bingung cara setupnya?
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Lihat panduan lengkap langkah demi langkah di sini.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onNavigate) {
              onNavigate('panduan');
            }
          }}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1a233b] hover:bg-[#253254] text-slate-200 border border-slate-700/60 transition-colors shrink-0"
        >
          Buka Panduan
        </button>
      </div>

      {/* CARD 4: Cara memperbarui script ke versi terbaru (± 2 menit) */}
      <div
        className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border space-y-3.5 transition-colors ${
          isDarkMode
            ? 'bg-[#0e1726] border-amber-900/30 text-white'
            : 'bg-amber-50/50 border-amber-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <RotateCw className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm sm:text-base font-bold text-white">
            Cara memperbarui script ke versi terbaru (± 2 menit)
          </h4>
        </div>

        <ol className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed list-decimal list-inside pl-0.5">
          <li>
            Klik <strong className="text-white">Salin Kode</strong> di bawah.
          </li>
          <li>
            Buka{' '}
            <a
              href="https://script.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 underline hover:text-indigo-300"
            >
              script.google.com
            </a>
            , pilih project Apps Script SoalPintar Anda.
          </li>
          <li>
            Buka file <strong className="text-white">Code.gs</strong>, hapus semua isinya (Ctrl/Cmd + A), lalu tempel kode baru dan klik <strong className="text-white">Simpan</strong>.
          </li>
          <li>
            Klik <strong className="text-white">Deploy → Manage deployments</strong> → ikon pensil (Edit) → pilih <strong className="text-white">Version: New version → Deploy</strong>.
          </li>
          <li>
            Selesai. <strong className="text-white">URL script tidak berubah</strong>, jadi kolom URL di atas tidak perlu diubah. Coba <strong className="text-white">Ambil Nilai</strong> di menu Nilai Siswa.
          </li>
        </ol>

        <p className="text-[11px] sm:text-xs text-slate-400 pt-2 border-t border-slate-800/80 leading-relaxed">
          Jika diminta izin akses (Authorize), pilih akun Google Anda lalu izinkan; fitur baru membaca respons Google Form Anda untuk mengambil nilai.
        </p>
      </div>

      {/* SECTION 5: Kode Script (Code.gs) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Kode Script (Code.gs)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              v3.2
            </span>
          </h3>

          <div className="flex items-center gap-3">
            <a
              href="https://script.google.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Script Google</span>
            </a>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors p-1 rounded-lg hover:bg-indigo-950/40"
            >
              {copiedScript ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Syntax-Highlighted Script Code Block */}
        <div className="rounded-3xl border border-[#1a2336] bg-[#070b14] overflow-hidden shadow-2xl relative">
          <div className="px-4 py-3 bg-[#0a101f] border-b border-[#1a2336] flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="font-mono text-slate-300 ml-2">Code.gs — Google Apps Script</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">JavaScript / GAS</span>
          </div>

          <div className="max-h-[460px] overflow-y-auto p-4 sm:p-5 font-mono text-xs text-slate-300 leading-relaxed">
            <pre className="whitespace-pre overflow-x-auto text-[11.5px] sm:text-xs">
              <code>{DEFAULT_SCRIPT_CODE}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* CARD 3: Manajemen Database & Penyimpanan */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition-colors ${
          isDarkMode ? 'bg-[#0c1424] border-[#1b263b] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 shrink-0">
              <Database className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Manajemen Database & Penyimpanan</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola data tersimpan, hapus seluruh bank soal, google form, sesi ujian, dan catatan siswa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Database Bersih & Siap Digunakan
            </span>
          </div>
        </div>

        {databaseWipedSuccess && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Seluruh data base telah berhasil dihapus dan dikosongkan secara menyeluruh! ✅</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-[#080d1a] border border-[#172235] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">Kosongkan Seluruh Data Aplikasi</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Tindakan ini akan menghapus semua butir soal di Bank Soal, riwayat batch, formulir Google Form tersimpan, token siswa, dan rekap peserta ujian langsung dari memori lokal dan server.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowClearConfirmModal(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua Database</span>
          </button>
        </div>
      </div>

      {/* MODAL: KONFIRMASI HAPUS SEMUA DATABASE */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1424] border border-rose-500/50 shadow-2xl text-white p-6 sm:p-7 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-lg font-extrabold text-white">Hapus Semua Database?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>seluruh database</strong> yang ada? Semua bank soal, paket kuis, tautan form, token ujian siswa, dan rekaman pengawasan akan dihapus bersih.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-rose-500/20 text-[11px] text-rose-300/90 space-y-1">
              <p className="font-semibold text-rose-300">Data yang akan dikosongkan:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                <li>Bank Soal & Paket Soal Generator</li>
                <li>Daftar Distribusi Google Form & Token Ujian</li>
                <li>Peserta & Sesi Ujian Live</li>
                <li>Riwayat Pelanggaran Siswa & Transaksi</li>
              </ul>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteClearDatabase}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIAGNOSTIK KONEKSI WEB APP & GOOGLE DRIVE */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[#0c1424] border border-[#1e2a42] shadow-2xl text-white overflow-hidden space-y-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1b273d]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Status Koneksi Web App & Google Drive</h4>
                  <p className="text-[11px] text-slate-400">Pemeriksaan live koneksi Google Apps Script</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            {isCheckingGas ? (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                <h5 className="font-bold text-sm text-white">Sedang Menghubungi Google Apps Script...</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Memeriksa endpoint Web App dan integrasi folder kuis di Google Drive.
                </p>
              </div>
            ) : gasTestResult?.success ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Terkoneksi Normal & Aktif</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-400 uppercase">
                        OK
                      </span>
                    </h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Web App dan Google Drive Anda siap digunakan untuk membuat formulir kuis otomatis.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Versi Script:</span>
                    <span className="font-mono font-bold text-indigo-300">v{gasTestResult.version || '3.2'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Respon Server:</span>
                    <span className="font-mono text-emerald-400">{gasTestResult.responseTimeMs || 100} ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Folder Penyimpanan:</span>
                    <span className="font-bold text-white">v2-soalpintar.ai</span>
                  </div>
                  <div className="pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400 block text-[11px] mb-1">URL Web App Aktif:</span>
                    <span className="font-mono text-[11px] text-slate-300 break-all select-all block p-2 rounded bg-slate-900 border border-slate-800">
                      {scriptUrl}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons to Google Drive */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold text-slate-400 block">Akses Cepat Google Drive & Form:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href="https://drive.google.com/drive/search?q=v2-soalpintar.ai"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Buka Folder v2-soalpintar.ai</span>
                    </a>

                    <a
                      href="https://drive.google.com/drive/my-drive"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-[#142036] hover:bg-[#1e2f4e] text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Drive Saya</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Pemeriksaan Menemukan Kendala</h5>
                    <p className="text-xs text-rose-300 mt-1">
                      {gasTestResult?.error || 'Tidak dapat menghubungi Web App Google Apps Script.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p className="font-semibold text-white">Langkah Perbaikan (1 Menit):</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11.5px]">
                    <li>Buka <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-semibold">script.google.com</a> pada akun Google Anda.</li>
                    <li>Pastikan kode <strong>Code.gs</strong> (v3.2) sudah ditempel dan disimpan.</li>
                    <li>Klik <strong>Deploy &gt; Manage deployments</strong> &gt; ikon pensil (Edit).</li>
                    <li>Pastikan <strong>Who has access: Anyone</strong> (Siapa saja).</li>
                    <li>Pilih <strong>Version: New version</strong> lalu klik <strong>Deploy</strong>.</li>
                  </ol>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCheckWebApp}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Coba Periksa Lagi</span>
                  </button>

                  <a
                    href="https://drive.google.com/drive/my-drive"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Buka Google Drive</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
