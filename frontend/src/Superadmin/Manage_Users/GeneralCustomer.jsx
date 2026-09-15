import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

export default function GeneralCustomer() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
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

  const fetchGeneralCustomers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/general-customers/', {
        params: { search, limit: 300 },
      })
      setRows(res.data.results || [])
      setTotalCount(res.data.total_count || 0)
      setActiveCount(res.data.active_count || 0)
      setTotalOrders(res.data.total_orders || 0)
      setTotalSpent(res.data.total_spent || 0)
    } catch (err) {
      console.error('Error fetching general customers:', err)
      showToast('Failed to load customers. Please check server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchGeneralCustomers()
  }, [search])

  return (
    <main className="gc-page-root">
      <style>{`
        .gc-page-root {
          min-height: 100vh;
          background: #F8FAF9;
          color: #111817;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding-bottom: 60px;
        }
        .gc-shell {
          width: calc(100% - 48px);
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 0;
        }
        .gc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .gc-header-left h1 {
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #073B3F;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .gc-header-left p {
          margin: 0;
          color: #637774;
          font-size: 13.5px;
        }
        .gc-header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .gc-btn-referral {
          padding: 10px 18px;
          border-radius: 10px;
          background: #FFFFFF;
          color: #8C5824;
          border: 1.5px solid #BB8958;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .gc-btn-referral:hover {
          background: #BB8958;
          color: #FFFFFF;
        }
        .gc-btn-refresh {
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
        .gc-btn-refresh:hover {
          background: #F0F6F5;
          border-color: #073B3F;
        }
        .gc-btn-create {
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
        .gc-btn-create:hover {
          background: #0b4e53;
          transform: translateY(-1px);
        }

        /* Stat Cards */
        .gc-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .gc-stat-card {
          background: #FFFFFF;
          border: 1px solid #E1ECEB;
          border-radius: 16px;
          padding: 18px 22px;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.04);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .gc-stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: rgba(7, 59, 63, 0.08);
          color: #073B3F;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .gc-stat-info span {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #6a7d7a;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .gc-stat-info strong {
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          letter-spacing: -0.02em;
        }

        /* Controls / Filter Bar */
        .gc-controls {
          background: #FFFFFF;
          border: 1px solid #E1ECEB;
          border-radius: 16px;
          padding: 14px 18px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }
        .gc-search-box {
          position: relative;
          min-width: 320px;
          flex: 1;
        }
        .gc-search-box input {
          width: 100%;
          border: 1px solid #CFDFDE;
          background: #FAFDFD;
          border-radius: 10px;
          padding: 10px 14px 10px 38px;
          font-size: 13.5px;
          outline: none;
          color: #111817;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .gc-search-box input:focus {
          border-color: #073B3F;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.1);
        }
        .gc-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #7b8e8b;
          pointer-events: none;
        }
        .gc-filters {
          display: flex;
          gap: 8px;
        }
        .gc-filter-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #D1DFDE;
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          color: #4b5f5c;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gc-filter-btn.active {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
        }

        /* Table Card */
        .gc-table-card {
          background: #FFFFFF;
          border: 1px solid #E1ECEB;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.04);
        }
        .gc-table-responsive {
          overflow-x: auto;
          width: 100%;
        }
        .gc-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .gc-table th {
          background: #F6F9F8;
          padding: 14px 18px;
          font-size: 11.5px;
          font-weight: 800;
          color: #073B3F;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #E1ECEB;
          white-space: nowrap;
        }
        .gc-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #EDF3F2;
          font-size: 13.5px;
          color: #2a3d3a;
          vertical-align: middle;
        }
        .gc-table tr:hover td {
          background: #FAFCFB;
        }
        .gc-id-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(7, 59, 63, 0.06);
          border: 1px solid rgba(7, 59, 63, 0.16);
          color: #073B3F;
          padding: 4px 10px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .gc-id-badge:hover {
          background: rgba(7, 59, 63, 0.12);
        }
        .gc-user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .gc-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #073B3F;
          color: #D4AF37;
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .gc-user-meta strong {
          display: block;
          color: #073B3F;
          font-size: 14px;
        }
        .gc-user-meta span {
          display: block;
          font-size: 11px;
          color: #7b8e8b;
          text-transform: capitalize;
        }
        .gc-contact-cell span {
          display: block;
          font-size: 13px;
        }
        .gc-contact-cell small {
          display: block;
          font-size: 11.5px;
          color: #657976;
        }
        .gc-type-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
        }
        .gc-type-pill.direct {
          background: rgba(12, 64, 68, 0.08);
          color: #0C4044;
          border: 1px solid rgba(12, 64, 68, 0.2);
        }
        .gc-type-pill.referred {
          background: rgba(187, 137, 88, 0.12);
          color: #8C5824;
          border: 1px solid rgba(187, 137, 88, 0.25);
        }
        .gc-btn-view {
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
        .gc-btn-view:hover {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
        }

        /* Modal Styles */
        .gc-modal-backdrop {
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
        .gc-modal-box {
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
        .gc-modal-head {
          padding: 24px 28px;
          border-bottom: 1px solid #EDF3F2;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .gc-modal-head h2 {
          margin: 0 0 4px;
          font-family: Georgia, serif;
          font-size: 20px;
          color: #073B3F;
        }
        .gc-modal-head p {
          margin: 0;
          font-size: 13px;
          color: #657976;
        }
        .gc-modal-close {
          background: transparent;
          border: 0;
          font-size: 22px;
          color: #7b8e8b;
          cursor: pointer;
        }
        .gc-modal-body {
          padding: 24px 28px;
        }
        .gc-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .gc-info-item {
          background: #F9FBFA;
          border: 1px solid #E4ECEB;
          border-radius: 12px;
          padding: 12px 16px;
        }
        .gc-info-item span {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #6e817e;
          text-transform: uppercase;
          margin-bottom: 4px;
          letter-spacing: 0.04em;
        }
        .gc-info-item strong {
          font-size: 14px;
          color: #073B3F;
        }
        .gc-addr-box {
          background: #F9FBFA;
          border: 1px solid #E4ECEB;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .gc-addr-box span {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #6e817e;
          text-transform: uppercase;
          margin-bottom: 6px;
          letter-spacing: 0.04em;
        }
        .gc-addr-box p {
          margin: 0;
          font-size: 14px;
          color: #1a2e2b;
          line-height: 1.5;
        }

        /* Toast */
        .gc-toast {
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
          .gc-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .gc-shell {
            width: calc(100% - 24px);
            padding: 20px 0;
          }
          .gc-stats-grid {
            grid-template-columns: 1fr;
          }
          .gc-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .gc-search-box {
            min-width: 100%;
          }
          .gc-filters {
            width: 100%;
            justify-content: space-between;
          }
          .gc-modal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="gc-shell">
        {/* Header */}
        <header className="gc-header">
          <div className="gc-header-left">
            <h1>General Customers (Direct)</h1>
            <p>Directly registered customers who joined through the storefront without any referral link.</p>
          </div>
          <div className="gc-header-actions">
            <button
              className="gc-btn-referral"
              type="button"
              onClick={() => navigate('/referral-customers')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Referral Users
            </button>
            <button className="gc-btn-refresh" type="button" onClick={fetchGeneralCustomers}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
            <button className="gc-btn-create" type="button" onClick={() => navigate('/create-customer')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Customer
            </button>
          </div>
        </header>

        {/* Metric Cards */}
        <section className="gc-stats-grid">
          <div className="gc-stat-card">
            <div className="gc-stat-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
            <div className="gc-stat-info">
              <span>Direct Customers</span>
              <strong>{totalCount}</strong>
            </div>
          </div>

          <div className="gc-stat-card">
            <div className="gc-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="gc-stat-info">
              <span>Active Accounts</span>
              <strong>{activeCount}</strong>
            </div>
          </div>

          <div className="gc-stat-card">
            <div className="gc-stat-icon" style={{ background: 'rgba(12, 64, 68, 0.1)', color: '#0C4044' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div className="gc-stat-info">
              <span>Direct Orders</span>
              <strong>{totalOrders}</strong>
            </div>
          </div>

          <div className="gc-stat-card">
            <div className="gc-stat-icon" style={{ background: 'rgba(7, 59, 63, 0.1)', color: '#073B3F' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="gc-stat-info">
              <span>Direct Spending</span>
              <strong>₹{Number(totalSpent || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="gc-controls">
          <div className="gc-search-box">
            <svg className="gc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, ID, phone, email, town, city, pincode..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(12, 64, 68, 0.08)',
              color: '#073B3F',
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid rgba(12, 64, 68, 0.18)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0C4044' }} />
              Direct Storefront Users
            </span>
          </div>
        </section>

        {/* Table View */}
        <section className="gc-table-card">
          <div className="gc-table-responsive">
            <table className="gc-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Details</th>
                  <th>Contact Info</th>
                  <th>Delivery Location</th>
                  <th>Registration</th>
                  <th>Orders / Spend</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#7b8e8b' }}>
                      Loading customer directory...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#7b8e8b' }}>
                      No customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const initials = (row.first_name?.[0] || 'C').toUpperCase()
                    return (
                      <tr key={row.id}>
                        <td>
                          <button
                            type="button"
                            className="gc-id-badge"
                            onClick={() => handleCopy(row.customer_id, row.id)}
                            title="Click to copy customer ID"
                          >
                            <span>{row.customer_id || `BBCUS${row.id}`}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                        </td>

                        <td>
                          <div className="gc-user-cell">
                            <div className="gc-avatar">{initials}</div>
                            <div className="gc-user-meta">
                              <strong>{row.name}</strong>
                              <span>{row.gender || 'Customer'} {row.dob ? `• DOB: ${row.dob}` : ''}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="gc-contact-cell">
                            <span>{row.email || '—'}</span>
                            <small>{row.mobile_number || '—'}</small>
                          </div>
                        </td>

                        <td>
                          <div className="gc-contact-cell">
                            <span>{[row.city_name, row.state].filter(Boolean).join(', ') || '—'}</span>
                            <small>{row.pincode ? `PIN: ${row.pincode}` : row.town_name || ''}</small>
                          </div>
                        </td>

                        <td>
                          <span className={`gc-type-pill ${row.is_direct ? 'direct' : 'referred'}`}>
                            {row.is_direct ? 'Direct Online' : 'Referred'}
                          </span>
                          <small style={{ display: 'block', fontSize: '11px', color: '#7b8e8b', marginTop: '3px' }}>
                            {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—'}
                          </small>
                        </td>

                        <td>
                          <strong>{row.order_count || 0} Orders</strong>
                          <small style={{ display: 'block', color: '#657976', fontSize: '11.5px' }}>
                            ₹{Number(row.total_spent || 0).toLocaleString('en-IN')}
                          </small>
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: row.is_active ? '#0C4044' : '#C92035',
                            }}
                          >
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: row.is_active ? '#0C4044' : '#C92035',
                              }}
                            />
                            {row.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="gc-btn-view"
                            onClick={() => setSelectedCustomer(row)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="gc-modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="gc-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="gc-modal-head">
              <div>
                <h2>{selectedCustomer.name}</h2>
                <p>
                  Customer ID: <strong>{selectedCustomer.customer_id}</strong> &bull;{' '}
                  <span className={`gc-type-pill ${selectedCustomer.is_direct ? 'direct' : 'referred'}`}>
                    {selectedCustomer.is_direct ? 'Direct Online Registration' : `Referred via ${selectedCustomer.referrer_name}`}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className="gc-modal-close"
                onClick={() => setSelectedCustomer(null)}
              >
                ✕
              </button>
            </div>

            <div className="gc-modal-body">
              <div className="gc-modal-grid">
                <div className="gc-info-item">
                  <span>Full Name</span>
                  <strong>{selectedCustomer.name}</strong>
                </div>
                <div className="gc-info-item">
                  <span>Customer ID</span>
                  <strong>{selectedCustomer.customer_id}</strong>
                </div>
                <div className="gc-info-item">
                  <span>Email Address</span>
                  <strong>{selectedCustomer.email || '—'}</strong>
                </div>
                <div className="gc-info-item">
                  <span>Phone Number</span>
                  <strong>{selectedCustomer.mobile_number || '—'}</strong>
                </div>
                <div className="gc-info-item">
                  <span>Gender</span>
                  <strong style={{ textTransform: 'capitalize' }}>{selectedCustomer.gender || '—'}</strong>
                </div>
                <div className="gc-info-item">
                  <span>Date of Birth</span>
                  <strong>{selectedCustomer.dob || '—'}</strong>
                </div>
                <div className="gc-info-item">
                  <span>Orders Placed</span>
                  <strong>{selectedCustomer.order_count || 0} Orders</strong>
                </div>
                <div className="gc-info-item">
                  <span>Total Spent</span>
                  <strong>₹{Number(selectedCustomer.total_spent || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="gc-addr-box">
                <span>Registered Address Details</span>
                <p>
                  <strong>Door No:</strong> {selectedCustomer.door_no || '—'}<br />
                  <strong>Street:</strong> {selectedCustomer.street_name || '—'}<br />
                  <strong>Town:</strong> {selectedCustomer.town_name || '—'}<br />
                  <strong>City:</strong> {selectedCustomer.city_name || '—'}<br />
                  <strong>District:</strong> {selectedCustomer.district || '—'}<br />
                  <strong>State:</strong> {selectedCustomer.state || '—'}<br />
                  <strong>Pincode:</strong> {selectedCustomer.pincode || '—'}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="gc-btn-create"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="gc-toast">{toast}</div>}
    </main>
  )
}
