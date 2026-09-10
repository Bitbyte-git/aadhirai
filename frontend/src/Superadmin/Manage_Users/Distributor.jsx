import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

const PAGE_SIZE = 300

export default function Distributor() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [actionOpen, setActionOpen] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [copiedUrlId, setCopiedUrlId] = useState(null)
  const [copyingUrl, setCopyingUrl] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleCopyUrl = async (person, publicId) => {
    setCopyingUrl(person.id)
    try {
      const res = await api.post('/generate-referral-link/', {
        user_id: person.user_id,
        public_id: publicId,
      })
      const url = `${window.location.origin}/register?ref=${res.data.token}`
      await navigator.clipboard.writeText(url)
      setCopiedUrlId(person.id)
      showToast('Referral link copied to clipboard')
      setTimeout(() => setCopiedUrlId(null), 2000)
    } catch (err) {
      alert('Failed to generate referral URL')
    } finally {
      setCopyingUrl(null)
    }
  }

  const handleCopyId = async (idText, uniqueKey) => {
    if (!idText) return
    try {
      await navigator.clipboard.writeText(idText)
      setCopiedId(uniqueKey)
      showToast(`Copied ${idText}`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchData = async (signal, currentOffset, searchTerm, append, retryCount = 0) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const res = await api.get('/dealers/list/', {
        signal,
        params: { offset: currentOffset, limit: PAGE_SIZE, search: searchTerm },
      })
      const newRows = res.data.results || []
      setRows(prev => (append ? [...prev, ...newRows] : newRows))
      setHasMore(!!res.data.has_more)
      setTotalCount(res.data.total_count || 0)
      setLoading(false)
      setLoadingMore(false)
    } catch (e) {
      if (e.name === 'CanceledError' || e.name === 'AbortError') return
      console.error('fetch distributors error:', e)
      if (retryCount < 5) {
        setTimeout(() => {
          fetchData(signal, currentOffset, searchTerm, append, retryCount + 1)
        }, 1500)
      } else {
        if (!append) setRows([])
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const controller = new AbortController()
    setOffset(0)
    fetchData(controller.signal, 0, search, false)
    return () => controller.abort()
  }, [search])

  const handleLoadMore = () => {
    const controller = new AbortController()
    const nextOffset = offset + PAGE_SIZE
    setOffset(nextOffset)
    fetchData(controller.signal, nextOffset, search, true)
  }

  const handleRefresh = () => {
    const controller = new AbortController()
    setOffset(0)
    fetchData(controller.signal, 0, search, false)
  }

  const exportCSV = () => {
    if (!rows.length) return
    const headers = ['S.No', 'Distributor ID', 'First Name', 'Last Name', 'Email', 'Mobile', 'City']
    const csvRows = rows.map((r, i) => [
      i + 1,
      `"${r.dealer_id || ''}"`,
      `"${(r.first_name || '').replace(/"/g, '""')}"`,
      `"${(r.last_name || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${r.mobile_number || ''}"`,
      `"${(r.city_name || '').replace(/"/g, '""')}"`,
    ])
    const blob = new Blob([[headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `distributors_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Exported Distributors CSV')
  }

  useEffect(() => {
    const closeMenu = () => setActionOpen(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  return (
    <div className="mu-root">
      <style>{`
        .mu-root {
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background: #F8FAF9;
          background-image: 
            radial-gradient(at 0% 0%, rgba(7, 59, 63, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(204, 168, 129, 0.06) 0px, transparent 50%);
          color: #111817;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
        }

        .mu-shell {
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px 48px 64px;
          box-sizing: border-box;
        }

        .mu-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .mu-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #728A87;
          font-weight: 500;
        }

        .mu-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #D9E4E3;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          color: #073B3F;
          cursor: pointer;
          transition: all 140ms ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }

        .mu-back-btn:hover {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          transform: translateY(-1px);
        }

        .mu-header-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          box-shadow: 0 6px 24px rgba(7, 59, 63, 0.04);
          margin-bottom: 24px;
        }

        .mu-header-info h1 {
          font-size: 26px;
          font-weight: 800;
          color: #073B3F;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mu-role-badge {
          background: #E8F2F1;
          color: #073B3F;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .mu-header-sub {
          font-size: 13.5px;
          color: #728A87;
          margin: 0;
          max-width: 680px;
          line-height: 1.5;
        }

        .mu-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .mu-refresh-btn, .mu-export-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .mu-refresh-btn {
          background: #FFFFFF;
          border: 1px solid #D9E4E3;
          color: #073B3F;
        }

        .mu-refresh-btn:hover {
          background: #F4F8F7;
          border-color: #073B3F;
        }

        .mu-export-btn {
          background: #073B3F;
          border: 1px solid #073B3F;
          color: #FFFFFF;
        }

        .mu-export-btn:hover {
          background: #0C5258;
          transform: translateY(-1px);
        }

        .mu-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .mu-stat-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 20px 22px;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 180ms ease;
        }

        .mu-stat-card:hover {
          border-color: #073B3F;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(7, 59, 63, 0.06);
        }

        .mu-stat-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #728A87;
          margin-bottom: 8px;
          display: block;
        }

        .mu-stat-number {
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1.1;
        }

        .mu-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #F4F7F6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #073B3F;
          flex-shrink: 0;
        }

        .mu-panel {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 20px;
          box-shadow: 0 6px 24px rgba(7, 59, 63, 0.04);
          overflow: hidden;
        }

        .mu-panel-header {
          padding: 20px 24px;
          border-bottom: 1px solid #EDF2F1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .mu-panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mu-count-badge {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          background: #F0F5F4;
          color: #073B3F;
        }

        .mu-search-box {
          display: flex;
          align-items: center;
          background: #F4F7F6;
          border: 1px solid #D9E4E3;
          border-radius: 12px;
          padding: 8px 14px;
          gap: 10px;
          width: 300px;
          max-width: 100%;
          transition: all 180ms ease;
        }

        .mu-search-box:focus-within {
          background: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.1);
        }

        .mu-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13px;
          color: #111817;
        }

        .mu-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .mu-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }

        .mu-table thead tr {
          background: #FAFBFB;
          border-bottom: 1px solid #EDF2F1;
        }

        .mu-table th {
          padding: 14px 16px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #728A87;
          text-align: left;
          white-space: nowrap;
        }

        .mu-table tbody tr {
          border-bottom: 1px solid #EDF2F1;
          transition: background 120ms ease;
        }

        .mu-table tbody tr:hover {
          background: #F5FAF9;
        }

        .mu-table td {
          padding: 13px 16px;
          vertical-align: middle;
          white-space: nowrap;
        }

        .mu-sno {
          font-weight: 800;
          color: #073B3F;
          font-family: monospace;
          text-align: center;
          width: 44px;
        }

        .mu-id-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F0F5F4;
          border: 1px solid #D5E3E1;
          padding: 4px 10px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 12px;
          font-weight: 700;
          color: #073B3F;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .mu-id-pill:hover {
          background: #E3ECEB;
          border-color: #073B3F;
        }

        .mu-user-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mu-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #073B3F, #126368);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
          text-transform: uppercase;
        }

        .mu-name {
          font-weight: 700;
          color: #0A2F33;
          font-size: 13.5px;
        }

        .mu-email {
          color: #728A87;
          font-size: 12px;
          margin-top: 2px;
        }

        .mu-phone-link {
          color: #364B49;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .mu-phone-link:hover {
          color: #073B3F;
          text-decoration: underline;
        }

        .mu-city-pill {
          background: #F4F7F6;
          border: 1px solid #E1EBEA;
          color: #364B49;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .mu-action-cell {
          position: relative;
          text-align: right;
        }

        .mu-action-trigger {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #D5E3E1;
          background: #FFFFFF;
          color: #073B3F;
          font-weight: 900;
          cursor: pointer;
          transition: all 140ms ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .mu-action-trigger:hover, .mu-action-trigger.is-open {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.15);
        }

        .mu-menu-popup {
          position: absolute;
          z-index: 90;
          top: calc(100% + 4px);
          right: 12px;
          width: 220px;
          background: #FFFFFF;
          border: 1px solid #D5E3E1;
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 16px 40px rgba(7, 59, 63, 0.14);
          text-align: left;
        }

        .mu-menu-popup button {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-radius: 8px;
          color: #111817;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 120ms ease;
        }

        .mu-menu-popup button:hover {
          background: #F0F5F4;
          color: #073B3F;
        }

        .mu-mobile-cards {
          display: none;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
        }

        .mu-mobile-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.03);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mu-mobile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .mu-mobile-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          background: #F8FAF9;
          padding: 10px 12px;
          border-radius: 12px;
        }

        .mu-mobile-item-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #728A87;
        }

        .mu-mobile-item-val {
          font-size: 12.5px;
          font-weight: 700;
          color: #073B3F;
          margin-top: 2px;
        }

        .mu-loadmore-wrap {
          padding: 20px;
          display: flex;
          justify-content: center;
          border-top: 1px solid #EDF2F1;
        }

        .mu-loadmore-btn {
          padding: 10px 24px;
          border-radius: 12px;
          border: 1px solid #D9E4E3;
          background: #FFFFFF;
          color: #073B3F;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .mu-loadmore-btn:hover {
          background: #073B3F;
          color: #FFFFFF;
          border-color: #073B3F;
        }

        .mu-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #073B3F;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(7, 59, 63, 0.3);
          z-index: 9999;
          animation: toastSlide 200ms ease;
        }

        @keyframes toastSlide {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes skelShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .mu-skel-line {
          height: 14px;
          border-radius: 4px;
          background: linear-gradient(90deg, #E7EDEC 25%, #F3F3F0 50%, #E7EDEC 75%);
          background-size: 200% 100%;
          animation: skelShimmer 1.4s ease-in-out infinite;
        }

        @media (max-width: 1100px) {
          .mu-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .mu-shell { padding: 16px 14px 48px; }
          .mu-header-card { padding: 20px 18px; flex-direction: column; align-items: flex-start; }
          .mu-header-actions { width: 100%; }
          .mu-refresh-btn, .mu-export-btn { flex: 1; justify-content: center; }
          .mu-stats-grid { grid-template-columns: 1fr; }
          .mu-table-wrap { display: none; }
          .mu-mobile-cards { display: flex; }
          .mu-search-box { width: 100%; }
        }
      `}</style>

      <div className="mu-shell">
        {/* Topbar */}
        <div className="mu-topbar">
          <div className="mu-breadcrumb">
            <span>Manage Users</span>
            <span>/</span>
            <span style={{ color: '#073B3F', fontWeight: 700 }}>Distributors</span>
          </div>
          <button className="mu-back-btn" onClick={() => navigate('/super-admin')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header Card */}
        <div className="mu-header-card">
          <div className="mu-header-info">
            <h1>
              <span>Distributor Network</span>
              <span className="mu-role-badge">Tier 4 • Channel Partners</span>
            </h1>
            <p className="mu-header-sub">
              Manage primary distributors, regional channel network oversight, partner performance, and hierarchy trees.
            </p>
          </div>
          <div className="mu-header-actions">
            <button className="mu-refresh-btn" onClick={handleRefresh} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button className="mu-export-btn" onClick={exportCSV} disabled={loading || !rows.length}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="mu-stats-grid">
          <div className="mu-stat-card">
            <div>
              <span className="mu-stat-title">Total Distributors</span>
              <span className="mu-stat-number">{totalCount}</span>
            </div>
            <div className="mu-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>

          <div className="mu-stat-card">
            <div>
              <span className="mu-stat-title">Loaded on Page</span>
              <span className="mu-stat-number">{rows.length}</span>
            </div>
            <div className="mu-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </div>
          </div>

          <div className="mu-stat-card">
            <div>
              <span className="mu-stat-title">Search Filter</span>
              <span className="mu-stat-number" style={{ fontSize: '18px' }}>
                {search ? `"${search}"` : 'All Distributors'}
              </span>
            </div>
            <div className="mu-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          <div className="mu-stat-card">
            <div>
              <span className="mu-stat-title">Network Tier</span>
              <span className="mu-stat-number" style={{ fontSize: '18px', color: '#7C3AED' }}>
                Dealer
              </span>
            </div>
            <div className="mu-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Panel Container */}
        <div className="mu-panel">
          <div className="mu-panel-header">
            <div className="mu-panel-title-wrap">
              <span style={{ fontWeight: 800, color: '#073B3F', fontSize: '15px' }}>
                Distributor Directory
              </span>
              <span className="mu-count-badge">
                Showing {rows.length} of {totalCount}
              </span>
            </div>

            <div className="mu-search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#728A87" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="mu-search-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by ID, name, email, phone..."
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#728A87', padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          {loading ? (
            <div className="mu-table-wrap">
              <table className="mu-table">
                <thead>
                  <tr>
                    <th style={{ width: '44px', textAlign: 'center' }}>S.NO</th>
                    <th>DISTRIBUTOR ID</th>
                    <th>NAME & EMAIL</th>
                    <th>PHONE NUMBER</th>
                    <th>CITY</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}><div className="mu-skel-line" style={{ width: '20px', margin: '0 auto' }} /></td>
                      <td><div className="mu-skel-line" style={{ width: '110px' }} /></td>
                      <td><div className="mu-skel-line" style={{ width: '160px' }} /></td>
                      <td><div className="mu-skel-line" style={{ width: '100px' }} /></td>
                      <td><div className="mu-skel-line" style={{ width: '90px' }} /></td>
                      <td style={{ textAlign: 'right' }}><div className="mu-skel-line" style={{ width: '32px', marginLeft: 'auto' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#F0F5F4', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#728A87' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h4 style={{ margin: '0 0 6px', color: '#073B3F', fontSize: '16px', fontWeight: 800 }}>
                {search ? `No distributors match "${search}"` : 'No Distributors Found'}
              </h4>
              <p style={{ margin: 0, color: '#728A87', fontSize: '13.5px' }}>
                Try adjusting your search criteria or clear the search field.
              </p>
            </div>
          ) : (
            <>
              <div className="mu-table-wrap">
                <table className="mu-table">
                  <thead>
                    <tr>
                      <th style={{ width: '44px', textAlign: 'center' }}>S.NO</th>
                      <th>DISTRIBUTOR ID</th>
                      <th>NAME & EMAIL</th>
                      <th>PHONE NUMBER</th>
                      <th>CITY</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a, i) => {
                      const initials = `${(a.first_name || 'D')[0]}${(a.last_name || '')[0] || ''}`.toUpperCase()
                      return (
                        <tr key={a.id || a.dealer_id}>
                          <td className="mu-sno">{i + 1}</td>
                          <td>
                            <span
                              className="mu-id-pill"
                              onClick={() => handleCopyId(a.dealer_id, `did-${a.id}`)}
                              title="Click to copy ID"
                            >
                              <span>{a.dealer_id || '—'}</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                {copiedId === `did-${a.id}` ? (
                                  <polyline points="20 6 9 17 4 12" />
                                ) : (
                                  <>
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </>
                                )}
                              </svg>
                            </span>
                          </td>
                          <td>
                            <div className="mu-user-col">
                              <div className="mu-avatar">{initials}</div>
                              <div>
                                <div className="mu-name">{a.first_name} {a.last_name}</div>
                                <div className="mu-email">{a.email || 'No email provided'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {a.mobile_number ? (
                              <a href={`tel:${a.mobile_number}`} className="mu-phone-link">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                <span>{a.mobile_number}</span>
                              </a>
                            ) : (
                              <span style={{ color: '#A0B2AF' }}>—</span>
                            )}
                          </td>
                          <td>
                            {a.city_name ? (
                              <span className="mu-city-pill">{a.city_name}</span>
                            ) : (
                              <span style={{ color: '#A0B2AF' }}>—</span>
                            )}
                          </td>
                          <td className="mu-action-cell" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={`mu-action-trigger ${actionOpen === a.id ? 'is-open' : ''}`}
                              onClick={() => setActionOpen(cur => cur === a.id ? null : a.id)}
                              title="Actions"
                            >
                              •••
                            </button>
                            {actionOpen === a.id && (
                              <div className="mu-menu-popup">
                                <button type="button" onClick={() => { setSelectedDetail(a); setActionOpen(null); }}>
                                  <span>View Profile</span>
                                  <span>↗</span>
                                </button>
                                <button type="button" onClick={() => navigate(`/hierarchy-sales-count?role=dealer&id=${a.id}`)}>
                                  <span>Performance Report</span>
                                  <span>↗</span>
                                </button>
                                <button type="button" onClick={() => navigate(`/superadmin-hierarchy-grid?role=dealer&id=${a.id}`)}>
                                  <span>View Hierarchy</span>
                                  <span>↗</span>
                                </button>
                                <button type="button" onClick={() => handleCopyUrl(a, a.dealer_id)}>
                                  <span>{copiedUrlId === a.id ? 'URL Copied!' : copyingUrl === a.id ? 'Copying…' : 'Copy Referral URL'}</span>
                                  <span>{copiedUrlId === a.id ? '✓' : '🔗'}</span>
                                </button>
                                <button type="button" onClick={() => handleCopyId(a.dealer_id, `did-${a.id}`)}>
                                  <span>{copiedId === `did-${a.id}` ? 'ID Copied!' : 'Copy Distributor ID'}</span>
                                  <span>{copiedId === `did-${a.id}` ? '✓' : '⧉'}</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="mu-mobile-cards">
                {rows.map((a, i) => {
                  const initials = `${(a.first_name || 'D')[0]}${(a.last_name || '')[0] || ''}`.toUpperCase()
                  return (
                    <div key={`mob-${a.id || a.dealer_id}`} className="mu-mobile-card">
                      <div className="mu-mobile-top">
                        <div className="mu-user-col">
                          <div className="mu-avatar">{initials}</div>
                          <div>
                            <div className="mu-name">{a.first_name} {a.last_name}</div>
                            <div className="mu-email">{a.email || 'No email provided'}</div>
                          </div>
                        </div>
                        <span className="mu-id-pill" onClick={() => handleCopyId(a.dealer_id, `did-${a.id}`)}>
                          {a.dealer_id}
                        </span>
                      </div>

                      <div className="mu-mobile-grid">
                        <div>
                          <div className="mu-mobile-item-label">Mobile</div>
                          <div className="mu-mobile-item-val">{a.mobile_number || '—'}</div>
                        </div>
                        <div>
                          <div className="mu-mobile-item-label">City</div>
                          <div className="mu-mobile-item-val">{a.city_name || '—'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(a)}
                          style={{ flex: 1, padding: '9px', borderRadius: '10px', border: '1px solid #D9E4E3', background: '#FFFFFF', color: '#073B3F', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/hierarchy-sales-count?role=dealer&id=${a.id}`)}
                          style={{ flex: 1, padding: '9px', borderRadius: '10px', border: '1px solid #073B3F', background: '#073B3F', color: '#FFFFFF', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
                        >
                          Performance ↗
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mu-loadmore-wrap">
                  <button
                    type="button"
                    className="mu-loadmore-btn"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading more distributors...' : `Load More (${rows.length} / ${totalCount})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <div
          onClick={() => setSelectedDetail(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1350, padding: 20, display: 'grid', placeItems: 'center', background: 'rgba(7,31,34,.52)', backdropFilter: 'blur(8px)' }}
        >
          <section
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(540px, 100%)', overflow: 'hidden', border: '1px solid rgba(204,168,129,.38)', borderRadius: 24, background: '#FFFFFF', boxShadow: '0 35px 90px rgba(7,31,34,.3)' }}
          >
            <header style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', background: 'linear-gradient(135deg, #073B3F 0%, #0D4E53 100%)' }}>
              <div>
                <small style={{ display: 'block', marginBottom: 5, color: '#E1C497', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase' }}>
                  DISTRIBUTOR PROFILE
                </small>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
                  {selectedDetail.first_name} {selectedDetail.last_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                style={{ width: 34, height: 34, border: '1px solid rgba(255,255,255,.25)', borderRadius: '50%', color: '#FFFFFF', background: 'rgba(255,255,255,.1)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </header>

            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              {[
                ['Distributor ID', selectedDetail.dealer_id],
                ['Email', selectedDetail.email],
                ['Mobile Number', selectedDetail.mobile_number],
                ['City', selectedDetail.city_name],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '14px 16px', border: '1px solid #E5EFEF', borderRadius: 14, background: '#F8FAF9' }}>
                  <small style={{ display: 'block', marginBottom: 4, color: '#728A87', fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    {label}
                  </small>
                  <strong style={{ color: '#073B3F', fontSize: 13.5, overflowWrap: 'anywhere' }}>
                    {value || 'Not provided'}
                  </strong>
                </div>
              ))}
            </div>

            <footer style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                style={{ padding: '10px 22px', border: '1px solid #D5E3E1', borderRadius: 12, color: '#073B3F', background: '#F0F5F4', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Floating Toast */}
      {toast && (
        <div className="mu-toast">
          {toast}
        </div>
      )}
    </div>
  )
}