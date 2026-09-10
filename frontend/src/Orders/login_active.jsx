import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import SuperAdminNavbar from "../collection/SuperAdminNavbar";
import { SkeletonText } from "../components/Skeleton";
import {
  UsersIcon,
  OrdersIcon,
  UserIcon,
  SearchIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  ArrowLeftIcon,
  ClockIcon,
} from "../components/SvgIcons";

// role name → SalesCount page role slug
const ROLE_SLUG = {
  Admin: "admin",
  Dealer: "dealer",
  "Sub Dealer": "sub_dealer",
  Promotor: "promotor",
  Customer: "customer",
};

export default function LoginActive() {
  const navigate = useNavigate();
  const location = useLocation();
  const scopeIds = location.state?.ids || null;
  const scopeLabel = location.state?.scopeLabel || null;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
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
        // Default 50 items loaded initially
        const initialLimit = isAdminOnly ? 5000 : 50;

        const res = await api.get("/today-login-status/", {
          params: {
            role: roleFilter,
            list_type: "active",
            offset: 0,
            limit: initialLimit,
          },
        });
        let list = [...(res.data.active || [])];
        setTotalCount(res.data.total_count || 0);
        setOffset(initialLimit);
        setLimit(50);
        if (scopeIds) list = list.filter((u) => scopeIds.includes(u.id));
        const sorted = list.sort((a, b) => a.level - b.level);
        setData(sorted);
      } catch {
        setError("Failed to load active users.");
      }
      setLoading(false);
    };
    fetchData();
  }, [roleFilter]);

  const formatTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Client-side filtering for order count & search query
  const filtered = useMemo(() => {
    return data.filter((u) => {
      const oc = u.order_count ?? 0;
      if (orderFilter === "0" && oc !== 0) return false;
      if (orderFilter === "1-10" && !(oc >= 1 && oc <= 10)) return false;
      if (orderFilter === "11-20" && !(oc >= 11 && oc <= 20)) return false;
      if (orderFilter === "21+" && !(oc > 20)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const id = (u.id || "").toLowerCase();
        const name = (u.name || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        const role = (u.level_role || "").toLowerCase();
        if (!id.includes(q) && !name.includes(q) && !phone.includes(q) && !role.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [data, orderFilter, searchTerm]);

  const isAdminOnly = roleFilter === "Admin";
  const hasMore = !isAdminOnly && data.length < totalCount;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get("/today-login-status/", {
        params: { role: roleFilter, list_type: "active", offset, limit: 50 },
      });
      const newList = res.data.active || [];
      setData((prev) => [...prev, ...newList].sort((a, b) => a.level - b.level));
      setOffset((prev) => prev + 50);
      setLimit(50);
    } catch {
      setError("Failed to load more users.");
    }
    setLoadingMore(false);
  };

  const goToOrders = (u) => {
    const slug = ROLE_SLUG[u.level_role];
    if (!slug) return;
    navigate(`/hierarchy-sales-count?role=${slug}&id=${u.db_id}&period=today`);
  };

  // Summary Metrics
  const activeCount = totalCount || data.length;
  const usersWithOrders = data.filter((u) => (u.order_count || 0) > 0).length;
  const totalOrdersSum = data.reduce((sum, u) => sum + (Number(u.order_count) || 0), 0);
  const shownCount = filtered.length;

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["S.No", "Level", "Position", "User ID", "Name", "Phone No", "Orders", "Login Time"];
    const csvData = filtered.map((u, i) => [
      i + 1,
      `"${u.level || ""}"`,
      `"${u.level_role || ""}"`,
      `"${u.id || ""}"`,
      `"${(u.name || "").replace(/"/g, '""')}"`,
      `"${u.phone || ""}"`,
      u.order_count ?? 0,
      `"${formatTime(u.last_login)}"`,
    ]);

    const blob = new Blob(
      [[headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `active_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV exported");
  };

  return (
    <>
      <SuperAdminNavbar />
      <div className="psl-page">
        <style>{`
          .psl-page {
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
          .psl-wrap {
            max-width: 1440px;
            margin: 0 auto;
            width: 100%;
          }
          .psl-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .psl-breadcrumb {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #5C706E;
          }
          .psl-breadcrumb-link {
            color: #073B3F;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
          }
          .psl-breadcrumb-link:hover {
            text-decoration: underline;
          }
          .psl-back-btn {
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
          .psl-back-btn:hover {
            background: #F0F5F5;
            border-color: #073B3F;
            transform: translateX(-2px);
          }
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
          .psl-live-badge {
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
          .psl-live-dot {
            width: 8px;
            height: 8px;
            background: #137333;
            border-radius: 50%;
            animation: pslPulse 1.8s infinite;
          }
          @keyframes pslPulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(19, 115, 51, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(19, 115, 51, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(19, 115, 51, 0); }
          }
          .psl-scope-badge {
            display: inline-flex;
            align-items: center;
            background: rgba(7, 59, 63, 0.08);
            color: #073B3F;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 11.5px;
            font-weight: 700;
          }
          .psl-header-sub {
            margin: 4px 0 0;
            color: #5C706E;
            font-size: 13px;
          }
          .psl-header-actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .psl-btn-primary {
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
          .psl-btn-primary:hover:not(:disabled) {
            background: #0C4E53;
            transform: translateY(-1px);
          }
          .psl-btn-primary:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }
          .psl-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
            margin-bottom: 24px;
          }
          .psl-stat-card {
            background: #FFFFFF;
            border: 1px solid #E1EBEA;
            border-radius: 18px;
            padding: 20px 24px;
            box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
            position: relative;
            transition: transform 180ms ease;
          }
          .psl-stat-card:hover {
            transform: translateY(-2px);
          }
          .psl-stat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .psl-stat-label {
            font-size: 11.5px;
            font-weight: 700;
            color: #5C706E;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .psl-stat-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .psl-stat-val {
            font-size: 30px;
            font-weight: 800;
            color: #073B3F;
            line-height: 1;
            margin-bottom: 4px;
          }
          .psl-stat-sub {
            font-size: 12px;
            color: #7A8987;
            font-weight: 500;
          }
          .psl-controls-card {
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
          .psl-search-wrap {
            flex: 1;
            min-width: 260px;
            position: relative;
          }
          .psl-search-input {
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
          .psl-search-input:focus {
            background: #FFFFFF;
            border-color: #073B3F;
            box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.08);
          }
          .psl-search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #7A8987;
            display: flex;
            align-items: center;
          }
          .psl-filter-group {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .psl-select {
            padding: 9px 14px;
            border-radius: 10px;
            border: 1px solid #D6E2E1;
            background: #F8FAFA;
            font-size: 13px;
            font-weight: 600;
            color: #073B3F;
            outline: none;
            cursor: pointer;
          }
          .psl-select:focus {
            border-color: #073B3F;
          }
          .psl-table-card {
            background: #FFFFFF;
            border: 1px solid #E1EBEA;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(7, 59, 63, 0.04);
            overflow: hidden;
          }
          .psl-table-header {
            padding: 16px 24px;
            border-bottom: 1px solid #E1EBEA;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #FAFBFB;
          }
          .psl-table-title {
            font-size: 14px;
            font-weight: 800;
            color: #073B3F;
          }
          .psl-table-scroll {
            overflow-x: auto;
          }
          .psl-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
            min-width: 880px;
          }
          .psl-table th {
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
          .psl-table td {
            padding: 14px 20px;
            border-bottom: 1px solid #EDF3F2;
            vertical-align: middle;
          }
          .psl-table tbody tr:hover {
            background: #F8FAFA;
          }
          .psl-id-badge {
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
          .psl-id-badge:hover {
            background: #E2ECEB;
          }
          .psl-role-pill {
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
          .psl-order-btn {
            background: #073B3F;
            color: #FFFFFF;
            border: none;
            border-radius: 8px;
            padding: 5px 12px;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            transition: all 160ms ease;
          }
          .psl-order-btn:hover {
            background: #0C4E53;
          }
          .psl-time-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #073B3F;
            font-weight: 600;
            font-size: 12px;
          }
          .psl-toast {
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
            .psl-stats-grid { grid-template-columns: repeat(2, 1fr); }
            .psl-page { padding: 16px 14px 40px; }
          }
          @media (max-width: 600px) {
            .psl-stats-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="psl-wrap">
          {/* Topbar */}
          <div className="psl-topbar">
            <button className="psl-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeftIcon size={14} color="#073B3F" /> Back
            </button>
          </div>

          {/* Header Card */}
          <div className="psl-header-card">
            <div className="psl-header-info">
              <h1>
                <span>Active Users Today</span>
                <span className="psl-live-badge">
                  <span className="psl-live-dot" /> Live Active
                </span>
                {scopeLabel && <span className="psl-scope-badge">{scopeLabel}</span>}
              </h1>
              <p className="psl-header-sub">
                Live sessions across internal hierarchy levels.
              </p>
            </div>
            <div className="psl-header-actions">
              <button
                type="button"
                className="psl-btn-primary"
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
          <div className="psl-stats-grid">
            <div className="psl-stat-card" style={{ borderLeft: "4px solid #073B3F" }}>
              <div className="psl-stat-header">
                <span className="psl-stat-label">Total Active</span>
                <div className="psl-stat-icon" style={{ background: "#EFF6F6", color: "#073B3F" }}>
                  <UsersIcon size={18} color="#073B3F" />
                </div>
              </div>
              <div className="psl-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : activeCount}
              </div>
              <div className="psl-stat-sub">Logged in today</div>
            </div>

            <div className="psl-stat-card" style={{ borderLeft: "4px solid #CCA881" }}>
              <div className="psl-stat-header">
                <span className="psl-stat-label">Users With Orders</span>
                <div className="psl-stat-icon" style={{ background: "#FBF6F0", color: "#9F6130" }}>
                  <UserIcon size={18} color="#9F6130" />
                </div>
              </div>
              <div className="psl-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : usersWithOrders}
              </div>
              <div className="psl-stat-sub">Active shoppers</div>
            </div>

            <div className="psl-stat-card" style={{ borderLeft: "4px solid #166534" }}>
              <div className="psl-stat-header">
                <span className="psl-stat-label">Total Orders Today</span>
                <div className="psl-stat-icon" style={{ background: "#F0FDF4", color: "#166534" }}>
                  <OrdersIcon size={18} color="#166534" />
                </div>
              </div>
              <div className="psl-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : totalOrdersSum}
              </div>
              <div className="psl-stat-sub">Orders registered</div>
            </div>

            <div className="psl-stat-card" style={{ borderLeft: "4px solid #6366F1" }}>
              <div className="psl-stat-header">
                <span className="psl-stat-label">Showing Records</span>
                <div className="psl-stat-icon" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                  <ClockIcon size={18} color="#4F46E5" />
                </div>
              </div>
              <div className="psl-stat-val">
                {loading ? <SkeletonText width="60px" height="30px" /> : shownCount}
              </div>
              <div className="psl-stat-sub">{filtered.length} of {totalCount} matching</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="psl-controls-card">
            <div className="psl-search-wrap">
              <span className="psl-search-icon">
                <SearchIcon size={15} color="#7A8987" />
              </span>
              <input
                type="text"
                className="psl-search-input"
                placeholder="Search by ID, name, phone, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="psl-filter-group">
              <select
                className="psl-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Dealer">Distributor (Dealer)</option>
                <option value="Sub Dealer">Wholesale Dealer (Sub Dealer)</option>
                <option value="Promotor">Retailer (Promotor)</option>
                <option value="Customer">Customer</option>
              </select>

              <select
                className="psl-select"
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
              >
                <option value="all">All Orders</option>
                <option value="0">0 Orders</option>
                <option value="1-10">1 – 10 Orders</option>
                <option value="11-20">11 – 20 Orders</option>
                <option value="21+">21+ Orders</option>
              </select>
            </div>
          </div>

          {/* Luxury Table Card */}
          <div className="psl-table-card">
            <div className="psl-table-header">
              <span className="psl-table-title">Active User Records</span>
              <span style={{ fontSize: "12px", color: "#5C706E", fontWeight: 700 }}>
                Showing {filtered.length} of {totalCount} users
              </span>
            </div>

            <div className="psl-table-scroll">
              <table className="psl-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Level</th>
                    <th>Position</th>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Login Time</th>
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
                        No active users found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u, i) => (
                      <tr key={u.id || i}>
                        <td style={{ color: "#7A8987", fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ fontWeight: 700, color: "#5C706E" }}>Level {u.level}</td>
                        <td>
                          <span className="psl-role-pill">{u.level_role || "User"}</span>
                        </td>
                        <td>
                          <span
                            className="psl-id-badge"
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
                          <button
                            type="button"
                            className="psl-order-btn"
                            onClick={() => goToOrders(u)}
                          >
                            {u.order_count ?? 0} Orders
                          </button>
                        </td>
                        <td>
                          <span className="psl-time-tag">
                            <span className="psl-live-dot" style={{ width: "6px", height: "6px" }} />
                            {formatTime(u.last_login)}
                          </span>
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

            {/* Load More Button: Only shown if 50+ total and more items exist */}
            {hasMore && !loadingMore && (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px", borderTop: "1px solid #E1EBEA" }}>
                <button type="button" className="psl-btn-primary" onClick={loadMore}>
                  Load More ({data.length} of {totalCount})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="psl-toast">
            <CheckIcon size={14} color="#FFFFFF" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </>
  );
}