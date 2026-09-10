import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { SkeletonText } from "../components/Skeleton";
import CoinTabs from "./CoinTabs";
import {
  CoinIcon,
  BullionIcon,
  SparkleIcon,
  PlusIcon,
  InboxIcon,
  HistoryIcon,
  SearchIcon,
  ArrowLeftIcon,
} from "../components/SvgIcons";

const METAL_THEMES = {
  gold_22k: {
    label: "Gold 22K",
    purity: "916 Hallmarked",
    color: "#B45309",
    bg: "#FEF3C7",
    border: "#FDE68A",
    cardAccent: "#D97706",
    IconComponent: CoinIcon,
  },
  gold_24k: {
    label: "Gold 24K",
    purity: "999 Fine Gold",
    color: "#92400E",
    bg: "#FDF6B2",
    border: "#FCE96A",
    cardAccent: "#B45309",
    IconComponent: SparkleIcon,
  },
  silver_999: {
    label: "Silver 999",
    purity: "999 Fine Silver",
    color: "#475569",
    bg: "#F1F5F9",
    border: "#CBD5E1",
    cardAccent: "#64748B",
    IconComponent: BullionIcon,
  },
};

export default function StoredCoins() {
  const navigate = useNavigate();
  const [coinStock, setCoinStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStock = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/coin-stock/");
      setCoinStock(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load coin inventory.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const totalCoins = coinStock.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
  const totalLines = coinStock.length;

  const grouped = ["gold_22k", "gold_24k", "silver_999"].map((m) => {
    const theme = METAL_THEMES[m];
    const items = coinStock.filter((s) => s.metal_type === m);
    const filteredItems = items.filter((s) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        s.weight_label?.toLowerCase().includes(q) ||
        theme.label.toLowerCase().includes(q)
      );
    });
    const groupTotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    return {
      metal: m,
      theme,
      items,
      filteredItems,
      groupTotal,
    };
  });

  const gold22Total = grouped.find((g) => g.metal === "gold_22k")?.groupTotal || 0;
  const gold24Total = grouped.find((g) => g.metal === "gold_24k")?.groupTotal || 0;
  const silver999Total = grouped.find((g) => g.metal === "silver_999")?.groupTotal || 0;

  return (
    <div className="sc-root">
      <style>{`
        .sc-root {
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

        .sc-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }

        .sc-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .sc-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5C706E;
        }

        .sc-breadcrumb .link {
          color: #073B3F;
          cursor: pointer;
          font-weight: 700;
          text-decoration: none;
        }

        .sc-breadcrumb .link:hover {
          text-decoration: underline;
        }

        .sc-back-btn {
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

        .sc-back-btn:hover {
          background: #F0F5F5;
          border-color: #073B3F;
          transform: translateX(-2px);
        }

        .sc-header-card {
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

        .sc-header-info h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sc-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #E6F4EA;
          color: #137333;
          border: 1px solid #CEEAD6;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
        }

        .sc-pulse-dot {
          width: 8px;
          height: 8px;
          background: #137333;
          border-radius: 50%;
          animation: scPulse 1.8s infinite;
        }

        @keyframes scPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(19, 115, 51, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(19, 115, 51, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(19, 115, 51, 0); }
        }

        .sc-header-sub {
          margin: 4px 0 0;
          color: #5C706E;
          font-size: 13px;
        }

        .sc-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sc-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: #073B3F;
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(7, 59, 63, 0.18);
          transition: all 180ms ease;
        }

        .sc-btn-primary:hover {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        .sc-btn-secondary {
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

        .sc-btn-secondary:hover {
          background: #F0F5F5;
          border-color: #073B3F;
        }

        .sc-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        .sc-stat-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 20px 24px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
          transition: transform 180ms ease;
        }

        .sc-stat-card:hover {
          transform: translateY(-2px);
        }

        .sc-stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .sc-stat-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .sc-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sc-stat-value {
          font-size: 30px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
          margin-bottom: 4px;
        }

        .sc-stat-sub {
          font-size: 12px;
          color: #7A8987;
          font-weight: 500;
        }

        .sc-controls-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 14px 20px;
          box-shadow: 0 2px 10px rgba(7, 59, 63, 0.02);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .sc-search-wrap {
          flex: 1;
          min-width: 260px;
          position: relative;
        }

        .sc-search-input {
          width: 100%;
          padding: 10px 36px 10px 38px;
          background: #F8FAFA;
          border: 1px solid #D6E2E1;
          border-radius: 12px;
          font-size: 13.5px;
          color: #111817;
          box-sizing: border-box;
          outline: none;
          transition: all 180ms ease;
        }

        .sc-search-input:focus {
          background: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.08);
        }

        .sc-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #7A8987;
          display: flex;
          align-items: center;
        }

        .sc-group-section {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
          margin-bottom: 24px;
        }

        .sc-group-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #EDF3F2;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .sc-group-title-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sc-group-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sc-group-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .sc-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
        }

        .sc-coin-card {
          background: #FDFDFD;
          border: 1px solid #E4EBEA;
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          transition: all 180ms ease;
          position: relative;
          overflow: hidden;
        }

        .sc-coin-card:hover {
          transform: translateY(-2px);
          border-color: #073B3F;
          box-shadow: 0 6px 18px rgba(7, 59, 63, 0.06);
          background: #FFFFFF;
        }

        .sc-coin-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--accent-bar);
        }

        .sc-coin-weight {
          font-size: 17px;
          font-weight: 800;
          color: #111817;
          margin-bottom: 2px;
        }

        .sc-coin-meta {
          font-size: 11.5px;
          color: #7A8987;
          font-weight: 600;
          text-transform: uppercase;
        }

        .sc-coin-qty {
          font-size: 26px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
        }

        .sc-coin-unit {
          font-size: 11px;
          color: #7A8987;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 2px;
        }

        @media (max-width: 1024px) {
          .sc-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .sc-root { padding: 16px 16px 40px; }
        }

        @media (max-width: 600px) {
          .sc-stats-grid { grid-template-columns: 1fr; }
          .sc-header-card { flex-direction: column; align-items: flex-start; }
          .sc-header-actions { width: 100%; }
        }
      `}</style>

      <div className="sc-shell">
        {/* Topbar */}
        <div className="sc-topbar">
          <button className="sc-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={14} color="#073B3F" /> Back
          </button>
        </div>

        {/* 4 Tabs Matching User's Image */}
        <CoinTabs activeTab="Available Coins" />

        {/* Executive Header Card */}
        <div className="sc-header-card">
          <div className="sc-header-info">
            <h1>
              Available Coins
              <span className="sc-live-badge">
                <span className="sc-pulse-dot" /> Live Vault
              </span>
            </h1>
            <p className="sc-header-sub">
              Vault coin stock across purity and denomination weights.
            </p>
          </div>
          <div className="sc-header-actions">
            <button className="sc-btn-secondary" onClick={() => navigate("/coin-requests-page")}>
              <InboxIcon size={15} color="#073B3F" /> Requests Coins
            </button>
            <button className="sc-btn-secondary" onClick={() => navigate("/coin-transactions")}>
              <HistoryIcon size={15} color="#073B3F" /> Transactions
            </button>
            <button className="sc-btn-primary" onClick={() => navigate("/buy-coin")}>
              <PlusIcon size={15} color="#FFFFFF" /> Add Coins
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="sc-stats-grid">
          <div className="sc-stat-card" style={{ borderLeft: "4px solid #073B3F" }}>
            <div className="sc-stat-header">
              <span className="sc-stat-label">Total Stock</span>
              <div className="sc-stat-icon" style={{ background: "#EFF6F6", color: "#073B3F" }}>
                <CoinIcon size={18} color="#073B3F" />
              </div>
            </div>
            <div className="sc-stat-value">
              {loading ? <SkeletonText width="60px" height="30px" /> : totalCoins.toLocaleString()}
            </div>
            <div className="sc-stat-sub">{totalLines} weights</div>
          </div>

          <div className="sc-stat-card" style={{ borderLeft: "4px solid #D97706" }}>
            <div className="sc-stat-header">
              <span className="sc-stat-label">Gold 22K</span>
              <div className="sc-stat-icon" style={{ background: "#FEF3C7", color: "#B45309" }}>
                <CoinIcon size={18} color="#B45309" />
              </div>
            </div>
            <div className="sc-stat-value">
              {loading ? <SkeletonText width="60px" height="30px" /> : gold22Total.toLocaleString()}
            </div>
            <div className="sc-stat-sub">916 Hallmarked</div>
          </div>

          <div className="sc-stat-card" style={{ borderLeft: "4px solid #B45309" }}>
            <div className="sc-stat-header">
              <span className="sc-stat-label">Gold 24K</span>
              <div className="sc-stat-icon" style={{ background: "#FDF6B2", color: "#92400E" }}>
                <SparkleIcon size={18} color="#92400E" />
              </div>
            </div>
            <div className="sc-stat-value">
              {loading ? <SkeletonText width="60px" height="30px" /> : gold24Total.toLocaleString()}
            </div>
            <div className="sc-stat-sub">999 Pure Bullion</div>
          </div>

          <div className="sc-stat-card" style={{ borderLeft: "4px solid #64748B" }}>
            <div className="sc-stat-header">
              <span className="sc-stat-label">Silver 999</span>
              <div className="sc-stat-icon" style={{ background: "#F1F5F9", color: "#475569" }}>
                <BullionIcon size={18} color="#475569" />
              </div>
            </div>
            <div className="sc-stat-value">
              {loading ? <SkeletonText width="60px" height="30px" /> : silver999Total.toLocaleString()}
            </div>
            <div className="sc-stat-sub">Fine Silver</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="sc-controls-card">
          <div className="sc-search-wrap">
            <span className="sc-search-icon">
              <SearchIcon size={15} color="#7A8987" />
            </span>
            <input
              type="text"
              className="sc-search-input"
              placeholder="Search weight or metal (e.g. 100 mg, 1 gm)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span style={{ fontSize: "12.5px", color: "#5C706E", fontWeight: 700 }}>
            {grouped.reduce((sum, g) => sum + g.filteredItems.length, 0)} weights available
          </span>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="sc-group-section">
            <SkeletonText width="160px" height="20px" />
            <div className="sc-cards-grid" style={{ marginTop: "16px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="sc-coin-card" style={{ "--accent-bar": "#D6E2E1" }}>
                  <SkeletonText width="60px" height="18px" />
                  <SkeletonText width="30px" height="24px" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grouped Stock Sections */}
        {!loading &&
          grouped.map((group) => {
            const IconComp = group.theme.IconComponent;
            return (
              <section className="sc-group-section" key={group.metal}>
                <div className="sc-group-head">
                  <div className="sc-group-title-box">
                    <h2 className="sc-group-title">
                      <IconComp size={18} color={group.theme.cardAccent} />
                      <span>{group.theme.label}</span>
                    </h2>
                  </div>
                  <span
                    className="sc-group-pill"
                    style={{
                      background: group.theme.bg,
                      color: group.theme.color,
                      border: `1px solid ${group.theme.border}`,
                    }}
                  >
                    {group.groupTotal.toLocaleString()} pcs
                  </span>
                </div>

                {group.filteredItems.length > 0 ? (
                  <div className="sc-cards-grid">
                    {group.filteredItems.map((s) => (
                      <article
                        className="sc-coin-card"
                        key={s.id || `${s.metal_type}-${s.weight_label}`}
                        style={{ "--accent-bar": group.theme.cardAccent }}
                      >
                        <div>
                          <div className="sc-coin-weight">{s.weight_label}</div>
                          <div className="sc-coin-meta">{group.theme.label}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="sc-coin-qty">{s.qty}</div>
                          <div className="sc-coin-unit">Available</div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "30px", color: "#7A8987", fontSize: "13px" }}>
                    No {group.theme.label} stock found.
                  </div>
                )}
              </section>
            );
          })}
      </div>
    </div>
  );
}
