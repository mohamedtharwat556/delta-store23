import { normalizeArabic } from './arabic.js'
import { removeKey, readJson, writeJson } from './storage.js'
import { orderTotals } from './pricing.js'

const STORAGE_KEY = 'delivery-rules'

// أرقام تجريبية افتراضية: يغيّرها التاجر من تبويب «التوصيل» في لوحة التحكم، وتبقى في متصفحه
export const DEFAULT_DELIVERY_RULES = {
  feeLocal: 15,
  feeOther: 25,
  freeFrom: 1500,
  wholesaleMin: 300,
}

// الزرقا مركز تابع لمحافظة دمياط، فالنطاق القريب يشمل الاتنين
const LOCAL_MARKERS = ['دمياط', 'الزرقا']

const roundMoney = (value) => Math.round(value * 100) / 100

const MAX_RULE_AMOUNT = 100000

// رقم إعداد يكتبه التاجر: يرفض الفراغ والإشارة السالبة والقيمة غير المعقولة، ويقبل الأرقام العربية
export function parseRuleAmount(value) {
  const text = normalizeArabic(String(value ?? ''))
  if (!text.trim()) return null
  if (/[-−]/.test(text)) return null
  const digits = text.replace(/[^\d.]/g, '')
  if (!digits) return null
  const parsed = Number(digits)
  if (!Number.isFinite(parsed) || parsed > MAX_RULE_AMOUNT) return null
  return roundMoney(parsed)
}

function toAmount(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return roundMoney(parsed)
}

function clampAmount(value, fallback) {
  const amount = toAmount(value)
  return amount === null ? fallback : amount
}

function sanitizeRules(source) {
  const base = DEFAULT_DELIVERY_RULES
  return {
    feeLocal: clampAmount(source?.feeLocal, base.feeLocal),
    feeOther: clampAmount(source?.feeOther, base.feeOther),
    freeFrom: clampAmount(source?.freeFrom, base.freeFrom),
    wholesaleMin: clampAmount(source?.wholesaleMin, base.wholesaleMin),
  }
}

function readRules() {
  const raw = readJson(STORAGE_KEY, null)
  if (!raw || typeof raw !== 'object') return sanitizeRules(null)
  return sanitizeRules(raw)
}

let rules = readRules()
const listeners = new Set()

export function subscribeDeliveryRules(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getDeliveryRules() {
  return rules
}

export function saveDeliveryRules(patch) {
  rules = sanitizeRules({ ...rules, ...patch })
  writeJson(STORAGE_KEY, rules)
  listeners.forEach((listener) => listener())
  return rules
}

export function resetDeliveryRules() {
  rules = sanitizeRules(null)
  removeKey(STORAGE_KEY)
  listeners.forEach((listener) => listener())
  return rules
}

export function isLocalArea(area) {
  const text = String(area ?? '')
  return LOCAL_MARKERS.some((marker) => text.includes(marker))
}

// بلا محافظة محددة لا يمكن تقدير الشحن — تُرجَع null حتى لا يُختلق رقم
export function deliveryQuote({ area, subtotal }, source = rules) {
  if (!area) return null
  const base = isLocalArea(area)
    ? { label: 'توصيل داخل دمياط والزرقا', amount: source.feeLocal }
    : { label: 'توصيل إلى باقي المحافظات', amount: source.feeOther }
  const total = Math.max(0, toAmount(subtotal) ?? 0)
  if (source.freeFrom > 0 && total >= source.freeFrom) {
    return { label: 'توصيل مجاني', amount: 0, waived: true, baseLabel: base.label }
  }
  return { ...base, waived: false, baseLabel: base.label }
}

// صفر في freeFrom يعني بلا إعفاء، وفي wholesaleMin يعني بلا حد أدنى
export function freeShippingHint(subtotal, source = rules) {
  if (!(source.freeFrom > 0)) return null
  const total = Math.max(0, toAmount(subtotal) ?? 0)
  if (total >= source.freeFrom) return { reached: true, missing: 0, threshold: source.freeFrom }
  return { reached: false, missing: roundMoney(source.freeFrom - total), threshold: source.freeFrom }
}

export function wholesaleGate(subtotal, source = rules) {
  const min = source.wholesaleMin
  const total = Math.max(0, toAmount(subtotal) ?? 0)
  if (!(min > 0)) return { ok: true, min: 0, missing: 0 }
  if (total >= min) return { ok: true, min, missing: 0 }
  return { ok: false, min, missing: roundMoney(min - total) }
}

// البند يُخزَّن مع الطلب لحظة التسجيل، فالتعديل اللاحق للسياسة لا يغيّر فاتورة صدرت
export function sanitizeDelivery(source) {
  if (!source || typeof source !== 'object') return null
  const label = String(source.label ?? '').trim()
  const amount = toAmount(source.amount)
  if (!label || amount === null) return null
  return { label, amount }
}

export function payableOf(order) {
  const totals = orderTotals(order)
  const deliveryAmount = roundMoney(toAmount(order?.delivery?.amount) ?? 0)
  return {
    subtotal: totals.total,
    units: totals.units,
    deliveryAmount,
    total: roundMoney(totals.total + deliveryAmount),
  }
}
