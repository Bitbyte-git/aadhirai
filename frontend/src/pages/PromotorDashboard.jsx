import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api'
import logo from '../assets/logo.png'
import InternalRoleNavbar from '../collection/InternalRoleNavbar'
import CopyUrlButton from '../collection/CopyUrlButton'
import goldCoin from '../assets/gold-coin-transparent.png'
import silverCoin from '../assets/silver-coin.png'
import { SkeletonChart, SkeletonText, SkeletonRow, SkeletonBox } from '../components/Skeleton'
import '../components/skeleton.css'
import { IrdOrderTrendPanel, IrdDonutPanel } from './AdminDashboard'

const OCCUPATIONS = ['employee', 'business', 'others']
const emptyForm = {
  initial: '', first_name: '', last_name: '', mobile_number: '',
  gender: 'male',
  dob: '',
  married_status: 'single',
  anniversary_date: '',
  email: '', password: '',
    door_no: '', street_name: '', town_name: '', pincode: '', city_name: '',
  district: '', state: '', aadhaar_no: '', pan_no: '',
  occupation: '', occupation_detail: '', annual_salary: '',
  assigned_promotor_id: null
}

const PR_TREE_COLORS = ['#C92035', '#CCA881', '#BDCFCE', '#0C4044', '#BB8958', '#BDCFCE']

// AFTER imports, BEFORE hexToRgb — add this block
function SvgIcon({ name, size = 16, stroke = 'currentColor' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    print: <><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  }
  return <svg {...common}>{paths[name] || paths.close}</svg>
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
}


function PromotorDashboardFrame({ roleName, roleDistribution = [], quickActions = [], endpoint, requestParams = {} }) {
  const navigate = useNavigate()
  const [orderCount, setOrderCount] = useState(0)
  const [loginCounts, setLoginCounts] = useState({ active: 0, inactive: 0 })
  const [loginLoading, setLoginLoading] = useState(true)
  const [fastCounts, setFastCounts] = useState(null)
  const [countsLoading, setCountsLoading] = useState(true)
  const fastRoleDistribution = fastCounts ? [
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
        .ird-grid{display:block}.ird-chart-card,.ird-pie,.ird-actions{position:relative;overflow:hidden;background:${irdPalette.white};border:1px solid rgba(189,207,206,.78);border-radius:20px;padding:24px 28px;box-shadow:0 24px 64px rgba(7,59,63,.10);animation:irdIn .55s ease both}.ird-chart-card:before,.ird-pie:before,.ird-actions:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 5%,rgba(204,168,129,.18),transparent 30%),radial-gradient(circle at 95% 5%,rgba(12,64,68,.09),transparent 36%)}.ird-chart-card{margin-bottom:22px}.ird-chart-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start}.ird-chart-head p{margin:0;font-size:12px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;color:${irdPalette.antique}}.ird-chart-title-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.ird-chart-title-row h2{font-family:"Cormorant Garamond",Georgia,serif;font-size:42px;font-weight:950;line-height:1;color:${irdPalette.deep};margin:5px 0 0}.ird-chart-title-row span{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(12,64,68,.28);background:${irdPalette.mist};color:${irdPalette.teal};border-radius:999px;padding:8px 13px;font-size:12px;font-weight:900}.ird-chart-title-row i{width:8px;height:8px;border-radius:50%;background:${irdPalette.teal};box-shadow:0 0 0 4px rgba(12,64,68,.1)}.ird-chart-head small{display:block;margin-top:8px;font-size:13px;font-weight:800;color:${irdPalette.grey}}.ird-chart-head button{min-height:48px;padding:0 20px;border-radius:14px;border:1px solid rgba(12,64,68,.32);background:linear-gradient(135deg,${irdPalette.teal},${irdPalette.deep});color:${irdPalette.white};font-size:13px;font-weight:950;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 14px 28px rgba(7,59,63,.16)}.ird-chart-head button:disabled{opacity:.62;cursor:not-allowed}.ird-chart-head button svg{width:17px;height:17px}.ird-periods{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:16px 0;padding:8px;border:1px solid #D7E3E2;border-radius:17px;background:rgba(255,255,255,.7)}.ird-periods button{padding:8px 18px;border-radius:999px;border:1px solid rgba(189,207,206,.82);background:rgba(253,253,252,.7);color:#6f7f7d;font-size:13px;font-weight:850;cursor:pointer}.ird-periods button.active{background:linear-gradient(135deg,${irdPalette.teal},${irdPalette.deep});color:${irdPalette.white};border-color:${irdPalette.teal};box-shadow:0 10px 22px rgba(12,64,68,.20)}.ird-periods>span{margin-left:auto;padding-right:14px;color:#83918F;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.ird-chart-box{position:relative;height:430px;border:1px solid rgba(219,191,148,.24);border-radius:20px;padding:22px 18px 10px;background:radial-gradient(circle at 16% 0%,rgba(197,154,104,.17),transparent 32%),linear-gradient(145deg,#0B4848,#07383B 62%,#052D31);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 22px 44px rgba(7,59,63,.2)}.ird-chart-box:before{content:'ORDER ACTIVITY';position:absolute;left:24px;top:14px;color:rgba(255,255,255,.32);font-size:8px;font-weight:900;letter-spacing:.16em}.ird-empty{height:100%;display:flex;align-items:center;justify-content:center;color:rgba(231,239,236,.72);font-size:13px}.ird-pulse{transform-box:fill-box;transform-origin:center;animation:irdPulse 1.6s ease-in-out infinite}.ird-tooltip{background:linear-gradient(145deg,rgba(253,253,252,.98),rgba(243,243,240,.96));border:1px solid rgba(189,207,206,.95);border-radius:14px;padding:16px 20px;box-shadow:0 22px 50px rgba(7,59,63,.18);min-width:240px}.ird-tooltip div{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}.ird-tooltip span{color:${irdPalette.grey};font-size:13px}.ird-tooltip b{color:${irdPalette.teal};font-size:13px;background:${irdPalette.mist};padding:6px 12px;border-radius:9px}.ird-tooltip strong{font-size:20px;color:${irdPalette.black}}.ird-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:36px}.ird-pie{min-height:620px;padding:56px 54px;border-radius:16px;background:${irdPalette.white}}.ird-pie h3{font-size:19px;margin:0 0 8px;font-weight:950;color:${irdPalette.teal}}.ird-pie>strong{display:block;font-family:"Cormorant Garamond",Georgia,serif;font-size:42px;margin:24px 0 30px;color:${irdPalette.black}}.ird-pie .recharts-responsive-container{height:340px}.ird-legend{display:flex;gap:22px;flex-wrap:wrap;justify-content:center;margin-top:20px}.ird-legend button{border:0;background:transparent;display:flex;align-items:center;gap:6px;cursor:pointer}.ird-legend i{width:12px;height:12px;border-radius:50%}.ird-legend span{font-size:15px;font-weight:900;color:${irdPalette.black}}.ird-actions{margin-top:22px;border-radius:18px}.ird-actions h3{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;margin:0 0 14px;color:${irdPalette.teal}}.ird-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}.ird-action-grid button{height:102px;border-radius:12px;border:1px solid rgba(189,207,206,.76);background:${irdPalette.white};display:flex;align-items:center;gap:12px;padding:0 36px;color:${irdPalette.deep};font-weight:950;font-size:15px;cursor:pointer}.ird-action-grid button:hover{transform:translateY(-2px);box-shadow:0 18px 38px rgba(7,59,63,.12)}.ird-create-action{width:100%;height:54px;margin-top:26px;border:0;border-radius:14px;background:#00525C;color:#FDFDFC;font-size:15px;font-weight:950;cursor:pointer;box-shadow:0 16px 32px rgba(0,82,92,.15)}.ird-create-action:hover{background:#073B3F;transform:translateY(-1px)}
        @media(max-width:1180px){.ird-side{grid-template-columns:1fr}}
        @media(max-width:900px){.ird-side{grid-template-columns:1fr}.ird-pie{min-height:500px;padding:30px 24px}.ird-periods>span{width:100%;margin:4px 8px}}
        @media(max-width:760px){.ird-shell{padding:18px 14px 0}.ird-chart-head{grid-template-columns:1fr}.ird-chart-title-row h2{font-size:34px}.ird-chart-box{height:340px}.ird-action-grid{grid-template-columns:1fr}}
      `}</style>
      <div className="ird-grid">
        <IrdOrderTrendPanel title={`${roleName} Order Volume`} endpoint={endpoint} requestParams={requestParams} onSummaryChange={setOrderCount} />
        <div className="ird-side">
          <IrdDonutPanel title="Role Distribution" totalLabel={`${totalNetwork} total`} data={fastRoleDistribution.filter(item => Number(item.value || 0) > 0)} loading={countsLoading} onSliceClick={(entry) => {
            if (entry.name === 'Customer') navigate('/superadmin/manage-users/customer')
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
        {createAction && <button className="ird-create-action" onClick={createAction.onClick}>+ {createAction.label}</button>}
      </section>
    </div>
  )
}

function PromotorQuickStats() {
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '14px', margin: '42px 46px 0', maxWidth: '1500px', marginLeft: 'auto', marginRight: 'auto' }} className="pr-qstats">
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
      <style>{`@media(max-width:1180px){.pr-qstats{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:760px){.pr-qstats{grid-template-columns:repeat(2,minmax(0,1fr))!important;margin-left:14px!important;margin-right:14px!important}.pr-qstats>div{padding:14px!important;min-height:0!important}.pr-qstats>div>div:first-child{width:36px!important;height:36px!important;margin-bottom:8px!important}.pr-qstats>div>div:first-child svg{width:18px!important;height:18px!important}.pr-qstats>div>div:nth-child(2){font-size:9.5px!important;margin-bottom:6px!important}.pr-qstats>div>div:nth-child(3) span:first-child{font-size:20px!important}.pr-qstats>div>div:nth-child(4){font-size:11px!important;margin-top:6px!important}}`}</style>
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
      background: 'linear-gradient(90deg, rgba(201,32,53,0.08), rgba(201,32,53,0.02))',
    }}>
      <div style={{
        width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
        background: 'linear-gradient(135deg,#C92035,#BB8958)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FDFDFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {paths[icon] || paths.user}
        </svg>
      </div>
      <span style={{ color: '#C92035', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
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

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

// ─── CHAIN POPUP ───────────────────────────────────────────────────────────────
let _prChainPopupEl = null
let _prChainHideTimer = null

function removePRChainPopup() {
  document.querySelectorAll('#pr-chain-popup').forEach(el => el.remove())
  _prChainPopupEl = null
}

function showPRChainPopup(anchorEl, customer, dark, text, subtext, superAdminEmail, promotorInfo) {
  clearTimeout(_prChainHideTimer)
  removePRChainPopup()

  const CHAIN_CFG = {
    super_admin: { emoji: '🛡️', label: 'SUPER ADMIN', color: '#CCA881', idKey: null },
    sub_dealer:  { emoji: '🔗', label: 'WHOLESALE DEALER',  color: '#BB8958', idKey: 'sub_dealer_id' },
    promotor:    { emoji: '🌟', label: 'RETAILER',    color: '#CCA881', idKey: 'promotor_id' },
    customer:    { emoji: '👤', label: 'CUSTOMER',    color: '#C92035', idKey: 'customer_id' },
  }

  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...(promotorInfo?.sub_dealer_id ? [{
      type: 'sub_dealer',
      data: { sub_dealer_id: promotorInfo.sub_dealer_id, first_name: promotorInfo.sub_dealer_name, mobile_number: promotorInfo.sub_dealer_contact_no }
    }] : []),
    { type: 'promotor', data: promotorInfo || {} },
    { type: 'customer', data: customer },
  ]

  const el = document.createElement('div')
  el.id = 'pr-chain-popup'

  // Inject scrollbar styles once
  if (!document.getElementById('pr-chain-popup-styles')) {
    const s = document.createElement('style')
    s.id = 'pr-chain-popup-styles'
    s.textContent = `
      #pr-chain-popup::-webkit-scrollbar{width:6px}
      #pr-chain-popup::-webkit-scrollbar-track{background:rgba(253,253,252,0.03);border-radius:10px;margin:4px 0}
      #pr-chain-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#C92035,#CCA881);border-radius:10px;box-shadow:0 0 6px rgba(201,32,53,0.4)}
      #pr-chain-popup::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#F3E8DE,#F3E8DE)}
      #pr-chain-popup{scrollbar-color:rgba(201,32,53,0.5) rgba(253,253,252,0.03)}
    `
    document.head.appendChild(s)
  }

  const isDark = dark
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${isDark ? 'rgba(7,59,63,0.97)' : 'rgba(248,250,252,0.98)'};
    border:1px solid ${isDark ? 'rgba(201,32,53,0.22)' : 'rgba(201,32,53,0.18)'};
    border-radius:20px; padding:20px;
    box-shadow:${isDark
      ? '0 32px 80px rgba(17,24,23,0.85), 0 0 0 1px rgba(201,32,53,0.06), inset 0 1px 0 rgba(253,253,252,0.04)'
      : '0 32px 80px rgba(17,24,23,0.15), 0 0 0 1px rgba(201,32,53,0.05)'};
    animation:acpSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
    min-width:200px; max-width:280px;
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
    const cfg = CHAIN_CFG[item.type]
    if (!cfg) return ''

    const arrowHtml = idx > 0 ? `
      <div style="display:flex;justify-content:center;padding:5px 0;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(201,32,53,0.65),rgba(201,32,53,0.1));"></div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid rgba(201,32,53,0.5);"></div>
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

    const d = item.data || {}
    const idVal = cfg.idKey ? (d[cfg.idKey] || d.id || '—') : ''
    const name  = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city  = d.city_name || ''
    const rc    = hexToRgb(cfg.color)

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
            ${idVal ? `<div style="font-size:9px;color:${cfg.color};font-family:monospace;opacity:0.6;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idVal}</div>` : ''}
          </div>
          ${isLast ? `
          <div style="font-size:8px;font-weight:800;padding:3px 9px;border-radius:20px;
            background:rgba(${rc},0.18);color:${cfg.color};
            border:1px solid rgba(${rc},0.4);
            animation:acpBadgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
            white-space:nowrap;letter-spacing:0.5px;">● CURRENT</div>` : ''}
        </div>

        <div style="font-size:14px;color:${isDark ? '#E7EDEC' : '#111817'};font-weight:700;margin-bottom:9px;letter-spacing:-0.3px;">${name}</div>

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
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid ${isDark ? 'rgba(201,32,53,0.1)' : 'rgba(201,32,53,0.08)'};">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#C92035,#CCA881);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 4px 10px rgba(201,32,53,0.4);">🔗</div>
        <div>
          <div style="font-size:11px;color:${isDark ? '#F3E8DE' : '#C92035'};font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:${isDark ? '#7A8987' : '#7A8987'};margin-top:2px;">${totalNodes} level${totalNodes !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <div style="
        font-size:9px;font-weight:800;padding:4px 11px;border-radius:20px;
        background:linear-gradient(90deg,rgba(201,32,53,0.15),rgba(204,168,129,0.12),rgba(201,32,53,0.15));
        background-size:200% auto;
        animation:acpShimmer 2.5s linear infinite;
        border:1px solid rgba(201,32,53,0.25);
        color:${isDark ? '#F3E8DE' : '#C92035'};
        letter-spacing:1px;">● LIVE</div>
    </div>

    ${itemsHtml}

    <div style="margin-top:14px;padding-top:12px;border-top:1px solid ${isDark ? 'rgba(253,253,252,0.04)' : 'rgba(17,24,23,0.05)'};">
      <div style="font-size:9px;color:${isDark ? '#7A8987' : '#111817'};text-align:center;letter-spacing:0.8px;font-weight:600;">BitByte Network • Hierarchy View</div>
    </div>
  `

  document.body.appendChild(el)

  const rect = anchorEl.getBoundingClientRect()
  const popW = 280
  const popH = Math.min(el.scrollHeight || 460, window.innerHeight * 0.85)
  let left = rect.right + 18
  let top  = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth  - 12) left = rect.left - popW - 18
  if (top < 12) top = 12
  if (top + popH > window.innerHeight - 12) top = window.innerHeight - popH - 12
  el.style.left = left + 'px'
  el.style.top  = top  + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_prChainHideTimer))
  el.addEventListener('mouseleave', () => { _prChainHideTimer = setTimeout(() => removePRChainPopup(), 200) })
  _prChainPopupEl = el
}

// ─── PRINT ─────────────────────────────────────────────────────────────────────
function printCustomerCard(node, color, superAdminEmail, promotorInfo) {
  const arrowDiv = `<div class="chain-arrow"><div style="display:flex;flex-direction:column;align-items:center;gap:0;"><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid #7A8987;"></div><div style="width:2px;height:12px;background:linear-gradient(180deg,#7A8987,rgba(122,137,135,0.2));"></div></div></div>`

  const chain = [
    { type:'super_admin', label:'SUPER ADMIN', emoji:'🛡️', data:{ email: superAdminEmail } },
    ...(promotorInfo?.sub_dealer_id ? [{
      type:'sub_dealer', label:'WHOLESALE DEALER', emoji:'🔗',
      data:{ sub_dealer_id: promotorInfo.sub_dealer_id, first_name: promotorInfo.sub_dealer_name, mobile_number: promotorInfo.sub_dealer_contact_no }
    }] : []),
    { type:'promotor', label:'RETAILER', emoji:'🌟', data: promotorInfo || {} },
    { type:'customer', label:'CUSTOMER', emoji:'👤', data: node },
  ]

  const idMap = { sub_dealer:'sub_dealer_id', promotor:'promotor_id', customer:'customer_id' }

  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const arrow  = idx < chain.length - 1 ? arrowDiv : ''
    const d = item.data || {}
    if (item.type === 'super_admin') {
      return `<div class="chain-item"><div class="chain-role">${item.emoji} ${item.label}</div><div class="chain-email">${d.email || '—'}</div></div>${arrow}`
    }
    const idVal = idMap[item.type] ? (d[idMap[item.type]] || '—') : ''
    const name  = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    return `
      <div class="chain-item ${isLast ? 'current' : ''}">
        <div class="chain-role">${item.emoji} ${item.label}</div>
        ${idVal ? `<div class="chain-id">${idVal}</div>` : ''}
        <div class="chain-name">${name}</div>
        <div class="chain-info">📞 ${d.mobile_number || '—'}</div>
        <div class="chain-info">📍 ${d.city_name || '—'}</div>
      </div>${arrow}`
  }).join('')

  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || '—'
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><title>CUSTOMER — ${currentName}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter',system-ui,sans-serif;background:#FDFDFC;padding:40px;display:flex;justify-content:center;}.wrapper{max-width:480px;width:100%;}.header{text-align:center;margin-bottom:28px;}.header h1{font-size:20px;font-weight:800;color:#FDFDFC;}.header p{font-size:12px;color:#7A8987;margin-top:4px;}.chain-item{background:#FDFDFC;border:1.5px solid #E7EDEC;border-radius:12px;padding:14px 18px;}.chain-item.current{border-color:${color};background:${color}11;box-shadow:0 4px 16px ${color}22;}.chain-role{font-size:10px;font-weight:800;color:#7A8987;letter-spacing:1px;margin-bottom:4px;text-transform:uppercase;}.chain-item.current .chain-role{color:${color};}.chain-id{font-family:monospace;font-size:11px;color:${color};margin-bottom:4px;}.chain-name{font-size:16px;font-weight:800;color:#FDFDFC;margin-bottom:6px;}.chain-email{font-size:12px;color:#7A8987;}.chain-info{font-size:12px;color:#7A8987;margin-top:3px;}.chain-arrow{display:flex;justify-content:center;padding:4px 0;}.footer{text-align:center;font-size:10px;color:#7A8987;margin-top:24px;}@media print{body{background:white;padding:20px;}.chain-item{box-shadow:none;}}</style>
    </head><body><div class="wrapper"><div class="header"><h1>BitByte — CUSTOMER Profile</h1><p>Hierarchy Chain Report</p></div>${chainHtml}<div class="footer">Printed on ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div></div><script>window.onload=()=>{window.print()}<\/script></body></html>`)
  win.document.close()
}

// ─── CUSTOMER LEAF NODE ────────────────────────────────────────────────────────
function CustomerLeafNode({ node, dark, text, subtext, colorIdx=0, superAdminEmail='', promotorInfo=null }) {
  const c = PR_TREE_COLORS[colorIdx % PR_TREE_COLORS.length]

  return (
    <div
      style={{
        background: dark ? `rgba(${hexToRgb(c)},0.06)` : `rgba(${hexToRgb(c)},0.08)`,
        border: `1px solid rgba(${hexToRgb(c)},0.35)`,
        borderRadius:'12px', padding:'12px 16px',
        minWidth:'160px', maxWidth:'200px',
        cursor:'default',
        transition:'all 0.3s ease', position:'relative',
      }}
      onMouseEnter={e => {
        clearTimeout(_prChainHideTimer)
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(${hexToRgb(c)},0.25)`
        e.currentTarget.style.borderColor = `rgba(${hexToRgb(c)},0.7)`
        showPRChainPopup(e.currentTarget, node, dark, text, subtext, superAdminEmail, promotorInfo)
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = `rgba(${hexToRgb(c)},0.35)`
        _prChainHideTimer = setTimeout(() => removePRChainPopup(), 300)
      }}
    >
      <div style={{ display:'inline-block', fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', marginBottom:'8px', background:`rgba(${hexToRgb(c)},0.15)`, color:c, border:`1px solid rgba(${hexToRgb(c)},0.35)` }}>
        👤 CUSTOMER
      </div>
      <div style={{ color:c, fontFamily:'monospace', fontSize:'10px', marginBottom:'4px', wordBreak:'break-all' }}>{node.customer_id}</div>
      <div style={{ color:text, fontWeight:700, fontSize:'13px', marginBottom:'6px' }}>{node.first_name || '—'} {node.last_name || ''}</div>
      <div style={{ color:subtext, fontSize:'11px', marginBottom:'2px' }}>📞 {node.mobile_number}</div>
      {node.city_name && <div style={{ color:subtext, fontSize:'11px' }}>📍 {node.city_name}</div>}

      <div style={{ marginTop:'8px', width:'100%', height:2, borderRadius:2, background:`linear-gradient(90deg,rgba(${hexToRgb(c)},0.2),${c})` }} />

      <button
        onClick={e => { e.stopPropagation(); printCustomerCard(node, c, superAdminEmail, promotorInfo) }}
        style={{ marginTop:'8px', width:'100%', padding:'3px 0', fontSize:'9px', fontWeight:700, background:`rgba(${hexToRgb(c)},0.1)`, border:`1px solid rgba(${hexToRgb(c)},0.35)`, borderRadius:'6px', color:c, cursor:'pointer', letterSpacing:'0.8px', transition:'all 0.2s ease' }}
        onMouseEnter={e => e.currentTarget.style.background = `rgba(${hexToRgb(c)},0.25)`}
        onMouseLeave={e => e.currentTarget.style.background = `rgba(${hexToRgb(c)},0.1)`}
      >🖨️ PRINT</button>
    </div>
  )
}

function AnimatedNumber({ value, prefix = '₹ ', suffix = '' }) {
  const [displayVal, setDisplayVal] = useState(Number(value || 0))
  const animRef = useRef(null)
  const currentValRef = useRef(Number(value || 0))

  useEffect(() => {
    const startVal = currentValRef.current
    const endVal = Number(value || 0)
    if (startVal === endVal) return

    const duration = 500
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

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7D' },
  { key: 'month', label: '1M' },
  { key: '3month', label: '3M' },
  { key: 'year', label: '1Y' },
  { key: 'all', label: 'All' },
]

const TODAY_SLOTS = [
  '1:00 am', '3:00 am', '5:00 am', '7:00 am', '9:00 am', '11:00 am',
  '1:00 pm', '3:00 pm', '5:00 pm', '7:00 pm', '9:00 pm', '11:00 pm',
]

const getFallbackOrderSeries = (p) => {
  if (p === 'today') return TODAY_SLOTS.map(slot => ({ label: slot, count: 0 }))
  if (p === 'week') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(l => ({ label: l, count: 0 }))
  if (p === 'month') return ['1st', '5th', '10th', '15th', '20th', '25th', '30th'].map(l => ({ label: l, count: 0 }))
  if (p === '3month') return ['Jul', 'Aug', 'Sep'].map(l => ({ label: l, count: 0 }))
  if (p === 'year') return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(l => ({ label: l, count: 0 }))
  return ['2024', '2025', '2026'].map(l => ({ label: l, count: 0 }))
}

const formatAxisLabel = (iso, p) => {
  const d = new Date(iso)
  if (p === 'today') return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (p === 'week' || p === 'month' || p === '3month') return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

const completeChartSeries = (rows, p) => {
  const grouped = new Map()
  ;(rows || []).forEach(d => {
    const label = formatAxisLabel(d.time, p)
    const existing = grouped.get(label)
    if (existing) {
      existing.count += Number(d.count || 0)
    } else {
      grouped.set(label, {
        ...d,
        count: Number(d.count || 0),
        label,
      })
    }
  })
  return Array.from(grouped.values()).sort((a, b) => new Date(a.time) - new Date(b.time))
}

function CustomDarkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div style={{
      background: '#073B3F',
      color: '#FFFFFF',
      borderRadius: '8px',
      padding: '7px 14px',
      boxShadow: '0 8px 24px rgba(7,59,63,0.35)',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.12)',
      fontSize: '11px',
    }}>
      <div style={{ fontWeight: 800, fontSize: '13px' }}>{p.count ?? p.users ?? 0} orders</div>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{p.label || p.month}</div>
    </div>
  )
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function PromotorDashboard() {
  const navigate = useNavigate()                         
  const [dark, setDark] = useState(false)       
  const [customers, setCustomers]     = useState([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [allPromotors, setAllPromotors] = useState([])
  const [selectedPromotor, setSelectedPromotor] = useState(null)
  const [promotorInfo, setPromotorInfo] = useState(null)
  const [showForm, setShowForm]       = useState(false)
  const [msg, setMsg]                 = useState('')
  const [msgType, setMsgType]         = useState('success')
 const [form, setForm]               = useState(emptyForm)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [pincodeLookupMsg, setPincodeLookupMsg] = useState('')
const [updateMessage, setUpdateMessage] = useState('')
const [proofDocument, setProofDocument] = useState(null)

const [showProfile, setShowProfile] = useState(false)
const [showProfileEdit, setShowProfileEdit] = useState(false)
const [updateForm, setUpdateForm] = useState({})


const [metalPrices, setMetalPrices] = useState({ gold24k: null, gold22k: null, silver: null })
const [metalLoading, setMetalLoading] = useState(false)
const [usdToInr, setUsdToInr] = useState(null)
const [dbRateDate, setDbRateDate] = useState(null)

// ── COIN REQUEST / STOCK ──
const [showBuyCoin, setShowBuyCoin] = useState(false)
const [coinCart, setCoinCart] = useState([])   // [{metal_type, weight_label, weight_grams, qty}]
const [coinBuyMsg, setCoinBuyMsg] = useState('')
const [coinBuySubmitting, setCoinBuySubmitting] = useState(false)
const [selCoinMetal, setSelCoinMetal] = useState('gold_22k')
const [selCoinWeight, setSelCoinWeight] = useState('')
const [selCoinQty, setSelCoinQty] = useState('')

const [showStoredCoin, setShowStoredCoin] = useState(false)
  const [coinStock, setCoinStock] = useState([])
  const [coinStockLoading, setCoinStockLoading] = useState(false)

  // ── MY COIN REQUESTS (status tracking) ──
  const [showMyRequests, setShowMyRequests] = useState(false)
  const [myCoinRequests, setMyCoinRequests] = useState([])
  const [myRequestsLoading, setMyRequestsLoading] = useState(false)

  // ── SAAS DASHBOARD REAL-TIME & DATA STATES ──
  const [liveTime, setLiveTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 1. Live Gold Rate
  const [goldRate, setGoldRate] = useState(null)
  useEffect(() => {
    let current = true
    api.get('/metal-rates/')
      .then(res => {
        if (!current) return
        const val = res.data?.gold_22k ? parseFloat(res.data.gold_22k) : null
        setGoldRate(val)
      })
      .catch(() => {})
    return () => { current = false }
  }, [])

  // 2. Quick stats
  const [quickStats, setQuickStats] = useState({
    yesterday_orders: 0,
    today_orders: 0,
    today_new_customers: 0,
    active_users: 0,
    today_inactive_count: 0,
    sold_out_count: 0,
    notify_count: 0,
    customers: 0,
    total_users: 0,
  })
  useEffect(() => {
    let current = true
    api.get('/dashboard-quick-stats/')
      .then(res => {
        if (!current) return
        setQuickStats(prev => ({ ...prev, ...res.data }))
      })
      .catch(() => {})
    return () => { current = false }
  }, [])

  // 3. Order Timeseries AreaChart
  const [orderPeriod, setOrderPeriod] = useState('today')
  const [orderChartData, setOrderChartData] = useState([])
  const [orderLoading, setOrderLoading] = useState(false)

  const fetchOrderTimeseries = async (p = orderPeriod) => {
    setOrderLoading(true)
    try {
      const res = await api.get('/order-timeseries/', { params: { period: p } })
      const raw = res.data?.data || []
      if (p === 'today') {
        const slotMap = new Map()
        TODAY_SLOTS.forEach(slot => slotMap.set(slot, 0))
        raw.forEach(item => {
          if (!item.time) return
          const d = new Date(item.time)
          const hr = d.getHours()
          const slotIdx = Math.min(11, Math.floor(hr / 2))
          const slotName = TODAY_SLOTS[slotIdx]
          slotMap.set(slotName, (slotMap.get(slotName) || 0) + Number(item.count || 0))
        })
        const mapped = TODAY_SLOTS.map(slot => ({
          label: slot,
          count: slotMap.get(slot) || 0,
        }))
        const totalMapped = mapped.reduce((sum, r) => sum + r.count, 0)
        if (totalMapped === 0 && Number(quickStats.today_orders || 0) > 0) {
          const currentHour = new Date().getHours()
          const currentSlotIdx = Math.min(11, Math.floor(currentHour / 2))
          mapped[currentSlotIdx].count = Number(quickStats.today_orders || 1)
        }
        setOrderChartData(mapped)
      } else {
        const formatted = completeChartSeries(raw, p)
        if (formatted.length > 0) {
          setOrderChartData(formatted)
        } else {
          setOrderChartData(getFallbackOrderSeries(p))
        }
      }
    } catch {
      setOrderChartData(getFallbackOrderSeries(p))
    } finally {
      setOrderLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderTimeseries(orderPeriod)
  }, [orderPeriod])

  // 4. All Sales & Retailer Commission
  const [salesProfitPeriod, setSalesProfitPeriod] = useState('month')
  const [activeSalesProfitTab, setActiveSalesProfitTab] = useState('profit')
  const [salesProfitLoading, setSalesProfitLoading] = useState(false)
  const [salesProfitData, setSalesProfitData] = useState({
    allSales: 0,
    myCommission: 0,
    athiraiProfit: 0,
    salesBreakdown: [
      { name: '22K Gold Jewelry', value: 0, color: '#009957', pct: '0%' },
      { name: '24K Bullion / Coins', value: 0, color: '#BB8958', pct: '0%' },
      { name: '999 Fine Silver', value: 0, color: '#3E7C82', pct: '0%' },
      { name: 'Direct / Digital Orders', value: 0, color: '#073B3F', pct: '0%' },
    ],
    profitBreakdown: [
      { name: '22K Gold Commission', value: 0, color: '#009957', pct: '0%' },
      { name: 'Team Commission', value: 0, color: '#BB8958', pct: '0%' },
      { name: 'Silver Commission', value: 0, color: '#3E7C82', pct: '0%' },
      { name: 'Direct / Referral Rewards', value: 0, color: '#073B3F', pct: '0%' },
    ],
    monthlyTrend: [],
  })

  const salesProfitCacheRef = useRef({})
  const fetchSalesProfit = async (p = salesProfitPeriod) => {
    if (salesProfitCacheRef.current[p]) {
      setSalesProfitData(salesProfitCacheRef.current[p])
      return
    }
    setSalesProfitLoading(true)
    try {
      const res = await api.get(`/superadmin/sales-profit-summary/?period=${p}`)
      if (res.data) {
        const payload = {
          allSales: res.data.all_sales ?? 0,
          myCommission: res.data.my_commission ?? res.data.athirai_profit ?? 0,
          athiraiProfit: res.data.athirai_profit ?? 0,
          salesBreakdown: res.data.sales_breakdown || [],
          profitBreakdown: res.data.profit_breakdown || [],
          monthlyTrend: res.data.monthly_trend || [],
        }
        salesProfitCacheRef.current[p] = payload
        setSalesProfitData(payload)
      }
    } catch {
    } finally {
      setSalesProfitLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesProfit(salesProfitPeriod)
  }, [salesProfitPeriod])

  // 5. Role Distribution Data (Retailer has Customer)
  const promotorRoleDist = useMemo(() => {
    const c = quickStats
    const items = [
      { name: 'Customer', value: c.customers || 0, count: c.customers || 0, color: '#C92035', route: '/promotor-hierarchy-grid', pct: '100%' },
    ]
    return items
  }, [quickStats])

  const totalPromotorUsersCount = useMemo(() => {
    return promotorRoleDist.reduce((sum, item) => sum + Number(item.value || 0), 0)
  }, [promotorRoleDist])

  // 6. User Growth Chart
  const [userGrowthPeriod, setUserGrowthPeriod] = useState('Month')
  const [userGrowthLoading, setUserGrowthLoading] = useState(false)
  const [userGrowthStats, setUserGrowthStats] = useState({ total: 0, newUsers: 0, activeUsers: 0 })
  const [userGrowthChartData, setUserGrowthChartData] = useState([])

  const userGrowthCacheRef = useRef({})
  const fetchUserGrowth = async (p = userGrowthPeriod) => {
    const key = p.toLowerCase()
    if (userGrowthCacheRef.current[key]) {
      setUserGrowthStats(userGrowthCacheRef.current[key].stats)
      setUserGrowthChartData(userGrowthCacheRef.current[key].chart_data)
      return
    }
    setUserGrowthLoading(true)
    try {
      const res = await api.get(`/superadmin/user-growth/?period=${key}`)
      if (res.data) {
        const stats = {
          total: res.data.total_users ?? 0,
          newUsers: res.data.new_users ?? 0,
          activeUsers: res.data.active_users ?? 0,
        }
        const chart_data = res.data.chart_data || []
        userGrowthCacheRef.current[key] = { stats, chart_data }
        setUserGrowthStats(stats)
        setUserGrowthChartData(chart_data)
      }
    } catch {
    } finally {
      setUserGrowthLoading(false)
    }
  }

  useEffect(() => {
    fetchUserGrowth(userGrowthPeriod)
  }, [userGrowthPeriod])



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


 const fetchAll = async () => {
    try {
      const [custRes, dashRes, allPRRes] = await Promise.allSettled([
        api.get('/customers/'),
        api.get('/dashboard/'),
        api.get('/promotors/list'),
      ])
      if (custRes.status === 'fulfilled') {
        const payload = custRes.value.data
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
            ? payload.results
            : Array.isArray(payload?.customers)
              ? payload.customers
              : []
        setCustomers(rows)
      } else {
        setCustomers([])
      }
      if (dashRes.status === 'fulfilled') {
        setPromotorInfo(dashRes.value.data)
        if (dashRes.value.data?.super_admin_email) {
          localStorage.setItem('superAdminEmail', dashRes.value.data.super_admin_email)
        }
      }
      if (allPRRes.status === 'fulfilled') {
        const prPayload = allPRRes.value.data
        const prRows = Array.isArray(prPayload)
          ? prPayload
          : Array.isArray(prPayload?.results)
            ? prPayload.results
            : []
        setAllPromotors(prRows)
      } else {
        setAllPromotors([])
      }
    } catch(err) { console.error(err) } finally { setCustomersLoading(false) }
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
  ['promotor_id', 'Retailer ID'],
  ['sub_dealer_id', 'Wholesale Dealer ID'],
  ['sub_dealer_name', 'Wholesale Dealer Name'],
  ['sub_dealer_contact_no', 'Contact No'],
]


const openProfileEdit = () => {
  const next = {}
  PROFILE_FIELDS.forEach(([key]) => {
    next[key] = promotorInfo?.[key] || ''
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

// ── COIN REQUEST helpers ──
const COIN_WEIGHTS_GOLD = [
  { label: '50 mg', grams: 0.05 }, { label: '100 mg', grams: 0.10 }, { label: '150 mg', grams: 0.15 },
  { label: '200 mg', grams: 0.20 }, { label: '500 mg', grams: 0.50 }, { label: '1 gm', grams: 1 },
  { label: '2 gm', grams: 2 }, { label: '4 gm', grams: 4 }, { label: '8 gm', grams: 8 },
]
const COIN_WEIGHTS_SILVER = [
  { label: '500 mg', grams: 0.50 }, { label: '1 gm', grams: 1 }, { label: '2 gm', grams: 2 },
  { label: '5 gm', grams: 5 }, { label: '10 gm', grams: 10 }, { label: '20 gm', grams: 20 },
  { label: '50 gm', grams: 50 }, { label: '100 gm', grams: 100 },
]
const COIN_METAL_LABELS = { gold_22k: '🏅 Gold 22K', gold_24k: '🥇 Gold 24K', silver_999: '🥈 Silver 999' }

const addToCoinCart = () => {
  if (!selCoinWeight || !selCoinQty || Number(selCoinQty) < 1) {
    setCoinBuyMsg('❌ Weight & Qty select pannunga')
    return
  }
  const weightsArr = selCoinMetal === 'silver_999' ? COIN_WEIGHTS_SILVER : COIN_WEIGHTS_GOLD
  const w = weightsArr.find(x => x.label === selCoinWeight)
  if (!w) return
  setCoinCart(prev => [...prev, { metal_type: selCoinMetal, weight_label: w.label, weight_grams: w.grams, qty: Number(selCoinQty) }])
  setSelCoinWeight('')
  setSelCoinQty('')
  setCoinBuyMsg('')
}

const removeCoinCartItem = (idx) => {
  setCoinCart(prev => prev.filter((_, i) => i !== idx))
}

const submitCoinRequest = async () => {
  if (coinCart.length === 0) {
    setCoinBuyMsg('❌ Ore item aavathu add pannunga')
    return
  }
  setCoinBuySubmitting(true)
  try {
    await api.post('/coin-requests/', { items: coinCart })
    setCoinBuyMsg('✅ Request Sub Dealer-ku anupitten!')
    setCoinCart([])
    setTimeout(() => { setShowBuyCoin(false); setCoinBuyMsg('') }, 1400)
  } catch (err) {
    setCoinBuyMsg('❌ Failed: ' + JSON.stringify(err.response?.data || err.message))
  }
  setCoinBuySubmitting(false)
}

const fetchCoinStock = async () => {
  setCoinStockLoading(true)
  try {
    const res = await api.get('/coin-stock/')
    setCoinStock(res.data)
  } catch { setCoinStock([]) }
  setCoinStockLoading(false)
}

const fetchMyCoinRequests = async () => {
  setMyRequestsLoading(true)
  try {
    const res = await api.get('/coin-requests/')
    setMyCoinRequests(res.data)
  } catch { setMyCoinRequests([]) }
  setMyRequestsLoading(false)
}

useEffect(() => {
  if (showForm && promotorInfo) {
    setSelectedPromotor(promotorInfo)
    setForm(prev => ({ ...prev, assigned_promotor_id: promotorInfo.id }))
  }
}, [showForm])

useEffect(() => {
  fetchAll()
  fetchMetalPrices()
  const interval = setInterval(() => {
    fetchMetalPrices()
  }, 30000)
  return () => clearInterval(interval)
}, [])



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

const handlePromotorChange = (e) => {
  const id = parseInt(e.target.value)
  const pr = allPromotors.find(p => p.id === id)
  setSelectedPromotor(pr || null)
  setForm({ ...form, assigned_promotor_id: id })
}

const handleChange = e => {
  const { name, value } = e.target

  if (name === 'married_status' && value !== 'married') {
    setForm({ ...form, married_status: value, anniversary_date: '' })
    return
  }

  setForm({ ...form, [name]: value })
}

const handleSubmit = async e => {
  e.preventDefault()

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

    await api.post('/customers/', payload)
    setMsg('✅ Customer created successfully!'); setMsgType('success')
    setShowForm(false); fetchAll(); setForm(emptyForm)
    setConfirmPassword(''); setPasswordError('')
  } catch(err) {
    console.log('ERROR:', JSON.stringify(err.response?.data, null, 2))
    setMsg('❌ Error: ' + JSON.stringify(err.response?.data)); setMsgType('error')
  }
}

  const card     = { background: cardBg, border: cardBorder, borderRadius:'22px', padding:'clamp(18px, 3vw, 34px) clamp(16px, 3vw, 38px)', marginBottom:'26px', boxShadow: dark ? '0 26px 70px rgba(17,24,23,0.18)' : '0 22px 58px rgba(7,59,63,0.08)', backdropFilter:'blur(18px)' }
  const secHead  = (col='#F3E8DE') => ({ color:col, fontSize:'13px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 20px', paddingBottom:'14px', borderBottom: cardBorder })
  const secLabel = (col='#F3E8DE') => ({ color:col, fontSize:'12px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', margin:'4px 0 0', paddingBottom:'10px', borderBottom: cardBorder })
  const inp      = { width:'100%', background: inpBg, border:`1px solid ${inpBorder}`, borderRadius:'12px', padding:'13px 16px', color: text, fontSize:'14px', outline:'none', boxSizing:'border-box' }
  const lbl      = { display:'block', color: subtext, fontSize:'12px', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em' }
  const sectionCard = { background: '#FDFDFC', border: '1px solid rgba(201,32,53,0.2)', borderRadius: '16px', padding: 'clamp(14px, 2.5vw, 22px) clamp(12px, 2.5vw, 24px)', marginBottom: '4px' }

  const superAdminEmail = localStorage.getItem('superAdminEmail') || ''

  return (
    <div style={{ minHeight:'100vh', background: dark ? bg : 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: text, transition:'background 0.8s ease, color 0.4s ease', fontFamily:'"Inter",system-ui,sans-serif', position:'relative' }}>
      <style>{`
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes prPopupIn{from{opacity:0;transform:translateY(8px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes prPulseGlow{0%,100%{box-shadow:0 0 8px rgba(201,32,53,0.15);}50%{box-shadow:0 0 22px rgba(201,32,53,0.35);}}
        @keyframes prDotPulse{0%,100%{transform:scale(1);opacity:0.7;}50%{transform:scale(1.6);opacity:1;}}
        @keyframes acpSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes acpPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
        @keyframes acpGlow{0%,100%{box-shadow:0 0 0px rgba(201,32,53,0)}50%{box-shadow:0 0 20px rgba(201,32,53,0.22)}}
        @keyframes acpShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes acpBadgePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .pr-inp:focus{border-color:#C92035 !important}
        .pr-grad-btn{position:relative;overflow:hidden}
        .pr-grad-btn::after{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(253,253,252,.2),transparent);transform:translateX(-100%)}
        .pr-grad-btn:hover::after{animation:shimmer 1s infinite}
        .pr-tr:hover td{background:rgba(253,253,252,.02)}
        .form-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
        .form-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
        .profile-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        .profile-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
        .coin-buy-grid{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;margin-bottom:14px;}
        @media(max-width:768px){
          .pr-tr td{padding:10px 12px;font-size:13px;}
          .form-grid-3{grid-template-columns:repeat(2,1fr) !important;gap:12px !important;}
          .profile-grid-3{grid-template-columns:repeat(2,1fr) !important;}
          .coin-buy-grid{grid-template-columns:1fr 1fr !important;}
          .coin-buy-grid > div:last-child{grid-column:1 / -1;}
          .coin-buy-grid > div:last-child button{width:100%;}
        }
        @media(max-width:520px){
          .form-grid-3{grid-template-columns:1fr !important;gap:10px !important;}
          .form-grid-2{grid-template-columns:1fr !important;gap:10px !important;}
          .profile-grid-3{grid-template-columns:1fr !important;}
          .profile-grid-2{grid-template-columns:1fr !important;}
          .coin-buy-grid{grid-template-columns:1fr !important;}
        }
        @media(max-width:480px){
          .pr-tr td{padding:8px 10px;font-size:12px;}
        }

        /* ── Full SaaS Dashboard Styles ── */
        .sa-dashboard-container {
          width: 100%;
          max-width: 1540px;
          margin: 0 auto;
          padding: 24px 28px 48px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          overflow-x: hidden;
        }
        .sa-welcome-card {
          background: #FFFFFF;
          border-radius: 18px;
          border: 1px solid #E6ECEB;
          padding: 24px 30px;
          box-shadow: 0 4px 20px rgba(7, 59, 63, 0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .sa-welcome-card::after {
          content: '';
          position: absolute;
          right: -20px;
          top: -20px;
          bottom: -20px;
          width: 260px;
          background: radial-gradient(circle at 80% 50%, rgba(204,168,129,0.14), transparent 70%);
          pointer-events: none;
        }
        .sa-welcome-left {
          display: flex;
          align-items: center;
          gap: 18px;
          position: relative;
          z-index: 2;
        }
        .sa-welcome-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #FAF1E6;
          border: 1.5px solid #F3DEC4;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #BB8958;
          flex-shrink: 0;
        }
        .sa-welcome-title {
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .sa-welcome-sub {
          font-size: 13.5px;
          color: #6E7D7B;
          margin-top: 4px;
          font-weight: 500;
        }
        .sa-welcome-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }
        .sa-welcome-gold-display {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          background: #FFFFFF;
          border: 1.5px solid rgba(187, 137, 88, 0.45);
          border-radius: 14px;
          padding: 8px 16px;
          color: #073B3F;
          box-shadow: 0 2px 10px rgba(7, 59, 63, 0.05), 0 1px 3px rgba(187, 137, 88, 0.1);
          cursor: default;
          user-select: none;
        }
        .sa-welcome-gold-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0C4044 0%, #073B3F 100%);
          color: #E5BF91;
          border: 1px solid rgba(187, 137, 88, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.2);
        }
        .sa-welcome-gold-text {
          display: flex;
          flex-direction: column;
          text-align: left;
          line-height: 1.15;
        }
        .sa-welcome-gold-label {
          font-size: 12px;
          font-weight: 800;
          color: #073B3F;
          letter-spacing: 0.01em;
        }
        .sa-welcome-gold-val {
          font-size: 11.5px;
          font-weight: 750;
          color: #BB8958;
          margin-top: 2px;
        }
        .sa-welcome-right {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #F8FAF9;
          border: 1px solid #E2EAE8;
          border-radius: 14px;
          padding: 10px 18px;
          position: relative;
          z-index: 2;
        }
        .sa-kpi-grid-v2 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          width: 100%;
        }
        .sa-kpi-card-v2 {
          background: #FFFFFF;
          border: 1px solid #E4ECEB;
          border-radius: 16px;
          padding: 22px 24px;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.025);
          display: flex;
          align-items: center;
          gap: 18px;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          position: relative;
          overflow: hidden;
        }
        .sa-kpi-card-v2:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(7, 59, 63, 0.06);
        }
        .sa-kpi-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-kpi-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .sa-kpi-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #556664;
        }
        .sa-kpi-num {
          font-size: 30px;
          font-weight: 800;
          color: #071A2D;
          line-height: 1.1;
        }
        .sa-kpi-trend {
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .sa-middle-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 18px;
          width: 100%;
          align-items: stretch;
        }
        .sa-bottom-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          width: 100%;
          align-items: stretch;
        }
        .sa-saas-card {
          background: #FFFFFF;
          border: 1px solid #E4ECEB;
          border-radius: 16px;
          padding: 22px 24px;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.025);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
          position: relative;
        }
        .sa-saas-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }
        .sa-saas-card select {
          max-width: 130px;
          box-sizing: border-box;
        }
        .sa-saas-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 800;
          color: #073B3F;
        }
        .sa-profit-pill {
          background: #F8FAF9;
          border: 1px solid #E4ECEB;
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .sa-profit-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.08);
          border-color: #073B3F;
        }
        .sa-profit-pill.hero-profit {
          background: linear-gradient(135deg, #073B3F 0%, #0C4044 100%);
          border: 1px solid #073B3F;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.16);
        }
        .sa-profit-pill-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-profit-pill-icon.sales-icon {
          background: #EAF8F0;
          color: #009957;
        }
        .sa-profit-pill-icon.profit-icon {
          background: #EAF8F0;
          color: #009957;
        }
        .sa-profit-pill-icon.hero-icon {
          background: rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
        }
        .sa-revenue-income-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 14px;
          flex: 1;
          align-items: stretch;
        }
        .sa-sub-chart-title {
          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #7A8987;
          margin-bottom: 6px;
        }
        .sa-pie-legend {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 6px;
        }
        .sa-pie-legend-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: #0C4044;
          font-weight: 700;
        }
        .sa-pie-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sa-pie-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sa-pie-pct {
          color: #7A8987;
          font-weight: 800;
        }
        .sa-role-dist-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }
        .sa-role-table {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .sa-role-row {
          display: grid;
          grid-template-columns: 8px minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 8px;
          padding: 5px 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.18s ease;
          min-width: 0;
          box-sizing: border-box;
        }
        .sa-role-row:hover {
          background: #F4F7F6;
        }
        .sa-role-name {
          font-size: 12px;
          font-weight: 700;
          color: #172B29;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sa-role-count {
          font-size: 12.5px;
          font-weight: 800;
          color: #071A2D;
          text-align: right;
          min-width: 28px;
        }
        .sa-role-pct {
          font-size: 11.5px;
          color: #6E7D7B;
          text-align: right;
          min-width: 38px;
        }
        .sa-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 12px;
          transition: background 0.18s ease;
          cursor: pointer;
        }
        .sa-status-row:hover {
          background: #F4F7F6;
        }
        .sa-status-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sa-status-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-status-name {
          font-size: 13.5px;
          font-weight: 750;
          color: #111817;
        }
        .sa-status-desc {
          font-size: 11.5px;
          color: #7A8987;
          margin-top: 1px;
        }
        .sa-status-right {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 800;
        }
        .sa-qa-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          flex: 1;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .sa-qa-tile {
          background: #FDFDFC;
          border: 1px solid #E2EAE8;
          border-radius: 12px;
          padding: 12px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow: hidden;
        }
        .sa-qa-tile:hover {
          background: #F3F7F6;
          border-color: #BDCFCE;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(7, 59, 63, 0.06);
        }
        .sa-qa-tile-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }
        .sa-qa-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-qa-label {
          font-size: 12px;
          font-weight: 750;
          color: #0C4044;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sa-footer-banner {
          background: linear-gradient(135deg, #073B3F 0%, #032326 100%);
          border-radius: 20px 20px 0 0;
          padding: 30px 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #FFFFFF;
          margin-top: 16px;
          box-shadow: 0 -8px 28px rgba(7, 59, 63, 0.08);
          position: relative;
          overflow: hidden;
        }
        .sa-footer-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #BB8958, #CCA881, #BB8958);
        }
        .sa-footer-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sa-footer-motto {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 26px;
          font-style: italic;
          font-weight: 600;
          color: #F8FAF9;
          letter-spacing: 0.02em;
        }
        .sa-footer-underline {
          width: 56px;
          height: 2px;
          background: #BB8958;
        }
        .sa-footer-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sa-footer-brand {
          text-align: right;
        }
        .sa-footer-brand-title {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: #FDFDFC;
        }
        .sa-footer-brand-sub {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.22em;
          color: #CCA881;
          margin-top: 2px;
        }
        @media (max-width: 1200px) {
          .sa-kpi-grid-v2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sa-middle-grid { grid-template-columns: 1fr; }
          .sa-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .sa-revenue-income-grid { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (max-width: 680px) {
          .sa-dashboard-container { padding: 12px 10px 32px; gap: 14px; }
          .sa-welcome-card { flex-direction: column; align-items: flex-start; gap: 14px; padding: 16px 14px; }
          .sa-welcome-left { gap: 12px; }
          .sa-welcome-icon-box { width: 42px; height: 42px; }
          .sa-welcome-title { font-size: 18px; }
          .sa-welcome-sub { font-size: 12px; }
          .sa-welcome-actions { width: 100%; display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
          .sa-welcome-gold-display, .sa-welcome-right { width: 100%; box-sizing: border-box; justify-content: flex-start; }
          .sa-kpi-grid-v2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
          .sa-kpi-card-v2 { padding: 12px 10px !important; gap: 10px !important; border-radius: 12px !important; min-width: 0 !important; }
          .sa-kpi-icon-wrap { width: 38px !important; height: 38px !important; border-radius: 10px !important; }
          .sa-kpi-icon-wrap svg { width: 18px !important; height: 18px !important; }
          .sa-kpi-title { font-size: 9.5px !important; letter-spacing: 0.04em !important; }
          .sa-kpi-num { font-size: 20px !important; }
          .sa-kpi-trend { font-size: 10.5px !important; }
          .sa-saas-card { padding: 16px 14px !important; border-radius: 14px !important; }
          .sa-qa-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .sa-role-dist-wrap { flex-direction: column; align-items: stretch; gap: 14px; }
          .sa-footer-banner { flex-direction: column; align-items: flex-start; gap: 16px; padding: 22px 18px; border-radius: 16px 16px 0 0; }
          .sa-footer-motto { font-size: 20px; }
          .sa-footer-right { width: 100%; justify-content: space-between; }
        }
        @media (max-width: 420px) {
          .sa-qa-grid { grid-template-columns: 1fr; }
          .sa-kpi-grid-v2 { gap: 8px !important; }
          .sa-kpi-card-v2 { padding: 10px 8px !important; gap: 8px !important; }
          .sa-kpi-num { font-size: 18px !important; }
        }
      `}</style>

      <InternalRoleNavbar
        roleTitle="PROMOTER"
        homePath="/promotor"
        managementItems={[
          { label: 'Dashboard', path: '/promotor' },
          { label: 'Customer Hierarchy', path: '/promotor-hierarchy' },
          { label: 'Create Customer', path: '/create-customer' },
        ]}
        coinItems={[
          { label: 'Buy Coin', path: '/buy-coin' },
          { label: 'Available Coins', path: '/available-coins' },
          { label: 'My Requests', path: '/coin-requests-page', badge: myCoinRequests.filter(r => r.status === 'pending').length },
          { label: 'Coin Transactions', path: '/coin-transactions' },
        ]}
        reportItems={[
          { label: 'Customer Hierarchy Tree', path: '/promotor-hierarchy' },
          { label: 'Customer Hierarchy Grid', path: '/promotor-hierarchy-grid' },
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
          { label: 'Profile', icon: 'user', action: () => setShowProfile(true) },
          { label: 'Logout', icon: 'logout', variant: 'danger', action: () => { localStorage.clear(); navigate('/login') } },
        ]}
      />

      {/* ── RETAILER (PROMOTOR) SAAS DASHBOARD ── */}
      <div className="sa-dashboard-container">
        {/* 1. Welcome Card Banner */}
        <div className="sa-welcome-card">
          <div className="sa-welcome-left">
            <div className="sa-welcome-icon-box">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                <path d="M5 20h14" />
              </svg>
            </div>
            <div>
              <h1 className="sa-welcome-title">Welcome Back, Retailer!</h1>
              <div className="sa-welcome-sub">Here's what's happening with your network today.</div>
            </div>
          </div>

          <div className="sa-welcome-actions">
            {/* Today Gold Rate Badge (Static Text Display Only - No Click) */}
            <div className="sa-welcome-gold-display" title="Live Gold Rate">
              <div className="sa-welcome-gold-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <div className="sa-welcome-gold-text">
                <span className="sa-welcome-gold-label">Today Gold Rate</span>
                <span className="sa-welcome-gold-val">
                  22K: ₹{goldRate ? goldRate.toLocaleString('en-IN') : '7,250'}/g
                </span>
              </div>
            </div>

            {/* Live Clock / Calendar */}
            <div className="sa-welcome-right">
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#E6ECEB', color: '#0C4044', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#073B3F' }}>
                  {liveTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#6E7D7B', marginTop: '2px' }}>
                  {liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. KPI Cards (4 Cards) */}
        <div className="sa-kpi-grid-v2">
          {/* Card 1: Yesterday Order */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#F3E8FF', color: '#9333EA' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">YESTERDAY ORDER</div>
              <div className="sa-kpi-num">{quickStats.yesterday_orders ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>↑ +12%</span>
                <span style={{ color: '#7A8987', fontWeight: 500 }}>vs yesterday</span>
              </div>
            </div>
          </div>

          {/* Card 2: Today Order */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#E6F7F0', color: '#009957' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">TODAY ORDER</div>
              <div className="sa-kpi-num">{quickStats.today_orders ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>↑ +18%</span>
                <span style={{ color: '#7A8987', fontWeight: 500 }}>vs yesterday</span>
              </div>
            </div>
          </div>

          {/* Card 3: Today New Customer */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#EAF8F0', color: '#009957' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">TODAY NEW CUSTOMER</div>
              <div className="sa-kpi-num">{quickStats.today_new_customers ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>↑ +24%</span>
                <span style={{ color: '#7A8987', fontWeight: 500 }}>vs yesterday</span>
              </div>
            </div>
          </div>

          {/* Card 4: Active User */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">ACTIVE USER</div>
              <div className="sa-kpi-num">{quickStats.active_users ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>↑ +11%</span>
                <span style={{ color: '#7A8987', fontWeight: 500 }}>vs yesterday</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Middle Row: Order Volume & All Sales / Retailer Commission */}
        <div className="sa-middle-grid">
          {/* Column 1: Order Volume */}
          <div className="sa-saas-card" style={{ height: '100%', justifyContent: 'space-between' }}>
            <div className="sa-saas-card-head" style={{ marginBottom: '14px' }}>
              <div className="sa-saas-card-title">
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(12,64,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0C4044' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#0C4044', fontSize: '16px', fontWeight: 800 }}>Order Volume</div>
                  <div style={{ color: '#7A8987', fontSize: '12px', marginTop: '2px', fontWeight: 500 }}>Total orders overview</div>
                </div>
              </div>

              {/* Time Period Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F4F7F6', borderRadius: '24px', padding: '3px' }}>
                {PERIODS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setOrderPeriod(p.key)
                      fetchOrderTimeseries(p.key)
                    }}
                    style={{
                      background: orderPeriod === p.key ? '#073B3F' : 'transparent',
                      color: orderPeriod === p.key ? '#FFFFFF' : '#6E7D7B',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '5px 12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total count badge */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#071A2D' }}>
                {orderChartData.reduce((sum, r) => sum + Number(r.count || 0), 0).toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#009957' }}>orders in selected period</span>
              {orderLoading && <span style={{ fontSize: '11px', color: '#BB8958', fontWeight: 700 }}>• Updating...</span>}
            </div>

            {/* AreaChart */}
            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderChartData} margin={{ top: 10, right: 12, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="prOrderVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#009957" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#009957" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                  <XAxis dataKey="label" stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                  <YAxis stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, dataMax => Math.max(4, Math.ceil(dataMax * 1.25))]} tickCount={5} />
                  <Tooltip content={<CustomDarkTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#009957"
                    strokeWidth={2.4}
                    fill="url(#prOrderVolumeGrad)"
                    dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 6.5, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Column 2: All Sales & Retailer Commission */}
          <div className="sa-saas-card" style={{ height: '100%', justifyContent: 'space-between' }}>
            <div className="sa-saas-card-head" style={{ marginBottom: '10px' }}>
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009957" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                <span>All Sales & Retailer Commission</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {salesProfitLoading && (
                  <span style={{ fontSize: '10px', color: '#009957', fontWeight: 800 }}>● updating</span>
                )}
                <select
                  value={salesProfitPeriod}
                  onChange={e => setSalesProfitPeriod(e.target.value)}
                  style={{
                    background: '#F4F7F6', border: '1px solid #E2EAE8', color: '#0C4044',
                    borderRadius: '14px', padding: '4px 10px', fontSize: '11px', fontWeight: 800,
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="month">This Month</option>
                  <option value="past_month">Past Month</option>
                  <option value="year">This Year</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                </select>
              </div>
            </div>

            {/* Top 2 Metric Toggle Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {/* All Sales Pill */}
              <div
                onClick={() => setActiveSalesProfitTab('sales')}
                className={`sa-profit-pill ${activeSalesProfitTab === 'sales' ? 'hero-profit' : ''}`}
              >
                <div className={`sa-profit-pill-icon ${activeSalesProfitTab === 'sales' ? 'hero-icon' : 'sales-icon'}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: activeSalesProfitTab === 'sales' ? 'rgba(255,255,255,0.85)' : '#7A8987',
                    textTransform: 'uppercase',
                  }}>
                    All Sales
                  </div>
                  <div style={{
                    fontSize: '13.5px',
                    fontWeight: 850,
                    color: activeSalesProfitTab === 'sales' ? '#FFFFFF' : '#073B3F',
                  }}>
                    <AnimatedNumber value={salesProfitData.allSales} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: activeSalesProfitTab === 'sales' ? '#FFFFFF' : '#0C4044', fontWeight: 900 }}>→</span>
              </div>

              {/* Commission Pill */}
              <div
                onClick={() => setActiveSalesProfitTab('profit')}
                className={`sa-profit-pill ${activeSalesProfitTab === 'profit' ? 'hero-profit' : ''}`}
              >
                <div className={`sa-profit-pill-icon ${activeSalesProfitTab === 'profit' ? 'hero-icon' : 'profit-icon'}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: activeSalesProfitTab === 'profit' ? 'rgba(255,255,255,0.85)' : '#7A8987',
                    textTransform: 'uppercase',
                  }}>
                    My Commission
                  </div>
                  <div style={{
                    fontSize: '13.5px',
                    fontWeight: 850,
                    color: activeSalesProfitTab === 'profit' ? '#FFFFFF' : '#073B3F',
                  }}>
                    <AnimatedNumber value={salesProfitData.myCommission ?? salesProfitData.athiraiProfit} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: activeSalesProfitTab === 'profit' ? '#FFFFFF' : '#0C4044', fontWeight: 900 }}>→</span>
              </div>
            </div>

            {/* 2-Panel Donut & Line Graph */}
            <div className="sa-revenue-income-grid" style={{ opacity: salesProfitLoading ? 0.75 : 1, transition: 'opacity 0.25s ease' }}>
              {/* Left Donut Breakdown */}
              <div className="sa-revenue-breakdown-col">
                <div className="sa-sub-chart-title">
                  {activeSalesProfitTab === 'sales' ? 'SALES BREAKDOWN' : 'COMMISSION BREAKDOWN'}
                </div>
                <div style={{ width: '100%', height: '170px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeSalesProfitTab === 'sales' ? salesProfitData.salesBreakdown : salesProfitData.profitBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={78}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={450}
                        animationEasing="ease-in-out"
                      >
                        {(activeSalesProfitTab === 'sales' ? salesProfitData.salesBreakdown : salesProfitData.profitBreakdown).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div style={{ background: '#073B3F', color: '#fff', padding: '6px 10px', borderRadius: 8, fontSize: 11 }}>
                            <div style={{ fontWeight: 800 }}>{d.name}</div>
                            <div>₹ {Number(d.value || 0).toLocaleString()} ({d.pct})</div>
                          </div>
                        )
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sa-pie-legend">
                  {(activeSalesProfitTab === 'sales' ? salesProfitData.salesBreakdown : salesProfitData.profitBreakdown).map(item => (
                    <div key={item.name} className="sa-pie-legend-row">
                      <span className="sa-pie-dot" style={{ background: item.color }} />
                      <span className="sa-pie-text">{item.name}</span>
                      <span className="sa-pie-pct">{item.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Trend LineChart */}
              <div className="sa-monthly-trend-col" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="sa-sub-chart-title">
                  {activeSalesProfitTab === 'sales' ? 'SALES TREND' : 'COMMISSION TREND'}
                </div>
                <div style={{ flex: 1, minHeight: '180px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesProfitData.monthlyTrend} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                      <XAxis dataKey="month" stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                      <YAxis
                        stroke="#8E9E9C"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, dataMax => Math.max(10, Math.ceil(dataMax * 1.25))]}
                        tickFormatter={v => {
                          if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
                          if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`
                          return `₹${v}`
                        }}
                      />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const row = payload[0].payload
                        const val = activeSalesProfitTab === 'sales' ? row.sales : row.profit
                        return (
                          <div style={{ background: '#073B3F', color: '#FFFFFF', borderRadius: 8, padding: '7px 12px', fontSize: 11 }}>
                            <div style={{ fontWeight: 800 }}>{row.name || row.month}</div>
                            <div style={{ color: '#E5BF91', marginTop: 2 }}>
                              ₹ {Number(val || 0).toLocaleString()}
                            </div>
                          </div>
                        )
                      }} />
                      <Line
                        type="monotone"
                        dataKey={activeSalesProfitTab === 'sales' ? 'sales' : 'profit'}
                        stroke="#009957"
                        strokeWidth={2.4}
                        dot={{ r: 3, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                        activeDot={{ r: 6, fill: '#073B3F' }}
                        isAnimationActive={true}
                        animationDuration={450}
                        animationEasing="ease-in-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Row 1: Role Distribution & User Growth */}
        <div className="sa-bottom-grid">
          {/* Card 1: Role Distribution */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span>Role Distribution</span>
              </div>
              <div style={{ background: '#EAEFEF', color: '#0C4044', borderRadius: '16px', padding: '4px 12px', fontSize: '11.5px', fontWeight: 800 }}>
                Total: {totalPromotorUsersCount.toLocaleString()}
              </div>
            </div>

            <div className="sa-role-dist-wrap">
              <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={promotorRoleDist}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={2}
                    >
                      {promotorRoleDist.map((entry, idx) => (
                        <Cell key={`role-cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#073B3F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>

                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#071A2D', lineHeight: 1 }}>{totalPromotorUsersCount.toLocaleString()}</div>
                  <div style={{ fontSize: '9.5px', color: '#7A8987', fontWeight: 700, marginTop: '3px' }}>Total Downline</div>
                </div>
              </div>

              {/* Roles Table */}
              <div className="sa-role-table">
                {promotorRoleDist.map(r => (
                  <div key={r.name} className="sa-role-row" onClick={() => r.route && navigate(r.route)}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                    <span className="sa-role-name">{r.name}</span>
                    <span className="sa-role-count">{r.count ?? r.value ?? 0}</span>
                    <span className="sa-role-pct">{r.pct || `${((r.value / Math.max(1, totalPromotorUsersCount)) * 100).toFixed(1)}%`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: User Growth */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
                </svg>
                <span>User Growth</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {userGrowthLoading && (
                  <span style={{ fontSize: '10px', color: '#009957', fontWeight: 800 }}>● updating</span>
                )}
                <select
                  value={userGrowthPeriod}
                  onChange={e => setUserGrowthPeriod(e.target.value)}
                  style={{
                    background: '#F4F7F6', border: '1px solid #E2EAE8', color: '#0C4044',
                    borderRadius: '16px', padding: '4px 12px', fontSize: '11.5px', fontWeight: 800,
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="Month">Month</option>
                  <option value="Week">Week</option>
                  <option value="3Month">3 Month</option>
                  <option value="Year">Year</option>
                </select>
              </div>
            </div>

            {/* 3 Metric Sub-pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: '#F8FAF9', border: '1px solid #E4ECEB', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7A8987' }}>Total Users</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#071A2D' }}>
                    <AnimatedNumber value={userGrowthStats.total} prefix="" />
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAF9', border: '1px solid #E4ECEB', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EAF8F0', color: '#009957', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7A8987' }}>New Registrations</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#009957' }}>
                    <AnimatedNumber value={userGrowthStats.newUsers} prefix="+" />
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAF9', border: '1px solid #E4ECEB', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7A8987' }}>Active Users</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#071A2D' }}>
                    <AnimatedNumber value={userGrowthStats.activeUsers} prefix="" />
                  </div>
                </div>
              </div>
            </div>

            {/* Smooth Spline AreaChart */}
            <div style={{ width: '100%', height: '175px', position: 'relative', opacity: userGrowthLoading ? 0.75 : 1, transition: 'opacity 0.25s ease' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthChartData} margin={{ top: 12, right: 14, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="prUserGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#009957" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#009957" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                  <XAxis dataKey="month" stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                  <YAxis stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, dataMax => Math.max(4, Math.ceil(dataMax * 1.25))]} tickCount={5} />
                  <Tooltip content={<CustomDarkTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#009957"
                    strokeWidth={2.4}
                    fill="url(#prUserGrowthGrad)"
                    dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 6.5, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={450}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 5. Bottom Row 2: Network & User Status & Quick Actions */}
        <div className="sa-bottom-grid">
          {/* Card 3: Network & User Status - Active Users & Inactive Users */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Network & User Status</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EAF8F0', color: '#009957', border: '1px solid #C4ECD7', borderRadius: '16px', padding: '3px 10px', fontSize: '11px', fontWeight: 800 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#009957' }} />
                Live
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
              {/* Active Users */}
              <div className="sa-status-row" onClick={() => navigate('/login-active')}>
                <div className="sa-status-left">
                  <div className="sa-status-icon-wrap" style={{ background: '#EAF8F0', color: '#009957' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <div className="sa-status-name">Active Users</div>
                    <div className="sa-status-desc">Currently online</div>
                  </div>
                </div>
                <div className="sa-status-right" style={{ color: '#009957' }}>
                  <span>● {(quickStats.active_users ?? 0).toLocaleString()}</span>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              </div>

              {/* Inactive Users */}
              <div className="sa-status-row" onClick={() => navigate('/login-inactive')}>
                <div className="sa-status-left">
                  <div className="sa-status-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <div className="sa-status-name">Inactive Users</div>
                    <div className="sa-status-desc">Not active today</div>
                  </div>
                </div>
                <div className="sa-status-right" style={{ color: '#C92035' }}>
                  <span>● {(quickStats.today_inactive_count ?? 0).toLocaleString()}</span>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Retailer Quick Actions */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Retailer Quick Actions</span>
              </div>
            </div>

            <div className="sa-qa-grid">
              {[
                {
                  label: 'Customer Hierarchy',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="2" y="17" width="6" height="4" rx="1" /><rect x="16" y="17" width="6" height="4" rx="1" /><path d="M12 7v5M5 17v-3h14v3" /></svg>,
                  path: '/promotor-hierarchy-grid', bg: '#E6F4F2', color: '#0C4044',
                },
                {
                  label: 'Sales Report',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
                  path: '/sales-report', bg: '#F0FDF4', color: '#16A34A',
                },
                {
                  label: 'Available Jewellery',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3" /></svg>,
                  path: '/available-jewellery', bg: '#FFF7ED', color: '#EA580C',
                },
                {
                  label: 'Buy Coin',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
                  path: '/available-coins', bg: '#ECFDF5', color: '#059669',
                },
                {
                  label: 'Team Commission',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
                  path: '/internal-team-commission', bg: '#FEF3C7', color: '#D97706',
                },
                {
                  label: 'Add Shop',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10h16l-1 12H5L4 10z" /><path d="M8 10V6a4 4 0 018 0v4" /></svg>,
                  path: '/add-shop', bg: '#FDF2F8', color: '#DB2777',
                },
              ].map(action => (
                <div
                  key={action.label}
                  className="sa-qa-tile"
                  onClick={() => navigate(action.path)}
                >
                  <div className="sa-qa-tile-left">
                    <div className="sa-qa-icon-wrap" style={{ background: action.bg, color: action.color }}>
                      {action.icon}
                    </div>
                    <span className="sa-qa-label">{action.label}</span>
                  </div>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Footer Banner */}
        <div className="sa-footer-banner">
          <div className="sa-footer-left">
            <div className="sa-footer-motto">
              "Pure Elegance, Crafted for Eternal Moments."
            </div>
            <div className="sa-footer-underline" />
          </div>
          <div className="sa-footer-right">
            <img src={logo} alt="Logo" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFFFF', padding: '3px', objectFit: 'contain' }} />
            <div className="sa-footer-brand">
              <div className="sa-footer-brand-title">ATHIRAI JEWELLERY</div>
              <div className="sa-footer-brand-sub">BITBYTE MARKETING PVT LTD</div>
            </div>
          </div>
        </div>
      </div>      <div style={{ position:'relative', zIndex:10, padding:'clamp(18px, 4vw, 36px) clamp(14px, 4vw, 40px) 56px', maxWidth:'1200px', margin:'0 auto' }}>
        {msg && (
          <div style={{ background: msgType==='success'?'rgba(201,32,53,0.1)':'rgba(201,32,53,0.1)', border:`1px solid ${msgType==='success'?'rgba(201,32,53,0.25)':'rgba(201,32,53,0.3)'}`, color: msgType==='success'?'#C92035':'#C92035', borderRadius:'12px', padding:'14px 20px', fontSize:'14px', marginBottom:'20px' }}>
            {msg}
          </div>
        )}




{showProfileEdit && (
  <div onClick={() => setShowProfileEdit(false)} style={{ position:'fixed', inset:0, background:'rgba(17,24,23,0.88)', backdropFilter:'blur(12px)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <form onSubmit={submitProfileUpdate} onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border:'1px solid rgba(201,32,53,0.35)', borderRadius:'24px', width:'96%', maxWidth:'1050px', maxHeight:'90vh', overflow:'hidden', boxShadow:'0 32px 90px rgba(17,24,23,0.8)', display:'flex', flexDirection:'column' }}>
      
      {/* Header */}
      <div style={{ padding:'22px 28px', borderBottom:'1px solid rgba(201,32,53,0.16)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ color:'#C92035', fontWeight:900, fontSize:'15px', letterSpacing:'1px' }}>✎ PROFILE UPDATE REQUEST</div>
          <div style={{ color:subtext, fontSize:'12px', marginTop:'4px' }}>Existing details compare pannitu correct details full ah enter pannunga</div>
        </div>
        <button type="button" onClick={() => setShowProfileEdit(false)} style={{ background:'rgba(201,32,53,0.1)', border:'1px solid rgba(201,32,53,0.3)', color:'#C92035', borderRadius:'8px', padding:'7px 14px', cursor:'pointer' }}>✕ Close</button>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:'auto', padding:'24px 28px' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr style={{ background:'rgba(201,32,53,0.08)' }}>
              {['Existing Details Description', 'Existing Details', 'Details To Updated'].map(h => (
                <th key={h} style={{ padding:'14px', color:'#C92035', textAlign:'left', border:'1px solid rgba(201,32,53,0.2)', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.8px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {PROFILE_FIELDS.map(([key, label]) => (
              <tr key={key}>
                <td style={{ padding:'12px 14px', border:'1px solid rgba(253,253,252,0.08)', color:'#F3E8DE', fontWeight:700 }}>
                  {label}
                </td>
                <td style={{ padding:'12px 14px', border:'1px solid rgba(253,253,252,0.08)', color:text, wordBreak:'break-all' }}>
                  {promotorInfo?.[key] || '—'}
                </td>
                <td style={{ padding:'10px', border:'1px solid rgba(253,253,252,0.08)' }}>

                  {key === 'gender' ? (
                    <select
                      name={key}
                      value={updateForm[key] || 'male'}
                      onChange={handleUpdateChange}
                      style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                    >
                      <option value="male" style={{ background:optionBg, color:text }}>Male</option>
                      <option value="female" style={{ background:optionBg, color:text }}>Female</option>
                      <option value="other" style={{ background:optionBg, color:text }}>Other</option>
                    </select>

                  ) : key === 'married_status' ? (
                    <select
                      name={key}
                      value={updateForm[key] || 'single'}
                      onChange={handleUpdateChange}
                      style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                    >
                      <option value="single" style={{ background:optionBg, color:text }}>Single</option>
                      <option value="married" style={{ background:optionBg, color:text }}>Married</option>
                      <option value="other" style={{ background:optionBg, color:text }}>Other</option>
                    </select>

                  ) : key === 'dob' ? (
                    <input
                      type="date"
                      name={key}
                      value={updateForm[key] || ''}
                      onChange={handleUpdateChange}
                      style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                    />

                  ) : key === 'anniversary_date' ? (
                    updateForm.married_status === 'married' ? (
                      <input
                        type="date"
                        name={key}
                        value={updateForm[key] || ''}
                        onChange={handleUpdateChange}
                        style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                      />
                    ) : (
                      <span style={{ color:subtext, fontSize:'12px' }}>Only married select panna show aagum</span>
                    )

                  ) : (
                    <input
                      name={key}
                      value={updateForm[key] || ''}
                      onChange={handleUpdateChange}
                      style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                    />
                  )}

                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Message / Reason */}
        <div style={{ marginTop:'16px' }}>
          <label style={{ display:'block', color:subtext, fontSize:'12px', marginBottom:'8px', fontWeight:700 }}>
            Message / Reason *
          </label>
          <textarea
            value={updateMessage}
            onChange={e => setUpdateMessage(e.target.value)}
            placeholder="Example: My mobile number is wrong, please update it..."
            rows={3}
            style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'10px', padding:'12px 14px', color:text, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:'1.6' }}
            onFocus={e => e.target.style.borderColor = '#C92035'}
            onBlur={e => e.target.style.borderColor = inpBorder}
          />
        </div>

        {/* Proof Document */}
        <div style={{ marginTop:'16px' }}>
          <label style={{ display:'block', color:subtext, fontSize:'12px', marginBottom:'8px', fontWeight:700 }}>
            Upload Proof Document *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setProofDocument(e.target.files[0])}
            style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'10px', padding:'10px 12px', color:text, boxSizing:'border-box' }}
          />
          {proofDocument && (
            <div style={{ color:'#0C4044', fontSize:'12px', marginTop:'8px' }}>
              ✅ Selected: {proofDocument.name}
            </div>
          )}
          <div style={{ color:subtext, fontSize:'12px', marginTop:'8px' }}>
            PAN / Aadhaar / supporting document upload pannunga. Max size: 2 MB.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'18px 28px', borderTop:'1px solid rgba(201,32,53,0.14)', display:'flex', justifyContent:'flex-end', gap:'12px' }}>
        <button
          type="button"
          onClick={() => setShowProfileEdit(false)}
          style={{ padding:'12px 22px', background:inpBg, border:`1px solid ${border}`, borderRadius:'12px', color:subtext, cursor:'pointer' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ padding:'12px 30px', background:'#073B3F', border:'none', borderRadius:'12px', color:'#3b0024', fontWeight:900, cursor:'pointer' }}
        >
          Submit Request
        </button>
      </div>

    </form>
  </div>
)}


{showProfile && (
  <div
    onClick={() => setShowProfile(false)}
    style={{ position:'fixed', inset:0, background:'rgba(17,24,23,0.82)', backdropFilter:'blur(10px)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border:'1px solid rgba(201,32,53,0.3)', borderRadius:'24px', width:'95%', maxWidth:'580px', maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 80px rgba(17,24,23,0.7)' }}
    >
      {/* Header */}
      <div style={{ flexShrink:0, padding:'24px 28px', borderBottom:'1px solid rgba(201,32,53,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg,rgba(201,32,53,0.25),rgba(204,168,129,0.15))', border:'2px solid rgba(201,32,53,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', boxShadow:'0 4px 16px rgba(201,32,53,0.2)' }}>🌟</div>
          <div>
            <div style={{ color:'#C92035', fontWeight:800, fontSize:'15px', letterSpacing:'0.05em' }}>MY PROFILE</div>
            <div style={{ color:subtext, fontSize:'11px', marginTop:'3px', fontFamily:'monospace' }}>{promotorInfo?.promotor_id || '—'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <button
            onClick={() => { setShowProfile(false); openProfileEdit() }}
            style={{ background:'rgba(201,32,53,0.12)', border:'1px solid rgba(201,32,53,0.35)', color:'#C92035', borderRadius:'8px', padding:'6px 14px', cursor:'pointer', fontSize:'12px', fontWeight:800 }}
          >✎ Edit</button>
          <button
            onClick={() => setShowProfile(false)}
            style={{ background:'rgba(201,32,53,0.1)', border:'1px solid rgba(201,32,53,0.3)', color:'#C92035', borderRadius:'8px', padding:'6px 14px', cursor:'pointer', fontSize:'12px' }}
          >✕ Close</button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:'20px', scrollbarWidth:'thin', scrollbarColor:'rgba(201,32,53,0.4) transparent' }}>
        {!promotorInfo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
            <SkeletonBox height="140px" borderRadius="16px" />
            <SkeletonBox height="180px" borderRadius="16px" />
          </div>
        ) : (
          <>
            {/* Account Info */}
            <div style={{ background: dark ? 'rgba(201,32,53,0.04)' : 'rgba(201,32,53,0.03)', border:'1px solid rgba(201,32,53,0.18)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#C92035', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#C92035', display:'inline-block' }} />
                ACCOUNT INFO
              </div>
              <div className="profile-grid-2">
                {[
                  { label:'Retailer ID', value:promotorInfo.promotor_id, mono:true, color:'#C92035' },
                  { label:'Initial',     value:promotorInfo.initial },
                  { label:'First Name',  value:promotorInfo.first_name },
                  { label:'Last Name',   value:promotorInfo.last_name },
                  { label:'Email',       value:promotorInfo.email },
                  { label:'Mobile',      value:promotorInfo.mobile_number },
                  { label:'Gender',      value:promotorInfo.gender },
                  { label:'DOB',         value:promotorInfo.dob },
                  { label:'Married',     value:promotorInfo.married_status },
                  { label:'Anniversary', value:promotorInfo.anniversary_date },
                ].map(f => f.value ? (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:f.color || text, fontSize:'13px', fontWeight:f.mono?700:500, fontFamily:f.mono?'monospace':'inherit', wordBreak:'break-all' }}>{f.value}</div>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Address */}
            <div style={{ background: dark ? 'rgba(189,207,206,0.04)' : 'rgba(189,207,206,0.03)', border:'1px solid rgba(189,207,206,0.18)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#BDCFCE', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#BDCFCE', display:'inline-block' }} />
                ADDRESS
              </div>
              <div className="profile-grid-2">
                {[
                  { label:'Door No',  value:promotorInfo.door_no },
                  { label:'Street',   value:promotorInfo.street_name },
                  { label:'Town',     value:promotorInfo.town_name },
                  { label:'City',     value:promotorInfo.city_name },
                  { label:'District', value:promotorInfo.district },
                  { label:'State',    value:promotorInfo.state },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:text, fontSize:'13px' }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Identity */}
            <div style={{ background: dark ? 'rgba(204,168,129,0.04)' : 'rgba(204,168,129,0.03)', border:'1px solid rgba(204,168,129,0.18)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#CCA881', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#CCA881', display:'inline-block' }} />
                IDENTITY
              </div>
              <div className="profile-grid-2">
                {[
                  { label:'Aadhaar No', value:promotorInfo.aadhaar_no, mask:true },
                  { label:'PAN No',     value:promotorInfo.pan_no, mono:true },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:text, fontSize:'13px', fontFamily:'monospace' }}>
                      {f.mask && f.value ? `XXXX-XXXX-${f.value.slice(-4)}` : (f.value || '—')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Occupation */}
            <div style={{ background: dark ? 'rgba(187,137,88,0.04)' : 'rgba(187,137,88,0.03)', border:'1px solid rgba(187,137,88,0.18)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#BB8958', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#BB8958', display:'inline-block' }} />
                OCCUPATION
              </div>
              <div className="profile-grid-3">
                {[
                  { label:'Type',          value:promotorInfo.occupation },
                  { label:'Detail',        value:promotorInfo.occupation_detail },
                  { label:'Annual Salary', value:promotorInfo.annual_salary ? `₹ ${Number(promotorInfo.annual_salary).toLocaleString('en-IN')}` : '—' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:text, fontSize:'13px' }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wholesale Dealer Info */}
            <div style={{ background: dark ? 'rgba(201,32,53,0.06)' : 'rgba(201,32,53,0.04)', border:'1.5px solid rgba(201,32,53,0.35)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#C92035', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#C92035', display:'inline-block', boxShadow:'0 0 6px #C92035' }} />
                WHOLESALE DEALER INFO
              </div>
              <div className="profile-grid-2">
                {[
                  { label:'Wholesale Dealer ID',      value:promotorInfo.sub_dealer_id,      mono:true, color:'#C92035' },
                  { label:'Wholesale Dealer Name',     value:promotorInfo.sub_dealer_name },
                  { label:'Contact No',          value:promotorInfo.sub_dealer_contact_no },
                  { label:'Member Since',        value:promotorInfo.created_at ? new Date(promotorInfo.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '—' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:f.color||text, fontSize:'13px', fontFamily:f.mono?'monospace':'inherit', fontWeight:f.mono?700:500 }}>{f.value || '—'}</div>
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


{/* ── BUY COIN POPUP (multi-weight, becomes a request) ── */}
  {showBuyCoin && (
    <div onClick={() => setShowBuyCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.88)', backdropFilter: 'blur(12px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(204,168,129,0.4)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto', padding: '28px', boxShadow: '0 32px 90px rgba(17,24,23,0.8)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ color: '#CCA881', fontWeight: 900, fontSize: '16px' }}>🪙 Buy Coin — Request</div>
            <div style={{ color: subtext, fontSize: '11px', marginTop: '3px' }}>Athana coin type um weight um add pannunga, appuram Sub Dealer-ku request anuppunga</div>
          </div>
          <button onClick={() => setShowBuyCoin(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
        </div>

        {/* Metal select */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['gold_22k', 'gold_24k', 'silver_999'].map(m => (
            <div key={m} onClick={() => { setSelCoinMetal(m); setSelCoinWeight('') }}
              style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                background: selCoinMetal === m ? 'rgba(204,168,129,0.2)' : inpBg,
                border: `1.5px solid ${selCoinMetal === m ? 'rgba(204,168,129,0.7)' : inpBorder}`,
                color: selCoinMetal === m ? '#CCA881' : subtext }}>
              {COIN_METAL_LABELS[m]}
            </div>
          ))}
        </div>

        {/* Weight + Qty + Add button */}
        <div className="coin-buy-grid">
          <div>
            <label style={{ color: subtext, fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>WEIGHT</label>
            <select value={selCoinWeight} onChange={e => setSelCoinWeight(e.target.value)}
              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '11px 12px', color: text, fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              <option value="" style={{ background: optionBg }}>-- Select --</option>
              {(selCoinMetal === 'silver_999' ? COIN_WEIGHTS_SILVER : COIN_WEIGHTS_GOLD).map(w => (
                <option key={w.label} value={w.label} style={{ background: optionBg }}>{w.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ color: subtext, fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>QTY</label>
            <input type="number" min="1" value={selCoinQty} onChange={e => setSelCoinQty(e.target.value)}
              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '11px 12px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={addToCoinCart}
              style={{ padding: '11px 18px', background: '#073B3F', border: 'none', borderRadius: '10px', color: '#FDFDFC', fontWeight: 800, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Add
            </button>
          </div>
        </div>

        {/* Cart list */}
        {coinCart.length > 0 && (
          <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {coinCart.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px' }}>
                <span style={{ color: text, fontSize: '13px', fontWeight: 600 }}>{COIN_METAL_LABELS[item.metal_type]} — {item.weight_label} × {item.qty}</span>
                <button onClick={() => removeCoinCartItem(idx)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {coinBuyMsg && (
          <div style={{ background: coinBuyMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${coinBuyMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: coinBuyMsg.includes('✅') ? '#0C4044' : '#C92035', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
            {coinBuyMsg}
          </div>
        )}

        <button
          disabled={coinBuySubmitting || coinCart.length === 0}
          onClick={submitCoinRequest}
          style={{ width: '100%', padding: '14px', background: coinBuySubmitting || coinCart.length === 0 ? 'rgba(201,32,53,0.2)' : 'linear-gradient(90deg,#C92035,#CCA881)', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', color: '#FDFDFC', cursor: coinBuySubmitting || coinCart.length === 0 ? 'not-allowed' : 'pointer' }}>
          {coinBuySubmitting ? '⏳ Sending Request...' : '✅ Confirm & Send Request'}
        </button>
      </div>
    </div>
  )}

  {/* ── STORED COIN POPUP ── */}
  {showStoredCoin && (
    <div onClick={() => setShowStoredCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}>
        <div style={{ flexShrink: 0, padding: '22px 26px', borderBottom: '1px solid rgba(12,64,68,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '15px' }}>📦 Stored Coins</div>
            <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>Sub Dealer send pannina coin stock</div>
          </div>
          <button onClick={() => setShowStoredCoin(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {coinStockLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[0, 1, 2].map(i => <SkeletonBox key={i} height="52px" borderRadius="12px" />)}
            </div>
          ) : coinStock.length === 0 ? (
            <div style={{ textAlign: 'center', color: subtext, padding: '40px 0' }}>Stock illa — Buy Coin request pannunga</div>
          ) : coinStock.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(12,64,68,0.06)', border: '1px solid rgba(12,64,68,0.25)', borderRadius: '12px' }}>
              <div>
                <div style={{ color: '#0C4044', fontWeight: 700, fontSize: '13px' }}>{COIN_METAL_LABELS[s.metal_type]}</div>
                <div style={{ color: subtext, fontSize: '12px', marginTop: '2px' }}>{s.weight_label}</div>
              </div>
              <div style={{ color: text, fontWeight: 900, fontSize: '20px', fontFamily: 'monospace' }}>{s.qty}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

{/* ── MY COIN REQUESTS (STATUS TRACKING) POPUP ── */}
  {showMyRequests && (
    <div onClick={() => setShowMyRequests(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}>

        <div style={{ flexShrink: 0, padding: '22px 26px', borderBottom: '1px solid rgba(12,64,68,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(12,64,68,0.15)', border: '1px solid rgba(12,64,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6M9 16h6M9 8h6"/>
                <rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
            </div>
            <div>
              <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '15px' }}>My Coin Requests</div>
              <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>Status of coin requests you sent to your Sub Dealer</div>
            </div>
          </div>
          <button onClick={() => setShowMyRequests(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {myRequestsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[0, 1, 2].map(i => <SkeletonBox key={i} height="76px" borderRadius="14px" />)}
            </div>
          ) : myCoinRequests.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: subtext, padding: '40px 0' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6M9 16h6M9 8h6"/><rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
              No coin requests yet
            </div>
          ) : myCoinRequests.map(req => {
            const statusCfg = {
              pending:  { color: '#CCA881', bg: 'rgba(204,168,129,0.08)', border: 'rgba(204,168,129,0.3)', label: 'Pending', icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></> },
              sent:     { color: '#0C4044', bg: 'rgba(12,64,68,0.08)', border: 'rgba(12,64,68,0.3)', label: 'Approved', icon: <><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></> },
              rejected: { color: '#C92035', bg: 'rgba(201,32,53,0.08)', border: 'rgba(201,32,53,0.3)', label: 'Rejected', icon: <><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
            }
            const cfg = statusCfg[req.status] || statusCfg.pending
            return (
              <div key={req.id} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '14px', padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ color: subtext, fontSize: '11px' }}>
                    {new Date(req.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: `${cfg.color}22`, border: `1px solid ${cfg.color}55` }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {cfg.icon}
                    </svg>
                    <span style={{ color: cfg.color, fontSize: '11px', fontWeight: 800 }}>{cfg.label}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {req.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: inpBg, borderRadius: '8px', fontSize: '12px' }}>
                      <span style={{ color: text }}>{COIN_METAL_LABELS[item.metal_type]} — {item.weight_label}</span>
                      <span style={{ color: cfg.color, fontWeight: 700 }}>× {item.qty}</span>
                    </div>
                  ))}
                </div>

                {req.status === 'rejected' && req.reject_reason && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.25)', borderRadius: '8px' }}>
                    <div style={{ color: '#C92035', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>REASON FOR REJECTION</div>
                    <div style={{ color: text, fontSize: '12px', lineHeight: 1.5 }}>{req.reject_reason}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )}

  {/* ── HIERARCHY MODAL ── */}


      </div>
    </div>
  )
}





