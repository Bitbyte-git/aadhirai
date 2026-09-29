import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { SkeletonText } from "../components/Skeleton";
import CoinTabs from "./CoinTabs";
import {
  InboxIcon,
  CoinIcon,
  UsersIcon,
  HistoryIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  CalendarIcon,
  PhoneIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  SparkleIcon,
} from "../components/SvgIcons";

const COIN_METAL_LABELS_TEXT = {
  gold_22k: "Gold 22K (916)",
  gold_24k: "Gold 24K (999)",
  silver_999: "Silver 999",
};

const ROLE_DISPLAY = {
  super_admin: "Super Admin",
  admin: "Super Stockist",
  dealer: "Distributor",
  sub_dealer: "Wholesale Dealer",
  promotor: "Retailer",
  customer: "Customer",
  shop: "Shop",
};

const PAGE_SIZE = 20;

const PERIOD_OPTIONS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

// Role filter pills — ovvoru role-kum avanga KEEZHA irukura roles mattum (Super Admin-ku ellaamey + Shop)
const ROLE_CHAIN = ["admin", "dealer", "sub_dealer", "promotor"];
const leaderRoleOptionsFor = (role) => {
  let keys;
  if (role === "super_admin") keys = [...ROLE_CHAIN, "shop"];
  else if (role === "shop") keys = ["shop"];
  else keys = ROLE_CHAIN.slice(ROLE_CHAIN.indexOf(role) + 1);
  return [{ key: "all", label: "All" }, ...keys.map((k) => ({ key: k, label: ROLE_DISPLAY[k] }))];
};

export default function CoinRequests() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState("all");
  const [activeCard, setActiveCard] = useState("my_requests");
  const [leaderRoleFilter, setLeaderRoleFilter] = useState("all");

  // ── Server-driven board: counts full DB-la, list 20-20-a infinite scroll ──
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ my_requests: 0, my_approved: 0, leader_approved: 0, leader_pending: 0 });
  const [roleCounts, setRoleCounts] = useState({});
  const [approvableCount, setApprovableCount] = useState(0);
  const [listTotal, setListTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const reqIdRef = useRef(0);
  const nextOffsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef(null);

  const [approvingReqId, setApprovingReqId] = useState(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [rejectingReqId, setRejectingReqId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // User identity
  const currentRole = localStorage.getItem("role") || "";
  const currentUserId = Number(localStorage.getItem("user_id") || localStorage.getItem("id") || 0);
  const currentUserEmail = localStorage.getItem("email") || "";
  const isSuperAdmin = currentRole === "super_admin";
  const LEADER_ROLE_OPTIONS = useMemo(() => leaderRoleOptionsFor(currentRole), [currentRole]);

  // Super Admin Password Modal States
  const [authModal, setAuthModal] = useState({
    open: false,
    actionType: null, // "approve" | "reject" | "approve_all"
    reqId: null,
    reason: "",
    title: "",
    description: "",
  });
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setMsgType("success");
    setMsg(`Copied ${text}`);
    setTimeout(() => {
      setCopiedId(null);
      setMsg("");
    }, 2200);
  };

  const boardParams = (offset) => ({
    box: "board", view: "requests", card: activeCard, period,
    role: leaderRoleFilter, offset, limit: PAGE_SIZE,
  });

  // Card / period / role maarinaa (illa approve/decline aanaa) first page + full counts thirumba edukkum
  useEffect(() => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError("");
    setHasMore(false);
    loadingMoreRef.current = false;
    setLoadingMore(false);
    api.get("/coin-requests/", { params: boardParams(0) })
      .then((res) => {
        if (reqId !== reqIdRef.current) return;
        const d = res.data || {};
        setItems(d.items || []);
        setCounts(d.counts || {});
        setRoleCounts(d.role_counts || {});
        setApprovableCount(d.approvable_count || 0);
        setListTotal(d.list_total || 0);
        setHasMore(!!d.has_more);
        nextOffsetRef.current = (d.items || []).length;
      })
      .catch(() => { if (reqId === reqIdRef.current) setError("Failed to load coin requests."); })
      .finally(() => { if (reqId === reqIdRef.current) setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCard, period, leaderRoleFilter, refreshKey]);

  const fetchCoinRequests = () => setRefreshKey((k) => k + 1);

  const loadMore = () => {
    if (loadingMoreRef.current) return;
    const reqId = reqIdRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    api.get("/coin-requests/", { params: boardParams(nextOffsetRef.current) })
      .then((res) => {
        if (reqId !== reqIdRef.current) return;
        const newItems = res.data?.items || [];
        setItems((prev) => [...prev, ...newItems]);
        nextOffsetRef.current += newItems.length;
        setHasMore(!!res.data?.has_more && newItems.length > 0);
      })
      .catch(() => { if (reqId === reqIdRef.current) setHasMore(false); })
      .finally(() => {
        if (reqId !== reqIdRef.current) return;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  };
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  // Bottom-ku 500px munnadiye adutha 20 fetch — wait panna vendaam
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return undefined;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMoreRef.current();
    }, { rootMargin: "500px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, items.length]);

  // Execution functions
  const executeApprove = async (reqId, password = null) => {
    setApprovingReqId(reqId);
    setMsg("");
    try {
      const payload = password ? { password } : {};
      await api.post(`/coin-requests/${reqId}/approve/`, payload);
      setMsgType("success");
      setMsg(`Request #${reqId} approved successfully.`);
      fetchCoinRequests();
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to approve request.";
      setMsgType("error");
      setMsg(errMsg);
      throw new Error(errMsg);
    } finally {
      setApprovingReqId(null);
    }
  };

  const executeReject = async (reqId, reason, password = null) => {
    setRejectSubmitting(true);
    setMsg("");
    try {
      const payload = { message: reason };
      if (password) payload.password = password;
      await api.post(`/coin-requests/${reqId}/reject/`, payload);
      setMsgType("success");
      setMsg(`Request #${reqId} declined.`);
      setRejectingReqId(null);
      setRejectReason("");
      fetchCoinRequests();
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to decline request.";
      setMsgType("error");
      setMsg(errMsg);
      throw new Error(errMsg);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const executeApproveAll = async (password = null) => {
    setApprovingAll(true);
    setMsg("");
    try {
      const payload = password ? { password } : {};
      await api.post("/coin-requests/approve-all/", payload);
      setMsgType("success");
      setMsg("All requests approved successfully.");
      fetchCoinRequests();
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to approve requests.";
      setMsgType("error");
      setMsg(errMsg);
      throw new Error(errMsg);
    } finally {
      setApprovingAll(false);
    }
  };

  // Button triggers
  const handleApproveClick = (req) => {
    if (isSuperAdmin) {
      setAuthModal({
        open: true,
        actionType: "approve",
        reqId: req.id,
        title: "Authorize Coin Approval",
        description: `Please enter your Super Admin password to confirm approval for Request #${req.id} (${req.requested_by_name || req.requested_by_id_str}).`,
      });
      setAuthPassword("");
      setAuthError("");
    } else {
      executeApprove(req.id);
    }
  };

  const handleDeclineClick = (reqId) => {
    if (!rejectReason.trim()) {
      setMsgType("error");
      setMsg("Please enter a reason for declining.");
      return;
    }
    if (isSuperAdmin) {
      setAuthModal({
        open: true,
        actionType: "reject",
        reqId: reqId,
        reason: rejectReason.trim(),
        title: "Authorize Coin Decline",
        description: `Please enter your Super Admin password to decline Request #${reqId}.`,
      });
      setAuthPassword("");
      setAuthError("");
    } else {
      executeReject(reqId, rejectReason.trim());
    }
  };

  const handleApproveAllClick = () => {
    if (pendingToApprove.length === 0) return;
    if (isSuperAdmin) {
      setAuthModal({
        open: true,
        actionType: "approve_all",
        title: "Authorize Batch Approval",
        description: `Please enter your Super Admin password to approve all ${pendingToApprove.length} pending coin requests.`,
      });
      setAuthPassword("");
      setAuthError("");
    } else {
      executeApproveAll();
    }
  };

  // Handle Auth Modal Submit
  const handleAuthSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!authPassword.trim()) {
      setAuthError("Super Admin password is required.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      if (authModal.actionType === "approve") {
        await executeApprove(authModal.reqId, authPassword.trim());
      } else if (authModal.actionType === "reject") {
        await executeReject(authModal.reqId, authModal.reason, authPassword.trim());
      } else if (authModal.actionType === "approve_all") {
        await executeApproveAll(authPassword.trim());
      }
      setAuthModal({ open: false, actionType: null, reqId: null, reason: "", title: "", description: "" });
      setAuthPassword("");
    } catch (err) {
      setAuthError(err.message || "Authorization failed. Please check your password.");
    } finally {
      setAuthLoading(false);
    }
  };

  const closeAuthModal = () => {
    if (authLoading) return;
    setAuthModal({ open: false, actionType: null, reqId: null, reason: "", title: "", description: "" });
    setAuthPassword("");
    setAuthError("");
  };

  // Days Pending / Duration calculation helper
  const getDaysPendingInfo = (createdAt, status, sentAt) => {
    if (!createdAt) return { text: "0 days", label: "0 days", badgeClass: "normal", days: 0 };
    const start = new Date(createdAt);
    const end = status === "sent" && sentAt ? new Date(sentAt) : new Date();
    const diffMs = Math.max(0, end - start);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    let timeStr = "";
    if (diffDays === 0) {
      timeStr = diffHours <= 1 ? "< 1 hr" : `${diffHours} hrs`;
    } else if (diffDays === 1) {
      timeStr = "1 day";
    } else {
      timeStr = `${diffDays} days`;
    }

    if (status === "pending") {
      let badgeClass = "normal";
      let icon = "⏳";
      if (diffDays >= 5) {
        badgeClass = "overdue";
        icon = "🚨";
      } else if (diffDays >= 2) {
        badgeClass = "delayed";
        icon = "⚠️";
      }
      return {
        days: diffDays,
        text: `${timeStr} pending`,
        label: `${icon} ${timeStr} Pending`,
        badgeClass,
      };
    } else if (status === "sent") {
      return {
        days: diffDays,
        text: `Approved in ${timeStr}`,
        label: `⚡ Approved in ${timeStr}`,
        badgeClass: "approved",
      };
    } else {
      return {
        days: diffDays,
        text: `Declined in ${timeStr}`,
        label: `Declined in ${timeStr}`,
        badgeClass: "rejected",
      };
    }
  };

  // ── 4 cards — counts ellaamey backend full-DB count (team scope-oda) ──
  // Leader cards = en KEEZHA irukura team-kulla nadandhadhu + en sondha request (highlight)
  const cardList = [
    {
      id: "my_requests",
      label: isSuperAdmin ? "Requests" : "My Requests",
      sub: isSuperAdmin ? "All pending received requests" : "Pending from downline",
      val: counts.my_requests || 0,
      border: "#073B3F",
      iconBg: "#EFF6F6",
      iconColor: "#073B3F",
      IconComponent: InboxIcon,
    },
    {
      id: "my_approved",
      label: "My Approved Requests",
      sub: isSuperAdmin ? "Approved by Super Admin" : "Approved by me",
      val: counts.my_approved || 0,
      border: "#166534",
      iconBg: "#E6F4EA",
      iconColor: "#166534",
      IconComponent: CheckIcon,
    },
    {
      id: "leader_approved",
      label: "Leader Approved Requests",
      sub: isSuperAdmin ? "Approved by team leaders" : "Approved within my team",
      val: counts.leader_approved || 0,
      border: "#2563EB",
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
      IconComponent: UsersIcon,
    },
    {
      id: "leader_pending",
      label: "Leader Pending Requests",
      sub: isSuperAdmin ? "Pending with team leaders" : "Pending within my team",
      val: counts.leader_pending || 0,
      border: "#7C3AED",
      iconBg: "#F5F3FF",
      iconColor: "#7C3AED",
      IconComponent: HistoryIcon,
    },
  ];

  const getLeaderRoleCount = (roleKey) => roleCounts[roleKey] || 0;
  const filteredRequests = items;
  // Approve All — enakku approve panna vendiya ellaa pending (backend count)
  const pendingToApprove = { length: approvableCount };

  const currentCardMeta = cardList.find((c) => c.id === activeCard) || cardList[0];

  return (
    <div className="cr-root">
      <style>{`
        .cr-root {
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

        .cr-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }

        .cr-header-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 22px 28px;
          box-shadow: 0 4px 20px rgba(7, 59, 63, 0.04);
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .cr-header-info h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cr-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #EFF6F6;
          color: #073B3F;
          border: 1px solid #CEE3E1;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
        }

        .cr-header-sub {
          margin: 4px 0 0;
          color: #5C706E;
          font-size: 13px;
        }

        .cr-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cr-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
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

        .cr-btn-primary:hover:not(:disabled) {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        .cr-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Period Filter Bar */
        .cr-period-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 10px 18px;
          margin-bottom: 20px;
          gap: 14px;
          flex-wrap: wrap;
          box-shadow: 0 2px 10px rgba(7, 59, 63, 0.02);
        }

        .cr-period-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cr-period-pill {
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 700;
          border: 1px solid #D6E2E1;
          background: #FFFFFF;
          color: #5C706E;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .cr-period-pill:hover {
          border-color: #073B3F;
          color: #073B3F;
        }

        .cr-period-pill.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 3px 10px rgba(7, 59, 63, 0.18);
        }

        /* Leader Role Sub-Filter Bar */
        .cr-role-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 10px 18px;
          margin-bottom: 20px;
          gap: 14px;
          flex-wrap: wrap;
          box-shadow: 0 2px 10px rgba(7, 59, 63, 0.02);
        }

        .cr-role-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cr-role-pill {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #D6E2E1;
          background: #FFFFFF;
          color: #5C706E;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 150ms ease;
        }

        .cr-role-pill:hover {
          border-color: #073B3F;
          color: #073B3F;
        }

        .cr-role-pill.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 3px 10px rgba(7, 59, 63, 0.18);
        }

        .cr-role-count {
          font-size: 10.5px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.06);
        }

        .cr-role-pill.active .cr-role-count {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
        }

        /* 4 Responsive Filterable Stat Cards */
        .cr-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .cr-stat-card {
          background: #FFFFFF;
          border: 1.5px solid #E1EBEA;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.03);
          transition: all 180ms ease;
          cursor: pointer;
          position: relative;
          user-select: none;
        }

        .cr-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.09);
        }

        .cr-stat-card.active {
          border-color: #073B3F !important;
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.14);
          background: #F8FBFB;
        }

        .cr-stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .cr-stat-label {
          font-size: 11px;
          font-weight: 800;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cr-stat-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cr-stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
          margin-bottom: 4px;
        }

        .cr-stat-sub {
          font-size: 11.5px;
          color: #7A8987;
          font-weight: 600;
        }

        .cr-alert {
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .cr-alert.success {
          background: #E6F4EA;
          border: 1px solid #CEEAD6;
          color: #137333;
        }

        .cr-alert.error {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
        }

        .cr-list-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cr-req-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 22px 26px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.04);
          transition: all 180ms ease;
        }

        /* En sondha request / Super Admin (leader) approve pannadhu — gold highlight */
        .cr-req-card.cr-req-highlight {
          border: 1.5px solid #BB8958;
          background: linear-gradient(135deg, #FFFCF7 0%, #FFFFFF 60%);
          box-shadow: 0 0 0 3px rgba(187, 137, 88, 0.12), 0 8px 22px rgba(187, 137, 88, 0.12);
        }
        .cr-highlight-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(187, 137, 88, 0.14);
          border: 1px solid rgba(187, 137, 88, 0.45);
          color: #8A5A2B;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .cr-req-card:hover {
          border-color: #073B3F;
          box-shadow: 0 6px 24px rgba(7, 59, 63, 0.08);
        }

        .cr-req-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #EDF3F2;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .cr-req-main-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 280px;
        }

        .cr-req-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cr-id-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: "SFMono-Regular", Consolas, Menlo, monospace;
          font-size: 12.5px;
          font-weight: 800;
          color: #073B3F;
          background: #EFF6F6;
          border: 1px solid #D1DFDE;
          padding: 4px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .cr-id-badge:hover {
          background: #E2ECEB;
          border-color: #073B3F;
        }

        .cr-requester-name {
          font-weight: 800;
          color: #111817;
          font-size: 15px;
          letter-spacing: -0.01em;
        }

        .cr-role-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          background: #EFF6F6;
          color: #073B3F;
          border: 1px solid #CEE3E1;
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.02em;
        }

        .cr-contact-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 12.5px;
          color: #4A5D5B;
        }

        .cr-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          color: #4A5D5B;
        }

        .cr-approver-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #F7FAFA;
          border: 1px solid #DCE6E5;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12.5px;
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .cr-approver-tag {
          color: #64748B;
          font-weight: 700;
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cr-approver-name {
          color: #073B3F;
          font-weight: 800;
        }

        .cr-approver-role {
          font-size: 11px;
          font-weight: 700;
          background: #EDF2F7;
          color: #4A5568;
          padding: 2px 7px;
          border-radius: 6px;
          text-transform: capitalize;
        }

        .cr-approver-id {
          font-family: "SFMono-Regular", Consolas, Menlo, monospace;
          color: #5C706E;
          font-size: 11.5px;
        }

        .cr-approver-phone {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #073B3F;
          font-weight: 600;
          font-size: 12px;
        }

        .cr-days-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.02em;
        }

        .cr-days-pill.normal {
          background: #EFF6F6;
          color: #073B3F;
          border: 1px solid #CEE3E1;
        }

        .cr-days-pill.delayed {
          background: #FFFBEB;
          color: #B45309;
          border: 1px solid #FDE68A;
        }

        .cr-days-pill.overdue {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .cr-days-pill.approved {
          background: #ECFDF5;
          color: #047857;
          border: 1px solid #A7F3D0;
        }

        .cr-days-pill.rejected {
          background: #F8FAFC;
          color: #64748B;
          border: 1px solid #E2E8F0;
        }

        .cr-req-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cr-btn-approve {
          background: #073B3F;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.15);
          transition: all 180ms ease;
        }

        .cr-btn-approve:hover:not(:disabled) {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        .cr-btn-approve:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cr-btn-reject {
          background: #FFF5F5;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 180ms ease;
        }

        .cr-btn-reject:hover {
          background: #DC2626;
          color: #FFFFFF;
          border-color: #DC2626;
        }

        .cr-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px;
        }

        .cr-item-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F8FAFA;
          border: 1px solid #E1EBEA;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
        }

        .cr-reject-panel {
          margin-top: 14px;
          padding: 16px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 14px;
        }

        .cr-reject-textarea {
          width: 100%;
          min-height: 70px;
          background: #FFFFFF;
          border: 1px solid #FCA5A5;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
        }

        .cr-reject-textarea:focus {
          border-color: #DC2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        /* Super Admin Password Verification Modal */
        .cr-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(7, 30, 32, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .cr-modal-card {
          background: #FFFFFF;
          border: 1px solid #D6E4E3;
          border-radius: 22px;
          box-shadow: 0 24px 60px rgba(7, 59, 63, 0.28);
          max-width: 480px;
          width: 100%;
          padding: 30px;
          box-sizing: border-box;
          animation: crScaleIn 200ms ease-out;
        }

        @keyframes crScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .cr-modal-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .cr-modal-icon-wrap {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: #EFF7F6;
          border: 1px solid #D1E5E4;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #073B3F;
          flex-shrink: 0;
        }

        .cr-modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #073B3F;
        }

        .cr-modal-desc {
          margin: 0 0 20px;
          font-size: 13.5px;
          color: #5C706E;
          line-height: 1.5;
        }

        .cr-modal-input-wrap {
          position: relative;
          margin-bottom: 14px;
        }

        .cr-modal-input {
          width: 100%;
          padding: 12px 42px 12px 14px;
          background: #F8FAFA;
          border: 1.5px solid #D6E2E1;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: all 180ms ease;
        }

        .cr-modal-input:focus {
          border-color: #073B3F;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.1);
        }

        .cr-modal-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #7A8987;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .cr-modal-err {
          color: #DC2626;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .cr-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .cr-modal-btn-cancel {
          padding: 10px 18px;
          border: 1px solid #D6E2E1;
          background: #FFFFFF;
          border-radius: 10px;
          color: #5C706E;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        .cr-modal-btn-submit {
          padding: 10px 20px;
          border: none;
          background: #073B3F;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .cr-root {
            padding: 16px 16px 48px;
          }
          .cr-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="cr-shell">
        {/* Navigation Tabs Switcher */}
        <CoinTabs activeTab="Requests Coins" />

        {/* Executive Header Card */}
        <div className="cr-header-card">
          <div className="cr-header-info">
            <h1>
              <span>Requests Coins</span>
              <span className="cr-badge">{pendingToApprove.length} Pending Approval</span>
            </h1>
            <p className="cr-header-sub">
              {isSuperAdmin
                ? "Oversee and authorize coin requests across team hierarchy."
                : "Manage incoming requests from downline and track your requests to your leader."}
            </p>
          </div>
          <div className="cr-header-actions">
            {pendingToApprove.length > 0 && (
              <button
                className="cr-btn-primary"
                disabled={approvingAll}
                onClick={handleApproveAllClick}
              >
                <CheckIcon size={15} color="#FFFFFF" />
                {approvingAll ? "Approving..." : `Approve All (${pendingToApprove.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {msg && (
          <div className={`cr-alert ${msgType}`}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {msgType === "success" ? <CheckIcon size={14} color="#137333" /> : <CloseIcon size={14} color="#991B1B" />}
              <span>{msg}</span>
            </span>
            <button onClick={() => setMsg("")} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <CloseIcon size={14} color="currentColor" />
            </button>
          </div>
        )}

        {/* Period Filter Bar */}
        <div className="cr-period-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarIcon size={16} color="#073B3F" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#073B3F" }}>Filter by Period:</span>
          </div>
          <div className="cr-period-pills">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`cr-period-pill ${period === p.key ? "active" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Filterable Interactive Stat Cards */}
        <div className="cr-stats-grid">
          {cardList.map((card) => {
            const isSelected = activeCard === card.id;
            const Icon = card.IconComponent;
            return (
              <div
                key={card.id}
                className={`cr-stat-card ${isSelected ? "active" : ""}`}
                style={{
                  borderLeft: `4px solid ${card.border}`,
                  borderColor: isSelected ? "#073B3F" : undefined,
                  background: isSelected ? "#F8FBFB" : "#FFFFFF",
                }}
                onClick={() => setActiveCard(card.id)}
                title={`Click to view ${card.label}`}
              >
                <div className="cr-stat-header">
                  <span className="cr-stat-label">{card.label}</span>
                  <div className="cr-stat-icon" style={{ background: card.iconBg, color: card.iconColor }}>
                    <Icon size={17} color={card.iconColor} />
                  </div>
                </div>
                <div className="cr-stat-value">
                  {loading ? <SkeletonText width="45px" height="28px" /> : card.val}
                </div>
                <div className="cr-stat-sub">{card.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Leader Role Sub-Filter Bar (Shown for Leader Approved and Leader Pending requests) */}
        {(activeCard === "leader_approved" || activeCard === "leader_pending") && (
          <div className="cr-role-filter-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UsersIcon size={16} color="#073B3F" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#073B3F" }}>Filter by Role:</span>
            </div>
            <div className="cr-role-pills">
              {LEADER_ROLE_OPTIONS.map((opt) => {
                const isSelected = leaderRoleFilter === opt.key;
                const count = getLeaderRoleCount(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={`cr-role-pill ${isSelected ? "active" : ""}`}
                    onClick={() => setLeaderRoleFilter(opt.key)}
                  >
                    <span>{opt.label}</span>
                    <span className="cr-role-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: "0", fontSize: "17px", fontWeight: 800, color: "#073B3F" }}>
              {currentCardMeta.label}
              {(activeCard === "leader_approved" || activeCard === "leader_pending") && leaderRoleFilter !== "all" && (
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0A5C63", marginLeft: "8px" }}>
                  — {LEADER_ROLE_OPTIONS.find((o) => o.key === leaderRoleFilter)?.label}
                </span>
              )}
            </h3>
            <span style={{ fontSize: "12.5px", color: "#5C706E" }}>
              Showing {filteredRequests.length} of {listTotal} matching requests ({PERIOD_OPTIONS.find((p) => p.key === period)?.label})
            </span>
          </div>
        </div>

        {/* Requests List */}
        {loading && (
          <div className="cr-list-wrap">
            {[0, 1, 2].map((i) => (
              <article className="cr-req-card" key={i}>
                <div className="cr-req-head">
                  <div className="cr-req-main-info" style={{ width: "100%" }}>
                    <div className="cr-req-title-row">
                      <SkeletonText width="140px" height="22px" />
                      <SkeletonText width="100px" height="16px" />
                      <SkeletonText width="70px" height="16px" />
                    </div>
                    <div className="cr-contact-row" style={{ marginTop: "10px" }}>
                      <SkeletonText width="120px" height="14px" />
                      <SkeletonText width="160px" height="14px" />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <SkeletonText width="100%" height="46px" />
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && filteredRequests.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px", background: "#FFFFFF", borderRadius: "18px", border: "1px dashed #D6E2E1", color: "#7A8987" }}>
            <InboxIcon size={40} color="#B4CECC" style={{ marginBottom: "12px" }} />
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#073B3F" }}>
              No Requests in {currentCardMeta.label}
              {(activeCard === "leader_approved" || activeCard === "leader_pending") && leaderRoleFilter !== "all" && (
                <span> ({LEADER_ROLE_OPTIONS.find((o) => o.key === leaderRoleFilter)?.label})</span>
              )}
            </div>
            <div style={{ fontSize: "13px", marginTop: "4px" }}>
              Zero requests found for {PERIOD_OPTIONS.find((p) => p.key === period)?.label}. Click "All" or another role / time period.
            </div>
          </div>
        )}

        {!loading && filteredRequests.length > 0 && (
          <div className="cr-list-wrap">
            {filteredRequests.map((req) => {
              const canApproveThis = req.status === "pending" && (isSuperAdmin || req.requested_to === currentUserId || req.requested_to_email === currentUserEmail);
              const pendingInfo = getDaysPendingInfo(req.created_at, req.status, req.sent_at);

              return (
                <article className={`cr-req-card${req.highlight ? " cr-req-highlight" : ""}`} key={req.id}>
                  {/* En sondha request / Super Admin (en leader) approve pannadhu — highlight */}
                  {req.highlight && (
                    <div className="cr-highlight-tag"><SparkleIcon size={12} color="#8A5A2B" /> {req.highlight_label}</div>
                  )}
                  <div className="cr-req-head">
                    <div className="cr-req-main-info">
                      {/* Requester Identity Row */}
                      <div className="cr-req-title-row">
                        <span
                          className="cr-id-badge"
                          title="Copy Requester ID"
                          onClick={() => handleCopy(req.requested_by_id_str || req.requested_by_email, req.id)}
                        >
                          <span>{req.requested_by_id_str || req.requested_by_email}</span>
                          {copiedId === req.id ? <CheckIcon size={12} color="#137333" /> : <CopyIcon size={12} color="#7A8987" />}
                        </span>
                        <span className="cr-requester-name">
                          {req.requested_by_name || "Member"}
                        </span>
                        <span className="cr-role-tag">
                          {ROLE_DISPLAY[req.requested_by_role] || req.requested_by_role?.replace('_', ' ')}
                        </span>

                        {/* Status Badge */}
                        {req.status === "sent" ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "999px", background: "#E6F4EA", color: "#166534", fontWeight: 800, fontSize: "11px", border: "1px solid #BBF7D0" }}>
                            <CheckIcon size={12} color="#166534" /> Approved
                          </span>
                        ) : req.status === "rejected" ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "999px", background: "#FEE2E2", color: "#991B1B", fontWeight: 800, fontSize: "11px", border: "1px solid #FECACA" }}>
                            <CloseIcon size={12} color="#991B1B" /> Declined
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "999px", background: "#EFF6F6", color: "#073B3F", fontWeight: 800, fontSize: "11px", border: "1px solid #CEE3E1" }}>
                            <InboxIcon size={12} color="#073B3F" /> Pending
                          </span>
                        )}

                        {/* Days Pending / Duration Badge */}
                        <span
                          className={`cr-days-pill ${pendingInfo.badgeClass}`}
                          title={`Submitted: ${new Date(req.created_at).toLocaleString()}`}
                        >
                          {pendingInfo.label}
                        </span>
                      </div>

                      {/* Contact details */}
                      <div className="cr-contact-row">
                        {req.requested_by_phone && (
                          <span className="cr-meta-item">
                            <PhoneIcon size={13} color="#073B3F" />
                            <span>{req.requested_by_phone}</span>
                          </span>
                        )}
                        {req.requested_by_email && (
                          <span className="cr-meta-item">
                            <MailIcon size={13} color="#073B3F" />
                            <span>{req.requested_by_email}</span>
                          </span>
                        )}
                        <span className="cr-meta-item">
                          <CalendarIcon size={13} color="#7A8987" />
                          <span>
                            {new Date(req.created_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </span>
                      </div>

                      {/* Assigned Approver / Parent Card */}
                      <div className="cr-approver-box">
                        <span className="cr-approver-tag">
                          {req.status === "sent" ? "Approved by:" : "Assigned Approver:"}
                        </span>
                        <span className="cr-approver-name">
                          {req.reject_reason === "MASTER_MINT"
                            ? "Super Admin (Vault Add)"
                            : req.approved_by_name || req.requested_to_name || "Direct Upstream"}
                        </span>
                        <span className="cr-approver-role">
                          {ROLE_DISPLAY[req.approved_by_role || req.requested_to_role] || req.approved_by_role?.replace('_', ' ') || req.requested_to_role?.replace('_', ' ') || "Leader"}
                        </span>
                        {(!req.approved_by_name && req.requested_to_id_str) && (
                          <span className="cr-approver-id">
                            [{req.requested_to_id_str}]
                          </span>
                        )}
                        {req.requested_to_phone && (
                          <span className="cr-approver-phone">
                            <PhoneIcon size={11} color="#073B3F" /> {req.requested_to_phone}
                          </span>
                        )}
                        {req.status === "pending" && (
                          <span style={{ color: pendingInfo.badgeClass === "overdue" ? "#DC2626" : pendingInfo.badgeClass === "delayed" ? "#B45309" : "#5C706E", fontSize: "11px", fontWeight: 700, marginLeft: "4px" }}>
                            • {pendingInfo.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions if pending and user can approve */}
                    {canApproveThis ? (
                      <div className="cr-req-actions">
                        <button
                          className="cr-btn-approve"
                          disabled={approvingReqId === req.id}
                          onClick={() => handleApproveClick(req)}
                        >
                          <CheckIcon size={14} color="#FFFFFF" />
                          {approvingReqId === req.id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          className="cr-btn-reject"
                          onClick={() => {
                            setRejectingReqId(rejectingReqId === req.id ? null : req.id);
                            setRejectReason("");
                          }}
                        >
                          <CloseIcon size={14} color="#DC2626" /> Decline
                        </button>
                      </div>
                    ) : req.status === "sent" ? (
                      <div style={{ fontSize: "12px", color: "#166534", fontWeight: 700, padding: "8px 12px", background: "#F0FDF4", borderRadius: "10px", border: "1px solid #DCFCE7", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span>✓ Disbursed & added to stock</span>
                        {req.approved_by_name && (
                          <span style={{ color: "#15803D", fontWeight: 600, fontSize: "11.5px" }}>
                            • Approved by <strong>{req.approved_by_name}</strong> {req.approved_by_role && `(${ROLE_DISPLAY[req.approved_by_role] || req.approved_by_role})`}
                          </span>
                        )}
                      </div>
                    ) : req.status === "rejected" ? (
                      <div style={{ fontSize: "12px", color: "#991B1B", fontWeight: 600, padding: "8px 12px", background: "#FEF2F2", borderRadius: "10px", border: "1px solid #FEE2E2" }}>
                        Reason: {req.reject_reason || "Declined by approver"}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "#5C706E", fontWeight: 600, padding: "8px 12px", background: "#F8FAFA", borderRadius: "10px", border: "1px solid #EAEFEF" }}>
                        Awaiting Leader Approval
                      </div>
                    )}
                  </div>

                  {/* Coin item denominations requested */}
                  <div className="cr-items-grid">
                    {req.items?.map((item) => (
                      <div className="cr-item-pill" key={item.id || `${item.metal_type}-${item.weight_label}`}>
                        <span>{COIN_METAL_LABELS_TEXT[item.metal_type] || item.metal_type} ({item.weight_label})</span>
                        <span style={{ color: "#073B3F" }}>{item.qty} pcs</span>
                      </div>
                    ))}
                  </div>

                  {/* Decline reason panel */}
                  {rejectingReqId === req.id && (
                    <div className="cr-reject-panel">
                      <textarea
                        className="cr-reject-textarea"
                        placeholder="Enter reason for declining this coin request..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button
                          className="cr-btn-reject"
                          disabled={rejectSubmitting}
                          onClick={() => handleDeclineClick(req.id)}
                        >
                          {rejectSubmitting ? "Declining..." : "Confirm Decline"}
                        </button>
                        <button
                          style={{
                            background: "transparent",
                            border: "1px solid #D6E2E1",
                            padding: "8px 16px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#5C706E",
                          }}
                          onClick={() => {
                            setRejectingReqId(null);
                            setRejectReason("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            {/* Infinite scroll — adutha 20 load aagumbodhu skeleton */}
            {loadingMore && [0, 1].map((i) => (
              <article className="cr-req-card" key={`more-skel-${i}`}>
                <div className="cr-req-title-row">
                  <SkeletonText width="140px" height="22px" />
                  <SkeletonText width="100px" height="16px" />
                  <SkeletonText width="70px" height="16px" />
                </div>
                <div style={{ marginTop: "12px" }}><SkeletonText width="100%" height="46px" /></div>
              </article>
            ))}
            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
          </div>
        )}
      </div>

      {/* Super Admin Auth Modal */}
      {authModal.open && (
        <div className="cr-modal-overlay" onClick={closeAuthModal}>
          <div className="cr-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cr-modal-head">
              <div className="cr-modal-icon-wrap">
                <LockIcon size={22} color="#073B3F" />
              </div>
              <h3 className="cr-modal-title">{authModal.title}</h3>
            </div>
            <p className="cr-modal-desc">{authModal.description}</p>

            <form onSubmit={handleAuthSubmit}>
              <div className="cr-modal-input-wrap">
                <input
                  type={showAuthPassword ? "text" : "password"}
                  className="cr-modal-input"
                  placeholder="Enter Super Admin Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="cr-modal-eye-btn"
                  onClick={() => setShowAuthPassword(!showAuthPassword)}
                  title={showAuthPassword ? "Hide password" : "Show password"}
                >
                  {showAuthPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>

              {authError && <div className="cr-modal-err">{authError}</div>}

              <div className="cr-modal-actions">
                <button
                  type="button"
                  className="cr-modal-btn-cancel"
                  onClick={closeAuthModal}
                  disabled={authLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cr-modal-btn-submit"
                  disabled={authLoading}
                >
                  {authLoading ? "Verifying..." : "Authorize Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
