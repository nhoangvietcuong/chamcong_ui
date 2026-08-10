import React, { useState, useEffect } from 'react';
import { FiX, FiMail, FiPhone, FiKey, FiLock } from 'react-icons/fi';
import api from '../services/api';

export const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState('EMAIL');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleRequestOtpWithChannel = async (selectedChannel) => {
    if (!identifier || !identifier.trim()) {
      setError('Vui lòng nhập Tên đăng nhập, Email hoặc Số điện thoại.');
      return;
    }
    setError(null);
    setLoading(true);
    setChannel(selectedChannel);
    try {
      const res = await api.post('/auth/forgot-password/request-otp', { identifier, channel: selectedChannel });
      setInfoMessage(res.message);
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi yêu cầu mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    handleRequestOtpWithChannel(channel);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Mã OTP phải bao gồm đúng 6 chữ số.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/verify-otp', { identifier, otpCode });
      setResetToken(res.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/reset', { resetToken, newPassword });
      setInfoMessage(res.message);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setIdentifier('');
    setOtpCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setInfoMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-200 dark:border-slate-800 text-left">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
          <FiKey className="text-primary-600" />
          Khôi Phục Mật Khẩu
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {step === 1 && 'Nhập thông tin tài khoản và chọn phương thức nhận mã xác thực'}
          {step === 2 && 'Nhập mã xác thực OTP 6 chữ số đã được gửi cho bạn'}
          {step === 3 && 'Tạo mật khẩu mới cho tài khoản của bạn'}
          {step === 4 && 'Hoàn tất đặt lại mật khẩu'}
        </p>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {infoMessage && step !== 4 && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-xl text-xs">
            ℹ️ {infoMessage}
          </div>
        )}

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email / Số điện thoại
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ví dụ: email@company.com hoặc 0912345678"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Bấm chọn phương thức để nhận mã OTP
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleRequestOtpWithChannel('EMAIL')}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-primary-600 bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 text-primary-600 dark:text-primary-400 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <FiMail className="w-4 h-4" />
                  {loading && channel === 'EMAIL' ? 'Đang gửi...' : 'Gửi qua Gmail'}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleRequestOtpWithChannel('SMS')}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-primary-600 bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 text-primary-600 dark:text-primary-400 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <FiPhone className="w-4 h-4" />
                  {loading && channel === 'SMS' ? 'Đang gửi...' : 'Gửi qua SMS'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Đang gửi mã...' : 'Xác nhận Gửi OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nhập mã OTP 6 chữ số
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="• • • • • •"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-center text-xl font-mono font-bold tracking-widest text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Không nhận được mã?</span>
              {countdown > 0 ? (
                <span className="font-mono text-slate-400">Gửi lại sau {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="text-primary-600 font-bold hover:underline"
                >
                  Gửi lại OTP
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Đang cập nhật...' : 'Xác nhận Đặt lại Mật khẩu'}
            </button>
          </form>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Đặt lại mật khẩu thành công!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 px-2 leading-relaxed">
              Mật khẩu của bạn đã được cập nhật. Vì lý do bảo mật, <strong>tất cả các thiết bị đang đăng nhập tài khoản này đã bị đăng xuất</strong>.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors mt-2"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
