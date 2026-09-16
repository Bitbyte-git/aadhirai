import { useEffect, useRef, useState } from 'react'
import { SkeletonText } from '../components/Skeleton'

const PRIMARY = '#073B3F'
const DEEP = '#0C4044'
const ACCENT = '#3E7C82'
const DARK = '#111817'
const MUTED = '#7A8987'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  .pgb-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK};overflow-x:hidden}
  .pgb-main{width:min(1300px,calc(100% - 48px));margin:0 auto;padding:36px 0 90px;box-sizing:border-box}
  .pgb-kicker{margin:0 0 6px;color:${ACCENT};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .pgb-title{margin:0 0 8px;color:${PRIMARY};font-family:"Playfair Display",serif;font-size:clamp(24px,4vw,36px)}
  .pgb-note{color:${MUTED};font-size:12.5px;margin:0 0 4px;max-width:760px;line-height:1.6}
  .pgb-headrow{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
  .pgb-download-btn{display:flex;align-items:center;gap:8px;height:40px;padding:0 20px;border-radius:20px;border:1.5px solid ${PRIMARY};background:#fff;color:${PRIMARY};font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap;flex-shrink:0}
  .pgb-download-btn:hover{background:${PRIMARY};color:#fff}
  .pgb-download-btn:disabled{opacity:.55;cursor:not-allowed}
  .pgb-breakdown{display:flex;flex-direction:column;gap:10px}
  .pgb-breakdown-row{display:flex;align-items:center;gap:12px}
  .pgb-breakdown-label{width:110px;flex-shrink:0;font-size:12px;font-weight:700;color:${DARK};text-transform:capitalize}
  .pgb-breakdown-track{flex:1;height:10px;border-radius:6px;background:rgba(189,207,206,.35);overflow:hidden}
  .pgb-breakdown-fill{height:100%;border-radius:6px;background:linear-gradient(90deg,${ACCENT},${PRIMARY})}
  .pgb-breakdown-value{width:150px;flex-shrink:0;text-align:right;font-size:12px;font-weight:800;color:${PRIMARY}}
  .pgb-filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:24px}
  .pgb-filter-tab{padding:9px 18px;border-radius:20px;border:1.5px solid #D1DFDE;background:#fff;color:${DARK};font-weight:800;font-size:12px;cursor:pointer;transition:.15s ease;white-space:nowrap;flex-shrink:0}
  .pgb-filter-tab.active{border-color:${PRIMARY};background:${PRIMARY};color:#fff}
  .pgb-custom-date{padding:8px 12px;border-radius:8px;border:1.5px solid #D1DFDE;font-size:12px;font-weight:700;color:${DARK};height:38px;box-sizing:border-box}
  .pgb-date-to{color:${MUTED};font-weight:800;font-size:12px}
  .pgb-apply-btn{height:38px;padding:0 18px;border-radius:20px;border:none;background:${ACCENT};color:#fff;font-weight:900;font-size:12px;cursor:pointer;white-space:nowrap}
  .pgb-apply-btn:hover{background:${DEEP}}
  .pgb-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
  .pgb-card{border:1px solid rgba(189,207,206,.8);border-radius:14px;background:#fff;padding:20px;box-shadow:0 12px 30px rgba(12,64,68,.06);box-sizing:border-box}
  .pgb-card-label{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:${MUTED};margin-bottom:8px}
  .pgb-card-value{font-family:"Playfair Display",serif;font-size:26px;color:${PRIMARY};font-weight:700}
  .pgb-card.hero{background:linear-gradient(135deg,${PRIMARY},${DEEP});border:none}
  .pgb-card.hero .pgb-card-label{color:rgba(255,255,255,.8)}
  .pgb-card.hero .pgb-card-value{color:#fff}
  .pgb-panel{border:1px solid rgba(189,207,206,.8);border-radius:16px;background:#fff;padding:24px;margin-bottom:22px;box-shadow:0 12px 30px rgba(12,64,68,.06);box-sizing:border-box}
  .pgb-panel-title{margin:0 0 20px;font-size:15px;font-weight:900;color:${PRIMARY}}
  .pgb-chart-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;padding-bottom:6px}
  .pgb-chart{display:flex;align-items:flex-end;gap:14px;height:200px;padding:0 6px;min-width:320px}
  .pgb-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
  .pgb-bar{width:100%;max-width:52px;background:linear-gradient(180deg,${ACCENT},${PRIMARY});border-radius:6px 6px 0 0;transition:height .4s ease}
  .pgb-bar-value{font-size:10.5px;font-weight:800;color:${PRIMARY};margin-bottom:6px}
  .pgb-bar-label{font-size:10.5px;font-weight:700;color:${MUTED};margin-top:8px}
  .pgb-txn-row{display:flex;align-items:center;gap:14px;padding:13px 4px;border-bottom:1px solid rgba(189,207,206,.4)}
  .pgb-txn-row:last-child{border-bottom:none}
  .pgb-txn-id{font-weight:800;color:${DARK};font-size:12.5px;font-family:monospace}
  .pgb-txn-buyer{color:${MUTED};font-size:11.5px;margin-top:2px}
  .pgb-txn-amounts{margin-left:auto;text-align:right}
  .pgb-txn-amount{font-weight:900;color:${PRIMARY};font-size:14px}
  .pgb-txn-coins{color:${ACCENT};font-size:11px;font-weight:700;margin-top:2px}
  .pgb-txn-tag{font-size:10px;font-weight:900;padding:4px 11px;border-radius:20px;text-transform:uppercase;margin-left:14px;white-space:nowrap}
  .pgb-txn-tag.wallet{background:rgba(13,148,136,.12);color:#0d9488}
  .pgb-txn-tag.upi{background:rgba(147,51,234,.12);color:#9333ea}
  .pgb-txn-tag.card{background:rgba(37,99,235,.12);color:#2563eb}
  .pgb-txn-tag.netbanking{background:rgba(234,88,12,.12);color:#ea580c}
  .pgb-txn-tag.other{background:rgba(7,59,63,.08);color:${PRIMARY}}
  .pgb-loadmore{width:100%;margin-top:14px;padding:12px;border-radius:8px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${PRIMARY};font-weight:800;font-size:13px;cursor:pointer}
  .pgb-loadmore:hover{border-color:${PRIMARY};background:rgba(7,59,63,.04)}
  .pgb-loadmore:disabled{opacity:.6;cursor:not-allowed}
  .pgb-empty{color:${MUTED};font-size:13px;text-align:center;padding:24px 0}
  .pgb-error{display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px 20px;color:${MUTED};text-align:center}
  .pgb-error-title{color:${PRIMARY};font-weight:900;font-size:15px}
  .pgb-retry-btn{padding:10px 22px;border-radius:20px;border:none;background:${PRIMARY};color:#fff;font-weight:800;font-size:12.5px;cursor:pointer}
  .pgb-retry-btn:hover{background:${DEEP}}
  @media(max-width:900px){.pgb-cards{grid-template-columns:1fr}}
  @media(max-width:768px){
    .pgb-main{width:100%!important;padding:20px 14px 60px!important}
    .pgb-headrow{flex-direction:column!important;align-items:stretch!important}
    .pgb-download-btn{width:100%!important;justify-content:center!important}
    .pgb-filter-row{overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;flex-wrap:nowrap!important;padding-bottom:8px!important;margin-bottom:18px!important}
    .pgb-panel{padding:18px 14px!important;border-radius:14px!important}
    .pgb-breakdown-label{width:80px!important}
    .pgb-breakdown-value{width:110px!important}
  }
  @media(max-width:540px){
    .pgb-txn-row{flex-wrap:wrap!important;gap:8px!important}
    .pgb-txn-amounts{margin-left:0!important;text-align:left!important}
    .pgb-txn-tag{margin-left:auto!important}
  }
`

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'custom', label: 'Custom' },
]

export default function PaymentsPageBase({ view, kicker, title, note, revenueLabel, coinsLabel = 'Coins Sold', showBreakdown = false }) {
  const [summary, setSummary] = useState(null)
  const [txns, setTxns] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeFilter, setActiveFilter] = useState('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const fetchIdRef = useRef(0)

  const fetchData = async (p = 1, period = activeFilter, from = customFrom, to = customTo) => {
    const fetchId = ++fetchIdRef.current
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/payments/?page=${p}&period=${period}&view=${view}`
      if (period === 'custom' && from && to) url += `&start_date=${from}&end_date=${to}`
      const res = await api.get(url)
      if (fetchId !== fetchIdRef.current) return
      setSummary({
        total_revenue: res.data.total_revenue,
        total_coins_sold: res.data.total_coins_sold,
        total_transactions: res.data.total_transactions,
        monthly_trend: res.data.monthly_trend,
        payment_breakdown: res.data.payment_breakdown || [],
      })
      setTxns(prev => p === 1 ? res.data.transactions : [...prev, ...res.data.transactions])
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

  const [downloading, setDownloading] = useState(false)
  const downloadReport = async () => {
    setDownloading(true)
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/payments/?period=${activeFilter}&view=${view}&format=csv`
      if (activeFilter === 'custom' && customFrom && customTo) url += `&start_date=${customFrom}&end_date=${customTo}`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-report.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      // silent — user can just retry the click
    }
    setDownloading(false)
  }

  const inr = n => `Rs. ${Math.round(n || 0).toLocaleString('en-IN')}`
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtMethod = m => (m || 'other').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const trend = summary?.monthly_trend || []
  const maxRevenue = Math.max(...trend.map(t => t.revenue), 1)

  return (
    <div className="pgb-page">
      <style>{styles}</style>
      <main className="pgb-main">
        <div className="pgb-headrow">
          <div>
            <p className="pgb-kicker">{kicker}</p>
            <h1 className="pgb-title">{title}</h1>
            {note && <p className="pgb-note">{note}</p>}
          </div>
          <button className="pgb-download-btn" onClick={downloadReport} disabled={downloading || loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {downloading ? 'Preparing...' : 'Download Report'}
          </button>
        </div>

        <div className="pgb-filter-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              className={`pgb-filter-tab ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => handleFilterClick(f.key)}
            >
              {f.label}
            </button>
          ))}
          {activeFilter === 'custom' && (
            <>
              <input type="date" className="pgb-custom-date" value={customFrom}
                max={customTo || new Date().toISOString().split('T')[0]}
                onChange={e => setCustomFrom(e.target.value)} />
              <span className="pgb-date-to">to</span>
              <input type="date" className="pgb-custom-date" value={customTo}
                min={customFrom} max={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomTo(e.target.value)} />
              <button className="pgb-apply-btn" onClick={applyCustomRange}>Apply</button>
            </>
          )}
        </div>

        {loading ? (
          <>
            <div className="pgb-cards">
              {[0, 1, 2].map(i => (
                <div className="pgb-card" key={i} style={{ borderStyle: 'dashed' }}>
                  <SkeletonText width="60%" height="10px" />
                  <div style={{ marginTop: 10 }}>
                    <SkeletonText width="80%" height="22px" />
                  </div>
                </div>
              ))}
            </div>

            <section className="pgb-panel">
              <SkeletonText width="220px" height="14px" />
              <div className="pgb-chart-wrap">
                <div className="pgb-chart" style={{ marginTop: 20 }}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div className="pgb-bar-col" key={i}>
                      <SkeletonText width="70%" height="10px" />
                      <div
                        className="skel-line"
                        style={{ width: '100%', maxWidth: 52, height: `${40 + (i % 3) * 30}px`, borderRadius: '6px 6px 0 0', marginTop: 6, marginBottom: 6 }}
                      />
                      <SkeletonText width="60%" height="10px" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="pgb-panel">
              <SkeletonText width="260px" height="14px" />
              <div style={{ marginTop: 18 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div className="pgb-txn-row" key={i}>
                    <div style={{ flex: 1 }}>
                      <SkeletonText width="140px" height="12px" />
                      <div style={{ marginTop: 6 }}>
                        <SkeletonText width="180px" height="10px" />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <SkeletonText width="80px" height="14px" />
                      <div style={{ marginTop: 6 }}>
                        <SkeletonText width="60px" height="10px" />
                      </div>
                    </div>
                    <div style={{ marginLeft: 14 }}>
                      <SkeletonText width="70px" height="20px" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : loadError && !summary ? (
          <div className="pgb-error">
            <div className="pgb-error-title">Could not load this data</div>
            <div>Backend mella wake ahalam (Render cold-start) illa network issue irukalam — retry pண்ணुங்கள்.</div>
            <button className="pgb-retry-btn" onClick={retry}>Retry</button>
          </div>
        ) : (
          <>
            <div className="pgb-cards">
              <div className="pgb-card hero">
                <div className="pgb-card-label">{revenueLabel || 'Total Revenue'}</div>
                <div className="pgb-card-value">{inr(summary.total_revenue)}</div>
              </div>
              <div className="pgb-card">
                <div className="pgb-card-label">{coinsLabel}</div>
                <div className="pgb-card-value">{(summary.total_coins_sold || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="pgb-card">
                <div className="pgb-card-label">Transactions</div>
                <div className="pgb-card-value">{summary.total_transactions}</div>
              </div>
            </div>

            {showBreakdown && summary.payment_breakdown?.length > 0 && (
              <section className="pgb-panel">
                <h3 className="pgb-panel-title">Payment Method Breakdown</h3>
                <div className="pgb-breakdown">
                  {(() => {
                    const maxTotal = Math.max(...summary.payment_breakdown.map(b => b.total), 1)
                    return summary.payment_breakdown.map(b => (
                      <div className="pgb-breakdown-row" key={b.method}>
                        <div className="pgb-breakdown-label">{(b.method || 'other').replace(/_/g, ' ')}</div>
                        <div className="pgb-breakdown-track">
                          <div className="pgb-breakdown-fill" style={{ width: `${Math.max((b.total / maxTotal) * 100, 3)}%` }} />
                        </div>
                        <div className="pgb-breakdown-value">{inr(b.total)} · {b.count} txns</div>
                      </div>
                    ))
                  })()}
                </div>
              </section>
            )}

            <section className="pgb-panel">
              <h3 className="pgb-panel-title">Monthly Trend (last 6 months)</h3>
              {trend.length === 0 ? (
                <div className="pgb-empty">No revenue data yet</div>
              ) : (
                <div className="pgb-chart-wrap">
                  <div className="pgb-chart">
                    {trend.map(t => (
                      <div className="pgb-bar-col" key={t.month}>
                        <div className="pgb-bar-value">{inr(t.revenue)}</div>
                        <div className="pgb-bar" style={{ height: `${Math.max((t.revenue / maxRevenue) * 100, 4)}%` }} />
                        <div className="pgb-bar-label">{t.month}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="pgb-panel">
              <h3 className="pgb-panel-title">Transactions {activeFilter !== 'custom' ? `— ${FILTERS.find(f => f.key === activeFilter)?.label}` : ''}</h3>
              {txns.length === 0 ? (
                <div className="pgb-empty">No transactions in this period</div>
              ) : (
                txns.map((t, i) => (
                  <div key={i} className="pgb-txn-row">
                    <div>
                      <div className="pgb-txn-id">{t.transaction_id}</div>
                      <div className="pgb-txn-buyer">{t.buyer} · {fmtDate(t.created_at)}</div>
                    </div>
                    <div className="pgb-txn-amounts">
                      <div className="pgb-txn-amount">{inr(t.amount)}</div>
                      {t.order_total != null && (
                        <div className="pgb-txn-coins">of {inr(t.order_total)} order</div>
                      )}
                      {t.coins != null && (
                        <div className="pgb-txn-coins">{t.coins.toLocaleString('en-IN')} coins</div>
                      )}
                      {t.percent != null && (
                        <div className="pgb-txn-coins" style={{ color: ACCENT, fontWeight: 900 }}>{t.percent}%</div>
                      )}
                    </div>
                    <span className={`pgb-txn-tag ${t.payment_method}`}>{fmtMethod(t.payment_method)}</span>
                  </div>
                ))
              )}
              {hasMore && (
                <button className="pgb-loadmore" onClick={loadMore} disabled={loadingMore}>
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
