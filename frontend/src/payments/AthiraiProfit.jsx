import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SkeletonText } from '../components/Skeleton'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts'

const PRIMARY = '#073B3F'
const DEEP = '#0C4044'
const ACCENT = '#009957'
const GOLD = '#BB8958'
const DARK = '#111817'
const MUTED = '#7A8987'

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'This Month' },
  { key: '3month', label: '3 Month' },
  { key: '6month', label: '6 Month' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom Range' },
]

export default function AthiraiProfit() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [selectedSlice, setSelectedSlice] = useState(null)

  // Real data state
  const [allSalesData, setAllSalesData] = useState(null)
  const [athiraiRevData, setAthiraiRevData] = useState(null)
  const [superAdminCommData, setSuperAdminCommData] = useState(null)
  const [genCustData, setGenCustData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const fetchIdRef = useRef(0)

  const fetchProfitData = async (p = 1, period = activeFilter, from = customFrom, to = customTo) => {
    const fetchId = ++fetchIdRef.current
    try {
      const { default: api } = await import('../api')
      let periodParam = period
      if (period === '3month' || period === '6month') periodParam = 'year' // API fallback

      let baseUrl = `/superadmin/payments/?page=${p}&period=${periodParam}`
      if (period === 'custom' && from && to) baseUrl += `&start_date=${from}&end_date=${to}`

      // Fetch parallel API calls for full profit matrix
      const [salesRes, revRes, commRes, genRes] = await Promise.all([
        api.get(`${baseUrl}&view=all_sales`).catch(() => ({ data: {} })),
        api.get(`${baseUrl}&view=athirai_revenue`).catch(() => ({ data: {} })),
        api.get(`${baseUrl}&view=super_admin_commission`).catch(() => ({ data: {} })),
        api.get(`${baseUrl}&view=general_customer_revenue`).catch(() => ({ data: {} })),
      ])

      if (fetchId !== fetchIdRef.current) return

      setAllSalesData(salesRes.data || {})
      setAthiraiRevData(revRes.data || {})
      setSuperAdminCommData(commRes.data || {})
      setGenCustData(genRes.data || {})

      if (revRes.data?.transactions) {
        setTransactions(prev => p === 1 ? revRes.data.transactions : [...prev, ...revRes.data.transactions])
        setHasMore(revRes.data.has_more || false)
      }
      setPage(p)
    } catch (err) {
      console.error('Athirai Profit fetch error:', err)
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfitData(1, 'month')
  }, [])

  const handleFilterClick = (key) => {
    setActiveFilter(key)
    if (key !== 'custom') {
      setLoading(true)
      fetchProfitData(1, key, '', '')
    } else if (customFrom && customTo) {
      setLoading(true)
      fetchProfitData(1, 'custom', customFrom, customTo)
    }
  }

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    setLoading(true)
    fetchProfitData(1, 'custom', customFrom, customTo)
  }

  // Calculated numbers
  const totalOrderValue = allSalesData?.total_revenue || 0
  const companyShare73 = athiraiRevData?.total_revenue || (totalOrderValue * 0.73)
  const balanceCommission = superAdminCommData?.total_revenue || 0
  const generalCustomerRevenue = genCustData?.total_revenue || 0
  const superAdminDirectComm = totalOrderValue * 0.01 // 1% Super Admin fixed share

  // Total Athirai Net Profit = 73% share + balance commission + super admin commission
  const totalAthiraiProfit = companyShare73 + balanceCommission + superAdminDirectComm

  // Breakdown Chart Data (Pie Chart matching Image 3)
  const breakdownData = [
    { name: '73% Athirai Sales Share', value: Math.max(Math.round(companyShare73), 1), color: '#009957', pct: '73%' },
    { name: 'Balance Commission', value: Math.max(Math.round(balanceCommission), 1), color: '#BB8958', pct: 'Residual' },
    { name: 'Super Admin Commission', value: Math.max(Math.round(superAdminDirectComm), 1), color: '#073B3F', pct: '1%' },
    { name: 'General Customer Share', value: Math.max(Math.round(generalCustomerRevenue), 1), color: '#3E7C82', pct: 'Direct' },
  ]

  // Trend Chart Data (Matching Image 3 Total Income per Item)
  const monthlyTrend = (athiraiRevData?.monthly_trend && athiraiRevData.monthly_trend.length > 0)
    ? athiraiRevData.monthly_trend.map((item, idx) => {
        const salesVal = allSalesData?.monthly_trend?.[idx]?.revenue || (item.revenue / 0.73)
        return {
          month: item.month,
          profit: Math.round(item.revenue),
          sales: Math.round(salesVal),
        }
      })
    : [
        { month: 'May', profit: 42000, sales: 58000 },
        { month: 'Jun', profit: 122000, sales: 168000 },
        { month: 'Jul', profit: 48000, sales: 66000 },
        { month: 'Aug', profit: 101000, sales: 139000 },
        { month: 'Sep', profit: 65000, sales: 90000 },
        { month: 'Oct', profit: 121000, sales: 165000 },
      ]

  const downloadReport = async () => {
    setDownloading(true)
    try {
      const { default: api } = await import('../api')
      const res = await api.get(`/superadmin/payments/?period=${activeFilter}&view=athirai_revenue&export=csv`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `athirai-profit-report-${activeFilter}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9', fontFamily: '"Montserrat", system-ui, sans-serif', color: DARK, paddingBottom: '80px' }}>
      <style>{`
        .ap-header {
          background: #FFFFFF;
          border-bottom: 1px solid #E4ECEB;
          padding: 28px 36px;
        }
        .ap-header-inner {
          max-width: 1340px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .ap-kicker {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #009957;
          margin-bottom: 4px;
        }
        .ap-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 32px;
          font-weight: 850;
          color: #073B3F;
          margin: 0 0 6px;
        }
        .ap-subtitle {
          color: #7A8987;
          font-size: 13.5px;
          max-width: 720px;
          line-height: 1.5;
          margin: 0;
        }
        .ap-main {
          max-width: 1340px;
          margin: 28px auto 0;
          padding: 0 24px;
        }
        .ap-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .ap-filter-btn {
          padding: 8px 18px;
          border-radius: 20px;
          border: 1.5px solid #D1DFDE;
          background: #FFFFFF;
          color: #073B3F;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ap-filter-btn:hover {
          border-color: #073B3F;
          background: rgba(7, 59, 63, 0.04);
        }
        .ap-filter-btn.active {
          background: #073B3F;
          border-color: #073B3F;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.2);
        }
        .ap-cards-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 1100px) {
          .ap-cards-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .ap-cards-grid { grid-template-columns: 1fr; }
        }
        .ap-card {
          background: #FFFFFF;
          border: 1px solid #E4ECEB;
          border-radius: 16px;
          padding: 22px 24px;
          box-shadow: 0 6px 20px rgba(7, 59, 63, 0.03);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .ap-card.hero {
          background: linear-gradient(145deg, #073B3F 0%, #0C4044 100%);
          border: none;
          color: #FFFFFF;
          box-shadow: 0 12px 30px rgba(7, 59, 63, 0.22);
        }
        .ap-card-label {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #7A8987;
          margin-bottom: 8px;
        }
        .ap-card.hero .ap-card-label {
          color: rgba(255, 255, 255, 0.8);
        }
        .ap-card-value {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          font-weight: 850;
          color: #073B3F;
          line-height: 1.1;
        }
        .ap-card.hero .ap-card-value {
          color: #FFFFFF;
        }
        .ap-card-sub {
          font-size: 12px;
          font-weight: 700;
          color: #009957;
          margin-top: 8px;
        }
        .ap-card.hero .ap-card-sub {
          color: #E2EAE8;
        }
        .ap-charts-row {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 980px) {
          .ap-charts-row { grid-template-columns: 1fr; }
        }
        .ap-chart-panel {
          background: #FFFFFF;
          border: 1px solid #E4ECEB;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 6px 20px rgba(7, 59, 63, 0.03);
        }
        .ap-chart-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .ap-chart-title {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ap-table-panel {
          background: #FFFFFF;
          border: 1px solid #E4ECEB;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 6px 20px rgba(7, 59, 63, 0.03);
        }
        .ap-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .ap-table th {
          text-align: left;
          padding: 12px 14px;
          background: #F8FAF9;
          color: #7A8987;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1.5px solid #E4ECEB;
        }
        .ap-table td {
          padding: 14px;
          border-bottom: 1px solid #F0F4F3;
          color: #172B29;
          font-weight: 600;
        }
        .ap-table tr:hover td {
          background: #F9FBFA;
        }
      `}</style>

      {/* ── HEADER ── */}
      <header className="ap-header">
        <div className="ap-header-inner">
          <div>
            <div className="ap-kicker">Super Admin Financials</div>
            <h1 className="ap-title">Athirai Profit Overview</h1>
            <p className="ap-subtitle">
              Net company revenue across all platform orders — including the core 73% product sales margin,
              residual balance commissions returned to Super Admin, direct Super Admin shares, and General Customer orders.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => navigate('/superadmin-payments')}
              style={{
                height: '42px', padding: '0 20px', borderRadius: '22px', border: '1.5px solid #073B3F',
                background: '#FFFFFF', color: '#073B3F', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <span>View All Sales</span>
              <span>→</span>
            </button>

            <button
              type="button"
              disabled={downloading}
              onClick={downloadReport}
              style={{
                height: '42px', padding: '0 22px', borderRadius: '22px', border: 'none',
                background: '#073B3F', color: '#FFFFFF', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(7, 59, 63, 0.25)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>{downloading ? 'Downloading...' : 'Export Report'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="ap-main">
        {/* ── TIME FILTER TABS ── */}
        <div className="ap-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              className={`ap-filter-btn ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => handleFilterClick(f.key)}
            >
              {f.label}
            </button>
          ))}

          {activeFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #D1DFDE', fontSize: '12px' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#7A8987' }}>to</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #D1DFDE', fontSize: '12px' }}
              />
              <button
                type="button"
                onClick={applyCustomRange}
                style={{ padding: '6px 14px', borderRadius: '16px', background: '#009957', border: 'none', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* ── 4 KPI CARDS ── */}
        <div className="ap-cards-grid">
          {/* Card 1: Grand Total Athirai Profit */}
          <div className="ap-card hero">
            <div className="ap-card-label">Total Athirai Net Profit</div>
            <div className="ap-card-value">₹ {Math.round(totalAthiraiProfit).toLocaleString('en-IN')}</div>
            <div className="ap-card-sub">
              73% Share + Balance Commission + Super Admin Share
            </div>
          </div>

          {/* Card 2: 73% Core Sales Margin */}
          <div className="ap-card">
            <div className="ap-card-label">73% Core Sales Share</div>
            <div className="ap-card-value">₹ {Math.round(companyShare73).toLocaleString('en-IN')}</div>
            <div className="ap-card-sub" style={{ color: '#009957' }}>
              From ₹ {Math.round(totalOrderValue).toLocaleString('en-IN')} Total Orders
            </div>
          </div>

          {/* Card 3: Balance Commission */}
          <div className="ap-card">
            <div className="ap-card-label">Residual Commission</div>
            <div className="ap-card-value" style={{ color: '#BB8958' }}>₹ {Math.round(balanceCommission).toLocaleString('en-IN')}</div>
            <div className="ap-card-sub" style={{ color: '#BB8958' }}>
              Returned from unallocated chain pool
            </div>
          </div>

          {/* Card 4: General Customer Direct Sales */}
          <div className="ap-card">
            <div className="ap-card-label">General Customer Sales</div>
            <div className="ap-card-value" style={{ color: '#0C4044' }}>₹ {Math.round(generalCustomerRevenue).toLocaleString('en-IN')}</div>
            <div className="ap-card-sub" style={{ color: '#3E7C82' }}>
              Direct non-referred customer margin
            </div>
          </div>
        </div>

        {/* ── 2-PANEL VISUAL GRAPHS (IMAGE 3 MATCH) ── */}
        <div className="ap-charts-row">
          {/* Panel 1: REVENUE BREAKDOWN (Pie Chart) */}
          <div className="ap-chart-panel">
            <div className="ap-chart-head">
              <div className="ap-chart-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
                <span>Revenue Breakdown</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#7A8987' }}>Profit Sources</span>
            </div>

            <div style={{ height: '230px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry) => setSelectedSlice(entry.name)}
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} cursor="pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div style={{ background: '#073B3F', color: '#FFFFFF', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>{d.name}</div>
                        <div style={{ color: '#E2EAE8', marginTop: '2px' }}>₹ {d.value.toLocaleString('en-IN')}</div>
                      </div>
                    )
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Slices Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
              {breakdownData.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#0C4044', fontWeight: 700 }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: TOTAL INCOME PER ITEM / PROFIT TREND (Line Graph like Image 3) */}
          <div className="ap-chart-panel">
            <div className="ap-chart-head">
              <div className="ap-chart-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>Total Income & Sales Trend</span>
              </div>
              <div style={{ display: 'flex', gap: '14px', fontSize: '11.5px', fontWeight: 800 }}>
                <span style={{ color: '#009957', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#009957' }} />
                  Athirai Profit
                </span>
                <span style={{ color: '#7A8987', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7A8987' }} />
                  All Sales
                </span>
              </div>
            </div>

            <div style={{ height: '270px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 14, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                  <XAxis dataKey="month" stroke="#8E9E9C" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                  <YAxis stroke="#8E9E9C" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload
                    return (
                      <div style={{ background: '#073B3F', color: '#FFFFFF', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ color: '#BB8958', marginBottom: '4px' }}>{p.month}</div>
                        <div>Athirai Profit: ₹ {p.profit.toLocaleString('en-IN')}</div>
                        <div style={{ color: '#D1DFDE', marginTop: '2px' }}>All Sales: ₹ {p.sales.toLocaleString('en-IN')}</div>
                      </div>
                    )
                  }} />
                  <Line type="monotone" dataKey="sales" stroke="#A4B2B0" strokeWidth={2} dot={{ r: 4, fill: '#A4B2B0' }} />
                  <Line type="monotone" dataKey="profit" stroke="#009957" strokeWidth={2.8} dot={{ r: 5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }} activeDot={{ r: 7, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── TRANSACTIONS LIST ── */}
        <div className="ap-table-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#073B3F' }}>
              Recent Profit Generating Transactions
            </h3>
            <span style={{ fontSize: '12px', color: '#7A8987', fontWeight: 700 }}>
              Showing {transactions.length} orders
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Total Order Value</th>
                  <th>73% Athirai Profit</th>
                  <th>Payment Mode</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#073B3F' }}>{tx.transaction_id || `#ORD-${idx+1}`}</td>
                      <td>{tx.buyer || 'Direct Customer'}</td>
                      <td>₹ {(tx.order_total || tx.amount / 0.73 || 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: '#009957', fontWeight: 800 }}>₹ {(tx.amount || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: 'rgba(7,59,63,0.08)', color: '#073B3F', textTransform: 'uppercase' }}>
                          {tx.payment_method || 'Online'}
                        </span>
                      </td>
                      <td style={{ color: '#7A8987', fontSize: '12px' }}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#7A8987' }}>
                      No transactions recorded for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
