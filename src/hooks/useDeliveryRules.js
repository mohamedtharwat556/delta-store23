import { useSyncExternalStore } from 'react'
import { getDeliveryRules, subscribeDeliveryRules } from '../utils/delivery.js'

// الكائن نفسه يُستبدل عند الحفظ فقط، فيصلح كـ snapshot مباشر
export function useDeliveryRules() {
  return useSyncExternalStore(subscribeDeliveryRules, getDeliveryRules, getDeliveryRules)
}
