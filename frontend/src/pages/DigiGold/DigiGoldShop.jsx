import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Gem, ShieldCheck, Wallet } from 'lucide-react'
import api from '../../api'
import CustomerFooter from '../../collection/CustomerFooter'

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0)

const holding = value => `${Number(value).toFixed(4)} g`

function AnimatedVaultNumber({ value, format = money }) {
  const target = Number.isFinite(Number(value)) ? Number(value) : 0
  const displayed = useRef(0)
  const [number, setNumber] = useState(0)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = null
    const finish = () => {
      if (frame !== null) cancelAnimationFrame(frame)
      displayed.current = target
      setNumber(target)
    }
    const onMotionChange = () => { if (motion.matches) finish() }
    motion.addEventListener('change', onMotionChange)
    if (motion.matches || displayed.current === target) finish()
    else {
      const from = displayed.current
      const started = performance.now()
      const animate = now => {
        const progress = Math.min(1, Math.max(0, (now - started) / 900))
        const next = progress === 1 ? target : from + (target - from) * (1 - Math.pow(1 - progress, 3))
        displayed.current = next
        setNumber(next)
        if (progress < 1) frame = requestAnimationFrame(animate)
      }
      frame = requestAnimationFrame(animate)
    }
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      motion.removeEventListener('change', onMotionChange)
    }
  }, [target])

  return <span className="dgs-number"><span aria-hidden="true">{format(number)}</span><span className="dgs-sr-only">{format(target)}</span></span>
}

function VaultSkeleton({ large = false }) {
  return <span className={`dgs-vault-skeleton${large ? ' dgs-vault-skeleton-large' : ''}`} aria-hidden="true" />
}

export default function DigiGoldShop() {
  const navigate = useNavigate()
  const location = useLocation()
  const allowed = location.state?.fromDigiGold === true
  const token = useRef(null)
  const busy = useRef(false)
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const silver = (data?.metal || location.state?.metal) === 'silver_999'
  const vaultName = silver ? 'Digi Silver' : 'Digi Gold'

  useEffect(() => {
    if (!allowed) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setProducts([])
    api.post('/digi-gold/shop/', {
      ...(token.current ? { token: token.current } : { start: true, metal: location.state?.metal || 'gold_22k' }),
      filter, page: 1,
    }, { signal: controller.signal }).then(res => {
      token.current = res.data.token
      setData(res.data)
      setProducts(res.data.products)
    }).catch(err => {
      if (!controller.signal.aborted) setError(err.response?.data?.detail || err.response?.data?.error || 'We could not load your collection. Please try again.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [allowed, filter, retry, location.state?.metal])

  const loadMore = async () => {
    if (busy.current || !data?.has_more) return
    busy.current = true
    setLoadingMore(true)
    setError('')
    try {
      const res = await api.post('/digi-gold/shop/', { token: token.current, filter, page: data.page + 1 })
      setData(res.data)
      setProducts(previous => [...new Map([...previous, ...res.data.products].map(product => [product.id, product])).values()])
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load more jewellery. Please try again.')
    } finally {
      busy.current = false
      setLoadingMore(false)
    }
  }

  const openProduct = (event, product) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(`/product-display?category=${product.category}&metal=${product.metal}&id=${product.id}`, {
      state: { digiShop: { token: token.current, productId: product.id, metal: data.metal } },
    })
  }

  return <div className="dgs-page">
    <style>{styles}</style>
    <main className="dgs-shell">
      <button className="dgs-back" type="button" onClick={() => navigate('/digi-gold')}><ArrowLeft size={16} /> Back to your vault</button>
      {!allowed ? <section className="dgs-empty"><Gem size={36} /><h1>Your vault. Your next treasure.</h1><p>Open Sell from your Digi Gold dashboard to explore jewellery with your available gold value.</p><button type="button" onClick={() => navigate('/digi-gold')}>Open Digi Gold <ArrowUpRight size={16} /></button></section> : <>
        <section className="dgs-hero">
          <div className="dgs-hero-copy"><span className="dgs-eyebrow">ATHIRAI &middot; FROM VAULT TO YOU</span><h1>{silver ? 'Silver' : 'Gold'} you saved.<br /><em>Jewellery you love.</em></h1><p>Find a piece that feels like you, with the value already in your {vaultName} vault.</p><span className="dgs-hero-note"><ShieldCheck size={16} /> Your holding stays yours until you confirm payment.</span></div>
        </section>
          {!data && loading && <span className="dgs-sr-only" role="status">Loading your vault value, available holding and current rate.</span>}
        <section className="dgs-balance" aria-label="Available vault value" aria-busy={!data && loading}>
          <div className="dgs-wallet-icon"><Wallet size={24} /></div><div><span>YOUR {vaultName.toUpperCase()} VALUE</span><strong>{data ? <AnimatedVaultNumber value={data.balance_inr} /> : loading ? <VaultSkeleton large /> : 'Unavailable'}</strong></div>
          <div className="dgs-holding"><span>Available holding</span><b>{data ? <AnimatedVaultNumber value={data.holding_gm} format={holding} /> : loading ? <VaultSkeleton /> : 'Unavailable'}</b></div>
          <div className="dgs-holding"><span>Current rate / gram</span><b>{data ? <AnimatedVaultNumber value={data.rate_per_gram} /> : loading ? <VaultSkeleton /> : 'Unavailable'}</b></div>
          <p>Only the {silver ? 'silver' : 'gold'} value needed for your order is used. Your remaining holding stays in your vault.</p>
        </section>
        <section className="dgs-collection" aria-busy={loading || loadingMore}>
          <header className="dgs-heading"><div><span className="dgs-eyebrow">CHOSEN WITHIN YOUR VAULT VALUE</span><h2>A little closer to yours.</h2></div><div className="dgs-tabs" aria-label="Filter jewellery">{[['all', 'All jewellery'], ['gold', 'Gold'], ['silver', 'Silver']].map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} disabled={loadingMore} onClick={() => setFilter(id)}>{label}</button>)}</div></header>
          {error && <div className="dgs-error" role="alert">{String(error)} <button type="button" onClick={() => products.length ? loadMore() : setRetry(value => value + 1)}>Try again</button></div>}
          {loading ? <div className="dgs-grid" role="status" aria-label="Loading jewellery">{Array.from({ length: 8 }, (_, index) => <div className="dgs-skeleton" key={index}><div /><span /><span /></div>)}</div> : products.length ? <div className="dgs-grid">{products.map(product => <a className="dgs-product" key={product.id} href={`/product-display?category=${product.category}&metal=${product.metal}&id=${product.id}`} onClick={event => openProduct(event, product)}>
            <div className="dgs-image">{product.image ? <img src={product.image} alt={product.name} loading="lazy" decoding="async" onError={event => { event.currentTarget.style.visibility = 'hidden' }} /> : <Gem size={48} aria-hidden="true" />}<span>{product.grade || product.metal}</span></div>
            <div className="dgs-product-copy"><span className="dgs-category">{String(product.category).replaceAll('_', ' ')}</span><h3>{product.name}</h3><div className="dgs-product-price"><strong>{money(product.price)}</strong><span>{Number(product.net_weight) > 0 ? `${Number(product.net_weight)} g` : ''}</span></div><div className="dgs-product-action">Explore this piece <ArrowUpRight size={17} /></div></div>
          </a>)}</div> : !error && <div className="dgs-empty"><Gem size={32} /><h3>{Number(data?.balance_inr) > 0 ? 'Your next treasure is on its way.' : 'Start with a little gold.'}</h3><p>{Number(data?.balance_inr) > 0 ? 'No jewellery in this collection matches your current vault value. Try another collection or grow your holding.' : 'Add to your Digi Gold holding to discover jewellery within your vault value.'}</p><button type="button" onClick={() => navigate('/digi-gold')}>Back to Digi Gold <ArrowUpRight size={16} /></button></div>}
          {!loading && data?.has_more && products.length > 0 && <button className="dgs-more" type="button" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Loading more jewellery...' : 'Explore more jewellery'}</button>}
          <p className="dgs-footnote">Live metal rates can change. Your final price and available holding are checked again before payment. Jewellery bought outside this shopping session uses the usual checkout.</p>
        </section>
      </>}
    </main><CustomerFooter />
  </div>
}

const styles = `
.dgs-page{min-height:100vh;background:#faf9f5;color:#123e38;font-family:inherit}.dgs-shell{width:min(1440px,calc(100% - 64px));margin:auto;padding:26px 0 64px}.dgs-back{display:flex;align-items:center;gap:8px;border:0;background:transparent;color:#506e63;font:inherit;font-size:12px;cursor:pointer;padding:6px 0;margin-bottom:18px}.dgs-hero{min-height:330px;display:flex;align-items:center;padding:42px;border:1px solid #e4e4d8;border-radius:24px;background:linear-gradient(90deg,#f7f2e9f5 0%,#f7f2e9e8 36%,#f7f2e970 57%,transparent 75%),url('/Gold/digi-gold-jewellery-hero.webp') right center/cover no-repeat}.dgs-hero-copy{max-width:55%}.dgs-eyebrow{display:block;color:#947039;font-size:10px;letter-spacing:.15em;font-weight:700}.dgs-hero h1{font:500 clamp(32px,3.8vw,58px)/1.1 Georgia,serif;margin:18px 0}.dgs-hero h1 em{color:#99713e;font-weight:400}.dgs-hero-copy p{font-size:14px;line-height:1.8;max-width:390px;color:#536a60}.dgs-hero-note{display:flex;gap:7px;align-items:center;font-size:10px;line-height:1.6;margin-top:18px}.dgs-balance{display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin:18px 0 36px;padding:24px 28px;border-radius:18px;border:1px solid #254f43;background:#093f37;color:white;box-shadow:0 8px 24px #163f3310}.dgs-wallet-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:#ebd09a;background:#ffffff12}.dgs-balance span{display:block;font-size:9px;letter-spacing:.08em;color:#c5d4c5}.dgs-balance strong{display:block;font-size:30px;font-weight:600;margin-top:6px;color:#f3dfb7}.dgs-holding{border-left:1px solid #ffffff25;padding-left:26px;margin-left:auto}.dgs-holding b{display:block;margin-top:7px;font-size:17px;font-weight:500}.dgs-balance p{flex-basis:100%;margin:0;border-top:1px solid #ffffff20;padding-top:14px;font-size:11px;line-height:1.7;color:#ccdacd}.dgs-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:24px}.dgs-heading h2{font:500 clamp(26px,3vw,38px)/1.2 Georgia,serif;margin:10px 0 0}.dgs-tabs{display:flex;gap:6px;flex-wrap:wrap}.dgs-tabs button{font:inherit;font-size:12px;border:1px solid #dbe3d6;background:#fff;border-radius:999px;padding:10px 16px;color:#295a48;cursor:pointer}.dgs-tabs button[aria-pressed=true]{background:#0b493c;color:#fff;border-color:#0b493c}.dgs-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.dgs-product{min-width:0;display:flex;flex-direction:column;text-decoration:none;color:inherit;background:#fff;border:1px solid #e2e7dc;border-radius:16px;overflow:hidden;box-shadow:0 5px 20px #123e3805;transition:transform .18s ease,box-shadow .18s ease}.dgs-product:hover{transform:translateY(-3px);box-shadow:0 12px 30px #123e3812}.dgs-image{aspect-ratio:1;position:relative;display:grid;place-items:center;background:#f5f5ef;overflow:hidden}.dgs-image img{width:100%;height:100%;object-fit:contain;padding:12px;box-sizing:border-box}.dgs-image>span{position:absolute;top:12px;left:12px;padding:5px 9px;border-radius:99px;background:#ffffffed;color:#315e4c;text-transform:uppercase;font-size:9px;font-weight:600}.dgs-product-copy{display:flex;flex-direction:column;flex:1;padding:16px}.dgs-category{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#98784b}.dgs-product h3{font:500 17px/1.4 Georgia,serif;margin:8px 0 14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:48px}.dgs-product-price{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:auto}.dgs-product-price strong{font-size:19px}.dgs-product-price span{font-size:10px;color:#6c7e73}.dgs-product-action{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e7eddf;padding-top:12px;margin-top:14px;font-size:11px;font-weight:600}.dgs-empty{text-align:center;background:#fff;border:1px dashed #cfdbca;padding:48px 20px;border-radius:18px}.dgs-empty>svg{color:#a48045}.dgs-empty h1,.dgs-empty h3{font-family:Georgia,serif}.dgs-empty p{font-size:13px;line-height:1.8;max-width:520px;margin:16px auto;color:#657a6c}.dgs-empty button,.dgs-more{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 20px;border-radius:10px;border:1px solid #174f40;background:#174f40;color:white;font:inherit;font-size:12px;cursor:pointer}.dgs-more{display:flex;margin:28px auto 0;background:#fff;color:#174f40}.dgs-footnote{margin:26px auto 0;max-width:760px;color:#7b887c;font-size:10px;line-height:1.8;text-align:center}.dgs-error{margin-bottom:16px;padding:14px;border:1px solid #e2cdb3;background:#fff7ea;color:#754e27;border-radius:10px;font-size:12px}.dgs-error button{margin-left:12px;border:0;background:transparent;text-decoration:underline;color:inherit;cursor:pointer}.dgs-skeleton{border:1px solid #e2e7dc;border-radius:16px;overflow:hidden;background:#fff;padding-bottom:22px}.dgs-skeleton div{aspect-ratio:1;background:#e9eee5}.dgs-skeleton span{display:block;height:12px;width:65%;margin:16px;background:#edf0e9;border-radius:4px}.dgs-skeleton span:last-child{width:40%}.dgs-page :is(button,a):focus-visible{outline:2px solid #aa8745;outline-offset:3px}.dgs-page button:disabled{opacity:.6;cursor:wait}
@media(max-width:1000px){.dgs-shell{width:calc(100% - 36px)}.dgs-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.dgs-hero{padding:28px}.dgs-hero-copy{max-width:64%}.dgs-holding{padding-left:14px}.dgs-balance{gap:16px;padding:22px}.dgs-balance strong{font-size:26px}}
@media(max-width:600px){.dgs-shell{width:calc(100% - 24px);padding-top:16px}.dgs-back{font-size:11px;margin-bottom:12px}.dgs-hero{min-height:0;padding:165px 20px 24px;border-radius:18px;background:linear-gradient(180deg,transparent 0%,#f7f2e900 100px,#f7f2e9f2 180px,#f7f2e9 225px),url('/Gold/digi-gold-jewellery-hero.webp') right top/auto 250px no-repeat,#f7f2e9}.dgs-hero-copy{max-width:100%}.dgs-eyebrow{font-size:8px}.dgs-hero h1{font-size:34px;margin-top:13px}.dgs-hero-copy p{font-size:12px}.dgs-balance{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:14px 0 28px;padding:18px}.dgs-wallet-icon{width:42px;height:42px;grid-column:1;grid-row:1}.dgs-balance>div:nth-child(2){grid-column:1/-1;grid-row:1;padding-left:56px}.dgs-holding{margin:0;border:0;padding:12px 0 0;border-top:1px solid #ffffff20}.dgs-holding b{font-size:15px}.dgs-balance p{grid-column:1/-1;font-size:10px}.dgs-balance>.dgs-holding{grid-column:auto}.dgs-heading{align-items:start;flex-direction:column;gap:14px;margin-bottom:18px}.dgs-heading h2{font-size:28px}.dgs-tabs button{font-size:11px;padding:9px 14px}.dgs-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dgs-product{border-radius:12px}.dgs-product-copy{padding:11px}.dgs-product h3{font-size:14px;min-height:40px;margin-bottom:10px}.dgs-product-price strong{font-size:15px}.dgs-product-price span{font-size:9px}.dgs-product-action{font-size:10px;gap:5px}.dgs-image img{padding:7px}.dgs-image>span{font-size:8px;top:8px;left:8px}.dgs-category{font-size:8px}.dgs-product-action svg{width:14px}.dgs-hero-note{font-size:9px}}
@media(prefers-reduced-motion:reduce){.dgs-product{transition:none}.dgs-product:hover{transform:none}}
.dgs-balance .dgs-number,.dgs-balance .dgs-number>span{display:inline;color:inherit;font:inherit;letter-spacing:inherit;font-variant-numeric:tabular-nums}
.dgs-balance .dgs-vault-skeleton{display:inline-block;position:relative;overflow:hidden;width:100px;max-width:100%;height:18px;border-radius:5px;vertical-align:middle;background:#ffffff18}
.dgs-balance .dgs-vault-skeleton-large{width:190px;height:32px;border-radius:7px}
.dgs-vault-skeleton::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#ffffff30,transparent);transform:translateX(-100%);animation:dgs-vault-shimmer 1.5s ease-in-out infinite}
.dgs-page .dgs-sr-only,.dgs-balance .dgs-number>.dgs-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.dgs-skeleton div,.dgs-skeleton span{background:linear-gradient(90deg,#e9eee5 25%,#f5f7f1 50%,#e9eee5 75%);background-size:200% 100%;animation:dgs-product-shimmer 1.5s ease-in-out infinite}
@keyframes dgs-vault-shimmer{to{transform:translateX(100%)}}
@keyframes dgs-product-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
@media(max-width:600px){.dgs-balance .dgs-vault-skeleton-large{width:155px;height:28px}}
@media(prefers-reduced-motion:reduce){.dgs-vault-skeleton::after,.dgs-skeleton div,.dgs-skeleton span{animation:none}.dgs-vault-skeleton::after{display:none}}

`
