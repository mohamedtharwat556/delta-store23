import { isGovernorate } from '../data/governorates.js'
import { normalizeArabic } from './arabic.js'

// يقبل 010 / 011 / 012 / 015 + ٨ أرقام، مع تجاهل المسافات والشرطات والأرقام العربية
export function normalizePhone(value) {
  return normalizeArabic(value).replace(/[-\s]/g, '')
}

export const PHONE_PATTERN = /^01[0125]\d{8}$/

export function isValidPhone(value) {
  return PHONE_PATTERN.test(normalizePhone(value))
}

export function validateOrderContact(values) {
  const source = values ?? {}
  const customer = String(source.customer ?? '').trim()
  const phone = normalizePhone(source.phone)
  const area = String(source.area ?? '').trim()
  const address = String(source.address ?? '').trim()
  const notes = String(source.notes ?? '').trim()

  const errors = {}
  if (customer.length < 3) errors.customer = 'اكتب اسمًا واضحًا لا يقل عن 3 أحرف.'
  if (!phone) errors.phone = 'رقم التواصل مطلوب لمتابعة الطلب.'
  else if (!PHONE_PATTERN.test(phone)) errors.phone = 'رقم غير صحيح: 11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015.'
  if (!area) errors.area = 'اختر المحافظة من القائمة.'
  else if (!isGovernorate(area)) errors.area = 'المحافظة غير موجودة في القائمة.'
  if (address.length > 120) errors.address = 'العنوان التفصيلي طويل؛ اجعله في جملة قصيرة.'

  return { errors, cleaned: { customer, phone, area, address, notes } }
}

// البحث في التتبع: رقم غير مكتمل لا يُرجع نتائج، والمقارنة بعد التطبيع تقبل المسافات والأرقام العربية
export function ordersForPhone(orders, value) {
  const digits = normalizePhone(value)
  if (!PHONE_PATTERN.test(digits)) return []
  return (orders ?? []).filter((order) => normalizePhone(order.phone) === digits)
}
