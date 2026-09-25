import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import InternalRoleNavbar from '../collection/InternalRoleNavbar'

// ══════════════════════════════════════════════════════════════════
// ICONS — copied 1:1 from Superadmin_Hierarchy_grid.jsx
// ══════════════════════════════════════════════════════════════════
const IconShield = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconStore = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1-5h16l1 5"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/>
    <path d="M4 9v10h16V9"/><path d="M9 21v-6h6v6"/>
  </svg>
)
const IconLink = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const IconPhone = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)
const IconMapPin = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconPrinter = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
)
const IconChevronDown = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconX = ({ color, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// ══════════════════════════════════════════════════════════════════
// shop_type badge — kept prominent, same colors as the original build
// (the one thing flagged as critical for this page)
// ══════════════════════════════════════════════════════════════════
const TYPE_STYLE = {
  live: { label: 'Physical Shop', Icon: IconStore, bg: 'rgba(12,64,68,0.10)', border: 'rgba(12,64,68,0.38)', color: '#0C4044' },
  virtual: { label: 'Virtual Shop', Icon: IconLink, bg: 'rgba(204,168,129,0.18)', border: 'rgba(204,168,129,0.5)', color: '#8A623D' },
}

// One theme color per depth, cycling for however deep a shop's real subtree goes
const LEVEL_COLORS = ['#0C4044', '#16A34A', '#0284C7', '#7C3AED', '#CA8A04', '#DB2777', '#DC2626']
const levelColor = depth => LEVEL_COLORS[(depth - 1) % LEVEL_COLORS.length]

const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function ShopTypeBadge({ type }) {
  const st = TYPE_STYLE[type] || TYPE_STYLE.live
  const Icon = st.Icon
  return (
    <span className="shg-badge" style={{ color: st.color, background: st.bg, borderColor: st.border }}>
      <Icon color={st.color} size={11} /> {st.label}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════════
// PRINT — single node's own hierarchy chain, adapted from
// Superadmin_Hierarchy_grid.jsx's printPersonCard/getPrintStyles.
// No fabricated sales numbers, no full bracket-tree print — that part
// of the reference relies on order_count data shops don't have.
// ══════════════════════════════════════════════════════════════════
function getPrintStyles(accent) {
  return `
    * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:'Inter',system-ui,-apple-system,sans-serif; background:#F4F8F8; color:#111817; padding:32px 20px; }
    .wrapper { max-width:540px; margin:0 auto; background:#FFFFFF; border:1.5px solid #D6E2E1; border-radius:20px; padding:32px; box-shadow:0 12px 36px rgba(7,59,63,0.08); }
    .header { text-align:center; margin-bottom:26px; border-bottom:1.5px solid #E1EBEA; padding-bottom:18px; }
    .header h1 { font-size:20px; font-weight:800; color:#073B3F; letter-spacing:0.2px; margin-bottom:4px; }
    .header p { font-size:12.5px; color:#5C706E; font-weight:600; letter-spacing:0.5px; }
    .chain-item { background:#FFFFFF; border:1.5px solid #E1EBEA; border-left:4px solid #5C706E; border-radius:12px; padding:12px 16px; margin-bottom:10px; text-align:left; box-shadow:0 2px 8px rgba(7,59,63,0.04); }
    .chain-item.current { border-color:${accent}; border-left:5px solid ${accent}; background:${accent}0A; box-shadow:0 4px 16px rgba(7,59,63,0.1); }
    .chain-role { font-size:9.5px; font-weight:800; color:#5C706E; letter-spacing:1.2px; margin-bottom:3px; text-transform:uppercase; }
    .chain-item.current .chain-role { color:${accent}; font-weight:900; }
    .chain-id { font-family:monospace; font-size:11px; font-weight:700; color:${accent}; margin-bottom:3px; }
    .chain-name { font-size:15px; font-weight:800; color:#111817; margin-bottom:4px; }
    .chain-info { font-size:11.5px; color:#5C706E; margin-top:2px; }
    .chain-arrow { text-align:center; color:#073B3F; margin:2px 0 6px; font-size:16px; font-weight:900; line-height:1; }
    .footer { text-align:center; font-size:10.5px; color:#5C706E; margin-top:26px; border-top:1px solid #E1EBEA; padding-top:14px; }
    @media print {
      body { background:#FFFFFF !important; padding:10mm !important; }
      .wrapper { border:none !important; box-shadow:none !important; padding:0 !important; max-width:100% !important; }
    }
  `
}

function printShopChain(chainNodes) {
  const current = chainNodes[chainNodes.length - 1]
  const chainHtml = chainNodes.map((node, idx) => {
    const isLast = idx === chainNodes.length - 1
    const label = idx === 0 ? 'ROOT SHOP' : `LEVEL ${idx + 1} SHOP`
    return `<div class="chain-item ${isLast ? 'current' : ''}">
      <div class="chain-role">${label} · ${node.shop_type === 'virtual' ? 'VIRTUAL' : 'PHYSICAL'}</div>
      <div class="chain-id">${node.shop_id}</div>
      <div class="chain-name">${node.shop_name}</div>
      <div class="chain-info">Owner: ${node.owner_name || '—'}</div>
      <div class="chain-info">Tel: ${node.mobile_number || '—'}</div>
      <div class="chain-info">${node.city || '—'}</div>
    </div>${idx < chainNodes.length - 1 ? `<div class="chain-arrow">↓</div>` : ''}`
  }).join('')

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site to print.')
    return
  }
  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>Shop Chain — ${current.shop_name}</title>
    <style>${getPrintStyles(levelColor(chainNodes.length))}</style></head>
    <body><div class="wrapper">
      <div class="header"><h1>BitByte — Shop Hierarchy Chain</h1><p>${current.shop_name} (${current.shop_id})</p></div>
      ${chainHtml}
      <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
    <script>window.onload = () => { window.print() }<\/script>
    </body></html>
  `)
  printWindow.document.close()
}

// ══════════════════════════════════════════════════════════════════
// HIERARCHY CHAIN popup — same visual language as the reference's
// hover/click chain card (LIVE badge, root card, arrow, current node
// highlighted + glow), rebuilt as controlled React instead of raw DOM
// injection, and reworked to shop fields (shop_id/owner/city/mobile).
// ══════════════════════════════════════════════════════════════════
function ChainPopup({ chainNodes, rect, onClose }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 860
  if (isMobile) return null

  const popW = 280
  const estH = 130 + chainNodes.length * 150
  const popH = Math.min(estH, window.innerHeight * 0.85)
  let left = rect.right + 18
  let top = rect.top + rect.height / 2 - popH / 2
  if (left + popW > window.innerWidth - 16) left = rect.left - popW - 18
  if (left < 12) left = 12
  if (left + popW > window.innerWidth - 12) left = Math.max(12, window.innerWidth - popW - 12)
  if (top < 12) top = 12
  if (top + popH > window.innerHeight - 12) top = Math.max(12, window.innerHeight - popH - 12)

  return (
    <>
      <div className="shg-popup-overlay" onClick={onClose} />
      <div className="shg-popup" style={{ left, top, width: popW, maxHeight: popH }}>
        <div className="shg-popup-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div className="shg-popup-icon"><IconLink color="#020617" size={13} /></div>
            <div>
              <div className="shg-popup-title">HIERARCHY CHAIN</div>
              <div className="shg-popup-sub">{chainNodes.length} level{chainNodes.length !== 1 ? 's' : ''} deep</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="shg-popup-live">● LIVE</div>
            <button className="shg-popup-close" onClick={onClose} title="Close"><IconX color="#0C4044" /></button>
          </div>
        </div>

        {chainNodes.map((node, idx) => {
          const isRoot = idx === 0
          const isCurrent = idx === chainNodes.length - 1
          const color = levelColor(idx + 1)
          const rc = hexToRgb(color)
          return (
            <div key={node.shop_id}>
              {idx > 0 && (
                <div className="shg-popup-arrow-wrap">
                  <div className="shg-popup-arrow-head" />
                  <div className="shg-popup-arrow-line" />
                </div>
              )}
              <div
                className="shg-popup-item"
                style={{
                  border: isCurrent ? `1.5px solid rgba(${rc},0.55)` : `1px solid rgba(${rc},0.16)`,
                  animation: isCurrent ? 'shgGlow 3s ease-in-out infinite' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                  <div className="shg-popup-item-icon" style={{ background: color, boxShadow: `0 4px 12px rgba(${rc},0.3)` }}>
                    {isRoot ? <IconShield color="#020617" size={15} /> : <TYPE_STYLE.live.Icon color="#020617" size={15} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, color, fontWeight: 800, letterSpacing: 1.8 }}>
                      {isRoot ? 'ROOT SHOP · FULL NETWORK' : `LEVEL ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: 9, color, fontFamily: 'monospace', opacity: 0.6, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.shop_id}
                    </div>
                  </div>
                  {isCurrent && !isRoot && (
                    <div className="shg-popup-current-pill" style={{ background: `rgba(${rc},0.18)`, color, border: `1px solid rgba(${rc},0.4)` }}>● CURRENT</div>
                  )}
                </div>
                <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, marginBottom: 6, letterSpacing: -0.3 }}>{node.shop_name}</div>
                <ShopTypeBadge type={node.shop_type} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="shg-popup-mini-icon" style={{ background: `rgba(${rc},0.12)`, border: `1px solid rgba(${rc},0.2)` }}>
                      <IconPhone color={color} size={11} />
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{node.mobile_number || '—'}</span>
                  </div>
                  {node.city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="shg-popup-mini-icon" style={{ background: `rgba(${rc},0.12)`, border: `1px solid rgba(${rc},0.2)` }}>
                        <IconMapPin color={color} size={11} />
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{node.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div className="shg-popup-footer">BitByte Shop Network · Hierarchy Chain</div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════
// SHOP CARD — one node in one horizontal level row
// ══════════════════════════════════════════════════════════════════
function ShopCard({ node, depth, active, onSelect, chainNodes, onOpenChain }) {
  const color = levelColor(depth)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div
      className={`shg-card ${active ? 'shg-card-active' : ''} ${hasChildren ? 'shg-card-clickable' : ''}`}
      style={{ '--lc': color, cursor: hasChildren ? 'pointer' : 'default' }}
      onClick={() => hasChildren && onSelect(node)}
      title={hasChildren ? undefined : 'No sub-shops under this one'}
    >
      <button
        className="shg-info-btn"
        style={{ '--lc': color }}
        title="View hierarchy chain"
        onClick={e => { e.stopPropagation(); onOpenChain(e.currentTarget, chainNodes) }}
      >
        i
      </button>

      <ShopTypeBadge type={node.shop_type} />
      <div className="shg-card-id" style={{ color }}>{node.shop_id}</div>
      <div className="shg-card-name">{node.shop_name}</div>
      <div className="shg-card-sub"><IconMapPin color="#53615F" /> {node.owner_name}</div>
      <div className="shg-card-sub"><IconPhone color="#53615F" /> {node.mobile_number}</div>
      {node.city && <div className="shg-card-sub"><IconMapPin color="#53615F" /> {node.city}</div>}
      <div className="shg-card-since">Since {formatDate(node.created_at)}</div>

      <div className="shg-card-actions">
        <button
          className="shg-btn"
          style={{ '--lc': color }}
          onClick={e => { e.stopPropagation(); printShopChain(chainNodes) }}
        >
          <IconPrinter color={color} /> PRINT
        </button>
      </div>

      {node.descendant_count > 0 && (
        <div className="shg-card-count" style={{ background: color }}>
          {node.descendant_count} sub-shop{node.descendant_count === 1 ? '' : 's'}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// LEVEL ROW — one horizontal level: label on the left, cards scroll
// right, colored divider underneath linking it to the next level.
// ══════════════════════════════════════════════════════════════════
function LevelRow({ depth, labelDepth, items, ancestors, activeId, onSelect, onOpenChain }) {
  const color = levelColor(depth)
  return (
    <div className="shg-lane" id={`shg-lane-${depth}`}>
      <div className="shg-lane-label">
        <span style={{ color, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>LEVEL {labelDepth ?? depth}</span>
        <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: 0.6 }}>SUB-SHOPS</span>
        <span style={{ color: '#53615F', fontSize: 13, fontWeight: 700 }}>{items.length}</span>
      </div>
      <div className="shg-lane-track" style={{ scrollbarColor: `${color} rgba(231,237,236,0.62)`, '--lc': color }}>
        {items.map(node => (
          <ShopCard
            key={node.shop_id}
            node={node}
            depth={depth}
            active={node.shop_id === activeId}
            onSelect={onSelect}
            chainNodes={[...ancestors, node]}
            onOpenChain={onOpenChain}
          />
        ))}
      </div>
      <div className="shg-lane-divider" style={{ background: color }} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function ShopHierarchyGrid() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const isSuperAdmin = role === 'super_admin'
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rootExpanded, setRootExpanded] = useState(true)
  const [selectedPath, setSelectedPath] = useState([])
  const [chainPopup, setChainPopup] = useState(null)

  const [shop, setShop] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [showAnnouncements, setShowAnnouncements] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const subtext = '#7A8987'
  const border = 'rgba(189,207,206,0.78)'

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/shop-hierarchy/')
        setTree(res.data)
        // ── defensive: drop any drill-down selection referring to a
        // now-stale tree (e.g. if this page ever starts re-fetching) ──
        setSelectedPath([])
      } catch {
        setError('Failed to load your shop network.')
      }
      setLoading(false)
    }
    fetchTree()
  }, [])

  const fetchShopProfile = async () => {
    setProfileLoading(true)
    try {
      const res = await api.get('/my-shop-profile/')
      setShop(res.data)
    } catch (err) {
      console.error('Shop profile fetch error:', err)
    }
    setProfileLoading(false)
  }

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/')
      const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setAnnouncements(sorted)
      const lastSeen = parseInt(localStorage.getItem('shopAnnouncementSeen') || '0')
      setUnreadCount(sorted.filter(a => new Date(a.created_at).getTime() > lastSeen).length)
    } catch { /* ignore */ }
  }

  useEffect(() => { if (!isSuperAdmin) fetchAnnouncements() }, [])

  const openAnnouncements = () => {
    setShowAnnouncements(true)
    localStorage.setItem('shopAnnouncementSeen', Date.now().toString())
    setUnreadCount(0)
  }

  const handleLogout = () => { localStorage.clear(); navigate('/login') }

  const levels = useMemo(() => {
    if (!tree) return []
    const result = []
    let currentItems = tree.children || []
    let ancestors = [tree]
    let depth = 2
    while (currentItems && currentItems.length) {
      result.push({ depth, items: currentItems, ancestors })
      const selId = selectedPath[depth - 2]
      const selNode = currentItems.find(n => n.shop_id === selId)
      if (!selNode) break
      ancestors = [...ancestors, selNode]
      currentItems = selNode.children
      depth++
    }
    return result
  }, [tree, selectedPath])

  const networkStats = useMemo(() => {
    if (!tree) return null
    let physical = 0, virtual = 0
    const walk = n => {
      (n.children || []).forEach(c => {
        if (c.shop_type === 'virtual') virtual++
        else physical++
        walk(c)
      })
    }
    walk(tree)
    return { total: tree.descendant_count, physical, virtual }
  }, [tree])

  const selectAt = (depth, node) => {
    setSelectedPath(prev => {
      const idx = depth - 2
      const next = prev.slice(0, idx)
      if (prev[idx] !== node.shop_id) next[idx] = node.shop_id
      return next
    })
  }

  // ── whenever a drill-down reveals a new, deeper level row, bring it
  // into view — without this the newly opened row can land off-screen
  // below the fold and clicking a card looks like it did nothing ──
  useEffect(() => {
    if (selectedPath.length === 0) return
    const nextDepth = selectedPath.length + 2
    const el = document.getElementById(`shg-lane-${nextDepth}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedPath])

  const openChain = (anchorEl, chainNodes) => {
    setChainPopup({ chainNodes, rect: anchorEl.getBoundingClientRect() })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: '#111817', fontFamily: '"Inter",system-ui,sans-serif' }}>
      {!isSuperAdmin && (
        <InternalRoleNavbar
          roleTitle="SHOP"
          homePath="/shop-dashboard"
          managementItems={[
            { label: 'Dashboard', path: '/shop-dashboard' },
            { label: 'My Profile', action: () => { setShowProfile(true); fetchShopProfile() } },
            { label: 'Create Shop', path: '/add-shop' },
            { label: 'My Network', path: '/shop-hierarchy-grid' },
          ]}
          celebrationItems={[]}
          announcementItems={[
            { label: 'View Announcements', action: openAnnouncements, badge: unreadCount },
          ]}
          coinItems={[]}
          reportItems={[{ label: 'Shop Report', path: '/shop-report' }, { label: 'Network Grid', path: '/shop-hierarchy-grid' }, { label: 'Network Tree', path: '/shop-hierarchy-tree' }]}
          actionItems={[
            { label: 'Profile', icon: 'user', action: () => { setShowProfile(true); fetchShopProfile() } },
            { label: 'Create Shop', icon: 'rate', action: () => navigate('/add-shop') },
            { label: 'My Network', icon: 'user', action: () => navigate('/shop-hierarchy-grid') },
            { label: 'Announcements', icon: 'bell', action: openAnnouncements, badge: unreadCount },
            { label: 'Logout', icon: 'logout', variant: 'danger', action: handleLogout },
          ]}
        />
      )}

      <style>{`
        @keyframes shgGlow{0%,100%{box-shadow:0 0 0px rgba(34,197,94,0)}50%{box-shadow:0 0 20px rgba(34,197,94,0.22)}}
        @keyframes shgSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes shgPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}

        .shg-badge{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:800; padding:3px 10px; border-radius:20px; border:1px solid; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:8px; }

        .shg-card{
          background:#FFFFFF; border:2.5px solid var(--lc); border-radius:16px; padding:14px 18px;
          min-width:190px; max-width:230px; position:relative;
          transition:opacity .2s ease, transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease;
          flex-shrink:0;
        }
        .shg-card-clickable:hover{ transform:translateY(-3px); box-shadow:0 16px 34px rgba(7,59,63,0.20); }
        .shg-card-active{ box-shadow:0 0 0 2px var(--lc), 0 18px 36px rgba(7,59,63,0.20); transform:translateY(-3px); }
        .shg-info-btn{
          position:absolute; top:8px; left:8px; z-index:2;
          width:20px; height:20px; border-radius:50%;
          background:#FFFFFF; border:1.5px solid var(--lc);
          color:var(--lc); display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:11px; font-weight:900; font-style:italic; font-family:Georgia,serif;
          transition:background .2s ease, transform .2s ease;
        }
        .shg-info-btn:hover{ background:var(--lc); color:#FFFFFF; transform:scale(1.1); }
        .shg-card-id{ font-family:monospace; font-size:11px; font-weight:800; margin-bottom:6px; word-break:break-all; margin-top:16px; }
        .shg-card-name{ font-weight:900; font-size:14px; margin-bottom:8px; line-height:1.35; color:#0C4044; }
        .shg-card-sub{ display:flex; align-items:center; gap:4px; font-size:12px; font-weight:650; margin-bottom:4px; color:#53615F; }
        .shg-card-since{ font-size:10.5px; color:#7A8987; margin-top:2px; }
        .shg-card-actions{ margin-top:10px; display:flex; gap:6px; }
        .shg-btn{ flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:5px 0; font-size:10px; font-weight:800; background:#FFFFFF; border:1.5px solid var(--lc); border-radius:20px; color:var(--lc); cursor:pointer; transition:background .15s ease, transform .1s ease; }
        .shg-btn:hover{ background:var(--lc); color:#FDFDFC; transform:scale(1.03); }
        .shg-card-count{ position:absolute; bottom:-9px; left:50%; transform:translateX(-50%); color:#FDFDFC; font-size:10px; font-weight:900; padding:2px 8px; border-radius:20px; white-space:nowrap; text-shadow:0 1px 1px rgba(0,0,0,0.18); }

        .shg-lane{ margin-bottom:26px; }
        .shg-lane-label{ display:flex; align-items:baseline; gap:10px; margin-bottom:10px; padding-left:2px; }
        .shg-lane-track{ display:flex; gap:14px; overflow-x:auto; overflow-y:visible; padding:6px 4px 14px 4px; scrollbar-width:thin; }
        .shg-lane-track::-webkit-scrollbar{ height:7px; }
        .shg-lane-track::-webkit-scrollbar-track{ background:rgba(12,64,68,0.10); border-radius:10px; }
        .shg-lane-track::-webkit-scrollbar-thumb{ background:var(--lc); border-radius:10px; opacity:0.7; }
        .shg-lane-divider{ height:4px; border-radius:3px; margin:0 4px 4px 4px; opacity:0.9; }

        .shg-root-card{
          display:inline-flex; align-items:center; gap:10px;
          background:rgba(12,64,68,0.08); border:1.5px solid #0C4044; border-radius:12px;
          padding:10px 18px; margin-bottom:14px;
        }
        .shg-root-chevron{ background:none; border:none; cursor:pointer; padding:0; display:flex; align-items:center; margin-left:8px; transition:transform .2s ease; }

        .shg-popup-overlay{ position:fixed; inset:0; z-index:9998; background:transparent; }
        .shg-popup{
          position:fixed; z-index:9999; background:#FFFFFF; border:1.5px solid rgba(12,64,68,0.18);
          border-radius:20px; padding:20px; box-shadow:0 24px 60px rgba(7,59,63,0.16), 0 0 0 1px rgba(12,64,68,0.05);
          animation:shgSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both; overflow-y:auto; overflow-x:hidden;
          font-family:'Inter',system-ui,sans-serif; box-sizing:border-box;
        }
        .shg-popup-header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid rgba(12,64,68,0.12); }
        .shg-popup-icon{ width:26px; height:26px; border-radius:8px; background:linear-gradient(135deg,#22c55e,#38bdf8); display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(34,197,94,0.4); }
        .shg-popup-title{ font-size:11px; color:#16a34a; font-weight:800; letter-spacing:1.8px; }
        .shg-popup-sub{ font-size:9px; color:#94a3b8; margin-top:2px; }
        .shg-popup-live{ font-size:9px; font-weight:800; padding:4px 9px; border-radius:20px; background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.22); color:#16a34a; letter-spacing:1px; }
        .shg-popup-close{ background:rgba(12,64,68,0.08); border:1px solid rgba(12,64,68,0.2); width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; }
        .shg-popup-item{ border-radius:14px; padding:14px 16px; background:#FFFFFF; position:relative; overflow:hidden; margin-bottom:2px; }
        .shg-popup-item-icon{ width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .shg-popup-mini-icon{ width:20px; height:20px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .shg-popup-current-pill{ margin-left:auto; font-size:8px; font-weight:800; padding:3px 9px; border-radius:20px; white-space:nowrap; letter-spacing:0.5px; }
        .shg-popup-arrow-wrap{ display:flex; flex-direction:column; align-items:center; padding:5px 0; }
        .shg-popup-arrow-head{ width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-bottom:7px solid rgba(34,197,94,0.5); }
        .shg-popup-arrow-line{ width:1.5px; height:16px; background:linear-gradient(180deg,rgba(34,197,94,0.1),rgba(34,197,94,0.65)); }
        .shg-popup-footer{ margin-top:14px; padding-top:12px; border-top:1px solid rgba(12,64,68,0.10); font-size:9px; color:#cbd5e1; text-align:center; letter-spacing:0.8px; font-weight:600; }

        .shg-page-wrap{ width:min(1500px,calc(100% - 48px)); margin:0 auto; padding:42px 0 56px; box-sizing:border-box; }

        @media(max-width:860px){ .shg-popup{ display:none !important; } }
        @media(max-width:768px){
          .shg-page-wrap{ width:calc(100% - 28px); padding:24px 0 40px; }
          .shg-card{ min-width:160px !important; max-width:190px !important; }
          .shg-root-card{ flex-wrap:wrap; }
          .shg-lane-label{ flex-wrap:wrap; row-gap:4px; }
        }
        @media(max-width:480px){
          .shg-page-wrap{ padding:16px 0 32px; }
          .shg-card{ min-width:130px !important; max-width:155px !important; padding:9px 10px !important; }
          .shg-card-name{ font-size:11.5px !important; }
          .shg-card-since{ display:none; }
          .shg-badge{ font-size:9.5px !important; padding:2px 8px !important; }
          .shg-root-card{ padding:10px 14px !important; gap:8px !important; }
          .shg-lane-label{ gap:6px !important; margin-bottom:6px !important; }
          .shg-popup{ display:none !important; }
        }
      `}</style>

      <div className="shg-page-wrap">
        <div style={{ marginBottom: '26px' }}>
          <div style={{ color: '#BB8958', fontSize: '12px', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px' }}>Shop Panel</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', lineHeight: 0.95, fontFamily: 'Georgia, serif', color: '#0C4044', fontWeight: 500, margin: 0 }}>
              {isSuperAdmin ? 'Shop Hierarchy' : 'My Network'}
            </h2>
            <button
              onClick={() => navigate('/shop-hierarchy-tree')}
              style={{ background: '#FFFFFF', border: '1.5px solid #0C4044', color: '#0C4044', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              Tree view
            </button>
          </div>
          <p style={{ color: '#7A8987', fontSize: 13, marginTop: 10 }}>
            {isSuperAdmin
              ? 'Every shop in the system, and everyone they\'ve created — Physical or Virtual, clearly marked.'
              : "Every shop created under you, and everyone they've created — Physical or Virtual, clearly marked."}
          </p>

          {networkStats && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(12,64,68,0.08)', border: '1px solid rgba(12,64,68,0.3)', borderRadius: 20, padding: '4px 14px' }}>
                <span style={{ color: '#0C4044', fontWeight: 800, fontSize: 13 }}>{networkStats.total}</span>
                <span style={{ color: '#7A8987', fontSize: 12, fontWeight: 650 }}>Total Sub-Shops</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(12,64,68,0.08)', border: '1px solid rgba(12,64,68,0.3)', borderRadius: 20, padding: '4px 14px' }}>
                <span style={{ color: '#0C4044', fontWeight: 800, fontSize: 13 }}>{networkStats.physical}</span>
                <span style={{ color: '#7A8987', fontSize: 12, fontWeight: 650 }}>Physical</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(204,168,129,0.18)', border: '1px solid rgba(204,168,129,0.5)', borderRadius: 20, padding: '4px 14px' }}>
                <span style={{ color: '#8A623D', fontWeight: 800, fontSize: 13 }}>{networkStats.virtual}</span>
                <span style={{ color: '#7A8987', fontSize: 12, fontWeight: 650 }}>Virtual</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: 12, padding: '14px 18px', fontSize: 13, marginBottom: 20 }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7A8987' }}>Loading your network...</div>
        ) : tree ? (
          <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(12,64,68,0.22)', borderRadius: 20, padding: '24px 28px', minHeight: '50vh', boxShadow: '0 18px 42px rgba(7,59,63,0.08)' }}>
            <div className="shg-root-card">
              <IconShield color="#0C4044" size={18} />
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.4, color: '#0C4044' }}>{tree.shop_id ? 'LEVEL 1 · ROOT SHOP' : 'ALL ROOT SHOPS'}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111817', marginTop: 2 }}>{tree.shop_name}</div>
                {tree.shop_id && <div style={{ fontSize: 11, color: '#5C706E', marginTop: 1 }}>{tree.owner_name} · {tree.shop_id}</div>}
              </div>
              {tree.shop_id && <ShopTypeBadge type={tree.shop_type} />}
              {tree.children && tree.children.length > 0 && (
                <button
                  className="shg-root-chevron"
                  style={{ transform: rootExpanded ? 'none' : 'rotate(-90deg)' }}
                  onClick={() => setRootExpanded(e => !e)}
                  title={rootExpanded ? 'Collapse network' : 'Expand network'}
                >
                  <IconChevronDown color="#0C4044" size={16} />
                </button>
              )}
            </div>

            {rootExpanded && (
              tree.children && tree.children.length > 0 ? (
                levels.map(lvl => (
                  <LevelRow
                    key={lvl.depth}
                    depth={lvl.depth}
                    labelDepth={isSuperAdmin ? lvl.depth - 1 : lvl.depth}
                    items={lvl.items}
                    ancestors={lvl.ancestors}
                    activeId={selectedPath[lvl.depth - 2]}
                    onSelect={node => selectAt(lvl.depth, node)}
                    onOpenChain={openChain}
                  />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#7A8987', fontSize: 13 }}>No sub-shops created yet.</div>
              )
            )}
          </div>
        ) : !error ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7A8987' }}>No data available.</div>
        ) : null}
      </div>

      {chainPopup && (
        <ChainPopup chainNodes={chainPopup.chainNodes} rect={chainPopup.rect} onClose={() => setChainPopup(null)} />
      )}

      {/* ── PROFILE MODAL — same nav item / endpoint as ShopDashboard.jsx,
          read-only here (full edit form stays on the Shop Dashboard) ── */}
      {showProfile && (
        <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '580px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '15px' }}>MY SHOP PROFILE</div>
                <div style={{ color: subtext, fontSize: '11px', marginTop: '3px', fontFamily: 'monospace' }}>{shop?.shop_id || '—'}</div>
              </div>
              <button onClick={() => setShowProfile(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              {profileLoading || !shop ? (
                <div style={{ textAlign: 'center', color: subtext, padding: '40px 0' }}>{profileLoading ? 'Loading...' : 'No profile data.'}</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {[
                    ['Shop Name', shop.shop_name], ['Owner Name', shop.owner_name],
                    ['Shop Type', shop.shop_type === 'live' ? 'Physical Shop' : 'Virtual Shop'],
                    ['Email', shop.email], ['Mobile', shop.mobile_number], ['WhatsApp', shop.whatsapp_number],
                    ['Address', shop.shop_address], ['Pincode', shop.pincode], ['Street', shop.street_name],
                    ['City', shop.city], ['District', shop.district], ['State', shop.state],
                    ['PAN', shop.pan_no], ['GST', shop.gst_no], ['MSME', shop.msme_no],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                      <div style={{ color: '#111817', fontSize: '13px' }}>{value || '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ANNOUNCEMENTS MODAL — same as ShopDashboard.jsx ── */}
      {showAnnouncements && (
        <div onClick={() => setShowAnnouncements(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.6)' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '14px' }}>ANNOUNCEMENTS</div>
              <button onClick={() => setShowAnnouncements(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', color: subtext, padding: '60px 0' }}>No announcements yet.</div>
              ) : announcements.map((ann, idx) => (
                <div key={ann.id} style={{ background: idx === 0 ? 'rgba(12,64,68,0.05)' : '#FFFFFF', border: `1px solid ${idx === 0 ? 'rgba(12,64,68,0.3)' : border}`, borderRadius: '14px', padding: '16px 18px' }}>
                  <div style={{ color: idx === 0 ? '#0C4044' : '#111817', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{ann.title}</div>
                  <div style={{ color: subtext, fontSize: '13px', lineHeight: 1.6 }}>{ann.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
