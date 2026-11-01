import { useEffect } from 'react'
import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCart } from '../hooks/useCart.js'
import { CartProvider } from './CartContext.jsx'

const CART_KEY = 'delta-store:cart'

let cart = null

function Probe() {
  const value = useCart()
  // الالتقاط في أثر جانبي معلن حتى لا يتغيّر شيء أثناء العرض
  useEffect(() => {
    cart = value
  })
  return <span data-testid='lines'>{value.summary.lineCount}</span>
}

const mount = () => render(<CartProvider><Probe /></CartProvider>)
const stored = () => JSON.parse(localStorage.getItem(CART_KEY) ?? '[]')

beforeEach(() => {
  cart = null
  localStorage.clear()
})

describe('CartContext — الإضافة والدمج', () => {
  it('يبدأ فارغًا بدون مخزن محفوظ', () => {
    mount()
    expect(cart.items).toEqual([])
    expect(cart.summary).toMatchObject({ lineCount: 0, units: 0, total: 0 })
  })

  it('يستعيد السلة المحفوظة في المتصفح عند التركيب', () => {
    localStorage.setItem(CART_KEY, JSON.stringify([{ productId: 'DL-2001', quantity: 3 }]))
    mount()
    expect(cart.items).toEqual([{ productId: 'DL-2001', quantity: 3 }])
    expect(cart.summary.units).toBe(3)
  })

  it('يتجاهل في الاستعادة ما لا يوجد أو نفد مخزونه', () => {
    localStorage.setItem(
      CART_KEY,
      JSON.stringify([
        { productId: 'DL-2001', quantity: 2 },
        { productId: 'DL-3003', quantity: 5 },
        { productId: 'DL-9999', quantity: 1 },
        { productId: 'DL-2002', quantity: 'سيئ' },
      ])
    )
    mount()
    expect(cart.items).toEqual([
      { productId: 'DL-2001', quantity: 2 },
      { productId: 'DL-2002', quantity: 1 },
    ])
  })

  it('يسقط في الاستعادة صنفًا فقد سعره بعد الحفظ (بلا سعر ≠ صفر)', () => {
    localStorage.setItem(CART_KEY, JSON.stringify([{ productId: 'DL-1101', quantity: 2 }]))
    mount()
    expect(cart.items).toEqual([])
    expect(cart.summary.total).toBe(0)
  })

  it('وحدة واحدة لكل صنف: الإضافة الثانية تزيد الكمية ولا تكرّر السطر', () => {
    mount()
    act(() => cart.addToCart('DL-2001', 2))
    act(() => cart.addToCart('DL-2001', 3))
    expect(cart.items).toEqual([{ productId: 'DL-2001', quantity: 5 }])
    expect(stored()).toEqual([{ productId: 'DL-2001', quantity: 5 }])
    expect(cart.notification?.message).toContain('تمت إضافة')
  })

  it('يقيّد الكمية بحد المخزون المتاح', () => {
    mount()
    act(() => cart.addToCart('DL-2002', 500))
    expect(cart.items[0].quantity).toBe(90)
  })

  it('يرفض غير المتوفر والمعروف، ويخبر المستخدم', () => {
    mount()
    let added
    act(() => {
      added = cart.addToCart('DL-3003', 1)
    })
    expect(added).toBe(false)
    expect(cart.items).toEqual([])
    expect(cart.notification).toMatchObject({ tone: 'danger' })

    act(() => {
      added = cart.addToCart('DL-9999', 1)
    })
    expect(added).toBe(false)
    expect(cart.notification?.message).toContain('غير متاح')
  })
})

describe('CartContext — التسعير داخل السلة', () => {
  it('ينقل السطر إلى سعر الجملة عند بلوغ الحد', () => {
    mount()
    act(() => cart.addToCart('DL-2001', 39))
    expect(cart.lines[0]).toMatchObject({ unitPrice: 30, basis: 'retail', lineTotal: 1170 })

    act(() => cart.addToCart('DL-2001', 1))
    expect(cart.lines[0]).toMatchObject({ unitPrice: 25, basis: 'wholesale', lineTotal: 1000, savings: 200 })
    expect(cart.summary).toMatchObject({ units: 40, total: 1000, wholesaleLines: 1 })
  })

  it('يرفض صنفًا لسه بلا سعر برسالة تشرح السبب', () => {
    mount()
    let added
    act(() => {
      added = cart.addToCart('DL-1101', 1)
    })
    expect(added).toBe(false)
    expect(cart.items).toEqual([])
    expect(cart.notification?.message).toContain('ما اتحدّدش سعر')
  })

  it('يستخدم سعر العرض قبل الجملة', () => {
    mount()
    act(() => cart.addToCart('DL-5002', 2))
    expect(cart.lines[0]).toMatchObject({ unitPrice: 28, basis: 'offer', lineTotal: 56 })
  })
})

describe('CartContext — التعديل والحذف والإفراغ وإعادة الطلب', () => {
  it('يعدّل الكمية ويحذف الصنف ويفرغ السلة مع تحديث المخزن', () => {
    localStorage.setItem(CART_KEY, JSON.stringify([
      { productId: 'DL-2001', quantity: 4 },
      { productId: 'DL-3001', quantity: 10 },
    ]))
    mount()

    act(() => cart.setQuantity('DL-2001', 9))
    expect(cart.items.find((item) => item.productId === 'DL-2001').quantity).toBe(9)

    act(() => cart.removeItem('DL-3001'))
    expect(cart.items.map((item) => item.productId)).toEqual(['DL-2001'])

    act(() => cart.clearCart())
    expect(cart.items).toEqual([])
    expect(stored()).toEqual([])
    expect(cart.notification?.message).toContain('تم إفراغ السلة')
  })

  it('إعادة الطلب تضيف المتوفر وتتجاهل ما نفد أو لم يعد موجودًا أو بلا سعر', () => {
    mount()
    let result
    act(() => {
      result = cart.addMany([
        { productId: 'DL-2001', quantity: 2 },
        { productId: 'DL-3003', quantity: 7 },
        { productId: 'DL-9999', quantity: 1 },
        { productId: 'DL-1101', quantity: 3 },
        { productId: 'DL-3001', quantity: 5 },
      ])
    })
    expect(result).toEqual({ added: 2, skipped: 3 })
    expect(cart.items).toEqual([
      { productId: 'DL-2001', quantity: 2 },
      { productId: 'DL-3001', quantity: 5 },
    ])
    expect(cart.notification?.message).toContain('2')

    act(() => cart.clearCart())
    let empty
    act(() => {
      empty = cart.addMany([{ productId: 'DL-3003', quantity: 1 }])
    })
    expect(empty).toEqual({ added: 0, skipped: 1 })
    expect(cart.notification?.message).toContain('لم يعد هناك أي صنف متاح')
  })

  it('إعادة الطلب فوق صنف موجود في السلة تجمعه في سطر واحد', () => {
    localStorage.setItem(CART_KEY, JSON.stringify([{ productId: 'DL-5002', quantity: 1 }]))
    mount()
    act(() => cart.addMany([{ productId: 'DL-5002', quantity: 1 }]))
    expect(cart.items).toEqual([{ productId: 'DL-5002', quantity: 2 }])
  })
})
