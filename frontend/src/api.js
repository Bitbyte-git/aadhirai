import { useCallback, useEffect, useRef } from 'react'
import axios from 'axios'

const BASE_URL_RAW = import.meta.env.VITE_BASE_URL || 'https://bitbyte-backend-f66f.onrender.com/api/'
const BASE_URL = BASE_URL_RAW.replace(/\/+$/, '')

// No timeout — Render's free-tier backend cold-starts after being idle and
// can take well over 25s to answer the first request; a timeout here was
// aborting genuinely-in-flight requests before the server even woke up.
const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function workReviewStorageKey() {
  try {
    const payload = localStorage.getItem('token')?.split('.')[1]
    if (!payload) return null
    const claims = JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/')))
    return claims.user_id ? `daily-work-reviews:${claims.user_id}` : null
  } catch { return null }
}

export function getDailyWorkReviewProofs() {
  try {
    const key = workReviewStorageKey()
    const reviews = key ? JSON.parse(localStorage.getItem(key) || '{}') : {}
    return { sales_review: reviews.sales_report || '', hierarchy_review: reviews.hierarchy_grid || '' }
  } catch { return { sales_review: '', hierarchy_review: '' } }
}

function rememberDailyWorkReview(response) {
  const review = response.data?.work_review
  const path = window.location.pathname.replace(/\/$/, '')
  const onReviewPage = review?.kind === 'sales_report' ? path === '/sales-report'
    : review?.kind === 'hierarchy_grid' && /^\/(admin|dealer|subdealer|promotor)-hierarchy-grid$/.test(path)
  if (!onReviewPage || !review.proof || !review.slot) return response
  try {
    const key = workReviewStorageKey()
    if (!key || key !== `daily-work-reviews:${review.user}`) return response
    const stored = JSON.parse(localStorage.getItem(key) || '{}')
    if (stored.date > review.date || (stored.date === review.date && stored.slot > review.slot)) return response
    const reviews = stored.date === review.date && stored.slot === review.slot ? stored : { date: review.date, slot: review.slot }
    reviews[review.kind] = review.proof
    localStorage.setItem(key, JSON.stringify(reviews))
    window.dispatchEvent(new Event('daily-work-reviews-updated'))
  } catch { /* A blocked store leaves check-in locked; it never bypasses server checks. */ }
  return response
}

api.interceptors.response.use(
  rememberDailyWorkReview,
  async (error) => {
    const original = error.config
    const hasAccessToken = Boolean(localStorage.getItem('token'))

    if (error.response?.status === 401 && !hasAccessToken) {
      return Promise.reject(error)
    }

    // Skip refresh for login and refresh endpoints — no retry
    if (
      original.url?.includes('/login/') ||
      original.url?.includes('/login/refresh/')
    ) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh')

        // Refresh token இல்லன்னா — direct logout, no API call
        if (!refresh || refresh === 'null' || refresh === 'undefined') {
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        const res = await axios.post(
          `${BASE_URL}/login/refresh/`,
          { refresh }
        )
        localStorage.setItem('token', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)

      } catch {
        // Refresh failed → force logout
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    // If still 401 after retry → force logout
    if (error.response?.status === 401 && original._retry) {
      localStorage.clear()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

// Downloads the Athirai-branded PDF receipt for an order (auth header handled
// by the interceptor above) — used by the "Download Receipt" buttons.
export const downloadOrderReceipt = async (orderId) => {
  const res = await api.get(`/orders/${orderId}/receipt/`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `athirai-receipt-${orderId}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Store sale (Sell popup) receipt — Athirai design, customer order receipt maariye
export const downloadSaleReceipt = async (saleId) => {
  const res = await api.get(`/stock-sales/${saleId}/receipt/`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `athirai-sale-receipt-BBSALE${String(saleId).padStart(6, '0')}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default api

export function checkoutAddress(item) {
  if (!item) return null
  return {
    ...item, type: item.label, isDefault: item.is_default,
    address: [item.house, item.street].filter(Boolean).join(', '),
    locality: item.landmark || '', door_no: item.house,
    address_line1: item.street, address_line2: item.landmark || '', district: item.city,
    formatted: [item.house, item.street, item.landmark, item.city, item.state, item.pincode, item.country === 'IN' ? 'India' : item.country].filter(Boolean).join(', '),
  }
}

export async function loadAddressBook() {
  const response = await api.get('/delivery-addresses/')
  return response.data
}

export function mapsSearchUrl(address) {
  const query = address.latitude != null && address.longitude != null
    ? `${address.latitude},${address.longitude}`
    : [address.house, address.street, address.city, address.state, address.pincode, address.country].filter(Boolean).join(', ') || 'India'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function mapsCoordinates(link) {
  try {
    const url = new URL(link)
    const query = url.searchParams.get('query') || url.searchParams.get('q') || ''
    const match = query.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/)
      || link.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
      || link.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
    if (match) {
      const latitude = Number(match[1]), longitude = Number(match[2])
      if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return { latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }
    }
  } catch { /* A shortened share link can still be saved without coordinates. */ }
  return { latitude: null, longitude: null }
}


export async function getCartFromDB() {
  try {
    const res = await api.get('/cart/')
    return Array.isArray(res.data) ? res.data : []
  } catch {
    return []
  }
}

export async function addToCartDB(productId, qty = 1) {
  try {
    const res = await api.post('/cart/', { product_id: productId, qty })
    window.dispatchEvent(new Event('bb_cart_update'))
    return res.data
  } catch (err) {
    console.error('Add to cart failed:', err)
    return null
  }
}

export async function removeFromCartDB(productId) {
  try {
    await api.delete('/cart/', { data: { product_id: productId } })
    window.dispatchEvent(new Event('bb_cart_update'))
  } catch (err) {
    console.error('Remove failed:', err)
  }
}

export async function updateQtyDB(cartItemId, qty) {
  try {
    const res = await api.patch(`/cart/${cartItemId}/qty/`, { qty })
    window.dispatchEvent(new Event('bb_cart_update'))
    return res.data
  } catch (err) {
    console.error('Qty update failed:', err)
    return null
  }
}

export async function getCartCountDB() {
  const items = await getCartFromDB()
  return items.reduce((acc, i) => acc + (i.qty || 1), 0)
}

export function getCart() { return [] }

export function saveCart() {}

export function addToCart(product, qty = 1) { return addToCartDB(typeof product === "object" ? product.id : product, qty) }

export function getCartCount() { return 0 }

// Keep subscription handlers current without restarting an observer or poller
// whenever a callback is recreated. Effects still declare their reactive keys.
export function useCommittedCallback(callback) {
  const latest = useRef(callback)
  useEffect(() => { latest.current = callback }, [callback])
  return useCallback((...args) => latest.current(...args), [])
}

// Invalidate async responses during teardown. This is a sequence counter,
// not a DOM ref whose node needs to be captured at subscription time.
export function invalidateRequestVersion(version) {
  version.current += 1
  return version.current
}
