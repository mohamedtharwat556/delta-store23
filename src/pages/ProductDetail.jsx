import { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, MessageCircle, Phone } from 'lucide-react'
import AddToCart from '../components/product/AddToCart.jsx'
import Price from '../components/product/Price.jsx'
import ProductCard from '../components/product/ProductCard.jsx'
import ProductImage from '../components/ui/ProductImage.jsx'
import StockBadge from '../components/product/StockBadge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import {
  categoryChain,
  categoryGroupIds,
  categoryNeighborhoodIds,
  rootCategory,
} from '../data/categories.js'
import { company } from '../data/company.js'
import { useCatalog } from '../hooks/useCatalog.js'
import { describePack, formatNumber, formatPrice } from '../utils/format.js'
import { telHref, whatsAppHref } from '../utils/contactLinks.js'
import { recordRecentViewed } from '../utils/recentlyViewed.js'
import { availabilityOf, hasKnownPrice, innerCount } from '../utils/pricing.js'
import { useCart } from '../hooks/useCart.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function ProductDetail() {
  const { slug } = useParams()
  const catalog = useCatalog()
  const product = catalog.find((item) => item.slug === slug) ?? null
  usePageTitle(product?.name ?? 'الصنف غير موجود')
  const [quantity, setQuantity] = useState(1)
  const { lines } = useCart()

  // المعرّف وحده في التبعية: useEffect ما يتكررش كل ما الكتالوج يعيد البناء، والصنف المحذوف ما يسجّلش
  const viewedId = product?.id
  useEffect(() => {
    if (viewedId) recordRecentViewed(viewedId)
  }, [viewedId])

  if (!product) {
    return (
      <>
        <EmptyState
          title='المنتج غير موجود'
          hint='ربما تغيّر الرابط أو أُزيل الصنف من الكتالوج التجريبي.'
          action={
            <Link to='/products' className='btn btn--primary'>
              رجوع إلى المنتجات
            </Link>
          }
        />
      </>
    )
  }

  const chain = categoryChain(product.categoryId)
  const section = chain[0] ?? null
  // الرابط نفسه هو الشرط: لو الرقم معتمد بس بلا أرقام فما يطلعش زرار ما يروحش لمكان
  const callHref = telHref(company.contact.phone)
  const chatHref = whatsAppHref(
    company.contact.whatsapp,
    `استفسار عن صنف: ${product.name} (${product.id})`
  )
  const availability = availabilityOf(product)
  const priced = hasKnownPrice(product)
  const wholesaleInner = innerCount(product, product.wholesaleMinQuantity)
  const inCart = lines.find((line) => line.product.id === product.id)
  const group = categoryNeighborhoodIds(product.categoryId)
  // التوسيع بثلاث دواير: الورقة أولًا، فالجوار تحت أبيها، فالقسم الرئيسي كله — والسقف 8 لا 4
  const rootGroup = categoryGroupIds(rootCategory(product.categoryId).id)
  const leafPeers = catalog.filter(
    (item) => item.id !== product.id && item.categoryId === product.categoryId
  )
  const neighbors = catalog.filter(
    (item) =>
      item.id !== product.id && item.categoryId !== product.categoryId && group.has(item.categoryId)
  )
  const sectionPeers = catalog.filter(
    (item) => item.id !== product.id && !group.has(item.categoryId) && rootGroup.has(item.categoryId)
  )
  const related = [...leafPeers, ...neighbors, ...sectionPeers].slice(0, 8)

  return (
    <>
      <nav className='breadcrumbs' aria-label='مسار التنقل'>
        <Link to='/'>الرئيسية</Link>
        <ChevronLeft size={14} aria-hidden='true' />
        <Link to='/products'>المنتجات</Link>
        {chain.map((node) => (
          <Fragment key={node.id}>
            <ChevronLeft size={14} aria-hidden='true' />
            <Link to={`/products?category=${node.id}`}>{node.name}</Link>
          </Fragment>
        ))}
        {!chain.length ? (
          <>
            <ChevronLeft size={14} aria-hidden='true' />
            <Link to='/products'>غير مصنّف</Link>
          </>
        ) : null}
        <ChevronLeft size={14} aria-hidden='true' />
        <span>{product.name}</span>
      </nav>

      <div className='detail'>
        <div className='detail__media card'>
          <ProductImage src={product.image} alt={product.name} ratio='square' priority />
          <p className='detail__media-note'>صورة توضيحية تجريبية للصنف</p>
        </div>

        <div className='detail__info'>
          <span className='chip chip--category'>{section?.name ?? 'غير مصنّف'}</span>
          <h1>{product.name}</h1>
          <p className='detail__desc'>{product.description}</p>

          <div className='detail__pricing'>
            <Price product={product} quantity={quantity} size='lg' />
            <p className='detail__unit-note'>
              {product.unit
                ? `${describePack(product)} · تُحسب الكمية بوحدة ${product.unit}`
                : 'وحدة البيع لسه بتُحدَّد'}
            </p>
            <StockBadge product={product} />
            {inCart ? (
              <p className='detail__in-cart'>
                في سلتك بالفعل: {inCart.quantity} {product.unit} — الإضافة تزيد الكمية ولا تكرّر الصنف.
              </p>
            ) : null}
          </div>

          <table className='price-table'>
            <caption>قائمة أسعار تجريبية لهذا الصنف</caption>
            <thead>
              <tr>
                <th scope='col'>نوع البيع</th>
                <th scope='col'>السعر</th>
                <th scope='col'>الشرط</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope='row'>قطاعي</th>
                <td>{formatPrice(product.offerPrice ?? product.retailPrice, company.currencyLabel)}</td>
                <td>
                  {!priced
                    ? 'لسه ما اتحدّدش'
                    : product.offerPrice && product.offerPrice < product.retailPrice
                      ? `سعر عرض بدل ${formatPrice(product.retailPrice, company.currencyLabel)}`
                      : 'أي كمية'}
                </td>
              </tr>
              {product.wholesalePrice ? (
                <tr>
                  <th scope='row'>جملة</th>
                  <td>{formatPrice(product.wholesalePrice, company.currencyLabel)}</td>
                  <td>
                    من {formatNumber(product.wholesaleMinQuantity)} {product.unit}
                    {wholesaleInner === null ? null : (
                      <span className='cell-sub'>
                        = {formatNumber(wholesaleInner)} {product.countUnit ?? 'قطعة'}
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                <tr>
                  <th scope='row'>جملة</th>
                  <td>—</td>
                  <td>
                    {priced
                      ? 'غير متاح لهذا الصنف في البيانات التجريبية'
                      : 'لسه ما اتحدّدش مثل القطاعي'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className='detail__buy'>
            <AddToCart product={product} value={quantity} onQuantityChange={setQuantity} />
          </div>

          {/* ما بنخترعش رقمًا: السطر ده ظاهر من أول ما يمسك التليفون أو واتساب في company.contact */}
          {callHref || chatHref ? (
            <div className='detail__contact'>
              {callHref ? (
                <a className='btn btn--ghost btn--sm' href={callHref}>
                  <Phone size={16} aria-hidden='true' /> كلّمنا عن {product.name}
                </a>
              ) : null}
              {chatHref ? (
                <a
                  className='btn btn--ghost btn--sm'
                  href={chatHref}
                  target='_blank'
                  rel='noreferrer'
                >
                  <MessageCircle size={16} aria-hidden='true' /> اسأل على واتساب
                </a>
              ) : null}
            </div>
          ) : null}

          <p className='notice'>
            {company.wholesale.demoNotice}
            {!priced ? ' — سعر هذا الصنف لم يُحدَّد بعد، فلا يُضاف إلى السلة.' : ''}
            {availability.key === 'out' ? ' — الصنف غير متوفر حاليًا ولا يمكن إضافته للسلة.' : ''}
            {availability.key === 'unknown' ? ' — عدد المخزون لسه لم يُسجَّل من اللوحة.' : ''}
          </p>
        </div>
      </div>

      {related.length ? (
        <section className='section'>
          <h2>أصناف مشابهة من نفس القسم</h2>
          <div className='grid grid--products u-mt-3'>
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
