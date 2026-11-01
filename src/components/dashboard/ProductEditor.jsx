import { useState } from 'react'
import { CircleAlert, Save, X } from 'lucide-react'
import ProductImage from '../ui/ProductImage.jsx'
import { categoryChain } from '../../data/categories.js'
import { TAG_OPTIONS, formFromProduct, validateProductForm, withOfferTag } from '../../utils/productForm.js'

const TEXT_FIELDS = [
  { name: 'name', label: 'اسم الصنف', required: true, placeholder: 'مثال: بخور أعواد — علبة 20 عود' },
  { name: 'unit', label: 'وحدة البيع', required: true, placeholder: 'علبة / رول / كيس / قطعة' },
  { name: 'countUnit', label: 'وحدة العد', placeholder: 'عود / قطعة / كيس' },
  { name: 'packSize', label: 'المحتوى في الوحدة', numeric: true, placeholder: 'مثال: 20' },
  { name: 'location', label: 'مكان الصنف في المخزن', placeholder: 'مثال: رف B3 — عنبر ١' },
]

const PRICE_FIELDS = [
  { name: 'retailPrice', label: 'السعر القطاعي', required: true },
  { name: 'offerPrice', label: 'سعر العرض' },
  { name: 'wholesalePrice', label: 'سعر الجملة' },
  { name: 'wholesaleMinQuantity', label: 'حد الجملة (وحدات)', numeric: true },
  { name: 'stock', label: 'المخزون المتاح', required: true, numeric: true },
]

export default function ProductEditor({ product, categoryOptions, imageOptions, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => formFromProduct(product))
  const [errors, setErrors] = useState({})

  const setValue = (name) => (event) => {
    const next = event.target.value
    setValues((current) => ({ ...current, [name]: next }))
  }

  const toggleTag = (tagId) => (event) => {
    setValues((current) => {
      const tags = (current.tags ?? []).filter((tag) => tag !== tagId)
      return { ...current, tags: event.target.checked ? [...tags, tagId] : tags }
    })
  }

  const submit = (event) => {
    event.preventDefault()
    const { errors: nextErrors, cleaned } = validateProductForm(values, {
      categoryIds: categoryOptions.map((category) => category.id),
      imagePaths: imageOptions.map((option) => option.value),
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstInvalid = [...TEXT_FIELDS, ...PRICE_FIELDS].find((field) => nextErrors[field.name])
      document.getElementById(`pe-${firstInvalid?.name ?? 'name'}`)?.focus()
      return
    }
    onSubmit(withOfferTag(cleaned), values.slug)
  }

  const fieldLabel = (field) => (
    <label className='field-label' htmlFor={`pe-${field.name}`}>
      {field.label}{' '}
      {field.required ? (
        <span className='field-required'>*</span>
      ) : (
        <span className='field-optional'>اختياري</span>
      )}
    </label>
  )

  const fieldError = (name) =>
    errors[name] ? (
      <p className='field-error' id={`pe-${name}-error`} role='alert'>
        {errors[name]}
      </p>
    ) : null

  const describedBy = (name) => (errors[name] ? `pe-${name}-error` : undefined)

  return (
    <form className='card dash-editor' onSubmit={submit} noValidate>
      <header className='dash-editor__head'>
        <h3>{product ? `تعديل: ${product.name}` : 'إضافة صنف جديد'}</h3>
        <button type='button' className='icon-btn' onClick={onCancel} aria-label='إغلاق النموذج'>
          <X size={18} aria-hidden='true' />
        </button>
      </header>

      <div className='dash-editor__grid'>
        {TEXT_FIELDS.map((field) => (
          <div className='dash-field' key={field.name}>
            {fieldLabel(field)}
            <input
              id={`pe-${field.name}`}
              className='field'
              type='text'
              inputMode={field.numeric ? 'numeric' : 'text'}
              value={values[field.name]}
              onChange={setValue(field.name)}
              placeholder={field.placeholder}
              autoComplete='off'
              aria-invalid={errors[field.name] ? 'true' : 'false'}
              aria-describedby={describedBy(field.name)}
            />
            {fieldError(field.name)}
          </div>
        ))}

        <div className='dash-field'>
          <label className='field-label' htmlFor='pe-categoryId'>
            القسم <span className='field-required'>*</span>
          </label>
          <select
            id='pe-categoryId'
            className='field field--select'
            value={values.categoryId}
            onChange={setValue('categoryId')}
            aria-invalid={errors.categoryId ? 'true' : 'false'}
            aria-describedby={describedBy('categoryId')}
          >
            <option value=''>اختر القسم</option>
            {categoryOptions
              .filter((category) => !category.parent)
              .map((category) => {
                const descendants = categoryOptions.filter(
                  (item) => item.id !== category.id && categoryChain(item.id).some((node) => node.id === category.id)
                )
                if (!descendants.length) {
                  return (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  )
                }
                return (
                  <optgroup key={category.id} label={category.name}>
                    <option value={category.id}>{category.name} (القسم الرئيسي)</option>
                    {descendants.map((item) => (
                      <option key={item.id} value={item.id}>
                        {'— '.repeat(categoryChain(item.id).length - 1)}
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
          </select>
          {fieldError('categoryId')}
        </div>

        <div className='dash-field dash-field--wide'>
          <label className='field-label' htmlFor='pe-description'>
            الوصف <span className='field-optional'>اختياري</span>
          </label>
          <textarea
            id='pe-description'
            className='field'
            rows={2}
            value={values.description}
            onChange={setValue('description')}
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={describedBy('description')}
          />
          {fieldError('description')}
        </div>

        {PRICE_FIELDS.map((field) => (
          <div className='dash-field' key={field.name}>
            {fieldLabel(field)}
            <input
              id={`pe-${field.name}`}
              className='field'
              type='text'
              inputMode={field.numeric ? 'numeric' : 'decimal'}
              value={values[field.name]}
              onChange={setValue(field.name)}
              placeholder={field.name === 'wholesaleMinQuantity' ? 'مثال: 24' : '٠'}
              autoComplete='off'
              aria-invalid={errors[field.name] ? 'true' : 'false'}
              aria-describedby={describedBy(field.name)}
            />
            {fieldError(field.name)}
          </div>
        ))}

        <div className='dash-field'>
          <label className='field-label' htmlFor='pe-slug'>
            الرابط المختصر <span className='field-optional'>لاتيني، اختياري</span>
          </label>
          <input
            id='pe-slug'
            className='field'
            type='text'
            value={values.slug}
            onChange={setValue('slug')}
            placeholder='bakhoor-sticks-box-20'
            autoComplete='off'
            aria-invalid={errors.slug ? 'true' : 'false'}
            aria-describedby={describedBy('slug')}
          />
          {fieldError('slug')}
        </div>
      </div>

      <fieldset className='dash-field dash-field--wide'>
        <legend className='field-label'>وسوم العرض</legend>
        <div className='filter-bar'>
          {TAG_OPTIONS.map((option) => (
            <label key={option.id} className='chip chip--filter dash-tag'>
              <input
                type='checkbox'
                checked={(values.tags ?? []).includes(option.id)}
                onChange={toggleTag(option.id)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className='section__subtitle'>وسم «عرض» يتفعّل تلقائيًا عند كتابة سعر عرض.</p>
      </fieldset>

      <fieldset className='dash-field dash-field--wide'>
        <legend className='field-label'>صورة الصنف (من الصور المحلية فقط)</legend>
        {errors.image ? (
          <p className='field-error' role='alert'>
            <CircleAlert size={14} aria-hidden='true' /> {errors.image}
          </p>
        ) : null}
        <div className='dash-image-picker'>
          {imageOptions.map((option) => (
            <label key={option.value} className='dash-image-option'>
              <input
                type='radio'
                name='dash-product-image'
                value={option.value}
                checked={values.image === option.value}
                onChange={setValue('image')}
              />
              <ProductImage src={option.value} alt={option.label} ratio='square' />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className='btn-row'>
        <button type='submit' className='btn btn--primary'>
          <Save size={16} aria-hidden='true' /> {product ? 'حفظ التعديل' : 'إضافة الصنف'}
        </button>
        <button type='button' className='btn btn--ghost' onClick={onCancel}>
          إلغاء
        </button>
        {Object.keys(errors).length ? (
          <span className='notice notice--inline'>
            راجع الحقول المعلَّمة بالأحمر قبل الحفظ.
          </span>
        ) : null}
      </div>

      <p className='section__subtitle'>
        ترك سعر الجملة أو حدّه فارغًا يجعل الصنف قطاعيًا فقط، وترك سعر العرض يلغي وسم «عرض» تلقائيًا.
      </p>
    </form>
  )
}
