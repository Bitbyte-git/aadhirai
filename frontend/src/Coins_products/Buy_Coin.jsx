import { useMemo, useState } from "react";
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
  super_admin: "Vault Inventory",
};

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
                  </button>
                );
              })}
            </div>

            <div className="bc-section-title">2. Denomination Weight</div>
            <div className="bc-weight-grid">
              {availableWeights.map((w) => (
                <button
                  key={w.label}
                  type="button"
                  className={`bc-weight-btn ${selectedWeight.label === w.label ? "active" : ""}`}
                  onClick={() => setWeightLabel(w.label)}
                >
                  {w.label}
                </button>
              ))}
            </div>

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