import { Link } from 'react-router-dom'
import CategoryCard from '../components/category/CategoryCard.jsx'
import SectionRail from '../components/category/SectionRail.jsx'
import SectionHead from '../components/ui/SectionHead.jsx'
import { categories, topCategories } from '../data/categories.js'
import { useCatalog } from '../hooks/useCatalog.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

// الأقسام على الصفحة دي واجهة قراءة لا فلتر، فالشريط يفتح صفحة المنتجات على القسم وحده
const sectionHref = (id) => (id ? `/products?category=${id}` : '/products')

export default function Categories() {
  const products = useCatalog()
  const sections = topCategories()
  const subCount = categories.length - sections.length
  usePageTitle('الأقسام')

  return (
    <>
      <header className='page-header'>
        <h1>الأقسام</h1>
        <p className='section__subtitle'>
          {sections.length} قسمًا رئيسيًا · {subCount} قسمًا فرعيًا · {products.length} صنف
        </p>
      </header>

      <SectionRail
        nodes={sections}
        scope={null}
        activeId=''
        hrefFor={sectionHref}
        showAll={false}
        title='اختر قسمك'
      />

      <SectionHead
        title='أصناف الخردوات'
        subtitle='كل بطاقة تفتح على أصناف قسمها وأقسامه الفرعية، والروابط الصغيرة تفلتر على القسم الفرعي وحده.'
      />
      <div className='grid grid--categories'>
        {sections.map((category, index) => (
          <CategoryCard key={category.id} category={category} index={index} />
        ))}
      </div>

      <p className='section__subtitle u-mt-4'>
        تريد كل الأصناف في قائمة واحدة؟{' '}
        <Link to='/products'>عرض كل المنتجات</Link> أو{' '}
        <Link to='/wholesale'>جدول حدود الجملة</Link>.
      </p>
    </>
  )
}
