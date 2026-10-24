import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { addToCart } from "../api.js";
import CustomerNavbar from '../collection/CustomerNavbar'
import CustomerFooter from '../collection/CustomerFooter'

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
  Antique:    { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)',   color: '#fbbf24' },
  Premium:    { bg: 'rgba(192,192,192,0.25)', border: 'rgba(192,192,192,0.6)',  color: '#e2e8f0' },
  Minimal:    { bg: 'rgba(34,211,238,0.2)',   border: 'rgba(34,211,238,0.5)',   color: '#22d3ee' },
  Stackable:  { bg: 'rgba(167,139,250,0.2)',  border: 'rgba(167,139,250,0.5)',  color: '#a78bfa' },
}

export default function SilverBangles() {
  const navigate = useNavigate()
  const [selectedWeight] = useState('All Weights')
  const [hoveredBangle, setHoveredBangle]   = useState(null)
  const [silverPrice]       = useState(null)
  const [selectedBangle, setSelectedBangle] = useState(null)
  const [silverBangles, setSilverBangles] = useState([])
  const [loading, setLoading] = useState(true)
  const [liveRate, setLiveRate] = useState(null)
  const [wishlistedIds, setWishlistedIds] = useState(new Set())

const bg        = '#FDF5EE'
const text      = '#020617'
const subtext   = '#64748b'




const silverColor = '#c0c0c0'


const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const getImageUrl = (img) => {
  if (!img) return '/img/silver/silver-bangle-1.png'
  if (img.startsWith('http://') || img.startsWith('https://')) return img
  return `${API_BASE}/${img.replace(/^\/+/, '')}`
}

useEffect(() => {
  import('../api').then(({ default: api }) => {
    api.get('/jewelry-products/?category=bangles&metal=silver')
      .then(res => { setSilverBangles(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  })
}, [])


useEffect(() => {
  import('../api').then(({ default: api }) => {
    api.get('/metal-rates/').then(res => {
      const d = res.data
      setLiveRate({ silver_999: parseFloat(d.silver_999) || 0 })
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

  /* ── helpers ── */
  const selectedW = WEIGHTS.find(w => w.label === selectedWeight)
  ;(selectedW?.grams && silverPrice ? selectedW.grams * silverPrice : null);
  const tagStyle  = (tag) => TAG_COLORS[tag] || { bg:'rgba(255,255,255,0.1)', border:'rgba(255,255,255,0.2)', color:'#fff' }

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
    src="/banners/silver_bangles.png"
    alt="Silver Bangles Banner"
    style={{ width:'100%', height:'auto', display:'block' }}
  />
  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
</div>

<div style={{ position:'relative', zIndex:10, padding:'0px 40px', maxWidth:'100%', margin:'0 auto' }}>

        {/* ── Page Header ── */}
        {/* <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'40px', animation:'fadeInUp 0.4s ease both' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(192,192,192,0.08)', border:'1px solid rgba(192,192,192,0.25)', borderRadius:'20px', padding:'5px 14px', marginBottom:'14px' }}>
              <span className="sparkle-dot" style={{ color:silverColor, fontSize:'11px' }}>✦</span>
              <span style={{ color:silverColor, fontSize:'10px', fontWeight:800, letterSpacing:'2px', textTransform:'uppercase' }}>Premium Silver Collection</span>
            </div>
<h1 style={{ margin:0, fontSize:'36px', fontWeight:900, letterSpacing:'-0.5px', fontFamily:'"Playfair Display", Georgia, serif', display:'flex', alignItems:'center', gap:'10px' }}>
  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="16" r="10"/>
    <circle cx="16" cy="16" r="6.5"/>
  </svg>
  <span style={{ background:'linear-gradient(90deg,#9ca3af,#c0c0c0,#e2e8f0,#c0c0c0)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'silverShimmer 3s linear infinite' }}>
    Silver Bangles
  </span>
</h1>
            <p style={{ color:subtext, fontSize:'13px', margin:'8px 0 0', fontWeight:500 }}>5 exclusive designs · Handcrafted Silver 999</p>
          </div>


          {silverPrice && (
            <div style={{ background:'rgba(192,192,192,0.08)', border:'1px solid rgba(192,192,192,0.25)', borderRadius:'10px', padding:'12px 20px', textAlign:'right' }}>
              <div style={{ color:subtext, fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Live Rate (Silver 999)</div>
              <div style={{ color:silverColor, fontWeight:900, fontSize:'18px', fontFamily:'monospace' }}>₹{silverPrice.toFixed(2)}/gm</div>
            </div>
          )}
        </div> */}


        {/* ── Bangle Cards — 5 cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'18px' }}>
          {loading ? (
  <div style={{ gridColumn:'span 3', textAlign:'center', color:subtext, padding:'60px 0' }}>
    ⏳ Loading products...
  </div>
) : silverBangles.length === 0 ? (
  <div style={{ gridColumn:'span 3', textAlign:'center', color:subtext, padding:'60px 0' }}>
    No silver bangles added yet.
  </div>
) : silverBangles.map((bangle) => {
            const isHovered = hoveredBangle === bangle.id
            ;(tagStyle(bangle.tag));
            return (
<div key={bangle.id} className="sb-card"
  onClick={() => navigate(`/product-display?category=bangles&metal=silver&id=${bangle.id}`)}
  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; setHoveredBangle(bangle.id) }}
  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; setHoveredBangle(null) }}
    style={{
    background: '#fffdfa',
    border: '1px solid rgba(192,192,192,0.35)',
    borderRadius: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
    marginBottom: '25px'
  }}>
<div style={{ height: 300, background: '#f1f1f1', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
   {bangle.tag && (
    <div style={{ position: 'absolute', top: 12, left: 0, background: '#1a1a1a', color: '#c0c0c0', padding: '5px 14px 5px 12px', fontSize: 11, fontWeight: 500, letterSpacing: '0.5px', clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)', zIndex: 2 }}>
      {bangle.tag}
    </div>
  )}

  <button onClick={e => toggleWishlist(e, bangle.id)}
    style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', border: wishlistedIds.has(bangle.id) ? '1.5px solid #e11d48' : '1px solid #ddd', background: wishlistedIds.has(bangle.id) ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, zIndex: 2 }}>
    {wishlistedIds.has(bangle.id) ? '❤️' : '🤍'}
  </button>

  {bangle.images?.length > 0
    ? <img
        key={isHovered ? 1 : 0}
        src={getImageUrl(isHovered && bangle.images.length > 1 ? bangle.images[1]?.image : bangle.images[0]?.image)}
        alt={bangle.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: 14, boxSizing: 'border-box', animation: 'fadeImg 0.5s ease' }}

        onError={e => e.currentTarget.style.display = 'none'}
      />
    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 44 }}>⭕</div>
  }

  <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 16, color: '#999', zIndex: 2 }}>🔗</div>
</div>

<div style={{ padding: '12px 14px' }}>
  {(() => {
    const rate = liveRate?.silver_999 || 0
    const netWt = parseFloat(bangle.net_weight) || 0
    const makingPct = parseFloat(bangle.making_charge) || 0
    const discPct = parseFloat(bangle.wastage_charge) || 0
    const stoneVal = parseFloat(bangle.stone_value) || 0
    const making = rate * (makingPct / 100)
    const rateWithMaking = rate + making
    const disc = rateWithMaking * (discPct / 100)
    const price = (rate && netWt) ? Math.round(((netWt * (rateWithMaking - disc)) + stoneVal) * 1.03) : parseFloat(bangle.price) || 0
    const originalAmt = (rate && netWt) ? Math.round(((netWt * (rate + making)) + stoneVal) * 1.03) : parseFloat(bangle.original_price) || 0
    const hasDiscount = discPct > 0 && originalAmt > price && price > 0
    return <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>
          {price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'}
        </span>
        {hasDiscount && <span style={{ fontSize: 15, color: '#999', textDecoration: 'line-through' }}>₹{originalAmt.toLocaleString('en-IN')}</span>}
      </div>
      {hasDiscount && <div style={{ fontSize: 12, color: '#71717a', fontWeight: 600, letterSpacing: '0.3px', marginTop: 7, marginBottom: 6 }}>{discPct}% OFF</div>}

    </>
  })()}
  <div style={{ fontSize: 18, color: '#1a1a1a', fontWeight: 600,
    fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{bangle.name}
  </div>
</div>
              </div>
            )
          })}
        </div>

        {/* footer line */}
        <div style={{ marginTop:'48px', textAlign:'center', animation:'fadeInUp 0.6s ease 0.4s both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'16px', color:subtext, fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', fontWeight:600 }}>
            <div style={{ width:'40px', height:'1px', background:`linear-gradient(90deg,transparent,${silverColor})` }} />
            Bharathi Jewellers • Silver Bangle Collection
            <div style={{ width:'40px', height:'1px', background:`linear-gradient(90deg,${silverColor},transparent)` }} />
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedBangle && (
        <div onClick={() => setSelectedBangle(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(14px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div onClick={e => e.stopPropagation()} style={{background: '#f8fafc' , border:'1px solid rgba(192,192,192,0.35)', borderRadius:'28px', width:'95%', maxWidth:'560px', overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.8)', animation:'fadeInUp 0.3s ease' }}>

            {/* image */}
            <div style={{ position:'relative', height:'200px', overflow:'hidden' }}>
              <img src={getImageUrl(selectedBangle.images?.[0]?.image)} alt={selectedBangle.name}
  onError={(e) => { e.currentTarget.src = '/img/silver/silver-bangle-1.png' }} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(2,6,23,0.9) 0%,transparent 60%)' }} />
              <button onClick={() => setSelectedBangle(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)', color:'#f87171', borderRadius:'10px', padding:'6px 14px', cursor:'pointer', fontSize:'12px', backdropFilter:'blur(8px)' }}>✕ Close</button>
              <div style={{ position:'absolute', top:'16px', left:'16px', background:tagStyle(selectedBangle.tag).bg, border:`1px solid ${tagStyle(selectedBangle.tag).border}`, borderRadius:'20px', padding:'5px 14px', color:tagStyle(selectedBangle.tag).color, fontSize:'11px', fontWeight:800, backdropFilter:'blur(8px)' }}>{selectedBangle.tag}</div>
            </div>

            {/* details */}
            <div style={{ padding:'28px 32px' }}>
              <div style={{ color:silverColor, fontWeight:900, fontSize:'24px', marginBottom:'6px' }}>{selectedBangle.name}</div>
              <div style={{ color:subtext, fontSize:'13px', lineHeight:'1.6', marginBottom:'24px' }}>{selectedBangle.description}</div>


             <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
  <button
    onClick={() => {
      addToCart({
        id: selectedBangle.id,
        name: selectedBangle.name,
        description: selectedBangle.description,
        img: getImageUrl(selectedBangle.images?.[0]?.image),
        tag: selectedBangle.tag,
        metal: 'silver',
        metalLabel: 'Silver 999',
        ringType: 'Silver Bangle',
      })

      setSelectedBangle(null)
      navigate('/cart')
    }}
    style={{
      width:'100%',
      padding:'14px',
      background:'linear-gradient(90deg,#9ca3af,#e5e7eb)',
      border:'none',
      borderRadius:'14px',
      color:'#000',
      fontWeight:900,
      fontSize:'14px',
      cursor:'pointer'
    }}
  >
    🛒 Add to Cart
  </button>

  <button
    onClick={() => {
      setSelectedBangle(null)
      navigate('/customer')
    }}
    style={{
      width:'100%',
      padding:'12px',
      background:'rgba(192,192,192,0.08)',
      border:'1px solid rgba(192,192,192,0.3)',
      borderRadius:'14px',
      color:'#c0c0c0',
      fontWeight:700,
      fontSize:'13px',
      cursor:'pointer'
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