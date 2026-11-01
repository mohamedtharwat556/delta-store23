import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import CartDrawer from '../cart/CartDrawer.jsx'
import CartBar from '../cart/CartBar.jsx'
import CartToast from '../ui/CartToast.jsx'
import { useCart } from '../../hooks/useCart.js'
import { useStickyHeaderOffset } from '../../hooks/useStickyHeaderOffset.js'
import { isCartBarVisible } from '../../utils/cartBar.js'

export default function Layout() {
  const { pathname } = useLocation()
  const { summary } = useCart()
  useStickyHeaderOffset()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  const hasCartBar = isCartBarVisible(pathname, summary.lineCount)

  return (
    <div className={`app-shell${hasCartBar ? ' has-cart-bar' : ''}`}>
      <a href='#main' className='skip-link'>
        تخطّي إلى المحتوى
      </a>
      <Header />
      <main id='main' className='app-main'>
        <div className='container'>
          <Outlet />
        </div>
      </main>
      <Footer />
      {hasCartBar ? <CartBar /> : null}
      <CartDrawer />
      <CartToast />
    </div>
  )
}
