import React from 'react';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {AuthProvider, useAuth} from './context/AuthContext';
import {LandingPage} from './pages/LandingPage';
import {LoginPage} from './pages/LoginPage';
import {AppLayout} from './layouts/AppLayout';
import {DashboardPage} from './pages/app/DashboardPage';
import {EmployeeAttendancePage} from './pages/app/EmployeeAttendancePage';
import {StudentAttendancePage} from './pages/app/StudentAttendancePage';
import {AttendanceRecapPage} from './pages/app/AttendanceRecapPage';
import {StudentsDataPage} from './pages/app/StudentsDataPage';
import {StudentDetailPage} from './pages/app/StudentDetailPage';
import {UserManagementPage} from './pages/app/UserManagementPage';
import type {UserRole} from './types';

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium text-slate-600">Memuat portal SMK Prima Unggul...</p>
      </div>
    </div>
  );
}

function RequireAuth({children}: {children: React.ReactNode}) {
  const {user, loading} = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: React.ReactNode;
}) {
  const {user, loading} = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function PublicOnlyLogin() {
  const {user, loading} = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (user) return <Navigate to="/app" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicOnlyLogin />} />

          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="absensi-karyawan" element={<EmployeeAttendancePage />} />
            <Route
              path="absensi-siswa"
              element={
                <RequireRole allowed={['admin', 'guru']}>
                  <StudentAttendancePage />
                </RequireRole>
              }
            />
            <Route
              path="absensi-siswa/:kelas"
              element={
                <RequireRole allowed={['admin', 'guru']}>
                  <StudentAttendancePage />
                </RequireRole>
              }
            />
            <Route
              path="rekap/:type"
              element={
                <RequireRole allowed={['admin', 'guru']}>
                  <AttendanceRecapPage />
                </RequireRole>
              }
            />
            <Route
              path="data-siswa"
              element={
                <RequireRole allowed={['admin']}>
                  <StudentsDataPage />
                </RequireRole>
              }
            />
            <Route
              path="siswa/:id"
              element={
                <RequireRole allowed={['admin']}>
                  <StudentDetailPage />
                </RequireRole>
              }
            />
            <Route
              path="users"
              element={
                <RequireRole allowed={['admin']}>
                  <UserManagementPage />
                </RequireRole>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
