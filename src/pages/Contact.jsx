import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, MessageCircle, Phone, ShieldAlert } from 'lucide-react'
import { company } from '../data/company.js'
import { telHref, whatsAppHref } from '../utils/contactLinks.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const { phone, whatsapp, email, address, hours } = company.contact

// رابط لكل قناة معتمدة فقط — اللي لسه null يفضل سطرًا مكتوب عليه «لم تُعتمد بعد» بلا اختلاق رقم
const channels = [
  { icon: Phone, label: 'الهاتف', value: phone, href: telHref(phone) },
  { icon: MessageCircle, label: 'واتساب', value: whatsapp, href: whatsAppHref(whatsapp) },
  { icon: Mail, label: 'البريد الإلكتروني', value: email, href: email ? `mailto:${email}` : null },
  { icon: MapPin, label: 'العنوان', value: address, href: null },
  { icon: Clock, label: 'مواعيد العمل', value: hours, href: null },
]

const pending = channels.filter((channel) => !channel.value)

export default function Contact() {
  usePageTitle('تواصل معنا')
  return (
    <>
      <header className='page-header'>
        <h1>تواصل معنا</h1>
        <p className='section__subtitle'>{company.legalName}</p>
      </header>

      <section className='card'>
        <h2>قنوات التواصل</h2>
        <div className='contact-list u-mt-3'>
          {channels.map((channel) => (
            <div key={channel.label} className='contact-item'>
              <span className='contact-item__icon'>
                <channel.icon size={18} aria-hidden='true' />
              </span>
              <span>
                <strong>{channel.label}</strong>
                {channel.href ? (
                  <a
                    className='contact-item__value is-linked'
                    href={channel.href}
                    {...(channel.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    {channel.value}
                  </a>
                ) : (
                  <span className={`contact-item__value${channel.value ? '' : ' is-pending'}`}>
                    {channel.value ?? 'لم تُعتمد بعد'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      {pending.length ? (
        <p className='checkout-blocked'>
          <ShieldAlert size={16} aria-hidden='true' />
          {pending.map((channel) => channel.label).join('، ')} لم تُعتمد بعد، فما ندرجش رقمًا أو
          بريدًا من عندنا. عند الاعتماد تُضاف في <code>src/data/company.js</code> فتظهر هنا وفي الفوتر
          والفاتورة وتعمل أزرار الاتصال في صفحات الأصناف تلقائيًا.
        </p>
      ) : null}

      <section className='card u-mt-4'>
        <h2>كيف تطلب كميات الآن؟</h2>
        <p className='section__subtitle u-mt-2'>
          جهّز أصنافك في السلة، ثم انسخ ملخص الطلب من صفحة إتمام الطلب كمسودة جاهزة للإرسال يدويًا بعد
          اعتماد قناة التواصل.
        </p>
        <div className='btn-row u-mt-4'>
          <Link to='/cart' className='btn btn--primary'>
            فتح سلة المشتريات
          </Link>
          <Link to='/checkout' className='btn btn--ghost'>
            صفحة إتمام الطلب
          </Link>
          <Link to='/wholesale' className='btn btn--ghost'>
            شروط الجملة
          </Link>
        </div>
      </section>
    </>
  )
}
