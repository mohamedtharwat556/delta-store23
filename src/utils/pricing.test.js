import { describe, expect, it } from 'vitest'
import {
  availabilityOf,
  BASIS_LABELS,
  buildCartLines,
  clampQuantity,
  hasKnownPrice,
  innerCount,
  orderTotals,
  priceForQuantity,
  quantityOptions,
  summarizeLines,
  wholesaleEligible,
} from './pricing.js'

const retailOnly = { id: 'P-retail', retailPrice: 10, stock: 5 }
const wholesaleOnly = { id: 'P-wholesale', retailPrice: 22, wholesalePrice: 18, wholesaleMinQuantity: 24, stock: 320 }
const withOffer = { id: 'P-offer', retailPrice: 40, offerPrice: 35, wholesalePrice: 33, wholesaleMinQuantity: 24, stock: 140 }
const packed = {
  id: 'P-packed',
  retailPrice: 22,
  wholesalePrice: 18,
  wholesaleMinQuantity: 24,
  packSize: 20,
  countUnit: 'عود',
  stock: 320,
}
// صنف أملاه التاجر باسمه وقسمه ولم تُسعَّره الشركة بعد
const unpriced = { id: 'P-unpriced', retailPrice: null, stock: null, unit: null }

describe('priceForQuantity', () => {
  it('يبقي السعر قطاعيًا تحت حد الجملة', () => {
    expect(priceForQuantity(wholesaleOnly, 23)).toMatchObject({ unit: 22, basis: 'retail', savings: 0 })
    expect(wholesaleEligible(wholesaleOnly, 23)).toBe(false)
  })

  it('يطبق سعر الجملة عند بلوغ الحد بالضبط', () => {
    expect(priceForQuantity(wholesaleOnly, 24)).toMatchObject({
      unit: 18,
      basis: 'wholesale',
      compareAt: 22,
      savings: 96,
    })
  })

  it('يستخدم سعر العرض عند عدم وجود عرض جملة، ويقدّم الجملة عندها', () => {
    expect(priceForQuantity(withOffer, 3)).toMatchObject({ unit: 35, basis: 'offer', savings: 15 })
    expect(priceForQuantity(withOffer, 24)).toMatchObject({ unit: 33, basis: 'wholesale', savings: 168 })
  })

  it('لا يخترع جملة لصنف بلا سعر جملة', () => {
    expect(priceForQuantity(retailOnly, 500)).toMatchObject({ unit: 10, basis: 'retail' })
  })

  it('يعامل الخانة الفارغة في اللوحة (null أو فراغ) كغياب لا كصفر', () => {
    const cleared = {
      id: 'P-cleared',
      retailPrice: 77,
      offerPrice: null,
      wholesalePrice: null,
      wholesaleMinQuantity: null,
      stock: 310,
    }
    expect(priceForQuantity(cleared, 1)).toMatchObject({ unit: 77, basis: 'retail', savings: 0 })
    expect(priceForQuantity(cleared, 500)).toMatchObject({ unit: 77, basis: 'retail' })
    expect(wholesaleEligible(cleared, 500)).toBe(false)
    expect(priceForQuantity({ ...wholesaleOnly, offerPrice: '' }, 3)).toMatchObject({
      unit: 22,
      basis: 'retail',
    })
  })

  it('يسمّي أساس السعر بالعربية', () => {
    expect(BASIS_LABELS).toMatchObject({
      retail: 'قطاعي',
      wholesale: 'جملة',
      offer: 'عرض',
      unset: 'بلا سعر',
    })
  })

  it('الصنف بلا سعر يخرج بلا سعر — لا صفر ولا مختلق', () => {
    expect(priceForQuantity(unpriced, 1)).toMatchObject({ unit: null, basis: 'unset', compareAt: null, savings: 0 })
    expect(hasKnownPrice(unpriced)).toBe(false)
    expect(hasKnownPrice(retailOnly)).toBe(true)
    expect(hasKnownPrice({ id: 'P-empty', retailPrice: '', wholesalePrice: null })).toBe(false)
    // جملة محفوظة بلا قطاعي: الأساس يمسى جملة عند بلوغ الحد فقط، وبلا سعر تحته
    const wholesaleOnlyNoRetail = { wholesalePrice: 18, wholesaleMinQuantity: 24 }
    expect(priceForQuantity(wholesaleOnlyNoRetail, 1).unit).toBeNull()
    expect(priceForQuantity(wholesaleOnlyNoRetail, 24).unit).toBe(18)
  })
})

describe('clampQuantity', () => {
  it('يرفض غير الرقمي والصفر والسالب ويحترم حد المخزون', () => {
    expect(clampQuantity('abc', wholesaleOnly)).toBe(1)
    expect(clampQuantity(0, wholesaleOnly)).toBe(1)
    expect(clampQuantity(-5, wholesaleOnly)).toBe(1)
    expect(clampQuantity(3.7, wholesaleOnly)).toBe(3)
    expect(clampQuantity(99999, wholesaleOnly)).toBe(320)
    // مخزون غير محدَّد = بلا سقف، مش سقف وهمي واحد
    expect(clampQuantity(7, null)).toBe(7)
    expect(clampQuantity(60, unpriced)).toBe(60)
  })
})

describe('buildCartLines + summarizeLines', () => {
  const catalog = {
    [retailOnly.id]: retailOnly,
    [wholesaleOnly.id]: wholesaleOnly,
    [withOffer.id]: withOffer,
    [unpriced.id]: unpriced,
  }
  const getProduct = (id) => catalog[id] ?? null

  it('يسقط سطرًا بلا سعر بدل أن يجمّعه على صفر', () => {
    const lines = buildCartLines(
      [{ productId: 'P-unpriced', quantity: 2 }, { productId: 'P-retail', quantity: 1 }],
      getProduct
    )
    expect(lines).toHaveLength(1)
    expect(lines[0].product.id).toBe('P-retail')
    expect(summarizeLines(lines).total).toBe(10)
  })

  it('يتجاهل الأصناف غير الموجودة ويحسب السطر بسعر أساسه', () => {
    const lines = buildCartLines(
      [{ productId: 'P-wholesale', quantity: 24 }, { productId: 'P-ghost', quantity: 3 }],
      getProduct
    )
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ quantity: 24, unitPrice: 18, basis: 'wholesale', lineTotal: 432, maxQuantity: 320 })
    expect(lines[0].missingForWholesale).toBe(0)
  })

  it('يجمع الإجماليات ويعدّ أصناف الجملة والوفّر', () => {
    const lines = buildCartLines(
      [
        { productId: 'P-wholesale', quantity: 24 },
        { productId: 'P-offer', quantity: 2 },
      ],
      getProduct
    )
    expect(summarizeLines(lines)).toEqual({
      lineCount: 2,
      units: 26,
      total: 432 + 70,
      savings: 96 + 10,
      wholesaleLines: 1,
    })
  })

  it('ملخص السلة الفارغة أصفار', () => {
    expect(summarizeLines([])).toEqual({ lineCount: 0, units: 0, total: 0, savings: 0, wholesaleLines: 0 })
  })
})

describe('orderTotals', () => {
  it('يحسب من سعر لحظة الطلب لا من السعر الحالي للمنتج', () => {
    const order = {
      items: [
        { productId: 'P-wholesale', quantity: 10, unitPrice: 18, basis: 'wholesale' },
        { productId: 'P-retail', quantity: 2, unitPrice: 9.5, basis: 'retail' },
      ],
    }
    expect(orderTotals(order)).toEqual({ units: 12, total: 199 })
    expect(orderTotals(null)).toEqual({ units: 0, total: 0 })
  })
})

describe('availabilityOf', () => {
  it('يميز غير المتوفر والمخزون المنخفض والمتوفر', () => {
    expect(availabilityOf({ stock: 0 }).key).toBe('out')
    expect(availabilityOf({ stock: 60 })).toMatchObject({ key: 'low', stock: 60 })
    expect(availabilityOf({ stock: 320 }).key).toBe('in')
    expect(availabilityOf(undefined).key).toBe('unknown')
  })

  it('المخزون الذي لم يُسجَّل بعد حالة صريحة لا «غير متوفر»', () => {
    expect(availabilityOf({})).toMatchObject({ key: 'unknown', stock: null })
    expect(availabilityOf(unpriced).label).toBe('المخزون غير محدَّد')
  })
})

describe('innerCount', () => {
  it('يحوّل عدد الوحدات إلى عدد القطع داخل العبوات', () => {
    expect(innerCount(packed, 5)).toBe(100)
    expect(innerCount(packed, 1)).toBe(20)
  })

  it('يعيد null للصنف بلاعبوة محددة', () => {
    expect(innerCount(wholesaleOnly, 5)).toBeNull()
    expect(innerCount(packed, 0)).toBe(0)
    expect(innerCount(undefined, 4)).toBeNull()
  })
})

describe('quantityOptions', () => {
  it('يرتّب الكميات الجاهزة: عبوة ثم حد الجملة ثم ضعفه', () => {
    expect(quantityOptions(packed, 320)).toEqual([
      { quantity: 1, kind: 'single' },
      { quantity: 24, kind: 'wholesale' },
      { quantity: 48, kind: 'wholesale-double' },
    ])
  })

  it('يحذف ما يتجاوز المخزون ويتجاهل الصفر والمكرر', () => {
    expect(quantityOptions(packed, 30)).toEqual([
      { quantity: 1, kind: 'single' },
      { quantity: 24, kind: 'wholesale' },
    ])
    expect(quantityOptions(retailOnly, 5)).toEqual([{ quantity: 1, kind: 'single' }])
    // مخزون صفر = لا كميات جاهزة إطلاقًا، ما ينفعش نعرض عبوة واحدة وهي فارغة
    expect(quantityOptions(wholesaleOnly, 0)).toEqual([])
    // مخزون غير محدَّد (null) = بلا سقف، عشان التاجر يحدد الكمية بنفسه
    expect(quantityOptions(packed, null)).toEqual([
      { quantity: 1, kind: 'single' },
      { quantity: 24, kind: 'wholesale' },
      { quantity: 48, kind: 'wholesale-double' },
    ])
    // حد جملة = ١: الكمية ١ تظهر مرة واحدة باسمها الأول، وضعف الحد يكمّل القائمة
    expect(quantityOptions({ ...packed, wholesaleMinQuantity: 1 }, 10)).toEqual([
      { quantity: 1, kind: 'single' },
      { quantity: 2, kind: 'wholesale-double' },
    ])
  })
})
