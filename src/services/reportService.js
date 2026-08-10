import api from './api';

const reportService = {
  /**
   * Lấy báo cáo tổng hợp hệ thống
   * @param {Object} params - { fromDate, toDate }
   */
  getReportsSummary: (params = {}) => {
    return api.get('/admin/reports/summary', { params });
  },
  getPayrollReport: (params = {}) => {
    return api.get('/admin/reports/payroll', { params });
  },
};

export default reportService;
