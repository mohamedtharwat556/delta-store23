import { company } from '../../data/company.js'
import { BASIS_LABELS, priceForQuantity } from '../../utils/pricing.js'
import { formatPrice } from '../../utils/format.js'

export default function Price({ product, quantity = 1, size = 'md', showCompare = true }) {
  const { unit, basis, compareAt } = priceForQuantity(product, quantity)
  const priced = unit !== null
  const discounted = priced && compareAt !== null && compareAt > unit

  return (
    <div className={`price price--${size}`}>
      {priced ? (
        <span className='price__value' key={unit}>
          {formatPrice(unit, company.currencyLabel)}
        </span>
      ) : (
        <span className='price__value price__value--unset'>السعر يُحدَّد</span>
      )}
      {priced ? (
        <span className={`price__basis price__basis--${basis}`}>{BASIS_LABELS[basis]}</span>
      ) : null}
      {showCompare && discounted ? (
        <span className='price__compare'>{formatPrice(compareAt, company.currencyLabel)}</span>
      ) : null}
    </div>
  )
}
