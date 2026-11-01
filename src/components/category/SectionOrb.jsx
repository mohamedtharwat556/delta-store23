import { Link } from 'react-router-dom'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import ProductImage from '../ui/ProductImage.jsx'

// دائرة القسم: صورة من صور الأصناف لا زينة، وإن ما كانش فيه صورة تتكفّل أيقونة القسم
export default function SectionOrb({ to, label, count, src, alt = '', icon, active = false, size = 'md', glyph = false }) {
  return (
    <li className={`section-orb section-orb--${size}${active ? ' is-active' : ''}${glyph ? ' section-orb--glyph' : ''}`}>
      <Link to={to} aria-current={active ? 'true' : undefined}>
        <span className='section-orb__ring'>
          {src ? (
            <ProductImage src={src} alt={alt} ratio='square' className='section-orb__media' priority={active} />
          ) : (
            <span className='section-orb__glyph'>
              <CategoryIcon name={icon} size={size === 'sm' ? 18 : 22} />
            </span>
          )}
          {count ? (
            <span className='section-orb__count' title={`${count.value} ${count.unit}`}>
              {count.value}
            </span>
          ) : null}
        </span>
        <span className='section-orb__label'>{label}</span>
      </Link>
    </li>
  )
}
