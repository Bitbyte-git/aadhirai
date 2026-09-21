import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import CopyUrlButton from '../collection/CopyUrlButton'

const OCCUPATION_OPTIONS = [
  'employee',
  'business',
  'self_employed',
  'government',
  'professional',
  'others',
]

const emptyForm = {
  initial: '',
  first_name: '',
  last_name: '',
  mobile_number: '',
  gender: 'male',
  dob: '',
  married_status: 'single',
  anniversary_date: '',
  email: '',
  password: '',
  door_no: '',
  street_name: '',
  pincode: '',
  town_name: '',
  city_name: '',
  district: '',
  state: '',
  aadhaar_no: '',
  pan_no: '',
  occupation: 'employee',
  occupation_detail: '',
  annual_salary: '',
}

function SectionHeader({ icon, label, sublabel }) {
  const icons = {
    user: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    ),
    lock: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    pin: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    id: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="8" cy="12" r="2" />
        <path d="M14 10h4M14 14h4" />
      </svg>
    ),
    briefcase: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid rgba(189,207,206,0.5)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(12,64,68,0.08)', border: '1px solid rgba(12,64,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icons[icon] || icons.user}
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 850, color: '#0C4044', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{label}</h4>
        {sublabel && <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#7A8987' }}>{sublabel}</p>}
      </div>
    </div>
  )
}

export default function CreateSuperStockist() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [pincodeLookupMsg, setPincodeLookupMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successPopup, setSuccessPopup] = useState(null)
  const [errorPopup, setErrorPopup] = useState(null)
  const [copiedId, setCopiedId] = useState(false)

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: '#CBD5E1', width: '0%' }
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    if (score <= 1) return { label: 'Weak', color: '#EF4444', width: '25%' }
    if (score === 2) return { label: 'Fair', color: '#F59E0B', width: '50%' }
    if (score === 3) return { label: 'Good', color: '#3B82F6', width: '75%' }
    return { label: 'Strong', color: '#10B981', width: '100%' }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'married_status' && value !== 'married') {
      setForm((prev) => ({ ...prev, married_status: value, anniversary_date: '' }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setForm((prev) => ({ ...prev, pincode: value }))
    setPincodeLookupMsg('')

    if (value.length === 6) {
      setPincodeLookupMsg('Fetching postal details...')
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`)
        const data = await res.json()
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0]
          setForm((prev) => ({
            ...prev,
            town_name: po.Name || prev.town_name,
            city_name: po.District || prev.city_name,
            district: po.District || prev.district,
            state: po.State || prev.state,
          }))
          setPincodeLookupMsg('✅ Location details auto-filled')
        } else {
          setPincodeLookupMsg('Pincode not found — please enter manually')
        }
      } catch {
        setPincodeLookupMsg('Unable to fetch postal info — enter manually')
      }
    }
  }

  const parseErrors = (err) => {
    const data = err?.response?.data
    if (!data) return ['Network error occurred. Please check connectivity.']
    if (typeof data === 'string') return [data]
    if (Array.isArray(data)) return data.map(String)
    if (typeof data === 'object') {
      const msgs = []
      const fieldNames = {
        first_name: 'First Name',
        last_name: 'Last Name',
        email: 'Email Address',
        mobile_number: 'Mobile Number',
        password: 'Password',
        pincode: 'Pincode',
        city_name: 'City',
        district: 'District',
        state: 'State',
        aadhaar_no: 'Aadhaar Number',
        pan_no: 'PAN Number',
        detail: 'Notice',
        non_field_errors: 'Error',
      }
      Object.entries(data).forEach(([key, val]) => {
        const readable = fieldNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        if (Array.isArray(val)) {
          val.forEach((m) => msgs.push(`${readable}: ${typeof m === 'object' ? JSON.stringify(m) : m}`))
        } else if (typeof val === 'object' && val !== null) {
          msgs.push(`${readable}: ${JSON.stringify(val)}`)
        } else {
          msgs.push(`${readable}: ${val}`)
        }
      })
      return msgs.length > 0 ? msgs : ['Validation failed. Please verify form details.']
    }
    return ['An unexpected error occurred while creating the Super Stockist.']
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email || !form.email.includes('@')) {
      setErrorPopup({
        title: 'Invalid Email Address',
        errors: ['Please enter a valid, well-formed email address (e.g. admin@athirai.com).'],
      })
      return
    }

    if (form.password !== confirmPassword) {
      setPasswordError('❌ Passwords do not match')
      setErrorPopup({
        title: 'Password Mismatch',
        errors: ['Password and Confirm Password do not match. Please verify and re-type.'],
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        dob: form.dob || null,
        anniversary_date: form.anniversary_date || null,
      }

      const res = await api.post('/admins/', payload)
      const newAdminId = res.data?.admin_id || ''
      const adminName = `${form.first_name} ${form.last_name}`.trim()

      setSuccessPopup({
        title: 'Super Stockist Created Successfully!',
        admin_id: newAdminId,
        name: adminName,
        email: form.email,
        mobile: form.mobile_number,
        city: form.city_name,
      })

      setForm(emptyForm)
      setConfirmPassword('')
      setPasswordError('')
      setPincodeLookupMsg('')
    } catch (err) {
      const errors = parseErrors(err)
      setErrorPopup({
        title: 'Failed to Create Super Stockist',
        errors,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const copyAdminId = () => {
    if (!successPopup?.admin_id) return
    navigator.clipboard.writeText(successPopup.admin_id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2200)
  }

  return (
    <div className="ca-page">
      <style>{`
        .ca-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #FDFDFC 0%, #F3F3F0 50%, #E7EDEC 100%);
          color: #111817;
          font-family: 'Manrope', 'Inter', system-ui, sans-serif;
          padding: 24px 16px 64px;
        }

        .ca-shell {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .ca-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 14px;
        }

        .ca-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid rgba(189,207,206,0.8);
          padding: 9px 18px;
          border-radius: 12px;
          color: #073B3F;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(7,59,63,0.05);
        }
        .ca-back-btn:hover {
          background: #E7EDEC;
          transform: translateY(-1px);
        }

        .ca-hero {
          background: #FFFFFF;
          border: 1px solid rgba(189,207,206,0.7);
          border-radius: 20px;
          padding: 24px 30px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          box-shadow: 0 12px 36px rgba(7,59,63,0.05);
        }

        .ca-kicker {
          color: #CCA881;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .ca-title {
          margin: 0;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 800;
          color: #073B3F;
          letter-spacing: -0.01em;
        }

        .ca-card {
          background: #FFFFFF;
          border: 1px solid rgba(189,207,206,0.65);
          border-radius: 18px;
          padding: 26px 30px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(7,59,63,0.04);
        }

        .ca-grid3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .ca-grid2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 860px) {
          .ca-grid3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .ca-grid3, .ca-grid2 { grid-template-columns: 1fr; }
          .ca-hero { padding: 18px 20px; }
          .ca-card { padding: 20px 18px; }
        }

        .ca-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ca-label {
          font-size: 11.5px;
          font-weight: 800;
          color: #53615F;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ca-input, .ca-select {
          width: 100%;
          background: #FDFDFC;
          border: 1px solid #BDCFCE;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          color: #111817;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .ca-input:focus, .ca-select:focus {
          border-color: #0C4044;
          box-shadow: 0 0 0 3px rgba(12,64,68,0.1);
        }

        .ca-readonly-badge {
          background: #F3F3F0;
          border: 1px dashed #BDCFCE;
          border-radius: 10px;
          padding: 11px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: monospace;
          font-size: 13.5px;
          color: #0C4044;
          font-weight: 700;
        }

        .ca-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 10px;
        }

        .ca-btn-submit {
          padding: 14px 34px;
          background: linear-gradient(135deg, #0C4044 0%, #073B3F 100%);
          border: none;
          border-radius: 12px;
          color: #FDFDFC;
          font-size: 14.5px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(7,59,63,0.22);
          transition: all 0.2s ease;
        }
        .ca-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(7,59,63,0.3);
        }
        .ca-btn-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .ca-btn-cancel {
          padding: 13px 26px;
          background: #FFFFFF;
          border: 1px solid rgba(189,207,206,0.8);
          border-radius: 12px;
          color: #7A8987;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ca-btn-cancel:hover {
          background: #F3F3F0;
          color: #111817;
        }
      `}</style>

      <div className="ca-shell">
        {/* Top bar */}
        <div className="ca-topbar">
          <button type="button" className="ca-back-btn" onClick={() => navigate('/super-admin')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CopyUrlButton />
          </div>
        </div>

        {/* Hero header */}
        <div className="ca-hero">
          <div>
            <div className="ca-kicker">ATHIRAI SUPER STOCKIST PORTAL</div>
            <h1 className="ca-title">Create New Super Stockist</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#53615F' }}>
              Register a new Super Stockist authority with full credentials, address, and profile access.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, rgba(204,168,129,0.25), rgba(12,64,68,0.12))', border: '1px solid rgba(204,168,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Info */}
          <div className="ca-card">
            <SectionHeader icon="user" label="Personal Information" sublabel="Primary details and birth records" />
            <div className="ca-grid3">
              <div className="ca-field">
                <label className="ca-label">Initial</label>
                <input
                  name="initial"
                  maxLength={5}
                  value={form.initial}
                  onChange={handleChange}
                  placeholder="e.g. S."
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">First Name *</label>
                <input
                  name="first_name"
                  maxLength={100}
                  value={form.first_name}
                  onChange={handleChange}
                  required
                  placeholder="Given name"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">Last Name *</label>
                <input
                  name="last_name"
                  maxLength={100}
                  value={form.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Family name / Surname"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">Mobile Number *</label>
                <input
                  name="mobile_number"
                  maxLength={10}
                  value={form.mobile_number}
                  onChange={handleChange}
                  required
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">Gender *</label>
                <select name="gender" value={form.gender} onChange={handleChange} required className="ca-select">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="transgender">Transgender</option>
                </select>
              </div>

              <div className="ca-field">
                <label className="ca-label">Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  required
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">Marital Status</label>
                <select name="married_status" value={form.married_status} onChange={handleChange} className="ca-select">
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                </select>
              </div>

              {form.married_status === 'married' && (
                <div className="ca-field">
                  <label className="ca-label">Anniversary Date</label>
                  <input
                    type="date"
                    name="anniversary_date"
                    value={form.anniversary_date}
                    onChange={handleChange}
                    className="ca-input"
                  />
                </div>
              )}

              <div className="ca-field">
                <label className="ca-label">Super Stockist ID</label>
                <div className="ca-readonly-badge">
                  <span>BBADM{new Date().getFullYear()}</span>
                  <span style={{ fontSize: '11px', color: '#7A8987' }}>&lt;auto-generated&gt;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Account & Security */}
          <div className="ca-card">
            <SectionHeader icon="lock" label="Account Credentials" sublabel="Login credentials and authentication details" />
            <div className="ca-grid3">
              <div className="ca-field">
                <label className="ca-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@athirai.com"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="ca-input"
                />
                {form.password && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(189,207,206,0.4)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: getPasswordStrength(form.password).width, background: getPasswordStrength(form.password).color, transition: 'all 0.3s ease' }} />
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: getPasswordStrength(form.password).color, marginTop: '4px' }}>
                      {getPasswordStrength(form.password).label}
                    </div>
                  </div>
                )}
              </div>

              <div className="ca-field">
                <label className="ca-label">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError('')
                  }}
                  required
                  placeholder="Re-enter password"
                  className="ca-input"
                  style={{ borderColor: passwordError ? '#C92035' : undefined }}
                />
                {passwordError && (
                  <div style={{ color: '#C92035', fontSize: '12px', marginTop: '4px', fontWeight: 700 }}>
                    {passwordError}
                  </div>
                )}
                {confirmPassword && !passwordError && (
                  <div style={{ fontSize: '11px', fontWeight: 800, color: confirmPassword === form.password ? '#0C4044' : '#C92035', marginTop: '4px' }}>
                    {confirmPassword === form.password ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Address Details */}
          <div className="ca-card">
            <SectionHeader icon="pin" label="Residential Address" sublabel="Address verification and postal jurisdiction" />
            <div className="ca-grid3">
              <div className="ca-field">
                <label className="ca-label">Door / House No *</label>
                <input
                  name="door_no"
                  value={form.door_no}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 12/A, 4th Cross"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">Street Name *</label>
                <input
                  name="street_name"
                  value={form.street_name}
                  onChange={handleChange}
                  required
                  placeholder="Street / Area name"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">Pincode *</label>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handlePincodeChange}
                  required
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="6-digit pincode"
                  className="ca-input"
                />
                {pincodeLookupMsg && (
                  <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '4px', color: pincodeLookupMsg.includes('auto-filled') ? '#0C4044' : '#C92035' }}>
                    {pincodeLookupMsg}
                  </div>
                )}
              </div>

              <div className="ca-field">
                <label className="ca-label">Town</label>
                <input
                  name="town_name"
                  value={form.town_name}
                  onChange={handleChange}
                  placeholder="Town / Locality"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">City *</label>
                <input
                  name="city_name"
                  value={form.city_name}
                  onChange={handleChange}
                  required
                  placeholder="City"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">District *</label>
                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  required
                  placeholder="District"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">State *</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  placeholder="State"
                  className="ca-input"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Identity & KYC */}
          <div className="ca-card">
            <SectionHeader icon="id" label="Government Identity Proof" sublabel="Statutory identity records" />
            <div className="ca-grid2">
              <div className="ca-field">
                <label className="ca-label">Aadhaar Number</label>
                <input
                  name="aadhaar_no"
                  maxLength={12}
                  value={form.aadhaar_no}
                  onChange={handleChange}
                  inputMode="numeric"
                  placeholder="12-digit Aadhaar number"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">PAN Number</label>
                <input
                  name="pan_no"
                  maxLength={10}
                  value={form.pan_no}
                  onChange={(e) => setForm((p) => ({ ...p, pan_no: e.target.value.toUpperCase() }))}
                  placeholder="10-character PAN (e.g. ABCDE1234F)"
                  className="ca-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Occupation Details */}
          <div className="ca-card">
            <SectionHeader icon="briefcase" label="Professional Background" sublabel="Employment and annual compensation" />
            <div className="ca-grid3">
              <div className="ca-field">
                <label className="ca-label">Occupation</label>
                <select name="occupation" value={form.occupation} onChange={handleChange} className="ca-select">
                  {OCCUPATION_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ca-field">
                <label className="ca-label">Occupation Detail</label>
                <input
                  name="occupation_detail"
                  value={form.occupation_detail}
                  onChange={handleChange}
                  placeholder="Designation / Business nature"
                  className="ca-input"
                />
              </div>

              <div className="ca-field">
                <label className="ca-label">Annual Salary (INR)</label>
                <input
                  name="annual_salary"
                  value={form.annual_salary}
                  onChange={handleChange}
                  placeholder="e.g. 600000"
                  className="ca-input"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="ca-actions">
            <button type="submit" disabled={submitting} className="ca-btn-submit">
              {submitting ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #FFFFFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Creating Super Stockist...
                </>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  Create Super Stockist
                </>
              )}
            </button>
            <button type="button" onClick={() => navigate('/super-admin')} className="ca-btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      {successPopup && (
        <div
          onClick={() => setSuccessPopup(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(7,31,34,0.6)', backdropFilter: 'blur(8px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '32px 30px', boxShadow: '0 30px 80px rgba(7,31,34,0.3)', border: '1px solid rgba(204,168,129,0.3)', textAlign: 'center' }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,167,103,0.18), rgba(12,64,68,0.12))', border: '2px solid #00A767', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00A767" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 850, color: '#073B3F', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {successPopup.title}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#53615F' }}>
              New Super Stockist registered with full operational credentials.
            </p>

            {successPopup.admin_id && (
              <div style={{ background: '#F8F7F4', border: '1px solid rgba(204,168,129,0.4)', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#CCA881', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SUPER STOCKIST ID</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#073B3F', marginTop: '2px' }}>
                    {successPopup.admin_id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyAdminId}
                  style={{ padding: '8px 14px', background: copiedId ? '#00A767' : '#0C4044', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s ease' }}
                >
                  {copiedId ? '✓ Copied!' : 'Copy ID'}
                </button>
              </div>
            )}

            <div style={{ textAlign: 'left', background: '#FAFBFB', border: '1px solid #EDF2F1', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F0F4F3' }}>
                <span style={{ color: '#7A8987' }}>Super Stockist Name:</span>
                <strong style={{ color: '#073B3F' }}>{successPopup.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F0F4F3' }}>
                <span style={{ color: '#7A8987' }}>Email:</span>
                <strong style={{ color: '#073B3F' }}>{successPopup.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#7A8987' }}>Mobile:</span>
                <strong style={{ color: '#073B3F' }}>{successPopup.mobile}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSuccessPopup(null)}
                style={{ flex: 1, padding: '12px', background: '#F3F3F0', border: '1px solid #BDCFCE', borderRadius: '12px', color: '#073B3F', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer' }}
              >
                Create Another
              </button>
              <button
                type="button"
                onClick={() => navigate('/super-admin')}
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#0C4044,#073B3F)', border: 'none', borderRadius: '12px', color: '#FFFFFF', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer' }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {errorPopup && (
        <div
          onClick={() => setErrorPopup(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(7,31,34,0.6)', backdropFilter: 'blur(8px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '30px 28px', boxShadow: '0 30px 80px rgba(7,31,34,0.3)', border: '1px solid rgba(201,32,53,0.3)', textAlign: 'center' }}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,32,53,0.12)', border: '1.5px solid rgba(201,32,53,0.4)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 850, color: '#C92035' }}>
              {errorPopup.title}
            </h3>
            <div style={{ textAlign: 'left', background: 'rgba(201,32,53,0.06)', border: '1px solid rgba(201,32,53,0.2)', borderRadius: '12px', padding: '14px 18px', margin: '16px 0 22px', maxHeight: '200px', overflowY: 'auto' }}>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#771520', fontSize: '13px', lineHeight: 1.5 }}>
                {errorPopup.errors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setErrorPopup(null)}
              style={{ width: '100%', padding: '12px', background: '#C92035', border: 'none', borderRadius: '12px', color: '#FFFFFF', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}
            >
              Close and Edit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
