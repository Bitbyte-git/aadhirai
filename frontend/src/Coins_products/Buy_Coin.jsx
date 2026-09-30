import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import CoinTabs from "./CoinTabs";
import {
  CoinIcon,
  SparkleIcon,
  BullionIcon,
  PlusIcon,
  MinusIcon,
  CartIcon,
  TrashIcon,
  ArrowLeftIcon,
  InboxIcon,
  HistoryIcon,
  CheckIcon,
  WarningIcon,
  ClockIcon,
} from "../components/SvgIcons";

// Anything under 1g reads in milligrams (e.g. 0.05g -> 50 mg, 0.5g -> 500 mg), 1g and above in grams (e.g. 1.5 g, 2.5 g).
const formatWeight = (grams) => {
  const g = Number(grams) || 0;
  if (g <= 0) return "0 mg";
  if (g < 1) return `${Math.round(g * 1000)} mg`;
  const rounded = Math.round(g * 100) / 100;
  return `${rounded} g`;
};

const METALS = [
  {
    key: "gold_22k",
    label: "Gold 22K",
    purity: "916 Hallmarked",
    tone: "#073B3F",
    bg: "#EFF6F6",
    border: "#C2DADB",
    IconComponent: CoinIcon,
  },
  {
    key: "gold_24k",
    label: "Gold 24K",
    purity: "999 Fine Gold",
    tone: "#0A5C63",
    bg: "#E6F2F2",
    border: "#B2D3D4",
    IconComponent: SparkleIcon,
  },
  {
    key: "silver_999",
    label: "Silver 999",
    purity: "999 Fine Silver",
    tone: "#64748B",
    bg: "#F1F5F9",
    border: "#CBD5E1",
    IconComponent: BullionIcon,
  },
];

const GOLD_WEIGHTS = [
  { label: "50 mg", grams: 0.05 },
  { label: "100 mg", grams: 0.1 },
  { label: "200 mg", grams: 0.2 },
  { label: "250 mg", grams: 0.25 },
  { label: "500 mg", grams: 0.5 },
  { label: "1 gm", grams: 1 },
  { label: "2 gm", grams: 2 },
  { label: "4 gm", grams: 4 },
  { label: "8 gm", grams: 8 },
];

const SILVER_WEIGHTS = [
  { label: "500 mg", grams: 0.5 },
  { label: "1 gm", grams: 1 },
  { label: "2 gm", grams: 2 },
  { label: "5 gm", grams: 5 },
  { label: "10 gm", grams: 10 },
  { label: "20 gm", grams: 20 },
  { label: "50 gm", grams: 50 },
  { label: "100 gm", grams: 100 },
];

const ROLE_TARGET = {
  admin: "Super Admin",
  dealer: "Admin",
  sub_dealer: "Dealer",
  promotor: "Sub Dealer",
  shop: "your leader",
  super_admin: "Vault Inventory",
};

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const GST_RATE = 0.03;

export default function BuyCoin() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "admin";
  const [metalType, setMetalType] = useState("gold_22k");
  const [weightLabel, setWeightLabel] = useState("100 mg");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  // ── Innaiku rate (Super Admin set pannadhu) — value = grams × rate + 3% GST ──
  const [rates, setRates] = useState(null); // { gold_22k, gold_24k, silver_999, date }
  const [ratesFailed, setRatesFailed] = useState(false);
  useEffect(() => {
    api.get("/metal-rates/")
      .then((res) => {
        const d = res.data || {};
        setRates({
          gold_22k: Number(d.gold_22k) || 0,
          gold_24k: Number(d.gold_24k) || 0,
          silver_999: Number(d.silver_999) || 0,
          date: d.date || "",
        });
      })
      .catch(() => setRatesFailed(true));
  }, []);
  // ── Leader kaila evlo coin irukku / Super Admin vault-la mattum irukku (forward aagum) ──
  const [catalog, setCatalog] = useState(null); // { leader, leader_stock, super_admin_stock }
  useEffect(() => {
    if (role === "super_admin") return;
    api.get("/coin-requests/catalog/").then((res) => setCatalog(res.data || null)).catch(() => {});
  }, [role]);
  const availabilityOf = (mKey, wLabel) => {
    if (!catalog) return null;
    const key = `${mKey}|${wLabel}`;
    const lq = Number(catalog.leader_stock?.[key]) || 0;
    const sq = Number(catalog.super_admin_stock?.[key]) || 0;
    if (lq > 0) return { kind: "leader", qty: lq };
    if (sq > 0) return { kind: "forward", qty: sq };
    return { kind: "none", qty: 0 };
  };
  const ROLE_NAME = { super_admin: "Super Admin", admin: "Super Stockist", dealer: "Distributor", sub_dealer: "Wholesale Dealer", promotor: "Retailer", shop: "Shop" };

  const rateOf = (mKey) => Number(rates?.[mKey]) || 0;
  const valueOf = (item) => Number(item.weight_grams || 0) * Number(item.qty || 0) * rateOf(item.metal_type);
  const todayIso = new Date().toLocaleDateString("en-CA");
  const rateDateLabel = rates?.date
    ? rates.date === todayIso
      ? "Today"
      : new Date(`${rates.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

  const availableWeights = metalType === "silver_999" ? SILVER_WEIGHTS : GOLD_WEIGHTS;
  const selectedMetal = METALS.find((m) => m.key === metalType) || METALS[0];
  const selectedWeight = availableWeights.find((w) => w.label === weightLabel) || availableWeights[0];

  const handleSelectMetal = (mKey) => {
    setMetalType(mKey);
    const nextWeights = mKey === "silver_999" ? SILVER_WEIGHTS : GOLD_WEIGHTS;
    if (!nextWeights.some((w) => w.label === weightLabel)) {
      setWeightLabel(nextWeights[0].label);
    }
  };

  // Specific to the currently selected metal (Gold 22K, Gold 24K, Silver 999)
  // Changes immediately when user clicks between metals
  const currentMetalCart = useMemo(
    () => cart.filter((item) => item.metal_type === metalType),
    [cart, metalType]
  );
  const metalQty = useMemo(
    () => currentMetalCart.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [currentMetalCart]
  );
  const metalWeight = useMemo(
    () =>
      currentMetalCart.reduce(
        (sum, item) => sum + Number(item.weight_grams || 0) * Number(item.qty || 0),
        0
      ),
    [currentMetalCart]
  );

  // Entire cart aggregates (Overall)
  const totalQty = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [cart]
  );
  const totalWeight = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.weight_grams || 0) * Number(item.qty || 0),
        0
      ),
    [cart]
  );
  const totalValue = cart.reduce((s, item) => s + valueOf(item), 0);
  const addPreviewValue = selectedWeight.grams * Math.max(1, Number(qty) || 1) * rateOf(metalType);

  // 22K Gold Breakdown
  const cart22k = useMemo(() => cart.filter((i) => i.metal_type === "gold_22k"), [cart]);
  const qty22k = useMemo(() => cart22k.reduce((s, i) => s + Number(i.qty || 0), 0), [cart22k]);
  const weight22k = useMemo(
    () => cart22k.reduce((s, i) => s + Number(i.weight_grams || 0) * Number(i.qty || 0), 0),
    [cart22k]
  );

  // 24K Gold Breakdown
  const cart24k = useMemo(() => cart.filter((i) => i.metal_type === "gold_24k"), [cart]);
  const qty24k = useMemo(() => cart24k.reduce((s, i) => s + Number(i.qty || 0), 0), [cart24k]);
  const weight24k = useMemo(
    () => cart24k.reduce((s, i) => s + Number(i.weight_grams || 0) * Number(i.qty || 0), 0),
    [cart24k]
  );

  // Silver 999 Breakdown
  const cartSilver = useMemo(() => cart.filter((i) => i.metal_type === "silver_999"), [cart]);
  const qtySilver = useMemo(() => cartSilver.reduce((s, i) => s + Number(i.qty || 0), 0), [cartSilver]);
  const weightSilver = useMemo(
    () => cartSilver.reduce((s, i) => s + Number(i.weight_grams || 0) * Number(i.qty || 0), 0),
    [cartSilver]
  );

  const addItem = () => {
    const count = Math.max(1, Number(qty) || 1);
    setCart((prev) => {
      const existing = prev.findIndex(
        (item) => item.metal_type === metalType && item.weight_label === weightLabel
      );
      if (existing >= 0) {
        return prev.map((item, index) =>
          index === existing ? { ...item, qty: Number(item.qty) + count } : item
        );
      }
      return [
        ...prev,
        {
          metal_type: metalType,
          weight_label: selectedWeight.label,
          weight_grams: selectedWeight.grams,
          qty: count,
        },
      ];
    });
    setMsg("");
  };

  const removeItem = (index) => setCart((prev) => prev.filter((_, i) => i !== index));

  const submitRequest = async () => {
    if (!cart.length) {
      setMsgType("error");
      setMsg("Please add at least one coin configuration to the cart.");
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      if (role === "super_admin") {
        await api.post("/coin-stock/add/", { items: cart });
        setMsgType("success");
        setMsg("Coins added directly to vault stock!");
      } else {
        await api.post("/coin-requests/", { items: cart });
        setMsgType("success");
        setMsg(`Request sent to ${ROLE_TARGET[role] || "upstream"}.`);
      }
      setCart([]);
    } catch (err) {
      setMsgType("error");
      setMsg(err.response?.data?.error || "Failed to submit request.");
    }
    setSubmitting(false);
  };

  return (
    <div className="bc-root">
      <style>{`
        .bc-root {
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background: #F8FAF9;
          background-image: 
            radial-gradient(at 0% 0%, rgba(7, 59, 63, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(204, 168, 129, 0.06) 0px, transparent 50%);
          color: #111817;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
          padding: 24px 48px 64px;
        }

        .bc-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }

        .bc-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .bc-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5C706E;
        }

        .bc-breadcrumb .link {
          color: #073B3F;
          cursor: pointer;
          font-weight: 700;
          text-decoration: none;
        }

        .bc-breadcrumb .link:hover {
          text-decoration: underline;
        }

        .bc-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #FFFFFF;
          border: 1px solid #D6E2E1;
          border-radius: 999px;
          color: #073B3F;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(7, 59, 63, 0.04);
          transition: all 180ms ease;
        }

        .bc-back-btn:hover {
          background: #F0F5F5;
          border-color: #073B3F;
          transform: translateX(-2px);
        }

        .bc-header-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 4px 20px rgba(7, 59, 63, 0.04);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .bc-header-info h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .bc-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(7, 59, 63, 0.08);
          color: #073B3F;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
        }

        .bc-header-sub {
          margin: 4px 0 0;
          color: #5C706E;
          font-size: 13px;
        }

        .bc-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .bc-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: #FFFFFF;
          border: 1px solid #D6E2E1;
          border-radius: 12px;
          color: #073B3F;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .bc-btn-secondary:hover {
          background: #F0F5F5;
          border-color: #073B3F;
        }

        .bc-overall-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 14px;
        }

        .bc-breakdown-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .bc-stat-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 18px 22px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
          transition: transform 180ms ease;
        }

        .bc-stat-card:hover {
          transform: translateY(-2px);
        }

        .bc-mini-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 14px;
          padding: 14px 16px;
          box-shadow: 0 2px 10px rgba(7, 59, 63, 0.02);
          transition: transform 180ms ease;
        }

        .bc-mini-card:hover {
          transform: translateY(-2px);
        }

        .bc-mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .bc-mini-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .bc-mini-value {
          font-size: 20px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1.1;
          margin-bottom: 3px;
        }

        .bc-mini-sub {
          font-size: 11px;
          color: #7A8987;
          font-weight: 500;
        }

        .bc-stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .bc-stat-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .bc-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bc-stat-value {
          font-size: 30px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
          margin-bottom: 4px;
        }

        .bc-stat-sub {
          font-size: 12px;
          color: #7A8987;
          font-weight: 500;
        }

        .bc-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
        }

        .bc-panel {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(7, 59, 63, 0.03);
        }

        .bc-section-title {
          font-size: 12px;
          font-weight: 800;
          color: #073B3F;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .bc-metal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .bc-metal-btn {
          border: 1.5px solid #E1EBEA;
          background: #FDFDFD;
          border-radius: 14px;
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 180ms ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .bc-metal-btn:hover {
          transform: translateY(-2px);
          border-color: #073B3F;
        }

        .bc-metal-btn.active {
          border-color: var(--metal-tone);
          background: var(--metal-bg);
        }

        .bc-metal-name {
          font-size: 15px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bc-metal-purity {
          font-size: 11px;
          font-weight: 700;
          color: var(--metal-tone);
          text-transform: uppercase;
        }

        .bc-weight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
          gap: 10px;
          margin-bottom: 24px;
        }

        .bc-weight-btn {
          height: 44px;
          border-radius: 12px;
          border: 1.5px solid #E1EBEA;
          background: #F8FAFA;
          color: #073B3F;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 180ms ease;
        }

        .bc-weight-btn:hover {
          background: #EFF6F6;
          border-color: #073B3F;
        }

        .bc-weight-btn.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
        }

        .bc-stepper-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 14px 18px;
          background: #F8FAFA;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
        }

        .bc-step-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #D6E2E1;
          background: #FFFFFF;
          color: #073B3F;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bc-step-btn:hover {
          background: #073B3F;
          color: #FFFFFF;
        }

        .bc-qty-input {
          width: 80px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #D6E2E1;
          background: #FFFFFF;
          text-align: center;
          font-size: 16px;
          font-weight: 800;
          color: #073B3F;
          outline: none;
        }

        .bc-btn-add {
          flex: 1;
          height: 42px;
          min-width: 160px;
          background: #073B3F;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.18);
        }

        .bc-btn-add:hover {
          background: #0C4E53;
        }

        .bc-cart-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(7, 59, 63, 0.04);
          position: sticky;
          top: 24px;
        }

        .bc-cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid #EDF3F2;
          margin-bottom: 14px;
        }

        .bc-cart-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bc-cart-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          max-height: 260px;
          overflow-y: auto;
        }

        .bc-cart-row {
          background: #F8FAFA;
          border: 1px solid #E4EBEA;
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .bc-cart-del {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          border-radius: 8px;
          padding: 4px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .bc-cart-del:hover {
          background: #DC2626;
          color: #FFFFFF;
        }

        .bc-summary-rows {
          border-top: 1px solid #EDF3F2;
          padding-top: 14px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bc-summary-line {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          color: #5C706E;
        }

        .bc-btn-submit {
          width: 100%;
          height: 44px;
          background: #073B3F;
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .bc-btn-submit:hover:not(:disabled) {
          background: #0C4E53;
        }

        .bc-btn-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .bc-alert {
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bc-alert.success {
          background: #E6F4EA;
          border: 1px solid #CEEAD6;
          color: #137333;
        }

        .bc-alert.error {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
        }

        .bc-rates {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
        .bc-rates-head {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 800;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .bc-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16A34A;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.16);
          animation: bcPulse 1.8s ease-in-out infinite;
        }
        @keyframes bcPulse { 50% { box-shadow: 0 0 0 6px rgba(22, 163, 74, 0.04); } }
        .bc-rates-date {
          text-transform: none;
          letter-spacing: 0;
          font-weight: 700;
          color: #A16207;
          background: #FEF9C3;
          padding: 1px 8px;
          border-radius: 999px;
        }
        .bc-rates-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .bc-rate-chip {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 118px;
          padding: 9px 14px;
          border-radius: 12px;
          background: linear-gradient(180deg, #FFFFFF, #F8FAFA);
          border: 1px solid #E1EBEA;
          border-top: 3px solid var(--metal-tone);
        }
        .bc-rate-name { font-size: 11px; font-weight: 700; color: #5C706E; }
        .bc-rate-val { font-size: 16px; font-weight: 800; color: #073B3F; }
        .bc-rate-val small { font-size: 11px; font-weight: 700; color: #7A8987; margin-left: 2px; }
        .bc-rate-val.muted { color: #9AA8A6; }
        .bc-rate-skel {
          height: 16px;
          width: 80px;
          border-radius: 6px;
          background: linear-gradient(90deg, #EEF3F3 25%, #F7FAFA 50%, #EEF3F3 75%);
          background-size: 200% 100%;
          animation: bcShimmer 1.2s linear infinite;
        }
        @keyframes bcShimmer { to { background-position: -200% 0; } }
        .bc-weight-btn.has-av { height: auto; min-height: 52px; flex-direction: column; gap: 3px; padding: 6px 4px; }
        .bc-av { font-size: 9.5px; font-weight: 800; padding: 1px 7px; border-radius: 999px; white-space: nowrap; }
        .bc-av.leader { background: #ECFDF5; color: #047857; }
        .bc-av.forward { background: #FDF3E4; color: #A0713F; }
        .bc-av.none { background: #F1F5F9; color: #94A3B8; }
        .bc-weight-btn.active .bc-av { background: rgba(255, 255, 255, 0.18); color: #FFFFFF; }
        .bc-av-note {
          display: flex; align-items: center; gap: 8px; margin: -12px 0 22px;
          padding: 9px 12px; border-radius: 10px; border: 1px solid; font-size: 12.5px; font-weight: 600;
        }
        .bc-av-note.leader { background: #ECFDF5; border-color: #A7F3D0; color: #065F46; }
        .bc-av-note.forward { background: #FFFAF1; border-color: rgba(187, 137, 88, 0.45); color: #8A5A2B; }
        .bc-av-note.none { background: #FFFBEB; border-color: #FDE68A; color: #92400E; }
        .bc-metal-rate {
          margin-top: 4px;
          font-size: 12.5px;
          font-weight: 800;
          color: #8A623D;
        }
        .bc-add-hint {
          margin-top: 10px;
          font-size: 12.5px;
          color: #5C706E;
          text-align: right;
        }
        .bc-add-hint b { color: #073B3F; font-size: 14px; }
        .bc-add-hint span { color: #7A8987; font-size: 11.5px; }
        .bc-cart-val {
          margin-left: auto;
          margin-right: 10px;
          font-size: 13px;
          font-weight: 800;
          color: #073B3F;
          white-space: nowrap;
        }
        .bc-summary-total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-top: 6px;
          padding-top: 10px;
          border-top: 1px dashed #D6E2E1;
          font-size: 13px;
          font-weight: 700;
          color: #073B3F;
        }
        .bc-summary-total b { font-size: 18px; font-weight: 800; }
        .bc-summary-note { font-size: 11px; color: #9AA8A6; text-align: right; }

        @media (max-width: 1024px) {
          .bc-breakdown-grid { grid-template-columns: repeat(3, 1fr); }
          .bc-grid { grid-template-columns: 1fr; }
          .bc-root { padding: 16px 16px 40px; }
        }

        @media (max-width: 600px) {
          .bc-overall-grid { grid-template-columns: 1fr; }
          .bc-breakdown-grid { grid-template-columns: repeat(2, 1fr); }
          .bc-metal-grid { grid-template-columns: 1fr; }
          .bc-header-card { flex-direction: column; align-items: flex-start; }
          .bc-header-actions { width: 100%; }
          .bc-rates { align-items: stretch; width: 100%; }
          .bc-rates-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .bc-rate-chip { min-width: 0; padding: 8px 10px; }
          .bc-rate-val { font-size: 14px; }
          .bc-add-hint { text-align: left; }
        }
      `}</style>

      <div className="bc-shell">
        {/* 4 Tabs Matching User's Image */}
        <CoinTabs activeTab="Add Coins" />

        {/* Executive Header Card */}
        <div className="bc-header-card">
          <div className="bc-header-info">
            <h1>
              <span>Add Coins</span>
              <span className="bc-badge">
                {role === "super_admin" ? "Direct Vault Deposit" : "Internal Request"}
              </span>
            </h1>
            <p className="bc-header-sub">
              {role === "super_admin"
                ? "Deposit coin inventory directly into vault stock."
                : `Submit coin requests to ${ROLE_TARGET[role] || "upstream authority"}.`}
            </p>
          </div>

          <div className="bc-rates">
            <div className="bc-rates-head">
              <span className="bc-live-dot" />
              {rates ? `${rateDateLabel === "Today" ? "Today's" : "Latest"} Rate` : "Today's Rate"}
              {rates && rateDateLabel !== "Today" && <span className="bc-rates-date">{rateDateLabel}</span>}
            </div>
            <div className="bc-rates-row">
              {METALS.map((m) => (
                <div key={m.key} className="bc-rate-chip" style={{ "--metal-tone": m.tone }}>
                  <span className="bc-rate-name">{m.label}</span>
                  {rates ? (
                    <span className="bc-rate-val">{inr(rateOf(m.key))}<small>/g</small></span>
                  ) : ratesFailed ? (
                    <span className="bc-rate-val muted">—</span>
                  ) : (
                    <span className="bc-rate-skel" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Metal-wise Breakdown Cards (22K, 24K, Silver Pieces & Weight) */}
        <div className="bc-breakdown-grid">
          {/* 22K Pieces */}
          <div className="bc-mini-card" style={{ borderLeft: "3px solid #073B3F" }}>
            <div className="bc-mini-header">
              <span className="bc-mini-label">22K Pieces</span>
              <CoinIcon size={14} color="#073B3F" />
            </div>
            <div className="bc-mini-value">{qty22k}</div>
            <div className="bc-mini-sub">Gold 22K (916)</div>
          </div>

          {/* 22K Net Weight */}
          <div className="bc-mini-card" style={{ borderLeft: "3px solid #073B3F" }}>
            <div className="bc-mini-header">
              <span className="bc-mini-label">22K Net Weight</span>
              <BullionIcon size={14} color="#073B3F" />
            </div>
            <div className="bc-mini-value">{formatWeight(weight22k)}</div>
            <div className="bc-mini-sub">Gold 22K weight</div>
          </div>

          {/* 24K Pieces */}
          <div className="bc-mini-card" style={{ borderLeft: "3px solid #0A5C63" }}>
            <div className="bc-mini-header">
              <span className="bc-mini-label">24K Pieces</span>
              <SparkleIcon size={14} color="#0A5C63" />
            </div>
            <div className="bc-mini-value">{qty24k}</div>
            <div className="bc-mini-sub">Gold 24K (999)</div>
          </div>

          {/* 24K Net Weight */}
          <div className="bc-mini-card" style={{ borderLeft: "3px solid #0A5C63" }}>
            <div className="bc-mini-header">
              <span className="bc-mini-label">24K Net Weight</span>
              <BullionIcon size={14} color="#0A5C63" />
            </div>
            <div className="bc-mini-value">{formatWeight(weight24k)}</div>
            <div className="bc-mini-sub">Gold 24K weight</div>
          </div>

          {/* Silver Pieces */}
          <div className="bc-mini-card" style={{ borderLeft: "3px solid #64748B" }}>
            <div className="bc-mini-header">
              <span className="bc-mini-label">Silver Pieces</span>
              <CoinIcon size={14} color="#64748B" />
            </div>
            <div className="bc-mini-value">{qtySilver}</div>
            <div className="bc-mini-sub">Silver 999</div>
          </div>

          {/* Silver Net Weight */}
          <div className="bc-mini-card" style={{ borderLeft: "3px solid #64748B" }}>
            <div className="bc-mini-header">
              <span className="bc-mini-label">Silver Net Weight</span>
              <BullionIcon size={14} color="#64748B" />
            </div>
            <div className="bc-mini-value">{formatWeight(weightSilver)}</div>
            <div className="bc-mini-sub">Silver 999 weight</div>
          </div>
        </div>

        {/* Form Workspace */}
        <div className="bc-grid">
          <div className="bc-panel">
            <div className="bc-section-title">1. Metal Bullion</div>
            <div className="bc-metal-grid">
              {METALS.map((m) => {
                const IconC = m.IconComponent;
                return (
                  <button
                    key={m.key}
                    type="button"
                    className={`bc-metal-btn ${metalType === m.key ? "active" : ""}`}
                    style={{
                      "--metal-tone": m.tone,
                      "--metal-bg": m.bg,
                    }}
                    onClick={() => handleSelectMetal(m.key)}
                  >
                    <div className="bc-metal-name">
                      <IconC size={16} color={m.tone} />
                      <span>{m.label}</span>
                    </div>
                    <div className="bc-metal-purity">{m.purity}</div>
                    {rates && rateOf(m.key) > 0 && (
                      <div className="bc-metal-rate">{inr(rateOf(m.key))} / g</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bc-section-title">2. Denomination Weight</div>
            <div className="bc-weight-grid">
              {availableWeights.map((w) => {
                const av = availabilityOf(metalType, w.label);
                return (
                  <button
                    key={w.label}
                    type="button"
                    className={`bc-weight-btn ${selectedWeight.label === w.label ? "active" : ""}${av ? " has-av" : ""}`}
                    onClick={() => setWeightLabel(w.label)}
                  >
                    <span>{w.label}</span>
                    {av && (
                      <span className={`bc-av ${av.kind}`}>
                        {av.kind === "leader" ? `${av.qty} ready` : av.kind === "forward" ? "Via forward" : "On request"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {catalog && (() => {
              const av = availabilityOf(metalType, selectedWeight.label);
              const leaderName = catalog.leader?.name || "your leader";
              const leaderRole = ROLE_NAME[catalog.leader?.role] || "";
              if (!av) return null;
              return (
                <div className={`bc-av-note ${av.kind}`}>
                  {av.kind === "leader" ? (
                    <><CheckIcon size={14} color="#047857" /> <span><b>{av.qty} pcs</b> with {leaderName}{leaderRole && ` (${leaderRole})`} · approves directly</span></>
                  ) : av.kind === "forward" ? (
                    <><SparkleIcon size={14} color="#A0713F" /> <span>Super Admin stock · {leaderName} will forward it up the chain</span></>
                  ) : (
                    <><ClockIcon size={14} color="#B45309" /> <span>Currently out of stock · request now, we'll send it to you once it's available</span></>
                  )}
                </div>
              );
            })()}

            <div className="bc-section-title">3. Quantity</div>
            <div className="bc-stepper-wrap">
              <button
                type="button"
                className="bc-step-btn"
                onClick={() => setQty((q) => Math.max(1, Number(q || 1) - 1))}
              >
                <MinusIcon size={14} color="#073B3F" />
              </button>
              <input
                type="text"
                className="bc-qty-input"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <button
                type="button"
                className="bc-step-btn"
                onClick={() => setQty((q) => Number(q || 1) + 1)}
              >
                <PlusIcon size={14} color="#073B3F" />
              </button>
              <button type="button" className="bc-btn-add" onClick={addItem}>
                <PlusIcon size={14} color="#FFFFFF" /> Add {qty} × {weightLabel} {selectedMetal.label}
              </button>
            </div>
            {rates && addPreviewValue > 0 && (
              <div className="bc-add-hint">
                {formatWeight(selectedWeight.grams * Math.max(1, Number(qty) || 1))} × {inr(rateOf(metalType))}/g ={" "}
                <b>{inr(addPreviewValue)}</b> <span>+ 3% GST</span>
              </div>
            )}
          </div>

          {/* Cart Card */}
          <aside className="bc-cart-card">
            <div className="bc-cart-header">
              <h2 className="bc-cart-title">
                <CartIcon size={16} color="#073B3F" /> Order Cart
              </h2>
              <span style={{ background: "#EFF6F6", color: "#073B3F", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>
                {cart.length} lines
              </span>
            </div>

            {msg && (
              <div className={`bc-alert ${msgType}`}>
                {msgType === "success" ? <CheckIcon size={14} color="#137333" /> : <WarningIcon size={14} color="#C92035" />}
                <span>{msg}</span>
              </div>
            )}

            {cart.length > 0 ? (
              <div className="bc-cart-items">
                {cart.map((item, index) => {
                  const mInfo = METALS.find((m) => m.key === item.metal_type) || METALS[0];
                  return (
                    <div className="bc-cart-row" key={`${item.metal_type}-${item.weight_label}-${index}`}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#111817" }}>
                          {mInfo.label} — {item.weight_label}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#7A8987" }}>
                          Qty: <b>{item.qty} pcs</b> ({formatWeight((item.weight_grams || 0) * item.qty)})
                        </div>
                      </div>
                      {rates && valueOf(item) > 0 && (
                        <span className="bc-cart-val">{inr(valueOf(item))}</span>
                      )}
                      <button
                        type="button"
                        className="bc-cart-del"
                        onClick={() => removeItem(index)}
                      >
                        <TrashIcon size={12} color="#DC2626" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 14px", color: "#7A8987", fontSize: "12.5px" }}>
                Cart is empty. Choose a metal and weight.
              </div>
            )}

            <div className="bc-summary-rows">
              <div className="bc-summary-line">
                <span>Total Pieces</span>
                <b style={{ color: "#073B3F" }}>{totalQty} pcs</b>
              </div>
              <div className="bc-summary-line">
                <span>Total Weight</span>
                <b style={{ color: "#073B3F" }}>{formatWeight(totalWeight)}</b>
              </div>
              {rates && totalValue > 0 && (
                <>
                  <div className="bc-summary-line">
                    <span>Metal Value</span>
                    <b style={{ color: "#073B3F" }}>{inr(totalValue)}</b>
                  </div>
                  <div className="bc-summary-line">
                    <span>GST (3%)</span>
                    <b style={{ color: "#073B3F" }}>{inr(totalValue * GST_RATE)}</b>
                  </div>
                  <div className="bc-summary-total">
                    <span>Est. Value</span>
                    <b>{inr(totalValue * (1 + GST_RATE))}</b>
                  </div>
                  <div className="bc-summary-note">At {rateDateLabel === "Today" ? "today's" : `${rateDateLabel}`} rate</div>
                </>
              )}
            </div>

            <button
              type="button"
              className="bc-btn-submit"
              disabled={submitting || !cart.length}
              onClick={submitRequest}
            >
              {submitting
                ? "Submitting..."
                : role === "super_admin"
                ? `Deposit ${totalQty} Coins`
                : `Submit Request (${totalQty} pcs)`}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}