import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CircleAlert, FileText, PackageCheck, MapPin, Phone, RotateCcw, ScrollText } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState.jsx'
import { BASIS_LABELS, orderTotals } from '../utils/pricing.js'
import { payableOf } from '../utils/delivery.js'
import { ORDER_STATUS_LABELS } from '../data/orders.js'
import { getProductById } from '../utils/catalogStore.js'
import { company } from '../data/company.js'
import { formatDateTime, formatPrice } from '../utils/format.js'
import { useCart } from '../hooks/useCart.js'
import { useOrders } from '../hooks/useOrders.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function OrderConfirmation() {
  const { number } = useParams()
  const { findOrder } = useOrders()
  const { addMany } = useCart()
  usePageTitle('تأكيد الطلب')
  const order = findOrder(number)

  if (!order) {
    return (
      <>
        <EmptyState
          icon={CircleAlert}
          title='لا يوجد طلب بهذا الرقم'
          hint='ربما مُسحت الطلبات المحلية من هذا المتصفح، أو أن الرقم غير صحيح.'
          action={
            <div className='btn-row'>
              <Link to='/dashboard' className='btn btn--primary'>
                لوحة التحكم
              </Link>
              <Link to='/products' className='btn btn--ghost'>
                متابعة التسوق
              </Link>
            </div>
          }
        />
      </>
    )
  }

  const totals = orderTotals(order)
  const payable = payableOf(order)

  return (
    <>
      <header className='page-header'>
        <h1>
          <PackageCheck size={26} aria-hidden='true' /> تم تسجيل طلبك
        </h1>
        <p className='section__subtitle'>
          احتفظ برقم الطلب لمتابعته. الطلب محفوظ محليًا على هذا المتصفح فقط.
        </p>
      </header>

      <div className='confirmation-layout'>
        <section className='card confirmation-main'>
          <div className='confirmation-number'>
            <span>رقم الطلب</span>
            <strong>{order.orderNumber}</strong>
            <span className='chip chip--category'>{ORDER_STATUS_LABELS[order.currentStatus]}</span>
          </div>

          <dl className='confirmation-meta'>
            <div>
              <dt>
                <ScrollText size={15} aria-hidden='true' /> العميل
              </dt>
              <dd>{order.customerLabel}</dd>
            </div>
            <div>
              <dt>
                <Phone size={15} aria-hidden='true' /> رقم التواصل
              </dt>
              <dd>{order.phone}</dd>
            </div>
            <div>
              <dt>
                <MapPin size={15} aria-hidden='true' /> المحافظة
              </dt>
              <dd>{order.area}</dd>
            </div>
            {order.address ? (
              <div>
                <dt>
                  <MapPin size={15} aria-hidden='true' /> العنوان التفصيلي
                </dt>
                <dd>{order.address}</dd>
              </div>
            ) : null}
            <div>
              <dt>تاريخ التسجيل</dt>
              <dd>{order.placedAt ? formatDateTime(order.placedAt) : '—'}</dd>
            </div>
          </dl>

          {order.notes ? (
            <p className='confirmation-notes'>
              <strong>ملاحظات:</strong> {order.notes}
            </p>
          ) : null}

          <ul className='confirmation-items'>
            {order.items.map((item) => {
              const product = getProductById(item.productId)
              return (
                <li key={item.productId}>
                  <span>
                    {product?.name ?? item.productId} — {item.quantity} {product?.unit ?? 'وحدة'}
                    <em>{BASIS_LABELS[item.basis] ?? ''}</em>
                  </span>
                  <strong>{formatPrice(item.unitPrice * item.quantity, company.currencyLabel)}</strong>
                </li>
              )
            })}
          </ul>

          <div className='confirmation-total'>
            <span>
              {order.delivery ? 'إجمالي الأصناف' : 'الإجمالي'} ({totals.units} وحدة ·{' '}
              {order.channel === 'wholesale' ? 'جملة' : 'قطاعي'})
            </span>
            <strong>{formatPrice(payable.subtotal, company.currencyLabel)}</strong>
          </div>

          {order.delivery ? (
            <>
              <div className='confirmation-total'>
                <span>{order.delivery.label}</span>
                <strong>
                  {order.delivery.amount > 0
                    ? formatPrice(order.delivery.amount, company.currencyLabel)
                    : 'بلا مقابل'}
                </strong>
              </div>
              <div className='confirmation-total confirmation-total--payable'>
                <span>المبلغ المطلوب</span>
                <strong>{formatPrice(payable.total, company.currencyLabel)}</strong>
              </div>
            </>
          ) : null}

          <div className='btn-row u-mt-4'>
            <Link to={`/track?number=${order.orderNumber}`} className='btn btn--primary btn--lg'>
              تتبّع هذا الطلب
              <ArrowLeft size={18} aria-hidden='true' />
            </Link>
            <Link to={`/invoice/${order.orderNumber}`} className='btn btn--ghost btn--lg'>
              <FileText size={18} aria-hidden='true' /> فاتورة للطباعة
            </Link>
            <button
              type='button'
              className='btn btn--ghost btn--lg'
              onClick={() =>
                addMany(order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })))
              }
            >
              <RotateCcw size={18} aria-hidden='true' /> إعادة الطلب
            </button>
            <Link to='/products' className='btn btn--ghost btn--lg'>
              متابعة التسوق
            </Link>
          </div>
        </section>

        <aside className='card confirmation-side'>
          <h2>ما الذي يحدث الآن؟</h2>
          <ul className='rule-list'>
            <li>طُبع رقم الطلب وحفظته ذاكرة المتصفح، ويمكن تعديله من لوحة التحكم.</li>
            <li>لم يصل الطلب إلى الشركة: لا يوجد خادم ولا قناة تواصل معتمدة بعد.</li>
            <li>بعد اعتماد رقم هاتف أو نموذج إرسال، تُربط هذه الخطوة بالشركة نفسها.</li>
          </ul>
          <Link to='/dashboard' className='btn btn--ghost btn--block u-mt-3'>
            فتح لوحة التحكم
          </Link>
        </aside>
      </div>
    </>
  )
}
