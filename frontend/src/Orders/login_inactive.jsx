import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import SuperAdminNavbar from '../collection/SuperAdminNavbar'

// ── NEW: period dropdown options ──
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '3days', label: '3 Days' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

export default function LoginInactive() {
  const navigate = useNavigate()
  const location = useLocation()
  const scopeIds = location.state?.ids || null           
  const scopeLabel = location.state?.scopeLabel || null   
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('today')   // ── NEW
  const [offset, setOffset] = useState(0)
const [limit, setLimit] = useState(20)
const [totalCount, setTotalCount] = useState(0)
const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const isAdminOnly = roleFilter === 'Admin'   // ── NEW: Admin role konjam per mattum irukka, Load More venaam
      const initialLimit = isAdminOnly ? 5000 : 20   // ── NEW: Admin na ella pere yum, illana 20 mattum

      const res = await api.get('/today-login-status/', {
        params: {
          period: periodFilter,
          role: roleFilter,
          offset: 0,
          limit: initialLimit,
        }
      })
      let list = [...(res.data.inactive || [])]
      setTotalCount(res.data.total_count || 0)
      setOffset(initialLimit)
      setLimit(50)
      if (scopeIds) list = list.filter(u => scopeIds.includes(u.id))
      const sorted = list.sort((a, b) => a.level - b.level)
      setData(sorted)
    } catch (err) {
      setError('Failed to load inactive users')
    }
    setLoading(false)
  }
  fetchData()
}, [periodFilter, roleFilter])

  const formatTime = (iso) => {
    if (!iso) return 'Never logged in'
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
  }

  // ── NEW: "Day" column value ──
  const formatDays = (days) => {
    if (days === null || days === undefined) return '—'
    if (days === 0) return 'Today'
    return `${days} day${days === 1 ? '' : 's'}`
  }

  const periodLabel = PERIOD_OPTIONS.find(p => p.value === periodFilter)?.label || 'Today'

  const filtered = data

const isAdminOnly = roleFilter === 'Admin'   // ── NEW
const hasMore = !isAdminOnly && data.length < totalCount   // ── CHANGED: Admin na Load More button vena vendam

const loadMore = async () => {
  setLoadingMore(true)
  try {
    const res = await api.get('/today-login-status/', {
      params: { period: periodFilter, role: roleFilter, offset, limit }
    })
    const newList = res.data.inactive || []
    setData(prev => [...prev, ...newList].sort((a, b) => a.level - b.level))
    setOffset(prev => prev + limit)
    setLimit(100)
  } catch (err) {
    setError('Failed to load more users')
  }
  setLoadingMore(false)
}

  return (
    <>
    <SuperAdminNavbar showSidebar={false} />
    <div className="ls-page inactive">
      <style>{`
        .ls-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 48%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:28px 20px}
        .ls-wrap{max-width:1280px;margin:0 auto}
        .ls-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap}
        .ls-kicker{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#BB8958;margin-bottom:6px}
        .ls-title{margin:0;font-size:26px;line-height:1.2;color:#C92035;font-weight:800}
        .ls-sub{color:#7A8987;font-size:13px;margin:6px 0 0;font-weight:500}
        .ls-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        .ls-select{height:38px;padding:0 12px;background:#FDFDFC;border:1px solid #BDCFCE;border-radius:8px;color:#0C4044;font-size:13px;font-weight:600;outline:none;transition:border-color .2s}
        .ls-select:focus{border-color:#C92035}
        .ls-btn{height:38px;padding:0 16px;border-radius:8px;border:none;background:#0C4044;color:#FDFDFC;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s}
        .ls-btn:hover{background:#073B3F}
        .ls-card{background:#FDFDFC;border:1px solid rgba(189,207,206,.72);border-radius:12px;box-shadow:0 4px 16px rgba(7,59,63,.06);overflow:hidden}
        .ls-summary{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(189,207,206,.5)}
        .ls-count{font-size:28px;line-height:1;font-weight:800;color:#C92035}
        .ls-label{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#7A8987;font-weight:700;margin-top:2px}
        .ls-status{display:inline-flex;align-items:center;gap:6px;background:rgba(201,32,53,.08);color:#C92035;border:1px solid rgba(201,32,53,.2);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:700}
        .ls-dot{width:8px;height:8px;border-radius:50%;background:#C92035}
        .ls-state{padding:48px 20px;text-align:center;color:#7A8987;font-size:14px;font-weight:600}
        .ls-error{margin-bottom:16px;background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.28);color:#C92035;border-radius:8px;padding:10px 14px;font-weight:600;font-size:13px}
        .ls-table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
        .ls-table{width:100%;min-width:900px;border-collapse:collapse;font-size:13px}
        .ls-table thead tr{background:#F3F3F0;border-bottom:2px solid #BDCFCE}
        .ls-table th{padding:12px 14px;text-align:left;color:#0C4044;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
        .ls-table td{padding:11px 14px;border-bottom:1px solid rgba(189,207,206,.35);color:#111817;font-size:13px}
        .ls-table tbody tr:hover{background:rgba(189,207,206,.15)}
        .ls-sno{color:#7A8987;font-weight:700;font-size:13px}
        .ls-role{font-weight:700;color:#0C4044}
        .ls-id{font-family:'SF Mono','Consolas',monospace;color:#C92035;font-weight:700;font-size:12px}
        .ls-muted{color:#7A8987!important}
        .ls-time{color:#C92035;font-weight:600}
        .ls-day{color:#C92035;font-weight:700}
        .skel-line{background:linear-gradient(90deg,#E7EDEC 25%,#F3F3F0 50%,#E7EDEC 75%);background-size:200% 100%;animation:ls-shimmer 1.4s infinite;border-radius:4px}
        @keyframes ls-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:720px){.ls-page{padding:16px 10px}.ls-head{align-items:stretch;flex-direction:column}.ls-actions{display:grid;grid-template-columns:1fr 1fr;width:100%}.ls-select,.ls-btn{width:100%}.ls-summary{flex-direction:column;align-items:flex-start;gap:10px}.ls-title{font-size:22px}.ls-count{font-size:24px}}
        @media(max-width:420px){.ls-actions{grid-template-columns:1fr}.ls-card{border-radius:8px}.ls-table{min-width:760px}}
      `}</style>
      <div className="ls-wrap">
        <header className="ls-head">
          <div>
            <div className="ls-kicker">Login Status</div>
            <h1 className="ls-title">Inactive Today</h1>
            {loading ? (
  <div className="skel-line" style={{ width: '180px', height: '13px', marginTop: 8 }} />
) : (
  <p className="ls-sub">{totalCount} users not logged in today{scopeLabel ? ` - ${scopeLabel}` : ''}</p>
)}
          </div>
          <div className="ls-actions">
            <select className="ls-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Levels</option>
              <option value="Admin">Admin</option>
              <option value="Dealer">Dealer</option>
              <option value="Sub Dealer">Sub Dealer</option>
              <option value="Promotor">Promotor</option>
              <option value="Customer">Customer</option>
            </select>

            {/* ── NEW: period dropdown ── */}
            <select className="ls-select" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}>
              {PERIOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button className="ls-btn" onClick={() => navigate(-1)}>Back</button>
          </div>
        </header>

        {error && <div className="ls-error">{error}</div>}

        <section className="ls-card">
          <div className="ls-summary">
  <div>
    {loading ? (
      <div className="skel-line" style={{ width: '60px', height: '34px', marginBottom: 4 }} />
    ) : (
      <div className="ls-count">{totalCount}</div>
    )}
    <div className="ls-label">Shown users</div>
  </div>
  <div className="ls-status"><span className="ls-dot" /> Inactive · {periodLabel}</div>
</div>
          {loading ? (
            // ── NEW: skeleton rows — table shape mattum, shimmer boxes ──
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>{['S.No', 'Level', 'Position', 'User ID', 'Name', 'Phone No', 'Last Inactive', 'Day'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}><div className="skel-line" style={{ width: j === 4 ? '80%' : '60%', height: '12px', marginBottom: 0 }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         ) : data.length === 0 ? (
            <div className="ls-state">
              {roleFilter === 'all' ? 'Everyone logged in today 🎉' : `All ${roleFilter.toLowerCase()} logged in today`}
            </div>
          ) : (
            <>
              <div className="ls-table-wrap">
                <table className="ls-table">
                  <thead>
                    <tr>{['S.No', 'Level', 'Position', 'User ID', 'Name', 'Phone No', 'Last Inactive', 'Day'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
  {filtered.map((u, i) => (
    <tr key={i}>
      <td><span className="ls-sno">{i + 1}</span></td>
      <td className="ls-muted">{u.level}</td>
      <td className="ls-role">{u.level_role}</td>
      <td className="ls-id">{u.id || '-'}</td>
      <td>{u.name || 'Unknown'}</td>
      <td className="ls-muted">{u.phone || '-'}</td>
      <td className="ls-time">{formatTime(u.last_login)}</td>
      <td className="ls-day">{formatDays(u.days_inactive)}</td>
    </tr>
  ))}
  {/* ── NEW: Load More click pannும் pothu, keezhe skeleton rows append aagும் ── */}
  {loadingMore && Array.from({ length: 5 }).map((_, i) => (
    <tr key={`skel-${i}`}>
       {Array.from({ length: 8 }).map((_, j) => (
        <td key={j}><div className="skel-line" style={{ width: j === 4 ? '80%' : '60%', height: '12px', marginBottom: 0 }} /></td>
      ))}
    </tr>
  ))}
</tbody>
                </table>
              </div>
              {/* ── NEW: Load More — 20 -> 50 -> 100 -> +100 ── */}
              {hasMore && !loadingMore && (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
    <button className="ls-btn" onClick={loadMore}>
      Load More ({data.length} of {totalCount})
    </button>
  </div>
)}
            </>
          )}
        </section>
      </div>
    </div>
    </>
  )
}