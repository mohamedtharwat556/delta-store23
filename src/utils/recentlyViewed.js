// معرّفات آخر أصناف زارها العميل على الجهاز ده — مش بيانات شخصية وما بتخرجش من المتصفح
import { readJson, writeJson } from './storage.js'

const KEY = 'recently-viewed'
export const RECENT_LIMIT = 8

export function readRecentViewed() {
  const stored = readJson(KEY, [])
  if (!Array.isArray(stored)) return []
  return stored.filter((id) => typeof id === 'string')
}

// VisitId يفضل مكانه في القائمة: العميل بيطرق الصنف نفسه عشر مرات وهو يقارن سعرًا، والقائمة ما تتكررش
export function recordRecentViewed(productId) {
  if (typeof productId !== 'string' || !productId) return readRecentViewed()
  const next = [productId, ...readRecentViewed().filter((id) => id !== productId)].slice(0, RECENT_LIMIT)
  writeJson(KEY, next)
  return next
}

export function clearRecentViewed() {
  const ids = readRecentViewed()
  writeJson(KEY, [])
  return ids
}
