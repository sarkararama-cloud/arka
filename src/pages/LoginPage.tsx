import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  User,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {api} from '../services/api';
import {ResilientImage} from '../components/ResilientImage';

export function LoginPage() {
  const {login, register, supabaseMode} = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [unitKerja, setUnitKerja] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [schemaSql, setSchemaSql] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [schemaTab, setSchemaTab] = useState<'relations' | 'sql'>('relations');
  const [verifyingDb, setVerifyingDb] = useState(false);
  const [dbVerifyResult, setDbVerifyResult] = useState<{
    configured: boolean;
    allTablesReady?: boolean;
    message?: string;
    tables: Array<{table: string; ready: boolean; rowCount: number; error: string | null}>;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        navigate('/app', {replace: true});
      } else {
        const res = await register({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          nip: nip.trim() || undefined,
          unit_kerja: unitKerja.trim() || undefined,
        });
        if (res.needsEmailConfirmation) {
          setInfoMessage(
            'Registrasi berhasil. Silakan konfirmasi email Anda melalui tautan yang dikirim oleh Supabase sebelum login.'
          );
          setMode('login');
        } else if (res.user) {
          navigate('/app', {replace: true});
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memproses permintaan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickPreviewLogin = async (presetEmail: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(presetEmail, 'password123');
      navigate('/app', {replace: true});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal login akun preview.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSchemaModal = async () => {
    setShowSchemaModal(true);
    if (!schemaSql) {
      try {
        const sql = await api.getSchemaSql();
        setSchemaSql(sql);
      } catch {
        setSchemaSql('-- Gagal memuat file supabase/schema.sql');
      }
    }
    handleVerifyDb();
  };

  const handleVerifyDb = async () => {
    setVerifyingDb(true);
    try {
      const res = await api.verifySupabaseSchema();
      setDbVerifyResult(res);
    } catch {
      setDbVerifyResult(null);
    } finally {
      setVerifyingDb(false);
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([schemaSql], {type: 'text/sql;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smk-prima-unggul-supabase-schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySql = async () => {
    await navigator.clipboard.writeText(schemaSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Brand Panel */}
      <div className="lg:w-5/12 bg-red-700 text-white relative overflow-hidden flex flex-col justify-between p-8 lg:p-12">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <ResilientImage
            src="/src/assets/images/hero_smk_campus_1795061332907.jpg"
            alt="Kampus SMK Prima Unggul"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-red-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="relative z-10 my-10 lg:my-0">
          <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight mb-4">
            <span className="w-2.5 h-6 bg-white rounded-xs inline-block" aria-hidden="true" />
            <span>SMK Prima Unggul</span>
          </div>
          <h1
            className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight mb-4"
            style={{textWrap: 'balance'}}
          >
            Portal Sistem Absensi Siswa dan Karyawan
          </h1>
          <p className="text-sm text-red-100 leading-relaxed max-w-md">
            Masuk menggunakan akun yang terdaftar untuk mengakses dashboard absensi,
            input kehadiran siswa, rekapitulasi laporan, dan manajemen pengguna.
          </p>
        </div>

        <div className="relative z-10 pt-6 border-t border-red-500/50 text-xs text-red-100">
          <p className="font-medium text-white mb-1">Ketentuan Role Otomatis</p>
          <p>
            Pengguna pertama yang mendaftar pada Supabase Authentication secara otomatis
            mendapatkan hak akses Administrator.
          </p>
        </div>
      </div>

      {/* Right Auth Form Panel */}
      <div className="lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {mode === 'login' ? 'Masuk ke Portal' : 'Registrasi Akun Baru'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {supabaseMode
                  ? 'Terhubung ke Supabase Authentication'
                  : 'Mode Preview Lokal aktif (Supabase env belum dikonfigurasi)'}
              </p>
            </div>
            <button
              type="button"
              onClick={openSchemaModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              <Database className="w-3.5 h-3.5 text-red-600" />
              <span>SQL Schema</span>
            </button>
          </div>

          {/* Segmented Tab */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Akun
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Drs. Hendra Wijaya"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      NIP (Opsional)
                    </label>
                    <input
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      placeholder="198501012010011001"
                      className="w-full px-3 py-2.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Unit Kerja
                    </label>
                    <input
                      type="text"
                      value={unitKerja}
                      onChange={(e) => setUnitKerja(e.target.value)}
                      placeholder="Tata Usaha / Lab TKJ"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@smkprimaunggul.sch.id"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting
                ? 'Memproses...'
                : mode === 'login'
                ? 'Masuk ke Aplikasi'
                : 'Daftar Akun'}
            </button>
          </form>

          {!supabaseMode && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Akses Cepat Mode Preview Lokal (Sandi: password123)
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Untuk beralih ke Supabase live, isi variabel{' '}
                <code className="font-mono text-red-700">VITE_SUPABASE_URL</code>,{' '}
                <code className="font-mono text-red-700">VITE_SUPABASE_ANON_KEY</code>, dan{' '}
                <code className="font-mono text-red-700">SUPABASE_SERVICE_ROLE_KEY</code>.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleQuickPreviewLogin('admin@smkprimaunggul.sch.id')}
                  className="px-2.5 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Admin
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleQuickPreviewLogin('guru@smkprimaunggul.sch.id')}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Guru
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleQuickPreviewLogin('tendik@smkprimaunggul.sch.id')}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Tendik
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal SQL Schema & Relasi Supabase */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Skema Database Relasional Supabase (PostgreSQL)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Relasi penuh antara Supabase Auth, Profil, Jurusan, Kelas, Siswa, dan Absensi
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSql}
                  disabled={!schemaSql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh .sql</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  disabled={!schemaSql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Tersalin' : 'Salin SQL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSchemaModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Sub-tabs inside modal */}
            <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSchemaTab('relations')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    schemaTab === 'relations'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Struktur & Relasi Tabel
                </button>
                <button
                  type="button"
                  onClick={() => setSchemaTab('sql')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    schemaTab === 'sql'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Script SQL (schema.sql)
                </button>
              </div>

              <button
                type="button"
                onClick={handleVerifyDb}
                disabled={verifyingDb}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-800 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifyingDb ? 'animate-spin' : ''}`} />
                <span>Cek Status Tabel Supabase</span>
              </button>
            </div>

            {schemaTab === 'relations' ? (
              <div className="p-6 overflow-auto flex-1 space-y-5">
                {/* Connection status summary */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-xs font-bold text-slate-900 mb-1">
                    Status Koneksi Supabase Server
                  </div>
                  {dbVerifyResult?.configured ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600">
                        {dbVerifyResult.allTablesReady
                          ? 'Seluruh 6 tabel relasional aktif dan terhubung dengan Supabase.'
                          : 'Kredensial Supabase terdeteksi, namun beberapa tabel belum dibuat di SQL Editor.'}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {dbVerifyResult.tables.map((t) => (
                          <div
                            key={t.table}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                          >
                            <span className="font-mono text-slate-800">{t.table}</span>
                            <span
                              className={`font-semibold tabular-nums ${
                                t.ready ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {t.ready ? `${t.rowCount} baris` : 'Belum ada'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tambahkan <code className="font-mono text-red-700">VITE_SUPABASE_URL</code>,{' '}
                      <code className="font-mono text-red-700">VITE_SUPABASE_ANON_KEY</code>,{' '}
                      <code className="font-mono text-red-700">SUPABASE_URL</code>, dan{' '}
                      <code className="font-mono text-red-700">SUPABASE_SERVICE_ROLE_KEY</code> ke
                      environment untuk mengaktifkan koneksi langsung ke project Supabase Anda.
                    </p>
                  )}
                </div>

                {/* Relational Table Map */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl">
                    <div className="text-xs font-mono font-bold text-red-700 mb-1">
                      1. public.profiles ↔ auth.users
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Foreign key <code className="font-mono">id → auth.users(id) ON DELETE CASCADE</code>.
                      Trigger <code className="font-mono">on_auth_user_created</code> otomatis memberi
                      role <code className="font-mono">admin</code> pada pendaftar pertama.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl">
                    <div className="text-xs font-mono font-bold text-red-700 mb-1">
                      2. public.departments (TKJ, DKV, AK, BC, MPLB, BD)
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tabel master 6 kompetensi keahlian & 3 rumpun bidang. Menjadi referensi
                      foreign key bagi tabel <code className="font-mono">classes</code> dan{' '}
                      <code className="font-mono">students</code>.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl">
                    <div className="text-xs font-mono font-bold text-red-700 mb-1">
                      3. public.classes → departments & profiles
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Menyimpan daftar kelas (X–XII) yang berelasi ke{' '}
                      <code className="font-mono">departments(code)</code> dan wali kelas{' '}
                      <code className="font-mono">profiles(id)</code>.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl">
                    <div className="text-xs font-mono font-bold text-red-700 mb-1">
                      4. public.students → classes & departments
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Data induk siswa (NIS, Nama, Kelas, Jurusan) dengan trigger sinkronisasi
                      otomatis <code className="font-mono">class_id → classes(id)</code>.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl">
                    <div className="text-xs font-mono font-bold text-red-700 mb-1">
                      5. public.employee_attendance → profiles
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Absensi mandiri seluruh karyawan (Admin, Guru, Tendik) berelasi ke{' '}
                      <code className="font-mono">profiles(id) ON DELETE CASCADE</code> dengan
                      unique key <code className="font-mono">(user_id, date)</code>.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl">
                    <div className="text-xs font-mono font-bold text-red-700 mb-1">
                      6. public.student_attendance → students & profiles
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Absensi siswa per tanggal berelasi ke{' '}
                      <code className="font-mono">students(id) ON DELETE CASCADE</code> dan pencatat{' '}
                      <code className="font-mono">recorded_by → profiles(id)</code>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 overflow-auto flex-1 bg-slate-950 text-slate-100">
                <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                  {schemaSql || 'Memuat schema.sql...'}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
