import { describe, expect, it } from 'vitest'
import { products } from '../data/products.js'
import { suggestProducts } from './searchSuggest.js'

describe('اقتراحات بحث الهيدر', () => {
  it('الفراغ والكلمة الفارغة مايرجّعوش اقتراحات', () => {
    expect(suggestProducts(products, '')).toEqual([])
    expect(suggestProducts(products, '   ')).toEqual([])
  })

  it('يجيب الأصناف اللي اسمها يبدأ بالكلمة', () => {
    const names = suggestProducts(products, 'ولاعة').map((product) => product.name)
    expect(names).toHaveLength(3)
    names.forEach((name) => expect(name.startsWith('ولاعة')).toBe(true))
  })

  it('يطبّع الهمزة والتاء المربوطة زي صفحة المنتجات بالظبط', () => {
    expect(suggestProducts(products, 'ولاعه').map((product) => product.id)).toEqual(
      suggestProducts(products, 'ولاعة').map((product) => product.id)
    )
    expect(suggestProducts(products, 'كبريت')).toHaveLength(3)
  })

  it('يوقف عند الحد ويعدّ أسماء الأقسام كمان', () => {
    expect(suggestProducts(products, 'بخور', { limit: 2 })).toHaveLength(2)
    // «فحم» اسم قسم وصنف معًا: المكعبات وكيس الشواء الاتنين داخل الاقتراحات
    expect(suggestProducts(products, 'فحم').map((product) => product.id).sort()).toEqual([
      'DL-4001',
      'DL-4002',
    ])
  })

  it('يقدم التطابق في أول الاسم على التطابق في النص، زي ترتيب المتاجر', () => {
    const first = suggestProducts(products, 'معطر')[0]
    expect(first.name.startsWith('معطر')).toBe(true)
  })

  it('يغطي وحدة البيع مثل صفحة المنتجات: «علبة» مش غير اسم صنف، هي وحدة بيعه كمان', () => {
    const suggested = suggestProducts(products, 'علبة').map((product) => product.id)
    // أربع علب في البذة: كبريت أمان ومطبخي وعازل للرطوبة + معطر الجو؛ الاسم فيه «علبة» تلاتة منهم
    expect(suggested).toContain('DL-6001')
    expect(suggested).toHaveLength(4)
  })
})
