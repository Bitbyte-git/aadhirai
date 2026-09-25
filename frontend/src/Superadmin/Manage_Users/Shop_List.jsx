import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api'

// ── Shop List — same layout as Super_Stockist.jsx.
// Super Admin: every shop. Shop login: only the shops under it (backend scopes it). ──
const PAGE_SIZE = 300

const TYPE_LABEL = { live: 'Physical', virtual: 'Virtual' }
const formatINR = n => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function ShopList() {
  const navigate = useNavigate()
  const location = useLocation()
  const role = localStorage.getItem('role')
  const isSuperAdmin = role === 'super_admin'

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [filteredCount, setFilteredCount] = useState(0)
  const [activeTab, setActiveTab] = useState(location.state?.todayStatus || 'all') // 'all' | 'active' | 'inactive'
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'live' | 'virtual'
  const [stats, setStats] = useState({ total_count: 0, today_active: 0, today_inactive: 0, today_orders: 0, physical: 0, virtual: 0 })
  const [actionOpen, setActionOpen] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [toast, setToast] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleCopyId = async (idText, key) => {
    if (!idText) return
    try {
      await navigator.clipboard.writeText(idText)
      setCopiedId(key)
      showToast(`Copied ${idText}`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* clipboard blocked */ }
  }

  const fetchShops = async (signal, currentOffset, append) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const res = await api.get('/shop-list/', {
        signal,
        params: {
          offset: currentOffset,
          limit: PAGE_SIZE,
          search: search || undefined,
          today_status: activeTab !== 'all' ? activeTab : undefined,
          shop_type: typeFilter !== 'all' ? typeFilter : undefined,
        },
      })
      const d = res.data
      setRows(prev => (append ? [...prev, ...(d.shops || [])] : (d.shops || [])))
      setHasMore(!!d.has_more)
      setFilteredCount(d.filtered_count || 0)
      setStats({
        total_count: d.total_count || 0,
        today_active: d.today_active_count || 0,
        today_inactive: d.today_inactive_count || 0,
        today_orders: d.today_orders_count || 0,
        physical: d.physical_count || 0,
        virtual: d.virtual_count || 0,
      })
      setError('')
    } catch (e) {
      if (e.name === 'CanceledError' || e.name === 'AbortError') return
      setError('Failed to load shops. Please refresh.')
      if (!append) setRows([])
    }
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const controller = new AbortController()
    setOffset(0)
    fetchShops(controller.signal, 0, false)
    return () => controller.abort()
  }, [search, activeTab, typeFilter, refreshKey])

  const handleLoadMore = () => {
    const next = offset + PAGE_SIZE
    setOffset(next)
    fetchShops(undefined, next, true)
  }

  useEffect(() => {
    const closeMenu = () => setActionOpen(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const downloadReport = async () => {
    if (!rows.length) return
    setDownloading(true)
    try {
      const columns = ['S.No', 'Shop ID', 'Shop Name', 'Owner', 'Type', 'Mobile', 'City', 'Parent', 'Level', 'Sub-shops', 'Orders', 'Sales', 'Today']
      const rowsPayload = rows.map((r, i) => [
        i + 1, r.shop_id || '—', r.shop_name || '—', r.owner_name || '—', TYPE_LABEL[r.shop_type] || '—',
        r.mobile_number || '—', r.city || '—', r.parent_shop_name || '—', r.level, r.sub_shop_count,
        r.total_orders, formatINR(r.total_sales), r.is_active_today ? 'Active' : 'Inactive',
      ])
      const res = await api.post('/generic-table-pdf/', {
        title: 'Shop Directory Report',
        subtitle: isSuperAdmin ? 'Every shop in the network, with today’s activity.' : 'All shops under your shop, with today’s activity.',
        period_label: `Generated ${new Date().toLocaleDateString('en-IN')}`,
        stats: [
          { label: 'Total Shops', value: stats.total_count },
          { label: 'Today Active', value: stats.today_active },
          { label: 'Today Inactive', value: stats.today_inactive },
          { label: 'Today Orders', value: stats.today_orders },
        ],
        columns,
        rows: rowsPayload,
      }, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `shops_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast('Report downloaded successfully!')
    } catch {
      showToast('Failed to download report')
    } finally {
      setDownloading(false)
    }
  }

  const initials = s => (s.shop_name || 'S').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const tabTotal = activeTab === 'active' ? stats.today_active : activeTab === 'inactive' ? stats.today_inactive : stats.total_count

  const StatusPill = ({ active, small }) => active ? (
    <span className="mu-status-pill is-active" style={small ? { fontSize: '10px', padding: '2px 8px' } : undefined}><span className="mu-status-dot" />Active Today</span>
  ) : (
    <span className="mu-status-pill is-inactive" style={small ? { fontSize: '10px', padding: '2px 8px' } : undefined}>Inactive Today</span>
  )

  const TypePill = ({ type }) => (
    <span className={`mu-type-pill ${type === 'virtual' ? 'is-virtual' : ''}`}>{TYPE_LABEL[type] || '—'}</span>
  )

  const ActionMenu = ({ s }) => (
    <div className="mu-menu-popup">
      <button type="button" onClick={() => { setSelectedDetail(s); setActionOpen(null) }}><span>View Profile</span><span>↗</span></button>
      <button type="button" onClick={() => navigate(`/shop-report?shop=${encodeURIComponent(s.shop_id)}`)}><span>Sales Report</span><span>↗</span></button>
      <button type="button" onClick={() => navigate('/shop-hierarchy-tree')}><span>View Hierarchy</span><span>↗</span></button>
      <button type="button" onClick={() => handleCopyId(s.shop_id, `sid-${s.id}`)}>
        <span>{copiedId === `sid-${s.id}` ? 'ID Copied!' : 'Copy Shop ID'}</span><span>{copiedId === `sid-${s.id}` ? '✓' : '⧉'}</span>
      </button>
    </div>
  )

  return (
    <div className="mu-root">
      <style>{`
        .mu-root{min-height:100vh;width:100%;overflow-x:hidden;background:#F8FAF9;background-image:radial-gradient(at 0% 0%,rgba(7,59,63,.05) 0px,transparent 50%),radial-gradient(at 100% 100%,rgba(204,168,129,.06) 0px,transparent 50%);color:#111817;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;box-sizing:border-box}
        .mu-root *{box-sizing:border-box}
        .mu-shell{max-width:1440px;margin:0 auto;padding:24px 48px 64px}
        .mu-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;gap:12px}
        .mu-breadcrumb{display:flex;align-items:center;gap:8px;font-size:13px;color:#728A87;font-weight:500}
        .mu-back-btn{display:inline-flex;align-items:center;gap:8px;background:#FFFFFF;border:1px solid #D9E4E3;padding:8px 16px;border-radius:12px;font-size:13px;font-weight:700;color:#073B3F;cursor:pointer;transition:all 140ms ease;box-shadow:0 1px 2px rgba(0,0,0,.03)}
        .mu-back-btn:hover{background:#073B3F;color:#FFFFFF;border-color:#073B3F;transform:translateY(-1px)}
        .mu-header-card{background:#FFFFFF;border:1px solid #E1EBEA;border-radius:20px;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px;box-shadow:0 6px 24px rgba(7,59,63,.04);margin-bottom:24px}
        .mu-header-info h1{font-size:26px;font-weight:800;color:#073B3F;margin:0 0 6px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .mu-role-badge{background:#E8F2F1;color:#073B3F;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:.06em}
        .mu-header-sub{font-size:13.5px;color:#728A87;margin:0;max-width:680px;line-height:1.5}
        .mu-header-actions{display:flex;align-items:center;gap:10px;flex-shrink:0;flex-wrap:wrap}
        .mu-refresh-btn,.mu-export-btn,.mu-create-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;transition:all 140ms ease}
        .mu-refresh-btn{background:#FFFFFF;border:1px solid #D9E4E3;color:#073B3F}
        .mu-refresh-btn:hover{background:#F4F8F7;border-color:#073B3F}
        .mu-export-btn{background:#073B3F;border:1px solid #073B3F;color:#FFFFFF}
        .mu-export-btn:hover{background:#0C5258;transform:translateY(-1px)}
        .mu-create-btn{background:#FFFFFF;border:1px solid #BB8958;color:#8A623D}
        .mu-create-btn:hover{background:#BB8958;color:#FFFFFF}
        .mu-export-btn:disabled,.mu-refresh-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .mu-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
        .mu-stat-card{background:#FFFFFF;border:1px solid #E1EBEA;border-radius:18px;padding:20px 22px;box-shadow:0 4px 16px rgba(7,59,63,.03);display:flex;align-items:center;justify-content:space-between;transition:all 180ms ease;position:relative;cursor:pointer;user-select:none}
        .mu-stat-card:hover{border-color:#073B3F;transform:translateY(-2px);box-shadow:0 8px 24px rgba(7,59,63,.06)}
        .mu-stat-card.is-active-tab{border-color:#073B3F;box-shadow:0 8px 24px rgba(7,59,63,.12);background:#F8FBFA;transform:translateY(-2px)}
        .mu-pulse-badge{background:#DCFCE7;color:#15803D;font-size:10px;font-weight:800;text-transform:uppercase;padding:2px 7px;border-radius:999px;letter-spacing:.05em}
        .mu-filter-chip{display:inline-flex;align-items:center;gap:6px;background:#073B3F;color:#FFFFFF;padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:700;border:none;cursor:pointer}
        .mu-status-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.02em;white-space:nowrap}
        .mu-status-pill.is-active{background:#ECFDF5;color:#059669;border:1px solid #A7F3D0}
        .mu-status-pill.is-inactive{background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB}
        .mu-status-dot{width:6px;height:6px;border-radius:50%;background:#10B981;box-shadow:0 0 0 2px rgba(16,185,129,.25)}
        .mu-type-pill{display:inline-flex;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;background:rgba(12,64,68,.08);color:#0C4044;border:1px solid rgba(12,64,68,.28)}
        .mu-type-pill.is-virtual{background:rgba(204,168,129,.16);color:#8A623D;border-color:rgba(204,168,129,.5)}
        .mu-stat-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#728A87;margin-bottom:8px;display:block}
        .mu-stat-number{font-size:24px;font-weight:800;color:#073B3F;line-height:1.1}
        .mu-stat-icon{width:42px;height:42px;border-radius:12px;background:#F4F7F6;display:flex;align-items:center;justify-content:center;color:#073B3F;flex-shrink:0}
        .mu-panel{background:#FFFFFF;border:1px solid #E1EBEA;border-radius:20px;box-shadow:0 6px 24px rgba(7,59,63,.04);overflow:hidden}
        .mu-panel-header{padding:20px 24px;border-bottom:1px solid #EDF2F1;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .mu-panel-title-wrap{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .mu-count-badge{padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;background:#F0F5F4;color:#073B3F}
        .mu-panel-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .mu-seg{display:inline-flex;background:#F4F7F6;border:1px solid #D9E4E3;border-radius:12px;padding:3px}
        .mu-seg button{border:none;background:transparent;padding:6px 12px;border-radius:9px;font-size:12px;font-weight:700;color:#728A87;cursor:pointer}
        .mu-seg button.active{background:#073B3F;color:#FFFFFF}
        .mu-search-box{display:flex;align-items:center;background:#F4F7F6;border:1px solid #D9E4E3;border-radius:12px;padding:8px 14px;gap:10px;width:300px;max-width:100%;transition:all 180ms ease}
        .mu-search-box:focus-within{background:#FFFFFF;border-color:#073B3F;box-shadow:0 0 0 3px rgba(7,59,63,.1)}
        .mu-search-input{border:none;background:transparent;outline:none;width:100%;font-size:13px;color:#111817}
        .mu-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .mu-table{width:100%;border-collapse:collapse;font-size:13.5px}
        .mu-table thead tr{background:#FAFBFB;border-bottom:1px solid #EDF2F1}
        .mu-table th{padding:14px 16px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#728A87;text-align:left;white-space:nowrap}
        .mu-table tbody tr{border-bottom:1px solid #EDF2F1;transition:background 120ms ease}
        .mu-table tbody tr:hover{background:#F5FAF9}
        .mu-table td{padding:13px 16px;vertical-align:middle;white-space:nowrap}
        .mu-sno{font-weight:800;color:#073B3F;font-family:monospace;text-align:center;width:44px}
        .mu-id-pill{display:inline-flex;align-items:center;gap:6px;background:#F0F5F4;border:1px solid #D5E3E1;padding:4px 10px;border-radius:8px;font-family:monospace;font-size:12px;font-weight:700;color:#073B3F;cursor:pointer;transition:all 140ms ease}
        .mu-id-pill:hover{background:#E3ECEB;border-color:#073B3F}
        .mu-user-col{display:flex;align-items:center;gap:12px}
        .mu-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#073B3F,#126368);color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;text-transform:uppercase}
        .mu-name{font-weight:700;color:#0A2F33;font-size:13.5px}
        .mu-email{color:#728A87;font-size:12px;margin-top:2px}
        .mu-phone-link{color:#364B49;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:13px}
        .mu-phone-link:hover{color:#073B3F;text-decoration:underline}
        .mu-city-pill{background:#F4F7F6;border:1px solid #E1EBEA;color:#364B49;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600}
        .mu-parent{font-size:12.5px;font-weight:700;color:#364B49}
        .mu-parent small{display:block;font-size:11px;color:#728A87;font-weight:600;margin-top:2px}
        .mu-action-cell{position:relative;text-align:right}
        .mu-action-trigger{width:32px;height:32px;border-radius:8px;border:1px solid #D5E3E1;background:#FFFFFF;color:#073B3F;font-weight:900;cursor:pointer;transition:all 140ms ease;display:inline-flex;align-items:center;justify-content:center}
        .mu-action-trigger:hover,.mu-action-trigger.is-open{background:#073B3F;color:#FFFFFF;border-color:#073B3F;box-shadow:0 4px 12px rgba(7,59,63,.15)}
        .mu-menu-popup{position:absolute;z-index:90;top:calc(100% + 4px);right:12px;width:220px;background:#FFFFFF;border:1px solid #D5E3E1;border-radius:14px;padding:6px;box-shadow:0 16px 40px rgba(7,59,63,.14);text-align:left}
        .mu-menu-popup button{width:100%;padding:8px 12px;border:none;background:transparent;border-radius:8px;color:#111817;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background 120ms ease}
        .mu-menu-popup button:hover{background:#F0F5F4;color:#073B3F}
        .mu-mobile-cards{display:none;flex-direction:column;gap:12px;padding:14px}
        .mu-mobile-card{background:#FFFFFF;border:1px solid #E1EBEA;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(7,59,63,.03);display:flex;flex-direction:column;gap:12px;position:relative}
        .mu-mobile-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .mu-mobile-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;background:#F8FAF9;padding:10px 12px;border-radius:12px}
        .mu-mobile-item-label{font-size:10px;font-weight:800;text-transform:uppercase;color:#728A87}
        .mu-mobile-item-val{font-size:12.5px;font-weight:700;color:#073B3F;margin-top:2px}
        .mu-loadmore-wrap{padding:20px;display:flex;justify-content:center;border-top:1px solid #EDF2F1}
        .mu-loadmore-btn{padding:10px 24px;border-radius:12px;border:1px solid #D9E4E3;background:#FFFFFF;color:#073B3F;font-weight:700;font-size:13px;cursor:pointer}
        .mu-loadmore-btn:hover{background:#073B3F;color:#FFFFFF;border-color:#073B3F}
        .mu-toast{position:fixed;bottom:24px;right:24px;background:#073B3F;color:#FFFFFF;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:700;box-shadow:0 10px 30px rgba(7,59,63,.3);z-index:9999;animation:toastSlide 200ms ease}
        @keyframes toastSlide{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes skelShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .mu-skel-line{height:14px;border-radius:4px;background:linear-gradient(90deg,#E7EDEC 25%,#F3F3F0 50%,#E7EDEC 75%);background-size:200% 100%;animation:skelShimmer 1.4s ease-in-out infinite}
        .mu-modal-back{position:fixed;inset:0;background:rgba(17,24,23,.6);backdrop-filter:blur(6px);z-index:1100;display:flex;align-items:center;justify-content:center;padding:16px}
        .mu-modal{background:#FFFFFF;border-radius:20px;width:100%;max-width:620px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 70px rgba(17,24,23,.35)}
        .mu-modal-head{padding:20px 24px;border-bottom:1px solid #EDF2F1;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .mu-modal-body{overflow-y:auto;padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .mu-modal-body label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#728A87;margin-bottom:4px}
        .mu-modal-body div > span{font-size:13px;color:#111817;font-weight:600;word-break:break-word}
        @media(max-width:1100px){.mu-stats-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:768px){
          .mu-shell{padding:16px 14px 48px}
          .mu-header-card{padding:20px 18px;flex-direction:column;align-items:flex-start}
          .mu-header-actions{width:100%}
          .mu-refresh-btn,.mu-export-btn,.mu-create-btn{flex:1;justify-content:center}
          .mu-stats-grid{grid-template-columns:repeat(2,1fr);gap:10px}
          .mu-stat-card{padding:14px}
          .mu-table-wrap{display:none}
          .mu-mobile-cards{display:flex}
          .mu-search-box{width:100%}
          .mu-panel-tools{width:100%}
          .mu-modal-body{grid-template-columns:1fr}
        }
      `}</style>

      <div className="mu-shell">
        <div className="mu-topbar">
          <div className="mu-breadcrumb">
            <span>Manage Users</span><span>/</span>
            <span style={{ color: '#073B3F', fontWeight: 700 }}>Shops</span>
          </div>
          <button className="mu-back-btn" onClick={() => navigate(isSuperAdmin ? '/super-admin' : '/shop-dashboard')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="mu-header-card">
          <div className="mu-header-info">
            <h1>
              <span>{isSuperAdmin ? 'Shop Network' : 'My Shop Network'}</span>
              <span className="mu-role-badge">{stats.physical} Physical · {stats.virtual} Virtual</span>
            </h1>
            <p className="mu-header-sub">
              {isSuperAdmin
                ? 'Every shop in the system — who created it, where it sits in the network, and today’s activity.'
                : 'Every shop created under you (and the shops they created), with today’s activity.'}
            </p>
          </div>
          <div className="mu-header-actions">
            <button className="mu-create-btn" onClick={() => navigate('/add-shop')}>+ Create Shop</button>
            <button className="mu-refresh-btn" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button className="mu-export-btn" onClick={downloadReport} disabled={loading || downloading || !rows.length}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              <span>{downloading ? 'Preparing...' : 'Download Report'}</span>
            </button>
          </div>
        </div>

        {/* KPI cards — click to filter the table */}
        <div className="mu-stats-grid">
          <div className={`mu-stat-card ${activeTab === 'all' ? 'is-active-tab' : ''}`} onClick={() => setActiveTab('all')} title="Show all shops">
            <div>
              <span className="mu-stat-title">Total Shops</span>
              <span className="mu-stat-number">{stats.total_count}</span>
            </div>
            <div className="mu-stat-icon" style={{ background: '#E8F2F1', color: '#073B3F' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></svg>
            </div>
          </div>
          <div className={`mu-stat-card ${activeTab === 'active' ? 'is-active-tab' : ''}`} onClick={() => setActiveTab('active')} title="Show shops that logged in today">
            <div>
              <span className="mu-stat-title" style={{ color: '#059669' }}>Today Active</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mu-stat-number" style={{ color: '#059669' }}>{stats.today_active}</span>
                {stats.today_active > 0 && <span className="mu-pulse-badge">Live</span>}
              </div>
            </div>
            <div className="mu-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
            </div>
          </div>
          <div className={`mu-stat-card ${activeTab === 'inactive' ? 'is-active-tab' : ''}`} onClick={() => setActiveTab('inactive')} title="Show shops that haven't logged in today">
            <div>
              <span className="mu-stat-title" style={{ color: '#D97706' }}>Today Inactive</span>
              <span className="mu-stat-number" style={{ color: '#D97706' }}>{stats.today_inactive}</span>
            </div>
            <div className="mu-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg>
            </div>
          </div>
          <div className="mu-stat-card" onClick={() => navigate('/shop-report')} title="Open the Shop Report">
            <div>
              <span className="mu-stat-title" style={{ color: '#0284C7' }}>Today Order</span>
              <span className="mu-stat-number" style={{ color: '#0284C7' }}>{stats.today_orders}</span>
            </div>
            <div className="mu-stat-icon" style={{ background: '#F0F9FF', color: '#0284C7' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            </div>
          </div>
        </div>

        <div className="mu-panel">
          <div className="mu-panel-header">
            <div className="mu-panel-title-wrap">
              <span style={{ fontWeight: 800, color: '#073B3F', fontSize: '15px' }}>Shop Directory</span>
              <span className="mu-count-badge">Showing {rows.length} of {search || typeFilter !== 'all' ? filteredCount : tabTotal}</span>
              {activeTab !== 'all' && (
                <button type="button" onClick={() => setActiveTab('all')} className="mu-filter-chip" title="Clear filter">
                  <span>Filtered: Today {activeTab === 'active' ? 'Active' : 'Inactive'}</span><span>✕</span>
                </button>
              )}
            </div>
            <div className="mu-panel-tools">
              <div className="mu-seg">
                {[['all', 'All'], ['live', 'Physical'], ['virtual', 'Virtual']].map(([k, l]) => (
                  <button key={k} className={typeFilter === k ? 'active' : ''} onClick={() => setTypeFilter(k)}>{l}</button>
                ))}
              </div>
              <div className="mu-search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#728A87" strokeWidth="2.2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input className="mu-search-input" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by ID, shop, owner, phone, city..." />
                {searchInput && (
                  <button type="button" onClick={() => setSearchInput('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#728A87', padding: 0 }}>✕</button>
                )}
              </div>
            </div>
          </div>

          {error && <div style={{ padding: '14px 24px', color: '#C92035', fontSize: 13, fontWeight: 600 }}>{error}</div>}

          {loading ? (
            <div className="mu-table-wrap">
              <table className="mu-table">
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {[20, 110, 180, 70, 100, 90, 120, 90, 32].map((w, j) => (
                        <td key={j}><div className="mu-skel-line" style={{ width: `${w}px` }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 6px', color: '#073B3F', fontSize: '16px', fontWeight: 800 }}>
                {search ? `No shops match "${search}"` : activeTab !== 'all' ? `No shops are "Today ${activeTab === 'active' ? 'Active' : 'Inactive'}"` : 'No shops yet'}
              </h4>
              <p style={{ margin: 0, color: '#728A87', fontSize: '13.5px' }}>
                {isSuperAdmin || search || activeTab !== 'all' ? 'Try changing the filters or search.' : 'Shops you create will show up here.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mu-table-wrap">
                <table className="mu-table">
                  <thead>
                    <tr>
                      <th style={{ width: '44px', textAlign: 'center' }}>S.NO</th>
                      <th>SHOP ID</th>
                      <th>SHOP &amp; OWNER</th>
                      <th>TYPE</th>
                      <th>PHONE NUMBER</th>
                      <th>CITY</th>
                      <th>CREATED BY</th>
                      <th>ORDERS</th>
                      <th>TODAY STATUS</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s, i) => (
                      <tr key={s.id}>
                        <td className="mu-sno">{i + 1}</td>
                        <td>
                          <span className="mu-id-pill" onClick={() => handleCopyId(s.shop_id, `sid-${s.id}`)} title="Click to copy ID">
                            <span>{s.shop_id}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              {copiedId === `sid-${s.id}` ? <polyline points="20 6 9 17 4 12" /> : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>}
                            </svg>
                          </span>
                        </td>
                        <td>
                          <div className="mu-user-col">
                            <div className="mu-avatar">{initials(s)}</div>
                            <div>
                              <div className="mu-name">{s.shop_name}</div>
                              <div className="mu-email">{s.owner_name}{s.email ? ` · ${s.email}` : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td><TypePill type={s.shop_type} /></td>
                        <td>
                          {s.mobile_number ? (
                            <a href={`tel:${s.mobile_number}`} className="mu-phone-link">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                              <span>{s.mobile_number}</span>
                            </a>
                          ) : <span style={{ color: '#A0B2AF' }}>—</span>}
                        </td>
                        <td>{s.city ? <span className="mu-city-pill">{s.city}</span> : <span style={{ color: '#A0B2AF' }}>—</span>}</td>
                        <td>
                          <div className="mu-parent">
                            {s.parent_shop_name}
                            <small>Level {s.level}{s.sub_shop_count ? ` · ${s.sub_shop_count} sub-shop${s.sub_shop_count === 1 ? '' : 's'}` : ''}</small>
                          </div>
                        </td>
                        <td>
                          <div className="mu-parent">{s.total_orders}<small>{formatINR(s.total_sales)}</small></div>
                        </td>
                        <td><StatusPill active={s.is_active_today} /></td>
                        <td className="mu-action-cell" onClick={e => e.stopPropagation()}>
                          <button type="button" className={`mu-action-trigger ${actionOpen === s.id ? 'is-open' : ''}`} onClick={() => setActionOpen(cur => cur === s.id ? null : s.id)} title="Actions">•••</button>
                          {actionOpen === s.id && <ActionMenu s={s} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mu-mobile-cards">
                {rows.map(s => (
                  <div key={`mob-${s.id}`} className="mu-mobile-card">
                    <div className="mu-mobile-top">
                      <div className="mu-user-col">
                        <div className="mu-avatar">{initials(s)}</div>
                        <div>
                          <div className="mu-name">{s.shop_name}</div>
                          <div className="mu-email">{s.owner_name}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span className="mu-id-pill" onClick={() => handleCopyId(s.shop_id, `sid-${s.id}`)}>{s.shop_id}</span>
                        <StatusPill active={s.is_active_today} small />
                      </div>
                    </div>
                    <div className="mu-mobile-grid">
                      <div><div className="mu-mobile-item-label">Type</div><div className="mu-mobile-item-val">{TYPE_LABEL[s.shop_type]}</div></div>
                      <div><div className="mu-mobile-item-label">Mobile</div><div className="mu-mobile-item-val">{s.mobile_number || '—'}</div></div>
                      <div><div className="mu-mobile-item-label">City</div><div className="mu-mobile-item-val">{s.city || '—'}</div></div>
                      <div><div className="mu-mobile-item-label">Created by</div><div className="mu-mobile-item-val">{s.parent_shop_name}</div></div>
                      <div><div className="mu-mobile-item-label">Orders</div><div className="mu-mobile-item-val">{s.total_orders} · {formatINR(s.total_sales)}</div></div>
                      <div><div className="mu-mobile-item-label">Sub-shops</div><div className="mu-mobile-item-val">{s.sub_shop_count}</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => setSelectedDetail(s)} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: '1px solid #D9E4E3', background: '#FFFFFF', color: '#073B3F', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>View Profile</button>
                      <button type="button" onClick={() => navigate(`/shop-report?shop=${encodeURIComponent(s.shop_id)}`)} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: 'none', background: '#073B3F', color: '#FFFFFF', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>Sales Report</button>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mu-loadmore-wrap">
                  <button className="mu-loadmore-btn" onClick={handleLoadMore} disabled={loadingMore}>{loadingMore ? 'Loading...' : 'Load more'}</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedDetail && (
        <div className="mu-modal-back" onClick={() => setSelectedDetail(null)}>
          <div className="mu-modal" onClick={e => e.stopPropagation()}>
            <div className="mu-modal-head">
              <div>
                <div style={{ fontWeight: 800, color: '#073B3F', fontSize: 16 }}>{selectedDetail.shop_name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#728A87', marginTop: 2 }}>{selectedDetail.shop_id}</div>
              </div>
              <button className="mu-back-btn" onClick={() => setSelectedDetail(null)}>Close</button>
            </div>
            <div className="mu-modal-body">
              {[
                ['Owner', selectedDetail.owner_name], ['Shop Type', TYPE_LABEL[selectedDetail.shop_type]],
                ['Email', selectedDetail.email], ['Mobile', selectedDetail.mobile_number],
                ['WhatsApp', selectedDetail.whatsapp_number], ['Created On', formatDate(selectedDetail.created_at)],
                ['Created By', selectedDetail.parent_shop_id ? `${selectedDetail.parent_shop_name} (${selectedDetail.parent_shop_id})` : selectedDetail.parent_shop_name],
                ['Level / Sub-shops', `Level ${selectedDetail.level} · ${selectedDetail.sub_shop_count} sub-shops`],
                ['Address', selectedDetail.shop_address], ['Street', selectedDetail.street_name],
                ['City', selectedDetail.city], ['District', selectedDetail.district],
                ['State', selectedDetail.state], ['Pincode', selectedDetail.pincode],
                ['PAN', selectedDetail.pan_no], ['GST', selectedDetail.gst_no], ['MSME', selectedDetail.msme_no],
                ['Orders / Sales', `${selectedDetail.total_orders} · ${formatINR(selectedDetail.total_sales)}`],
                ['Today', selectedDetail.is_active_today ? 'Active' : 'Inactive'],
              ].map(([label, value]) => (
                <div key={label}><label>{label}</label><span>{value || '—'}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="mu-toast">{toast}</div>}
    </div>
  )
}
