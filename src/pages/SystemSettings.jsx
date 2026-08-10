import React, { useState, useEffect } from 'react';
import { 
  FiSettings, FiCompass, FiSmile, FiKey, FiCloud, 
  FiClock, FiShield, FiLayers, FiAlertCircle, FiSave, FiCheck, FiFileText,
  FiCalendar
} from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import Card from '../components/Card';
import useApp from '../hooks/useApp';
import dashboardService from '../services/dashboardService';
import HolidaySettings from '../components/HolidaySettings';

export const SystemSettings = () => {
  const { role } = useAuth();
  const { toast, showLoading } = useApp();
  const [activePanel, setActivePanel] = useState('attendance'); // attendance, face, webauthn, sync, cloudinary, time, security, audit

  const [settings, setSettings] = useState({
    defaultAllowedRadius: 100,
    gpsMaxAccuracy: 30,
    maxPhotoSizeMb: 5,
    acceptedPhotoFormats: "image/jpeg, image/png",
    similarityThreshold: 0.85,
    tfModelVersion: "MediaPipe FaceMesh v1.0",
    embeddingVersion: "MobileNetV2-128",
    faceTimeoutSec: 15,
    challengeTimeoutMs: 60000,
    residentKey: "required",
    userVerification: "required",
    authenticatorAttachment: "platform",
    syncRetryIntervalMin: 5,
    syncMaxRetries: 5,
    syncQueueSize: 50,
    syncAutoOnNetwork: "true",
    cloudinaryCloudName: "time-tracking-cloudinary",
    cloudinaryFolder: "attendance_photos",
    cloudinaryPreset: "preset_time_tracking",
    cloudinaryMaxSizeMb: 10,
    ntpServerUrl: "pool.ntp.org",
    systemTimezone: "Asia/Ho_Chi_Minh",
    accessTokenLifetimeSec: 900,
    refreshTokenLifetimeDays: 7,
    maxDevicesPerUser: 3,
    sessionExpirationMin: 1440,
    auditRetentionDays: 90,
    exportExcelAllowed: "true",
    
    // Global Leave settings defaults
    defaultAnnualLeaveDays: 12,
    defaultSickLeaveDays: 10,
    defaultMarriageLeaveDays: 3,
    defaultMaternityLeaveDays: 180,
    defaultOtherLeaveDays: 5
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await dashboardService.getSettings();
        if (res && res.success && res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        toast.error('Không thể tải cấu hình tham số hệ thống');
      } finally {
        setLoading(false);
      }
    };

    if (role === 'SUPMANAGER') {
      fetchSettings();
    }
  }, [role, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    showLoading(true);
    try {
      const res = await dashboardService.updateSettings(settings);
      if (res && res.success) {
        toast.success('Lưu cấu hình hệ thống thành công!');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật cấu hình');
    } finally {
      showLoading(false);
    }
  };

  if (role !== 'SUPMANAGER') {
    return (
      <div className="p-8 rounded-2xl border border-rose-200 bg-rose-50/50 text-center max-w-md mx-auto my-12 animate-fade-in">
        <FiAlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-rose-800 mb-1">Quyền hạn không đủ</h2>
        <p className="text-xs text-rose-700/80 leading-relaxed">
          Chỉ tài khoản Quản trị tối cao (Super Manager) mới được phép truy cập phân hệ Cấu hình hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-primary-600" />
            Cấu hình tham số hệ thống
          </h1>
          <p className="text-xs text-slate-500">Thiết lập các ngưỡng sai số GPS, độ tương đồng khuôn mặt, và thời hạn khóa phiên hoạt động</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation list */}
        <Card className="md:col-span-1 space-y-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl shadow-sm h-fit">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Danh mục Cấu hình</h3>
          <div className="space-y-1.5 text-xs">
            {[
              { id: 'attendance', name: 'Cơ chế chấm công', icon: <FiCompass /> },
              { id: 'leave', name: 'Số ngày nghỉ phép', icon: <FiFileText /> },
              { id: 'holiday', name: 'Cấu hình ngày lễ', icon: <FiCalendar /> },
              { id: 'face', name: 'Nhận diện khuôn mặt', icon: <FiSmile /> },
              { id: 'webauthn', name: 'Sinh trắc WebAuthn', icon: <FiKey /> },
              { id: 'sync', name: 'Đồng bộ ngoại tuyến', icon: <FiClock /> },
              { id: 'cloudinary', name: 'Bộ nhớ Cloudinary', icon: <FiCloud /> },
              { id: 'time', name: 'Đồng bộ thời gian', icon: <FiClock /> },
              { id: 'security', name: 'Thời hạn phiên (Tokens)', icon: <FiShield /> },
              { id: 'audit', name: 'Nhật ký kiểm toán', icon: <FiLayers /> }
            ].map((p) => (
              <div 
                key={p.id}
                onClick={() => setActivePanel(p.id)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                  activePanel === p.id 
                    ? 'bg-primary-50/70 border-primary-100 dark:border-primary-950/20 text-primary-700 dark:text-primary-400 font-semibold' 
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-400'
                }`}
              >
                {p.icon}
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Content detail panels */}
        <Card className="md:col-span-3 space-y-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-2xl shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Đang tải cấu hình...</div>
          ) : activePanel === 'holiday' ? (
            <HolidaySettings />
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {activePanel === 'attendance' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 border-b pb-2">Cấu hình Cơ chế chấm công</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Bán kính geofence cho phép (mét):</label>
                      <input 
                        type="number" 
                        name="defaultAllowedRadius"
                        value={settings.defaultAllowedRadius}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Độ chính xác GPS tối đa (mét):</label>
                      <input 
                        type="number" 
                        name="gpsMaxAccuracy"
                        value={settings.gpsMaxAccuracy}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Dung lượng ảnh checkin tối đa (MB):</label>
                      <input 
                        type="number" 
                        name="maxPhotoSizeMb"
                        value={settings.maxPhotoSizeMb}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Định dạng ảnh được chấp nhận:</label>
                      <input 
                        type="text" 
                        name="acceptedPhotoFormats"
                        value={settings.acceptedPhotoFormats}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Giờ bắt đầu làm việc của Cty (HH:MM:SS):</label>
                      <input 
                        type="text" 
                        name="companyStartTime"
                        value={settings.companyStartTime || ''}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Giờ kết thúc làm việc của Cty (HH:MM:SS):</label>
                      <input 
                        type="text" 
                        name="companyEndTime"
                        value={settings.companyEndTime || ''}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Thời gian trễ được phép của Cty (phút):</label>
                      <input 
                        type="number" 
                        name="companyLateGraceMinutes"
                        value={settings.companyLateGraceMinutes !== undefined ? settings.companyLateGraceMinutes : ''}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Thời gian ra sớm được phép của Cty (phút):</label>
                      <input 
                        type="number" 
                        name="companyEarlyLeaveGraceMinutes"
                        value={settings.companyEarlyLeaveGraceMinutes !== undefined ? settings.companyEarlyLeaveGraceMinutes : ''}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>

                  </div>
                </div>
              )}

              {activePanel === 'leave' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 border-b pb-2">Cấu hình Số ngày nghỉ phép tiêu chuẩn</h3>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 italic leading-relaxed">
                    Thiết lập số ngày nghỉ tiêu chuẩn được phép sử dụng cho toàn công ty. Khi thay đổi số ngày phép năm, hệ thống sẽ tự động cập nhật số ngày phép năm được nghỉ cho tất cả nhân viên trong năm hiện tại.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Phép năm tiêu chuẩn (ngày/năm):</label>
                      <input 
                        type="number" 
                        name="defaultAnnualLeaveDays"
                        step="0.5"
                        min="0"
                        value={settings.defaultAnnualLeaveDays !== undefined ? settings.defaultAnnualLeaveDays : 12}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Giới hạn nghỉ bệnh (ngày/năm):</label>
                      <input 
                        type="number" 
                        name="defaultSickLeaveDays"
                        step="0.5"
                        min="0"
                        value={settings.defaultSickLeaveDays !== undefined ? settings.defaultSickLeaveDays : 10}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Số ngày nghỉ cưới (ngày):</label>
                      <input 
                        type="number" 
                        name="defaultMarriageLeaveDays"
                        step="1"
                        min="0"
                        value={settings.defaultMarriageLeaveDays !== undefined ? settings.defaultMarriageLeaveDays : 3}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Số ngày nghỉ thai sản (ngày):</label>
                      <input 
                        type="number" 
                        name="defaultMaternityLeaveDays"
                        step="1"
                        min="0"
                        value={settings.defaultMaternityLeaveDays !== undefined ? settings.defaultMaternityLeaveDays : 180}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Giới hạn các ngày nghỉ khác (ngày/năm):</label>
                      <input 
                        type="number" 
                        name="defaultOtherLeaveDays"
                        step="0.5"
                        min="0"
                        value={settings.defaultOtherLeaveDays !== undefined ? settings.defaultOtherLeaveDays : 5}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'face' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 border-b pb-2">Cấu hình Face Recognition</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Similarity Threshold (Ngưỡng tương đồng tối thiểu):</label>
                      <input 
                        type="number" 
                        name="similarityThreshold"
                        value={settings.similarityThreshold}
                        onChange={handleChange}
                        step="0.01" 
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">TensorFlow Model Version:</label>
                      <input 
                        type="text" 
                        name="tfModelVersion"
                        value={settings.tfModelVersion}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Embedding Version:</label>
                      <input 
                        type="text" 
                        name="embeddingVersion"
                        value={settings.embeddingVersion}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Thời gian chờ nhận diện khuôn mặt (giây):</label>
                      <input 
                        type="number" 
                        name="faceTimeoutSec"
                        value={settings.faceTimeoutSec}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'webauthn' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 border-b pb-2">Cấu hình WebAuthn FIDO2</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Thời gian chờ FIDO2 challenge (ms):</label>
                      <input 
                        type="number" 
                        name="challengeTimeoutMs"
                        value={settings.challengeTimeoutMs}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Yêu cầu khóa lưu trữ (Resident Key):</label>
                      <select 
                        name="residentKey"
                        value={settings.residentKey}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="required">Bắt buộc (Required)</option>
                        <option value="preferred">Ưu tiên (Preferred)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Yêu cầu xác thực người dùng (User Verification):</label>
                      <select 
                        name="userVerification"
                        value={settings.userVerification}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="required">Bắt buộc (Required)</option>
                        <option value="preferred">Ưu tiên (Preferred)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Cơ chế Authenticator Attachment:</label>
                      <select 
                        name="authenticatorAttachment"
                        value={settings.authenticatorAttachment}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="platform">Thiết bị nội bộ (Platform)</option>
                        <option value="cross-platform">Thiết bị rời (Cross-platform)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'sync' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 border-b pb-2">Cấu hình Đồng bộ ngoại tuyến</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Khoảng thời gian retry tự động (phút):</label>
                      <input 
                        type="number" 
                        name="syncRetryIntervalMin"
                        value={settings.syncRetryIntervalMin}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Số lần retry tối đa trước khi báo lỗi:</label>
                      <input 
                        type="number" 
                        name="syncMaxRetries"
                        value={settings.syncMaxRetries}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Dung lượng hàng đợi tối đa (bản ghi):</label>
                      <input 
                        type="number" 
                        name="syncQueueSize"
                        value={settings.syncQueueSize}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Tự động đồng bộ khi khôi phục mạng:</label>
                      <select 
                        name="syncAutoOnNetwork"
                        value={settings.syncAutoOnNetwork}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="true">Bật (Auto Sync)</option>
                        <option value="false">Tắt</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'cloudinary' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 border-b pb-2">Cấu hình Kho lưu trữ ảnh Cloudinary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Cloud Name:</label>
                      <input 
                        type="text" 
                        name="cloudinaryCloudName"
                        value={settings.cloudinaryCloudName}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Thư mục lưu trữ (Cloudinary Folder):</label>
                      <input 
                        type="text" 
                        name="cloudinaryFolder"
                        value={settings.cloudinaryFolder}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Upload Preset:</label>
                      <input 
                        type="text" 
                        name="cloudinaryPreset"
                        value={settings.cloudinaryPreset}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Giới hạn dung lượng tải lên tối đa (MB):</label>
                      <input 
                        type="number" 
                        name="cloudinaryMaxSizeMb"
                        value={settings.cloudinaryMaxSizeMb}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'time' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 border-b pb-2">Cấu hình Đăng ký Đồng bộ Thời gian</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Time Server NTP URL:</label>
                      <input 
                        type="text" 
                        name="ntpServerUrl"
                        value={settings.ntpServerUrl}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Múi giờ hệ thống (Timezone):</label>
                      <input 
                        type="text" 
                        name="systemTimezone"
                        value={settings.systemTimezone}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'security' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 border-b pb-2">Cấu hình Thời hạn phiên</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Thời hạn Access Token (giây):</label>
                      <input 
                        type="number" 
                        name="accessTokenLifetimeSec"
                        value={settings.accessTokenLifetimeSec}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Thời hạn Refresh Token (ngày):</label>
                      <input 
                        type="number" 
                        name="refreshTokenLifetimeDays"
                        value={settings.refreshTokenLifetimeDays}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Số thiết bị đăng ký tối đa trên mỗi user:</label>
                      <input 
                        type="number" 
                        name="maxDevicesPerUser"
                        value={settings.maxDevicesPerUser}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Thời gian hết hạn phiên đăng nhập (phút):</label>
                      <input 
                        type="number" 
                        name="sessionExpirationMin"
                        value={settings.sessionExpirationMin}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'audit' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 border-b pb-2">Cấu hình Nhật ký kiểm toán</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Thời gian lưu trữ nhật ký (Retention Days):</label>
                      <input 
                        type="number" 
                        name="auditRetentionDays"
                        value={settings.auditRetentionDays}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-455 dark:text-slate-400 font-semibold">Cho phép kết xuất Excel logs ngoại biên:</label>
                      <select 
                        name="exportExcelAllowed"
                        value={settings.exportExcelAllowed}
                        onChange={handleChange}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <FiSave className="w-4 h-4" />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SystemSettings;
