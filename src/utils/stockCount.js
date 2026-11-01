import { getProductById, patchProduct } from './catalogStore.js'
import { normalizeArabic } from './arabic.js'
import { readJson, removeKey, writeJson } from './storage.js'

const STORAGE_KEY = 'stock-counts'

// عدّ صحيح غير سالب: يقبل الأرقام العربية، ويرفض الفراغ والإشارة السالبة بدل تحويلها لصفر
function toCount(value) {
  const text = normalizeArabic(typeof value === 'number' ? String(value) : value ?? '')
  if (!text.trim()) return null
  if (/[-−]/.test(text)) return null
  const digits = text.replace(/[^\d.]/g, '')
  if (!digits) return null
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? Math.floor(parsed) : null
}

function sanitizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const count = toCount(entry.count)
  if (count === null) return null
  return {
    count,
    at: typeof entry.at === 'string' ? entry.at : null,
    appliedAt: typeof entry.appliedAt === 'string' ? entry.appliedAt : null,
  }
}

function readEntries() {
  const raw = readJson(STORAGE_KEY, null)
  if (!raw || typeof raw !== 'object') return {}
  const entries = {}
  Object.entries(raw).forEach(([productId, entry]) => {
    const clean = sanitizeEntry(entry)
    if (clean && typeof productId === 'string') entries[productId] = clean
  })
  return entries
}

let entries = readEntries()
const listeners = new Set()

function persist() {
  if (Object.keys(entries).length) writeJson(STORAGE_KEY, entries)
  else removeKey(STORAGE_KEY)
  listeners.forEach((listener) => listener())
}

export function subscribeStockCounts(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getStockCounts() {
  return entries
}

// إعادة القراءة من التخزين بعد مسح المفتاح أو تعديله خارج اللوحة
export function reloadStockCounts() {
  entries = readEntries()
  listeners.forEach((listener) => listener())
  return entries
}

export function countFor(productId) {
  return entries[productId] ?? null
}

// تسجيل العدّ لا يمس رقم المخزون المكتوب: العدّ سجل مستقل حتى يعتمدَه صاحبه صراحةً
export function recordCount(productId, value, at = new Date().toISOString()) {
  const count = toCount(value)
  if (!productId || count === null) return { error: 'اكتب عددًا صحيحًا غير سالب.' }
  entries = { ...entries, [productId]: { count, at, appliedAt: null } }
  persist()
  return { entry: entries[productId] }
}

export function clearCount(productId) {
  if (!entries[productId]) return false
  const next = { ...entries }
  delete next[productId]
  entries = next
  persist()
  return true
}

export function clearAllCounts() {
  entries = {}
  persist()
}

// الاعتماد وحده هو ما يكتب في المخزون، ويكتب القيمة المعدودة لا الفرق
export function applyCount(productId) {
  const entry = entries[productId]
  if (!entry) return { error: 'لا يوجد عدّ مسجَّل لهذا الصنف.' }
  if (!getProductById(productId)) return { error: 'الصنف غير موجود في الكتالوج.' }
  patchProduct(productId, { stock: entry.count })
  entries = { ...entries, [productId]: { ...entry, appliedAt: new Date().toISOString() } }
  persist()
  return { stock: entry.count }
}

export function diffFor(product, entry = countFor(product?.id)) {
  if (!product || !entry) return null
  return entry.count - Math.floor(Number(product.stock) || 0)
}

export function countsSummary(products, source = entries) {
  const list = products ?? []
  const rows = list
    .map((product) => ({ product, entry: source[product.id] ?? null }))
    .filter((row) => row.entry)
  const withDiff = rows.filter((row) => row.entry.count !== Math.floor(Number(row.product.stock) || 0))
  return {
    recorded: rows.length,
    pending: rows.filter((row) => !row.entry.appliedAt).length,
    mismatched: withDiff.length,
    untouched: list.length - rows.length,
  }
}
