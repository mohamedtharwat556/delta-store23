import { Link } from 'react-router-dom'
import { BadgePercent } from 'lucide-react'
import { topCategories } from '../data/categories.js'
import { company } from '../data/company.js'
import { useCatalog } from '../hooks/useCatalog.js'
import { innerCount } from '../utils/pricing.js'
import { describePack, formatNumber, formatPrice } from '../utils/format.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function Wholesale() {
  const products = useCatalog()
  usePageTitle('البيع بالجملة')

  return (
    <>
      <header className='page-header'>
        <h1>البيع بالجملة</h1>
        <p className='section__subtitle'>
          كيف يعمل سعر الجملة في المتجر، وجدول الحدود لكل صنف — بأرقام تجريبية.
        </p>
      </header>

      <section className='card'>
        <h2>
          <BadgePercent size={18} aria-hidden='true' /> طريقة الحساب
        </h2>
        <ul className='rule-list u-mt-3'>
          {company.wholesale.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className='section__subtitle u-mt-3'>
          عند إضافة الكمية في السلة، يتحول السعر المعروض تلقائيًا إلى سعر الجملة إذا تحقّق الحد الأدنى،
          ويظهر سبب التسعير بجوار كل صنف.
        </p>
      </section>

      <section className='card u-mt-4'>
        <h2>جدول حدود الجملة</h2>
        <p className='section__subtitle u-mt-2'>
          الكمية تُحسب بوحدة البيع نفسها (علبة/ربطة/كرتونة)، والسطر الرمادي يوضح محتوى الوحدة
          والمجموع بالقطعة عند الحد الأدنى.
        </p>
        <div className='table-scroll table-scroll--wholesale'>
          <table className='wholesale-table dash-fit-table'>
            <caption className='visually-hidden'>
              أسعار الجملة والحد الأدنى لكل صنف بأرقام تجريبية
            </caption>
            <colgroup>
              <col className='col-product' />
              <col className='col-unit' />
              <col className='col-retail' />
              <col className='col-wholesale' />
              <col className='col-min' />
              <col className='col-diff' />
            </colgroup>
            <thead>
              <tr>
                <th scope='col'>الصنف</th>
                <th scope='col'>وحدة البيع</th>
                <th scope='col'>سعر القطاعي</th>
                <th scope='col'>سعر الجملة</th>
                <th scope='col'>الحد الأدنى</th>
                <th scope='col'>فرق الوحدة</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const diff = product.wholesalePrice ? product.retailPrice - product.wholesalePrice : null
                const min = product.wholesaleMinQuantity
                const minInner = min ? innerCount(product, min) : null
                const pack = describePack(product)
                return (
                  <tr key={product.id}>
                    <th scope='row'>
                      <Link to={`/products/${product.slug}`}>{product.name}</Link>
                    </th>
                    <td data-label='وحدة البيع'>
                      {product.unit}
                      {pack !== product.unit ? <span className='cell-sub'>{pack}</span> : null}
                    </td>
                    <td data-label='سعر القطاعي'>
                      {formatPrice(product.retailPrice, company.currencyLabel)}
                    </td>
                    <td data-label='سعر الجملة'>
                      {product.wholesalePrice
                        ? formatPrice(product.wholesalePrice, company.currencyLabel)
                        : '—'}
                    </td>
                    <td data-label='الحد الأدنى'>
                      {min ? (
                        <>
                          {formatNumber(min)} {product.unit}
                          {minInner ? (
                            <span className='cell-sub'>
                              = {formatNumber(minInner)} {product.countUnit ?? 'قطعة'}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td data-label='فرق الوحدة'>
                      {diff !== null ? formatPrice(diff, company.currencyLabel) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className='notice u-mt-4'>{company.wholesale.demoNotice}</p>

      <div className='btn-row u-mt-4'>
        <Link to='/products' className='btn btn--primary'>
          تسوّق بالجملة
        </Link>
        <Link to='/categories' className='btn btn--ghost'>
          تصفّح الأقسام ({topCategories().length})
        </Link>
      </div>
    </>
  )
}
