import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import logo from '../assets/logo.png'
import api from '../api'

const ANN_ROLE_META = {
  ADMIN: { seenKey: 'adminAnnouncementSeen', idField: 'admin_id' },
  DEALER: { seenKey: 'dealerAnnouncementSeen', idField: 'dealer_id' },
  'SUB DEALER': { seenKey: 'subDealerAnnouncementSeen', idField: 'sub_dealer_id' },
  PROMOTER: { seenKey: 'promotorAnnouncementSeen', idField: 'promotor_id' },
  SHOP: { seenKey: 'shopAnnouncementSeen', idField: 'shop_id' },
}

function NavIcon({ type = 'dot', size = 17 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  const icons = {
    chevron: <path d="m6 9 6 6 6-6" />,
    rate: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.8-4 5-6 8-6s6.2 2 8 6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M9 9h4a2 2 0 1 1 0 4h-3M9 15h6" /></>,
    menu: <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>,
    close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    dot: <circle cx="12" cy="12" r="3" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></>,
    mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    chart: <><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></>,
    box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    home: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  }
  return <svg {...common}>{icons[type] || icons.dot}</svg>
}

export default function InternalRoleNavbar({
  roleTitle = 'ADMIN',
  homePath = '/admin',
  managementItems = [],
  celebrationItems = [],
  announcementItems = [],
  coinItems = [],
  jewelleryItems = [],
  reportItems = [],
  commissionItems = [],
  actionItems = [],
}) {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState(null)
  const [openDrawerSection, setOpenDrawerSection] = useState(null)

  // ── Announcements (self-contained — same feature every internal role sees) ──
  const annMeta = ANN_ROLE_META[roleTitle] || ANN_ROLE_META.ADMIN
  const [showAnnouncements, setShowAnnouncements] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [myOwnId, setMyOwnId] = useState(null)
  const [replyAnn, setReplyAnn] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyMsg, setReplyMsg] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [repliedIds, setRepliedIds] = useState(new Set())

  useEffect(() => {
    let current = true
    api.get('/announcements/')
      .then(res => {
        if (!current) return
        const sorted = [...res.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setAnnouncements(sorted)
        const lastSeen = parseInt(localStorage.getItem(annMeta.seenKey) || '0')
        setUnreadCount(sorted.filter(a => new Date(a.created_at).getTime() > lastSeen).length)
      })
      .catch(() => {})
    api.get('/dashboard/')
      .then(res => { if (current) setMyOwnId(res.data?.[annMeta.idField] || null) })
      .catch(() => {})
    return () => { current = false }
  }, [roleTitle])

  const extractIdsFromTitle = (title) => title.match(/BB[A-Z]+\d+/g) || []
  const isCurrentUserMentioned = (title) => myOwnId && extractIdsFromTitle(title).includes(myOwnId)

  const openAnnouncements = () => {
    setShowAnnouncements(true)
    localStorage.setItem(annMeta.seenKey, Date.now().toString())
    setUnreadCount(0)
  }

  const submitReply = async () => {
    if (!replyText.trim() || !replyAnn) return
    setReplyLoading(true)
    try {
      await api.post(`/announcements/${replyAnn.id}/replies/`, { message: replyText })
      setRepliedIds(prev => new Set([...prev, replyAnn.id]))
      setReplyMsg('✅ Wish sent!')
      setReplyText('')
    } catch (err) {
      if (err.response?.data?.error === 'Already replied') {
        setRepliedIds(prev => new Set([...prev, replyAnn.id]))
        setReplyMsg('⚠️ Already sent!')
      } else {
        setReplyMsg('❌ Failed.')
      }
    }
    setReplyLoading(false)
  }

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [drawerOpen])

  const runItem = item => {
    setDrawerOpen(false)
    setActiveGroup(null)
    if (item?.action) {
      item.action()
      return
    }
    if (item?.path) navigate(item.path)
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const ROLE_SWITCH_LABELS = {
    PROMOTER: 'Retailer',
    'SUB DEALER': 'Wholesale Dealer',
    DEALER: 'Distributor',
    ADMIN: 'Super Stockist',
  }
  const currentTierLabel = ROLE_SWITCH_LABELS[roleTitle] || roleTitle

  // Automatic default items if not explicitly provided
  const ROLE_DEFAULTS = {
    ADMIN: {
      hierarchy: '/admin-hierarchy-grid',
      hierarchyLabel: 'Distributor Hierarchy',
      createLabel: 'Create Distributor',
      createPath: '/create-distributor',
    },
    DEALER: {
      hierarchy: '/dealer-hierarchy-grid',
      hierarchyLabel: 'Wholesale Dealer Hierarchy',
      createLabel: 'Create Wholesale Dealer',
      createPath: '/create-wholesale-dealer',
    },
    'SUB DEALER': {
      hierarchy: '/subdealer-hierarchy-grid',
      hierarchyLabel: 'Retailer Hierarchy',
      createLabel: 'Create Retailer',
      createPath: '/create-retailer',
    },
    PROMOTER: {
      hierarchy: '/promotor-hierarchy-grid',
      hierarchyLabel: 'Customer Hierarchy',
      createLabel: 'Create Customer',
      createPath: '/create-customer',
    },
  }

  const rDef = ROLE_DEFAULTS[roleTitle] || ROLE_DEFAULTS.ADMIN

  const finalManagementItems = managementItems && managementItems.length > 0 ? managementItems : [
    { label: 'Dashboard', path: homePath },
    { label: rDef.hierarchyLabel, path: rDef.hierarchy },
    { label: rDef.createLabel, path: rDef.createPath },
    { label: 'Create Customer', path: '/create-customer' },
  ]

  const finalCoinItems = coinItems && coinItems.length > 0 ? coinItems : [
    { label: 'Buy Coin', path: '/buy-coin' },
    { label: 'Available Coins', path: '/available-coins' },
    { label: roleTitle === 'PROMOTER' ? 'My Requests' : 'Coin Requests', path: '/coin-requests-page' },
    { label: 'Coin Transactions', path: '/coin-transactions' },
  ]

  const defaultJewelleryItems = [
    { label: roleTitle === 'SUPER ADMIN' ? 'Add Jewellery' : 'Buy Jewellery', path: '/add-jewellery' },
    { label: 'Available Jewellery', path: '/available-jewellery' },
    { label: roleTitle === 'PROMOTER' ? 'My Requests' : 'Jewellery Requests', path: '/jewellery-requests' },
    { label: roleTitle === 'SUPER ADMIN' ? 'Jewellery Transactions' : 'My Transactions', path: '/jewellery-transactions' },
  ]
  const finalJewelleryItems = jewelleryItems && jewelleryItems.length > 0 ? jewelleryItems : defaultJewelleryItems

  const finalReportItems = reportItems && reportItems.length > 0 ? reportItems : [
    { label: `${rDef.hierarchyLabel} Grid`, path: rDef.hierarchy },
    { label: 'Sales Report', path: '/sales-report' },
    { label: 'Login Active', path: '/login-active' },
    { label: 'Login Inactive', path: '/login-inactive' },
    { label: 'My Login Rewards', path: '/internal-my-login-rewards' },
    { label: 'Team Login Rewards', path: '/internal-team-login-rewards' },
  ]

  const finalCommissionItems = commissionItems && commissionItems.length > 0 ? commissionItems : [
    { label: 'My Commission', path: '/internal-my-commission' },
    { label: 'Team Commission', path: '/internal-team-commission' },
  ]

  const roleSwitchItems = currentTierLabel
    ? [
        { label: currentTierLabel, path: homePath },
        { label: 'Customer', path: '/customer' },
      ]
    : []

  const myRewardsItems = [{ label: 'AUG', path: '/recharge' }]

  // Shops have no rewards / commission / customer-role switch — only their own groups
  const isShop = roleTitle === 'SHOP'
  const groups = [
    { label: 'Management', items: finalManagementItems },
    { label: 'Announcements', items: [...announcementItems, ...celebrationItems] },
    { label: 'My Rewards', items: isShop ? [] : myRewardsItems },
    { label: 'Coins', items: finalCoinItems },
    { label: 'Jewellery', items: finalJewelleryItems },
    { label: 'Reports', items: finalReportItems },
    { label: 'Commissions', items: isShop ? [] : finalCommissionItems },
    { label: 'Role', items: isShop ? [] : roleSwitchItems },
  ].filter(group => group.items.length)

  const callerActions = actionItems && actionItems.length > 0 ? actionItems : [
    { label: 'Profile', icon: 'user', path: homePath },
    { label: 'Logout', icon: 'logout', variant: 'danger', action: logout },
  ]
  const announcementAction = { label: 'Announcements', icon: 'bell', action: openAnnouncements, badge: unreadCount }
  const actions = callerActions.some(a => a.icon === 'bell')
    ? callerActions.map(a => a.icon === 'bell' ? announcementAction : a)
    : [callerActions[0], announcementAction, ...callerActions.slice(1)]

  // ── ADVANCED GOOGLE / YOUTUBE GLOBAL SEARCH & VOICE ENGINE ──
  const [voiceQuery, setVoiceQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [voiceInterim, setVoiceInterim] = useState('')
  const [voiceStatus, setVoiceStatus] = useState('ready') // 'ready' | 'listening' | 'processing' | 'error'
  const [voiceErrorMsg, setVoiceErrorMsg] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('irn_recent_searches') || '[]')
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
      try { localStorage.setItem('irn_recent_searches', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const removeRecentSearch = (e, term) => {
    e.stopPropagation()
    setRecentSearches(prev => {
      const next = prev.filter(x => x !== term)
      try { localStorage.setItem('irn_recent_searches', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const clearRecentSearches = (e) => {
    e.stopPropagation()
    setRecentSearches([])
    try { localStorage.removeItem('irn_recent_searches') } catch {}
  }

  // Audio feedback chime (YouTube / Google style)
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
    } catch {}
  }

  // Click outside search container to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false)
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut Ctrl+K / Cmd+K / Slash to focus search
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

  // Live member / user directory debounce search
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

  // Master Search Catalog tailored for this internal role with English + Tanglish + Tamil keywords
  const SEARCH_CATALOG = useMemo(() => {
    return [
      {
        id: 'home',
        title: `${currentTierLabel} Dashboard`,
        category: 'Navigation',
        icon: 'home',
        description: `Go to ${currentTierLabel} main overview & stats`,
        path: homePath,
        keywords: ['dashboard', 'home', 'main', 'mukappu', 'dash', 'முகப்பு', 'டேஷ்போர்டு']
      },
      {
        id: 'hierarchy-grid',
        title: `${rDef.hierarchyLabel} Grid`,
        category: 'Network & Team',
        icon: 'user',
        description: 'View downline network members, hierarchy and uplines',
        path: rDef.hierarchy,
        keywords: ['hierarchy', 'grid', 'network', 'downline', 'team', 'members', 'அமைப்பு', 'டவுன்லைன்']
      },
      {
        id: 'create-downline',
        title: rDef.createLabel,
        category: 'Management',
        icon: 'user',
        description: `Onboard a new ${rDef.createLabel.replace('Create ', '')}`,
        path: rDef.createPath,
        keywords: ['create', 'add member', 'new account', 'register', 'பதிவு']
      },
      {
        id: 'create-customer',
        title: 'Create Customer',
        category: 'Management',
        icon: 'user',
        description: 'Register a new customer under your hierarchy',
        path: '/create-customer',
        keywords: ['create customer', 'new customer', 'add customer', 'வாடிக்கையாளர்']
      },
      {
        id: 'buy-coin',
        title: 'Buy AUG Coins',
        category: 'Coins & Wallet',
        icon: 'coin',
        description: 'Purchase or top up AUG Coins',
        path: '/buy-coin',
        keywords: ['buy coin', 'aug coin', 'coins', 'top up', 'recharge', 'நாணயம்', 'வாங்கு']
      },
      {
        id: 'available-coins',
        title: 'Available Coins',
        category: 'Coins & Wallet',
        icon: 'coin',
        description: 'Check available AUG Coin balances & stored stash',
        path: '/available-coins',
        keywords: ['available coin', 'coin balance', 'stored coins', 'இருப்பு']
      },
      {
        id: 'coin-requests',
        title: roleTitle === 'PROMOTER' ? 'My Coin Requests' : 'Coin Requests',
        category: 'Coins & Wallet',
        icon: 'coin',
        description: 'Review pending coin transfer requests and approvals',
        path: '/coin-requests-page',
        keywords: ['coin request', 'coin requests', 'request coin', 'approval', 'கோரிக்கை']
      },
      {
        id: 'coin-transactions',
        title: 'Coin Transactions',
        category: 'Coins & Wallet',
        icon: 'coin',
        description: 'Complete ledger of coin credits, debits and rewards',
        path: '/coin-transactions',
        keywords: ['coin transaction', 'coin history', 'ledger', 'பரிவர்த்தனை']
      },
      {
        id: 'jewellery',
        title: roleTitle === 'SUPER ADMIN' ? 'Add Jewellery' : 'Available Jewellery',
        category: 'Jewellery & Gold',
        icon: 'rate',
        description: 'Explore live gold & silver jewellery catalog',
        path: '/available-jewellery',
        keywords: ['jewellery', 'gold jewellery', 'silver jewellery', 'ornaments', 'நகைகள்', 'நகை']
      },
      {
        id: 'jewellery-requests',
        title: roleTitle === 'PROMOTER' ? 'My Jewellery Requests' : 'Jewellery Requests',
        category: 'Jewellery & Gold',
        icon: 'rate',
        description: 'Jewellery booking approvals and dispatch requests',
        path: '/jewellery-requests',
        keywords: ['jewellery request', 'order request', 'jewellery orders']
      },
      {
        id: 'sales-report',
        title: 'Sales Report',
        category: 'Reports & Analytics',
        icon: 'chart',
        description: 'Detailed revenue, team performance and turnover reports',
        path: '/sales-report',
        keywords: ['sales report', 'report', 'sales', 'turnover', 'revenue', 'விற்பனை', 'அறிக்கை']
      },
      {
        id: 'login-active',
        title: 'Login Active Users',
        category: 'Reports & Analytics',
        icon: 'user',
        description: 'Real-time online active network users',
        path: '/login-active',
        keywords: ['login active', 'active users', 'online members', 'ஆன்லைன்']
      },
      {
        id: 'login-inactive',
        title: 'Login Inactive Users',
        category: 'Reports & Analytics',
        icon: 'user',
        description: 'Members currently inactive or awaiting login',
        path: '/login-inactive',
        keywords: ['login inactive', 'inactive users', 'offline']
      },
      {
        id: 'my-login-rewards',
        title: 'My Login Rewards',
        category: 'Reports & Analytics',
        icon: 'coin',
        description: 'Personal daily login streak rewards & bonuses',
        path: '/internal-my-login-rewards',
        keywords: ['login rewards', 'my rewards', 'streak', 'போனஸ்']
      },
      {
        id: 'team-login-rewards',
        title: 'Team Login Rewards',
        category: 'Reports & Analytics',
        icon: 'coin',
        description: 'Downline team login participation and rewards',
        path: '/internal-team-login-rewards',
        keywords: ['team login rewards', 'team rewards']
      },
      {
        id: 'my-commission',
        title: 'My Commission',
        category: 'Commissions',
        icon: 'chart',
        description: 'Your direct personal earnings, sales cut and payouts',
        path: '/internal-my-commission',
        keywords: ['my commission', 'commission', 'earnings', 'varumanam', 'கம்மிஷன்', 'வருமானம்']
      },
      {
        id: 'team-commission',
        title: 'Team Commission',
        category: 'Commissions',
        icon: 'chart',
        description: 'Override commissions generated from downline team sales',
        path: '/internal-team-commission',
        keywords: ['team commission', 'override', 'downline commission']
      },
      {
        id: 'announcements',
        title: 'Announcements',
        category: 'Updates & Alerts',
        icon: 'bell',
        description: 'View corporate news, congratulations & replies',
        action: openAnnouncements,
        keywords: ['announcement', 'announcements', 'news', 'notices', 'alerts', 'செய்திகள்', 'அறிவிப்பு']
      },
      {
        id: 'today-rates',
        title: 'Today Gold & Silver Rates',
        category: 'Live Market',
        icon: 'rate',
        description: 'Live 22K/24K gold and silver market prices',
        path: homePath,
        keywords: ['gold rate', 'rate', 'gold price', 'metal price', 'today rate', 'thangam', 'thangam rate', 'thanga vilai', 'rate evlo', 'silver', '22k', '24k', 'தங்க விலை', 'தங்கம்']
      },
    ]
  }, [roleTitle, currentTierLabel, homePath, rDef])

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

    // 2. Fallback check for user/member in backend
    try {
      const res = await api.get(`/users/search/?q=${encodeURIComponent(raw)}`)
      const found = res.data?.results || res.data || []
      if (Array.isArray(found) && found.length > 0) {
        navigate(`${rDef.hierarchy}?search=${encodeURIComponent(raw)}`)
        return
      }
    } catch {}

    // 3. Partial match
    if (bestMatch) {
      if (bestMatch.action) {
        bestMatch.action()
      } else if (bestMatch.path) {
        navigate(bestMatch.path)
      }
      return
    }

    // Default to hierarchy search if nothing else
    navigate(`${rDef.hierarchy}?search=${encodeURIComponent(raw)}`)
  }

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
    } catch {
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

  const handleInputChange = (e) => {
    setVoiceQuery(e.target.value)
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
      } else if (voiceQuery.trim()) {
        executeSearch(voiceQuery)
      }
    }
  }

  return (
    <>
      <style>{`
        .irn-top, .irn-top * { box-sizing: border-box; }
        .irn-top {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 900;
          background: rgba(255, 255, 255, 0.98);
          border-bottom: 1px solid rgba(7, 59, 63, 0.08);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 16px rgba(7, 59, 63, 0.03);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .irn-top-spacer {
          height: 74px;
        }
        .irn-inner {
          height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(10px, 1.4vw, 24px);
          gap: clamp(6px, 0.8vw, 14px);
          width: 100%;
          box-sizing: border-box;
          max-width: 100%;
        }

        /* ── BRAND LOGO & TITLE (Matching SuperAdminNavbar) ── */
        .irn-nav-left { display: flex; align-items: center; flex-shrink: 0; min-width: 0; }
        .san-navbar-brand { border: 0; background: transparent; display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; text-decoration: none; transition: opacity 0.15s ease; flex-shrink: 0; }
        .san-navbar-brand:hover { opacity: 0.88; }
        .san-brand-logo-wrap { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 9px; background: rgba(7, 59, 63, 0.04); padding: 3px; flex-shrink: 0; border: 1px solid rgba(187, 137, 88, 0.2); }
        .san-brand-logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .san-brand-text { display: flex; flex-direction: column; line-height: 1; text-align: left; }
        .san-brand-title { font-family: Georgia, 'Times New Roman', serif; font-size: clamp(16px, 1.15vw, 19px); font-weight: 850; letter-spacing: 0.03em; color: #073B3F; }
        .san-brand-badge { font-size: 8px; font-weight: 850; letter-spacing: 0.16em; color: #BB8958; margin-top: 3px; text-transform: uppercase; }
        .san-brand-divider { width: 1px; height: 24px; background: rgba(7, 59, 63, 0.1); margin: 0 clamp(6px, 0.8vw, 14px); flex-shrink: 0; }

        /* ── SEARCH BLOCK ── */
        .san-search-block { position: relative; width: clamp(130px, 10vw, 200px); transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1); flex-shrink: 1; }
        .san-search-block.is-focused, .san-search-block:focus-within { width: clamp(170px, 14vw, 260px); }
        .san-search { height: 38px; width: 100%; border: 1px solid #DFE7E5; border-radius: 10px; background: #F7FAF9; display: flex; align-items: center; gap: 8px; padding: 0 6px 0 11px; font-size: 13px; font-weight: 500; transition: all 0.18s ease; }
        .san-search-block.is-focused .san-search, .san-search:focus-within { border-color: #073B3F; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(7, 59, 63, 0.08); }
        .san-search-icon-wrap { display: flex; align-items: center; color: #718280; flex-shrink: 0; cursor: pointer; }
        .san-search-input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: #073B3F; font-size: 13px; font-weight: 500; font-family: inherit; }
        .san-search-input::placeholder { color: #8C9E9B; font-weight: 450; }
        .san-search-clear-btn { background: transparent; border: 0; color: #8C9E9B; cursor: pointer; padding: 3px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .san-search-clear-btn:hover { background: #E5EBEA; color: #073B3F; }
        .san-mic-btn { flex-shrink: 0; width: 28px; height: 28px; border-radius: 7px; border: 1px solid transparent; background: transparent; color: #556B68; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
        .san-mic-btn:hover { background: #EAF0EE; color: #073B3F; }
        .san-mic-btn.is-listening { background: #DC2626; color: #FFFFFF; animation: san-mic-pulse 1.1s ease-in-out infinite; }
        @keyframes san-mic-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,32,53,.5); } 50% { box-shadow: 0 0 0 8px rgba(201,32,53,0); } }

        /* ── SUGGESTIONS DROPDOWN ── */
        .san-suggestions-dropdown { position: absolute; top: calc(100% + 8px); left: 0; width: max(100%, 360px); max-width: 440px; max-height: 460px; overflow-y: auto; background: #FFFFFF; border: 1.5px solid rgba(189,207,206,.9); border-radius: 18px; box-shadow: 0 20px 48px rgba(7,59,63,.18), 0 4px 12px rgba(0,0,0,.06); z-index: 1200; padding: 10px; display: flex; flex-direction: column; gap: 8px; animation: sanDropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
        @media (max-width: 640px) { .san-suggestions-dropdown { width: 100%; max-width: 100%; } }
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
        .san-sug-row-top { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
        .san-sug-title { font-size: 13.5px; font-weight: 750; color: #073B3F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .san-sug-badge { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; padding: 2px 6px; border-radius: 6px; background: rgba(12,64,68,0.08); color: #0C4044; flex-shrink: 0; }
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

        /* ── YOUTUBE / GOOGLE VOICE SEARCH MODAL ── */
        .san-voice-overlay { position: fixed; inset: 0; background: rgba(17, 24, 23, 0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 2500; display: flex; align-items: center; justify-content: center; padding: 20px; animation: sanVoiceFadeIn 0.2s ease-out; }
        @keyframes sanVoiceFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .san-voice-card { background: #FFFFFF; border-radius: 24px; box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25); width: 100%; max-width: 500px; padding: 32px 28px 36px; display: flex; flex-direction: column; align-items: center; gap: 24px; position: relative; animation: sanVoiceSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes sanVoiceSlideUp { from { transform: translateY(18px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        .san-voice-header { width: 100%; display: flex; align-items: center; justify-content: space-between; }
        .san-voice-title { font-family: Georgia, 'Times New Roman', serif; font-size: 23px; font-weight: 850; color: #073B3F; margin: 0; letter-spacing: -0.01em; }
        .san-voice-close-btn { background: transparent; border: 0; color: #53615F; cursor: pointer; padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all .15s ease; }
        .san-voice-close-btn:hover { background: #F0F4F4; color: #073B3F; }
        .san-voice-transcript-box { min-height: 84px; display: flex; align-items: center; justify-content: center; text-align: center; width: 100%; padding: 0 10px; }
        .san-voice-transcript-active { font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 850; color: #073B3F; line-height: 1.35; }
        .san-voice-transcript-idle { color: #7A8987; font-size: 19px; font-weight: 600; font-family: inherit; }
        .san-voice-mic-wrap { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin: 4px 0; }
        .san-voice-ripple { position: absolute; inset: 0; border-radius: 50%; border: 2.5px solid rgba(201, 32, 53, 0.35); animation: sanVoicePulse 2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite; }
        .san-voice-ripple.ripple-2 { animation-delay: 0.75s; border-color: rgba(201, 32, 53, 0.2); }
        @keyframes sanVoicePulse { 0% { transform: scale(0.9); opacity: 0.9; } 100% { transform: scale(1.85); opacity: 0; } }
        .san-voice-mic-main { width: 78px; height: 78px; border-radius: 50%; border: 0; background: #C92035; color: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 28px rgba(201, 32, 53, 0.35); transition: all .2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; z-index: 2; }
        .san-voice-mic-main:hover { transform: scale(1.06); box-shadow: 0 14px 34px rgba(201, 32, 53, 0.45); }
        .san-voice-mic-main:not(.is-active) { background: #073B3F; box-shadow: 0 10px 28px rgba(7, 59, 63, 0.28); }
        .san-voice-status-sub { font-size: 13px; color: #7A8987; font-weight: 700; margin-top: -6px; }

        /* ── DESKTOP CENTER NAVIGATION (SuperAdmin Style) ── */
        .san-menu-center { display: flex; align-items: center; justify-content: center; gap: clamp(3px, 0.45vw, 8px); flex: 1 1 auto; min-width: 0; }
        .san-menu-group { position: relative; display: flex; align-items: center; flex-shrink: 0; }
        .san-menu-trigger { border: 1px solid transparent; background: transparent; padding: 6px clamp(5px, 0.45vw, 10px); border-radius: 9px; color: #263836; font-family: inherit; font-size: clamp(12px, 0.78vw, 13.5px); font-weight: 600; display: flex; align-items: center; gap: 5px; cursor: pointer; white-space: nowrap; transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1); user-select: none; }
        .san-menu-trigger:hover { background: rgba(7, 59, 63, 0.05); color: #073B3F; border-color: rgba(7, 59, 63, 0.08); }
        .san-menu-trigger.is-active, .san-menu-group.is-open .san-menu-trigger { background: #073B3F; color: #FFFFFF; border-color: #073B3F; box-shadow: 0 4px 14px rgba(7, 59, 63, 0.15); }
        .san-menu-trigger.is-aug { background: rgba(204, 168, 129, 0.15); color: #8C5E28; font-weight: 750; border-color: rgba(204, 168, 129, 0.35); }
        .san-menu-trigger.is-aug:hover { background: rgba(204, 168, 129, 0.28); color: #6C4212; }
        .san-menu-trigger-chevron { display: flex; align-items: center; color: #8C9E9B; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease; }
        .san-menu-group.is-open .san-menu-trigger-chevron { color: #E5BF91; transform: rotate(180deg); }

        /* ── SAAS POPUP DROPDOWN (Matching SuperAdminNavbar) ── */
        .san-menu-dropdown { position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%) translateY(4px); min-width: 220px; max-width: 280px; background: #FFFFFF; border: 1.5px solid rgba(7, 59, 63, 0.1); border-radius: 12px; box-shadow: 0 16px 38px rgba(7, 59, 63, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04); padding: 6px; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.16s ease, transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.16s ease; z-index: 1000; }
        .san-menu-group:hover .san-menu-dropdown, .san-menu-group.is-open .san-menu-dropdown { opacity: 1; visibility: visible; pointer-events: auto; transform: translateX(-50%) translateY(0); }
        .san-menu-dropdown-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px 8px; border-bottom: 1px solid rgba(7, 59, 63, 0.06); margin-bottom: 4px; }
        .san-menu-dropdown-tag { font-size: 11px; font-weight: 750; color: #073B3F; letter-spacing: 0.03em; text-transform: uppercase; }
        .san-menu-dropdown-count { font-size: 10px; font-weight: 600; color: #8C9E9B; }
        .san-menu-dropdown-list { display: flex; flex-direction: column; gap: 2px; }
        .san-menu-link { width: 100%; border: 0; background: transparent; padding: 8px 10px; border-radius: 8px; text-align: left; color: #273735; font-size: 13px; font-weight: 600; font-family: inherit; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.14s ease; }
        .san-menu-link:hover { background: #F2F7F6; color: #073B3F; transform: translateX(2px); }
        .san-menu-link-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .san-menu-link-arrow { color: #8C9E9B; font-size: 13px; line-height: 1; transition: transform 0.14s ease; }
        .san-menu-link:hover .san-menu-link-arrow { color: #073B3F; transform: translateX(2px); }
        .san-badge-pill { min-width: 17px; height: 17px; border-radius: 999px; background: #C92035; color: #FFFFFF; font-size: 9.5px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; }

        /* ── RIGHT ACTIONS (Matching SuperAdminNavbar) ── */
        .san-actions-right { display: flex; align-items: center; gap: clamp(6px, 0.7vw, 12px); flex-shrink: 0; }
        .san-bell-btn { position: relative; width: 38px; height: 38px; border-radius: 10px; border: 1px solid #DFE7E5; background: #F7FAF9; color: #0C4044; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.16s ease; }
        .san-bell-btn:hover { background: #EAEFEF; border-color: #0C4044; }
        .san-bell-badge { position: absolute; top: -3px; right: -3px; min-width: 18px; height: 18px; border-radius: 999px; background: #C92035; color: #FFFFFF; font-size: 9.5px; font-weight: 850; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 2px solid #FFFFFF; }
        .san-util-divider { width: 1px; height: 22px; background: rgba(7, 59, 63, 0.1); margin: 0 2px; }
        .san-logout-link { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; border: 1px solid #DFE7E5; background: #F7FAF9; color: #556664; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.16s ease; }
        .san-logout-link:hover { background: #FEE2E2; color: #DC2626; border-color: #FCA5A5; }
        .san-hamburger { display: none; width: 38px; height: 38px; border-radius: 10px; border: 1px solid #DFE7E5; background: #F7FAF9; color: #0C4044; align-items: center; justify-content: center; cursor: pointer; }

        @media (max-width: 1100px) {
          .san-menu-center { display: none !important; }
          .san-hamburger { display: flex !important; }
          .san-logout-link { display: none !important; }
        }

        @media (max-width: 580px) {
          .irn-inner {
            padding: 8px 12px;
            gap: 8px;
          }
          .irn-top-spacer {
            height: 64px;
          }
          .irn-brand img {
            width: 35px;
            height: 35px;
          }
          .irn-brand strong {
            font-size: 18px;
          }
          .irn-brand small {
            font-size: 7.5px;
            letter-spacing: 0.18em;
          }
          .irn-mobile-menu-btn {
            height: 34px;
            padding: 0 10px;
            font-size: 11px;
            gap: 5px;
          }
          .irn-mobile-menu-btn span {
            display: inline;
          }
        }

        /* ── MOBILE DRAWER OVERLAY & PANEL ── */
        .irn-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(7, 59, 63, 0.48);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 9998;
          animation: irnFadeIn 0.2s ease;
        }
        @keyframes irnFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .irn-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(340px, 86vw);
          background: #FFFFFF;
          z-index: 9999;
          box-shadow: -12px 0 45px rgba(7, 59, 63, 0.18);
          display: flex;
          flex-direction: column;
          animation: irnSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        @keyframes irnSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .irn-drawer-head {
          padding: 16px 20px;
          background: #F8FAFA;
          border-bottom: 1px solid #E1EBEA;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .irn-drawer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .irn-drawer-brand img {
          width: 36px;
          height: 36px;
          object-fit: contain;
        }
        .irn-drawer-brand strong {
          display: block;
          font-family: Georgia, serif;
          font-size: 19px;
          font-weight: 900;
          color: #073B3F;
          line-height: 1;
        }
        .irn-drawer-brand small {
          display: block;
          margin-top: 3px;
          color: #BB8958;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .irn-drawer-close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #D1DFDE;
          background: #FFFFFF;
          color: #073B3F;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .irn-drawer-close:hover {
          background: #FEE2E2;
          border-color: #F87171;
          color: #DC2626;
        }

        .irn-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          -webkit-overflow-scrolling: touch;
        }

        .irn-drawer-aug-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(204,168,129,0.18), rgba(204,168,129,0.06));
          border: 1.5px solid rgba(204,168,129,0.4);
          color: #8C5E28;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .irn-drawer-aug-btn:hover {
          background: rgba(204,168,129,0.28);
          transform: translateX(2px);
        }

        .irn-drawer-section {
          border-radius: 12px;
          border: 1px solid #E6EEED;
          background: #FAFBFB;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .irn-drawer-section.is-open {
          border-color: #0C4044;
          background: #FFFFFF;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.05);
        }
        .irn-drawer-section-head {
          width: 100%;
          padding: 12px 14px;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          font-family: Georgia, serif;
          font-size: 13px;
          font-weight: 850;
          text-transform: uppercase;
          color: #073B3F;
        }
        .irn-drawer-chevron {
          transition: transform 0.2s ease;
          display: flex;
          align-items: center;
          color: #5C706E;
        }
        .irn-drawer-chevron.rotated {
          transform: rotate(180deg);
          color: #073B3F;
        }

        .irn-drawer-sublist {
          padding: 4px 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          border-top: 1px solid #EDF3F2;
        }
        .irn-drawer-link {
          width: 100%;
          padding: 9px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #2D3E3C;
          font-size: 12.5px;
          font-weight: 650;
          cursor: pointer;
          text-align: left;
          transition: all 0.14s ease;
        }
        .irn-drawer-link:hover {
          background: #EDF3F1;
          color: #073B3F;
          transform: translateX(3px);
        }
        .irn-drawer-arrow {
          color: #8C9E9C;
          font-size: 12px;
        }

        .irn-drawer-foot {
          padding: 14px 16px;
          border-top: 1px solid #E1EBEA;
          background: #F8FAFA;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .irn-drawer-foot-btn {
          width: 100%;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #D1DFDE;
          background: #FFFFFF;
          color: #073B3F;
          font-size: 12px;
          font-weight: 750;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          cursor: pointer;
        }
        .irn-drawer-foot-btn:hover {
          background: #EDF3F1;
        }
        .irn-drawer-logout-btn {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          border: none;
          background: #C92035;
          color: #FFFFFF;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 4px 14px rgba(201, 32, 53, 0.22);
        }
        .irn-drawer-logout-btn:hover {
          background: #A81628;
        }

        /* ── PREMIUM ANNOUNCEMENTS POPUP ── */
        .irn-ann-overlay {
          position: fixed;
          inset: 0;
          background: rgba(7, 24, 26, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 10100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: irnFadeIn 0.2s ease;
        }
        .irn-ann-modal {
          width: 100%;
          max-width: 560px;
          max-height: 85vh;
          background: linear-gradient(180deg, #FDFDFC 0%, #FBFAF7 100%);
          border: 1px solid rgba(204, 168, 129, 0.4);
          border-radius: 22px;
          box-shadow: 0 40px 100px rgba(7, 45, 48, 0.4);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: irnSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes irnSlideUp {
          from { transform: translateY(24px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .irn-ann-top-accent {
          height: 4px;
          width: 100%;
          background: linear-gradient(90deg, #073B3F, #CCA881 35%, #E5C378 55%, #073B3F);
          background-size: 200% 100%;
          animation: role-drawer-accent-shift 6s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes role-drawer-accent-shift {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 0%; }
        }
        .irn-ann-head {
          flex-shrink: 0;
          padding: 22px 26px;
          border-bottom: 1px solid rgba(204, 168, 129, 0.3);
          background: radial-gradient(120% 100% at 0% 0%, rgba(204,168,129,0.10), transparent 55%);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .irn-ann-head-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .irn-ann-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(145deg, #073B3F, #0C4E53);
          border: 1px solid rgba(204, 168, 129, 0.55);
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.22);
          display: grid;
          place-items: center;
          font-size: 19px;
          flex-shrink: 0;
        }
        .irn-ann-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #073B3F;
          text-transform: uppercase;
        }
        .irn-ann-sub {
          font-size: 11px;
          color: #7A8987;
          margin-top: 3px;
        }
        .irn-ann-close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(201, 32, 53, 0.3);
          background: rgba(201, 32, 53, 0.06);
          color: #C92035;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }
        .irn-ann-close:hover {
          background: #C92035;
          color: #FFFFFF;
          transform: rotate(90deg);
        }
        .irn-ann-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px 26px 26px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          -webkit-overflow-scrolling: touch;
        }
        .irn-ann-empty {
          text-align: center;
          color: #7A8987;
          padding: 60px 0;
          font-size: 14px;
        }
        .irn-ann-card {
          background: #FFFFFF;
          border: 1px solid rgba(209, 223, 222, 0.6);
          border-radius: 16px;
          padding: 16px 18px;
          box-shadow: 0 1px 2px rgba(7, 59, 63, 0.04);
          transition: all 0.2s ease;
        }
        .irn-ann-card.is-latest {
          background: linear-gradient(135deg, rgba(7,59,63,0.05), rgba(204,168,129,0.08));
          border-color: rgba(204, 168, 129, 0.5);
        }
        .irn-ann-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .irn-ann-card-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .irn-ann-new-badge {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 3px 9px;
          border-radius: 999px;
          background: linear-gradient(135deg, #9F6130, #CCA881);
          color: #FDFBF5;
          box-shadow: 0 2px 6px rgba(159, 97, 48, 0.28);
          flex-shrink: 0;
        }
        .irn-ann-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 700;
          font-size: 14.5px;
          color: #073B3F;
        }
        .irn-ann-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .irn-ann-date {
          font-size: 10px;
          color: #9AA7A5;
          white-space: nowrap;
        }
        .irn-ann-reply-btn {
          padding: 5px 13px;
          font-size: 10.5px;
          font-weight: 700;
          border-radius: 999px;
          cursor: pointer;
          background: rgba(7, 59, 63, 0.08);
          border: 1px solid rgba(7, 59, 63, 0.25);
          color: #073B3F;
          white-space: nowrap;
          transition: all 0.18s ease;
        }
        .irn-ann-reply-btn:hover:not(:disabled) {
          background: #073B3F;
          color: #FFFFFF;
        }
        .irn-ann-reply-btn:disabled {
          background: transparent;
          border-color: rgba(209, 223, 222, 0.6);
          color: #9AA7A5;
          cursor: not-allowed;
        }
        .irn-ann-card-msg {
          color: #4A5A58;
          font-size: 13px;
          line-height: 1.6;
          margin: 0;
        }
        .irn-ann-mentioned {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 700;
          color: #9F6130;
          background: rgba(204, 168, 129, 0.14);
          border: 1px solid rgba(204, 168, 129, 0.4);
          padding: 4px 12px;
          border-radius: 999px;
        }

        /* ── REPLY MODAL ── */
        .irn-reply-overlay {
          position: fixed;
          inset: 0;
          background: rgba(7, 24, 26, 0.65);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 10200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .irn-reply-modal {
          width: 100%;
          max-width: 440px;
          background: #FDFDFC;
          border: 1px solid rgba(204, 168, 129, 0.4);
          border-radius: 20px;
          box-shadow: 0 40px 100px rgba(7, 45, 48, 0.4);
          padding: 26px;
          animation: irnSlideUp 0.25s ease;
        }
        .irn-reply-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
        }
        .irn-reply-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 15px;
          font-weight: 700;
          color: #073B3F;
        }
        .irn-reply-target {
          font-size: 11px;
          color: #7A8987;
          margin-top: 5px;
        }
        .irn-reply-msg {
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          margin-bottom: 14px;
        }
        .irn-reply-textarea {
          width: 100%;
          background: #FFFFFF;
          border: 1px solid #D9E4E3;
          border-radius: 12px;
          padding: 12px 14px;
          color: #111817;
          font-size: 13.5px;
          outline: none;
          resize: vertical;
          font-family: inherit;
          line-height: 1.6;
          box-sizing: border-box;
        }
        .irn-reply-textarea:focus {
          border-color: #073B3F;
        }
        .irn-reply-send-btn {
          margin-top: 14px;
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 12px;
          font-weight: 800;
          font-size: 13.5px;
          color: #FFFFFF;
          background: linear-gradient(135deg, #073B3F, #0C4E53);
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .irn-reply-send-btn:disabled {
          background: rgba(7, 59, 63, 0.2);
          color: #073B3F;
          cursor: not-allowed;
        }
      `}</style>

      <header className="irn-top">
        <div className="irn-inner">
          {/* ── BRAND LOGO & TITLE (Matching SuperAdminNavbar) ── */}
          <div className="irn-nav-left">
            <button
              className="san-navbar-brand"
              type="button"
              onClick={() => navigate(homePath)}
              title="Go to dashboard"
            >
              <div className="san-brand-logo-wrap">
                <img src={logo} alt="Athirai" />
              </div>
              <div className="san-brand-text">
                <span className="san-brand-title">ATHIRAI</span>
                <span className="san-brand-badge">{currentTierLabel}</span>
              </div>
            </button>
            <div className="san-brand-divider" />

            {/* Quick Search & Voice Bar */}
            <div
              className={`san-search-block ${isSearchFocused || showSuggestions ? 'is-focused' : ''}`}
              ref={searchContainerRef}
            >
              <div className="san-search">
                <span className="san-search-icon-wrap" onClick={() => searchInputRef.current?.focus()}>
                  <NavIcon type="search" size={15} />
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
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <NavIcon type="close" size={13} />
                  </button>
                )}
                <button
                  type="button"
                  className={`san-mic-btn ${isListening ? 'is-listening' : ''}`}
                  onClick={startVoiceModal}
                  title="Search with Voice"
                  aria-label="Voice search"
                >
                  <NavIcon type="mic" size={15} />
                </button>
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && (
                <div className="san-suggestions-dropdown" role="listbox">
                  {/* Recent Searches */}
                  {!voiceQuery && recentSearches.length > 0 && (
                    <div className="san-sug-section">
                      <div className="san-sug-head">
                        <span><NavIcon type="clock" size={13} /> Recent Searches</span>
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
                              <NavIcon type="clock" size={14} />
                              <span>{term}</span>
                            </div>
                            <button
                              type="button"
                              className="san-recent-del"
                              onClick={(e) => removeRecentSearch(e, term)}
                              title="Remove"
                            >
                              <NavIcon type="close" size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation & Feature Matches */}
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
                            <NavIcon type={item.icon || 'box'} size={15} />
                          </div>
                          <div className="san-sug-row-body">
                            <div className="san-sug-row-top">
                              <span className="san-sug-title">{item.title}</span>
                              <span className="san-sug-badge">{item.category}</span>
                            </div>
                            <small className="san-sug-desc">{item.description}</small>
                          </div>
                          <span className="san-sug-arrow">
                            <NavIcon type="arrowRight" size={13} />
                          </span>
                        </button>
                      )
                    })}

                    {voiceQuery && getDisplaySuggestions().length === 0 && apiUsers.length === 0 && !isSearchingApi && (
                      <div className="san-sug-empty">
                        <p>No exact match for "<b>{voiceQuery}</b>"</p>
                        <small>Press <b>Enter</b> to run search or tap the <b>Mic</b> to speak.</small>
                      </div>
                    )}
                  </div>

                  {/* Live User / Member Matches */}
                  {apiUsers.length > 0 && (
                    <div className="san-sug-section">
                      <div className="san-sug-head">
                        <span><NavIcon type="user" size={13} /> People & Accounts</span>
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
                            navigate(`${rDef.hierarchy}?search=${encodeURIComponent(u.username || u.phone || u.name || '')}`)
                          }}
                        >
                          <div className="san-sug-row-icon user-icon">
                            <NavIcon type="user" size={15} />
                          </div>
                          <div className="san-sug-row-body">
                            <div className="san-sug-row-top">
                              <span className="san-sug-title">{u.name || u.username || 'User'}</span>
                              <span className="san-sug-badge user-badge">{u.role || 'Member'}</span>
                            </div>
                            <small className="san-sug-desc">{u.phone || u.email || `ID: ${u.id}`}</small>
                          </div>
                          <span className="san-sug-arrow">
                            <NavIcon type="arrowRight" size={13} />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Footer Shortcut Tip */}
                  <div className="san-sug-footer">
                    <span>↑↓ navigate • ↵ select • ESC close</span>
                    <button
                      type="button"
                      className="san-sug-footer-voice"
                      onClick={() => { setShowSuggestions(false); startVoiceModal() }}
                    >
                      <NavIcon type="mic" size={13} /> Speak
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── DESKTOP MENU (SuperAdmin Styling) ── */}
          <nav className="san-menu-center" aria-label="Main Navigation">
            {groups.map(group => (
              group.label === 'My Rewards' ? (
                <button
                  key={group.label}
                  type="button"
                  className="san-menu-trigger is-aug"
                  onClick={() => runItem(group.items[0])}
                  title="AUG Coin Quick Recharge"
                >
                  🪙 <span className="san-menu-trigger-text">{group.items[0].label}</span>
                </button>
              ) : (
                <div
                  className={`san-menu-group ${activeGroup === group.label ? 'is-open' : ''}`}
                  key={group.label}
                  onMouseEnter={() => setActiveGroup(group.label)}
                  onMouseLeave={() => setActiveGroup(null)}
                >
                  <button
                    className={`san-menu-trigger ${activeGroup === group.label ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setActiveGroup(curr => curr === group.label ? null : group.label)}
                    aria-expanded={activeGroup === group.label}
                  >
                    <span className="san-menu-trigger-text">{group.label}</span>
                    <svg className={`san-menu-trigger-chevron ${activeGroup === group.label ? 'is-rotated' : ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  <div className="san-menu-dropdown">
                    <div className="san-menu-dropdown-header">
                      <span className="san-menu-dropdown-tag">{group.label}</span>
                      <span className="san-menu-dropdown-count">{group.items.length} items</span>
                    </div>
                    <div className="san-menu-dropdown-list">
                      {group.items.map(item => (
                        <button
                          key={item.label}
                          type="button"
                          className="san-menu-link"
                          onClick={() => runItem(item)}
                        >
                          <span className="san-menu-link-title">{item.label}</span>
                          {item.badge ? (
                            <span className="san-badge-pill">{item.badge > 99 ? '99+' : item.badge}</span>
                          ) : (
                            <span className="san-menu-link-arrow">→</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ))}
          </nav>

          {/* ── RIGHT ACTIONS (Matching SuperAdminNavbar) ── */}
          <div className="san-actions-right">
            <button
              className="san-bell-btn"
              type="button"
              title="Announcements"
              onClick={openAnnouncements}
            >
              <NavIcon type="bell" size={17} />
              {unreadCount > 0 && (
                <span className="san-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            <div className="san-util-divider" />

            <button className="san-logout-link" type="button" onClick={logout} title="Sign Out">
              <NavIcon type="logout" size={14} />
              <span>Logout</span>
            </button>

            <button
              className="san-hamburger"
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <NavIcon type="menu" size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="irn-top-spacer" />

      {/* ── MOBILE & TABLET SLIDE-IN DRAWER ── */}
      {drawerOpen && (
        <>
          <div
            className="irn-drawer-overlay"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="irn-drawer" role="dialog" aria-label="Mobile Navigation">
            {/* Drawer Header */}
            <div className="irn-drawer-head">
              <div className="irn-drawer-brand">
                <img src={logo} alt="Athirai" />
                <div>
                  <strong>ATHIRAI</strong>
                  <small>{currentTierLabel}</small>
                </div>
              </div>
              <button
                className="irn-drawer-close"
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <NavIcon type="close" size={17} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="irn-drawer-body">
              {groups.map(group => {
                if (group.label === 'My Rewards') {
                  return (
                    <button
                      key={group.label}
                      type="button"
                      className="irn-drawer-aug-btn"
                      onClick={() => { setDrawerOpen(false); runItem(group.items[0]) }}
                    >
                      <span>🪙 {group.items[0].label}</span>
                      <span className="irn-drawer-arrow">→</span>
                    </button>
                  )
                }

                const isExpanded = openDrawerSection === group.label
                return (
                  <div className={`irn-drawer-section ${isExpanded ? 'is-open' : ''}`} key={group.label}>
                    <button
                      type="button"
                      className="irn-drawer-section-head"
                      onClick={() => setOpenDrawerSection(prev => prev === group.label ? null : group.label)}
                    >
                      <span>{group.label}</span>
                      <span className={`irn-drawer-chevron ${isExpanded ? 'rotated' : ''}`}>
                        <NavIcon type="chevron" size={14} />
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="irn-drawer-sublist">
                        {group.items.map(item => (
                          <button
                            key={item.label}
                            type="button"
                            className="irn-drawer-link"
                            onClick={() => { setDrawerOpen(false); runItem(item) }}
                          >
                            <span>{item.label}</span>
                            {item.badge ? (
                              <span className="irn-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                            ) : (
                              <span className="irn-drawer-arrow">↗</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="irn-drawer-foot">
              {actions.filter(a => a.variant !== 'danger').map(item => (
                <button
                  key={item.label}
                  type="button"
                  className="irn-drawer-foot-btn"
                  onClick={() => {
                    setDrawerOpen(false)
                    item.action ? item.action() : (item.path ? navigate(item.path) : logout())
                  }}
                >
                  <NavIcon type={item.icon || 'dot'} size={16} />
                  <span>{item.label}</span>
                  {item.badge ? <span className="irn-badge">{item.badge}</span> : null}
                </button>
              ))}
              <button
                type="button"
                className="irn-drawer-logout-btn"
                onClick={() => { setDrawerOpen(false); logout() }}
              >
                <NavIcon type="logout" size={17} />
                <span>LOGOUT</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── PREMIUM ANNOUNCEMENTS POPUP ── */}
      {showAnnouncements && (
        <div className="irn-ann-overlay" onClick={() => setShowAnnouncements(false)}>
          <div className="irn-ann-modal" onClick={e => e.stopPropagation()}>
            <div className="irn-ann-top-accent" />
            <div className="irn-ann-head">
              <div className="irn-ann-head-left">
                <div className="irn-ann-icon">📢</div>
                <div>
                  <div className="irn-ann-title">Announcements</div>
                  <div className="irn-ann-sub">{announcements.length} total from Super Admin</div>
                </div>
              </div>
              <button className="irn-ann-close" type="button" onClick={() => setShowAnnouncements(false)} aria-label="Close">
                <NavIcon type="close" size={16} />
              </button>
            </div>
            <div className="irn-ann-body">
              {announcements.length === 0 ? (
                <div className="irn-ann-empty">No announcements yet.</div>
              ) : (
                announcements.map((ann, idx) => {
                  const isLatest = idx === 0
                  const mentioned = isCurrentUserMentioned(ann.title)
                  const alreadyReplied = repliedIds.has(ann.id)
                  return (
                    <div key={ann.id} className={`irn-ann-card ${isLatest ? 'is-latest' : ''}`}>
                      <div className="irn-ann-card-top">
                        <div className="irn-ann-card-title-row">
                          {isLatest && <span className="irn-ann-new-badge">● NEW</span>}
                          <span className="irn-ann-card-title">{ann.title}</span>
                        </div>
                        <div className="irn-ann-card-meta">
                          <span className="irn-ann-date">
                            {new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            className="irn-ann-reply-btn"
                            type="button"
                            disabled={alreadyReplied}
                            onClick={() => { setReplyAnn(ann); setReplyMsg(''); setReplyText('') }}
                          >
                            {alreadyReplied ? '✓ Wished' : '💬 Reply'}
                          </button>
                        </div>
                      </div>
                      <p className="irn-ann-card-msg">{ann.message}</p>
                      {mentioned && <div className="irn-ann-mentioned">🎂 You are mentioned</div>}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REPLY MODAL ── */}
      {replyAnn && (
        <div className="irn-reply-overlay" onClick={() => { setReplyAnn(null); setReplyMsg(''); setReplyText('') }}>
          <div className="irn-reply-modal" onClick={e => e.stopPropagation()}>
            <div className="irn-reply-head">
              <div>
                <div className="irn-reply-title">💬 Send Your Wish</div>
                <div className="irn-reply-target">Replying to: <strong style={{ color: '#111817' }}>{replyAnn.title}</strong></div>
              </div>
              <button className="irn-ann-close" type="button" onClick={() => { setReplyAnn(null); setReplyMsg(''); setReplyText('') }}>
                <NavIcon type="close" size={14} />
              </button>
            </div>
            {replyMsg && (
              <div className="irn-reply-msg" style={{
                background: replyMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)',
                border: `1px solid ${replyMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`,
                color: replyMsg.includes('✅') ? '#0C4044' : '#C92035',
              }}>
                {replyMsg}
              </div>
            )}
            <textarea
              className="irn-reply-textarea"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={4}
              placeholder="Type your wish or message..."
            />
            <button className="irn-reply-send-btn" disabled={replyLoading || !replyText.trim()} onClick={submitReply}>
              {replyLoading ? '⏳ Sending...' : '💬 Send Wish'}
            </button>
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
                <NavIcon type="close" size={20} />
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

            {/* Central Animated Mic with Ripples */}
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
                <NavIcon type="mic" size={34} />
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
