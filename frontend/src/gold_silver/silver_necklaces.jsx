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

const TAG_COLORS = {
  Bestseller: { bg: 'rgba(52,211,153,0.2)', border: 'rgba(52,211,153,0.5)', color: '#34d399' },
  Minimal: { bg: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.5)', color: '#22d3ee' },
  Premium: { bg: 'rgba(192,192,192,0.25)', border: 'rgba(192,192,192,0.6)', color: '#e2e8f0' },
  Statement: { bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.5)', color: '#a78bfa' },
  New: { bg: 'rgba(244,114,182,0.2)', border: 'rgba(244,114,182,0.5)', color: '#f472b6' },
}

export default function SilverNecklaces() {
  const navigate = useNavigate()
  const [selectedWeight] = useState('All Weights')
  const [hoveredItem, setHoveredItem] = useState(null)
  const [silverPrice] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [silverNecklaces, setSilverNecklaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [liveRate, setLiveRate] = useState(null)
  const [wishlistedIds, setWishlistedIds] = useState(new Set())

const bg        = '#FDF5EE'
const text      = '#020617'
const subtext   = '#64748b'




const silverColor = '#c0c0c0'



const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const getImageUrl = (img) => {
  if (!img) return '/img/silver/silver-necklace-1.png'
  if (img.startsWith('http://') || img.startsWith('https://')) return img
  return `${API_BASE}/${img.replace(/^\/+/, '')}`
}

useEffect(() => {
  import('../api').then(({ default: api }) => {
    api.get('/jewelry-products/?category=necklaces&metal=silver')
      .then(res => {
        setSilverNecklaces(res.data)
        setLoading(false)
      })
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

  const selectedW = WEIGHTS.find(w => w.label === selectedWeight)
  ;(selectedW?.grams && silverPrice ? selectedW.grams * silverPrice : null);
  const tagStyle = tag => TAG_COLORS[tag] || { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)', color: '#fff' }

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
      .sn-card { animation: fadeInUp 0.5s ease both; }
      .sn-img-wrap { overflow:hidden; }
      .sn-img-wrap img { transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1); }
      .sn-card:hover .sn-img-wrap img { transform:scale(1.12) translateY(-4px) !important; }
      .sn-shine { position:absolute;top:0;left:-80%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);transform:skewX(-20deg);opacity:0;transition:opacity 0.3s; }
      .sn-card:hover .sn-shine { opacity:1; animation:shine 0.6s ease; }
    `}</style>
<CustomerNavbar />

{/* ── Category Banner ── */}
<div style={{ width:'100%', position:'relative', marginBottom:'32px' }}>
  <img
    src="/banners/silver_necklace.png"
    alt="Silver Necklaces Banner"
    style={{ width:'100%', height:'auto', display:'block' }}
  />
  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
</div>

<div style={{ position: 'relative', zIndex: 10, padding: '0px 40px', maxWidth: '100%', margin: '0 auto' }}>

        {/* <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', animation: 'fadeInUp 0.4s ease both' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(192,192,192,0.08)', border: '1px solid rgba(192,192,192,0.25)', borderRadius: '20px', padding: '5px 14px', marginBottom: '14px' }}>
              <span className="sparkle-dot" style={{ color: silverColor, fontSize: '11px' }}>✦</span>
              <span style={{ color: silverColor, fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Premium Silver Collection</span>
            </div>

<h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, letterSpacing: '-0.5px', fontFamily: '"Playfair Display", Georgia, serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6c0 10 4 16 10 18 6-2 10-8 10-18"/>
    <circle cx="16" cy="26" r="2.5"/>
  </svg>
  <span style={{ background: 'linear-gradient(90deg,#9ca3af,#c0c0c0,#e2e8f0,#c0c0c0)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'silverShimmer 3s linear infinite' }}>
    Silver Necklaces
  </span>
</h1>

            <p style={{ color: subtext, fontSize: '13px', margin: '8px 0 0', fontWeight: 500 }}>6 exclusive designs · Handcrafted Silver 999</p>
          </div>

          {silverPrice && (
            <div style={{ background: 'rgba(192,192,192,0.08)', border: '1px solid rgba(192,192,192,0.25)', borderRadius: '10px', padding: '12px 20px', textAlign: 'right' }}>
              <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Rate Silver 999</div>
              <div style={{ color: silverColor, fontWeight: 900, fontSize: '18px', fontFamily: 'monospace' }}>₹{silverPrice.toFixed(2)}/gm</div>
            </div>
          )}
        </div> */}



        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {loading ? (
  <div style={{ gridColumn:'span 3', textAlign:'center', color:subtext, padding:'60px 0' }}>
    ⏳ Loading...
  </div>
) : silverNecklaces.length === 0 ? (
  <div style={{ gridColumn:'span 3', textAlign:'center', color:subtext, padding:'60px 0' }}>
    No silver necklaces yet.
  </div>
) : silverNecklaces.map((item) => {
            const isHovered = hoveredItem === item.id
            ;(tagStyle(item.tag));

            return (
<div
  key={item.id}
  className="sn-card"
  onClick={() => navigate(`/product-display?category=necklaces&metal=silver&id=${item.id}`)}
  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; setHoveredItem(item.id) }}
  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; setHoveredItem(null) }}
  style={{
    background: '#fff',
    border: '1px solid #e8e8e8',
    borderRadius: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '75px'
  }}
>
<div style={{ height: 280, background: '#f0f0f0', position: 'relative', overflow: 'hidden' }}>

  {item.tag && (
    <div style={{ position: 'absolute', top: 12, left: 0, background: '#2ecc71', color: '#fff', padding: '5px 12px 5px 10px', fontSize: 11, fontWeight: 700, clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)', zIndex: 2 }}>
      {item.tag}
    </div>
  )}

  <button onClick={e => toggleWishlist(e, item.id)}
    style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', border: wishlistedIds.has(item.id) ? '1.5px solid #e11d48' : '1px solid #ddd', background: wishlistedIds.has(item.id) ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, zIndex: 2 }}>
    {wishlistedIds.has(item.id) ? '❤️' : '🤍'}
  </button>

  {item.images?.length > 0
    ? <img
        key={isHovered ? 1 : 0}
        src={getImageUrl(isHovered && item.images.length > 1 ? item.images[1]?.image : item.images[0]?.image)}
        alt={item.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeImg 0.5s ease' }}
        onError={e => e.currentTarget.style.display = 'none'}
      />
    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 44 }}>📿</div>
  }

  <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 16, color: '#999', zIndex: 2 }}>🔗</div>
</div>

<div style={{ padding: '12px 14px' }}>
  {(() => {
    const rate = liveRate?.silver_999 || 0
    const netWt = parseFloat(item.net_weight) || 0
    const makingPct = parseFloat(item.making_charge) || 0
    const discPct = parseFloat(item.wastage_charge) || 0
    const stoneVal = parseFloat(item.stone_value) || 0
    const making = rate * (makingPct / 100)
    const rateWithMaking = rate + making
    const disc = rateWithMaking * (discPct / 100)
    const price = (rate && netWt) ? Math.round(((netWt * (rateWithMaking - disc)) + stoneVal) * 1.03) : parseFloat(item.price) || 0
    const originalAmt = (rate && netWt) ? Math.round(((netWt * (rate + making)) + stoneVal) * 1.03) : parseFloat(item.original_price) || 0
    const hasDiscount = discPct > 0 && originalAmt > price && price > 0
    return <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>
          {price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'}
        </span>
        {hasDiscount && <span style={{ fontSize: 15, color: '#999', textDecoration: 'line-through' }}>₹{originalAmt.toLocaleString('en-IN')}</span>}
      </div>
      {hasDiscount && <div style={{ fontSize: 13, color: '#2ecc71', fontWeight: 700, marginBottom: 6 }}>{discPct}% Off</div>}
    </>
  })()}
  <div style={{ fontSize: 18, color: '#1a1a1a', fontWeight: 600,
    fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{item.name}
  </div>
</div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedItem && (
        <div onClick={() => setSelectedItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#f8fafc', border: '1px solid rgba(192,192,192,0.35)', borderRadius: '28px', width: '95%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
<img
  src={getImageUrl(selectedItem.images?.[0]?.image)}
  alt={selectedItem.name}
  onError={(e) => { e.currentTarget.src = '/img/silver/silver-necklace-1.png' }}
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
              <div style={{ color: silverColor, fontWeight: 900, fontSize: '24px', marginBottom: '6px', fontFamily: '"Playfair Display", Georgia, serif' }}>{selectedItem.name}</div>
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
        metal: 'silver',
        metalLabel: 'Silver 999',
        ringType: 'Silver Necklace',
      })

      setSelectedItem(null)
      navigate('/cart')
    }}
    style={{
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(90deg,#9ca3af,#e2e8f0)',
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
      background: 'rgba(192,192,192,0.08)',
      border: '1px solid rgba(192,192,192,0.3)',
      borderRadius: '14px',
      color: '#c0c0c0',
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