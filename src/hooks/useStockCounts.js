import { useSyncExternalStore } from 'react'
import { getStockCounts, subscribeStockCounts } from '../utils/stockCount.js'

// سجل العدّ كائن جديد عند كل تسجيل، فيصلح snapshot مباشرًا
export function useStockCounts() {
  return useSyncExternalStore(subscribeStockCounts, getStockCounts, getStockCounts)
}
