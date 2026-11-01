import { describe, expect, it } from 'vitest'
import { products, similarProducts } from './products.js'
import {
  categories,
  categoryChain,
  categoryChainNames,
  categoryGroupIds,
  categoryLabel,
  categoryNeighborhoodIds,
  categoryPathLabel,
  findCategory,
  rootCategory,
  sectionCount,
  sectionRail,
  subCategories,
  topCategories,
} from './categories.js'

const SECTION_NAMES = [
  'البخور',
  'الولاعات',
  'ملمعات الأحذية',
  'ماكينات الحلاقة',
  'اللواصق',
  'حجائر',
  'ميدالية ومحفظة',
  'مواد سريعة الاشتعال',
  'أعياد ومناسبات',
  'خلة وسلاكة',
  'أكياس شامبو وجل',
  'عناية الاسنان',
  'عناية منزلية',
  'أدوات مكتبية',
  'ألعاب أطفال',
  'أدوات كهربائية',
]

const TIJANI_GROUP = [
  'incense-tijani',
  'incense-tijani-sticks',
  'incense-tijani-pyramid',
  'incense-tijani-carton',
  'incense-tijani-powder',
]

const INSAM_GROUP = [
  'incense-insam',
  'incense-insam-sticks',
  'incense-insam-pyramid',
  'incense-insam-pyramid-cone',
  'incense-insam-pyramid-mid',
  'incense-insam-pyramid-premium',
  'incense-insam-powder',
  'incense-insam-stand',
  'incense-insam-cubes',
  'incense-insam-arelax',
]

// «هرمي» إنسام أب لثلاث درجات: مجموعته الورقة التي تحتها لا باقية العائلة
const INSAM_PYRAMID_GROUP = [
  'incense-insam-pyramid',
  'incense-insam-pyramid-cone',
  'incense-insam-pyramid-mid',
  'incense-insam-pyramid-premium',
]

const INCENSE_GROUP = ['incense', ...TIJANI_GROUP, ...INSAM_GROUP, 'incense-shaabi', 'incense-namos']

// «مواد سريعة الاشتعال» أبو الكبريت والفحم والغاز، وشجرة الفحم الفرعية جوه من وراه
const FLAMMABLE_GROUP = ['flammables', 'matches', 'charcoal', 'charcoal-fast-light', 'charcoal-cubes', 'gas']

describe('خريطة أقسام التاجر', () => {
  it('تحفظ الأقسام الرئيسية الستة عشر بأسمائها وإملائها وترتيبها كما ملّيتها', () => {
    expect(topCategories().map((category) => category.name)).toEqual(SECTION_NAMES)
  })

  it('كل قسم فرعي له أب موجود، وسلسلته تصعد حتى قسم رئيسي بلا تكرار', () => {
    categories
      .filter((category) => category.parent)
      .forEach((category) => {
        expect(findCategory(category.parent)).not.toBeNull()
        const chain = categoryChain(category.id)
        // السلسلة مرتّبة من الرئيسي حتى العقدة نفسها، فلا دورة ولا تفرّع عرضي
        expect(chain[chain.length - 1].id).toBe(category.id)
        expect(new Set(chain.map((node) => node.id)).size).toBe(chain.length)
        expect(chain[0].parent).toBeFalsy()
        // إنسام وحها وصلت لأربعة مستويات (بخور › إنسام › هرمي › مخروطي)، والباقي أقل
        expect(chain.length).toBeLessThanOrEqual(4)
      })
  })

  it('شجرة كل قسم تأتي متتالية بعده في القائمة، بترتيبها العمقي', () => {
    categories.forEach((parent) => {
      const group = [...categoryGroupIds(parent.id)]
      if (group.length === 1) return
      const firstIndex = categories.findIndex((category) => category.id === parent.id)
      // الكتلة التي تلي الأب مباشرة = كل ذريته بالترتيب، بلا فاصل من قسم آخر
      expect(categories.slice(firstIndex + 1, firstIndex + group.length).map((c) => c.id)).toEqual(group.slice(1))
      // والابن المباشر الأول يأتي بعد أبيه فورًا
      expect(categories[firstIndex + 1].parent).toBe(parent.id)
    })
  })

  it('القسم الرئيسي يجمع أصناف أقسامه الفرعية، والفرعي يبقى على نفسه', () => {
    expect([...categoryGroupIds('charcoal')]).toEqual(['charcoal', 'charcoal-fast-light', 'charcoal-cubes'])
    expect([...categoryGroupIds('charcoal-cubes')]).toEqual(['charcoal-cubes'])
    const cubes = products.find((product) => product.id === 'DL-4001')
    expect(categoryGroupIds('charcoal').has(cubes.categoryId)).toBe(true)
    expect(categoryGroupIds('charcoal-fast-light').has(cubes.categoryId)).toBe(false)
  })

  it('بخور تيجاني يطلع منه أربع أقسام: أعواد وهرمي وكرتونة متنوعة وبودر أكياس', () => {
    expect(subCategories('incense-tijani').map((category) => category.name)).toEqual([
      'أعواد',
      'هرمي',
      'كرتونة متنوعة',
      'بودر أكياس',
    ])
    expect([...categoryGroupIds('incense')]).toEqual(INCENSE_GROUP)
    expect([...categoryGroupIds('incense-tijani')]).toEqual(TIJANI_GROUP)
    expect([...categoryGroupIds('incense-tijani-powder')]).toEqual(['incense-tijani-powder'])
    expect(categoryChainNames('incense-tijani-sticks')).toEqual(['البخور', 'بخور تيجاني', 'أعواد'])
    expect(categoryChainNames('incense-tijani-carton')).toEqual(['البخور', 'بخور تيجاني', 'كرتونة متنوعة'])
  })

  it('بخور إنسام يطلع منه ست أقسام، و«هرمي» منها فيه ثلاث درجات', () => {
    expect(subCategories('incense-insam').map((category) => category.name)).toEqual([
      'أعواد',
      'هرمي',
      'بودر أكياس',
      'استاند',
      'مكعبات',
      'أريلاكس',
    ])
    expect(subCategories('incense-insam-pyramid').map((category) => category.name)).toEqual([
      'مخروطي',
      'وسط',
      'غالي',
    ])
    expect([...categoryGroupIds('incense-insam')]).toEqual(INSAM_GROUP)
    expect([...categoryGroupIds('incense-insam-pyramid')]).toEqual(INSAM_PYRAMID_GROUP)
    expect(categoryChainNames('incense-insam-pyramid-cone')).toEqual([
      'البخور',
      'بخور إنسام',
      'هرمي',
      'مخروطي',
    ])
    expect(categoryPathLabel('incense-insam-pyramid-premium')).toBe('البخور › بخور إنسام › هرمي › غالي')
    expect(categoryPathLabel('incense-insam-arelax')).toBe('البخور › بخور إنسام › أريلاكس')
    // قسم «أعواد» في العائلتين مختلفان: لا يُخلط أعواد إنسام مع أعواد تيجاني
    expect(categoryGroupIds('incense-insam-sticks').has('incense-tijani-sticks')).toBe(false)
    expect(
      products.filter((product) => categoryGroupIds('incense-insam').has(product.categoryId)).length
    ).toBe(22)
    // واختيار «هرمي» يجمع الدرجات التلات، واختيار درجة يفلتر على نفسها
    // مخروطي صنف واحد باسم الدرجة (التاجر دمج أصنافها)، فعدّ «هرمي» = 1 + 5 + 3
    const inGroup = (group) => products.filter((p) => categoryGroupIds(group).has(p.categoryId)).length
    expect(inGroup('incense-insam-pyramid')).toBe(9)
    expect(inGroup('incense-insam-pyramid-cone')).toBe(1)
    expect(inGroup('incense-insam-pyramid-mid')).toBe(5)
    expect(inGroup('incense-insam-pyramid-premium')).toBe(3)
  })

  it('أصناف إنسام مسعّرة بالقطاعي كما أملى التاجر، وبلا جملة أو مخزون مختلَق', () => {
    const insam = products.filter((product) => categoryGroupIds('incense-insam').has(product.categoryId))
    expect(insam.every((product) => Number.isFinite(product.retailPrice) && product.retailPrice > 0)).toBe(true)
    expect(insam.every((product) => product.wholesalePrice === null)).toBe(true)
    expect(insam.every((product) => product.stock === null && product.unit === null)).toBe(true)
    expect(insam.find((product) => product.id === 'DL-1201').retailPrice).toBe(740)
    // درجة الهرمي تُسعَّر بالجملة لا بالصنف: مخروطي 590 ووسط 865 وغالي 1160
    const priceOf = (group) =>
      [...new Set(products.filter((p) => categoryGroupIds(group).has(p.categoryId)).map((p) => p.retailPrice))]
    expect(priceOf('incense-insam-pyramid-cone')).toEqual([590])
    // درجة مخروطي صنف واحد باسمها كما أملى التاجر (بعد ما كان فيها 18 صنفًا)، مش قائمة أصناف
    expect(
      products.filter((p) => p.categoryId === 'incense-insam-pyramid-cone').map((p) => p.name)
    ).toEqual(['مخروطي'])
    expect(priceOf('incense-insam-pyramid-mid')).toEqual([865])
    expect(priceOf('incense-insam-pyramid-premium')).toEqual([1160])
    // سعر عشري كما أملاه التاجر: أريلاكس شلال 172.5
    expect(insam.find((product) => product.id === 'DL-1239').retailPrice).toBe(172.5)
  })

  it('بخور شعبي قسم واحد جواه صنفان بالاسمين اللي أملاهما التاجر', () => {
    expect(subCategories('incense').map((category) => category.name)).toEqual([
      'بخور تيجاني',
      'بخور إنسام',
      'بخور شعبي',
      'بخور ناموس',
    ])
    expect(findCategory('incense-shaabi')).not.toBeNull()
    // «بخور شعبي» ورقة مباشرة تحت البخور بلا أقسام تحتها، وصنفاه يحملان اسمه
    expect(subCategories('incense-shaabi')).toEqual([])
    const shaabi = products.filter((product) => product.categoryId === 'incense-shaabi')
    expect(shaabi.map((product) => product.name)).toEqual(['بخور الشربيني', 'بخور شعبي'])
    expect(shaabi.map((product) => product.id)).toEqual(['DL-1301', 'DL-1302'])
    // الاسم والقسم فقط: ما أملش سعرًا ولا عبوة ولا مخزون، فكلها null بلا اختلاق
    expect(shaabi.every((product) => product.retailPrice === null && product.wholesalePrice === null)).toBe(true)
    expect(shaabi.every((product) => product.unit === null && product.stock === null)).toBe(true)
    expect(shaabi.every((product) => product.image === null)).toBe(true)
    expect(categoryPathLabel('incense-shaabi')).toBe('البخور › بخور شعبي')
  })

  it('بخور ناموس عائلة رابعة تحت البخور، والأربع حاجات أصناف جواه بلا أرقام', () => {
    expect(findCategory('incense-namos').parent).toBe('incense')
    // «جواه أربع حاجات» = أربع أصناف لا أربع أقسام (زي قراره في بخور شعبي)
    expect(subCategories('incense-namos')).toEqual([])
    const namos = products.filter((product) => product.categoryId === 'incense-namos')
    expect(namos.map((product) => product.name)).toEqual([
      'أعواد لوجينا',
      'أقراص الصفا',
      'سائل جهاز الناموس',
      'جهاز الناموس',
    ])
    expect(namos.map((product) => product.id)).toEqual(['DL-1401', 'DL-1402', 'DL-1403', 'DL-1404'])
    expect(namos.every((product) => product.retailPrice === null && product.wholesalePrice === null)).toBe(true)
    expect(namos.every((product) => product.unit === null && product.stock === null)).toBe(true)
    expect(namos.every((product) => product.image === null)).toBe(true)
    expect(categoryPathLabel('incense-namos')).toBe('البخور › بخور ناموس')
    // «ناموس» ورقة مباشرة تحت البخور، فجوارها جوار «شعبي»: كل البخور لا أصناف العائلة وحدها
    expect([...categoryNeighborhoodIds('incense-namos')]).toEqual(INCENSE_GROUP)
  })

  it('كل مستوى في العدّاد يعدّ اللي جواه على طول: أقسامه المباشرة، أو أصنافه لو ورقة', () => {
    // البخور عائلاته الأربع، لا أصنافها الثلاثة والتلاتين
    expect(sectionCount('incense', 39)).toEqual({ value: 4, unit: 'قسم' })
    expect(sectionCount('incense-tijani', 11)).toEqual({ value: 4, unit: 'قسم' })
    expect(sectionCount('incense-insam', 22)).toEqual({ value: 6, unit: 'قسم' })
    expect(sectionCount('incense-insam-pyramid', 9)).toEqual({ value: 3, unit: 'قسم' })
    // الأوراق ما تحتهاش أقسام → أصنافها هي
    expect(sectionCount('incense-namos', 4)).toEqual({ value: 4, unit: 'صنف' })
    expect(sectionCount('incense-shaabi', 2)).toEqual({ value: 2, unit: 'صنف' })
    expect(sectionCount('incense-insam-sticks', 6)).toEqual({ value: 6, unit: 'صنف' })
    // «عناية الأسنان» بلا أصناف لسه، وجوه سيجنال وكلوزاب → «2 قسم» بدل «0 صنف»
    expect(sectionCount('dental-care', 0)).toEqual({ value: 2, unit: 'قسم' })
    // قسم بلا أصناف وبلا أقسام فرعية يفضل صفرًا صريحًا بلا تجميل
    expect(sectionCount('balloons', 0)).toEqual({ value: 0, unit: 'صنف' })
    expect(sectionCount('hajayer', 0)).toEqual({ value: 0, unit: 'صنف' })
    // أب عليه أصناف بنفسه ومعاها أقسام: العدّاد أقسامه، والأصناف لسه بتبان في الفلترة ومدى الأسعار
    expect(sectionCount('charcoal', 2)).toEqual({ value: 2, unit: 'قسم' })
    expect(sectionCount('home-care', 5)).toEqual({ value: 5, unit: 'قسم' })
    // «مواد سريعة الاشتعال» تعدّ الكبريت والفحم والغاز — لا أصنافها الخمسة
    expect(sectionCount('flammables', 5)).toEqual({ value: 3, unit: 'قسم' })
    // و«الكبريت» بقى ورقة فما تحتوش أقسام → أصنافه الثلاثة
    expect(sectionCount('matches', 3)).toEqual({ value: 3, unit: 'صنف' })
    // و«الغاز» ورقة فاضية: صفر صريح مش تجميل
    expect(sectionCount('gas', 0)).toEqual({ value: 0, unit: 'صنف' })
  })

  it('تسمية الصنف في قسم فرعي تبدأ بقسمه الرئيسي', () => {
    // الرئيسي بقى «مواد سريعة الاشتعال»، فالفحم بقى واسطة في المسار لا أوله
    expect(rootCategory('charcoal-cubes')?.name).toBe('مواد سريعة الاشتعال')
    expect(categoryLabel('charcoal-cubes')).toBe('مواد سريعة الاشتعال')
    expect(categoryPathLabel('charcoal-cubes')).toBe('مواد سريعة الاشتعال › الفحم › مكعبات فحم')
    expect(categoryPathLabel('incense-tijani-sticks')).toBe('البخور › بخور تيجاني › أعواد')
    expect(categoryPathLabel('incense')).toBe('البخور')
    expect(categoryPathLabel('غير-موجود')).toBe('غير مصنّف')
  })

  it('الكبريت والفحم والغاز اندمجوا في «مواد سريعة الاشتعال» بأسمائهم أقسامًا فرعية', () => {
    expect(findCategory('flammables').parent).toBeUndefined()
    expect(subCategories('flammables').map((category) => category.name)).toEqual(['الكبريت', 'الفحم', 'الغاز'])
    expect(['matches', 'charcoal', 'gas'].every((id) => findCategory(id).parent === 'flammables')).toBe(true)
    // واندماج الثلاثة ما لمسش شجرة الفحم اللي تحتهم ولا أصنافها
    expect([...categoryGroupIds('charcoal')]).toEqual(['charcoal', 'charcoal-fast-light', 'charcoal-cubes'])
    expect([...categoryGroupIds('flammables')]).toEqual(FLAMMABLE_GROUP)
    expect(findCategory('flammables').name).toBe('مواد سريعة الاشتعال')
    // شجرة القسم الجديد متتالية بعده في قائمة العرض
    const firstIndex = categories.findIndex((category) => category.id === 'flammables')
    expect(categories.slice(firstIndex, firstIndex + FLAMMABLE_GROUP.length).map((c) => c.id)).toEqual(FLAMMABLE_GROUP)
    // الأسماء التلاتة ما زالت تُفلتر وتُبحث: «فحم» يوصلك لمكعبات فحم من تحت الأب الجديد
    expect([...categoryGroupIds('matches')]).toEqual(['matches'])
    expect(categoryChainNames('charcoal-cubes')).toEqual(['مواد سريعة الاشتعال', 'الفحم', 'مكعبات فحم'])
    // أصناف البذرة في المجموعة خمسة، وما اتحركش منها صنف: نفس الأرقام ونفس الأقسام
    const inGroup = products.filter((product) => FLAMMABLE_GROUP.includes(product.categoryId))
    expect(inGroup.map((product) => product.id).sort()).toEqual(['DL-3001', 'DL-3002', 'DL-3003', 'DL-4001', 'DL-4002'])
    expect(inGroup.map((product) => product.categoryId)).toEqual(['matches', 'matches', 'matches', 'charcoal-cubes', 'charcoal'])
    // «الغاز» لسه بلا أصناف — الدمج ما ملّوشش من عندنا
    expect(products.some((product) => product.categoryId === 'gas')).toBe(false)
  })

  it('جوار الكبريت والفحم اتّسع لمجموعتهما الجديدة بعد ما بقوا أبناء «مواد سريعة الاشتعال»', () => {
    // كان الأب بنفسه فجواره أصنافه وحده، ولما بقى ابنًا فجواره = ورقة أبيه: كل مواد سريعة الاشتعال
    expect([...categoryNeighborhoodIds('matches')]).toEqual(FLAMMABLE_GROUP)
    expect([...categoryNeighborhoodIds('charcoal')]).toEqual(FLAMMABLE_GROUP)
    // لكن الورقة اللي تحت الفحم مباشرة لسه جوارها شجرة الفحم وحدها
    expect([...categoryNeighborhoodIds('charcoal-cubes')]).toEqual(['charcoal', 'charcoal-fast-light', 'charcoal-cubes'])
    const match = products.find((product) => product.categoryId === 'matches')
    const ids = similarProducts(match).map((product) => product.id)
    expect(ids).toContain('DL-4001')
    expect(ids).toContain('DL-4002')
    // و«أعواد» تيجاني ما اتأثرتش: أبوها مش أبوها الكبير
    const sticks = products.find((product) => product.categoryId === 'incense-tijani-sticks')
    expect(similarProducts(sticks).every((item) => item.categoryId.startsWith('incense-tijani'))).toBe(true)
  })

  it('كل صنف في البذرة مُسكَّن على قسم حقيقي ذو أيقونة أو أب', () => {
    products.forEach((product) => {
      const category = findCategory(product.categoryId)
      expect(category).not.toBeNull()
      expect(category.icon || category.parent).toBeTruthy()
    })
  })

  it('صنف في قسم فرعي يجاور أصناف القسم الرئيسي وأقسامه الفرعية', () => {
    const charcoalGroup = ['charcoal', 'charcoal-fast-light', 'charcoal-cubes']
    expect([...categoryNeighborhoodIds('charcoal-cubes')]).toEqual(charcoalGroup)
    // و«الفحم» نفسه بقى ابنًا، فصنفه القائم عليه (DL-4002) جواره كل مواد سريعة الاشتعال
    expect([...categoryNeighborhoodIds('charcoal')]).toEqual(FLAMMABLE_GROUP)
    expect([...categoryNeighborhoodIds('incense')]).toEqual(INCENSE_GROUP)
    // صنف في «أعواد» تيجاني يجاور باقية أصناف تيجاني وحدها، لا كل البخور
    expect([...categoryNeighborhoodIds('incense-tijani-sticks')]).toEqual(TIJANI_GROUP)
    // و«أعواد» إنسام تجاور باقية إنسام وحدها
    expect([...categoryNeighborhoodIds('incense-insam-sticks')]).toEqual(INSAM_GROUP)
    // درجة هرمي تجاور درجات «هرمي» تحت أبوها فقط — أبوها هو الورقة التي تقف عليها
    expect([...categoryNeighborhoodIds('incense-insam-pyramid-cone')]).toEqual(INSAM_PYRAMID_GROUP)
    const cone = products.find((product) => product.categoryId === 'incense-insam-pyramid-cone')
    const coneNeighborhood = similarProducts(cone).map((product) => product.categoryId)
    expect(coneNeighborhood).toHaveLength(4)
    expect(coneNeighborhood.every((id) => INSAM_PYRAMID_GROUP.includes(id))).toBe(true)
    const cubes = products.find((product) => product.id === 'DL-4001')
    expect(similarProducts(cubes).map((product) => product.id)).toContain('DL-4002')
  })

  it('البالون نزل قسمًا فرعيًا تحت «أعياد ومناسبات» بدل ما يكون رئيسيًا', () => {
    expect(findCategory('festivals').parent).toBeUndefined()
    expect(findCategory('balloons').parent).toBe('festivals')
    expect([...categoryGroupIds('festivals')]).toEqual(['festivals', 'balloons'])
    expect(categoryPathLabel('balloons')).toBe('أعياد ومناسبات › البالون')
    expect(sectionCount('festivals', 0)).toEqual({ value: 1, unit: 'قسم' })
    expect(sectionCount('balloons', 0)).toEqual({ value: 0, unit: 'صنف' })
  })

  it('القائمة الستة عشر بتحمل إملاء التاجر الجديد حرفيًا وأسماء الأقسام ما اتبدلش معرّفاتها', () => {
    expect(findCategory('hajayer').name).toBe('حجائر')
    expect(findCategory('medals-wallets').name).toBe('ميدالية ومحفظة')
    expect(findCategory('khella-selaka').name).toBe('خلة وسلاكة')
    expect(findCategory('dental-care').name).toBe('عناية الاسنان')
    expect(findCategory('home-care').name).toBe('عناية منزلية')
    // ثلاثة أقسام جديدة أملّها بأسمائها فقط: بلا أصناف وبلا أقسام وبلا وصف ملّاه
    for (const id of ['stationery', 'kids-toys', 'electrical-tools']) {
      expect(findCategory(id).parent).toBeUndefined()
      expect(subCategories(id)).toEqual([])
      expect(sectionCount(id, 0)).toEqual({ value: 0, unit: 'صنف' })
      expect(findCategory(id).description).toBe('أصناف هذا القسم تُحدَّد من التاجر.')
      expect(products.some((product) => product.categoryId === id)).toBe(false)
    }
    // والأربع عائلات اللي أمر يحافظ عليها سليمة زي ما هي: البخور ١٨ قسمًا، مواد سريعة الاشتعال ٦
    expect([...categoryGroupIds('incense')]).toEqual(INCENSE_GROUP)
    expect([...categoryGroupIds('flammables')]).toEqual(FLAMMABLE_GROUP)
    expect(subCategories('dental-care')).toHaveLength(2)
    expect(subCategories('home-care')).toHaveLength(5)
    expect(categories).toHaveLength(46)
    expect(topCategories()).toHaveLength(16)
    // مفيش صنف ضاع: كل أصناف البذرة لسه مسكّنة على قسم وجوده حقيقي وسلسلته تنتهي بأحد الأقسام الـ١٦
    const roots = new Set(topCategories().map((category) => category.id))
    expect(products).toHaveLength(52)
    products.forEach((product) => {
      expect(findCategory(product.categoryId)).not.toBeNull()
      expect(roots.has(rootCategory(product.categoryId).id)).toBe(true)
    })
  })

  it('كل قسم رئيسي صورته اللي ملّها التاجر بنفس معرّفه، والفرعية بلا صورة مختلقة', () => {
    const tops = topCategories()
    expect(tops).toHaveLength(16)
    // صورتان مما ملّاه التاجر بوسترات دعاية لشركة تانية — شعارها وادعاءاتها مطبوعة عليها، فما تتعرضاش
    const adPosters = ['incense', 'flammables']
    tops.forEach((category) => {
      if (adPosters.includes(category.id)) {
        expect(category.image).toBeNull()
      } else {
        expect(typeof category.image).toBe('string')
        expect(category.image).toContain(`categories/${category.id}.jpg`)
      }
    })
    expect(tops.filter((category) => category.image)).toHaveLength(14)
    // ما ملّش قسم فرعي صورة — ما نحطّش واحدة من عندنا
    expect(categories.filter((category) => category.parent && category.image)).toEqual([])
  })

  it('الأقسام التي بلا أصناف تُذكر صراحة بدل اختلاق أصناف', () => {
    const group = categoryGroupIds('balloons')
    expect(products.some((product) => group.has(product.categoryId))).toBe(false)
  })

  it('شريط الأقسام يعطي مستوى واحدًا لكل اختيار: الورقة، أو إخوتها، أو الأقسام الرئيسية', () => {
    // بلا اختيار: الأقسام الرئيسية كلها، ولا ممرّ
    const root = sectionRail('')
    expect(root.scope).toBeNull()
    expect(root.crumbs).toEqual([])
    expect(root.items.map((category) => category.id)).toEqual(topCategories().map((category) => category.id))

    // قسم له أبناء: ورقته هي الشريط، وأبوها نقطة الرجوع لفوق
    const insam = sectionRail('incense-insam')
    expect(insam.scope?.id).toBe('incense-insam')
    expect(insam.items.map((category) => category.id)).toEqual(subCategories('incense-insam').map((c) => c.id))
    expect(insam.crumbs.map((category) => category.id)).toEqual(['incense', 'incense-insam'])

    // الورقة التي تحتها أقسام (هرمي) تنفرع في نفس الشريط
    const pyramid = sectionRail('incense-insam-pyramid')
    expect(pyramid.items.map((category) => category.name)).toEqual(['مخروطي', 'وسط', 'غالي'])

    // ورقة بلا أبناء: الشريط إخوتها تحت أبيها، فلا يبقى العميل بلا شريط
    const cone = sectionRail('incense-insam-pyramid-cone')
    expect(cone.scope?.id).toBe('incense-insam-pyramid')
    expect(cone.items.map((category) => category.id)).toEqual([
      'incense-insam-pyramid-cone',
      'incense-insam-pyramid-mid',
      'incense-insam-pyramid-premium',
    ])
    expect(cone.crumbs.map((category) => category.id)).toEqual([
      'incense',
      'incense-insam',
      'incense-insam-pyramid',
      'incense-insam-pyramid-cone',
    ])

    // رئيسي بلا أبناء: الشريط يرجع لقائمة الرئيسية، والممرّ فاضي لأن مفيش مستوى فوقه
    const hajayer = sectionRail('hajayer')
    expect(hajayer.scope).toBeNull()
    expect(hajayer.crumbs).toEqual([])
    expect(hajayer.items.some((category) => category.id === 'hajayer')).toBe(true)
  })
})
