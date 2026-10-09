import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  X,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  BarChart3,
  Percent,
  Tag,
  ArrowRight
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

// ── SMOOTH NUMBER COUNTER ANIMATION COMPONENT ──
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }) {
  const numVal = Number(value) || 0
  const [displayVal, setDisplayVal] = useState(numVal)
  const animRef = useRef(null)
  const currentValRef = useRef(numVal)

  useEffect(() => {
    const startVal = currentValRef.current
    const endVal = Number(value) || 0
    if (startVal === endVal) return

    const duration = 500
    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // cubic ease-out
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
  }, [value])

  const formatted = decimals > 0
    ? displayVal.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(displayVal).toLocaleString('en-IN')

  return <span>{prefix}{formatted}{suffix}</span>
}

// ── CUSTOM LUXURY CHART TOOLTIP COMPONENT ──
function CustomChartTooltip({ active, payload, label, isSilver = false }) {
  if (!active || !payload || !payload.length) return null
  const grams = payload.find(p => p.dataKey === 'grams')?.value ?? 0
  const revenue = payload[0]?.payload?.revenue ?? 0
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
        <span style={{ color: '#A7F3D0' }}>Revenue:</span>
        <span className="sadg-chart-tooltip-val">
          ₹ {Number(revenue).toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  )
}

export default function SuperAdminDigiGold() {
  // ── NAVIGATION & VIEW STATE ──
  // 'overview' | 'transactions' | 'gold_mgmt' | 'silver_mgmt' | 'user_buy' | 'gold_rates' | 'silver_rates'
  const [activeSection, setActiveSection] = useState('overview')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // ── FILTER STATE ──
  const [dateFilter, setDateFilter] = useState('week') // 'today' | 'week' | 'month' | 'year' | 'custom'
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return d.toISOString().slice(0, 10)
  })
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10))

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'completed' | 'pending' | 'cancelled'
  const [metalFilter, setMetalFilter] = useState('all') // 'all' | 'gold' | 'silver'
  const [txnTypeFilter, setTxnTypeFilter] = useState('all') // 'all' | 'buy' | 'sell' | 'convert'
  const [selectedUserCategory, setSelectedUserCategory] = useState('all') // 'all' | 'super_stockist' | 'distributor' | 'wholesale_dealer' | 'retailer' | 'customer' | 'general_customer'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // ── DATA STATE (INSTANT INITIAL LOAD FROM SESSIONSTORAGE) ──
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem('athirai_sadg_cache')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(() => !data)
  const [updatingRate, setUpdatingRate] = useState(false)
  const [rateForm, setRateForm] = useState({ gold_22k: '', silver_999: '' })
  const [rateFeedback, setRateFeedback] = useState(null)

  // ── FETCH DATA ──
  const fetchData = async () => {
    try {
      if (!data) setLoading(true)
      const params = {
        date_filter: dateFilter,
        status: statusFilter,
        metal: metalFilter,
        transaction_type: txnTypeFilter,
        user_category: selectedUserCategory,
      }
      if (dateFilter === 'custom') {
        params.start_date = customStartDate
        params.end_date = customEndDate
      }
      if (search.trim()) {
        params.search = search.trim()
      }

      const res = await api.get('/digi-gold/superadmin/', { params })
      setData(res.data)
      try {
        sessionStorage.setItem('athirai_sadg_cache', JSON.stringify(res.data))
      } catch {}

      // Initialize rateForm with live rates if empty
      if (res.data?.rates) {
        setRateForm({
          gold_22k: res.data.rates.gold_22k || '',
          silver_999: res.data.rates.silver_999 || '',
        })
      }
    } catch (err) {
      console.error('Failed to load SuperAdmin Digi Gold & Silver data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dateFilter, statusFilter, metalFilter, txnTypeFilter, selectedUserCategory])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchData()
  }

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

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1

  // ── CSV EXPORT ENGINE ──
  const handleExportCSV = () => {
    let filename = 'athirai-transactions.csv'
    let headers = []
    let rows = []

    if (activeSection === 'gold_rates' || activeSection === 'silver_rates') {
      filename = activeSection === 'gold_rates' ? 'athirai-gold-rate-history.csv' : 'athirai-silver-rate-history.csv'
      headers = ['Date', 'Gold 22K (INR/g)', 'Gold 24K (INR/g)', 'Silver 999 (INR/g)']
      rows = rateHistory.map(r => [r.date, r.gold_22k, r.gold_24k, r.silver_999])
    } else {
      if (activeSection === 'gold_mgmt') filename = 'athirai-gold-sales.csv'
      else if (activeSection === 'silver_mgmt') filename = 'athirai-silver-sales.csv'
      else if (activeSection === 'user_buy') filename = 'athirai-user-purchases.csv'

      headers = [
        'Date & Time', 'Transaction ID', 'Customer ID', 'Investor Name', 'Email',
        'User Category', 'Metal', 'Type', 'Quantity (g)', 'Rate (INR/g)',
        'Amount (INR)', 'Valuation (INR)', 'Profit/Loss (INR)', 'Payment Method', 'Status'
      ]
      rows = filteredItems.map(it => [
        it.datetime_str || it.date,
        it.transaction_id,
        it.customer_id,
        `"${it.investor_name}"`,
        it.user_email,
        `"${it.user_category}"`,
        it.metal_label,
        it.transaction_type,
        it.quantity_gm,
        it.rate,
        it.amount,
        it.current_valuation,
        it.profit,
        `"${it.payment_method}"`,
        it.status
      ])
    }

    if (!rows.length) return
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${filename.replace('.csv', '')}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── UPDATE MARKET RATES ──
  const handleUpdateRates = async (e) => {
    e.preventDefault()
    try {
      setUpdatingRate(true)
      setRateFeedback(null)
      const payload = {
        date: new Date().toISOString().slice(0, 10),
        gold_22k: parseFloat(rateForm.gold_22k),
        silver_999: parseFloat(rateForm.silver_999),
      }
      await api.post('/metal-rates/', payload)
      setRateFeedback({ type: 'success', message: 'Market benchmark rates updated successfully!' })
      fetchData()
    } catch (err) {
      console.error('Rate update error:', err)
      setRateFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to update rates.' })
    } finally {
      setUpdatingRate(false)
    }
  }

  // ── SIDEBAR NAVIGATION ITEMS (EXACT ORDER PER SPEC) ──
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'gold_mgmt', label: 'Gold Management', icon: Coins },
    { id: 'silver_mgmt', label: 'Silver Management', icon: Layers },
    { id: 'user_buy', label: 'User Buy Gold', icon: Users },
    { id: 'gold_rates', label: 'Gold Rates', icon: TrendingUp },
    { id: 'silver_rates', label: 'Silver Rates', icon: BarChart3 },
  ]

  const handleNavClick = (id) => {
    setActiveSection(id)
    setCurrentPage(1)
    setMobileSidebarOpen(false)
  }

  return (
    <div className="sadg-layout">
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
        {/* Mobile Toggle Button */}
        <div className="sadg-mobile-bar">
          <button
            type="button"
            className="sadg-mobile-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={16} />
            <span>Navigation Menu</span>
          </button>
          <span className="sadg-mobile-active-tag">
            {navItems.find(n => n.id === activeSection)?.label}
          </span>
        </div>

        {/* ── TOP HEADER (TITLE & ACTION CONTROLS) ── */}
        <div className="sadg-header">
          <div className="sadg-header-title-box">
            <div className="sadg-header-icon-badge">
              {activeSection === 'overview' && <Sparkles size={22} />}
              {activeSection === 'transactions' && <ReceiptText size={22} />}
              {activeSection === 'gold_mgmt' && <Coins size={22} />}
              {activeSection === 'silver_mgmt' && <Layers size={22} />}
              {activeSection === 'user_buy' && <Users size={22} />}
              {activeSection === 'gold_rates' && <TrendingUp size={22} />}
              {activeSection === 'silver_rates' && <BarChart3 size={22} />}
            </div>
            <div>
              <h1 className="sadg-title">
                {activeSection === 'overview' && 'Digi Gold & Silver Management'}
                {activeSection === 'transactions' && 'Transaction History'}
                {activeSection === 'gold_mgmt' && 'Gold Management'}
                {activeSection === 'silver_mgmt' && 'Silver Management'}
                {activeSection === 'user_buy' && 'User Buy Gold & Silver'}
                {activeSection === 'gold_rates' && 'Gold Benchmark Rates'}
                {activeSection === 'silver_rates' && 'Silver Benchmark Rates'}
              </h1>
              <p className="sadg-subtitle">
                {activeSection === 'overview' && 'Sales, holdings, transaction history and user-wise investment analytics.'}
                {activeSection === 'transactions' && 'Complete company-wide investor audit trail, verified buy/sell ledgers, and settlement records.'}
                {activeSection === 'gold_mgmt' && 'Detailed 22K Digi Gold sales analytics, vault weight accumulation, and investor ledgers.'}
                {activeSection === 'silver_mgmt' && 'Detailed Digi Silver sales analytics, purity metrics, and settlement ledgers.'}
                {activeSection === 'user_buy' && 'Tier-wise investor breakdown, network hierarchy sales volumes, and category purchase ledgers.'}
                {activeSection === 'gold_rates' && 'Live 22K benchmark bullion rates, historical movement trends, and pricing logs.'}
                {activeSection === 'silver_rates' && 'Live Pure 999 silver bullion rates, per-gram and per-kilogram valuations, and pricing history.'}
              </p>
            </div>
          </div>

          <div className="sadg-header-actions">
            <button
              type="button"
              className="sadg-btn-refresh"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'sadg-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="sadg-btn-export"
              onClick={handleExportCSV}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* ── DATE FILTER BAR (TODAY, WEEK, MONTH, YEAR, CUSTOM) ── */}
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
              <span>{dateRange.start_date} → {dateRange.end_date}</span>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
           VIEW 1: OVERVIEW DASHBOARD (ENTERPRISE LUXURY FINTECH)
           ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'overview' && (
          <>
            {/* SKELETON LOADING STATE WHEN DATA IS NOT READY */}
            {loading && !data ? (
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
                {/* 6 KPI CARDS ROW (SMOOTH ANIMATED NUMBERS, NEVER DASH OR N/A) */}
                <div className="sadg-kpi-grid">
                  {/* Card 1: Total Gold Sales */}
                  <div className="sadg-kpi-card">
                    <div className="sadg-kpi-icon-box gold">
                      <Coins size={18} />
                    </div>
                    <span className="sadg-kpi-label">Total Gold Sales</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_gold_sales_inr || 0} prefix="₹ " />
                    </b>
                    <span className="sadg-kpi-sub">Gross gold volume</span>
                  </div>

                  {/* Card 2: Gold Sold (g) */}
                  <div className="sadg-kpi-card">
                    <div className="sadg-kpi-icon-box gold">
                      <Sparkles size={18} />
                    </div>
                    <span className="sadg-kpi-label">Gold Sold (g)</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_gold_sold_gm || 0} decimals={3} suffix=" g" />
                    </b>
                    <span className="sadg-kpi-sub">Total weight credited</span>
                  </div>

                  {/* Card 3: Total Silver Sales */}
                  <div className="sadg-kpi-card">
                    <div className="sadg-kpi-icon-box silver">
                      <Layers size={18} />
                    </div>
                    <span className="sadg-kpi-label">Total Silver Sales</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_silver_sales_inr || 0} prefix="₹ " />
                    </b>
                    <span className="sadg-kpi-sub">Gross silver volume</span>
                  </div>

                  {/* Card 4: Silver Sold (g) */}
                  <div className="sadg-kpi-card">
                    <div className="sadg-kpi-icon-box silver">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="sadg-kpi-label">Silver Sold (g)</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_silver_sold_gm || 0} decimals={3} suffix=" g" />
                    </b>
                    <span className="sadg-kpi-sub">Total weight credited</span>
                  </div>

                  {/* Card 5: Total Transactions */}
                  <div className="sadg-kpi-card">
                    <div className="sadg-kpi-icon-box mint">
                      <ArrowLeftRight size={18} />
                    </div>
                    <span className="sadg-kpi-label">Total Transactions</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.total_transactions || 0} />
                    </b>
                    <span className="sadg-kpi-sub">Completed cycles</span>
                  </div>

                  {/* Card 6: Active Investors */}
                  <div className="sadg-kpi-card">
                    <div className="sadg-kpi-icon-box teal">
                      <Users size={18} />
                    </div>
                    <span className="sadg-kpi-label">Active Investors</span>
                    <b className="sadg-kpi-value">
                      <AnimatedNumber value={kpis.active_investors || 0} />
                    </b>
                    <span className="sadg-kpi-sub">Unique accounts</span>
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
                      <div className="sadg-chart-legend">
                        <span className="sadg-legend-item">
                          <span className="sadg-legend-line" style={{ background: '#009957' }} />
                          Gold (g)
                        </span>
                        <span className="sadg-legend-item">
                          <span className="sadg-legend-line" style={{ background: '#0A3E42' }} />
                          Revenue (₹)
                        </span>
                      </div>
                    </div>

                    <div className="sadg-chart-body">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={goldChart} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="sadgGoldGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#009957" stopOpacity={0.28} />
                              <stop offset="100%" stopColor="#009957" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                          <XAxis dataKey="date" stroke="#8E9E9C" fontSize={10.5} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                          <YAxis stroke="#8E9E9C" fontSize={10.5} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomChartTooltip isSilver={false} />} />
                          <Area
                            type="monotone"
                            dataKey="grams"
                            name="Gold (g)"
                            stroke="#009957"
                            strokeWidth={2.4}
                            fill="url(#sadgGoldGrad)"
                            dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                            activeDot={{ r: 6, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={850}
                            animationEasing="ease-out"
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
                      <div className="sadg-chart-legend">
                        <span className="sadg-legend-item">
                          <span className="sadg-legend-line" style={{ background: '#0284C7' }} />
                          Silver (g)
                        </span>
                        <span className="sadg-legend-item">
                          <span className="sadg-legend-line" style={{ background: '#0A3E42' }} />
                          Revenue (₹)
                        </span>
                      </div>
                    </div>

                    <div className="sadg-chart-body">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={silverChart} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="sadgSilverGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0284C7" stopOpacity={0.28} />
                              <stop offset="100%" stopColor="#0284C7" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                          <XAxis dataKey="date" stroke="#8E9E9C" fontSize={10.5} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                          <YAxis stroke="#8E9E9C" fontSize={10.5} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomChartTooltip isSilver={true} />} />
                          <Area
                            type="monotone"
                            dataKey="grams"
                            name="Silver (g)"
                            stroke="#0284C7"
                            strokeWidth={2.4}
                            fill="url(#sadgSilverGrad)"
                            dot={{ r: 3.5, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                            activeDot={{ r: 6, fill: '#0F172A', stroke: '#FFFFFF', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={850}
                            animationEasing="ease-out"
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
                        onClick={() => setActiveSection('gold_rates')}
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
                            <b>₹ <AnimatedNumber value={rates.gold_22k || 13200} /></b> / g
                          </td>
                          <td>
                            <span style={{ color: rates.diff_22k >= 0 ? '#009957' : '#DC5353', fontWeight: 700 }}>
                              {rates.diff_22k >= 0 ? '+' : ''}{rates.diff_22k || 0} ({rates.pct_22k || 0}%)
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
                            <b>₹ <AnimatedNumber value={rates.silver_999 || 225} decimals={2} /></b> / g
                          </td>
                          <td>
                            <span style={{ color: rates.diff_silver >= 0 ? '#009957' : '#DC5353', fontWeight: 700 }}>
                              {rates.diff_silver >= 0 ? '+' : ''}{rates.diff_silver || 0} ({rates.pct_silver || 0}%)
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
                        <Clock size={16} color="#009957" />
                        <h4 className="sadg-chart-title">Recent Transactions</h4>
                      </div>
                      <button
                        type="button"
                        className="sadg-view-all-link"
                        onClick={() => setActiveSection('transactions')}
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
                                <td><b>{row.quantity_label}</b></td>
                                <td>₹ {row.amount?.toLocaleString('en-IN')}</td>
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
                        onClick={() => setActiveSection('user_buy')}
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
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E2ECE7', fontSize: 12, fontWeight: 800, color: '#009957' }}>
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
                        onClick={() => setActiveSection('user_buy')}
                      >
                        <span>View All</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="sadg-role-grid">
                      <div className="sadg-role-card">
                        <span className="sadg-role-card-name">Super Stockist</span>
                        <span className="sadg-role-card-val">
                          <AnimatedNumber value={categorySummaries.super_stockist?.gold_gm || 0} decimals={3} suffix=" g" />
                        </span>
                        <span className="sadg-role-card-sub">
                          <AnimatedNumber value={categorySummaries.super_stockist?.user_count || 0} /> active users
                        </span>
                      </div>

                      <div className="sadg-role-card">
                        <span className="sadg-role-card-name">Distributor</span>
                        <span className="sadg-role-card-val">
                          <AnimatedNumber value={categorySummaries.distributor?.gold_gm || 0} decimals={3} suffix=" g" />
                        </span>
                        <span className="sadg-role-card-sub">
                          <AnimatedNumber value={categorySummaries.distributor?.user_count || 0} /> active users
                        </span>
                      </div>

                      <div className="sadg-role-card">
                        <span className="sadg-role-card-name">Retailer</span>
                        <span className="sadg-role-card-val">
                          <AnimatedNumber value={categorySummaries.retailer?.gold_gm || 0} decimals={3} suffix=" g" />
                        </span>
                        <span className="sadg-role-card-sub">
                          <AnimatedNumber value={categorySummaries.retailer?.user_count || 0} /> active users
                        </span>
                      </div>

                      <div className="sadg-role-card">
                        <span className="sadg-role-card-name">Customer</span>
                        <span className="sadg-role-card-val">
                          <AnimatedNumber value={categorySummaries.customer?.gold_gm || 0} decimals={3} suffix=" g" />
                        </span>
                        <span className="sadg-role-card-sub">
                          <AnimatedNumber value={categorySummaries.customer?.user_count || 0} /> active users
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
        {activeSection === 'transactions' && (
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
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#6A7D7C' }}>
                          Loading transactions...
                        </td>
                      </tr>
                    ) : paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#6A7D7C' }}>
                          No matching transactions found for this date range and filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((row) => (
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
                          <td><b>{row.quantity_label}</b></td>
                          <td>₹ {Number(row.rate).toLocaleString('en-IN')}</td>
                          <td><b>₹ {Number(row.amount).toLocaleString('en-IN')}</b></td>
                          <td>
                            <span className={`sadg-status-badge ${row.status}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="sadg-pagination-bar">
                <span>
                  Showing {filteredItems.length ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                  {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} records
                </span>
                <div className="sadg-page-btns">
                  <button
                    type="button"
                    className="sadg-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      type="button"
                      className={`sadg-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="sadg-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           VIEW 3: GOLD MANAGEMENT (DETAILED GOLD SALES)
           ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'gold_mgmt' && (
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

            {/* Gold Sales Chart (Smooth Spline AreaChart) */}
            <div className="sadg-chart-card" style={{ height: 260 }}>
              <div className="sadg-chart-head">
                <div className="sadg-chart-title-box">
                  <Coins size={18} color="#C6924B" />
                  <h4 className="sadg-chart-title">Digi Gold Sales Analytics Timeline</h4>
                </div>
                <div className="sadg-chart-legend">
                  <span className="sadg-legend-item">
                    <span className="sadg-legend-line" style={{ background: '#009957' }} />
                    Quantity Sold (g)
                  </span>
                  <span className="sadg-legend-item">
                    <span className="sadg-legend-line" style={{ background: '#0A3E42' }} />
                    Sales Inflow (₹)
                  </span>
                </div>
              </div>
              <div className="sadg-chart-body" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={goldChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldMgmtAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#009957" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#009957" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F1" />
                    <XAxis dataKey="date" stroke="#8E9E9C" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                    <YAxis stroke="#8E9E9C" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomChartTooltip isSilver={false} />} />
                    <Area
                      type="monotone"
                      dataKey="grams"
                      name="Gold (g)"
                      stroke="#009957"
                      strokeWidth={2.4}
                      fill="url(#goldMgmtAreaGrad)"
                      dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 6, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationDuration={850}
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
                          <td><b style={{ color: '#0A3E42' }}>{row.quantity_label}</b></td>
                          <td>₹ {Number(row.rate).toLocaleString('en-IN')}</td>
                          <td><b>₹ {Number(row.amount).toLocaleString('en-IN')}</b></td>
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
        {activeSection === 'silver_mgmt' && (
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
                  {kpis.total_silver_sold_gm > 0 ? `${(kpis.total_silver_sold_gm / 1000).toFixed(4)} kg` : 'Net silver weight'}
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
                  <AnimatedNumber value={kpis.avg_silver_rate || rates.silver_999 || 225} prefix="₹ " decimals={2} suffix=" / g" />
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

            {/* Silver Sales Chart (Smooth Spline AreaChart) */}
            <div className="sadg-chart-card" style={{ height: 260 }}>
              <div className="sadg-chart-head">
                <div className="sadg-chart-title-box">
                  <Layers size={18} color="#64748B" />
                  <h4 className="sadg-chart-title">Digi Silver Sales Analytics Timeline</h4>
                </div>
                <div className="sadg-chart-legend">
                  <span className="sadg-legend-item">
                    <span className="sadg-legend-line" style={{ background: '#0284C7' }} />
                    Quantity Sold (g)
                  </span>
                  <span className="sadg-legend-item">
                    <span className="sadg-legend-line" style={{ background: '#0A3E42' }} />
                    Sales Inflow (₹)
                  </span>
                </div>
              </div>
              <div className="sadg-chart-body" style={{ height: 200 }}>
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
                    <YAxis stroke="#8E9E9C" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomChartTooltip isSilver={true} />} />
                    <Area
                      type="monotone"
                      dataKey="grams"
                      name="Silver (g)"
                      stroke="#0284C7"
                      strokeWidth={2.4}
                      fill="url(#silverMgmtAreaGrad)"
                      dot={{ r: 3.5, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 6, fill: '#0F172A', stroke: '#FFFFFF', strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationDuration={850}
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
                          <td><b style={{ color: '#0A3E42' }}>{row.quantity_label}</b></td>
                          <td>₹ {Number(row.rate).toFixed(2)}</td>
                          <td><b>₹ {Number(row.amount).toLocaleString('en-IN')}</b></td>
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
        {activeSection === 'user_buy' && (
          <div className="sadg-full-section">
            {/* Category Dropdown & Summary */}
            <div className="sadg-filters-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#103F42', whiteSpace: 'nowrap' }}>
                  Select User Category:
                </span>
                <select
                  className="sadg-cat-dropdown"
                  style={{ maxWidth: 320 }}
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

              <div style={{ display: 'flex', gap: 10 }}>
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
              <div className="sadg-kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
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
                          <td><b>{row.quantity_label}</b></td>
                          <td>₹ {Number(row.rate).toLocaleString('en-IN')}</td>
                          <td><b>₹ {Number(row.amount).toLocaleString('en-IN')}</b></td>
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
        {activeSection === 'gold_rates' && (
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
                    Per mg: ₹ {((rates.gold_22k || 13200) / 1000).toFixed(2)} | Movement: {rates.diff_22k >= 0 ? '+' : ''}{rates.diff_22k || 0} ({rates.pct_22k || 0}%)
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
                    ₹ <AnimatedNumber value={rates.silver_999 || 225} decimals={2} /> <small style={{ fontSize: 14 }}>/ g</small>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Per Kilogram: ₹ {((rates.silver_999 || 225) * 1000).toLocaleString('en-IN')} | Movement: {rates.diff_silver >= 0 ? '+' : ''}{rates.diff_silver || 0} ({rates.pct_silver || 0}%)
                  </div>
                </div>
                <Layers size={38} color="#E2E8F0" />
              </div>
            </div>

            {/* Super Admin Rate Update Form (22K Gold & Pure 999 Silver Only) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2ECE7', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <ShieldCheck size={20} color="#009957" />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#103F42' }}>
                  Update Today's Official Benchmark Rates
                </h4>
              </div>

              {rateFeedback && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 700,
                  background: rateFeedback.type === 'success' ? '#E8F7F0' : '#FEE2E2',
                  color: rateFeedback.type === 'success' ? '#009957' : '#DC2626'
                }}>
                  {rateFeedback.message}
                </div>
              )}

              <form onSubmit={handleUpdateRates} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6A7D7C', marginBottom: 4 }}>
                    Gold 22K (₹/g):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="sadg-select-pill"
                    style={{ width: 160 }}
                    value={rateForm.gold_22k}
                    onChange={(e) => setRateForm({ ...rateForm, gold_22k: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6A7D7C', marginBottom: 4 }}>
                    Silver 999 (₹/g):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="sadg-select-pill"
                    style={{ width: 160 }}
                    value={rateForm.silver_999}
                    onChange={(e) => setRateForm({ ...rateForm, silver_999: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="sadg-btn-export"
                  disabled={updatingRate}
                  style={{ height: 38 }}
                >
                  <RefreshCw size={14} className={updatingRate ? 'sadg-spin' : ''} />
                  <span>{updatingRate ? 'Publishing...' : 'Publish Official Rates'}</span>
                </button>
              </form>
            </div>

            {/* Historical Gold Rate Table */}
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
                      <th>Gold 22K (₹/mg)</th>
                      <th>Silver 999 (₹/g)</th>
                      <th>Source Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#6A7D7C' }}>
                          No historical rate logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      rateHistory.map((r, idx) => (
                        <tr key={r.date_iso || idx}>
                          <td><b>{r.date}</b></td>
                          <td>₹ {Number(r.gold_22k).toLocaleString('en-IN')}</td>
                          <td>₹ {(Number(r.gold_22k) / 1000).toFixed(2)}</td>
                          <td>₹ {Number(r.silver_999).toFixed(2)}</td>
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
           VIEW 7: SILVER RATES (DEDICATED SECTION)
           ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'silver_rates' && (
          <div className="sadg-full-section">
            {/* Live Silver Rates Cards */}
            <div className="sadg-rates-display-grid">
              <div className="sadg-rate-banner-box silver">
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#E2E8F0', textTransform: 'uppercase' }}>
                    Digi Silver (Pure 999 Benchmark)
                  </span>
                  <div className="sadg-rate-banner-price">
                    ₹ {Number(rates.silver_999 || 275).toFixed(2)} <small style={{ fontSize: 14 }}>/ g</small>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Per Kilogram: ₹ {(Number(rates.silver_999 || 275) * 1000).toLocaleString('en-IN')} | Movement: {rates.diff_silver >= 0 ? '+' : ''}{rates.diff_silver || 0} ({rates.pct_silver || 0}%)
                  </div>
                </div>
                <Layers size={38} color="#E2E8F0" />
              </div>
            </div>

            {/* Historical Silver Rate Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2ECE7', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2ECE7', fontWeight: 800, fontSize: 15 }}>
                Official Silver Benchmark History
              </div>
              <div className="sadg-table-wrap">
                <table className="sadg-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Silver 999 (₹/g)</th>
                      <th>Silver 999 (₹/kg)</th>
                      <th>Movement Delta</th>
                      <th>Source Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#6A7D7C' }}>
                          No historical silver rate logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      rateHistory.map((r, idx) => (
                        <tr key={r.date_iso || idx}>
                          <td><b>{r.date}</b></td>
                          <td>₹ {Number(r.silver_999).toFixed(2)}</td>
                          <td>₹ {(Number(r.silver_999) * 1000).toLocaleString('en-IN')}</td>
                          <td>
                            <span style={{ color: '#009957', fontWeight: 700 }}>+0.00 (Benchmark)</span>
                          </td>
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
      </main>
    </div>
  )
}
