import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerNavbar from './CustomerNavbar'
import CustomerFooter from './CustomerFooter'
import './AffordableProducts.css'

const PAGE_SIZE = 30

const SKELETON_CSS = `
  @keyframes csShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .cs-skel {
    background: linear-gradient(90deg, #EAEFEF 25%, #F7F9F9 50%, #EAEFEF 75%);
    background-size: 200% 100%;
    animation: csShimmer 1.5s infinite ease-in-out;
  }
  .cs-skel-card { border: 1px solid rgba(209,223,222,.7); border-radius: 22px; overflow: hidden; background: #fff; }
  .cs-skel-image { aspect-ratio: 1.13/1; border-radius: 0; }
  .cs-skel-body { padding: 16px 17px 18px; }
  .cs-skel-meta { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: 15px; padding-top: 13px; border-top: 1px solid #e8eeec; }
`

export default function AffordableProducts() {
  const [data,setData]=useState(null), [loading,setLoading]=useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const loadMoreRef = useRef(null)
  const navigate=useNavigate()
  useEffect(()=>{window.scrollTo(0,0)},[])
  useEffect(()=>{
    const fetchData=async()=>{
      try{
        const {default:api}=await import('../api')
        const res = await api.get(`/products/affordable/?page=1&page_size=${PAGE_SIZE}`)
        setData(res.data)
        setHasMore(Boolean(res.data.has_more))
      }catch{/* handled by empty state */}
      finally{setLoading(false)}
    }
    fetchData()
  },[])

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const { default: api } = await import('../api')
      const nextPage = page + 1
      const res = await api.get(`/products/affordable/?page=${nextPage}&page_size=${PAGE_SIZE}`)
      setData(prev => ({ ...res.data, products: [...(prev?.products || []), ...(res.data.products || [])] }))
      setHasMore(Boolean(res.data.has_more))
      setPage(nextPage)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasMore || loading) return undefined
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '600px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, page, loadingMore])
  if(loading)return <div className="coin-shop-page"><CustomerNavbar/><main className="coin-shop-shell">
    <style>{SKELETON_CSS}</style>
    <section className="coin-shop-hero">
      <div className="coin-shop-hero-copy">
        <div className="cs-skel" style={{ width: 130, height: 12, borderRadius: 6, marginBottom: 18 }} />
        <div className="cs-skel" style={{ width: '85%', height: 40, borderRadius: 8, marginBottom: 12 }} />
        <div className="cs-skel" style={{ width: '60%', height: 40, borderRadius: 8, marginBottom: 22 }} />
        <div className="cs-skel" style={{ width: '95%', height: 14, borderRadius: 6, marginBottom: 8 }} />
        <div className="cs-skel" style={{ width: '70%', height: 14, borderRadius: 6 }} />
      </div>
      <aside className="coin-balance-card">
        <div className="cs-skel" style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,.18)' }} />
        <div>
          <div className="cs-skel" style={{ width: 100, height: 8, borderRadius: 4, marginBottom: 10, background: 'rgba(255,255,255,.18)' }} />
          <div className="cs-skel" style={{ width: 140, height: 30, borderRadius: 6, background: 'rgba(255,255,255,.18)' }} />
        </div>
      </aside>
    </section>
    <section className="coin-products-section">
      <header className="coin-products-heading">
        <div>
          <div className="cs-skel" style={{ width: 150, height: 9, borderRadius: 4, marginBottom: 9 }} />
          <div className="cs-skel" style={{ width: 220, height: 30, borderRadius: 6 }} />
        </div>
        <div className="cs-skel" style={{ width: 120, height: 10, borderRadius: 4 }} />
      </header>
      <div className="coin-product-grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="cs-skel-card">
            <div className="cs-skel cs-skel-image" />
            <div className="cs-skel-body">
              <div className="cs-skel" style={{ width: '40%', height: 8, borderRadius: 4, marginBottom: 8 }} />
              <div className="cs-skel" style={{ width: '85%', height: 16, borderRadius: 4, marginBottom: 6 }} />
              <div className="cs-skel" style={{ width: '55%', height: 16, borderRadius: 4 }} />
              <div className="cs-skel-meta">
                <div className="cs-skel" style={{ width: 60, height: 15, borderRadius: 4 }} />
                <div className="cs-skel" style={{ width: 35, height: 35, borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  </main><CustomerFooter/></div>
  if(!data)return <><CustomerNavbar/><div className="coin-shop-error">We couldn’t load your coin collection. Please try again.</div><CustomerFooter/></>
  const filteredProducts = data.products.filter(p => p.metal !== 'diamond' && p.metal !== 'platinum')
  return <div className="coin-shop-page"><CustomerNavbar/><main className="coin-shop-shell">
    <style>{SKELETON_CSS}</style>
    <section className="coin-shop-hero"><div className="coin-shop-hero-copy"><span className="coin-shop-kicker"><i/> LUXIVA REWARDS</span><h1>Turn your coins into<br/><em>something timeless.</em></h1><p>Your loyalty deserves something exceptional. Explore jewellery selected especially for your current reward balance.</p></div>
      <aside className="coin-balance-card"><span className="balance-orbit one"/><span className="balance-orbit two"/><div className="coin-medallion">₹</div><div className="coin-balance-copy"><small>AVAILABLE BALANCE</small><strong>{Number(data.wallet_coins).toLocaleString('en-IN')}</strong><span>Luxiva Coins</span></div><div className="coin-balance-value"><span>Redeemable value</span><b>₹{Number(data.max_affordable_price).toLocaleString('en-IN')}</b></div></aside>
    </section>
    <section className="coin-products-section"><header className="coin-products-heading"><div><span>CURATED FOR YOUR BALANCE</span><h2>Rewards within reach</h2></div><p>{filteredProducts.length} exclusive {filteredProducts.length===1?'piece':'pieces'} available</p></header>
      {filteredProducts.length===0?<div className="coin-shop-empty">No products are available within your coin balance yet.</div>:<div className="coin-product-grid">{filteredProducts.map(p=><article className="coin-product-card" key={p.id} onClick={()=>navigate(`/product-display?category=${p.category}&metal=${p.metal}&id=${p.id}`)}>
        <div className="coin-product-image">{p.image?<img src={p.image} alt={p.name}/>:<img className="fallback" src="/logo.png" alt={p.name}/>}<span className="coin-eligible"><i/> COIN ELIGIBLE</span><span className="coin-product-view">Discover piece <b>↗</b></span></div>
        <div className="coin-product-body"><span className="coin-product-category">{String(p.category||p.metal||'Luxiva').replaceAll('_',' ')}</span><h3>{p.name}</h3><div className="coin-product-meta"><div><small>YOUR COIN PRICE</small><strong>₹{Number(p.price).toLocaleString('en-IN')}</strong></div><button type="button" aria-label={`View ${p.name}`}>↗</button></div></div>
      </article>)}</div>}
      {hasMore && <div ref={loadMoreRef} style={{ width: '100%', minHeight: 40, marginTop: 20 }}>
        {loadingMore && <div className="coin-product-grid">{Array.from({length:4}).map((_,i)=><div key={i} className="cs-skel-card"><div className="cs-skel cs-skel-image"/></div>)}</div>}
      </div>}
    </section>
  </main><CustomerFooter/></div>
}
