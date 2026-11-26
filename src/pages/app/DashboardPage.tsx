import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Clock, ClipboardCheck, GraduationCap, UserCheck, Users} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {api, getTodayDateStr} from '../../services/api';
import type {
  EmployeeAttendanceRecord,
  Student,
  StudentAttendanceRecord,
  UserProfile,
} from '../../types';
import {ROLE_LABELS} from '../../types';
import {
  EMPLOYEE_STATUS_LABEL,
  formatIndonesianDate,
  getStatusTextColor,
} from '../../utils/format';

export function DashboardPage() {
  const {user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [myAttendance, setMyAttendance] = useState<EmployeeAttendanceRecord[]>([]);
  const [allEmployeeAtt, setAllEmployeeAtt] = useState<EmployeeAttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentAttToday, setStudentAttToday] = useState<StudentAttendanceRecord[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [nowStr, setNowStr] = useState(() =>
    new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date())
  );

  const today = getTodayDateStr();

  useEffect(() => {
    const timer = setInterval(() => {
      setNowStr(
        new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date())
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const selfAttPromise = api.getEmployeeAttendance('self');
        const tasks: Promise<unknown>[] = [selfAttPromise];

        if (user?.role === 'admin' || user?.role === 'guru') {
          tasks.push(api.getStudents());
          tasks.push(api.getStudentAttendance(today));
        }
        if (user?.role === 'admin') {
          tasks.push(api.getEmployeeAttendance('all'));
          tasks.push(api.getUsers());
        }

        const results = await Promise.allSettled(tasks);
        if (!active) return;

        if (results[0]?.status === 'fulfilled') {
          setMyAttendance(results[0].value as EmployeeAttendanceRecord[]);
        }
        if (user?.role === 'admin' || user?.role === 'guru') {
          if (results[1]?.status === 'fulfilled') {
            setStudents(results[1].value as Student[]);
          }
          if (results[2]?.status === 'fulfilled') {
            setStudentAttToday(results[2].value as StudentAttendanceRecord[]);
          }
        }
        if (user?.role === 'admin') {
          if (results[3]?.status === 'fulfilled') {
            setAllEmployeeAtt(results[3].value as EmployeeAttendanceRecord[]);
          }
          if (results[4]?.status === 'fulfilled') {
            setUsersList(results[4].value as UserProfile[]);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [user, today]);

  if (!user) return null;

  const todayMyRecord = myAttendance.find((r) => r.date === today);
  const hadirCountMonth = myAttendance.filter(
    (r) => r.status === 'hadir' || r.status === 'terlambat'
  ).length;
  const studentHadirToday = studentAttToday.filter((r) => r.status === 'hadir').length;
  const employeeTodayList = allEmployeeAtt.filter((r) => r.date === today);
  const uniqueClasses = Array.from(new Set(students.map((s) => s.kelas))).sort();

  return (
    <div className="space-y-6">
      {/* Greeting & Self Attendance Status Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-red-600">{ROLE_LABELS[user.role]}</span>
            <span aria-hidden="true">·</span>
            <span>{formatIndonesianDate(today)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-700">{nowStr} WIB</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Selamat datang, {user.full_name}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {todayMyRecord
              ? `Status absensi karyawan Anda hari ini: ${EMPLOYEE_STATUS_LABEL[todayMyRecord.status]} (Masuk ${todayMyRecord.check_in_time || '-'} · Pulang ${todayMyRecord.check_out_time || '-'}).`
              : 'Anda belum mencatat kehadiran karyawan untuk hari ini.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/app/absensi-karyawan"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {todayMyRecord && !todayMyRecord.check_out_time
                ? 'Catat Absen Pulang'
                : todayMyRecord
                ? 'Lihat Absensi Saya'
                : 'Absen Masuk Sekarang'}
            </span>
          </Link>
          {(user.role === 'admin' || user.role === 'guru') && (
            <Link
              to="/app/absensi-siswa"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Input Absensi Siswa</span>
            </Link>
          )}
        </div>
      </section>

      {/* Summary KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Status Hari Ini</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {loading ? '...' : todayMyRecord ? EMPLOYEE_STATUS_LABEL[todayMyRecord.status] : 'Belum Absen'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            Masuk: {todayMyRecord?.check_in_time || '--:--'} · Pulang:{' '}
            {todayMyRecord?.check_out_time || '--:--'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Total Kehadiran Saya</span>
            <UserCheck className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {loading ? '...' : `${hadirCountMonth} Hari`}
          </div>
          <p className="text-xs text-slate-500 mt-1">Akumulasi catatan kehadiran aktif</p>
        </div>

        {(user.role === 'admin' || user.role === 'guru') && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                <span>Total Data Siswa</span>
                <GraduationCap className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {loading ? '...' : `${students.length} Siswa`}
              </div>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                Tersebar di {uniqueClasses.length} kelas aktif
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                <span>Siswa Hadir Hari Ini</span>
                <ClipboardCheck className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {loading ? '...' : `${studentHadirToday} / ${studentAttToday.length || students.length}`}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {studentAttToday.length} siswa sudah diabsen hari ini
              </p>
            </div>
          </>
        )}

        {user.role === 'admin' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:col-span-2 lg:col-span-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Ringkasan Manajemen Sekolah
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                    {usersList.length} akun karyawan terdaftar · {employeeTodayList.length}{' '}
                    karyawan tercatat hadir/izin hari ini
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/app/rekap/karyawan"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Rekap Karyawan
                </Link>
                <Link
                  to="/app/users"
                  className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Kelola User
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Role-specific Lower Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal Attendance History */}
        <section
          className={`${
            user.role === 'admin' || user.role === 'guru' ? 'lg:col-span-7' : 'lg:col-span-12'
          } bg-white border border-slate-200 rounded-xl overflow-hidden`}
        >
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Absensi Karyawan Saya
            </h3>
            <Link
              to="/app/absensi-karyawan"
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <span>Kelola</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Jam Masuk</th>
                  <th className="py-3 px-4 font-semibold">Jam Pulang</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                      Memuat riwayat absensi...
                    </td>
                  </tr>
                ) : myAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                      Belum ada riwayat absensi karyawan. Silakan lakukan absensi masuk.
                    </td>
                  </tr>
                ) : (
                  myAttendance.slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-6 text-slate-900 font-medium whitespace-nowrap">
                        {formatIndonesianDate(item.date)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {item.check_in_time || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {item.check_out_time || '-'}
                      </td>
                      <td className={`py-3 px-4 text-xs ${getStatusTextColor(item.status)}`}>
                        {EMPLOYEE_STATUS_LABEL[item.status]}
                      </td>
                      <td className="py-3 px-6 text-xs text-slate-600">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Class Quick Links (Guru & Admin) */}
        {(user.role === 'admin' || user.role === 'guru') && (
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Pintasan Absensi Kelas
              </h3>
              <Link
                to="/app/rekap/siswa"
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Lihat Rekap
              </Link>
            </div>
            <div className="p-5 flex-1">
              {uniqueClasses.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Belum ada data kelas. Admin dapat menambahkan siswa pada menu Data Siswa.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {uniqueClasses.map((kelas) => {
                    const count = students.filter((s) => s.kelas === kelas).length;
                    return (
                      <Link
                        key={kelas}
                        to={`/app/absensi-siswa/${encodeURIComponent(kelas)}`}
                        className="p-3.5 border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50/40 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{kelas}</div>
                          <div className="text-xs text-slate-500 tabular-nums">
                            {count} siswa
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-red-600" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
