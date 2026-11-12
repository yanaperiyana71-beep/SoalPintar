export interface QuestionForGoogleForm {
  number: number;
  question: string;
  options: string[];
  answer: number; // 0 for A, 1 for B, 2 for C, 3 for D
  type?: 'multiple_choice' | 'essay';
  explanation?: string;
}

export interface CreateGoogleFormPayload {
  title: string;
  quizId?: string;
  guruName?: string;
  folderName?: string;
  questions: QuestionForGoogleForm[];
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  scriptUrl?: string;
}

export interface CreateGoogleFormResult {
  success: boolean;
  form_url?: string;
  edit_url?: string;
  form_id?: string;
  folder?: string;
  error?: string;
  total_points?: number;
}

const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbwt6SSJ8sxrZ8J01mMmX8aU3DGiNgMPJ4xo3OqLWblv8-YT9J9RN0vrFV3TL5utWoNS/exec';

/**
 * Creates a real Google Form inside the user's Google Drive via Google Apps Script Web App
 */
export async function createRealGoogleForm(payload: CreateGoogleFormPayload): Promise<CreateGoogleFormResult> {
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('soalpintar_gas_url') : null;
  const scriptUrl = payload.scriptUrl || (storedUrl && storedUrl.includes('/exec') ? storedUrl : DEFAULT_GAS_URL);

  try {
    const response = await fetch('/api/create-google-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scriptUrl,
        title: payload.title,
        quiz_id: payload.quizId,
        guru_name: payload.guruName || 'Guru SoalPintar',
        folder_name: payload.folderName || 'v2-soalpintar.ai',
        questions: payload.questions,
        shuffle_questions: Boolean(payload.shuffleQuestions),
        shuffle_options: Boolean(payload.shuffleOptions),
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.error || `Gagal menghubungi server (${response.status})`);
    }

    const data: CreateGoogleFormResult = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Error creating real Google Form:', error);
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat Google Form';
    return {
      success: false,
      error: msg,
    };
  }
}

export interface GasTestResult {
  success: boolean;
  status?: string;
  version?: string;
  message?: string;
  responseTimeMs?: number;
  folder?: string;
  driveUrl?: string;
  driveFolderUrl?: string;
  error?: string;
}

export async function testGoogleAppsScriptConnection(scriptUrl?: string): Promise<GasTestResult> {
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('soalpintar_gas_url') : null;
  const targetUrl = scriptUrl || (storedUrl && storedUrl.includes('/exec') ? storedUrl : DEFAULT_GAS_URL);

  try {
    const response = await fetch('/api/test-gas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scriptUrl: targetUrl,
      }),
    });

    const data: GasTestResult = await response.json();
    return data;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghubungi server';
    return {
      success: false,
      error: msg,
      driveUrl: 'https://drive.google.com/drive/my-drive',
    };
  }
}

