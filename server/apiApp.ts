import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {createClient} from '@supabase/supabase-js';

dotenv.config();

const rawSupabaseUrl = (process.env.SUPABASE_URL || '').trim();
const rawViteSupabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const SUPABASE_URL =
  isValidHttpUrl(rawSupabaseUrl) && !rawSupabaseUrl.includes('your-project.supabase.co')
    ? rawSupabaseUrl
    : rawViteSupabaseUrl;
const SUPABASE_ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const isSupabaseClientReady = Boolean(
  isValidHttpUrl(SUPABASE_URL) &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-project.supabase.co') &&
    !SUPABASE_ANON_KEY.includes('your-supabase-anon-key') &&
    !SUPABASE_URL.startsWith('__AISTUDIO_SECRET_')
);

export const isSupabaseAdminReady = Boolean(
  isSupabaseClientReady &&
    SUPABASE_SERVICE_ROLE_KEY &&
    !SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase-service-role-key') &&
    !SUPABASE_SERVICE_ROLE_KEY.startsWith('__AISTUDIO_SECRET_')
);

function createSafeSupabaseAdmin() {
  if (!isSupabaseAdminReady) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {autoRefreshToken: false, persistSession: false},
    });
  } catch (err) {
    console.warn('Supabase admin client initialization skipped due to invalid config:', err);
    return null;
  }
}

const supabaseAdmin = createSafeSupabaseAdmin();

// ---------------------------------------------------------------------------
// Local Stateful Preview Store (digunakan hanya saat env Supabase belum diisi)
// ---------------------------------------------------------------------------
function resolveLocalDbPath(): string {
  const cwdCandidate = path.resolve(process.cwd(), '.local-preview-db.json');
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return cwdCandidate;
  } catch {
    return '/tmp/.local-preview-db.json';
  }
}

const LOCAL_DB_PATH = resolveLocalDbPath();

interface LocalUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  nip: string | null;
  role: 'admin' | 'guru' | 'tenaga_kependidikan';
  unit_kerja: string | null;
  created_at: string;
}

interface LocalStudent {
  id: string;
  nis: string;
  name: string;
  kelas: string;
  jurusan: 'TKJ' | 'DKV' | 'AK' | 'BC' | 'MPLB' | 'BD';
  created_at: string;
}

interface LocalEmployeeAttendance {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alpha';
  notes: string | null;
  created_at: string;
}

interface LocalStudentAttendance {
  id: string;
  student_id: string;
  recorded_by: string | null;
  date: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alpha';
  notes: string | null;
  created_at: string;
}

interface LocalDB {
  users: LocalUser[];
  students: LocalStudent[];
  employeeAttendance: LocalEmployeeAttendance[];
  studentAttendance: LocalStudentAttendance[];
  sessions: Record<string, string>;
}

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function createInitialLocalDB(): LocalDB {
  const today = getTodayDate();
  const adminId = '11111111-1111-4111-8111-111111111111';
  const guruId = '22222222-2222-4222-8222-222222222222';
  const tendikId = '33333333-3333-4333-8333-333333333333';

  const students: LocalStudent[] = [
    {id: 's-1', nis: '20260101', name: 'Aditya Pratama', kelas: 'XI TKJ 1', jurusan: 'TKJ', created_at: new Date().toISOString()},
    {id: 's-2', nis: '20260102', name: 'Nadia Kusuma Wardani', kelas: 'XI TKJ 1', jurusan: 'TKJ', created_at: new Date().toISOString()},
    {id: 's-3', nis: '20260103', name: 'Raka Mahendra', kelas: 'XI DKV 1', jurusan: 'DKV', created_at: new Date().toISOString()},
    {id: 's-4', nis: '20260104', name: 'Siti Rahmawati', kelas: 'XI DKV 1', jurusan: 'DKV', created_at: new Date().toISOString()},
    {id: 's-5', nis: '20260105', name: 'Fajar Nugroho', kelas: 'XI AK 1', jurusan: 'AK', created_at: new Date().toISOString()},
    {id: 's-6', nis: '20260106', name: 'Putri Ayu Lestari', kelas: 'XI BC 1', jurusan: 'BC', created_at: new Date().toISOString()},
    {id: 's-7', nis: '20260107', name: 'Dimas Bayu Saputra', kelas: 'XI MPLB 1', jurusan: 'MPLB', created_at: new Date().toISOString()},
    {id: 's-8', nis: '20260108', name: 'Aulia Azzahra', kelas: 'XI BD 1', jurusan: 'BD', created_at: new Date().toISOString()},
  ];

  return {
    users: [
      {
        id: adminId,
        email: 'admin@smkprimaunggul.sch.id',
        password: 'password123',
        full_name: 'Drs. Hendra Wijaya, M.Pd.',
        nip: '197804122005011004',
        role: 'admin',
        unit_kerja: 'Kepala Tata Usaha & Sistem Informasi',
        created_at: new Date().toISOString(),
      },
      {
        id: guruId,
        email: 'guru@smkprimaunggul.sch.id',
        password: 'password123',
        full_name: 'Rina Kartikasari, S.Kom.',
        nip: '198908212015032007',
        role: 'guru',
        unit_kerja: 'Guru Produktif TKJ',
        created_at: new Date().toISOString(),
      },
      {
        id: tendikId,
        email: 'tendik@smkprimaunggul.sch.id',
        password: 'password123',
        full_name: 'Budi Santoso',
        nip: '199203152019021002',
        role: 'tenaga_kependidikan',
        unit_kerja: 'Staf Administrasi Akademik',
        created_at: new Date().toISOString(),
      },
    ],
    students,
    employeeAttendance: [
      {
        id: 'ea-1',
        user_id: adminId,
        date: today,
        check_in_time: '06:52',
        check_out_time: null,
        status: 'hadir',
        notes: 'Hadir tepat waktu',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ea-2',
        user_id: guruId,
        date: today,
        check_in_time: '07:04',
        check_out_time: null,
        status: 'hadir',
        notes: 'Mengajar jam pertama Lab TKJ',
        created_at: new Date().toISOString(),
      },
    ],
    studentAttendance: [
      {id: 'sa-1', student_id: 's-1', recorded_by: guruId, date: today, status: 'hadir', notes: null, created_at: new Date().toISOString()},
      {id: 'sa-2', student_id: 's-2', recorded_by: guruId, date: today, status: 'hadir', notes: null, created_at: new Date().toISOString()},
      {id: 'sa-3', student_id: 's-3', recorded_by: guruId, date: today, status: 'izin', notes: 'Lomba desain kota', created_at: new Date().toISOString()},
      {id: 'sa-4', student_id: 's-4', recorded_by: guruId, date: today, status: 'hadir', notes: null, created_at: new Date().toISOString()},
    ],
    sessions: {},
  };
}

function loadLocalDB(): LocalDB {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(raw) as LocalDB;
    }
  } catch {
    // ignore corrupt cache
  }
  const initial = createInitialLocalDB();
  saveLocalDB(initial);
  return initial;
}

function saveLocalDB(db: LocalDB): void {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // ignore read-only fs errors
  }
}

function sanitizeLocalUser(u: LocalUser) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    nip: u.nip,
    role: u.role,
    unit_kerja: u.unit_kerja,
    created_at: u.created_at,
  };
}

export function createApiApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      supabaseClientReady: isSupabaseClientReady,
      supabaseAdminReady: isSupabaseAdminReady,
    });
  });

  app.get('/api/schema-sql', (_req, res) => {
    const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql');
    if (fs.existsSync(schemaPath)) {
      res.type('text/plain').send(fs.readFileSync(schemaPath, 'utf-8'));
    } else {
      res.status(404).send('-- schema.sql not found');
    }
  });

  app.get('/api/supabase/verify', async (_req, res) => {
    if (!supabaseAdmin) {
      res.json({
        configured: false,
        message: 'Variabel SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diisi.',
        tables: [],
      });
      return;
    }

    const tableNames = [
      'departments',
      'classes',
      'profiles',
      'students',
      'employee_attendance',
      'student_attendance',
    ];

    const checks = await Promise.all(
      tableNames.map(async (table) => {
        const {count, error} = await supabaseAdmin
          .from(table)
          .select('*', {count: 'exact', head: true});
        return {
          table,
          ready: !error,
          rowCount: count ?? 0,
          error: error?.message ?? null,
        };
      })
    );

    res.json({
      configured: true,
      allTablesReady: checks.every((c) => c.ready),
      tables: checks,
    });
  });

  // -------------------------------------------------------------------------
  // SYNC PROFILE FOR PRE-EXISTING SUPABASE AUTH USERS
  // -------------------------------------------------------------------------
  app.post('/api/auth/sync-profile', async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({
        error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada server.',
      });
      return;
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      res.status(401).json({error: 'Token otorisasi tidak ditemukan.'});
      return;
    }

    try {
      const {data: userData, error: userErr} = await supabaseAdmin.auth.getUser(token);
      if (userErr || !userData?.user) {
        res.status(401).json({error: 'Sesi Supabase tidak valid.'});
        return;
      }

      const authUser = userData.user;
      const {data: existing, error: fetchErr} = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (fetchErr) {
        res.status(500).json({error: fetchErr.message});
        return;
      }
      if (existing) {
        res.json({user: existing});
        return;
      }

      const {count} = await supabaseAdmin
        .from('profiles')
        .select('*', {count: 'exact', head: true});

      const meta = (authUser.user_metadata || {}) as Record<string, unknown>;
      const metaRole = typeof meta.role === 'string' ? meta.role : '';
      const assignedRole =
        (count ?? 0) === 0
          ? 'admin'
          : metaRole === 'admin' || metaRole === 'guru' || metaRole === 'tenaga_kependidikan'
          ? metaRole
          : 'tenaga_kependidikan';

      const email = authUser.email || `${authUser.id}@user.local`;
      const fullName =
        (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
        email.split('@')[0] ||
        'Pengguna';

      const {data: inserted, error: insertErr} = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authUser.id,
          email,
          full_name: fullName,
          nip: typeof meta.nip === 'string' && meta.nip.trim() ? meta.nip.trim() : null,
          role: assignedRole,
          unit_kerja:
            typeof meta.unit_kerja === 'string' && meta.unit_kerja.trim()
              ? meta.unit_kerja.trim()
              : null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      res.json({user: inserted});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyinkronkan profil pengguna.';
      res.status(500).json({error: message});
    }
  });

  // -------------------------------------------------------------------------
  // SUPABASE ADMIN USER MANAGEMENT ROUTES (Sync & Hard Delete Supabase Auth)
  // -------------------------------------------------------------------------
  async function requireSupabaseAdmin(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (!supabaseAdmin) {
      res.status(503).json({
        error:
          'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada server untuk manajemen user Supabase Auth.',
      });
      return;
    }
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      res.status(401).json({error: 'Token otorisasi tidak ditemukan.'});
      return;
    }

    const {data: userData, error: userErr} = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      res.status(401).json({error: 'Sesi tidak valid atau telah berakhir.'});
      return;
    }

    const {data: profile, error: profErr} = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profErr || profile?.role !== 'admin') {
      res.status(403).json({error: 'Akses ditolak. Hanya Admin yang diizinkan.'});
      return;
    }

    (req as express.Request & {adminUserId?: string}).adminUserId = userData.user.id;
    next();
  }

  app.get('/api/admin/users', requireSupabaseAdmin, async (_req, res) => {
    try {
      const [{data: profiles, error: profError}, {data: authList, error: authError}] =
        await Promise.all([
          supabaseAdmin!.from('profiles').select('*').order('created_at', {ascending: true}),
          supabaseAdmin!.auth.admin.listUsers({perPage: 1000}),
        ]);

      if (profError) throw profError;
      if (authError) throw authError;

      const authMap = new Map(authList.users.map((u) => [u.id, u]));
      const merged = (profiles || []).map((p) => ({
        ...p,
        last_sign_in_at: authMap.get(p.id)?.last_sign_in_at ?? null,
      }));

      res.json({users: merged});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat daftar pengguna';
      res.status(500).json({error: message});
    }
  });

  app.post('/api/admin/users', requireSupabaseAdmin, async (req, res) => {
    try {
      const {email, password, full_name, role, nip, unit_kerja} = req.body;
      if (!email || !password || !full_name || !role) {
        res.status(400).json({error: 'Email, password, nama lengkap, dan role wajib diisi.'});
        return;
      }

      const {data: created, error: createErr} = await supabaseAdmin!.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
          nip: nip || null,
          unit_kerja: unit_kerja || null,
        },
      });

      if (createErr || !created.user) {
        res.status(400).json({error: createErr?.message || 'Gagal membuat user di Supabase Auth'});
        return;
      }

      const {data: profile, error: upsertErr} = await supabaseAdmin!
        .from('profiles')
        .upsert({
          id: created.user.id,
          email,
          full_name,
          nip: nip || null,
          role,
          unit_kerja: unit_kerja || null,
        })
        .select()
        .single();

      if (upsertErr) throw upsertErr;
      res.status(201).json({user: profile});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menambahkan pengguna';
      res.status(500).json({error: message});
    }
  });

  app.patch('/api/admin/users/:id', requireSupabaseAdmin, async (req, res) => {
    try {
      const {id} = req.params;
      const {email, password, full_name, role, nip, unit_kerja} = req.body;

      const updatePayload: {
        email?: string;
        password?: string;
        user_metadata?: Record<string, unknown>;
      } = {
        user_metadata: {
          full_name,
          role,
          nip: nip || null,
          unit_kerja: unit_kerja || null,
        },
      };
      if (email) updatePayload.email = email;
      if (password && String(password).trim().length >= 6) {
        updatePayload.password = String(password);
      }

      const {error: authUpdateErr} = await supabaseAdmin!.auth.admin.updateUserById(
        id,
        updatePayload
      );
      if (authUpdateErr) {
        res.status(400).json({error: authUpdateErr.message});
        return;
      }

      const {data: updatedProfile, error: profErr} = await supabaseAdmin!
        .from('profiles')
        .update({
          ...(email ? {email} : {}),
          ...(full_name ? {full_name} : {}),
          ...(role ? {role} : {}),
          nip: nip ?? null,
          unit_kerja: unit_kerja ?? null,
        })
        .eq('id', id)
        .select()
        .single();

      if (profErr) throw profErr;
      res.json({user: updatedProfile});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui pengguna';
      res.status(500).json({error: message});
    }
  });

  app.delete('/api/admin/users/:id', requireSupabaseAdmin, async (req, res) => {
    try {
      const {id} = req.params;
      const adminUserId = (req as express.Request & {adminUserId?: string}).adminUserId;
      if (id === adminUserId) {
        res.status(400).json({error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.'});
        return;
      }

      const {error: deleteAuthErr} = await supabaseAdmin!.auth.admin.deleteUser(id, false);
      if (deleteAuthErr) {
        res.status(400).json({error: deleteAuthErr.message});
        return;
      }

      await supabaseAdmin!.from('profiles').delete().eq('id', id);

      res.json({deleted: true, id});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus pengguna';
      res.status(500).json({error: message});
    }
  });

  // -------------------------------------------------------------------------
  // LOCAL PREVIEW ROUTES (Hanya aktif bila Supabase env vars belum disetel)
  // -------------------------------------------------------------------------
  function getLocalAuthUser(req: express.Request): LocalUser | null {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return null;
    const db = loadLocalDB();
    const userId = db.sessions[token];
    if (!userId) return null;
    return db.users.find((u) => u.id === userId) || null;
  }

  app.post('/api/local/login', (req, res) => {
    const {email, password} = req.body;
    const db = loadLocalDB();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email || '').trim().toLowerCase()
    );
    if (!user || user.password !== password) {
      res.status(401).json({error: 'Email atau kata sandi tidak sesuai.'});
      return;
    }
    const token = crypto.randomUUID();
    db.sessions[token] = user.id;
    saveLocalDB(db);
    res.json({token, user: sanitizeLocalUser(user)});
  });

  app.post('/api/local/register', (req, res) => {
    const {email, password, full_name, nip, unit_kerja} = req.body;
    if (!email || !password || !full_name) {
      res.status(400).json({error: 'Nama lengkap, email, dan kata sandi wajib diisi.'});
      return;
    }
    const db = loadLocalDB();
    if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
      res.status(400).json({error: 'Email sudah terdaftar.'});
      return;
    }
    const role: LocalUser['role'] = db.users.length === 0 ? 'admin' : 'tenaga_kependidikan';
    const newUser: LocalUser = {
      id: crypto.randomUUID(),
      email: String(email).trim(),
      password: String(password),
      full_name: String(full_name).trim(),
      nip: nip || null,
      role,
      unit_kerja: unit_kerja || null,
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);
    const token = crypto.randomUUID();
    db.sessions[token] = newUser.id;
    saveLocalDB(db);
    res.status(201).json({token, user: sanitizeLocalUser(newUser)});
  });

  app.get('/api/local/me', (req, res) => {
    const user = getLocalAuthUser(req);
    if (!user) {
      res.status(401).json({error: 'Belum login'});
      return;
    }
    res.json({user: sanitizeLocalUser(user)});
  });

  app.post('/api/local/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (token) {
      const db = loadLocalDB();
      delete db.sessions[token];
      saveLocalDB(db);
    }
    res.json({ok: true});
  });

  app.get('/api/local/users', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || me.role !== 'admin') {
      res.status(403).json({error: 'Hanya admin yang dapat mengakses manajemen user.'});
      return;
    }
    const db = loadLocalDB();
    res.json({users: db.users.map(sanitizeLocalUser)});
  });

  app.post('/api/local/users', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || me.role !== 'admin') {
      res.status(403).json({error: 'Hanya admin yang dapat menambah user.'});
      return;
    }
    const {email, password, full_name, role, nip, unit_kerja} = req.body;
    if (!email || !password || !full_name || !role) {
      res.status(400).json({error: 'Data pengguna belum lengkap.'});
      return;
    }
    const db = loadLocalDB();
    if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
      res.status(400).json({error: 'Email sudah digunakan.'});
      return;
    }
    const created: LocalUser = {
      id: crypto.randomUUID(),
      email: String(email).trim(),
      password: String(password),
      full_name: String(full_name).trim(),
      nip: nip || null,
      role,
      unit_kerja: unit_kerja || null,
      created_at: new Date().toISOString(),
    };
    db.users.push(created);
    saveLocalDB(db);
    res.status(201).json({user: sanitizeLocalUser(created)});
  });

  app.patch('/api/local/users/:id', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || me.role !== 'admin') {
      res.status(403).json({error: 'Hanya admin yang dapat mengubah user.'});
      return;
    }
    const db = loadLocalDB();
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({error: 'User tidak ditemukan.'});
      return;
    }
    const {email, password, full_name, role, nip, unit_kerja} = req.body;
    if (email) target.email = email;
    if (password && String(password).length >= 6) target.password = String(password);
    if (full_name) target.full_name = full_name;
    if (role) target.role = role;
    target.nip = nip ?? target.nip;
    target.unit_kerja = unit_kerja ?? target.unit_kerja;
    saveLocalDB(db);
    res.json({user: sanitizeLocalUser(target)});
  });

  app.delete('/api/local/users/:id', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || me.role !== 'admin') {
      res.status(403).json({error: 'Hanya admin yang dapat menghapus user.'});
      return;
    }
    if (req.params.id === me.id) {
      res.status(400).json({error: 'Tidak dapat menghapus akun yang sedang aktif.'});
      return;
    }
    const db = loadLocalDB();
    db.users = db.users.filter((u) => u.id !== req.params.id);
    db.employeeAttendance = db.employeeAttendance.filter((a) => a.user_id !== req.params.id);
    saveLocalDB(db);
    res.json({deleted: true, id: req.params.id});
  });

  app.get('/api/local/students', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || (me.role !== 'admin' && me.role !== 'guru')) {
      res.status(403).json({error: 'Akses ditolak.'});
      return;
    }
    const db = loadLocalDB();
    res.json({students: db.students});
  });

  app.post('/api/local/students', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || me.role !== 'admin') {
      res.status(403).json({error: 'Hanya admin yang dapat menambah data siswa.'});
      return;
    }
    const {nis, name, kelas, jurusan} = req.body;
    if (!nis || !name || !kelas || !jurusan) {
      res.status(400).json({error: 'NIS, nama, kelas, dan jurusan wajib diisi.'});
      return;
    }
    const db = loadLocalDB();
    if (db.students.some((s) => s.nis === nis)) {
      res.status(400).json({error: 'NIS siswa sudah terdaftar.'});
      return;
    }
    const created: LocalStudent = {
      id: crypto.randomUUID(),
      nis,
      name,
      kelas,
      jurusan,
      created_at: new Date().toISOString(),
    };
    db.students.push(created);
    saveLocalDB(db);
    res.status(201).json({student: created});
  });

  app.patch('/api/local/students/:id', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || me.role !== 'admin') {
      res.status(403).json({error: 'Hanya admin yang dapat mengubah data siswa.'});
      return;
    }
    const db = loadLocalDB();
    const target = db.students.find((s) => s.id === req.params.id);
    if (!target) {
      res.status(404).json({error: 'Siswa tidak ditemukan.'});
      return;
    }
    const {nis, name, kelas, jurusan} = req.body;
    if (nis) target.nis = nis;
    if (name) target.name = name;
    if (kelas) target.kelas = kelas;
    if (jurusan) target.jurusan = jurusan;
    saveLocalDB(db);
    res.json({student: target});
  });

  app.delete('/api/local/students/:id', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || me.role !== 'admin') {
      res.status(403).json({error: 'Hanya admin yang dapat menghapus data siswa.'});
      return;
    }
    const db = loadLocalDB();
    db.students = db.students.filter((s) => s.id !== req.params.id);
    db.studentAttendance = db.studentAttendance.filter((a) => a.student_id !== req.params.id);
    saveLocalDB(db);
    res.json({deleted: true});
  });

  app.get('/api/local/employee-attendance', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me) {
      res.status(401).json({error: 'Belum login'});
      return;
    }
    const db = loadLocalDB();
    const scope = req.query.scope;
    const records =
      scope === 'all' && me.role === 'admin'
        ? db.employeeAttendance
        : db.employeeAttendance.filter((a) => a.user_id === me.id);

    const enriched = records
      .map((r) => {
        const prof = db.users.find((u) => u.id === r.user_id);
        return {
          ...r,
          profile: prof
            ? {
                full_name: prof.full_name,
                email: prof.email,
                nip: prof.nip,
                role: prof.role,
                unit_kerja: prof.unit_kerja,
              }
            : undefined,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    res.json({records: enriched});
  });

  app.post('/api/local/employee-attendance', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me) {
      res.status(401).json({error: 'Belum login'});
      return;
    }
    const {date, check_in_time, check_out_time, status, notes} = req.body;
    const db = loadLocalDB();
    const existing = db.employeeAttendance.find(
      (a) => a.user_id === me.id && a.date === date
    );
    if (existing) {
      if (check_in_time !== undefined) existing.check_in_time = check_in_time;
      if (check_out_time !== undefined) existing.check_out_time = check_out_time;
      if (status) existing.status = status;
      if (notes !== undefined) existing.notes = notes;
      saveLocalDB(db);
      res.json({record: existing});
      return;
    }
    const created: LocalEmployeeAttendance = {
      id: crypto.randomUUID(),
      user_id: me.id,
      date,
      check_in_time: check_in_time || null,
      check_out_time: check_out_time || null,
      status: status || 'hadir',
      notes: notes || null,
      created_at: new Date().toISOString(),
    };
    db.employeeAttendance.push(created);
    saveLocalDB(db);
    res.status(201).json({record: created});
  });

  app.get('/api/local/student-attendance', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || (me.role !== 'admin' && me.role !== 'guru')) {
      res.status(403).json({error: 'Akses ditolak.'});
      return;
    }
    const db = loadLocalDB();
    const dateFilter = req.query.date as string | undefined;
    let list = db.studentAttendance;
    if (dateFilter) {
      list = list.filter((a) => a.date === dateFilter);
    }
    const enriched = list.map((a) => ({
      ...a,
      student: db.students.find((s) => s.id === a.student_id),
      recorder: db.users.find((u) => u.id === a.recorded_by)
        ? {full_name: db.users.find((u) => u.id === a.recorded_by)!.full_name}
        : undefined,
    }));
    res.json({records: enriched});
  });

  app.post('/api/local/student-attendance', (req, res) => {
    const me = getLocalAuthUser(req);
    if (!me || (me.role !== 'admin' && me.role !== 'guru')) {
      res.status(403).json({error: 'Hanya guru dan admin yang dapat mencatat absensi siswa.'});
      return;
    }
    const {entries} = req.body as {
      entries: Array<{
        student_id: string;
        date: string;
        status: 'hadir' | 'izin' | 'sakit' | 'alpha';
        notes?: string;
      }>;
    };
    const db = loadLocalDB();
    for (const entry of entries) {
      const existing = db.studentAttendance.find(
        (a) => a.student_id === entry.student_id && a.date === entry.date
      );
      if (existing) {
        existing.status = entry.status;
        existing.notes = entry.notes || null;
        existing.recorded_by = me.id;
      } else {
        db.studentAttendance.push({
          id: crypto.randomUUID(),
          student_id: entry.student_id,
          recorded_by: me.id,
          date: entry.date,
          status: entry.status,
          notes: entry.notes || null,
          created_at: new Date().toISOString(),
        });
      }
    }
    saveLocalDB(db);
    res.json({saved: entries.length});
  });

  return app;
}
