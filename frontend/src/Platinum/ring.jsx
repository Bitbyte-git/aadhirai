import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerNavbar from '../collection/CustomerNavbar'
import CustomerFooter from '../collection/CustomerFooter'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const TAG_COLORS = {
  Bestseller: { bg: 'rgba(52,211,153,0.2)', border: 'rgba(52,211,153,0.5)', color: '#34d399' },
  Bridal: { bg: 'rgba(244,114,182,0.2)', border: 'rgba(244,114,182,0.5)', color: '#f472b6' },
  Premium: { bg: 'rgba(226,232,240,0.2)', border: 'rgba(226,232,240,0.5)', color: '#e2e8f0' },
  Statement: { bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.5)', color: '#a78bfa' },
  New: { bg: 'rgba(244,114,182,0.2)', border: 'rgba(244,114,182,0.5)', color: '#f472b6' },
  Limited: { bg: 'rgba(226,232,240,0.15)', border: 'rgba(226,232,240,0.4)', color: '#e2e8f0' },
}

const ACCENT = '#e2e8f0'
const ACCENT_GLOW = 'rgba(226,232,240,0.28)'

export default function PlatinumRings() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState(null)
  const [wishlistedIds, setWishlistedIds] = useState(new Set())
  const [gradeFilter] = useState('all')
  const [liveRate, setLiveRate] = useState(null)

  const getImageUrl = (img) => {
    if (!img) return null
    const src = typeof img === 'object' ? (img.image || '') : img
    if (!src) return null
    if (src.startsWith('http')) return src
    return `${API_BASE}/${src.replace(/^\/+/, '')}`
  }



  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/jewelry-products/?category=rings&metal=platinum')
        .then(res => { setProducts(Array.isArray(res.data) ? res.data : []); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [])

  useEffect(() => {
  import('../api').then(({ default: api }) => {
    api.get('/metal-rates/').then(res => {
      const d = res.data
      setLiveRate({
        platinum_92: parseFloat(d.platinum_92) || 0,
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
        res.data.action === 'added' ? next.add(productId) : next.delete(productId)
        return next
      })
      window.dispatchEvent(new Event('bb_wishlist_update'))
    } catch { /* No additional action is needed in this fallback. */ }
  }

  const filteredProducts = gradeFilter === 'all' ? products : products.filter(p => p.grade === gradeFilter)
  const GRADES = ['all', '92']

  return (
    <div style={{ minHeight: '100vh', background: '#FDF5EE', fontFamily: '"Montserrat", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,700;1,700&family=Montserrat:wght@400;500;600;700&display=swap');

        /* ── SCROLLBAR STYLE ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #FDF5EE; }
::-webkit-scrollbar-thumb { background: #edd3a3; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #f3d54f; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes shine { 0%{left:-80%} 100%{left:120%} }
        .dm-card { animation: fadeInUp 0.5s ease both; }
        .dm-card:nth-child(1){animation-delay:0.05s} .dm-card:nth-child(2){animation-delay:0.10s}
        .dm-card:nth-child(3){animation-delay:0.15s} .dm-card:nth-child(4){animation-delay:0.20s}
        .dm-card:nth-child(5){animation-delay:0.25s} .dm-card:nth-child(6){animation-delay:0.30s}
        .dm-img-wrap img { transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        .dm-card:hover .dm-img-wrap img { transform:scale(1.1) translateY(-4px) !important; }
        .dm-shine { position:absolute;top:0;left:-80%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(226,232,240,0.15),transparent);transform:skewX(-20deg);opacity:0; }
        .dm-card:hover .dm-shine { opacity:1; animation:shine 0.6s ease; }
      `}</style>

<CustomerNavbar />

{/* ── Category Banner ── */}
<div style={{ width:'100%', position:'relative', marginBottom:'32px' }}>
  <img src="/banners/platinum_ring.png" alt="Platinum Bangles Banner"
    style={{ width:'100%', height:'auto', display:'block' }} />
  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
</div>

<div style={{ padding: '0px 40px', maxWidth: '100%', margin: '0 auto' }}>

        {/* <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(226,232,240,0.08)', border: '1px solid rgba(226,232,240,0.25)', borderRadius: '20px', padding: '5px 14px', marginBottom: '14px' }}>
              <span style={{ color: ACCENT, fontSize: '11px' }}>✦</span>
              <span style={{ color: ACCENT, fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Premium Platinum Collection</span>
            </div>
<h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, letterSpacing: '-0.5px', color: '#020617', fontFamily: '"Playfair Display", Georgia, serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="19" r="8"/>
    <circle cx="16" cy="19" r="4.5"/>
    <path d="M13 11l-2-4h10l-2 4"/>
  </svg>
  <span style={{ background: 'linear-gradient(90deg,#e2e8f0,#fff,#e2e8f0)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 3s linear infinite' }}>
    Platinum Rings
  </span>
</h1>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '8px 0 0', fontWeight: 500 }}>
              {filteredProducts.length} exclusive designs
            </p>
          </div>
        </div> */}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
          {loading ? (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', color: '#64748b', padding: '60px 0' }}>⏳ Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', color: '#64748b', padding: '60px 0' }}>No platinum rings found.</div>
          ) : filteredProducts.map((product) => {
const images = product.images?.map(img => getImageUrl(img)).filter(Boolean) || []
const isHovered = hovered === product.id
const displayIndex = isHovered && images.length > 1 ? 1 : 0
const calcPrice = (p) => {
  const netWt = parseFloat(p.net_weight) || 0
  const makingPct = parseFloat(p.making_charge) || 0
  const discPct = parseFloat(p.wastage_charge) || 0
  const stoneVal = parseFloat(p.stone_value) || 0
  const rate = liveRate?.platinum_92 || 0
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
  const rate = liveRate?.platinum_92 || 0
  if (!rate || !netWt) return parseFloat(p.original_price) || 0
  const making = rate * (makingPct / 100)
  return Math.round(((netWt * (rate + making)) + stoneVal) * 1.03)
}

const price = calcPrice(product)
const originalAmt = calcOriginal(product)
const discountPct = parseFloat(product.wastage_charge) || 0
const hasDiscount = discountPct > 0 && originalAmt > price && price > 0

return (
  <div key={product.id} className="dm-card"
    onClick={() => navigate(`/product-display?category=rings&metal=platinum&id=${product.id}`)}
    onMouseEnter={() => setHovered(product.id)}
    onMouseLeave={() => setHovered(null)}
    style={{
      borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative',
      border: '1px solid #e8e8e8', background: '#fff',
      boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'all 0.25s ease', marginBottom: '75px',
    }}>
  <div className="dm-img-wrap" style={{ height: 280, background: '#f0f0f0', position: 'relative', overflow: 'hidden', marginBottom: 10 }}>
    {product.tag && (
      <div style={{ position: 'absolute', top: 12, left: 0, background: '#2ecc71', color: '#fff', padding: '5px 12px 5px 10px', fontSize: 11, fontWeight: 700, clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)', zIndex: 2 }}>
        {product.tag}
      </div>
    )}
    <button onClick={e => toggleWishlist(e, product.id)}
      style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', border: wishlistedIds.has(product.id) ? '1.5px solid #e11d48' : '1px solid #ddd', background: wishlistedIds.has(product.id) ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, zIndex: 2 }}>
      {wishlistedIds.has(product.id) ? '❤️' : '🤍'}
    </button>
    {images.length > 0
      ? <img src={images[displayIndex]} alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease' }}
          onError={e => e.currentTarget.style.display = 'none'} />
      : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 44 }}>⬡</div>
    }
    <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 16, color: '#999', zIndex: 2 }}>🔗</div>
  </div>
<div style={{ padding: '12px 14px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
    <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>
      {price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'}
    </span>
    {hasDiscount && (
      <span style={{ fontSize: 15, color: '#999', textDecoration: 'line-through' }}>
        ₹{originalAmt.toLocaleString('en-IN')}
      </span>
    )}
  </div>
  {hasDiscount && (
    <div style={{ fontSize: 13, color: '#2ecc71', fontWeight: 700, marginBottom: 6 }}>
      {discountPct}% Off
    </div>
  )}
  <div style={{ fontSize: 18, color: '#1a1a1a', fontWeight: 600,
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