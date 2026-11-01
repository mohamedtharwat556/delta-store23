import { describe, expect, it } from 'vitest'
import { isCartBarVisible } from './cartBar.js'

describe('شريط السلة السفلي', () => {
  it('يظهر على صفحات المتجر العادية لما السلة فيها أصناف', () => {
    expect(isCartBarVisible('/', 2)).toBe(true)
    expect(isCartBarVisible('/products', 1)).toBe(true)
    expect(isCartBarVisible('/products/tijani-sticks-5-hours', 3)).toBe(true)
    expect(isCartBarVisible('/categories', 1)).toBe(true)
  })

  it('يختفي لما السلة فاضية', () => {
    expect(isCartBarVisible('/products', 0)).toBe(false)
  })

  it('يختفي في الصفحات اللي فيها السلة نفسها أو شاشات التاجر والورق', () => {
    for (const path of [
      '/cart',
      '/checkout',
      '/dashboard',
      '/order/DS-1001',
      '/invoice/DS-1001',
      '/pick/DS-1001',
    ]) {
      expect(isCartBarVisible(path, 4)).toBe(false)
    }
  })
})
