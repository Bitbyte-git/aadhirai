import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
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
          background: rgba(253, 253, 252, 0.98);
          border-bottom: 1px solid rgba(189, 207, 206, 0.75);
          box-shadow: 0 10px 30px rgba(7, 59, 63, 0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .irn-top-spacer {
          height: 74px;
        }
        .irn-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 24px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
          gap: 12px;
        }

        /* ── BRAND LOGO & TITLE ── */
        .irn-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          flex-shrink: 0;
          text-align: left;
          text-decoration: none;
        }
        .irn-brand img {
          width: 42px;
          height: 42px;
          object-fit: contain;
        }
        .irn-brand-text {
          display: flex;
          flex-direction: column;
        }
        .irn-brand strong {
          display: block;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 22px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.03em;
          color: #073B3F;
        }
        .irn-brand small {
          display: block;
          margin-top: 3px;
          color: #BB8958;
          font-size: 8.5px;
          font-weight: 850;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        /* ── DESKTOP CENTER NAVIGATION ── */
        .irn-menu {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          flex-wrap: nowrap;
          flex: 1;
          max-width: 960px;
          margin: 0 10px;
        }
        .irn-group {
          position: relative;
          display: inline-flex;
        }
        .irn-trigger {
          border: 0;
          background: transparent;
          padding: 8px 10px;
          color: #073B3F;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 12px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          white-space: nowrap;
          border-radius: 9px;
          transition: all 0.16s ease;
        }
        .irn-trigger:hover, .irn-trigger.is-active {
          background: #EDF3F1;
          color: #0C4044;
        }
        .irn-trigger-aug {
          background: rgba(204, 168, 129, 0.14);
          color: #8C5E28;
          font-weight: 900;
          border: 1px solid rgba(204, 168, 129, 0.35);
        }
        .irn-trigger-aug:hover {
          background: rgba(204, 168, 129, 0.28);
          color: #6C4212;
        }

        /* ── DESKTOP DROPDOWN ── */
        .irn-drop {
          position: absolute;
          top: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%) translateY(8px);
          min-width: 250px;
          padding: 16px 18px;
          background: rgba(255, 255, 255, 0.99);
          border: 1px solid rgba(189, 207, 206, 0.85);
          box-shadow: 0 24px 60px rgba(7, 59, 63, 0.16), 0 4px 14px rgba(7, 59, 63, 0.06);
          border-radius: 14px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1000;
        }
        .irn-group:hover .irn-drop, .irn-group.is-active .irn-drop {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }
        .irn-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 15px;
          font-weight: 900;
          color: #073B3F;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #EDF3F2;
        }
        .irn-title span {
          color: #BB8958;
        }
        .irn-link {
          width: 100%;
          border: 0;
          background: transparent;
          padding: 8px 10px;
          border-radius: 8px;
          text-align: left;
          color: #111817;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .irn-link:hover {
          color: #0C4044;
          background: #EDF3F1;
          transform: translateX(3px);
        }
        .irn-badge {
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #C92035;
          color: #FFFFFF;
          font-size: 9px;
          font-weight: 850;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
        }

        /* ── RIGHT ACTIONS ── */
        .irn-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .irn-action {
          height: 38px;
          border: 1px solid transparent;
          background: transparent;
          color: #0C4044;
          font-size: 12px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          border-radius: 999px;
          padding: 0 12px;
          position: relative;
          white-space: nowrap;
          transition: all 0.16s ease;
        }
        .irn-action:hover {
          background: #EDF3F1;
          border-color: rgba(189, 207, 206, 0.7);
        }
        .irn-action.danger {
          color: #C92035;
          background: rgba(201, 32, 53, 0.05);
          border-color: rgba(201, 32, 53, 0.18);
        }
        .irn-action.danger:hover {
          background: #C92035;
          color: #FFFFFF;
        }
        .irn-action .irn-badge {
          position: absolute;
          top: -2px;
          right: -2px;
        }

        /* ── MOBILE MENU BUTTON ── */
        .irn-mobile-menu-btn {
          display: none;
          height: 38px;
          padding: 0 14px;
          background: #073B3F;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.05em;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.18);
          flex-shrink: 0;
        }
        .irn-mobile-menu-btn:hover {
          background: #0C4044;
          transform: translateY(-1px);
        }

        /* ── RESPONSIVE BREAKPOINTS ── */
        @media (max-width: 1260px) {
          .irn-menu {
            display: none !important;
          }
          .irn-mobile-menu-btn {
            display: inline-flex !important;
          }
          /* On screens under 1260px, hide desktop Profile and Logout from top bar, they live inside drawer */
          .irn-actions .irn-action:not([title*="Announcements"]):not([title*="Bell"]):not(.irn-bell-btn) {
            display: none !important;
          }
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
          {/* ── BRAND ── */}
          <button
            className="irn-brand"
            type="button"
            onClick={() => navigate(homePath)}
            title="Go to dashboard"
          >
            <img src={logo} alt="Luxiva" />
            <div className="irn-brand-text">
              <strong>LUXIVA</strong>
              <small>{currentTierLabel}</small>
            </div>
          </button>

          {/* ── DESKTOP MENU (Hidden below 1260px) ── */}
          <nav className="irn-menu" aria-label="Main Navigation">
            {groups.map(group => (
              group.label === 'My Rewards' ? (
                <button
                  key={group.label}
                  type="button"
                  className="irn-trigger irn-trigger-aug"
                  onClick={() => runItem(group.items[0])}
                  title="AUG Coin Quick Recharge"
                >
                  🪙 {group.items[0].label}
                </button>
              ) : (
                <div
                  className={`irn-group ${activeGroup === group.label ? 'is-active' : ''}`}
                  key={group.label}
                  onMouseEnter={() => setActiveGroup(group.label)}
                  onMouseLeave={() => setActiveGroup(null)}
                >
                  <button
                    className={`irn-trigger ${activeGroup === group.label ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setActiveGroup(curr => curr === group.label ? null : group.label)}
                    aria-expanded={activeGroup === group.label}
                  >
                    {group.label}
                    <NavIcon type="chevron" size={14} />
                  </button>
                  <div className="irn-drop">
                    <div className="irn-title">
                      <span>●</span> {group.label}
                    </div>
                    {group.items.map(item => (
                      <button
                        key={item.label}
                        type="button"
                        className="irn-link"
                        onClick={() => runItem(item)}
                      >
                        <span>{item.label}</span>
                        {item.badge ? (
                          <span className="irn-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                        ) : (
                          <span style={{ color: '#8C9E9C', fontSize: '12px' }}>→</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </nav>

          {/* ── RIGHT ACTIONS ── */}
          <div className="irn-actions">
            {actions.map(item => {
              const isBell = item.icon === 'bell'
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`irn-action ${item.variant === 'danger' ? 'danger' : ''} ${isBell ? 'irn-bell-btn' : ''}`}
                  onClick={() => item.action ? item.action() : (item.path ? navigate(item.path) : logout())}
                  title={item.label}
                >
                  <NavIcon type={item.icon || 'dot'} size={17} />
                  {!isBell && <span>{item.label}</span>}
                  {item.badge ? (
                    <span className="irn-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                  ) : null}
                </button>
              )
            })}

            {/* ── MOBILE / TABLET MENU TOGGLE BUTTON (Visible <= 1260px) ── */}
            <button
              className="irn-mobile-menu-btn"
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <NavIcon type="menu" size={18} />
              <span>MENU</span>
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
                <img src={logo} alt="Luxiva" />
                <div>
                  <strong>LUXIVA</strong>
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
    </>
  )
}
