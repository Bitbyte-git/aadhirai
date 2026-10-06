import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import ShopNavbar from '../collection/ShopNavbar'
import CopyShopUrlButton from '../collection/CopyShopUrlButton'
import { IrdOrderTrendPanel, IrdDonutPanel, irdPalette } from './AdminDashboard'
import '../components/skeleton.css'

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
  const [shop, setShop] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [stats, setStats] = useState({ yesterday_orders: 0, today_orders: 0, today_new_shops: 0, active_users: 0, total_sub_shops: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const [typeCounts, setTypeCounts] = useState({ physical: 0, virtual: 0 })
  const [typeLoading, setTypeLoading] = useState(true)
  const [login, setLogin] = useState({ active: 0, inactive: 0 })
  const [loginLoading, setLoginLoading] = useState(true)

  // Live Gold Rate & Live Clock
  const [goldRate, setGoldRate] = useState(null)
  const [liveTime, setLiveTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    api.get('/metal-rates/')
      .then(res => {
        const d = Array.isArray(res.data) ? res.data[0] : res.data
        if (d?.gold_22k) setGoldRate(parseFloat(d.gold_22k))
      })
      .catch(() => {})
  }, [])

  const fetchShopInfo = async () => {
    try {
      const res = await api.get('/my-shop-profile/')
      setShop(res.data)
    } catch (err) {
      console.error('Shop profile fetch error:', err)
    }
  }

  useEffect(() => {
    let current = true
    fetchShopInfo()
    api.get('/dashboard-quick-stats/')
      .then(res => { if (current) setStats(prev => ({ ...prev, ...res.data })) })
      .catch(() => {})
      .finally(() => { if (current) setStatsLoading(false) })

    api.get('/shop-dashboard-stats/')
      .then(res => { if (current) setTypeCounts({ physical: res.data.physical_count || 0, virtual: res.data.virtual_count || 0 }) })
      .catch(() => {})
      .finally(() => { if (current) setTypeLoading(false) })

    api.get('/shop-list/', { params: { limit: 1 } })
      .then(res => { if (current) setLogin({ active: res.data.today_active_count || 0, inactive: res.data.today_inactive_count || 0 }) })
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
        /* ── Full SaaS Dashboard Styles (Matching SuperAdmin & Admin Dashboards) ── */
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
        .sa-btn-profile-top {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #073B3F;
          color: #FDFDFC;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.2);
        }
        .sa-btn-profile-top:hover {
          background: #0C4E53;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(7, 59, 63, 0.28);
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
          grid-template-columns: 1.45fr 1fr;
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
          margin-bottom: 18px;
        }
        .sa-saas-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 800;
          color: #073B3F;
        }
        .sa-qa-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          flex: 1;
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
          transition: all 0.2s ease;
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

        /* ── RESPONSIVE MEDIA QUERIES (SaaS 2x2 Mobile, 95% mobile-first) ── */
        @media (max-width: 1200px) {
          .sa-kpi-grid-v2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sa-middle-grid { grid-template-columns: 1fr; }
          .sa-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .sa-middle-grid { grid-template-columns: 1fr; }
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

      {/* ── MAIN SAAS DASHBOARD CONTAINER ── */}
      <div className="sa-dashboard-container">
        {/* 1. Welcome Card Banner */}
        <div className="sa-welcome-card">
          <div className="sa-welcome-left">
            <div className="sa-welcome-icon-box">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="10" width="18" height="11" rx="2" />
                <path d="M3 10 5 3h14l2 7" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </div>
            <div>
              <h1 className="sa-welcome-title">Welcome Back, {shop?.shop_name || 'Shop Partner'}!</h1>
              <div className="sa-welcome-sub">
                {shop?.shop_id ? `${shop.shop_id} · ` : ''}
                {shop?.shop_type === 'virtual' ? 'Virtual Shop Partner' : 'Physical Shop Partner'} · Here's what's happening with your network today.
              </div>
            </div>
          </div>

          <div className="sa-welcome-actions">
            {/* Live Gold Rate Badge */}
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

        {/* 2. 4 Modern KPI Cards */}
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
              <div className="sa-kpi-num">{stats.yesterday_orders ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>Compared to today</span>
              </div>
            </div>
          </div>

          {/* Card 2: Today Order */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#E6F7F0', color: '#009957' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* 3. Middle Grid: Order Trend & Donut Panels */}
        <div className="sa-middle-grid">
          {/* Order Trend Spline */}
          <div>
            <IrdOrderTrendPanel title="Shop Order Volume Trend" endpoint="/order-timeseries/" />
          </div>

          {/* Donut Panels Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        {/* 4. Bottom Grid: Quick Actions & Shop Snapshot */}
        <div className="sa-bottom-grid">
          {/* Card 1: Shop Management & Quick Actions */}
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

          {/* Card 2: Shop Network Snapshot & Profile Details */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009957" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Shop Identity & Details</span>
              </div>
              <button
                type="button"
                onClick={openEdit}
                style={{
                  background: 'rgba(12,64,68,0.08)',
                  border: '1px solid rgba(12,64,68,0.25)',
                  color: '#0C4044',
                  borderRadius: '8px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ✎ Edit Info
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', flex: 1 }}>
              {[
                ['Shop Name', shop?.shop_name],
                ['Owner Name', shop?.owner_name],
                ['Shop ID', shop?.shop_id],
                ['Shop Type', shop?.shop_type === 'virtual' ? 'Virtual Shop' : 'Physical Shop'],
                ['Mobile Number', shop?.mobile_number],
                ['City & District', `${shop?.city || '—'}, ${shop?.district || '—'}`],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#F8FAF9', border: '1px solid #E6ECEB', borderRadius: '12px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A8987', marginBottom: '4px' }}>{k}</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 750, color: '#073B3F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v || '—'}</div>
                </div>
              ))}
            </div>
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
              <div className="sa-footer-brand-title">ATHIRAI JEWELLERY</div>
              <div className="sa-footer-brand-sub">CERTIFIED SHOP PARTNER</div>
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
