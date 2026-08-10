import React, { useState } from 'react';
import { FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export const MissingApiAlert = ({
  featureName = 'Chức năng này',
  method = 'GET',
  url = '/api/admin/...',
  description = 'API phục vụ dữ liệu nghiệp vụ cho màn hình quản trị.',
  requestBody = null,
  responseSchema = { success: true, message: 'Thành công', data: {} },
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-5 rounded-2xl border border-amber-250 bg-amber-50/70 dark:bg-amber-955/10 dark:border-amber-500/20 text-left w-full">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
          <FiAlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">
            Tính năng "{featureName}" chưa có API Backend!
          </h4>
          <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 leading-relaxed">
            Theo quy tắc phát triển hệ thống, chúng tôi không tạo dữ liệu giả (Mock Data) hoặc API giả ở phía Client. Để tính năng này hoạt động, đội ngũ phát triển Backend cần xây dựng endpoint sau:
          </p>

          <div className="flex items-center gap-2 mt-3 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-850 dark:bg-amber-900/40 dark:text-amber-300 font-bold uppercase">
              {method}
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold select-all">
              {url}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">
            <strong>Mô tả nghiệp vụ:</strong> {description}
          </p>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-400 mt-4 hover:underline"
          >
            {isOpen ? 'Ẩn tài liệu đặc tả API' : 'Xem tài liệu đặc tả API'}
            {isOpen ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isOpen && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto flex flex-col gap-3 border border-slate-800">
              {requestBody && (
                <div>
                  <span className="text-amber-400">// Request Payload Body:</span>
                  <pre className="mt-1">{JSON.stringify(requestBody, null, 2)}</pre>
                </div>
              )}
              <div>
                <span className="text-emerald-400">// Expected Success Response format (200 OK):</span>
                <pre className="mt-1">{JSON.stringify(responseSchema, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissingApiAlert;
