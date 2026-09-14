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
  EyeIcon,
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
  const [hierarchyPurityFilter, setHierarchyPurityFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    return `https://bitbyte-backend-f66f.onrender.com/${url.replace(/^\/+/, "")}`;
  };

  // Fetch logged in user's jewelry stock
  const fetchMyStock = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/jewelry-stock/");
      let data = Array.isArray(res.data) ? res.data : [];
      if (data.length === 0 && isSuperAdmin) {
        // Fallback for Super Admin: load internal master assets directly
        const pRes = await api.get("/jewelry-products/?internal=true");
        data = (pRes.data || [])
          .filter((p) => Number(p.stock_quantity) > 0)
          .map((p) => ({ id: p.id, product: p, qty: Number(p.stock_quantity) }));
      }
      setMyStock(data);
    } catch {
      // Fallback: fetch internal products
      try {
        const pRes = await api.get("/jewelry-products/?internal=true");
        setMyStock(
          (pRes.data || [])
            .filter((p) => Number(p.stock_quantity) > 0)
            .map((p) => ({ id: p.id, product: p, qty: Number(p.stock_quantity) }))
        );
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
    } catch (err) {
      console.error("Failed to load hierarchy jewellery holdings:", err);
      setHierarchyStock([]);
    } finally {
      setHierarchyLoading(false);
    }
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
    return hierarchyStock
      .filter((user) => {
        if (roleFilter !== "all" && user.role !== roleFilter) return false;

        // Purity filter from top stat button cards
        if (hierarchyPurityFilter === "gold_22k") {
          if (!user.gold_22k_pieces || user.gold_22k_pieces <= 0) return false;
        } else if (hierarchyPurityFilter === "gold_24k") {
          if (!user.gold_24k_pieces || user.gold_24k_pieces <= 0) return false;
        } else if (hierarchyPurityFilter === "silver_999") {
          if (!user.silver_pieces || user.silver_pieces <= 0) return false;
        }

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
      })
      .map((user) => {
        if (hierarchyPurityFilter === "all") return user;
        const matchingItems = (user.items || []).filter((i) => {
          const m = (i.metal || "").toLowerCase();
          const g = (i.grade || "").toLowerCase();
          if (hierarchyPurityFilter === "gold_22k") {
            return m === "gold" && !g.includes("24");
          } else if (hierarchyPurityFilter === "gold_24k") {
            return m === "gold" && g.includes("24");
          } else if (hierarchyPurityFilter === "silver_999") {
            return m === "silver";
          }
          return true;
        });
        return {
          ...user,
          items: matchingItems,
        };
      });
  }, [hierarchyStock, roleFilter, hierarchyPurityFilter, search]);

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
          border: 1.5px solid #E1EBEA;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 2px 12px rgba(7, 59, 63, 0.03);
          transition: all 180ms ease;
          cursor: pointer;
          position: relative;
          user-select: none;
        }

        .aj-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(7, 59, 63, 0.08);
          border-color: #073B3F;
        }

        .aj-stat-card.active {
          border-color: #073B3F !important;
          box-shadow: 0 6px 22px rgba(7, 59, 63, 0.14);
          background: #F8FBFB;
        }

        .aj-stat-card.active::after {
          content: "Active Filter ✓";
          position: absolute;
          top: 12px;
          right: 14px;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          background: #073B3F;
          color: #FFFFFF;
          letter-spacing: 0.02em;
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

        {/* Top 4 Stat Cards as Clickable Filter Buttons */}
        {scope === "hierarchy" && isSuperAdmin ? (
          <div className="aj-stats-grid">
            <div
              className={`aj-stat-card ${hierarchyPurityFilter === "all" ? "active" : ""}`}
              style={{ borderLeft: "4px solid #073B3F" }}
              onClick={() => setHierarchyPurityFilter("all")}
              title="Click to view all team jewellery holdings"
            >
              <div className="aj-stat-label">Total Jewellery in Team</div>
              <div className="aj-stat-val">{hierarchyAggregates.totalPieces.toLocaleString()} pcs</div>
              <div className="aj-stat-sub">Distributed across all roles • Click to view all</div>
            </div>

            <div
              className={`aj-stat-card ${hierarchyPurityFilter === "gold_22k" ? "active" : ""}`}
              style={{ borderLeft: "4px solid #D97706" }}
              onClick={() => setHierarchyPurityFilter(hierarchyPurityFilter === "gold_22k" ? "all" : "gold_22k")}
              title="Click to filter only Gold 22K holdings"
            >
              <div className="aj-stat-label">Gold 22K (916) Holdings</div>
              <div className="aj-stat-val">{hierarchyAggregates.gold22kPieces} pcs</div>
              <div className="aj-stat-sub">{hierarchyAggregates.gold22kGrams} g total net • Click to filter</div>
            </div>

            <div
              className={`aj-stat-card ${hierarchyPurityFilter === "gold_24k" ? "active" : ""}`}
              style={{ borderLeft: "4px solid #EAB308" }}
              onClick={() => setHierarchyPurityFilter(hierarchyPurityFilter === "gold_24k" ? "all" : "gold_24k")}
              title="Click to filter only Gold 24K holdings"
            >
              <div className="aj-stat-label">Gold 24K (999) Holdings</div>
              <div className="aj-stat-val">{hierarchyAggregates.gold24kPieces} pcs</div>
              <div className="aj-stat-sub">{hierarchyAggregates.gold24kGrams} g total net • Click to filter</div>
            </div>

            <div
              className={`aj-stat-card ${hierarchyPurityFilter === "silver_999" ? "active" : ""}`}
              style={{ borderLeft: "4px solid #475569" }}
              onClick={() => setHierarchyPurityFilter(hierarchyPurityFilter === "silver_999" ? "all" : "silver_999")}
              title="Click to filter only Silver 999 holdings"
            >
              <div className="aj-stat-label">Silver 999 Holdings</div>
              <div className="aj-stat-val">{hierarchyAggregates.silverPieces} pcs</div>
              <div className="aj-stat-sub">{hierarchyAggregates.silverGrams} g total net • Click to filter</div>
            </div>
          </div>
        ) : (
          <div className="aj-stats-grid">
            <div
              className={`aj-stat-card ${metalFilter === "all" ? "active" : ""}`}
              style={{ borderLeft: "4px solid #073B3F" }}
              onClick={() => setMetalFilter("all")}
              title="Click to show all vault designs"
            >
              <div className="aj-stat-label">My In-Hand Designs</div>
              <div className="aj-stat-val">{myStock.length} designs</div>
              <div className="aj-stat-sub">
                {myStock.reduce((s, i) => s + (i.qty || 0), 0)} total pieces • Click to view all
              </div>
            </div>

            <div
              className={`aj-stat-card ${metalFilter === "gold" ? "active" : ""}`}
              style={{ borderLeft: "4px solid #D97706" }}
              onClick={() => setMetalFilter(metalFilter === "gold" ? "all" : "gold")}
              title="Click to filter Gold designs"
            >
              <div className="aj-stat-label">Gold Designs</div>
              <div className="aj-stat-val">
                {myStock.filter((s) => s.product?.metal?.toLowerCase() === "gold").length}
              </div>
              <div className="aj-stat-sub">Available in vault • Click to filter</div>
            </div>

            <div
              className={`aj-stat-card ${metalFilter === "silver" ? "active" : ""}`}
              style={{ borderLeft: "4px solid #475569" }}
              onClick={() => setMetalFilter(metalFilter === "silver" ? "all" : "silver")}
              title="Click to filter Silver designs"
            >
              <div className="aj-stat-label">Silver Designs</div>
              <div className="aj-stat-val">
                {myStock.filter((s) => s.product?.metal?.toLowerCase() === "silver").length}
              </div>
              <div className="aj-stat-sub">Available in vault • Click to filter</div>
            </div>

            <div
              className="aj-stat-card"
              style={{ borderLeft: "4px solid #166534" }}
              onClick={() => setMetalFilter("all")}
              title="All stock is active and ready for allocation"
            >
              <div className="aj-stat-label">Status</div>
              <div className="aj-stat-val" style={{ color: "#166534", fontSize: "22px" }}>
                Active Stock
              </div>
              <div className="aj-stat-sub">Ready for allocation • Click to reset</div>
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

                    {/* Itemized list with Product Thumbnail & Click to Preview */}
                    <div className="aj-user-items-box">
                      {user.items?.map((item, idx) => {
                        const imgUrl = getImageUrl(item.image);
                        return (
                          <div
                            key={idx}
                            className="aj-mini-item"
                            style={{ cursor: "pointer", transition: "all 150ms ease" }}
                            onClick={() =>
                              setPreviewItem({
                                ...item,
                                holder_name: user.name,
                                holder_role: user.role,
                                holder_id: user.id_str,
                                holder_phone: user.phone,
                              })
                            }
                            title="Click to view full photo and product details"
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                              {/* Product Thumbnail */}
                              <div
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "8px",
                                  overflow: "hidden",
                                  background: "#FFFFFF",
                                  border: "1px solid #D6E2E1",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                }}
                              >
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={item.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <JewelryIcon size={22} color="#0C8A7B" />
                                )}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <strong
                                  style={{
                                    color: "#073B3F",
                                    fontSize: "12.5px",
                                    display: "block",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {item.name}
                                </strong>
                                <div style={{ fontSize: "11px", color: "#7A8987", marginTop: "2px" }}>
                                  {item.metal?.toUpperCase()} {item.grade} | Gross: {item.cross_weight}g
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "3px 8px",
                                  background: "#E6F4F2",
                                  color: "#073B3F",
                                  borderRadius: "6px",
                                  fontWeight: 800,
                                  fontSize: "12px",
                                }}
                              >
                                {item.qty} pcs
                              </span>
                              <div
                                style={{
                                  fontSize: "10.5px",
                                  color: "#0C8A7B",
                                  marginTop: "3px",
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <EyeIcon size={12} color="#0C8A7B" />
                                <span>View Photo</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* FULL PRODUCT PREVIEW LIGHTBOX MODAL */}
      {previewItem && (
        <div
          className="aj-modal-backdrop"
          onClick={() => setPreviewItem(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(7, 30, 32, 0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 200ms ease",
          }}
        >
          <div
            className="aj-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              maxWidth: "520px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 220ms ease",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #EAF0F0",
                background: "#F8FAFA",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#0C8A7B", textTransform: "uppercase" }}>
                  Product Preview • {previewItem.product_code || `JWL-#${previewItem.product_id || previewItem.id}`}
                </div>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 800, color: "#073B3F" }}>
                  {previewItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{
                  background: "#EAF0F0",
                  border: "none",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#073B3F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#DDE7E7")}
                onMouseLeave={(e) => (e.target.style.background = "#EAF0F0")}
                title="Close preview"
              >
                <CloseIcon size={16} color="#073B3F" />
              </button>
            </div>

            {/* Modal Image Box */}
            <div
              style={{
                background: "#F4F7F7",
                height: "320px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {getImageUrl(previewItem.image) ? (
                <img
                  src={getImageUrl(previewItem.image)}
                  alt={previewItem.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    padding: "16px",
                  }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "#8E9E9C" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                    <JewelryIcon size={64} color="#0C8A7B" />
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: "13.5px", fontWeight: 600 }}>No high-resolution photo uploaded</p>
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  right: "14px",
                  background: "rgba(7, 59, 63, 0.88)",
                  color: "#FFFFFF",
                  padding: "5px 14px",
                  borderRadius: "20px",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                {previewItem.qty} pcs in custody
              </div>
            </div>

            {/* Modal Content & Specs */}
            <div style={{ padding: "20px" }}>
              {previewItem.holder_name && (
                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "10.5px", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                      CURRENT CUSTODY HOLDER
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#14532D" }}>
                      {previewItem.holder_name} ({previewItem.holder_id || previewItem.holder_role})
                    </div>
                  </div>
                  {previewItem.holder_phone && (
                    <div style={{ fontSize: "12px", color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                      <PhoneIcon size={13} color="#166534" />
                      <span>{previewItem.holder_phone}</span>
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ background: "#F8FAFA", border: "1px solid #EAEFEF", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "10.5px", color: "#7A8987", fontWeight: 700 }}>METAL & PURITY</div>
                  <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#073B3F", marginTop: "4px" }}>
                    {previewItem.metal?.toUpperCase()} {previewItem.grade}
                  </div>
                </div>
                <div style={{ background: "#F8FAFA", border: "1px solid #EAEFEF", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "10.5px", color: "#7A8987", fontWeight: 700 }}>GROSS / NET WT</div>
                  <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#073B3F", marginTop: "4px" }}>
                    {previewItem.cross_weight}g / {previewItem.net_weight || previewItem.cross_weight}g
                  </div>
                </div>
                <div style={{ background: "#F8FAFA", border: "1px solid #EAEFEF", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "10.5px", color: "#7A8987", fontWeight: 700 }}>CATEGORY</div>
                  <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#073B3F", marginTop: "4px" }}>
                    {previewItem.category || "Jewellery"}
                  </div>
                </div>
              </div>

              {previewItem.price > 0 && (
                <div
                  style={{
                    background: "#F4F8F8",
                    borderRadius: "10px",
                    padding: "8px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "#5C706E", fontWeight: 600 }}>Approx. Unit Value:</span>
                  <strong style={{ color: "#073B3F", fontSize: "15px" }}>₹{Number(previewItem.price).toLocaleString()}</strong>
                </div>
              )}

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #073B3F 0%, #0C4E53 100%)",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(7, 59, 63, 0.2)",
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
