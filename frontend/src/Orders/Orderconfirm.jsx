import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CustomerFooter from '../collection/CustomerFooter'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Coins, Crosshair, Home, MapPin, PackageCheck, Pencil, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import './CheckoutExperience.css'
import api, { checkoutAddress, loadAddressBook, mapsCoordinates, mapsSearchUrl } from '../api'

const steps = [
  { label: 'Your selection', detail: 'Review your order', Icon: ShoppingBag },
  { label: 'Delivery', detail: 'Choose your address', Icon: MapPin },
  { label: 'Payment', detail: 'Pay with AUG Revive', Icon: Coins },
]

function CheckoutSteps({ active, onStepChange }) {
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
          <span><strong>{step.label}</strong><small>{step.detail}</small></span>
          <span className="cx-step-number" aria-hidden="true">0{index + 1}</span>
          {onStepChange && index + 1 < active && <button type="button" className="cx-step-jump" aria-label={`Back to ${step.label}`} onClick={() => onStepChange(index + 1)} />}
        </li>
      ))}
    </ol>
  )
}

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'
const GOLD = '#BB8958'
const DARK = '#111817'
const CREAM = '#FDFDFC'
const MUTED = '#7A8987'
const RED = '#073B3F'

function JewelleryCheckoutArt() {
  return (
    <svg className="cx-jewellery-art" viewBox="0 0 280 200" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cx-jewel-gold" x1="70" y1="35" x2="190" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EEDBA8" /><stop offset=".45" stopColor="#B48A4B" /><stop offset="1" stopColor="#E9C980" />
        </linearGradient>
        <linearGradient id="cx-jewel-velvet" x1="75" y1="74" x2="193" y2="179" gradientUnits="userSpaceOnUse">
          <stop stopColor="#286B62" /><stop offset="1" stopColor="#123E40" />
        </linearGradient>
      </defs>
      <circle cx="144" cy="98" r="86" stroke="#DCCBA5" strokeOpacity=".65" />
      <circle cx="144" cy="98" r="72" stroke="#DCCBA5" strokeDasharray="2 7" strokeOpacity=".6" />
      <ellipse cx="144" cy="177" rx="77" ry="9" fill="#1C5144" fillOpacity=".07" />
      <g className="cx-jewellery-box">
        <path d="M76 111 97 49c2-6 8-10 15-9l72 13c6 1 10 7 8 13l-18 60-98-15Z" fill="#D7C49B" />
        <path d="m83 106 18-54c1-3 4-5 8-4l72 13c3 1 4 3 3 6l-16 52-85-13Z" fill="url(#cx-jewel-velvet)" />
        <path d="m77 107 98 13 24 29-99-12-23-30Z" fill="#D9C69D" />
        <path d="m80 110 92 12 17 22-87-10-22-24Z" fill="#28665B" />
        <path d="m77 107 23 30 99 12v17c0 5-5 9-10 8l-88-13c-4-1-7-3-9-6l-15-23v-25Z" fill="url(#cx-jewel-velvet)" />
        <path d="m100 137 99 12" stroke="#D7BE83" strokeWidth="2" />
        <rect x="141" y="149" width="17" height="10" rx="3" transform="rotate(8 141 149)" fill="#D5B575" />
        <path d="M116 65c-8 17-8 35 7 43 15 7 30-5 36-33" stroke="url(#cx-jewel-gold)" strokeWidth="3" strokeLinecap="round" />
        <path d="m129 105 9 4-1 12-9-3-5-9 6-4Z" fill="url(#cx-jewel-gold)" />
        <path d="m129 109 5 2-1 6-5-2-2-4 3-2Z" fill="#FFFAE7" />
        <ellipse cx="135" cy="129" rx="15" ry="6" transform="rotate(8 135 129)" stroke="url(#cx-jewel-gold)" strokeWidth="4" />
        <path d="m134 119 5 1 2 5-5 3-5-4 3-5Z" fill="#FAF2D7" stroke="#C8A96C" />
      </g>
      <g className="cx-jewellery-stars" stroke="#BA9559" strokeWidth="1.6" strokeLinecap="round">
        <path d="M211 44v18m-9-9h18m-15-6 12 12m0-12-12 12" />
        <path d="M59 104v12m-6-6h12M213 122v10m-5-5h10" />
      </g>
      <circle cx="77" cy="42" r="3" fill="#D5B575" /><circle cx="231" cy="94" r="2" fill="#D5B575" />
    </svg>
  )
}

const BANKS = [
  { name: 'State Bank of India', color: '#1a5276', initial: 'SBI' },
  { name: 'HDFC Bank', color: '#004c91', initial: 'HDFC' },
  { name: 'ICICI Netbanking', color: '#f96b1b', initial: 'ICICI' },
  { name: 'Axis Bank', color: '#800000', initial: 'AXIS' },
  { name: 'AU Small Finance Bank', color: '#f5a623', initial: 'AU' },
  { name: 'Kotak Mahindra Bank', color: '#ed1c24', initial: 'KMB' },
  { name: 'Bank of Baroda', color: '#f47920', initial: 'BOB' },
  { name: 'Punjab National Bank', color: '#003f7f', initial: 'PNB' },
  { name: 'Canara Bank', color: '#00539c', initial: 'CNB' },
  { name: 'IndusInd Bank', color: '#672f7e', initial: 'IIB' },
]

// ── SVG ICONS ──
const IconLocation = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
)
const IconCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)
const IconUPI = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
  </svg>
)
const IconBank = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/>
    <line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/>
    <line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
  </svg>
)
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const checkoutStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

  .oc-page {
    min-height: 100vh;
    background:
      linear-gradient(180deg, rgba(231,237,236,0.74) 0%, #FDFDFC 28%, #F3F3F0 100%);
    color: #111817;
    font-family: "Montserrat", system-ui, sans-serif;
  }

  .oc-main {
    width: min(1320px, calc(100% - 40px));
    margin: 0 auto;
    padding: clamp(42px, 5vw, 72px) 0 88px;
    animation: fadeUp 0.42s ease both;
  }

  .oc-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    margin-bottom: 16px;
    border: 1px solid rgba(189,207,206,0.78);
    border-radius: 50%;
    background: rgba(253,253,252,0.92);
    color: #073B3F;
    cursor: pointer;
  }

  .oc-back:active {
    opacity: 0.6;
  }

  .oc-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 22px;
    align-items: end;
    margin-bottom: 30px;
  }

  .oc-kicker {
    margin: 0 0 10px;
    color: #BB8958;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 2.8px;
    text-transform: uppercase;
  }

  .oc-hero h1 {
    margin: 0;
    color: #073B3F;
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(42px, 5vw, 68px);
    line-height: 0.98;
  }

  .oc-hero p {
    margin: 14px 0 0;
    color: #52625f;
    font-size: 14px;
    line-height: 1.75;
    max-width: 680px;
  }

  .oc-trust-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(12,64,68,0.18);
    border-radius: 999px;
    background: rgba(253,253,252,0.82);
    color: #073B3F;
    padding: 13px 18px;
    font-size: 12px;
    font-weight: 900;
    box-shadow: 0 14px 34px rgba(12,64,68,0.08);
  }

  .oc-stepper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }

  .oc-step {
    position: relative;
    border: 1px solid rgba(189,207,206,0.78);
    border-radius: 8px;
    background: rgba(253,253,252,0.82);
    padding: 14px 16px;
    color: #7A8987;
    font-size: 12px;
    font-weight: 900;
  }

  .oc-step.active {
    border-color: rgba(12,64,68,0.34);
    background: linear-gradient(135deg, #073B3F, #0C4044);
    color: #FDFDFC;
    box-shadow: 0 18px 42px rgba(12,64,68,0.18);
  }

  .oc-step i {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    margin-right: 9px;
    background: rgba(122,137,135,0.14);
    font-style: normal;
  }

  .oc-step.active i {
    background: rgba(253,253,252,0.15);
  }

  .oc-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(340px, 0.42fr);
    gap: 28px;
    align-items: start;
  }

  .oc-review-card,
  .oc-summary-card {
    border: 1px solid rgba(189,207,206,0.84);
    border-radius: 8px;
    background: rgba(253,253,252,0.92);
    box-shadow: 0 28px 76px rgba(12,64,68,0.11);
    overflow: hidden;
  }

  .oc-product-band {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    grid-template-areas:
      "img tag"
      "img title"
      "img specs";
    align-content: start;
    gap: 8px 24px;
    padding: 26px;
    background: linear-gradient(120deg, rgba(231,237,236,0.82), rgba(243,232,222,0.70));
  }

  .oc-product-band .oc-product-img { grid-area: img; }
  .oc-product-band .oc-product-tag { grid-area: tag; margin-bottom: 0; align-self: start; }
  .oc-product-band .oc-product-title { grid-area: title; }
  .oc-product-band .oc-specs { grid-area: specs; }

  .oc-product-img {
    width: 150px;
    height: 150px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(204,168,129,0.44);
    background: #FDFDFC;
    box-shadow: 0 20px 44px rgba(12,64,68,0.12);
  }

  .oc-product-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .oc-product-tag {
    display: inline-flex;
    border: 1px solid rgba(187,137,88,0.42);
    border-radius: 999px;
    background: rgba(243,232,222,0.76);
    color: #9F6130;
    padding: 7px 11px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .oc-product-title {
    margin: 0 0 14px;
    color: #073B3F;
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(28px, 3vw, 42px);
    line-height: 1;
  }

  .oc-specs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .oc-spec {
    border: 1px solid rgba(12,64,68,0.12);
    border-radius: 8px;
    background: rgba(253,253,252,0.78);
    padding: 12px;
  }

  .oc-spec span {
    display: block;
    color: #7A8987;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .oc-spec strong {
    color: #111817;
    font-size: 14px;
  }

  .oc-qty-row,
  .oc-price-panel {
    padding: 22px 26px;
    border-top: 1px solid rgba(189,207,206,0.62);
  }

  .oc-qty-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
  }

  .oc-stepper-qty {
    display: inline-flex;
    border: 1px solid rgba(189,207,206,0.92);
    border-radius: 999px;
    overflow: hidden;
    background: #FDFDFC;
  }

  .oc-stepper-qty button,
  .oc-stepper-qty span {
    width: 44px;
    height: 42px;
    border: 0;
    display: grid;
    place-items: center;
    background: transparent;
    color: #073B3F;
    font-weight: 900;
  }

  .oc-stepper-qty button {
    cursor: pointer;
  }

  .oc-row {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 12px;
    color: #52625f;
    font-size: 14px;
  }

  .oc-row strong {
    color: #111817;
  }

  .oc-total {
    border-top: 1px dashed rgba(12,64,68,0.20);
    padding-top: 16px;
    margin-top: 16px;
    font-size: 18px;
    font-weight: 900;
    color: #073B3F;
  }

  .oc-delivery-note {
    margin-top: 18px;
    border: 1px solid rgba(12,64,68,0.16);
    border-radius: 8px;
    background: rgba(231,237,236,0.72);
    padding: 15px 16px;
    color: #073B3F;
    font-size: 13px;
    font-weight: 800;
  }

  .oc-primary {
    width: 100%;
    margin-top: 22px;
    min-height: 58px;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, #073B3F, #0C4044);
    color: #FDFDFC;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 22px 44px rgba(12,64,68,0.18);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .oc-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 28px 58px rgba(12,64,68,0.24);
  }

  .oc-summary-card {
    position: sticky;
    top: 178px;
    padding: 24px;
  }

  .oc-summary-title {
    margin: 0 0 16px;
    color: #073B3F;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }

  .oc-secure-box {
    margin-top: 18px;
    border: 1px dashed rgba(12,64,68,0.34);
    border-radius: 8px;
    background: rgba(231,237,236,0.54);
    padding: 13px 14px;
    color: #073B3F;
    font-size: 12px;
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @media (max-width: 980px) {
    .oc-hero,
    .oc-layout,
    .oc-product-band {
      grid-template-columns: 1fr;
    }
    .oc-summary-card {
      position: relative;
      top: auto;
    }
  }

  @media (max-width: 640px) {
    .oc-main {
      width: min(100% - 20px, 1320px);
      padding: 16px 0 60px;
    }
    .oc-stepper {
      display: flex;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 4px;
      gap: 8px;
    }
    .oc-stepper::-webkit-scrollbar { display: none; }
    .oc-specs {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    .oc-product-band {
      grid-template-columns: 74px minmax(0, 1fr) !important;
      grid-template-areas:
        "img tag"
        "title title"
        "specs specs" !important;
      gap: 10px 12px;
      padding: 14px;
      border-radius: 12px;
    }
    .oc-product-img {
      width: 74px;
      height: 74px;
      border-radius: 8px;
    }
    .oc-product-band .oc-product-tag {
      align-self: center;
    }
    .oc-product-title {
      font-size: 21px !important;
      margin: 0 !important;
    }
    .oc-hero {
      padding: 18px 14px;
      border-radius: 16px;
      margin-bottom: 16px;
    }
    .oc-hero h1 {
      font-size: 26px;
    }
    .oc-card {
      padding: 16px 14px;
      border-radius: 14px;
      margin-bottom: 14px;
    }
    .oc-summary-card {
      padding: 18px 14px;
      border-radius: 16px;
    }
    .oc-buy {
      min-height: 48px;
      font-size: 13px;
    }
  }
`

export default function OrderConfirm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { product, qty: initialQty, displayPrice, metal, cartItems = [], cartTotal } = location.state || {}
  const isCartCheckout = Array.isArray(cartItems) && cartItems.length > 0
  const cartQuantity = isCartCheckout ? cartItems.reduce((sum, item) => sum + (Number(item.qty) || 1), 0) : 0
  const cartAmount = isCartCheckout ? cartItems.reduce((sum, item) => sum + (Number(item.total) || ((Number(item.price) || 0) * (Number(item.qty) || 1))), 0) : 0

  const [qty, setQty] = useState(isCartCheckout ? cartQuantity || 1 : initialQty || 1)
  const [step, setStep] = useState(location.state?.checkoutStep === 2 ? 2 : 1)
  const placing = false

  const [showAddressPopup, setShowAddressPopup] = useState(true)
  const [savedAddress, setSavedAddress] = useState(null)
  const [payTab, setPayTab] = useState('card')
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '' })
  const [upiId, setUpiId] = useState('')
  const [selectedBank, setSelectedBank] = useState(null)
  const [bankSearch, setBankSearch] = useState('')

  useEffect(() => { if (!product) navigate(-1) }, [product, navigate])
  if (!product) return null

  const getImageUrl = img => {
    if (!img) return null
    let p = typeof img === 'object' ? (img.image || img.url || '') : img
    if (!p) return null
    if (p.startsWith('http')) return p
    return `${API_BASE}/${p.replace(/^\/+/, '')}`
  }

  const firstImage = product.images?.[0] ? getImageUrl(product.images[0]) : cartItems[0]?.image || null
  const totalPrice = isCartCheckout ? (Number(cartTotal) || cartAmount) : (displayPrice || 0) * qty
  const inr = n => `Rs. ${Math.round(n).toLocaleString('en-IN')}`

  const handlePlaceOrder = () => {
    if (!savedAddress || showAddressPopup) return
    // ── Razorpay ippo direct-a open aagathu — AUG Revive payment page ku pogum ──
    navigate('/order-payment', {
      state: {
        product,
        qty: isCartCheckout ? cartQuantity : qty,
        displayPrice,
        totalPrice,
        metal,
        isCartCheckout,
        cartItems,
        firstImage,
        savedAddress,
      }
    })
  }

  const filteredBanks = BANKS.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()))

  const inp = err => ({
    width: '100%', padding: '13px 16px',
    border: `1px solid ${err ? '#e53e3e' : '#D1DFDE'}`,
    borderRadius: 8, fontSize: 14, color: DARK,
    background: '#FDFDFC', outline: 'none',
    fontFamily: '"Montserrat", sans-serif',
    boxSizing: 'border-box',
  })
  const lbl = { display: 'block', fontSize: 12, color: '#7A8987', marginBottom: 6, fontWeight: 700 }

  const OrderSidebar = () => (
    <aside className="oc-summary-card">
      <span className="cx-summary-kicker">The little details</span>
      <h3 className="oc-summary-title">Your order summary</h3>
      {isCartCheckout ? (
        <div style={{ display: 'grid', gap: 12, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid rgba(189,207,206,0.62)' }}>
          {cartItems.map(item => (
            <div key={`${item.id}-${item.product_id}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: 8, border: '1px solid rgba(204,168,129,0.42)', background: '#FDFDFC', overflow: 'hidden', flexShrink: 0 }}>
                {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#073B3F', fontWeight: 900 }}>BJ</div>}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#073B3F', marginBottom: 4, lineHeight: 1.15 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#7A8987', fontWeight: 700 }}>Qty: {item.qty}</div>
              </div>
              <strong style={{ color: '#111817', fontSize: 13 }}>{inr(item.total || ((item.price || 0) * (item.qty || 1)))}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid rgba(189,207,206,0.62)' }}>
          <div style={{ width: 66, height: 66, borderRadius: 8, border: '1px solid rgba(204,168,129,0.42)', background: '#FDFDFC', overflow: 'hidden', flexShrink: 0 }}>
            {firstImage ? <img src={firstImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#073B3F', fontWeight: 900 }}>BJ</div>}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#073B3F', fontFamily: '"Playfair Display", serif', marginBottom: 5, lineHeight: 1.1 }}>{product.name}</div>
            <div style={{ fontSize: 11, color: '#9F6130', marginBottom: 3, fontWeight: 800 }}>{product.product_code || `${metal?.toUpperCase()} ${product.grade?.toUpperCase() || ''}`}</div>
            <div style={{ fontSize: 12, color: '#7A8987', fontWeight: 700 }}>Qty: {qty}</div>
          </div>
        </div>
      )}
      <div>
        <div className="oc-row"><span>Sub Total</span><strong>{inr(totalPrice)}</strong></div>
        <div className="oc-row"><span>Delivery Charge</span><strong style={{ color: '#16a34a' }}>FREE</strong></div>
        <div className="oc-row"><span>GST</span><strong>Included</strong></div>
        <div className="oc-row oc-total"><span>Amount Payable</span><strong>{inr(totalPrice)}</strong></div>
      </div>
      <div className="oc-secure-box">
        <IconShield /><span>Delivery secured by BitByte</span>
      </div>
      {step === 1 ? (
        <>
          <button className="oc-primary cx-review-continue" type="button" onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            Continue to delivery <ArrowRight size={18} />
          </button>
          <p className="cx-summary-caption">Choose your address next.<br />You can review everything before payment.</p>
        </>
      ) : <p className="cx-summary-caption">Next: pay with your AUG Revive balance.</p>}
    </aside>
  )

  if (step === 1) {
    return (
      <div className="oc-page cx-checkout">
        <style>{checkoutStyles}</style>
        <main className="oc-main">
          <button type="button" className="oc-back" onClick={() => navigate(-1)} aria-label="Back">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <header className="oc-hero">
            <div>
              <p className="oc-kicker">Secure Checkout</p>
              <h1>A beautiful <span>choice.</span></h1>
              <p>Your next favourite is almost yours. Review your selection, then choose where we should deliver it.</p>
            </div>
            <div className="cx-hero-visual">
              <JewelleryCheckoutArt />
              <div className="oc-trust-pill"><IconShield /> Review before you pay</div>
            </div>
          </header>

          <CheckoutSteps active={1} />

          <div className="oc-layout">
            <div>
              <section className="oc-review-card">
                <div className="oc-product-band">
                  <div className="oc-product-img">
                    {firstImage ? <img src={firstImage} alt={product.name} /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#073B3F', fontWeight: 900 }}>Team 369</div>}
                  </div>
                  <div className="oc-product-tag">{isCartCheckout ? 'Cart Checkout' : `${metal?.toUpperCase()} ${product.grade?.toUpperCase() || ''}`}</div>
                  <h2 className="oc-product-title">{product.name}</h2>
                  <div className="oc-specs">
                    {[
                      { label: isCartCheckout ? 'Items' : 'Metal', value: isCartCheckout ? cartItems.length : metal?.charAt(0).toUpperCase() + metal?.slice(1) },
                      { label: isCartCheckout ? 'Quantity' : 'Weight', value: isCartCheckout ? cartQuantity : product.net_weight ? `${product.net_weight} gm` : '-' },
                      { label: isCartCheckout ? 'Shipping' : 'Purity', value: isCartCheckout ? 'Insured' : product.grade?.toUpperCase() || '-' },
                    ].map(s => (
                      <div className="oc-spec" key={s.label}><span>{s.label}</span><strong>{s.value}</strong></div>
                    ))}
                  </div>
                </div>

                {!isCartCheckout && <div className="oc-qty-row">
                  <div>
                    <strong style={{ display: 'block', color: '#073B3F', fontSize: 16, marginBottom: 4 }}>Quantity</strong>
                    <span style={{ color: '#7A8987', fontSize: 12, fontWeight: 700 }}>Adjust pieces before checkout</span>
                  </div>
                  <div className="oc-stepper-qty">
                    <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                    <span aria-live="polite">{qty}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQty(q => q + 1)}>+</button>
                  </div>
                </div>}

                <div className="oc-price-panel">
                  <div className="oc-row"><span>{isCartCheckout ? 'Cart Subtotal' : 'Unit Price'}</span><strong>{inr(isCartCheckout ? totalPrice : displayPrice || 0)}</strong></div>
                  <div className="oc-row"><span>Quantity</span><strong>x {isCartCheckout ? cartQuantity : qty}</strong></div>
                  <div className="oc-row"><span>GST</span><strong>Included</strong></div>
                  <div className="oc-row"><span>Shipping</span><strong style={{ color: '#16a34a' }}>FREE</strong></div>
                  <div className="oc-row oc-total"><span>Total</span><strong>{inr(totalPrice)}</strong></div>
                  <div className="oc-delivery-note"><Truck size={18} /><span>Free insured delivery · Estimated arrival in <strong>3–5 business days</strong></span></div>
                </div>
              </section>

              <div className="cx-reassurance">
                <div><Truck size={20} /><span>Free delivery</span></div>
                <div><Coins size={20} /><span>Pay with AUG Revive</span></div>
                <div><ShoppingBag size={20} /><span>Review before you pay</span></div>
              </div>
            </div>
            <OrderSidebar />
          </div>
          <div className="cx-review-bar">
            <div><span>Order total</span><strong>{inr(totalPrice)}</strong></div>
            <button type="button" className="oc-primary" onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Continue <ArrowRight size={18} /></button>
          </div>
        </main>
        <CustomerFooter />
      </div>
    )
  }
  // STEP 2: DELIVER TO ──
  if (step === 2) {
    return (
      <div className="cx-checkout" style={{ minHeight: '100vh', background: CREAM, fontFamily: '"Montserrat", sans-serif' }}>
        <style>{checkoutStyles}</style>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap');
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes modalIn{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
          .oc-btn:hover{opacity:.88}.country-opt:hover{background:#e7edec!important}
          .address-inline-card{border:1px solid #bdcfce!important;border-radius:8px!important;background:#fff;box-shadow:0 14px 34px rgba(7,59,63,.08);animation:modalIn .28s ease both}
          .address-modal-header{padding:24px 30px!important;background:linear-gradient(110deg,#fdfdfc,#e7edec);border-bottom:1px solid #bdcfce!important}
          .address-kicker{margin:0 0 5px;color:#9f6130;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase}
          .address-title{font-family:"Playfair Display",serif;font-size:26px!important;color:#073b3f!important}
          .address-subtitle{margin:5px 0 0;color:#7a8987;font-size:12px;line-height:1.5}
          .address-close{width:38px;height:38px;border:1px solid #bdcfce!important;border-radius:50%!important;background:#fdfdfc!important;color:#073b3f!important;font-size:21px!important;transition:.2s ease}
          .address-close:hover{background:#073b3f!important;color:#fff!important;transform:rotate(90deg)}
          .address-modal-body{padding:24px 30px 28px!important;background:#fdfdfc}
          .address-section{padding:20px;border:1px solid #d1dfde;border-radius:8px;background:#fff;margin-bottom:16px}
          .address-section-title{display:flex;align-items:center;gap:10px;margin:0 0 18px!important;font-family:"Playfair Display",serif;font-size:17px!important;color:#073b3f!important}
          .address-section-title:before{content:"";width:4px;height:20px;border-radius:2px;background:#bb8958}
          .address-modal input:focus{outline:none!important;border-color:#0c4044!important;box-shadow:0 0 0 3px rgba(12,64,68,.1)}
          .address-type-button:hover{border-color:#0c4044!important;color:#0c4044!important;transform:translateY(-1px)}
          .address-default{padding:12px 14px;border-radius:6px;background:#f3f3f0}
          .address-modal-footer{padding:16px 30px!important;background:#f3f3f0;border-top:1px solid #d1dfde!important}
          .address-action{min-height:46px;border-radius:5px!important;transition:transform .2s ease,box-shadow .2s ease}
          .address-action:hover{transform:translateY(-2px);box-shadow:0 9px 20px rgba(7,59,63,.15)}
          .address-submit{background:#073b3f!important;min-width:190px}
          .delivery-main{max-width:1240px!important;padding-top:38px!important}
          .delivery-heading{margin-bottom:28px}
          .delivery-kicker{margin:0 0 7px;color:#9f6130;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase}
          .delivery-heading h1{margin:0;font-family:"Playfair Display",serif;color:#073b3f;font-size:34px;line-height:1.1}
          .delivery-heading p{margin:8px 0 0;color:#7a8987;font-size:13px}
          .delivery-layout{grid-template-columns:minmax(0,1fr) 390px!important;gap:30px!important}
          .delivery-step{gap:16px!important;margin-bottom:22px!important}
          .delivery-step-marker{width:46px!important;height:46px!important;background:#e7edec!important;border-color:#bdcfce!important;color:#073b3f;box-shadow:0 7px 18px rgba(7,59,63,.08)}
          .delivery-step-line{background:linear-gradient(#bdcfce,transparent)!important}
          .delivery-content h2,.delivery-content h3{color:#073b3f!important;letter-spacing:0!important}
          .saved-address-card{border:1px solid #bdcfce!important;border-radius:8px!important;box-shadow:0 14px 34px rgba(7,59,63,.08);transition:transform .2s ease,box-shadow .2s ease}
          .saved-address-card:hover{transform:translateY(-2px);box-shadow:0 18px 42px rgba(7,59,63,.12)}
          .saved-address-head{padding:15px 20px!important;background:#e7edec;border-bottom-color:#d1dfde!important}
          .saved-address-body{padding:20px!important}
          .new-address-button{border-color:#0c4044!important;color:#073b3f!important;background:#fdfdfc!important;min-height:38px}
          .voucher-card{background:#f3f3f0!important;border-color:#d1dfde!important;min-height:54px;transition:.2s ease}
          .voucher-card:hover{background:#e7edec!important;border-color:#bdcfce!important;transform:translateX(3px)}
          .delivery-layout .oc-summary-card{position:sticky;top:190px;border-color:#bdcfce;box-shadow:0 18px 44px rgba(7,59,63,.1)}
          .checkout-actionbar{position:fixed!important;bottom:18px!important;left:50%!important;right:auto!important;transform:translateX(-50%);width:min(1192px,calc(100% - 48px));margin:0!important;padding:14px 18px!important;border:1px solid #bdcfce!important;border-radius:8px!important;background:rgba(253,253,252,.96)!important;backdrop-filter:blur(12px);box-shadow:0 16px 42px rgba(7,59,63,.14)!important}
          .checkout-total-label{font-size:10px;color:#7a8987;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
          .checkout-total-value{font-family:"Playfair Display",serif;font-size:23px!important;color:#073b3f!important}
          .checkout-buy{min-width:220px;border-radius:5px!important;background:#073b3f!important;min-height:50px;transition:.2s ease}
          .checkout-buy:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(7,59,63,.22)}
          .checkout-buy:disabled{background:#bdcfce!important;color:#fdfdfc!important}
          @media(max-width:700px){
            .address-modal-header,.address-modal-body,.address-modal-footer{padding-left:18px!important;padding-right:18px!important}
            .address-contact-grid,.address-location-grid,.address-detail-grid{grid-template-columns:1fr!important}
            .address-section{padding:16px}
            .address-modal-footer{display:flex!important}
            .address-action{flex:1;padding:11px 14px!important;min-width:0!important}
          }
          @media(max-width:900px){
            .delivery-layout{grid-template-columns:1fr!important}
            .delivery-layout .oc-summary-card{position:static}
          }
          @media(max-width:620px){
            .delivery-main{padding:28px 14px 70px!important}
            .delivery-heading h1{font-size:28px}
            .delivery-step-marker-wrap{display:none!important}
            .saved-address-body{flex-direction:column;gap:18px}
            .saved-address-actions{width:100%;margin-left:0!important;flex-direction:row!important}
            .saved-address-actions button{flex:1}
            .checkout-actionbar{bottom:8px!important;width:calc(100% - 24px)!important}
            .checkout-buy{min-width:0}
          }
        `}</style>

        <main className="delivery-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 100px', animation: 'fadeUp 0.4s ease both' }}>
          <button
            type="button"
            className="oc-back"
            onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            aria-label="Back to review order"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <header className="delivery-heading">
            <p className="delivery-kicker">One step closer</p>
            <h1>Make it a special delivery.</h1>
            <p>Choose an address for your order. We’ll keep your selection ready for payment.</p>
          </header>
          <CheckoutSteps active={2} onStepChange={next => { setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
          <div className="delivery-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
            <div>
              {/* DELIVER TO */}
              <div className="delivery-step" style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
                <div className="delivery-step-marker-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div className="delivery-step-marker" style={{ width: 44, height: 44, borderRadius: '50%', background: '#f7f4f0', border: '1px solid #e2d9d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconLocation /></div>
                  <div className="delivery-step-line" style={{ width: 1, flex: 1, background: '#e2d9d0', marginTop: 8, minHeight: 40 }} />
                </div>
                <div className="delivery-content" style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: DARK }}>Your delivery address</h2>
                  <AddressBook onSelect={setSavedAddress} onEditingChange={setShowAddressPopup} onBack={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
                </div>
              </div>

              <section className="cx-next-card">
                <h3><PackageCheck size={19} /> Just a few simple steps</h3>
                <ol>
                  <li><span>1</span>Choose your delivery address</li>
                  <li><span>2</span>Review your AUG Revive payment</li>
                  <li><span>3</span>Get your order confirmation</li>
                </ol>
              </section>
          <div className="checkout-actionbar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2d9d0', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
            <div>
              <div className="checkout-total-label">Final payable · {isCartCheckout ? cartQuantity : qty} item{(isCartCheckout ? cartQuantity : qty) > 1 ? 's' : ''}</div>
              <div className="checkout-total-value" style={{ fontSize: 16, fontWeight: 700, color: RED }}>{inr(totalPrice)}</div>
            </div>
           <button className="oc-btn checkout-buy" disabled={!savedAddress || showAddressPopup || placing} onClick={handlePlaceOrder}
              style={{ padding: '14px 32px', background: (savedAddress && !placing) ? RED : '#ccc', border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '1px', textTransform: 'uppercase', cursor: (savedAddress && !placing) ? 'pointer' : 'not-allowed' }}>
              {placing ? 'Processing...' : <>Continue to payment <ArrowRight size={18} /></>}
            </button>
          </div>
            </div>
            <OrderSidebar />
          </div>

        </main>
        <CustomerFooter />
      </div>
    )
  }

  // ── STEP 3: PAYMENT ──
  if (step === 3) {
    return (
      <div className="cx-checkout" style={{ minHeight: '100vh', background: CREAM, fontFamily: '"Montserrat", sans-serif' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700&display=swap');
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          .oc-btn:hover{opacity:0.88}
          .pay-tab:hover{background:rgba(123,31,46,0.03)}
          .bank-row:hover{background:#fdf8f6}
          input[type=radio]{accent-color:#7B1F2E}
        `}</style>
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 100px', animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

            {/* Payment Box */}
            <div style={{ background: '#fff', border: '1px solid #e2d9d0', borderRadius: 8, overflow: 'hidden' }}>
              {/* Top bar */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ebe4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Order Amount</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: DARK }}>{inr(totalPrice)}</div>
                </div>
                <div style={{ padding: '8px 16px', border: `1px dashed ${RED}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconShield />
                  <span style={{ fontSize: 12, fontWeight: 600, color: RED }}>Delivery secured by BitByte</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '195px 1fr', minHeight: 420 }}>
                {/* Sidebar tabs */}
                <div style={{ borderRight: '1px solid #f0ebe4' }}>
                  {[
                    { key: 'card', label: 'Debit / Credit Card', icon: <IconCard /> },
                    { key: 'upi', label: 'UPI', icon: <IconUPI /> },
                    { key: 'netbanking', label: 'Netbanking', icon: <IconBank /> },
                  ].map(tab => (
                    <div key={tab.key} className="pay-tab"
                      onClick={() => setPayTab(tab.key)}
                      style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderLeft: payTab === tab.key ? `3px solid ${RED}` : '3px solid transparent', background: payTab === tab.key ? 'rgba(123,31,46,0.04)' : 'transparent', transition: 'all 0.15s' }}>
                      <span style={{ color: payTab === tab.key ? RED : '#bbb' }}>{tab.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: payTab === tab.key ? 700 : 400, color: payTab === tab.key ? DARK : '#888' }}>{tab.label}</span>
                    </div>
                  ))}
                </div>

                {/* Content */}
                <div style={{ padding: 28 }}>

                  {/* CARD */}
                  {payTab === 'card' && (
                    <div>
                      <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: DARK }}>Enter Credit / Debit card details</h3>
                      <div style={{ marginBottom: 16 }}>
                        <label style={lbl}>Card Number</label>
                        <div style={{ position: 'relative' }}>
                          <input style={{ ...inp(), paddingRight: 48 }} placeholder="Enter Card Number"
                            value={cardForm.number} maxLength={19}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                              setCardForm(f => ({ ...f, number: v.match(/.{1,4}/g)?.join(' ') || v }))
                            }} />
                          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#ccc' }}><IconCard /></div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                        <div>
                          <label style={lbl}>Expiry</label>
                          <input style={inp()} placeholder="MM/YY" maxLength={5}
                            value={cardForm.expiry}
                            onChange={e => {
                              let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                              if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2)
                              setCardForm(f => ({ ...f, expiry: v }))
                            }} />
                        </div>
                        <div>
                          <label style={lbl}>CVV</label>
                          <div style={{ position: 'relative' }}>
                            <input style={inp()} placeholder="CVV" maxLength={3} type="password"
                              value={cardForm.cvv} onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))} />
                            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: '#e2d9d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#777', cursor: 'help' }}>?</span>
                          </div>
                        </div>
                      </div>
                      <button className="oc-btn" disabled={placing} onClick={handlePlaceOrder}
                        style={{ width: '100%', padding: '14px', background: placing ? '#ccc' : RED, border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, cursor: placing ? 'not-allowed' : 'pointer', letterSpacing: '1px' }}>
                        {placing ? 'Processing...' : 'Proceed to Pay'}
                      </button>
                    </div>
                  )}

                  {/* UPI */}
                  {payTab === 'upi' && (
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: DARK }}>Pay by any UPI app</h3>
                      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>Scan the QR using any UPI app on your mobile phone like PhonePe, Paytm, GooglePay, BHIM, etc</p>

                      {/* UPI app icons */}
                      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                        {[
                          { letter: 'P', color: '#5f259f', name: 'PhonePe' },
                          { letter: 'G', color: '#4285f4', name: 'GPay' },
                          { letter: 'Pt', color: '#002970', name: 'Paytm' },
                          { letter: 'B', color: '#004c8c', name: 'BHIM' },
                          { letter: 'A', color: '#ff9900', name: 'Amazon Pay' },
                          { letter: 'C', color: '#1a1a2e', name: 'Cred' },
                          { letter: '⋯', color: '#aaa', name: 'More' },
                        ].map(u => (
                          <div key={u.name} title={u.name}
                            style={{ width: 44, height: 44, borderRadius: 10, background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: u.letter.length > 1 ? 11 : 18, fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.15s' }}>
                            {u.letter}
                          </div>
                        ))}
                      </div>

                      <button className="oc-btn"
                        style={{ padding: '12px 28px', background: RED, border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 24, letterSpacing: '1px' }}>
                        Generate QR Code
                      </button>

                      <div style={{ borderTop: '1px solid #f0ebe4', paddingTop: 20 }}>
                        <label style={{ ...lbl, marginBottom: 10, fontSize: 13 }}>Or enter UPI ID</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input style={{ ...inp(), flex: 1 }} placeholder="yourname@upi"
                            value={upiId} onChange={e => setUpiId(e.target.value)} />
                          <button className="oc-btn" disabled={placing} onClick={handlePlaceOrder}
                            style={{ padding: '13px 20px', background: placing ? '#ccc' : RED, border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, cursor: placing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                            {placing ? '...' : 'Verify & Pay'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NETBANKING */}
                  {payTab === 'netbanking' && (
                    <div>
                      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: DARK }}>Net Banking</h3>
                      <div style={{ position: 'relative', marginBottom: 12 }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><IconSearch /></span>
                        <input style={{ ...inp(), paddingLeft: 42 }} placeholder="Search banks"
                          value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
                      </div>
                      <div style={{ border: '1px solid #e2d9d0', borderRadius: 6, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
                        {filteredBanks.map((bank, i) => (
                          <div key={bank.name} className="bank-row"
                            onClick={() => setSelectedBank(bank.name)}
                            style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < filteredBanks.length - 1 ? '1px solid #f0ebe4' : 'none', cursor: 'pointer', background: selectedBank === bank.name ? 'rgba(123,31,46,0.04)' : '#fff', transition: 'background 0.15s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: bank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{bank.initial}</div>
                              <span style={{ fontSize: 14, color: DARK, fontWeight: selectedBank === bank.name ? 600 : 400 }}>{bank.name}</span>
                            </div>
                            <input type="radio" readOnly checked={selectedBank === bank.name} style={{ width: 16, height: 16 }} />
                          </div>
                        ))}
                        {filteredBanks.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No banks found</div>}
                      </div>
                      {selectedBank && (
                        <button className="oc-btn" disabled={placing} onClick={handlePlaceOrder}
                          style={{ marginTop: 16, width: '100%', padding: '14px', background: placing ? '#ccc' : RED, border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, cursor: placing ? 'not-allowed' : 'pointer', letterSpacing: '1px' }}>
                          {placing ? 'Processing...' : `Pay with ${selectedBank}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <OrderSidebar />
          </div>

          {/* Bottom bar */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2d9d0', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: RED }}>Total ({isCartCheckout ? cartQuantity : qty} Item{(isCartCheckout ? cartQuantity : qty) > 1 ? 's' : ''}) : {inr(totalPrice)}</div>
            <button onClick={() => setStep(2)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${RED}`, borderRadius: 2, color: RED, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Checkout Page</button>
          </div>
          <div style={{ height: 100 }} />
        </main>
        <div style={{ marginTop: '75px' }}></div>
        <CustomerFooter />
      </div>
    )
  }

  return null
}

const empty = { name: '', email: '', phone: '', country: 'IN', house: '', street: '', landmark: '', pincode: '', city: '', state: '', label: 'Home', instructions: '', is_default: false, map_url: '', latitude: null, longitude: null }
const countries = [['IN', 'India'], ['US', 'United States'], ['GB', 'United Kingdom'], ['AE', 'United Arab Emirates'], ['SG', 'Singapore'], ['CA', 'Canada'], ['AU', 'Australia'], ['DE', 'Germany'], ['FR', 'France'], ['JP', 'Japan'], ['NZ', 'New Zealand'], ['MY', 'Malaysia'], ['QA', 'Qatar'], ['KW', 'Kuwait'], ['SA', 'Saudi Arabia']]
const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry']

export function AddressBook({ onSelect, onUse, onEditingChange, onBack, selectedId }) {
  const uid = useId()
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [prefill, setPrefill] = useState(empty)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [view, setView] = useState('loading')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [conflict, setConflict] = useState(false)
  const [lookup, setLookup] = useState('')
  const [locating, setLocating] = useState(false)
  const [removeId, setRemoveId] = useState(null)
  const [saved, setSaved] = useState(false)
  const initialSelectedId = useRef(selectedId)
  const callbacks = useRef({ onSelect, onUse, onEditingChange })
  useEffect(() => { callbacks.current = { onSelect, onUse, onEditingChange } }, [onSelect, onUse, onEditingChange])
  useEffect(() => {
    callbacks.current.onEditingChange?.(view === 'form' || view === 'loading' || view === 'error')
    return () => callbacks.current.onEditingChange?.(false)
  }, [view])

  const choose = item => {
    setSelected(item)
    callbacks.current.onSelect?.(checkoutAddress(item))
  }
  const load = async (preferredId = selectedId) => {
    setMessage(''); setConflict(false)
    try {
      const data = await loadAddressBook()
      const list = data.items || []
      setItems(list)
      setPrefill({ ...empty, ...data.prefill })
      const active = list.find(item => item.id === preferredId) || list.find(item => item.is_default) || list[0] || null
      choose(active)
      if (active) setView('selected')
      else { setForm({ ...empty, ...data.prefill, is_default: true }); setEditingId(null); setView('form') }
    } catch { setMessage('Your saved addresses couldn’t load. Please try again.'); setView('error') }
  }
  useEffect(() => {
    let active = true
    loadAddressBook().then(data => {
      if (!active) return
      const list = data.items || []
      setItems(list)
      setPrefill({ ...empty, ...data.prefill })
      const item = list.find(a => a.id === initialSelectedId.current) || list.find(a => a.is_default) || list[0] || null
      setSelected(item)
      callbacks.current.onSelect?.(checkoutAddress(item))
      if (item) setView('selected')
      else { setForm({ ...empty, ...data.prefill, is_default: true }); setView('form') }
    }).catch(() => { if (active) { setMessage('Your saved addresses couldn’t load. Please try again.'); setView('error') } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (view !== 'form' || form.country !== 'IN' || !/^\d{6}$/.test(form.pincode) || (form.city && form.state)) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLookup('Finding your city and state…')
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`, { signal: controller.signal })
        const data = await response.json()
        if (controller.signal.aborted) return
        const place = data?.[0]?.PostOffice?.[0]
        if (place && data[0].Status === 'Success') {
          setForm(previous => ({ ...previous, city: previous.city || place.District, state: previous.state || place.State }))
          setLookup('City and state filled. You can change them if needed.')
        } else setLookup('Please enter your city and state below.')
      } catch { if (!controller.signal.aborted) setLookup('Please enter your city and state below.') }
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [form.pincode, form.country, view, form.city, form.state])

  const edit = item => {
    setForm(item ? { ...empty, ...item } : { ...empty, ...prefill, is_default: items.length === 0 })
    setEditingId(item?.id || null)
    setErrors({}); setMessage(''); setLookup(''); setSaved(false); setView('form')
  }
  const cancel = () => {
    setErrors({}); setMessage('')
    if (selected) setView('selected')
    else { if (onBack) onBack(); else callbacks.current.onUse?.(null); setView('list') }
  }
  const handleConflict = error => {
    if (error.response?.status !== 409) return false
    setConflict(true)
    setMessage('This address changed in another tab or device. Reload the latest addresses to continue.')
    return true
  }
  const submit = async event => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setErrors({}); setMessage('')
    const { id: _id, created_at: _created, updated_at: _updated, ...payload } = form
    try {
      const response = editingId
        ? await api.patch(`/delivery-addresses/${editingId}/`, { ...payload, expected_updated_at: form.updated_at })
        : await api.post('/delivery-addresses/', payload)
      setItems(previous => [response.data, ...previous.filter(item => item.id !== response.data.id).map(item => response.data.is_default ? { ...item, is_default: false } : item)])
      choose(response.data)
      setSaved(true); setView('selected')
      callbacks.current.onUse?.(checkoutAddress(response.data))
    } catch (error) {
      if (handleConflict(error)) return
      const details = error.response?.data
      if (details && typeof details === 'object') {
        setErrors(details)
        const firstField = Object.keys(details)[0]
        requestAnimationFrame(() => document.getElementById(`${uid}-${firstField}`)?.focus())
      }
      setMessage('Address wasn’t saved. Please check the details and try again.')
    } finally { setSaving(false) }
  }
  const setDefault = async item => {
    if (saving) return
    setSaving(true); setMessage('')
    try {
      const response = await api.patch(`/delivery-addresses/${item.id}/`, { is_default: true, expected_updated_at: item.updated_at })
      setItems(previous => previous.map(address => address.id === item.id ? response.data : { ...address, is_default: false }))
      choose(response.data)
      setView('selected')
    }
    catch (error) { if (handleConflict(error)) return; setMessage('Couldn’t change your default address. Please try again.') }
    finally { setSaving(false) }
  }
  const remove = async id => {
    if (saving) return
    setSaving(true); setMessage('')
    try { await api.delete(`/delivery-addresses/${id}/`, { data: { expected_updated_at: items.find(item => item.id === id)?.updated_at } }); setRemoveId(null); await load() }
    catch (error) { if (handleConflict(error)) return; setMessage('Couldn’t remove this address. Please try again.') }
    finally { setSaving(false) }
  }
  const captureLocation = () => {
    if (!navigator.geolocation) { setMessage('Location is unavailable here. You can paste a Google Maps share link instead.'); return }
    setLocating(true); setMessage('')
    navigator.geolocation.getCurrentPosition(position => {
      const latitude = position.coords.latitude.toFixed(6), longitude = position.coords.longitude.toFixed(6)
      setForm(previous => ({ ...previous, latitude, longitude, map_url: mapsSearchUrl({ latitude, longitude }) }))
      setLocating(false)
    }, () => { setLocating(false); setMessage('Couldn’t get your location. Open Google Maps or paste its share link instead.') }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 })
  }
  const field = (name, label, options = {}) => (
    <div className={`sa-field ${options.wide ? 'sa-wide' : ''}`}>
      <label htmlFor={`${uid}-${name}`}>{label}{options.required && <span aria-hidden="true"> *</span>}</label>
      <input id={`${uid}-${name}`} name={name} required={options.required} autoComplete={options.autoComplete} type={options.type || 'text'} inputMode={options.inputMode} maxLength={options.maxLength || 200} value={form[name] || ''} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${uid}-${name}-error` : undefined}
        placeholder={options.placeholder} onChange={event => {
          const value = event.target.value
          setForm(previous => ({ ...previous, [name]: value, ...(name === 'pincode' ? { city: '', state: '' } : {}) }))
        }} />
      {errors[name] && <span className="sa-field-error" id={`${uid}-${name}-error`}>{String(errors[name])}</span>}
    </div>
  )

  if (view === 'loading') return <div className="sa-loading" role="status"><span /> Loading your saved addresses…</div>
  if (view === 'error') return <div className="sa-feedback" role="alert">{message}<button type="button" onClick={() => { setView('loading'); load() }}>Try again</button></div>
  return (
    <section className="sa-book" aria-label="Delivery address book">
      {message && <div className="sa-feedback" role="alert">{message}{conflict && <button type="button" disabled={saving} onClick={() => load()}>Reload latest addresses</button>}</div>}
      {view === 'form' ? (
        <form onSubmit={submit} className="sa-form">
          <header className="sa-form-head">
            <button type="button" className="sa-icon-button" aria-label={selected ? 'Back to saved addresses' : 'Back'} onClick={cancel} disabled={saving}><ArrowLeft size={19} /></button>
            <div><span>Saved to your account</span><h3>{editingId ? 'Edit your delivery address' : 'Where should we deliver?'}</h3></div>
            <button type="button" className="sa-text-button" onClick={cancel} disabled={saving}>Cancel</button>
          </header>
          <div className="sa-form-body">
            <div className="sa-field"><label htmlFor={`${uid}-country`}>Country / Region</label><select id={`${uid}-country`} value={form.country} autoComplete="country" onChange={event => setForm(previous => ({ ...previous, country: event.target.value, state: '', latitude: null, longitude: null, map_url: '' }))}>{countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></div>
            <div className="sa-grid">
              {field('name', 'Full name (First and Last name)', { required: true, autoComplete: 'name' })}
              {field('phone', 'Mobile number', { required: true, type: 'tel', autoComplete: 'tel-national', maxLength: form.country === 'IN' ? 10 : 20, placeholder: form.country === 'IN' ? '10-digit mobile number' : 'Mobile number' })}
            </div>
            <p className="sa-helper">Your mobile number may be used to assist delivery.</p>
            <details className="sa-map" open={!!form.map_url}>
              <summary><MapPin size={19} /><span>Add location on map</span><ChevronRight size={16} /></summary>
              <p>Open Google Maps, choose a pin and copy its Share link. Paste the link below to save your location.</p>
              <div className="sa-map-actions"><a href={mapsSearchUrl(form)} target="_blank" rel="noopener noreferrer"><MapPin size={15} /> Open Google Maps</a><button type="button" onClick={captureLocation} disabled={locating}><Crosshair size={15} />{locating ? 'Finding location…' : 'Use current location'}</button></div>
              <label htmlFor={`${uid}-map_url`}>Google Maps share link (optional)</label>
              <input id={`${uid}-map_url`} type="url" value={form.map_url} placeholder="https://maps.app.goo.gl/…" onChange={event => { const map_url = event.target.value; setForm(previous => ({ ...previous, map_url, ...mapsCoordinates(map_url) })) }} />
              {errors.map_url && <p className="sa-field-error">{String(errors.map_url)}</p>}
              {form.map_url && <span className="sa-location-saved"><Check size={14} /> Location ready to save with this address</span>}
            </details>
            {field('house', 'Flat, House no., Building, Company, Apartment', { required: true, autoComplete: 'address-line1' })}
            {field('street', 'Area, Street, Sector, Village', { required: true, autoComplete: 'address-line2', maxLength: 250 })}
            {field('landmark', 'Landmark (optional)', { placeholder: 'E.g. near the school or temple' })}
            <div className="sa-grid">
              {field('pincode', form.country === 'IN' ? 'Pincode' : 'Postal code', { required: true, autoComplete: 'postal-code', inputMode: form.country === 'IN' ? 'numeric' : 'text', maxLength: form.country === 'IN' ? 6 : 12 })}
              {field('city', 'Town / City', { required: true, autoComplete: 'address-level2', maxLength: 100 })}
            </div>
            {lookup && <p className="sa-helper" role="status">{lookup}</p>}
            {form.country === 'IN' ? <div className="sa-field"><label htmlFor={`${uid}-state`}>State *</label><select id={`${uid}-state`} required value={form.state} autoComplete="address-level1" onChange={event => setForm(previous => ({ ...previous, state: event.target.value }))}><option value="">Select your state</option>{[...new Set([...(form.state ? [form.state] : []), ...states])].map(state => <option key={state} value={state}>{state}</option>)}</select>{errors.state && <span className="sa-field-error">{String(errors.state)}</span>}</div> : field('state', 'State / Region', { required: true, autoComplete: 'address-level1', maxLength: 100 })}
            <div className="sa-field"><label htmlFor={`${uid}-label`}>Save address as</label><div className="sa-labels">{['Home', 'Work', 'Other'].map(label => <button key={label} type="button" aria-pressed={form.label === label} onClick={() => setForm(previous => ({ ...previous, label }))}>{label === 'Home' && <Home size={14} />}{label}</button>)}</div>{!['Home', 'Work'].includes(form.label) && <input id={`${uid}-label`} aria-label="Address label" maxLength={50} value={form.label} onChange={event => setForm(previous => ({ ...previous, label: event.target.value }))} />}</div>
            <label className="sa-default"><input type="checkbox" checked={form.is_default} onChange={event => setForm(previous => ({ ...previous, is_default: event.target.checked }))} /><span>Make this my default address<small>Automatically selected at your next checkout.</small></span></label>
            <details className="sa-instructions"><summary><span><strong>Delivery instructions (optional)</strong><small>Notes, preferences and more</small></span><ChevronRight size={18} /></summary><label htmlFor={`${uid}-instructions`}>Anything that will help the delivery partner?</label><textarea id={`${uid}-instructions`} maxLength={1000} rows={3} value={form.instructions} placeholder="E.g. call on arrival, gate number, directions" onChange={event => setForm(previous => ({ ...previous, instructions: event.target.value }))} /></details>
          </div>
          <footer className="sa-form-footer"><button type="button" className="sa-secondary" disabled={saving} onClick={cancel}><ArrowLeft size={15} /> Back</button><button className="sa-primary" type="submit" disabled={saving}>{saving ? 'Saving your address…' : 'Save & use this address'}<Check size={17} /></button></footer>
        </form>
      ) : (
        <>
          <header className="sa-list-head"><div><span>Your address book</span><h3>{view === 'list' ? 'Choose a delivery address' : 'Ready for your delivery'}</h3></div><button type="button" className="sa-secondary" onClick={() => edit(null)}><Plus size={16} /> Add new</button></header>
          {saved && <p className="sa-saved" role="status"><Check size={15} /> Address saved to your account.</p>}
          {(view === 'list' ? items : selected ? [selected] : []).map(item => <article className={`sa-address ${item.id === selected?.id ? 'is-selected' : ''}`} key={item.id}>
            <div className="sa-address-icon"><Home size={20} /></div><div className="sa-address-copy"><div className="sa-address-name"><strong>{item.name}</strong><span>{item.label}</span>{item.is_default && <span className="sa-default-tag">Default</span>}</div><p>{checkoutAddress(item).formatted}</p><p className="sa-phone">{item.phone}</p>{item.instructions && <p className="sa-address-note">Delivery note: {item.instructions}</p>}{item.map_url && <a href={item.map_url} target="_blank" rel="noopener noreferrer" className="sa-map-link"><MapPin size={13} /> View saved location</a>}
              <div className="sa-address-actions"><button type="button" onClick={() => edit(item)} disabled={saving}><Pencil size={14} /> Edit</button>{!item.is_default && <button type="button" onClick={() => setDefault(item)} disabled={saving}>Make default</button>}<button type="button" onClick={() => setRemoveId(item.id)} disabled={saving}><Trash2 size={14} /> Remove</button></div>
              {removeId === item.id && <div className="sa-remove-confirm"><span>Remove this saved address?</span><button type="button" onClick={() => remove(item.id)} disabled={saving}>Remove</button><button type="button" onClick={() => setRemoveId(null)}>Keep it</button></div>}
            </div>
            {view === 'list' ? <button type="button" className="sa-secondary" onClick={() => { choose(item); setView('selected'); callbacks.current.onUse?.(checkoutAddress(item)) }}>Use address</button> : <span className="sa-selected"><Check size={14} /> Selected</span>}
          </article>)}
          {items.length > 1 && <button type="button" className="sa-change" onClick={() => setView(view === 'list' ? 'selected' : 'list')}>{view === 'list' ? 'Back to selected address' : `Change address (${items.length} saved)`}<ChevronRight size={16} /></button>}
          {!items.length && <button type="button" className="sa-primary" onClick={() => edit(null)}><Plus size={16} /> Add your first address</button>}
        </>
      )}
    </section>
  )
}

