import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider } from './contexts/AppContext';
import { ToastContainer } from './components/Toast';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Employees from './pages/Employees';
import WorkLocations from './pages/WorkLocations';
import Assignments from './pages/Assignments';
import Attendance from './pages/Attendance';
import ReviewQueue from './pages/ReviewQueue';
import FaceProfiles from './pages/FaceProfiles';
import WebAuthnCredentials from './pages/WebAuthnCredentials';
import RegisteredDevices from './pages/RegisteredDevices';
import SecurityCenter from './pages/SecurityCenter';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import SystemSettings from './pages/SystemSettings';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import AttendanceAnalytics from './pages/AttendanceAnalytics';
import LeaveRequests from './pages/LeaveRequests';
import OvertimeRequests from './pages/OvertimeRequests';

import DashboardLayout from './layouts/DashboardLayout';
import { PrivateRoute, ProtectedRoute } from './routes/PrivateRoute';
import RoleGuard from './routes/RoleGuard';

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Redirect root and legacy non-admin routes to /admin/... */}
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/employees" element={<Navigate to="/admin/employees" replace />} />
              <Route path="/departments" element={<Navigate to="/admin/departments" replace />} />
              <Route path="/locations" element={<Navigate to="/admin/work-locations" replace />} />
              <Route path="/assignments" element={<Navigate to="/admin/assignments" replace />} />
              <Route path="/attendance" element={<Navigate to="/admin/attendance" replace />} />
              <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
              <Route path="/leave" element={<Navigate to="/admin/leave" replace />} />
              <Route path="/ot" element={<Navigate to="/admin/ot" replace />} />
              <Route path="/review-queue" element={<Navigate to="/admin/review-queue" replace />} />

              {/* Public Routes (Redirect to dashboard if already logged in) */}
              <Route element={<PrivateRoute />}>
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Protected Management Routes */}
              <Route element={<ProtectedRoute />}>
                {/* Manager and higher level routes */}
                <Route element={<RoleGuard requiredMinRole="MANAGER" />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/admin/dashboard" element={<Dashboard />} />
                    <Route path="/admin/departments" element={<Departments />} />
                    <Route path="/admin/employees" element={<Employees />} />
                    <Route path="/admin/work-locations" element={<WorkLocations />} />
                    <Route path="/admin/assignments" element={<Assignments />} />
                    <Route path="/admin/attendance" element={<Attendance />} />
                    <Route path="/admin/attendance-analytics" element={<Reports defaultTab="employee-stats" />} />
                    <Route path="/admin/review-queue" element={<ReviewQueue />} />
                    <Route path="/admin/reports" element={<Reports defaultTab="payroll" />} />
                    <Route path="/admin/face-profiles" element={<FaceProfiles />} />
                    <Route path="/admin/webauthn-credentials" element={<WebAuthnCredentials />} />
                    <Route path="/admin/registered-devices" element={<RegisteredDevices />} />
                    <Route path="/admin/notifications" element={<Notifications />} />
                    <Route path="/admin/leave" element={<LeaveRequests />} />
                    <Route path="/admin/ot" element={<OvertimeRequests />} />
                  </Route>
                </Route>

                {/* Admin and higher level routes */}
                <Route element={<RoleGuard requiredMinRole="ADMIN" />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/admin/security-center" element={<SecurityCenter />} />
                  </Route>
                </Route>

                {/* SUPMANAGER Only routes */}
                <Route element={<RoleGuard requiredMinRole="SUPMANAGER" />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/admin/audit-logs" element={<AuditLogs />} />
                    <Route path="/admin/settings" element={<SystemSettings />} />
                  </Route>
                </Route>
              </Route>

              {/* Unauthorized Page */}
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Fallback 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
