import { describe, expect, it } from 'vitest'
import { RECENT_LIMIT, clearRecentViewed, readRecentViewed, recordRecentViewed } from './recentlyViewed.js'

describe('آخر ما شفت', () => {
  it('يبدأ فاضي ويتجاهل المخزن المكسور', () => {
    expect(readRecentViewed()).toEqual([])
    localStorage.setItem('delta-store:recently-viewed', '{"not":"an array"}')
    expect(readRecentViewed()).toEqual([])
    localStorage.setItem('delta-store:recently-viewed', '[1,"DL-1101",null]')
    expect(readRecentViewed()).toEqual(['DL-1101'])
  })

  it('يضع الأحدث في المقدمة ولا يكرر الصنف نفسه', () => {
    recordRecentViewed('DL-1101')
    recordRecentViewed('DL-1201')
    expect(readRecentViewed()).toEqual(['DL-1201', 'DL-1101'])

    recordRecentViewed('DL-1101')
    expect(readRecentViewed()).toEqual(['DL-1101', 'DL-1201'])
  })

  it('يتوقف عند الحد ويخرج الأقدم', () => {
    for (let index = 1; index <= RECENT_LIMIT + 4; index += 1) {
      recordRecentViewed(`DL-${index}`)
    }
    const recent = readRecentViewed()
    expect(recent).toHaveLength(RECENT_LIMIT)
    expect(recent[0]).toBe(`DL-${RECENT_LIMIT + 4}`)
    expect(recent).not.toContain('DL-1')
  })

  it('ما يسجلش فراغًا ولا رقمًا، والتفريغ يرجّع القائمة قبل ما يفضيها', () => {
    recordRecentViewed('DL-1101')
    recordRecentViewed('')
    recordRecentViewed(null)
    recordRecentViewed(1234)
    expect(readRecentViewed()).toEqual(['DL-1101'])
    expect(clearRecentViewed()).toEqual(['DL-1101'])
    expect(readRecentViewed()).toEqual([])
  })
})
