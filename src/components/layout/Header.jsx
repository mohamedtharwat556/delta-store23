import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Menu, ReceiptText, Search, ShoppingBag, X } from 'lucide-react'
import { company } from '../../data/company.js'
import { navigation } from '../../data/navigation.js'
import { useCart } from '../../hooks/useCart.js'
import { useCatalog } from '../../hooks/useCatalog.js'
import { suggestProducts } from '../../utils/searchSuggest.js'
import brandMark from '../../assets/brand-emblem.png'

const SUGGEST_LIMIT = 5

export default function Header() {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [active, setActive] = useState(-1)
  const [dismissed, setDismissed] = useState(false)
  const { summary, openDrawer } = useCart()
  const catalog = useCatalog()
  const navigate = useNavigate()

  const suggestions = suggestProducts(catalog, term, { limit: SUGGEST_LIMIT })
  const showSuggestions = term.trim().length > 0 && suggestions.length > 0 && !dismissed

  const inputRef = useRef(null)

  // «/» من أي مكان في الصفحة تروح للبحث — طريق المتاجر المختصر، ولا تأكل الحرف لو العميل يكتب في حقل
  useEffect(() => {
    const onFocusSearch = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      const editing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (editing) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onFocusSearch)
    return () => window.removeEventListener('keydown', onFocusSearch)
  }, [])

  const closeSuggestions = () => {
    setActive(-1)
  }

  const submitSearch = (event) => {
    event.preventDefault()
    const query = term.trim()
    const picked = active >= 0 ? suggestions[active] : null
    navigate(picked ? `/products/${picked.slug}` : query ? `/products?q=${encodeURIComponent(query)}` : '/products')
    setMenuOpen(false)
    closeSuggestions()
  }

  // الأسهم تخلي الطبق قابل للاستخدام من الكيبورد: العميل اللي يكتب بسرعة ما يضيعش ما بين الحروف
  const onSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' && showSuggestions) {
      event.preventDefault()
      setActive((index) => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && showSuggestions) {
      event.preventDefault()
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
    } else if (event.key === 'Escape') {
      // Escape بتقفل الطبقة فعلًا، مش بتنزّل التمييز بس — والكتابة من جديد بترجعها
      setDismissed(true)
      setActive(-1)
    }
  }

  return (
    <header className='site-header'>
      <div className='site-header__topline'>
        <div className='container site-header__topline-inner'>
          <p>{company.tagline}</p>
          <div className='site-header__topline-links'>
            <Link to='/track' className='site-header__track'>
              <ReceiptText size={15} aria-hidden='true' /> تتبع الطلب
            </Link>
            <Link to='/dashboard' className='site-header__track'>
              <LayoutDashboard size={15} aria-hidden='true' /> لوحة التحكم
            </Link>
          </div>
        </div>
      </div>

      <div className='container site-header__bar'>
        <button
          type='button'
          className='icon-btn nav-toggle'
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to='/' className='brand' onClick={() => setMenuOpen(false)}>
          <img src={brandMark} alt='' width='64' height='30' className='brand__mark' />
          <span className='brand__text'>
            <span className='brand__title'>{company.nameAr}</span>
            <span className='brand__subtitle'>{company.legalName}</span>
          </span>
        </Link>

        <div className='header-search-wrap'>
          <form className='header-search' role='search' onSubmit={submitSearch}>
            <input
              ref={inputRef}
              type='search'
              className='header-search__input'
              placeholder='ابحث عن بخور، ولاعة، كبريت…'
              aria-label='البحث في المنتجات'
              aria-autocomplete='list'
              aria-controls='header-search-suggests'
              aria-expanded={showSuggestions}
              value={term}
              onChange={(event) => {
                setTerm(event.target.value)
                setActive(-1)
                setDismissed(false)
              }}
              onKeyDown={onSearchKeyDown}
            />
            <button type='submit' className='header-search__btn' aria-label='بحث'>
              <Search size={18} aria-hidden='true' />
            </button>
          </form>

          {/* العميل ما بيستناش Enter: اقتراحات من نفس الكتالوج الحي، بنفس منطق مطابقة صفحة المنتجات */}
          {showSuggestions ? (
            <ul className='header-search__suggests' id='header-search-suggests' aria-label='اقتراحات البحث'>
              {suggestions.map((product, index) => (
                <li key={product.id}>
                  <Link
                    to={`/products/${product.slug}`}
                    className={`header-search__suggest${index === active ? ' is-active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={closeSuggestions}
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={`/products?q=${encodeURIComponent(term.trim())}`}
                  className='header-search__suggest header-search__suggest--all'
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={closeSuggestions}
                >
                  كل نتائج «{term.trim()}»
                </Link>
              </li>
            </ul>
          ) : null}
        </div>

        <button type='button' className='cart-button' onClick={openDrawer} aria-label='فتح سلة المشتريات'>
          <ShoppingBag size={20} aria-hidden='true' />
          <span className='cart-button__label'>السلة</span>
          <span className={`cart-button__count${summary.units ? ' is-active' : ''}`}>{summary.units}</span>
        </button>
      </div>

      <nav
        className={`main-nav${isMenuOpen ? ' is-open' : ''}`}
        aria-label='تنقلات المتجر الرئيسية'
      >
        <div className='container'>
          <ul className='main-nav__list'>
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `main-nav__link${isActive ? ' is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link to='/cart' className='main-nav__link' onClick={() => setMenuOpen(false)}>
                السلة ({summary.lineCount})
              </Link>
            </li>
            {/* الشريط العلوي الداكن بيختفي على الموبايل، فاللوحة لازم لها مكان في القائمة نفسها */}
            <li>
              <Link to='/dashboard' className='main-nav__link' onClick={() => setMenuOpen(false)}>
                لوحة التحكم
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
