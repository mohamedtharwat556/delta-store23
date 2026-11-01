import { useEffect } from 'react'
import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { demoOrders } from '../data/orders.js'
import { productById } from '../data/products.js'
import { useOrders } from '../hooks/useOrders.js'
import { CartProvider } from './CartContext.jsx'
import { OrderProvider } from './OrderContext.jsx'

const ORDERS_KEY = 'delta-store:orders'
const OVERRIDES_KEY = 'delta-store:order-status-overrides'

let store = null

function Probe() {
  const value = useOrders()
  // الالتقاط في أثر معلن حتى لا يتغيّر شيء أثناء العرض
  useEffect(() => {
    store = value
  })
  return <span>{value.orders.length}</span>
}

const mount = () =>
  render(
    <CartProvider>
      <OrderProvider>
        <Probe />
      </OrderProvider>
    </CartProvider>
  )

const lineOf = (productId, quantity) => {
  const product = productById(productId)
  const unitPrice = quantity >= (product.wholesaleMinQuantity ?? Infinity) ? product.wholesalePrice : product.retailPrice
  const basis = unitPrice === product.wholesalePrice ? 'wholesale' : 'retail'
  return { product, quantity, unitPrice, basis, lineTotal: unitPrice * quantity }
}

const sampleOrder = () => ({
  customer: 'محل تجريبي',
  phone: '01255554444',
  area: 'منطقة تجريبية',
  notes: 'اتصال قبل التوصيل',
  lines: [lineOf('DL-2001', 40)],
})

const stored = (key) => JSON.parse(localStorage.getItem(key) ?? 'null')

beforeEach(() => {
  store = null
  localStorage.clear()
})

describe('OrderContext — القراءة والتكوين', () => {
  it('يعرض الطلبات التجريبية مرتّبة من الأحدث', () => {
    mount()
    expect(store.orders).toHaveLength(demoOrders.length)
    expect(store.orders.every((order) => order.source === 'demo')).toBe(true)
    const dates = store.orders.map((order) => String(order.placedAt))
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('findOrder لا يعتمد على حالة الأحرف أو المسافات', () => {
    mount()
    expect(store.findOrder(' dl-2601 ')?.orderNumber).toBe('DL-2601')
    expect(store.findOrder('')).toBeNull()
    expect(store.findOrder('DL-9999')).toBeNull()
  })

  it('يتحمّل مخزنًا فيه بيانات تالفة', () => {
    localStorage.setItem(ORDERS_KEY, 'ليست JSON')
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify({ 'DL-2601': { currentStatus: 'unknown' } }))
    mount()
    expect(store.orders).toHaveLength(demoOrders.length)
    expect(store.findOrder('DL-2601').currentStatus).not.toBe('unknown')
  })
})

describe('OrderContext — تسجيل طلب من المتصفح', () => {
  it('يولّد رقمًا بعد آخر رقم، ويحفظ لقطة الأسعار لا المرجع الحي', () => {
    mount()
    let order
    act(() => {
      order = store.createOrder(sampleOrder())
    })

    expect(order.orderNumber).toBe('DL-2604')
    expect(order.items).toEqual([
      { productId: 'DL-2001', quantity: 40, unitPrice: 25, basis: 'wholesale' },
    ])
    expect(order).toMatchObject({
      channel: 'wholesale',
      customerLabel: 'محل تجريبي',
      currentStatus: 'created',
    })
    expect(order.updates).toHaveLength(1)
    expect(stored(ORDERS_KEY)).toHaveLength(1)
    expect(store.findOrder('DL-2604').source).toBe('local')
  })

  it('يخزّن بند التوصيل مع الطلب ويترك الطلبات بلا بند', () => {
    mount()
    const quote = { label: 'توصيل داخل دمياط والزرقا', amount: 15, waived: false }
    let order
    act(() => {
      order = store.createOrder({ ...sampleOrder(), delivery: quote })
    })
    expect(order.delivery).toEqual({ label: quote.label, amount: 15 })
    expect(stored(ORDERS_KEY)[0].delivery).toEqual({ label: quote.label, amount: 15 })

    let plain
    act(() => {
      plain = store.createOrder(sampleOrder())
    })
    expect(plain.delivery).toBeNull()
  })

  it('يسقط بند توصيل تالف عند قراءة المخزن', () => {
    const broken = { ...sampleOrder(), orderNumber: 'DL-2699', placedAt: null, currentStatus: 'created', items: [{ productId: 'DL-2001', quantity: 2, unitPrice: 30, basis: 'retail' }] }
    localStorage.setItem(ORDERS_KEY, JSON.stringify([{ ...broken, delivery: { label: '', amount: 'x' } }]))
    mount()
    expect(store.findOrder('DL-2699').delivery).toBeNull()
  })

  it('يرفض الطلب الذي لم يبق منه صنف صالح في الكتالوج', () => {
    mount()
    let order
    act(() => {
      order = store.createOrder({
        customer: 'زبون',
        lines: [{ product: { id: 'DL-9999' }, quantity: 1, unitPrice: 10, basis: 'retail' }],
      })
    })
    expect(order).toBeNull()
    expect(stored(ORDERS_KEY)).toEqual([])
  })

  it('الترقيم يتقدّم مع كل طلب جديد', () => {
    mount()
    const numbers = []
    for (let i = 0; i < 2; i += 1) {
      act(() => {
        numbers.push(store.createOrder(sampleOrder()).orderNumber)
      })
    }
    expect(numbers).toEqual(['DL-2604', 'DL-2605'])
  })
})

describe('OrderContext — تغيير الحالة والمسح المحلي', () => {
  it('يحدّث الطلب المحلي ويضيف تحديثًا في المسار', () => {
    mount()
    act(() => store.createOrder(sampleOrder()))
    act(() => store.setOrderStatus('DL-2604', 'packed', 'تم التجهيز'))

    const order = store.findOrder('DL-2604')
    expect(order.currentStatus).toBe('packed')
    expect(order.updates.map((update) => update.status)).toEqual(['created', 'packed'])
    expect(stored(ORDERS_KEY)[0].currentStatus).toBe('packed')
  })

  it('يحفظ حالة الطلب التجريبي كتغطية دون تعديل ملف البيانات', () => {
    mount()
    const before = demoOrders.find((order) => order.orderNumber === 'DL-2601').currentStatus

    act(() => store.setOrderStatus('DL-2601', 'delivered'))

    expect(store.findOrder('DL-2601').currentStatus).toBe('delivered')
    expect(stored(OVERRIDES_KEY)['DL-2601'].currentStatus).toBe('delivered')
    expect(demoOrders.find((order) => order.orderNumber === 'DL-2601').currentStatus).toBe(before)
  })

  it('مسح الطلبات المحلية يبقي التجريبية وتغطيات حالتها', () => {
    mount()
    act(() => store.createOrder(sampleOrder()))
    act(() => store.setOrderStatus('DL-2601', 'cancelled'))
    expect(store.orders).toHaveLength(demoOrders.length + 1)

    act(() => store.clearLocalOrders())

    expect(store.orders).toHaveLength(demoOrders.length)
    expect(store.findOrder('DL-2601').currentStatus).toBe('cancelled')
    expect(stored(ORDERS_KEY)).toEqual([])
    expect(stored(OVERRIDES_KEY)).not.toBeNull()
  })
})
