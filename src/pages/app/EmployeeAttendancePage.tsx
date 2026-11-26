import React, {useCallback, useEffect, useState} from 'react';
import {CheckCircle2, Clock, LogIn, LogOut as LogOutIcon} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {api, getCurrentTimeStr, getTodayDateStr} from '../../services/api';
import type {EmployeeAttendanceRecord, EmployeeAttendanceStatus} from '../../types';
import {ROLE_LABELS} from '../../types';
import {
  EMPLOYEE_STATUS_LABEL,
  formatIndonesianDate,
  getStatusTextColor,
} from '../../utils/format';

export function EmployeeAttendancePage() {
  const {user} = useAuth();
  const [records, setRecords] = useState<EmployeeAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusInput, setStatusInput] = useState<EmployeeAttendanceStatus>('hadir');
  const [notesInput, setNotesInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [clock, setClock] = useState(() =>
    new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date())
  );

  const today = getTodayDateStr();

  useEffect(() => {
    const t = setInterval(() => {
      setClock(
        new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date())
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getEmployeeAttendance('self');
      setRecords(list);
      const todayRec = list.find((r) => r.date === today);
      if (todayRec) {
        setStatusInput(todayRec.status);
        setNotesInput(todayRec.notes || '');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data absensi.');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  if (!user) return null;

  const todayRecord = records.find((r) => r.date === today);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const nowTime = getCurrentTimeStr();
      await api.upsertSelfEmployeeAttendance({
        userId: user.id,
        date: today,
        check_in_time: todayRecord?.check_in_time || nowTime,
        check_out_time: todayRecord?.check_out_time || null,
        status: statusInput,
        notes: notesInput.trim() || null,
      });
      await loadRecords();
      setFeedback('Absensi masuk Anda berhasil disimpan.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan absensi.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const nowTime = getCurrentTimeStr();
      await api.upsertSelfEmployeeAttendance({
        userId: user.id,
        date: today,
        check_in_time: todayRecord.check_in_time,
        check_out_time: nowTime,
        status: todayRecord.status,
        notes: notesInput.trim() || todayRecord.notes,
      });
      await loadRecords();
      setFeedback(`Absensi pulang tercatat pada pukul ${nowTime} WIB.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat jam pulang.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Self Check-In/Out Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-2">
              <Clock className="w-4 h-4" />
              <span>Presensi Mandiri Karyawan</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{user.full_name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {ROLE_LABELS[user.role]}
              {user.unit_kerja ? ` · ${user.unit_kerja}` : ''}
              {user.nip ? ` · NIP ${user.nip}` : ''}
            </p>

            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">
                {formatIndonesianDate(today)}
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {clock} <span className="text-sm font-normal text-slate-500">WIB</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs text-slate-500">Jam Masuk Hari Ini</span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5 block">
                {todayRecord?.check_in_time || '--:--'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Jam Pulang Hari Ini</span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5 block">
                {todayRecord?.check_out_time || '--:--'}
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleCheckIn}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Formulir Kehadiran Hari Ini
            </h3>

            {feedback && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Status Kehadiran
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['hadir', 'terlambat', 'izin', 'sakit'] as EmployeeAttendanceStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusInput(st)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        statusInput === st
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {EMPLOYEE_STATUS_LABEL[st]}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan / Keterangan (Opsional)
              </label>
              <textarea
                rows={3}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Contoh: Mengajar di Lab TKJ, tugas dinas luar, atau alasan izin/sakit"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {saving
                  ? 'Menyimpan...'
                  : todayRecord
                  ? 'Perbarui Status Masuk'
                  : 'Absen Masuk Sekarang'}
              </span>
            </button>

            {todayRecord && (
              <button
                type="button"
                disabled={saving}
                onClick={handleCheckOut}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 disabled:opacity-60 transition-colors cursor-pointer"
              >
                <LogOutIcon className="w-4 h-4" />
                <span>
                  {todayRecord.check_out_time ? 'Perbarui Jam Pulang' : 'Catat Absen Pulang'}
                </span>
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Personal Attendance History Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Riwayat Absensi Karyawan Pribadi
          </h3>
          <span className="text-xs text-slate-500 tabular-nums">
            Total {records.length} catatan
          </span>
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
                    Memuat data absensi...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                    Belum ada catatan absensi karyawan.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-medium text-slate-900 whitespace-nowrap">
                      {formatIndonesianDate(rec.date)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {rec.check_in_time || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {rec.check_out_time || '-'}
                    </td>
                    <td className={`py-3 px-4 text-xs ${getStatusTextColor(rec.status)}`}>
                      {EMPLOYEE_STATUS_LABEL[rec.status]}
                    </td>
                    <td className="py-3 px-6 text-xs text-slate-600">{rec.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
