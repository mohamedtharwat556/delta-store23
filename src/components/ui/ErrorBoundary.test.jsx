import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary.jsx'

function Boom() {
  throw new Error('خطأ مقصود في الاختبار')
}

function Quiet({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('يمرّر الأبناء عندما لا يوجد خطأ', () => {
    render(
      <Quiet>
        <ErrorBoundary>
          <p>المتجر يعمل</p>
        </ErrorBoundary>
      </Quiet>
    )
    expect(screen.getByText('المتجر يعمل')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('يعرض رسالة مفهومة بدل شاشة بيضاء عند سقوط شجرة العرض', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <Quiet>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </Quiet>
    )

    expect(screen.getByRole('alert').textContent).toContain('حدث خطأ في هذه الصفحة')
    expect(screen.getByText(/لم تُفقد السلة/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeTruthy()
    expect(screen.getByText('خطأ مقصود في الاختبار')).toBeTruthy()
    expect(spy).toHaveBeenCalled()
  })
})
