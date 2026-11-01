import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProductById, restoreSeed, subscribeCatalog } from './catalogStore.js'
import {
  applyCount,
  clearAllCounts,
  clearCount,
  countsSummary,
  diffFor,
  getStockCounts,
  recordCount,
  reloadStockCounts,
  subscribeStockCounts,
} from './stockCount.js'

const STORAGE_KEY = 'delta-store:stock-counts'

function stored() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY))
}

beforeEach(() => {
  localStorage.clear()
  restoreSeed()
  clearAllCounts()
  localStorage.clear()
  reloadStockCounts()
})

describe('تسجيل العدّ', () => {
  it('لا يمس رقم المخزون المكتوب', () => {
    const before = getProductById('DL-2001').stock
    const result = recordCount('DL-2001', before - 40)
    expect(result.entry.count).toBe(before - 40)
    expect(getProductById('DL-2001').stock).toBe(before)
  })

  it('يرفض الفراغ والسالب وغير الرقم', () => {
    expect(recordCount('DL-2001', '')).toEqual({ error: 'اكتب عددًا صحيحًا غير سالب.' })
    expect(recordCount('DL-2001', -5)).toHaveProperty('error')
    expect(recordCount('DL-2001', 'thلاثة')).toHaveProperty('error')
    expect(recordCount('', 10)).toHaveProperty('error')
    expect(getStockCounts()).toEqual({})
  })

  it('يسقط الكسور ويقرأ الأرقام العربية من النص', () => {
    expect(recordCount('DL-2001', '37.9').entry.count).toBe(37)
    expect(recordCount('DL-2001', '٢٥').entry.count).toBe(25)
    expect(recordCount('DL-2001', ' ٠ ').entry.count).toBe(0)
    expect(recordCount('DL-2002', '-٥')).toHaveProperty('error')
  })

  it('يبقى العدّ الأحدث وحده للصنف', () => {
    recordCount('DL-3001', 100)
    recordCount('DL-3001', 118)
    expect(Object.keys(getStockCounts())).toEqual(['DL-3001'])
    expect(getStockCounts()['DL-3001'].count).toBe(118)
  })
})

describe('الفارق والملخص', () => {
  it('يحسب الفارق بين المعدود والمكتوب', () => {
    const product = getProductById('DL-2001')
    recordCount(product.id, product.stock + 6)
    expect(diffFor(product)).toBe(6)
    recordCount(product.id, product.stock - 6)
    expect(diffFor(product)).toBe(-6)
  })

  it('بلا عدّ = بلا فارق', () => {
    expect(diffFor(getProductById('DL-2001'))).toBeNull()
    expect(diffFor(null)).toBeNull()
  })

  it('عدّ مطابق لا يدخل في الفروق', () => {
    const product = getProductById('DL-2001')
    recordCount(product.id, product.stock)
    const summary = countsSummary([product])
    expect(summary).toMatchObject({ recorded: 1, pending: 1, mismatched: 0, untouched: 0 })
  })

  it('يعدّ الأصناف التي لم تُعدّ منفصلًا عن المسجَّل', () => {
    const a = getProductById('DL-2001')
    const b = getProductById('DL-2002')
    recordCount(a.id, 10)
    expect(countsSummary([a, b])).toMatchObject({ recorded: 1, pending: 1, untouched: 1 })
    expect(countsSummary([]).recorded).toBe(0)
    expect(countsSummary(null).recorded).toBe(0)
  })
})

describe('الاعتماد', () => {
  it('يكتب العدد المعدود في المخزون ويؤرّخ الاعتماد', () => {
    const product = getProductById('DL-4001')
    recordCount(product.id, 205)
    const result = applyCount(product.id)
    expect(result.stock).toBe(205)
    expect(getProductById(product.id).stock).toBe(205)
    expect(getStockCounts()[product.id].appliedAt).toBeTruthy()
    expect(diffFor(getProductById(product.id))).toBe(0)
  })

  it('يرفض صنفًا بلا عدّ أو صنفًا غير موجود', () => {
    expect(applyCount('DL-5001')).toEqual({ error: 'لا يوجد عدّ مسجَّل لهذا الصنف.' })
    recordCount('DL-7777', 4)
    expect(applyCount('DL-7777')).toEqual({ error: 'الصنف غير موجود في الكتالوج.' })
  })

  it('مسح العدّ لا يرجّع المخزون لقيمته القديمة', () => {
    const product = getProductById('DL-5002')
    const before = product.stock
    recordCount(product.id, before + 25)
    applyCount(product.id)
    expect(clearCount(product.id)).toBe(true)
    expect(getProductById(product.id).stock).toBe(before + 25)
    expect(getStockCounts()[product.id]).toBeUndefined()
    expect(clearCount('DL-6001')).toBe(false)
  })

  it('لا يلمس حقول الصنف الأخرى', () => {
    const product = getProductById('DL-6001')
    recordCount(product.id, 5)
    applyCount(product.id)
    const after = getProductById(product.id)
    expect(after).toMatchObject({
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      name: product.name,
    })
  })
})

describe('التخزين والاشتراك', () => {
  it('يحفظ في مفتاح خاص ويحذفه عند إفراغ العدّ', () => {
    recordCount('DL-3001', 42)
    expect(stored()['DL-3001'].count).toBe(42)
    clearAllCounts()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('يتجاهل القيد التالف عند إعادة القراءة', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ 'DL-2001': { count: 'ثلاثة' }, 'DL-2002': { count: 8, at: 'وقت' } })
    )
    expect(reloadStockCounts()).toEqual({ 'DL-2002': { count: 8, at: 'وقت', appliedAt: null } })
  })

  it('يبلغ المستمعين عند التسجيل والاعتماد والمسح', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeStockCounts(listener)
    recordCount('DL-2002', 12)
    applyCount('DL-2002')
    clearCount('DL-2002')
    expect(listener).toHaveBeenCalledTimes(3)
    unsubscribe()
    recordCount('DL-2003', 12)
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('الاعتماد يحرّك مشتركي الكتالوج أيضًا', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCatalog(listener)
    recordCount('DL-3002', 90)
    expect(listener).not.toHaveBeenCalled()
    applyCount('DL-3002')
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })
})
