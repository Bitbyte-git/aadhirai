import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import CopyUrlButton from "../collection/CopyUrlButton";

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
  occupation: "business",
  occupation_detail: "",
  annual_salary: "",
};

export default function CreateWholesaleDealer() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successPopup, setSuccessPopup] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  const [submitting, setSubmitting] = useState(false);
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
            town_name: po.Name || prev.town_name,
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
      setErrorPopup({ title: "Missing Information", errors: ["Anniversary Date is required when Married status is selected."] });
      return;
    }
    if (form.password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setErrorPopup({ title: "Password Mismatch", errors: ["The password and confirmation password do not match. Please verify them."] });
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.dob) delete payload.dob;
      if (payload.married_status !== "married") delete payload.anniversary_date;

      const res = await api.post("/sub-dealers/", payload);
      const createdName = `${form.first_name} ${form.last_name}`.trim();
      const newId = res.data?.sub_dealer_id || res.data?.wholesale_dealer_id || "";

      setSuccessPopup({
        title: "Wholesale Dealer Created Successfully!",
        id: newId,
        name: createdName,
        email: form.email,
        mobile: form.mobile_number,
        city: form.city_name,
      });

      setForm(emptyForm);
      setPincodeLookupMsg("");
      setConfirmPassword("");
      setPasswordError("");
    } catch (err) {
      setErrorPopup({ title: "Failed to Create Wholesale Dealer", errors: parseErrorDetails(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="as-container">
      <style>{`
        .as-container {
          min-height: calc(100vh - 74px);
          background: #F4F7F6;
          padding: 30px clamp(18px, 2.5vw, 36px) 60px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          box-sizing: border-box;
          color: #11201E;
        }
        .as-shell {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
        }
        .as-header-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .as-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .as-header-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #073B3F;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.2);
          flex-shrink: 0;
        }
        .as-header-title {
          font-size: 22px;
          font-weight: 800;
          color: #073B3F;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .as-header-sub {
          font-size: 13px;
          font-weight: 500;
          color: #647B78;
          margin-top: 3px;
        }
        .as-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .as-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          background: #FFFFFF;
          border: 1px solid #D5E0DD;
          border-radius: 10px;
          color: #455A57;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: all 0.16s ease;
        }
        .as-back-btn:hover {
          background: #F4F7F6;
          border-color: #073B3F;
          color: #073B3F;
          transform: translateY(-1px);
        }

        .as-card {
          background: #FFFFFF;
          border: 1px solid #DFE8E6;
          border-radius: 20px;
          padding: 28px 30px;
          box-shadow: 0 4px 24px rgba(7, 59, 63, 0.04);
        }
        .as-section-card {
          background: #FAFCFC;
          border: 1px solid #E6EEED;
          border-radius: 14px;
          padding: 22px 24px;
          margin-bottom: 22px;
        }
        .as-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .as-section-head-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .as-section-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #073B3F;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.18);
        }
        .as-section-title {
          font-size: 14.5px;
          font-weight: 800;
          color: #073B3F;
          letter-spacing: -0.01em;
        }
        .as-section-sub {
          font-size: 11.5px;
          color: #6C827F;
          font-weight: 500;
          margin-top: 1px;
        }

        .as-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px 18px;
        }
        .as-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px 18px;
        }
        .as-span-3 {
          grid-column: span 3;
        }

        .as-field {
          display: flex;
          flex-direction: column;
        }
        .as-label {
          font-size: 12px;
          font-weight: 700;
          color: #2F4340;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .as-req {
          color: #DC2626;
          font-weight: 800;
        }
        .as-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1.5px solid #D7E3E1;
          border-radius: 11px;
          height: 48px;
          padding: 0 13px;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .as-input-wrap:focus-within {
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.08);
          background: #FFFFFF;
        }
        .as-input-wrap.has-error {
          border-color: #DC2626;
        }
        .as-input-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7B928F;
          margin-right: 10px;
          flex-shrink: 0;
        }
        .as-input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          height: 100%;
          color: #0E1F1D;
          font-size: 13.5px;
          font-weight: 500;
          font-family: inherit;
        }
        .as-input::placeholder {
          color: #92A6A3;
          font-weight: 450;
        }
        .as-select {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          height: 100%;
          color: #0E1F1D;
          font-size: 13.5px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
        }
        .as-select-chevron {
          color: #7B928F;
          pointer-events: none;
          display: flex;
          align-items: center;
          margin-left: 6px;
        }
        .as-eye-btn {
          background: transparent;
          border: none;
          color: #839794;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
          margin-left: 6px;
        }
        .as-eye-btn:hover {
          color: #073B3F;
        }

        .as-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: #073B3F;
          border: 1px solid #073B3F;
          border-radius: 12px;
          font-weight: 750;
          color: #FFFFFF;
          font-size: 14.5px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.18);
        }
        .as-submit-btn:hover:not(:disabled) {
          background: #0C4E53;
          border-color: #0C4E53;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(7, 59, 63, 0.26);
        }

        @media (max-width: 1024px) {
          .as-grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
          .as-span-3 {
            grid-column: span 2;
          }
        }
        @media (max-width: 768px) {
          .as-container {
            padding: 18px 14px 50px !important;
          }
          .as-card {
            padding: 18px 16px !important;
            border-radius: 16px !important;
          }
          .as-section-card {
            padding: 16px 14px !important;
            border-radius: 14px !important;
          }
          .as-grid-3, .as-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .as-span-3 {
            grid-column: span 1 !important;
          }
          .as-header-wrap {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 14px;
          }
          .as-header-actions {
            width: 100%;
            display: flex;
            gap: 10px;
          }
          .as-header-actions button, .as-header-actions .bb-copy-url-btn {
            flex: 1;
            text-align: center;
            justify-content: center;
          }
          .as-submit-btn {
            width: 100% !important;
            justify-content: center;
            padding: 14px 20px !important;
          }
        }
      `}</style>

      <div className="as-shell">
        {/* Page Header */}
        <div className="as-header-wrap">
          <div className="as-header-left">
            <div className="as-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <h1 className="as-header-title">Create Wholesale Dealer</h1>
              <div className="as-header-sub">
                Register a new Wholesale Dealer partner with full credentials and jurisdiction
              </div>
            </div>
          </div>

          <div className="as-header-actions">
            <CopyUrlButton
              style={{
                borderRadius: '10px',
                padding: '9px 18px',
                background: '#FFFFFF',
                border: '1px solid #D5E0DD',
                fontSize: '13px',
                fontWeight: 650,
                color: '#073B3F',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              }}
            />
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="as-back-btn"
              title="Go back"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Master Form Card */}
        <div className="as-card">
          <form onSubmit={handleSubmit}>

            {/* ── SECTION 1: PERSONAL INFORMATION ── */}
            <div className="as-section-card">
              <div className="as-section-header">
                <div className="as-section-head-left">
                  <div className="as-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <div className="as-section-title">Personal Information</div>
                    <div className="as-section-sub">Wholesale Dealer identity and primary records</div>
                  </div>
                </div>
              </div>

              <div className="as-grid-3">
                {/* Initial */}
                <div className="as-field">
                  <label className="as-label">Initial</label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    <input
                      name="initial"
                      maxLength={5}
                      value={form.initial}
                      onChange={handleChange}
                      placeholder="e.g. S."
                      className="as-input"
                    />
                  </div>
                </div>

                {/* First Name */}
                <div className="as-field">
                  <label className="as-label">
                    First Name <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    <input
                      name="first_name"
                      maxLength={100}
                      value={form.first_name}
                      onChange={handleChange}
                      required
                      placeholder="Given name"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="as-field">
                  <label className="as-label">
                    Last Name <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    <input
                      name="last_name"
                      maxLength={100}
                      value={form.last_name}
                      onChange={handleChange}
                      required
                      placeholder="Family name"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="as-field">
                  <label className="as-label">
                    Mobile Number <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </span>
                    <input
                      name="mobile_number"
                      maxLength={10}
                      value={form.mobile_number}
                      onChange={handleChange}
                      required
                      inputMode="numeric"
                      placeholder="10-digit mobile"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="as-field">
                  <label className="as-label">
                    Gender <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </span>
                    <select name="gender" value={form.gender} onChange={handleChange} required className="as-select">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="as-select-chevron">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="as-field">
                  <label className="as-label">Date of Birth</label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </span>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Marital Status */}
                <div className="as-field">
                  <label className="as-label">Marital Status</label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </span>
                    <select name="married_status" value={form.married_status} onChange={handleChange} className="as-select">
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="as-select-chevron">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                  </div>
                </div>

                {/* Anniversary Date */}
                {form.married_status === 'married' && (
                  <div className="as-field">
                    <label className="as-label">Anniversary Date</label>
                    <div className="as-input-wrap">
                      <span className="as-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </span>
                      <input
                        type="date"
                        name="anniversary_date"
                        value={form.anniversary_date}
                        onChange={handleChange}
                        className="as-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 2: ACCOUNT & SECURITY ── */}
            <div className="as-section-card">
              <div className="as-section-header">
                <div className="as-section-head-left">
                  <div className="as-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <div className="as-section-title">Account &amp; Security</div>
                    <div className="as-section-sub">Wholesale dealer authentication and portal login</div>
                  </div>
                </div>
              </div>

              <div className="as-grid-3">
                {/* Email Address */}
                <div className="as-field">
                  <label className="as-label">
                    Email Address <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="wholesaler@athirai.com"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="as-field">
                  <label className="as-label">
                    Password <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="as-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="as-eye-btn"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="as-field">
                  <label className="as-label">
                    Confirm Password <span className="as-req">*</span>
                  </label>
                  <div className={`as-input-wrap ${passwordError ? 'has-error' : ''}`}>
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                      }}
                      required
                      placeholder="Confirm password"
                      className="as-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="as-eye-btn"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <div style={{ color: '#DC2626', fontSize: '11.5px', fontWeight: 650, marginTop: '4px' }}>
                      {passwordError}
                    </div>
                  )}
                  {confirmPassword && !passwordError && (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: confirmPassword === form.password ? '#009957' : '#DC2626', marginTop: '4px' }}>
                      {confirmPassword === form.password ? '✓ Passwords match' : '✕ Passwords do not match'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── SECTION 3: ADDRESS DETAILS ── */}
            <div className="as-section-card">
              <div className="as-section-header">
                <div className="as-section-head-left">
                  <div className="as-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <div className="as-section-title">Address Details</div>
                    <div className="as-section-sub">Business jurisdiction and postal location</div>
                  </div>
                </div>
              </div>

              <div className="as-grid-3">
                {/* Door No */}
                <div className="as-field">
                  <label className="as-label">
                    Door No <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                    </span>
                    <input
                      name="door_no"
                      value={form.door_no}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 10/B"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Street Name */}
                <div className="as-field">
                  <label className="as-label">
                    Street Name <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z"/><path d="M12 13v9"/><path d="M12 2v4"/></svg>
                    </span>
                    <input
                      name="street_name"
                      value={form.street_name}
                      onChange={handleChange}
                      required
                      placeholder="Street name"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Pincode */}
                <div className="as-field">
                  <label className="as-label">
                    Pincode <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    </span>
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={handlePincodeChange}
                      required
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="6-digit pincode"
                      className="as-input"
                    />
                  </div>
                  {pincodeLookupMsg && (
                    <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '4px', color: pincodeLookupMsg.includes('auto-filled') ? '#073B3F' : '#DC2626' }}>
                      {pincodeLookupMsg}
                    </div>
                  )}
                </div>

                {/* Town */}
                <div className="as-field">
                  <label className="as-label">
                    Town <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M6 21V7l8-4v18"/><path d="M14 11h4v10"/></svg>
                    </span>
                    <input
                      name="town_name"
                      value={form.town_name}
                      onChange={handleChange}
                      required
                      placeholder="Town / Locality"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="as-field">
                  <label className="as-label">
                    City <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M6 21V7l8-4v18"/><path d="M14 11h4v10"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>
                    </span>
                    <input
                      name="city_name"
                      value={form.city_name}
                      onChange={handleChange}
                      required
                      placeholder="City"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* District */}
                <div className="as-field">
                  <label className="as-label">
                    District <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
                    </span>
                    <input
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                      required
                      placeholder="District"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* State */}
                <div className="as-field">
                  <label className="as-label">
                    State <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
                    </span>
                    <input
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      required
                      placeholder="State"
                      className="as-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: IDENTITY ── */}
            <div className="as-section-card">
              <div className="as-section-header">
                <div className="as-section-head-left">
                  <div className="as-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <div className="as-section-title">Identity</div>
                    <div className="as-section-sub">Statutory business and partner verification</div>
                  </div>
                </div>
              </div>

              <div className="as-grid-2">
                {/* Aadhaar No */}
                <div className="as-field">
                  <label className="as-label">
                    Aadhaar No <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>
                    </span>
                    <input
                      name="aadhaar_no"
                      value={form.aadhaar_no}
                      onChange={handleChange}
                      required
                      maxLength={12}
                      inputMode="numeric"
                      placeholder="12-digit Aadhaar number"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* PAN No */}
                <div className="as-field">
                  <label className="as-label">
                    PAN No <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </span>
                    <input
                      name="pan_no"
                      value={form.pan_no}
                      onChange={(e) => setForm((p) => ({ ...p, pan_no: e.target.value.toUpperCase() }))}
                      required
                      maxLength={10}
                      placeholder="10-character PAN"
                      className="as-input"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 5: PROFESSIONAL BACKGROUND ── */}
            <div className="as-section-card">
              <div className="as-section-header">
                <div className="as-section-head-left">
                  <div className="as-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div>
                    <div className="as-section-title">Professional Background</div>
                    <div className="as-section-sub">Wholesale trade and compensation</div>
                  </div>
                </div>
              </div>

              <div className="as-grid-3">
                {/* Occupation */}
                <div className="as-field">
                  <label className="as-label">
                    Occupation <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    </span>
                    <select
                      name="occupation"
                      value={form.occupation}
                      onChange={handleChange}
                      required
                      className="as-select"
                    >
                      <option value="business">Business</option>
                      <option value="employee">Employee</option>
                      <option value="others">Others</option>
                    </select>
                    <span className="as-select-chevron">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                  </div>
                </div>

                {/* Detail */}
                <div className="as-field">
                  <label className="as-label">Occupation Detail</label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </span>
                    <input
                      name="occupation_detail"
                      value={form.occupation_detail}
                      onChange={handleChange}
                      placeholder="e.g. Wholesale Bullion Dealer"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Annual Salary */}
                <div className="as-field">
                  <label className="as-label">
                    Annual Salary <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </span>
                    <input
                      name="annual_salary"
                      value={form.annual_salary}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 700000"
                      className="as-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={submitting}
                className="as-submit-btn"
                style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>{submitting ? 'Creating Wholesale Dealer...' : 'Create Wholesale Dealer'}</span>
                {!submitting && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="as-back-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Popup Modal */}
      {successPopup && (
        <div
          onClick={() => setSuccessPopup(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(7,31,34,0.6)', backdropFilter: 'blur(8px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '32px 30px', boxShadow: '0 30px 80px rgba(7,31,34,0.3)', border: '1px solid rgba(204,168,129,0.3)', textAlign: 'center' }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,167,103,0.12)', border: '2px solid #00A767', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00A767" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#073B3F' }}>
              {successPopup.title}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#53615F' }}>
              New Wholesale Dealer registered with active credentials.
            </p>

            <div style={{ textAlign: 'left', background: '#FAFBFB', border: '1px solid #EDF2F1', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F0F4F4' }}>
                <span style={{ color: '#7A8987' }}>Name:</span>
                <strong style={{ color: '#073B3F' }}>{successPopup.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F0F4F4' }}>
                <span style={{ color: '#7A8987' }}>Email:</span>
                <strong style={{ color: '#073B3F' }}>{successPopup.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F0F4F4' }}>
                <span style={{ color: '#7A8987' }}>Mobile:</span>
                <strong style={{ color: '#073B3F' }}>{successPopup.mobile}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#7A8987' }}>City:</span>
                <strong style={{ color: '#073B3F' }}>{successPopup.city || '—'}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setSuccessPopup(null); navigate(-1); }}
              className="as-submit-btn"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Done &amp; Continue
            </button>
          </div>
        </div>
      )}

      {/* Error Popup Modal */}
      {errorPopup && (
        <div
          onClick={() => setErrorPopup(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(7,31,34,0.6)', backdropFilter: 'blur(8px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '32px 30px', boxShadow: '0 30px 80px rgba(7,31,34,0.3)', border: '1px solid rgba(220,38,38,0.3)', textAlign: 'center' }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(220,38,38,0.12)', border: '2px solid #DC2626', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#073B3F' }}>
              {errorPopup.title}
            </h3>
            <div style={{ textAlign: 'left', background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '12px', padding: '14px 18px', margin: '18px 0 24px', maxHeight: '200px', overflowY: 'auto' }}>
              {errorPopup.errors.map((err, i) => (
                <div key={i} style={{ color: '#DC2626', fontSize: '13px', fontWeight: 600, marginBottom: i < errorPopup.errors.length - 1 ? '8px' : 0 }}>
                  • {err}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setErrorPopup(null)}
              className="as-submit-btn"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Close &amp; Fix Issues
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
