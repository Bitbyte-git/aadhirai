import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { SkeletonText } from "../components/Skeleton";
import CoinTabs from "./CoinTabs";
import {
  InboxIcon,
  CoinIcon,
  UsersIcon,
  PlusIcon,
  HistoryIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldIcon,
} from "../components/SvgIcons";

const COIN_METAL_LABELS_TEXT = {
  gold_22k: "Gold 22K (916)",
  gold_24k: "Gold 24K (999)",
  silver_999: "Silver 999",
};

export default function CoinRequests() {
  const navigate = useNavigate();
  const [coinRequests, setCoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [approvingReqId, setApprovingReqId] = useState(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [rejectingReqId, setRejectingReqId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Super Admin Password Modal States
  const currentRole = localStorage.getItem("role") || "";
  const isSuperAdmin = currentRole === "super_admin";

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

  const fetchCoinRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/coin-requests/");
      setCoinRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load coin requests.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoinRequests();
  }, []);

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

  // Button triggers (checks if Super Admin needs password modal)
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
    if (pending.length === 0) return;
    if (isSuperAdmin) {
      setAuthModal({
        open: true,
        actionType: "approve_all",
        title: "Authorize Batch Approval",
        description: `Please enter your Super Admin password to approve all ${pending.length} pending coin requests across the hierarchy.`,
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

  const pending = coinRequests.filter((r) => r.status === "pending");
  const pendingItems = pending.reduce(
    (sum, req) => sum + req.items.reduce((s, i) => s + Number(i.qty || 0), 0),
    0
  );
  const uniqueRequesters = new Set(
    pending.map((r) => r.requested_by_id_str || r.requested_by_email)
  ).size;

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

        .cr-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .cr-back-btn {
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

        .cr-back-btn:hover {
          background: #F0F5F5;
          border-color: #073B3F;
          transform: translateX(-2px);
        }

        .cr-header-card {
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
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
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

        .cr-btn-secondary {
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

        .cr-btn-secondary:hover {
          background: #F0F5F5;
          border-color: #073B3F;
        }

        .cr-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        .cr-stat-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 20px 24px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
          transition: transform 180ms ease;
        }

        .cr-stat-card:hover {
          transform: translateY(-2px);
        }

        .cr-stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .cr-stat-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #5C706E;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .cr-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cr-stat-value {
          font-size: 30px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1;
          margin-bottom: 4px;
        }

        .cr-stat-sub {
          font-size: 12px;
          color: #7A8987;
          font-weight: 500;
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
          background: #E8F0FE;
          color: #1967D2;
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

        .cr-input-group {
          position: relative;
          margin-bottom: 16px;
        }

        .cr-password-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 42px 12px 38px;
          background: #F8FAFA;
          border: 1.5px solid #D1DFDE;
          border-radius: 12px;
          font-size: 14px;
          color: #111817;
          outline: none;
          transition: all 180ms ease;
        }

        .cr-password-input:focus {
          background: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.12);
        }

        .cr-input-prefix {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #7A8987;
          pointer-events: none;
        }

        .cr-input-suffix-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #7A8987;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .cr-modal-error {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .cr-modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        @media (max-width: 1024px) {
          .cr-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .cr-root { padding: 16px 16px 40px; }
        }

        @media (max-width: 600px) {
          .cr-stats-grid { grid-template-columns: 1fr; }
          .cr-header-card { flex-direction: column; align-items: flex-start; }
          .cr-header-actions { width: 100%; }
        }
      `}</style>

      <div className="cr-shell">
        {/* Topbar */}
        <div className="cr-topbar">
          <button className="cr-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={14} color="#073B3F" /> Back
          </button>
        </div>

        {/* 4 Tabs Matching Navigation */}
        <CoinTabs activeTab="Requests Coins" />

        {/* Executive Header Card */}
        <div className="cr-header-card">
          <div className="cr-header-info">
            <h1>
              <span>Requests Coins</span>
              <span className="cr-badge">{pending.length} Pending</span>
            </h1>
            <p className="cr-header-sub">
              Review and authorize pending coin requests.
            </p>
          </div>
          <div className="cr-header-actions">
            {pending.length > 0 && (
              <button
                className="cr-btn-primary"
                disabled={approvingAll}
                onClick={handleApproveAllClick}
              >
                <CheckIcon size={15} color="#FFFFFF" />
                {approvingAll ? "Approving..." : `Approve All (${pending.length})`}
              </button>
            )}
            <button className="cr-btn-secondary" onClick={() => navigate("/available-coins")}>
              <CoinIcon size={15} color="#073B3F" /> Available Coins
            </button>
            <button className="cr-btn-secondary" onClick={() => navigate("/coin-transactions")}>
              <HistoryIcon size={15} color="#073B3F" /> Transactions
            </button>
            <button className="cr-btn-secondary" onClick={() => navigate("/buy-coin")}>
              <PlusIcon size={15} color="#073B3F" /> Add Coins
            </button>
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

        {/* 4 Stat Cards */}
        <div className="cr-stats-grid">
          <div className="cr-stat-card" style={{ borderLeft: "4px solid #073B3F" }}>
            <div className="cr-stat-header">
              <span className="cr-stat-label">Pending</span>
              <div className="cr-stat-icon" style={{ background: "#EFF6F6", color: "#073B3F" }}>
                <InboxIcon size={18} color="#073B3F" />
              </div>
            </div>
            <div className="cr-stat-value">
              {loading ? <SkeletonText width="60px" height="30px" /> : pending.length}
            </div>
            <div className="cr-stat-sub">Awaiting review</div>
          </div>

          <div className="cr-stat-card" style={{ borderLeft: "4px solid #D97706" }}>
            <div className="cr-stat-header">
              <span className="cr-stat-label">Pending Pieces</span>
              <div className="cr-stat-icon" style={{ background: "#FEF3C7", color: "#B45309" }}>
                <CoinIcon size={18} color="#B45309" />
              </div>
            </div>
            <div className="cr-stat-value">
              {loading ? <SkeletonText width="60px" height="30px" /> : pendingItems.toLocaleString()}
            </div>
            <div className="cr-stat-sub">Requested units</div>
          </div>

          <div className="cr-stat-card" style={{ borderLeft: "4px solid #166534" }}>
            <div className="cr-stat-header">
              <span className="cr-stat-label">Requesters</span>
              <div className="cr-stat-icon" style={{ background: "#E6F4EA", color: "#137333" }}>
                <UsersIcon size={18} color="#137333" />
              </div>
            </div>
            <div className="cr-stat-value">
              {loading ? <SkeletonText width="60px" height="30px" /> : uniqueRequesters}
            </div>
            <div className="cr-stat-sub">Downline members</div>
          </div>

          <div className="cr-stat-card" style={{ borderLeft: "4px solid #64748B" }}>
            <div className="cr-stat-header">
              <span className="cr-stat-label">Total Loaded</span>
              <div className="cr-stat-icon" style={{ background: "#F1F5F9", color: "#475569" }}>
                <HistoryIcon size={18} color="#475569" />
              </div>
            </div>
            <div className="cr-stat-value">
              {loading ? <SkeletonText width="60px" height="30px" /> : coinRequests.length}
            </div>
            <div className="cr-stat-sub">Requests logged</div>
          </div>
        </div>

        {/* Requests List */}
        {!loading && pending.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E1EBEA", color: "#7A8987" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#073B3F" }}>No Pending Requests</div>
            <div style={{ fontSize: "13px", marginTop: "4px" }}>All requests have been addressed.</div>
          </div>
        )}

        {!loading && pending.length > 0 && (
          <div className="cr-list-wrap">
            {pending.map((req) => (
              <article className="cr-req-card" key={req.id}>
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
                        {req.requested_by_role?.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Contact details with Clean SVG Icons */}
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
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </span>
                    </div>

                    {/* Assigned Approver / Parent Card */}
                    <div className="cr-approver-box">
                      <span className="cr-approver-tag">Assigned Approver:</span>
                      <span className="cr-approver-name">
                        {req.requested_to_name || "Direct Upstream"}
                      </span>
                      <span className="cr-approver-role">
                        {req.requested_to_role?.replace('_', ' ') || "Parent"}
                      </span>
                      {req.requested_to_id_str && (
                        <span className="cr-approver-id">
                          [{req.requested_to_id_str}]
                        </span>
                      )}
                      {req.requested_to_phone && (
                        <span className="cr-approver-phone">
                          <PhoneIcon size={11} color="#073B3F" /> {req.requested_to_phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
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
                        className="cr-btn-secondary"
                        style={{ padding: "6px 14px", fontSize: "12.5px" }}
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
            ))}
          </div>
        )}
      </div>

      {/* Super Admin Password Verification Modal */}
      {authModal.open && (
        <div className="cr-modal-overlay" onClick={closeAuthModal}>
          <div className="cr-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cr-modal-head">
              <div className="cr-modal-icon-wrap">
                <ShieldIcon size={24} color="#073B3F" />
              </div>
              <div>
                <h3 className="cr-modal-title">{authModal.title}</h3>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Super Admin Security Verification
                </span>
              </div>
            </div>

            <p className="cr-modal-desc">{authModal.description}</p>

            {authError && (
              <div className="cr-modal-error">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              <div className="cr-input-group">
                <span className="cr-input-prefix">
                  <LockIcon size={16} color="#7A8987" />
                </span>
                <input
                  type={showAuthPassword ? "text" : "password"}
                  className="cr-password-input"
                  placeholder="Enter Super Admin password"
                  autoFocus
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  disabled={authLoading}
                />
                <button
                  type="button"
                  className="cr-input-suffix-btn"
                  onClick={() => setShowAuthPassword(!showAuthPassword)}
                  tabIndex={-1}
                >
                  {showAuthPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>

              <div className="cr-modal-actions">
                <button
                  type="button"
                  className="cr-btn-secondary"
                  onClick={closeAuthModal}
                  disabled={authLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cr-btn-primary"
                  disabled={authLoading || !authPassword}
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
