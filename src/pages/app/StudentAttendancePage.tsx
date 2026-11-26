import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {CheckCircle2, Save, Search} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {api, getTodayDateStr} from '../../services/api';
import type {JurusanCode, Student, StudentAttendanceStatus} from '../../types';
import {JURUSAN_LIST} from '../../types';
import {STUDENT_STATUS_LABEL} from '../../utils/format';

export function StudentAttendancePage() {
  const {user} = useAuth();
  const {kelas: routeKelas} = useParams<{kelas?: string}>();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [selectedJurusan, setSelectedJurusan] = useState<JurusanCode | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [draftMap, setDraftMap] = useState<
    Record<string, {status: StudentAttendanceStatus; notes: string}>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decodedKelas = routeKelas ? decodeURIComponent(routeKelas) : 'ALL';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentList, existingAttendance] = await Promise.all([
        api.getStudents(),
        api.getStudentAttendance(selectedDate),
      ]);
      setStudents(studentList);

      const nextDraft: Record<string, {status: StudentAttendanceStatus; notes: string}> = {};
      const existingMap = new Map(existingAttendance.map((a) => [a.student_id, a]));

      for (const s of studentList) {
        const rec = existingMap.get(s.id);
        nextDraft[s.id] = {
          status: rec ? rec.status : 'hadir',
          notes: rec?.notes || '',
        };
      }
      setDraftMap(nextDraft);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data absensi siswa.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.kelas))).sort(),
    [students]
  );

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (decodedKelas !== 'ALL' && s.kelas !== decodedKelas) return false;
      if (selectedJurusan !== 'ALL' && s.jurusan !== selectedJurusan) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.nis.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [students, decodedKelas, selectedJurusan, searchQuery]);

  if (!user) return null;

  const setStudentStatus = (studentId: string, status: StudentAttendanceStatus) => {
    setDraftMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || '',
      },
    }));
  };

  const setStudentNotes = (studentId: string, notes: string) => {
    setDraftMap((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'hadir',
        notes,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setDraftMap((prev) => {
      const next = {...prev};
      for (const s of filteredStudents) {
        next[s.id] = {
          status: 'hadir',
          notes: prev[s.id]?.notes || '',
        };
      }
      return next;
    });
  };

  const handleSaveBatch = async () => {
    if (filteredStudents.length === 0) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const entries = filteredStudents.map((s) => ({
        student_id: s.id,
        date: selectedDate,
        status: draftMap[s.id]?.status || 'hadir',
        notes: draftMap[s.id]?.notes || '',
      }));
      await api.saveStudentAttendanceBatch(user.id, entries);
      setFeedback(`Berhasil menyimpan absensi untuk ${entries.length} siswa pada ${selectedDate}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan absensi siswa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Action Toolbar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Pencatatan Absensi Siswa {decodedKelas !== 'ALL' ? `· ${decodedKelas}` : ''}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih tanggal dan kelas untuk menginput status kehadiran siswa secara langsung.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={filteredStudents.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Tandai Semua Hadir
            </button>
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={saving || filteredStudents.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Absensi Siswa'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Filter Kelas (Rute Dinamis)
            </label>
            <select
              value={decodedKelas}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') {
                  navigate('/app/absensi-siswa');
                } else {
                  navigate(`/app/absensi-siswa/${encodeURIComponent(val)}`);
                }
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
            >
              <option value="ALL">Semua Kelas</option>
              {classOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jurusan</label>
            <select
              value={selectedJurusan}
              onChange={(e) => setSelectedJurusan(e.target.value as JurusanCode | 'ALL')}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
            >
              <option value="ALL">Semua Jurusan</option>
              {JURUSAN_LIST.map((j) => (
                <option key={j.code} value={j.code}>
                  {j.code} - {j.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cari NIS / Nama
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau NIS..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>
          </div>
        </div>

        {feedback && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}
      </section>

      {/* Students Attendance Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-6 font-semibold">NIS</th>
                <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                <th className="py-3 px-4 font-semibold">Kelas</th>
                <th className="py-3 px-4 font-semibold">Status Kehadiran</th>
                <th className="py-3 px-6 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                    Memuat daftar siswa...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                    Tidak ada siswa yang sesuai dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const entry = draftMap[student.id] || {status: 'hadir', notes: ''};
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-6 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {student.nis}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {student.name}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {student.kelas} · {student.jurusan}
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                          {(['hadir', 'izin', 'sakit', 'alpha'] as StudentAttendanceStatus[]).map(
                            (st) => {
                              const active = entry.status === st;
                              const activeStyle =
                                st === 'hadir'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'alpha'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-amber-600 text-white';
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setStudentStatus(student.id, st)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                                    active
                                      ? activeStyle
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {STUDENT_STATUS_LABEL[st]}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 min-w-[200px]">
                        <input
                          type="text"
                          value={entry.notes}
                          onChange={(e) => setStudentNotes(student.id, e.target.value)}
                          placeholder="Catatan opsional..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
