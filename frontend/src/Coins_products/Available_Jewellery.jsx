import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import CoinTabs from "./CoinTabs";
import {
  JewelryIcon,
  PlusIcon,
  SearchIcon,
  InboxIcon,
  CheckIcon,
  CloseIcon,
  SparkleIcon,
  CoinIcon,
  CopyIcon,
  PhoneIcon,
  MailIcon,
  ArrowRightIcon,
} from "../components/SvgIcons";

const ROLE_BADGE_CONFIG = {
  super_admin: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", label: "Super Admin" },
  admin: { bg: "#F3E8FF", color: "#6B21A8", border: "#E9D5FF", label: "Admin" },
  dealer: { bg: "#E0F2FE", color: "#0369A1", border: "#BAE6FD", label: "Dealer" },
  sub_dealer: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0", label: "Sub Dealer" },
  promotor: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Promotor" },
};

export default function AvailableJewellery() {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem("role") || "";
  const isSuperAdmin = currentRole === "super_admin";

  // Scope: "vault" (My stock) | "hierarchy" (Team holdings across company)
  const [scope, setScope] = useState("vault");
  const [myStock, setMyStock] = useState([]);
  const [hierarchyStock, setHierarchyStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch logged in user's jewelry stock
  const fetchMyStock = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/jewelry-stock/");
      setMyStock(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Fallback: fetch internal products
      try {
        const pRes = await api.get("/jewelry-products/?internal=true");
        setMyStock((pRes.data || []).map((p) => ({ id: p.id, product: p, qty: p.stock_quantity })));
      } catch {
        setError("Failed to load available jewellery stock.");
      }
    }
    setLoading(false);
  };

  // Fetch team hierarchy holdings (Super Admin oversight)
  const fetchHierarchyStock = async () => {
    if (!isSuperAdmin) return;
    setHierarchyLoading(true);
    try {
      const res = await api.get("/jewelry-stock/?scope=hierarchy");
      setHierarchyStock(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load hierarchy jewellery holdings.");
    }
    setHierarchyLoading(false);
  };

  useEffect(() => {
    fetchMyStock();
    if (isSuperAdmin) {
      fetchHierarchyStock();
    }
  }, []);

  // Filtered my stock
  const filteredMyStock = useMemo(() => {
    return myStock.filter((s) => {
      const p = s.product;
      if (!p) return false;
      if (metalFilter !== "all" && p.metal?.toLowerCase() !== metalFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchCode = p.product_code?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCat) return false;
      }
      return true;
    });
  }, [myStock, metalFilter, search]);

  // Filtered hierarchy members
  const filteredHierarchy = useMemo(() => {
    return hierarchyStock.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = user.name?.toLowerCase().includes(q);
        const matchId = user.id_str?.toLowerCase().includes(q);
        const matchEmail = user.email?.toLowerCase().includes(q);
        const matchPhone = user.phone?.toLowerCase().includes(q);
        const matchItem = user.items?.some(
          (i) => i.name?.toLowerCase().includes(q) || i.product_code?.toLowerCase().includes(q)
        );
        if (!matchName && !matchId && !matchEmail && !matchPhone && !matchItem) return false;
      }
      return true;
    });
  }, [hierarchyStock, roleFilter, search]);

  // Hierarchy top aggregate stats
  const hierarchyAggregates = useMemo(() => {
    let totalPieces = 0;
    let gold22kPieces = 0;
    let gold22kGrams = 0;
    let gold24kPieces = 0;
    let gold24kGrams = 0;
    let silverPieces = 0;
    let silverGrams = 0;

    hierarchyStock.forEach((u) => {
      totalPieces += u.total_pieces || 0;
      u.items?.forEach((i) => {
        const m = (i.metal || "").toLowerCase();
        const g = (i.grade || "").toLowerCase();
        const qty = i.qty || 0;
        const netGrams = (parseFloat(i.net_weight) || 0) * qty;

        if (m === "gold" && g.includes("24")) {
          gold24kPieces += qty;
          gold24kGrams += netGrams;
        } else if (m === "gold") {
          gold22kPieces += qty;
          gold22kGrams += netGrams;
        } else if (m === "silver") {
          silverPieces += qty;
          silverGrams += netGrams;
        }
      });
    });

    return {
      totalPieces,
      gold22kPieces,
      gold22kGrams: gold22kGrams.toFixed(2),
      gold24kPieces,
      gold24kGrams: gold24kGrams.toFixed(2),
      silverPieces,
      silverGrams: silverGrams.toFixed(2),
    };
  }, [hierarchyStock]);

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
          max-width: 1280px;
          margin: 0 auto;
        }

        .aj-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
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

        .aj-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .aj-btn-add {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #073B3F 0%, #0C4E53 100%);
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 180ms ease;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.2);
        }

        .aj-btn-add:hover {
          transform: translateY(-1px);
        }

        /* Scope Switcher */
        .aj-scope-bar {
          display: flex;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 14px;
          padding: 5px;
          margin-bottom: 22px;
          box-shadow: 0 2px 10px rgba(7, 59, 63, 0.02);
          width: fit-content;
        }

        .aj-scope-btn {
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

        .aj-scope-btn.active {
          background: #073B3F;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.2);
        }

        /* Top 4 Stat Cards */
        .aj-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .aj-stat-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 2px 12px rgba(7, 59, 63, 0.03);
          transition: transform 180ms ease;
        }

        .aj-stat-card:hover {
          transform: translateY(-2px);
        }

        .aj-stat-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .aj-stat-val {
          font-size: 26px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
        }

        .aj-stat-sub {
          font-size: 12px;
          color: #7A8987;
          margin-top: 5px;
          font-weight: 600;
        }

        /* Filter Controls */
        .aj-controls-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 14px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .aj-search-wrap {
          flex: 1;
          min-width: 240px;
          position: relative;
        }

        .aj-search-input {
          width: 100%;
          padding: 9px 14px 9px 36px;
          background: #F8FAFA;
          border: 1px solid #D6E2E1;
          border-radius: 10px;
          font-size: 13.5px;
          outline: none;
          box-sizing: border-box;
        }

        .aj-search-input:focus {
          border-color: #073B3F;
          background: #FFFFFF;
        }

        .aj-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
        }

        .aj-select {
          padding: 8px 14px;
          background: #F8FAFA;
          border: 1px solid #D6E2E1;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #2C3E3D;
          outline: none;
        }

        /* Hierarchy Cards Grid */
        .aj-hierarchy-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }

        .aj-user-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.04);
          display: flex;
          flex-direction: column;
          transition: transform 180ms ease;
        }

        .aj-user-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 26px rgba(7, 59, 63, 0.08);
        }

        .aj-user-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .aj-user-id-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          background: #EFF6F6;
          border: 1px solid #CEE3E1;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 800;
          color: #073B3F;
          cursor: pointer;
        }

        .aj-user-name {
          font-size: 17px;
          font-weight: 800;
          color: #073B3F;
          margin: 6px 0 2px;
        }

        .aj-user-contacts {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #5C706E;
          margin-bottom: 14px;
        }

        .aj-user-contacts span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Two-tier Metrics Box */
        .aj-user-metrics {
          background: linear-gradient(135deg, #F0F7F6 0%, #E6F0EF 100%);
          border: 1px solid #D1E5E3;
          border-radius: 14px;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .aj-user-metrics div div:first-child {
          font-size: 11px;
          font-weight: 700;
          color: #5C706E;
          text-transform: uppercase;
        }

        .aj-user-metrics div div:last-child {
          font-size: 20px;
          font-weight: 800;
          color: #073B3F;
          margin-top: 2px;
        }

        /* Purity Pills */
        .aj-purity-row {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .aj-purity-pill {
          flex: 1;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 700;
          text-align: center;
        }

        .pill-gold-22k {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
        }

        .pill-gold-24k {
          background: #FEF9C3;
          color: #854D0E;
          border: 1px solid #FEF08A;
        }

        .pill-silver {
          background: #F1F5F9;
          color: #334155;
          border: 1px solid #E2E8F0;
        }

        /* Itemized list inside user card */
        .aj-user-items-box {
          background: #F8FAFA;
          border: 1px solid #EAEFEF;
          border-radius: 12px;
          padding: 10px 12px;
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .aj-mini-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          padding-bottom: 6px;
          border-bottom: 1px dashed #E1E8E8;
        }

        .aj-mini-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        /* Vault cards grid */
        .aj-vault-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .aj-vault-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.04);
          display: flex;
          flex-direction: column;
        }

        .aj-vault-img-box {
          height: 180px;
          background: #F8FAFA;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .aj-vault-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .aj-vault-body {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .aj-qty-tag {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 10px;
          border-radius: 8px;
          background: #073B3F;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .aj-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="aj-container">
        {/* Dual Hub Navigation */}
        <CoinTabs activeTab="Available Jewellery" />

        {/* Header */}
        <div className="aj-header">
          <div className="aj-header-left">
            <h1>
              <JewelryIcon size={26} color="#073B3F" /> Available Jewellery Holdings
            </h1>
            <p>
              {isSuperAdmin
                ? "Real-time audit of available jewellery assets, team vault custody, and allocation status."
                : "Your current in-hand available jewellery stock and custody holding."}
            </p>
          </div>
          <div className="aj-header-actions">
            <button
              type="button"
              className="aj-btn-add"
              onClick={() => navigate("/add-jewellery")}
            >
              <PlusIcon size={16} color="#FFFFFF" /> {isSuperAdmin ? "Add Jewellery" : "Buy Jewellery"}
            </button>
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "#FFFFFF",
                border: "1px solid #D6E2E1",
                borderRadius: "12px",
                color: "#073B3F",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={() => navigate("/jewellery-requests")}
            >
              <InboxIcon size={16} color="#073B3F" /> Requests Jewellery
            </button>
          </div>
        </div>

        {/* Super Admin Scope Toggle: Vault vs Hierarchy */}
        {isSuperAdmin && (
          <div className="aj-scope-bar">
            <button
              type="button"
              className={`aj-scope-btn ${scope === "vault" ? "active" : ""}`}
              onClick={() => setScope("vault")}
            >
              <SparkleIcon size={15} /> My Vault Stock ({myStock.length})
            </button>
            <button
              type="button"
              className={`aj-scope-btn ${scope === "hierarchy" ? "active" : ""}`}
              onClick={() => setScope("hierarchy")}
            >
              <JewelryIcon size={15} /> Team Holdings Hierarchy ({hierarchyStock.length} members)
            </button>
          </div>
        )}

        {/* Top 4 Stat Cards */}
        {scope === "hierarchy" && isSuperAdmin ? (
          <div className="aj-stats-grid">
            <div className="aj-stat-card" style={{ borderLeft: "4px solid #073B3F" }}>
              <div className="aj-stat-label">Total Jewellery in Team</div>
              <div className="aj-stat-val">{hierarchyAggregates.totalPieces.toLocaleString()} pcs</div>
              <div className="aj-stat-sub">Distributed across all roles</div>
            </div>

            <div className="aj-stat-card" style={{ borderLeft: "4px solid #D97706" }}>
              <div className="aj-stat-label">Gold 22K (916) Holdings</div>
              <div className="aj-stat-val">{hierarchyAggregates.gold22kPieces} pcs</div>
              <div className="aj-stat-sub">{hierarchyAggregates.gold22kGrams} g total net</div>
            </div>

            <div className="aj-stat-card" style={{ borderLeft: "4px solid #EAB308" }}>
              <div className="aj-stat-label">Gold 24K (999) Holdings</div>
              <div className="aj-stat-val">{hierarchyAggregates.gold24kPieces} pcs</div>
              <div className="aj-stat-sub">{hierarchyAggregates.gold24kGrams} g total net</div>
            </div>

            <div className="aj-stat-card" style={{ borderLeft: "4px solid #475569" }}>
              <div className="aj-stat-label">Silver 999 Holdings</div>
              <div className="aj-stat-val">{hierarchyAggregates.silverPieces} pcs</div>
              <div className="aj-stat-sub">{hierarchyAggregates.silverGrams} g total net</div>
            </div>
          </div>
        ) : (
          <div className="aj-stats-grid">
            <div className="aj-stat-card" style={{ borderLeft: "4px solid #073B3F" }}>
              <div className="aj-stat-label">My In-Hand Designs</div>
              <div className="aj-stat-val">{filteredMyStock.length} designs</div>
              <div className="aj-stat-sub">
                {filteredMyStock.reduce((s, i) => s + (i.qty || 0), 0)} total pieces
              </div>
            </div>

            <div className="aj-stat-card" style={{ borderLeft: "4px solid #D97706" }}>
              <div className="aj-stat-label">Gold Designs</div>
              <div className="aj-stat-val">
                {filteredMyStock.filter((s) => s.product?.metal?.toLowerCase() === "gold").length}
              </div>
              <div className="aj-stat-sub">Available in vault</div>
            </div>

            <div className="aj-stat-card" style={{ borderLeft: "4px solid #475569" }}>
              <div className="aj-stat-label">Silver Designs</div>
              <div className="aj-stat-val">
                {filteredMyStock.filter((s) => s.product?.metal?.toLowerCase() === "silver").length}
              </div>
              <div className="aj-stat-sub">Available in vault</div>
            </div>

            <div className="aj-stat-card" style={{ borderLeft: "4px solid #166534" }}>
              <div className="aj-stat-label">Status</div>
              <div className="aj-stat-val" style={{ color: "#166534", fontSize: "22px" }}>
                Active Stock
              </div>
              <div className="aj-stat-sub">Ready for allocation</div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="aj-controls-card">
          <div className="aj-search-wrap">
            <span className="aj-search-icon">
              <SearchIcon size={15} color="#7A8987" />
            </span>
            <input
              type="text"
              className="aj-search-input"
              placeholder={
                scope === "hierarchy"
                  ? "Search by member ID (BBPRO..., BBSUB...), Name, Phone, or Design..."
                  : "Search your jewellery designs by name, code, or category..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {scope === "hierarchy" ? (
            <select
              className="aj-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admins</option>
              <option value="dealer">Dealers</option>
              <option value="sub_dealer">Sub Dealers</option>
              <option value="promotor">Promotors</option>
            </select>
          ) : (
            <select
              className="aj-select"
              value={metalFilter}
              onChange={(e) => setMetalFilter(e.target.value)}
            >
              <option value="all">All Metals</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
            </select>
          )}
        </div>

        {/* VIEW 1: HIERARCHY TEAM CARDS */}
        {scope === "hierarchy" && isSuperAdmin ? (
          hierarchyLoading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#5C706E" }}>
              Loading team jewellery holdings...
            </div>
          ) : filteredHierarchy.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px dashed #D6E2E1",
                color: "#5C706E",
              }}
            >
              <JewelryIcon size={40} color="#B4CECC" style={{ marginBottom: "12px" }} />
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#073B3F" }}>
                No team members found
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "13.5px" }}>
                Adjust your search or role filter to view jewellery holdings.
              </p>
            </div>
          ) : (
            <div className="aj-hierarchy-grid">
              {filteredHierarchy.map((user) => {
                const roleBadge = ROLE_BADGE_CONFIG[user.role] || {
                  bg: "#F1F5F9",
                  color: "#334155",
                  border: "#E2E8F0",
                  label: user.role,
                };
                return (
                  <div key={user.user_id} className="aj-user-card">
                    <div className="aj-user-top">
                      <div>
                        {user.id_str && (
                          <div
                            className="aj-user-id-chip"
                            onClick={() => handleCopy(user.id_str, user.user_id)}
                          >
                            <span>{user.id_str}</span>
                            <CopyIcon size={12} color="#073B3F" />
                            {copiedId === user.user_id && (
                              <span style={{ color: "#166534", fontSize: "10px" }}>Copied!</span>
                            )}
                          </div>
                        )}
                        <h3 className="aj-user-name">{user.name}</h3>
                      </div>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "11.5px",
                          fontWeight: 800,
                          background: roleBadge.bg,
                          color: roleBadge.color,
                          border: `1px solid ${roleBadge.border}`,
                        }}
                      >
                        {roleBadge.label}
                      </span>
                    </div>

                    <div className="aj-user-contacts">
                      {user.phone && (
                        <span>
                          <PhoneIcon size={12} /> {user.phone}
                        </span>
                      )}
                      {user.email && (
                        <span>
                          <MailIcon size={12} /> {user.email}
                        </span>
                      )}
                    </div>

                    {/* Metrics Box */}
                    <div className="aj-user-metrics">
                      <div>
                        <div>Total Pieces</div>
                        <div>{user.total_pieces} pcs</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div>Gross / Net Weight</div>
                        <div>
                          {user.total_gross_grams}g / {user.total_net_grams}g
                        </div>
                      </div>
                    </div>

                    {/* Purity Pills */}
                    <div className="aj-purity-row">
                      <div className="aj-purity-pill pill-gold-22k">
                        22K: {user.gold_22k_pieces || 0} pcs
                      </div>
                      <div className="aj-purity-pill pill-gold-24k">
                        24K: {user.gold_24k_pieces || 0} pcs
                      </div>
                      <div className="aj-purity-pill pill-silver">
                        Silver: {user.silver_pieces || 0} pcs
                      </div>
                    </div>

                    {/* Itemized list */}
                    <div className="aj-user-items-box">
                      {user.items?.map((item, idx) => (
                        <div key={idx} className="aj-mini-item">
                          <div>
                            <strong style={{ color: "#073B3F" }}>{item.name}</strong>
                            <div style={{ fontSize: "11px", color: "#7A8987" }}>
                              {item.metal?.toUpperCase()} {item.grade} | Gross: {item.cross_weight}g
                            </div>
                          </div>
                          <div style={{ textAlign: "right", fontWeight: 800, color: "#073B3F" }}>
                            {item.qty} pcs
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* VIEW 2: MY VAULT INVENTORY */
          loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#5C706E" }}>
              Loading your available jewellery...
            </div>
          ) : filteredMyStock.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px dashed #D6E2E1",
                color: "#5C706E",
              }}
            >
              <JewelryIcon size={40} color="#B4CECC" style={{ marginBottom: "12px" }} />
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#073B3F" }}>
                No jewellery in your vault
              </div>
              <p style={{ margin: "6px 0 16px", fontSize: "13.5px" }}>
                Add new jewellery pieces to start building your internal stock inventory.
              </p>
              <button
                type="button"
                className="aj-btn-add"
                onClick={() => navigate("/add-jewellery")}
              >
                <PlusIcon size={16} color="#FFFFFF" /> Add First Jewellery Item
              </button>
            </div>
          ) : (
            <div className="aj-vault-grid">
              {filteredMyStock.map((s) => {
                const p = s.product;
                if (!p) return null;
                const imgUrl = p.images?.[0]?.image || null;
                const isGold = p.metal?.toLowerCase() === "gold";

                return (
                  <div key={s.id || p.id} className="aj-vault-card">
                    <div className="aj-vault-img-box">
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.name} />
                      ) : (
                        <JewelryIcon size={48} color="#B4CECC" />
                      )}
                      <span className="aj-qty-tag">{s.qty || p.stock_quantity || 0} pcs in vault</span>
                    </div>

                    <div className="aj-vault-body">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#5C706E" }}>
                          {p.product_code || `JWL-#${p.id}`}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: isGold ? "#FEF3C7" : "#F1F5F9",
                            color: isGold ? "#92400E" : "#334155",
                          }}
                        >
                          {p.grade?.toUpperCase() || p.metal?.toUpperCase()}
                        </span>
                      </div>

                      <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#073B3F", margin: "0 0 10px" }}>
                        {p.name}
                      </h4>

                      <div
                        style={{
                          background: "#F8FAFA",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#5C706E",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          Gross: <strong>{parseFloat(p.cross_weight || 0).toFixed(2)}g</strong>
                        </div>
                        <div>
                          Net: <strong>{parseFloat(p.net_weight || p.cross_weight || 0).toFixed(2)}g</strong>
                        </div>
                        <div>
                          Making: <strong>{p.making_charge || 0}%</strong>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "auto",
                          paddingTop: "10px",
                          borderTop: "1px solid #F0F4F4",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "17px", fontWeight: 800, color: "#073B3F" }}>
                            ₹{Number(p.price || 0).toLocaleString()}
                          </div>
                          <div style={{ fontSize: "11px", color: "#7A8987" }}>with 3% tax</div>
                        </div>

                        <button
                          type="button"
                          style={{
                            padding: "7px 14px",
                            background: "#EFF6F6",
                            border: "1px solid #CEE3E1",
                            borderRadius: "8px",
                            color: "#073B3F",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          onClick={() => navigate("/jewellery-requests")}
                        >
                          Request Flow
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
