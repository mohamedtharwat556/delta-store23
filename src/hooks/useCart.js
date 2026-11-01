import { useContext } from 'react'
import { CartContext } from '../context/cart-context.js'

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart يجب أن يُستخدم داخل CartProvider')
  return context
}
