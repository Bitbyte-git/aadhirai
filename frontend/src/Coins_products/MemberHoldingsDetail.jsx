import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import {
  CoinIcon,
  JewelryIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CopyIcon,
  CheckIcon,
  PhoneIcon,
  MailIcon,
  SparkleIcon,
  SearchIcon,
  EyeIcon,
} from "../components/SvgIcons";

const ROLE_CONFIG = {
  super_admin: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", label: "Super Admin" },
  admin: { bg: "#F3E8FF", color: "#6B21A8", border: "#E9D5FF", label: "Admin" },
  dealer: { bg: "#E0F2FE", color: "#0369A1", border: "#BAE6FD", label: "Dealer" },
  sub_dealer: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0", label: "Sub Dealer" },
  promotor: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Promotor" },
  shop: { bg: "#FFF7ED", color: "#C2410C", border: "#FFEDD5", label: "Shop" },
};

export default function MemberHoldingsDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'coins' | 'jewellery'
  const [search, setSearch] = useState("");
  const [metalFilter, setMetalFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .get(`/member-holdings/${userId}/`)
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load member holdings:", err);
          setError(err.response?.data?.error || "Failed to load member holdings details.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const member = data?.member || {};
  const rates = data?.today_rates || {};
  const coins = data?.coins || { items: [], summary: {} };
  const jewellery = data?.jewellery || { items: [], summary: {} };
  const portfolio = data?.portfolio_summary || {};

  const roleBadge = ROLE_CONFIG[member.role] || {
    bg: "#F1F5F9",
    color: "#334155",
    border: "#CBD5E1",
    label: member.role || "Member",
  };

  // Filtered Coins
  const filteredCoins = useMemo(() => {
    return (coins.items || []).filter((item) => {
      if (metalFilter === "gold" && !item.metal_type?.includes("gold")) return false;
      if (metalFilter === "silver" && !item.metal_type?.includes("silver")) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchLabel = item.metal_label?.toLowerCase().includes(q);
        const matchWt = item.weight_label?.toLowerCase().includes(q);
        if (!matchLabel && !matchWt) return false;
      }
      return true;
    });
  }, [coins.items, metalFilter, search]);

  // Filtered Jewellery
  const filteredJewellery = useMemo(() => {
    return (jewellery.items || []).filter((item) => {
      if (metalFilter === "gold" && item.metal?.toLowerCase() !== "gold") return false;
      if (metalFilter === "silver" && item.metal?.toLowerCase() !== "silver") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchCode = item.product_code?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCat) return false;
      }
      return true;
    });
  }, [jewellery.items, metalFilter, search]);

  if (loading) {
    return (
      <div className="mhd-page">
        <div className="mhd-container">
          <div className="mhd-loading-box">
            <div className="mhd-spinner" />
            <p>Loading member asset holdings & live today's valuation...</p>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mhd-page">
        <div className="mhd-container">
          <button className="mhd-btn-back" onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={16} /> Back
          </button>
          <div className="mhd-error-box">
            <h3>Unable to load member holdings</h3>
            <p>{error || "Member record not found"}</p>
            <button className="mhd-btn-retry" onClick={() => navigate("/available-coins")}>
              Return to Coins Dashboard
            </button>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="mhd-page">
      <div className="mhd-container">
        {/* Navigation & Header */}
        <div className="mhd-header-nav">
          <button className="mhd-btn-back" onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={15} />
            <span>Back to Holdings</span>
          </button>
          <div className="mhd-breadcrumb">
            <span>Holdings</span>
            <span className="mhd-sep">/</span>
            <span className="mhd-current">{member.name}</span>
          </div>
        </div>

        {/* Member Profile Hero Banner */}
        <section className="mhd-hero-card">
          <div className="mhd-hero-left">
            <div className="mhd-avatar-badge">
              {member.name ? member.name.charAt(0).toUpperCase() : "M"}
            </div>
            <div>
              <div className="mhd-hero-top-row">
                <span
                  className="mhd-role-pill"
                  style={{
                    background: roleBadge.bg,
                    color: roleBadge.color,
                    border: `1px solid ${roleBadge.border}`,
                  }}
                >
                  {roleBadge.label}
                </span>

                {member.id_str && (
                  <span
                    className="mhd-id-chip"
                    onClick={() => handleCopy(member.id_str)}
                    title="Click to copy member ID"
                  >
                    <span>{member.id_str}</span>
                    {copiedId ? (
                      <CheckIcon size={12} color="#166534" />
                    ) : (
                      <CopyIcon size={12} color="#5C706E" />
                    )}
                  </span>
                )}
              </div>

              <h1 className="mhd-hero-name">{member.name}</h1>

              <div className="mhd-hero-contacts">
                {member.phone && (
                  <div className="mhd-contact-item">
                    <PhoneIcon size={13} color="#073B3F" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="mhd-contact-item">
                    <MailIcon size={13} color="#073B3F" />
                    <span>{member.email}</span>
                  </div>
                )}
                {(member.city || member.district) && (
                  <div className="mhd-contact-item">
                    <span style={{ fontSize: "12px", color: "#5C706E" }}>📍</span>
                    <span>{[member.city, member.district, member.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Rates Ticker Box on Right */}
          <div className="mhd-rates-box">
            <div className="mhd-rates-header">
              <SparkleIcon size={14} color="#D97706" />
              <span>TODAY'S APPLIED RATES</span>
              <span className="mhd-live-pulse" />
            </div>
            <div className="mhd-rates-grid">
              <div className="mhd-rate-item">
                <span className="mhd-rate-lbl">Gold 22K (916)</span>
                <span className="mhd-rate-val">₹{Number(rates.gold_22k || 0).toLocaleString()} /g</span>
              </div>
              <div className="mhd-rate-item">
                <span className="mhd-rate-lbl">Gold 24K (999)</span>
                <span className="mhd-rate-val">₹{Number(rates.gold_24k || 0).toLocaleString()} /g</span>
              </div>
              <div className="mhd-rate-item">
                <span className="mhd-rate-lbl">Silver 999</span>
                <span className="mhd-rate-val">₹{Number(rates.silver_999 || 0).toLocaleString()} /g</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Executive Metric Cards */}
        <section className="mhd-metrics-grid">
          {/* Card 1: Combined Portfolio */}
          <div className="mhd-metric-card highlight">
            <div className="mhd-metric-header">
              <span className="mhd-metric-label">TOTAL ASSET VALUATION</span>
              <span className="mhd-metric-badge">All In-Hand</span>
            </div>
            <div className="mhd-metric-val main">
              ₹{Number(portfolio.total_asset_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mhd-metric-sub">
              <span><strong>{portfolio.total_all_pieces || 0}</strong> Total Pieces</span>
              <span className="mhd-sub-dot">•</span>
              <span><strong>{Number(portfolio.total_weight_grams || 0).toFixed(2)}</strong> gm Total Weight</span>
            </div>
          </div>

          {/* Card 2: Coins Asset */}
          <div className="mhd-metric-card">
            <div className="mhd-metric-header">
              <span className="mhd-metric-label">COINS VALUATION</span>
              <div className="mhd-mini-icon-box">
                <CoinIcon size={16} color="#D97706" />
              </div>
            </div>
            <div className="mhd-metric-val coins">
              ₹{Number(portfolio.coins_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mhd-metric-sub">
              <span><strong>{coins.summary?.total_pieces || 0}</strong> pcs in hand</span>
              <span className="mhd-sub-dot">•</span>
              <span><strong>{Number(coins.summary?.total_grams || 0).toFixed(2)}</strong> gm</span>
            </div>
          </div>

          {/* Card 3: Jewellery Asset */}
          <div className="mhd-metric-card">
            <div className="mhd-metric-header">
              <span className="mhd-metric-label">JEWELLERY VALUATION</span>
              <div className="mhd-mini-icon-box">
                <JewelryIcon size={16} color="#0C8A7B" />
              </div>
            </div>
            <div className="mhd-metric-val jewels">
              ₹{Number(portfolio.jewellery_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mhd-metric-sub">
              <span><strong>{jewellery.summary?.total_pieces || 0}</strong> pcs ({jewellery.summary?.total_designs || 0} designs)</span>
              <span className="mhd-sub-dot">•</span>
              <span><strong>{Number(jewellery.summary?.total_net_grams || 0).toFixed(2)}</strong> gm Net</span>
            </div>
          </div>
        </section>

        {/* Tab Selection Bar & Search */}
        <div className="mhd-control-bar">
          <div className="mhd-tabs">
            <button
              className={`mhd-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Assets ({((coins.items?.length || 0) + (jewellery.items?.length || 0))})
            </button>
            <button
              className={`mhd-tab-btn ${activeTab === "coins" ? "active" : ""}`}
              onClick={() => setActiveTab("coins")}
            >
              <CoinIcon size={15} />
              <span>Coins Breakdown ({coins.items?.length || 0})</span>
            </button>
            <button
              className={`mhd-tab-btn ${activeTab === "jewellery" ? "active" : ""}`}
              onClick={() => setActiveTab("jewellery")}
            >
              <JewelryIcon size={15} />
              <span>Jewellery Breakdown ({jewellery.items?.length || 0})</span>
            </button>
          </div>

          <div className="mhd-filters">
            <div className="mhd-search-box">
              <SearchIcon size={14} color="#7A8987" />
              <input
                type="text"
                placeholder="Search coin denomination or jewellery..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="mhd-select"
              value={metalFilter}
              onChange={(e) => setMetalFilter(e.target.value)}
            >
              <option value="all">All Metals</option>
              <option value="gold">Gold Only</option>
              <option value="silver">Silver Only</option>
            </select>
          </div>
        </div>

        {/* SECTION 1: COINS BREAKDOWN */}
        {(activeTab === "all" || activeTab === "coins") && (
          <section className="mhd-section">
            <div className="mhd-section-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="mhd-section-icon gold">
                  <CoinIcon size={18} color="#D97706" />
                </div>
                <div>
                  <h2 className="mhd-section-title">Coin Holdings & Today's Valuation</h2>
                  <p className="mhd-section-desc">
                    Calculated live: Total Weight (grams) × Today's Metal Spot Rate
                  </p>
                </div>
              </div>

              <div className="mhd-purity-pills">
                <span className="mhd-purity-pill g22">
                  22K: {coins.summary?.gold_22k?.pieces || 0} pcs ({coins.summary?.gold_22k?.grams || 0}g) = ₹{Number(coins.summary?.gold_22k?.valuation || 0).toLocaleString()}
                </span>
                <span className="mhd-purity-pill slv">
                  Silver: {coins.summary?.silver?.pieces || 0} pcs ({coins.summary?.silver?.grams || 0}g) = ₹{Number(coins.summary?.silver?.valuation || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {filteredCoins.length === 0 ? (
              <div className="mhd-empty-card">
                No coin holdings match the active filter for this member.
              </div>
            ) : (
              <div className="mhd-coins-grid">
                {filteredCoins.map((item) => {
                  const isSilver = item.metal_type?.includes("silver");
                  return (
                    <div className="mhd-coin-item-card" key={item.id}>
                      <div className="mhd-cic-top">
                        <div className="mhd-cic-name-box">
                          <span
                            className="mhd-cic-dot"
                            style={{ background: isSilver ? "#94A3B8" : "#D97706" }}
                          />
                          <div>
                            <span className="mhd-cic-name">{item.metal_label}</span>
                            <div className="mhd-cic-weight-tag">{item.weight_label}</div>
                          </div>
                        </div>
                        <span className="mhd-cic-qty-badge">{item.qty} pcs</span>
                      </div>

                      <div className="mhd-cic-specs-row">
                        <div>
                          <span className="mhd-cic-sublabel">Unit Weight</span>
                          <span className="mhd-cic-subval">{item.unit_weight_grams} g</span>
                        </div>
                        <div>
                          <span className="mhd-cic-sublabel">Total Weight</span>
                          <span className="mhd-cic-subval weight">{item.total_weight_grams} g</span>
                        </div>
                        <div>
                          <span className="mhd-cic-sublabel">Today's Rate</span>
                          <span className="mhd-cic-subval">₹{Number(item.rate_per_gram || 0).toLocaleString()} /g</span>
                        </div>
                      </div>

                      {/* Formula & Live Calculated Valuation */}
                      <div className="mhd-cic-calc-box">
                        <div className="mhd-cic-calc-formula">
                          <span>Formula: {item.total_weight_grams}g × ₹{Number(item.rate_per_gram || 0).toLocaleString()}</span>
                        </div>
                        <div className="mhd-cic-calc-result">
                          <span className="mhd-cic-calc-lbl">Today's Value</span>
                          <span className="mhd-cic-calc-amount">
                            ₹{Number(item.total_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SECTION 2: JEWELLERY BREAKDOWN */}
        {(activeTab === "all" || activeTab === "jewellery") && (
          <section className="mhd-section" style={{ marginTop: "32px" }}>
            <div className="mhd-section-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="mhd-section-icon green">
                  <JewelryIcon size={18} color="#0C8A7B" />
                </div>
                <div>
                  <h2 className="mhd-section-title">Jewellery Holdings & Live Itemized Pricing</h2>
                  <p className="mhd-section-desc">
                    Calculated live: (Net Weight × Today's Rate + Making Charges) + 3% GST
                  </p>
                </div>
              </div>

              <div className="mhd-purity-pills">
                <span className="mhd-purity-pill green">
                  {jewellery.summary?.total_pieces || 0} Pieces ({jewellery.summary?.total_net_grams || 0}g Net)
                </span>
                <span className="mhd-purity-pill g22">
                  Total Value: ₹{Number(jewellery.summary?.total_valuation || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {filteredJewellery.length === 0 ? (
              <div className="mhd-empty-card">
                No jewellery items held by this member.
              </div>
            ) : (
              <div className="mhd-jewels-grid">
                {filteredJewellery.map((item) => {
                  const firstImg = item.images?.[0] || null;
                  return (
                    <div className="mhd-jewel-card" key={item.id}>
                      <div className="mhd-jc-top">
                        {/* Thumbnail */}
                        <div className="mhd-jc-img-box">
                          {firstImg ? (
                            <img src={firstImg} alt={item.name} />
                          ) : (
                            <JewelryIcon size={36} color="#B4CECC" />
                          )}
                          <span className="mhd-jc-stock-tag">{item.qty} pcs in hand</span>
                        </div>

                        {/* Title & Metadata */}
                        <div className="mhd-jc-content">
                          <div className="mhd-jc-code-row">
                            <span className="mhd-jc-code">{item.product_code}</span>
                            <span className="mhd-jc-grade-pill">{item.grade} {item.metal?.toUpperCase()}</span>
                          </div>

                          <h3 className="mhd-jc-title">{item.name}</h3>

                          <div className="mhd-jc-specs-grid">
                            <div className="mhd-jc-spec">
                              <span>Gross Wt:</span>
                              <strong>{Number(item.gross_weight || 0).toFixed(2)}g</strong>
                            </div>
                            <div className="mhd-jc-spec">
                              <span>Net Wt:</span>
                              <strong>{Number(item.net_weight || 0).toFixed(2)}g</strong>
                            </div>
                            <div className="mhd-jc-spec">
                              <span>Making:</span>
                              <strong>{item.making_charge_pct}%</strong>
                            </div>
                            <div className="mhd-jc-spec">
                              <span>Today's Rate:</span>
                              <strong>₹{Number(item.rate_per_gram || 0).toLocaleString()}/g</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live Valuation Breakdown Formula Box */}
                      <div className="mhd-jc-calc-box">
                        <div className="mhd-jc-formula-title">Live Valuation Breakdown (Today's Spot Rate):</div>
                        <div className="mhd-jc-calc-steps">
                          <div className="mhd-step-row">
                            <span>Base Metal ({item.net_weight}g × ₹{Number(item.rate_per_gram || 0).toLocaleString()}):</span>
                            <span>₹{Number(item.base_metal_cost || 0).toLocaleString()}</span>
                          </div>
                          <div className="mhd-step-row">
                            <span>Making Charges ({item.making_charge_pct}%):</span>
                            <span>+₹{Number(item.making_charge_cost || 0).toLocaleString()}</span>
                          </div>
                          <div className="mhd-step-row">
                            <span>GST (3%):</span>
                            <span>+₹{Number(item.gst_3pct || 0).toLocaleString()}</span>
                          </div>
                          <div className="mhd-step-row bold">
                            <span>Unit Live Price (incl. tax):</span>
                            <span>₹{Number(item.unit_price || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="mhd-jc-total-row">
                          <div>
                            <span className="mhd-jc-total-lbl">Member's Holding ({item.qty} pcs):</span>
                            <div className="mhd-jc-total-val">
                              ₹{Number(item.total_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>

                          <button
                            className="mhd-btn-view-spec"
                            onClick={() => navigate(`/jewellery-stock-detail/${item.product_id}`)}
                            title="View complete design specs and company vault stock"
                          >
                            <span>Full Details</span>
                            <ArrowRightIcon size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.mhd-page {
  min-height: 100vh;
  background: #F4F8F8;
  padding: 24px 32px 60px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #111817;
}

.mhd-container {
  max-width: 1240px;
  margin: 0 auto;
}

.mhd-loading-box, .mhd-error-box {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 60px 24px;
  text-align: center;
  margin-top: 40px;
  border: 1px solid #E1EBEA;
  box-shadow: 0 4px 16px rgba(7, 59, 63, 0.04);
}

.mhd-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #E1EBEA;
  border-top-color: #073B3F;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: mhdSpin 0.7s linear infinite;
}

@keyframes mhdSpin {
  to { transform: rotate(360deg); }
}

.mhd-header-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.mhd-btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid #D6E2E1;
  color: #073B3F;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
  box-shadow: 0 2px 6px rgba(7, 59, 63, 0.04);
}

.mhd-btn-back:hover {
  background: #F0F6F5;
  transform: translateX(-2px);
}

.mhd-breadcrumb {
  font-size: 13.5px;
  color: #7A8987;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mhd-sep {
  color: #B4CECC;
}

.mhd-current {
  color: #073B3F;
  font-weight: 700;
}

/* Hero Card */
.mhd-hero-card {
  background: #FFFFFF;
  border: 1.5px solid #E1EBEA;
  border-radius: 20px;
  padding: 24px 28px;
  margin-bottom: 24px;
  box-shadow: 0 3px 16px rgba(7, 59, 63, 0.04);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.mhd-hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 280px;
}

.mhd-avatar-badge {
  width: 68px;
  height: 68px;
  border-radius: 18px;
  background: linear-gradient(135deg, #073B3F 0%, #0C4E53 100%);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(7, 59, 63, 0.2);
}

.mhd-hero-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.mhd-role-pill {
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mhd-id-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 8px;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  font-size: 11.5px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 150ms ease;
}

.mhd-id-chip:hover {
  background: #E2E8F0;
}

.mhd-hero-name {
  font-size: 22px;
  font-weight: 800;
  color: #073B3F;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.mhd-hero-contacts {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.mhd-contact-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4A5D5A;
  font-weight: 500;
}

/* Rates Box */
.mhd-rates-box {
  background: #FFFBEB;
  border: 1.5px solid #FDE68A;
  border-radius: 16px;
  padding: 14px 18px;
  min-width: 260px;
}

.mhd-rates-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  color: #92400E;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.mhd-live-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #16A34A;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.25);
  margin-left: auto;
}

.mhd-rates-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mhd-rate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12.5px;
}

.mhd-rate-lbl {
  color: #78350F;
  font-weight: 600;
}

.mhd-rate-val {
  color: #92400E;
  font-weight: 800;
}

/* 3 Metrics Cards */
.mhd-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.mhd-metric-card {
  background: #FFFFFF;
  border: 1.5px solid #E1EBEA;
  border-radius: 18px;
  padding: 20px 22px;
  box-shadow: 0 2px 10px rgba(7, 59, 63, 0.03);
  transition: all 180ms ease;
}

.mhd-metric-card.highlight {
  background: linear-gradient(135deg, #073B3F 0%, #0C4E53 100%);
  border-color: #073B3F;
  color: #FFFFFF;
  box-shadow: 0 6px 20px rgba(7, 59, 63, 0.2);
}

.mhd-metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mhd-metric-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #5C706E;
  text-transform: uppercase;
}

.mhd-metric-card.highlight .mhd-metric-label {
  color: #A3D1CE;
}

.mhd-metric-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

.mhd-mini-icon-box {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #F0F7F6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mhd-metric-val {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 8px;
}

.mhd-metric-val.main {
  color: #FFFFFF;
}

.mhd-metric-val.coins {
  color: #D97706;
}

.mhd-metric-val.jewels {
  color: #0C8A7B;
}

.mhd-metric-sub {
  font-size: 12px;
  color: #5C706E;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mhd-metric-card.highlight .mhd-metric-sub {
  color: #D6EDE9;
}

.mhd-sub-dot {
  opacity: 0.6;
}

/* Control Bar */
.mhd-control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.mhd-tabs {
  display: flex;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid #E1EBEA;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 1px 6px rgba(7, 59, 63, 0.02);
}

.mhd-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #5C706E;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
}

.mhd-tab-btn.active {
  background: #073B3F;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(7, 59, 63, 0.16);
}

.mhd-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.mhd-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid #D6E2E1;
  border-radius: 10px;
  padding: 7px 12px;
  min-width: 240px;
}

.mhd-search-box input {
  border: none;
  outline: none;
  font-size: 13px;
  color: #111817;
  background: transparent;
  width: 100%;
}

.mhd-select {
  padding: 7px 12px;
  background: #FFFFFF;
  border: 1px solid #D6E2E1;
  border-radius: 10px;
  font-size: 13px;
  color: #073B3F;
  font-weight: 700;
  cursor: pointer;
}

/* Sections */
.mhd-section {
  background: #FFFFFF;
  border: 1.5px solid #E1EBEA;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 14px rgba(7, 59, 63, 0.03);
}

.mhd-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 14px;
}

.mhd-section-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mhd-section-icon.gold {
  background: #FEF3C7;
}

.mhd-section-icon.green {
  background: #E6F4F2;
}

.mhd-section-title {
  font-size: 17px;
  font-weight: 800;
  color: #073B3F;
  margin: 0 0 3px;
}

.mhd-section-desc {
  font-size: 12.5px;
  color: #5C706E;
  margin: 0;
}

.mhd-purity-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mhd-purity-pill {
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
}

.mhd-purity-pill.g22 {
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #FDE68A;
}

.mhd-purity-pill.slv {
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #E2E8F0;
}

.mhd-purity-pill.green {
  background: #ECFDF5;
  color: #047857;
  border: 1px solid #A7F3D0;
}

.mhd-empty-card {
  text-align: center;
  padding: 40px;
  color: #7A8987;
  font-size: 14px;
}

/* Coins Grid */
.mhd-coins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.mhd-coin-item-card {
  background: #F8FAFA;
  border: 1.5px solid #E1EBEA;
  border-radius: 14px;
  padding: 16px;
  transition: all 150ms ease;
}

.mhd-coin-item-card:hover {
  border-color: #073B3F;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(7, 59, 63, 0.06);
}

.mhd-cic-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mhd-cic-name-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mhd-cic-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mhd-cic-name {
  font-size: 13.5px;
  font-weight: 800;
  color: #073B3F;
  display: block;
}

.mhd-cic-weight-tag {
  font-size: 11px;
  font-weight: 600;
  color: #7A8987;
}

.mhd-cic-qty-badge {
  font-size: 12px;
  font-weight: 800;
  background: #E6F4F2;
  color: #073B3F;
  padding: 3px 8px;
  border-radius: 6px;
}

.mhd-cic-specs-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid #E8EFF0;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 12px;
}

.mhd-cic-sublabel {
  font-size: 10.5px;
  color: #7A8987;
  display: block;
  margin-bottom: 2px;
}

.mhd-cic-subval {
  font-size: 12.5px;
  font-weight: 700;
  color: #073B3F;
}

.mhd-cic-subval.weight {
  color: #D97706;
}

.mhd-cic-calc-box {
  background: #FEF9C3;
  border: 1px solid #FDE047;
  border-radius: 10px;
  padding: 10px 12px;
}

.mhd-cic-calc-formula {
  font-size: 11px;
  color: #854D0E;
  font-weight: 600;
  margin-bottom: 4px;
}

.mhd-cic-calc-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mhd-cic-calc-lbl {
  font-size: 11.5px;
  font-weight: 700;
  color: #713F12;
}

.mhd-cic-calc-amount {
  font-size: 15.5px;
  font-weight: 800;
  color: #713F12;
}

/* Jewels Grid */
.mhd-jewels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.mhd-jewel-card {
  background: #F8FAFA;
  border: 1.5px solid #E1EBEA;
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 150ms ease;
}

.mhd-jewel-card:hover {
  border-color: #073B3F;
  box-shadow: 0 6px 18px rgba(7, 59, 63, 0.08);
}

.mhd-jc-top {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}

.mhd-jc-img-box {
  width: 90px;
  height: 90px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid #D6E2E1;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mhd-jc-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mhd-jc-stock-tag {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  background: rgba(7, 59, 63, 0.85);
  color: #FFFFFF;
  font-size: 9.5px;
  font-weight: 800;
  text-align: center;
  padding: 2px;
  border-radius: 4px;
}

.mhd-jc-content {
  flex: 1;
  min-width: 0;
}

.mhd-jc-code-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.mhd-jc-code {
  font-size: 11px;
  font-weight: 800;
  color: #5C706E;
}

.mhd-jc-grade-pill {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  background: #FEF3C7;
  color: #92400E;
}

.mhd-jc-title {
  font-size: 15px;
  font-weight: 800;
  color: #073B3F;
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mhd-jc-specs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 10px;
  font-size: 11.5px;
  color: #5C706E;
}

.mhd-jc-spec strong {
  color: #073B3F;
  margin-left: 3px;
}

/* Jewel Calculation Box */
.mhd-jc-calc-box {
  background: #FFFFFF;
  border: 1px solid #E1EBEA;
  border-radius: 12px;
  padding: 12px 14px;
}

.mhd-jc-formula-title {
  font-size: 10.5px;
  font-weight: 800;
  color: #0C8A7B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.mhd-jc-calc-steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #4A5D5A;
  padding-bottom: 10px;
  border-bottom: 1px dashed #E1EBEA;
  margin-bottom: 10px;
}

.mhd-step-row {
  display: flex;
  justify-content: space-between;
}

.mhd-step-row.bold {
  font-weight: 800;
  color: #073B3F;
  margin-top: 2px;
}

.mhd-jc-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mhd-jc-total-lbl {
  font-size: 11px;
  font-weight: 700;
  color: #5C706E;
  display: block;
}

.mhd-jc-total-val {
  font-size: 18px;
  font-weight: 800;
  color: #073B3F;
}

.mhd-btn-view-spec {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  background: #E6F4F2;
  border: 1px solid #C4E5E1;
  color: #073B3F;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
}

.mhd-btn-view-spec:hover {
  background: #073B3F;
  color: #FFFFFF;
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .mhd-metrics-grid {
    grid-template-columns: 1fr;
  }
  .mhd-jewels-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .mhd-page {
    padding: 16px 16px 40px;
  }
  .mhd-hero-card {
    padding: 16px;
  }
  .mhd-avatar-badge {
    width: 52px;
    height: 52px;
    font-size: 22px;
  }
  .mhd-hero-name {
    font-size: 18px;
  }
  .mhd-control-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .mhd-tabs {
    flex-direction: column;
  }
  .mhd-filters {
    flex-direction: column;
    align-items: stretch;
  }
  .mhd-search-box {
    min-width: 100%;
  }
}
`;
