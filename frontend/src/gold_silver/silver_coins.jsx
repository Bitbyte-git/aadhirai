import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import silverCoin from '../assets/silver-coin-transparent.png'
import CustomerNavbar from '../collection/CustomerNavbar'
import CustomerFooter from '../collection/CustomerFooter'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const getImageUrl = img => {
  if (!img) return null
  let p = typeof img === 'object' ? (img.image || img.url || '') : img
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return `${API_BASE}/${p.replace(/^\/+/, '')}`
}

export default function SilverCoins() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const weightFilter = searchParams.get('weight')  // e.g. "500 mg" or "1 gm"

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [silverPrice, setSilverPrice] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [wishlistedIds, setWishlistedIds] = useState(new Set())


const bg = '#FDF5EE'
const text = '#020617'
const subtext = '#64748b'
const border = 'rgba(0,0,0,0.1)'

const silverColor = '#c0c0c0'

  // Fetch silver rate
  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/metal-rates/').then(res => {
        setSilverPrice(parseFloat(res.data.silver_999))
      }).catch(() => {})
    })
  }, [])

  // Fetch products
  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/jewelry-products/?category=coins&metal=silver`)
      .then(r => r.json())
      .then(data => {
        let list = Array.isArray(data) ? data : []
        // Filter by weight if specified
        if (weightFilter) {
          list = list.filter(p => {
            const name = (p.name || '').toLowerCase()
            const wf   = weightFilter.toLowerCase()
            return name.includes(wf)
          })
        }
        setProducts(list)
        setLoading(false)
      })
      .catch(() => { setProducts([]); setLoading(false) })
  }, [weightFilter])


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


  const getProductPrice = (p) => {
    if (p.price && parseFloat(p.price) > 0) return parseFloat(p.price)
    const nw = parseFloat(p.net_weight) || 0
    if (nw && silverPrice) return parseFloat((nw * silverPrice * 1.03).toFixed(2))
    return null
  }

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
      @keyframes coinFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(-5deg)} }
      @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(192,192,192,0.1)} 50%{box-shadow:0 0 50px rgba(192,192,192,0.5)} }
      @keyframes shine { 0%{left:-80%} 100%{left:120%} }
      @keyframes spin { to{transform:rotate(360deg)} }
      .sc-card { animation: fadeInUp 0.5s ease both; }
      .sc-card:nth-child(1){animation-delay:0.05s} .sc-card:nth-child(2){animation-delay:0.1s}
      .sc-card:nth-child(3){animation-delay:0.15s} .sc-card:nth-child(4){animation-delay:0.2s}
      .sc-card:nth-child(5){animation-delay:0.25s} .sc-card:nth-child(6){animation-delay:0.3s}
      .sc-shine { position:absolute; top:0; left:-80%; width:40%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); transform:skewX(-20deg); opacity:0; transition:opacity 0.3s; }
      .sc-card:hover .sc-shine { opacity:1; animation:shine 0.6s ease; }
    `}</style>

<CustomerNavbar />

{/* ── Category Banner ── */}
<div style={{ width:'100%', position:'relative', marginBottom:'32px' }}>
  <img src="/banners/Silver coin.png" alt="Silver Coins Banner"
    style={{ width:'100%', height:'auto', display:'block' }} />
  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
</div>

<div style={{ position:'relative', zIndex:10, padding:'0px 40px', maxWidth:'100%', margin:'0 auto' }}>

        {/* PAGE HEADER */}
        {/* <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'40px', animation:'fadeInUp 0.4s ease both' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(192,192,192,0.08)', border:'1px solid rgba(192,192,192,0.25)', borderRadius:'20px', padding:'5px 14px', marginBottom:'14px' }}>
              <span className="sparkle-dot" style={{ color:silverColor, fontSize:'11px' }}>✦</span>
              <span style={{ color:silverColor, fontSize:'10px', fontWeight:800, letterSpacing:'2px', textTransform:'uppercase' }}>Premium Silver Coins</span>
            </div>
<h1 style={{ margin:0, fontSize:'36px', fontWeight:900, letterSpacing:'-0.5px', fontFamily:'"Playfair Display", Georgia, serif', display:'flex', alignItems:'center', gap:'10px' }}>
  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="16" r="11"/>
    <circle cx="16" cy="16" r="7"/>
    <path d="M16 9v2"/><path d="M16 21v2"/>
    <path d="M9 16h2"/><path d="M21 16h2"/>
  </svg>
  <span style={{ background:'linear-gradient(90deg,#9ca3af,#c0c0c0,#e2e8f0,#c0c0c0)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'silverShimmer 3s linear infinite' }}>
    Silver Coins {weightFilter ? `— ${weightFilter}` : ''}
  </span>
</h1>
            <p style={{ color:subtext, fontSize:'13px', margin:'8px 0 0', fontWeight:500 }}>{loading ? 'Loading...' : `${products.length} coins available`} · Silver 999</p>
          </div>
          {silverPrice && (
            <div style={{ background:'rgba(192,192,192,0.08)', border:'1px solid rgba(192,192,192,0.25)', borderRadius:'10px', padding:'12px 20px', textAlign:'right' }}>
              <div style={{ color:subtext, fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Live Rate (Silver 999)</div>
              <div style={{ color:silverColor, fontWeight:900, fontSize:'18px', fontFamily:'monospace' }}>₹{silverPrice.toFixed(2)}/gm</div>
            </div>
          )}
        </div> */}

        {/* Weight filter badge */}
        {weightFilter && (
          <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ background:'rgba(192,192,192,0.12)', border:'1px solid rgba(192,192,192,0.4)', color:silverColor, borderRadius:20, padding:'6px 16px', fontSize:13, fontWeight:700 }}>
              ⚖️ Filtered: {weightFilter}
            </span>
            <button onClick={() => navigate('/silver-coins')}
              style={{ background:'transparent', border:`1px solid ${border}`, color:subtext, borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              ✕ Show All
            </button>
          </div>
        )}

        {/* PRODUCT GRID */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ width:44, height:44, border:'3px solid rgba(192,192,192,0.2)', borderTop:'3px solid #c0c0c0', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
            <div style={{ color:subtext }}>Loading silver coins...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <img src={silverCoin} alt="" style={{ width:80, height:80, objectFit:'contain', opacity:0.3, marginBottom:16 }} />
            <div style={{ fontSize:18, fontWeight:700, color:text, marginBottom:8 }}>No silver coins found</div>
            <div style={{ fontSize:14, color:subtext, marginBottom:24 }}>
              {weightFilter ? `${weightFilter} silver coins not added yet` : 'No silver coins available yet'}
            </div>
            <button onClick={() => navigate('/customer')}
              style={{ padding:'12px 28px', background:'linear-gradient(90deg,#9ca3af,#e5e7eb)', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', color:'#000' }}>
              ← Go Back
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
            {products.map(p => {
              const firstImg = p.images?.[0] ? getImageUrl(p.images[0]) : null
              const displayPrice = getProductPrice(p)
              const isHovered = hoveredId === p.id

              return (
                <div key={p.id}
  className="sc-card"
  onClick={() => navigate(`/product-display?category=coins&metal=silver&id=${p.id}`)}
  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; setHoveredId(p.id) }}
  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; setHoveredId(null) }}
  style={{
    background: '#fff',
    border: '1px solid #e8e8e8',
    borderRadius: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.25s ease', 
    marginBottom: '75px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  }}
>
<div style={{ height: 280, background: '#f0f0f0', position: 'relative', overflow: 'hidden' }}>

  {p.tag && (
    <div style={{ position: 'absolute', top: 12, left: 0, background: '#2ecc71', color: '#fff', padding: '5px 12px 5px 10px', fontSize: 11, fontWeight: 700, clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)', zIndex: 2 }}>
      {p.tag}
    </div>
  )}

  <button onClick={e => toggleWishlist(e, p.id)}
    style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', border: wishlistedIds.has(p.id) ? '1.5px solid #e11d48' : '1px solid #ddd', background: wishlistedIds.has(p.id) ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, zIndex: 2 }}>
    {wishlistedIds.has(p.id) ? '❤️' : '🤍'}
  </button>

  {firstImg
    ? <img
        key={isHovered ? 1 : 0}
        src={firstImg}
        alt={p.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeImg 0.5s ease' }}
        onError={e => e.currentTarget.style.display = 'none'}
      />
    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 44 }}>🪙</div>
  }

  <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 16, color: '#999', zIndex: 2 }}>🔗</div>
</div>

<div style={{ padding: '12px 14px' }}>

  {/* Grade + Weight badges */}
  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
    <span style={{
      background: 'rgba(192,192,192,0.15)',
      border: '1px solid rgba(192,192,192,0.5)',
      color: '#666',
      borderRadius: 20, padding: '2px 10px',
      fontSize: 10, fontWeight: 800
    }}>
      🥈 Silver 999
    </span>
    {p.net_weight && (
      <span style={{
        background: 'rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.1)',
        color: '#555',
        borderRadius: 20, padding: '2px 10px',
        fontSize: 10, fontWeight: 700
      }}>
        ⚖️ {p.net_weight}g
      </span>
    )}
  </div>

  {/* Price row */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
    <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>
      {displayPrice ? `₹${displayPrice.toLocaleString('en-IN')}` : '—'}
    </span>
    {parseFloat(p.original_price) > displayPrice && displayPrice > 0 && (
      <span style={{ fontSize: 15, color: '#999', textDecoration: 'line-through' }}>
        ₹{parseFloat(p.original_price).toLocaleString('en-IN')}
      </span>
    )}
  </div>

  {/* Discount */}
  {parseFloat(p.wastage_charge) > 0 && parseFloat(p.original_price) > displayPrice && (
    <div style={{ fontSize: 13, color: '#2ecc71', fontWeight: 700, marginBottom: 4 }}>
      {p.wastage_charge}% Off
    </div>
  )}

  {/* Name */}
  <div style={{ fontSize: 18, color: '#1a1a1a', fontWeight: 600 }}>{p.name}</div>

  {/* Live rate */}
  {silverPrice && p.net_weight && (
    <div style={{ fontSize: 13, color: '#999', marginTop: 3 }}>
      ₹{silverPrice.toFixed(0)}/gm · incl. 3% GST
    </div>
  )}
</div>
                </div>
              )
            })}
          </div>
        )}


      </div>

                    {/* ── FOOTER ── */}
              <CustomerFooter />
    </div>
  )
}