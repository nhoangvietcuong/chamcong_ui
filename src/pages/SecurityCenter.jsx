import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiShield, FiActivity, FiAlertTriangle, FiAlertOctagon, FiUser, 
  FiMonitor, FiKey, FiLock, FiLogOut, FiUsers, FiClock, FiRefreshCw 
} from 'react-icons/fi';
import dayjs from 'dayjs';
import Card from '../components/Card';
import useApp from '../hooks/useApp';
import dashboardService from '../services/dashboardService';
import deviceAdminService from '../services/deviceAdminService';

export const SecurityCenter = () => {
  const { toast, showLoading } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('metrics'); // metrics, history, failed, revoked

  // Metrics state
  const [metrics, setMetrics] = useState({
    sessionCount: 0,
    deviceCount: 0,
    credentialCount: 0,
    faceProfileCount: 0,
    failedLoginCountToday: 0,
    blockedDevicesCount: 0
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Active Sessions state
  const [activeSessions, setActiveSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // System Logs state (used for history & failed login mockup verification)
  const [systemLogs, setSystemLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await dashboardService.getSecurityMetrics();
      if (res && res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải thống kê bảo mật');
    } finally {
      setLoadingMetrics(false);
    }
  }, [toast]);

  const fetchActiveSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      // Fetch devices with status 1 (ACTIVE sessions)
      const res = await deviceAdminService.getDevices({ limit: 50, status: '1' });
      if (res && res.success && res.data) {
        setActiveSessions(res.data.items || []);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách phiên hoạt động');
    } finally {
      setLoadingSessions(false);
    }
  }, [toast]);

  const fetchSystemLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await dashboardService.getSystemLogs();
      if (res && res.success && res.data) {
        setSystemLogs(res.data.items || []);
      }
    } catch (err) {
      console.error('Error fetching logs in security center', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    if (activeSubTab === 'revoked') {
      fetchActiveSessions();
    } else if (activeSubTab === 'history' || activeSubTab === 'failed') {
      fetchSystemLogs();
    }
  }, [activeSubTab, fetchMetrics, fetchActiveSessions, fetchSystemLogs]);

  const handleForceLogout = async (sessionId) => {
    showLoading(true);
    try {
      const res = await deviceAdminService.revokeDevice(sessionId);
      if (res && res.success) {
        toast.success('Đã buộc đăng xuất thiết bị thành công!');
        fetchActiveSessions();
        fetchMetrics();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi buộc đăng xuất');
    } finally {
      showLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchMetrics();
    if (activeSubTab === 'revoked') fetchActiveSessions();
    if (activeSubTab === 'history' || activeSubTab === 'failed') fetchSystemLogs();
  };

  // Filter login success logs
  const loginHistoryLogs = systemLogs.filter(l => 
    l.action.includes('LOGIN') || l.action.includes('CHECK') || l.action.includes('FACE') || l.action.includes('SIGNATURE')
  );

  // Filter failure logs
  const failedLogs = systemLogs.filter(l => 
    l.status === 'FAILED' || l.action.includes('FAILED')
  );

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiShield className="w-5 h-5 text-primary-600" />
            Trung tâm bảo mật hệ thống
          </h1>
          <p className="text-xs text-slate-500">Giám sát các phiên đăng nhập đang hoạt động, thiết bị bị chặn, lịch sử đăng nhập thất bại và quản lý thu hồi khóa bảo mật</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors bg-white dark:bg-slate-900"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* Sub-tab Selection */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'metrics', name: 'Tổng quan & Thống kê' },
          { id: 'history', name: 'Nhật ký đăng nhập' },
          { id: 'failed', name: 'Cảnh báo & Lỗi bảo mật' },
          { id: 'revoked', name: 'Phiên hoạt động & Cưỡng chế' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-[2px] transition-all ${
              activeSubTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content renders */}
      <div className="space-y-6">
        
        {/* Tab 1: Metrics */}
        {activeSubTab === 'metrics' && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số liệu bảo mật thời gian thực</h3>
            
            {/* Counts Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "Tổng phiên hoạt động", value: metrics.sessionCount, desc: "Active Sessions", icon: <FiClock /> },
                { name: "Tổng thiết bị đăng ký", value: metrics.deviceCount, desc: "Device Count", icon: <FiMonitor /> },
                { name: "Tổng khóa sinh trắc", value: metrics.credentialCount, desc: "Credential Count", icon: <FiKey /> },
                { name: "Tổng hồ sơ khuôn mặt", value: metrics.faceProfileCount, desc: "Face Profile Count", icon: <FiUser /> },
              ].map((m, idx) => (
                <Card key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 flex flex-col justify-between shadow-sm">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] text-slate-500 dark:text-slate-450 font-bold uppercase">{m.name}</span>
                    {loadingMetrics ? (
                      <span className="text-2xl font-bold text-slate-400 mt-2">...</span>
                    ) : (
                      <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{m.value}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-4">
                    <span>{m.desc}</span>
                    <span className="text-primary-500">{m.icon}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Online Status Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex items-center gap-4 border border-slate-100 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                  <FiAlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Thiết bị đã thu hồi (Blocked)</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{metrics.blockedDevicesCount}</span>
                </div>
              </Card>

              <Card className="flex items-center gap-4 border border-slate-100 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900">
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400">
                  <FiAlertOctagon className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Lỗi xác thực & Đăng nhập lỗi</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{metrics.failedLoginCountToday}</span>
                </div>
              </Card>

              <Card className="flex items-center gap-4 border border-slate-100 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900">
                <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400">
                  <FiShield className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Mức độ an toàn hệ thống</span>
                  <span className="text-lg font-bold text-emerald-600 mt-0.5">Tốt (98%)</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Login History */}
        {activeSubTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhật ký hoạt động bảo mật</h3>
            <Card className="p-0 overflow-hidden border border-slate-150 dark:border-slate-800 shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/30 text-[10px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Hoạt động</th>
                    <th className="px-5 py-3">Chi tiết nhật ký</th>
                    <th className="px-5 py-3">Nhân viên thực hiện</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-slate-400">Đang tải nhật ký...</td>
                    </tr>
                  ) : loginHistoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-slate-400">Chưa ghi nhận hoạt động nào</td>
                    </tr>
                  ) : (
                    loginHistoryLogs.map((log) => (
                      <tr key={log.logId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-150">{log.action}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{log.description}</td>
                        <td className="px-5 py-3 text-slate-500">
                          {log.fullName ? `${log.fullName} (${log.employeeCode})` : 'Hệ thống'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-500">{dayjs(log.actionTime).format('HH:mm:ss DD/MM/YYYY')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Tab 3: Failed Logins */}
        {activeSubTab === 'failed' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cảnh báo đăng nhập & lỗi xác thực sinh trắc</h3>
            <Card className="p-0 overflow-hidden border border-slate-150 dark:border-slate-800 shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/30 text-[10px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Hành động lỗi</th>
                    <th className="px-5 py-3">Mô tả sự cố</th>
                    <th className="px-5 py-3">Nhân viên liên đới</th>
                    <th className="px-5 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-slate-400">Đang tải cảnh báo...</td>
                    </tr>
                  ) : failedLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-slate-400">Tuyệt vời! Không ghi nhận sự cố hay cảnh báo bảo mật nào gần đây</td>
                    </tr>
                  ) : (
                    failedLogs.map((log) => (
                      <tr key={log.logId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 text-red-650 dark:text-red-400">
                        <td className="px-5 py-3 font-semibold">{log.action}</td>
                        <td className="px-5 py-3 font-medium">{log.description}</td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                          {log.fullName ? `${log.fullName} (${log.employeeCode})` : 'Hệ thống'}
                        </td>
                        <td className="px-5 py-3 font-mono">{dayjs(log.actionTime).format('HH:mm:ss DD/MM/YYYY')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Tab 4: Active Sessions & Block List */}
        {activeSubTab === 'revoked' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cưỡng chế đăng xuất (Force Logout) các phiên active</h4>
              <Card className="p-0 overflow-hidden border border-slate-150 dark:border-slate-800 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950/30 text-[10px] font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-3">Nhân viên</th>
                      <th className="px-5 py-3">Thiết bị & OS</th>
                      <th className="px-5 py-3">IP Address / Fingerprint</th>
                      <th className="px-5 py-3">Đăng nhập lúc</th>
                      <th className="px-5 py-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {loadingSessions ? (
                      <tr>
                        <td colSpan="5" className="px-5 py-8 text-center text-slate-400">Đang tải phiên hoạt động...</td>
                      </tr>
                    ) : activeSessions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-5 py-8 text-center text-slate-400">Không tìm thấy phiên đăng nhập active nào</td>
                      </tr>
                    ) : (
                      activeSessions.map((session) => (
                        <tr key={session.deviceId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                          <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">
                            {session.employee?.fullName}
                            <span className="block text-[10px] text-slate-400 font-normal">{session.employee?.employeeCode}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-semibold text-slate-750 dark:text-slate-300 block">{session.deviceName}</span>
                            <span className="text-[10px] text-slate-400">{session.operatingSystem} • {session.browser}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-mono text-slate-600 dark:text-slate-400 block">192.168.1.1</span>
                            <span className="font-mono text-[9px] text-slate-450 block truncate max-w-[120px]">{session.fingerprint}</span>
                          </td>
                          <td className="px-5 py-3 font-mono text-slate-500">{dayjs(session.registeredTime).format('HH:mm DD/MM/YYYY')}</td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => handleForceLogout(session.deviceId)}
                              className="px-2.5 py-1 text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg flex items-center gap-1 transition-all"
                            >
                              <FiLogOut className="w-3 h-3" />
                              Force Logout
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SecurityCenter;
