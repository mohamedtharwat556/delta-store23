const NAMESPACE = 'delta-store'

export function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(`${NAMESPACE}:${key}`)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    window.localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(`${NAMESPACE}:${key}`)
  } catch {
    /* التخزين غير متاح */
  }
}
