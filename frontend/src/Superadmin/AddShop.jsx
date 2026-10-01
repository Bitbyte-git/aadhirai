import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import CopyShopUrlButton from '../collection/CopyShopUrlButton'

export default function AddShop() {
  const navigate = useNavigate()
  const loggedInRole = localStorage.getItem('role')
  const isLoggedInSuperAdmin = loggedInRole === 'super_admin'
  const isLoggedInShop = loggedInRole === 'shop'

  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    mobile_number: '',
    whatsapp_number: '',
    email: '',
    password: '',
    shop_address: '',
    pincode: '',
    street_name: '',
    city: '',
    district: '',
    state: '',
    shop_type: 'live',
    pan_no: '',
    gst_no: '',
    msme_no: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [pincodeLookupMsg, setPincodeLookupMsg] = useState('')

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handlePincodeChange = async e => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setForm(prev => ({ ...prev, pincode: value }))
    setPincodeLookupMsg('')
    if (value.length === 6) {
      setPincodeLookupMsg('Fetching location details...')
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`)
        const data = await res.json()
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0]
          setForm(prev => ({
            ...prev,
            city: po.District || prev.city,
            district: po.District || prev.district,
            state: po.State || prev.state,
          }))
          setPincodeLookupMsg('Location details auto-filled')
        } else {
          setPincodeLookupMsg('Pincode not found — please enter manually')
        }
      } catch {
        setPincodeLookupMsg('Unable to fetch location — please enter manually')
      }
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      await api.post('/shops/', form)
      setMsg('Shop created successfully!')
      setTimeout(() => {
        const dest = isLoggedInSuperAdmin ? '/super-admin' : isLoggedInShop ? '/shop-dashboard' : '/login'
        navigate(dest)
      }, 1400)
    } catch (err) {
      setMsg('Error: ' + JSON.stringify(err.response?.data))
    }
    setSaving(false)
  }

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
        .as-readonly-pill {
          background: #F1F6F5;
          border-color: #DDE7E5;
          cursor: not-allowed;
          user-select: none;
        }
        .as-readonly-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          font-weight: 600;
          color: #37504D;
        }
        .as-readonly-tag {
          font-size: 11.5px;
          color: #78908D;
          margin-left: 8px;
          font-style: italic;
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
          .as-grid-3 {
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
          .as-header-actions button, .as-header-actions .bb-copy-shop-url-btn {
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
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <h1 className="as-header-title">
                {isLoggedInSuperAdmin ? 'Add New Shop' : isLoggedInShop ? 'Create Sub-Shop' : 'Shop Registration'}
              </h1>
              <div className="as-header-sub">
                {isLoggedInSuperAdmin ? 'Create a new shop or branch record' : isLoggedInShop ? 'Add a new shop under your network' : 'Register your shop with BitByte'}
              </div>
            </div>
          </div>

          <div className="as-header-actions">
            <CopyShopUrlButton
              label="Copy URL"
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
            {(isLoggedInSuperAdmin || isLoggedInShop) && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="as-back-btn"
                title="Go back to previous page"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Message Alert */}
        {msg && (
          <div
            style={{
              background: msg.includes('successfully') ? 'rgba(7, 59, 63, 0.08)' : 'rgba(220, 38, 38, 0.08)',
              border: `1.5px solid ${msg.includes('successfully') ? 'rgba(7, 59, 63, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
              color: msg.includes('successfully') ? '#073B3F' : '#DC2626',
              borderRadius: '12px',
              padding: '14px 20px',
              fontSize: '14px',
              fontWeight: 650,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {msg.includes('successfully') ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{msg}</span>
          </div>
        )}

        {/* Main Form Card */}
        <div className="as-card">
          <form onSubmit={handleSubmit}>

            {/* ── SECTION 1: SHOP INFORMATION ── */}
            <div className="as-section-card">
              <div className="as-section-header">
                <div className="as-section-head-left">
                  <div className="as-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l2-5h14l2 5" />
                      <path d="M21 9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
                      <path d="M9 22v-6h6v6" />
                    </svg>
                  </div>
                  <div>
                    <div className="as-section-title">Shop Information</div>
                    <div className="as-section-sub">Basic details about your shop or branch</div>
                  </div>
                </div>
              </div>

              <div className="as-grid-3">
                {/* Shop Name */}
                <div className="as-field">
                  <label className="as-label">
                    Shop Name <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l2-5h14l2 5" />
                        <path d="M21 9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
                        <path d="M9 22v-6h6v6" />
                      </svg>
                    </span>
                    <input
                      name="shop_name"
                      value={form.shop_name}
                      onChange={handleChange}
                      placeholder="Enter shop name"
                      required
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Owner Name */}
                <div className="as-field">
                  <label className="as-label">
                    Owner Name <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      name="owner_name"
                      value={form.owner_name}
                      onChange={handleChange}
                      placeholder="Enter owner name"
                      required
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Select Shop */}
                <div className="as-field">
                  <label className="as-label">
                    Select Shop <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M7 8h10" />
                        <path d="M7 12h10" />
                        <path d="M7 16h6" />
                      </svg>
                    </span>
                    <select
                      name="shop_type"
                      value={form.shop_type}
                      onChange={handleChange}
                      required
                      className="as-select"
                    >
                      <option value="live">Physical Shop</option>
                      <option value="virtual">Virtual Shop</option>
                    </select>
                    <span className="as-select-chevron">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Shop ID (Read-only) */}
                <div className="as-field">
                  <label className="as-label">Shop ID</label>
                  <div className="as-input-wrap as-readonly-pill">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="3" />
                        <circle cx="9" cy="10" r="2" />
                        <line x1="15" y1="8" x2="17" y2="8" />
                        <line x1="15" y1="12" x2="17" y2="12" />
                        <line x1="7" y1="16" x2="17" y2="16" />
                      </svg>
                    </span>
                    <span className="as-readonly-code">BBJS{new Date().getFullYear()}</span>
                    <span className="as-readonly-tag">&lt;auto-generated&gt;</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: CONTACT & ACCOUNT ── */}
            <div className="as-section-card">
              <div className="as-section-header">
                <div className="as-section-head-left">
                  <div className="as-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="7" r="4" />
                      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
                    </svg>
                  </div>
                  <div>
                    <div className="as-section-title">Contact &amp; Account</div>
                    <div className="as-section-sub">Contact details and login information</div>
                  </div>
                </div>
              </div>

              <div className="as-grid-3">
                {/* Mobile Number */}
                <div className="as-field">
                  <label className="as-label">
                    Mobile Number <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input
                      name="mobile_number"
                      maxLength={10}
                      value={form.mobile_number}
                      onChange={handleChange}
                      placeholder="Enter mobile number"
                      required
                      inputMode="numeric"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div className="as-field">
                  <label className="as-label">WhatsApp Number</label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    </span>
                    <input
                      name="whatsapp_number"
                      maxLength={10}
                      value={form.whatsapp_number}
                      onChange={handleChange}
                      placeholder="Enter WhatsApp number"
                      inputMode="numeric"
                      className="as-input"
                    />
                  </div>
                </div>

                {/* Email ID */}
                <div className="as-field">
                  <label className="as-label">
                    Email ID <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      required
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                      className="as-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="as-eye-btn"
                      title={showPassword ? 'Hide password' : 'Show password'}
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
                <div className="as-field">
                  <label className="as-label">
                    Confirm Password <span className="as-req">*</span>
                  </label>
                  <div className={`as-input-wrap ${passwordError ? 'has-error' : ''}`}>
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value)
                        setPasswordError('')
                      }}
                      placeholder="Confirm password"
                      required
                      className="as-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="as-eye-btn"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                  {passwordError && (
                    <div style={{ color: '#DC2626', fontSize: '11.5px', fontWeight: 650, marginTop: '5px' }}>
                      {passwordError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── SECTION 3: SHOP ADDRESS ── */}
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
                    <div className="as-section-title">Shop Address</div>
                    <div className="as-section-sub">Location details of your shop</div>
                  </div>
                </div>
              </div>

              <div className="as-grid-3">
                {/* Shop Address (Full Width) */}
                <div className="as-field as-span-3">
                  <label className="as-label">
                    Shop Address <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2" />
                        <path d="M9 22v-4h6v4" />
                        <path d="M8 6h.01" />
                        <path d="M16 6h.01" />
                        <path d="M8 10h.01" />
                        <path d="M16 10h.01" />
                        <path d="M8 14h.01" />
                        <path d="M16 14h.01" />
                      </svg>
                    </span>
                    <input
                      name="shop_address"
                      value={form.shop_address}
                      onChange={handleChange}
                      placeholder="Enter full shop address"
                      required
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={handlePincodeChange}
                      placeholder="Enter pincode"
                      required
                      maxLength={6}
                      inputMode="numeric"
                      className="as-input"
                    />
                  </div>
                  {pincodeLookupMsg && (
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        marginTop: '4px',
                        color: pincodeLookupMsg.includes('auto-filled') ? '#073B3F' : '#DC2626',
                      }}
                    >
                      {pincodeLookupMsg}
                    </div>
                  )}
                </div>

                {/* Street Name */}
                <div className="as-field">
                  <label className="as-label">
                    Street Name <span className="as-req">*</span>
                  </label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z" />
                        <path d="M12 13v9" />
                        <path d="M12 2v4" />
                      </svg>
                    </span>
                    <input
                      name="street_name"
                      value={form.street_name}
                      onChange={handleChange}
                      placeholder="Enter street name"
                      required
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18" />
                        <path d="M6 21V7l8-4v18" />
                        <path d="M14 11h4v10" />
                        <path d="M9 9h1" />
                        <path d="M9 13h1" />
                        <path d="M9 17h1" />
                      </svg>
                    </span>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      required
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
                      </svg>
                    </span>
                    <input
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                      placeholder="Enter district"
                      required
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" x2="4" y1="22" y2="15" />
                      </svg>
                    </span>
                    <input
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                      required
                      className="as-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: IDENTITY (OPTIONAL) ── */}
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
                    <div className="as-section-title">Identity (Optional)</div>
                    <div className="as-section-sub">Business identity and verification details</div>
                  </div>
                </div>
              </div>

              <div className="as-grid-3">
                {/* PAN */}
                <div className="as-field">
                  <label className="as-label">PAN</label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </span>
                    <input
                      name="pan_no"
                      maxLength={10}
                      value={form.pan_no}
                      onChange={handleChange}
                      placeholder="Enter PAN number"
                      className="as-input"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                {/* GST */}
                <div className="as-field">
                  <label className="as-label">GST</label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </span>
                    <input
                      name="gst_no"
                      maxLength={15}
                      value={form.gst_no}
                      onChange={handleChange}
                      placeholder="Enter GST number"
                      className="as-input"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                {/* MSME */}
                <div className="as-field">
                  <label className="as-label">MSME</label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </span>
                    <input
                      name="msme_no"
                      maxLength={25}
                      value={form.msme_no}
                      onChange={handleChange}
                      placeholder="Enter MSME number"
                      className="as-input"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={saving}
                className="as-submit-btn"
                style={{ opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>{saving ? 'Creating...' : 'Create Shop'}</span>
                {!saving && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}