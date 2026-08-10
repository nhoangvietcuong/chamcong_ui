import { useState, useCallback } from 'react';

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const ask = useCallback((options = {}) => {
    setTitle(options.title || 'Xác nhận hành động');
    setMessage(options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?');
    setOnConfirm(() => options.onConfirm || (() => {}));
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const confirm = useCallback(() => {
    onConfirm();
    setIsOpen(false);
  }, [onConfirm]);

  return { isOpen, title, message, ask, close, confirm };
};

export default useConfirmDialog;
