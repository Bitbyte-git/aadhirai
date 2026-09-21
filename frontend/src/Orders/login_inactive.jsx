import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import SuperAdminNavbar from "../collection/SuperAdminNavbar";
import InternalRoleNavbar from "../collection/InternalRoleNavbar";
import { SkeletonText } from "../components/Skeleton";

const INTERNAL_ROLE_CHROME = {
  admin: { title: 'ADMIN', home: '/admin' },
  dealer: { title: 'DEALER', home: '/dealer' },
  sub_dealer: { title: 'SUB DEALER', home: '/sub-dealer' },
  promotor: { title: 'PROMOTER', home: '/promotor' },
}
import {
  UsersIcon,
  UserIcon,
  SearchIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  ArrowLeftIcon,
  ClockIcon,
} from "../components/SvgIcons";

const ROLE_DISPLAY = {
  Admin: "Super Stockist",
  Dealer: "Distributor",
  "Sub Dealer": "Wholesale Dealer",
  Promotor: "Retailer",
  Customer: "Customer",
};

const ROLE_CARD_TITLE = {
  all: "All Users",
  Admin: "All Super Stockist",
  Dealer: "All Distributor",
  "Sub Dealer": "All Wholesale Dealer",
  Promotor: "All Retailer",
  Customer: "All Customer",
};

const INACTIVE_PERIOD_LABEL = {
  today: "Today Inactive",
  "3days": "3 Days Inactive",
  week: "1 Week Inactive",
  month: "1 Month Inactive",
  year: "1 Year Inactive",
};

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "3days", label: "3 Days" },
  { value: "week", label: "1 Week" },
  { value: "month", label: "1 Month" },
  { value: "year", label: "1 Year" },
];

export default function LoginInactive() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewerRole = localStorage.getItem('role');
  const viewerChrome = INTERNAL_ROLE_CHROME[viewerRole];
  const scopeIds = location.state?.ids || null;
  const scopeLabel = location.state?.scopeLabel || null;
  // Other pages (e.g. Super Stockist directory's "Today Inactive" stat card)
  // can deep-link straight into a role-filtered view here.
  const initialRoleFilter = location.state?.roleFilter || "all";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [periodFilter, setPeriodFilter] = useState("today");
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState("");

  const [viewMode, setViewMode] = useState("inactive");
  const [selectedCard, setSelectedCard] = useState("inactive");
  const [statGrandTotal, setStatGrandTotal] = useState(0);
  const [statInactiveCount, setStatInactiveCount] = useState(0);
  const [statNeverCount, setStatNeverCount] = useState(0);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const isAdminOnly = roleFilter === "Admin";
        const initialLimit = isAdminOnly ? 5000 : 50;

        const res = await api.get("/today-login-status/", {
          params: {
            period: periodFilter,
            role: roleFilter,
            list_type: viewMode,
            offset: 0,
            limit: initialLimit,
          },
        });
        let list = [...(res.data.inactive || res.data.results || [])];
        setTotalCount(res.data.total_count || 0);
        setStatGrandTotal(res.data.grand_total_count ?? (res.data.total_count || 0));
        setStatInactiveCount(res.data.inactive_count ?? 0);
        setStatNeverCount(res.data.never_login_count ?? 0);
        setOffset(initialLimit);
        setLimit(50);
        if (scopeIds) list = list.filter((u) => scopeIds.includes(u.id));
        const sorted = list.sort((a, b) => a.level - b.level);
        setData(sorted);
      } catch {
        setError("Failed to load inactive users.");
      }
      setLoading(false);
    };
    fetchData();
  }, [periodFilter, roleFilter, viewMode]);

  const formatTime = (iso) => {
    if (!iso) return "Never Login";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDays = (days) => {
    if (days === null || days === undefined) return "—";
    if (days === 0) return "Today";
    return `${days}d`;
  };

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === periodFilter)?.label || "Today";
  const roleCardTitle = ROLE_CARD_TITLE[roleFilter] || "All Users";
  const inactiveCardTitle = INACTIVE_PERIOD_LABEL[periodFilter] || "Today Inactive";

  const handleTotalUsersCardClick = () => {
    setViewMode("all");
    setSelectedCard("total");
  };
  const handleInactiveCardClick = () => {
    setViewMode("inactive");
    setSelectedCard("inactive");
  };
  const handleNeverCardClick = () => {
    setViewMode("never");
    setSelectedCard("never");
  };

  // Client search filtering
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const q = searchTerm.toLowerCase().trim();
    return data.filter((u) => {
      const id = (u.id || "").toLowerCase();
      const name = (u.name || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      const role = (u.level_role || "").toLowerCase();
      return id.includes(q) || name.includes(q) || phone.includes(q) || role.includes(q);
    });
  }, [data, searchTerm]);

  const isAdminOnly = roleFilter === "Admin";
  const hasMore = !isAdminOnly && data.length < totalCount;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get("/today-login-status/", {
        params: { period: periodFilter, role: roleFilter, list_type: viewMode, offset, limit: 50 },
      });
      const newList = res.data.inactive || res.data.results || [];
      setData((prev) => [...prev, ...newList].sort((a, b) => a.level - b.level));
      setOffset((prev) => prev + 50);
      setLimit(50);
    } catch {
      setError("Failed to load more users.");
    }
    setLoadingMore(false);
  };

  // Metrics
  const inactiveCount = totalCount || data.length;
  const neverLoggedIn = data.filter((u) => !u.last_login).length;
  const adminInactive = data.filter((u) => u.level_role === "Admin").length;
  const shownCount = filtered.length;

  const exportDocument = () => {
    if (!filtered.length) return;

    const reportTitle = "Inactive Users Report";
    const dateStr = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const rowsHtml = filtered.map((u, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fbfb'};">
        <td style="padding: 8pt 6pt; border: 1pt solid #d1dfde; text-align: center; font-size: 9.5pt;">${i + 1}</td>
        <td style="padding: 8pt 6pt; border: 1pt solid #d1dfde; text-align: center; font-size: 9.5pt;">${u.level || "-"}</td>
        <td style="padding: 8pt 6pt; border: 1pt solid #d1dfde; font-weight: bold; color: #073B3F; font-size: 9.5pt;">${ROLE_DISPLAY[u.level_role] || u.level_role || "-"}</td>
        <td style="padding: 8pt 6pt; border: 1pt solid #d1dfde; font-family: 'Courier New', monospace; font-size: 9pt;">${u.id || "-"}</td>
        <td style="padding: 8pt 6pt; border: 1pt solid #d1dfde; font-weight: 600; font-size: 9.5pt;">${u.name || "-"}</td>
        <td style="padding: 8pt 6pt; border: 1pt solid #d1dfde; font-size: 9.5pt;">${u.phone || "-"}</td>
        <td style="padding: 8pt 6pt; border: 1pt solid #d1dfde; text-align: center; color: #DC2626; font-weight: bold; font-size: 9.5pt;">${formatDays(u.days_inactive)}</td>
        <td style="padding: 8pt 6pt; border: 1pt solid #d1dfde; font-size: 9pt;">${u.last_login ? formatTime(u.last_login) : `Never Login (Created: ${formatDate(u.created_at)})`}</td>
      </tr>
    `).join("");

    const documentHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${reportTitle}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 841.9pt 595.3pt;
            mso-page-orientation: landscape;
            margin: 0.5in 0.5in 0.5in 0.5in;
            mso-header-margin: 0.3in;
            mso-footer-margin: 0.3in;
          }
          div.Section1 {
            page: Section1;
          }
          body {
            font-family: Calibri, 'Segoe UI', Arial, sans-serif;
            color: #111817;
            margin: 0;
            padding: 0;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2.5pt solid #073B3F;
            margin-bottom: 12pt;
          }
          .brand-text {
            font-size: 11pt;
            font-weight: bold;
            color: #073B3F;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          .report-heading {
            font-size: 20pt;
            font-weight: bold;
            color: #073B3F;
            margin: 3pt 0 4pt 0;
          }
          .meta-text {
            font-size: 9.5pt;
            color: #5C706E;
            margin-bottom: 8pt;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #EFF6F6;
            border: 1pt solid #D1DFDE;
            margin-bottom: 14pt;
          }
          .summary-td {
            padding: 9pt 14pt;
            font-size: 9.5pt;
            color: #073B3F;
            border: none;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          table.data-table th {
            background-color: #073B3F;
            color: #FFFFFF;
            padding: 9pt 6pt;
            border: 1pt solid #073B3F;
            font-size: 9.5pt;
            font-weight: bold;
            text-align: left;
          }
          table.data-table td {
            padding: 8pt 6pt;
            border: 1pt solid #D1DFDE;
            font-size: 9.5pt;
            vertical-align: middle;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table class="header-table">
            <tr>
              <td style="border: none; padding-bottom: 8pt;">
                <div class="brand-text">ATHIRAI JEWELLERY — MANAGEMENT REPORT</div>
                <div class="report-heading">${reportTitle}</div>
                <div class="meta-text">Generated: ${dateStr} • Scope: ${scopeLabel || "All Hierarchy"}</div>
              </td>
            </tr>
          </table>

          <table class="summary-table">
            <tr>
              <td class="summary-td">
                <strong>Total Inactive Users:</strong> ${filtered.length} &nbsp;&nbsp;|&nbsp;&nbsp;
                <strong>Inactivity Period:</strong> ${INACTIVE_PERIOD_LABEL[periodFilter] || (periodFilter === "all" ? "All Time" : periodFilter === "never" ? "Never Logged In" : `${periodFilter} Inactive`)} &nbsp;&nbsp;|&nbsp;&nbsp;
                <strong>Role Filter:</strong> ${roleFilter === "all" ? "All Roles" : (ROLE_DISPLAY[roleFilter] || roleFilter)}
              </td>
            </tr>
          </table>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">S.No</th>
                <th style="width: 6%; text-align: center;">Level</th>
                <th style="width: 16%;">Position</th>
                <th style="width: 15%;">User ID</th>
                <th style="width: 20%;">Name</th>
                <th style="width: 13%;">Phone No</th>
                <th style="width: 10%; text-align: center;">Days Inactive</th>
                <th style="width: 15%;">Last Login / Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', documentHtml], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Inactive_Users_Report_${periodFilter}_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Document downloaded successfully");
  };

  const printDocument = () => {
    if (!filtered.length) return;

    const reportTitle = "Inactive Users Report";
    const dateStr = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const rowsHtml = filtered.map((u, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fbfb'};">
        <td style="padding: 7px 6px; border: 1px solid #d1dfde; text-align: center;">${i + 1}</td>
        <td style="padding: 7px 6px; border: 1px solid #d1dfde; text-align: center;">${u.level || "-"}</td>
        <td style="padding: 7px 6px; border: 1px solid #d1dfde; font-weight: bold; color: #073B3F;">${ROLE_DISPLAY[u.level_role] || u.level_role || "-"}</td>
        <td style="padding: 7px 6px; border: 1px solid #d1dfde; font-family: monospace; font-size: 11px;">${u.id || "-"}</td>
        <td style="padding: 7px 6px; border: 1px solid #d1dfde; font-weight: 600;">${u.name || "-"}</td>
        <td style="padding: 7px 6px; border: 1px solid #d1dfde;">${u.phone || "-"}</td>
        <td style="padding: 7px 6px; border: 1px solid #d1dfde; text-align: center; color: #DC2626; font-weight: bold;">${formatDays(u.days_inactive)}</td>
        <td style="padding: 7px 6px; border: 1px solid #d1dfde; font-size: 11px;">${u.last_login ? formatTime(u.last_login) : `Never Login (Created: ${formatDate(u.created_at)})`}</td>
      </tr>
    `).join("");

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 12mm 12mm 12mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111817;
            margin: 0;
            padding: 16px;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            border-bottom: 2.5px solid #073B3F;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .brand {
            font-size: 11px;
            font-weight: 800;
            color: #073B3F;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .title {
            font-size: 22px;
            font-weight: 800;
            color: #073B3F;
            margin: 4px 0 3px 0;
          }
          .meta {
            font-size: 11px;
            color: #5C706E;
          }
          .summary-card {
            background: #EFF6F6;
            border: 1px solid #D1DFDE;
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 12px;
            color: #073B3F;
            margin-bottom: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            table-layout: fixed;
          }
          th {
            background-color: #073B3F !important;
            color: #ffffff !important;
            padding: 8px 6px;
            border: 1px solid #073B3F;
            font-weight: 700;
            font-size: 11.5px;
            text-align: left;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td {
            padding: 7px 6px;
            border: 1px solid #D1DFDE;
            font-size: 11.5px;
            vertical-align: middle;
            word-wrap: break-word;
          }
          tr:nth-child(even) td {
            background-color: #F8FBFB !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">ATHIRAI JEWELLERY — MANAGEMENT REPORT</div>
          <div class="title">${reportTitle}</div>
          <div class="meta">Generated: ${dateStr} • Scope: ${scopeLabel || "All Hierarchy"}</div>
        </div>
        <div class="summary-card">
          <strong>Total Inactive Users:</strong> ${filtered.length} &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Inactivity Period:</strong> ${INACTIVE_PERIOD_LABEL[periodFilter] || (periodFilter === "all" ? "All Time" : periodFilter === "never" ? "Never Logged In" : `${periodFilter} Inactive`)} &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Role Filter:</strong> ${roleFilter === "all" ? "All Roles" : (ROLE_DISPLAY[roleFilter] || roleFilter)}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">S.No</th>
              <th style="width: 6%; text-align: center;">Level</th>
              <th style="width: 16%;">Position</th>
              <th style="width: 15%;">User ID</th>
              <th style="width: 20%;">Name</th>
              <th style="width: 13%;">Phone No</th>
              <th style="width: 10%; text-align: center;">Days Inactive</th>
              <th style="width: 15%;">Last Login / Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 350);
    }
  };

  return (
    <>
      {viewerChrome ? (
        <InternalRoleNavbar roleTitle={viewerChrome.title} homePath={viewerChrome.home} />
      ) : (
        <SuperAdminNavbar />
      )}
      <div className="pil-page">
        <style>{`
          .pil-page {
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
          .pil-wrap {
            max-width: 1440px;
            margin: 0 auto;
            width: 100%;
          }
          .pil-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .pil-breadcrumb {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #5C706E;
          }
          .pil-breadcrumb-link {
            color: #073B3F;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
          }
          .pil-breadcrumb-link:hover {
            text-decoration: underline;
          }
          .pil-back-btn {
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
          .pil-back-btn:hover {
            background: #F0F5F5;
            border-color: #073B3F;
            transform: translateX(-2px);
          }
          .pil-header-card {
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
          .pil-header-info h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #073B3F;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .pil-header-badge {
            display: inline-flex;
            align-items: center;
            background: #FEF2F2;
            color: #991B1B;
            border: 1px solid #FCA5A5;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 11.5px;
            font-weight: 700;
          }
          .pil-scope-badge {
            display: inline-flex;
            align-items: center;
            background: rgba(7, 59, 63, 0.08);
            color: #073B3F;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 11.5px;
            font-weight: 700;
          }
          .pil-header-sub {
            margin: 4px 0 0;
            color: #5C706E;
            font-size: 13px;
          }
          .pil-header-actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .pil-btn-export {
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
          .pil-btn-export:hover:not(:disabled) {
            background: #0C4E53;
            transform: translateY(-1px);
          }
          .pil-btn-export:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }
          .pil-stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
            margin-bottom: 24px;
          }
          .pil-stat-card {
            background: #FFFFFF;
            border: 1px solid #E1EBEA;
            border-radius: 18px;
            padding: 20px 24px;
            box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
            position: relative;
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
            cursor: pointer;
            user-select: none;
          }
          .pil-stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 22px rgba(7, 59, 63, 0.08);
          }
          .pil-stat-card.pil-stat-selected {
            border-color: #073B3F;
            box-shadow: 0 0 0 2px rgba(7, 59, 63, 0.14), 0 8px 22px rgba(7, 59, 63, 0.08);
          }
          .pil-stat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .pil-stat-label {
            font-size: 11.5px;
            font-weight: 700;
            color: #5C706E;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .pil-stat-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pil-stat-val {
            font-size: 30px;
            font-weight: 800;
            color: #073B3F;
            line-height: 1;
            margin-bottom: 4px;
          }
          .pil-stat-sub {
            font-size: 12px;
            color: #7A8987;
            font-weight: 500;
          }
          .pil-controls-card {
            background: #FFFFFF;
            border: 1px solid #E1EBEA;
            border-radius: 16px;
            padding: 16px 20px;
            box-shadow: 0 2px 10px rgba(7, 59, 63, 0.02);
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 14px;
            flex-wrap: wrap;
          }
          .pil-search-wrap {
            min-width: 240px;
            width: 320px;
            max-width: 360px;
            position: relative;
          }
          .pil-search-input {
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
          .pil-search-input:focus {
            background: #FFFFFF;
            border-color: #073B3F;
            box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.08);
          }
          .pil-search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #7A8987;
            display: flex;
            align-items: center;
          }
          .pil-filter-pills {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
          }
          .pil-pill {
            padding: 7px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid #D6E2E1;
            background: #FFFFFF;
            color: #5C706E;
            cursor: pointer;
            transition: all 140ms ease;
          }
          .pil-pill:hover {
            border-color: #073B3F;
            color: #073B3F;
          }
          .pil-pill.active {
            background: #073B3F;
            color: #FFFFFF;
            border-color: #073B3F;
          }
          .pil-select {
            padding: 8px 12px;
            border-radius: 10px;
            border: 1px solid #D6E2E1;
            background: #F8FAFA;
            font-size: 12.5px;
            font-weight: 600;
            color: #073B3F;
            outline: none;
            cursor: pointer;
          }
          .pil-table-card {
            background: #FFFFFF;
            border: 1px solid #E1EBEA;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(7, 59, 63, 0.04);
            overflow: hidden;
          }
          .pil-table-header {
            padding: 16px 24px;
            border-bottom: 1px solid #E1EBEA;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #FAFBFB;
          }
          .pil-table-title {
            font-size: 14px;
            font-weight: 800;
            color: #073B3F;
          }
          .pil-table-scroll {
            overflow-x: auto;
          }
          .pil-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
            min-width: 880px;
          }
          .pil-table th {
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
          .pil-table td {
            padding: 14px 20px;
            border-bottom: 1px solid #EDF3F2;
            vertical-align: middle;
          }
          .pil-table tbody tr:hover {
            background: #F8FAFA;
          }
          .pil-id-badge {
            font-family: "SFMono-Regular", Consolas, Menlo, monospace;
            font-size: 12.5px;
            font-weight: 800;
            color: #073B3F;
            background: #EFF6F6;
            padding: 4px 10px;
            border-radius: 8px;
            border: 1px solid #D5E5E4;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 140ms ease;
          }
          .pil-id-badge:hover {
            background: #E2ECEB;
          }
          .pil-role-pill {
            display: inline-flex;
            align-items: center;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 11.5px;
            font-weight: 700;
            background: #EFF6F6;
            color: #0C4044;
            border: 1px solid #D5E5E4;
          }
          .pil-days-pill {
            display: inline-flex;
            align-items: center;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 11.5px;
            font-weight: 700;
            background: #FEF2F2;
            color: #991B1B;
            border: 1px solid #FCA5A5;
          }
          .pil-toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #073B3F;
            color: #FFFFFF;
            padding: 10px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
            font-size: 13px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 9999;
          }
          @media (max-width: 900px) {
            .pil-stats-grid { grid-template-columns: repeat(2, 1fr); }
            .pil-page { padding: 16px 14px 40px; }
          }
          @media (max-width: 600px) {
            .pil-stats-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="pil-wrap">
          {/* Header Card */}
          <div className="pil-header-card">
            <div className="pil-header-info">
              <h1>
                <span>Inactive Users</span>
                <span className="pil-header-badge">
                  {periodLabel} Inactivity
                </span>
                {scopeLabel && <span className="pil-scope-badge">{scopeLabel}</span>}
              </h1>
              <p className="pil-header-sub">
                Users with no login activity in the selected timeframe.
              </p>
            </div>
            <div className="pil-header-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="pil-btn-export"
                onClick={exportDocument}
                disabled={filtered.length === 0}
                title="Download formatted Word Document (.doc)"
              >
                <DownloadIcon size={15} color="#FFFFFF" /> Download Document
              </button>
              <button
                type="button"
                onClick={printDocument}
                disabled={filtered.length === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0 16px",
                  height: "40px",
                  borderRadius: "10px",
                  border: "1.5px solid #073B3F",
                  background: "#FFFFFF",
                  color: "#073B3F",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
                title="Print or Save as PDF Document"
              >
                🖨️ Print / PDF
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {/* Search & Filter Bar — moved above the 4 stat cards */}
          <div className="pil-controls-card">
            <div className="pil-search-wrap">
              <span className="pil-search-icon">
                <SearchIcon size={15} color="#7A8987" />
              </span>
              <input
                type="text"
                className="pil-search-input"
                placeholder="Search by ID, name, phone, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="pil-filter-pills">
              <select
                className="pil-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="Admin">Super Stockist</option>
                <option value="Dealer">Distributor</option>
                <option value="Sub Dealer">Wholesale Dealer</option>
                <option value="Promotor">Retailer</option>
                <option value="Customer">Customer</option>
              </select>

              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`pil-pill ${periodFilter === p.value ? "active" : ""}`}
                  onClick={() => setPeriodFilter(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Stat Cards */}
          <div className="pil-stats-grid">
            <div
              className={`pil-stat-card${selectedCard === "total" ? " pil-stat-selected" : ""}`}
              style={{ borderLeft: "4px solid #9F6130" }}
              onClick={handleTotalUsersCardClick}
              title="Show all registered users"
            >
              <div className="pil-stat-header">
                <span className="pil-stat-label">{roleCardTitle}</span>
                <div className="pil-stat-icon" style={{ background: "#FBF6F0", color: "#9F6130" }}>
                  <UsersIcon size={18} color="#9F6130" />
                </div>
              </div>
              <div className="pil-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : statGrandTotal}
              </div>
              <div className="pil-stat-sub">
                All registered {roleFilter === "all" ? "users" : (ROLE_DISPLAY[roleFilter] || "users").toLowerCase()}
              </div>
            </div>

            <div
              className={`pil-stat-card${selectedCard === "inactive" ? " pil-stat-selected" : ""}`}
              style={{ borderLeft: "4px solid #DC2626" }}
              onClick={handleInactiveCardClick}
              title="Show inactive users (logged in before, but not in this period)"
            >
              <div className="pil-stat-header">
                <span className="pil-stat-label">{inactiveCardTitle}</span>
                <div className="pil-stat-icon" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                  <UsersIcon size={18} color="#DC2626" />
                </div>
              </div>
              <div className="pil-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : statInactiveCount}
              </div>
              <div className="pil-stat-sub">Inactive in {periodLabel}</div>
            </div>

            <div
              className={`pil-stat-card${selectedCard === "never" ? " pil-stat-selected" : ""}`}
              style={{ borderLeft: "4px solid #CCA881" }}
              onClick={handleNeverCardClick}
              title="Show never logged in users"
            >
              <div className="pil-stat-header">
                <span className="pil-stat-label">Never Logged In</span>
                <div className="pil-stat-icon" style={{ background: "#FBF6F0", color: "#9F6130" }}>
                  <UserIcon size={18} color="#9F6130" />
                </div>
              </div>
              <div className="pil-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : statNeverCount}
              </div>
              <div className="pil-stat-sub">Zero logins recorded</div>
            </div>
          </div>

          {/* Luxury Table Card */}
          <div className="pil-table-card">
            <div className="pil-table-header">
              <span className="pil-table-title">Inactive User Records</span>
              <span style={{ fontSize: "12px", color: "#5C706E", fontWeight: 700 }}>
                Showing {filtered.length} of {totalCount} users
              </span>
            </div>

            <div className="pil-table-scroll">
              <table className="pil-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Level</th>
                    <th>Position</th>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Inactive Duration</th>
                    <th>Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skel-${i}`}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j}>
                            <SkeletonText width={j === 3 || j === 4 ? "80%" : "50%"} height="14px" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "48px 20px", color: "#7A8987" }}>
                        No inactive users found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u, i) => (
                      <tr key={u.id || i}>
                        <td style={{ color: "#7A8987", fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ fontWeight: 700, color: "#5C706E" }}>Level {u.level}</td>
                        <td>
                          <span className="pil-role-pill">{ROLE_DISPLAY[u.level_role] || u.level_role || "User"}</span>
                        </td>
                        <td>
                          <span
                            className="pil-id-badge"
                            onClick={() => handleCopy(u.id, `user-${u.id}`)}
                            title="Click to copy ID"
                          >
                            <span>{u.id || "—"}</span>
                            {copiedId === `user-${u.id}` ? (
                              <CheckIcon size={12} color="#137333" />
                            ) : (
                              <CopyIcon size={12} color="#7A8987" />
                            )}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: "#073B3F" }}>{u.name || "Unknown"}</td>
                        <td style={{ color: "#5C706E", fontWeight: 600 }}>{u.phone || "—"}</td>
                        <td>
                          <span className="pil-days-pill">{formatDays(u.days_inactive)}</span>
                        </td>
                        <td>
                          {u.last_login ? (
                            <span>{formatTime(u.last_login)}</span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ color: "#7A8987", fontSize: "12px", fontWeight: 700 }}>
                                Never Login
                              </span>
                              {u.created_at && (
                                <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>
                                  Created: {formatDate(u.created_at)}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}

                  {loadingMore &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`skel-more-${i}`}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j}>
                            <SkeletonText width="60%" height="12px" />
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {hasMore && !loadingMore && (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px", borderTop: "1px solid #E1EBEA" }}>
                <button
                  type="button"
                  style={{
                    background: "#073B3F",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 22px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onClick={loadMore}
                >
                  Load More ({data.length} of {totalCount})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="pil-toast">
            <CheckIcon size={14} color="#FFFFFF" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </>
  );
}