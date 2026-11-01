import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { OrderContext } from './order-context.js'
import { ORDER_CREATED_NOTE, demoOrders, nextOrderNumber } from '../data/orders.js'
import { getProductById } from '../utils/catalogStore.js'
import { sanitizeDelivery } from '../utils/delivery.js'
import { readJson, writeJson } from '../utils/storage.js'

const ORDERS_KEY = 'orders'
const OVERRIDES_KEY = 'order-status-overrides'

const isDemoOrder = (orderNumber) =>
  demoOrders.some((order) => order.orderNumber.toUpperCase() === String(orderNumber).toUpperCase())

function sanitizeItem(item) {
  const product = getProductById(item?.productId)
  if (!product) return null
  const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0))
  const unitPrice = Number(item.unitPrice)
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) return null
  return {
    productId: product.id,
    quantity,
    unitPrice,
    basis: item.basis === 'wholesale' || item.basis === 'offer' ? item.basis : 'retail',
  }
}

function sanitizeOrder(order) {
  if (!order || typeof order.orderNumber !== 'string') return null
  const items = (Array.isArray(order.items) ? order.items : []).map(sanitizeItem).filter(Boolean)
  if (!items.length) return null
  return {
    orderNumber: order.orderNumber.toUpperCase(),
    placedAt: order.placedAt ?? null,
    channel: order.channel === 'wholesale' ? 'wholesale' : 'retail',
    customerLabel: order.customerLabel ?? 'عميل',
    area: order.area ?? '—',
    address: order.address ?? '',
    phone: order.phone ?? '',
    notes: order.notes ?? '',
    currentStatus: ORDER_STATUS_FALLBACK(order.currentStatus),
    items,
    delivery: sanitizeDelivery(order.delivery),
    updates: Array.isArray(order.updates) ? order.updates : [],
  }
}

const ORDER_STATUS_KEYS = ['created', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled']

function ORDER_STATUS_FALLBACK(status) {
  return ORDER_STATUS_KEYS.includes(status) ? status : 'created'
}

function sanitizeLocalOrders(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(sanitizeOrder).filter(Boolean)
}

function sanitizeOverrides(raw) {
  if (!raw || typeof raw !== 'object') return {}
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([orderNumber]) => isDemoOrder(orderNumber))
      .map(([orderNumber, value]) => [
        orderNumber.toUpperCase(),
        {
          currentStatus: ORDER_STATUS_FALLBACK(value?.currentStatus),
          updates: Array.isArray(value?.updates) ? value.updates : [],
        },
      ])
  )
}

function readInitialState() {
  return {
    localOrders: sanitizeLocalOrders(readJson(ORDERS_KEY, [])),
    overrides: sanitizeOverrides(readJson(OVERRIDES_KEY, {})),
  }
}

function orderReducer(state, action) {
  switch (action.type) {
    case 'create':
      return { ...state, localOrders: [action.order, ...state.localOrders] }
    case 'setStatus': {
      const at = action.at
      const update = { status: action.status, at, note: action.note }

      if (action.isDemo) {
        const previous = state.overrides[action.orderNumber] ?? { currentStatus: null, updates: [] }
        return {
          ...state,
          overrides: {
            ...state.overrides,
            [action.orderNumber]: {
              currentStatus: action.status,
              updates: [...previous.updates, update],
            },
          },
        }
      }

      return {
        ...state,
        localOrders: state.localOrders.map((order) =>
          order.orderNumber === action.orderNumber
            ? { ...order, currentStatus: action.status, updates: [...order.updates, update] }
            : order
        ),
      }
    }
    case 'clearLocal':
      return { ...state, localOrders: [] }
    default:
      return state
  }
}

export function OrderProvider({ children }) {
  const [state, dispatch] = useReducer(orderReducer, null, readInitialState)

  useEffect(() => {
    writeJson(ORDERS_KEY, state.localOrders)
  }, [state.localOrders])

  useEffect(() => {
    writeJson(OVERRIDES_KEY, state.overrides)
  }, [state.overrides])

  const orders = useMemo(() => {
    const demo = demoOrders.map((order) => {
      const override = state.overrides[order.orderNumber]
      return {
        ...order,
        source: 'demo',
        currentStatus: override?.currentStatus ?? order.currentStatus,
        updates: override ? [...order.updates, ...override.updates] : order.updates,
      }
    })
    const local = state.localOrders.map((order) => ({ ...order, source: 'local' }))
    return [...local, ...demo].sort((a, b) => String(b.placedAt).localeCompare(String(a.placedAt)))
  }, [state.localOrders, state.overrides])

  const numbers = useMemo(() => orders.map((order) => order.orderNumber), [orders])

  const findOrder = useCallback(
    (orderNumber) => {
      const normalized = (orderNumber ?? '').trim().toUpperCase()
      if (!normalized) return null
      return orders.find((order) => order.orderNumber.toUpperCase() === normalized) ?? null
    },
    [orders]
  )

  const createOrder = useCallback(
    ({ customer, phone, area, address, notes, lines, delivery }) => {
      const items = lines
        .map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          basis: line.basis,
        }))
        .map(sanitizeItem)
        .filter(Boolean)

      if (!items.length) return null

      const at = new Date().toISOString()
      const order = sanitizeOrder({
        orderNumber: nextOrderNumber(numbers),
        placedAt: at,
        channel: items.some((item) => item.basis === 'wholesale') ? 'wholesale' : 'retail',
        customerLabel: customer,
        area,
        address,
        phone,
        notes,
        currentStatus: 'created',
        items,
        delivery: delivery ?? null,
        updates: [{ status: 'created', at, note: ORDER_CREATED_NOTE }],
      })

      if (!order) return null
      dispatch({ type: 'create', order })
      return order
    },
    [numbers]
  )

  const setOrderStatus = useCallback((orderNumber, status, note = '') => {
    const key = String(orderNumber).toUpperCase()
    const timestamp = new Date().toISOString()
    dispatch({
      type: 'setStatus',
      orderNumber: key,
      status,
      at: timestamp,
      note: note || 'تحديث تجريبي من لوحة التحكم — بدون خادم',
      isDemo: isDemoOrder(key),
    })
  }, [])

  const clearLocalOrders = useCallback(() => {
    dispatch({ type: 'clearLocal' })
  }, [])

  const value = useMemo(
    () => ({ orders, findOrder, createOrder, setOrderStatus, clearLocalOrders }),
    [orders, findOrder, createOrder, setOrderStatus, clearLocalOrders]
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}
