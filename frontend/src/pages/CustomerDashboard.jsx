import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import CustomerFooter from "../collection/CustomerFooter";
import { addToCartDB } from "../collection/card_section";
import "./CustomerLandingRef.css";

const API_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const heroGoldNewsItems = [
  {
    icon: "UP",
    title: "Gold prices rise for the 3rd consecutive day in Tamil Nadu",
    time: "2 mins ago",
  },
  {
    icon: "RBI",
    title: "RBI keeps interest rates unchanged - Impact on gold prices",
    time: "1 hour ago",
  },
  {
    icon: "BIS",
    title: "Hallmarking rules updated by BIS - What you need to know",
    time: "3 hours ago",
  },
  {
    icon: "TN",
    title: "Wedding season demand boosts gold sales in TN",
    time: "5 hours ago",
  },
];

function resolveImage(image) {
  if (!image) return null;
  if (typeof image === "object") {
    image = image.image || image.url || image.src || "";
  }
  if (typeof image !== "string") return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${API_ORIGIN}/${image.replace(/^\/+/, "")}`;
}

function safeText(value, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.slug ||
      value.label ||
      value.value ||
      fallback
    );
  }
  return fallback;
}

function slugText(value, fallback = "all") {
  return safeText(value, fallback)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") || fallback;
}

function money(value, maximumFractionDigits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹ 0";
  return `₹ ${n.toLocaleString("en-IN", { maximumFractionDigits })}`;
}

/* ==========================================================================
   PRESERVED HOME / HERO BANNER SLIDER & GOLD NEWS POPOVER
   ========================================================================== */
function getCoinMetalValue(grams, metal, rates) {
  const field = metal === 'gold' ? 'gold_22k' : metal === 'silver' ? 'silver_999' : null
  const rate = field ? Number(rates?.[field]) : NaN
  const weight = Number(grams)
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(weight) || weight <= 0) {
    return null
  }
  return { rate, price: Math.round(rate * weight) }
}

function HomeBannerSlider() {
  const [banners, setBanners] = useState([]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [newsPinned, setNewsPinned] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get("/home-banners/")
      .then((res) => {
        if (!alive || !Array.isArray(res.data)) return;
        setBanners(
          res.data
            .filter((b) => b.is_active !== false)
            .sort((a, b) => a.slot - b.slot),
        );
      })
      .catch(() => { })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const activeRef = useRef(active);
  activeRef.current = active;

  const goTo = (next) => {
    setActive(-1);
    setTimeout(() => setActive(next), 360);
  };

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = setInterval(() => {
      const current = activeRef.current === -1 ? 0 : activeRef.current;
      goTo((current + 1) % banners.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loaded && !banners.length) return null;

  return (
    <div className="store-banner">
      {!loaded && <div className="store-banner-skeleton" />}
      {banners.map((banner, index) => (
        <img
          key={banner.id || banner.slot}
          src={resolveImage(banner.image)}
          alt=""
          className={index === active ? "active" : ""}
        />
      ))}
      {banners.length > 1 && (
        <div className="store-dots">
          {banners.map((banner, index) => (
            <button
              key={banner.id || banner.slot}
              type="button"
              className={index === active ? "active" : ""}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
      {newsPinned && (
        <div
          className="hero-news-mobile-backdrop"
          onClick={() => setNewsPinned(false)}
        />
      )}
      <div className={`hero-news-popover ${newsPinned ? "open" : ""}`}>
        <button
          className="hero-news-trigger"
          type="button"
          aria-expanded={newsPinned}
          onClick={() => setNewsPinned((open) => !open)}
        >
          <span className="hero-news-trigger-dot" />
          Gold News
        </button>
        <aside className="hero-news-card" aria-label="Gold news updates">
          <div className="hero-news-card-top">
            <span>
              <i /> Live
            </span>
            <strong>Tamil Nadu</strong>
            <button
              type="button"
              className="hero-news-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setNewsPinned(false);
              }}
              aria-label="Close news"
            >
              ✕
            </button>
          </div>
          <h2>Gold News</h2>
          <p>Stay updated with the latest gold market news from Tamil Nadu</p>
          <div className="hero-news-card-list">
            {heroGoldNewsItems.map((item) => (
              <article className="hero-news-card-item" key={item.title}>
                <span className="hero-news-card-icon">{item.icon}</span>
                <span>
                  <strong>{item.title}</strong>
                  <em>{item.time}</em>
                </span>
              </article>
            ))}
          </div>
          <button
            className="hero-news-view-all"
            type="button"
            onClick={() => setNewsPinned(false)}
          >
            Close Updates
          </button>
        </aside>
      </div>
    </div>
  );
}

/* ==========================================================================
   EXACT REFERENCE ASSETS & METADATA FOR 8 SECTIONS
   ========================================================================== */
const CATEGORIES = [
  { id: "necklaces", label: "Necklaces", route: "/collection/necklaces", image: "/rail/cutouts/necklace.png" },
  { id: "earrings", label: "Earrings", route: "/collection/earrings", image: "/rail/cutouts/gold-earrings.png" },
  { id: "bangles", label: "Bangles", route: "/collection/bangles", image: "/rail/cutouts/gold-bangles.png" },
  { id: "rings", label: "Rings", route: "/collection/rings", image: "/rail/cutouts/gold-rings.png" },
  { id: "coins", label: "Coins", route: "/collection/coins", image: "/rail/cutouts/gold-coins.png" },
  { id: "mangalsutra", label: "Mangalsutra", route: "/collection/all?category=mangalsutra", image: "/rail/cutouts/gold-mangalsutra.png" },
  { id: "bracelets", label: "Bracelets", route: "/collection/bracelets", image: "/rail/cutouts/gold-bracelets.png" },
  { id: "anklets", label: "Anklets", route: "/collection/all?category=anklets", image: "/rail/cutouts/silver-anklets.png" },
];

const MARQUEE_CATEGORIES = [...CATEGORIES, ...CATEGORIES];

const GOLD_COIN_TOUR = [
  { weight: "50mg",  grams: 0.05, label: "50 Milligram",  desc: "Pocket Micro-Savings",       image: "/rail/gold-50mg.png",   purity: "22K 916 Gold", highlight: "Micro Start" },
  { weight: "100mg", grams: 0.1,  label: "100 Milligram", desc: "Auspicious Shagun",          image: "/rail/gold-100mg.png",  purity: "22K 916 Gold", highlight: "Gifting Choice" },
  { weight: "200mg", grams: 0.2,  label: "200 Milligram", desc: "Smart Gold Accumulator",     image: "/rail/gold-200mg.png",  purity: "22K 916 Gold" },
  { weight: "500mg", grams: 0.5,  label: "500 Milligram", desc: "Half Gram Investment",       image: "/rail/gold-500mg.png",  purity: "22K 916 Gold", highlight: "Trending" },
  { weight: "1g",    grams: 1.0,  label: "1 Gram",        desc: "22K Gold Coin",      image: "/rail/gold-1g.png",     purity: "22K 916 Gold", highlight: "Best Seller" },
  { weight: "2g",    grams: 2.0,  label: "2 Grams",       desc: "Double Weight Asset",        image: "/rail/gold-2g.png",     purity: "22K 916 Gold" },
  { weight: "4g",    grams: 4.0,  label: "4 Grams",       desc: "Half Sovereign Value",       image: "/rail/gold-4g.png",     purity: "22K 916 Gold" },
  { weight: "8g",    grams: 8.0,  label: "8 Grams",       desc: "1 Sovereign (1 Pavan)",     image: "/rail/gold-8g.png",     purity: "22K 916 Gold", highlight: "Royal Sovereign" },
];

const SILVER_COIN_TOUR = [
  { weight: "250mg", grams: 0.25, label: "250 Milligram", desc: "Pure Silver Shagun",         image: "/rail/silver-250mg.png", purity: "999 Fine Silver", highlight: "Affordable Gift" },
  { weight: "500mg", grams: 0.5,  label: "500 Milligram", desc: "Auspicious Pooja Coin",      image: "/rail/silver-500mg.png", purity: "999 Fine Silver" },
  { weight: "1g",    grams: 1.0,  label: "1 Gram",        desc: "Fine 999 Silver Coin",       image: "/rail/silver-1g.png",    purity: "999 Fine Silver", highlight: "Popular" },
  { weight: "2g",    grams: 2.0,  label: "2 Grams",       desc: "Double Weight Silver",       image: "/rail/silver-2g.png",    purity: "999 Fine Silver" },
  { weight: "5g",    grams: 5.0,  label: "5 Grams",       desc: "Prosperity Shubh Coin",     image: "/rail/silver-5g.png",    purity: "999 Fine Silver", highlight: "Trending" },
  { weight: "10g",   grams: 10.0, label: "10 Grams",      desc: "Temple Kalash Silver",      image: "/rail/silver-10g.png",   purity: "999 Fine Silver", highlight: "Best Value" },
];

const GOLD_COIN_WEIGHTS   = ["50mg",  "100mg", "200mg", "500mg", "1g", "2g", "4g", "8g"];
const SILVER_COIN_WEIGHTS = ["250mg", "500mg", "1g",    "2g",    "5g", "10g"];

const OCCASIONS = [
  {
    label: "Wedding",
    sub: "For the day your forever begins.",
    edit: "THE FOREVER EDIT",
    action: "Shop Wedding",
    route: "/collection/all?wedding=true",
    image: "/occasion-wedding.png",
  },
  {
    label: "Casual",
    sub: "A little sparkle for your everyday joys.",
    edit: "THE EVERYDAY EDIT",
    action: "Shop Everyday",
    route: "/collection/all?dailywear=true",
    image: "/occasion-casual.png",
  },
  {
    label: "Modern",
    sub: "A little bold. Entirely you.",
    edit: "THE STYLE EDIT",
    action: "Shop Modern",
    route: "/collection/all?occasion=Modern Wear",
    image: "/occasion-modern.png",
  },
  {
    label: "Traditional",
    sub: "The traditions you carry close.",
    edit: "THE HERITAGE EDIT",
    action: "Shop Heritage",
    route: "/collection/all?occasion=Traditional Wear",
    image: "/occasion-traditional.png",
  },
];

const GENDERS = [
  {
    eyebrow: "FOR EVERY STYLE •",
    title: "Women",
    sub: "Grace in every detail",
    route: "/collection/all?gender=women",
    image: "/gender-women-banner.jpg",
  },
  {
    eyebrow: "FOR EVERY MOMENT •",
    title: "Men",
    sub: "Strength in style",
    route: "/collection/all?gender=men",
    image: "/gender-men-banner.jpg",
  },
  {
    eyebrow: "FOR THEIR LITTLE JOYS •",
    title: "Kids",
    sub: "Little moments, big smiles",
    route: "/collection/all?gender=kids",
    image: "/gender-kids-banner.jpg",
  },
];

const TRUST_BENEFITS = [
  {
    label: "100% Certified Jewellery",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Secure Payments",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    label: "Easy Returns",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M3 22v-6h6" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      </svg>
    ),
  },
  {
    label: "Insured Shipping",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    label: "24/7 Customer Support",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    author: "Sneha R.",
    quote: "Absolutely loved the quality and packaging. Authentic and beautiful jewellery. Will definitely shop again!",
    avatar: "/dailywear_woman.jpg",
  },
  {
    author: "Priya M.",
    quote: "The live rate transparency and hallmarked purity gives complete peace of mind. Excellent customer experience!",
    avatar: "/dailywear_woman.jpg",
  },
  {
    author: "Ananya K.",
    quote: "Stunning craftsmanship and timely insured delivery. The temple jewellery collection exceeded all expectations.",
    avatar: "/dailywear_woman.jpg",
  },
];

/* 9 Requested Fast Moving Product Types with Exact Reference Cutout Artwork */


/* ==========================================================================
   MAIN COMPONENT: CUSTOMER DASHBOARD
   ========================================================================== */
export default function CustomerDashboard() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const catRailRef = useRef(null);
  const productsTrackRef = useRef(null);
  const coinTourRef = useRef(null);

  const [fastMovingData, setFastMovingData] = useState([]);
  const [fastMovingLoading, setFastMovingLoading] = useState(true);
  const [loadedProductImages, setLoadedProductImages] = useState(new Set());
  const [fastMovingError, setFastMovingError] = useState(false);
  const [coinTourMetal, setCoinTourMetal] = useState("gold");
  const [rates, setRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [wishIds, setWishIds] = useState(new Set());
  const [cartAddedId, setCartAddedId] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    let pending = false;
    async function loadProducts() {
      if (pending) return;
      pending = true;
      try {
        const response = await api.get("/jewelry-products/fast-moving/");
        const raw = response.data;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
        const seen = new Set();
        const available = list.filter(product => {
          if (product.is_active !== true || Number(product.stock_quantity) <= 0
            || !Number.isFinite(Number(product.stock_quantity)) || seen.has(product.id)) return false;
          seen.add(product.id);
          return true;
        }).slice(0, 10);
        if (alive) {
          setFastMovingData(available);
          setFastMovingError(false);
        }
      } catch {
        if (alive) {
          setFastMovingData([]);
          setFastMovingError(true);
        }
      } finally {
        pending = false;
        if (alive) setFastMovingLoading(false);
      }
    }
    // Wishlist latency must not delay the product cards.
    if (localStorage.getItem("token")) {
      api.get("/wishlist/").then(response => {
        if (!alive) return;
        const items = Array.isArray(response.data?.items) ? response.data.items
          : Array.isArray(response.data) ? response.data : [];
        setWishIds(new Set(items.map(item => item.product_id || item.product)));
      }).catch(() => {});
    }
    const refreshVisible = () => {
      if (document.visibilityState === "visible") loadProducts();
    };
    loadProducts();
    const timer = setInterval(refreshVisible, 20000);
    window.addEventListener("focus", loadProducts);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", loadProducts);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, []);

  // Fetch rates independently so a slow catalogue request cannot delay prices.
  useEffect(() => {
    let alive = true;
    let pending = false;
    async function loadRates() {
      if (pending) return;
      pending = true;
      try {
        const response = await api.get("/metal-rates/");
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        if (alive) setRates(data || null);
      } catch {
        if (alive) setRates(null);
      } finally {
        pending = false;
        if (alive) setRatesLoading(false);
      }
    }
    loadRates();
    const timer = setInterval(loadRates, 45000);
    window.addEventListener("focus", loadRates);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", loadRates);
    };
  }, []);

  const getCoinPrice = (item, metal) => getCoinMetalValue(item.grams, metal, rates);
  const rateDate = rates?.date && /^\d{4}-\d{2}-\d{2}$/.test(rates.date)
    ? new Date(`${rates.date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    })
    : null;

  const scrollCoinTour = (dir) => {
    const track = coinTourRef.current;
    if (!track) return;
    const card = track.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0) : track.clientWidth;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: dir === "right" ? step : -step, behavior: reducedMotion ? "instant" : "smooth" });
  };

  const goldStartingValue = getCoinPrice(GOLD_COIN_TOUR[0], "gold");
  const silverStartingValue = getCoinPrice(SILVER_COIN_TOUR[0], "silver");
  const goldStartingPrice = goldStartingValue ? money(goldStartingValue.price) : null;
  const silverStartingPrice = silverStartingValue ? money(silverStartingValue.price) : null;

  const fastMovingProducts = useMemo(() => fastMovingData.map((product) => ({
    id: product.id,
    displayTitle: safeText(product.name, "Jewellery"),
    category: product.category,
    metal: product.metal,
    price: product.live_price == null ? null : Number(product.live_price),
    priceLabel: product.price_source === "live_rate" ? "Current rate price" : "Price",
    metalLabel: [safeText(product.grade).toUpperCase(), safeText(product.metal)].filter(Boolean).join(" / "),
    image: resolveImage(product.images?.[0] || product.image),
    salesLabel: product.sales_group === "new_arrival" ? "New Arrival" : "Customer Favourite",
  })), [fastMovingData]);

  const requireLogin = (route = "") => {
    if (isLoggedIn) return false;
    navigate(route ? `/register?redirect=${encodeURIComponent(route)}` : "/register");
    return true;
  };

  const openProduct = (item) => {
    navigate(
      `/product-display?category=${slugText(item.category)}&metal=${slugText(item.metal)}&id=${item.id}`,
    );
  };

  const toggleWishlist = async (item, e) => {
    if (e) e.stopPropagation();
    if (requireLogin()) return;
    const prodId = item.id;
    try {
      await api.post("/wishlist/", { product: prodId });
      setWishIds((prev) => new Set([...prev, prodId]));
      window.dispatchEvent(new Event("bb_wishlist_update"));
    } catch {
      try {
        await api.delete("/wishlist/", { data: { product: prodId } });
        setWishIds((prev) => {
          const next = new Set(prev);
          next.delete(prodId);
          return next;
        });
        window.dispatchEvent(new Event("bb_wishlist_update"));
      } catch { }
    }
  };

  const handleAddToCart = async (item, e) => {
    if (e) e.stopPropagation();
    if (requireLogin()) return;
    try {
      await addToCartDB(item.id, 1);
      setCartAddedId(item.id);
      setTimeout(() => setCartAddedId(null), 1800);
    } catch (err) {
      console.error("Add to cart error:", err);
    }
  };

  const scrollRail = (ref, dir) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir * 400, behavior: "smooth" });
    }
  };

  /* Auto-glide: category rail scrolls left-to-right, loops back */
  useEffect(() => {
    const el = catRailRef.current;
    if (!el) return;
    let paused = false;
    const glide = setInterval(() => {
      if (paused) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 220, behavior: "smooth" });
      }
    }, 3200);
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    return () => {
      clearInterval(glide);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
    };
  }, []);

  /* Auto-glide: products track scrolls left-to-right, loops back */
  useEffect(() => {
    const el = productsTrackRef.current;
    if (!el) return;
    let paused = false;
    const glide = setInterval(() => {
      if (paused) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 260, behavior: "smooth" });
      }
    }, 3800);
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    return () => {
      clearInterval(glide);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
    };
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newsletterEmail || !emailRegex.test(newsletterEmail.trim())) {
      setNewsletterStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }
    setNewsletterStatus({
      type: "success",
      message: "Thank you for subscribing to Athirai Circle!",
    });
    setNewsletterEmail("");
    setTimeout(() => setNewsletterStatus(null), 5000);
  };

  return (
    <div className="storefront" style={{ minHeight: "100vh", background: "#FAF8F3" }}>
      {/* 
        PRESERVED STYLES FOR HOME BANNER SLIDER & GOLD NEWS 
      */}
      <style>{`
        .store-banner {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 6;
          overflow: visible;
          background: #D1DFDE;
          contain: layout size;
        }
        .store-banner-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #D1DFDE 25%, #e8f0ef 50%, #D1DFDE 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.6s ease-in-out infinite;
        }
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .store-banner img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          opacity: 0;
          transition: opacity 350ms ease;
          display: block;
        }
        .store-banner img.active { opacity: 1; }
        .store-dots {
          position: absolute;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 2;
        }
        .store-dots button {
          width: 8px;
          height: 8px;
          border: 0;
          border-radius: 999px;
          background: rgba(255,255,255,0.60);
          cursor: pointer;
          transition: width 200ms ease, background 200ms ease;
        }
        .store-dots button.active {
          width: 28px;
          background: #fff;
        }
        .hero-news-popover {
          position: absolute;
          top: 20px;
          right: clamp(18px, 3vw, 52px);
          z-index: 6;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .hero-news-trigger {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-height: 42px;
          padding: 0 18px;
          border: 1px solid rgba(7,59,63,0.24);
          border-radius: 999px;
          background: #064D4D;
          color: #fff;
          box-shadow: 0 14px 34px rgba(7,59,63,0.22);
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .hero-news-trigger:hover,
        .hero-news-popover.open .hero-news-trigger {
          transform: translateY(-1px);
          background: #073B3F;
          box-shadow: 0 18px 42px rgba(7,59,63,0.28);
        }
        .hero-news-trigger-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #24E985;
          box-shadow: 0 0 0 6px rgba(36,233,133,0.14);
        }
        .hero-news-card {
          width: clamp(300px, 23vw, 360px);
          max-height: min(520px, calc(100vh - 220px));
          overflow: auto;
          padding: 22px 24px 20px;
          border: 1px solid rgba(193, 134, 48, 0.72);
          border-radius: 18px;
          background: rgba(255, 251, 244, 0.96);
          color: #101817;
          box-shadow: 0 26px 70px rgba(7,59,63,0.20);
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
          pointer-events: none;
          visibility: hidden;
          transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
          backdrop-filter: blur(10px);
        }
        .hero-news-close-btn {
          display: none;
          background: rgba(7, 59, 63, 0.08);
          border: 0;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          color: #073B3F;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          place-items: center;
          margin-left: auto;
        }
        .hero-news-mobile-backdrop { display: none; }
        @media (hover: hover) and (min-width: 769px) {
          .hero-news-popover:hover .hero-news-card,
          .hero-news-popover:focus-within .hero-news-card {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
            visibility: visible;
          }
        }
        .hero-news-popover.open .hero-news-card {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
          visibility: visible;
        }
        .hero-news-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
          color: #11201F;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .hero-news-card-top span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 27px;
          padding: 0 12px;
          border-radius: 6px;
          background: #064D4D;
          color: #fff;
        }
        .hero-news-card-top i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #24E985;
        }
        .hero-news-card h2 {
          margin: 0 0 8px;
          color: #101817;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(28px, 2vw, 36px);
          line-height: 1;
          text-transform: uppercase;
          font-weight: 700;
        }
        .hero-news-card p {
          margin: 0 0 15px;
          color: #344542;
          font-size: 14px;
          line-height: 1.35;
        }
        .hero-news-card-list {
          border-top: 1px solid rgba(193, 134, 48, 0.42);
        }
        .hero-news-card-item {
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 14px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid rgba(193, 134, 48, 0.32);
        }
        .hero-news-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #064D4D;
          color: #F4C86B;
          font-size: 13px;
          font-weight: 900;
        }
        .hero-news-card-item strong {
          display: block;
          color: #121A19;
          font-size: 14px;
          line-height: 1.18;
          font-weight: 900;
        }
        .hero-news-card-item em {
          display: block;
          margin-top: 6px;
          color: #63716F;
          font-style: normal;
          font-size: 12px;
          font-weight: 800;
        }
        .hero-news-view-all {
          width: 100%;
          min-height: 48px;
          margin-top: 16px;
          border: 0;
          border-radius: 999px;
          background: #064D4D;
          color: #fff;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(7,59,63,0.16);
        }
      `}</style>

      {/* PRESERVED HOME / HERO BANNER SLIDER */}
      <HomeBannerSlider />

      <div className="ath-landing-container">
        {/* ==================================================================
            SECTION 1A — DUAL GOLD & SILVER COIN BANNERS (ATTRACTIVE TALL)
            ================================================================== */}
        <section className="ath-coin-banners-sec" aria-label="Coin Collections">
          <div className="ath-coin-banners-grid">
            {/* GOLD COIN BANNER */}
            <article
              className="ath-coin-banner-card ath-coin-banner-gold"
              onClick={() => navigate("/collection/coins?metal=gold")}
            >
              <div className="ath-coin-price-badge ath-coin-badge-gold">
                <span>{goldStartingPrice ? "Metal value from" : "Discover"}</span>
                <strong>{goldStartingPrice || "Gold coins"}</strong>
              </div>

              <div className="ath-coin-banner-art" aria-hidden="true" />
              <div className="ath-coin-banner-content">
                <span className="ath-coin-eyebrow">• PURE • CERTIFIED • BIS HALLMARKED</span>
                <h2 className="ath-coin-banner-title">22K Gold Coins</h2>
                <p className="ath-coin-banner-sub">
                  A symbol of prosperity, wealth and good fortune.
                </p>
                <div className="ath-coin-actions-row">
                  <button
                    type="button"
                    className="ath-coin-cta-btn ath-coin-cta-gold"
                    onClick={(e) => { e.stopPropagation(); navigate("/collection/coins?metal=gold"); }}
                  >
                    <span>Explore Gold Coins</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              <div className="ath-coin-chips-track">
                {GOLD_COIN_WEIGHTS.map((weight) => (
                  <button
                    key={weight}
                    type="button"
                    className="ath-coin-chip"
                    onClick={(e) => { e.stopPropagation(); navigate(`/collection/coins?metal=gold&weight=${weight}`); }}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </article>

            {/* SILVER COIN BANNER */}
            <article
              className="ath-coin-banner-card ath-coin-banner-silver"
              onClick={() => navigate("/collection/coins?metal=silver")}
            >
              <div className="ath-coin-price-badge ath-coin-badge-silver">
                <span>{silverStartingPrice ? "Metal value from" : "Discover"}</span>
                <strong>{silverStartingPrice || "Silver coins"}</strong>
              </div>

              <div className="ath-coin-banner-art" aria-hidden="true" />
              <div className="ath-coin-banner-content">
                <span className="ath-coin-eyebrow">• PURE • ELEGANT • 999 FINE SILVER</span>
                <h2 className="ath-coin-banner-title">Silver Coin Collection</h2>
                <p className="ath-coin-banner-sub">
                  Purity in every moment, value for a lifetime.
                </p>
                <div className="ath-coin-actions-row">
                  <button
                    type="button"
                    className="ath-coin-cta-btn ath-coin-cta-silver"
                    onClick={(e) => { e.stopPropagation(); navigate("/collection/coins?metal=silver"); }}
                  >
                    <span>Explore Silver Coins</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              <div className="ath-coin-chips-track">
                {SILVER_COIN_WEIGHTS.map((weight) => (
                  <button
                    key={weight}
                    type="button"
                    className="ath-coin-chip"
                    onClick={(e) => { e.stopPropagation(); navigate(`/collection/coins?metal=silver&weight=${weight}`); }}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* ==================================================================
            SECTION 1B — INTERACTIVE PURE GOLD & SILVER COIN TOUR
            ================================================================== */}
        <section className="ath-coin-tour-sec" aria-label="Gold &amp; Silver Coin Tour">
          {/* Header: Title + Metal Switcher Tabs + Arrow Nav */}
          <div className="ath-coin-tour-header">
            <div className="ath-coin-tour-copy">
              <span className="ath-sec-eyebrow">• 100% BIS CERTIFIED MINT &amp; WEALTH ASSETS •</span>
              <h2 className="ath-coin-tour-title">Gold <span>&amp;</span> Silver</h2>
              {rateDate && <p className="ath-coin-rate-date">Rates as of {rateDate}</p>}

            </div>

            <div className="ath-coin-tour-controls">
              <div className="ath-coin-metal-tabs" role="group" aria-label="Choose coin metal">
                <button
                  type="button"
                  aria-pressed={coinTourMetal === "gold"}
                  className={`ath-coin-metal-tab ${coinTourMetal === "gold" ? "active-gold" : ""}`}
                  onClick={() => { setCoinTourMetal("gold"); if (coinTourRef.current) coinTourRef.current.scrollTo({ left: 0, behavior: "smooth" }); }}
                >
                  <span className="ath-tab-dot gold-dot" />
                  <span>Gold</span>
                </button>
                <button
                  type="button"
                  aria-pressed={coinTourMetal === "silver"}
                  className={`ath-coin-metal-tab ${coinTourMetal === "silver" ? "active-silver" : ""}`}
                  onClick={() => { setCoinTourMetal("silver"); if (coinTourRef.current) coinTourRef.current.scrollTo({ left: 0, behavior: "smooth" }); }}
                >
                  <span className="ath-tab-dot silver-dot" />
                  <span>Silver</span>
                </button>
              </div>

              <div className="ath-coin-tour-arrows">
                <button type="button" className="ath-coin-nav-btn" onClick={() => scrollCoinTour("left")} aria-label="Previous Coin">‹</button>
                <button type="button" className="ath-coin-nav-btn" onClick={() => scrollCoinTour("right")} aria-label="Next Coin">›</button>
              </div>
            </div>
          </div>

          {/* Coin Slider Track */}
          <div className="ath-coin-tour-track-wrap">
            <div className="ath-coin-tour-track" ref={coinTourRef} tabIndex={0} aria-label={`${coinTourMetal} coin denominations`}>
              {(coinTourMetal === "gold" ? GOLD_COIN_TOUR : SILVER_COIN_TOUR).map((item, index) => {
                const coinPrice = getCoinPrice(item, coinTourMetal);
                return (
                  <article
                    key={`${coinTourMetal}-${item.weight}`}
                    className={`ath-coin-tour-card ${coinTourMetal === "gold" ? "gold-card" : "silver-card"}`}
                    style={{ "--coin-delay": `${index * -0.55}s` }}
                    onClick={() => navigate(`/collection/coins?metal=${coinTourMetal}&weight=${item.weight}`)}
                  >


                    <div className="ath-coin-tour-img-wrap">
                      <div className="ath-coin-aura" />
                      <span className="ath-coin-cutout">
                        <img
                          src={item.image}
                          alt={`${item.label} ${coinTourMetal} coin`}
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = coinTourMetal === "gold" ? "/rail/cutouts/gold-coins.png" : "/rail/silver-coins.png";
                          }}
                        />
                      </span>
                    </div>

                    <div className="ath-coin-tour-meta">
                      <span className="ath-coin-tour-purity">{item.purity}</span>
                      <h3 className="ath-coin-tour-weight">{item.label}</h3>
                      <p className="ath-coin-tour-desc">{item.desc}</p>

                      <div className="ath-coin-tour-footer">
                        <div className="ath-coin-tour-price-box">
                          <span className="ath-coin-price-label">Metal value</span>
                          <strong className="ath-coin-tour-price">{coinPrice ? money(coinPrice.price) : ratesLoading ? "Loading rate..." : "Rate unavailable"}</strong>
                        </div>
                        {coinPrice && <span className="ath-coin-unit-rate">{money(coinPrice.rate, 2)} / gram</span>}
                        <button
                          type="button"
                          className="ath-coin-tour-buy-btn"
                          aria-label={`Shop ${item.label} ${coinTourMetal} coins`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/collection/coins?metal=${coinTourMetal}&weight=${item.weight}`);
                          }}
                        >
                          <span>{coinPrice ? "Buy coin" : "Explore coins"}</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 2 — SHOP BY CATEGORY (PROMINENT CIRCLES & TILES)
            ================================================================== */}
        <section className="ath-category-sec" aria-label="Shop by Category">
          <div className="ath-sec-header-center">
            <span className="ath-sec-eyebrow">FIND YOUR PERFECT PIECE</span>
            <h2 className="ath-sec-title">Shop by Category</h2>
            <p className="ath-sec-subtitle ath-section-intro">
              Find your favourites, <em>wear them your way.</em>
            </p>
          </div>

          <div className="ath-category-marquee-wrap">
            <div className="ath-category-marquee-track">
              {MARQUEE_CATEGORIES.map((cat, idx) => (
                <button
                  key={`${cat.id}-${idx}`}
                  type="button"
                  className="ath-category-card"
                  onClick={() => navigate(cat.route)}
                >
                  <span className="ath-category-circle">
                    <img src={cat.image} alt={cat.label} loading="lazy" />
                  </span>
                  <span className="ath-category-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ==================================================================
          SECTION 3 — FAST MOVING PRODUCTS (FULL-WIDTH EMERALD SHOWCASE)
          ================================================================== */}
      <section className="ath-fast-moving-sec" aria-label="Fast Moving Products">
        <div className="ath-landing-container">
          <div className="ath-fast-moving-layout">
            {/* Left Copy & Shop All CTA */}
            <div className="ath-fast-moving-copy">
              <span className="ath-fast-moving-eyebrow">• TRENDING NOW •</span>
              <h2 className="ath-fast-moving-title">Fast Moving Products</h2>
              <p className="ath-fast-moving-sub">
                Recent favourites, past bestsellers &amp; new arrivals.
              </p>
              <button
                type="button"
                className="ath-shop-all-btn"
                onClick={() => navigate("/collection/all")}
              >
                <span>Shop All</span>
                <span>→</span>
              </button>
            </div>

            {/* Right Product Cards Track - Infinite Seamless Loop */}
            <div className="ath-products-marquee-wrap">
              {fastMovingLoading && !fastMovingProducts.length && (
                <div className="ath-fast-skeleton-track" role="status" aria-label="Loading fast moving products" aria-busy="true">
                  {Array.from({ length: 10 }, (_, index) => (
                    <div className="ath-product-card ath-fast-skeleton" key={index} aria-hidden="true">
                      <div className="ath-skeleton-block ath-skeleton-media" />
                      <div className="ath-skeleton-block ath-skeleton-name" />
                      <div className="ath-skeleton-block ath-skeleton-price" />
                      <div className="ath-skeleton-block ath-skeleton-action" />
                    </div>
                  ))}
                </div>
              )}
              {!fastMovingLoading && !fastMovingProducts.length && (
                <p className="ath-products-status" role="status">
                  {fastMovingError ? "Products could not be loaded. Please try again shortly."
                    : "New pieces are on their way. Explore our collections."}
                </p>
              )}
              <div className="ath-products-marquee-track">
                {[...fastMovingProducts, ...fastMovingProducts].map((item, idx) => {
                  const isWish = wishIds.has(item.id);
                  const isAdded = cartAddedId === item.id;

                  return (
                    <article
                      key={`${item.id}-${idx}`}
                      className="ath-product-card"
                      onClick={() => openProduct(item)}
                      tabIndex={0}
                      role="link"
                      aria-label={`View ${item.displayTitle}`}
                      onKeyDown={event => {
                        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          openProduct(item);
                        }
                      }}
                    >
                      <div className={`ath-product-img-wrap ${loadedProductImages.has(item.image || "/logo.png") ? "" : "is-loading"}`}>
                        <span className="ath-product-image-badge">{item.salesLabel}</span>
                        <span className="ath-product-stock"><i aria-hidden="true" />In stock</span>
                        <button
                          type="button"
                          className={`ath-wishlist-btn ${isWish ? "active" : ""}`}
                          aria-label="Save to Wishlist"
                          onClick={(e) => toggleWishlist(item, e)}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill={isWish ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z" />
                          </svg>
                        </button>
                        <img
                          src={item.image || "/logo.png"}
                          alt={item.image ? item.displayTitle : "Product photo unavailable"}
                          loading={idx < 3 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={idx === 0 ? "high" : "auto"}
                          width="464"
                          height="464"
                          onLoad={() => setLoadedProductImages(previous => {
                            const source = item.image || "/logo.png";
                            return previous.has(source) ? previous : new Set([...previous, source]);
                          })}
                          onError={(e) => {
                            if (e.currentTarget.dataset.fallback === "true") return;
                            e.currentTarget.dataset.fallback = "true";
                            e.currentTarget.style.objectFit = "contain";
                            e.currentTarget.alt = "Product photo unavailable";
                            e.currentTarget.src = "/logo.png";
                          }}
                        />
                      </div>

                      <div className="ath-product-info">
                        <span className="ath-product-metal">{item.metalLabel}</span>
                        <h3 className="ath-product-name">{item.displayTitle}</h3>
                        <span className="ath-product-price-caption">{item.priceLabel}</span>
                        <div className="ath-product-price">{item.price > 0 ? money(item.price) : "Price unavailable"}</div>
                        <div className="ath-product-footer-row">
                          <button
                            type="button"
                            className="ath-view-product-btn"
                            onClick={event => { event.stopPropagation(); openProduct(item); }}
                          >
                            Shop Now <span aria-hidden="true">&rarr;</span>
                          </button>
                          <button
                            type="button"
                            className={`ath-add-cart-btn ${isAdded ? "added" : ""}`}
                            disabled={!(item.price > 0)}
                            aria-label="Add to Cart"
                            title={isAdded ? "Added to Cart" : "Add to Cart"}
                            onClick={(e) => handleAddToCart(item, e)}
                          >
                            {isAdded ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="ath-landing-container">
        {/* ==================================================================
            SECTION 4 — SHOP BY OCCASION (4 LARGE EDITORIAL TILES)
            ================================================================== */}
        <section className="ath-occasion-sec" aria-label="Shop by Occasion">
          <div className="ath-occasion-layout">
            <div className="ath-occasion-copy">
              <div className="ath-occasion-heading">
                <span className="ath-sec-eyebrow">FOR LIFE&apos;S BEAUTIFUL MOMENTS</span>
                <h2 className="ath-sec-title">Shop by Occasion</h2>
                <p className="ath-sec-subtitle ath-section-intro">
                  Some moments become memories. <em>Dress them in something beautiful.</em>
                </p>
              </div>
              <button
                type="button"
                className="ath-occasion-explore"
                onClick={() => navigate("/collection/all")}
              >
                Find Your Moment <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            <div className="ath-occasion-cards-row" role="group" aria-label="Explore jewellery by occasion" tabIndex={0}>
              {OCCASIONS.map((occ) => (
                <button
                  key={occ.label}
                  type="button"
                  className="ath-occasion-card"
                  aria-label={`${occ.action} jewellery`}
                  onClick={() => navigate(occ.route)}
                >
                  <img src={occ.image} alt={`${occ.label} jewellery collection`} loading="lazy" decoding="async" />
                  <span className="ath-occasion-edit">{occ.edit}</span>
                  <div className="ath-occasion-overlay">
                    <span className="ath-occasion-detail" aria-hidden="true" />
                    <h3 className="ath-occasion-card-title">{occ.label}</h3>
                    <p className="ath-occasion-card-sub">{occ.sub}</p>
                    <span className="ath-occasion-shop">
                      {occ.action}<span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="ath-occasion-swipe-hint">Swipe to find your moment <span aria-hidden="true">&rarr;</span></p>
          </div>
        </section>

        {/* ==================================================================
            SECTION 5 — SHOP BY GENDER (WIDE, IMPRESSIVE PANELS)
            ================================================================== */}
        <section className="ath-gender-sec" aria-label="Shop by Gender">
          <div className="ath-sec-header-center">
            <span className="ath-sec-eyebrow">• FOR EVERY PERSONALITY •</span>
            <h2 className="ath-sec-title">Shop by Gender</h2>
            <p className="ath-sec-subtitle ath-section-intro">
              A little sparkle, <em>a style that&apos;s yours.</em>
            </p>
          </div>

          <div className="ath-gender-grid">
            {GENDERS.map((g) => (
              <button
                key={g.title}
                type="button"
                className="ath-gender-card"
                onClick={() => navigate(g.route)}
              >
                <img src={g.image} alt={g.title} loading="lazy" />
                <div className="ath-gender-overlay">
                  <span className="ath-gender-eyebrow">{g.eyebrow}</span>
                  <h3 className="ath-gender-title">{g.title}</h3>
                  <p className="ath-gender-sub">{g.sub}</p>
                  <span className="ath-card-arrow-btn">→</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ==================================================================
            SECTION 6 — WHY CHOOSE ATHIRAI (BIS 916 CERTIFICATE & INSURED DELIVERY)
            ================================================================== */}
        <section className="ath-trust-sec" aria-label="Why Choose Athirai">
          <div className="ath-sec-header-center">
            <span className="ath-sec-eyebrow">• WHY CHOOSE ATHIRAI •</span>
            <h2 className="ath-sec-title">Purity, Security &amp; Trust</h2>
            <p className="ath-sec-subtitle ath-section-intro">
              Confidence in every detail. <em>Care in every delivery.</em>
            </p>
          </div>

          <div className="ath-why-choose-cards-row">
            {/* Trust Card 1: 100% BIS 916 Hallmark */}
            <article className="ath-trust-showcase-card">
              <div className="ath-trust-card-media">
                <img src="/trust-bis-hallmark.jpg" alt="BIS 916 Hallmarked Pure Gold" loading="lazy" />
                <span className="ath-trust-card-tag">GOVERNMENT CERTIFIED • BIS 916</span>
              </div>
              <div className="ath-trust-card-body">
                <h3 className="ath-trust-card-title">100% BIS 916 Hallmarked Pure Gold</h3>
                <ul className="ath-trust-check-list">
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>Govt. Approved BIS Hallmarked 22K Gold</span>
                  </li>
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>Unique 6-digit HUID code authenticity</span>
                  </li>
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>Assayed &amp; certified for zero impurities</span>
                  </li>
                </ul>
              </div>
            </article>

            {/* Trust Card 2: 100% Insured & Tamper-Proof Delivery */}
            <article className="ath-trust-showcase-card">
              <div className="ath-trust-card-media">
                <img src="/trust-secure-delivery.jpg" alt="Insured Secure Delivery" loading="lazy" />
                <span className="ath-trust-card-tag">100% INSURED TRANSIT</span>
              </div>
              <div className="ath-trust-card-body">
                <h3 className="ath-trust-card-title">Tamper-Proof &amp; Insured Secure Delivery</h3>
                <ul className="ath-trust-check-list">
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>Tamper-evident barcode sealed pouch</span>
                  </li>
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>100% Transit insurance covered by Athirai</span>
                  </li>
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>Secure OTP-verified doorstep handover</span>
                  </li>
                </ul>
              </div>
            </article>

            {/* Trust Card 3: More Than Just Jewellery Legacy Card with Photo */}
            <article
              className="ath-trust-showcase-card ath-trust-legacy-card"
              onClick={() => navigate("/collection/all?gifting=true")}
            >
              <div className="ath-trust-card-media">
                <img src="/heritage_gifting_card.jpg" alt="More Than Just Jewellery" loading="lazy" />
                <span className="ath-trust-card-tag">ATHIRAI PROMISE • HEIRLOOM</span>
              </div>
              <div className="ath-trust-card-body">
                <h3 className="ath-trust-card-title">More Than Just Jewellery</h3>
                <ul className="ath-trust-check-list">
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>Master artisan handcrafted heirloom designs</span>
                  </li>
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>Signature velvet box with gift presentation</span>
                  </li>
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>Lifetime purity &amp; exchange guarantee</span>
                  </li>
                </ul>
              </div>
            </article>
          </div>

          {/* Dedicated 5 Trust Badges Horizontal Strip */}
          <div className="ath-trust-badges-strip">
            {TRUST_BENEFITS.map((item) => (
              <div key={item.label} className="ath-trust-strip-item">
                <span className="ath-trust-icon">{item.icon}</span>
                <span className="ath-trust-label">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ==================================================================
            SECTION 8 — ATHIRAI CIRCLE / EXCLUSIVE OFFERS & NEW ARRIVALS
            ================================================================== */}
        <section className="ath-circle-sec" aria-label="Athirai Circle Exclusive Offers">
          <div className="ath-circle-banner">
            <div className="ath-circle-img-wrap" />

            <div className="ath-circle-content">
              <span className="ath-circle-eyebrow">• JOIN ATHIRAI CIRCLE •</span>
              <h2 className="ath-circle-title">Exclusive Offers &amp; New Arrivals</h2>
              <p className="ath-circle-sub">
                Be the first to know about our latest collections, special offers and festive deals.
              </p>

              <form className="ath-newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  className="ath-newsletter-input"
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button type="submit" className="ath-newsletter-btn">
                  <span>Subscribe</span>
                  <span>→</span>
                </button>
              </form>

              {newsletterStatus && (
                <div className={`ath-newsletter-msg ${newsletterStatus.type}`}>
                  {newsletterStatus.message}
                </div>
              )}

              <div className="ath-circle-perks-row">
                <div className="ath-circle-perk">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Exclusive Offers</span>
                </div>
                <div className="ath-circle-perk">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Early Access</span>
                </div>
                <div className="ath-circle-perk">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                  <span>Special Gifting</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PRESERVED FOOTER */}
      <CustomerFooter />
    </div>
  );
}
