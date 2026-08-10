import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FiUsers, FiPlus, FiEdit2, FiLock, FiUnlock, FiKey,
  FiTrash2, FiUserCheck, FiSettings, FiCheckCircle, FiXCircle, FiLogOut, FiX,
  FiCamera, FiUploadCloud, FiRefreshCw, FiAlertTriangle
} from 'react-icons/fi';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { deviceBiometricService } from '../services/deviceBiometricService';
import faceProfileAdminService from '../services/faceProfileAdminService';
import leaveService from '../services/leaveService';
import { FaceRegisterPage } from '../components/FaceRegisterPage';
import useApp from '../hooks/useApp';
import usePagination from '../hooks/usePagination';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import SearchBox from '../components/SearchBox';
import Select from '../components/Select';
import Input from '../components/Input';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import MissingApiAlert from '../components/MissingApiAlert';
import Skeleton from '../components/Skeleton';
import dayjs from 'dayjs';
import { employeeSchema } from '../validators/employeeValidator';
import api from '../services/api';
import { attendanceService } from '../services/attendanceService';

const getBackendUrl = (path) => {
  if (!path) return null;
  let fullUrl = path;
  if (!path.startsWith('http')) {
    let origin = 'http://localhost:3000';
    if (api && api.defaults && api.defaults.baseURL) {
      origin = api.defaults.baseURL.replace(/\/api\/?$/, '');
    }
    fullUrl = `${origin}${path}`;
  }
  const token = localStorage.getItem('accessToken');
  if (token && !fullUrl.includes('token=')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}token=${token}`;
  }
  return fullUrl;
};

export const Employees = () => {
  const { toast, showLoading } = useApp();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);

  // States
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [keyword, setKeyword] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accFilter, setAccFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal control
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // info, webauthn, face, devices, photos

  // Detail Modal specific states
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [faceProfile, setFaceProfile] = useState(null);
  const [loadingFace, setLoadingFace] = useState(false);
  const [employeeDevices, setEmployeeDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [employeePhotos, setEmployeePhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState(null);

  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [editingLeaveDays, setEditingLeaveDays] = useState('');
  const [savingLeave, setSavingLeave] = useState(false);

  // Extra Actions within Details (Create Account Form, Reset Password Form, Edit Username Form)
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [showEditUsernameForm, setShowEditUsernameForm] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');

  // Face Enrollment (Admin actions) States
  const [faceEnrollMode, setFaceEnrollMode] = useState('view'); // 'view' | 'register' | 'update'
  const [faceEnrollMethod, setFaceEnrollMethod] = useState('upload'); // 'upload' | 'camera'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [savingFace, setSavingFace] = useState(false);
  const [showFaceRegister, setShowFaceRegister] = useState(false);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Stop camera helper
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera helper
  const startCamera = async () => {
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      cameraStreamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      toast.error('Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera: ' + err.message);
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Close detail modal wrapper with cleanup
  const handleCloseDetailModal = () => {
    stopCamera();
    setFaceEnrollMode('view');
    setCapturedImage(null);
    setUploadFile(null);
    setEmployeePhotos([]);
    setDetailModalOpen(false);
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      createAccount: false
    }
  });

  const createAccountChecked = watch('createAccount');
  const selectedRoleId = watch('roleId');

  // Real-time update employeeCode based on selected role when creating employee
  useEffect(() => {
    if (!formModalOpen || editingEmp) return;

    let targetRoleName = 'EMPLOYEE';
    if (createAccountChecked && selectedRoleId) {
      const foundRole = roles.find(
        (r) => String(r.roleId ?? r.role_id) === String(selectedRoleId)
      );
      if (foundRole) {
        targetRoleName = foundRole.roleName ?? foundRole.role_name;
      }
    }

    let isActive = true;
    employeeService
      .getNextCode(targetRoleName)
      .then((res) => {
        if (isActive && res && res.success && res.data?.nextCode) {
          setValue('employeeCode', res.data.nextCode);
        }
      })
      .catch((err) => {
        console.error('Lỗi lấy mã nhân viên tự động:', err);
      });

    return () => {
      isActive = false;
    };
  }, [formModalOpen, editingEmp, createAccountChecked, selectedRoleId, roles, setValue]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        keyword: keyword || undefined,
        departmentId: deptFilter || undefined,
        status: statusFilter !== '' ? parseInt(statusFilter, 10) : undefined,
        hasAccount: accFilter !== '' ? accFilter : undefined,
        sortBy,
        sortOrder,
      };
      const res = await employeeService.getEmployees(params);
      if (res && res.success && res.data) {
        setEmployees(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, deptFilter, statusFilter, accFilter, sortBy, sortOrder, setTotal, toast]);

  useEffect(() => {
    fetchEmployees();

    // Fetch departments for dropdowns
    departmentService.getDepartments({ limit: 100, status: 1 }).then((res) => {
      if (res && res.success) {
        setDepartments(res.data.items || []);
      }
    }).catch(console.error);

    // Fetch roles
    employeeService.getRoles().then((res) => {
      if (res && res.success) {
        setRoles(res.data || []);
      }
    }).catch(console.error);
  }, [fetchEmployees]);

  const handleSearch = (val) => {
    setKeyword(val);
    resetPagination();
  };

  const handleDeptFilterChange = (e) => {
    setDeptFilter(e.target.value);
    resetPagination();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    resetPagination();
  };

  const handleAccFilterChange = (e) => {
    setAccFilter(e.target.value);
    resetPagination();
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    resetPagination();
  };

  const handleOpenCreateModal = () => {
    setEditingEmp(null);
    reset({
      employeeCode: '',
      fullName: '',
      email: '',
      phone: '',
      departmentId: '',
      createAccount: false,
      username: '',
      password: '',
      roleId: '',
    });
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmp(emp);
    reset({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      email: emp.email || '',
      phone: emp.phone || '',
      departmentId: emp.department?.departmentId,
      createAccount: false,
      username: '',
      password: '',
      roleId: '',
    });
    setFormModalOpen(true);
  };

  const handleOpenDetailModal = async (emp) => {
    setSelectedEmp(emp);
    setActiveTab('info');
    setShowAddAccountForm(false);
    setShowResetPasswordForm(false);
    setShowEditUsernameForm(false);
    setNewUsernameInput('');
    setDetailModalOpen(true);


    // Fetch WebAuthn credentials
    setLoadingCreds(true);
    try {
      const res = await deviceBiometricService.getCredentials(emp.employeeId);
      if (res && res.success) {
        setCredentials(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching employee credentials:', err);
    } finally {
      setLoadingCreds(false);
    }
  };

  useEffect(() => {
    if (!selectedEmp) return;
    if (activeTab === 'face') {
      setLoadingFace(true);
      employeeService.getFaceProfile(selectedEmp.employeeId)
        .then(res => {
          if (res && res.success) {
            setFaceProfile(res.data);
          }
        })
        .catch(err => console.error('Error fetching face profile:', err))
        .finally(() => setLoadingFace(false));
    } else if (activeTab === 'devices') {
      setLoadingDevices(true);
      employeeService.getEmployeeDevices(selectedEmp.employeeId)
        .then(res => {
          if (res && res.success) {
            setEmployeeDevices(res.data || []);
          }
        })
        .catch(err => console.error('Error fetching employee devices:', err))
        .finally(() => setLoadingDevices(false));
    } else if (activeTab === 'webauthn') {
      setLoadingCreds(true);
      deviceBiometricService.getCredentials(selectedEmp.employeeId)
        .then(res => {
          if (res && res.success) {
            setCredentials(res.data || []);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingCreds(false));
    } else if (activeTab === 'photos') {
      setLoadingPhotos(true);
      attendanceService.getEmployeePhotos(selectedEmp.employeeId)
        .then(res => {
          if (res && res.success) {
            setEmployeePhotos(res.data.items || res.data || []);
          }
        })
        .catch(err => console.error('Error fetching employee photos:', err))
        .finally(() => setLoadingPhotos(false));
    } else if (activeTab === 'leave') {
      setLoadingLeave(true);
      leaveService.getEmployeeLeaveBalance(selectedEmp.employeeId, dayjs().year())
        .then(res => {
          if (res && res.success && res.data) {
            setLeaveBalance(res.data);
            setEditingLeaveDays(res.data.annualDaysTotal);
          }
        })
        .catch(err => console.error('Error fetching employee leave balance:', err))
        .finally(() => setLoadingLeave(false));
    }
  }, [activeTab, selectedEmp]);

  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(err => {
        console.error('Error starting video playback:', err);
      });
    }
  }, [isCameraActive]);

  const handleResetFace = async () => {
    if (!selectedEmp) return;
    if (!confirm('Bạn có chắc chắn muốn xóa dữ liệu nhận diện khuôn mặt của nhân viên này?')) return;
    showLoading(true);
    try {
      const res = await faceProfileAdminService.deleteProfileByEmployeeId(selectedEmp.employeeId);
      if (res && res.success) {
        toast.success('Đã xóa dữ liệu khuôn mặt của nhân viên thành công!');
        setFaceProfile(null);
        setFaceEnrollMode('view');
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa dữ liệu khuôn mặt');
    } finally {
      showLoading(false);
    }
  };

  const handleSaveFace = async () => {
    if (!selectedEmp) return;
    
    let fileToUpload = null;
    if (faceEnrollMethod === 'upload') {
      if (!uploadFile) {
        toast.error('Vui lòng chọn hoặc kéo thả một ảnh khuôn mặt');
        return;
      }
      fileToUpload = uploadFile;
    } else {
      if (!capturedImage) {
        toast.error('Vui lòng chụp ảnh khuôn mặt của nhân viên');
        return;
      }
      try {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        fileToUpload = new File([blob], `face_admin_${Date.now()}.jpg`, { type: 'image/jpeg' });
      } catch (err) {
        toast.error('Lỗi xử lý ảnh chụp: ' + err.message);
        return;
      }
    }

    setSavingFace(true);
    showLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', fileToUpload);

      const isUpdate = !!faceProfile;
      const apiFn = isUpdate 
        ? faceProfileAdminService.updateFaceAdmin 
        : faceProfileAdminService.registerFaceAdmin;

      const res = await apiFn(selectedEmp.employeeId, formData);
      if (res && res.success) {
        toast.success(isUpdate ? 'Cập nhật khuôn mặt thành công!' : 'Đăng ký khuôn mặt thành công!');
        setFaceProfile(res.data);
        setFaceEnrollMode('view');
        setCapturedImage(null);
        setUploadFile(null);
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu dữ liệu khuôn mặt. Vui lòng đảm bảo ảnh có duy nhất một khuôn mặt, rõ nét và sáng rõ.');
    } finally {
      setSavingFace(false);
      showLoading(false);
    }
  };

  const handleFaceRegisterComplete = async (embeddings) => {
    setShowFaceRegister(false);
    showLoading(true);
    setSavingFace(true);
    try {
      const isUpdate = !!faceProfile;
      const apiFn = isUpdate 
        ? faceProfileAdminService.updateFaceEmbeddingAdmin
        : faceProfileAdminService.registerFaceEmbeddingAdmin;

      const res = await apiFn(selectedEmp.employeeId, embeddings);
      if (res && res.success) {
        toast.success(isUpdate ? 'Cập nhật khuôn mặt thành công!' : 'Đăng ký khuôn mặt thành công!');
        setFaceProfile(res.data);
        setFaceEnrollMode('view');
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi lưu dữ liệu khuôn mặt.');
    } finally {
      setSavingFace(false);
      showLoading(false);
    }
  };

  const handleRevokeDevice = async (sessionId) => {
    if (!selectedEmp) return;
    showLoading(true);
    try {
      const res = await employeeService.revokeEmployeeDevice(sessionId);
      if (res && res.success) {
        toast.success('Đã buộc đăng xuất thiết bị thành công!');
        // Re-fetch devices
        const updated = await employeeService.getEmployeeDevices(selectedEmp.employeeId);
        if (updated && updated.success) {
          setEmployeeDevices(updated.data || []);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi buộc đăng xuất');
    } finally {
      showLoading(false);
    }
  };

  const onSubmit = async (data) => {
    showLoading(true);
    try {
      if (editingEmp) {
        // Edit only modifies employee properties
        const payload = {
          employeeCode: data.employeeCode,
          fullName: data.fullName,
          email: data.email || null,
          phone: data.phone || null,
          departmentId: data.departmentId,
        };
        const res = await employeeService.updateEmployee(editingEmp.employeeId, payload);
        if (res && res.success) {
          toast.success('Cập nhật nhân viên thành công!');
          setFormModalOpen(false);
          fetchEmployees();
        }
      } else {
        // Create employee
        let res;
        if (data.createAccount) {
          const payload = {
            employee: {
              employeeCode: data.employeeCode,
              fullName: data.fullName,
              email: data.email || null,
              phone: data.phone || null,
              departmentId: data.departmentId,
            },
            account: {
              username: data.username,
              password: data.password,
              roleId: data.roleId,
            }
          };
          res = await employeeService.createEmployeeWithAccount(payload);
        } else {
          const payload = {
            employeeCode: data.employeeCode,
            fullName: data.fullName,
            email: data.email || null,
            phone: data.phone || null,
            departmentId: data.departmentId,
          };
          res = await employeeService.createEmployee(payload);
        }

        if (res && res.success) {
          toast.success('Thêm nhân viên thành công!');
          setFormModalOpen(false);
          fetchEmployees();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu nhân viên');
    } finally {
      showLoading(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = parseInt(emp.status, 10) === 1 ? 0 : 1;
    showLoading(true);
    try {
      const res = await employeeService.updateEmployeeStatus(emp.employeeId, newStatus);
      if (res && res.success) {
        toast.success(newStatus === 1 ? 'Mở khóa nhân viên thành công' : 'Khóa nhân viên thành công');
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thay đổi trạng thái');
    } finally {
      showLoading(false);
    }
  };

  const handleRevokeCredential = async (credId) => {
    showLoading(true);
    try {
      const res = await deviceBiometricService.deleteCredential(credId, selectedEmp.employeeId);
      if (res && res.success) {
        toast.success('Thu hồi thiết bị WebAuthn thành công');
        // Refresh credentials list
        const refreshed = await deviceBiometricService.getCredentials(selectedEmp.employeeId);
        setCredentials(refreshed.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thu hồi credential');
    } finally {
      showLoading(false);
    }
  };

  // Add account for employee details view
  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    const roleId = parseInt(formData.get('roleId'), 10);

    if (!username || !password || !roleId) {
      toast.error('Vui lòng điền đủ thông tin');
      return;
    }

    showLoading(true);
    try {
      const res = await employeeService.createAccount(selectedEmp.employeeId, { username, password, roleId });
      if (res && res.success) {
        toast.success('Tạo tài khoản thành công!');
        setShowAddAccountForm(false);
        // Refresh details
        const updated = await employeeService.getEmployeeById(selectedEmp.employeeId);
        setSelectedEmp(updated.data);
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tạo tài khoản');
    } finally {
      showLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPassword = formData.get('newPassword');

    if (!newPassword || newPassword.length < 6) {
      toast.error('Mật khẩu mới tối thiểu phải 6 ký tự');
      return;
    }

    showLoading(true);
    try {
      const res = await employeeService.resetPassword(selectedEmp.account.accountId, newPassword);
      if (res && res.success) {
        toast.success('Đặt lại mật khẩu thành công!');
        setShowResetPasswordForm(false);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi đặt lại mật khẩu');
    } finally {
      showLoading(false);
    }
  };

  const handleSaveLeaveBalance = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    if (editingLeaveDays === undefined || editingLeaveDays === '') {
      toast.error('Vui lòng nhập tổng số ngày nghỉ phép');
      return;
    }

    setSavingLeave(true);
    showLoading(true);
    try {
      const res = await leaveService.updateTotalLeaveDays(selectedEmp.employeeId, dayjs().year(), parseFloat(editingLeaveDays));
      if (res && res.success) {
        toast.success('Cập nhật tổng số ngày nghỉ phép thành công!');
        // Refresh local balance state
        const refreshed = await leaveService.getEmployeeLeaveBalance(selectedEmp.employeeId, dayjs().year());
        if (refreshed && refreshed.success) {
          setLeaveBalance(refreshed.data);
          setEditingLeaveDays(refreshed.data.annualDaysTotal);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật số dư nghỉ phép');
    } finally {
      setSavingLeave(false);
      showLoading(false);
    }
  };

  const handleToggleAccountStatus = async () => {
    const newActive = selectedEmp.account.isActive === 1 ? 0 : 1;
    showLoading(true);
    try {
      const res = await employeeService.updateAccountStatus(selectedEmp.account.accountId, newActive);
      if (res && res.success) {
        toast.success(newActive === 1 ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công');
        const updated = await employeeService.getEmployeeById(selectedEmp.employeeId);
        setSelectedEmp(updated.data);
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thay đổi trạng thái tài khoản');
    } finally {
      showLoading(false);
    }
  };

  const handleUpdateRoleChange = async (e) => {
    const roleId = parseInt(e.target.value, 10);
    if (!roleId) return;

    showLoading(true);
    try {
      const res = await employeeService.updateAccountRole(selectedEmp.account.accountId, roleId);
      if (res && res.success) {
        toast.success('Thay đổi vai trò tài khoản thành công');
        const updated = await employeeService.getEmployeeById(selectedEmp.employeeId);
        setSelectedEmp(updated.data);
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi đổi vai trò');
    } finally {
      showLoading(false);
    }
  };

  const handleUpdateUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!newUsernameInput || !newUsernameInput.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập mới');
      return;
    }
    if (newUsernameInput.trim().length < 3) {
      toast.error('Tên đăng nhập phải chứa từ 3 đến 50 ký tự');
      return;
    }
    if (newUsernameInput.trim().toLowerCase() === selectedEmp.account.username.toLowerCase()) {
      toast.error('Tên đăng nhập mới phải khác tên đăng nhập hiện tại');
      return;
    }

    showLoading(true);
    try {
      const res = await employeeService.updateUsername(selectedEmp.account.accountId, newUsernameInput.trim());
      if (res && res.success) {
        toast.success('Thay đổi tên đăng nhập thành công');
        setShowEditUsernameForm(false);
        setNewUsernameInput('');
        const updated = await employeeService.getEmployeeById(selectedEmp.employeeId);
        setSelectedEmp(updated.data);
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thay đổi tên đăng nhập');
    } finally {
      showLoading(false);
    }
  };


  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [roleConfirmModalOpen, setRoleConfirmModalOpen] = useState(false);

  const [bulkDepartmentId, setBulkDepartmentId] = useState('');
  const [bulkRoleId, setBulkRoleId] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  const isAllSelected = employees.length > 0 && employees.every(e => selectedIds.includes(e.employeeId));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map(e => e.employeeId));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenBulkEditModal = () => {
    if (selectedIds.length === 1) {
      const emp = employees.find(e => e.employeeId === selectedIds[0]);
      if (emp) {

        setBulkDepartmentId(emp.departmentId ? String(emp.departmentId) : (emp.department?.departmentId ? String(emp.department.departmentId) : ''));
        setBulkRoleId(emp.account?.roleId ? String(emp.account.roleId) : '');
        setBulkStatus(emp.status !== undefined ? String(emp.status) : '');
      }
    } else {

      setBulkDepartmentId('');
      setBulkRoleId('');
      setBulkStatus('');
    }
    setBulkEditModalOpen(true);
  };

  const handleBulkEditEmployeesSubmit = (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    if (!bulkDepartmentId && !bulkRoleId && bulkStatus === '') {
      toast.error('Vui lòng nhập hoặc chọn thông tin mới để cập nhật');
      return;
    }

    if (bulkRoleId) {
      setRoleConfirmModalOpen(true);
      return;
    }

    executeBulkEdit();
  };

  const executeBulkEdit = async () => {
    showLoading(true);
    let successCount = 0;
    for (const empId of selectedIds) {
      try {
        const emp = employees.find(e => e.employeeId === empId);
        if (emp) {
          const updatePayload = {
            employeeCode: emp.employeeCode,
            fullName: emp.fullName,
            email: emp.email,
            phone: emp.phone,
            departmentId: bulkDepartmentId ? Number(bulkDepartmentId) : (emp.departmentId || emp.department?.departmentId)
          };
          await employeeService.updateEmployee(empId, updatePayload);
        }
        if (bulkRoleId && emp?.account?.accountId) {
          await employeeService.updateAccountRole(emp.account.accountId, Number(bulkRoleId));
        }
        if (bulkStatus !== '') {
          await employeeService.updateEmployeeStatus(empId, Number(bulkStatus));
        }
        successCount++;
      } catch (err) {
        console.error(`Error bulk updating employee ${empId}:`, err);
      }
    }

    toast.success(`Cập nhật thành công thông tin cho ${successCount}/${selectedIds.length} nhân viên!`);
    setBulkEditModalOpen(false);
    setRoleConfirmModalOpen(false);
    setSelectedIds([]);
    fetchEmployees();
    showLoading(false);
  };

  const handleBulkToggleStatus = async (targetStatus) => {
    if (selectedIds.length === 0) return;
    const actionName = targetStatus === 1 ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Xác nhận ${actionName} hàng loạt ${selectedIds.length} nhân viên đã chọn?`)) return;

    showLoading(true);
    let successCount = 0;
    for (const empId of selectedIds) {
      try {
        const res = await employeeService.updateEmployeeStatus(empId, targetStatus);
        if (res && res.success) successCount++;
      } catch (err) {
        console.error(`Error toggling status for employee ${empId}:`, err);
      }
    }

    toast.success(`Đã ${actionName} ${successCount}/${selectedIds.length} nhân viên!`);
    setSelectedIds([]);
    fetchEmployees();
    showLoading(false);
  };

  const handleBulkDeleteEmployees = () => {
    if (selectedIds.length === 0) return;
    setDeleteConfirmModalOpen(true);
  };

  const executeBulkDelete = async () => {
    showLoading(true);
    try {
      const res = await employeeService.bulkDeleteEmployees(selectedIds);
      if (res && res.success) {
        toast.success(res.message || `Đã xóa vĩnh viễn ${selectedIds.length} nhân viên!`);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa nhân viên hàng loạt');
    } finally {
      setSelectedIds([]);
      setDeleteConfirmModalOpen(false);
      fetchEmployees();
      showLoading(false);
    }
  };

  const headers = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      ),
      sortable: false,
      width: '40px'
    },
    { key: 'employee_code', label: 'Mã nhân viên', sortable: true },
    { key: 'full_name', label: 'Họ tên', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'department', label: 'Phòng ban', sortable: false },
    { key: 'account', label: 'Tài khoản', sortable: false },
    { key: 'face_status', label: 'Trạng thái khuôn mặt', sortable: false },
    { key: 'status', label: 'Trạng thái', sortable: true },
    { key: 'actions', label: 'Hành động', sortable: false, width: '130px' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-primary-600" />
            Quản lý nhân viên
          </h1>
          <p className="text-xs text-slate-500">Quản lý danh sách nhân sự, thông tin cá nhân và thiết lập tài khoản đăng nhập</p>
        </div>
        <Button variant="primary" size="sm" icon={<FiPlus />} onClick={handleOpenCreateModal}>
          Thêm nhân viên
        </Button>
      </div>

      {/* Filter Row and Table */}
      <Card className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <SearchBox value={keyword} onChange={handleSearch} placeholder="Tìm mã, tên, email..." />
          <Select
            name="dept"
            value={deptFilter}
            onChange={handleDeptFilterChange}
            options={departments.map((d) => ({ value: d.department_id, label: d.department_name }))}
            placeholder="Tất cả phòng ban"
          />
          <Select
            name="status"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            options={[
              { value: '1', label: 'Hoạt động' },
              { value: '0', label: 'Ngừng hoạt động' }
            ]}
            placeholder="Tất cả trạng thái"
          />
          <Select
            name="acc"
            value={accFilter}
            onChange={handleAccFilterChange}
            options={[
              { value: 'true', label: 'Đã cấp tài khoản' },
              { value: 'false', label: 'Chưa cấp tài khoản' }
            ]}
            placeholder="Tất cả tài khoản"
          />
        </div>

        <Table
          headers={headers}
          items={employees}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          renderRow={(emp) => (
            <>
              <td className="px-3 py-4 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(emp.employeeId)}
                  onChange={() => toggleSelectRow(emp.employeeId)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </td>
              <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">
                {emp.employeeCode}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">
                {emp.fullName}
              </td>
              <td className="px-6 py-4 text-xs text-slate-500">
                {emp.email || '—'}
              </td>
              <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-350">
                {emp.department?.departmentName || '—'}
              </td>
              <td className="px-6 py-4">
                {emp.account ? (
                  <div className="flex flex-col items-start gap-1">
                    {/*
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {emp.account.username}
                    </span>
                    */}
                    <StatusBadge
                      type="role"
                      value={emp.account.role}
                    />
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    Chưa cấp
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {emp.hasFaceProfile ? (
                  <span className="inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/35">
                    Đã đăng ký
                  </span>
                ) : (
                  <span className="inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    Chưa đăng ký
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusBadge type="activeStatus" value={emp.status} />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenDetailModal(emp)}
                    title="Xem chi tiết"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/15 transition-all"
                  >
                    <FiSettings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(emp)}
                    title="Chỉnh sửa"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/15 transition-all"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(emp)}
                    title={parseInt(emp.status, 10) === 1 ? 'Khóa nhân viên' : 'Mở khóa nhân viên'}
                    className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 transition-all ${parseInt(emp.status, 10) === 1
                      ? 'hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10'
                      : 'hover:text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/10'
                      }`}
                  >
                    {parseInt(emp.status, 10) === 1 ? <FiLock className="w-3.5 h-3.5" /> : <FiUnlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </td>
            </>
          )}
          pagination={
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
            />
          }
        />
      </Card>

      {/* Add / Edit Form Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingEmp ? 'Chỉnh sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Mã nhân viên (Tự động)"
              name="employeeCode"
              placeholder="Tự động sinh..."
              readOnly
              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold cursor-not-allowed"
              error={errors.employeeCode}
              {...register('employeeCode')}
            />
            <Input
              label="Họ và tên"
              name="fullName"
              placeholder="Nhập họ và tên..."
              error={errors.fullName}
              {...register('fullName')}
            />
            <Input
              label="Email liên hệ"
              name="email"
              placeholder="name@company.com"
              error={errors.email}
              {...register('email')}
            />
            <Input
              label="Số điện thoại"
              name="phone"
              placeholder="Nhập số điện thoại..."
              error={errors.phone}
              {...register('phone')}
            />
            <Select
              label="Phòng ban"
              name="departmentId"
              options={departments.map((d) => ({ value: d.department_id, label: d.department_name }))}
              placeholder="Chọn phòng ban..."
              error={errors.departmentId}
              {...register('departmentId')}
            />
          </div>

          {/* Account Creation Section (Only on creation mode) */}
          {!editingEmp && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createAccount"
                  className="rounded border-slate-350 text-primary-650 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                  {...register('createAccount')}
                />
                <label htmlFor="createAccount" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Cấp tài khoản đăng nhập đi kèm
                </label>
              </div>

              {createAccountChecked && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850 animate-fade-in">
                  <Input
                    label="Tên đăng nhập"
                    name="username"
                    placeholder="Nhập tên đăng nhập..."
                    error={errors.username}
                    {...register('username')}
                  />
                  <Input
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự..."
                    error={errors.password}
                    {...register('password')}
                  />
                  <Select
                    label="Quyền truy cập"
                    name="roleId"
                    options={roles.map((r) => ({ value: r.roleId ?? r.role_id, label: r.roleName ?? r.role_name }))}
                    placeholder="Chọn quyền..."
                    error={errors.roleId}
                    {...register('roleId')}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setFormModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Lưu thông tin
            </Button>
          </div>
        </form>
      </Modal>

      {/* Details Manager Sheet Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        title="Quản lý nhân viên chi tiết"
        size="xl"
      >
        {selectedEmp && (
          <div className="flex flex-col gap-6">
            {/* Header info card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-lg">
                  {selectedEmp.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedEmp.fullName}</h3>
                  <span className="text-xs text-slate-500 mt-0.5">Mã nhân viên: <strong>{selectedEmp.employeeCode}</strong> • Phòng ban: <strong>{selectedEmp.department?.departmentName}</strong></span>
                </div>
              </div>
              <StatusBadge type="activeStatus" value={selectedEmp.status} />
            </div>

            {/* Tab selector */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              {[
                { id: 'info', name: 'Thông tin tài khoản' },
                { id: 'face', name: 'Nhận diện khuôn mặt' },
                { id: 'devices', name: 'Thiết bị đã dùng' },
                { id: 'photos', name: 'Lịch sử ảnh chụp' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-[2px] transition-all ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                    : 'border-transparent text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Tab content renders */}
            <div className="min-h-[220px]">
              {/* Tab 1: Account Info */}
              {activeTab === 'info' && (
                <div className="space-y-6 text-left">
                  {selectedEmp.account ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250 uppercase tracking-wide">Chi tiết tài khoản</h4>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-850">
                            <span className="text-slate-450">Tên đăng nhập:</span>
                            {!showEditUsernameForm ? (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedEmp.account.username}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="py-0.5 px-2 text-[10px] flex items-center gap-1"
                                  onClick={() => {
                                    setNewUsernameInput(selectedEmp.account.username);
                                    setShowEditUsernameForm(true);
                                  }}
                                >
                                  <FiEdit2 className="w-3 h-3" />
                                  Đổi tên
                                </Button>
                              </div>
                            ) : (
                              <form onSubmit={handleUpdateUsernameSubmit} className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={newUsernameInput}
                                  onChange={(e) => setNewUsernameInput(e.target.value)}
                                  placeholder="Tên đăng nhập mới..."
                                  className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  autoFocus
                                />
                                <Button size="sm" type="submit" variant="primary" className="py-0.5 px-2 text-[10px]">
                                  Lưu
                                </Button>
                                <Button size="sm" type="button" variant="secondary" className="py-0.5 px-2 text-[10px]" onClick={() => setShowEditUsernameForm(false)}>
                                  Hủy
                                </Button>
                              </form>
                            )}
                          </div>

                          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-850">
                            <span className="text-slate-450">Quyền truy cập:</span>
                            <div className="flex items-center gap-2">
                              <StatusBadge type="role" value={selectedEmp.account.role} />
                              <select
                                defaultValue={roles.find(r => (r.roleName ?? r.role_name) === selectedEmp.account.role)?.roleId ?? roles.find(r => (r.roleName ?? r.role_name) === selectedEmp.account.role)?.role_id ?? ''}
                                onChange={handleUpdateRoleChange}
                                className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded p-0.5 focus:outline-none"
                              >
                                <option value="">Đổi quyền...</option>
                                {roles.map(r => (
                                  <option key={r.roleId ?? r.role_id} value={r.roleId ?? r.role_id}>{r.roleName ?? r.role_name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-850">
                            <span className="text-slate-450">Trạng thái khóa:</span>
                            <div className="flex items-center gap-2">
                              <StatusBadge type="activeStatus" value={selectedEmp.account.isActive} />
                              <Button
                                size="sm"
                                variant="outline"
                                className="py-0.5 px-2 text-[10px]"
                                onClick={handleToggleAccountStatus}
                              >
                                {selectedEmp.account.isActive === 1 ? 'Khóa' : 'Mở khóa'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Password Reset Section */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
                        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250 flex items-center gap-1.5">
                          <FiKey className="text-primary-650" />
                          Đặt lại mật khẩu tài khoản
                        </h4>
                        {!showResetPasswordForm ? (
                          <div className="mt-4">
                            <Button size="sm" variant="outline" onClick={() => setShowResetPasswordForm(true)}>
                              Đặt lại mật khẩu
                            </Button>
                          </div>
                        ) : (
                          <form onSubmit={handleResetPasswordSubmit} className="mt-3 space-y-3">
                            <Input
                              label="Mật khẩu mới"
                              name="newPassword"
                              type="password"
                              placeholder="Tối thiểu 6 ký tự..."
                              containerClassName="text-left"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="secondary" onClick={() => setShowResetPasswordForm(false)}>
                                Hủy
                              </Button>
                              <Button size="sm" type="submit" variant="primary">
                                Xác nhận
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 text-center flex flex-col items-center gap-4">
                      <FiKey className="w-10 h-10 text-slate-400" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">Chưa cấp tài khoản đăng nhập</h4>
                        <p className="text-[10px] text-slate-450 dark:text-slate-450 mt-1 max-w-xs">Nhân viên này chỉ được phân công mà không thể đăng nhập PWA để chấm công trực tuyến.</p>
                      </div>

                      {!showAddAccountForm ? (
                        <Button size="sm" variant="primary" onClick={() => setShowAddAccountForm(true)}>
                          Cấp tài khoản
                        </Button>
                      ) : (
                        <form onSubmit={handleAddAccountSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border w-full text-left">
                          <Input label="Tên đăng nhập" name="username" placeholder="Username..." />
                          <Input label="Mật khẩu" name="password" type="password" placeholder="Password..." />
                          <Select
                            label="Quyền hạn"
                            name="roleId"
                            options={roles.map(r => ({ value: r.roleId ?? r.role_id, label: r.roleName ?? r.role_name }))}
                            placeholder="Chọn..."
                          />
                          <div className="flex items-end justify-end gap-2 mt-2 sm:mt-0">
                            <Button size="sm" variant="secondary" onClick={() => setShowAddAccountForm(false)}>Hủy</Button>
                            <Button size="sm" type="submit" variant="primary">Lưu</Button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}



              {/* Tab 3: Face Profile (Admin Managed Enrollment) */}
              {activeTab === 'face' && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250 uppercase tracking-wide">
                      Hồ sơ nhận diện khuôn mặt (Face Profile)
                    </h4>
                    {faceEnrollMode !== 'view' && (
                      <button
                        onClick={() => { stopCamera(); setFaceEnrollMode('view'); setCapturedImage(null); setUploadFile(null); }}
                        className="text-xs text-primary-650 dark:text-primary-400 font-bold hover:underline"
                      >
                        Quay lại
                      </button>
                    )}
                  </div>

                  {loadingFace ? (
                    <Skeleton className="h-20 w-full" />
                  ) : faceEnrollMode === 'view' ? (
                    // VIEW MODE: Show current profile details or empty state
                    !faceProfile ? (
                      <div className="p-8 text-center text-xs text-slate-455 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-3">
                        <FiAlertTriangle className="w-8 h-8 text-amber-500" />
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-350">Chưa đăng ký nhận diện khuôn mặt</p>
                          <p className="text-[10px] text-slate-450 mt-1 max-w-xs mx-auto">
                            Nhân viên này chưa được cấu hình Face Profile. Vui lòng đăng ký mới để sử dụng chấm công bằng khuôn mặt.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          className="mt-1"
                          onClick={() => { setFaceEnrollMode('register'); setFaceEnrollMethod('upload'); }}
                        >
                          Đăng ký khuôn mặt mới
                        </Button>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex items-center gap-3">
                          <FiUserCheck className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                          <div className="flex flex-col text-xs font-semibold">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              Trạng thái: {faceProfile.status === 1 ? 'Hoạt động (Active)' : 'Bị vô hiệu hóa'}
                            </span>
                            <span className="text-[10px] text-slate-450 mt-0.5">
                              Model: {faceProfile.provider || 'face-api'} • Phiên bản Vector: {faceProfile.embeddingVersion || 'v1'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Ngày đăng ký: {dayjs(faceProfile.registeredAt).format('HH:mm DD/MM/YYYY')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setFaceEnrollMode('update'); setFaceEnrollMethod('upload'); }}
                          >
                            Cập nhật lại
                          </Button>
                          <Button size="sm" variant="danger" onClick={handleResetFace}>
                            Xóa khuôn mặt
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    // FORM MODE: Enrolling or updating face profile
                    <div className="space-y-4 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10">
                      {/* Method toggle tabs */}
                      <div className="flex bg-slate-200/50 dark:bg-slate-950/40 p-1 rounded-xl w-fit">
                        <button
                          type="button"
                          onClick={() => { stopCamera(); setCapturedImage(null); setFaceEnrollMethod('upload'); }}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${faceEnrollMethod === 'upload' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Tải ảnh từ thiết bị
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUploadFile(null); setFaceEnrollMethod('camera'); }}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${faceEnrollMethod === 'camera' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Chụp trực tiếp
                        </button>
                      </div>

                      {/* Method 1: File upload */}
                      {faceEnrollMethod === 'upload' && (
                        <div className="space-y-4">
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOver(false);
                              const file = e.dataTransfer.files[0];
                              if (file && file.type.startsWith('image/')) {
                                setUploadFile(file);
                              }
                            }}
                            onClick={() => document.getElementById('adminFaceUpload').click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary-600 bg-primary-50/10' : 'border-slate-350 dark:border-slate-800 hover:bg-slate-100/40 dark:hover:bg-slate-900/20'}`}
                          >
                            <FiUploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                            <span className="text-[11px] font-semibold block text-slate-700 dark:text-slate-350">
                              Kéo thả một ảnh chân dung của nhân viên hoặc nhấn để duyệt file
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              id="adminFaceUpload"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) setUploadFile(file);
                              }}
                              className="hidden"
                            />
                          </div>

                          {uploadFile && (
                            <div className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                              <img
                                src={URL.createObjectURL(uploadFile)}
                                alt="Upload Preview"
                                className="w-32 h-32 object-cover rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm"
                              />
                              <span className="text-[10px] font-mono text-slate-500 mt-2 truncate max-w-xs">
                                {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                              </span>
                              <div className="flex gap-3 mt-3 w-full">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="flex-1 py-1.5"
                                  onClick={() => setUploadFile(null)}
                                >
                                  Chọn ảnh khác
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="flex-1 py-1.5"
                                  onClick={handleSaveFace}
                                >
                                  Lưu hồ sơ
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Method 2: Live webcam capture */}
                      {faceEnrollMethod === 'camera' && (
                        <div className="space-y-4 text-center py-6">
                          <div className="p-6 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col items-center gap-3">
                            <FiCamera className="w-8 h-8 text-violet-500" />
                            <div>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">Khởi động camera eKYC (7 góc chụp)</p>
                              <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-1 max-w-xs">
                                Nhấp vào nút bên dưới để mở giao diện eKYC hướng dẫn nhân viên chụp và thu thập 7 góc khuôn mặt trực tiếp bằng trình duyệt.
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<FiCamera />}
                              onClick={() => setShowFaceRegister(true)}
                            >
                              Khởi động Camera eKYC
                            </Button>
                          </div>
                        </div>
                      )}



                      <div className="bg-slate-100/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850/80 p-3.5 rounded-xl text-[10px] text-slate-500 font-semibold space-y-1">
                        <p className="font-bold text-slate-650">💡 Lưu ý liveness & AI:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Ảnh được chọn phải nhìn thẳng, thấy rõ mắt mũi miệng và không đeo kính đen/khẩu trang.</li>
                          <li>Chỉ chấp nhận ảnh có **duy nhất 1 khuôn mặt**. Trình duyệt và máy chủ sẽ tự động từ chối nếu có nhiều hơn hoặc không phát hiện khuôn mặt nào.</li>
                          <li>Face Vector sẽ được máy chủ trích xuất và bảo mật tuyệt đối, không hiển thị dữ liệu gốc.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Registered Devices (Real integration) */}
              {activeTab === 'devices' && (
                <div className="space-y-4 text-left">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250 uppercase tracking-wide">Danh sách thiết bị đăng nhập đã dùng</h4>
                  {loadingDevices ? (
                    <div className="space-y-2.5">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : employeeDevices.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-455 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200">
                      Chưa ghi nhận phiên đăng nhập hay thiết bị hoạt động nào của nhân viên này.
                    </div>
                  ) : (
                    <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-slate-950/30 text-[10px] font-semibold text-slate-500 uppercase">
                            <tr>
                              <th className="px-5 py-3">Thiết bị & OS</th>
                              <th className="px-5 py-3">Trình duyệt</th>
                              <th className="px-5 py-3">Fingerprint</th>
                              <th className="px-5 py-3">Đăng nhập lúc</th>
                              <th className="px-5 py-3">Trạng thái</th>
                              <th className="px-5 py-3">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                            {employeeDevices.map((dev) => (
                              <tr key={dev.deviceId} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                                <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">
                                  {dev.deviceName}
                                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{dev.operatingSystem}</span>
                                </td>
                                <td className="px-5 py-3 text-slate-650 dark:text-slate-350">
                                  {dev.browser}
                                </td>
                                <td className="px-5 py-3 text-slate-500 font-mono truncate max-w-[120px]" title={dev.fingerprint}>
                                  {dev.fingerprint}
                                </td>
                                <td className="px-5 py-3 text-slate-500 font-mono">
                                  {dayjs(dev.registeredTime).format('HH:mm DD/MM/YYYY')}
                                </td>
                                <td className="px-5 py-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${dev.status === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-450'}`}>
                                    {dev.status === 1 ? 'Đang chạy' : 'Đã đăng xuất'}
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  {dev.status === 1 && (
                                    <button
                                      onClick={() => handleRevokeDevice(dev.deviceId)}
                                      title="Cưỡng chế đăng xuất"
                                      className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-455 transition-colors"
                                    >
                                      <FiLogOut className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Complete Photo History (Including failed check-in/out attempts) */}
              {activeTab === 'photos' && (
                <div className="space-y-4 text-left">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250 uppercase tracking-wide">Lịch sử toàn bộ ảnh chụp (Thành công & Thất bại)</h4>
                  {loadingPhotos ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <Skeleton className="h-48 w-full rounded-2xl" />
                      <Skeleton className="h-48 w-full rounded-2xl" />
                      <Skeleton className="h-48 w-full rounded-2xl" />
                    </div>
                  ) : employeePhotos.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-455 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200">
                      Chưa ghi nhận ảnh chụp nào (bao gồm cả các lần thử chấm công lỗi).
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                      {employeePhotos.map((photo) => (
                        <div key={photo.photoId} className="flex flex-col rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                          {/* Image Container */}
                          <div className="relative group bg-slate-100 dark:bg-slate-950 flex items-center justify-center h-36 border-b border-slate-150 dark:border-slate-800">
                            {photo.photoUrl ? (
                              <>
                                <img
                                  src={getBackendUrl(photo.photoUrl)}
                                  alt={photo.photoType}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setZoomPhoto(getBackendUrl(photo.photoUrl))}
                                    className="px-3 py-1.5 text-[11px] bg-white text-slate-800 rounded-lg font-bold hover:bg-slate-100 shadow-lg"
                                  >
                                    Xem ảnh phóng to
                                  </button>
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">Không tải được ảnh</span>
                            )}
                          </div>

                          {/* Detail Info */}
                          <div className="p-3.5 space-y-2 text-[10px] leading-relaxed">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                {photo.photoType === 'FACE_CAPTURE' && 'Ảnh khuôn mặt'}
                                {photo.photoType === 'LOCATION_CAPTURE' && 'Ảnh minh chứng vị trí'}
                                {photo.photoType === 'CHECK_IN_FINAL' && 'Ảnh Check-in cuối'}
                                {photo.photoType === 'CHECK_OUT_FINAL' && 'Ảnh Check-out cuối'}
                                {!['FACE_CAPTURE', 'LOCATION_CAPTURE', 'CHECK_IN_FINAL', 'CHECK_OUT_FINAL'].includes(photo.photoType) && photo.photoType}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                photo.verificationResult === 'ACCEPTED' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                  : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400'
                              }`}>
                                {photo.verificationResult === 'ACCEPTED' ? 'Thành công' : 'Lỗi / Thất bại'}
                              </span>
                            </div>

                            <div className="space-y-1 text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2 font-mono">
                              <div className="flex justify-between">
                                <span>Thời gian:</span>
                                <strong className="text-slate-700 dark:text-slate-350">{dayjs(photo.capturedAt || photo.createdAt).format('HH:mm:ss DD/MM/YYYY')}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Độ khớp eKYC:</span>
                                <strong className="text-slate-700 dark:text-slate-350">{photo.faceConfidence !== null ? `${(photo.faceConfidence * 100).toFixed(1)}%` : 'N/A'}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>GPS Accuracy:</span>
                                <strong className="text-slate-700 dark:text-slate-350">{photo.gpsAccuracy !== null ? `${photo.gpsAccuracy}m` : 'N/A'}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>GPS Sai số:</span>
                                <strong className="text-slate-700 dark:text-slate-350">{photo.gpsDistance !== null ? `${photo.gpsDistance.toFixed(1)}m` : 'N/A'}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>ID Chấm công:</span>
                                <strong className={photo.attendanceId ? 'text-primary-600 font-bold' : 'text-slate-400 font-normal italic'}>
                                  {photo.attendanceId ? `#${photo.attendanceId}` : 'Chưa lưu ca (FAILED)'}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Picture Zoom Overlay Modal for Employee Detail Photos */}
      <Modal
        isOpen={!!zoomPhoto}
        onClose={() => setZoomPhoto(null)}
        title="Xem ảnh phóng to"
        size="lg"
      >
        <div className="flex items-center justify-center p-2">
          {zoomPhoto && (
            <img
              src={zoomPhoto}
              alt="Zoomed Detail"
              className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-2xl border"
            />
          )}
        </div>
      </Modal>

      {/* Render FaceRegisterPage eKYC Overlay for Admin */}
      {showFaceRegister && (
        <FaceRegisterPage
          onClose={() => setShowFaceRegister(false)}
          onComplete={handleFaceRegisterComplete}
        />
      )}
      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 dark:bg-slate-800/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-4 animate-slide-up">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-r border-slate-700 pr-4">
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[11px] font-bold">
              {selectedIds.length}
            </span>
            <span>Đã chọn {selectedIds.length} nhân viên</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenBulkEditModal}
              className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FiEdit2 className="w-4 h-4" />
              Sửa hàng loạt
            </button>

            <button
              onClick={handleBulkDeleteEmployees}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FiTrash2 className="w-4 h-4" />
              Xóa nhân viên
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Hủy chọn"
            >
              <FiXCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Redesigned Delete Confirmation Modal to match screenshot */}
      {deleteConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-[500px] overflow-hidden transform transition-all scale-100 animate-slide-up flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h3 className="text-[17px] font-extrabold text-slate-800">
                Xóa {selectedIds.length} nhân viên đã chọn
              </h3>
              <button onClick={() => setDeleteConfirmModalOpen(false)} className="text-slate-500 hover:text-slate-800 transition-colors">
                <FiX className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
            
            {/* Body */}
            <div className="px-8 pt-8 pb-10 text-center flex flex-col items-center">
              <div className="w-[60px] h-[60px] bg-rose-50 rounded-full flex items-center justify-center mb-6">
                <FiAlertTriangle className="w-[26px] h-[26px] text-rose-600 stroke-2" />
              </div>
              
              <p className="text-[15.5px] text-slate-600 leading-[1.6] font-medium px-2">
                CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn {selectedIds.length} nhân viên được chọn không? Những nhân viên đã phát sinh dữ liệu chấm công thực tế sẽ không thể bị xóa.
              </p>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 pt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setDeleteConfirmModalOpen(false)}
                className="flex-1 py-[14px] rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-[15px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeBulkDelete}
                className="flex-1 py-[14px] rounded-xl font-bold text-white bg-[#ef003d] hover:bg-rose-700 transition-colors text-[15px]"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {roleConfirmModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-[500px] overflow-hidden transform transition-all scale-100 animate-slide-up flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h3 className="text-[17px] font-extrabold text-slate-800">
                Thay đổi vai trò {selectedIds.length} nhân viên
              </h3>
              <button onClick={() => setRoleConfirmModalOpen(false)} className="text-slate-500 hover:text-slate-800 transition-colors">
                <FiX className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
            
            {/* Body */}
            <div className="px-8 pt-8 pb-10 text-center flex flex-col items-center">
              <div className="w-[60px] h-[60px] bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <FiAlertTriangle className="w-[26px] h-[26px] text-amber-500 stroke-2" />
              </div>
              
              <p className="text-[15.5px] text-slate-600 leading-[1.6] font-medium px-2">
                CẢNH BÁO: Việc thay đổi vai trò sẽ ảnh hưởng trực tiếp đến quyền hạn truy cập hệ thống của {selectedIds.length} nhân viên đã chọn. Bạn có CHẮC CHẮN muốn thay đổi vai trò không?
              </p>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 pt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setRoleConfirmModalOpen(false)}
                className="flex-1 py-[14px] rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-[15px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeBulkEdit}
                className="flex-1 py-[14px] rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors text-[15px]"
              >
                Đồng ý thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bulk Edit Employees */}
      {bulkEditModalOpen && (
        <Modal
          isOpen={bulkEditModalOpen}
          onClose={() => setBulkEditModalOpen(false)}
          title={selectedIds.length === 1 ? 'Chỉnh sửa thông tin nhân viên' : `Cập nhật thông tin cho ${selectedIds.length} nhân viên`}
        >
          <form onSubmit={handleBulkEditEmployeesSubmit} className="space-y-4 text-left">
            <Select
              label="Phòng ban mới (Tùy chọn):"
              name="bulkDept"
              value={bulkDepartmentId}
              onChange={(e) => setBulkDepartmentId(e.target.value)}
              options={departments.map((d) => ({ value: d.department_id, label: d.department_name }))}
              placeholder="-- Giữ nguyên phòng ban --"
            />

            <Select
              label="Vai trò mới (Tùy chọn):"
              name="bulkRole"
              value={bulkRoleId}
              onChange={(e) => setBulkRoleId(e.target.value)}
              options={roles.map((r) => ({ value: r.roleId ?? r.role_id, label: r.roleName ?? r.role_name }))}
              placeholder="-- Giữ nguyên vai trò --"
            />

            <Select
              label="Trạng thái hoạt động (Tùy chọn):"
              name="bulkStatus"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              options={[
                { value: '1', label: 'Hoạt động' },
                { value: '0', label: 'Ngừng hoạt động' }
              ]}
              placeholder="-- Giữ nguyên trạng thái --"
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" size="sm" onClick={() => setBulkEditModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Lưu thay đổi ({selectedIds.length} nhân viên)
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Employees;
