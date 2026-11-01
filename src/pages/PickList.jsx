import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CircleAlert, Printer, ReceiptText } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState.jsx'
import { ORDER_STATUS_LABELS } from '../data/orders.js'
import { company } from '../data/company.js'
import { getProductById } from '../utils/catalogStore.js'
import { innerCount } from '../utils/pricing.js'
import { describePack, formatDateTime, formatNumber } from '../utils/format.js'
import { useOrders } from '../hooks/useOrders.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function PickList() {
  const { number } = useParams()
  const { findOrder } = useOrders()
  const order = findOrder(number)
  usePageTitle(order ? `ورقة تجهيز ${order.orderNumber}` : 'ورقة تجهيز الطلب')
  const [picked, setPicked] = useState([])

  if (!order) {
    return (
      <EmptyState
        icon={CircleAlert}
        title='لا توجد ورقة تجهيز لهذا الطلب'
        hint='الطلب غير موجود في ذاكرة هذا المتصفح، أو أن الرقم غير صحيح.'
        action={
          <div className='btn-row'>
            <Link to='/dashboard?tab=orders' className='btn btn--primary'>
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

  const rows = order.items.map((item, index) => {
    const product = getProductById(item.productId)
    const inner = product ? innerCount(product, item.quantity) : null
    return {
      key: item.productId,
      index: index + 1,
      name: product?.name ?? item.productId,
      pack: product ? describePack(product) : '—',
      quantity: item.quantity,
      unit: product?.unit ?? 'وحدة',
      inner,
      countUnit: product?.countUnit ?? 'قطعة',
      location: product?.location ?? '',
    }
  })

  const pickedCount = picked.length

  const toggle = (key) => {
    setPicked((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    )
  }

  return (
    <>
      <div className='invoice-actions no-print'>
        <button type='button' className='btn btn--primary' onClick={() => window.print()}>
          <Printer size={18} aria-hidden='true' /> طباعة الورقة
        </button>
        <button
          type='button'
          className='btn btn--ghost'
          onClick={() => setPicked(pickedCount ? [] : rows.map((row) => row.key))}
        >
          {pickedCount ? 'إلغاء التحديد' : 'تحديد الكل'}
        </button>
        <Link to={`/invoice/${order.orderNumber}`} className='btn btn--ghost'>
          <ReceiptText size={18} aria-hidden='true' /> الفاتورة بالأسعار
        </Link>
        <Link to='/dashboard?tab=orders' className='btn btn--ghost'>
          لوحة التحكم
        </Link>
      </div>

      <article className='pick-sheet'>
        <header className='pick-head'>
          <div>
            <h1>ورقة تجهيز طلب</h1>
            <p className='pick-head__brand'>{company.legalName}</p>
          </div>
          <dl className='pick-meta'>
            <div>
              <dt>رقم الطلب</dt>
              <dd>{order.orderNumber}</dd>
            </div>
            <div>
              <dt>الحالة</dt>
              <dd>{ORDER_STATUS_LABELS[order.currentStatus] ?? order.currentStatus}</dd>
            </div>
            <div>
              <dt>التاريخ</dt>
              <dd>{order.placedAt ? formatDateTime(order.placedAt) : '—'}</dd>
            </div>
          </dl>
        </header>

        <p className='pick-party'>
          <strong>{order.customerLabel}</strong> · {order.area}
          {order.address ? ` · ${order.address}` : ''}
        </p>

        <p className='pick-progress' role='status'>
          جهّزت {formatNumber(pickedCount)} من {formatNumber(rows.length)} صنفًا
        </p>

        <div className='table-scroll table-scroll--pick'>
          <table className='pick-table dash-fit-table'>
            <caption className='visually-hidden'>أصناف الطلب للتجهيز</caption>
            <colgroup>
              <col className='col-check' />
              <col className='col-idx' />
              <col className='col-name' />
              <col className='col-pack' />
              <col className='col-qty' />
              <col className='col-inner' />
              <col className='col-shelf' />
            </colgroup>
            <thead>
              <tr>
                <th scope='col'>تم</th>
                <th scope='col'>#</th>
                <th scope='col'>الصنف</th>
                <th scope='col'>العبوة</th>
                <th scope='col'>الكمية</th>
                <th scope='col'>بالقطعة</th>
                <th scope='col'>المكان</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className={picked.includes(row.key) ? 'is-picked' : ''}>
                  <td data-label='تم'>
                    <input
                      type='checkbox'
                      className='pick-check'
                      checked={picked.includes(row.key)}
                      onChange={() => toggle(row.key)}
                      aria-label={`تم تجهيز ${row.name}`}
                    />
                  </td>
                  <td data-label='#'>{row.index}</td>
                  <th scope='row'>{row.name}</th>
                  <td data-label='العبوة'>{row.pack}</td>
                  <td data-label='الكمية'>
                    {formatNumber(row.quantity)} {row.unit}
                  </td>
                  <td data-label='بالقطعة'>
                    {row.inner === null ? '—' : `${formatNumber(row.inner)} ${row.countUnit}`}
                  </td>
                  {row.location ? (
                    <td className='stock-shelf' data-label='المكان'>
                      {row.location}
                    </td>
                  ) : (
                    <td
                      className='pick-blank'
                      data-label='المكان'
                      aria-label='خانة فارغة لمكان الصنف'
                    ></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.notes ? (
          <p className='invoice-notes'>
            <strong>ملاحظات العميل:</strong> {order.notes}
          </p>
        ) : null}

        <p className='notice'>
          هذه الورقة للتجهيز فقط — لا تعرض أسعارًا، ولا تُخصم من أرقام المخزون في تبويب المنتجات. خانة
          «المكان» تُطبع من المكتوب في اللوحة، وتبقى مخطّطة للكتابة باليد لغير ذلك.
        </p>

        <footer className='pick-foot'>
          <p>توقيع المجهّز: .................................</p>
          <p>تاريخ التجهيز: .......... / .......... ..........</p>
        </footer>
      </article>
    </>
  )
}
