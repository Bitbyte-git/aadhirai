import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import CustomerNavbar from '../collection/CustomerNavbar'
import CustomerFooter from '../collection/CustomerFooter'

const TAG_COLORS = {
  Bestseller: { bg: 'rgba(52,211,153,0.2)', border: 'rgba(52,211,153,0.5)', color: '#34d399' },
  Minimal:    { bg: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.5)', color: '#22d3ee' },
  Premium:    { bg: 'rgba(192,192,192,0.25)', border: 'rgba(192,192,192,0.6)', color: '#e2e8f0' },
  Statement:  { bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.5)', color: '#a78bfa' },
  Stackable:  { bg: 'rgba(244,114,182,0.2)', border: 'rgba(244,114,182,0.5)', color: '#f472b6' },
  New:        { bg: 'rgba(244,114,182,0.2)', border: 'rgba(244,114,182,0.5)', color: '#f472b6' },
  Limited:    { bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.5)', color: '#a78bfa' },
}

export default function SilverBracelets() {
  const navigate = useNavigate()
  const [hoveredBracelet, setHoveredBracelet] = useState(null)
  const [silverPrice, setSilverPrice] = useState(null)
  const [silverBracelets, setSilverBracelets] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlistedIds, setWishlistedIds] = useState(new Set())

const bg        = '#FDF5EE'
const text      = '#020617'
const subtext   = '#64748b'








  const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

  const getImageUrl = (img) => {
  if (!img) return '/img/silver/silver_bracelet.jpg'
    if (img.startsWith('http://') || img.startsWith('https://')) return img
    return `${API_BASE}/${img.replace(/^\/+/, '')}`
  }

  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/jewelry-products/?category=bracelets&metal=silver')
        .then(res => { setSilverBracelets(res.data); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [])

  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/metal-rates/').then(res => {
        setSilverPrice(parseFloat(res.data.silver_999))
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

  const tagStyle = (tag) => TAG_COLORS[tag] || { bg:'rgba(255,255,255,0.1)', border:'rgba(255,255,255,0.2)', color:'#fff' }

return (
<div style={{ minHeight:'100vh', background:bg, color:text, fontFamily:'"Montserrat", sans-serif', position:'relative', overflow:'hidden' }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,700;1,700&family=Montserrat:wght@400;500;600;700&display=swap');

      /* ── SCROLLBAR STYLE ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #FDF5EE; }
::-webkit-scrollbar-thumb { background: #edd3a3; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #f3d54f; }
      @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      @keyframes silverShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(192,192,192,0.1)} 50%{box-shadow:0 0 40px rgba(192,192,192,0.35)} }
      @keyframes shine { 0%{left:-80%} 100%{left:120%} }
      .sb-card { animation: fadeInUp 0.5s ease both; }
      .sb-card:nth-child(1){animation-delay:0.05s} .sb-card:nth-child(2){animation-delay:0.12s}
      .sb-card:nth-child(3){animation-delay:0.19s} .sb-card:nth-child(4){animation-delay:0.26s}
      .sb-img-wrap { overflow:hidden; }
      .sb-img-wrap img { transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1); }
      .sb-card:hover .sb-img-wrap img { transform:scale(1.12) translateY(-4px) !important; }
      .sb-shine { position:absolute;top:0;left:-80%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);transform:skewX(-20deg);opacity:0;transition:opacity 0.3s; }
      .sb-card:hover .sb-shine { opacity:1; animation:shine 0.6s ease; }
    `}</style>
    <CustomerNavbar />

{/* ── Category Banner ── */}
<div style={{ width:'100%', position:'relative', marginBottom:'32px' }}>
  <img
    src="/banners/silver_bracelet.png"
    alt="Silver Bracelets Banner"
    style={{ width:'100%', height:'auto', display:'block' }}
  />
  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
</div>

<div style={{ position:'relative', zIndex:10, padding:'0px 40px', maxWidth:'100%', margin:'0 auto' }}>

        {/* Page Header */}
        {/* <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'40px', animation:'fadeInUp 0.4s ease both' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(192,192,192,0.08)', border:'1px solid rgba(192,192,192,0.25)', borderRadius:'20px', padding:'5px 14px', marginBottom:'14px' }}>
              <span className="sparkle-dot" style={{ color:silverColor, fontSize:'11px' }}>✦</span>
              <span style={{ color:silverColor, fontSize:'10px', fontWeight:800, letterSpacing:'2px', textTransform:'uppercase' }}>Premium Silver Collection</span>
            </div>
<h1 style={{ margin:0, fontSize:'36px', fontWeight:900, letterSpacing:'-0.5px', fontFamily:'"Playfair Display", Georgia, serif', display:'flex', alignItems:'center', gap:'10px' }}>
  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 12c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
    <path d="M8 20c0 4.4 3.6 8 8 8s8-3.6 8-8"/>
    <rect x="5" y="12" width="6" height="8" rx="2"/>
    <rect x="21" y="12" width="6" height="8" rx="2"/>
  </svg>
  <span style={{ background:'linear-gradient(90deg,#9ca3af,#c0c0c0,#e2e8f0,#c0c0c0)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'silverShimmer 3s linear infinite' }}>
    Silver Bracelets
  </span>
</h1>
            <p style={{ color:subtext, fontSize:'13px', margin:'8px 0 0', fontWeight:500 }}>{silverBracelets.length} exclusive designs · Handcrafted Silver 999</p>
          </div>

          {silverPrice && (
            <div style={{ background:'rgba(192,192,192,0.08)', border:'1px solid rgba(192,192,192,0.25)', borderRadius:'10px', padding:'12px 20px', textAlign:'right' }}>
              <div style={{ color:subtext, fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Live Rate (Silver 999)</div>
              <div style={{ color:silverColor, fontWeight:900, fontSize:'18px', fontFamily:'monospace' }}>₹{silverPrice.toFixed(2)}/gm</div>
            </div>
          )}
        </div> */}

        {/* Bracelet Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'18px' }}>
          {loading ? (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', color: subtext, padding: '60px 0' }}>
              ⏳ Loading products...
            </div>
          ) : silverBracelets.length === 0 ? (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', color: subtext, padding: '60px 0' }}>
              No silver bracelets added yet.
            </div>
          ) : silverBracelets.map((bracelet) => {
            const isHovered = hoveredBracelet === bracelet.id
            ;(tagStyle(bracelet.tag));
            return (
<div
  key={bracelet.id}
  className="sb-card"
  onClick={() => navigate(`/product-display?category=bracelets&metal=silver&id=${bracelet.id}`)}
  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; setHoveredBracelet(bracelet.id) }}
  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; setHoveredBracelet(null) }}
   style={{
    background: '#fffdfa',
    border: '1px solid rgba(192,192,192,0.35)',
    borderRadius: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
    marginBottom: '25px'
  }}
>
<div style={{ height: 300, background: '#f1f1f1', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

  {bracelet.tag && (
<div style={{ position: 'absolute', top: 12, left: 0, background: '#1a1a1a', color: '#c0c0c0', padding: '5px 14px 5px 12px', fontSize: 11, fontWeight: 500, letterSpacing: '0.5px', clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)', zIndex: 2 }}>
      {bracelet.tag}
    </div>
  )}

  <button onClick={e => toggleWishlist(e, bracelet.id)}
    style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', border: wishlistedIds.has(bracelet.id) ? '1.5px solid #e11d48' : '1px solid #ddd', background: wishlistedIds.has(bracelet.id) ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, zIndex: 2 }}>
    {wishlistedIds.has(bracelet.id) ? '❤️' : '🤍'}
  </button>

  {bracelet.images?.length > 0
    ? <img
        key={isHovered ? 1 : 0}
        src={getImageUrl(isHovered && bracelet.images.length > 1 ? bracelet.images[1]?.image : bracelet.images[0]?.image)}
        alt={bracelet.name}
        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: 14, boxSizing: 'border-box', animation: 'fadeImg 0.5s ease' }}
        onError={e => e.currentTarget.style.display = 'none'}
      />
    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 44 }}>⭕</div>
  }

  <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 16, color: '#999', zIndex: 2 }}>🔗</div>
</div>

<div style={{ padding: '12px 14px' }}>
  {(() => {
    const rate = silverPrice || 0
    const netWt = parseFloat(bracelet.net_weight) || 0
    const makingPct = parseFloat(bracelet.making_charge) || 0
    const discPct = parseFloat(bracelet.wastage_charge) || 0
    const stoneVal = parseFloat(bracelet.stone_value) || 0
    const making = rate * (makingPct / 100)
    const rateWithMaking = rate + making
    const disc = rateWithMaking * (discPct / 100)
    const price = (rate && netWt) ? Math.round(((netWt * (rateWithMaking - disc)) + stoneVal) * 1.03) : parseFloat(bracelet.price) || 0
    const originalAmt = (rate && netWt) ? Math.round(((netWt * (rate + making)) + stoneVal) * 1.03) : parseFloat(bracelet.original_price) || 0
    const hasDiscount = discPct > 0 && originalAmt > price && price > 0
    return <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>
          {price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'}
        </span>
        {hasDiscount && <span style={{ fontSize: 15, color: '#999', textDecoration: 'line-through' }}>₹{originalAmt.toLocaleString('en-IN')}</span>}
      </div>
      {hasDiscount && <div style={{ fontSize: 12, color: '#8a6d2f', fontWeight: 600, letterSpacing: '0.3px', marginTop: 7, marginBottom: 6 }}>{discPct}% OFF</div>}
    </>
  })()}
  <div style={{ fontSize: 18, color: '#1a1a1a', fontWeight: 600,
    fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{bracelet.name}
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