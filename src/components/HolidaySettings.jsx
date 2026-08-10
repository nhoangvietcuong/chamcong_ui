import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiPlus, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import useApp from '../hooks/useApp';
import holidayService from '../services/holidayService';
import ConfirmDialog from './ConfirmDialog';
import Table from './Table';
import Modal from './Modal';

export const HolidaySettings = () => {
  const { toast } = useApp();
  
  // List state
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [calendarType, setCalendarType] = useState('solar'); // solar, lunar
  const [isAnnual, setIsAnnual] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [repeatType, setRepeatType] = useState('monthly'); // all, weekly, monthly
  const [month, setMonth] = useState(1);
  const [selectedDays, setSelectedDays] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [multiplier, setMultiplier] = useState(2);

  // Deletion confirm dialog states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [showList, setShowList] = useState(false);

  // Load holidays on mount
  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await holidayService.getHolidays();
      if (res && res.success && res.data) {
        setHolidays(res.data);
      }
    } catch (err) {
      toast.error('Không thể tải danh sách ngày lễ');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCalendarType('solar');
    setIsAnnual(true);
    setYear(new Date().getFullYear());
    setRepeatType('monthly');
    setMonth(1);
    setSelectedDays([]);
    setEditingId(null);
    setMultiplier(2);
  };

  const handleRepeatTypeChange = (type) => {
    setRepeatType(type);
    setSelectedDays([]);
  };

  const handleToggleDay = (day) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  // Helper to detect if a holiday schedule overlaps with existing ones
  const detectOverlap = (newHoliday) => {
    for (const h of holidays) {
      // Exclude the one currently being edited
      if (editingId && h.id === editingId) continue;

      // Only compare holidays of the same calendar type (solar / lunar)
      if (h.calendarType !== newHoliday.calendarType) continue;

      // Check year compatibility (either one is annual, or both apply to the same specific year)
      const isYearOverlap = h.isAnnual || newHoliday.isAnnual || h.year === newHoliday.year;
      if (!isYearOverlap) continue;

      // Check overlap between 'all' and any schedule
      if (h.repeatType === 'all' || newHoliday.repeatType === 'all') {
        return h;
      }

      // Check weekly overlap
      if (h.repeatType === 'weekly' && newHoliday.repeatType === 'weekly') {
        const commonDays = h.selectedDays.filter(d => newHoliday.selectedDays.includes(d));
        if (commonDays.length > 0) return h;
      }

      // Check monthly overlap
      if (h.repeatType === 'monthly' && newHoliday.repeatType === 'monthly') {
        if (Number(h.month) === Number(newHoliday.month)) {
          const commonDays = h.selectedDays.filter(d => newHoliday.selectedDays.includes(d));
          if (commonDays.length > 0) return h;
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên ngày lễ.');
      return;
    }

    if (repeatType !== 'all' && selectedDays.length === 0) {
      toast.error(
        repeatType === 'weekly'
          ? 'Vui lòng chọn ít nhất một ngày trong tuần.'
          : 'Vui lòng chọn ít nhất một ngày trong tháng.'
      );
      return;
    }

    // 2. Prepare payload
    const holidayData = {
      name: name.trim(),
      calendarType,
      isAnnual,
      year: isAnnual ? undefined : Number(year),
      repeatType,
      month: repeatType === 'monthly' ? Number(month) : undefined,
      selectedDays: repeatType === 'all' ? [] : selectedDays,
      multiplier: Number(multiplier),
      status: 'active'
    };

    // 3. Overlap Check
    const overlapping = detectOverlap(holidayData);
    if (overlapping) {
      toast.error(`Trùng cấu hình! Ngày nghỉ đã chọn bị trùng lịch với ngày lễ: "${overlapping.name}".`);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await holidayService.updateHoliday(editingId, holidayData);
        if (res && res.success) {
          toast.success('Cập nhật cấu hình ngày lễ thành công!');
          fetchHolidays();
          resetForm();
          setShowList(true);
        }
      } else {
        const res = await holidayService.createHoliday(holidayData);
        if (res && res.success) {
          toast.success('Lưu cấu hình ngày lễ thành công!');
          fetchHolidays();
          resetForm();
          setShowList(true);
        }
      }
    } catch (err) {
      toast.error('Lỗi khi lưu cấu hình ngày lễ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (holiday) => {
    setName(holiday.name);
    setCalendarType(holiday.calendarType || 'solar');
    setIsAnnual(holiday.isAnnual !== undefined ? holiday.isAnnual : true);
    setYear(holiday.year || new Date().getFullYear());
    setRepeatType(holiday.repeatType);
    setMonth(holiday.month || 1);
    setSelectedDays(holiday.selectedDays || []);
    setEditingId(holiday.id);
    setShowList(false);
    toast.info(`Đang chỉnh sửa ngày lễ: "${holiday.name}"`);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await holidayService.deleteHoliday(deletingId);
      if (res && res.success) {
        toast.success('Xóa cấu hình ngày lễ thành công!');
        fetchHolidays();
      } else {
        toast.error('Không thể xóa cấu hình ngày lễ.');
      }
    } catch (err) {
      toast.error('Đã xảy ra lỗi khi xóa ngày lễ.');
    } finally {
      setIsConfirmOpen(false);
      setDeletingId(null);
    }
  };

  // Helper function to format creation dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Formatter for 'Ngày áp dụng' column
  const renderDateApplied = (holiday) => {
    const { repeatType, calendarType, selectedDays, month, isAnnual, year } = holiday;
    const suffix = calendarType === 'lunar' ? ' Âm lịch' : '';
    const annualSuffix = isAnnual ? '' : ` (Năm ${year})`;

    if (repeatType === 'all') {
      return `Tất cả các ngày${suffix}${annualSuffix}`;
    }

    if (repeatType === 'weekly') {
      const dayNames = {
        2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ Nhật'
      };
      const days = [...selectedDays]
        .sort((a, b) => a - b)
        .map(d => dayNames[d] || d)
        .join(', ');
      return `${days}${suffix}${annualSuffix}`;
    }

    if (repeatType === 'monthly') {
      if (!selectedDays || selectedDays.length === 0) return '';
      const sorted = [...selectedDays].sort((a, b) => a - b);
      const monthStr = String(month).padStart(2, '0');

      const ranges = [];
      let start = sorted[0];
      let prev = sorted[0];

      for (let i = 1; i <= sorted.length; i++) {
        const current = sorted[i];
        if (current === prev + 1) {
          prev = current;
        } else {
          if (start === prev) {
            ranges.push(String(start).padStart(2, '0'));
          } else {
            ranges.push(`${String(start).padStart(2, '0')} - ${String(prev).padStart(2, '0')}`);
          }
          start = current;
          prev = current;
        }
      }

      const formatted = ranges.map(r => {
        if (r.includes('-')) {
          const [s, e] = r.split(' - ');
          return `${s}/${monthStr} - ${e}/${monthStr}`;
        }
        return `${r}/${monthStr}`;
      }).join(', ');

      return `${formatted}${suffix}${annualSuffix}`;
    }

    return '';
  };

  const headers = [
    { key: 'name', label: 'Tên ngày lễ', sortable: false },
    { key: 'dates', label: 'Ngày áp dụng', sortable: false },
    { key: 'createdAt', label: 'Ngày tạo', sortable: false },
    { key: 'multiplier', label: 'Hệ số công', sortable: false, width: '100px' },
    { key: 'status', label: 'Trạng thái', sortable: false, width: '120px' },
    { key: 'actions', label: 'Thao tác', sortable: false, width: '120px' }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div className="border-b pb-2 flex justify-between items-center border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200">
          {editingId ? 'Cập nhật Cấu hình ngày lễ' : 'Cấu hình ngày lễ'}
        </h3>
        {editingId && (
          <button 
            type="button" 
            onClick={resetForm}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX className="w-3.5 h-3.5" />
            Hủy chế độ sửa
          </button>
        )}
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSubmit} className="space-y-5 text-xs bg-slate-50/20 dark:bg-slate-900/10 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tên ngày lễ */}
          <div className="space-y-1">
            <label className="text-slate-455 dark:text-slate-400 font-semibold">Tên ngày lễ:</label>
            <input
              type="text"
              name="holidayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên ngày lễ..."
              className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none"
            />
          </div>

          {/* Loại lịch */}
          <div className="space-y-1">
            <label className="text-slate-455 dark:text-slate-400 font-semibold block mb-1">Loại lịch:</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-350">
                <input
                  type="radio"
                  name="calendarType"
                  value="solar"
                  checked={calendarType === 'solar'}
                  onChange={() => setCalendarType('solar')}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded-full"
                />
                <span>Lịch dương</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-350">
                <input
                  type="radio"
                  name="calendarType"
                  value="lunar"
                  checked={calendarType === 'lunar'}
                  onChange={() => setCalendarType('lunar')}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded-full"
                />
                <span>Lịch âm</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Áp dụng hằng năm */}
          <div className="space-y-1 flex flex-col justify-center">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-350 font-semibold">
              <input
                type="checkbox"
                checked={isAnnual}
                onChange={(e) => setIsAnnual(e.target.checked)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded rounded-sm"
              />
              <span>Áp dụng hằng năm</span>
            </label>
          </div>

          {/* Năm áp dụng */}
          {!isAnnual && (
            <div className="space-y-1">
              <label className="text-slate-455 dark:text-slate-400 font-semibold">Năm áp dụng:</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={new Date().getFullYear()}
                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Hệ số công đi làm ngày lễ */}
        <div className="space-y-1 text-left">
          <label className="text-slate-455 dark:text-slate-400 font-semibold block mb-1">
            Hệ số công đi làm ngày lễ (Gấp mấy lần ngày thường):
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-32 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg p-2 focus:outline-none"
            />
            <span className="text-slate-500 dark:text-slate-450">(Mặc định: 2 - Nhân đôi công)</span>
          </div>
        </div>

        {/* Chế độ lặp / Chọn ngày nghỉ */}
        <div className="space-y-1.5">
          <label className="text-slate-455 dark:text-slate-400 font-semibold block mb-1">Chọn ngày nghỉ:</label>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-350">
              <input
                type="radio"
                name="repeatType"
                value="all"
                checked={repeatType === 'all'}
                onChange={() => handleRepeatTypeChange('all')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded-full"
              />
              <span>Tất cả các ngày</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-350">
              <input
                type="radio"
                name="repeatType"
                value="weekly"
                checked={repeatType === 'weekly'}
                onChange={() => handleRepeatTypeChange('weekly')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded-full"
              />
              <span>Chọn ngày trong tuần</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-350">
              <input
                type="radio"
                name="repeatType"
                value="monthly"
                checked={repeatType === 'monthly'}
                onChange={() => handleRepeatTypeChange('monthly')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded-full"
              />
              <span>Chọn ngày trong tháng</span>
            </label>
          </div>
        </div>

        {/* Weekly Day Selector */}
        {repeatType === 'weekly' && (
          <div className="space-y-2 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-4 bg-white dark:bg-slate-900/30">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Chọn ngày trong tuần:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 2, label: 'Thứ 2' },
                { value: 3, label: 'Thứ 3' },
                { value: 4, label: 'Thứ 4' },
                { value: 5, label: 'Thứ 5' },
                { value: 6, label: 'Thứ 6' },
                { value: 7, label: 'Thứ 7' },
                { value: 8, label: 'Chủ Nhật' }
              ].map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleToggleDay(day.value)}
                    className={`px-3 py-1.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly Day Selector */}
        {repeatType === 'monthly' && (
          <div className="space-y-3 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-4 bg-white dark:bg-slate-900/30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chọn tháng:</span>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg p-1 px-2 focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-550 block">Chọn ngày trong tháng:</span>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`py-2 px-1 text-center rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Buttons Action */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-750 dark:text-slate-300 rounded-xl font-semibold shadow-sm transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-60"
          >
            <FiSave className="w-4 h-4" />
            {editingId ? 'Cập nhật' : 'Lưu'}
          </button>
        </div>
      </form>

      {/* Toggle View List Button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setShowList(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors bg-white dark:bg-slate-900 font-semibold shadow-sm cursor-pointer"
        >
          <FiCalendar className="w-4 h-4 text-primary-600" />
          Xem danh sách ngày lễ
        </button>
      </div>

      {/* Holidays List Modal */}
      <Modal
        isOpen={showList}
        onClose={() => setShowList(false)}
        title="Danh sách ngày lễ đã khai báo"
        size="xl"
      >
        <div className="space-y-4">
          <Table
            headers={headers}
            items={holidays}
            loading={loading}
            emptyState={
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <FiAlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Chưa có ngày lễ nào được khai báo</p>
                <p className="text-xs text-slate-400">Vui lòng sử dụng form bên ngoài để thêm mới.</p>
              </div>
            }
            renderRow={(item) => (
              <>
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                  {item.name}
                </td>
                <td className="px-6 py-4 text-slate-700 dark:text-slate-350">
                  {renderDateApplied(item)}
                </td>
                <td className="px-6 py-4 text-slate-550 dark:text-slate-400">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                  x{item.multiplier || 2}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/10">
                    Đang áp dụng
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(item.id)}
                      className="text-rose-650 hover:text-rose-800 dark:text-rose-455 dark:hover:text-rose-350 font-bold transition-colors cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa ngày lễ"
        message="Bạn có chắc chắn muốn xóa ngày lễ này khỏi danh sách? Hệ thống sẽ ngừng áp dụng lịch nghỉ này ngay lập tức."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        type="danger"
      />
    </div>
  );
};

export default HolidaySettings;
