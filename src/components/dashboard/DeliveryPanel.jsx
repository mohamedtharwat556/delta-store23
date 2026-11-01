import { useState } from 'react'
import { RotateCcw, Save, Truck } from 'lucide-react'
import { company } from '../../data/company.js'
import { useCart } from '../../hooks/useCart.js'
import { useDeliveryRules } from '../../hooks/useDeliveryRules.js'
import {
  DEFAULT_DELIVERY_RULES,
  deliveryQuote,
  parseRuleAmount,
  resetDeliveryRules,
  saveDeliveryRules,
  wholesaleGate,
} from '../../utils/delivery.js'
import { formatPrice } from '../../utils/format.js'

const RULE_FIELDS = [
  { name: 'feeLocal', label: 'توصيل داخل دمياط والزرقا', hint: 'يُضاف إلى إجمالي الأصناف' },
  { name: 'feeOther', label: 'توصيل إلى باقي المحافظات', hint: 'يُضاف إلى إجمالي الأصناف' },
  { name: 'freeFrom', label: 'حد الإعفاء من التوصيل', hint: 'صفر يعني بلا إعفاء' },
  { name: 'wholesaleMin', label: 'أقل قيمة لطلب الجملة', hint: 'صفر يعني بلا حد أدنى' },
]

const PREVIEW = [
  { area: 'دمياط', subtotal: 180 },
  { area: 'الجيزة', subtotal: 900 },
  { area: 'الإسكندرية', subtotal: 2000 },
]

const INVALID_AMOUNT = 'اكتب رقمًا موجبًا أو صفرًا — بلا إشارة سالبة وبلا نص.'

const draftFrom = (rules) =>
  Object.fromEntries(RULE_FIELDS.map((field) => [field.name, String(rules[field.name])]))

export default function DeliveryPanel() {
  const rules = useDeliveryRules()
  const { notify } = useCart()
  const [draft, setDraft] = useState(() => draftFrom(rules))
  const [errors, setErrors] = useState({})

  const money = (value) => formatPrice(value, company.currencyLabel)
  const isDefault = RULE_FIELDS.every((field) => rules[field.name] === DEFAULT_DELIVERY_RULES[field.name])

  const save = (event) => {
    event.preventDefault()
    const nextErrors = {}
    RULE_FIELDS.forEach((field) => {
      if (parseRuleAmount(draft[field.name]) === null) nextErrors[field.name] = INVALID_AMOUNT
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      notify('لم تُحفَظ الإعدادات: راجِع الأرقام غير الصالحة', 'danger')
      return
    }
    const saved = saveDeliveryRules(
      Object.fromEntries(RULE_FIELDS.map((field) => [field.name, parseRuleAmount(draft[field.name])]))
    )
    setDraft(draftFrom(saved))
    notify('حُفظت إعدادات التوصيل في هذا المتصفح؛ الطلبات المسجّلة قبل الحفظ تحتفظ بفواتيرها', 'success')
  }

  const restore = () => {
    const saved = resetDeliveryRules()
    setDraft(draftFrom(saved))
    setErrors({})
    notify('رجعت الإعدادات إلى القيم الافتراضية التجريبية', 'info')
  }

  return (
    <>
      <section className='card delivery-card' aria-label='إعدادات التوصيل وحد الجملة'>
        <h2>
          <Truck size={18} aria-hidden='true' /> التوصيل وحد الجملة
        </h2>
        <p className='section__subtitle'>
          قيم تجريبية تُعدَّل هنا وتبقى في متصفحك وحده؛ تُطبَّق على الطلب الجديد لحظة تسجيله فقط.
        </p>

        <form className='delivery-form' onSubmit={save} noValidate>
          {RULE_FIELDS.map((field) => (
            <div className='delivery-field' key={field.name}>
              <label className='field-label' htmlFor={`delivery-${field.name}`}>
                {field.label}
              </label>
              <div className='delivery-field__row'>
                <input
                  id={`delivery-${field.name}`}
                  className='field'
                  type='text'
                  inputMode='decimal'
                  autoComplete='off'
                  value={draft[field.name]}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.name]: event.target.value }))}
                  aria-invalid={errors[field.name] ? 'true' : 'false'}
                  aria-describedby={errors[field.name] ? `delivery-${field.name}-error` : undefined}
                />
                <span className='delivery-field__unit'>{company.currencyLabel}</span>
              </div>
              <p className='delivery-field__hint'>{field.hint}</p>
              {errors[field.name] ? (
                <p className='field-error' id={`delivery-${field.name}-error`} role='alert'>
                  {errors[field.name]}
                </p>
              ) : null}
            </div>
          ))}

          <div className='delivery-actions'>
            <button type='submit' className='btn btn--primary'>
              <Save size={16} aria-hidden='true' /> حفظ الإعدادات
            </button>
            <button type='button' className='btn btn--ghost' onClick={restore} disabled={isDefault}>
              <RotateCcw size={16} aria-hidden='true' /> القيم الافتراضية
            </button>
          </div>
        </form>
      </section>

      <section className='card' aria-label='معاينة على طلبات مثالية'>
        <h2>معاينة على أمثلة</h2>
        <div className='table-scroll'>
          <table className='dashboard-table'>
            <caption className='visually-hidden'>أثر الإعدادات على طلبات تجريبية</caption>
            <thead>
              <tr>
                <th scope='col'>المحافظة</th>
                <th scope='col'>إجمالي الأصناف</th>
                <th scope='col'>التوصيل</th>
                <th scope='col'>المبلغ المطلوب</th>
                <th scope='col'>حد الجملة</th>
              </tr>
            </thead>
            <tbody>
              {PREVIEW.map((example) => {
                const quote = deliveryQuote({ area: example.area, subtotal: example.subtotal }, rules)
                const gate = wholesaleGate(example.subtotal, rules)
                return (
                  <tr key={example.area}>
                    <th scope='row'>{example.area}</th>
                    <td>{money(example.subtotal)}</td>
                    <td>
                      {quote.waived
                        ? 'بلا مقابل (تجاوز الحد)'
                        : `${money(quote.amount)} — ${quote.baseLabel ?? '—'}`}
                    </td>
                    <td>{money(example.subtotal + quote.amount)}</td>
                    <td>
                      {gate.ok
                        ? 'مقبول كطلب جملة'
                        : `مرفوض: ينقص ${money(gate.missing)} من حد ${money(gate.min)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className='notice'>
          الطلبات التجريبية المعروضة في اللوحة سُجِّلت قبل وجود بند التوصيل، لذلك تظهر بدون هذا البند. أي طلب
          تسجّله من السلة بعد الآن يُخزَّن ببند توصيله الثابت.
        </p>
      </section>
    </>
  )
}
