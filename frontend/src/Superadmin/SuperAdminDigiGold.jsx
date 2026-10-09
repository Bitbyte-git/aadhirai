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
import './SuperAdminDigiGold.css'

export default function SuperAdminDigiGold() {
  // ── NAVIGATION & VIEW STATE ──
  // 'overview' | 'transactions' | 'gold_mgmt' | 'silver_mgmt' | 'user_buy' | 'gold_rates' | 'silver_rates'
  const [activeSection, setActiveSection] = useState('overview')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // ── FILTER STATE ──
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
  const [txnTypeFilter, setTxnTypeFilter] = useState('all') // 'all' | 'buy' | 'sell' | 'convert'
  const [selectedUserCategory, setSelectedUserCategory] = useState('all') // 'all' | 'super_stockist' | 'distributor' | 'wholesale_dealer' | 'retailer' | 'customer' | 'general_customer'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // ── DATA STATE ──
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [updatingRate, setUpdatingRate] = useState(false)
  const [rateForm, setRateForm] = useState({ gold_22k: '', gold_24k: '', silver_999: '' })
  const [rateFeedback, setRateFeedback] = useState(null)

  // ── FETCH DATA ──
  const fetchData = async () => {
    try {
      setLoading(true)
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

      // Initialize rateForm with live rates if empty
      if (res.data?.rates) {
        setRateForm({
          gold_22k: res.data.rates.gold_22k || '',
          gold_24k: res.data.rates.gold_24k || '',
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
        gold_24k: parseFloat(rateForm.gold_24k),
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
      {/* ── LEFT SIDEBAR (DEEP TEAL #073E40) ── */}
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

        {/* Sidebar Bottom Decorative Card (Matching Image 1) */}
        <div className="sadg-sidebar-bottom">
          <div className="sadg-sidebar-promo-card">
            <div className="sadg-promo-img-wrap">
              <img
                src="/digi-gold/autopay_banner_gold.jpg"
                alt="Gold & Silver Bullion"
                className="sadg-promo-img"
                onError={(e) => { e.target.style.display = 'none' }}
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
                {activeSection === 'gold_mgmt' && 'Detailed 22K & 24K Digi Gold sales analytics, vault weight accumulation, and investor ledgers.'}
                {activeSection === 'silver_mgmt' && 'Detailed Digi Silver sales analytics, purity metrics, and settlement ledgers.'}
                {activeSection === 'user_buy' && 'Tier-wise investor breakdown, network hierarchy sales volumes, and category purchase ledgers.'}
                {activeSection === 'gold_rates' && 'Live 22K & 24K benchmark bullion rates, historical movement trends, and pricing logs.'}
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
           VIEW 1: OVERVIEW DASHBOARD (MATCHING IMAGE 1 EXACTLY)
           ══════════════════════════════════════════════════════════════ */}
        {activeSection === 'overview' && (
          <>
            {/* 6 KPI CARDS ROW */}
            <div className="sadg-kpi-grid">
              {/* Card 1: Total Gold Sales */}
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box gold">
                  <Coins size={18} />
                </div>
                <span className="sadg-kpi-label">Total Gold Sales</span>
                <b className="sadg-kpi-value">
                  {kpis.total_gold_sales_inr > 0 ? `₹ ${Number(kpis.total_gold_sales_inr).toLocaleString('en-IN')}` : '—'}
                </b>
                <span className="sadg-kpi-sub">
                  {kpis.total_gold_sales_inr > 0 ? 'Gross gold volume' : 'No data available'}
                </span>
              </div>

              {/* Card 2: Gold Sold (g) */}
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box gold">
                  <Sparkles size={18} />
                </div>
                <span className="sadg-kpi-label">Gold Sold (g)</span>
                <b className="sadg-kpi-value">
                  {kpis.total_gold_sold_gm > 0 ? `${Number(kpis.total_gold_sold_gm).toFixed(3)} g` : '—'}
                </b>
                <span className="sadg-kpi-sub">
                  {kpis.total_gold_sold_gm > 0 ? 'Total weight credited' : 'No data available'}
                </span>
              </div>

              {/* Card 3: Total Silver Sales */}
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box silver">
                  <Layers size={18} />
                </div>
                <span className="sadg-kpi-label">Total Silver Sales</span>
                <b className="sadg-kpi-value">
                  {kpis.total_silver_sales_inr > 0 ? `₹ ${Number(kpis.total_silver_sales_inr).toLocaleString('en-IN')}` : '—'}
                </b>
                <span className="sadg-kpi-sub">
                  {kpis.total_silver_sales_inr > 0 ? 'Gross silver volume' : 'No data available'}
                </span>
              </div>

              {/* Card 4: Silver Sold (g) */}
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box silver">
                  <ShieldCheck size={18} />
                </div>
                <span className="sadg-kpi-label">Silver Sold (g)</span>
                <b className="sadg-kpi-value">
                  {kpis.total_silver_sold_gm > 0 ? `${Number(kpis.total_silver_sold_gm).toFixed(3)} g` : '—'}
                </b>
                <span className="sadg-kpi-sub">
                  {kpis.total_silver_sold_gm > 0 ? 'Total weight credited' : 'No data available'}
                </span>
              </div>

              {/* Card 5: Total Transactions */}
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box mint">
                  <ArrowLeftRight size={18} />
                </div>
                <span className="sadg-kpi-label">Total Transactions</span>
                <b className="sadg-kpi-value">
                  {kpis.total_transactions > 0 ? kpis.total_transactions : '—'}
                </b>
                <span className="sadg-kpi-sub">
                  {kpis.total_transactions > 0 ? 'Completed cycles' : 'No data available'}
                </span>
              </div>

              {/* Card 6: Active Investors */}
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box teal">
                  <Users size={18} />
                </div>
                <span className="sadg-kpi-label">Active Investors</span>
                <b className="sadg-kpi-value">
                  {kpis.active_investors > 0 ? kpis.active_investors : '—'}
                </b>
                <span className="sadg-kpi-sub">
                  {kpis.active_investors > 0 ? 'Unique accounts' : 'No data available'}
                </span>
              </div>
            </div>

            {/* MIDDLE ROW (3-COLUMNS: GOLD CHART, SILVER CHART, RATES TABLE) */}
            <div className="sadg-charts-row">
              {/* Card 1: Gold Sales Overview */}
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
                      <span className="sadg-legend-square" style={{ background: '#009957' }} />
                      Gold Sales (g)
                    </span>
                    <span className="sadg-legend-item">
                      <span className="sadg-legend-line" style={{ background: '#0A3E42' }} />
                      Revenue (₹)
                    </span>
                  </div>
                </div>

                <div className="sadg-chart-body">
                  {goldChart.length > 0 && goldChart.some(d => d.grams > 0 || d.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={goldChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2ECE7" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6A7D7C' }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6A7D7C' }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6A7D7C' }} hide />
                        <Tooltip
                          contentStyle={{ background: '#0A3E42', color: '#FFF', borderRadius: 8, fontSize: 12, border: 'none' }}
                          formatter={(val, name) => [name === 'revenue' ? `₹ ${Number(val).toLocaleString('en-IN')}` : `${val} g`, name === 'revenue' ? 'Revenue' : 'Gold (g)']}
                        />
                        <Bar yAxisId="left" dataKey="grams" fill="#009957" radius={[4, 4, 0, 0]} maxBarSize={22} />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#0A3E42" strokeWidth={2.2} dot={{ r: 3, fill: '#0A3E42' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="sadg-chart-empty">
                      <BarChart3 size={28} color="#A3BFBD" />
                      <span>Connect live data to display sales</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Silver Sales Overview */}
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
                      <span className="sadg-legend-square" style={{ background: '#64748B' }} />
                      Silver Sales (g)
                    </span>
                    <span className="sadg-legend-item">
                      <span className="sadg-legend-line" style={{ background: '#0A3E42' }} />
                      Revenue (₹)
                    </span>
                  </div>
                </div>

                <div className="sadg-chart-body">
                  {silverChart.length > 0 && silverChart.some(d => d.grams > 0 || d.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={silverChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2ECE7" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6A7D7C' }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6A7D7C' }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6A7D7C' }} hide />
                        <Tooltip
                          contentStyle={{ background: '#0A3E42', color: '#FFF', borderRadius: 8, fontSize: 12, border: 'none' }}
                          formatter={(val, name) => [name === 'revenue' ? `₹ ${Number(val).toLocaleString('en-IN')}` : `${val} g`, name === 'revenue' ? 'Revenue' : 'Silver (g)']}
                        />
                        <Bar yAxisId="left" dataKey="grams" fill="#64748B" radius={[4, 4, 0, 0]} maxBarSize={22} />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#0A3E42" strokeWidth={2.2} dot={{ r: 3, fill: '#0A3E42' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="sadg-chart-empty">
                      <BarChart3 size={28} color="#A3BFBD" />
                      <span>Connect live data to display sales</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Gold & Silver Market Rates */}
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
                        <b>₹ {Number(rates.gold_22k || 14250).toLocaleString('en-IN')}</b> / g
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
                          <Coins size={14} color="#F59E0B" />
                          <span>Gold 24K</span>
                        </div>
                      </td>
                      <td>
                        <b>₹ {Number(rates.gold_24k || 15545).toLocaleString('en-IN')}</b> / g
                      </td>
                      <td>
                        <span style={{ color: '#009957', fontWeight: 700 }}>
                          +{rates.diff_22k ? Math.round(rates.diff_22k * 1.09) : 0} (+0.8%)
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
                        <b>₹ {Number(rates.silver_999 || 275).toFixed(2)}</b> / g
                      </td>
                      <td>
                        <span style={{ color: rates.diff_silver >= 0 ? '#009957' : '#DC5353', fontWeight: 700 }}>
                          {rates.diff_silver >= 0 ? '+' : ''}{rates.diff_silver || 0} ({rates.pct_silver || 0}%)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Compact illustration banner */}
                <div className="sadg-rates-banner-mini">
                  <div>
                    <h5>Secure Your Wealth with Digital Gold & Silver</h5>
                    <p>Trusted • Transparent • Growing</p>
                  </div>
                  <img
                    src="/digi-gold/autopay_banner_gold.jpg"
                    alt="Wealth"
                    className="sadg-rates-banner-thumb"
                    onError={(e) => { e.target.style.display = 'none' }}
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
                      <div>Total Investors: <b>{categorySummaries[selectedUserCategory].user_count}</b></div>
                      <div>Completed Buys: <b>{categorySummaries[selectedUserCategory].completed_purchases}</b></div>
                      <div>Gold Purchased: <b>{categorySummaries[selectedUserCategory].gold_gm} g</b></div>
                      <div>Silver Purchased: <b>{categorySummaries[selectedUserCategory].silver_gm} g</b></div>
                    </div>
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E2ECE7', fontSize: 12, fontWeight: 800, color: '#009957' }}>
                      Total Volume: ₹ {categorySummaries[selectedUserCategory].total_purchase_inr?.toLocaleString('en-IN')}
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

              {/* Card 3: Role-wise Summary */}
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
                      {categorySummaries.super_stockist?.gold_gm > 0 ? `${categorySummaries.super_stockist.gold_gm} g` : '—'}
                    </span>
                    <span className="sadg-role-card-sub">
                      {categorySummaries.super_stockist?.user_count || 0} active users
                    </span>
                  </div>

                  <div className="sadg-role-card">
                    <span className="sadg-role-card-name">Distributor</span>
                    <span className="sadg-role-card-val">
                      {categorySummaries.distributor?.gold_gm > 0 ? `${categorySummaries.distributor.gold_gm} g` : '—'}
                    </span>
                    <span className="sadg-role-card-sub">
                      {categorySummaries.distributor?.user_count || 0} active users
                    </span>
                  </div>

                  <div className="sadg-role-card">
                    <span className="sadg-role-card-name">Retailer</span>
                    <span className="sadg-role-card-val">
                      {categorySummaries.retailer?.gold_gm > 0 ? `${categorySummaries.retailer.gold_gm} g` : '—'}
                    </span>
                    <span className="sadg-role-card-sub">
                      {categorySummaries.retailer?.user_count || 0} active users
                    </span>
                  </div>

                  <div className="sadg-role-card">
                    <span className="sadg-role-card-name">Customer</span>
                    <span className="sadg-role-card-val">
                      {categorySummaries.customer?.gold_gm > 0 ? `${categorySummaries.customer.gold_gm} g` : '—'}
                    </span>
                    <span className="sadg-role-card-sub">
                      {categorySummaries.customer?.user_count || 0} active users
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
            {/* 6 Gold Specific KPI Cards */}
            <div className="sadg-kpi-grid">
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box gold">
                  <Coins size={18} />
                </div>
                <span className="sadg-kpi-label">Total Gold Sales Value</span>
                <b className="sadg-kpi-value">
                  {kpis.total_gold_sales_inr > 0 ? `₹ ${Number(kpis.total_gold_sales_inr).toLocaleString('en-IN')}` : '—'}
                </b>
                <span className="sadg-kpi-sub">Total INR inflow</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box gold">
                  <Sparkles size={18} />
                </div>
                <span className="sadg-kpi-label">Total Gold Sold</span>
                <b className="sadg-kpi-value">
                  {kpis.total_gold_sold_gm > 0 ? `${Number(kpis.total_gold_sold_gm).toFixed(3)} g` : '—'}
                </b>
                <span className="sadg-kpi-sub">Net gold weight</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box mint">
                  <ArrowUpRight size={18} />
                </div>
                <span className="sadg-kpi-label">Gold Buy Transactions</span>
                <b className="sadg-kpi-value">{kpis.gold_buy_txns || 0}</b>
                <span className="sadg-kpi-sub">Purchase count</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box teal">
                  <ReceiptText size={18} />
                </div>
                <span className="sadg-kpi-label">Gold Sell Transactions</span>
                <b className="sadg-kpi-value">{kpis.gold_sell_txns || 0}</b>
                <span className="sadg-kpi-sub">Liquidations</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box gold">
                  <TrendingUp size={18} />
                </div>
                <span className="sadg-kpi-label">Average Selling Rate</span>
                <b className="sadg-kpi-value">
                  {kpis.avg_gold_rate > 0 ? `₹ ${Number(kpis.avg_gold_rate).toLocaleString('en-IN')}` : '—'}
                </b>
                <span className="sadg-kpi-sub">₹ per gram</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box mint">
                  <ArrowLeftRight size={18} />
                </div>
                <span className="sadg-kpi-label">Total Gold Transactions</span>
                <b className="sadg-kpi-value">{kpis.total_gold_txns || 0}</b>
                <span className="sadg-kpi-sub">All gold operations</span>
              </div>
            </div>

            {/* Gold Sales Chart */}
            <div className="sadg-chart-card" style={{ height: 260 }}>
              <div className="sadg-chart-head">
                <div className="sadg-chart-title-box">
                  <Coins size={18} color="#C6924B" />
                  <h4 className="sadg-chart-title">Digi Gold Sales Analytics Timeline</h4>
                </div>
                <div className="sadg-chart-legend">
                  <span className="sadg-legend-item">
                    <span className="sadg-legend-square" style={{ background: '#009957' }} />
                    Quantity Sold (g)
                  </span>
                  <span className="sadg-legend-item">
                    <span className="sadg-legend-line" style={{ background: '#0A3E42' }} />
                    Sales Inflow (₹)
                  </span>
                </div>
              </div>
              <div className="sadg-chart-body" style={{ height: 200 }}>
                {goldChart.length > 0 && goldChart.some(d => d.grams > 0 || d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={goldChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2ECE7" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6A7D7C' }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6A7D7C' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6A7D7C' }} hide />
                      <Tooltip contentStyle={{ background: '#0A3E42', color: '#FFF', borderRadius: 8 }} />
                      <Bar yAxisId="left" dataKey="grams" fill="#009957" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#0A3E42" strokeWidth={2.4} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="sadg-chart-empty">
                    <Coins size={32} color="#C6924B" />
                    <span>No gold transactions recorded for this period</span>
                  </div>
                )}
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
            {/* 6 Silver Specific KPI Cards */}
            <div className="sadg-kpi-grid">
              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box silver">
                  <Layers size={18} />
                </div>
                <span className="sadg-kpi-label">Total Silver Sales Value</span>
                <b className="sadg-kpi-value">
                  {kpis.total_silver_sales_inr > 0 ? `₹ ${Number(kpis.total_silver_sales_inr).toLocaleString('en-IN')}` : '—'}
                </b>
                <span className="sadg-kpi-sub">Total INR inflow</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box silver">
                  <ShieldCheck size={18} />
                </div>
                <span className="sadg-kpi-label">Total Silver Sold</span>
                <b className="sadg-kpi-value">
                  {kpis.total_silver_sold_gm > 0 ? `${Number(kpis.total_silver_sold_gm).toFixed(3)} g` : '—'}
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
                <b className="sadg-kpi-value">{kpis.silver_buy_txns || 0}</b>
                <span className="sadg-kpi-sub">Purchase count</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box teal">
                  <ReceiptText size={18} />
                </div>
                <span className="sadg-kpi-label">Silver Sell Transactions</span>
                <b className="sadg-kpi-value">{kpis.silver_sell_txns || 0}</b>
                <span className="sadg-kpi-sub">Liquidations</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box silver">
                  <TrendingUp size={18} />
                </div>
                <span className="sadg-kpi-label">Average Selling Rate</span>
                <b className="sadg-kpi-value">
                  {kpis.avg_silver_rate > 0 ? `₹ ${Number(kpis.avg_silver_rate).toFixed(2)}` : '—'}
                </b>
                <span className="sadg-kpi-sub">₹ per gram</span>
              </div>

              <div className="sadg-kpi-card">
                <div className="sadg-kpi-icon-box mint">
                  <ArrowLeftRight size={18} />
                </div>
                <span className="sadg-kpi-label">Total Silver Transactions</span>
                <b className="sadg-kpi-value">{kpis.total_silver_txns || 0}</b>
                <span className="sadg-kpi-sub">All silver operations</span>
              </div>
            </div>

            {/* Silver Sales Chart */}
            <div className="sadg-chart-card" style={{ height: 260 }}>
              <div className="sadg-chart-head">
                <div className="sadg-chart-title-box">
                  <Layers size={18} color="#64748B" />
                  <h4 className="sadg-chart-title">Digi Silver Sales Analytics Timeline</h4>
                </div>
                <div className="sadg-chart-legend">
                  <span className="sadg-legend-item">
                    <span className="sadg-legend-square" style={{ background: '#64748B' }} />
                    Quantity Sold (g)
                  </span>
                  <span className="sadg-legend-item">
                    <span className="sadg-legend-line" style={{ background: '#0A3E42' }} />
                    Sales Inflow (₹)
                  </span>
                </div>
              </div>
              <div className="sadg-chart-body" style={{ height: 200 }}>
                {silverChart.length > 0 && silverChart.some(d => d.grams > 0 || d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={silverChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2ECE7" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6A7D7C' }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6A7D7C' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6A7D7C' }} hide />
                      <Tooltip contentStyle={{ background: '#0A3E42', color: '#FFF', borderRadius: 8 }} />
                      <Bar yAxisId="left" dataKey="grams" fill="#64748B" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#0A3E42" strokeWidth={2.4} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="sadg-chart-empty">
                    <Layers size={32} color="#64748B" />
                    <span>No silver transactions recorded for this period</span>
                  </div>
                )}
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
                  <b className="sadg-kpi-value">{categorySummaries[selectedUserCategory].user_count}</b>
                  <span className="sadg-kpi-sub">Registered in tier</span>
                </div>
                <div className="sadg-kpi-card">
                  <span className="sadg-kpi-label">Total Gold Purchased</span>
                  <b className="sadg-kpi-value">{categorySummaries[selectedUserCategory].gold_gm} g</b>
                  <span className="sadg-kpi-sub">Cumulative gold weight</span>
                </div>
                <div className="sadg-kpi-card">
                  <span className="sadg-kpi-label">Total Silver Purchased</span>
                  <b className="sadg-kpi-value">{categorySummaries[selectedUserCategory].silver_gm} g</b>
                  <span className="sadg-kpi-sub">Cumulative silver weight</span>
                </div>
                <div className="sadg-kpi-card">
                  <span className="sadg-kpi-label">Total Purchase Value</span>
                  <b className="sadg-kpi-value">₹ {categorySummaries[selectedUserCategory].total_purchase_inr?.toLocaleString('en-IN')}</b>
                  <span className="sadg-kpi-sub">Total capital invested</span>
                </div>
                <div className="sadg-kpi-card">
                  <span className="sadg-kpi-label">Completed Purchases</span>
                  <b className="sadg-kpi-value">{categorySummaries[selectedUserCategory].completed_purchases}</b>
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
            {/* Live Gold Rates Cards */}
            <div className="sadg-rates-display-grid">
              <div className="sadg-rate-banner-box">
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#FDE68A', textTransform: 'uppercase' }}>
                    Gold 22K (Athirai 916 Benchmark)
                  </span>
                  <div className="sadg-rate-banner-price">
                    ₹ {Number(rates.gold_22k || 14250).toLocaleString('en-IN')} <small style={{ fontSize: 14 }}>/ g</small>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Per mg: ₹ {Number(rates.gold_22k_mg || 14.25).toFixed(2)} | Movement: {rates.diff_22k >= 0 ? '+' : ''}{rates.diff_22k || 0} ({rates.pct_22k || 0}%)
                  </div>
                </div>
                <Coins size={38} color="#FDE68A" />
              </div>

              <div className="sadg-rate-banner-box" style={{ background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)' }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#FEF08A', textTransform: 'uppercase' }}>
                    Gold 24K (Pure 999 Bullion)
                  </span>
                  <div className="sadg-rate-banner-price">
                    ₹ {Number(rates.gold_24k || 15545).toLocaleString('en-IN')} <small style={{ fontSize: 14 }}>/ g</small>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Per mg: ₹ {((rates.gold_24k || 15545) / 1000).toFixed(2)} | Benchmark Standard
                  </div>
                </div>
                <Sparkles size={38} color="#FEF08A" />
              </div>
            </div>

            {/* Super Admin Rate Update Form */}
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
                    style={{ width: 150 }}
                    value={rateForm.gold_22k}
                    onChange={(e) => setRateForm({ ...rateForm, gold_22k: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6A7D7C', marginBottom: 4 }}>
                    Gold 24K (₹/g):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="sadg-select-pill"
                    style={{ width: 150 }}
                    value={rateForm.gold_24k}
                    onChange={(e) => setRateForm({ ...rateForm, gold_24k: e.target.value })}
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
                    style={{ width: 150 }}
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
                      <th>Gold 24K (₹/g)</th>
                      <th>Silver 999 (₹/g)</th>
                      <th>Source Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#6A7D7C' }}>
                          No historical rate logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      rateHistory.map((r, idx) => (
                        <tr key={r.date_iso || idx}>
                          <td><b>{r.date}</b></td>
                          <td>₹ {Number(r.gold_22k).toLocaleString('en-IN')}</td>
                          <td>₹ {(Number(r.gold_22k) / 1000).toFixed(2)}</td>
                          <td>₹ {Number(r.gold_24k).toLocaleString('en-IN')}</td>
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
