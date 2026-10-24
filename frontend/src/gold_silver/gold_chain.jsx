import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { addToCart } from "../api.js";
import CustomerNavbar from '../collection/CustomerNavbar'
import CustomerFooter from '../collection/CustomerFooter'

const WEIGHTS = [
  { label: 'All Weights', grams: null },
  { label: '50 mg', grams: 0.05 },
  { label: '100 mg', grams: 0.1 },
  { label: '150 mg', grams: 0.15 },
  { label: '200 mg', grams: 0.2 },
  { label: '500 mg', grams: 0.5 },
  { label: '1 gm', grams: 1 },
  { label: '2 gm', grams: 2 },
  { label: '4 gm', grams: 4 },
  { label: '8 gm', grams: 8 },
]

const GOLD_CHAINS = [
  { id: 1, name: 'Classic Gold Link', desc: 'Elegant classic chain with smooth gold finishing', img: '/img/gold/gold chain-1.png', tag: 'Bestseller' },
  { id: 2, name: 'Royal Rope Chain', desc: 'Premium rope-style chain for festive and daily wear', img: '/img/gold/gold chain-2.png', tag: 'Premium' },
  { id: 3, name: 'Floral Pendant Chain', desc: 'Modern chain with rich shine and handcrafted detail', img: '/img/gold/gold chain-3.png', tag: 'Statement' },
  { id: 4, name: 'Minimal Daily Chain', desc: 'Lightweight gold chain for everyday elegance', img: '/img/gold/gold chain-4.png', tag: 'Minimal' },
  { id: 5, name: 'Heritage Gold Chain', desc: 'Traditional gold chain with premium polished look', img: '/img/gold/gold chain-5.png', tag: 'New' },
]

const TAG_COLORS = {
  Bestseller: { bg: 'rgba(52,211,153,0.2)', border: 'rgba(52,211,153,0.5)', color: '#34d399' },
  Premium: { bg: 'rgba(251,191,36,0.22)', border: 'rgba(251,191,36,0.55)', color: '#fbbf24' },
  Minimal: { bg: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.5)', color: '#22d3ee' },
  Statement: { bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.5)', color: '#a78bfa' },
  New: { bg: 'rgba(244,114,182,0.2)', border: 'rgba(244,114,182,0.5)', color: '#f472b6' },
}

export default function GoldChain() {
  const navigate = useNavigate()
  const [selectedWeight] = useState('All Weights')
  const [hoveredItem, setHoveredItem] = useState(null)
  const [goldPrice] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [goldChains, setGoldChains] = useState([])
  const [loading, setLoading] = useState(true)
  const [liveRate, setLiveRate] = useState(null)
  const [wishlistedIds, setWishlistedIds] = useState(new Set())


const bg = '#FDF5EE'
const text = '#020617'
const subtext = '#64748b'




const goldColor = '#fbbf24'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'
const getImageUrl = (img) => {
  if (!img) return '/img/gold/gold chain-1.png'
  if (img.startsWith('http://') || img.startsWith('https://')) return img
  return `${API_BASE}/${img.replace(/^\/+/, '')}`
}
useEffect(() => {
  import('../api').then(({ default: api }) => {
    api.get('/jewelry-products/?category=chains&metal=gold')
      .then(res => { setGoldChains(res.data); setLoading(false) })
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

  const selectedW = WEIGHTS.find(w => w.label === selectedWeight)
  ;(selectedW?.grams && goldPrice ? selectedW.grams * goldPrice : null);
  const tagStyle = tag => TAG_COLORS[tag] || { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)', color: '#fff' }

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
      .gc-card { animation: fadeInUp 0.5s ease both; }
      .gc-card:nth-child(1){animation-delay:0.05s} .gc-card:nth-child(2){animation-delay:0.12s}
      .gc-card:nth-child(3){animation-delay:0.19s} .gc-card:nth-child(4){animation-delay:0.26s}
      .gc-img-wrap { overflow:hidden; }
      .gc-img-wrap img { transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1); }
      .gc-card:hover .gc-img-wrap img { transform:scale(1.12) translateY(-4px) !important; }
      @keyframes fadeImg { from{opacity:0;transform:scale(1.03)} to{opacity:1;transform:scale(1)} }
    `}</style>
    <CustomerNavbar />

    {/* ── Category Banner ── */}
<div style={{ width:'100%', position:'relative', marginBottom:'32px' }}>
  <img
    src="/banners/gold_chian.png"
    alt="Gold Chain Banner"
    style={{ width:'100%', height:'auto', display:'block' }}
  />
  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
</div>

      <div style={{ position: 'relative', zIndex: 10, padding: '0 40px', maxWidth: '100%', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px' }}>
          {loading ? (
  <div style={{ gridColumn:'span 3', textAlign:'center', color:subtext, padding:'60px 0' }}>⏳ Loading...</div>
) : goldChains.length === 0 ? (
  <div style={{ gridColumn:'span 3', textAlign:'center', color:subtext, padding:'60px 0' }}>No gold chains yet.</div>
) : 
goldChains.map((product) => {
  const images = product.images?.map(img => {
    const src = typeof img === 'object' ? (img.image || '') : img
    if (!src) return null
    if (src.startsWith('http')) return src
    return `${API_BASE}/${src.replace(/^\/+/, '')}`
  }).filter(Boolean) || []
  const isHovered = hoveredItem === product.id
  const displayIndex = isHovered && images.length > 1 ? 1 : 0
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
const price = calcPrice(product)
const originalAmt = calcOriginal(product)
const discountPct = parseFloat(product.wastage_charge) || 0
const hasDiscount = discountPct > 0 && originalAmt > price && price > 0

  return (
    <div key={product.id} className="gc-card"
      onClick={() => navigate(`/product-display?category=chains&metal=gold&id=${product.id}`)}
      onMouseEnter={() => setHoveredItem(product.id)}
      onMouseLeave={() => setHoveredItem(null)}
      style={{
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative',
        border: '1px solid rgba(212,175,55,0.25)', background: '#fffdfa',
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
        transition: 'all 0.25s ease', marginBottom: '25px',
      }}
    >
      <div style={{ height: 300, background: '#f4f0ea', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

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
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 44 }}>🪙</div>
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

      {selectedItem && (
        <div onClick={() => setSelectedItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#f8fafc', border: '1px solid rgba(251,191,36,0.35)', borderRadius: '28px', width: '95%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
<img
  src={getImageUrl(selectedItem.images?.[0]?.image)}
  alt={selectedItem.name}
  onError={(e) => { e.currentTarget.src = '/img/gold/gold chain-1.png' }}
  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
/>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(2,6,23,0.9) 0%,transparent 60%)' }} />

              <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: '10px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', backdropFilter: 'blur(8px)' }}>
                ✕ Close
              </button>

              <div style={{ position: 'absolute', top: '16px', left: '16px', background: tagStyle(selectedItem.tag).bg, border: `1px solid ${tagStyle(selectedItem.tag).border}`, borderRadius: '20px', padding: '5px 14px', color: tagStyle(selectedItem.tag).color, fontSize: '11px', fontWeight: 800, backdropFilter: 'blur(8px)' }}>
                {selectedItem.tag}
              </div>
            </div>

            <div style={{ padding: '28px 32px' }}>
             <div style={{ color: goldColor, fontWeight: 900, fontSize: '24px', marginBottom: '6px', fontFamily: '"Playfair Display", Georgia, serif' }}>{selectedItem.name}</div>
              <div style={{ color: subtext, fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>{selectedItem.description}</div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
  <button
    onClick={() => {
      addToCart({
        id: selectedItem.id,
        name: selectedItem.name,
        desc: selectedItem.description,
        img: getImageUrl(selectedItem.images?.[0]?.image),
        tag: selectedItem.tag,
        metal: 'gold_22k',
        metalLabel: 'Gold 22K',
        ringType: 'Gold Chain',
      })

      setSelectedItem(null)
      navigate('/cart')
    }}
    style={{
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
      border: 'none',
      borderRadius: '14px',
      color: '#000',
      fontWeight: 900,
      fontSize: '14px',
      cursor: 'pointer',
    }}
  >
    🛒 Add to Cart
  </button>

  <button
    onClick={() => {
      setSelectedItem(null)
      navigate('/customer')
    }}
    style={{
      width: '100%',
      padding: '12px',
      background: 'rgba(251,191,36,0.08)',
      border: '1px solid rgba(251,191,36,0.3)',
      borderRadius: '14px',
      color: '#fbbf24',
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
    }}
  >
    ⚡ Place Order on Dashboard
  </button>
</div>
            </div>
          </div>
        </div>
      )}

              {/* ── FOOTER ── */}
              <CustomerFooter />
    </div>
  )
}