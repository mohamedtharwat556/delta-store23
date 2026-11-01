const LATIN_DIGITS = '0123456789'

// نطاقات علامات التركيب العربية (حركات، تنوين، تطويل، مد، همزة فوق/تحت، ألف خنجة)
// تُكتب كأرقام عشرية حتى لا تختلط بنطاق الأحرف العربية نفسها.
const MARK_RANGES = [
  [0x610, 0x61a],
  [0x640, 0x640],
  [0x64b, 0x655],
  [0x670, 0x670],
  [0x6dd, 0x6dd],
  [0x6df, 0x6e0],
  [0x6e7, 0x6e8],
  [0x6ea, 0x6ed],
  [0x711, 0x711],
]

// صور الحروف التي يكتبها العميل بأكثر من طريقة: { من: إلى }
const LETTER_MAP = {
  0x623: 0x627, // أ -> ا
  0x625: 0x627, // إ -> ا
  0x622: 0x627, // آ -> ا
  0x671: 0x627, // ٱ -> ا
  0x624: 0x648, // ؤ -> و
  0x626: 0x64a, // ئ -> ي
  0x649: 0x64a, // ى -> ي
  0x629: 0x647, // ة -> ه
}

function isMark(code) {
  return MARK_RANGES.some(([from, to]) => code >= from && code <= to)
}

function digitToLatin(code) {
  if (code >= 0x660 && code <= 0x669) return LATIN_DIGITS[code - 0x660]
  if (code >= 0x6f0 && code <= 0x6f9) return LATIN_DIGITS[code - 0x6f0]
  return null
}

export function normalizeArabic(value) {
  const lowered = String(value ?? '').toLowerCase()
  let out = ''
  for (const char of lowered) {
    const code = char.codePointAt(0)
    if (isMark(code)) continue
    const digit = digitToLatin(code)
    if (digit) {
      out += digit
      continue
    }
    const mapped = LETTER_MAP[code]
    out += mapped ? String.fromCodePoint(mapped) : char
  }
  return out.replace(/\s+/g, ' ').trim()
}

// صيغ البحث البديلة: مع/بدون أل التعريف، ومفرد تقريبي للجمع
export function searchVariants(token) {
  const normalized = normalizeArabic(token)
  if (!normalized) return []
  const variants = new Set([normalized])
  const alefLaam = String.fromCodePoint(0x627, 0x644)
  const bare = normalized.startsWith(alefLaam) && normalized.length > 5
    ? normalized.slice(2)
    : normalized
  variants.add(bare)
  const pluralSuffixes = ['ات', 'ين', 'ون', 'ان']
  for (const suffix of pluralSuffixes) {
    if (bare.length > 4 && bare.endsWith(suffix)) variants.add(bare.slice(0, -suffix.length))
  }
  return [...variants]
}

export function tokenizeQuery(query) {
  return normalizeArabic(query).split(' ').filter(Boolean)
}

export function buildHaystack(fields) {
  const joined = fields
    .filter((field) => field !== null && field !== undefined && field !== '')
    .join(' ')
  return normalizeArabic(joined)
}

export function matchesAllTokens(haystack, tokens) {
  if (!tokens.length) return true
  const variants = tokens.map((token) => searchVariants(token))
  return variants.every((tokenVariants) => tokenVariants.some((variant) => haystack.includes(variant)))
}
