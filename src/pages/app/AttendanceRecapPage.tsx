import React, {useEffect, useMemo, useState} from 'react';
import {Navigate, useParams} from 'react-router-dom';
import {Download, Search} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {api} from '../../services/api';
import type {EmployeeAttendanceRecord, StudentAttendanceRecord} from '../../types';
import {ROLE_LABELS} from '../../types';
import {
  downloadCsv,
  EMPLOYEE_STATUS_LABEL,
  formatIndonesianDate,
  getStatusTextColor,
  STUDENT_STATUS_LABEL,
} from '../../utils/format';

export function AttendanceRecapPage() {
  const {user} = useAuth();
  const {type} = useParams<{type: string}>();
  const recapType = type === 'karyawan' ? 'karyawan' : 'siswa';

  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [employeeRecords, setEmployeeRecords] = useState<EmployeeAttendanceRecord[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentAttendanceRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    if (recapType === 'karyawan' && user.role !== 'admin') return;
    if (recapType === 'siswa' && user.role !== 'admin' && user.role !== 'guru') return;

    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (recapType === 'karyawan') {
          const data = await api.getEmployeeAttendance('all');
          if (active) setEmployeeRecords(data);
        } else {
          const data = await api.getStudentAttendance();
          if (active) setStudentRecords(data);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Gagal memuat rekap absensi.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user, recapType]);

  const filteredEmployee = useMemo(() => {
    return employeeRecords.filter((r) => {
      if (dateFilter && r.date !== dateFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = r.profile?.full_name?.toLowerCase() || '';
        const email = r.profile?.email?.toLowerCase() || '';
        const nip = r.profile?.nip?.toLowerCase() || '';
        if (!name.includes(q) && !email.includes(q) && !nip.includes(q)) return false;
      }
      return true;
    });
  }, [employeeRecords, dateFilter, statusFilter, searchQuery]);

  const filteredStudent = useMemo(() => {
    return studentRecords.filter((r) => {
      if (dateFilter && r.date !== dateFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = r.student?.name?.toLowerCase() || '';
        const nis = r.student?.nis?.toLowerCase() || '';
        const kelas = r.student?.kelas?.toLowerCase() || '';
        if (!name.includes(q) && !nis.includes(q) && !kelas.includes(q)) return false;
      }
      return true;
    });
  }, [studentRecords, dateFilter, statusFilter, searchQuery]);

  if (!user) return null;

  // Role guards
  if (recapType === 'karyawan' && user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }
  if (recapType === 'siswa' && user.role === 'tenaga_kependidikan') {
    return <Navigate to="/app" replace />;
  }

  const activeRows = recapType === 'karyawan' ? filteredEmployee : filteredStudent;

  const summary = {
    total: activeRows.length,
    hadir: activeRows.filter((r) => r.status === 'hadir').length,
    terlambat:
      recapType === 'karyawan'
        ? filteredEmployee.filter((r) => r.status === 'terlambat').length
        : 0,
    izinSakit: activeRows.filter((r) => r.status === 'izin' || r.status === 'sakit').length,
    alpha: activeRows.filter((r) => r.status === 'alpha').length,
  };

  const handleExportCsv = () => {
    if (recapType === 'karyawan') {
      downloadCsv(
        `rekap-absensi-karyawan-${dateFilter || 'semua'}.csv`,
        ['Tanggal', 'Nama Karyawan', 'Role', 'NIP', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan'],
        filteredEmployee.map((r) => [
          r.date,
          r.profile?.full_name || '-',
          r.profile ? ROLE_LABELS[r.profile.role] : '-',
          r.profile?.nip || '-',
          r.check_in_time || '-',
          r.check_out_time || '-',
          EMPLOYEE_STATUS_LABEL[r.status],
          r.notes || '-',
        ])
      );
    } else {
      downloadCsv(
        `rekap-absensi-siswa-${dateFilter || 'semua'}.csv`,
        ['Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Jurusan', 'Status', 'Dicatat Oleh', 'Keterangan'],
        filteredStudent.map((r) => [
          r.date,
          r.student?.nis || '-',
          r.student?.name || '-',
          r.student?.kelas || '-',
          r.student?.jurusan || '-',
          STUDENT_STATUS_LABEL[r.status],
          r.recorder?.full_name || '-',
          r.notes || '-',
        ])
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {recapType === 'karyawan'
                ? 'Rekapitulasi Absensi Karyawan'
                : 'Rekapitulasi Absensi Siswa'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {recapType === 'karyawan'
                ? 'Seluruh catatan kehadiran Admin, Guru, dan Tenaga Kependidikan.'
                : 'Laporan kehadiran siswa per tanggal, kelas, dan kompetensi keahlian.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={activeRows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Filter Tanggal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="px-2.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
            >
              <option value="ALL">Semua Status</option>
              <option value="hadir">Hadir</option>
              {recapType === 'karyawan' && <option value="terlambat">Terlambat</option>}
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="alpha">Alpha</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pencarian
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  recapType === 'karyawan'
                    ? 'Cari nama, email, NIP...'
                    : 'Cari nama siswa, NIS, kelas...'
                }
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Total Catatan</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {summary.total}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Hadir</div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {summary.hadir}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">
            {recapType === 'karyawan' ? 'Terlambat / Izin / Sakit' : 'Izin / Sakit'}
          </div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums mt-1">
            {summary.terlambat + summary.izinSakit}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Alpha</div>
          <div className="text-2xl font-bold text-red-700 tabular-nums mt-1">
            {summary.alpha}
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Data Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {recapType === 'karyawan' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Nama Karyawan</th>
                  <th className="py-3 px-4 font-semibold">Jabatan / Role</th>
                  <th className="py-3 px-4 font-semibold">Jam Masuk</th>
                  <th className="py-3 px-4 font-semibold">Jam Pulang</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                      Memuat rekap absensi karyawan...
                    </td>
                  </tr>
                ) : filteredEmployee.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                      Tidak ada data rekap absensi karyawan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredEmployee.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-6 font-medium text-slate-900 whitespace-nowrap">
                        {formatIndonesianDate(r.date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {r.profile?.full_name || 'Karyawan'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {r.profile?.nip || r.profile?.email || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {r.profile ? ROLE_LABELS[r.profile.role] : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {r.check_in_time || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {r.check_out_time || '-'}
                      </td>
                      <td className={`py-3 px-4 text-xs ${getStatusTextColor(r.status)}`}>
                        {EMPLOYEE_STATUS_LABEL[r.status]}
                      </td>
                      <td className="py-3 px-6 text-xs text-slate-600">{r.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">NIS</th>
                  <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                  <th className="py-3 px-4 font-semibold">Kelas</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Pencatat</th>
                  <th className="py-3 px-6 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                      Memuat rekap absensi siswa...
                    </td>
                  </tr>
                ) : filteredStudent.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                      Tidak ada data rekap absensi siswa yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStudent.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-6 font-medium text-slate-900 whitespace-nowrap">
                        {formatIndonesianDate(r.date)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600">
                        {r.student?.nis || '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {r.student?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {r.student ? `${r.student.kelas} · ${r.student.jurusan}` : '-'}
                      </td>
                      <td className={`py-3 px-4 text-xs ${getStatusTextColor(r.status)}`}>
                        {STUDENT_STATUS_LABEL[r.status]}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {r.recorder?.full_name || '-'}
                      </td>
                      <td className="py-3 px-6 text-xs text-slate-600">{r.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
