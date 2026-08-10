import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

export const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const nameMap = {
    admin: 'Quản trị',
    dashboard: 'Tổng quan',
    departments: 'Phòng ban',
    employees: 'Nhân viên',
    'work-locations': 'Địa điểm',
    assignments: 'Phân công',
    'review-queue': 'Kiểm duyệt',
    notifications: 'Thông báo',
  };

  return (
    <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 py-3">
      <ol className="inline-flex items-center space-x-1 md:space-x-1.5">
        <li className="inline-flex items-center">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <FiHome className="mr-1 h-3.5 w-3.5" />
            Trang chủ
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isNumeric = !isNaN(value);

          const displayName = isNumeric ? 'Chi tiết' : (nameMap[value] || value);
          
          if (value === 'admin' && pathnames[index + 1] === 'dashboard') return null;
          if (value === 'admin') return null;

          return (
            <li key={to} className="flex items-center">
              <FiChevronRight className="h-3.5 w-3.5 text-slate-450 shrink-0 mx-0.5" />
              {last ? (
                <span className="font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                  {displayName}
                </span>
              ) : (
                <Link
                  to={to}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors uppercase tracking-wide"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
