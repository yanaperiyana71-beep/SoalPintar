import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QuestionItem {
  number: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  cognitiveLevel: string;
  explanation: string;
}

function generateFallbackQuestions(
  topic: string,
  gradeLevel: string,
  questionType: string,
  cognitiveLevel: string,
  optionsCount: number,
  indicator: string,
  count: number
): QuestionItem[] {
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, Math.min(5, Math.max(2, optionsCount)));
  const bloomLevels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
  const results: QuestionItem[] = [];

  const safeTopic = topic.trim() || 'Kerucut';

  for (let i = 1; i <= count; i++) {
    const cLevel = cognitiveLevel.includes('HOTS') 
      ? ['C4', 'C5', 'C6'][i % 3] 
      : cognitiveLevel.includes('MOTS') 
      ? 'C3' 
      : cognitiveLevel.includes('LOTS') 
      ? ['C1', 'C2'][i % 2] 
      : bloomLevels[(i - 1) % bloomLevels.length];

    let questionText = '';
    let explanationText = '';
    let correctKey = letters[(i - 1) % letters.length];
    let options: { key: string; text: string }[] = [];

    if (safeTopic.toLowerCase().includes('kerucut') || safeTopic.toLowerCase().includes('tabung') || safeTopic.toLowerCase().includes('bangun')) {
      if (i % 3 === 1) {
        questionText = `Sebuah kerucut memiliki jari-jari alas 7 cm dan garis pelukis 25 cm. Berapakah luas selimut kerucut tersebut? (Gunakan π = 22/7)`;
        explanationText = `Rumus luas selimut kerucut adalah L = π × r × s. L = (22/7) × 7 × 25 = 550 cm².`;
        const answers = ['550 cm²', '525 cm²', '600 cm²', '350 cm²', '480 cm²'];
        options = letters.map((k, idx) => ({ key: k, text: answers[idx] || `${500 + idx * 25} cm²` }));
        correctKey = 'A';
      } else if (i % 3 === 2) {
        questionText = `Jika tinggi sebuah kerucut adalah 12 cm dan jari-jari alasnya 5 cm, maka panjang garis pelukis (s) kerucut adalah...`;
        explanationText = `Menggunakan teorema Pythagoras: s² = r² + t² = 5² + 12² = 25 + 144 = 169. Jadi s = √169 = 13 cm.`;
        const answers = ['13 cm', '15 cm', '17 cm', '10 cm', '14 cm'];
        options = letters.map((k, idx) => ({ key: k, text: answers[idx] || `${12 + idx} cm` }));
        correctKey = 'A';
      } else {
        questionText = `Volume sebuah kerucut dengan jari-jari alas 6 cm dan tinggi 14 cm adalah... (π = 22/7)`;
        explanationText = `Rumus volume kerucut adalah V = (1/3) × π × r² × t = (1/3) × (22/7) × 36 × 14 = 528 cm³.`;
        const answers = ['528 cm³', '512 cm³', '616 cm³', '480 cm³', '540 cm³'];
        options = letters.map((k, idx) => ({ key: k, text: answers[idx] || `${500 + idx * 20} cm³` }));
        correctKey = 'A';
      }
    } else {
      questionText = `Terkait materi "${safeTopic}" untuk jenjang ${gradeLevel}: manakah pernyataan berikut yang paling tepat sesuai indikator capaian pembelajaran?`;
      if (indicator) {
        questionText += ` [Fokus Indikator: ${indicator}]`;
      }
      explanationText = `Berdasarkan konsep utama pada topik ${safeTopic}, pernyataan pada opsi ini merupakan prinsip esensial yang sesuai dengan capaian kurikulum tingkat ${gradeLevel}.`;
      options = letters.map((k, idx) => ({
        key: k,
        text: idx === 0 
          ? `Prinsip fundamental dan aplikasi relevan dari ${safeTopic} yang terbukti akurat dalam analisis kasus.`
          : `Konsep sekunder ${idx} yang hanya berlaku pada kondisi khusus atau batas tertentu pada ${safeTopic}.`,
      }));
      correctKey = 'A';
    }

    results.push({
      number: i,
      question: questionText,
      options,
      correctAnswer: correctKey,
      cognitiveLevel: cLevel,
      explanation: explanationText,
    });
  }

  return results;
}

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini if key exists
  const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Endpoint to generate quiz questions using Gemini
  app.post('/api/generate-questions', async (req, res) => {
    try {
      const {
        topic = 'Kerucut',
        gradeLevel = 'SMP Kelas 9',
        questionType = 'Pilihan Ganda',
        cognitiveLevel = 'Campuran C1-C6',
        optionsCount = 4,
        indicator = '',
        referenceText = '',
        count = 10,
      } = req.body;

      if (!ai) {
        return res.status(200).json({
          success: true,
          source: 'local_generator',
          questions: generateFallbackQuestions(topic, gradeLevel, questionType, cognitiveLevel, optionsCount, indicator, count),
        });
      }

      const prompt = `Anda adalah asisten AI ahli kurikulum pendidikan Indonesia (Kurikulum Merdeka dan K13) untuk platform guru "soalpintar.ai".
Buatlah ${count} butir soal ${questionType} dalam bahasa Indonesia yang sangat berkualitas, mendidik, dan sesuai standar evaluasi sekolah.

Spesifikasi:
- Topik / Materi: "${topic}"
- Jenjang & Kelas: "${gradeLevel}"
- Tingkat Kognitif (Taksonomi Bloom): "${cognitiveLevel}"
- Jumlah Opsi Jawaban per Soal: ${optionsCount} (Opsi huruf: ${['A', 'B', 'C', 'D', 'E'].slice(0, optionsCount).join(', ')})
${indicator ? `- Indikator Pembelajaran Khusus: "${indicator}"` : ''}
${referenceText ? `- Materi Referensi: "${referenceText.slice(0, 4000)}"` : ''}

Ketentuan Khusus:
1. Soal harus edukatif, tidak ada bias, menggunakan bahasa Indonesia yang baik dan benar (EYD).
2. Opsi jawaban harus masuk akal (distraktor yang baik).
3. Tandai correctAnswer dengan huruf opsi (misal "A", "B", "C", dst).
4. Berikan tingkat kognitif untuk tiap soal (misal C1, C2, C3, C4, C5, atau C6) dan pembahasan (explanation).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Daftar butir soal yang di-generate',
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.INTEGER },
                question: { type: Type.STRING, description: 'Teks pertanyaan lengkap' },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING, description: 'A, B, C, D, atau E' },
                      text: { type: Type.STRING, description: 'Isi teks opsi jawaban' },
                    },
                    required: ['key', 'text'],
                  },
                },
                correctAnswer: { type: Type.STRING, description: 'Kunci jawaban yang benar (misal A)' },
                cognitiveLevel: { type: Type.STRING, description: 'Contoh: C2, C3, C4' },
                explanation: { type: Type.STRING, description: 'Pembahasan ringkas dan jelas' },
              },
              required: ['number', 'question', 'options', 'correctAnswer', 'cognitiveLevel', 'explanation'],
            },
          },
        },
      });

      const questions = JSON.parse(response.text ?? '[]');
      return res.status(200).json({
        success: true,
        source: 'gemini-3.8-flash',
        questions,
      });
    } catch (error: any) {
      console.error('Error generating questions with Gemini:', error);
      const {
        topic = 'Kerucut',
        gradeLevel = 'SMP Kelas 9',
        questionType = 'Pilihan Ganda',
        cognitiveLevel = 'Campuran C1-C6',
        optionsCount = 4,
        indicator = '',
        count = 10,
      } = req.body || {};

      return res.status(200).json({
        success: true,
        source: 'local_generator_fallback',
        errorDetails: error?.message,
        questions: generateFallbackQuestions(topic, gradeLevel, questionType, cognitiveLevel, optionsCount, indicator, count),
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      app: 'soalpintar.ai',
    });
  });

  // Vite in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`soalpintar.ai server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
