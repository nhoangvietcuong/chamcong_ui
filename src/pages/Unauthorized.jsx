import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiArrowLeft, FiLogOut } from 'react-icons/fi';
import Button from '../components/Button';
import { AuthContext } from '../contexts/AuthContext';

export const Unauthorized = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleBack = async () => {
    if (user?.role === 'EMPLOYEE') {
      // If it's an employee, log them out to return to login screen
      await logout();
      navigate('/login');
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#080d19] text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-lg flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 flex items-center justify-center">
          <FiShield className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-150">
            Truy cập bị từ chối
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {user?.role === 'EMPLOYEE'
              ? 'Tài khoản nhân viên không có quyền truy cập trang quản trị này. Vui lòng đăng nhập bằng tài khoản quản lý hoặc quản trị viên.'
              : 'Tài khoản của bạn không có đủ quyền hạn để truy cập mục này. Vui lòng liên hệ Admin hệ thống để cấp quyền nếu cần thiết.'}
          </p>
        </div>
        <Button
          variant="primary"
          icon={user?.role === 'EMPLOYEE' ? <FiLogOut className="w-4 h-4" /> : <FiArrowLeft className="w-4 h-4" />}
          className="w-full"
          onClick={handleBack}
        >
          {user?.role === 'EMPLOYEE' ? 'Đăng xuất & Quay lại đăng nhập' : 'Quay lại trang chính'}
        </Button>
      </div>
    </div>
  );
};


export default Unauthorized;
