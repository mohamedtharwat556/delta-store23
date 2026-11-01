import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, ClipboardList, Download, FileText, RotateCcw, Search, Trash2, Truck } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import { BASIS_LABELS, orderTotals } from '../../utils/pricing.js'
import { payableOf } from '../../utils/delivery.js'
import { buildCsv, downloadTextFile } from '../../utils/csv.js'
import { DASHBOARD_STATUSES, ORDER_STATUS_LABELS } from '../../data/orders.js'
import { getProductById } from '../../utils/catalogStore.js'
import { company } from '../../data/company.js'
import { formatDateTime, formatNumber, formatPrice } from '../../utils/format.js'
import { buildHaystack, matchesAllTokens, tokenizeQuery } from '../../utils/arabic.js'
import { useCart } from '../../hooks/useCart.js'

const SORT_OPTIONS = [
  { id: 'newest', label: 'الأحدث أولًا' },
  { id: 'oldest', label: 'الأقدم أولًا' },
  { id: 'highest', label: 'الأعلى قيمة' },
]

function matchesTerm(order, term) {
  const tokens = tokenizeQuery(term)
  if (!tokens.length) return true
  const haystack = buildHaystack([
    order.orderNumber,
    order.customerLabel,
    order.area,
    order.address,
    order.phone,
  ])
  return matchesAllTokens(haystack, tokens)
}

export default function OrdersPanel({ orders, setOrderStatus, clearLocalOrders }) {
  const { addMany } = useCart()
  const [term, setTerm] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [expanded, setExpanded] = useState(null)
  const [confirmingClear, setConfirmingClear] = useState(false)

  const localCount = orders.filter((order) => order.source === 'local').length

  const rows = useMemo(() => {
    const filtered = orders.filter(
      (order) => matchesTerm(order, term.trim()) && (!status || order.currentStatus === status)
    )
    const sorted = [...filtered]
    if (sort === 'newest') sorted.sort((a, b) => String(b.placedAt).localeCompare(String(a.placedAt)))
    if (sort === 'oldest') sorted.sort((a, b) => String(a.placedAt).localeCompare(String(b.placedAt)))
    if (sort === 'highest') sorted.sort((a, b) => orderTotals(b).total - orderTotals(a).total)
    return sorted
  }, [orders, term, status, sort])

  const hasFilters = Boolean(term.trim()) || Boolean(status) || sort !== 'newest'

  const resetFilters = () => {
    setTerm('')
    setStatus('')
    setSort('newest')
  }

  // التصدير يطابق ما يظهر على الشاشة بعد البحث والتصفية والترتيب
  const exportRows = () => {
    const headers = [
      'رقم الطلب',
      'المصدر',
      'العميل',
      'المحافظة',
      'العنوان التفصيلي',
      'الهاتف',
      'نوع البيع',
      'التاريخ',
      'عدد الأصناف',
      'الوحدات',
      'إجمالي الأصناف',
      'التوصيل',
      'المبلغ المطلوب',
      'الحالة',
      'ملاحظات',
    ]
    const data = rows.map((order) => {
      const totals = orderTotals(order)
      const payable = payableOf(order)
      return [
        order.orderNumber,
        order.source === 'local' ? 'محلي' : 'تجريبي',
        order.customerLabel,
        order.area,
        order.address ?? '',
        order.phone,
        order.channel === 'wholesale' ? 'جملة' : 'قطاعي',
        order.placedAt ?? '',
        order.items.length,
        totals.units,
        payable.subtotal,
        payable.deliveryAmount,
        payable.total,
        ORDER_STATUS_LABELS[order.currentStatus] ?? order.currentStatus,
        order.notes,
      ]
    })
    downloadTextFile(
      `delta-store-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsv(headers, data)
    )
  }

  return (
    <>
      <section className='card dashboard-filters' aria-label='تصفية الطلبات'>
        <div className='dashboard-search'>
          <label className='field-label' htmlFor='dashboard-search'>
            <Search size={16} aria-hidden='true' /> بحث برقم الطلب أو العميل أو المحافظة أو الهاتف
          </label>
          <input
            id='dashboard-search'
            className='field'
            type='search'
            value={term}
            placeholder='مثال: DL-2604 أو محل النور'
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>

        <fieldset className='filter-panel__group'>
          <legend className='field-label'>الحالة</legend>
          <div className='filter-bar'>
            <button
              type='button'
              className={`chip chip--filter${!status ? ' is-active' : ''}`}
              onClick={() => setStatus('')}
              aria-pressed={!status}
            >
              الكل ({orders.length})
            </button>
            {DASHBOARD_STATUSES.map((key) => {
              const count = orders.filter((order) => order.currentStatus === key).length
              return (
                <button
                  key={key}
                  type='button'
                  className={`chip chip--filter${key === status ? ' is-active' : ''}`}
                  onClick={() => setStatus(key === status ? '' : key)}
                  aria-pressed={key === status}
                >
                  {ORDER_STATUS_LABELS[key]} ({count})
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className='filter-panel__foot'>
          <div className='filter-panel__sort'>
            <label className='field-label' htmlFor='dashboard-sort'>
              الترتيب
            </label>
            <select
              id='dashboard-sort'
              className='field field--select'
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className='btn-row'>
            {hasFilters ? (
              <button type='button' className='btn btn--ghost btn--sm' onClick={resetFilters}>
                إزالة الفلاتر
              </button>
            ) : null}

            <button
              type='button'
              className='btn btn--ghost btn--sm'
              onClick={exportRows}
              disabled={rows.length === 0}
            >
              <Download size={15} aria-hidden='true' /> تصدير CSV ({rows.length})
            </button>

            {confirmingClear ? (
              <span className='btn-row'>
                <button
                  type='button'
                  className='btn btn--danger btn--sm'
                  onClick={() => {
                    clearLocalOrders()
                    setConfirmingClear(false)
                  }}
                >
                  تأكيد مسح الطلبات المحلية
                </button>
                <button
                  type='button'
                  className='btn btn--ghost btn--sm'
                  onClick={() => setConfirmingClear(false)}
                >
                  إلغاء
                </button>
              </span>
            ) : (
              <button
                type='button'
                className='btn btn--ghost btn--danger-ghost btn--sm'
                onClick={() => setConfirmingClear(true)}
                disabled={localCount === 0}
              >
                <Trash2 size={15} aria-hidden='true' /> مسح الطلبات المحلية ({localCount})
              </button>
            )}
          </div>
        </div>
      </section>

      {rows.length ? (
        <div className='table-scroll table-scroll--orders'>
          <table className='dashboard-table orders-table dash-fit-table'>
            <caption className='visually-hidden'>قائمة الطلبات وحالاتها</caption>
            <colgroup>
              <col className='col-number' />
              <col className='col-customer' />
              <col className='col-channel' />
              <col className='col-date' />
              <col className='col-items' />
              <col className='col-payable' />
              <col className='col-status' />
              <col className='col-actions' />
            </colgroup>
            <thead>
              <tr>
                <th scope='col'>رقم الطلب</th>
                <th scope='col'>العميل</th>
                <th scope='col'>النوع</th>
                <th scope='col'>التاريخ</th>
                <th scope='col'>الأصناف/الوحدات</th>
                <th scope='col'>المبلغ المطلوب</th>
                <th scope='col'>الحالة</th>
                <th scope='col'>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => {
                const totals = orderTotals(order)
                const payable = payableOf(order)
                const isOpen = expanded === order.orderNumber
                return (
                  // المفتاح يشمل الحالة: إعادة تركيب الصف هي ما يشغّل وميض motion.css بعد تغيير الحالة
                  <Fragment key={`${order.orderNumber}-${order.currentStatus}`}>
                    <tr>
                      <th scope='row'>
                        <span className='dashboard-number'>
                          {order.orderNumber}
                          {order.source === 'local' ? (
                            <span className='chip chip--retail'>محلي</span>
                          ) : (
                            <span className='chip chip--category'>تجريبي</span>
                          )}
                        </span>
                      </th>
                      <td data-label='العميل'>
                        {order.customerLabel}
                        <span className='dashboard-sub'>{order.area}</span>
                        {order.address ? <span className='dashboard-sub'>{order.address}</span> : null}
                        {order.phone ? <span className='dashboard-sub'>{order.phone}</span> : null}
                      </td>
                      <td data-label='النوع'>{order.channel === 'wholesale' ? 'جملة' : 'قطاعي'}</td>
                      <td data-label='التاريخ'>{order.placedAt ? formatDateTime(order.placedAt) : '—'}</td>
                      <td data-label='الأصناف/الوحدات'>
                        {order.items.length} صنف · {formatNumber(totals.units)} وحدة
                      </td>
                      <td data-label='المبلغ المطلوب'>
                        {formatPrice(payable.total, company.currencyLabel)}
                        {order.delivery ? (
                          <span className='dashboard-sub'>
                            بضاعة {formatPrice(payable.subtotal, company.currencyLabel)} + توصيل{' '}
                            {order.delivery.amount > 0
                              ? formatPrice(order.delivery.amount, company.currencyLabel)
                              : 'بلا مقابل'}
                          </span>
                        ) : null}
                      </td>
                      <td data-label='الحالة'>
                        <label className='visually-hidden' htmlFor={`status-${order.orderNumber}`}>
                          حالة الطلب {order.orderNumber}
                        </label>
                        <select
                          id={`status-${order.orderNumber}`}
                          className='field field--select dashboard-status'
                          value={order.currentStatus}
                          onChange={(event) => setOrderStatus(order.orderNumber, event.target.value)}
                        >
                          {DASHBOARD_STATUSES.map((key) => (
                            <option key={key} value={key}>
                              {ORDER_STATUS_LABELS[key]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label='إجراء'>
                        <div className='btn-row orders-actions'>
                          <button
                            type='button'
                            className='btn btn--ghost btn--sm'
                            aria-expanded={isOpen}
                            aria-label='الأصناف'
                            title='عرض أصناف الطلب'
                            onClick={() => setExpanded(isOpen ? null : order.orderNumber)}
                          >
                            {isOpen ? (
                              <ChevronUp size={15} aria-hidden='true' />
                            ) : (
                              <ChevronDown size={15} aria-hidden='true' />
                            )}
                            <span className='btn__text'>الأصناف</span>
                          </button>
                          <Link
                            to={`/track?number=${order.orderNumber}`}
                            className='btn btn--ghost btn--sm'
                            aria-label='تتبع'
                            title='تتبع الطلب'
                          >
                            <Truck size={15} aria-hidden='true' />
                            <span className='btn__text'>تتبع</span>
                          </Link>
                          <Link
                            to={`/invoice/${order.orderNumber}`}
                            className='btn btn--ghost btn--sm'
                            aria-label='فاتورة'
                            title='فاتورة للطباعة'
                          >
                            <FileText size={15} aria-hidden='true' />
                            <span className='btn__text'>فاتورة</span>
                          </Link>
                          <Link
                            to={`/pick/${order.orderNumber}`}
                            className='btn btn--ghost btn--sm'
                            aria-label='تجهيز'
                            title='ورقة تجهيز بدون أسعار'
                          >
                            <ClipboardList size={15} aria-hidden='true' />
                            <span className='btn__text'>تجهيز</span>
                          </Link>
                          <button
                            type='button'
                            className='btn btn--ghost btn--sm'
                            aria-label='إعادة الطلب'
                            title='أضف أصناف الطلب إلى السلة'
                            onClick={() =>
                              addMany(
                                order.items.map((item) => ({
                                  productId: item.productId,
                                  quantity: item.quantity,
                                }))
                              )
                            }
                          >
                            <RotateCcw size={15} aria-hidden='true' />
                            <span className='btn__text'>إعادة الطلب</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className='dashboard-detail'>
                        <td colSpan={8}>
                          <ul className='dashboard-items'>
                            {order.items.map((item) => {
                              const product = getProductById(item.productId)
                              return (
                                <li key={item.productId}>
                                  <span>
                                    {product?.name ?? item.productId} — {item.quantity}{' '}
                                    {product?.unit ?? 'وحدة'}
                                    <em>{BASIS_LABELS[item.basis] ?? ''}</em>
                                  </span>
                                  <strong>
                                    {formatPrice(item.unitPrice * item.quantity, company.currencyLabel)}
                                  </strong>
                                </li>
                              )
                            })}
                          </ul>
                          {order.notes ? <p className='dashboard-notes'>ملاحظات: {order.notes}</p> : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title='لا طلبات مطابقة'
          hint='غيّر كلمة البحث أو الحالة، أو سجّل طلبًا جديدًا من صفحة إتمام الطلب.'
          action={
            hasFilters ? (
              <button type='button' className='btn btn--primary' onClick={resetFilters}>
                إزالة الفلاتر
              </button>
            ) : (
              <Link to='/products' className='btn btn--primary'>
                تصفّح المنتجات
              </Link>
            )
          }
        />
      )}

      <p className='notice u-mt-4'>
        الطلبات هنا تأتي من <code>src/data/orders.js</code> التجريبية ومن الطلبات المسجّلة في هذا
        المتصفح فقط. تغيير الحالة يُحدِّث صفحة التتبع نفسها، ولا يوجد خادم ولا بيانات عملاء حقيقية.
        تسجيل الطلب لا ينقص المخزون: أرقام الأصناف في تبويب المنتجات تبقى كما هي إلى أن تجردها بنفسك.
      </p>
    </>
  )
}
