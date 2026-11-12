import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize server-side Gemini client per skill instructions
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Server-side endpoint for Gemini generation
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { prompt, contents, model, config } = req.body;
      const targetPrompt = prompt || contents;

      if (!targetPrompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Automatically route to the active modern flash model (gemini-3.8-flash)
      const selectedModel = (!model || model === 'gemini-2.5-flash' || model.includes('1.5') || model.includes('2.0'))
        ? 'gemini-3.8-flash'
        : model;

      // Clean config per gemini-api skill (do not pass deprecated temperature, topP, topK to gemini-3.8-flash)
      const sanitizedConfig: Record<string, unknown> = config ? { ...config } : {};
      delete sanitizedConfig.temperature;
      delete sanitizedConfig.topP;
      delete sanitizedConfig.topK;
      delete sanitizedConfig.candidateCount;

      let response;
      try {
        const responsePromise = ai.models.generateContent({
          model: selectedModel,
          contents: targetPrompt,
          config: Object.keys(sanitizedConfig).length > 0 ? sanitizedConfig : undefined,
        });

        // Generous 60s timeout for complete complex multi-question curriculum generation
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API request timed out after 60s')), 60000)
        );

        response = await Promise.race([responsePromise, timeoutPromise]);
      } catch (firstErr: unknown) {
        const errMsg = firstErr instanceof Error ? firstErr.message : '';
        // If 503 high demand or temporary spike on primary model, seamless fallback to gemini-3.1-flash-lite
        if (selectedModel !== 'gemini-3.1-flash-lite' && (errMsg.includes('503') || errMsg.includes('demand') || errMsg.includes('UNAVAILABLE'))) {
          console.warn('Primary model busy, smoothly routing to gemini-3.1-flash-lite');
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: targetPrompt,
            config: Object.keys(sanitizedConfig).length > 0 ? sanitizedConfig : undefined,
          });
        } else {
          throw firstErr;
        }
      }

      return res.json({ text: response.text });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Gemini error';
      console.warn('Gemini API notice:', errorMessage);
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Comprehensive endpoint to clear all database and server state
  app.post('/api/database/clear-all', (_req, res) => {
    serverLiveStudents = [];
    console.log('All server database records have been cleared.');
    res.json({ success: true, message: 'All server database records cleared successfully' });
  });

  // Endpoint proxy to create real Google Form in Google Drive via user's Google Apps Script
  app.post('/api/create-google-form', async (req, res) => {
    try {
      const {
        scriptUrl,
        title,
        guru_name,
        quiz_id,
        folder_name,
        questions,
        shuffle_questions,
        shuffle_options
      } = req.body;

      const targetScriptUrl =
        (scriptUrl && typeof scriptUrl === 'string' && scriptUrl.trim().length > 10)
          ? scriptUrl.trim()
          : 'https://script.google.com/macros/s/AKfycbwt6SSJ8sxrZ8J01mMmX8aU3DGiNgMPJ4xo3OqLWblv8-YT9J9RN0vrFV3TL5utWoNS/exec';

      const payload = {
        title: title || 'Kuis SoalPintar.ai',
        guru_name: guru_name || 'Guru SoalPintar',
        quiz_id: quiz_id || `SPT-${Date.now()}`,
        folder_name: folder_name || 'v2-soalpintar.ai',
        questions: Array.isArray(questions) ? questions : [],
        shuffle_questions: Boolean(shuffle_questions),
        shuffle_options: Boolean(shuffle_options),
      };

      const response = await fetch(targetScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { status: 'unknown', raw: responseText };
      }

      if (responseData && responseData.status === 'success') {
        return res.json({
          success: true,
          form_url: responseData.form_url,
          edit_url: responseData.edit_url,
          form_id: responseData.form_id,
          folder: responseData.folder,
          total_points: responseData.total_points,
          shuffle: responseData.shuffle,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: responseData?.message || 'Google Apps Script mengembalikan status gagal.',
          details: responseData,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi Google Apps Script';
      console.error('Error creating Google Form via Apps Script:', msg);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // Endpoint to test connection between server, Google Apps Script Web App, and Google Drive
  app.post('/api/test-gas', async (req, res) => {
    try {
      const { scriptUrl } = req.body;
      const targetScriptUrl =
        (scriptUrl && typeof scriptUrl === 'string' && scriptUrl.trim().length > 10)
          ? scriptUrl.trim()
          : 'https://script.google.com/macros/s/AKfycbwt6SSJ8sxrZ8J01mMmX8aU3DGiNgMPJ4xo3OqLWblv8-YT9J9RN0vrFV3TL5utWoNS/exec';

      const startTime = Date.now();
      const response = await fetch(targetScriptUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      const responseTimeMs = Date.now() - startTime;
      const responseText = await response.text();

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = null;
      }

      if (parsed && (parsed.status === 'ok' || parsed.status === 'success' || parsed.version)) {
        return res.json({
          success: true,
          status: 'connected',
          version: parsed.version || '3.2',
          message: parsed.message || 'Google Apps Script Web App aktif dan terhubung ke Google Drive.',
          responseTimeMs,
          folder: 'v2-soalpintar.ai',
          driveUrl: 'https://drive.google.com/drive/my-drive',
          driveFolderUrl: 'https://drive.google.com/drive/search?q=v2-soalpintar.ai',
        });
      } else {
        // If Google Apps Script returned an HTML error (e.g. Google login prompt or permission required)
        const isGoogleLogin = responseText.includes('accounts.google.com') || responseText.includes('ServiceLogin');
        const isScriptError = responseText.includes('ScriptError') || responseText.includes('Authorization is required');

        let errorMsg = 'Web App merespons tapi tidak mengirimkan format JSON yang valid.';
        if (isGoogleLogin) {
          errorMsg = 'Web App meminta login Google. Pastikan saat deploy diatur "Who has access: Anyone" (Siapa saja).';
        } else if (isScriptError) {
          errorMsg = 'Google Apps Script membutuhkan otorisasi izin Drive/Forms. Buka editor dan klik Jalankan / izinkan akses.';
        }

        return res.status(400).json({
          success: false,
          error: errorMsg,
          rawResponse: responseText.slice(0, 300),
          driveUrl: 'https://drive.google.com/drive/my-drive',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi Google Apps Script';
      return res.status(500).json({
        success: false,
        error: msg,
        driveUrl: 'https://drive.google.com/drive/my-drive',
      });
    }
  });

  // In-memory store for real-time exam participants
  interface ServerLiveStudent {
    id: string;
    name: string;
    classGroup?: string;
    absen?: string;
    classInfo: string;
    status: 'Mengerjakan' | 'Diblokir' | 'Terputus' | 'Selesai' | 'Terdeteksi Melanggar';
    violationsCount: number;
    lastCause: string;
    lastSeen: string;
    token?: string;
    quiz?: string;
    joinedAt?: string;
  }

  let serverLiveStudents: ServerLiveStudent[] = [];

  // 1. GET all live exam students
  app.get('/api/live-students', (_req, res) => {
    res.json({ success: true, students: serverLiveStudents });
  });

  // 2. POST register/update live exam student from Portal Web Siswa
  app.post('/api/live-students', (req, res) => {
    try {
      const student: ServerLiveStudent = req.body;
      if (!student || !student.name) {
        return res.status(400).json({ success: false, error: 'Student name is required' });
      }

      // Filter out any legacy dummy records
      serverLiveStudents = serverLiveStudents.filter(
        (s) => s.id !== 'std-unknown-1' && s.id !== 'std-yan-1' && s.name !== 'Belum mengisi nama'
      );

      const cleanName = student.name.trim();
      const existingIdx = serverLiveStudents.findIndex(
        (s) => s.name.toLowerCase() === cleanName.toLowerCase()
      );

      const entry: ServerLiveStudent = {
        id: student.id || `std-${Date.now()}`,
        name: cleanName,
        classGroup: student.classGroup || '',
        absen: student.absen || '',
        classInfo: student.classInfo || `${student.classGroup || '9B'} · absen ${student.absen || '1'}`,
        status: student.status || 'Mengerjakan',
        violationsCount: student.violationsCount || 0,
        lastCause: student.lastCause || '—',
        lastSeen: 'Baru saja',
        token: student.token || 'ZJT0P4M',
        quiz: student.quiz || 'IPA',
        joinedAt: student.joinedAt || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      if (existingIdx >= 0) {
        serverLiveStudents[existingIdx] = { ...serverLiveStudents[existingIdx], ...entry };
      } else {
        serverLiveStudents.unshift(entry);
      }

      res.json({ success: true, students: serverLiveStudents });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error registering student';
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 3. POST record violation
  app.post('/api/live-students/violation', (req, res) => {
    try {
      const { studentName, reason, limit } = req.body;
      if (!studentName) {
        return res.status(400).json({ success: false, error: 'studentName required' });
      }

      const limitVal = Number(limit) || 1;
      serverLiveStudents = serverLiveStudents.map((s) => {
        if (s.name.toLowerCase() === String(studentName).trim().toLowerCase()) {
          const nextCount = s.violationsCount + 1;
          const isBlocked = nextCount >= limitVal;
          return {
            ...s,
            violationsCount: nextCount,
            status: isBlocked ? 'Diblokir' : 'Terdeteksi Melanggar',
            lastCause: reason || 'Pindah Tab / Keluar Layar',
            lastSeen: 'Baru saja',
          };
        }
        return s;
      });

      res.json({ success: true, students: serverLiveStudents });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error updating violation';
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 4. POST finish exam
  app.post('/api/live-students/finish', (req, res) => {
    try {
      const { studentName } = req.body;
      if (!studentName) {
        return res.status(400).json({ success: false, error: 'studentName required' });
      }

      serverLiveStudents = serverLiveStudents.map((s) => {
        if (s.name.toLowerCase() === String(studentName).trim().toLowerCase()) {
          return {
            ...s,
            status: 'Selesai',
            lastSeen: 'Baru saja',
          };
        }
        return s;
      });

      res.json({ success: true, students: serverLiveStudents });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error finishing exam';
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 5. POST allow retry (Izinkan ulang)
  app.post('/api/live-students/allow-retry', (req, res) => {
    try {
      const { studentId } = req.body;
      serverLiveStudents = serverLiveStudents.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            violationsCount: 0,
            status: 'Mengerjakan',
            lastCause: 'Diizinkan ulang oleh guru',
            lastSeen: 'Baru saja',
          };
        }
        return s;
      });

      res.json({ success: true, students: serverLiveStudents });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error allowing retry';
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 6. POST delete specific student
  app.post('/api/live-students/delete', (req, res) => {
    try {
      const { studentId } = req.body;
      serverLiveStudents = serverLiveStudents.filter((s) => s.id !== studentId);
      res.json({ success: true, students: serverLiveStudents });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error deleting student';
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 7. POST clear all simulation / live data
  app.post('/api/live-students/clear', (_req, res) => {
    serverLiveStudents = [];
    res.json({ success: true, students: [] });
  });

  // Health and status endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      gasUrl: 'https://script.google.com/macros/s/AKfycbwt6SSJ8sxrZ8J01mMmX8aU3DGiNgMPJ4xo3OqLWblv8-YT9J9RN0vrFV3TL5utWoNS/exec',
      timestamp: new Date().toISOString(),
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
