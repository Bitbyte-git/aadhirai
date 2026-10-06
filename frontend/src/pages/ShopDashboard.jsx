import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../api'
import ShopNavbar from '../collection/ShopNavbar'
import CopyShopUrlButton from '../collection/CopyShopUrlButton'
import { IrdDonutPanel, irdPalette } from './AdminDashboard'
import { SkeletonChart } from '../components/Skeleton'
import '../components/skeleton.css'

// ── SESSION STORAGE CACHE HELPERS (Instant 0ms Page Load) ──
const loadCache = (key, fallback) => {
  try {
    const val = sessionStorage.getItem(key)
    return val !== null ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}
const saveCache = (key, val) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(val))
  } catch {}
}

const CHART_PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7D' },
  { key: 'month', label: '1M' },
  { key: '3month', label: '3M' },
  { key: 'year', label: '1Y' },
  { key: 'all', label: 'All' },
]

function normalizeTimeseries(rows, period) {
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

// ── CUSTOM ANIMATED & SCROLLABLE SHOP ORDER TREND PANEL ──
function ShopOrderTrendPanel({ title = 'Shop Order Volume Trend', endpoint = '/order-timeseries/' }) {
  const [period, setPeriod] = useState(() => loadCache('shd_chart_period', 'today'))
  const [data, setData] = useState(() => loadCache(`shd_chart_data_${loadCache('shd_chart_period', 'today')}`, []))
  const [loading, setLoading] = useState(() => !loadCache(`shd_chart_data_${loadCache('shd_chart_period', 'today')}`, null))
  const [lastUpdated, setLastUpdated] = useState(() => new Date())

  const fetchData = async (targetPeriod) => {
    // If cached in sessionStorage, show immediately without loader flicker
    const cached = loadCache(`shd_chart_data_${targetPeriod}`, null)
    if (cached && cached.length > 0) {
      setData(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    try {
      const res = await api.get(endpoint, { params: { period: targetPeriod } })
      const normalized = normalizeTimeseries(res.data?.data || [], targetPeriod)
      setData(normalized)
      saveCache(`shd_chart_data_${targetPeriod}`, normalized)
      setLastUpdated(new Date())
    } catch {
      if (!cached) setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(period)
  }, [period])

  const handlePeriodChange = (next) => {
    setPeriod(next)
    saveCache('shd_chart_period', next)
  }

  const totalOrders = useMemo(() => data.reduce((sum, r) => sum + Number(r.count || 0), 0), [data])

  return (
    <div className="sa-saas-card" style={{ marginBottom: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0,153,87,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#009957', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#0C4044', fontSize: '16px', fontWeight: 800 }}>{title}</div>
            <div style={{ color: '#7A8987', fontSize: '12px', marginTop: '2px' }}>
              Total orders overview • <b style={{ color: '#009957' }}>{totalOrders.toLocaleString()} orders</b> {lastUpdated ? `(Synced ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})` : ''}
            </div>
          </div>
        </div>

        {/* Filter Pills with animated transition */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '12px', background: '#E6F4EA', color: '#137333', fontSize: '11px', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#137333', animation: 'shdPulse 1.4s infinite' }} /> Live
            </span>
          )}
          <div style={{ display: 'flex', background: '#F4F7F6', borderRadius: '20px', padding: '3px', gap: '2px', border: '1px solid #E2EAE8' }}>
            {CHART_PERIODS.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePeriodChange(p.key)}
                style={{
                  background: period === p.key ? '#073B3F' : 'transparent',
                  color: period === p.key ? '#FFFFFF' : '#5A6A68',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '5px 11px',
                  fontSize: '11px',
                  fontWeight: period === p.key ? 750 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: period === p.key ? '0 2px 8px rgba(7,59,63,0.18)' : 'none',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas: Animated Emerald Spline with Horizontal Touch Scroll */}
      <div className="shd-chart-scroll-box" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
        <div style={{ width: '100%', minWidth: data.length > 8 ? '540px' : '100%', height: '240px', position: 'relative' }}>
          {loading && data.length === 0 ? (
            <SkeletonChart height="100%" />
          ) : data.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7A8987', fontSize: '13px', gap: '6px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BDCFCE" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span>No order transactions recorded for this period</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 12, right: 12, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="shopOrderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#009957" stopOpacity={0.28} />
                    <stop offset="60%" stopColor="#009957" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#009957" stopOpacity={0.00} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                <XAxis dataKey="label" stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                <YAxis stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0].payload
                    return (
                      <div style={{ background: '#073B3F', color: '#FFFFFF', borderRadius: 10, padding: '9px 13px', fontSize: 11.5, boxShadow: '0 10px 28px rgba(7,59,63,0.3)', border: '1px solid rgba(204,168,129,0.3)' }}>
                        <div style={{ color: '#CCA881', fontWeight: 800, marginBottom: 3 }}>{row.label || row.fullDate}</div>
                        <div style={{ fontWeight: 800, fontSize: 13.5 }}>{Number(row.count || 0).toLocaleString()} orders</div>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#009957"
                  strokeWidth={2.6}
                  fill="url(#shopOrderGrad)"
                  isAnimationActive={true}
                  animationDuration={1100}
                  animationEasing="ease-in-out"
                  dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 6.5, fill: '#073B3F', stroke: '#009957', strokeWidth: 2.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon, label }) {
  const paths = {
    shop: <><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M3 10 5 3h14l2 7" /><path d="M9 21v-6h6v6" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', background: 'linear-gradient(90deg, rgba(12,64,68,0.08), rgba(12,64,68,0.02))' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: 'linear-gradient(135deg,#0C4044,#073B3F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FDFDFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {paths[icon] || paths.shop}
        </svg>
      </div>
      <span style={{ color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  )
}

const PROFILE_FIELDS = [
  ['shop_name', 'Shop Name'], ['owner_name', 'Owner Name'],
  ['mobile_number', 'Mobile Number'], ['whatsapp_number', 'WhatsApp Number'],
  ['shop_address', 'Shop Address'], ['pincode', 'Pincode'],
  ['street_name', 'Street Name'], ['city', 'City'], ['district', 'District'], ['state', 'State'],
  ['pan_no', 'PAN'], ['gst_no', 'GST'], ['msme_no', 'MSME'],
]

export default function ShopDashboard() {
  const navigate = useNavigate()

  // ── INSTANT CACHED STATE (0ms Initial Render) ──
  const [shop, setShop] = useState(() => loadCache('shd_profile', null))
  const [showProfile, setShowProfile] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [stats, setStats] = useState(() => loadCache('shd_stats', { yesterday_orders: 0, today_orders: 0, today_new_shops: 0, active_users: 0, total_sub_shops: 0 }))
  const [statsLoading, setStatsLoading] = useState(() => !loadCache('shd_stats', null))

  const [typeCounts, setTypeCounts] = useState(() => loadCache('shd_types', { physical: 0, virtual: 0 }))
  const [typeLoading, setTypeLoading] = useState(() => !loadCache('shd_types', null))

  const [login, setLogin] = useState(() => loadCache('shd_login', { active: 0, inactive: 0 }))
  const [loginLoading, setLoginLoading] = useState(() => !loadCache('shd_login', null))

  // Live Gold Rate & Live Clock
  const [goldRate, setGoldRate] = useState(() => loadCache('shd_gold_rate', null))
  const [liveTime, setLiveTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    api.get('/metal-rates/')
      .then(res => {
        const d = Array.isArray(res.data) ? res.data[0] : res.data
        if (d?.gold_22k) {
          const rateVal = parseFloat(d.gold_22k)
          setGoldRate(rateVal)
          saveCache('shd_gold_rate', rateVal)
        }
      })
      .catch(() => {})
  }, [])

  const fetchShopInfo = async () => {
    try {
      const res = await api.get('/my-shop-profile/')
      setShop(res.data)
      saveCache('shd_profile', res.data)
    } catch (err) {
      console.error('Shop profile fetch error:', err)
    }
  }

  useEffect(() => {
    let current = true
    fetchShopInfo()

    api.get('/dashboard-quick-stats/')
      .then(res => {
        if (current) {
          setStats(prev => {
            const next = { ...prev, ...res.data }
            saveCache('shd_stats', next)
            return next
          })
        }
      })
      .catch(() => {})
      .finally(() => { if (current) setStatsLoading(false) })

    api.get('/shop-dashboard-stats/')
      .then(res => {
        if (current) {
          const types = { physical: res.data.physical_count || 0, virtual: res.data.virtual_count || 0 }
          setTypeCounts(types)
          saveCache('shd_types', types)
        }
      })
      .catch(() => {})
      .finally(() => { if (current) setTypeLoading(false) })

    api.get('/shop-list/', { params: { limit: 1 } })
      .then(res => {
        if (current) {
          const lg = { active: res.data.today_active_count || 0, inactive: res.data.today_inactive_count || 0 }
          setLogin(lg)
          saveCache('shd_login', lg)
        }
      })
      .catch(() => {})
      .finally(() => { if (current) setLoginLoading(false) })

    return () => { current = false }
  }, [])

  const openProfile = () => { setShowProfile(true); fetchShopInfo() }

  const openEdit = () => {
    const next = {}
    PROFILE_FIELDS.forEach(([key]) => { next[key] = shop?.[key] || '' })
    next.shop_type = shop?.shop_type || 'live'
    setEditForm(next)
    setSaveMsg('')
    setShowEdit(true)
  }

  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value })

  const submitEdit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch('/my-shop-profile/', editForm)
      setShop(res.data)
      saveCache('shd_profile', res.data)
      setSaveMsg('Profile updated successfully!')
      setTimeout(() => setShowEdit(false), 1200)
    } catch (err) {
      setSaveMsg('Error: ' + JSON.stringify(err.response?.data))
    }
    setSaving(false)
  }

  const typeData = useMemo(() => [
    { name: 'Physical', value: typeCounts.physical, color: irdPalette.teal },
    { name: 'Virtual', value: typeCounts.virtual, color: irdPalette.gold },
  ].filter(d => d.value > 0), [typeCounts])

  const loginData = useMemo(() => [
    { name: 'Active', value: login.active, color: irdPalette.teal },
    { name: 'Inactive', value: login.inactive, color: irdPalette.red },
  ], [login])

  const goShopList = status => navigate('/superadmin/manage-users/shops', { state: status ? { todayStatus: status } : undefined })

  const text = '#111817'
  const subtext = '#7A8987'
  const inp = { width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
  const lbl = { display: 'block', color: subtext, fontSize: '11px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.09em' }
  const sectionCard = { background: '#FDFDFC', border: '1px solid rgba(189,207,206,0.55)', borderRadius: '16px', padding: '22px 24px', marginBottom: '4px' }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: text, fontFamily: '"Inter",system-ui,sans-serif', position: 'relative' }}>
      <ShopNavbar onProfile={openProfile} />

      <style>{`
        @keyframes shdPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.3); } }

        /* ── Full SaaS Dashboard Container ── */
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

        /* ── Welcome Banner ── */
        .sa-welcome-card {
          background: #FFFFFF;
          border: 1px solid #E2EAE8;
          border-radius: 18px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.03);
          flex-wrap: wrap;
        }
        .sa-welcome-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }
        .sa-welcome-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #0C4044 0%, #073B3F 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #CCA881;
          box-shadow: 0 6px 16px rgba(7, 59, 63, 0.15);
          flex-shrink: 0;
        }
        .sa-welcome-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .sa-welcome-title {
          font-size: 20px;
          font-weight: 850;
          color: #0C4044;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sa-welcome-sub {
          font-size: 13px;
          color: #7A8987;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sa-welcome-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sa-welcome-gold-display {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(204,168,129,0.18), rgba(187,137,88,0.1));
          border: 1px solid rgba(204,168,129,0.4);
          padding: 8px 14px;
          border-radius: 12px;
          color: #8C5E28;
          font-size: 12.5px;
          font-weight: 750;
        }
        .sa-btn-profile-top {
          background: #0C4044;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(12, 64, 68, 0.2);
        }
        .sa-btn-profile-top:hover {
          background: #073B3F;
          transform: translateY(-1px);
        }

        /* ── 4 KPI Cards (Compact 2x2 on Mobile) ── */
        .sa-kpi-grid-v2 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
        }
        .sa-kpi-card-v2 {
          background: #FFFFFF;
          border: 1px solid #E2EAE8;
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          box-shadow: 0 3px 12px rgba(7, 59, 63, 0.025);
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .sa-kpi-card-v2:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.06);
          border-color: #BDCFCE;
        }
        .sa-kpi-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-kpi-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }
        .sa-kpi-title {
          font-size: 11px;
          font-weight: 800;
          color: #7A8987;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .sa-kpi-num {
          font-size: 28px;
          font-weight: 850;
          color: #071A2D;
          line-height: 1.1;
        }
        .sa-kpi-trend {
          font-size: 11.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ── BALANCED 2-COLUMN MIDDLE GRID (ZERO BLANK SPACE) ── */
        .sa-middle-grid {
          display: grid;
          grid-template-columns: 1.42fr 1fr;
          gap: 18px;
          width: 100%;
          align-items: start;
        }
        .sa-middle-left-col {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
          min-width: 0;
        }
        .sa-middle-right-col {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
          min-width: 0;
        }

        /* ── Luxury Card Shell ── */
        .sa-saas-card {
          background: #FFFFFF;
          border: 1px solid #E2EAE8;
          border-radius: 16px;
          padding: 20px 22px;
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
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sa-saas-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15.5px;
          font-weight: 800;
          color: #073B3F;
        }
        .sa-qa-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          width: 100%;
        }
        .sa-qa-tile {
          background: #FDFDFC;
          border: 1px solid #E2EAE8;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.18s ease;
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
          gap: 10px;
          min-width: 0;
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
          font-size: 12.5px;
          font-weight: 750;
          color: #0C4044;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Full-Width Shop Details Card ── */
        .sa-shop-details-card {
          width: 100%;
        }
        .sa-details-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
        }

        /* ── Footer Banner ── */
        .sa-footer-banner {
          background: linear-gradient(135deg, #073B3F 0%, #032326 100%);
          border-radius: 18px;
          padding: 26px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #FFFFFF;
          margin-top: 8px;
          box-shadow: 0 10px 30px rgba(7, 59, 63, 0.1);
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
          font-size: 24px;
          font-style: italic;
          font-weight: 600;
          color: #F8FAF9;
          letter-spacing: 0.02em;
        }
        .sa-footer-underline {
          width: 50px;
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
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: #FDFDFC;
        }
        .sa-footer-brand-sub {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.2em;
          color: #CCA881;
          margin-top: 2px;
        }

        /* ── RESPONSIVE BREAKPOINTS (Mobile 95%, 2x2 Grid, Clean Stack) ── */
        @media (max-width: 1200px) {
          .sa-details-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 960px) {
          .sa-middle-grid { grid-template-columns: 1fr; }
          .sa-qa-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 680px) {
          .sa-dashboard-container { padding: 12px 10px 32px; gap: 14px; }
          .sa-welcome-card { flex-direction: column; align-items: flex-start; gap: 14px; padding: 16px 14px; }
          .sa-welcome-left { gap: 12px; }
          .sa-welcome-icon-box { width: 42px; height: 42px; }
          .sa-welcome-title { font-size: 17px; }
          .sa-welcome-sub { font-size: 12px; }
          .sa-welcome-right { width: 100%; display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
          .sa-welcome-gold-display { width: 100%; justify-content: space-between; box-sizing: border-box; }
          .sa-btn-profile-top { width: 100%; justify-content: center; }

          /* Mobile 2x2 Compact KPI Grid */
          .sa-kpi-grid-v2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
          .sa-kpi-card-v2 { padding: 12px 10px !important; gap: 10px !important; border-radius: 12px !important; }
          .sa-kpi-icon-wrap { width: 36px !important; height: 36px !important; border-radius: 9px !important; }
          .sa-kpi-icon-wrap svg { width: 18px !important; height: 18px !important; }
          .sa-kpi-title { font-size: 9.5px !important; }
          .sa-kpi-num { font-size: 20px !important; }
          .sa-kpi-trend { font-size: 10px !important; }

          .sa-qa-grid { grid-template-columns: 1fr; }
          .sa-details-grid { grid-template-columns: 1fr; }
          .sa-footer-banner { flex-direction: column; align-items: flex-start; gap: 14px; padding: 20px 18px; }
          .sa-footer-brand { text-align: left; }
        }

        @media (max-width: 420px) {
          .sa-kpi-grid-v2 { gap: 8px !important; }
          .sa-kpi-card-v2 { padding: 10px 8px !important; }
          .sa-kpi-num { font-size: 17px !important; }
        }
      `}</style>

      <div className="sa-dashboard-container">
        {/* 1. Welcome Card Banner */}
        <div className="sa-welcome-card">
          <div className="sa-welcome-left">
            <div className="sa-welcome-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="10" width="18" height="11" rx="2" />
                <path d="M3 10 5 3h14l2 7" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </div>
            <div className="sa-welcome-text-wrap">
              <div className="sa-welcome-title">
                <span>{shop?.shop_name || 'My Athirai Shop'}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '8px', background: shop?.shop_type === 'virtual' ? 'rgba(204,168,129,0.18)' : 'rgba(0,153,87,0.12)', color: shop?.shop_type === 'virtual' ? '#A2764C' : '#009957', border: `1px solid ${shop?.shop_type === 'virtual' ? 'rgba(204,168,129,0.4)' : 'rgba(0,153,87,0.3)'}` }}>
                  {shop?.shop_type === 'virtual' ? '✦ VIRTUAL' : '● PHYSICAL'}
                </span>
              </div>
              <div className="sa-welcome-sub">
                <span>Shop ID: <strong style={{ color: '#0C4044', fontFamily: 'monospace' }}>{shop?.shop_id || '—'}</strong></span>
                <span>•</span>
                <span>Owner: <strong style={{ color: '#0C4044' }}>{shop?.owner_name || 'Store Manager'}</strong></span>
              </div>
            </div>
          </div>

          <div className="sa-welcome-right">
            {/* Live Gold Rate Display */}
            <div className="sa-welcome-gold-display">
              <span style={{ fontSize: '15px' }}>🪙</span>
              <span>22K Gold: <strong>{goldRate ? `₹${goldRate.toLocaleString('en-IN')}/g` : 'Fetching...'}</strong></span>
              <span style={{ color: '#BDCFCE', fontSize: '11px' }}>({liveTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})</span>
            </div>

            {/* Copy Shop URL Button */}
            <CopyShopUrlButton
              label="Copy Shop URL"
              style={{
                borderRadius: '12px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 800,
                background: '#FFFFFF',
                border: '1.5px solid rgba(12,64,68,0.3)',
                color: '#073B3F',
                cursor: 'pointer',
              }}
            />

            {/* Profile Button */}
            <button className="sa-btn-profile-top" type="button" onClick={openProfile}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Shop Profile</span>
            </button>
          </div>
        </div>

        {/* 2. 4 Modern KPI Cards (2x2 on Mobile) */}
        <div className="sa-kpi-grid-v2">
          {/* Card 1: Yesterday Order */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#F3E8FF', color: '#9333EA' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">YESTERDAY ORDER</div>
              <div className="sa-kpi-num">{stats.yesterday_orders ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>Compared to today</span>
              </div>
            </div>
          </div>

          {/* Card 2: Today Order */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#E6F7F0', color: '#009957' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">TODAY ORDER</div>
              <div className="sa-kpi-num">{stats.today_orders ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#009957' }}>
                <span>Orders placed today</span>
              </div>
            </div>
          </div>

          {/* Card 3: Today New Shop */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#EAF8F0', color: '#009957' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="10" width="18" height="11" rx="2" />
                <path d="M3 10 5 3h14l2 7" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">TODAY NEW SUB-SHOP</div>
              <div className="sa-kpi-num">{stats.today_new_shops ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#009957' }}>
                <span>Joined network today</span>
              </div>
            </div>
          </div>

          {/* Card 4: Active Shop */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">ACTIVE SHOP</div>
              <div className="sa-kpi-num">{stats.active_users || 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#2563EB' }}>
                <span>of {stats.total_sub_shops || 0} logged in today</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BALANCED MIDDLE GRID: Trend Spline + Quick Actions on Left, Donut Panels on Right (ZERO BLANK SPACE) */}
        <div className="sa-middle-grid">
          {/* Left Column: Animated Chart + Quick Shortcuts Stack */}
          <div className="sa-middle-left-col">
            {/* Animated & Horizontally Scrollable Order Trend Spline */}
            <ShopOrderTrendPanel title="Shop Order Volume Trend" endpoint="/order-timeseries/" />

            {/* Quick Access & Management Shortcuts (Fills the previous blank space seamlessly!) */}
            <div className="sa-saas-card">
              <div className="sa-saas-card-head">
                <div className="sa-saas-card-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009957" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>Quick Access & Management</span>
                </div>
                <span style={{ fontSize: '12px', color: '#7A8987', fontWeight: 700 }}>Direct Shortcuts</span>
              </div>

              <div className="sa-qa-grid">
                <div className="sa-qa-tile" onClick={() => navigate('/shop-hierarchy-grid')}>
                  <div className="sa-qa-tile-left">
                    <div className="sa-qa-icon-wrap" style={{ background: '#F3E8FF', color: '#9333EA' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </div>
                    <span className="sa-qa-label">Hierarchy Grid</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8987" strokeWidth="2.4"><path d="m9 18 6-6-6-6"/></svg>
                </div>

                <div className="sa-qa-tile" onClick={() => navigate('/shop-hierarchy-tree')}>
                  <div className="sa-qa-tile-left">
                    <div className="sa-qa-icon-wrap" style={{ background: '#E6F7F0', color: '#009957' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="5" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M12 8v5M6 15v-2h12v2"/></svg>
                    </div>
                    <span className="sa-qa-label">Hierarchy Tree</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8987" strokeWidth="2.4"><path d="m9 18 6-6-6-6"/></svg>
                </div>

                <div className="sa-qa-tile" onClick={() => navigate('/shop-report')}>
                  <div className="sa-qa-tile-left">
                    <div className="sa-qa-icon-wrap" style={{ background: '#EAF8F0', color: '#009957' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 19V5"/><path d="M8 19v-8"/><path d="M12 19V8"/><path d="M16 19v-5"/><path d="M20 19V4"/></svg>
                    </div>
                    <span className="sa-qa-label">Sales Report</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8987" strokeWidth="2.4"><path d="m9 18 6-6-6-6"/></svg>
                </div>

                <div className="sa-qa-tile" onClick={() => navigate('/add-shop')}>
                  <div className="sa-qa-tile-left">
                    <div className="sa-qa-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                    <span className="sa-qa-label">Create Shop</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8987" strokeWidth="2.4"><path d="m9 18 6-6-6-6"/></svg>
                </div>

                <div className="sa-qa-tile" onClick={() => navigate('/superadmin/manage-users/shops')}>
                  <div className="sa-qa-tile-left">
                    <div className="sa-qa-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="10" width="18" height="11" rx="2"/><path d="M3 10 5 3h14l2 7"/><path d="M9 21v-6h6v6"/></svg>
                    </div>
                    <span className="sa-qa-label">Shop Directory</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8987" strokeWidth="2.4"><path d="m9 18 6-6-6-6"/></svg>
                </div>

                <div className="sa-qa-tile" onClick={() => navigate('/buy-coin')}>
                  <div className="sa-qa-tile-left">
                    <div className="sa-qa-icon-wrap" style={{ background: '#FDF2F8', color: '#DB2777' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>
                    </div>
                    <span className="sa-qa-label">Buy Gold Coins</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8987" strokeWidth="2.4"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Donut Panels Stack */}
          <div className="sa-middle-right-col">
            <IrdDonutPanel
              title="Shop Types Breakdown"
              totalLabel={`${typeCounts.physical + typeCounts.virtual} sub-shops`}
              data={typeData}
              loading={typeLoading}
              onSliceClick={() => goShopList()}
            />
            <IrdDonutPanel
              title="Today's Login Status"
              totalLabel={`${login.active + login.inactive} total shops`}
              data={loginData}
              login
              loading={loginLoading}
              onSliceClick={entry => navigate(entry?.name === 'Active' ? '/login-active' : '/login-inactive')}
            />
          </div>
        </div>

        {/* 4. Full-Width Shop Identity & Overview Card */}
        <div className="sa-saas-card sa-shop-details-card">
          <div className="sa-saas-card-head">
            <div className="sa-saas-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009957" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Shop Identity & Profile Overview</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={openProfile}
                style={{
                  background: '#F3F7F6',
                  border: '1px solid #BDCFCE',
                  color: '#073B3F',
                  borderRadius: '8px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                View Full
              </button>
              <button
                type="button"
                onClick={openEdit}
                style={{
                  background: 'rgba(12,64,68,0.08)',
                  border: '1px solid rgba(12,64,68,0.25)',
                  color: '#0C4044',
                  borderRadius: '8px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ✎ Edit Info
              </button>
            </div>
          </div>

          <div className="sa-details-grid">
            {[
              ['Shop Name', shop?.shop_name],
              ['Owner Name', shop?.owner_name],
              ['Shop ID', shop?.shop_id],
              ['Shop Type', shop?.shop_type === 'virtual' ? 'Virtual Shop' : 'Physical Shop'],
              ['Mobile Number', shop?.mobile_number],
              ['WhatsApp Number', shop?.whatsapp_number],
              ['City & District', `${shop?.city || '—'}, ${shop?.district || '—'}`],
              ['Pincode', shop?.pincode],
              ['State', shop?.state],
              ['GST Number', shop?.gst_no],
              ['PAN Number', shop?.pan_no],
              ['MSME Number', shop?.msme_no],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#F8FAF9', border: '1px solid #E6ECEB', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A8987', marginBottom: '4px' }}>{k}</div>
                <div style={{ fontSize: '13px', fontWeight: 750, color: '#073B3F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Luxury Footer Banner */}
        <div className="sa-footer-banner">
          <div className="sa-footer-left">
            <div className="sa-footer-motto">
              "Athirai — Empowering Local Jewellery Businesses & Partners"
            </div>
            <div className="sa-footer-underline" />
          </div>
          <div className="sa-footer-right">
            <div className="sa-footer-brand">
              <div className="sa-footer-brand-title">ATHIRAI SHOP</div>
              <div className="sa-footer-brand-sub">ENTERPRISE SAAS SYSTEM</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE VIEW MODAL ── */}
      {showProfile && (
        <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '580px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '15px' }}>MY SHOP PROFILE</div>
                <div style={{ color: subtext, fontSize: '11px', marginTop: '3px', fontFamily: 'monospace' }}>{shop?.shop_id || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={openEdit} style={{ background: 'rgba(12,64,68,0.12)', border: '1px solid rgba(12,64,68,0.35)', color: '#0C4044', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}>✎ Edit</button>
                <button onClick={() => setShowProfile(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
              </div>
            </div>
            <div className="shd-form-grid" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                ['Shop Name', shop?.shop_name], ['Owner Name', shop?.owner_name],
                ['Shop Type', shop?.shop_type === 'live' ? 'Physical Shop' : 'Virtual Shop'],
                ['Email', shop?.email], ['Mobile', shop?.mobile_number], ['WhatsApp', shop?.whatsapp_number],
                ['Address', shop?.shop_address], ['Pincode', shop?.pincode], ['Street', shop?.street_name],
                ['City', shop?.city], ['District', shop?.district], ['State', shop?.state],
                ['PAN', shop?.pan_no], ['GST', shop?.gst_no], ['MSME', shop?.msme_no],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                  <div style={{ color: text, fontSize: '13px' }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE EDIT MODAL ── */}
      {showEdit && (
        <div onClick={() => setShowEdit(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.88)', backdropFilter: 'blur(12px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={submitEdit} onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.35)', borderRadius: '24px', width: '96%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 32px 90px rgba(17,24,23,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '15px' }}>✎ EDIT SHOP PROFILE</div>
              <button type="button" onClick={() => setShowEdit(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}>✕ Close</button>
            </div>

            {saveMsg && (
              <div style={{ background: saveMsg.includes('successfully') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${saveMsg.includes('successfully') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: saveMsg.includes('successfully') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
                {saveMsg}
              </div>
            )}

            <div style={sectionCard}>
              <SectionHeader icon="shop" label="Shop Info" />
              <div className="shd-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><label style={lbl}>Shop Name</label><input name="shop_name" value={editForm.shop_name || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>Owner Name</label><input name="owner_name" value={editForm.owner_name || ''} onChange={handleEditChange} style={inp} /></div>
                <div>
                  <label style={lbl}>Shop Type</label>
                  <select name="shop_type" value={editForm.shop_type || 'live'} onChange={handleEditChange} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="live">Physical Shop</option>
                    <option value="virtual">Virtual Shop</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ ...sectionCard, marginTop: '16px' }}>
              <SectionHeader icon="lock" label="Contact" />
              <div className="shd-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><label style={lbl}>Mobile Number</label><input name="mobile_number" maxLength={10} value={editForm.mobile_number || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>WhatsApp Number</label><input name="whatsapp_number" maxLength={10} value={editForm.whatsapp_number || ''} onChange={handleEditChange} style={inp} /></div>
              </div>
            </div>

            <div style={{ ...sectionCard, marginTop: '16px' }}>
              <SectionHeader icon="pin" label="Address" />
              <div className="shd-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Shop Address</label><input name="shop_address" value={editForm.shop_address || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>Pincode</label><input name="pincode" maxLength={6} value={editForm.pincode || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>Street Name</label><input name="street_name" value={editForm.street_name || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>City</label><input name="city" value={editForm.city || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>District</label><input name="district" value={editForm.district || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>State</label><input name="state" value={editForm.state || ''} onChange={handleEditChange} style={inp} /></div>
              </div>
            </div>

            <div style={{ ...sectionCard, marginTop: '16px' }}>
              <SectionHeader icon="briefcase" label="Identity (Optional)" />
              <div className="shd-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div><label style={lbl}>PAN</label><input name="pan_no" maxLength={10} value={editForm.pan_no || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>GST</label><input name="gst_no" maxLength={15} value={editForm.gst_no || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>MSME</label><input name="msme_no" maxLength={25} value={editForm.msme_no || ''} onChange={handleEditChange} style={inp} /></div>
              </div>
            </div>

            <button type="submit" disabled={saving} style={{ marginTop: '20px', width: '100%', padding: '14px', background: saving ? 'rgba(12,64,68,0.4)' : 'linear-gradient(90deg,#0C4044,#BDCFCE)', border: 'none', borderRadius: '12px', fontWeight: 900, color: '#FDFDFC', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
