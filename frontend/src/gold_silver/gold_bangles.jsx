import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import CustomerNavbar from '../collection/CustomerNavbar'
import CustomerFooter from '../collection/CustomerFooter'


const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i, size: Math.random() * 50 + 8, x: Math.random() * 100,
  delay: Math.random() * 8, duration: Math.random() * 12 + 15, opacity: Math.random() * 0.18 + 0.04,
}))

const WEIGHTS = [
  { label: 'All Weights', grams: null },
  { label: '50 mg',  grams: 0.05 },
  { label: '100 mg', grams: 0.10 },
  { label: '150 mg', grams: 0.15 },
  { label: '200 mg', grams: 0.20 },
  { label: '500 mg', grams: 0.50 },
  { label: '1 gm',   grams: 1    },
  { label: '2 gm',   grams: 2    },
  { label: '4 gm',   grams: 4    },
  { label: '8 gm',   grams: 8    },
]


const TAG_COLORS = {
  Bestseller: { bg: 'rgba(52,211,153,0.2)',   border: 'rgba(52,211,153,0.5)',   color: '#34d399' },
  Bridal:     { bg: 'rgba(244,114,182,0.2)',  border: 'rgba(244,114,182,0.5)',  color: '#f472b6' },
  Premium:    { bg: 'rgba(251,191,36,0.25)',  border: 'rgba(251,191,36,0.6)',   color: '#fbbf24' },
  Statement:  { bg: 'rgba(167,139,250,0.2)',  border: 'rgba(167,139,250,0.5)',  color: '#a78bfa' },
  Minimal:    { bg: 'rgba(34,211,238,0.2)',   border: 'rgba(34,211,238,0.5)',   color: '#22d3ee' },
  Stackable:  { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)',   color: '#ffd700' },
}

export default function GoldBangles() {
  const navigate = useNavigate()
  
  const [selectedWeight] = useState('All Weights')
  const [hoveredBangle, setHoveredBangle]   = useState(null)
  const [goldPrice]           = useState(null)
  useState(null);
  const [goldBangles, setGoldBangles] = useState([])
const [loading, setLoading] = useState(true)
const [liveRate, setLiveRate] = useState(null)
  const [metalType]           = useState('gold_22k') // '22k' | '24k'
  const [wishlistedIds, setWishlistedIds] = useState(new Set())
 

const bg        = '#fdf6f0'
const text      = '#020617'
const subtext   = '#64748b'







  ;(metalType === 'gold_24k' ? '#ffd700' : '#fbbf24');
  (metalType === 'gold_24k' ? 'rgba(255,215,0,0.28)' : 'rgba(251,191,36,0.28)');

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'



useEffect(() => {
  import('../api').then(({ default: api }) => {
    api.get('/jewelry-products/?category=bangles&metal=gold')
      .then(res => { setGoldBangles(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  })
}, [])

useEffect(() => {
  import('../api').then(({ default: api }) => {
    api.get('/metal-rates/').then(res => {
      const d = res.data
      setLiveRate({
        diamond_18k: parseFloat(d.diamond_18k) || 0,
        diamond_22k: parseFloat(d.diamond_22k) || 0,
      })
    }).catch(() => {})
  })
}, [])

useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/wishlist/').then(res => {
        const ids = new Set(res.data.items.map(i => i.product_id))
        setWishlistedIds(ids)
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
    } catch (err) { console.error(err) }
  }



  const currentRate = goldPrice ? (metalType === 'gold_24k' ? goldPrice.gold24k : goldPrice.gold22k) : null


  



  /* ── helpers ── */
  const selectedW  = WEIGHTS.find(w => w.label === selectedWeight)
  ;(selectedW?.grams && currentRate ? selectedW.grams * currentRate : null);


  return (
<div style={{ minHeight:'100vh', background:bg, color:text, fontFamily:'"Montserrat", sans-serif', position:'relative', overflow:'hidden', transition:'background 0.8s ease, color 0.4s ease' }}>
      <style>{`


        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,700;1,700&family=Montserrat:wght@400;500;600;700&display=swap');

          /* ── SCROLLBAR STYLE ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #FDF5EE; }
  ::-webkit-scrollbar-thumb { background: #edd3a3; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #f3d54f; }
        @keyframes float-orb    { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes antigravity  { 0%{transform:translateY(110vh) rotate(0deg);opacity:0} 10%{opacity:var(--op)} 90%{opacity:var(--op)} 100%{transform:translateY(-20vh) rotate(360deg);opacity:0} }
        @keyframes fadeInUp     { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes goldShimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes glow-pulse   { 0%,100%{box-shadow:0 0 20px rgba(251,191,36,0.1)} 50%{box-shadow:0 0 40px rgba(251,191,36,0.4)} }
        @keyframes shine        { 0%{left:-80%} 100%{left:120%} }
        @keyframes fadeImg      { from{opacity:0;transform:scale(1.03)} to{opacity:1;transform:scale(1)} }
        @keyframes sparkle      { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }

        .gb-card { animation: fadeInUp 0.5s ease both; }
        .gb-card:nth-child(1){animation-delay:0.05s}
        .gb-card:nth-child(2){animation-delay:0.10s}
        .gb-card:nth-child(3){animation-delay:0.15s}
        .gb-card:nth-child(4){animation-delay:0.20s}
        .gb-card:nth-child(5){animation-delay:0.25s}
        .gb-card:nth-child(6){animation-delay:0.30s}

        .gb-img-wrap { overflow:hidden; }
        .gb-img-wrap img { transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        .gb-card:hover .gb-img-wrap img { transform:scale(1.12) translateY(-4px) !important; }

        .gb-shine { position:absolute;top:0;left:-80%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,220,100,0.2),transparent);transform:skewX(-20deg);opacity:0;transition:opacity 0.3s; }
        .gb-card:hover .gb-shine { opacity:1; animation:shine 0.6s ease; }

        .sparkle-dot { animation:sparkle 2s ease infinite; }
        .weight-chip { transition:all 0.2s ease; }
        .weight-chip:hover { transform:translateY(-2px); }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
        input[type=number] { -moz-appearance:textfield; appearance:textfield; }
      `}</style>

      

      

      {/* ── Navbar ── */}
<CustomerNavbar />

{/* ── Category Banner ── */}
<div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden', }}>
  <img
src="/banners/gold_bangles.png"
alt="Chain Banner"
    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
  />
  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
  <div style={{ position:'absolute', bottom:40, left:60 }}>
    <div style={{ color:'rgba(255,255,255,0.75)', fontSize:14, marginBottom:6 }}>Home / Bangles</div>
    <div style={{ color:'#fff', fontSize:42, fontWeight:800, fontFamily:'"Playfair Display", Georgia, serif' }}>Bangles</div>
  </div>
</div>


      <div style={{ position:'relative', zIndex:10, padding:'0px 40px', maxWidth:'100%', margin:'0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'32px', animation:'fadeInUp 0.4s ease both', flexWrap:'wrap', gap:'16px' }}>

        </div>


        {/* ── Bangle Cards — 6 cards, 3 columns ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', padding: '0 40px', gap:'20px' }}>
          {loading ? (
  <div style={{ gridColumn:'span 3', textAlign:'center', color:subtext, padding:'60px 0' }}>
    ⏳ Loading products...
  </div>
) : goldBangles.length === 0 ? (
  <div style={{ gridColumn:'span 4', textAlign:'center', color:subtext, padding:'60px 0' }}>
    No gold bangles added yet.
  </div>
) : goldBangles.map((product) => {
  const images = product.images?.map(img => {
    const src = typeof img === 'object' ? (img.image || '') : img
    if (!src) return null
    if (src.startsWith('http')) return src
    return `${API_BASE}/${src.replace(/^\/+/, '')}`
  }).filter(Boolean) || []
  const isHovered = hoveredBangle === product.id
  const displayIndex = isHovered && images.length > 1 ? 1 : 0
const calcPrice = (p) => {
  const netWt = parseFloat(p.net_weight) || 0
  const makingPct = parseFloat(p.making_charge) || 0
  const discPct = parseFloat(p.wastage_charge) || 0
  const stoneVal = parseFloat(p.stone_value) || 0
const rate = p.grade === '24k'
  ? (liveRate?.gold_24k || 0)
  : (liveRate?.gold_22k || 0)
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
const rate = p.grade === '24k'
  ? (liveRate?.gold_24k || 0)
  : (liveRate?.gold_22k || 0)
  if (!rate || !netWt) return parseFloat(p.original_price) || 0
  const making = rate * (makingPct / 100)
  return Math.round(((netWt * (rate + making)) + stoneVal) * 1.03)
}
const price = calcPrice(product)
const originalAmt = calcOriginal(product)
const discountPct = parseFloat(product.wastage_charge) || 0
const hasDiscount = discountPct > 0 && originalAmt > price && price > 0

  return (
    <div key={product.id} className="gb-card"
      onClick={() => navigate(`/product-display?category=bangles&metal=gold&id=${product.id}`)}
      onMouseEnter={() => setHoveredBangle(product.id)}
      onMouseLeave={() => setHoveredBangle(null)}
     style={{
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative',
        border: '1px solid rgba(212,175,55,0.25)', background: '#fffdfa',
        boxShadow: isHovered ? '0 8px 22px rgba(0,0,0,0.1)' : '0 4px 14px rgba(0,0,0,0.06)',
        transition: 'all 0.25s ease', marginBottom: '25px',
      }}>
<div style={{ height: 300, background: '#f4f0ea', position: 'relative', overflow: 'hidden', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product.tag && (
          <div style={{ position: 'absolute', top: 12, left: 0, background: '#1a1a1a', color: '#d4af37', padding: '5px 14px 5px 12px', fontSize: 11, fontWeight: 500, letterSpacing: '0.5px', clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)', zIndex: 2 }}>
            {product.tag}
          </div>
        )}
        <button onClick={e => toggleWishlist(e, product.id)}
          style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', border: wishlistedIds.has(product.id) ? '1.5px solid #e11d48' : '1px solid #ddd', background: wishlistedIds.has(product.id) ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, zIndex: 2 }}>
          {wishlistedIds.has(product.id) ? '❤️' : '🤍'}
        </button>
        {images.length > 0
          ? <img key={displayIndex} src={images[displayIndex]} alt={product.name}
    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: 14, boxSizing: 'border-box', animation: 'fadeImg 0.5s ease' }}
    onError={e => e.currentTarget.style.display = 'none'} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 44 }}>💍</div>
        }
        <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 16, color: '#999', zIndex: 2 }}>🔗</div>
      </div>
<div style={{ padding: '8px 20px' }}>
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
  <div style={{ fontSize: 18, color: '#1a1a1a', fontWeight: 600, marginBottom: 6,
    fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{product.name}
  </div>
</div>
    </div>
  )
})}

        </div>
      </div>

              {/* ── FOOTER ── */}
              <CustomerFooter />
    </div>
  )
}