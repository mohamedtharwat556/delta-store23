const roundMoney = (value) => Math.round(value * 100) / 100

// الخانة الفارغة في اللوحة تُخزَّن null لا غائبة، وNumber(null) = صفر: بلا حراسة دي تتحول عرضًا وهميًا بـ 0 ج.م
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function wholesaleEligible(product, quantity) {
  const wholesalePrice = toNumber(product?.wholesalePrice)
  const minQuantity = toNumber(product?.wholesaleMinQuantity)
  if (wholesalePrice === null || minQuantity === null) return false
  return quantity >= minQuantity
}

export function unitsToWholesale(product, quantity) {
  const minQuantity = toNumber(product?.wholesaleMinQuantity)
  if (minQuantity === null) return null
  return Math.max(0, minQuantity - quantity)
}

// الوحدة الواحدة تحمل packSize من الوحدة الصغيرة: ٥ علب @ ٢٠ عود = ١٠٠ عود
export function innerCount(product, quantity) {
  const pack = toNumber(product?.packSize)
  const count = toNumber(quantity)
  if (!pack || pack < 1 || count === null) return null
  return pack * count
}

// كميات جاهزة للتاجر: عبوة، ثم حد الجملة ثم ضعفها — في حدود المخزون فقط (والمخزون المجهول بلا سقف)
export function quantityOptions(product, max) {
  const cap = toNumber(max)
  const min = Math.floor(toNumber(product?.wholesaleMinQuantity) ?? 0)
  const candidates = [
    { quantity: 1, kind: 'single' },
    { quantity: min, kind: 'wholesale' },
    { quantity: min * 2, kind: 'wholesale-double' },
  ]
  const seen = new Set()
  const options = []
  candidates.forEach((candidate) => {
    if (candidate.quantity < 1) return
    if (cap !== null && candidate.quantity > cap) return
    if (seen.has(candidate.quantity)) return
    seen.add(candidate.quantity)
    options.push(candidate)
  })
  return options
}

// الصنف الذي لم يُسعَّر بعد لا يُباع: لا صفر ولا سعر مخترع
export function hasKnownPrice(product) {
  return [product?.retailPrice, product?.offerPrice, product?.wholesalePrice].some(
    (value) => toNumber(value) !== null
  )
}

export function priceForQuantity(product, quantity) {
  const retail = toNumber(product?.retailPrice)
  const offer = toNumber(product?.offerPrice)
  const hasWholesale = wholesaleEligible(product, quantity)

  if (hasWholesale) {
    const unit = product.wholesalePrice
    return {
      unit,
      basis: 'wholesale',
      compareAt: retail,
      savings: retail === null ? 0 : roundMoney((retail - unit) * quantity),
    }
  }

  if (offer !== null && retail !== null && offer < retail) {
    return { unit: offer, basis: 'offer', compareAt: retail, savings: roundMoney((retail - offer) * quantity) }
  }

  if (retail === null) return { unit: null, basis: 'unset', compareAt: null, savings: 0 }

  return { unit: retail, basis: 'retail', compareAt: retail, savings: 0 }
}

export const BASIS_LABELS = {
  retail: 'قطاعي',
  wholesale: 'جملة',
  offer: 'عرض',
  unset: 'بلا سعر',
}

export function clampQuantity(quantity, product) {
  const parsed = Math.floor(Number(quantity))
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  const stock = toNumber(product?.stock)
  if (stock === null) return parsed
  return Math.min(parsed, Math.max(1, stock))
}

export function buildCartLines(items, getProduct) {
  return items.reduce((lines, item) => {
    const product = getProduct(item.productId)
    if (!product) return lines
    const quantity = clampQuantity(item.quantity, product)
    const price = priceForQuantity(product, quantity)
    // صنف بلا سعر ما ياخدش مكانه في السلة: صفر مختلق أخطر من سطر ناقص
    if (price.unit === null) return lines
    lines.push({
      product,
      quantity,
      unitPrice: price.unit,
      basis: price.basis,
      compareAt: price.compareAt,
      lineTotal: roundMoney(price.unit * quantity),
      missingForWholesale: unitsToWholesale(product, quantity),
      maxQuantity: product.stock,
      savings: price.savings,
    })
    return lines
  }, [])
}

export function summarizeLines(lines) {
  return lines.reduce(
    (summary, line) => ({
      lineCount: summary.lineCount + 1,
      units: summary.units + line.quantity,
      total: roundMoney(summary.total + line.lineTotal),
      savings: roundMoney(summary.savings + line.savings),
      wholesaleLines: summary.wholesaleLines + (line.basis === 'wholesale' ? 1 : 0),
    }),
    { lineCount: 0, units: 0, total: 0, savings: 0, wholesaleLines: 0 }
  )
}

export function availabilityOf(product) {
  const stock = toNumber(product?.stock)
  // العدد لسه ما اتسجلش من التاجر: حالة صريحة «غير محدَّد» بدل «غير متوفر الآن» الكاذبة
  if (stock === null) return { key: 'unknown', label: 'المخزون غير محدَّد', stock: null }
  if (stock <= 0) return { key: 'out', label: 'غير متوفر الآن', stock: 0 }
  if (stock <= 100) return { key: 'low', label: `متبقي ${stock} وحدة`, stock }
  return { key: 'in', label: 'متوفر', stock }
}

export function orderTotals(order) {
  return (order?.items ?? []).reduce(
    (totals, item) => {
      const quantity = Math.max(0, Math.floor(toNumber(item.quantity) ?? 0))
      const unitPrice = toNumber(item.unitPrice) ?? 0
      return {
        units: totals.units + quantity,
        total: roundMoney(totals.total + unitPrice * quantity),
      }
    },
    { units: 0, total: 0 }
  )
}
