import { availabilityOf, orderTotals } from './pricing.js'
import { normalizePhone } from './checkout.js'

const DAY_MS = 24 * 60 * 60 * 1000

function timeOf(value) {
  const parsed = Date.parse(value ?? '')
  return Number.isFinite(parsed) ? parsed : null
}

export function catalogHealth(products) {
  const list = products ?? []
  const outOfStock = []
  const lowStock = []
  const noWholesale = []
  const byCategory = new Map()

  list.forEach((product) => {
    const availability = availabilityOf(product)
    if (availability.key === 'out') outOfStock.push(product)
    else if (availability.key === 'low') lowStock.push(product)
    if (!product.wholesalePrice || !product.wholesaleMinQuantity) noWholesale.push(product)
    byCategory.set(product.categoryId, (byCategory.get(product.categoryId) ?? 0) + 1)
  })

  return {
    total: list.length,
    outOfStock,
    lowStock: lowStock.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)),
    noWholesale,
    custom: list.filter((product) => product.isCustom),
    byCategory: [...byCategory.entries()].map(([categoryId, count]) => ({ categoryId, count })),
  }
}

export function ordersSummary(orders, { now = Date.now() } = {}) {
  let revenue = 0
  let units = 0
  let last7Revenue = 0
  let last7Count = 0
  const byStatus = {}
  const byArea = new Map()
  let wholesaleCount = 0

  ;(orders ?? []).forEach((order) => {
    const totals = orderTotals(order)
    revenue += totals.total
    units += totals.units
    byStatus[order.currentStatus ?? 'created'] = (byStatus[order.currentStatus ?? 'created'] ?? 0) + 1
    if (order.channel === 'wholesale') wholesaleCount += 1
    const area = String(order.area ?? '—').trim() || '—'
    byArea.set(area, (byArea.get(area) ?? 0) + 1)

    const placedAt = timeOf(order.placedAt)
    if (placedAt !== null && now - placedAt <= 7 * DAY_MS) {
      last7Revenue += totals.total
      last7Count += 1
    }
  })

  const count = (orders ?? []).length
  return {
    count,
    revenue: Math.round(revenue * 100) / 100,
    units,
    average: count ? Math.round((revenue / count) * 100) / 100 : 0,
    byStatus,
    wholesaleCount,
    retailCount: count - wholesaleCount,
    last7Revenue: Math.round(last7Revenue * 100) / 100,
    last7Count,
    topAreas: [...byArea.entries()]
      .map(([area, areaCount]) => ({ area, count: areaCount }))
      .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area, 'ar'))
      .slice(0, 6),
  }
}

// تجميع الطلبات حسب رقم التواصل؛ بلا رقم يُجمّع باسم العميل بدل الرقم
export function customerGroups(orders) {
  const groups = new Map()

  ;(orders ?? []).forEach((order) => {
    const phone = normalizePhone(order.phone)
    const label = String(order.customerLabel ?? '').trim() || 'عميل بلا اسم'
    const key = phone || `name:${label}`
    const totals = orderTotals(order)
    const current = groups.get(key) ?? {
      key,
      phone: phone || '',
      label,
      orders: 0,
      revenue: 0,
      units: 0,
      lastAt: null,
      areas: new Set(),
      sources: new Set(),
    }
    current.orders += 1
    current.revenue += totals.total
    current.units += totals.units
    current.areas.add(String(order.area ?? '—').trim() || '—')
    current.sources.add(order.source ?? 'demo')
    const placedAt = timeOf(order.placedAt)
    if (placedAt !== null && (current.lastAt === null || placedAt > current.lastAt)) {
      current.lastAt = placedAt
    }
    groups.set(key, current)
  })

  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      phone: group.phone,
      label: group.label,
      orders: group.orders,
      revenue: Math.round(group.revenue * 100) / 100,
      units: group.units,
      lastAt: group.lastAt,
      areas: [...group.areas],
      local: group.sources.has('local'),
    }))
    .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders || a.label.localeCompare(b.label, 'ar'))
}

export function priceRows(products) {
  return (products ?? []).map((product) => {
    const retail = product.offerPrice || product.retailPrice
    const wholesale = product.wholesalePrice ?? null
    const discountPct =
      wholesale && product.retailPrice
        ? Math.round(((product.retailPrice - wholesale) / product.retailPrice) * 1000) / 10
        : null
    return {
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      unit: product.unit,
      retailPrice: product.retailPrice,
      offerPrice: product.offerPrice ?? null,
      wholesalePrice: wholesale,
      wholesaleMinQuantity: product.wholesaleMinQuantity ?? null,
      stock: product.stock,
      effectiveUnit: retail,
      discountPct,
      readyForWholesale: Boolean(wholesale && product.wholesaleMinQuantity),
    }
  })
}

// أقل سعر بيع لكل قسم — يُستخدم في ملخص النظرة العامة
export function cheapestByCategory(products) {
  const cheapest = new Map()
  ;(products ?? []).forEach((product) => {
    const unit = product.offerPrice || product.retailPrice
    // صنف بلا سعر ما يمثّلش قسمه: «بلا» مش صفر يقفل أقل سعر حقيقي
    if (typeof unit !== 'number' || !Number.isFinite(unit)) return
    const current = cheapest.get(product.categoryId)
    if (current === undefined || unit < current) cheapest.set(product.categoryId, unit)
  })
  return cheapest
}

// طلبات عميل واحد: المطابقة بالرقم المطبَّع، أو بالاسم عندما لا يوجد رقم
export function ordersForCustomer(orders, group) {
  const source = orders ?? []
  if (!group) return []
  return source.filter((order) =>
    group.phone
      ? normalizePhone(order.phone) === group.phone
      : String(order.customerLabel ?? '').trim() === group.label
  )
}

// الأكثر طلبًا = مجموع الكميات في الطلبات (التجريبية + المسجَّلة محليًا).
// بلا مبيعات مسجَّلة تسقط القائمة على وسم best-seller حتى لا تظهر فارغة.
export function topSellers(products, orders, { limit = 4 } = {}) {
  const catalog = products ?? []
  const unitsById = new Map()
  ;(orders ?? []).forEach((order) => {
    ;(order.items ?? []).forEach((item) => {
      const quantity = Math.floor(Number(item.quantity))
      if (!Number.isFinite(quantity) || quantity < 1) return
      unitsById.set(item.productId, (unitsById.get(item.productId) ?? 0) + quantity)
    })
  })

  const ranked = catalog
    .map((product) => ({ product, units: unitsById.get(product.id) ?? 0 }))
    .filter((entry) => entry.units > 0)
    .sort(
      (a, b) =>
        b.units - a.units || a.product.name.localeCompare(b.product.name, 'ar')
    )
    .slice(0, limit)

  if (ranked.length) return ranked

  return catalog
    .filter((product) => (product.tags ?? []).includes('best-seller'))
    .slice(0, limit)
    .map((product) => ({ product, units: 0 }))
}
