import { describe, expect, it } from 'vitest'
import { isValidPhone } from '../utils/checkout.js'
import { isGovernorate } from '../data/governorates.js'
import { demoOrders, DASHBOARD_STATUSES, findDemoOrder, nextOrderNumber, ORDER_FLOW, ORDER_STATUS_LABELS } from './orders.js'

describe('nextOrderNumber', () => {
  it('يبدأ من ما بعد آخر رقم تجريبي ثابت في الملف', () => {
    expect(nextOrderNumber([])).toBe('DL-2604')
    expect(nextOrderNumber(['DL-2601', 'DL-2602', 'DL-2603'])).toBe('DL-2604')
  })

  it('يتقدّم مع الطلبات المسجّلة حديثًا', () => {
    expect(nextOrderNumber(['DL-2604', 'DL-2605'])).toBe('DL-2606')
  })

  it('يتجاهل الأرقام غير المفهومة بدل أن ينكسر', () => {
    expect(nextOrderNumber(['سيئ', '', null])).toBe('DL-2604')
    expect(nextOrderNumber(undefined)).toBe('DL-2604')
  })
})

describe('بيانات الطلبات التجريبية', () => {
  it('كل طلب تجريبي له أصناف وحالة معروفة', () => {
    for (const order of demoOrders) {
      expect(order.items.length).toBeGreaterThan(0)
      expect(DASHBOARD_STATUSES).toContain(order.currentStatus)
      expect(ORDER_STATUS_LABELS[order.currentStatus]).toBeTruthy()
    }
  })

  it('بحث رقم الطلب لا يعتمد على حالة الأحرف', () => {
    expect(findDemoOrder('dl-2601')?.orderNumber).toBe('DL-2601')
    expect(findDemoOrder('  DL-2699 ')).toBeNull()
    expect(findDemoOrder('')).toBeNull()
  })

  it('مسار التسليم يمتد من الاستلام إلى التسليم', () => {
    expect(ORDER_FLOW).toEqual(['created', 'confirmed', 'packed', 'dispatched', 'delivered'])
    expect(DASHBOARD_STATUSES).toContain('cancelled')
  })

  it('كل طلب تجريبي له رقم تواصل ومحافظة معروفة', () => {
    for (const order of demoOrders) {
      expect(isValidPhone(order.phone)).toBe(true)
      expect(isGovernorate(order.area)).toBe(true)
      expect(order.address).toBeTruthy()
    }
  })
})
