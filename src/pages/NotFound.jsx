import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function NotFound() {
  usePageTitle('الصفحة غير موجودة')
  return (
    <div className='notfound'>
      <span className='notfound__code'>404</span>
      <h1>الصفحة غير موجودة</h1>
      <p className='section__subtitle'>تأكد من الرابط أو ارجع إلى قائمة المنتجات.</p>
      <div className='btn-row'>
        <Link to='/' className='btn btn--primary'>
          العودة للرئيسية
        </Link>
        <Link to='/products' className='btn btn--ghost'>
          كل المنتجات
        </Link>
      </div>
    </div>
  )
}
