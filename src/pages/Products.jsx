import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronLeft, Layers, RotateCcw, Search, SlidersHorizontal, Tag, X } from 'lucide-react'
import ProductCard from '../components/product/ProductCard.jsx'
import SectionRail from '../components/category/SectionRail.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { categoryChain, categoryGroupIds, findCategory, sectionCount, sectionRail, subCategories, topCategories } from '../data/categories.js'
import { company } from '../data/company.js'
import { useCatalog } from '../hooks/useCatalog.js'
import { SORT_OPTIONS, useCatalogQuery } from '../hooks/useCatalogQuery.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { priceForQuantity } from '../utils/pricing.js'
import { formatPrice } from '../utils/format.js'

const TAG_OPTIONS = [
  { id: '', label: 'الكل' },
  { id: 'best-seller', label: 'الأكثر طلبًا' },
  { id: 'offer', label: 'عروض' },
]

// على الشاشات الضيقة الفلاتر طبقة يفتحها العميل ويغلقها، والقياس من نفس استعلام CSS حتى ما تنفصلش الحالة عن الشكل
function isCompactCatalog() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 1000px)').matches
  )
}

// عقدة في شريط الأقسام: صف قابل للتحديد، وسهم يفتح ما تحته بأي عمق عند الطلب
function FilterNode({ node, depth, selectedId, trailIds, openIds, onToggle, onPick, countOf }) {
  const children = subCategories(node.id)
  const count = countOf(node.id)
  const isSelected = selectedId === node.id
  const isOpen = children.length > 0 && openIds.has(node.id)

  return (
    <div className='filter-group'>
      <div className='filter-row'>
        {children.length ? (
          <button
            type='button'
            className='filter-toggle'
            aria-expanded={isOpen}
            aria-label={
              isOpen ? `إخفاء الأقسام داخل ${node.name}` : `إظهار الأقسام داخل ${node.name}`
            }
            onClick={() => onToggle(node.id)}
          >
            {isOpen ? <ChevronDown size={15} aria-hidden='true' /> : <ChevronLeft size={15} aria-hidden='true' />}
          </button>
        ) : null}
        <button
          type='button'
          className={`filter-option${
            depth ? ' filter-option--sub' : ''
          }${isSelected ? ' is-active' : ''}${!isSelected && trailIds.has(node.id) ? ' is-trail' : ''}`}
          style={depth ? { '--sub-level': depth } : undefined}
          onClick={() => onPick(node.id)}
          aria-pressed={isSelected}
        >
          <span>{node.name}</span>
          <span className='filter-option__count' title={`${count.value} ${count.unit}`}>
            {count.value}
          </span>
        </button>
      </div>

      {isOpen
        ? children.map((child) => (
            <FilterNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              trailIds={trailIds}
              openIds={openIds}
              onToggle={onToggle}
              onPick={onPick}
              countOf={countOf}
            />
          ))
        : null}
    </div>
  )
}

export default function Products() {
  const catalog = useCatalogQuery()
  const products = useCatalog()
  const activeCategory = findCategory(catalog.categoryId)
  usePageTitle(activeCategory ? activeCategory.name : 'المنتجات')
  const sections = topCategories()
  // شريط الأقسام اللي جنب المنتجات: أبناء القسم المختار، أو إخوتها لو كان ورقة
  const rail = sectionRail(catalog.categoryId)
  const railHref = (id) => catalog.hrefFor({ category: id })
  // الشجرة في لوحة الفلاتر تبقى قصيرة: لا مستوى يظهر إلا بطلب العميل، وممرّ الرابط يفتح تلقائيًا.
  // بعد أول تدخّل يبقى قرار العميل هو الحاكم لا الرابط (بلا setState داخل مفعول).
  const activeChain = catalog.categoryId ? categoryChain(catalog.categoryId).map((node) => node.id) : []
  const trailIds = new Set(activeChain.slice(0, -1))
  const [pickedOpenIds, setPickedOpenIds] = useState(null)
  // على الموبايل الفلاتر مطوية افتراضيًا: المنتجات تظهر فورًا بدل 1300px من الأدوات قبل أول كرت
  const [filtersOpen, setFiltersOpen] = useState(false)
  const closeFiltersIfCompact = () => {
    if (isCompactCatalog()) setFiltersOpen(false)
  }
  const resetFilters = () => {
    catalog.reset()
    closeFiltersIfCompact()
  }
  // قسم مختار وفيه أقسام تحته يبقى مفتوحًا تلقائيًا، حتى لو جيت له برابط مباشر
  const selectedHasChildren = catalog.categoryId ? subCategories(catalog.categoryId).length > 0 : false
  const openIds = new Set(
    pickedOpenIds ?? (selectedHasChildren ? [...trailIds, catalog.categoryId] : [...trailIds])
  )
  const toggleOpen = (id) => {
    const next = new Set(openIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPickedOpenIds(next)
  }
  const pickCategory = (id) => {
    if (catalog.categoryId === id) {
      catalog.setCategory('')
      closeFiltersIfCompact()
      return
    }
    catalog.setCategory(id)
    const toOpen = categoryChain(id).slice(0, -1).map((node) => node.id)
    if (subCategories(id).length) toOpen.push(id)
    setPickedOpenIds(new Set([...openIds, ...toOpen]))
    closeFiltersIfCompact()
  }
  const activeFilterCount = [
    catalog.categoryId,
    catalog.tag,
    catalog.min,
    catalog.max,
    catalog.inStock ? 'in-stock' : '',
    catalog.query.trim(),
  ].filter(Boolean).length
  const countByGroup = (id) => {
    const group = categoryGroupIds(id)
    return sectionCount(id, products.filter((product) => group.has(product.categoryId)).length)
  }
  const countByTag = (id) => products.filter((product) => product.tags.includes(id)).length
  // الفلتر صارم على القسم نفسه، والقسم الأب غالبًا ما عليه أصناف مباشرة (أصنافه في أقسامه)،
  // فالنتيجة الفاضية هنا سببها الشجرة مش الفلاتر: نرفع روابط الأبناء بدل «لا نتائج مطابقة»
  const childrenOfActive = activeCategory ? subCategories(activeCategory.id) : []
  const directCount = catalog.categoryId
    ? products.filter((product) => product.categoryId === catalog.categoryId).length
    : 0
  const needsSectionGuide =
    catalog.results.length === 0 && directCount === 0 && childrenOfActive.length > 0
  // أصناف بلا سعر تدخل المدى: Math.min يحوّل null لأصغر قيمة ويختلق حدًا وهميًا
  const sellingPrices = products.map((product) => priceForQuantity(product, 1).unit).filter((value) => value !== null)
  const priceSpan = sellingPrices.length
    ? { low: Math.min(...sellingPrices), high: Math.max(...sellingPrices) }
    : null

  return (
    <>
      <header className='page-header'>
        <h1>المنتجات</h1>
        <p className='section__subtitle' aria-live='polite'>
          {activeCategory ? activeCategory.name : 'كل الأقسام'} — {catalog.results.length} من{' '}
          {products.length} صنف
        </p>
      </header>

      {rail.crumbs.length ? (
        <nav className='catalog-crumbs' aria-label='موقعك في الأقسام'>
          <ol>
            <li>
              <Link to={railHref('')}>كل الأقسام</Link>
            </li>
            {rail.crumbs.map((node, index) => (
              <li key={node.id}>
                {index === rail.crumbs.length - 1 ? (
                  <span aria-current='page'>{node.name}</span>
                ) : (
                  <Link to={railHref(node.id)}>{node.name}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <SectionRail
        nodes={rail.items}
        scope={rail.scope}
        activeId={catalog.categoryId}
        hrefFor={railHref}
        size={rail.scope ? 'sm' : 'md'}
      />

      <div className='catalog-toolbar'>
        <button
          type='button'
          className='btn btn--ghost btn--sm catalog-toolbar__filters'
          aria-expanded={filtersOpen}
          aria-controls='catalog-filters'
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={16} aria-hidden='true' /> الفلاتر
          {activeFilterCount ? (
            <span className='catalog-toolbar__badge'>{activeFilterCount}</span>
          ) : null}
        </button>
        <span className='catalog-toolbar__count'>
          {catalog.results.length} من {products.length} صنف
        </span>
        <label className='visually-hidden' htmlFor='catalog-sort-compact'>
          الترتيب
        </label>
        <select
          id='catalog-sort-compact'
          className='field field--select catalog-toolbar__sort'
          value={catalog.sort}
          onChange={(event) => catalog.setSort(event.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className='catalog-layout'>
        <aside
          id='catalog-filters'
          className={`card filter-panel${filtersOpen ? '' : ' is-collapsed'}`}
          aria-label='أدوات التصفية'
        >
          <div className='filter-panel__head'>
            <h2 className='filter-panel__title'>الفلاتر</h2>
            <button
              type='button'
              className='icon-btn'
              onClick={() => setFiltersOpen(false)}
              aria-label='إغلاق الفلاتر'
            >
              <X size={20} aria-hidden='true' />
            </button>
          </div>

          <div className='filter-panel__search'>
            <label className='field-label' htmlFor='catalog-search'>
              <Search size={16} aria-hidden='true' /> ابحث بالاسم أو الوصف أو رمز الصنف
            </label>
            <input
              id='catalog-search'
              className='field'
              type='search'
              value={catalog.query}
              placeholder='مثال: بخور، ولاعة، كبريت، فحم'
              onChange={(event) => catalog.setQuery(event.target.value)}
            />
          </div>

          <fieldset className='filter-panel__group'>
            <legend className='field-label'>
              <SlidersHorizontal size={16} aria-hidden='true' /> القسم
            </legend>
            <div className='filter-list'>
              <button
                type='button'
                className={`filter-option${!catalog.categoryId ? ' is-active' : ''}`}
                onClick={() => catalog.setCategory('')}
                aria-pressed={!catalog.categoryId}
              >
                <span>كل الأقسام</span>
                <span className='filter-option__count'>{products.length}</span>
              </button>
              {sections.map((category) => (
                <FilterNode
                  key={category.id}
                  node={category}
                  depth={0}
                  selectedId={catalog.categoryId}
                  trailIds={trailIds}
                  openIds={openIds}
                  onToggle={toggleOpen}
                  onPick={pickCategory}
                  countOf={countByGroup}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className='filter-panel__group'>
            <legend className='field-label'>التصفية السريعة</legend>
            <div className='filter-list'>
              {TAG_OPTIONS.map((option) => (
                <button
                  key={option.id || 'all'}
                  type='button'
                  className={`filter-option${option.id === catalog.tag ? ' is-active' : ''}`}
                  onClick={() => {
                    catalog.setTag(option.id === catalog.tag ? '' : option.id)
                    closeFiltersIfCompact()
                  }}
                  aria-pressed={option.id === catalog.tag}
                >
                  <span>{option.label}</span>
                  {option.id ? <span className='filter-option__count'>{countByTag(option.id)}</span> : null}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className='filter-panel__group'>
            <legend className='field-label'>
              <Tag size={16} aria-hidden='true' /> السعر
            </legend>
            <p className='filter-price__span'>
              {priceSpan
                ? `في الكتالوج ${formatPrice(priceSpan.low, company.currencyLabel)} – ${formatPrice(
                    priceSpan.high,
                    company.currencyLabel
                  )}`
                : 'كل أصناف الكتالوج لسه بلا أسعار'}
            </p>
            <div className='filter-price'>
              <label className='visually-hidden' htmlFor='catalog-min-price'>
                أقل سعر
              </label>
              <input
                id='catalog-min-price'
                className='field'
                type='number'
                inputMode='numeric'
                min='0'
                step='1'
                placeholder='من'
                value={catalog.min}
                onChange={(event) => catalog.setMin(event.target.value)}
              />
              <span className='filter-price__dash' aria-hidden='true'>
                —
              </span>
              <label className='visually-hidden' htmlFor='catalog-max-price'>
                أعلى سعر
              </label>
              <input
                id='catalog-max-price'
                className='field'
                type='number'
                inputMode='numeric'
                min='0'
                step='1'
                placeholder='إلى'
                value={catalog.max}
                onChange={(event) => catalog.setMax(event.target.value)}
              />
            </div>
            <label className='filter-check'>
              <input
                type='checkbox'
                checked={catalog.inStock}
                onChange={(event) => catalog.setInStock(event.target.checked)}
              />
              المتوفر فقط
            </label>
          </fieldset>

          <div className='filter-panel__foot'>
            <div className='filter-panel__sort'>
              <label className='field-label' htmlFor='catalog-sort'>
                الترتيب
              </label>
              <select
                id='catalog-sort'
                className='field field--select'
                value={catalog.sort}
                onChange={(event) => catalog.setSort(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {catalog.hasFilters ? (
              <button type='button' className='btn btn--ghost btn--sm btn--block' onClick={resetFilters}>
                <RotateCcw size={15} aria-hidden='true' /> إزالة الفلاتر
              </button>
            ) : null}
          </div>
        </aside>

        <div className='catalog-main'>
          {catalog.results.length ? (
            <div className='grid grid--products'>
              {catalog.results.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : needsSectionGuide ? (
            <EmptyState
              icon={Layers}
              title={`«${activeCategory.name}» قسم بأقسامه`}
              hint='ما على هذا القسم أصناف مباشرة — أصنافه مسكّنة على أقسامه الفرعية. اختر قسمًا من الشريط فوق أو من الروابط هنا.'
              action={
                <div className='btn-row'>
                  {childrenOfActive.map((child) => (
                    <Link key={child.id} to={railHref(child.id)} className='btn btn--ghost btn--sm'>
                      {child.name}
                    </Link>
                  ))}
                  <Link to={railHref('')} className='btn btn--primary btn--sm'>
                    كل الأقسام
                  </Link>
                </div>
              }
            />
          ) : (
            <EmptyState
              title='لا نتائج مطابقة'
              hint='جرّب كلمة أقل، أو أزل الفلاتر لعرض كل الأصناف.'
              action={
                <div className='btn-row'>
                  <button type='button' className='btn btn--primary' onClick={resetFilters}>
                    <RotateCcw size={16} aria-hidden='true' /> إزالة الفلاتر
                  </button>
                  <Link to='/products' className='btn btn--ghost'>
                    كل المنتجات
                  </Link>
                </div>
              }
            />
          )}
        </div>
      </div>
    </>
  )
}
