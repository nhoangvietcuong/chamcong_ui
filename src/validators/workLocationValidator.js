import * as z from 'zod';

const numberField = ({ requiredMsg, invalidMsg, min, max, minMsg, maxMsg }) =>
  z.union([z.string(), z.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, {
      message: requiredMsg,
    })
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), {
      message: invalidMsg,
    })
    .refine((val) => min === undefined || val >= min, {
      message: minMsg || `Giá trị không được nhỏ hơn ${min}`,
    })
    .refine((val) => max === undefined || val <= max, {
      message: maxMsg || `Giá trị không được lớn hơn ${max}`,
    });

export const locationSchema = z.object({
  locationName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên địa điểm')
    .max(100, 'Tên địa điểm tối đa 100 ký tự'),
  address: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập địa chỉ chi tiết')
    .max(255, 'Địa chỉ tối đa 255 ký tự'),
  latitude: numberField({
    requiredMsg: 'Vui lòng nhập vĩ độ',
    invalidMsg: 'Vui lòng nhập vĩ độ hợp lệ',
    min: -90,
    max: 90,
    minMsg: 'Vĩ độ từ -90 đến 90',
    maxMsg: 'Vĩ độ từ -90 đến 90',
  }),
  longitude: numberField({
    requiredMsg: 'Vui lòng nhập kinh độ',
    invalidMsg: 'Vui lòng nhập kinh độ hợp lệ',
    min: -180,
    max: 180,
    minMsg: 'Kinh độ từ -180 đến 180',
    maxMsg: 'Kinh độ từ -180 đến 180',
  }),
  allowedRadiusMeter: numberField({
    requiredMsg: 'Vui lòng nhập bán kính kiểm soát',
    invalidMsg: 'Vui lòng nhập bán kính hợp lệ',
    min: 1,
    minMsg: 'Bán kính phải lớn hơn 0',
  }),
  isCompanyLocation: z.boolean().optional(),
});

export default locationSchema;
