import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import {
  OrdersIcon, RefreshIcon, InboxIcon, JewelryIcon, PackageIcon, BullionIcon,
  SettingsIcon, PhoneIcon, LocationIcon, CalendarIcon, DownloadIcon, CheckIcon,
  SearchIcon,
} from '../components/SvgIcons'

const STATUS_COLORS = {
  pending:    { bg: 'rgba(204,168,129,0.16)', border: 'rgba(204,168,129,0.48)', color: '#BB8958' },
  confirmed:  { bg: 'rgba(12,64,68,0.10)',  border: 'rgba(12,64,68,0.38)',  color: '#0C4044' },
  processing: { bg: 'rgba(189,207,206,0.24)', border: 'rgba(189,207,206,0.68)', color: '#0C4044' },
  shipped:    { bg: 'rgba(187,137,88,0.14)',  border: 'rgba(187,137,88,0.44)',  color: '#8A623D' },
  delivered:  { bg: 'rgba(12,64,68,0.12)',   border: 'rgba(12,64,68,0.42)',   color: '#073B3F' },
  cancelled:  { bg: 'rgba(201,32,53,0.10)',   border: 'rgba(201,32,53,0.42)',   color: '#C92035' },
}

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'custom', label: 'Custom Date' },
]

const STATUS_LIST = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const FIRST_PAGE_SIZE = 100
const LOAD_MORE_SIZE = 500

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

function SkeletonRow() {
  const shimmer = { background: 'linear-gradient(90deg,#EAEFEF 25%,#F6F8F8 50%,#EAEFEF 75%)', backgroundSize: '200% 100%', animation: 'aopShimmer 1.5s infinite ease-in-out', borderRadius: 6 }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px 120px 140px 160px 40px', gap: 0, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid rgba(189,207,206,0.72)' }}>
      <div>
        <div style={{ ...shimmer, width: '70%', height: 12, marginBottom: 8 }} />
        <div style={{ ...shimmer, width: '50%', height: 10 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ ...shimmer, width: 40, height: 40, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...shimmer, width: '80%', height: 12, marginBottom: 8 }} />
          <div style={{ ...shimmer, width: '50%', height: 10 }} />
        </div>
      </div>
      <div>
        <div style={{ ...shimmer, width: '80%', height: 12, marginBottom: 8 }} />
        <div style={{ ...shimmer, width: '60%', height: 10 }} />
      </div>
      <div style={{ ...shimmer, width: '70%', height: 14 }} />
      <div style={{ ...shimmer, width: '60%', height: 12 }} />
      <div style={{ ...shimmer, width: 70, height: 22, borderRadius: 20 }} />
      <div />
    </div>
  )
}

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [period, setPeriod] = useState('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, revenue: 0 })

  const fetchIdRef = useRef(0)

  const dark = false
  const bg = '#FDFDFC', text = '#111817', subtext = '#7A8987'
  const accent = '#0C4044', border = 'rgba(189,207,206,0.72)'
  const cardBg = 'rgba(253,253,252,0.97)', cardBorder = '1px solid rgba(189,207,206,0.72)'

  // Debounce the search box — don't hammer the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchOrders = useCallback(async (offset, limit, append) => {
    if (period === 'custom' && (!customStart || !customEnd)) return
    const myId = ++fetchIdRef.current
    if (append) setLoadingMore(true); else setLoading(true)

    try {
      const params = { period, status: filterStatus, search, offset, limit }
      if (period === 'custom') { params.start_date = customStart; params.end_date = customEnd }
      const res = await api.get('/admin-orders/', { params })
      if (myId !== fetchIdRef.current) return

      const data = res.data || {}
      setOrders(prev => append ? [...prev, ...(data.results || [])] : (data.results || []))
      setTotalCount(data.total_count || 0)
      setHasMore(!!data.has_more)
      if (data.stats) setStats(data.stats)
    } catch {
      if (myId !== fetchIdRef.current) return
      if (!append) { setOrders([]); setTotalCount(0); setHasMore(false) }
    } finally {
      if (myId !== fetchIdRef.current) return
      setLoading(false)
      setLoadingMore(false)
    }
  }, [period, filterStatus, search, customStart, customEnd])

  // Fresh fetch whenever period/status/search/custom-range changes
  useEffect(() => {
    fetchOrders(0, FIRST_PAGE_SIZE, false)
  }, [fetchOrders])

  const loadMore = () => fetchOrders(orders.length, LOAD_MORE_SIZE, true)

  const updateStatus = async (orderId, newStatus) => {
    setStatusUpdating(orderId)
    try {
      await api.patch(`/orders/${orderId}/`, { status: newStatus })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      setStats(prev => {
        // keep the stat cards in sync without a full refetch
        const next = { ...prev }
        const order = orders.find(o => o.id === orderId)
        if (order && order.status !== newStatus) {
          if (next[order.status] > 0) next[order.status] -= 1
          next[newStatus] = (next[newStatus] || 0) + 1
        }
        return next
      })
    } catch { alert('Status update failed') }
    setStatusUpdating(null)
  }

  const getImageUrl = url => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${API_BASE}/${url.replace(/^\/+/, '')}`
  }

  const inr = n => `₹${Math.round(n).toLocaleString('en-IN')}`
  const formatDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="orders-shell" style={{ minHeight: '100vh', background: bg, color: text, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes aopShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .ord-row{transition:background 0.2s,border-color 0.2s,transform 0.2s,box-shadow 0.2s;cursor:pointer;}
        .ord-row:hover{background:rgba(189,207,206,0.16) !important;box-shadow:inset 3px 0 0 rgba(12,64,68,0.42);}
        .orders-shell{background:radial-gradient(circle at 12% 0%,rgba(204,168,129,0.16),transparent 28%),radial-gradient(circle at 88% 2%,rgba(12,64,68,0.09),transparent 28%),#FDFDFC;}
        .orders-stat{transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease;}
        .orders-stat:hover{transform:translateY(-3px);box-shadow:0 18px 38px rgba(7,59,63,.10);border-color:rgba(12,64,68,.24)!important;}
        .orders-filter{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;}
        .orders-filter:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(7,59,63,.08);}
        .orders-action{transition:transform .2s ease,box-shadow .2s ease,background .2s ease;}
        .orders-action:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(7,59,63,.13);}
        .orders-period{transition:all .18s ease;}
        .orders-period:hover{transform:translateY(-1px);}
      `}</style>

      {/* Navbar */}
      <div style={{ background: 'rgba(253,253,252,0.94)', borderBottom: `1px solid ${border}`, padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="orders-action" onClick={() => navigate('/super-admin')} style={{ background: 'rgba(231,237,236,0.72)', border: `1px solid ${border}`, color: accent, borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>
            ← Dashboard
          </button>
          <div>
            <div style={{ color: accent, fontWeight: 800, fontSize: 16, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <OrdersIcon size={17} color={accent} /> JEWELRY ORDERS
            </div>
            <div style={{ color: subtext, fontSize: 11, marginTop: 2 }}>All customer orders — manage & track</div>
          </div>
        </div>
        <button className="orders-action" onClick={() => fetchOrders(0, orders.length || FIRST_PAGE_SIZE, false)} style={{ background: 'linear-gradient(135deg,#0C4044,#073B3F)', border: '1px solid rgba(12,64,68,0.28)', color: '#FDFDFC', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshIcon size={14} color="#FDFDFC" /> Refresh
        </button>
      </div>

      <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Period filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {PERIODS.map(p => (
            <button key={p.key} className="orders-period" onClick={() => setPeriod(p.key)}
              style={{ padding: '9px 18px', borderRadius: 999, border: `1.5px solid ${period === p.key ? accent : border}`, background: period === p.key ? 'linear-gradient(135deg,#0C4044,#073B3F)' : 'rgba(253,253,252,0.8)', color: period === p.key ? '#FDFDFC' : text, fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
          {period === 'custom' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 4 }}>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${border}`, fontSize: 12.5, color: text, background: '#fff' }} />
              <span style={{ color: subtext, fontSize: 12 }}>to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${border}`, fontSize: 12.5, color: text, background: '#fff' }} />
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Total Orders', value: stats.total, color: '#0C4044' },
            { label: 'Pending', value: stats.pending, color: '#BB8958' },
            { label: 'Confirmed', value: stats.confirmed, color: '#0C4044' },
            { label: 'Shipped', value: stats.shipped, color: '#8A623D' },
            { label: 'Delivered', value: stats.delivered, color: '#073B3F' },
            { label: 'Total Revenue', value: inr(stats.revenue), color: '#C92035', isText: true },
          ].map(s => (
            <div className="orders-stat" key={s.label} style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '16px 18px', animation: 'fadeIn 0.4s ease both' }}>
              <div style={{ fontSize: 9, color: subtext, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: s.isText ? 16 : 26, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <SearchIcon size={15} color={subtext} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search order ID, product, customer..."
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(253,253,252,0.92)', border: `1px solid ${border}`, borderRadius: 10, padding: '10px 16px 10px 38px', color: text, fontSize: 13, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_LIST.map(s => (
              <button className="orders-filter" key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${filterStatus === s ? accent : border}`, background: filterStatus === s ? 'linear-gradient(135deg,#0C4044,#073B3F)' : 'rgba(253,253,252,0.72)', color: filterStatus === s ? '#FDFDFC' : subtext, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                {s === 'all' ? `All (${stats.total})` : `${s} (${stats[s] || 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 58px rgba(7,59,63,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px 120px 140px 160px 40px', gap: 0, padding: '12px 20px', borderBottom: `1px solid ${border}`, background: 'rgba(231,237,236,0.38)' }}>
              {['Order ID', 'Product', 'Customer', 'Total', 'Payment', 'Status', ''].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 800, color: subtext, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: subtext }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><InboxIcon size={40} color={subtext} /></div>
            <div style={{ fontSize: 15 }}>No orders found</div>
          </div>
        ) : (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 58px rgba(7,59,63,0.08)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px 120px 140px 160px 40px', gap: 0, padding: '12px 20px', borderBottom: `1px solid ${border}`, background: 'rgba(231,237,236,0.38)' }}>
              {['Order ID', 'Product', 'Customer', 'Total', 'Payment', 'Status', ''].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 800, color: subtext, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {orders.map((order, i) => {
              const st = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              const img = getImageUrl(order.product_image_url)
              const isExpanded = selectedOrder?.id === order.id
              return (
                <div key={order.id} style={{ borderBottom: `1px solid ${border}`, animation: `fadeIn 0.25s ${Math.min(i % 50, 15) * 0.02}s ease both`, opacity: 0 }}>
                  {/* Main row */}
                  <div className="ord-row"
                    onClick={() => setSelectedOrder(isExpanded ? null : order)}
                    style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px 120px 140px 160px 40px', gap: 0, padding: '14px 20px', alignItems: 'center', background: isExpanded ? 'rgba(189,207,206,0.18)' : 'transparent', borderLeft: isExpanded ? `2px solid ${accent}` : '2px solid transparent' }}>

                    <div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: accent, fontWeight: 700 }}>{order.order_id}</div>
                      <div style={{ fontSize: 10, color: subtext, marginTop: 2 }}>{formatDate(order.created_at)}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: 'rgba(231,237,236,0.65)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <JewelryIcon size={18} color={subtext} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{order.product_name}</div>
                        <div style={{ fontSize: 10, color: subtext }}>{order.product_metal?.toUpperCase()} · Qty: {order.quantity}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer_name}</div>
                      <div style={{ fontSize: 10, color: subtext }}>{order.customer_phone}</div>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 800, color: '#BB8958', fontFamily: 'monospace' }}>{inr(order.total_price)}</div>

                    <div style={{ fontSize: 11, color: subtext, textTransform: 'capitalize' }}>
                      {order.payment_method?.replace('_', ' ')}
                    </div>

                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: st.bg, border: `1px solid ${st.border}`, color: st.color, textTransform: 'capitalize' }}>
                        {order.status}
                      </span>
                    </div>

                    <div style={{ color: subtext, fontSize: 12, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', textAlign: 'center' }}>▼</div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div style={{ padding: '24px', background: 'rgba(231,237,236,0.34)', borderTop: `1px solid ${border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, animation: 'fadeIn 0.25s ease both' }}>

                      {/* Delivery */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <PackageIcon size={13} color={accent} /> Delivery Details
                        </div>
                        <div style={{ background: 'rgba(253,253,252,0.86)', border: `1px solid ${border}`, borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 }}>{order.customer_name}</div>
                          <div style={{ fontSize: 12, color: subtext, lineHeight: 1.9 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><PhoneIcon size={12} color={subtext} /> {order.customer_phone}{order.customer_alt_phone ? ` / Alt: ${order.customer_alt_phone}` : ''}</span>
                            <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 4 }}><LocationIcon size={12} color={subtext} style={{ marginTop: 2, flexShrink: 0 }} /> {order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ''}, {order.city}, {order.state} – {order.pincode}</span>
                          </div>
                          {order.customer_dob && <div style={{ fontSize: 11, color: subtext, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}><CalendarIcon size={11} color={subtext} /> DOB: {order.customer_dob}</div>}
                          {order.customer_anniversary && <div style={{ fontSize: 11, color: subtext, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><CalendarIcon size={11} color={subtext} /> Anniversary: {order.customer_anniversary}</div>}
                        </div>
                      </div>

                      {/* Product + Price */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <BullionIcon size={13} color={accent} /> Order Details
                        </div>
                        <div style={{ background: 'rgba(253,253,252,0.86)', border: `1px solid ${border}`, borderRadius: 10, padding: '12px 16px' }}>
                          {[
                            { label: 'Product', value: order.product_name },
                            { label: 'Metal', value: `${order.product_metal?.toUpperCase()} ${order.product_grade?.toUpperCase()}` },
                            { label: 'Category', value: order.product_category },
                            { label: 'Unit Price', value: inr(order.unit_price) },
                            { label: 'Qty', value: order.quantity },
                            { label: 'Total', value: inr(order.total_price) },
                            { label: 'Payment', value: order.payment_method?.replace('_', ' ') },
                          ].map(r => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 11, color: subtext }}>{r.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: text, textTransform: 'capitalize' }}>{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status update */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SettingsIcon size={13} color={accent} /> Update Status
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => {
                            const sc = STATUS_COLORS[s]
                            const isCurrent = order.status === s
                            return (
                              <button key={s} disabled={isCurrent || statusUpdating === order.id}
                                onClick={() => updateStatus(order.id, s)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${isCurrent ? sc.border : border}`, background: isCurrent ? sc.bg : 'rgba(253,253,252,0.76)', color: isCurrent ? sc.color : subtext, fontSize: 12, fontWeight: isCurrent ? 800 : 500, cursor: isCurrent ? 'default' : 'pointer', textTransform: 'capitalize', textAlign: 'left', transition: 'all 0.15s' }}>
                                {isCurrent ? <CheckIcon size={13} color={sc.color} /> : <span style={{ width: 13, height: 13, borderRadius: '50%', border: `1.5px solid ${subtext}`, display: 'inline-block' }} />}
                                {s}
                                {statusUpdating === order.id && !isCurrent && ' ...'}
                              </button>
                            )
                          })}
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, color: subtext }}>
                          Customer: {order.customer_email}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )
            })}

            {/* Load More Pagination (100 first, +500 per click) */}
            {hasMore ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', background: 'rgba(231,237,236,0.3)', borderTop: `1px solid ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 13, color: subtext, fontWeight: 600 }}>
                  Showing <span style={{ color: accent, fontWeight: 800 }}>{orders.length}</span> of <span style={{ color: text, fontWeight: 800 }}>{totalCount}</span> orders
                </div>
                <button
                  className="orders-action"
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    background: 'linear-gradient(135deg, #0C4044 0%, #073B3F 100%)',
                    color: '#FDFDFC',
                    border: '1px solid rgba(12,64,68,0.35)',
                    borderRadius: 10,
                    padding: '12px 36px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    opacity: loadingMore ? 0.7 : 1,
                    boxShadow: '0 8px 24px rgba(12,64,68,0.22)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    letterSpacing: '0.02em',
                  }}
                >
                  <DownloadIcon size={14} color="#FDFDFC" />
                  <span>{loadingMore ? 'Loading...' : `Load More (+${LOAD_MORE_SIZE} Orders)`}</span>
                </button>
              </div>
            ) : orders.length >= FIRST_PAGE_SIZE ? (
              <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(231,237,236,0.2)', borderTop: `1px solid ${border}`, color: subtext, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CheckIcon size={13} color={subtext} /> All {totalCount} orders loaded
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
