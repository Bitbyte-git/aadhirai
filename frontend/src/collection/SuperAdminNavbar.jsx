import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import logo from '../assets/logo.png'
import api from '../api'


function Icon({ name, size = 17, className = '' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, className }
  const icons = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10.5V21h14V10.5" /><path d="M9 21v-6h6v6" /></>,
    box: <><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    orders: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
    rate: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.03 3.84l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.38.5.7.9.9.34.18.72.27 1.1.27H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
    mic: <><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><path d="M12 18v4" /><path d="M9 22h6" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    menu: <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>,
    close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    stock: <><path d="M20 7 12 3 4 7" /><path d="M4 7v10l8 4 8-4V7" /><path d="M4 7l8 4 8-4" /><path d="M12 11v10" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 6 12 12 16 14" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    spark: <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10" /><path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0" /></>,
    gem: <path d="M6 3h12l4 6-10 12L2 9l4-6z" />,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
    megaphone: <><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>,
    creditCard: <><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>,
    hierarchy: <><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="3" y="17" width="6" height="4" rx="1" /><rect x="15" y="17" width="6" height="4" rx="1" /><path d="M12 7v4m-6 6v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" /></>,
    shop: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    tag: <><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><circle cx="7" cy="7" r=".5" fill="currentColor" /></>,
    crown: <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />,
    cart: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
  }
  return <svg {...common}>{icons[name] || icons.search}</svg>
}

export default function SuperAdminNavbar({
  showSidebar = false,
  onGoldRate,
  onTodayRates,
  onAddCoins,
  onRequests,
  onBirthdays,
  onAnniversaries,
  onWorkAnniversaries,
  onSendAnnouncement,
  onMyAnnouncements,
  onVoiceSearch,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const [voiceQuery, setVoiceQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const [openMenu, setOpenMenu] = useState(null)
  const closeTimerRef = useRef(null)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)   // ── Super Admin Command Menu Drawer ──
  const [menuSearch, setMenuSearch] = useState('')
  const [expandedSections, setExpandedSections] = useState({})
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState(false)

  const toggleSection = (label) => {
    setExpandedSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  // Close Command Menu on ESC key
  useEffect(() => {
    if (!showMobileDrawer) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowMobileDrawer(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [showMobileDrawer])

  // Global ⌘K / Ctrl+K shortcut to focus global search
  useEffect(() => {
    const handleKbdShortcut = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKbdShortcut)
    return () => window.removeEventListener('keydown', handleKbdShortcut)
  }, [])

  const [searchAlert, setSearchAlert] = useState(null)

  // ── ADVANCED GOOGLE / YOUTUBE SEARCH & VOICE ENGINE ──
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [voiceInterim, setVoiceInterim] = useState('')
  const [voiceStatus, setVoiceStatus] = useState('ready') // 'ready' | 'listening' | 'processing' | 'error'
  const [voiceErrorMsg, setVoiceErrorMsg] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('san_recent_searches') || '[]')
    } catch { return [] }
  })
  const [apiUsers, setApiUsers] = useState([])
  const [isSearchingApi, setIsSearchingApi] = useState(false)
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)
  const apiDebounceRef = useRef(null)

  const addRecentSearch = (term) => {
    if (!term || !term.trim()) return
    const clean = term.trim()
    setRecentSearches(prev => {
      const next = [clean, ...prev.filter(x => x.toLowerCase() !== clean.toLowerCase())].slice(0, 6)
      try { localStorage.setItem('san_recent_searches', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const removeRecentSearch = (e, term) => {
    e.stopPropagation()
    setRecentSearches(prev => {
      const next = prev.filter(x => x !== term)
      try { localStorage.setItem('san_recent_searches', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const clearRecentSearches = (e) => {
    e.stopPropagation()
    setRecentSearches([])
    try { localStorage.removeItem('san_recent_searches') } catch {}
  }

  const showSearchAlert = (title, message, query = '', type = 'warning', showSuggestions = true) => {
    setSearchAlert({
      title,
      message,
      query,
      type,
      suggestions: showSuggestions ? [
        { label: 'Add Product', path: '/add-product' },
        { label: 'Admin Orders', path: '/admin-orders' },
        { label: 'Retailers', path: '/superadmin/manage-users/retailer' },
        { label: 'Wholesale Dealers', path: '/superadmin/manage-users/wholesale-dealer' },
        { label: 'Distributors', path: '/superadmin/manage-users/distributor' },
        { label: 'Super Stockists', path: '/superadmin/manage-users/super-stockist' },
        { label: 'Customers', path: '/superadmin/manage-users/customer' },
        { label: 'Hierarchy Grid', path: '/superadmin-hierarchy-grid' },
      ] : []
    })
  }

  // ── Gold Rate / Today Rates (moved from Dashboard) ──
  const [showRatePopup, setShowRatePopup] = useState(false)
  const [showTodayRates, setShowTodayRates] = useState(false)
  const [metalPrices, setMetalPrices] = useState({
    gold22k: null, gold24k: null, silver: null,
    diamond18k: null, diamond22k: null, platinum92: null,
  })
  const [metalLoading, setMetalLoading] = useState(false)
  const [dbRateDate, setDbRateDate] = useState(null)
  const [rateForm, setRateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    gold_22k: '', gold_24k: '', silver_999: '',
    diamond_18k: '', diamond_22k: '', platinum_92: '',
  })
 const [rateMsg, setRateMsg] = useState('')
  const [rateSaving, setRateSaving] = useState(false)

  // ── Celebrations (moved from Dashboard) ──
  const [showBirthdayList, setShowBirthdayList] = useState(false)
  const [showAnniversaryList, setShowAnniversaryList] = useState(false)
  const [showJoinDateList, setShowJoinDateList] = useState(false)
  const [birthdayList, setBirthdayList] = useState([])
  const [anniversaryList, setAnniversaryList] = useState([])
  const [joinDateList, setJoinDateList] = useState([])
  const [celebLoading, setCelebLoading] = useState(false)
  const [specialAnnForm, setSpecialAnnForm] = useState({ title: '', message: '', roles: [] })
  const [showSpecialAnn, setShowSpecialAnn] = useState(false)
  const [specialAnnMsg, setSpecialAnnMsg] = useState('')
  const [specialAnnSending, setSpecialAnnSending] = useState(false)

  // ── Announcements (moved from Dashboard) ──
 const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', roles: [] })
  const [announcementMsg, setAnnouncementMsg] = useState('')
  const [announcingSending, setAnnouncingSending] = useState(false)
  const [showMyAnnouncements, setShowMyAnnouncements] = useState(false)
  const [myAnnouncements, setMyAnnouncements] = useState([])

  // ── Requests (moved from Dashboard) ──
  const [showRequests, setShowRequests] = useState(false)
  const [profileRequests, setProfileRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestMsg, setRequestMsg] = useState('')
  const [proofModal, setProofModal] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [proofType, setProofType] = useState('')
  const [proofLoading, setProofLoading] = useState(false)

  const fetchProfileRequests = async () => {
    try {
      const res = await api.get('/profile-update-request/')
      setProfileRequests(res.data)
    } catch (err) {
      setRequestMsg('Failed to load requests')
    }
  }

  const approveProfileRequest = async (id) => {
    try {
      await api.post(`/profile-update-request/${id}/approve/`)
      setRequestMsg('Request approved successfully!')
      setSelectedRequest(null)
      fetchProfileRequests()
    } catch (err) {
      setRequestMsg('Approve failed: ' + JSON.stringify(err.response?.data))
    }
  }

  const fetchMyAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/')
      const sorted = [...res.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setMyAnnouncements(sorted)
    } catch { /* ignore */ }
  }

  const fetchCelebrations = async () => {
    setCelebLoading(true)
    try {
      const [adminsRes, dealerRes, sdRes, proRes, cusRes] = await Promise.allSettled([
        api.get('/admins/'),
        api.get('/dealers/list/'),
        api.get('/sub-dealers/list/'),
        api.get('/promotors/list/'),
        api.get('/customers/'),
      ])
      const admins = adminsRes.status === 'fulfilled' ? (adminsRes.value.data?.results || adminsRes.value.data || []) : []
      const dealers = dealerRes.status === 'fulfilled' ? (dealerRes.value.data?.results || dealerRes.value.data || []) : []
      const sds = sdRes.status === 'fulfilled' ? (sdRes.value.data?.results || sdRes.value.data || []) : []
      const pros = proRes.status === 'fulfilled' ? (proRes.value.data?.results || proRes.value.data || []) : []
      const cuss = cusRes.status === 'fulfilled' ? (cusRes.value.data?.results || cusRes.value.data || []) : []

      const allMembers = [
        ...admins.map(m => ({ ...m, _role: 'Admin', _id: m.admin_id, _roleColor: '#BDCFCE', _dob: m.dob, _ann: m.anniversary_date, _joined: m.user?.created_at || null })),
        ...dealers.map(m => ({ ...m, _role: 'Dealer', _id: m.dealer_id, _roleColor: '#0C4044', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...sds.map(m => ({ ...m, _role: 'SubDealer', _id: m.sub_dealer_id, _roleColor: '#BB8958', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...pros.map(m => ({ ...m, _role: 'Promotor', _id: m.promotor_id, _roleColor: '#CCA881', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...cuss.map(m => ({ ...m, _role: 'Customer', _id: m.customer_id, _roleColor: '#C92035', _dob: m.dob || null, _ann: m.anniversary_date || null, _joined: m.user?.created_at || m.created_at || null })),
      ]

      const today = new Date()
      const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      function parseDateLocal(str) {
        if (!str) return null
        const [y, m, d] = str.split('-').map(Number)
        return new Date(y, m - 1, d)
      }

      const bdays = allMembers.filter(m => {
        if (!m._dob) return false
        const d = parseDateLocal(m._dob)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      })
      setBirthdayList(bdays)

      const anns = allMembers.filter(m => {
        if (!m._ann) return false
        const d = parseDateLocal(m._ann)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      })
      setAnniversaryList(anns)

      const joins = allMembers.filter(m => {
        if (!m._joined) return false
        const d = new Date(m._joined)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      }).map(m => {
        const joinedDate = new Date(m._joined)
        const years = today.getFullYear() - joinedDate.getFullYear()
        return { ...m, _yearsCompleted: years }
      })
      setJoinDateList(joins)
        } catch (e) { console.error('fetchCelebrations error:', e) }
    setCelebLoading(false)
  }

  const fetchMetalPrices = async () => {
    setMetalLoading(true)
    try {
      const res = await api.get('/metal-rates/')
      const d = res.data
      setMetalPrices({
        gold22k: d.gold_22k ? parseFloat(d.gold_22k) : null,
        gold24k: d.gold_24k ? parseFloat(d.gold_24k) : null,
        silver: d.silver_999 ? parseFloat(d.silver_999) : null,
        diamond18k: d.diamond_18k ? parseFloat(d.diamond_18k) : null,
        diamond22k: d.diamond_22k ? parseFloat(d.diamond_22k) : null,
        platinum92: d.platinum_92 ? parseFloat(d.platinum_92) : null,
      })
      setDbRateDate(d.date)
    } catch (e) {
      setMetalPrices({ gold22k: null, gold24k: null, silver: null, diamond18k: null, diamond22k: null, platinum92: null })
      setDbRateDate(null)
    } finally {
      setMetalLoading(false)
    }
  }

  useEffect(() => {
    fetchMetalPrices()
  }, [])

  const openMenuNow = (label) => {
    clearTimeout(closeTimerRef.current)
    setOpenMenu(label)
  }
  const scheduleCloseMenu = () => {
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setOpenMenu(null), 200)
  }

  // ── KEYBOARD SHORTCUTS & CLICK OUTSIDE ──
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setShowSuggestions(true)
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setShowSuggestions(true)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false)
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // ── LIVE DIRECTORY / CUSTOMER SEARCH DEBOUNCE ──
  useEffect(() => {
    const q = voiceQuery.trim()
    if (!q || q.length < 2) {
      setApiUsers([])
      setIsSearchingApi(false)
      return
    }
    clearTimeout(apiDebounceRef.current)
    setIsSearchingApi(true)
    apiDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search/?q=${encodeURIComponent(q)}`)
        const data = res.data?.results || res.data || []
        setApiUsers(Array.isArray(data) ? data.slice(0, 4) : [])
      } catch {
        setApiUsers([])
      } finally {
        setIsSearchingApi(false)
      }
    }, 260)
    return () => clearTimeout(apiDebounceRef.current)
  }, [voiceQuery])

  // ── AUDIO CHIME FEEDBACK (GOOGLE / YOUTUBE STYLE) ──
  const playChime = (type = 'start') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (type === 'start') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(520, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.22)
      } else if (type === 'success') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.25)
      }
    } catch { /* audio not allowed */ }
  }

  // ── MASTER SEARCH CATALOG WITH RICH SLANG & TAMIL VOCABULARY ──
  const SEARCH_CATALOG = [
    {
      id: 'today-rates',
      title: 'Today Gold Rate',
      category: 'Rates & Gold',
      icon: 'rate',
      description: 'View today 22K, 24K gold, silver and platinum rates',
      action: () => { if (onTodayRates) onTodayRates(); else { setShowTodayRates(true); fetchMetalPrices() } },
      keywords: ['gold rate', 'rate', 'gold price', 'metal price', 'today rate', 'today gold rate', 'thangam', 'thangam rate', 'thanga vilai', 'thangam ethana', 'rate evlo', 'rate paakanum', 'vellie rate', 'silver', 'platinum', 'தங்க விலை', 'தங்கம்', 'விலை', 'வெள்ளி', '22k', '24k']
    },
    {
      id: 'add-rate',
      title: 'Add / Update Gold Rate',
      category: 'Rates & Gold',
      icon: 'rate',
      description: 'Update live market prices for gold, silver and platinum',
      action: () => { if (onGoldRate) onGoldRate(); else { setShowRatePopup(true); fetchMetalPrices() } },
      keywords: ['add gold rate', 'update gold rate', 'rate entry', 'enter rate', 'rate add', 'rate podanum', 'rate maathanum', 'rate update', 'விலை சேர்க்க']
    },
    {
      id: 'admin-orders',
      title: 'Admin Orders',
      category: 'Orders & Catalog',
      icon: 'orders',
      path: '/admin-orders',
      description: 'Customer orders, invoices and fulfillment status',
      keywords: ['orders', 'order', 'admin orders', 'all orders', 'customer orders', 'booking', 'orders list', 'order status', 'order kaatu', 'aadar', 'ஆர்டர்கள்', 'ஆர்டர்', 'புக்கிங்']
    },
    {
      id: 'add-product',
      title: 'Add New Product',
      category: 'Orders & Catalog',
      icon: 'box',
      path: '/add-product',
      description: 'Create and list brand new product inventory',
      keywords: ['add product', 'new product', 'create product', 'products', 'product add', 'puthu product', 'porul', 'item', 'பொருள்', 'பொருட்கள்', 'பொருள் சேர்க்க']
    },
    {
      id: 'inventory-stock',
      title: 'Inventory & Sold Out',
      category: 'Orders & Catalog',
      icon: 'stock',
      path: '/sold-out-products',
      description: 'View out-of-stock items and current inventory levels',
      keywords: ['inventory', 'stock', 'sold out', 'sold out products', 'stock list', 'சரக்கு', 'இருப்பு']
    },
    {
      id: 'add-jewellery',
      title: 'Add Jewellery',
      category: 'Coins & Jewellery',
      icon: 'gem',
      path: '/add-jewellery',
      description: 'Upload jewellery design with weight and purity',
      keywords: ['add jewellery', 'jewellery add', 'new jewellery', 'naga podanum', 'நகை சேர்க்க']
    },
    {
      id: 'available-jewellery',
      title: 'Available Jewellery',
      category: 'Coins & Jewellery',
      icon: 'gem',
      path: '/available-jewellery',
      description: 'Browse available necklaces, bangles, rings and sets',
      keywords: ['available jewellery', 'jewellery', 'jewelry', 'jewellery list', 'naga', 'nagai', 'thanga nagai', 'jewel', 'நகைகள்', 'நகை', 'நகை பட்டியல்']
    },
    {
      id: 'jewellery-requests',
      title: 'Jewellery Requests',
      category: 'Coins & Jewellery',
      icon: 'gem',
      path: '/jewellery-requests',
      description: 'Review and approve customer jewellery purchase requests',
      keywords: ['jewellery requests', 'jewellery approval', 'naga request', 'நகை கோரிக்கை']
    },
    {
      id: 'jewellery-transactions',
      title: 'Jewellery Transactions',
      category: 'Coins & Jewellery',
      icon: 'gem',
      path: '/jewellery-transactions',
      description: 'Audit history of all jewellery transfers and sales',
      keywords: ['jewellery transactions', 'jewellery history', 'naga parimatram']
    },
    {
      id: 'buy-coin',
      title: 'Buy & Add Coins',
      category: 'Coins & Jewellery',
      icon: 'coin',
      path: '/buy-coin',
      action: onAddCoins ? () => onAddCoins() : undefined,
      description: 'Purchase and add physical gold/silver coins to vault',
      keywords: ['add coins', 'buy coin', 'coin vanga', 'kaasu vanga', 'காசு வாங்க', 'நாணயம் வாங்க']
    },
    {
      id: 'available-coins',
      title: 'Available Coins',
      category: 'Coins & Jewellery',
      icon: 'coin',
      path: '/available-coins',
      description: 'Current vault coin stock and denominations',
      keywords: ['available coins', 'coins', 'coin', 'kaasu', 'thanga kaasu', 'stored coins', 'நாணயம்', 'காசு', 'நாணயங்கள்']
    },
    {
      id: 'coin-requests',
      title: 'Coin Requests',
      category: 'Coins & Jewellery',
      icon: 'coin',
      path: '/coin-requests-page',
      description: 'Pending member requests for gold coin purchases',
      keywords: ['coin requests', 'kaasu request', 'requests coins']
    },
    {
      id: 'coin-transactions',
      title: 'Coin Transactions',
      category: 'Coins & Jewellery',
      icon: 'coin',
      path: '/coin-transactions',
      description: 'Complete ledger of all coin transfers and purchases',
      keywords: ['coin transactions', 'coin history', 'kaasu parimatram']
    },
    {
      id: 'send-aug-coins',
      title: 'Send AUG Coins',
      category: 'Coins & Jewellery',
      icon: 'coin',
      path: '/superadmin-send-coins',
      description: 'Directly credit and allocate AUG coins to members',
      keywords: ['add aug coin', 'send coin', 'aug coins', 'send coins', 'coin anupu']
    },
    {
      id: 'super-stockists',
      title: 'Super Stockists',
      category: 'Network & Users',
      icon: 'user',
      path: '/superadmin/manage-users/super-stockist',
      description: 'Top-tier Super Stockist franchise directory',
      keywords: ['super stockist', 'super stockists', 'stockist', 'stockists', 'ஸ்டாக்கிஸ்ட்']
    },
    {
      id: 'distributors',
      title: 'Distributors',
      category: 'Network & Users',
      icon: 'user',
      path: '/superadmin/manage-users/distributor',
      description: 'Manage regional distributors and accounts',
      keywords: ['distributor', 'distributors', 'டிஸ்ட்ரிபியூட்டர்', 'விநியோகஸ்தர்']
    },
    {
      id: 'wholesale-dealers',
      title: 'Wholesale Dealers',
      category: 'Network & Users',
      icon: 'user',
      path: '/superadmin/manage-users/wholesale-dealer',
      description: 'B2B Wholesale jewelers and merchant accounts',
      keywords: ['wholesale dealer', 'wholesale dealers', 'dealer', 'dealers', 'wholesale', 'டீலர்', 'மொத்த வியாபாரி']
    },
    {
      id: 'retailers',
      title: 'Retailers',
      category: 'Network & Users',
      icon: 'user',
      path: '/superadmin/manage-users/retailer',
      description: 'Retail jewelers and showcase partners',
      keywords: ['retailer', 'retailers', 'சில்லறை விற்பனையாளர்', 'சில்லறை']
    },
    {
      id: 'customers',
      title: 'Manage Customers',
      category: 'Network & Users',
      icon: 'user',
      path: '/superadmin/manage-users/customer',
      description: 'Customer list, verification, wallet & orders',
      keywords: ['customer', 'customers', 'manage customers', 'vadikkaiyalar', 'customer thedu', 'வாடிக்கையாளர்', 'வாடிக்கையாளர்கள்']
    },
    {
      id: 'general-customers',
      title: 'General Customers',
      category: 'Network & Users',
      icon: 'user',
      path: '/general-customers',
      description: 'Walk-in and unregistered direct retail customers',
      keywords: ['general customer', 'general customers', 'பொது வாடிக்கையாளர்']
    },
    {
      id: 'referral-customers',
      title: 'Referral Customers',
      category: 'Network & Users',
      icon: 'user',
      path: '/referral-customers',
      description: 'Members registered through sponsorship referrals',
      keywords: ['referral customer', 'referral customers', 'ரெபரல்']
    },
    {
      id: 'create-customer',
      title: 'Create Customer',
      category: 'Network & Users',
      icon: 'user',
      path: '/create-customer',
      description: 'Onboard a new customer profile manually',
      keywords: ['create customer', 'new customer', 'add customer', 'புதிய வாடிக்கையாளர்']
    },
    {
      id: 'create-super-stockist',
      title: 'Create Super Stockist',
      category: 'Network & Users',
      icon: 'user',
      path: '/create-super-stockist',
      description: 'Create and appoint a new Super Stockist account',
      keywords: ['create super stockist', 'new super stockist', 'add stockist']
    },
    {
      id: 'hierarchy-grid',
      title: 'Hierarchy Grid',
      category: 'Network & Users',
      icon: 'user',
      path: '/superadmin-hierarchy-grid',
      description: 'Compact table view of all levels, uplines and downlines',
      keywords: ['hierarchy grid', 'hierarchy', 'network grid', 'team grid', 'members grid', 'ஹைரார்க்கி', 'அமைப்பு']
    },
    {
      id: 'hierarchy-tree',
      title: 'Hierarchy Tree',
      category: 'Network & Users',
      icon: 'user',
      path: '/superadmin-hierarchy',
      description: 'Visual interactive hierarchy tree diagram',
      keywords: ['hierarchy tree', 'tree view', 'organisation tree', 'network tree', 'மர அமைப்பு']
    },
    {
      id: 'shop-list',
      title: 'Shop List',
      category: 'Network & Users',
      icon: 'home',
      path: '/superadmin/manage-users/shops',
      description: 'Athirai retail merchant shops & stores',
      keywords: ['shops', 'shop list', 'manage shops', 'kadai', 'kadai list', 'கடைகள்', 'கடை']
    },
    {
      id: 'shop-hierarchy',
      title: 'Shop Hierarchy',
      category: 'Network & Users',
      icon: 'home',
      path: '/shop-hierarchy-grid',
      description: 'Franchise and branch shop structure grid',
      keywords: ['shop hierarchy', 'shop tree', 'branch tree']
    },
    {
      id: 'shop-report',
      title: 'Shop Report',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/shop-report',
      description: 'Sales, footfall and performance metrics per shop',
      keywords: ['shop report', 'kadai report', 'shop sales', 'கடை அறிக்கை']
    },
    {
      id: 'sales-report',
      title: 'Sales Report',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/sales-report',
      description: 'Total revenue, product sales breakdowns and trends',
      keywords: ['sales report', 'sales', 'sales summary', 'viyabaram', 'வியாபாரம்', 'விற்பனை', 'விற்பனை அறிக்கை']
    },
    {
      id: 'hierarchy-sales-count',
      title: 'Hierarchy Sales Count',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/hierarchy-sales-count',
      description: 'Downline sales volume, team points and milestones',
      keywords: ['hierarchy sales report', 'sales count', 'sales count report']
    },
    {
      id: 'athirai-profit',
      title: 'Athirai Profit (73% & Commissions)',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/athirai-profit',
      description: 'Comprehensive 73% share, balance commissions, and general customer net profit',
      keywords: ['athirai profit', 'profit', '73%', 'balance commission', 'superadmin profit', 'labam', 'லாபம்']
    },
    {
      id: 'athirai-revenue',
      title: 'Athirai Net Revenue',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/athirai-revenue',
      description: 'Company net turnover, gross margins and profits',
      keywords: ['athirai revenue', 'net revenue', 'company revenue', 'varumanam', 'வருமானம்']
    },
    {
      id: 'payments',
      title: 'All Sales & Payments',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/superadmin-payments',
      description: 'Full payment gateway transaction records',
      keywords: ['all sales', 'payments', 'payment list', 'panam', 'பணம்']
    },
    {
      id: 'commissions',
      title: 'Commissions',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/commissions',
      description: 'Multi-level commission payouts and status',
      keywords: ['commissions', 'commission', 'leaderboard commission', 'கம்மிஷன்']
    },
    {
      id: 'my-commission',
      title: 'My Commission',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/my-commission',
      description: 'Superadmin direct revenue share & commission logs',
      keywords: ['my commission', 'own commission']
    },
    {
      id: 'residual-commission',
      title: 'Residual Commission',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/superadmin-commission',
      description: 'Ongoing residual earnings and monthly incentives',
      keywords: ['residual commission', 'super admin commission']
    },
    {
      id: 'autopay',
      title: 'Autopay List',
      category: 'Reports & Finance',
      icon: 'chart',
      path: '/superadmin-autopay-list',
      description: 'Automated bank clearing and payouts queue',
      keywords: ['autopay', 'autopay list', 'auto payout']
    },
    {
      id: 'coins-reward',
      title: 'Login Reward',
      category: 'Reports & Finance',
      icon: 'coin',
      path: '/coins-reward',
      description: 'Daily member login streak reward settings',
      keywords: ['login reward', 'rewards', 'daily reward', 'ரிவார்ட்']
    },
    {
      id: 'login-reward-tx',
      title: 'Login Reward Transactions',
      category: 'Reports & Finance',
      icon: 'coin',
      path: '/login-reward-transactions',
      description: 'Member attendance and reward disbursement log',
      keywords: ['login reward transactions', 'reward history']
    },
    {
      id: 'login-active',
      title: 'Login Active Users',
      category: 'Network & Users',
      icon: 'user',
      path: '/login-active',
      description: 'Members who logged in recently',
      keywords: ['login active', 'active list', 'active users', 'active members', 'செயலில் உள்ளவர்கள்']
    },
    {
      id: 'login-inactive',
      title: 'Login Inactive Users',
      category: 'Network & Users',
      icon: 'user',
      path: '/login-inactive',
      description: 'Dormant user accounts needing follow-up',
      keywords: ['login inactive', 'inactive list', 'inactive users', 'செயலற்றவர்கள்']
    },
    {
      id: 'birthdays',
      title: "Today's Birthdays",
      category: 'Celebrations',
      icon: 'spark',
      description: 'View members celebrating birthdays today and send wishes',
      action: () => { if (onBirthdays) onBirthdays(); else { setShowBirthdayList(true); fetchCelebrations() } },
      keywords: ['today birthday', 'birthday', 'birthdays', 'piranthanal', 'piranthanaal', 'பிறந்தநாள்']
    },
    {
      id: 'anniversaries',
      title: "Today's Anniversaries",
      category: 'Celebrations',
      icon: 'spark',
      description: 'Members celebrating wedding anniversaries today',
      action: () => { if (onAnniversaries) onAnniversaries(); else { setShowAnniversaryList(true); fetchCelebrations() } },
      keywords: ['today anniversary', 'anniversary', 'anniversaries', 'wedding anniversary', 'kalyana naal', 'திருமண நாள்']
    },
    {
      id: 'join-dates',
      title: 'Joining Anniversaries',
      category: 'Celebrations',
      icon: 'spark',
      description: 'Members completing 1+ years with Athirai family',
      action: () => { if (onWorkAnniversaries) onWorkAnniversaries(); else { setShowJoinDateList(true); fetchCelebrations() } },
      keywords: ['joining anniversary', 'join date', 'work anniversary', 'join anniversary', 'சேர்க்கை நாள்']
    },
    {
      id: 'announcements',
      title: 'Send Announcement',
      category: 'Announcements',
      icon: 'alert',
      description: 'Publish system notifications to apps and portals',
      action: () => { if (onSendAnnouncement) onSendAnnouncement(); else { setShowAnnouncement(true); setAnnouncementMsg('') } },
      keywords: ['send announcement', 'announcement', 'broadcast', 'arivippu', 'செய்தி', 'அறிவிப்பு']
    },
    {
      id: 'my-announcements',
      title: 'My Announcements',
      category: 'Announcements',
      icon: 'alert',
      description: 'History of previous notices and announcements',
      action: () => { if (onMyAnnouncements) onMyAnnouncements(); else { setShowMyAnnouncements(true); fetchMyAnnouncements() } },
      keywords: ['my announcements', 'announcements list', 'past announcements']
    },
    {
      id: 'requests',
      title: 'Profile Update Requests',
      category: 'Management',
      icon: 'alert',
      description: 'Review bank, phone and profile change submissions',
      action: () => { if (onRequests) onRequests(); else { setShowRequests(true); setRequestMsg(''); fetchProfileRequests() } },
      keywords: ['requests', 'profile request', 'approval', 'kyc approval', 'கோரிக்கை', 'கோரிக்கைகள்']
    },
  ]

  // ── POWER SEARCH EXECUTOR (TAMIL / TANGLISH / ENGLISH / SLANG) ──
  const executeSearch = async (query) => {
    const raw = (query || '').trim()
    if (!raw) return

    addRecentSearch(raw)
    setVoiceQuery('')
    setShowSuggestions(false)
    setIsSearchFocused(false)

    const lower = raw.toLowerCase()

    // 1. Direct or keyword match in SEARCH_CATALOG
    let bestMatch = null
    let bestScore = 0

    for (const item of SEARCH_CATALOG) {
      if (item.title.toLowerCase() === lower) {
        bestMatch = item
        bestScore = 100
        break
      }
      for (const kw of item.keywords) {
        const kwLower = kw.toLowerCase()
        if (lower === kwLower) {
          bestMatch = item
          bestScore = 95
          break
        }
        if (lower.includes(kwLower) || kwLower.includes(lower)) {
          const score = 80 + Math.min(kwLower.length, 10)
          if (score > bestScore) {
            bestScore = score
            bestMatch = item
          }
        }
      }
      if (bestScore === 100) break
    }

    if (bestMatch && bestScore >= 80) {
      if (bestMatch.action) {
        bestMatch.action()
      } else if (bestMatch.path) {
        navigate(bestMatch.path)
      }
      return
    }

    // 2. Fallback check for user/customer query in backend
    try {
      const res = await api.get(`/users/search/?q=${encodeURIComponent(raw)}`)
      const found = res.data?.results || res.data || []
      if (Array.isArray(found) && found.length > 0) {
        navigate(`/superadmin/manage-users/customer?search=${encodeURIComponent(raw)}`)
        return
      }
    } catch { /* ignore */ }

    // 3. If partial match exists in catalog with lower score
    if (bestMatch) {
      if (bestMatch.action) {
        bestMatch.action()
      } else if (bestMatch.path) {
        navigate(bestMatch.path)
      }
      return
    }

    // 4. Show navigation alert notice with quick suggestions
    showSearchAlert(
      'Search Result',
      `No direct page or record matched "${raw}". You can choose from top recommendations below:`,
      raw,
      'info',
      true
    )
  }

  // Backwards compatibility alias
  const submitVoiceSearch = executeSearch

  // ── YOUTUBE / GOOGLE VOICE MODAL CONTROLS ──
  const startVoiceModal = () => {
    setShowVoiceModal(true)
    setVoiceInterim('')
    setVoiceErrorMsg('')
    setVoiceStatus('listening')
    startSpeechRecognition()
  }

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus('error')
      setVoiceErrorMsg('Voice search is not supported in this browser. Please use Chrome, Edge or Safari.')
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    playChime('start')
    const recognition = new SpeechRecognition()
    recognition.lang = navigator.language?.startsWith('ta') ? 'ta-IN' : 'en-IN'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => {
      setIsListening(true)
      setVoiceStatus('listening')
      setVoiceErrorMsg('')
    }

    recognition.onresult = (event) => {
      let interim = ''
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }
      const currentText = finalTranscript || interim
      setVoiceInterim(currentText)

      if (finalTranscript) {
        setVoiceStatus('processing')
        playChime('success')
        setTimeout(() => {
          setShowVoiceModal(false)
          setIsListening(false)
          executeSearch(finalTranscript)
        }, 400)
      }
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceStatus('error')
        setVoiceErrorMsg('Microphone access blocked. Click the lock/camera icon in your address bar and allow microphone access.')
      } else if (event.error === 'no-speech') {
        setVoiceStatus('error')
        setVoiceErrorMsg('No speech detected. Please tap the microphone and speak again.')
      } else {
        setVoiceStatus('error')
        setVoiceErrorMsg(`Voice error: ${event.error}. Please try again.`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (err) {
      setVoiceStatus('error')
      setVoiceErrorMsg('Failed to initialize microphone. Please check permissions.')
    }
  }

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    setIsListening(false)
  }

  const handleCloseVoiceModal = () => {
    stopVoiceRecognition()
    setShowVoiceModal(false)
    setVoiceInterim('')
    setVoiceStatus('ready')
  }

  // Legacy mic button toggle
  const toggleMic = () => {
    startVoiceModal()
  }

  // ── SEARCH INPUT & SUGGESTIONS HANDLERS ──
  const handleInputChange = (e) => {
    const val = e.target.value
    setVoiceQuery(val)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    setIsSearchFocused(true)
    setShowSuggestions(true)
  }

  const handleClearSearch = (e) => {
    e.stopPropagation()
    setVoiceQuery('')
    searchInputRef.current?.focus()
    setShowSuggestions(true)
  }

  const getDisplaySuggestions = () => {
    const q = voiceQuery.trim().toLowerCase()
    if (!q) {
      return SEARCH_CATALOG.slice(0, 6)
    }
    return SEARCH_CATALOG.filter(item => {
      if (item.title.toLowerCase().includes(q)) return true
      if (item.category.toLowerCase().includes(q)) return true
      if (item.keywords.some(k => k.toLowerCase().includes(q))) return true
      return false
    }).slice(0, 7)
  }

  const handleSelectSuggestion = (item) => {
    addRecentSearch(item.title)
    setVoiceQuery('')
    setShowSuggestions(false)
    setIsSearchFocused(false)
    if (item.action) {
      item.action()
    } else if (item.path) {
      navigate(item.path)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setIsSearchFocused(false)
      searchInputRef.current?.blur()
      return
    }

    const currentList = getDisplaySuggestions()

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (currentList.length === 0) return
      setSelectedIndex(prev => (prev + 1) % currentList.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (currentList.length === 0) return
      setSelectedIndex(prev => (prev - 1 + currentList.length) % currentList.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < currentList.length) {
        handleSelectSuggestion(currentList[selectedIndex])
      } else {
        executeSearch(voiceQuery)
      }
    }
  }

  const run = (handler, fallback) => {
    if (handler) {
      handler()
      return
    }
    if (fallback) navigate(fallback)
  }
  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const management = [
    ['Today Gold Rate', () => { setShowTodayRates(true); fetchMetalPrices() }],
    ['Add Gold Rate', () => { setShowRatePopup(true); fetchMetalPrices() }],
    ['Add Product', () => navigate('/add-product')],
    ['Orders', () => navigate('/admin-orders')],
    ['Requests', () => { setShowRequests(true); setRequestMsg(''); fetchProfileRequests() }],
    ['Hierarchy Grid', () => navigate('/superadmin-hierarchy-grid')],
    ['Hierarchy Tree', () => navigate('/superadmin-hierarchy')],
    ['Shop Hierarchy', () => navigate('/shop-hierarchy-grid')],
    ['Shop Hierarchy Tree', () => navigate('/shop-hierarchy-tree')],
    ['Shop Report', () => navigate('/shop-report')],
  ]
  const usersMenu = [
    ['Shop List', () => navigate('/superadmin/manage-users/shops')],
    ['Super Stockists', () => navigate('/superadmin/manage-users/super-stockist')],
    ['Distributors', () => navigate('/superadmin/manage-users/distributor')],
    ['Wholesale Dealers', () => navigate('/superadmin/manage-users/wholesale-dealer')],
    ['Retailers', () => navigate('/superadmin/manage-users/retailer')],
    ['Customers', () => navigate('/superadmin/manage-users/customer')],
    ['Create Super Stockist', () => navigate('/create-super-stockist')],
    ['General Customer', () => navigate('/general-customers')],
    ['Referral Customer', () => navigate('/referral-customers')],
    ['Create Customer', () => navigate('/create-customer')],
  ]
  const announcements = [
    ['Send Announcement', () => { setShowAnnouncement(true); setAnnouncementMsg('') }],
    ['My Announcements', () => { setShowMyAnnouncements(true); fetchMyAnnouncements() }],
    ["Today's Birthdays", () => { setShowBirthdayList(true); fetchCelebrations() }],
    ["Today's Anniversaries", () => { setShowAnniversaryList(true); fetchCelebrations() }],
    ['Joining Anniversaries', () => { setShowJoinDateList(true); fetchCelebrations() }],
  ]
  const coins = [
    ['Add Coins', () => navigate('/buy-coin')],
    ['Available Coins', () => navigate('/available-coins')],
    ['Requests Coins', () => navigate('/coin-requests-page')],
    ['Transaction Coins History', () => navigate('/coin-transactions')],
    ['Add Jewellery', () => navigate('/add-jewellery')],
    ['Available Jewellery', () => navigate('/available-jewellery')],
    ['Requests Jewellery', () => navigate('/jewellery-requests')],
    ['Jewellery Transactions', () => navigate('/jewellery-transactions')],
  ]
  const reports = [
    ['Login Reward', () => navigate('/coins-reward')],
    ['Login Reward Transactions', () => navigate('/login-reward-transactions')],
    ['Sales Report', () => navigate('/sales-report')],
    ['Login Active', () => navigate('/login-active')],
    ['Login Inactive', () => navigate('/login-inactive')],
  ]
   const promotion = [
    ['Retailers', () => navigate('/promotions/retailer')],
    ['Wholesale Dealer', () => navigate('/promotions/wholesale-dealer')],
    ['Distributor', () => navigate('/promotions/distributor')],
    ['Super Stockist', () => navigate('/promotions/super-stockist')],
  ]
  const payment = [
    ['All Sales', () => navigate('/superadmin-payments')],
    ['Athirai Profit', () => navigate('/athirai-profit')],
    ['Athirai Revenue', () => navigate('/athirai-revenue')],
    ['General Customer Revenue', () => navigate('/general-customer-revenue')],
    ['Residual Commission', () => navigate('/superadmin-commission')],
    ['My Commission', () => navigate('/my-commission')],
    ['Commissions', () => navigate('/commissions')],
    ['Add AUG Coins', () => navigate('/superadmin-send-coins')],
    ['Autopay List', () => navigate('/superadmin-autopay-list')],
  ]
  const inventory = [
    ['Add Product', () => navigate('/add-product')],
    ['Sold Out Products', () => navigate('/sold-out-products')],
    ['Available Jewellery', () => navigate('/available-jewellery')],
    ['Add Jewellery', () => navigate('/add-jewellery')],
  ]
  const mobileMenuGroups = [
    ['Management', management],
    ['Announcements', announcements],
    ['Users', usersMenu],
    ['Coins', coins],
    ['Reports', reports],
    ['Promotion', promotion],
    ['Payment', payment],
    ['Inventory', inventory],
  ]

  const adminEmail = localStorage.getItem('email') || localStorage.getItem('user_email') || 'superadmin@athirai.com'

  const drawerManagementItems = [
    { label: 'Today Gold Rate', action: () => { setShowTodayRates(true); fetchMetalPrices() } },
    { label: 'Add Gold Rate', action: () => { setShowRatePopup(true); fetchMetalPrices() } },
    { label: 'Add Product', path: '/add-product', action: () => navigate('/add-product') },
    { label: 'Orders', path: '/admin-orders', action: () => navigate('/admin-orders') },
    { label: 'Requests', action: () => { setShowRequests(true); setRequestMsg(''); fetchProfileRequests() } },
    { label: 'Hierarchy Grid', path: '/superadmin-hierarchy-grid', action: () => navigate('/superadmin-hierarchy-grid') },
    { label: 'Hierarchy Tree', path: '/superadmin-hierarchy', action: () => navigate('/superadmin-hierarchy') },
    { label: 'Shop Hierarchy', path: '/shop-hierarchy-grid', action: () => navigate('/shop-hierarchy-grid') },
    { label: 'Shop Hierarchy Tree', path: '/shop-hierarchy-tree', action: () => navigate('/shop-hierarchy-tree') },
    { label: 'Shop Report', path: '/shop-report', action: () => navigate('/shop-report') },
  ]

  const drawerUsersItems = [
    { label: 'Shop List', path: '/superadmin/manage-users/shops', action: () => navigate('/superadmin/manage-users/shops') },
    { label: 'Super Stockists', path: '/superadmin/manage-users/super-stockist', action: () => navigate('/superadmin/manage-users/super-stockist') },
    { label: 'Distributors', path: '/superadmin/manage-users/distributor', action: () => navigate('/superadmin/manage-users/distributor') },
    { label: 'Wholesale Dealers', path: '/superadmin/manage-users/wholesale-dealer', action: () => navigate('/superadmin/manage-users/wholesale-dealer') },
    { label: 'Retailers', path: '/superadmin/manage-users/retailer', action: () => navigate('/superadmin/manage-users/retailer') },
    { label: 'Customers', path: '/superadmin/manage-users/customer', action: () => navigate('/superadmin/manage-users/customer') },
    { label: 'Create Super Stockist', path: '/create-super-stockist', action: () => navigate('/create-super-stockist') },
    { label: 'General Customer', path: '/general-customers', action: () => navigate('/general-customers') },
    { label: 'Referral Customer', path: '/referral-customers', action: () => navigate('/referral-customers') },
    { label: 'Create Customer', path: '/create-customer', action: () => navigate('/create-customer') },
  ]

  const drawerHierarchyItems = [
    { label: 'Hierarchy Grid', path: '/superadmin-hierarchy-grid', action: () => navigate('/superadmin-hierarchy-grid') },
    { label: 'Hierarchy Tree', path: '/superadmin-hierarchy', action: () => navigate('/superadmin-hierarchy') },
    { label: 'Shop Hierarchy', path: '/shop-hierarchy-grid', action: () => navigate('/shop-hierarchy-grid') },
    { label: 'Shop Hierarchy Tree', path: '/shop-hierarchy-tree', action: () => navigate('/shop-hierarchy-tree') },
  ]

  const drawerShopsItems = [
    { label: 'Shop Report', path: '/shop-report', action: () => navigate('/shop-report') },
    { label: 'Shop List', path: '/superadmin/manage-users/shops', action: () => navigate('/superadmin/manage-users/shops') },
    { label: 'Super Stockists', path: '/superadmin/manage-users/super-stockist', action: () => navigate('/superadmin/manage-users/super-stockist') },
    { label: 'Distributors', path: '/superadmin/manage-users/distributor', action: () => navigate('/superadmin/manage-users/distributor') },
    { label: 'Wholesale Dealers', path: '/superadmin/manage-users/wholesale-dealer', action: () => navigate('/superadmin/manage-users/wholesale-dealer') },
    { label: 'Retailers', path: '/superadmin/manage-users/retailer', action: () => navigate('/superadmin/manage-users/retailer') },
    { label: 'Create Super Stockist', path: '/create-super-stockist', action: () => navigate('/create-super-stockist') },
  ]

  const drawerAnnouncementsItems = [
    { label: 'Send Announcement', action: () => { setShowAnnouncement(true); setAnnouncementMsg('') } },
    { label: 'My Announcements', action: () => { setShowMyAnnouncements(true); fetchMyAnnouncements() } },
    { label: "Today's Birthdays", action: () => { setShowBirthdayList(true); fetchCelebrations() } },
    { label: "Today's Anniversaries", action: () => { setShowAnniversaryList(true); fetchCelebrations() } },
    { label: 'Joining Anniversaries', action: () => { setShowJoinDateList(true); fetchCelebrations() } },
  ]

  const drawerCoinsItems = [
    { label: 'Add Coins', path: '/buy-coin', action: () => navigate('/buy-coin') },
    { label: 'Available Coins', path: '/available-coins', action: () => navigate('/available-coins') },
    { label: 'Requests Coins', path: '/coin-requests-page', action: () => navigate('/coin-requests-page') },
    { label: 'Transaction Coins History', path: '/coin-transactions', action: () => navigate('/coin-transactions') },
  ]

  const drawerJewelleryItems = [
    { label: 'Add Jewellery', path: '/add-jewellery', action: () => navigate('/add-jewellery') },
    { label: 'Available Jewellery', path: '/available-jewellery', action: () => navigate('/available-jewellery') },
    { label: 'Requests Jewellery', path: '/jewellery-requests', action: () => navigate('/jewellery-requests') },
    { label: 'Jewellery Transactions', path: '/jewellery-transactions', action: () => navigate('/jewellery-transactions') },
  ]

  const drawerReportsItems = [
    { label: 'Login Reward', path: '/coins-reward', action: () => navigate('/coins-reward') },
    { label: 'Login Reward Transactions', path: '/login-reward-transactions', action: () => navigate('/login-reward-transactions') },
    { label: 'Sales Report', path: '/sales-report', action: () => navigate('/sales-report') },
    { label: 'Login Active', path: '/login-active', action: () => navigate('/login-active') },
    { label: 'Login Inactive', path: '/login-inactive', action: () => navigate('/login-inactive') },
  ]

  const drawerPromotionItems = [
    { label: 'Retailers', path: '/promotions/retailer', action: () => navigate('/promotions/retailer') },
    { label: 'Wholesale Dealer', path: '/promotions/wholesale-dealer', action: () => navigate('/promotions/wholesale-dealer') },
    { label: 'Distributor', path: '/promotions/distributor', action: () => navigate('/promotions/distributor') },
    { label: 'Super Stockist', path: '/promotions/super-stockist', action: () => navigate('/promotions/super-stockist') },
  ]

  const drawerPaymentItems = [
    { label: 'All Sales', path: '/superadmin-payments', action: () => navigate('/superadmin-payments') },
    { label: 'Athirai Profit', path: '/athirai-profit', action: () => navigate('/athirai-profit') },
    { label: 'Athirai Revenue', path: '/athirai-revenue', action: () => navigate('/athirai-revenue') },
    { label: 'General Customer Revenue', path: '/general-customer-revenue', action: () => navigate('/general-customer-revenue') },
    { label: 'Residual Commission', path: '/superadmin-commission', action: () => navigate('/superadmin-commission') },
    { label: 'My Commission', path: '/my-commission', action: () => navigate('/my-commission') },
    { label: 'Commissions', path: '/commissions', action: () => navigate('/commissions') },
    { label: 'Add AUG Coins', path: '/superadmin-send-coins', action: () => navigate('/superadmin-send-coins') },
    { label: 'Autopay List', path: '/superadmin-autopay-list', action: () => navigate('/superadmin-autopay-list') },
  ]

  const drawerInventoryItems = [
    { label: 'Add Product', path: '/add-product', action: () => navigate('/add-product') },
    { label: 'Sold Out Products', path: '/sold-out-products', action: () => navigate('/sold-out-products') },
    { label: 'Available Jewellery', path: '/available-jewellery', action: () => navigate('/available-jewellery') },
    { label: 'Add Jewellery', path: '/add-jewellery', action: () => navigate('/add-jewellery') },
  ]

  const drawerMainGroups = [
    { label: 'Management', icon: 'settings', items: drawerManagementItems },
    { label: 'Announcements', icon: 'megaphone', items: drawerAnnouncementsItems },
    { label: 'Users', icon: 'user', items: drawerUsersItems },
    { label: 'Coins', icon: 'coin', items: drawerCoinsItems },
    { label: 'Hierarchy', icon: 'hierarchy', items: drawerHierarchyItems },
    { label: 'Shops', icon: 'shop', items: drawerShopsItems },
    { label: 'Jewellery', icon: 'gem', items: drawerJewelleryItems },
    { label: 'Reports', icon: 'chart', items: drawerReportsItems },
    { label: 'Promotion', icon: 'tag', items: drawerPromotionItems },
    { label: 'Payment', icon: 'creditCard', items: drawerPaymentItems },
    { label: 'Inventory', icon: 'box', items: drawerInventoryItems },
  ]

  const drawerQuickAccess = [
    { label: 'View Orders', path: '/admin-orders', icon: 'cart', bg: '#EAF7EE', color: '#059669', action: () => navigate('/admin-orders') },
    { label: 'User Management', path: '/superadmin/manage-users/customer', icon: 'user', bg: '#E6F6F5', color: '#0D9488', action: () => navigate('/superadmin/manage-users/customer') },
    { label: 'Add Announcement', path: null, icon: 'megaphone', bg: '#EBF4FE', color: '#0284C7', action: () => { setShowAnnouncement(true); setAnnouncementMsg('') } },
    { label: 'Create Promotion', path: null, icon: 'tag', bg: '#FEF3E7', color: '#D97706', action: () => { setShowMobileDrawer(false); setShowPromotionModal(true) } },
  ]

  const allSearchableMenuItems = useMemo(() => {
    const list = []
    list.push({ title: 'Dashboard', section: 'MAIN', icon: 'home', path: '/super-admin', action: () => navigate('/super-admin') })
    drawerQuickAccess.forEach(qa => {
      list.push({ title: qa.label, section: 'QUICK ACCESS', icon: qa.icon, path: qa.path, action: qa.action })
    })
    drawerMainGroups.forEach(grp => {
      grp.items.forEach(item => {
        list.push({ title: item.label, section: grp.label, icon: grp.icon, path: item.path, action: item.action })
      })
    })
    return list
  }, [])

  const filteredMenuItems = menuSearch.trim()
    ? allSearchableMenuItems.filter(item =>
        item.title.toLowerCase().includes(menuSearch.toLowerCase().trim()) ||
        item.section.toLowerCase().includes(menuSearch.toLowerCase().trim())
      )
    : []

  const groupIcons = {
    Management: 'settings',
    Announcements: 'megaphone',
    Users: 'user',
    Coins: 'coin',
    Reports: 'chart',
    Promotion: 'tag',
    Payment: 'creditCard',
    Inventory: 'box',
  }

  const ALL_NAV_SECTIONS = {
    Management: [
      {
        category: 'Rates & Operations',
        items: [
          {
            label: 'Today Gold Rate',
            path: null,
            action: () => { setShowTodayRates(true); fetchMetalPrices() },
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" />
              </svg>
            ),
          },
          {
            label: 'Add Gold Rate',
            path: null,
            action: () => { setShowRatePopup(true); fetchMetalPrices() },
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            ),
          },
          {
            label: 'Digi Gold',
            path: '/superadmin-digi-gold',
            action: () => navigate('/superadmin-digi-gold'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v10" /><path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0" />
              </svg>
            ),
          },
          {
            label: 'Add Product',
            path: '/add-product',
            action: () => navigate('/add-product'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" />
              </svg>
            ),
          },
          {
            label: 'Orders',
            path: '/admin-orders',
            action: () => navigate('/admin-orders'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
              </svg>
            ),
          },
          {
            label: 'Requests',
            path: null,
            action: () => { setShowRequests(true); setRequestMsg(''); fetchProfileRequests() },
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ),
          },
        ],
      },
      {
        category: 'Hierarchies & Reports',
        items: [
          {
            label: 'Hierarchy Grid',
            path: '/superadmin-hierarchy-grid',
            action: () => navigate('/superadmin-hierarchy-grid'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            ),
          },
          {
            label: 'Hierarchy Tree',
            path: '/superadmin-hierarchy',
            action: () => navigate('/superadmin-hierarchy'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="4" rx="1" /><rect x="3" y="17" width="6" height="4" rx="1" /><rect x="15" y="17" width="6" height="4" rx="1" /><path d="M12 7v4m-6 6v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" />
              </svg>
            ),
          },
          {
            label: 'Shop Hierarchy',
            path: '/shop-hierarchy-grid',
            action: () => navigate('/shop-hierarchy-grid'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ),
          },
          {
            label: 'Shop Hierarchy Tree',
            path: '/shop-hierarchy-tree',
            action: () => navigate('/shop-hierarchy-tree'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="18" r="3" /><path d="M12 8v5M6 15v-2h12v2" />
              </svg>
            ),
          },
          {
            label: 'Shop Report',
            path: '/shop-report',
            action: () => navigate('/shop-report'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            ),
          },
        ],
      },
    ],
    Announcements: [
      {
        category: 'Broadcasts',
        items: [
          {
            label: 'Send Announcement',
            path: null,
            action: () => { setShowAnnouncement(true); setAnnouncementMsg('') },
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
            ),
          },
          {
            label: 'My Announcements',
            path: null,
            action: () => { setShowMyAnnouncements(true); fetchMyAnnouncements() },
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            ),
          },
        ],
      },
      {
        category: 'Celebrations',
        items: [
          {
            label: "Today's Birthdays",
            path: null,
            action: () => { setShowBirthdayList(true); fetchCelebrations() },
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" /><path d="M2 21h20" /><path d="M7 8v2" /><path d="M12 8v2" /><path d="M17 8v2" />
              </svg>
            ),
          },
          {
            label: "Today's Anniversaries",
            path: null,
            action: () => { setShowAnniversaryList(true); fetchCelebrations() },
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            ),
          },
          {
            label: 'Joining Anniversaries',
            path: null,
            action: () => { setShowJoinDateList(true); fetchCelebrations() },
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            ),
          },
        ],
      },
    ],
    Users: [
      {
        category: 'Hierarchy Users',
        items: [
          {
            label: 'Shop List',
            path: '/superadmin/manage-users/shops',
            action: () => navigate('/superadmin/manage-users/shops'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ),
          },
          {
            label: 'Super Stockists',
            path: '/superadmin/manage-users/super-stockist',
            action: () => navigate('/superadmin/manage-users/super-stockist'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />
              </svg>
            ),
          },
          {
            label: 'Distributors',
            path: '/superadmin/manage-users/distributor',
            action: () => navigate('/superadmin/manage-users/distributor'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            ),
          },
          {
            label: 'Wholesale Dealers',
            path: '/superadmin/manage-users/wholesale-dealer',
            action: () => navigate('/superadmin/manage-users/wholesale-dealer'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            ),
          },
          {
            label: 'Retailers',
            path: '/superadmin/manage-users/retailer',
            action: () => navigate('/superadmin/manage-users/retailer'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
              </svg>
            ),
          },
        ],
      },
      {
        category: 'Customers & Registration',
        items: [
          {
            label: 'Customers',
            path: '/superadmin/manage-users/customer',
            action: () => navigate('/superadmin/manage-users/customer'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
          {
            label: 'Create Super Stockist',
            path: '/create-super-stockist',
            action: () => navigate('/create-super-stockist'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            ),
          },
          {
            label: 'General Customer',
            path: '/general-customers',
            action: () => navigate('/general-customers'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
          },
          {
            label: 'Referral Customer',
            path: '/referral-customers',
            action: () => navigate('/referral-customers'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            ),
          },
          {
            label: 'Create Customer',
            path: '/create-customer',
            action: () => navigate('/create-customer'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            ),
          },
        ],
      },
    ],
    Coins: [
      {
        category: 'Coins',
        items: [
          {
            label: 'Add Coins',
            path: '/buy-coin',
            action: () => navigate('/buy-coin'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            ),
          },
          {
            label: 'Available Coins',
            path: '/available-coins',
            action: () => navigate('/available-coins'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v10" /><path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0" />
              </svg>
            ),
          },
          {
            label: 'Requests Coins',
            path: '/coin-requests-page',
            action: () => navigate('/coin-requests-page'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            ),
          },
          {
            label: 'Transaction Coins History',
            path: '/coin-transactions',
            action: () => navigate('/coin-transactions'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
        ],
      },
      {
        category: 'Jewellery',
        items: [
          {
            label: 'Add Jewellery',
            path: '/add-jewellery',
            action: () => navigate('/add-jewellery'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
              </svg>
            ),
          },
          {
            label: 'Available Jewellery',
            path: '/available-jewellery',
            action: () => navigate('/available-jewellery'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
              </svg>
            ),
          },
          {
            label: 'Requests Jewellery',
            path: '/jewellery-requests',
            action: () => navigate('/jewellery-requests'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ),
          },
          {
            label: 'Jewellery Transactions',
            path: '/jewellery-transactions',
            action: () => navigate('/jewellery-transactions'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
        ],
      },
    ],
    Reports: [
      {
        category: 'Sales & Rewards',
        items: [
          {
            label: 'Sales Report',
            path: '/sales-report',
            action: () => navigate('/sales-report'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            ),
          },
          {
            label: 'Login Reward',
            path: '/coins-reward',
            action: () => navigate('/coins-reward'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" /><rect width="20" height="5" x="2" y="7" /><line x1="12" x2="12" y1="22" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            ),
          },
          {
            label: 'Login Reward Transactions',
            path: '/login-reward-transactions',
            action: () => navigate('/login-reward-transactions'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            ),
          },
        ],
      },
      {
        category: 'User Activity',
        items: [
          {
            label: 'Login Active',
            path: '/login-active',
            action: () => navigate('/login-active'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
          },
          {
            label: 'Login Inactive',
            path: '/login-inactive',
            action: () => navigate('/login-inactive'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ),
          },
        ],
      },
    ],
    Promotion: [
      {
        category: 'Partner Promotions',
        items: [
          {
            label: 'Super Stockist',
            path: '/promotions/super-stockist',
            action: () => navigate('/promotions/super-stockist'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />
              </svg>
            ),
          },
          {
            label: 'Distributor',
            path: '/promotions/distributor',
            action: () => navigate('/promotions/distributor'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            ),
          },
          {
            label: 'Wholesale Dealer',
            path: '/promotions/wholesale-dealer',
            action: () => navigate('/promotions/wholesale-dealer'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            ),
          },
          {
            label: 'Retailers',
            path: '/promotions/retailer',
            action: () => navigate('/promotions/retailer'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
              </svg>
            ),
          },
        ],
      },
    ],
    Payment: [
      {
        category: 'Sales & Revenue',
        items: [
          {
            label: 'All Sales',
            path: '/superadmin-payments',
            action: () => navigate('/superadmin-payments'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
                <line x1="6" y1="20" x2="6" y2="16" />
              </svg>
            ),
          },
          {
            label: 'Athirai Profit',
            path: '/athirai-profit',
            action: () => navigate('/athirai-profit'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
              </svg>
            ),
          },
          {
            label: 'Athirai Revenue',
            path: '/athirai-revenue',
            action: () => navigate('/athirai-revenue'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19V5" />
                <path d="M4 19h16" />
                <path d="m7 15 4-4 3 3 5-7" />
              </svg>
            ),
          },
          {
            label: 'General Customer Revenue',
            path: '/general-customer-revenue',
            action: () => navigate('/general-customer-revenue'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
          },
        ],
      },
      {
        category: 'Commissions',
        items: [
          {
            label: 'Residual Commission',
            path: '/superadmin-commission',
            action: () => navigate('/superadmin-commission'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            ),
          },
          {
            label: 'My Commission',
            path: '/my-commission',
            action: () => navigate('/my-commission'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
          {
            label: 'Commissions',
            path: '/commissions',
            action: () => navigate('/commissions'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <rect x="3" y="17" width="6" height="4" rx="1" />
                <rect x="15" y="17" width="6" height="4" rx="1" />
                <path d="M12 7v4m-6 6v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" />
              </svg>
            ),
          },
        ],
      },
      {
        category: 'Coins & Mandates',
        items: [
          {
            label: 'Add AUG Coins',
            path: '/superadmin-send-coins',
            action: () => navigate('/superadmin-send-coins'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v10" />
                <path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0" />
              </svg>
            ),
          },
          {
            label: 'Autopay List',
            path: '/superadmin-autopay-list',
            action: () => navigate('/superadmin-autopay-list'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            ),
          },
        ],
      },
    ],
    Inventory: [
      {
        category: 'Products',
        items: [
          {
            label: 'Add Product',
            path: '/add-product',
            action: () => navigate('/add-product'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" />
              </svg>
            ),
          },
          {
            label: 'Sold Out Products',
            path: '/sold-out-products',
            action: () => navigate('/sold-out-products'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /><line x1="9" y1="10" x2="15" y2="16" /><line x1="15" y1="10" x2="9" y2="16" />
              </svg>
            ),
          },
        ],
      },
      {
        category: 'Jewellery',
        items: [
          {
            label: 'Available Jewellery',
            path: '/available-jewellery',
            action: () => navigate('/available-jewellery'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
              </svg>
            ),
          },
          {
            label: 'Add Jewellery',
            path: '/add-jewellery',
            action: () => navigate('/add-jewellery'),
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
              </svg>
            ),
          },
        ],
      },
    ],
  }

  const MenuGroup = ({ label, items }) => {
    const sections = ALL_NAV_SECTIONS[label]
    const groupMatches = drawerMainGroups.find(g => g.label.toLowerCase() === label.toLowerCase())
    const isGroupActive = groupMatches?.items.some(it => it.path && currentPath === it.path)
    const iconName = groupIcons[label] || 'box'
    const groupClass = `group-${label.toLowerCase()}`

    return (
      <div
        className={`san-menu-group ${openMenu === label ? 'is-open' : ''} ${isGroupActive ? 'has-active-child' : ''} ${groupClass} ${label.toLowerCase() === 'payment' ? 'is-payment-group' : ''}`}
        onMouseEnter={() => openMenuNow(label)}
        onMouseLeave={scheduleCloseMenu}
      >
        <button
          className={`san-menu-trigger ${isGroupActive ? 'is-active' : ''}`}
          type="button"
          onClick={() => setOpenMenu(openMenu === label ? null : label)}
          aria-expanded={openMenu === label}
        >
          <span className="san-menu-trigger-icon">
            <Icon name={iconName} size={14} />
          </span>
          <span className="san-menu-trigger-text">{label}</span>
          <span className={`san-menu-trigger-chevron ${openMenu === label ? 'is-rotated' : ''}`}>
            <Icon name="chevron" size={11} />
          </span>
        </button>

        <div className={`san-dropdown-menu san-payment-dropdown san-dropdown-${label.toLowerCase()}`} role="menu" aria-label={`${label} Navigation`}>
          <div className="san-dropdown-head san-payment-dropdown-head">
            <span className="san-dropdown-tag san-payment-dropdown-tag">{label}</span>
          </div>

          <div className="san-dropdown-body san-payment-dropdown-body">
            {sections ? (
              sections.map((grp, gIdx) => (
                <div key={grp.category} className="san-dropdown-group-block san-payment-group-block">
                  {gIdx > 0 && <div className="san-dropdown-group-divider san-payment-group-divider" />}
                  <div className="san-dropdown-group-label san-payment-group-label">{grp.category}</div>
                  <div className="san-dropdown-group-items san-payment-group-items">
                    {grp.items.map((item) => {
                      const isSubActive = item.path && currentPath === item.path
                      return (
                        <button
                          key={item.label}
                          type="button"
                          role="menuitem"
                          className={`san-dropdown-menu-item san-payment-menu-item ${isSubActive ? 'is-active' : ''}`}
                          onClick={() => {
                            clearTimeout(closeTimerRef.current)
                            setOpenMenu(null)
                            item.action()
                          }}
                        >
                          <div className="san-dropdown-item-left san-payment-item-left">
                            <span className="san-dropdown-item-icon san-payment-item-icon">
                              {item.icon}
                            </span>
                            <span className="san-dropdown-item-text san-payment-item-text">{item.label}</span>
                          </div>
                          <span className="san-dropdown-item-arrow san-payment-item-arrow">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              items.map(([text, action]) => {
                const matchedItem = groupMatches?.items.find(it => it.label === text)
                const isSubActive = matchedItem?.path && currentPath === matchedItem.path
                return (
                  <button
                    key={text}
                    type="button"
                    role="menuitem"
                    className={`san-dropdown-menu-item san-payment-menu-item ${isSubActive ? 'is-active' : ''}`}
                    onClick={() => {
                      clearTimeout(closeTimerRef.current)
                      setOpenMenu(null)
                      action()
                    }}
                  >
                    <div className="san-dropdown-item-left san-payment-item-left">
                      <span className="san-dropdown-item-icon san-payment-item-icon">
                        <Icon name="box" size={14} />
                      </span>
                      <span className="san-dropdown-item-text">{text}</span>
                    </div>
                    <span className="san-dropdown-item-arrow san-payment-item-arrow">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    )
  }


  return (
    <>
      <style>{`
@keyframes sanAlertFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes sanAlertSlideUp { from { transform: translateY(16px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.san-shell * { box-sizing: border-box; }
.san-sidebar { position: fixed; inset: 0 auto 0 0; width: 286px; z-index: 70; background: rgba(253,253,252,.98); border-right: 1px solid rgba(189,207,206,.76); box-shadow: 20px 0 48px rgba(7,59,63,.07); padding: 28px 18px; display: flex; flex-direction: column; }
.san-brand { display: flex; align-items: center; gap: 13px; padding: 0 8px 26px; border-bottom: 1px solid rgba(189,207,206,.66); cursor: pointer; }
.san-brand img { width: 54px; height: 54px; object-fit: contain; }
.san-brand-name { font-family: Georgia, 'Times New Roman', serif; font-size: 31px; line-height: .95; font-weight: 800; color: #073B3F; letter-spacing: .03em; }
.san-role { margin-top: 5px; color: #BB8958; font-size: 11px; font-weight: 900; letter-spacing: .24em; text-transform: uppercase; }
.san-side-nav { display: flex; flex-direction: column; gap: 9px; margin-top: 24px; }
.san-side-link { height: 54px; border: 0; border-radius: 8px; background: transparent; color: #073B3F; display: flex; align-items: center; gap: 14px; padding: 0 18px; font-size: 15px; font-weight: 900; text-align: left; cursor: pointer; }
.san-side-link:hover, .san-side-link.is-active { background: linear-gradient(135deg, #073B3F, #0C575B); color: #FDFDFC; box-shadow: 0 18px 34px rgba(7,59,63,.16); }
.san-quick { border-top: 1px solid #E4ECEB; margin-top: 24px; padding: 22px 16px 0; }
.san-quick-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #111817; margin-bottom: 18px; }
.san-quick-row { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px; margin-bottom: 18px; color: #0C4044; }
.san-quick-row strong { display: block; font-size: 18px; line-height: 1.1; color: #111817; }
.san-quick-row small { display: block; font-size: 12px; color: #0C4044; font-weight: 800; }
.san-quick-row b { font-size: 11px; color: #009957; }
.san-secure { margin-top: auto; border-radius: 8px; background: linear-gradient(145deg, #073B3F, #0C4044); border: 1px solid rgba(204,168,129,.32); padding: 24px 20px; color: #FDFDFC; box-shadow: 0 18px 36px rgba(7,59,63,.14); }
.san-secure strong { display: block; font-size: 16px; margin-bottom: 8px; }
.san-secure span { display: block; color: #D1DFDE; font-size: 13px; line-height: 1.6; }
.san-top-shell { position: fixed; top: 0; left: 0; right: 0; z-index: 90; background: rgba(255, 255, 255, 0.98); border-bottom: 1px solid rgba(7, 59, 63, 0.08); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 16px rgba(7, 59, 63, 0.03); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-sizing: border-box; max-width: 100vw; overflow-x: clip; }
.san-top-spacer { height: 74px; }
.san-top-inner { height: 74px; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(10px, 1.4vw, 24px); gap: clamp(6px, 0.8vw, 14px); width: 100%; box-sizing: border-box; max-width: 100%; }

.san-nav-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: clamp(6px, 0.8vw, 12px);
  flex: 0 0 auto;
}
.san-navbar-brand {
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
  min-width: max-content;
}
.san-navbar-brand:hover { opacity: 0.88; }
.san-brand-logo-wrap {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: rgba(7, 59, 63, 0.04);
  padding: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(187, 137, 88, 0.2);
}
.san-brand-logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
.san-brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
}
.san-brand-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(15px, 1.15vw, 19px);
  font-weight: 850;
  letter-spacing: 0.03em;
  color: #073B3F;
  white-space: nowrap;
}
.san-brand-badge {
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.16em;
  color: #BB8958;
  margin-top: 3px;
  text-transform: uppercase;
  white-space: nowrap;
}
.san-brand-divider {
  width: 1px;
  height: 24px;
  background: rgba(7, 59, 63, 0.1);
  margin: 0 clamp(4px, 0.6vw, 10px);
  flex-shrink: 0;
}

.san-search-block {
  position: relative;
  width: clamp(140px, 11vw, 220px);
  transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 1;
  min-width: 0;
}
.san-search-block.is-focused, .san-search-block:focus-within {
  width: clamp(170px, 14vw, 260px);
}
.san-search { height: 38px; width: 100%; border: 1px solid #DFE7E5; border-radius: 10px; background: #F7FAF9; display: flex; align-items: center; gap: 8px; padding: 0 6px 0 11px; font-size: 13px; font-weight: 500; transition: all 0.18s ease; }
.san-search-block.is-focused .san-search, .san-search:focus-within { border-color: #073B3F; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.08); }
.san-search-icon-wrap { display: flex; align-items: center; color: #718280; flex-shrink: 0; }
.san-search-input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: #073B3F; font-size: 13px; font-weight: 500; font-family: inherit; }
.san-search-input::placeholder { color: #8C9E9B; font-weight: 450; }
.san-search-clear-btn { background: transparent; border: 0; color: #8C9E9B; cursor: pointer; padding: 3px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.san-search-clear-btn:hover { background: #E5EBEA; color: #073B3F; }
.san-search-kbd { font-size: 10px; font-weight: 700; color: #718280; background: #FFFFFF; border: 1px solid #D5E0DD; border-radius: 5px; padding: 2px 5px; letter-spacing: 0.02em; white-space: nowrap; user-select: none; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); }
.san-mic-btn { flex-shrink: 0; width: 28px; height: 28px; border-radius: 7px; border: 1px solid transparent; background: transparent; color: #556B68; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
.san-mic-btn:hover { background: #EAF0EE; color: #073B3F; }
.san-mic-btn.is-listening { background: #DC2626; color: #FFFFFF; animation: san-mic-pulse 1.1s ease-in-out infinite; }
@keyframes san-mic-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,32,53,.5); } 50% { box-shadow: 0 0 0 8px rgba(201,32,53,0); } }

/* ── SUGGESTIONS DROPDOWN ── */
.san-suggestions-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: max(100%, 360px);
  max-width: 440px;
  max-height: 460px;
  overflow-y: auto;
  background: #FFFFFF;
  border: 1.5px solid rgba(189,207,206,.9);
  border-radius: 18px;
  box-shadow: 0 20px 48px rgba(7,59,63,.18), 0 4px 12px rgba(0,0,0,.06);
  z-index: 1200;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: sanDropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
@media (max-width: 768px) {
  .san-suggestions-dropdown {
    position: fixed !important;
    top: 66px !important;
    left: 10px !important;
    right: 10px !important;
    width: auto !important;
    max-width: 500px !important;
    margin: 0 auto !important;
    max-height: calc(100dvh - 80px) !important;
    border-radius: 16px !important;
    box-shadow: 0 16px 40px rgba(7, 59, 63, 0.28), 0 4px 14px rgba(0,0,0,0.12) !important;
    z-index: 2200 !important;
  }
}
@keyframes sanDropdownIn { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.san-sug-section { display: flex; flex-direction: column; gap: 3px; }
.san-sug-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; color: #7A8987; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.san-sug-head span { display: flex; align-items: center; gap: 6px; }
.san-sug-clear-all { background: transparent; border: 0; color: #BB8958; font-size: 11px; font-weight: 700; cursor: pointer; padding: 2px 4px; }
.san-sug-clear-all:hover { text-decoration: underline; }
.san-recent-list { display: flex; flex-direction: column; gap: 2px; }
.san-recent-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #073B3F; cursor: pointer; transition: all .15s ease; }
.san-recent-item:hover { background: #F0F4F4; }
.san-recent-item-left { display: flex; align-items: center; gap: 9px; }
.san-recent-del { background: transparent; border: 0; color: #7A8987; cursor: pointer; padding: 3px; border-radius: 50%; opacity: 0.6; }
.san-recent-del:hover { opacity: 1; color: #C92035; background: rgba(201,32,53,0.1); }
.san-sug-row { display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 12px; border: 0; background: transparent; cursor: pointer; text-align: left; width: 100%; transition: all .14s ease; }
.san-sug-row:hover, .san-sug-row.is-selected { background: #F0F4F4; transform: translateX(2px); }
.san-sug-row-icon { width: 32px; height: 32px; border-radius: 9px; background: rgba(12,64,68,0.08); color: #0C4044; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.san-sug-row.is-user-row .user-icon { background: rgba(187,137,88,0.14); color: #A2764C; }
.san-sug-row-body { flex: 1; min-width: 0; }
.san-sug-row-top { display: flex; align-items: center; gap: 8px; justify-content: space-between; min-width: 0; }
.san-sug-title { font-size: 13.5px; font-weight: 750; color: #073B3F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1 1 auto; min-width: 0; }
.san-sug-badge { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; padding: 2px 6px; border-radius: 6px; background: rgba(12,64,68,0.08); color: #0C4044; flex-shrink: 0; white-space: nowrap; }
.san-sug-badge.user-badge { background: rgba(187,137,88,0.15); color: #8C5D2C; }
.san-sug-desc { display: block; font-size: 11.5px; color: #7A8987; font-weight: 500; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.san-sug-arrow { color: #A4B2B0; display: flex; align-items: center; flex-shrink: 0; }
.san-sug-row:hover .san-sug-arrow { color: #073B3F; transform: translateX(2px); }
.san-sug-empty { padding: 16px 12px; text-align: center; color: #53615F; }
.san-sug-empty p { margin: 0 0 4px; font-size: 13.5px; font-weight: 600; color: #073B3F; }
.san-sug-empty small { font-size: 11.5px; color: #7A8987; }
.san-sug-footer { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px 4px; border-top: 1px solid rgba(189,207,206,.6); font-size: 10.5px; color: #7A8987; font-weight: 600; }
.san-sug-footer-voice { background: transparent; border: 0; color: #0C4044; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 4px; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
.san-sug-footer-voice:hover { background: #E7EDEC; }

/* ── AUTHENTIC YOUTUBE / GOOGLE VOICE SEARCH MODAL ── */
.san-voice-overlay { position: fixed; inset: 0; background: rgba(17, 24, 23, 0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 2500; display: flex; align-items: center; justify-content: center; padding: 20px; animation: sanVoiceFadeIn 0.2s ease-out; }
@keyframes sanVoiceFadeIn { from { opacity: 0; } to { opacity: 1; } }
.san-voice-card { background: #FFFFFF; border-radius: 24px; box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25); width: 100%; max-width: 500px; padding: 32px 28px 36px; display: flex; flex-direction: column; align-items: center; gap: 24px; position: relative; animation: sanVoiceSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes sanVoiceSlideUp { from { transform: translateY(18px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.san-voice-header { width: 100%; display: flex; align-items: center; justify-content: space-between; }
.san-voice-title { font-family: Georgia, 'Times New Roman', serif; font-size: 23px; font-weight: 850; color: #073B3F; margin: 0; letter-spacing: -0.01em; }
.san-voice-close-btn { background: transparent; border: 0; color: #53615F; cursor: pointer; padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all .15s ease; }
.san-voice-close-btn:hover { background: #F0F4F4; color: #073B3F; }

.san-voice-transcript-box { min-height: 84px; display: flex; align-items: center; justify-content: center; text-align: center; width: 100%; padding: 0 10px; }
.san-voice-transcript-active { font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 850; color: #073B3F; line-height: 1.35; animation: sanFadeIn .15s ease; }
.san-voice-transcript-idle { color: #7A8987; font-size: 19px; font-weight: 600; font-family: inherit; }

.san-voice-mic-wrap { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin: 4px 0; }
.san-voice-ripple { position: absolute; inset: 0; border-radius: 50%; border: 2.5px solid rgba(201, 32, 53, 0.35); animation: sanVoicePulse 2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite; }
.san-voice-ripple.ripple-2 { animation-delay: 0.75s; border-color: rgba(201, 32, 53, 0.2); }
@keyframes sanVoicePulse { 0% { transform: scale(0.9); opacity: 0.9; } 100% { transform: scale(1.85); opacity: 0; } }

.san-voice-mic-main { width: 78px; height: 78px; border-radius: 50%; border: 0; background: #C92035; color: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 28px rgba(201, 32, 53, 0.35); transition: all .2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; z-index: 2; }
.san-voice-mic-main:hover { transform: scale(1.06); box-shadow: 0 14px 34px rgba(201, 32, 53, 0.45); }
.san-voice-mic-main:not(.is-active) { background: #073B3F; box-shadow: 0 10px 28px rgba(7, 59, 63, 0.28); }

.san-voice-status-sub { font-size: 13px; color: #7A8987; font-weight: 700; margin-top: -6px; }

.san-menu-center { display: flex; align-items: center; justify-content: center; gap: clamp(3px, 0.45vw, 8px); flex: 1 1 auto; min-width: 0; }
.san-menu-group { position: relative; display: flex; align-items: center; flex-shrink: 0; }
.san-menu-trigger { border: 1px solid transparent; background: transparent; padding: 6px clamp(5px, 0.45vw, 10px); border-radius: 9px; color: #263836; font-family: inherit; font-size: clamp(12px, 0.78vw, 13.5px); font-weight: 600; display: flex; align-items: center; gap: 5px; cursor: pointer; white-space: nowrap; transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1); user-select: none; }
.san-menu-trigger:hover { background: rgba(7, 59, 63, 0.05); color: #073B3F; border-color: rgba(7, 59, 63, 0.08); }
.san-menu-trigger.is-active, .san-menu-group.has-active-child .san-menu-trigger { background: rgba(12, 64, 68, 0.07); color: #073B3F; font-weight: 750; border-color: rgba(187, 137, 88, 0.35); }
.san-menu-group.is-open .san-menu-trigger { background: #073B3F; color: #FFFFFF; border-color: #073B3F; box-shadow: 0 4px 14px rgba(7, 59, 63, 0.15); }
.san-menu-group.is-open .san-menu-trigger .san-menu-trigger-icon, .san-menu-group.is-open .san-menu-trigger .san-menu-trigger-chevron { color: #E5BF91; }
.san-menu-trigger-icon { display: flex; align-items: center; color: #0C4044; opacity: 0.85; transition: color 0.15s ease; }
.san-menu-trigger:hover .san-menu-trigger-icon { color: #073B3F; opacity: 1; }
.san-menu-trigger-text { font-size: inherit; font-weight: inherit; color: inherit; letter-spacing: -0.01em; }
.san-menu-trigger-chevron { display: flex; align-items: center; color: #8C9E9B; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease; }
.san-menu-trigger:hover .san-menu-trigger-chevron { color: #073B3F; }
.san-menu-trigger-chevron.is-rotated { transform: rotate(180deg); }

/* ── PREMIUM SAAS POPUP DROPDOWN ── */
.san-menu-dropdown { position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%) translateY(4px); min-width: 230px; max-width: 300px; background: #FFFFFF; border: 1.5px solid rgba(7, 59, 63, 0.1); border-radius: 12px; box-shadow: 0 16px 38px rgba(7, 59, 63, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04); padding: 6px; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.16s ease, transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.16s ease; z-index: 1000; }
.san-menu-group.is-open .san-menu-dropdown { opacity: 1; visibility: visible; pointer-events: auto; transform: translateX(-50%) translateY(0); }
.san-menu-group:first-child .san-menu-dropdown { left: 0; transform: translateY(4px); }
.san-menu-group:first-child.is-open .san-menu-dropdown { transform: translateY(0); }
.san-menu-group:last-of-type .san-menu-dropdown { left: auto; right: 0; transform: translateY(4px); }
.san-menu-group:last-of-type.is-open .san-menu-dropdown { transform: translateY(0); }
.san-menu-dropdown-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px 8px; border-bottom: 1px solid rgba(7, 59, 63, 0.06); margin-bottom: 4px; }
.san-menu-dropdown-tag { font-size: 11px; font-weight: 750; color: #073B3F; letter-spacing: 0.03em; text-transform: uppercase; }
.san-menu-dropdown-count { font-size: 10px; font-weight: 600; color: #8C9E9B; }
.san-menu-dropdown-list { display: flex; flex-direction: column; gap: 2px; }
.san-menu-link { width: 100%; border: 0; background: transparent; padding: 8px 10px; border-radius: 8px; text-align: left; color: #273735; font-size: 13px; font-weight: 600; font-family: inherit; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.14s ease; }
.san-menu-link:hover { background: #F2F7F6; color: #073B3F; transform: translateX(2px); }
.san-menu-link.is-active-link { background: #EAF7EE; color: #00874E; font-weight: 700; }
.san-menu-link-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.san-menu-link-arrow { color: #8C9E9B; font-size: 14px; line-height: 1; transition: transform 0.14s ease; }
.san-menu-link:hover .san-menu-link-arrow { color: #073B3F; transform: translateX(2px); }
.san-menu-link.is-active-link .san-menu-link-arrow { color: #00874E; }

/* ── PREMIUM ATHIRAI ENTERPRISE SAAS PAYMENT MENU DROPDOWN ── */
.san-payment-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  width: 330px;
  background: #FFFFFF;
  border: 1.5px solid rgba(7, 59, 63, 0.12);
  border-radius: 14px;
  box-shadow: 0 20px 48px rgba(7, 59, 63, 0.14), 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 8px 6px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.16s ease;
  z-index: 1000;
  max-height: min(580px, calc(100vh - 88px));
  overflow-y: auto;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: rgba(7, 59, 63, 0.15) transparent;
}
.san-menu-group.is-open .san-payment-dropdown,
.san-menu-group.is-open .san-dropdown-menu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}
.san-menu-group.group-management .san-dropdown-menu,
.san-menu-group.group-announcements .san-dropdown-menu {
  left: 0;
  right: auto;
  transform: translateY(4px);
}
.san-menu-group.group-management.is-open .san-dropdown-menu,
.san-menu-group.group-announcements.is-open .san-dropdown-menu {
  transform: translateY(0);
}
.san-menu-group.group-users .san-dropdown-menu,
.san-menu-group.group-coins .san-dropdown-menu,
.san-menu-group.group-reports .san-dropdown-menu {
  left: 50%;
  right: auto;
  transform: translateX(-50%) translateY(4px);
}
.san-menu-group.group-users.is-open .san-dropdown-menu,
.san-menu-group.group-coins.is-open .san-dropdown-menu,
.san-menu-group.group-reports.is-open .san-dropdown-menu {
  transform: translateX(-50%) translateY(0);
}
.san-menu-group.group-promotion .san-dropdown-menu,
.san-menu-group.group-payment .san-dropdown-menu,
.san-menu-group.group-inventory .san-dropdown-menu,
.san-menu-group.is-payment-group .san-payment-dropdown {
  left: auto;
  right: -16px;
  transform: translateY(4px);
}
.san-menu-group.group-promotion.is-open .san-dropdown-menu,
.san-menu-group.group-payment.is-open .san-dropdown-menu,
.san-menu-group.group-inventory.is-open .san-dropdown-menu,
.san-menu-group.is-payment-group.is-open .san-payment-dropdown {
  transform: translateY(0);
}
.san-payment-dropdown::-webkit-scrollbar {
  width: 5px;
}
.san-payment-dropdown::-webkit-scrollbar-track {
  background: transparent;
}
.san-payment-dropdown::-webkit-scrollbar-thumb {
  background: rgba(7, 59, 63, 0.15);
  border-radius: 999px;
}
.san-payment-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(7, 59, 63, 0.3);
}
.san-payment-dropdown-head {
  display: flex;
  align-items: center;
  padding: 8px 12px 7px;
  border-bottom: 1px solid rgba(7, 59, 63, 0.07);
  margin-bottom: 4px;
}
.san-payment-dropdown-tag {
  font-size: 11px;
  font-weight: 850;
  color: #073B3F;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.san-payment-dropdown-body {
  display: flex;
  flex-direction: column;
}
.san-payment-group-block {
  display: flex;
  flex-direction: column;
}
.san-payment-group-divider {
  height: 1px;
  background: rgba(7, 59, 63, 0.06);
  margin: 5px 8px 3px;
}
.san-payment-group-label {
  padding: 6px 10px 3px;
  font-size: 9.5px;
  font-weight: 800;
  color: #8C9E9B;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: left;
}
.san-payment-group-items {
  display: flex;
  flex-direction: column;
  gap: 1.5px;
}
.san-payment-menu-item {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 6.5px 9px;
  border-radius: 9px;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.14s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
  position: relative;
}
.san-payment-menu-item:hover {
  background: #F4F8F7;
  transform: translateX(2px);
}
.san-payment-menu-item.is-active {
  background: #EAF7EE;
}
.san-payment-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: #00874E;
  border-radius: 0 3px 3px 0;
}
.san-payment-item-left {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  flex: 1;
}
.san-payment-item-icon {
  width: 27px;
  height: 27px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(7, 59, 63, 0.05);
  color: #073B3F;
  flex-shrink: 0;
  transition: all 0.14s ease;
}
.san-payment-menu-item:hover .san-payment-item-icon {
  background: #E5F0EE;
  color: #073B3F;
}
.san-payment-menu-item.is-active .san-payment-item-icon {
  background: #073B3F;
  color: #E5BF91;
  box-shadow: 0 2px 7px rgba(7, 59, 63, 0.2);
}
.san-payment-item-text {
  font-size: 13px;
  font-weight: 600;
  color: #1A2D2B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
  transition: color 0.14s ease;
}
.san-payment-menu-item:hover .san-payment-item-text {
  color: #073B3F;
}
.san-payment-menu-item.is-active .san-payment-item-text {
  color: #00874E;
  font-weight: 750;
}
.san-payment-item-arrow {
  color: #8C9E9B;
  font-size: 13px;
  line-height: 1;
  display: flex;
  align-items: center;
  transition: transform 0.14s ease, color 0.14s ease;
  flex-shrink: 0;
  margin-left: 6px;
}
.san-payment-menu-item:hover .san-payment-item-arrow {
  color: #073B3F;
  transform: translateX(2px);
}
.san-payment-menu-item.is-active .san-payment-item-arrow {
  color: #00874E;
}
.san-mobile-logo { display: none !important; }

/* ── RIGHT UTILITY CONTROLS ── */
.san-actions-right { display: flex; align-items: center; gap: clamp(6px, 0.6vw, 10px); flex-shrink: 0; }
.san-bell-btn { position: relative; width: 38px; height: 38px; border-radius: 10px; border: 1px solid rgba(7, 59, 63, 0.12); background: #FFFFFF; color: #073B3F; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.16s ease; flex-shrink: 0; }
.san-bell-btn:hover { background: rgba(7, 59, 63, 0.05); border-color: rgba(7, 59, 63, 0.24); color: #073B3F; transform: translateY(-1px); }
.san-bell-badge { position: absolute; top: -3px; right: -3px; background: #DC2626; color: #FFFFFF; font-size: 10px; font-weight: 800; min-width: 17px; height: 17px; border-radius: 9px; padding: 0 4px; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.35); animation: sanBadgePop 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes sanBadgePop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.san-util-divider { width: 1px; height: 22px; background: rgba(7, 59, 63, 0.12); margin: 0 2px; flex-shrink: 0; }
.san-logout-link { display: flex; align-items: center; gap: 6px; background: rgba(220, 38, 38, 0.04); border: 1px solid rgba(220, 38, 38, 0.16); color: #DC2626; font-family: inherit; font-size: 12.5px; font-weight: 750; letter-spacing: 0.01em; cursor: pointer; padding: 7px 12px; border-radius: 9px; transition: all 0.16s ease; flex-shrink: 0; white-space: nowrap; }
.san-logout-link:hover { background: rgba(220, 38, 38, 0.09); border-color: rgba(220, 38, 38, 0.3); color: #B91C1C; transform: translateY(-1px); }
.san-hamburger { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 10px; border: 1px solid rgba(7, 59, 63, 0.14); background: #FFFFFF; color: #073B3F; cursor: pointer; transition: all 0.16s ease; flex-shrink: 0; }
.san-hamburger:hover { background: #073B3F; color: #FFFFFF; border-color: #073B3F; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(7, 59, 63, 0.18); }
.san-drawer-overlay { position: fixed; inset: 0; background: rgba(17,24,23,0.42); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 1400; animation: sanDrawerFade .2s ease-out; }
@keyframes sanDrawerFade { from { opacity: 0; } to { opacity: 1; } }

.san-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 350px; max-width: 90vw; background: #FFFFFF; z-index: 1401; box-shadow: -14px 0 45px rgba(7,59,63,0.16); border-left: 1px solid rgba(7,59,63,0.08); display: flex; flex-direction: column; animation: sanDrawerSlide .28s cubic-bezier(0.16, 1, 0.3, 1) forwards; user-select: none; }
@keyframes sanDrawerSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }

.san-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 14px 20px; border-bottom: 1px solid rgba(189,207,206,0.28); flex-shrink: 0; }
.san-drawer-title { font-family: inherit; font-size: 17px; font-weight: 800; color: #073B3F; letter-spacing: -0.01em; }
.san-drawer-close { background: transparent; border: none; color: #4A5E5B; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; transition: all 0.15s ease; }
.san-drawer-close:hover { background: #F0F4F3; color: #073B3F; }

.san-drawer-profile { display: flex; align-items: center; gap: 12px; padding: 14px 20px 14px 20px; flex-shrink: 0; }
.san-drawer-avatar { width: 44px; height: 44px; border-radius: 50%; background: #073B3F; border: 1.5px solid rgba(187,137,88,0.55); display: flex; align-items: center; justify-content: center; color: #E5BF91; flex-shrink: 0; box-shadow: 0 4px 12px rgba(7,59,63,0.18); }
.san-drawer-user-info { display: flex; flex-direction: column; gap: 1.5px; min-width: 0; }
.san-drawer-user-name { font-size: 14.5px; font-weight: 800; color: #111817; letter-spacing: -0.01em; }
.san-drawer-user-email { font-size: 11.5px; color: #718280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.san-drawer-status { display: inline-flex; align-items: center; gap: 5.5px; font-size: 11px; font-weight: 700; color: #059669; margin-top: 1px; }
.san-drawer-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #10B981; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); display: inline-block; animation: sanPulseDot 2s infinite; }
@keyframes sanPulseDot { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 70% { box-shadow: 0 0 0 5px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }

.san-drawer-search-wrap { padding: 0 20px 12px 20px; flex-shrink: 0; }
.san-drawer-search-box { display: flex; align-items: center; gap: 9px; background: #F4F7F6; border: 1px solid #E1E8E6; border-radius: 11px; padding: 7px 12px; transition: all 0.18s ease; }
.san-drawer-search-box:focus-within { border-color: #073B3F; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(7,59,63,0.08); }
.san-drawer-search-box svg { color: #8A9E9C; flex-shrink: 0; }
.san-drawer-search-box input { border: none; background: transparent; outline: none; font-size: 13.5px; color: #111817; width: 100%; font-family: inherit; }
.san-drawer-search-box input::placeholder { color: #8C9E9B; font-size: 13px; }
.san-drawer-search-clear { background: transparent; border: none; color: #8C9E9B; cursor: pointer; padding: 2px; display: flex; align-items: center; }
.san-drawer-search-clear:hover { color: #111817; }

.san-drawer-body { flex: 1; overflow-y: auto; padding: 4px 14px 20px 14px; overscroll-behavior: contain; }
.san-drawer-body::-webkit-scrollbar { width: 5px; }
.san-drawer-body::-webkit-scrollbar-track { background: transparent; }
.san-drawer-body::-webkit-scrollbar-thumb { background: #D5DFDC; border-radius: 10px; }
.san-drawer-body::-webkit-scrollbar-thumb:hover { background: #AABBB6; }

.san-section-header { font-size: 10.5px; font-weight: 800; letter-spacing: 0.1em; color: #C29358; text-transform: uppercase; padding: 14px 10px 6px 10px; display: flex; align-items: center; gap: 5px; }
.san-section-header::before { content: "—"; font-weight: 700; color: #C29358; margin-right: 2px; }

.san-drawer-item { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 8.5px 12px; border-radius: 10px; border: none; background: transparent; color: #1F2E2C; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; margin-bottom: 2px; text-align: left; }
.san-drawer-item:hover { background: #F4F7F6; color: #073B3F; }
.san-drawer-item.is-active { background: #EAF8F0; color: #00874E; font-weight: 750; }
.san-drawer-item.is-active .san-drawer-item-icon { color: #00874E; }
.san-drawer-item.has-active-child { color: #073B3F; font-weight: 700; }
.san-drawer-item-left { display: flex; align-items: center; gap: 11px; min-width: 0; }
.san-drawer-item-icon { color: #5A706D; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: color 0.15s ease; }
.san-drawer-item:hover .san-drawer-item-icon { color: #073B3F; }
.san-drawer-item-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.san-drawer-chevron { color: #8E9E9C; display: flex; align-items: center; justify-content: center; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); font-size: 14px; font-weight: bold; }
.san-drawer-chevron.is-expanded { transform: rotate(90deg); color: #073B3F; }

.san-drawer-submenu { margin-left: 20px; padding-left: 14px; border-left: 1.5px solid #E2EAE8; margin-top: 2px; margin-bottom: 6px; display: flex; flex-direction: column; gap: 1px; animation: sanDrawerFade .15s ease; }
.san-drawer-subitem { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; border-radius: 8px; border: none; background: transparent; color: #4B605D; font-size: 12.5px; font-weight: 550; cursor: pointer; text-align: left; transition: all 0.14s ease; }
.san-drawer-subitem:hover { background: #F4F7F6; color: #073B3F; padding-left: 13px; }
.san-drawer-subitem.is-active { background: #EAF8F0; color: #00874E; font-weight: 750; }

.san-drawer-qa-item { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 10px; border: none; background: transparent; color: #1F2E2C; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; margin-bottom: 3px; }
.san-drawer-qa-item:hover { background: #F4F7F6; transform: translateX(2px); }
.san-drawer-badge-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.san-drawer-search-results { display: flex; flex-direction: column; gap: 2px; }
.san-drawer-search-count { font-size: 11px; font-weight: 750; color: #718280; padding: 6px 12px 10px 12px; letter-spacing: 0.04em; text-transform: uppercase; }
.san-drawer-item-texts { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.san-drawer-item-section-tag { font-size: 10px; color: #BB8958; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
.san-drawer-empty-search { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 36px 16px; color: #8A9E9C; text-align: center; gap: 8px; }
.san-drawer-empty-search p { margin: 0; font-size: 13px; font-weight: 550; color: #718280; }

.san-drawer-logout { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; border: none; background: transparent; color: #DC2626; font-size: 13.5px; font-weight: 750; cursor: pointer; transition: all 0.15s ease; margin-top: 4px; }
.san-drawer-logout:hover { background: rgba(220, 38, 38, 0.08); transform: translateX(2px); }

@media (max-width: 1600px) {
  .san-top-inner { padding: 0 14px; gap: 8px; }
  .san-search-block { width: 160px; }
  .san-search-block.is-focused { width: 220px; }
  .san-menu-trigger { padding: 6px clamp(4px, 0.35vw, 7px); font-size: 12.5px; gap: 4px; }
}

@media (max-width: 1366px) {
  .san-top-inner { padding: 0 10px; gap: 6px; }
  .san-brand-badge { display: none; }
  .san-brand-divider { margin: 0 6px; }
  .san-search-block { width: 135px; }
  .san-search-block.is-focused { width: 180px; }
  .san-search-kbd { display: none; }
  .san-menu-trigger { padding: 5px 5px; font-size: 11.5px; gap: 3px; }
  .san-logout-link span { display: none; }
  .san-logout-link { padding: 7px; }
}

@media (max-width: 1260px) {
  .san-menu-trigger-icon { display: none; }
}

@media (max-width: 1180px) {
  .san-sidebar { position: relative; width: 100%; min-height: 0; padding: 14px 16px; border-right: 0; border-bottom: 1px solid rgba(189,207,206,.72); }
  .san-brand { padding-bottom: 14px; }
  .san-side-nav { flex-direction: row; overflow-x: auto; margin-top: 12px; padding-bottom: 3px; }
  .san-side-link { height: 42px; flex: 0 0 auto; padding: 0 14px; }
  .san-quick, .san-secure { display: none; }
  .san-top-shell { margin-left: 0 !important; }
  .san-menu-center { display: none !important; }
  .san-nav-left { flex: 1; min-width: 0; max-width: calc(100% - 90px); }
  .san-search-block { width: clamp(140px, 28vw, 240px); }
  .san-search-block.is-focused { width: clamp(180px, 36vw, 300px); }
}

@media (max-width: 768px) {
  .san-top-shell { height: 64px; }
  .san-top-spacer { height: 64px; }
  .san-top-inner { height: 64px; padding: 0 12px; gap: 8px; }
  .san-brand-divider { display: none; }
  .san-brand-badge { display: none; }
  .san-search-kbd { display: none; }
  .san-nav-left { gap: 8px; }
  .san-search-block { flex: 1; min-width: 0; width: auto; max-width: 220px; }
  .san-search-block.is-focused { width: auto; max-width: 260px; }
  .san-search { height: 35px; padding: 0 4px 0 8px; gap: 5px; }
  .san-search-input { font-size: 12px; }
  .san-mic-btn { width: 26px; height: 26px; }
  .san-logout-link span { display: none; }
  .san-logout-link { padding: 7px; }
  .san-bell-btn, .san-hamburger { width: 35px; height: 35px; border-radius: 9px; }
}

@media (max-width: 520px) {
  .san-top-inner { padding: 0 10px; gap: 6px; }
  .san-brand-logo-wrap { width: 32px; height: 32px; padding: 2px; }
  .san-brand-badge { display: none; }
  .san-brand-title { font-size: 15px; }
  .san-nav-left { gap: 6px; }
  .san-search-block { flex: 1; min-width: 0; width: auto; max-width: 180px; }
  .san-search-block.is-focused { width: auto; }
  .san-search { height: 34px; padding: 0 4px 0 8px; font-size: 12px; }
  .san-search-input { font-size: 12px; }
  .san-actions-right { gap: 6px; }
  .san-util-divider { display: none; }
  .san-bell-btn, .san-hamburger { width: 34px; height: 34px; }
}

@media (max-width: 400px) {
  .san-brand-title { font-size: 13.5px; }
  .san-search-block { max-width: 140px; }
}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes skelShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>
      <div className="san-shell">
        {showSidebar && (
          <aside className="san-sidebar">
            <div className="san-brand" onClick={() => navigate('/super-admin')} title="Go to dashboard">
              <img src={logo} alt="Athirai" />
              <div><div className="san-brand-name">ATHIRAI</div><div className="san-role">Super Admin</div></div>
            </div>
            <nav className="san-side-nav">
              <button className="san-side-link is-active" type="button" onClick={() => navigate('/super-admin')}><Icon name="home" />Dashboard</button>
              <button className="san-side-link" type="button" onClick={() => navigate('/add-product')}><Icon name="box" />Products</button>
              <button className="san-side-link" type="button" onClick={() => navigate('/admin-orders')}><Icon name="orders" />Orders</button>
<button className="san-side-link" type="button" onClick={() => { setShowTodayRates(true); fetchMetalPrices() }}><Icon name="rate" />Gold Rate</button>
              <button className="san-side-link" type="button"><Icon name="settings" />Settings</button>
            </nav>
            <div className="san-quick">
              <div className="san-quick-title">Quick Summary</div>
              {[['Total Orders', '0', '+0%'], ['Total Customers', '588', '+12.5%'], ['Total Dealers', '41', '+6.8%'], ['Total Products', '256', '+5.2%'], ['Active Users', '7', '+8.3%']].map(([label, value, growth]) => (
                <div className="san-quick-row" key={label}><Icon name="orders" size={19} /><div><small>{label}</small><strong>{value}</strong></div><b>{growth}</b></div>
              ))}
            </div>
            <div className="san-secure"><strong>Manual Control</strong><span>Reports and charts update only when you choose refresh.</span></div>
          </aside>
        )}
        <header className="san-top-shell" style={{ marginLeft: showSidebar ? 286 : 0 }}>
          <div className="san-top-inner">
            <div className="san-nav-left">
              <button className="san-navbar-brand" type="button" onClick={() => navigate('/super-admin')} title="Go to dashboard">
                <div className="san-brand-logo-wrap">
                  <img src={logo} alt="Athirai" />
                </div>
                <div className="san-brand-text">
                  <span className="san-brand-title">ATHIRAI</span>
                  <span className="san-brand-badge">SUPER ADMIN</span>
                </div>
              </button>

              <div className="san-brand-divider" />

              <div
                className={`san-search-block ${isSearchFocused || showSuggestions ? 'is-focused' : ''}`}
                ref={searchContainerRef}
              >
                <div className="san-search">
                  <span className="san-search-icon-wrap">
                    <Icon name="search" size={15} />
                  </span>
                  <input
                    ref={searchInputRef}
                    value={voiceQuery}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    placeholder="Search anything..."
                    aria-label="Global search"
                    className="san-search-input"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  {voiceQuery && (
                    <button
                      type="button"
                      className="san-search-clear-btn"
                      onClick={handleClearSearch}
                      title="Clear search input"
                      aria-label="Clear search"
                    >
                      <Icon name="close" size={13} />
                    </button>
                  )}

                  <button
                    type="button"
                    className={`san-mic-btn ${isListening ? 'is-listening' : ''}`}
                    onClick={startVoiceModal}
                    title="Search with Voice"
                    aria-label="Voice search"
                  >
                    <Icon name="mic" size={15} />
                  </button>
                </div>

              {/* ── GOOGLE / YOUTUBE STYLE AUTOCOMPLETE SUGGESTIONS ── */}
              {showSuggestions && (
                <div className="san-suggestions-dropdown" role="listbox">
                  {/* RECENT SEARCHES */}
                  {!voiceQuery && recentSearches.length > 0 && (
                    <div className="san-sug-section">
                      <div className="san-sug-head">
                        <span><Icon name="clock" size={13} /> Recent Searches</span>
                        <button type="button" onClick={clearRecentSearches} className="san-sug-clear-all">Clear</button>
                      </div>
                      <div className="san-recent-list">
                        {recentSearches.map((term, idx) => (
                          <div
                            key={idx}
                            className="san-recent-item"
                            onClick={() => executeSearch(term)}
                          >
                            <div className="san-recent-item-left">
                              <Icon name="clock" size={14} />
                              <span>{term}</span>
                            </div>
                            <button
                              type="button"
                              className="san-recent-del"
                              onClick={(e) => removeRecentSearch(e, term)}
                              title="Remove from history"
                            >
                              <Icon name="close" size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* QUICK SHORTCUTS OR SEARCH MATCHES */}
                  <div className="san-sug-section">
                    <div className="san-sug-head">
                      <span>{voiceQuery ? 'Navigation & Features' : '⚡ Quick Shortcuts'}</span>
                      {voiceQuery && <small>{getDisplaySuggestions().length} results</small>}
                    </div>

                    {getDisplaySuggestions().map((item, idx) => {
                      const isSelected = selectedIndex === idx
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`san-sug-row ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectSuggestion(item)}
                        >
                          <div className="san-sug-row-icon">
                            <Icon name={item.icon || 'box'} size={15} />
                          </div>
                          <div className="san-sug-row-body">
                            <div className="san-sug-row-top">
                              <span className="san-sug-title">{item.title}</span>
                              <span className="san-sug-badge">{item.category}</span>
                            </div>
                            <small className="san-sug-desc">{item.description}</small>
                          </div>
                          <span className="san-sug-arrow">
                            <Icon name="arrowRight" size={13} />
                          </span>
                        </button>
                      )
                    })}

                    {voiceQuery && getDisplaySuggestions().length === 0 && apiUsers.length === 0 && !isSearchingApi && (
                      <div className="san-sug-empty">
                        <p>No exact match for "<b>{voiceQuery}</b>"</p>
                        <small>Press <b>Enter</b> to run full search or tap the <b>Mic</b> to speak.</small>
                      </div>
                    )}
                  </div>

                  {/* LIVE API USER / CUSTOMER MATCHES */}
                  {apiUsers.length > 0 && (
                    <div className="san-sug-section">
                      <div className="san-sug-head">
                        <span><Icon name="user" size={13} /> People & Accounts</span>
                        <small>{apiUsers.length} found</small>
                      </div>
                      {apiUsers.map((u, uIdx) => (
                        <button
                          key={u.id || uIdx}
                          type="button"
                          className="san-sug-row is-user-row"
                          onClick={() => {
                            addRecentSearch(u.username || u.name || voiceQuery)
                            setShowSuggestions(false)
                            navigate(`/superadmin/manage-users/customer?search=${encodeURIComponent(u.username || u.phone || u.name || '')}`)
                          }}
                        >
                          <div className="san-sug-row-icon user-icon">
                            <Icon name="user" size={15} />
                          </div>
                          <div className="san-sug-row-body">
                            <div className="san-sug-row-top">
                              <span className="san-sug-title">{u.name || u.username || 'User'}</span>
                              <span className="san-sug-badge user-badge">{u.role || 'Member'}</span>
                            </div>
                            <small className="san-sug-desc">{u.phone || u.email || `ID: ${u.id}`}</small>
                          </div>
                          <span className="san-sug-arrow">
                            <Icon name="arrowRight" size={13} />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* FOOTER TIP */}
                  <div className="san-sug-footer">
                    <span>↑↓ to navigate • ↵ to select • ESC to close</span>
                    <button
                      type="button"
                      className="san-sug-footer-voice"
                      onClick={() => { setShowSuggestions(false); startVoiceModal() }}
                    >
                      <Icon name="mic" size={13} /> Speak
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="san-menu-center">
            <MenuGroup label="Management" items={management} />
            <MenuGroup label="Announcements" items={announcements} />
            <MenuGroup label="Users" items={usersMenu} />
            <MenuGroup label="Coins" items={coins} />
            <MenuGroup label="Reports" items={reports} />
            <MenuGroup label="Promotion" items={promotion} />
            <MenuGroup label="Payment" items={payment} />
            <MenuGroup label="Inventory" items={inventory} />
          </div>

          <div className="san-actions-right">
            <button
              className="san-bell-btn"
              type="button"
              title="Notifications"
              onClick={() => { setShowRequests(true); setRequestMsg(''); fetchProfileRequests() }}
            >
              <Icon name="bell" size={18} />
              {profileRequests.length > 0 && (
                <span className="san-bell-badge">{profileRequests.length}</span>
              )}
            </button>

            <div className="san-util-divider" />

            <button className="san-logout-link" type="button" onClick={logout} title="Sign Out">
              <Icon name="logout" size={15} />
              <span>Logout</span>
            </button>

            <button className="san-hamburger" type="button" onClick={() => setShowMobileDrawer(true)} aria-label="Open command menu" title="Command Menu">
              <Icon name="menu" size={19} />
            </button>
          </div>
          </div>
        </header>
        <div className="san-top-spacer" />
      </div>

      {/* ── RATE ENTRY POPUP ── */}
      {showRatePopup && (
        <div
          onClick={() => setShowRatePopup(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(17,24,23,0.55)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF6ED 100%)',
              border: '1px solid rgba(204,168,129,0.3)',
              borderRadius: '24px',
              width: '95%', maxWidth: '640px',
              maxHeight: '95vh',
              overflowY: 'auto',
              padding: '32px 36px',
              boxShadow: '0 40px 90px rgba(17,24,23,0.28), 0 0 0 1px rgba(204,168,129,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'rgba(204,168,129,0.15)', border: '1px solid rgba(204,168,129,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M8 6h8l3 5-3 9H8l-3-9 3-5z"/>
                    <path d="M9.5 12c0-1.1.9-2 2.5-2s2.5 1 2.5 2-1.5 1.5-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '16px' }}>ENTER METAL RATES</div>
                  <div style={{ color: '#7A8987', fontSize: '12px', marginTop: '2px' }}>
                    {dbRateDate ? `Current: ${dbRateDate}` : 'No rate entered yet'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowRatePopup(false)}
                style={{
                  background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)',
                  color: '#C92035', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {rateMsg && (
              <div style={{
                background: rateMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)',
                border: `1px solid ${rateMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`,
                color: rateMsg.includes('✅') ? '#0C4044' : '#C92035',
                borderRadius: '12px', padding: '13px 16px', fontSize: '13px', marginBottom: '18px'
              }}>
                {rateMsg}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Date *
              </label>
              <input
                type="date"
                value={rateForm.date}
                onChange={e => setRateForm({ ...rateForm, date: e.target.value })}
                style={{ width: '100%', background: '#FDFDFC', border: `1px solid #BDCFCE`, borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#CCA881', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Gold 22K</label>
                <input
                  type="number" placeholder="e.g. 12800"
                  value={rateForm.gold_22k}
                  onChange={e => setRateForm({ ...rateForm, gold_22k: e.target.value })}
                  style={{ width: '100%', background: '#FDFDFC', border: `1px solid rgba(204,168,129,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#CCA881', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#CCA881', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Gold 24K</label>
                <input
                  type="number" placeholder="e.g. 13900"
                  value={rateForm.gold_24k}
                  onChange={e => setRateForm({ ...rateForm, gold_24k: e.target.value })}
                  style={{ width: '100%', background: '#FDFDFC', border: `1px solid rgba(204,168,129,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#CCA881', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#53615F', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Silver 999</label>
                <input
                  type="number" placeholder="e.g. 225"
                  value={rateForm.silver_999}
                  onChange={e => setRateForm({ ...rateForm, silver_999: e.target.value })}
                  style={{ width: '100%', background: '#FDFDFC', border: `1px solid rgba(192,192,192,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#53615F', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'none' }}>
                <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Diamond 18K</label>
                <input
                  type="number" placeholder="e.g. 45000"
                  value={rateForm.diamond_18k}
                  onChange={e => setRateForm({ ...rateForm, diamond_18k: e.target.value })}
                  style={{ width: '100%', background: '#FFFFFF', border: `1px solid #BDCFCE`, borderRadius: '12px', padding: '13px 16px', color: '#073B3F', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'none' }}>
                <label style={{ display: 'block', color: '#0C4044', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Diamond 22K</label>
                <input
                  type="number" placeholder="e.g. 55000"
                  value={rateForm.diamond_22k}
                  onChange={e => setRateForm({ ...rateForm, diamond_22k: e.target.value })}
                  style={{ width: '100%', background: '#FDFDFC', border: `1px solid rgba(165,243,252,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#0C4044', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'none' }}>
                <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Platinum 92</label>
                <input
                  type="number" placeholder="e.g. 3200"
                  value={rateForm.platinum_92}
                  onChange={e => setRateForm({ ...rateForm, platinum_92: e.target.value })}
                  style={{ width: '100%', background: '#FFFFFF', border: `1px solid #BDCFCE`, borderRadius: '12px', padding: '13px 16px', color: '#073B3F', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <button
              disabled={rateSaving}
              onClick={async () => {
                if (!rateForm.date || !rateForm.gold_22k || !rateForm.gold_24k || !rateForm.silver_999) {
                  setRateMsg('❌ Gold and Silver fields are required.')
                  return
                }
                setRateSaving(true)
                try {
                  await api.post('/metal-rates/', {
                    date: rateForm.date,
                    gold_22k: rateForm.gold_22k,
                    gold_24k: rateForm.gold_24k,
                    silver_999: rateForm.silver_999,
                    diamond_18k: rateForm.diamond_18k || 0,
                    diamond_22k: rateForm.diamond_22k || 0,
                    platinum_92: rateForm.platinum_92 || 0,
                  })
                  setRateMsg('✅ Rate saved successfully!')
                  fetchMetalPrices()
                  setTimeout(() => setShowRatePopup(false), 1400)
                } catch (err) {
                  setRateMsg('❌ Failed: ' + JSON.stringify(err.response?.data))
                }
                setRateSaving(false)
              }}
              style={{
                marginTop: '22px',
                width: '100%', padding: '15px',
                background: rateSaving ? 'rgba(204,168,129,0.3)' : 'linear-gradient(135deg,#CCA881,#BB8958)',
                border: 'none', borderRadius: '14px',
                fontWeight: 800, color: rateSaving ? '#CCA881' : '#FDFDFC',
                fontSize: '15px', cursor: rateSaving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {rateSaving ? 'Saving...' : 'Save Rate'}
            </button>
          </div>
        </div>
      )}

      {/* ── TODAY RATES MODAL ── */}
      {showTodayRates && (
        <div
          onClick={() => setShowTodayRates(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF6ED 100%)', border: '1px solid rgba(204,168,129,0.28)', borderRadius: '24px', width: '95%', maxWidth: '480px', maxHeight: '95vh', overflowY: 'auto', padding: '26px 32px', boxShadow: '0 40px 90px rgba(17,24,23,0.28), 0 0 0 1px rgba(204,168,129,0.08)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(145deg,rgba(12,64,68,0.14),rgba(12,64,68,0.06))', border: '1px solid rgba(12,64,68,0.26)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '15px' }}>TODAY'S METAL RATES</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>
                    {dbRateDate ? new Date(dbRateDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No rate entered yet'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTodayRates(false)}
                style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {[
              { label: 'Gold 22K', color: '#8A5A25', rgb: '204,168,129', value: metalPrices.gold22k },
              { label: 'Gold 24K', color: '#8A5A25', rgb: '204,168,129', value: metalPrices.gold24k },
              { label: 'Silver 999', color: '#0C4044', rgb: '12,64,68', value: metalPrices.silver },
              { label: 'Diamond 18K', color: '#53615F', rgb: '209,223,222', value: metalPrices.diamond18k, hide: true },
              { label: 'Diamond 22K', color: '#0C4044', rgb: '12,64,68', value: metalPrices.diamond22k, hide: true },
              { label: 'Platinum 92', color: '#53615F', rgb: '231,237,236', value: metalPrices.platinum92, hide: true },
            ].filter(item => !item.hide).map(item => (
              <div key={item.label} style={{ background: '#FFFFFF', border: `1px solid rgba(${item.rgb},0.3)`, borderRadius: '14px', padding: '12px 18px', marginBottom: '9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: item.color, fontWeight: 800, fontSize: '13px' }}>{item.label}</div>
                  <div style={{ color: '#53615F', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>per gram</div>
                </div>
                <div style={{ color: item.color, fontWeight: 900, fontSize: '17px', fontFamily: 'monospace' }}>
                  {item.value ? item.value.toFixed(2) : <span style={{ color: '#7A8987', fontSize: '13px' }}>Not set</span>}
                </div>
              </div>
            ))}

            <button
              onClick={() => { setShowTodayRates(false); setShowRatePopup(true); setRateMsg('') }}
              style={{ width: '100%', marginTop: '6px', padding: '14px', background: 'linear-gradient(135deg,#CCA881,#BB8958)', border: 'none', borderRadius: '14px', fontWeight: 800, color: '#FDFDFC', fontSize: '14px', cursor: 'pointer' }}
            >
              Update Rates
            </button>
          </div>
        </div>
      )}

      {/* ── BIRTHDAY LIST MODAL ── */}
      {showBirthdayList && (
        <div onClick={() => setShowBirthdayList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FDF0F1 100%)', border: '1px solid rgba(201,32,53,0.22)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24)' }}>
            <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(201,32,53,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(201,32,53,0.16),rgba(201,32,53,0.08))', border: '1px solid rgba(201,32,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 21h16v-7a4 4 0 00-4-4H8a4 4 0 00-4 4v7z"/><path d="M4 17c1 0 1.5-1 2.5-1s1.5 1 2.5 1 1.5-1 2.5-1 1.5 1 2.5 1 1.5-1 2.5-1"/><path d="M12 10V6M9 6c0-1 1-1 1-2s-1-1-1-2M15 6c0-1-1-1-1-2s1-1 1-2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#C92035', fontWeight: 800, fontSize: '14px' }}>TODAY'S BIRTHDAYS</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <button onClick={() => setShowBirthdayList(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {celebLoading ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {[1,2,3].map(n => (
      <div key={n} style={{ height: '78px', borderRadius: '16px', background: 'linear-gradient(90deg,#F3F3F0 25%,#E7EDEC 50%,#F3F3F0 75%)', backgroundSize: '200% 100%', animation: 'skelShimmer 1.4s ease-in-out infinite' }} />
    ))}
  </div>
) : birthdayList.length === 0 ? (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', color: '#7A8987', padding: '50px 0', fontSize: '14px' }}>
    No birthdays today
  </div>
) : birthdayList.map((m, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSpecialAnnForm({
                      title: `Happy Birthday ${m.first_name} ${m.last_name || ''} (${m._id})`,
                      message: `By BitByte Technologies — Wishing you a wonderful birthday! May this special day bring you joy, happiness, and all the success you deserve. Here's to another amazing year! 🎉🎂`,
                      roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                    })
                    setShowBirthdayList(false)
                    setShowSpecialAnn(true)
                    setSpecialAnnMsg('')
                  }}
                  style={{ background: '#FFFFFF', border: '1px solid rgba(201,32,53,0.2)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(201,32,53,0.1)', color: m._roleColor, border: '1px solid rgba(201,32,53,0.3)' }}>{m._role}</span>
                        <span style={{ color: '#C92035', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                      </div>
                      <div style={{ color: '#111817', fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7A8987', fontSize: '11px', marginTop: '3px' }}>
                        {new Date(m._dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}
                      </div>
                    </div>
                    <div style={{ color: '#C92035', fontSize: '11px', fontWeight: 700 }}>Click to Wish</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ANNIVERSARY LIST MODAL ── */}
      {showAnniversaryList && (
        <div onClick={() => setShowAnniversaryList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF6ED 100%)', border: '1px solid rgba(204,168,129,0.28)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24)' }}>
            <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(204,168,129,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(204,168,129,0.2),rgba(204,168,129,0.1))', border: '1px solid rgba(204,168,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="6"/><path d="M9 9l3-6 3 6" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '14px' }}>TODAY'S ANNIVERSARIES</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <button onClick={() => setShowAnniversaryList(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {celebLoading ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {[1,2,3].map(n => (
      <div key={n} style={{ height: '78px', borderRadius: '16px', background: 'linear-gradient(90deg,#F3F3F0 25%,#E7EDEC 50%,#F3F3F0 75%)', backgroundSize: '200% 100%', animation: 'skelShimmer 1.4s ease-in-out infinite' }} />
    ))}
  </div>
) : anniversaryList.length === 0 ? (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', color: '#7A8987', padding: '50px 0', fontSize: '14px' }}>
    No anniversaries today
  </div>
) : anniversaryList.map((m, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSpecialAnnForm({
                      title: `🎉 Happy Anniversary ${m.first_name} ${m.last_name || ''} (${m._id})`,
                      message: `By BitByte Technologies — Wishing you a beautiful anniversary! May your bond grow stronger with each passing year. Here's to celebrating love and togetherness!`,
                      roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                    })
                    setShowAnniversaryList(false)
                    setShowSpecialAnn(true)
                    setSpecialAnnMsg('')
                  }}
                  style={{ background: '#FFFFFF', border: '1px solid rgba(204,168,129,0.24)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(204,168,129,0.15)', color: '#CCA881', border: '1px solid rgba(204,168,129,0.35)' }}>{m._role}</span>
                        <span style={{ color: '#CCA881', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                      </div>
                      <div style={{ color: '#111817', fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7A8987', fontSize: '11px', marginTop: '3px' }}>
                        {new Date(m._ann).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}
                      </div>
                    </div>
                    <div style={{ color: '#CCA881', fontSize: '11px', fontWeight: 700 }}>Click to Wish</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── JOIN DATE LIST MODAL ── */}
      {showJoinDateList && (
        <div onClick={() => setShowJoinDateList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF3E9 100%)', border: '1px solid rgba(187,137,88,0.28)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24)' }}>
            <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(187,137,88,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(187,137,88,0.2),rgba(187,137,88,0.1))', border: '1px solid rgba(187,137,88,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BB8958" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4h8v6a4 4 0 01-8 0V4z"/><path d="M8 5H5a2 2 0 002 4M16 5h3a2 2 0 01-2 4"/><path d="M12 14v3M9 21h6M9 21l1-4h4l1 4"/></svg>
                </div>
                <div>
                  <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '14px' }}>JOINING ANNIVERSARIES</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <button onClick={() => setShowJoinDateList(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {celebLoading ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {[1,2,3].map(n => (
      <div key={n} style={{ height: '78px', borderRadius: '16px', background: 'linear-gradient(90deg,#F3F3F0 25%,#E7EDEC 50%,#F3F3F0 75%)', backgroundSize: '200% 100%', animation: 'skelShimmer 1.4s ease-in-out infinite' }} />
    ))}
  </div>
) : joinDateList.length === 0 ? (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center', padding: '60px 0' }}>
    <span style={{ color: '#7A8987', fontSize: '14px', fontWeight: 600 }}>No joining anniversaries today</span>
  </div>
) : joinDateList.map((m, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const yrs = m._yearsCompleted
                    const ordinal = yrs === 1 ? '1st' : yrs === 2 ? '2nd' : yrs === 3 ? '3rd' : `${yrs}th`
                    setSpecialAnnForm({
                      title: `🎉 Happy ${ordinal} Joining Anniversary ${m.first_name} ${m.last_name || ''} (${m._id})`,
                      message: `By BitByte Technologies — Congratulations on completing ${yrs} amazing year${yrs > 1 ? 's' : ''} with us! Your dedication and hard work are truly valued. Here's to many more years of success together!`,
                      roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                    })
                    setShowJoinDateList(false)
                    setShowSpecialAnn(true)
                    setSpecialAnnMsg('')
                  }}
                  style={{ background: '#FFFFFF', border: '1px solid rgba(187,137,88,0.24)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(187,137,88,0.15)', color: '#BB8958', border: '1px solid rgba(187,137,88,0.35)' }}>{m._role}</span>
                        <span style={{ color: '#BB8958', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                      </div>
                      <div style={{ color: '#111817', fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#BB8958', fontSize: '12px', fontWeight: 700, marginTop: '3px' }}>
                        {m._yearsCompleted === 1 ? '1st' : m._yearsCompleted === 2 ? '2nd' : m._yearsCompleted === 3 ? '3rd' : `${m._yearsCompleted}th`} Year Anniversary
                      </div>
                      <div style={{ color: '#7A8987', fontSize: '11px' }}>Joined: {new Date(m._joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div style={{ color: '#BB8958', fontSize: '11px', fontWeight: 700 }}>Click to Wish</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SPECIAL ANNOUNCEMENT MODAL (Birthday/Anniversary/JoinDate) ── */}
      {showSpecialAnn && (
        <div onClick={() => setShowSpecialAnn(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.85)', backdropFilter: 'blur(12px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(187,137,88,0.3)', borderRadius: '24px', width: '95%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(187,137,88,0.15)', border: '1px solid rgba(187,137,88,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
                <div>
                  <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '15px' }}>SEND ANNOUNCEMENT</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>Review & send the wish</div>
                </div>
              </div>
              <button onClick={() => setShowSpecialAnn(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
            </div>
            {specialAnnMsg && (
              <div style={{ background: specialAnnMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${specialAnnMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: specialAnnMsg.includes('✅') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', marginBottom: '18px' }}>
                {specialAnnMsg}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Announcement Title</label>
              <input
                value={specialAnnForm.title}
                onChange={e => setSpecialAnnForm({ ...specialAnnForm, title: e.target.value })}
                style={{ width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message</label>
              <textarea
                value={specialAnnForm.message}
                onChange={e => setSpecialAnnForm({ ...specialAnnForm, message: e.target.value })}
                rows={4}
                style={{ width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Send To</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  { key: 'admin', label: 'Admin', color: '#53615F' },
                  { key: 'dealer', label: 'Dealer', color: '#0C4044' },
                  { key: 'sub_dealer', label: 'Sub Dealer', color: '#BB8958' },
                  { key: 'promotor', label: 'Promotor', color: '#CCA881' },
                  { key: 'customer', label: 'Customer', color: '#C92035' },
                ].map(role => {
                  const checked = specialAnnForm.roles.includes(role.key)
                  return (
                    <div key={role.key}
                      onClick={() => {
                        const updated = checked ? specialAnnForm.roles.filter(x => x !== role.key) : [...specialAnnForm.roles, role.key]
                        setSpecialAnnForm({ ...specialAnnForm, roles: updated })
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', background: checked ? `${role.color}22` : `${role.color}09`, border: `1.5px solid ${checked ? `${role.color}99` : `${role.color}33`}` }}
                    >
                      <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: `2px solid ${role.color}`, background: checked ? role.color : 'transparent' }} />
                      <span style={{ color: checked ? role.color : '#7A8987', fontSize: '12px', fontWeight: checked ? 700 : 500 }}>{role.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <button
              disabled={specialAnnSending}
              onClick={async () => {
                if (!specialAnnForm.title.trim() || !specialAnnForm.message.trim()) { setSpecialAnnMsg('Title and Message required.'); return }
                if (specialAnnForm.roles.length === 0) { setSpecialAnnMsg('Select at least one role.'); return }
                setSpecialAnnSending(true)
                try {
                  await api.post('/announcements/', { title: specialAnnForm.title, message: specialAnnForm.message, target_roles: specialAnnForm.roles })
                  setSpecialAnnMsg('Announcement sent successfully!')
                  fetchMyAnnouncements()
                  setTimeout(() => setShowSpecialAnn(false), 1500)
                } catch (err) {
                  setSpecialAnnMsg('Failed: ' + JSON.stringify(err.response?.data))
                }
                setSpecialAnnSending(false)
              }}
              style={{ width: '100%', padding: '14px', background: specialAnnSending ? 'rgba(187,137,88,0.3)' : 'linear-gradient(90deg,#BB8958,#BB8958)', border: 'none', borderRadius: '12px', fontWeight: 800, color: specialAnnSending ? '#BB8958' : '#111817', fontSize: '15px', cursor: specialAnnSending ? 'not-allowed' : 'pointer' }}
            >
              {specialAnnSending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* ── ANNOUNCEMENT SEND MODAL ── */}
      {showAnnouncement && (
        <div onClick={() => setShowAnnouncement(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF3E9 100%)', border: '1px solid rgba(187,137,88,0.28)', borderRadius: '24px', width: '95%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px 36px', boxShadow: '0 40px 90px rgba(17,24,23,0.28)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(145deg,rgba(187,137,88,0.22),rgba(187,137,88,0.1))', border: '1px solid rgba(187,137,88,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#BB8958" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10v4a1 1 0 001 1h2l6 4V5L6 9H4a1 1 0 00-1 1z"/><path d="M16 8a4 4 0 010 8M19 6a7 7 0 010 12"/></svg>
                </div>
                <div>
                  <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '15px' }}>SEND ANNOUNCEMENT</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>Notify selected roles instantly</div>
                </div>
              </div>
              <button onClick={() => setShowAnnouncement(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {announcementMsg && (
              <div style={{ background: announcementMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${announcementMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: announcementMsg.includes('✅') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', marginBottom: '18px' }}>
                {announcementMsg}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Announcement Title *</label>
              <input
                value={announcementForm.title}
                onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="e.g. Tomorrow Leave, Low Orders Alert..."
                style={{ width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message *</label>
              <textarea
                value={announcementForm.message}
                onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                rows={4}
                placeholder="Type your announcement here..."
                style={{ width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Send To (Select Roles) *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  { key: 'admin', label: 'Admin', color: '#53615F' },
                  { key: 'dealer', label: 'Dealer', color: '#0C4044' },
                  { key: 'sub_dealer', label: 'Sub Dealer', color: '#BB8958' },
                  { key: 'promotor', label: 'Promotor', color: '#CCA881' },
                  { key: 'customer', label: 'Customer', color: '#C92035' },
                ].map(role => {
                  const checked = announcementForm.roles.includes(role.key)
                  return (
                    <div key={role.key}
                      onClick={() => {
                        const updated = checked ? announcementForm.roles.filter(x => x !== role.key) : [...announcementForm.roles, role.key]
                        setAnnouncementForm({ ...announcementForm, roles: updated })
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '999px', cursor: 'pointer', background: checked ? `${role.color}22` : '#FFFFFF', border: `1.5px solid ${checked ? `${role.color}88` : 'rgba(189,207,206,0.6)'}` }}
                    >
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${checked ? role.color : `${role.color}55`}`, background: checked ? role.color : 'transparent' }} />
                      <span style={{ fontSize: '13px', fontWeight: checked ? 700 : 500, color: checked ? role.color : '#7A8987' }}>{role.label}</span>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => {
                  const all = ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                  const allSelected = all.every(r => announcementForm.roles.includes(r))
                  setAnnouncementForm({ ...announcementForm, roles: allSelected ? [] : all })
                }}
                style={{ marginTop: '10px', padding: '6px 14px', fontSize: '11px', fontWeight: 700, background: 'rgba(187,137,88,0.1)', border: '1px solid rgba(187,137,88,0.3)', borderRadius: '8px', color: '#BB8958', cursor: 'pointer' }}
              >
                {['admin', 'dealer', 'sub_dealer', 'promotor', 'customer'].every(r => announcementForm.roles.includes(r)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <button
              disabled={announcingSending}
              onClick={async () => {
                if (!announcementForm.title.trim() || !announcementForm.message.trim()) { setAnnouncementMsg('❌ Title and Message are required.'); return }
                if (announcementForm.roles.length === 0) { setAnnouncementMsg('❌ Please select at least one role.'); return }
                setAnnouncingSending(true)
                try {
                  await api.post('/announcements/', { title: announcementForm.title, message: announcementForm.message, target_roles: announcementForm.roles })
                  setAnnouncementMsg('✅ Announcement sent successfully!')
                  setAnnouncementForm({ title: '', message: '', roles: [] })
                  fetchMyAnnouncements()
                } catch (err) {
                  setAnnouncementMsg('❌ Failed: ' + JSON.stringify(err.response?.data))
                }
                setAnnouncingSending(false)
              }}
              style={{ width: '100%', padding: '15px', background: announcingSending ? 'rgba(187,137,88,0.3)' : 'linear-gradient(135deg,#CCA881,#BB8958)', border: 'none', borderRadius: '14px', fontWeight: 800, color: announcingSending ? '#BB8958' : '#FDFDFC', fontSize: '15px', cursor: announcingSending ? 'not-allowed' : 'pointer' }}
            >
              {announcingSending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* ── MY ANNOUNCEMENTS MODAL ── */}
      {showMyAnnouncements && (
        <div onClick={() => setShowMyAnnouncements(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#EEF4F3 100%)', border: '1px solid rgba(12,64,68,0.16)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24)' }}>
            <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(12,64,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(12,64,68,0.14),rgba(12,64,68,0.06))', border: '1px solid rgba(12,64,68,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M2 9l10 6 10-6"/><path d="M16 3l3 3-3 3"/></svg>
                </div>
                <div>
                  <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '14px' }}>MY ANNOUNCEMENTS</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{myAnnouncements.length} total sent by Super Admin</div>
                </div>
              </div>
              <button onClick={() => setShowMyAnnouncements(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myAnnouncements.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#7A8987', padding: '60px 0', fontSize: '15px' }}>No announcements yet.</div>
              ) : myAnnouncements.map((ann, idx) => (
                <div key={ann.id} style={{ background: idx === 0 ? 'rgba(12,64,68,0.04)' : '#FFFFFF', border: `1px solid ${idx === 0 ? 'rgba(12,64,68,0.3)' : 'rgba(189,207,206,0.5)'}`, borderRadius: '16px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {idx === 0 && <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: 'rgba(12,64,68,0.12)', color: '#0C4044', border: '1px solid rgba(12,64,68,0.28)' }}>● NEW</span>}
                      <span style={{ color: idx === 0 ? '#073B3F' : '#111817', fontWeight: 700, fontSize: '14px' }}>{ann.title}</span>
                    </div>
                    <span style={{ color: '#7A8987', fontSize: '10px', whiteSpace: 'nowrap' }}>{new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div style={{ color: '#7A8987', fontSize: '13px', lineHeight: 1.6 }}>{ann.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE UPDATE REQUESTS MODAL ── */}
      {showRequests && (
        <div
          onClick={() => { setShowRequests(false); setSelectedRequest(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#FDFDFC', border: '1px solid rgba(204,168,129,0.3)', borderRadius: '24px', width: '95%', maxWidth: selectedRequest ? '900px' : '560px', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(17,24,23,0.6)' }}
          >
            <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(204,168,129,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  PROFILE UPDATE REQUESTS
                </div>
                <div style={{ color: '#7A8987', fontSize: '11px', marginTop: '3px' }}>{profileRequests.length} pending requests</div>
              </div>
              <button
                onClick={() => { setShowRequests(false); setSelectedRequest(null) }}
                style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {requestMsg && (
              <div style={{ margin: '14px 28px 0', background: requestMsg.includes('successfully') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${requestMsg.includes('successfully') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: requestMsg.includes('successfully') ? '#0C4044' : '#C92035', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>
                {requestMsg}
              </div>
            )}

            {!selectedRequest ? (
              <div style={{ padding: '20px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {profileRequests.length === 0 ? (
                  <div style={{ color: '#7A8987', textAlign: 'center', padding: '50px 0' }}>No pending profile requests.</div>
                ) : profileRequests.map(req => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    style={{ background: 'rgba(17,24,23,0.03)', border: '1px solid rgba(204,168,129,0.22)', borderRadius: '14px', padding: '16px 18px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>{req.role}</div>
                        <div style={{ color: '#111817', fontWeight: 700, fontSize: '15px', marginTop: '4px' }}>{req.first_name} {req.last_name}</div>
                        <div style={{ color: '#7A8987', fontSize: '12px', marginTop: '4px' }}>{req.email}</div>
                      </div>
                      <div style={{ color: '#7A8987', fontSize: '11px', whiteSpace: 'nowrap' }}>{new Date(req.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    {req.message && (
                      <div style={{ color: '#7A8987', fontSize: '13px', marginTop: '10px', lineHeight: 1.5 }}>{req.message}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px 28px', overflowY: 'auto' }}>
                <button
                  onClick={() => setSelectedRequest(null)}
                  style={{ marginBottom: '14px', background: 'rgba(204,168,129,0.1)', border: '1px solid rgba(204,168,129,0.3)', color: '#CCA881', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Back to Requests
                </button>
                <div style={{ color: '#CCA881', fontWeight: 800, marginBottom: '14px' }}>REQUEST DETAILS</div>

                {selectedRequest.message && (
                  <div style={{ background: 'rgba(189,207,206,0.06)', border: '1px solid rgba(189,207,206,0.2)', borderRadius: '12px', padding: '14px 16px', color: '#111817', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
                    {selectedRequest.message}
                  </div>
                )}

                {selectedRequest.proof_document && (
                  <button
                    onClick={async () => {
                      const url = selectedRequest.proof_document
                      const fullUrl = url.startsWith('http') ? url : `https://bitbyte-e-commerce.onrender.com/${url.replace(/^\//, '')}`
                      setProofUrl(''); setProofType(''); setProofLoading(true); setProofModal(true)
                      try {
                        const token = localStorage.getItem('token')
                        const response = await fetch(fullUrl, { headers: { Authorization: `Bearer ${token}` } })
                        if (!response.ok) throw new Error('fetch failed')
                        const contentType = response.headers.get('content-type') || ''
                        const blob = await response.blob()
                        const objectUrl = URL.createObjectURL(blob)
                        const isPdf = contentType.includes('pdf') || fullUrl.toLowerCase().includes('.pdf')
                        setProofType(isPdf ? 'pdf' : 'image')
                        setProofUrl(objectUrl)
                      } catch {
                        const isPdf = fullUrl.toLowerCase().includes('.pdf')
                        setProofType(isPdf ? 'pdf' : 'image')
                        setProofUrl(fullUrl)
                      } finally {
                        setProofLoading(false)
                      }
                    }}
                    style={{ marginBottom: '16px', background: 'rgba(187,137,88,0.1)', border: '1px solid rgba(187,137,88,0.35)', color: '#BB8958', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
                  >
                    View Proof Document
                  </button>
                )}

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', color: '#CCA881', padding: '10px', borderBottom: '1px solid rgba(189,207,206,0.78)' }}>Field</th>
                        <th style={{ textAlign: 'left', color: '#CCA881', padding: '10px', borderBottom: '1px solid rgba(189,207,206,0.78)' }}>Details To Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['initial', 'Initial'], ['first_name', 'First Name'], ['last_name', 'Last Name'],
                        ['mobile_number', 'Mobile Number'], ['gender', 'Gender'], ['dob', 'DOB'],
                        ['married_status', 'Married Status'], ['anniversary_date', 'Anniversary Date'],
                        ['door_no', 'Door No'], ['street_name', 'Street Name'], ['town_name', 'Town Name'],
                        ['city_name', 'City Name'], ['district', 'District'], ['state', 'State'],
                        ['aadhaar_no', 'Aadhaar No'], ['pan_no', 'PAN No'], ['occupation', 'Occupation'],
                        ['occupation_detail', 'Occupation Detail'], ['annual_salary', 'Annual Salary'],
                      ].map(([key, label]) => (
                        selectedRequest[key] ? (
                          <tr key={key}>
                            <td style={{ padding: '10px', color: '#7A8987', borderBottom: '1px solid rgba(189,207,206,0.78)' }}>{label}</td>
                            <td style={{ padding: '10px', color: '#111817', borderBottom: '1px solid rgba(189,207,206,0.78)' }}>{selectedRequest[key]}</td>
                          </tr>
                        ) : null
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => approveProfileRequest(selectedRequest.id)}
                  style={{ width: '100%', marginTop: '20px', padding: '13px', background: 'linear-gradient(90deg,#CCA881,#BDCFCE)', border: 'none', borderRadius: '12px', color: '#FDFDFC', fontWeight: 900, cursor: 'pointer' }}
                >
                  Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUPER ADMIN COMMAND MENU (SLIDE-OUT PANEL) ── */}
      {showMobileDrawer && (
        <>
          <div className="san-drawer-overlay" onClick={() => setShowMobileDrawer(false)} />
          <div className="san-drawer">
            {/* HEADER */}
            <div className="san-drawer-head">
              <span className="san-drawer-title">Super Admin Menu</span>
              <button
                className="san-drawer-close"
                onClick={() => setShowMobileDrawer(false)}
                aria-label="Close menu"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            {/* PROFILE SECTION */}
            <div className="san-drawer-profile">
              <div className="san-drawer-avatar">
                <Icon name="crown" size={21} />
              </div>
              <div className="san-drawer-user-info">
                <span className="san-drawer-user-name">Super Admin</span>
                <span className="san-drawer-user-email">{adminEmail}</span>
                <span className="san-drawer-status">
                  <span className="san-drawer-status-dot" /> Online
                </span>
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="san-drawer-search-wrap">
              <div className="san-drawer-search-box">
                <Icon name="search" size={15} />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
                {menuSearch && (
                  <button
                    type="button"
                    className="san-drawer-search-clear"
                    onClick={() => setMenuSearch('')}
                    aria-label="Clear search"
                  >
                    <Icon name="close" size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="san-drawer-body">
              {menuSearch.trim() ? (
                /* SEARCH FILTERED RESULTS */
                <div className="san-drawer-search-results">
                  <div className="san-drawer-search-count">
                    {filteredMenuItems.length} {filteredMenuItems.length === 1 ? 'result' : 'results'} found
                  </div>
                  {filteredMenuItems.length > 0 ? (
                    filteredMenuItems.map((item, idx) => {
                      const isActive = item.path && currentPath === item.path
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`san-drawer-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => {
                            setShowMobileDrawer(false)
                            setMenuSearch('')
                            item.action()
                          }}
                        >
                          <div className="san-drawer-item-left">
                            <span className="san-drawer-item-icon">
                              <Icon name={item.icon || 'arrowRight'} size={16} />
                            </span>
                            <div className="san-drawer-item-texts">
                              <span className="san-drawer-item-title">{item.title}</span>
                              <span className="san-drawer-item-section-tag">{item.section}</span>
                            </div>
                          </div>
                          <span className="san-drawer-chevron">›</span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="san-drawer-empty-search">
                      <Icon name="search" size={24} />
                      <p>No menu items matching "{menuSearch}"</p>
                    </div>
                  )}
                </div>
              ) : (
                /* REGULAR COLLAPSIBLE MENU SECTIONS */
                <>
                  {/* MAIN SECTION */}
                  <div className="san-section-header">MAIN</div>
                  
                  {/* Dashboard Item */}
                  <button
                    type="button"
                    className={`san-drawer-item ${(currentPath === '/super-admin' || currentPath === '/') ? 'is-active' : ''}`}
                    onClick={() => {
                      setShowMobileDrawer(false)
                      navigate('/super-admin')
                    }}
                  >
                    <div className="san-drawer-item-left">
                      <span className="san-drawer-item-icon">
                        <Icon name="home" size={17} />
                      </span>
                      <span className="san-drawer-item-title">Dashboard</span>
                    </div>
                  </button>

                  {/* Collapsible Groups */}
                  {drawerMainGroups.map((group) => {
                    const isExpanded = !!expandedSections[group.label]
                    const hasActiveChild = group.items.some(it => it.path && currentPath === it.path)

                    return (
                      <div key={group.label} className="san-drawer-group-wrap">
                        <button
                          type="button"
                          className={`san-drawer-item ${hasActiveChild ? 'has-active-child' : ''}`}
                          onClick={() => toggleSection(group.label)}
                        >
                          <div className="san-drawer-item-left">
                            <span className="san-drawer-item-icon">
                              <Icon name={group.icon} size={17} />
                            </span>
                            <span className="san-drawer-item-title">{group.label}</span>
                          </div>
                          <span className={`san-drawer-chevron ${isExpanded ? 'is-expanded' : ''}`}>›</span>
                        </button>

                        {isExpanded && (
                          <div className="san-drawer-submenu">
                            {group.items.map((sub, sIdx) => {
                              const isSubActive = sub.path && currentPath === sub.path
                              return (
                                <button
                                  key={sIdx}
                                  type="button"
                                  className={`san-drawer-subitem ${isSubActive ? 'is-active' : ''}`}
                                  onClick={() => {
                                    setShowMobileDrawer(false)
                                    sub.action()
                                  }}
                                >
                                  <span>{sub.label}</span>
                                  {isSubActive && <Icon name="check" size={13} />}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* QUICK ACCESS SECTION */}
                  <div className="san-section-header">QUICK ACCESS</div>
                  {drawerQuickAccess.map((qa, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      className="san-drawer-qa-item"
                      onClick={() => {
                        setShowMobileDrawer(false)
                        qa.action()
                      }}
                    >
                      <div className="san-drawer-item-left">
                        <span className="san-drawer-badge-icon" style={{ background: qa.bg, color: qa.color }}>
                          <Icon name={qa.icon} size={16} />
                        </span>
                        <span className="san-drawer-item-title">{qa.label}</span>
                      </div>
                      <span className="san-drawer-chevron">›</span>
                    </button>
                  ))}

                  {/* SUPPORT SECTION */}
                  <div className="san-section-header">SUPPORT</div>
                  <button
                    type="button"
                    className="san-drawer-item"
                    onClick={() => {
                      setShowMobileDrawer(false)
                      setShowSupportModal(true)
                    }}
                  >
                    <div className="san-drawer-item-left">
                      <span className="san-drawer-item-icon">
                        <Icon name="help" size={17} />
                      </span>
                      <span className="san-drawer-item-title">Help & Support</span>
                    </div>
                    <span className="san-drawer-chevron">›</span>
                  </button>

                  <button
                    type="button"
                    className="san-drawer-logout"
                    onClick={() => {
                      setShowMobileDrawer(false)
                      logout()
                    }}
                  >
                    <Icon name="logout" size={18} />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── ATHIRAI HELP & SUPPORT MODAL ── */}
      {showSupportModal && (
        <div
          onClick={() => setShowSupportModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(17,24,23,0.45)',
            backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
            zIndex: 1600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px 26px',
              boxShadow: '0 24px 60px rgba(7,59,63,0.22)',
              border: '1px solid rgba(189,207,206,0.5)',
              position: 'relative',
              animation: 'sanAlertSlideUp 0.22s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EAF7EE', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="help" size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#073B3F' }}>Help & Support</h3>
                  <small style={{ color: '#718280', fontSize: '12px' }}>Athirai Super Admin Desk</small>
                </div>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718280', padding: '4px' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ background: '#F8FAF9', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', border: '1px solid #E5EBEA', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#718280' }}>Priority Support:</span>
                <strong style={{ color: '#073B3F' }}>support@athirai.com</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#718280' }}>Direct Helpline:</span>
                <strong style={{ color: '#073B3F' }}>+91 98765 43210</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#718280' }}>Availability:</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>24/7 Dedicated Support</span>
              </div>
            </div>

            <p style={{ margin: '0 0 18px 0', fontSize: '12.5px', color: '#556B68', lineHeight: 1.5 }}>
              Need assistance with Super Admin privileges, user commissions, rate locks, or technical issues? Contact the Athirai support team anytime.
            </p>

            <button
              onClick={() => setShowSupportModal(false)}
              style={{
                width: '100%',
                padding: '11px',
                background: '#073B3F',
                border: 'none',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── ATHIRAI PROMOTIONS SELECTOR MODAL ── */}
      {showPromotionModal && (
        <div
          onClick={() => setShowPromotionModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(17,24,23,0.45)',
            backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
            zIndex: 1600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '22px',
              maxWidth: '520px',
              width: '100%',
              padding: '26px 28px',
              boxShadow: '0 24px 60px rgba(7,59,63,0.22)',
              border: '1px solid rgba(189,207,206,0.5)',
              position: 'relative',
              animation: 'sanAlertSlideUp 0.22s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FEF3E7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="tag" size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#073B3F' }}>Promotions Management</h3>
                  <small style={{ color: '#718280', fontSize: '12px' }}>Select promotion category to view or create</small>
                </div>
              </div>
              <button
                onClick={() => setShowPromotionModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718280', padding: '4px' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { title: 'Retailers Promotion', path: '/promotions/retailer', desc: 'Promotional offers, retailer schemes & margin bonuses', bg: '#EAF7EE', color: '#059669', icon: 'tag' },
                { title: 'Wholesale Dealer Promotion', path: '/promotions/wholesale-dealer', desc: 'Bulk trade incentive tiers & wholesale volume promotions', bg: '#EFF6FF', color: '#2563EB', icon: 'tag' },
                { title: 'Distributor Promotion', path: '/promotions/distributor', desc: 'Regional supply campaigns, targets & distributor bonuses', bg: '#FEF3E7', color: '#D97706', icon: 'tag' },
                { title: 'Super Stockist Promotion', path: '/promotions/super-stockist', desc: 'Enterprise volume tiers & super stockist benefits', bg: '#FDF4FF', color: '#9333EA', icon: 'tag' },
              ].map((promo, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setShowPromotionModal(false)
                    navigate(promo.path)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #E5EBEA',
                    background: '#FDFDFC',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#F4F7F6'
                    e.currentTarget.style.borderColor = '#073B3F'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FDFDFC'
                    e.currentTarget.style.borderColor = '#E5EBEA'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: promo.bg, color: promo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name={promo.icon} size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 750, color: '#073B3F' }}>{promo.title}</div>
                      <div style={{ fontSize: '11.5px', color: '#718280', marginTop: '2px' }}>{promo.desc}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', color: '#8A9E9C', fontWeight: 600 }}>›</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPromotionModal(false)}
              style={{
                width: '100%',
                padding: '11px',
                background: '#F0F4F3',
                border: 'none',
                borderRadius: '10px',
                color: '#073B3F',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── PROOF DOCUMENT PREVIEW MODAL ── */}
      {proofModal && (
        <div
          onClick={() => {
            if (proofUrl?.startsWith('blob:')) URL.revokeObjectURL(proofUrl)
            setProofModal(false); setProofUrl(''); setProofType('')
          }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.92)', backdropFilter: 'blur(14px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#FDFDFC', border: '1px solid rgba(187,137,88,0.35)', borderRadius: '20px', width: '95%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(187,137,88,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '13px' }}>PROOF DOCUMENT</div>
                <div style={{ color: '#7A8987', fontSize: '10px', marginTop: '2px' }}>
                  {selectedRequest?.first_name} {selectedRequest?.last_name} {selectedRequest?.role?.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => { setProofModal(false); setProofUrl('') }}
                style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}
              >
                Close
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column' }}>
              {proofLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid rgba(187,137,88,0.2)', borderTop: '3px solid #BB8958', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: '#7A8987', fontSize: '14px' }}>Loading document...</span>
                </div>
              )}
              {!proofLoading && proofType === 'image' && proofUrl && (
                <img src={proofUrl} alt="Proof" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid rgba(187,137,88,0.2)' }} onError={() => setProofType('error')} />
              )}
              {!proofLoading && proofType === 'pdf' && proofUrl && (
                <iframe src={proofUrl} style={{ width: '100%', height: '65vh', borderRadius: '10px', border: 'none' }} title="Proof Document" />
              )}
              {!proofLoading && proofType === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '40px' }}>
                  <div style={{ color: '#7A8987', fontSize: '14px', textAlign: 'center' }}>Document load failed</div>
                  <a href={proofUrl} target="_blank" rel="noreferrer" style={{ padding: '10px 20px', background: 'rgba(187,137,88,0.15)', border: '1px solid rgba(187,137,88,0.4)', borderRadius: '10px', color: '#BB8958', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── STYLISH SEARCH / VOICE ALERT MODAL ── */}
      {searchAlert && (
        <div
          onClick={() => setSearchAlert(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 31, 34, 0.52)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'sanAlertFadeIn 180ms ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '480px',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(7, 59, 63, 0.22), 0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(204, 168, 129, 0.35)',
              position: 'relative',
              animation: 'sanAlertSlideUp 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                background:
                  searchAlert.type === 'error'
                    ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                    : searchAlert.type === 'info'
                    ? 'linear-gradient(135deg, #073B3F 0%, #0C5258 100%)'
                    : 'linear-gradient(135deg, #073B3F 0%, #114F54 60%, #CC9D42 100%)',
                padding: '22px 26px 18px',
                color: '#FFFFFF',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.16)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#F3E5D0',
                      marginBottom: '2px',
                    }}
                  >
                    ATHIRAI SUPER ADMIN
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {searchAlert.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSearchAlert(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 140ms ease',
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '22px 26px 16px' }}>
              {searchAlert.query && (
                <div
                  style={{
                    marginBottom: '14px',
                    padding: '10px 14px',
                    background: '#F4F7F6',
                    borderRadius: '12px',
                    border: '1px solid #E1EBEA',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#728A87',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      flexShrink: 0,
                    }}
                  >
                    Search Query:
                  </span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#073B3F',
                      background: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #D5E3E1',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '300px',
                    }}
                  >
                    "{searchAlert.query}"
                  </span>
                </div>
              )}

              <p style={{ margin: '0 0 16px', color: '#4A5B59', fontSize: '13.5px', lineHeight: 1.55 }}>
                {searchAlert.message}
              </p>

              {searchAlert.suggestions && searchAlert.suggestions.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#728A87',
                      marginBottom: '8px',
                    }}
                  >
                    Suggested Quick Links:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {searchAlert.suggestions.map((s) => (
                      <button
                        key={s.path}
                        type="button"
                        onClick={() => {
                          setSearchAlert(null)
                          navigate(s.path)
                        }}
                        style={{
                          background: '#F0F5F4',
                          border: '1px solid #D5E3E1',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#073B3F',
                          cursor: 'pointer',
                          transition: 'all 140ms ease',
                        }}
                      >
                        {s.label} ↗
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 26px 20px',
                background: '#FAFBFB',
                borderTop: '1px solid #EDF2F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setSearchAlert(null)}
                style={{
                  padding: '9px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#073B3F',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(7, 59, 63, 0.25)',
                  transition: 'all 140ms ease',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── YOUTUBE / GOOGLE STYLE VOICE SEARCH MODAL ── */}
      {showVoiceModal && (
        <div className="san-voice-overlay" onClick={handleCloseVoiceModal}>
          <div className="san-voice-card" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="san-voice-header">
              <h3 className="san-voice-title">
                {voiceStatus === 'listening' ? 'Listening...' :
                 voiceStatus === 'processing' ? 'Searching...' :
                 voiceStatus === 'error' ? 'Notice' : 'Voice Search'}
              </h3>
              <button
                type="button"
                className="san-voice-close-btn"
                onClick={handleCloseVoiceModal}
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Live Transcript / Speech Area */}
            <div className="san-voice-transcript-box">
              {voiceInterim ? (
                <div className="san-voice-transcript-active">
                  "{voiceInterim}"
                </div>
              ) : (
                <div className="san-voice-transcript-idle">
                  {voiceStatus === 'error'
                    ? (voiceErrorMsg || 'Could not access microphone.')
                    : 'Speak now...'}
                </div>
              )}
            </div>

            {/* Central Animated Mic */}
            <div className="san-voice-mic-wrap">
              {voiceStatus === 'listening' && (
                <>
                  <div className="san-voice-ripple ripple-1" />
                  <div className="san-voice-ripple ripple-2" />
                </>
              )}
              <button
                type="button"
                className={`san-voice-mic-main ${voiceStatus === 'listening' ? 'is-active' : ''}`}
                onClick={() => {
                  if (voiceStatus === 'listening') {
                    stopVoiceRecognition()
                    setVoiceStatus('ready')
                  } else {
                    startSpeechRecognition()
                  }
                }}
                title={voiceStatus === 'listening' ? 'Click to pause' : 'Click to speak'}
              >
                <Icon name="mic" size={34} />
              </button>
            </div>

            <div className="san-voice-status-sub">
              {voiceStatus === 'listening' ? 'Tap microphone to pause' : 'Tap to start speaking'}
            </div>
          </div>
        </div>
      )}
    </>
  )
}




