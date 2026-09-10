import { useState, useEffect } from "react";
import api from "../api";
import CustomerFooter from "./CustomerFooter";
import CopyUrlButton from "./CopyUrlButton";

const OCCUPATIONS = ["employee", "business", "others"];

const emptyForm = {
  initial: "",
  first_name: "",
  last_name: "",
  mobile_number: "",
  gender: "male",
  dob: "",
  married_status: "single",
  anniversary_date: "",
  email: "",
  password: "",
  door_no: "",
  street_name: "",
  pincode: "",
  town_name: "",
  city_name: "",
  district: "",
  state: "",
  aadhaar_no: "",
  pan_no: "",
  occupation: "",
  occupation_detail: "",
  annual_salary: "",
  assigned_promotor_id: "",
};


export default function CreateCustomer() {
  const [form, setForm] = useState(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [msg, setMsg] = useState("");
  const [successPopup, setSuccessPopup] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [allPromotors, setAllPromotors] = useState([]);
  const [selectedPromotor, setSelectedPromotor] = useState(null);
  const [pincodeLookupMsg, setPincodeLookupMsg] = useState("");

  const parseErrorDetails = (err) => {
    const data = err.response?.data;
    if (!data) return [err.message || "An unexpected error occurred."];
    if (typeof data === "string") return [data];
    if (data.error) return [data.error];
    if (data.detail) return [data.detail];
    if (data.message) return [data.message];

    if (typeof data === "object") {
      const list = [];
      for (const [key, val] of Object.entries(data)) {
        const fieldTitle = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const msgText = Array.isArray(val) ? val.join(" ") : String(val);
        list.push(`${fieldTitle}: ${msgText}`);
      }
      if (list.length > 0) return list;
    }
    return ["Please verify the information you entered and try again."];
  };

  // Info of the customer who is currently logged in (creating this new customer)
  const [superCustomer, setSuperCustomer] = useState(null);
  const [superCustomerLoading, setSuperCustomerLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get("/my-info/")
      .then((res) => {
        if (alive) setSuperCustomer(res.data || null);
      })
      .catch(() => {
        if (alive) setSuperCustomer(null);
      })
      .finally(() => {
        if (alive) setSuperCustomerLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    api
      .get("/promotors/list")
      .then((res) => {
        const payload = res.data;
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
          ? payload.results
          : [];
        setAllPromotors(rows);
      })
      .catch(() => setAllPromotors([]));
  }, []);

  useEffect(() => {
    if (superCustomer && allPromotors.length > 0) {
      const myPr = allPromotors.find(
        (p) => p.id === superCustomer.id || p.promotor_id === superCustomer.promotor_id
      );
      if (myPr) {
        setSelectedPromotor(myPr);
        setForm((prev) => ({ ...prev, assigned_promotor_id: myPr.id }));
      }
    }
  }, [superCustomer, allPromotors]);

  const superCustomerName = superCustomer?.name || "";

  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => ({ ...prev, pincode: value }));
    setPincodeLookupMsg("");

    if (value.length === 6) {
      setPincodeLookupMsg("Fetching location details...");
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await res.json();
        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setForm((prev) => ({
            ...prev,
            city_name: po.District || prev.city_name,
            district: po.District || prev.district,
            state: po.State || prev.state,
          }));
          setPincodeLookupMsg("Location details auto-filled");
        } else {
          setPincodeLookupMsg("Pincode not found — please enter manually");
        }
      } catch {
        setPincodeLookupMsg("Unable to fetch location — please enter manually");
      }
    }
  };

  const handlePromotorChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setSelectedPromotor(null);
      setForm((prev) => ({ ...prev, assigned_promotor_id: "" }));
      return;
    }
    const id = parseInt(val, 10);
    const pr = allPromotors.find((p) => p.id === id);
    setSelectedPromotor(pr || null);
    setForm((prev) => ({ ...prev, assigned_promotor_id: id }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "married_status" && value !== "married") {
      setForm({ ...form, married_status: value, anniversary_date: "" });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.married_status === "married" && !form.anniversary_date) {
      setErrorPopup({
        title: "Missing Information",
        errors: ["Anniversary Date is required when Married status is selected."],
      });
      return;
    }

    if (form.password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setErrorPopup({
        title: "Password Mismatch",
        errors: ["The password and confirmation password do not match. Please verify them."],
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.dob) delete payload.dob;
      if (payload.married_status !== "married") delete payload.anniversary_date;
      if (!payload.assigned_promotor_id) delete payload.assigned_promotor_id;

      const res = await api.post("/customers/", payload);
      const newCustId = res.data?.customer_id || "";
      const createdName = `${form.first_name} ${form.last_name}`.trim();

      setSuccessPopup({
        title: "Customer Created Successfully!",
        customer_id: newCustId,
        name: createdName,
        email: form.email,
        mobile: form.mobile_number,
        city: form.city_name,
      });

      setForm(emptyForm);
      setSelectedPromotor(null);
      setPincodeLookupMsg("");
      setConfirmPassword("");
      setPasswordError("");
      setMsg("");
    } catch (err) {
      const errorList = parseErrorDetails(err);
      setErrorPopup({
        title: "Failed to Create Customer",
        errors: errorList,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cc-page">
      <style>{`
        .cc-page {
          min-height: 100vh;
          background: var(--bb-bg, #FDFDFC);
          color: var(--bb-ink, #111817);
        }

        .cc-shell {
          width: calc(100% - 48px);
          max-width: 1120px;
          margin: 0 auto;
          padding: 36px 0 64px;
          box-sizing: border-box;
        }

        .cc-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .cc-kicker {
          color: var(--bb-teal-dark, #073B3F);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .cc-header h1 {
          margin: 4px 0 0;
          color: #1a1a1a;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.9rem;
          font-weight: 600;
          line-height: 1.1;
        }

        .cc-header p {
          margin: 6px 0 0;
          color: var(--bb-muted, #7A8987);
          font-size: 13px;
        }

        .cc-msg {
          border-radius: 12px;
          padding: 13px 18px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .cc-msg.success {
          background: rgba(12, 64, 68, 0.08);
          border: 1px solid rgba(12, 64, 68, 0.28);
          color: #0C4044;
        }

        .cc-msg.error {
          background: rgba(201, 32, 53, 0.08);
          border: 1px solid rgba(201, 32, 53, 0.28);
          color: #C92035;
        }

        .cc-card {
          background: #fff;
          border: 1px solid #D1DFDE;
          border-radius: 20px;
          padding: 30px 32px;
          margin-bottom: 26px;
          box-shadow: 0 10px 28px rgba(7,59,63,0.06);
        }

        .cc-section-title {
          color: var(--bb-teal-dark, #073B3F);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px;
        }

        .cc-sub-label {
          color: var(--bb-teal-dark, #073B3F);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 4px 0 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid #D1DFDE;
        }

        .cc-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 20px;
        }

        .cc-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .cc-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .cc-grid.cols-init { grid-template-columns: 0.4fr 1fr 1fr; }

        .cc-field label {
          display: block;
          color: var(--bb-muted, #7A8987);
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 7px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cc-field input,
        .cc-field select {
          width: 100%;
          background: #FDFDFC;
          border: 1px solid #BDCFCE;
          border-radius: 12px;
          padding: 12px 14px;
          color: #111817;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .cc-field input:focus,
        .cc-field select:focus {
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7,59,63,0.10);
        }

        .cc-field.error input {
          border-color: #C92035;
        }

        .cc-field-error {
          color: #C92035;
          font-size: 12px;
          margin-top: 6px;
        }

        .cc-field.readonly input {
          background: #F3F3F0;
          color: #073B3F;
          font-weight: 700;
          opacity: 0.85;
          cursor: not-allowed;
        }

        .cc-field.readonly input::placeholder {
          color: #7A8987;
          font-weight: 500;
        }

        .cc-super-card {
          background: rgba(7,59,63,0.04);
          border: 1px solid rgba(7,59,63,0.18);
          border-radius: 14px;
          padding: 18px 20px 4px;
          margin-bottom: 20px;
        }

        .cc-super-note {
          margin: -8px 0 16px;
          color: var(--bb-muted, #7A8987);
          font-size: 12px;
        }

        .cc-actions {
          display: flex;
          gap: 12px;
          margin-top: 6px;
        }

        .cc-btn-primary {
          padding: 13px 30px;
          background: #073B3F;
          border: none;
          border-radius: 999px;
          font-weight: 800;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 14px 30px rgba(7,59,63,0.24);
          transition: transform 160ms ease;
        }

        .cc-btn-primary:hover { transform: translateY(-2px); }

        .cc-btn-secondary {
          padding: 13px 24px;
          background: #F3F3F0;
          border: 1px solid #D1DFDE;
          border-radius: 999px;
          color: #073B3F;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }



        @media (max-width: 900px) {
          .cc-grid.cols-3 { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .cc-shell { width: calc(100% - 24px); padding: 20px 0 40px; }
          .cc-card { padding: 20px 14px; }
          .cc-grid.cols-2,
          .cc-grid.cols-3,
          .cc-grid.cols-init { grid-template-columns: 1fr; }
          .cc-actions { flex-direction: column; }
          .cc-actions button { width: 100%; }
        }
      `}</style>

      <div className="cc-shell">
        <div className="cc-header">
          <div>
            <span className="cc-kicker">Customer Management</span>
            <h1>Create Customer</h1>
            <p>Fill in the details below to register a new customer.</p>
          </div>
        </div>

        {msg && <div className={`cc-msg ${msgType}`}>{msg}</div>}

        <div className="cc-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <h2 className="cc-section-title">New Customer Details</h2>
            <CopyUrlButton />
          </div>

          <form onSubmit={handleSubmit}>
            <p className="cc-sub-label">Personal Info</p>
            <div className="cc-grid cols-init">
              <div className="cc-field">
                <label>Initial</label>
                <input name="initial" value={form.initial} onChange={handleChange} maxLength={5} />
              </div>
              <div className="cc-field">
                <label>First Name *</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} required maxLength={100} />
              </div>
              <div className="cc-field">
                <label>Last Name *</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} required maxLength={100} />
              </div>
            </div>

            <div className="cc-grid cols-3">
              <div className="cc-field">
                <label>Mobile *</label>
                <input name="mobile_number" maxLength={10} value={form.mobile_number} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>Password *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required />
              </div>
            </div>

            <div className="cc-grid cols-3">
              <div className={`cc-field ${passwordError ? "error" : ""}`}>
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                  required
                />
                {passwordError && <div className="cc-field-error">{passwordError}</div>}
              </div>
            </div>

            <div className="cc-grid cols-3">
              <div className="cc-field">
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="cc-field">
                <label>DOB</label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} />
              </div>
              <div className="cc-field">
                <label>Married Status</label>
                <select name="married_status" value={form.married_status} onChange={handleChange}>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {form.married_status === "married" && (
              <div className="cc-grid cols-3">
                <div className="cc-field">
                  <label>Anniversary Date</label>
                  <input
                    type="date"
                    name="anniversary_date"
                    value={form.anniversary_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <p className="cc-sub-label">Address</p>
            <div className="cc-grid cols-3">
              <div className="cc-field">
                <label>Door No *</label>
                <input name="door_no" value={form.door_no} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>Street Name *</label>
                <input name="street_name" value={form.street_name} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>Pincode *</label>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handlePincodeChange}
                  required
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="6-digit pincode"
                />
                {pincodeLookupMsg && (
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      marginTop: "4px",
                      color: pincodeLookupMsg.includes("auto-filled")
                        ? "#0C4044"
                        : pincodeLookupMsg.includes("not found") || pincodeLookupMsg.includes("Unable")
                        ? "#C92035"
                        : "#7A8987",
                    }}
                  >
                    {pincodeLookupMsg}
                  </div>
                )}
              </div>
              <div className="cc-field">
                <label>Town *</label>
                <input name="town_name" value={form.town_name} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>City *</label>
                <input name="city_name" value={form.city_name} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>District *</label>
                <input name="district" value={form.district} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label>State *</label>
                <input name="state" value={form.state} onChange={handleChange} required />
              </div>
            </div>

            <p className="cc-sub-label">Identity</p>
            <div className="cc-grid cols-2">
              <div className="cc-field">
                <label>Aadhaar No *</label>
                <input name="aadhaar_no" value={form.aadhaar_no} onChange={handleChange} required maxLength={12} />
              </div>
              <div className="cc-field">
                <label>PAN No *</label>
                <input name="pan_no" value={form.pan_no} onChange={handleChange} required maxLength={10} />
              </div>
            </div>

            <p className="cc-sub-label">Occupation</p>
            <div className="cc-grid cols-3">
              <div className="cc-field">
                <label>Occupation *</label>
                <select name="occupation" value={form.occupation} onChange={handleChange} required>
                  <option value="">Select</option>
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o}>
                      {o.charAt(0).toUpperCase() + o.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cc-field">
                <label>Detail</label>
                <input name="occupation_detail" value={form.occupation_detail} onChange={handleChange} />
              </div>
              <div className="cc-field">
                <label>Annual Salary *</label>
                <input name="annual_salary" value={form.annual_salary} onChange={handleChange} required />
              </div>
            </div>

            <p className="cc-sub-label">
              {superCustomer?.role === "promotor" ? "Promotor Info" : "Super Admin Info"}
            </p>
            {superCustomer?.role === "promotor" ? (
              <div className="cc-grid cols-3">
                <div className="cc-field">
                  <label>Promotor ID *</label>
                  <select
                    name="assigned_promotor_id"
                    value={form.assigned_promotor_id || ""}
                    onChange={handlePromotorChange}
                  >
                    <option value="">Select Promotor ID</option>
                    {allPromotors.map((p, idx) => (
                      <option key={p.promotor_id || p.id || idx} value={p.id}>
                        {p.promotor_id || `PR-${p.id}`} {p.first_name ? `(${p.first_name} ${p.last_name || ""})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cc-field readonly">
                  <label>Promotor Name</label>
                  <input
                    value={selectedPromotor ? `${selectedPromotor.first_name || ""} ${selectedPromotor.last_name || ""}`.trim() : ""}
                    readOnly
                    placeholder="Auto fetch"
                  />
                </div>
                <div className="cc-field readonly">
                  <label>Promotor Contact</label>
                  <input
                    value={selectedPromotor?.mobile_number || selectedPromotor?.promotor_contact_no || ""}
                    readOnly
                    placeholder="Auto fetch"
                  />
                </div>
              </div>
            ) : (
              <div className="cc-grid cols-3">
                <div className="cc-field readonly">
                  <label>Super Admin ID</label>
                  <input
                    value={superCustomerLoading ? "Fetching..." : (superCustomer?.id || "SUPER_ADMIN")}
                    readOnly
                    placeholder="Auto fetch"
                  />
                </div>
                <div className="cc-field readonly">
                  <label>Super Admin Name</label>
                  <input
                    value={superCustomerLoading ? "Fetching..." : (superCustomerName || superCustomer?.name || "Super Admin")}
                    readOnly
                    placeholder="Auto fetch"
                  />
                </div>
                <div className="cc-field readonly">
                  <label>Super Admin Contact</label>
                  <input
                    value={superCustomerLoading ? "Fetching..." : (superCustomer?.phone || superCustomer?.email || "Super Admin")}
                    readOnly
                    placeholder="Auto fetch"
                  />
                </div>
              </div>
            )}

            <div className="cc-actions">
              <button type="submit" className="cc-btn-primary" disabled={submitting}>
                {submitting ? "Creating Customer..." : "Create Customer"}
              </button>
              <button
                type="button"
                className="cc-btn-secondary"
                onClick={() => {
                  setForm(emptyForm);
                  setConfirmPassword("");
                  setPasswordError("");
                  setMsg("");
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── SUCCESS POPUP MODAL ── */}
      {successPopup && (
        <div
          onClick={() => setSuccessPopup(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7, 31, 34, 0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "500px",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(7, 59, 63, 0.25)",
              border: "1px solid rgba(204, 168, 129, 0.35)",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #073B3F 0%, #0F5C62 100%)",
                padding: "24px 28px",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    color: "#34D399",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: 900,
                  }}
                >
                  ✓
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#E1C497",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    CUSTOMER CREATION SUCCESS
                  </span>
                  <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800 }}>
                    {successPopup.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessPopup(null)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Details */}
            <div style={{ padding: "24px 28px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {successPopup.customer_id && (
                  <div
                    style={{
                      gridColumn: "span 2",
                      padding: "14px 16px",
                      background: "#F4F8F7",
                      borderRadius: "14px",
                      border: "1px solid #D9E8E6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <small
                        style={{
                          display: "block",
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color: "#728A87",
                          marginBottom: "2px",
                        }}
                      >
                        Generated Customer ID
                      </small>
                      <strong
                        style={{
                          fontFamily: "monospace",
                          fontSize: "16px",
                          color: "#073B3F",
                        }}
                      >
                        {successPopup.customer_id}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(successPopup.customer_id);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      }}
                      style={{
                        padding: "6px 12px",
                        background: copiedId ? "#D1FAE5" : "#FFFFFF",
                        border: "1px solid #C4D9D6",
                        borderRadius: "8px",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: copiedId ? "#065F46" : "#073B3F",
                        cursor: "pointer",
                      }}
                    >
                      {copiedId ? "Copied! ✓" : "Copy ID ⧉"}
                    </button>
                  </div>
                )}

                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>
                    Customer Name
                  </small>
                  <strong style={{ color: "#073B3F", fontSize: "13.5px" }}>
                    {successPopup.name || "—"}
                  </strong>
                </div>

                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>
                    City
                  </small>
                  <strong style={{ color: "#073B3F", fontSize: "13.5px" }}>
                    {successPopup.city || "—"}
                  </strong>
                </div>

                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>
                    Email
                  </small>
                  <strong style={{ color: "#073B3F", fontSize: "13px", wordBreak: "break-all" }}>
                    {successPopup.email || "—"}
                  </strong>
                </div>

                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>
                    Mobile Number
                  </small>
                  <strong style={{ color: "#073B3F", fontSize: "13.5px" }}>
                    {successPopup.mobile || "—"}
                  </strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setSuccessPopup(null)}
                  style={{
                    padding: "11px 26px",
                    background: "#073B3F",
                    border: "none",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(7, 59, 63, 0.2)",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFESSIONAL ERROR POPUP MODAL ── */}
      {errorPopup && (
        <div
          onClick={() => setErrorPopup(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7, 31, 34, 0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "480px",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(220, 38, 38, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
                padding: "22px 26px",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: 900,
                  }}
                >
                  !
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#FEE2E2",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    SUBMISSION ERROR
                  </span>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>
                    {errorPopup.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorPopup(null)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px 28px" }}>
              <p style={{ margin: "0 0 14px", color: "#6B7280", fontSize: "13.5px" }}>
                Please review and correct the following items:
              </p>
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FEE2E2",
                  borderRadius: "14px",
                  padding: "14px 18px",
                  marginBottom: "20px",
                }}
              >
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#991B1B", fontSize: "13.5px", lineHeight: 1.6 }}>
                  {errorPopup.errors.map((msg, i) => (
                    <li key={i} style={{ fontWeight: 600 }}>{msg}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setErrorPopup(null)}
                  style={{
                    padding: "10px 24px",
                    background: "#DC2626",
                    border: "none",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Review & Fix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomerFooter />
    </div>
  );
}