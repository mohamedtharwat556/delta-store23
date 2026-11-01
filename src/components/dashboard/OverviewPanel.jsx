import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  ClipboardCheck,
  PackageX,
  Percent,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'
import { DASHBOARD_STATUSES, ORDER_STATUS_LABELS } from '../../data/orders.js'
import { categoryPathLabel } from '../../data/categories.js'
import { company } from '../../data/company.js'
import { useCatalog } from '../../hooks/useCatalog.js'
import { useStockCounts } from '../../hooks/useStockCounts.js'
import { catalogHealth, ordersSummary } from '../../utils/analytics.js'
import { getOverridesSummary } from '../../utils/catalogStore.js'
import { countsSummary, diffFor } from '../../utils/stockCount.js'
import { formatNumber, formatPrice } from '../../utils/format.js'

const TAB_LINK_LABELS = {
  products: 'افتح المنتجات',
  pricing: 'افتح تسعير الجملة',
  orders: 'افتح الطلبات',
}

function AlertRow({ icon: Icon, title, detail, count, onGoToTab, tabId, tone = 'warn' }) {
  if (!count) return null
  return (
    <li className={`dash-alert dash-alert--${tone}`}>
      <span className='dash-alert__icon'>
        <Icon size={17} aria-hidden='true' />
      </span>
      <span className='dash-alert__text'>
        <strong>{title}</strong>
        <span>{detail}</span>
      </span>
      <span className='dash-alert__count'>{formatNumber(count)}</span>
      <button type='button' className='btn btn--ghost btn--sm' onClick={() => onGoToTab(tabId)}>
        <ArrowLeft size={14} aria-hidden='true' /> {TAB_LINK_LABELS[tabId] ?? 'افتح التبويب'}
      </button>
    </li>
  )
}

export default function OverviewPanel({ orders, onGoToTab }) {
  const products = useCatalog()
  const counts = useStockCounts()
  const summary = ordersSummary(orders)
  const health = catalogHealth(products)
  const overrides = getOverridesSummary()
  const pendingCounts = products.filter((product) => {
    const entry = counts[product.id]
    return entry && !entry.appliedAt
  })

  const kpis = [
    { label: 'الطلبات المسجّلة', value: formatNumber(summary.count) },
    { label: 'إجمالي المبيعات التجريبية', value: formatPrice(summary.revenue, company.currencyLabel) },
    { label: 'الوحدات المباعة', value: formatNumber(summary.units) },
    { label: 'متوسط الطلب', value: formatPrice(summary.average, company.currencyLabel) },
    { label: 'مبيعات آخر ٧ أيام', value: formatPrice(summary.last7Revenue, company.currencyLabel) },
    { label: 'طلبات آخر ٧ أيام', value: formatNumber(summary.last7Count) },
  ]

  const statusCounts = DASHBOARD_STATUSES.map((key) => ({
    key,
    label: ORDER_STATUS_LABELS[key],
    count: summary.byStatus[key] ?? 0,
  }))
  const maxStatus = Math.max(1, ...statusCounts.map((row) => row.count))

  const alerts = [
    {
      icon: PackageX,
      title: 'أصناف نفد مخزونها',
      detail: health.outOfStock.map((product) => product.name).join('، ') || '—',
      count: health.outOfStock.length,
      tabId: 'products',
      tone: 'danger',
    },
    {
      icon: AlertTriangle,
      title: 'مخزون واطئ (١٠٠ وحدة أو أقل)',
      detail: health.lowStock.map((product) => `${product.name} (${formatNumber(product.stock)})`).join('، ') || '—',
      count: health.lowStock.length,
      tabId: 'products',
      tone: 'warn',
    },
    {
      icon: ClipboardCheck,
      title: 'عدّ مسجَّل بانتظار الاعتماد',
      detail:
        pendingCounts
          .map((product) => {
            const entry = counts[product.id]
            const diff = diffFor(product, entry)
            const gap = diff ? `، فارق ${diff > 0 ? '+' : '−'}${formatNumber(Math.abs(diff))}` : ''
            return `${product.name} (${formatNumber(entry.count)}${gap})`
          })
          .join('، ') || '—',
      count: pendingCounts.length,
      tabId: 'products',
      tone: 'info',
    },
    {
      icon: Percent,
      title: 'أصناف بلا سعر جملة',
      detail: health.noWholesale.map((product) => product.name).join('، ') || '—',
      count: health.noWholesale.length,
      tabId: 'pricing',
      tone: 'info',
    },
    {
      icon: Users,
      title: 'طلبات بانتظار التأكيد',
      detail: 'تحتاج تأكيد أو رفض من تبويب الطلبات.',
      count: summary.byStatus.created ?? 0,
      tabId: 'orders',
      tone: 'warn',
    },
  ]

  return (
    <>
      <section className='kpi-grid' aria-label='مؤشرات المبيعات'>
        {kpis.map((kpi) => (
          <div key={kpi.label} className='card kpi'>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
          </div>
        ))}
      </section>

      <div className='dash-columns'>
        <section className='card dash-card' aria-label='حالات الطلبات'>
          <h2>
            <TrendingUp size={18} aria-hidden='true' /> توزيع الطلبات على المراحل
          </h2>
          <ul className='dash-bars'>
            {statusCounts.map((row) => (
              <li key={row.key}>
                <span className='dash-bars__label'>{row.label}</span>
                <span className='dash-bars__track'>
                  <span
                    className='dash-bars__fill'
                    style={{ '--pct': `${Math.round((row.count / maxStatus) * 100)}%` }}
                  />
                </span>
                <span className='dash-bars__value'>{formatNumber(row.count)}</span>
              </li>
            ))}
          </ul>

          {summary.topAreas.length ? (
            <>
              <h3 className='dash-card__sub'>أكثر المحافظات طلبًا</h3>
              <ul className='dash-inline-list'>
                {summary.topAreas.map((row) => (
                  <li key={row.area}>
                    {row.area} <span>{formatNumber(row.count)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section className='card dash-card' aria-label='حالة المخزن'>
          <h2>
            <Boxes size={18} aria-hidden='true' /> حالة الكتالوج
          </h2>
          <dl className='dash-facts'>
            <div>
              <dt>أصناف معروضة</dt>
              <dd>{formatNumber(health.total)}</dd>
            </div>
            <div>
              <dt>أقسام نشطة</dt>
              <dd>{formatNumber(health.byCategory.filter((row) => row.count).length)}</dd>
            </div>
            <div>
              <dt>أصناف أضفتها اللوحة</dt>
              <dd>{formatNumber(health.custom.length)}</dd>
            </div>
            <div>
              <dt>معدَّل من البيانات الأصلية</dt>
              <dd>{formatNumber(overrides.edited)}</dd>
            </div>
            <div>
              <dt>مخفي من العرض</dt>
              <dd>{formatNumber(overrides.removed)}</dd>
            </div>
            <div>
              <dt>أصناف عليها عدّ مسجَّل</dt>
              <dd>{formatNumber(countsSummary(products, counts).recorded)}</dd>
            </div>
          </dl>

          <p className='notice notice--inline u-mt-2'>
            أرقام المخزون تُقرأ من <code>src/data/products.js</code> ومن تعديلاتك في اللوحة، ولا تُخصم
            منها الطلبات المسجّلة: هي مؤشرات للعرض والتنبيه فقط. الجرد الفعلي تسجّله في عمود «العدّ»
            بتبويب المنتجات، ولا يكتب في المخزون إلا بعد اعتمادك.
          </p>

          <h3 className='dash-card__sub'>عدد الأصناف لكل قسم</h3>
          <ul className='dash-inline-list'>
            {health.byCategory
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((row) => (
                <li key={row.categoryId}>
                  {categoryPathLabel(row.categoryId)}{' '}
                  <span>{formatNumber(row.count)}</span>
                </li>
              ))}
          </ul>
        </section>
      </div>

      <section className='card dash-card' aria-label='تنبيهات تحتاج إجراء'>
        <h2>
          <AlertTriangle size={18} aria-hidden='true' /> تنبيهات
        </h2>
        {alerts.some((alert) => alert.count) ? (
          <>
            <p className='section__subtitle'>
              التنبيهات مبنية على أرقام المخزون والأسعار في الكتالوج الحالي، لا على الكميات المحجوزة في
              الطلبات.
            </p>
            <ul className='dash-alerts'>
              {alerts.map((alert) => (
                <AlertRow key={alert.title} {...alert} onGoToTab={onGoToTab} />
              ))}
            </ul>
          </>
        ) : (
          <p className='section__subtitle u-mt-2'>
            لا تنبيهات الآن: كل الأصناف متوفرة وبها مخزون كافٍ وأسعار جملة محددة، ولا عدّ بانتظار
            الاعتماد.
          </p>
        )}
      </section>

      <div className='btn-row u-mt-4'>
        <Link to='/products' className='btn btn--primary'>
          <Store size={16} aria-hidden='true' /> عرض المتجر كما يراه العميل
        </Link>
        <button type='button' className='btn btn--ghost' onClick={() => onGoToTab('products')}>
          إدارة المنتجات
        </button>
      </div>

      <p className='notice u-mt-4'>
        المؤشرات تُحسب من الطلبات التجريبية ومن الطلبات المسجّلة في هذا المتصفح، وبأسعار تجريبية غير
        معتمدة من الشركة. لا يوجد خادم ولا مبيعات فعلية هنا.
      </p>
    </>
  )
}
