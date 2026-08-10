import * as z from 'zod';

export const assignmentSchema = z.object({
  employeeId: z.coerce.number().min(1, 'Vui lòng chọn nhân viên'),
  locationId: z.coerce.number().optional(),
  locationIds: z.array(z.coerce.number()).min(1, 'Vui lòng chọn ít nhất 1 địa điểm làm việc'),
  shiftId: z.coerce.number().min(1, 'Vui lòng chọn ca làm việc'),
  workDate: z.string().min(1, 'Vui lòng chọn ngày làm việc'),
  note: z.string().max(255, 'Ghi chú tối đa 255 ký tự').optional().or(z.literal('')),
});

export default assignmentSchema;
