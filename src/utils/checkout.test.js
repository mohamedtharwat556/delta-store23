import { describe, expect, it } from 'vitest'
import { GOVERNORATE_COUNT, governorates, isGovernorate } from '../data/governorates.js'
import { isValidPhone, normalizePhone, validateOrderContact } from './checkout.js'

describe('normalizePhone', () => {
  it('يزيل المسافات والشرطات', () => {
    expect(normalizePhone('010-1234-5678')).toBe('01012345678')
    expect(normalizePhone(' 011 1234 5678 ')).toBe('01112345678')
  })

  it('يحوّل الأرقام العربية إلى لاتينية', () => {
    expect(normalizePhone('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678')
  })

  it('يقبل الأرقام الصحيحة فقط', () => {
    expect(isValidPhone('01012345678')).toBe(true)
    expect(isValidPhone('01276543210')).toBe(true)
    expect(isValidPhone('01312345678')).toBe(false)
    expect(isValidPhone('0101234567')).toBe(false)
    expect(isValidPhone('')).toBe(false)
  })
})

describe('validateOrderContact', () => {
  const valid = {
    customer: 'محل النور للخردوات',
    phone: '01012345678',
    area: 'القاهرة',
    address: 'شارع السوق — بجوار المسجد',
    notes: 'التسليم صباحًا',
  }

  it('يمرّر بيانات صحيحة بلا أخطاء مع تنظيف القيم', () => {
    const { errors, cleaned } = validateOrderContact(valid)
    expect(errors).toEqual({})
    expect(cleaned).toEqual({
      customer: 'محل النور للخردوات',
      phone: '01012345678',
      area: 'القاهرة',
      address: 'شارع السوق — بجوار المسجد',
      notes: 'التسليم صباحًا',
    })
  })

  it('العنوان التفصيلي اختياري', () => {
    const { errors, cleaned } = validateOrderContact({ ...valid, address: '' })
    expect(errors).toEqual({})
    expect(cleaned.address).toBe('')
  })

  it('يرفض اسمًا قصيرًا أو رقمًا غير مصري أو محافظة ليست في القائمة', () => {
    const { errors } = validateOrderContact({
      customer: 'م',
      phone: '01312345678',
      area: 'محافظة غير موجودة',
    })
    expect(errors.customer).toBeTruthy()
    expect(errors.phone).toBeTruthy()
    expect(errors.area).toBeTruthy()
  })

  it('يطلب المحافظة ويزعم خطأ مختلفًا لغيابها', () => {
    const { errors } = validateOrderContact({ ...valid, area: '' })
    expect(errors.area).toBe('اختر المحافظة من القائمة.')
  })

  it('يرفض رقم تواصل فارغًا برسالة أوضح من رسالة الرقم الخاطئ', () => {
    const empty = validateOrderContact({ ...valid, phone: '' })
    expect(empty.errors.phone).toBe('رقم التواصل مطلوب لمتابعة الطلب.')
    const wrong = validateOrderContact({ ...valid, phone: '12345' })
    expect(wrong.errors.phone).toContain('11 رقم')
  })

  it('يمنع العنوان الطويل جدًا', () => {
    const { errors } = validateOrderContact({ ...valid, address: 'أ'.repeat(121) })
    expect(errors.address).toBeTruthy()
  })

  it('لا ينكسر مع قيم ناقصة', () => {
    const { errors, cleaned } = validateOrderContact(undefined)
    expect(Object.keys(errors)).toEqual(['customer', 'phone', 'area'])
    expect(cleaned).toEqual({ customer: '', phone: '', area: '', address: '', notes: '' })
  })
})

describe('قائمة المحافظات', () => {
  it('تضم ٢٧ محافظة بلا تكرار', () => {
    expect(GOVERNORATE_COUNT).toBe(27)
    expect(new Set(governorates).size).toBe(governorates.length)
  })

  it('تتعرف على الأسماء مع تجاهل المسافات الزائدة', () => {
    expect(isGovernorate('القاهرة')).toBe(true)
    expect(isGovernorate('  الجيزة ')).toBe(true)
    expect(isGovernorate('منطقة تجريبية أ')).toBe(false)
    expect(isGovernorate(undefined)).toBe(false)
  })

  it('كل محافظة تتمر على التحقق نفسه المستخدم في النموذج', () => {
    for (const area of governorates) {
      expect(validateOrderContact({ customer: 'محل', phone: '01012345678', area }).errors).toEqual({})
    }
  })
})
