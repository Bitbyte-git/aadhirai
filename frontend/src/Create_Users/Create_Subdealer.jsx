import { useState } from "react";
import api from "../api";
import CopyUrlButton from "../collection/CopyUrlButton";
import CustomDropdown from "../components/CustomDropdown";

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
};

export default function CreateSubdealer() {
  const [form, setForm] = useState(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
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

      await api.post("/sub-dealers/", payload);
      const createdName = `${form.first_name} ${form.last_name}`.trim();

      setSuccessPopup({
        title: "Sub Dealer Created Successfully!",
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
      setErrorPopup({ title: "Failed to Create Sub Dealer", errors: parseErrorDetails(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="csd-page">
      <style>{`
        .csd-page { min-height: 100vh; background: #FDFDFC; color: #111817; }
        .csd-shell { width: calc(100% - 48px); max-width: 1120px; margin: 0 auto; padding: 36px 0 64px; box-sizing: border-box; }
        .csd-header { margin-bottom: 22px; }
        .csd-kicker { color: #073B3F; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
        .csd-header h1 { margin: 4px 0 0; color: #1a1a1a; font-family: Georgia, "Times New Roman", serif; font-size: 1.9rem; font-weight: 600; line-height: 1.1; }
        .csd-header p { margin: 6px 0 0; color: #7A8987; font-size: 13px; }
        .csd-card { background: #fff; border: 1px solid #D1DFDE; border-radius: 20px; padding: 30px 32px; margin-bottom: 26px; box-shadow: 0 10px 28px rgba(7,59,63,0.06); }
        .csd-section-title { color: #073B3F; font-family: Georgia, "Times New Roman", serif; font-size: 20px; font-weight: 600; margin: 0 0 20px; }
        .csd-sub-label { color: #073B3F; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; margin: 4px 0 14px; padding-bottom: 10px; border-bottom: 1px solid #D1DFDE; }
        .csd-grid { display: grid; gap: 16px; margin-bottom: 20px; }
        .csd-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .csd-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .csd-grid.cols-init { grid-template-columns: 0.4fr 1fr 1fr; }
        .csd-field label { display: block; color: #7A8987; font-size: 12px; font-weight: 700; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.04em; }
        .csd-field input, .csd-field select { width: 100%; background: #FDFDFC; border: 1px solid #BDCFCE; border-radius: 12px; padding: 12px 14px; color: #111817; font-size: 14px; outline: none; box-sizing: border-box; transition: border-color 150ms ease, box-shadow 150ms ease; }
        .csd-field input:focus, .csd-field select:focus { border-color: #073B3F; box-shadow: 0 0 0 3px rgba(7,59,63,0.10); }
        .csd-field.error input { border-color: #C92035; }
        .csd-field-error { color: #C92035; font-size: 12px; margin-top: 6px; }
        .csd-actions { display: flex; gap: 12px; margin-top: 6px; }
        .csd-btn-primary { padding: 13px 30px; background: #073B3F; border: none; border-radius: 999px; font-weight: 800; color: #fff; font-size: 14px; cursor: pointer; box-shadow: 0 14px 30px rgba(7,59,63,0.24); transition: transform 160ms ease; }
        .csd-btn-primary:hover { transform: translateY(-2px); }
        .csd-btn-secondary { padding: 13px 24px; background: #F3F3F0; border: 1px solid #D1DFDE; border-radius: 999px; color: #073B3F; font-size: 14px; font-weight: 700; cursor: pointer; }
        @media (max-width: 900px) { .csd-grid.cols-3 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .csd-shell { width: calc(100% - 20px); padding: 18px 0 36px; }
          .csd-card { padding: 20px 14px; border-radius: 14px; margin-bottom: 18px; }
          .csd-grid.cols-2, .csd-grid.cols-3, .csd-grid.cols-init { grid-template-columns: 1fr; gap: 12px; }
          .csd-actions { flex-direction: column; gap: 10px; }
          .csd-actions button { width: 100%; min-height: 48px; justify-content: center; }
          .csd-field input, .csd-field select { font-size: 16px; min-height: 46px; }
          .csd-header h1 { font-size: 1.55rem; }
        }
        @media (max-width: 480px) {
          .csd-shell { width: calc(100% - 16px); padding: 14px 0 28px; }
          .csd-card { padding: 16px 12px; }
          .csd-section-title { font-size: 18px; margin-bottom: 14px; }
        }
      `}</style>

      <div className="csd-shell">
        <div className="csd-header">
          <span className="csd-kicker">Network Operations</span>
          <h1>Create Sub Dealer</h1>
          <p>Fill in the details below to register a new sub dealer under you.</p>
        </div>

        <div className="csd-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <h2 className="csd-section-title">New Sub Dealer Details</h2>
            <CopyUrlButton />
          </div>

          <form onSubmit={handleSubmit}>
            <p className="csd-sub-label">Personal Info</p>
            <div className="csd-grid cols-init">
              <div className="csd-field"><label>Initial</label><input name="initial" value={form.initial} onChange={handleChange} maxLength={5} /></div>
              <div className="csd-field"><label>First Name *</label><input name="first_name" value={form.first_name} onChange={handleChange} required maxLength={100} /></div>
              <div className="csd-field"><label>Last Name *</label><input name="last_name" value={form.last_name} onChange={handleChange} required maxLength={100} /></div>
            </div>

            <div className="csd-grid cols-3">
              <div className="csd-field"><label>Mobile *</label><input name="mobile_number" maxLength={10} value={form.mobile_number} onChange={handleChange} required /></div>
              <div className="csd-field"><label>Email *</label><input type="email" name="email" value={form.email} onChange={handleChange} required /></div>
              <div className="csd-field"><label>Password *</label><input type="password" name="password" value={form.password} onChange={handleChange} required /></div>
            </div>

            <div className="csd-grid cols-3">
              <div className={`csd-field ${passwordError ? "error" : ""}`}>
                <label>Confirm Password *</label>
                <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }} required />
                {passwordError && <div className="csd-field-error">{passwordError}</div>}
              </div>
            </div>

            <div className="csd-grid cols-3">
              <div className="csd-field">
                <label>Gender</label>
                <CustomDropdown value={form.gender} onChange={(val) => setForm((prev) => ({ ...prev, gender: val }))}
                  options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]}
                  placeholder="Select" style={{ width: "100%" }} buttonStyle={{ height: "46px", borderRadius: "12px", border: "1px solid #BDCFCE", background: "#FDFDFC" }} />
              </div>
              <div className="csd-field"><label>DOB</label><input type="date" name="dob" value={form.dob} onChange={handleChange} /></div>
              <div className="csd-field">
                <label>Married Status</label>
                <CustomDropdown value={form.married_status}
                  onChange={(val) => setForm((prev) => ({ ...prev, married_status: val, anniversary_date: val === "married" ? prev.anniversary_date : "" }))}
                  options={[{ value: "single", label: "Single" }, { value: "married", label: "Married" }, { value: "other", label: "Other" }]}
                  placeholder="Select" style={{ width: "100%" }} buttonStyle={{ height: "46px", borderRadius: "12px", border: "1px solid #BDCFCE", background: "#FDFDFC" }} />
              </div>
            </div>

            {form.married_status === "married" && (
              <div className="csd-grid cols-3">
                <div className="csd-field"><label>Anniversary Date</label><input type="date" name="anniversary_date" value={form.anniversary_date} onChange={handleChange} /></div>
              </div>
            )}

            <p className="csd-sub-label">Address</p>
            <div className="csd-grid cols-3">
              <div className="csd-field"><label>Door No *</label><input name="door_no" value={form.door_no} onChange={handleChange} required /></div>
              <div className="csd-field"><label>Street Name *</label><input name="street_name" value={form.street_name} onChange={handleChange} required /></div>
              <div className="csd-field">
                <label>Pincode *</label>
                <input name="pincode" value={form.pincode} onChange={handlePincodeChange} required maxLength={6} inputMode="numeric" placeholder="6-digit pincode" />
                {pincodeLookupMsg && (
                  <div style={{ fontSize: "11px", fontWeight: 700, marginTop: "4px", color: pincodeLookupMsg.includes("auto-filled") ? "#0C4044" : pincodeLookupMsg.includes("not found") || pincodeLookupMsg.includes("Unable") ? "#C92035" : "#7A8987" }}>
                    {pincodeLookupMsg}
                  </div>
                )}
              </div>
              <div className="csd-field"><label>Town *</label><input name="town_name" value={form.town_name} onChange={handleChange} required /></div>
              <div className="csd-field"><label>City *</label><input name="city_name" value={form.city_name} onChange={handleChange} required /></div>
              <div className="csd-field"><label>District *</label><input name="district" value={form.district} onChange={handleChange} required /></div>
              <div className="csd-field"><label>State *</label><input name="state" value={form.state} onChange={handleChange} required /></div>
            </div>

            <p className="csd-sub-label">Identity</p>
            <div className="csd-grid cols-2">
              <div className="csd-field"><label>Aadhaar No *</label><input name="aadhaar_no" value={form.aadhaar_no} onChange={handleChange} required maxLength={12} /></div>
              <div className="csd-field"><label>PAN No *</label><input name="pan_no" value={form.pan_no} onChange={handleChange} required maxLength={10} /></div>
            </div>

            <p className="csd-sub-label">Occupation</p>
            <div className="csd-grid cols-3">
              <div className="csd-field">
                <label>Occupation *</label>
                <CustomDropdown value={form.occupation} onChange={(val) => setForm((prev) => ({ ...prev, occupation: val }))}
                  options={[{ value: "employee", label: "Employee" }, { value: "business", label: "Business" }, { value: "others", label: "Others" }]}
                  placeholder="Select" style={{ width: "100%" }} buttonStyle={{ height: "46px", borderRadius: "12px", border: "1px solid #BDCFCE", background: "#FDFDFC" }} />
              </div>
              <div className="csd-field"><label>Detail</label><input name="occupation_detail" value={form.occupation_detail} onChange={handleChange} /></div>
              <div className="csd-field"><label>Annual Salary *</label><input name="annual_salary" value={form.annual_salary} onChange={handleChange} required /></div>
            </div>

            <div className="csd-actions">
              <button type="submit" className="csd-btn-primary" disabled={submitting}>{submitting ? "Creating Sub Dealer..." : "Create Sub Dealer"}</button>
              <button type="button" className="csd-btn-secondary" onClick={() => { setForm(emptyForm); setConfirmPassword(""); setPasswordError(""); }}>Reset</button>
            </div>
          </form>
        </div>
      </div>

      {successPopup && (
        <div onClick={() => setSuccessPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(7, 31, 34, 0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "24px", width: "100%", maxWidth: "500px", overflow: "hidden", boxShadow: "0 24px 60px rgba(7, 59, 63, 0.25)", border: "1px solid rgba(204, 168, 129, 0.35)" }}>
            <div style={{ background: "linear-gradient(135deg, #073B3F 0%, #0F5C62 100%)", padding: "24px 28px", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 900 }}>✓</div>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#E1C497", display: "block", marginBottom: "2px" }}>SUB DEALER CREATION SUCCESS</span>
                  <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800 }}>{successPopup.title}</h3>
                </div>
              </div>
              <button type="button" onClick={() => setSuccessPopup(null)} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>Sub Dealer Name</small>
                  <strong style={{ color: "#073B3F", fontSize: "13.5px" }}>{successPopup.name || "—"}</strong>
                </div>
                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>City</small>
                  <strong style={{ color: "#073B3F", fontSize: "13.5px" }}>{successPopup.city || "—"}</strong>
                </div>
                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>Email</small>
                  <strong style={{ color: "#073B3F", fontSize: "13px", wordBreak: "break-all" }}>{successPopup.email || "—"}</strong>
                </div>
                <div style={{ padding: "12px 14px", background: "#F8FAF9", borderRadius: "12px", border: "1px solid #E8EFEF" }}>
                  <small style={{ display: "block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#728A87", marginBottom: "2px" }}>Mobile Number</small>
                  <strong style={{ color: "#073B3F", fontSize: "13.5px" }}>{successPopup.mobile || "—"}</strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setSuccessPopup(null)} style={{ padding: "11px 26px", background: "#073B3F", border: "none", borderRadius: "12px", color: "#FFFFFF", fontSize: "13.5px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(7, 59, 63, 0.2)" }}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorPopup && (
        <div onClick={() => setErrorPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(7, 31, 34, 0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "24px", width: "100%", maxWidth: "480px", overflow: "hidden", boxShadow: "0 24px 60px rgba(220, 38, 38, 0.2)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <div style={{ background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)", padding: "22px 26px", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900 }}>!</div>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FEE2E2", display: "block", marginBottom: "2px" }}>SUBMISSION ERROR</span>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>{errorPopup.title}</h3>
                </div>
              </div>
              <button type="button" onClick={() => setErrorPopup(null)} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.25)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <p style={{ margin: "0 0 14px", color: "#6B7280", fontSize: "13.5px" }}>Please review and correct the following items:</p>
              <div style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px" }}>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#991B1B", fontSize: "13.5px", lineHeight: 1.6 }}>
                  {errorPopup.errors.map((msg, i) => (<li key={i} style={{ fontWeight: 600 }}>{msg}</li>))}
                </ul>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setErrorPopup(null)} style={{ padding: "10px 24px", background: "#DC2626", border: "none", borderRadius: "12px", color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Review & Fix</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
