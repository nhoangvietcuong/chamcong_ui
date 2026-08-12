import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiGrid, FiBriefcase, FiUsers, FiMapPin, FiCalendar,
  FiCheckSquare, FiBell, FiSun, FiMoon, FiLogOut, FiMenu, FiX,
  FiActivity, FiSmile, FiKey, FiMonitor, FiShield, FiFileText,
  FiSettings, FiLayers
} from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import useApp from '../hooks/useApp';
import Avatar from '../components/Avatar';
import Breadcrumb from '../components/Breadcrumb';
import LoadingOverlay from '../components/Loading';
import clsx from 'clsx';
import logo from "../assets/1.png";
import { hasMinRole } from '../utils/role.utils';


export const DashboardLayout = () => {
  const { user, logout, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { globalLoading } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);

  const menuItems = [
    { name: 'Tổng quan', path: '/admin/dashboard', icon: <FiGrid className="w-4 h-4" /> },
    { name: 'Phòng ban', path: '/admin/departments', icon: <FiBriefcase className="w-4 h-4" /> },
    { name: 'Nhân viên', path: '/admin/employees', icon: <FiUsers className="w-4 h-4" /> },
    { name: 'Địa điểm', path: '/admin/work-locations', icon: <FiMapPin className="w-4 h-4" /> },
    { name: 'Phân công', path: '/admin/assignments', icon: <FiCalendar className="w-4 h-4" /> },
    { name: 'Kiểm duyệt', path: '/admin/review-queue', icon: <FiCheckSquare className="w-4 h-4" /> },
    { name: 'Bảng công tháng', path: '/admin/reports', icon: <FiCalendar className="w-4 h-4" /> },
    { name: 'Lịch sử chấm công', path: '/admin/attendance', icon: <FiActivity className="w-4 h-4" /> },
    { name: 'Kiểm duyệt tăng ca', path: '/admin/ot', icon: <FiFileText className="w-4 h-4" /> },
    { name: 'Kiểm duyệt nghỉ phép', path: '/admin/leave', icon: <FiFileText className="w-4 h-4" /> },
    { name: 'Thống kê công nhân viên', path: '/admin/attendance-analytics', icon: <FiActivity className="w-4 h-4" /> },
    { name: 'Hồ sơ khuôn mặt', path: '/admin/face-profiles', icon: <FiSmile className="w-4 h-4" /> },
    //{ name: 'Khóa sinh trắc', path: '/admin/webauthn-credentials', icon: <FiKey className="w-4 h-4" /> },
    { name: 'Thiết bị đăng ký', path: '/admin/registered-devices', icon: <FiMonitor className="w-4 h-4" /> },
    { name: 'Trung tâm bảo mật', path: '/admin/security-center', icon: <FiShield className="w-4 h-4" />, minRole: 'ADMIN' },
    { name: 'Nhật ký hệ thống', path: '/admin/audit-logs', icon: <FiLayers className="w-4 h-4" />, minRole: 'SUPMANAGER' },
    { name: 'Cấu hình tham số', path: '/admin/settings', icon: <FiSettings className="w-4 h-4" />, minRole: 'SUPMANAGER' },
    { name: 'Thông báo', path: '/admin/notifications', icon: <FiBell className="w-4 h-4" /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close mobile sidebar and scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    setMobileOpen(false);
  }, [location.pathname]);

  const renderSidebarContent = () => {
    const filteredMenuItems = menuItems.filter((item) => {
      if (!item.minRole) return true;
      return hasMinRole(role, item.minRole);
    });

    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-primary-500/30">
            <img
              src={logo}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-white tracking-wide"> PHC SOLUTIONS</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">chamcong</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-205",
                  isActive
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-500/10"
                    : "hover:bg-slate-850 hover:text-white text-slate-400"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-left">
            <Avatar name={user?.fullName} size="sm" />
            <div className="flex flex-col max-w-[120px]">
              <span className="text-xs font-semibold text-white truncate">{user?.fullName}</span>
              <span className="text-[9px] text-slate-500 capitalize">{user?.role?.toLowerCase()}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-455 hover:bg-rose-500/10 transition-all duration-200"
          >
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#080d19]">
      <LoadingOverlay active={globalLoading} />

      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden lg:block w-64 h-full shrink-0">
        {renderSidebarContent()}
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />
          {/* Slide panel */}
          <div className="relative w-64 h-full animate-fade-in">
            {renderSidebarContent()}
            {/* Close button inside panel */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-[-48px] p-2 rounded-xl bg-slate-900 text-white border border-slate-800"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {theme === 'dark' ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4" />}
            </button>

            {/* Notifications icon */}
            <Link
              to="/admin/notifications"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative transition-colors"
            >
              <FiBell className="w-4 h-4" />
              {/* Optional unread bubble */}
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </Link>
          </div>
        </header>


        {/* Content Wrapper */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-6 min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

// Internal class Error Boundary for layouts
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/30 text-center max-w-xl mx-auto my-12">
          <h2 className="text-lg font-bold text-rose-800 dark:text-rose-455 mb-2">Đã xảy ra lỗi hệ thống!</h2>
          <p className="text-sm text-rose-700/80 dark:text-rose-550/95 mb-6">
            Trang web gặp sự cố hiển thị. Chi tiết: {this.state.error?.message || 'Lỗi không rõ'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardLayout;
