import { useEffect } from 'react'

// الهيدر بيغيّر ارتفاعه لما صفوفه تتفكّ على الموبايل، فمسافة الالتصاق تحتَه تتقاس من العنصر نفسه لا من رقم مكتوب
export function useStickyHeaderOffset() {
  useEffect(() => {
    const header = document.querySelector('.site-header')
    if (!header) return undefined

    const measure = () => {
      const height = Math.round(header.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--header-h', `${height}px`)
    }

    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])
}
