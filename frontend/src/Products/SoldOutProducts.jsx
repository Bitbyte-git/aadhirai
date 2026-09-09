import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

function Icon({ name, size = 16 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const icons = {
    alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    back: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    dot: <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />,
    list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
    check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m22 4-10 10-3-3" /></>,
    box: <><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    refresh: <><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  }
  return <svg {...common}>{icons[name]}</svg>
}

const getImageUrl = img => {
  if (!img) return null
  let p = typeof img === 'object' ? (img.image || img.url || '') : img
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return `${API_BASE}/${p.replace(/^\/+/, '')}`
}

export default function SoldOutProducts() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('sold_out')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchList() }, [filter])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/jewelry-products/sold-out/?filter=${filter}`)
      setProducts(res.data.results || [])
    } catch { setProducts([]) }
    setLoading(false)
  }

  const FILTERS = [
    { key: 'sold_out', label: 'Sold Out', icon: 'dot', color: '#C92035' },
    { key: 'low_stock', label: 'Low Stock', icon: 'dot', color: '#BB8958' },
    { key: 'both', label: 'All Alerts', icon: 'list', color: '#0C4044' },
  ]

  return (
    <div className="so-page">
      <style>{`
        .so-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 48%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:28px 24px}
        .so-wrap{max-width:1200px;margin:0 auto}
        .so-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:14px}
        .so-header-left{display:flex;align-items:center;gap:14px}
        .so-icon-box{width:44px;height:44px;border-radius:12px;background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.2);display:flex;align-items:center;justify-content:center;color:#C92035;flex-shrink:0}
        .so-page-title{font-size:22px;font-weight:800;color:#073B3F;margin:0}
        .so-page-sub{font-size:13px;color:#7A8987;margin-top:3px}
        .so-header-actions{display:flex;gap:8px;flex-wrap:wrap}
        .so-notify-btn{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;background:rgba(31,111,235,.06);border:1px solid rgba(31,111,235,.22);color:#1f6feb;font-weight:700;font-size:13px;cursor:pointer;transition:background .2s}
        .so-notify-btn:hover{background:rgba(31,111,235,.12)}
        .so-back-btn{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;background:rgba(201,32,53,.06);border:1px solid rgba(201,32,53,.22);color:#C92035;font-weight:700;font-size:13px;cursor:pointer;transition:background .2s}
        .so-back-btn:hover{background:rgba(201,32,53,.12)}
        .so-filters{display:flex;gap:8px;margin-bottom:22px;flex-wrap:wrap}
        .so-filter-btn{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;font-weight:700;font-size:13px;cursor:pointer;border:1px solid rgba(189,207,206,.72);background:#FDFDFC;color:#0C4044;transition:all .2s}
        .so-filter-btn.active{background:#0C4044;border-color:#073B3F;color:#FDFDFC}
        .so-filter-btn:hover:not(.active){background:rgba(189,207,206,.2)}
        .so-summary{display:flex;gap:14px;margin-bottom:22px}
        .so-stat{background:#FDFDFC;border:1px solid rgba(189,207,206,.72);border-radius:12px;padding:16px 20px;flex:1;box-shadow:0 2px 8px rgba(7,59,63,.04)}
        .so-stat-num{font-size:26px;font-weight:800;color:#073B3F}
        .so-stat-num.red{color:#C92035}
        .so-stat-num.amber{color:#BB8958}
        .so-stat-label{font-size:11px;color:#7A8987;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:2px}
        .so-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
        .so-card{background:#FDFDFC;border:1px solid rgba(189,207,206,.72);border-radius:14px;overflow:hidden;display:flex;gap:14px;padding:14px;box-shadow:0 2px 8px rgba(7,59,63,.04);transition:box-shadow .2s,transform .2s}
        .so-card:hover{box-shadow:0 8px 24px rgba(7,59,63,.1);transform:translateY(-2px)}
        .so-card-img{width:84px;height:84px;border-radius:10px;overflow:hidden;flex-shrink:0;background:#F3E8DE;display:flex;align-items:center;justify-content:center;color:#BB8958}
        .so-card-img img{width:100%;height:100%;object-fit:cover}
        .so-card-body{flex:1;display:flex;flex-direction:column;min-width:0}
        .so-card-code{font-size:10px;color:#7A8987;font-weight:700;letter-spacing:.04em}
        .so-card-name{font-weight:800;font-size:14px;color:#111817;margin:2px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .so-card-meta{font-size:11px;color:#7A8987;margin-bottom:8px}
        .so-stock-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800}
        .so-stock-badge.out{background:rgba(201,32,53,.1);color:#C92035}
        .so-stock-badge.low{background:rgba(187,137,88,.12);color:#BB8958}
        .so-restock-btn{align-self:center;display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:10px;background:#0C4044;border:none;color:#FDFDFC;font-weight:700;font-size:12px;cursor:pointer;transition:background .2s;flex-shrink:0;height:fit-content;white-space:nowrap}
        .so-restock-btn:hover{background:#073B3F}
        .so-empty{text-align:center;padding:60px 20px;background:#FDFDFC;border:2px dashed #BDCFCE;border-radius:16px;color:#7A8987}
        .so-empty-icon{color:#0C4044;margin-bottom:10px;display:flex;justify-content:center}
        .so-loading{text-align:center;padding:60px;color:#7A8987}
        .so-spinner{width:36px;height:36px;border:3px solid rgba(12,64,68,.15);border-top:3px solid #0C4044;border-radius:50%;animation:so-spin 1s linear infinite;margin:0 auto 16px}
        @keyframes so-spin{to{transform:rotate(360deg)}}
        @media(max-width:720px){.so-page{padding:16px 12px}.so-header{flex-direction:column;align-items:flex-start}.so-header-actions{width:100%}.so-notify-btn,.so-back-btn{flex:1}.so-summary{flex-direction:column}.so-grid{grid-template-columns:1fr}.so-page-title{font-size:19px}.so-filters{width:100%}.so-filter-btn{flex:1;justify-content:center}}
      `}</style>

      <div className="so-wrap">
        <div className="so-header">
          <div className="so-header-left">
            <div className="so-icon-box"><Icon name="alert" size={20} /></div>
            <div>
              <h1 className="so-page-title">Stock Alerts</h1>
              <div className="so-page-sub">Sold out and low stock products</div>
            </div>
          </div>
          <div className="so-header-actions">
            <button className="so-notify-btn" onClick={() => navigate('/stock-notifications')}>
              <Icon name="bell" size={15} />Notify Requests
            </button>
            <button className="so-back-btn" onClick={() => navigate('/super-admin')}>
              <Icon name="back" size={15} />Back
            </button>
          </div>
        </div>

        <div className="so-filters">
          {FILTERS.map(f => (
            <button key={f.key}
              className={`so-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}>
              <span style={{ color: filter === f.key ? '#FDFDFC' : f.color }}><Icon name={f.icon} size={f.icon === 'dot' ? 9 : 15} /></span>
              {f.label}
            </button>
          ))}
        </div>

        {!loading && products.length > 0 && (
          <div className="so-summary">
            <div className="so-stat">
              <div className="so-stat-num">{products.length}</div>
              <div className="so-stat-label">Total Alerts</div>
            </div>
            <div className="so-stat">
              <div className="so-stat-num red">{products.filter(p => p.stock_status === 'out_of_stock').length}</div>
              <div className="so-stat-label">Sold Out</div>
            </div>
            <div className="so-stat">
              <div className="so-stat-num amber">{products.filter(p => p.stock_status === 'low_stock').length}</div>
              <div className="so-stat-label">Low Stock</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="so-loading">
            <div className="so-spinner" />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="so-empty">
            <div className="so-empty-icon"><Icon name="check" size={36} /></div>
            No alerts — all products well stocked
          </div>
        ) : (
          <div className="so-grid">
            {products.map(p => {
              const firstImg = p.images?.[0] ? getImageUrl(p.images[0]) : null
              return (
                <div key={p.id} className="so-card">
                  <div className="so-card-img">
                    {firstImg ? <img src={firstImg} alt={p.name} /> : <Icon name="box" size={28} />}
                  </div>
                  <div className="so-card-body">
                    <div className="so-card-code">{p.product_code}</div>
                    <div className="so-card-name">{p.name}</div>
                    <div className="so-card-meta">{p.metal?.toUpperCase()} {p.grade?.toUpperCase()} • {p.category}</div>
                    <div className={`so-stock-badge ${p.stock_status === 'out_of_stock' ? 'out' : 'low'}`}>
                      <Icon name="dot" size={7} />
                      Stock: {p.stock_quantity} {p.stock_status === 'out_of_stock' ? '— SOLD OUT' : '— LOW'}
                    </div>
                  </div>
                  <button className="so-restock-btn"
                    onClick={() => navigate('/add-product', { state: { restockProductId: p.id, restockCategory: p.category } })}>
                    <Icon name="refresh" size={13} />Restock
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}