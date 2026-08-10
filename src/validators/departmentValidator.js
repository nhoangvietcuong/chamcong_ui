import * as z from 'zod';

export const departmentSchema = z.object({
  departmentName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên phòng ban')
    .max(100, 'Tên phòng ban quá dài'),
  description: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mô tả phòng ban')
    .max(255, 'Mô tả quá dài'),
});

export default departmentSchema;
