import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CustomerFooter from '../collection/CustomerFooter'
import { ArrowRight, Check, Coins, Download, LockKeyhole, MapPin, PackageCheck, ShoppingBag, Sparkles, Wallet } from 'lucide-react'
import './CheckoutCelebration.css'
import './CheckoutExperience.css'

const steps = [
  { label: 'Your selection', detail: 'Review your order', Icon: ShoppingBag },
  { label: 'Delivery', detail: 'Choose your address', Icon: MapPin },
  { label: 'Payment', detail: 'Pay with AUG Revive', Icon: Coins },
]

function CheckoutSteps({ active, onStepChange, paymentLabel = 'AUG Revive' }) {
  useEffect(() => {
    const page = document.querySelector('.cx-checkout')
    const navbars = [...document.querySelectorAll('.exact-nav, .san-top-shell, .irn-top')]
    let frame = null
    const measure = () => {
      frame = null
      const bottom = Math.max(0, ...navbars.map(nav => nav.getBoundingClientRect().bottom))
      page?.style.setProperty('--cx-nav-bottom', `${Math.ceil(bottom) + 24}px`)
    }
    const schedule = () => { if (frame === null) frame = requestAnimationFrame(measure) }
    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    navbars.forEach(nav => observer?.observe(nav))
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      observer?.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule)
      page?.style.removeProperty('--cx-nav-bottom')
    }
  }, [active])

  return (
    <ol className="cx-steps" aria-label="Checkout progress">
      {steps.map((step, index) => (
        <li key={step.label} className={`${index + 1 === active ? 'is-current' : ''} ${index + 1 < active ? 'is-complete' : ''}`} aria-current={index + 1 === active ? 'step' : undefined}>
          <span className="cx-step-icon">{index + 1 < active ? <Check size={19} /> : <step.Icon size={19} />}</span>
          <span><strong>{step.label}</strong><small>{index === 2 ? `Pay with ${paymentLabel}` : step.detail}</small></span>
          <span className="cx-step-number" aria-hidden="true">0{index + 1}</span>
          {onStepChange && index + 1 < active && <button type="button" className="cx-step-jump" aria-label={`Back to ${step.label}`} onClick={() => onStepChange(index + 1)} />}
        </li>
      ))}
    </ol>
  )
}

function GiftIllustration() {
  return (
    <svg className="cc-gift" viewBox="0 0 220 200" fill="none" aria-hidden="true">
      <ellipse cx="110" cy="174" rx="62" ry="10" fill="#073B3F" opacity=".09" />
      <g className="cc-gift-box">
        <path d="m44 75 66-30 66 30-66 31-66-31Z" fill="#E9CC9E" />
        <path d="m44 75 66 31v66l-66-33V75Z" fill="#C99B63" />
        <path d="m110 106 66-31v64l-66 33v-66Z" fill="#B47E44" />
        <path d="m38 69 72-33 72 33-72 34-72-34Z" fill="#F4DFC0" />
        <path d="m38 69 72 34v16L38 85V69Z" fill="#D9B382" />
        <path d="m110 103 72-34v16l-72 34v-16Z" fill="#C3935D" />
        <path d="m81 49 18-8 72 34-18 9-72-35Z" fill="#0E6668" />
        <path d="m66 82 18 9 72-34-18-8-72 33Z" fill="#197778" />
        <path d="m66 82 18 9v68l-18-9V82Z" fill="#0B585C" />
        <path d="m137 91 18-8v66l-18 9V91Z" fill="#08474D" />
        <path d="M109 62C69 60 77 25 93 35c9 6 16 27 16 27Zm1 0c41-2 33-37 17-27-9 6-17 27-17 27Z" stroke="#0B6467" strokeWidth="7" strokeLinejoin="round" />
        <path d="m110 64-14 18m15-18 17 15" stroke="#0B6467" strokeWidth="7" strokeLinecap="round" />
      </g>
      <g className="cc-gift-seal">
        <circle cx="166" cy="142" r="27" fill="#fff" />
        <circle cx="166" cy="142" r="22" fill="#0E7770" />
        <path d="m156 142 7 7 13-14" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

function CheckoutProcessing({ paymentLabel = 'AUG Revive' }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  return (
    <div className="cc-processing" role="status" aria-live="polite">
      <div className="cc-processing-card">
        <div className="cc-processing-orbit" aria-hidden="true">
          <div className="cc-orbit-ring" />
          <div className="cc-processing-lock"><LockKeyhole size={32} strokeWidth={1.6} /></div>
          <span className="cc-orbit-coin"><Coins size={22} /></span>
        </div>
        <span className="cc-eyebrow">A little moment of anticipation</span>
        <h2>Making it yours<span className="cc-loading-dots" aria-hidden="true">…</span></h2>
        <p>We’re confirming your {paymentLabel} payment.<br />Please keep this page open.</p>
        <div className="cc-loading-track" aria-hidden="true"><span /></div>
        <span className="cc-processing-note"><LockKeyhole size={12} /> Payment in progress</span>
      </div>
    </div>
  )
}

function OrderCelebration({ fundingLabel, fundingDetail, orderId, coinsNeeded, productName, image, qty, total, address, banner, downloading, onDownload, onContinue }) {
  const titleRef = useRef(null)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    titleRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <section className="cc-success" aria-labelledby="cc-success-title">
      <div className="cc-confetti" aria-hidden="true">
        {Array.from({ length: 32 }, (_, i) => (
          <i key={i} style={{ '--x': `${((i * 47) % 760) - 380}px`, '--y': `${100 + (i * 37) % 370}px`, '--r': `${i * 67}deg`, '--delay': `${(i % 8) * 65}ms`, '--color': ['#BB8958', '#0E7770', '#E8C796', '#78B8A2'][i % 4] }} />
        ))}
      </div>
      <div className="cc-hero">
        <div className="cc-artwork">
          <div className="cc-halo cc-halo-one" /><div className="cc-halo cc-halo-two" />
          <Sparkles className="cc-spark cc-spark-one" size={24} />
          <Sparkles className="cc-spark cc-spark-two" size={17} />
          <GiftIllustration />
        </div>
        <span className="cc-confirmed"><Check size={13} strokeWidth={3} /> Order confirmed</span>
        <h1 id="cc-success-title" ref={titleRef} tabIndex={-1}>A little treasure.<br /><em>Now yours.</em></h1>
        <p className="cc-subtitle">Thank you for choosing us. Your order has been placed successfully.</p>
        <div className="cc-order-number"><span>ORDER ID</span><strong>{orderId}</strong></div>
      </div>

      <div className="cc-details">
        <div className="cc-product">
          <div className="cc-product-image">{image ? <img src={image} alt={productName} /> : <PackageCheck size={30} />}</div>
          <div><span className="cc-detail-label">Your new treasure</span><h2>{productName}</h2><p>Quantity: {qty}</p></div>
          <strong className="cc-price">{total}</strong>
        </div>
        <div className="cc-payment"><span className="cc-detail-icon"><Coins size={20} /></span><div><strong>Paid with {fundingLabel || 'AUG Revive'}</strong><span>{fundingDetail || `${coinsNeeded.toLocaleString('en-IN')} AUG Revive deducted`}</span></div><span className="cc-paid"><Check size={12} /> Paid</span></div>
        {address && <div className="cc-address"><MapPin size={17} /><p><strong>Deliver to {address.name}</strong><span>{[address.address, address.locality, address.city, address.state, address.pincode].filter(Boolean).join(', ')}</span></p></div>}
        {banner && <div className={`op-banner ${banner.type}`} role="alert">{banner.text}</div>}
        <div className="cc-actions">
          <button type="button" className="cc-primary" onClick={onContinue}>Continue shopping <ArrowRight size={17} /></button>
          <button type="button" className="cc-secondary" disabled={downloading} onClick={onDownload}><Download size={16} />{downloading ? 'Preparing receipt…' : 'Download receipt'}</button>
        </div>
        <p className="cc-thank-you"><Sparkles size={13} /> A beautiful choice. A happy little moment.</p>
      </div>
    </section>
  )
}

const GOLD = '#BB8958'
const DARK = '#111817'
const MUTED = '#7A8987'
const RED = '#073B3F'
const COIN_RATE = 100 // 1 Rs = 100 coins

function AnimatedReviveBalance({ value }) {
  const [display, setDisplay] = useState(value)
  const current = useRef(value)
  useEffect(() => {
    const from = current.current
    const target = Number(value) || 0
    let frame
    const start = performance.now()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const update = now => {
      const progress = reducedMotion ? 1 : Math.min(1, (now - start) / 650)
      current.current = Math.round(from + (target - from) * (1 - Math.pow(1 - progress, 3)))
      setDisplay(current.current)
      if (progress < 1) frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <span className="cx-revive-number" aria-label={`${Number(value).toLocaleString('en-IN')} AUG Revive`}>{display.toLocaleString('en-IN')}</span>
}

function WalletTopUpSuccess({ amount, ready }) {
  const continueToPayment = () => {
    const button = document.getElementById('cx-confirm-payment')
    button?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' })
    button?.focus({ preventScroll: true })
  }
  return (
    <section className="cx-revive-success" role="status" aria-live="polite">
      <div className="cx-revive-success-art" aria-hidden="true">
        <svg viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="35" stroke="#C5DCC5" strokeDasharray="3 5" />
          <circle cx="40" cy="40" r="27" fill="#176454" />
          <path className="cx-revive-check" pathLength="1" d="m28 40 8 8 17-18" stroke="#FFF5D8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--angle': `${i * 45}deg`, '--delay': `${i * 35}ms` }} />)}
      </div>
      <div className="cx-revive-success-copy">
        <span className="cx-revive-kicker">A little boost. A step closer.</span>
        <h2>+{amount.toLocaleString('en-IN')} <span>AUG Revive added</span></h2>
        <p>{ready ? 'Your wallet is topped up. Your order is ready for payment.' : 'Top-up successful. Your updated wallet balance appears below.'}</p>
      </div>
      {ready && <button type="button" onClick={continueToPayment}>Let’s make it yours <ArrowRight size={16} /></button>}
    </section>
  )
}

const CoinIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
    <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
  </svg>
)
const AlertIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .op-page{min-height:100vh;background:radial-gradient(circle at 12% 15%, rgba(209,223,222,.55), transparent 30%), radial-gradient(circle at 88% 85%, rgba(187,137,88,.08), transparent 32%), linear-gradient(135deg,#FDFDFC 0%,#F6EFE7 55%,#EDF2F1 100%);font-family:"Montserrat",system-ui,sans-serif;color:${DARK}}
  .op-main{width:min(1040px,calc(100% - 40px));margin:0 auto;padding:44px 0 90px;animation:fadeUp .4s ease both}
  .op-back{display:flex;align-items:center;justify-content:center;width:34px;height:34px;margin-bottom:16px;border:1px solid rgba(189,207,206,.78);border-radius:50%;background:rgba(253,253,252,.92);color:${RED};cursor:pointer}
  .op-back:active{opacity:.6}
  .op-kicker{margin:0 0 8px;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .op-title{margin:0 0 28px;color:${RED};font-family:"Playfair Display",serif;font-size:clamp(28px,4vw,40px)}
  .op-card{border:1px solid rgba(189,207,206,.8);border-radius:14px;background:#fff;box-shadow:0 18px 46px rgba(12,64,68,.08);padding:26px;margin-bottom:20px}
  .op-order-row{display:flex;gap:14px;align-items:center;padding-bottom:18px;margin-bottom:18px;border-bottom:1px solid rgba(189,207,206,.6)}
  .op-order-img{width:64px;height:64px;border-radius:8px;overflow:hidden;border:1px solid rgba(204,168,129,.4);flex-shrink:0;background:#FDFDFC}
  .op-order-img img{width:100%;height:100%;object-fit:cover}
  .op-amount-row{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:${MUTED};margin-bottom:8px}
  .op-amount-total{display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:8px;border-top:1px dashed rgba(12,64,68,.2);font-weight:900;font-size:18px;color:${RED}}
  .op-balance-card{background:linear-gradient(135deg,${RED},#0C4044);color:#fff;border:none}
  .op-balance-label{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;opacity:.8;font-weight:800}
  .op-balance-value{font-family:"Playfair Display",serif;font-size:32px;display:flex;align-items:baseline;gap:8px;margin-top:6px}
  .op-balance-value span{font-size:14px;font-weight:700;opacity:.85}
  .op-status-banner{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:10px;font-size:13px;font-weight:800;margin-bottom:18px}
  .op-status-banner.ok{background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.3)}
  .op-status-banner.no{background:rgba(229,62,62,.08);color:#c0392b;border:1px solid rgba(229,62,62,.28)}
  .op-pay-btn{width:100%;min-height:54px;border:none;border-radius:999px;background:linear-gradient(135deg,${RED},#0C4044);color:#fff;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:.2s ease}
  .op-pay-btn:disabled{background:#BDCFCE;cursor:not-allowed}
  .op-pay-btn:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(7,59,63,.22)}
  .op-buy-coin-btn{width:100%;min-height:54px;border:none;border-radius:999px;background:linear-gradient(135deg,${GOLD},#9F6130);color:#fff;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;margin-top:12px;transition:.2s ease;display:flex;align-items:center;justify-content:center;gap:8px}
  .op-buy-coin-btn:disabled{background:#BDCFCE;cursor:not-allowed}
  .op-shortfall-input{width:100%;padding:14px 16px;border:1px solid #D1DFDE;border-radius:8px;font-size:15px;font-weight:700;color:${DARK};box-sizing:border-box;margin-bottom:14px}
  .op-banner{margin-bottom:18px;padding:13px 16px;border-radius:8px;font-size:13px;font-weight:700}
  .op-banner.success{background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.3)}
  .op-banner.error{background:rgba(229,62,62,.1);color:#e53e3e;border:1px solid rgba(229,62,62,.3)}
  @media (max-width: 600px) {
    .op-main { width: min(100% - 20px, 900px); padding: 20px 0 50px; }
    .op-title { font-size: 26px; margin-bottom: 18px; }
    .op-card { padding: 18px 16px; border-radius: 12px; margin-bottom: 14px; }
    .op-order-img { width: 54px; height: 54px; }
    .op-balance-value { font-size: 26px; }
    .op-pay-btn, .op-buy-coin-btn { min-height: 48px; font-size: 12.5px; }
    .op-shortfall-input { padding: 11px 13px; font-size: 14px; }
  }
`

export default function OrderPayment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { product, qty, totalPrice, digiShop, isCartCheckout, cartItems = [], firstImage, savedAddress } = location.state || {}

  const isDigiShop = Boolean(digiShop?.token && Number(digiShop.productId) === Number(product?.id) && !isCartCheckout)
  const digiLabel = digiShop?.metal === 'silver_999' ? 'Digi Silver' : 'Digi Gold'
  const [goldUsed, setGoldUsed] = useState(null)
  const [wallet, setWallet] = useState({ balance_coins: 0 })
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [walletError, setWalletError] = useState(false)
  const [paying, setPaying] = useState(false)
  const paymentInFlight = useRef(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [toppingUp, setToppingUp] = useState(false)
  const [banner, setBanner] = useState(null)
  const [topUpSuccess, setTopUpSuccess] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)

  useEffect(() => { if (!product || !savedAddress) navigate(-1) }, [product, savedAddress, navigate])

  const handleDownloadReceipt = async () => {
    setDownloadingReceipt(true)
    try {
      const { downloadOrderReceipt } = await import('../api')
      await downloadOrderReceipt(orderId)
    } catch {
      setBanner({ type: 'error', text: 'Could not download receipt. Please try again.' })
    }
    setDownloadingReceipt(false)
  }

  const fetchWallet = async ({ quiet = false } = {}) => {
    if (!quiet) setLoadingWallet(true)
    setWalletError(false)
    try {
      const { default: api } = await import('../api')
      const res = isDigiShop
        ? await api.post('/digi-gold/shop/', { token: digiShop.token, product_id: product.id, quantity: qty })
        : await api.get('/wallet/')
      setWallet(res.data)
    } catch {
      setWalletError(true)
    } finally {
      setLoadingWallet(false)
    }
  }

  useEffect(() => { fetchWallet() }, [isDigiShop, product?.id, qty])

  if (!product || !savedAddress) return null

  const paymentTotal = isDigiShop ? (wallet.total_price ?? totalPrice) : totalPrice
  const coinsNeeded = Math.ceil((paymentTotal || 0) * COIN_RATE)
  const hasEnoughCoins = wallet.balance_coins >= coinsNeeded
  const shortfallCoins = Math.max(0, coinsNeeded - wallet.balance_coins)
  const shortfallRupees = Math.ceil(shortfallCoins / COIN_RATE)
  const inr = n => `Rs. ${Math.round(n).toLocaleString('en-IN')}`

  const handlePayWithCoins = async () => {
    if (paymentInFlight.current) return
    paymentInFlight.current = true
    setPaying(true)
    setBanner(null)
    try {
      const { default: api } = await import('../api')
      const res = await api.post(isDigiShop ? '/digi-gold/shop/checkout/' : '/orders/pay-with-coins/', {
        ...(isDigiShop ? { token: digiShop.token } : {}),
        product_id: product.id,
        product_image_url: firstImage,
        delivery_address_id: savedAddress.id,
        customer_name: savedAddress.name,
        customer_phone: savedAddress.phone,
        pincode: savedAddress.pincode,
        address_line1: savedAddress.address,
        address_line2: savedAddress.locality || '',
        city: savedAddress.city,
        state: savedAddress.state,
        quantity: qty,
        unit_price: isCartCheckout ? totalPrice : (totalPrice / (qty || 1)),
        total_price: paymentTotal,
      })
      if (res.data.status === 'success') {
        setGoldUsed(res.data.gold_used_gm ?? wallet.required_gm)
        setOrderId(res.data.order_id)
      } else {
        setBanner({ type: 'error', text: 'Payment failed. Please try again.' })
      }
    } catch (err) {
      setBanner({ type: 'error', text: err.response?.data?.error || 'Payment failed. Please try again.' })
      fetchWallet()
    } finally {
      paymentInFlight.current = false
      setPaying(false)
    }
  }

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handleBuyAugCoin = async () => {
    const amount = Number(topUpAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setBanner({ type: 'error', text: 'Please enter a valid amount' })
      return
    }
    setToppingUp(true)
    setBanner(null)
    setTopUpSuccess(null)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        setBanner({ type: 'error', text: 'Payment could not load. Check your internet connection.' })
        setToppingUp(false)
        return
      }

      const { default: api } = await import('../api')
      const orderRes = await api.post('/recharge/create-order/', { amount })
      const { razorpay_order_id, amount: orderAmount, currency, key, recharge_id } = orderRes.data

      const options = {
        key,
        amount: Math.round(orderAmount * 100),
        currency,
        name: 'BitByte AUG Revive',
        description: `Top-up ${Math.round(amount * COIN_RATE)} AUG Revive`,
        order_id: razorpay_order_id,
        handler: async response => {
          try {
            const verifyRes = await api.post('/recharge/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              recharge_id,
            })
            if (verifyRes.data.status === 'success') {
              setTopUpSuccess({ amount: Number(verifyRes.data.coins_credited) || 0, id: response.razorpay_payment_id })
              setBanner(null)
              setTopUpAmount('')
              await fetchWallet({ quiet: true })
            } else {
              setBanner({ type: 'error', text: 'Top-up verification failed. Please contact support.' })
            }
          } catch {
            setBanner({ type: 'error', text: 'Something went wrong. Please try again.' })
          }
          setToppingUp(false)
        },
        modal: { ondismiss: () => setToppingUp(false) },
        theme: { color: '#073B3F' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      setBanner({ type: 'error', text: 'Unable to create top-up order. Please try again.' })
      setToppingUp(false)
    }
  }

  if (orderId) {
    return (
      <div className="op-page cx-checkout">
        <style>{styles}</style>
        <main className="op-main">
          <OrderCelebration
            fundingLabel={isDigiShop ? digiLabel : undefined}
            fundingDetail={isDigiShop ? `${Number(goldUsed).toFixed(6)} g used for this order` : undefined}
            orderId={orderId}
            coinsNeeded={coinsNeeded}
            productName={isCartCheckout ? `${cartItems.length} jewellery pieces` : product.name}
            image={firstImage}
            qty={qty}
            total={inr(paymentTotal)}
            address={savedAddress}
            banner={banner}
            downloading={downloadingReceipt}
            onDownload={handleDownloadReceipt}
            onContinue={() => navigate('/customer')}
          />
        </main>
        <CustomerFooter />
      </div>
    )
  }

  return (
    <div className="op-page cx-checkout">
      <style>{styles}</style>
      {paying && <CheckoutProcessing paymentLabel={isDigiShop ? digiLabel : undefined} />}
      <main className="op-main" aria-busy={paying} inert={paying}>
        <button type="button" className="op-back" onClick={() => navigate('/order-confirm', { state: { ...location.state, checkoutStep: 2 } })} aria-label="Back">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <header className="cx-payment-heading">
          <p className="op-kicker">Almost yours</p>
          <h1 className="op-title">One last step. All yours.</h1>
          <p>Review your total and pay with {isDigiShop ? digiLabel : 'AUG Revive'} to confirm your order.</p>
        </header>
        <CheckoutSteps active={3} paymentLabel={isDigiShop ? digiLabel : undefined} onStepChange={checkoutStep => navigate('/order-confirm', { state: { ...location.state, checkoutStep } })} />

        {banner && <div className={`op-banner ${banner.type}`}>{banner.text}</div>}
        {topUpSuccess && <WalletTopUpSuccess key={topUpSuccess.id} amount={topUpSuccess.amount} ready={!loadingWallet && !walletError && hasEnoughCoins} />}

        <div className="cx-payment-layout">
        <section className="op-card">
          <span className="cx-summary-kicker">Your selection</span>
          <h2 className="oc-summary-title">A beautiful choice, ready for checkout.</h2>
          <div className="op-order-row">
            <div className="op-order-img">
              {firstImage ? <img src={firstImage} alt="" /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: RED, fontWeight: 900 }}>BJ</div>}
            </div>
            <div>
              <span className="cx-payment-product-label">{isCartCheckout ? 'Your jewellery collection' : 'Selected for you'}</span>
              <strong>{isCartCheckout ? `${cartItems.length} jewellery pieces` : product.name}</strong>
              <div style={{ color: MUTED, fontSize: 12, fontWeight: 700, marginTop: 4 }}>Qty: {qty}</div>
            </div>
          </div>
          <div className="op-amount-row"><span>Order Amount</span><strong style={{ color: DARK }}>{inr(paymentTotal)}</strong></div>
          <div className="op-amount-row"><span>{isDigiShop ? `${digiLabel} required` : 'AUG Revive required'}</span><strong style={{ color: GOLD }}>{isDigiShop ? (loadingWallet ? 'Checking?' : `${Number(wallet.required_gm || 0).toFixed(6)} g`) : `${coinsNeeded.toLocaleString('en-IN')} AUG Revive`}</strong></div>
          <div className="op-amount-total"><span>Amount payable</span><span>{inr(paymentTotal)}</span></div>
          <div className="cx-payment-address"><MapPin size={18} /><p><strong>Deliver to {savedAddress.name}</strong><span>{[savedAddress.address, savedAddress.locality, savedAddress.city, savedAddress.state, savedAddress.pincode].filter(Boolean).join(', ')}</span></p></div>
        </section>

        <div className="cx-payment-side">
        {isDigiShop ? <>
          <section className="op-card op-balance-card">
            <div className="cx-wallet-head"><span>{digiLabel.toUpperCase()} VAULT</span><Wallet size={23} strokeWidth={1.5} /></div>
            <span className="op-balance-label">Available value</span>
            <div className="op-balance-value">{loadingWallet ? 'Checking?' : walletError ? 'Unavailable' : inr(wallet.balance_inr || 0)}</div>
            <p className="cx-wallet-foot">{Number(wallet.holding_gm || 0).toFixed(4)} g available ? valued at the current rate</p>
          </section>
          <section className="op-card">
            {loadingWallet ? <p role="status">Checking current price and holding?</p> : walletError ? <><p role="alert">We could not verify this shopping session or holding. Try again, or open Sell from Digi Gold to start again.</p><button type="button" className="op-pay-btn" onClick={() => fetchWallet()}>Try again</button><button type="button" className="op-back" onClick={() => navigate('/digi-gold')}>Back to Digi Gold</button></> : wallet.eligible ? <>
              <div className="cx-revive-ready"><span><Check size={18} /></span><div><strong>Your vault value covers this piece.</strong><p>Only {Number(wallet.required_gm).toFixed(6)} g will be used. Your remaining holding stays in your vault.</p></div></div>
              <button className="op-pay-btn" disabled={paying} onClick={handlePayWithCoins}>{paying ? 'Confirming?' : <>Pay with {digiLabel} <ArrowRight size={18} /></>}</button>
              <p className="cx-payment-note"><LockKeyhole size={13} />Gold is sold at the current rate and its value pays for this order. The sale and purchase complete together.</p>
            </> : <><p className="op-status-banner no">Your current vault value no longer covers this quantity. Choose another piece or reduce the quantity.</p><button type="button" className="op-pay-btn" onClick={() => navigate('/digi-gold/shop', { state: { fromDigiGold: true, metal: digiShop.metal } })}>Explore jewellery</button></>}
          </section>
        </> : <>
        <section className="op-card op-balance-card">
          {topUpSuccess && <div key={topUpSuccess.id} className="cx-wallet-credit-shine" aria-hidden="true" />}
          <div className="cx-wallet-head"><span>AUG REVIVE WALLET</span><Wallet size={23} strokeWidth={1.5} /></div>
          <span className="op-balance-label">Available balance</span>
          <div className="op-balance-value">
            {loadingWallet ? 'Checking…' : walletError ? 'Unavailable' : <AnimatedReviveBalance value={wallet.balance_coins} />}
            {!loadingWallet && !walletError && <span>Revive</span>}
          </div>
          <p className="cx-wallet-foot"><Coins size={13} /> 100 AUG Revive = ₹1</p>
          <div className="cx-wallet-decoration" aria-hidden="true" />
        </section>

        <section className="op-card">
          {loadingWallet ? (
            <div className="op-status-banner" role="status">Checking your wallet balance…</div>
          ) : walletError ? (
            <><div className="op-status-banner no" role="alert">We couldn’t load your wallet balance.</div><button type="button" className="op-pay-btn" onClick={fetchWallet}>Try again</button></>
          ) : hasEnoughCoins ? (
            <>
              <div className="cx-revive-ready"><span><Check size={18} /></span><div><strong>You’re all set!</strong><p>Your AUG Revive balance covers this order.</p></div></div>
              <button id="cx-confirm-payment" className="op-pay-btn" disabled={paying} onClick={handlePayWithCoins}>
                {paying ? 'Confirming your order…' : <>Pay {coinsNeeded.toLocaleString('en-IN')} AUG Revive <ArrowRight size={18} /></>}
              </button>
            </>
          ) : (
            <>
              <div className="op-status-banner no">
                <AlertIcon /> You’re almost there. Add {shortfallCoins.toLocaleString('en-IN')} AUG Revive ({inr(shortfallRupees)}) to complete your order.
              </div>
              <label htmlFor="cx-topup-amount" className="cx-topup-label">Amount to add (₹)</label>
              <input
                id="cx-topup-amount"
                className="op-shortfall-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="Enter amount in rupees"
                value={topUpAmount}
                onChange={e => {
                  const value = e.target.value
                  if (/^\d*(?:\.\d{0,2})?$/.test(value)) setTopUpAmount(value)
                }}
              />
              <button className="op-buy-coin-btn" disabled={toppingUp || !Number.isFinite(Number(topUpAmount)) || Number(topUpAmount) <= 0} onClick={handleBuyAugCoin}>
                {toppingUp ? 'Opening payment…' : <><CoinIcon /> Add AUG Revive</>}
              </button>
            </>
          )}
          {!loadingWallet && !walletError && <p className="cx-payment-note"><LockKeyhole size={13} /> {hasEnoughCoins ? 'Your order is confirmed after payment succeeds.' : 'Add AUG Revive to your wallet, then confirm your order.'}</p>}
        </section>
        </>}
        </div>
        </div>
      </main>
      <CustomerFooter />
    </div>
  )
}
