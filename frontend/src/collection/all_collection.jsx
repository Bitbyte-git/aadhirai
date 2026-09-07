import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import api from '../api'
import CustomerFooter from './CustomerFooter'
import { getSubcategories, getGiftingSubcategories } from '../config/categoryConfig'

  const API_ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')

  const categoryTiles = [
    { label: 'Necklaces', category: 'necklaces', count: '478+', image: '/diamond_necklas.jpg' },
    { label: 'Earrings', category: 'earrings', count: '965+', image: '/diamond Earings.jpg' },
    { label: 'Rings', category: 'rings', count: '678+', image: '/diamond_ring.jpg' },
    { label: 'Bracelets', category: 'bracelets', count: '412+', image: '/wedding_bracelet.jpg' },
    { label: 'Pendants', category: 'pendants', count: '329+', image: '/platinum_necklas.jpg' },
    { label: 'Chains', category: 'chains', count: '286+', image: '/wedding_chain.jpg' },
    { label: 'Mangalsutra', category: 'mangalsutra', count: '193+', image: '/black_necklaces.png' },
    { label: 'Bangles', category: 'bangles', count: '551+', image: '/wedding_bangesh.jpg' },
    { label: 'Necklace Set', category: 'necklaces', count: '241+', image: '/wedding_necklaces.jpg' },
    { label: 'Nose Pin', category: 'nosepin', count: '156+', image: '/diamond Earings.jpg' },
  ]

  const goldRail = [
    { label: 'Necklaces', category: 'necklaces', image: '/gold-women.png' },
    { label: 'Earrings', category: 'earrings', image: '/diamond Earings.jpg' },
    { label: 'Rings', category: 'rings', image: '/diamond_ring.jpg' },
    { label: 'Bangles', category: 'bangles', image: '/wedding_bangesh.jpg' },
    { label: 'Chains', category: 'chains', image: '/wedding_chain.jpg' },
    { label: 'Pendants', category: 'pendants', image: '/wedding_necklaces.jpg' },
    { label: 'Mangalsutra', category: 'mangalsutra', image: '/black_necklaces.png' },
    { label: 'Gold Coins', route: '/collection/coins?metal=gold', image: '/gold-coin.jpg.jpeg' },
  ]

  const filterCategories = [
    ['All Jewellery', '/collection/all', null],
    ['Necklaces', '/collection/all?category=necklaces', 'necklaces'],
    ['Earrings', '/collection/all?category=earrings', 'earrings'],
    ['Rings', '/collection/all?category=rings', 'rings'],
    ['Bracelets', '/collection/all?category=bracelets', 'bracelets'],
    ['Pendants', '/collection/all?category=pendants', 'pendants'],
    ['Chains', '/collection/all?category=chains', 'chains'],
    ['Mangalsutra', '/collection/all?category=mangalsutra', 'mangalsutra'],
    ['Bangles', '/collection/all?category=bangles', 'bangles'],
    ['Necklace Set', '/collection/all?category=necklaces', 'necklaces'],
    ['Nose Pin', '/collection/all?category=nosepin', null],
    ['Anklets', '/collection/all?category=anklets', 'anklets'],
    ['Coin & Bars', '/collection/coins', null],
  ]

  const goldFilterCategories = [
    ['All Gold Jewellery', '/collection/all?metal=gold', null],
    ['Gold Coins', '/collection/coins?metal=gold', null],
    ['Gold Rings', '/collection/all?metal=gold&category=rings', 'rings'],
    ['Gold Earrings', '/collection/all?metal=gold&category=earrings', 'earrings'],
    ['Gold Bangles', '/collection/all?metal=gold&category=bangles', 'bangles'],
    ['Gold Pendants', '/collection/all?metal=gold&category=pendants', 'pendants'],
    ['Gold Chains', '/collection/all?metal=gold&category=chains', 'chains'],
    ['Gold Necklaces', '/collection/all?metal=gold&category=necklaces', 'necklaces'],
    ['Gold Mangalsutra', '/collection/all?metal=gold&category=mangalsutra', 'mangalsutra'],
    ['Gold Nose Pin', '/collection/all?metal=gold&category=nosepin', 'nosepin'],
    ['Gold Anklets', '/collection/all?metal=gold&category=anklets', 'anklets'],
    ['Gold Coins & Bars', '/collection/coins?metal=gold', null],
  ]

const silverFilterCategories = [
  ['All Silver Jewellery', '/collection/all?metal=silver', null],
  ['Silver Coins', '/collection/coins?metal=silver', null],
  ['Silver Rings', '/collection/all?metal=silver&category=rings', 'rings'],
  ['Silver Earrings', '/collection/all?metal=silver&category=earrings', 'earrings'],
  ['Silver Bangles', '/collection/all?metal=silver&category=bangles', 'bangles'],
  ['Silver Bracelets', '/collection/all?metal=silver&category=bracelets', 'bracelets'],
  ['Silver Pendants', '/collection/all?metal=silver&category=pendants', 'pendants'],
  ['Silver Chains', '/collection/all?metal=silver&category=chains', 'chains'],
  ['Silver Necklaces', '/collection/all?metal=silver&category=necklaces', 'necklaces'],
  ['Silver Anklets', '/collection/all?metal=silver&category=anklets', 'anklets'],
  ['Silver Articles', '/collection/all?metal=silver', null],
]

const weddingFilterCategories = [
  ['All Wedding Jewellery', '/collection/all?wedding=true', null],
  ['Mangalsutra', '/collection/all?wedding=true&category=mangalsutra', 'mangalsutra'],
  ['Bridal Rings', '/collection/all?wedding=true&category=rings', 'rings'],
  ['Bridal Earrings', '/collection/all?wedding=true&category=earrings', 'earrings'],
  ['Bridal Necklaces', '/collection/all?wedding=true&category=necklaces', 'necklaces'],
  ['Bridal Bangles', '/collection/all?wedding=true&category=bangles', 'bangles'],
]

// ── Gifting page ku thani array — gift_tag param vachi Gifting subcategory
// list edukkanum (categoryConfig.js-oda GIFTING_SUBCATEGORIES) ──
const giftingFilterCategories = [
  ['All Gifting', '/collection/gifting', null],
  ['Gifts For Her', '/collection/gifting?gift_tag=Her', 'Her'],
  ['Gifts For Him', '/collection/gifting?gift_tag=Him', 'Him'],
  ['Gifts For Kids', '/collection/gifting?gift_tag=Kids', 'Kids'],
  ['Gifts For Couple', '/collection/gifting?gift_tag=Couple', 'Couple'],
  ['Gifts For Parents', '/collection/gifting?gift_tag=Parents', 'Parents'],
  ['Occasion Gifts', '/collection/gifting?gift_tag=Occasion', 'Occasion'],
  ['Corporate Gifts', '/collection/gifting?gift_tag=Corporate', 'Corporate'],
  ['Religious Gifts', '/collection/gifting?gift_tag=Religious', 'Religious'],
]
  const promos = [
    { title: 'Daily Wear', text: 'Elegant designs for everyday beauty.', route: '/collection/all?dailywear=true', image: '/dailywera.png' },
    { title: 'Wedding Collection', text: 'Make your big day even more special.', route: '/collection/all?wedding=true', image: '/wedding_necklaces.jpg' },
    // { title: 'Diamond Collection', text: 'Brilliance that lasts forever.', route: '/collection/all?metal=diamond', image: '/diamond_ring.jpg' },  // hidden — future use ku vachurukom
    { title: 'Silver Collection', text: 'Pure. Elegant. Timeless.', route: '/collection/all?metal=silver', image: '/silver-coin.jpg.jpeg' },
  ]

  const trustItems = [
    ['100% BIS Hallmarked', 'hallmark'],
    ['Lifetime Exchange', 'exchange'],
    ['Secure Payments', 'lock'],
    ['Free Shipping Above Rs.4,999', 'truck'],
  ]

  const PRICE_OPTIONS = [
    ['All', ''],
    ['0 - 2,000', '0-2000'],
    ['2,000 - 10,000', '2000-10000'],
    ['10,000 - 50,000', '10000-50000'],
    ['50,000 - 1,00,000', '50000-100000'],
    ['1,00,000 Above', '100000-above'],
  ]

  const GENDER_OPTIONS = [
    ['All', ''],
    ['Male', 'men'],
    ['Female', 'women'],
    ['Kids', 'kids'],
  ]

  const OCCASION_OPTIONS = [
    ['All', ''],
    ['Daily Wear', 'Daily Wear'],
    ['Casual Wear', 'Casual Wear'],
    ['Modern Wear', 'Modern Wear'],
    ['Traditional Wear', 'Traditional Wear'],
  ]


  const metalCopy = {
    gold: {
      title: 'Gold Jewellery',
      crumb: 'Gold',
      accent: '#a36b18',
      bannerTitle: 'Shine in Every Moment',
      bannerText: 'Explore our exclusive gold collections designed to celebrate you.',
      bannerImage: '/wedding_necklaces.jpg',
      sideImage: '/gold_Woman.jpg',
      sideTitle: 'Heritage. Purity. Timeless Gold.',
    },
    diamond: {
      title: 'Diamond Jewellery',
      crumb: 'Diamond',
      accent: '#65758a',
      bannerTitle: 'Brilliance for Every Occasion',
      bannerText: 'Discover rings, earrings and necklaces with lasting sparkle.',
      bannerImage: '/diamond_woman.jpg',
      sideImage: '/diamond-women.png',
      sideTitle: 'Brilliance Crafted. Forever Loved.',
    },
    silver: {
      title: 'Silver Jewellery',
      crumb: 'Silver',
      accent: '#6b7280',
      bannerTitle: 'Pure. Elegant. Everyday.',
      bannerText: 'Explore silver jewellery and coins with trusted purity.',
      bannerImage: '/silver-coin.jpg.jpeg',
      sideImage: '/dailywear_woman.jpg',
      sideTitle: 'Silver Grace. Everyday Shine.',
    },
    platinum: {
      title: 'Platinum Jewellery',
      crumb: 'Platinum',
      accent: '#788392',
      bannerTitle: 'Minimal Luxury in Platinum',
      bannerText: 'Premium designs for moments that deserve quiet elegance.',
      bannerImage: '/platinum_ring.jpg',
      sideImage: '/platinum_necklas.jpg',
      sideTitle: 'Modern. Rare. Refined.',
    },
  }

  function useFixedSidebar() {
    const wrapRef = useRef(null)
    const asideRef = useRef(null)
    const [style, setStyle] = useState({})

    useEffect(() => {
      const update = () => {
        if (!wrapRef.current || !asideRef.current) return
        if (window.innerWidth <= 820) {
          setStyle({})
          return
        }

        const wrapRect = wrapRef.current.getBoundingClientRect()
        const asideHeight = asideRef.current.offsetHeight
        const topOffset = 192

        // wrap-div bottom edge (content column mudinja idam) varaikkum eppadi
        // space irukku nu check pannuvom
        const spaceBelow = wrapRect.bottom - topOffset

        if (spaceBelow < asideHeight) {
          // content mudinjididuchu (footer vara pogudhu) — sidebar-a
          // wrap-div oda kadaisi bottom-la stop pannidalam, footer mela varaadhu
          setStyle({
            position: 'absolute',
            left: 0,
            width: '100%',
            bottom: 0,
            top: 'auto',
          })
        } else {
          setStyle({
            position: 'fixed',
            top: topOffset,
            left: wrapRect.left,
            width: wrapRect.width,
          })
        }
      }
      update()
      window.addEventListener('resize', update)
      window.addEventListener('scroll', update)

      // const ro = new ResizeObserver(() => update())
      // if (wrapRef.current?.parentElement) {
      //   ro.observe(wrapRef.current.parentElement)
      // }

            const ro = new ResizeObserver(() => update())
      if (wrapRef.current?.parentElement) {
        ro.observe(wrapRef.current.parentElement)
      }

      if (asideRef.current) {
        ro.observe(asideRef.current)
      }

      return () => {
        window.removeEventListener('resize', update)
        window.removeEventListener('scroll', update)
        ro.disconnect()
      }
    }, [])

    return { wrapRef, asideRef, style }
  }

  function Icon({ type, size = 22 }) {
    const common = {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.7,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
    }

    if (type === 'truck') return <svg {...common}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="8" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
    if (type === 'lock') return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v3" /></svg>
    if (type === 'exchange') return <svg {...common}><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M18.5 10A7 7 0 0 0 6.2 7.8" /><path d="M5.5 14A7 7 0 0 0 17.8 16.2" /></svg>
    if (type === 'grid') return <svg {...common}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
    if (type === 'list') return <svg {...common}><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
    if (type === 'arrow') return <svg {...common}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
    return <svg {...common}><path d="M12 3 20 7v5c0 4.8-3.2 7.8-8 9-4.8-1.2-8-4.2-8-9V7l8-4Z" /><path d="M12 8v7" /><path d="M9.5 12h5" /></svg>
  }

  function getImageUrl(img) {
    if (!img) return null
    const path = typeof img === 'object' ? (img.image || img.url || '') : img
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${API_ORIGIN}/${path.replace(/^\/+/, '')}`
  }

  function money(value) {
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0) return 'Rs. 0'
    return `Rs. ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }

  function productPrice(product, rates) {
    const metal = product.metal?.toLowerCase()
    const grade = product.grade?.toLowerCase()
    const rate = metal === 'gold'
      ? grade === '24k' ? rates.gold_24k : rates.gold_22k
      : metal === 'silver'
        ? rates.silver_999
        : metal === 'diamond'
          ? grade === '18k' ? rates.diamond_18k : rates.diamond_22k
          : metal === 'platinum'
            ? rates.platinum_92
            : 0

    const weight = Number(product.net_weight) || 0
    const making = Number(product.making_charge) || 0
    const discount = Number(product.wastage_charge) || 0
    const stone = Number(product.stone_value) || 0

    if (!rate || !weight) return Number(product.price) || 0
    const rateWithMaking = rate + (rate * making / 100)
    return Math.round(((weight * (rateWithMaking - (rateWithMaking * discount / 100))) + stone) * 1.03)
  }

function normalizeProductList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.products)) return data.products
  return []
}

// ── Subcategory-sections cache — sessionStorage, 2 min TTL. Same
// category+metal thirumbi vandha (back button, tab switch), API call
// illama cache-la irundhe fill aagum ──
const SUBSEC_CACHE_TTL = 2 * 60 * 1000

function readSubsecCache(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > SUBSEC_CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function writeSubsecCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

  function CategoryTile({ item, navigate }) {
    const route = item.route || `/collection/all?category=${item.category}`
    return (
      <button className="an-category-card" type="button" onClick={() => navigate(route)}>
        <img src={item.image} alt={item.label} />
        <div>
          <strong>{item.label}</strong>
          <span>{item.count || 'Explore'} Designs</span>
        </div>
        <span className="an-round-arrow"><Icon type="arrow" size={16} /></span>
      </button>
    )
  }

  function ProductCard({ product, rates, navigate, wishlisted, onWishlist }) {
  const image = getImageUrl(product.images?.[0]) || '/logo.png'
  const price = productPrice(product, rates)
  const reviews = 71 + ((product.id || 1) * 11) % 58
  const goProduct = () => navigate(`/product-display?category=${product.category}&metal=${product.metal}&id=${product.id}`)

    const addCart = async event => {
      event.stopPropagation()
      if (!localStorage.getItem('token')) {
        navigate('/login')
        return
      }
      try {
        await api.post('/cart/', { product: product.id, qty: 1 })
        window.dispatchEvent(new Event('bb_cart_update'))
      } catch {}
    }

    return (
      <article className="an-product-card" onClick={goProduct}>
        <div className="an-product-image">
          <img src={image} alt={product.name} />
        <button
          className={`an-heart ${wishlisted ? 'active' : ''}`}
          type="button"
          onClick={event => {
            event.stopPropagation()
            onWishlist(product.id)
          }}
          aria-label="Wishlist"
        >
          {wishlisted ? '\u2665' : '\u2661'}
        </button>
        </div>
        <div className="an-product-body">
          <h3>{product.name}</h3>
          <p>{(product.grade || product.metal || 'Jewellery').toUpperCase()} {product.metal || 'Jewellery'} · {Number(product.net_weight || 0).toFixed(2)} g</p>
          <strong>{money(price)}</strong>
          <div className="an-rating">
            <span>★★★★★</span>
            <small>({reviews})</small>
            <button type="button" onClick={addCart} aria-label="Add to cart"><Icon type="lock" size={15} /></button>
          </div>
        </div>
      </article>
    )
  }

function SkeletonGrid({ count = 4 }) {
  return (
    <section className="an-products">
      {Array.from({ length: count }).map((_, i) => (
        <div className="an-skeleton-card" key={i}>
          <div className="an-skeleton-img" />
          <div className="an-skeleton-line" style={{ width: '70%' }} />
          <div className="an-skeleton-line" style={{ width: '45%' }} />
          <div className="an-skeleton-line" style={{ width: '55%' }} />
        </div>
      ))}
    </section>
  )
}

function FilterPanel({ activeRoute, navigate, metalFilter, categoryFilter, subcategoryFilter, activeScrollSub, isWedding, isGifting, giftTagFilter, giftTypeFilter }) {
  const { wrapRef, asideRef, style } = useFixedSidebar()
  const categories = isGifting
    ? giftingFilterCategories
    : isWedding
      ? weddingFilterCategories
      : metalFilter === 'gold'
        ? goldFilterCategories
        : metalFilter === 'silver'
          ? silverFilterCategories
          : filterCategories
  const activeKey = isGifting ? giftTagFilter : categoryFilter
  const [expandedKey, setExpandedKey] = useState(activeKey || null)

  useEffect(() => {
    setExpandedKey(activeKey || null)
  }, [activeKey])

  const subcategoryMetal = isWedding ? 'wedding' : (metalFilter || 'gold')
  const subButtonRefs = useRef({})

  // right side-la eந்த subcategory active-a maarudhோ, adhoda left side
  // button-a smooth-a visible idathukku scroll pannும்
  useEffect(() => {
    if (!activeScrollSub) return
    const el = subButtonRefs.current[activeScrollSub]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeScrollSub])

  const buildSubcategoryRoute = (baseRoute, subLabel) => {
    const sep = baseRoute.includes('?') ? '&' : '?'
    const param = isGifting ? 'gift_type' : 'subcategory'
    return `${baseRoute}${sep}${param}=${encodeURIComponent(subLabel)}`
  }

  const activeSubFilter = isGifting ? giftTypeFilter : subcategoryFilter

  return (
    <div ref={wrapRef} className="an-filter-wrap">
      <aside ref={asideRef} className="an-filter" style={style}>
        <h2>{(metalFilter === 'gold' || isWedding || isGifting) ? 'FILTERS' : 'Shop By'}</h2>
        <div className="an-filter-section">
          <div className="an-filter-title">Category <span>{metalFilter === 'gold' ? '^' : '-'}</span></div>
          {categories.map(([label, route, key]) => {
            const subOptions = key
              ? (isGifting ? getGiftingSubcategories(key) : getSubcategories(key, subcategoryMetal))
              : []
            const isOpen = key && expandedKey === key
            return (
              <div key={label}>
                <button
                  className={activeRoute === route && !subcategoryFilter && !giftTagFilter ? 'active' : ''}
                  type="button"
                  onClick={() => {
                    if (key && subOptions.length) {
                      setExpandedKey(isOpen ? null : key)
                    }
                    navigate(route)
                  }}
                >
                  {label}
                  {subOptions.length > 0 && (
                    <span style={{ float: 'right' }}>{isOpen ? '−' : '+'}</span>
                  )}
                </button>
                              {isOpen && subOptions.length > 0 && (
                <div className="an-filter-subgroup">
                  {subOptions.map(sub => (
                    <button
                      key={sub}
                      ref={el => (subButtonRefs.current[sub] = el)}
                      type="button"
                      className={(activeScrollSub || activeSubFilter) === sub ? 'active' : ''}
                      onClick={() => navigate(buildSubcategoryRoute(route, sub))}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
              </div>
            )
          })}
        </div>
        <button className="an-clear" type="button" onClick={() => navigate('/collection/all')}>Clear All Filters</button>
      </aside>
    </div>
  )
}

  function QuickFilterDropdown({ label, options, currentValue, onSelect }) {
    const [open, setOpen] = useState(false)
    const closeTimer = useRef(null)

    const openNow = () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
      setOpen(true)
    }

    const closeSoon = () => {
      closeTimer.current = setTimeout(() => setOpen(false), 250)
    }

    return (
      <div
        className="an-qf-dropdown"
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
      >
        <span className="an-qf-label">{label}</span>
        <button type="button" className={`an-qf-toggle ${currentValue ? 'active' : ''}`}>
          <span className="an-qf-value">
            {options.find(([, val]) => val === (currentValue || ''))?.[0] || 'All'}
          </span>
          <span className={`an-qf-caret ${open ? 'open' : ''}`}>▾</span>
        </button>
        <div className={`an-qf-panel ${open ? 'open' : ''}`}>
          {options.map(([optLabel, optValue]) => (
            <button
              key={optLabel}
              type="button"
              className={optValue === (currentValue || '') ? 'active' : ''}
              onClick={() => {
                onSelect(optValue)
                setOpen(false)
              }}
            >
              {optLabel}
            </button>
          ))}
        </div>
      </div>
    )
  }

  function RightRail({ copy }) {
    return (
      <aside className="an-right-rail">
        <div className="an-trust-box">
          {trustItems.map(([label, icon]) => (
            <div className="an-trust-item" key={label}>
              <Icon type={icon} size={29} />
              <strong>{label}</strong>
            </div>
          ))}
        </div>
        <div className="an-side-promo">
          <img src={copy.sideImage} alt="" />
          <div>
            <h3>{copy.sideTitle}</h3>
            <button type="button">Explore Now</button>
          </div>
        </div>
      </aside>
    )
  }

export default function AllCollection() {
  const navigate = useNavigate()
  const location = useLocation()
  const isGifting = location.pathname.startsWith('/collection/gifting')
  const [searchParams] = useSearchParams()
  const metalFilter = searchParams.get('metal')
      const categoryFilter = searchParams.get('category')
    const subcategoryFilter = searchParams.get('subcategory')
    const genderFilter = searchParams.get('gender')
    const occasionFilter = searchParams.get('occasion')
    const giftTagFilter = searchParams.get('gift_tag')
    const giftTypeFilter = searchParams.get('gift_type')
    const priceFilter = searchParams.get('price')
    const searchFilter = searchParams.get('search')
    const isWedding = searchParams.get('wedding') === 'true'
    const isDailywear = searchParams.get('dailywear') === 'true'
    const [products, setProducts] = useState([])
    const [rates, setRates] = useState({})
    const [sortBy, setSortBy] = useState('popular')
    const [loading, setLoading] = useState(true)
    const [subcategorySections, setSubcategorySections] = useState([])
    const [sectionsLoading, setSectionsLoading] = useState(false)
  const [activeScrollSub, setActiveScrollSub] = useState(null)
  const [wishlistedIds, setWishlistedIds] = useState(new Set())
  const sectionRefs = useRef({})

  useEffect(() => {
    if (!localStorage.getItem('token')) return
    api.get('/wishlist/')
      .then(res => {
        const ids = (res.data?.items || []).map(item => item.product?.id ?? item.product_id ?? item.id)
        setWishlistedIds(new Set(ids.filter(Boolean)))
      })
      .catch(() => {})
  }, [])

  const toggleWishlist = async (productId) => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    try {
      const res = await api.post('/wishlist/', { product_id: productId })
      setWishlistedIds(prev => {
        const next = new Set(prev)
        if (res.data?.action === 'removed') next.delete(productId)
        else next.add(productId)
        return next
      })
      window.dispatchEvent(new Event('bb_wishlist_update'))
    } catch {}
  }

    useEffect(() => {
      if (metalFilter === 'diamond' || metalFilter === 'platinum') {
        navigate('/collection/all', { replace: true })
      }
    }, [metalFilter, navigate])

    useEffect(() => {
      api.get('/metal-rates/')
        .then(res => {
          const data = Array.isArray(res.data) ? res.data[0] : res.data
          setRates({
            gold_22k: Number(data?.gold_22k) || 0,
            gold_24k: Number(data?.gold_24k) || 0,
            silver_999: Number(data?.silver_999) || 0,
            diamond_18k: Number(data?.diamond_18k) || 0,
            diamond_22k: Number(data?.diamond_22k) || 0,
            platinum_92: Number(data?.platinum_92) || 0,
          })
        })
        .catch(() => {})
    }, [])

    useEffect(() => {
      const loadProducts = async () => {
        setLoading(true)
        try {
          const params = new URLSearchParams()
                  if (metalFilter) params.set('metal', metalFilter)
          if (categoryFilter) params.set('category', categoryFilter)
          if (subcategoryFilter) params.set('subcategory', subcategoryFilter)
          if (genderFilter) params.set('gender', genderFilter)
          if (occasionFilter) params.set('occasion', occasionFilter)
          if (giftTagFilter) params.set('gift_tag', giftTagFilter)
          if (giftTypeFilter) params.set('gift_type', giftTypeFilter)
          if (priceFilter) params.set('price', priceFilter)
          if (searchFilter) params.set('search', searchFilter)
          if (isWedding) params.set('occasion', 'Wedding')
          if (isDailywear) params.set('occasion', 'Casual Wear')
          const res = await api.get(`/jewelry-products/${params.toString() ? `?${params.toString()}` : ''}`)
  const allProducts = normalizeProductList(res.data)
  const filteredProducts = allProducts.filter(p => p.metal !== 'diamond' && p.metal !== 'platinum')
  setProducts(filteredProducts)
        } catch {
          setProducts([])
        } finally {
          setLoading(false)
        }
      }

          loadProducts()
    }, [metalFilter, categoryFilter, subcategoryFilter, genderFilter, occasionFilter, giftTagFilter, giftTypeFilter, priceFilter, searchFilter, isWedding, isDailywear])

    // subcategory scroll — clicked subcategory first, remaining subcategories
    // (same category, navbar order) follow one after another below it.
    // Top-level category click (subcategory illama) — first subcategory-ah
    // default-a eduthukom, appadiye same section-scroll view varum.
  useEffect(() => {
    if (!categoryFilter && !(isGifting && giftTagFilter)) {
      setSubcategorySections([])
      return
    }

    let alive = true

    const loadSections = async () => {
      setSectionsLoading(true)

      // ── Gifting branch — ONE call fetches every product for this
      // gift_tag, then group by gift_type in JS (matches backend's
      // name__icontains logic) — 8 calls -> 1 call ──
      if (isGifting && giftTagFilter) {
        const allTags = getGiftingSubcategories(giftTagFilter)
        if (!allTags.length) {
          setSubcategorySections([])
          setSectionsLoading(false)
          return
        }
        try {
          const cacheKey = `subsec_gift_${giftTagFilter}_${genderFilter || 'none'}_${occasionFilter || 'none'}_${priceFilter || 'none'}`
          let allProducts = readSubsecCache(cacheKey)
          if (!allProducts) {
            const params = new URLSearchParams()
            params.set('gift_tag', giftTagFilter)
            if (genderFilter) params.set('gender', genderFilter)
            if (occasionFilter) params.set('occasion', occasionFilter)
            if (priceFilter) params.set('price', priceFilter)
            const res = await api.get(`/jewelry-products/?${params.toString()}`)
            allProducts = normalizeProductList(res.data).filter(
              p => p.metal !== 'diamond' && p.metal !== 'platinum'
            )
            writeSubsecCache(cacheKey, allProducts)
          }

          const selectedTag = giftTypeFilter || allTags[0]
          const orderedTags = [selectedTag, ...allTags.filter(s => s !== selectedTag)]
          const results = orderedTags
            .map(sub => ({
              name: sub,
              products: allProducts.filter(p => (p.name || '').toLowerCase().includes(sub.toLowerCase())),
            }))
            .filter(s => s.products.length)

          if (alive) setSubcategorySections(results)
        } catch {
          if (alive) setSubcategorySections([])
        } finally {
          if (alive) setSectionsLoading(false)
        }
        return
      }

      // ── Gold/Silver/Wedding branch — ONE call fetches every product for
      // this category+metal+gender+occasion+price, then group by subcategory
      // in JS — 5-8 calls -> 1 call ──
      const metal = isWedding ? 'wedding' : (metalFilter || 'gold')
      const allSubs = getSubcategories(categoryFilter, metal)
      if (!allSubs.length) {
        setSubcategorySections([])
        setSectionsLoading(false)
        return
      }

      try {
        const occasionValue = isWedding ? 'Wedding' : (occasionFilter || 'none')
        const cacheKey = `subsec_${categoryFilter}_${metalFilter || 'none'}_${genderFilter || 'none'}_${occasionValue}_${priceFilter || 'none'}`
        let allProducts = readSubsecCache(cacheKey)
        if (!allProducts) {
          const params = new URLSearchParams()
          params.set('category', categoryFilter)
          if (metalFilter) params.set('metal', metalFilter)
          if (isWedding) params.set('occasion', 'Wedding')
          else if (occasionFilter) params.set('occasion', occasionFilter)
          if (genderFilter) params.set('gender', genderFilter)
          if (priceFilter) params.set('price', priceFilter)
          const res = await api.get(`/jewelry-products/?${params.toString()}`)
          allProducts = normalizeProductList(res.data).filter(
            p => p.metal !== 'diamond' && p.metal !== 'platinum'
          )
          writeSubsecCache(cacheKey, allProducts)
        }

        const selectedSub = subcategoryFilter || allSubs[0]
        const orderedSubs = [selectedSub, ...allSubs.filter(s => s !== selectedSub)]
        const results = orderedSubs
          .map(sub => ({
            name: sub,
            products: allProducts.filter(p => (p.name || '').toLowerCase().includes(sub.toLowerCase())),
          }))
          .filter(s => s.products.length)

        if (alive) setSubcategorySections(results)
      } catch {
        if (alive) setSubcategorySections([])
      } finally {
        if (alive) setSectionsLoading(false)
      }
    }

    loadSections()
    return () => { alive = false }
  }, [subcategoryFilter, categoryFilter, metalFilter, isWedding, isGifting, giftTagFilter, giftTypeFilter, genderFilter, occasionFilter, priceFilter])

    useEffect(() => {
      if (!subcategoryFilter || !subcategorySections.length) {
        setActiveScrollSub(null)
        return
      }

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveScrollSub(entry.target.dataset.subsection)
            }
          })
        },
        { rootMargin: '-160px 0px -70% 0px', threshold: 0 }
      )

      Object.values(sectionRefs.current).forEach(el => {
        if (el) observer.observe(el)
      })

      return () => observer.disconnect()
    }, [subcategorySections, subcategoryFilter])

    const visibleProducts = useMemo(() => {
      const list = [...products]
      if (sortBy === 'price-low') list.sort((a, b) => productPrice(a, rates) - productPrice(b, rates))
      if (sortBy === 'price-high') list.sort((a, b) => productPrice(b, rates) - productPrice(a, rates))
      if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      return list
    }, [products, rates, sortBy])

    const copy = metalCopy[metalFilter] || {
      title: categoryFilter
        ? `${categoryFilter.charAt(0).toUpperCase()}${categoryFilter.slice(1)}`
        : searchFilter
          ? `Search: ${searchFilter}`
          : isWedding
            ? 'Wedding Collection'
            : isDailywear
              ? 'Daily Wear'
              : 'All Jewellery',
      crumb: 'All Jewellery',
      accent: '#073B3F',
      bannerTitle: 'Heritage Crafted For Generations',
      bannerText: 'Explore jewellery collections made for every occasion.',
      bannerImage: '/black_necklaces.png',
      sideImage: '/gold_Woman.jpg',
      sideTitle: 'Heritage Crafted. For Generations.',
    }

    const activeRoute = metalFilter === 'gold'
      ? categoryFilter ? `/collection/all?metal=gold&category=${categoryFilter}` : '/collection/all?metal=gold'
      : categoryFilter ? `/collection/all?category=${categoryFilter}` : '/collection/all'

    // ── NEW: Price/Gender/Occasion quick filters — existing params (metal,
    // category, subcategory, gift_tag) ellame preserve pannitu, ippo select
    // panna key mattum update/remove pannum ──
    const updateFilterParam = (key, value) => {
      const params = new URLSearchParams(searchParams)
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      navigate(`${location.pathname}?${params.toString()}`)
    }

  const productResults = loading ? (
    <SkeletonGrid count={8} />
  ) : visibleProducts.length ? (
    <section className="an-products">
      {visibleProducts.map(product => (
        <ProductCard key={product.id} product={product} rates={rates} navigate={navigate} wishlisted={wishlistedIds.has(product.id)} onWishlist={toggleWishlist} />
      ))}
    </section>
  ) : (
      <section className="an-empty">No products found. Try another collection.</section>
    )

  const subcategoryResults = sectionsLoading ? (
    <SkeletonGrid count={4} />
  ) : subcategorySections.length ? (
      subcategorySections.map(section => (
        <section
          key={section.name}
          ref={el => (sectionRefs.current[section.name] = el)}
          data-subsection={section.name}
          style={{ marginTop: '32px' }}
        >
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', marginBottom: '16px', color: '#111' }}>
            {section.name}
          </h2>
        <div className="an-products">
          {section.products.map(product => (
            <ProductCard key={product.id} product={product} rates={rates} navigate={navigate} wishlisted={wishlistedIds.has(product.id)} onWishlist={toggleWishlist} />
          ))}
        </div>
        </section>
      ))
    ) : (
      <section className="an-empty">No products found. Try another collection.</section>
    )

   const mainContent = (categoryFilter || (isGifting && giftTagFilter)) ? subcategoryResults : productResults

    return (
      <div className="an-page">
        <style>{`
          .an-page {
            min-height: 100vh;
            background: #fff;
            color: #071f22;
            font-family: Inter, "Montserrat", system-ui, sans-serif;
          }

                .an-shell {
            width: min(100% - 48px, 2200px);
            margin: 0 auto;
          }

          .an-layout {
            display: grid;
            grid-template-columns: 260px minmax(0, 1fr);
            gap: 24px;
            align-items: start;
            padding: 30px 0 20px;
          }

          .an-content {
            min-width: 0;
          }

          .an-filter,
          .an-trust-box,
          .an-side-promo,
          .an-newsletter {
            border: 1px solid #e7e1d9;
            box-shadow: 0 12px 36px rgba(7,31,34,0.06);
          }

          .an-filter-wrap {
            width: 100%;
            min-height: 1px;
            position: relative;
            align-self: stretch;
          }

        .an-filter {
          position: -webkit-sticky;
          position: sticky;
          top: 192px;
          align-self: flex-start;
          border-radius: 16px;
          overflow-y: auto;
          max-height: calc(100vh - 210px);
          background: #fdfaf7;
          scroll-behavior: smooth;
          box-shadow: 0 4px 24px rgba(92,66,41,.06);
        }

          .an-filter::-webkit-scrollbar {
            width: 6px;
          }

          .an-filter::-webkit-scrollbar-track {
            background: transparent;
          }

          .an-filter::-webkit-scrollbar-thumb {
            background: #d9cfc0;
            border-radius: 999px;
          }

          .an-filter::-webkit-scrollbar-thumb:hover {
            background: #c4b6a0;
          }

          .an-filter {
            scrollbar-width: thin;
            scrollbar-color: #d9cfc0 transparent;
          }

          .an-filter h2 {
            padding: 22px 22px 18px;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #073B3F;
            border-bottom: 1px solid #eee2d3;
          }

          .an-filter-section {
            padding: 16px 16px 18px;
            border-bottom: 1px solid #eee2d3;
          }

          .an-filter-title,
          .an-filter-collapse {
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #6b5d47;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            margin-bottom: 14px;
          }

          .an-filter-section button {
            width: 100%;
            border: 0;
            border-radius: 10px;
            background: transparent;
            color: #2b241c;
            display: block;
            padding: 11px 14px;
            text-align: left;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: background 150ms ease, color 150ms ease, transform 150ms ease;
          }

          .an-filter-section button.active,
          .an-filter-section button:hover {
            background: #fff;
            color: #073B3F;
            transform: translateX(2px);
            box-shadow: 0 2px 8px rgba(92,66,41,.08);
          }

          .an-filter-section button.active {
            font-weight: 800;
          }

          .an-filter-subgroup {
            margin: 4px 0 8px 12px;
            padding-left: 12px;
            border-left: 2px solid #eee2d3;
            display: flex;
            flex-direction: column;
            gap: 2px;
            animation: filterExpand 200ms ease;
          }

          .an-filter-subgroup button {
            font-size: 13px !important;
            padding: 8px 12px !important;
            color: #7a6f5c;
          }

          .an-filter-subgroup button.active {
            color: #073B3F !important;
            background: #eaf1f0 !important;
          }

          @keyframes filterExpand {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .an-clear {
            width: calc(100% - 36px);
            min-height: 42px;
            margin: 16px 18px 24px;
            border: 1px solid #cfc6ba;
            border-radius: 6px;
            background: #fff;
            color: #073B3F;
            font-weight: 900;
            cursor: pointer;
          }

          .an-main-head {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 18px;
            align-items: start;
            margin: 6px 0 18px;
          }

          .an-quick-filters {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
          }

          .an-qf-dropdown {
            position: relative;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .an-qf-label {
            font-size: 14px;
            font-weight: 700;
            color: #111;
            white-space: nowrap;
          }

          .an-qf-toggle {
            border: 1px solid #ded8d1;
            border-radius: 6px;
            background: #fff;
            padding: 8px 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 140px;
            justify-content: space-between;
          }

          .an-qf-toggle.active {
            border-color: #073B3F;
            background: #eaf1f0;
          }

          .an-qf-value {
            font-size: 13px;
            font-weight: 700;
            color: #111;
            white-space: nowrap;
          }

          .an-qf-toggle.active .an-qf-value {
            color: #073B3F;
          }

          .an-qf-panel {
            position: absolute;
            top: calc(100% + 6px);
            right: 0;
            z-index: 20;
            min-width: 160px;
            background: #fff;
            border: 1px solid #e7e1d9;
            border-radius: 10px;
            box-shadow: 0 12px 30px rgba(7,31,34,0.12);
            padding: 6px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-6px);
            pointer-events: none;
            transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
          }

          .an-qf-panel.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
            pointer-events: auto;
          }

          .an-qf-caret {
            display: inline-block;
            transition: transform 180ms ease;
          }

          .an-qf-caret.open {
            transform: rotate(180deg);
          }

          .an-qf-panel button {
            width: 100%;
            border: 0;
            background: transparent;
            text-align: left;
            padding: 8px 10px;
            font-size: 12px;
            font-weight: 600;
            color: #111;
            cursor: pointer;
            border-radius: 6px;
          }

          .an-qf-panel button:hover,
          .an-qf-panel button.active {
            background: #eaf1f0;
            color: #073B3F;
          }

          .an-breadcrumb {
            color: #446266;
            font-size: 13px;
            margin-bottom: 12px;
          }

          .an-title h1 {
            margin: 0;
            color: ${copy.accent};
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(32px, 3vw, 42px);
            line-height: 1;
            font-weight: 600;
          }

          .an-title-mark {
            width: 226px;
            height: 16px;
            margin: 10px 0 8px;
            background: linear-gradient(90deg, ${copy.accent}, transparent 44%, ${copy.accent});
            mask: linear-gradient(#000,#000) center/100% 1px no-repeat;
            opacity: .8;
          }

          .an-title p {
            margin: 0;
            font-size: 16px;
            color: #111;
          }

          .an-toolbar {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 12px;
            color: #111;
            font-weight: 800;
            min-width: 0;
          }

          .an-toolbar select {
            min-width: min(100%, 178px);
            height: 46px;
            border: 1px solid #ded8d1;
            border-radius: 12px;
            background: #fff;
            padding: 0 16px;
            font-weight: 800;
            outline: none;
          }

          .an-view-btn {
            width: 46px;
            height: 46px;
            border: 1px solid #ded8d1;
            border-radius: 12px;
            background: #fff;
            color: #073B3F;
            display: grid;
            place-items: center;
          }

          .an-view-btn.active {
            background: #eaf4f2;
          }

          .an-category-grid {
            display: none;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 20px;
          }

          .an-category-card {
            min-height: 220px;
            border: 0;
            border-radius: 10px;
            background: linear-gradient(145deg,#fbf6ef,#fff);
            box-shadow: 0 12px 34px rgba(92,66,41,.07);
            padding: 18px 16px;
            position: relative;
            cursor: pointer;
            overflow: hidden;
            text-align: center;
            transition: transform .22s ease, box-shadow .22s ease;
          }

          .an-category-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 44px rgba(92,66,41,.12);
          }

          .an-category-card img {
            width: 128px;
            height: 118px;
            object-fit: contain;
            margin: 0 auto 14px;
            display: block;
            transition: transform .28s ease;
          }

          .an-category-card:hover img {
            transform: scale(1.06);
          }

          .an-category-card strong {
            display: block;
            color: #111;
            font-size: 16px;
            margin-bottom: 8px;
          }

          .an-category-card span {
            color: #111;
            font-size: 13px;
          }

          .an-round-arrow {
            position: absolute;
            right: 16px;
            bottom: 20px;
            width: 30px;
            height: 30px;
            border: 1px solid #cfd8d6;
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #073B3F;
            background: #fff;
          }

          .an-promo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
            gap: 18px;
            margin-top: 28px;
          }

          .an-promo {
            min-height: 220px;
            border: 0;
            border-radius: 10px;
            overflow: hidden;
            background: #f6f1eb;
            position: relative;
            text-align: left;
            padding: 24px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: flex-start;
            isolation: isolate;
          }

          .an-promo::before {
            content: '';
            position: absolute;
            inset: 0;
            z-index: -1;
            background: linear-gradient(90deg, rgba(253,244,229,0.96) 0%, rgba(253,244,229,0.82) 42%, rgba(253,244,229,0.18) 100%);
          }

          .an-promo img {
            position: absolute;
            inset: 0;
            z-index: -2;
            width: 100%;
            height: 100%;
            min-height: 0;
            object-fit: cover;
            opacity: .88;
          }

          .an-promo h3 {
            position: relative;
            z-index: 1;
            max-width: 72%;
            margin: 0;
            font-family: Georgia, serif;
            font-size: clamp(20px, 1.35vw, 26px);
            font-weight: 500;
            line-height: 1.12;
            color: #073B3F;
          }

          .an-promo p,
          .an-promo span {
            position: relative;
            z-index: 1;
            max-width: 70%;
            color: #111;
            font-weight: 800;
            line-height: 1.35;
            overflow-wrap: normal;
          }

          .an-promo p {
            margin: 12px 0 0;
            font-size: 14px;
          }

          .an-promo span {
            display: inline-flex;
            margin-top: 14px;
            color: #073B3F;
            text-transform: uppercase;
            font-size: 12px;
            font-weight: 900;
          }

          .an-metal-banner {
            min-height: 176px;
            border-radius: 10px;
            padding: 28px 34px;
            margin-bottom: 24px;
            background:
              linear-gradient(90deg, rgba(253,244,229,.98), rgba(253,244,229,.82) 46%, rgba(253,244,229,.2)),
              url('${copy.bannerImage}');
            background-size: cover;
            background-position: right center;
            display: grid;
            grid-template-columns: minmax(240px, .65fr) 1fr;
            align-items: center;
            overflow: hidden;
          }

          .an-metal-banner h2 {
            margin: 0 0 8px;
            font-family: Georgia, serif;
            font-size: 27px;
            font-weight: 500;
          }

          .an-metal-banner p {
            margin: 0 0 18px;
            max-width: 360px;
            line-height: 1.55;
          }

          .an-primary-btn {
            border: 0;
            border-radius: 6px;
            background: #073B3F;
            color: #fff;
            min-height: 38px;
            padding: 0 18px;
            font-weight: 900;
            text-transform: uppercase;
            cursor: pointer;
          }

          .an-banner-badges {
            display: flex;
            gap: clamp(28px, 5vw, 70px);
            align-items: center;
            justify-content: center;
          }

          .an-banner-badges div {
            text-align: center;
            color: #6b4b27;
            font-weight: 800;
            font-size: 13px;
          }

          .an-cat-rail {
            display: grid;
            grid-template-columns: repeat(9, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 24px;
            align-items: start;
          }

          .an-cat-rail button {
            border: 0;
            background: transparent;
            cursor: pointer;
            text-align: center;
            font-weight: 800;
          }

          .an-cat-rail img {
            width: 78px;
            height: 78px;
            border-radius: 50%;
            object-fit: cover;
            background: #f7f1ea;
            margin: 0 auto 9px;
            box-shadow: 0 10px 28px rgba(92,66,41,.08);
          }

          .an-cat-rail .view-all {
            width: 78px;
            height: 78px;
            border-radius: 50%;
            border: 1px solid #f0d8b8;
            display: grid;
            place-items: center;
            margin: 0 auto 9px;
            color: #a36b18;
            font-size: 24px;
            background: #fff5e7;
          }

          .an-products {
            display: flex;
            flex-wrap: wrap;
            justify-content: start;
            gap: clamp(22px, 2.2vw, 34px);
            margin-top: 30px;
            align-items: start;
          }

          .an-product-card {
            min-width: 0;
            flex: 0 0 calc(25% - 26px);
            border: 1px solid #eadfd3;
            border-radius: 10px;
            overflow: hidden;
            background: #fff;
            cursor: pointer;
            box-shadow: 0 10px 24px rgba(92,66,41,.07);
            transition: transform .2s ease, box-shadow .2s ease;
          }

          .an-product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 18px 38px rgba(92,66,41,.12);
          }

          .an-product-image {
            position: relative;
            aspect-ratio: 1 / 1;
            min-height: clamp(210px, 21vw, 300px);
            background: #fbf4eb;
            overflow: hidden;
          }

          .an-product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform .35s ease;
          }

          .an-product-card:hover img {
            transform: scale(1.05);
          }

        .an-heart {
          position: absolute;
          right: 12px;
          top: 12px;
          width: 30px;
          height: 30px;
          border: 0;
          background: transparent;
          font-size: 23px;
          cursor: pointer;
          color: #333;
        }

        .an-heart.active {
          color: #C92035;
        }

          .an-product-body {
            padding: 13px 14px 15px;
          }

          .an-product-body h3 {
            margin: 0 0 7px;
            font-size: 14px;
            color: #111;
          }

          .an-product-body p {
            margin: 0 0 8px;
            font-size: 12px;
            color: #5e5e5e;
          }

          .an-product-body strong {
            color: #111;
            font-size: 17px;
          }

          .an-rating {
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 5px;
            color: #d18414;
            font-size: 12px;
          }

          .an-rating button {
            margin-left: auto;
            width: 30px;
            height: 30px;
            border: 0;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: #073B3F;
            color: #fff;
            cursor: pointer;
          }

          .an-right-rail {
            display: none;
          }

          .an-trust-box {
            border-radius: 10px;
            background: #edf6f4;
            padding: 26px 26px 14px;
          }

          .an-trust-item {
            min-height: 72px;
            border-bottom: 1px dashed #c7d6d4;
            display: grid;
            place-items: center;
            text-align: center;
            color: #073B3F;
          }

          .an-trust-item:last-child {
            border-bottom: 0;
          }

          .an-trust-item strong {
            max-width: 150px;
            line-height: 1.25;
            font-size: 14px;
          }

          .an-side-promo {
            position: relative;
            min-height: 384px;
            overflow: hidden;
            border-radius: 10px;
            color: #fff;
            background: #a36b18;
          }

          .an-side-promo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            position: absolute;
            inset: 0;
          }

          .an-side-promo::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, transparent 35%, rgba(77,41,12,.76));
          }

          .an-side-promo div {
            position: absolute;
            left: 24px;
            right: 24px;
            bottom: 26px;
            z-index: 1;
          }

          .an-side-promo h3 {
            font-family: Georgia, serif;
            font-size: 25px;
            line-height: 1.15;
            margin: 0 0 20px;
            font-weight: 500;
          }

          .an-side-promo button {
            border: 0;
            border-radius: 6px;
            min-height: 38px;
            padding: 0 26px;
            background: #fff;
            color: #8b551e;
            text-transform: uppercase;
            font-weight: 900;
          }


        .an-loading,
        .an-empty {
          min-height: 280px;
          border-radius: 12px;
          border: 1px solid #eadfd3;
          display: grid;
          place-items: center;
          background: #fff;
          font-weight: 900;
        }

        .an-skeleton-card {
          border: 1px solid #eadfd3;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          padding-bottom: 14px;
        }

        .an-skeleton-img {
          aspect-ratio: 1 / 1;
          min-height: clamp(210px, 21vw, 300px);
          background: linear-gradient(90deg, #f2ede6 25%, #fbf8f4 37%, #f2ede6 63%);
          background-size: 400% 100%;
          animation: skeletonShine 1.4s ease infinite;
        }

        .an-skeleton-line {
          height: 12px;
          margin: 12px 14px 0;
          border-radius: 6px;
          background: linear-gradient(90deg, #f2ede6 25%, #fbf8f4 37%, #f2ede6 63%);
          background-size: 400% 100%;
          animation: skeletonShine 1.4s ease infinite;
        }

        @keyframes skeletonShine {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }

          @media (max-width: 1440px) {
            .an-shell { width: min(100% - 48px, 1810px); }
            .an-layout { grid-template-columns: 250px minmax(0, 1fr); gap: 20px; }
            .an-category-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .an-products { grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr)); }
          }

          @media (max-width: 1120px) {
            .an-layout { grid-template-columns: 230px minmax(0, 1fr); }
            .an-category-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .an-promo-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); }
            .an-cat-rail { grid-template-columns: repeat(5, minmax(0, 1fr)); }
            .an-products { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }
          }

                  @media (max-width: 820px) {
            .an-shell { width: min(100% - 28px, 1810px); }
            .an-layout { grid-template-columns: 1fr; padding-top: 18px; }
            .an-filter { position: static !important; left: auto !important; width: 100% !important; }
            .an-main-head { grid-template-columns: 1fr; }
            .an-category-grid,
            .an-products { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }
            .an-metal-banner { grid-template-columns: 1fr; }
            .an-banner-badges { display: none; }
          }

          @media (max-width: 520px) {
            .an-category-grid,
            .an-promo-grid,
            .an-products { grid-template-columns: 1fr; }
            .an-promo { min-height: 190px; padding: 18px; }
            .an-products { gap: 18px; margin-top: 22px; }
            .an-product-image { min-height: 0; }
            .an-promo h3, .an-promo p, .an-promo span { max-width: 82%; }
            .an-cat-rail { grid-template-columns: repeat(3, minmax(0, 1fr)); }

          }
        `}</style>

        <main className="an-shell">
          <section className="an-layout">
                    <FilterPanel activeRoute={activeRoute} navigate={navigate} metalFilter={metalFilter} categoryFilter={categoryFilter} subcategoryFilter={subcategoryFilter} activeScrollSub={activeScrollSub} isWedding={isWedding} isGifting={isGifting} giftTagFilter={giftTagFilter} giftTypeFilter={giftTypeFilter} />

            <div className="an-content">
              <div className="an-main-head">
                <div className="an-title">
                  <div className="an-breadcrumb">Home &gt; {copy.crumb}</div>
                  <h1>{copy.title}</h1>
                  <div className="an-title-mark" />
                  <p>{copy.subtitle}</p>
                </div>
                <div className="an-quick-filters">
                  <QuickFilterDropdown
                    label="Price"
                    options={PRICE_OPTIONS}
                    currentValue={priceFilter}
                    onSelect={(val) => updateFilterParam('price', val)}
                  />
                  <QuickFilterDropdown
                    label="Gender"
                    options={GENDER_OPTIONS}
                    currentValue={genderFilter}
                    onSelect={(val) => updateFilterParam('gender', val)}
                  />
                  <QuickFilterDropdown
                    label="Occasion"
                    options={OCCASION_OPTIONS}
                    currentValue={occasionFilter}
                    onSelect={(val) => updateFilterParam('occasion', val)}
                  />
                </div>
              </div>

              {metalFilter ? (
                <>

                  

                                  {mainContent}
                </>
              ) : (
                <>
                  <section className="an-category-grid">
                    {categoryTiles.map(item => (
                      <CategoryTile key={item.label} item={item} navigate={navigate} />
                    ))}
                  </section>
                                                  {mainContent}
                </>
              )}
            </div>

            <RightRail copy={copy} />
          </section>


        </main>

        <CustomerFooter />
      </div>
    )
  }


