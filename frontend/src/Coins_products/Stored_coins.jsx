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
  UsersIcon,
  PhoneIcon,
  MailIcon,
  CopyIcon,
  CheckIcon,
  ShieldIcon,
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

const COIN_METAL_LABELS_TEXT = {
  gold_22k: "Gold 22K (916)",
  gold_24k: "Gold 24K (999)",
  silver_999: "Silver 999",
};

const ROLE_BADGE_CONFIG = {
  super_admin: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", label: "Super Admin" },
  admin: { bg: "#F3E8FF", color: "#6B21A8", border: "#E9D5FF", label: "Admin" },
  dealer: { bg: "#E0F2FE", color: "#0369A1", border: "#BAE6FD", label: "Dealer" },
  sub_dealer: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0", label: "Sub Dealer" },
  promotor: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Promotor" },
};

export default function StoredCoins() {
  const navigate = useNavigate();
  const [coinStock, setCoinStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Super Admin view scope & hierarchy states
  const currentRole = localStorage.getItem("role") || "";
  const isSuperAdmin = currentRole === "super_admin";

  const [scope, setScope] = useState("vault"); // "vault" | "hierarchy"
  const [hierarchyStock, setHierarchyStock] = useState([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

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

  const fetchHierarchyStock = async () => {
    if (!isSuperAdmin) return;
    setHierarchyLoading(true);
    try {
      const res = await api.get("/coin-stock/?scope=hierarchy");
      setHierarchyStock(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load team coin holdings.");
    }
    setHierarchyLoading(false);
  };

  useEffect(() => {
    fetchStock();
    if (isSuperAdmin) {
      fetchHierarchyStock();
    }
  }, [isSuperAdmin]);

  // Vault Stock calculations
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

  // Hierarchy Stock calculations
  const hierarchyTotalCoins = hierarchyStock.reduce((sum, u) => sum + (Number(u.total_pieces) || 0), 0);
  const hierarchyTotalGrams = hierarchyStock.reduce((sum, u) => sum + (Number(u.total_grams) || 0), 0);

  const hierarchyGold22kPieces = hierarchyStock.reduce((sum, u) => {
    return sum + (u.items?.filter((i) => i.metal_type === "gold_22k").reduce((s, i) => s + (Number(i.qty) || 0), 0) || 0);
  }, 0);
  const hierarchyGold22kGrams = hierarchyStock.reduce((sum, u) => {
    return sum + (u.items?.filter((i) => i.metal_type === "gold_22k").reduce((s, i) => s + ((Number(i.weight_grams) || 0) * (Number(i.qty) || 0)), 0) || 0);
  }, 0);

  const hierarchyGold24kPieces = hierarchyStock.reduce((sum, u) => {
    return sum + (u.items?.filter((i) => i.metal_type === "gold_24k").reduce((s, i) => s + (Number(i.qty) || 0), 0) || 0);
  }, 0);
  const hierarchyGold24kGrams = hierarchyStock.reduce((sum, u) => {
    return sum + (u.items?.filter((i) => i.metal_type === "gold_24k").reduce((s, i) => s + ((Number(i.weight_grams) || 0) * (Number(i.qty) || 0)), 0) || 0);
  }, 0);

  const hierarchySilverPieces = hierarchyStock.reduce((sum, u) => {
    return sum + (u.items?.filter((i) => i.metal_type === "silver_999").reduce((s, i) => s + (Number(i.qty) || 0), 0) || 0);
  }, 0);
  const hierarchySilverGrams = hierarchyStock.reduce((sum, u) => {
    return sum + (u.items?.filter((i) => i.metal_type === "silver_999").reduce((s, i) => s + ((Number(i.weight_grams) || 0) * (Number(i.qty) || 0)), 0) || 0);
  }, 0);

  const roleCounts = {
    admin: hierarchyStock.filter((u) => u.role === "admin").length,
    dealer: hierarchyStock.filter((u) => u.role === "dealer").length,
    sub_dealer: hierarchyStock.filter((u) => u.role === "sub_dealer").length,
    promotor: hierarchyStock.filter((u) => u.role === "promotor").length,
  };

  const filteredHierarchy = hierarchyStock.filter((member) => {
    if (roleFilter !== "all" && member.role !== roleFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchesName = member.name?.toLowerCase().includes(q);
    const matchesId = member.id_str?.toLowerCase().includes(q);
    const matchesPhone = member.phone?.includes(q);
    const matchesEmail = member.email?.toLowerCase().includes(q);
    const matchesCoins = member.items?.some((it) =>
      it.weight_label?.toLowerCase().includes(q) || it.metal_type?.toLowerCase().includes(q)
    );
    return matchesName || matchesId || matchesPhone || matchesEmail || matchesCoins;
  });

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
          margin-bottom: 20px;
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

        /* Scope Segmented Switch for Super Admin */
        .sc-scope-bar {
          display: flex;
          align-items: center;
          background: #EAEFED;
          border-radius: 14px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 22px;
          width: fit-content;
        }

        .sc-scope-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          border: none;
          background: transparent;
          color: #5C706E;
          cursor: pointer;
          transition: all 160ms ease;
        }

        .sc-scope-tab.active {
          background: #FFFFFF;
          color: #073B3F;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.08);
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
          font-size: 28px;
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

        /* Role Filters */
        .sc-filter-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sc-filter-pill {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #D6E2E1;
          background: #FFFFFF;
          color: #5C706E;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .sc-filter-pill:hover {
          border-color: #073B3F;
          color: #073B3F;
        }

        .sc-filter-pill.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
        }

        /* Vault Groups */
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

        /* ── CARD-GRID LAYOUT FOR TEAM HOLDINGS (MATCHING REFERENCE IMAGE) ── */
        .sc-member-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .sc-member-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 200ms ease;
          position: relative;
        }

        .sc-member-card:hover {
          transform: translateY(-3px);
          border-color: #073B3F;
          box-shadow: 0 10px 28px rgba(7, 59, 63, 0.09);
        }

        .sc-card-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }

        .sc-role-pill {
          font-size: 11.5px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          text-transform: capitalize;
          letter-spacing: 0.02em;
        }

        .sc-card-id-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: "SFMono-Regular", Consolas, Menlo, monospace;
          font-size: 11.5px;
          font-weight: 800;
          color: #073B3F;
          background: #EFF6F6;
          border: 1px solid #D1DFDE;
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .sc-card-id-badge:hover {
          background: #E2ECEB;
          border-color: #073B3F;
        }

        .sc-card-name {
          margin: 0 0 8px 0;
          font-size: 17px;
          font-weight: 800;
          color: #111817;
          line-height: 1.3;
        }

        .sc-card-contacts {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 16px;
          font-size: 12px;
          color: #5C706E;
        }

        .sc-card-contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
        }

        .sc-card-email {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 2-tier Metric Stats Box (Total Coins, Weight + 22K/24K/Silver Breakdown) */
        .sc-card-stats-box {
          background: #F8FAFA;
          border: 1px solid #E4EBEA;
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sc-stats-top-row {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding-bottom: 10px;
          border-bottom: 1px solid #E6EEEE;
        }

        .sc-stat-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .sc-metric-label {
          font-size: 10px;
          font-weight: 800;
          color: #7A8987;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .sc-metric-val {
          font-size: 19px;
          font-weight: 800;
          line-height: 1.2;
        }

        .sc-metric-val.coins {
          color: #073B3F;
        }

        .sc-metric-val.weight {
          color: #B45309;
        }

        .sc-metric-unit {
          font-size: 11px;
          font-weight: 700;
          color: #7A8987;
          margin-left: 2px;
        }

        .sc-stat-divider {
          width: 1px;
          height: 30px;
          background: #D6E2E1;
        }

        /* 3-column Metal Purity Breakdown (22K, 24K, Silver) */
        .sc-metal-breakdown-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .sc-metal-pill {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 8px;
          padding: 6px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-align: center;
          transition: all 150ms ease;
        }

        .sc-metal-pill.g22 {
          border-color: #FDE68A;
          background: #FFFBEB;
        }

        .sc-metal-pill.g24 {
          border-color: #FCE96A;
          background: #FEFCE8;
        }

        .sc-metal-pill.slv {
          border-color: #E2E8F0;
          background: #F8FAFC;
        }

        .sc-metal-pill-name {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .sc-metal-pill.g22 .sc-metal-pill-name { color: #92400E; }
        .sc-metal-pill.g24 .sc-metal-pill-name { color: #854D0E; }
        .sc-metal-pill.slv .sc-metal-pill-name { color: #475569; }

        .sc-metal-pill-qty {
          font-size: 13px;
          font-weight: 800;
          line-height: 1.2;
        }

        .sc-metal-pill.g22 .sc-metal-pill-qty { color: #B45309; }
        .sc-metal-pill.g24 .sc-metal-pill-qty { color: #92400E; }
        .sc-metal-pill.slv .sc-metal-pill-qty { color: #334155; }

        .sc-metal-pill-wt {
          font-size: 10.5px;
          font-weight: 700;
          margin-top: 2px;
          border-radius: 4px;
          padding: 1px 4px;
        }
        .sc-metal-pill.g22 .sc-metal-pill-wt { color: #92400E; background: rgba(217, 119, 6, 0.12); }
        .sc-metal-pill.g24 .sc-metal-pill-wt { color: #854D0E; background: rgba(180, 83, 9, 0.12); }
        .sc-metal-pill.slv .sc-metal-pill-wt { color: #475569; background: rgba(100, 116, 139, 0.12); }

        .sc-holding-item-wt {
          font-size: 11px;
          font-weight: 700;
          color: #B45309;
          background: #FFFBEB;
          border: 1px solid #FEF3C7;
          padding: 2px 6px;
          border-radius: 5px;
          white-space: nowrap;
        }

        /* Coin Holdings Section inside Card */
        .sc-card-holdings-section {
          border-top: 1px dashed #E1EBEA;
          padding-top: 12px;
        }

        .sc-holdings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 800;
          color: #64748B;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .sc-holdings-count {
          font-size: 11px;
          font-weight: 700;
          color: #94A3B8;
        }

        .sc-holdings-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 160px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .sc-holdings-list::-webkit-scrollbar {
          width: 4px;
        }
        .sc-holdings-list::-webkit-scrollbar-thumb {
          background: #D1DFDE;
          border-radius: 4px;
        }

        .sc-holding-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FDFDFD;
          border: 1px solid #EDF3F2;
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 12px;
        }

        .sc-holding-info {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
        }

        .sc-holding-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sc-holding-name {
          color: #334155;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sc-holding-qty {
          font-weight: 800;
          color: #137333;
          background: #E6F4EA;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 11px;
          flex-shrink: 0;
        }

        @media (max-width: 1024px) {
          .sc-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .sc-root { padding: 16px 16px 40px; }
        }

        @media (max-width: 600px) {
          .sc-stats-grid { grid-template-columns: 1fr; }
          .sc-member-grid { grid-template-columns: 1fr; }
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

        {/* 4 Tabs Matching Navigation */}
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
              {isSuperAdmin && scope === "hierarchy"
                ? "Oversee live coin holdings across all downline admins, dealers, and promotors."
                : "Vault coin stock across purity and denomination weights."}
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

        {/* Super Admin Switch: My Vault Stock vs Team Hierarchy Holdings */}
        {isSuperAdmin && (
          <div className="sc-scope-bar">
            <button
              className={`sc-scope-tab ${scope === "vault" ? "active" : ""}`}
              onClick={() => setScope("vault")}
            >
              <CoinIcon size={16} color={scope === "vault" ? "#073B3F" : "#7A8987"} />
              <span>My Vault Stock ({totalCoins.toLocaleString()} pcs)</span>
            </button>
            <button
              className={`sc-scope-tab ${scope === "hierarchy" ? "active" : ""}`}
              onClick={() => {
                setScope("hierarchy");
                if (hierarchyStock.length === 0) fetchHierarchyStock();
              }}
            >
              <UsersIcon size={16} color={scope === "hierarchy" ? "#073B3F" : "#7A8987"} />
              <span>Team Member Holdings ({hierarchyStock.length} members · {hierarchyTotalCoins.toLocaleString()} pcs)</span>
            </button>
          </div>
        )}

        {/* VIEW 1: MY VAULT STOCK */}
        {scope === "vault" && (
          <>
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
                <div className="sc-stat-sub">{totalLines} weights in stock</div>
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
          </>
        )}

        {/* VIEW 2: TEAM HIERARCHY HOLDINGS (SUPER ADMIN ONLY) */}
        {scope === "hierarchy" && isSuperAdmin && (
          <>
            {/* 4 Stat Cards for Hierarchy Holdings (Gold 22k, Gold 24k, Silver 999 weights & pieces) */}
            <div className="sc-stats-grid">
              <div className="sc-stat-card" style={{ borderLeft: "4px solid #073B3F" }}>
                <div className="sc-stat-header">
                  <span className="sc-stat-label">Circulation Coins</span>
                  <div className="sc-stat-icon" style={{ background: "#EFF6F6", color: "#073B3F" }}>
                    <CoinIcon size={18} color="#073B3F" />
                  </div>
                </div>
                <div className="sc-stat-value">
                  {hierarchyLoading ? <SkeletonText width="60px" height="30px" /> : hierarchyTotalCoins.toLocaleString()}
                </div>
                <div className="sc-stat-sub">
                  {hierarchyStock.length} members · {hierarchyTotalGrams.toFixed(2)} g total
                </div>
              </div>

              <div className="sc-stat-card" style={{ borderLeft: "4px solid #D97706" }}>
                <div className="sc-stat-header">
                  <span className="sc-stat-label">Gold 22K (916)</span>
                  <div className="sc-stat-icon" style={{ background: "#FEF3C7", color: "#B45309" }}>
                    <CoinIcon size={18} color="#B45309" />
                  </div>
                </div>
                <div className="sc-stat-value">
                  {hierarchyLoading ? <SkeletonText width="60px" height="30px" /> : hierarchyGold22kPieces.toLocaleString()}
                </div>
                <div className="sc-stat-sub">{hierarchyGold22kGrams.toFixed(2)} g gross weight</div>
              </div>

              <div className="sc-stat-card" style={{ borderLeft: "4px solid #B45309" }}>
                <div className="sc-stat-header">
                  <span className="sc-stat-label">Gold 24K (999)</span>
                  <div className="sc-stat-icon" style={{ background: "#FDF6B2", color: "#92400E" }}>
                    <SparkleIcon size={18} color="#92400E" />
                  </div>
                </div>
                <div className="sc-stat-value">
                  {hierarchyLoading ? <SkeletonText width="60px" height="30px" /> : hierarchyGold24kPieces.toLocaleString()}
                </div>
                <div className="sc-stat-sub">{hierarchyGold24kGrams.toFixed(2)} g pure bullion</div>
              </div>

              <div className="sc-stat-card" style={{ borderLeft: "4px solid #64748B" }}>
                <div className="sc-stat-header">
                  <span className="sc-stat-label">Silver 999</span>
                  <div className="sc-stat-icon" style={{ background: "#F1F5F9", color: "#475569" }}>
                    <BullionIcon size={18} color="#475569" />
                  </div>
                </div>
                <div className="sc-stat-value">
                  {hierarchyLoading ? <SkeletonText width="60px" height="30px" /> : hierarchySilverPieces.toLocaleString()}
                </div>
                <div className="sc-stat-sub">{hierarchySilverGrams.toFixed(2)} g fine silver</div>
              </div>
            </div>

            {/* Controls: Search + Role Filter Pills */}
            <div className="sc-controls-card">
              <div className="sc-search-wrap">
                <span className="sc-search-icon">
                  <SearchIcon size={15} color="#7A8987" />
                </span>
                <input
                  type="text"
                  className="sc-search-input"
                  placeholder="Search by Member Name, ID (BBAD/BBDL/BBPRO), Phone, or Coin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="sc-filter-pills">
                <button
                  className={`sc-filter-pill ${roleFilter === "all" ? "active" : ""}`}
                  onClick={() => setRoleFilter("all")}
                >
                  All ({hierarchyStock.length})
                </button>
                <button
                  className={`sc-filter-pill ${roleFilter === "admin" ? "active" : ""}`}
                  onClick={() => setRoleFilter("admin")}
                >
                  Admins ({roleCounts.admin})
                </button>
                <button
                  className={`sc-filter-pill ${roleFilter === "dealer" ? "active" : ""}`}
                  onClick={() => setRoleFilter("dealer")}
                >
                  Dealers ({roleCounts.dealer})
                </button>
                <button
                  className={`sc-filter-pill ${roleFilter === "sub_dealer" ? "active" : ""}`}
                  onClick={() => setRoleFilter("sub_dealer")}
                >
                  Sub Dealers ({roleCounts.sub_dealer})
                </button>
                <button
                  className={`sc-filter-pill ${roleFilter === "promotor" ? "active" : ""}`}
                  onClick={() => setRoleFilter("promotor")}
                >
                  Promotors ({roleCounts.promotor})
                </button>
              </div>
            </div>

            {/* Members Card Grid (Matching Product Cards in User's Image) */}
            {hierarchyLoading && (
              <div className="sc-member-grid">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="sc-member-card">
                    <SkeletonText width="140px" height="18px" />
                    <SkeletonText width="80%" height="22px" style={{ marginTop: "10px" }} />
                    <SkeletonText width="100%" height="60px" style={{ marginTop: "14px" }} />
                    <SkeletonText width="100%" height="90px" style={{ marginTop: "14px" }} />
                  </div>
                ))}
              </div>
            )}

            {!hierarchyLoading && filteredHierarchy.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E1EBEA", color: "#7A8987" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#073B3F" }}>No Members Found</div>
                <div style={{ fontSize: "13px", marginTop: "4px" }}>
                  No members match your filter or search query.
                </div>
              </div>
            )}

            {!hierarchyLoading && filteredHierarchy.length > 0 && (
              <div className="sc-member-grid">
                {filteredHierarchy.map((member) => {
                  const roleConfig = ROLE_BADGE_CONFIG[member.role] || {
                    bg: "#F1F5F9",
                    color: "#475569",
                    border: "#CBD5E1",
                    label: member.role,
                  };

                  const gold22kPieces = member.items
                    ?.filter((i) => i.metal_type === "gold_22k")
                    .reduce((s, i) => s + (Number(i.qty) || 0), 0) || 0;
                  const gold22kGrams = member.items
                    ?.filter((i) => i.metal_type === "gold_22k")
                    .reduce((s, i) => s + ((Number(i.weight_grams) || 0) * (Number(i.qty) || 0)), 0) || 0;

                  const gold24kPieces = member.items
                    ?.filter((i) => i.metal_type === "gold_24k")
                    .reduce((s, i) => s + (Number(i.qty) || 0), 0) || 0;
                  const gold24kGrams = member.items
                    ?.filter((i) => i.metal_type === "gold_24k")
                    .reduce((s, i) => s + ((Number(i.weight_grams) || 0) * (Number(i.qty) || 0)), 0) || 0;

                  const silverPieces = member.items
                    ?.filter((i) => i.metal_type === "silver_999")
                    .reduce((s, i) => s + (Number(i.qty) || 0), 0) || 0;
                  const silverGrams = member.items
                    ?.filter((i) => i.metal_type === "silver_999")
                    .reduce((s, i) => s + ((Number(i.weight_grams) || 0) * (Number(i.qty) || 0)), 0) || 0;

                  return (
                    <article className="sc-member-card" key={member.user_id}>
                      <div>
                        {/* Top Bar: Role badge on left, ID badge on right */}
                        <div className="sc-card-top-bar">
                          <span
                            className="sc-role-pill"
                            style={{
                              background: roleConfig.bg,
                              color: roleConfig.color,
                              border: `1px solid ${roleConfig.border}`,
                            }}
                          >
                            {roleConfig.label}
                          </span>

                          {member.id_str && (
                            <span
                              className="sc-card-id-badge"
                              title="Click to copy ID"
                              onClick={() => handleCopy(member.id_str, member.user_id)}
                            >
                              <span>{member.id_str}</span>
                              {copiedId === member.user_id ? (
                                <CheckIcon size={11} color="#137333" />
                              ) : (
                                <CopyIcon size={11} color="#7A8987" />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Member Name */}
                        <h3 className="sc-card-name" title={member.name}>
                          {member.name}
                        </h3>

                        {/* Contact details */}
                        <div className="sc-card-contacts">
                          {member.phone && (
                            <div className="sc-card-contact-item">
                              <PhoneIcon size={12} color="#073B3F" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.email && (
                            <div className="sc-card-contact-item">
                              <MailIcon size={12} color="#073B3F" />
                              <span className="sc-card-email" title={member.email}>
                                {member.email}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 2-tier Metrics Card: Total Coins, Total Weight + 22K, 24K, Silver Breakdown */}
                        <div className="sc-card-stats-box">
                          <div className="sc-stats-top-row">
                            <div className="sc-stat-metric">
                              <span className="sc-metric-label">TOTAL COINS</span>
                              <span className="sc-metric-val coins">
                                {member.total_pieces}
                                <span className="sc-metric-unit">pcs</span>
                              </span>
                            </div>
                            <div className="sc-stat-divider" />
                            <div className="sc-stat-metric">
                              <span className="sc-metric-label">TOTAL WEIGHT</span>
                              <span className="sc-metric-val weight">
                                {member.total_grams > 0 ? member.total_grams.toFixed(2) : "0.00"}
                                <span className="sc-metric-unit">gm</span>
                              </span>
                            </div>
                          </div>

                          {/* 3-Purity Breakdown Row (Pieces + Grams) */}
                          <div className="sc-metal-breakdown-grid">
                            <div className="sc-metal-pill g22" title="Gold 22K (916)">
                              <span className="sc-metal-pill-name">Gold 22K</span>
                              <span className="sc-metal-pill-qty">{gold22kPieces} pcs</span>
                              <span className="sc-metal-pill-wt">{gold22kGrams > 0 ? `${gold22kGrams.toFixed(2)} g` : "0 g"}</span>
                            </div>
                            <div className="sc-metal-pill g24" title="Gold 24K (999)">
                              <span className="sc-metal-pill-name">Gold 24K</span>
                              <span className="sc-metal-pill-qty">{gold24kPieces} pcs</span>
                              <span className="sc-metal-pill-wt">{gold24kGrams > 0 ? `${gold24kGrams.toFixed(2)} g` : "0 g"}</span>
                            </div>
                            <div className="sc-metal-pill slv" title="Silver 999">
                              <span className="sc-metal-pill-name">Silver 999</span>
                              <span className="sc-metal-pill-qty">{silverPieces} pcs</span>
                              <span className="sc-metal-pill-wt">{silverGrams > 0 ? `${silverGrams.toFixed(2)} g` : "0 g"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Coin Denomination Breakdown List */}
                      <div className="sc-card-holdings-section">
                        <div className="sc-holdings-header">
                          <span>COIN HOLDINGS</span>
                          <span className="sc-holdings-count">
                            {member.items?.length || 0} {member.items?.length === 1 ? "type" : "types"}
                          </span>
                        </div>

                        <div className="sc-holdings-list">
                          {member.items?.map((item) => (
                            <div className="sc-holding-row" key={item.id || `${item.metal_type}-${item.weight_label}`}>
                              <div className="sc-holding-info">
                                <span
                                  className="sc-holding-dot"
                                  style={{
                                    background: item.metal_type?.includes("silver") ? "#94A3B8" : "#D97706",
                                  }}
                                />
                                <span className="sc-holding-name">
                                  {COIN_METAL_LABELS_TEXT[item.metal_type] || item.metal_type} ({item.weight_label})
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                {item.weight_grams && (
                                  <span className="sc-holding-item-wt">
                                    {(Number(item.weight_grams) * Number(item.qty)).toFixed(2)} g
                                  </span>
                                )}
                                <span className="sc-holding-qty">
                                  {item.qty} pcs
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
