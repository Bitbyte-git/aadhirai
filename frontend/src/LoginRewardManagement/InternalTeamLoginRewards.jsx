import { useRef, useState, useEffect } from 'react'
import { SkeletonText } from '../components/Skeleton'

const PRIMARY = '#073B3F'
const DEEP = '#0C4044'
const ACCENT = '#3E7C82'
const DARK = '#111817'
const MUTED = '#7A8987'

const ROLE_LABELS = {
  admin: 'Super Stockist', dealer: 'Distributor', sub_dealer: 'Wholesale Dealer', promotor: 'Retailer',
}

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'Month' },
  { key: '6month', label: '6 Month' },
  { key: 'year', label: 'Year' },
  { key: 'custom', label: 'Custom' },
]

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  .lrt-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK};overflow-x:hidden}
  .lrt-main{width:min(1400px,calc(100% - 48px));margin:0 auto;padding:36px 0 90px;box-sizing:border-box}
  .lrt-kicker{margin:0 0 6px;color:${ACCENT};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .lrt-title{margin:0 0 8px;color:${PRIMARY};font-family:"Playfair Display",serif;font-size:clamp(24px,4vw,36px)}
  .lrt-note{color:${MUTED};font-size:12.5px;margin:0 0 4px;max-width:760px;line-height:1.6}
  .lrt-headrow{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
  .lrt-download-btn{display:flex;align-items:center;gap:8px;height:40px;padding:0 20px;border-radius:20px;border:1.5px solid ${PRIMARY};background:#fff;color:${PRIMARY};font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap;flex-shrink:0}
  .lrt-download-btn:hover{background:${PRIMARY};color:#fff}
  .lrt-download-btn:disabled{opacity:.55;cursor:not-allowed}
  .lrt-filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:24px}
  .lrt-filter-tab{padding:9px 18px;border-radius:20px;border:1.5px solid #D1DFDE;background:#fff;color:${DARK};font-weight:800;font-size:12px;cursor:pointer;transition:.15s ease;white-space:nowrap;flex-shrink:0}
  .lrt-filter-tab.active{border-color:${ACCENT};background:${ACCENT};color:#fff}
  .lrt-custom-date{padding:8px 12px;border-radius:8px;border:1.5px solid #D1DFDE;font-size:12px;font-weight:700;color:${DARK};height:38px;box-sizing:border-box}
  .lrt-date-to{color:${MUTED};font-weight:800;font-size:12px}
  .lrt-apply-btn{height:38px;padding:0 18px;border-radius:20px;border:none;background:${ACCENT};color:#fff;font-weight:900;font-size:12px;cursor:pointer;white-space:nowrap}
  .lrt-apply-btn:hover{background:${DEEP}}
  .lrt-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px}
  .lrt-card{border:1px solid rgba(189,207,206,.8);border-radius:14px;background:#fff;padding:20px;box-shadow:0 12px 30px rgba(12,64,68,.06);box-sizing:border-box}
  .lrt-card-label{font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:${MUTED};margin-bottom:8px}
  .lrt-card-value{font-family:"Playfair Display",serif;font-size:23px;color:${PRIMARY};font-weight:700}
  .lrt-card.hero{background:linear-gradient(135deg,${PRIMARY},${DEEP});border:none}
  .lrt-card.hero .lrt-card-label{color:rgba(255,255,255,.8)}
  .lrt-card.hero .lrt-card-value{color:#fff}
  .lrt-panel{border:1px solid rgba(189,207,206,.8);border-radius:16px;background:#fff;padding:24px;margin-bottom:22px;box-shadow:0 12px 30px rgba(12,64,68,.06);box-sizing:border-box}
  .lrt-panel-title{margin:0 0 20px;font-size:15px;font-weight:900;color:${PRIMARY}}
  .lrt-tx-head{display:grid;grid-template-columns:110px 1.4fr 1fr 1fr 90px 110px;gap:0;padding:12px 8px;border-bottom:1px solid rgba(189,207,206,.72)}
  .lrt-tx-head span{font-size:10px;font-weight:800;color:${MUTED};letter-spacing:.8px;text-transform:uppercase}
  .lrt-tx-row{display:grid;grid-template-columns:110px 1.4fr 1fr 1fr 90px 110px;gap:0;align-items:center;padding:13px 8px;border-bottom:1px solid rgba(189,207,206,.4)}
  .lrt-tx-row:last-child{border-bottom:none}
  .lrt-tx-role{font-size:11px;font-weight:800;color:${ACCENT};background:rgba(62,124,130,.1);padding:3px 9px;border-radius:8px;display:inline-block}
  .lrt-tx-name{display:flex;align-items:center;gap:10px;min-width:0}
  .lrt-tx-avatar{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,${PRIMARY},${ACCENT});color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0}
  .lrt-tx-fullname{font-size:13px;font-weight:700;color:${DARK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .lrt-tx-id{font-size:10.5px;font-family:monospace;font-weight:700;color:${ACCENT};margin-top:1px}
  .lrt-tx-phone{font-size:12px;color:${DARK};font-weight:600}
  .lrt-tx-label{font-size:12px;color:${DARK};font-weight:700}
  .lrt-tx-label.manual_credit{color:#9333ea}
  .lrt-tx-date{font-size:11.5px;color:${MUTED};font-weight:600}
  .lrt-tx-coins{font-size:14px;font-weight:900;color:#16764F;background:rgba(22,118,79,.08);padding:4px 12px;border-radius:10px;display:inline-block}
  .lrt-loadmore{width:100%;margin-top:14px;padding:12px;border-radius:8px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${PRIMARY};font-weight:800;font-size:13px;cursor:pointer}
  .lrt-loadmore:hover{border-color:${PRIMARY};background:rgba(7,59,63,.04)}
  .lrt-loadmore:disabled{opacity:.6;cursor:not-allowed}
  .lrt-empty{color:${MUTED};font-size:13px;text-align:center;padding:24px 0}
  .lrt-error{display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px 20px;color:${MUTED};text-align:center}
  .lrt-error-title{color:${PRIMARY};font-weight:900;font-size:15px}
  .lrt-retry-btn{padding:10px 22px;border-radius:20px;border:none;background:${PRIMARY};color:#fff;font-weight:800;font-size:12.5px;cursor:pointer}
  @media(max-width:768px){
    .lrt-main{width:100%!important;padding:20px 14px 60px!important}
    .lrt-headrow{flex-direction:column!important;align-items:stretch!important}
    .lrt-download-btn{width:100%!important;justify-content:center!important}
    .lrt-filter-row{overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;flex-wrap:nowrap!important;padding-bottom:8px!important}
    .lrt-panel{padding:18px 14px!important;border-radius:14px!important}
    .lrt-cards{grid-template-columns:1fr!important}
    .lrt-tx-head,.lrt-tx-row{grid-template-columns:70px 1.3fr 90px!important}
    .lrt-tx-head span:nth-child(3),.lrt-tx-head span:nth-child(4),.lrt-tx-row .lrt-tx-phone-col,.lrt-tx-row .lrt-tx-date-col{display:none!important}
  }
`

export default function InternalTeamLoginRewards() {
  const role = localStorage.getItem('role')
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
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(false)

  const fetchIdRef = useRef(0)

  const fetchData = async (p = 1, period = activeFilter, from = customFrom, to = customTo) => {
    const fetchId = ++fetchIdRef.current
    try {
      const { default: api } = await import('../api')
      let url = `/login-reward-transactions/?scope=team&page=${p}&period=${period}`
      if (period === 'custom' && from && to) url += `&start_date=${from}&end_date=${to}`
      const res = await api.get(url)
      if (fetchId !== fetchIdRef.current) return
      setSummary({
        total_coins: res.data.total_coins,
        reward_coins: res.data.reward_coins,
        manual_coins: res.data.manual_coins,
        total_transactions: res.data.total_transactions,
        total_recipients: res.data.total_recipients,
      })
      setRows(prev => p === 1 ? res.data.transactions : [...prev, ...res.data.transactions])
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

  useEffect(() => { fetchData(1, 'today', '', '') }, [])

  const handleFilterClick = key => {
    setActiveFilter(key)
    if (key !== 'custom') {
      setLoading(true)
      fetchData(1, key, '', '')
    } else if (customFrom && customTo) {
      setLoading(true)
      fetchData(1, 'custom', customFrom, customTo)
    }
  }

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    setLoading(true)
    fetchData(1, 'custom', customFrom, customTo)
  }

  const loadMore = () => {
    setLoadingMore(true)
    fetchData(page + 1, activeFilter, customFrom, customTo)
  }

  const retry = () => {
    setLoading(true)
    fetchData(1, activeFilter, customFrom, customTo)
  }

  const downloadReport = async () => {
    setDownloading(true)
    setDownloadError(false)
    try {
      const { default: api } = await import('../api')
      let url = `/login-reward-transactions/?scope=team&period=${activeFilter}&export=csv`
      if (activeFilter === 'custom' && customFrom && customTo) url += `&start_date=${customFrom}&end_date=${customTo}`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `team-login-rewards-${activeFilter}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      setDownloadError(true)
      setTimeout(() => setDownloadError(false), 4000)
    }
    setDownloading(false)
  }

  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="lrt-page">
      <style>{styles}</style>
      <main className="lrt-main">
        <div className="lrt-headrow">
          <div>
            <p className="lrt-kicker">{ROLE_LABELS[role] || 'My Team'}</p>
            <h1 className="lrt-title">Team Login Rewards</h1>
            <p className="lrt-note">Daily &amp; streak login-reward AUG Coins, plus manually sent coins, for your entire downline team — combined into one ledger.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button className="lrt-download-btn" onClick={downloadReport} disabled={downloading || loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              {downloading ? 'Preparing...' : 'Download Report'}
            </button>
            {downloadError && <span style={{ fontSize: 11, color: '#C92035', fontWeight: 700 }}>Download failed — try again</span>}
          </div>
        </div>

        <div className="lrt-filter-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              className={`lrt-filter-tab ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => handleFilterClick(f.key)}
            >
              {f.label}
            </button>
          ))}
          {activeFilter === 'custom' && (
            <>
              <input type="date" className="lrt-custom-date" value={customFrom}
                max={customTo || new Date().toISOString().split('T')[0]}
                onChange={e => setCustomFrom(e.target.value)} />
              <span className="lrt-date-to">to</span>
              <input type="date" className="lrt-custom-date" value={customTo}
                min={customFrom} max={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomTo(e.target.value)} />
              <button className="lrt-apply-btn" onClick={applyCustomRange}>Apply</button>
            </>
          )}
        </div>

        {loading ? (
          <>
            <div className="lrt-cards">
              {[0, 1].map(i => (
                <div className="lrt-card" key={i} style={{ borderStyle: 'dashed' }}>
                  <SkeletonText width="60%" height="10px" />
                  <div style={{ marginTop: 10 }}><SkeletonText width="80%" height="20px" /></div>
                </div>
              ))}
            </div>
            <section className="lrt-panel">
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
          <div className="lrt-error">
            <div className="lrt-error-title">Could not load this data</div>
            <div>Backend mella wake ahalam (Render cold-start) illa network issue irukalam — retry pண்ணுங்கள்.</div>
            <button className="lrt-retry-btn" onClick={retry}>Retry</button>
          </div>
        ) : (
          <>
            <div className="lrt-cards">
              <div className="lrt-card hero">
                <div className="lrt-card-label">Total Coins Given</div>
                <div className="lrt-card-value">{(summary.total_coins || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="lrt-card">
                <div className="lrt-card-label">Login Reward Coins</div>
                <div className="lrt-card-value">{(summary.reward_coins || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <section className="lrt-panel">
              <h3 className="lrt-panel-title">Team Transactions {activeFilter !== 'custom' ? `— ${FILTERS.find(f => f.key === activeFilter)?.label}` : ''} ({summary.total_transactions})</h3>
              {rows.length === 0 ? (
                <div className="lrt-empty">No coin transactions in this selection</div>
              ) : (
                <>
                  <div className="lrt-tx-head">
                    <span>Role</span>
                    <span>Name &amp; ID</span>
                    <span>Phone</span>
                    <span>Type</span>
                    <span>Date</span>
                    <span>Coins</span>
                  </div>
                  {rows.map((r, i) => {
                    const initials = (r.name || '?').split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                    return (
                      <div key={i} className="lrt-tx-row">
                        <div><span className="lrt-tx-role">{r.role_label}</span></div>
                        <div className="lrt-tx-name">
                          <div className="lrt-tx-avatar">{initials}</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="lrt-tx-fullname">{r.name}</div>
                            <div className="lrt-tx-id">{r.user_id || '—'}</div>
                          </div>
                        </div>
                        <div className="lrt-tx-phone-col"><span className="lrt-tx-phone">{r.phone || '—'}</span></div>
                        <div><span className={`lrt-tx-label ${r.kind}`}>{r.label}</span></div>
                        <div className="lrt-tx-date-col"><span className="lrt-tx-date">{fmtDate(r.date)}</span></div>
                        <div><span className="lrt-tx-coins">+{r.coins}</span></div>
                      </div>
                    )
                  })}
                </>
              )}
              {hasMore && (
                <button className="lrt-loadmore" onClick={loadMore} disabled={loadingMore}>
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
