import { normalizeArabic } from './arabic.js'

export const TAG_OPTIONS = [
  { id: 'best-seller', label: 'الأكثر طلبًا' },
  { id: 'offer', label: 'عرض' },
]

export const EMPTY_FORM = {
  name: '',
  categoryId: '',
  unit: '',
  description: '',
  image: '',
  retailPrice: '',
  offerPrice: '',
  wholesalePrice: '',
  wholesaleMinQuantity: '',
  stock: '',
  packSize: '',
  countUnit: '',
  location: '',
  slug: '',
  tags: [],
}

function toText(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

// يقبل الأرقام العربية ويهمل الفراغات والشرطات غير مفيدة
export function parseAmount(value) {
  const digits = normalizeArabic(toText(value)).replace(/[^\d.]/g, '')
  if (!digits) return null
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : null
}

// رقم واحد في كل الحقول: فارغ = صفر، غير ذلك يُقرأ بالعربي أو اللاتيني
export function parsePriceField(value) {
  const raw = String(value ?? '').trim()
  return raw ? parseAmount(raw) : null
}

// الإشارة السالبة تُهمل أثناء التنقية، فظهورها يعني رقمًا مرفوضًا لا صفرًا
function hasSign(value) {
  return /[-−]/.test(String(value ?? ''))
}

// حقل رقمي للتسعير والمخزون: يرفض الإشارة السالبة ويحوّل الفراغ إلى null
function readNumericField(value, message) {
  if (hasSign(value)) return { value: null, invalid: message }
  const raw = String(value ?? '').trim()
  return { value: raw ? parseAmount(raw) : null }
}

// تحقق رباعي الأسعار في تبويب التسعير: قطاعي / عرض / جملة / حد الجملة
export function validatePriceDraft(draft) {
  const source = draft ?? {}
  const errors = {}
  const retailRead = readNumericField(source.retailPrice, 'السعر رقم موجب بلا إشارة.')
  const offerRead = readNumericField(source.offerPrice, 'سعر العرض رقم موجب بلا إشارة.')
  const wholesaleRead = readNumericField(source.wholesalePrice, 'سعر الجملة رقم موجب بلا إشارة.')
  const minimumRead = readNumericField(source.wholesaleMinQuantity, 'حد الجملة رقم صحيح بلا إشارة.')
  const retail = retailRead.value
  const offer = offerRead.value
  const wholesale = wholesaleRead.value
  const minimum = minimumRead.value

  if (retailRead.invalid) errors.retailPrice = retailRead.invalid
  else if (retail === null) errors.retailPrice = 'اكتب السعر القطاعي بأرقام واضحة.'
  else if (retail <= 0) errors.retailPrice = 'السعر القطاعي لازم يكون أكبر من صفر.'
  else if (retail > 100000) errors.retailPrice = 'السعر القطاعي كبير بصورة غير منطقية.'

  if (offerRead.invalid) errors.offerPrice = offerRead.invalid
  else if (offer !== null && offer <= 0) errors.offerPrice = 'سعر العرض لازم يكون أكبر من صفر.'
  else if (offer !== null && retail !== null && offer >= retail) {
    errors.offerPrice = 'سعر العرض لازم يكون أقل من السعر القطاعي.'
  }

  if (wholesaleRead.invalid) errors.wholesalePrice = wholesaleRead.invalid
  else if (wholesale !== null && wholesale <= 0) errors.wholesalePrice = 'سعر الجملة لازم يكون أكبر من صفر.'
  else if (wholesale !== null && retail !== null && wholesale >= retail) {
    errors.wholesalePrice = 'سعر الجملة لازم يكون أقل من السعر القطاعي.'
  } else if (wholesale === null && minimum !== null) {
    errors.wholesalePrice = 'حد جملة بلا سعر جملة — اكتب سعر الجملة أو احذف الحد.'
  }

  if (minimumRead.invalid) errors.wholesaleMinQuantity = minimumRead.invalid
  else if (wholesale !== null && minimum === null) {
    errors.wholesaleMinQuantity = 'حد الجملة مطلوب بعد تحديد سعر الجملة.'
  } else if (minimum !== null && minimum < 2) {
    errors.wholesaleMinQuantity = 'حد الجملة أقل حاجة وحدتين.'
  }

  return { errors, values: { retail, offer, wholesale, minimum } }
}

export function formFromProduct(product) {
  if (!product) return { ...EMPTY_FORM }
  return {
    name: toText(product.name),
    categoryId: toText(product.categoryId),
    unit: toText(product.unit),
    description: toText(product.description),
    image: toText(product.image),
    retailPrice: toText(product.retailPrice),
    offerPrice: toText(product.offerPrice ?? ''),
    wholesalePrice: toText(product.wholesalePrice ?? ''),
    wholesaleMinQuantity: toText(product.wholesaleMinQuantity ?? ''),
    stock: toText(product.stock),
    packSize: toText(product.packSize ?? ''),
    countUnit: toText(product.countUnit ?? ''),
    location: toText(product.location ?? ''),
    slug: toText(product.slug),
    tags: Array.isArray(product.tags) ? [...product.tags] : [],
  }
}

const MAX_TEXT = { name: 80, description: 240, unit: 16, countUnit: 16, location: 24, slug: 60 }

export function validateProductForm(values, { categoryIds = [], imagePaths = [] } = {}) {
  const source = values ?? EMPTY_FORM
  const errors = {}

  const name = toText(source.name).trim()
  if (name.length < 2) errors.name = 'اسم الصنف مطلوب (حرفان على الأقل).'
  else if (name.length > MAX_TEXT.name) errors.name = 'اسم الصنف طويل (٨٠ حرفًا كحد أقصى).'

  if (!toText(source.categoryId).trim()) errors.categoryId = 'اختر القسم.'
  else if (categoryIds.length && !categoryIds.includes(toText(source.categoryId).trim())) {
    errors.categoryId = 'القسم غير موجود في قائمة الأقسام.'
  }

  const unit = toText(source.unit).trim()
  if (!unit) errors.unit = 'وحدة البيع مطلوبة (علبة / رول / قطعة…).'
  else if (unit.length > MAX_TEXT.unit) errors.unit = 'وحدة البيع طويلة.'

  const description = toText(source.description).trim()
  if (description.length > MAX_TEXT.description) {
    errors.description = 'الوصف طويل (٢٤٠ حرفًا كحد أقصى).'
  }

  if (!toText(source.image).trim()) errors.image = 'اختر صورة من الصور المحلية.'
  else if (imagePaths.length && !imagePaths.includes(source.image)) {
    errors.image = 'الصورة المختارة ليست ضمن الصور المحلية المعروفة.'
  }

  const retailRead = readNumericField(source.retailPrice, 'السعر رقم موجب بلا إشارة.')
  const retailPrice = retailRead.value
  if (retailRead.invalid) errors.retailPrice = retailRead.invalid
  else if (retailPrice === null) errors.retailPrice = 'السعر القطاعي مطلوب.'
  else if (retailPrice <= 0) errors.retailPrice = 'السعر لازم يكون أكبر من صفر.'
  else if (retailPrice > 100000) errors.retailPrice = 'السعر كبير بصورة غير منطقية.'

  const offerRead = readNumericField(source.offerPrice, 'سعر العرض رقم موجب بلا إشارة.')
  const offerPrice = offerRead.value
  if (offerRead.invalid) errors.offerPrice = offerRead.invalid
  else if (toText(source.offerPrice).trim() && offerPrice === null) {
    errors.offerPrice = 'سعر العرض لازم يكون رقمًا.'
  } else if (offerPrice !== null && retailPrice !== null && offerPrice >= retailPrice) {
    errors.offerPrice = 'سعر العرض لازم يكون أقل من السعر القطاعي.'
  }

  const wholesaleRead = readNumericField(source.wholesalePrice, 'سعر الجملة رقم موجب بلا إشارة.')
  const wholesalePrice = wholesaleRead.value
  const wholesaleMinRead = readNumericField(source.wholesaleMinQuantity, 'حد الجملة رقم صحيح بلا إشارة.')
  const wholesaleMinQuantity = wholesaleMinRead.value
  if (wholesaleRead.invalid) errors.wholesalePrice = wholesaleRead.invalid
  else if (toText(source.wholesalePrice).trim() && (wholesalePrice === null || wholesalePrice <= 0)) {
    errors.wholesalePrice = 'سعر الجملة لازم يكون رقمًا أكبر من صفر.'
  } else if (wholesalePrice !== null && retailPrice !== null && wholesalePrice >= retailPrice) {
    errors.wholesalePrice = 'سعر الجملة لازم يكون أقل من السعر القطاعي.'
  }
  if (wholesaleMinRead.invalid) errors.wholesaleMinQuantity = wholesaleMinRead.invalid
  else if (wholesalePrice !== null && wholesaleMinQuantity === null) {
    errors.wholesaleMinQuantity = 'حد الجملة مطلوب مع سعر الجملة.'
  } else if (wholesaleMinQuantity !== null && wholesaleMinQuantity < 2) {
    errors.wholesaleMinQuantity = 'حد الجملة أقل حاجة وحدتين.'
  }

  const stockRead = readNumericField(source.stock, 'المخزون رقم صحيح بلا إشارة سالبة.')
  const stock = stockRead.value
  if (stockRead.invalid) errors.stock = stockRead.invalid
  else if (stock === null) errors.stock = 'المخزون مطلوب (صفر لو غير متوفر).'
  else if (!Number.isInteger(stock)) errors.stock = 'المخزون عدد صحيح من الوحدات.'

  const packRead = readNumericField(source.packSize, 'محتوى العبوة رقم صحيح بلا إشارة.')
  const packSize = packRead.value
  if (packRead.invalid) errors.packSize = packRead.invalid
  else if (packSize !== null && packSize < 1) errors.packSize = 'محتوى العبوة رقم صحيح من ١.'

  const countUnit = toText(source.countUnit).trim()
  if (countUnit.length > MAX_TEXT.countUnit) errors.countUnit = 'اسم وحدة العد طويل.'

  // مكان الرف معلومة داخلية للمخزن: تُختصر ولا تظهر للعميل في المتجر
  const location = toText(source.location).trim()
  if (location.length > MAX_TEXT.location) {
    errors.location = 'مكان الصنف مختصر (٢٤ حرفًا كحد أقصى — مثل: رف B3).'
  }

  const slug = toText(source.slug).trim().toLowerCase()
  if (slug && slug.length > MAX_TEXT.slug) errors.slug = 'الرابط المختصر طويل (٦٠ حرفًا).'

  const tags = (Array.isArray(source.tags) ? source.tags : []).filter((tag) =>
    TAG_OPTIONS.some((option) => option.id === tag)
  )

  return {
    errors,
    cleaned: {
      name,
      categoryId: toText(source.categoryId).trim(),
      unit,
      description,
      image: toText(source.image).trim(),
      retailPrice,
      offerPrice,
      wholesalePrice,
      wholesaleMinQuantity,
      stock,
      packSize,
      countUnit,
      location,
      slug,
      tags,
    },
  }
}

// حقل سعر العرض ووسم «عرض» لازم يبقوا متفقين حتى لا تظهر بيانات متناقضة في المتجر
export function withOfferTag(cleaned) {
  const hasOffer = Boolean(cleaned.offerPrice)
  const tags = (cleaned.tags ?? []).filter((tag) => tag !== 'offer')
  return { ...cleaned, tags: hasOffer ? [...tags, 'offer'] : tags }
}

export function buildProductRecord(cleaned, { id, slug }) {
  const record = {
    id,
    slug,
    name: cleaned.name,
    description: cleaned.description,
    categoryId: cleaned.categoryId,
    image: cleaned.image,
    unit: cleaned.unit,
    retailPrice: cleaned.retailPrice,
    stock: cleaned.stock,
    tags: cleaned.tags,
  }
  if (cleaned.packSize) record.packSize = cleaned.packSize
  if (cleaned.countUnit) record.countUnit = cleaned.countUnit
  if (cleaned.location) record.location = cleaned.location
  if (cleaned.offerPrice) record.offerPrice = cleaned.offerPrice
  if (cleaned.wholesalePrice) {
    record.wholesalePrice = cleaned.wholesalePrice
    record.wholesaleMinQuantity = cleaned.wholesaleMinQuantity
  }
  return record
}
