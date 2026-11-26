export type UserRole = 'admin' | 'guru' | 'tenaga_kependidikan';

export type JurusanCode = 'TKJ' | 'DKV' | 'AK' | 'BC' | 'MPLB' | 'BD';

export type EmployeeAttendanceStatus =
  | 'hadir'
  | 'terlambat'
  | 'izin'
  | 'sakit'
  | 'alpha';

export type StudentAttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  nip: string | null;
  role: UserRole;
  unit_kerja: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  kelas: string;
  jurusan: JurusanCode;
  created_at: string;
}

export interface EmployeeAttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: EmployeeAttendanceStatus;
  notes: string | null;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
    nip: string | null;
    role: UserRole;
    unit_kerja: string | null;
  };
}

export interface StudentAttendanceRecord {
  id: string;
  student_id: string;
  recorded_by: string | null;
  date: string;
  status: StudentAttendanceStatus;
  notes: string | null;
  created_at: string;
  student?: Student;
  recorder?: {
    full_name: string;
  };
}

export const JURUSAN_LIST: Array<{
  code: JurusanCode;
  name: string;
  rumpun: string;
  description: string;
}> = [
  {
    code: 'TKJ',
    name: 'Teknik Komputer dan Jaringan',
    rumpun: 'Teknologi Informasi & Infrastruktur',
    description:
      'Merancang infrastruktur jaringan fiber optik, administrasi server Linux, cloud computing, dan keamanan siber skala industri.',
  },
  {
    code: 'DKV',
    name: 'Desain Komunikasi Visual',
    rumpun: 'Industri Kreatif & Media',
    description:
      'Mengembangkan identitas merek, ilustrasi digital, desain antarmuka, dan produksi aset visual komunikasi modern.',
  },
  {
    code: 'BC',
    name: 'Broadcasting & Perfilman',
    rumpun: 'Industri Kreatif & Media',
    description:
      'Produksi siaran studio televisi, sinematografi lapangan, tata suara profesional, dan penyuntingan pascaproduksi.',
  },
  {
    code: 'AK',
    name: 'Akuntansi',
    rumpun: 'Bisnis, Keuangan & Manajemen',
    description:
      'Pengelolaan siklus akuntansi perusahaan, perpajakan terapan, audit dasar, dan sistem informasi akuntansi berbasis komputer.',
  },
  {
    code: 'MPLB',
    name: 'Manajemen Perkantoran dan Layanan Bisnis',
    rumpun: 'Bisnis, Keuangan & Manajemen',
    description:
      'Tata kelola administrasi eksekutif, kearsipan digital, korespondensi bisnis modern, dan layanan pelanggan profesional.',
  },
  {
    code: 'BD',
    name: 'Bisnis Digital',
    rumpun: 'Bisnis, Keuangan & Manajemen',
    description:
      'Pemasaran digital berbasis data, pengelolaan e-commerce, optimasi kanal penjualan online, dan kewirausahaan rintisan.',
  },
];

export const KELAS_OPTIONS = [
  'X TKJ 1',
  'X DKV 1',
  'X AK 1',
  'X BC 1',
  'X MPLB 1',
  'X BD 1',
  'XI TKJ 1',
  'XI DKV 1',
  'XI AK 1',
  'XI BC 1',
  'XI MPLB 1',
  'XI BD 1',
  'XII TKJ 1',
  'XII DKV 1',
  'XII AK 1',
  'XII BC 1',
  'XII MPLB 1',
  'XII BD 1',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  guru: 'Guru',
  tenaga_kependidikan: 'Tenaga Kependidikan',
};
