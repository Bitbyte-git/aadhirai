import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import CoinTabs from "./CoinTabs";
import JewelleryImageModal from "./JewelleryImageModal";
import { JewelleryTransactionSkeletonList } from "./JewellerySkeleton";
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
  PackageIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  UsersIcon,
  SparkleIcon,
  ArrowLeftIcon,
} from "../components/SvgIcons";

const ROLE_BADGE_CONFIG = {
  super_admin: { bg: "#EFF6F6", color: "#073B3F", border: "#CEE3E1", label: "Super Admin" },
  admin: { bg: "#F3E8FF", color: "#6B21A8", border: "#E9D5FF", label: "Super Stockist" },
  dealer: { bg: "#E0F2FE", color: "#0369A1", border: "#BAE6FD", label: "Distributor" },
  sub_dealer: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0", label: "Wholesale Dealer" },
  promotor: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Retailer" },
  shop: { bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA", label: "Shop" },
};

// ── Forward chain path (Retailer → ... → Super Admin) — ovvoru hop ✓ / ⏳ / ✕ ──
function JtChainStepper({ chain }) {
  if (!chain || chain.length < 2) return null;
  const nodes = [
    { name: chain[0].from_name, role: chain[0].from_role },
    ...chain.map((h) => ({ name: h.to_name, role: h.to_role })),
  ];
  const hopCfg = {
    // Request mela pogudhu → (Super Admin pakkam) · Stock thirumba keezha varudhu ← (requester pakkam)
    sent: { Icon: ArrowLeftIcon, color: "#047857", bg: "#ECFDF5", border: "#A7F3D0", label: "Stock came back" },
    pending: { Icon: ArrowRightIcon, color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", label: "Request going up" },
    rejected: { Icon: CloseIcon, color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA", label: "Declined" },
  };
  return (
    <div className="jt-chain">
      <div className="jt-chain-title">
        <span>Forward chain</span>
        <span className="jt-chain-legend">
          <span style={{ color: "#B45309" }}><ArrowRightIcon size={11} color="#B45309" /> Request</span>
          <span style={{ color: "#047857" }}><ArrowLeftIcon size={11} color="#047857" /> Stock</span>
        </span>
      </div>
      <div className="jt-chain-track">
        {nodes.map((n, i) => {
          const hop = i > 0 ? chain[i - 1] : null;
          const cfg = hop ? hopCfg[hop.status] || hopCfg.pending : null;
          return (
            <div key={i} className="jt-chain-step">
              {hop && (
                <span className="jt-chain-conn" style={{ "--conn": cfg.border }}>
                  <i />
                  <span className="jt-chain-link" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }} title={hop.reject_reason || cfg.label}>
                    <cfg.Icon size={11} color={cfg.color} />
                  </span>
                  <i />
                </span>
              )}
              <span className={`jt-chain-node${hop?.is_current || (i === 0 && chain[0].is_current) ? " current" : ""}`}>
                <strong title={n.name || ""}>{n.name || "—"}</strong>
                <small>{ROLE_BADGE_CONFIG[n.role]?.label || n.role}</small>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
const STATUS_CFG = {
  pending: { color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD", label: "Pending", icon: ClockIcon },
  sent: { color: "#166534", bg: "#E6F4EA", border: "#BBF7D0", label: "Approved", icon: CheckIcon },
  rejected: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Declined", icon: CloseIcon },
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
  const [activeCard, setActiveCard] = useState("my_transactions"); // 'my_transactions' | 'leader_transactions'
  const [leaderRoleFilter, setLeaderRoleFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [copiedId, setCopiedId] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  // Leader role counts + infinite scroll — ellaamey backend (team scope-oda)
  const [roleCounts, setRoleCounts] = useState({});
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const reqIdRef = useRef(0);
  const nextOffsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef(null);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    sent: 0,
    rejected: 0,
    total: 0,
    disbursed_pieces: 0,
    pending_pieces: 0,
  });
  // Backend-computed, full-dataset (not just the currently loaded page) headline counts
  const [myTxCount, setMyTxCount] = useState(0);
  const [leaderTxCount, setLeaderTxCount] = useState(0);
  const [chainTxCount, setChainTxCount] = useState(0);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Team-scoped board: card (My / Leader) + role + status + period + search backend-la.
  // Counts full DB-la, list 30-30-a infinite scroll ──
  const historyParams = (offsetVal, searchVal) => {
    const params = {
      box: "board", view: "transactions",
      card: activeCard === "my_transactions" ? "my" : activeCard === "chain_transactions" ? "chain" : "leader",
      role: leaderRoleFilter, status: filter, period, offset: offsetVal, limit: 30,
    };
    if (period === "custom") {
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
    }
    if (searchVal) params.search = searchVal;
    return params;
  };

  const fetchHistory = async (searchVal = "") => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError("");
    setHasMore(false);
    loadingMoreRef.current = false;
    setLoadingMore(false);
    try {
      const res = await api.get("/jewelry-requests/", { params: historyParams(0, searchVal) });
      if (reqId !== reqIdRef.current) return;
      const d = res.data || {};
      setRequests(d.items || []);
      setStatusCounts(d.status_counts || {
        pending: 0,
        sent: 0,
        rejected: 0,
        total: 0,
        disbursed_pieces: 0,
        pending_pieces: 0,
      });
      setMyTxCount(d.counts?.my || 0);
      setLeaderTxCount(d.counts?.leader || 0);
      setChainTxCount(d.counts?.chain || 0);
      setRoleCounts(d.role_counts || {});
      setHasMore(!!d.has_more);
      nextOffsetRef.current = (d.items || []).length;
    } catch {
      if (reqId === reqIdRef.current) setError("Failed to load jewellery transaction history.");
    }
    if (reqId === reqIdRef.current) setLoading(false);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchHistory(searchTerm.trim());
    }, 250);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchTerm, period, startDate, endDate, activeCard, leaderRoleFilter]);

  const loadMore = async () => {
    if (loadingMoreRef.current) return;
    const reqId = reqIdRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await api.get("/jewelry-requests/", { params: historyParams(nextOffsetRef.current, searchTerm.trim()) });
      if (reqId !== reqIdRef.current) return;
      const newItems = res.data?.items || [];
      setRequests((prev) => [...prev, ...newItems]);
      nextOffsetRef.current += newItems.length;
      setHasMore(!!res.data?.has_more && newItems.length > 0);
    } catch {
      if (reqId === reqIdRef.current) setHasMore(false);
    } finally {
      if (reqId === reqIdRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  };
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  // Bottom-ku 500px munnadiye adutha 30 fetch
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return undefined;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMoreRef.current();
    }, { rootMargin: "500px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, requests.length, viewMode]);

  // ── My vs Leader, role, status, search ellaamey backend-la (team scope) — list server tharradhu ──
  // Leader role pills: en KEEZHA irukura roles mattum (Super Admin-ku ellaamey + Shop)
  const LEADER_ROLES = useMemo(() => {
    const chain = ["admin", "dealer", "sub_dealer", "promotor"];
    let keys;
    if (isSuperAdmin) keys = [...chain, "shop"];
    else if (currentRole === "shop") keys = ["shop"];
    else keys = chain.slice(chain.indexOf(currentRole) + 1);
    return [{ key: "all", label: "All" }, ...keys.map((k) => ({ key: k, label: ROLE_BADGE_CONFIG[k].label }))];
  }, [isSuperAdmin, currentRole]);

  const getLeaderRoleCount = (roleKey) => roleCounts[roleKey] || 0;
  const activeStatusCounts = statusCounts;
  const displayedRequests = requests;

  // Export Formatted Document / PDF Report
  const exportDocument = () => {
    if (!displayedRequests.length) {
      alert("No transaction records to export");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to open the jewellery transaction document.");
      return;
    }

    const rowsHtml = displayedRequests
      .map((r) => {
        const itemsFormatted = (r.items || [])
          .map(
            (i) =>
              `<div><strong>${i.product?.name || "Jewellery Item"}</strong> [${i.product?.product_code || ""}] × ${i.qty} (${i.product?.metal || ""} ${i.product?.grade || ""})</div>`
          )
          .join("");
        const statusColor =
          r.status === "sent"
            ? "#166534"
            : r.status === "rejected"
            ? "#DC2626"
            : "#0369A1";
        const statusBg =
          r.status === "sent"
            ? "#E6F4EA"
            : r.status === "rejected"
            ? "#FEF2F2"
            : "#F0F9FF";
        const statusBorder =
          r.status === "sent"
            ? "#BBF7D0"
            : r.status === "rejected"
            ? "#FECACA"
            : "#BAE6FD";
        const statusLabel =
          r.status === "sent"
            ? "Approved"
            : r.status === "rejected"
            ? "Declined"
            : "Pending";
        const approverText = r.approved_by_name
          ? `${r.approved_by_name} (${r.approved_by_role === 'super_admin' ? 'Super Admin' : (r.approved_by_role || 'Approver')})`
          : r.requested_to_name
          ? `${r.requested_to_name} (${r.requested_to_role || 'Approver'})`
          : "Direct Upstream";

        return `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 12px; font-family: monospace; font-size: 12px; color: #073B3F; font-weight: 700;">#${r.id}</td>
            <td style="padding: 10px 12px; font-size: 12px; color: #334155; white-space: nowrap;">${new Date(r.created_at).toLocaleString("en-IN")}</td>
            <td style="padding: 10px 12px; font-size: 12px; color: #0F172A;">
              <strong>${r.requested_by_name || r.requested_by_email}</strong>
              <div style="font-size: 11px; color: #64748B;">${r.requested_by_id_str ? `[${r.requested_by_id_str}] ` : ''}${r.requested_by_role || ''}</div>
            </td>
            <td style="padding: 10px 12px; font-size: 12px; color: #0F172A;">
              ${approverText}
            </td>
            <td style="padding: 10px 12px; font-size: 12px; color: #0F172A;">
              ${itemsFormatted || '-'}
            </td>
            <td style="padding: 10px 12px; font-size: 12px; text-align: center;">
              <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
                ${statusLabel}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");

    const approvedCount = displayedRequests.filter((r) => r.status === "sent").length;
    const pendingCount = displayedRequests.filter((r) => r.status === "pending").length;
    const rejectedCount = displayedRequests.filter((r) => r.status === "rejected").length;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Jewellery_Transactions_Audit_Report_${new Date().toISOString().slice(0, 10)}</title>
          <style>
            @media print {
              @page { size: A4 landscape; margin: 15mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0F172A;
              margin: 0;
              padding: 24px;
              background: #FFFFFF;
            }
            .header-box {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #073B3F;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              color: #073B3F;
              margin: 0 0 4px;
            }
            .subtitle {
              font-size: 13px;
              color: #475569;
              margin: 0;
            }
            .meta-box {
              text-align: right;
              font-size: 12px;
              color: #475569;
              line-height: 1.6;
            }
            .summary-cards {
              display: flex;
              gap: 12px;
              margin-bottom: 20px;
            }
            .summary-card {
              flex: 1;
              background: #F8FAFA;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              padding: 10px 14px;
            }
            .summary-card-title {
              font-size: 11px;
              font-weight: 700;
              color: #64748B;
              text-transform: uppercase;
            }
            .summary-card-value {
              font-size: 20px;
              font-weight: 800;
              color: #073B3F;
              margin-top: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background: #073B3F;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 10px 12px;
              text-align: left;
            }
            .print-btn-bar {
              position: sticky;
              top: 0;
              background: #073B3F;
              color: #FFFFFF;
              padding: 12px 24px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin: -24px -24px 20px -24px;
              z-index: 1000;
            }
            .btn {
              padding: 8px 16px;
              border-radius: 6px;
              border: none;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
            }
            .btn-print { background: #CCA881; color: #073B3F; }
            .btn-close { background: rgba(255,255,255,0.2); color: #FFFFFF; margin-left: 8px; }
          </style>
        </head>
        <body>
          <div class="print-btn-bar no-print">
            <span style="font-weight: 700; font-size: 14px;">BitByte Jewellery Transaction Audit Document</span>
            <div>
              <button class="btn btn-print" onclick="window.print()">Print / Save as PDF</button>
              <button class="btn btn-close" onclick="window.close()">Close</button>
            </div>
          </div>

          <div class="header-box">
            <div>
              <h1 class="title">Jewellery Transaction Audit Report</h1>
              <p class="subtitle">BitByte Marketing Ledger — Official Record of Jewellery Allocations & Transfers</p>
            </div>
            <div class="meta-box">
              <div><strong>Generated Date:</strong> ${new Date().toLocaleString("en-IN")}</div>
              <div><strong>Filter Period:</strong> ${period.toUpperCase()}</div>
              <div><strong>Total Records:</strong> ${requests.length}</div>
            </div>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-card-title">Total Transactions</div>
              <div class="summary-card-value">${requests.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-title">Approved & Disbursed</div>
              <div class="summary-card-value" style="color: #166534;">${approvedCount}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-title">Pending Review</div>
              <div class="summary-card-value" style="color: #0369A1;">${pendingCount}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-title">Declined</div>
              <div class="summary-card-value" style="color: #DC2626;">${rejectedCount}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Req #</th>
                <th>Date & Time</th>
                <th>Requester</th>
                <th>Approver / Target</th>
                <th>Jewellery Items</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; font-size: 11px; color: #94A3B8;">
            <span>Confidential — BitByte Marketing Internal Audit Report</span>
            <span>BitByte Marketing Technology Pvt. Ltd.</span>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
          background: #F8FAF9;
          background-image: 
            radial-gradient(at 0% 0%, rgba(7, 59, 63, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(204, 168, 129, 0.06) 0px, transparent 50%);
          padding: 24px 32px 60px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #111817;
        }

        .jt-container {
          width: 100%;
          max-width: 100%;
          margin: 0;
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
          transition: all 180ms ease;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.15);
        }

        .jt-btn-export:hover:not(:disabled) {
          background: #0C4E53;
        }

        .jt-btn-export:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .jt-btn-secondary {
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

        .jt-btn-secondary:hover:not(:disabled) {
          background: #F0F5F5;
          border-color: #073B3F;
        }

        .jt-btn-secondary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
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

        /* Stats Grid - 3 Interactive Cards (My / Leader / Forward Chains) */
        .jt-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        .jt-stat-card {
          background: #FFFFFF;
          border: 2px solid #E1EBEA;
          border-radius: 18px;
          padding: 20px 24px;
          box-shadow: 0 2px 12px rgba(7, 59, 63, 0.03);
          cursor: pointer;
          transition: all 180ms ease;
          position: relative;
          user-select: none;
        }

        .jt-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(7, 59, 63, 0.08);
        }

        .jt-stat-card.active-my {
          border-color: #073B3F;
          background: linear-gradient(180deg, #F4F9F9 0%, #FFFFFF 100%);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.12);
        }

        .jt-stat-card.active-leader {
          border-color: #0284C7;
          background: linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%);
          box-shadow: 0 8px 24px rgba(2, 132, 199, 0.12);
        }

        .jt-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .jt-stat-label-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .jt-stat-label {
          font-size: 12px;
          font-weight: 800;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .jt-stat-pill-active {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 3px 10px;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .jt-stat-pill-active.my {
          background: #073B3F;
          color: #FFFFFF;
        }

        .jt-stat-pill-active.leader {
          background: #0284C7;
          color: #FFFFFF;
        }

        .jt-stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .jt-stat-icon-wrap.my {
          background: #EFF6F6;
        }

        .jt-stat-icon-wrap.leader {
          background: #E0F2FE;
        }

        /* Forward Chains card + chain path */
        .jt-stat-card.active-chain {
          border-color: #BB8958;
          background: linear-gradient(180deg, #FFFAF1 0%, #FFFFFF 100%);
          box-shadow: 0 8px 24px rgba(187, 137, 88, 0.16);
        }
        .jt-stat-pill-active.chain { background: #BB8958; color: #FFFFFF; }
        .jt-stat-icon-wrap.chain { background: #FDF3E4; }
        .jt-chain {
          background: #F8FBFB;
          border: 1px dashed #CFE0DE;
          border-radius: 14px;
          padding: 10px 12px;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .jt-chain-legend { display: inline-flex; gap: 10px; text-transform: none; letter-spacing: 0; }
        .jt-chain-legend span { display: inline-flex; align-items: center; gap: 3px; font-weight: 800; }
        .jt-chain-title {
          display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
          font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
          color: #7A8987; margin-bottom: 8px;
        }
        /* Ore line — nodes equal height, naduvula line + arrow; idam paththalainaa side scroll */
        .jt-chain-track {
          display: flex; align-items: stretch; flex-wrap: nowrap;
          overflow-x: auto; padding: 3px 2px 4px;
          scrollbar-width: thin;
        }
        .jt-chain-step { display: flex; align-items: center; flex: 0 0 auto; }
        .jt-chain-conn { display: flex; align-items: center; flex: 0 0 auto; }
        .jt-chain-conn i { display: block; width: 10px; height: 2px; background: var(--conn); border-radius: 2px; }
        .jt-chain-link {
          width: 22px; height: 22px; border-radius: 50%; flex: 0 0 auto;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1.5px solid;
        }
        .jt-chain-node {
          display: flex; flex-direction: column; justify-content: center; gap: 1px;
          min-width: 100px; max-width: 160px; min-height: 36px;
          padding: 4px 10px; border-radius: 8px;
          background: #FFFFFF; border: 1px solid #E1EBEA;
          box-sizing: border-box;
        }
        .jt-chain-node strong {
          font-size: 11px; color: #073B3F;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .jt-chain-node small { font-size: 9.5px; color: #7A8987; font-weight: 700; }
        .jt-chain-node.current { border-color: #BB8958; box-shadow: 0 0 0 2px rgba(187, 137, 88, 0.18); }

        .jt-stat-val {
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
        }

        .jt-stat-sub {
          font-size: 12.5px;
          color: #7A8987;
          margin-top: 6px;
          font-weight: 600;
        }

        /* Leader Role Filter Bar */
        .jt-leader-role-bar {
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
          border-radius: 14px;
          padding: 12px 18px;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.06);
        }

        .jt-leader-role-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          color: #0369A1;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .jt-leader-role-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .jt-role-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #BAE6FD;
          background: #FFFFFF;
          color: #0369A1;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .jt-role-pill-btn:hover {
          background: #E0F2FE;
          border-color: #0284C7;
        }

        .jt-role-pill-btn.active {
          background: #0284C7;
          border-color: #0284C7;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
        }

        .jt-role-pill-count {
          padding: 1px 6px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          background: rgba(0, 0, 0, 0.08);
        }

        .jt-role-pill-btn.active .jt-role-pill-count {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
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

        /* En sondha request / Super Admin (leader) approve pannadhu — gold highlight */
        .jt-tx-card.jt-tx-highlight {
          border: 1.5px solid #BB8958;
          background: linear-gradient(135deg, #FFFCF7 0%, #FFFFFF 60%);
          box-shadow: 0 0 0 3px rgba(187, 137, 88, 0.12), 0 8px 22px rgba(187, 137, 88, 0.12);
        }
        .jt-highlight-tag {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(187, 137, 88, 0.14);
          border: 1px solid rgba(187, 137, 88, 0.45);
          color: #8A5A2B;
          font-size: 11.5px;
          font-weight: 800;
        }
        tr.jt-row-highlight td {
          background: #FFFAF1;
        }
        tr.jt-row-highlight td:first-child {
          box-shadow: inset 4px 0 0 #BB8958;
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
              disabled={displayedRequests.length === 0}
              onClick={exportDocument}
              title="Download or Print Formatted Report / PDF"
            >
              <DownloadIcon size={14} color="#FFFFFF" /> Download Report
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

        {/* 2 Interactive Cards: My Transactions & Leader Transactions */}
        <div className="jt-stats-grid">
          {/* Card 1: My Transactions */}
          <div
            className={`jt-stat-card ${activeCard === "my_transactions" ? "active-my" : ""}`}
            onClick={() => setActiveCard("my_transactions")}
          >
            <div className="jt-stat-top">
              <div className="jt-stat-label-wrap">
                <span className="jt-stat-label">My Transactions</span>
                {activeCard === "my_transactions" && (
                  <span className="jt-stat-pill-active my">Active View</span>
                )}
              </div>
              <div className="jt-stat-icon-wrap my">
                <PackageIcon size={20} color="#073B3F" />
              </div>
            </div>
            <div className="jt-stat-val" style={{ color: "#073B3F" }}>{myTxCount}</div>
            <div className="jt-stat-sub">
              {isSuperAdmin
                ? "Master stock additions & Super Stockist transfers"
                : "Transactions approved by me & my buy orders"}
            </div>
          </div>

          {/* Card 2: Leader Transactions */}
          <div
            className={`jt-stat-card ${activeCard === "leader_transactions" ? "active-leader" : ""}`}
            onClick={() => setActiveCard("leader_transactions")}
          >
            <div className="jt-stat-top">
              <div className="jt-stat-label-wrap">
                <span className="jt-stat-label">Leader Transactions</span>
                {activeCard === "leader_transactions" && (
                  <span className="jt-stat-pill-active leader">Active View</span>
                )}
              </div>
              <div className="jt-stat-icon-wrap leader">
                <UsersIcon size={20} color="#0284C7" />
              </div>
            </div>
            <div className="jt-stat-val" style={{ color: "#0284C7" }}>{leaderTxCount}</div>
            <div className="jt-stat-sub">
              {isSuperAdmin
                ? "Downline network transfers (Super Stockist, Distributor, Wholesale, Retailer)"
                : "Transfers across downline team hierarchy"}
            </div>
          </div>

          {/* Card 3: Forward Chains — Super Admin product leader-to-leader forward tracking (thaniya) */}
          <div
            className={`jt-stat-card ${activeCard === "chain_transactions" ? "active-chain" : ""}`}
            onClick={() => setActiveCard("chain_transactions")}
          >
            <div className="jt-stat-top">
              <div className="jt-stat-label-wrap">
                <span className="jt-stat-label">Forward Chains</span>
                {activeCard === "chain_transactions" && (
                  <span className="jt-stat-pill-active chain">Active View</span>
                )}
              </div>
              <div className="jt-stat-icon-wrap chain">
                <ArrowUpRightIcon size={20} color="#A0713F" />
              </div>
            </div>
            <div className="jt-stat-val" style={{ color: "#A0713F" }}>{chainTxCount}</div>
            <div className="jt-stat-sub">Leader-to-leader forwards</div>
          </div>
        </div>

        {/* Leader Role Sub-Filter Bar (Shown when Leader Transactions card is selected) */}
        {activeCard === "leader_transactions" && (
          <div className="jt-leader-role-bar">
            <div className="jt-leader-role-title">
              <UsersIcon size={14} color="#0369A1" />
              <span>Leader Role:</span>
            </div>
            <div className="jt-leader-role-pills">
              {LEADER_ROLES.map((lr) => {
                const count = getLeaderRoleCount(lr.key);
                const isActive = leaderRoleFilter === lr.key;
                return (
                  <button
                    key={lr.key}
                    type="button"
                    className={`jt-role-pill-btn ${isActive ? "active" : ""}`}
                    onClick={() => setLeaderRoleFilter(lr.key)}
                  >
                    <span>{lr.label}</span>
                    <span className="jt-role-pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls Card: Search + Status Filter Pills + View Mode */}
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

          <div className="jt-filter-pills">
            {[
              { key: "all", label: `All (${activeStatusCounts.total || 0})` },
              { key: "pending", label: `Pending (${activeStatusCounts.pending || 0})` },
              { key: "sent", label: `Approved (${activeStatusCounts.sent || 0})` },
              { key: "rejected", label: `Declined (${activeStatusCounts.rejected || 0})` },
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
              {activeCard === "my_transactions"
                ? "No transactions found under My Transactions for this period."
                : "No leader transactions found matching your selected role or filter criteria."}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          /* Cards View */
          <>
            <div className="jt-cards-grid">
              {displayedRequests.map((r) => {
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
                <div key={r.id} className={`jt-tx-card${r.highlight ? " jt-tx-highlight" : ""}`}>
                  {/* En sondha request / Super Admin (en leader) approve pannadhu — highlight */}
                  {r.highlight && <div className="jt-highlight-tag"><SparkleIcon size={12} color="#8A5A2B" /> {r.highlight_label}</div>}
                  <div className="jt-tx-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span className="jt-tx-id">Transfer #{r.id}</span>
                      {isMint ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: "#EDE9FE",
                            color: "#6B21A8",
                            border: "1px solid #DDD6FE",
                          }}
                        >
                          <PackageIcon size={13} color="#6B21A8" />
                          <span>Master Stock Added</span>
                        </span>
                      ) : isSuperAdmin ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: "#E0F2FE",
                            color: "#0369A1",
                            border: "1px solid #BAE6FD",
                          }}
                        >
                          <ArrowUpRightIcon size={13} color="#0369A1" />
                          <span>Stock Disbursed</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: isInward ? "#E6F4EA" : isOutward ? "#E0F2FE" : "#F1F5F9",
                            color: isInward ? "#137333" : isOutward ? "#0369A1" : "#475569",
                            border: `1px solid ${isInward ? "#CEEAD6" : isOutward ? "#BAE6FD" : "#CBD5E1"}`,
                          }}
                        >
                          {isInward ? (
                            <>
                              <ArrowDownLeftIcon size={13} color="#137333" />
                              <span>Stock Received</span>
                            </>
                          ) : isOutward ? (
                            <>
                              <ArrowUpRightIcon size={13} color="#0369A1" />
                              <span>Stock Disbursed</span>
                            </>
                          ) : (
                            <span>Transfer</span>
                          )}
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
                        <strong style={{ color: "#6B21A8", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <PackageIcon size={15} color="#6B21A8" />
                          <span>Added to Vault Inventory by Super Admin</span>
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
                  <JtChainStepper chain={r.chain} />

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
          {/* Infinite scroll — scroll pannumbodhu adutha 30 automatic-a varum */}
          {loadingMore && <JewelleryTransactionSkeletonList count={2} />}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
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
                  {displayedRequests.map((r) => {
                  const statusInfo = STATUS_CFG[r.status] || STATUS_CFG.pending;
                  const isInward = (r.requested_by_email || "").toLowerCase() === myEmail;
                  const isOutward = (r.requested_to_email || "").toLowerCase() === myEmail;
                  const isMint = r.reject_reason === "MASTER_MINT";

                  return (
                    <tr key={r.id} className={r.highlight ? "jt-row-highlight" : undefined} title={r.highlight_label || undefined} style={{ borderBottom: "1px solid #F0F4F4" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#073B3F" }}>
                        #{r.id}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
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
                            <PackageIcon size={12} color="#6B21A8" />
                            <span>Master Stock Added</span>
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
                            <ArrowUpRightIcon size={12} color="#0369A1" />
                            <span>Stock Disbursed</span>
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
                            {isInward ? (
                              <>
                                <ArrowDownLeftIcon size={12} color="#137333" />
                                <span>Received</span>
                              </>
                            ) : isOutward ? (
                              <>
                                <ArrowUpRightIcon size={12} color="#0369A1" />
                                <span>Disbursed</span>
                              </>
                            ) : (
                              <span>Transfer</span>
                            )}
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
          {/* Infinite scroll — scroll pannumbodhu adutha 30 automatic-a varum */}
          {loadingMore && <JewelleryTransactionSkeletonList count={2} />}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
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
