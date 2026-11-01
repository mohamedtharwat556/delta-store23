import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Eye, PackagePlus, Pencil, RotateCcw, Search, Trash2 } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import ProductImage from '../ui/ProductImage.jsx'
import ProductEditor from './ProductEditor.jsx'
import {
  categories,
  categoryGroupIds,
  categoryPathLabel,
  findCategory,
  rootCategory,
  sectionCount,
  topCategories,
} from '../../data/categories.js'
import { products as seedProducts } from '../../data/products.js'
import { company } from '../../data/company.js'
import { useCart } from '../../hooks/useCart.js'
import { useCatalog } from '../../hooks/useCatalog.js'
import { useStockCounts } from '../../hooks/useStockCounts.js'
import {
  addProduct,
  deleteProduct,
  getOverridesSummary,
  nextProductId,
  patchProduct,
  restoreSeed,
  uniqueSlug,
} from '../../utils/catalogStore.js'
import { applyCount, clearCount, countsSummary, diffFor, recordCount } from '../../utils/stockCount.js'
import { buildProductRecord } from '../../utils/productForm.js'
import { buildCsv, downloadTextFile } from '../../utils/csv.js'
import { inventoryFilename, inventoryHeaders, inventoryRows } from '../../utils/inventoryExport.js'
import { availabilityOf } from '../../utils/pricing.js'
import { formatDateTime, formatNumber, formatPrice } from '../../utils/format.js'
import { buildHaystack, matchesAllTokens, tokenizeQuery } from '../../utils/arabic.js'

// الصور المتاحة للتاجر هي الصور الموجودة في المشروع فقط — لا روابط خارجية
const imageOptions = (() => {
  const seen = new Set()
  return seedProducts
    .filter((product) => {
      if (seen.has(product.image)) return false
      seen.add(product.image)
      return true
    })
    .map((product) => ({ value: product.image, label: product.name }))
})()

export default function ProductsPanel() {
  const products = useCatalog()
  const counts = useStockCounts()
  const { notify } = useCart()
  const [term, setTerm] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [missingWholesale, setMissingWholesale] = useState(false)
  const [onlyMismatch, setOnlyMismatch] = useState(false)
  const [draftCounts, setDraftCounts] = useState({})
  const [applyingId, setApplyingId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [confirmingRestore, setConfirmingRestore] = useState(false)

  const overrides = getOverridesSummary()
  const summary = countsSummary(products, counts)

  const rows = useMemo(() => {
    const tokens = tokenizeQuery(term.trim())
    const group = categoryId ? categoryGroupIds(categoryId) : null
    return products.filter((product) => {
      if (group && !group.has(product.categoryId)) return false
      if (missingWholesale && product.wholesalePrice && product.wholesaleMinQuantity) return false
      if (onlyMismatch) {
        const entry = counts[product.id]
        if (!entry || entry.count === Math.floor(Number(product.stock) || 0)) return false
      }
      if (!tokens.length) return true
      const haystack = buildHaystack([
        product.name,
        product.description,
        product.id,
        product.slug,
        product.unit,
        product.location,
        findCategory(product.categoryId)?.name,
        rootCategory(product.categoryId)?.name,
      ])
      return matchesAllTokens(haystack, tokens)
    })
  }, [products, counts, term, categoryId, missingWholesale, onlyMismatch])

  const hasFilters =
    Boolean(term.trim()) || Boolean(categoryId) || missingWholesale || onlyMismatch

  const save = (cleaned, slugInput) => {
    if (editing?.mode === 'edit') {
      const id = editing.product.id
      const slug = uniqueSlug(slugInput || editing.product.slug, id)
      patchProduct(id, { ...cleaned, slug })
      setEditing(null)
      setConfirmingId(null)
      notify(`تم حفظ تعديلات ${cleaned.name}`, 'success')
      return
    }
    const id = nextProductId()
    const slug = uniqueSlug(slugInput || `dl-${id.split('-')[1]}`, null)
    addProduct(buildProductRecord(cleaned, { id, slug }))
    setEditing(null)
    notify(`تمت إضافة ${cleaned.name} إلى المتجر`, 'success')
  }

  const remove = (product) => {
    deleteProduct(product.id)
    setConfirmingId(null)
    if (editing?.mode === 'edit' && editing.product.id === product.id) setEditing(null)
    notify(`تم إخفاء ${product.name} من المتجر`, 'info')
  }

  const restore = () => {
    restoreSeed()
    setConfirmingRestore(false)
    setEditing(null)
    notify('رجعت بيانات المنتجات الأصلية من الملف', 'info')
  }

  const exportInventory = () => {
    downloadTextFile(inventoryFilename(), buildCsv(inventoryHeaders(), inventoryRows(rows, counts)))
    notify(`صدّرت جرد ${formatNumber(rows.length)} صنفًا إلى ملف CSV في جهازك`, 'success')
  }

  const saveCount = (product) => {
    const result = recordCount(product.id, draftCounts[product.id])
    if (result.error) {
      notify(`${product.name}: ${result.error}`, 'danger')
      return
    }
    setDraftCounts((current) => ({ ...current, [product.id]: '' }))
    notify(
      `سجّلت عدّ ${product.name} (${formatNumber(result.entry.count)}) — رقم المخزون المكتوب لم يتغيّر`,
      'info'
    )
  }

  const approveCount = (product) => {
    const result = applyCount(product.id)
    setApplyingId(null)
    if (result.error) {
      notify(`${product.name}: ${result.error}`, 'danger')
      return
    }
    notify(`اعتمدت عدّ ${product.name}: المخزون صار ${formatNumber(result.stock)}`, 'success')
  }

  const dropCount = (product) => {
    clearCount(product.id)
    setApplyingId(null)
    notify(`مسحت عدّ ${product.name} المسجَّل في هذا المتصفح`, 'info')
  }

  return (
    <>
      <section className='card dashboard-filters' aria-label='تصفية المنتجات'>
        <div className='dashboard-search'>
          <label className='field-label' htmlFor='products-admin-search'>
            <Search size={16} aria-hidden='true' /> بحث بالاسم أو رمز الصنف أو القسم أو المكان
          </label>
          <input
            id='products-admin-search'
            className='field'
            type='search'
            value={term}
            placeholder='مثال: ولاعة أو DL-2001 أو رف B3'
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
            {topCategories().map((category) => {
              const group = categoryGroupIds(category.id)
              const badge = sectionCount(
                category.id,
                products.filter((product) => group.has(product.categoryId)).length
              )
              return (
                <button
                  key={category.id}
                  type='button'
                  className={`chip chip--filter${category.id === categoryId ? ' is-active' : ''}`}
                  onClick={() => setCategoryId(category.id === categoryId ? '' : category.id)}
                  aria-pressed={category.id === categoryId}
                >
                  {category.name} ({badge.value} {badge.unit})
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className='filter-panel__foot'>
          <div className='filter-bar'>
            <button
              type='button'
              className={`chip chip--filter${missingWholesale ? ' is-active' : ''}`}
              onClick={() => setMissingWholesale((value) => !value)}
              aria-pressed={missingWholesale}
            >
              بلا سعر جملة
            </button>
            <button
              type='button'
              className={`chip chip--filter${onlyMismatch ? ' is-active' : ''}`}
              onClick={() => setOnlyMismatch((value) => !value)}
              aria-pressed={onlyMismatch}
            >
              فروق جرد ({formatNumber(summary.mismatched)})
            </button>
          </div>

          <div className='btn-row'>
            {hasFilters ? (
              <button
                type='button'
                className='btn btn--ghost btn--sm'
                onClick={() => {
                  setTerm('')
                  setCategoryId('')
                  setMissingWholesale(false)
                  setOnlyMismatch(false)
                }}
              >
                إزالة الفلاتر
              </button>
            ) : null}

            <button
              type='button'
              className='btn btn--ghost btn--sm'
              onClick={exportInventory}
              disabled={!rows.length}
              title='ملف CSV فيه الأصناف المعروضة بحالتها الحالية، يبقى في جهازك ولا يُرسل لأي جهة'
            >
              <Download size={15} aria-hidden='true' /> تصدير الجرد ({formatNumber(rows.length)})
            </button>

            <button
              type='button'
              className='btn btn--primary btn--sm'
              onClick={() => {
                setConfirmingRestore(false)
                setEditing({ mode: 'create' })
              }}
            >
              <PackagePlus size={15} aria-hidden='true' /> صنف جديد
            </button>

            {overrides.changed ? (
              confirmingRestore ? (
                <span className='btn-row'>
                  <button type='button' className='btn btn--danger btn--sm' onClick={restore}>
                    تأكيد الاسترجاع
                  </button>
                  <button
                    type='button'
                    className='btn btn--ghost btn--sm'
                    onClick={() => setConfirmingRestore(false)}
                  >
                    إلغاء
                  </button>
                </span>
              ) : (
                <button
                  type='button'
                  className='btn btn--ghost btn--danger-ghost btn--sm'
                  onClick={() => {
                    setEditing(null)
                    setConfirmingRestore(true)
                  }}
                >
                  <RotateCcw size={15} aria-hidden='true' /> استرجاع البيانات الأصلية
                </button>
              )
            ) : null}
          </div>
        </div>

        <p className='section__subtitle u-mt-2'>
          التعديلات محفوظة في متصفحك فقط ({formatNumber(overrides.edited)} معدَّل،{' '}
          {formatNumber(overrides.added)} مضاف، {formatNumber(overrides.removed)} مخفي) — ملف{' '}
          <code>src/data/products.js</code> كما هو حتى تعتمد الشركة الأسعار.
        </p>
        <p className='section__subtitle'>
          الجرد: {formatNumber(summary.recorded)} صنفًا عليه عدّ مسجَّل ({formatNumber(summary.pending)}{' '}
          بانتظار الاعتماد، {formatNumber(summary.mismatched)} عليه فارق عن المكتوب)، و{' '}
          {formatNumber(summary.untouched)} صنفًا لم يُعدّ بعد.
        </p>
      </section>

      {editing ? (
        <ProductEditor
          product={editing.mode === 'edit' ? editing.product : null}
          categoryOptions={categories}
          imageOptions={imageOptions}
          onSubmit={save}
          onCancel={() => {
            setEditing(null)
            setConfirmingRestore(false)
          }}
        />
      ) : null}

      {rows.length ? (
        <div className='table-scroll table-scroll--products'>
          <table className='dashboard-table products-table dash-fit-table'>
            <caption className='visually-hidden'>قائمة منتجات المتجر</caption>
            <colgroup>
              <col className='col-product' />
              <col className='col-category' />
              <col className='col-shelf' />
              <col className='col-unit' />
              <col className='col-retail' />
              <col className='col-offer' />
              <col className='col-wholesale' />
              <col className='col-stock' />
              <col className='col-count' />
              <col className='col-actions' />
            </colgroup>
            <thead>
              <tr>
                <th scope='col'>الصنف</th>
                <th scope='col'>القسم</th>
                <th scope='col'>المكان</th>
                <th scope='col'>الوحدة</th>
                <th scope='col'>قطاعي</th>
                <th scope='col'>عرض</th>
                <th scope='col'>جملة / الحد</th>
                <th scope='col'>المخزون</th>
                <th scope='col'>العدّ</th>
                <th scope='col'>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => {
                const availability = availabilityOf(product)
                const isOpen = editing?.mode === 'edit' && editing.product.id === product.id
                const entry = counts[product.id] ?? null
                const diff = diffFor(product, entry)
                return (
                  <tr key={`${product.id}-${product.name}-${product.stock}`} className={isOpen ? 'is-open' : ''}>
                    <th scope='row'>
                      <span className='products-cell'>
                        <ProductImage src={product.image} alt='' ratio='thumb' />
                        <span>
                          {product.name}
                          <span className='dashboard-sub'>
                            {product.id}
                            {product.isCustom ? <span className='chip chip--retail'>مُضاف</span> : null}
                          </span>
                        </span>
                      </span>
                    </th>
                    <td data-label='القسم'>{categoryPathLabel(product.categoryId)}</td>
                    <td data-label='المكان'>
                      {product.location ? <span className='stock-shelf'>{product.location}</span> : '—'}
                    </td>
                    <td data-label='الوحدة'>{product.unit}</td>
                    <td data-label='قطاعي'>{formatPrice(product.retailPrice, company.currencyLabel)}</td>
                    <td data-label='عرض'>
                      {product.offerPrice ? formatPrice(product.offerPrice, company.currencyLabel) : '—'}
                    </td>
                    <td data-label='جملة / الحد'>
                      {product.wholesalePrice
                        ? `${formatPrice(product.wholesalePrice, company.currencyLabel)} / ${
                            product.wholesaleMinQuantity ?? '—'
                          }`
                        : '—'}
                    </td>
                    <td data-label='المخزون'>
                      <span className='chip chip--category'>{availability.label}</span>
                      <span className='dashboard-sub'>{formatNumber(product.stock ?? 0)} وحدة</span>
                    </td>
                    <td data-label='العدّ'>
                      <div className='stock-count'>
                        <label className='visually-hidden' htmlFor={`count-${product.id}`}>
                          العدد الفعلي لـ {product.name}
                        </label>
                        <input
                          id={`count-${product.id}`}
                          className='field field--number'
                          type='text'
                          inputMode='numeric'
                          autoComplete='off'
                          value={draftCounts[product.id] ?? ''}
                          placeholder={entry ? formatNumber(entry.count) : 'العدد'}
                          onChange={(event) =>
                            setDraftCounts((current) => ({ ...current, [product.id]: event.target.value }))
                          }
                        />
                        <button
                          type='button'
                          className='btn btn--ghost btn--sm'
                          onClick={() => saveCount(product)}
                        >
                          تسجيل
                        </button>
                      </div>
                      {entry ? (
                        <div className='stock-count__state'>
                          <span className={`stock-diff${diff ? ' stock-diff--off' : ''}`}>
                            {diff === 0
                              ? 'مطابق للمكتوب'
                              : `الفارق ${diff > 0 ? '+' : '−'}${formatNumber(Math.abs(diff))}`}
                          </span>
                          {entry.appliedAt ? (
                            <span className='stock-applied'>معتمد {formatDateTime(entry.appliedAt)}</span>
                          ) : (
                            <span className='stock-count__actions'>
                              {applyingId === product.id ? (
                                <span className='stock-count__confirm'>
                                  <button
                                    type='button'
                                    className='btn btn--primary btn--sm'
                                    onClick={() => approveCount(product)}
                                  >
                                    اعتماد {formatNumber(entry.count)}
                                  </button>
                                  <button
                                    type='button'
                                    className='btn btn--ghost btn--sm'
                                    onClick={() => setApplyingId(null)}
                                  >
                                    إلغاء
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type='button'
                                  className='btn btn--ghost btn--sm'
                                  onClick={() => setApplyingId(product.id)}
                                  aria-label={`اعتماد ${formatNumber(entry.count)} في المخزون`}
                                  title='يكتب العدد المعدود في خانة المخزون لهذا الصنف'
                                >
                                  اعتماد<span className='btn__text'> في المخزون</span>
                                </button>
                              )}
                              <button
                                type='button'
                                className='btn btn--ghost btn--danger-ghost btn--sm'
                                onClick={() => dropCount(product)}
                                aria-label='مسح العدّ المسجَّل'
                                title='يحذف العدد المعدود بدون تغيير المخزون'
                              >
                                مسح<span className='btn__text'> العدّ</span>
                              </button>
                            </span>
                          )}
                        </div>
                      ) : null}
                    </td>
                    <td data-label='إجراءات'>
                      <div className='btn-row'>
                        <button
                          type='button'
                          className='btn btn--ghost btn--sm'
                          aria-label={isOpen ? 'إغلاق' : 'تعديل'}
                          title={isOpen ? 'إغلاق نموذج التعديل' : 'تعديل الصنف'}
                          onClick={() => {
                            setConfirmingRestore(false)
                            setEditing(isOpen ? null : { mode: 'edit', product })
                          }}
                        >
                          <Pencil size={15} aria-hidden='true' />
                          <span className='btn__text'>{isOpen ? 'إغلاق' : 'تعديل'}</span>
                        </button>
                        <Link
                          to={`/products/${product.slug}`}
                          className='btn btn--ghost btn--sm'
                          aria-label={`معاينة ${product.name} في المتجر`}
                          title='معاينة كما يراها العميل'
                        >
                          <Eye size={15} aria-hidden='true' />
                          <span className='btn__text'>معاينة</span>
                        </Link>
                        {confirmingId === product.id ? (
                          <span className='btn-row'>
                            <button
                              type='button'
                              className='btn btn--danger btn--sm'
                              onClick={() => remove(product)}
                            >
                              تأكيد الإخفاء
                            </button>
                            <button
                              type='button'
                              className='btn btn--ghost btn--sm'
                              onClick={() => setConfirmingId(null)}
                            >
                              إلغاء
                            </button>
                          </span>
                        ) : (
                          <button
                            type='button'
                            className='btn btn--ghost btn--danger-ghost btn--sm'
                            aria-label='إخفاء الصنف'
                            title='يُخرج الصنف من المتجر (بتأكيد)'
                            onClick={() => {
                              setEditing(null)
                              setConfirmingId(product.id)
                            }}
                          >
                            <Trash2 size={15} aria-hidden='true' />
                            <span className='btn__text'>إخفاء</span>
                          </button>
                        )}
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
          hint='غيّر البحث أو القسم، أو أضف صنفًا جديدًا.'
          action={
            <button
              type='button'
              className='btn btn--primary'
              onClick={() => setEditing({ mode: 'create' })}
            >
              <PackagePlus size={16} aria-hidden='true' /> صنف جديد
            </button>
          }
        />
      )}

      <p className='notice u-mt-4'>
        «الإخفاء» يُخرج الصنف من المتجر والسلة والتتبع، و«استرجاع البيانات الأصلية» يمسح كل تعديلات
        اللوحة. لا تُحذف بيانات ملف المنتجات، ولا يُرسل أي شيء خارج المتصفح. خانة «المخزون» رقم تضبطه
        أنت يدويًا — لا ينقص تلقائيًا مع الطلبات المسجّلة، فالمخزون الفعلي يبقى تحت جردك أنت. في عمود
        «العدّ»: «تسجيل» يحفظ العدد المعدود في سجل منفصل داخل هذا المتصفح فقط ولا يمس رقم المخزون،
        و«اعتماد في المخزون» — بخطوة تأكيد — هو وحده الذي يكتب العدد في الخانة. «مسح العدّ» يُسجّل عن
        الصنف ولا يرجّع المخزون لقيمته القديمة. زر «تصدير الجرد» ينزّل الأصناف المعروضة بعد الفلاتر في
        ملف CSV على جهازك، وفيه العدد المسجَّل والفارق إن وُجد.
      </p>
    </>
  )
}
