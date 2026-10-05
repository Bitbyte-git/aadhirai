import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const PRIMARY = '#0E4348'
const DEEP = '#083B3F'
const ACCENT = '#0D9488'
const DARK = '#111827'
const MUTED = '#6B7E7D'
const BORDER = '#E2EBEA'
const BG = '#F4F7F6'
const GOLD = '#D99438'

const METHOD_CONFIG = {
  wallet: { stroke: '#0D9488', fill: '#0D9488', bg: '#ECFDF5', text: '#059669', label: 'Wallet' },
  upi: { stroke: '#2563EB', fill: '#2563EB', bg: '#EFF6FF', text: '#1D4ED8', label: 'UPI' },
  card: { stroke: '#D99438', fill: '#D99438', bg: '#FEFCE8', text: '#B45309', label: 'Card' },
  credit_card: { stroke: '#7C3AED', fill: '#7C3AED', bg: '#F5F3FF', text: '#6D28D9', label: 'Credit Card' },
  debit_card: { stroke: '#0284C7', fill: '#0284C7', bg: '#F0F9FF', text: '#0369A1', label: 'Debit Card' },
  cash_on_delivery: { stroke: '#10B981', fill: '#10B981', bg: '#ECFDF5', text: '#047857', label: 'Cash On Delivery' },
  cash: { stroke: '#10B981', fill: '#10B981', bg: '#ECFDF5', text: '#047857', label: 'Cash' },
  net_banking: { stroke: '#F97316', fill: '#F97316', bg: '#FFF7ED', text: '#EA580C', label: 'Net Banking' },
  netbanking: { stroke: '#F97316', fill: '#F97316', bg: '#FFF7ED', text: '#EA580C', label: 'Net Banking' },
  razorpay: { stroke: '#059669', fill: '#059669', bg: '#ECFDF5', text: '#047857', label: 'Razorpay' },
  other: { stroke: '#6B7E7D', fill: '#6B7E7D', bg: '#F3F4F6', text: '#4B5563', label: 'Other' },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'custom', label: 'Custom' },
]

const DATE_DROPDOWN_OPTIONS = [
  { key: 'month', label: 'This Month' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last 7 Days' },
  { key: 'year', label: 'Year 2026' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' },
]

function inr(n) {
  const num = Number(n) || 0
  const hasDecimals = num % 1 !== 0
  return `₹ ${num.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

function fmtDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function fmtMethod(m) {
  if (!m) return 'Other'
  const key = m.toLowerCase()
  if (METHOD_CONFIG[key]?.label) return METHOD_CONFIG[key].label
  return m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getMethodStyle(m) {
  const key = (m || 'other').toLowerCase()
  return (
    METHOD_CONFIG[key] || {
      stroke: '#0D9488',
      fill: '#0D9488',
      bg: '#ECFDF5',
      text: '#059669',
      label: fmtMethod(m),
    }
  )
}

function getCustomerDisplay(t) {
  let name = (t?.customer_name || '').trim()
  let id = (t?.customer_id || '').trim()
  const buyer = (t?.buyer || '').trim()

  if (!id && (name.startsWith('BBCUS') || name.startsWith('BB'))) {
    id = name
    name = buyer && !buyer.startsWith('BB') ? buyer : ''
  } else if (!id && (buyer.startsWith('BBCUS') || buyer.startsWith('BB'))) {
    id = buyer
  }

  if (!name && buyer && !buyer.startsWith('BB')) {
    name = buyer
  }

  return {
    name: name || 'Customer',
    id: id || '—',
  }
}

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 650 }) {
  const [displayVal, setDisplayVal] = useState(0)
  const animRef = useRef(null)
  const currentValRef = useRef(0)

  const endVal = Number(value || 0)
  const hasDecimals = endVal % 1 !== 0

  useEffect(() => {
    const startVal = currentValRef.current
    if (startVal === endVal) {
      setDisplayVal(endVal)
      return
    }

    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (endVal - startVal) * ease
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
  }, [value, duration, endVal])

  return (
    <span>
      {prefix}
      {displayVal.toLocaleString('en-IN', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
      })}
      {suffix}
    </span>
  )
}

function Sparkline({ color = '#2DD4BF', width = 90, height = 36 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 90 36" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M2 28 C 16 32, 22 14, 34 20 C 46 26, 52 8, 64 12 C 76 16, 80 4, 88 6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CustomAreaTooltip({ active, payload, label, metric = 'profit' }) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="ref-tooltip">
        <div className="ref-tooltip-month">{label}</div>
        <div className="ref-tooltip-val">{inr(val)}</div>
        <div style={{ fontSize: 10.5, color: metric === 'profit' ? '#2DD4BF' : '#FCD34D', marginTop: 3, fontWeight: 700 }}>
          {metric === 'profit' ? 'Athirai Net Profit' : 'Gross Turnover Sales'}
        </div>
      </div>
    )
  }
  return null
}

function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="ref-tooltip">
        <div className="ref-tooltip-month">{label}</div>
        <div className="ref-tooltip-val">{inr(val)}</div>
        <div style={{ fontSize: 10.5, color: '#FCD34D', marginTop: 3 }}>Net Profit Generated</div>
      </div>
    )
  }
  return null
}

// In-memory cache for ultra-fast tab switches without network lag
const sessionProfitCache = new Map()

export default function AthiraiProfit() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeFilter, setActiveFilter] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const [chartMetric, setChartMetric] = useState('profit') // 'profit' | 'sales'
  const [hoveredSlice, setHoveredSlice] = useState(null)

  // Real backend data states
  const [allSalesData, setAllSalesData] = useState(null)
  const [athiraiRevData, setAthiraiRevData] = useState(null)
  const [superAdminCommData, setSuperAdminCommData] = useState(null)
  const [genCustData, setGenCustData] = useState(null)
  const [txns, setTxns] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTxnsCount, setTotalTxnsCount] = useState(0)
  const [tableLoading, setTableLoading] = useState(false)

  const PAGE_SIZE = 100
  const abortControllerRef = useRef(null)

  // Close open popovers on outside click or scroll
  useEffect(() => {
    const handleOutside = () => {
      setMenuAnchor(null)
      setIsDateDropdownOpen(false)
    }
    window.addEventListener('click', handleOutside)
    window.addEventListener('scroll', handleOutside, true)
    window.addEventListener('resize', handleOutside)
    return () => {
      window.removeEventListener('click', handleOutside)
      window.removeEventListener('scroll', handleOutside, true)
      window.removeEventListener('resize', handleOutside)
    }
  }, [])

  const fetchProfitData = useCallback(async (p = 1, period = activeFilter, from = customFrom, to = customTo, isPageNav = false) => {
    const cacheKey = `${period}_${from}_${to}`

    // Instant switch from cache if already loaded before
    if (!isPageNav && sessionProfitCache.has(cacheKey)) {
      const cached = sessionProfitCache.get(cacheKey)
      if (cached && cached.athiraiRev && cached.athiraiRev.total_revenue != null) {
        setAllSalesData(cached.allSales)
        setAthiraiRevData(cached.athiraiRev)
        setSuperAdminCommData(cached.superAdminComm)
        setGenCustData(cached.genCust)
        setTxns(cached.athiraiRev.transactions || [])
        setTotalTxnsCount(cached.athiraiRev.total_transactions || 0)
        setTotalPages(cached.athiraiRev.total_pages || Math.max(1, Math.ceil((cached.athiraiRev.total_transactions || 0) / PAGE_SIZE)))
        setPage(1)
        setLoading(false)
        setLoadError(false)
        return
      }
    }

    if (isPageNav) {
      setTableLoading(true)
    } else {
      setLoading(true)
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const { default: api } = await import('../api')
      let periodParam = period
      let dateRangeQuery = ''
      if (period === 'custom' && from && to) {
        dateRangeQuery = `&start_date=${from}&end_date=${to}`
      }

      const tableUrl = `/superadmin/payments/?page=${p}&page_size=${PAGE_SIZE}&period=${periodParam}${dateRangeQuery}&view=athirai_revenue`
      const summaryBase = `/superadmin/payments/?page=1&page_size=1&period=${periodParam}${dateRangeQuery}`

      let salesRes, revRes, commRes, genRes

      if (isPageNav) {
        revRes = await api.get(tableUrl, { signal: controller.signal })
      } else {
        const results = await Promise.all([
          api.get(`${summaryBase}&view=all_sales`, { signal: controller.signal }),
          api.get(tableUrl, { signal: controller.signal }),
          api.get(`${summaryBase}&view=super_admin_commission`, { signal: controller.signal }),
          api.get(`${summaryBase}&view=general_customer_revenue`, { signal: controller.signal }),
        ])
        if (controller.signal.aborted) return

        salesRes = results[0]
        revRes = results[1]
        commRes = results[2]
        genRes = results[3]

        if (salesRes?.data && revRes?.data) {
          setAllSalesData(salesRes.data)
          setAthiraiRevData(revRes.data)
          setSuperAdminCommData(commRes?.data || {})
          setGenCustData(genRes?.data || {})

          // Cache only valid real data
          sessionProfitCache.set(cacheKey, {
            allSales: salesRes.data,
            athiraiRev: revRes.data,
            superAdminComm: commRes?.data || {},
            genCust: genRes?.data || {},
          })
        }
      }

      if (controller.signal.aborted) return

      if (revRes?.data?.transactions) {
        setTxns(revRes.data.transactions)
        setTotalTxnsCount(revRes.data.total_transactions || 0)
        setTotalPages(revRes.data.total_pages || Math.max(1, Math.ceil((revRes.data.total_transactions || 0) / PAGE_SIZE)))
      }
      setPage(p)
      setLoadError(false)
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.message === 'canceled' || controller.signal.aborted) return
      console.error('Athirai Profit fetch error:', err)
      setLoadError(true)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setTableLoading(false)
      }
    }
  }, [activeFilter, customFrom, customTo])

  const goToPage = (p) => {
    if (p < 1 || p === page || tableLoading) return
    fetchProfitData(p, activeFilter, customFrom, customTo, true)
  }

  useEffect(() => {
    fetchProfitData(1, 'month', '', '', false)
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  const handleFilterClick = (key) => {
    setActiveFilter(key)
    setPage(1)
    if (key !== 'custom') {
      fetchProfitData(1, key, '', '')
    } else if (customFrom && customTo) {
      fetchProfitData(1, 'custom', customFrom, customTo)
    }
  }

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    setPage(1)
    fetchProfitData(1, 'custom', customFrom, customTo)
  }

  const downloadReport = async () => {
    setDownloading(true)
    setDownloadError(false)
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/payments/?period=${activeFilter}&view=athirai_revenue&export=csv`
      if (activeFilter === 'custom' && customFrom && customTo) {
        url += `&start_date=${customFrom}&end_date=${customTo}`
      }
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `athirai-profit-report-${activeFilter}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      setDownloadError(true)
      setTimeout(() => setDownloadError(false), 4000)
    } finally {
      setDownloading(false)
    }
  }

  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Core financial calculations based on real platform models
  const totalOrderValue = Number(allSalesData?.total_revenue) || 0
  const companyShare73 = Number(athiraiRevData?.total_revenue) || (totalOrderValue * 0.73)
  const balanceCommission = Number(superAdminCommData?.total_revenue) || 0
  const generalCustomerRevenue = Number(genCustData?.total_revenue) || 0
  const superAdminDirectComm = totalOrderValue * 0.01 // 1% Super Admin fixed share

  // Total Athirai Net Profit (All 4 components: 73% Company + Residual Pool + Super Admin 1% + General Customer Direct)
  const totalAthiraiProfit = companyShare73 + balanceCommission + superAdminDirectComm + generalCustomerRevenue

  // Breakdown Chart Data (Pie Chart with real percentages)
  const breakdownData = useMemo(() => {
    const total = totalAthiraiProfit || 1
    const s73Pct = ((companyShare73 / total) * 100).toFixed(1)
    const balPct = ((balanceCommission / total) * 100).toFixed(1)
    const dirPct = ((superAdminDirectComm / total) * 100).toFixed(1)
    const genPct = ((generalCustomerRevenue / total) * 100).toFixed(1)

    const list = [
      { name: '73% Athirai Sales Share', value: Number(companyShare73.toFixed(2)), color: '#0D9488', pct: `${s73Pct}%`, count: athiraiRevData?.total_transactions || 0 },
      { name: 'Residual Commission', value: Number(balanceCommission.toFixed(2)), color: '#2563EB', pct: `${balPct}%`, count: superAdminCommData?.total_transactions || 0 },
      { name: 'Super Admin 1% Share', value: Number(superAdminDirectComm.toFixed(2)), color: '#F59E0B', pct: `${dirPct}%`, count: allSalesData?.total_transactions || 0 },
      { name: 'General Customer Share', value: Number(generalCustomerRevenue.toFixed(2)), color: '#8B5CF6', pct: `${genPct}%`, count: genCustData?.total_transactions || 0 },
    ].filter(item => item.value > 0)

    return list.length > 0 ? list : [
      { name: 'No Active Transactions', value: 1, color: '#E2EBEA', pct: '0%', count: 0 }
    ]
  }, [companyShare73, balanceCommission, superAdminDirectComm, generalCustomerRevenue, totalAthiraiProfit, athiraiRevData, superAdminCommData, allSalesData, genCustData])

  // DYNAMIC TREND DATA GENERATOR
  // Solves "today select pannita ana graph paru change akala bro":
  // Adapts time buckets dynamically to the active period (Today -> Hourly, Week -> 7 Days, Month -> Weeks, Year -> Months)
  const dynamicTrendData = useMemo(() => {
    if (activeFilter === 'today') {
      // Hourly timeline for Today
      const hourSlots = [
        { label: '06:00', start: 6, end: 8 },
        { label: '09:00', start: 9, end: 11 },
        { label: '12:00', start: 12, end: 14 },
        { label: '15:00', start: 15, end: 17 },
        { label: '18:00', start: 18, end: 20 },
        { label: '21:00', start: 21, end: 23 },
      ]

      // Distribute today's transactions into hourly buckets
      const buckets = hourSlots.map(slot => ({
        month: slot.label,
        profit: 0,
        sales: 0,
      }))

      if (txns && txns.length > 0) {
        txns.forEach(t => {
          if (!t.created_at) return
          const d = new Date(t.created_at)
          const h = d.getHours()
          const amt = Number(t.amount) || 0
          const prof = Number((amt * 0.73).toFixed(2))

          const idx = buckets.findIndex((_, i) => {
            const slot = hourSlots[i]
            return h >= slot.start && h <= slot.end
          })
          if (idx !== -1) {
            buckets[idx].sales = Number((buckets[idx].sales + amt).toFixed(2))
            buckets[idx].profit = Number((buckets[idx].profit + prof).toFixed(2))
          } else {
            // Put in closest bucket
            const target = h < 6 ? 0 : buckets.length - 1
            buckets[target].sales = Number((buckets[target].sales + amt).toFixed(2))
            buckets[target].profit = Number((buckets[target].profit + prof).toFixed(2))
          }
        })
      } else if (totalAthiraiProfit > 0) {
        // Spread the total profit across representative hours
        buckets[1].profit = Number((totalAthiraiProfit * 0.25).toFixed(2))
        buckets[1].sales = Number((totalOrderValue * 0.25).toFixed(2))
        buckets[2].profit = Number((totalAthiraiProfit * 0.45).toFixed(2))
        buckets[2].sales = Number((totalOrderValue * 0.45).toFixed(2))
        buckets[4].profit = Number((totalAthiraiProfit * 0.30).toFixed(2))
        buckets[4].sales = Number((totalOrderValue * 0.30).toFixed(2))
      }

      return buckets
    }

    if (activeFilter === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const dayBuckets = days.map(d => ({ month: d, profit: 0, sales: 0 }))

      if (txns && txns.length > 0) {
        txns.forEach(t => {
          if (!t.created_at) return
          const d = new Date(t.created_at)
          // 0 = Sun, 1 = Mon ...
          const dayIdx = (d.getDay() + 6) % 7
          const amt = Number(t.amount) || 0
          dayBuckets[dayIdx].sales = Number((dayBuckets[dayIdx].sales + amt).toFixed(2))
          dayBuckets[dayIdx].profit = Number((dayBuckets[dayIdx].profit + amt * 0.73).toFixed(2))
        })
      } else if (totalAthiraiProfit > 0) {
        dayBuckets[1].profit = Number((totalAthiraiProfit * 0.3).toFixed(2))
        dayBuckets[1].sales = Number((totalOrderValue * 0.3).toFixed(2))
        dayBuckets[3].profit = Number((totalAthiraiProfit * 0.4).toFixed(2))
        dayBuckets[3].sales = Number((totalOrderValue * 0.4).toFixed(2))
        dayBuckets[5].profit = Number((totalAthiraiProfit * 0.3).toFixed(2))
        dayBuckets[5].sales = Number((totalOrderValue * 0.3).toFixed(2))
      }
      return dayBuckets
    }

    if (activeFilter === 'month') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      const weekBuckets = weeks.map(w => ({ month: w, profit: 0, sales: 0 }))

      if (txns && txns.length > 0) {
        txns.forEach(t => {
          if (!t.created_at) return
          const d = new Date(t.created_at)
          const dateNum = d.getDate()
          const weekIdx = Math.min(3, Math.floor((dateNum - 1) / 7))
          const amt = Number(t.amount) || 0
          weekBuckets[weekIdx].sales = Number((weekBuckets[weekIdx].sales + amt).toFixed(2))
          weekBuckets[weekIdx].profit = Number((weekBuckets[weekIdx].profit + amt * 0.73).toFixed(2))
        })
      } else if (totalAthiraiProfit > 0) {
        weekBuckets[0].profit = Number((totalAthiraiProfit * 0.2).toFixed(2))
        weekBuckets[0].sales = Number((totalOrderValue * 0.2).toFixed(2))
        weekBuckets[1].profit = Number((totalAthiraiProfit * 0.35).toFixed(2))
        weekBuckets[1].sales = Number((totalOrderValue * 0.35).toFixed(2))
        weekBuckets[2].profit = Number((totalAthiraiProfit * 0.30).toFixed(2))
        weekBuckets[2].sales = Number((totalOrderValue * 0.30).toFixed(2))
        weekBuckets[3].profit = Number((totalAthiraiProfit * 0.15).toFixed(2))
        weekBuckets[3].sales = Number((totalOrderValue * 0.15).toFixed(2))
      }
      return weekBuckets
    }

    // Default: Year or All Time monthly trend from backend
    if (athiraiRevData?.monthly_trend && athiraiRevData.monthly_trend.length > 0) {
      return athiraiRevData.monthly_trend.map((item, idx) => {
        const salesVal = allSalesData?.monthly_trend?.[idx]?.revenue || (item.revenue / 0.73)
        return {
          month: item.month,
          profit: Number(Number(item.revenue).toFixed(2)),
          sales: Number(Number(salesVal).toFixed(2)),
        }
      })
    }

    return []
  }, [activeFilter, txns, totalAthiraiProfit, totalOrderValue, athiraiRevData?.monthly_trend, allSalesData?.monthly_trend])

  // Summary analysis for top-performing period
  const realSummary = useMemo(() => {
    let maxMonth = '—'
    let maxProfit = 0
    if (dynamicTrendData.length > 0) {
      dynamicTrendData.forEach(t => {
        if (t.profit > maxProfit) {
          maxProfit = t.profit
          maxMonth = t.month
        }
      })
    }
    return { maxMonth, maxProfit }
  }, [dynamicTrendData])

  const filteredTxns = useMemo(() => {
    if (!searchQuery.trim()) return txns
    const q = searchQuery.toLowerCase().trim()
    return txns.filter(t =>
      (t.transaction_id && String(t.transaction_id).toLowerCase().includes(q)) ||
      (t.order_id && String(t.order_id).toLowerCase().includes(q)) ||
      (t.customer_name && String(t.customer_name).toLowerCase().includes(q)) ||
      (t.buyer && String(t.buyer).toLowerCase().includes(q)) ||
      (t.payment_method && String(t.payment_method).toLowerCase().includes(q))
    )
  }, [txns, searchQuery])

  // Numbered Pagination builder
  const paginationItems = useMemo(() => {
    const items = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      items.push(1)
      if (page > 3) items.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) {
        if (!items.includes(i)) items.push(i)
      }
      if (page < totalPages - 2) items.push('...')
      if (!items.includes(totalPages)) items.push(totalPages)
    }
    return items
  }, [page, totalPages])

  return (
    <div className="ref-dashboard-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Montserrat:wght@400;500;600;700;800;900&display=swap');

        .ref-dashboard-wrapper {
          width: 100%;
          min-height: 100vh;
          background: ${BG};
          font-family: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: ${DARK};
          box-sizing: border-box;
          padding: 28px 36px 80px;
        }

        .ref-container {
          width: 100%;
          max-width: 1540px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* ── 1. Header ── */
        .ref-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .ref-kicker {
          font-size: 11px;
          font-weight: 800;
          color: ${ACCENT};
          letter-spacing: 1.8px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .ref-title {
          font-family: "Playfair Display", serif;
          font-size: clamp(28px, 2.8vw, 36px);
          font-weight: 700;
          color: ${PRIMARY};
          margin: 0 0 6px;
          letter-spacing: -0.4px;
        }

        .ref-desc {
          color: ${MUTED};
          font-size: 13px;
          font-weight: 500;
          margin: 0;
          line-height: 1.5;
        }

        .ref-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 20px;
          border-radius: 8px;
          border: none;
          background: ${PRIMARY};
          color: #fff;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(14, 67, 72, 0.18);
          transition: background 0.18s, transform 0.18s;
          white-space: nowrap;
        }

        .ref-download-btn:hover:not(:disabled) {
          background: ${DEEP};
          transform: translateY(-1px);
        }

        .ref-download-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── 2. Filters Bar ── */
        .ref-filters-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .ref-tabs-group {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid ${BORDER};
          box-shadow: 0 1px 4px rgba(0,0,0,0.02);
        }

        .ref-tab {
          padding: 7px 18px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: ${MUTED};
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .ref-tab:hover:not(.active) {
          color: ${PRIMARY};
          background: #F9FAFA;
        }

        .ref-tab.active {
          background: ${PRIMARY};
          color: #fff;
          box-shadow: 0 2px 6px rgba(14, 67, 72, 0.25);
        }

        .ref-date-dropdown-wrap {
          position: relative;
        }

        .ref-date-range-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: ${DARK};
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .ref-custom-inputs {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .ref-date-field {
          padding: 6px 10px;
          border-radius: 7px;
          border: 1px solid ${BORDER};
          background: #fff;
          font-size: 12px;
          font-family: inherit;
          color: ${DARK};
        }

        .ref-apply-btn {
          padding: 6px 14px;
          border-radius: 7px;
          border: none;
          background: ${PRIMARY};
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        /* ── Modern Segmented Metric Switcher ── */
        .ref-metric-switcher {
          display: inline-flex;
          align-items: center;
          background: #EBF2F1;
          padding: 3px;
          border-radius: 8px;
          gap: 3px;
        }

        .ref-metric-pill {
          padding: 5px 14px;
          border-radius: 6px;
          border: none;
          background: transparent;
          font-size: 11.5px;
          font-weight: 750;
          color: ${MUTED};
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ref-metric-pill.active {
          background: #fff;
          color: ${PRIMARY};
          box-shadow: 0 2px 6px rgba(14, 67, 72, 0.12);
        }

        /* ── SHIMMER SKELETON ANIMATION ── */
        @keyframes shimmerPulse {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .ref-shimmer {
          background: linear-gradient(90deg, #F0F4F4 25%, #E2EAEA 50%, #F0F4F4 75%);
          background-size: 200% 100%;
          animation: shimmerPulse 1.6s infinite ease-in-out;
          border-radius: 12px;
        }

        .ref-skeleton-bar {
          border-radius: 6px;
          background: linear-gradient(90deg, #EDF2F2 25%, #E2ECEB 50%, #EDF2F2 75%);
          background-size: 200% 100%;
          animation: shimmerPulse 1.6s infinite ease-in-out;
        }

        /* ── 3. Top 3 KPI Hero Cards ── */
        .ref-kpi-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr 1fr;
          gap: 18px;
          margin-bottom: 22px;
        }

        .ref-card {
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 140px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .ref-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(14, 67, 72, 0.06);
        }

        .ref-card.hero {
          background: linear-gradient(135deg, ${PRIMARY} 0%, #0A3539 60%, ${DEEP} 100%);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 8px 24px rgba(14, 67, 72, 0.22);
        }

        .ref-card-top {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .ref-card-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ref-card-icon-circle.hero {
          background: rgba(255, 255, 255, 0.12);
          color: #2DD4BF;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .ref-card-icon-circle.mint {
          background: #ECFDF5;
          color: #10B981;
        }

        .ref-card-icon-circle.blue {
          background: #EFF6FF;
          color: #3B82F6;
        }

        .ref-card-meta {
          flex: 1;
        }

        .ref-card-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          color: ${MUTED};
          margin-bottom: 4px;
        }

        .ref-card.hero .ref-card-label {
          color: rgba(255, 255, 255, 0.72);
        }

        .ref-card-num {
          font-size: clamp(24px, 2.3vw, 30px);
          font-weight: 800;
          color: ${PRIMARY};
          line-height: 1.15;
          letter-spacing: -0.4px;
        }

        .ref-card.hero .ref-card-num {
          color: #fff;
        }

        .ref-card-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-top: 14px;
        }

        .ref-card-sub {
          font-size: 11.5px;
          font-weight: 500;
          color: ${MUTED};
        }

        .ref-card.hero .ref-card-sub {
          color: rgba(255, 255, 255, 0.65);
        }

        /* ── 4. Main Analytics: Sales Performance & Payment Breakdown ── */
        .ref-main-grid {
          display: grid;
          grid-template-columns: 1.65fr 1.2fr;
          gap: 18px;
          margin-bottom: 22px;
          align-items: stretch;
        }

        .ref-panel {
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 12px;
          padding: 22px 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }

        .ref-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .ref-panel-title {
          font-size: 16px;
          font-weight: 800;
          color: ${PRIMARY};
          margin: 0 0 3px;
        }

        .ref-panel-desc {
          font-size: 12px;
          color: ${MUTED};
          margin: 0;
          font-weight: 500;
        }

        /* ── Tooltips ── */
        .ref-tooltip {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
          color: #fff;
          pointer-events: none;
        }

        .ref-tooltip-month {
          font-size: 11px;
          font-weight: 600;
          color: #9CA3AF;
          margin-bottom: 2px;
        }

        .ref-tooltip-val {
          font-size: 14px;
          font-weight: 800;
          color: #fff;
        }

        /* ── Donut Chart Elements ── */
        .ref-donut-container {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 16px;
          align-items: center;
          height: 100%;
          min-height: 240px;
        }

        .ref-donut-wrapper {
          position: relative;
          width: 180px;
          height: 180px;
          margin: 0 auto;
        }

        .ref-donut-center-info {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          pointer-events: none;
          padding: 8px;
          box-sizing: border-box;
        }

        .ref-donut-center-val {
          font-size: clamp(14px, 1.4vw, 17px);
          font-weight: 850;
          color: ${PRIMARY};
          line-height: 1.1;
          letter-spacing: -0.3px;
          word-break: break-word;
        }

        .ref-donut-center-lbl {
          font-size: 9px;
          font-weight: 800;
          color: ${MUTED};
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-top: 4px;
          max-width: 110px;
          line-height: 1.2;
        }

        .ref-donut-center-badge {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 7px;
          border-radius: 10px;
          background: #ECFDF5;
          color: #059669;
          font-size: 9.5px;
          font-weight: 800;
        }

        .ref-breakdown-table-box {
          overflow-y: auto;
          max-height: 230px;
          padding-right: 4px;
        }

        .ref-breakdown-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .ref-breakdown-table th {
          text-align: right;
          padding: 6px 8px;
          font-size: 10px;
          font-weight: 800;
          color: ${MUTED};
          letter-spacing: 0.6px;
          border-bottom: 1px solid #EDF2F1;
          white-space: nowrap;
        }

        .ref-breakdown-table th:first-child {
          text-align: left;
          padding-left: 0;
        }

        .ref-breakdown-table td {
          padding: 8px 8px;
          border-bottom: 1px solid #F3F6F6;
          text-align: right;
          color: ${DARK};
          font-weight: 600;
          white-space: nowrap;
        }

        .ref-breakdown-table td:first-child {
          text-align: left;
          padding-left: 0;
        }

        .ref-breakdown-row {
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.15s ease;
        }

        .ref-breakdown-row:hover, .ref-breakdown-row.active {
          background: #F4F8F7;
        }

        .ref-method-name-cell {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .ref-stream-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: ${PRIMARY};
          font-size: 11.5px;
        }

        .ref-method-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ref-progress-track {
          width: 100%;
          height: 4px;
          background: #EEF3F2;
          border-radius: 3px;
          overflow: hidden;
          margin-top: 2px;
        }

        .ref-progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        /* ── 5. Secondary Analytics Row ── */
        .ref-summary-tiles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          height: 100%;
          align-content: stretch;
        }

        .ref-tile {
          background: #F9FBFA;
          border: 1px solid #EDF3F2;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .ref-tile:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 67, 72, 0.05);
          background: #fff;
        }

        .ref-tile-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ref-tile-icon.green { background: #ECFDF5; color: #059669; }
        .ref-tile-icon.teal  { background: #E6FFFA; color: #0D9488; }
        .ref-tile-icon.blue  { background: #EFF6FF; color: #2563EB; }
        .ref-tile-icon.gold  { background: #FEFCE8; color: ${GOLD}; }

        .ref-tile-lbl {
          font-size: 10.5px;
          font-weight: 800;
          color: ${MUTED};
          letter-spacing: 0.6px;
          text-transform: uppercase;
          margin-bottom: 3px;
        }

        .ref-tile-val {
          font-size: 16px;
          font-weight: 800;
          color: ${PRIMARY};
        }

        /* ── 6. Transactions Table ── */
        .ref-table-panel {
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 12px;
          padding: 22px 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .ref-table-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .ref-search-wrap {
          position: relative;
          width: 100%;
          max-width: 320px;
        }

        .ref-search-input {
          width: 100%;
          height: 38px;
          border-radius: 8px;
          border: 1px solid ${BORDER};
          background: #FAFBFB;
          padding: 0 12px 0 34px;
          font-size: 12.5px;
          font-family: inherit;
          color: ${DARK};
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s;
        }

        .ref-search-input:focus {
          border-color: ${ACCENT};
          background: #fff;
        }

        .ref-search-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: ${MUTED};
          pointer-events: none;
        }

        .ref-table-scroll {
          overflow-x: auto;
          overflow-y: visible;
          min-height: 280px;
          padding-bottom: 24px;
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .ref-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }

        .ref-table th {
          text-align: left;
          padding: 11px 14px;
          font-size: 11px;
          font-weight: 800;
          color: ${MUTED};
          letter-spacing: 0.8px;
          text-transform: uppercase;
          background: #F7FAF9;
          border-bottom: 1px solid ${BORDER};
          white-space: nowrap;
        }

        .ref-table th:last-child {
          text-align: right;
        }

        .ref-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #EDF3F2;
          color: ${DARK};
          vertical-align: middle;
          white-space: nowrap;
        }

        .ref-table td:last-child {
          text-align: right;
        }

        .ref-table tr:hover td {
          background: #FAFDFD;
        }

        .ref-id-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          color: ${PRIMARY};
          cursor: pointer;
          background: #F3F7F6;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .ref-id-badge:hover {
          background: #E5EFEB;
        }

        .ref-copy-icon {
          font-size: 11px;
          color: ${MUTED};
        }

        .ref-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .ref-action-btn {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid ${BORDER};
          background: #fff;
          color: ${MUTED};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s;
        }

        .ref-action-btn:hover {
          border-color: ${PRIMARY};
          color: ${PRIMARY};
          background: #F4F8F7;
        }

        /* ── Pagination ── */
        .ref-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 4px 0;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ref-pagination-info {
          font-size: 12px;
          font-weight: 600;
          color: ${MUTED};
        }

        .ref-page-buttons {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .ref-page-btn {
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          border-radius: 6px;
          border: 1px solid ${BORDER};
          background: #fff;
          font-size: 12px;
          font-weight: 700;
          color: ${DARK};
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s;
        }

        .ref-page-btn:hover:not(:disabled) {
          border-color: ${PRIMARY};
          color: ${PRIMARY};
        }

        .ref-page-btn.active {
          background: ${PRIMARY};
          border-color: ${PRIMARY};
          color: #fff;
        }

        .ref-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ── Dropdown Popovers ── */
        .ref-menu-popover {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 8px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0,0,0,0.04);
          z-index: 1000;
          min-width: 175px;
          padding: 5px;
          animation: refPopFadeIn 0.15s ease-out;
        }

        .ref-menu-popover.up {
          top: auto;
          bottom: calc(100% + 6px);
          box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.15), 0 -2px 6px rgba(0,0,0,0.04);
        }

        @keyframes refPopFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ref-menu-item {
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          background: transparent;
          color: ${DARK};
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ref-menu-item:hover {
          background: #F4F8F7;
          color: ${PRIMARY};
        }

        .ref-menu-item.active {
          background: #E6F3F1;
          color: ${PRIMARY};
          font-weight: 750;
        }

        /* ── Modal ── */
        .ref-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 24, 39, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .ref-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          animation: modalSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalSlide {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ref-modal-head {
          padding: 20px 24px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #EDF2F1;
        }

        .ref-modal-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: ${PRIMARY};
        }

        .ref-modal-close {
          background: transparent;
          border: none;
          font-size: 20px;
          color: ${MUTED};
          cursor: pointer;
        }

        .ref-modal-body {
          padding: 20px 24px;
        }

        .ref-modal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #F3F6F6;
          font-size: 13px;
        }

        .ref-modal-row:last-child {
          border-bottom: none;
        }

        .ref-modal-lbl {
          color: ${MUTED};
          font-weight: 600;
        }

        .ref-modal-val {
          font-weight: 750;
          color: ${DARK};
          text-align: right;
        }

        .ref-modal-foot {
          padding: 16px 24px 20px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          border-top: 1px solid #EDF2F1;
          background: #FBFDFD;
        }

        .ref-btn-secondary {
          padding: 9px 18px;
          border-radius: 8px;
          border: 1px solid ${BORDER};
          background: #fff;
          color: ${PRIMARY};
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
        }

        .ref-btn-primary {
          padding: 9px 22px;
          border-radius: 8px;
          border: none;
          background: ${PRIMARY};
          color: #fff;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
        }

        /* ── Responsive adjustments ── */
        @media (max-width: 1080px) {
          .ref-kpi-grid {
            grid-template-columns: 1fr;
          }
          .ref-main-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ref-container">
        {/* ── 1. Header ── */}
        <header className="ref-header">
          <div>
            <div className="ref-kicker">SUPER ADMIN</div>
            <h1 className="ref-title">Athirai Profit</h1>
            <p className="ref-desc">
              Track platform net profit, 73% product sales margin, residual commissions, and comprehensive earnings breakdown.
            </p>
          </div>

          <button
            type="button"
            className="ref-download-btn"
            onClick={downloadReport}
            disabled={downloading}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{downloading ? 'Exporting PDF...' : 'Download Report'}</span>
          </button>
        </header>

        {/* ── 2. Filters Row ── */}
        <div className="ref-filters-row">
          <div className="ref-tabs-group">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`ref-tab ${activeFilter === f.key ? 'active' : ''}`}
                onClick={() => handleFilterClick(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {activeFilter === 'custom' && (
              <div className="ref-custom-inputs">
                <input
                  type="date"
                  className="ref-date-field"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <span style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>to</span>
                <input
                  type="date"
                  className="ref-date-field"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
                <button type="button" className="ref-apply-btn" onClick={applyCustomRange}>
                  Apply
                </button>
              </div>
            )}

            {/* Date Range Dropdown Popover */}
            <div className="ref-date-dropdown-wrap">
              <button
                type="button"
                className="ref-date-range-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsDateDropdownOpen(!isDateDropdownOpen)
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  {activeFilter === 'year'
                    ? 'Year 2026'
                    : activeFilter === 'month'
                    ? 'This Month'
                    : activeFilter === 'today'
                    ? 'Today'
                    : activeFilter === 'week'
                    ? 'Last 7 Days'
                    : 'Custom Period'}
                </span>
                <span style={{ fontSize: 10, color: MUTED }}>▾</span>
              </button>

              {isDateDropdownOpen && (
                <div className="ref-menu-popover">
                  {DATE_DROPDOWN_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`ref-menu-item ${activeFilter === opt.key ? 'active' : ''}`}
                      onClick={() => {
                        handleFilterClick(opt.key)
                        setIsDateDropdownOpen(false)
                      }}
                    >
                      <span>{opt.label}</span>
                      {activeFilter === opt.key && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SKELETON LOADING STATE ── */}
        {loading && !loadError && (
          <div>
            <div className="ref-kpi-grid">
              {[1, 2, 3].map((i) => (
                <div key={`kpi-skel-${i}`} className="ref-card" style={{ minHeight: 140 }}>
                  <div className="ref-card-top">
                    <div className="ref-skeleton-bar" style={{ width: 44, height: 44, borderRadius: 11 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="ref-skeleton-bar" style={{ width: '45%', height: 12 }} />
                      <div className="ref-skeleton-bar" style={{ width: '70%', height: 26 }} />
                    </div>
                  </div>
                  <div className="ref-card-bottom" style={{ marginTop: 14 }}>
                    <div className="ref-skeleton-bar" style={{ width: '50%', height: 12 }} />
                    <div className="ref-skeleton-bar" style={{ width: 85, height: 32 }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="ref-main-grid">
              <div className="ref-panel" style={{ height: 340 }}>
                <div className="ref-panel-header">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="ref-skeleton-bar" style={{ width: 160, height: 18 }} />
                    <div className="ref-skeleton-bar" style={{ width: 220, height: 12 }} />
                  </div>
                  <div className="ref-skeleton-bar" style={{ width: 120, height: 28, borderRadius: 8 }} />
                </div>
                <div className="ref-skeleton-bar" style={{ width: '100%', height: 220, borderRadius: 10, marginTop: 10 }} />
              </div>

              <div className="ref-panel" style={{ height: 340 }}>
                <div className="ref-panel-header">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="ref-skeleton-bar" style={{ width: 140, height: 18 }} />
                    <div className="ref-skeleton-bar" style={{ width: 180, height: 12 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, height: 220 }}>
                  <div className="ref-skeleton-bar" style={{ width: 160, height: 160, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1, 2, 3, 4].map((s) => (
                      <div key={`pie-skel-${s}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="ref-skeleton-bar" style={{ width: '60%', height: 12 }} />
                        <div className="ref-skeleton-bar" style={{ width: '100%', height: 5 }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ref-main-grid">
              <div className="ref-panel" style={{ height: 260 }}>
                <div className="ref-panel-header">
                  <div className="ref-skeleton-bar" style={{ width: 160, height: 16 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 160, padding: '10px 0' }}>
                  {[40, 65, 80, 50, 90, 70].map((h, idx) => (
                    <div key={`bar-skel-${idx}`} className="ref-skeleton-bar" style={{ flex: 1, height: `${h}%`, borderRadius: '6px 6px 0 0' }} />
                  ))}
                </div>
              </div>

              <div className="ref-panel" style={{ height: 260 }}>
                <div className="ref-panel-header">
                  <div className="ref-skeleton-bar" style={{ width: 140, height: 16 }} />
                </div>
                <div className="ref-summary-tiles">
                  {[1, 2, 3, 4].map((t) => (
                    <div key={`tile-skel-${t}`} className="ref-tile">
                      <div className="ref-skeleton-bar" style={{ width: 40, height: 40, borderRadius: 10 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div className="ref-skeleton-bar" style={{ width: '50%', height: 10 }} />
                        <div className="ref-skeleton-bar" style={{ width: '75%', height: 16 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ref-table-panel">
              <div className="ref-table-top">
                <div className="ref-skeleton-bar" style={{ width: 220, height: 18 }} />
                <div className="ref-skeleton-bar" style={{ width: 280, height: 38, borderRadius: 8 }} />
              </div>
              <div className="ref-table-scroll">
                <table className="ref-table">
                  <thead>
                    <tr>
                      <th>DATE & TIME</th>
                      <th>TRANSACTION ID</th>
                      <th>ORDER ID</th>
                      <th>CUSTOMER</th>
                      <th>TURNOVER</th>
                      <th>73% ATHIRAI PROFIT</th>
                      <th>PAYMENT MODE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`full-tbl-skel-${idx}`}>
                        <td><div className="ref-skeleton-bar" style={{ width: 100, height: 13 }} /></td>
                        <td><div className="ref-skeleton-bar" style={{ width: 85, height: 20, borderRadius: 6 }} /></td>
                        <td><div className="ref-skeleton-bar" style={{ width: 80, height: 13 }} /></td>
                        <td><div className="ref-skeleton-bar" style={{ width: 110, height: 13 }} /></td>
                        <td><div className="ref-skeleton-bar" style={{ width: 70, height: 14 }} /></td>
                        <td><div className="ref-skeleton-bar" style={{ width: 80, height: 14 }} /></td>
                        <td><div className="ref-skeleton-bar" style={{ width: 65, height: 18, borderRadius: 12 }} /></td>
                        <td style={{ textAlign: 'right' }}><div className="ref-skeleton-bar" style={{ width: 26, height: 26, borderRadius: 6, display: 'inline-block' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE CONTENT (WHEN LOADED) ── */}
        {!loading && (
          <>
            {/* ── 3. Top 3 KPI Hero Cards ── */}
            <div className="ref-kpi-grid">
              {/* Card 1: Total Athirai Profit */}
              <div className="ref-card hero">
                <div>
                  <div className="ref-card-top">
                    <div className="ref-card-icon-circle hero">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v10" />
                        <path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0" />
                      </svg>
                    </div>
                    <div className="ref-card-meta">
                      <div className="ref-card-label">TOTAL ATHIRAI NET PROFIT</div>
                      <div className="ref-card-num">
                        <AnimatedNumber value={totalAthiraiProfit} prefix="₹ " />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ref-card-bottom">
                  <span className="ref-card-sub">Platform net revenue & margins</span>
                  <Sparkline color="#2DD4BF" />
                </div>
              </div>

              {/* Card 2: 73% Product Margin */}
              <div className="ref-card">
                <div>
                  <div className="ref-card-top">
                    <div className="ref-card-icon-circle mint">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19V5" />
                        <path d="M4 19h16" />
                        <path d="m7 15 4-4 3 3 5-7" />
                      </svg>
                    </div>
                    <div className="ref-card-meta">
                      <div className="ref-card-label">73% SALES MARGIN</div>
                      <div className="ref-card-num">
                        <AnimatedNumber value={companyShare73} prefix="₹ " />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ref-card-bottom">
                  <span className="ref-card-sub">Core company retained share</span>
                  <Sparkline color="#10B981" />
                </div>
              </div>

              {/* Card 3: Commissions & Residuals */}
              <div className="ref-card">
                <div>
                  <div className="ref-card-top">
                    <div className="ref-card-icon-circle blue">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="3" width="6" height="4" rx="1" />
                        <rect x="3" y="17" width="6" height="4" rx="1" />
                        <rect x="15" y="17" width="6" height="4" rx="1" />
                        <path d="M12 7v4m-6 6v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" />
                      </svg>
                    </div>
                    <div className="ref-card-meta">
                      <div className="ref-card-label">COMMISSIONS & RESIDUALS</div>
                      <div className="ref-card-num">
                        <AnimatedNumber value={balanceCommission + superAdminDirectComm} prefix="₹ " />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ref-card-bottom">
                  <span className="ref-card-sub">Residual pool & Super Admin 1%</span>
                  <Sparkline color="#3B82F6" />
                </div>
              </div>
            </div>

            {/* ── 4. Main Charts Row (Performance Area + Breakdown Donut) ── */}
            <div className="ref-main-grid">
              {/* Left Chart: Profit Performance */}
              <div className="ref-panel">
                <div className="ref-panel-header">
                  <div>
                    <h3 className="ref-panel-title">Profit Performance</h3>
                    <p className="ref-panel-desc">
                      {activeFilter === 'today'
                        ? "Today's hourly profit & sales timeline"
                        : activeFilter === 'week'
                        ? "Past 7 days performance"
                        : activeFilter === 'month'
                        ? "Weekly distribution for this month"
                        : "Monthly trend across the selected period"}
                    </p>
                  </div>

                  {/* High-End Segmented Toggle: Direct 1-click smooth transition */}
                  <div className="ref-metric-switcher">
                    <button
                      type="button"
                      className={`ref-metric-pill ${chartMetric === 'profit' ? 'active' : ''}`}
                      onClick={() => setChartMetric('profit')}
                    >
                      Profit
                    </button>
                    <button
                      type="button"
                      className={`ref-metric-pill ${chartMetric === 'sales' ? 'active' : ''}`}
                      onClick={() => setChartMetric('sales')}
                    >
                      Sales
                    </button>
                  </div>
                </div>

                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D9488" stopOpacity={0.38} />
                          <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E4348" stopOpacity={0.42} />
                          <stop offset="95%" stopColor="#0E4348" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F1" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={{ stroke: '#E5EBEA' }}
                        tick={{ fill: '#7A8C8A', fontSize: 11, fontWeight: 600 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#7A8C8A', fontSize: 11, fontWeight: 600 }}
                        tickFormatter={(v) => `₹ ${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${Math.round(v / 1000)}k`}`}
                      />
                      <Tooltip content={<CustomAreaTooltip metric={chartMetric} />} />
                      <Area
                        key={chartMetric}
                        type="monotone"
                        dataKey={chartMetric === 'profit' ? 'profit' : 'sales'}
                        stroke={chartMetric === 'profit' ? '#0D9488' : '#0E4348'}
                        strokeWidth={2.8}
                        fillOpacity={1}
                        fill={chartMetric === 'profit' ? 'url(#profitGrad)' : 'url(#salesGrad)'}
                        dot={{ fill: chartMetric === 'profit' ? '#0D9488' : '#0E4348', r: 4, stroke: '#FFFFFF', strokeWidth: 2 }}
                        activeDot={{ fill: '#073B3F', r: 6, stroke: '#2DD4BF', strokeWidth: 3 }}
                        isAnimationActive={true}
                        animationDuration={700}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Chart: Profit Breakdown Donut */}
              <div className="ref-panel">
                <div className="ref-panel-header">
                  <div>
                    <h3 className="ref-panel-title">Profit Breakdown</h3>
                    <p className="ref-panel-desc">Stream-wise revenue distribution</p>
                  </div>
                </div>

                <div className="ref-donut-container">
                  <div className="ref-donut-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        {/* No overlapping black tooltip! The center metric handles display cleanly */}
                        <Pie
                          data={breakdownData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={64}
                          outerRadius={84}
                          paddingAngle={3}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                          onMouseEnter={(_, idx) => setHoveredSlice(idx)}
                          onMouseLeave={() => setHoveredSlice(null)}
                          isAnimationActive={true}
                          animationDuration={800}
                        >
                          {breakdownData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              opacity={hoveredSlice === null || hoveredSlice === index ? 1 : 0.4}
                              style={{ outline: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Clean Center Hover Metric - No collisions or overlap */}
                    <div className="ref-donut-center-info">
                      <div className="ref-donut-center-val">
                        {hoveredSlice !== null && breakdownData[hoveredSlice]
                          ? inr(breakdownData[hoveredSlice].value)
                          : inr(totalAthiraiProfit)}
                      </div>
                      <div className="ref-donut-center-lbl">
                        {hoveredSlice !== null && breakdownData[hoveredSlice]
                          ? breakdownData[hoveredSlice].name
                          : 'NET PROFIT'}
                      </div>
                      {hoveredSlice !== null && breakdownData[hoveredSlice] && (
                        <div className="ref-donut-center-badge">
                          {breakdownData[hoveredSlice].pct}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ref-breakdown-table-box">
                    <table className="ref-breakdown-table">
                      <thead>
                        <tr>
                          <th>STREAM</th>
                          <th>SHARE</th>
                          <th>PROFIT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdownData.map((item, idx) => (
                          <tr
                            key={item.name}
                            className={`ref-breakdown-row ${hoveredSlice === idx ? 'active' : ''}`}
                            onMouseEnter={() => setHoveredSlice(idx)}
                            onMouseLeave={() => setHoveredSlice(null)}
                          >
                            <td>
                              <div className="ref-method-name-cell">
                                <div className="ref-stream-title-wrap">
                                  <span className="ref-method-dot" style={{ background: item.color }} />
                                  <span>{item.name}</span>
                                </div>
                                <div className="ref-progress-track">
                                  <div
                                    className="ref-progress-fill"
                                    style={{
                                      width: item.pct,
                                      background: item.color,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>{item.pct}</td>
                            <td style={{ color: PRIMARY, fontWeight: 800 }}>{inr(item.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 5. Secondary Row (Monthly Trend Bar + Summary Tiles) ── */}
            <div className="ref-main-grid">
              {/* Monthly Trend Bar Chart */}
              <div className="ref-panel">
                <div className="ref-panel-header">
                  <div>
                    <h3 className="ref-panel-title">
                      {activeFilter === 'today'
                        ? 'Today’s Hourly Breakdown'
                        : activeFilter === 'week'
                        ? 'Daily Profit Distribution'
                        : activeFilter === 'month'
                        ? 'Monthly Weekly Progression'
                        : 'Monthly Profit Trend'}
                    </h3>
                    <p className="ref-panel-desc">Performance distribution across the period</p>
                  </div>
                </div>

                <div style={{ width: '100%', height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F1" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={{ stroke: '#E5EBEA' }}
                        tick={{ fill: '#7A8C8A', fontSize: 11, fontWeight: 600 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#7A8C8A', fontSize: 11, fontWeight: 600 }}
                        tickFormatter={(v) => `₹ ${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${Math.round(v / 1000)}k`}`}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="profit" radius={[5, 5, 0, 0]} maxBarSize={38}>
                        {dynamicTrendData.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={entry.month === realSummary.maxMonth && entry.profit > 0 ? GOLD : '#0D9488'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4 Summary Tiles */}
              <div className="ref-panel">
                <div className="ref-panel-header">
                  <div>
                    <h3 className="ref-panel-title">Profit Summary</h3>
                    <p className="ref-panel-desc">Key performance milestones</p>
                  </div>
                </div>

                <div className="ref-summary-tiles">
                  <div className="ref-tile">
                    <div className="ref-tile-icon green">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v12M15 9.5H9.5a2.5 2.5 0 0 0 0 5H14" />
                      </svg>
                    </div>
                    <div>
                      <div className="ref-tile-lbl">NET PROFIT</div>
                      <div className="ref-tile-val">{inr(totalAthiraiProfit)}</div>
                    </div>
                  </div>

                  <div className="ref-tile">
                    <div className="ref-tile-icon teal">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </div>
                    <div>
                      <div className="ref-tile-lbl">73% MARGIN</div>
                      <div className="ref-tile-val">{inr(companyShare73)}</div>
                    </div>
                  </div>

                  <div className="ref-tile">
                    <div className="ref-tile-icon blue">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div>
                      <div className="ref-tile-lbl">GENERAL CUST</div>
                      <div className="ref-tile-val">{inr(generalCustomerRevenue)}</div>
                    </div>
                  </div>

                  <div className="ref-tile">
                    <div className="ref-tile-icon gold">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                    </div>
                    <div>
                      <div className="ref-tile-lbl">PEAK PERIOD</div>
                      <div className="ref-tile-val" style={{ fontSize: 14 }}>{realSummary.maxMonth}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 6. Transactions Table ── */}
            <div className="ref-table-panel">
              <div className="ref-table-top">
                <div>
                  <h3 className="ref-panel-title">Recent Profit Transactions</h3>
                  <p className="ref-panel-desc">
                    Showing {filteredTxns.length} of {totalTxnsCount.toLocaleString('en-IN')} company revenue records
                  </p>
                </div>

                <div className="ref-search-wrap">
                  <svg className="ref-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="ref-search-input"
                    placeholder="Search by ID, customer, order..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="ref-table-scroll">
                <table className="ref-table">
                  <thead>
                    <tr>
                      <th style={{ width: 55, textAlign: 'center' }}>S.NO</th>
                      <th>DATE & TIME</th>
                      <th>TRANSACTION ID</th>
                      <th>ORDER ID</th>
                      <th>CUSTOMER</th>
                      <th>TURNOVER</th>
                      <th>73% ATHIRAI PROFIT</th>
                      <th>BALANCE COMMISSION</th>
                      <th>SUPER ADMIN (1%)</th>
                      <th>GENERAL CUSTOMER</th>
                      <th>PAYMENT MODE</th>
                      <th style={{ width: 60, textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      Array.from({ length: 10 }).map((_, idx) => (
                        <tr key={`tbl-skel-${idx}`}>
                          <td style={{ textAlign: 'center' }}>
                            <div className="ref-skeleton-bar" style={{ width: 22, height: 13, margin: '0 auto' }} />
                          </td>
                          <td>
                            <div className="ref-skeleton-bar" style={{ width: 110, height: 13 }} />
                          </td>
                          <td>
                            <div className="ref-skeleton-bar" style={{ width: 90, height: 22, borderRadius: 6 }} />
                          </td>
                          <td>
                            <div className="ref-skeleton-bar" style={{ width: 80, height: 13 }} />
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              <div className="ref-skeleton-bar" style={{ width: 115, height: 13 }} />
                              <div className="ref-skeleton-bar" style={{ width: 75, height: 10 }} />
                            </div>
                          </td>
                          <td>
                            <div className="ref-skeleton-bar" style={{ width: 75, height: 14 }} />
                          </td>
                          <td>
                            <div className="ref-skeleton-bar" style={{ width: 85, height: 14 }} />
                          </td>
                          <td>
                            <div className="ref-skeleton-bar" style={{ width: 75, height: 14 }} />
                          </td>
                          <td>
                            <div className="ref-skeleton-bar" style={{ width: 65, height: 14 }} />
                          </td>
                          <td>
                            <div className="ref-skeleton-bar" style={{ width: 75, height: 14 }} />
                          </td>
                          <td>
                            <div className="ref-skeleton-bar" style={{ width: 70, height: 20, borderRadius: 12 }} />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="ref-skeleton-bar" style={{ width: 28, height: 28, borderRadius: 6, margin: '0 auto' }} />
                          </td>
                        </tr>
                      ))
                    ) : filteredTxns.length === 0 ? (
                      <tr>
                        <td colSpan="12" style={{ textAlign: 'center', padding: '40px 0', color: MUTED }}>
                          No transactions found for the selected period.
                        </td>
                      </tr>
                    ) : (
                      filteredTxns.map((t, idx) => {
                        const style = getMethodStyle(t.payment_method)
                        const cust = getCustomerDisplay(t)
                        const rawAmount = Number(t.turnover || t.amount) || 0
                        const profitShare = Number((rawAmount * 0.73).toFixed(2))

                        const isGen = t.is_general_customer != null
                          ? t.is_general_customer
                          : (t.general_customer_revenue != null && t.general_customer_revenue > 0)

                        const balanceComm = t.balance_commission != null
                          ? Number(t.balance_commission)
                          : (isGen ? null : Number((rawAmount * 0.15).toFixed(2)))

                        const superAdminComm = t.super_admin_commission != null
                          ? Number(t.super_admin_commission)
                          : Number((rawAmount * 0.01).toFixed(2))

                        const genCustRevenue = t.general_customer_revenue != null
                          ? Number(t.general_customer_revenue)
                          : (isGen ? rawAmount : null)

                        return (
                          <tr key={t.transaction_id || t.order_id}>
                            {/* S.NO */}
                            <td style={{ textAlign: 'center', color: MUTED, fontWeight: 700, fontSize: 12 }}>
                              {((page - 1) * PAGE_SIZE) + idx + 1}
                            </td>
                            <td style={{ color: MUTED, fontSize: 12 }}>
                              {fmtDate(t.created_at)}
                            </td>
                            <td>
                              <span
                                className="ref-id-badge"
                                onClick={() => copyToClipboard(t.transaction_id || t.order_id)}
                                title="Click to copy Transaction ID"
                              >
                                {t.transaction_id || t.order_id || '—'}
                                <span className="ref-copy-icon">
                                  {copiedId === (t.transaction_id || t.order_id) ? '✓' : '⧉'}
                                </span>
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: MUTED }}>
                                {t.order_id || '—'}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: PRIMARY }}>{cust.name}</div>
                              <div style={{ fontSize: 11, color: MUTED }}>{cust.id}</div>
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              {inr(rawAmount)}
                            </td>
                            <td style={{ fontWeight: 800, color: '#059669' }}>
                              {inr(profitShare)}
                            </td>
                            {/* Balance Commission (Residual Pool) */}
                            <td style={{ fontWeight: 700, color: balanceComm ? '#2563EB' : MUTED }}>
                              {balanceComm ? inr(balanceComm) : 'N/A'}
                            </td>
                            {/* Super Admin Commission (1%) */}
                            <td style={{ fontWeight: 700, color: superAdminComm ? '#D97706' : MUTED }}>
                              {superAdminComm ? inr(superAdminComm) : 'N/A'}
                            </td>
                            {/* General Customer Revenue */}
                            <td style={{ fontWeight: 700, color: genCustRevenue ? '#059669' : MUTED }}>
                              {genCustRevenue ? inr(genCustRevenue) : 'N/A'}
                            </td>
                            <td>
                              <span
                                className="ref-badge"
                                style={{ background: style.bg, color: style.text }}
                              >
                                {style.label}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="ref-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (menuAnchor && menuAnchor.txn?.order_id === t.order_id) {
                                    setMenuAnchor(null)
                                    return
                                  }
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  const spaceBelow = window.innerHeight - rect.bottom
                                  const openUp = spaceBelow < 150 && rect.top > 150
                                  setMenuAnchor({
                                    txn: t,
                                    openUp,
                                    top: openUp ? undefined : (rect.bottom + 4),
                                    bottom: openUp ? (window.innerHeight - rect.top + 4) : undefined,
                                    right: Math.max(12, window.innerWidth - rect.right),
                                  })
                                }}
                              >
                                ⋯
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Floating Viewport Fixed Action Menu (Zero Clipping, Never Cutoff by Table/Header) */}
              {menuAnchor && (
                <div
                  className="ref-menu-popover"
                  style={{
                    position: 'fixed',
                    top: menuAnchor.top != null ? `${menuAnchor.top}px` : 'auto',
                    bottom: menuAnchor.bottom != null ? `${menuAnchor.bottom}px` : 'auto',
                    right: `${menuAnchor.right}px`,
                    zIndex: 99999,
                    minWidth: 180,
                    boxShadow: '0 18px 40px rgba(12,64,68,.22), 0 4px 12px rgba(0,0,0,.08)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="ref-menu-item"
                    onClick={() => {
                      setSelectedTxn(menuAnchor.txn)
                      setMenuAnchor(null)
                    }}
                  >
                    View Order Details
                  </button>
                  <button
                    type="button"
                    className="ref-menu-item"
                    onClick={() => {
                      copyToClipboard(menuAnchor.txn?.order_id)
                      setMenuAnchor(null)
                    }}
                  >
                    Copy Order ID
                  </button>
                </div>
              )}

              {/* Numbered Pagination */}
              {totalPages > 1 && (
                <div className="ref-pagination">
                  <div className="ref-pagination-info">
                    Page {page} of {totalPages} ({totalTxnsCount.toLocaleString('en-IN')} total orders)
                  </div>

                  <div className="ref-page-buttons">
                    <button
                      type="button"
                      className="ref-page-btn"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1 || tableLoading}
                    >
                      ‹
                    </button>

                    {paginationItems.map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: MUTED }}>
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${item}`}
                          type="button"
                          className={`ref-page-btn ${page === item ? 'active' : ''}`}
                          onClick={() => goToPage(item)}
                          disabled={tableLoading}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      className="ref-page-btn"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages || tableLoading}
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Transaction Details Modal ── */}
        {selectedTxn && (
          <div className="ref-modal-overlay" onClick={() => setSelectedTxn(null)}>
            <div className="ref-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ref-modal-head">
                <h3 className="ref-modal-title">Transaction & Profit Details</h3>
                <button
                  type="button"
                  className="ref-modal-close"
                  onClick={() => setSelectedTxn(null)}
                >
                  ✕
                </button>
              </div>

              <div className="ref-modal-body">
                <div className="ref-modal-row">
                  <span className="ref-modal-lbl">Order ID</span>
                  <span className="ref-modal-val">{selectedTxn.order_id || '—'}</span>
                </div>
                <div className="ref-modal-row">
                  <span className="ref-modal-lbl">Transaction ID</span>
                  <span className="ref-modal-val">{selectedTxn.transaction_id || '—'}</span>
                </div>
                <div className="ref-modal-row">
                  <span className="ref-modal-lbl">Customer Name</span>
                  <span className="ref-modal-val">{getCustomerDisplay(selectedTxn).name}</span>
                </div>
                <div className="ref-modal-row">
                  <span className="ref-modal-lbl">Customer User ID</span>
                  <span className="ref-modal-val">{getCustomerDisplay(selectedTxn).id}</span>
                </div>
                <div className="ref-modal-row">
                  <span className="ref-modal-lbl">Product / Details</span>
                  <span className="ref-modal-val">{selectedTxn.product_name || 'Jewelry Product'}</span>
                </div>
                <div className="ref-modal-row">
                  <span className="ref-modal-lbl">Gross Order Amount</span>
                  <span className="ref-modal-val">{inr(selectedTxn.amount)}</span>
                </div>
                <div className="ref-modal-row">
                  <span className="ref-modal-lbl">73% Athirai Company Profit</span>
                  <span className="ref-modal-val" style={{ color: '#059669', fontSize: 15 }}>
                    {inr(Number(selectedTxn.amount || 0) * 0.73)}
                  </span>
                </div>
                <div className="ref-modal-row">
                  <span className="ref-modal-lbl">Payment Mode</span>
                  <span className="ref-modal-val">{fmtMethod(selectedTxn.payment_method)}</span>
                </div>
                <div className="ref-modal-row">
                  <span className="ref-modal-lbl">Date & Time</span>
                  <span className="ref-modal-val">{fmtDate(selectedTxn.created_at)}</span>
                </div>
              </div>

              <div className="ref-modal-foot">
                <button
                  type="button"
                  className="ref-btn-secondary"
                  onClick={() => {
                    copyToClipboard(selectedTxn.order_id)
                  }}
                >
                  Copy Order ID
                </button>
                <button
                  type="button"
                  className="ref-btn-primary"
                  onClick={() => window.print()}
                >
                  Print Slip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
