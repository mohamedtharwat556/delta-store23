import { company } from '../../data/company.js'
import { formatPrice } from '../../utils/format.js'

// delivery = null قبل اختيار المحافظة، فيظهر إجمالي الأصناف وحده
export default function CartSummary({ summary, delivery = null, notice = null, children }) {
  const payable = Math.round((summary.total + (delivery?.amount ?? 0)) * 100) / 100

  return (
    <section className='card cart-summary' aria-label='ملخص الطلب'>
      <h2>ملخص الطلب</h2>

      <dl className='cart-summary__rows'>
        <div>
          <dt>عدد الأصناف</dt>
          <dd>{summary.lineCount}</dd>
        </div>
        <div>
          <dt>إجمالي الوحدات</dt>
          <dd>{summary.units}</dd>
        </div>
        <div>
          <dt>أصناف بسعر جملة</dt>
          <dd>{summary.wholesaleLines}</dd>
        </div>
        {summary.savings > 0 ? (
          <div className='is-saving'>
            <dt>وفّرت مقارنة بالقطاعي</dt>
            <dd>{formatPrice(summary.savings, company.currencyLabel)}</dd>
          </div>
        ) : null}
        {delivery ? (
          <div>
            <dt>إجمالي الأصناف</dt>
            <dd>{formatPrice(summary.total, company.currencyLabel)}</dd>
          </div>
        ) : null}
        {delivery ? (
          <div className={delivery.waived ? 'is-saving' : undefined}>
            <dt>{delivery.label}</dt>
            <dd>
              {delivery.amount > 0 ? formatPrice(delivery.amount, company.currencyLabel) : 'بلا مقابل'}
            </dd>
          </div>
        ) : null}
        {delivery ? (
          <div className='cart-summary__total'>
            <dt>المبلغ المطلوب</dt>
            <dd>{formatPrice(payable, company.currencyLabel)}</dd>
          </div>
        ) : (
          <div className='cart-summary__total'>
            <dt>الإجمالي</dt>
            <dd>{formatPrice(summary.total, company.currencyLabel)}</dd>
          </div>
        )}
      </dl>

      {notice ? (
        <p className='cart-summary__notice' role='status'>
          {notice}
        </p>
      ) : null}

      <p className='cart-summary__note'>{company.wholesale.demoNotice}</p>

      {children}
    </section>
  )
}
