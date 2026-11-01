import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_DASHBOARD_KEY,
  UNLOCK_FLAG,
  readUnlockFlag,
} from '../../utils/dashboardAccess.js'

// المفتاح يُقرأ وقت تحميل الوحدة، فلازم يتظبط قبل الاستيراد
async function loadGate() {
  vi.resetModules()
  const module = await import('./DashboardGate.jsx')
  return module.default
}

// مستلَم الرمز: اكتب ثم أرسل الفورم نفسه (أضمن من نقرة الزرار في jsdom)
function tryKey(value) {
  const input = screen.getByLabelText('رمز الدخول')
  fireEvent.change(input, { target: { value } })
  fireEvent.submit(input.closest('form'))
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('بوابة /dashboard في نسخة الإنتاج', () => {
  it('تسأل على الرمز وما تسلّمش اللوحة للغافل', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_DASHBOARD_KEY', 'دلتا-٢٠٢٦')
    const Gate = await loadGate()

    render(
      <Gate>
        <p>اللوحة مفتوحة</p>
      </Gate>
    )

    expect(screen.queryByText('اللوحة مفتوحة')).toBeNull()
    tryKey('غلط')

    expect(screen.getByRole('alert').textContent).toContain('الرمز مش صحيح')
    expect(screen.queryByText('اللوحة مفتوحة')).toBeNull()
    expect(readUnlockFlag()).toBe(false)
  })

  it('الرمز الصحيح يفتح اللوحة ويسجّل علامة في مخزن الجلسة وحده', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_DASHBOARD_KEY', 'دلتا-٢٠٢٦')
    const Gate = await loadGate()

    render(
      <Gate>
        <p>اللوحة مفتوحة</p>
      </Gate>
    )

    tryKey('  دلتا-٢٠٢٦  ')

    expect(screen.getByText('اللوحة مفتوحة')).toBeTruthy()
    expect(sessionStorage.getItem(UNLOCK_FLAG)).toBe('1')
    // الرمز نفسه ما ينزلش في أي مخزن
    expect(localStorage.length).toBe(0)
  })

  it('بناء بلا متغيّر بيئة يستخدم الرمز المضمَّن، والغلط مرفوض', async () => {
    vi.stubEnv('PROD', true)
    const Gate = await loadGate()

    render(
      <Gate>
        <p>اللوحة مفتوحة</p>
      </Gate>
    )

    expect(screen.getByRole('heading').textContent).toContain('لوحة الدلتا للتاجر')
    tryKey('admin124')
    expect(screen.getByRole('alert').textContent).toContain('الرمز مش صحيح')

    tryKey(` ${DEFAULT_DASHBOARD_KEY} `)
    expect(screen.getByText('اللوحة مفتوحة')).toBeTruthy()
    expect(sessionStorage.getItem(UNLOCK_FLAG)).toBe('1')
  })

  it('الرمز الفاضي ما يحوّرش رسالة خطأ', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_DASHBOARD_KEY', 'دلتا-٢٠٢٦')
    const Gate = await loadGate()

    render(
      <Gate>
        <p>اللوحة مفتوحة</p>
      </Gate>
    )

    act(() => {
      tryKey('')
    })

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('بناء بلا مفتاح = اللوحة مقفولة ورسالة تشرح الناقص', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_DASHBOARD_KEY', '')
    const Gate = await loadGate()

    render(
      <Gate>
        <p>اللوحة مفتوحة</p>
      </Gate>
    )

    expect(screen.queryByText('اللوحة مفتوحة')).toBeNull()
    expect(screen.getByRole('heading').textContent).toContain('مش متظبطة')
    expect(screen.getByText('VITE_DASHBOARD_KEY')).toBeTruthy()
  })
})

describe('بوابة /dashboard في التطوير المحلي', () => {
  it('تفتح بلا سؤال حتى يظل التاجر شغال على لوحته', async () => {
    const Gate = await loadGate()

    render(
      <Gate>
        <p>اللوحة مفتوحة</p>
      </Gate>
    )

    expect(screen.getByText('اللوحة مفتوحة')).toBeTruthy()
    expect(screen.queryByLabelText('رمز الدخول')).toBeNull()
  })
})
