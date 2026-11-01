import { describe, expect, it } from 'vitest'
import { sectionFilterIds } from './useCatalogQuery.js'

describe('فلتر القسم عند التاجر: اللي واقف عليه بس', () => {
  it('بلا قسم مختار = بلا فلتر (كل الكتالوج)', () => {
    expect(sectionFilterIds('')).toBeNull()
  })

  it('القسم الأب لا يجمع أصناف أبنائه', () => {
    const ids = sectionFilterIds('incense')
    expect([...ids]).toEqual(['incense'])
    expect(ids.has('incense-tijani')).toBe(false)
    expect(ids.has('incense-insam-sticks')).toBe(false)
  })

  it('الورقة تبقى على نفسها', () => {
    expect([...sectionFilterIds('incense-tijani-sticks')]).toEqual(['incense-tijani-sticks'])
  })
})
