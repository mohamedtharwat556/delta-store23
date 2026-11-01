// رقم التواصل يُملى كما يُقرأ (بمسافات أو شرطات)، فالرابط يتبني من الأرقام وحدها لا من النص الخام
export function telHref(value) {
  if (!value) return null
  const cleaned = String(value).replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : null
}

// wa.me لا يقبل «+» ولا المسافات: الرقم لازم يبقى صورة دولية نظيفة، وإلا الرابط يفتح صفحة خطأ
export function whatsAppHref(value, text) {
  if (!value) return null
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
