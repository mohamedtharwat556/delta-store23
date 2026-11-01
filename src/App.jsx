import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import DashboardGate from './components/dashboard/DashboardGate.jsx'
import Layout from './components/layout/Layout.jsx'
import Splash from './components/layout/Splash.jsx'
import About from './pages/About.jsx'
import CartPage from './pages/CartPage.jsx'
import Categories from './pages/Categories.jsx'
import Checkout from './pages/Checkout.jsx'
import Contact from './pages/Contact.jsx'
import Home from './pages/Home.jsx'
import Invoice from './pages/Invoice.jsx'
import NotFound from './pages/NotFound.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import OrderTracking from './pages/OrderTracking.jsx'
import PickList from './pages/PickList.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Products from './pages/Products.jsx'
import Wholesale from './pages/Wholesale.jsx'

// اللوحة ولوحاتها الست ثقيلة على العميل اللي ما بيفتحهاش طول عمره — تتحمّل كchunk لوحدها لما يطلبها
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))

export default function App() {
  return (
    <>
      <Splash />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path='products' element={<Products />} />
          <Route path='products/:slug' element={<ProductDetail />} />
          <Route path='categories' element={<Categories />} />
          <Route path='wholesale' element={<Wholesale />} />
          <Route path='cart' element={<CartPage />} />
          <Route path='checkout' element={<Checkout />} />
          <Route path='order/:number' element={<OrderConfirmation />} />
          <Route path='invoice/:number' element={<Invoice />} />
          <Route path='pick/:number' element={<PickList />} />
          <Route path='track' element={<OrderTracking />} />
          <Route
            path='dashboard'
            element={
              <DashboardGate>
                <Suspense fallback={<p className='route-fallback'>لوحة التحكم بتحمّل…</p>}>
                  <Dashboard />
                </Suspense>
              </DashboardGate>
            }
          />
          <Route path='about' element={<About />} />
          <Route path='contact' element={<Contact />} />
          <Route path='*' element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
