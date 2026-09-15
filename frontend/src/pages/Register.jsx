import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";
import CustomerFooter from "../collection/CustomerFooter";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

function getPasswordStrength(pw) {
  if (!pw) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "#C92035", width: "33%" };
  if (score <= 4) return { label: "Medium", color: "#BB8958", width: "66%" };
  return { label: "Strong", color: "#0C4044", width: "100%" };
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ref = searchParams.get("ref");
  const redirectUrl = searchParams.get("redirect");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "male",
    mobile_number: "",
    dob: "",
    door_no: "",
    street_name: "",
    pincode: "",
    town_name: "",
    city_name: "",
    district: "",
    state: "",
    email: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [globalMsg, setGlobalMsg] = useState({ type: "", text: "" });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState("");

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");

  const otpInputRefs = useRef([]);

  // Resend Timer Countdown
  useEffect(() => {
    let timer;
    if (showOtpModal && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, resendTimer]);

  // Focus first OTP input on modal open
  useEffect(() => {
    if (showOtpModal) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [showOtpModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePincodeChange = async (e) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => ({ ...prev, pincode: rawVal }));
    setPincodeStatus("");

    if (rawVal.length === 6) {
      setPincodeLoading(true);
      setPincodeStatus("Looking up postal details...");
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${rawVal}`);
        const data = await res.json();
        if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setForm((prev) => ({
            ...prev,
            town_name: prev.town_name || po.Name || "",
            city_name: po.District || prev.city_name || "",
            district: po.District || prev.district || "",
            state: po.State || prev.state || "",
          }));
          setPincodeStatus("Location details auto-filled");
        } else {
          setPincodeStatus("Pincode verified — please verify city & state");
        }
      } catch {
        setPincodeStatus("Please enter your city and state manually");
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.first_name.trim()) errors.first_name = "First name is required";
    if (!form.last_name.trim()) errors.last_name = "Last name is required";
    if (!form.gender) errors.gender = "Gender is required";
    if (!form.mobile_number.trim() || form.mobile_number.replace(/\D/g, "").length < 10) {
      errors.mobile_number = "Valid 10-digit phone number is required";
    }
    if (!form.dob) errors.dob = "Date of birth is required";
    if (!form.door_no.trim()) errors.door_no = "Door No is required";
    if (!form.street_name.trim()) errors.street_name = "Street name is required";
    if (!form.pincode.trim() || form.pincode.length !== 6) errors.pincode = "6-digit pincode is required";
    if (!form.town_name.trim()) errors.town_name = "Town is required";
    if (!form.city_name.trim()) errors.city_name = "City is required";
    if (!form.district.trim()) errors.district = "District is required";
    if (!form.state.trim()) errors.state = "State is required";

    if (!form.email.trim() || !form.email.includes("@")) {
      errors.email = "Valid email address is required";
    }
    if (!form.password || form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (form.password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartVerification = async (e) => {
    e.preventDefault();
    setGlobalMsg({ type: "", text: "" });

    if (!validateForm()) {
      setGlobalMsg({ type: "error", text: "Please fill in all required fields accurately." });
      return;
    }

    setSendingOtp(true);
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
      };
      const res = await api.post("/register-send-otp/", payload);

      setShowOtpModal(true);
      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setOtpNotice("");
      setGlobalMsg({
        type: "success",
        text: res.data?.message || "Verification code sent to your email!",
      });
    } catch (err) {
      const errText = err.response?.data?.error || "Failed to send verification code. Please check your email.";
      setGlobalMsg({ type: "error", text: errText });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setOtpError("");

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(60);
    setOtpError("");

    try {
      await api.post("/register-send-otp/", {
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
      });
      setOtpError("");
      setGlobalMsg({ type: "success", text: "New OTP code sent to your email." });
    } catch (err) {
      setOtpError(err.response?.data?.error || "Failed to resend code. Please try again.");
      setCanResend(true);
    }
  };

  const handleVerifyAndRegister = async (otpOverride) => {
    const enteredOtp = otpOverride || otpDigits.join("");
    if (enteredOtp.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setOtpSubmitting(true);
    setOtpError("");

    try {
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        otp: enteredOtp,
        ref: ref || undefined,
      };

      const res = await api.post("/register-verify-otp/", payload);

      // Save tokens & log in user immediately
      const { access, refresh: refreshToken, role, email } = res.data;
      if (access) {
        localStorage.setItem("token", access);
        if (refreshToken) localStorage.setItem("refresh", refreshToken);
        if (role) localStorage.setItem("role", role);
        if (email) localStorage.setItem("email", email);

        // Notify global auth events if any
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("bb_auth_change"));
      }

      setShowOtpModal(false);
      setGlobalMsg({
        type: "success",
        text: "Account registered successfully! Redirecting you...",
      });

      // Direct purchase or target redirect
      setTimeout(() => {
        if (redirectUrl) {
          navigate(redirectUrl, { replace: true });
        } else {
          navigate("/customer", { replace: true });
        }
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Verification failed. Please check the code and try again.";
      setOtpError(errorMsg);
    } finally {
      setOtpSubmitting(false);
    }
  };

  return (
    <main className="ath-reg-root">
      <style>{`
        .ath-reg-root {
          min-height: 100vh;
          background: #FDFDFC;
          color: #111817;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        .ath-reg-shell {
          width: calc(100% - 40px);
          max-width: 920px;
          margin: 0 auto;
          padding: 40px 0 80px;
          box-sizing: border-box;
        }
        .ath-reg-hero {
          text-align: center;
          margin-bottom: 32px;
        }
        .ath-reg-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(7, 59, 63, 0.08);
          border: 1px solid rgba(7, 59, 63, 0.2);
          color: #073B3F;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .ath-reg-title {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(2rem, 3.8vw, 2.6rem);
          color: #073B3F;
          font-weight: 700;
          margin: 0 0 10px;
          letter-spacing: -0.02em;
        }
        .ath-reg-subtitle {
          color: #5d6f6c;
          font-size: 15px;
          line-height: 1.6;
          max-width: 580px;
          margin: 0 auto;
        }
        .ath-reg-card {
          background: #ffffff;
          border: 1px solid #D6E4E3;
          border-radius: 24px;
          padding: 36px 40px;
          box-shadow: 0 16px 48px rgba(7, 59, 63, 0.07);
        }
        .ath-reg-alert {
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ath-reg-alert.success {
          background: rgba(12, 64, 68, 0.08);
          border: 1px solid rgba(12, 64, 68, 0.24);
          color: #0C4044;
        }
        .ath-reg-alert.error {
          background: rgba(201, 32, 53, 0.08);
          border: 1px solid rgba(201, 32, 53, 0.24);
          color: #C92035;
        }
        .ath-reg-sec {
          margin-bottom: 28px;
          padding-bottom: 26px;
          border-bottom: 1px solid #edf4f3;
        }
        .ath-reg-sec:last-of-type {
          border-bottom: none;
          margin-bottom: 16px;
          padding-bottom: 0;
        }
        .ath-reg-sec-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .ath-reg-sec-num {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #073B3F;
          color: #D4AF37;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ath-reg-sec-title {
          font-size: 15px;
          font-weight: 800;
          color: #073B3F;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0;
        }
        .ath-reg-grid {
          display: grid;
          gap: 16px;
        }
        .ath-reg-grid.cols-3 {
          grid-template-columns: repeat(3, 1fr);
        }
        .ath-reg-grid.cols-2 {
          grid-template-columns: repeat(2, 1fr);
        }
        .ath-reg-grid.cols-4 {
          grid-template-columns: repeat(4, 1fr);
        }
        .ath-field {
          display: flex;
          flex-direction: column;
        }
        .ath-field label {
          font-size: 12px;
          font-weight: 700;
          color: #073B3F;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .ath-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .ath-field input,
        .ath-field select {
          width: 100%;
          border: 1px solid #CFDFDE;
          background: #FAFDFD;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: #111817;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .ath-field input:focus,
        .ath-field select:focus {
          border-color: #073B3F;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.12);
        }
        .ath-field.has-error input,
        .ath-field.has-error select {
          border-color: #C92035;
          background: #fffafa;
        }
        .ath-err-text {
          color: #C92035;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
        }
        .ath-status-text {
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
        }
        .ath-pw-toggle {
          position: absolute;
          right: 12px;
          background: transparent;
          border: 0;
          color: #5d6f6c;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .ath-pw-bar-track {
          height: 4px;
          background: #E8F0EF;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 6px;
        }
        .ath-pw-bar-fill {
          height: 100%;
          transition: width 0.3s ease, background 0.3s ease;
        }
        .ath-reg-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .ath-btn-submit {
          min-height: 50px;
          padding: 0 34px;
          border-radius: 999px;
          background: #073B3F;
          color: #FFFFFF;
          border: 0;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(7, 59, 63, 0.22);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .ath-btn-submit:hover:not(:disabled) {
          background: #094a4f;
          transform: translateY(-1px);
        }
        .ath-btn-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .ath-signin-prompt {
          font-size: 14px;
          color: #5d6f6c;
        }
        .ath-signin-link {
          color: #073B3F;
          font-weight: 800;
          text-decoration: underline;
          cursor: pointer;
          margin-left: 6px;
        }

        /* Modal Styles */
        .ath-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(7, 24, 26, 0.68);
          backdrop-filter: blur(6px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: athFadeIn 0.2s ease;
        }
        .ath-modal-box {
          background: #FFFFFF;
          border-radius: 24px;
          max-width: 480px;
          width: 100%;
          padding: 36px 32px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24);
          text-align: center;
          animation: athScaleUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid #D6E4E3;
          position: relative;
        }
        .ath-modal-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 16px;
          border-radius: 18px;
          background: rgba(7, 59, 63, 0.08);
          border: 1px solid rgba(7, 59, 63, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #073B3F;
        }
        .ath-modal-title {
          font-family: Georgia, serif;
          font-size: 22px;
          color: #073B3F;
          margin: 0 0 8px;
          font-weight: 700;
        }
        .ath-modal-desc {
          font-size: 13.5px;
          color: #5d6f6c;
          line-height: 1.55;
          margin: 0 0 24px;
        }
        .ath-otp-inputs {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .ath-otp-digit {
          width: 46px;
          height: 54px;
          font-size: 24px;
          font-weight: 800;
          text-align: center;
          border: 1.5px solid #CFDFDE;
          border-radius: 12px;
          background: #FAFDFD;
          color: #073B3F;
          outline: none;
          transition: all 0.2s;
        }
        .ath-otp-digit:focus {
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.15);
          background: #ffffff;
        }
        .ath-otp-err {
          color: #C92035;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .ath-otp-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ath-btn-verify {
          min-height: 48px;
          border-radius: 999px;
          background: #073B3F;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          border: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(7, 59, 63, 0.2);
        }
        .ath-btn-verify:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ath-resend-wrap {
          font-size: 12.5px;
          color: #5d6f6c;
        }
        .ath-resend-btn {
          background: transparent;
          border: 0;
          color: #073B3F;
          font-weight: 800;
          cursor: pointer;
          text-decoration: underline;
          padding: 0 4px;
        }
        .ath-resend-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          text-decoration: none;
        }
        .ath-close-modal {
          position: absolute;
          top: 18px;
          right: 18px;
          background: transparent;
          border: 0;
          font-size: 20px;
          color: #728481;
          cursor: pointer;
        }

        @keyframes athFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes athScaleUp {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
          .ath-reg-shell {
            width: calc(100% - 24px);
            padding: 24px 0 60px;
          }
          .ath-reg-card {
            padding: 24px 20px;
            border-radius: 20px;
          }
          .ath-reg-grid.cols-3,
          .ath-reg-grid.cols-2,
          .ath-reg-grid.cols-4 {
            grid-template-columns: 1fr;
          }
          .ath-reg-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .ath-btn-submit {
            width: 100%;
          }
          .ath-signin-prompt {
            text-align: center;
          }
          .ath-otp-digit {
            width: 38px;
            height: 48px;
            font-size: 20px;
          }
        }
      `}</style>

      <div className="ath-reg-shell">
        <header className="ath-reg-hero">
          <div className="ath-reg-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Athirai Customer Onboarding
          </div>
          <h1 className="ath-reg-title">Create Your Customer Account</h1>
          <p className="ath-reg-subtitle">
            Fill in your details below to activate verified customer privileges and enjoy direct purchasing, orders, and exclusive jewellery collections.
          </p>
        </header>

        {globalMsg.text && (
          <div className={`ath-reg-alert ${globalMsg.type}`}>
            {globalMsg.type === "success" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{globalMsg.text}</span>
          </div>
        )}

        <div className="ath-reg-card">
          <form onSubmit={handleStartVerification}>
            {/* Section 1: Personal Details */}
            <div className="ath-reg-sec">
              <div className="ath-reg-sec-head">
                <div className="ath-reg-sec-num">1</div>
                <h3 className="ath-reg-sec-title">Personal Details</h3>
              </div>
              <div className="ath-reg-grid cols-3">
                <div className={`ath-field ${formErrors.first_name ? "has-error" : ""}`}>
                  <label htmlFor="first_name">First Name *</label>
                  <input
                    id="first_name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                  />
                  {formErrors.first_name && <span className="ath-err-text">{formErrors.first_name}</span>}
                </div>

                <div className={`ath-field ${formErrors.last_name ? "has-error" : ""}`}>
                  <label htmlFor="last_name">Last Name *</label>
                  <input
                    id="last_name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                  />
                  {formErrors.last_name && <span className="ath-err-text">{formErrors.last_name}</span>}
                </div>

                <div className={`ath-field ${formErrors.gender ? "has-error" : ""}`}>
                  <label htmlFor="gender">Gender *</label>
                  <select id="gender" name="gender" value={form.gender} onChange={handleChange} required>
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.gender && <span className="ath-err-text">{formErrors.gender}</span>}
                </div>

                <div className={`ath-field ${formErrors.mobile_number ? "has-error" : ""}`}>
                  <label htmlFor="mobile_number">Phone Number *</label>
                  <input
                    id="mobile_number"
                    name="mobile_number"
                    value={form.mobile_number}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    inputMode="numeric"
                    required
                  />
                  {formErrors.mobile_number && <span className="ath-err-text">{formErrors.mobile_number}</span>}
                </div>

                <div className={`ath-field ${formErrors.dob ? "has-error" : ""}`}>
                  <label htmlFor="dob">Date of Birth (DOB) *</label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.dob && <span className="ath-err-text">{formErrors.dob}</span>}
                </div>
              </div>
            </div>

            {/* Section 2: Address */}
            <div className="ath-reg-sec">
              <div className="ath-reg-sec-head">
                <div className="ath-reg-sec-num">2</div>
                <h3 className="ath-reg-sec-title">Delivery & Billing Address</h3>
              </div>
              <div className="ath-reg-grid cols-3">
                <div className={`ath-field ${formErrors.door_no ? "has-error" : ""}`}>
                  <label htmlFor="door_no">Door No *</label>
                  <input
                    id="door_no"
                    name="door_no"
                    value={form.door_no}
                    onChange={handleChange}
                    placeholder="Door / Flat / Building No"
                    required
                  />
                  {formErrors.door_no && <span className="ath-err-text">{formErrors.door_no}</span>}
                </div>

                <div className={`ath-field ${formErrors.street_name ? "has-error" : ""}`}>
                  <label htmlFor="street_name">Street Name *</label>
                  <input
                    id="street_name"
                    name="street_name"
                    value={form.street_name}
                    onChange={handleChange}
                    placeholder="Street / Area / Colony"
                    required
                  />
                  {formErrors.street_name && <span className="ath-err-text">{formErrors.street_name}</span>}
                </div>

                <div className={`ath-field ${formErrors.pincode ? "has-error" : ""}`}>
                  <label htmlFor="pincode">Pincode * (6-digit)</label>
                  <input
                    id="pincode"
                    name="pincode"
                    value={form.pincode}
                    onChange={handlePincodeChange}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    inputMode="numeric"
                    required
                  />
                  {pincodeStatus && (
                    <span
                      className="ath-status-text"
                      style={{
                        color: pincodeStatus.includes("auto-filled")
                          ? "#0C4044"
                          : pincodeLoading
                          ? "#BB8958"
                          : "#5d6f6c",
                      }}
                    >
                      {pincodeStatus}
                    </span>
                  )}
                  {formErrors.pincode && <span className="ath-err-text">{formErrors.pincode}</span>}
                </div>

                <div className={`ath-field ${formErrors.town_name ? "has-error" : ""}`}>
                  <label htmlFor="town_name">Town *</label>
                  <input
                    id="town_name"
                    name="town_name"
                    value={form.town_name}
                    onChange={handleChange}
                    placeholder="Town"
                    required
                  />
                  {formErrors.town_name && <span className="ath-err-text">{formErrors.town_name}</span>}
                </div>

                <div className={`ath-field ${formErrors.city_name ? "has-error" : ""}`}>
                  <label htmlFor="city_name">City *</label>
                  <input
                    id="city_name"
                    name="city_name"
                    value={form.city_name}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                  {formErrors.city_name && <span className="ath-err-text">{formErrors.city_name}</span>}
                </div>

                <div className={`ath-field ${formErrors.district ? "has-error" : ""}`}>
                  <label htmlFor="district">District *</label>
                  <input
                    id="district"
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    placeholder="District"
                    required
                  />
                  {formErrors.district && <span className="ath-err-text">{formErrors.district}</span>}
                </div>

                <div className={`ath-field ${formErrors.state ? "has-error" : ""}`}>
                  <label htmlFor="state">State *</label>
                  <input
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    required
                  />
                  {formErrors.state && <span className="ath-err-text">{formErrors.state}</span>}
                </div>
              </div>
            </div>

            {/* Section 3: Credentials */}
            <div className="ath-reg-sec">
              <div className="ath-reg-sec-head">
                <div className="ath-reg-sec-num">3</div>
                <h3 className="ath-reg-sec-title">Account Security & Verification</h3>
              </div>
              <div className="ath-reg-grid cols-3">
                <div className={`ath-field ${formErrors.email ? "has-error" : ""}`}>
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email to receive OTP"
                    required
                  />
                  {formErrors.email && <span className="ath-err-text">{formErrors.email}</span>}
                </div>

                <div className={`ath-field ${formErrors.password ? "has-error" : ""}`}>
                  <label htmlFor="password">Create Password *</label>
                  <div className="ath-input-wrap">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      className="ath-pw-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {form.password && (
                    <div className="ath-pw-bar-track">
                      <div
                        className="ath-pw-bar-fill"
                        style={{
                          width: getPasswordStrength(form.password).width,
                          background: getPasswordStrength(form.password).color,
                        }}
                      />
                    </div>
                  )}
                  {formErrors.password && <span className="ath-err-text">{formErrors.password}</span>}
                </div>

                <div className={`ath-field ${formErrors.confirmPassword ? "has-error" : ""}`}>
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formErrors.confirmPassword) {
                        setFormErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                    placeholder="Re-enter password"
                    required
                  />
                  {formErrors.confirmPassword && (
                    <span className="ath-err-text">{formErrors.confirmPassword}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="ath-reg-actions">
              <button type="submit" className="ath-btn-submit" disabled={sendingOtp}>
                {sendingOtp ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ath-spin">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                    Sending Verification Code...
                  </>
                ) : (
                  <>
                    Continue & Verify Email
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              <div className="ath-signin-prompt">
                Already have an Athirai account?
                <span className="ath-signin-link" onClick={() => navigate("/login")}>
                  Sign in here
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="ath-modal-overlay">
          <div className="ath-modal-box">
            <button
              type="button"
              className="ath-close-modal"
              onClick={() => setShowOtpModal(false)}
              title="Close"
            >
              ✕
            </button>

            <div className="ath-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            <h3 className="ath-modal-title">Verify Your Email</h3>
            <p className="ath-modal-desc">
              We have dispatched a 6-digit OTP code to:
              <br />
              <strong style={{ color: "#073B3F" }}>{form.email}</strong>
              <br />
              <span style={{ fontSize: "12px", color: "#829491" }}>
                (Code expires in 10 minutes. Please check your inbox)
              </span>
            </p>

            <div className="ath-otp-inputs" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  className="ath-otp-digit"
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {otpError && <div className="ath-otp-err">{otpError}</div>}

            <div className="ath-otp-actions">
              <button
                type="button"
                className="ath-btn-verify"
                onClick={handleVerifyAndRegister}
                disabled={otpSubmitting || otpDigits.join("").length !== 6}
              >
                {otpSubmitting ? "Verifying & Creating Account..." : "Verify & Complete Registration"}
              </button>

              <div className="ath-resend-wrap">
                Didn't receive code?{" "}
                <button
                  type="button"
                  className="ath-resend-btn"
                  disabled={!canResend}
                  onClick={handleResendOtp}
                >
                  {canResend ? "Resend OTP Code" : `Resend in ${resendTimer}s`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomerFooter />
    </main>
  );
}