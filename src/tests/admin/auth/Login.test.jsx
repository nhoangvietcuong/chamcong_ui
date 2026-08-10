import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Login from '../../../pages/Login';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AppProvider } from '../../../contexts/AppContext';
import authService from '../../../services/authService';

// Mock authService
vi.mock('../../../services/authService', () => ({
  default: {
    login: vi.fn(),
    me: vi.fn(() => Promise.resolve({ success: false })),
    logout: vi.fn(),
  },
  authService: {
    login: vi.fn(),
    me: vi.fn(() => Promise.resolve({ success: false })),
    logout: vi.fn(),
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLogin = () => {
  return render(
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  );
};

describe('React Admin Login Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('1. Render Form correctly', () => {
    renderLogin();
    expect(screen.getByLabelText(/Tên đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng nhập/i })).toBeInTheDocument();
  });

  test('2. Show validation errors on empty submission', async () => {
    renderLogin();
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập/i });
    userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập tên đăng nhập')).toBeInTheDocument();
      expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeInTheDocument();
    });
  });

  test('3. Handle incorrect username/password (Login Failure)', async () => {
    authService.login.mockRejectedValueOnce(new Error('Tên đăng nhập hoặc mật khẩu không hợp lệ.'));
    renderLogin();

    const usernameInput = screen.getByLabelText(/Tên đăng nhập/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập/i });

    await userEvent.type(usernameInput, 'wronguser');
    await userEvent.type(passwordInput, 'wrongpass');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('wronguser', 'wrongpass');
    });
  });

  test('4. Show loading state during submission', async () => {
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    authService.login.mockImplementationOnce(() => loginPromise);

    renderLogin();

    const usernameInput = screen.getByLabelText(/Tên đăng nhập/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập/i });

    await userEvent.type(usernameInput, 'admin');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitBtn);

    // Button should display loading or be disabled during active login
    expect(submitBtn).toBeDisabled();

    // Resolve the promise
    resolveLogin({ success: true, data: { accessToken: 'token123', refreshToken: 'ref123', user: { role: 'ADMIN' } } });
  });

  test('5. Redirect to dashboard on successful login', async () => {
    authService.login.mockResolvedValueOnce({
      success: true,
      data: {
        accessToken: 'token123',
        refreshToken: 'ref123',
        user: { username: 'admin', role: 'ADMIN' }
      }
    });

    renderLogin();

    const usernameInput = screen.getByLabelText(/Tên đăng nhập/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập/i });

    await userEvent.type(usernameInput, 'admin');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('admin', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });
});
