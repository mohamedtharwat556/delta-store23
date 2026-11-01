import { useEffect, useRef } from 'react'
import SectionOrb from './SectionOrb.jsx'
import { categoryGroupIds, sectionCount } from '../../data/categories.js'
import { useCatalog } from '../../hooks/useCatalog.js'
import { orbSourceOf } from '../../utils/sectionOrb.js'

// الشريط الذي يفتح جنب المنتجات: ورقة القسم المختار، وأول دائرة ترجع مستوى واحد لفوق
export default function SectionRail({ nodes, activeId, scope, hrefFor, size = 'md', title, showAll = true }) {
  const products = useCatalog()
  const trackRef = useRef(null)
  const heading = title ?? (scope ? `أقسام ${scope.name}` : 'الأقسام الرئيسية')

  // القسم الجاي من رابط مباشر يبقى ظاهرًا في شريطه، لا خارج الشاشة على الشمال
  useEffect(() => {
    const current = trackRef.current?.querySelector('[aria-current]')
    current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [activeId])

  if (!nodes.length) return null

  const itemsOf = (id) => {
    const group = categoryGroupIds(id)
    return products.filter((product) => group.has(product.categoryId))
  }

  const orbOf = (node) => {
    const items = itemsOf(node.id)
    const source = orbSourceOf(node, items)
    return (
      <SectionOrb
        key={node.id}
        to={hrefFor(node.id)}
        label={node.name}
        count={sectionCount(node.id, items.length)}
        src={source.src}
        alt={source.alt}
        icon={node.icon}
        active={node.id === activeId}
        size={size}
      />
    )
  }

  const scopeItems = scope ? itemsOf(scope.id) : products

  return (
    <nav className='section-rail' aria-label={heading}>
      <div className='section-rail__head'>
        <h2 className='section-rail__title'>{heading}</h2>
        <p className='section-rail__hint'>
          {scope ? 'اختر قسمًا ليظهر ما تحته جنب المنتجات' : 'اختر قسمًا ليظهر شريطه'}
        </p>
      </div>

      <ul className='section-rail__track' ref={trackRef}>
        {showAll ? (
          <SectionOrb
            to={hrefFor(scope ? scope.id : '')}
            label={scope ? `كل ${scope.name}` : 'كل الأقسام'}
            count={scope ? sectionCount(scope.id, scopeItems.length) : { value: products.length, unit: 'صنف' }}
            icon='LayoutGrid'
            glyph
            active={!activeId}
            size={size}
          />
        ) : null}
        {nodes.map(orbOf)}
      </ul>
    </nav>
  )
}
