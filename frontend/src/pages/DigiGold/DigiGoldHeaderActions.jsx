import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, X, ShoppingBag, LogOut, Megaphone, RefreshCw } from 'lucide-react'
import api from '../../api'
import './DigiGoldHeaderActions.css'

export default function DigiGoldHeaderActions({ customerName, customerRole }) {
  const navigate = useNavigate()
  const [panel, setPanel] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const rootRef = useRef(null)
  const bellRef = useRef(null)
  const profileRef = useRef(null)
  const firstActionRef = useRef(null)
  const requestRef = useRef(null)

  const fetchAnnouncements = useCallback(async () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/announcements/', { signal: controller.signal })
      if (!controller.signal.aborted) {
        setAnnouncements(Array.isArray(response.data) ? response.data : [])
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.response?.data?.error || 'Could not load announcements. Please try again.')
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
    return () => requestRef.current?.abort()
  }, [fetchAnnouncements])

  useEffect(() => {
    if (!panel) return undefined
    firstActionRef.current?.focus()
    const onPointerDown = event => {
      if (!rootRef.current?.contains(event.target)) setPanel(null)
    }
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setPanel(null)
        ;(panel === 'profile' ? profileRef : bellRef).current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [panel])

  const toggleAnnouncements = () => {
    if (panel !== 'announcements') fetchAnnouncements()
    setPanel(previous => previous === 'announcements' ? null : 'announcements')
  }

  const logout = () => {
    requestRef.current?.abort()
    localStorage.clear()
    sessionStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dg-header-actions" ref={rootRef}>
      <button
        ref={bellRef}
        className="dg-bell-btn"
        type="button"
        aria-label={`Announcements${announcements.length ? `, ${announcements.length} messages` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={panel === 'announcements'}
        aria-controls={panel === 'announcements' ? 'dg-announcements-panel' : undefined}
        onClick={toggleAnnouncements}
      >
        <Bell size={18} />
        {announcements.length > 0 && <span className="dg-red-dot" />}
      </button>

      <button
        ref={profileRef}
        className="dg-profile-chip dg-account-trigger"
        type="button"
        aria-label="Account options"
        aria-expanded={panel === 'profile'}
        aria-controls={panel === 'profile' ? 'dg-account-panel' : undefined}
        onClick={() => setPanel(previous => previous === 'profile' ? null : 'profile')}
      >
        <span className="dg-avatar">{customerName ? customerName.charAt(0).toUpperCase() : 'U'}</span>
        <span className="dg-profile-info">
          <span className="dg-profile-name">{customerName}</span>
          <span className="dg-profile-role">{customerRole}</span>
        </span>
        <ChevronDown size={14} color="#647474" className={panel === 'profile' ? 'dg-account-chevron-open' : ''} />
      </button>

      {panel === 'profile' && (
        <div className="dg-header-popover dg-account-panel" id="dg-account-panel" aria-label="Account options">
          <div className="dg-account-heading">
            <strong>{customerName}</strong>
            <span>{customerRole}</span>
          </div>
          <button ref={firstActionRef} type="button" className="dg-account-option" onClick={() => { setPanel(null); navigate('/') }}>
            <ShoppingBag size={18} /><span>Back to Shop</span>
          </button>
          <button type="button" className="dg-account-option dg-account-logout" onClick={logout}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </div>
      )}

      {panel === 'announcements' && (
        <section className="dg-header-popover dg-announcements-panel" id="dg-announcements-panel" role="dialog" aria-labelledby="dg-announcements-title">
          <div className="dg-announcements-heading">
            <span className="dg-announcements-heading-icon"><Megaphone size={20} /></span>
            <div><h2 id="dg-announcements-title">Announcements</h2><p>Updates and messages for you</p></div>
            <button ref={firstActionRef} type="button" className="dg-announcements-close" aria-label="Close announcements" onClick={() => { setPanel(null); bellRef.current?.focus() }}><X size={18} /></button>
          </div>
          <div className="dg-announcements-list" aria-busy={loading}>
            {loading ? (
              <div className="dg-announcements-state" role="status"><RefreshCw size={22} className="dg-announcements-spinner" /><p>Loading announcements…</p></div>
            ) : error ? (
              <div className="dg-announcements-state" role="alert"><p>{error}</p><button type="button" onClick={fetchAnnouncements}>Try again</button></div>
            ) : announcements.length === 0 ? (
              <div className="dg-announcements-state"><Bell size={28} /><strong>You’re all caught up</strong><p>New announcements will appear here.</p></div>
            ) : announcements.map(announcement => (
              <article className="dg-announcement-card" key={announcement.id}>
                <div className="dg-announcement-meta">
                  <span>{announcement.target_user ? 'Personal message' : 'Announcement'}</span>
                  {announcement.created_at && <time dateTime={announcement.created_at}>{new Date(announcement.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>}
                </div>
                <h3>{announcement.title}</h3>
                <p>{announcement.message}</p>
              </article>
            ))}
          </div>
          <div className="dg-announcements-footer"><span>Athirai updates</span>{announcements.length} {announcements.length === 1 ? 'message' : 'messages'}</div>
        </section>
      )}
    </div>
  )
}
