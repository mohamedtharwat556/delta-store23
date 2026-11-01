import { describe, expect, it } from 'vitest'
import { telHref, whatsAppHref } from './contactLinks.js'

describe('telHref', () => {
  it('يبني tel: من الرقم كما يُملى بمسافات أو شرطات', () => {
    expect(telHref('0109 123 4567')).toBe('tel:01091234567')
    expect(telHref('0109-123-4567')).toBe('tel:01091234567')
  })

  it('يحفظ «+» في بداية الرقم الدولي ويحذف ما عدا الأرقام', () => {
    expect(telHref('+20 109 123 4567')).toBe('tel:+201091234567')
    expect(telHref('خط الساخن 123')).toBe('tel:123')
  })

  it('بلا رقم أو بلا أرقام داخله = بلا رابط، فما نطلعش زر يشتغل في اللاشيء', () => {
    expect(telHref(null)).toBeNull()
    expect(telHref('')).toBeNull()
    expect(telHref('لم تُعتمد')).toBeNull()
  })
})

describe('whatsAppHref', () => {
  it('يحوّل الرقم لصيغة دولية بلا «+» ولا رموز، لأن wa.me يرفض أي غير الأرقام', () => {
    expect(whatsAppHref('+20 109 123 4567')).toBe('https://wa.me/201091234567')
    expect(whatsAppHref('00201091234567')).toBe('https://wa.me/00201091234567')
  })

  it('يلصق نص الرسالة مشفرًا لما يتقدَّم، فيوصل كما هو للتليفون', () => {
    const text = 'استفسار عن صنف: كبريت (DL-3001)'
    const url = new URL(whatsAppHref('201091234567', text))
    expect(url.origin + url.pathname).toBe('https://wa.me/201091234567')
    expect(url.searchParams.get('text')).toBe(text)
  })

  it('رقم بلا أرقام أو null = بلا رابط، فما نفتحش wa.me/ على صفحة فاضية', () => {
    expect(whatsAppHref(null, 'نص')).toBeNull()
    expect(whatsAppHref('', 'نص')).toBeNull()
    expect(whatsAppHref('لم تُعتمد بعد', 'نص')).toBeNull()
  })
})
