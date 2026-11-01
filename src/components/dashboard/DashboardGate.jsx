import { useState } from 'react'
import { Lock, ShieldAlert } from 'lucide-react'
import {
  DEFAULT_DASHBOARD_KEY,
  dashboardAccess,
  readUnlockFlag,
  setUnlockFlag,
} from '../../utils/dashboardAccess.js'

const DASHBOARD_KEY = (import.meta.env.VITE_DASHBOARD_KEY ?? DEFAULT_DASHBOARD_KEY).trim()

export default function DashboardGate({ children }) {
  const [typed, setTyped] = useState('')
  const [unlocked, setUnlocked] = useState(readUnlockFlag)
  const [denied, setDenied] = useState(false)

  const access = dashboardAccess({ prod: import.meta.env.PROD, key: DASHBOARD_KEY, unlocked })

  if (access === 'open') return children

  if (access === 'unconfigured') {
    return (
      <section className='card dashboard-gate'>
        <span className='dashboard-gate__icon'>
          <ShieldAlert size={26} aria-hidden='true' />
        </span>
        <h1>اللوحة مقفولة ومش متظبطة</h1>
        <p className='section__subtitle'>
          نسخة الإنتاج بتحتاج رمز دخول، والحزمة دي اتبنت من غيره. اضبط المتغيّر{' '}
          <code>VITE_DASHBOARD_KEY</code> في إعدادات المشروع على استضافة النت (أو في ملف{' '}
          <code>.env.local</code> عندك) وابنِ من جديد، واللوحة تفتح.
        </p>
      </section>
    )
  }

  const submit = (event) => {
    event.preventDefault()
    const candidate = typed.trim()
    if (!candidate) return
    if (candidate === DASHBOARD_KEY) {
      setUnlockFlag()
      setUnlocked(true)
      setDenied(false)
      setTyped('')
      return
    }
    setDenied(true)
  }

  return (
    <section className='card dashboard-gate'>
      <span className='dashboard-gate__icon'>
        <Lock size={26} aria-hidden='true' />
      </span>
      <h1>لوحة الدلتا للتاجر</h1>
      <p className='section__subtitle'>
        المتجر قدام العميل من غير أي رمز، والصفحة دي وحدها بتسأل على رمز. مفيش سيرفر يشيك الرمز، فالحارس
        ده في المتصفح: يبعد الفضولي، ما يحميش بيانات حقيقية — وده سبب آخر إن الطلبات اللي هنا تجريبية.
      </p>
      <form className='dashboard-gate__form' onSubmit={submit}>
        <label className='field-label' htmlFor='dashboard-key'>
          رمز الدخول
        </label>
        <input
          id='dashboard-key'
          className='field'
          type='password'
          value={typed}
          onChange={(event) => {
            setTyped(event.target.value)
            if (denied) setDenied(false)
          }}
          placeholder='اكتب رمز الدخول'
          autoComplete='off'
          aria-describedby={denied ? 'dashboard-key-error' : undefined}
        />
        <button type='submit' className='btn btn--primary'>
          افتح اللوحة
        </button>
        {denied ? (
          <p className='dashboard-gate__error' id='dashboard-key-error' role='alert'>
            الرمز مش صحيح. جرّب تاني.
          </p>
        ) : null}
      </form>
      <p className='dashboard-gate__hint'>
        الفتح بيثبت في التاب ده بس، وأول ما تقفل التاب اللوحة تقفل تاني.
      </p>
    </section>
  )
}
