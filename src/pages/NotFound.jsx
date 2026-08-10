import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertOctagon, FiArrowLeft } from 'react-icons/fi';
import Button from '../components/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#080d19] text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-lg flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-650 dark:text-amber-400 flex items-center justify-center">
          <FiAlertOctagon className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-150">
            Không tìm thấy trang
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Đường dẫn (URL) này không tồn tại hoặc đã bị thay đổi vị trí. Vui lòng kiểm tra lại đường dẫn chính xác.
          </p>
        </div>
        <Link to="/admin/dashboard" className="w-full">
          <Button variant="primary" icon={<FiArrowLeft className="w-4 h-4" />} className="w-full">
            Quay lại trang chính
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
