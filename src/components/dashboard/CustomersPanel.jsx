import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, FileText, Phone, Search, Truck, Users } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import { company } from '../../data/company.js'
import { customerGroups, ordersForCustomer } from '../../utils/analytics.js'
import { buildHaystack, matchesAllTokens, tokenizeQuery } from '../../utils/arabic.js'
import { formatDateTime, formatNumber, formatPrice } from '../../utils/format.js'

const SORTS = [
  { id: 'revenue', label: 'الأعلى إنفاقًا' },
  { id: 'orders', label: 'الأكثر طلبًا' },
  { id: 'recent', label: 'الأحدث تواصلًا' },
]

// حقول التواصل التي لم تعتمدها الشركة بعد — تُعرض كقائمة عمل، لا كبيانات ناقصة خفية
const CONTACT_SLOTS = [
  { key: 'phone', label: 'رقم الهاتف' },
  { key: 'whatsapp', label: 'واتساب المبيعات' },
  { key: 'email', label: 'البريد الإلكتروني' },
  { key: 'hours', label: 'مواعيد العمل' },
]

export default function CustomersPanel({ orders }) {
  const groups = useMemo(() => customerGroups(orders), [orders])
  const [term, setTerm] = useState('')
  const [sort, setSort] = useState('revenue')
  const [onlyLocal, setOnlyLocal] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const rows = useMemo(() => {
    const tokens = tokenizeQuery(term.trim())
    const filtered = groups.filter((group) => {
      if (onlyLocal && !group.local) return false
      if (!tokens.length) return true
      return matchesAllTokens(buildHaystack([group.label, group.phone, ...group.areas]), tokens)
    })
    const sorted = [...filtered]
    if (sort === 'revenue') sorted.sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
    if (sort === 'orders') sorted.sort((a, b) => b.orders - a.orders || b.revenue - a.revenue)
    if (sort === 'recent')
      sorted.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0) || b.revenue - a.revenue)
    return sorted
  }, [groups, term, sort, onlyLocal])

  const totals = useMemo(
    () => ({
      customers: groups.length,
      withPhone: groups.filter((group) => group.phone).length,
      local: groups.filter((group) => group.local).length,
      repeat: groups.filter((group) => group.orders > 1).length,
    }),
    [groups]
  )

  const pendingContact = CONTACT_SLOTS.filter((slot) => !company.contact[slot.key])

  const hasFilters = Boolean(term.trim()) || onlyLocal || sort !== 'revenue'

  return (
    <>
      <section className='kpi-grid kpi-grid--four' aria-label='مؤشرات العملاء'>
        <div className='card kpi'>
          <span>عملاء مسجّلون</span>
          <strong>{formatNumber(totals.customers)}</strong>
        </div>
        <div className='card kpi'>
          <span>برقم تواصل</span>
          <strong>
            {formatNumber(totals.withPhone)} من {formatNumber(totals.customers)}
          </strong>
        </div>
        <div className='card kpi'>
          <span>عملاء متكررون</span>
          <strong>{formatNumber(totals.repeat)}</strong>
        </div>
        <div className='card kpi'>
          <span>عملاء من هذا المتصفح</span>
          <strong>{formatNumber(totals.local)}</strong>
        </div>
      </section>

      <section className='card dashboard-filters' aria-label='تصفية العملاء'>
        <div className='dashboard-search'>
          <label className='field-label' htmlFor='customers-search'>
            <Search size={16} aria-hidden='true' /> بحث بالاسم أو رقم الهاتف أو المحافظة
          </label>
          <input
            id='customers-search'
            className='field'
            type='search'
            value={term}
            placeholder='مثال: النور أو ٠١٠٩٩٩٩٩٩٨٨'
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>

        <div className='filter-panel__foot'>
          <div className='filter-panel__sort'>
            <label className='field-label' htmlFor='customers-sort'>
              الترتيب
            </label>
            <select
              id='customers-sort'
              className='field field--select'
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              {SORTS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type='button'
            className={`chip chip--filter${onlyLocal ? ' is-active' : ''}`}
            onClick={() => setOnlyLocal((value) => !value)}
            aria-pressed={onlyLocal}
          >
            المسجَّل في هذا المتصفح فقط
          </button>

          {hasFilters ? (
            <button
              type='button'
              className='btn btn--ghost btn--sm'
              onClick={() => {
                setTerm('')
                setSort('revenue')
                setOnlyLocal(false)
              }}
            >
              إزالة الفلاتر
            </button>
          ) : null}
        </div>
      </section>

      {rows.length ? (
        <>
          <div className='table-scroll table-scroll--customers'>
            <table className='dashboard-table customers-table dash-fit-table'>
              <caption className='visually-hidden'>العملاء المجمّعون من الطلبات</caption>
              <colgroup>
                <col className='col-customer' />
                <col className='col-phone' />
                <col className='col-orders' />
                <col className='col-units' />
                <col className='col-revenue' />
                <col className='col-last' />
                <col className='col-toggle' />
              </colgroup>
              <thead>
                <tr>
                  <th scope='col'>العميل</th>
                  <th scope='col'>التواصل</th>
                  <th scope='col'>الطلبات</th>
                  <th scope='col'>الوحدات</th>
                  <th scope='col'>الإجمالي</th>
                  <th scope='col'>آخر طلب</th>
                  <th scope='col'>تفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((group) => {
                  const isOpen = expanded === group.key
                  return (
                    <tr key={group.key} className={isOpen ? 'is-open' : ''}>
                      <th scope='row'>
                        {group.label}
                        <span className='dashboard-sub'>{group.areas.join('، ')}</span>
                        {group.local ? <span className='chip chip--retail'>محلي</span> : null}
                      </th>
                      <td data-label='التواصل'>
                        {group.phone ? (
                          <span className='customers-phone'>
                            <Phone size={13} aria-hidden='true' /> {group.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td data-label='الطلبات'>{formatNumber(group.orders)}</td>
                      <td data-label='الوحدات'>{formatNumber(group.units)}</td>
                      <td data-label='الإجمالي'>{formatPrice(group.revenue, company.currencyLabel)}</td>
                      <td data-label='آخر طلب'>
                        {group.lastAt ? formatDateTime(new Date(group.lastAt).toISOString()) : '—'}
                      </td>
                      <td data-label='تفاصيل'>
                        <button
                          type='button'
                          className='btn btn--ghost btn--sm'
                          aria-expanded={isOpen}
                          aria-label={isOpen ? 'إخفاء طلبات العميل' : 'طلبات العميل'}
                          title='عرض طلبات هذا العميل'
                          onClick={() => setExpanded(isOpen ? null : group.key)}
                        >
                          {isOpen ? (
                            <ChevronUp size={15} aria-hidden='true' />
                          ) : (
                            <ChevronDown size={15} aria-hidden='true' />
                          )}
                          <span className='btn__text'>الطلبات</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {rows
            .filter((group) => expanded === group.key)
            .map((group) => (
              <section
                key={`detail-${group.key}`}
                className='card customers-detail'
                aria-label={`طلبات ${group.label}`}
              >
                <h3>{group.label}</h3>
                <ul className='customers-orders'>
                  {ordersForCustomer(orders, group).map((order) => (
                    <li key={order.orderNumber}>
                      <span className='customers-detail__number'>{order.orderNumber}</span>
                      <span>{order.placedAt ? formatDateTime(order.placedAt) : '—'}</span>
                      <span>{order.channel === 'wholesale' ? 'جملة' : 'قطاعي'}</span>
                      <span>{formatNumber(order.items.length)} صنف</span>
                      <span className='btn-row'>
                        <Link to={`/invoice/${order.orderNumber}`} className='btn btn--ghost btn--sm'>
                          <FileText size={14} aria-hidden='true' /> فاتورة
                        </Link>
                        <Link to={`/track?number=${order.orderNumber}`} className='btn btn--ghost btn--sm'>
                          <Truck size={14} aria-hidden='true' /> تتبع
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </>
      ) : (
        <EmptyState
          title='لا عملاء مطابقين'
          hint='غيّر كلمة البحث أو أزل الفلاتر. العملاء هنا تُجمَّع من الطلبات المسجّلة فقط.'
          action={
            <button
              type='button'
              className='btn btn--primary'
              onClick={() => {
                setTerm('')
                setOnlyLocal(false)
                setSort('revenue')
              }}
            >
              إزالة الفلاتر
            </button>
          }
        />
      )}

      <section className='card dash-card' aria-label='قنوات التواصل مع العملاء'>
        <h2>
          <Users size={18} aria-hidden='true' /> قنوات التواصل
        </h2>
        <p className='section__subtitle u-mt-2'>
          العنوان المعتمد: {company.contact.address}
        </p>
        {pendingContact.length ? (
          <ul className='dash-alerts'>
            {pendingContact.map((slot) => (
              <li key={slot.key} className='dash-alert dash-alert--info'>
                <span className='dash-alert__text'>
                  <strong>{slot.label}</strong>
                  <span>لم تعتمده الشركة بعد — يظهر في المتجر بعد الاعتماد فقط.</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className='section__subtitle u-mt-2'>كل قنوات التواصل معتمدة وظاهرة في صفحة التواصل.</p>
        )}
        <p className='notice notice--inline'>
          الأرقام المُجمَّعة هنا تأتي من حقول الطلب؛ الطلبات التجريبية في <code>src/data/orders.js</code>{' '}
          تحمل أرقامًا وهمية، والطلبات المحلية هي ما أدخلته أنت في هذا المتصفح.
        </p>
      </section>

      <p className='notice u-mt-4'>
        لا يوجد خادم ولا قاعدة عملاء: التجميع يحدث في المتصفح لحظة فتح التبويب، ولا تُحفظ بيانات عميل
        في ملف المشروع.
      </p>
    </>
  )
}
