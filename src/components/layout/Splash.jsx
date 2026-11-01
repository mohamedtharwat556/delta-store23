import { useEffect, useState } from 'react'
import { company } from '../../data/company.js'
import brandLogo from '../../assets/brand-logo.png'

const SHOW_MS = 3000
const FADE_MS = 420

const prefersCalmMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

// شاشة تُعرض مرة واحدة عند فتح الموقع (لا عند التنقل الداخلي)، وتُتخطّى مع تقليل الحركة
export default function Splash() {
  const [visible, setVisible] = useState(!prefersCalmMotion())
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!visible) return undefined
    const fade = window.setTimeout(() => setLeaving(true), SHOW_MS)
    const off = window.setTimeout(() => setVisible(false), SHOW_MS + FADE_MS)
    return () => {
      window.clearTimeout(fade)
      window.clearTimeout(off)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className={`splash${leaving ? ' is-leaving' : ''}`}
      role='status'
      aria-live='polite'
      aria-label={`أهلًا بك في ${company.nameAr}`}
    >
      <div className='splash__tile'>
        <img
          src={brandLogo}
          alt={`شعار ${company.name} — دلتا تريد`}
          width='240'
          height='171'
          className='splash__logo'
        />
      </div>
      <div className='splash__brand'>
        <p className='splash__tagline'>
          كل اللي بيتك ومحلك محتاجه، <span className='splash__tagline-accent'>في مكان واحد</span>
        </p>
        <span className='splash__ornament' aria-hidden='true' />
        <p className='splash__company'>
          <span className='splash__company-name'>{company.legalName}</span>
          <span className='splash__company-sep' aria-hidden='true'>
            {' '}
            ·{' '}
          </span>
          <span className='splash__company-where'>{company.contact.address}</span>
        </p>
      </div>
    </div>
  )
}
