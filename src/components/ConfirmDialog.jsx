import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { FiAlertTriangle } from 'react-icons/fi';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này? Hành động này không thể hoàn tác.',
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  type = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
          <FiAlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full mt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={type === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
