import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { SkeletonText } from "../components/Skeleton";

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Rs. 0";
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const STATUS_CFG = {
  none: { label: "Eligible (Pending)", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
  pending: { label: "Pending Review", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
  approved: { label: "Approved", color: "#166534", bg: "#DCFCE7", border: "#BBF7D0" },
  rejected: { label: "Rejected", color: "#991B1B", bg: "#FEE2E2", border: "#FECACA" },
};

export default function WholesaleDealerPromotions() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const [confirmReject, setConfirmReject] = useState(null);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const fetchRows = () => {
    setLoading(true);
    setError("");
    api
      .get("/wholesale-dealer-promotions/")
      .then((res) => {
        setRows(Array.isArray(res.data?.results) ? res.data.results : []);
        setApprovedCount(res.data?.approved_count || 0);
        setRejectedCount(res.data?.rejected_count || 0);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Could not load wholesale dealer promotions.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const showToast = (text, type = "success") => {
    setToast(text);
    setToastType(type);
    setTimeout(() => setToast(""), 3200);
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runAction = async (userId, action) => {
    setActingId(userId);
    try {
      await api.post(`/wholesale-dealer-promotions/${userId}/action/`, { action });
      showToast(
        action === "approve"
          ? "Approved! Retailer promoted to Wholesale Dealer."
          : "Promotion request rejected.",
        action === "approve" ? "success" : "error"
      );
      setConfirmReject(null);
      fetchRows();
    } catch (err) {
      showToast(err.response?.data?.error || "Action failed.", "error");
    } finally {
      setActingId(null);
    }
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Status filter
      if (statusFilter === "pending") {
        if (r.status !== "pending" && r.status !== "none") return false;
      } else if (statusFilter === "approved") {
        if (r.status !== "approved") return false;
      } else if (statusFilter === "rejected") {
        if (r.status !== "rejected") return false;
      }

      // Search query
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      const pid = (r.promotor_id || "").toLowerCase();
      const fn = (r.first_name || "").toLowerCase();
      const ln = (r.last_name || "").toLowerCase();
      const em = (r.email || "").toLowerCase();
      const ph = (r.mobile_number || "").toLowerCase();
      return (
        pid.includes(q) ||
        fn.includes(q) ||
        ln.includes(q) ||
        `${fn} ${ln}`.includes(q) ||
        em.includes(q) ||
        ph.includes(q)
      );
    });
  }, [rows, statusFilter, searchTerm]);

  // Key Aggregations
  const pendingCount = rows.filter((r) => r.status === "pending" || r.status === "none").length;

  const exportCSV = () => {
    if (!filteredRows.length) return;
    const headers = [
      "S.No",
      "Retailer ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone Number",
      "Today's Customers",
      "Total Customers",
      "Total Sales Value (INR)",
      "Status",
    ];

    const csvRows = filteredRows.map((r, i) => [
      i + 1,
      `"${r.promotor_id || ""}"`,
      `"${(r.first_name || "").replace(/"/g, '""')}"`,
      `"${(r.last_name || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      `"${r.mobile_number || ""}"`,
      r.today_customers || 0,
      r.total_customers || 0,
      r.total_value || 0,
      `"${r.status || "pending"}"`,
    ]);

    const blob = new Blob([[headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wholesale_dealer_promotions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported Wholesale Dealer Promotions CSV");
  };

  return (
    <div className="wdp-root">
      <style>{`
        .wdp-root {
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

        .wdp-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px 48px 64px;
          box-sizing: border-box;
        }

        /* Topbar */
        .wdp-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .wdp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5C706E;
          font-weight: 500;
        }

        .wdp-back-btn {
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

        .wdp-back-btn:hover {
          background: #F0F5F5;
          border-color: #073B3F;
          transform: translateX(-2px);
        }

        /* Header Card */
        .wdp-header-card {
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

        .wdp-header-info h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .wdp-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(7, 59, 63, 0.08);
          color: #073B3F;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .wdp-header-sub {
          margin: 6px 0 0;
          color: #5C706E;
          font-size: 13.5px;
          line-height: 1.5;
        }

        .wdp-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .wdp-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: #FFFFFF;
          border: 1px solid #D6E2E1;
          border-radius: 12px;
          color: #073B3F;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(7, 59, 63, 0.04);
          transition: all 180ms ease;
        }

        .wdp-refresh-btn:hover {
          background: #F0F5F4;
          border-color: #073B3F;
        }

        .wdp-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .wdp-export-btn {
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

        .wdp-export-btn:hover {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        /* Stats Grid */
        .wdp-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
          width: 100%;
        }

        .wdp-stat-card {
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

        .wdp-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.07);
        }

        .wdp-stat-card::before {
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

        .wdp-stat-card.stat-accent::before { background: #CCA881; }
        .wdp-stat-card.stat-green::before { background: #166534; }
        .wdp-stat-card.stat-red::before { background: #DC2626; }

        .wdp-stat-content {
          display: flex;
          flex-direction: column;
        }

        .wdp-stat-title {
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #728A87;
          margin-bottom: 8px;
        }

        .wdp-stat-number {
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1.1;
          font-feature-settings: "tnum";
        }

        .wdp-stat-icon {
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
        .wdp-panel {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          box-shadow: 0 6px 24px rgba(7, 59, 63, 0.04);
          overflow: hidden;
        }

        .wdp-panel-header {
          padding: 20px 24px;
          border-bottom: 1px solid #EDF2F1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .wdp-filter-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .wdp-tab-chip {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          background: #F0F5F4;
          color: #5C706E;
          border: 1px solid transparent;
          transition: all 140ms ease;
        }

        .wdp-tab-chip:hover {
          background: #E3ECEB;
        }

        .wdp-tab-chip.active {
          background: #073B3F;
          color: #FFFFFF;
        }

        .wdp-search-box {
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

        .wdp-search-box:focus-within {
          background: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.1);
        }

        .wdp-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13px;
          color: #111817;
        }

        .wdp-search-clear {
          background: none;
          border: none;
          color: #728A87;
          cursor: pointer;
          padding: 0;
          font-size: 14px;
        }

        /* Desktop Table */
        .wdp-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .wdp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          text-align: left;
        }

        .wdp-table thead th {
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

        .wdp-table tbody tr {
          border-bottom: 1px solid #EDF2F1;
          transition: background 120ms ease;
        }

        .wdp-table tbody tr:hover {
          background: #F5FAF9;
        }

        .wdp-table tbody tr:last-child {
          border-bottom: none;
        }

        .wdp-table td {
          padding: 12px 14px;
          vertical-align: middle;
          white-space: nowrap;
        }

        .wdp-sno {
          font-weight: 800;
          color: #073B3F;
          font-family: monospace;
          text-align: center;
          width: 44px;
        }

        .wdp-id-pill {
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

        .wdp-id-pill:hover {
          background: #E3ECEB;
          border-color: #073B3F;
        }

        .wdp-pill-copy-done {
          background: #E8F5E9 !important;
          border-color: #A5D6A7 !important;
          color: #2E7D32 !important;
        }

        .wdp-user-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .wdp-avatar {
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

        .wdp-user-meta {
          display: flex;
          flex-direction: column;
        }

        .wdp-name {
          font-weight: 700;
          color: #0A2F33;
          font-size: 13.5px;
        }

        .wdp-sub {
          color: #728A87;
          font-size: 12px;
          margin-top: 1px;
        }

        .wdp-phone-link {
          color: #364B49;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .wdp-phone-link:hover {
          color: #073B3F;
          text-decoration: underline;
        }

        .wdp-count-pill {
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
          cursor: pointer;
          transition: all 140ms ease;
          border: 1px solid transparent;
        }

        .wdp-count-pill:hover {
          background: #073B3F;
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .wdp-value {
          font-weight: 800;
          color: #073B3F;
          font-feature-settings: "tnum";
          font-size: 13.5px;
          cursor: pointer;
          transition: all 140ms ease;
          display: inline-block;
        }

        .wdp-value:hover {
          color: #0C4E53;
          text-decoration: underline;
        }

        .wdp-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .wdp-action-btns {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .wdp-btn-approve {
          padding: 6px 14px;
          background: #073B3F;
          border: none;
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 140ms ease;
          box-shadow: 0 2px 6px rgba(7, 59, 63, 0.15);
        }

        .wdp-btn-approve:hover {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        .wdp-btn-reject {
          padding: 6px 14px;
          background: #FFFFFF;
          border: 1px solid #FECACA;
          border-radius: 8px;
          color: #DC2626;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .wdp-btn-reject:hover {
          background: #FEE2E2;
          border-color: #DC2626;
        }

        .wdp-btn-approve:disabled, .wdp-btn-reject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile Cards */
        .wdp-mobile-cards {
          display: none;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
        }

        .wdp-mobile-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.03);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .wdp-mobile-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .wdp-mobile-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          background: #F8FAF9;
          padding: 10px 12px;
          border-radius: 12px;
        }

        .wdp-mobile-meta-item {
          display: flex;
          flex-direction: column;
        }

        .wdp-mobile-meta-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #728A87;
        }

        .wdp-mobile-meta-val {
          font-size: 13px;
          font-weight: 800;
          color: #073B3F;
          margin-top: 2px;
        }

        .wdp-mobile-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .wdp-mobile-actions button {
          flex: 1;
          padding: 9px;
          font-size: 13px;
        }

        /* Confirmation Modal */
        .wdp-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(7, 59, 63, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .wdp-modal {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 28px;
          width: 440px;
          max-width: 100%;
          box-shadow: 0 20px 50px rgba(7, 59, 63, 0.2);
          animation: modalPop 200ms ease;
        }

        @keyframes modalPop {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .wdp-modal h3 {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 800;
          color: #073B3F;
        }

        .wdp-modal p {
          margin: 0 0 24px;
          font-size: 13.5px;
          color: #5C706E;
          line-height: 1.5;
        }

        .wdp-modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .wdp-modal-cancel {
          padding: 9px 18px;
          background: #F0F5F4;
          border: none;
          border-radius: 10px;
          color: #5C706E;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        .wdp-modal-confirm {
          padding: 9px 20px;
          background: #DC2626;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        /* Toast */
        .wdp-toast {
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

        .wdp-toast.error {
          background: #DC2626;
        }

        /* Empty State */
        .wdp-empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .wdp-empty-icon {
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

        .wdp-empty-title {
          font-size: 15px;
          font-weight: 800;
          color: #0A2F33;
          margin: 0;
        }

        .wdp-empty-desc {
          font-size: 13px;
          color: #728A87;
          margin: 0;
          max-width: 340px;
        }

        .wdp-error-banner {
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

        /* Responsive Breakpoints */
        @media (max-width: 1200px) {
          .wdp-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 768px) {
          .wdp-shell { padding: 16px 14px 48px; }
          .wdp-header-card { padding: 18px 16px; flex-direction: column; align-items: flex-start; }
          .wdp-header-actions { width: 100%; }
          .wdp-export-btn, .wdp-refresh-btn { flex: 1; justify-content: center; }
          .wdp-panel-header { padding: 16px; flex-direction: column; align-items: stretch; }
          .wdp-search-box { width: 100%; }
          .wdp-table-wrap { display: none; }
          .wdp-mobile-cards { display: flex; }
        }

        @media (max-width: 480px) {
          .wdp-stats-grid { grid-template-columns: 1fr; }
          .wdp-stat-card { padding: 16px; }
        }
      `}</style>

      <div className="wdp-shell">
        {/* Topbar */}
        <div className="wdp-topbar">
          <div className="wdp-breadcrumb">
            <span>Promotions</span>
            <span>/</span>
            <span style={{ color: "#073B3F", fontWeight: 700 }}>Wholesale Dealer Promotions</span>
          </div>
          <button className="wdp-back-btn" onClick={() => navigate(-1)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="wdp-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Header Card */}
        <div className="wdp-header-card">
          <div className="wdp-header-info">
            <h1>
              <span>Wholesale Dealer Promotions</span>
              <span className="wdp-role-badge">Retailer → Wholesale Dealer</span>
            </h1>
            <p className="wdp-header-sub">
              Retailers whose customer downline crossed ₹10,00,000 sales or 15+ customers.
              Review and approve them to promote them into Wholesale Dealers (Sub Dealers).
            </p>
          </div>

          <div className="wdp-header-actions">
            <button className="wdp-refresh-btn" onClick={fetchRows} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button className="wdp-export-btn" onClick={exportCSV} disabled={loading || !filteredRows.length}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="wdp-stats-grid">
          <div className="wdp-stat-card" style={{ cursor: "pointer" }} onClick={() => setStatusFilter("all")} title="Show All Candidates">
            <div className="wdp-stat-content">
              <span className="wdp-stat-title">Total Candidates</span>
              <span className="wdp-stat-number">
                {loading ? <SkeletonText width="48px" height="24px" /> : rows.length}
              </span>
            </div>
            <div className="wdp-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>

          <div className="wdp-stat-card stat-accent" style={{ cursor: "pointer" }} onClick={() => setStatusFilter("pending")} title="Filter Pending Candidates">
            <div className="wdp-stat-content">
              <span className="wdp-stat-title">Pending Review</span>
              <span className="wdp-stat-number">
                {loading ? <SkeletonText width="48px" height="24px" /> : pendingCount}
              </span>
            </div>
            <div className="wdp-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>

          <div className="wdp-stat-card stat-green" style={{ cursor: "pointer" }} onClick={() => setStatusFilter("approved")} title="Filter Approved Candidates">
            <div className="wdp-stat-content">
              <span className="wdp-stat-title">Approved Wholesale Dealers</span>
              <span className="wdp-stat-number" style={{ color: "#166534" }}>
                {loading ? <SkeletonText width="48px" height="24px" /> : approvedCount}
              </span>
            </div>
            <div className="wdp-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <div className="wdp-stat-card stat-red" style={{ cursor: "pointer" }} onClick={() => setStatusFilter("rejected")} title="Filter Rejected Candidates">
            <div className="wdp-stat-content">
              <span className="wdp-stat-title">Rejected</span>
              <span className="wdp-stat-number" style={{ color: "#DC2626" }}>
                {loading ? <SkeletonText width="48px" height="24px" /> : rejectedCount}
              </span>
            </div>
            <div className="wdp-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>
        </div>

        {/* Panel Container */}
        <div className="wdp-panel">
          <div className="wdp-panel-header">
            <div className="wdp-filter-tabs">
              <button
                className={`wdp-tab-chip ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({rows.length})
              </button>
              <button
                className={`wdp-tab-chip ${statusFilter === "pending" ? "active" : ""}`}
                onClick={() => setStatusFilter("pending")}
              >
                Pending ({pendingCount})
              </button>
              <button
                className={`wdp-tab-chip ${statusFilter === "approved" ? "active" : ""}`}
                onClick={() => setStatusFilter("approved")}
              >
                Approved ({approvedCount})
              </button>
              <button
                className={`wdp-tab-chip ${statusFilter === "rejected" ? "active" : ""}`}
                onClick={() => setStatusFilter("rejected")}
              >
                Rejected ({rejectedCount})
              </button>
            </div>

            <div className="wdp-search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#728A87" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="wdp-search-input"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="wdp-search-clear" onClick={() => setSearchTerm("")}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="wdp-table-wrap">
            <table className="wdp-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center", width: "44px" }}>S.No</th>
                  <th>Retailer ID</th>
                  <th>Name & Email</th>
                  <th>Phone Number</th>
                  <th style={{ textAlign: "center" }}>Today's Customers</th>
                  <th style={{ textAlign: "center" }}>Total Customers</th>
                  <th style={{ textAlign: "right" }}>Total Sales Value</th>
                  <th style={{ textAlign: "center" }}>Status / Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [0, 1, 2, 3, 4].map((i) => (
                    <tr key={i}>
                      <td style={{ textAlign: "center" }}>
                        <SkeletonText width="22px" height="12px" style={{ margin: "0 auto" }} />
                      </td>
                      <td><SkeletonText width="100px" height="20px" /></td>
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
                      <td style={{ textAlign: "center" }}><SkeletonText width="30px" height="18px" style={{ margin: "0 auto" }} /></td>
                      <td style={{ textAlign: "center" }}><SkeletonText width="30px" height="18px" style={{ margin: "0 auto" }} /></td>
                      <td style={{ textAlign: "right" }}><SkeletonText width="85px" height="14px" style={{ marginLeft: "auto" }} /></td>
                      <td style={{ textAlign: "center" }}><SkeletonText width="110px" height="24px" style={{ margin: "0 auto" }} /></td>
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="wdp-empty-state">
                        <div className="wdp-empty-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </div>
                        <h3 className="wdp-empty-title">No candidates found</h3>
                        <p className="wdp-empty-desc">
                          {searchTerm || statusFilter !== "all"
                            ? "No promotion candidates match your current search or filter."
                            : "No retailers have met the criteria for wholesale dealer promotion yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, i) => {
                    const cfg = STATUS_CFG[r.status] || STATUS_CFG.none;
                    const isFinal = r.status === "approved" || r.status === "rejected";
                    const isActing = actingId === r.user_id;
                    const idVal = r.promotor_id || "";
                    const initials = `${r.first_name?.[0] || ""}${r.last_name?.[0] || ""}` || "U";

                    return (
                      <tr key={r.user_id}>
                        <td className="wdp-sno">{i + 1}</td>
                        <td>
                          <span
                            className={`wdp-id-pill ${copiedId === idVal ? "wdp-pill-copy-done" : ""}`}
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
                          <div className="wdp-user-col">
                            <div className="wdp-avatar">{initials}</div>
                            <div className="wdp-user-meta">
                              <span className="wdp-name">{r.first_name} {r.last_name}</span>
                              <span className="wdp-sub">{r.email || "No email"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {r.mobile_number ? (
                            <a href={`tel:${r.mobile_number}`} className="wdp-phone-link">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              <span>{r.mobile_number}</span>
                            </a>
                          ) : (
                            <span style={{ color: "#92A6A4" }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            className="wdp-count-pill"
                            title="View today's downline customers"
                            onClick={() =>
                              navigate(
                                `/promotions/sales-order-list?node_type=promotor&user_id=${r.user_id}&list_type=customers&name=${encodeURIComponent(
                                  r.first_name + " " + r.last_name
                                )}`
                              )
                            }
                          >
                            {r.today_customers || 0}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            className="wdp-count-pill"
                            title="View total customer downline with orders"
                            onClick={() =>
                              navigate(
                                `/promotions/sales-order-list?node_type=promotor&user_id=${r.user_id}&list_type=customers&order_filter=orders_only&name=${encodeURIComponent(
                                  r.first_name + " " + r.last_name
                                )}`
                              )
                            }
                          >
                            {r.total_customers || 0}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            className="wdp-value"
                            title="Click to view sales order breakdown"
                            onClick={() =>
                              navigate(
                                `/promotions/sales-order-list?node_type=promotor&user_id=${r.user_id}&list_type=customers&order_filter=orders_only&name=${encodeURIComponent(
                                  r.first_name + " " + r.last_name
                                )}`
                              )
                            }
                          >
                            {money(r.total_value)}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {isFinal ? (
                            <span
                              className="wdp-status-pill"
                              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                            >
                              {cfg.label}
                            </span>
                          ) : (
                            <div className="wdp-action-btns">
                              <button
                                className="wdp-btn-approve"
                                disabled={isActing}
                                onClick={() => runAction(r.user_id, "approve")}
                              >
                                {isActing ? "..." : "Approve"}
                              </button>
                              <button
                                className="wdp-btn-reject"
                                disabled={isActing}
                                onClick={() => setConfirmReject(r)}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="wdp-mobile-cards">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="wdp-mobile-card">
                  <div className="wdp-mobile-card-top">
                    <SkeletonText width="120px" height="16px" />
                    <SkeletonText width="60px" height="20px" />
                  </div>
                  <div className="wdp-mobile-meta-grid">
                    <div><SkeletonText width="50px" height="10px" /></div>
                    <div><SkeletonText width="50px" height="10px" /></div>
                    <div><SkeletonText width="50px" height="10px" /></div>
                  </div>
                </div>
              ))
            ) : filteredRows.length === 0 ? (
              <div className="wdp-empty-state">
                <div className="wdp-empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h4 className="wdp-empty-title">No candidates found</h4>
                <p className="wdp-empty-desc">No candidates match your current filter.</p>
              </div>
            ) : (
              filteredRows.map((r) => {
                const cfg = STATUS_CFG[r.status] || STATUS_CFG.none;
                const isFinal = r.status === "approved" || r.status === "rejected";
                const isActing = actingId === r.user_id;
                const idVal = r.promotor_id || "";
                const initials = `${r.first_name?.[0] || ""}${r.last_name?.[0] || ""}` || "U";

                return (
                  <div key={r.user_id} className="wdp-mobile-card">
                    <div className="wdp-mobile-card-top">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="wdp-avatar" style={{ width: 34, height: 34, fontSize: 11 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: "#073B3F", fontSize: 14 }}>
                            {r.first_name} {r.last_name}
                          </div>
                          <span
                            className={`wdp-id-pill ${copiedId === idVal ? "wdp-pill-copy-done" : ""}`}
                            onClick={() => handleCopy(idVal, idVal)}
                            style={{ marginTop: 2, padding: "2px 8px", fontSize: 11 }}
                          >
                            {idVal}
                          </span>
                        </div>
                      </div>
                      <div>
                        {isFinal ? (
                          <span
                            className="wdp-status-pill"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11 }}
                          >
                            {cfg.label}
                          </span>
                        ) : (
                          <span className="wdp-status-pill" style={{ background: "#FEF3C7", color: "#92400E", fontSize: 11 }}>
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="wdp-mobile-meta-grid">
                      <div
                        className="wdp-mobile-meta-item"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(
                            `/promotions/sales-order-list?node_type=promotor&user_id=${r.user_id}&list_type=customers&name=${encodeURIComponent(
                              r.first_name + " " + r.last_name
                            )}`
                          )
                        }
                      >
                        <span className="wdp-mobile-meta-label">Today's</span>
                        <span className="wdp-mobile-meta-val" style={{ textDecoration: "underline" }}>
                          {r.today_customers || 0}
                        </span>
                      </div>
                      <div
                        className="wdp-mobile-meta-item"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(
                            `/promotions/sales-order-list?node_type=promotor&user_id=${r.user_id}&list_type=customers&order_filter=orders_only&name=${encodeURIComponent(
                              r.first_name + " " + r.last_name
                            )}`
                          )
                        }
                      >
                        <span className="wdp-mobile-meta-label">Customers</span>
                        <span className="wdp-mobile-meta-val" style={{ textDecoration: "underline" }}>
                          {r.total_customers || 0}
                        </span>
                      </div>
                      <div
                        className="wdp-mobile-meta-item"
                        style={{ textAlign: "right", cursor: "pointer" }}
                        onClick={() =>
                          navigate(
                            `/promotions/sales-order-list?node_type=promotor&user_id=${r.user_id}&list_type=customers&order_filter=orders_only&name=${encodeURIComponent(
                              r.first_name + " " + r.last_name
                            )}`
                          )
                        }
                      >
                        <span className="wdp-mobile-meta-label">Sales</span>
                        <span className="wdp-mobile-meta-val" style={{ color: "#073B3F", textDecoration: "underline" }}>
                          {money(r.total_value)}
                        </span>
                      </div>
                    </div>

                    {!isFinal && (
                      <div className="wdp-mobile-actions">
                        <button
                          className="wdp-btn-approve"
                          disabled={isActing}
                          onClick={() => runAction(r.user_id, "approve")}
                        >
                          {isActing ? "..." : "Approve Promotion"}
                        </button>
                        <button
                          className="wdp-btn-reject"
                          disabled={isActing}
                          onClick={() => setConfirmReject(r)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmReject && (
        <div className="wdp-modal-overlay" onClick={() => setConfirmReject(null)}>
          <div className="wdp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Promotion Candidate?</h3>
            <p>
              Are you sure you want to reject {confirmReject.first_name} {confirmReject.last_name} ({confirmReject.promotor_id})?
              They will remain as Retailer and won't be promoted to Wholesale Dealer.
            </p>
            <div className="wdp-modal-actions">
              <button className="wdp-modal-cancel" onClick={() => setConfirmReject(null)}>
                Cancel
              </button>
              <button
                className="wdp-modal-confirm"
                onClick={() => runAction(confirmReject.user_id, "reject")}
              >
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`wdp-toast ${toastType}`}>{toast}</div>}
    </div>
  );
}