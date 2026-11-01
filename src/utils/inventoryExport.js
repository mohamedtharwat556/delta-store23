// جرد الأصناف للتصدير: يبني ترويسة عربية وصفوفًا قيمها أرقام عادية (بلا فواصل) لتقرأها Excel كأرقام.
import { categoryPathLabel } from '../data/categories.js'
import { company } from '../data/company.js'
import { describePack } from './format.js'
import { availabilityOf, innerCount } from './pricing.js'

const CURRENCY = `(${company.currencyLabel})`

export function inventoryHeaders() {
  return [
    'الرمز',
    'الصنف',
    'القسم',
    'مكان الصنف',
    'وحدة البيع',
    'محتوى الوحدة',
    `قطاعي ${CURRENCY}`,
    `عرض ${CURRENCY}`,
    `جملة ${CURRENCY}`,
    'حد الجملة',
    'الحد بالقطعة',
    'المخزون',
    'العدد الفعلي',
    'فارق الجرد',
    'حالة المخزون',
    'جاهز للجملة',
  ]
}

// counts = سجل العدّ المحلي: { [id]: { count } } — الصنف الذي لم يُبعد يبقى فارغًا ليُعدّ في الورقة
export function inventoryRows(products, counts = {}) {
  const recorded = counts && typeof counts === 'object' ? counts : {}
  return (products ?? []).map((product) => {
    const min = product.wholesaleMinQuantity ?? null
    const inner = min ? innerCount(product, min) : null
    const pack = describePack(product)
    // المخزون الذي لم يُسجَّل بعد يبقى خلية فارغة: صفر في ملف الجرد رقم مختلق
    const rawStock = Number(product.stock)
    const stock = Number.isFinite(rawStock) && product.stock !== null && product.stock !== undefined ? Math.floor(rawStock) : null
    const entry = recorded[product.id] ?? null
    const counted = entry ? Math.floor(Number(entry.count) || 0) : null
    return [
      product.id,
      product.name,
      categoryPathLabel(product.categoryId),
      product.location ?? '',
      product.unit,
      pack === product.unit ? '' : pack,
      product.retailPrice ?? '',
      product.offerPrice ?? '',
      product.wholesalePrice ?? '',
      min ?? '',
      inner ?? '',
      stock ?? '',
      counted ?? '',
      counted === null || stock === null ? '' : counted - stock,
      availabilityOf(product).label,
      min && product.wholesalePrice ? 'نعم' : 'لا',
    ]
  })
}

export function inventoryFilename(now = new Date()) {
  return `delta-inventory-${now.toISOString().slice(0, 10)}.csv`
}
