import axios from 'axios'

const BASE_URL_RAW = import.meta.env.VITE_BASE_URL || 'https://bitbyte-backend-f66f.onrender.com/api/'
const BASE_URL = BASE_URL_RAW.replace(/\/+$/, '')

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 25000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
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

export default api
