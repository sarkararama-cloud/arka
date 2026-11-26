import React, {useState} from 'react';
import {Link, NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {ROLE_LABELS} from '../types';

export function AppLayout() {
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rekapExpanded, setRekapExpanded] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isGuru = user.role === 'guru';
  const canAccessRekap = isAdmin || isGuru;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', {replace: true});
    } finally {
      setLoggingOut(false);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/app' || path === '/app/') return 'Dashboard';
    if (path.startsWith('/app/absensi-karyawan')) return 'Absensi Karyawan';
    if (path.startsWith('/app/absensi-siswa')) return 'Absensi Siswa';
    if (path.startsWith('/app/rekap/karyawan')) return 'Rekap Absensi Karyawan';
    if (path.startsWith('/app/rekap/siswa')) return 'Rekap Absensi Siswa';
    if (path.startsWith('/app/data-siswa') || path.startsWith('/app/siswa/'))
      return 'Data Siswa';
    if (path.startsWith('/app/users')) return 'User Management';
    return 'Portal Absensi';
  };

  const navLinkClass = ({isActive}: {isActive: boolean}) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-red-600 text-white'
        : 'text-slate-700 hover:bg-red-50 hover:text-red-700'
    }`;

  const subNavLinkClass = ({isActive}: {isActive: boolean}) =>
    `flex items-center gap-2.5 pl-10 pr-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-red-50 text-red-700 font-semibold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const renderSidebarContent = () => (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
        <Link
          to="/app"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900 whitespace-nowrap"
        >
          <span className="w-2.5 h-6 bg-red-600 rounded-xs inline-block" aria-hidden="true" />
          <span>SMK Prima Unggul</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900"
          aria-label="Tutup menu samping"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavLink
          to="/app"
          end
          onClick={() => setSidebarOpen(false)}
          className={navLinkClass}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/app/absensi-karyawan"
          onClick={() => setSidebarOpen(false)}
          className={navLinkClass}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Absensi Karyawan</span>
        </NavLink>

        {(isAdmin || isGuru) && (
          <NavLink
            to="/app/absensi-siswa"
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>Absensi Siswa</span>
          </NavLink>
        )}

        {canAccessRekap && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setRekapExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 whitespace-nowrap">
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Rekap Absensi</span>
              </span>
              {rekapExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {rekapExpanded && (
              <div className="mt-1 space-y-1">
                {isAdmin && (
                  <NavLink
                    to="/app/rekap/karyawan"
                    onClick={() => setSidebarOpen(false)}
                    className={subNavLinkClass}
                  >
                    <span>Absensi Karyawan</span>
                  </NavLink>
                )}
                <NavLink
                  to="/app/rekap/siswa"
                  onClick={() => setSidebarOpen(false)}
                  className={subNavLinkClass}
                >
                  <span>Absensi Siswa</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <>
            <NavLink
              to="/app/data-siswa"
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Data Siswa</span>
            </NavLink>

            <NavLink
              to="/app/users"
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>User Management</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom Profile Identity */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <p className="text-sm font-semibold text-slate-900 truncate">{user.full_name}</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
          <span className="text-red-700 font-medium">{ROLE_LABELS[user.role]}</span>
          {user.nip && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{user.nip}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] h-full z-50">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header with Breadcrumb Left & Logout Right (Kanan Atas) */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
                Portal Absensi
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-bold text-slate-900 truncate">{getPageTitle()}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:block text-right">
              <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">
                {user.full_name}
              </p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Keluar...' : 'Logout'}</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
