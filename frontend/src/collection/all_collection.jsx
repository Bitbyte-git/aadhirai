import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import api from '../api'
import CustomerFooter from './CustomerFooter'
import { getSubcategories, getGiftingSubcategories } from '../config/categoryConfig'

  const API_ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')

  const categoryTiles = [
    { label: 'Necklaces', category: 'necklaces', count: '478+', image: '/diamond_necklas.jpg' },
    { label: 'Earrings', category: 'earrings', count: '965+', image: '/rail/gold-earrings.png' },
    { label: 'Rings', category: 'rings', count: '678+', image: '/rail/gold-rings.png' },
    { label: 'Bracelets', category: 'bracelets', count: '412+', image: '/rail/gold-bracelets.png' },
    { label: 'Pendants', category: 'pendants', count: '329+', image: '/rail/gold-pendants.png' },
    { label: 'Chains', category: 'chains', count: '286+', image: '/rail/gold-chains.png' },
    { label: 'Mangalsutra', category: 'mangalsutra', count: '193+', image: '/rail/gold-mangalsutra.png' },
    { label: 'Bangles', category: 'bangles', count: '551+', image: '/rail/gold-bangles.png' },
    { label: 'Necklace Set', category: 'necklaces', count: '241+', image: '/wedding_necklaces.jpg' },
    { label: 'Nose Pin', category: 'nosepin', count: '156+', image: '/diamond Earings.jpg' },
  ]

  const goldRail = [
    { label: 'Necklaces', category: 'necklaces', image: '/gold-women.png' },
    { label: 'Earrings', category: 'earrings', image: '/rail/gold-earrings.png' },
    { label: 'Rings', category: 'rings', image: '/rail/gold-rings.png' },
    { label: 'Bangles', category: 'bangles', image: '/rail/gold-bangles.png' },
    { label: 'Chains', category: 'chains', image: '/rail/gold-chains.png' },
    { label: 'Pendants', category: 'pendants', image: '/rail/gold-pendants.png' },
    { label: 'Mangalsutra', category: 'mangalsutra', image: '/rail/gold-mangalsutra.png' },
    { label: 'Gold Coins', route: '/collection/coins?metal=gold', image: '/rail/gold-coins.png' },
  ]

  const filterCategories = [
    ['All Jewellery', '/collection/all', null],
    ['Gold Coins', '/collection/coins?metal=gold', null],
    ['Silver Coins', '/collection/coins?metal=silver', null],
    ['Silver Jewellery', '/collection/all?metal=silver', null],
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
  ]

  // Matches the navbar's "Gold Jewellery" mega-menu (CustomerNavbar.jsx)
  // category-for-category, plus Gold Coins and a Silver switch link per
  // request — so the Filter page's list is the same one customers already
  // know from the navbar, not a shorter, different one.
  const goldFilterCategories = [
    ['All Gold Jewellery', '/collection/all?metal=gold', null],
    ['Gold Coins', '/collection/coins?metal=gold', null],
    ['Silver Coins', '/collection/coins?metal=silver', null],
    ['Silver Jewellery', '/collection/all?metal=silver', null],
    ['Gold Rings', '/collection/all?metal=gold&category=rings', 'rings'],
    ['Gold Bangles', '/collection/all?metal=gold&category=bangles', 'bangles'],
    ['Gold Bracelets', '/collection/all?metal=gold&category=bracelets', 'bracelets'],
    ['Gold Earrings', '/collection/all?metal=gold&category=earrings', 'earrings'],
    ['Gold Pendants', '/collection/all?metal=gold&category=pendants', 'pendants'],
    ['Gold Chains', '/collection/all?metal=gold&category=chains', 'chains'],
    ['Gold Necklaces', '/collection/all?metal=gold&category=necklaces', 'necklaces'],
    ['Gold Mangalsutra', '/collection/all?metal=gold&category=mangalsutra', 'mangalsutra'],
    ['Gold Anklets', '/collection/all?metal=gold&category=anklets', 'anklets'],
    ['Gold Maang Tikka', '/collection/all?metal=gold&category=maangtikka', 'maangtikka'],
    ['Gold Kada', '/collection/all?metal=gold&category=kada', 'kada'],
    ['Gold Nose Pins', '/collection/all?metal=gold&category=nosepin', 'nosepin'],
    ['Gold Tie Pins', '/collection/all?metal=gold&category=tiepins', 'tiepins'],
    ['Gold Ear Chains', '/collection/all?metal=gold&category=earchains', 'earchains'],
    ['Gold Toe Rings', '/collection/all?metal=gold&category=toerings', 'toerings'],
    ['Gold Armlets', '/collection/all?metal=gold&category=armlets', 'armlets'],
  ]

// Matches the navbar's "Silver Jewellery" mega-menu, same reasoning as gold.
const silverFilterCategories = [
  ['All Silver Jewellery', '/collection/all?metal=silver', null],
  ['Silver Coins', '/collection/coins?metal=silver', null],
  ['Gold Coins', '/collection/coins?metal=gold', null],
  ['Gold Jewellery', '/collection/all?metal=gold', null],
  ['Silver Anklets', '/collection/all?metal=silver&category=anklets', 'anklets'],
  ['Silver Rings', '/collection/all?metal=silver&category=rings', 'rings'],
  ['Silver Earrings', '/collection/all?metal=silver&category=earrings', 'earrings'],
  ['Silver Bracelets', '/collection/all?metal=silver&category=bracelets', 'bracelets'],
  ['Silver Bangles', '/collection/all?metal=silver&category=bangles', 'bangles'],
  ['Silver Pendants', '/collection/all?metal=silver&category=pendants', 'pendants'],
  ['Silver Chains', '/collection/all?metal=silver&category=chains', 'chains'],
  ['Silver Necklaces', '/collection/all?metal=silver&category=necklaces', 'necklaces'],
  ['Silver Toe Rings', '/collection/all?metal=silver&category=toerings', 'toerings'],
  ['Silver Nose Pins', '/collection/all?metal=silver&category=nosepin', 'nosepin'],
  ['Silver Articles', '/collection/all?metal=silver&category=articles', 'articles'],
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

  const AGE_OPTIONS_KIDS = [
    ['All', ''],
    ['Newborn (0-1 month)', 'newborn'],
    ['Infant (1 month-1 year)', 'infant'],
    ['Toddler (1-3 years)', 'toddler'],
    ['Child (3-9 years)', 'child'],
    ['Preteen (9-12 years)', 'preteen'],
    ['Teenager (13-19 years)', 'teenager'],
  ]

  const AGE_OPTIONS_ADULT = [
    ['All', ''],
    ['Young Adult (20-29 years)', 'young_adult'],
    ['Adult (30-44 years)', 'adult'],
    ['Middle-aged (45-64 years)', 'middle_aged'],
    ['Senior (65-79 years)', 'senior'],
    ['Elderly (80-99 years)', 'elderly'],
    ['Centenarian (100+ years)', 'centenarian'],
  ]

  const AGE_OPTIONS_ALL = [
    ['All', ''],
    ...AGE_OPTIONS_KIDS.filter(([, val]) => val),
    ...AGE_OPTIONS_ADULT.filter(([, val]) => val),
  ]

  // genderFilter 'kids' -> kids range mattum, 'men'/'women' -> adult range mattum, '' (All) -> full range
  const getAgeOptionsForGender = (gender) => {
    if (gender === 'kids') return AGE_OPTIONS_KIDS
    if (gender === 'men' || gender === 'women') return AGE_OPTIONS_ADULT
    return AGE_OPTIONS_ALL
  }

  // Same 8 occasions offered as checkboxes on Add New Product — this filter
  // stays a single-select dropdown (customer picks one at a time to browse)
  const OCCASION_OPTIONS = [
    ['All', ''],
    ['Wedding', 'Wedding'],
    ['Birthday', 'Birthday'],
    ['Anniversary', 'Anniversary'],
    ['Auspicious', 'Auspicious'],
    ['Office Wear', 'Office Wear'],
    ['Modern Wear', 'Modern Wear'],
    ['Casual Wear', 'Casual Wear'],
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
    if (type === 'gem') return <svg {...common}><path d="M2.5 9 6 4h12l3.5 5-9.5 11L2.5 9Z" /><path d="M2.5 9h19" /><path d="M9 4 6.5 9 12 20l5.5-11L15 4" /></svg>
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
    const dieCharge = Number(product.die_charge) || 0

    if (!rate || !weight) return Number(product.price) || 0
    const rateWithMaking = rate + (rate * making / 100)
    return Math.round(((weight * (rateWithMaking - (rateWithMaking * discount / 100))) + stone + dieCharge) * 1.03)
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

function SkeletonGrid({ count = 8 }) {
  return (
    <section className="an-products">
      {Array.from({ length: count }).map((_, i) => (
        <div className="an-skeleton-card" key={i}>
          <div className="an-skeleton-img" />
          <div className="an-skeleton-line" style={{ width: '70%', height: 14, marginTop: 12 }} />
          <div className="an-skeleton-line" style={{ width: '45%', height: 12, marginTop: 8 }} />
          <div className="an-skeleton-line" style={{ width: '55%', height: 16, marginTop: 8 }} />
          <div className="an-skeleton-line" style={{ width: '85%', height: 32, borderRadius: 999, marginTop: 10, marginBottom: 12 }} />
        </div>
      ))}
    </section>
  )
}

// Reuses existing site photos (home page category rail + the Shop-by-Category
// tiles already in this file) so the icon look stays consistent. Matched by
// exact label rather than `key`, since a couple of filterCategories entries
// (e.g. "Necklaces" and "Necklace Set") share the same key. Categories
// without a confirmed-existing photo fall back to the generic gem icon —
// note categoryTiles' own '/diamond Earings.jpg' path is missing from
// public/, so it's deliberately not reused here for Earrings/Nose Pin.
const CATEGORY_RAIL_IMAGES = {
  'Necklaces': '/landing-img/necklace.png',
  'Earrings': '/landing-img/earings.png',
  'Rings': '/landing-img/rings.png',
  'Bracelets': '/landing-img/bracklets.png',
  'Pendants': '/landing-img/pendants.png',
  'Chains': '/landing-img/chains.png',
  'Bangles': '/landing-img/bangles.png',
  'Mangalsutra': '/black_necklaces.png',
  'Necklace Set': '/wedding_necklaces.jpg',
  'Coin & Bars': '/coin/200mg.png',
  'Coins': '/coin/200mg.png',
  'Coins & Bars': '/coin/200mg.png',
  // Fresh custom rail set (frontend/public/rail/) — exact-label entries
  // below take priority over the bareLabel fallbacks above, so metal-scoped
  // items (e.g. "Gold Rings") get their own dedicated photo once supplied,
  // while metal contexts still missing one (e.g. Silver Rings) keep falling
  // back to the generic bareLabel image until their photo is added.
  'All Jewellery': '/rail/all-jewellery.png',
  'Gold Jewellery': '/rail/gold-jewellery.png',
  'Silver Jewellery': '/rail/silver-jewellery.png',
  'Gold Coins': '/rail/gold-coins.png',
  'Silver Coins': '/rail/silver-coins.png',
  'Gold Rings': '/rail/gold-rings.png',
  'Gold Earrings': '/rail/gold-earrings.png',
  'Gold Chains': '/rail/gold-chains.png',
  'Gold Bracelets': '/rail/gold-bracelets.png',
  'Gold Bangles': '/rail/gold-bangles.png',
  'Gold Mangalsutra': '/rail/gold-mangalsutra.png',
  'Gold Pendants': '/rail/gold-pendants.png',
  'Silver Rings': '/rail/silver-rings.png',
  'Silver Earrings': '/rail/silver-earrings.png',
  'Silver Chains': '/rail/silver-chains.png',
  'Silver Bracelets': '/rail/silver-bracelets.png',
  'Silver Bangles': '/rail/silver-bangles.png',
  'Silver Pendants': '/rail/silver-pendants.png',
  'Silver Anklets': '/rail/silver-anklets.png',
  'Wedding': '/rail/occasion-wedding.png',
  'Birthday': '/rail/occasion-birthday.png',
  'Anniversary': '/rail/occasion-anniversary.png',
  'Daily Wear': '/rail/occasion-dailywear..png',
  'Modern': '/rail/occasion-modern.png',
  'Traditional': '/rail/occasion-traditiona.png',
}

// Curated, short lists for the horizontal icon rail specifically — separate
// from goldFilterCategories/silverFilterCategories (which stay the long,
// navbar-matching lists used by the full Filter page). Order and exact
// labels per explicit request.
const GOLD_RAIL_ITEMS = [
  ['All Jewellery', '/collection/all', null],
  ['Gold Jewellery', '/collection/all?metal=gold', null],
  ['Silver Jewellery', '/collection/all?metal=silver', null],
  ['Gold Coins', '/collection/coins?metal=gold', null],
  ['Silver Coins', '/collection/coins?metal=silver', null],
  ['Gold Rings', '/collection/all?metal=gold&category=rings', 'rings'],
  ['Gold Earrings', '/collection/all?metal=gold&category=earrings', 'earrings'],
  ['Gold Chains', '/collection/all?metal=gold&category=chains', 'chains'],
  ['Gold Bracelets', '/collection/all?metal=gold&category=bracelets', 'bracelets'],
  ['Gold Bangles', '/collection/all?metal=gold&category=bangles', 'bangles'],
  ['Gold Mangalsutra', '/collection/all?metal=gold&category=mangalsutra', 'mangalsutra'],
  ['Gold Pendants', '/collection/all?metal=gold&category=pendants', 'pendants'],
]

const SILVER_RAIL_ITEMS = [
  ['All Jewellery', '/collection/all', null],
  ['Gold Jewellery', '/collection/all?metal=gold', null],
  ['Gold Coins', '/collection/coins?metal=gold', null],
  ['Silver Coins', '/collection/coins?metal=silver', null],
  ['Silver Anklets', '/collection/all?metal=silver&category=anklets', 'anklets'],
  ['Silver Rings', '/collection/all?metal=silver&category=rings', 'rings'],
  ['Silver Earrings', '/collection/all?metal=silver&category=earrings', 'earrings'],
  ['Silver Bracelets', '/collection/all?metal=silver&category=bracelets', 'bracelets'],
  ['Silver Bangles', '/collection/all?metal=silver&category=bangles', 'bangles'],
  ['Silver Pendants', '/collection/all?metal=silver&category=pendants', 'pendants'],
  ['Silver Chains', '/collection/all?metal=silver&category=chains', 'chains'],
]

// Rail for the base "All Jewellery" page (no metal selected) — metal +
// coin cross-links first, then occasion shortcuts, per explicit request.
const ALL_RAIL_ITEMS = [
  ['All Jewellery', '/collection/all', null],
  ['Gold Jewellery', '/collection/all?metal=gold', null],
  ['Silver Jewellery', '/collection/all?metal=silver', null],
  ['Gold Coins', '/collection/coins?metal=gold', null],
  ['Silver Coins', '/collection/coins?metal=silver', null],
  ['Wedding', '/collection/all?wedding=true', null],
  ['Birthday', '/collection/all?occasion=Birthday', null],
  ['Anniversary', '/collection/all?occasion=Anniversary', null],
  ['Daily Wear', '/collection/all?dailywear=true', null],
  ['Modern', '/collection/all?occasion=Modern%20Wear', null],
  ['Traditional', '/collection/all?occasion=Traditional%20Wear', null],
]

// Shorter text under the rail icon for these three — the icon itself
// already conveys "Jewellery", so the label stays a single word.
const RAIL_SHORT_LABELS = {
  'All Jewellery': 'All',
  'Gold Jewellery': 'Gold',
  'Silver Jewellery': 'Silver',
}

function CategoryRail({ categories, activeKey, navigate }) {
  return (
    <div className="an-cat-rail">
      {categories.map(([label, route, key]) => {
        // Metal-scoped lists use "Gold Rings" / "Silver Rings" etc. —
        // strip the metal prefix so they still match the base image map.
        const bareLabel = label.replace(/^(Gold|Silver)\s+/, '')
        const image = CATEGORY_RAIL_IMAGES[label] || CATEGORY_RAIL_IMAGES[bareLabel] || null
        const isActive = key ? key === activeKey : label.startsWith('All') && !activeKey
        const displayLabel = RAIL_SHORT_LABELS[label] || label
        return (
          <button
            key={label}
            type="button"
            className={`an-cat-rail-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(route)}
          >
            <span className="an-cat-rail-frame">
              {image ? (
                <img src={image} alt="" />
              ) : (
                <Icon type={label === 'All Jewellery' ? 'grid' : 'gem'} size={22} />
              )}
            </span>
            <span>{displayLabel}</span>
          </button>
        )
      })}
    </div>
  )
}

function FilterPanel({ activeRoute, navigate, metalFilter, categoryFilter, subcategoryFilter, activeScrollSub, isWedding, isGifting, giftTagFilter, giftTypeFilter }) {
  const { wrapRef, asideRef, style } = useFixedSidebar()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
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
  const railCategories = metalFilter === 'gold'
    ? GOLD_RAIL_ITEMS
    : metalFilter === 'silver'
      ? SILVER_RAIL_ITEMS
      : (!isWedding && !isGifting)
        ? ALL_RAIL_ITEMS
        : categories
  const [expandedKey, setExpandedKey] = useState(activeKey || null)

  useEffect(() => {
    setExpandedKey(activeKey || null)
  }, [activeKey])

  const subcategoryMetal = isWedding ? 'wedding' : (metalFilter || 'gold')
  const subButtonRefs = useRef({})

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
  const activeFilterTag = subcategoryFilter || categoryFilter || giftTagFilter

  return (
    <div ref={wrapRef} className="an-filter-wrap">
      {/* Mobile-only horizontal category rail (Flipkart-style quick browse) */}
      <div className="an-cat-rail-mobile">
        <CategoryRail categories={railCategories} activeKey={activeKey} navigate={navigate} />
      </div>

      {/* Mobile Toggle Bar */}
      <button
        type="button"
        className="an-mobile-filter-bar"
        onClick={() => setMobileFilterOpen((o) => !o)}
        aria-expanded={mobileFilterOpen}
      >
        <div className="an-mobile-filter-bar-left">
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Categories
          </span>
          {activeFilterTag && (
            <span className="an-mobile-filter-tag">• {activeFilterTag}</span>
          )}
        </div>
        <span className={`an-mobile-filter-caret ${mobileFilterOpen ? 'open' : ''}`}>
          {mobileFilterOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Inline Filter: Sticky on Desktop, Inline Accordion on Mobile (NO bottom-up popup, NO full page cover) */}
      <aside
        ref={asideRef}
        className={`an-filter ${mobileFilterOpen ? 'an-filter-mobile-open' : 'an-filter-mobile-closed'}`}
        style={style}
      >
        <h2 className="an-filter-heading">{(metalFilter === 'gold' || isWedding || isGifting) ? 'Categories' : 'Shop By'}</h2>
        
        <div className="an-filter-section">
          {categories.map(([label, route, key]) => {
            const subOptions = key
              ? (isGifting ? getGiftingSubcategories(key) : getSubcategories(key, subcategoryMetal))
              : []
            const isOpen = key && expandedKey === key
            const isCategoryActive = activeRoute === route && !subcategoryFilter && !giftTagFilter
            return (
              <div key={label} className="an-nav-cat-item">
                <div className={`an-nav-cat-row ${isCategoryActive ? 'active' : ''}`}>
                  <button
                    className={`an-nav-cat-title ${isCategoryActive ? 'active' : ''}`}
                    type="button"
                    onClick={() => {
                      navigate(route)
                      setMobileFilterOpen(false)
                    }}
                  >
                    {label}
                  </button>
                  {subOptions.length > 0 && (
                    <button
                      type="button"
                      className={`an-nav-cat-toggle ${isOpen ? 'open' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedKey(isOpen ? null : key)
                      }}
                      title={isOpen ? 'Collapse' : 'Expand'}
                    >
                      {isOpen ? '−' : '+'}
                    </button>
                  )}
                </div>

                {isOpen && subOptions.length > 0 && (
                  <div className="an-nav-sub-list">
                    {subOptions.map(sub => {
                      const isSubActive = (activeScrollSub || activeSubFilter) === sub
                      return (
                        <button
                          key={sub}
                          ref={el => (subButtonRefs.current[sub] = el)}
                          type="button"
                          className={`an-nav-sub-item ${isSubActive ? 'active' : ''}`}
                          onClick={() => {
                            navigate(buildSubcategoryRoute(route, sub))
                            setMobileFilterOpen(false)
                          }}
                        >
                          <span className="an-nav-sub-name">{sub}</span>
                          {isSubActive && <span className="an-nav-sub-check">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          className="an-clear"
          type="button"
          onClick={() => {
            navigate('/collection/all')
            setMobileFilterOpen(false)
          }}
        >
          Clear Category Filter
        </button>
      </aside>
    </div>
  )
}

function QuickFilterDropdown({ label, options, currentValue, onSelect }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const containerRef = useRef(null)
  const toggleRef = useRef(null)
  const panelRef = useRef(null)

  // Panel is anchored to the button's left edge and grows rightward, so a
  // pill near the right side of the screen can push it past the viewport
  // edge. Once it renders, measure it and pull it back inside the screen.
  useEffect(() => {
    if (!open || !panelRef.current) return
    const margin = 8
    const rect = panelRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    let adjustedLeft = coords.left
    if (rect.right > viewportWidth - margin) {
      adjustedLeft = Math.max(margin, viewportWidth - margin - rect.width)
    } else if (rect.left < margin) {
      adjustedLeft = margin
    }
    if (adjustedLeft !== coords.left) {
      setCoords((c) => ({ ...c, left: adjustedLeft }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleTouchOrClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    // Fixed-position panels don't track the pill on scroll/resize — close
    // instead of leaving them floating in the wrong spot. Scroll listener
    // is capture-phase (fires for the panel's own internal scroll too), so
    // it must ignore scrolls that originate inside our own dropdown.
    const handleDismiss = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleTouchOrClick)
    document.addEventListener('touchstart', handleTouchOrClick)
    window.addEventListener('scroll', handleDismiss, true)
    window.addEventListener('resize', handleDismiss)
    return () => {
      document.removeEventListener('mousedown', handleTouchOrClick)
      document.removeEventListener('touchstart', handleTouchOrClick)
      window.removeEventListener('scroll', handleDismiss, true)
      window.removeEventListener('resize', handleDismiss)
    }
  }, [open])

  const selectedOption = options.find(([, val]) => val === (currentValue || ''))
  const hasValue = Boolean(currentValue && currentValue !== '')
  const displayValue = selectedOption ? selectedOption[0] : ''

  const toggleOpen = () => {
    if (!open && toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 6, left: rect.left })
    }
    setOpen((prev) => !prev)
  }

  return (
    <div className="an-qf-dropdown" ref={containerRef}>
      <button
        ref={toggleRef}
        type="button"
        className={`an-qf-toggle ${hasValue ? 'active' : ''}`}
        onClick={toggleOpen}
        aria-expanded={open}
      >
        <span className="an-qf-value">
          {hasValue ? `${label}: ${displayValue}` : label}
        </span>
        {hasValue ? (
          <span
            className="an-qf-clear-x"
            onClick={(e) => {
              e.stopPropagation()
              onSelect('')
              setOpen(false)
            }}
            title="Clear"
          >
            ✕
          </span>
        ) : (
          <svg
            className={`an-qf-caret ${open ? 'open' : ''}`}
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Fixed-position panel — escapes .an-quick-filters' horizontal-scroll
          clipping (overflow-x:auto forces overflow-y:auto too, which was
          cutting the panel off behind the product grid). */}
      {open && (
        <div ref={panelRef} className="an-qf-panel open" style={{ top: coords.top, left: coords.left }}>
          {options.map(([optLabel, optValue]) => {
            const isSelected = optValue === (currentValue || '')
            return (
              <button
                key={optLabel}
                type="button"
                className={`an-qf-option-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelect(optValue)
                  setOpen(false)
                }}
              >
                <span className="an-qf-opt-label">{optLabel}</span>
                {isSelected && <span className="an-qf-opt-check">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Generic slide-up sheet — shared shell for the Sort and Filter panels below.
// Always mounted (translateY off-screen when closed) so it can animate in.
function MobileSheet({ title, open, onClose, children, footer }) {
  return (
    <>
      <div className={`an-sheet-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`an-sheet ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open}>
        <div className="an-sheet-handle" />
        <div className="an-sheet-header">
          <h3>{title}</h3>
          <button type="button" className="an-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="an-sheet-body">{children}</div>
        {footer && <div className="an-sheet-footer">{footer}</div>}
      </div>
    </>
  )
}

// Mobile-only "Sort | Filter" bar (Flipkart-style). Sort opens a sheet with
// the same Price/Gender/Age/Occasion quick filters the desktop pill row
// uses; Filter opens a sheet with the top-level category list. Both reuse
// the exact same state/routes as the desktop UI — just presented as sheets.
function SortFilterBar({
  priceFilter, genderFilter, ageFilter, occasionFilter,
  onSelectPrice, onSelectGender, onSelectAge, onSelectOccasion, onResetQuickFilters,
  activeFilterTag, navigate, filterPageRoute,
}) {
  const [sheet, setSheet] = useState(null) // null | 'sort'
  const [expandedGroup, setExpandedGroup] = useState('price')

  const hasQuickFilters = Boolean(priceFilter || genderFilter || ageFilter || occasionFilter)

  const sortGroups = [
    { key: 'price', label: 'Price', options: PRICE_OPTIONS, value: priceFilter, onSelect: onSelectPrice },
    { key: 'gender', label: 'Gender', options: GENDER_OPTIONS, value: genderFilter, onSelect: onSelectGender },
    { key: 'age', label: 'Age', options: getAgeOptionsForGender(genderFilter), value: ageFilter, onSelect: onSelectAge },
    { key: 'occasion', label: 'Occasion', options: OCCASION_OPTIONS, value: occasionFilter, onSelect: onSelectOccasion },
  ]

  return (
    <>
      <div className="an-sort-filter-bar">
        <button type="button" className="an-sf-btn" onClick={() => setSheet('sort')}>
          <Icon type="arrow" size={15} />
          Sort{hasQuickFilters ? <span className="an-sf-dot" /> : null}
        </button>
        <span className="an-sf-divider" />
        <button type="button" className="an-sf-btn" onClick={() => navigate(filterPageRoute)}>
          <Icon type="list" size={15} />
          Filter{activeFilterTag ? <span className="an-sf-dot" /> : null}
        </button>
      </div>

      <MobileSheet
        title="Sort & Quick Filters"
        open={sheet === 'sort'}
        onClose={() => setSheet(null)}
        footer={
          <>
            {hasQuickFilters && (
              <button type="button" className="an-sheet-btn-ghost" onClick={onResetQuickFilters}>Clear All</button>
            )}
            <button type="button" className="an-sheet-btn-primary" onClick={() => setSheet(null)}>Done</button>
          </>
        }
      >
        {sortGroups.map((group) => {
          const isOpen = expandedGroup === group.key
          const selectedLabel = group.options.find(([, v]) => v === (group.value || ''))?.[0]
          return (
            <div className="an-sheet-group" key={group.key}>
              <button
                type="button"
                className="an-sheet-group-head"
                onClick={() => setExpandedGroup(isOpen ? null : group.key)}
              >
                <span>{group.label}{group.value ? `: ${selectedLabel}` : ''}</span>
                <svg className={`an-sheet-chevron ${isOpen ? 'open' : ''}`} width="11" height="11" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && (
                <div className="an-sheet-options">
                  {group.options.map(([optLabel, optValue]) => {
                    const isSelected = optValue === (group.value || '')
                    return (
                      <button
                        key={optLabel}
                        type="button"
                        className={`an-sheet-option ${isSelected ? 'active' : ''}`}
                        onClick={() => group.onSelect(optValue)}
                      >
                        {optLabel}
                        {isSelected && <span>✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </MobileSheet>
    </>
  )
}

// Dedicated full-screen Filter page (routed via /collection/all/filter or
// /collection/gifting/filter) — two-pane: categories on the left, that
// category's subcategories on the right, matching the reference Flipkart
// filter screen. Reuses the exact routes/params the rest of the page
// already uses, so selecting an option here is identical to selecting it
// from the old sidebar accordion.
function FilterFullPage({ categories, activeKey, activeSubFilter, isGifting, isWedding, metalFilter, navigate, onBack }) {
  const [selectedKey, setSelectedKey] = useState(activeKey || null)
  const subcategoryMetal = isWedding ? 'wedding' : (metalFilter || 'gold')

  const buildSubcategoryRoute = (baseRoute, subLabel) => {
    const sep = baseRoute.includes('?') ? '&' : '?'
    const param = isGifting ? 'gift_type' : 'subcategory'
    return `${baseRoute}${sep}${param}=${encodeURIComponent(subLabel)}`
  }

  const subOptionsFor = (key) => {
    if (!key) return []
    return isGifting ? getGiftingSubcategories(key) : getSubcategories(key, subcategoryMetal)
  }

  const selectedEntry = categories.find(([, , key]) => key === selectedKey)

  // Selecting e.g. "Bracelets" then switching metal to one that doesn't
  // offer bracelets would otherwise leave selectedKey pointing at a
  // category no longer in `categories`, crashing the render below.
  useEffect(() => {
    if (selectedKey && !categories.some(([, , key]) => key === selectedKey)) {
      setSelectedKey(null)
    }
  }, [categories, selectedKey])

  const selectedSubOptions = selectedEntry ? subOptionsFor(selectedKey) : []

  return (
    <div className="an-fp-page">
      <style>{`
        .an-fp-page {
          min-height: 100vh;
          background: #fff;
          font-family: Inter, "Montserrat", system-ui, sans-serif;
        }
        .an-fp-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid #f2ede7;
          position: sticky;
          top: 0;
          background: #fff;
          z-index: 5;
        }
        .an-fp-back {
          border: 0;
          background: #f7f1ea;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #073B3F;
          cursor: pointer;
          flex-shrink: 0;
        }
        .an-fp-header h1 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #073B3F;
        }
        .an-fp-body {
          display: grid;
          grid-template-columns: 132px 1fr;
          min-height: calc(100vh - 63px);
        }
        .an-fp-left {
          background: #faf7f2;
          border-right: 1px solid #f2ede7;
          overflow-y: auto;
        }
        .an-fp-cat-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 0;
          background: transparent;
          padding: 15px 8px;
          font-size: 12px;
          font-weight: 700;
          color: #453b30;
          cursor: pointer;
          border-left: 3px solid transparent;
          line-height: 1.3;
        }
        .an-fp-cat-item.selected {
          background: #fff;
          color: #073B3F;
          border-left-color: #073B3F;
          font-weight: 800;
        }
        .an-fp-cat-item.active {
          color: #073B3F;
        }
        .an-fp-right {
          padding: 6px 4px;
          overflow-y: auto;
        }
        .an-fp-sub-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 0;
          background: transparent;
          padding: 14px 16px;
          font-size: 13.5px;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          text-align: left;
          border-bottom: 1px solid #f7f3ee;
        }
        .an-fp-sub-item.all {
          font-weight: 800;
          color: #073B3F;
        }
        .an-fp-sub-item.active {
          background: #eaf1f0;
          color: #073B3F;
          font-weight: 800;
        }
        .an-fp-empty-wrap {
          padding-top: 24px;
        }
        .an-fp-empty {
          padding: 0 20px 24px;
          text-align: center;
          color: #8a8a8a;
          font-size: 13px;
        }
      `}</style>

      <div className="an-fp-header">
        <button type="button" className="an-fp-back" onClick={onBack} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1>Filters</h1>
      </div>

      <div className="an-fp-body">
        <div className="an-fp-left">
          {categories.map(([label, route, key]) => {
            const itemSubOptions = subOptionsFor(key)
            const isSelected = key ? key === selectedKey : !selectedKey && label.startsWith('All')
            const isActive = key ? key === activeKey : label.startsWith('All') && !activeKey
            return (
              <button
                key={label}
                type="button"
                className={`an-fp-cat-item ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (itemSubOptions.length > 0) {
                    setSelectedKey(key)
                  } else {
                    navigate(route)
                  }
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="an-fp-right">
          {selectedKey && selectedSubOptions.length > 0 ? (
            <>
              <button
                type="button"
                className="an-fp-sub-item all"
                onClick={() => navigate(selectedEntry[1])}
              >
                All {selectedEntry[0]}
              </button>
              {selectedSubOptions.map((sub) => {
                const isSelected = activeSubFilter === sub
                return (
                  <button
                    key={sub}
                    type="button"
                    className={`an-fp-sub-item ${isSelected ? 'active' : ''}`}
                    onClick={() => navigate(buildSubcategoryRoute(selectedEntry[1], sub))}
                  >
                    {sub}
                    {isSelected && <span>✓</span>}
                  </button>
                )
              })}
            </>
          ) : (
            <div className="an-fp-empty-wrap">
              <div className="an-fp-empty">Select a category to see its options</div>
              {[
                ['Gold Jewellery', '/collection/all?metal=gold'],
                ['Silver Jewellery', '/collection/all?metal=silver'],
                ['Gold Coins', '/collection/coins?metal=gold'],
                ['Silver Coins', '/collection/coins?metal=silver'],
                ['Wedding Jewellery', '/collection/all?wedding=true'],
                ['Daily Wear', '/collection/all?dailywear=true'],
              ].map(([label, route]) => (
                <button
                  key={label}
                  type="button"
                  className="an-fp-sub-item all"
                  onClick={() => navigate(route)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
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
  const ageFilter = searchParams.get('age')
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
  // Infinite scroll (Amazon/Flipkart style) — 30 products per page, next
  // page loads automatically when the sentinel at the bottom of the grid
  // scrolls into view. Only applies to the flat product grid, not the
  // subcategory-accordion view (that one groups everything up front).
  const PAGE_SIZE = 30
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const loadMoreRef = useRef(null)

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

    const buildProductParams = (pageNum) => {
      const params = new URLSearchParams()
      if (metalFilter) params.set('metal', metalFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (subcategoryFilter) params.set('subcategory', subcategoryFilter)
      if (genderFilter) params.set('gender', genderFilter)
      if (ageFilter) params.set('age', ageFilter)
      if (occasionFilter) params.set('occasion', occasionFilter)
      if (giftTagFilter) params.set('gift_tag', giftTagFilter)
      if (giftTypeFilter) params.set('gift_type', giftTypeFilter)
      if (priceFilter) params.set('price', priceFilter)
      if (searchFilter) params.set('search', searchFilter)
      if (isWedding) params.set('occasion', 'Wedding')
      if (isDailywear) params.set('occasion', 'Casual Wear')
      params.set('page', pageNum)
      params.set('page_size', PAGE_SIZE)
      return params
    }

    useEffect(() => {
      const loadProducts = async () => {
        setLoading(true)
        setPage(1)
        setHasMore(false)
        try {
          const params = buildProductParams(1)
          const res = await api.get(`/jewelry-products/?${params.toString()}`)
          // Backend may not have the paginated response shape deployed yet —
          // fall back to treating a plain array as "everything, no more pages".
          const isPaginated = !Array.isArray(res.data)
          const allProducts = normalizeProductList(isPaginated ? res.data.results : res.data)
          const filteredProducts = allProducts.filter(p => p.metal !== 'diamond' && p.metal !== 'platinum')
          setProducts(filteredProducts)
          setHasMore(isPaginated ? Boolean(res.data.has_more) : false)
        } catch {
          setProducts([])
        } finally {
          setLoading(false)
        }
      }

          loadProducts()
    }, [metalFilter, categoryFilter, subcategoryFilter, genderFilter, ageFilter, occasionFilter, giftTagFilter, giftTypeFilter, priceFilter, searchFilter, isWedding, isDailywear])

    const loadMoreProducts = async () => {
      if (loadingMore || !hasMore) return
      setLoadingMore(true)
      try {
        const nextPage = page + 1
        const params = buildProductParams(nextPage)
        const res = await api.get(`/jewelry-products/?${params.toString()}`)
        const isPaginated = !Array.isArray(res.data)
        const allProducts = normalizeProductList(isPaginated ? res.data.results : res.data)
        const filteredProducts = allProducts.filter(p => p.metal !== 'diamond' && p.metal !== 'platinum')
        setProducts(prev => [...prev, ...filteredProducts])
        setHasMore(isPaginated ? Boolean(res.data.has_more) : false)
        setPage(nextPage)
      } catch {
        setHasMore(false)
      } finally {
        setLoadingMore(false)
      }
    }

    // Sentinel div at the bottom of the flat product grid — scrolling it
    // into view auto-loads the next 30 products (Amazon/Flipkart pattern),
    // instead of fetching every matching product up front.
    useEffect(() => {
      const el = loadMoreRef.current
      if (!el || !hasMore) return undefined
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) loadMoreProducts()
        },
        { rootMargin: '600px 0px' }
      )
      observer.observe(el)
      return () => observer.disconnect()
    }, [hasMore, page, loadingMore, metalFilter, categoryFilter, subcategoryFilter, genderFilter, ageFilter, occasionFilter, giftTagFilter, giftTypeFilter, priceFilter, searchFilter, isWedding, isDailywear])

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
          const cacheKey = `subsec_gift_${giftTagFilter}_${genderFilter || 'none'}_${ageFilter || 'none'}_${occasionFilter || 'none'}_${priceFilter || 'none'}`
          let allProducts = readSubsecCache(cacheKey)
          if (!allProducts) {
            const params = new URLSearchParams()
            params.set('gift_tag', giftTagFilter)
            if (genderFilter) params.set('gender', genderFilter)
            if (ageFilter) params.set('age', ageFilter)
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
        const cacheKey = `subsec_${categoryFilter}_${metalFilter || 'none'}_${genderFilter || 'none'}_${ageFilter || 'none'}_${occasionValue}_${priceFilter || 'none'}`
        let allProducts = readSubsecCache(cacheKey)
        if (!allProducts) {
          const params = new URLSearchParams()
          params.set('category', categoryFilter)
          if (metalFilter) params.set('metal', metalFilter)
          if (isWedding) params.set('occasion', 'Wedding')
          else if (occasionFilter) params.set('occasion', occasionFilter)
          if (genderFilter) params.set('gender', genderFilter)
          if (ageFilter) params.set('age', ageFilter)
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
  }, [subcategoryFilter, categoryFilter, metalFilter, isWedding, isGifting, giftTagFilter, giftTypeFilter, genderFilter, ageFilter, occasionFilter, priceFilter])

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

    const onSelectGender = (val) => {
      const params = new URLSearchParams(searchParams)
      if (val) params.set('gender', val); else params.delete('gender')
      params.delete('age')
      navigate(`${location.pathname}?${params.toString()}`)
    }

    const onResetQuickFilters = () => {
      const params = new URLSearchParams(searchParams)
      params.delete('price')
      params.delete('gender')
      params.delete('age')
      params.delete('occasion')
      navigate(`${location.pathname}?${params.toString()}`)
    }

    // Same category-list selection FilterPanel uses, mirrored here so the
    // mobile Sort|Filter bar's Filter sheet can show it without prop-drilling
    // FilterPanel's internal accordion state.
    const sheetCategories = isGifting
      ? giftingFilterCategories
      : isWedding
        ? weddingFilterCategories
        : metalFilter === 'gold'
          ? goldFilterCategories
          : metalFilter === 'silver'
            ? silverFilterCategories
            : filterCategories
    const sheetActiveKey = isGifting ? giftTagFilter : categoryFilter
    const sheetActiveFilterTag = subcategoryFilter || categoryFilter || giftTagFilter

  const activeQuickFilterLabels = [
    priceFilter && `Price: ${PRICE_OPTIONS.find(([, v]) => v === priceFilter)?.[0] || priceFilter}`,
    genderFilter && `Gender: ${GENDER_OPTIONS.find(([, v]) => v === genderFilter)?.[0] || genderFilter}`,
    ageFilter && `Age: ${getAgeOptionsForGender(genderFilter).find(([, v]) => v === ageFilter)?.[0] || ageFilter}`,
    occasionFilter && `Occasion: ${occasionFilter}`,
  ].filter(Boolean)

  const emptyState = (
    <section className="an-empty">
      <p>No products found{activeQuickFilterLabels.length ? ' for:' : '. Try another collection.'}</p>
      {activeQuickFilterLabels.length > 0 && (
        <>
          <div className="an-empty-tags">
            {activeQuickFilterLabels.map((label) => <span key={label}>{label}</span>)}
          </div>
          <button type="button" className="an-empty-clear" onClick={onResetQuickFilters}>
            Clear Filters
          </button>
        </>
      )}
    </section>
  )

  const productResults = loading ? (
    <SkeletonGrid count={8} />
  ) : visibleProducts.length ? (
    <>
      <section className="an-products">
        {visibleProducts.map(product => (
          <ProductCard key={product.id} product={product} rates={rates} navigate={navigate} wishlisted={wishlistedIds.has(product.id)} onWishlist={toggleWishlist} />
        ))}
      </section>
      {hasMore && (
        <div ref={loadMoreRef} className="an-load-more-sentinel">
          {loadingMore && <SkeletonGrid count={8} />}
        </div>
      )}
    </>
  ) : (
      emptyState
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
      emptyState
    )

   const mainContent = (categoryFilter || (isGifting && giftTagFilter)) ? subcategoryResults : productResults

    // Filter is a dedicated full page (not a bottom sheet) so the
    // category + subcategory two-pane layout has room to breathe — see
    // SortFilterBar's "Filter" button and the /filter routes in App.jsx.
    if (location.pathname.endsWith('/filter')) {
      return (
        <FilterFullPage
          categories={sheetCategories}
          activeKey={sheetActiveKey}
          activeSubFilter={subcategoryFilter || giftTypeFilter}
          isGifting={isGifting}
          isWedding={isWedding}
          metalFilter={metalFilter}
          navigate={navigate}
          onBack={() => navigate(-1)}
        />
      )
    }

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

          .an-mobile-filter-bar {
            display: none;
          }

          .an-filter-wrap {
            width: 100%;
            min-width: 0;
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
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .an-qf-dropdown {
            position: relative;
            display: inline-flex;
          }

          .an-qf-toggle {
            border: 1.5px solid #ded8d1;
            border-radius: 999px;
            background: #fff;
            padding: 7px 15px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 700;
            color: #111;
            box-shadow: 0 2px 6px rgba(7,31,34,0.04);
            transition: all 0.2s ease;
          }

          .an-qf-toggle:hover {
            border-color: #073B3F;
            background: #f7faf9;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(7,59,63,0.10);
          }

          .an-qf-toggle.active {
            border-color: #073B3F;
            background: #073B3F;
            color: #fff;
            box-shadow: 0 4px 12px rgba(7,59,63,0.18);
          }

          .an-qf-toggle.active:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(7,59,63,0.24);
          }

          .an-qf-value {
            font-size: 13px;
            font-weight: 700;
            color: inherit;
            white-space: nowrap;
          }

          .an-qf-caret {
            flex-shrink: 0;
            color: currentColor;
            opacity: 0.65;
            transition: transform 0.2s ease, opacity 0.2s ease;
          }

          .an-qf-toggle:hover .an-qf-caret {
            opacity: 1;
          }

          .an-qf-caret.open {
            transform: rotate(180deg);
            opacity: 1;
          }

          .an-qf-clear-x {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 17px;
            height: 17px;
            border-radius: 50%;
            background: rgba(255,255,255,0.28);
            color: #fff;
            font-size: 10px;
            font-weight: 900;
            margin-left: 2px;
            cursor: pointer;
          }

          .an-qf-clear-x:hover {
            background: rgba(255,255,255,0.5);
          }

          .an-qf-reset-btn {
            border: 1.5px dashed #c0392b;
            border-radius: 999px;
            background: #fff5f5;
            color: #c0392b;
            padding: 7px 14px;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.18s ease;
          }

          .an-qf-reset-btn:hover {
            background: #c0392b;
            color: #fff;
          }

          .an-qf-panel {
            position: fixed;
            z-index: 1000;
            min-width: 170px;
            background: #fff;
            border: 1px solid #ded8d1;
            border-radius: 10px;
            box-shadow: 0 8px 24px rgba(7,31,34,0.14);
            padding: 5px;
            animation: qfFadeIn 0.15s ease-out;
          }

          .an-qf-option-btn {
            width: 100%;
            border: 0;
            background: transparent;
            text-align: left;
            padding: 9px 12px;
            font-size: 13px;
            font-weight: 600;
            color: #111;
            cursor: pointer;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background 0.15s ease;
          }

          .an-qf-option-btn:hover,
          .an-qf-option-btn:active {
            background: #eaf1f0;
            color: #073B3F;
          }

          .an-qf-option-btn.active {
            background: #eaf1f0;
            color: #073B3F;
            font-weight: 800;
          }

          .an-qf-opt-check {
            color: #073B3F;
            font-weight: 900;
            margin-left: 8px;
          }

          @keyframes qfFadeIn {
            from { opacity: 0; transform: translateY(-3px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Mobile Sort | Filter bar — hidden on desktop, where the pill
             row (.an-quick-filters) above already covers this. */
          .an-sort-filter-bar-mobile {
            display: none;
          }

          .an-sort-filter-bar {
            display: flex;
            align-items: stretch;
            border: 1.5px solid #ded8d1;
            border-radius: 12px;
            background: #fff;
            overflow: hidden;
          }

          .an-sf-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            border: 0;
            background: transparent;
            padding: 11px 10px;
            font-size: 13px;
            font-weight: 700;
            color: #073B3F;
            cursor: pointer;
          }

          .an-sf-btn:active {
            background: #f7faf9;
          }

          .an-sf-divider {
            width: 1px;
            background: #ded8d1;
          }

          .an-sf-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #C92035;
            margin-left: 2px;
          }

          /* Bottom sheet shell — shared by Sort & Filter */
          .an-sheet-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(7,31,34,0.45);
            z-index: 1400;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
          }

          .an-sheet-backdrop.open {
            opacity: 1;
            pointer-events: auto;
          }

          .an-sheet {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1401;
            background: #fff;
            border-radius: 18px 18px 0 0;
            max-height: 78vh;
            display: flex;
            flex-direction: column;
            transform: translateY(100%);
            transition: transform 0.28s cubic-bezier(.32,.72,0,1);
            box-shadow: 0 -12px 40px rgba(7,31,34,0.18);
          }

          .an-sheet.open {
            transform: translateY(0);
          }

          .an-sheet-handle {
            width: 36px;
            height: 4px;
            border-radius: 999px;
            background: #e0dad0;
            margin: 10px auto 0;
            flex-shrink: 0;
          }

          .an-sheet-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 18px 10px;
            border-bottom: 1px solid #f2ede7;
            flex-shrink: 0;
          }

          .an-sheet-header h3 {
            margin: 0;
            font-size: 15.5px;
            font-weight: 800;
            color: #073B3F;
          }

          .an-sheet-close {
            border: 0;
            background: #f7f1ea;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            font-size: 13px;
            cursor: pointer;
            color: #073B3F;
          }

          .an-sheet-body {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 4px 0;
          }

          .an-sheet-footer {
            border-top: 1px solid #f2ede7;
            padding: 12px 18px;
            display: flex;
            gap: 10px;
            flex-shrink: 0;
          }

          .an-sheet-btn-ghost {
            flex: 1;
            border: 1.5px solid #ded8d1;
            background: #fff;
            border-radius: 10px;
            padding: 11px;
            font-size: 13px;
            font-weight: 700;
            color: #073B3F;
            cursor: pointer;
          }

          .an-sheet-btn-primary {
            flex: 1;
            border: 0;
            background: #073B3F;
            border-radius: 10px;
            padding: 11px;
            font-size: 13px;
            font-weight: 700;
            color: #fff;
            cursor: pointer;
          }

          /* Sort sheet — expandable groups */
          .an-sheet-group {
            border-bottom: 1px solid #f2ede7;
          }

          .an-sheet-group-head {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 0;
            background: transparent;
            padding: 14px 18px;
            font-size: 13.5px;
            font-weight: 700;
            color: #111;
            cursor: pointer;
            text-align: left;
          }

          .an-sheet-chevron {
            flex-shrink: 0;
            color: #8b551e;
            transition: transform 0.2s ease;
          }

          .an-sheet-chevron.open {
            transform: rotate(180deg);
          }

          .an-sheet-options {
            padding: 0 12px 10px;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .an-sheet-option {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 0;
            background: transparent;
            padding: 10px 12px;
            font-size: 13px;
            font-weight: 600;
            color: #333;
            border-radius: 8px;
            cursor: pointer;
            text-align: left;
          }

          .an-sheet-option:active,
          .an-sheet-option.active {
            background: #eaf1f0;
            color: #073B3F;
          }

          .an-sheet-option.active {
            font-weight: 800;
          }

          /* Filter sheet — category list */
          .an-sheet-cat-list {
            padding: 6px 8px;
          }

          .an-sheet-cat-item {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 0;
            background: transparent;
            padding: 13px 12px;
            font-size: 13.5px;
            font-weight: 700;
            color: #333;
            border-radius: 10px;
            cursor: pointer;
            text-align: left;
            border-bottom: 1px solid #f7f3ee;
          }

          .an-sheet-cat-item:active,
          .an-sheet-cat-item.active {
            background: #eaf1f0;
            color: #073B3F;
          }

          /* Navbar-styled category sidebar */
          .an-nav-cat-item {
            border-bottom: 1px solid #f2ede7;
          }
          .an-nav-cat-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2px 0;
          }
          .an-nav-cat-row.active {
            background: #f7f3ee;
            border-radius: 6px;
          }
          .an-nav-cat-title {
            flex: 1;
            border: none;
            background: transparent;
            text-align: left;
            padding: 9px 8px;
            font-size: 14px;
            font-weight: 600;
            color: #3b1812;
            cursor: pointer;
            transition: color 0.15s ease;
          }
          .an-nav-cat-title:hover,
          .an-nav-cat-title.active {
            color: #073B3F;
            font-weight: 700;
          }
          .an-nav-cat-toggle {
            border: none;
            background: transparent;
            width: 36px;
            height: 36px;
            font-size: 16px;
            font-weight: 700;
            color: #6b5048;
            display: grid;
            place-items: center;
            cursor: pointer;
            border-radius: 4px;
          }
          .an-nav-cat-toggle:hover {
            background: rgba(0,0,0,0.04);
          }
          .an-nav-sub-list {
            padding: 2px 0 8px 12px;
            display: grid;
            gap: 2px;
          }
          .an-nav-sub-item {
            border: none;
            background: transparent;
            text-align: left;
            padding: 7px 10px;
            font-size: 13px;
            font-weight: 500;
            color: #555;
            cursor: pointer;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.15s ease;
          }
          .an-nav-sub-item:hover,
          .an-nav-sub-item:active {
            background: #f4ede6;
            color: #073B3F;
          }
          .an-nav-sub-item.active {
            background: #073B3F;
            color: #fff;
            font-weight: 700;
          }
          .an-nav-sub-item.active .an-nav-sub-check {
            color: #fff;
          }
          .an-nav-sub-check {
            color: #073B3F;
            font-weight: 900;
            font-size: 13px;
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

          /* Mobile-only horizontal category rail — hidden on desktop, where
             the sidebar list in .an-filter already covers this job. */
          .an-cat-rail-mobile {
            display: none;
          }

          .an-cat-rail {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding: 6px 2px 12px;
          }

          .an-cat-rail::-webkit-scrollbar {
            display: none;
          }

          .an-cat-rail-item {
            flex: 0 0 auto;
            width: 70px;
            border: 0;
            background: transparent;
            cursor: pointer;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.25;
            letter-spacing: 0.1px;
            color: #453b30;
          }

          .an-cat-rail-frame {
            display: grid;
            place-items: center;
            width: 66px;
            height: 66px;
            border-radius: 50%;
            background: #f7f1ea;
            margin: 0 auto 7px;
            box-shadow: 0 6px 16px rgba(92,66,41,.10);
            border: 1.5px solid #f0e6d8;
            color: #8b551e;
            transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          }

          .an-cat-rail-item img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }

          .an-cat-rail-item:active .an-cat-rail-frame {
            transform: scale(0.96);
          }

          .an-cat-rail-item.active .an-cat-rail-frame {
            border-color: #073B3F;
            background: #eaf1f0;
            box-shadow: 0 8px 20px rgba(7,59,63,0.16);
            transform: translateY(-2px);
          }

          .an-cat-rail-item.active {
            color: #073B3F;
          }

          .an-products {
            display: flex;
            flex-wrap: wrap;
            justify-content: start;
            gap: clamp(22px, 2.2vw, 34px);
            margin-top: 30px;
            align-items: start;
          }

          .an-load-more-sentinel {
            width: 100%;
            min-height: 40px;
            margin-top: 20px;
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
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
          background: #fff;
          font-weight: 900;
        }

        .an-empty p {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: #333;
          text-align: center;
        }

        .an-empty-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .an-empty-tags span {
          background: #f7f1ea;
          color: #8b551e;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .an-empty-clear {
          border: 0;
          background: #073B3F;
          color: #fff;
          border-radius: 999px;
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
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
            .an-products { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }
          }

          /* index.css has a global safety net that forces .an-layout to a single
             column starting at 1180px, wider than this page's own 820px mobile
             breakpoint below. Without this, the quick-filter pills keep their
             desktop flex-wrap between 820px-1180px and wrap into a broken
             2-line grid instead of a scrollable row. */
          @media (max-width: 1180px) {
            /* Below 1180px the desktop pill row is replaced entirely by the
               Sort | Filter bar + bottom sheets — switching both at the
               same breakpoint index.css's layout collapse uses avoids
               re-creating the gap-zone bug fixed above. */
            .an-quick-filters {
              display: none !important;
            }
            .an-sort-filter-bar-mobile {
              display: block;
              position: sticky;
              top: 50px;
              z-index: 30;
              background: #fff;
              padding-top: 8px;
              padding-bottom: 8px;
            }

            /* Same gap as above: index.css collapses .an-layout to a single
               column at 1180px, but .an-products' own 2-column override
               below was gated behind the narrower 820px breakpoint, so
               products rendered as one full-width column in between. */
            .an-products {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
            .an-product-card {
              flex: none !important;
              width: 100% !important;
              min-width: 0 !important;
            }
          }

          @media (max-width: 820px) {
            .an-shell { width: min(100% - 16px, 100%); padding: 0 4px; }
            .an-layout { grid-template-columns: 1fr; padding: 10px 0 20px; gap: 10px; }
            .an-right-rail { display: none; }
            .an-cat-rail-mobile { display: block; }

            /* Replaced by the Filter bottom sheet (SortFilterBar) — the old
               inline accordion this bar toggled is no longer reachable on
               mobile, so the bar itself stays hidden. Rules below it are
               now dead but left in place in case .an-filter-wrap needs the
               inline accordion again on some future breakpoint. */
            .an-mobile-filter-bar {
              display: none;
              align-items: center;
              justify-content: space-between;
              width: 100%;
              padding: 12px 16px;
              background: #fff;
              border: 1.5px solid #ded8d1;
              border-radius: 12px;
              font-size: 13.5px;
              font-weight: 700;
              color: #073B3F;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(7,31,34,0.04);
              margin-bottom: 8px;
              transition: all 0.2s ease;
            }
            .an-mobile-filter-bar:active {
              background: #f7faf9;
            }
            .an-mobile-filter-bar-left {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .an-mobile-filter-tag {
              color: #8b551e;
              font-weight: 800;
              text-transform: capitalize;
              font-size: 12.5px;
            }
            .an-mobile-filter-caret {
              font-size: 11px;
              color: #073B3F;
            }

            /* Inline accordion expansion on mobile — clean in-page expansion */
            .an-filter.an-filter-mobile-closed {
              display: none !important;
            }
            .an-filter.an-filter-mobile-open {
              display: block !important;
              position: static !important;
              width: 100% !important;
              max-height: none !important;
              background: #fff !important;
              border: 1.5px solid #ded8d1 !important;
              border-radius: 14px !important;
              padding: 12px 14px !important;
              margin-bottom: 14px !important;
              box-shadow: 0 4px 14px rgba(7,31,34,0.05) !important;
              animation: inlineFadeDown 0.2s ease-out !important;
            }
            @keyframes inlineFadeDown {
              from { opacity: 0; transform: translateY(-6px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .an-filter-heading {
              font-size: 15px;
              margin: 0 0 10px;
              color: #073B3F;
              font-weight: 800;
              border-bottom: 1px solid #f2ede7;
              padding-bottom: 8px;
            }

            .an-main-head {
              grid-template-columns: 1fr;
              gap: 6px;
              margin: 4px 0 10px;
            }
            .an-title h1 {
              font-size: 20px;
            }
            .an-title-mark {
              width: 110px;
              height: 8px;
              margin: 4px 0;
            }
            .an-title p {
              font-size: 12px;
            }
            .an-breadcrumb {
              font-size: 11.5px;
              margin-bottom: 2px;
            }

            /* Replaced by SortFilterBar (.an-sort-filter-bar-mobile) below
               1180px — stays hidden here (rule below the 1180px hide would
               otherwise win the cascade tie and re-show it). */
            .an-quick-filters {
              display: none !important;
            }
            .an-qf-dropdown {
              flex-shrink: 0;
              position: relative;
            }
            .an-qf-toggle {
              white-space: nowrap !important;
              padding: 7px 13px !important;
              font-size: 12px !important;
              border-radius: 999px !important;
            }
            .an-qf-reset-btn {
              flex-shrink: 0;
              padding: 7px 12px !important;
              font-size: 11.5px !important;
            }
            /* Normal dropdown positioned right below the pill on mobile — NEVER covers full page */
            .an-qf-panel {
              position: fixed !important;
              right: auto !important;
              bottom: auto !important;
              width: max-content !important;
              min-width: 160px !important;
              max-width: 240px !important;
              max-height: 280px !important;
              overflow-y: auto !important;
              background: #fff !important;
              border: 1px solid #ded8d1 !important;
              border-radius: 10px !important;
              box-shadow: 0 8px 24px rgba(7,31,34,0.18) !important;
              padding: 5px !important;
              z-index: 1000 !important;
              animation: qfFadeIn 0.15s ease-out !important;
            }
            .an-qf-option-btn {
              padding: 10px 12px !important;
              font-size: 13px !important;
            }

            /* Category Tiles Grid */
            .an-category-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }
            .an-category-card {
              min-height: 120px !important;
              padding: 8px 6px !important;
            }
            .an-category-card img {
              width: 58px !important;
              height: 58px !important;
              margin-bottom: 4px !important;
            }
            .an-category-card strong {
              font-size: 12px !important;
            }
            .an-category-card span {
              font-size: 10px !important;
            }

            /* Metal Banner */
            .an-metal-banner {
              grid-template-columns: 1fr;
              min-height: 100px !important;
              padding: 14px 16px !important;
              margin-bottom: 12px !important;
              border-radius: 10px !important;
            }
            .an-banner-title {
              font-size: 19px !important;
              margin-bottom: 4px !important;
            }
            .an-banner-sub {
              font-size: 12px !important;
            }
            .an-banner-badges {
              display: none;
            }

            /* 2-Column Responsive Product Grid */
            .an-products {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 8px !important;
              margin-top: 12px !important;
              width: 100% !important;
            }
            .an-product-card {
              flex: none !important;
              width: 100% !important;
              min-width: 0 !important;
              border-radius: 10px !important;
              border: 1px solid #eadfd3 !important;
              overflow: hidden !important;
              background: #fff !important;
              display: flex !important;
              flex-direction: column !important;
              box-shadow: 0 4px 12px rgba(92,66,41,.06) !important;
            }
            .an-product-image {
              position: relative !important;
              width: 100% !important;
              aspect-ratio: 1 / 1 !important;
              min-height: unset !important;
              max-height: unset !important;
              height: auto !important;
              background: #fbf4eb !important;
              overflow: hidden !important;
              display: block !important;
            }
            .an-product-image img {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              display: block !important;
            }
            .an-heart {
              right: 8px !important;
              top: 8px !important;
              width: 26px !important;
              height: 26px !important;
              font-size: 20px !important;
            }
            .an-product-body {
              padding: 8px 8px 10px !important;
              display: flex !important;
              flex-direction: column !important;
              flex: 1 !important;
            }
            .an-product-body h3 {
              font-size: 12px !important;
              font-weight: 700 !important;
              margin: 0 0 3px !important;
              line-height: 1.22 !important;
              min-height: 29px !important;
              display: -webkit-box !important;
              -webkit-line-clamp: 2 !important;
              -webkit-box-orient: vertical !important;
              overflow: hidden !important;
            }
            .an-product-body p {
              font-size: 10.5px !important;
              margin: 0 0 4px !important;
              color: #666 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            .an-product-body strong {
              font-size: 13.5px !important;
              font-weight: 800 !important;
              color: #111 !important;
              margin-top: auto !important;
            }
            .an-rating {
              margin-top: 5px !important;
              font-size: 10.5px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
            }
            .an-rating span {
              font-size: 10px !important;
            }
            .an-rating small {
              font-size: 9.5px !important;
            }
            .an-rating button {
              width: 26px !important;
              height: 26px !important;
            }

            [data-subsection] h2 {
              font-size: 18px !important;
              margin-bottom: 10px !important;
            }
            .an-skeleton-img {
              aspect-ratio: 1 / 1 !important;
              min-height: unset !important;
              width: 100% !important;
            }
            .an-skeleton-card {
              border-radius: 10px !important;
            }
          }

          @media (max-width: 440px) {
            .an-category-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }
            .an-products {
              gap: 6px !important;
            }
            .an-product-body {
              padding: 6px 6px 8px !important;
            }
            .an-product-body h3 {
              font-size: 11.5px !important;
            }
            .an-product-body strong {
              font-size: 13px !important;
            }
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
                    onSelect={onSelectGender}
                  />
                  <QuickFilterDropdown
                    label="Age"
                    options={getAgeOptionsForGender(genderFilter)}
                    currentValue={ageFilter}
                    onSelect={(val) => updateFilterParam('age', val)}
                  />
                  <QuickFilterDropdown
                    label="Occasion"
                    options={OCCASION_OPTIONS}
                    currentValue={occasionFilter}
                    onSelect={(val) => updateFilterParam('occasion', val)}
                  />
                  {(priceFilter || genderFilter || ageFilter || occasionFilter) && (
                    <button
                      type="button"
                      className="an-qf-reset-btn"
                      onClick={onResetQuickFilters}
                      title="Clear all quick filters"
                    >
                      Reset All ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Deliberately OUTSIDE .an-main-head — position:sticky only
                  holds an element within its own parent's box, and
                  .an-main-head is short (just the title/breadcrumb row), so
                  the bar would stop sticking and scroll away the moment the
                  page scrolled past that block. .an-content spans the whole
                  product listing, so the bar now stays stuck the entire
                  time the user is scrolling through products. */}
              <div className="an-sort-filter-bar-mobile">
                <SortFilterBar
                  priceFilter={priceFilter}
                  genderFilter={genderFilter}
                  ageFilter={ageFilter}
                  occasionFilter={occasionFilter}
                  onSelectPrice={(val) => updateFilterParam('price', val)}
                  onSelectGender={onSelectGender}
                  onSelectAge={(val) => updateFilterParam('age', val)}
                  onSelectOccasion={(val) => updateFilterParam('occasion', val)}
                  onResetQuickFilters={onResetQuickFilters}
                  activeFilterTag={sheetActiveFilterTag}
                  navigate={navigate}
                  filterPageRoute={`${isGifting ? '/collection/gifting' : '/collection/all'}/filter${location.search}`}
                />
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


