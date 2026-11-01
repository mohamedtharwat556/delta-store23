const NAMESPACE = 'delta-store'

export const UNLOCK_FLAG = `${NAMESPACE}:dashboard-unlocked`

// إملاء التاجر 2026-11-01: رمز واحد ثابت للوحة. البوابة دي في المتصفح والكود عام على نت، فالرمز
// مقروء لأي حد — هو حاجب للفضول مش قفل. VITE_DASHBOARD_KEY يسمّيه على البناء، وقيمة فاضية
// صريحة (`VITE_DASHBOARD_KEY=`) ترجّع حالة «مش متظبطة» وتلغي الرمز المضمَّن.
export const DEFAULT_DASHBOARD_KEY = 'admin123'

// البوابة تتحقّق في المتصفح، ومفتاح Vite بيتحقن في حزمة JS عامة على نت:
// فهي حاجب للفضول مش قفل. التطوير المحلي يفتح بلا بوابة حتى ما تنقطعش اللوحة عن التاجر.
export function dashboardAccess({ prod, key, unlocked }) {
  if (!prod) return 'open'
  if (!key) return 'unconfigured'
  return unlocked ? 'open' : 'form'
}

export function readUnlockFlag() {
  try {
    return window.sessionStorage.getItem(UNLOCK_FLAG) === '1'
  } catch {
    return false
  }
}

export function setUnlockFlag() {
  try {
    window.sessionStorage.setItem(UNLOCK_FLAG, '1')
  } catch {
    /* التخزين غير متاح: يفضل يسأل على الرمز كل مرة */
  }
}
