import { categoryGroupIds, categoryNeighborhoodIds } from '../data/categories.js'
import { products as seedProducts } from '../data/products.js'
import { readJson, removeKey, writeJson } from './storage.js'

const STORAGE_KEY = 'catalog-overrides'

// الحقول التي تسمح اللوحة بتعديلها فقط — ما عداها يبقى من ملف البيانات.
export const EDITABLE_FIELDS = [
  'name',
  'slug',
  'description',
  'categoryId',
  'image',
  'unit',
  'packSize',
  'countUnit',
  'weightKg',
  'volumeMl',
  'retailPrice',
  'offerPrice',
  'wholesalePrice',
  'wholesaleMinQuantity',
  'stock',
  'location',
  'tags',
]

const emptyOverrides = () => ({ patches: {}, created: [], removed: [] })

function readOverrides() {
  const raw = readJson(STORAGE_KEY, null)
  if (!raw || typeof raw !== 'object') return emptyOverrides()
  return {
    patches: raw.patches && typeof raw.patches === 'object' ? raw.patches : {},
    created: Array.isArray(raw.created) ? raw.created : [],
    removed: Array.isArray(raw.removed) ? raw.removed.filter((id) => typeof id === 'string') : [],
  }
}

let overrides = readOverrides()
let live = null
let revision = 0
const listeners = new Set()

function editablePatch(source) {
  const patch = {}
  EDITABLE_FIELDS.forEach((field) => {
    if (Object.hasOwn(source, field)) patch[field] = source[field]
  })
  return patch
}

function buildLive() {
  const removed = new Set(overrides.removed)
  const patched = seedProducts
    .filter((product) => !removed.has(product.id))
    .map((product) => {
      const patch = overrides.patches[product.id]
      return patch ? { ...product, ...editablePatch(patch) } : product
    })
  const added = overrides.created
    .filter((product) => product && !removed.has(product.id))
    .map((product) => ({ ...product, ...editablePatch(product), isCustom: true }))
  return [...patched, ...added]
}

function invalidate() {
  live = null
  revision += 1
}

function persistAndNotify() {
  invalidate()
  writeJson(STORAGE_KEY, overrides)
  listeners.forEach((listener) => listener())
}

export function subscribeCatalog(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getCatalogSnapshot() {
  if (!live) live = buildLive()
  return live
}

export function getCatalogRevision() {
  return revision
}

export function getProductById(id) {
  return getCatalogSnapshot().find((product) => product.id === id) ?? null
}

export function getProductBySlug(slug) {
  return getCatalogSnapshot().find((product) => product.slug === slug) ?? null
}

export function listByCategory(categoryId) {
  const group = categoryGroupIds(categoryId)
  return getCatalogSnapshot().filter((product) => group.has(product.categoryId))
}

export function listSimilar(product, limit = 4) {
  const group = categoryNeighborhoodIds(product.categoryId)
  const snapshot = getCatalogSnapshot()
  const sameSection = []
  const sameParentSection = []
  snapshot.forEach((item) => {
    if (item.id === product.id) return
    if (item.categoryId === product.categoryId) sameSection.push(item)
    else if (group.has(item.categoryId)) sameParentSection.push(item)
  })
  return [...sameSection, ...sameParentSection].slice(0, limit)
}

export function getOverridesSummary() {
  return {
    edited: Object.keys(overrides.patches).length,
    added: overrides.created.length,
    removed: overrides.removed.length,
    changed: Boolean(
      Object.keys(overrides.patches).length || overrides.created.length || overrides.removed.length
    ),
  }
}

export function nextProductId() {
  const highest = getCatalogSnapshot().reduce((max, product) => {
    const parsed = Number(String(product.id ?? '').split('-')[1])
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, 5000)
  return `DL-${highest + 1}`
}

export function uniqueSlug(base, excludeId) {
  const cleaned = String(base || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const fallback = cleaned || 'product'
  const taken = new Set(
    getCatalogSnapshot()
      .filter((product) => product.id !== excludeId)
      .map((product) => product.slug)
  )
  if (!taken.has(fallback)) return fallback
  let index = 2
  while (taken.has(`${fallback}-${index}`)) index += 1
  return `${fallback}-${index}`
}

export function addProduct(draft) {
  const product = { ...draft, id: draft.id || nextProductId(), isCustom: true }
  overrides = { ...overrides, created: [...overrides.created, product] }
  persistAndNotify()
  return product
}

export function patchProduct(id, patch) {
  const existing = overrides.created.find((product) => product.id === id)
  if (existing) {
    overrides = {
      ...overrides,
      created: overrides.created.map((product) =>
        product.id === id ? { ...product, ...editablePatch(patch) } : product
      ),
    }
    persistAndNotify()
    return getProductById(id)
  }
  overrides = {
    ...overrides,
    patches: { ...overrides.patches, [id]: { ...overrides.patches[id], ...editablePatch(patch) } },
  }
  persistAndNotify()
  return getProductById(id)
}

export function deleteProduct(id) {
  const wasCreated = overrides.created.some((product) => product.id === id)
  overrides = {
    ...overrides,
    created: overrides.created.filter((product) => product.id !== id),
    patches: Object.fromEntries(
      Object.entries(overrides.patches).filter(([productId]) => productId !== id)
    ),
    removed:
      !wasCreated && seedProducts.some((product) => product.id === id) && !overrides.removed.includes(id)
        ? [...overrides.removed, id]
        : overrides.removed,
  }
  persistAndNotify()
}

export function restoreSeed() {
  overrides = emptyOverrides()
  removeKey(STORAGE_KEY)
  persistAndNotify()
}

// تُستخدم في الاختبارات بعد تعديل التخزين مباشرة.
export function reloadOverrides() {
  overrides = readOverrides()
  invalidate()
  listeners.forEach((listener) => listener())
}
