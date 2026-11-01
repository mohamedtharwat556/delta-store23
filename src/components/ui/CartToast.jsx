import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { useCart } from '../../hooks/useCart.js'

const ICONS = { success: CircleCheck, info: Info, danger: TriangleAlert }

export default function CartToast() {
  const { notification } = useCart()
  if (!notification) return null

  const Icon = ICONS[notification.tone] ?? Info

  return (
    <output className={`toast toast--${notification.tone}`} role='status' aria-live='polite'>
      <Icon size={18} aria-hidden='true' />
      {notification.message}
    </output>
  )
}
