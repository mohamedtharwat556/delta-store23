import { useLocation } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../hooks/useCart.js'
import { company } from '../../data/company.js'
import { isCartBarVisible } from '../../utils/cartBar.js'
import { formatNumber, formatPrice } from '../../utils/format.js'

export default function CartBar() {
  const { summary, openDrawer } = useCart()
  const { pathname } = useLocation()

  if (!isCartBarVisible(pathname, summary.lineCount)) return null

  return (
    <button type='button' className='cart-bar' onClick={openDrawer}>
      <span className='cart-bar__icon'>
        <ShoppingBag size={18} aria-hidden='true' />
      </span>
      <span className='cart-bar__text'>
        <span className='cart-bar__count'>{formatNumber(summary.lineCount)} صنف</span>
        <span className='cart-bar__total'>{formatPrice(summary.total, company.currencyLabel)}</span>
      </span>
      <span className='cart-bar__cta'>عرض السلة</span>
    </button>
  )
}
