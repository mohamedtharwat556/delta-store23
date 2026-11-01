import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import QuantityStepper from '../ui/QuantityStepper.jsx'
import { useCart } from '../../hooks/useCart.js'
import { availabilityOf, hasKnownPrice, innerCount, quantityOptions } from '../../utils/pricing.js'
import { formatNumber } from '../../utils/format.js'

const OPTION_PREFIX = {
  single: '',
  wholesale: 'حد الجملة',
  'wholesale-double': 'ضعف الحد',
}

export default function AddToCart({ product, compact = false, value, onQuantityChange }) {
  const [internalQuantity, setInternalQuantity] = useState(1)
  const { addToCart } = useCart()

  const quantity = value ?? internalQuantity
  const setQuantity = onQuantityChange ?? setInternalQuantity
  // مخزون مجهول = بلا سقف، ومخزون معروف = سقفه عدده
  const stock = availabilityOf(product).stock
  const max = stock === null ? null : Math.max(1, stock)
  const soldOut = stock === 0
  // الصنف الذي لم يُسعَّر بعد لا يُباع: الزر مقفول برسالة واضحة بدل سعر صفر
  const unpriced = !hasKnownPrice(product)
  const shortcuts = compact || unpriced ? [] : quantityOptions(product, max ?? 999)
  const inner = innerCount(product, quantity)

  return (
    <div className={`add-to-cart${compact ? ' add-to-cart--compact' : ''}`}>
      {!compact ? (
        <QuantityStepper value={quantity} max={max ?? 999} onChange={setQuantity} label={product.name} />
      ) : null}

      <button
        type='button'
        className='btn btn--primary add-to-cart__btn'
        disabled={soldOut || unpriced}
        onClick={() => addToCart(product.id, compact ? 1 : quantity)}
      >
        <ShoppingCart size={17} aria-hidden='true' />
        {soldOut ? 'غير متوفر' : unpriced ? 'السعر لسه ما اتحدّدش' : 'أضف إلى السلة'}
      </button>

      {shortcuts.length > 1 ? (
        <div className='qty-shortcuts' role='group' aria-label='كميات جاهزة لهذا الصنف'>
          {shortcuts.map((option) => {
            const optionInner = innerCount(product, option.quantity)
            const prefix = OPTION_PREFIX[option.kind]
            return (
              <button
                key={option.kind}
                type='button'
                className={`chip chip--filter${quantity === option.quantity ? ' is-active' : ''}`}
                aria-pressed={quantity === option.quantity}
                onClick={() => setQuantity(option.quantity)}
              >
                {prefix ? `${prefix} · ` : ''}
                {formatNumber(option.quantity)} {product.unit}
                {optionInner ? ` = ${formatNumber(optionInner)} ${product.countUnit ?? 'قطعة'}` : ''}
              </button>
            )
          })}
        </div>
      ) : null}

      {inner ? (
        <p className='qty-inner-note'>
          الكمية تعادل {formatNumber(inner)} {product.countUnit ?? 'قطعة'}
        </p>
      ) : null}
    </div>
  )
}
