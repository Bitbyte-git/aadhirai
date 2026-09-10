import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import CoinTabs from "./CoinTabs";
import JewelleryImageModal from "./JewelleryImageModal";
import { JewelleryTransactionSkeletonList } from "./JewellerySkeleton";
import LoadMoreControl from "./LoadMoreControl";
import {
  JewelryIcon,
  HistoryIcon,
  CheckIcon,
  CloseIcon,
  ClockIcon,
  SearchIcon,
  CalendarIcon,
  DownloadIcon,
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

const STATUS_CFG = {
  pending: { color: "#B45309", bg: "#FEF3C7", border: "#FDE68A", label: "Pending", icon: ClockIcon },
  sent: { color: "#137333", bg: "#E6F4EA", border: "#CEEAD6", label: "Approved", icon: CheckIcon },
  rejected: { color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", label: "Declined", icon: CloseIcon },
};

export default function JewelleryTransactions() {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem("role") || "";
  const isSuperAdmin = currentRole === "super_admin";
  const myEmail = (localStorage.getItem("email") || "").toLowerCase();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState("all"); // 'all' (default) | 'day' | 'week' | 'month' | 'year' | 'custom'
  const [flowFilter, setFlowFilter] = useState("all"); // 'all' | 'mint' | 'disbursed' (superadmin) OR 'all' | 'inward' | 'outward' (downlines)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [copiedId, setCopiedId] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [visibleLimit, setVisibleLimit] = useState(100);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    sent: 0,
    rejected: 0,
    total: 0,
    disbursed_pieces: 0,
    pending_pieces: 0,
  });

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchHistory = async (searchVal = "") => {
    setLoading(true);
    setError("");
    setVisibleLimit(100);
    try {
      const params = { box: "history", status: filter, period };
      if (period === "custom") {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }
      if (searchVal) params.search = searchVal;

      const res = await api.get("/jewelry-requests/", { params });
      setRequests(res.data.items || []);
      setStatusCounts(res.data.status_counts || {
        pending: 0,
        sent: 0,
        rejected: 0,
        total: 0,
        disbursed_pieces: 0,
        pending_pieces: 0,
      });
    } catch {
      setError("Failed to load jewellery transaction history.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchHistory(searchTerm.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [filter, searchTerm, period, startDate, endDate]);

  const mintCount = useMemo(() => {
    return requests.filter((r) => r.reject_reason === "MASTER_MINT").length;
  }, [requests]);

  const disbursedCount = useMemo(() => {
    return requests.filter(
      (r) => r.status === "sent" && r.reject_reason !== "MASTER_MINT"
    ).length;
  }, [requests]);

  const inwardCount = useMemo(() => {
    return requests.filter(
      (r) => (r.requested_by_email || "").toLowerCase() === myEmail
    ).length;
  }, [requests, myEmail]);

  const outwardCount = useMemo(() => {
    return requests.filter(
      (r) => (r.requested_to_email || "").toLowerCase() === myEmail
    ).length;
  }, [requests, myEmail]);

  const displayedRequests = useMemo(() => {
    let list = requests;
    if (isSuperAdmin && flowFilter !== "all") {
      if (flowFilter === "mint") {
        list = list.filter((r) => r.reject_reason === "MASTER_MINT");
      } else if (flowFilter === "disbursed") {
        list = list.filter((r) => r.reject_reason !== "MASTER_MINT");
      }
    } else if (!isSuperAdmin && flowFilter !== "all") {
      if (flowFilter === "inward") {
        list = list.filter(
          (r) => (r.requested_by_email || "").toLowerCase() === myEmail
        );
      } else if (flowFilter === "outward") {
        list = list.filter(
          (r) => (r.requested_to_email || "").toLowerCase() === myEmail
        );
      }
    }
    return list;
  }, [requests, flowFilter, myEmail, isSuperAdmin]);

  // Export CSV
  const exportCSV = () => {
    if (!requests.length) return;
    const headers = [
      "Request ID",
      "Date",
      "Requester Name",
      "Requester ID",
      "Requester Role",
      "Approver Name",
      "Approver Role",
      "Status",
      "Jewellery Items",
    ];
    const rows = requests.map((r) => [
      r.id,
      new Date(r.created_at).toLocaleString("en-IN"),
      `"${r.requested_by_name || r.requested_by_email}"`,
      `"${r.requested_by_id_str || ''}"`,
      r.requested_by_role,
      `"${r.requested_to_name || r.requested_to_email || ''}"`,
      r.requested_to_role || '',
      r.status,
      `"${(r.items || []).map((i) => `${i.product?.name || 'Item'} x${i.qty}`).join("; ")}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jewellery_transactions_${period}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="jt-page">
      <style>{`
        .jt-page {
          min-height: 100vh;
          background: #F4F8F8;
          padding: 24px 32px 60px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #111817;
        }

        .jt-container {
          max-width: 1240px;
          margin: 0 auto;
        }

        .jt-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .jt-header-left h1 {
          font-size: 26px;
          font-weight: 800;
          color: #073B3F;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .jt-header-left p {
          font-size: 14px;
          color: #5C706E;
          margin: 0;
        }

        .jt-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .jt-btn-export {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: #073B3F;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Period filter bar */
        .jt-period-bar {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 12px 18px;
          box-shadow: 0 2px 10px rgba(7, 59, 63, 0.02);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .jt-period-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .jt-period-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #D6E2E1;
          background: #F8FAFA;
          color: #5C706E;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .jt-period-btn:hover {
          background: #EBF3F2;
          color: #073B3F;
          border-color: #B4CECC;
        }

        .jt-period-btn.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.2);
        }

        .jt-custom-date-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .jt-date-field {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: #5C706E;
        }

        .jt-date-field input {
          padding: 6px 10px;
          background: #F8FAFA;
          border: 1px solid #D6E2E1;
          border-radius: 8px;
          font-size: 12.5px;
          outline: none;
        }

        /* Stats Grid */
        .jt-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .jt-stat-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 2px 12px rgba(7, 59, 63, 0.03);
        }

        .jt-stat-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .jt-stat-val {
          font-size: 28px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
        }

        .jt-stat-sub {
          font-size: 12px;
          color: #7A8987;
          margin-top: 5px;
          font-weight: 600;
        }

        /* Controls: Search + Status Filter Pills + View Mode */
        .jt-controls-card {
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

        .jt-search-wrap {
          flex: 1;
          min-width: 260px;
          position: relative;
        }

        .jt-search-input {
          width: 100%;
          padding: 10px 36px 10px 38px;
          background: #F8FAFA;
          border: 1px solid #D6E2E1;
          border-radius: 12px;
          font-size: 13.5px;
          outline: none;
          box-sizing: border-box;
        }

        .jt-search-input:focus {
          border-color: #073B3F;
          background: #FFFFFF;
        }

        .jt-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
        }

        .jt-filter-pills {
          display: flex;
          gap: 6px;
          background: #F8FAFA;
          padding: 4px;
          border-radius: 12px;
          border: 1px solid #D6E2E1;
        }

        .jt-pill-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 12.5px;
          font-weight: 700;
          color: #5C706E;
          cursor: pointer;
        }

        .jt-pill-btn.active {
          background: #073B3F;
          color: #FFFFFF;
        }

        .jt-view-switcher {
          display: flex;
          gap: 4px;
          background: #F1F5F5;
          padding: 3px;
          border-radius: 10px;
        }

        .jt-view-btn {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 700;
          color: #5C706E;
          cursor: pointer;
        }

        .jt-view-btn.active {
          background: #FFFFFF;
          color: #073B3F;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        /* Card View */
        .jt-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }

        .jt-tx-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.04);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: transform 180ms ease;
        }

        .jt-tx-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.08);
        }

        .jt-tx-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #F0F4F4;
        }

        .jt-tx-id {
          font-size: 15px;
          font-weight: 800;
          color: #073B3F;
        }

        /* Parties Route (From -> To) */
        .jt-parties-box {
          background: #F8FAFA;
          border: 1px solid #EAF0F0;
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .jt-party-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
        }

        .jt-party-label {
          font-size: 11px;
          font-weight: 700;
          color: #7A8987;
          text-transform: uppercase;
        }

        .jt-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .jt-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px;
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 10px;
        }

        .jt-item-row img {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          background: #EEF4F4;
        }

        @media (max-width: 900px) {
          .jt-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .jt-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="jt-container">
        <CoinTabs activeTab="Jewellery Transactions" />

        <div className="jt-header">
          <div className="jt-header-left">
            <h1>
              <HistoryIcon size={26} color="#073B3F" />{" "}
              {isSuperAdmin ? "Jewellery Transactions (Company Audit)" : "My Jewellery Transactions"}
            </h1>
            <p>
              {isSuperAdmin
                ? "Complete company-wide audit trail of jewellery allocations and status movements."
                : "Your personal history of jewellery buy requests and stock disbursements."}
            </p>
          </div>

          <div className="jt-header-actions">
            <button
              type="button"
              className="jt-btn-export"
              disabled={requests.length === 0}
              onClick={exportCSV}
            >
              <DownloadIcon size={14} color="#FFFFFF" /> Export CSV
            </button>
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                background: "#FFFFFF",
                border: "1px solid #D6E2E1",
                borderRadius: "12px",
                color: "#073B3F",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={() => navigate("/available-jewellery")}
            >
              <JewelryIcon size={14} color="#073B3F" /> Available Jewellery
            </button>
          </div>
        </div>

        {/* Date / Period Filter Bar */}
        <div className="jt-period-bar">
          <div className="jt-period-pills">
            {[
              { key: "all", label: "All Time" },
              { key: "day", label: "Today (Day)" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "year", label: "This Year" },
              { key: "custom", label: "Custom Date Range" },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                className={`jt-period-btn ${period === p.key ? "active" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                <CalendarIcon size={14} color={period === p.key ? "#FFFFFF" : "#5C706E"} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="jt-custom-date-inputs">
              <div className="jt-date-field">
                <label>From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="jt-date-field">
                <label>To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* 4 Stat Cards */}
        <div className="jt-stats-grid">
          <div className="jt-stat-card" style={{ borderLeft: "4px solid #073B3F" }}>
            <div className="jt-stat-label">Total Transactions</div>
            <div className="jt-stat-val">{statusCounts.total || 0}</div>
            <div className="jt-stat-sub">
              {period === "day"
                ? "Today's logged transfers"
                : period === "week"
                ? "This week's transfers"
                : period === "month"
                ? "This month's transfers"
                : period === "year"
                ? "This year's transfers"
                : "Selected period"}
            </div>
          </div>

          <div className="jt-stat-card" style={{ borderLeft: "4px solid #D97706" }}>
            <div className="jt-stat-label">Pending Review</div>
            <div className="jt-stat-val">{statusCounts.pending || 0}</div>
            <div className="jt-stat-sub" style={{ color: "#B45309" }}>
              {statusCounts.pending_pieces ? `${statusCounts.pending_pieces} pieces awaiting approval` : "Awaiting decision"}
            </div>
          </div>

          <div className="jt-stat-card" style={{ borderLeft: "4px solid #166534" }}>
            <div className="jt-stat-label">Approved & Disbursed</div>
            <div className="jt-stat-val">{statusCounts.sent || 0}</div>
            <div className="jt-stat-sub" style={{ color: "#166534" }}>
              {statusCounts.disbursed_pieces ? `${statusCounts.disbursed_pieces} pieces out in circulation` : "Disbursed"}
            </div>
          </div>

          <div className="jt-stat-card" style={{ borderLeft: "4px solid #DC2626" }}>
            <div className="jt-stat-label">Declined</div>
            <div className="jt-stat-val">{statusCounts.rejected || 0}</div>
            <div className="jt-stat-sub">Declined transfers</div>
          </div>
        </div>

        {/* Controls Card: Search + Flow Filter + Status Filter Pills + View Mode */}
        <div className="jt-controls-card">
          <div className="jt-search-wrap">
            <span className="jt-search-icon">
              <SearchIcon size={15} color="#7A8987" />
            </span>
            <input
              type="text"
              className="jt-search-input"
              placeholder="Search by ID, member name, phone, or jewellery piece..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Flow Direction Pills */}
          {isSuperAdmin ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#F4F8F8",
                border: "1px solid #D6E2E1",
                borderRadius: "12px",
                padding: "4px",
              }}
            >
              {[
                { key: "all", label: `All Events (${requests.length})` },
                { key: "mint", label: `📦 Master Stock Added (${mintCount})` },
                { key: "disbursed", label: `↗️ Stock Disbursed (${disbursedCount})` },
              ].map((fl) => (
                <button
                  key={fl.key}
                  type="button"
                  onClick={() => setFlowFilter(fl.key)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: flowFilter === fl.key ? "#073B3F" : "transparent",
                    color: flowFilter === fl.key ? "#FFFFFF" : "#5C706E",
                    transition: "all 150ms ease",
                  }}
                >
                  {fl.label}
                </button>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#F4F8F8",
                border: "1px solid #D6E2E1",
                borderRadius: "12px",
                padding: "4px",
              }}
            >
              {[
                { key: "all", label: `All (${requests.length})` },
                { key: "inward", label: `↙️ Received / My Buys (${inwardCount})` },
                { key: "outward", label: `↗️ Disbursed / Downlines (${outwardCount})` },
              ].map((fl) => (
                <button
                  key={fl.key}
                  type="button"
                  onClick={() => setFlowFilter(fl.key)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: flowFilter === fl.key ? "#073B3F" : "transparent",
                    color: flowFilter === fl.key ? "#FFFFFF" : "#5C706E",
                    transition: "all 150ms ease",
                  }}
                >
                  {fl.label}
                </button>
              ))}
            </div>
          )}

          <div className="jt-filter-pills">
            {[
              { key: "all", label: `All (${statusCounts.total || 0})` },
              { key: "pending", label: `Pending (${statusCounts.pending || 0})` },
              { key: "sent", label: `Approved (${statusCounts.sent || 0})` },
              { key: "rejected", label: `Declined (${statusCounts.rejected || 0})` },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={`jt-pill-btn ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="jt-view-switcher">
            <button
              type="button"
              className={`jt-view-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
            >
              Cards
            </button>
            <button
              type="button"
              className={`jt-view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <JewelleryTransactionSkeletonList count={6} viewMode={viewMode} />
        ) : displayedRequests.length === 0 ? (
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
            <HistoryIcon size={40} color="#B4CECC" style={{ marginBottom: "12px" }} />
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#073B3F" }}>
              No jewellery transactions found
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "13.5px" }}>
              {flowFilter === "inward"
                ? "No jewellery requests submitted by you found in this filter."
                : flowFilter === "outward"
                ? "No jewellery requests submitted to you by downlines found in this filter."
                : flowFilter === "mint"
                ? "No master stock minting additions logged."
                : flowFilter === "disbursed"
                ? "No stock disbursements to downlines logged."
                : "Transactions matching your filters will appear here once jewellery allocations occur."}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          /* Cards View */
          <>
            <div className="jt-cards-grid">
              {displayedRequests.slice(0, visibleLimit).map((r) => {
              const statusInfo = STATUS_CFG[r.status] || STATUS_CFG.pending;
              const StatusIcon = statusInfo.icon;
              const reqRoleBadge = ROLE_BADGE_CONFIG[r.requested_by_role] || {
                bg: "#F1F5F9",
                color: "#334155",
                border: "#E2E8F0",
                label: r.requested_by_role,
              };
              const isInward = (r.requested_by_email || "").toLowerCase() === myEmail;
              const isOutward = (r.requested_to_email || "").toLowerCase() === myEmail;
              const isMint = r.reject_reason === "MASTER_MINT";

              return (
                <div key={r.id} className="jt-tx-card">
                  <div className="jt-tx-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span className="jt-tx-id">Transfer #{r.id}</span>
                      {isMint ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: "#EDE9FE",
                            color: "#6B21A8",
                            border: "1px solid #DDD6FE",
                          }}
                        >
                          📦 Master Stock Added
                        </span>
                      ) : isSuperAdmin ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: "#E0F2FE",
                            color: "#0369A1",
                            border: "1px solid #BAE6FD",
                          }}
                        >
                          ↗️ Stock Disbursed
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: isInward ? "#E6F4EA" : isOutward ? "#E0F2FE" : "#F1F5F9",
                            color: isInward ? "#137333" : isOutward ? "#0369A1" : "#475569",
                            border: `1px solid ${isInward ? "#CEEAD6" : isOutward ? "#BAE6FD" : "#CBD5E1"}`,
                          }}
                        >
                          {isInward ? "↙️ Stock Received" : isOutward ? "↗️ Stock Disbursed" : "Transfer"}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "3px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        border: `1px solid ${statusInfo.border}`,
                      }}
                    >
                      <StatusIcon size={12} color={statusInfo.color} /> {statusInfo.label}
                    </span>
                  </div>

                  {/* Parties Box */}
                  {isMint ? (
                    <div className="jt-parties-box">
                      <div className="jt-party-row">
                        <span className="jt-party-label">Event:</span>
                        <strong style={{ color: "#6B21A8" }}>
                          📦 Added to Vault Inventory by Super Admin
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="jt-parties-box">
                      <div className="jt-party-row">
                        <span className="jt-party-label">Requester:</span>
                        <div>
                          <strong style={{ color: "#073B3F" }}>
                            {r.requested_by_name || r.requested_by_email}
                          </strong>
                          <span
                            style={{
                              marginLeft: "6px",
                              fontSize: "10.5px",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: reqRoleBadge.bg,
                              color: reqRoleBadge.color,
                            }}
                          >
                            {reqRoleBadge.label}
                          </span>
                          {isInward && (
                            <span style={{ marginLeft: "6px", fontSize: "11px", color: "#166534", fontWeight: 700 }}>
                              (You)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="jt-party-row">
                        <span className="jt-party-label">Disbursed By:</span>
                        <strong style={{ color: "#2C3E3D" }}>
                          {r.requested_to_name || r.requested_to_email || "Super Admin"}
                          {isOutward && (
                            <span style={{ marginLeft: "6px", fontSize: "11px", color: "#0369A1", fontWeight: 700 }}>
                              (You)
                            </span>
                          )}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Items list */}
                  <div className="jt-items-list">
                    {r.items?.map((item, idx) => {
                      const p = item.product;
                      const img = p?.images?.[0]?.image;
                      return (
                        <div key={idx} className="jt-item-row">
                          <div
                            style={{ cursor: p ? "pointer" : "default" }}
                            onClick={() => p && setPreviewProduct(p)}
                            title={p ? "Click to zoom image" : ""}
                          >
                            {img ? (
                              <img
                                src={img}
                                alt={p?.name}
                                style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 8,
                                  background: "#EFF6F6",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <JewelryIcon size={18} color="#073B3F" />
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "#073B3F" }}>
                                {p?.name || "Jewellery Piece"}
                              </span>
                              {p?.product_code && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontFamily: "monospace",
                                    fontWeight: 800,
                                    color: "#073B3F",
                                    background: "#EEF4F4",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                    border: "1px solid #D6E2E1",
                                  }}
                                >
                                  {p.product_code}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: "#5C706E" }}>
                              {p?.metal?.toUpperCase()} {p?.grade} | Net: {p?.net_weight || p?.cross_weight}g
                            </div>
                          </div>
                          <div style={{ fontWeight: 800, color: "#073B3F", fontSize: "14px" }}>
                            x{item.qty}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: "11.5px", color: "#7A8987", marginTop: "auto" }}>
                    Logged: {new Date(r.created_at).toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}
          </div>
          <LoadMoreControl
            currentVisible={visibleLimit}
            totalCount={displayedRequests.length}
            onLoadMore={(step) => setVisibleLimit((v) => v + step)}
            itemName="transactions"
          />
        </>
        ) : (
          /* Table View */
          <>
            <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E1EBEA", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFA", textAlign: "left", borderBottom: "1px solid #E1EBEA" }}>
                    <th style={{ padding: "12px 16px", color: "#5C706E" }}>ID</th>
                    <th style={{ padding: "12px 16px", color: "#5C706E" }}>Event / Direction</th>
                    <th style={{ padding: "12px 16px", color: "#5C706E" }}>Requester / Action</th>
                    <th style={{ padding: "12px 16px", color: "#5C706E" }}>Approver / Vault</th>
                    <th style={{ padding: "12px 16px", color: "#5C706E" }}>Jewellery Items</th>
                    <th style={{ padding: "12px 16px", color: "#5C706E" }}>Status</th>
                    <th style={{ padding: "12px 16px", color: "#5C706E" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRequests.slice(0, visibleLimit).map((r) => {
                  const statusInfo = STATUS_CFG[r.status] || STATUS_CFG.pending;
                  const isInward = (r.requested_by_email || "").toLowerCase() === myEmail;
                  const isOutward = (r.requested_to_email || "").toLowerCase() === myEmail;
                  const isMint = r.reject_reason === "MASTER_MINT";

                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F0F4F4" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#073B3F" }}>
                        #{r.id}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {isMint ? (
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 800,
                              background: "#EDE9FE",
                              color: "#6B21A8",
                              border: "1px solid #DDD6FE",
                            }}
                          >
                            📦 Master Stock Added
                          </span>
                        ) : isSuperAdmin ? (
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 800,
                              background: "#E0F2FE",
                              color: "#0369A1",
                              border: "1px solid #BAE6FD",
                            }}
                          >
                            ↗️ Stock Disbursed
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 800,
                              background: isInward ? "#E6F4EA" : isOutward ? "#E0F2FE" : "#F1F5F9",
                              color: isInward ? "#137333" : isOutward ? "#0369A1" : "#475569",
                              border: `1px solid ${isInward ? "#CEEAD6" : isOutward ? "#BAE6FD" : "#CBD5E1"}`,
                            }}
                          >
                            {isInward ? "↙️ Received" : isOutward ? "↗️ Disbursed" : "Transfer"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {isMint ? (
                          <strong style={{ color: "#6B21A8" }}>Super Admin (Vault Root)</strong>
                        ) : (
                          <>
                            <strong>{r.requested_by_name || r.requested_by_email}</strong>
                            {isInward && <span style={{ color: "#166534", marginLeft: "4px", fontSize: "11px" }}>(You)</span>}
                            <div style={{ fontSize: "11px", color: "#7A8987" }}>{r.requested_by_role}</div>
                          </>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {isMint ? (
                          <span style={{ color: "#5C706E" }}>Vault Inventory</span>
                        ) : (
                          <>
                            {r.requested_to_name || r.requested_to_email || "Super Admin"}
                            {isOutward && <span style={{ color: "#0369A1", marginLeft: "4px", fontSize: "11px" }}>(You)</span>}
                          </>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {(r.items || []).map((i, iIdx) => (
                          <span
                            key={iIdx}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              marginRight: "8px",
                              cursor: i.product ? "pointer" : "default",
                            }}
                            onClick={() => i.product && setPreviewProduct(i.product)}
                            title={i.product ? "Click to zoom image" : ""}
                          >
                            <span style={{ color: "#073B3F", fontWeight: 700 }}>{i.product?.name || "Piece"}</span>
                            {i.product?.product_code && (
                              <span
                                style={{
                                  fontSize: "9.5px",
                                  fontFamily: "monospace",
                                  fontWeight: 800,
                                  background: "#EEF4F4",
                                  padding: "1px 4px",
                                  borderRadius: "4px",
                                  border: "1px solid #D6E2E1",
                                }}
                              >
                                {i.product.product_code}
                              </span>
                            )}
                            <strong style={{ color: "#073B3F" }}>x{i.qty}</strong>
                          </span>
                        ))}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#5C706E" }}>
                        {new Date(r.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <LoadMoreControl
            currentVisible={visibleLimit}
            totalCount={displayedRequests.length}
            onLoadMore={(step) => setVisibleLimit((v) => v + step)}
            itemName="transactions"
          />
        </>
      )}
      </div>

      {/* High-Res Product Image Modal */}
      <JewelleryImageModal
        isOpen={Boolean(previewProduct)}
        onClose={() => setPreviewProduct(null)}
        product={previewProduct}
      />
    </div>
  );
}
