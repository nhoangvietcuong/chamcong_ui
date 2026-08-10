import React from 'react';
import clsx from 'clsx';

export const StatusBadge = ({ type, value }) => {
  let text = String(value);
  let colorClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';

  if (type === 'activeStatus') {
    const val = parseInt(value, 10);
    if (val === 1) {
      text = 'Đang hoạt động';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/10';
    } else {
      text = 'Bị khóa';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-500/10';
    }
  } else if (type === 'assignment') {
    if (value === 'ASSIGNED') {
      text = 'Đã phân công';
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-500/10';
    } else if (value === 'CANCELLED') {
      text = 'Đã hủy';
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-500/10';
    } else if (value === 'COMPLETED') {
      text = 'Đã hoàn thành';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/10';
    }
  } else if (type === 'attendance') {
    if (value === 'IN_PROGRESS') {
      text = 'Đang làm việc';
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-500/10';
    } else if (value === 'MISSED_CHECK_OUT') {
      text = 'Quên check out';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-500/10';
    } else if (value === 'COMPLETED') {
      text = 'Hoàn thành';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/10';
    } else if (value === 'LATE') {
      text = 'Đi muộn';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-500/10';
    } else if (value === 'LEFT_EARLY') {
      text = 'Về sớm';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-500/10';
    } else if (value === 'LATE_AND_LEFT_EARLY') {
      text = 'Đi muộn/Về sớm';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-500/10';
    } else if (value === 'INVALID') {
      text = 'Không hợp lệ';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-500/10';
    } else if (value === 'REVIEW_REQUIRED') {
      text = 'Cần kiểm duyệt';
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-500/10';
    }
  } else if (type === 'review') {
    if (value === 'NOT_REQUIRED') {
      text = 'Không yêu cầu';
      colorClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    } else if (value === 'PENDING') {
      text = 'Chờ duyệt';
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-500/10';
    } else if (value === 'APPROVED') {
      text = 'Đã duyệt';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/10';
    } else if (value === 'REJECTED') {
      text = 'Từ chối';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-500/10';
    }
  } else if (type === 'role') {
    if (value === 'SUPMANAGER') {
      text = 'Super Manager';
      colorClass = 'bg-violet-100 text-violet-800 dark:bg-violet-950/35 dark:text-violet-300 border-violet-200/50';
    } else if (value === 'ADMIN') {
      text = 'Admin';
      colorClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/35 dark:text-rose-300';
    } else if (value === 'MANAGER') {
      text = 'Manager';
      colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/35 dark:text-blue-300';
    } else {
      text = 'Nhân viên';
      colorClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        colorClass
      )}
    >
      {text}
    </span>
  );
};

export default StatusBadge;
