import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function Icon({ name, size = 16 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const icons = {
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
    back: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    box: <><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m22 4-10 10-3-3" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
  }
  return <svg {...common}>{icons[name]}</svg>
}

export default function StockNotifications() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchList() }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notify-me/')
      setProducts(res.data.products || [])
    } catch { setProducts([]) }
    setLoading(false)
  }

  return (
    <div className="sn-page">
      <style>{`
        .sn-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 48%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:28px 24px}
        .sn-wrap{max-width:900px;margin:0 auto}
        .sn-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:14px}
        .sn-header-left{display:flex;align-items:center;gap:14px}
        .sn-icon-box{width:44px;height:44px;border-radius:12px;background:rgba(31,111,235,.08);border:1px solid rgba(31,111,235,.2);display:flex;align-items:center;justify-content:center;color:#1f6feb;flex-shrink:0}
        .sn-page-title{font-size:22px;font-weight:800;color:#073B3F;margin:0}
        .sn-page-sub{font-size:13px;color:#7A8987;margin-top:3px}
        .sn-back-btn{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;background:rgba(201,32,53,.06);border:1px solid rgba(201,32,53,.22);color:#C92035;font-weight:700;font-size:13px;cursor:pointer;transition:background .2s}
        .sn-back-btn:hover{background:rgba(201,32,53,.12)}
        .sn-summary{display:flex;gap:14px;margin-bottom:22px}
        .sn-stat{background:#FDFDFC;border:1px solid rgba(189,207,206,.72);border-radius:12px;padding:16px 20px;flex:1;box-shadow:0 2px 8px rgba(7,59,63,.04)}
        .sn-stat-num{font-size:26px;font-weight:800;color:#073B3F}
        .sn-stat-label{font-size:11px;color:#7A8987;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:2px}
        .sn-list{display:flex;flex-direction:column;gap:10px}
        .sn-card{background:#FDFDFC;border:1px solid rgba(189,207,206,.72);border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(7,59,63,.04);transition:box-shadow .2s}
        .sn-card:hover{box-shadow:0 6px 20px rgba(7,59,63,.08)}
        .sn-card-header{width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:transparent;border:none;cursor:pointer;text-align:left;gap:12px}
        .sn-card-left{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
        .sn-prod-icon{width:40px;height:40px;border-radius:10px;background:#F3E8DE;display:flex;align-items:center;justify-content:center;color:#BB8958;flex-shrink:0}
        .sn-prod-name{font-weight:800;font-size:14px;color:#111817;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sn-prod-meta{font-size:11px;color:#7A8987;margin-top:2px}
        .sn-card-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .sn-badge{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:999px;background:rgba(31,111,235,.08);color:#1f6feb;font-weight:800;font-size:12px}
        .sn-chevron{transition:transform .2s;color:#7A8987}
        .sn-chevron.open{transform:rotate(180deg)}
        .sn-expand{border-top:1px solid rgba(189,207,206,.4);padding:6px 18px 14px}
        .sn-customer{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(189,207,206,.25)}
        .sn-customer:last-child{border-bottom:none}
        .sn-cust-email{font-weight:700;font-size:13px;color:#111817}
        .sn-cust-meta{font-size:11px;color:#7A8987;margin-top:2px}
        .sn-cust-status{font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px}
        .sn-cust-status.notified{background:rgba(12,64,68,.08);color:#0C4044}
        .sn-cust-status.pending{background:rgba(201,32,53,.08);color:#C92035}
        .sn-empty{text-align:center;padding:60px 20px;background:#FDFDFC;border:2px dashed #BDCFCE;border-radius:16px;color:#7A8987}
        .sn-empty-icon{color:#0C4044;margin-bottom:10px;display:flex;justify-content:center}
        .sn-loading{text-align:center;padding:60px;color:#7A8987}
        .sn-spinner{width:36px;height:36px;border:3px solid rgba(12,64,68,.15);border-top:3px solid #0C4044;border-radius:50%;animation:sn-spin 1s linear infinite;margin:0 auto 16px}
        @keyframes sn-spin{to{transform:rotate(360deg)}}
        @media(max-width:640px){.sn-page{padding:16px 12px}.sn-header{flex-direction:column;align-items:flex-start}.sn-summary{flex-direction:column}.sn-page-title{font-size:19px}.sn-card-header{padding:12px 14px}.sn-prod-name{font-size:13px}}
      `}</style>

      <div className="sn-wrap">
        <div className="sn-header">
          <div className="sn-header-left">
            <div className="sn-icon-box"><Icon name="bell" size={20} /></div>
            <div>
              <h1 className="sn-page-title">Stock Notifications</h1>
              <div className="sn-page-sub">Customers waiting for sold-out products to restock</div>
            </div>
          </div>
          <button className="sn-back-btn" onClick={() => navigate('/super-admin')}>
            <Icon name="back" size={15} />Back
          </button>
        </div>

        {!loading && products.length > 0 && (
          <div className="sn-summary">
            <div className="sn-stat">
              <div className="sn-stat-num">{products.length}</div>
              <div className="sn-stat-label">Products Requested</div>
            </div>
            <div className="sn-stat">
              <div className="sn-stat-num">{products.reduce((sum, p) => sum + (p.waiting_count || 0), 0)}</div>
              <div className="sn-stat-label">Total Customers Waiting</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="sn-loading">
            <div className="sn-spinner" />
            Loading notifications...
          </div>
        ) : products.length === 0 ? (
          <div className="sn-empty">
            <div className="sn-empty-icon"><Icon name="check" size={36} /></div>
            No notify requests yet
          </div>
        ) : (
          <div className="sn-list">
            {products.map(p => (
              <div key={p.product_id} className="sn-card">
                <button
                  className="sn-card-header"
                  onClick={() => setExpanded(expanded === p.product_id ? null : p.product_id)}>
                  <div className="sn-card-left">
                    <div className="sn-prod-icon"><Icon name="box" size={20} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div className="sn-prod-name">{p.product_name}</div>
                      <div className="sn-prod-meta">{p.product_code} · Current stock: {p.current_stock}</div>
                    </div>
                  </div>
                  <div className="sn-card-right">
                    <div className="sn-badge"><Icon name="user" size={13} />{p.waiting_count} waiting</div>
                    <span className={`sn-chevron ${expanded === p.product_id ? 'open' : ''}`}><Icon name="chevron" size={16} /></span>
                  </div>
                </button>

                {expanded === p.product_id && (
                  <div className="sn-expand">
                    {p.customers.map(c => (
                      <div key={c.notify_id} className="sn-customer">
                        <div>
                          <div className="sn-cust-email">{c.email}</div>
                          <div className="sn-cust-meta">
                            {c.id_str || c.role} · Requested {new Date(c.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <span className={`sn-cust-status ${c.notified ? 'notified' : 'pending'}`}>
                          {c.notified ? 'Notified' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}