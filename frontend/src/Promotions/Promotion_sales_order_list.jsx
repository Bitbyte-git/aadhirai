import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";
import { SkeletonText } from "../components/Skeleton";

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Rs. 0";
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const LIST_TITLES = {
  customers: "Customer Downline",
  retailers: "Retailers List",
  wholesale_dealers: "Wholesale Dealers List",
  distributors: "Distributors List",
};

const ROLE_LABELS = {
  customer: "Customer",
  promotor: "Retailer",
  sub_dealer: "Wholesale Dealer",
  dealer: "Distributor",
};

export default function PromotionSalesOrderList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const nodeType = searchParams.get("node_type");
  const userId = searchParams.get("user_id");
  const nodeName = searchParams.get("name") || "";
  const listType = searchParams.get("list_type") || "customers";
  const orderFilter = searchParams.get("order_filter") || "all";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(""), 2800);
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCSV = () => {
    if (!filteredRows.length) return;
    const headers = isCustomerMode
      ? ["Position", "Customer ID", "Name", "Email", "Phone", "Orders", "Total Value (INR)"]
      : ["#", "Node ID", "Name", "Email", "Phone", "Customers", "Total Value (INR)"];

    const csvData = filteredRows.map((r, i) =>
      isCustomerMode
        ? [
            `"${r.position || i + 1}"`,
            `"${r.customer_id || ""}"`,
            `"${(r.name || "").replace(/"/g, '""')}"`,
            `"${r.email || ""}"`,
            `"${r.phone || ""}"`,
            r.order_count || 0,
            r.total_value || 0,
          ]
        : [
            i + 1,
            `"${r.id_str || ""}"`,
            `"${(r.name || "").replace(/"/g, '""')}"`,
            `"${r.email || ""}"`,
            `"${r.phone || ""}"`,
            r.total_customers || 0,
            r.total_value || 0,
          ]
    );

    const blob = new Blob(
      [[headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `promotion_${listType}_${userId || "orders"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file exported successfully!");
  };

  useEffect(() => {
    if (!nodeType || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    const url =
      listType === "customers"
        ? `/promotion-customers/?node_type=${nodeType}&user_id=${userId}&order_filter=${orderFilter}`
        : `/promotion-nodes/?node_type=${nodeType}&list_type=${listType}&user_id=${userId}`;

    api
      .get(url)
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        setError(err.response?.data?.error || "Could not load promotional orders list.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [nodeType, userId, listType, orderFilter]);

  const isCustomerMode = listType === "customers";

  // Filtered rows by search query
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase().trim();
    return rows.filter((r) => {
      const id = (isCustomerMode ? r.customer_id : r.id_str) || "";
      const name = r.name || "";
      const email = r.email || "";
      const phone = r.phone || "";
      const pos = String(r.position || "");
      return (
        id.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q) ||
        pos.toLowerCase().includes(q)
      );
    });
  }, [rows, searchTerm, isCustomerMode]);

  // Key Aggregations
  const totalRecords = rows.length;
  const totalOrders = isCustomerMode
    ? rows.reduce((sum, r) => sum + (Number(r.order_count) || 0), 0)
    : null;
  const totalCustomersAgg = !isCustomerMode
    ? rows.reduce((sum, r) => sum + (Number(r.total_customers) || 0), 0)
    : null;
  const totalValue = rows.reduce((sum, r) => sum + (Number(r.total_value) || 0), 0);
  const avgOrderValue =
    isCustomerMode && totalOrders > 0
      ? totalValue / totalOrders
      : !isCustomerMode && totalRecords > 0
      ? totalValue / totalRecords
      : 0;

  const pageTitle = LIST_TITLES[listType] || "Order Breakdown";
  const parentRole = ROLE_LABELS[nodeType] || "Node";

  return (
    <div className="psl-root">
      <style>{`
        .psl-root {
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
        }

        .psl-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px 48px 64px;
          box-sizing: border-box;
        }

        /* Top Nav & Breadcrumbs */
        .psl-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .psl-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5C706E;
          font-weight: 500;
        }

        .psl-breadcrumb .link {
          color: #073B3F;
          cursor: pointer;
          font-weight: 700;
          text-decoration: none;
        }

        .psl-breadcrumb .link:hover {
          text-decoration: underline;
        }

        .psl-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          background: #FFFFFF;
          border: 1px solid #D6E2E1;
          border-radius: 999px;
          color: #073B3F;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(7,59,63,0.04);
          transition: all 180ms ease;
        }

        .psl-back-btn:hover {
          background: #F0F5F5;
          border-color: #073B3F;
          transform: translateX(-2px);
        }

        /* Header Card */
        .psl-header-card {
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

        .psl-header-info h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .psl-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(7, 59, 63, 0.08);
          color: #073B3F;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .psl-filter-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        .psl-header-sub {
          margin: 6px 0 0;
          color: #5C706E;
          font-size: 13.5px;
          line-height: 1.5;
        }

        .psl-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .psl-btn-export {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
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

        .psl-btn-export:hover {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        .psl-btn-export:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Stats Grid */
        .psl-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
          width: 100%;
        }

        .psl-stat-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 20px 22px;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.03);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          transition: transform 160ms ease, box-shadow 160ms ease;
          min-width: 0;
        }

        .psl-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.07);
        }

        .psl-stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: #073B3F;
          border-top-left-radius: 16px;
          border-bottom-left-radius: 16px;
        }

        .psl-stat-card.stat-accent::before {
          background: #CCA881;
        }

        .psl-stat-card.stat-green::before {
          background: #166534;
        }

        .psl-stat-card.stat-purple::before {
          background: #6366F1;
        }

        .psl-stat-content {
          display: flex;
          flex-direction: column;
        }

        .psl-stat-title {
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #728A87;
          margin-bottom: 8px;
        }

        .psl-stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1.1;
          font-feature-settings: "tnum";
        }

        .psl-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #F4F7F6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #073B3F;
          flex-shrink: 0;
        }

        /* Panel Container */
        .psl-panel {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          box-shadow: 0 6px 24px rgba(7, 59, 63, 0.04);
          overflow: hidden;
        }

        .psl-panel-header {
          padding: 20px 24px;
          border-bottom: 1px solid #EDF2F1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .psl-panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .psl-panel-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #073B3F;
        }

        .psl-panel-count-pill {
          background: #F0F5F4;
          color: #073B3F;
          font-size: 12px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid #D5E3E1;
        }

        .psl-search-box {
          display: flex;
          align-items: center;
          background: #F4F7F6;
          border: 1px solid #D9E4E3;
          border-radius: 12px;
          padding: 8px 14px;
          gap: 10px;
          width: 280px;
          max-width: 100%;
          transition: all 180ms ease;
        }

        .psl-search-box:focus-within {
          background: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.1);
        }

        .psl-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13px;
          color: #111817;
        }

        .psl-search-clear {
          background: none;
          border: none;
          color: #728A87;
          cursor: pointer;
          padding: 0;
          font-size: 14px;
        }

        /* Desktop Table */
        .psl-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .psl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          text-align: left;
        }

        .psl-table thead th {
          background: #F8FAF9;
          padding: 12px 14px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #5C706E;
          border-bottom: 1px solid #E1EBEA;
          white-space: nowrap;
        }

        .psl-table tbody tr {
          border-bottom: 1px solid #EDF2F1;
          transition: background 120ms ease;
        }

        .psl-table tbody tr:hover {
          background: #F5FAF9;
        }

        .psl-table tbody tr:last-child {
          border-bottom: none;
        }

        .psl-table td {
          padding: 12px 14px;
          vertical-align: middle;
          white-space: nowrap;
        }

        /* Table Components */
        .psl-rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #F0F5F4;
          color: #073B3F;
          font-size: 12px;
          font-weight: 800;
          font-family: monospace;
        }

        .psl-id-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F0F5F4;
          border: 1px solid #D5E3E1;
          padding: 4px 10px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 12px;
          font-weight: 700;
          color: #073B3F;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .psl-id-pill:hover {
          background: #E3ECEB;
          border-color: #073B3F;
        }

        .psl-pill-copy-done {
          background: #E8F5E9 !important;
          border-color: #A5D6A7 !important;
          color: #2E7D32 !important;
        }

        .psl-user-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .psl-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #073B3F, #126368);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
          text-transform: uppercase;
        }

        .psl-user-meta {
          display: flex;
          flex-direction: column;
        }

        .psl-name {
          font-weight: 700;
          color: #0A2F33;
          font-size: 13.5px;
        }

        .psl-sub {
          color: #728A87;
          font-size: 12px;
          margin-top: 1px;
        }

        .psl-phone-link {
          color: #364B49;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .psl-phone-link:hover {
          color: #073B3F;
          text-decoration: underline;
        }

        .psl-pos-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .pos-promoted {
          background: #DCFCE7;
          color: #166534;
          border: 1px solid #BBF7D0;
        }

        .pos-regular {
          background: #F0F5F4;
          color: #5C706E;
        }

        .psl-count-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #F0F5F4;
          color: #073B3F;
          font-weight: 800;
          font-size: 12.5px;
        }

        .psl-value-col {
          font-weight: 800;
          color: #073B3F;
          font-feature-settings: "tnum";
          font-size: 13.5px;
          text-align: right;
        }

        /* Mobile Cards (Hidden on Desktop) */
        .psl-mobile-cards {
          display: none;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
        }

        .psl-card-item {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.03);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .psl-card-item-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .psl-card-item-body {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          background: #F8FAF9;
          padding: 10px 12px;
          border-radius: 10px;
        }

        .psl-card-stat {
          display: flex;
          flex-direction: column;
        }

        .psl-card-stat-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #728A87;
          text-transform: uppercase;
        }

        .psl-card-stat-value {
          font-size: 13.5px;
          font-weight: 800;
          color: #073B3F;
          margin-top: 2px;
        }

        .psl-empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .psl-empty-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #F0F5F4;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #728A87;
          margin-bottom: 4px;
        }

        .psl-empty-title {
          font-size: 15px;
          font-weight: 800;
          color: #0A2F33;
          margin: 0;
        }

        .psl-empty-desc {
          font-size: 13px;
          color: #728A87;
          margin: 0;
          max-width: 340px;
        }

        .psl-error-banner {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 13.5px;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Missing Params Helper Card */
        .psl-missing-params-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 32px 28px;
          box-shadow: 0 4px 20px rgba(7, 59, 63, 0.04);
          text-align: center;
          max-width: 600px;
          margin: 40px auto;
        }

        .psl-missing-title {
          font-size: 18px;
          font-weight: 800;
          color: #073B3F;
          margin: 12px 0 6px;
        }

        .psl-missing-desc {
          font-size: 13.5px;
          color: #5C706E;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .psl-links-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .psl-quick-link-btn {
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #D6E2E1;
          background: #F8FAF9;
          color: #073B3F;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 160ms ease;
        }

        .psl-quick-link-btn:hover {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          transform: translateY(-2px);
        }

        /* Toast */
        .psl-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #073B3F;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(7, 59, 63, 0.3);
          z-index: 9999;
          animation: toastSlide 200ms ease;
        }

        @keyframes toastSlide {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Responsive Breakpoints */
        @media (max-width: 1200px) {
          .psl-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .psl-shell {
            padding: 16px 14px 48px;
          }

          .psl-header-card {
            padding: 18px 16px;
            flex-direction: column;
            align-items: flex-start;
          }

          .psl-header-actions {
            width: 100%;
          }

          .psl-btn-export {
            width: 100%;
            justify-content: center;
          }

          .psl-panel-header {
            padding: 16px;
            flex-direction: column;
            align-items: stretch;
          }

          .psl-search-box {
            width: 100%;
          }

          .psl-table-wrap {
            display: none;
          }

          .psl-mobile-cards {
            display: flex;
          }

          .psl-links-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .psl-stats-grid {
            grid-template-columns: 1fr;
          }

          .psl-stat-card {
            padding: 16px;
          }
        }
      `}</style>

      <div className="psl-shell">
        {/* Topbar / Navigation */}
        <div className="psl-topbar">
          <div className="psl-breadcrumb">
            <span className="link" onClick={() => navigate(-1)}>
              Promotions
            </span>
            <span>/</span>
            <span style={{ color: "#073B3F", fontWeight: 700 }}>{pageTitle}</span>
          </div>
          <button className="psl-back-btn" onClick={() => navigate(-1)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="psl-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Missing Params Helper */}
        {!nodeType || !userId ? (
          <div className="psl-missing-params-card">
            <div className="psl-empty-icon" style={{ margin: "0 auto" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#073B3F" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="psl-missing-title">No Candidate Selected</h2>
            <p className="psl-missing-desc">
              Please choose a candidate from any of the promotion management pages below to view their detailed downline orders breakdown.
            </p>
            <div className="psl-links-grid">
              <button className="psl-quick-link-btn" onClick={() => navigate("/promotions/retailer")}>
                <span>Retailer Promotions →</span>
              </button>
              <button className="psl-quick-link-btn" onClick={() => navigate("/promotions/wholesale-dealer")}>
                <span>Wholesale Dealer →</span>
              </button>
              <button className="psl-quick-link-btn" onClick={() => navigate("/promotions/distributor")}>
                <span>Distributor Promotions →</span>
              </button>
              <button className="psl-quick-link-btn" onClick={() => navigate("/promotions/super-stockist")}>
                <span>Super Stockist →</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Header Card */}
            <div className="psl-header-card">
              <div className="psl-header-info">
                <h1>
                  <span>{pageTitle}</span>
                  {nodeName && <span style={{ color: "#073B3F" }}>— {nodeName}</span>}
                  <span className="psl-role-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {parentRole}
                  </span>
                  {isCustomerMode && orderFilter === "orders_only" && (
                    <span className="psl-filter-badge">Ordered Customers Only</span>
                  )}
                </h1>
                <p className="psl-header-sub">
                  {isCustomerMode
                    ? orderFilter === "orders_only"
                      ? "Showing all customers who placed orders in this hierarchy downline."
                      : "Showing full recursive customer chain and downline order performance."
                    : `Showing all direct and downline ${pageTitle.toLowerCase()} ranked by sales value.`}
                </p>
              </div>

              <div className="psl-header-actions">
                <button
                  className="psl-btn-export"
                  onClick={exportCSV}
                  disabled={loading || filteredRows.length === 0}
                  title="Download CSV report"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* KPI Metrics Grid */}
            <div className="psl-stats-grid">
              <div className="psl-stat-card">
                <div className="psl-stat-content">
                  <span className="psl-stat-title">
                    {isCustomerMode ? "Total Customers" : "Total Candidates"}
                  </span>
                  <span className="psl-stat-number">
                    {loading ? (
                      <SkeletonText width="48px" height="24px" />
                    ) : (
                      totalRecords
                    )}
                  </span>
                </div>
                <div className="psl-stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>

              <div className="psl-stat-card stat-accent">
                <div className="psl-stat-content">
                  <span className="psl-stat-title">
                    {isCustomerMode ? "Total Orders" : "Downline Customers"}
                  </span>
                  <span className="psl-stat-number">
                    {loading ? (
                      <SkeletonText width="48px" height="24px" />
                    ) : isCustomerMode ? (
                      totalOrders
                    ) : (
                      totalCustomersAgg
                    )}
                  </span>
                </div>
                <div className="psl-stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
              </div>

              <div className="psl-stat-card stat-green">
                <div className="psl-stat-content">
                  <span className="psl-stat-title">Total Network Volume</span>
                  <span className="psl-stat-number" style={{ color: "#166534" }}>
                    {loading ? (
                      <SkeletonText width="80px" height="24px" />
                    ) : (
                      money(totalValue)
                    )}
                  </span>
                </div>
                <div className="psl-stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12" />
                    <path d="M6 8h12" />
                    <path d="M6 13l8.5 8" />
                    <path d="M6 13h3a4 4 0 0 0 0-8H6" />
                  </svg>
                </div>
              </div>

              <div className="psl-stat-card stat-purple">
                <div className="psl-stat-content">
                  <span className="psl-stat-title">
                    {isCustomerMode ? "Avg Order Value" : "Avg Node Volume"}
                  </span>
                  <span className="psl-stat-number" style={{ color: "#4F46E5" }}>
                    {loading ? (
                      <SkeletonText width="70px" height="24px" />
                    ) : (
                      money(avgOrderValue)
                    )}
                  </span>
                </div>
                <div className="psl-stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Panel & Table */}
            <div className="psl-panel">
              <div className="psl-panel-header">
                <div className="psl-panel-title-wrap">
                  <h3 className="psl-panel-title">Breakdown Records</h3>
                  <span className="psl-panel-count-pill">
                    {filteredRows.length} {filteredRows.length === 1 ? "Record" : "Records"}
                  </span>
                </div>

                <div className="psl-search-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#728A87" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="psl-search-input"
                    placeholder="Search name, ID, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="psl-search-clear" onClick={() => setSearchTerm("")}>
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="psl-table-wrap">
                <table className="psl-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "center", width: "44px" }}>#</th>
                      <th>Custom ID</th>
                      <th>Name & Email</th>
                      <th>Phone Number</th>
                      {isCustomerMode && <th>Role / Status</th>}
                      <th style={{ textAlign: "center" }}>
                        {isCustomerMode ? "Orders" : "Total Customers"}
                      </th>
                      <th style={{ textAlign: "right" }}>Total Sales Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [0, 1, 2, 3, 4].map((i) => (
                        <tr key={i}>
                          <td style={{ textAlign: "center" }}>
                            <SkeletonText width="22px" height="12px" style={{ margin: "0 auto" }} />
                          </td>
                          <td><SkeletonText width="110px" height="20px" /></td>
                          <td>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <SkeletonText width="34px" height="34px" style={{ borderRadius: "50%" }} />
                              <div>
                                <SkeletonText width="120px" height="13px" />
                                <div style={{ marginTop: 4 }}>
                                  <SkeletonText width="140px" height="10px" />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td><SkeletonText width="90px" height="13px" /></td>
                          {isCustomerMode && <td><SkeletonText width="70px" height="16px" /></td>}
                          <td style={{ textAlign: "center" }}><SkeletonText width="32px" height="18px" style={{ margin: "0 auto" }} /></td>
                          <td style={{ textAlign: "right" }}><SkeletonText width="85px" height="14px" style={{ marginLeft: "auto" }} /></td>
                        </tr>
                      ))
                    ) : filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={isCustomerMode ? 7 : 6}>
                          <div className="psl-empty-state">
                            <div className="psl-empty-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              </svg>
                            </div>
                            <h4 className="psl-empty-title">No records match your query</h4>
                            <p className="psl-empty-desc">
                              {searchTerm ? `No results found for "${searchTerm}".` : "No downline order records currently available."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r, i) => {
                        const idVal = (isCustomerMode ? r.customer_id : r.id_str) || "";
                        const initials = (r.name || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("");
                        const isPromotedNode = ["Retailer", "Wholesale Dealer", "Distributor"].includes(r.position);

                        return (
                          <tr key={idVal || i}>
                            <td style={{ textAlign: "center" }}>
                              <span className="psl-rank-badge">
                                {i + 1}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`psl-id-pill ${copiedId === idVal ? "psl-pill-copy-done" : ""}`}
                                onClick={() => handleCopy(idVal, idVal)}
                                title="Click to copy ID"
                              >
                                <span>{idVal}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  {copiedId === idVal ? (
                                    <polyline points="20 6 9 17 4 12" />
                                  ) : (
                                    <>
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </>
                                  )}
                                </svg>
                              </span>
                            </td>
                            <td>
                              <div className="psl-user-col">
                                <div className="psl-avatar">{initials}</div>
                                <div className="psl-user-meta">
                                  <span className="psl-name">{r.name}</span>
                                  <span className="psl-sub">{r.email || "No email"}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              {r.phone ? (
                                <a href={`tel:${r.phone}`} className="psl-phone-link">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                  <span>{r.phone}</span>
                                </a>
                              ) : (
                                <span style={{ color: "#92A6A4" }}>—</span>
                              )}
                            </td>
                            {isCustomerMode && (
                              <td>
                                <span className={`psl-pos-tag ${isPromotedNode ? "pos-promoted" : "pos-regular"}`}>
                                  {r.position || "Customer"}
                                </span>
                              </td>
                            )}
                            <td style={{ textAlign: "center" }}>
                              <span className="psl-count-pill">
                                {isCustomerMode ? r.order_count || 0 : r.total_customers || 0}
                              </span>
                            </td>
                            <td className="psl-value-col">
                              {money(r.total_value)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="psl-mobile-cards">
                {loading ? (
                  [0, 1, 2].map((i) => (
                    <div key={i} className="psl-card-item">
                      <div className="psl-card-item-head">
                        <SkeletonText width="120px" height="16px" />
                        <SkeletonText width="60px" height="14px" />
                      </div>
                      <div className="psl-card-item-body">
                        <div><SkeletonText width="60px" height="10px" /></div>
                        <div><SkeletonText width="60px" height="10px" /></div>
                      </div>
                    </div>
                  ))
                ) : filteredRows.length === 0 ? (
                  <div className="psl-empty-state">
                    <div className="psl-empty-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <h4 className="psl-empty-title">No records found</h4>
                    <p className="psl-empty-desc">No records match your query.</p>
                  </div>
                ) : (
                  filteredRows.map((r, i) => {
                    const idVal = (isCustomerMode ? r.customer_id : r.id_str) || "";
                    const initials = (r.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("");

                    return (
                      <div key={idVal || i} className="psl-card-item">
                        <div className="psl-card-item-head">
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="psl-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: "#073B3F", fontSize: 13.5 }}>
                                {r.name}
                              </div>
                              <span
                                className={`psl-id-pill ${copiedId === idVal ? "psl-pill-copy-done" : ""}`}
                                onClick={() => handleCopy(idVal, idVal)}
                                style={{ marginTop: 2, padding: "2px 8px", fontSize: 11 }}
                              >
                                {idVal}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, color: "#073B3F", fontSize: 14 }}>
                              {money(r.total_value)}
                            </div>
                            {isCustomerMode && (
                              <span className="psl-pos-tag pos-regular" style={{ fontSize: 9.5 }}>
                                {r.position || "Customer"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="psl-card-item-body">
                          <div className="psl-card-stat">
                            <span className="psl-card-stat-label">Phone</span>
                            <span className="psl-card-stat-value">
                              {r.phone ? (
                                <a href={`tel:${r.phone}`} style={{ color: "#073B3F", textDecoration: "none" }}>
                                  {r.phone}
                                </a>
                              ) : (
                                "—"
                              )}
                            </span>
                          </div>
                          <div className="psl-card-stat" style={{ textAlign: "right" }}>
                            <span className="psl-card-stat-label">
                              {isCustomerMode ? "Order Count" : "Customers"}
                            </span>
                            <span className="psl-card-stat-value">
                              {isCustomerMode ? r.order_count || 0 : r.total_customers || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {toast && <div className="psl-toast">{toast}</div>}
    </div>
  );
}