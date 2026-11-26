-- ============================================================================
-- SMK PRIMA UNGGUL - SUPABASE RELATIONAL DATABASE SCHEMA, RLS, TRIGGERS & SEED
-- Jalankan seluruh script ini pada SQL Editor di Dashboard Supabase Anda.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABEL MASTER JURUSAN (DEPARTMENTS)
-- ----------------------------------------------------------------------------
create table if not exists public.departments (
  code text primary key check (code in ('TKJ', 'DKV', 'AK', 'BC', 'MPLB', 'BD')),
  name text not null,
  rumpun text not null,
  created_at timestamptz not null default now()
);

insert into public.departments (code, name, rumpun) values
  ('TKJ', 'Teknik Komputer dan Jaringan', 'Teknologi Informasi & Infrastruktur'),
  ('DKV', 'Desain Komunikasi Visual', 'Industri Kreatif & Media'),
  ('BC', 'Broadcasting & Perfilman', 'Industri Kreatif & Media'),
  ('AK', 'Akuntansi', 'Bisnis, Keuangan & Manajemen'),
  ('MPLB', 'Manajemen Perkantoran dan Layanan Bisnis', 'Bisnis, Keuangan & Manajemen'),
  ('BD', 'Bisnis Digital', 'Bisnis, Keuangan & Manajemen')
on conflict (code) do update set
  name = excluded.name,
  rumpun = excluded.rumpun;

-- ----------------------------------------------------------------------------
-- 2. TABEL PROFIL KARYAWAN & ROLE (RELASI 1:1 KE auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  nip text,
  role text not null check (role in ('admin', 'guru', 'tenaga_kependidikan')) default 'tenaga_kependidikan',
  unit_kerja text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. TABEL KELAS (RELASI KE departments DAN profiles SEBAGAI WALI KELAS)
-- ----------------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  tingkat text not null check (tingkat in ('X', 'XI', 'XII')),
  jurusan_code text not null references public.departments(code) on update cascade on delete restrict,
  wali_kelas_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.classes (name, tingkat, jurusan_code) values
  ('X TKJ 1', 'X', 'TKJ'),
  ('XI TKJ 1', 'XI', 'TKJ'),
  ('XII TKJ 1', 'XII', 'TKJ'),
  ('X DKV 1', 'X', 'DKV'),
  ('XI DKV 1', 'XI', 'DKV'),
  ('XII DKV 1', 'XII', 'DKV'),
  ('X AK 1', 'X', 'AK'),
  ('XI AK 1', 'XI', 'AK'),
  ('XII AK 1', 'XII', 'AK'),
  ('X BC 1', 'X', 'BC'),
  ('XI BC 1', 'XI', 'BC'),
  ('XII BC 1', 'XII', 'BC'),
  ('X MPLB 1', 'X', 'MPLB'),
  ('XI MPLB 1', 'XI', 'MPLB'),
  ('XII MPLB 1', 'XII', 'MPLB'),
  ('X BD 1', 'X', 'BD'),
  ('XI BD 1', 'XI', 'BD'),
  ('XII BD 1', 'XII', 'BD')
on conflict (name) do nothing;

-- ----------------------------------------------------------------------------
-- 4. TABEL DATA SISWA (RELASI KE classes DAN departments)
-- ----------------------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  nis text unique not null,
  name text not null,
  kelas text not null,
  jurusan text not null references public.departments(code) on update cascade on delete restrict,
  class_id uuid references public.classes(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Trigger otomatis menyinkronkan students.class_id dengan tabel public.classes
create or replace function public.sync_student_class_relation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  matched_class_id uuid;
  inferred_tingkat text;
begin
  select id into matched_class_id
  from public.classes
  where name = new.kelas
  limit 1;

  if matched_class_id is null then
    inferred_tingkat := case
      when new.kelas ilike 'XII %' then 'XII'
      when new.kelas ilike 'XI %' then 'XI'
      else 'X'
    end;

    insert into public.classes (name, tingkat, jurusan_code)
    values (new.kelas, inferred_tingkat, new.jurusan)
    on conflict (name) do update set jurusan_code = excluded.jurusan_code
    returning id into matched_class_id;
  end if;

  new.class_id := matched_class_id;
  return new;
end;
$$;

drop trigger if exists trg_sync_student_class on public.students;
create trigger trg_sync_student_class
  before insert or update of kelas, jurusan on public.students
  for each row execute procedure public.sync_student_class_relation();

-- ----------------------------------------------------------------------------
-- 5. TABEL ABSENSI KARYAWAN (RELASI KE profiles)
-- ----------------------------------------------------------------------------
create table if not exists public.employee_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  check_in_time text,
  check_out_time text,
  status text not null check (status in ('hadir', 'terlambat', 'izin', 'sakit', 'alpha')) default 'hadir',
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

-- ----------------------------------------------------------------------------
-- 6. TABEL ABSENSI SISWA (RELASI KE students DAN profiles SEBAGAI PENCATAT)
-- ----------------------------------------------------------------------------
create table if not exists public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  recorded_by uuid references public.profiles(id) on delete set null,
  date date not null default current_date,
  status text not null check (status in ('hadir', 'izin', 'sakit', 'alpha')) default 'hadir',
  notes text,
  created_at timestamptz not null default now(),
  unique(student_id, date)
);

-- ----------------------------------------------------------------------------
-- 7. INDEX PERFORMA RELASI
-- ----------------------------------------------------------------------------
create index if not exists idx_students_class_id on public.students(class_id);
create index if not exists idx_students_jurusan on public.students(jurusan);
create index if not exists idx_emp_att_user_date on public.employee_attendance(user_id, date desc);
create index if not exists idx_stu_att_student_date on public.student_attendance(student_id, date desc);

-- ----------------------------------------------------------------------------
-- 8. TRIGGER AUTHENTICATION: USER PERTAMA OTOMATIS MENJADI ADMIN
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  existing_count integer;
  assigned_role text;
  meta_role text;
begin
  -- Advisory lock untuk mencegah race condition saat registrasi pertama
  perform pg_advisory_xact_lock(90210);
  select count(*) into existing_count from public.profiles;

  meta_role := new.raw_user_meta_data->>'role';

  if existing_count = 0 then
    assigned_role := 'admin';
  elsif meta_role in ('admin', 'guru', 'tenaga_kependidikan') then
    assigned_role := meta_role;
  else
    assigned_role := 'tenaga_kependidikan';
  end if;

  insert into public.profiles (id, email, full_name, nip, role, unit_kerja)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'nip', ''),
    assigned_role,
    nullif(new.raw_user_meta_data->>'unit_kerja', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    nip = coalesce(excluded.nip, public.profiles.nip),
    role = excluded.role,
    unit_kerja = coalesce(excluded.unit_kerja, public.profiles.unit_kerja);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 9. HELPER FUNCTION NON-RECURSIVE & ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
create or replace function public.get_my_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

alter table public.departments enable row level security;
alter table public.classes enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.employee_attendance enable row level security;
alter table public.student_attendance enable row level security;

-- Departments & Classes Policies
drop policy if exists "Authenticated users can view departments" on public.departments;
create policy "Authenticated users can view departments"
  on public.departments for select
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can view classes" on public.classes;
create policy "Authenticated users can view classes"
  on public.classes for select
  using (auth.uid() is not null);

drop policy if exists "Admin can manage classes" on public.classes;
create policy "Admin can manage classes"
  on public.classes for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Profiles Policies
drop policy if exists "Users can view own profile or admin can view all" on public.profiles;
create policy "Users can view own profile or admin can view all"
  on public.profiles for select
  using (auth.uid() = id or public.get_my_role() = 'admin');

drop policy if exists "Admin can insert profiles" on public.profiles;
create policy "Admin can insert profiles"
  on public.profiles for insert
  with check (public.get_my_role() = 'admin');

drop policy if exists "Admin can update profiles" on public.profiles;
create policy "Admin can update profiles"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

drop policy if exists "Admin can delete profiles" on public.profiles;
create policy "Admin can delete profiles"
  on public.profiles for delete
  using (public.get_my_role() = 'admin');

-- Students Policies
drop policy if exists "Admin and Guru can view students" on public.students;
create policy "Admin and Guru can view students"
  on public.students for select
  using (public.get_my_role() in ('admin', 'guru'));

drop policy if exists "Admin can manage students" on public.students;
create policy "Admin can manage students"
  on public.students for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Employee Attendance Policies
drop policy if exists "Employees view own attendance or admin views all" on public.employee_attendance;
create policy "Employees view own attendance or admin views all"
  on public.employee_attendance for select
  using (user_id = auth.uid() or public.get_my_role() = 'admin');

drop policy if exists "Employees can record own attendance" on public.employee_attendance;
create policy "Employees can record own attendance"
  on public.employee_attendance for insert
  with check (user_id = auth.uid() or public.get_my_role() = 'admin');

drop policy if exists "Employees can update own attendance or admin all" on public.employee_attendance;
create policy "Employees can update own attendance or admin all"
  on public.employee_attendance for update
  using (user_id = auth.uid() or public.get_my_role() = 'admin');

-- Student Attendance Policies
drop policy if exists "Admin and Guru can view student attendance" on public.student_attendance;
create policy "Admin and Guru can view student attendance"
  on public.student_attendance for select
  using (public.get_my_role() in ('admin', 'guru'));

drop policy if exists "Admin and Guru can insert student attendance" on public.student_attendance;
create policy "Admin and Guru can insert student attendance"
  on public.student_attendance for insert
  with check (public.get_my_role() in ('admin', 'guru'));

drop policy if exists "Admin and Guru can update student attendance" on public.student_attendance;
create policy "Admin and Guru can update student attendance"
  on public.student_attendance for update
  using (public.get_my_role() in ('admin', 'guru'));

drop policy if exists "Admin can delete student attendance" on public.student_attendance;
create policy "Admin can delete student attendance"
  on public.student_attendance for delete
  using (public.get_my_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 10. RELATIONAL VIEWS UNTUK PELAPORAN & REKAP
-- ----------------------------------------------------------------------------
create or replace view public.v_employee_attendance_detail as
select
  ea.id,
  ea.date,
  ea.check_in_time,
  ea.check_out_time,
  ea.status,
  ea.notes,
  p.id as user_id,
  p.full_name,
  p.email,
  p.nip,
  p.role,
  p.unit_kerja
from public.employee_attendance ea
join public.profiles p on p.id = ea.user_id;

create or replace view public.v_student_attendance_detail as
select
  sa.id,
  sa.date,
  sa.status,
  sa.notes,
  s.id as student_id,
  s.nis,
  s.name as student_name,
  s.kelas,
  s.jurusan,
  d.name as department_name,
  d.rumpun,
  rec.full_name as recorded_by_name
from public.student_attendance sa
join public.students s on s.id = sa.student_id
join public.departments d on d.code = s.jurusan
left join public.profiles rec on rec.id = sa.recorded_by;

-- ----------------------------------------------------------------------------
-- 11. SEED DATA AWAL SISWA (OPSIONAL, IDEMPOTENT)
-- ----------------------------------------------------------------------------
insert into public.students (nis, name, kelas, jurusan) values
  ('20260101', 'Aditya Pratama', 'XI TKJ 1', 'TKJ'),
  ('20260102', 'Nadia Kusuma Wardani', 'XI TKJ 1', 'TKJ'),
  ('20260103', 'Raka Mahendra', 'XI DKV 1', 'DKV'),
  ('20260104', 'Siti Rahmawati', 'XI DKV 1', 'DKV'),
  ('20260105', 'Fajar Nugroho', 'XI AK 1', 'AK'),
  ('20260106', 'Putri Ayu Lestari', 'XI BC 1', 'BC'),
  ('20260107', 'Dimas Bayu Saputra', 'XI MPLB 1', 'MPLB'),
  ('20260108', 'Aulia Azzahra', 'XI BD 1', 'BD')
on conflict (nis) do nothing;
