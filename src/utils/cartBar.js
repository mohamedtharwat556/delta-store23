import { matchPath } from 'react-router-dom'

// الصفحات اللي فيها السلة نفسها أو شاشات التاجر/الورق: الشريط السفلي فيها تكرار أو يغطّي زرّات مهمة
export const CART_BAR_HIDDEN_ROUTES = [
  '/cart',
  '/checkout',
  '/dashboard',
  '/order/:number',
  '/invoice/:number',
  '/pick/:number',
]

export function isCartBarVisible(pathname, lineCount) {
  if (!lineCount) return false
  return !CART_BAR_HIDDEN_ROUTES.some((path) => matchPath({ path, end: true }, pathname))
}
