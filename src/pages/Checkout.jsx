import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ClipboardCopy, Send } from 'lucide-react'
import CartSummary from '../components/cart/CartSummary.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { company } from '../data/company.js'
import { governorates } from '../data/governorates.js'
import { useCart } from '../hooks/useCart.js'
import { useOrders } from '../hooks/useOrders.js'
import { validateOrderContact } from '../utils/checkout.js'
import { deliveryQuote, freeShippingHint, wholesaleGate } from '../utils/delivery.js'
import { formatPrice } from '../utils/format.js'
import { useDeliveryRules } from '../hooks/useDeliveryRules.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const FIELDS = [
  {
    name: 'customer',
    label: 'اسم النشاط أو العميل',
    type: 'text',
    placeholder: 'مثال: محل النور للخردوات',
    required: true,
    autoComplete: 'organization',
  },
  {
    name: 'phone',
    label: 'رقم التواصل',
    type: 'tel',
    placeholder: '10 رقم يبدأ بـ 010 / 011 / 012 / 015',
    required: true,
    autoComplete: 'tel',
    // لوحة أرقام مباشرة بدل الحروف: الرقم كلو أرقام والمفتاح على الموبايل غالي
    inputMode: 'numeric',
  },
  { name: 'area', label: 'المحافظة', type: 'select', placeholder: 'اختر المحافظة', required: true },
  {
    name: 'address',
    label: 'العنوان التفصيلي',
    type: 'text',
    placeholder: 'مثال: شارع السوق — بجوار المسجد — محل رقم 12',
    required: false,
    autoComplete: 'street-address',
  },
]

const INITIAL_VALUES = { customer: '', phone: '', area: '', address: '', notes: '' }

function buildSummaryText(lines, summary, contact, quote) {
  const rows = lines.map(
    (line) =>
      `- ${line.product.name}: ${line.quantity} ${line.product.unit} × ${formatPrice(
        line.unitPrice,
        company.currencyLabel
      )} (${line.basis === 'wholesale' ? 'جملة' : 'قطاعي'})`
  )
  const place = [contact?.area, contact?.address].filter(Boolean).join(' — ')
  const money = (value) => formatPrice(value, company.currencyLabel)
  return [
    `ملخص طلب — ${company.nameAr}`,
    contact?.customer ? `العميل: ${contact.customer}` : null,
    contact?.phone ? `التواصل: ${contact.phone}` : null,
    place ? `العنوان: ${place}` : null,
    ...rows,
    `إجمالي الأصناف: ${money(summary.total)}`,
    quote ? `${quote.label}: ${quote.amount > 0 ? money(quote.amount) : 'بلا مقابل'}` : null,
    quote ? `المبلغ المطلوب: ${money(summary.total + quote.amount)}` : null,
    '(مسودة محلية — لم تُرسَل إلى الشركة)',
  ]
    .filter(Boolean)
    .join('\n')
}

export default function Checkout() {
  const { lines, summary, clearCart, notify } = useCart()
  usePageTitle('إتمام الطلب')
  const rules = useDeliveryRules()
  const { createOrder } = useOrders()
  const navigate = useNavigate()
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const quote = deliveryQuote({ area: values.area, subtotal: summary.total }, rules)
  const hasWholesale = lines.some((line) => line.basis === 'wholesale')
  const gate = hasWholesale ? wholesaleGate(summary.total, rules) : { ok: true, min: 0, missing: 0 }
  const freeHint = freeShippingHint(summary.total, rules)
  const money = (value) => formatPrice(value, company.currencyLabel)

  const gateNotice = !gate.ok
    ? `طلب الجملة يبدأ من ${money(gate.min)} — إجمالي الأصناف ${money(summary.total)} وينقص ${money(
        gate.missing
      )}.`
    : null

  const deliveryNotice = () => {
    if (!quote) return 'اختر المحافظة أولًا ليظهر بند التوصيل.'
    if (quote.waived) return `تجاوز الطلب ${money(rules.freeFrom)}، لذلك لا رسوم توصيل عليه.`
    if (freeHint) return `أضف ${money(freeHint.missing)} لتعفى من رسوم التوصيل (الحد ${money(rules.freeFrom)}).`
    return 'لا يوجد حد للتوصيل المجاني في إعدادات التوصيل الحالية.'
  }

  if (!lines.length) {
    return (
      <>
        <header className='page-header'>
          <h1>إتمام الطلب</h1>
        </header>
        <EmptyState
          title='لا يوجد طلب لإتمامه'
          hint='أضف أصنافًا إلى السلة أولًا، ثم عُد إلى هذه الصفحة.'
          action={
            <Link to='/products' className='btn btn--primary'>
              تصفّح المنتجات
            </Link>
          }
        />
      </>
    )
  }

  const setValue = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const submitOrder = (event) => {
    event.preventDefault()
    const { errors: nextErrors, cleaned } = validateOrderContact(values)
    if (!gate.ok) nextErrors.wholesale = gateNotice
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      notify(
        gate.ok ? 'راجع الحقول المطلوبة قبل تسجيل الطلب' : 'إجمالي الأصناف لم يبلغ حد طلب الجملة بعد',
        'danger'
      )
      if (!gate.ok) {
        document.getElementById('co-area')?.focus()
        return
      }
      // التركيز يتم بالـ id مباشرة لأن إعادة العرض لم تحدث بعد عند هذه النقطة
      const firstInvalid = FIELDS.find((field) => nextErrors[field.name])
      if (firstInvalid) document.getElementById(`co-${firstInvalid.name}`)?.focus()
      return
    }

    setSubmitting(true)
    const order = createOrder({
      customer: cleaned.customer,
      phone: cleaned.phone,
      area: cleaned.area,
      address: cleaned.address,
      notes: cleaned.notes,
      lines,
      delivery: quote,
    })

    if (!order) {
      setSubmitting(false)
      notify('لم يُسجّل الطلب: السلة لا تحتوي أصنافًا صالحة', 'danger')
      return
    }

    clearCart()
    navigate(`/order/${order.orderNumber}`)
  }

  const copySummary = async () => {
    const text = buildSummaryText(lines, summary, values, quote)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      notify('تم نسخ ملخص الطلب إلى الحافظة', 'success')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      notify('تعذّر النسخ تلقائيًا — حدّد نص الملخص ونسخه يدويًا', 'danger')
    }
  }

  return (
    <>
      <header className='page-header'>
        <h1>إتمام الطلب</h1>
        <p className='section__subtitle'>
          حدّد المحافظة واكتب العنوان بالظبط؛ تُحفظ البيانات على هذا المتصفح فقط وتظهر في لوحة التحكم.
        </p>
      </header>

      <form className='checkout-layout' onSubmit={submitOrder} noValidate>
        <section className='card' aria-label='بيانات الطلب'>
          <h2>بيانات التواصل</h2>

          {FIELDS.map((field) => {
            const error = errors[field.name]
            const describedBy = error ? `co-${field.name}-error` : undefined

            return (
              <div className='checkout-field' key={field.name}>
                <label className='field-label' htmlFor={`co-${field.name}`}>
                  {field.label} {field.required ? <span className='field-required'>*</span> : null}
                  {field.required ? null : <span className='field-optional'>اختياري</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    id={`co-${field.name}`}
                    className='field field--select'
                    name={field.name}
                    value={values[field.name]}
                    onChange={setValue(field.name)}
                    required={field.required}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={describedBy}
                  >
                    <option value=''>{field.placeholder}</option>
                    {governorates.map((governorate) => (
                      <option key={governorate} value={governorate}>
                        {governorate}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`co-${field.name}`}
                    className='field'
                    name={field.name}
                    type={field.type}
                    value={values[field.name]}
                    onChange={setValue(field.name)}
                    placeholder={field.placeholder}
                    required={field.required}
                    autoComplete={field.autoComplete ?? 'off'}
                    inputMode={field.inputMode}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={describedBy}
                  />
                )}

                {error ? (
                  <p className='field-error' id={`co-${field.name}-error`} role='alert'>
                    {error}
                  </p>
                ) : null}
              </div>
            )
          })}

          <div className='checkout-field'>
            <label className='field-label' htmlFor='co-notes'>
              ملاحظات على الطلب
            </label>
            <textarea
              id='co-notes'
              className='field'
              name='notes'
              rows={3}
              value={values.notes}
              onChange={setValue('notes')}
              placeholder='مواعيد التسليم، تقسيم الكميات، فواتير…'
            />
          </div>

          <div className='checkout-actions'>
            <button type='submit' className='btn btn--primary btn--lg' disabled={submitting}>
              <Send size={17} aria-hidden='true' />
              {submitting ? 'جارٍ تسجيل الطلب…' : 'تسجيل الطلب'}
            </button>
            <button type='button' className='btn btn--ghost' onClick={copySummary}>
              {copied ? <Check size={16} aria-hidden='true' /> : <ClipboardCopy size={16} aria-hidden='true' />}
              {copied ? 'تم نسخ الملخص' : 'نسخ ملخص الطلب'}
            </button>
            <Link to='/cart' className='btn btn--ghost'>
              رجوع للسلة
            </Link>
          </div>

          {errors.wholesale ? (
            <p className='field-error' role='alert'>
              {errors.wholesale}
            </p>
          ) : null}

          <p className='checkout-blocked'>
            الطلب يُخزَّن في متصفحك فقط: لا يوجد خادم، ولا يُرسل لأي جهة، ولن يصل للشركة حتى تُربط
            قناة تواصل معتمدة. لهذا لا تُدخل بيانات عملاء حقيقية.
          </p>
        </section>

        <CartSummary summary={summary} delivery={quote} notice={deliveryNotice()}>
          <div className='checkout-lines'>
            <h3>أصناف الطلب</h3>
            <ul className='checkout-lines__list'>
              {lines.map((line) => (
                <li key={line.product.id}>
                  <span>
                    {line.product.name} — {line.quantity} {line.product.unit}
                  </span>
                  <strong>{formatPrice(line.lineTotal, company.currencyLabel)}</strong>
                </li>
              ))}
            </ul>
          </div>
          <Link to='/dashboard' className='btn btn--ghost btn--block'>
            لوحة التحكم
          </Link>
        </CartSummary>
      </form>
    </>
  )
}
