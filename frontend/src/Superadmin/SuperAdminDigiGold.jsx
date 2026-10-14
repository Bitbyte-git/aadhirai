import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  ReceiptText,
  Coins,
  TrendingUp,
  Users,
  Wallet,
  ArrowUpRight,
  Search,
  Download,
  Filter,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeftRight,
  Menu,
  FileText,
  X,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  BarChart3,
  Percent,
  Tag,
  ArrowRight,
  Truck,
  Package,
  MapPin,
  Phone,
  Eye,
  Check
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts'
import api from '../api'
import goldCoinImg from '../assets/gold-coin-transparent.png'
import silverCoinImg from '../assets/silver-coin-transparent.png'
import './SuperAdminDigiGold.css'

// ── HIGH-PERFORMANCE TABULAR NUMBER COMPONENT (ZERO DOM JANK) ──
const NumberLoadingContext = createContext(false)

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, duration = 650 }) {
  const isLoading = useContext(NumberLoadingContext)
  const target = Number.isFinite(Number(value)) ? Number(value) : 0
  const [displayValue, setDisplayValue] = useState(0)
  const previousRef = useRef(0)
  useEffect(() => {
    if (isLoading) return undefined
    const start = previousRef.current
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let startedAt = null
    let frameId
    const step = timestamp => {
      if (startedAt === null) startedAt = timestamp
      const progress = reducedMotion || duration <= 0 ? 1 : Math.min((timestamp - startedAt) / duration, 1)
      const next = start + (target - start) * (1 - Math.pow(1 - progress, 3))
      previousRef.current = next
      setDisplayValue(next)
      if (progress < 1) frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [target, duration, isLoading])
  if (isLoading) return <span className="sadg-number-skeleton sadg-skeleton-line" aria-label="Loading value" />
  const formatted = displayValue.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return <span style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums lining-nums' }}>{prefix}{formatted}{suffix}</span>
}

// ── CUSTOM LUXURY CHART TOOLTIP COMPONENT ──
function CustomChartTooltip({ active, payload, label, isSilver = false }) {
  if (!active || !payload || !payload.length) return null
  const pData = payload[0]?.payload || {}
  const grams = pData.grams ?? 0
  const revenue = pData.revenue ?? 0

  return (
    <div className="sadg-chart-tooltip">
      <div className="sadg-chart-tooltip-date">{label}</div>
      <div className="sadg-chart-tooltip-row">
        <span style={{ color: isSilver ? '#CBD5E1' : '#FDE68A' }}>
          {isSilver ? 'Silver' : 'Gold'} Sold:
        </span>
        <span className="sadg-chart-tooltip-val">
          {Number(grams).toFixed(3)} g
        </span>
      </div>
      <div className="sadg-chart-tooltip-row">
        <span style={{ color: '#A7F3D0' }}>Sales:</span>
        <span className="sadg-chart-tooltip-val">
          ₹ {Number(revenue).toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  )
}

const pendingSuperAdminRequests = new Map()

function requestSuperAdminOnce(key, request) {
  if (pendingSuperAdminRequests.has(key)) return pendingSuperAdminRequests.get(key)
  const pending = Promise.resolve().then(request).finally(() => {
    if (pendingSuperAdminRequests.get(key) === pending) pendingSuperAdminRequests.delete(key)
  })
  pendingSuperAdminRequests.set(key, pending)
  return pending
}

function DigiGoldSectionSkeleton({ rows = 7 }) {
  return (
    <section className="sadg-section-skeleton" role="status" aria-label="Loading DigiGold section">
      <span className="sadg-sr-only">Loading DigiGold data</span>
      <div className="sadg-section-skeleton-kpis">
        {[0, 1, 2, 3].map((item) => (
          <div className="sadg-skeleton-kpi" key={`section-kpi-${item}`}>
            <div className="sadg-skeleton-line" style={{ width: '48%', height: 12 }} />
            <div className="sadg-skeleton-line" style={{ width: '72%', height: 25 }} />
            <div className="sadg-skeleton-line" style={{ width: '38%', height: 10 }} />
          </div>
        ))}
      </div>
      <div className="sadg-section-skeleton-panels">
        <div className="sadg-skeleton-chart" />
        <div className="sadg-skeleton-chart" />
      </div>
      <div className="sadg-section-skeleton-table">
        <div className="sadg-section-skeleton-heading">
          <div className="sadg-skeleton-line" style={{ width: 190, height: 18 }} />
          <div className="sadg-skeleton-line" style={{ width: 120, height: 30, borderRadius: 9 }} />
        </div>
        {Array.from({ length: rows }, (_, item) => (
          <div className="sadg-section-skeleton-row" key={`section-row-${item}`}>
            {[0, 1, 2, 3, 4, 5].map((cell) => (
              <div className="sadg-skeleton-line" key={`section-cell-${item}-${cell}`} style={{ width: `${55 + ((item + cell) % 4) * 10}%`, height: 12 }} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

const SUPERADMIN_DIGI_GOLD_PATHS = {
  overview: '',
  orders: 'orders',
  transactions: 'transactions',
  gold_mgmt: 'gold-management',
  silver_mgmt: 'silver-management',
  user_buy: 'user-buy',
  gold_rates: 'rates',
}

export default function SuperAdminDigiGold() {
  const navigate = useNavigate()
  const { section } = useParams()
  const activeSection = Object.entries(SUPERADMIN_DIGI_GOLD_PATHS).find(([, path]) => path === (section || ''))?.[0] || 'overview'
  const navigateToSection = id => {
    const path = SUPERADMIN_DIGI_GOLD_PATHS[id]
    navigate(path ? `/superadmin-digi-gold/${path}` : '/superadmin-digi-gold')
  }
  useEffect(() => {
    if (section && !Object.values(SUPERADMIN_DIGI_GOLD_PATHS).includes(section)) {
      navigate('/superadmin-digi-gold', { replace: true })
    }
  }, [section, navigate])
  // ── NAVIGATION & VIEW STATE ──
  // 'overview' | 'transactions' | 'gold_mgmt' | 'silver_mgmt' | 'user_buy' | 'gold_rates' | 'silver_rates'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Chart Metric Toggles: 'grams' | 'revenue'
  const [goldChartMetric, setGoldChartMetric] = useState('grams')
  const [silverChartMetric, setSilverChartMetric] = useState('grams')
  const [goldMgmtMetric, setGoldMgmtMetric] = useState('grams')
  const [silverMgmtMetric, setSilverMgmtMetric] = useState('grams')

  // ── FILTER STATE ──
  // Default to 'today' per user requirement
  const [dateFilter, setDateFilter] = useState('today') // 'today' | 'week' | 'month' | 'year' | 'custom'
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return d.toISOString().slice(0, 10)
  })
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10))

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'completed' | 'pending' | 'cancelled'
  const [metalFilter, setMetalFilter] = useState('all') // 'all' | 'gold' | 'silver'
  const ledgerMetalFilter = activeSection === 'gold_mgmt' ? 'gold' : activeSection === 'silver_mgmt' ? 'silver' : metalFilter
  const [txnTypeFilter, setTxnTypeFilter] = useState('all') // 'all' | 'buy' | 'sell' | 'convert'
  const [selectedUserCategory, setSelectedUserCategory] = useState('all') // 'all' | 'super_stockist' | 'distributor' | 'wholesale_dealer' | 'retailer' | 'customer' | 'general_customer'

  // Pagination state for non-transaction views
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // ── INFINITE SCROLL STATE FOR TRANSACTIONS (VIEW 2) ──
  // Starts with 35 items (instant 0-lag DOM render), loads next batch smoothly
  const [txnVisibleCount, setTxnVisibleCount] = useState(35)
  const [loadingMoreTxns, setLoadingMoreTxns] = useState(false)
  const [txnHasMore, setTxnHasMore] = useState(false)
  const txnCursorRef = useRef(null)
  const txnAppendLockRef = useRef(false)
  const txnSentinelRef = useRef(null)

  // ── BULLION DELIVERY ORDERS (SUPER ADMIN) ──
  const [deliveryOrdersList, setDeliveryOrdersList] = useState([])
  const [loadingDeliveryOrders, setLoadingDeliveryOrders] = useState(false)
  const [loadingMoreDeliveryOrders, setLoadingMoreDeliveryOrders] = useState(false)
  const [deliveryOrdersTotal, setDeliveryOrdersTotal] = useState(0)
  const [deliveryOrdersError, setDeliveryOrdersError] = useState('')
  const [deliveryOrdersFilteredTotal, setDeliveryOrdersFilteredTotal] = useState(0)
  const [deliveryOrderSummary, setDeliveryOrderSummary] = useState({ total_count: 0, total_weight: 0, total_valuation: 0, active_count: 0, delivered_count: 0 })
  const [deliveryOrdersReady, setDeliveryOrdersReady] = useState(false)
  const [deliveryOrdersHasMore, setDeliveryOrdersHasMore] = useState(false)
  const deliveryOrderCursorRef = useRef(null)
  const deliveryOrderRequestRef = useRef(0)
  const deliveryOrderSentinelRef = useRef(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderMetalFilter, setOrderMetalFilter] = useState('all')
  const [orderCardFilter, setOrderCardFilter] = useState('all')
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null)
  const [updatingOrderStatusId, setUpdatingOrderStatusId] = useState(null)
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrderSearch(orderSearch), 250)
    return () => clearTimeout(timer)
  }, [orderSearch])

  // ── DATA STATE (ALWAYS FRESH FROM DB) ──
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const dataRequestRef = useRef(0)
  const lastDashboardQueryKeyRef = useRef(null)
  const cachedRatesHistoryRef = useRef(null)
  const dateCacheRef = useRef({})

  const getDashboardQueryKey = () => JSON.stringify([
    dateFilter, statusFilter, ledgerMetalFilter, txnTypeFilter, selectedUserCategory,
    customStartDate, customEndDate, search.trim(),
  ])

  // ── FETCH DATA DIRECTLY FROM DB (LIGHTNING FAST WITH IN-MEMORY CACHE) ──
  const fetchData = async ({ append = false } = {}) => {
    if (append && (txnAppendLockRef.current || !txnCursorRef.current)) return
    if (append) {
      txnAppendLockRef.current = true
      setLoadingMoreTxns(true)
    } else {
      lastDashboardQueryKeyRef.current = getDashboardQueryKey()
      txnCursorRef.current = null
      txnAppendLockRef.current = false
      setTxnHasMore(false)
      setLoadingMoreTxns(false)
      setTxnVisibleCount(35)
    }
    const requestId = ++dataRequestRef.current
    setLoadError('')
    try {
      const cacheKey = `${dateFilter}_${statusFilter}_${ledgerMetalFilter}_${txnTypeFilter}_${selectedUserCategory}_${customStartDate}_${customEndDate}_${search}`
      if (!append) {
        setData(null)
        setLoading(true)
      }

      const params = {
        date_filter: dateFilter,
        status: statusFilter,
        metal: ledgerMetalFilter,
        transaction_type: txnTypeFilter,
        user_category: selectedUserCategory,
        limit: 35,
      }
      if (append && txnCursorRef.current) params.cursor = txnCursorRef.current
      if (dateFilter === 'custom') {
        params.start_date = customStartDate
        params.end_date = customEndDate
      }
      if (search.trim()) {
        params.search = search.trim()
      }

      // Fetch superadmin analytics + direct DB metal rates (only on initial load)
      const requestKey = JSON.stringify(Object.entries(params).sort(([left], [right]) => left.localeCompare(right)))
      const reqs = [requestSuperAdminOnce(`ledger:${requestKey}`, () => api.get('/digi-gold/superadmin/', { params }))]
      if (!cachedRatesHistoryRef.current) {
        reqs.push(requestSuperAdminOnce('rates:all', () => api.get('/metal-rates/?all=true').catch(() => null)))
      }

      const [res, ratesRes] = await Promise.all(reqs)
      if (requestId !== dataRequestRef.current) return

      if (ratesRes?.data && Array.isArray(ratesRes.data) && ratesRes.data.length > 0) {
        cachedRatesHistoryRef.current = ratesRes.data.map(r => ({
          date: r.date ? r.date.split('-').reverse().join('-') : '',
          date_iso: r.date,
          gold_22k: Number(r.gold_22k || 0),
          silver_999: Number(r.silver_999 || 0),
        }))
      }

      let finalData = res.data
      if (cachedRatesHistoryRef.current && cachedRatesHistoryRef.current.length > 0) {
        finalData = {
          ...res.data,
          rate_history: cachedRatesHistoryRef.current
        }
      }
      txnCursorRef.current = res.data?.next_cursor || null
      setTxnHasMore(Boolean(res.data?.has_more))
      if (append) {
        setData((previous) => previous ? {
          ...previous,
          ...finalData,
          items: [...(previous.items || []), ...(res.data?.items || [])],
          rate_history: cachedRatesHistoryRef.current || previous.rate_history,
        } : finalData)
        setTxnVisibleCount((previous) => previous + (res.data?.items?.length || 0))
      } else {
        dateCacheRef.current[cacheKey] = finalData
        const cacheKeys = Object.keys(dateCacheRef.current)
        if (cacheKeys.length > 5) {
          cacheKeys.slice(0, cacheKeys.length - 5).forEach((key) => delete dateCacheRef.current[key])
        }
        setData(finalData)
      }
    } catch (err) {
      if (requestId === dataRequestRef.current) {
        console.error('Failed to load SuperAdmin Digi Gold & Silver data:', err)
        setLoadError(err.response?.data?.error || 'Could not load DigiGold data. Check your connection and retry.')
      }
    } finally {
      if (requestId === dataRequestRef.current) {
        setLoading(false)
        if (append) {
          txnAppendLockRef.current = false
          setLoadingMoreTxns(false)
        }
      }
    }
  }

  // Refetch when filters or custom dates change
  useEffect(() => {
    if (activeSection === 'orders') return
    const queryKey = getDashboardQueryKey()
    if (lastDashboardQueryKeyRef.current === queryKey) return
    lastDashboardQueryKeyRef.current = queryKey
    fetchData()
    setTxnVisibleCount(35)
  }, [activeSection, dateFilter, customStartDate, customEndDate, statusFilter, metalFilter, txnTypeFilter, selectedUserCategory, data])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    setTxnVisibleCount(35)
    fetchData()
  }

  // ── BULLION DELIVERY ORDERS HANDLERS & AGGREGATIONS ──
  const fetchDeliveryOrders = useCallback(async ({ append = false } = {}) => {
    const requestId = append ? deliveryOrderRequestRef.current : ++deliveryOrderRequestRef.current
    if (append) setLoadingMoreDeliveryOrders(true)
    else {
      setDeliveryOrdersError('')
      setLoadingDeliveryOrders(true)
      setDeliveryOrdersReady(false)
      setLoadingMoreDeliveryOrders(false)
      setDeliveryOrdersList([])
      deliveryOrderCursorRef.current = null
      setDeliveryOrdersHasMore(false)
    }
    try {
      const params = { limit: 30, status: orderStatusFilter, metal: orderMetalFilter, card: orderCardFilter, search: debouncedOrderSearch.trim(), date_filter: dateFilter }
      if (dateFilter === 'custom') {
        params.start_date = customStartDate
        params.end_date = customEndDate
      }
      if (append && deliveryOrderCursorRef.current) params.cursor = deliveryOrderCursorRef.current
      const res = await api.get('/digi-gold/delivery/orders/', { params })
      if (requestId !== deliveryOrderRequestRef.current) return
      const rows = Array.isArray(res.data?.orders) ? res.data.orders : []
      setDeliveryOrdersList((previous) => append ? [...previous, ...rows] : rows)
      setDeliveryOrdersTotal(Number(res.data?.total_count || 0))
      if (res.data?.filtered_count != null) {
        setDeliveryOrdersFilteredTotal(Number(res.data.filtered_count))
      }
      setDeliveryOrderSummary(res.data?.summary || { total_count: 0, total_weight: 0, total_valuation: 0, active_count: 0, delivered_count: 0 })
      setDeliveryOrdersReady(true)
      deliveryOrderCursorRef.current = res.data?.next_cursor || null
      setDeliveryOrdersHasMore(Boolean(res.data?.has_more))
    } catch (err) {
      if (requestId !== deliveryOrderRequestRef.current) return
      console.error('Failed to load delivery orders in superadmin:', err)
      setDeliveryOrdersError(err.response?.data?.error || 'Could not load delivery orders. Please retry.')
    } finally {
      if (requestId === deliveryOrderRequestRef.current) {
        setLoadingDeliveryOrders(false)
        setLoadingMoreDeliveryOrders(false)
      }
    }
  }, [orderStatusFilter, orderMetalFilter, orderCardFilter, debouncedOrderSearch, dateFilter, customStartDate, customEndDate])

  useEffect(() => {
    if (activeSection === 'orders') {
      fetchDeliveryOrders()
    }
  }, [activeSection, fetchDeliveryOrders])

  useEffect(() => {
    if (activeSection !== 'orders' || !deliveryOrdersHasMore || loadingDeliveryOrders || loadingMoreDeliveryOrders) return undefined
    const target = deliveryOrderSentinelRef.current
    if (!target || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) fetchDeliveryOrders({ append: true })
    }, { rootMargin: '200px 0px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [activeSection, deliveryOrdersHasMore, loadingDeliveryOrders, loadingMoreDeliveryOrders, fetchDeliveryOrders])

  const handleUpdateDeliveryStatus = async (order, newStatus) => {
    const targetId = order.id || order.order_id
    setUpdatingOrderStatusId(targetId)
    setStatusUpdateSuccess('')
    try {
      await api.patch(`/orders/${targetId}/`, {
        status: newStatus,
        note: `Order status updated to ${newStatus} by Super Admin`
      })
      setDeliveryOrdersList((prev) =>
        prev.map((o) => (o.id === targetId || o.order_id === targetId ? { ...o, status: newStatus } : o))
      )
      if (activeSection === 'orders') fetchDeliveryOrders()
      if (selectedDeliveryOrder && (selectedDeliveryOrder.id === targetId || selectedDeliveryOrder.order_id === targetId)) {
        setSelectedDeliveryOrder((prev) => ({ ...prev, status: newStatus }))
      }
      setStatusUpdateSuccess(`Order #${order.order_id} successfully marked as ${newStatus.toUpperCase()}`)
      setTimeout(() => setStatusUpdateSuccess(''), 4000)
    } catch (err) {
      console.error('Failed to update status', err)
      alert('Could not update status: ' + (err.response?.data?.error || err.message))
    } finally {
      setUpdatingOrderStatusId(null)
    }
  }

  const filteredDeliveryOrders = useMemo(() => {
    return deliveryOrdersList.filter((o) => {
      const normalizedStatus = (o.status || '').toLowerCase()
      if (orderCardFilter === 'pending' && normalizedStatus === 'delivered') return false
      if (orderCardFilter === 'delivered' && normalizedStatus !== 'delivered') return false
      if (orderCardFilter === 'weight' && !(Number(o.weight_gm) > 0)) return false
      if (orderCardFilter === 'valuation' && !(Number(o.valuation_inr) > 0)) return false
      if (orderStatusFilter !== 'all' && (o.status || '').toLowerCase() !== orderStatusFilter.toLowerCase()) {
        return false
      }
      if (orderMetalFilter !== 'all') {
        const oMetal = (o.metal || '').toLowerCase()
        if (orderMetalFilter === 'gold' && !oMetal.includes('gold')) return false
        if (orderMetalFilter === 'silver' && !oMetal.includes('silver')) return false
      }
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase()
        const matchId = (o.order_id || '').toLowerCase().includes(q)
        const matchCust = (o.customer_name || '').toLowerCase().includes(q)
        const matchPhone = (o.customer_phone || '').toLowerCase().includes(q)
        const matchAddr = (o.address?.formatted || '').toLowerCase().includes(q)
        const matchCity = (o.address?.city || '').toLowerCase().includes(q)
        const matchNotes = (o.notes || '').toLowerCase().includes(q)
        if (!matchId && !matchCust && !matchPhone && !matchAddr && !matchCity && !matchNotes) return false
      }
      return true
    })
  }, [deliveryOrdersList, orderStatusFilter, orderMetalFilter, orderSearch, orderCardFilter])

  const orderStats = useMemo(() => {
    return {
      totalCount: Number(deliveryOrderSummary.total_count || 0),
      totalWeight: Number(deliveryOrderSummary.total_weight || 0),
      totalValuation: Number(deliveryOrderSummary.total_valuation || 0),
      pendingCount: Number(deliveryOrderSummary.pending_count ?? deliveryOrderSummary.active_count ?? 0),
      deliveredCount: Number(deliveryOrderSummary.delivered_count || 0),
    }
  }, [deliveryOrderSummary])

  // ── METRICS & AGGREGATIONS (HONEST DATA RESOLUTION) ──
  const kpis = data?.kpis || {}
  const rates = data?.rates || {}
  const items = data?.items || []
  const goldChart = data?.gold_chart || []
  const silverChart = data?.silver_chart || []
  const categorySummaries = data?.category_summaries || {}
  const rateHistory = data?.rate_history || []
  const dateRange = data?.date_range || {
    start_date: '04-10-2026',
    end_date: '10-10-2026'
  }

  // Dynamic Date Display helper for 0-latency instant feedback
  const getDisplayDateRange = () => {
    if (dateFilter === 'custom') return null
    const now = new Date()
    const fmt = (d) => {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      return `${dd}-${mm}-${yyyy}`
    }
    if (dateFilter === 'today') {
      return `Today (${fmt(now)})`
    }
    if (dateFilter === 'week') {
      const dStart = new Date(now)
      dStart.setDate(now.getDate() - 7)
      return `${fmt(dStart)} → ${fmt(now)}`
    }
    if (dateFilter === 'month') {
      const dStart = new Date(now)
      dStart.setDate(now.getDate() - 30)
      return `${fmt(dStart)} → ${fmt(now)}`
    }
    if (dateFilter === 'year') {
      const dStart = new Date(now)
      dStart.setDate(now.getDate() - 365)
      return `${fmt(dStart)} → ${fmt(now)}`
    }
    return dateRange?.start_date ? `${dateRange.start_date} → ${dateRange.end_date}` : ''
  }

  // Filtered items in memory for local sub-filters
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      if (activeSection === 'gold_mgmt' && it.metal !== 'gold') return false
      if (activeSection === 'silver_mgmt' && it.metal !== 'silver') return false
      if (activeSection === 'user_buy' && selectedUserCategory !== 'all') {
        const catKeyMap = {
          super_stockist: 'Super Stockist',
          distributor: 'Distributor',
          wholesale_dealer: 'Wholesale Dealer',
          retailer: 'Retailer',
          customer: 'Customer',
          general_customer: 'General Customer',
        }
        if (it.user_category !== catKeyMap[selectedUserCategory]) return false
      }
      return true
    })
  }, [items, activeSection, selectedUserCategory])

  // Infinite Scroll IntersectionObserver for Transactions table (Guarded, 0 Lag)
  useEffect(() => {
    if (activeSection !== 'transactions') return
    const el = txnSentinelRef.current
    if (!el) return
    if (!txnHasMore || loadingMoreTxns) return

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting && !loadingMoreTxns) {
        fetchData({ append: true })
      }
    }, { threshold: 0.1, rootMargin: '150px' })

    observer.observe(el)
    return () => observer.disconnect()
  }, [activeSection, loadingMoreTxns, txnHasMore, txnVisibleCount, filteredItems.length])

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1

  // ── OFFICIAL A4 PDF EXPORT ENGINE ──
  const handleExportPDF = () => {
    try {
      const printWin = window.open('', '_blank', 'width=1050,height=900')
      if (!printWin) {
        alert('Please allow popups to download/print the official PDF statement.')
        return
      }

      const logoUrl = `${window.location.origin}/Aadhirai-Logo.png`
      const currentDateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      })
      const currentTimeStr = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }) + ' IST'

      const isRateReport = activeSection === 'gold_rates'
      let reportTitle = 'Master Transactions Audit Report'
      let reportCategory = 'DIGI GOLD & SILVER AUDIT'
      if (activeSection === 'gold_mgmt') {
        reportTitle = '22K Digi Gold Vault & Sales Ledger'
        reportCategory = 'GOLD REVENUE AUDIT'
      } else if (activeSection === 'silver_mgmt') {
        reportTitle = 'Pure 999 Digi Silver Vault & Sales Ledger'
        reportCategory = 'SILVER REVENUE AUDIT'
      } else if (activeSection === 'user_buy') {
        reportTitle = 'Investor Purchases & Hierarchy Sales Audit'
        reportCategory = 'INVESTOR AUDIT'
      } else if (activeSection === 'gold_rates') {
        reportTitle = 'Official 22K Gold & Pure 999 Silver Benchmark Rates Log'
        reportCategory = 'BENCHMARK RATES AUDIT'
      } else if (activeSection === 'orders') {
        reportTitle = 'Bullion Doorstep Delivery Orders Ledger'
        reportCategory = 'DELIVERY DISPATCH AUDIT'
      }

      let rowsHtml = ''
      let totalAmount = 0
      let totalWeight = 0
      let totalValuation = 0

      if (activeSection === 'orders') {
        if (!filteredDeliveryOrders.length) {
          rowsHtml = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No delivery orders found.</td></tr>'
        } else {
          filteredDeliveryOrders.forEach((o) => {
            const w = Number(o.weight_gm || 0)
            const v = Number(o.valuation_inr || 0)
            totalWeight += w
            totalAmount += v
            const isGold = (o.metal || '').toLowerCase().includes('gold')
            const metalBadgeClass = isGold ? 'metal-gold' : 'metal-silver'
            const metalText = isGold ? '22K Gold' : 'Pure 999 Silver'
            rowsHtml += `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: #0A3E42;">#${o.order_id}</td>
                <td>${o.created_at || '-'}</td>
                <td><strong>${o.customer_name || 'Customer'}</strong><div style="font-size: 8px; color: #647474;">${o.customer_phone || ''}</div></td>
                <td style="text-align: center;"><span class="badge ${metalBadgeClass}">${metalText}</span></td>
                <td style="text-align: right; font-weight: 700;">${w.toFixed(3)} g</td>
                <td style="text-align: right; font-weight: 800; color: #073E40;">₹ ${v.toLocaleString('en-IN')}</td>
                <td style="text-align: center;"><span class="badge status-completed" style="text-transform: capitalize;">${o.status}</span></td>
              </tr>
            `
          })
        }
      } else if (isRateReport) {
        if (!rateHistory.length) {
          rowsHtml = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No benchmark rate history recorded yet.</td></tr>'
        } else {
          rateHistory.forEach((r) => {
            rowsHtml += `
              <tr>
                <td style="font-weight: 700; color: #0A3E42;">${r.date}</td>
                <td style="text-align: right; font-weight: 750;">₹ ${Number(r.gold_22k).toLocaleString('en-IN')}</td>
                <td style="text-align: right; font-weight: 750;">₹ ${Number(r.silver_999).toFixed(2)}</td>
                <td style="text-align: center;"><span class="badge status-completed">Verified Athirai Rate</span></td>
              </tr>
            `
          })
        }
      } else {
        if (!filteredItems.length) {
          rowsHtml = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No transaction records found matching the active filters.</td></tr>'
        } else {
          filteredItems.forEach((it) => {
            const amt = Number(it.amount || 0)
            const qty = Number(it.quantity_gm || 0)
            const val = Number(it.current_valuation || 0)
            totalAmount += amt
            totalWeight += qty
            totalValuation += val

            const isGold = (it.metal || '').toLowerCase().includes('gold')
            const metalBadgeClass = isGold ? 'metal-gold' : 'metal-silver'
            const metalText = isGold ? '22K Gold' : 'Silver 999'

            rowsHtml += `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: #0A3E42; font-size: 9.5px;">${it.transaction_id || '-'}</td>
                <td style="font-size: 9px; white-space: nowrap;">${it.datetime_str || it.date || '-'}</td>
                <td style="font-weight: 700; color: #103F42;">
                  ${it.investor_name || 'Investor'}
                  <div style="font-size: 8px; color: #647474; font-weight: 500;">${it.user_category || ''}</div>
                </td>
                <td style="text-align: center;"><span class="badge ${metalBadgeClass}">${metalText}</span></td>
                <td style="text-align: right; font-weight: 700; color: #0A3E42;">${qty.toFixed(3)} g</td>
                <td style="text-align: right; color: #647474;">₹ ${Number(it.rate || 0).toLocaleString('en-IN')}</td>
                <td style="text-align: right; font-weight: 750;">₹ ${amt.toLocaleString('en-IN')}</td>
                <td style="text-align: right; font-weight: 800; color: #073E40;">₹ ${val.toLocaleString('en-IN')}</td>
                <td style="text-align: center;"><span class="badge status-completed">${it.status || 'Completed'}</span></td>
              </tr>
            `
          })
        }
      }

      const docHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Athirai Super Admin — ${reportTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 10mm 8mm 12mm 8mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 16px 0 40px 0;
      color: #0A3E42;
      background: #EBF0EE;
      font-size: 10px;
      line-height: 1.35;
    }

    .no-print-bar {
      position: sticky;
      top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0A3E42;
      color: #FFFFFF;
      padding: 10px 18px;
      border-radius: 10px;
      margin: 0 auto 16px auto;
      max-width: 210mm;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      z-index: 999;
    }

    .preview-pill {
      font-size: 9.5px;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.18);
      color: #F3CA8A;
      padding: 3px 8px;
      border-radius: 999px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-left: 8px;
    }

    .btn-action {
      border: none;
      border-radius: 7px;
      padding: 7px 16px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.2s;
    }
    .btn-action:hover { opacity: 0.9; }

    .btn-print {
      background: #073E40;
      color: #FFFFFF;
      box-shadow: 0 2px 6px rgba(7, 62, 64, 0.35);
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.18);
      color: #FFFFFF;
      margin-left: 8px;
    }

    /* ── AUTHENTIC A4 PORTRAIT SHEET CONTAINER (210mm WIDTH) ── */
    .a4-sheet {
      width: 210mm;
      max-width: 100%;
      min-height: 297mm;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 12mm 12mm 14mm 12mm;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0,0,0,0.06);
      border-radius: 4px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    @media print {
      body {
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print-bar {
        display: none !important;
      }
      .a4-sheet {
        width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    }

    /* Header */
    .statement-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #0A3E42;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo {
      height: 52px;
      width: auto;
      object-fit: contain;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #0A3E42;
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 9.5px;
      font-weight: 750;
      color: #C6924B;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 3px;
    }

    .doc-meta {
      text-align: right;
    }

    .doc-title-badge {
      display: inline-block;
      background: #E8F4F1;
      color: #0A3E42;
      font-size: 9px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 5px;
      border: 1px solid #C7E0D8;
      margin-bottom: 3px;
      letter-spacing: 0.05em;
    }

    .doc-date {
      font-size: 10px;
      color: #647474;
      font-weight: 600;
    }

    /* Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr;
      gap: 10px;
      background: #F8FAF9;
      border: 1px solid #DCE7E3;
      border-radius: 10px;
      padding: 10px 14px;
      margin: 12px 0;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-label {
      font-size: 8.5px;
      font-weight: 750;
      color: #647474;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .meta-val {
      font-size: 11.5px;
      font-weight: 800;
      color: #0A3E42;
    }

    /* KPI Grid */
    .kpi-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }

    .kpi-card {
      background: #FFFFFF;
      border: 1px solid #E2EBE8;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }

    .kpi-title {
      font-size: 8px;
      font-weight: 750;
      color: #647474;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 2px;
    }

    .kpi-number {
      font-size: 13px;
      font-weight: 850;
      color: #0A3E42;
      white-space: nowrap;
    }

    .kpi-number.green { color: #073E40; }
    .kpi-number.gold { color: #C6924B; }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      margin-bottom: 16px;
      table-layout: auto;
    }

    th {
      background: #0A3E42;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 6px 4px;
      border: 1px solid #0A3E42;
      white-space: nowrap;
    }

    td {
      padding: 5px 4px;
      border: 1px solid #E2EBE8;
      vertical-align: middle;
      white-space: nowrap;
    }

    tr:nth-child(even) td {
      background: #FAFCFB;
    }

    tfoot tr td {
      background: #EBF4F1;
      font-weight: 900;
      font-size: 9.5px;
      border-top: 2px solid #0A3E42;
      padding: 8px 6px;
    }

    .badge {
      display: inline-block;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    .metal-gold {
      background: rgba(198, 146, 75, 0.16);
      color: #9E6B24;
      border: 1px solid rgba(198, 146, 75, 0.35);
    }

    .metal-silver {
      background: rgba(10, 62, 66, 0.12);
      color: #0A3E42;
      border: 1px solid rgba(10, 62, 66, 0.3);
    }

    .status-completed {
      background: #DEF7EC;
      color: #03543F;
      border: 1px solid #BCF0DA;
    }

    /* Footer */
    .statement-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px dashed #C7E0D8;
      padding-top: 10px;
      margin-top: auto;
      font-size: 9px;
      color: #647474;
    }

    .security-stamp {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #0A3E42;
      font-weight: 700;
    }

    .seal-box {
      border: 1.5px solid #C6924B;
      padding: 2px 7px;
      border-radius: 4px;
      color: #C6924B;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.06em;
      font-size: 8px;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div style="display: flex; align-items: center;">
      <span style="font-weight: 800; font-size: 13px;">Athirai Super Admin — Official Audit Statement</span>
      <span class="preview-pill">A4 Sheet Specification</span>
    </div>
    <div>
      <button class="btn-action btn-print" onclick="window.print()">
        🖨️ Download / Save as PDF
      </button>
      <button class="btn-action btn-close" onclick="window.close()">
        Close
      </button>
    </div>
  </div>

  <div class="a4-sheet">
    <div>
      <div class="statement-header">
        <div class="brand-section">
          <img src="${logoUrl}" alt="Athirai Jewelers" class="brand-logo" onerror="this.style.display='none'" />
          <div>
            <h1 class="brand-title">ATHIRAI JEWELLERS</h1>
            <div class="brand-subtitle">${reportTitle}</div>
          </div>
        </div>
        <div class="doc-meta">
          <div class="doc-title-badge">${reportCategory}</div>
          <div class="doc-date">Generated: ${currentDateStr} at ${currentTimeStr}</div>
          <div style="font-size: 9px; color: #073E40; font-weight: 750; margin-top: 2px;">● Verified Super Admin Ledger</div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Audit Period</span>
          <span class="meta-val">${dateRange.start_date} → ${dateRange.end_date}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Active Market Benchmark</span>
          <span class="meta-val">Gold 22K: ₹ ${Number(rates.gold_22k || 13200).toLocaleString('en-IN')}/g | Silver: ₹ ${Number(rates.silver_999 || 275).toFixed(2)}/g</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Verified Record Count</span>
          <span class="meta-val">${isRateReport ? rateHistory.length : filteredItems.length} Records</span>
        </div>
      </div>

      ${!isRateReport ? `
      <div class="kpi-summary-grid">
        <div class="kpi-card">
          <div class="kpi-title">Total Transactions</div>
          <div class="kpi-number">${filteredItems.length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Accumulated Weight</div>
          <div class="kpi-number green">${totalWeight.toFixed(3)} g</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Total Transaction Value</div>
          <div class="kpi-number gold">₹ ${totalAmount.toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Total Current Valuation</div>
          <div class="kpi-number green">₹ ${totalValuation.toLocaleString('en-IN')}</div>
        </div>
      </div>
      ` : ''}

      ${isRateReport ? `
      <table>
        <thead>
          <tr>
            <th style="width: 25%; text-align: left;">Date</th>
            <th style="width: 25%; text-align: right;">Gold 22K (₹/g)</th>
            <th style="width: 25%; text-align: right;">Silver 999 (₹/g)</th>
            <th style="width: 25%; text-align: center;">Source Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      ` : `
      <table>
        <thead>
          <tr>
            <th style="width: 14%; text-align: left;">Txn ID</th>
            <th style="width: 11%; text-align: left;">Date</th>
            <th style="width: 17%; text-align: left;">Investor &amp; Category</th>
            <th style="width: 9%; text-align: center;">Metal</th>
            <th style="width: 9%; text-align: right;">Qty (g)</th>
            <th style="width: 9%; text-align: right;">Rate (₹/g)</th>
            <th style="width: 11%; text-align: right;">Amount (₹)</th>
            <th style="width: 11%; text-align: right;">Valuation (₹)</th>
            <th style="width: 9%; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="text-align: left;">TOTALS</td>
            <td style="text-align: right; color: #0A3E42; font-weight: 850;">${totalWeight.toFixed(3)} g</td>
            <td></td>
            <td style="text-align: right; font-weight: 850;">₹ ${totalAmount.toLocaleString('en-IN')}</td>
            <td style="text-align: right; color: #073E40; font-weight: 850;">₹ ${totalValuation.toLocaleString('en-IN')}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      `}
    </div>

    <div class="statement-footer">
      <div class="security-stamp">
        <div class="seal-box">ATHIRAI 916 SEAL</div>
        <span>100% Certified 22K (916) Gold &amp; Pure (999) Silver • LBMA Standard • Verified Super Admin Ledger</span>
      </div>
      <div>
        Official system-verified statement issued by Athirai Super Admin Portal. Page 1 of 1
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
      `

      printWin.document.open()
      printWin.document.write(docHtml)
      printWin.document.close()
    } catch (err) {
      console.error('PDF Export Error:', err)
      alert('Failed to generate PDF. Please try again.')
    }
  }



  // ── SIDEBAR NAVIGATION ITEMS (EXACT ORDER PER SPEC) ──
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Delivery Orders', icon: Truck },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'gold_mgmt', label: 'Gold Management', icon: Coins },
    { id: 'silver_mgmt', label: 'Silver Management', icon: Layers },
    { id: 'user_buy', label: 'User Buy Gold', icon: Users },
    { id: 'gold_rates', label: 'Gold and Silver Rates', icon: TrendingUp },
  ]

  const handleNavClick = (id) => {
    navigateToSection(id)
    setCurrentPage(1)
    if (id === 'gold_mgmt') setMetalFilter('gold')
    else if (id === 'silver_mgmt') setMetalFilter('silver')
    else setMetalFilter('all')
    setMobileSidebarOpen(false)
  }

  return (
    <NumberLoadingContext.Provider value={activeSection === 'orders' ? loadingDeliveryOrders || !deliveryOrdersReady : loading || !data}>
    <div className="sadg-layout">
      {/* ── MOBILE BACKDROP OVERLAY (SMOOTH BLUR DISMISS) ── */}
      {mobileSidebarOpen && (
        <div
          className="sadg-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── LEFT SIDEBAR (DEEP TEAL #073E40 — FIXED) ── */}
      <aside className={`sadg-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="sadg-sidebar-top">
          {/* Mobile Close Button */}
          <div className="sadg-sidebar-header-mobile">
            <span className="sadg-sidebar-title">Menu</span>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 7 Navigation Items */}
          {navItems.map((item) => {
            const IconComp = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`sadg-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <IconComp size={18} className="sadg-nav-icon" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Sidebar Bottom Decorative Card with Transparent Bullion Coins */}
        <div className="sadg-sidebar-bottom">
          <div className="sadg-sidebar-promo-card">
            <div className="sadg-promo-coins-stack">
              <img
                src={goldCoinImg}
                alt="22K Digi Gold"
                className="sadg-promo-coin-gold"
              />
              <img
                src={silverCoinImg}
                alt="999 Digi Silver"
                className="sadg-promo-coin-silver"
              />
            </div>
            <h5 className="sadg-promo-title">Pure Investment Lasting Value</h5>
            <p className="sadg-promo-desc">Gold & Silver for a Brighter Tomorrow</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="sadg-main">
        {/* ── TOP HEADER (TITLE & ACTION CONTROLS) ── */}
        <div className="sadg-header">
          <div className="sadg-header-title-box">
            {/* Mobile/Tablet Menu Toggle Button (Integrated in Header) */}
            <button
              type="button"
              className="sadg-header-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>

            <div className="sadg-header-icon-badge">
              {activeSection === 'overview' && <Sparkles size={22} />}
              {activeSection === 'orders' && <Truck size={22} />}
              {activeSection === 'transactions' && <ReceiptText size={22} />}
              {activeSection === 'gold_mgmt' && <Coins size={22} />}
              {activeSection === 'silver_mgmt' && <Layers size={22} />}
              {activeSection === 'user_buy' && <Users size={22} />}
              {activeSection === 'gold_rates' && <TrendingUp size={22} />}
            </div>
            <div>
              <h1 className="sadg-title">
                {activeSection === 'overview' && 'Digi Gold & Silver Management'}
                {activeSection === 'orders' && 'Bullion Delivery Orders'}
                {activeSection === 'transactions' && 'Transaction History'}
                {activeSection === 'gold_mgmt' && 'Gold Management'}
                {activeSection === 'silver_mgmt' && 'Silver Management'}
                {activeSection === 'user_buy' && 'User Buy Gold & Silver'}
                {activeSection === 'gold_rates' && 'Gold & Silver Benchmark Rates'}
              </h1>
              <p className="sadg-subtitle">
                {activeSection === 'overview' && 'Sales, holdings, transaction history and user-wise investment analytics.'}
                {activeSection === 'orders' && 'Doorstep bullion coin delivery orders, recipient address verification, and dispatch management.'}
                {activeSection === 'transactions' && 'Complete company-wide investor audit trail, verified buy/sell ledgers, and settlement records.'}
                {activeSection === 'gold_mgmt' && 'Detailed 22K Digi Gold sales analytics, vault weight accumulation, and investor ledgers.'}
                {activeSection === 'silver_mgmt' && 'Detailed Digi Silver sales analytics, purity metrics, and settlement ledgers.'}
                {activeSection === 'user_buy' && 'Tier-wise investor breakdown, network hierarchy sales volumes, and category purchase ledgers.'}
                {activeSection === 'gold_rates' && 'Live 22K gold & pure 999 silver benchmark bullion rates, historical movement trends, and pricing logs.'}
              </p>
            </div>
          </div>

          <div className="sadg-header-actions">
            <button
              type="button"
              className="sadg-btn-refresh"
              onClick={() => activeSection === 'orders' ? fetchDeliveryOrders() : fetchData()}
              disabled={activeSection === 'orders' ? loadingDeliveryOrders : loading}
            >
              <RefreshCw size={15} className={(activeSection === 'orders' ? loadingDeliveryOrders : loading) ? 'sadg-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="sadg-btn-export"
              onClick={handleExportPDF}
            >
              <FileText size={15} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* ── MOBILE & TABLET HORIZONTAL QUICK NAV TABS (1-TAP SWIPEABLE) ── */}
        <div className="sadg-quick-nav">
          {navItems.map((item) => {
            const IconComp = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`sadg-quick-nav-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <IconComp size={14} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── DATE FILTER BAR (TODAY, WEEK, MONTH, YEAR, CUSTOM) ── */}
        {loadError && activeSection !== 'orders' && (
          <div className="sadg-load-error" role="alert">
            <span>{loadError}</span>
            <button type="button" onClick={fetchData} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'sadg-spin' : ''} /> Retry
            </button>
          </div>
        )}

        <div className="sadg-filter-bar">
          <div className="sadg-date-pills">
            {['today', 'week', 'month', 'year', 'custom'].map((f) => (
              <button
                key={f}
                type="button"
                className={`sadg-date-pill ${dateFilter === f ? 'active' : ''}`}
                onClick={() => setDateFilter(f)}
              >
                {f === 'custom' ? 'Custom Date' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="sadg-date-display">
            <Calendar size={14} color="#0A3E42" />
            {dateFilter === 'custom' ? (
              <div className="sadg-custom-date-inputs">
                <input
                  type="date"
                  className="sadg-date-input"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <span>→</span>
                <input
                  type="date"
                  className="sadg-date-input"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            ) : (
              <span>{getDisplayDateRange()}</span>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
           VIEW 1: OVERVIEW DASHBOARD (ENTERPRISE LUXURY FINTECH)
           ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'overview' && (
          <>
            {/* SKELETON LOADING STATE WHEN DATA IS NOT READY */}
            {loading || !data ? (
              <>
                <div className="sadg-kpi-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="sadg-skeleton-kpi">
                      <div className="sadg-skeleton-line" style={{ width: 36, height: 36, borderRadius: 10 }} />
                      <div className="sadg-skeleton-line" style={{ width: '60%', height: 13 }} />
                      <div className="sadg-skeleton-line" style={{ width: '85%', height: 26 }} />
                      <div className="sadg-skeleton-line" style={{ width: '45%', height: 11 }} />
                    </div>
                  ))}
                </div>
                <div className="sadg-charts-row" style={{ marginTop: 22 }}>
                  <div className="sadg-skeleton-chart" />
                  <div className="sadg-skeleton-chart" />
                  <div className="sadg-skeleton-chart" />
                </div>
              </>
            ) : (
              <>
                {/* 6 KPI CARDS ROW (CLICKABLE, WITH SMOOTH ANIMATED NUMBERS) */}
                <div className="sadg-kpi-grid">
                  {/* Card 1: Total Gold Sales */}
                  <div
                    className="sadg-kpi-card sadg-clickable-card"
                    onClick={() => {
                      setMetalFilter('gold')
                      navigateToSection('transactions')
                    }}
                    title="Click to view Gold Transactions"
                  >
                    <div className="sadg-kpi-icon-box gold">
                      <Coins size={18} />
                    </div>
                    <span className="sadg-kpi-label">Total Gold Sales</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_gold_sales_inr || 0} prefix="₹ " />
                    </b>
                    <span className="sadg-kpi-sub">Gross gold volume • Click to filter</span>
                  </div>

                  {/* Card 2: Gold Sold (g) */}
                  <div
                    className="sadg-kpi-card sadg-clickable-card"
                    onClick={() => {
                      setMetalFilter('gold')
                      navigateToSection('transactions')
                    }}
                    title="Click to view Gold Transactions"
                  >
                    <div className="sadg-kpi-icon-box gold">
                      <Sparkles size={18} />
                    </div>
                    <span className="sadg-kpi-label">Gold Sold (g)</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_gold_sold_gm || 0} decimals={3} suffix=" g" />
                    </b>
                    <span className="sadg-kpi-sub">Total weight credited • Click to filter</span>
                  </div>

                  {/* Card 3: Total Silver Sales */}
                  <div
                    className="sadg-kpi-card sadg-clickable-card"
                    onClick={() => {
                      setMetalFilter('silver')
                      navigateToSection('transactions')
                    }}
                    title="Click to view Silver Transactions"
                  >
                    <div className="sadg-kpi-icon-box silver">
                      <Layers size={18} />
                    </div>
                    <span className="sadg-kpi-label">Total Silver Sales</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_silver_sales_inr || 0} prefix="₹ " />
                    </b>
                    <span className="sadg-kpi-sub">
                      Gross volume • ₹<AnimatedNumber value={rates.silver_999} decimals={2} />/g
                    </span>
                  </div>

                  {/* Card 4: Silver Sold (g) */}
                  <div
                    className="sadg-kpi-card sadg-clickable-card"
                    onClick={() => {
                      setMetalFilter('silver')
                      navigateToSection('transactions')
                    }}
                    title="Click to view Silver Transactions"
                  >
                    <div className="sadg-kpi-icon-box silver">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="sadg-kpi-label">Silver Sold (g)</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_silver_sold_gm || 0} decimals={3} suffix=" g" />
                    </b>
                    <span className="sadg-kpi-sub">
                      Total weight credited • Click to filter
                    </span>
                  </div>

                  {/* Card 5: Total Transactions */}
                  <div
                    className="sadg-kpi-card sadg-clickable-card"
                    onClick={() => {
                      setMetalFilter('all')
                      setStatusFilter('all')
                      navigateToSection('transactions')
                    }}
                    title="Click to view All Transactions"
                  >
                    <div className="sadg-kpi-icon-box mint">
                      <ArrowLeftRight size={18} />
                    </div>
                    <span className="sadg-kpi-label">Total Transactions</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_transactions || 0} />
                    </b>
                    <span className="sadg-kpi-sub">Completed cycles • Click to view all</span>
                  </div>

                  {/* Card 6: Active Investors */}
                  <div
                    className="sadg-kpi-card sadg-clickable-card"
                    onClick={() => {
                      navigateToSection('user_buy')
                    }}
                    title="Click to view User Buy Gold breakdown"
                  >
                    <div className="sadg-kpi-icon-box teal">
                      <Users size={18} />
                    </div>
                    <span className="sadg-kpi-label">Active Investors</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.active_investors || 0} />
                    </b>
                    <span className="sadg-kpi-sub">Unique accounts • Click to view breakdown</span>
                  </div>
                </div>

                {/* MIDDLE ROW (3-COLUMNS: SMOOTH GOLD AREA CHART, SMOOTH SILVER AREA CHART, RATES TABLE) */}
                <div className="sadg-charts-row">
                  {/* Card 1: Gold Sales Overview (Smooth Spline AreaChart) */}
                  <div className="sadg-chart-card">
                    <div className="sadg-chart-head">
                      <div className="sadg-chart-title-box">
                        <div className="sadg-chart-badge gold">
                          <Coins size={16} />
                        </div>
                        <h4 className="sadg-chart-title">Gold Sales Overview</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sadg-chart-metric-toggle">
                          <button
                            type="button"
                            className={`sadg-metric-btn ${goldChartMetric === 'grams' ? 'active' : ''}`}
                            onClick={() => setGoldChartMetric('grams')}
                          >
                            Weight (g)
                          </button>
                          <button
                            type="button"
                            className={`sadg-metric-btn ${goldChartMetric === 'revenue' ? 'active' : ''}`}
                            onClick={() => setGoldChartMetric('revenue')}
                          >
                            Sales (₹)
                          </button>
                        </div>
                        <div className="sadg-chart-legend">
                          <span className="sadg-legend-item">
                            <span className="sadg-legend-line" style={{ background: goldChartMetric === 'grams' ? '#073E40' : '#0A3E42' }} />
                            {goldChartMetric === 'grams' ? 'Gold (g)' : 'Sales (₹)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sadg-chart-body">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={goldChart} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="sadgGoldGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#073E40" stopOpacity={0.28} />
                              <stop offset="100%" stopColor="#073E40" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                          <XAxis dataKey="date" stroke="#8E9E9C" fontSize={10.5} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                          <YAxis
                            stroke="#8E9E9C"
                            fontSize={10.5}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={val => goldChartMetric === 'grams' ? `${val}g` : `₹${Number(val).toLocaleString('en-IN')}`}
                          />
                          <Tooltip content={<CustomChartTooltip isSilver={false} />} />
                          <Area
                            type="monotone"
                            dataKey={goldChartMetric === 'grams' ? 'grams' : 'revenue'}
                            name={goldChartMetric === 'grams' ? 'Gold (g)' : 'Sales (₹)'}
                            stroke={goldChartMetric === 'grams' ? '#073E40' : '#0A3E42'}
                            strokeWidth={2.4}
                            fill="url(#sadgGoldGrad)"
                            dot={{ r: 3.5, fill: goldChartMetric === 'grams' ? '#073E40' : '#0A3E42', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                            activeDot={{ r: 6.5, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={500}
                            animationEasing="ease-in-out"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Card 2: Silver Sales Overview (Smooth Spline AreaChart) */}
                  <div className="sadg-chart-card">
                    <div className="sadg-chart-head">
                      <div className="sadg-chart-title-box">
                        <div className="sadg-chart-badge silver">
                          <Layers size={16} />
                        </div>
                        <h4 className="sadg-chart-title">Silver Sales Overview</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sadg-chart-metric-toggle">
                          <button
                            type="button"
                            className={`sadg-metric-btn ${silverChartMetric === 'grams' ? 'active' : ''}`}
                            onClick={() => setSilverChartMetric('grams')}
                          >
                            Weight (g)
                          </button>
                          <button
                            type="button"
                            className={`sadg-metric-btn ${silverChartMetric === 'revenue' ? 'active' : ''}`}
                            onClick={() => setSilverChartMetric('revenue')}
                          >
                            Sales (₹)
                          </button>
                        </div>
                        <div className="sadg-chart-legend">
                          <span className="sadg-legend-item">
                            <span className="sadg-legend-line" style={{ background: silverChartMetric === 'grams' ? '#0284C7' : '#0A3E42' }} />
                            {silverChartMetric === 'grams' ? 'Silver (g)' : 'Sales (₹)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sadg-chart-body">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={silverChart} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="sadgSilverGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0284C7" stopOpacity={0.28} />
                              <stop offset="100%" stopColor="#0284C7" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                          <XAxis dataKey="date" stroke="#8E9E9C" fontSize={10.5} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                          <YAxis
                            stroke="#8E9E9C"
                            fontSize={10.5}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={val => silverChartMetric === 'grams' ? `${val}g` : `₹${Number(val).toLocaleString('en-IN')}`}
                          />
                          <Tooltip content={<CustomChartTooltip isSilver={true} />} />
                          <Area
                            type="monotone"
                            dataKey={silverChartMetric === 'grams' ? 'grams' : 'revenue'}
                            name={silverChartMetric === 'grams' ? 'Silver (g)' : 'Sales (₹)'}
                            stroke={silverChartMetric === 'grams' ? '#0284C7' : '#0A3E42'}
                            strokeWidth={2.4}
                            fill="url(#sadgSilverGrad)"
                            dot={{ r: 3.5, fill: silverChartMetric === 'grams' ? '#0284C7' : '#0A3E42', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                            activeDot={{ r: 6.5, fill: '#0F172A', stroke: '#FFFFFF', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={500}
                            animationEasing="ease-in-out"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Card 3: Gold & Silver Market Rates (22K Gold & 999 Silver Only) */}
                  <div className="sadg-rates-card">
                    <div className="sadg-chart-head">
                      <div className="sadg-chart-title-box">
                        <TrendingUp size={16} color="#C6924B" />
                        <h4 className="sadg-chart-title">Gold & Silver Market Rates</h4>
                      </div>
                      <button
                        type="button"
                        className="sadg-view-all-link"
                        onClick={() => navigateToSection('gold_rates')}
                      >
                        <span>View All</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <table className="sadg-rates-table">
                      <thead>
                        <tr>
                          <th>Metal</th>
                          <th>Price</th>
                          <th>Daily Movement</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="sadg-rate-metal-row">
                              <Coins size={14} color="#C6924B" />
                              <span>Gold 22K</span>
                            </div>
                          </td>
                          <td>
                            <b>₹ <AnimatedNumber value={rates.gold_22k || 14250} /></b> / g
                          </td>
                          <td>
                            <span style={{ color: rates.diff_22k >= 0 ? '#073E40' : '#DC5353', fontWeight: 700 }}>
                              {rates.diff_22k >= 0 ? '+' : ''}<AnimatedNumber value={rates.diff_22k} decimals={2} /> (<AnimatedNumber value={rates.pct_22k} decimals={2} />%)
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div className="sadg-rate-metal-row">
                              <Layers size={14} color="#64748B" />
                              <span>Silver 999</span>
                            </div>
                          </td>
                          <td>
                            <b>₹ <AnimatedNumber value={rates.silver_999 || 275} decimals={2} /></b> / g
                          </td>
                          <td>
                            <span style={{ color: rates.diff_silver >= 0 ? '#073E40' : '#DC5353', fontWeight: 700 }}>
                              {rates.diff_silver >= 0 ? '+' : ''}<AnimatedNumber value={rates.diff_silver} decimals={2} /> (<AnimatedNumber value={rates.pct_silver} decimals={2} />%)
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Luxury illustration banner with transparent coin */}
                    <div className="sadg-rates-banner-mini">
                      <div>
                        <h5 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: '#FDE68A' }}>
                          Secure Your Wealth with Digital Bullion
                        </h5>
                        <p style={{ margin: 0, fontSize: 11, color: '#D1E3DF' }}>
                          22K Gold • Pure 999 Silver • 100% Insured
                        </p>
                      </div>
                      <img
                        src={goldCoinImg}
                        alt="Wealth"
                        className="sadg-rates-banner-coin"
                      />
                    </div>
                  </div>
                </div>

                {/* BOTTOM ROW (3-COLUMNS: RECENT TRANSACTIONS, USER BUY GOLD, ROLE SUMMARY) */}
                <div className="sadg-bottom-row">
                  {/* Card 1: Recent Transactions */}
                  <div className="sadg-bottom-card">
                    <div className="sadg-chart-head">
                      <div className="sadg-chart-title-box">
                        <Clock size={16} color="#073E40" />
                        <h4 className="sadg-chart-title">Recent Transactions</h4>
                      </div>
                      <button
                        type="button"
                        className="sadg-view-all-link"
                        onClick={() => navigateToSection('transactions')}
                      >
                        <span>View All</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="sadg-table-wrap">
                      {items.length > 0 ? (
                        <table className="sadg-table">
                          <thead>
                            <tr>
                              <th>Date & Time</th>
                              <th>Investor</th>
                              <th>User Category</th>
                              <th>Metal</th>
                              <th>Type</th>
                              <th>Quantity</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.slice(0, 5).map((row) => (
                              <tr key={row.id}>
                                <td>{row.date}</td>
                                <td>
                                  <b>{row.investor_name}</b>
                                </td>
                                <td>
                                  <span style={{ fontSize: 11, background: '#E9F7F0', color: '#0A3E42', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    {row.user_category}
                                  </span>
                                </td>
                                <td>{row.metal_label}</td>
                                <td style={{ textTransform: 'capitalize' }}>{row.transaction_type}</td>
                                <td><b><AnimatedNumber value={row.quantity_gm} decimals={3} suffix=" g" /></b></td>
                                <td>₹ <AnimatedNumber value={row.amount} decimals={2} /></td>
                                <td>
                                  <span className={`sadg-status-badge ${row.status}`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 10px', color: '#8E9E9C' }}>
                          <ReceiptText size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                          <b>No transactions found</b>
                          <div style={{ fontSize: 11 }}>for this date range</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: User Buy Gold & Silver */}
                  <div className="sadg-bottom-card">
                    <div className="sadg-chart-head">
                      <div className="sadg-chart-title-box">
                        <Users size={16} color="#0A3E42" />
                        <h4 className="sadg-chart-title">User Buy Gold & Silver</h4>
                      </div>
                      <button
                        type="button"
                        className="sadg-view-all-link"
                        onClick={() => navigateToSection('user_buy')}
                      >
                        <span>View All</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="sadg-cat-select-row">
                      <select
                        className="sadg-cat-dropdown"
                        value={selectedUserCategory}
                        onChange={(e) => setSelectedUserCategory(e.target.value)}
                      >
                        <option value="all">All User Categories</option>
                        <option value="super_stockist">Super Stockist</option>
                        <option value="distributor">Distributor</option>
                        <option value="wholesale_dealer">Wholesale Dealer</option>
                        <option value="retailer">Retailer</option>
                        <option value="customer">Customer</option>
                        <option value="general_customer">General Customer</option>
                      </select>
                    </div>

                    {selectedUserCategory !== 'all' && categorySummaries[selectedUserCategory] ? (
                      <div style={{ background: '#F8FAF9', borderRadius: 12, padding: 14, border: '1px solid #E2ECE7' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0A3E42', marginBottom: 8 }}>
                          {categorySummaries[selectedUserCategory].name} Overview
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
                          <div>Total Investors: <b><AnimatedNumber value={categorySummaries[selectedUserCategory].user_count || 0} /></b></div>
                          <div>Completed Buys: <b><AnimatedNumber value={categorySummaries[selectedUserCategory].completed_purchases || 0} /></b></div>
                          <div>Gold Purchased: <b><AnimatedNumber value={categorySummaries[selectedUserCategory].gold_gm || 0} decimals={3} suffix=" g" /></b></div>
                          <div>Silver Purchased: <b><AnimatedNumber value={categorySummaries[selectedUserCategory].silver_gm || 0} decimals={3} suffix=" g" /></b></div>
                        </div>
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E2ECE7', fontSize: 12, fontWeight: 800, color: '#073E40' }}>
                          Total Volume: <AnimatedNumber value={categorySummaries[selectedUserCategory].total_purchase_inr || 0} prefix="₹ " />
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '36px 10px', color: '#8E9E9C' }}>
                        <Users size={30} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                        <span>Select a user category</span>
                        <div style={{ fontSize: 11 }}>to view gold and silver purchases</div>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Role-wise Summary (Smooth Numbers, Never Dash) */}
                  <div className="sadg-bottom-card">
                    <div className="sadg-chart-head">
                      <div className="sadg-chart-title-box">
                        <ShieldCheck size={16} color="#C6924B" />
                        <h4 className="sadg-chart-title">Role-wise Summary</h4>
                      </div>
                      <button
                        type="button"
                        className="sadg-view-all-link"
                        onClick={() => navigateToSection('user_buy')}
                      >
                        <span>View All</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="sadg-role-grid">
                      <div
                        className="sadg-role-card sadg-clickable-card"
                        onClick={() => {
                          setSelectedUserCategory('super_stockist')
                          navigateToSection('transactions')
                        }}
                        title="Click to filter by Super Stockist"
                      >
                        <span className="sadg-role-card-name">Super Stockist</span>
                        <span className="sadg-role-card-val">
                          <AnimatedNumber value={categorySummaries.super_stockist?.gold_gm || 0} decimals={3} suffix=" g" />
                        </span>
                        <span className="sadg-role-card-sub">
                          <AnimatedNumber value={categorySummaries.super_stockist?.user_count || 0} /> active users
                        </span>
                      </div>

                      <div
                        className="sadg-role-card sadg-clickable-card"
                        onClick={() => {
                          setSelectedUserCategory('distributor')
                          navigateToSection('transactions')
                        }}
                        title="Click to filter by Distributor"
                      >
                        <span className="sadg-role-card-name">Distributor</span>
                        <span className="sadg-role-card-val">
                          <AnimatedNumber value={categorySummaries.distributor?.gold_gm || 0} decimals={3} suffix=" g" />
                        </span>
                        <span className="sadg-role-card-sub">
                          <AnimatedNumber value={categorySummaries.distributor?.user_count || 0} /> active users
                        </span>
                      </div>

                      <div
                        className="sadg-role-card sadg-clickable-card"
                        onClick={() => {
                          setSelectedUserCategory('wholesale_dealer')
                          navigateToSection('transactions')
                        }}
                        title="Click to filter by Wholesale Dealer"
                      >
                        <span className="sadg-role-card-name">Wholesale Dealer</span>
                        <span className="sadg-role-card-val">
                          <AnimatedNumber value={categorySummaries.wholesale_dealer?.gold_gm || 0} decimals={3} suffix=" g" />
                        </span>
                        <span className="sadg-role-card-sub">
                          <AnimatedNumber value={categorySummaries.wholesale_dealer?.user_count || 0} /> active users
                        </span>
                      </div>

                      <div
                        className="sadg-role-card sadg-clickable-card"
                        onClick={() => {
                          setSelectedUserCategory('retailer')
                          navigateToSection('transactions')
                        }}
                        title="Click to filter by Retailer"
                      >
                        <span className="sadg-role-card-name">Retailer</span>
                        <span className="sadg-role-card-val">
                          <AnimatedNumber value={categorySummaries.retailer?.gold_gm || 0} decimals={3} suffix=" g" />
                        </span>
                        <span className="sadg-role-card-sub">
                          <AnimatedNumber value={categorySummaries.retailer?.user_count || 0} /> active users
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
           VIEW 2: TRANSACTIONS (FULL AUDIT HISTORY)
           ══════════════════════════════════════════════════════════════ */}
        {(loading || !data) && ['transactions', 'gold_mgmt', 'silver_mgmt', 'user_buy', 'gold_rates'].includes(activeSection) && (
          <DigiGoldSectionSkeleton rows={activeSection === 'gold_rates' ? 5 : 7} />
        )}

        {activeSection === 'transactions' && !loading && data && (
          <div className="sadg-full-section">
            {/* Search & Filter Bar */}
            <div className="sadg-filters-card">
              <form onSubmit={handleSearchSubmit} className="sadg-search-box">
                <Search size={15} color="#6A7D7C" />
                <input
                  type="text"
                  placeholder="Search investor name, email, txn ID, customer ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="sadg-search-input"
                />
              </form>

              <div className="sadg-filter-selects">
                {/* Metal Filter */}
                <select
                  className="sadg-select-pill"
                  value={metalFilter}
                  onChange={(e) => { setMetalFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All Metals</option>
                  <option value="gold">Gold Only</option>
                  <option value="silver">Silver Only</option>
                </select>

                {/* Type Filter */}
                <select
                  className="sadg-select-pill"
                  value={txnTypeFilter}
                  onChange={(e) => { setTxnTypeFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All Types</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="convert">Convert</option>
                </select>

                {/* Role / Category Filter */}
                <select
                  className="sadg-select-pill"
                  value={selectedUserCategory}
                  onChange={(e) => { setSelectedUserCategory(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All User Tiers</option>
                  <option value="super_stockist">Super Stockist</option>
                  <option value="distributor">Distributor</option>
                  <option value="wholesale_dealer">Wholesale Dealer</option>
                  <option value="retailer">Retailer</option>
                  <option value="customer">Customer</option>
                  <option value="general_customer">General Customer</option>
                </select>

                {/* Status Filter */}
                <select
                  className="sadg-select-pill"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2ECE7', borderRadius: 16, overflow: 'hidden' }}>
              <div className="sadg-table-wrap">
                <table className="sadg-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Transaction ID</th>
                      <th>Customer ID</th>
                      <th>Investor Name</th>
                      <th>User Category</th>
                      <th>Metal</th>
                      <th>Type</th>
                      <th>Quantity (g)</th>
                      <th>Rate (₹/g)</th>
                      <th>Amount (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1, 2, 3, 4, 5, 6].map((skelId) => (
                        <tr key={`init-skel-${skelId}`} className="sadg-skel-tr">
                          <td><div className="sadg-skel-cell" style={{ width: 110 }} /></td>
                          <td><div className="sadg-skel-cell" style={{ width: 95 }} /></td>
                          <td><div className="sadg-skel-cell" style={{ width: 70 }} /></td>
                          <td>
                            <div className="sadg-skel-cell" style={{ width: 120 }} />
                            <div className="sadg-skel-cell" style={{ width: 150, marginTop: 4, height: 10 }} />
                          </td>
                          <td><div className="sadg-skel-cell" style={{ width: 75 }} /></td>
                          <td><div className="sadg-skel-cell" style={{ width: 65 }} /></td>
                          <td><div className="sadg-skel-cell" style={{ width: 45 }} /></td>
                          <td><div className="sadg-skel-cell" style={{ width: 55 }} /></td>
                          <td><div className="sadg-skel-cell" style={{ width: 65 }} /></td>
                          <td><div className="sadg-skel-cell" style={{ width: 70 }} /></td>
                          <td><div className="sadg-skel-cell" style={{ width: 75, borderRadius: 12 }} /></td>
                        </tr>
                      ))
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#6A7D7C' }}>
                          No matching transactions found for this date range and filters.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {filteredItems.slice(0, txnVisibleCount).map((row) => (
                          <tr key={row.id}>
                            <td>{row.datetime_str || row.date}</td>
                            <td>
                              <code style={{ fontSize: 11, background: '#F0F5F2', padding: '2px 6px', borderRadius: 4, color: '#0A3E42', fontWeight: 700 }}>
                                {row.transaction_id}
                              </code>
                            </td>
                            <td>{row.customer_id}</td>
                            <td>
                              <b>{row.investor_name}</b>
                              <div style={{ fontSize: 10.5, color: '#6A7D7C' }}>{row.user_email}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: 11, background: '#E9F7F0', color: '#0A3E42', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>
                                {row.user_category}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: row.metal === 'gold' ? '#C6924B' : '#64748B' }}>
                                {row.metal_label}
                              </span>
                            </td>
                            <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{row.transaction_type}</td>
                            <td><b><AnimatedNumber value={row.quantity_gm} decimals={3} suffix=" g" /></b></td>
                            <td>₹ <AnimatedNumber value={row.rate} decimals={2} /></td>
                            <td><b>₹ <AnimatedNumber value={row.amount} decimals={2} /></b></td>
                            <td>
                              <span className={`sadg-status-badge ${row.status}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {/* Skeleton Shimmer Loading Rows while fetching next scroll batch */}
                        {loadingMoreTxns && (
                          [1, 2, 3, 4, 5].map((skelId) => (
                            <tr key={`scroll-skel-${skelId}`} className="sadg-skel-tr">
                              <td><div className="sadg-skel-cell" style={{ width: 110 }} /></td>
                              <td><div className="sadg-skel-cell" style={{ width: 95 }} /></td>
                              <td><div className="sadg-skel-cell" style={{ width: 70 }} /></td>
                              <td>
                                <div className="sadg-skel-cell" style={{ width: 120 }} />
                                <div className="sadg-skel-cell" style={{ width: 150, marginTop: 4, height: 10 }} />
                              </td>
                              <td><div className="sadg-skel-cell" style={{ width: 75 }} /></td>
                              <td><div className="sadg-skel-cell" style={{ width: 65 }} /></td>
                              <td><div className="sadg-skel-cell" style={{ width: 45 }} /></td>
                              <td><div className="sadg-skel-cell" style={{ width: 55 }} /></td>
                              <td><div className="sadg-skel-cell" style={{ width: 65 }} /></td>
                              <td><div className="sadg-skel-cell" style={{ width: 70 }} /></td>
                              <td><div className="sadg-skel-cell" style={{ width: 75, borderRadius: 12 }} /></td>
                            </tr>
                          ))
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sentinel anchor for Infinite Scroll */}
              <div ref={txnSentinelRef} style={{ height: 12, width: '100%' }} />

              {/* Infinite Scroll Live Audit Bar */}
              <div className="sadg-pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#4E615F', fontWeight: 600 }}>
                  Showing <b><AnimatedNumber value={Math.min(txnVisibleCount, filteredItems.length)} /></b> of <b><AnimatedNumber value={data?.total_records} /></b> matching records
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {loadingMoreTxns ? (
                    <span style={{ fontSize: 12, color: '#073E40', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RefreshCw size={13} className="sadg-spin" />
                      Loading more records…
                    </span>
                  ) : txnHasMore ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#6A7D7C', fontWeight: 600 }}>
                        ↓ Scroll down or
                      </span>
                      <button
                        type="button"
                        onClick={() => fetchData({ append: true })}
                        style={{
                          background: '#E9F7F0',
                          border: '1px solid #B8E4D0',
                          color: '#0A3E42',
                          fontWeight: 700,
                          fontSize: 11.5,
                          padding: '3px 10px',
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                      >
                        + Load 35 More
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#073E40', fontWeight: 700 }}>
                      ✓ All <AnimatedNumber value={data?.total_records ?? filteredItems.length} /> records loaded
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           VIEW 3: GOLD MANAGEMENT (DETAILED GOLD SALES)
           ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'gold_mgmt' && !loading && data && (
          <div className="sadg-full-section">
            {/* 6 Gold Specific KPI Cards (AnimatedNumbers, Never Dash) */}
            <div className="sadg-kpi-grid">
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box gold">
                  <Coins size={18} />
                </div>
                <span className="sadg-kpi-label">Total Gold Sales Value</span>
                <b className="sadg-kpi-value">
                  <AnimatedNumber value={kpis.total_gold_sales_inr || 0} prefix="₹ " />
                </b>
                <span className="sadg-kpi-sub">Total INR inflow</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box gold">
                  <Sparkles size={18} />
                </div>
                <span className="sadg-kpi-label">Total Gold Sold</span>
                <b className="sadg-kpi-value">
                  <AnimatedNumber value={kpis.total_gold_sold_gm || 0} decimals={3} suffix=" g" />
                </b>
                <span className="sadg-kpi-sub">Net gold weight</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box mint">
                  <ArrowUpRight size={18} />
                </div>
                <span className="sadg-kpi-label">Gold Buy Transactions</span>
                <b className="sadg-kpi-value"><AnimatedNumber value={kpis.gold_buy_txns || 0} /></b>
                <span className="sadg-kpi-sub">Purchase count</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box teal">
                  <ReceiptText size={18} />
                </div>
                <span className="sadg-kpi-label">Gold Sell Transactions</span>
                <b className="sadg-kpi-value"><AnimatedNumber value={kpis.gold_sell_txns || 0} /></b>
                <span className="sadg-kpi-sub">Liquidations</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box gold">
                  <TrendingUp size={18} />
                </div>
                <span className="sadg-kpi-label">Average Selling Rate</span>
                <b className="sadg-kpi-value">
                  <AnimatedNumber value={kpis.avg_gold_rate || rates.gold_22k || 13200} prefix="₹ " suffix=" / g" />
                </b>
                <span className="sadg-kpi-sub">Benchmark pricing</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box mint">
                  <ArrowLeftRight size={18} />
                </div>
                <span className="sadg-kpi-label">Total Gold Transactions</span>
                <b className="sadg-kpi-value"><AnimatedNumber value={kpis.total_gold_txns || 0} /></b>
                <span className="sadg-kpi-sub">All gold operations</span>
              </div>
            </div>

            {/* Gold Sales Chart (Smooth Spline AreaChart with Toggle & 500ms Ease Animation) */}
            <div className="sadg-chart-card" style={{ height: 260 }}>
              <div className="sadg-chart-head">
                <div className="sadg-chart-title-box">
                  <Coins size={18} color="#C6924B" />
                  <h4 className="sadg-chart-title">Digi Gold Sales Analytics Timeline</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="sadg-chart-metric-toggle">
                    <button
                      type="button"
                      className={`sadg-metric-btn ${goldMgmtMetric === 'grams' ? 'active' : ''}`}
                      onClick={() => setGoldMgmtMetric('grams')}
                    >
                      Weight (g)
                    </button>
                    <button
                      type="button"
                      className={`sadg-metric-btn ${goldMgmtMetric === 'revenue' ? 'active' : ''}`}
                      onClick={() => setGoldMgmtMetric('revenue')}
                    >
                      Sales (₹)
                    </button>
                  </div>
                  <div className="sadg-chart-legend">
                    <span className="sadg-legend-item">
                      <span className="sadg-legend-line" style={{ background: '#073E40' }} />
                      {goldMgmtMetric === 'grams' ? 'Quantity Sold (g)' : 'Sales (₹)'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="sadg-chart-body" style={{ height: 200, transition: 'opacity 0.25s ease', opacity: loading ? 0.6 : 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={goldChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldMgmtAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#073E40" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#073E40" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F1" />
                    <XAxis dataKey="date" stroke="#8E9E9C" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                    <YAxis
                      stroke="#8E9E9C"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={val => goldMgmtMetric === 'grams' ? `${val}g` : `₹${Number(val).toLocaleString('en-IN')}`}
                    />
                    <Tooltip content={<CustomChartTooltip isSilver={false} />} />
                    <Area
                      type="monotone"
                      dataKey={goldMgmtMetric === 'grams' ? 'grams' : 'revenue'}
                      name={goldMgmtMetric === 'grams' ? 'Gold (g)' : 'Sales (₹)'}
                      stroke="#073E40"
                      strokeWidth={2.4}
                      fill="url(#goldMgmtAreaGrad)"
                      dot={{ r: 3.5, fill: '#073E40', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 6.5, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationDuration={500}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gold Transactions Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2ECE7', borderRadius: 16, overflow: 'hidden' }}>
              <div className="sadg-table-wrap">
                <table className="sadg-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Transaction ID</th>
                      <th>Investor</th>
                      <th>Category</th>
                      <th>Gold Quantity (g)</th>
                      <th>Gold Rate (₹/g)</th>
                      <th>Amount (₹)</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.filter(i => i.metal === 'gold').length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#6A7D7C' }}>
                          No Digi Gold sales recorded for this date range.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.filter(i => i.metal === 'gold').slice(0, 15).map(row => (
                        <tr key={row.id}>
                          <td>{row.datetime_str || row.date}</td>
                          <td><code>{row.transaction_id}</code></td>
                          <td>
                            <b>{row.investor_name}</b>
                            <div style={{ fontSize: 10.5, color: '#6A7D7C' }}>{row.user_email}</div>
                          </td>
                          <td>{row.user_category}</td>
                          <td><b style={{ color: '#0A3E42' }}><AnimatedNumber value={row.quantity_gm} decimals={3} suffix=" g" /></b></td>
                          <td>₹ <AnimatedNumber value={row.rate} decimals={2} /></td>
                          <td><b>₹ <AnimatedNumber value={row.amount} decimals={2} /></b></td>
                          <td style={{ textTransform: 'capitalize' }}>{row.transaction_type}</td>
                          <td>
                            <span className={`sadg-status-badge ${row.status}`}>{row.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           VIEW 4: SILVER MANAGEMENT (DETAILED SILVER SALES)
           ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'silver_mgmt' && !loading && data && (
          <div className="sadg-full-section">
            {/* 6 Silver Specific KPI Cards (AnimatedNumbers, Never Dash) */}
            <div className="sadg-kpi-grid">
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box silver">
                  <Layers size={18} />
                </div>
                <span className="sadg-kpi-label">Total Silver Sales Value</span>
                <b className="sadg-kpi-value">
                  <AnimatedNumber value={kpis.total_silver_sales_inr || 0} prefix="₹ " />
                </b>
                <span className="sadg-kpi-sub">Total INR inflow</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box silver">
                  <ShieldCheck size={18} />
                </div>
                <span className="sadg-kpi-label">Total Silver Sold</span>
                <b className="sadg-kpi-value">
                  <AnimatedNumber value={kpis.total_silver_sold_gm || 0} decimals={3} suffix=" g" />
                </b>
                <span className="sadg-kpi-sub">
                  {kpis.total_silver_sold_gm > 0 ? <AnimatedNumber value={kpis.total_silver_sold_gm / 1000} decimals={4} suffix=" kg" /> : 'Net silver weight'}
                </span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box mint">
                  <ArrowUpRight size={18} />
                </div>
                <span className="sadg-kpi-label">Silver Buy Transactions</span>
                <b className="sadg-kpi-value"><AnimatedNumber value={kpis.silver_buy_txns || 0} /></b>
                <span className="sadg-kpi-sub">Purchase count</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box teal">
                  <ReceiptText size={18} />
                </div>
                <span className="sadg-kpi-label">Silver Sell Transactions</span>
                <b className="sadg-kpi-value"><AnimatedNumber value={kpis.silver_sell_txns || 0} /></b>
                <span className="sadg-kpi-sub">Liquidations</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box silver">
                  <TrendingUp size={18} />
                </div>
                <span className="sadg-kpi-label">Average Selling Rate</span>
                <b className="sadg-kpi-value">
                  <AnimatedNumber value={kpis.avg_silver_rate || rates.silver_999 || 275} prefix="₹ " decimals={2} suffix=" / g" />
                </b>
                <span className="sadg-kpi-sub">Benchmark pricing</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box mint">
                  <ArrowLeftRight size={18} />
                </div>
                <span className="sadg-kpi-label">Total Silver Transactions</span>
                <b className="sadg-kpi-value"><AnimatedNumber value={kpis.total_silver_txns || 0} /></b>
                <span className="sadg-kpi-sub">All silver operations</span>
              </div>
            </div>

            {/* Silver Sales Chart (Smooth Spline AreaChart with Toggle & 500ms Ease Animation) */}
            <div className="sadg-chart-card" style={{ height: 260 }}>
              <div className="sadg-chart-head">
                <div className="sadg-chart-title-box">
                  <Layers size={18} color="#64748B" />
                  <h4 className="sadg-chart-title">Digi Silver Sales Analytics Timeline</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="sadg-chart-metric-toggle">
                    <button
                      type="button"
                      className={`sadg-metric-btn ${silverMgmtMetric === 'grams' ? 'active' : ''}`}
                      onClick={() => setSilverMgmtMetric('grams')}
                    >
                      Weight (g)
                    </button>
                    <button
                      type="button"
                      className={`sadg-metric-btn ${silverMgmtMetric === 'revenue' ? 'active' : ''}`}
                      onClick={() => setSilverMgmtMetric('revenue')}
                    >
                      Sales (₹)
                    </button>
                  </div>
                  <div className="sadg-chart-legend">
                    <span className="sadg-legend-item">
                      <span className="sadg-legend-line" style={{ background: '#0284C7' }} />
                      {silverMgmtMetric === 'grams' ? 'Quantity Sold (g)' : 'Sales (₹)'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="sadg-chart-body" style={{ height: 200, transition: 'opacity 0.25s ease', opacity: loading ? 0.6 : 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={silverChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="silverMgmtAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284C7" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#0284C7" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F1" />
                    <XAxis dataKey="date" stroke="#8E9E9C" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                    <YAxis
                      stroke="#8E9E9C"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={val => silverMgmtMetric === 'grams' ? `${val}g` : `₹${Number(val).toLocaleString('en-IN')}`}
                    />
                    <Tooltip content={<CustomChartTooltip isSilver={true} />} />
                    <Area
                      type="monotone"
                      dataKey={silverMgmtMetric === 'grams' ? 'grams' : 'revenue'}
                      name={silverMgmtMetric === 'grams' ? 'Silver (g)' : 'Sales (₹)'}
                      stroke="#0284C7"
                      strokeWidth={2.4}
                      fill="url(#silverMgmtAreaGrad)"
                      dot={{ r: 3.5, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 6.5, fill: '#0F172A', stroke: '#FFFFFF', strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationDuration={500}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Silver Transactions Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2ECE7', borderRadius: 16, overflow: 'hidden' }}>
              <div className="sadg-table-wrap">
                <table className="sadg-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Transaction ID</th>
                      <th>Investor</th>
                      <th>Category</th>
                      <th>Silver Quantity (g)</th>
                      <th>Silver Rate (₹/g)</th>
                      <th>Amount (₹)</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.filter(i => i.metal === 'silver').length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#6A7D7C' }}>
                          No Digi Silver sales recorded for this date range.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.filter(i => i.metal === 'silver').slice(0, 15).map(row => (
                        <tr key={row.id}>
                          <td>{row.datetime_str || row.date}</td>
                          <td><code>{row.transaction_id}</code></td>
                          <td>
                            <b>{row.investor_name}</b>
                            <div style={{ fontSize: 10.5, color: '#6A7D7C' }}>{row.user_email}</div>
                          </td>
                          <td>{row.user_category}</td>
                          <td><b style={{ color: '#0A3E42' }}><AnimatedNumber value={row.quantity_gm} decimals={3} suffix=" g" /></b></td>
                          <td>₹ <AnimatedNumber value={row.rate} decimals={2} /></td>
                          <td><b>₹ <AnimatedNumber value={row.amount} decimals={2} /></b></td>
                          <td style={{ textTransform: 'capitalize' }}>{row.transaction_type}</td>
                          <td>
                            <span className={`sadg-status-badge ${row.status}`}>{row.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           VIEW 5: USER BUY GOLD (CATEGORY-WISE PURCHASE HISTORY)
           ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'user_buy' && !loading && data && (
          <div className="sadg-full-section">
            {/* Category Dropdown & Summary */}
            <div className="sadg-filters-card">
              <div className="sadg-view5-filter-row">
                <span className="sadg-view5-label">
                  Select User Category:
                </span>
                <select
                  className="sadg-cat-dropdown"
                  value={selectedUserCategory}
                  onChange={(e) => { setSelectedUserCategory(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All User Categories</option>
                  <option value="super_stockist">Super Stockist</option>
                  <option value="distributor">Distributor</option>
                  <option value="wholesale_dealer">Wholesale Dealer</option>
                  <option value="retailer">Retailer</option>
                  <option value="customer">Customer</option>
                  <option value="general_customer">General Customer</option>
                </select>
              </div>

              <div className="sadg-view5-metal-row">
                <select
                  className="sadg-select-pill"
                  value={metalFilter}
                  onChange={(e) => setMetalFilter(e.target.value)}
                >
                  <option value="all">All Metals</option>
                  <option value="gold">Digi Gold</option>
                  <option value="silver">Digi Silver</option>
                </select>
              </div>
            </div>

            {/* Category Summary Cards */}
            {selectedUserCategory !== 'all' && categorySummaries[selectedUserCategory] && (
              <div className="sadg-kpi-grid sadg-kpi-grid-5">
                <div className="sadg-kpi-card">
                  <span className="sadg-kpi-label">Total Matching Users</span>
                  <b className="sadg-kpi-value"><AnimatedNumber value={categorySummaries[selectedUserCategory].user_count || 0} /></b>
                  <span className="sadg-kpi-sub">Registered in tier</span>
                </div>
                <div className="sadg-kpi-card">
                  <span className="sadg-kpi-label">Total Gold Purchased</span>
                  <b className="sadg-kpi-value"><AnimatedNumber value={categorySummaries[selectedUserCategory].gold_gm || 0} decimals={3} suffix=" g" /></b>
                  <span className="sadg-kpi-sub">Cumulative gold weight</span>
                </div>
                <div className="sadg-kpi-card">
                  <span className="sadg-kpi-label">Total Silver Purchased</span>
                  <b className="sadg-kpi-value"><AnimatedNumber value={categorySummaries[selectedUserCategory].silver_gm || 0} decimals={3} suffix=" g" /></b>
                  <span className="sadg-kpi-sub">Cumulative silver weight</span>
                </div>
                <div className="sadg-kpi-card">
                  <span className="sadg-kpi-label">Total Purchase Value</span>
                  <b className="sadg-kpi-value"><AnimatedNumber value={categorySummaries[selectedUserCategory].total_purchase_inr || 0} prefix="₹ " /></b>
                  <span className="sadg-kpi-sub">Total capital invested</span>
                </div>
                <div className="sadg-kpi-card">
                  <span className="sadg-kpi-label">Completed Purchases</span>
                  <b className="sadg-kpi-value"><AnimatedNumber value={categorySummaries[selectedUserCategory].completed_purchases || 0} /></b>
                  <span className="sadg-kpi-sub">Verified buy orders</span>
                </div>
              </div>
            )}

            {/* Category Purchases Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2ECE7', borderRadius: 16, overflow: 'hidden' }}>
              <div className="sadg-table-wrap">
                <table className="sadg-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Investor Name</th>
                      <th>Customer ID</th>
                      <th>User Category</th>
                      <th>Metal Type</th>
                      <th>Quantity</th>
                      <th>Purchase Rate</th>
                      <th>Amount (₹)</th>
                      <th>Transaction ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#6A7D7C' }}>
                          No purchases found for this category and date range.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.slice(0, 20).map(row => (
                        <tr key={row.id}>
                          <td>{row.datetime_str || row.date}</td>
                          <td>
                            <b>{row.investor_name}</b>
                            <div style={{ fontSize: 10.5, color: '#6A7D7C' }}>{row.user_email}</div>
                          </td>
                          <td>{row.customer_id}</td>
                          <td>
                            <span style={{ fontSize: 11, background: '#E9F7F0', color: '#0A3E42', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>
                              {row.user_category}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: row.metal === 'gold' ? '#C6924B' : '#64748B' }}>
                              {row.metal_label}
                            </span>
                          </td>
                          <td><b><AnimatedNumber value={row.quantity_gm} decimals={3} suffix=" g" /></b></td>
                          <td>₹ <AnimatedNumber value={row.rate} decimals={2} /></td>
                          <td><b>₹ <AnimatedNumber value={row.amount} decimals={2} /></b></td>
                          <td><code>{row.transaction_id}</code></td>
                          <td>
                            <span className={`sadg-status-badge ${row.status}`}>{row.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           VIEW 6: GOLD RATES (DEDICATED SECTION)
           ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'gold_rates' && !loading && data && (
          <div className="sadg-full-section">
            {/* Live Benchmark Rates Cards (22K Gold & Pure 999 Silver Only) */}
            <div className="sadg-rates-display-grid">
              <div className="sadg-rate-banner-box">
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#FDE68A', textTransform: 'uppercase' }}>
                    Gold 22K (Athirai 916 Benchmark)
                  </span>
                  <div className="sadg-rate-banner-price">
                    ₹ <AnimatedNumber value={rates.gold_22k || 13200} /> <small style={{ fontSize: 14 }}>/ g</small>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Movement: {rates.diff_22k >= 0 ? '+' : ''}<AnimatedNumber value={rates.diff_22k} decimals={2} /> (<AnimatedNumber value={rates.pct_22k} decimals={2} />%)
                  </div>
                </div>
                <Coins size={38} color="#FDE68A" />
              </div>

              <div className="sadg-rate-banner-box silver">
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#E2E8F0', textTransform: 'uppercase' }}>
                    Digi Silver (Pure 999 Benchmark)
                  </span>
                  <div className="sadg-rate-banner-price">
                    ₹ <AnimatedNumber value={rates.silver_999 || 275} decimals={2} /> <small style={{ fontSize: 14 }}>/ g</small>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Per Kilogram: ₹ <AnimatedNumber value={Number(rates.silver_999 || 0) * 1000} /> | Movement: {rates.diff_silver >= 0 ? '+' : ''}<AnimatedNumber value={rates.diff_silver} decimals={2} /> (<AnimatedNumber value={rates.pct_silver} decimals={2} />%)
                  </div>
                </div>
                <Layers size={38} color="#E2E8F0" />
              </div>
            </div>

            {/* Super Admin Rate Notice (Official Benchmark Rates Managed via SuperAdmin Portal Popup) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2ECE7', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E6F3F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#073E40', flexShrink: 0 }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#103F42' }}>
                    Official Market Benchmark Rates (Live Synced)
                  </div>
                  <div style={{ fontSize: 12, color: '#6A7D7C', marginTop: 2 }}>
                    Official gold and silver rates are configured exclusively via the Super Admin Rate Portal popup.
                  </div>
                </div>
              </div>
              <span className="sadg-status-badge completed" style={{ fontSize: 12, padding: '6px 14px' }}>
                Synced With Super Admin Portal
              </span>
            </div>

            {/* Historical Gold & Silver Rate Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2ECE7', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2ECE7', fontWeight: 800, fontSize: 15 }}>
                Official Rate History Log
              </div>
              <div className="sadg-table-wrap">
                <table className="sadg-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Gold 22K (₹/g)</th>
                      <th>Silver 999 (₹/g)</th>
                      <th>Source Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: 30, color: '#6A7D7C' }}>
                          No historical rate logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      rateHistory.map((r, idx) => (
                        <tr key={r.date_iso || idx}>
                          <td><b>{r.date}</b></td>
                          <td>₹ <AnimatedNumber value={r.gold_22k} decimals={2} /></td>
                          <td>₹ <AnimatedNumber value={r.silver_999} decimals={2} /></td>
                          <td>
                            <span className="sadg-status-badge completed">Verified Athirai Rate</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            VIEW 7: BULLION DELIVERY ORDERS (SUPER ADMIN)
            ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'orders' && (
          <div className="sadg-section-body">

            {/* STATUS UPDATE SUCCESS TOAST */}
            {statusUpdateSuccess && (
              <div style={{
                background: 'linear-gradient(135deg, #0E8548 0%, #0A6B3A 100%)',
                color: '#FFFFFF', borderRadius: 12, padding: '12px 18px',
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(14,133,72,0.3)',
                animation: 'sadgFadeIn 0.3s ease'
              }}>
                <Check size={16} />
                {statusUpdateSuccess}
              </div>
            )}

            {/* STAT CARDS ROW */}
            <div className="sadg-orders-stats-grid">
              <button type="button" className={`sadg-order-stat-card ${orderCardFilter === 'all' ? 'selected' : ''}`} onClick={() => setOrderCardFilter('all')} aria-pressed={orderCardFilter === 'all'}>
                <div className="sadg-order-stat-info">
                  <span className="sadg-order-stat-label">Total Orders</span>
                  <span className="sadg-order-stat-val"><AnimatedNumber value={orderStats.totalCount} /></span>
                </div>
                <div className="sadg-order-stat-icon-wrap">
                  <Package size={20} />
                </div>
              </button>
              <button type="button" className={`sadg-order-stat-card ${orderCardFilter === 'pending' ? 'selected' : ''}`} onClick={() => { setOrderCardFilter('pending'); setOrderStatusFilter('all'); setOrderMetalFilter('all'); setOrderSearch('') }} aria-pressed={orderCardFilter === 'pending'} title="All orders awaiting delivery, across all dates">
                <div className="sadg-order-stat-info">
                  <span className="sadg-order-stat-label">Pending Orders <small>All time</small></span>
                  <span className="sadg-order-stat-val" style={{ color: '#D49A38' }}><AnimatedNumber value={orderStats.pendingCount} /></span>
                </div>
                <div className="sadg-order-stat-icon-wrap gold">
                  <Truck size={20} />
                </div>
              </button>
              <button type="button" className={`sadg-order-stat-card ${orderCardFilter === 'delivered' ? 'selected' : ''}`} onClick={() => setOrderCardFilter('delivered')} aria-pressed={orderCardFilter === 'delivered'}>
                <div className="sadg-order-stat-info">
                  <span className="sadg-order-stat-label">Delivered</span>
                  <span className="sadg-order-stat-val" style={{ color: '#0E8548' }}><AnimatedNumber value={orderStats.deliveredCount} /></span>
                </div>
                <div className="sadg-order-stat-icon-wrap success">
                  <CheckCircle2 size={20} />
                </div>
              </button>
              <button type="button" className={`sadg-order-stat-card ${orderCardFilter === 'weight' ? 'selected' : ''}`} onClick={() => setOrderCardFilter('weight')} aria-pressed={orderCardFilter === 'weight'}>
                <div className="sadg-order-stat-info">
                  <span className="sadg-order-stat-label">Total Weight</span>
                  <span className="sadg-order-stat-val"><AnimatedNumber value={orderStats.totalWeight} decimals={3} suffix=" g" /></span>
                </div>
                <div className="sadg-order-stat-icon-wrap silver">
                  <Layers size={20} />
                </div>
              </button>
              <button type="button" className={`sadg-order-stat-card ${orderCardFilter === 'valuation' ? 'selected' : ''}`} onClick={() => setOrderCardFilter('valuation')} aria-pressed={orderCardFilter === 'valuation'}>
                <div className="sadg-order-stat-info">
                  <span className="sadg-order-stat-label">Total Valuation</span>
                  <span className="sadg-order-stat-val" style={{ fontSize: 18 }}><AnimatedNumber value={orderStats.totalValuation} prefix="₹ " /></span>
                </div>
                <div className="sadg-order-stat-icon-wrap gold">
                  <Wallet size={20} />
                </div>
              </button>
            </div>

            {/* FILTER BAR */}
            {orderCardFilter === 'pending' && <p className="sadg-pending-scope">Showing orders awaiting delivery across all dates.</p>}
            <div className="sadg-orders-filter-bar">
              <div className="sadg-orders-search-box">
                <Search size={14} color="#6A7D7C" />
                <input
                  type="text"
                  placeholder="Search by order ID, customer, phone, city…"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
              <div className="sadg-orders-filter-pills">
                <div className="sadg-order-filter-group status">
                  {['all', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`sadg-order-pill ${orderStatusFilter === s ? 'active' : ''}`}
                      onClick={() => setOrderStatusFilter(s)}
                    >
                      {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="sadg-order-filter-divider" />
                <div className="sadg-order-filter-group metal">
                  {['all', 'gold', 'silver'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`sadg-order-pill ${orderMetalFilter === m ? 'active' : ''}`}
                      onClick={() => setOrderMetalFilter(m)}
                    >
                      {m === 'all' ? 'All Metal' : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="sadg-order-pill refresh"
                    onClick={fetchDeliveryOrders}
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {deliveryOrdersError && (
              <div className="sadg-load-error" role="alert">
                <span>{deliveryOrdersError}</span>
                <button type="button" onClick={fetchDeliveryOrders} disabled={loadingDeliveryOrders}>
                  <RefreshCw size={14} className={loadingDeliveryOrders ? 'sadg-spin' : ''} /> Retry
                </button>
              </div>
            )}

            {/* ORDERS TABLE */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2ECE7', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2ECE7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#103F42' }}>
                  Delivery Orders
                  <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: '#6A7D7C', background: '#F0F6F4', padding: '3px 10px', borderRadius: 20 }}>
                    <AnimatedNumber value={deliveryOrdersFilteredTotal} /> orders
                  </span>
                </span>
              </div>

              {loadingDeliveryOrders || (!deliveryOrdersReady && !deliveryOrdersError) ? (
                <div className="sadg-orders-skeleton-wrap" role="status" aria-label="Loading delivery orders">
                  <span className="sadg-sr-only">Loading delivery orders</span>
                  <div className="sadg-orders-skeleton-table">
                    <div className="sadg-orders-skeleton-row header">
                      {['Order ID', 'Date', 'Customer', 'Address', 'Metal', 'Weight', 'Valuation', 'Status', 'Actions'].map((heading) => (
                        <span key={heading}>{heading}</span>
                      ))}
                    </div>
                    {Array.from({ length: 5 }, (_, row) => (
                      <div className="sadg-orders-skeleton-row" key={row}>
                        <span><i className="sadg-skeleton-line" style={{ width: '88%' }} /></span>
                        <span><i className="sadg-skeleton-line" style={{ width: '78%' }} /></span>
                        <span className="customer"><i className="sadg-skeleton-line" style={{ width: '82%' }} /><i className="sadg-skeleton-line short" style={{ width: '58%' }} /></span>
                        <span><i className="sadg-skeleton-line" style={{ width: '94%' }} /></span>
                        <span><i className="sadg-skeleton-line pill" style={{ width: '68%' }} /></span>
                        <span><i className="sadg-skeleton-line" style={{ width: '62%' }} /></span>
                        <span><i className="sadg-skeleton-line" style={{ width: '70%' }} /></span>
                        <span><i className="sadg-skeleton-line pill" style={{ width: '76%' }} /></span>
                        <span><i className="sadg-skeleton-line action" /></span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredDeliveryOrders.length === 0 ? (
                <div style={{ padding: 50, textAlign: 'center', color: '#6A7D7C' }}>
                  <Truck size={40} color="#D5E2DC" style={{ marginBottom: 12 }} />
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No orders found</div>
                  <div style={{ fontSize: 13 }}>
                    {deliveryOrdersList.length === 0
                      ? 'No delivery orders have been placed yet.'
                      : 'No orders match the current filters.'}
                  </div>
                </div>
              ) : (
                <>
                <div className="sadg-table-wrap sadg-orders-table-wrap">
                  <table className="sadg-table sadg-delivery-orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Address</th>
                        <th>Metal</th>
                        <th style={{ textAlign: 'right' }}>Weight</th>
                        <th style={{ textAlign: 'right' }}>Valuation</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeliveryOrders.map((order) => {
                        const oid = order.id || order.order_id
                        const isGold = (order.metal || '').toLowerCase().includes('gold')
                        const statusClass = (order.status || 'confirmed').toLowerCase().replace(/\s+/, '_')
                        const isUpdating = updatingOrderStatusId === oid
                        const addr = order.address
                      const addrLine = addr
                          ? (typeof addr === 'string' ? addr : (addr.formatted || [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')))
                          : (order.delivery_address || '—')
                        return (
                          <tr key={oid} style={{ cursor: 'pointer' }} onClick={() => setSelectedDeliveryOrder(order)}>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#073E40', fontSize: 12 }}>
                                #{order.order_id || oid}
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: '#6A7D7C', whiteSpace: 'nowrap' }}>
                              {order.created_at || '—'}
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#103F42', fontSize: 13 }}>
                                {order.customer_name || 'Customer'}
                              </div>
                              {order.customer_phone && (
                                <div style={{ fontSize: 11, color: '#6A7D7C', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                  <Phone size={10} />
                                  {order.customer_phone}
                                </div>
                              )}
                            </td>
                            <td style={{ maxWidth: 180 }}>
                              <div style={{ fontSize: 12, color: '#556B69', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                                <MapPin size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                                <span style={{ lineHeight: 1.4 }}>{addrLine}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`sadg-metal-badge ${isGold ? 'gold' : 'silver'}`}>
                                {isGold ? '22K Gold' : 'Silver 999'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                              <AnimatedNumber value={order.weight_gm} decimals={3} /> g
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#073E40', fontSize: 13 }}>
                              ₹ <AnimatedNumber value={order.valuation_inr} decimals={2} />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`sadg-order-status-badge ${statusClass}`}>
                                {order.status || 'confirmed'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                                <select
                                  className="sadg-order-status-select"
                                  value={order.status || 'confirmed'}
                                  disabled={isUpdating}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    handleUpdateDeliveryStatus(order, e.target.value)
                                  }}
                                >
                                  {['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                                    <option key={s} value={s}>
                                      {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </option>
                                  ))}
                                </select>
                                {isUpdating && <RefreshCw size={12} className="sadg-spin" color="#073E40" />}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedDeliveryOrder(order) }}
                                  style={{ background: '#F0F6F4', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#073E40', display: 'flex', alignItems: 'center' }}
                                  title="View details"
                                >
                                  <Eye size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="sadg-orders-mobile-list">
                  {filteredDeliveryOrders.map((order) => {
                    const oid = order.id || order.order_id
                    const isGold = (order.metal || '').toLowerCase().includes('gold')
                    const status = (order.status || 'confirmed').toLowerCase()
                    const addr = order.address
                    const addrLine = addr
                      ? (typeof addr === 'string' ? addr : (addr.formatted || [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')))
                      : (order.delivery_address || 'Address unavailable')
                    return (
                      <article className="sadg-orders-mobile-card" key={oid} onClick={() => setSelectedDeliveryOrder(order)}>
                        <div className="sadg-orders-mobile-card-head">
                          <div><b>#{order.order_id || oid}</b><time>{order.created_at || 'Date unavailable'}</time></div>
                          <span className={`sadg-order-status-badge ${status}`}>{order.status || 'confirmed'}</span>
                        </div>
                        <div className="sadg-orders-mobile-customer">
                          <b>{order.customer_name || 'Customer'}</b>
                          {order.customer_phone && <span><Phone size={12} />{order.customer_phone}</span>}
                        </div>
                        <div className="sadg-orders-mobile-address"><MapPin size={13} /><span>{addrLine}</span></div>
                        <div className="sadg-orders-mobile-facts">
                          <div><small>Metal</small><span className={`sadg-metal-badge ${isGold ? 'gold' : 'silver'}`}>{isGold ? '22K Gold' : 'Silver 999'}</span></div>
                          <div><small>Weight</small><b><AnimatedNumber value={order.weight_gm} decimals={3} /> g</b></div>
                          <div><small>Valuation</small><b>₹ <AnimatedNumber value={order.valuation_inr} decimals={2} /></b></div>
                        </div>
                        <div className="sadg-orders-mobile-actions" onClick={(event) => event.stopPropagation()}>
                          <label htmlFor={`mobile-order-status-${oid}`}>Update status</label>
                          <select id={`mobile-order-status-${oid}`} className="sadg-order-status-select" value={order.status || 'confirmed'} disabled={updatingOrderStatusId === oid} onChange={(event) => handleUpdateDeliveryStatus(order, event.target.value)}>
                            {['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
                          </select>
                          <button type="button" onClick={() => setSelectedDeliveryOrder(order)}><Eye size={15} />View</button>
                        </div>
                      </article>
                    )
                  })}
                </div>
                </>
              )}
            </div>
            {deliveryOrdersHasMore && <div ref={deliveryOrderSentinelRef} style={{ height: 1 }} aria-hidden="true" />}
            {loadingMoreDeliveryOrders && (
              <div className="sadg-orders-skeleton-wrap" role="status" aria-label="Loading more delivery orders">
                {[1, 2, 3].map((row) => <div className="sadg-orders-skeleton-row" key={`orders-more-${row}`}><span><i className="sadg-skeleton-line" style={{ width: '95%' }} /></span><span><i className="sadg-skeleton-line" style={{ width: '70%' }} /></span><span><i className="sadg-skeleton-line" style={{ width: '80%' }} /></span></div>)}
              </div>
            )}
            <div className="sadg-pagination-bar" style={{ fontSize: 12, color: '#6A7D7C' }}>
              Showing <AnimatedNumber value={deliveryOrdersList.length} /> of <AnimatedNumber value={deliveryOrdersFilteredTotal} /> matching orders (<AnimatedNumber value={deliveryOrdersTotal} /> total)
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            DELIVERY ORDER DETAIL MODAL
            ══════════════════════════════════════════════════════════════ */}
        {selectedDeliveryOrder && (
          <div
            className="sadg-order-modal-backdrop"
            onClick={() => setSelectedDeliveryOrder(null)}
          >
            <div
              className="sadg-order-modal-card sadg-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sadg-detail-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sadg-order-modal-header">
                <div>
                  <span className="sadg-detail-eyebrow"><Truck size={13} /> Bullion delivery</span>
                  <div id="sadg-detail-title" className="sadg-detail-title">
                    Order #{selectedDeliveryOrder.order_id || selectedDeliveryOrder.id}
                  </div>
                  <div className="sadg-detail-date">
                    Placed on {selectedDeliveryOrder.created_at || '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`sadg-order-status-badge ${(selectedDeliveryOrder.status || 'confirmed').toLowerCase()}`}>
                    {selectedDeliveryOrder.status || 'confirmed'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDeliveryOrder(null)}
                    className="sadg-detail-close"
                    aria-label="Close order details"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="sadg-order-modal-body">

                <div className={`sadg-detail-hero ${(selectedDeliveryOrder.metal || '').toLowerCase().includes('silver') ? 'silver' : 'gold'}`}>
                  <div className="sadg-detail-coin"><img src={(selectedDeliveryOrder.metal || '').toLowerCase().includes('silver') ? silverCoinImg : goldCoinImg} alt="" /></div>
                  <div className="sadg-detail-hero-copy">
                    <span>YOUR BULLION ORDER</span>
                    <h3>{(selectedDeliveryOrder.metal || '').toLowerCase().includes('silver') ? 'Pure 999 Silver' : '22K Digi Gold'}</h3>
                    <p><ShieldCheck size={14} /> {(selectedDeliveryOrder.metal || '').toLowerCase().includes('silver') ? '999 purity' : '916 purity'} <i /> Doorstep delivery</p>
                  </div>
                  <div className="sadg-detail-hero-amount"><small>Order valuation</small><strong><AnimatedNumber value={selectedDeliveryOrder.valuation_inr} prefix="₹ " decimals={2} /></strong><span><AnimatedNumber value={selectedDeliveryOrder.weight_gm} decimals={3} suffix=" g" /> of precious metal</span></div>
                </div>

                {/* Customer Info */}
                <div className="sadg-detail-section">
                  <div className="sadg-order-modal-section-title">
                    <Users size={14} /> Customer Details
                  </div>
                  <div className="sadg-order-info-box">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Name</div>
                        <div style={{ fontWeight: 700 }}>{selectedDeliveryOrder.customer_name || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Phone</div>
                        <div style={{ fontWeight: 700 }}>{selectedDeliveryOrder.customer_phone || '—'}</div>
                      </div>
                      {selectedDeliveryOrder.customer_email && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Email</div>
                          <div>{selectedDeliveryOrder.customer_email}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="sadg-detail-section">
                  <div className="sadg-order-modal-section-title">
                    <MapPin size={14} /> Delivery Address
                  </div>
                  <div className="sadg-order-info-box" style={{ lineHeight: 1.8 }}>
                    {(() => {
                      const addr = selectedDeliveryOrder.address
                      if (!addr) return selectedDeliveryOrder.delivery_address || '—'
                      if (typeof addr === 'string') return addr
                      if (addr.formatted) return addr.formatted
                      if (![addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country].some(Boolean)) {
                        return selectedDeliveryOrder.delivery_address || '—'
                      }
                      return (
                        <div>
                          {addr.line1 && <div>{addr.line1}</div>}
                          {addr.line2 && <div>{addr.line2}</div>}
                          {(addr.city || addr.state || addr.pincode) && (
                            <div>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</div>
                          )}
                          {addr.country && <div style={{ color: '#6A7D7C', fontSize: 12 }}>{addr.country}</div>}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Order Details */}
                <div className="sadg-detail-section sadg-detail-wide">
                  <div className="sadg-order-modal-section-title">
                    <Package size={14} /> Order Details
                  </div>
                  <div className="sadg-order-info-box">
                    <div className="sadg-detail-metrics">
                      <div>
                        <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Metal</div>
                        <div style={{ fontWeight: 700 }}>
                          {(() => {
                            const m = (selectedDeliveryOrder.metal || '').toLowerCase()
                            return m.includes('gold') ? '22K Digi Gold' : m.includes('silver') ? 'Pure 999 Silver' : selectedDeliveryOrder.metal || '—'
                          })()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Weight</div>
                        <div style={{ fontWeight: 700 }}><AnimatedNumber value={selectedDeliveryOrder.weight_gm} decimals={3} /> g</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Valuation</div>
                        <div style={{ fontWeight: 800, color: '#073E40', fontSize: 15 }}>
                          ₹ <AnimatedNumber value={selectedDeliveryOrder.valuation_inr} decimals={2} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Rate at Time</div>
                        <div style={{ fontWeight: 700 }}>
                          {(() => {
                            const storedRate = selectedDeliveryOrder.rate_at_order ?? selectedDeliveryOrder.unit_price
                            const rate = storedRate != null
                              ? Number(storedRate)
                              : (Number(selectedDeliveryOrder.weight_gm) > 0
                                ? Number(selectedDeliveryOrder.valuation_inr) / Number(selectedDeliveryOrder.weight_gm)
                                : null)
                            return Number.isFinite(rate) && rate > 0
                              ? `₹ ${rate.toLocaleString('en-IN', { maximumFractionDigits: 2 })} /g`
                              : '—'
                          })()}
                        </div>
                      </div>
                      {selectedDeliveryOrder.coin_type && (
                        <div>
                          <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Coin Type</div>
                          <div style={{ fontWeight: 700 }}>{selectedDeliveryOrder.coin_type}</div>
                        </div>
                      )}
                      {selectedDeliveryOrder.quantity && (
                        <div>
                          <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Quantity</div>
                          <div style={{ fontWeight: 700 }}><AnimatedNumber value={selectedDeliveryOrder.quantity} /> coins</div>
                        </div>
                      )}
                    </div>
                    {selectedDeliveryOrder.notes && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2ECE7' }}>
                        <div style={{ fontSize: 11, color: '#6A7D7C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Notes</div>
                        <div style={{ fontSize: 13, color: '#556B69', lineHeight: 1.5 }}>{selectedDeliveryOrder.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="sadg-detail-section sadg-detail-wide">
                  <div className="sadg-order-modal-section-title">
                    <Clock size={14} /> Order Timeline
                  </div>
                  {selectedDeliveryOrder.status === 'cancelled' && <div className="sadg-detail-cancelled"><AlertCircle size={16} /> This order has been cancelled.</div>}
                  <div className="sadg-detail-timeline">
                    {['confirmed', 'processing', 'shipped', 'delivered'].map((stage, idx) => {
                      const statusOrder = ['confirmed', 'processing', 'shipped', 'delivered']
                      const currentIdx = statusOrder.indexOf((selectedDeliveryOrder.status || 'confirmed').toLowerCase())
                      const isDone = idx <= currentIdx
                      const isActive = idx === currentIdx
                      const StageIcon = [CheckCircle2, Clock, Truck, Package][idx]
                      return (
                        <div key={stage} className={`sadg-detail-stage ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                          <span className="sadg-detail-stage-icon"><StageIcon size={19} /></span>
                          <strong>{stage.charAt(0).toUpperCase() + stage.slice(1)}</strong>
                          <small>{isActive ? 'Current status' : isDone ? 'Completed' : 'Upcoming'}</small>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer — Status Update */}
              <div className="sadg-order-modal-footer">
                <div className="sadg-detail-footer-heading"><strong>Update delivery status</strong><span>Select the next stage for this order</span></div>
                <div className="sadg-detail-status-actions">
                  {['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => {
                    const isCurrent = (selectedDeliveryOrder.status || '').toLowerCase() === s
                    const isUpdating = updatingOrderStatusId === (selectedDeliveryOrder.id || selectedDeliveryOrder.order_id)
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={isCurrent || isUpdating}
                        onClick={() => handleUpdateDeliveryStatus(selectedDeliveryOrder, s)}
                        className={`sadg-detail-status-btn ${isCurrent ? 'selected' : ''} ${s === 'cancelled' ? 'cancel' : ''}`}
                        aria-pressed={isCurrent}
                      >
                        {isCurrent && <Check size={13} />}{s}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
    </NumberLoadingContext.Provider>
  )
}
