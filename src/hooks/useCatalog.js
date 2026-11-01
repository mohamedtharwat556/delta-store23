import { useSyncExternalStore } from 'react'
import {
  getCatalogRevision,
  getCatalogSnapshot,
  getProductById,
  getProductBySlug,
  subscribeCatalog,
} from '../utils/catalogStore.js'

// الاشتراك في رقم المراجعة (قيمة عددية ثابتة) بدل المصفوفة، لأن المصفوفة تُبنى عند التغيير فقط.
function useCatalogRevision() {
  return useSyncExternalStore(subscribeCatalog, getCatalogRevision, getCatalogRevision)
}

export function useCatalog() {
  useCatalogRevision()
  return getCatalogSnapshot()
}

export function useProductLookup() {
  useCatalogRevision()
  return {
    byId: (id) => getProductById(id),
    bySlug: (slug) => getProductBySlug(slug),
  }
}
