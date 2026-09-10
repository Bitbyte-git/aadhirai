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

export default function SuperStokistPromotions() {
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
      .get("/super-stockist-promotions/")
      .then((res) => {
        setRows(Array.isArray(res.data?.results) ? res.data.results : []);
        setApprovedCount(res.data?.approved_count || 0);
        setRejectedCount(res.data?.rejected_count || 0);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Could not load super stockist promotions.");
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
      await api.post(`/super-stockist-promotions/${userId}/action/`, { action });
      showToast(
        action === "approve"
          ? "Approved! Distributor promoted to Super Stockist."
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
      const did = (r.dealer_id || "").toLowerCase();
      const fn = (r.first_name || "").toLowerCase();
      const ln = (r.last_name || "").toLowerCase();
      const em = (r.email || "").toLowerCase();
      const ph = (r.mobile_number || "").toLowerCase();
      return (
        did.includes(q) ||
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
      "Distributor ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone Number",
      "Wholesale Dealers Count",
      "Retailers Count",
      "Today's Customers",
      "Total Customers",
      "Total Sales Value (INR)",
      "Status",
    ];

    const csvRows = filteredRows.map((r, i) => [
      i + 1,
      `"${r.dealer_id || ""}"`,
      `"${(r.first_name || "").replace(/"/g, '""')}"`,
      `"${(r.last_name || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      `"${r.mobile_number || ""}"`,
      r.sub_dealer_count || 0,
      r.promotor_count || 0,
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
    link.setAttribute("download", `super_stockist_promotions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported Super Stockist Promotions CSV");
  };

  return (
    <div className="ssp-root">
      <style>{`
        .ssp-root {
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

        .ssp-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px 48px 64px;
          box-sizing: border-box;
        }

        /* Topbar */
        .ssp-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .ssp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5C706E;
          font-weight: 500;
        }

        .ssp-back-btn {
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

        .ssp-back-btn:hover {
          background: #F0F5F5;
          border-color: #073B3F;
          transform: translateX(-2px);
        }

        /* Header Card */
        .ssp-header-card {
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

        .ssp-header-info h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ssp-role-badge {
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

        .ssp-header-sub {
          margin: 6px 0 0;
          color: #5C706E;
          font-size: 13.5px;
          line-height: 1.5;
        }

        .ssp-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ssp-refresh-btn {
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

        .ssp-refresh-btn:hover {
          background: #F0F5F4;
          border-color: #073B3F;
        }

        .ssp-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ssp-export-btn {
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

        .ssp-export-btn:hover {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        /* Stats Grid */
        .ssp-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
          width: 100%;
        }

        .ssp-stat-card {
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

        .ssp-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.07);
        }

        .ssp-stat-card::before {
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

        .ssp-stat-card.stat-accent::before { background: #CCA881; }
        .ssp-stat-card.stat-green::before { background: #166534; }
        .ssp-stat-card.stat-red::before { background: #DC2626; }

        .ssp-stat-content {
          display: flex;
          flex-direction: column;
        }

        .ssp-stat-title {
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #728A87;
          margin-bottom: 8px;
        }

        .ssp-stat-number {
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1.1;
          font-feature-settings: "tnum";
        }

        .ssp-stat-icon {
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
        .ssp-panel {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          box-shadow: 0 6px 24px rgba(7, 59, 63, 0.04);
          overflow: hidden;
        }

        .ssp-panel-header {
          padding: 20px 24px;
          border-bottom: 1px solid #EDF2F1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ssp-filter-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ssp-tab-chip {
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

        .ssp-tab-chip:hover {
          background: #E3ECEB;
        }

        .ssp-tab-chip.active {
          background: #073B3F;
          color: #FFFFFF;
        }

        .ssp-search-box {
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

        .ssp-search-box:focus-within {
          background: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.1);
        }

        .ssp-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13px;
          color: #111817;
        }

        .ssp-search-clear {
          background: none;
          border: none;
          color: #728A87;
          cursor: pointer;
          padding: 0;
          font-size: 14px;
        }

        /* Desktop Table */
        .ssp-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .ssp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          text-align: left;
        }

        .ssp-table thead th {
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

        .ssp-table tbody tr {
          border-bottom: 1px solid #EDF2F1;
          transition: background 120ms ease;
        }

        .ssp-table tbody tr:hover {
          background: #F5FAF9;
        }

        .ssp-table tbody tr:last-child {
          border-bottom: none;
        }

        .ssp-table td {
          padding: 12px 14px;
          vertical-align: middle;
          white-space: nowrap;
        }

        .ssp-sno {
          font-weight: 800;
          color: #073B3F;
          font-family: monospace;
          text-align: center;
          width: 44px;
        }

        .ssp-id-pill {
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

        .ssp-id-pill:hover {
          background: #E3ECEB;
          border-color: #073B3F;
        }

        .ssp-pill-copy-done {
          background: #E8F5E9 !important;
          border-color: #A5D6A7 !important;
          color: #2E7D32 !important;
        }

        .ssp-user-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ssp-avatar {
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

        .ssp-user-meta {
          display: flex;
          flex-direction: column;
        }

        .ssp-name {
          font-weight: 700;
          color: #0A2F33;
          font-size: 13.5px;
        }

        .ssp-sub {
          color: #728A87;
          font-size: 12px;
          margin-top: 1px;
        }

        .ssp-phone-link {
          color: #364B49;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .ssp-phone-link:hover {
          color: #073B3F;
          text-decoration: underline;
        }

        .ssp-count-pill {
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

        .ssp-count-pill:hover {
          background: #073B3F;
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .ssp-value {
          font-weight: 800;
          color: #073B3F;
          font-feature-settings: "tnum";
          font-size: 13.5px;
          cursor: pointer;
          transition: all 140ms ease;
          display: inline-block;
        }

        .ssp-value:hover {
          color: #0C4E53;
          text-decoration: underline;
        }

        .ssp-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .ssp-action-btns {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .ssp-btn-approve {
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

        .ssp-btn-approve:hover {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        .ssp-btn-reject {
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

        .ssp-btn-reject:hover {
          background: #FEE2E2;
          border-color: #DC2626;
        }

        .ssp-btn-approve:disabled, .ssp-btn-reject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile Cards */
        .ssp-mobile-cards {
          display: none;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
        }

        .ssp-mobile-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.03);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ssp-mobile-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .ssp-mobile-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          background: #F8FAF9;
          padding: 10px 12px;
          border-radius: 12px;
        }

        .ssp-mobile-meta-item {
          display: flex;
          flex-direction: column;
        }

        .ssp-mobile-meta-label {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          color: #728A87;
        }

        .ssp-mobile-meta-val {
          font-size: 12px;
          font-weight: 800;
          color: #073B3F;
          margin-top: 2px;
        }

        .ssp-mobile-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ssp-mobile-actions button {
          flex: 1;
          padding: 9px;
          font-size: 13px;
        }

        /* Confirmation Modal */
        .ssp-modal-overlay {
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

        .ssp-modal {
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

        .ssp-modal h3 {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 800;
          color: #073B3F;
        }

        .ssp-modal p {
          margin: 0 0 24px;
          font-size: 13.5px;
          color: #5C706E;
          line-height: 1.5;
        }

        .ssp-modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .ssp-modal-cancel {
          padding: 9px 18px;
          background: #F0F5F4;
          border: none;
          border-radius: 10px;
          color: #5C706E;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        .ssp-modal-confirm {
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
        .ssp-toast {
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

        .ssp-toast.error {
          background: #DC2626;
        }

        /* Empty State */
        .ssp-empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .ssp-empty-icon {
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

        .ssp-empty-title {
          font-size: 15px;
          font-weight: 800;
          color: #0A2F33;
          margin: 0;
        }

        .ssp-empty-desc {
          font-size: 13px;
          color: #728A87;
          margin: 0;
          max-width: 340px;
        }

        .ssp-error-banner {
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
          .ssp-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 768px) {
          .ssp-shell { padding: 16px 14px 48px; }
          .ssp-header-card { padding: 18px 16px; flex-direction: column; align-items: flex-start; }
          .ssp-header-actions { width: 100%; }
          .ssp-export-btn, .ssp-refresh-btn { flex: 1; justify-content: center; }
          .ssp-panel-header { padding: 16px; flex-direction: column; align-items: stretch; }
          .ssp-search-box { width: 100%; }
          .ssp-table-wrap { display: none; }
          .ssp-mobile-cards { display: flex; }
        }

        @media (max-width: 480px) {
          .ssp-stats-grid { grid-template-columns: 1fr; }
          .ssp-stat-card { padding: 16px; }
        }
      `}</style>

      <div className="ssp-shell">
        {/* Topbar */}
        <div className="ssp-topbar">
          <div className="ssp-breadcrumb">
            <span>Promotions</span>
            <span>/</span>
            <span style={{ color: "#073B3F", fontWeight: 700 }}>Super Stockist Promotions</span>
          </div>
          <button className="ssp-back-btn" onClick={() => navigate(-1)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="ssp-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Header Card */}
        <div className="ssp-header-card">
          <div className="ssp-header-info">
            <h1>
              <span>Super Stockist Promotions</span>
              <span className="ssp-role-badge">Distributor → Super Stockist</span>
            </h1>
            <p className="ssp-header-sub">
              Distributors whose downline crossed ₹50,00,000 sales or 50+ customers.
              Review and approve them to promote them into Super Stockists (Super Admin level nodes).
            </p>
          </div>

          <div className="ssp-header-actions">
            <button className="ssp-refresh-btn" onClick={fetchRows} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button className="ssp-export-btn" onClick={exportCSV} disabled={loading || !filteredRows.length}>
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
        <div className="ssp-stats-grid">
          <div className="ssp-stat-card" style={{ cursor: "pointer" }} onClick={() => setStatusFilter("all")} title="Show All Candidates">
            <div className="ssp-stat-content">
              <span className="ssp-stat-title">Total Candidates</span>
              <span className="ssp-stat-number">
                {loading ? <SkeletonText width="48px" height="24px" /> : rows.length}
              </span>
            </div>
            <div className="ssp-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>

          <div className="ssp-stat-card stat-accent" style={{ cursor: "pointer" }} onClick={() => setStatusFilter("pending")} title="Filter Pending Candidates">
            <div className="ssp-stat-content">
              <span className="ssp-stat-title">Pending Review</span>
              <span className="ssp-stat-number">
                {loading ? <SkeletonText width="48px" height="24px" /> : pendingCount}
              </span>
            </div>
            <div className="ssp-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>

          <div className="ssp-stat-card stat-green" style={{ cursor: "pointer" }} onClick={() => setStatusFilter("approved")} title="Filter Approved Candidates">
            <div className="ssp-stat-content">
              <span className="ssp-stat-title">Approved Super Stockists</span>
              <span className="ssp-stat-number" style={{ color: "#166534" }}>
                {loading ? <SkeletonText width="48px" height="24px" /> : approvedCount}
              </span>
            </div>
            <div className="ssp-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <div className="ssp-stat-card stat-red" style={{ cursor: "pointer" }} onClick={() => setStatusFilter("rejected")} title="Filter Rejected Candidates">
            <div className="ssp-stat-content">
              <span className="ssp-stat-title">Rejected</span>
              <span className="ssp-stat-number" style={{ color: "#DC2626" }}>
                {loading ? <SkeletonText width="48px" height="24px" /> : rejectedCount}
              </span>
            </div>
            <div className="ssp-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>
        </div>

        {/* Panel Container */}
        <div className="ssp-panel">
          <div className="ssp-panel-header">
            <div className="ssp-filter-tabs">
              <button
                className={`ssp-tab-chip ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({rows.length})
              </button>
              <button
                className={`ssp-tab-chip ${statusFilter === "pending" ? "active" : ""}`}
                onClick={() => setStatusFilter("pending")}
              >
                Pending ({pendingCount})
              </button>
              <button
                className={`ssp-tab-chip ${statusFilter === "approved" ? "active" : ""}`}
                onClick={() => setStatusFilter("approved")}
              >
                Approved ({approvedCount})
              </button>
              <button
                className={`ssp-tab-chip ${statusFilter === "rejected" ? "active" : ""}`}
                onClick={() => setStatusFilter("rejected")}
              >
                Rejected ({rejectedCount})
              </button>
            </div>

            <div className="ssp-search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#728A87" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="ssp-search-input"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="ssp-search-clear" onClick={() => setSearchTerm("")}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="ssp-table-wrap">
            <table className="ssp-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center", width: "44px" }}>S.No</th>
                  <th>Distributor ID</th>
                  <th>Name & Email</th>
                  <th>Phone Number</th>
                  <th style={{ textAlign: "center" }}>Wholesale Dealers</th>
                  <th style={{ textAlign: "center" }}>Retailers</th>
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
                      <td style={{ textAlign: "center" }}><SkeletonText width="30px" height="18px" style={{ margin: "0 auto" }} /></td>
                      <td style={{ textAlign: "center" }}><SkeletonText width="30px" height="18px" style={{ margin: "0 auto" }} /></td>
                      <td style={{ textAlign: "right" }}><SkeletonText width="85px" height="14px" style={{ marginLeft: "auto" }} /></td>
                      <td style={{ textAlign: "center" }}><SkeletonText width="110px" height="24px" style={{ margin: "0 auto" }} /></td>
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="ssp-empty-state">
                        <div className="ssp-empty-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </div>
                        <h3 className="ssp-empty-title">No candidates found</h3>
                        <p className="ssp-empty-desc">
                          {searchTerm || statusFilter !== "all"
                            ? "No promotion candidates match your current search or filter."
                            : "No distributors have met the criteria for super stockist promotion yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, i) => {
                    const cfg = STATUS_CFG[r.status] || STATUS_CFG.none;
                    const isFinal = r.status === "approved" || r.status === "rejected";
                    const isActing = actingId === r.user_id;
                    const idVal = r.dealer_id || "";
                    const initials = `${r.first_name?.[0] || ""}${r.last_name?.[0] || ""}` || "U";

                    return (
                      <tr key={r.user_id}>
                        <td className="ssp-sno">{i + 1}</td>
                        <td>
                          <span
                            className={`ssp-id-pill ${copiedId === idVal ? "ssp-pill-copy-done" : ""}`}
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
                          <div className="ssp-user-col">
                            <div className="ssp-avatar">{initials}</div>
                            <div className="ssp-user-meta">
                              <span className="ssp-name">{r.first_name} {r.last_name}</span>
                              <span className="ssp-sub">{r.email || "No email"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {r.mobile_number ? (
                            <a href={`tel:${r.mobile_number}`} className="ssp-phone-link">
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
                            className="ssp-count-pill"
                            title="View downline wholesale dealers list"
                            onClick={() =>
                              navigate(
                                `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=wholesale_dealers&name=${encodeURIComponent(
                                  r.first_name + " " + r.last_name
                                )}`
                              )
                            }
                          >
                            {r.sub_dealer_count || 0}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            className="ssp-count-pill"
                            title="View downline retailers list"
                            onClick={() =>
                              navigate(
                                `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=retailers&name=${encodeURIComponent(
                                  r.first_name + " " + r.last_name
                                )}`
                              )
                            }
                          >
                            {r.promotor_count || 0}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            className="ssp-count-pill"
                            title="View today's downline customers"
                            onClick={() =>
                              navigate(
                                `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=customers&name=${encodeURIComponent(
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
                            className="ssp-count-pill"
                            title="View total customer downline with orders"
                            onClick={() =>
                              navigate(
                                `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=customers&order_filter=orders_only&name=${encodeURIComponent(
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
                            className="ssp-value"
                            title="Click to view sales order breakdown"
                            onClick={() =>
                              navigate(
                                `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=customers&order_filter=orders_only&name=${encodeURIComponent(
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
                              className="ssp-status-pill"
                              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                            >
                              {cfg.label}
                            </span>
                          ) : (
                            <div className="ssp-action-btns">
                              <button
                                className="ssp-btn-approve"
                                disabled={isActing}
                                onClick={() => runAction(r.user_id, "approve")}
                              >
                                {isActing ? "..." : "Approve"}
                              </button>
                              <button
                                className="ssp-btn-reject"
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
          <div className="ssp-mobile-cards">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="ssp-mobile-card">
                  <div className="ssp-mobile-card-top">
                    <SkeletonText width="120px" height="16px" />
                    <SkeletonText width="60px" height="20px" />
                  </div>
                  <div className="ssp-mobile-meta-grid">
                    <div><SkeletonText width="30px" height="10px" /></div>
                    <div><SkeletonText width="30px" height="10px" /></div>
                    <div><SkeletonText width="30px" height="10px" /></div>
                  </div>
                </div>
              ))
            ) : filteredRows.length === 0 ? (
              <div className="ssp-empty-state">
                <div className="ssp-empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h4 className="ssp-empty-title">No candidates found</h4>
                <p className="ssp-empty-desc">No candidates match your current filter.</p>
              </div>
            ) : (
              filteredRows.map((r) => {
                const cfg = STATUS_CFG[r.status] || STATUS_CFG.none;
                const isFinal = r.status === "approved" || r.status === "rejected";
                const isActing = actingId === r.user_id;
                const idVal = r.dealer_id || "";
                const initials = `${r.first_name?.[0] || ""}${r.last_name?.[0] || ""}` || "U";

                return (
                  <div key={r.user_id} className="ssp-mobile-card">
                    <div className="ssp-mobile-card-top">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="ssp-avatar" style={{ width: 34, height: 34, fontSize: 11 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: "#073B3F", fontSize: 14 }}>
                            {r.first_name} {r.last_name}
                          </div>
                          <span
                            className={`ssp-id-pill ${copiedId === idVal ? "ssp-pill-copy-done" : ""}`}
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
                            className="ssp-status-pill"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11 }}
                          >
                            {cfg.label}
                          </span>
                        ) : (
                          <span className="ssp-status-pill" style={{ background: "#FEF3C7", color: "#92400E", fontSize: 11 }}>
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ssp-mobile-meta-grid">
                      <div
                        className="ssp-mobile-meta-item"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(
                            `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=wholesale_dealers&name=${encodeURIComponent(
                              r.first_name + " " + r.last_name
                            )}`
                          )
                        }
                      >
                        <span className="ssp-mobile-meta-label">Wholesale</span>
                        <span className="ssp-mobile-meta-val" style={{ textDecoration: "underline" }}>
                          {r.sub_dealer_count || 0}
                        </span>
                      </div>
                      <div
                        className="ssp-mobile-meta-item"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(
                            `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=retailers&name=${encodeURIComponent(
                              r.first_name + " " + r.last_name
                            )}`
                          )
                        }
                      >
                        <span className="ssp-mobile-meta-label">Retailers</span>
                        <span className="ssp-mobile-meta-val" style={{ textDecoration: "underline" }}>
                          {r.promotor_count || 0}
                        </span>
                      </div>
                      <div
                        className="ssp-mobile-meta-item"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(
                            `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=customers&name=${encodeURIComponent(
                              r.first_name + " " + r.last_name
                            )}`
                          )
                        }
                      >
                        <span className="ssp-mobile-meta-label">Today's</span>
                        <span className="ssp-mobile-meta-val" style={{ textDecoration: "underline" }}>
                          {r.today_customers || 0}
                        </span>
                      </div>
                      <div
                        className="ssp-mobile-meta-item"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(
                            `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=customers&order_filter=orders_only&name=${encodeURIComponent(
                              r.first_name + " " + r.last_name
                            )}`
                          )
                        }
                      >
                        <span className="ssp-mobile-meta-label">Customers</span>
                        <span className="ssp-mobile-meta-val" style={{ textDecoration: "underline" }}>
                          {r.total_customers || 0}
                        </span>
                      </div>
                      <div
                        className="ssp-mobile-meta-item"
                        style={{ textAlign: "right", cursor: "pointer", gridColumn: "span 2" }}
                        onClick={() =>
                          navigate(
                            `/promotions/sales-order-list?node_type=dealer&user_id=${r.user_id}&list_type=customers&order_filter=orders_only&name=${encodeURIComponent(
                              r.first_name + " " + r.last_name
                            )}`
                          )
                        }
                      >
                        <span className="ssp-mobile-meta-label">Total Sales Volume</span>
                        <span className="ssp-mobile-meta-val" style={{ color: "#073B3F", textDecoration: "underline" }}>
                          {money(r.total_value)}
                        </span>
                      </div>
                    </div>

                    {!isFinal && (
                      <div className="ssp-mobile-actions">
                        <button
                          className="ssp-btn-approve"
                          disabled={isActing}
                          onClick={() => runAction(r.user_id, "approve")}
                        >
                          {isActing ? "..." : "Approve Promotion"}
                        </button>
                        <button
                          className="ssp-btn-reject"
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
        <div className="ssp-modal-overlay" onClick={() => setConfirmReject(null)}>
          <div className="ssp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Promotion Candidate?</h3>
            <p>
              Are you sure you want to reject {confirmReject.first_name} {confirmReject.last_name} ({confirmReject.dealer_id})?
              They will remain as Distributor and won't be promoted to Super Stockist.
            </p>
            <div className="ssp-modal-actions">
              <button className="ssp-modal-cancel" onClick={() => setConfirmReject(null)}>
                Cancel
              </button>
              <button
                className="ssp-modal-confirm"
                onClick={() => runAction(confirmReject.user_id, "reject")}
              >
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`ssp-toast ${toastType}`}>{toast}</div>}
    </div>
  );
}