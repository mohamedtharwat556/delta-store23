import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categoryChainNames, categories } from '../data/categories.js'
import { useCatalog } from './useCatalog.js'
import { buildHaystack, matchesAllTokens, tokenizeQuery } from '../utils/arabic.js'
import { priceForQuantity } from '../utils/pricing.js'

export const SORT_OPTIONS = [
  { id: 'featured', label: 'الأكثر رواجًا' },
  { id: 'price-asc', label: 'السعر: من الأقل' },
  { id: 'price-desc', label: 'السعر: من الأعلى' },
  { id: 'name-asc', label: 'الاسم: أ - ي' },
  { id: 'name-desc', label: 'الاسم: ي - أ' },
]

const VALID_CATEGORY_IDS = new Set(categories.map((category) => category.id))
const VALID_SORTS = new Set(SORT_OPTIONS.map((option) => option.id))

// نص البحث يتغيّر لو عدّل التاجر الصنف، لذا تُخزَّن بصمة الحقول مع النص المطبَّع
const haystackCache = new Map()

function signatureOf(product) {
  return [product.name, product.description, product.id, product.slug, product.unit, product.countUnit, product.categoryId].join('|')
}

function haystackOf(product) {
  const signature = signatureOf(product)
  const cached = haystackCache.get(product.id)
  if (cached && cached.signature === signature) return cached.text
  const text = buildHaystack([
    product.name,
    product.description,
    product.id,
    product.slug,
    product.unit,
    product.countUnit,
    ...categoryChainNames(product.categoryId),
  ])
  haystackCache.set(product.id, { signature, text })
  return text
}

// الفراغ في الرابط يعني «بلا حد»؛ صفر حرفي ('0') يبقى حدًا صالحًا
function parseBound(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

// قاعدة الفلتر عند التاجر (2026-10-31): الدائرة تفلتر على القسم اللي هي واقفة عليه وحده —
// أصناف الأقسام الفرعية ما تدخلش، فالعميل ينزل للقسم نفسه بالدائرة أو بالممرّ.
export function sectionFilterIds(categoryId) {
  return categoryId ? new Set([categoryId]) : null
}

function matches(product, { tokens, sectionIds, tag, min, max, inStock }) {
  if (sectionIds && !sectionIds.has(product.categoryId)) return false
  if (tag && !product.tags.includes(tag)) return false
  if (inStock && (product.stock ?? 0) <= 0) return false
  // السعر المُصفّى هو نفس سعر وحدة العرض الذي يُقارن في الترتيب، لا السعر الخام
  const price = priceForQuantity(product, 1).unit
  // الصنف بلا سعر بعد ما ينفعش يجاوب فلتر سعر — «بلا» مش «أقل من»
  if (price === null && (min !== null || max !== null)) return false
  if (min !== null && price < min) return false
  if (max !== null && price > max) return false
  if (!tokens.length) return true
  return matchesAllTokens(haystackOf(product), tokens)
}

function sortProducts(list, sort) {
  const copy = [...list]
  if (sort === 'price-asc' || sort === 'price-desc') {
    const direction = sort === 'price-asc' ? 1 : -1
    const priceOf = (product) => priceForQuantity(product, 1).unit
    return copy.sort((a, b) => {
      const priceA = priceOf(a)
      const priceB = priceOf(b)
      // بلا سعر يفضل في آخر القائمة في الاتجاهين، مش في أولها
      if (priceA === null || priceB === null) return (priceA === null ? 1 : 0) - (priceB === null ? 1 : 0)
      return (priceA - priceB) * direction
    })
  }
  if (sort === 'name-asc' || sort === 'name-desc') {
    const direction = sort === 'name-asc' ? 1 : -1
    return copy.sort((a, b) => a.name.localeCompare(b.name, 'ar') * direction)
  }
  return copy.sort((a, b) => {
    const aPromoted = a.tags.length ? 1 : 0
    const bPromoted = b.tags.length ? 1 : 0
    return bPromoted - aPromoted || a.name.localeCompare(b.name, 'ar')
  })
}

export function useCatalogQuery() {
  const [searchParams, setSearchParams] = useSearchParams()
  const products = useCatalog()

  const raw = {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    tag: searchParams.get('tag') ?? '',
    sort: searchParams.get('sort') ?? 'featured',
    min: searchParams.get('min') ?? '',
    max: searchParams.get('max') ?? '',
    avail: searchParams.get('avail') ?? '',
  }

  const state = {
    query: raw.q,
    categoryId: VALID_CATEGORY_IDS.has(raw.category) ? raw.category : '',
    tag: ['best-seller', 'offer'].includes(raw.tag) ? raw.tag : '',
    sort: VALID_SORTS.has(raw.sort) ? raw.sort : 'featured',
    min: raw.min,
    max: raw.max,
    inStock: raw.avail === '1',
  }

  const minBound = parseBound(state.min)
  const maxBound = parseBound(state.max)

  const results = useMemo(
    () => sortProducts(products.filter((product) => matches(product, {
      tokens: tokenizeQuery(state.query),
      sectionIds: sectionFilterIds(state.categoryId),
      tag: state.tag,
      min: minBound,
      max: maxBound,
      inStock: state.inStock,
    })), state.sort),
    [products, state.query, state.categoryId, state.tag, state.sort, minBound, maxBound, state.inStock]
  )

  const updateParam = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    // الكتابة في البحث أو حقول السعر تستبدل الرابط بدل إضافة سجل لكل حرف
    const typed = ['q', 'min', 'max'].some((key) => Object.hasOwn(changes, key))
    setSearchParams(next, { replace: typed })
  }

  const hasFilters = Boolean(state.query || state.categoryId || state.tag || state.min || state.max || state.inStock)

  // رابط الصفحة الحالية بعد تغيير مفتاح واحد: شريط الأقسام يبقى عليه البحث وحدّ السعر،
  // فاختيار قسم ما يسقطش الفلاتر اللي العميل اختارها قبله
  const hrefFor = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    const query = next.toString()
    return query ? `/products?${query}` : '/products'
  }

  return {
    ...state,
    results,
    total: products.length,
    hasFilters,
    hrefFor,
    setQuery: (value) => updateParam({ q: value }),
    setCategory: (value) => updateParam({ category: value }),
    setTag: (value) => updateParam({ tag: value }),
    setSort: (value) => updateParam({ sort: value }),
    setMin: (value) => updateParam({ min: value }),
    setMax: (value) => updateParam({ max: value }),
    setInStock: (value) => updateParam({ avail: value ? '1' : '' }),
    reset: () => updateParam({ q: '', category: '', tag: '', sort: '', min: '', max: '', avail: '' }),
  }
}
