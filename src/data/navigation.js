export const navigation = [
  { to: '/', label: 'الرئيسية' },
  { to: '/products', label: 'المنتجات' },
  { to: '/categories', label: 'الأقسام' },
  { to: '/wholesale', label: 'البيع بالجملة' },
  { to: '/track', label: 'تتبع الطلب' },
]

export const footerLinks = [
  {
    title: 'المتجر',
    items: [
      { to: '/products', label: 'كل المنتجات' },
      { to: '/products?tag=best-seller', label: 'الأكثر طلبًا' },
      { to: '/products?tag=offer', label: 'العروض' },
      { to: '/cart', label: 'سلة المشتريات' },
    ],
  },
  {
    title: 'الأقسام',
    items: [
      { to: '/categories', label: 'كل الأقسام' },
      { to: '/products?category=incense', label: 'أعواد البخور' },
      { to: '/products?category=lighters', label: 'الولّاعات' },
      { to: '/products?category=matches', label: 'علب الكبريت' },
    ],
  },
  {
    title: 'خدمة العملاء',
    items: [
      { to: '/wholesale', label: 'شروط الجملة' },
      { to: '/track', label: 'تتبع الطلب' },
      { to: '/dashboard', label: 'لوحة التحكم (تجريبية)' },
      { to: '/about', label: 'عن الشركة' },
      { to: '/contact', label: 'تواصل معنا' },
    ],
  },
]
