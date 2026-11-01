import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { company } from '../../data/company.js'
import { topCategories } from '../../data/categories.js'
import { footerLinks } from '../../data/navigation.js'

export default function Footer() {
  return (
    <footer className='site-footer'>
      <div className='container'>
        <div className='site-footer__grid'>
          <div className='site-footer__brand'>
            <h3>{company.nameAr}</h3>
            <p className='site-footer__legal'>{company.legalName}</p>
            <p>{company.shortAbout}</p>
          </div>

          {footerLinks.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3>{group.title}</h3>
              <ul className='site-footer__list'>
                {group.items.map((item) => (
                  <li key={item.to + item.label}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label='الأقسام'>
            <h3>الأقسام</h3>
            <ul className='site-footer__list site-footer__list--sections'>
              {topCategories().map((category) => (
                <li key={category.id}>
                  <Link to={`/products?category=${category.id}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3>بيانات التواصل</h3>
            <p className='site-footer__address'>
              <MapPin size={15} aria-hidden='true' />
              <span>{company.contact.address}</span>
            </p>
            <p className='site-footer__muted'>
              الهاتف والبريد لم يُعتمدا بعد؛ تُضاف بيانات التواصل المعتمدة في{' '}
              <code>src/data/company.js</code>.
            </p>
          </div>
        </div>

        <div className='site-footer__bottom'>
          <p>
            {company.name} — {company.legalName}
          </p>
          <p className='site-footer__muted'>{company.wholesale.demoNotice}</p>
        </div>
      </div>
    </footer>
  )
}
