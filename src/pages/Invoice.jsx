import { Link, useParams } from 'react-router-dom'
import { CircleAlert, Printer, RotateCcw, Store } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState.jsx'
import { BASIS_LABELS, orderTotals } from '../utils/pricing.js'
import { payableOf } from '../utils/delivery.js'
import { ORDER_STATUS_LABELS } from '../data/orders.js'
import { getProductById } from '../utils/catalogStore.js'
import { company } from '../data/company.js'
import { describePack, formatDateTime, formatNumber, formatPrice } from '../utils/format.js'
import { useCart } from '../hooks/useCart.js'
import { useOrders } from '../hooks/useOrders.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function Invoice() {
  const { number } = useParams()
  const { findOrder } = useOrders()
  const { addMany } = useCart()
  const order = findOrder(number)
  usePageTitle(order ? `فاتورة ${order.orderNumber}` : 'الفاتورة')

  if (!order) {
    return (
      <EmptyState
        icon={CircleAlert}
        title='لا يمكن طباعة فاتورة لهذا الطلب'
        hint='الطلب غير موجود في ذاكرة هذا المتصفح، أو أن الرقم غير صحيح.'
        action={
          <div className='btn-row'>
            <Link to='/dashboard' className='btn btn--primary'>
              لوحة التحكم
            </Link>
            <Link to='/track' className='btn btn--ghost'>
              تتبع طلب
            </Link>
          </div>
        }
      />
    )
  }

  const totals = orderTotals(order)
  const payable = payableOf(order)
  const rows = order.items.map((item, index) => {
    const product = getProductById(item.productId)
    return {
      key: item.productId,
      index: index + 1,
      name: product?.name ?? item.productId,
      pack: product ? describePack(product) : '—',
      quantity: item.quantity,
      unit: product?.unit ?? 'وحدة',
      unitPrice: item.unitPrice,
      basis: BASIS_LABELS[item.basis] ?? 'قطاعي',
      lineTotal: Math.round(item.unitPrice * item.quantity * 100) / 100,
    }
  })

  return (
    <>
      <div className='invoice-actions no-print'>
        <button type='button' className='btn btn--primary' onClick={() => window.print()}>
          <Printer size={18} aria-hidden='true' /> طباعة أو حفظ PDF
        </button>
        <button
          type='button'
          className='btn btn--ghost'
          onClick={() => addMany(order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })))}
        >
          <RotateCcw size={18} aria-hidden='true' /> إعادة الطلب إلى السلة
        </button>
        <Link to={`/track?number=${order.orderNumber}`} className='btn btn--ghost'>
          تتبّع هذا الطلب
        </Link>
        <Link to='/dashboard' className='btn btn--ghost'>
          لوحة التحكم
        </Link>
      </div>

      <article className='invoice-sheet'>
        <header className='invoice-head'>
          <div className='invoice-brand'>
            <p className='invoice-brand__name'>
              <Store size={18} aria-hidden='true' /> {company.nameAr} — {company.name}
            </p>
            <p className='invoice-brand__legal'>{company.legalName}</p>
            <p className='invoice-brand__tagline'>{company.tagline}</p>
          </div>
          <div className='invoice-doc'>
            <h1>فاتورة طلب</h1>
            <dl>
              <div>
                <dt>رقم الفاتورة</dt>
                <dd>{order.orderNumber}</dd>
              </div>
              <div>
                <dt>تاريخ الطلب</dt>
                <dd>{order.placedAt ? formatDateTime(order.placedAt) : '—'}</dd>
              </div>
              <div>
                <dt>حالة الطلب</dt>
                <dd>{ORDER_STATUS_LABELS[order.currentStatus]}</dd>
              </div>
              <div>
                <dt>نوع البيع</dt>
                <dd>{order.channel === 'wholesale' ? 'جملة' : 'قطاعي'}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className='invoice-parties'>
          <div>
            <h2>العميل</h2>
            <p>{order.customerLabel}</p>
            <p>المحافظة: {order.area}</p>
            {order.address ? <p>العنوان: {order.address}</p> : null}
            {order.phone ? <p>هاتف: {order.phone}</p> : null}
          </div>
          <div>
            <h2>البائع</h2>
            <p>{company.legalName}</p>
            {company.contact.address ? <p>العنوان: {company.contact.address}</p> : null}
            <p className='invoice-muted'>
              الرقم الضريبي وهاتف التواصل لم يُعتمدا بعد، لذلك لا يظهران في هذه الفاتورة.
            </p>
          </div>
        </section>

        <div className='invoice-table-scroll table-scroll--invoice'>
          <table className='invoice-table dash-fit-table'>
            <caption className='visually-hidden'>أصناف الفاتورة</caption>
            <colgroup>
              <col className='col-idx' />
              <col className='col-name' />
              <col className='col-pack' />
              <col className='col-qty' />
              <col className='col-price' />
              <col className='col-basis' />
              <col className='col-total' />
            </colgroup>
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th scope='col'>الصنف</th>
                <th scope='col'>العبوة</th>
                <th scope='col'>الكمية</th>
                <th scope='col'>سعر الوحدة</th>
                <th scope='col'>الأساس</th>
                <th scope='col'>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td data-label='#'>{row.index}</td>
                  <td data-label='الصنف'>{row.name}</td>
                  <td data-label='العبوة'>{row.pack}</td>
                  <td data-label='الكمية'>
                    {formatNumber(row.quantity)} {row.unit}
                  </td>
                  <td data-label='سعر الوحدة'>
                    {formatPrice(row.unitPrice, company.currencyLabel)}
                  </td>
                  <td data-label='الأساس'>{row.basis}</td>
                  <td data-label='الإجمالي'>
                    {formatPrice(row.lineTotal, company.currencyLabel)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>إجمالي الأصناف</td>
                <td colSpan={2} data-label='الوحدات'>
                  {formatNumber(totals.units)} وحدة
                </td>
                <td data-label='الإجمالي'>
                  {formatPrice(payable.subtotal, company.currencyLabel)}
                </td>
              </tr>
              <tr>
                <td colSpan={6}>
                  {order.delivery ? order.delivery.label : 'التوصيل غير مسجَّل على هذا الطلب'}
                </td>
                <td>
                  {order.delivery
                    ? order.delivery.amount > 0
                      ? formatPrice(order.delivery.amount, company.currencyLabel)
                      : 'بلا مقابل'
                    : '—'}
                </td>
              </tr>
              <tr className='invoice-payable'>
                <td colSpan={6}>المبلغ المطلوب</td>
                <td>{formatPrice(payable.total, company.currencyLabel)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.notes ? (
          <p className='invoice-notes'>
            <strong>ملاحظات العميل:</strong> {order.notes}
          </p>
        ) : null}

        <footer className='invoice-foot'>
          <p>{company.wholesale.demoNotice}</p>
          <p>
            هذه فاتورة تجريبية طُبعت من المتصفح (لا يوجد خادم ولا فاتورة إلكترونية ضريبية). الطلب
            {order.source === 'local' ? ' سُجّل من هذا الجهاز' : ' تجريبي من بيانات العرض'} ولم يصل إلى الشركة.
          </p>
          <p className='invoice-signature'>توقيع المستلم: .................................</p>
        </footer>
      </article>
    </>
  )
}
