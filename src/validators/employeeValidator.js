import * as z from 'zod';

const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

export const employeeSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã nhân viên')
    .max(20, 'Mã nhân viên tối đa 20 ký tự'),
  fullName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập họ tên')
    .max(100, 'Họ tên tối đa 100 ký tự'),
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email liên hệ')
    .email('Email không đúng định dạng'),
  phone: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại')
    .regex(phoneRegex, 'Số điện thoại không hợp lệ (gồm 10-11 chữ số, VD: 0912345678)'),
  departmentId: z.coerce.number().min(1, 'Vui lòng chọn phòng ban'),
  createAccount: z.boolean().default(false),
  username: z.string().max(50, 'Username tối đa 50 ký tự').optional(),
  password: z.string().min(6, 'Mật khẩu phải tối thiểu 6 ký tự').optional().or(z.literal('')),
  roleId: z.coerce.number().optional(),
});

export default employeeSchema;
