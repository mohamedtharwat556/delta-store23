import { useMemo, useState } from 'react'
import { BadgePercent, RotateCcw, Save, Search } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import {
  categoryGroupIds,
  categoryPathLabel,
  findCategory,
  rootCategory,
  topCategories,
} from '../../data/categories.js'
import { useCart } from '../../hooks/useCart.js'
import { useCatalog } from '../../hooks/useCatalog.js'
import { patchProduct } from '../../utils/catalogStore.js'
import { parsePriceField, validatePriceDraft, withOfferTag } from '../../utils/productForm.js'
import { priceRows } from '../../utils/analytics.js'
import { formatNumber } from '../../utils/format.js'
import { buildHaystack, matchesAllTokens, tokenizeQuery } from '../../utils/arabic.js'

const PRICE_FIELDS = [
  { name: 'retailPrice', label: 'قطاعي', required: true },
  { name: 'offerPrice', label: 'عرض' },
  { name: 'wholesalePrice', label: 'جملة' },
  { name: 'wholesaleMinQuantity', label: 'حد الجملة' },
]

function priceValues(product) {
  return {
    retailPrice: String(product.retailPrice ?? ''),
    offerPrice: product.offerPrice ? String(product.offerPrice) : '',
    wholesalePrice: product.wholesalePrice ? String(product.wholesalePrice) : '',
    wholesaleMinQuantity: product.wholesaleMinQuantity ? String(product.wholesaleMinQuantity) : '',
  }
}

function DiscountChip({ diff }) {
  if (diff > 0) return <span className='chip chip--wholesale'>{diff}%</span>
  return (
    <span className='chip chip--offer' title='سعر الجملة أعلى من سعر البيع الفعلي'>
      {diff}% راجّع
    </span>
  )
}

export default function PricingPanel() {
  const products = useCatalog()
  const { notify } = useCart()
  const [term, setTerm] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [onlyMissingWholesale, setOnlyMissingWholesale] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [rowErrors, setRowErrors] = useState({})

  const rows = useMemo(() => priceRows(products), [products])

  const stats = useMemo(() => {
    const ready = rows.filter((row) => row.readyForWholesale)
    const offers = rows.filter((row) => row.offerPrice)
    const discounts = ready.map((row) => row.discountPct).filter((value) => value > 0)
    return {
      ready: ready.length,
      missing: rows.length - ready.length,
      offers: offers.length,
      averageDiscount: discounts.length
        ? Math.round((discounts.reduce((sum, value) => sum + value, 0) / discounts.length) * 10) / 10
        : 0,
    }
  }, [rows])

  const visible = useMemo(() => {
    const tokens = tokenizeQuery(term.trim())
    const group = categoryId ? categoryGroupIds(categoryId) : null
    return products.filter((product) => {
      if (group && !group.has(product.categoryId)) return false
      if (onlyMissingWholesale && product.wholesalePrice && product.wholesaleMinQuantity) return false
      if (!tokens.length) return true
      const haystack = buildHaystack([
        product.name,
        product.id,
        product.slug,
        product.unit,
        findCategory(product.categoryId)?.name,
        rootCategory(product.categoryId)?.name,
      ])
      return matchesAllTokens(haystack, tokens)
    })
  }, [products, term, categoryId, onlyMissingWholesale])

  const valueOf = (product, field) => {
    const draft = drafts[product.id]
    if (draft && Object.hasOwn(draft, field)) return draft[field]
    return priceValues(product)[field]
  }

  const isDirty = (product) => {
    const draft = drafts[product.id]
    if (!draft) return false
    const saved = priceValues(product)
    // مقارنة النص الخام: تُفعّل الحفظ وتُظهر رسالة الخطأ حتى لو كان المكتوب مرفوضًا
    return PRICE_FIELDS.some(({ name }) => Object.hasOwn(draft, name) && draft[name] !== saved[name])
  }

  const setField = (product, field, value) => {
    setDrafts((current) => ({
      ...current,
      [product.id]: { ...current[product.id], [field]: value },
    }))
  }

  const clearRow = (id) => {
    setDrafts((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    setRowErrors((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const saveRow = (product) => {
    const draft = priceValues(product)
    Object.assign(draft, drafts[product.id] ?? {})
    const { errors, values } = validatePriceDraft(draft)
    if (Object.keys(errors).length) {
      setRowErrors((current) => ({ ...current, [product.id]: errors }))
      return
    }

    const cleaned = withOfferTag({
      offerPrice: values.offer,
      tags: product.tags ?? [],
    })
    patchProduct(product.id, {
      retailPrice: values.retail,
      offerPrice: values.offer,
      wholesalePrice: values.wholesale,
      wholesaleMinQuantity: values.wholesale === null ? null : values.minimum,
      tags: cleaned.tags,
    })
    clearRow(product.id)
    notify(`تم تحديث أسعار ${product.name} — التعديل في متصفحك فقط`, 'success')
  }

  const resetFilters = () => {
    setTerm('')
    setCategoryId('')
    setOnlyMissingWholesale(false)
  }

  const hasFilters = Boolean(term.trim()) || Boolean(categoryId) || onlyMissingWholesale

  return (
    <>
      <section className='kpi-grid kpi-grid--four' aria-label='مؤشرات التسعير'>
        <div className='card kpi'>
          <span>أصناف جاهزة للجملة</span>
          <strong>
            {formatNumber(stats.ready)} من {formatNumber(rows.length)}
          </strong>
        </div>
        <div className='card kpi kpi--alert'>
          <span>بلا سعر جملة</span>
          <strong>{formatNumber(stats.missing)}</strong>
        </div>
        <div className='card kpi'>
          <span>أصناف عليها عرض</span>
          <strong>{formatNumber(stats.offers)}</strong>
        </div>
        <div className='card kpi'>
          <span>متوسط خصم الجملة</span>
          <strong>{stats.averageDiscount ? `${stats.averageDiscount}%` : '—'}</strong>
        </div>
      </section>

      <section className='card dashboard-filters' aria-label='تصفية الأسعار'>
        <div className='dashboard-search'>
          <label className='field-label' htmlFor='pricing-search'>
            <Search size={16} aria-hidden='true' /> بحث بالصنف أو الرمز
          </label>
          <input
            id='pricing-search'
            className='field'
            type='search'
            value={term}
            placeholder='مثال: سلك أو DL-4002'
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>

        <fieldset className='filter-panel__group'>
          <legend className='field-label'>القسم</legend>
          <div className='filter-bar'>
            <button
              type='button'
              className={`chip chip--filter${!categoryId ? ' is-active' : ''}`}
              onClick={() => setCategoryId('')}
              aria-pressed={!categoryId}
            >
              الكل ({products.length})
            </button>
            {topCategories().map((category) => (
              <button
                key={category.id}
                type='button'
                className={`chip chip--filter${category.id === categoryId ? ' is-active' : ''}`}
                onClick={() => setCategoryId(category.id === categoryId ? '' : category.id)}
                aria-pressed={category.id === categoryId}
              >
                {category.name}
              </button>
            ))}
          </div>
        </fieldset>

        <div className='filter-panel__foot'>
          <button
            type='button'
            className={`chip chip--filter${onlyMissingWholesale ? ' is-active' : ''}`}
            onClick={() => setOnlyMissingWholesale((value) => !value)}
            aria-pressed={onlyMissingWholesale}
          >
            بلا سعر جملة فقط
          </button>
          {hasFilters ? (
            <button type='button' className='btn btn--ghost btn--sm' onClick={resetFilters}>
              إزالة الفلاتر
            </button>
          ) : null}
        </div>
      </section>

      {visible.length ? (
        <div className='table-scroll table-scroll--pricing'>
          <table className='dashboard-table pricing-table dash-fit-table'>
            <caption className='visually-hidden'>أسعار القطاعي والعرض والجملة لكل صنف</caption>
            <colgroup>
              <col className='col-product' />
              <col className='col-retail' />
              <col className='col-offer' />
              <col className='col-wholesale' />
              <col className='col-min' />
              <col className='col-diff' />
              <col className='col-actions' />
            </colgroup>
            <thead>
              <tr>
                <th scope='col'>الصنف</th>
                {PRICE_FIELDS.map((field) => (
                  <th key={field.name} scope='col'>
                    {field.label}
                  </th>
                ))}
                <th scope='col'>فرق عن البيع</th>
                <th scope='col'>حفظ</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => {
                const errors = rowErrors[product.id] ?? {}
                const currentRetail = parsePriceField(valueOf(product, 'retailPrice'))
                const currentOffer = parsePriceField(valueOf(product, 'offerPrice'))
                const currentWholesale = parsePriceField(valueOf(product, 'wholesalePrice'))
                const effective = currentOffer || currentRetail
                const diff =
                  currentWholesale && effective && effective > 0
                    ? Math.round(((effective - currentWholesale) / effective) * 1000) / 10
                    : null

                return (
                  <tr key={`${product.id}-${product.retailPrice}-${product.wholesalePrice ?? 0}`}>
                    <th scope='row'>
                      <span className='products-cell'>
                        {product.name}
                        <span className='dashboard-sub'>
                          {product.id} · {categoryPathLabel(product.categoryId)} ·{' '}
                          {product.unit}
                          {product.stock === 0 ? ' · نفد' : ''}
                        </span>
                      </span>
                    </th>
                    {PRICE_FIELDS.map((field) => {
                      const inputId = `pr-${product.id}-${field.name}`
                      const error = errors[field.name]
                      return (
                        <td key={field.name} data-label={field.label}>
                          <label className='visually-hidden' htmlFor={inputId}>
                            {field.label} لـ {product.name}
                          </label>
                          <input
                            id={inputId}
                            className='field pricing-field'
                            type='text'
                            inputMode='decimal'
                            value={valueOf(product, field.name)}
                            placeholder={field.required ? '' : '—'}
                            onChange={(event) => setField(product, field.name, event.target.value)}
                            aria-invalid={error ? 'true' : 'false'}
                            aria-describedby={error ? `${inputId}-error` : undefined}
                          />
                          {error ? (
                            <p className='field-error' id={`${inputId}-error`} role='alert'>
                              {error}
                            </p>
                          ) : null}
                        </td>
                      )
                    })}
                    <td data-label='فرق عن البيع'>
                      {diff === null ? (
                        <span className='chip chip--category'>بلا جملة</span>
                      ) : (
                        <DiscountChip diff={diff} />
                      )}
                    </td>
                    <td data-label='حفظ'>
                      <div className='btn-row pricing-actions'>
                        <button
                          type='button'
                          className='btn btn--primary btn--sm'
                          onClick={() => saveRow(product)}
                          disabled={!isDirty(product)}
                          aria-label='حفظ أسعار الصنف'
                          title='حفظ أسعار الصنف'
                        >
                          <Save size={15} aria-hidden='true' />
                          <span className='btn__text'>حفظ</span>
                        </button>
                        {isDirty(product) ? (
                          <button
                            type='button'
                            className='btn btn--ghost btn--sm'
                            onClick={() => clearRow(product.id)}
                            aria-label='تراجع عن التعديلات غير المحفوظة'
                            title='تراجع عن التعديلات غير المحفوظة'
                          >
                            <RotateCcw size={15} aria-hidden='true' />
                            <span className='btn__text'>تراجع</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title='لا أصناف مطابقة'
          hint='غيّر البحث أو القسم، أو أزل فلتر «بلا سعر جملة».'
          action={
            <button type='button' className='btn btn--primary' onClick={resetFilters}>
              إزالة الفلاتر
            </button>
          }
        />
      )}

      <p className='notice u-mt-4'>
        الأسعار هنا تجريبية وغير معتمدة من الشركة، والحفظ يخزّن التعديل في متصفحك طبقة فوق{' '}
        <code>src/data/products.js</code> — استرجعه من تبويب المنتجات ليرجع كل شيء كما كان.
      </p>

      <p className='section__subtitle u-mt-2'>
        <BadgePercent size={14} aria-hidden='true' /> سعر العرض يُظهر وسم «عرض» في المتجر تلقائيًا،
        وحذفه يُخفي الوسم.
      </p>
    </>
  )
}
