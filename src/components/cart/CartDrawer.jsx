import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, X } from 'lucide-react'
import CartLine from './CartLine.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { useCart } from '../../hooks/useCart.js'
import { company } from '../../data/company.js'
import { formatPrice } from '../../utils/format.js'

export default function CartDrawer() {
  const { isDrawerOpen, closeDrawer, lines, summary } = useCart()
  const panelRef = useRef(null)

  useEffect(() => {
    if (!isDrawerOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeDrawer()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isDrawerOpen, closeDrawer])

  if (!isDrawerOpen) return null

  return (
    <div className='drawer' role='dialog' aria-modal='true' aria-label='سلة المشتريات'>
      <button type='button' className='drawer__overlay' aria-label='إغلاق السلة' onClick={closeDrawer} />

      <aside className='drawer__panel' ref={panelRef} tabIndex={-1}>
        <header className='drawer__head'>
          <h2>
            <ShoppingBag size={18} aria-hidden='true' /> سلة المشتريات
            <span className='drawer__count'>{summary.lineCount}</span>
          </h2>
          <button type='button' className='icon-btn' onClick={closeDrawer} aria-label='إغلاق السلة'>
            <X size={20} aria-hidden='true' />
          </button>
        </header>

        <div className='drawer__body'>
          {lines.length ? (
            <ul className='cart-lines'>
              {lines.map((line, index) => (
                <CartLine key={line.product.id} line={line} index={index} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title='سلتك فارغة'
              hint='أضف أصنافًا من صفحة المنتجات، أو تصفّح أقسام البخور والولّاعات والكبريت.'
              action={
                <Link to='/products' className='btn btn--primary' onClick={closeDrawer}>
                  تصفّح المنتجات
                </Link>
              }
            />
          )}
        </div>

        {lines.length ? (
          <footer className='drawer__foot'>
            <div className='drawer__total'>
              <span>إجمالي الأصناف</span>
              <strong>{formatPrice(summary.total, company.currencyLabel)}</strong>
            </div>
            <div className='drawer__actions'>
              <Link to='/cart' className='btn btn--ghost' onClick={closeDrawer}>
                عرض السلة
              </Link>
              <Link to='/checkout' className='btn btn--primary' onClick={closeDrawer}>
                إتمام الطلب
              </Link>
            </div>
          </footer>
        ) : null}
      </aside>
    </div>
  )
}
