import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react'
import CartLine from '../components/cart/CartLine.jsx'
import CartSummary from '../components/cart/CartSummary.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useCart } from '../hooks/useCart.js'
import { useDeliveryRules } from '../hooks/useDeliveryRules.js'
import { freeShippingHint, wholesaleGate } from '../utils/delivery.js'
import { formatPrice } from '../utils/format.js'
import { company } from '../data/company.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function CartPage() {
  const { lines, summary, clearCart } = useCart()
  usePageTitle('سلة المشتريات')
  const rules = useDeliveryRules()
  const [confirming, setConfirming] = useState(false)

  const money = (value) => formatPrice(value, company.currencyLabel)
  const gate = lines.some((line) => line.basis === 'wholesale') ? wholesaleGate(summary.total, rules) : null
  const freeHint = freeShippingHint(summary.total, rules)
  const chargesNotice = () => {
    if (gate && !gate.ok) return `طلب الجملة يبدأ من ${money(gate.min)} وينقص ${money(gate.missing)} — يمكنك زيادة الكميات أو إزالة سطر الجملة.`
    if (freeHint && !freeHint.reached) return `التوصيل يُضاف عند اختيار المحافظة، ويُعفى منه الطلب فوق ${money(rules.freeFrom)}.`
    if (freeHint) return `تجاوزت ${money(rules.freeFrom)}: التوصيل بلا مقابل عند اختيار المحافظة.`
    return 'التوصيل يُضاف عند اختيار المحافظة في خطوة إتمام الطلب.'
  }

  if (!lines.length) {
    return (
      <>
        <header className='page-header'>
          <h1>سلة المشتريات</h1>
        </header>
        <EmptyState
          icon={ShoppingBag}
          title='سلتك فارغة'
          hint='لم تُضف أصنافًا بعد. تصفّح المنتجات وأضف ما تحتاجه، والسلة تُحفظ تلقائيًا في متصفحك.'
          action={
            <Link to='/products' className='btn btn--primary'>
              تصفّح المنتجات
              <ArrowLeft size={17} aria-hidden='true' />
            </Link>
          }
        />
      </>
    )
  }

  return (
    <>
      <header className='page-header'>
        <h1>سلة المشتريات</h1>
        <p className='section__subtitle'>
          {summary.lineCount} صنف · {summary.units} وحدة — السعر يُحدَّث تلقائيًا مع الكمية (قطاعي أو
          جملة).
        </p>
      </header>

      <div className='cart-layout'>
        <section className='card' aria-label='أصناف السلة'>
          <ul className='cart-lines'>
            {lines.map((line, index) => (
              <CartLine key={line.product.id} line={line} index={index} />
            ))}
          </ul>

          <div className='cart-actions'>
            <Link to='/products' className='btn btn--ghost'>
              متابعة التسوق
            </Link>

            {confirming ? (
              <span className='btn-row'>
                <button
                  type='button'
                  className='btn btn--danger'
                  onClick={() => {
                    clearCart()
                    setConfirming(false)
                  }}
                >
                  تأكيد إفراغ السلة
                </button>
                <button type='button' className='btn btn--ghost' onClick={() => setConfirming(false)}>
                  إلغاء
                </button>
              </span>
            ) : (
              <button
                type='button'
                className='btn btn--ghost btn--danger-ghost'
                onClick={() => setConfirming(true)}
              >
                <Trash2 size={16} aria-hidden='true' /> إفراغ السلة
              </button>
            )}
          </div>
        </section>

        <CartSummary summary={summary} notice={chargesNotice()}>
          <Link to='/checkout' className='btn btn--primary btn--lg cart-summary__cta'>
            إتمام الطلب
            <ArrowLeft size={18} aria-hidden='true' />
          </Link>
          <Link to='/products' className='btn btn--ghost btn--block'>
            أضف أصنافًا أخرى
          </Link>
        </CartSummary>
      </div>
    </>
  )
}
