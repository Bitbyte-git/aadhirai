import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { SkeletonText } from "../components/Skeleton";
import {
  JewelryIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SparkleIcon,
  CopyIcon,
  CheckIcon,
  PhoneIcon,
  UsersIcon,
} from "../components/SvgIcons";

const ROLE_BADGES = {
  super_admin: { bg: "#FEF3C7", color: "#92400E", label: "Super Admin" },
  admin: { bg: "#F3E8FF", color: "#6B21A8", label: "Admin" },
  dealer: { bg: "#E0F2FE", color: "#0369A1", label: "Dealer" },
  sub_dealer: { bg: "#ECFDF5", color: "#047857", label: "Sub Dealer" },
  promotor: { bg: "#EFF6FF", color: "#1D4ED8", label: "Promotor" },
};

export default function JewelryStockDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .get(`/jewellery-stock-detail/${productId}/`)
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load jewellery stock detail:", err);
          setError(err.response?.data?.error || "Jewellery product details not found.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="jsd-page">
        <div className="jsd-container">
          <div className="jsd-main-grid">
            <div className="jsd-gallery-col">
              <div className="jsd-main-img-card" style={{ background: "#EAEFEF" }} />
              <div className="jsd-gallery-metrics">
                <div className="jsd-gm-item">
                  <SkeletonText width="70%" height="10px" />
                  <div style={{ marginTop: 6 }}><SkeletonText width="50%" height="16px" /></div>
                </div>
                <div className="jsd-gm-item">
                  <SkeletonText width="70%" height="10px" />
                  <div style={{ marginTop: 6 }}><SkeletonText width="60%" height="16px" /></div>
                </div>
              </div>
            </div>
            <div className="jsd-details-col">
              <SkeletonText width="140px" height="26px" />
              <div style={{ marginTop: 16 }}><SkeletonText width="65%" height="32px" /></div>
              <div style={{ marginTop: 10 }}><SkeletonText width="100%" height="14px" /></div>
              <div style={{ marginTop: 24 }}><SkeletonText width="100%" height="180px" /></div>
            </div>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="jsd-page">
        <div className="jsd-container">
          <button className="jsd-btn-back" onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={15} /> Back
          </button>
          <div className="jsd-error-card">
            <h3>Product Detail Not Available</h3>
            <p>{error || "Unable to locate jewellery stock record."}</p>
            <button className="jsd-btn-primary" onClick={() => navigate("/available-jewellery")}>
              Return to Available Jewellery
            </button>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const p = data.product || {};
  const rate = data.today_rate || {};
  const vb = data.valuation_breakdown || {};
  const holders = data.stock_holders || [];
  const images = p.images || [];
  const activeImg = images[selectedImgIdx] || images[0] || null;

  const isGold = (p.metal || "").toLowerCase() === "gold";

  return (
    <div className="jsd-page">
      <div className="jsd-container">
        {/* Navigation / Breadcrumb */}
        <div className="jsd-nav-row">
          <button className="jsd-btn-back" onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={15} />
            <span>Back to Jewellery</span>
          </button>
          <div className="jsd-breadcrumb">
            <span>Jewellery Vault</span>
            <span className="jsd-sep">/</span>
            <span>{p.category || "Jewellery"}</span>
            <span className="jsd-sep">/</span>
            <span className="jsd-current">{p.name}</span>
          </div>
        </div>

        {/* Main Product Showcase Grid */}
        <div className="jsd-main-grid">
          {/* Left Column: Visual Gallery & Vault Tag */}
          <div className="jsd-gallery-col">
            <div className="jsd-main-img-card">
              {activeImg ? (
                <img src={activeImg} alt={p.name} className="jsd-main-img" />
              ) : (
                <div className="jsd-img-placeholder">
                  <JewelryIcon size={80} color="#B4CECC" />
                  <span>No image uploaded</span>
                </div>
              )}

              {/* Vault In-Stock Overlay Badge */}
              <div className="jsd-vault-badge">
                <span className="jsd-vb-dot" />
                <span><strong>{vb.vault_stock_qty || 0} pcs</strong> in Super Admin Vault</span>
              </div>
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="jsd-thumbs-row">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`jsd-thumb-btn ${selectedImgIdx === idx ? "active" : ""}`}
                    onClick={() => setSelectedImgIdx(idx)}
                  >
                    <img src={img} alt={`View ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Metrics Under Image */}
            <div className="jsd-gallery-metrics">
              <div className="jsd-gm-item">
                <span className="jsd-gm-label">Total Company Stock</span>
                <span className="jsd-gm-val">{vb.total_company_stock_qty || 0} pcs</span>
              </div>
              <div className="jsd-gm-item">
                <span className="jsd-gm-label">Company Asset Valuation</span>
                <span className="jsd-gm-val highlight">
                  ₹{Number(vb.total_company_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Specs & Today's Valuation Breakdown */}
          <div className="jsd-details-col">
            {/* Top Bar: Code chip + Karat pill */}
            <div className="jsd-header-bar">
              <div
                className="jsd-code-chip"
                onClick={() => handleCopyCode(p.product_code)}
                title="Click to copy Product Code"
              >
                <span>{p.product_code || `JWL-#${p.id}`}</span>
                {copiedCode ? <CheckIcon size={12} color="#166534" /> : <CopyIcon size={12} color="#5C706E" />}
              </div>

              <div className="jsd-pills-wrap">
                <span
                  className="jsd-karat-pill"
                  style={{
                    background: isGold ? "#FEF3C7" : "#F1F5F9",
                    color: isGold ? "#92400E" : "#334155",
                    border: `1px solid ${isGold ? "#FDE68A" : "#CBD5E1"}`,
                  }}
                >
                  {p.karat_label || `${p.grade} ${p.metal}`}
                </span>
                <span className="jsd-cat-pill">{p.category}</span>
              </div>
            </div>

            <h1 className="jsd-title">{p.name}</h1>
            {p.description && <p className="jsd-desc">{p.description}</p>}

            {/* LIVE VALUATION CARD BASED ON TODAY'S METAL RATE */}
            <div className="jsd-valuation-box">
              <div className="jsd-vb-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <SparkleIcon size={16} color="#D97706" />
                  <span className="jsd-vb-title">TODAY'S RATE VALUATION</span>
                </div>
                <div className="jsd-live-rate-tag">
                  Applied: ₹{Number(vb.rate_applied || 0).toLocaleString()} /g ({p.karat_label})
                </div>
              </div>

              <div className="jsd-calc-lines">
                <div className="jsd-calc-row">
                  <span>Base Metal Cost ({vb.net_weight_grams}g × ₹{Number(vb.rate_applied || 0).toLocaleString()}):</span>
                  <span>₹{Number(vb.base_metal_cost || 0).toLocaleString()}</span>
                </div>
                <div className="jsd-calc-row">
                  <span>Making Charges ({vb.making_charge_pct}% of metal cost):</span>
                  <span>+₹{Number(vb.making_charge_cost || 0).toLocaleString()}</span>
                </div>
                {vb.wastage_charge_cost > 0 && (
                  <div className="jsd-calc-row">
                    <span>Wastage Charges ({vb.wastage_charge_pct}%):</span>
                    <span>+₹{Number(vb.wastage_charge_cost || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="jsd-calc-row sub">
                  <span>Subtotal (Pre-Tax):</span>
                  <span>₹{Number(vb.pre_tax_subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="jsd-calc-row">
                  <span>GST (3% on subtotal):</span>
                  <span>+₹{Number(vb.gst_3pct || 0).toLocaleString()}</span>
                </div>

                <div className="jsd-calc-divider" />

                <div className="jsd-calc-final-row">
                  <div>
                    <span className="jsd-final-lbl">Live Per-Piece Price (with 3% GST):</span>
                    <div className="jsd-final-price">
                      ₹{Number(vb.live_unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span className="jsd-final-lbl">Vault Valuation ({vb.vault_stock_qty} pcs):</span>
                    <div className="jsd-vault-total-price">
                      ₹{Number(vb.total_vault_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="jsd-specs-section">
              <h3 className="jsd-subheading">Technical Specifications</h3>
              <div className="jsd-specs-grid">
                <div className="jsd-spec-item">
                  <span className="jsd-spec-lbl">Gross Weight</span>
                  <span className="jsd-spec-val">{Number(p.gross_weight || 0).toFixed(3)} gm</span>
                </div>
                <div className="jsd-spec-item">
                  <span className="jsd-spec-lbl">Net Weight</span>
                  <span className="jsd-spec-val weight">{Number(p.net_weight || 0).toFixed(3)} gm</span>
                </div>
                <div className="jsd-spec-item">
                  <span className="jsd-spec-lbl">Stone Weight</span>
                  <span className="jsd-spec-val">{Number(p.stone_weight || 0).toFixed(3)} gm</span>
                </div>
                <div className="jsd-spec-item">
                  <span className="jsd-spec-lbl">Making Charges</span>
                  <span className="jsd-spec-val">{p.making_charge_pct}%</span>
                </div>
                <div className="jsd-spec-item">
                  <span className="jsd-spec-lbl">Metal / Grade</span>
                  <span className="jsd-spec-val">{p.metal?.toUpperCase()} {p.grade}</span>
                </div>
                <div className="jsd-spec-item">
                  <span className="jsd-spec-lbl">Internal Asset</span>
                  <span className="jsd-spec-val">{p.is_internal_asset ? "Yes (Vault Stock)" : "Storefront"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Stock Distribution Across Team */}
        <section className="jsd-holders-section">
          <div className="jsd-holders-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="jsd-holders-icon">
                <UsersIcon size={18} color="#073B3F" />
              </div>
              <div>
                <h2 className="jsd-holders-title">Stock Allocation Across Company & Team</h2>
                <p className="jsd-holders-desc">
                  Shows which admins, dealers, or vaults currently hold pieces of this design.
                </p>
              </div>
            </div>
          </div>

          {holders.length === 0 ? (
            <div className="jsd-no-holders">No current stock allocations recorded.</div>
          ) : (
            <div className="jsd-holders-grid">
              {holders.map((holder, idx) => {
                const badge = ROLE_BADGES[holder.role] || {
                  bg: "#F1F5F9",
                  color: "#334155",
                  label: holder.role,
                };
                return (
                  <div className="jsd-holder-card" key={idx}>
                    <div className="jsd-hc-top">
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "10.5px",
                              fontWeight: 800,
                              background: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                          {holder.id_str && (
                            <span style={{ fontSize: "11px", color: "#5C706E", fontWeight: 700 }}>
                              {holder.id_str}
                            </span>
                          )}
                        </div>
                        <h4 className="jsd-hc-name">{holder.name}</h4>
                      </div>

                      <span className="jsd-hc-qty">{holder.qty} pcs</span>
                    </div>

                    <div className="jsd-hc-bottom">
                      <div>
                        <span className="jsd-hc-sublbl">Holding Valuation</span>
                        <div className="jsd-hc-val">
                          ₹{Number(holder.holding_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      {holder.user_id && (
                        <button
                          className="jsd-btn-view-member"
                          onClick={() => navigate(`/member-holdings/${holder.user_id}`)}
                          title="View all holdings for this member"
                        >
                          <span>View Profile</span>
                          <ArrowRightIcon size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.jsd-page {
  min-height: 100vh;
  background: #F4F8F8;
  padding: 24px 32px 60px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #111817;
}

.jsd-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
}

.jsd-loading-card, .jsd-error-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 60px 24px;
  text-align: center;
  border: 1px solid #E1EBEA;
  box-shadow: 0 4px 16px rgba(7, 59, 63, 0.04);
}

.jsd-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #E1EBEA;
  border-top-color: #073B3F;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: jsdSpin 0.7s linear infinite;
}

@keyframes jsdSpin {
  to { transform: rotate(360deg); }
}

.jsd-nav-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.jsd-btn-back {
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

.jsd-btn-back:hover {
  background: #F0F6F5;
  transform: translateX(-2px);
}

.jsd-breadcrumb {
  font-size: 13.5px;
  color: #7A8987;
  display: flex;
  align-items: center;
  gap: 8px;
}

.jsd-sep {
  color: #B4CECC;
}

.jsd-current {
  color: #073B3F;
  font-weight: 700;
}

/* Main 2-column Grid */
.jsd-main-grid {
  display: grid;
  grid-template-columns: 460px 1fr;
  gap: 28px;
  margin-bottom: 32px;
}

/* Gallery Column */
.jsd-gallery-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.jsd-main-img-card {
  background: #FFFFFF;
  border: 1.5px solid #E1EBEA;
  border-radius: 20px;
  overflow: hidden;
  height: 440px;
  position: relative;
  box-shadow: 0 4px 18px rgba(7, 59, 63, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.jsd-main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease;
}

.jsd-main-img:hover {
  transform: scale(1.03);
}

.jsd-img-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #7A8987;
  font-size: 13px;
}

.jsd-vault-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(7, 59, 63, 0.92);
  backdrop-filter: blur(8px);
  color: #FFFFFF;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.jsd-vb-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34D399;
}

.jsd-thumbs-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.jsd-thumb-btn {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  border: 2px solid #E1EBEA;
  background: #FFFFFF;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  transition: all 150ms ease;
  flex-shrink: 0;
}

.jsd-thumb-btn.active {
  border-color: #073B3F;
  box-shadow: 0 0 0 2px rgba(7, 59, 63, 0.2);
}

.jsd-thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.jsd-gallery-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background: #FFFFFF;
  border: 1px solid #E1EBEA;
  border-radius: 16px;
  padding: 14px 16px;
}

.jsd-gm-item {
  display: flex;
  flex-direction: column;
}

.jsd-gm-label {
  font-size: 11px;
  font-weight: 700;
  color: #7A8987;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.jsd-gm-val {
  font-size: 16px;
  font-weight: 800;
  color: #073B3F;
}

.jsd-gm-val.highlight {
  color: #0C8A7B;
}

/* Details Column */
.jsd-details-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.jsd-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.jsd-code-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid #D6E2E1;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #073B3F;
  cursor: pointer;
}

.jsd-pills-wrap {
  display: flex;
  gap: 8px;
}

.jsd-karat-pill {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
}

.jsd-cat-pill {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  background: #F1F5F9;
  color: #475569;
}

.jsd-title {
  font-size: 26px;
  font-weight: 800;
  color: #073B3F;
  margin: 0;
  letter-spacing: -0.01em;
}

.jsd-desc {
  font-size: 13.5px;
  color: #5C706E;
  margin: 0;
  line-height: 1.5;
}

/* Valuation Box */
.jsd-valuation-box {
  background: #FFFDF5;
  border: 1.5px solid #FDE68A;
  border-radius: 18px;
  padding: 20px 22px;
  box-shadow: 0 4px 16px rgba(217, 119, 6, 0.06);
}

.jsd-vb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
}

.jsd-vb-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #92400E;
}

.jsd-live-rate-tag {
  font-size: 11.5px;
  font-weight: 800;
  background: #FEF3C7;
  color: #92400E;
  padding: 3px 8px;
  border-radius: 6px;
}

.jsd-calc-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #78350F;
}

.jsd-calc-row {
  display: flex;
  justify-content: space-between;
}

.jsd-calc-row.sub {
  font-weight: 700;
  color: #92400E;
  padding-top: 4px;
  border-top: 1px dashed #FDE68A;
}

.jsd-calc-divider {
  height: 1.5px;
  background: #FDE68A;
  margin: 10px 0;
}

.jsd-calc-final-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.jsd-final-lbl {
  font-size: 11px;
  font-weight: 700;
  color: #92400E;
  display: block;
  margin-bottom: 2px;
}

.jsd-final-price {
  font-size: 22px;
  font-weight: 800;
  color: #073B3F;
}

.jsd-vault-total-price {
  font-size: 22px;
  font-weight: 800;
  color: #D97706;
}

/* Specs Section */
.jsd-specs-section {
  background: #FFFFFF;
  border: 1.5px solid #E1EBEA;
  border-radius: 18px;
  padding: 20px 22px;
}

.jsd-subheading {
  font-size: 14px;
  font-weight: 800;
  color: #073B3F;
  margin: 0 0 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.jsd-specs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.jsd-spec-item {
  background: #F8FAFA;
  border: 1px solid #E8EFF0;
  border-radius: 10px;
  padding: 10px 12px;
}

.jsd-spec-lbl {
  font-size: 11px;
  color: #7A8987;
  display: block;
  margin-bottom: 3px;
}

.jsd-spec-val {
  font-size: 13.5px;
  font-weight: 800;
  color: #073B3F;
}

.jsd-spec-val.weight {
  color: #0C8A7B;
}

/* Holders Section */
.jsd-holders-section {
  background: #FFFFFF;
  border: 1.5px solid #E1EBEA;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 14px rgba(7, 59, 63, 0.03);
}

.jsd-holders-header {
  margin-bottom: 20px;
}

.jsd-holders-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #E6F4F2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.jsd-holders-title {
  font-size: 17px;
  font-weight: 800;
  color: #073B3F;
  margin: 0 0 2px;
}

.jsd-holders-desc {
  font-size: 12.5px;
  color: #5C706E;
  margin: 0;
}

.jsd-holders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.jsd-holder-card {
  background: #F8FAFA;
  border: 1.5px solid #E1EBEA;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  transition: all 150ms ease;
}

.jsd-holder-card:hover {
  border-color: #073B3F;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(7, 59, 63, 0.06);
}

.jsd-hc-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.jsd-hc-name {
  font-size: 14px;
  font-weight: 800;
  color: #073B3F;
  margin: 0;
}

.jsd-hc-qty {
  font-size: 13px;
  font-weight: 800;
  background: #E6F4F2;
  color: #073B3F;
  padding: 3px 8px;
  border-radius: 6px;
}

.jsd-hc-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 10px;
  border-top: 1px dashed #E1EBEA;
}

.jsd-hc-sublbl {
  font-size: 10.5px;
  color: #7A8987;
  display: block;
}

.jsd-hc-val {
  font-size: 14.5px;
  font-weight: 800;
  color: #073B3F;
}

.jsd-btn-view-member {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid #D6E2E1;
  color: #073B3F;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
}

.jsd-btn-view-member:hover {
  background: #073B3F;
  color: #FFFFFF;
}

.jsd-no-holders {
  text-align: center;
  padding: 30px;
  color: #7A8987;
  font-size: 13.5px;
}

/* Responsive */
@media (max-width: 980px) {
  .jsd-main-grid {
    grid-template-columns: 1fr;
  }
  .jsd-main-img-card {
    height: 360px;
  }
}

@media (max-width: 600px) {
  .jsd-page {
    padding: 16px 16px 40px;
  }
  .jsd-specs-grid {
    grid-template-columns: 1fr 1fr;
  }
  .jsd-title {
    font-size: 20px;
  }
}
`;
