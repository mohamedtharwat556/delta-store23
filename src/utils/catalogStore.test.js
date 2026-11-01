import { beforeEach, describe, expect, it, vi } from 'vitest'
import { products as seedProducts } from '../data/products.js'
import {
  addProduct,
  deleteProduct,
  getCatalogRevision,
  getCatalogSnapshot,
  getOverridesSummary,
  getProductById,
  nextProductId,
  patchProduct,
  reloadOverrides,
  restoreSeed,
  subscribeCatalog,
  uniqueSlug,
} from './catalogStore.js'

const STORAGE_KEY = 'delta-store:catalog-overrides'

beforeEach(() => {
  localStorage.clear()
  restoreSeed()
  localStorage.clear()
})

describe('قراءة الكتالوج', () => {
  it('يبدأ بالبيانات الأصلية دون أي طبقة تعديل', () => {
    expect(getCatalogSnapshot()).toHaveLength(seedProducts.length)
    expect(getCatalogSnapshot().every((product) => !product.isCustom)).toBe(true)
    expect(getOverridesSummary().changed).toBe(false)
  })

  it('يقرأ من نفس الملف بعد الاسترجاع', () => {
    patchProduct('DL-2001', { retailPrice: 999 })
    restoreSeed()
    expect(getProductById('DL-2001').retailPrice).toBe(
      seedProducts.find((product) => product.id === 'DL-2001').retailPrice
    )
  })
})

describe('patchProduct', () => {
  it('يدمج الحقول القابلة للتعديل فقط', () => {
    const updated = patchProduct('DL-2001', { name: 'ولاعة معدلة', price: 1, _internal: 'x' })
    expect(updated.name).toBe('ولاعة معدلة')
    expect(updated.price).toBeUndefined()
    expect(updated._internal).toBeUndefined()
  })

  it('يقبل null لحذف سعر اختياري', () => {
    const withOffer = seedProducts.find((product) => product.offerPrice)
    const updated = patchProduct(withOffer.id, { offerPrice: null })
    expect(updated.offerPrice).toBeNull()
    expect(updated.retailPrice).toBe(withOffer.retailPrice)
  })

  it('يجمع التعديلات المتتالية على نفس الصنف', () => {
    patchProduct('DL-3001', { stock: 50 })
    const updated = patchProduct('DL-3001', { wholesalePrice: 12 })
    expect(updated).toMatchObject({ stock: 50, wholesalePrice: 12 })
  })

  it('يحفظ الطبقة في التخزين ويسترجعها بعد إعادة التحميل', () => {
    patchProduct('DL-4001', { retailPrice: 77.5 })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).patches['DL-4001']).toMatchObject({
      retailPrice: 77.5,
    })
    reloadOverrides()
    expect(getProductById('DL-4001').retailPrice).toBe(77.5)
  })

  it('يعدل الأصناف المضافة في نفس الطبقة', () => {
    const created = addProduct({ name: 'صنف تجريبي', slug: 'test-item', retailPrice: 5, stock: 10 })
    const updated = patchProduct(created.id, { stock: 3 })
    expect(updated.stock).toBe(3)
    expect(getOverridesSummary().edited).toBe(0)
    expect(getOverridesSummary().added).toBe(1)
  })
})

describe('addProduct و deleteProduct', () => {
  it('يضيف صنفًا جديدًا مع علامة المُضاف', () => {
    const before = getCatalogSnapshot().length
    const created = addProduct({ name: 'صنف جديد', slug: 'new-item', retailPrice: 20, stock: 40 })
    expect(getCatalogSnapshot()).toHaveLength(before + 1)
    expect(getProductById(created.id).isCustom).toBe(true)
  })

  it('يخفي أصناف البيانات الأصلية دون مسحها من الملف', () => {
    const seedId = seedProducts[0].id
    deleteProduct(seedId)
    expect(getProductById(seedId)).toBeNull()
    expect(seedProducts.some((product) => product.id === seedId)).toBe(true)
    expect(getOverridesSummary().removed).toBe(1)
  })

  it('يحذف الصنف المُضاف نهائيًا من الطبقة', () => {
    const created = addProduct({ name: 'مؤقت', slug: 'temp-item', retailPrice: 9, stock: 5 })
    deleteProduct(created.id)
    expect(getProductById(created.id)).toBeNull()
    expect(getOverridesSummary()).toMatchObject({ added: 0, removed: 0 })
  })

  it('لا يُنشئ معرفًا مكررًا عند الإضافة المتتالية', () => {
    const first = addProduct({ name: 'أول', slug: 'first-item', retailPrice: 1, stock: 1 })
    const second = addProduct({ name: 'ثانٍ', slug: 'second-item', retailPrice: 2, stock: 1 })
    expect(second.id).not.toBe(first.id)
  })
})

describe('المعرفات والروابط المختصرة', () => {
  it('يزيد معرف الصنف الجديد أعلى من أعلى معرف موجود', () => {
    expect(nextProductId()).toBe('DL-6003')
    addProduct({ id: 'DL-9999', name: 'استثنائي', slug: 'exceptional', retailPrice: 1, stock: 1 })
    expect(nextProductId()).toBe('DL-10000')
  })

  it('يفرّد الروابط المختصرة وينظفها', () => {
    const taken = seedProducts[0].slug
    expect(uniqueSlug(`  ${taken.toUpperCase()}  `)).toBe(`${taken}-2`)
    expect(uniqueSlug('بخور  أعواد', null)).toBe('product')
    expect(uniqueSlug('bakhoor box 20', null)).toBe('bakhoor-box-20')
    expect(uniqueSlug(taken, seedProducts[0].id)).toBe(taken)
  })
})

describe('الاشتراك في التغييرات', () => {
  it('يزيد رقم المراجعة ويبلغ المستمعين', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCatalog(listener)
    const revision = getCatalogRevision()
    patchProduct('DL-5001', { stock: 12 })
    expect(getCatalogRevision()).toBe(revision + 1)
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    patchProduct('DL-5002', { stock: 12 })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
