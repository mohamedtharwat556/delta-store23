export function formatPrice(value, currencyLabel = 'ج.م') {
  // الفراغ خانة فارغة لا صفر: الصنف الذي لم يُسعَّر بعد يظهر «—» مش «0 ج.م»
  if (value === null || value === undefined || value === '') return '—'
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return '—'
  const fractionDigits = Number.isInteger(parsed) ? 0 : 1
  return `${parsed.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} ${currencyLabel}`
}

export function formatNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed.toLocaleString('en-US') : '—'
}

export function formatDateTime(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function describePack(product) {
  if (!product) return ''
  if (product.packSize) {
    return `${product.unit} = ${product.packSize} ${product.countUnit ?? 'قطعة'}`
  }
  if (product.weightKg) return `${product.unit} = ${product.weightKg} كجم`
  if (product.volumeMl) {
    return product.volumeMl >= 1000
      ? `${product.unit} = ${product.volumeMl / 1000} لتر`
      : `${product.unit} = ${product.volumeMl} مل`
  }
  return product.unit ?? ''
}
