import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildCsv, downloadTextFile } from './csv.js'

const CR = String.fromCharCode(13)
const LF = String.fromCharCode(10)

describe('buildCsv', () => {
  it('يبدأ بـ BOM ويفصل الأسطر بـ CRLF', () => {
    const csv = buildCsv(['عمود'], [['قيمة']])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toBe(String.fromCharCode(0xfeff) + 'عمود' + CR + LF + 'قيمة')
  })

  it('يقتبس الخلايا التي فيها فاصلة أو علامات اقتباس أو سطر جديد', () => {
    const csv = buildCsv(['أ', 'ب'], [['ولاعة "بيكو", كبيرة', 'سطر' + LF + 'ثان']])
    const lines = csv.slice(1).split(CR + LF)
    expect(lines[0]).toBe('أ,ب')
    expect(lines[1]).toBe('"ولاعة ""بيكو"", كبيرة","سطر' + LF + 'ثان"')
  })

  it('يحوّل الفارغ إلى خلية فارغة والفحص إلى نص', () => {
    const csv = buildCsv(['ن'], [[null, undefined, '', 0, 4.5]])
    expect(csv.slice(1).split(CR + LF)[1]).toBe(',,,0,4.5')
  })
})

describe('downloadTextFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ينشئ رابط تنزيل من Blob ثم يحرّر الرابط', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(Object.create(window.URL.prototype), {
      createObjectURL,
      revokeObjectURL,
    }))
    vi.useFakeTimers()

    expect(downloadTextFile('orders.csv', 'ملف')).toBe('orders.csv')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob)
    // الرابط يُزال بعد الضغط، والتحرير يأتي بعد مهلة قصيرة
    expect(document.querySelector('a[download="orders.csv"]')).toBeNull()

    await vi.advanceTimersByTimeAsync(1200)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    vi.useRealTimers()
  })
})
