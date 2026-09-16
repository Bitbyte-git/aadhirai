import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerFooter from '../collection/CustomerFooter'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const STATUS_META = {
  pending: { label: 'Pending', tone: '#B7791F', bg: '#FFF7E6', border: 'rgba(183,121,31,0.28)', icon: '🟡', step: 1 },
  confirmed: { label: 'Confirmed', tone: '#2563EB', bg: '#E8F1FF', border: 'rgba(37,99,235,0.28)', icon: '🔵', step: 2 },
  processing: { label: 'Processing', tone: '#7C3AED', bg: '#F3E8FF', border: 'rgba(124,58,237,0.28)', icon: '🟣', step: 3 },
  shipped: { label: 'Shipped', tone: '#0284C7', bg: '#E0F2FE', border: 'rgba(2,132,199,0.28)', icon: '🔷', step: 4 },
  delivered: { label: 'Delivered', tone: '#15803D', bg: '#E8F7EE', border: 'rgba(21,128,61,0.28)', icon: '🟢', step: 5 },
  cancelled: { label: 'Cancelled', tone: '#DC2626', bg: '#FEECEC', border: 'rgba(220,38,38,0.28)', icon: '🔴', step: 0 },
}

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Placed', bg: '#FFF7E6', color: '#B7791F', border: '#B7791F', step: 1 },
  { key: 'confirmed', label: 'Confirmed', bg: '#E8F1FF', color: '#2563EB', border: '#2563EB', step: 2 },
  { key: 'processing', label: 'Processing', bg: '#F3E8FF', color: '#7C3AED', border: '#7C3AED', step: 3 },
  { key: 'shipped', label: 'Shipped', bg: '#E0F2FE', color: '#0284C7', border: '#0284C7', step: 4 },
  { key: 'delivered', label: 'Delivered', bg: '#E8F7EE', color: '#15803D', border: '#15803D', step: 5 },
]

const PAYMENT_LABELS = {
  upi: 'UPI',
  debit_card: 'Debit card',
  credit_card: 'Credit card',
  net_banking: 'Net banking',
  emi: 'EMI',
  cash_on_delivery: 'Cash on delivery',
  razorpay: 'Razorpay',
}

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const paths = {
    bag: <><path d="M6 8h12l-1 13H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>,
    box: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
    truck: <><path d="M3 7h11v10H3z" /><path d="M14 11h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.7" /><circle cx="17" cy="18" r="1.7" /></>,
    shield: <path d="M12 3 20 6v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3Z" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    check: <path d="M20 6 9 17l-5-5" />,
  }

  return <svg {...common}>{paths[name]}</svg>
}

function getImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}/${url.replace(/^\/+/, '')}`
}

function money(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'Rs. 0'
  return `Rs. ${Math.round(n).toLocaleString('en-IN')}`
}

function formatDate(value) {
  if (!value) return 'Recently'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function OrderTimeline({ status, events, loading }) {
  const meta = STATUS_META[status] || STATUS_META.pending

  if (status === 'cancelled') {
    return (
      <div className="os-cancelled">
        This order has been cancelled. Our support team can help if you need more details.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="os-track-vlist">
        {[1, 2, 3].map(i => (
          <div className="os-track-item" key={i}>
            <div className="os-track-dot-col"><span className="os-track-dot bb-skel" /><span className="os-track-line" /></div>
            <div className="os-track-body">
              <div className="bb-skel" style={{ width: '40%', height: 13, marginBottom: 8 }} />
              <div className="bb-skel" style={{ width: '60%', height: 11 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Real shipment checkpoints — stage + location + exact date/time, most
  // recent at the bottom (oldest first), Amazon/Flipkart tracking-page style.
  if (events && events.length > 0) {
    return (
      <div className="os-track-vlist">
        {events.map((ev, i) => {
          const isLast = i === events.length - 1
          return (
            <div className="os-track-item" key={ev.id}>
              <div className="os-track-dot-col">
                <span className={`os-track-dot ${isLast ? 'current' : 'done'}`}>
                  <Icon name="check" size={11} />
                </span>
                {i < events.length - 1 && <span className="os-track-line" />}
              </div>
              <div className="os-track-body">
                <div className="os-track-stage">{ev.stage_label}</div>
                {ev.location && (
                  <div className="os-track-loc"><Icon name="pin" size={12} /> {ev.location}</div>
                )}
                <div className="os-track-date">{formatDateTime(ev.created_at)}</div>
                {ev.note && <div className="os-track-note">{ev.note}</div>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 5-step stage indicator with exact status colors per stage
  return (
    <div className="os-timeline">
      {TIMELINE_STEPS.map((st, index) => {
        const isDone = index + 1 <= meta.step
        const isCurrent = index + 1 === meta.step
        const isLineDone = index > 0 && index <= meta.step
        const lineBg = isLineDone ? st.color : 'rgba(122,137,135,0.20)'

        return (
          <div
            className={`os-step ${isDone ? 'done' : ''}`}
            key={st.key}
            style={{
              '--step-line-bg': lineBg,
              color: isDone ? st.color : '#7A8987',
            }}
          >
            <span
              style={{
                background: isDone ? st.bg : '#F3F3F0',
                color: isDone ? st.color : '#7A8987',
                borderColor: isDone ? st.border : 'rgba(12,64,68,0.16)',
                borderWidth: isDone ? '2px' : '1px',
                borderStyle: 'solid',
                fontWeight: 800,
                boxShadow: isCurrent ? `0 0 0 4px ${st.color}26` : 'none',
              }}
            >
              {isDone && !isCurrent ? <Icon name="check" size={13} /> : index + 1}
            </span>
            <small
              style={{
                color: isDone ? st.color : '#7A8987',
                fontWeight: isDone ? 800 : 600,
              }}
            >
              {st.label}
            </small>
          </div>
        )
      })}
    </div>
  )
}

export default function OrderSummary() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [trackingByOrder, setTrackingByOrder] = useState({})
  const [trackingLoading, setTrackingLoading] = useState({})
  // Tracks whether the component is truly mounted right now. A plain local
  // variable inside the effect breaks under React 18 StrictMode (dev only):
  // it double-invokes the effect on mount — run, cleanup, run again — so a
  // per-invocation flag gets marked "cleaned up" for the FIRST call before
  // its slow response (Render free-tier cold start, 20s+) even arrives,
  // causing a genuinely successful response to be discarded. A ref survives
  // that cleanup/re-run cycle intact, so it only reads false during the
  // instant between the two invocations — never once the second (real) one
  // has started — letting either call's success land correctly.
  const mountedRef = useRef(true)

  // Real shipment checkpoints (stage + location + date) — fetched lazily the
  // first time an order card is opened, not for every order up front.
  const fetchTracking = async (orderIdStr) => {
    if (trackingByOrder[orderIdStr] || trackingLoading[orderIdStr]) return
    setTrackingLoading(prev => ({ ...prev, [orderIdStr]: true }))
    try {
      const { default: api } = await import('../api')
      const res = await api.get(`/orders/${orderIdStr}/tracking/`)
      setTrackingByOrder(prev => ({ ...prev, [orderIdStr]: res.data?.events || [] }))
    } catch {
      setTrackingByOrder(prev => ({ ...prev, [orderIdStr]: [] }))
    }
    setTrackingLoading(prev => ({ ...prev, [orderIdStr]: false }))
  }

  const handleDownloadReceipt = async (event, orderId) => {
    event.stopPropagation()
    setDownloadingId(orderId)
    try {
      const { downloadOrderReceipt } = await import('../api')
      await downloadOrderReceipt(orderId)
    } catch {
      // silent — button just returns to its normal state
    }
    setDownloadingId(null)
  }

  useEffect(() => {
    // React 18 StrictMode (dev only) double-invokes this effect on mount, so
    // /orders/ fires twice — harmless on its own since both ask for the exact
    // same thing. The real trap: Render's free-tier backend cold-starts and
    // can take 20-25s+ to answer, so one of the two calls often hits axios's
    // 25s timeout and shows as "(canceled)" in devtools — while the OTHER one
    // still comes back with real data a little later. A response must always
    // be applied when it succeeds, no matter which of the two calls it came
    // from; only a failure must never blank out orders a sibling call already
    // loaded successfully. mountedRef (not a local var) survives the
    // cleanup-then-rerun so it's only ever false for the instant between the
    // two invocations, never once the real one is running.
    mountedRef.current = true
    const fetchOrders = async () => {
      try {
        const { default: api } = await import('../api')
        const res = await api.get('/orders/')
        if (!mountedRef.current) return
        const list = Array.isArray(res.data) ? res.data : []
        setOrders(list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)))
        setLoading(false)
      } catch {
        // A failed/timed-out request must never blank out orders that a
        // sibling request already successfully loaded — just stop showing
        // the loading state if nothing else is still in flight.
        if (mountedRef.current) setLoading(false)
      }
    }

    fetchOrders()
    return () => { mountedRef.current = false }
  }, [])

  const stats = useMemo(() => {
    const totalSpend = orders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0)
    return {
      total: orders.length,
      active: orders.filter(order => !['delivered', 'cancelled'].includes(order.status)).length,
      delivered: orders.filter(order => order.status === 'delivered').length,
      spend: totalSpend,
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase()
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const haystack = [
        order.order_id,
        order.product_name,
        order.product_category,
        order.product_metal,
        order.product_grade,
        order.payment_method,
      ].join(' ').toLowerCase()
      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [orders, query, statusFilter])

  const selectedOrder = orders.find(order => order.id === selectedOrderId)

  return (
    <div className="order-summary-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap');

        .order-summary-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 2%, rgba(189,207,206,0.46), transparent 26%),
            radial-gradient(circle at 92% 10%, rgba(243,232,222,0.95), transparent 28%),
            linear-gradient(180deg, #FDFDFC 0%, #F3F3F0 48%, #FDFDFC 100%);
          color: #111817;
          font-family: Inter, system-ui, sans-serif;
        }

        .os-shell {
          width: min(1380px, 100%);
          margin: 0 auto;
          padding: 52px clamp(18px, 4vw, 72px) 86px;
        }

        .os-hero {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.56fr);
          gap: 28px;
          align-items: stretch;
          margin-bottom: 28px;
        }

        .os-hero-card,
        .os-trust-card,
        .os-panel,
        .os-order-card {
          border: 1px solid rgba(12,64,68,0.13);
          box-shadow: 0 24px 70px rgba(7,59,63,0.10);
        }

        .os-hero-card {
          position: relative;
          overflow: hidden;
          min-height: 280px;
          border-radius: 8px;
          padding: clamp(28px, 4vw, 54px);
          background:
            linear-gradient(115deg, rgba(253,253,252,0.96) 0%, rgba(231,237,236,0.90) 54%, rgba(243,232,222,0.88) 100%);
        }

        .os-hero-card:after {
          content: "";
          position: absolute;
          right: -80px;
          top: -100px;
          width: 310px;
          height: 310px;
          border-radius: 50%;
          border: 42px solid rgba(204,168,129,0.22);
        }

        .os-kicker {
          margin: 0 0 12px;
          color: #BB8958;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .os-hero h1 {
          max-width: 720px;
          margin: 0;
          color: #073B3F;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(40px, 5.2vw, 76px);
          line-height: 0.96;
          letter-spacing: 0;
        }

        .os-hero-copy {
          max-width: 630px;
          margin: 20px 0 0;
          color: #5f6c69;
          font-size: 16px;
          line-height: 1.8;
        }

        .os-hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 30px;
        }

        .os-primary-btn,
        .os-ghost-btn {
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 999px;
          padding: 0 22px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .os-primary-btn {
          border: 1px solid #073B3F;
          background: #073B3F;
          color: #FDFDFC;
          box-shadow: 0 16px 38px rgba(7,59,63,0.24);
        }

        .os-ghost-btn {
          border: 1px solid rgba(12,64,68,0.22);
          background: rgba(253,253,252,0.72);
          color: #073B3F;
        }

        .os-primary-btn:hover,
        .os-ghost-btn:hover {
          transform: translateY(-2px);
        }

        .os-trust-card {
          border-radius: 8px;
          padding: 24px;
          background: #073B3F;
          color: #FDFDFC;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          position: relative;
        }

        .os-trust-card:before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, rgba(204,168,129,0.20), transparent 42%),
            radial-gradient(circle at 92% 10%, rgba(209,223,222,0.24), transparent 36%);
          pointer-events: none;
        }

        .os-trust-card > * {
          position: relative;
        }

        .os-trust-icon {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(253,253,252,0.10);
          border: 1px solid rgba(253,253,252,0.22);
          color: #D1DFDE;
        }

        .os-trust-card h2 {
          margin: 30px 0 10px;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 32px;
          line-height: 1.05;
        }

        .os-trust-card p {
          margin: 0;
          color: rgba(253,253,252,0.72);
          line-height: 1.7;
          font-size: 14px;
        }

        .os-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: -48px clamp(18px, 3vw, 42px) 30px;
          position: relative;
          z-index: 2;
        }

        .os-stat {
          border-radius: 8px;
          border: 1px solid rgba(12,64,68,0.13);
          background: rgba(253,253,252,0.92);
          backdrop-filter: blur(16px);
          padding: 18px;
          box-shadow: 0 18px 48px rgba(7,59,63,0.08);
        }

        .os-stat span {
          display: block;
          color: #7A8987;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .os-stat strong {
          color: #073B3F;
          font-size: clamp(22px, 2.6vw, 34px);
          line-height: 1;
        }

        .os-panel {
          border-radius: 8px;
          background: rgba(253,253,252,0.90);
          overflow: hidden;
        }

        .os-toolbar {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) auto;
          gap: 18px;
          padding: 20px;
          border-bottom: 1px solid rgba(12,64,68,0.10);
          background: linear-gradient(90deg, rgba(231,237,236,0.78), rgba(243,232,222,0.62));
        }

        .os-search {
          height: 48px;
          border-radius: 999px;
          border: 1px solid rgba(12,64,68,0.16);
          background: #FDFDFC;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 18px;
          color: #0C4044;
        }

        .os-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #111817;
          font-size: 14px;
        }

        .os-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .os-filter {
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(12,64,68,0.16);
          background: rgba(253,253,252,0.76);
          color: #073B3F;
          padding: 0 14px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: capitalize;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .os-filter.active,
        .os-filter:hover {
          background: #073B3F;
          border-color: #073B3F;
          color: #FDFDFC;
          box-shadow: 0 12px 28px rgba(7,59,63,0.16);
        }

        .os-list {
          display: grid;
          gap: 16px;
          padding: 20px;
        }

        .os-order-card {
          overflow: hidden;
          border-radius: 8px;
          background: #FDFDFC;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          animation: osFadeUp 0.45s ease both;
        }

        .os-order-card:hover,
        .os-order-card.open {
          transform: translateY(-3px);
          border-color: rgba(187,137,88,0.42);
          box-shadow: 0 28px 72px rgba(7,59,63,0.14);
        }

        .os-order-main {
          display: grid;
          grid-template-columns: 118px minmax(0, 1fr) minmax(170px, auto) 30px;
          gap: 22px;
          align-items: center;
          padding: 20px;
        }

        .os-product-media {
          width: 118px;
          height: 118px;
          border-radius: 8px;
          overflow: hidden;
          background:
            radial-gradient(circle at 48% 46%, rgba(204,168,129,0.28), transparent 38%),
            linear-gradient(135deg, #E7EDEC, #F3E8DE);
          border: 1px solid rgba(12,64,68,0.12);
          display: grid;
          place-items: center;
          color: #0C4044;
        }

        .os-product-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }

        .os-order-card:hover .os-product-media img {
          transform: scale(1.06);
        }

        .os-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-bottom: 10px;
        }

        .os-tag {
          border: 1px solid rgba(204,168,129,0.44);
          background: rgba(243,232,222,0.58);
          color: #9F6130;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .os-date {
          color: #7A8987;
          font-size: 12px;
          font-weight: 600;
        }

        .os-order-title {
          margin: 0 0 10px;
          color: #111817;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(22px, 2.1vw, 34px);
          line-height: 1.05;
        }

        .os-order-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          color: #5f6c69;
          font-size: 13px;
          font-weight: 600;
        }

        .os-order-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          background: rgba(231,237,236,0.70);
          padding: 7px 10px;
        }

        .os-price-block {
          text-align: right;
        }

        .os-price-block strong {
          display: block;
          color: #073B3F;
          font-size: clamp(24px, 2.5vw, 38px);
          line-height: 1;
          margin-bottom: 12px;
        }

        .os-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .os-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 0 5px rgba(12,64,68,0.08);
        }

        .os-chevron {
          color: #7A8987;
          transition: transform 0.2s ease;
        }

        .os-order-card.open .os-chevron {
          transform: rotate(180deg);
        }

        .os-order-strip {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 12px 20px;
          border-top: 1px solid rgba(12,64,68,0.08);
          background: rgba(231,237,236,0.42);
          color: #7A8987;
          font-size: 11px;
          font-weight: 700;
        }

        .os-order-strip strong {
          color: #0C4044;
          font-family: Consolas, monospace;
        }

        .os-receipt-btn {
          border: 1px solid rgba(187,137,88,0.5);
          border-radius: 999px;
          background: rgba(187,137,88,0.12);
          color: #9F6130;
          font-size: 11px;
          font-weight: 800;
          padding: 6px 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .os-receipt-btn:hover:not(:disabled) {
          background: rgba(187,137,88,0.22);
          transform: translateY(-1px);
        }

        .os-receipt-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .os-expanded {
          border-top: 1px solid rgba(12,64,68,0.10);
          background:
            radial-gradient(circle at 95% 10%, rgba(204,168,129,0.16), transparent 26%),
            linear-gradient(135deg, rgba(243,243,240,0.72), rgba(253,253,252,0.96));
          padding: 22px;
          animation: osFadeUp 0.26s ease both;
        }

        .os-expanded-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 18px;
        }

        .os-detail-card {
          border-radius: 8px;
          border: 1px solid rgba(12,64,68,0.12);
          background: rgba(253,253,252,0.88);
          padding: 18px;
        }

        .os-detail-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          color: #BB8958;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .os-address-name {
          color: #073B3F;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .os-muted-lines {
          color: #5f6c69;
          font-size: 13px;
          line-height: 1.85;
        }

        .os-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 0;
          color: #5f6c69;
          font-size: 13px;
        }

        .os-price-row b {
          color: #111817;
        }

        .os-total-row {
          border-top: 1px dashed rgba(12,64,68,0.18);
          margin-top: 8px;
          padding-top: 14px;
        }

        .os-total-row b:last-child {
          color: #073B3F;
          font-size: 20px;
        }

        .os-timeline {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }

        .os-step {
          position: relative;
          display: grid;
          gap: 8px;
          justify-items: center;
          color: #7A8987;
          font-size: 11px;
          font-weight: 800;
          text-align: center;
        }

        .os-step:before {
          content: "";
          position: absolute;
          top: 15px;
          left: -50%;
          width: 100%;
          height: 2px;
          background: var(--step-line-bg, rgba(122,137,135,0.20));
          transition: background 0.3s ease;
        }

        .os-step:first-child:before {
          display: none;
        }

        .os-step span {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #F3F3F0;
          border: 1px solid rgba(12,64,68,0.16);
          position: relative;
          z-index: 1;
          transition: all 0.25s ease;
        }

        .os-step.done {
          /* Dynamically colored per step */
        }

        .os-cancelled {
          border-radius: 8px;
          border: 1px solid rgba(201,32,53,0.24);
          background: rgba(201,32,53,0.06);
          color: #C92035;
          padding: 16px;
          font-size: 13px;
          font-weight: 700;
        }

        .os-track-vlist {
          display: flex;
          flex-direction: column;
        }

        .os-track-item {
          display: grid;
          grid-template-columns: 26px 1fr;
          gap: 14px;
        }

        .os-track-dot-col {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .os-track-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: #D1DFDE;
          color: #7A8987;
        }

        .os-track-dot.done {
          background: #073B3F;
          color: #FDFDFC;
        }

        .os-track-dot.current {
          background: #16764F;
          color: #FDFDFC;
          box-shadow: 0 0 0 4px rgba(22,118,79,0.16);
        }

        .os-track-line {
          width: 2px;
          flex: 1;
          min-height: 26px;
          background: rgba(12,64,68,0.18);
          margin: 2px 0;
        }

        .os-track-body {
          padding-bottom: 22px;
        }

        .os-track-item:last-child .os-track-body {
          padding-bottom: 2px;
        }

        .os-track-stage {
          color: #073B3F;
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .os-track-loc {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #5f6c69;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 3px;
        }

        .os-track-date {
          color: #7A8987;
          font-size: 11.5px;
          font-weight: 600;
        }

        .os-track-note {
          margin-top: 4px;
          color: #5f6c69;
          font-size: 12px;
          font-style: italic;
        }

        .os-empty,
        .os-loading {
          min-height: 330px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 42px;
        }

        .os-empty-inner,
        .os-loader-card {
          width: min(440px, 100%);
          border-radius: 8px;
          border: 1px solid rgba(12,64,68,0.12);
          background: rgba(253,253,252,0.92);
          padding: 34px;
          box-shadow: 0 24px 64px rgba(7,59,63,0.10);
        }

        .os-empty-icon,
        
        @keyframes skelShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .bb-skel {
          background: linear-gradient(90deg, #EAEFEF 25%, #F6F8F8 50%, #EAEFEF 75%);
          background-size: 200% 100%;
          animation: skelShimmer 1.5s infinite ease-in-out;
          border-radius: 8px;
        }

        .os-loader-mark {
          width: 72px;
          height: 72px;
          margin: 0 auto 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #E7EDEC;
          color: #073B3F;
        }

        .os-loader-mark {
          border: 3px solid #D1DFDE;
          border-top-color: #073B3F;
          animation: osSpin 900ms linear infinite;
        }

        .os-empty h2,
        .os-loading h2 {
          margin: 0 0 10px;
          color: #073B3F;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 30px;
        }

        .os-empty p,
        .os-loading p {
          margin: 0 0 24px;
          color: #7A8987;
          line-height: 1.7;
        }

        @keyframes osFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes osSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1080px) {
          .os-hero,
          .os-toolbar,
          .os-expanded-grid {
            grid-template-columns: 1fr;
          }

          .os-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            margin-top: 0;
          }

          .os-filters {
            justify-content: flex-start;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 6px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .os-filters::-webkit-scrollbar {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .os-shell {
            padding-left: 12px;
            padding-right: 12px;
            padding-top: 14px;
          }

          .os-hero-card {
            min-height: auto;
            padding: 24px 16px;
            border-radius: 12px;
          }

          .os-hero-card h1 {
            font-size: 26px;
          }

          .os-hero-actions {
            flex-direction: column;
            width: 100%;
          }

          .os-primary-btn,
          .os-ghost-btn {
            width: 100%;
            justify-content: center;
          }

          .os-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .os-order-card {
            padding: 16px;
            border-radius: 12px;
          }

          .os-order-main {
            grid-template-columns: 80px minmax(0, 1fr);
            gap: 12px;
          }

          .os-product-media {
            width: 80px;
            height: 80px;
            border-radius: 10px;
          }

          .os-order-title {
            font-size: 15px;
            -webkit-line-clamp: 2;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .os-price-block {
            grid-column: 1 / -1;
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .os-chevron {
            position: absolute;
            right: 16px;
            top: 16px;
          }

          .os-order-strip,
          .os-timeline {
            grid-template-columns: 1fr;
          }

          .os-order-strip {
            flex-direction: column;
            gap: 6px;
          }

          .os-step {
            grid-template-columns: 28px 1fr;
            justify-items: start;
            text-align: left;
          }

          .os-step:before {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .os-order-strip > div {
            flex-wrap: wrap;
            gap: 8px !important;
          }

          .os-order-main {
            grid-template-columns: 68px minmax(0, 1fr);
            gap: 10px;
          }

          .os-product-media {
            width: 68px;
            height: 68px;
          }

          .os-stat {
            padding: 12px 14px;
          }

          .os-stat strong {
            font-size: 18px;
          }

          .os-order-meta {
            flex-wrap: wrap;
            gap: 6px 10px;
            font-size: 11px;
          }
        }
      `}</style>

      <main className="os-shell">
        <section className="os-hero">
          <div className="os-hero-card">
            <p className="os-kicker">My Account</p>
            <h1>Order History</h1>
            <p className="os-hero-copy">
              Track every jewellery purchase with order status, delivery details, payment summary, and premium after-sales assurance in one refined view.
            </p>
            <div className="os-hero-actions">
              <button className="os-primary-btn" type="button" onClick={() => navigate('/collection/all')}>
                Continue Shopping <Icon name="arrow" size={16} />
              </button>
              <button className="os-ghost-btn" type="button" onClick={() => navigate('/customer')}>
                Back To Home
              </button>
            </div>
          </div>

          <aside className="os-trust-card">
            <div className="os-trust-icon"><Icon name="shield" size={28} /></div>
            <div>
              <h2>Protected From Cart To Doorstep</h2>
              <p>BIS hallmark assurance, insured shipping, secure payment records, and easy return visibility for every order.</p>
            </div>
          </aside>
        </section>

        <section className="os-stats" aria-label="Order summary stats">
          <div className="os-stat"><span>Total Orders</span><strong>{stats.total}</strong></div>
          <div className="os-stat"><span>Active Orders</span><strong>{stats.active}</strong></div>
          <div className="os-stat"><span>Delivered</span><strong>{stats.delivered}</strong></div>
          <div className="os-stat"><span>Total Spend</span><strong>{money(stats.spend)}</strong></div>
        </section>

        <section className="os-panel">
          <div className="os-toolbar">
            <label className="os-search">
              <Icon name="search" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search by order id, product, metal or payment..."
              />
            </label>
            <div className="os-filters">
              {STATUS_FILTERS.map(status => (
                <button
                  key={status}
                  type="button"
                  className={`os-filter ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All' : STATUS_META[status].label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="os-list">
              {[1, 2, 3].map(i => (
                <article key={i} className="os-order-card" style={{ opacity: 0.9 }}>
                  <div className="os-order-main">
                    <div className="os-product-media bb-skel" style={{ width: 80, height: 80, borderRadius: 12 }} />
                    <div style={{ width: '100%' }}>
                      <div className="bb-skel" style={{ width: '30%', height: 12, marginBottom: 8 }} />
                      <div className="bb-skel" style={{ width: '65%', height: 18, marginBottom: 10 }} />
                      <div className="bb-skel" style={{ width: '45%', height: 14 }} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="os-empty">
              <div className="os-empty-inner">
                <div className="os-empty-icon"><Icon name="bag" size={30} /></div>
                <h2>No Orders Found</h2>
                <p>{orders.length ? 'Try a different status or search term.' : 'Your first jewellery purchase will appear here after checkout.'}</p>
                <button className="os-primary-btn" type="button" onClick={() => navigate('/collection/all')}>
                  Explore Jewellery <Icon name="arrow" size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="os-list">
              {filteredOrders.map((order, index) => {
                const meta = STATUS_META[order.status] || STATUS_META.pending
                const isOpen = selectedOrderId === order.id
                const image = getImageUrl(order.product_image_url)
                const payment = PAYMENT_LABELS[order.payment_method] || titleCase(order.payment_method || 'Payment')

                return (
                  <article
                    key={order.id}
                    className={`os-order-card ${isOpen ? 'open' : ''}`}
                    style={{ animationDelay: `${index * 0.045}s` }}
                    onClick={() => {
                      const opening = !isOpen
                      setSelectedOrderId(opening ? order.id : null)
                      if (opening) fetchTracking(order.order_id || order.id)
                    }}
                  >
                    <div className="os-order-main">
                      <div className="os-product-media">
                        {image ? <img src={image} alt={order.product_name || 'Jewellery order'} /> : <Icon name="bag" size={34} />}
                      </div>

                      <div>
                        <div className="os-tag-row">
                          <span className="os-tag">{order.product_metal || 'Jewellery'} {order.product_grade ? `- ${order.product_grade}` : ''}</span>
                          <span className="os-date">{formatDate(order.created_at)}</span>
                        </div>
                        <h2 className="os-order-title">{order.product_name || 'Jewellery Order'}</h2>
                        <div className="os-order-meta">
                          <span><Icon name="box" size={14} /> Qty: {order.quantity || 1}</span>
                          <span><Icon name="card" size={14} /> {payment}</span>
                          <span><Icon name="truck" size={14} /> Insured shipping</span>
                        </div>
                      </div>

                      <div className="os-price-block">
                        <strong>{money(order.total_price)}</strong>
                        <span
                          className="os-status"
                          style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.tone }}
                        >
                          <span style={{ fontSize: '11px', lineHeight: 1 }}>{meta.icon}</span> {meta.label}
                        </span>
                      </div>

                      <div className="os-chevron"><Icon name="chevron" /></div>
                    </div>

                    <div className="os-order-strip">
                      <span>Order ID: <strong>{order.order_id || order.id}</strong></span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span>Category: <strong>{titleCase(order.product_category || 'Jewellery')}</strong></span>
                        <button
                          type="button"
                          className="os-receipt-btn"
                          disabled={downloadingId === (order.order_id || order.id)}
                          onClick={event => handleDownloadReceipt(event, order.order_id || order.id)}
                        >
                          {downloadingId === (order.order_id || order.id) ? 'Preparing...' : 'Download Receipt'}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="os-expanded" onClick={event => event.stopPropagation()}>
                        <OrderTimeline
                          status={order.status}
                          events={trackingByOrder[order.order_id || order.id]}
                          loading={trackingLoading[order.order_id || order.id]}
                        />

                        <div className="os-expanded-grid">
                          <div className="os-detail-card">
                            <div className="os-detail-title"><Icon name="truck" size={15} /> Delivery Address</div>
                            <div className="os-address-name">{order.customer_name || 'Customer'}</div>
                            <div className="os-muted-lines">
                              Phone: {order.customer_phone || '-'}{order.customer_alt_phone ? ` / ${order.customer_alt_phone}` : ''}<br />
                              {[order.address_line1, order.address_line2].filter(Boolean).join(', ') || 'Address not available'}<br />
                              {[order.city, order.state].filter(Boolean).join(', ')} {order.pincode ? `- ${order.pincode}` : ''}
                            </div>
                          </div>

                          <div className="os-detail-card">
                            <div className="os-detail-title"><Icon name="card" size={15} /> Price Details</div>
                            <div className="os-price-row"><span>Unit price</span><b>{money(order.unit_price)}</b></div>
                            <div className="os-price-row"><span>Quantity</span><b>x {order.quantity || 1}</b></div>
                            <div className="os-price-row"><span>GST</span><b>Included</b></div>
                            <div className="os-price-row"><span>Shipping</span><b style={{ color: '#16764F' }}>Free insured</b></div>
                            <div className="os-price-row os-total-row"><b>Total paid</b><b>{money(order.total_price)}</b></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {selectedOrder && null}
      </main>

      <CustomerFooter />
    </div>
  )
}

