import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api'
import logo from '../assets/logo.png'
import InternalRoleNavbar from '../collection/InternalRoleNavbar'
import CopyUrlButton from '../collection/CopyUrlButton'
import goldCoin from '../assets/gold-coin-transparent.png'
import silverCoin from '../assets/silver-coin.png'
import { SkeletonChart, SkeletonText, SkeletonRow, SkeletonBox } from '../components/Skeleton'
import '../components/skeleton.css'

const COLORS = ['#0C4044', '#CCA881', '#BDCFCE', '#BB8958', '#7A8987', '#9F6130']

const ROLE_CFG_ADMIN = {
  dealer: { color: '#0C4044', label: '🏪 DISTRIBUTOR', idKey: 'dealer_id' },
  sub_dealer: { color: '#BB8958', label: '🔗 WHOLESALE DEALER', idKey: 'sub_dealer_id' },
  promotor: { color: '#CCA881', label: '🌟 RETAILER', idKey: 'promotor_id' },
  customer: { color: '#C92035', label: '👤 CUSTOMER', idKey: 'customer_id' },
}

const ROLE_LABELS_ADMIN = {
  admin: { emoji: '🛡️', label: 'SUPER STOCKIST', color: '#0C4044', idKey: 'admin_id' },
  dealer: { emoji: '🏪', label: 'DISTRIBUTOR', color: '#0C4044', idKey: 'dealer_id' },
  sub_dealer: { emoji: '🔗', label: 'WHOLESALE DEALER', color: '#BB8958', idKey: 'sub_dealer_id' },
  promotor: { emoji: '🌟', label: 'RETAILER', color: '#CCA881', idKey: 'promotor_id' },
  customer: { emoji: '👤', label: 'CUSTOMER', color: '#C92035', idKey: 'customer_id' },
}

const irdPalette = {
  white: '#FDFDFC', off: '#F3F3F0', mist: '#E7EDEC', aqua: '#D1DFDE', dusty: '#BDCFCE',
  teal: '#0C4044', deep: '#073B3F', champagne: '#F3E8DE', gold: '#CCA881', antique: '#BB8958',
  grey: '#7A8987', black: '#111817', red: '#C92035',
}

const irdChartPeriods = [
  { key: 'today', label: 'Today' }, { key: 'week', label: '7D' }, { key: 'month', label: '1M' },
  { key: '3month', label: '3M' }, { key: 'year', label: '1Y' }, { key: 'all', label: 'All' },
]

function IrdIcon({ type }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'store') return <svg {...common}><path d="M4 10h16l-1-5H5l-1 5z"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
  if (type === 'report') return <svg {...common}><path d="M4 19V5"/><path d="M8 19v-8"/><path d="M12 19V8"/><path d="M16 19v-5"/><path d="M20 19V4"/></svg>
  if (type === 'clock') return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
  if (type === 'box') return <svg {...common}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>
  if (type === 'cart') return <svg {...common}><path d="M6 6h15l-2 9H8L6 3H3"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
  return <svg {...common}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
}

function irdNormalizeSeries(rows, period) {
  const formatAxis = (iso) => {
    const d = new Date(iso)
    if (period === 'today') return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    if (period === 'week' || period === 'month' || period === '3month') return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }
  const grouped = new Map()
  ;(rows || []).forEach(row => {
    const label = formatAxis(row.time)
    const prev = grouped.get(label)
    if (prev) prev.count += Number(row.count || 0)
    else grouped.set(label, {
      ...row, count: Number(row.count || 0), label,
      fullDate: new Date(row.time).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'),
      fullTime: new Date(row.time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }),
    })
  })
  return Array.from(grouped.values()).sort((a, b) => new Date(a.time) - new Date(b.time))
}

function IrdOrderTrendPanel({ title = 'Order Volume', endpoint = '/order-timeseries/', requestParams = {}, onSummaryChange }) {
  const [period, setPeriod] = useState('today')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = async (nextPeriod = period) => {
    setLoading(true)
    try {
      const res = await api.get(endpoint, { params: { ...requestParams, period: nextPeriod } })
      const normalized = irdNormalizeSeries(res.data?.data || [], nextPeriod)
      setData(normalized)
      onSummaryChange?.(normalized.reduce((sum, row) => sum + Number(row.count || 0), 0))
      setLastUpdated(new Date())
    } catch {
      setData([])
      onSummaryChange?.(0)
      setLastUpdated(new Date())
    }
    setLoading(false)
  }

  useEffect(() => { fetchData('today') }, [])

  const totalOrders = data.reduce((sum, row) => sum + Number(row.count || 0), 0)
  const selectedPeriodLabel = irdChartPeriods.find(item => item.key === period)?.label || 'Today'
  const peakIndex = data.length ? data.reduce((best, row, idx, arr) => row.count > arr[best].count ? idx : best, 0) : -1
  const activeLabels = data.filter(row => row.count > 0).map(row => row.label)
  const trendPercent = useMemo(() => {
    if (!data.length) return 0
    const mid = Math.max(1, Math.floor(data.length / 2))
    const avg = arr => arr.length ? arr.reduce((s, d) => s + Number(d.count || 0), 0) / arr.length : 0
    const first = avg(data.slice(0, mid))
    const second = avg(data.slice(mid))
    if (first <= 0) return second > 0 ? 100 : 0
    return Math.round(((second - first) / first) * 100)
  }, [data])

  const Dot = ({ cx, cy, index, payload }) => {
    if (!payload?.count || cx == null || cy == null) return null
    const peak = index === peakIndex
    return <g>{peak && <circle className="ird-pulse" cx={cx} cy={cy} r={10} fill="#E2BC84" opacity="0.28" />}<circle cx={cx} cy={cy} r={peak ? 6 : 4.5} fill="#E2BC84" stroke={irdPalette.deep} strokeWidth="2.5" /></g>
  }

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const row = payload[0].payload
    return <div className="ird-tooltip"><div><span>{row.fullDate}</span><b>{row.fullTime}</b></div><strong>{row.count} orders</strong></div>
  }

  return (
    <section className="ird-chart-card">
      <div className="ird-chart-head">
        <div>
          <p>Order Analytics</p>
          <div className="ird-chart-title-row"><h2>{title}</h2><span><i />Manual refresh only</span></div>
          <small>{totalOrders} orders selected - {trendPercent >= 0 ? '+' : ''}{trendPercent}% trend {lastUpdated ? `- Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}</small>
        </div>
        <button disabled={loading} onClick={() => fetchData(period)}><IrdIcon type="clock" />{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      <div className="ird-periods">
        {irdChartPeriods.map(p => <button key={p.key} className={period === p.key ? 'active' : ''} onClick={() => { setPeriod(p.key); fetchData(p.key) }}>{p.label}</button>)}
        <span>Viewing {selectedPeriodLabel}</span>
      </div>
      <div className="ird-chart-box">
        {loading ? <SkeletonChart height="100%" /> : data.length === 0 ? <div className="ird-empty">No orders in this period</div> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 18, right: 22, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="irdArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E3BC83" stopOpacity="0.42"/><stop offset="52%" stopColor="#C59A68" stopOpacity="0.16"/><stop offset="100%" stopColor="#C59A68" stopOpacity="0.01"/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.12)" vertical={false}/>
              <XAxis dataKey="label" tickFormatter={(label) => activeLabels.includes(label) ? label : ''} stroke="rgba(226,235,232,0.62)" fontSize={10} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.16)' }} minTickGap={30}/>
              <YAxis stroke="rgba(226,235,232,0.62)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} tickCount={5}/>
              <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(12,64,68,0.72)', strokeWidth: 2, strokeDasharray: '5 7' }}/>
              <Area type="monotone" dataKey="count" stroke="transparent" fill="url(#irdArea)" dot={false} isAnimationActive={false}/>
              <Line type="monotone" dataKey="count" stroke="#E2BC84" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" dot={<Dot />} activeDot={{ r: 8, fill: '#F0D29E', stroke: irdPalette.deep, strokeWidth: 3 }} isAnimationActive={false}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

function IrdDonutPanel({ title, totalLabel, data, login, onSliceClick, loading }) {
  const colors = [irdPalette.dusty, irdPalette.teal, irdPalette.antique, irdPalette.gold, irdPalette.red, irdPalette.grey]
  if (loading) {
    return (
      <section className="ird-pie">
        <SkeletonText width="140px" height="19px" style={{ marginBottom: 8 }} />
        <SkeletonText width="180px" height="42px" style={{ marginBottom: 30 }} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SkeletonBox width="260px" height="260px" borderRadius="50%" />
        </div>
        <div className="ird-legend">
          {[0, 1, 2].map(i => <SkeletonText key={i} width="90px" height="15px" />)}
        </div>
      </section>
    )
  }
  return <section className="ird-pie"><h3>{title}</h3><strong>{totalLabel}</strong><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={102} paddingAngle={2} onClick={onSliceClick} style={onSliceClick ? { cursor: 'pointer' } : undefined}>{data.map((item, idx) => <Cell key={item.name} fill={item.color || colors[idx % colors.length]} />)}</Pie><Tooltip contentStyle={{ background: irdPalette.white, border: `1px solid ${irdPalette.dusty}`, borderRadius: 10, fontSize: 12, color: irdPalette.black }}/></PieChart></ResponsiveContainer><div className="ird-legend">{data.map((item, idx) => <button key={item.name} onClick={() => onSliceClick?.(item)}><i style={{ background: item.color || colors[idx % colors.length] }}/><span className={login ? 'big' : ''}>{item.name} {item.value}</span></button>)}</div></section>
}

function AdminDashboardFrame({ roleName, roleDistribution = [], quickActions = [], endpoint, requestParams = {} }) {
  const navigate = useNavigate()
  const [orderCount, setOrderCount] = useState(0)
  const [loginCounts, setLoginCounts] = useState({ active: 0, inactive: 0 })
  const [loginLoading, setLoginLoading] = useState(true)
  const [fastCounts, setFastCounts] = useState(null)
  const [countsLoading, setCountsLoading] = useState(true)
  const fastRoleDistribution = fastCounts ? [
    { name: 'Distributor', value: fastCounts.dealers || 0, color: '#0C4044' },
    { name: 'Wholesale Dealer', value: fastCounts.sub_dealers || 0, color: '#BB8958' },
    { name: 'Retailer', value: fastCounts.promotors || 0, color: '#CCA881' },
    { name: 'Customer', value: fastCounts.customers || 0, color: '#C92035' },
  ] : []
  const totalNetwork = fastRoleDistribution.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const loginData = [
    { name: 'Active', value: loginCounts.active, color: irdPalette.teal },
    { name: 'Inactive', value: loginCounts.inactive, color: irdPalette.red },
  ]
  const hierarchyAction = quickActions.find(action => action.label.toLowerCase().includes('hierarchy'))
  const reportAction = quickActions.find(action => action.label.toLowerCase().includes('report'))
  const createAction = quickActions.find(action => action.label.toLowerCase().includes('create'))

  useEffect(() => {
    let current = true
    api.get('/today-login-status/', { params: { period: 'today', list_type: 'active', limit: 1 } })
      .then(res => {
        if (!current) return
        setLoginCounts({ active: Number(res.data?.total_count || 0), inactive: Number(res.data?.other_count || 0) })
      })
      .catch(() => current && setLoginCounts({ active: 0, inactive: 0 }))
      .finally(() => current && setLoginLoading(false))
    api.get('/role-distribution-counts/')
      .then(res => { if (current) setFastCounts(res.data) })
      .catch(() => {})
      .finally(() => current && setCountsLoading(false))
    return () => { current = false }
  }, [])

  return (
    <div className="ird-shell">
      <style>{`
        @keyframes irdIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes irdPulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.8);opacity:.12}}
        .ird-shell{padding:24px 34px 0;box-sizing:border-box;font-family:"Inter",system-ui,sans-serif;color:${irdPalette.black}}
        .ird-grid{display:block}.ird-chart-card,.ird-pie,.ird-actions{position:relative;overflow:hidden;background:${irdPalette.white};border:1px solid rgba(189,207,206,.78);border-radius:20px;padding:24px 28px;box-shadow:0 24px 64px rgba(7,59,63,.10);animation:irdIn .55s ease both}.ird-chart-card:before,.ird-pie:before,.ird-actions:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 5%,rgba(204,168,129,.18),transparent 30%),radial-gradient(circle at 95% 5%,rgba(12,64,68,.09),transparent 36%)}.ird-chart-card{margin-bottom:22px}.ird-chart-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start}.ird-chart-head p{margin:0;font-size:12px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;color:${irdPalette.antique}}.ird-chart-title-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.ird-chart-title-row h2{font-family:"Cormorant Garamond",Georgia,serif;font-size:42px;font-weight:950;line-height:1;color:${irdPalette.deep};margin:5px 0 0}.ird-chart-title-row span{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(12,64,68,.28);background:${irdPalette.mist};color:${irdPalette.teal};border-radius:999px;padding:8px 13px;font-size:12px;font-weight:900}.ird-chart-title-row i{width:8px;height:8px;border-radius:50%;background:${irdPalette.teal};box-shadow:0 0 0 4px rgba(12,64,68,.1)}.ird-chart-head small{display:block;margin-top:8px;font-size:13px;font-weight:800;color:${irdPalette.grey}}.ird-chart-head button{min-height:48px;padding:0 20px;border-radius:14px;border:1px solid rgba(12,64,68,.32);background:linear-gradient(135deg,${irdPalette.teal},${irdPalette.deep});color:${irdPalette.white};font-size:13px;font-weight:950;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 14px 28px rgba(7,59,63,.16)}.ird-chart-head button:disabled{opacity:.62;cursor:not-allowed}.ird-chart-head button svg{width:17px;height:17px}.ird-periods{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:16px 0;padding:8px;border:1px solid #D7E3E2;border-radius:17px;background:rgba(255,255,255,.7)}.ird-periods button{padding:8px 18px;border-radius:999px;border:1px solid rgba(189,207,206,.82);background:rgba(253,253,252,.7);color:#6f7f7d;font-size:13px;font-weight:850;cursor:pointer}.ird-periods button.active{background:linear-gradient(135deg,${irdPalette.teal},${irdPalette.deep});color:${irdPalette.white};border-color:${irdPalette.teal};box-shadow:0 10px 22px rgba(12,64,68,.20)}.ird-periods>span{margin-left:auto;padding-right:14px;color:#83918F;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.ird-chart-box{position:relative;height:430px;border:1px solid rgba(219,191,148,.24);border-radius:20px;padding:22px 18px 10px;background:radial-gradient(circle at 16% 0%,rgba(197,154,104,.17),transparent 32%),linear-gradient(145deg,#0B4848,#07383B 62%,#052D31);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 22px 44px rgba(7,59,63,.2)}.ird-chart-box:before{content:'ORDER ACTIVITY';position:absolute;left:24px;top:14px;color:rgba(255,255,255,.32);font-size:8px;font-weight:900;letter-spacing:.16em}.ird-empty{height:100%;display:flex;align-items:center;justify-content:center;color:rgba(231,239,236,.72);font-size:13px}.ird-pulse{transform-box:fill-box;transform-origin:center;animation:irdPulse 1.6s ease-in-out infinite}.ird-tooltip{background:linear-gradient(145deg,rgba(253,253,252,.98),rgba(243,243,240,.96));border:1px solid rgba(189,207,206,.95);border-radius:14px;padding:16px 20px;box-shadow:0 22px 50px rgba(7,59,63,.18);min-width:240px}.ird-tooltip div{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}.ird-tooltip span{color:${irdPalette.grey};font-size:13px}.ird-tooltip b{color:${irdPalette.teal};font-size:13px;background:${irdPalette.mist};padding:6px 12px;border-radius:9px}.ird-tooltip strong{font-size:20px;color:${irdPalette.black}}.ird-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:36px}.ird-pie{min-height:620px;padding:56px 54px;border-radius:16px;background:${irdPalette.white}}.ird-pie h3{font-size:19px;margin:0 0 8px;font-weight:950;color:${irdPalette.teal}}.ird-pie>strong{display:block;font-family:"Cormorant Garamond",Georgia,serif;font-size:42px;margin:24px 0 30px;color:${irdPalette.black}}.ird-pie .recharts-responsive-container{height:340px}.ird-legend{display:flex;gap:22px;flex-wrap:wrap;justify-content:center;margin-top:20px}.ird-legend button{border:0;background:transparent;display:flex;align-items:center;gap:6px;cursor:pointer}.ird-legend i{width:12px;height:12px;border-radius:50%}.ird-legend span{font-size:15px;font-weight:900;color:${irdPalette.black}}.ird-actions{margin-top:22px;border-radius:18px}.ird-actions h3{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;margin:0 0 14px;color:${irdPalette.teal}}.ird-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}.ird-action-grid button{height:102px;border-radius:12px;border:1px solid rgba(189,207,206,.76);background:${irdPalette.white};display:flex;align-items:center;gap:12px;padding:0 36px;color:${irdPalette.deep};font-weight:950;font-size:15px;cursor:pointer}.ird-action-grid button:hover{transform:translateY(-2px);box-shadow:0 18px 38px rgba(7,59,63,.12)}.ird-create-split{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:26px}.ird-create-action{width:100%;height:54px;border:0;border-radius:14px;background:#00525C;color:#FDFDFC;font-size:15px;font-weight:950;cursor:pointer;box-shadow:0 16px 32px rgba(0,82,92,.15)}.ird-create-action:hover{background:#073B3F;transform:translateY(-1px)}.ird-create-action.secondary{background:#073B3F;box-shadow:0 16px 32px rgba(7,59,63,.15)}.ird-create-action.secondary:hover{background:#00525C}@media(max-width:640px){.ird-create-split{grid-template-columns:1fr}}
        @media(max-width:1180px){.ird-side{grid-template-columns:1fr}}
        @media(max-width:900px){.ird-side{grid-template-columns:1fr}.ird-pie{min-height:500px;padding:30px 24px}.ird-periods>span{width:100%;margin:4px 8px}}
        @media(max-width:760px){.ird-shell{padding:18px 14px 0}.ird-chart-head{grid-template-columns:1fr}.ird-chart-title-row h2{font-size:34px}.ird-chart-box{height:340px}.ird-action-grid{grid-template-columns:1fr}}
      `}</style>
      <div className="ird-grid">
        <IrdOrderTrendPanel title={`${roleName} Order Volume`} endpoint={endpoint} requestParams={requestParams} onSummaryChange={setOrderCount} />
        <div className="ird-side">
          <IrdDonutPanel title="Role Distribution" totalLabel={`${totalNetwork} total`} data={fastRoleDistribution.filter(item => Number(item.value || 0) > 0)} loading={countsLoading} onSliceClick={(entry) => {
            const routeMap = {
              'Distributor': '/superadmin/manage-users/distributor',
              'Wholesale Dealer': '/superadmin/manage-users/wholesale-dealer',
              'Retailer': '/superadmin/manage-users/retailer',
              'Customer': '/superadmin/manage-users/customer',
            }
            if (routeMap[entry.name]) navigate(routeMap[entry.name])
          }} />
          <IrdDonutPanel title="Today's Login Status" totalLabel={`${loginCounts.active + loginCounts.inactive} total users`} data={loginData} login onSliceClick={(entry) => entry.name === 'Active' ? navigate('/login-active') : navigate('/login-inactive')} loading={loginLoading} />
        </div>
      </div>
      <section className="ird-actions">
        <h3>{roleName} Management</h3>
        <div className="ird-action-grid">
          {hierarchyAction && <button onClick={hierarchyAction.onClick}><IrdIcon type={hierarchyAction.icon || 'store'} />Hierarchy</button>}
          {reportAction && <button onClick={reportAction.onClick}><IrdIcon type={reportAction.icon || 'report'} />Sales Report</button>}
        </div>
        <div className="ird-create-split">
          {createAction && <button className="ird-create-action" onClick={createAction.onClick}>+ {createAction.label}</button>}
          <button className="ird-create-action secondary" onClick={() => navigate('/create-customer')}>+ Create Customer</button>
        </div>
      </section>
    </div>
  )
}

function AdminQuickStats() {
  const [stats, setStats] = useState({ yesterday_orders: 0, today_orders: 0, today_new_customers: 0, active_users: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let current = true
    api.get('/dashboard-quick-stats/')
      .then(res => { if (current) setStats(prev => ({ ...prev, ...res.data })) })
      .catch(() => {})
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [])

  const cards = [
    { label: 'Yesterday Order', value: stats.yesterday_orders, sub: 'orders', note: 'Compared to today', color: '#9B31FF', bg: '#F5EAFF' },
    { label: 'Today Order', value: stats.today_orders, sub: 'orders', note: 'Orders placed today', color: '#00A767', bg: '#EAF8F0' },
    { label: 'Today New Customer', value: stats.today_new_customers, sub: '', note: 'Joined today', color: '#00A767', bg: '#EAF8F0' },
    { label: 'Active User', value: stats.active_users, sub: '', note: 'Logged in today', color: '#2563EB', bg: '#EAF2FF' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '14px', margin: '42px 46px 0', maxWidth: '1500px', marginLeft: 'auto', marginRight: 'auto' }} className="ad-qstats">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={`skel-${i}`} style={{ background: '#FDFDFC', border: '1px solid rgba(189,207,206,.78)', borderRadius: '14px', padding: '20px 22px', minHeight: '130px', boxShadow: '0 18px 46px rgba(7,59,63,.07)' }}>
            <div className="sa-kpi-skel-icon" style={{ width: '44px', height: '44px', borderRadius: '10px', marginBottom: '14px' }} />
            <div className="sa-kpi-skel-line" style={{ width: '65%', height: '11px', marginBottom: '12px' }} />
            <div className="sa-kpi-skel-line" style={{ width: '40%', height: '26px', marginBottom: '12px' }} />
            <div className="sa-kpi-skel-line" style={{ width: '55%', height: '11px' }} />
          </div>
        ))
      ) : (
        cards.map(kpi => (
          <div key={kpi.label} style={{ background: '#FDFDFC', border: '1px solid rgba(189,207,206,.78)', borderRadius: '14px', padding: '20px 22px', minHeight: '130px', boxShadow: '0 18px 46px rgba(7,59,63,.07)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h15l-2 9H8L6 3H3" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.06em', color: '#0C4044', marginBottom: '8px' }}>{kpi.label}</div>
            <div><span style={{ fontSize: '26px', fontWeight: 900, color: '#00152a' }}>{kpi.value}</span>{kpi.sub ? <span style={{ marginLeft: '8px', fontSize: '15px', color: '#111817' }}>{kpi.sub}</span> : null}</div>
            <div style={{ fontSize: '12px', color: '#009957', marginTop: '8px' }}>{kpi.note}</div>
          </div>
        ))
      )}
      <style>{`@media(max-width:1180px){.ad-qstats{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:760px){.ad-qstats{grid-template-columns:1fr!important;margin-left:14px!important;margin-right:14px!important}}`}</style>
    </div>
  )
}

function SectionHeader({ icon, label }) {
  const paths = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    id: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 8h4M15 12h4M7 16h10" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', borderRadius: '10px', marginBottom: '20px',
      background: 'linear-gradient(90deg, rgba(12,64,68,0.08), rgba(12,64,68,0.02))',
    }}>
      <div style={{
        width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
        background: 'linear-gradient(135deg,#0C4044,#073B3F)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FDFDFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {paths[icon] || paths.user}
        </svg>
      </div>
      <span style={{ color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  )
}

function getPasswordStrength(pw) {
  if (!pw) return { label: '', color: '', width: '0%' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { label: 'Weak', color: '#C92035', width: '33%' }
  if (score <= 4) return { label: 'Medium', color: '#BB8958', width: '66%' }
  return { label: 'Strong', color: '#0C4044', width: '100%' }
}

const OCCUPATIONS = ['employee', 'business', 'others']
const emptyForm = {
  initial: '', first_name: '', last_name: '', mobile_number: '',
  gender: 'male',
  dob: '',
  married_status: 'single',
  anniversary_date: '',
  email: '', password: '',
  door_no: '', street_name: '', town_name: '', city_name: '', pincode: '',
  district: '', state: '', aadhaar_no: '', pan_no: '',
  occupation: '', occupation_detail: '', annual_salary: ''
}



const DEALER_COLORS = ['#0C4044', '#BDCFCE', '#CCA881', '#C92035']

// ─── ADMIN CHAIN POPUP ───────────────────────────────────────────────────────
let _aChainPopupEl = null
let _aChainHideTimer = null

function hexToRgbA(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function removeAdminChainPopup() {
  document.querySelectorAll('#admin-chain-popup').forEach(el => el.remove())
  _aChainPopupEl = null
}

function scheduleHideAdminChainPopup() {
  clearTimeout(_aChainHideTimer)
  _aChainHideTimer = setTimeout(() => removeAdminChainPopup(), 200)
}

function showAdminChainPopup(anchorEl, ancestors, current, dark, text, subtext, superAdminEmail, adminData = null) {
  clearTimeout(_aChainHideTimer)
  removeAdminChainPopup()

  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...(adminData ? [{ type: 'admin', data: adminData }] : []),
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: current.role, data: current.node },
  ]

  const el = document.createElement('div')
  el.id = 'admin-chain-popup'

  // Inject keyframes once
  if (!document.getElementById('acp-styles')) {
    const s = document.createElement('style')
    s.id = 'acp-styles'
    s.textContent = `
      @keyframes acpSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
      @keyframes acpPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      @keyframes acpGlow{0%,100%{box-shadow:0 0 0px rgba(12,64,68,0)}50%{box-shadow:0 0 20px rgba(12,64,68,0.22)}}
      @keyframes acpShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      @keyframes acpBadgePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
      @keyframes fadeSlideIn{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      #admin-chain-popup::-webkit-scrollbar{width:6px}
      #admin-chain-popup::-webkit-scrollbar-track{background:rgba(253,253,252,0.03);border-radius:10px;margin:4px 0}
      #admin-chain-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#0C4044,#BDCFCE);border-radius:10px;box-shadow:0 0 6px rgba(12,64,68,0.4)}
      #admin-chain-popup::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#073B3F,#D1DFDE)}
      #admin-chain-popup{scrollbar-color:rgba(12,64,68,0.5) rgba(253,253,252,0.03)}
    `
    document.head.appendChild(s)
  }

  const isDark = dark
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${isDark ? 'rgba(7,59,63,0.97)' : 'rgba(248,250,252,0.98)'};
    border:1px solid ${isDark ? 'rgba(12,64,68,0.22)' : 'rgba(12,64,68,0.18)'};
    border-radius:20px; padding:20px;
    box-shadow:${isDark
      ? '0 32px 80px rgba(17,24,23,0.85), 0 0 0 1px rgba(12,64,68,0.06), inset 0 1px 0 rgba(253,253,252,0.04)'
      : '0 32px 80px rgba(17,24,23,0.15), 0 0 0 1px rgba(12,64,68,0.05)'};
    animation:acpSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
    min-width:200px; max-width:260px;
    max-height:85vh; overflow-y:auto; overflow-x:hidden;
    scroll-behavior:smooth; scrollbar-width:thin;
    scroll-padding:8px;
    -webkit-overflow-scrolling:touch;
    backdrop-filter:blur(28px);
    font-family:'Inter',system-ui,sans-serif;
  `

  const totalNodes = chain.length

  const itemsHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const isSuperAdmin = item.type === 'super_admin'

    const arrowHtml = idx > 0 ? `
      <div style="display:flex;justify-content:center;padding:5px 0;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(12,64,68,0.65),rgba(12,64,68,0.1));"></div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid rgba(12,64,68,0.5);"></div>
        </div>
      </div>` : ''

    if (isSuperAdmin) {
      return `
        ${arrowHtml}
        <div style="
          border-radius:14px;padding:14px 16px;
          background:${isDark ? 'linear-gradient(135deg,rgba(204,168,129,0.09),rgba(187,137,88,0.04))' : 'linear-gradient(135deg,rgba(204,168,129,0.14),rgba(187,137,88,0.06))'};
          border:1px solid rgba(204,168,129,0.28);
          position:relative;overflow:hidden;
        ">
          <div style="position:absolute;top:-10px;right:-10px;width:70px;height:70px;background:radial-gradient(circle,rgba(204,168,129,0.14),transparent 70%);pointer-events:none;"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#CCA881,#BB8958);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;box-shadow:0 4px 12px rgba(204,168,129,0.35);">🛡️</div>
            <div>
              <div style="font-size:9px;color:#CCA881;font-weight:800;letter-spacing:1.8px;">SUPER ADMIN</div>
              <div style="font-size:8px;color:rgba(204,168,129,0.45);margin-top:2px;letter-spacing:0.5px;">ROOT • FULL ACCESS</div>
            </div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:5px;">
              <div style="width:7px;height:7px;border-radius:50%;background:#0C4044;animation:acpPulse 1.8s ease-in-out infinite;box-shadow:0 0 8px rgba(12,64,68,0.9);"></div>
              <span style="font-size:9px;color:#0C4044;font-weight:700;">LIVE</span>
            </div>
          </div>
          <div style="font-size:12px;color:${isDark ? '#111817' : '#7A8987'};word-break:break-all;font-family:monospace;letter-spacing:0.3px;">${item.data.email || '—'}</div>
        </div>
      `
    }

    const cfg = ROLE_LABELS_ADMIN[item.type]
    if (!cfg) return ''
    const d = item.data || {}
    const idVal = d[cfg.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || ''
    const rc = hexToRgbA(cfg.color)

    return `
      ${arrowHtml}
      <div style="
        border-radius:14px;padding:14px 16px;
        background:${isLast
        ? `linear-gradient(135deg,rgba(${rc},0.13),rgba(${rc},0.05))`
        : `rgba(${rc},0.04)`};
        border:${isLast
        ? `1.5px solid rgba(${rc},0.55)`
        : `1px solid rgba(${rc},0.16)`};
        position:relative;overflow:hidden;
        ${isLast ? `animation:acpGlow 3s ease-in-out infinite;` : ''}
      ">
        ${isLast ? `<div style="position:absolute;top:-15px;right:-15px;width:80px;height:80px;background:radial-gradient(circle,rgba(${rc},0.18),transparent 70%);pointer-events:none;"></div>` : ''}

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">
          <div style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,${cfg.color},rgba(${rc},0.45));display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;box-shadow:0 4px 12px rgba(${rc},0.3);">${cfg.emoji}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:9px;color:${cfg.color};font-weight:800;letter-spacing:1.8px;">${cfg.label}</div>
            <div style="font-size:9px;color:${cfg.color};font-family:monospace;opacity:0.6;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idVal}</div>
          </div>
          ${isLast ? `
          <div style="font-size:8px;font-weight:800;padding:3px 9px;border-radius:20px;
            background:rgba(${rc},0.18);color:${cfg.color};
            border:1px solid rgba(${rc},0.4);
            animation:acpBadgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
            white-space:nowrap;letter-spacing:0.5px;">● CURRENT</div>` : ''}
        </div>

        <div style="font-size:14px;color:${isDark ? '#F3F3F0' : '#111817'};font-weight:700;margin-bottom:9px;letter-spacing:-0.3px;">${name}</div>

        <div style="display:flex;flex-direction:column;gap:6px;">
          ${phone !== '—' ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;">📞</div>
            <span style="font-size:12px;color:${isDark ? '#7A8987' : '#7A8987'};">${phone}</span>
          </div>` : ''}
          ${city ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;">📍</div>
            <span style="font-size:12px;color:${isDark ? '#7A8987' : '#7A8987'};">${city}</span>
          </div>` : ''}
        </div>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid ${isDark ? 'rgba(12,64,68,0.1)' : 'rgba(12,64,68,0.08)'};">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#0C4044,#BDCFCE);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 4px 10px rgba(12,64,68,0.4);">🔗</div>
        <div>
          <div style="font-size:11px;color:${isDark ? '#0C4044' : '#0C4044'};font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:${isDark ? '#7A8987' : '#7A8987'};margin-top:2px;">${totalNodes} level${totalNodes !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <div style="
        font-size:9px;font-weight:800;padding:4px 11px;border-radius:20px;
        background:linear-gradient(90deg,rgba(12,64,68,0.15),rgba(189,207,206,0.12),rgba(12,64,68,0.15));
        background-size:200% auto;
        animation:acpShimmer 2.5s linear infinite;
        border:1px solid rgba(12,64,68,0.22);
        color:${isDark ? '#073B3F' : '#0C4044'};
        letter-spacing:1px;">● LIVE</div>
    </div>

    ${itemsHtml}

    <div style="margin-top:14px;padding-top:12px;border-top:1px solid ${isDark ? 'rgba(253,253,252,0.04)' : 'rgba(17,24,23,0.05)'};">
      <div style="font-size:9px;color:${isDark ? '#7A8987' : '#111817'};text-align:center;letter-spacing:0.8px;font-weight:600;">BitByte Network • Hierarchy View</div>
    </div>
  `

  document.body.appendChild(el)

  const rect = anchorEl.getBoundingClientRect()
  const popW = 340
  const popH = Math.min(el.scrollHeight || 460, window.innerHeight * 0.85)
  let left = rect.right + 18
  let top = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth - 12) left = rect.left - popW - 18
  if (top < 12) top = 12
  if (top + popH > window.innerHeight - 12) top = window.innerHeight - popH - 12
  el.style.left = left + 'px'
  el.style.top = top + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_aChainHideTimer))
  el.addEventListener('mouseleave', () => scheduleHideAdminChainPopup())
  _aChainPopupEl = el
}

function printAdminPersonCard(node, role, color, ancestors, superAdminEmail) {
  const ROLE_PRINT = {
    admin: { label: 'SUPER STOCKIST', emoji: '🛡️', idKey: 'admin_id' },
    dealer: { label: 'DISTRIBUTOR', emoji: '🏪', idKey: 'dealer_id' },
    sub_dealer: { label: 'WHOLESALE DEALER', emoji: '🔗', idKey: 'sub_dealer_id' },
    promotor: { label: 'RETAILER', emoji: '🌟', idKey: 'promotor_id' },
    customer: { label: 'CUSTOMER', emoji: '👤', idKey: 'customer_id' },
  }

  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: role, data: node },
  ]

  const arrowDiv = `<div class="chain-arrow"><div style="display:flex;flex-direction:column;align-items:center;gap:0px;"><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid #7A8987;"></div><div style="width:2px;height:12px;background:linear-gradient(180deg,#7A8987,rgba(122,137,135,0.2));"></div></div></div>`

  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const arrow = idx < chain.length - 1 ? arrowDiv : ''

    if (item.type === 'super_admin') {
      return `
        <div class="chain-item">
          <div class="chain-role">🛡️ SUPER ADMIN</div>
          <div class="chain-email">${item.data.email || '—'}</div>
        </div>${arrow}`
    }

    const r = ROLE_PRINT[item.type]
    if (!r) return ''
    const d = item.data || {}
    const idVal = d[r.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || '—'

    return `
      <div class="chain-item ${isLast ? 'current' : ''}">
        <div class="chain-role">${r.emoji} ${r.label}</div>
        <div class="chain-id">${idVal}</div>
        <div class="chain-name">${name}</div>
        <div class="chain-info">📞 ${phone}</div>
        <div class="chain-info">📍 ${city}</div>
      </div>${arrow}`
  }).join('')

  const roleLabel = ROLE_PRINT[role]?.label || role.toUpperCase()
  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || '—'

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html><html><head>
    <title>${roleLabel} — ${currentName}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Inter',system-ui,sans-serif;background:#FDFDFC;padding:40px;display:flex;justify-content:center;}
      .wrapper{max-width:480px;width:100%;}
      .header{text-align:center;margin-bottom:28px;}
      .header h1{font-size:20px;font-weight:800;color:#FDFDFC;}
      .header p{font-size:12px;color:#7A8987;margin-top:4px;}
      .chain-item{background:#FDFDFC;border:1.5px solid #E7EDEC;border-radius:12px;padding:14px 18px;}
      .chain-item.current{border-color:${color};background:${color}11;box-shadow:0 4px 16px ${color}22;}
      .chain-role{font-size:10px;font-weight:800;color:#7A8987;letter-spacing:1px;margin-bottom:4px;text-transform:uppercase;}
      .chain-item.current .chain-role{color:${color};}
      .chain-id{font-family:monospace;font-size:11px;color:${color};margin-bottom:4px;}
      .chain-name{font-size:16px;font-weight:800;color:#FDFDFC;margin-bottom:6px;}
      .chain-email{font-size:12px;color:#7A8987;}
      .chain-info{font-size:12px;color:#7A8987;margin-top:3px;}
      .chain-arrow{display:flex;justify-content:center;padding:4px 0;}
      .footer{text-align:center;font-size:10px;color:#7A8987;margin-top:24px;letter-spacing:0.5px;}
      @media print{body{background:white;padding:20px;}.chain-item{box-shadow:none;}}
    </style>
    </head><body>
    <div class="wrapper">
      <div class="header">
        <h1>BitByte — ${roleLabel} Profile</h1>
        <p>Hierarchy Chain Report</p>
      </div>
      ${chainHtml}
      <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>
  `)
  printWindow.document.close()
}

// ─── ADMIN TREE NODE ─────────────────────────────────────────────────────────
function AdminTreeNode({ node, role, depth = 0, dark, text, subtext, colorIdx = 0, ancestors = [], superAdminEmail = '', adminData = null }) {
  const [expanded, setExpanded] = useState(depth < 2)

  const cfg = ROLE_CFG_ADMIN[role]
  const c = COLORS[colorIdx % COLORS.length]

  const childRole = {
    dealer: 'sub_dealer',
    sub_dealer: 'promotor',
    promotor: 'customer',
  }[role]

  const children = {
    dealer: node.sub_dealers,
    sub_dealer: node.promotors,
    promotor: node.customers,
  }[role] || []

  const hasChildren = children.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{
          background: dark ? `rgba(${hexToRgbA(c)},0.06)` : `rgba(${hexToRgbA(c)},0.08)`,
          border: `1px solid rgba(${hexToRgbA(c)},0.35)`,
          borderRadius: '12px', padding: '12px 16px',
          minWidth: '160px', maxWidth: '200px',
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 0.3s ease', position: 'relative',
        }}
        onMouseEnter={e => {
          clearTimeout(_aChainHideTimer)
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = `0 8px 24px rgba(${hexToRgbA(c)},0.25)`
          e.currentTarget.style.borderColor = `rgba(${hexToRgbA(c)},0.7)`
          showAdminChainPopup(e.currentTarget, ancestors, { node, role }, dark, text, subtext, superAdminEmail, adminData)
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = `rgba(${hexToRgbA(c)},0.35)`
          _aChainHideTimer = setTimeout(() => removeAdminChainPopup(), 300)
        }}
      >
        <div style={{ display: 'inline-block', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', marginBottom: '8px', background: `rgba(${hexToRgbA(c)},0.15)`, color: c, border: `1px solid rgba(${hexToRgbA(c)},0.35)` }}>
          {cfg.label}
        </div>
        <div style={{ color: c, fontFamily: 'monospace', fontSize: '10px', marginBottom: '4px', wordBreak: 'break-all' }}>
          {node[cfg.idKey]}
        </div>
        <div style={{ color: text, fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
          {node.first_name || node.dealer_name || node.promotor_name || '—'} {node.last_name || ''}
        </div>
        <div style={{ color: subtext, fontSize: '11px', marginBottom: '2px' }}>📞 {node.mobile_number}</div>
        {node.city_name && <div style={{ color: subtext, fontSize: '11px' }}>📍 {node.city_name}</div>}

        <div style={{ marginTop: '8px', width: '100%', height: 2, borderRadius: 2, background: `linear-gradient(90deg,rgba(${hexToRgbA(c)},0.2),${c})` }} />

        <button
          onClick={e => { e.stopPropagation(); printAdminPersonCard(node, role, c, adminData ? [{ type: 'admin', data: adminData }, ...ancestors] : ancestors, superAdminEmail) }}
          style={{ marginTop: '8px', width: '100%', padding: '3px 0', fontSize: '9px', fontWeight: 700, background: `rgba(${hexToRgbA(c)},0.1)`, border: `1px solid rgba(${hexToRgbA(c)},0.35)`, borderRadius: '6px', color: c, cursor: 'pointer', letterSpacing: '0.8px', transition: 'all 0.2s ease' }}
          onMouseEnter={e => e.currentTarget.style.background = `rgba(${hexToRgbA(c)},0.25)`}
          onMouseLeave={e => e.currentTarget.style.background = `rgba(${hexToRgbA(c)},0.1)`}
        >🖨️ PRINT</button>

        {hasChildren && (
          <div style={{ position: 'absolute', top: '8px', right: '10px', color: c, fontSize: '10px', fontWeight: 700, transition: 'transform 0.3s ease', transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>▲</div>
        )}
        {hasChildren && (
          <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', background: c, color: '#111817', fontSize: '9px', fontWeight: 800, padding: '1px 7px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
            {children.length} {childRole?.replace('_', ' ')}
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ width: 2, height: 28, background: `linear-gradient(180deg,${c},rgba(${hexToRgbA(c)},0.3))`, marginTop: '10px' }} />
          <div style={{ position: 'relative', width: '100%' }}>
            {children.length > 1 && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `rgba(${hexToRgbA(c)},0.45)` }} />
            )}
            <div style={{ display: 'flex', justifyContent: children.length === 1 ? 'center' : 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              {children.map((child, ci) => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: children.length === 1 ? '0 0 auto' : 1 }}>
                  <div style={{ width: 2, height: 20, background: `rgba(${hexToRgbA(c)},0.5)` }} />
                  <AdminTreeNode
                    node={child}
                    role={childRole}
                    depth={depth + 1}
                    dark={dark}
                    text={text}
                    subtext={subtext}
                    colorIdx={colorIdx + ci + 1}
                    ancestors={[...ancestors, { node, role }]}
                    superAdminEmail={superAdminEmail}
                    adminData={adminData}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

let _dpopupEl = null
let _dhideTimer = null

function removeDealerPopup() {
  document.querySelectorAll('#dealer-popup').forEach(el => el.remove())
  _dpopupEl = null
}

function scheduleDealerHide(setActiveDealer) {
  clearTimeout(_dhideTimer)
  _dhideTimer = setTimeout(() => {
    removeDealerPopup()
    setActiveDealer(null)
  }, 120)
}

function createDealerPopup(d, i, anchorEl, dark, subtext, text, currentAdmin) {
  removeDealerPopup()
  const c = DEALER_COLORS[i % DEALER_COLORS.length]
  const popupBg = dark ? 'linear-gradient(160deg,#091525,#E7EDEC)' : 'linear-gradient(160deg,#FDFDFC,#F3F3F0)'
  const popupBorder = dark ? 'rgba(12,64,68,0.25)' : 'rgba(12,64,68,0.25)'
  const saBoxBg = dark ? 'rgba(204,168,129,0.05)' : 'rgba(255,193,7,0.08)'
  const saBoxBorder = dark ? 'rgba(204,168,129,0.22)' : 'rgba(255,193,7,0.35)'
  const adminBoxBg = dark ? 'rgba(12,64,68,0.05)' : 'rgba(204,168,129,0.05)'
  const adminBoxBd = dark ? 'rgba(12,64,68,0.2)' : 'rgba(204,168,129,0.2)'
  const dealerBoxBg = dark ? 'rgba(189,207,206,0.04)' : 'rgba(12,64,68,0.05)'
  const dealerBoxBd = dark ? 'rgba(189,207,206,0.14)' : 'rgba(12,64,68,0.2)'
  const accentColor = dark ? '#0C4044' : '#0C4044'

  const el = document.createElement('div')   // ✅ இது முதல்ல வரணும்
  el.id = 'dealer-popup'
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${popupBg}; border:1px solid ${popupBorder};
    border-radius:14px; padding:14px;
    box-shadow:0 16px 48px rgba(17,24,23,0.45);
    animation:dealerPopupIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
    min-width:210px; max-width:250px;
    display:flex; flex-direction:column; align-items:stretch;
  `

  el.innerHTML = `
    <div style="font-size:9px;color:${accentColor};font-weight:700;letter-spacing:1.3px;margin-bottom:11px;padding-bottom:9px;border-bottom:1px solid ${popupBorder};display:flex;align-items:center;gap:6px;">
      <span style="width:5px;height:5px;border-radius:50%;background:${accentColor};display:inline-block;"></span>
      CREATED BY
    </div>

    <!-- Super Admin -->
    <div style="border-radius:9px;padding:10px;margin-bottom:6px;background:${saBoxBg};border:1px solid ${saBoxBorder};">
<div style="display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(204,168,129,0.12);color:#CCA881;border:1px solid rgba(204,168,129,0.3);margin-bottom:6px;">🛡️ SUPER ADMIN</div>    
<div style="font-size:11px;color:${subtext};word-break:break-all;">${localStorage.getItem('superAdminEmail') || localStorage.getItem('email') || '—'}</div>
      <div style="margin-top:5px;font-size:9px;padding:2px 7px;background:rgba(204,168,129,0.1);border:1px solid rgba(204,168,129,0.25);border-radius:20px;color:#CCA881;display:inline-block;">● ONLINE</div>
    </div>

    <!-- Arrow SA → Admin -->
    <div style="display:flex;justify-content:center;padding:3px 0;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #CCA881;"></div>
        <div style="width:2px;height:7px;background:linear-gradient(180deg,#CCA881,#CCA88144);"></div>
      </div>
    </div>

    <!-- Admin -->
    <div style="border-radius:9px;padding:10px;margin-bottom:6px;background:${adminBoxBg};border:1px solid ${adminBoxBd};">
<div style="display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(12,64,68,0.12);color:#0C4044;border:1px solid rgba(12,64,68,0.3);margin-bottom:6px;">🛡️ SUPER STOCKIST</div>
    <div style="font-size:10px;color:#0C4044;font-family:monospace;margin-bottom:3px;">${currentAdmin?.admin_id || '—'}</div>
      <div style="font-size:13px;font-weight:700;color:${text};margin-bottom:5px;">${currentAdmin?.first_name || currentAdmin?.admin_name || '—'}</div>
      <div style="font-size:11px;color:${subtext};margin-bottom:2px;">📞 ${currentAdmin?.mobile_number || currentAdmin?.admin_contact_no || '—'}</div>
      <div style="font-size:11px;color:${subtext};">📍 ${currentAdmin?.city_name || '—'}</div>
    </div>

    <!-- Arrow Admin → Dealer -->
    <div style="display:flex;justify-content:center;padding:3px 0;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid ${accentColor};"></div>
        <div style="width:2px;height:7px;background:linear-gradient(180deg,${accentColor},${accentColor}44);"></div>
      </div>
    </div>

    <!-- Dealer -->
    <div style="background:${dealerBoxBg};border:1px solid ${dealerBoxBd};border-radius:10px;padding:10px;">
      <div style="display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(189,207,206,0.12);color:#BDCFCE;border:1px solid rgba(189,207,206,0.25);margin-bottom:6px;">DISTRIBUTOR</div>
      <div style="font-size:10px;color:${c};font-family:monospace;margin-bottom:3px;">${d.dealer_id}</div>
      <div style="font-size:14px;font-weight:700;color:${text};margin-bottom:6px;">${d.first_name || ''}</div>
      <div style="font-size:11px;color:${subtext};margin-bottom:2px;">📞 ${d.mobile_number}</div>
      <div style="font-size:11px;color:${subtext};">📍 ${d.city_name}</div>
    </div>
  `
  document.body.appendChild(el)

  const rect = anchorEl.getBoundingClientRect()
  const popW = el.offsetWidth || 250
  const popH = el.offsetHeight || 320
  let left = rect.right + 14
  let top = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth - 10) left = rect.left - popW - 14
  if (top < 8) top = 8
  if (top + popH > window.innerHeight - 8) top = window.innerHeight - popH - 8
  el.style.left = left + 'px'
  el.style.top = top + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_dhideTimer))
  el.addEventListener('mouseleave', () => scheduleDealerHide(setActiveDealer))
  _dpopupEl = el
}

const emptyCustomerForm = {
  initial: '', first_name: '', last_name: '', mobile_number: '',
  gender: 'male', dob: '', married_status: 'single', anniversary_date: '',
  email: '', password: '',
  door_no: '', street_name: '', town_name: '', city_name: '', pincode: '',
  district: '', state: '', aadhaar_no: '', pan_no: '',
  occupation: '', occupation_detail: '', annual_salary: ''
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [dark, setDark] = useState(false)
  const [dealers, setDealers] = useState([])
  const [dealersLoading, setDealersLoading] = useState(true)
  const [admins, setAdmins] = useState([])
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [activeDealer, setActiveDealer] = useState(null)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')
  const [form, setForm] = useState(emptyForm)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pincodeLookupMsg, setPincodeLookupMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showAnnouncements, setShowAnnouncements] = useState(false)
  const [updateForm, setUpdateForm] = useState({})
  const [updateMessage, setUpdateMessage] = useState('')
  const [proofDocument, setProofDocument] = useState(null)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [myAdminId, setMyAdminId] = useState(null)
  const [metalPrices, setMetalPrices] = useState({ gold24k: null, gold22k: null, silver: null })
  const [metalLoading, setMetalLoading] = useState(false)
  const [usdToInr, setUsdToInr] = useState(null)
  const [dbRateDate, setDbRateDate] = useState(null)
  const [replyAnn, setReplyAnn] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyMsg, setReplyMsg] = useState('')
  const [repliedIds, setRepliedIds] = useState(new Set())
  const [annReplies, setAnnReplies] = useState({})
  const [replyPopupAnnId, setReplyPopupAnnId] = useState(null)
  const [replyPopupPos, setReplyPopupPos] = useState({ top: 0, left: 0 })
  const wishTimerRef = useRef(null)

  // Create Customer states
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm)
  const [customerConfirmPassword, setCustomerConfirmPassword] = useState('')
  const [customerPasswordError, setCustomerPasswordError] = useState('')
  const [customerPincodeLookupMsg, setCustomerPincodeLookupMsg] = useState('')
  const [customerMsg, setCustomerMsg] = useState('')
  const [customerMsgType, setCustomerMsgType] = useState('success')
  const [customerSubmitting, setCustomerSubmitting] = useState(false)

  const [showRequestCoin, setShowRequestCoin] = useState(false)
const [coinRequests, setCoinRequests] = useState([])
const [coinReqLoading, setCoinReqLoading] = useState(false)
const [approvingReqId, setApprovingReqId] = useState(null)
const [approvingAll, setApprovingAll] = useState(false)
const [coinReqMsg, setCoinReqMsg] = useState('')
const [coinReqMsgType, setCoinReqMsgType] = useState('success')
const [rejectingReqId, setRejectingReqId] = useState(null)
const [rejectReason, setRejectReason] = useState('')
const [rejectSubmitting, setRejectSubmitting] = useState(false)
const [showBuyCoin, setShowBuyCoin] = useState(false)
const [coinCart, setCoinCart] = useState([])
const [coinBuyMsg, setCoinBuyMsg] = useState('')
const [coinBuySubmitting, setCoinBuySubmitting] = useState(false)
const [selCoinMetal, setSelCoinMetal] = useState('gold_22k')
const [selCoinWeight, setSelCoinWeight] = useState('')
const [selCoinQty, setSelCoinQty] = useState('')
const [showStoredCoin, setShowStoredCoin] = useState(false)
const [coinStock, setCoinStock] = useState([])
const [coinStockLoading, setCoinStockLoading] = useState(false)








  // Luxiva customer theme palette
  const bg = dark ? '#073B3F' : '#FDFDFC'
  const text = dark ? '#FDFDFC' : '#111817'
  const subtext = dark ? '#D1DFDE' : '#7A8987'
  const accent = dark ? '#CCA881' : '#0C4044'
  const border = dark ? 'rgba(209,223,222,0.22)' : 'rgba(189,207,206,0.78)'
  const glass = dark ? 'rgba(7,59,63,0.9)' : 'rgba(253,253,252,0.92)'
  const cardBg = dark ? 'rgba(12,64,68,0.88)' : 'rgba(253,253,252,0.96)'
  const cardBorder = dark ? '1px solid rgba(209,223,222,0.22)' : '1px solid rgba(189,207,206,0.72)'
  const inpBg = dark ? 'rgba(253,253,252,0.08)' : '#FDFDFC'
  const inpBorder = dark ? 'rgba(209,223,222,0.24)' : '#BDCFCE'
  const optionBg = dark ? '#073B3F' : '#F3F3F0'
  const selectInput = { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }

  // Canvas animations removed for performance


  const fetchDealers = async () => {
    try {
      const [hierarchyRes, dealerRes] = await Promise.allSettled([
        api.get('/hierarchy/full/'),
        api.get('/dealers/'),
      ])

      const hierarchyData = hierarchyRes.status === 'fulfilled' ? hierarchyRes.value.data : null
      const flatDealers = dealerRes.status === 'fulfilled' ? dealerRes.value.data : []

      if (hierarchyData?.super_admin_email) {
        localStorage.setItem('superAdminEmail', hierarchyData.super_admin_email)
      }

      let dealerList = []
      let myAdminData = null

      if (hierarchyData?.admins?.length > 0) {
        myAdminData = hierarchyData.admins[0]

        // Build id map from hierarchy dealers
        const hierarchyDealerMap = {}
          ; (myAdminData.dealers || []).forEach(d => {
            hierarchyDealerMap[String(d.id)] = d
          })

        // Merge flat dealers (for table) with hierarchy nested data (for tree)
        dealerList = flatDealers.map(d => {
          const nested = hierarchyDealerMap[String(d.id)] || {}
          return {
            ...d,
            sub_dealers: (nested.sub_dealers || []).map(sd => ({
              ...sd,
              promotors: (sd.promotors || []).map(p => ({
                ...p,
                customers: p.customers || []
              }))
            })),
            _admin: myAdminData ? {
              id: myAdminData.id,
              admin_id: myAdminData.admin_id,
              first_name: myAdminData.first_name,
              last_name: myAdminData.last_name,
              mobile_number: myAdminData.mobile_number,
              city_name: myAdminData.city_name,
            } : null
          }
        })
      } else {
        // Fallback — flat dealers only
        dealerList = flatDealers
      }

      setDealers(dealerList)

      try {
        const adminRes = await api.get('/admins/list/')
        setAdmins(adminRes.data)
      } catch { }

    } catch (err) {
      console.error('dealers error:', err)
    } finally {
      setDealersLoading(false)
    }
  }



  const fetchProfile = async () => {
    try {
      const res = await api.get('/dashboard/')
      setProfileData(res.data)
    } catch (err) {
      console.error('profile error:', err)
    }
  }

  const PROFILE_FIELDS = [
    ['initial', 'Initial'],
    ['first_name', 'First Name'],
    ['last_name', 'Last Name'],
    ['email', 'Email'],
    ['mobile_number', 'Mobile Number'],
    ['gender', 'Gender'],
    ['dob', 'DOB'],
    ['married_status', 'Married Status'],
    ['anniversary_date', 'Anniversary Date'],
    ['door_no', 'Door No'],
    ['street_name', 'Street'],
    ['town_name', 'Town'],
    ['city_name', 'City'],
    ['district', 'District'],
    ['state', 'State'],
    ['aadhaar_no', 'Aadhaar No'],
    ['pan_no', 'PAN No'],
    ['occupation', 'Type'],
    ['occupation_detail', 'Detail'],
    ['annual_salary', 'Annual Salary'],
    ['admin_id', 'Super Stockist ID'],
    ['admin_name', 'Super Stockist Name'],
    ['admin_contact_no', 'Contact No'],
  ]

  const openProfileEdit = () => {
    const next = {}
    PROFILE_FIELDS.forEach(([key]) => {
      next[key] = profileData?.[key] || ''
    })

    setUpdateForm(next)
    setUpdateMessage('')
    setProofDocument(null)
    setShowProfileEdit(true)
  }

  const handleUpdateChange = e => {
    const { name, value } = e.target

    if (name === 'married_status' && value !== 'married') {
      setUpdateForm({ ...updateForm, married_status: value, anniversary_date: '' })
      return
    }

    setUpdateForm({ ...updateForm, [name]: value })
  }


  const submitProfileUpdate = async e => {
    e.preventDefault()

    if (!updateMessage.trim()) {
      alert('Please enter message / reason bro')
      return
    }

    if (!proofDocument) {
      alert('Please upload document proof bro')
      return
    }

    const fd = new FormData()

    PROFILE_FIELDS.forEach(([key]) => {
      if (
        !['email', 'admin_id', 'admin_name', 'admin_contact_no'].includes(key) &&
        updateForm[key] !== null &&
        updateForm[key] !== undefined
      ) {
        fd.append(key, updateForm[key])
      }
    })

    fd.append('message', updateMessage)
    fd.append('proof_document', proofDocument)

    try {
      await api.post('/profile-update-request/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setMsg('✅ Profile update request submitted successfully!')
      setMsgType('success')
      setShowProfileEdit(false)
      setUpdateMessage('')
      setProofDocument(null)
    } catch (err) {
      setMsg('❌ Error: ' + JSON.stringify(err.response?.data || err.message))
      setMsgType('error')
    }
  }

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admins/list/')
      setAdmins(res.data)
      // ── ADD THIS LINE ──
      const me = res.data.find(a => a.email === localStorage.getItem('email'))
      if (me) setMyAdminId(me.admin_id)
      // ── END ADD ──
    } catch (err) { console.error('admins error:', err.response?.status) }
  }





  // ── ADD before return() ──────────────────────────────────────────

  function extractIdsFromTitle(title) {
    return title.match(/BB[A-Z]+\d+/g) || []
  }

  function isCurrentUserMentioned(title) {
    if (!myAdminId) return false
    return extractIdsFromTitle(title).includes(myAdminId)
  }

  async function fetchReplies(annId) {
    try {
      const res = await api.get(`/announcements/${annId}/replies/`)
      setAnnReplies(prev => ({ ...prev, [annId]: res.data }))
    } catch { }
  }

  async function submitReply() {
    if (!replyText.trim()) return
    setReplyLoading(true)
    try {
      await api.post(`/announcements/${replyAnn.id}/replies/`, { message: replyText })
      setRepliedIds(prev => new Set([...prev, replyAnn.id]))
      setReplyMsg('✅ Wish sent!')
      setReplyText('')
    } catch (err) {
      if (err.response?.data?.error === 'Already replied') {
        setRepliedIds(prev => new Set([...prev, replyAnn.id]))
        setReplyMsg('⚠️ Already sent!')
      } else {
        setReplyMsg('❌ Failed.')
      }
    }
    setReplyLoading(false)
  }

const fetchMetalPrices = async () => {
  setMetalLoading(true)
  try {
    const res = await api.get('/metal-rates/')
    const d = res.data
    setMetalPrices({
      gold22k: parseFloat(d.gold_22k),
      gold24k: parseFloat(d.gold_24k),
      silver:  parseFloat(d.silver_999),
    })
    setDbRateDate(d.date)
  } catch (e) {
    setMetalPrices({ gold22k: null, gold24k: null, silver: null })
    setDbRateDate(null)
  }
  setMetalLoading(false)
}

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/')
      const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setAnnouncements(sorted)
      const lastSeen = parseInt(localStorage.getItem('adminAnnouncementSeen') || '0')
      const unread = sorted.filter(a => new Date(a.created_at).getTime() > lastSeen).length
      setUnreadCount(unread)
    } catch { }
  }

useEffect(() => {
  fetchDealers(); fetchAdmins(); fetchAnnouncements(); fetchProfile()
  fetchMetalPrices()
  const interval = setInterval(() => {
    fetchAnnouncements()
    fetchMetalPrices()
  }, 30000)
  return () => clearInterval(interval)
}, [])

  const handleChange = e => {
    const { name, value } = e.target

    if (name === 'married_status' && value !== 'married') {
      setForm({ ...form, married_status: value, anniversary_date: '' })
      return
    }

    setForm({ ...form, [name]: value })
  }

  
  const handleAdminChange = (e) => {
    const id = parseInt(e.target.value)
    const admin = admins.find(a => a.id === id)
    setSelectedAdmin(admin || null)
    setForm({ ...form, assigned_admin_id: id })
  }

  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setForm(prev => ({ ...prev, pincode: value }))
    setPincodeLookupMsg('')

    if (value.length === 6) {
      setPincodeLookupMsg('Fetching location details...')
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`)
        const data = await res.json()
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0]
          setForm(prev => ({
            ...prev,
            city_name: po.District || prev.city_name,
            district: po.District || prev.district,
            state: po.State || prev.state,
          }))
          setPincodeLookupMsg('Location details auto-filled')
        } else {
          setPincodeLookupMsg('Pincode not found — please enter manually')
        }
      } catch {
        setPincodeLookupMsg('Unable to fetch location — please enter manually')
      }
    }
  }

const handleSubmit = async e => {
  e.preventDefault()

  // Married na anniversary compulsory
  if (form.married_status === 'married' && !form.anniversary_date) {
    setMsg('❌ Please enter Anniversary Date!'); setMsgType('error')
    return
  }

  if (form.password !== confirmPassword) {
    setPasswordError('❌ Passwords do not match')
    return
  }

  try {
    const payload = { ...form }
    if (!payload.dob) delete payload.dob
    if (payload.married_status !== 'married') delete payload.anniversary_date
    await api.post('/dealers/', payload)
    setMsg('✅ Dealer created successfully!'); setMsgType('success')
    setShowForm(false); fetchDealers(); setForm(emptyForm); setSelectedAdmin(null)
    setConfirmPassword(''); setPasswordError('')
  } catch (err) {
    console.log('ERROR DETAILS:', JSON.stringify(err.response?.data))
    setMsg('❌ Error: ' + JSON.stringify(err.response?.data)); setMsgType('error')
  }
}

  const handleCustomerChange = e => {
    const { name, value } = e.target
    if (name === 'married_status' && value !== 'married') {
      setCustomerForm({ ...customerForm, married_status: value, anniversary_date: '' })
      return
    }
    setCustomerForm({ ...customerForm, [name]: value })
  }

  const handleCustomerPincodeChange = async e => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCustomerForm(prev => ({ ...prev, pincode: value }))
    setCustomerPincodeLookupMsg('')
    if (value.length === 6) {
      setCustomerPincodeLookupMsg('Fetching location details...')
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`)
        const data = await res.json()
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0]
          setCustomerForm(prev => ({
            ...prev,
            city_name: po.District || prev.city_name,
            district: po.District || prev.district,
            state: po.State || prev.state,
          }))
          setCustomerPincodeLookupMsg('Location details auto-filled')
        } else {
          setCustomerPincodeLookupMsg('Pincode not found — please enter manually')
        }
      } catch {
        setCustomerPincodeLookupMsg('Unable to fetch location — please enter manually')
      }
    }
  }

  const handleCustomerSubmit = async e => {
    e.preventDefault()
    if (customerForm.married_status === 'married' && !customerForm.anniversary_date) {
      setCustomerMsg('❌ Please enter Anniversary Date!'); setCustomerMsgType('error')
      return
    }
    if (customerForm.password !== customerConfirmPassword) {
      setCustomerPasswordError('❌ Passwords do not match')
      return
    }
    setCustomerSubmitting(true)
    try {
      const payload = { ...customerForm }
      if (!payload.dob) delete payload.dob
      if (payload.married_status !== 'married') delete payload.anniversary_date
      await api.post('/customers/', payload)
      setCustomerMsg('✅ Customer created successfully!'); setCustomerMsgType('success')
      setCustomerForm(emptyCustomerForm)
      setCustomerConfirmPassword(''); setCustomerPasswordError('')
      setTimeout(() => { setShowCreateCustomer(false); setCustomerMsg('') }, 2000)
    } catch (err) {
      setCustomerMsg('❌ Error: ' + JSON.stringify(err.response?.data)); setCustomerMsgType('error')
    }
    setCustomerSubmitting(false)
  }

  const card = {
    background: cardBg,
    border: cardBorder,
    borderRadius: '22px',
    padding: '34px 38px',
    marginBottom: '26px',
    boxShadow: dark ? '0 26px 70px rgba(17,24,23,0.18)' : '0 22px 58px rgba(7,59,63,0.08)',
    backdropFilter: 'blur(18px)',
  }
  const secHead = (color = '#0C4044') => ({ color, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 22px', paddingBottom: '15px', borderBottom: cardBorder })
  const secLabel = (color = '#0C4044') => ({ color, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '4px 0 0', paddingBottom: '11px', borderBottom: cardBorder })
 const inp = { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', boxShadow: dark ? 'none' : 'inset 0 1px 0 rgba(253,253,252,0.7)' }
  const lbl = { display: 'block', color: subtext, fontSize: '11px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.09em' }
  const sectionCard = { background: '#FDFDFC', border: '1px solid rgba(189,207,206,0.55)', borderRadius: '16px', padding: '22px 24px', marginBottom: '4px' }

  return (
    <div style={{ minHeight: '100vh', background: dark ? bg : 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: text, transition: 'background 0.8s ease, color 0.4s ease', fontFamily: '"Inter",system-ui,sans-serif', position: 'relative' }}>
      <style>{`
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        .ad-inp:focus,.sa-inp:focus{border-color:#0C4044 !important;box-shadow:0 0 0 4px rgba(12,64,68,0.08) !important}
        .ad-grad-btn{position:relative;overflow:hidden}
        .ad-grad-btn::after{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(253,253,252,.28),transparent);transform:translateX(-100%)}
        .ad-grad-btn:hover::after{animation:shimmer 1s infinite}
        .ad-tr:hover td{background:rgba(231,237,236,.55)}
        @keyframes dealerPopupIn{from{opacity:0;transform:translateY(8px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
@keyframes dPulseGlow{0%,100%{box-shadow:0 0 8px rgba(12,64,68,0.15);}50%{box-shadow:0 0 22px rgba(12,64,68,0.35);}}
@keyframes dDotPulse{0%,100%{transform:scale(1);opacity:0.7;}50%{transform:scale(1.6);opacity:1;}}
.d-card{background:rgba(253,253,252,0.94);border:1px solid rgba(189,207,206,0.82);border-radius:14px;padding:14px 18px;min-width:140px;cursor:pointer;position:relative;overflow:hidden;transition:background 0.35s ease,border-color 0.35s ease,transform 0.4s cubic-bezier(0.34,1.4,0.64,1),box-shadow 0.35s ease;}
.d-card.d-active{background:rgba(231,237,236,0.92);border-color:rgba(12,64,68,0.55);transform:translateY(-6px) scale(1.02);box-shadow:0 14px 34px rgba(7,59,63,0.13);animation:dPulseGlow 2.5s ease-in-out infinite;}
#ad-wish-popup::-webkit-scrollbar{width:5px}
#ad-wish-popup::-webkit-scrollbar-track{background:rgba(12,64,68,0.05);border-radius:10px;margin:4px 0}
#ad-wish-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#0C4044,#BDCFCE);border-radius:10px}
#ad-wish-popup{scrollbar-color:rgba(12,64,68,0.5) rgba(12,64,68,0.03)}
@keyframes adWishIn{from{opacity:0;transform:translate(-50%,calc(-100% + 8px)) scale(0.95)}to{opacity:1;transform:translate(-50%,calc(-100% - 10px)) scale(1)}}
@media(max-width:768px){
  .d-card{min-width:120px;padding:10px 14px;}
  .ad-tr td{padding:10px 12px;font-size:13px;}
}
@media(max-width:480px){
  .d-card{min-width:100px;padding:8px 10px;}
  .ad-tr td{padding:8px 10px;font-size:12px;}
}
      `}</style>

      <InternalRoleNavbar
        roleTitle="ADMIN"
        homePath="/admin"
        managementItems={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Distributor Hierarchy', path: '/admin-hierarchy-grid' },
          { label: 'Create Distributor', path: '/create-distributor' },
          { label: 'Create Customer', path: '/create-customer' },
          { label: 'Requests', action: () => setShowRequests(true) },
        ]}
        coinItems={[
          { label: 'Buy Coin', path: '/buy-coin' },
          { label: 'Available Coins', path: '/available-coins' },
          { label: 'Coin Requests', path: '/coin-requests-page', badge: coinRequests.filter(r => r.status === 'pending').length },
          { label: 'Coin Transactions', path: '/coin-transactions' },
        ]}
        reportItems={[
          { label: 'Distributor Hierarchy Grid', path: '/admin-hierarchy-grid' },
          { label: 'Distributor Hierarchy Tree', path: '/admin-hierarchy' },
          { label: 'Sales Report', path: '/sales-report' },
          { label: 'Login Active', path: '/login-active' },
          { label: 'Login Inactive', path: '/login-inactive' },
          { label: 'My Login Rewards', path: '/internal-my-login-rewards' },
          { label: 'Team Login Rewards', path: '/internal-team-login-rewards' },
        ]}
        commissionItems={[
          { label: 'My Commission', path: '/internal-my-commission' },
          { label: 'Team Commission', path: '/internal-team-commission' },
        ]}
        actionItems={[
          { label: 'Profile', icon: 'user', action: () => { setShowProfile(true); fetchProfile() } },
          { label: 'Announcements', icon: 'bell', action: () => { setShowAnnouncements(true); localStorage.setItem('adminAnnouncementSeen', Date.now().toString()); setUnreadCount(0) }, badge: unreadCount },
          { label: 'Logout', icon: 'logout', variant: 'danger', action: () => { localStorage.clear(); navigate('/login') } },
        ]}
      />
      <AdminQuickStats />
      <AdminDashboardFrame
        roleName="Super Stockist"
        focusLabel="Distributors"
        focusCount={dealers.length}
        roleDistribution={[
          { name: 'Distributor', value: dealers.length, color: '#0C4044' },
          { name: 'Wholesale Dealer', value: dealers.reduce((sum, dealer) => sum + (dealer.sub_dealers?.length || 0), 0), color: '#BB8958' },
          { name: 'Retailer', value: dealers.reduce((sum, dealer) => sum + (dealer.sub_dealers || []).reduce((sdSum, sd) => sdSum + (sd.promotors?.length || 0), 0), 0), color: '#CCA881' },
          { name: 'Customer', value: dealers.reduce((sum, dealer) => sum + (dealer.sub_dealers || []).reduce((sdSum, sd) => sdSum + (sd.promotors || []).reduce((pSum, p) => pSum + (p.customers?.length || 0), 0), 0), 0), color: '#C92035' },
        ]}
        quickActions={[
          { label: 'Distributor Hierarchy Grid', icon: 'store', onClick: () => navigate('/admin-hierarchy-grid') },
          { label: 'Distributor Hierarchy Tree', icon: 'store', onClick: () => navigate('/admin-hierarchy') },
          { label: 'Sales Report', icon: 'report', onClick: () => navigate('/sales-report') },
          { label: 'Create Distributor', icon: 'users', onClick: () => navigate('/create-distributor') },
        ]}
      />      <div style={{ position: 'relative', zIndex: 10, padding: '42px 46px 56px', maxWidth: '1500px', margin: '0 auto' }}>
        {msg && (
          <div style={{ background: msgType === 'success' ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${msgType === 'success' ? 'rgba(12,64,68,0.25)' : 'rgba(201,32,53,0.3)'}`, color: msgType === 'success' ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', marginBottom: '20px' }}>
            {msg}
          </div>
        )}





        {/* ── ANNOUNCEMENT VIEW MODAL (Admin) ── */}
        {showAnnouncements && (
          <div
            onClick={() => setShowAnnouncements(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.6)', animation: 'fadeIn 0.3s cubic-bezier(0.22,1,0.36,1)' }}
            >

              {/* Header */}
              <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(12,64,68,0.25),rgba(189,207,206,0.15))', border: '1px solid rgba(12,64,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📢</div>
                  <div>
                    <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>ANNOUNCEMENTS</div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>{announcements.length} total from Super Admin</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowAnnouncements(false)}
                  style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕ Close
                </button>
              </div>

              {/* EXISTING: List — REPLACE the .map() section with this: */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(12,64,68,0.4) transparent' }}>
                {announcements.length === 0 ? (
                  <div style={{ textAlign: 'center', color: subtext, padding: '60px 0', fontSize: '15px' }}>No announcements yet.</div>
                ) : (
                  announcements.map((ann, idx) => {
                    const isMentioned = isCurrentUserMentioned(ann.title)
                    const alreadyReplied = repliedIds.has(ann.id)
                    const replies = annReplies[ann.id] || []

                    return (
                      <div key={ann.id} style={{ background: idx === 0 ? (dark ? 'rgba(12,64,68,0.07)' : 'rgba(12,64,68,0.05)') : (dark ? 'rgba(253,253,252,0.02)' : 'rgba(17,24,23,0.02)'), border: `1px solid ${idx === 0 ? 'rgba(12,64,68,0.35)' : (dark ? 'rgba(253,253,252,0.06)' : 'rgba(17,24,23,0.08)')}`, borderRadius: '14px', padding: '16px 18px', position: 'relative' }}>

                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {idx === 0 && <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(12,64,68,0.15)', color: '#0C4044', border: '1px solid rgba(12,64,68,0.3)' }}>● NEW</span>}
                            <span style={{ color: idx === 0 ? '#0C4044' : text, fontWeight: 700, fontSize: '14px' }}>{ann.title}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: subtext, fontSize: '10px', whiteSpace: 'nowrap' }}>
                              {new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* REPLY BUTTON */}
                            <button
                              disabled={alreadyReplied}
                              onClick={() => { setReplyAnn(ann); setReplyMsg(''); setReplyText('') }}
                              style={{
                                padding: '4px 12px', fontSize: '10px', fontWeight: 700,
                                borderRadius: '20px', cursor: alreadyReplied ? 'not-allowed' : 'pointer',
                                background: alreadyReplied ? 'rgba(253,253,252,0.05)' : 'rgba(12,64,68,0.15)',
                                border: `1px solid ${alreadyReplied ? 'rgba(253,253,252,0.1)' : 'rgba(12,64,68,0.4)'}`,
                                color: alreadyReplied ? subtext : '#0C4044',
                                whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                              }}
                            >
                              {alreadyReplied ? '✓ Wished' : '💬 Reply'}
                            </button>
                          </div>
                        </div>

                        {/* Message */}
                        <p style={{ color: dark ? '#111817' : '#7A8987', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{ann.message}</p>

                        {/* HOVER POPUP — only if this admin is mentioned */}
{isMentioned && (
  <div
    onMouseEnter={e => {
      clearTimeout(wishTimerRef.current)
      const rect = e.currentTarget.getBoundingClientRect()
      let left = rect.left + rect.width / 2
      if (left - 160 < 12) left = 172
      if (left + 160 > window.innerWidth - 12) left = window.innerWidth - 172
      setReplyPopupPos({ top: rect.top, left })
      setReplyPopupAnnId(ann.id)
      fetchReplies(ann.id)
    }}
    onMouseLeave={() => { wishTimerRef.current = setTimeout(() => setReplyPopupAnnId(null), 220) }}
    style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}
  >
    <div style={{ fontSize: '10px', color: '#0C4044', padding: '3px 14px', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '20px', cursor: 'default', background: 'rgba(12,64,68,0.06)', fontWeight: 600 }}>
      🎂 You are mentioned · {replies.length} wish{replies.length !== 1 ? 'es' : ''} — hover to see
    </div>
  </div>
)}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}




        {/* ── REPLY MODAL — AdminDashboard ── */}
        {replyAnn && (
          <div
            onClick={() => { setReplyAnn(null); setReplyMsg(''); setReplyText('') }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.85)', backdropFilter: 'blur(12px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '20px', padding: '28px', width: '95%', maxWidth: '460px', boxShadow: '0 32px 80px rgba(17,24,23,0.7)', animation: 'fadeIn 0.25s ease' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>💬 SEND YOUR WISH</div>
                  <div style={{ color: subtext, fontSize: '11px', marginTop: '4px' }}>Replying to: <span style={{ color: text, fontWeight: 600 }}>{replyAnn.title}</span></div>
                </div>
                <button onClick={() => setReplyAnn(null)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </div>

              {replyMsg && (
                <div style={{ background: replyMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${replyMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: replyMsg.includes('✅') ? '#0C4044' : '#C92035', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
                  {replyMsg}
                </div>
              )}

              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Type your wish or message..."
                style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 14px', color: text, fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#0C4044'}
                onBlur={e => e.target.style.borderColor = inpBorder}
              />

              <button
                disabled={replyLoading || !replyText.trim()}
                onClick={submitReply}
                style={{ marginTop: '14px', width: '100%', padding: '13px', background: replyLoading || !replyText.trim() ? 'rgba(12,64,68,0.2)' : 'linear-gradient(90deg,#0C4044,#BDCFCE)', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', color: replyLoading || !replyText.trim() ? '#0C4044' : '#FDFDFC', cursor: replyLoading || !replyText.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}
              >
                {replyLoading ? '⏳ Sending...' : '💬 Send Wish'}
              </button>
            </div>
          </div>
        )}

{/* ── WISH HOVER POPUP — Admin ── */}
{replyPopupAnnId && (
  <div
    id="ad-wish-popup"
    onMouseEnter={() => clearTimeout(wishTimerRef.current)}
    onMouseLeave={() => { wishTimerRef.current = setTimeout(() => setReplyPopupAnnId(null), 220) }}
    style={{
      position: 'fixed',
      top: `${replyPopupPos.top}px`,
      left: `${replyPopupPos.left}px`,
      transform: 'translate(-50%, calc(-100% - 10px))',
      background: dark ? 'rgba(7,59,63,0.97)' : 'rgba(248,250,252,0.98)',
      border: '1px solid rgba(12,64,68,0.35)',
      borderRadius: '16px', padding: '16px 18px',
      minWidth: '270px', maxWidth: '340px', maxHeight: '280px',
      overflowY: 'auto', zIndex: 9999,
      boxShadow: '0 20px 60px rgba(17,24,23,0.7)',
      backdropFilter: 'blur(24px)',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(12,64,68,0.5) rgba(12,64,68,0.03)',
      animation: 'adWishIn 0.25s cubic-bezier(0.22,1,0.36,1) both',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(12,64,68,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(12,64,68,0.15)', border: '1px solid rgba(12,64,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>💬</div>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#0C4044', letterSpacing: '1.5px' }}>WISHES</span>
      </div>
      <div style={{ background: 'rgba(12,64,68,0.15)', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', color: '#0C4044', fontWeight: 800 }}>
        {(annReplies[replyPopupAnnId] || []).length}
      </div>
    </div>
    {(annReplies[replyPopupAnnId] || []).length === 0 ? (
      <div style={{ color: subtext, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>No wishes yet</div>
    ) : (annReplies[replyPopupAnnId] || []).map(r => (
      <div key={r.id} style={{ marginBottom: '8px', padding: '10px 12px', background: dark ? 'rgba(12,64,68,0.05)' : 'rgba(12,64,68,0.04)', borderRadius: '10px', border: '1px solid rgba(12,64,68,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0C4044' }}>{r.replied_by_name}</span>
          <span style={{ fontSize: '9px', color: subtext }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: dark ? '#111817' : '#7A8987', lineHeight: '1.5' }}>{r.message}</p>
      </div>
    ))}
    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(12,64,68,0.08)', textAlign: 'center', fontSize: '9px', color: dark ? '#7A8987' : '#111817', letterSpacing: '0.8px', fontWeight: 600 }}>
      BitByte Network • Wishes
    </div>
  </div>
)} 

        {/* ── ADMIN PROFILE MODAL ── */}
        {showProfile && (
          <div
            onClick={() => setShowProfile(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '580px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)', animation: 'fadeSlideIn 0.3s cubic-bezier(0.22,1,0.36,1)' }}
            >
              {/* Header */}
              <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(12,64,68,0.25),rgba(189,207,206,0.15))', border: '2px solid rgba(12,64,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 16px rgba(12,64,68,0.2)' }}>🛡️</div>
                  <div>
                    <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '15px', letterSpacing: '0.05em' }}>MY PROFILE</div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '3px', fontFamily: 'monospace' }}>{profileData?.admin_id || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

                  <button
                    onClick={openProfileEdit}
                    style={{
                      background: 'rgba(12,64,68,0.12)',
                      border: '1px solid rgba(12,64,68,0.35)',
                      color: '#0C4044',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 800
                    }}
                  >
                    ✎ Edit
                  </button>

                  <button
                    onClick={() => setShowProfile(false)}
                    style={{
                      background: 'rgba(201,32,53,0.1)',
                      border: '1px solid rgba(201,32,53,0.3)',
                      color: '#C92035',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕ Close
                  </button>

                </div>
              </div>

              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(12,64,68,0.4) transparent' }}>

                {!profileData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
                    <SkeletonBox height="140px" borderRadius="16px" />
                    <SkeletonBox height="180px" borderRadius="16px" />
                  </div>
                ) : (
                  <>
                    {/* Account Info */}
                    <div style={{ background: dark ? 'rgba(12,64,68,0.04)' : 'rgba(12,64,68,0.03)', border: '1px solid rgba(12,64,68,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#0C4044', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0C4044', display: 'inline-block' }} />
                        ACCOUNT INFO
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Super Stockist ID', value: profileData.admin_id, mono: true, color: '#0C4044' },
                          { label: 'Initial', value: profileData.initial },
                          { label: 'First Name', value: profileData.first_name },
                          { label: 'Last Name', value: profileData.last_name },
                          { label: 'Email', value: profileData.email },
                          { label: 'Mobile', value: profileData.mobile_number },
                          { label: 'Gender', value: profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : '—' },
                          { label: 'DOB', value: profileData.dob ? new Date(profileData.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                          { label: 'Married Status', value: profileData.married_status ? profileData.married_status.charAt(0).toUpperCase() + profileData.married_status.slice(1) : '—' },
                          ...(profileData.married_status === 'married' ? [
                            { label: 'Anniversary', value: profileData.anniversary_date ? new Date(profileData.anniversary_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' }
                          ] : []),

                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: f.color || text, fontSize: '13px', fontWeight: f.mono ? 700 : 500, fontFamily: f.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{f.value || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    <div style={{ background: dark ? 'rgba(189,207,206,0.04)' : 'rgba(189,207,206,0.03)', border: '1px solid rgba(189,207,206,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#BDCFCE', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BDCFCE', display: 'inline-block' }} />
                        ADDRESS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Door No', value: profileData.door_no },
                          { label: 'Street', value: profileData.street_name },
                          { label: 'Town', value: profileData.town_name },
                          { label: 'City', value: profileData.city_name },
                          { label: 'District', value: profileData.district },
                          { label: 'State', value: profileData.state },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: text, fontSize: '13px' }}>{f.value || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Identity */}
                    <div style={{ background: dark ? 'rgba(204,168,129,0.04)' : 'rgba(204,168,129,0.03)', border: '1px solid rgba(204,168,129,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#CCA881', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CCA881', display: 'inline-block' }} />
                        IDENTITY
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Aadhaar No', value: profileData.aadhaar_no, mask: true },
                          { label: 'PAN No', value: profileData.pan_no, panMask: true, mono: true },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: text, fontSize: '13px', fontFamily: f.mono || f.mask ? 'monospace' : 'inherit', letterSpacing: f.mask ? '0.1em' : 'normal' }}>
                              {f.mask && f.value ? `XXXX-XXXX-${f.value.slice(-4)}` : f.panMask && f.value ? `XXXXXXX${f.value.slice(-4)}` : (f.value || '—')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Occupation */}
                    <div style={{ background: dark ? 'rgba(187,137,88,0.04)' : 'rgba(187,137,88,0.03)', border: '1px solid rgba(187,137,88,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#BB8958', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BB8958', display: 'inline-block' }} />
                        OCCUPATION
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Type', value: profileData.occupation ? profileData.occupation.charAt(0).toUpperCase() + profileData.occupation.slice(1) : '—' },
                          { label: 'Detail', value: profileData.occupation_detail },
                          { label: 'Annual Salary', value: profileData.annual_salary ? `₹ ${Number(profileData.annual_salary).toLocaleString('en-IN')}` : '—' },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: text, fontSize: '13px' }}>{f.value || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin Info */}
                    <div style={{ background: dark ? 'rgba(12,64,68,0.06)' : 'rgba(12,64,68,0.04)', border: '1.5px solid rgba(12,64,68,0.35)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#0C4044', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0C4044', display: 'inline-block', boxShadow: '0 0 6px #0C4044' }} />
                        SUPER STOCKIST INFO
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Super Stockist ID', value: profileData.admin_id, mono: true, color: '#0C4044' },
                          { label: 'Super Stockist Name', value: profileData.admin_name },
                          { label: 'Contact No', value: profileData.admin_contact_no },
                          { label: 'Member Since', value: profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: f.color || text, fontSize: '13px', fontFamily: f.mono ? 'monospace' : 'inherit', fontWeight: f.mono ? 700 : 500 }}>{f.value || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {showProfileEdit && (
          <div
            onClick={() => setShowProfileEdit(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(17,24,23,0.88)',
              backdropFilter: 'blur(12px)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <form
              onSubmit={submitProfileUpdate}
              onClick={e => e.stopPropagation()}
              style={{
                background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC',
                border: '1px solid rgba(12,64,68,0.35)',
                borderRadius: '24px',
                width: '96%',
                maxWidth: '1050px',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 32px 90px rgba(17,24,23,0.8)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                padding: '22px 28px',
                borderBottom: '1px solid rgba(12,64,68,0.16)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '15px', letterSpacing: '1px' }}>
                    ✎ PROFILE UPDATE REQUEST
                  </div>
                  <div style={{ color: subtext, fontSize: '12px', marginTop: '4px' }}>
                    Existing details compare pannitu correct details full ah enter pannunga
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  style={{
                    background: 'rgba(201,32,53,0.1)',
                    border: '1px solid rgba(201,32,53,0.3)',
                    color: '#C92035',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(12,64,68,0.08)' }}>
                      {['Existing Details Description', 'Existing Details', 'Details To Updated'].map(h => (
                        <th
                          key={h}
                          style={{
                            padding: '14px',
                            color: '#0C4044',
                            textAlign: 'left',
                            border: '1px solid rgba(12,64,68,0.2)',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px'
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {PROFILE_FIELDS.map(([key, label]) => (
                      <tr key={key}>
                        <td style={{
                          padding: '12px 14px',
                          border: '1px solid rgba(253,253,252,0.08)',
                          color: '#073B3F',
                          fontWeight: 700
                        }}>
                          {label}
                        </td>

                        <td style={{
                          padding: '12px 14px',
                          border: '1px solid rgba(253,253,252,0.08)',
                          color: text,
                          wordBreak: 'break-all'
                        }}>
                          {profileData?.[key] || '—'}
                        </td>

                        <td style={{
                          padding: '10px',
                          border: '1px solid rgba(253,253,252,0.08)'
                        }}>
                          {key === 'gender' ? (
                            <select
                              name={key}
                              value={updateForm[key] || 'male'}
                              onChange={handleUpdateChange}
                              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                            >
                              <option value="male" style={{ background: optionBg, color: text }}>Male</option>
                              <option value="female" style={{ background: optionBg, color: text }}>Female</option>
                              <option value="other" style={{ background: optionBg, color: text }}>Other</option>
                            </select>
                          ) : key === 'married_status' ? (
                            <select
                              name={key}
                              value={updateForm[key] || 'single'}
                              onChange={handleUpdateChange}
                              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                            >
                              <option value="single" style={{ background: optionBg, color: text }}>Single</option>
                              <option value="married" style={{ background: optionBg, color: text }}>Married</option>
                              <option value="other" style={{ background: optionBg, color: text }}>Other</option>
                            </select>
                          ) : key === 'dob' ? (
                            <input
                              type="date"
                              name={key}
                              value={updateForm[key] || ''}
                              onChange={handleUpdateChange}
                              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                            />
                          ) : key === 'anniversary_date' ? (
                            updateForm.married_status === 'married' ? (
                              <input
                                type="date"
                                name={key}
                                value={updateForm[key] || ''}
                                onChange={handleUpdateChange}
                                style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                              />
                            ) : (
                              <span style={{ color: subtext, fontSize: '12px' }}>Only married select panna show aagum</span>
                            )
                          ) : (
                            <input
                              name={key}
                              value={updateForm[key] || ''}
                              onChange={handleUpdateChange}
                              required
                              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', color: subtext, fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>
                    Message / Reason
                  </label>

                  <textarea
                    value={updateMessage}
                    onChange={e => setUpdateMessage(e.target.value)}
                    placeholder="Example: My mobile number is wrong, please update it..."
                    rows={3}
                    style={{
                      width: '100%',
                      background: inpBg,
                      border: `1px solid ${inpBorder}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      color: text,
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>


                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', color: subtext, fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>
                    Upload Proof Document
                  </label>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setProofDocument(e.target.files[0])}
                    style={{
                      width: '100%',
                      background: inpBg,
                      border: `1px solid ${inpBorder}`,
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: text,
                      boxSizing: 'border-box'
                    }}
                  />

                  {proofDocument && (
                    <div style={{ color: '#0C4044', fontSize: '12px', marginTop: '8px' }}>
                      ✅ Selected: {proofDocument.name}
                    </div>
                  )}


                  <div style={{ color: subtext, fontSize: '12px', marginTop: '8px' }}>
                    PAN / Aadhaar / supporting document upload pannunga. Max size: 2 MB.
                  </div>

                  {/* {updateDoc && (
            <div style={{ color: '#0C4044', fontSize: '12px', marginTop: '8px' }}>
              Selected: {updateDoc.name}
            </div>
          )} */}
                </div>
              </div>

              <div style={{
                padding: '18px 28px',
                borderTop: '1px solid rgba(12,64,68,0.14)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  style={{
                    padding: '12px 22px',
                    background: inpBg,
                    border: `1px solid ${border}`,
                    borderRadius: '12px',
                    color: subtext,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '12px 30px',
                    background: 'linear-gradient(90deg,#0C4044,#BDCFCE)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#FDFDFC',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        )}

      </div>


      {showBuyCoin && (
  <div onClick={() => setShowBuyCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0a1628', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto', padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '16px' }}>Buy Coin — Request</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>Add coin types and weights, then send request to Super Admin</div>
        </div>
        <button onClick={() => setShowBuyCoin(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['gold_22k', 'gold_24k', 'silver_999'].map(m => (
          <div key={m} onClick={() => { setSelCoinMetal(m); setSelCoinWeight('') }}
            style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
              background: selCoinMetal === m ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${selCoinMetal === m ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.1)'}`,
              color: selCoinMetal === m ? '#fbbf24' : '#94a3b8' }}>
            {COIN_METAL_LABELS_TEXT[m]}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>WEIGHT</label>
          <select value={selCoinWeight} onChange={e => setSelCoinWeight(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 12px', color: '#fff', fontSize: '13px', outline: 'none' }}>
            <option value="" style={{ background: '#0a1628', color: '#fff' }}>-- Select --</option>
            {(selCoinMetal === 'silver_999' ? COIN_WEIGHTS_SILVER : COIN_WEIGHTS_GOLD).map(w => (
              <option key={w.label} value={w.label} style={{ background: '#0a1628', color: '#fff' }}>{w.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>QTY</label>
          <input type="number" min="1" value={selCoinQty} onChange={e => setSelCoinQty(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 12px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={addToCoinCart}
            style={{ padding: '11px 18px', background: 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '10px', color: '#3b0024', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
            + Add
          </button>
        </div>
      </div>

      {coinCart.length > 0 && (
        <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {coinCart.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{COIN_METAL_LABELS_TEXT[item.metal_type]} — {item.weight_label} × {item.qty}</span>
              <button onClick={() => removeCoinCartItem(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {coinBuyMsg && (
        <div style={{
          background: coinBuyMsg.startsWith('success:') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${coinBuyMsg.startsWith('success:') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: coinBuyMsg.startsWith('success:') ? '#4ade80' : '#f87171',
          borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px'
        }}>
          {coinBuyMsg.replace('success:', '').replace('error:', '')}
        </div>
      )}

      <button
        disabled={coinBuySubmitting || coinCart.length === 0}
        onClick={submitCoinRequest}
        style={{ width: '100%', padding: '14px', background: coinBuySubmitting || coinCart.length === 0 ? 'rgba(244,114,182,0.2)' : 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', color: '#3b0024', cursor: coinBuySubmitting || coinCart.length === 0 ? 'not-allowed' : 'pointer' }}>
        {coinBuySubmitting ? 'Sending Request...' : 'Confirm & Send Request'}
      </button>
    </div>
  </div>
)}

{showStoredCoin && (
  <div onClick={() => setShowStoredCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0a1628', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '24px', width: '95%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '22px 26px', borderBottom: '1px solid rgba(74,222,128,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '15px' }}>Stored Coins</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Coins approved by Super Admin</div>
        </div>
        <button onClick={() => setShowStoredCoin(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {coinStockLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[0, 1, 2].map(i => <SkeletonBox key={i} height="52px" borderRadius="12px" />)}
          </div>
        ) : coinStock.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No stock yet — send a Buy Coin request</div>
        ) : coinStock.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '12px' }}>
            <div>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '13px' }}>{COIN_METAL_LABELS_TEXT[s.metal_type]}</div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{s.weight_label}</div>
            </div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '20px', fontFamily: 'monospace' }}>{s.qty}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{showRequestCoin && (
  <div onClick={() => { setShowRequestCoin(false); setRejectingReqId(null); setRejectReason('') }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0a1628', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '24px', width: '95%', maxWidth: '620px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '22px 26px', borderBottom: '1px solid rgba(251,191,36,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '15px' }}>Coin Requests</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Pending requests received from dealers</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!coinReqLoading && coinRequests.filter(r => r.status === 'pending').length > 0 && (
            <button disabled={approvingAll} onClick={approveAllCoinRequests}
              style={{ padding: '8px 16px', background: approvingAll ? 'rgba(74,222,128,0.2)' : 'linear-gradient(90deg,#4ade80,#22d3ee)', border: 'none', borderRadius: '10px', color: '#003b40', fontWeight: 800, fontSize: '11px', cursor: approvingAll ? 'not-allowed' : 'pointer' }}>
              {approvingAll ? 'Approving...' : 'Approve All'}
            </button>
          )}
          <button onClick={() => { setShowRequestCoin(false); setRejectingReqId(null); setRejectReason('') }} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>✕</button>
        </div>
      </div>

      {coinReqMsg && (
        <div style={{
          margin: '14px 26px 0',
          background: coinReqMsgType === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${coinReqMsgType === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: coinReqMsgType === 'success' ? '#4ade80' : '#f87171',
          borderRadius: '10px', padding: '10px 14px', fontSize: '13px'
        }}>
          {coinReqMsg}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 26px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {coinReqLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[0, 1, 2].map(i => <SkeletonBox key={i} height="76px" borderRadius="14px" />)}
          </div>
        ) : coinRequests.filter(r => r.status === 'pending').length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No pending coin requests</div>
        ) : coinRequests.filter(r => r.status === 'pending').map(req => (
          <div key={req.id} style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '14px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', fontFamily: 'monospace' }}>{req.requested_by_id_str || req.requested_by_email}</div>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>{new Date(req.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button disabled={approvingReqId === req.id} onClick={() => approveCoinRequest(req.id)}
                  style={{ padding: '9px 18px', background: approvingReqId === req.id ? 'rgba(74,222,128,0.2)' : 'linear-gradient(90deg,#4ade80,#22d3ee)', border: 'none', borderRadius: '10px', color: '#003b40', fontWeight: 800, fontSize: '12px', cursor: approvingReqId === req.id ? 'not-allowed' : 'pointer' }}>
                  {approvingReqId === req.id ? 'Approving...' : 'Approve'}
                </button>
                <button onClick={() => { setRejectingReqId(rejectingReqId === req.id ? null : req.id); setRejectReason('') }}
                  style={{ padding: '9px 18px', background: rejectingReqId === req.id ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', color: '#f87171', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                  Reject
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {req.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#fff' }}>{COIN_METAL_LABELS_TEXT[item.metal_type]} — {item.weight_label}</span>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>× {item.qty}</span>
                </div>
              ))}
            </div>

            {rejectingReqId === req.id && (
              <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px' }}>
                <label style={{ display: 'block', color: '#f87171', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>Reason for rejection</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                  placeholder="Explain why this request is being rejected..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={rejectSubmitting} onClick={() => rejectCoinRequest(req.id)}
                    style={{ flex: 1, padding: '9px', background: rejectSubmitting ? 'rgba(239,68,68,0.2)' : 'linear-gradient(90deg,#ef4444,#f87171)', border: 'none', borderRadius: '8px', color: '#3b0000', fontWeight: 800, fontSize: '12px', cursor: rejectSubmitting ? 'not-allowed' : 'pointer' }}>
                    {rejectSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                  <button onClick={() => { setRejectingReqId(null); setRejectReason('') }}
                    style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </div>
  )
}







