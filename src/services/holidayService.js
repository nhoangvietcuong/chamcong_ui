import api from './api';

const MOCK_KEY = 'mock_holidays';

const getMockHolidays = () => {
  const data = localStorage.getItem(MOCK_KEY);
  if (!data) {
    const initialHolidays = [
      {
        id: 'holiday_1',
        name: 'Tết Dương lịch',
        calendarType: 'solar',
        isAnnual: true,
        year: new Date().getFullYear(),
        repeatType: 'monthly',
        month: 1,
        selectedDays: [1],
        multiplier: 2,
        createdAt: '2026-01-01',
        status: 'active'
      },
      {
        id: 'holiday_2',
        name: 'Quốc Khánh',
        calendarType: 'solar',
        isAnnual: true,
        year: new Date().getFullYear(),
        repeatType: 'monthly',
        month: 9,
        selectedDays: [2],
        multiplier: 2,
        createdAt: '2026-01-01',
        status: 'active'
      },
      {
        id: 'holiday_3',
        name: 'Giỗ tổ Hùng Vương',
        calendarType: 'lunar',
        isAnnual: true,
        year: new Date().getFullYear(),
        repeatType: 'monthly',
        month: 3,
        selectedDays: [10],
        multiplier: 2,
        createdAt: '2026-01-01',
        status: 'active'
      }
    ];
    localStorage.setItem(MOCK_KEY, JSON.stringify(initialHolidays));
    return initialHolidays;
  }
  return JSON.parse(data);
};

const saveMockHolidays = (holidays) => {
  localStorage.setItem(MOCK_KEY, JSON.stringify(holidays));
};

export const holidayService = {
  /**
   * @typedef {Object} HolidaySetting
   * @property {string} [id] - Mã định danh ngày lễ
   * @property {string} name - Tên ngày lễ
   * @property {'solar'|'lunar'} calendarType - Loại lịch (dương lịch / âm lịch)
   * @property {boolean} isAnnual - Áp dụng hằng năm hay không
   * @property {number} [year] - Năm áp dụng (nếu không áp dụng hằng năm)
   * @property {'all'|'weekly'|'monthly'} repeatType - Chế độ lặp (tất cả, theo tuần, theo tháng)
   * @property {number} [month] - Tháng áp dụng (nếu chế độ lặp theo tháng)
   * @property {number[]} selectedDays - Ngày được chọn (ngày trong tháng hoặc ngày trong tuần từ 2-8)
   * @property {string} [createdAt] - Ngày tạo cấu hình
   * @property {'active'|'inactive'} status - Trạng thái hoạt động
   */

  /**
   * Lấy danh sách cấu hình ngày lễ
   * @returns {Promise<{success: boolean, data: HolidaySetting[]}>}
   */
  getHolidays: async () => {
    // TODO: Connect with actual backend API: GET /admin/holidays
    try {
      const res = await api.get('/admin/holidays');
      return res;
    } catch (err) {
      console.warn('Backend API GET /admin/holidays not available, using mock data.', err);
      return { success: true, data: getMockHolidays() };
    }
  },

  /**
   * Tạo mới cấu hình ngày lễ
   * @param {HolidaySetting} holidayData 
   * @returns {Promise<{success: boolean, data: HolidaySetting}>}
   */
  createHoliday: async (holidayData) => {
    // TODO: Connect with actual backend API: POST /admin/holidays
    try {
      const res = await api.post('/admin/holidays', holidayData);
      return res;
    } catch (err) {
      console.warn('Backend API POST /admin/holidays not available, using mock data.', err);
      const mockList = getMockHolidays();
      const newHoliday = {
        ...holidayData,
        id: 'holiday_' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString().split('T')[0],
        status: holidayData.status || 'active'
      };
      mockList.push(newHoliday);
      saveMockHolidays(mockList);
      return { success: true, data: newHoliday };
    }
  },

  /**
   * Cập nhật cấu hình ngày lễ
   * @param {string} id 
   * @param {HolidaySetting} holidayData 
   * @returns {Promise<{success: boolean, data: HolidaySetting}>}
   */
  updateHoliday: async (id, holidayData) => {
    // TODO: Connect with actual backend API: PUT /admin/holidays/:id
    try {
      const res = await api.put(`/admin/holidays/${id}`, holidayData);
      return res;
    } catch (err) {
      console.warn(`Backend API PUT /admin/holidays/${id} not available, using mock data.`, err);
      const mockList = getMockHolidays();
      const idx = mockList.findIndex(h => h.id === id);
      if (idx !== -1) {
        mockList[idx] = { ...mockList[idx], ...holidayData };
        saveMockHolidays(mockList);
        return { success: true, data: mockList[idx] };
      }
      throw new Error('Holiday not found');
    }
  },

  /**
   * Xóa cấu hình ngày lễ
   * @param {string} id 
   * @returns {Promise<{success: boolean}>}
   */
  deleteHoliday: async (id) => {
    // TODO: Connect with actual backend API: DELETE /admin/holidays/:id
    try {
      const res = await api.delete(`/admin/holidays/${id}`);
      return res;
    } catch (err) {
      console.warn(`Backend API DELETE /admin/holidays/${id} not available, using mock data.`, err);
      const mockList = getMockHolidays();
      const filtered = mockList.filter(h => h.id !== id);
      saveMockHolidays(filtered);
      return { success: true };
    }
  }
};

export default holidayService;
