import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import CoinTabs from "./CoinTabs";
import {
  JewelryIcon,
  UploadIcon,
  CheckIcon,
  CloseIcon,
  SparkleIcon,
  ArrowRightIcon,
  CoinIcon,
  PlusIcon,
  MinusIcon,
  CartIcon,
  TrashIcon,
  SearchIcon,
  BullionIcon,
} from "../components/SvgIcons";

// Categories identical to add_new_product / backend CATEGORY_CHOICES
const PRODUCT_CATEGORIES = [
  { key: "all", label: "All Categories" },
  { key: "rings", label: "Rings" },
  { key: "necklaces", label: "Necklaces" },
  { key: "bangles", label: "Bangles" },
  { key: "bracelets", label: "Bracelets" },
  { key: "earrings", label: "Earrings" },
  { key: "chains", label: "Chains" },
  { key: "pendants", label: "Pendants" },
  { key: "mangalsutra", label: "Mangalsutra" },
  { key: "anklets", label: "Anklets" },
  { key: "nosepin", label: "Nose Pins" },
  { key: "toerings", label: "Toe Rings" },
  { key: "cufflinks", label: "Cufflinks" },
  { key: "brooches", label: "Brooches" },
  { key: "tiepins", label: "Tie Pins" },
  { key: "coins", label: "Coins & Bars" },
];

const GENDERS = [
  { key: "all", label: "All (Unisex)" },
  { key: "women", label: "Women" },
  { key: "men", label: "Men" },
  { key: "kids", label: "Kids" },
];

const ROLE_TARGET = {
  admin: "Super Admin",
  dealer: "Admin",
  sub_dealer: "Dealer",
  promotor: "Sub Dealer",
  super_admin: "Vault Inventory",
};

export default function AddJewellery() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const currentRole = localStorage.getItem("role") || "admin";
  const isSuperAdmin = currentRole === "super_admin";

  // Super Admin view mode toggle: 'create' | 'buy'
  const [adminViewMode, setAdminViewMode] = useState("create");
  const isBuyMode = !isSuperAdmin || adminViewMode === "buy";

  // ── SUPER ADMIN FORM STATES ──
  const [metal, setMetal] = useState("gold"); // 'gold' | 'silver'
  const [grade, setGrade] = useState("22k"); // if gold: '22k' | '24k', if silver: '999'
  const [category, setCategory] = useState("rings");
  const [gender, setGender] = useState("all");
  const [name, setName] = useState("");
  const [crossWeight, setCrossWeight] = useState("");
  const [stoneWeight, setStoneWeight] = useState("0");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [makingCharge, setMakingCharge] = useState("8");
  const [stoneValue, setStoneValue] = useState("0");
  const [price, setPrice] = useState("");
  const [priceAutoCalculated, setPriceAutoCalculated] = useState(true);

  // Images state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Live metal rates (for auto-price calculation)
  const [rates, setRates] = useState({
    gold_22k: 6850,
    gold_24k: 7470,
    silver_999: 92,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // ── BUY JEWELLERY CATALOG STATES ──
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogMetal, setCatalogMetal] = useState("all"); // 'all' | 'gold_22k' | 'gold_24k' | 'silver'
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [cart, setCart] = useState([]); // Array of { product, qty }
  const [qtyMap, setQtyMap] = useState({}); // { [productId]: number }
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  // Fetch metal rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await api.get("/metal-rates/");
        if (res.data) {
          const gold22 = res.data.gold_22k_rate || res.data.gold_22k || 6850;
          const gold24 = res.data.gold_24k_rate || res.data.gold_24k || 7470;
          const silver999 = res.data.silver_rate || res.data.silver_999 || 92;
          setRates({
            gold_22k: Number(gold22),
            gold_24k: Number(gold24),
            silver_999: Number(silver999),
          });
        }
      } catch {
        // Default rates remain
      }
    };
    fetchRates();
  }, []);

  // Fetch catalog products for Buy Mode
  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await api.get("/jewelry-products/?internal=true");
      setCatalogProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      // ignore
    }
    setCatalogLoading(false);
  };

  useEffect(() => {
    if (isBuyMode) {
      fetchCatalog();
    }
  }, [isBuyMode]);

  // Derived weights & price calculation for master creation form
  const numCross = parseFloat(crossWeight) || 0;
  const numStone = parseFloat(stoneWeight) || 0;
  const netWeight = Math.max(0, numCross - numStone);

  useEffect(() => {
    if (!priceAutoCalculated) return;
    if (numCross <= 0) {
      setPrice("");
      return;
    }

    let ratePerGram = 0;
    if (metal === "gold") {
      ratePerGram = grade === "24k" ? rates.gold_24k : rates.gold_22k;
    } else {
      ratePerGram = rates.silver_999;
    }

    const metalValue = netWeight * ratePerGram;
    const mcPercent = parseFloat(makingCharge) || 0;
    const mcValue = metalValue * (mcPercent / 100);
    const stoneVal = parseFloat(stoneValue) || 0;
    const subtotal = metalValue + mcValue + stoneVal;
    const gst = subtotal * 0.03;
    const total = Math.round(subtotal + gst);

    setPrice(total > 0 ? String(total) : "");
  }, [metal, grade, numCross, numStone, makingCharge, stoneValue, rates, priceAutoCalculated, netWeight]);

  const handleMetalChange = (newMetal) => {
    setMetal(newMetal);
    if (newMetal === "silver") {
      setGrade("999");
    } else {
      setGrade("22k");
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    const newUrls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  };

  const removeImage = (index) => {
    const newFiles = [...selectedFiles];
    const newUrls = [...previewUrls];
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  // Submit master product (Super Admin)
  const handleSubmitMasterProduct = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a Product Name.");
      return;
    }
    if (!crossWeight || parseFloat(crossWeight) <= 0) {
      setError("Please enter a valid Cross Weight (g).");
      return;
    }
    if (!stockQuantity || parseInt(stockQuantity, 10) < 0) {
      setError("Please enter a valid Stock Quantity.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("Please enter or calculate the Total Price.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("metal", metal);
      fd.append("grade", grade);
      fd.append("category", category);
      fd.append("gender", gender);
      fd.append("name", name.trim());
      fd.append("cross_weight", String(numCross));
      fd.append("stone_weight", String(numStone));
      fd.append("net_weight", String(netWeight.toFixed(3)));
      fd.append("stock_quantity", String(stockQuantity));
      fd.append("is_internal_asset", "true");
      fd.append("making_charge", String(parseFloat(makingCharge) || 0));
      fd.append("stone_value", String(parseFloat(stoneValue) || 0));
      fd.append("tax_percent", "3.00");
      fd.append("price", String(parseFloat(price)));

      selectedFiles.forEach((file) => {
        fd.append("uploaded_images", file);
      });

      await api.post("/jewelry-products/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Jewellery product added to master registry successfully!");

      // Reset form
      setName("");
      setCrossWeight("");
      setStoneWeight("0");
      setStockQuantity("1");
      setMakingCharge("8");
      setStoneValue("0");
      setPrice("");
      setSelectedFiles([]);
      setPreviewUrls([]);
      setPriceAutoCalculated(true);
      fetchCatalog();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        (typeof err.response?.data === "object"
          ? Object.entries(err.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : "Failed to add jewellery product.");
      setError(errorMsg);
    }
    setLoading(false);
  };

  // ── BUY JEWELLERY ACTIONS ──
  const handleQtyChange = (productId, delta) => {
    setQtyMap((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (product) => {
    const qty = qtyMap[product.id] || 1;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { product, qty }];
    });
    showToast(`Added ${qty} × ${product.name} to request list!`);
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleUpdateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const next = item.qty + delta;
            return next > 0 ? { ...item, qty: next } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Submit request to upstream parent
  const handleSubmitJewelryRequest = async () => {
    if (!cart.length) return;
    setSubmittingRequest(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          qty: item.qty,
        })),
      };
      await api.post("/jewelry-requests/", payload);
      showToast("Jewellery request submitted successfully!");
      setCart([]);
      setCartModalOpen(false);
      navigate("/jewellery-requests");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit request.");
    }
    setSubmittingRequest(false);
  };

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return catalogProducts.filter((p) => {
      if (catalogCategory !== "all" && p.category !== catalogCategory) {
        return false;
      }
      if (catalogMetal === "gold_22k") {
        if (p.metal !== "gold" || !p.grade?.includes("22")) return false;
      } else if (catalogMetal === "gold_24k") {
        if (p.metal !== "gold" || !p.grade?.includes("24")) return false;
      } else if (catalogMetal === "silver") {
        if (p.metal !== "silver") return false;
      }
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesCode = p.product_code?.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesCat) return false;
      }
      return true;
    });
  }, [catalogProducts, catalogCategory, catalogMetal, catalogSearch]);

  const totalCartPieces = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartWeight = cart.reduce(
    (sum, item) => sum + (parseFloat(item.product.net_weight || item.product.cross_weight) || 0) * item.qty,
    0
  );
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + (parseFloat(item.product.price) || 0) * item.qty,
    0
  );

  return (
    <div className="aj-page">
      <style>{`
        .aj-page {
          min-height: 100vh;
          background: #F4F8F8;
          padding: 24px 32px 60px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #111817;
        }

        .aj-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .aj-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .aj-header-left h1 {
          font-size: 26px;
          font-weight: 800;
          color: #073B3F;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .aj-header-left p {
          font-size: 14px;
          color: #5C706E;
          margin: 0;
        }

        .aj-target-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: #E8F4F3;
          border: 1px solid #B4CECC;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 750;
          color: #073B3F;
        }

        /* Super Admin Top Switcher */
        .aj-admin-switcher {
          display: inline-flex;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid #D6E2E1;
          border-radius: 14px;
          padding: 5px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.04);
        }

        .aj-admin-switch-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #5C706E;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .aj-admin-switch-btn.active {
          background: #073B3F;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.2);
        }

        /* Rates Ticker Bar */
        .aj-rates-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 12px 18px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          box-shadow: 0 2px 12px rgba(7, 59, 63, 0.03);
        }

        .aj-rate-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 700;
        }

        /* Catalog Filters */
        .aj-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .aj-metal-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .aj-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid #D6E2E1;
          background: #FFFFFF;
          color: #5C706E;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .aj-filter-btn.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.2);
        }

        .aj-search-box {
          position: relative;
          min-width: 260px;
        }

        .aj-search-box input {
          width: 100%;
          padding: 9px 14px 9px 36px;
          border: 1px solid #D6E2E1;
          border-radius: 12px;
          font-size: 13px;
          outline: none;
          background: #FFFFFF;
          color: #111817;
        }

        .aj-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        /* Product Cards Grid */
        .aj-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 22px;
          margin-bottom: 40px;
        }

        .aj-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.04);
          display: flex;
          flex-direction: column;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .aj-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.08);
        }

        .aj-card-img-box {
          height: 190px;
          background: #F8FAFA;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .aj-card-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .aj-card-badge-purity {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .aj-card-body {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .aj-card-title {
          font-size: 15.5px;
          font-weight: 800;
          color: #073B3F;
          margin: 0 0 6px;
        }

        .aj-spec-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F8FAFA;
          border-radius: 10px;
          padding: 8px 12px;
          margin: 10px 0;
          font-size: 12px;
        }

        .aj-price-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #EEF4F4;
        }

        .aj-action-counter {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
        }

        .aj-counter-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #D6E2E1;
          background: #FFFFFF;
          color: #073B3F;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .aj-counter-val {
          min-width: 30px;
          text-align: center;
          font-size: 13.5px;
          font-weight: 800;
          color: #073B3F;
        }

        .aj-btn-buy {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 14px;
          background: #073B3F;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .aj-btn-buy:hover {
          background: #0C4E53;
        }

        /* Floating Cart Sticky Bar */
        .aj-floating-cart {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 90;
          background: #073B3F;
          border: 1px solid #0C4E53;
          border-radius: 16px;
          padding: 12px 24px;
          box-shadow: 0 12px 36px rgba(7, 59, 63, 0.35);
          display: flex;
          align-items: center;
          gap: 24px;
          color: #FFFFFF;
          animation: slideUp 200ms ease;
        }

        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        .aj-btn-review-cart {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: #FDE047;
          border: none;
          border-radius: 10px;
          color: #713F12;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .aj-btn-review-cart:hover {
          background: #FEF08A;
        }

        /* Form Card (Master Create Mode) */
        .aj-form-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 32px 36px;
          box-shadow: 0 4px 20px rgba(7, 59, 63, 0.04);
        }

        .aj-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px 24px;
        }

        .aj-form-col-full {
          grid-column: 1 / -1;
        }

        .aj-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .aj-label {
          font-size: 13px;
          font-weight: 700;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .aj-req {
          color: #DC2626;
        }

        .aj-input, .aj-select {
          height: 44px;
          padding: 0 14px;
          border: 1.5px solid #D6E2E1;
          border-radius: 12px;
          background: #FFFFFF;
          font-size: 14px;
          color: #111817;
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .aj-input:focus, .aj-select:focus {
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.1);
        }

        .aj-pills {
          display: flex;
          gap: 10px;
        }

        .aj-pill-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 16px;
          border-radius: 12px;
          border: 1.5px solid #D6E2E1;
          background: #F8FAFA;
          color: #5C706E;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .aj-pill-btn.active-gold {
          background: linear-gradient(135deg, #B45309 0%, #D97706 100%);
          border-color: #B45309;
          color: #FFFFFF;
        }

        .aj-pill-btn.active-silver {
          background: linear-gradient(135deg, #4B5563 0%, #6B7280 100%);
          border-color: #4B5563;
          color: #FFFFFF;
        }

        .aj-pill-btn.active-grade {
          background: #073B3F;
          border-color: #073B3F;
          color: #FFFFFF;
        }

        .aj-upload-box {
          border: 2px dashed #B4CECC;
          border-radius: 16px;
          padding: 24px;
          background: #F8FAFA;
          text-align: center;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .aj-upload-box:hover {
          border-color: #073B3F;
          background: #F0F6F5;
        }

        .aj-preview-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 14px;
        }

        .aj-preview-item {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          border: 1px solid #D6E2E1;
        }

        .aj-preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .aj-remove-img {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 20px;
          height: 20px;
          background: rgba(220, 38, 38, 0.9);
          border: none;
          border-radius: 50%;
          color: #FFFFFF;
          font-size: 11px;
          cursor: pointer;
        }

        .aj-submit-btn {
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, #073B3F 0%, #0C4E53 100%);
          border: none;
          border-radius: 14px;
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 750;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 28px;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.2);
        }

        .aj-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(7, 59, 63, 0.45);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .aj-modal-card {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 580px;
          padding: 24px 28px;
          box-shadow: 0 16px 48px rgba(7, 59, 63, 0.2);
          max-height: 90vh;
          overflow-y: auto;
        }

        .aj-toast {
          position: fixed;
          bottom: 28px;
          right: 32px;
          background: #073B3F;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 110;
        }

        @media (max-width: 768px) {
          .aj-form-grid {
            grid-template-columns: 1fr;
          }
          .aj-floating-cart {
            width: calc(100% - 32px);
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="aj-container">
        {/* Navigation Tabs */}
        <CoinTabs activeTab={isSuperAdmin ? "Add Jewellery" : "Buy Jewellery"} />

        {/* Header */}
        <div className="aj-header">
          <div className="aj-header-left">
            <h1>
              <JewelryIcon size={26} color="#073B3F" />{" "}
              {isBuyMode ? "Buy / Request Jewellery" : "Add Jewellery (Master Inventory)"}
            </h1>
            <p>
              {isBuyMode
                ? "Browse registered designs and submit replenishment requests directly to your assigned upline."
                : "Register brand new master jewellery designs into company inventory with precise metal parameters."}
            </p>
          </div>

          <div className="aj-target-badge">
            <SparkleIcon size={14} color="#073B3F" />
            <span>Request Target: <strong>{ROLE_TARGET[currentRole] || "Super Admin"}</strong></span>
          </div>
        </div>

        {/* Super Admin Switcher Toggle */}
        {isSuperAdmin && (
          <div className="aj-admin-switcher">
            <button
              type="button"
              className={`aj-admin-switch-btn ${adminViewMode === "create" ? "active" : ""}`}
              onClick={() => setAdminViewMode("create")}
            >
              <PlusIcon size={15} /> Register New Master Product
            </button>
            <button
              type="button"
              className={`aj-admin-switch-btn ${adminViewMode === "buy" ? "active" : ""}`}
              onClick={() => setAdminViewMode("buy")}
            >
              <CartIcon size={15} /> Buy / Request Jewellery Catalog ({catalogProducts.length})
            </button>
          </div>
        )}

        {/* Live Metal Rates Bar */}
        <div className="aj-rates-bar">
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#7A8987", textTransform: "uppercase" }}>
            Live Rates:
          </span>
          <div className="aj-rate-pill" style={{ background: "#FEF3C7", color: "#B45309" }}>
            <CoinIcon size={14} color="#B45309" />
            <span>Gold 22K (916): ₹{rates.gold_22k.toLocaleString()}/g</span>
          </div>
          <div className="aj-rate-pill" style={{ background: "#FDF6B2", color: "#92400E" }}>
            <SparkleIcon size={14} color="#92400E" />
            <span>Gold 24K (999): ₹{rates.gold_24k.toLocaleString()}/g</span>
          </div>
          <div className="aj-rate-pill" style={{ background: "#F1F5F9", color: "#475569" }}>
            <BullionIcon size={14} color="#475569" />
            <span>Silver 999: ₹{rates.silver_999.toLocaleString()}/g</span>
          </div>
        </div>

        {/* ── MODE 1: BUY JEWELLERY CATALOG ── */}
        {isBuyMode ? (
          <div>
            {/* Filter Bar */}
            <div className="aj-filter-bar">
              <div className="aj-metal-pills">
                <button
                  type="button"
                  className={`aj-filter-btn ${catalogMetal === "all" ? "active" : ""}`}
                  onClick={() => setCatalogMetal("all")}
                >
                  All Metals
                </button>
                <button
                  type="button"
                  className={`aj-filter-btn ${catalogMetal === "gold_22k" ? "active" : ""}`}
                  onClick={() => setCatalogMetal("gold_22k")}
                >
                  Gold 22K (916)
                </button>
                <button
                  type="button"
                  className={`aj-filter-btn ${catalogMetal === "gold_24k" ? "active" : ""}`}
                  onClick={() => setCatalogMetal("gold_24k")}
                >
                  Gold 24K (999)
                </button>
                <button
                  type="button"
                  className={`aj-filter-btn ${catalogMetal === "silver" ? "active" : ""}`}
                  onClick={() => setCatalogMetal("silver")}
                >
                  Silver 999
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <select
                  className="aj-select"
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  style={{ height: "38px", fontSize: "12.5px" }}
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <div className="aj-search-box">
                  <span className="aj-search-icon">
                    <SearchIcon size={14} color="#7A8987" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search design or code..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            {catalogLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#5C706E" }}>
                Loading available jewellery designs...
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#FFFFFF",
                  borderRadius: "18px",
                  border: "1px dashed #B4CECC",
                  color: "#5C706E",
                }}
              >
                <JewelryIcon size={40} color="#B4CECC" style={{ margin: "0 auto 10px" }} />
                <h3 style={{ margin: "0 0 6px", color: "#073B3F" }}>No Jewellery Designs Found</h3>
                <p style={{ margin: 0, fontSize: "13px" }}>
                  Try changing your search keywords or filter options.
                </p>
              </div>
            ) : (
              <div className="aj-cards-grid">
                {filteredCatalog.map((product) => {
                  const firstImg = product.images?.[0]?.image;
                  const isGold = product.metal?.toLowerCase() === "gold";
                  const is24 = product.grade?.includes("24");
                  const badgeBg = isGold ? (is24 ? "#FDF6B2" : "#FEF3C7") : "#F1F5F9";
                  const badgeColor = isGold ? (is24 ? "#92400E" : "#B45309") : "#475569";
                  const purityText = isGold ? (is24 ? "Gold 24K (999)" : "Gold 22K (916)") : "Silver 999";
                  const itemQty = qtyMap[product.id] || 1;

                  return (
                    <div key={product.id} className="aj-card">
                      <div className="aj-card-img-box">
                        {firstImg ? (
                          <img src={firstImg} alt={product.name} />
                        ) : (
                          <JewelryIcon size={48} color="#B4CECC" />
                        )}
                        <span
                          className="aj-card-badge-purity"
                          style={{ background: badgeBg, color: badgeColor }}
                        >
                          {purityText}
                        </span>
                      </div>

                      <div className="aj-card-body">
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#7A8987", textTransform: "uppercase" }}>
                          {product.category} {product.product_code ? `• ${product.product_code}` : ""}
                        </div>
                        <h3 className="aj-card-title">{product.name}</h3>

                        <div className="aj-spec-row">
                          <div>
                            <span style={{ color: "#7A8987" }}>Gross: </span>
                            <strong>{product.cross_weight || 0}g</strong>
                          </div>
                          <div>
                            <span style={{ color: "#7A8987" }}>Stone: </span>
                            <strong>{product.stone_weight || 0}g</strong>
                          </div>
                          <div>
                            <span style={{ color: "#073B3F" }}>Net Metal: </span>
                            <strong style={{ color: "#073B3F" }}>
                              {product.net_weight || product.cross_weight || 0}g
                            </strong>
                          </div>
                        </div>

                        <div className="aj-price-row">
                          <div>
                            <div style={{ fontSize: "10.5px", color: "#7A8987", textTransform: "uppercase", fontWeight: 700 }}>
                              Making: {product.making_charge || 0}% | Stone: ₹{product.stone_value || 0}
                            </div>
                            <div style={{ fontSize: "18px", fontWeight: 850, color: "#073B3F" }}>
                              ₹{Number(product.price || 0).toLocaleString()}
                              <small style={{ fontSize: "11px", fontWeight: 600, color: "#5C706E" }}> (incl. 3% GST)</small>
                            </div>
                          </div>
                        </div>

                        <div className="aj-action-counter">
                          <button
                            type="button"
                            className="aj-counter-btn"
                            onClick={() => handleQtyChange(product.id, -1)}
                          >
                            -
                          </button>
                          <span className="aj-counter-val">{itemQty}</span>
                          <button
                            type="button"
                            className="aj-counter-btn"
                            onClick={() => handleQtyChange(product.id, 1)}
                          >
                            +
                          </button>

                          <button
                            type="button"
                            className="aj-btn-buy"
                            onClick={() => handleAddToCart(product)}
                          >
                            <CartIcon size={14} color="#FFFFFF" /> Add to Request
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Floating Cart Sticky Bar */}
            {cart.length > 0 && (
              <div className="aj-floating-cart">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <CartIcon size={20} color="#FDE047" />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800 }}>
                      {totalCartPieces} piece{totalCartPieces > 1 ? "s" : ""} selected ({cart.length} design{cart.length > 1 ? "s" : ""})
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#A7D0CD" }}>
                      Net Metal: {totalCartWeight.toFixed(2)}g • Est: ₹{totalCartPrice.toLocaleString()}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="aj-btn-review-cart"
                  onClick={() => setCartModalOpen(true)}
                >
                  Review & Request <ArrowRightIcon size={12} color="#713F12" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── MODE 2: MASTER CREATE NEW PRODUCT (SUPER ADMIN ONLY) ── */
          <div className="aj-form-card">
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: "12px",
                  color: "#B91C1C",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitMasterProduct}>
              <div className="aj-form-grid">
                {/* 1. Metal */}
                <div className="aj-form-group">
                  <label className="aj-label">
                    Metal <span className="aj-req">*</span>
                  </label>
                  <div className="aj-pills">
                    <button
                      type="button"
                      className={`aj-pill-btn ${metal === "gold" ? "active-gold" : ""}`}
                      onClick={() => handleMetalChange("gold")}
                    >
                      <CoinIcon size={16} /> Gold
                    </button>
                    <button
                      type="button"
                      className={`aj-pill-btn ${metal === "silver" ? "active-silver" : ""}`}
                      onClick={() => handleMetalChange("silver")}
                    >
                      <BullionIcon size={16} /> Silver
                    </button>
                  </div>
                </div>

                {/* 2. Grade */}
                <div className="aj-form-group">
                  <label className="aj-label">
                    Grade (Purity) <span className="aj-req">*</span>
                  </label>
                  <div className="aj-pills">
                    {metal === "gold" ? (
                      <>
                        <button
                          type="button"
                          className={`aj-pill-btn ${grade === "22k" ? "active-grade" : ""}`}
                          onClick={() => setGrade("22k")}
                        >
                          22K (916 Hallmarked)
                        </button>
                        <button
                          type="button"
                          className={`aj-pill-btn ${grade === "24k" ? "active-grade" : ""}`}
                          onClick={() => setGrade("24k")}
                        >
                          24K (999 Fine Gold)
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="aj-pill-btn active-grade"
                        style={{ cursor: "default" }}
                      >
                        999 (Fine Silver)
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Product Category */}
                <div className="aj-form-group">
                  <label className="aj-label">
                    Product Category <span className="aj-req">*</span>
                  </label>
                  <select
                    className="aj-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {PRODUCT_CATEGORIES.filter((c) => c.key !== "all").map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Gender */}
                <div className="aj-form-group">
                  <label className="aj-label">
                    Gender <span className="aj-req">*</span>
                  </label>
                  <select
                    className="aj-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    {GENDERS.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Product Name */}
                <div className="aj-form-group aj-form-col-full">
                  <label className="aj-label">
                    Product Name <span className="aj-req">*</span>
                  </label>
                  <input
                    type="text"
                    className="aj-input"
                    placeholder="e.g. 2g Traditional Floral Gold Ring"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* 6. Cross Weight (Gross) */}
                <div className="aj-form-group">
                  <label className="aj-label">
                    Cross Weight (g) <span className="aj-req">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="aj-input"
                    placeholder="e.g. 2.500"
                    value={crossWeight}
                    onChange={(e) => setCrossWeight(e.target.value)}
                    required
                  />
                </div>

                {/* 7. Stone Weight */}
                <div className="aj-form-group">
                  <label className="aj-label">
                    Stone Weight (g)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="aj-input"
                    placeholder="0"
                    value={stoneWeight}
                    onChange={(e) => setStoneWeight(e.target.value)}
                  />
                  <div style={{ fontSize: "11.5px", color: "#073B3F", fontWeight: 700, marginTop: "2px" }}>
                    Net Metal Weight: {netWeight.toFixed(3)} g
                  </div>
                </div>

                {/* 8. Initial Vault Stock Quantity */}
                <div className="aj-form-group">
                  <label className="aj-label">
                    Stock Quantity <span className="aj-req">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="aj-input"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                  />
                </div>

                {/* 9. Making Charge (%) */}
                <div className="aj-form-group">
                  <label className="aj-label">
                    Making Charge (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="aj-input"
                    value={makingCharge}
                    onChange={(e) => setMakingCharge(e.target.value)}
                  />
                </div>

                {/* 10. Stone Value (₹) */}
                <div className="aj-form-group">
                  <label className="aj-label">
                    Stone Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="aj-input"
                    value={stoneValue}
                    onChange={(e) => setStoneValue(e.target.value)}
                  />
                </div>

                {/* 11. Total Price */}
                <div className="aj-form-group aj-form-col-full">
                  <label className="aj-label">
                    Total Price (with 3% Tax) <span className="aj-req">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="aj-input"
                    placeholder="Calculated automatically or override"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setPriceAutoCalculated(false);
                    }}
                    required
                  />
                </div>

                {/* 12. Upload Images */}
                <div className="aj-form-group aj-form-col-full">
                  <label className="aj-label">
                    Product Images (PNG, JPG, WEBP)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />
                  <div
                    className="aj-upload-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon size={28} color="#073B3F" style={{ margin: "0 auto 6px" }} />
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#073B3F" }}>
                      Click to browse or drag & drop product photos
                    </div>
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="aj-preview-grid">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="aj-preview-item">
                          <img src={url} alt={`Preview ${idx + 1}`} />
                          <button
                            type="button"
                            className="aj-remove-img"
                            onClick={() => removeImage(idx)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="aj-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  "Adding Product..."
                ) : (
                  <>
                    <CheckIcon size={18} color="#FFFFFF" /> Register Master Jewellery Product
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── REVIEW & SUBMIT REQUEST MODAL ── */}
      {cartModalOpen && (
        <div className="aj-modal-overlay">
          <div className="aj-modal-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#073B3F" }}>
                Review Jewellery Request
              </h3>
              <button
                type="button"
                onClick={() => setCartModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <CloseIcon size={18} color="#5C706E" />
              </button>
            </div>

            <div
              style={{
                padding: "10px 14px",
                background: "#E8F4F3",
                borderRadius: "12px",
                fontSize: "12.5px",
                color: "#073B3F",
                marginBottom: "16px",
              }}
            >
              Sending request to: <strong>{ROLE_TARGET[currentRole] || "Super Admin"}</strong>. Stock will be disbursed to your in-hand custody upon authorization.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", marginBottom: "18px" }}>
              {cart.map((item) => {
                const p = item.product;
                const unitPrice = parseFloat(p.price) || 0;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px",
                      background: "#F8FAFA",
                      borderRadius: "10px",
                      border: "1px solid #E1EBEA",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: 750, color: "#073B3F" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#5C706E" }}>
                        Net: {p.net_weight || p.cross_weight}g • ₹{unitPrice.toLocaleString()} each
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          className="aj-counter-btn"
                          style={{ width: "24px", height: "24px", fontSize: "12px" }}
                          onClick={() => handleUpdateCartQty(p.id, -1)}
                        >
                          -
                        </button>
                        <span style={{ fontSize: "12.5px", fontWeight: 800, minWidth: "20px", textAlign: "center" }}>
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="aj-counter-btn"
                          style={{ width: "24px", height: "24px", fontSize: "12px" }}
                          onClick={() => handleUpdateCartQty(p.id, 1)}
                        >
                          +
                        </button>
                      </div>

                      <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#073B3F", minWidth: "80px", textAlign: "right" }}>
                        ₹{(unitPrice * item.qty).toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(p.id)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#DC2626" }}
                      >
                        <TrashIcon size={14} color="#DC2626" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#F0F7F6",
                borderRadius: "12px",
                marginBottom: "20px",
                fontWeight: 800,
                color: "#073B3F",
              }}
            >
              <span>Total Request Summary</span>
              <span>
                {totalCartPieces} pcs ({totalCartWeight.toFixed(2)}g) • ₹{totalCartPrice.toLocaleString()}
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  height: "44px",
                  background: "#FFFFFF",
                  border: "1px solid #D6E2E1",
                  borderRadius: "12px",
                  color: "#5C706E",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() => setCartModalOpen(false)}
              >
                Continue Shopping
              </button>
              <button
                type="button"
                style={{
                  flex: 1.5,
                  height: "44px",
                  background: "#073B3F",
                  border: "none",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontWeight: 750,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                disabled={submittingRequest}
                onClick={handleSubmitJewelryRequest}
              >
                {submittingRequest ? "Submitting..." : `Confirm & Request from ${ROLE_TARGET[currentRole] || "Parent"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="aj-toast">
          <CheckIcon size={16} color="#4ADE80" /> {toast}
        </div>
      )}
    </div>
  );
}
