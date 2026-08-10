import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import App from '../../../App';
import useAuth from '../../../hooks/useAuth';

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  default: vi.fn(),
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth;

describe('React Admin Routing & Authorization Guards Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('1. Redirect unauthenticated user accessing protected route to login', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      role: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    // Point history to protected dashboard route
    window.history.pushState({}, '', '/admin/dashboard');

    render(<App />);

    await waitFor(() => {
      // Should show login form elements because it redirected
      expect(screen.getByText('Dành cho Admin và Ban quản lý')).toBeInTheDocument();
      expect(screen.queryByText('PHC SOLUTIONS')).not.toBeInTheDocument();
    });
  });

  test('2. Redirect authenticated user accessing login route to dashboard', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { username: 'admin', role: 'ADMIN', fullName: 'System Admin' },
      role: 'ADMIN',
      login: vi.fn(),
      logout: vi.fn(),
    });

    // Point history to public login route
    window.history.pushState({}, '', '/login');

    render(<App />);

    await waitFor(() => {
      // Should show dashboard layout element
      expect(screen.getByText('PHC SOLUTIONS')).toBeInTheDocument();
    });
  });

  test('3. Allow ADMIN/MANAGER role accessing dashboard layout', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { username: 'manager', role: 'MANAGER', fullName: 'Shift Manager' },
      role: 'MANAGER',
      login: vi.fn(),
      logout: vi.fn(),
    });

    window.history.pushState({}, '', '/admin/dashboard');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('PHC SOLUTIONS')).toBeInTheDocument();
      expect(screen.queryByText('Truy cập bị từ chối')).not.toBeInTheDocument();
    });
  });

  test('4. Block EMPLOYEE role from accessing admin routes (Unauthorized page)', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { username: 'employee', role: 'EMPLOYEE', fullName: 'Tech Employee' },
      role: 'EMPLOYEE',
      login: vi.fn(),
      logout: vi.fn(),
    });

    window.history.pushState({}, '', '/admin/dashboard');

    render(<App />);

    await waitFor(() => {
      // Should show Unauthorized page message
      expect(screen.getByText('Truy cập bị từ chối')).toBeInTheDocument();
      expect(screen.getByText(/Tài khoản của bạn không có đủ quyền hạn/i)).toBeInTheDocument();
    });
  });
});
