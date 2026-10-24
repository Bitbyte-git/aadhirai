import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import CustomerNavbar from '../collection/CustomerNavbar'
import CustomerFooter from '../collection/CustomerFooter'

const WEIGHTS = [
  { label: 'All Weights', grams: null },
  { label: '50 mg', grams: 0.05 },
  { label: '100 mg', grams: 0.10 },
  { label: '150 mg', grams: 0.15 },
  { label: '200 mg', grams: 0.20 },
  { label: '500 mg', grams: 0.50 },
  { label: '1 gm', grams: 1 },
  { label: '2 gm', grams: 2 },
  { label: '4 gm', grams: 4 },
  { label: '8 gm', grams: 8 },
]

// const GOLD_RINGS = [
//   { id: 1, name: 'Blossom Ring', desc: 'Floral petal design with a vintage soul', img: '/img/gold/gold-ring-1.png', tag: 'Bestseller' },
//   { id: 2, name: 'Solitaire Twist', desc: 'Classic twisted shank with a brilliant center stone', img: '/img/gold/gold-ring-2.png', tag: 'Bridal' },
//   { id: 3, name: 'Eternity Band', desc: 'Seamless band with continuous diamond-cut detailing', img: '/img/gold/gold-ring-3.png', tag: 'Premium' },
//   { id: 4, name: 'Crown Solitaire', desc: 'Six-prong crown setting for the statement piece', img: '/img/gold/gold-ring-4.png', tag: 'Statement' },
//   { id: 5, name: 'Duo Stack Ring', desc: 'Double-band stackable ring for everyday elegance', img: '/img/gold/gold-ring-5.png', tag: 'Stackable' },
// ]




const TAG_COLORS = {
  Bestseller: { bg: 'rgba(52,211,153,0.2)', border: 'rgba(52,211,153,0.5)', color: '#34d399' },
  Bridal: { bg: 'rgba(244,114,182,0.2)', border: 'rgba(244,114,182,0.5)', color: '#f472b6' },
  Premium: { bg: 'rgba(251,191,36,0.2)', border: 'rgba(251,191,36,0.5)', color: '#fbbf24' },
  Statement: { bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.5)', color: '#a78bfa' },
  Stackable: { bg: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.5)', color: '#22d3ee' },
}


export default function GoldRings() {
  const navigate = useNavigate()
  const [selectedWeight] = useState('All Weights')
  const [hoveredRing, setHoveredRing] = useState(null)
  const [metalType] = useState('22k')   // '22k' | '24k'
  const [metalPrices] = useState({ gold22k: null, gold24k: null })
  const [goldRings, setGoldRings] = useState([])
  const [loading, setLoading] = useState(true)
  const [liveRate, setLiveRate] = useState(null)
  const [wishlistedIds, setWishlistedIds] = useState(new Set())
  useState(null);


const bg = '#FDF5EE'
const text = '#020617'
const subtext = '#64748b'








  const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

  const getImageUrl = (img) => {
    if (!img) return '/img/gold/gold-ring-1.png'

    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img
    }

    return `${API_BASE}/${img.replace(/^\/+/, '')}`
  }

  // Try to get prices from API (optional — works even without)
  // Add this useEffect in GoldRings.jsx (after the metalPrices useEffect)
  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/jewelry-products/?category=rings&metal=gold')
        .then(res => {
          console.log('PRODUCT DATA:', res.data)
          console.log('FIRST IMAGE:', res.data?.[0]?.images?.[0]?.image)
          setGoldRings(res.data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [])

  useEffect(() => {
  import('../api').then(({ default: api }) => {
    api.get('/metal-rates/').then(res => {
      const d = res.data
      setLiveRate({
        gold_22k: parseFloat(d.gold_22k) || 0,
        gold_24k: parseFloat(d.gold_24k) || 0,
      })
    }).catch(() => {})
  })
}, [])

  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/wishlist/').then(res => {
        setWishlistedIds(new Set(res.data.items.map(i => i.product_id)))
      }).catch(() => {})
    })
  }, [])

  const toggleWishlist = async (e, productId) => {
    e.stopPropagation()
    const api = (await import('../api')).default
    try {
      const res = await api.post('/wishlist/', { product_id: productId })
      setWishlistedIds(prev => {
        const next = new Set(prev)
        if (res.data.action === 'added') next.add(productId)
        else next.delete(productId)
        return next
      })
      window.dispatchEvent(new Event('bb_wishlist_update'))
    } catch { /* No additional action is needed in this fallback. */ }
  }


  const currentRate = metalType === '22k' ? metalPrices.gold22k : metalPrices.gold24k
  const selectedW = WEIGHTS.find(w => w.label === selectedWeight)
  ;(selectedW?.grams && currentRate ? selectedW.grams * currentRate : null);

  const tagStyle = (tag) => TAG_COLORS[tag] || { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)', color: '#fff' }

return (
<div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: '"Montserrat", sans-serif', position: 'relative', overflow: 'hidden' }}>
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,700;1,700&family=Montserrat:wght@400;500;600;700&display=swap');

      /* ── SCROLLBAR STYLE ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #FDF5EE; }
::-webkit-scrollbar-thumb { background: #edd3a3; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #f3d54f; }  
      @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      @keyframes goldShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(251,191,36,0.1)} 50%{box-shadow:0 0 40px rgba(251,191,36,0.35)} }
      @keyframes shine { 0%{left:-80%} 100%{left:120%} }
      .ring-card { animation: fadeInUp 0.5s ease both; }
      .ring-card:nth-child(1){animation-delay:0.05s} .ring-card:nth-child(2){animation-delay:0.12s}
      .ring-card:nth-child(3){animation-delay:0.19s} .ring-card:nth-child(4){animation-delay:0.26s}
      .ring-img-wrap { overflow:hidden; }
      .ring-img-wrap img { transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1); }
      .ring-card:hover .ring-img-wrap img { transform:scale(1.12) translateY(-4px) !important; }
@keyframes fadeImg { from{opacity:0;transform:scale(1.03)} to{opacity:1;transform:scale(1)} }

    `}</style>
    <CustomerNavbar />
{/* ── Category Banner ── */}
<div style={{ width:'100%', position:'relative', marginBottom:'32px' }}>
  <img
    src="/banners/gold_ring.png"
    alt="Gold Rings Banner"
    style={{ width:'100%', height:'auto', display:'block' }}
  />
  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
</div>

<div style={{ position: 'relative', zIndex: 10, padding: '0px 40px', maxWidth: '100%', margin: '0 auto' }}>

        {/* Page Header */}
        {/* <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', animation: 'fadeInUp 0.4s ease both' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '20px', padding: '5px 14px', marginBottom: '14px' }}>
              <span className="sparkle-dot" style={{ color: goldColor, fontSize: '11px' }}>✦</span>
              <span style={{ color: goldColor, fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Premium Gold Collection</span>
            </div>
<h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, letterSpacing: '-0.5px', fontFamily: '"Playfair Display", Georgia, serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="19" r="8"/>
    <circle cx="16" cy="19" r="4.5"/>
    <path d="M13 11l-2-4h10l-2 4"/>
  </svg>
  <span style={{ background: `linear-gradient(90deg,#f59e0b,#fbbf24,#ffd700)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'goldShimmer 3s linear infinite' }}>Gold Rings</span>
</h1>
            <p style={{ color: subtext, fontSize: '13px', margin: '8px 0 0', fontWeight: 500 }}>{goldRings.length} exclusive designs · Handcrafted excellence</p>
          </div>

        </div> */}


        {/* Ring Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
          {loading ? (
            <div style={{
              gridColumn: 'span 3', textAlign: 'center',
              color: subtext, padding: '60px 0', fontSize: '15px'
            }}>
              ⏳ Loading products...
            </div>
          ) : goldRings.length === 0 ? (
            <div style={{
              gridColumn: 'span 3', textAlign: 'center',
              color: subtext, padding: '60px 0', fontSize: '15px'
            }}>
              No gold rings added yet.
            </div>
          ) : (
  goldRings.map((ring) => {
    const isHovered = hoveredRing === ring.id
    ;(tagStyle(ring.tag));

    return (
// AFTER (AllCollection style card)
<div
  key={ring.id}
  className="ring-card"
  onClick={() => navigate(`/product-display?category=rings&metal=gold&id=${ring.id}`)}
  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; setHoveredRing(ring.id) }}
  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; setHoveredRing(null) }}
  style={{
    background: '#fffdfa',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
    marginBottom: '25px'
  }}
>
  {/* Image Section */}
  <div style={{ height: 300, background: '#f4f0ea', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

    {ring.tag && (
      <div style={{ position: 'absolute', top: 12, left: 0, background: '#1a1a1a', color: '#d4af37', padding: '5px 14px 5px 12px', fontSize: 11, fontWeight: 500, letterSpacing: '0.5px', clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)', zIndex: 2 }}>
        {ring.tag}
      </div>
    )}

    <button
      onClick={e => toggleWishlist(e, ring.id)}
      style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', border: wishlistedIds.has(ring.id) ? '1.5px solid #e11d48' : '1px solid #ddd', background: wishlistedIds.has(ring.id) ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, zIndex: 2 }}
    >
      {wishlistedIds.has(ring.id) ? '❤️' : '🤍'}
    </button>

    {ring.images?.length > 0
      ? <img
          key={isHovered ? 1 : 0}
          src={getImageUrl(isHovered && ring.images.length > 1 ? ring.images[1]?.image : ring.images[0]?.image)}
          alt={ring.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: 14, boxSizing: 'border-box', animation: 'fadeImg 0.5s ease' }}
          onError={e => e.currentTarget.style.display = 'none'}
        />
      : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 44 }}>💍</div>
    }

    <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 16, color: '#999', zIndex: 2 }}>🔗</div>
  </div>

  {/* Price + Name Section */}
<div style={{ padding: '12px 14px' }}>
  {(() => {
    const calcPrice = (p) => {
      const netWt = parseFloat(p.net_weight) || 0
      const makingPct = parseFloat(p.making_charge) || 0
      const discPct = parseFloat(p.wastage_charge) || 0
      const stoneVal = parseFloat(p.stone_value) || 0
      const rate = p.grade === '24k' ? (liveRate?.gold_24k || 0) : (liveRate?.gold_22k || 0)
      if (!rate || !netWt) return parseFloat(p.price) || 0
      const making = rate * (makingPct / 100)
      const rateWithMaking = rate + making
      const disc = rateWithMaking * (discPct / 100)
      return Math.round(((netWt * (rateWithMaking - disc)) + stoneVal) * 1.03)
    }
    const calcOriginal = (p) => {
      const netWt = parseFloat(p.net_weight) || 0
      const makingPct = parseFloat(p.making_charge) || 0
      const stoneVal = parseFloat(p.stone_value) || 0
      const rate = p.grade === '24k' ? (liveRate?.gold_24k || 0) : (liveRate?.gold_22k || 0)
      if (!rate || !netWt) return parseFloat(p.original_price) || 0
      const making = rate * (makingPct / 100)
      return Math.round(((netWt * (rate + making)) + stoneVal) * 1.03)
    }
    const price = calcPrice(ring)
    const originalAmt = calcOriginal(ring)
    const discountPct = parseFloat(ring.wastage_charge) || 0
    const hasDiscount = discountPct > 0 && originalAmt > price && price > 0
    return <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
       <span style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>
      {price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'}
    </span>
    {hasDiscount && (
      <span style={{ fontSize: 15, color: '#999', textDecoration: 'line-through' }}>
        ₹{originalAmt.toLocaleString('en-IN')}
      </span>
    )}
  </div>
  {hasDiscount && (
    <div style={{ fontSize: 12, color: '#8a6d2f', fontWeight: 600, letterSpacing: '0.3px', marginTop: 7, marginBottom: 6 }}>
      {discountPct}% OFF
    </div>
  )}
    </>
  })()}
  <div style={{ fontSize: 18, color: '#1a1a1a', fontWeight: 600,
    fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{ring.name}
  </div>
</div>
</div>
            )
          })
        )}
        </div>


      </div>


              {/* ── FOOTER ── */}
              <CustomerFooter />

    </div>
  )
}