import { describe, expect, it } from 'vitest'
import { buildHaystack, matchesAllTokens, normalizeArabic, searchVariants, tokenizeQuery } from './arabic.js'

describe('normalizeArabic', () => {
  it('يوحّد صور الهمزة والألف والتاء المربوطة والياء المقصورة', () => {
    expect(normalizeArabic('ولاعة')).toBe('ولاعه')
    expect(normalizeArabic('أكياس')).toBe('اكياس')
    expect(normalizeArabic('إسفنج')).toBe('اسفنج')
    expect(normalizeArabic('كبريت في علبة عازلة للرطوبة')).toBe('كبريت في علبه عازله للرطوبه')
    expect(normalizeArabic('أقماع')).toBe('اقماع')
    expect(normalizeArabic('معطر جو')).toBe('معطر جو')
  })

  it('يحذف التشكيل والتطويل دون أن يمسّ الأحرف', () => {
    expect(normalizeArabic('ولّاعات')).toBe('ولاعات')
    expect(normalizeArabic('قِمع')).toBe('قمع')
    expect(normalizeArabic('بخور')).toBe('بخور')
    expect(normalizeArabic('ســـوبر')).toBe('سوبر')
  })

  it('يحوّل الأرقام العربية إلى لاتينية ويضبط المسافات', () => {
    expect(normalizeArabic('٢٠ عودًا')).toBe('20 عودا')
    expect(normalizeArabic('۱۲')).toBe('12')
    expect(normalizeArabic('  ولاعه   بخور  ')).toBe('ولاعه بخور')
    expect(normalizeArabic(null)).toBe('')
  })
})

describe('searchVariants + tokenizeQuery', () => {
  it('يضيف صيغة بدون أل التعريف ومفردًا تقريبيًا للجمع', () => {
    expect(searchVariants('الولّاعات')).toEqual(['الولاعات', 'ولاعات', 'ولاع'])
    expect(searchVariants('علب')).toContain('علب')
  })

  it('يقسّم البحث إلى كلمات ويطالب بمطابقة الكل', () => {
    expect(tokenizeQuery('  ولاعه   بخور ')).toEqual(['ولاعه', 'بخور'])
    expect(tokenizeQuery('')).toEqual([])
  })
})

describe('buildHaystack + matchesAllTokens', () => {
  const haystack = buildHaystack(['ولاعة معدنية بحجر', 'عبوة بلاستيك', 'DL-2002', 'علبة', null, '', 'الولّاعات'])

  it('يتجاهل القيم الفارغة ويطبّع النص', () => {
    expect(haystack).toBe('ولاعه معدنيه بحجر عبوه بلاستيك dl-2002 علبه الولاعات')
  })

  it('يطابق الكتابات المختلفة لنفس الكلمة', () => {
    for (const term of ['ولاعه', 'ولاعة', 'الولّاعات', 'ولاعات', 'معدنية', 'DL-2002', 'علبه']) {
      expect(matchesAllTokens(haystack, tokenizeQuery(term)), term).toBe(true)
    }
  })

  it('يطالب بمطابقة كل الكلمات (AND)', () => {
    expect(matchesAllTokens(haystack, tokenizeQuery('ولاعه بلاستيك'))).toBe(true)
    expect(matchesAllTokens(haystack, tokenizeQuery('ولاعه سكر'))).toBe(false)
  })

  it('يعتبر البحث الفارغ مطابقًا', () => {
    expect(matchesAllTokens(haystack, [])).toBe(true)
  })
})
