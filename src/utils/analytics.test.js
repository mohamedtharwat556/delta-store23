import { describe, expect, it } from 'vitest'
import {
  catalogHealth,
  cheapestByCategory,
  customerGroups,
  ordersForCustomer,
  ordersSummary,
  priceRows,
  topSellers,
} from './analytics.js'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-10-20T12:00:00.000Z')

const iso = (daysAgo) => new Date(NOW - daysAgo * DAY_MS).toISOString()

const products = [
  {
    id: 'DL-1001',
    name: 'بخور',
    categoryId: 'incense',
    unit: 'علبة',
    retailPrice: 40,
    offerPrice: 35,
    wholesalePrice: 30,
    wholesaleMinQuantity: 24,
    stock: 400,
  },
  {
    id: 'DL-2001',
    name: 'ولاعة',
    categoryId: 'lighters',
    unit: 'قطعة',
    retailPrice: 12,
    stock: 80,
  },
  {
    id: 'DL-3001',
    name: 'كبريت',
    categoryId: 'matches',
    unit: 'علبة',
    retailPrice: 6,
    wholesalePrice: 5,
    stock: 0,
    isCustom: true,
  },
]

const orders = [
  {
    orderNumber: 'DL-2601',
    customerLabel: 'محل النور',
    area: 'دمياط',
    phone: '٠١٠٩٩٩٩٩٩٨٨',
    channel: 'wholesale',
    currentStatus: 'created',
    placedAt: iso(1),
    source: 'local',
    items: [
      { productId: 'DL-1001', quantity: 24, unitPrice: 30 },
      { productId: 'DL-2001', quantity: 10, unitPrice: 12 },
    ],
  },
  {
    orderNumber: 'DL-2602',
    customerLabel: 'محل النور',
    area: 'الزرقا',
    phone: '01099999988',
    channel: 'retail',
    currentStatus: 'delivered',
    placedAt: iso(30),
    items: [{ productId: 'DL-3001', quantity: 5, unitPrice: 6 }],
  },
  {
    orderNumber: 'DL-2603',
    customerLabel: 'عميل بلا رقم',
    area: 'دمياط',
    phone: '',
    channel: 'retail',
    currentStatus: 'created',
    placedAt: iso(3),
    items: [{ productId: 'DL-2001', quantity: 2, unitPrice: 12 }],
  },
]

describe('catalogHealth', () => {
  it('يفصل بين النافد والواطي والأصناف بلا جملة', () => {
    const health = catalogHealth(products)
    expect(health.total).toBe(3)
    expect(health.outOfStock.map((product) => product.id)).toEqual(['DL-3001'])
    expect(health.lowStock.map((product) => product.id)).toEqual(['DL-2001'])
    expect(health.noWholesale.map((product) => product.id)).toEqual(['DL-2001', 'DL-3001'])
    expect(health.custom.map((product) => product.id)).toEqual(['DL-3001'])
  })

  it('يعد الأصناف لكل قسم', () => {
    const counts = new Map(catalogHealth(products).byCategory.map((row) => [row.categoryId, row.count]))
    expect(counts.get('incense')).toBe(1)
    expect(counts.get('matches')).toBe(1)
  })

  it('يتحمل الكتالوج الفارغ', () => {
    expect(catalogHealth([])).toMatchObject({ total: 0, outOfStock: [], lowStock: [], custom: [] })
  })
})

describe('ordersSummary', () => {
  it('يجمع الإيراد والوحدات والمتوسط من عناصر الطلب', () => {
    const summary = ordersSummary(orders, { now: NOW })
    expect(summary.count).toBe(3)
    expect(summary.revenue).toBe(894)
    expect(summary.units).toBe(41)
    expect(summary.average).toBe(298)
  })

  it('يصنف الطلبات بالحالة والقناة', () => {
    const summary = ordersSummary(orders, { now: NOW })
    expect(summary.byStatus).toEqual({ created: 2, delivered: 1 })
    expect(summary).toMatchObject({ wholesaleCount: 1, retailCount: 2 })
  })

  it('يحسب آخر ٧ أيام ويستبعد الأقدم', () => {
    const summary = ordersSummary(orders, { now: NOW })
    expect(summary.last7Count).toBe(2)
    expect(summary.last7Revenue).toBe(864)
  })

  it('يرتب أكثر المحافظات طلبًا', () => {
    const summary = ordersSummary(orders, { now: NOW })
    expect(summary.topAreas[0]).toEqual({ area: 'دمياط', count: 2 })
  })

  it('يتحمل قائمة طلبات فارغة', () => {
    expect(ordersSummary([], { now: NOW })).toMatchObject({ count: 0, revenue: 0, average: 0 })
  })
})

describe('customerGroups', () => {
  it('يجمع نفس الرقم بصيغة عربية ولاتينية في عميل واحد', () => {
    const groups = customerGroups(orders)
    expect(groups).toHaveLength(2)
    const first = groups[0]
    expect(first.phone).toBe('01099999988')
    expect(first.orders).toBe(2)
    expect(first.revenue).toBe(870)
    expect(first.units).toBe(39)
    expect(first.local).toBe(true)
    expect(first.areas).toEqual(['دمياط', 'الزرقا'])
  })

  it('يجمع بلا رقم تحت اسم العميل', () => {
    const group = customerGroups(orders).find((item) => !item.phone)
    expect(group).toMatchObject({ label: 'عميل بلا رقم', orders: 1, local: false })
    expect(group.key).toBe('name:عميل بلا رقم')
  })

  it('يرتب الأعلى إنفاقًا أولًا', () => {
    expect(customerGroups(orders).map((group) => group.revenue)).toEqual([870, 24])
  })
})

describe('priceRows و cheapestByCategory', () => {
  it('يحسب فرق الجملة ويعتبر سعر العرض هو سعر البيع الفعلي', () => {
    const rows = new Map(priceRows(products).map((row) => [row.id, row]))
    expect(rows.get('DL-1001')).toMatchObject({
      effectiveUnit: 35,
      discountPct: 25,
      readyForWholesale: true,
    })
    expect(rows.get('DL-2001')).toMatchObject({ effectiveUnit: 12, wholesalePrice: null, discountPct: null })
    expect(rows.get('DL-3001')).toMatchObject({ readyForWholesale: false, discountPct: 16.7 })
  })

  it('يعطي أقل سعر لكل قسم', () => {
    const cheapest = cheapestByCategory(products)
    expect(cheapest.get('incense')).toBe(35)
    expect(cheapest.get('lighters')).toBe(12)
  })
})

describe('ordersForCustomer', () => {
  it('يطابق بالرقم المطبَّع وبالاسم عند غياب الرقم', () => {
    const groups = new Map(customerGroups(orders).map((group) => [group.key, group]))
    const phoneGroup = groups.get('01099999988')
    expect(ordersForCustomer(orders, phoneGroup).map((order) => order.orderNumber)).toEqual([
      'DL-2601',
      'DL-2602',
    ])
    const nameGroup = groups.get('name:عميل بلا رقم')
    expect(ordersForCustomer(orders, nameGroup).map((order) => order.orderNumber)).toEqual(['DL-2603'])
    expect(ordersForCustomer(undefined, phoneGroup)).toEqual([])
    expect(ordersForCustomer(orders, null)).toEqual([])
  })
})

describe('topSellers', () => {
  it('يرتّب على مجموع الكميات في كل الطلبات', () => {
    const ranked = topSellers(products, orders, { limit: 4 })
    expect(ranked.map((entry) => [entry.product.id, entry.units])).toEqual([
      ['DL-1001', 24],
      ['DL-2001', 12],
      ['DL-3001', 5],
    ])
  })

  it('يوقف القائمة عند الحد المطلوب', () => {
    expect(topSellers(products, orders, { limit: 1 }).map((entry) => entry.product.id)).toEqual(['DL-1001'])
  })

  it('يتجاهل الكميات غير الرقمية أو الصفرية والأصناف خارج الكتالوج', () => {
    const messy = [
      {
        orderNumber: 'DL-2699',
        items: [
          { productId: 'DL-1001', quantity: 'ثلاث' },
          { productId: 'DL-2001', quantity: 0 },
          { productId: 'DL-9999', quantity: 7 },
          { productId: 'DL-3001', quantity: 3 },
        ],
      },
    ]
    expect(topSellers(products, messy, { limit: 4 })).toEqual([{ product: products[2], units: 3 }])
  })

  it('يسقط على وسم الأكثر طلبًا لما ما تكون فيه مبيعات', () => {
    const tagged = products.map((product) => ({
      ...product,
      tags: product.id === 'DL-2001' ? ['best-seller'] : [],
    }))
    expect(topSellers(tagged, [], { limit: 2 })).toEqual([{ product: tagged[1], units: 0 }])
    expect(topSellers(tagged, undefined, { limit: 2 })).toEqual([{ product: tagged[1], units: 0 }])
  })
})
