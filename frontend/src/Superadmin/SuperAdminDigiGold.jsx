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

// ── HIGH-PERFORMANCE TABULAR NUMBER COMPONENT (ZERO DOM JANK) ──
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }) {
  const numVal = Number(value) || 0
  const formatted = decimals > 0
    ? numVal.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(numVal).toLocaleString('en-IN')

  return <span style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{prefix}{formatted}{suffix}</span>
}

// ── CUSTOM LUXURY CHART TOOLTIP COMPONENT ──
function CustomChartTooltip({ active, payload, label, isSilver = false }) {
  if (!active || !payload || !payload.length) return null
  const pData = payload[0]?.payload || {}
  const grams = pData.grams ?? 0
  const revenue = pData.revenue ?? 0
  const effectiveRate = grams > 0 ? (revenue / grams) : null

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
      {effectiveRate ? (
        <div className="sadg-chart-tooltip-row">
          <span style={{ color: isSilver ? '#93C5FD' : '#FDE68A' }}>Avg Rate:</span>
          <span className="sadg-chart-tooltip-val">
            ₹ {Number(effectiveRate).toFixed(2)} / g
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default function SuperAdminDigiGold() {
  // ── NAVIGATION & VIEW STATE ──
  // 'overview' | 'transactions' | 'gold_mgmt' | 'silver_mgmt' | 'user_buy' | 'gold_rates' | 'silver_rates'
  const [activeSection, setActiveSection] = useState('overview')
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
  const [txnTypeFilter, setTxnTypeFilter] = useState('all') // 'all' | 'buy' | 'sell' | 'convert'
  const [selectedUserCategory, setSelectedUserCategory] = useState('all') // 'all' | 'super_stockist' | 'distributor' | 'wholesale_dealer' | 'retailer' | 'customer' | 'general_customer'

  // Pagination state for non-transaction views
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // ── INFINITE SCROLL STATE FOR TRANSACTIONS (VIEW 2) ──
  // Starts with 35 items (instant 0-lag DOM render), loads next batch smoothly
  const [txnVisibleCount, setTxnVisibleCount] = useState(35)
  const [loadingMoreTxns, setLoadingMoreTxns] = useState(false)
  const txnSentinelRef = useRef(null)

  // ── DATA STATE (ALWAYS FRESH FROM DB) ──
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const cachedRatesHistoryRef = useRef(null)
  const dateCacheRef = useRef({})

  // ── FETCH DATA DIRECTLY FROM DB (LIGHTNING FAST WITH IN-MEMORY CACHE) ──
  const fetchData = async () => {
    try {
      const cacheKey = `${dateFilter}_${statusFilter}_${metalFilter}_${txnTypeFilter}_${selectedUserCategory}_${customStartDate}_${customEndDate}_${search}`
      if (dateCacheRef.current[cacheKey]) {
        setData(dateCacheRef.current[cacheKey])
      } else {
        setData(null)
        setLoading(true)
      }

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

      // Fetch superadmin analytics + direct DB metal rates (only on initial load)
      const reqs = [api.get('/digi-gold/superadmin/', { params })]
      if (!cachedRatesHistoryRef.current) {
        reqs.push(api.get('/metal-rates/?all=true').catch(() => null))
      }

      const [res, ratesRes] = await Promise.all(reqs)

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
      dateCacheRef.current[cacheKey] = finalData
      setData(finalData)
    } catch (err) {
      console.error('Failed to load SuperAdmin Digi Gold & Silver data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Refetch when filters or custom dates change
  useEffect(() => {
    fetchData()
    setTxnVisibleCount(35)
  }, [dateFilter, customStartDate, customEndDate, statusFilter, metalFilter, txnTypeFilter, selectedUserCategory])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    setTxnVisibleCount(35)
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
    const totalCount = filteredItems.length
    if (totalCount === 0 || txnVisibleCount >= totalCount) return

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting && !loadingMoreTxns) {
        setLoadingMoreTxns(true)
        setTimeout(() => {
          setTxnVisibleCount(prev => Math.min(prev + 35, totalCount))
          setLoadingMoreTxns(false)
        }, 150)
      }
    }, { threshold: 0.1, rootMargin: '150px' })

    observer.observe(el)
    return () => observer.disconnect()
  }, [activeSection, loadingMoreTxns, txnVisibleCount, filteredItems.length])

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

      const isRateReport = activeSection === 'gold_rates' || activeSection === 'silver_rates'
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
        reportTitle = 'Official 22K Gold Benchmark Rates Log'
        reportCategory = 'BENCHMARK RATES AUDIT'
      } else if (activeSection === 'silver_rates') {
        reportTitle = 'Official Pure 999 Silver Benchmark Rates Log'
        reportCategory = 'BENCHMARK RATES AUDIT'
      }

      let rowsHtml = ''
      let totalAmount = 0
      let totalWeight = 0
      let totalValuation = 0

      if (isRateReport) {
        if (!rateHistory.length) {
          rowsHtml = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No benchmark rate history recorded yet.</td></tr>'
        } else {
          rateHistory.forEach((r) => {
            rowsHtml += `
              <tr>
                <td style="font-weight: 700; color: #0A3E42;">${r.date}</td>
                <td style="text-align: right; font-weight: 750;">₹ ${Number(r.gold_22k).toLocaleString('en-IN')}</td>
                <td style="text-align: right; color: #073E40;">₹ ${(Number(r.gold_22k) / 1000).toFixed(2)}</td>
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
            <th style="width: 20%; text-align: right;">Gold 22K (₹/g)</th>
            <th style="width: 20%; text-align: right;">Gold 22K (₹/mg)</th>
            <th style="width: 20%; text-align: right;">Silver 999 (₹/g)</th>
            <th style="width: 15%; text-align: center;">Source Status</th>
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
                {/* 6 KPI CARDS ROW (CLICKABLE, WITH SMOOTH ANIMATED NUMBERS) */}
                <div className="sadg-kpi-grid">
                  {/* Card 1: Total Gold Sales */}
                  <div
                    className="sadg-kpi-card sadg-clickable-card"
                    onClick={() => {
                      setMetalFilter('gold')
                      setActiveSection('transactions')
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
                      setActiveSection('transactions')
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
                      setActiveSection('transactions')
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
                      Gross volume • ₹{Number(rates.silver_999 || 275).toFixed(2)}/g
                    </span>
                  </div>

                  {/* Card 4: Silver Sold (g) */}
                  <div
                    className="sadg-kpi-card sadg-clickable-card"
                    onClick={() => {
                      setMetalFilter('silver')
                      setActiveSection('transactions')
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
                      setActiveSection('transactions')
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
                      setActiveSection('user_buy')
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
                            Revenue (₹)
                          </button>
                        </div>
                        <div className="sadg-chart-legend">
                          <span className="sadg-legend-item">
                            <span className="sadg-legend-line" style={{ background: goldChartMetric === 'grams' ? '#073E40' : '#0A3E42' }} />
                            {goldChartMetric === 'grams' ? 'Gold (g)' : 'Revenue (₹)'}
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
                            name={goldChartMetric === 'grams' ? 'Gold (g)' : 'Revenue (₹)'}
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
                            Revenue (₹)
                          </button>
                        </div>
                        <div className="sadg-chart-legend">
                          <span className="sadg-legend-item">
                            <span className="sadg-legend-line" style={{ background: silverChartMetric === 'grams' ? '#0284C7' : '#0A3E42' }} />
                            {silverChartMetric === 'grams' ? 'Silver (g)' : 'Revenue (₹)'}
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
                            name={silverChartMetric === 'grams' ? 'Silver (g)' : 'Revenue (₹)'}
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
                            <b>₹ <AnimatedNumber value={rates.gold_22k || 14250} /></b> / g
                          </td>
                          <td>
                            <span style={{ color: rates.diff_22k >= 0 ? '#073E40' : '#DC5353', fontWeight: 700 }}>
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
                            <b>₹ <AnimatedNumber value={rates.silver_999 || 275} decimals={2} /></b> / g
                          </td>
                          <td>
                            <span style={{ color: rates.diff_silver >= 0 ? '#073E40' : '#DC5353', fontWeight: 700 }}>
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
                        <Clock size={16} color="#073E40" />
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
                        onClick={() => setActiveSection('user_buy')}
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
                          setActiveSection('transactions')
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
                          setActiveSection('transactions')
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
                          setActiveSection('transactions')
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
                          setActiveSection('transactions')
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
                            <td><b>{row.quantity_label}</b></td>
                            <td>₹ {Number(row.rate).toLocaleString('en-IN')}</td>
                            <td><b>₹ {Number(row.amount).toLocaleString('en-IN')}</b></td>
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
                  Showing <b>1 to {Math.min(txnVisibleCount, filteredItems.length)}</b> of <b>{filteredItems.length}</b> verified records
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {loadingMoreTxns ? (
                    <span style={{ fontSize: 12, color: '#073E40', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RefreshCw size={13} className="sadg-spin" />
                      Loading more records…
                    </span>
                  ) : txnVisibleCount < filteredItems.length ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#6A7D7C', fontWeight: 600 }}>
                        ↓ Scroll down or
                      </span>
                      <button
                        type="button"
                        onClick={() => setTxnVisibleCount(prev => Math.min(prev + 35, filteredItems.length))}
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
                      ✓ All {filteredItems.length} records loaded
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
                      Revenue (₹)
                    </button>
                  </div>
                  <div className="sadg-chart-legend">
                    <span className="sadg-legend-item">
                      <span className="sadg-legend-line" style={{ background: '#073E40' }} />
                      {goldMgmtMetric === 'grams' ? 'Quantity Sold (g)' : 'Sales Inflow (₹)'}
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
                      name={goldMgmtMetric === 'grams' ? 'Gold (g)' : 'Revenue (₹)'}
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
                      Revenue (₹)
                    </button>
                  </div>
                  <div className="sadg-chart-legend">
                    <span className="sadg-legend-item">
                      <span className="sadg-legend-line" style={{ background: '#0284C7' }} />
                      {silverMgmtMetric === 'grams' ? 'Quantity Sold (g)' : 'Sales Inflow (₹)'}
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
                      name={silverMgmtMetric === 'grams' ? 'Silver (g)' : 'Revenue (₹)'}
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
                    ₹ <AnimatedNumber value={rates.silver_999 || 275} decimals={2} /> <small style={{ fontSize: 14 }}>/ g</small>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Per Kilogram: ₹ {((rates.silver_999 || 275) * 1000).toLocaleString('en-IN')} | Movement: {rates.diff_silver >= 0 ? '+' : ''}{rates.diff_silver || 0} ({rates.pct_silver || 0}%)
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
                            <span style={{ color: '#073E40', fontWeight: 700 }}>+0.00 (Benchmark)</span>
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
