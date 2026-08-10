import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiUser, FiLock, FiMonitor } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import useApp from '../hooks/useApp';
import Input from '../components/Input';
import Button from '../components/Button';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { getDeviceName } from '../services/api';
import { loginSchema } from '../validators/loginValidator';


export const Login = () => {
  const { login } = useAuth();
  const { toast } = useApp();
  const navigate = useNavigate();
  const deviceName = getDeviceName();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    }
  });

  const onSubmit = async (data) => {
    const result = await login(data.username, data.password);
    if (result.success) {
      toast.success('Đăng nhập thành công!');
      navigate('/admin/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#080d19]">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xl p-8 flex flex-col gap-6 text-center animate-fade-in">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary-500/20">
            CC
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2">
            Hệ thống Chấm công PWA
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dành cho Admin và Ban quản lý
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Tên đăng nhập"
            name="username"
            placeholder="Nhập tên đăng nhập..."
            icon={<FiUser className="w-4 h-4" />}
            error={errors.username}
            {...register('username')}
          />
          <div className="relative">
            <Input
              label="Mật khẩu"
              name="password"
              type="password"
              placeholder="Nhập mật khẩu..."
              icon={<FiLock className="w-4 h-4" />}
              error={errors.password}
              {...register('password')}
            />
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="w-full mt-2"
          >
            Đăng nhập
          </Button>
        </form>

        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />

        {/* Footer Info */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-center gap-2 text-left">
          <FiMonitor className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex flex-col text-[10px] text-slate-500">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Thiết bị ghi nhận:</span>
            <span>{deviceName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
