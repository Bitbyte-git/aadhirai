import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import SuperAdminNavbar from "../collection/SuperAdminNavbar";
import { SkeletonText } from "../components/Skeleton";
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
  const scopeIds = location.state?.ids || null;
  const scopeLabel = location.state?.scopeLabel || null;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [periodFilter, setPeriodFilter] = useState("today");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
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
            offset: 0,
            limit: initialLimit,
          },
        });
        let list = [...(res.data.inactive || [])];
        setTotalCount(res.data.total_count || 0);
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
  }, [periodFilter, roleFilter]);

  const formatTime = (iso) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDays = (days) => {
    if (days === null || days === undefined) return "—";
    if (days === 0) return "Today";
    return `${days}d`;
  };

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === periodFilter)?.label || "Today";

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
        params: { period: periodFilter, role: roleFilter, offset, limit: 50 },
      });
      const newList = res.data.inactive || [];
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

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["S.No", "Level", "Position", "User ID", "Name", "Phone No", "Days Inactive", "Last Login"];
    const csvData = filtered.map((u, i) => [
      i + 1,
      `"${u.level || ""}"`,
      `"${u.level_role || ""}"`,
      `"${u.id || ""}"`,
      `"${(u.name || "").replace(/"/g, '""')}"`,
      `"${u.phone || ""}"`,
      formatDays(u.days_inactive),
      `"${formatTime(u.last_login)}"`,
    ]);

    const blob = new Blob(
      [[headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inactive_users_${periodFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV exported");
  };

  return (
    <>
      <SuperAdminNavbar />
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
            grid-template-columns: repeat(4, 1fr);
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
            transition: transform 180ms ease;
          }
          .pil-stat-card:hover {
            transform: translateY(-2px);
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
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
          }
          .pil-search-wrap {
            flex: 1;
            min-width: 260px;
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
          {/* Topbar */}
          <div className="pil-topbar">
            <button className="pil-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeftIcon size={14} color="#073B3F" /> Back
            </button>
          </div>

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
            <div className="pil-header-actions">
              <button
                type="button"
                className="pil-btn-export"
                onClick={exportCSV}
                disabled={filtered.length === 0}
              >
                <DownloadIcon size={15} color="#FFFFFF" /> Export CSV
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {/* 4 Stat Cards */}
          <div className="pil-stats-grid">
            <div className="pil-stat-card" style={{ borderLeft: "4px solid #DC2626" }}>
              <div className="pil-stat-header">
                <span className="pil-stat-label">Total Inactive</span>
                <div className="pil-stat-icon" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                  <UsersIcon size={18} color="#DC2626" />
                </div>
              </div>
              <div className="pil-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : inactiveCount}
              </div>
              <div className="pil-stat-sub">Across {periodLabel}</div>
            </div>

            <div className="pil-stat-card" style={{ borderLeft: "4px solid #CCA881" }}>
              <div className="pil-stat-header">
                <span className="pil-stat-label">Never Logged In</span>
                <div className="pil-stat-icon" style={{ background: "#FBF6F0", color: "#9F6130" }}>
                  <UserIcon size={18} color="#9F6130" />
                </div>
              </div>
              <div className="pil-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : neverLoggedIn}
              </div>
              <div className="pil-stat-sub">Zero logins recorded</div>
            </div>

            <div className="pil-stat-card" style={{ borderLeft: "4px solid #073B3F" }}>
              <div className="pil-stat-header">
                <span className="pil-stat-label">Inactive Admins</span>
                <div className="pil-stat-icon" style={{ background: "#EFF6F6", color: "#073B3F" }}>
                  <UsersIcon size={18} color="#073B3F" />
                </div>
              </div>
              <div className="pil-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : adminInactive}
              </div>
              <div className="pil-stat-sub">Admin accounts idle</div>
            </div>

            <div className="pil-stat-card" style={{ borderLeft: "4px solid #6366F1" }}>
              <div className="pil-stat-header">
                <span className="pil-stat-label">Showing Records</span>
                <div className="pil-stat-icon" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                  <ClockIcon size={18} color="#4F46E5" />
                </div>
              </div>
              <div className="pil-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : shownCount}
              </div>
              <div className="pil-stat-sub">{filtered.length} of {totalCount} matching</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
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

              <select
                className="pil-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Dealer">Distributor (Dealer)</option>
                <option value="Sub Dealer">Wholesale Dealer</option>
                <option value="Promotor">Retailer</option>
                <option value="Customer">Customer</option>
              </select>
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
                          <span className="pil-role-pill">{u.level_role || "User"}</span>
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
                        <td style={{ color: "#5C706E", fontSize: "12.5px" }}>
                          {formatTime(u.last_login)}
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