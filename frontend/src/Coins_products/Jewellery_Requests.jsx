import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import CoinTabs from "./CoinTabs";
import JewelleryImageModal from "./JewelleryImageModal";
import { JewelleryRequestSkeletonList } from "./JewellerySkeleton";
import ActionSuccessModal from "./ActionSuccessModal";
import { SkeletonText } from "../components/Skeleton";
import {
  JewelryIcon,
  InboxIcon,
  CheckIcon,
  CloseIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  UsersIcon,
  CoinIcon,
  HistoryIcon,
} from "../components/SvgIcons";

const ROLE_BADGE_CONFIG = {
  super_admin: { bg: "#EFF6F6", color: "#073B3F", border: "#CEE3E1", label: "Super Admin" },
  admin: { bg: "#F3E8FF", color: "#6B21A8", border: "#E9D5FF", label: "Super Stockist" },
  dealer: { bg: "#E0F2FE", color: "#0369A1", border: "#BAE6FD", label: "Distributor" },
  sub_dealer: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0", label: "Wholesale Dealer" },
  promotor: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Retailer" },
  shop: { bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA", label: "Shop" },
};

const PAGE_SIZE = 20;

// ── Forward chain path: Retailer → Wholesale → Distributor → Super Stockist → Super Admin ──
// Ovvoru hop-um: ✓ approved (stock vandhuchu) / ⏳ pending / ✕ declined
function ForwardChainStepper({ chain }) {
  if (!chain || chain.length < 2) return null;
  const nodes = [
    { name: chain[0].from_name, role: chain[0].from_role },
    ...chain.map((h) => ({ name: h.to_name, role: h.to_role })),
  ];
  const hopCfg = {
    sent: { icon: "✓", color: "#047857", bg: "#ECFDF5", border: "#A7F3D0", label: "Stock moved" },
    pending: { icon: "⏳", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", label: "Pending" },
    rejected: { icon: "✕", color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA", label: "Declined" },
  };
  return (
    <div className="jr-chain">
      <div className="jr-chain-title">Forward chain · stock moves one level at a time</div>
      <div className="jr-chain-track">
        {nodes.map((n, i) => {
          const hop = i > 0 ? chain[i - 1] : null;
          const cfg = hop ? hopCfg[hop.status] || hopCfg.pending : null;
          return (
            <div key={i} className="jr-chain-step">
              {hop && (
                <span className="jr-chain-link" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }} title={hop.reject_reason || cfg.label}>
                  {cfg.icon}
                </span>
              )}
              <span className={`jr-chain-node${hop?.is_current || (i === 0 && chain[0].is_current) ? " current" : ""}`}>
                <strong>{n.name || "—"}</strong>
                <small>{ROLE_BADGE_CONFIG[n.role]?.label || n.role}</small>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  return [{ key: "all", label: "All" }, ...keys.map((k) => ({ key: k, label: ROLE_BADGE_CONFIG[k].label }))];
};

export default function JewelleryRequests() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("role") || "";
  const currentUserId = Number(localStorage.getItem("user_id") || localStorage.getItem("id") || 0);
  const currentUserEmail = localStorage.getItem("email") || "";
  const isSuperAdmin = role === "super_admin";
  const LEADER_ROLE_OPTIONS = useMemo(() => leaderRoleOptionsFor(role), [role]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [previewProduct, setPreviewProduct] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  // Period filter & 4 Interactive Cards state
  const [period, setPeriod] = useState("all");
  const [activeCard, setActiveCard] = useState("my_requests");
  const [leaderRoleFilter, setLeaderRoleFilter] = useState("all");

  // ── Server-driven board: counts full DB-la (team scope), list 20-20-a infinite scroll ──
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

  // Create Request Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [requestQty, setRequestQty] = useState("1");
  const [submittingReq, setSubmittingReq] = useState(false);

  // Super Admin Password Modal state
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdAction, setPwdAction] = useState(null); // { type: 'approve' | 'reject', reqId: number }
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [submittingPwd, setSubmittingPwd] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleDirectResolve = async (type, reqId, reason = "Declined by approver") => {
    try {
      const endpoint =
        type === "approve"
          ? `/jewelry-requests/${reqId}/approve/`
          : `/jewelry-requests/${reqId}/reject/`;
      const payload = type === "reject" ? { message: reason } : {};
      await api.post(endpoint, payload);
      showToast(
        type === "approve"
          ? "Jewellery request approved and stock transferred!"
          : "Jewellery request rejected."
      );
      if (type === "approve") {
        setSuccessModal({
          title: "Request Approved & Disbursed!",
          message: `Jewellery pieces for Request #${reqId} have been successfully deducted from custody and transferred to the requester.`,
          details: [
            { label: "Request ID", value: `#${reqId}`, isMonospace: true },
            { label: "Status", value: "Approved & Transferred", highlight: true },
            { label: "Timestamp", value: new Date().toLocaleTimeString("en-IN") },
          ],
          type: "success",
        });
      } else {
        setSuccessModal({
          title: "Request Declined",
          message: `Jewellery allocation request #${reqId} has been declined.`,
          details: [
            { label: "Request ID", value: `#${reqId}`, isMonospace: true },
            { label: "Status", value: "Declined" },
          ],
          type: "danger",
        });
      }
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.error || "Action failed.");
    }
  };

  const boardParams = (offset) => ({
    box: "board", view: "requests", card: activeCard, period,
    role: leaderRoleFilter, offset, limit: PAGE_SIZE,
  });

  // Card / period / role maarinaa (illa approve/decline/new request aanaa) first page + full counts
  useEffect(() => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError("");
    setHasMore(false);
    loadingMoreRef.current = false;
    setLoadingMore(false);
    api.get("/jewelry-requests/", { params: boardParams(0) })
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
      .catch(() => { if (reqId === reqIdRef.current) setError("Failed to load jewellery requests."); })
      .finally(() => { if (reqId === reqIdRef.current) setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCard, period, leaderRoleFilter, refreshKey]);

  const fetchRequests = () => setRefreshKey((k) => k + 1);

  // En kaila illadha (Super Admin) product — shortfall qty-ai en leader-ku forward pannum
  const [forwardingId, setForwardingId] = useState(null);
  const handleForward = async (req) => {
    if (!window.confirm(`Forward request #${req.id} to your leader? You can approve it once the stock reaches you.`)) return;
    setForwardingId(req.id);
    try {
      const res = await api.post(`/jewelry-requests/${req.id}/forward/`);
      showToast(res.data?.message || "Forwarded to your leader.");
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to forward request.");
    } finally {
      setForwardingId(null);
    }
  };

  const loadMore = () => {
    if (loadingMoreRef.current) return;
    const reqId = reqIdRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    api.get("/jewelry-requests/", { params: boardParams(nextOffsetRef.current) })
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

  // Bottom-ku 500px munnadiye adutha 20 fetch
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return undefined;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMoreRef.current();
    }, { rootMargin: "500px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, items.length]);

  const fetchAvailableProductsForBuy = async () => {
    try {
      const res = await api.get("/jewelry-products/");
      const prods = (Array.isArray(res.data) ? res.data : []).filter(
        (p) => Number(p.stock_quantity) > 0
      );
      setAvailableProducts(prods);
      if (prods.length > 0) setSelectedProductId(String(prods[0].id));
    } catch (err) {
      console.error("Failed to load available catalog products for request:", err);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      fetchAvailableProductsForBuy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedProductId || Number(requestQty) <= 0) {
      showToast("Please pick a product and enter a valid quantity.");
      return;
    }
    setSubmittingReq(true);
    try {
      await api.post("/jewelry-requests/", {
        items: [{ product_id: Number(selectedProductId), qty: Number(requestQty) }],
      });
      showToast("Jewellery request submitted successfully!");
      setSuccessModal({
        title: "Request Submitted!",
        message: "Your jewellery allocation request has been forwarded to your direct upstream leader for review.",
        details: [
          { label: "Design ID", value: `#${selectedProductId}`, isMonospace: true },
          { label: "Quantity", value: `${requestQty} piece(s)` },
          { label: "Status", value: "Pending Leader Review", highlight: true },
        ],
        type: "success",
      });
      setCreateModalOpen(false);
      setRequestQty("1");
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit request.");
    } finally {
      setSubmittingReq(false);
    }
  };

  const openAuthModal = (type, reqId) => {
    setPwdAction({ type, reqId });
    setAdminPassword("");
    setPwdError("");
    setPwdModalOpen(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setPwdError("Super Admin password is required.");
      return;
    }
    setSubmittingPwd(true);
    setPwdError("");
    try {
      const endpoint =
        pwdAction.type === "approve"
          ? `/jewelry-requests/${pwdAction.reqId}/approve/`
          : `/jewelry-requests/${pwdAction.reqId}/reject/`;
      const payload = {
        password: adminPassword.trim(),
        message: pwdAction.type === "reject" ? "Declined by Super Admin" : undefined,
      };
      await api.post(endpoint, payload);
      setPwdModalOpen(false);
      setAdminPassword("");
      showToast(`Request #${pwdAction.reqId} ${pwdAction.type === "approve" ? "approved" : "rejected"} successfully.`);
      if (pwdAction.type === "approve") {
        setSuccessModal({
          title: "Request Approved & Disbursed!",
          message: `Jewellery pieces for Request #${pwdAction.reqId} have been deducted from company stock and transferred.`,
          details: [
            { label: "Request ID", value: `#${pwdAction.reqId}`, isMonospace: true },
            { label: "Authorized by", value: "Super Admin", highlight: true },
            { label: "Timestamp", value: new Date().toLocaleTimeString("en-IN") },
          ],
          type: "success",
        });
      } else {
        setSuccessModal({
          title: "Request Declined",
          message: `Jewellery allocation request #${pwdAction.reqId} has been declined.`,
          details: [
            { label: "Request ID", value: `#${pwdAction.reqId}`, isMonospace: true },
            { label: "Status", value: "Declined" },
          ],
          type: "danger",
        });
      }
      fetchRequests();
    } catch (err) {
      setPwdError(err.response?.data?.error || "Password verification failed.");
    } finally {
      setSubmittingPwd(false);
    }
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

  const currentCardMeta = cardList.find((c) => c.id === activeCard) || cardList[0];

  return (
    <div className="jr-page">
      <style>{`
        .jr-page {
          min-height: 100vh;
          background: #F8FAF9;
          background-image: 
            radial-gradient(at 0% 0%, rgba(7, 59, 63, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(204, 168, 129, 0.06) 0px, transparent 50%);
          padding: 24px 32px 64px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #111817;
          box-sizing: border-box;
        }

        .jr-container {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }

        .jr-header-card {
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

        .jr-header-info h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .jr-badge {
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

        .jr-header-sub {
          margin: 4px 0 0;
          color: #5C706E;
          font-size: 13px;
        }

        .jr-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .jr-btn-create {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: #073B3F;
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.2);
          transition: all 180ms ease;
        }

        .jr-btn-create:hover {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        /* Period Filter Bar */
        .jr-period-bar {
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

        .jr-period-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .jr-period-pill {
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

        .jr-period-pill:hover {
          border-color: #073B3F;
          color: #073B3F;
        }

        .jr-period-pill.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 3px 10px rgba(7, 59, 63, 0.18);
        }

        /* Leader Role Sub-Filter Bar */
        .jr-role-filter-bar {
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

        .jr-role-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .jr-role-pill {
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

        .jr-role-pill:hover {
          border-color: #073B3F;
          color: #073B3F;
        }

        .jr-role-pill.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 3px 10px rgba(7, 59, 63, 0.18);
        }

        .jr-role-count {
          font-size: 10.5px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.06);
        }

        .jr-role-pill.active .jr-role-count {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
        }

        /* 4 Responsive Interactive Cards */
        .jr-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .jr-stat-card {
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

        .jr-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.09);
        }

        .jr-stat-card.active {
          border-color: #073B3F !important;
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.14);
          background: #F8FBFB;
        }

        .jr-stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .jr-stat-label {
          font-size: 11px;
          font-weight: 800;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .jr-stat-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .jr-stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
          margin-bottom: 4px;
        }

        .jr-stat-sub {
          font-size: 11.5px;
          color: #7A8987;
          font-weight: 600;
        }

        /* Requests List Cards */
        .jr-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .jr-req-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 20px 24px;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.03);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 180ms ease;
        }

        /* En sondha request / Super Admin (leader) approve pannadhu — gold highlight */
        .jr-req-card.jr-req-highlight {
          border: 1.5px solid #BB8958;
          background: linear-gradient(135deg, #FFFCF7 0%, #FFFFFF 60%);
          box-shadow: 0 0 0 3px rgba(187, 137, 88, 0.12), 0 8px 22px rgba(187, 137, 88, 0.12);
        }
        .jr-highlight-tag {
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
          letter-spacing: 0.02em;
        }

        .jr-req-card:hover {
          border-color: #073B3F;
          box-shadow: 0 6px 24px rgba(7, 59, 63, 0.08);
        }

        .jr-req-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          border-bottom: 1px solid #F0F4F4;
          padding-bottom: 12px;
        }

        .jr-req-title {
          font-size: 15px;
          font-weight: 800;
          color: #073B3F;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .jr-days-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.02em;
        }

        .jr-days-pill.normal {
          background: #EFF6F6;
          color: #073B3F;
          border: 1px solid #CEE3E1;
        }

        .jr-days-pill.delayed {
          background: #FFFBEB;
          color: #B45309;
          border: 1px solid #FDE68A;
        }

        .jr-days-pill.overdue {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .jr-days-pill.approved {
          background: #ECFDF5;
          color: #047857;
          border: 1px solid #A7F3D0;
        }

        .jr-days-pill.rejected {
          background: #F8FAFC;
          color: #64748B;
          border: 1px solid #E2E8F0;
        }

        .jr-req-parties {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #455A64;
        }

        .jr-party-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .jr-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
        }

        .jr-item-pill {
          background: #F8FAFA;
          border: 1px solid #E1EBEA;
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .jr-item-thumb {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          background: #EEF4F4;
        }

        .jr-req-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 4px;
        }

        .jr-btn-approve {
          padding: 9px 18px;
          background: #073B3F;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.15);
          transition: all 180ms ease;
        }

        .jr-btn-approve:hover {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        /* Forward chain — Super Admin product leader-ku forward */
        .jr-btn-forward {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #BB8958, #A0713F);
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(187, 137, 88, 0.3);
          transition: transform 150ms ease, box-shadow 150ms ease;
        }
        .jr-btn-forward:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(187, 137, 88, 0.38); }
        .jr-btn-forward:disabled { opacity: 0.6; cursor: wait; }
        .jr-fwd-note {
          font-size: 12px;
          font-weight: 700;
          padding: 7px 12px;
          border-radius: 8px;
          border: 1px solid;
          line-height: 1.45;
        }
        .jr-fwd-note.sa { color: #8A5A2B; background: #FFFAF1; border-color: rgba(187, 137, 88, 0.45); }
        .jr-fwd-note.waiting { color: #92400E; background: #FFFBEB; border-color: #FDE68A; flex: 1; }
        .jr-fwd-note.declined { color: #991B1B; background: #FEF2F2; border-color: #FECACA; }
        .jr-fwd-note.arrived { color: #047857; background: #ECFDF5; border-color: #A7F3D0; margin-right: auto; }
        .jr-chain {
          background: #F8FBFB;
          border: 1px dashed #CFE0DE;
          border-radius: 14px;
          padding: 12px 14px;
        }
        .jr-chain-title {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #7A8987;
          margin-bottom: 10px;
        }
        .jr-chain-track { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
        .jr-chain-step { display: flex; align-items: center; gap: 6px; }
        .jr-chain-link {
          width: 26px; height: 26px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 900; border: 1.5px solid;
        }
        .jr-chain-node {
          display: flex; flex-direction: column; gap: 1px;
          padding: 6px 10px; border-radius: 10px;
          background: #FFFFFF; border: 1px solid #E1EBEA;
        }
        .jr-chain-node strong { font-size: 12px; color: #073B3F; }
        .jr-chain-node small { font-size: 10px; color: #7A8987; font-weight: 700; }
        .jr-chain-node.current { border-color: #BB8958; box-shadow: 0 0 0 2px rgba(187, 137, 88, 0.18); }

        .jr-btn-reject {
          padding: 8px 16px;
          background: #FFF5F5;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 180ms ease;
        }

        .jr-btn-reject:hover {
          background: #DC2626;
          color: #FFFFFF;
        }

        /* Modals */
        .jr-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(7, 59, 63, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .jr-modal-content {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 28px 32px;
          max-width: 460px;
          width: 100%;
          box-shadow: 0 20px 48px rgba(7, 59, 63, 0.25);
        }

        .jr-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #073B3F;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          z-index: 9999;
        }

        @media (max-width: 900px) {
          .jr-page {
            padding: 16px 16px 48px;
          }
          .jr-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="jr-container">
        {/* Navigation Tabs Switcher */}
        <CoinTabs activeTab="Requests Jewellery" />

        {/* Executive Header Card */}
        <div className="jr-header-card">
          <div className="jr-header-info">
            <h1>
              <span>Jewellery Requests Inbox</span>
              <span className="jr-badge">
                {approvableCount} Pending Review
              </span>
            </h1>
            <p className="jr-header-sub">
              {isSuperAdmin
                ? "Direct upstream jewellery allocation requests across the hierarchy."
                : "Manage incoming jewellery requests from downline and track requests sent to your leader."}
            </p>
          </div>

          <div className="jr-header-actions">
            {!isSuperAdmin && (
              <button
                type="button"
                className="jr-btn-create"
                onClick={() => setCreateModalOpen(true)}
              >
                <PlusIcon size={16} color="#FFFFFF" /> Request Jewellery Piece
              </button>
            )}
          </div>
        </div>

        {/* Period Filter Bar */}
        <div className="jr-period-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarIcon size={16} color="#073B3F" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#073B3F" }}>Filter by Period:</span>
          </div>
          <div className="jr-period-pills">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`jr-period-pill ${period === p.key ? "active" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Filterable Interactive Stat Cards */}
        <div className="jr-stats-grid">
          {cardList.map((card) => {
            const isSelected = activeCard === card.id;
            const Icon = card.IconComponent;
            return (
              <div
                key={card.id}
                className={`jr-stat-card ${isSelected ? "active" : ""}`}
                style={{
                  borderLeft: `4px solid ${card.border}`,
                  borderColor: isSelected ? "#073B3F" : undefined,
                  background: isSelected ? "#F8FBFB" : "#FFFFFF",
                }}
                onClick={() => setActiveCard(card.id)}
                title={`Click to view ${card.label}`}
              >
                <div className="jr-stat-header">
                  <span className="jr-stat-label">{card.label}</span>
                  <div className="jr-stat-icon" style={{ background: card.iconBg, color: card.iconColor }}>
                    <Icon size={17} color={card.iconColor} />
                  </div>
                </div>
                <div className="jr-stat-value">
                  {loading ? <SkeletonText width="45px" height="28px" /> : card.val}
                </div>
                <div className="jr-stat-sub">{card.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Leader Role Sub-Filter Bar (Shown for Leader Approved and Leader Pending requests) */}
        {(activeCard === "leader_approved" || activeCard === "leader_pending") && (
          <div className="jr-role-filter-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UsersIcon size={16} color="#073B3F" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#073B3F" }}>Filter by Role:</span>
            </div>
            <div className="jr-role-pills">
              {LEADER_ROLE_OPTIONS.map((opt) => {
                const isSelected = leaderRoleFilter === opt.key;
                const count = getLeaderRoleCount(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={`jr-role-pill ${isSelected ? "active" : ""}`}
                    onClick={() => setLeaderRoleFilter(opt.key)}
                  >
                    <span>{opt.label}</span>
                    <span className="jr-role-count">{count}</span>
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
        {loading ? (
          <JewelleryRequestSkeletonList count={4} />
        ) : filteredRequests.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              background: "#FFFFFF",
              borderRadius: "18px",
              border: "1px dashed #D6E2E1",
              color: "#7A8987",
            }}
          >
            <JewelryIcon size={40} color="#B4CECC" style={{ marginBottom: "12px" }} />
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#073B3F" }}>
              No Requests in {currentCardMeta.label}
              {(activeCard === "leader_approved" || activeCard === "leader_pending") && leaderRoleFilter !== "all" && (
                <span> ({LEADER_ROLE_OPTIONS.find((o) => o.key === leaderRoleFilter)?.label})</span>
              )}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "13.5px" }}>
              Zero jewellery requests found for {PERIOD_OPTIONS.find((p) => p.key === period)?.label}. Click "All" or another role / time period.
            </p>
          </div>
        ) : (
          <div className="jr-list">
            {filteredRequests.map((req) => {
              const reqRoleBadge = ROLE_BADGE_CONFIG[req.requested_by_role] || {
                bg: "#F1F5F9",
                color: "#334155",
                border: "#E2E8F0",
                label: req.requested_by_role,
              };
              const isPending = req.status === "pending";
              const canApproveThis = isPending && (isSuperAdmin || req.requested_to === currentUserId || req.requested_to_email === currentUserEmail);
              const pendingInfo = getDaysPendingInfo(req.created_at, req.status, req.sent_at);

              return (
                <div key={req.id} className={`jr-req-card${req.highlight ? " jr-req-highlight" : ""}`}>
                  {/* En sondha request / Super Admin (en leader) approve pannadhu — highlight */}
                  {req.highlight && (
                    <div className="jr-highlight-tag">★ {req.highlight_label}</div>
                  )}
                  <div className="jr-req-header">
                    <div className="jr-req-title">
                      <span>Request #{req.id}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background: isPending ? "#EFF6F6" : req.status === "sent" ? "#E6F4EA" : "#FEF2F2",
                          color: isPending ? "#073B3F" : req.status === "sent" ? "#166534" : "#DC2626",
                          border: isPending ? "1px solid #CEE3E1" : req.status === "sent" ? "1px solid #BBF7D0" : "1px solid #FECACA",
                        }}
                      >
                        {isPending ? "Pending Review" : req.status === "sent" ? "Approved" : "Declined"}
                      </span>

                      {/* Days Pending / Duration Badge */}
                      <span
                        className={`jr-days-pill ${pendingInfo.badgeClass}`}
                        title={`Submitted: ${new Date(req.created_at).toLocaleString()}`}
                      >
                        {pendingInfo.label}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "#7A8987" }}>
                      Submitted: {new Date(req.created_at).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="jr-req-parties">
                    <div className="jr-party-box">
                      <span style={{ fontWeight: 700, color: "#5C706E" }}>From:</span>
                      <strong style={{ color: "#073B3F" }}>
                        {req.requested_by_name || req.requested_by_email}
                      </strong>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "6px",
                          background: reqRoleBadge.bg,
                          color: reqRoleBadge.color,
                          border: `1px solid ${reqRoleBadge.border}`,
                        }}
                      >
                        {reqRoleBadge.label}
                      </span>
                      {req.requested_by_id_str && (
                        <span style={{ fontSize: "11px", color: "#7A8987" }}>
                          ({req.requested_by_id_str})
                        </span>
                      )}
                    </div>

                    {(req.requested_to_name || req.approved_by_name) && (
                      <div className="jr-party-box">
                        <span style={{ fontWeight: 700, color: "#5C706E" }}>
                          {req.status === "sent" ? "Approved by:" : "Target:"}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          {req.status === "sent"
                            ? (req.approved_by_name || req.requested_to_name)
                            : (req.requested_to_name || "Direct Upstream")}
                        </span>
                        {(req.status === "sent" ? (req.approved_by_role || req.requested_to_role) : req.requested_to_role) && (
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              background: "#F1F5F9",
                              color: "#475569",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {ROLE_BADGE_CONFIG[req.status === "sent" ? (req.approved_by_role || req.requested_to_role) : req.requested_to_role]?.label || (req.status === "sent" ? (req.approved_by_role || req.requested_to_role) : req.requested_to_role)}
                          </span>
                        )}
                        {isPending && (
                          <span style={{ color: pendingInfo.badgeClass === "overdue" ? "#DC2626" : pendingInfo.badgeClass === "delayed" ? "#B45309" : "#5C706E", fontSize: "11px", fontWeight: 700, marginLeft: "4px" }}>
                            • {pendingInfo.text}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Requested Items */}
                  <div className="jr-items-grid">
                    {req.items?.map((item, idx) => {
                      const p = item.product;
                      const img = p?.images?.[0]?.image || "";
                      return (
                        <div key={idx} className="jr-item-pill">
                          <div
                            style={{ cursor: p ? "pointer" : "default" }}
                            onClick={() => p && setPreviewProduct(p)}
                            title={p ? "Click to zoom image" : ""}
                          >
                            {img ? (
                              <img src={img} alt={p?.name} className="jr-item-thumb" />
                            ) : (
                              <div className="jr-item-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <JewelryIcon size={20} color="#073B3F" />
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "#073B3F" }}>
                                {p?.name || "Jewellery Item"}
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
                            <div style={{ fontSize: "11.5px", color: "#5C706E" }}>
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

                  <ForwardChainStepper chain={req.chain} />

                  {/* Footer actions / status message */}
                  <div className="jr-req-footer">
                    {canApproveThis && !isSuperAdmin && req.forward_info?.status === "pending" ? (
                      // Mela forward pannirukken — stock varra varaikkum wait
                      <div className="jr-fwd-note waiting">
                        ⏳ Forwarded to <strong>{req.forward_info.to_name}</strong> ({ROLE_BADGE_CONFIG[req.forward_info.to_role]?.label || req.forward_info.to_role}) — approve this once the stock reaches you.
                      </div>
                    ) : canApproveThis && !isSuperAdmin && req.stock_shortfall?.length > 0 ? (
                      // En kaila stock illa (Super Admin product) — en leader-ku forward pannalaam
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div className="jr-fwd-note sa">
                            ★ Super Admin Product · Not in your stock —{" "}
                            {req.stock_shortfall.map((s) => `${s.name}: need ${s.need}, you have ${s.have}`).join(" · ")}
                          </div>
                          {req.forward_info?.status === "rejected" && (
                            <div className="jr-fwd-note declined">
                              ✕ Your leader declined: {req.forward_info.reject_reason || "No reason given"}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            type="button"
                            className="jr-btn-forward"
                            disabled={forwardingId === req.id}
                            onClick={() => handleForward(req)}
                          >
                            ↑ {forwardingId === req.id ? "Forwarding..." : req.forward_info?.status === "rejected" ? "Forward Again" : "Forward to My Leader"}
                          </button>
                          <button
                            type="button"
                            className="jr-btn-reject"
                            onClick={() => {
                              const reason = window.prompt(
                                "Please enter rejection reason:",
                                req.forward_info?.status === "rejected"
                                  ? `My leader declined: ${req.forward_info.reject_reason || "not available"}`
                                  : "Stock unavailable"
                              );
                              if (reason && reason.trim()) handleDirectResolve("reject", req.id, reason.trim());
                            }}
                          >
                            <CloseIcon size={14} color="#DC2626" /> Decline
                          </button>
                        </div>
                      </>
                    ) : canApproveThis ? (
                      <>
                        {req.forward_info?.status === "sent" && !isSuperAdmin && (
                          <div className="jr-fwd-note arrived">
                            ✓ Stock arrived from {req.forward_info.to_name} — approve now to pass it down
                          </div>
                        )}
                        <div style={{ fontSize: "12px", color: "#5C706E" }}>
                          Approving will deduct piece(s) from your stock and disburse to requester.
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            type="button"
                            className="jr-btn-approve"
                            onClick={() => {
                              if (isSuperAdmin) {
                                openAuthModal("approve", req.id);
                              } else {
                                if (window.confirm(`Approve request #${req.id} and disburse jewellery pieces to ${req.requested_by_name || "requester"}?`)) {
                                  handleDirectResolve("approve", req.id);
                                }
                              }
                            }}
                          >
                            <CheckIcon size={14} color="#FFFFFF" /> Approve & Disburse
                          </button>
                          <button
                            type="button"
                            className="jr-btn-reject"
                            onClick={() => {
                              if (isSuperAdmin) {
                                openAuthModal("reject", req.id);
                              } else {
                                const reason = window.prompt("Please enter rejection reason:", "Stock unavailable or pending verification");
                                if (reason && reason.trim()) {
                                  handleDirectResolve("reject", req.id, reason.trim());
                                }
                              }
                            }}
                          >
                            <CloseIcon size={14} color="#DC2626" /> Decline
                          </button>
                        </div>
                      </>
                    ) : req.status === "sent" ? (
                      <div style={{ fontSize: "12px", color: "#166534", fontWeight: 700, padding: "6px 12px", background: "#F0FDF4", borderRadius: "8px", border: "1px solid #DCFCE7", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span>✓ Disbursed & added to requester stock</span>
                        {req.approved_by_name && (
                          <span style={{ color: "#15803D", fontWeight: 600, fontSize: "11.5px" }}>
                            • Approved by <strong>{req.approved_by_name}</strong> {req.approved_by_role && `(${ROLE_BADGE_CONFIG[req.approved_by_role]?.label || (req.approved_by_role === 'super_admin' ? 'Super Admin' : req.approved_by_role)})`}
                          </span>
                        )}
                      </div>
                    ) : req.status === "rejected" ? (
                      <div style={{ fontSize: "12px", color: "#991B1B", fontWeight: 600, padding: "6px 12px", background: "#FEF2F2", borderRadius: "8px", border: "1px solid #FEE2E2" }}>
                        Reason: {req.reject_reason || "Declined by approver"}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "#5C706E", fontWeight: 600, padding: "6px 12px", background: "#F8FAFA", borderRadius: "8px", border: "1px solid #EAEFEF" }}>
                        {req.forward_info?.status === "pending"
                          ? `Your leader forwarded this to ${req.forward_info.to_name} — stock is on the way`
                          : "Awaiting Leader Approval"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Infinite scroll — adutha 20 load aagumbodhu skeleton */}
            {loadingMore && <JewelleryRequestSkeletonList count={2} />}
            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
          </div>
        )}
      </div>

      {/* Modal: Create Request */}
      {createModalOpen && (
        <div className="jr-modal-overlay">
          <div className="jr-modal-content">
            <h3 style={{ margin: "0 0 14px", color: "#073B3F", fontSize: "18px" }}>
              Request Jewellery Piece
            </h3>
            <form onSubmit={handleCreateRequest}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#2C3E3D" }}>
                    Select Jewellery Design:
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #D6E2E1",
                      marginTop: "6px",
                      outline: "none",
                    }}
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.metal?.toUpperCase()} {p.grade} - Net: {p.net_weight || p.cross_weight}g)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#2C3E3D" }}>
                    Quantity Needed:
                  </label>
                  <input
                    type="number"
                    min="1"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #D6E2E1",
                      marginTop: "6px",
                      outline: "none",
                    }}
                    value={requestQty}
                    onChange={(e) => setRequestQty(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button
                    type="button"
                    style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid #D6E2E1", background: "#FFFFFF", cursor: "pointer" }}
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "8px 18px", borderRadius: "10px", border: "none", background: "#073B3F", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" }}
                    disabled={submittingReq}
                  >
                    {submittingReq ? "Sending..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Password Authentication Modal */}
      {pwdModalOpen && (
        <div className="jr-modal-overlay">
          <div className="jr-modal-content">
            <h3 style={{ margin: "0 0 10px", color: "#073B3F", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
              <LockIcon size={20} color="#073B3F" /> Authorize {pwdAction?.type === "approve" ? "Approval" : "Rejection"}
            </h3>
            <p style={{ fontSize: "13px", color: "#5C706E", margin: "0 0 14px" }}>
              Super Admin verification required to disburse jewellery piece across the hierarchy.
            </p>

            {pwdError && (
              <div style={{ color: "#DC2626", fontSize: "12.5px", fontWeight: 700, marginBottom: "10px" }}>
                {pwdError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  style={{
                    width: "100%",
                    padding: "11px 40px 11px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #D6E2E1",
                    outline: "none",
                  }}
                  placeholder="Enter Super Admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  style={{ position: "absolute", right: "12px", background: "none", border: "none", color: "#5C706E", cursor: "pointer" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "18px" }}>
                <button
                  type="button"
                  style={{ padding: "9px 16px", borderRadius: "10px", border: "1px solid #D6E2E1", background: "#FFFFFF", cursor: "pointer" }}
                  onClick={() => setPwdModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: "#073B3F", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" }}
                  disabled={submittingPwd}
                >
                  {submittingPwd ? "Verifying..." : "Confirm Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="jr-toast">{toast}</div>}

      {/* High-Res Product Image Modal */}
      <JewelleryImageModal
        isOpen={Boolean(previewProduct)}
        onClose={() => setPreviewProduct(null)}
        product={previewProduct}
      />

      {/* Action Success / Feedback Popup Modal */}
      <ActionSuccessModal
        isOpen={Boolean(successModal)}
        onClose={() => setSuccessModal(null)}
        title={successModal?.title}
        message={successModal?.message}
        details={successModal?.details}
        type={successModal?.type || "success"}
        buttonText={successModal?.buttonText || "Done, Great!"}
      />
    </div>
  );
}
