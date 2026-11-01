import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_DELIVERY_RULES,
  deliveryQuote,
  freeShippingHint,
  getDeliveryRules,
  isLocalArea,
  parseRuleAmount,
  payableOf,
  resetDeliveryRules,
  sanitizeDelivery,
  saveDeliveryRules,
  subscribeDeliveryRules,
  wholesaleGate,
} from './delivery.js'

const stored = () => {
  const raw = window.localStorage.getItem('delta-store:delivery-rules')
  return raw ? JSON.parse(raw) : null
}

beforeEach(() => {
  resetDeliveryRules()
})

describe('تصنيف النطاق', () => {
  it('يعتبر دمياط والزرقا نطاقًا قريبًا وغيرهما بعيدًا', () => {
    expect(isLocalArea('دمياط')).toBe(true)
    expect(isLocalArea('الزرقا')).toBe(true)
    expect(isLocalArea('مركز الزرقا — دمياط')).toBe(true)
    expect(isLocalArea('الجيزة')).toBe(false)
    expect(isLocalArea('')).toBe(false)
    expect(isLocalArea(undefined)).toBe(false)
  })
})

describe('deliveryQuote', () => {
  it('يرفض التقدير بلا محافظة حتى لا يُختلق رقم', () => {
    expect(deliveryQuote({ area: '', subtotal: 500 })).toBeNull()
    expect(deliveryQuote({})).toBeNull()
  })

  it('يستخدم الرسوم حسب النطاق', () => {
    expect(deliveryQuote({ area: 'دمياط', subtotal: 180 })).toMatchObject({
      amount: DEFAULT_DELIVERY_RULES.feeLocal,
      waived: false,
    })
    expect(deliveryQuote({ area: 'الإسكندرية', subtotal: 180 })).toMatchObject({
      amount: DEFAULT_DELIVERY_RULES.feeOther,
      waived: false,
    })
  })

  it('يعفي من الرسوم عند بلوغ الحد ويذكر النطاق الأصلي', () => {
    const quote = deliveryQuote({ area: 'الجيزة', subtotal: DEFAULT_DELIVERY_RULES.freeFrom })
    expect(quote).toMatchObject({ label: 'توصيل مجاني', amount: 0, waived: true })
    expect(quote.baseLabel).toContain('باقي المحافظات')
  })

  it('صفر في حد الإعفاء يعني بلا إعفاء إطلاقًا', () => {
    saveDeliveryRules({ freeFrom: 0 })
    expect(deliveryQuote({ area: 'دمياط', subtotal: 99999 })).toMatchObject({ amount: 15, waived: false })
  })
})

describe('freeShippingHint و wholesaleGate', () => {
  it('يحسب الناقص ويبلغ الوصول', () => {
    expect(freeShippingHint(1000)).toMatchObject({ reached: false, missing: 500 })
    expect(freeShippingHint(2000)).toMatchObject({ reached: true, missing: 0 })
  })

  it('صفر في حد الإعفاء يلغي التلميح', () => {
    saveDeliveryRules({ freeFrom: 0 })
    expect(freeShippingHint(5000)).toBeNull()
  })

  it('يرفض طلب الجملة الناقص ويحسب ما ينقصه', () => {
    expect(wholesaleGate(120)).toMatchObject({ ok: false, min: 300, missing: 180 })
    expect(wholesaleGate(300).ok).toBe(true)
    expect(wholesaleGate(1200)).toMatchObject({ ok: true, missing: 0 })
  })

  it('صفر في حد الجملة يعني بلا حد أدنى', () => {
    saveDeliveryRules({ wholesaleMin: 0 })
    expect(wholesaleGate(1)).toMatchObject({ ok: true, min: 0 })
  })
})

describe('حفظ الإعدادات', () => {
  it('يقبل الأرقام الموجبة ويترك القديم عند قيمة غير صالحة', () => {
    const saved = saveDeliveryRules({ feeLocal: 7.5, feeOther: -3 })
    expect(saved).toMatchObject({ feeLocal: 7.5, feeOther: DEFAULT_DELIVERY_RULES.feeOther })
    expect(saveDeliveryRules({ freeFrom: 'abc' }).freeFrom).toBe(DEFAULT_DELIVERY_RULES.freeFrom)
    expect(saveDeliveryRules({ wholesaleMin: '450' }).wholesaleMin).toBe(450)
  })

  it('يحفظ في المتصفح ويمسح المخزن عند الرجوع للافتراضي', () => {
    saveDeliveryRules({ feeLocal: 99 })
    expect(stored()).toMatchObject({ feeLocal: 99 })
    resetDeliveryRules()
    expect(stored()).toBeNull()
  })

  it('ينبّه المشتركين عند الحفظ ويوقف التنبيه بعد إلغاء الاشتراك', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeDeliveryRules(listener)
    saveDeliveryRules({ feeLocal: 20 })
    expect(listener).toHaveBeenCalledTimes(1)
    resetDeliveryRules()
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    saveDeliveryRules({ feeLocal: 21 })
    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe('payableOf و sanitizeDelivery', () => {
  const order = {
    items: [{ productId: 'DL-1001', quantity: 2, unitPrice: 20 }],
    delivery: { label: 'توصيل داخل دمياط والزرقا', amount: 15 },
  }

  it('يجمع قيمة البضاعة مع بند التوصيل المخزَّن', () => {
    expect(payableOf(order)).toMatchObject({ subtotal: 40, units: 2, deliveryAmount: 15, total: 55 })
  })

  it('الطلب بلا بند توصيل يبقى إجماليه هو قيمة البضاعة', () => {
    expect(payableOf({ ...order, delivery: null })).toMatchObject({ deliveryAmount: 0, total: 40 })
  })

  it('يتجاهل بندًا غير مكتمل عند قراءة الطلبات المخزنة', () => {
    expect(sanitizeDelivery({ label: '', amount: 10 })).toBeNull()
    expect(sanitizeDelivery({ label: 'توصيل', amount: -1 })).toBeNull()
    expect(sanitizeDelivery(null)).toBeNull()
    expect(sanitizeDelivery({ label: ' توصيل ', amount: '12.5' })).toEqual({ label: 'توصيل', amount: 12.5 })
  })

  it('يدوّر لأقرب قرشين مثل بقية التسعير', () => {
    const odd = { items: [{ productId: 'x', quantity: 3, unitPrice: 0.335 }], delivery: { label: 'توصيل', amount: 0.004 } }
    expect(payableOf(odd).subtotal).toBe(1.01)
    expect(payableOf(odd).deliveryAmount).toBe(0)
    expect(payableOf(odd).total).toBe(1.01)
    expect(payableOf(null)).toMatchObject({ subtotal: 0, total: 0 })
  })
})

describe('parseRuleAmount', () => {
  it('يقبل الأرقام العربية واللاتينية والعشرية', () => {
    expect(parseRuleAmount('20')).toBe(20)
    expect(parseRuleAmount('٢٠')).toBe(20)
    expect(parseRuleAmount(' 12.5 ')).toBe(12.5)
    expect(parseRuleAmount(0)).toBe(0)
  })

  it('يرفض الفراغ والنص والإشارة السالبة بدل تحويلها لصفر أو موجب', () => {
    expect(parseRuleAmount('')).toBeNull()
    expect(parseRuleAmount('   ')).toBeNull()
    expect(parseRuleAmount(null)).toBeNull()
    expect(parseRuleAmount('بخور')).toBeNull()
    expect(parseRuleAmount('-15')).toBeNull()
    expect(parseRuleAmount('−15')).toBeNull()
    expect(parseRuleAmount('١٥-')).toBeNull()
  })

  it('يرفض القيمة الكبيرة بلا منطقي', () => {
    expect(parseRuleAmount('100000')).toBe(100000)
    expect(parseRuleAmount('100001')).toBeNull()
  })

  it('يرفض النقطة وحدها أو تكرارها', () => {
    expect(parseRuleAmount('.')).toBeNull()
    expect(parseRuleAmount('1.2.3')).toBeNull()
  })

  it('الحقل الفارغ في اللوحة لا يمسح الإعداد المحفوظ', () => {
    saveDeliveryRules({ feeLocal: 30 })
    expect(parseRuleAmount('')).toBeNull()
    expect(getDeliveryRules().feeLocal).toBe(30)
  })
})
