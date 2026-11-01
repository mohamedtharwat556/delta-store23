import { afterEach } from 'vitest'

// كل اختبار يبدأ بمخزن نظيف: المحلي للسلات والطلبات، والجلسي لقفل اللوحة
afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
