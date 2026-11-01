// خريطة أقسام الدلتا كما أملاها التاجر: رئيسي ثم أقسامه الفرعية تحته مباشرة، والفرعي قد ينفرع مرة تالتة
// بل رابعة (بخور › بخور إنسام › هرمي › مخروطي)، والدوال تصعد `parent` بلا حد مكتوب للعمق.
// الأسماء منسوخة كما يملّيها التاجر. الترتيب في القائمة هو ترتيب العرض، وشجرة كل قسم تأتي متتالية بعده.
// `image` = صورة القسم التي يملّها التاجر نفسه ليراها العميل على البطاقة (لا تُختلق صورة لقسم بلا صورة).
// صورتان مما ملّاه التاجر ما صارتش `image`: «البخور» و«مواد سريعة الاشتعال» كانا بوسترات دعاية لشركة
// تانية عليها شعارها وادعاءاتها المطبوعة — وعرضها على بطاقتنا ادّعاء كلام لغيرنا. ملفّاها باقيان في
// `src/assets/categories/` بلا حذف، والبطاقة ترجع لـ`category.image ?? cover.image` فتعرض صنفًا ممثلًا.
import lightersCover from '../assets/categories/lighters.jpg'
import shoePolishCover from '../assets/categories/shoe-polish.jpg'
import razorsCover from '../assets/categories/razors.jpg'
import adhesivesCover from '../assets/categories/adhesives.jpg'
import hajayerCover from '../assets/categories/hajayer.jpg'
import medalsWalletsCover from '../assets/categories/medals-wallets.jpg'
import festivalsCover from '../assets/categories/festivals.jpg'
import khellaSelakaCover from '../assets/categories/khella-selaka.jpg'
import shampooGelCover from '../assets/categories/shampoo-gel.jpg'
import dentalCareCover from '../assets/categories/dental-care.jpg'
import homeCareCover from '../assets/categories/home-care.jpg'
import stationeryCover from '../assets/categories/stationery.jpg'
import kidsToysCover from '../assets/categories/kids-toys.jpg'
import electricalToolsCover from '../assets/categories/electrical-tools.jpg'

export const categories = [
  {
    id: 'incense',
    name: 'البخور',
    icon: 'Flame',
    image: null,
    description: 'أعواد وأقماع وقطع بخور للتدخين والتعطير.',
  },
  { id: 'incense-tijani', name: 'بخور تيجاني', parent: 'incense' },
  { id: 'incense-tijani-sticks', name: 'أعواد', parent: 'incense-tijani' },
  { id: 'incense-tijani-pyramid', name: 'هرمي', parent: 'incense-tijani' },
  { id: 'incense-tijani-carton', name: 'كرتونة متنوعة', parent: 'incense-tijani' },
  { id: 'incense-tijani-powder', name: 'بودر أكياس', parent: 'incense-tijani' },
  { id: 'incense-insam', name: 'بخور إنسام', parent: 'incense' },
  { id: 'incense-insam-sticks', name: 'أعواد', parent: 'incense-insam' },
  { id: 'incense-insam-pyramid', name: 'هرمي', parent: 'incense-insam' },
  { id: 'incense-insam-pyramid-cone', name: 'مخروطي', parent: 'incense-insam-pyramid' },
  { id: 'incense-insam-pyramid-mid', name: 'وسط', parent: 'incense-insam-pyramid' },
  { id: 'incense-insam-pyramid-premium', name: 'غالي', parent: 'incense-insam-pyramid' },
  { id: 'incense-insam-powder', name: 'بودر أكياس', parent: 'incense-insam' },
  { id: 'incense-insam-stand', name: 'استاند', parent: 'incense-insam' },
  { id: 'incense-insam-cubes', name: 'مكعبات', parent: 'incense-insam' },
  { id: 'incense-insam-arelax', name: 'أريلاكس', parent: 'incense-insam' },
  { id: 'incense-shaabi', name: 'بخور شعبي', parent: 'incense' },
  { id: 'incense-namos', name: 'بخور ناموس', parent: 'incense' },
  {
    id: 'lighters',
    name: 'الولاعات',
    icon: 'Cigarette',
    image: lightersCover,
    description: 'ولاعات جيب، معدنية، ورقبة طويلة.',
  },
  {
    id: 'shoe-polish',
    name: 'ملمعات الأحذية',
    icon: 'Footprints',
    image: shoePolishCover,
    description: 'تلميع الأحذية وأدواته.',
  },
  {
    id: 'razors',
    name: 'ماكينات الحلاقة',
    icon: 'Scissors',
    image: razorsCover,
    description: 'ماكينات الحلاقة وملحقاتها.',
  },
  {
    id: 'adhesives',
    name: 'اللواصق',
    icon: 'Droplets',
    image: adhesivesCover,
    description: 'لواصق للاستخدام المنزلي والصناعي.',
  },
  {
    // صحّحها التاجر 2026-10-31: «الحاجاير مكتوب غلط، اسمها حجائر» — نُسخة كما كتبها (بلا ألف ولام).
    id: 'hajayer',
    name: 'حجائر',
    icon: 'Gem',
    image: hajayerCover,
    description: 'أصناف هذا القسم تُحدَّد من التاجر.',
  },
  {
    id: 'medals-wallets',
    name: 'ميدالية ومحفظة',
    icon: 'Medal',
    image: medalsWalletsCover,
    description: 'ميداليات تذكارية ومحافظ.',
  },
  {
    // «مواد سريعة الاشتعال» قسم واحد يجمع ثلاثتِهم كما أمر التاجر 2026-10-31: «الكبريت والغاز والفحم
    // يبقى اسمها مواد سريعة الاشتعال»، واختار إن الأسماء التلاتة تفضل أقسامًا فرعية تحته.
    // أوصاف الأبناء منسوخة من إملائه نفسه، والوصف هنا ترتيبٌ لها لا كلام جديد.
    id: 'flammables',
    name: 'مواد سريعة الاشتعال',
    icon: 'FlameKindling',
    image: null,
    description: 'كبريت أمان ومطبخي وعازل للرطوبة، وفحم المعسل والشواء ومواد الإشعال، وغاز التعبئة والأسطوانات الصغيرة.',
  },
  {
    id: 'matches',
    name: 'الكبريت',
    parent: 'flammables',
    icon: 'Layers',
    description: 'كبريت أمان، مطبخي، وعازل للرطوبة.',
  },
  {
    id: 'charcoal',
    name: 'الفحم',
    parent: 'flammables',
    icon: 'FlameKindling',
    description: 'فحم المعسل والشواء ومواد الإشعال.',
  },
  { id: 'charcoal-fast-light', name: 'أقراص سريعة الاشتعال', parent: 'charcoal' },
  { id: 'charcoal-cubes', name: 'مكعبات فحم', parent: 'charcoal' },
  {
    id: 'gas',
    name: 'الغاز',
    parent: 'flammables',
    icon: 'Cylinder',
    description: 'غاز التعبئة والأسطوانات الصغيرة.',
  },
  {
    // «أعياد ومناسبات» قسم رئيسي جديد أملّه التاجر 2026-10-31، وأمر البالون ينزل قسمًا فرعيًا تحته
    id: 'festivals',
    name: 'أعياد ومناسبات',
    icon: 'PartyPopper',
    image: festivalsCover,
    description: 'أصناف هذا القسم تُحدَّد من التاجر.',
  },
  {
    id: 'balloons',
    name: 'البالون',
    parent: 'festivals',
    icon: 'Balloon',
    description: 'بالونات الأطفال والاحتفالات.',
  },
  {
    id: 'khella-selaka',
    name: 'خلة وسلاكة',
    icon: 'Paperclip',
    image: khellaSelakaCover,
    description: 'أصناف هذا القسم تُحدَّد من التاجر.',
  },
  {
    id: 'shampoo-gel',
    name: 'أكياس شامبو وجل',
    icon: 'ShowerHead',
    image: shampooGelCover,
    description: 'أكياس شامبو وجل للاستخدام الواحد.',
  },
  {
    id: 'dental-care',
    name: 'عناية الاسنان',
    icon: 'Smile',
    image: dentalCareCover,
    description: 'معاجين وفرش الأسنان.',
  },
  { id: 'dental-signal', name: 'سيجنال', parent: 'dental-care' },
  { id: 'dental-closeup', name: 'كلوزاب', parent: 'dental-care' },
  {
    id: 'home-care',
    name: 'عناية منزلية',
    icon: 'House',
    image: homeCareCover,
    description: 'مستلزمات العناية بالمنزل والملابس.',
  },
  { id: 'laundry-clip', name: 'مشبك غسيل', parent: 'home-care' },
  { id: 'naphthalene', name: 'نفتالين', parent: 'home-care' },
  { id: 'mouse-glue', name: 'لزقة فار', parent: 'home-care' },
  { id: 'estek-clothes', name: 'استك ملابس', parent: 'home-care' },
  { id: 'estek-coins', name: 'استك فلوس', parent: 'home-care' },
  {
    // ثلاثة أقسام رئيسية جديدة أملّها التاجر 2026-10-31 بأسمائها فقط: بلا أصناف، ووصفُها المؤقت هو حالها
    id: 'stationery',
    name: 'أدوات مكتبية',
    icon: 'PenLine',
    image: stationeryCover,
    description: 'أصناف هذا القسم تُحدَّد من التاجر.',
  },
  {
    id: 'kids-toys',
    name: 'ألعاب أطفال',
    icon: 'ToyBrick',
    image: kidsToysCover,
    description: 'أصناف هذا القسم تُحدَّد من التاجر.',
  },
  {
    id: 'electrical-tools',
    name: 'أدوات كهربائية',
    icon: 'PlugZap',
    image: electricalToolsCover,
    description: 'أصناف هذا القسم تُحدَّد من التاجر.',
  },
]

const byId = new Map(categories.map((category) => [category.id, category]))

export function findCategory(id) {
  return byId.get(id) ?? null
}

export function topCategories() {
  return categories.filter((category) => !category.parent)
}

export function subCategories(parentId) {
  return categories.filter((category) => category.parent === parentId)
}

export function rootCategory(id) {
  return categoryChain(id)[0] ?? null
}

// عدّاد القسم كما يُعرض: كل مستوى يعدّ اللي جواه على طول — أقسامه المباشرة لو فيه أقسام،
// وأصنافه لو ورقة ما تحتهاش أقسام. فالبخور «4 قسم» (عائلاته) وتحت كل واحدة عدّادها،
// و«عناية الأسنان» بلا أصناف لسه وجوه قسمان فتقول «2 قسم» بدل «0 صنف» اللي كانت توحى إن القسم فاضي خالص.
// ملاحظة: القسم اللي عليه أصناف بنفسه ومعاها أقسام (عناية منزلي، الفحم) يعدّ أقسامه، فأصنافه
// ما بتدخلش في الرقم ده — لسه بتبان في الفلترة وفي مدى الأسعار على البطاقة.
export function sectionCount(id, productCount) {
  const children = subCategories(id).length
  if (children > 0) return { value: children, unit: 'قسم' }
  return { value: productCount, unit: 'صنف' }
}

// الشريط الذي يفتح جنب المنتجات، ومستواه واحد لكل اختيار: القسم المختار يعرض أبناءه،
// والورقة التي لا أبناء تحتها تعرض إخوتها في أبيها، ومن غير اختيار تعرض الأقسام الرئيسية.
// «scope» هو الأب الذي تُعرض ورقته (أو null عند المستوى الأول)، وهو زرّ «كل <اسمه>» في أول الشريط.
export function sectionRail(selectedId) {
  const chain = selectedId ? categoryChain(selectedId) : []
  const node = chain[chain.length - 1] ?? null
  if (!node) return { scope: null, crumbs: [], items: topCategories() }
  const children = subCategories(node.id)
  if (children.length) return { scope: node, crumbs: chain, items: children }
  // حجائر ورقة رئيسية: مفيش إخوة تحت أب، فالشريط يرجع للأقسام الرئيسية نفسها
  const parent = node.parent ? findCategory(node.parent) : null
  if (!parent) return { scope: null, crumbs: [], items: topCategories() }
  return { scope: parent, crumbs: chain, items: subCategories(parent.id) }
}

// سلسلة الأقسام من الرئيسي حتى العقدة نفسها، مرتّبة من الأعلى لأسفل
export function categoryChain(id) {
  const chain = []
  const seen = new Set()
  let cursor = byId.get(id)
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id)
    chain.unshift(cursor)
    cursor = cursor.parent ? byId.get(cursor.parent) ?? null : null
  }
  return chain
}

// كل أسماء السلسلة — البحث يطابق الرئيسي والفرعي والمستوى التالت
export function categoryChainNames(id) {
  return categoryChain(id).map((category) => category.name)
}

// اختيار أي قسم يجمع كل ما تحته بأي عمق، واختيار ورقة يبقى على نفسها
export function categoryGroupIds(id) {
  const group = new Set([id])
  categories.forEach((category) => {
    if (category.id !== id && categoryChain(category.id).some((node) => node.id === id)) {
      group.add(category.id)
    }
  })
  return group
}

// جيران الصنف في «أصناف مشابهة»: ورقة المجموعة التي ينتمي إليها القسم مباشرة
export function categoryNeighborhoodIds(id) {
  const category = byId.get(id)
  return category?.parent ? categoryGroupIds(category.parent) : categoryGroupIds(id)
}

export function categoryLabel(id) {
  return rootCategory(id)?.name ?? 'غير مصنّف'
}

export function categoryPathLabel(id) {
  const names = categoryChainNames(id)
  return names.length ? names.join(' › ') : 'غير مصنّف'
}
