import { useEffect, useRef, useState, useMemo } from 'react'
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

const DONUT_PALETTE = ['#0D9488', '#2563EB', '#D99438', '#7C3AED', '#F97316', '#0284C7', '#10B981', '#059669']

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

  // If name was stored as an ID (e.g. starts with BBCUS / BB...):
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
    <svg className="ref-sparkline" width={width} height={height} viewBox="0 0 90 36" fill="none" style={{ flexShrink: 0 }}>
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

function CustomAreaTooltip({ active, payload, label, metric = 'revenue' }) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="ref-tooltip">
        <div className="ref-tooltip-month">{label}</div>
        <div className="ref-tooltip-val">
          {metric === 'revenue' ? inr(val) : `${Number(val).toLocaleString('en-IN')} Orders`}
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
      </div>
    )
  }
  return null
}

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="ref-tooltip">
        <div className="ref-tooltip-month">{fmtMethod(data.method)}</div>
        <div className="ref-tooltip-val">{inr(data.total)}</div>
        <div style={{ fontSize: 10.5, color: '#D1D5DB', marginTop: 2 }}>{data.count.toLocaleString('en-IN')} transactions</div>
      </div>
    )
  }
  return null
}

export default function AllSalesDashboard({
  view = 'all_sales',
  kicker = 'SUPER ADMIN',
  title = 'All Sales',
  note = 'Track platform-wide sales, order value, transactions and payment performance.',
  revenueLabel = 'TOTAL ORDER VALUE',
  coinsLabel = 'COINS SOLD',
}) {
  const [summary, setSummary] = useState(null)
  const [txns, setTxns] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
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
  const [menuAnchor, setMenuAnchor] = useState(null) // { txn, top, bottom, right }
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false)
  const [chartMetric, setChartMetric] = useState('revenue') // 'revenue' | 'transactions'
  const [hoveredSlice, setHoveredSlice] = useState(null)

  const PAGE_SIZE = 100
  const [tableLoading, setTableLoading] = useState(false)

  const fetchIdRef = useRef(0)

  // Close open popovers on outside click or scroll
  useEffect(() => {
    const handleOutside = () => {
      setMenuAnchor(null)
      setIsDateDropdownOpen(false)
      setIsMetricDropdownOpen(false)
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

  const fetchData = async (p = 1, period = activeFilter, from = customFrom, to = customTo, isPageNav = false) => {
    const fetchId = ++fetchIdRef.current
    const cacheKey = `asd_${view}_${period}_${from || ''}_${to || ''}_p${p}`

    // Instant local cache load from sessionStorage
    if (!isPageNav) {
      try {
        const cachedRaw = sessionStorage.getItem(cacheKey)
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw)
          if (cached && cached.summary) {
            setSummary(cached.summary)
            setTxns(cached.transactions || [])
            setHasMore(Boolean(cached.has_more))
            setPage(p)
            setLoading(false)
            setLoadError(false)
          }
        }
      } catch (err) {}
    }

    if (isPageNav) {
      setTableLoading(true)
    } else if (!sessionStorage.getItem(cacheKey)) {
      setLoading(true)
    }

    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/payments/?page=${p}&page_size=${PAGE_SIZE}&period=${period}&view=${view}`
      if (period === 'custom' && from && to) {
        url += `&start_date=${from}&end_date=${to}`
      }
      const res = await api.get(url)
      if (fetchId !== fetchIdRef.current) return

      const newSummary = {
        total_revenue: res.data.total_revenue || 0,
        total_coins_sold: res.data.total_coins_sold || 0,
        total_transactions: res.data.total_transactions || 0,
        monthly_trend: res.data.monthly_trend || [],
        payment_breakdown: res.data.payment_breakdown || [],
      }
      const newTxns = res.data.transactions || []
      const newHasMore = Boolean(res.data.has_more)

      setSummary(newSummary)
      setTxns(newTxns)
      setHasMore(newHasMore)
      setPage(p)
      setLoadError(false)

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          summary: newSummary,
          transactions: newTxns,
          has_more: newHasMore,
        }))
      } catch (err) {}
    } catch {
      if (fetchId !== fetchIdRef.current) return
      if (!sessionStorage.getItem(cacheKey)) {
        setLoadError(true)
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
        setTableLoading(false)
        setLoadingMore(false)
      }
    }
  }

  const goToPage = (p) => {
    if (p < 1 || p === page || tableLoading) return
    fetchData(p, activeFilter, customFrom, customTo, true)
  }

  useEffect(() => {
    fetchData(1, 'month', '', '', false)
  }, [])

  const handleFilterClick = (key) => {
    setActiveFilter(key)
    setPage(1)
    if (key !== 'custom') {
      setLoading(true)
      fetchData(1, key, '', '')
    } else if (customFrom && customTo) {
      setLoading(true)
      fetchData(1, 'custom', customFrom, customTo)
    }
  }

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    setPage(1)
    setLoading(true)
    fetchData(1, 'custom', customFrom, customTo)
  }

  const loadMore = () => {
    setLoadingMore(true)
    fetchData(page + 1, activeFilter, customFrom, customTo)
  }

  const retry = () => {
    setLoading(true)
    fetchData(1, activeFilter, customFrom, customTo)
  }

  const downloadReport = async () => {
    setDownloading(true)
    setDownloadError(false)
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/payments/?period=${activeFilter}&view=${view}&export=csv`
      if (activeFilter === 'custom' && customFrom && customTo) {
        url += `&start_date=${customFrom}&end_date=${customTo}`
      }
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `all-sales-report-${activeFilter}.pdf`
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

  // Real breakdown calculations from DB
  const breakdownList = useMemo(() => {
    if (!summary?.payment_breakdown) return []
    const totalBreakdownVal = summary.payment_breakdown.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)
    return summary.payment_breakdown.map((b, idx) => {
      const amt = Number(b.total) || 0
      const pct = totalBreakdownVal > 0 ? (amt / totalBreakdownVal) * 100 : 0
      const style = getMethodStyle(b.method)
      const color = style.fill || DONUT_PALETTE[idx % DONUT_PALETTE.length]
      return {
        ...b,
        amount: amt,
        percentage: pct,
        color,
        label: style.label || fmtMethod(b.method),
        bg: style.bg,
        textColor: style.text,
      }
    })
  }, [summary?.payment_breakdown])

  const donutData = useMemo(() => {
    if (!breakdownList.length) return []
    return breakdownList.map(b => ({
      name: b.label,
      method: b.method,
      total: b.amount,
      count: b.count,
      color: b.color,
    }))
  }, [breakdownList])

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

  const trendData = useMemo(() => {
    if (activeFilter === 'today') {
      const hourSlots = [
        { label: '06:00', start: 6, end: 8 },
        { label: '09:00', start: 9, end: 11 },
        { label: '12:00', start: 12, end: 14 },
        { label: '15:00', start: 15, end: 17 },
        { label: '18:00', start: 18, end: 20 },
        { label: '21:00', start: 21, end: 23 },
      ]
      const buckets = hourSlots.map(slot => ({
        month: slot.label,
        revenue: 0,
        transactions: 0,
      }))
      if (txns && txns.length > 0) {
        txns.forEach(t => {
          if (!t.created_at) return
          const d = new Date(t.created_at)
          const h = d.getHours()
          const amt = Number(t.amount) || 0
          const idx = buckets.findIndex((_, i) => h >= hourSlots[i].start && h <= hourSlots[i].end)
          const target = idx !== -1 ? idx : (h < 6 ? 0 : buckets.length - 1)
          buckets[target].revenue = Number((buckets[target].revenue + amt).toFixed(2))
          buckets[target].transactions += 1
        })
      } else if (Number(summary?.total_revenue || 0) > 0) {
        buckets[2].revenue = Number(Number(summary.total_revenue).toFixed(2))
        buckets[2].transactions = summary.total_transactions || 1
      }
      return buckets
    }

    if (activeFilter === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const dayBuckets = days.map(d => ({ month: d, revenue: 0, transactions: 0 }))
      if (txns && txns.length > 0) {
        txns.forEach(t => {
          if (!t.created_at) return
          const d = new Date(t.created_at)
          const dayIdx = (d.getDay() + 6) % 7
          const amt = Number(t.amount) || 0
          dayBuckets[dayIdx].revenue = Number((dayBuckets[dayIdx].revenue + amt).toFixed(2))
          dayBuckets[dayIdx].transactions += 1
        })
      }
      return dayBuckets
    }

    if (activeFilter === 'month') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      const weekBuckets = weeks.map(w => ({ month: w, revenue: 0, transactions: 0 }))
      if (txns && txns.length > 0) {
        txns.forEach(t => {
          if (!t.created_at) return
          const d = new Date(t.created_at)
          const dateNum = d.getDate()
          const weekIdx = Math.min(3, Math.floor((dateNum - 1) / 7))
          const amt = Number(t.amount) || 0
          weekBuckets[weekIdx].revenue = Number((weekBuckets[weekIdx].revenue + amt).toFixed(2))
          weekBuckets[weekIdx].transactions += 1
        })
      }
      return weekBuckets
    }

    if (!summary?.monthly_trend || summary.monthly_trend.length === 0) return []
    const totalRev = Number(summary.total_revenue) || 1
    const totalTxns = Number(summary.total_transactions) || 0
    return summary.monthly_trend.map(t => {
      const rev = Number(t.revenue) || 0
      let txnsCount = t.transactions != null ? Number(t.transactions) : (t.count != null ? Number(t.count) : null)
      if (txnsCount == null || isNaN(txnsCount) || txnsCount === 0) {
        txnsCount = totalTxns > 0 ? Math.max(1, Math.round((rev / totalRev) * totalTxns)) : 0
      }
      return {
        month: t.month,
        revenue: Number(rev.toFixed(2)),
        transactions: txnsCount,
      }
    })
  }, [activeFilter, txns, summary?.monthly_trend, summary?.total_revenue, summary?.total_transactions])

  // Highest month dynamically derived from real monthly_trend
  const realSummary = useMemo(() => {
    if (!summary) return { maxMonth: '—', maxRev: 0 }
    let maxMonth = '—'
    let maxRev = 0
    if (trendData.length > 0) {
      trendData.forEach(t => {
        const rev = Number(t.revenue) || 0
        if (rev > maxRev) {
          maxRev = rev
          maxMonth = t.month
        }
      })
    }
    return { maxMonth, maxRev }
  }, [summary, trendData])

  // Real Dynamic Period Label
  const periodLabelText = useMemo(() => {
    const today = new Date()
    if (activeFilter === 'all') {
      return 'All Time'
    }
    if (activeFilter === 'today') {
      return `Today · ${today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
    }
    if (activeFilter === 'week') {
      return 'Last 7 Days'
    }
    if (activeFilter === 'month') {
      return `This Month`
    }
    if (activeFilter === 'year') {
      return `Year ${today.getFullYear()}`
    }
    if (activeFilter === 'custom' && customFrom && customTo) {
      return `${customFrom} to ${customTo}`
    }
    return 'Custom Range'
  }, [activeFilter, customFrom, customTo])

  const totalTransactions = summary?.total_transactions || 0
  const totalPages = Math.max(1, Math.ceil(totalTransactions / PAGE_SIZE))
  const startIdx = totalTransactions > 0 ? (page - 1) * PAGE_SIZE + 1 : 0
  const endIdx = Math.min(page * PAGE_SIZE, totalTransactions)

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const items = []
    items.push(1)
    if (page > 3) {
      items.push('...')
    }
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) {
      items.push(i)
    }
    if (page < totalPages - 2) {
      items.push('...')
    }
    items.push(totalPages)
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
          overflow-x: hidden;
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

        /* Dropdown Button for Date/Year */
        .ref-date-dropdown-wrap {
          position: relative;
        }

        .ref-date-range-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 14px;
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          color: ${PRIMARY};
          box-shadow: 0 1px 4px rgba(0,0,0,0.02);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ref-date-range-btn:hover {
          background: #F8FAFA;
          border-color: #CBD5D4;
        }

        .ref-menu-popover {
          position: absolute;
          top: 44px;
          right: 0;
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 10px;
          box-shadow: 0 12px 30px rgba(14, 67, 72, 0.14);
          z-index: 100;
          min-width: 160px;
          padding: 6px 0;
        }

        .ref-menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: ${DARK};
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.12s;
          text-align: left;
        }

        .ref-menu-item:hover {
          background: #F4F7F6;
          color: ${PRIMARY};
        }

        .ref-menu-item.active {
          color: ${PRIMARY};
          font-weight: 800;
          background: #EEF4F4;
        }

        .ref-custom-inputs {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          flex-wrap: wrap;
        }

        .ref-date-field {
          height: 34px;
          padding: 0 10px;
          border-radius: 6px;
          border: 1px solid ${BORDER};
          background: #fff;
          font-size: 11.5px;
          font-weight: 600;
          color: ${DARK};
          outline: none;
        }

        .ref-apply-btn {
          height: 34px;
          padding: 0 16px;
          border-radius: 6px;
          border: none;
          background: ${ACCENT};
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        /* ── 3. KPI Cards Strip ── */
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
          box-shadow: 0 2px 10px rgba(14, 67, 72, 0.03);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }

        .ref-card.hero {
          background: linear-gradient(135deg, #093E42 0%, #0E5258 100%);
          border: 1px solid rgba(9, 62, 66, 0.7);
          color: #fff;
          box-shadow: 0 4px 18px rgba(9, 62, 66, 0.22);
        }

        .ref-card.hero .ref-card-label {
          color: rgba(255, 255, 255, 0.78);
        }

        .ref-card.hero .ref-card-num {
          color: #fff;
        }

        .ref-card.hero .ref-card-sub {
          color: rgba(255, 255, 255, 0.65);
        }

        .ref-card-top {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 12px;
        }

        .ref-card-icon-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ref-card-icon-circle.hero {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #2DD4BF;
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

        .ref-card-num {
          font-size: clamp(22px, 2.2vw, 28px);
          font-weight: 800;
          color: ${PRIMARY};
          line-height: 1.15;
          letter-spacing: -0.3px;
        }

        .ref-card-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .ref-card-sub {
          font-size: 11.5px;
          font-weight: 500;
          color: ${MUTED};
        }

        /* ── Shimmer Skeleton Animation ── */
        @keyframes shimmerPulse {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .ref-shimmer {
          background: linear-gradient(90deg, #F0F4F4 25%, #E2EAEA 50%, #F0F4F4 75%);
          background-size: 200% 100%;
          animation: shimmerPulse 1.6s infinite ease-in-out;
          border-radius: 6px;
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
          box-shadow: 0 2px 10px rgba(14, 67, 72, 0.03);
          box-sizing: border-box;
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
          font-size: 15px;
          font-weight: 800;
          color: ${PRIMARY};
          margin: 0 0 3px;
        }

        .ref-panel-desc {
          font-size: 11.5px;
          color: ${MUTED};
          font-weight: 500;
          margin: 0;
        }

        .ref-pill-dropdown-wrap {
          position: relative;
        }

        .ref-pill-dropdown {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
          color: ${PRIMARY};
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ref-pill-dropdown:hover {
          background: #F8FAFA;
          border-color: #CBD5D4;
        }

        /* ── Payment Method Breakdown (Clean Aligned Table) ── */
        .ref-donut-container {
          display: grid;
          grid-template-columns: 195px minmax(320px, 1fr);
          gap: 22px;
          align-items: center;
          height: 100%;
        }

        .ref-donut-wrapper {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto;
          flex-shrink: 0;
        }

        .ref-donut-center-info {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
          max-width: 115px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ref-donut-center-val {
          font-size: 19px;
          font-weight: 850;
          color: ${PRIMARY};
          line-height: 1.1;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        .ref-donut-center-lbl {
          font-size: 9px;
          font-weight: 800;
          color: ${MUTED};
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-top: 3px;
          line-height: 1.15;
          text-align: center;
        }

        .ref-breakdown-table-box {
          overflow-y: auto;
          max-height: 290px;
          width: 100%;
        }

        .ref-breakdown-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 12px;
        }

        .ref-breakdown-table th {
          font-size: 11px;
          font-weight: 700;
          color: #7A8987;
          padding: 10px 14px;
          border-bottom: 1.5px solid ${BORDER};
          white-space: nowrap;
          letter-spacing: 0.3px;
        }

        .ref-th-method {
          text-align: left;
          padding-left: 6px !important;
        }

        .ref-th-count {
          text-align: right;
          padding-right: 18px !important;
          min-width: 68px;
        }

        .ref-th-amt {
          text-align: right;
          padding-right: 18px !important;
          min-width: 130px;
        }

        .ref-th-pct {
          text-align: right;
          padding-right: 6px !important;
          min-width: 52px;
        }

        .ref-breakdown-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #EDF2F2;
          vertical-align: middle;
        }

        .ref-td-method {
          text-align: left;
          padding-left: 6px !important;
        }

        .ref-td-count {
          text-align: right;
          padding-right: 18px !important;
          color: ${MUTED};
          font-weight: 600;
          white-space: nowrap;
        }

        .ref-td-amt {
          text-align: right;
          padding-right: 18px !important;
          font-weight: 800;
          color: ${PRIMARY};
          white-space: nowrap;
        }

        .ref-td-pct {
          text-align: right;
          padding-right: 6px !important;
          color: ${MUTED};
          font-weight: 700;
          white-space: nowrap;
        }

        .ref-breakdown-table tr:hover td {
          background: #F8FAFA;
        }

        .ref-method-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: ${DARK};
          white-space: nowrap;
        }

        .ref-method-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── 5. Secondary Analytics: Monthly Sales Trend & Sales Summary ── */
        .ref-sub-grid {
          display: grid;
          grid-template-columns: 1.55fr 1fr;
          gap: 18px;
          margin-bottom: 22px;
          align-items: stretch;
        }

        .ref-summary-tiles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          height: 100%;
        }

        .ref-tile {
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 10px;
          padding: 16px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ref-tile-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ref-tile-icon-circle.gold {
          background: #FEF3C7;
          color: #D97706;
        }

        .ref-tile-icon-circle.amber {
          background: #FFFBEB;
          color: #B45309;
        }

        .ref-tile-icon-circle.green {
          background: #ECFDF5;
          color: #10B981;
        }

        .ref-tile-icon-circle.purple {
          background: #F3E8FF;
          color: #8B5CF6;
        }

        .ref-tile-meta {
          flex: 1;
          min-width: 0;
        }

        .ref-tile-label {
          font-size: 10.5px;
          font-weight: 700;
          color: ${MUTED};
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ref-tile-val {
          font-size: 15px;
          font-weight: 800;
          color: ${PRIMARY};
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ref-tile-sub {
          font-size: 10.5px;
          font-weight: 600;
          color: ${MUTED};
          margin-top: 2px;
          white-space: nowrap;
        }

        /* ── 6. Recent Transactions Table & Action Menu ── */
        .ref-txns-panel {
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(14, 67, 72, 0.03);
          box-sizing: border-box;
          overflow: visible;
          position: relative;
        }

        .ref-txns-header {
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid ${BORDER};
        }

        .ref-txns-title {
          font-size: 15px;
          font-weight: 800;
          color: ${PRIMARY};
          margin: 0;
        }

        .ref-table-scroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          min-height: 280px;
          padding-bottom: 24px;
          -webkit-overflow-scrolling: touch;
        }

        .ref-data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
          font-size: 12px;
          min-width: 880px;
        }

        .ref-data-table th {
          background: #F8FAFA;
          color: #5A6D6C;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 13px 20px;
          border-bottom: 1.5px solid ${BORDER};
          white-space: nowrap;
          box-sizing: border-box;
        }

        .ref-data-table td {
          padding: 14px 20px;
          border-bottom: 1px solid #EDF3F3;
          color: ${DARK};
          vertical-align: middle;
          box-sizing: border-box;
        }

        .ref-data-table tbody tr {
          transition: background 0.12s ease;
        }

        .ref-data-table tbody tr:hover td {
          background: #F8FBFB;
        }

        .ref-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        /* Action Icon Button (SVG 3-dots) */
        .ref-action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: #7A8987;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .ref-action-icon-btn:hover {
          background: #EEF4F4;
          border-color: ${BORDER};
          color: ${PRIMARY};
        }

        /* Action Popover Floating Menu */
        .ref-action-popover {
          position: absolute;
          right: 18px;
          top: calc(100% + 4px);
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 10px;
          box-shadow: 0 14px 34px rgba(14, 67, 72, 0.18), 0 2px 8px rgba(0, 0, 0, 0.06);
          z-index: 1000;
          min-width: 180px;
          padding: 6px 0;
          text-align: left;
          animation: refPopFadeIn 0.15s ease-out;
        }

        .ref-action-popover.up {
          top: auto;
          bottom: calc(100% + 4px);
          box-shadow: 0 -14px 34px rgba(14, 67, 72, 0.18), 0 -2px 8px rgba(0, 0, 0, 0.06);
        }

        @keyframes refPopFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ref-action-popover-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 14px;
          border: none;
          background: transparent;
          color: ${DARK};
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.12s;
        }

        .ref-action-popover-item:hover {
          background: #F4F7F6;
          color: ${PRIMARY};
        }

        /* Order Details Modal / Drawer */
        .ref-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(14, 67, 72, 0.45);
          backdrop-filter: blur(3px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .ref-modal-card {
          background: #fff;
          border: 1px solid ${BORDER};
          border-radius: 14px;
          padding: 24px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
          position: relative;
        }

        .ref-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid ${BORDER};
          padding-bottom: 14px;
          margin-bottom: 16px;
        }

        .ref-modal-title {
          font-size: 16px;
          font-weight: 800;
          color: ${PRIMARY};
          margin: 0;
        }

        .ref-modal-close {
          border: none;
          background: transparent;
          cursor: pointer;
          color: ${MUTED};
          font-size: 18px;
          font-weight: 700;
        }

        .ref-modal-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 0;
          font-size: 12.5px;
          border-bottom: 1px solid #F3F4F6;
        }

        .ref-modal-lbl {
          color: ${MUTED};
          font-weight: 600;
        }

        .ref-modal-val {
          font-weight: 700;
          color: ${DARK};
          text-align: right;
        }

        .ref-table-footer {
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid ${BORDER};
          font-size: 12px;
          color: ${MUTED};
        }

        .ref-page-buttons {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ref-page-btn {
          min-width: 28px;
          height: 28px;
          padding: 0 6px;
          border-radius: 6px;
          border: 1px solid ${BORDER};
          background: #fff;
          color: ${DARK};
          font-size: 11.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-sizing: border-box;
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

        .ref-rows-pills {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ref-size-pill {
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid ${BORDER};
          background: #fff;
          color: ${DARK};
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ref-size-pill:hover {
          background: #F4F7F6;
          border-color: ${ACCENT};
        }

        .ref-size-pill.active {
          background: ${PRIMARY};
          border-color: ${PRIMARY};
          color: #fff;
        }

        .ref-size-pill:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ref-tooltip {
          background: ${PRIMARY};
          color: #fff;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(14, 67, 72, 0.25);
          text-align: center;
        }

        .ref-tooltip-month {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 2px;
        }

        .ref-tooltip-val {
          font-size: 12px;
          font-weight: 800;
          color: #fff;
        }

        @keyframes refShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .ref-shimmer {
          background: linear-gradient(90deg, #F0F4F4 25%, #E4ECEC 50%, #F0F4F4 75%);
          background-size: 200% 100%;
          animation: refShimmer 1.5s infinite;
          border-radius: 6px;
        }

        @media (max-width: 1080px) {
          .ref-main-grid {
            grid-template-columns: 1fr;
          }
          .ref-sub-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 860px) {
          .ref-dashboard-wrapper {
            padding: 14px 10px 60px !important;
          }
          .ref-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .ref-card.hero {
            grid-column: span 2 !important;
          }
          .ref-donut-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 20px;
          }
          .ref-header {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }
          .ref-download-btn {
            justify-content: center;
            width: 100%;
          }
        }

        @media (max-width: 680px) {
          .ref-dashboard-wrapper {
            padding: 12px 8px 50px !important;
          }
          .ref-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .ref-card.hero {
            grid-column: span 2 !important;
          }
          .ref-card {
            padding: 12px 10px !important;
            min-width: 0 !important;
            overflow: hidden !important;
            border-radius: 12px !important;
          }
          .ref-card-meta {
            min-width: 0 !important;
            overflow: hidden !important;
          }
          .ref-card-label {
            font-size: 9px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            letter-spacing: 0.5px !important;
          }
          .ref-card-num {
            font-size: 17px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .ref-card-top {
            gap: 8px !important;
            margin-bottom: 6px !important;
          }
          .ref-card-icon-circle {
            width: 32px !important;
            height: 32px !important;
          }
          .ref-card-icon-circle svg {
            width: 16px !important;
            height: 16px !important;
          }
          .ref-card-bottom {
            gap: 6px !important;
            margin-top: 6px !important;
          }
          .ref-card-sub {
            font-size: 9.5px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
          }
          .ref-sparkline {
            width: 44px !important;
            height: 20px !important;
            flex-shrink: 0 !important;
          }
          .ref-summary-tiles {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .ref-tabs-group {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
            scrollbar-width: none;
          }
          .ref-tabs-group::-webkit-scrollbar {
            display: none;
          }
          .ref-tab {
            flex-shrink: 0;
            padding: 7px 14px;
            font-size: 12px;
          }
          .ref-filters-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .ref-date-range-btn {
            width: 100%;
            justify-content: space-between;
          }
          .ref-txns-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px 16px;
          }
          .ref-table-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px 16px;
          }
          .ref-page-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }
          .ref-rows-pills {
            justify-content: center;
          }
        }

        @media (max-width: 420px) {
          .ref-kpi-grid {
            gap: 8px !important;
          }
          .ref-card {
            padding: 10px 8px !important;
          }
          .ref-card-num {
            font-size: 15px !important;
          }
          .ref-sparkline {
            display: none !important;
          }
          .ref-summary-tiles {
            grid-template-columns: 1fr;
          }
          .ref-modal-card {
            margin: 8px;
            width: calc(100% - 16px);
            padding: 14px;
          }
        }
      `}</style>

      <div className="ref-container">
        {/* ── 1. HEADER ── */}
        <header className="ref-header">
          <div>
            <div className="ref-kicker">{kicker}</div>
            <h1 className="ref-title">{title}</h1>
            <p className="ref-desc">{note}</p>
          </div>

          <div>
            <button
              className="ref-download-btn"
              onClick={downloadReport}
              disabled={downloading || loading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {downloading ? 'Preparing Report...' : 'Download Report'}
            </button>
            {downloadError && (
              <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, marginTop: 4 }}>
                Download failed. Please retry.
              </div>
            )}
          </div>
        </header>

        {/* ── 2. PERIOD FILTERS ── */}
        <section className="ref-filters-row">
          <div className="ref-tabs-group">
            {FILTERS.map(f => (
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
            {/* Interactive Date Range Dropdown */}
            <div className="ref-date-dropdown-wrap" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="ref-date-range-btn"
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{periodLabelText}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ transform: isDateDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isDateDropdownOpen && (
                <div className="ref-menu-popover">
                  {DATE_DROPDOWN_OPTIONS.map(opt => (
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
                      {activeFilter === opt.key && <span style={{ color: ACCENT }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeFilter === 'custom' && (
              <div className="ref-custom-inputs">
                <input
                  type="date"
                  className="ref-date-field"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                />
                <span style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>to</span>
                <input
                  type="date"
                  className="ref-date-field"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                />
                <button type="button" className="ref-apply-btn" onClick={applyCustomRange}>
                  Apply
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── ERROR STATE ── */}
        {loadError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: '#991B1B', fontWeight: 700, margin: '0 0 10px' }}>
              Could not load sales analytics data from server.
            </p>
            <button
              onClick={retry}
              style={{ padding: '8px 18px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── LOADING SKELETON ── */}
        {loading && !loadError && (
          <div>
            <div className="ref-kpi-grid">
              <div className="ref-card ref-shimmer" style={{ height: 130 }} />
              <div className="ref-card ref-shimmer" style={{ height: 130 }} />
              <div className="ref-card ref-shimmer" style={{ height: 130 }} />
            </div>
            <div className="ref-main-grid">
              <div className="ref-panel ref-shimmer" style={{ height: 360 }} />
              <div className="ref-panel ref-shimmer" style={{ height: 360 }} />
            </div>
          </div>
        )}

        {/* ── LIVE CONTENT ── */}
        {!loading && !loadError && summary && (
          <div>
            {/* ── 3. KPI CARDS STRIP ── */}
            <div className="ref-kpi-grid">
              {/* Card 1: TOTAL ORDER VALUE (Hero Dark Teal) */}
              <div className="ref-card hero">
                <div className="ref-card-top">
                  <div className="ref-card-icon-circle hero">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v12M15 9.5H9.5a2.5 2.5 0 0 0 0 5H14" />
                    </svg>
                  </div>
                  <div className="ref-card-meta">
                    <div className="ref-card-label">{revenueLabel}</div>
                    <div className="ref-card-num">
                      <AnimatedNumber value={summary.total_revenue} prefix="₹ " />
                    </div>
                  </div>
                </div>
                <div className="ref-card-bottom">
                  <div className="ref-card-sub">Total platform order gross value</div>
                  <Sparkline color="#2DD4BF" />
                </div>
              </div>

              {/* Card 2: COINS SOLD */}
              <div className="ref-card">
                <div className="ref-card-top">
                  <div className="ref-card-icon-circle mint">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M18 9v6a6 6 0 0 1-6 6H8" />
                    </svg>
                  </div>
                  <div className="ref-card-meta">
                    <div className="ref-card-label">{coinsLabel}</div>
                    <div className="ref-card-num">
                      <AnimatedNumber value={summary.total_coins_sold} />
                    </div>
                  </div>
                </div>
                <div className="ref-card-bottom">
                  <div className="ref-card-sub">AUG Coins utilized across orders</div>
                  <Sparkline color="#10B981" />
                </div>
              </div>

              {/* Card 3: TRANSACTIONS */}
              <div className="ref-card">
                <div className="ref-card-top">
                  <div className="ref-card-icon-circle blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="ref-card-meta">
                    <div className="ref-card-label">TRANSACTIONS</div>
                    <div className="ref-card-num">
                      <AnimatedNumber value={summary.total_transactions} />
                    </div>
                  </div>
                </div>
                <div className="ref-card-bottom">
                  <div className="ref-card-sub">Completed order transactions</div>
                  <Sparkline color="#3B82F6" />
                </div>
              </div>
            </div>

            {/* ── 4. MAIN ANALYTICS: Sales Performance & Payment Method Breakdown ── */}
            <div className="ref-main-grid">
              {/* Sales Performance (Large Smooth Area + Line Chart) */}
              <div className="ref-panel">
                <div className="ref-panel-header">
                  <div>
                    <h2 className="ref-panel-title">Sales Performance</h2>
                    <p className="ref-panel-desc">
                      {chartMetric === 'revenue' ? 'Revenue trend across the selected period' : 'Transaction volume trend across the selected period'}
                    </p>
                  </div>

                  {/* Interactive Metric Dropdown: Revenue vs Transactions */}
                  <div className="ref-pill-dropdown-wrap" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="ref-pill-dropdown"
                      onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)}
                    >
                      <span>{chartMetric === 'revenue' ? 'Revenue' : 'Transactions'}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: isMetricDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isMetricDropdownOpen && (
                      <div className="ref-menu-popover">
                        <button
                          type="button"
                          className={`ref-menu-item ${chartMetric === 'revenue' ? 'active' : ''}`}
                          onClick={() => {
                            setChartMetric('revenue')
                            setIsMetricDropdownOpen(false)
                          }}
                        >
                          <span>Revenue (₹)</span>
                          {chartMetric === 'revenue' && <span style={{ color: ACCENT }}>✓</span>}
                        </button>
                        <button
                          type="button"
                          className={`ref-menu-item ${chartMetric === 'transactions' ? 'active' : ''}`}
                          onClick={() => {
                            setChartMetric('transactions')
                            setIsMetricDropdownOpen(false)
                          }}
                        >
                          <span>Transactions</span>
                          {chartMetric === 'transactions' && <span style={{ color: ACCENT }}>✓</span>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {trendData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
                    No trend records available for this period.
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 280, minHeight: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        key={`sales-area-${chartMetric}`}
                        data={trendData}
                        margin={{ top: 18, right: 16, left: 4, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="refSalesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0D9488" stopOpacity={0.24} />
                            <stop offset="95%" stopColor="#0D9488" stopOpacity={0.00} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F2" vertical={false} />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: MUTED, fontSize: 11, fontWeight: 600 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={chartMetric === 'transactions' ? 52 : 72}
                          domain={[0, 'auto']}
                          tick={{ fill: MUTED, fontSize: 11, fontWeight: 600 }}
                          tickFormatter={val => {
                            if (chartMetric === 'transactions') {
                              if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
                              return String(val)
                            }
                            if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(1)}Cr`
                            if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)}L`
                            if (val >= 1000) return `₹ ${(val / 1000).toFixed(0)}K`
                            return `₹ ${val % 1 !== 0 ? Number(val.toFixed(2)) : val}`
                          }}
                        />
                        <Tooltip content={<CustomAreaTooltip metric={chartMetric} />} />
                        <Area
                          type="monotone"
                          dataKey={chartMetric === 'transactions' ? 'transactions' : 'revenue'}
                          stroke="#0D9488"
                          strokeWidth={2.8}
                          fill="url(#refSalesAreaGrad)"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-in-out"
                          dot={{ r: 4, fill: '#0D9488', stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: PRIMARY, stroke: '#0D9488', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Payment Method Breakdown (Chunky Donut + Clean Aligned Table) */}
              <div className="ref-panel">
                <div className="ref-panel-header">
                  <div>
                    <h2 className="ref-panel-title">Payment Method Breakdown</h2>
                    <p className="ref-panel-desc">Channel share of orders & amount</p>
                  </div>
                </div>

                {breakdownList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
                    No payment breakdown available for this period.
                  </div>
                ) : (
                  <div className="ref-donut-container">
                    {/* Donut with Interactive Center Sync */}
                    <div className="ref-donut-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={88}
                            paddingAngle={2.5}
                            minAngle={5}
                            stroke="#fff"
                            strokeWidth={2}
                            onMouseEnter={(_, idx) => setHoveredSlice(idx)}
                            onMouseLeave={() => setHoveredSlice(null)}
                            onClick={(_, idx) => setHoveredSlice(prev => prev === idx ? null : idx)}
                            isAnimationActive={true}
                            animationDuration={800}
                          >
                            {donutData.map((entry, index) => (
                              <Cell
                                key={`donut-${index}`}
                                fill={entry.color}
                                opacity={hoveredSlice === null || hoveredSlice === index ? 1 : 0.35}
                                style={{ outline: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="ref-donut-center-info">
                        {hoveredSlice !== null && donutData[hoveredSlice] ? (
                          <>
                            <div className="ref-donut-center-val" style={{ fontSize: 15, color: donutData[hoveredSlice].color, fontWeight: 800 }}>
                              {inr(donutData[hoveredSlice].total)}
                            </div>
                            <div className="ref-donut-center-lbl" style={{ color: DARK, fontWeight: 800, fontSize: 10 }}>
                              {donutData[hoveredSlice].name}
                            </div>
                            <div style={{ fontSize: 9.5, color: MUTED, fontWeight: 700, marginTop: 2 }}>
                              {donutData[hoveredSlice].count.toLocaleString('en-IN')} orders ({donutData[hoveredSlice].percentage?.toFixed(1) || 0}%)
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="ref-donut-center-val">
                              <AnimatedNumber value={summary.total_transactions} />
                            </div>
                            <div className="ref-donut-center-lbl">TOTAL TRANSACTIONS</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Breakdown List Table with Explicit Column Separations & Hover Sync */}
                    <div className="ref-breakdown-table-box">
                      <table className="ref-breakdown-table">
                        <thead>
                          <tr>
                            <th className="ref-th-method">Payment Method</th>
                            <th className="ref-th-count">Count</th>
                            <th className="ref-th-amt">Amount</th>
                            <th className="ref-th-pct">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {breakdownList.map((b, bIdx) => (
                            <tr
                              key={b.method}
                              onMouseEnter={() => setHoveredSlice(bIdx)}
                              onMouseLeave={() => setHoveredSlice(null)}
                              onClick={() => setHoveredSlice(prev => prev === bIdx ? null : bIdx)}
                              style={{
                                cursor: 'pointer',
                                background: hoveredSlice === bIdx ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <td className="ref-td-method">
                                <div className="ref-method-name-cell">
                                  <span className="ref-method-dot" style={{ background: b.color }} />
                                  <span style={{ fontWeight: hoveredSlice === bIdx ? 800 : 700 }}>{b.label}</span>
                                </div>
                              </td>
                              <td className="ref-td-count">
                                {b.count.toLocaleString('en-IN')}
                              </td>
                              <td className="ref-td-amt">
                                {inr(b.amount)}
                              </td>
                              <td className="ref-td-pct">
                                {b.percentage.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 5. SECONDARY ANALYTICS: Monthly Sales Trend & Sales Summary ── */}
            <div className="ref-sub-grid">
              {/* Monthly Sales Trend Bar Chart */}
              <div className="ref-panel">
                <div className="ref-panel-header">
                  <div>
                    <h2 className="ref-panel-title">Monthly Sales Trend</h2>
                    <p className="ref-panel-desc">Revenue performance across the available period</p>
                  </div>
                  {realSummary.maxRev > 0 && (
                    <div className="ref-pill-dropdown" style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' }}>
                      Peak: {inr(realSummary.maxRev)}
                    </div>
                  )}
                </div>

                <div style={{ width: '100%', height: 180, minHeight: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trendData}
                      margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F2" vertical={false} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: MUTED, fontSize: 11, fontWeight: 600 }}
                        dy={6}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: MUTED, fontSize: 11, fontWeight: 600 }}
                        tickFormatter={val => {
                          if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(1)}Cr`
                          if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)}L`
                          if (val >= 1000) return `₹ ${(val / 1000).toFixed(0)}K`
                          return `₹ ${val % 1 !== 0 ? Number(val.toFixed(2)) : val}`
                        }}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="revenue"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                      >
                        {trendData.map((entry, index) => {
                          const isMax = Number(entry.revenue) === realSummary.maxRev && realSummary.maxRev > 0
                          return (
                            <Cell
                              key={`bar-${index}`}
                              fill={isMax ? GOLD : PRIMARY}
                            />
                          )
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sales Summary (2x2 Real Derived Tiles) */}
              <div className="ref-panel">
                <div className="ref-panel-header">
                  <div>
                    <h2 className="ref-panel-title">Sales Summary</h2>
                    <p className="ref-panel-desc">Platform-wide aggregate key metrics</p>
                  </div>
                </div>

                <div className="ref-summary-tiles">
                  {/* Tile 1: Total Revenue */}
                  <div className="ref-tile">
                    <div className="ref-tile-icon-circle gold">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v12M15 9.5H9.5a2.5 2.5 0 0 0 0 5H14" />
                      </svg>
                    </div>
                    <div className="ref-tile-meta">
                      <div className="ref-tile-label">Total Revenue</div>
                      <div className="ref-tile-val">
                        <AnimatedNumber value={summary.total_revenue} prefix="₹ " />
                      </div>
                    </div>
                  </div>

                  {/* Tile 2: Total Transactions */}
                  <div className="ref-tile">
                    <div className="ref-tile-icon-circle amber">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div className="ref-tile-meta">
                      <div className="ref-tile-label">Total Transactions</div>
                      <div className="ref-tile-val">
                        <AnimatedNumber value={summary.total_transactions} />
                      </div>
                    </div>
                  </div>

                  {/* Tile 3: Total Coins Sold */}
                  <div className="ref-tile">
                    <div className="ref-tile-icon-circle green">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="5" strokeWidth="1.8" />
                      </svg>
                    </div>
                    <div className="ref-tile-meta">
                      <div className="ref-tile-label">Total Coins Sold</div>
                      <div className="ref-tile-val">
                        <AnimatedNumber value={summary.total_coins_sold} />
                      </div>
                    </div>
                  </div>

                  {/* Tile 4: Highest Sales Month */}
                  <div className="ref-tile">
                    <div className="ref-tile-icon-circle purple">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className="ref-tile-meta">
                      <div className="ref-tile-label">Highest Sales Month</div>
                      <div className="ref-tile-val">{realSummary.maxMonth}</div>
                      {realSummary.maxRev > 0 && (
                        <div className="ref-tile-sub">{inr(realSummary.maxRev)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 6. RECENT TRANSACTIONS TABLE ── */}
            <div className="ref-txns-panel">
              <div className="ref-txns-header">
                <h2 className="ref-txns-title">Recent Transactions</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#F9FAFA', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: DARK, width: 170 }}
                  />
                </div>
              </div>

              {filteredTxns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: MUTED }}>
                  No transactions found for this period.
                </div>
              ) : (
                <div className="ref-table-scroll">
                  <table className="ref-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60, textAlign: 'center' }}>S.NO</th>
                        <th style={{ textAlign: 'left', minWidth: 200 }}>Customer</th>
                        <th style={{ textAlign: 'left', minWidth: 170 }}>Order ID</th>
                        <th style={{ textAlign: 'right', minWidth: 120, paddingRight: 24 }}>Amount</th>
                        <th style={{ textAlign: 'center', minWidth: 140 }}>Payment Method</th>
                        <th style={{ textAlign: 'left', minWidth: 160 }}>Date & Time</th>
                        <th style={{ width: 60, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableLoading ? (
                        Array.from({ length: 8 }).map((_, sIdx) => (
                          <tr key={`tbl-skel-${sIdx}`}>
                            <td style={{ textAlign: 'center' }}><div className="ref-shimmer" style={{ width: 22, height: 14, margin: '0 auto', borderRadius: 4 }} /></td>
                            <td><div className="ref-shimmer" style={{ width: 140, height: 14, borderRadius: 4 }} /></td>
                            <td><div className="ref-shimmer" style={{ width: 120, height: 22, borderRadius: 6 }} /></td>
                            <td style={{ textAlign: 'right', paddingRight: 24 }}><div className="ref-shimmer" style={{ width: 75, height: 14, marginLeft: 'auto', borderRadius: 4 }} /></td>
                            <td style={{ textAlign: 'center' }}><div className="ref-shimmer" style={{ width: 85, height: 22, margin: '0 auto', borderRadius: 6 }} /></td>
                            <td><div className="ref-shimmer" style={{ width: 130, height: 14, borderRadius: 4 }} /></td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="ref-shimmer" style={{ width: 28, height: 28, borderRadius: 6, margin: '0 auto' }} />
                            </td>
                          </tr>
                        ))
                      ) : filteredTxns.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: MUTED }}>
                            No transactions found for this period.
                          </td>
                        </tr>
                      ) : (
                        filteredTxns.map((t, idx) => {
                          const style = getMethodStyle(t.payment_method)
                          const isCopied = copiedId === (t.order_id || t.transaction_id)

                          return (
                            <tr
                              key={t.order_id || idx}
                              onClick={() => setSelectedTxn(t)}
                              style={{ cursor: 'pointer' }}
                            >
                              {/* S.NO */}
                              <td style={{ textAlign: 'center', color: MUTED, fontWeight: 700, fontSize: 12 }}>
                                {startIdx + idx}
                              </td>

                              {/* Customer: Both Customer Name AND Customer ID */}
                              <td style={{ textAlign: 'left' }}>
                                {(() => {
                                  const cust = getCustomerDisplay(t)
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      <span style={{ fontWeight: 700, color: DARK, fontSize: 13, lineHeight: 1.25 }}>
                                        {cust.name}
                                      </span>
                                      {cust.id && cust.id !== '—' && (
                                        <span style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.02em' }}>
                                          {cust.id}
                                        </span>
                                      )}
                                    </div>
                                  )
                                })()}
                              </td>

                              {/* Order ID with Copy button */}
                              <td style={{ textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F8FAFA', border: `1px solid ${BORDER}`, padding: '4px 8px', borderRadius: 6 }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: PRIMARY, fontSize: 12 }}>
                                    {t.order_id || t.transaction_id}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(t.order_id || t.transaction_id)}
                                    title="Copy Order ID"
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', padding: 0 }}
                                  >
                                    {isCopied ? (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    ) : (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Amount (standard right alignment for finance data) */}
                              <td style={{ textAlign: 'right', fontWeight: 800, color: PRIMARY, fontSize: 13.5, paddingRight: 24, fontVariantNumeric: 'tabular-nums' }}>
                                {inr(t.amount)}
                              </td>

                              {/* Payment Method Badge */}
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  className="ref-badge"
                                  style={{
                                    background: style.bg,
                                    color: style.text,
                                    display: 'inline-flex',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                  </svg>
                                  {style.label}
                                </span>
                              </td>

                              {/* Date & Time */}
                              <td style={{ textAlign: 'left', color: MUTED, whiteSpace: 'nowrap', fontSize: 12 }}>
                                {fmtDate(t.created_at)}
                              </td>

                              {/* Interactive Action Menu (SVG 3-dots button) */}
                              <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="ref-action-icon-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (menuAnchor && menuAnchor.txn?.order_id === t.order_id) {
                                      setMenuAnchor(null)
                                      return
                                    }
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const spaceBelow = window.innerHeight - rect.bottom
                                    const openUp = spaceBelow < 165 && rect.top > 165
                                    setMenuAnchor({
                                      txn: t,
                                      openUp,
                                      top: openUp ? undefined : (rect.bottom + 4),
                                      bottom: openUp ? (window.innerHeight - rect.top + 4) : undefined,
                                      right: Math.max(12, window.innerWidth - rect.right),
                                    })
                                  }}
                                  title="Order actions"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="5" r="2.2" />
                                    <circle cx="12" cy="12" r="2.2" />
                                    <circle cx="12" cy="19" r="2.2" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Viewport Floating Fixed Action Popover (Zero Clipping, Never Cutoff by Table/Header) */}
              {menuAnchor && (
                <div
                  className="ref-action-popover"
                  style={{
                    position: 'fixed',
                    top: menuAnchor.top != null ? `${menuAnchor.top}px` : 'auto',
                    bottom: menuAnchor.bottom != null ? `${menuAnchor.bottom}px` : 'auto',
                    right: `${menuAnchor.right}px`,
                    zIndex: 99999,
                    minWidth: 190,
                    boxShadow: '0 18px 40px rgba(12,64,68,.22), 0 4px 12px rgba(0,0,0,.08)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="ref-action-popover-item"
                    onClick={() => {
                      setSelectedTxn(menuAnchor.txn)
                      setMenuAnchor(null)
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View Order Details
                  </button>

                  <button
                    type="button"
                    className="ref-action-popover-item"
                    onClick={() => {
                      copyToClipboard(menuAnchor.txn?.order_id)
                      setMenuAnchor(null)
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy Order ID
                  </button>

                  <button
                    type="button"
                    className="ref-action-popover-item"
                    onClick={() => {
                      const tPrint = menuAnchor.txn
                      setSelectedTxn(tPrint)
                      setMenuAnchor(null)
                      setTimeout(() => window.print(), 350)
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print Order Slip
                  </button>
                </div>
              )}

              {/* Table Footer with Numbered Pagination */}
              <div className="ref-table-footer">
                <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
                  Showing {startIdx.toLocaleString('en-IN')} - {endIdx.toLocaleString('en-IN')} of {totalTransactions.toLocaleString('en-IN')} transactions
                </div>

                <div className="ref-page-buttons">
                  <button
                    type="button"
                    className="ref-page-btn"
                    disabled={page <= 1 || tableLoading}
                    onClick={() => goToPage(page - 1)}
                    title="Previous page"
                  >
                    ‹
                  </button>

                  {paginationItems.map((item, pIdx) => {
                    if (item === '...') {
                      return (
                        <span key={`dots-${pIdx}`} style={{ padding: '0 4px', color: MUTED, fontWeight: 700 }}>
                          ...
                        </span>
                      )
                    }
                    return (
                      <button
                        key={`page-${item}`}
                        type="button"
                        className={`ref-page-btn ${page === item ? 'active' : ''}`}
                        disabled={tableLoading}
                        onClick={() => goToPage(item)}
                      >
                        {item}
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    className="ref-page-btn"
                    disabled={page >= totalPages || tableLoading}
                    onClick={() => goToPage(page + 1)}
                    title="Next page"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            {/* ── Order Details Dialog Modal (100% Real Database Fields) ── */}
            {selectedTxn && (
              <div className="ref-modal-overlay" onClick={() => setSelectedTxn(null)}>
                <div className="ref-modal-card" onClick={e => e.stopPropagation()}>
                  <div className="ref-modal-header">
                    <h3 className="ref-modal-title">Order Details</h3>
                    <button className="ref-modal-close" onClick={() => setSelectedTxn(null)}>✕</button>
                  </div>

                  <div className="ref-modal-row">
                    <span className="ref-modal-lbl">Order ID</span>
                    <span className="ref-modal-val" style={{ fontFamily: 'monospace', color: PRIMARY, fontWeight: 700 }}>
                      {selectedTxn.order_id || selectedTxn.transaction_id}
                    </span>
                  </div>

                  {(() => {
                    const cust = getCustomerDisplay(selectedTxn)
                    return (
                      <>
                        <div className="ref-modal-row">
                          <span className="ref-modal-lbl">Customer ID</span>
                          <span className="ref-modal-val" style={{ fontFamily: 'monospace', color: ACCENT, fontWeight: 700 }}>
                            {cust.id}
                          </span>
                        </div>

                        <div className="ref-modal-row">
                          <span className="ref-modal-lbl">Customer Name</span>
                          <span className="ref-modal-val" style={{ fontWeight: 700 }}>
                            {cust.name}
                          </span>
                        </div>
                      </>
                    )
                  })()}

                  {selectedTxn.customer_phone && (
                    <div className="ref-modal-row">
                      <span className="ref-modal-lbl">Customer Phone</span>
                      <span className="ref-modal-val">{selectedTxn.customer_phone}</span>
                    </div>
                  )}

                  {(selectedTxn.city || selectedTxn.state) && (
                    <div className="ref-modal-row">
                      <span className="ref-modal-lbl">Location</span>
                      <span className="ref-modal-val">{[selectedTxn.city, selectedTxn.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}

                  {selectedTxn.product_name && (
                    <div className="ref-modal-row">
                      <span className="ref-modal-lbl">Product & Qty</span>
                      <span className="ref-modal-val">{selectedTxn.product_name} (Qty: {selectedTxn.quantity || 1})</span>
                    </div>
                  )}

                  <div className="ref-modal-row">
                    <span className="ref-modal-lbl">Order Status</span>
                    <span className="ref-modal-val" style={{ textTransform: 'capitalize', color: '#059669' }}>
                      {selectedTxn.status || 'Confirmed'}
                    </span>
                  </div>

                  <div className="ref-modal-row">
                    <span className="ref-modal-lbl">Payment Method</span>
                    <span className="ref-modal-val">{fmtMethod(selectedTxn.payment_method)}</span>
                  </div>

                  <div className="ref-modal-row">
                    <span className="ref-modal-lbl">Gross Amount</span>
                    <span className="ref-modal-val" style={{ fontSize: 15, color: PRIMARY, fontWeight: 800 }}>
                      {inr(selectedTxn.amount)}
                    </span>
                  </div>

                  {selectedTxn.coins != null && Number(selectedTxn.coins) > 0 && (
                    <div className="ref-modal-row">
                      <span className="ref-modal-lbl">AUG Coins Used</span>
                      <span className="ref-modal-val" style={{ color: GOLD }}>
                        {Number(selectedTxn.coins).toLocaleString('en-IN')} AUG Coins
                      </span>
                    </div>
                  )}

                  <div className="ref-modal-row">
                    <span className="ref-modal-lbl">Date & Time</span>
                    <span className="ref-modal-val">{fmtDate(selectedTxn.created_at)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedTxn.order_id)}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 8,
                        border: `1.5px solid ${BORDER}`,
                        background: '#fff',
                        color: PRIMARY,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedId === selectedTxn.order_id ? '✓ Copied ID' : 'Copy Order ID'}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 8,
                        border: `1.5px solid ${ACCENT}`,
                        background: '#fff',
                        color: ACCENT,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Print Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTxn(null)}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 8,
                        border: 'none',
                        background: PRIMARY,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
