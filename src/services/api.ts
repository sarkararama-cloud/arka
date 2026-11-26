import {isSupabaseConfigured, supabase} from '../lib/supabase';
import type {
  EmployeeAttendanceRecord,
  EmployeeAttendanceStatus,
  JurusanCode,
  Student,
  StudentAttendanceRecord,
  StudentAttendanceStatus,
  UserProfile,
  UserRole,
} from '../types';

const LOCAL_TOKEN_KEY = 'smk_prima_local_token';

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeStr(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (isSupabaseConfigured && supabase) {
    const {data} = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? {Authorization: `Bearer ${token}`} : {};
  }
  const token = localStorage.getItem(LOCAL_TOKEN_KEY);
  return token ? {Authorization: `Bearer ${token}`} : {};
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Terjadi kesalahan pada server');
  }
  return data as T;
}

export const api = {
  async getBackendStatus(): Promise<{
    supabaseClientReady: boolean;
    supabaseAdminReady: boolean;
  }> {
    return fetchJson('/api/health');
  },

  async getSchemaSql(): Promise<string> {
    const res = await fetch('/api/schema-sql');
    return res.text();
  },

  async verifySupabaseSchema(): Promise<{
    configured: boolean;
    allTablesReady?: boolean;
    message?: string;
    tables: Array<{
      table: string;
      ready: boolean;
      rowCount: number;
      error: string | null;
    }>;
  }> {
    return fetchJson('/api/supabase/verify');
  },

  // -------------------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------------------
  async getCurrentSessionProfile(): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      const {data: sessionData} = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return null;
      const {data: profile, error} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error || !profile) return null;
      return profile as UserProfile;
    }

    const token = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (!token) return null;
    try {
      const {user} = await fetchJson<{user: UserProfile}>('/api/local/me');
      return user;
    } catch {
      localStorage.removeItem(LOCAL_TOKEN_KEY);
      return null;
    }
  },

  async login(email: string, password: string): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const {data, error} = await supabase.auth.signInWithPassword({email, password});
      if (error || !data.user) {
        throw new Error(error?.message || 'Gagal masuk ke akun Supabase');
      }
      const {data: profile, error: profErr} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profErr || !profile) {
        throw new Error('Profil pengguna tidak ditemukan di tabel profiles.');
      }
      return profile as UserProfile;
    }

    const {token, user} = await fetchJson<{token: string; user: UserProfile}>(
      '/api/local/login',
      {
        method: 'POST',
        body: JSON.stringify({email, password}),
      }
    );
    localStorage.setItem(LOCAL_TOKEN_KEY, token);
    return user;
  },

  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    nip?: string;
    unit_kerja?: string;
  }): Promise<{user: UserProfile | null; needsEmailConfirmation?: boolean}> {
    if (isSupabaseConfigured && supabase) {
      const {data, error} = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            full_name: payload.full_name,
            nip: payload.nip || null,
            unit_kerja: payload.unit_kerja || null,
          },
        },
      });
      if (error) throw new Error(error.message);
      if (!data.session) {
        return {user: null, needsEmailConfirmation: true};
      }
      if (data.user) {
        const {data: profile} = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        return {user: (profile as UserProfile) || null};
      }
      return {user: null};
    }

    const {token, user} = await fetchJson<{token: string; user: UserProfile}>(
      '/api/local/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    localStorage.setItem(LOCAL_TOKEN_KEY, token);
    return {user};
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      return;
    }
    try {
      await fetchJson('/api/local/logout', {method: 'POST'});
    } finally {
      localStorage.removeItem(LOCAL_TOKEN_KEY);
    }
  },

  // -------------------------------------------------------------------------
  // USER MANAGEMENT (ADMIN ONLY — SYNC & HARD DELETE TO SUPABASE AUTH)
  // -------------------------------------------------------------------------
  async getUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured) {
      const {users} = await fetchJson<{users: UserProfile[]}>('/api/admin/users');
      return users;
    }
    const {users} = await fetchJson<{users: UserProfile[]}>('/api/local/users');
    return users;
  },

  async createUser(payload: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    nip?: string;
    unit_kerja?: string;
  }): Promise<UserProfile> {
    const endpoint = isSupabaseConfigured ? '/api/admin/users' : '/api/local/users';
    const {user} = await fetchJson<{user: UserProfile}>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return user;
  },

  async updateUser(
    id: string,
    payload: {
      email?: string;
      password?: string;
      full_name?: string;
      role?: UserRole;
      nip?: string | null;
      unit_kerja?: string | null;
    }
  ): Promise<UserProfile> {
    const endpoint = isSupabaseConfigured
      ? `/api/admin/users/${id}`
      : `/api/local/users/${id}`;
    const {user} = await fetchJson<{user: UserProfile}>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return user;
  },

  async hardDeleteUser(id: string): Promise<void> {
    const endpoint = isSupabaseConfigured
      ? `/api/admin/users/${id}`
      : `/api/local/users/${id}`;
    await fetchJson(endpoint, {method: 'DELETE'});
  },

  // -------------------------------------------------------------------------
  // DATA SISWA (ADMIN CRUD, GURU READ)
  // -------------------------------------------------------------------------
  async getStudents(): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      const {data, error} = await supabase
        .from('students')
        .select('*')
        .order('kelas', {ascending: true})
        .order('name', {ascending: true});
      if (error) throw new Error(error.message);
      return (data || []) as Student[];
    }
    const {students} = await fetchJson<{students: Student[]}>('/api/local/students');
    return students;
  },

  async createStudent(payload: {
    nis: string;
    name: string;
    kelas: string;
    jurusan: JurusanCode;
  }): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      const {data, error} = await supabase
        .from('students')
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Student;
    }
    const {student} = await fetchJson<{student: Student}>('/api/local/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return student;
  },

  async updateStudent(
    id: string,
    payload: Partial<{nis: string; name: string; kelas: string; jurusan: JurusanCode}>
  ): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      const {data, error} = await supabase
        .from('students')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Student;
    }
    const {student} = await fetchJson<{student: Student}>(`/api/local/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return student;
  },

  async deleteStudent(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const {error} = await supabase.from('students').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    await fetchJson(`/api/local/students/${id}`, {method: 'DELETE'});
  },

  // -------------------------------------------------------------------------
  // ABSENSI KARYAWAN (SELF CHECK-IN/OUT & REKAP ADMIN)
  // -------------------------------------------------------------------------
  async getEmployeeAttendance(scope: 'self' | 'all' = 'self'): Promise<EmployeeAttendanceRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const {data: sessionData} = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      let query = supabase
        .from('employee_attendance')
        .select('*, profile:profiles(full_name, email, nip, role, unit_kerja)')
        .order('date', {ascending: false});

      if (scope === 'self' && userId) {
        query = query.eq('user_id', userId);
      }

      const {data, error} = await query;
      if (error) throw new Error(error.message);
      return (data || []) as EmployeeAttendanceRecord[];
    }

    const {records} = await fetchJson<{records: EmployeeAttendanceRecord[]}>(
      `/api/local/employee-attendance?scope=${scope}`
    );
    return records;
  },

  async upsertSelfEmployeeAttendance(payload: {
    userId: string;
    date: string;
    check_in_time?: string | null;
    check_out_time?: string | null;
    status: EmployeeAttendanceStatus;
    notes?: string | null;
  }): Promise<EmployeeAttendanceRecord> {
    if (isSupabaseConfigured && supabase) {
      const {data, error} = await supabase
        .from('employee_attendance')
        .upsert(
          {
            user_id: payload.userId,
            date: payload.date,
            check_in_time: payload.check_in_time ?? null,
            check_out_time: payload.check_out_time ?? null,
            status: payload.status,
            notes: payload.notes ?? null,
          },
          {onConflict: 'user_id,date'}
        )
        .select('*, profile:profiles(full_name, email, nip, role, unit_kerja)')
        .single();
      if (error) throw new Error(error.message);
      return data as EmployeeAttendanceRecord;
    }

    const {record} = await fetchJson<{record: EmployeeAttendanceRecord}>(
      '/api/local/employee-attendance',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return record;
  },

  // -------------------------------------------------------------------------
  // ABSENSI SISWA (GURU & ADMIN)
  // -------------------------------------------------------------------------
  async getStudentAttendance(dateFilter?: string): Promise<StudentAttendanceRecord[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('student_attendance')
        .select('*, student:students(*), recorder:profiles(full_name)')
        .order('date', {ascending: false});
      if (dateFilter) {
        query = query.eq('date', dateFilter);
      }
      const {data, error} = await query;
      if (error) throw new Error(error.message);
      return (data || []) as StudentAttendanceRecord[];
    }

    const qs = dateFilter ? `?date=${encodeURIComponent(dateFilter)}` : '';
    const {records} = await fetchJson<{records: StudentAttendanceRecord[]}>(
      `/api/local/student-attendance${qs}`
    );
    return records;
  },

  async saveStudentAttendanceBatch(
    recordedBy: string,
    entries: Array<{
      student_id: string;
      date: string;
      status: StudentAttendanceStatus;
      notes?: string;
    }>
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const rows = entries.map((e) => ({
        student_id: e.student_id,
        recorded_by: recordedBy,
        date: e.date,
        status: e.status,
        notes: e.notes || null,
      }));
      const {error} = await supabase
        .from('student_attendance')
        .upsert(rows, {onConflict: 'student_id,date'});
      if (error) throw new Error(error.message);
      return;
    }

    await fetchJson('/api/local/student-attendance', {
      method: 'POST',
      body: JSON.stringify({entries}),
    });
  },
};
