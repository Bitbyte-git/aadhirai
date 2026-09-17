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
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  ArrowRightIcon,
  CrownIcon,
  UsersIcon,
  PackageIcon,
} from "../components/SvgIcons";

const COIN_METAL_LABELS_TEXT = {
  gold_22k: "Gold 22K (916)",
  gold_24k: "Gold 24K (999)",
  silver_999: "Silver 999",
};

const STATUS_CFG = {
  pending: {
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    label: "Pending",
    icon: ClockIcon,
  },
  sent: {
    color: "#166534",
    bg: "#E6F4EA",
    border: "#BBF7D0",
    label: "Approved",
    icon: CheckIcon,
  },
  rejected: {
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    label: "Declined",
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
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState("");

  const currentRole = localStorage.getItem("role") || "";
  const isSuperAdmin = currentRole === "super_admin";
  const myEmail = (localStorage.getItem("email") || "").toLowerCase();
  const currentUserId = Number(
    localStorage.getItem("user_id") || localStorage.getItem("id") || 0
  );

  // Date / Period filter state (default: 'all' as requested)
  const [period, setPeriod] = useState("all"); // 'all' | 'day' | 'week' | 'month' | 'year' | 'custom'
  const [activeCard, setActiveCard] = useState("my_transactions"); // 'my_transactions' | 'leader_transactions'
  const [leaderRoleFilter, setLeaderRoleFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [statusCounts, setStatusCounts] = useState(() => {
    try {
      const cached = sessionStorage.getItem(STATS_CACHE_KEY);
      return cached ? JSON.parse(cached) : { pending: 0, sent: 0, rejected: 0, total: 0, disbursed_pieces: 0, pending_pieces: 0 };
    } catch {
      return { pending: 0, sent: 0, rejected: 0, total: 0, disbursed_pieces: 0, pending_pieces: 0 };
    }
  });
  // Backend-computed, full-dataset (not just the currently loaded page) headline counts
  const [myTxCount, setMyTxCount] = useState(0);
  const [leaderTxCount, setLeaderTxCount] = useState(0);

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
      const params = { box: "history", status: filter, offset: 0, limit: 100, period };
      if (period === "custom") {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }
      if (searchVal) params.search = searchVal;
      const res = await api.get("/coin-requests/", { params });
      setRequests(res.data.items || []);
      setTotalCount(res.data.total_count || 0);
      setStatusCounts(res.data.status_counts || { pending: 0, sent: 0, rejected: 0, total: 0, disbursed_pieces: 0, pending_pieces: 0 });
      setMyTxCount(res.data.my_count || 0);
      setLeaderTxCount(res.data.leader_count || 0);
      try {
        sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify(res.data.status_counts));
      } catch {
        /* ignore */
      }
      setOffset(100);
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
  }, [filter, searchTerm, period, startDate, endDate]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const params = { box: "history", status: filter, offset, limit, period };
      if (period === "custom") {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }
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

  // Classification logic for My Transactions vs Leader Transactions
  const isMyTransaction = (r) => {
    if (isSuperAdmin) {
      return (
        r.reject_reason === "MASTER_MINT" ||
        r.requested_by_role === "super_admin" ||
        r.requested_to_role === "super_admin" ||
        r.approved_by_role === "super_admin" ||
        (currentUserId && (
          r.requested_by === currentUserId ||
          r.requested_to === currentUserId ||
          r.approved_by === currentUserId
        )) ||
        (myEmail && (
          (r.requested_by_email || "").toLowerCase() === myEmail ||
          (r.requested_to_email || "").toLowerCase() === myEmail ||
          (r.approved_by_email || "").toLowerCase() === myEmail
        ))
      );
    }
    // For Downline Leaders: Approved by me OR Buy requests made by me
    const isBuyer =
      (currentUserId && r.requested_by === currentUserId) ||
      (myEmail && (r.requested_by_email || "").toLowerCase() === myEmail);
    const isApprover =
      (currentUserId && (r.requested_to === currentUserId || r.approved_by === currentUserId)) ||
      (myEmail && (
        (r.requested_to_email || "").toLowerCase() === myEmail ||
        (r.approved_by_email || "").toLowerCase() === myEmail
      ));
    return isBuyer || isApprover;
  };

  const isLeaderTransaction = (r) => {
    return !isMyTransaction(r);
  };

  const LEADER_ROLES = [
    { key: "all", label: "All" },
    { key: "admin", label: "Super Stockist" },
    { key: "dealer", label: "Distributor" },
    { key: "sub_dealer", label: "Wholesale Dealer" },
    { key: "promotor", label: "Retailer" },
    { key: "customer", label: "Customer" },
  ];

  const matchesLeaderRole = (r, roleKey) => {
    if (!roleKey || roleKey === "all") return true;
    if (roleKey === "customer") {
      return r.requested_by_role === "customer" || r.requested_to_role === "customer";
    }
    return (
      r.approved_by_role === roleKey ||
      r.requested_to_role === roleKey ||
      r.requested_by_role === roleKey
    );
  };

  // myTxCount / leaderTxCount now come from the backend (full-dataset DB counts, see fetchHistory)
  // instead of being derived by filtering the client-side, paginated `requests` array.

  const getLeaderRoleCount = (roleKey) => {
    const baseList = requests.filter(isLeaderTransaction);
    if (roleKey === "all") return baseList.length;
    return baseList.filter((r) => matchesLeaderRole(r, roleKey)).length;
  };

  const cardFilteredList = useMemo(() => {
    if (activeCard === "my_transactions") {
      return requests.filter(isMyTransaction);
    } else {
      let list = requests.filter(isLeaderTransaction);
      if (leaderRoleFilter !== "all") {
        list = list.filter((r) => matchesLeaderRole(r, leaderRoleFilter));
      }
      return list;
    }
  }, [requests, activeCard, leaderRoleFilter, isSuperAdmin, currentUserId, myEmail]);

  const activeStatusCounts = useMemo(() => {
    return {
      total: cardFilteredList.length,
      pending: cardFilteredList.filter((r) => r.status === "pending").length,
      sent: cardFilteredList.filter((r) => r.status === "sent").length,
      rejected: cardFilteredList.filter((r) => r.status === "rejected").length,
    };
  }, [cardFilteredList]);

  const filteredRequests = useMemo(() => {
    let list = cardFilteredList;
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase().trim();
    return list.filter((r) => {
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
  }, [cardFilteredList, searchTerm]);

  // Export Formatted Document / PDF Report
  const exportDocument = () => {
    if (!filteredRequests.length) {
      showToast("No transaction records to export");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to open the transaction document.");
      return;
    }

    const rowsHtml = filteredRequests
      .map((r, idx) => {
        const itemsFormatted = (r.items || [])
          .map(
            (i) =>
              `<div><strong>${COIN_METAL_LABELS_TEXT[i.metal_type] || i.metal_type}</strong> (${i.weight_label}) × ${i.qty}</div>`
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
            <td style="padding: 10px 12px; font-size: 12px; color: #334155; white-space: nowrap;">${formatTime(r.created_at)}</td>
            <td style="padding: 10px 12px; font-size: 12px; color: #0F172A;">
              <strong>${r.requested_by_name || r.requested_by_email}</strong>
              <div style="font-size: 11px; color: #64748B;">${r.requested_by_id_str ? `[${r.requested_by_id_str}] ` : ''}${r.requested_by_role || ''} • ${r.requested_by_phone || ''}</div>
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

    const approvedCount = filteredRequests.filter((r) => r.status === "sent").length;
    const pendingCount = filteredRequests.filter((r) => r.status === "pending").length;
    const rejectedCount = filteredRequests.filter((r) => r.status === "rejected").length;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Coin_Transactions_Audit_Report_${new Date().toISOString().slice(0, 10)}</title>
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
            <span style="font-weight: 700; font-size: 14px;">BitByte Coin Transaction Audit Document</span>
            <div>
              <button class="btn btn-print" onclick="window.print()">Print / Save as PDF</button>
              <button class="btn btn-close" onclick="window.close()">Close</button>
            </div>
          </div>

          <div class="header-box">
            <div>
              <h1 class="title">Coin Transaction Audit Report</h1>
              <p class="subtitle">BitByte Marketing Ledger — Official Record of Allocations & Transfers</p>
            </div>
            <div class="meta-box">
              <div><strong>Generated Date:</strong> ${new Date().toLocaleString("en-IN")}</div>
              <div><strong>Filter Period:</strong> ${period.toUpperCase()}</div>
              <div><strong>Total Records:</strong> ${filteredRequests.length}</div>
            </div>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-card-title">Total Transactions</div>
              <div class="summary-card-value">${filteredRequests.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-title">Approved & Disbursed</div>
              <div class="summary-card-value" style="color: #166534;">${approvedCount}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-title">Pending Decisions</div>
              <div class="summary-card-value" style="color: #0369A1;">${pendingCount}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-title">Declined Requests</div>
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
                <th>Coins / Denominations</th>
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
          transition: all 180ms ease;
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
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        .ct-stat-card {
          background: #FFFFFF;
          border: 2px solid #E1EBEA;
          border-radius: 18px;
          padding: 20px 24px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
          cursor: pointer;
          transition: all 180ms ease;
          position: relative;
          user-select: none;
        }

        .ct-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(7, 59, 63, 0.08);
        }

        .ct-stat-card.active-my {
          border-color: #073B3F;
          background: linear-gradient(180deg, #F4F9F9 0%, #FFFFFF 100%);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.12);
        }

        .ct-stat-card.active-leader {
          border-color: #0284C7;
          background: linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%);
          box-shadow: 0 8px 24px rgba(2, 132, 199, 0.12);
        }

        .ct-stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .ct-stat-label-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ct-stat-label {
          font-size: 12px;
          font-weight: 800;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .ct-stat-pill-active {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 3px 10px;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .ct-stat-pill-active.my {
          background: #073B3F;
          color: #FFFFFF;
        }

        .ct-stat-pill-active.leader {
          background: #0284C7;
          color: #FFFFFF;
        }

        .ct-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ct-stat-value {
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 6px;
        }

        .ct-stat-sub {
          font-size: 12.5px;
          color: #7A8987;
          font-weight: 600;
        }

        /* Leader Role Filter Bar */
        .ct-leader-role-bar {
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

        .ct-leader-role-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          color: #0369A1;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ct-leader-role-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ct-role-pill-btn {
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

        .ct-role-pill-btn:hover {
          background: #E0F2FE;
          border-color: #0284C7;
        }

        .ct-role-pill-btn.active {
          background: #0284C7;
          border-color: #0284C7;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
        }

        .ct-role-pill-count {
          padding: 1px 6px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          background: rgba(0, 0, 0, 0.08);
        }

        .ct-role-pill-btn.active .ct-role-pill-count {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
        }

        .ct-period-bar {
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

        .ct-period-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ct-period-btn {
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

        .ct-period-btn:hover {
          background: #EBF3F2;
          color: #073B3F;
          border-color: #B4CECC;
        }

        .ct-period-btn.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.2);
        }

        .ct-custom-date-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ct-date-field {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: #5C706E;
        }

        .ct-date-field input {
          padding: 6px 10px;
          background: #F8FAFA;
          border: 1px solid #D6E2E1;
          border-radius: 8px;
          font-size: 12.5px;
          color: #111817;
          outline: none;
          font-family: inherit;
        }

        .ct-date-field input:focus {
          border-color: #073B3F;
          background: #FFFFFF;
        }

        .ct-date-clear {
          padding: 6px 12px;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          color: #DC2626;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
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

        .ct-controls-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
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

        /* View Switcher (Cards vs Table) */
        .ct-view-switcher {
          display: flex;
          align-items: center;
          background: #EFF4F3;
          border-radius: 10px;
          padding: 3px;
          gap: 2px;
        }

        .ct-view-tab {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          background: transparent;
          color: #5C706E;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .ct-view-tab.active {
          background: #FFFFFF;
          color: #073B3F;
          box-shadow: 0 2px 6px rgba(7, 59, 63, 0.08);
        }

        /* ── NEW EASY-TO-READ CARDS VIEW ── */
        .ct-cards-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ct-tx-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 22px 26px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.04);
          transition: all 180ms ease;
        }

        .ct-tx-card:hover {
          border-color: #073B3F;
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.08);
        }

        .ct-tx-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid #EDF3F2;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ct-tx-id-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ct-tx-id-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: "SFMono-Regular", Consolas, Menlo, monospace;
          font-size: 13px;
          font-weight: 800;
          color: #073B3F;
          background: #EFF6F6;
          border: 1px solid #D1DFDE;
          padding: 4px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .ct-tx-id-badge:hover {
          background: #E2ECEB;
        }

        .ct-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .ct-tx-time {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #5C706E;
          font-weight: 600;
        }

        /* Routing Flow (From Requester -> To Approver) */
        .ct-tx-flow-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 16px;
          align-items: center;
          background: #F8FAFA;
          border: 1px solid #E6EEEE;
          border-radius: 14px;
          padding: 16px 20px;
          margin-bottom: 16px;
        }

        .ct-flow-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ct-flow-role-tag {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #7A8987;
        }

        .ct-flow-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ct-flow-name {
          font-size: 15px;
          font-weight: 800;
          color: #111817;
        }

        .ct-flow-role-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: #E8F0FE;
          color: #1967D2;
          text-transform: capitalize;
        }

        .ct-flow-role-badge.approver {
          background: #FEF3C7;
          color: #92400E;
        }

        .ct-flow-contacts {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #5C706E;
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .ct-contact-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .ct-email-text {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ct-flow-arrow-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #073B3F;
          padding: 0 10px;
        }

        .ct-flow-arrow {
          font-size: 20px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
        }

        .ct-flow-arrow-label {
          font-size: 10px;
          font-weight: 700;
          color: #7A8987;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Coins summary section */
        .ct-tx-coins-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ct-tx-metrics {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ct-tx-metric-pill {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          background: #EFF6F6;
          border: 1px solid #D1DFDE;
          padding: 6px 12px;
          border-radius: 10px;
        }

        .ct-tx-metric-pill.weight {
          background: #FFFBEB;
          border-color: #FDE68A;
        }

        .ct-tx-metric-label {
          font-size: 10.5px;
          font-weight: 800;
          color: #7A8987;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .ct-tx-metric-val {
          font-size: 14px;
          font-weight: 800;
          color: #073B3F;
        }

        .ct-tx-metric-pill.weight .ct-tx-metric-val {
          color: #B45309;
        }

        .ct-tx-items-grid {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          flex: 1;
          justify-content: flex-end;
        }

        .ct-tx-item-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #F8FAFA;
          border: 1px solid #E1EBEA;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        .ct-chip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .ct-chip-qty {
          font-weight: 800;
          color: #073B3F;
          background: #E6F4EA;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }

        .ct-chip-wt {
          font-weight: 700;
          color: #B45309;
          font-size: 11px;
        }

        .ct-tx-reject-banner {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 12.5px;
          color: #991B1B;
        }

        /* ── TABLE VIEW STYLES (CLEANED & ENHANCED) ── */
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
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.25);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 1024px) {
          .ct-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .ct-root { padding: 16px 16px 40px; }
          .ct-tx-flow-grid { grid-template-columns: 1fr; gap: 12px; }
          .ct-flow-arrow-wrap { flex-direction: row; gap: 6px; }
        }

        @media (max-width: 600px) {
          .ct-stats-grid { grid-template-columns: 1fr; }
          .ct-header-card { flex-direction: column; align-items: flex-start; }
          .ct-header-actions { width: 100%; }
          .ct-tx-coins-summary { flex-direction: column; align-items: flex-start; }
          .ct-tx-items-grid { justify-content: flex-start; }
        }
      `}</style>

      {toast && <div className="ct-toast"><CheckIcon size={14} color="#FFFFFF" /> {toast}</div>}

      <div className="ct-shell">
        {/* 4 Tabs Matching Navigation */}
        <CoinTabs activeTab="Transaction Coins History" />

        {/* Executive Header Card */}
        <div className="ct-header-card">
          <div className="ct-header-info">
            <h1>
              <span>Transaction Coins History</span>
              <span className="ct-badge">Audit Ledger</span>
              {currentRole === "super_admin" && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #073B3F 0%, #0C4E53 100%)",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "4px 12px",
                  borderRadius: "999px",
                  letterSpacing: "0.4px"
                }}>
                  <CrownIcon size={12} color="#FFFFFF" /> Master Hierarchy View
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
              onClick={exportDocument}
              title="Download or Print Formatted Report / PDF"
            >
              <DownloadIcon size={15} color="#FFFFFF" /> Download Report
            </button>
          </div>
        </div>

        {/* Date / Period Filter Bar */}
        <div className="ct-period-bar">
          <div className="ct-period-pills">
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
                className={`ct-period-btn ${period === p.key ? "active" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                <CalendarIcon size={14} color={period === p.key ? "#FFFFFF" : "#5C706E"} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="ct-custom-date-inputs">
              <div className="ct-date-field">
                <label>From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="ct-date-field">
                <label>To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  className="ct-date-clear"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  Clear Dates
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2 Interactive Cards: My Transactions & Leader Transactions */}
        <div className="ct-stats-grid">
          {/* Card 1: My Transactions */}
          <div
            className={`ct-stat-card ${activeCard === "my_transactions" ? "active-my" : ""}`}
            onClick={() => setActiveCard("my_transactions")}
          >
            <div className="ct-stat-header">
              <div className="ct-stat-label-wrap">
                <span className="ct-stat-label">My Transactions</span>
                {activeCard === "my_transactions" && (
                  <span className="ct-stat-pill-active my">Active View</span>
                )}
              </div>
              <div className="ct-stat-icon" style={{ background: "#EFF6F6", color: "#073B3F" }}>
                <PackageIcon size={18} color="#073B3F" />
              </div>
            </div>
            <div className="ct-stat-value" style={{ color: "#073B3F" }}>{myTxCount}</div>
            <div className="ct-stat-sub">
              {isSuperAdmin
                ? "Master stock minting & Super Stockist transfers"
                : "Transactions approved by me & my buy orders"}
            </div>
          </div>

          {/* Card 2: Leader Transactions */}
          <div
            className={`ct-stat-card ${activeCard === "leader_transactions" ? "active-leader" : ""}`}
            onClick={() => setActiveCard("leader_transactions")}
          >
            <div className="ct-stat-header">
              <div className="ct-stat-label-wrap">
                <span className="ct-stat-label">Leader Transactions</span>
                {activeCard === "leader_transactions" && (
                  <span className="ct-stat-pill-active leader">Active View</span>
                )}
              </div>
              <div className="ct-stat-icon" style={{ background: "#E0F2FE", color: "#0284C7" }}>
                <UsersIcon size={18} color="#0284C7" />
              </div>
            </div>
            <div className="ct-stat-value" style={{ color: "#0284C7" }}>{leaderTxCount}</div>
            <div className="ct-stat-sub">
              {isSuperAdmin
                ? "Downline network transfers (Super Stockist, Distributor, Wholesale, Retailer)"
                : "Transfers across downline team hierarchy"}
            </div>
          </div>
        </div>

        {/* Leader Role Sub-Filter Bar (Shown when Leader Transactions card is selected) */}
        {activeCard === "leader_transactions" && (
          <div className="ct-leader-role-bar">
            <div className="ct-leader-role-title">
              <UsersIcon size={14} color="#0369A1" />
              <span>Leader Role:</span>
            </div>
            <div className="ct-leader-role-pills">
              {LEADER_ROLES.map((lr) => {
                const count = getLeaderRoleCount(lr.key);
                const isActive = leaderRoleFilter === lr.key;
                return (
                  <button
                    key={lr.key}
                    type="button"
                    className={`ct-role-pill-btn ${isActive ? "active" : ""}`}
                    onClick={() => setLeaderRoleFilter(lr.key)}
                  >
                    <span>{lr.label}</span>
                    <span className="ct-role-pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls Card: Search + Status Filter Pills + View Switcher */}
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
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                <CloseIcon size={13} color="#7A8987" />
              </button>
            )}
          </div>

          <div className="ct-controls-right">
            <div className="ct-filter-pills">
              {[
                { key: "all", label: `All (${activeStatusCounts.total || 0})` },
                { key: "pending", label: `Pending (${activeStatusCounts.pending || 0})` },
                { key: "sent", label: `Approved (${activeStatusCounts.sent || 0})` },
                { key: "rejected", label: `Declined (${activeStatusCounts.rejected || 0})` },
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

            {/* View Mode Toggle: Cards vs Table */}
            <div className="ct-view-switcher">
              <button
                type="button"
                className={`ct-view-tab ${viewMode === "cards" ? "active" : ""}`}
                onClick={() => setViewMode("cards")}
                title="Easy-to-read Cards View"
              >
                Cards View
              </button>
              <button
                type="button"
                className={`ct-view-tab ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table Ledger View"
              >
                Table View
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {/* ── VIEW 1: EASY-TO-READ CARDS VIEW (DEFAULT) ── */}
        {viewMode === "cards" && (
          <>
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="ct-tx-card">
                    <SkeletonText width="180px" height="22px" />
                    <SkeletonText width="100%" height="80px" style={{ marginTop: "14px" }} />
                    <SkeletonText width="60%" height="30px" style={{ marginTop: "14px" }} />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredRequests.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E1EBEA", color: "#7A8987" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#073B3F", marginBottom: "4px" }}>
                  No Transactions Found
                </div>
                <div style={{ fontSize: "13px" }}>
                  {searchTerm ? `No records matching "${searchTerm}". Try another search term.` : "No transaction orders found in this category."}
                </div>
              </div>
            )}

            {!loading && filteredRequests.length > 0 && (
              <div className="ct-cards-list">
                {filteredRequests.map((req) => {
                  const cfg = STATUS_CFG[req.status] || STATUS_CFG.pending;
                  const StatusIcon = cfg.icon;
                  const totalPieces = (req.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
                  const totalGrams = (req.items || []).reduce(
                    (sum, it) => sum + ((Number(it.weight_grams) || 0) * (Number(it.qty) || 0)),
                    0
                  );

                  return (
                    <article className="ct-tx-card" key={req.id}>
                      {/* Card Header */}
                      <div className="ct-tx-header">
                        <div className="ct-tx-id-group">
                          <span
                            className="ct-tx-id-badge"
                            title="Click to copy Transaction ID"
                            onClick={() => handleCopy(`#REQ-${req.id}`, `tx-${req.id}`)}
                          >
                            <span>#REQ-{req.id}</span>
                            {copiedId === `tx-${req.id}` ? (
                              <CheckIcon size={12} color="#137333" />
                            ) : (
                              <CopyIcon size={12} color="#7A8987" />
                            )}
                          </span>

                          <span
                            className="ct-status-pill"
                            style={{
                              background: cfg.bg,
                              color: cfg.color,
                              border: `1px solid ${cfg.border}`,
                            }}
                          >
                            <StatusIcon size={12} color={cfg.color} />
                            <span>{cfg.label}</span>
                          </span>
                        </div>

                        <div className="ct-tx-time">
                          <CalendarIcon size={13} color="#7A8987" />
                          <span>{formatTime(req.created_at)}</span>
                        </div>
                      </div>

                      {/* Flow: Requester -> Assigned Approver */}
                      <div className="ct-tx-flow-grid">
                        {/* Requester Box */}
                        <div className="ct-flow-box requester">
                          <span className="ct-flow-role-tag">Requested By</span>
                          <div className="ct-flow-name-row">
                            <span className="ct-flow-name">{req.requested_by_name || "Member"}</span>
                            <span className="ct-flow-role-badge">
                              {req.requested_by_role?.replace('_', ' ') || "Requester"}
                            </span>
                          </div>

                          {req.requested_by_id_str && (
                            <div>
                              <span
                                className="ct-id-badge"
                                title="Copy ID"
                                onClick={() => handleCopy(req.requested_by_id_str, `req-${req.id}`)}
                              >
                                <span>{req.requested_by_id_str}</span>
                                {copiedId === `req-${req.id}` ? (
                                  <CheckIcon size={10} color="#137333" />
                                ) : (
                                  <CopyIcon size={10} color="#7A8987" />
                                )}
                              </span>
                            </div>
                          )}

                          <div className="ct-flow-contacts">
                            {req.requested_by_phone && (
                              <span className="ct-contact-item">
                                <PhoneIcon size={12} color="#073B3F" />
                                <span>{req.requested_by_phone}</span>
                              </span>
                            )}
                            {req.requested_by_email && (
                              <span className="ct-contact-item">
                                <MailIcon size={12} color="#073B3F" />
                                <span className="ct-email-text" title={req.requested_by_email}>
                                  {req.requested_by_email}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Flow Arrow */}
                        <div className="ct-flow-arrow-wrap">
                          <span className="ct-flow-arrow"><ArrowRightIcon size={20} color="#073B3F" /></span>
                          <span className="ct-flow-arrow-label">Routed To</span>
                        </div>

                        {/* Approver Box */}
                        <div className="ct-flow-box approver">
                          <span className="ct-flow-role-tag">Assigned Approver</span>
                          <div className="ct-flow-name-row">
                            <span className="ct-flow-name">{req.requested_to_name || "Vault / Parent"}</span>
                            <span className="ct-flow-role-badge approver">
                              {req.requested_to_role?.replace('_', ' ') || "Approver"}
                            </span>
                          </div>

                          {req.requested_to_id_str && (
                            <div>
                              <span
                                className="ct-id-badge"
                                title="Copy ID"
                                onClick={() => handleCopy(req.requested_to_id_str, `to-${req.id}`)}
                              >
                                <span>{req.requested_to_id_str}</span>
                                {copiedId === `to-${req.id}` ? (
                                  <CheckIcon size={10} color="#137333" />
                                ) : (
                                  <CopyIcon size={10} color="#7A8987" />
                                )}
                              </span>
                            </div>
                          )}

                          <div className="ct-flow-contacts">
                            {req.requested_to_phone && (
                              <span className="ct-contact-item">
                                <PhoneIcon size={12} color="#073B3F" />
                                <span>{req.requested_to_phone}</span>
                              </span>
                            )}
                            {req.requested_to_email && (
                              <span className="ct-contact-item">
                                <MailIcon size={12} color="#073B3F" />
                                <span className="ct-email-text" title={req.requested_to_email}>
                                  {req.requested_to_email}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Coins & Weight Summary */}
                      <div className="ct-tx-coins-summary">
                        <div className="ct-tx-metrics">
                          <div className="ct-tx-metric-pill">
                            <span className="ct-tx-metric-label">Coins:</span>
                            <span className="ct-tx-metric-val">{totalPieces} pcs</span>
                          </div>
                          {totalGrams > 0 && (
                            <div className="ct-tx-metric-pill weight">
                              <span className="ct-tx-metric-label">Weight:</span>
                              <span className="ct-tx-metric-val">{totalGrams.toFixed(2)} g</span>
                            </div>
                          )}
                        </div>

                        {/* Denomination Chips */}
                        <div className="ct-tx-items-grid">
                          {req.items?.map((item, idx) => (
                            <div className="ct-tx-item-chip" key={item.id || idx}>
                              <span
                                className="ct-chip-dot"
                                style={{
                                  background: item.metal_type?.includes("silver") ? "#94A3B8" : "#D97706",
                                }}
                              />
                              <span>
                                {COIN_METAL_LABELS_TEXT[item.metal_type] || item.metal_type} ({item.weight_label})
                              </span>
                              {item.weight_grams && (
                                <span className="ct-chip-wt">
                                  {(Number(item.weight_grams) * Number(item.qty)).toFixed(2)} g
                                </span>
                              )}
                              <span className="ct-chip-qty">{item.qty} pcs</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Decline Reason Banner */}
                      {req.status === "rejected" && req.reject_reason && (
                        <div className="ct-tx-reject-banner">
                          <CloseIcon size={14} color="#DC2626" />
                          <span>
                            <strong>Decline Reason:</strong> {req.reject_reason}
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── VIEW 2: TABLE VIEW ── */}
        {viewMode === "table" && (
          <div className="ct-table-card">
            <div className="ct-table-header">
              <span className="ct-table-title">Transaction Records Ledger</span>
              <span style={{ fontSize: "12px", color: "#5C706E", fontWeight: 700 }}>
                {filteredRequests.length} of {totalCount} shown
              </span>
            </div>

            <div className="ct-scroll">
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Assigned Approver</th>
                    <th>Contact</th>
                    <th>Coins & Denominations</th>
                    <th>Date & Time</th>
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
                          {searchTerm ? `No records matching "${searchTerm}".` : "No transaction orders found."}
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
                                  textTransform: "capitalize",
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
                                  textTransform: "capitalize",
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
                            {req.requested_by_phone && (
                              <div style={{ fontSize: "12px", color: "#111817", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                                <PhoneIcon size={12} color="#073B3F" />
                                <span>{req.requested_by_phone}</span>
                              </div>
                            )}
                            {req.requested_by_email && (
                              <div style={{ fontSize: "11px", color: "#7A8987", marginTop: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
                                <MailIcon size={11} color="#7A8987" />
                                <span>{req.requested_by_email}</span>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                              {req.items?.map((item, idx) => (
                                <span
                                  key={item.id || idx}
                                  style={{
                                    display: "inline-block",
                                    background: "#F8FAFA",
                                    border: "1px solid #E1EBEA",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    color: "#073B3F",
                                  }}
                                >
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
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loadingMore && !searchTerm && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
            <button
              type="button"
              style={{
                background: "#073B3F",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                padding: "10px 24px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(7, 59, 63, 0.15)",
                transition: "all 180ms ease",
              }}
              onClick={loadMore}
            >
              Load More ({requests.length} of {totalCount})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}