import { describe, expect, it } from 'vitest'
import { categoryGroupIds, findCategory } from '../data/categories.js'
import { products } from '../data/products.js'
import { coverProductOf, orbSourceOf } from './sectionOrb.js'

const itemsOf = (id) => {
  const group = categoryGroupIds(id)
  return products.filter((product) => group.has(product.categoryId))
}

describe('الدائرة التي تمثل القسم', () => {
  it('الصنف الممثل لا يُختار إلا من الأوراق المصوّرة', () => {
    const cover = coverProductOf(itemsOf('incense'))
    expect(cover).not.toBeNull()
    expect(cover.image).toBeTruthy()
  })

  it('الأكثر طلبًا يتقدّم، ولو هو بلا صورة يتقدّم مصوّر بعده', () => {
    const items = [
      { id: 'A', image: 'a.jpg', tags: ['offer'] },
      { id: 'B', image: null, tags: ['best-seller'] },
      { id: 'C', image: 'c.jpg', tags: ['best-seller'] },
    ]
    expect(coverProductOf(items).id).toBe('C')
    expect(coverProductOf([items[0]]).id).toBe('A')
    expect(coverProductOf([])).toBeNull()
  })

  it('صورة القسم التي ملّها التاجر تسبق أي صنف', () => {
    const lighters = findCategory('lighters')
    const source = orbSourceOf(lighters, itemsOf('lighters'))
    expect(source.src).toBe(lighters.image)
    expect(source.alt).toContain('الولاعات')
  })

  it('صورتا الدعاية المحذوفتان ما ترجعاش: البخور يعرض صنفًا ممثلًا بلا alt مختلق', () => {
    for (const id of ['incense', 'flammables']) {
      const category = findCategory(id)
      expect(category.image).toBeNull()
      const source = orbSourceOf(category, itemsOf(id))
      expect(source.src).toBe(coverProductOf(itemsOf(id)).image)
      expect(source.alt).toBe('')
    }
  })

  it('القسم الذي لا صنف مصوّر فيه يطلب أيقونته، لا صورة فاضية', () => {
    // أصناف «بخور ناموس» الأربعة بلا صور كما ملّها التاجر، و«الغاز» بلا أصناف أصلًا
    expect(orbSourceOf(findCategory('incense-namos'), itemsOf('incense-namos'))).toEqual({
      src: null,
      alt: '',
    })
    expect(orbSourceOf(findCategory('gas'), [])).toEqual({ src: null, alt: '' })
  })
})
