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

  const approveCoinRequest = async (reqId) => {
    setApprovingReqId(reqId);
    setMsg("");
    try {
      await api.post(`/coin-requests/${reqId}/approve/`);
      setMsgType("success");
      setMsg(`Request #${reqId} approved.`);
      fetchCoinRequests();
    } catch (err) {
      setMsgType("error");
      setMsg(err.response?.data?.error || "Failed to approve request.");
    }
    setApprovingReqId(null);
  };

  const approveAllCoinRequests = async () => {
    setApprovingAll(true);
    setMsg("");
    try {
      await api.post("/coin-requests/approve-all/");
      setMsgType("success");
      setMsg("All requests approved successfully.");
      fetchCoinRequests();
    } catch (err) {
      setMsgType("error");
      setMsg(err.response?.data?.error || "Failed to approve requests.");
    }
    setApprovingAll(false);
  };

  const rejectCoinRequest = async (reqId) => {
    if (!rejectReason.trim()) {
      setMsgType("error");
      setMsg("Please enter a rejection reason.");
      return;
    }
    setRejectSubmitting(true);
    setMsg("");
    try {
      await api.post(`/coin-requests/${reqId}/reject/`, { message: rejectReason.trim() });
      setMsgType("success");
      setMsg(`Request #${reqId} rejected.`);
      setRejectingReqId(null);
      setRejectReason("");
      fetchCoinRequests();
    } catch {
      setMsgType("error");
      setMsg("Failed to reject request.");
    }
    setRejectSubmitting(false);
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

        .cr-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5C706E;
        }

        .cr-breadcrumb .link {
          color: #073B3F;
          cursor: pointer;
          font-weight: 700;
          text-decoration: none;
        }

        .cr-breadcrumb .link:hover {
          text-decoration: underline;
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
        }

        .cr-btn-primary:hover {
          background: #0C4E53;
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
          gap: 14px;
        }

        .cr-req-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 20px 24px;
          box-shadow: 0 4px 18px rgba(7, 59, 63, 0.03);
          transition: all 180ms ease;
        }

        .cr-req-card:hover {
          border-color: #073B3F;
        }

        .cr-req-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #EDF3F2;
          margin-bottom: 14px;
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
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
        }

        .cr-btn-approve {
          background: #073B3F;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .cr-btn-approve:hover:not(:disabled) {
          background: #0C4E53;
        }

        .cr-btn-reject {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .cr-btn-reject:hover {
          background: #DC2626;
          color: #FFFFFF;
        }

        .cr-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 8px;
        }

        .cr-item-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F8FAFA;
          border: 1px solid #E1EBEA;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12.5px;
          font-weight: 700;
        }

        .cr-reject-panel {
          margin-top: 14px;
          padding: 14px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 12px;
        }

        .cr-reject-textarea {
          width: 100%;
          min-height: 60px;
          background: #FFFFFF;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
          box-sizing: border-box;
          outline: none;
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

        {/* 4 Tabs Matching User's Image */}
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
                onClick={approveAllCoinRequests}
              >
                <CheckIcon size={15} color="#FFFFFF" />
                {approvingAll ? "Approving..." : `Approve All (${pending.length})`}
              </button>
            )}
            <button className="cr-btn-secondary" onClick={() => navigate("/stored-coins")}>
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
              {msgType === "success" ? <CheckIcon size={14} color="#137333" /> : "⚠️"}
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
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                      <span
                        className="cr-id-badge"
                        title="Copy Requester ID"
                        onClick={() => handleCopy(req.requested_by_id_str || req.requested_by_email, req.id)}
                      >
                        <span>{req.requested_by_id_str || req.requested_by_email}</span>
                        {copiedId === req.id ? <CheckIcon size={11} color="#137333" /> : <CopyIcon size={11} color="#7A8987" />}
                      </span>
                      <span style={{ fontWeight: 800, color: "#111817", fontSize: "14px" }}>
                        {req.requested_by_name || "Member"}
                      </span>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "capitalize",
                        background: "#E8F0FE",
                        color: "#1967D2",
                        padding: "2px 8px",
                        borderRadius: "12px",
                      }}>
                        {req.requested_by_role?.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "#5C706E", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
                      {req.requested_by_phone && <span>📞 {req.requested_by_phone}</span>}
                      {req.requested_by_email && <span>✉️ {req.requested_by_email}</span>}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <CalendarIcon size={13} color="#7A8987" />
                        {new Date(req.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>

                    {/* Assigned Parent / Approver info */}
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#F8FAFA",
                      border: "1px solid #E1EBEA",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}>
                      <span style={{ color: "#7A8987", fontWeight: 600 }}>Assigned Approver:</span>
                      <span style={{ color: "#073B3F", fontWeight: 800 }}>
                        {req.requested_to_name || "Upstream"} ({req.requested_to_role?.replace('_', ' ') || "Parent"})
                      </span>
                      {req.requested_to_id_str && (
                        <span style={{ color: "#5C706E", fontSize: "11px", fontFamily: "monospace" }}>
                          [{req.requested_to_id_str}]
                        </span>
                      )}
                      {req.requested_to_phone && (
                        <span style={{ color: "#5C706E", fontSize: "11px" }}>
                          · 📞 {req.requested_to_phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      className="cr-btn-approve"
                      disabled={approvingReqId === req.id}
                      onClick={() => approveCoinRequest(req.id)}
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

                <div className="cr-items-grid">
                  {req.items?.map((item) => (
                    <div className="cr-item-pill" key={item.id || `${item.metal_type}-${item.weight_label}`}>
                      <span>{COIN_METAL_LABELS_TEXT[item.metal_type] || item.metal_type} ({item.weight_label})</span>
                      <span style={{ color: "#073B3F" }}>{item.qty} pcs</span>
                    </div>
                  ))}
                </div>

                {rejectingReqId === req.id && (
                  <div className="cr-reject-panel">
                    <textarea
                      className="cr-reject-textarea"
                      placeholder="Reason for declining..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button
                        className="cr-btn-reject"
                        disabled={rejectSubmitting}
                        onClick={() => rejectCoinRequest(req.id)}
                      >
                        {rejectSubmitting ? "Declining..." : "Confirm Decline"}
                      </button>
                      <button
                        className="cr-btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
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
    </div>
  );
}
