import type {EmployeeAttendanceStatus, StudentAttendanceStatus} from '../types';

export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeAttendanceStatus, string> = {
  hadir: 'Hadir',
  terlambat: 'Terlambat',
  izin: 'Izin',
  sakit: 'Sakit',
  alpha: 'Alpha',
};

export const STUDENT_STATUS_LABEL: Record<StudentAttendanceStatus, string> = {
  hadir: 'Hadir',
  izin: 'Izin',
  sakit: 'Sakit',
  alpha: 'Alpha',
};

export function getStatusTextColor(
  status: EmployeeAttendanceStatus | StudentAttendanceStatus
): string {
  switch (status) {
    case 'hadir':
      return 'text-emerald-700 font-semibold';
    case 'terlambat':
      return 'text-amber-700 font-semibold';
    case 'izin':
      return 'text-sky-700 font-semibold';
    case 'sakit':
      return 'text-amber-700 font-semibold';
    case 'alpha':
      return 'text-red-700 font-semibold';
    default:
      return 'text-slate-700 font-semibold';
  }
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const escape = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
