import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BadgePercent, Handshake, Store, Truck } from 'lucide-react'
import ProductCard from '../components/product/ProductCard.jsx'
import CategoryCard from '../components/category/CategoryCard.jsx'
import SectionHead from '../components/ui/SectionHead.jsx'
import { topCategories } from '../data/categories.js'
import { company } from '../data/company.js'
import { useCatalog } from '../hooks/useCatalog.js'
import { useOrders } from '../hooks/useOrders.js'
import { topSellers } from '../utils/analytics.js'
import { readRecentViewed } from '../utils/recentlyViewed.js'
import { formatNumber, formatPrice } from '../utils/format.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import heroShelf from '../assets/hero-shelf.svg'

const servicePoints = [
  {
    icon: Store,
    title: 'جملة وقطاعي',
    text: 'نفس الأصناف تتسع لكليهما: سعر للقطعة المفردة وسعر جملة عند بلوغ الحد الأدنى.',
  },
  {
    icon: Handshake,
    title: 'حد أدنى واضح',
    text: 'كل صنف يعرض وحدته وعدد القطع داخلها والكمية التي عندها يتحول السعر إلى جملة.',
  },
  {
    icon: Truck,
    title: 'تجهيز من المخزن',
    text: 'الأصناف السريعة الدوران متوفرة بكميات، وحالة التوفر تظهر على كل منتج.',
  },
]

export default function Home() {
  const products = useCatalog()
  const sections = topCategories()
  const { orders } = useOrders()
  usePageTitle()
  const bestSellers = useMemo(() => topSellers(products, orders, { limit: 4 }), [products, orders])
  // أصناف اتشالت من اللوحة بعد ما اتبصّت: تبقى محذوفة من الشريط مش كروت مكسورة
  const recent = useMemo(
    () =>
      readRecentViewed()
        .map((id) => products.find((product) => product.id === id))
        .filter(Boolean)
        .slice(0, 4),
    [products]
  )
  const hasSalesData = bestSellers.some((entry) => entry.units > 0)
  const lowestWholesale = Math.min(
    ...products.map((product) => product.wholesaleMinQuantity ?? Number.MAX_SAFE_INTEGER)
  )
  const wholesaleSample =
    products.find((product) => product.id === 'DL-3001' && product.wholesalePrice) ??
    products.find((product) => product.wholesalePrice && product.wholesaleMinQuantity)

  return (
    <>
      <section className='hero'>
        <div className='hero__content'>
          <span className='hero__kicker'>{company.legalName}</span>
          <h1 className='hero__title'>خردوات المتجر اليومية: بخور وولاعات وكبريت ومستلزمات منزلية</h1>
          <p className='hero__text'>{company.shortAbout}</p>

          <div className='hero__actions'>
            <Link to='/products' className='btn btn--primary btn--lg'>
              تصفّح المنتجات
              <ArrowLeft size={18} aria-hidden='true' />
            </Link>
            <Link to='/wholesale' className='btn btn--ghost btn--lg'>
              شروط الجملة
            </Link>
          </div>

          <dl className='hero__stats'>
            <div>
              <dt>أصناف معروضة</dt>
              <dd>{products.length}</dd>
            </div>
            <div>
              <dt>أقسام</dt>
              <dd>{sections.length}</dd>
            </div>
            <div>
              <dt>أقل حد للجملة</dt>
              <dd>{Number.isFinite(lowestWholesale) ? `${lowestWholesale} وحدة` : '—'}</dd>
            </div>
          </dl>
        </div>

        <div className='hero__media'>
          <img src={heroShelf} alt='رف عرض لأصناف الخردوات: بخور وولاعات وكبريت وفحم ومستلزمات منزلية' />
        </div>
      </section>

      {recent.length ? (
        <section className='section'>
          <SectionHead
            title='شوفت من قبل'
            subtitle='آخر أصناف فتحتها على الجهاز ده — بيتسجّلوا محليًا وبلا حساب وبلا بيانات شخصية.'
            action={
              <Link to='/products' className='btn btn--ghost btn--sm'>
                كل الأصناف
              </Link>
            }
          />
          <div className='grid grid--products'>
            {recent.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      <section className='section'>
        <SectionHead
          title='الأقسام'
          subtitle='تصفّح حسب الصنف — قائمة الأقسام قابلة للتوسيع من ملف البيانات.'
          action={
            <Link to='/categories' className='btn btn--ghost btn--sm'>
              كل الأقسام
            </Link>
          }
        />
        <div className='grid grid--categories'>
          {sections.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      </section>

      <section className='section'>
        <SectionHead
          title='الأكثر طلبًا'
          subtitle={
            hasSalesData
              ? 'مرتّبة على مجموع الكميات في الطلبات المعروضة هنا (تجريبية + المسجَّلة في متصفحك).'
              : 'لا مبيعات مسجَّلة بعد، فتظهر الأصناف الموسومة «الأكثر طلبًا» في بيانات الكتالوج.'
          }
          action={
            <Link to='/products?tag=best-seller' className='btn btn--ghost btn--sm'>
              عرض الكل
            </Link>
          }
        />
        <div className='grid grid--products'>
          {bestSellers.map(({ product, units }, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 2}
              index={index}
              note={
                units > 0 ? `طُلب منه ${formatNumber(units)} ${product.unit}` : 'الأكثر دورانًا في المخزن'
              }
            />
          ))}
        </div>
      </section>

      <section className='section wholesale-band'>
        <div className='wholesale-band__text'>
          <span className='chip chip--wholesale'>
            <BadgePercent size={14} aria-hidden='true' /> البيع بالجملة
          </span>
          <h2>السعر يتحول إلى جملة تلقائيًا عند بلوغ الحد الأدنى</h2>
          {wholesaleSample ? (
            <p>
              مثال: {wholesaleSample.name} —{' '}
              {formatPrice(wholesaleSample.retailPrice, company.currencyLabel)} قطاعي، و
              {formatPrice(wholesaleSample.wholesalePrice, company.currencyLabel)} للجملة عند{' '}
              {wholesaleSample.wholesaleMinQuantity} {wholesaleSample.unit}.
            </p>
          ) : (
            <p>لا يوجد صنف محدّد سعر جملة حاليًا؛ أضف سعر الجملة وحدّه من لوحة التحكم.</p>
          )}
          <Link to='/wholesale' className='btn btn--primary'>
            جدول حدود الجملة
          </Link>
        </div>

        <ul className='service-points'>
          {servicePoints.map((point) => (
            <li key={point.title} className='card service-point'>
              <span className='service-point__icon'>
                <point.icon size={20} aria-hidden='true' />
              </span>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className='notice'>
        هذا المتجر نسخة واجهة تجريبية: الأسعار والكميات والطلبات المعروضة غير معتمدة من الشركة ولا
        يوجد اتصال بخادم أو قاعدة بيانات.
      </p>
    </>
  )
}
