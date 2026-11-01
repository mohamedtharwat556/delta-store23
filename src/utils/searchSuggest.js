import { categoryChainNames } from '../data/categories.js'
import { buildHaystack, matchesAllTokens, tokenizeQuery } from './arabic.js'

// اقتراحات الهيدر بتطابق نفس حقول صفحة المنتجات — وحدة البيع وعدد القطع كمان، وإلا «علبة» تجيب ٨ كروت
// في البحث الكامل وثلاثة بس في الاقتراح: مصدران لمنتج واحد بيجاوبوا مختلف قدام العميل
function haystackOf(product) {
  return buildHaystack([
    product.name,
    product.description,
    product.id,
    product.slug,
    product.unit,
    product.countUnit,
    ...categoryChainNames(product.categoryId),
  ])
}

// ترتيب على تطابق الأول بالحرف first (الولاعة قبل ملمع الأوعية عند كتابة «ولاع») ثم على طول الاسم
function rankByPrefix(products, token) {
  return [...products].sort((a, b) => {
    const aName = haystackOf(a)
    const bName = haystackOf(b)
    const aFirst = aName.startsWith(token) || aName.includes(` ${token}`) ? 0 : 1
    const bFirst = bName.startsWith(token) || bName.includes(` ${token}`) ? 0 : 1
    return aFirst - bFirst || a.name.length - b.name.length
  })
}

export function suggestProducts(catalog, query, { limit = 5 } = {}) {
  const tokens = tokenizeQuery(query)
  if (!tokens.length) return []
  const matched = catalog.filter((product) => matchesAllTokens(haystackOf(product), tokens))
  return rankByPrefix(matched, tokens[0]).slice(0, limit)
}
