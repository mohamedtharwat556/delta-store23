import { Link } from 'react-router-dom'
import { Building2, CircleCheck, CircleAlert } from 'lucide-react'
import SectionHead from '../components/ui/SectionHead.jsx'
import { topCategories } from '../data/categories.js'
import { company } from '../data/company.js'
import { useCatalog } from '../hooks/useCatalog.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const included = [
  { icon: CircleCheck, text: 'واجهة عربية RTL كاملة، وبنية ملفات قابلة للتوسّع.' },
  { icon: CircleCheck, text: 'سلة مشتريات تعمل وتُحفظ في متصفحك، مع تسعير جملة/قطاعي تلقائي.' },
  { icon: CircleAlert, text: 'المخزن في مركز الزرقا بمحافظة دمياط؛ الهاتف والبريد والأسعار ما زالت غير معتمدة.' },
]

export default function About() {
  const products = useCatalog()
  usePageTitle('عن الشركة')

  return (
    <>
      <header className='page-header'>
        <h1>عن الشركة</h1>
        <p className='section__subtitle'>{company.legalName}</p>
      </header>

      <section className='card about-card'>
        <span className='about-card__mark'>
          <Building2 size={22} aria-hidden='true' />
        </span>
        <div>
          <h2>
            {company.nameAr} — {company.name}
          </h2>
          <p className='section__subtitle'>{company.tagline}</p>
          <p className='u-mt-3'>{company.longAbout}</p>
        </div>
      </section>

      <section className='section'>
        <SectionHead title='نطاق الأصناف' subtitle='ما يغطيه الكتالوج الحالي داخل الواجهة.' />
        <div className='grid grid--auto'>
          {topCategories().map((category) => (
            <div key={category.id} className='card scope-card'>
              <h3>{category.name}</h3>
              <p className='section__subtitle'>{category.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='card'>
        <h2>حالة هذا الإصدار</h2>
        <ul className='status-list u-mt-3'>
          {included.map((row) => (
            <li key={row.text}>
              <row.icon size={17} aria-hidden='true' />
              {row.text}
            </li>
          ))}
        </ul>
        <p className='section__subtitle u-mt-3'>
          عدد الأصناف المعروضة: {products.length} بأسعار تجريبية. الطلبات تُسجَّل وتُتابَع داخل هذا
          المتصفح فقط؛ الخطوة التالية هي ربطها بقناة إرسال فعلية تعتمدها الدلتا.
        </p>
        <div className='btn-row u-mt-4'>
          <Link to='/products' className='btn btn--primary'>
            دخول المتجر
          </Link>
          <Link to='/track' className='btn btn--ghost'>
            تجربة تتبع الطلب
          </Link>
        </div>
      </section>
    </>
  )
}
