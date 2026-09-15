import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

export default function ReferralCustomer() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [totalCount, setTotalCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [toast, setToast] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleCopy = async (text, idKey) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(idKey)
      showToast(`Copied ${text}`)
      setTimeout(() => setCopiedId(null), 1800)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchReferralCustomers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/referral-customers/', {
        params: { search, role: roleFilter, limit: 300 },
      })
      setRows(res.data.results || [])
      setTotalCount(res.data.total_count || 0)
      setActiveCount(res.data.active_count || 0)
      setTotalOrders(res.data.total_orders || 0)
      setTotalSpent(res.data.total_spent || 0)
    } catch (err) {
      console.error('Error fetching referral customers:', err)
      showToast('Failed to load referral customers. Please check server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchReferralCustomers()
  }, [search, roleFilter])

  const getRoleBadgeStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'promotor':
        return { background: 'rgba(12, 64, 68, 0.1)', color: '#0C4044', border: '1px solid rgba(12, 64, 68, 0.25)' }
      case 'sub_dealer':
        return { background: 'rgba(187, 137, 88, 0.12)', color: '#8C5824', border: '1px solid rgba(187, 137, 88, 0.3)' }
      case 'dealer':
        return { background: 'rgba(30, 58, 138, 0.1)', color: '#1E3A8A', border: '1px solid rgba(30, 58, 138, 0.25)' }
      case 'admin':
        return { background: 'rgba(88, 28, 135, 0.1)', color: '#581C87', border: '1px solid rgba(88, 28, 135, 0.25)' }
      case 'super_admin':
        return { background: 'rgba(180, 83, 9, 0.12)', color: '#B45309', border: '1px solid rgba(180, 83, 9, 0.3)' }
      default:
        return { background: 'rgba(100, 116, 139, 0.1)', color: '#475569', border: '1px solid rgba(100, 116, 139, 0.25)' }
    }
  }

  const formatRoleName = (role) => {
    if (!role) return 'Referrer'
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <main className="rc-page-root">
      <style>{`
        .rc-page-root {
          min-height: 100vh;
          background: #F8FAF9;
          color: #111817;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding-bottom: 60px;
        }
        .rc-shell {
          width: calc(100% - 48px);
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 0;
        }
        .rc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .rc-header-left h1 {
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #073B3F;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .rc-header-left p {
          margin: 0;
          color: #637774;
          font-size: 13.5px;
        }
        .rc-header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .rc-btn-general {
          padding: 10px 18px;
          border-radius: 10px;
          background: #FFFFFF;
          color: #073B3F;
          border: 1.5px solid #073B3F;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .rc-btn-general:hover {
          background: #073B3F;
          color: #FFFFFF;
        }
        .rc-btn-refresh {
          padding: 10px 18px;
          border-radius: 10px;
          border: 1px solid #CFDFDE;
          background: #FFFFFF;
          color: #073B3F;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .rc-btn-refresh:hover {
          background: #F0F6F5;
          border-color: #073B3F;
        }
        .rc-btn-create {
          padding: 10px 20px;
          border-radius: 10px;
          background: #073B3F;
          color: #FFFFFF;
          border: 0;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 6px 16px rgba(7, 59, 63, 0.16);
          transition: all 0.2s;
        }
        .rc-btn-create:hover {
          background: #0c4e53;
          transform: translateY(-1px);
        }

        /* Metric Cards */
        .rc-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .rc-stat-card {
          background: #FFFFFF;
          border: 1px solid #E3ECEB;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rc-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(7, 59, 63, 0.06);
        }
        .rc-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(187, 137, 88, 0.14);
          color: #8C5824;
          flex-shrink: 0;
        }
        .rc-stat-info span {
          display: block;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #7b8e8b;
          margin-bottom: 4px;
        }
        .rc-stat-info strong {
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1.1;
        }

        /* Controls */
        .rc-controls {
          background: #FFFFFF;
          border: 1px solid #E3ECEB;
          border-radius: 14px;
          padding: 14px 18px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .rc-search-box {
          position: relative;
          flex: 1;
          min-width: 280px;
        }
        .rc-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8fa29f;
        }
        .rc-search-box input {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border-radius: 10px;
          border: 1px solid #D6E4E3;
          background: #FAFDFD;
          font-size: 13.5px;
          color: #111817;
          outline: none;
          transition: border-color 0.2s;
        }
        .rc-search-box input:focus {
          border-color: #073B3F;
          background: #FFFFFF;
        }
        .rc-filters {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .rc-filter-btn {
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          border: 1px solid transparent;
          background: #F1F6F5;
          color: #4a5e5a;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rc-filter-btn:hover {
          background: #E5EFEF;
          color: #073B3F;
        }
        .rc-filter-btn.active {
          background: #073B3F;
          color: #FFFFFF;
        }

        /* Table Card */
        .rc-table-card {
          background: #FFFFFF;
          border: 1px solid #E3ECEB;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.03);
        }
        .rc-table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .rc-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .rc-table th {
          background: #FAFDFD;
          color: #485c58;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 14px 18px;
          border-bottom: 1px solid #E5EFEF;
          white-space: nowrap;
        }
        .rc-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #EDF3F2;
          vertical-align: middle;
          color: #1a2e2b;
        }
        .rc-table tr:hover td {
          background: #F9FCFC;
        }

        .rc-id-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 6px;
          background: #F0F6F5;
          color: #073B3F;
          font-family: ui-monospace, monospace;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid #D6E4E3;
          transition: all 0.2s;
        }
        .rc-id-pill:hover {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
        }

        .rc-user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .rc-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #073B3F;
          color: #D4AF37;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        .rc-user-meta strong {
          display: block;
          color: #073B3F;
          font-size: 13.5px;
        }
        .rc-user-meta span {
          display: block;
          font-size: 11.5px;
          color: #7b8e8b;
        }

        .rc-contact-cell span {
          display: block;
          font-size: 13px;
        }
        .rc-contact-cell small {
          display: block;
          font-size: 11.5px;
          color: #657976;
        }

        .rc-ref-cell strong {
          display: block;
          font-size: 13px;
          color: #073B3F;
        }
        .rc-ref-badge {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 3px;
        }
        .rc-ref-id {
          font-size: 11px;
          color: #7b8e8b;
          font-family: monospace;
          margin-top: 2px;
        }

        .rc-btn-view {
          padding: 6px 14px;
          border-radius: 8px;
          background: #FAFDFD;
          border: 1px solid #CFDFDE;
          color: #073B3F;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rc-btn-view:hover {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
        }

        /* Modal */
        .rc-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(7, 24, 26, 0.65);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .rc-modal-box {
          background: #FFFFFF;
          border-radius: 20px;
          max-width: 680px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          border: 1px solid #D6E4E3;
          position: relative;
        }
        .rc-modal-head {
          padding: 24px 28px;
          border-bottom: 1px solid #EDF3F2;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rc-modal-head h2 {
          margin: 0 0 4px;
          font-family: Georgia, serif;
          font-size: 20px;
          color: #073B3F;
        }
        .rc-modal-head p {
          margin: 0;
          font-size: 13px;
          color: #657976;
        }
        .rc-modal-close {
          background: transparent;
          border: 0;
          font-size: 22px;
          color: #7b8e8b;
          cursor: pointer;
        }
        .rc-modal-body {
          padding: 24px 28px;
        }
        .rc-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .rc-modal-item {
          background: #FAFDFD;
          border: 1px solid #E8F0F0;
          border-radius: 12px;
          padding: 12px 16px;
        }
        .rc-modal-item span {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #7b8e8b;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .rc-modal-item strong {
          display: block;
          font-size: 14px;
          color: #073B3F;
        }
        .rc-box-banner {
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        /* Toast */
        .rc-toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          background: #073B3F;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
          z-index: 100000;
        }

        @media (max-width: 900px) {
          .rc-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .rc-shell {
            width: calc(100% - 24px);
            padding: 20px 0;
          }
          .rc-stats-grid {
            grid-template-columns: 1fr;
          }
          .rc-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .rc-modal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="rc-shell">
        {/* Header */}
        <header className="rc-header">
          <div className="rc-header-left">
            <h1>Referral Customers</h1>
            <p>Customers registered via Referral URLs and agent invitations across the system.</p>
          </div>
          <div className="rc-header-actions">
            <button
              className="rc-btn-general"
              type="button"
              onClick={() => navigate('/general-customers')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              General Customers (Direct)
            </button>
            <button className="rc-btn-refresh" type="button" onClick={fetchReferralCustomers}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
            <button className="rc-btn-create" type="button" onClick={() => navigate('/create-customer')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Customer
            </button>
          </div>
        </header>

        {/* Metric Cards */}
        <section className="rc-stats-grid">
          <div className="rc-stat-card">
            <div className="rc-stat-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="rc-stat-info">
              <span>Referral Customers</span>
              <strong>{totalCount}</strong>
            </div>
          </div>

          <div className="rc-stat-card">
            <div className="rc-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="rc-stat-info">
              <span>Active Accounts</span>
              <strong>{activeCount}</strong>
            </div>
          </div>

          <div className="rc-stat-card">
            <div className="rc-stat-icon" style={{ background: 'rgba(12, 64, 68, 0.1)', color: '#0C4044' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div className="rc-stat-info">
              <span>Total Orders</span>
              <strong>{Number(totalOrders).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="rc-stat-card">
            <div className="rc-stat-icon" style={{ background: 'rgba(7, 59, 63, 0.1)', color: '#073B3F' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="rc-stat-info">
              <span>Total Spending</span>
              <strong>₹{Number(totalSpent || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </section>

        {/* Controls & Filter */}
        <section className="rc-controls">
          <div className="rc-search-box">
            <svg className="rc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by customer name, ID, phone, email, referrer or promoter..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="rc-filters">
            <button
              type="button"
              className={`rc-filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              All Referrers
            </button>
            <button
              type="button"
              className={`rc-filter-btn ${roleFilter === 'promotor' ? 'active' : ''}`}
              onClick={() => setRoleFilter('promotor')}
            >
              By Promotor
            </button>
            <button
              type="button"
              className={`rc-filter-btn ${roleFilter === 'sub_dealer' ? 'active' : ''}`}
              onClick={() => setRoleFilter('sub_dealer')}
            >
              By Sub Dealer
            </button>
            <button
              type="button"
              className={`rc-filter-btn ${roleFilter === 'dealer' ? 'active' : ''}`}
              onClick={() => setRoleFilter('dealer')}
            >
              By Dealer
            </button>
            <button
              type="button"
              className={`rc-filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >
              By Admin
            </button>
          </div>
        </section>

        {/* Table */}
        <section className="rc-table-card">
          <div className="rc-table-wrap">
            <table className="rc-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Details</th>
                  <th>Contact Info</th>
                  <th>Delivery Location</th>
                  <th>Referred By</th>
                  <th>Registration</th>
                  <th>Orders / Spend</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px 0', color: '#6e817e' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ath-spin">
                          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                        </svg>
                        Loading referral customers...
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px 0', color: '#6e817e' }}>
                      No referral customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <button
                          type="button"
                          className="rc-id-pill"
                          onClick={() => handleCopy(row.customer_id, `id-${row.id}`)}
                          title="Click to copy ID"
                        >
                          {row.customer_id}
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </td>

                      <td>
                        <div className="rc-user-cell">
                          <div className="rc-avatar">
                            {(row.first_name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="rc-user-meta">
                            <strong>{row.name}</strong>
                            <span>{row.gender || 'Gender N/A'} • DOB: {row.dob || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="rc-contact-cell">
                          <span>{row.email || 'No email'}</span>
                          <small>{row.mobile_number || 'No phone'}</small>
                        </div>
                      </td>

                      <td>
                        <div className="rc-contact-cell">
                          <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                            {row.city_name || '—'}, {row.state || '—'}
                          </span>
                          <small>{row.pincode ? `Pincode: ${row.pincode}` : (row.district || '—')}</small>
                        </div>
                      </td>

                      <td>
                        <div className="rc-ref-cell">
                          <strong>{row.referrer_name}</strong>
                          <span className="rc-ref-badge" style={getRoleBadgeStyle(row.referrer_role)}>
                            {formatRoleName(row.referrer_role)}
                          </span>
                          {row.referrer_id && (
                            <div className="rc-ref-id">{row.referrer_id}</div>
                          )}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '12px', color: '#556965' }}>
                          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '—'}
                        </span>
                      </td>

                      <td>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#073B3F' }}>
                          {row.order_count || 0} Orders
                        </strong>
                        <span style={{ fontSize: '12px', color: '#748784' }}>
                          ₹{Number(row.total_spent || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: row.is_active ? '#0D6832' : '#8A2020'
                        }}>
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: row.is_active ? '#10B981' : '#EF4444'
                          }} />
                          {row.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="rc-btn-view"
                          onClick={() => setSelectedCustomer(row)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
        <div className="rc-modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="rc-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="rc-modal-head">
              <div>
                <h2>{selectedCustomer.name}</h2>
                <p>Referral Customer Profile • {selectedCustomer.customer_id}</p>
              </div>
              <button
                type="button"
                className="rc-modal-close"
                onClick={() => setSelectedCustomer(null)}
              >
                &times;
              </button>
            </div>

            <div className="rc-modal-body">
              {/* Referrer Highlight Box */}
              <div className="rc-box-banner" style={{ background: 'rgba(187, 137, 88, 0.08)', border: '1px solid rgba(187, 137, 88, 0.25)' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#8C5824', marginBottom: '6px' }}>
                  Referred By
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#073B3F' }}>{selectedCustomer.referrer_name}</strong>
                    <div style={{ fontSize: '12px', color: '#657976' }}>
                      {selectedCustomer.referrer_email} {selectedCustomer.referrer_phone ? `• ${selectedCustomer.referrer_phone}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="rc-ref-badge" style={getRoleBadgeStyle(selectedCustomer.referrer_role)}>
                      {formatRoleName(selectedCustomer.referrer_role)}
                    </span>
                    {selectedCustomer.referrer_id && (
                      <div style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#073B3F', fontWeight: 700, marginTop: '2px' }}>
                        {selectedCustomer.referrer_id}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Info Grid */}
              <div className="rc-modal-grid">
                <div className="rc-modal-item">
                  <span>Customer ID</span>
                  <strong>{selectedCustomer.customer_id}</strong>
                </div>
                <div className="rc-modal-item">
                  <span>Email</span>
                  <strong>{selectedCustomer.email || '—'}</strong>
                </div>
                <div className="rc-modal-item">
                  <span>Mobile</span>
                  <strong>{selectedCustomer.mobile_number || '—'}</strong>
                </div>
                <div className="rc-modal-item">
                  <span>Gender & DOB</span>
                  <strong>{selectedCustomer.gender || '—'} • {selectedCustomer.dob || '—'}</strong>
                </div>
                <div className="rc-modal-item">
                  <span>Orders Placed</span>
                  <strong>{selectedCustomer.order_count || 0} Orders</strong>
                </div>
                <div className="rc-modal-item">
                  <span>Total Spent</span>
                  <strong>₹{Number(selectedCustomer.total_spent || 0).toLocaleString('en-IN')}</strong>
                </div>
                {selectedCustomer.promotor_id && (
                  <div className="rc-modal-item">
                    <span>Assigned Promotor</span>
                    <strong>{selectedCustomer.promotor_name || selectedCustomer.promotor_id} ({selectedCustomer.promotor_id})</strong>
                  </div>
                )}
                <div className="rc-modal-item">
                  <span>Registration Date</span>
                  <strong>
                    {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleString('en-GB') : '—'}
                  </strong>
                </div>
              </div>

              {/* Address Box */}
              <div className="rc-box-banner" style={{ background: '#F9FBFA', border: '1px solid #E4ECEB' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6e817e', marginBottom: '6px' }}>
                  Delivery Address
                </span>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#1a2e2b', lineHeight: 1.5 }}>
                  {selectedCustomer.full_address || 'No address registered yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && <div className="rc-toast">{toast}</div>}
    </main>
  )
}
