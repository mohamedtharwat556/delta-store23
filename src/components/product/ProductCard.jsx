import { Link } from 'react-router-dom'
import ProductImage from '../ui/ProductImage.jsx'
import Price from './Price.jsx'
import StockBadge from './StockBadge.jsx'
import AddToCart from './AddToCart.jsx'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import { categoryChain } from '../../data/categories.js'
import { company } from '../../data/company.js'
import { describePack, formatPrice } from '../../utils/format.js'
import { hasKnownPrice } from '../../utils/pricing.js'

export default function ProductCard({ product, priority = false, index = 0, note }) {
  const chain = categoryChain(product.categoryId)
  const section = chain[0] ?? null
  const last = chain[chain.length - 1] ?? null
  // الشارة تجمع عائلة القسم مع ورقته: «بخور تيجاني › أعواد» تفرّق عن «بخور إنسام › أعواد»،
  // وفي المستوى الرابع تكتفي بالعائلة والورقة فلا تكتب «هرمي › هرمي» ولا تسقط اسم العائلة
  const anchor = chain.length > 3 ? chain[1] : chain[chain.length - 2]
  const chipLabel = anchor && last && anchor.id !== last.id ? `${anchor.name} › ${last.name}` : (last?.name ?? null)
  const wholesaleHint = !hasKnownPrice(product)
    ? 'السعر والجملة لسه بتُحدَّد'
    : product.wholesalePrice && product.wholesaleMinQuantity
      ? `جملة من ${product.wholesaleMinQuantity} ${product.unit}: ${formatPrice(product.wholesalePrice, company.currencyLabel)}`
      : 'قطاعي فقط'

  return (
    <article className='card product-card' style={{ '--i': index }}>
      <Link to={`/products/${product.slug}`} className='product-card__media' tabIndex={-1}>
        <ProductImage src={product.image} alt={product.name} priority={priority} />
      </Link>

      <div className='product-card__body'>
        <span className='product-card__category'>
          <CategoryIcon name={section?.icon} size={14} />
          {chipLabel || 'غير مصنّف'}
        </span>

        <h3 className='product-card__name'>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        <p className='product-card__pack'>{describePack(product)}</p>
        {note ? <p className='product-card__note'>{note}</p> : null}

        <Price product={product} quantity={1} />
        <p className='product-card__wholesale'>{wholesaleHint}</p>

        <div className='product-card__foot'>
          <StockBadge product={product} />
          <AddToCart product={product} compact />
        </div>
      </div>
    </article>
  )
}
