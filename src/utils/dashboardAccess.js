const NAMESPACE = 'delta-store'

export const UNLOCK_FLAG = `${NAMESPACE}:dashboard-unlocked`

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
