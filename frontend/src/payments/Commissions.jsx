import { useEffect, useRef, useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

const ROLE_TABS = [
  { key: 'admin', label: 'Super Stockist', idKey: 'admin_id', short: 'SS' },
  { key: 'dealer', label: 'Distributor', idKey: 'dealer_id', short: 'DIS' },
  { key: 'sub_dealer', label: 'Wholesale Dealer', idKey: 'sub_dealer_id', short: 'WD' },
  { key: 'promotor', label: 'Retailer', idKey: 'promotor_id', short: 'RET' },
  { key: 'customer', label: 'Customer', idKey: 'customer_id', short: 'CUS' },
]

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

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 800 }) {
  const [displayVal, setDisplayVal] = useState(Number(value || 0))
  const currentValRef = useRef(Number(value || 0))
  const animRef = useRef(null)

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

function CustomAreaTooltip({ active, payload, label, metric = 'revenue' }) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div style={{
        background: '#0E4348',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: 10,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        fontSize: 12,
        fontWeight: 600,
      }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#2DD4BF' }}>
          {metric === 'revenue' ? inr(val) : `${Number(val).toLocaleString('en-IN')} Transactions`}
        </div>
      </div>
    )
  }
  return null
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Montserrat:wght@400;500;600;700;800;900&display=swap');

  .cms-page {
    min-height: 100vh;
    background: #F4F7F6;
    font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
    color: ${DARK};
    padding-bottom: 80px;
  }

  .cms-main {
    max-width: 1360px;
    margin: 0 auto;
    padding: 32px 24px 0;
    box-sizing: border-box;
  }

  .cms-headrow {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .cms-kicker {
    font-size: 11.5px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${ACCENT};
    margin-bottom: 6px;
  }

  .cms-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 3.4vw, 40px);
    font-weight: 800;
    color: ${PRIMARY};
    margin: 0 0 8px;
    line-height: 1.15;
  }

  .cms-note {
    font-size: 13px;
    color: ${MUTED};
    margin: 0;
    max-width: 760px;
    line-height: 1.55;
    font-weight: 500;
  }

  .cms-download-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    color: ${PRIMARY};
    border: 1.5px solid ${PRIMARY};
    padding: 10px 20px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(14,67,72,0.06);
    flex-shrink: 0;
  }
  .cms-download-btn:hover {
    background: ${PRIMARY};
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(14,67,72,0.14);
  }
  .cms-download-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Role Selection Tabs (Enterprise Level) */
  .cms-role-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
    margin-bottom: 18px;
  }
  .cms-role-tab {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 11px 22px;
    border-radius: 12px;
    border: 1.5px solid ${BORDER};
    background: #fff;
    color: ${DARK};
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
  .cms-role-tab:hover {
    border-color: ${ACCENT};
    color: ${PRIMARY};
    background: #FAFDFD;
  }
  .cms-role-tab.active {
    background: linear-gradient(135deg, ${PRIMARY}, ${DEEP});
    border-color: ${PRIMARY};
    color: #fff;
    box-shadow: 0 8px 20px rgba(14, 67, 72, 0.22);
  }
  .cms-role-badge {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 800;
    background: rgba(13, 148, 136, 0.12);
    color: ${ACCENT};
  }
  .cms-role-tab.active .cms-role-badge {
    background: rgba(255, 255, 255, 0.22);
    color: #fff;
  }

  /* Filter Controls */
  .cms-controls-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .cms-pill-group {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #fff;
    padding: 5px;
    border-radius: 14px;
    border: 1px solid ${BORDER};
    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  }
  .cms-pill-btn {
    padding: 7px 16px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: ${MUTED};
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .cms-pill-btn:hover {
    color: ${DARK};
  }
  .cms-pill-btn.active {
    background: ${PRIMARY};
    color: #fff;
    box-shadow: 0 3px 10px rgba(14, 67, 72, 0.18);
  }

  .cms-date-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    background: #fff;
    border: 1px solid ${BORDER};
    border-radius: 12px;
    color: ${DARK};
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    position: relative;
  }

  .cms-date-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #fff;
    border: 1px solid ${BORDER};
    border-radius: 14px;
    padding: 8px;
    box-shadow: 0 16px 36px rgba(0,0,0,0.12);
    z-index: 100;
    min-width: 170px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .cms-date-opt {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    background: transparent;
    font-size: 12px;
    font-weight: 600;
    color: ${DARK};
    cursor: pointer;
    text-align: left;
  }
  .cms-date-opt:hover {
    background: #F4F7F6;
  }
  .cms-date-opt.active {
    background: rgba(13, 148, 136, 0.1);
    color: ${ACCENT};
    font-weight: 800;
  }

  /* KPI Grid */
  .cms-kpi-grid {
    display: grid;
    grid-template-columns: 1.35fr 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (max-width: 1100px) {
    .cms-kpi-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 600px) {
    .cms-kpi-grid {
      grid-template-columns: 1fr;
    }
  }

  .cms-card {
    background: #fff;
    border: 1px solid ${BORDER};
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 6px 18px rgba(14,67,72,0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 140px;
    box-sizing: border-box;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .cms-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(14,67,72,0.08);
  }
  .cms-card.hero {
    background: linear-gradient(135deg, ${PRIMARY}, ${DEEP});
    border: none;
    color: #fff;
    box-shadow: 0 12px 30px rgba(14,67,72,0.22);
  }

  .cms-card-top {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .cms-card-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .cms-card-icon.hero {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
  .cms-card-icon.mint {
    background: rgba(13, 148, 136, 0.12);
    color: ${ACCENT};
  }
  .cms-card-icon.blue {
    background: rgba(37, 99, 235, 0.12);
    color: #2563EB;
  }
  .cms-card-icon.purple {
    background: rgba(124, 58, 237, 0.12);
    color: #7C3AED;
  }

  .cms-card-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: ${MUTED};
    margin-bottom: 6px;
  }
  .cms-card.hero .cms-card-label {
    color: rgba(255,255,255,0.75);
  }
  .cms-card-num {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-weight: 800;
    color: ${PRIMARY};
    line-height: 1.1;
  }
  .cms-card.hero .cms-card-num {
    color: #fff;
  }

  .cms-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(226, 235, 234, 0.6);
  }
  .cms-card.hero .cms-card-bottom {
    border-top: 1px solid rgba(255,255,255,0.14);
  }
  .cms-card-sub {
    font-size: 11.5px;
    color: ${MUTED};
    font-weight: 600;
  }
  .cms-card.hero .cms-card-sub {
    color: rgba(255,255,255,0.8);
  }

  /* Panels */
  .cms-panel {
    background: #fff;
    border: 1px solid ${BORDER};
    border-radius: 18px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 6px 20px rgba(14,67,72,0.04);
  }
  .cms-panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .cms-panel-title {
    font-size: 16px;
    font-weight: 800;
    color: ${PRIMARY};
    margin: 0 0 4px;
  }
  .cms-panel-desc {
    font-size: 12px;
    color: ${MUTED};
    margin: 0;
    font-weight: 500;
  }

  /* Vertical Bar Chart Pillars */
  .cms-chart-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    padding: 24px 0 10px;
  }
  .cms-chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    gap: 32px;
    height: 230px;
    padding: 0 20px;
    min-width: 340px;
    border-bottom: 2px solid #E2EBEA;
  }
  .cms-bar-col {
    flex: 1;
    max-width: 130px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
    cursor: pointer;
    transition: transform 0.18s ease;
  }
  .cms-bar-col:hover {
    transform: translateY(-4px);
  }
  .cms-bar-value {
    font-size: 12.5px;
    font-weight: 800;
    color: ${PRIMARY};
    margin-bottom: 12px;
    white-space: nowrap;
    background: #FAFDFD;
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px solid ${BORDER};
    box-shadow: 0 2px 8px rgba(14,67,72,0.06);
    transition: all 0.15s ease;
  }
  .cms-bar-col:hover .cms-bar-value {
    background: ${PRIMARY};
    color: #fff;
    border-color: ${PRIMARY};
    box-shadow: 0 4px 12px rgba(14,67,72,0.18);
  }
  .cms-bar {
    width: 100%;
    max-width: 58px;
    background: linear-gradient(180deg, #2DD4BF 0%, #0D9488 45%, #0E4348 100%);
    border-radius: 8px 8px 2px 2px;
    transition: height 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 6px 18px rgba(13, 148, 136, 0.22);
  }
  .cms-bar-col:hover .cms-bar {
    background: linear-gradient(180deg, #5EEAD4 0%, #0D9488 45%, #083B3F 100%);
    box-shadow: 0 10px 26px rgba(13, 148, 136, 0.35);
  }
  .cms-bar-label {
    font-size: 12px;
    font-weight: 700;
    color: ${MUTED};
    margin-top: 14px;
    white-space: nowrap;
  }
  .cms-bar-col:hover .cms-bar-label {
    color: ${PRIMARY};
    font-weight: 800;
  }

  /* Modern Leaderboard Table */
  .cms-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    border-radius: 12px;
    border: 1px solid ${BORDER};
  }
  .cms-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
  }
  .cms-table thead th {
    background: #FAFDFD;
    color: ${MUTED};
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    padding: 14px 16px;
    border-bottom: 1.5px solid ${BORDER};
    white-space: nowrap;
  }
  .cms-table tbody tr {
    transition: background 0.12s ease;
  }
  .cms-table tbody tr:hover {
    background: #F8FAFA;
  }
  .cms-table tbody td {
    padding: 14px 16px;
    border-bottom: 1px solid ${BORDER};
    vertical-align: middle;
  }
  .cms-table tbody tr:last-child td {
    border-bottom: none;
  }

  /* Rank Badges */
  .cms-rank-badge {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 12px;
  }
  .cms-rank-badge.top-1 {
    background: linear-gradient(135deg, #F59E0B, #D97706);
    color: #fff;
    box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3);
  }
  .cms-rank-badge.top-2 {
    background: linear-gradient(135deg, #94A3B8, #64748B);
    color: #fff;
  }
  .cms-rank-badge.top-3 {
    background: linear-gradient(135deg, #D97706, #B45309);
    color: #fff;
  }
  .cms-rank-badge.regular {
    background: #F4F7F6;
    color: ${MUTED};
  }

  /* Avatar Circle */
  .cms-avatar {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, ${PRIMARY}, ${ACCENT});
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 13px;
    flex-shrink: 0;
  }

  /* Drill-down history accordion */
  .cms-history-panel {
    background: #FAFDFD;
    padding: 18px 24px 22px;
    border-bottom: 1.5px solid ${BORDER};
  }
  .cms-history-card {
    background: #fff;
    border: 1px solid ${BORDER};
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }

  /* Shimmer Pulse Loading */
  @keyframes shimmerPulse {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .ref-shimmer {
    background: linear-gradient(90deg, #F0F4F4 25%, #E2EAEA 50%, #F0F4F4 75%);
    background-size: 200% 100%;
    animation: shimmerPulse 1.6s infinite ease-in-out;
  }
`

export default function Commissions() {
  const [role, setRole] = useState('admin')
  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeFilter, setActiveFilter] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [expandedUserId, setExpandedUserId] = useState(null)
  const [historyByUser, setHistoryByUser] = useState({})
  const [historyLoading, setHistoryLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const [chartMetric, setChartMetric] = useState('revenue') // 'revenue' | 'transactions'

  const fetchIdRef = useRef(0)

  // Close open popovers on outside click
  useEffect(() => {
    const handleOutside = () => {
      setIsDateDropdownOpen(false)
    }
    window.addEventListener('click', handleOutside)
    return () => window.removeEventListener('click', handleOutside)
  }, [])

  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const fetchData = async (r = role, p = 1, period = activeFilter, from = customFrom, to = customTo) => {
    const fetchId = ++fetchIdRef.current
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/tier-commission/?role=${r}&page=${p}&period=${period}`
      if (period === 'custom' && from && to) url += `&start_date=${from}&end_date=${to}`
      const res = await api.get(url)
      if (fetchId !== fetchIdRef.current) return
      setSummary({
        total_commission: res.data.total_commission,
        total_coins: res.data.total_coins,
        total_transactions: res.data.total_transactions,
        total_earners: res.data.total_earners,
        monthly_trend: res.data.monthly_trend || [],
      })
      setRows(prev => p === 1 ? res.data.leaderboard : [...prev, ...res.data.leaderboard])
      setHasMore(res.data.has_more)
      setPage(p)
      setLoadError(false)
    } catch {
      if (fetchId !== fetchIdRef.current) return
      setLoadError(true)
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchData('admin', 1, 'month', '', '')
  }, [])

  const handleRoleClick = (key) => {
    if (key === role) return
    setRole(key)
    setLoading(true)
    setExpandedUserId(null)
    setHistoryByUser({})
    fetchData(key, 1, activeFilter, customFrom, customTo)
  }

  const handleFilterClick = (key) => {
    setActiveFilter(key)
    setExpandedUserId(null)
    setHistoryByUser({})
    if (key !== 'custom') {
      setLoading(true)
      fetchData(role, 1, key, '', '')
    } else if (customFrom && customTo) {
      setLoading(true)
      fetchData(role, 1, 'custom', customFrom, customTo)
    }
  }

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    setLoading(true)
    setExpandedUserId(null)
    setHistoryByUser({})
    fetchData(role, 1, 'custom', customFrom, customTo)
  }

  const fetchHistory = async (userId, p = 1) => {
    setHistoryLoading(true)
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/tier-commission/?role=${role}&user_id=${userId}&page=${p}&period=${activeFilter}`
      if (activeFilter === 'custom' && customFrom && customTo) url += `&start_date=${customFrom}&end_date=${customTo}`
      const res = await api.get(url)
      setHistoryByUser(prev => ({
        ...prev,
        [userId]: {
          transactions: p === 1 ? res.data.transactions : [...(prev[userId]?.transactions || []), ...res.data.transactions],
          hasMore: res.data.has_more,
          page: p,
        },
      }))
    } catch {
      setHistoryByUser(prev => ({ ...prev, [userId]: { transactions: [], hasMore: false, page: 1, error: true } }))
    }
    setHistoryLoading(false)
  }

  const toggleHistory = (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      return
    }
    setExpandedUserId(userId)
    if (!historyByUser[userId]) fetchHistory(userId, 1)
  }

  const downloadReport = async () => {
    setDownloading(true)
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/tier-commission/?role=${role}&period=${activeFilter}&export=csv`
      if (activeFilter === 'custom' && customFrom && customTo) url += `&start_date=${customFrom}&end_date=${customTo}`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${role}-commission-leaderboard.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      // silent
    }
    setDownloading(false)
  }

  const activeTab = ROLE_TABS.find(t => t.key === role) || ROLE_TABS[0]

  // Filtered leaderboard rows
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const q = searchQuery.toLowerCase().trim()
    return rows.filter(r => {
      const name = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase()
      const idVal = String(r[activeTab.idKey] || r.user_id || '').toLowerCase()
      const city = String(r.city_name || '').toLowerCase()
      const phone = String(r.mobile_number || '').toLowerCase()
      return name.includes(q) || idVal.includes(q) || city.includes(q) || phone.includes(q)
    })
  }, [rows, searchQuery, activeTab])

  // Trend data formatted with exact decimals
  const trendData = useMemo(() => {
    if (!summary?.monthly_trend || summary.monthly_trend.length === 0) return []
    return summary.monthly_trend.map(t => ({
      month: t.month,
      revenue: Number(Number(t.revenue || 0).toFixed(2)),
      transactions: Number(t.transactions || 1),
    }))
  }, [summary?.monthly_trend])

  return (
    <div className="cms-page">
      <style>{styles}</style>
      <main className="cms-main">
        {/* Header */}
        <div className="cms-headrow">
          <div>
            <div className="cms-kicker">COMMISSION INTELLIGENCE</div>
            <h1 className="cms-title">Team Commissions</h1>
            <p className="cms-note">
              Comprehensive commission performance across every network tier — track distributor earnings, team residuals, and direct order rewards.
            </p>
          </div>

          <button
            type="button"
            className="cms-download-btn"
            onClick={downloadReport}
            disabled={downloading}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{downloading ? 'Generating PDF...' : 'Download Report'}</span>
          </button>
        </div>

        {/* 1. Tier Role Selector Tabs */}
        <div className="cms-role-bar">
          {ROLE_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`cms-role-tab ${role === tab.key ? 'active' : ''}`}
              onClick={() => handleRoleClick(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="cms-role-badge">{tab.short}</span>
            </button>
          ))}
        </div>

        {/* 2. Unified Filter Controls Bar */}
        <div className="cms-controls-bar">
          <div className="cms-pill-group">
            {FILTERS.map(f => (
              <button
                key={f.key}
                type="button"
                className={`cms-pill-btn ${activeFilter === f.key ? 'active' : ''}`}
                onClick={() => handleFilterClick(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Date Picker Popover */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="cms-date-btn"
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>
                {DATE_DROPDOWN_OPTIONS.find(o => o.key === activeFilter)?.label || 'This Month'}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ transform: isDateDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isDateDropdownOpen && (
              <div className="cms-date-popover">
                {DATE_DROPDOWN_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`cms-date-opt ${activeFilter === opt.key ? 'active' : ''}`}
                    onClick={() => {
                      setIsDateDropdownOpen(false)
                      handleFilterClick(opt.key)
                    }}
                  >
                    <span>{opt.label}</span>
                    {activeFilter === opt.key && <span style={{ color: ACCENT }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom Range Input (if selected) */}
        {activeFilter === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="date"
              className="cms-custom-date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 12.5 }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>to</span>
            <input
              type="date"
              className="cms-custom-date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 12.5 }}
            />
            <button
              type="button"
              onClick={applyCustomRange}
              style={{
                height: 38,
                padding: '0 20px',
                borderRadius: 20,
                border: 'none',
                background: ACCENT,
                color: '#fff',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              Apply Range
            </button>
          </div>
        )}

        {/* ── SKELETON LOADING STATE (WHILE FETCHING) ── */}
        {loading && (
          <div>
            <div className="cms-kpi-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={`skel-card-${i}`} className="cms-card">
                  <div className="cms-card-top">
                    <div className="ref-shimmer" style={{ width: 44, height: 44, borderRadius: 12 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="ref-shimmer" style={{ width: '45%', height: 12, borderRadius: 4 }} />
                      <div className="ref-shimmer" style={{ width: '70%', height: 26, borderRadius: 6 }} />
                    </div>
                  </div>
                  <div className="cms-card-bottom">
                    <div className="ref-shimmer" style={{ width: '50%', height: 12, borderRadius: 4 }} />
                    <div className="ref-shimmer" style={{ width: 85, height: 26, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="cms-panel" style={{ height: 320 }}>
              <div className="ref-shimmer" style={{ width: 220, height: 18, borderRadius: 4, marginBottom: 8 }} />
              <div className="ref-shimmer" style={{ width: 300, height: 12, borderRadius: 4, marginBottom: 24 }} />
              <div className="ref-shimmer" style={{ width: '100%', height: 210, borderRadius: 12 }} />
            </div>

            <div className="cms-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div className="ref-shimmer" style={{ width: 240, height: 18, borderRadius: 4 }} />
                <div className="ref-shimmer" style={{ width: 200, height: 34, borderRadius: 8 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={`skel-row-${i}`} className="ref-shimmer" style={{ width: '100%', height: 48, borderRadius: 8 }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE CONTENT (WHEN DATA LOADED) ── */}
        {!loading && summary && (
          <>
            {/* 3. Four KPI Hero Cards */}
            <div className="cms-kpi-grid">
              {/* Card 1: Total Commission (Dark Green Hero) */}
              <div className="cms-card hero">
                <div className="cms-card-top">
                  <div className="cms-card-icon hero">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <div className="cms-card-label">TOTAL {activeTab.label.toUpperCase()} COMMISSION</div>
                    <div className="cms-card-num">
                      <AnimatedNumber value={summary.total_commission} prefix="₹ " />
                    </div>
                  </div>
                </div>
                <div className="cms-card-bottom">
                  <span className="cms-card-sub">Accredited earnings across {activeTab.label} tier</span>
                  <Sparkline color="#2DD4BF" />
                </div>
              </div>

              {/* Card 2: Coins Credited */}
              <div className="cms-card">
                <div className="cms-card-top">
                  <div className="cms-card-icon mint">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v10" />
                      <path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0" />
                    </svg>
                  </div>
                  <div>
                    <div className="cms-card-label">COINS CREDITED</div>
                    <div className="cms-card-num">
                      <AnimatedNumber value={summary.total_coins || 0} />
                    </div>
                  </div>
                </div>
                <div className="cms-card-bottom">
                  <span className="cms-card-sub">AUG Coins wallet balance</span>
                  <Sparkline color="#10B981" />
                </div>
              </div>

              {/* Card 3: Earners Count */}
              <div className="cms-card">
                <div className="cms-card-top">
                  <div className="cms-card-icon blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <div className="cms-card-label">ACTIVE EARNERS</div>
                    <div className="cms-card-num">
                      <AnimatedNumber value={summary.total_earners || 0} />
                    </div>
                  </div>
                </div>
                <div className="cms-card-bottom">
                  <span className="cms-card-sub">Commission earners in period</span>
                  <Sparkline color="#3B82F6" />
                </div>
              </div>

              {/* Card 4: Transactions */}
              <div className="cms-card">
                <div className="cms-card-top">
                  <div className="cms-card-icon purple">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <div className="cms-card-label">TRANSACTIONS</div>
                    <div className="cms-card-num">
                      <AnimatedNumber value={summary.total_transactions || 0} />
                    </div>
                  </div>
                </div>
                <div className="cms-card-bottom">
                  <span className="cms-card-sub">Commission payout events</span>
                  <Sparkline color="#8B5CF6" />
                </div>
              </div>
            </div>

            {/* 4. Spline Trend Analytics Chart */}
            <div className="cms-panel">
              <div className="cms-panel-head">
                <div>
                  <h2 className="cms-panel-title">{activeTab.label} — Commission Performance Trend</h2>
                  <p className="cms-panel-desc">
                    Monthly historical commission distribution & transaction count
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 6, background: '#F4F7F6', padding: 4, borderRadius: 10 }}>
                  <button
                    type="button"
                    className={`cms-pill-btn ${chartMetric === 'revenue' ? 'active' : ''}`}
                    onClick={() => setChartMetric('revenue')}
                    style={{ padding: '6px 14px', fontSize: 11.5 }}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    type="button"
                    className={`cms-pill-btn ${chartMetric === 'transactions' ? 'active' : ''}`}
                    onClick={() => setChartMetric('transactions')}
                    style={{ padding: '6px 14px', fontSize: 11.5 }}
                  >
                    Transactions
                  </button>
                </div>
              </div>

              {trendData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: MUTED, fontSize: 13 }}>
                  No historical trend available for this tier.
                </div>
              ) : (
                <div className="cms-chart-wrap">
                  <div className="cms-chart">
                    {(() => {
                      const maxVal = Math.max(
                        ...trendData.map(t => (chartMetric === 'transactions' ? t.transactions : t.revenue)),
                        1
                      )
                      return trendData.map((t, idx) => {
                        const val = chartMetric === 'transactions' ? t.transactions : t.revenue
                        const heightPct = Math.max(20, Math.min(170, Math.round((val / maxVal) * 160)))
                        return (
                          <div className="cms-bar-col" key={t.month || idx}>
                            <div className="cms-bar-value">
                              {chartMetric === 'transactions' ? `${val} Txn${val > 1 ? 's' : ''}` : inr(val)}
                            </div>
                            <div
                              className="cms-bar"
                              style={{
                                height: `${heightPct}px`,
                              }}
                            />
                            <div className="cms-bar-label">{t.month}</div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Modern Enterprise Leaderboard Table */}
            <div className="cms-panel" style={{ padding: '24px 20px' }}>
              <div className="cms-panel-head">
                <div>
                  <h2 className="cms-panel-title">{activeTab.label} Leaderboard</h2>
                  <p className="cms-panel-desc">
                    Ranked by total commission earned in this period ({filteredRows.length} total recipients)
                  </p>
                </div>

                {/* Search Bar */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F8FAFA', border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '6px 14px', width: 'min(300px, 100%)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search name, ID, city..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: DARK, width: '100%' }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: MUTED, padding: 0 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {filteredRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED, fontSize: 13 }}>
                  No commission earners found for this filter.
                </div>
              ) : (
                <div className="cms-table-wrap">
                  <table className="cms-table">
                    <thead>
                      <tr>
                        <th style={{ width: 50, textAlign: 'center' }}>Rank</th>
                        <th style={{ minWidth: 220, textAlign: 'left' }}>Earner / Recipient</th>
                        <th style={{ minWidth: 160, textAlign: 'left' }}>Member ID</th>
                        <th style={{ minWidth: 140, textAlign: 'left' }}>City / Location</th>
                        <th style={{ minWidth: 120, textAlign: 'left' }}>Phone</th>
                        <th style={{ width: 110, textAlign: 'center' }}>Transactions</th>
                        <th style={{ width: 140, textAlign: 'right' }}>Coins Credited</th>
                        <th style={{ width: 160, textAlign: 'right', paddingRight: 24 }}>Total Commission</th>
                        <th style={{ width: 80, textAlign: 'center' }}>History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r, idx) => {
                        const rank = idx + 1
                        const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : 'regular'
                        const fullName = `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Member'
                        const memberId = r[activeTab.idKey] || `USR-${r.user_id}`
                        const isExpanded = expandedUserId === r.user_id
                        const historyData = historyByUser[r.user_id]
                        const isCopied = copiedId === memberId

                        return (
                          <>
                            <tr
                              key={r.user_id}
                              onClick={() => toggleHistory(r.user_id)}
                              style={{ cursor: 'pointer' }}
                            >
                              {/* Rank */}
                              <td style={{ textAlign: 'center' }}>
                                <span className={`cms-rank-badge ${rankClass}`}>
                                  {rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : rank}
                                </span>
                              </td>

                              {/* Earner Name & Avatar */}
                              <td style={{ textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div className="cms-avatar">
                                    {fullName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, color: DARK, fontSize: 13.5 }}>
                                      {fullName}
                                    </div>
                                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                                      {activeTab.label}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Member ID with copy */}
                              <td style={{ textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F8FAFA', border: `1px solid ${BORDER}`, padding: '4px 8px', borderRadius: 6 }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: PRIMARY, fontSize: 12 }}>
                                    {memberId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(memberId)}
                                    title="Copy ID"
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

                              {/* City */}
                              <td style={{ textAlign: 'left', color: DARK, fontWeight: 600, fontSize: 12.5 }}>
                                {r.city_name || '—'}
                              </td>

                              {/* Phone */}
                              <td style={{ textAlign: 'left', color: MUTED, fontSize: 12, fontFamily: 'monospace' }}>
                                {r.mobile_number || '—'}
                              </td>

                              {/* Txns Count */}
                              <td style={{ textAlign: 'center', fontWeight: 700, color: DARK }}>
                                {r.txn_count}
                              </td>

                              {/* Coins */}
                              <td style={{ textAlign: 'right', fontWeight: 700, color: ACCENT }}>
                                {Number(r.coins || 0).toLocaleString('en-IN')}
                              </td>

                              {/* Total Commission (Exact decimals) */}
                              <td style={{ textAlign: 'right', fontWeight: 900, color: PRIMARY, fontSize: 14.5, paddingRight: 24 }}>
                                {inr(r.total_commission)}
                              </td>

                              {/* Toggle Chevron Action */}
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleHistory(r.user_id)
                                  }}
                                  style={{
                                    border: 'none',
                                    background: isExpanded ? 'rgba(14,67,72,0.1)' : '#F4F7F6',
                                    borderRadius: 6,
                                    width: 28,
                                    height: 28,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: PRIMARY,
                                    transition: 'transform 0.15s ease',
                                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </button>
                              </td>
                            </tr>

                            {/* Accordion History Row */}
                            {isExpanded && (
                              <tr key={`history-${r.user_id}`}>
                                <td colSpan={9} style={{ padding: 0, background: '#FAFDFD' }}>
                                  <div className="cms-history-panel">
                                    <div className="cms-history-card">
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: MUTED }}>
                                          {fullName}’s Commission History ({activeFilter.toUpperCase()})
                                        </div>
                                        <div style={{ fontSize: 11.5, color: ACCENT, fontWeight: 700 }}>
                                          Total: {inr(r.total_commission)}
                                        </div>
                                      </div>

                                      {historyLoading && !historyData ? (
                                        <div style={{ padding: '20px 0', textAlign: 'center', color: MUTED, fontSize: 12 }}>
                                          Loading transaction history...
                                        </div>
                                      ) : !historyData?.transactions || historyData.transactions.length === 0 ? (
                                        <div style={{ padding: '20px 0', textAlign: 'center', color: MUTED, fontSize: 12 }}>
                                          No order transactions found for this period.
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          {historyData.transactions.map((tx, txIdx) => (
                                            <div
                                              key={tx.order_id || txIdx}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '10px 14px',
                                                background: '#FAFDFD',
                                                border: `1px solid ${BORDER}`,
                                                borderRadius: 8,
                                                fontSize: 12,
                                                gap: 12,
                                                flexWrap: 'wrap',
                                              }}
                                            >
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: PRIMARY }}>
                                                  {tx.order_id}
                                                </span>
                                                <span style={{ fontSize: 11, color: MUTED }}>
                                                  Buyer: <strong style={{ color: DARK }}>{tx.buyer}</strong>
                                                </span>
                                              </div>

                                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <span style={{
                                                  fontSize: 10,
                                                  fontWeight: 800,
                                                  background: 'rgba(13,148,136,0.12)',
                                                  color: ACCENT,
                                                  padding: '2px 8px',
                                                  borderRadius: 10,
                                                  textTransform: 'uppercase',
                                                }}>
                                                  Level {tx.level}
                                                </span>
                                                <span style={{ fontSize: 11, color: MUTED }}>
                                                  {fmtDate(tx.created_at)}
                                                </span>
                                                <span style={{ fontWeight: 900, color: PRIMARY, fontSize: 13 }}>
                                                  {inr(tx.amount)}
                                                </span>
                                              </div>
                                            </div>
                                          ))}

                                          {historyData.hasMore && (
                                            <button
                                              type="button"
                                              onClick={() => fetchHistory(r.user_id, (historyData.page || 1) + 1)}
                                              style={{
                                                marginTop: 8,
                                                padding: '8px 16px',
                                                borderRadius: 8,
                                                border: `1.5px solid ${BORDER}`,
                                                background: '#fff',
                                                color: PRIMARY,
                                                fontWeight: 800,
                                                fontSize: 12,
                                                cursor: 'pointer',
                                              }}
                                            >
                                              Load More Transactions
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
