import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, CheckCircle2, ShieldCheck, Users, ClipboardCheck} from 'lucide-react';
import {ResilientImage} from '../components/ResilientImage';
import {JURUSAN_LIST} from '../types';
import {useAuth} from '../context/AuthContext';

export function LandingPage() {
  const {user} = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top Bar Contract: Exactly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2.5"
          >
            <span className="w-2.5 h-6 bg-red-600 rounded-xs inline-block" aria-hidden="true" />
            <span>SMK Prima Unggul</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#profil"
              className="hover:text-red-600 transition-colors whitespace-nowrap shrink-0"
            >
              Profil
            </a>
            <a
              href="#jurusan"
              className="hover:text-red-600 transition-colors whitespace-nowrap shrink-0"
            >
              Program Keahlian
            </a>
            <a
              href="#sistem-absensi"
              className="hover:text-red-600 transition-colors whitespace-nowrap shrink-0"
            >
              Sistem Absensi
            </a>
            <a
              href="#kontak"
              className="hover:text-red-600 transition-colors whitespace-nowrap shrink-0"
            >
              Kontak
            </a>
          </nav>

          <div className="shrink-0">
            <Link
              to={user ? '/app' : '/login'}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
            >
              <span>{user ? 'Buka Aplikasi' : 'Masuk Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="profil" className="border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs font-semibold tracking-wider text-red-600 mb-3">
                  Sekolah Menengah Kejuruan Terakreditasi A
                </p>
                <h1
                  className="font-bold tracking-tight text-slate-900 leading-[1.12] mb-5"
                  style={{fontSize: 'clamp(2.25rem, 4vw, 3.35rem)', textWrap: 'balance'}}
                >
                  Pendidikan Vokasi Modern dan Tata Kelola Kehadiran Terpadu
                </h1>
                <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-xl">
                  SMK Prima Unggul mempersiapkan lulusan siap kerja di bidang teknologi,
                  industri kreatif, dan manajemen bisnis modern. Didukung sistem absensi
                  digital untuk memantau kedisiplinan siswa, guru, dan tenaga kependidikan
                  secara akurat.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    to={user ? '/app' : '/login'}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>{user ? 'Masuk ke Dashboard' : 'Masuk ke Portal Absensi'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#jurusan"
                    className="inline-flex items-center px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    Pelajari 6 Jurusan
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="h-72 sm:h-96 lg:h-full min-h-[340px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <ResilientImage
                    src="/src/assets/images/hero_smk_campus_1795061332907.jpg"
                    alt="Gedung Kampus Utama SMK Prima Unggul"
                    fallbackTitle="Kampus Utama SMK Prima Unggul"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* 4-column proof strip below hero split */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-10 border-t border-slate-200">
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">3 Rumpun</div>
                <p className="text-sm text-slate-600 mt-1">
                  Bidang keahlian teknologi, kreatif, dan bisnis manajemen
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 tabular-nums">6 Jurusan</div>
                <p className="text-sm text-slate-600 mt-1">
                  TKJ, DKV, AK, BC, MPLB, dan BD berstandar industri
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">3 Peran</div>
                <p className="text-sm text-slate-600 mt-1">
                  Admin, Guru, dan Tenaga Kependidikan terintegrasi
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">Real-Time</div>
                <p className="text-sm text-slate-600 mt-1">
                  Pencatatan dan rekapitulasi absensi berbasis Supabase
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Program Keahlian (3 Rumpun, 6 Jurusan: TKJ, DKV, AK, BC, MPLB, BD) */}
        <section id="jurusan" className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-16 lg:py-20">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold tracking-wider text-red-600 mb-2">
                Struktur Akademik Kejuruan
              </p>
              <h2
                className="text-3xl font-bold tracking-tight text-slate-900 mb-3"
                style={{textWrap: 'balance'}}
              >
                Tiga Rumpun Bidang dan Enam Kompetensi Keahlian Unggulan
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Kurikulum SMK Prima Unggul disusun bersama mitra industri nasional pada
                bidang Teknologi Informasi, Industri Kreatif, serta Bisnis dan Manajemen.
              </p>
            </div>

            {/* Asymmetric Visual Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                <div className="h-64 sm:h-72 overflow-hidden bg-slate-100">
                  <ResilientImage
                    src="/src/assets/images/lab_teknologi_tkj_1795061333694.jpg"
                    alt="Laboratorium Jaringan dan Studio Penyiaran SMK Prima Unggul"
                    fallbackTitle="Laboratorium TKJ & Studio Broadcasting"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>Rumpun Teknologi & Media Siar</span>
                    <span aria-hidden="true">·</span>
                    <span>TKJ & BC</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Infrastruktur Jaringan dan Produksi Penyiaran Berstandar Industri
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Dilengkapi laboratorium server, perangkat routing enterprise, serta ruang
                    kendali studio penyiaran multi-kamera untuk praktik siswa setiap hari.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                <div className="h-64 sm:h-72 overflow-hidden bg-slate-100">
                  <ResilientImage
                    src="/src/assets/images/studio_kreatif_dkv_1795061333794.jpg"
                    alt="Studio Desain Komunikasi Visual dan Bisnis Digital"
                    fallbackTitle="Studio DKV & Bisnis Digital"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>Rumpun Kreatif & Bisnis Modern</span>
                    <span aria-hidden="true">·</span>
                    <span>DKV, AK, MPLB, BD</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Studio Desain Terkalibrasi dan Simulasi Manajemen Bisnis
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Mendukung praktik desain grafis, pembukuan digital, administrasi perkantoran
                    modern, hingga pengelolaan toko daring terpadu.
                  </p>
                </div>
              </div>
            </div>

            {/* 6 Jurusan Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {JURUSAN_LIST.map((item, idx) => (
                <div
                  key={item.code}
                  className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span className="font-mono font-semibold text-red-600">
                        0{idx + 1}. {item.code}
                      </span>
                      <span>{item.rumpun}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.name}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Sistem Absensi Terpadu */}
        <section id="sistem-absensi" className="bg-white border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5">
                <p className="text-xs font-semibold tracking-wider text-red-600 mb-2">
                  Arsitektur Portal Absensi
                </p>
                <h2
                  className="text-3xl font-bold tracking-tight text-slate-900 mb-4"
                  style={{textWrap: 'balance'}}
                >
                  Satu Sistem untuk Kedisiplinan Siswa dan Seluruh Karyawan
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                  Setiap peran memiliki hak akses dan alur kerja spesifik agar pencatatan
                  kehadiran harian berjalan cepat, transparan, dan mudah direkapitulasi.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  <span>Akses Portal Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl">
                <div className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      01. Administrator Sekolah
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Mengelola seluruh akun pengguna yang tersinkronisasi penuh dengan
                      Supabase Authentication (tambah, ubah, dan hapus permanen), mengelola
                      data induk siswa seluruh jurusan, melakukan absensi mandiri, serta
                      memantau rekap absensi karyawan maupun siswa.
                    </p>
                  </div>
                </div>

                <div className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">02. Guru</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Mencatat kehadiran pribadi pada menu Absensi Karyawan, menginput
                      presensi siswa per kelas secara langsung pada menu Absensi Siswa,
                      dan memantau riwayat melalui Rekap Absensi Siswa.
                    </p>
                  </div>
                </div>

                <div className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      03. Tenaga Kependidikan
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Mengakses ringkasan jadwal kehadiran di Dashboard serta melakukan
                      absensi masuk dan pulang mandiri setiap hari kerja.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer id="kontak" className="bg-slate-950 text-slate-300">
        <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 text-white font-bold text-base mb-2">
              <span className="w-2 h-5 bg-red-600 rounded-xs inline-block" aria-hidden="true" />
              <span>SMK Prima Unggul</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Jl. Pendidikan Vokasi No. 45 · Kampus Terpadu Kejuruan · Kompetensi TKJ, DKV,
              AK, BC, MPLB, dan BD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-red-500" />
              <span>Terintegrasi Supabase Auth & PostgreSQL</span>
            </div>
            <Link to="/login" className="text-white font-medium hover:text-red-400 transition-colors">
              Login Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
