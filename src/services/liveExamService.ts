export interface LiveStudentData {
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

const STORAGE_KEY = 'soalpintar_pantau_students';
const CHANNEL_NAME = 'soalpintar_live_channel';

class LiveExamService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(students: LiveStudentData[]) => void> = new Set();
  private cache: LiveStudentData[] = [];

  constructor() {
    this.cache = this.loadFromStorage();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'STUDENTS_UPDATED' && Array.isArray(event.data.students)) {
            this.cache = this.cleanDummyRecords(event.data.students);
            this.saveToStorage(this.cache);
            this.notifyListeners();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or error:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.cache = this.loadFromStorage();
          this.notifyListeners();
        }
      });

      window.addEventListener('soalpintar_pantau_updated', () => {
        this.cache = this.loadFromStorage();
        this.notifyListeners();
      });
    }

    // Initial background sync with server
    this.syncFromServer();
  }

  private cleanDummyRecords(list: any[]): LiveStudentData[] {
    if (!Array.isArray(list)) return [];
    return list.filter(
      (s) =>
        s &&
        s.id !== 'std-unknown-1' &&
        s.id !== 'std-yan-1' &&
        s.name !== 'Belum mengisi nama' &&
        s.name?.trim().length > 0
    );
  }

  private loadFromStorage(): LiveStudentData[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.cleanDummyRecords(parsed);
      }
    } catch (e) {
      console.warn('Failed to load live students from storage:', e);
    }
    return [];
  }

  private saveToStorage(students: LiveStudentData[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      window.dispatchEvent(new Event('soalpintar_pantau_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Failed to save live students to storage:', e);
    }
  }

  private broadcast(students: LiveStudentData[]) {
    try {
      this.channel?.postMessage({ type: 'STUDENTS_UPDATED', students });
    } catch {
      // ignore
    }
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.cache);
      } catch (e) {
        console.error('Error notifying student listener:', e);
      }
    }
  }

  public getStudents(): LiveStudentData[] {
    return [...this.cache];
  }

  public subscribe(callback: (students: LiveStudentData[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.cache]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public async syncFromServer(): Promise<LiveStudentData[]> {
    try {
      const res = await fetch('/api/live-students');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.students)) {
          const serverClean = this.cleanDummyRecords(data.students);
          // If server has records, or if local is empty, use server
          if (serverClean.length > 0 || this.cache.length === 0) {
            this.cache = serverClean;
            this.saveToStorage(serverClean);
            this.notifyListeners();
          } else if (this.cache.length > 0 && serverClean.length === 0) {
            // Push local cache to server
            for (const stu of this.cache) {
              await fetch('/api/live-students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stu),
              }).catch(() => {});
            }
          }
        }
      }
    } catch {
      // Offline or network error - use local cache
    }
    return [...this.cache];
  }

  public async registerStudent(params: {
    name: string;
    studentClass?: string;
    studentAbsen?: string;
    token?: string;
    quiz?: string;
  }): Promise<LiveStudentData> {
    const cleanName = params.name.trim();
    const rawClass = params.studentClass?.trim() || '9B';
    const rawAbsen = params.studentAbsen?.trim() || '1';
    const classInfo = `${rawClass} · absen ${rawAbsen}`;

    const newStudent: LiveStudentData = {
      id: `std-${Date.now()}`,
      name: cleanName,
      classGroup: rawClass,
      absen: rawAbsen,
      classInfo,
      status: 'Mengerjakan',
      violationsCount: 0,
      lastCause: '—',
      lastSeen: 'Baru saja',
      token: params.token || 'ZJT0P4M',
      quiz: params.quiz || 'IPA',
      joinedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    // Update local cache
    this.cache = [newStudent, ...this.cache.filter((s) => s.name.toLowerCase() !== cleanName.toLowerCase())];
    this.saveToStorage(this.cache);
    this.broadcast(this.cache);
    this.notifyListeners();

    // Send to backend server
    try {
      const res = await fetch('/api/live-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.students)) {
          this.cache = this.cleanDummyRecords(data.students);
          this.saveToStorage(this.cache);
          this.notifyListeners();
        }
      }
    } catch (e) {
      console.warn('Network error registering student to backend:', e);
    }

    return newStudent;
  }

  public async recordViolation(studentName: string, reason: string, limit: number = 1): Promise<void> {
    const cleanName = studentName.trim();
    this.cache = this.cache.map((s) => {
      if (s.name.toLowerCase() === cleanName.toLowerCase()) {
        const nextCount = s.violationsCount + 1;
        const isBlocked = nextCount >= limit;
        return {
          ...s,
          violationsCount: nextCount,
          status: isBlocked ? 'Diblokir' : 'Terdeteksi Melanggar',
          lastCause: reason,
          lastSeen: 'Baru saja',
        };
      }
      return s;
    });

    this.saveToStorage(this.cache);
    this.broadcast(this.cache);
    this.notifyListeners();

    try {
      await fetch('/api/live-students/violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: cleanName, reason, limit }),
      });
    } catch {
      // ignore
    }
  }

  public async finishExam(studentName: string): Promise<void> {
    const cleanName = studentName.trim();
    this.cache = this.cache.map((s) => {
      if (s.name.toLowerCase() === cleanName.toLowerCase()) {
        return {
          ...s,
          status: 'Selesai',
          lastSeen: 'Baru saja',
        };
      }
      return s;
    });

    this.saveToStorage(this.cache);
    this.broadcast(this.cache);
    this.notifyListeners();

    try {
      await fetch('/api/live-students/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: cleanName }),
      });
    } catch {
      // ignore
    }
  }

  public async allowRetry(studentId: string): Promise<void> {
    this.cache = this.cache.map((s) => {
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

    this.saveToStorage(this.cache);
    this.broadcast(this.cache);
    this.notifyListeners();

    try {
      await fetch('/api/live-students/allow-retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
    } catch {
      // ignore
    }
  }

  public async deleteStudent(studentId: string): Promise<void> {
    this.cache = this.cache.filter((s) => s.id !== studentId);
    this.saveToStorage(this.cache);
    this.broadcast(this.cache);
    this.notifyListeners();

    try {
      await fetch('/api/live-students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
    } catch {
      // ignore
    }
  }

  public async clearAll(): Promise<void> {
    this.cache = [];
    this.saveToStorage([]);
    this.broadcast([]);
    this.notifyListeners();

    try {
      await fetch('/api/live-students/clear', {
        method: 'POST',
      });
    } catch {
      // ignore
    }
  }
}

export const liveExamService = new LiveExamService();
