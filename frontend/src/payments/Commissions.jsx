import { useEffect, useRef, useState } from 'react'
import { SkeletonText } from '../components/Skeleton'

const PRIMARY = '#073B3F'
const DEEP = '#0C4044'
const ACCENT = '#3E7C82'
const DARK = '#111817'
const MUTED = '#7A8987'

const ROLE_TABS = [
  { key: 'admin', label: 'Super Stockist', idKey: 'admin_id' },
  { key: 'dealer', label: 'Distributor', idKey: 'dealer_id' },
  { key: 'sub_dealer', label: 'Wholesale Dealer', idKey: 'sub_dealer_id' },
  { key: 'promotor', label: 'Retailer', idKey: 'promotor_id' },
  { key: 'customer', label: 'Customer', idKey: 'customer_id' },
]

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'custom', label: 'Custom' },
]

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  .cms-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK};overflow-x:hidden}
  .cms-main{width:min(1300px,calc(100% - 48px));margin:0 auto;padding:36px 0 90px;box-sizing:border-box}
  .cms-kicker{margin:0 0 6px;color:${ACCENT};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .cms-title{margin:0 0 8px;color:${PRIMARY};font-family:"Playfair Display",serif;font-size:clamp(24px,4vw,36px)}
  .cms-note{color:${MUTED};font-size:12.5px;margin:0 0 4px;max-width:760px;line-height:1.6}
  .cms-headrow{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
  .cms-download-btn{display:flex;align-items:center;gap:8px;height:40px;padding:0 20px;border-radius:20px;border:1.5px solid ${PRIMARY};background:#fff;color:${PRIMARY};font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap;flex-shrink:0}
  .cms-download-btn:hover{background:${PRIMARY};color:#fff}
  .cms-download-btn:disabled{opacity:.55;cursor:not-allowed}
  .cms-lb-row{cursor:pointer}
  .cms-lb-row:hover{background:rgba(189,207,206,.14)}
  .cms-history{background:rgba(7,59,63,.03);border-top:1px dashed rgba(189,207,206,.72);border-bottom:1px solid rgba(189,207,206,.4);padding:14px 16px 16px 46px}
  .cms-history-title{font-size:11px;font-weight:800;color:${MUTED};text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px}
  .cms-history-row{display:flex;align-items:center;gap:14px;padding:9px 0;border-bottom:1px solid rgba(189,207,206,.35)}
  .cms-history-row:last-child{border-bottom:none}
  .cms-history-order{font-family:monospace;font-weight:800;font-size:12px;color:${DARK}}
  .cms-history-buyer{font-size:11px;color:${MUTED};margin-top:2px}
  .cms-history-level{font-size:9.5px;font-weight:800;color:${ACCENT};background:rgba(62,124,130,.12);padding:2px 8px;border-radius:10px;margin-left:auto;white-space:nowrap}
  .cms-history-amount{font-size:13px;font-weight:900;color:${PRIMARY};width:110px;text-align:right;flex-shrink:0}
  .cms-history-date{font-size:10.5px;color:${MUTED};width:130px;text-align:right;flex-shrink:0}
  .cms-history-loadmore{margin-top:10px;padding:8px 16px;border-radius:16px;border:1.5px solid #D1DFDE;background:#fff;color:${PRIMARY};font-weight:800;font-size:11.5px;cursor:pointer}
  .cms-role-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
  .cms-role-tab{padding:11px 20px;border-radius:12px;border:1.5px solid #D1DFDE;background:#fff;color:${DARK};font-weight:800;font-size:12.5px;cursor:pointer;transition:.15s ease;white-space:nowrap}
  .cms-role-tab.active{border-color:${PRIMARY};background:linear-gradient(135deg,${PRIMARY},${DEEP});color:#fff;box-shadow:0 10px 24px rgba(7,59,63,.22)}
  .cms-filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:24px}
  .cms-filter-tab{padding:9px 18px;border-radius:20px;border:1.5px solid #D1DFDE;background:#fff;color:${DARK};font-weight:800;font-size:12px;cursor:pointer;transition:.15s ease;white-space:nowrap;flex-shrink:0}
  .cms-filter-tab.active{border-color:${ACCENT};background:${ACCENT};color:#fff}
  .cms-custom-date{padding:8px 12px;border-radius:8px;border:1.5px solid #D1DFDE;font-size:12px;font-weight:700;color:${DARK};height:38px;box-sizing:border-box}
  .cms-date-to{color:${MUTED};font-weight:800;font-size:12px}
  .cms-apply-btn{height:38px;padding:0 18px;border-radius:20px;border:none;background:${ACCENT};color:#fff;font-weight:900;font-size:12px;cursor:pointer;white-space:nowrap}
  .cms-apply-btn:hover{background:${DEEP}}
  .cms-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
  .cms-card{border:1px solid rgba(189,207,206,.8);border-radius:14px;background:#fff;padding:20px;box-shadow:0 12px 30px rgba(12,64,68,.06);box-sizing:border-box}
  .cms-card-label{font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:${MUTED};margin-bottom:8px}
  .cms-card-value{font-family:"Playfair Display",serif;font-size:23px;color:${PRIMARY};font-weight:700}
  .cms-card.hero{background:linear-gradient(135deg,${PRIMARY},${DEEP});border:none}
  .cms-card.hero .cms-card-label{color:rgba(255,255,255,.8)}
  .cms-card.hero .cms-card-value{color:#fff}
  .cms-panel{border:1px solid rgba(189,207,206,.8);border-radius:16px;background:#fff;padding:24px;margin-bottom:22px;box-shadow:0 12px 30px rgba(12,64,68,.06);box-sizing:border-box}
  .cms-panel-title{margin:0 0 20px;font-size:15px;font-weight:900;color:${PRIMARY}}
  .cms-chart-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;padding-bottom:6px}
  .cms-chart{display:flex;align-items:flex-end;gap:14px;height:200px;padding:0 6px;min-width:320px}
  .cms-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
  .cms-bar{width:100%;max-width:52px;background:linear-gradient(180deg,${ACCENT},${PRIMARY});border-radius:6px 6px 0 0;transition:height .4s ease}
  .cms-bar-value{font-size:10.5px;font-weight:800;color:${PRIMARY};margin-bottom:6px}
  .cms-bar-label{font-size:10.5px;font-weight:700;color:${MUTED};margin-top:8px}
  .cms-lb-head{display:grid;grid-template-columns:44px 1.6fr 1fr 100px 140px;gap:0;padding:12px 8px;border-bottom:1px solid rgba(189,207,206,.72)}
  .cms-lb-head span{font-size:10px;font-weight:800;color:${MUTED};letter-spacing:.8px;text-transform:uppercase}
  .cms-lb-row{display:grid;grid-template-columns:44px 1.6fr 1fr 100px 140px;gap:0;align-items:center;padding:13px 8px;border-bottom:1px solid rgba(189,207,206,.4)}
  .cms-lb-row:last-child{border-bottom:none}
  .cms-lb-rank{font-size:12.5px;font-weight:800;color:${MUTED}}
  .cms-lb-rank.top{color:${PRIMARY}}
  .cms-lb-name{display:flex;align-items:center;gap:10px;min-width:0}
  .cms-lb-avatar{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,${PRIMARY},${ACCENT});color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0}
  .cms-lb-namecol{min-width:0}
  .cms-lb-fullname{font-size:13px;font-weight:700;color:${DARK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cms-lb-id{font-size:10.5px;font-family:monospace;font-weight:700;color:${ACCENT};margin-top:1px}
  .cms-lb-city{font-size:12px;color:${DARK};font-weight:600}
  .cms-lb-phone{font-size:10.5px;color:${MUTED};margin-top:1px}
  .cms-lb-txns{font-size:12.5px;color:${MUTED};font-weight:700}
  .cms-lb-amount{font-size:14.5px;font-weight:900;color:${PRIMARY};background:rgba(7,59,63,.06);padding:4px 12px;border-radius:10px;display:inline-block}
  .cms-loadmore{width:100%;margin-top:14px;padding:12px;border-radius:8px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${PRIMARY};font-weight:800;font-size:13px;cursor:pointer}
  .cms-loadmore:hover{border-color:${PRIMARY};background:rgba(7,59,63,.04)}
  .cms-loadmore:disabled{opacity:.6;cursor:not-allowed}
  .cms-empty{color:${MUTED};font-size:13px;text-align:center;padding:24px 0}
  .cms-error{display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px 20px;color:${MUTED};text-align:center}
  .cms-error-title{color:${PRIMARY};font-weight:900;font-size:15px}
  .cms-retry-btn{padding:10px 22px;border-radius:20px;border:none;background:${PRIMARY};color:#fff;font-weight:800;font-size:12.5px;cursor:pointer}
  @media(max-width:900px){.cms-cards{grid-template-columns:1fr 1fr}}
  @media(max-width:768px){
    .cms-main{width:100%!important;padding:20px 14px 60px!important}
    .cms-headrow{flex-direction:column!important;align-items:stretch!important}
    .cms-download-btn{width:100%!important;justify-content:center!important}
    .cms-role-row,.cms-filter-row{overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;flex-wrap:nowrap!important;padding-bottom:8px!important}
    .cms-panel{padding:18px 14px!important;border-radius:14px!important}
    .cms-cards{grid-template-columns:1fr!important}
    .cms-lb-head,.cms-lb-row{grid-template-columns:32px 1.4fr 90px!important}
    .cms-lb-head span:nth-child(3),.cms-lb-row .cms-lb-city-col{display:none!important}
    .cms-history{padding:12px 12px 14px 24px!important}
    .cms-history-row{flex-wrap:wrap!important}
    .cms-history-date{width:auto!important;text-align:left!important}
  }
`

export default function Commissions() {
  const [role, setRole] = useState('admin')
  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeFilter, setActiveFilter] = useState('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const [expandedUserId, setExpandedUserId] = useState(null)
  const [historyByUser, setHistoryByUser] = useState({})
  const [historyLoading, setHistoryLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const fetchIdRef = useRef(0)

  const fetchData = async (r = role, p = 1, period = activeFilter, from = customFrom, to = customTo) => {
    const fetchId = ++fetchIdRef.current
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/tier-commission/?role=${r}&page=${p}&period=${period}`
      if (period === 'custom' && from && to) url += `&start_date=${from}&end_date=${to}`
      const res = await api.get(url)
      if (fetchId !== fetchIdRef.current) return
      setSummary({
        total_commission: res.data.total_commission,
        total_coins: res.data.total_coins,
        total_transactions: res.data.total_transactions,
        total_earners: res.data.total_earners,
        monthly_trend: res.data.monthly_trend,
      })
      setRows(prev => p === 1 ? res.data.leaderboard : [...prev, ...res.data.leaderboard])
      setHasMore(res.data.has_more)
      setPage(p)
      setLoadError(false)
    } catch {
      if (fetchId !== fetchIdRef.current) return
      setLoadError(true)
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => { fetchData('admin', 1, 'today', '', '') }, [])

  const handleRoleClick = key => {
    if (key === role) return
    setRole(key)
    setLoading(true)
    setExpandedUserId(null)
    setHistoryByUser({})
    fetchData(key, 1, activeFilter, customFrom, customTo)
  }

  const handleFilterClick = key => {
    setActiveFilter(key)
    setExpandedUserId(null)
    setHistoryByUser({})
    if (key !== 'custom') {
      setLoading(true)
      fetchData(role, 1, key, '', '')
    } else if (customFrom && customTo) {
      setLoading(true)
      fetchData(role, 1, 'custom', customFrom, customTo)
    }
  }

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    setLoading(true)
    setExpandedUserId(null)
    setHistoryByUser({})
    fetchData(role, 1, 'custom', customFrom, customTo)
  }

  const loadMore = () => {
    setLoadingMore(true)
    fetchData(role, page + 1, activeFilter, customFrom, customTo)
  }

  const retry = () => {
    setLoading(true)
    fetchData(role, 1, activeFilter, customFrom, customTo)
  }

  const fetchHistory = async (userId, p = 1) => {
    setHistoryLoading(true)
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/tier-commission/?role=${role}&user_id=${userId}&page=${p}&period=${activeFilter}`
      if (activeFilter === 'custom' && customFrom && customTo) url += `&start_date=${customFrom}&end_date=${customTo}`
      const res = await api.get(url)
      setHistoryByUser(prev => ({
        ...prev,
        [userId]: {
          transactions: p === 1 ? res.data.transactions : [...(prev[userId]?.transactions || []), ...res.data.transactions],
          hasMore: res.data.has_more,
          page: p,
        },
      }))
    } catch {
      setHistoryByUser(prev => ({ ...prev, [userId]: { transactions: [], hasMore: false, page: 1, error: true } }))
    }
    setHistoryLoading(false)
  }

  const toggleHistory = userId => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      return
    }
    setExpandedUserId(userId)
    if (!historyByUser[userId]) fetchHistory(userId, 1)
  }

  const downloadReport = async () => {
    setDownloading(true)
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/tier-commission/?role=${role}&period=${activeFilter}&format=csv`
      if (activeFilter === 'custom' && customFrom && customTo) url += `&start_date=${customFrom}&end_date=${customTo}`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${role}-commission-leaderboard.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      // silent — user can retry the click
    }
    setDownloading(false)
  }

  const inr = n => `Rs. ${Math.round(n || 0).toLocaleString('en-IN')}`
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const activeTab = ROLE_TABS.find(t => t.key === role)
  const trend = summary?.monthly_trend || []
  const maxRevenue = Math.max(...trend.map(t => t.revenue), 1)

  return (
    <div className="cms-page">
      <style>{styles}</style>
      <main className="cms-main">
        <div className="cms-headrow">
          <div>
            <p className="cms-kicker">Super Admin</p>
            <h1 className="cms-title">Commissions</h1>
            <p className="cms-note">Every tier's commission earnings, broken down by who actually earned it — pick a tier below, then click a row to see that person's own commission history.</p>
          </div>
          <button className="cms-download-btn" onClick={downloadReport} disabled={downloading || loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {downloading ? 'Preparing...' : 'Download Report'}
          </button>
        </div>

        <div className="cms-role-row">
          {ROLE_TABS.map(t => (
            <button
              key={t.key}
              type="button"
              className={`cms-role-tab ${role === t.key ? 'active' : ''}`}
              onClick={() => handleRoleClick(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="cms-filter-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              className={`cms-filter-tab ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => handleFilterClick(f.key)}
            >
              {f.label}
            </button>
          ))}
          {activeFilter === 'custom' && (
            <>
              <input type="date" className="cms-custom-date" value={customFrom}
                max={customTo || new Date().toISOString().split('T')[0]}
                onChange={e => setCustomFrom(e.target.value)} />
              <span className="cms-date-to">to</span>
              <input type="date" className="cms-custom-date" value={customTo}
                min={customFrom} max={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomTo(e.target.value)} />
              <button className="cms-apply-btn" onClick={applyCustomRange}>Apply</button>
            </>
          )}
        </div>

        {loading ? (
          <>
            <div className="cms-cards">
              {[0, 1, 2, 3].map(i => (
                <div className="cms-card" key={i} style={{ borderStyle: 'dashed' }}>
                  <SkeletonText width="60%" height="10px" />
                  <div style={{ marginTop: 10 }}><SkeletonText width="80%" height="20px" /></div>
                </div>
              ))}
            </div>
            <section className="cms-panel">
              <SkeletonText width="220px" height="14px" />
              <div className="cms-chart-wrap">
                <div className="cms-chart" style={{ marginTop: 20 }}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div className="cms-bar-col" key={i}>
                      <SkeletonText width="70%" height="10px" />
                      <div className="skel-line" style={{ width: '100%', maxWidth: 52, height: `${40 + (i % 3) * 30}px`, borderRadius: '6px 6px 0 0', marginTop: 6, marginBottom: 6 }} />
                      <SkeletonText width="60%" height="10px" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="cms-panel">
              <SkeletonText width="260px" height="14px" />
              <div style={{ marginTop: 18 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '13px 4px', borderBottom: '1px solid rgba(189,207,206,.4)' }}>
                    <SkeletonText width="34px" height="34px" />
                    <div style={{ flex: 1 }}>
                      <SkeletonText width="140px" height="12px" />
                      <div style={{ marginTop: 6 }}><SkeletonText width="100px" height="10px" /></div>
                    </div>
                    <SkeletonText width="70px" height="20px" />
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : loadError && !summary ? (
          <div className="cms-error">
            <div className="cms-error-title">Could not load this data</div>
            <div>Backend mella wake ahalam (Render cold-start) illa network issue irukalam — retry pண்ணुங்கள்.</div>
            <button className="cms-retry-btn" onClick={retry}>Retry</button>
          </div>
        ) : (
          <>
            <div className="cms-cards">
              <div className="cms-card hero">
                <div className="cms-card-label">Total {activeTab.label} Commission</div>
                <div className="cms-card-value">{inr(summary.total_commission)}</div>
              </div>
              <div className="cms-card">
                <div className="cms-card-label">Coins Credited</div>
                <div className="cms-card-value">{(summary.total_coins || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="cms-card">
                <div className="cms-card-label">Earners</div>
                <div className="cms-card-value">{summary.total_earners}</div>
              </div>
              <div className="cms-card">
                <div className="cms-card-label">Transactions</div>
                <div className="cms-card-value">{summary.total_transactions}</div>
              </div>
            </div>

            <section className="cms-panel">
              <h3 className="cms-panel-title">{activeTab.label} — Monthly Trend (last 6 months)</h3>
              {trend.length === 0 ? (
                <div className="cms-empty">No commission data yet</div>
              ) : (
                <div className="cms-chart-wrap">
                  <div className="cms-chart">
                    {trend.map(t => (
                      <div className="cms-bar-col" key={t.month}>
                        <div className="cms-bar-value">{inr(t.revenue)}</div>
                        <div className="cms-bar" style={{ height: `${Math.max((t.revenue / maxRevenue) * 100, 4)}%` }} />
                        <div className="cms-bar-label">{t.month}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="cms-panel">
              <h3 className="cms-panel-title">{activeTab.label} Leaderboard {activeFilter !== 'custom' ? `— ${FILTERS.find(f => f.key === activeFilter)?.label}` : ''}</h3>
              {rows.length === 0 ? (
                <div className="cms-empty">No {activeTab.label.toLowerCase()} has earned commission in this period</div>
              ) : (
                <>
                  <div className="cms-lb-head">
                    <span>#</span>
                    <span>Name &amp; ID</span>
                    <span className="cms-lb-city-col">City &amp; Phone</span>
                    <span>Txns</span>
                    <span>Commission</span>
                  </div>
                  {rows.map((r, i) => {
                    const initials = `${(r.first_name || activeTab.label)[0] || ''}${(r.last_name || '')[0] || ''}`.toUpperCase()
                    const isOpen = expandedUserId === r.user_id
                    const hist = historyByUser[r.user_id]
                    return (
                      <div key={`${r.user_id}-${i}`}>
                        <div className="cms-lb-row" onClick={() => toggleHistory(r.user_id)}>
                          <div className={`cms-lb-rank ${i < 3 ? 'top' : ''}`}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</div>
                          <div className="cms-lb-name">
                            <div className="cms-lb-avatar">{initials}</div>
                            <div className="cms-lb-namecol">
                              <div className="cms-lb-fullname">{r.first_name} {r.last_name}</div>
                              <div className="cms-lb-id">{r[activeTab.idKey]}</div>
                            </div>
                          </div>
                          <div className="cms-lb-city-col">
                            <div className="cms-lb-city">{r.city_name || '—'}</div>
                            <div className="cms-lb-phone">{r.mobile_number || '—'}</div>
                          </div>
                          <div className="cms-lb-txns">{r.txn_count}</div>
                          <div><span className="cms-lb-amount">{inr(r.total_commission)}</span></div>
                        </div>
                        {isOpen && (
                          <div className="cms-history">
                            <div className="cms-history-title">{r.first_name}'s Commission History</div>
                            {historyLoading && !hist ? (
                              <SkeletonText width="220px" height="12px" />
                            ) : hist?.error ? (
                              <div className="cms-empty">Could not load history — click the row to retry.</div>
                            ) : !hist || hist.transactions.length === 0 ? (
                              <div className="cms-empty">No individual commission entries found.</div>
                            ) : (
                              <>
                                {hist.transactions.map((t, ti) => (
                                  <div className="cms-history-row" key={ti}>
                                    <div>
                                      <div className="cms-history-order">{t.order_id}</div>
                                      <div className="cms-history-buyer">from {t.buyer}</div>
                                    </div>
                                    <span className="cms-history-level">Level {t.level}</span>
                                    <div className="cms-history-amount">{inr(t.amount)}</div>
                                    <div className="cms-history-date">{fmtDate(t.created_at)}</div>
                                  </div>
                                ))}
                                {hist.hasMore && (
                                  <button className="cms-history-loadmore" onClick={() => fetchHistory(r.user_id, hist.page + 1)} disabled={historyLoading}>
                                    {historyLoading ? 'Loading...' : 'Load More'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              )}
              {hasMore && (
                <button className="cms-loadmore" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
