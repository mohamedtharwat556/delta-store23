/**
 * طلبات تجريبية لواجهة تتبع الطلب ولوحة التحكم فقط.
 * لا يوجد خادم ولا بيانات عملاء حقيقية — الأسماء وأرقام التواصل والعناوين placeholders واضحة.
 */
export const ORDER_FLOW = ['created', 'confirmed', 'packed', 'dispatched', 'delivered']

export const ORDER_STATUS_LABELS = {
  created: 'تم استلام الطلب',
  confirmed: 'تم التأكيد',
  packed: 'تم التجهيز',
  dispatched: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

export const demoOrders = [
  {
    orderNumber: 'DL-2601',
    placedAt: '2026-10-24T10:15:00',
    channel: 'wholesale',
    customerLabel: 'عميل تجريبي — محلات',
    area: 'دمياط',
    address: 'عنوان تجريبي للعرض — بيانات غير حقيقية',
    phone: '01000000001',
    currentStatus: 'dispatched',
    items: [
      { productId: 'DL-3001', quantity: 80, unitPrice: 4.5, basis: 'wholesale' },
      { productId: 'DL-2001', quantity: 50, unitPrice: 25, basis: 'wholesale' },
    ],
    updates: [
      { status: 'created', at: '2026-10-24T10:15:00', note: 'استلمنا الطلب (بيانات تجريبية)' },
      { status: 'confirmed', at: '2026-10-24T13:40:00', note: 'تم تأكيد الكميات والسعر' },
      { status: 'packed', at: '2026-10-25T09:05:00', note: 'تم تجهيز الأصناف في المخزن' },
      { status: 'dispatched', at: '2026-10-25T16:20:00', note: 'خرجت الشحنة للتوصيل' },
    ],
  },
  {
    orderNumber: 'DL-2602',
    placedAt: '2026-10-26T18:02:00',
    channel: 'retail',
    customerLabel: 'عميل تجريبي — أفراد',
    area: 'الجيزة',
    address: 'عنوان تجريبي للعرض — بيانات غير حقيقية',
    phone: '01100000002',
    currentStatus: 'confirmed',
    items: [
      { productId: 'DL-2002', quantity: 2, unitPrice: 55, basis: 'retail' },
      { productId: 'DL-5001', quantity: 1, unitPrice: 25, basis: 'retail' },
    ],
    updates: [
      { status: 'created', at: '2026-10-26T18:02:00', note: 'استلمنا الطلب (بيانات تجريبية)' },
      { status: 'confirmed', at: '2026-10-26T19:10:00', note: 'تم تأكيد الطلب هاتفيًا' },
    ],
  },
  {
    orderNumber: 'DL-2603',
    placedAt: '2026-10-20T11:30:00',
    channel: 'wholesale',
    customerLabel: 'عميل تجريبي — مقاول',
    area: 'الإسكندرية',
    address: 'عنوان تجريبي للعرض — بيانات غير حقيقية',
    phone: '01200000003',
    currentStatus: 'delivered',
    items: [{ productId: 'DL-4001', quantity: 20, unitPrice: 46, basis: 'wholesale' }],
    updates: [
      { status: 'created', at: '2026-10-20T11:30:00', note: 'استلمنا الطلب (بيانات تجريبية)' },
      { status: 'confirmed', at: '2026-10-20T12:15:00', note: 'تم تأكيد الكميات' },
      { status: 'packed', at: '2026-10-21T08:45:00', note: 'تم التجهيز' },
      { status: 'dispatched', at: '2026-10-21T15:00:00', note: 'خرجت الشحنة' },
      { status: 'delivered', at: '2026-10-22T10:30:00', note: 'تم التسليم والاستلام' },
    ],
  },
]

export function findDemoOrder(orderNumber) {
  const normalized = (orderNumber ?? '').trim().toUpperCase()
  if (!normalized) return null
  return demoOrders.find((order) => order.orderNumber.toUpperCase() === normalized) ?? null
}

export const DASHBOARD_STATUSES = [...ORDER_FLOW, 'cancelled']

export const ORDER_CREATED_NOTE = 'سُجّل الطلب من هذا المتصفح (تجريبي، بدون خادم)'

function sequenceOf(orderNumber) {
  const parsed = Number(String(orderNumber ?? '').split('-')[1])
  return Number.isFinite(parsed) ? parsed : 0
}

export function nextOrderNumber(existingNumbers) {
  const highest = (existingNumbers ?? []).reduce((max, number) => Math.max(max, sequenceOf(number)), 0)
  return `DL-${Math.max(highest, 2603) + 1}`
}

