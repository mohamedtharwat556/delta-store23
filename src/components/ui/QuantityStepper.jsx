import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

export default function QuantityStepper({ value, min = 1, max = 999, onChange, label, size = 'md' }) {
  const [draft, setDraft] = useState(() => String(value))
  const [syncedValue, setSyncedValue] = useState(() => String(value))

  if (syncedValue !== String(value)) {
    setSyncedValue(String(value))
    setDraft(String(value))
  }

  const commit = (nextValue) => {
    const parsed = Math.floor(Number(nextValue))
    if (!Number.isFinite(parsed)) {
      setDraft(String(value))
      return
    }
    const clamped = Math.min(Math.max(parsed, min), max)
    onChange(clamped)
    setDraft(String(clamped))
  }

  return (
    <div className={`stepper stepper--${size}`}>
      <button
        type='button'
        className='stepper__btn'
        onClick={() => commit(Number(draft) - 1)}
        disabled={value <= min}
        aria-label={`تقليل كمية ${label}`}
      >
        <Minus size={16} aria-hidden='true' />
      </button>

      <input
        className='stepper__input'
        type='text'
        inputMode='numeric'
        value={draft}
        aria-label={`كمية ${label}`}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ''))}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget.value)
        }}
      />

      <button
        type='button'
        className='stepper__btn'
        onClick={() => commit(Number(draft) + 1)}
        disabled={value >= max}
        aria-label={`زيادة كمية ${label}`}
      >
        <Plus size={16} aria-hidden='true' />
      </button>
    </div>
  )
}
