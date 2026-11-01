import { CircleAlert, CircleCheck, CircleHelp, CircleX } from 'lucide-react'
import { availabilityOf } from '../../utils/pricing.js'

const ICONS = { in: CircleCheck, low: CircleAlert, out: CircleX, unknown: CircleHelp }

export default function StockBadge({ product }) {
  const availability = availabilityOf(product)
  const Icon = ICONS[availability.key]
  return (
    <span className={`stock stock--${availability.key}`}>
      <Icon size={14} aria-hidden='true' />
      {availability.label}
    </span>
  )
}
