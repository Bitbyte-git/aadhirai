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

export default function CreateRetailer() {
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

      const res = await api.post("/promotors/", payload);
      const responseData = res?.data;
      const createdName = `${form.first_name} ${form.last_name}`.trim();
      const createdId = responseData?.promotor_id || responseData?.id || responseData?.username || "";

      setSuccessPopup({
        title: "Retailer Created Successfully!",
        id: createdId,
        name: createdName,
        email: form.email,
        mobile: form.mobile_number,
        city: form.city_name,
        state: form.state,
      });

      setForm(emptyForm);
      setPincodeLookupMsg("");
      setConfirmPassword("");
      setPasswordError("");
    } catch (err) {
      setErrorPopup({ title: "Failed to Create Retailer", errors: parseErrorDetails(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="crm-page-wrapper">
      <style>{`
        .crm-page-wrapper {
          min-height: 100vh;
          background: #F8FAF9;
          padding: 28px 24px 70px;
          color: #1A2E2B;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .crm-main-container {
          max-width: 1320px;
          margin: 0 auto;
        }

        /* Top Header */
        .crm-header-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
          margin-bottom: 22px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .crm-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .crm-header-badge {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #073B3F;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E2BC82;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.18);
          flex-shrink: 0;
        }

        .crm-header-titles h1 {
          font-size: 22px;
          font-weight: 800;
          color: #073B3F;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
        }

        .crm-header-titles p {
          font-size: 13.5px;
          color: #647B78;
          margin: 0;
        }

        .crm-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .crm-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid #D1DFDE;
          color: #073B3F;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(7, 59, 63, 0.04);
        }

        .crm-back-btn:hover {
          background: #F0F5F4;
          border-color: #073B3F;
        }

        /* Master Form Card */
        .crm-form-master {
          background: #FFFFFF;
          border: 1px solid #DFE8E6;
          border-radius: 20px;
          padding: 32px 34px;
          box-shadow: 0 12px 36px rgba(7, 59, 63, 0.05);
        }

        /* Form Section Cards */
        .crm-section-box {
          background: #FAFCFC;
          border: 1px solid #E6EEED;
          border-radius: 14px;
          padding: 22px 24px;
          margin-bottom: 24px;
        }

        .crm-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid #E6EEED;
        }

        .crm-section-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #073B3F;
          color: #E2BC82;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .crm-section-title-wrap h2 {
          font-size: 15px;
          font-weight: 800;
          color: #073B3F;
          margin: 0 0 2px;
          letter-spacing: -0.01em;
        }

        .crm-section-title-wrap p {
          font-size: 12px;
          color: #728A87;
          margin: 0;
        }

        /* Form Grids */
        .crm-grid {
          display: grid;
          gap: 18px;
        }

        .crm-grid-3 {
          grid-template-columns: repeat(3, 1fr);
        }

        .crm-grid-2 {
          grid-template-columns: repeat(2, 1fr);
        }

        .crm-grid-1 {
          grid-template-columns: 1fr;
        }

        /* Field Wrapper */
        .crm-field {
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .crm-label {
          font-size: 12px;
          font-weight: 700;
          color: #4A6360;
          margin-bottom: 7px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .crm-required-star {
          color: #DC2626;
          font-size: 14px;
        }

        .crm-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .crm-input-icon {
          position: absolute;
          left: 14px;
          color: #7A9390;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .crm-input {
          width: 100%;
          height: 48px;
          background: #FFFFFF;
          border: 1px solid #D7E3E1;
          border-radius: 11px;
          padding: 0 14px 0 42px;
          font-size: 13.5px;
          color: #1A2E2B;
          box-sizing: border-box;
          outline: none;
          transition: all 0.2s ease;
        }

        .crm-input:hover {
          border-color: #B4C7C5;
        }

        .crm-input:focus {
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.12);
        }

        .crm-select {
          width: 100%;
          height: 48px;
          background: #FFFFFF;
          border: 1px solid #D7E3E1;
          border-radius: 11px;
          padding: 0 36px 0 42px;
          font-size: 13.5px;
          color: #1A2E2B;
          box-sizing: border-box;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23073B3F' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          transition: all 0.2s ease;
        }

        .crm-select:focus {
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.12);
        }

        .crm-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #7A9390;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .crm-eye-btn:hover {
          color: #073B3F;
        }

        .crm-field-error-text {
          font-size: 11.5px;
          color: #DC2626;
          font-weight: 600;
          margin-top: 4px;
        }

        .crm-field-help-text {
          font-size: 11.5px;
          font-weight: 600;
          margin-top: 5px;
        }

        /* Action Buttons */
        .crm-form-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #DFE8E6;
        }

        .crm-submit-btn {
          height: 48px;
          padding: 0 32px;
          background: #073B3F;
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 6px 18px rgba(7, 59, 63, 0.22);
          transition: all 0.2s ease;
        }

        .crm-submit-btn:hover:not(:disabled) {
          background: #0B4E53;
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(7, 59, 63, 0.28);
        }

        .crm-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .crm-reset-btn {
          height: 48px;
          padding: 0 24px;
          background: #FFFFFF;
          border: 1px solid #D1DFDE;
          border-radius: 12px;
          color: #4A6360;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .crm-reset-btn:hover {
          background: #F0F5F4;
          color: #073B3F;
          border-color: #B4C7C5;
        }

        /* Responsive Layout */
        @media (max-width: 1080px) {
          .crm-grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .crm-page-wrapper {
            padding: 18px 16px 50px;
          }
          .crm-form-master {
            padding: 20px 18px;
            border-radius: 16px;
          }
          .crm-section-box {
            padding: 16px 16px;
            border-radius: 12px;
          }
          .crm-grid-3, .crm-grid-2 {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .crm-form-actions {
            flex-direction: column;
            width: 100%;
          }
          .crm-submit-btn, .crm-reset-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="crm-main-container">
        {/* Top Page Header */}
        <div className="crm-header-card">
          <div className="crm-header-left">
            <div className="crm-header-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div className="crm-header-titles">
              <h1>Create Retailer</h1>
              <p>Register a new retailer partner with login credentials, location & business profile</p>
            </div>
          </div>
          <div className="crm-header-right">
            <CopyUrlButton />
            <button type="button" className="crm-back-btn" onClick={() => navigate(-1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="crm-form-master">
          <form onSubmit={handleSubmit}>
            {/* Section 1: Personal Information */}
            <div className="crm-section-box">
              <div className="crm-section-header">
                <div className="crm-section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="crm-section-title-wrap">
                  <h2>Personal Information</h2>
                  <p>Basic contact and profile details of the Retailer</p>
                </div>
              </div>

              <div className="crm-grid crm-grid-3">
                {/* Initial */}
                <div className="crm-field">
                  <label className="crm-label">Initial</label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20h16M4 4h16M12 4v16" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="initial"
                      placeholder="e.g. Mr / Mrs / Dr"
                      value={form.initial}
                      onChange={handleChange}
                      maxLength={5}
                    />
                  </div>
                </div>

                {/* First Name */}
                <div className="crm-field">
                  <label className="crm-label">
                    First Name <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="first_name"
                      placeholder="Enter first name"
                      value={form.first_name}
                      onChange={handleChange}
                      required
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="crm-field">
                  <label className="crm-label">
                    Last Name <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="last_name"
                      placeholder="Enter last name"
                      value={form.last_name}
                      onChange={handleChange}
                      required
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="crm-field">
                  <label className="crm-label">
                    Mobile Number <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="mobile_number"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={form.mobile_number}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="crm-field">
                  <label className="crm-label">Gender</label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3a9 9 0 0 0 0 18v-9" />
                      </svg>
                    </span>
                    <select
                      className="crm-select"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* DOB */}
                <div className="crm-field">
                  <label className="crm-label">Date of Birth</label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                    </span>
                    <input
                      type="date"
                      className="crm-input"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Marital Status */}
                <div className="crm-field">
                  <label className="crm-label">Marital Status</label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </span>
                    <select
                      className="crm-select"
                      name="married_status"
                      value={form.married_status}
                      onChange={handleChange}
                    >
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Anniversary Date (only if married) */}
                {form.married_status === "married" && (
                  <div className="crm-field">
                    <label className="crm-label">
                      Anniversary Date <span className="crm-required-star">*</span>
                    </label>
                    <div className="crm-input-wrapper">
                      <span className="crm-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                      </span>
                      <input
                        type="date"
                        className="crm-input"
                        name="anniversary_date"
                        value={form.anniversary_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Account Credentials */}
            <div className="crm-section-box">
              <div className="crm-section-header">
                <div className="crm-section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="crm-section-title-wrap">
                  <h2>Account Credentials</h2>
                  <p>Retailer login access details and dashboard password</p>
                </div>
              </div>

              <div className="crm-grid crm-grid-3">
                {/* Email */}
                <div className="crm-field">
                  <label className="crm-label">
                    Email Address <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      className="crm-input"
                      name="email"
                      placeholder="retailer@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="crm-field">
                  <label className="crm-label">
                    Password <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="16" r="1" />
                        <rect x="3" y="10" width="18" height="12" rx="2" />
                        <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="crm-input"
                      name="password"
                      placeholder="Minimum 6+ characters"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="crm-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="crm-field">
                  <label className="crm-label">
                    Confirm Password <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 12 2 2 4-4" />
                        <rect x="3" y="10" width="18" height="12" rx="2" />
                        <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                      </svg>
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="crm-input"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="crm-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordError && <div className="crm-field-error-text">{passwordError}</div>}
                </div>
              </div>
            </div>

            {/* Section 3: Residential & Store Address */}
            <div className="crm-section-box">
              <div className="crm-section-header">
                <div className="crm-section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="crm-section-title-wrap">
                  <h2>Residential / Store Address</h2>
                  <p>Physical store or communication location with automatic pincode lookup</p>
                </div>
              </div>

              <div className="crm-grid crm-grid-3">
                {/* Door No */}
                <div className="crm-field">
                  <label className="crm-label">
                    Door No / Bldg <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="door_no"
                      placeholder="e.g. 14/B, Ground Floor"
                      value={form.door_no}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Street Name */}
                <div className="crm-field">
                  <label className="crm-label">
                    Street Name <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" x2="20" y1="9" y2="9" />
                        <line x1="4" x2="20" y1="15" y2="15" />
                        <line x1="10" x2="8" y1="3" y2="21" />
                        <line x1="16" x2="14" y1="3" y2="21" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="street_name"
                      placeholder="e.g. Gandhi Bazar Road"
                      value={form.street_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Pincode */}
                <div className="crm-field">
                  <label className="crm-label">
                    Pincode <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="pincode"
                      placeholder="6-digit pincode"
                      value={form.pincode}
                      onChange={handlePincodeChange}
                      required
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                  {pincodeLookupMsg && (
                    <div
                      className="crm-field-help-text"
                      style={{
                        color: pincodeLookupMsg.includes("auto-filled")
                          ? "#0C4044"
                          : pincodeLookupMsg.includes("not found") || pincodeLookupMsg.includes("Unable")
                          ? "#DC2626"
                          : "#647B78",
                      }}
                    >
                      {pincodeLookupMsg}
                    </div>
                  )}
                </div>

                {/* Town / Area */}
                <div className="crm-field">
                  <label className="crm-label">
                    Town / Area <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                        <line x1="8" x2="8" y1="2" y2="18" />
                        <line x1="16" x2="16" y1="6" y2="22" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="town_name"
                      placeholder="Town / Locality"
                      value={form.town_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div className="crm-field">
                  <label className="crm-label">
                    City <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                        <line x1="9" x2="9.01" y1="6" y2="6" />
                        <line x1="15" x2="15.01" y1="6" y2="6" />
                        <line x1="9" x2="9.01" y1="10" y2="10" />
                        <line x1="15" x2="15.01" y1="10" y2="10" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="city_name"
                      placeholder="City name"
                      value={form.city_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* District */}
                <div className="crm-field">
                  <label className="crm-label">
                    District <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="district"
                      placeholder="District"
                      value={form.district}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* State */}
                <div className="crm-field">
                  <label className="crm-label">
                    State <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="state"
                      placeholder="State name"
                      value={form.state}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Government Identity */}
            <div className="crm-section-box">
              <div className="crm-section-header">
                <div className="crm-section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                <div className="crm-section-title-wrap">
                  <h2>Government Identity</h2>
                  <p>Statutory KYC verification and compliance records</p>
                </div>
              </div>

              <div className="crm-grid crm-grid-2">
                {/* Aadhaar Number */}
                <div className="crm-field">
                  <label className="crm-label">
                    Aadhaar Number <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="aadhaar_no"
                      placeholder="12-digit Aadhaar number"
                      value={form.aadhaar_no}
                      onChange={handleChange}
                      required
                      maxLength={12}
                    />
                  </div>
                </div>

                {/* PAN Number */}
                <div className="crm-field">
                  <label className="crm-label">
                    PAN Number <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="pan_no"
                      placeholder="10-digit PAN (e.g. ABCDE1234F)"
                      value={form.pan_no}
                      onChange={(e) => setForm({ ...form, pan_no: e.target.value.toUpperCase() })}
                      required
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Professional & Financial Details */}
            <div className="crm-section-box">
              <div className="crm-section-header">
                <div className="crm-section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className="crm-section-title-wrap">
                  <h2>Professional & Financial Details</h2>
                  <p>Retail trade nature and estimated annual turnover</p>
                </div>
              </div>

              <div className="crm-grid crm-grid-3">
                {/* Occupation */}
                <div className="crm-field">
                  <label className="crm-label">
                    Occupation <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        <rect width="20" height="14" x="2" y="6" rx="2" />
                      </svg>
                    </span>
                    <select
                      className="crm-select"
                      name="occupation"
                      value={form.occupation}
                      onChange={handleChange}
                    >
                      <option value="business">Business</option>
                      <option value="employee">Employee</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                </div>

                {/* Occupation Detail */}
                <div className="crm-field">
                  <label className="crm-label">Occupation Detail</label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" x2="21" y1="6" y2="6" />
                        <line x1="8" x2="21" y1="12" y2="12" />
                        <line x1="8" x2="21" y1="18" y2="18" />
                        <line x1="3" x2="3.01" y1="6" y2="6" />
                        <line x1="3" x2="3.01" y1="12" y2="12" />
                        <line x1="3" x2="3.01" y1="18" y2="18" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="occupation_detail"
                      placeholder="e.g. Retail Jewelry / Kirana Store"
                      value={form.occupation_detail}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Annual Salary / Turnover */}
                <div className="crm-field">
                  <label className="crm-label">
                    Annual Salary / Turnover <span className="crm-required-star">*</span>
                  </label>
                  <div className="crm-input-wrapper">
                    <span className="crm-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                        <path d="M12 18V6" />
                      </svg>
                    </span>
                    <input
                      className="crm-input"
                      name="annual_salary"
                      placeholder="e.g. 5,00,000"
                      value={form.annual_salary}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="crm-form-actions">
              <button type="submit" className="crm-submit-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span>Creating Retailer...</span>
                  </>
                ) : (
                  <>
                    <span>+ Create Retailer</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
              <button
                type="button"
                className="crm-reset-btn"
                onClick={() => {
                  setForm(emptyForm);
                  setConfirmPassword("");
                  setPasswordError("");
                  setPincodeLookupMsg("");
                }}
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Popup Modal */}
      {successPopup && (
        <div
          onClick={() => setSuccessPopup(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7, 31, 34, 0.58)",
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
              maxWidth: "520px",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(7, 59, 63, 0.25)",
              border: "1px solid rgba(204, 168, 129, 0.35)",
            }}
          >
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
                    RETAILER REGISTRATION COMPLETE
                  </span>
                  <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800 }}>{successPopup.title}</h3>
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
            <div style={{ padding: "24px 28px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {successPopup.id && (
                  <div
                    style={{
                      gridColumn: "span 2",
                      padding: "12px 14px",
                      background: "#F4F8F7",
                      borderRadius: "12px",
                      border: "1px solid #D6E4E2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#5F7875" }}>
                        Retailer ID
                      </small>
                      <strong style={{ color: "#073B3F", fontSize: "15px" }}>{successPopup.id}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(successPopup.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#073B3F",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Copy ID
                    </button>
                  </div>
                )}
                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>
                    Retailer Name
                  </small>
                  <strong style={{ color: "#073B3F", fontSize: "13.5px" }}>{successPopup.name || "—"}</strong>
                </div>
                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>
                    Location
                  </small>
                  <strong style={{ color: "#073B3F", fontSize: "13.5px" }}>
                    {[successPopup.city, successPopup.state].filter(Boolean).join(", ") || "—"}
                  </strong>
                </div>
                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>
                    Email
                  </small>
                  <strong style={{ color: "#073B3F", fontSize: "13px", wordBreak: "break-all" }}>{successPopup.email || "—"}</strong>
                </div>
                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>
                    Mobile Number
                  </small>
                  <strong style={{ color: "#073B3F", fontSize: "13.5px" }}>{successPopup.mobile || "—"}</strong>
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

      {/* Error Popup Modal */}
      {errorPopup && (
        <div
          onClick={() => setErrorPopup(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7, 31, 34, 0.58)",
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
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>{errorPopup.title}</h3>
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
    </div>
  );
}
