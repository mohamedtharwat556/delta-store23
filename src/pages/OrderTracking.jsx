import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleAlert, FileText, PackageSearch, RotateCcw, Search, Truck } from 'lucide-react'
import { company } from '../data/company.js'
import { ORDER_FLOW, ORDER_STATUS_LABELS, demoOrders } from '../data/orders.js'
import { getProductById } from '../utils/catalogStore.js'
import { BASIS_LABELS } from '../utils/pricing.js'
import { payableOf } from '../utils/delivery.js'
import { isValidPhone, normalizePhone, ordersForPhone } from '../utils/checkout.js'
import { formatDateTime, formatPrice } from '../utils/format.js'
import { useCart } from '../hooks/useCart.js'
import { useOrders } from '../hooks/useOrders.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

function OrderDetail({ order }) {
  const { addMany } = useCart()

  return (
    <section className='tracking-result' aria-label={`تفاصيل الطلب ${order.orderNumber}`}>
      <div className='tracking-result__head card'>
        <div>
          <h2>طلب {order.orderNumber}</h2>
          <p className='section__subtitle'>
            {order.customerLabel} · {order.area} · {order.placedAt ? formatDateTime(order.placedAt) : '—'}
          </p>
          {order.phone ? <p className='section__subtitle'>{order.phone}</p> : null}
          <span className='chip chip--category'>
            {order.channel === 'wholesale' ? 'بيع بالجملة' : 'بيع قطاعي'}
          </span>{' '}
          <span className={`chip chip--${order.source === 'local' ? 'retail' : 'wholesale'}`}>
            {order.source === 'local' ? 'مسجّل من هذا المتصفح' : 'بيانات تجريبية'}
          </span>
        </div>
        <strong className='tracking-result__status'>
          <Truck size={16} aria-hidden='true' />
          {ORDER_STATUS_LABELS[order.currentStatus]}
        </strong>
      </div>

      {order.currentStatus === 'cancelled' ? (
        <div className='checkout-blocked'>
          <CircleAlert size={16} aria-hidden='true' />
          أُلغي هذا الطلب من لوحة التحكم، ولم يعد في مسار التسليم.
        </div>
      ) : (
        <ol className='timeline'>
          {ORDER_FLOW.map((status, step) => {
            const update = order.updates.find((row) => row.status === status)
            const reached = Boolean(update)
            const isCurrent = order.currentStatus === status
            return (
              <li
                key={status}
                className={`timeline__step${reached ? ' is-reached' : ''}${isCurrent ? ' is-current' : ''}`}
                style={{ '--i': step }}
              >
                <span className='timeline__dot' aria-hidden='true' />
                <div>
                  <h3>{ORDER_STATUS_LABELS[status]}</h3>
                  <p>{update ? update.note : 'لم يصل الطلب إلى هذه المرحلة بعد'}</p>
                  {update ? <time>{formatDateTime(update.at)}</time> : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <div className='tracking-items card'>
        <h3>أصناف الطلب</h3>
        <ul className='checkout-lines__list'>
          {order.items.map((item) => {
            const product = getProductById(item.productId)
            return (
              <li key={item.productId}>
                <span>
                  {product?.name ?? item.productId} — {item.quantity} {product?.unit ?? 'وحدة'}
                  <em className='tracking-items__basis'>{BASIS_LABELS[item.basis] ?? ''}</em>
                </span>
                <strong>{formatPrice(item.unitPrice * item.quantity, company.currencyLabel)}</strong>
              </li>
            )
          })}
        </ul>
        <p className='tracking-total'>
          <span>{order.delivery ? `المبلغ المطلوب — ${order.delivery.label}` : 'الإجمالي'}</span>
          <strong>{formatPrice(payableOf(order).total, company.currencyLabel)}</strong>
        </p>
      </div>

      <div className='btn-row'>
        <Link to={`/invoice/${order.orderNumber}`} className='btn btn--primary'>
          <FileText size={17} aria-hidden='true' /> فاتورة للطباعة
        </Link>
        <button
          type='button'
          className='btn btn--ghost'
          onClick={() =>
            addMany(order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })))
          }
        >
          <RotateCcw size={17} aria-hidden='true' /> إعادة الطلب إلى السلة
        </button>
        <Link to='/dashboard' className='btn btn--ghost'>
          فتح لوحة التحكم
        </Link>
        <Link to='/track' className='btn btn--ghost'>
          بحث برقم آخر
        </Link>
      </div>

      <p className='notice'>
        حالة الطلب تأتي من نفس المخزن الذي تعرضه لوحة التحكم؛ تغييرها من اللوحة ينعكس هنا. بعد
        اعتماد نظام طلبات حقيقي تُستبدل بيانات <code>src/data/orders.js</code> بنتائج من الخادم.
      </p>
    </section>
  )
}

export default function OrderTracking() {
  const [searchParams, setSearchParams] = useSearchParams()
  const linkedNumber = searchParams.get('number') ?? ''
  const { orders, findOrder } = useOrders()
  usePageTitle('تتبع الطلب')

  const [phone, setPhone] = useState('')
  const [submittedPhone, setSubmittedPhone] = useState('')

  const focusedOrder = linkedNumber ? findOrder(linkedNumber) : null

  const matches = useMemo(() => ordersForPhone(orders, submittedPhone), [orders, submittedPhone])

  // رقم تليفون لطلب واحد ⇒ تفاصيله مباشرة، وأكثر من طلب ⇒ قائمة تختار منها
  const shownOrder = focusedOrder ?? (matches.length === 1 ? matches[0] : null)
  const showList = !focusedOrder && matches.length > 1
  const notFound = !focusedOrder && isValidPhone(submittedPhone) && matches.length === 0

  const submit = (value) => {
    const query = (value ?? phone).trim()
    setPhone(query)
    setSubmittedPhone(query)
    setSearchParams({})
  }

  const openOrder = (orderNumber) => setSearchParams({ number: orderNumber })

  return (
    <>
      <header className='page-header'>
        <h1>تتبع الطلب</h1>
        <p className='section__subtitle'>
          ابحث برقم الهاتف الذي سُجّل به الطلب. الطلبات المُولّدة من إتمام الطلب تُقرأ من متصفحك، وبقية
          الأرقام محفوظة في ملف البيانات — لا يوجد خادم.
        </p>
      </header>

      <section className='card tracking-search'>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label className='field-label' htmlFor='track-phone'>
            <PackageSearch size={16} aria-hidden='true' /> رقم التليفون
          </label>
          <div className='tracking-search__row'>
            <input
              id='track-phone'
              className='field'
              type='tel'
              inputMode='numeric'
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder='مثال: 01012345678'
              autoComplete='tel'
            />
            <button type='submit' className='btn btn--primary'>
              <Search size={17} aria-hidden='true' /> تتبّع
            </button>
          </div>
          <p className='tracking-search__hint'>
            11 رقمًا تكفي، والمسافات والشرطات لا تفرق. لو كان على الرقم أكثر من طلب تظهر قائمة لتختار
            منها.
          </p>
        </form>

        <div className='tracking-samples'>
          <span className='field-label'>أرقام تجريبية جاهزة</span>
          <div className='filter-bar'>
            {demoOrders.map((demo) => (
              <button
                key={demo.orderNumber}
                type='button'
                className='chip chip--filter'
                onClick={() => submit(demo.phone)}
              >
                {demo.phone} · {demo.customerLabel.replace('عميل تجريبي — ', '')}
              </button>
            ))}
          </div>
        </div>
      </section>

      {notFound ? (
        <div className='error-state' role='alert'>
          <CircleAlert size={18} aria-hidden='true' />
          <div>
            <h2>لا يوجد طلب بهذا الرقم</h2>
            <p>
              تأكد من رقم الهاتف أو استخدم أحد الأرقام التجريبية أعلاه. الطلبات المسجّلة من صفحة إتمام
              الطلب تُحفظ في هذا المتصفح فقط، وتختفي إذا مُسحت بياناته.
            </p>
          </div>
        </div>
      ) : null}

      {showList ? (
        <section className='tracking-results' aria-label='طلبات مسجّلة على رقم الهاتف'>
          <h2 className='tracking-results__title'>
            {matches.length} طلبات على الرقم {normalizePhone(submittedPhone)}
          </h2>
          <ul className='tracking-results__list'>
            {matches.map((order, index) => {
              const payable = payableOf(order)
              return (
                <li key={order.orderNumber} className='card tracking-result__head' style={{ '--i': index }}>
                  <div>
                    <h3>طلب {order.orderNumber}</h3>
                    <p className='section__subtitle'>
                      {order.customerLabel} · {order.area} ·{' '}
                      {order.placedAt ? formatDateTime(order.placedAt) : '—'}
                    </p>
                    <span className={`chip chip--${order.source === 'local' ? 'retail' : 'category'}`}>
                      {order.source === 'local' ? 'مسجّل من هذا المتصفح' : 'بيانات تجريبية'}
                    </span>
                  </div>
                  <div className='tracking-results__side'>
                    <strong className='tracking-result__status'>
                      <Truck size={16} aria-hidden='true' />
                      {ORDER_STATUS_LABELS[order.currentStatus]}
                    </strong>
                    <span className='tracking-results__total'>
                      {formatPrice(payable.total, company.currencyLabel)}
                    </span>
                    <button type='button' className='btn btn--primary btn--sm' onClick={() => openOrder(order.orderNumber)}>
                      عرض المراحل
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {shownOrder ? <OrderDetail order={shownOrder} /> : null}

      {!shownOrder && !showList && !notFound ? (
        <p className='section__subtitle u-mt-4'>
          أدخل رقم التليفون أو اختر رقمًا تجريبيًا لعرض المراحل.{' '}
          <Link to='/products'>العودة إلى المنتجات</Link>
        </p>
      ) : null}
    </>
  )
}
