import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import ProductImage from '../ui/ProductImage.jsx'
import { company } from '../../data/company.js'
import { categoryGroupIds, sectionCount, subCategories } from '../../data/categories.js'
import { useCatalog } from '../../hooks/useCatalog.js'
import { coverProductOf } from '../../utils/sectionOrb.js'
import { priceForQuantity } from '../../utils/pricing.js'
import { formatPrice } from '../../utils/format.js'

function priceRange(items) {
  // أصناف لسه بلا سعر ما تدخلش المدى: «بلا» مش صفر، والمختلط يعرض اللي اتسعّر بس
  const prices = items
    .map((product) => priceForQuantity(product, 1).unit)
    .filter((value) => value !== null && Number.isFinite(value))
  if (!prices.length) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return { min, max, single: min === max }
}

export default function CategoryCard({ category, to, index = 0 }) {
  const group = categoryGroupIds(category.id)
  const items = useCatalog().filter((product) => group.has(product.categoryId))
  const children = subCategories(category.id)
  const badge = sectionCount(category.id, items.length)
  const cover = coverProductOf(items)
  const range = priceRange(items)
  const href = to ?? `/products?category=${category.id}`

  return (
    <article className='card category-tile' style={{ '--i': index }}>
      <Link to={href} className='category-tile__media' tabIndex={-1} aria-hidden='true'>
        <span className='category-tile__orb'>
          {category.image ? (
            <ProductImage
              src={category.image}
              alt={`نماذج من منتجات ${category.name}`}
              ratio='square'
              className='category-tile__image'
            />
          ) : cover ? (
            <ProductImage src={cover.image} alt='' ratio='square' className='category-tile__image' />
          ) : (
            <span className='product-image product-image--square category-tile__image' />
          )}
          <span className='category-tile__icon'>
            <CategoryIcon name={category.icon} size={18} />
          </span>
        </span>
      </Link>

      <div className='category-tile__body'>
        <div className='category-tile__head'>
          <h3 className='category-tile__name'>
            <Link to={href}>{category.name}</Link>
          </h3>
          <span className='category-tile__count'>
            {badge.value} {badge.unit}
          </span>
        </div>

        <p className='category-tile__desc'>{category.description}</p>

        {range ? (
          <p className='category-tile__price'>
            {range.single
              ? `السعر يبدأ من ${formatPrice(range.min, company.currencyLabel)}`
              : `الأسعار من ${formatPrice(range.min, company.currencyLabel)} إلى ${formatPrice(
                  range.max,
                  company.currencyLabel
                )}`}
          </p>
        ) : (
          <p className='category-tile__price'>
            {items.length ? 'أسعار أصنافه لسه بتُحدَّد' : 'لا أصناف في هذا القسم بعد'}
          </p>
        )}

        <Link to={href} className='category-tile__cta'>
          تصفّح القسم <ArrowLeft size={15} aria-hidden='true' />
        </Link>

        {children.length ? (
          <ul className='category-tile__subs' aria-label={`أقسام فرعية من ${category.name}`}>
            {children.map((child) => (
              <li key={child.id}>
                <Link to={`/products?category=${child.id}`}>{child.name}</Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}
