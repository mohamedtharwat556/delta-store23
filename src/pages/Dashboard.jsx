import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BadgePercent, ClipboardList, LayoutDashboard, Package, Store, Truck, Users } from 'lucide-react'
import OverviewPanel from '../components/dashboard/OverviewPanel.jsx'
import OrdersPanel from '../components/dashboard/OrdersPanel.jsx'
import ProductsPanel from '../components/dashboard/ProductsPanel.jsx'
import PricingPanel from '../components/dashboard/PricingPanel.jsx'
import DeliveryPanel from '../components/dashboard/DeliveryPanel.jsx'
import CustomersPanel from '../components/dashboard/CustomersPanel.jsx'
import { company } from '../data/company.js'
import { useCatalog } from '../hooks/useCatalog.js'
import { useOrders } from '../hooks/useOrders.js'
import { catalogHealth, customerGroups } from '../utils/analytics.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'orders', label: 'الطلبات', icon: ClipboardList },
  { id: 'products', label: 'المنتجات', icon: Package },
  { id: 'pricing', label: 'تسعير الجملة', icon: BadgePercent },
  { id: 'delivery', label: 'التوصيل', icon: Truck },
  { id: 'customers', label: 'العملاء', icon: Users },
]

const DEFAULT_TAB = 'overview'

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { orders, setOrderStatus, clearLocalOrders } = useOrders()
  const products = useCatalog()
  usePageTitle('لوحة التحكم')

  const rawTab = searchParams.get('tab') ?? ''
  const tab = TABS.some((item) => item.id === rawTab) ? rawTab : DEFAULT_TAB

  const badges = useMemo(() => {
    const health = catalogHealth(products)
    return {
      overview: { count: health.outOfStock.length + health.lowStock.length + health.noWholesale.length, tone: 'alert' },
      orders: { count: orders.filter((order) => order.currentStatus === 'created').length, tone: 'warn' },
      products: { count: health.outOfStock.length, tone: 'alert' },
      pricing: { count: health.noWholesale.length, tone: 'info' },
      customers: { count: customerGroups(orders).length, tone: 'plain' },
    }
  }, [orders, products])

  const selectTab = (nextTab) => {
    const params = new URLSearchParams(searchParams)
    if (nextTab === DEFAULT_TAB) params.delete('tab')
    else params.set('tab', nextTab)
    setSearchParams(params)
  }

  const onTabListKeyDown = (event) => {
    const keys = { ArrowDown: 1, ArrowUp: -1, ArrowLeft: -1, ArrowRight: 1, Home: 'first', End: 'last' }
    const move = keys[event.key]
    if (!move) return
    event.preventDefault()
    const index = TABS.findIndex((item) => item.id === tab)
    let next = index
    if (move === 'first') next = 0
    else if (move === 'last') next = TABS.length - 1
    else next = (index + move + TABS.length) % TABS.length
    selectTab(TABS[next].id)
    document.getElementById(`tab-${TABS[next].id}`)?.focus()
  }

  return (
    <>
      <header className='page-header dashboard-header'>
        <div>
          <h1>لوحة التحكم — {company.nameAr}</h1>
          <p className='section__subtitle'>
            {company.legalName} · {company.contact.address}
          </p>
        </div>
        <Link to='/' className='btn btn--ghost btn--sm dashboard-header__back'>
          <Store size={15} aria-hidden='true' /> العودة إلى المتجر
        </Link>
      </header>

      <div className='dash-shell'>
        <div
          className='dash-side'
          role='tablist'
          aria-orientation='vertical'
          aria-label='أقسام لوحة التحكم'
          onKeyDown={onTabListKeyDown}
        >
          {TABS.map((item) => {
            const isActive = item.id === tab
            const badge = badges[item.id]
            return (
              <button
                key={item.id}
                type='button'
                role='tab'
                id={`tab-${item.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                className={`dash-tab${isActive ? ' is-active' : ''}`}
                onClick={() => selectTab(item.id)}
              >
                <item.icon size={16} aria-hidden='true' />
                <span className='dash-tab__label'>{item.label}</span>
                {badge?.count ? (
                  <span className={`dash-tab__count dash-tab__count--${badge.tone}`} aria-hidden='true'>
                    {badge.count}
                  </span>
                ) : null}
              </button>
            )
          })}

          <p className='dash-side__hint'>
            كل ما تغيّره هنا يبقى في متصفحك وحده — ملف المنتجات الأصلي كما هو حتى تعتمده الشركة.
          </p>
        </div>

        <section
          className='dash-panel'
          role='tabpanel'
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
        >
          {tab === 'overview' ? (
            <OverviewPanel orders={orders} onGoToTab={selectTab} />
          ) : null}
          {tab === 'orders' ? (
            <OrdersPanel
              orders={orders}
              setOrderStatus={setOrderStatus}
              clearLocalOrders={clearLocalOrders}
            />
          ) : null}
          {tab === 'products' ? <ProductsPanel /> : null}
          {tab === 'pricing' ? <PricingPanel /> : null}
          {tab === 'delivery' ? <DeliveryPanel /> : null}
          {tab === 'customers' ? <CustomersPanel orders={orders} /> : null}
        </section>
      </div>
    </>
  )
}
