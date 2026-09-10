import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { SkeletonText } from "../components/Skeleton";
import CoinTabs from "./CoinTabs";
import {
  HistoryIcon,
  ClockIcon,
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  SearchIcon,
  CopyIcon,
  CoinIcon,
  PlusIcon,
  InboxIcon,
  ArrowLeftIcon,
} from "../components/SvgIcons";

const COIN_METAL_LABELS_TEXT = {
  gold_22k: "Gold 22K",
  gold_24k: "Gold 24K",
  silver_999: "Silver 999",
};

const STATUS_CFG = {
  pending: {
    color: "#B45309",
    bg: "#FEF3C7",
    border: "#FDE68A",
    label: "Pending",
    icon: ClockIcon,
  },
  sent: {
    color: "#137333",
    bg: "#E6F4EA",
    border: "#CEEAD6",
    label: "Approved",
    icon: CheckIcon,
  },
  rejected: {
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    label: "Rejected",
    icon: CloseIcon,
  },
};

const STATS_CACHE_KEY = "ct_status_counts_cache";

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState("");

  const currentRole = localStorage.getItem("role") || "";

  const [statusCounts, setStatusCounts] = useState(() => {
    try {
      const cached = sessionStorage.getItem(STATS_CACHE_KEY);
      return cached ? JSON.parse(cached) : { pending: 0, sent: 0, rejected: 0, total: 0, disbursed_pieces: 0, pending_pieces: 0 };
    } catch {
      return { pending: 0, sent: 0, rejected: 0, total: 0, disbursed_pieces: 0, pending_pieces: 0 };
    }
  });

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(""), 2800);
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchHistory = async (searchVal = "") => {
    setLoading(true);
    setError("");
    try {
      const params = { box: "history", status: filter, offset: 0, limit: 50 };
      if (searchVal) params.search = searchVal;
      const res = await api.get("/coin-requests/", { params });
      setRequests(res.data.items || []);
      setTotalCount(res.data.total_count || 0);
      setStatusCounts(res.data.status_counts || { pending: 0, sent: 0, rejected: 0, total: 0, disbursed_pieces: 0, pending_pieces: 0 });
      try {
        sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify(res.data.status_counts));
      } catch {
        /* ignore */
      }
      setOffset(50);
      setLimit(50);
    } catch {
      setError("Failed to load coin transactions.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchHistory(searchTerm.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [filter, searchTerm]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const params = { box: "history", status: filter, offset, limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await api.get("/coin-requests/", { params });
      const newItems = res.data.items || [];
      setRequests((prev) => [...prev, ...newItems]);
      setOffset((prev) => prev + limit);
      setLimit(50);
    } catch {
      showToast("Failed to fetch more records.");
    }
    setLoadingMore(false);
  };

  const hasMore = requests.length < totalCount;

  const formatTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) return requests;
    const q = searchTerm.toLowerCase().trim();
    return requests.filter((r) => {
      const idStr = (r.requested_by_id_str || "").toLowerCase();
      const name = (r.requested_by_name || "").toLowerCase();
      const phone = (r.requested_by_phone || "").toLowerCase();
      const email = (r.requested_by_email || "").toLowerCase();
      const role = (r.requested_by_role || "").toLowerCase();
      const toIdStr = (r.requested_to_id_str || "").toLowerCase();
      const toName = (r.requested_to_name || "").toLowerCase();
      const toPhone = (r.requested_to_phone || "").toLowerCase();
      const toEmail = (r.requested_to_email || "").toLowerCase();
      const toRole = (r.requested_to_role || "").toLowerCase();
      const itemsStr = (r.items || [])
        .map((i) => `${i.metal_type} ${i.weight_label}`)
        .join(" ")
        .toLowerCase();
      return (
        idStr.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        toIdStr.includes(q) ||
        toName.includes(q) ||
        toPhone.includes(q) ||
        toEmail.includes(q) ||
        toRole.includes(q) ||
        itemsStr.includes(q)
      );
    });
  }, [requests, searchTerm]);

  const exportCSV = () => {
    if (!filteredRequests.length) return;
    const headers = [
      "Requester ID",
      "Requester Name",
      "Requester Role",
      "Phone",
      "Email",
      "Assigned Approver",
      "Approver Role",
      "Denominations",
      "Date",
      "Status",
      "Reject Reason"
    ];
    const csvData = filteredRequests.map((r) => {
      const itemsFormatted = (r.items || [])
        .map((i) => `${COIN_METAL_LABELS_TEXT[i.metal_type] || i.metal_type} (${i.weight_label}) x ${i.qty}`)
        .join("; ");
      return [
        `"${r.requested_by_id_str || ""}"`,
        `"${(r.requested_by_name || "").replace(/"/g, '""')}"`,
        `"${r.requested_by_role || ""}"`,
        `"${r.requested_by_phone || ""}"`,
        `"${r.requested_by_email || ""}"`,
        `"${(r.requested_to_name || "").replace(/"/g, '""')}"`,
        `"${r.requested_to_role || ""}"`,
        `"${itemsFormatted}"`,
        `"${formatTime(r.created_at)}"`,
        `"${r.status}"`,
        `"${(r.reject_reason || "").replace(/"/g, '""')}"`,
      ];
    });

    const blob = new Blob(
      [[headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `coin_transactions_${filter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV exported");
  };

  return (
    <div className="ct-root">
      <style>{`
        .ct-root {
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

        .ct-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }

        .ct-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .ct-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5C706E;
        }

        .ct-breadcrumb .link {
          color: #073B3F;
          cursor: pointer;
          font-weight: 700;
          text-decoration: none;
        }

        .ct-breadcrumb .link:hover {
          text-decoration: underline;
        }

        .ct-back-btn {
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

        .ct-back-btn:hover {
          background: #F0F5F5;
          border-color: #073B3F;
          transform: translateX(-2px);
        }

        .ct-header-card {
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

        .ct-header-info h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ct-badge {
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

        .ct-header-sub {
          margin: 4px 0 0;
          color: #5C706E;
          font-size: 13px;
        }

        .ct-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ct-btn-export {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          background: #073B3F;
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(7, 59, 63, 0.18);
        }

        .ct-btn-export:hover:not(:disabled) {
          background: #0C4E53;
        }

        .ct-btn-export:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .ct-btn-secondary {
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

        .ct-btn-secondary:hover {
          background: #F0F5F5;
          border-color: #073B3F;
        }

        .ct-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        .ct-stat-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 20px 24px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
          transition: transform 180ms ease;
        }

        .ct-stat-card:hover {
          transform: translateY(-2px);
        }

        .ct-stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .ct-stat-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .ct-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ct-stat-value {
          font-size: 30px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
          margin-bottom: 4px;
        }

        .ct-stat-sub {
          font-size: 12px;
          color: #7A8987;
          font-weight: 500;
        }

        .ct-controls-card {
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

        .ct-search-wrap {
          flex: 1;
          min-width: 260px;
          position: relative;
        }

        .ct-search-input {
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

        .ct-search-input:focus {
          background: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.08);
        }

        .ct-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #7A8987;
          display: flex;
          align-items: center;
        }

        .ct-filter-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .ct-pill-btn {
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid #D6E2E1;
          background: #FFFFFF;
          color: #5C706E;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .ct-pill-btn:hover {
          border-color: #073B3F;
          color: #073B3F;
        }

        .ct-pill-btn.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
        }

        .ct-table-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(7, 59, 63, 0.04);
          overflow: hidden;
        }

        .ct-table-header {
          padding: 16px 24px;
          border-bottom: 1px solid #E1EBEA;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FAFBFB;
        }

        .ct-table-title {
          font-size: 14px;
          font-weight: 800;
          color: #073B3F;
        }

        .ct-scroll {
          overflow-x: auto;
        }

        .ct-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
          font-size: 13.5px;
        }

        .ct-table th {
          background: #F8FAFA;
          color: #5C706E;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 14px 20px;
          text-align: left;
          border-bottom: 1px solid #E1EBEA;
          white-space: nowrap;
        }

        .ct-table td {
          padding: 14px 20px;
          border-bottom: 1px solid #EDF3F2;
          vertical-align: middle;
        }

        .ct-id-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: "SFMono-Regular", Consolas, Menlo, monospace;
          font-size: 12.5px;
          font-weight: 800;
          color: #073B3F;
          background: #EFF6F6;
          border: 1px solid #D1DFDE;
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
        }

        .ct-item-chip {
          display: inline-block;
          background: #F8FAFA;
          border: 1px solid #E1EBEA;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          color: #073B3F;
          margin-right: 4px;
          margin-bottom: 2px;
        }

        .ct-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .ct-toast {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #073B3F;
          color: #FFFFFF;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          z-index: 9999;
        }

        @media (max-width: 1024px) {
          .ct-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .ct-root { padding: 16px 16px 40px; }
        }

        @media (max-width: 600px) {
          .ct-stats-grid { grid-template-columns: 1fr; }
          .ct-header-card { flex-direction: column; align-items: flex-start; }
          .ct-header-actions { width: 100%; }
        }
      `}</style>

      {toast && <div className="ct-toast">✓ {toast}</div>}

      <div className="ct-shell">
        {/* Topbar */}
        <div className="ct-topbar">
          <button className="ct-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={14} color="#073B3F" /> Back
          </button>
        </div>

        {/* 4 Tabs Matching User's Image */}
        <CoinTabs activeTab="Transaction Coins History" />

        {/* Executive Header Card */}
        <div className="ct-header-card">
          <div className="ct-header-info">
            <h1>
              <span>Transaction Coins History</span>
              <span className="ct-badge">Audit Ledger</span>
              {currentRole === "super_admin" && (
                <span style={{
                  background: "linear-gradient(135deg, #073B3F 0%, #0C4E53 100%)",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "4px 12px",
                  borderRadius: "999px",
                  letterSpacing: "0.4px"
                }}>
                  👑 Master Hierarchy View
                </span>
              )}
            </h1>
            <p className="ct-header-sub">
              {currentRole === "super_admin"
                ? "Live audit of all coin allocations, upstream parent routing, and circulation across the team."
                : "Coin allocation orders and status movements."}
            </p>
          </div>
          <div className="ct-header-actions">
            <button
              className="ct-btn-export"
              disabled={filteredRequests.length === 0}
              onClick={exportCSV}
            >
              <DownloadIcon size={15} color="#FFFFFF" /> Export CSV
            </button>
            <button className="ct-btn-secondary" onClick={() => navigate("/available-coins")}>
              <CoinIcon size={15} color="#073B3F" /> Available Coins
            </button>
            <button className="ct-btn-secondary" onClick={() => navigate("/coin-requests-page")}>
              <InboxIcon size={15} color="#073B3F" /> Requests Coins
            </button>
            <button className="ct-btn-secondary" onClick={() => navigate("/buy-coin")}>
              <PlusIcon size={15} color="#073B3F" /> Add Coins
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="ct-stats-grid">
          <div className="ct-stat-card" style={{ borderLeft: "4px solid #073B3F" }}>
            <div className="ct-stat-header">
              <span className="ct-stat-label">Total Requests</span>
              <div className="ct-stat-icon" style={{ background: "#EFF6F6", color: "#073B3F" }}>
                <HistoryIcon size={18} color="#073B3F" />
              </div>
            </div>
            <div className="ct-stat-value">{statusCounts.total || 0}</div>
            <div className="ct-stat-sub">Lifetime logged orders</div>
          </div>

          <div className="ct-stat-card" style={{ borderLeft: "4px solid #D97706" }}>
            <div className="ct-stat-header">
              <span className="ct-stat-label">Pending Review</span>
              <div className="ct-stat-icon" style={{ background: "#FEF3C7", color: "#B45309" }}>
                <ClockIcon size={18} color="#B45309" />
              </div>
            </div>
            <div className="ct-stat-value">{statusCounts.pending || 0}</div>
            <div className="ct-stat-sub" style={{ color: "#B45309", fontWeight: 700 }}>
              {statusCounts.pending_pieces ? `${Number(statusCounts.pending_pieces).toLocaleString()} pcs awaiting approval` : "Awaiting decision"}
            </div>
          </div>

          <div className="ct-stat-card" style={{ borderLeft: "4px solid #166534" }}>
            <div className="ct-stat-header">
              <span className="ct-stat-label">Approved & Distributed</span>
              <div className="ct-stat-icon" style={{ background: "#E6F4EA", color: "#137333" }}>
                <CheckIcon size={18} color="#137333" />
              </div>
            </div>
            <div className="ct-stat-value">{statusCounts.sent || 0}</div>
            <div className="ct-stat-sub" style={{ color: "#166534", fontWeight: 700 }}>
              {statusCounts.disbursed_pieces ? `${Number(statusCounts.disbursed_pieces).toLocaleString()} coins out in circulation` : "Disbursed"}
            </div>
          </div>

          <div className="ct-stat-card" style={{ borderLeft: "4px solid #DC2626" }}>
            <div className="ct-stat-header">
              <span className="ct-stat-label">Declined</span>
              <div className="ct-stat-icon" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                <CloseIcon size={18} color="#DC2626" />
              </div>
            </div>
            <div className="ct-stat-value">{statusCounts.rejected || 0}</div>
            <div className="ct-stat-sub">Declined requests</div>
          </div>
        </div>

        {/* Controls Card */}
        <div className="ct-controls-card">
          <div className="ct-search-wrap">
            <span className="ct-search-icon">
              <SearchIcon size={15} color="#7A8987" />
            </span>
            <input
              type="text"
              className="ct-search-input"
              placeholder="Search by ID (e.g. BBPRO..., BBSUB...), Name, Phone, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7A8987",
                  cursor: "pointer",
                  padding: "0 8px",
                  fontSize: "14px",
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="ct-filter-pills">
            {[
              { key: "all", label: `All (${statusCounts.total || 0})` },
              { key: "pending", label: `Pending (${statusCounts.pending || 0})` },
              { key: "sent", label: `Approved (${statusCounts.sent || 0})` },
              { key: "rejected", label: `Rejected (${statusCounts.rejected || 0})` },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={`ct-pill-btn ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Luxury Table Card */}
        <div className="ct-table-card">
          <div className="ct-table-header">
            <span className="ct-table-title">Transaction Records</span>
            <span style={{ fontSize: "12px", color: "#5C706E", fontWeight: 700 }}>
              {filteredRequests.length} of {totalCount} shown
              {searchTerm && ` · Filtered by "${searchTerm}"`}
            </span>
          </div>

          <div className="ct-scroll">
            <table className="ct-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Assigned Approver (Parent)</th>
                  <th>Contact Details</th>
                  <th>Coins & Denominations</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  [0, 1, 2, 3, 4].map((i) => (
                    <tr key={i}>
                      <td><SkeletonText width="110px" height="24px" /></td>
                      <td><SkeletonText width="110px" height="24px" /></td>
                      <td><SkeletonText width="100px" height="18px" /></td>
                      <td><SkeletonText width="140px" height="24px" /></td>
                      <td><SkeletonText width="90px" height="14px" /></td>
                      <td><SkeletonText width="70px" height="22px" /></td>
                    </tr>
                  ))}

                {!loading && filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 20px", color: "#7A8987" }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#073B3F", marginBottom: "4px" }}>
                        No transactions found
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        {searchTerm ? `No records matching "${searchTerm}". Try another ID or phone number.` : "No transaction orders found in this category."}
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredRequests.map((req) => {
                    const cfg = STATUS_CFG[req.status] || STATUS_CFG.pending;
                    const StatusIcon = cfg.icon;
                    const totalPiecesInOrder = (req.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
                    return (
                      <tr key={req.id}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span
                                className="ct-id-badge"
                                title="Copy Requester ID"
                                onClick={() => handleCopy(req.requested_by_id_str || req.requested_by_email, `req-${req.id}`)}
                              >
                                <span>{req.requested_by_id_str || "-"}</span>
                                {copiedId === `req-${req.id}` ? <CheckIcon size={11} color="#137333" /> : <CopyIcon size={11} color="#7A8987" />}
                              </span>
                              <span style={{
                                fontSize: "10.5px",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                background: "#EFF6F6",
                                color: "#073B3F",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                {req.requested_by_role?.replace('_', ' ') || "Requester"}
                              </span>
                            </div>
                            <div style={{ fontWeight: 800, color: "#111817", fontSize: "13.5px" }}>
                              {req.requested_by_name || "Member"}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              {req.requested_to_id_str && (
                                <span
                                  className="ct-id-badge"
                                  title="Copy Approver ID"
                                  onClick={() => handleCopy(req.requested_to_id_str, `to-${req.id}`)}
                                >
                                  <span>{req.requested_to_id_str}</span>
                                  {copiedId === `to-${req.id}` ? <CheckIcon size={11} color="#137333" /> : <CopyIcon size={11} color="#7A8987" />}
                                </span>
                              )}
                              <span style={{
                                fontSize: "10.5px",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                background: "#FEF3C7",
                                color: "#92400E",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                {req.requested_to_role?.replace('_', ' ') || "Approver"}
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, color: "#073B3F", fontSize: "13px" }}>
                              {req.requested_to_name || "Vault / Parent"}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", color: "#111817", fontWeight: 700 }}>
                            {req.requested_by_phone ? `📞 ${req.requested_by_phone}` : "-"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#7A8987", marginTop: "2px" }}>
                            {req.requested_by_email || "-"}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                            {req.items?.map((item, idx) => (
                              <span className="ct-item-chip" key={item.id || idx}>
                                {COIN_METAL_LABELS_TEXT[item.metal_type] || item.metal_type} ({item.weight_label}) × {item.qty}
                              </span>
                            ))}
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              color: "#073B3F",
                              background: "#E6F4EA",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              whiteSpace: "nowrap"
                            }}>
                              {totalPiecesInOrder} pcs
                            </span>
                          </div>
                        </td>
                        <td style={{ color: "#5C706E", fontSize: "12px", whiteSpace: "nowrap" }}>
                          {formatTime(req.created_at)}
                        </td>
                        <td>
                          <span
                            className="ct-status-pill"
                            style={{
                              background: cfg.bg,
                              color: cfg.color,
                              border: `1px solid ${cfg.border}`,
                            }}
                          >
                            <StatusIcon size={11} color={cfg.color} />
                            <span>{cfg.label}</span>
                          </span>
                          {req.status === "rejected" && req.reject_reason && (
                            <div style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", maxWidth: "200px" }}>
                              Reason: {req.reject_reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                {loadingMore &&
                  [0, 1, 2].map((i) => (
                    <tr key={`more-${i}`}>
                      <td colSpan={6} style={{ padding: "10px 20px" }}>
                        <SkeletonText width="100%" height="12px" />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {hasMore && !loadingMore && !searchTerm && (
            <div style={{ display: "flex", justifyContent: "center", padding: "18px", borderTop: "1px solid #E1EBEA" }}>
              <button
                type="button"
                style={{
                  background: "#073B3F",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "9px 20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={loadMore}
              >
                Load More ({requests.length} of {totalCount})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}