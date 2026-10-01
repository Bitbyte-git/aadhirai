import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import * as XLSX from 'xlsx'
import api from '../api'
import {
  RefreshIcon,
  InboxIcon,
  JewelryIcon,
  PackageIcon,
  BullionIcon,
  SettingsIcon,
  PhoneIcon,
  LocationIcon,
  CalendarIcon,
  DownloadIcon,
  CheckIcon,
  SearchIcon,
  ClockIcon,
  CloseIcon,
  CopyIcon,
  CartIcon,
} from '../components/SvgIcons'

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#B7791F',
    bg: '#FEF3C7',
    border: 'rgba(217, 119, 6, 0.28)',
    dot: '#D97706',
    step: 1,
  },
  confirmed: {
    label: 'Confirmed',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: 'rgba(37, 99, 235, 0.28)',
    dot: '#3B82F6',
    step: 2,
  },
  processing: {
    label: 'Processing',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: 'rgba(124, 58, 237, 0.28)',
    dot: '#8B5CF6',
    step: 3,
  },
  shipped: {
    label: 'Shipped',
    color: '#0284C7',
    bg: '#F0F9FF',
    border: 'rgba(2, 132, 199, 0.28)',
    dot: '#0EA5E9',
    step: 4,
  },
  delivered: {
    label: 'Delivered',
    color: '#15803D',
    bg: '#ECFDF5',
    border: 'rgba(21, 128, 61, 0.28)',
    dot: '#10B981',
    step: 5,
  },
  cancelled: {
    label: 'Cancelled',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: 'rgba(220, 38, 38, 0.28)',
    dot: '#EF4444',
    step: 0,
  },
}

const PERIOD_OPTIONS = [
  { key: 'all', label: 'All Orders' },
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'This Month' },
  { key: '3month', label: '3 Months' },
  { key: 'year', label: '1 Year' },
  { key: 'custom', label: 'Custom Date' },
]

const CHART_PERIODS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7 Days' },
  { key: 'month', label: '30 Days' },
  { key: '3month', label: '3 Months' },
  { key: 'year', label: '1 Year' },
]

const STATUS_KEYS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const PAYMENT_METHODS = [
  { key: 'all', label: 'All Payment Methods' },
  { key: 'upi', label: 'UPI' },
  { key: 'debit_card', label: 'Debit Card' },
  { key: 'credit_card', label: 'Credit Card' },
  { key: 'net_banking', label: 'Net Banking' },
  { key: 'cash_on_delivery', label: 'Cash on Delivery' },
  { key: 'emi', label: 'EMI' },
]

const PAGE_SIZE = 30
const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

function SkeletonRow() {
  return (
    <tr className="aoc-skeleton-tr">
      <td style={{ padding: '16px 20px' }}>
        <div className="aoc-shimmer" style={{ width: '85px', height: '14px', marginBottom: '6px' }} />
        <div className="aoc-shimmer" style={{ width: '60px', height: '11px' }} />
      </td>
      <td style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="aoc-shimmer" style={{ width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="aoc-shimmer" style={{ width: '70%', height: '14px', marginBottom: '6px' }} />
            <div className="aoc-shimmer" style={{ width: '45%', height: '11px' }} />
          </div>
        </div>
      </td>
      <td style={{ padding: '16px 20px' }}>
        <div className="aoc-shimmer" style={{ width: '80%', height: '14px', marginBottom: '6px' }} />
        <div className="aoc-shimmer" style={{ width: '55%', height: '11px' }} />
      </td>
      <td style={{ padding: '16px 20px' }}>
        <div className="aoc-shimmer" style={{ width: '75px', height: '15px' }} />
      </td>
      <td style={{ padding: '16px 20px' }}>
        <div className="aoc-shimmer" style={{ width: '65px', height: '13px' }} />
      </td>
      <td style={{ padding: '16px 20px' }}>
        <div className="aoc-shimmer" style={{ width: '80px', height: '24px', borderRadius: '999px' }} />
      </td>
      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
        <div className="aoc-shimmer" style={{ width: '54px', height: '30px', borderRadius: '8px', marginLeft: 'auto' }} />
      </td>
    </tr>
  )
}

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [displayVal, setDisplayVal] = useState(Number(value || 0))
  const animRef = useRef(null)
  const currentValRef = useRef(Number(value || 0))

  useEffect(() => {
    const startVal = currentValRef.current
    const endVal = Number(value || 0)
    if (startVal === endVal) return

    const duration = 600
    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (endVal - startVal) * ease)
      currentValRef.current = current
      setDisplayVal(current)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        currentValRef.current = endVal
        setDisplayVal(endVal)
      }
    }
    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [value])

  return <span>{prefix}{displayVal.toLocaleString('en-IN')}{suffix}</span>
}

const getFallbackSeries = (p) => {
  if (p === 'today') {
    return ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '11 PM'].map(l => ({
      label: l,
      fullDate: `Today, ${l}`,
      count: 0,
    }))
  }
  if (p === 'week') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(l => ({
      label: l,
      fullDate: l,
      count: 0,
    }))
  }
  if (p === 'month') {
    return ['1st', '5th', '10th', '15th', '20th', '25th', '30th'].map(l => ({
      label: l,
      fullDate: `${l} of Month`,
      count: 0,
    }))
  }
  if (p === '3month') {
    return ['Month 1', 'Month 2', 'Month 3'].map(l => ({
      label: l,
      fullDate: l,
      count: 0,
    }))
  }
  if (p === 'year') {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(l => ({
      label: l,
      fullDate: l,
      count: 0,
    }))
  }
  if (p === 'all') {
    return ['2024', '2025', '2026'].map(l => ({
      label: l,
      fullDate: l,
      count: 0,
    }))
  }
  return ['Period 1', 'Period 2', 'Period 3'].map(l => ({ label: l, fullDate: l, count: 0 }))
}

export default function AdminOrdersPage() {
  const navigate = useNavigate()

  // Primary orders state
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
  })

  // Filters state
  const [period, setPeriod] = useState('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Selected Order & Details Drawer
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(null)

  // Tracking details
  const [trackingEvents, setTrackingEvents] = useState([])
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [addingTracking, setAddingTracking] = useState(false)
  const [trackingForm, setTrackingForm] = useState({ stage: 'in_transit', location: '', note: '' })

  // Analytics Chart State
  const [chartPeriod, setChartPeriod] = useState('today')
  const [chartData, setChartData] = useState(() => getFallbackSeries('today'))
  const [chartLoading, setChartLoading] = useState(false)

  // Real-time Auto-Refetch & Sync
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000) // 30s default
  const [lastSynced, setLastSynced] = useState(new Date())
  const [isSyncing, setIsSyncing] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (text, kind = 'success') => {
    setToast({ text, kind })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchIdRef = useRef(0)
  const abortRef = useRef(null)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 380)
    return () => clearTimeout(t)
  }, [searchInput])

  // Fetch Orders from backend (Initial 30 items)
  const fetchOrders = useCallback(async (offset = 0, limit = PAGE_SIZE, append = false, isBackground = false) => {
    if (period === 'custom' && (!customStart || !customEnd)) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const myId = ++fetchIdRef.current

    if (append) {
      setLoadingMore(true)
    } else if (!isBackground) {
      setLoading(true)
    } else {
      setIsSyncing(true)
    }

    try {
      const params = { period, status: filterStatus, search, offset, limit }
      if (period === 'custom') {
        params.start_date = customStart
        params.end_date = customEnd
      }
      const res = await api.get('/admin-orders/', { params, signal: controller.signal })
      if (myId !== fetchIdRef.current) return

      const data = res.data || {}
      setOrders(prev => (append ? [...prev, ...(data.results || [])] : (data.results || [])))
      setTotalCount(data.total_count || 0)
      setHasMore(!!data.has_more)
      if (data.stats) setStats(data.stats)
      setLastSynced(new Date())
    } catch (err) {
      if (myId !== fetchIdRef.current) return
      if (err?.code === 'ERR_CANCELED') return
      if (!isBackground) {
        showToast('Failed to fetch orders from server', 'error')
      }
    } finally {
      if (myId === fetchIdRef.current) {
        setLoading(false)
        setLoadingMore(false)
        setIsSyncing(false)
      }
    }
  }, [period, filterStatus, search, customStart, customEnd])

  // Trigger fetch when period / status / search / custom-dates change
  useEffect(() => {
    fetchOrders(0, PAGE_SIZE, false, false)
  }, [fetchOrders])

  // Infinite Scroll Trigger via IntersectionObserver
  const loadMoreSentinelRef = useRef(null)
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return

    const sentinel = loadMoreSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchOrders(orders.length, PAGE_SIZE, true, false)
        }
      },
      {
        root: null,
        rootMargin: '450px',
        threshold: 0.01,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, orders.length, fetchOrders])

  // Real-Time Polling Strategy
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return
    const timer = setInterval(() => {
      // Background silent refetch that updates stats & orders without jarring full-page loading spinner
      fetchOrders(0, orders.length > PAGE_SIZE ? orders.length : PAGE_SIZE, false, true)
    }, autoRefreshInterval)
    return () => clearInterval(timer)
  }, [autoRefreshInterval, fetchOrders, orders.length])

  // Fetch Time-Series Analytics
  const fetchTimeSeries = useCallback(async (periodKey = chartPeriod) => {
    setChartLoading(true)
    try {
      const res = await api.get('/order-timeseries/', { params: { period: periodKey } })
      const rawData = res.data?.data || []

      // Normalize time-series rows for Recharts
      const normalized = rawData.map(item => {
        let label = item.time
        let fullDate = item.time
        const d = new Date(item.time)

        if (!isNaN(d.getTime())) {
          if (periodKey === 'today') {
            label = d.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true })
            fullDate = `Today, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`
          } else if (periodKey === 'week') {
            label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
            fullDate = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
          } else if (periodKey === 'month' || periodKey === '3month') {
            label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            fullDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
          } else if (periodKey === 'year' || periodKey === 'all') {
            label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
            fullDate = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
          }
        }
        return {
          rawTime: item.time,
          label,
          fullDate,
          count: Number(item.count) || 0,
        }
      })
      if (normalized && normalized.length > 0) {
        setChartData(normalized)
      } else {
        setChartData(getFallbackSeries(periodKey))
      }
    } catch {
      setChartData(getFallbackSeries(periodKey))
    } finally {
      setChartLoading(false)
    }
  }, [chartPeriod])

  useEffect(() => {
    fetchTimeSeries(chartPeriod)
  }, [chartPeriod, fetchTimeSeries])

  // Update order status API
  const handleUpdateStatus = async (orderId, newStatus) => {
    setStatusUpdating(orderId)
    try {
      await api.patch(`/orders/${orderId}/`, { status: newStatus })
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      }
      setStats(prev => {
        const next = { ...prev }
        const order = orders.find(o => o.id === orderId)
        if (order && order.status !== newStatus) {
          if (next[order.status] > 0) next[order.status] -= 1
          next[newStatus] = (next[newStatus] || 0) + 1
        }
        return next
      })
      showToast(`Order status updated to ${newStatus.toUpperCase()}`)
      const orderIdStr = orders.find(o => o.id === orderId)?.order_id
      if (orderIdStr) fetchTracking(orderIdStr)
    } catch {
      showToast('Status update failed. Please try again.', 'error')
    } finally {
      setStatusUpdating(null)
    }
  }

  // Fetch shipment tracking events
  const fetchTracking = async orderIdStr => {
    setTrackingLoading(true)
    try {
      const res = await api.get(`/orders/${orderIdStr}/tracking/`)
      setTrackingEvents(res.data?.events || [])
    } catch {
      setTrackingEvents([])
    } finally {
      setTrackingLoading(false)
    }
  }

  // Add shipment tracking checkpoint
  const handleAddTracking = async orderIdStr => {
    if (!trackingForm.location.trim()) {
      showToast('Please specify a location or hub name', 'error')
      return
    }
    setAddingTracking(true)
    try {
      await api.post(`/orders/${orderIdStr}/tracking/`, trackingForm)
      setTrackingForm({ stage: 'in_transit', location: '', note: '' })
      fetchTracking(orderIdStr)
      showToast('Tracking update added successfully!')
    } catch {
      showToast('Could not record tracking checkpoint', 'error')
    } finally {
      setAddingTracking(false)
    }
  }

  // Open Details Drawer
  const handleOpenDrawer = order => {
    setSelectedOrder(order)
    fetchTracking(order.order_id)
  }

  // Close Drawer
  const handleCloseDrawer = () => {
    setSelectedOrder(null)
    setTrackingEvents([])
  }

  // Helper formatting
  const inr = n => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`
  const formatDate = d =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const formatDateTime = d =>
    new Date(d).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

  const getImageUrl = url => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${API_BASE}/${url.replace(/^\/+/, '')}`
  }

  // Client-side payment method filter
  const filteredOrders = useMemo(() => {
    if (paymentFilter === 'all') return orders
    return orders.filter(o => o.payment_method === paymentFilter)
  }, [orders, paymentFilter])

  // Average Order Value (AOV) - Rounded to clean integer INR
  const aov = useMemo(() => {
    return stats.total > 0 ? Math.round(stats.revenue / stats.total) : 0
  }, [stats.total, stats.revenue])

  // Peak orders count in current chart
  const maxChartCount = useMemo(() => {
    if (!chartData.length) return 0
    return Math.max(...chartData.map(d => d.count), 0)
  }, [chartData])

  // Recent 5 live orders preview
  const recentOrdersPreview = useMemo(() => {
    return orders.slice(0, 5)
  }, [orders])

  const [downloadingReport, setDownloadingReport] = useState(false)

  // Handle top period selection
  const handleSelectPeriod = newPeriod => {
    setPeriod(newPeriod)
    if (newPeriod !== 'custom') {
      setChartPeriod(newPeriod)
    }
  }

  // Export filtered table data as an Athirai branded PDF Document Report
  const handleExportReport = async () => {
    if (filteredOrders.length === 0) {
      showToast('No orders available to export in current view', 'error')
      return
    }
    setDownloadingReport(true)
    try {
      const columns = ['S.No', 'Order ID', 'Customer & Contact', 'Product Ordered', 'Payment', 'Total Price', 'Status', 'Date']
      
      const rowsPayload = filteredOrders.map((o, idx) => [
        String(idx + 1),
        o.order_id || '—',
        `${o.customer_name || 'Customer'}\n${o.customer_phone || ''}`.trim(),
        `${o.product_name || 'Jewelry Piece'}${o.quantity > 1 ? ` (Qty: ${o.quantity})` : ''}`,
        (o.payment_method || '—').replace(/_/g, ' ').toUpperCase(),
        `Rs. ${Number(o.total_price || 0).toLocaleString('en-IN')}`,
        (STATUS_CONFIG[o.status]?.label || o.status || '—').toUpperCase(),
        o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
      ])

      const currentPeriodObj = PERIOD_OPTIONS.find(p => p.key === period)
      const periodLabel = period === 'custom' 
        ? `Scope: Custom Range (${customStart || 'Start'} to ${customEnd || 'End'})`
        : `Scope: ${currentPeriodObj?.label || 'All Orders'}`

      const res = await api.post('/generic-table-pdf/', {
        title: 'Athirai Orders Operations Report',
        subtitle: 'Enterprise Order Management, Tracking & Customer Fulfillment Registry',
        period_label: periodLabel,
        landscape: true,
        col_widths: [0.05, 0.15, 0.18, 0.22, 0.11, 0.11, 0.09, 0.09],
        stats: [
          { label: 'Total Orders', value: String(stats.total) },
          { label: 'Gross Revenue', value: `Rs. ${Number(stats.revenue).toLocaleString('en-IN')}` },
          { label: 'Pending', value: String(stats.pending) },
          { label: 'Confirmed', value: String(stats.confirmed) },
          { label: 'Shipped', value: String(stats.shipped) },
          { label: 'Delivered', value: String(stats.delivered) },
        ],
        columns,
        rows: rowsPayload,
      }, { responseType: 'blob' })

      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `athirai_orders_report_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast('Document report downloaded successfully!')
    } catch (err) {
      console.error('Failed to export PDF report:', err)
      showToast('Failed to download report document', 'error')
    } finally {
      setDownloadingReport(false)
    }
  }

  return (
    <div className="aoc-page">
      <style>{`
        /* Global & Shell */
        .aoc-page {
          min-height: 100vh;
          background: #F8FAF9;
          color: #11201E;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          padding: 24px clamp(16px, 2.5vw, 36px) 60px;
          box-sizing: border-box;
        }

        .aoc-shell {
          max-width: 1440px;
          margin: 0 auto;
        }

        /* Animations */
        @keyframes aocFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes aocShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes aocPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.55; }
        }

        .aoc-shimmer {
          background: linear-gradient(90deg, #EBF1F0 25%, #F7FAF9 50%, #EBF1F0 75%);
          background-size: 200% 100%;
          animation: aocShimmer 1.5s infinite ease-in-out;
          border-radius: 6px;
        }

        /* Top Page Header */
        .aoc-header-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .aoc-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .aoc-header-badge {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: #073B3F;
          color: #E2BC82;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(7, 59, 63, 0.22);
          flex-shrink: 0;
        }

        .aoc-header-title {
          font-size: 23px;
          font-weight: 800;
          color: #073B3F;
          letter-spacing: -0.015em;
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .aoc-header-tag {
          font-size: 11px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(12, 64, 68, 0.1);
          color: #0C4044;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .aoc-header-sub {
          font-size: 13px;
          color: #647B78;
          margin: 0;
        }

        .aoc-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* Sync & Action Buttons */
        .aoc-sync-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #DCE5E4;
          border-radius: 11px;
          padding: 7px 14px;
          font-size: 12px;
          color: #4C6562;
          box-shadow: 0 2px 6px rgba(7, 59, 63, 0.03);
        }

        .aoc-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
          animation: aocPulse 2s infinite ease-in-out;
        }

        .aoc-btn {
          height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.18s ease;
          box-shadow: 0 2px 6px rgba(7, 59, 63, 0.04);
        }

        .aoc-btn-white {
          background: #FFFFFF;
          border: 1px solid #D5E0DD;
          color: #073B3F;
        }

        .aoc-btn-white:hover {
          background: #F0F5F4;
          border-color: #073B3F;
          transform: translateY(-1px);
        }

        .aoc-btn-primary {
          background: #073B3F;
          border: 1px solid #073B3F;
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.18);
        }

        .aoc-btn-primary:hover:not(:disabled) {
          background: #0B4E53;
          transform: translateY(-1px);
        }

        .aoc-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* KPI Section */
        /* KPI Section */
        .aoc-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        @media (min-width: 1560px) {
          .aoc-kpi-grid {
            grid-template-columns: repeat(7, minmax(0, 1fr));
          }
        }
        @media (max-width: 1559px) and (min-width: 1140px) {
          .aoc-kpi-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 1139px) and (min-width: 768px) {
          .aoc-kpi-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 767px) and (min-width: 480px) {
          .aoc-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 479px) {
          .aoc-kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        .aoc-kpi-card {
          background: #FFFFFF;
          border: 1px solid #DFE8E6;
          border-radius: 16px;
          padding: 16px 18px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          position: relative;
          overflow: hidden;
          min-width: 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .aoc-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.08);
          border-color: #B4C7C5;
        }

        .aoc-kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          gap: 6px;
        }

        .aoc-kpi-label {
          font-size: 11px;
          font-weight: 800;
          color: #647B78;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aoc-kpi-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }

        .aoc-kpi-value {
          font-size: clamp(20px, 1.45vw, 25px);
          font-weight: 800;
          color: #11201E;
          letter-spacing: -0.02em;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .aoc-kpi-value-money {
          font-size: clamp(15px, 1.1vw, 20px);
          letter-spacing: -0.025em;
        }

        .aoc-kpi-sub {
          font-size: 11.5px;
          color: #728A87;
          margin-top: 6px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Needs Attention Banner - Athirai Luxury Theme */
        .aoc-attention-banner {
          background: linear-gradient(135deg, #073B3F 0%, #0D4E53 100%);
          border: 1px solid rgba(226, 188, 130, 0.4);
          border-radius: 16px;
          padding: 16px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.12);
        }

        .aoc-attention-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .aoc-attention-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(226, 188, 130, 0.16);
          border: 1.5px solid #E2BC82;
          color: #E2BC82;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 18px;
          flex-shrink: 0;
        }

        .aoc-attention-text h4 {
          margin: 0 0 4px;
          font-size: 14.5px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.01em;
        }

        .aoc-attention-text p {
          margin: 0;
          font-size: 12.5px;
          color: #C5DEDA;
        }

        .aoc-attention-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .aoc-attention-btn {
          padding: 9px 18px;
          border-radius: 999px;
          background: #E2BC82;
          color: #073B3F;
          border: none;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        .aoc-attention-btn:hover {
          background: #F3D9A4;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(226, 188, 130, 0.35);
        }

        .aoc-end-records {
          padding: 18px 24px;
          text-align: center;
          border-top: 1px solid #DFE8E6;
          background: #FAFCFB;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #647B78;
          font-size: 12.5px;
          font-weight: 600;
        }

        .aoc-end-records strong {
          color: #073B3F;
          font-weight: 800;
        }

        /* Analytics & Funnel Split Section */
        .aoc-split-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .aoc-card {
          background: #FFFFFF;
          border: 1px solid #DFE8E6;
          border-radius: 18px;
          padding: 22px 24px;
          box-shadow: 0 6px 22px rgba(7, 59, 63, 0.04);
        }

        .aoc-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .aoc-card-title-group h3 {
          font-size: 16px;
          font-weight: 800;
          color: #073B3F;
          margin: 0 0 3px;
          letter-spacing: -0.01em;
        }

        .aoc-card-title-group p {
          font-size: 12px;
          color: #728A87;
          margin: 0;
        }

        .aoc-period-chips {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #F2F7F6;
          padding: 4px;
          border-radius: 10px;
        }

        .aoc-period-chip {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 700;
          color: #55726F;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .aoc-period-chip.active {
          background: #073B3F;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(7, 59, 63, 0.2);
        }

        .aoc-chart-wrap {
          height: 270px;
          width: 100%;
          position: relative;
        }

        .aoc-chart-tooltip {
          background: rgba(7, 59, 63, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(226, 188, 130, 0.4);
          border-radius: 10px;
          padding: 10px 14px;
          color: #FFFFFF;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
        }

        .aoc-chart-tooltip p {
          margin: 0 0 4px;
          font-size: 11px;
          color: #E2BC82;
          font-weight: 700;
        }

        .aoc-chart-tooltip strong {
          font-size: 16px;
          font-weight: 800;
          color: #FFFFFF;
        }

        /* Status Funnel / Pipeline */
        .aoc-funnel-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .aoc-funnel-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #E5ECEB;
          background: #FBFDFD;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .aoc-funnel-item:hover, .aoc-funnel-item.active {
          border-color: #073B3F;
          background: #F0F6F5;
          transform: translateX(3px);
        }

        .aoc-funnel-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .aoc-funnel-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .aoc-funnel-name {
          font-size: 13px;
          font-weight: 700;
          color: #11201E;
        }

        .aoc-funnel-counts {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .aoc-funnel-num {
          font-size: 15px;
          font-weight: 800;
          color: #073B3F;
          font-family: monospace;
        }

        .aoc-funnel-pct {
          font-size: 11px;
          color: #728A87;
          font-weight: 600;
          min-width: 38px;
          text-align: right;
        }

        /* Recent Orders Strip */
        .aoc-recent-strip {
          background: #FFFFFF;
          border: 1px solid #DFE8E6;
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          overflow-x: auto;
        }

        .aoc-recent-strip-label {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          color: #073B3F;
          letter-spacing: 0.08em;
          white-space: nowrap;
          padding-right: 12px;
          border-right: 1.5px solid #E2EBEA;
        }

        .aoc-recent-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 12px;
          background: #F8FAF9;
          border: 1px solid #E2EBEA;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.16s ease;
          flex-shrink: 0;
        }

        .aoc-recent-card:hover {
          background: #F0F6F5;
          border-color: #073B3F;
          transform: translateY(-1px);
        }

        /* Top Level Period Bar */
        .aoc-top-period-bar {
          background: #FFFFFF;
          border: 1px solid #DFE8E6;
          border-radius: 14px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.03);
        }

        .aoc-top-period-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .aoc-period-legend {
          font-size: 12px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .aoc-top-period-right {
          font-size: 12.5px;
          color: #55726F;
        }

        .aoc-period-active-hint strong {
          color: #073B3F;
          font-weight: 800;
        }

        .aoc-date-label {
          font-size: 12px;
          font-weight: 700;
          color: #55726F;
        }

        /* Advanced Filter Bar */
        .aoc-filter-bar {
          background: #FFFFFF;
          border: 1px solid #DFE8E6;
          border-radius: 16px;
          padding: 18px 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
        }

        .aoc-filter-top-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .aoc-period-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        .aoc-period-pill {
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid #D5E0DD;
          background: #FFFFFF;
          color: #4C6562;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .aoc-period-pill.active {
          background: #073B3F;
          border-color: #073B3F;
          color: #FFFFFF;
          box-shadow: 0 3px 10px rgba(7, 59, 63, 0.2);
        }

        .aoc-custom-range {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-left: 6px;
        }

        .aoc-date-input {
          padding: 7px 12px;
          border-radius: 8px;
          border: 1px solid #D5E0DD;
          font-size: 12.5px;
          color: #11201E;
          background: #FFFFFF;
          outline: none;
        }

        .aoc-date-input:focus {
          border-color: #073B3F;
        }

        .aoc-filter-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .aoc-search-box {
          flex: 1;
          min-width: 280px;
          position: relative;
        }

        .aoc-search-input {
          width: 100%;
          box-sizing: border-box;
          background: #FDFDFC;
          border: 1px solid #D7E3E1;
          border-radius: 11px;
          padding: 10px 16px 10px 40px;
          font-size: 13.5px;
          color: #11201E;
          outline: none;
          transition: border-color 0.18s ease;
        }

        .aoc-search-input:focus {
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.08);
        }

        .aoc-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #7A9390;
          pointer-events: none;
        }

        .aoc-status-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        .aoc-status-chip {
          padding: 7px 13px;
          border-radius: 8px;
          border: 1px solid #DCE5E4;
          background: #FFFFFF;
          color: #5F7875;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-transform: capitalize;
        }

        .aoc-status-chip.active {
          background: #073B3F;
          border-color: #073B3F;
          color: #FFFFFF;
        }

        .aoc-status-count-tag {
          font-size: 10.5px;
          padding: 1px 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.07);
          font-weight: 800;
        }

        .aoc-status-chip.active .aoc-status-count-tag {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
        }

        .aoc-select-method {
          height: 38px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid #D5E0DD;
          background: #FFFFFF;
          font-size: 12.5px;
          color: #314C48;
          font-weight: 600;
          outline: none;
          cursor: pointer;
        }

        /* Order Data Table */
        .aoc-table-card {
          background: #FFFFFF;
          border: 1px solid #DFE8E6;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(7, 59, 63, 0.04);
          margin-bottom: 24px;
        }

        .aoc-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .aoc-table th {
          background: #F4F7F6;
          padding: 14px 20px;
          font-size: 11px;
          font-weight: 800;
          color: #55726F;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #DFE8E6;
        }

        .aoc-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #EBF1F0;
          font-size: 13.5px;
          color: #11201E;
          vertical-align: middle;
        }

        .aoc-table tr.aoc-row {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .aoc-table tr.aoc-row:hover {
          background: #F4FAF9;
        }

        .aoc-table tr.aoc-row.selected {
          background: #EAF4F3;
        }

        .aoc-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .aoc-status-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .aoc-view-btn {
          padding: 6px 14px;
          border-radius: 8px;
          background: #FFFFFF;
          border: 1px solid #D1DFDE;
          color: #073B3F;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .aoc-view-btn:hover {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
        }

        /* Right Slide-over Drawer */
        .aoc-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(7, 31, 34, 0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 1050;
          display: flex;
          justify-content: flex-end;
          animation: aocFadeIn 0.2s ease both;
        }

        .aoc-drawer {
          width: 100%;
          max-width: 580px;
          height: 100vh;
          background: #FFFFFF;
          box-shadow: -10px 0 40px rgba(7, 59, 63, 0.2);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          box-sizing: border-box;
          animation: aocFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .aoc-drawer-header {
          padding: 22px 26px;
          background: linear-gradient(135deg, #073B3F 0%, #0F5C62 100%);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .aoc-drawer-close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
        }

        .aoc-drawer-body {
          padding: 24px 26px 40px;
          flex: 1;
        }

        .aoc-drawer-card {
          background: #F9FBFA;
          border: 1px solid #E3ECeb;
          border-radius: 14px;
          padding: 18px 20px;
          margin-bottom: 20px;
        }

        .aoc-drawer-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #073B3F;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .aoc-timeline-track {
          position: relative;
          padding-left: 24px;
        }

        .aoc-timeline-track:before {
          content: "";
          position: absolute;
          left: 7px;
          top: 4px;
          bottom: 4px;
          width: 2px;
          background: #DCE5E4;
        }

        .aoc-timeline-node {
          position: relative;
          margin-bottom: 18px;
        }

        .aoc-timeline-node:last-child {
          margin-bottom: 0;
        }

        .aoc-timeline-dot {
          position: absolute;
          left: -24px;
          top: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 3px solid #073B3F;
          box-sizing: border-box;
        }

        .aoc-timeline-dot.active {
          border-color: #10B981;
          background: #10B981;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1080px) {
          .aoc-split-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .aoc-page {
            padding: 16px 12px 40px;
          }
          .aoc-header-wrap {
            flex-direction: column;
            align-items: flex-start;
          }
          .aoc-header-right {
            width: 100%;
          }
          .aoc-card {
            padding: 16px 16px;
          }
          .aoc-filter-bar {
            padding: 14px 14px;
          }
          .aoc-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .aoc-drawer {
            max-width: 100%;
          }
        }
      `}</style>

      <div className="aoc-shell">
        {/* Top Header Bar */}
        <div className="aoc-header-wrap">
          <div className="aoc-header-left">
            <div className="aoc-header-badge">
              <PackageIcon size={24} color="#E2BC82" />
            </div>
            <div>
              <h1 className="aoc-header-title">
                Athirai Order Control Center
                <span className="aoc-header-tag">Live Operations</span>
              </h1>
              <p className="aoc-header-sub">
                Enterprise order logistics, tracking checkpoints, revenue analytics & customer fulfillment
              </p>
            </div>
          </div>

          <div className="aoc-header-right">
            {/* Live Sync Status */}
            <div className="aoc-sync-status">
              <span className="aoc-pulse-dot" />
              <span>
                {isSyncing ? 'Syncing with DB...' : `Synced ${lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>

            {/* Auto Refresh Frequency Dropdown */}
            <select
              value={autoRefreshInterval}
              onChange={e => setAutoRefreshInterval(Number(e.target.value))}
              className="aoc-select-method"
              title="Select real-time refresh polling frequency"
            >
              <option value={0}>Auto-Sync: Off</option>
              <option value={15000}>Auto-Sync: 15s</option>
              <option value={30000}>Auto-Sync: 30s</option>
              <option value={60000}>Auto-Sync: 60s</option>
            </select>

            {/* Instant Manual Refresh */}
            <button
              type="button"
              className="aoc-btn aoc-btn-white"
              onClick={() => {
                fetchOrders(0, PAGE_SIZE, false, false)
                fetchTimeSeries(chartPeriod)
                showToast('Refreshed orders and real-time analytics!')
              }}
              disabled={loading || isSyncing}
              title="Manual Instant Database Fetch"
            >
              <RefreshIcon size={14} color="#073B3F" />
              <span>{loading || isSyncing ? 'Refreshing...' : 'Sync Now'}</span>
            </button>

            {/* Export Document Report Button */}
            <button
              type="button"
              className="aoc-btn aoc-btn-primary"
              onClick={handleExportReport}
              disabled={downloadingReport || filteredOrders.length === 0}
              title="Download Athirai Branded PDF Document Report"
            >
              <DownloadIcon size={14} color="#FFFFFF" />
              <span>{downloadingReport ? 'Preparing PDF...' : 'Export Report'}</span>
            </button>
          </div>
        </div>

        {/* TOP LEVEL TIMEFRAME NAVIGATION BAR */}
        <div className="aoc-top-period-bar">
          <div className="aoc-top-period-left">
            <span className="aoc-period-legend">
              <CalendarIcon size={15} color="#073B3F" />
              <span>Timeframe:</span>
            </span>
            <div className="aoc-period-pills">
              {PERIOD_OPTIONS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  className={`aoc-period-pill ${period === p.key ? 'active' : ''}`}
                  onClick={() => handleSelectPeriod(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            {period === 'custom' && (
              <div className="aoc-custom-range">
                <span className="aoc-date-label">From:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="aoc-date-input"
                />
                <span className="aoc-date-label">To:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="aoc-date-input"
                />
              </div>
            )}
          </div>

          <div className="aoc-top-period-right">
            <span className="aoc-period-active-hint">
              Active Scope: <strong>{PERIOD_OPTIONS.find(p => p.key === period)?.label || 'All Orders'}</strong>
            </span>
          </div>
        </div>

        {/* SECTION 1: Real Order KPI Summary */}
        <div className="aoc-kpi-grid">
          {/* Total Orders */}
          <div className="aoc-kpi-card" onClick={() => setFilterStatus('all')} style={{ cursor: 'pointer' }}>
            <div className="aoc-kpi-top">
              <span className="aoc-kpi-label">Total Orders</span>
              <div className="aoc-kpi-icon" style={{ background: 'rgba(7, 59, 63, 0.1)', color: '#073B3F' }}>
                <PackageIcon size={16} color="#073B3F" />
              </div>
            </div>
            <div className="aoc-kpi-value"><AnimatedNumber value={stats.total} /></div>
            <div className="aoc-kpi-sub">
              {period === 'all'
                ? 'All-time placed orders'
                : `Total placed in ${PERIOD_OPTIONS.find(p => p.key === period)?.label || period}`}
            </div>
          </div>

          {/* Pending Confirmation */}
          <div className="aoc-kpi-card" onClick={() => setFilterStatus('pending')} style={{ cursor: 'pointer' }}>
            <div className="aoc-kpi-top">
              <span className="aoc-kpi-label" style={{ color: '#B7791F' }}>Pending</span>
              <div className="aoc-kpi-icon" style={{ background: '#FEF3C7', color: '#B7791F' }}>
                <ClockIcon size={15} color="#B7791F" />
              </div>
            </div>
            <div className="aoc-kpi-value" style={{ color: '#B7791F' }}><AnimatedNumber value={stats.pending} /></div>
            <div className="aoc-kpi-sub">Needs verification</div>
          </div>

          {/* Confirmed */}
          <div className="aoc-kpi-card" onClick={() => setFilterStatus('confirmed')} style={{ cursor: 'pointer' }}>
            <div className="aoc-kpi-top">
              <span className="aoc-kpi-label" style={{ color: '#2563EB' }}>Confirmed</span>
              <div className="aoc-kpi-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <CheckIcon size={16} color="#2563EB" />
              </div>
            </div>
            <div className="aoc-kpi-value" style={{ color: '#2563EB' }}><AnimatedNumber value={stats.confirmed} /></div>
            <div className="aoc-kpi-sub">Ready for packing</div>
          </div>

          {/* Processing */}
          <div className="aoc-kpi-card" onClick={() => setFilterStatus('processing')} style={{ cursor: 'pointer' }}>
            <div className="aoc-kpi-top">
              <span className="aoc-kpi-label" style={{ color: '#7C3AED' }}>Processing</span>
              <div className="aoc-kpi-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                <SettingsIcon size={15} color="#7C3AED" />
              </div>
            </div>
            <div className="aoc-kpi-value" style={{ color: '#7C3AED' }}><AnimatedNumber value={stats.processing} /></div>
            <div className="aoc-kpi-sub">In preparation / vault</div>
          </div>

          {/* Shipped */}
          <div className="aoc-kpi-card" onClick={() => setFilterStatus('shipped')} style={{ cursor: 'pointer' }}>
            <div className="aoc-kpi-top">
              <span className="aoc-kpi-label" style={{ color: '#0284C7' }}>Shipped</span>
              <div className="aoc-kpi-icon" style={{ background: '#F0F9FF', color: '#0284C7' }}>
                <LocationIcon size={15} color="#0284C7" />
              </div>
            </div>
            <div className="aoc-kpi-value" style={{ color: '#0284C7' }}><AnimatedNumber value={stats.shipped} /></div>
            <div className="aoc-kpi-sub">In transit to customer</div>
          </div>

          {/* Delivered */}
          <div className="aoc-kpi-card" onClick={() => setFilterStatus('delivered')} style={{ cursor: 'pointer' }}>
            <div className="aoc-kpi-top">
              <span className="aoc-kpi-label" style={{ color: '#15803D' }}>Delivered</span>
              <div className="aoc-kpi-icon" style={{ background: '#ECFDF5', color: '#15803D' }}>
                <CheckIcon size={16} color="#15803D" />
              </div>
            </div>
            <div className="aoc-kpi-value" style={{ color: '#15803D' }}><AnimatedNumber value={stats.delivered} /></div>
            <div className="aoc-kpi-sub">Successfully fulfilled</div>
          </div>

          {/* Total Revenue */}
          <div className="aoc-kpi-card" title={`Gross Revenue: ₹${Number(stats.revenue).toLocaleString('en-IN')}`}>
            <div className="aoc-kpi-top">
              <span className="aoc-kpi-label">Gross Revenue</span>
              <div className="aoc-kpi-icon" style={{ background: 'rgba(226, 188, 130, 0.25)', color: '#A16207' }}>
                <BullionIcon size={16} color="#073B3F" />
              </div>
            </div>
            <div className="aoc-kpi-value aoc-kpi-value-money" style={{ color: '#073B3F' }}>
              <AnimatedNumber value={stats.revenue} prefix="₹" />
            </div>
            <div className="aoc-kpi-sub" title={`Average Order Value: ₹${Number(aov).toLocaleString('en-IN')}`}>
              AOV: <AnimatedNumber value={aov} prefix="₹" />
            </div>
          </div>
        </div>

        {/* SECTION 6: Needs Attention Banner (Real Pending / Cancelled alerts) */}
        {(stats.pending > 0 || stats.cancelled > 0) && (
          <div className="aoc-attention-banner">
            <div className="aoc-attention-left">
              <div className="aoc-attention-badge">!</div>
              <div className="aoc-attention-text">
                <h4>
                  Operational Attention Required:{' '}
                  {stats.pending > 0 ? `${stats.pending} Pending Order(s)` : ''}{' '}
                  {stats.pending > 0 && stats.cancelled > 0 ? '· ' : ''}
                  {stats.cancelled > 0 ? `${stats.cancelled} Cancelled Order(s)` : ''}
                </h4>
                <p>Verify customer addresses, payment receipts, or initiate fulfillment dispatch.</p>
              </div>
            </div>
            <div className="aoc-attention-actions">
              {stats.pending > 0 && (
                <button
                  type="button"
                  className="aoc-attention-btn"
                  onClick={() => setFilterStatus('pending')}
                >
                  Review Pending ({stats.pending})
                </button>
              )}
              {stats.cancelled > 0 && (
                <button
                  type="button"
                  className="aoc-attention-btn"
                  style={{ background: '#DC2626' }}
                  onClick={() => setFilterStatus('cancelled')}
                >
                  View Cancelled ({stats.cancelled})
                </button>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2 & 3: Order Analytics Chart & Status Funnel */}
        <div className="aoc-split-grid">
          {/* Section 2: Order Volume Analytics Chart */}
          <div className="aoc-card">
            <div className="aoc-card-header">
              <div className="aoc-card-title-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0 }}>Order Velocity & Volume Analytics</h3>
                  {chartLoading && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(7, 59, 63, 0.08)', color: '#073B3F', fontSize: '11px', fontWeight: 800 }}>
                      <span className="aoc-pulse-dot" style={{ width: '6px', height: '6px' }} /> Syncing
                    </span>
                  )}
                </div>
                <p style={{ marginTop: '3px' }}>
                  Time-aggregated orders placed from database telemetry (Peak:{' '}
                  <strong style={{ color: '#073B3F' }}><AnimatedNumber value={maxChartCount} suffix=" orders" /></strong>)
                </p>
              </div>

              {/* Chart Period Switcher */}
              <div className="aoc-period-chips">
                {CHART_PERIODS.map(cp => (
                  <button
                    key={cp.key}
                    type="button"
                    className={`aoc-period-chip ${chartPeriod === cp.key ? 'active' : ''}`}
                    onClick={() => setChartPeriod(cp.key)}
                  >
                    {cp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="aoc-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aocAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#073B3F" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#073B3F" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6EEED" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#8FA6A3"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#DFE8E6' }}
                  />
                  <YAxis
                    stroke="#8FA6A3"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const row = payload[0].payload
                      return (
                        <div className="aoc-chart-tooltip">
                          <p>{row.fullDate}</p>
                          <div>
                            <strong>{row.count}</strong> orders placed
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#073B3F"
                    strokeWidth={2.6}
                    fill="url(#aocAreaGrad)"
                    isAnimationActive={true}
                    animationDuration={650}
                    animationEasing="ease-in-out"
                    dot={{ r: 3.5, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 6.5, fill: '#E2BC82', stroke: '#073B3F', strokeWidth: 2.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 3: Order Status Overview / Funnel */}
          <div className="aoc-card">
            <div className="aoc-card-header">
              <div className="aoc-card-title-group">
                <h3>Fulfillment Funnel</h3>
                <p>Click any stage to filter the table</p>
              </div>
            </div>

            <div className="aoc-funnel-list">
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(stKey => {
                const conf = STATUS_CONFIG[stKey]
                const count = stats[stKey] || 0
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                const isSelected = filterStatus === stKey

                return (
                  <div
                    key={stKey}
                    className={`aoc-funnel-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setFilterStatus(isSelected ? 'all' : stKey)}
                  >
                    <div className="aoc-funnel-left">
                      <div className="aoc-funnel-dot" style={{ background: conf.dot }} />
                      <span className="aoc-funnel-name">{conf.label}</span>
                    </div>
                    <div className="aoc-funnel-counts">
                      <span className="aoc-funnel-num"><AnimatedNumber value={count} /></span>
                      <span className="aoc-funnel-pct">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* SECTION 4: Live Orders Quick-Feed Strip */}
        {recentOrdersPreview.length > 0 && (
          <div className="aoc-recent-strip">
            <span className="aoc-recent-strip-label">⚡ Live Stream</span>
            {recentOrdersPreview.map(ord => {
              const sc = STATUS_CONFIG[ord.status] || STATUS_CONFIG.pending
              return (
                <div
                  key={ord.id}
                  className="aoc-recent-card"
                  onClick={() => handleOpenDrawer(ord)}
                  title="Click to view full order drawer"
                >
                  <strong style={{ color: '#073B3F', fontFamily: 'monospace', fontSize: '12px' }}>
                    {ord.order_id}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#4A6360' }}>{ord.customer_name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#A16207', fontFamily: 'monospace' }}>
                    {inr(ord.total_price)}
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: sc.bg,
                      color: sc.color,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    {sc.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* SECTION 7: Advanced Filters & Search Bar */}
        <div className="aoc-filter-bar">
          {/* Search, Status Tabs, & Payment Method */}
          <div className="aoc-filter-bottom-row">
            {/* Search Input */}
            <div className="aoc-search-box">
              <span className="aoc-search-icon">
                <SearchIcon size={15} color="#7A9390" />
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by Order ID, Product, Customer, Phone, Email..."
                className="aoc-search-input"
              />
            </div>

            {/* Status Pills */}
            <div className="aoc-status-chips">
              {STATUS_KEYS.map(s => {
                const count = s === 'all' ? stats.total : stats[s] || 0
                const isActive = filterStatus === s
                return (
                  <button
                    key={s}
                    type="button"
                    className={`aoc-status-chip ${isActive ? 'active' : ''}`}
                    onClick={() => setFilterStatus(s)}
                  >
                    <span>{s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}</span>
                    <span className="aoc-status-count-tag"><AnimatedNumber value={count} /></span>
                  </button>
                )
              })}
            </div>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="aoc-select-method"
            >
              {PAYMENT_METHODS.map(pm => (
                <option key={pm.key} value={pm.key}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SECTION 8: Upgraded Order Table */}
        <div className="aoc-table-card">
          <table className="aoc-table">
            <thead>
              <tr>
                <th>Order Details</th>
                <th>Product Snapshot</th>
                <th>Customer & Location</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Fulfillment Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#728A87' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                      <InboxIcon size={36} color="#A8BCB9" />
                    </div>
                    <strong style={{ fontSize: '15px', color: '#11201E', display: 'block', marginBottom: '4px' }}>
                      No Orders Found
                    </strong>
                    <span style={{ fontSize: '12.5px' }}>
                      {search || filterStatus !== 'all' || paymentFilter !== 'all'
                        ? 'Try clearing some filters or searching with different keywords.'
                        : 'No orders have been recorded in this time range.'}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                  const img = getImageUrl(order.product_image_url)
                  const isSelected = selectedOrder?.id === order.id

                  return (
                    <tr
                      key={order.id}
                      className={`aoc-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOpenDrawer(order)}
                    >
                      {/* Order Details */}
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#073B3F', fontSize: '13px' }}>
                          {order.order_id}
                        </div>
                        <div style={{ fontSize: '11px', color: '#728A87', marginTop: '3px' }}>
                          {formatDate(order.created_at)}
                        </div>
                      </td>

                      {/* Product Snapshot */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              background: '#EBF1F0',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #DCE5E4',
                            }}
                          >
                            {img ? (
                              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <JewelryIcon size={18} color="#7A9390" />
                            )}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: '#11201E',
                                fontSize: '13.5px',
                                maxWidth: '220px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {order.product_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#728A87', marginTop: '2px' }}>
                              {order.product_metal?.toUpperCase()} {order.product_grade || ''} · Qty: {order.quantity}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer & Location */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#11201E', fontSize: '13px' }}>
                          {order.customer_name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#647B78', marginTop: '2px' }}>
                          {order.city}, {order.state}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#073B3F', fontSize: '14.5px' }}>
                          {inr(order.total_price)}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#728A87', marginTop: '1px' }}>
                          Unit: {inr(order.unit_price)}
                        </div>
                      </td>

                      {/* Payment */}
                      <td>
                        <div style={{ textTransform: 'capitalize', fontSize: '12px', fontWeight: 600, color: '#4A6360' }}>
                          {order.payment_method?.replace(/_/g, ' ')}
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: order.payment_status === 'completed' ? '#15803D' : '#92400E',
                            textTransform: 'uppercase',
                          }}
                        >
                          {order.payment_status || 'Pending'}
                        </span>
                      </td>

                      {/* Fulfillment Status */}
                      <td>
                        <span
                          className="aoc-status-pill"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}
                        >
                          <span className="aoc-status-pill-dot" style={{ background: sc.dot }} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="aoc-view-btn"
                          onClick={e => {
                            e.stopPropagation()
                            handleOpenDrawer(order)
                          }}
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Silent Infinite Scroll Trigger */}
          <div
            ref={loadMoreSentinelRef}
            style={{
              height: '1px',
              width: '100%',
              margin: 0,
              padding: 0,
              pointerEvents: 'none',
              visibility: 'hidden',
            }}
          />

          {!hasMore && orders.length > 0 && (
            <div className="aoc-end-records">
              <CheckIcon size={14} color="#10B981" />
              <span>All <strong>{totalCount.toLocaleString('en-IN')}</strong> matching orders loaded</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 9: Order Details Drawer (Slide-Over Panel) */}
      {selectedOrder && (
        <div className="aoc-drawer-overlay" onClick={handleCloseDrawer}>
          <div className="aoc-drawer" onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="aoc-drawer-header">
              <div>
                <div style={{ fontSize: '11px', color: '#E2BC82', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order Details & Dispatch
                </div>
                <h2 style={{ margin: '3px 0 0', fontSize: '20px', fontWeight: 800, fontFamily: 'monospace' }}>
                  {selectedOrder.order_id}
                </h2>
              </div>
              <button type="button" className="aoc-drawer-close" onClick={handleCloseDrawer}>
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="aoc-drawer-body">
              {/* Status Update Quick Bar */}
              <div className="aoc-drawer-card">
                <div className="aoc-drawer-card-title">
                  <SettingsIcon size={14} color="#073B3F" /> Change Fulfillment Status
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => {
                    const sc = STATUS_CONFIG[s]
                    const isCurrent = selectedOrder.status === s
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={isCurrent || statusUpdating === selectedOrder.id}
                        onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                        style={{
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: `1.5px solid ${isCurrent ? sc.border : '#DCE5E4'}`,
                          background: isCurrent ? sc.bg : '#FFFFFF',
                          color: isCurrent ? sc.color : '#55726F',
                          fontSize: '12px',
                          fontWeight: isCurrent ? 800 : 600,
                          cursor: isCurrent ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textTransform: 'capitalize',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
                        <span>{s}</span>
                        {isCurrent && <CheckIcon size={12} color={sc.color} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Product Details */}
              <div className="aoc-drawer-card">
                <div className="aoc-drawer-card-title">
                  <BullionIcon size={14} color="#073B3F" /> Product Information
                </div>
                <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#EBF1F0',
                      border: '1px solid #DCE5E4',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getImageUrl(selectedOrder.product_image_url) ? (
                      <img
                        src={getImageUrl(selectedOrder.product_image_url)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <JewelryIcon size={24} color="#7A9390" />
                    )}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#11201E' }}>
                      {selectedOrder.product_name}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#647B78' }}>
                      Category: {selectedOrder.product_category} · Metal: {selectedOrder.product_metal?.toUpperCase()} {selectedOrder.product_grade || ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E6EEED' }}>
                    <small style={{ display: 'block', fontSize: '10px', color: '#728A87', textTransform: 'uppercase', fontWeight: 800 }}>Unit Price</small>
                    <strong style={{ fontSize: '13px', color: '#073B3F' }}>{inr(selectedOrder.unit_price)}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E6EEED' }}>
                    <small style={{ display: 'block', fontSize: '10px', color: '#728A87', textTransform: 'uppercase', fontWeight: 800 }}>Quantity</small>
                    <strong style={{ fontSize: '13px', color: '#073B3F' }}>{selectedOrder.quantity}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E6EEED' }}>
                    <small style={{ display: 'block', fontSize: '10px', color: '#728A87', textTransform: 'uppercase', fontWeight: 800 }}>Total Price</small>
                    <strong style={{ fontSize: '14px', color: '#073B3F', fontFamily: 'monospace' }}>{inr(selectedOrder.total_price)}</strong>
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Address */}
              <div className="aoc-drawer-card">
                <div className="aoc-drawer-card-title">
                  <LocationIcon size={14} color="#073B3F" /> Customer & Shipping Details
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '14px', color: '#11201E' }}>{selectedOrder.customer_name}</strong>
                  <div style={{ fontSize: '12px', color: '#647B78', marginTop: '4px', lineHeight: 1.6 }}>
                    <div>📞 {selectedOrder.customer_phone} {selectedOrder.customer_alt_phone ? ` / Alt: ${selectedOrder.customer_alt_phone}` : ''}</div>
                    <div>✉️ {selectedOrder.customer_email || '—'}</div>
                    <div style={{ marginTop: '4px' }}>
                      📍 {selectedOrder.address_line1}
                      {selectedOrder.address_line2 ? `, ${selectedOrder.address_line2}` : ''}, {selectedOrder.city}, {selectedOrder.state} – {selectedOrder.pincode}
                    </div>
                  </div>
                  {(selectedOrder.customer_dob || selectedOrder.customer_anniversary) && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#647B78', display: 'flex', gap: '14px' }}>
                      {selectedOrder.customer_dob && <span>DOB: {selectedOrder.customer_dob}</span>}
                      {selectedOrder.customer_anniversary && <span>Anniversary: {selectedOrder.customer_anniversary}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="aoc-drawer-card">
                <div className="aoc-drawer-card-title">
                  <CartIcon size={14} color="#073B3F" /> Payment Snapshot
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E6EEED' }}>
                    <small style={{ display: 'block', fontSize: '10px', color: '#728A87', textTransform: 'uppercase', fontWeight: 800 }}>Payment Method</small>
                    <strong style={{ fontSize: '13px', color: '#11201E', textTransform: 'capitalize' }}>
                      {selectedOrder.payment_method?.replace(/_/g, ' ')}
                    </strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E6EEED' }}>
                    <small style={{ display: 'block', fontSize: '10px', color: '#728A87', textTransform: 'uppercase', fontWeight: 800 }}>Payment Status</small>
                    <strong style={{ fontSize: '13px', color: selectedOrder.payment_status === 'completed' ? '#15803D' : '#B7791F', textTransform: 'uppercase' }}>
                      {selectedOrder.payment_status || 'Pending'}
                    </strong>
                  </div>
                </div>
                {selectedOrder.razorpay_payment_id && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#728A87', fontFamily: 'monospace' }}>
                    Gateway Ref: {selectedOrder.razorpay_payment_id}
                  </div>
                )}
              </div>

              {/* Shipment Tracking Timeline */}
              <div className="aoc-drawer-card">
                <div className="aoc-drawer-card-title">
                  <PackageIcon size={14} color="#073B3F" /> Live Tracking Timeline
                </div>

                {trackingLoading ? (
                  <div style={{ fontSize: '12px', color: '#728A87', padding: '10px 0' }}>Loading checkpoints...</div>
                ) : trackingEvents.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: '#728A87', marginBottom: '14px' }}>
                    No shipment checkpoints logged yet. Log the first location checkpoint below.
                  </div>
                ) : (
                  <div className="aoc-timeline-track" style={{ marginBottom: '18px' }}>
                    {trackingEvents.map((ev, idx) => (
                      <div key={ev.id || idx} className="aoc-timeline-node">
                        <div className={`aoc-timeline-dot ${idx === trackingEvents.length - 1 ? 'active' : ''}`} />
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#11201E' }}>{ev.stage_label || ev.stage}</div>
                        {ev.location && (
                          <div style={{ fontSize: '12px', color: '#55726F', marginTop: '2px' }}>
                            📍 {ev.location}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#889B98', marginTop: '2px' }}>
                          {formatDateTime(ev.created_at)}
                        </div>
                        {ev.note && (
                          <div style={{ fontSize: '11.5px', color: '#647B78', fontStyle: 'italic', marginTop: '2px' }}>
                            Note: {ev.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Checkpoint Form */}
                <div style={{ borderTop: '1px dashed #DCE5E4', paddingTop: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#073B3F', textTransform: 'uppercase', marginBottom: '8px' }}>
                    + Record Dispatch Checkpoint
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '8px' }}>
                    <select
                      value={trackingForm.stage}
                      onChange={e => setTrackingForm(f => ({ ...f, stage: e.target.value }))}
                      className="aoc-select-method"
                      style={{ width: '100%' }}
                    >
                      {['confirmed', 'processing', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'].map(st => (
                        <option key={st} value={st}>
                          {st.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={trackingForm.location}
                      onChange={e => setTrackingForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="Hub / Location (e.g. Chennai Central Distribution Hub)"
                      className="aoc-date-input"
                    />
                    <input
                      type="text"
                      value={trackingForm.note}
                      onChange={e => setTrackingForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="Internal Note (e.g. Dispatched via BlueDart AWB# 88921)"
                      className="aoc-date-input"
                    />
                  </div>
                  <button
                    type="button"
                    className="aoc-btn aoc-btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleAddTracking(selectedOrder.order_id)}
                    disabled={addingTracking}
                  >
                    {addingTracking ? 'Saving Checkpoint...' : '+ Add Tracking Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '13px 22px',
            borderRadius: '12px',
            background: toast.kind === 'error' ? '#DC2626' : '#073B3F',
            color: '#FFFFFF',
            fontSize: '13.5px',
            fontWeight: 700,
            boxShadow: '0 12px 32px rgba(7, 59, 63, 0.3)',
            animation: 'aocFadeIn 0.25s ease both',
          }}
        >
          <CheckIcon size={16} color="#FFFFFF" />
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  )
}
