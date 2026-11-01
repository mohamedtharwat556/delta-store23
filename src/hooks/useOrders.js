import { useContext } from 'react'
import { OrderContext } from '../context/order-context.js'

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) throw new Error('useOrders يجب أن يُستخدم داخل OrderProvider')
  return context
}
