import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {api} from '../../services/api';
import type {Student, StudentAttendanceRecord} from '../../types';
import {
  formatIndonesianDate,
  getStatusTextColor,
  STUDENT_STATUS_LABEL,
} from '../../utils/format';

export function StudentDetailPage() {
  const {id} = useParams<{id: string}>();
  const [student, setStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [allStudents, allAttendance] = await Promise.all([
          api.getStudents(),
          api.getStudentAttendance(),
        ]);
        if (!active) return;
        setStudent(allStudents.find((s) => s.id === id) || null);
        setRecords(allAttendance.filter((a) => a.student_id === id));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
        Memuat detail siswa...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-900">Data siswa tidak ditemukan.</p>
        <Link
          to="/app/data-siswa"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Data Siswa</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/app/data-siswa"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Data Siswa</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
          <p className="text-xs text-slate-600 mt-1 font-mono">
            NIS {student.nis} · {student.kelas} · Jurusan {student.jurusan}
          </p>
        </div>

        <Link
          to={`/app/absensi-siswa/${encodeURIComponent(student.kelas)}`}
          className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors self-start sm:self-auto"
        >
          Absen Kelas {student.kelas}
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Riwayat Kehadiran Siswa</h3>
          <span className="text-xs text-slate-500 tabular-nums">{records.length} catatan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-6 font-semibold">Tanggal</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Dicatat Oleh</th>
                <th className="py-3 px-6 font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-slate-500">
                    Belum ada catatan absensi untuk siswa ini.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-medium text-slate-900">
                      {formatIndonesianDate(r.date)}
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
        </div>
      </div>
    </div>
  );
}
