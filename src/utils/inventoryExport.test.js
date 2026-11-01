import { describe, expect, it } from 'vitest'
import { buildCsv } from './csv.js'
import { inventoryFilename, inventoryHeaders, inventoryRows } from './inventoryExport.js'

const packed = {
  id: 'DL-1001',
  name: 'بخور أعواد',
  categoryId: 'incense',
  unit: 'علبة',
  packSize: 20,
  countUnit: 'عود',
  retailPrice: 22,
  offerPrice: 20,
  wholesalePrice: 18,
  wholesaleMinQuantity: 24,
  stock: 320,
}

const plain = {
  id: 'DL-3002',
  name: 'ولاعة جيب',
  categoryId: 'lighters',
  unit: 'قطعة',
  retailPrice: 55,
  stock: 0,
}

describe('inventoryHeaders / inventoryRows', () => {
  it('ترويسة بعدد خلايا كل سطر', () => {
    const headers = inventoryHeaders()
    inventoryRows([packed, plain]).forEach((row) => {
      expect(row).toHaveLength(headers.length)
    })
  })

  it('تفريغ العبوة والمكان والعدّ عند غيابها', () => {
    const row = inventoryRows([packed])[0]
    expect(row).toEqual([
      'DL-1001',
      'بخور أعواد',
      'البخور',
      '',
      'علبة',
      'علبة = 20 عود',
      22,
      20,
      18,
      24,
      480,
      320,
      '',
      '',
      'متوفر',
      'نعم',
    ])
  })

  it('صنف بلا عبوة: خانة المحتوى فارغة وبلا حد جملة', () => {
    const row = inventoryRows([plain])[0]
    expect(row[5]).toBe('')
    expect(row[9]).toBe('')
    expect(row[10]).toBe('')
    expect(row[12]).toBe('')
    expect(row[13]).toBe('')
    expect(row[14]).toBe('غير متوفر الآن')
    expect(row[15]).toBe('لا')
  })

  it('الأرقام تبقى بلا فواصل حتى تقرأها Excel كأرقام', () => {
    const [row] = inventoryRows([{ ...packed, stock: 2400, wholesaleMinQuantity: 1200 }])
    expect(row[9]).toBe(1200)
    expect(row[10]).toBe(20 * 1200)
    expect(String(row[11])).toBe('2400')
  })

  it('مخزون لم يُسجَّل: خانة فارغة وفارق غير محسوب', () => {
    const [row] = inventoryRows([{ ...plain, stock: undefined }])
    expect(row[11]).toBe('')
    expect(row[13]).toBe('')
    // صنف الدلتا الجديد بـ null صريحة لا يصدَّر صفرًا
    expect(inventoryRows([{ ...plain, stock: null }])[0][11]).toBe('')
    expect(inventoryRows([{ ...plain, stock: null }], { 'DL-3002': { count: 12 } })[0][13]).toBe('')
  })

  it('مكان الصنف يخرج في عموده الخاص', () => {
    const [row] = inventoryRows([{ ...packed, location: 'رف B3' }])
    expect(row[3]).toBe('رف B3')
  })

  it('العدّ المسجَّل يملأ العدد الفعلي ويحسب الفارق بالسالب', () => {
    const counts = { 'DL-1001': { count: 300 }, 'DL-3002': { count: 12 } }
    const [shortRow] = inventoryRows([packed], counts)
    const [overRow] = inventoryRows([plain], counts)
    expect(shortRow[11]).toBe(320)
    expect(shortRow[12]).toBe(300)
    expect(shortRow[13]).toBe(-20)
    expect(overRow[11]).toBe(0)
    expect(overRow[12]).toBe(12)
    expect(overRow[13]).toBe(12)
  })

  it('سجل عدّ تالف لا يكسر التصدير', () => {
    const [row] = inventoryRows([packed], { 'DL-1001': null })
    expect(row[12]).toBe('')
    expect(row[13]).toBe('')
    expect(inventoryRows([packed], null)[0][12]).toBe('')
  })

  it('الملف يبدأ بالترويسة العربية وقيم الصفوف بعده', () => {
    const csv = buildCsv(inventoryHeaders(), inventoryRows([packed]))
    const [head, body] = csv.split(String.fromCharCode(13, 10))
    expect(head.startsWith(String.fromCharCode(0xfeff) + 'الرمز,الصنف')).toBe(true)
    expect(body.startsWith('DL-1001,بخور أعواد')).toBe(true)
  })

  it('اسم الملف بالتاريخ الميلادي', () => {
    expect(inventoryFilename(new Date('2026-10-29T12:00:00Z'))).toBe('delta-inventory-2026-10-29.csv')
  })

  it('قائمة فارغة تعطي صفوفًا فارغة', () => {
    expect(inventoryRows([])).toEqual([])
    expect(inventoryRows(null)).toEqual([])
  })
})
