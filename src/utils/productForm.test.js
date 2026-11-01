import { describe, expect, it } from 'vitest'
import {
  buildProductRecord,
  formFromProduct,
  parseAmount,
  parsePriceField,
  validatePriceDraft,
  validateProductForm,
  withOfferTag,
} from './productForm.js'

const base = {
  name: 'أعواد بخور',
  categoryId: 'incense',
  unit: 'علبة',
  description: 'علبة ٢٠ عود',
  image: '/images/bakhoor.svg',
  retailPrice: '40',
  offerPrice: '',
  wholesalePrice: '',
  wholesaleMinQuantity: '',
  stock: '120',
  packSize: '20',
  countUnit: 'عود',
  slug: 'bakhoor-sticks',
  tags: [],
}

const options = { categoryIds: ['incense', 'lighters'], imagePaths: ['/images/bakhoor.svg'] }

const check = (values) => validateProductForm(values, options)

describe('parseAmount', () => {
  it('يقرأ الأرقام العربية والإنجليزية والنقاط العشرية', () => {
    expect(parseAmount('٤٠')).toBe(40)
    expect(parseAmount(' 12.5 ')).toBe(12.5)
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('نص')).toBeNull()
  })

  it('يعامل الحقل الفارغ كغياب لا كصفر', () => {
    expect(parsePriceField('')).toBeNull()
    expect(parsePriceField('0')).toBe(0)
    expect(parsePriceField(null)).toBeNull()
  })
})

describe('validateProductForm', () => {
  it('يقبل صنفًا قطاعيًا مكتمل البيانات', () => {
    const { errors, cleaned } = check(base)
    expect(errors).toEqual({})
    expect(cleaned).toMatchObject({ name: 'أعواد بخور', retailPrice: 40, stock: 120, packSize: 20 })
  })

  it('يطالب بالحقول الأساسية عند الإضافة', () => {
    const { errors } = check({})
    expect(Object.keys(errors).sort()).toEqual(
      ['categoryId', 'image', 'name', 'retailPrice', 'stock', 'unit'].sort()
    )
  })

  it('يرفض سعر عرض أو جملة أكبر من القطاعي', () => {
    expect(check({ ...base, offerPrice: '45' }).errors.offerPrice).toBeTruthy()
    expect(check({ ...base, wholesalePrice: '40', wholesaleMinQuantity: '24' }).errors.wholesalePrice).toBeTruthy()
    expect(check({ ...base, wholesalePrice: '33', wholesaleMinQuantity: '24' }).errors).toEqual({})
  })

  it('يربط سعر الجملة بحد الجملة', () => {
    expect(check({ ...base, wholesalePrice: '33' }).errors.wholesaleMinQuantity).toBeTruthy()
    expect(check({ ...base, wholesalePrice: '33', wholesaleMinQuantity: '1' }).errors.wholesaleMinQuantity).toBeTruthy()
  })

  it('يرفض المخزون السالب أو غير الصحيح', () => {
    expect(check({ ...base, stock: '-5' }).errors.stock).toBeTruthy()
    expect(check({ ...base, stock: '12.5' }).errors.stock).toBeTruthy()
    expect(check({ ...base, stock: '0' }).errors.stock).toBeUndefined()
  })

  it('يتجاهل الوسوم غير المعروفة', () => {
    const { cleaned } = check({ ...base, tags: ['best-seller', 'سري'] })
    expect(cleaned.tags).toEqual(['best-seller'])
  })

  it('يحافظ على القيم النصية كما أدخلها التاجر بعد التنظيف', () => {
    const { cleaned } = check({ ...base, name: '  بخور  ', slug: '  Bakhoor  ' })
    expect(cleaned.name).toBe('بخور')
    expect(cleaned.slug).toBe('bakhoor')
  })

  it('يبني نموذجًا من صنف موجود', () => {
    const values = formFromProduct({
      name: 'ولاعة',
      categoryId: 'lighters',
      unit: 'قطعة',
      retailPrice: 12,
      stock: 300,
      tags: ['best-seller'],
    })
    expect(values).toMatchObject({ name: 'ولاعة', offerPrice: '', wholesalePrice: '', stock: '300' })
    expect(values.tags).toEqual(['best-seller'])
  })

  it('يقبل مكان رف مختصر ويرفض الطويل', () => {
    expect(check({ ...base, location: 'رف B3 — عنبر ١' }).errors.location).toBeUndefined()
    expect(check({ ...base, location: 'رف '.repeat(13) }).errors.location).toBeTruthy()
  })

  it('ينظف المكان ويخرج في النموذج والسجل', () => {
    expect(formFromProduct({ name: 'ولاعة', location: 'رف C2' }).location).toBe('رف C2')
    expect(formFromProduct(null).location).toBe('')
    const { cleaned } = check({ ...base, location: '  رف A1  ' })
    expect(cleaned.location).toBe('رف A1')
    const record = buildProductRecord(cleaned, { id: 'DL-7002', slug: 'bakhoor-bakhoor' })
    expect(record.location).toBe('رف A1')
    const bare = buildProductRecord(check(base).cleaned, { id: 'DL-7003', slug: 'bakhoor-plain' })
    expect(Object.hasOwn(bare, 'location')).toBe(false)
  })
})

describe('withOfferTag و buildProductRecord', () => {
  it('يضيف وسم العرض عند وجود سعر عرض ويحذفه عند زواله', () => {
    expect(withOfferTag({ offerPrice: 35, tags: ['best-seller'] }).tags).toEqual([
      'best-seller',
      'offer',
    ])
    expect(withOfferTag({ offerPrice: null, tags: ['offer', 'best-seller'] }).tags).toEqual([
      'best-seller',
    ])
  })

  it('يسجل الحقول الاختيارية فقط عندما تكون معبأة', () => {
    const { cleaned } = check(base)
    const record = buildProductRecord(cleaned, { id: 'DL-7001', slug: 'bakhoor-sticks' })
    expect(record).toMatchObject({
      id: 'DL-7001',
      slug: 'bakhoor-sticks',
      retailPrice: 40,
      packSize: 20,
      countUnit: 'عود',
    })
    expect(Object.hasOwn(record, 'offerPrice')).toBe(false)
    expect(Object.hasOwn(record, 'wholesalePrice')).toBe(false)
    expect(Object.hasOwn(record, 'wholesaleMinQuantity')).toBe(false)
  })
})

describe('validatePriceDraft', () => {
  it('يقبل رباعية أسعار متسقة', () => {
    const { errors, values } = validatePriceDraft({
      retailPrice: '٤٠',
      offerPrice: '٣٥',
      wholesalePrice: '٣٠',
      wholesaleMinQuantity: '٢٤',
    })
    expect(errors).toEqual({})
    expect(values).toEqual({ retail: 40, offer: 35, wholesale: 30, minimum: 24 })
  })

  it('يرفض غياب السعر القطاعي', () => {
    expect(validatePriceDraft({ retailPrice: '' }).errors.retailPrice).toBeTruthy()
  })

  it('يرفض الأسعار غير المنطقية', () => {
    const draft = { retailPrice: '10', offerPrice: '12', wholesalePrice: '9', wholesaleMinQuantity: '' }
    const { errors } = validatePriceDraft(draft)
    expect(errors.offerPrice).toBeTruthy()
    expect(errors.wholesaleMinQuantity).toBeTruthy()
  })

  it('يرفض حد جملة بلا سعر جملة', () => {
    const { errors } = validatePriceDraft({ retailPrice: '10', wholesaleMinQuantity: '24' })
    expect(errors.wholesalePrice).toBeTruthy()
  })

  it('يسمح بصنف قطاعي فقط بترك الجملة والعرض فارغين', () => {
    expect(validatePriceDraft({ retailPrice: '55' }).errors).toEqual({})
  })

  it('يرفض الأرقام السالبة بدل تحويلها لقيم موجبة', () => {
    const { errors, values } = validatePriceDraft({
      retailPrice: '-40',
      offerPrice: '-35',
      wholesalePrice: '-30',
      wholesaleMinQuantity: '-24',
    })
    expect(values).toEqual({ retail: null, offer: null, wholesale: null, minimum: null })
    expect(Object.keys(errors)).toEqual(['retailPrice', 'offerPrice', 'wholesalePrice', 'wholesaleMinQuantity'])
  })

  it('يرفض النص بدل الرقم في حقل السعر', () => {
    expect(validatePriceDraft({ retailPrice: 'عشرة' }).errors.retailPrice).toBeTruthy()
  })
})
