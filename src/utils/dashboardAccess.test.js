import { describe, expect, it } from 'vitest'
import {
  UNLOCK_FLAG,
  dashboardAccess,
  readUnlockFlag,
  setUnlockFlag,
} from './dashboardAccess.js'

describe('بوابة اللوحة: قرار الفتح', () => {
  it('التطوير المحلي يفتح بلا رمز — اللوحة ما تنقطعش عن التاجر', () => {
    expect(dashboardAccess({ prod: false, key: '', unlocked: false })).toBe('open')
    expect(dashboardAccess({ prod: false, key: 'سري', unlocked: false })).toBe('open')
  })

  it('نسخة الإنتاج بلا مفتاح مضبوط تقفل نفسها (fail-closed)', () => {
    expect(dashboardAccess({ prod: true, key: '', unlocked: true })).toBe('unconfigured')
  })

  it('في الإنتاج: الرمّ الصحيح يفتح، والغافل ما يشوفش اللوحة', () => {
    expect(dashboardAccess({ prod: true, key: 'دلتا-٢٠٢٦', unlocked: false })).toBe('form')
    expect(dashboardAccess({ prod: true, key: 'دلتا-٢٠٢٦', unlocked: true })).toBe('open')
  })
})

describe('علامة الفوت في مخزن الجلسة', () => {
  it('تبدأ مقفولة، والفتح يكتبها، والرمز نفسه ما يتسجلش', () => {
    expect(readUnlockFlag()).toBe(false)
    setUnlockFlag()
    expect(readUnlockFlag()).toBe(true)
    expect(sessionStorage.getItem(UNLOCK_FLAG)).toBe('1')
    expect(sessionStorage.length).toBe(1)
  })

  it('متصفح يقفل مخزن الجلسة يفضّل يسأل على الرمز كل مرة', () => {
    const blocked = {
      getItem() {
        throw new Error('منع')
      },
      setItem() {
        throw new Error('منع')
      },
    }
    const original = window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', { value: blocked, configurable: true })
    try {
      expect(readUnlockFlag()).toBe(false)
      expect(() => setUnlockFlag()).not.toThrow()
    } finally {
      Object.defineProperty(window, 'sessionStorage', { value: original, configurable: true })
    }
  })
})
