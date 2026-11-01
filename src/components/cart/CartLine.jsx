import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import ProductImage from '../ui/ProductImage.jsx'
import QuantityStepper from '../ui/QuantityStepper.jsx'
import { BASIS_LABELS, innerCount } from '../../utils/pricing.js'
import { describePack, formatNumber, formatPrice } from '../../utils/format.js'
import { company } from '../../data/company.js'
import { useCart } from '../../hooks/useCart.js'

export default function CartLine({ line, index = 0 }) {
  const { setQuantity, removeItem } = useCart()
  const { product, quantity, unitPrice, basis, lineTotal, missingForWholesale, maxQuantity } = line
  const wholesaleTarget = quantity + missingForWholesale
  const wholesaleInner = innerCount(product, wholesaleTarget)
  const countUnit = product.countUnit ?? 'قطعة'

  return (
    <li className='cart-line' style={{ '--i': index }}>
      <Link to={`/products/${product.slug}`} className='cart-line__media'>
        <ProductImage src={product.image} alt={product.name} ratio='thumb' />
      </Link>

      <div className='cart-line__info'>
        <h3 className='cart-line__name'>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className='cart-line__meta'>
          {describePack(product)} · {formatPrice(unitPrice, company.currencyLabel)} / {product.unit}
        </p>
        <p className='cart-line__basis'>
          <span className={`chip chip--${basis}`}>{BASIS_LABELS[basis]}</span>
          {basis !== 'wholesale' && missingForWholesale > 0 ? (
            wholesaleTarget <= maxQuantity ? (
              <button
                type='button'
                className='cart-line__hint cart-line__hint--action'
                onClick={() => setQuantity(product.id, wholesaleTarget)}
              >
                لسعر الجملة: {formatNumber(wholesaleTarget)} {product.unit}
                {wholesaleInner ? ` (${formatNumber(wholesaleInner)} ${countUnit})` : ''}
              </button>
            ) : (
              <span className='cart-line__hint'>
                الجملة من {formatNumber(wholesaleTarget)} {product.unit}، والمتاح {formatNumber(maxQuantity)} فقط
              </span>
            )
          ) : null}
        </p>
      </div>

      <div className='cart-line__control'>
        <QuantityStepper
          value={quantity}
          max={maxQuantity}
          onChange={(next) => setQuantity(product.id, next)}
          label={product.name}
          size='sm'
        />
        <strong className='cart-line__total'>{formatPrice(lineTotal, company.currencyLabel)}</strong>
        <button
          type='button'
          className='cart-line__remove'
          onClick={() => removeItem(product.id)}
          aria-label={`حذف ${product.name} من السلة`}
        >
          <Trash2 size={16} aria-hidden='true' />
          حذف
        </button>
      </div>
    </li>
  )
}
