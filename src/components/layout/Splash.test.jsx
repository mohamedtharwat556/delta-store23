import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Splash from './Splash.jsx'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('شاشة الترحيب', () => {
  it('تعرض اللوجو والجملة ثم تختفي بعد ثلاث ثوانٍ', () => {
    vi.useFakeTimers()
    const { container } = render(<Splash />)

    expect(screen.getByRole('status').textContent).toContain('كل اللي بيتك ومحلك محتاجه، في مكان واحد')
    const logo = screen.getByRole('status').querySelector('.splash__logo')
    expect(logo.getAttribute('src')).toContain('brand-logo')
    expect(logo.getAttribute('alt')).toContain('دلتا تريد')

    act(() => vi.advanceTimersByTime(2999))
    expect(container.querySelector('.splash')).toBeTruthy()
    expect(container.querySelector('.splash.is-leaving')).toBeNull()

    act(() => vi.advanceTimersByTime(1))
    expect(container.querySelector('.splash.is-leaving')).toBeTruthy()

    act(() => vi.advanceTimersByTime(420))
    expect(container.querySelector('.splash')).toBeNull()
  })

  it('تتخطى نفسها بالكامل عند تفضيل تقليل الحركة', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const { container } = render(<Splash />)
    expect(container.querySelector('.splash')).toBeNull()
    vi.unstubAllGlobals()
  })
})
