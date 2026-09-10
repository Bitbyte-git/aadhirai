import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import CoinTabs from "./CoinTabs";
import JewelleryImageModal from "./JewelleryImageModal";
import {
  JewelryIcon,
  InboxIcon,
  CheckIcon,
  CloseIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  PlusIcon,
  ClockIcon,
} from "../components/SvgIcons";

const ROLE_BADGE_CONFIG = {
  super_admin: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", label: "Super Admin" },
  admin: { bg: "#F3E8FF", color: "#6B21A8", border: "#E9D5FF", label: "Admin" },
  dealer: { bg: "#E0F2FE", color: "#0369A1", border: "#BAE6FD", label: "Dealer" },
  sub_dealer: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0", label: "Sub Dealer" },
  promotor: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Promotor" },
};

export default function JewelleryRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role") || "";
  const isSuperAdmin = role === "super_admin";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [previewProduct, setPreviewProduct] = useState(null);
  const [boxTab, setBoxTab] = useState(
    location.state?.initialTab || (role === "promotor" ? "sent" : "received")
  ); // "received" | "sent"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "sent" | "rejected"

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
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.error || "Action failed.");
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { box: boxTab };
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      const res = await api.get("/jewelry-requests/", { params });
      setRequests(Array.isArray(res.data) ? res.data : res.data.items || []);
    } catch {
      setError("Failed to load jewellery requests.");
    }
    setLoading(false);
  };

  const fetchAvailableProducts = async () => {
    try {
      const res = await api.get("/jewelry-products/?internal=true");
      setAvailableProducts(res.data || []);
      if (res.data?.length > 0) {
        setSelectedProductId(res.data[0].id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [boxTab, statusFilter]);

  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSubmittingReq(true);
    try {
      await api.post("/jewelry-requests/", {
        items: [{ product_id: selectedProductId, qty: parseInt(requestQty, 10) || 1 }],
      });
      showToast("Jewellery request submitted successfully!");
      setCreateModalOpen(false);
      setBoxTab("sent");
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create request.");
    }
    setSubmittingReq(false);
  };

  const openAuthModal = (type, reqId) => {
    setPwdAction({ type, reqId });
    setAdminPassword("");
    setPwdError("");
    setPwdModalOpen(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isSuperAdmin && !adminPassword.trim()) {
      setPwdError("Please enter your Super Admin password.");
      return;
    }

    setSubmittingPwd(true);
    setPwdError("");
    try {
      const { type, reqId } = pwdAction;
      const endpoint =
        type === "approve"
          ? `/jewelry-requests/${reqId}/approve/`
          : `/jewelry-requests/${reqId}/reject/`;
      const payload = isSuperAdmin ? { password: adminPassword.trim() } : {};
      if (type === "reject") payload.message = "Declined by approver";

      await api.post(endpoint, payload);
      showToast(
        type === "approve"
          ? "Jewellery request approved and stock transferred!"
          : "Jewellery request rejected."
      );
      setPwdModalOpen(false);
      fetchRequests();
    } catch (err) {
      setPwdError(err.response?.data?.error || "Action failed.");
    }
    setSubmittingPwd(false);
  };

  return (
    <div className="jr-page">
      <style>{`
        .jr-page {
          min-height: 100vh;
          background: #F4F8F8;
          padding: 24px 32px 60px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #111817;
        }

        .jr-container {
          max-width: 1240px;
          margin: 0 auto;
        }

        .jr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .jr-header-left h1 {
          font-size: 26px;
          font-weight: 800;
          color: #073B3F;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .jr-header-left p {
          font-size: 14px;
          color: #5C706E;
          margin: 0;
        }

        .jr-header-actions {
          display: flex;
          gap: 10px;
        }

        .jr-btn-create {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #073B3F 0%, #0C4E53 100%);
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.2);
        }

        /* Tabs bar: Received vs Sent */
        .jr-box-tabs {
          display: flex;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 14px;
          padding: 5px;
          margin-bottom: 22px;
          width: fit-content;
        }

        .jr-box-btn {
          padding: 8px 18px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #5C706E;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .jr-box-btn.active {
          background: #073B3F;
          color: #FFFFFF;
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
          background: #166534;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .jr-btn-reject {
          padding: 9px 18px;
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FCA5A5;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
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
      `}</style>

      <div className="jr-container">
        <CoinTabs activeTab="Requests Jewellery" />

        <div className="jr-header">
          <div className="jr-header-left">
            <h1>
              <InboxIcon size={26} color="#073B3F" /> Jewellery Requests Inbox
            </h1>
            <p>
              Direct upstream allocation requests between Promotors, Sub Dealers, Dealers, Admins, and Super Admin.
            </p>
          </div>

          <div className="jr-header-actions">
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "#FFFFFF",
                border: "1px solid #D6E2E1",
                borderRadius: "12px",
                color: "#073B3F",
                fontSize: "13px",
                fontWeight: 750,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(7, 59, 63, 0.04)",
              }}
              onClick={() => navigate("/jewellery-transactions")}
            >
              <ClockIcon size={16} color="#073B3F" /> View Transactions History
            </button>
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

        {/* Filter Controls: Received vs Sent + Status Filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "22px",
          }}
        >
          {/* Received vs Sent Toggle */}
          <div className="jr-box-tabs" style={{ marginBottom: 0 }}>
            {role !== "promotor" && (
              <button
                type="button"
                className={`jr-box-btn ${boxTab === "received" ? "active" : ""}`}
                onClick={() => setBoxTab("received")}
              >
                {isSuperAdmin ? "Company Incoming Requests" : "Received Requests"} {boxTab === "received" ? `(${requests.length})` : ""}
              </button>
            )}
            {!isSuperAdmin && (
              <button
                type="button"
                className={`jr-box-btn ${boxTab === "sent" ? "active" : ""}`}
                onClick={() => setBoxTab("sent")}
              >
                My Sent Requests {boxTab === "sent" ? `(${requests.length})` : ""}
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#FFFFFF",
              border: "1px solid #E1EBEA",
              borderRadius: "12px",
              padding: "4px",
            }}
          >
            {[
              { key: "all", label: "All Statuses" },
              { key: "pending", label: "Pending" },
              { key: "sent", label: "Approved" },
              { key: "rejected", label: "Declined" },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: statusFilter === st.key ? "#073B3F" : "transparent",
                  color: statusFilter === st.key ? "#FFFFFF" : "#5C706E",
                  transition: "all 150ms ease",
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#5C706E" }}>
            Loading jewellery requests...
          </div>
        ) : requests.length === 0 ? (
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
            <JewelryIcon size={40} color="#B4CECC" style={{ marginBottom: "12px" }} />
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#073B3F" }}>
              No {boxTab} jewellery requests found
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "13.5px" }}>
              {boxTab === "received"
                ? "No pending allocation requests are awaiting your review."
                : "You haven't submitted any jewellery piece requests yet."}
            </p>
          </div>
        ) : (
          <div className="jr-list">
            {requests.map((req) => {
              const reqRoleBadge = ROLE_BADGE_CONFIG[req.requested_by_role] || {
                bg: "#F1F5F9",
                color: "#334155",
                border: "#E2E8F0",
                label: req.requested_by_role,
              };
              const isPending = req.status === "pending";

              return (
                <div key={req.id} className="jr-req-card">
                  <div className="jr-req-header">
                    <div className="jr-req-title">
                      <span>Request #{req.id}</span>
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: isPending ? "#FEF3C7" : req.status === "sent" ? "#E6F4EA" : "#FEF2F2",
                          color: isPending ? "#B45309" : req.status === "sent" ? "#166534" : "#DC2626",
                        }}
                      >
                        {isPending ? "Pending Review" : req.status === "sent" ? "Approved" : "Declined"}
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

                    {req.requested_to_name && (
                      <div className="jr-party-box">
                        <span style={{ fontWeight: 700, color: "#5C706E" }}>Target:</span>
                        <span>{req.requested_to_name}</span>
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

                  {/* Actions for Received / Super Admin */}
                  {boxTab === "received" && isPending && (
                    <div className="jr-req-footer">
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
                    </div>
                  )}
                </div>
              );
            })}
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
                    style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid #D6E2E1", background: "#FFFFFF" }}
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "8px 18px", borderRadius: "10px", border: "none", background: "#073B3F", color: "#FFFFFF", fontWeight: 700 }}
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
                  style={{ padding: "9px 16px", borderRadius: "10px", border: "1px solid #D6E2E1", background: "#FFFFFF" }}
                  onClick={() => setPwdModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: "#073B3F", color: "#FFFFFF", fontWeight: 700 }}
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
    </div>
  );
}
