import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { CartContext } from './cart-context.js'
import { useCatalog } from '../hooks/useCatalog.js'
import { getProductById } from '../utils/catalogStore.js'
import { availabilityOf, buildCartLines, clampQuantity, hasKnownPrice, summarizeLines } from '../utils/pricing.js'
import { readJson, writeJson } from '../utils/storage.js'

const STORAGE_KEY = 'cart'
const productById = (id) => getProductById(id)

// سببان للمنع، ورسالة لكل سبب: نفد العدد، أو لم تُحدِّد الشركة سعره بعد
// (الفراغ في stock لا يعني صفرًا، لكن «بلا سعر» يعني بلا بيع)
function rejectionOf(product) {
  if (!product) return 'missing'
  if (availabilityOf(product).key === 'out') return 'out'
  if (!hasKnownPrice(product)) return 'unpriced'
  return null
}

function sanitizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return []
  return rawItems
    .map((item) => {
      const product = productById(item?.productId)
      if (rejectionOf(product)) return null
      return { productId: product.id, quantity: clampQuantity(item.quantity, product) }
    })
    .filter(Boolean)
    .reduce((merged, item) => {
      const existing = merged.find((row) => row.productId === item.productId)
      if (existing) existing.quantity = item.quantity
      else merged.push(item)
      return merged
    }, [])
}

function readStoredCart() {
  return { items: sanitizeItems(readJson(STORAGE_KEY, [])) }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const product = productById(action.productId)
      if (rejectionOf(product)) return state
      const quantity = clampQuantity(action.quantity, product)
      const existing = state.items.find((item) => item.productId === product.id)
      const items = existing
        ? state.items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: clampQuantity(item.quantity + quantity, product) }
              : item
          )
        : [...state.items, { productId: product.id, quantity }]
      return { ...state, items }
    }
    case 'setQuantity': {
      const product = productById(action.productId)
      if (!product) return state
      const quantity = clampQuantity(action.quantity, product)
      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === product.id ? { ...item, quantity } : item
        ),
      }
    }
    case 'remove':
      return { ...state, items: state.items.filter((item) => item.productId !== action.productId) }
    case 'clear':
      return { ...state, items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, null, readStoredCart)
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [notification, setNotification] = useState(null)
  const notificationTimer = useRef(null)
  // تعديل التاجر للسعر أو المخزون لازم ينعكس على السلة المفتوحة فورًا
  const catalog = useCatalog()

  useEffect(() => {
    writeJson(STORAGE_KEY, state.items)
  }, [state.items])

  useEffect(() => () => clearTimeout(notificationTimer.current), [])

  const lookup = useMemo(() => {
    const byId = new Map(catalog.map((product) => [product.id, product]))
    return (id) => byId.get(id) ?? null
  }, [catalog])

  const lines = useMemo(() => buildCartLines(state.items, lookup), [state.items, lookup])
  const summary = useMemo(() => summarizeLines(lines), [lines])

  const notify = useCallback((message, tone = 'success') => {
    clearTimeout(notificationTimer.current)
    setNotification({ id: Date.now(), message, tone })
    notificationTimer.current = setTimeout(() => setNotification(null), 3200)
  }, [])

  const addToCart = useCallback(
    (productId, quantity = 1) => {
      const product = productById(productId)
      const rejection = rejectionOf(product)
      if (rejection === 'missing') {
        notify('المنتج غير متاح حاليًا', 'danger')
        return false
      }
      if (rejection === 'out') {
        notify('لا يمكن إضافة صنف غير متوفر', 'danger')
        return false
      }
      if (rejection === 'unpriced') {
        notify('لسه ما اتحدّدش سعر هذا الصنف، فما يضافش للسلة', 'danger')
        return false
      }
      dispatch({ type: 'add', productId, quantity })
      notify(`تمت إضافة ${product.name}`, 'success')
      return true
    },
    [notify]
  )

  const setQuantity = useCallback(
    (productId, quantity) => {
      dispatch({ type: 'setQuantity', productId, quantity })
    },
    []
  )

  // إعادة طلب: يُتجاهل ما لم يعد موجودًا أو نفد مخزونه أو لم يُسعَّر بعد، وتُضاف بقية الأصناف
  const addMany = useCallback(
    (entries) => {
      const available = (entries ?? []).filter((entry) => !rejectionOf(productById(entry?.productId)))
      const skipped = (entries?.length ?? 0) - available.length
      if (!available.length) {
        notify('لم يعد هناك أي صنف متاح من هذا الطلب', 'danger')
        return { added: 0, skipped }
      }
      available.forEach((entry) => dispatch({ type: 'add', productId: entry.productId, quantity: entry.quantity }))
      notify(
        skipped
          ? `أُضيف ${available.length} صنف — ${skipped} صنف لم يعد متوفرًا`
          : `أُضيف ${available.length} صنف إلى السلة`,
        skipped ? 'info' : 'success'
      )
      return { added: available.length, skipped }
    },
    [notify]
  )

  const value = useMemo(
    () => ({
      items: state.items,
      lines,
      summary,
      addToCart,
      addMany,
      setQuantity,
      removeItem: (productId) => {
        const product = productById(productId)
        dispatch({ type: 'remove', productId })
        notify(product ? `تم حذف ${product.name}` : 'تم حذف المنتج', 'info')
      },
      clearCart: () => {
        dispatch({ type: 'clear' })
        notify('تم إفراغ السلة', 'info')
      },
      isDrawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      notification,
      notify,
    }),
    [state.items, lines, summary, addToCart, addMany, setQuantity, isDrawerOpen, notification, notify]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
