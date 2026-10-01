import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import logo from '../assets/logo.png'
import SuperAdminNavbar from '../collection/SuperAdminNavbar'
import goldCoin from '../assets/gold-coin-transparent.png'
import silverCoin from '../assets/silver-coin-transparent.png'
import CopyUrlButton from '../collection/CopyUrlButton'

const OCCUPATION_OPTIONS = ['employee', 'business', 'others']


const COLORS = ['#BDCFCE', '#CCA881', '#0C4044', '#C92035', '#BB8958', '#D1DFDE']


const ROLE_CFG = {
  admin: { color: '#53615F', label: 'SUPER STOCKIST', idKey: 'admin_id' },
  dealer: { color: '#0C4044', label: 'DISTRIBUTOR', idKey: 'dealer_id' },
  sub_dealer: { color: '#BB8958', label: 'WHOLESALE DEALER', idKey: 'sub_dealer_id' },
  promotor: { color: '#CCA881', label: 'RETAILER', idKey: 'promotor_id' },
  customer: { color: '#C92035', label: 'CUSTOMER', idKey: 'customer_id' },
}

function SvgIcon({ name, size = 16, stroke = 'currentColor' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    print: <><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    warning: <><path d="M10.3 2.9 1.9 17a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    note: <><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    paperclip: <path d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 0 1 5.7 5.7l-8.5 8.5a2 2 0 1 1-2.8-2.8l7.8-7.8" />,
    ring: <><circle cx="12" cy="14" r="6" /><path d="m9 8 3-5 3 5" /></>,
    necklace: <path d="M5 4c0 9 3 15 7 17 4-2 7-8 7-17M9 4h6" />,
    bracelet: <circle cx="12" cy="12" r="8" />,
    earring: <><path d="M12 3a4 4 0 1 1-4 4" /><circle cx="9" cy="17" r="3" /></>,
    chain: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M9 9h3a2 2 0 0 1 0 4H10M9 15h5M12 7v2m0 6v2" /></>,
  }
  return <svg {...common}>{paths[name] || paths.document}</svg>
}

function SectionHeader({ icon, label }) {
  const paths = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    id: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 8h4M15 12h4M7 16h10" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', borderRadius: '10px', marginBottom: '20px',
      background: 'linear-gradient(90deg, rgba(12,64,68,0.08), rgba(12,64,68,0.02))',
    }}>
      <div style={{
        width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
        background: 'linear-gradient(135deg,#0C4044,#073B3F)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FDFDFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {paths[icon] || paths.user}
        </svg>
      </div>
      <span style={{ color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  )
}

function svgIconMarkup(name, color = 'currentColor', size = 15) {
  const paths = {
    shield: '<path d="M12 3 4 6v5c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2A5 5 0 0 0 12 4l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>',
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0">${paths[name] || paths.link}</svg>`
}


function TreeNode({ node, role, depth = 0, dark, text, subtext, colorIdx = 0, ancestors = [], superAdminEmail = '', flatMode = false }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const cfg = ROLE_CFG[role]
  const c = COLORS[colorIdx % COLORS.length]

  const childRole = {
    admin: 'dealer',
    dealer: 'sub_dealer',
    sub_dealer: 'promotor',
    promotor: 'customer',
  }[role]

  const children = {
    admin: node.dealers,
    dealer: node.sub_dealers,
    sub_dealer: node.promotors,
    promotor: node.customers,
  }[role] || []

  const hasChildren = !flatMode && children.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
      {/* Node Card */}
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{
          background: dark ? `rgba(${hexToRgb(c)},0.06)` : `rgba(${hexToRgb(c)},0.08)`,
          border: `1px solid rgba(${hexToRgb(c)},0.35)`,
          borderRadius: '12px',
          padding: '12px 16px',
          minWidth: '160px',
          maxWidth: '200px',
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          position: 'relative',
        }}
        onMouseEnter={e => {
          clearTimeout(_chainHideTimer)
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = `0 8px 24px rgba(${hexToRgb(c)},0.25)`
          e.currentTarget.style.borderColor = `rgba(${hexToRgb(c)},0.7)`
          showChainPopup(e.currentTarget, ancestors, { node, role }, dark, text, subtext, superAdminEmail)
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = `rgba(${hexToRgb(c)},0.35)`
          _chainHideTimer = setTimeout(() => removeChainPopup(), 300)
        }}
      >
        {/* Role Badge */}
        <div style={{
          display: 'inline-block', fontSize: '9px', fontWeight: 700,
          padding: '2px 8px', borderRadius: '20px', marginBottom: '8px',
          background: `rgba(${hexToRgb(c)},0.15)`,
          color: c, border: `1px solid rgba(${hexToRgb(c)},0.35)`,
        }}>
          {cfg.label}
        </div>

        {/* ID */}
        <div style={{ color: c, fontFamily: 'monospace', fontSize: '10px', marginBottom: '4px', wordBreak: 'break-all' }}>
          {node[cfg.idKey]}
        </div>

        {/* Name */}
        <div style={{ color: text, fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
          {node.first_name} {node.last_name || ''}
        </div>

        {/* Phone */}
        <div style={{ color: subtext, fontSize: '11px', marginBottom: '2px' }}>
        {node.mobile_number}
        </div>

        {/* City */}
        {node.city_name && (
          <div style={{ color: subtext, fontSize: '11px' }}>{node.city_name}</div>
        )}

        {/* Gradient bar */}
        <div style={{
          marginTop: '8px', width: '100%', height: 2, borderRadius: 2,
          background: `linear-gradient(90deg,rgba(${hexToRgb(c)},0.2),${c})`,
        }} />

        {/* Print + Sales Count Buttons */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
          <button
            onClick={e => {
              e.stopPropagation()
              printPersonCard(node, role, cfg, c, ancestors, superAdminEmail)
            }}
            style={{
              flex: 1,
              padding: '3px 0', fontSize: '9px', fontWeight: 700,
              background: `rgba(${hexToRgb(c)},0.1)`,
              border: `1px solid rgba(${hexToRgb(c)},0.35)`,
              borderRadius: '6px', color: c, cursor: 'pointer',
              letterSpacing: '0.8px', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `rgba(${hexToRgb(c)},0.25)` }}
            onMouseLeave={e => { e.currentTarget.style.background = `rgba(${hexToRgb(c)},0.1)` }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><SvgIcon name="print" size={12} /> PRINT</span>
          </button>

          <button
            onClick={e => {
              e.stopPropagation()
              window.open(`/hierarchy-sales-count?role=${role}&id=${node.id}`, 'hierarchy_sales_count_tab')
            }}
            style={{
              flex: 1,
              padding: '3px 0', fontSize: '9px', fontWeight: 700,
              background: 'rgba(12,64,68,0.1)',
              border: '1px solid rgba(12,64,68,0.4)',
              borderRadius: '6px', color: '#0C4044', cursor: 'pointer',
              letterSpacing: '0.8px', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(12,64,68,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(12,64,68,0.1)' }}
          >
            SALES
            <span style={{
              background: '#0C4044', color: '#FDFDFC', borderRadius: '10px',
              padding: '0 5px', fontSize: '9px', fontWeight: 900, minWidth: '14px',
            }}>
              {node.order_count || 0}
            </span>
          </button>
        </div>

        {/* Expand indicator */}
        {hasChildren && (
          <div style={{
            position: 'absolute', top: '8px', right: '10px',
            color: c, fontSize: '10px', fontWeight: 700,
            transition: 'transform 0.3s ease',
            transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
          }}>
          </div>
        )}

        {/* Children count badge */}
        {hasChildren && (
          <div style={{
            position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)',
            background: c, color: '#FDFDFC', fontSize: '9px', fontWeight: 800,
            padding: '1px 7px', borderRadius: '20px', whiteSpace: 'nowrap',
          }}>
            {children.length} {childRole?.replace('_', ' ')}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

          {/*Vertical stem down from parent */}
          <div style={{ width: 2, height: 28, background: `linear-gradient(180deg,${c},rgba(${hexToRgb(c)},0.3))`, marginTop: '10px' }} />

          {/* Horizontal line + children */}
          <div style={{ position: 'relative', width: '100%' }}>

            {/* Horizontal connector line spans full width */}
            {children.length > 1 && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `rgba(${hexToRgb(c)},0.45)`,
              }} />
            )}

            {/* Children row */}
            <div style={{
              display: 'flex',
              justifyContent: children.length === 1 ? 'center' : 'space-between',
              alignItems: 'flex-start',
              gap: '8px',
              paddingTop: '0',
            }}>
              {children.map((child, ci) => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: children.length === 1 ? '0 0 auto' : 1 }}>
                  {/* Vertical stem down to each child */}
                  <div style={{ width: 2, height: 20, background: `rgba(${hexToRgb(c)},0.5)` }} />
                  <TreeNode
                    node={child}
                    role={childRole}
                    depth={depth + 1}
                    dark={dark}
                    text={text}
                    subtext={subtext}
                    colorIdx={colorIdx + ci + 1}
                    ancestors={[...ancestors, { node, role }]}
                    superAdminEmail={superAdminEmail}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// hex to rgb helper
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function getPasswordStrength(pw) {
  if (!pw) return { label: '', color: '', width: '0%' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { label: 'Weak', color: '#C92035', width: '33%' }
  if (score <= 4) return { label: 'Medium', color: '#BB8958', width: '66%' }
  return { label: 'Strong', color: '#0C4044', width: '100%' }
}

let _popupEl = null
let _hideTimer = null

// â”€â”€â”€ CHAIN POPUP (hover on any tree node) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ROLE_LABELS = {
  admin: { emoji: '', label: 'SUPER STOCKIST', color: '#53615F', idKey: 'admin_id' },
  dealer: { emoji: ' dealers', label: 'DISTRIBUTOR', color: '#0C4044', idKey: 'dealer_id' },
  sub_dealer: { emoji: ' sub_dealers', label: 'WHOLESALE DEALER', color: '#BB8958', idKey: 'sub_dealer_id' },
  promotor: { emoji: ' promotor', label: 'RETAILER', color: '#CCA881', idKey: 'promotor_id' },
  customer: { emoji: ' customers', label: 'CUSTOMER', color: '#C92035', idKey: 'customer_id' },
}

let _chainPopupEl = null
let _chainHideTimer = null

function removeChainPopup() {
  document.querySelectorAll('#chain-popup').forEach(el => el.remove())
  _chainPopupEl = null
}

function scheduleHideChainPopup() {
  clearTimeout(_chainHideTimer)
  _chainHideTimer = setTimeout(() => removeChainPopup(), 200)
}

function printPersonCard(node, role, cfg, color, ancestors, superAdminEmail) {
  const ROLE_PRINT = {
    admin: { label: 'SUPER STOCKIST', emoji: '_ADMIN', idKey: 'admin_id' },
    dealer: { label: 'DISTRIBUTOR', emoji: '_DEALER', idKey: 'dealer_id' },
    sub_dealer: { label: 'WHOLESALE DEALER', emoji: '_SUB_DEALER', idKey: 'sub_dealer_id' },
    promotor: { label: 'RETAILER', emoji: '_PROMOTOR', idKey: 'promotor_id' },
    customer: { label: 'CUSTOMER', emoji: '_CUSTOMER', idKey: 'customer_id' },
  }

  // Full chain: Super Admin + ancestors + current
  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: role, data: node },
  ]

  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1

    if (item.type === 'super_admin') {
      return `
        <div class="chain-item ${isLast ? 'current' : ''}">
          <div class="chain-role" style="display:flex;align-items:center;gap:5px;">${svgIconMarkup('shield', '#CCA881', 13)} SUPER ADMIN</div>
          <div class="chain-email">${item.data.email || ''}</div>
        </div>
        ${idx < chain.length - 1 ? `<div class="chain-arrow"><div style="display:flex;flex-direction:column;align-items:center;gap:0px;"><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid #7A8987;"></div><div style="width:2px;height:12px;background:linear-gradient(180deg,#7A8987,rgba(122,137,135,0.2));"></div></div></div>` : ''}      `
    }

    const r = ROLE_PRINT[item.type]
    if (!r) return ''
    const d = item.data || {}
    const idVal = d[r.idKey] || d.id || ''
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || ''
    const phone = d.mobile_number || ''
    const city = d.city_name || ''

    return `
      <div class="chain-item ${isLast ? 'current' : ''}">
        <div class="chain-role">${r.emoji} ${r.label}</div>
        <div class="chain-id">${idVal}</div>
        <div class="chain-name">${name}</div>
        <div class="chain-info" style="display:flex;align-items:center;gap:5px;">${svgIconMarkup('phone', '#7A8987', 12)} ${phone}</div>
        <div class="chain-info" style="display:flex;align-items:center;gap:5px;">${svgIconMarkup('pin', '#7A8987', 12)} ${city}</div>
      </div>
      ${idx < chain.length - 1 ? `<div class="chain-arrow"><div style="display:flex;flex-direction:column;align-items:center;gap:0px;"><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid #7A8987;"></div><div style="width:2px;height:12px;background:linear-gradient(180deg,#7A8987,rgba(122,137,135,0.2));"></div></div></div>` : ''}
    `
  }).join('')

  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || ''
  const roleLabel = ROLE_PRINT[role]?.label || role.toUpperCase()

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${roleLabel} ${currentName}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: #FDFDFC;
          padding: 40px;
          display: flex; justify-content: center;
        }
        .wrapper {
          max-width: 480px; width: 100%;
        }
        .header {
          text-align: center;
          margin-bottom: 28px;
        }
        .header h1 {
          font-size: 20px; font-weight: 800; color: #FDFDFC;
        }
        .header p {
          font-size: 12px; color: #7A8987; margin-top: 4px;
        }
        .chain-item {
          background: #FDFDFC;
          border: 1.5px solid #E7EDEC;
          border-radius: 12px;
          padding: 14px 18px;
        }
        .chain-item.current {
          border-color: ${color};
          background: ${color}11;
          box-shadow: 0 4px 16px ${color}22;
        }
        .chain-role {
          font-size: 10px; font-weight: 800;
          color: #7A8987; letter-spacing: 1px;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .chain-item.current .chain-role {
          color: ${color};
        }
        .chain-id {
          font-family: monospace; font-size: 11px;
          color: ${color}; margin-bottom: 4px;
        }
        .chain-name {
          font-size: 16px; font-weight: 800;
          color: #FDFDFC; margin-bottom: 6px;
        }
        .chain-email {
          font-size: 12px; color: #7A8987;
        }
        .chain-info {
          font-size: 12px; color: #7A8987;
          margin-top: 3px;
        }
        .chain-arrow {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}
.chain-arrow::before {
  content: '';
  display: flex;
  flex-direction: column;
  align-items: center;
}
        .footer {
          text-align: center;
          font-size: 10px; color: #7A8987;
          margin-top: 24px; letter-spacing: 0.5px;
        }
        @media print {
          body { background: white; padding: 20px; }
          .chain-item { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>BitByte ${roleLabel} Profile</h1>
          <p>Hierarchy Chain Report</p>
        </div>
        ${chainHtml}
        <div class="footer">
          Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <script>window.onload = () => { window.print() }<\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

function showChainPopup(anchorEl, ancestors, current, dark, text, subtext, superAdminEmail) {
  if (typeof window !== 'undefined' && window.innerWidth <= 860) return
  clearTimeout(_chainHideTimer)
  removeChainPopup()

  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: current.role, data: current.node },
  ]

  const el = document.createElement('div')
  el.id = 'chain-popup'

  // Inject scrollbar styles once
  if (!document.getElementById('chain-popup-styles')) {
    const s = document.createElement('style')
    s.id = 'chain-popup-styles'
    s.textContent = `
      #chain-popup::-webkit-scrollbar{width:6px}
      #chain-popup::-webkit-scrollbar-track{background:rgba(253,253,252,0.03);border-radius:10px;margin:4px 0}
      #chain-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#BDCFCE,#0C4044);border-radius:10px;box-shadow:0 0 6px rgba(189,207,206,0.4)}
      #chain-popup::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#D1DFDE,#073B3F)}
      #chain-popup{scrollbar-color:rgba(189,207,206,0.5) rgba(253,253,252,0.03)}
    `
    document.head.appendChild(s)
  }

  const isDark = dark
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${isDark ? 'rgba(7,59,63,0.97)' : 'rgba(248,250,252,0.98)'};
    border:1px solid ${isDark ? 'rgba(189,207,206,0.22)' : 'rgba(12,64,68,0.18)'};
    border-radius:20px; padding:20px;
    box-shadow:${isDark
      ? '0 32px 80px rgba(17,24,23,0.85), 0 0 0 1px rgba(189,207,206,0.06), inset 0 1px 0 rgba(253,253,252,0.04)'
      : '0 32px 80px rgba(17,24,23,0.15), 0 0 0 1px rgba(12,64,68,0.05)'};
    animation:acpSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
    min-width:200px; max-width:260px;
    max-height:85vh; overflow-y:auto; overflow-x:hidden;
    scroll-behavior:smooth; scrollbar-width:thin;
    scroll-padding:8px;
    -webkit-overflow-scrolling:touch;
    backdrop-filter:blur(28px);
    font-family:'Inter',system-ui,sans-serif;
  `

  const totalNodes = chain.length

  const itemsHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const isSuperAdmin = item.type === 'super_admin'

const arrowHtml = idx > 0 ? `
  <div style="display:flex;justify-content:center;padding:5px 0;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:7px solid rgba(189,207,206,0.5);"></div>
      <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(189,207,206,0.1),rgba(189,207,206,0.65));"></div>
    </div>
  </div>` : ''

    if (isSuperAdmin) {
      return `
        ${arrowHtml}
        <div style="
          border-radius:14px;padding:14px 16px;
          background:${isDark ? 'linear-gradient(135deg,rgba(204,168,129,0.09),rgba(187,137,88,0.04))' : 'linear-gradient(135deg,rgba(204,168,129,0.14),rgba(187,137,88,0.06))'};
          border:1px solid rgba(204,168,129,0.28);
          position:relative;overflow:hidden;
        ">
          <div style="position:absolute;top:-10px;right:-10px;width:70px;height:70px;background:radial-gradient(circle,rgba(204,168,129,0.14),transparent 70%);pointer-events:none;"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#CCA881,#BB8958);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(204,168,129,0.35);">${svgIconMarkup('shield', '#FDFDFC', 15)}</div>
            <div>
              <div style="font-size:9px;color:#CCA881;font-weight:800;letter-spacing:1.8px;">SUPER ADMIN</div>
              <div style="font-size:8px;color:rgba(204,168,129,0.45);margin-top:2px;letter-spacing:0.5px;">ROOT â€¢ FULL ACCESS</div>
            </div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:5px;">
              <div style="width:7px;height:7px;border-radius:50%;background:#0C4044;animation:acpPulse 1.8s ease-in-out infinite;box-shadow:0 0 8px rgba(12,64,68,0.9);"></div>
              <span style="font-size:9px;color:#0C4044;font-weight:700;">LIVE</span>
            </div>
          </div>
          <div style="font-size:12px;color:${isDark ? '#111817' : '#7A8987'};word-break:break-all;font-family:monospace;letter-spacing:0.3px;">${item.data.email || ''}</div>
        </div>
      `
    }

    const cfg = ROLE_LABELS[item.type]
    if (!cfg) return ''
    const d = item.data || {}
    const idVal = d[cfg.idKey] || d.id || ''
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || ''
    const phone = d.mobile_number || ''
    const city = d.city_name || ''
    const rc = hexToRgb(cfg.color)

    return `
      ${arrowHtml}
      <div style="
        border-radius:14px;padding:14px 16px;
        background:${isLast
        ? `linear-gradient(135deg,rgba(${rc},0.13),rgba(${rc},0.05))`
        : `rgba(${rc},0.04)`};
        border:${isLast
        ? `1.5px solid rgba(${rc},0.55)`
        : `1px solid rgba(${rc},0.16)`};
        position:relative;overflow:hidden;
        ${isLast ? `animation:acpGlow 3s ease-in-out infinite;` : ''}
      ">
        ${isLast ? `<div style="position:absolute;top:-15px;right:-15px;width:80px;height:80px;background:radial-gradient(circle,rgba(${rc},0.18),transparent 70%);pointer-events:none;"></div>` : ''}

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">
          <div style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,${cfg.color},rgba(${rc},0.45));display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;box-shadow:0 4px 12px rgba(${rc},0.3);">${cfg.emoji}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:9px;color:${cfg.color};font-weight:800;letter-spacing:1.8px;">${cfg.label}</div>
            <div style="font-size:9px;color:${cfg.color};font-family:monospace;opacity:0.6;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idVal}</div>
          </div>
          ${isLast ? `
          <div style="font-size:8px;font-weight:800;padding:3px 9px;border-radius:20px;
            background:rgba(${rc},0.18);color:${cfg.color};
            border:1px solid rgba(${rc},0.4);
            animation:acpBadgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
            white-space:nowrap;letter-spacing:0.5px;">â— CURRENT</div>` : ''}
        </div>

        <div style="font-size:14px;color:${isDark ? '#E7EDEC' : '#111817'};font-weight:700;margin-bottom:9px;letter-spacing:-0.3px;">${name}</div>

        <div style="display:flex;flex-direction:column;gap:6px;">
          ${phone ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${svgIconMarkup('phone', cfg.color, 11)}</div>
            <span style="font-size:12px;color:${isDark ? '#7A8987' : '#7A8987'};">${phone}</span>
          </div>` : ''}
          ${city ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${svgIconMarkup('pin', cfg.color, 11)}</div>
            <span style="font-size:12px;color:${isDark ? '#7A8987' : '#7A8987'};">${city}</span>
          </div>` : ''}
        </div>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid ${isDark ? 'rgba(189,207,206,0.1)' : 'rgba(12,64,68,0.08)'};">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#BDCFCE,#0C4044);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(189,207,206,0.4);">${svgIconMarkup('link', '#FDFDFC', 13)}</div>
        <div>
          <div style="font-size:11px;color:${isDark ? '#BDCFCE' : '#0C4044'};font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:${isDark ? '#7A8987' : '#7A8987'};margin-top:2px;">${totalNodes} level${totalNodes !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <div style="
        font-size:9px;font-weight:800;padding:4px 11px;border-radius:20px;
        background:linear-gradient(90deg,rgba(189,207,206,0.15),rgba(12,64,68,0.12),rgba(189,207,206,0.15));
        background-size:200% auto;
        animation:acpShimmer 2.5s linear infinite;
        border:1px solid rgba(189,207,206,0.22);
        color:${isDark ? '#D1DFDE' : '#0C4044'};
        letter-spacing:1px;">â— LIVE</div>
    </div>

    ${itemsHtml}

    <div style="margin-top:14px;padding-top:12px;border-top:1px solid ${isDark ? 'rgba(253,253,252,0.04)' : 'rgba(17,24,23,0.05)'};">
      <div style="font-size:9px;color:${isDark ? '#7A8987' : '#111817'};text-align:center;letter-spacing:0.8px;font-weight:600;">BitByte Network â€¢ Hierarchy View</div>
    </div>
  `

  document.body.appendChild(el)

  const rect = anchorEl.getBoundingClientRect()
  const popW = 280
  const popH = Math.min(el.scrollHeight || 460, window.innerHeight * 0.85)
  let left = rect.right + 18
  let top = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth - 12) left = rect.left - popW - 18
  if (top < 12) top = 12
  if (top + popH > window.innerHeight - 12) top = window.innerHeight - popH - 12
  el.style.left = left + 'px'
  el.style.top = top + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_chainHideTimer))
  el.addEventListener('mouseleave', () => scheduleHideChainPopup())
  _chainPopupEl = el
}

function removeAdminPopup() {
  document.querySelectorAll('#admin-popup').forEach(el => el.remove())
  _popupEl = null
}

function scheduleHidePopup(setActiveAdmin) {
  clearTimeout(_hideTimer)
  _hideTimer = setTimeout(() => {
    removeAdminPopup()
    setActiveAdmin(null)
  }, 120)
}

function createAdminPopup(a, i, anchorEl, dark, subtext, text) {
  removeAdminPopup()
  const c = COLORS[i % COLORS.length]
  const popupBg = dark ? 'linear-gradient(160deg,#F3F3F0,#E7EDEC)' : 'linear-gradient(160deg,#FDFDFC,#E7EDEC)'
  const popupBorder = dark ? 'rgba(189,207,206,0.25)' : 'rgba(12,64,68,0.25)'
  const saBoxBg = dark ? 'rgba(204,168,129,0.05)' : 'rgba(204,168,129,0.08)'
  const saBoxBorder = dark ? 'rgba(204,168,129,0.22)' : 'rgba(204,168,129,0.35)'
  const adminBoxBg = dark ? 'rgba(189,207,206,0.04)' : 'rgba(12,64,68,0.05)'
  const adminBoxBd = dark ? 'rgba(189,207,206,0.14)' : 'rgba(12,64,68,0.2)'
  const accentColor = dark ? '#BDCFCE' : '#0C4044'

  const el = document.createElement('div')
  el.id = 'admin-popup'
  el.style.cssText = `
  position:fixed; z-index:9999;
  background:${popupBg}; border:1px solid ${popupBorder};
  border-radius:14px; padding:14px;
  box-shadow:0 16px 48px rgba(17,24,23,0.45);
  animation:popupIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
  min-width:200px; max-width:240px;
  max-height:82vh;
  overflow-y:auto;
  overflow-x:hidden;
  scroll-behavior:smooth;
  scrollbar-width:thin;
  scrollbar-color:rgba(189,207,206,0.4) transparent;
`
  el.innerHTML = `
    <div style="font-size:9px;color:${accentColor};font-weight:700;letter-spacing:1.3px;margin-bottom:11px;padding-bottom:9px;border-bottom:1px solid ${popupBorder};display:flex;align-items:center;gap:6px;">
      <span style="width:5px;height:5px;border-radius:50%;background:${accentColor};display:inline-block;"></span>
      CREATED BY
    </div>
    <div style="border-radius:9px;padding:11px;margin-bottom:10px;background:${saBoxBg};border:1px solid ${saBoxBorder};">
      <div style="font-size:9px;color:#CCA881;font-weight:700;margin-bottom:5px;display:flex;align-items:center;gap:5px;">${svgIconMarkup('shield', '#CCA881', 12)} SUPER ADMIN</div>
      <div style="font-size:11px;color:${subtext};word-break:break-all;">${localStorage.getItem('email')}</div>
      <div style="margin-top:6px;font-size:9px;padding:2px 8px;background:rgba(204,168,129,0.1);border:1px solid rgba(204,168,129,0.25);border-radius:20px;color:#CCA881;display:inline-block;">â— ONLINE</div>
    </div>
    <div style="display:flex;justify-content:center;align-items:center;padding:4px 0;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid ${accentColor};"></div>
        <div style="width:2px;height:7px;background:linear-gradient(180deg,${accentColor},${accentColor}44);"></div>
      </div>
    </div>
    <div style="background:${adminBoxBg};border:1px solid ${adminBoxBd};border-radius:10px;padding:11px;">
      <div style="display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(189,207,206,0.12);color:#BDCFCE;border:1px solid rgba(189,207,206,0.25);margin-bottom:6px;">SUPER STOCKIST</div>
      <div style="font-size:10px;color:${c};font-family:monospace;margin-bottom:3px;">${a.admin_id}</div>
      <div style="font-size:13px;color:${text};font-weight:700;margin-bottom:6px;">${a.first_name}</div>
      <div style="font-size:11px;color:${subtext};margin-bottom:3px;display:flex;align-items:center;gap:5px;">${svgIconMarkup('phone', '${subtext}', 12)} ${a.mobile_number}</div>
      <div style="font-size:11px;color:${subtext};display:flex;align-items:center;gap:5px;">${svgIconMarkup('pin', '${subtext}', 12)} ${a.city_name}</div>
    </div>
  `
  document.body.appendChild(el)

  const rect = anchorEl.getBoundingClientRect()
  const popW = el.offsetWidth || 230
  const popH = el.offsetHeight || 220
  let left = rect.right + 14
  let top = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth - 10) left = rect.left - popW - 14
  if (top < 8) top = 8
  if (top + popH > window.innerHeight - 8) top = window.innerHeight - popH - 8
  el.style.left = left + 'px'
  el.style.top = top + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_hideTimer))
  el.addEventListener('mouseleave', () => scheduleHidePopup(setActiveAdmin))
  _popupEl = el
}


// â”€â”€â”€ ORDER TREND CHART clean area chart, peak marker, no duplicate axis â”€â”€
function OrderTrendChart({ dark }) {
  const [period, setPeriod] = useState('today')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const requestSequence = useRef(0)

  const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: '7D' },
    { key: 'month', label: '1M' },
    { key: '3month', label: '3M' },
    { key: 'year', label: '1Y' },
    { key: 'all', label: 'All' },
  ]

  const formatFullLabel = (iso) => {
    const d = new Date(iso)
    const datePart = d.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
    const timePart = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    return { datePart, timePart }
  }

  const formatAxisLabel = (iso, p) => {
    const d = new Date(iso)
    if (p === 'today') return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    if (p === 'week' || p === 'month' || p === '3month') return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }

  const completeChartSeries = (rows, p) => {
    const grouped = new Map()
    ;(rows || []).forEach(d => {
      const label = formatAxisLabel(d.time, p)
      const existing = grouped.get(label)
      if (existing) {
        existing.count += Number(d.count || 0)
      } else {
        grouped.set(label, {
          ...d,
          count: Number(d.count || 0),
          label,
          full: formatFullLabel(d.time),
        })
      }
    })
    return Array.from(grouped.values()).sort((a, b) => new Date(a.time) - new Date(b.time))
  }

  const getFallbackSeries = (p) => {
    if (p === 'today') {
      return ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM', '9 PM'].map(l => ({ label: l, count: 0 }))
    }
    if (p === 'week') {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(l => ({ label: l, count: 0 }))
    }
    if (p === 'month') {
      return ['1st', '5th', '10th', '15th', '20th', '25th', '30th'].map(l => ({ label: l, count: 0 }))
    }
    if (p === '3month') {
      return ['Jul', 'Aug', 'Sep'].map(l => ({ label: l, count: 0 }))
    }
    if (p === 'year') {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(l => ({ label: l, count: 0 }))
    }
    return ['2024', '2025', '2026'].map(l => ({ label: l, count: 0 }))
  }

  const fetchData = async (p = period) => {
    const requestId = ++requestSequence.current
    setLoading(true)
    try {
      const res = await api.get('/order-timeseries/', { params: { period: p } })
      if (requestId !== requestSequence.current) return
      let formatted = completeChartSeries(res.data.data || [], p)
      if (!formatted || formatted.length === 0) {
        formatted = getFallbackSeries(p)
      }
      setData(formatted)
    } catch {
      if (requestId !== requestSequence.current) return
      setData(getFallbackSeries(p))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }

  useEffect(() => { fetchData('today') }, [])

  const CustomDarkTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const p = payload[0].payload
    return (
      <div style={{
        background: '#073B3F',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '7px 14px',
        boxShadow: '0 8px 24px rgba(7,59,63,0.35)',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.12)'
      }}>
        <div style={{ fontWeight: 800, fontSize: '13px' }}>{p.count} orders</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{p.full?.timePart || p.label}</div>
      </div>
    )
  }

  const chartData = data.length > 0 ? data : getFallbackSeries(period)

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E2EAE8',
      padding: '22px 24px',
      boxShadow: '0 4px 18px rgba(7,59,63,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(12,64,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0C4044' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#0C4044', fontSize: '16px', fontWeight: 800 }}>Order Volume</div>
            <div style={{ color: '#7A8987', fontSize: '12px', marginTop: '2px' }}>Total orders overview</div>
          </div>
        </div>

        {/* Filter Pills with Subtle Sync Pulse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading && (
            <span className="sa-loading-badge" style={{ padding: '2px 8px', fontSize: '10px' }}>
              <span className="sa-loading-dot" /> Live
            </span>
          )}
          <div style={{ display: 'flex', background: '#F4F7F6', borderRadius: '20px', padding: '3px', gap: '2px' }}>
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => { setPeriod(p.key); fetchData(p.key) }}
                style={{
                  background: period === p.key ? '#073B3F' : 'transparent',
                  color: period === p.key ? '#FFFFFF' : '#5A6A68',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '5px 12px',
                  fontSize: '11.5px',
                  fontWeight: period === p.key ? 700 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas: Always Smooth Spline, Never Blank */}
      <div style={{ width: '100%', height: '235px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="refOrderGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#009957" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#009957" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
            <XAxis dataKey="label" stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
            <YAxis stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomDarkTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#009957"
              strokeWidth={2.4}
              fill="url(#refOrderGrad)"
              dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AnimatedNumber({ value, prefix = '₹ ', suffix = '' }) {
  const [displayVal, setDisplayVal] = useState(Number(value || 0))
  const animRef = useRef(null)
  const currentValRef = useRef(Number(value || 0))

  useEffect(() => {
    const startVal = currentValRef.current
    const endVal = Number(value || 0)
    if (startVal === endVal) return

    const duration = 500
    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (endVal - startVal) * ease)
      currentValRef.current = current
      setDisplayVal(current)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        currentValRef.current = endVal
        setDisplayVal(endVal)
      }
    }
    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [value])

  return <span>{prefix}{displayVal.toLocaleString('en-IN')}{suffix}</span>
}
export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dark = false
  const [admins, setAdmins] = useState([])
  const [adminActionOpen, setAdminActionOpen] = useState(null)
  const [selectedAdminDetail, setSelectedAdminDetail] = useState(null)
  const [copiedAdminId, setCopiedAdminId] = useState(null)
  const [hierarchyData, setHierarchyData] = useState(null)
  const [hierarchyLoading, setHierarchyLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showHierarchy, setShowHierarchy] = useState(false)
  const [hierarchyFilter, setHierarchyFilter] = useState(null)
 const [hierarchySearch, setHierarchySearch] = useState('')
const [debouncedSearch, setDebouncedSearch] = useState('')

// Debounce typing niruthi 300ms aana appuram than search run aagum
useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(hierarchySearch.trim()), 120)
  return () => clearTimeout(t)
}, [hierarchySearch])
  const [activeAdmin, setActiveAdmin] = useState(null)
  const hideTimer = useRef(null)
  const [msg, setMsg] = useState('')
  const [liveTime, setLiveTime] = useState(new Date())
  const [allMembersList, setAllMembersList] = useState([])
  const [rawOrders, setRawOrders] = useState([])
  const [userGrowthPeriod, setUserGrowthPeriod] = useState('month')
  const [profitPeriod, setProfitPeriod] = useState('month')
  const [activeSalesProfitTab, setActiveSalesProfitTab] = useState('profit') // 'profit' | 'sales'
  const [userGrowthLoading, setUserGrowthLoading] = useState(false)
  const [salesProfitLoading, setSalesProfitLoading] = useState(false)
  const [userGrowthStats, setUserGrowthStats] = useState({ total: 0, newUsers: 0, activeUsers: 0 })
  const [userGrowthChartData, setUserGrowthChartData] = useState([])
  const [salesProfitData, setSalesProfitData] = useState({
    allSales: 1420000,
    athiraiProfit: 1050000,
    companyRev73: 1036600,
    balanceComm: 213000,
    superAdminComm: 14200,
    genCustRev: 56800,
    monthlyTrend: [
      { name: 'Jul', profit: 924000, sales: 1250000 },
      { name: 'Aug', profit: 672000, sales: 910000 },
      { name: 'Sep', profit: 798000, sales: 1080000 },
    ],
    profitBreakdown: [
      { name: '73% Athirai Sales', value: 73, color: '#009957', pct: '73%' },
      { name: 'Balance Commission', value: 15, color: '#BB8958', pct: 'Pool' },
      { name: 'Super Admin Share', value: 8, color: '#073B3F', pct: '1%' },
      { name: 'General Customer', value: 4, color: '#3E7C82', pct: 'Direct' },
    ],
    salesBreakdown: [
      { name: '22K Gold Jewelry', value: 58, color: '#009957', pct: '58%' },
      { name: '24K Bullion / Coins', value: 24, color: '#BB8958', pct: '24%' },
      { name: '999 Fine Silver', value: 12, color: '#3E7C82', pct: '12%' },
      { name: 'Direct / Digital Orders', value: 6, color: '#073B3F', pct: '6%' },
    ],
    breakdown: [
      { name: '73% Athirai Sales', value: 73, color: '#009957', pct: '73%' },
      { name: 'Balance Commission', value: 15, color: '#BB8958', pct: 'Pool' },
      { name: 'Super Admin Share', value: 8, color: '#073B3F', pct: '1%' },
      { name: 'General Customer', value: 4, color: '#3E7C82', pct: 'Direct' },
    ]
  })

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])


    const [form, setForm] = useState({
    initial: '', first_name: '', last_name: '', mobile_number: '',
    gender: 'male', dob: '', married_status: 'single', anniversary_date: '',
    door_no: '', street_name: '', town_name: '', pincode: '',
    city_name: '', district: '', state: '', email: '', password: '',
    aadhaar_no: '', pan_no: '', occupation: 'employee', occupation_detail: '',
    annual_salary: '', admin_name: '', admin_id: '', admin_contact_no: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [adminSuccessPopup, setAdminSuccessPopup] = useState(null)
  const [adminErrorPopup, setAdminErrorPopup] = useState(null)
  const [copiedPopupAdminId, setCopiedPopupAdminId] = useState(false)

  const parseAdminErrorDetails = (err) => {
    const data = err?.response?.data
    if (!data) return ['An unexpected network error occurred. Please check your connection and try again.']
    if (typeof data === 'string') {
      if (data.includes('<html') || data.includes('<!DOCTYPE')) {
        return ['Server error occurred. Please contact system support.']
      }
      return [data]
    }
    if (Array.isArray(data)) {
      return data.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
    }
    if (typeof data === 'object') {
      const messages = []
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
        detail: 'System Notice',
        non_field_errors: 'Authentication Error',
      }
      Object.entries(data).forEach(([key, val]) => {
        const readableKey = fieldNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        if (Array.isArray(val)) {
          val.forEach((m) => messages.push(`${readableKey}: ${typeof m === 'object' ? JSON.stringify(m) : m}`))
        } else if (typeof val === 'object' && val !== null) {
          messages.push(`${readableKey}: ${JSON.stringify(val)}`)
        } else {
          messages.push(`${readableKey}: ${val}`)
        }
      })
      return messages.length > 0 ? messages : ['Validation failed. Please verify the entered information.']
    }
    return ['An unexpected error occurred while creating admin.']
  }
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', roles: [] })
  const [announcementMsg, setAnnouncementMsg] = useState('')
  const [announcingSending, setAnnouncingSending] = useState(false)
  const [announcementCount, setAnnouncementCount] = useState(0)
  const [showMyAnnouncements, setShowMyAnnouncements] = useState(false)
  const [showRequests, setShowRequests] = useState(false)
  const [profileRequests, setProfileRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestMsg, setRequestMsg] = useState('')
  const [proofModal, setProofModal] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [proofType, setProofType] = useState('')
  const [proofLoading, setProofLoading] = useState(false)
  const [showBirthdayList, setShowBirthdayList] = useState(false)
  const [showAnniversaryList, setShowAnniversaryList] = useState(false)
  const [showJoinDateList, setShowJoinDateList] = useState(false)
  const [birthdayList, setBirthdayList] = useState([])
  const [anniversaryList, setAnniversaryList] = useState([])
  const [joinDateList, setJoinDateList] = useState([])
  const [specialAnnForm, setSpecialAnnForm] = useState({ title: '', message: '', roles: [] })
  const [showSpecialAnn, setShowSpecialAnn] = useState(false)
  const [specialAnnMsg, setSpecialAnnMsg] = useState('')
  const [specialAnnSending, setSpecialAnnSending] = useState(false)


  const [replyAnn, setReplyAnn] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyMsg, setReplyMsg] = useState('')
  const [repliedIds, setRepliedIds] = useState(new Set())
  const [annReplies, setAnnReplies] = useState({})
  const [replyPopupAnnId, setReplyPopupAnnId] = useState(null)
  const [metalPrices, setMetalPrices] = useState({
  gold22k: null, gold24k: null, silver: null,
  diamond18k: null, diamond22k: null, platinum92: null,
})
  const [showTodayRates, setShowTodayRates] = useState(false)
  const [metalLoading, setMetalLoading] = useState(false)
  const [usdToInr, setUsdToInr] = useState(null)

  // move superadmin model
  const [showRatePopup, setShowRatePopup] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [productForm, setProductForm] = useState({
    category: '', metal: '', grade: '', name: '', description: '',
    weight_grams: '', tag: '',
  })


  const [showRequestCoin, setShowRequestCoin] = useState(false)
const [coinRequests, setCoinRequests] = useState([])
const [coinReqLoading, setCoinReqLoading] = useState(false)
const [approvingReqId, setApprovingReqId] = useState(null)
const [approvingAll, setApprovingAll] = useState(false)
const [coinReqMsg, setCoinReqMsg] = useState('')
const [coinReqMsgType, setCoinReqMsgType] = useState('success')
const [rejectingReqId, setRejectingReqId] = useState(null)
const [rejectReason, setRejectReason] = useState('')
const [rejectSubmitting, setRejectSubmitting] = useState(false)
const [showAddCoin, setShowAddCoin] = useState(false)
const [coinCart, setCoinCart] = useState([])
const [coinBuyMsg, setCoinBuyMsg] = useState('')
const [coinBuySubmitting, setCoinBuySubmitting] = useState(false)
const [selCoinMetal, setSelCoinMetal] = useState('gold_22k')
const [selCoinWeight, setSelCoinWeight] = useState('')
const [selCoinQty, setSelCoinQty] = useState('')
const [showStoredCoin, setShowStoredCoin] = useState(false)
const [coinStock, setCoinStock] = useState([])
const [coinStockLoading, setCoinStockLoading] = useState(false)


  const [productImages, setProductImages] = useState([])  // File objects
  const [productPreviewUrls, setProductPreviewUrls] = useState([])  // preview URLs
  const [productMsg, setProductMsg] = useState('')
  const [productSaving, setProductSaving] = useState(false)
  const [previewImageIdx, setPreviewImageIdx] = useState(null) // for lightbox
  const [livePrice, setLivePrice] = useState(null)
  const [rateForm, setRateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    gold_22k: '',
    gold_24k: '',
    silver_999: '',
    diamond_18k: '',
    diamond_22k: '',
    platinum_92: '',
  })
  const [rateMsg, setRateMsg] = useState('')
  const [rateSaving, setRateSaving] = useState(false)
  const [dbRateDate, setDbRateDate] = useState(null)
  const [orderStats, setOrderStats] = useState({
    today: { gold_22k: { count: 0, grams: 0, amount: 0 }, gold_24k: { count: 0, grams: 0, amount: 0 }, silver_999: { count: 0, grams: 0, amount: 0 } },
    week: { gold_22k: { count: 0, grams: 0, amount: 0 }, gold_24k: { count: 0, grams: 0, amount: 0 }, silver_999: { count: 0, grams: 0, amount: 0 } },
    month: { gold_22k: { count: 0, grams: 0, amount: 0 }, gold_24k: { count: 0, grams: 0, amount: 0 }, silver_999: { count: 0, grams: 0, amount: 0 } },
  })

  const [orderDetails, setOrderDetails] = useState({
    today: { gold_22k: {}, gold_24k: {}, silver_999: {} },
    week: { gold_22k: {}, gold_24k: {}, silver_999: {} },
    month: { gold_22k: {}, gold_24k: {}, silver_999: {} },
  })


  const bg = '#FDFDFC'
  const text = '#111817'
  const subtext = '#7A8987'
  const accent = '#0C4044'
  const border = 'rgba(189,207,206,0.78)'
  const glass = 'rgba(253,253,252,0.94)'
  const cardBg = 'rgba(253,253,252,0.97)'
  const cardBorder = '1px solid rgba(189,207,206,0.72)'
  const inpBg = '#FDFDFC'
  const inpBorder = '#BDCFCE'
  const optionBg = '#F3F3F0'
  const selectInput = { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }


  // AFTER
const fetchAdmins = async () => {
  try {
    const res = await api.get('/admins/')
    const payload = res.data
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload?.admins)
          ? payload.admins
          : []
    setAdmins(rows)
    return rows
  } catch (error) {
    console.warn('Admin list fetch failed', error.response?.status || error.message)
    setAdmins([])
    return []
  }
}

  // AFTER
const fetchAnnouncementCount = (data) => {
  const lastSeen = parseInt(localStorage.getItem('superAdminAnnouncementSeen') || '0')
  const unread = data.filter(a => new Date(a.created_at).getTime() > lastSeen).length
  setAnnouncementCount(unread)
}

  // AFTER
const [myAnnouncements, setMyAnnouncements] = useState([])

const fetchMyAnnouncements = async (data = null) => {
  try {
    const res = data ? { data } : await api.get('/announcements/')
    const sorted = [...res.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setMyAnnouncements(sorted)
    return res.data
  } catch { return [] }
}


  // AFTER
const fetchAllMembers = async (adminsData = []) => {
  try {
    const [dealerRes, sdRes, proRes, cusRes] = await Promise.allSettled([
      api.get('/dealers/list/'),
      api.get('/sub-dealers/list/'),
      api.get('/promotors/list/'),
      api.get('/customers/'),
    ])
    const admins = adminsData
        const dealers = dealerRes.status === 'fulfilled' ? (dealerRes.value.data?.results || dealerRes.value.data || []) : []
    const sds = sdRes.status === 'fulfilled' ? (sdRes.value.data?.results || sdRes.value.data || []) : []
    const pros = proRes.status === 'fulfilled' ? (proRes.value.data?.results || proRes.value.data || []) : []
    const cuss = cusRes.status === 'fulfilled' ? (cusRes.value.data?.results || cusRes.value.data || []) : []

      const allMembers = [
        ...admins.map(m => ({ ...m, _role: 'Super Stockist', _id: m.admin_id, _roleColor: '#BDCFCE', _dob: m.dob, _ann: m.anniversary_date, _joined: m.user?.created_at || null })),
        ...dealers.map(m => ({ ...m, _role: 'Distributor', _id: m.dealer_id, _roleColor: '#0C4044', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...sds.map(m => ({ ...m, _role: 'Wholesale Dealer', _id: m.sub_dealer_id, _roleColor: '#BB8958', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...pros.map(m => ({ ...m, _role: 'Retailer', _id: m.promotor_id, _roleColor: '#CCA881', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...cuss.map(m => ({ ...m, _role: 'Customer', _id: m.customer_id, _roleColor: '#C92035', _dob: m.dob || null, _ann: m.anniversary_date || null, _joined: m.user?.created_at || m.created_at || null })),
      ]
      setAllMembersList(allMembers)
      fetchUserGrowth(userGrowthPeriod, allMembers)


      // REPLACE WITH:
      const today = new Date()
      const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      // Helper: parse YYYY-MM-DD without timezone shift
      function parseDateLocal(str) {
        if (!str) return null
        const [y, m, d] = str.split('-').map(Number)
        return new Date(y, m - 1, d)
      }

      // BIRTHDAY LIST
      const bdays = allMembers.filter(m => {
        if (!m._dob) return false
        const d = parseDateLocal(m._dob)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      })
      setBirthdayList(bdays)

      // ANNIVERSARY LIST
      const anns = allMembers.filter(m => {
        if (!m._ann) return false
        const d = parseDateLocal(m._ann)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      })
      setAnniversaryList(anns)

      // JOIN DATE LIST
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

    } catch (e) { console.error('fetchAllMembers error:', e) }
  }

  const fetchProfileRequests = async () => {
    try {
      const res = await api.get('/profile-update-request/')
      setProfileRequests(res.data)
    } catch (err) {
      setRequestMsg('âŒ Failed to load requests')
    }
  }

  const approveProfileRequest = async (id) => {
    try {
      await api.post(`/profile-update-request/${id}/approve/`)
      setRequestMsg('âœ… Request approved successfully!')
      setSelectedRequest(null)
      fetchProfileRequests()
      fetchAdmins()
      fetchHierarchy()
    } catch (err) {
      setRequestMsg('âŒ Approve failed: ' + JSON.stringify(err.response?.data))
    }
  }


  const fetchHierarchy = async () => {
    setHierarchyLoading(true)
    try {
      const res = await api.get('/hierarchy/full/')
      setHierarchyData(res.data)
    } catch (err) {
      console.error('Hierarchy fetch error:', err)
    }
    setHierarchyLoading(false)
  }

  const [loginStatus, setLoginStatus] = useState({ active_count: 0, inactive_count: 0 })
const [quickStats, setQuickStats] = useState(() => {
  const defaults = { yesterday_orders: 0, today_orders: 0, today_new_customers: 0, active_users: 0, admins: 0, dealers: 0, sub_dealers: 0, promotors: 0, customers: 0, today_inactive_count: 0 }
  try {
    const cached = localStorage.getItem('sa_quick_stats')
    return cached ? { ...defaults, ...JSON.parse(cached) } : defaults
  } catch {
    return defaults
  }
})
const [quickStatsLoading, setQuickStatsLoading] = useState(true)   // ✅ NEW
  const fetchLoginStatus = async () => {
    try {
      const res = await api.get('/today-login-status/')
      setLoginStatus(res.data)
    } catch (err) {
      console.error('Login status fetch error:', err)
    }
  }

const fetchQuickStats = async () => {
  setQuickStatsLoading(true)                                       // ✅ NEW
  try {
    const res = await api.get('/dashboard-quick-stats/')
    setQuickStats(res.data)
    localStorage.setItem('sa_quick_stats', JSON.stringify(res.data))
  } catch (e) {
    console.error('quick stats fetch error:', e)
  } finally {
    setQuickStatsLoading(false)                                    // ✅ NEW
  }
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

  const formatWeight = (grams) => {
    if (grams < 1) {
      return `${(grams * 1000).toFixed(2)} mg`
    }
    return `${grams.toFixed(2)} gm`
  }

  const fetchOrderStats = async () => {
    try {
      const res = await api.get('/metal-orders/')
      const orders = res.data

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - dayOfWeek + 1)
      weekStart.setHours(0, 0, 0, 0)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const empty = () => ({ count: 0, grams: 0, amount: 0 })
      const stats = {
        today: { gold_22k: empty(), gold_24k: empty(), silver_999: empty() },
        week: { gold_22k: empty(), gold_24k: empty(), silver_999: empty() },
        month: { gold_22k: empty(), gold_24k: empty(), silver_999: empty() },
      }

      // â”€â”€ NEW: per-customer breakdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const details = {
        today: { gold_22k: {}, gold_24k: {}, silver_999: {} },
        week: { gold_22k: {}, gold_24k: {}, silver_999: {} },
        month: { gold_22k: {}, gold_24k: {}, silver_999: {} },
      }

      orders.forEach(order => {
        const d = new Date(order.created_at)
        const m = order.metal_type
        if (!stats.today[m]) return
        const grams = parseFloat(order.weight_grams) * parseInt(order.count)
        const amount = parseFloat(order.total_amount)
        const cnt = parseInt(order.count)
        const custId = order.customer_id

        const inMonth = d >= monthStart
        const inWeek = d >= weekStart
        const inToday = d >= todayStart

        if (inMonth) {
          stats.month[m].count += cnt; stats.month[m].grams += grams; stats.month[m].amount += amount
          if (custId) {
            if (!details.month[m][custId]) {
              details.month[m][custId] = { customer_id: custId, email: order.email, count: 0, amount: 0 }
            }
            details.month[m][custId].count += cnt
            details.month[m][custId].amount += amount
          }
        }
        if (inWeek) {
          stats.week[m].count += cnt; stats.week[m].grams += grams; stats.week[m].amount += amount
          if (custId) {
            if (!details.week[m][custId]) {
              details.week[m][custId] = { customer_id: custId, email: order.email, count: 0, amount: 0 }
            }
            details.week[m][custId].count += cnt
            details.week[m][custId].amount += amount
          }
        }
        if (inToday) {
          stats.today[m].count += cnt; stats.today[m].grams += grams; stats.today[m].amount += amount
          if (custId) {
            if (!details.today[m][custId]) {
              details.today[m][custId] = { customer_id: custId, email: order.email, count: 0, amount: 0 }
            }
            details.today[m][custId].count += cnt
            details.today[m][custId].amount += amount
          }
        }
      })

      setRawOrders(orders)
      setOrderStats(stats)
      setOrderDetails(details)
      fetchSalesProfit(profitPeriod, orders)
    } catch (e) {
      console.error('fetchOrderStats error:', e)
    }
  }

   const calcLivePrice = (weight, metal, grade) => {
    if (!weight || !metal) { setLivePrice(null); return }
    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0) { setLivePrice(null); return }
    let rate = null
    if (metal === 'gold') {
      rate = grade === '22k' ? metalPrices.gold22k : metalPrices.gold24k
    } else if (metal === 'silver') {
      rate = metalPrices.silver
    }
    if (rate) setLivePrice((w * rate).toFixed(2))
    else setLivePrice(null)
  }


  const totalUsers = useMemo(() => {
    return (quickStats.admins || 0) + (quickStats.dealers || 0) + (quickStats.sub_dealers || 0) + (quickStats.promotors || 0) + (quickStats.customers || 0)
  }, [quickStats])

  const formatRelativeTime = (iso) => {
    if (!iso) return 'Recently'
    const diffMs = Date.now() - new Date(iso).getTime()
    if (diffMs < 0 || isNaN(diffMs)) return 'Just now'
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} mins ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hrs ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }

  const userGrowthData = useMemo(() => {
    const total = totalUsers || 0

    if (userGrowthPeriod === 'day') {
      const hours = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM']
      const todayNew = quickStats.today_new_customers || 0
      return hours.map((h, i) => ({
        month: h,
        users: Math.round(Math.max(1, (todayNew / hours.length) * (i + 1)))
      }))
    }

    if (userGrowthPeriod === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const currentDayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
      return days.map((d, i) => {
        const factor = (i + 1) / (days.length)
        const val = Math.round(total * (0.85 + 0.15 * factor))
        return { month: d, users: i <= currentDayIdx ? val : Math.round(total * 0.95) }
      })
    }

    if (userGrowthPeriod === 'month') { // Default
      const intervals = ['1st', '5th', '10th', '15th', '20th', '25th', '30th']
      const dayOfMonth = new Date().getDate()
      const currentIntervalIdx = Math.min(Math.floor(dayOfMonth / 5), intervals.length - 1)
      return intervals.map((inv, i) => {
        const factor = (i + 1) / intervals.length
        const val = Math.round(total * (0.7 + 0.3 * factor))
        return { month: inv, users: i <= currentIntervalIdx ? val : total }
      })
    }

    if (userGrowthPeriod === '3month') {
      const d = new Date()
      const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const last3 = [
        mNames[(d.getMonth() - 2 + 12) % 12],
        mNames[(d.getMonth() - 1 + 12) % 12],
        mNames[d.getMonth()],
      ]
      return last3.map((m, i) => ({
        month: m,
        users: Math.round(total * (0.65 + 0.35 * ((i + 1) / 3)))
      }))
    }

    if (userGrowthPeriod === '6month') {
      const d = new Date()
      const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const last6 = []
      for (let i = 5; i >= 0; i--) {
        last6.push(mNames[(d.getMonth() - i + 12) % 12])
      }
      return last6.map((m, i) => ({
        month: m,
        users: Math.round(total * (0.45 + 0.55 * ((i + 1) / 6)))
      }))
    }

    // Default 'year'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyCounts = new Array(12).fill(0)
    let foundDates = false

    if (allMembersList && allMembersList.length > 0) {
      allMembersList.forEach(m => {
        if (m._joined) {
          const d = new Date(m._joined)
          if (!isNaN(d.getTime())) {
            monthlyCounts[d.getMonth()]++
            foundDates = true
          }
        }
      })
    }

    if (foundDates) {
      let accum = 0
      return months.map((m, idx) => {
        accum += monthlyCounts[idx]
        return { month: m, users: accum }
      })
    }

    const currentMonthIdx = new Date().getMonth()
    return months.map((m, idx) => {
      if (idx > currentMonthIdx) return { month: m, users: total }
      const factor = (idx + 1) / (currentMonthIdx + 1)
      const val = Math.round(total * (0.32 + 0.68 * factor))
      return { month: m, users: Math.min(val, total) }
    })
  }, [allMembersList, totalUsers, userGrowthPeriod, quickStats.today_new_customers])

  // Helper: compute real sales and profit from Neon DB orders
  const computeRealSalesProfit = (list, p) => {
    const ordersList = list || []
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek + 1)
    weekStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    let filtered = ordersList
    if (p === 'today') {
      filtered = ordersList.filter(o => new Date(o.created_at) >= todayStart)
    } else if (p === 'week') {
      filtered = ordersList.filter(o => new Date(o.created_at) >= weekStart)
    } else if (p === 'month') {
      filtered = ordersList.filter(o => new Date(o.created_at) >= monthStart)
    } else if (p === 'past_month') {
      filtered = ordersList.filter(o => {
        const d = new Date(o.created_at)
        return d >= prevMonthStart && d <= prevMonthEnd
      })
    } else if (p === 'year') {
      filtered = ordersList.filter(o => new Date(o.created_at) >= yearStart)
    }

    const totalSales = filtered.reduce((acc, o) => acc + (parseFloat(o.total_amount || o.total_price || 0) || 0), 0)
    const companyRev73 = Math.round(totalSales * 0.73)
    const balanceComm = Math.round(totalSales * 0.15)
    const superAdminComm = Math.round(totalSales * 0.01)
    const genCustRev = Math.round(totalSales * 0.11)
    const athiraiProfit = companyRev73 + balanceComm + superAdminComm

    const metalMap = {
      gold_22k: { name: '22K Gold Jewelry', value: 0, color: '#009957' },
      gold_24k: { name: '24K Bullion / Coins', value: 0, color: '#BB8958' },
      silver_999: { name: '999 Fine Silver', value: 0, color: '#3E7C82' },
      other: { name: 'Direct / Digital Orders', value: 0, color: '#073B3F' },
    }
    filtered.forEach(o => {
      const amt = parseFloat(o.total_amount || o.total_price || 0) || 0
      if (metalMap[o.metal_type]) {
        metalMap[o.metal_type].value += amt
      } else {
        metalMap.other.value += amt
      }
    })

    const salesBreakdown = Object.values(metalMap).map(m => ({
      name: m.name,
      value: Math.round(m.value),
      color: m.color,
      pct: totalSales > 0 ? `${Math.round((m.value / totalSales) * 100)}%` : '0%'
    }))

    const profitBreakdown = [
      { name: '73% Athirai Sales', value: companyRev73, color: '#009957', pct: '73%' },
      { name: 'Balance Commission', value: balanceComm, color: '#BB8958', pct: '15%' },
      { name: 'Super Admin Share', value: superAdminComm, color: '#073B3F', pct: '1%' },
      { name: 'General Customer', value: genCustRev, color: '#3E7C82', pct: '11%' },
    ]

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let monthlyTrend = []
    if (p === 'today') {
      const slots = ['9 AM', '12 PM', '3 PM', '6 PM', '9 PM']
      const slotMap = {}
      slots.forEach(s => { slotMap[s] = { name: s, sales: 0, profit: 0 } })
      filtered.forEach(o => {
        const hr = new Date(o.created_at).getHours()
        const amt = parseFloat(o.total_amount || o.total_price || 0) || 0
        const slot = hr < 12 ? '9 AM' : (hr < 15 ? '12 PM' : (hr < 18 ? '3 PM' : (hr < 21 ? '6 PM' : '9 PM')))
        slotMap[slot].sales += amt
        slotMap[slot].profit += Math.round(amt * 0.89)
      })
      monthlyTrend = Object.values(slotMap)
    } else {
      const currM = now.getMonth()
      const m1 = monthNames[(currM - 2 + 12) % 12]
      const m2 = monthNames[(currM - 1 + 12) % 12]
      const m3 = monthNames[currM]
      const tMap = {
        [m1]: { name: m1, sales: 0, profit: 0 },
        [m2]: { name: m2, sales: 0, profit: 0 },
        [m3]: { name: m3, sales: 0, profit: 0 },
      }
      ordersList.forEach(o => {
        const d = new Date(o.created_at)
        const m = monthNames[d.getMonth()]
        if (tMap[m]) {
          const amt = parseFloat(o.total_amount || o.total_price || 0) || 0
          tMap[m].sales += amt
          tMap[m].profit += Math.round(amt * 0.89)
        }
      })
      monthlyTrend = Object.values(tMap)
    }

    return {
      allSales: totalSales,
      athiraiProfit,
      companyRev73,
      balanceComm,
      superAdminComm,
      genCustRev,
      salesBreakdown,
      profitBreakdown,
      breakdown: profitBreakdown,
      monthlyTrend
    }
  }

  // Fetch real User Growth analytics
  const fetchUserGrowth = async (period = userGrowthPeriod, membersOverride = null) => {
    setUserGrowthLoading(true)
    const members = membersOverride || allMembersList
    try {
      const res = await api.get(`/superadmin/user-growth/?period=${period}`)
      if (res.data && res.data.total_users !== undefined) {
        setUserGrowthStats({
          total: res.data.total_users ?? (members?.length || totalUsers),
          newUsers: res.data.new_users ?? 0,
          activeUsers: res.data.active_users ?? 0,
        })
        if (res.data.chart_data && res.data.chart_data.length > 0) {
          setUserGrowthChartData(res.data.chart_data)
        }
        setUserGrowthLoading(false)
        return
      }
    } catch (e) {
      // Backend on Render returned 404 or failed
    }

    const total = members?.length || totalUsers || 0
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek + 1)
    weekStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const threeMonthStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const sixMonthStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    let cutoff = monthStart
    if (period === 'day') cutoff = todayStart
    else if (period === 'week') cutoff = weekStart
    else if (period === 'month') cutoff = monthStart
    else if (period === '3month') cutoff = threeMonthStart
    else if (period === '6month') cutoff = sixMonthStart
    else if (period === 'year') cutoff = yearStart

    const newUsersCount = (members || []).filter(m => m._joined && new Date(m._joined) >= cutoff).length
    const activeCount = quickStats.active_users || loginStatus.active_count || (newUsersCount > 0 ? newUsersCount : Math.min(total, 5))

    setUserGrowthStats({
      total,
      newUsers: newUsersCount,
      activeUsers: activeCount,
    })
    setUserGrowthLoading(false)
  }

  // Fetch real Sales & Athirai Profit from dedicated backend API with Neon DB fallback
  const fetchSalesProfit = async (period = profitPeriod, ordersOverride = null) => {
    setSalesProfitLoading(true)
    const activeOrders = ordersOverride || rawOrders
    try {
      const res = await api.get(`/superadmin/sales-profit-summary/?period=${period}`)
      if (res.data && res.data.all_sales !== undefined) {
        setSalesProfitData({
          allSales: res.data.all_sales ?? 0,
          athiraiProfit: res.data.athirai_profit ?? 0,
          companyRev73: res.data.company_rev_73 ?? 0,
          balanceComm: res.data.balance_comm ?? 0,
          superAdminComm: res.data.super_admin_share ?? 0,
          genCustRev: res.data.gen_cust_rev ?? 0,
          salesBreakdown: res.data.sales_breakdown || [],
          profitBreakdown: res.data.profit_breakdown || [],
          breakdown: res.data.profit_breakdown || [],
          monthlyTrend: res.data.monthly_trend || [],
        })
        setSalesProfitLoading(false)
        return
      }
    } catch (e) {
      // Backend on Render returned 404 or failed
    }

    if (activeOrders && activeOrders.length > 0) {
      const calculated = computeRealSalesProfit(activeOrders, period)
      setSalesProfitData(calculated)
    } else {
      try {
        const ordRes = await api.get('/metal-orders/')
        const ordList = ordRes.data || []
        setRawOrders(ordList)
        const calculated = computeRealSalesProfit(ordList, period)
        setSalesProfitData(calculated)
      } catch (err) {
        console.error('Real orders fetch fallback error:', err)
      }
    }
    setSalesProfitLoading(false)
  }

  const recentActivities = useMemo(() => {
    const list = []
    if (allMembersList && allMembersList.length > 0) {
      const sorted = [...allMembersList].filter(m => m._joined).sort((a, b) => new Date(b._joined) - new Date(a._joined))
      if (sorted[0]) {
        list.push({
          id: 'u-1',
          icon: 'user',
          title: 'New user registered',
          detail: `${sorted[0].first_name || ''} ${sorted[0].last_name || ''} (${sorted[0]._role || 'Customer'})`,
          time: formatRelativeTime(sorted[0]._joined),
          color: '#10B981',
          bg: '#EAF8F0'
        })
      }
    }
    if (myAnnouncements && myAnnouncements.length > 0) {
      list.push({
        id: 'ann-1',
        icon: 'announcement',
        title: 'Announcement published',
        detail: myAnnouncements[0].title || 'Platform Announcement',
        time: formatRelativeTime(myAnnouncements[0].created_at),
        color: '#E11D48',
        bg: '#FFE4E6'
      })
    }
    if (profileRequests && profileRequests.length > 0) {
      list.push({
        id: 'req-1',
        icon: 'request',
        title: 'Profile update requested',
        detail: `${profileRequests[0].first_name || ''} (${profileRequests[0].role || 'User'})`,
        time: formatRelativeTime(profileRequests[0].created_at),
        color: '#D97706',
        bg: '#FEF3C7'
      })
    }
    if (coinRequests && coinRequests.length > 0) {
      list.push({
        id: 'coin-1',
        icon: 'coin',
        title: 'Coin request activity',
        detail: `${coinRequests[0].metal_type || 'Coin'} • ${coinRequests[0].status || 'Pending'}`,
        time: formatRelativeTime(coinRequests[0].created_at),
        color: '#CA8A04',
        bg: '#FEF9C3'
      })
    }
    if (orderStats?.today?.gold_22k?.count > 0 || orderStats?.today?.gold_24k?.count > 0 || orderStats?.today?.silver_999?.count > 0) {
      list.push({
        id: 'ord-1',
        icon: 'order',
        title: 'Order placed',
        detail: 'Today Metal Order • Active',
        time: 'Today',
        color: '#009957',
        bg: '#E6F7F0'
      })
    }

    if (list.length === 0) {
      list.push(
        { id: 'act-1', icon: 'user', title: 'System Active', detail: 'Super Admin operations monitored', time: 'Just now', color: '#10B981', bg: '#EAF8F0' },
        { id: 'act-2', icon: 'order', title: 'Order pipeline active', detail: 'Listening for transactions', time: '5 mins ago', color: '#009957', bg: '#E6F7F0' }
      )
    }
    return list.slice(0, 5)
  }, [allMembersList, myAnnouncements, profileRequests, coinRequests, orderStats])

  // AFTER
// AFTER
useEffect(() => {
  (async () => {
    const adminsData = await fetchAdmins()
    fetchAllMembers(adminsData)
  })()
  ;(async () => {
    const annData = await fetchMyAnnouncements()
    fetchAnnouncementCount(annData)
  })()
  fetchProfileRequests()
  fetchMetalPrices()
  fetchOrderStats()
  fetchLoginStatus()
  fetchQuickStats()
  fetchCoinRequests()
  fetchUserGrowth()
  fetchSalesProfit()
}, [])

useEffect(() => {
  fetchUserGrowth(userGrowthPeriod)
}, [userGrowthPeriod])

useEffect(() => {
  fetchSalesProfit(profitPeriod)
}, [profitPeriod])


  const handleOpenHierarchy = () => {
  setShowHierarchy(true)
  setHierarchyFilter(null)
  setHierarchySearch('')
  fetchHierarchy()
}

  useEffect(() => {
    fetchMetalPrices()
    const open = searchParams.get('open')
    if (!open) return
    if (open === 'birthday') setShowBirthdayList(true)
    else if (open === 'anniversary') setShowAnniversaryList(true)
    else if (open === 'joindate') setShowJoinDateList(true)
    else if (open === 'rate') setShowRatePopup(true)
    else if (open === 'today-rates' || open === 'gold-rate') { setShowTodayRates(true); fetchMetalPrices() }
    else if (open === 'requests') { setShowRequests(true); setRequestMsg('') }
    else if (open === 'announcement') { setShowAnnouncement(true); setAnnouncementMsg('') }
    else if (open === 'myannouncements') { setShowMyAnnouncements(true); fetchMyAnnouncements() }
  }, [searchParams])

    const handleChange = e => {
    const { name, value } = e.target

    if (name === 'married_status' && value !== 'married') {
      setForm({ ...form, married_status: value, anniversary_date: '' })
      return
    }

    setForm({ ...form, [name]: value })
  }

  const [pincodeLookupMsg, setPincodeLookupMsg] = useState('')

    const handlePincodeChange = async (e) => {
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
            city_name: po.District || prev.city_name,
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

    if (!form.email || !form.email.includes('@')) {
      setAdminErrorPopup({
        title: 'Invalid Email Address',
        errors: ['Please provide a valid, properly formatted email address (e.g. name@domain.com).']
      })
      return
    }

    if (form.password !== confirmPassword) {
      setPasswordError('❌ Passwords do not match')
      setAdminErrorPopup({
        title: 'Password Mismatch',
        errors: ['The entered password and confirmation password do not match. Please re-enter them carefully.']
      })
      return
    }

    try {
      const cleanedForm = {
        ...form,
        dob: form.dob || null,
        anniversary_date: form.anniversary_date || null,
        admin_name: undefined,
        admin_id: undefined,
        admin_contact_no: undefined,
      }

      console.log('📤 SENDING:', JSON.stringify(cleanedForm, null, 2))

      const res = await api.post('/admins/', cleanedForm)
      const newAdminId = res.data?.admin_id || ''
      const createdAdminName = `${form.first_name} ${form.last_name}`.trim()

      setAdminSuccessPopup({
        title: 'Admin Created Successfully!',
        admin_id: newAdminId,
        name: createdAdminName,
        email: form.email,
        mobile: form.mobile_number,
        city: form.city_name,
      })

      setMsg('✅ Admin created successfully!')
      setShowForm(false)
      setForm({
        initial: '', first_name: '', last_name: '', mobile_number: '',
        gender: 'male', dob: '', married_status: 'single', anniversary_date: '',
        door_no: '', street_name: '', town_name: '', pincode: '',
        city_name: '', district: '', state: '', email: '', password: '',
        aadhaar_no: '', pan_no: '', occupation: 'employee', occupation_detail: '',
        annual_salary: '', admin_name: '', admin_id: '', admin_contact_no: ''
      })
      setConfirmPassword('')
      setPasswordError('')
      fetchAdmins()
    } catch (err) {
      const errors = parseAdminErrorDetails(err)
      setAdminErrorPopup({
        title: 'Admin Creation Failed',
        errors,
      })
      setMsg('❌ Error: ' + errors[0])
    }
  }

  const s = {
    card: { background: cardBg, border: cardBorder, borderRadius: '22px', padding: '34px 38px', marginBottom: '26px', boxShadow: dark ? '0 26px 70px rgba(17,24,23,0.18)' : '0 22px 58px rgba(7,59,63,0.08)', backdropFilter: 'blur(18px)' },
    secHead: { color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px', paddingBottom: '14px', borderBottom: cardBorder },
    secSub: { color: '#0C4044', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 0', paddingBottom: '10px', borderBottom: cardBorder },
    lbl: { display: 'block', color: subtext, fontSize: '10.5px', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    inp: { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 13px', color: text, fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' },
    sectionCard: { background: '#FDFDFC', border: '1px solid rgba(189,207,206,0.55)', borderRadius: '16px', padding: '22px 24px', marginBottom: '4px' },
  }

  // Count total members
  const totalStats = hierarchyData ? {
    admins: hierarchyData.admins.length,
    dealers: hierarchyData.admins.reduce((a, ad) => a + ad.dealers.length, 0),
    subDealers: hierarchyData.admins.reduce((a, ad) => a + ad.dealers.reduce((b, d) => b + d.sub_dealers.length, 0), 0),
    promotors: hierarchyData.admins.reduce((a, ad) => a + ad.dealers.reduce((b, d) => b + d.sub_dealers.reduce((c, sd) => c + sd.promotors.length, 0), 0), 0),
    customers: hierarchyData.admins.reduce((a, ad) => a + ad.dealers.reduce((b, d) => b + d.sub_dealers.reduce((c, sd) => c + sd.promotors.reduce((e, pr) => e + pr.customers.length, 0), 0), 0), 0),
  } : null


  const COIN_METAL_LABELS_TEXT = { gold_22k: 'Gold 22K', gold_24k: 'Gold 24K', silver_999: 'Silver 999' }
const COIN_WEIGHTS_GOLD = [
  { label: '50 mg', grams: 0.05 }, { label: '100 mg', grams: 0.10 }, { label: '150 mg', grams: 0.15 },
  { label: '200 mg', grams: 0.20 }, { label: '500 mg', grams: 0.50 }, { label: '1 gm', grams: 1 },
  { label: '2 gm', grams: 2 }, { label: '4 gm', grams: 4 }, { label: '8 gm', grams: 8 },
]
const COIN_WEIGHTS_SILVER = [
  { label: '500 mg', grams: 0.50 }, { label: '1 gm', grams: 1 }, { label: '2 gm', grams: 2 },
  { label: '5 gm', grams: 5 }, { label: '10 gm', grams: 10 }, { label: '20 gm', grams: 20 },
  { label: '50 gm', grams: 50 }, { label: '100 gm', grams: 100 },
]

const fetchCoinRequests = async () => {
  setCoinReqLoading(true)
  try {
    const res = await api.get('/coin-requests/')
    setCoinRequests(res.data)
  } catch { setCoinRequests([]) }
  setCoinReqLoading(false)
}

const approveCoinRequest = async (reqId) => {
  setApprovingReqId(reqId)
  setCoinReqMsg('')
  try {
    await api.post(`/coin-requests/${reqId}/approve/`)
    setCoinReqMsgType('success')
    setCoinReqMsg('Request approved successfully.')
    fetchCoinRequests()
  } catch (err) {
    setCoinReqMsgType('error')
    setCoinReqMsg('Failed to approve request. Please try again.')
  }
  setApprovingReqId(null)
}

const approveAllCoinRequests = async () => {
  setApprovingAll(true)
  setCoinReqMsg('')
  try {
    await api.post('/coin-requests/approve-all/')
    setCoinReqMsgType('success')
    setCoinReqMsg('All requests approved successfully.')
    fetchCoinRequests()
  } catch (err) {
    setCoinReqMsgType('error')
    setCoinReqMsg('Failed to approve requests. Please try again.')
  }
  setApprovingAll(false)
}

const rejectCoinRequest = async (reqId) => {
  if (!rejectReason.trim()) {
    setCoinReqMsgType('error')
    setCoinReqMsg('Please enter a reason for rejection.')
    return
  }
  setRejectSubmitting(true)
  setCoinReqMsg('')
  try {
    await api.post(`/coin-requests/${reqId}/reject/`, { message: rejectReason.trim() })
    setCoinReqMsgType('success')
    setCoinReqMsg('Request rejected successfully.')
    setRejectingReqId(null)
    setRejectReason('')
    fetchCoinRequests()
  } catch (err) {
    setCoinReqMsgType('error')
    setCoinReqMsg('Failed to reject request. Please try again.')
  }
  setRejectSubmitting(false)
}

const addToCoinCart = () => {
  if (!selCoinWeight || !selCoinQty || Number(selCoinQty) < 1) {
    setCoinBuyMsg('error:Please select weight and quantity')
    return
  }
  const weightsArr = selCoinMetal === 'silver_999' ? COIN_WEIGHTS_SILVER : COIN_WEIGHTS_GOLD
  const w = weightsArr.find(x => x.label === selCoinWeight)
  if (!w) return
  setCoinCart(prev => [...prev, { metal_type: selCoinMetal, weight_label: w.label, weight_grams: w.grams, qty: Number(selCoinQty) }])
  setSelCoinWeight('')
  setSelCoinQty('')
  setCoinBuyMsg('')
}

const removeCoinCartItem = (idx) => {
  setCoinCart(prev => prev.filter((_, i) => i !== idx))
}

const submitAddCoins = async () => {
  if (coinCart.length === 0) {
    setCoinBuyMsg('error:Add at least one item to the cart')
    return
  }
  setCoinBuySubmitting(true)
  try {
    await api.post('/coin-stock/add/', { items: coinCart })
    setCoinBuyMsg('success:Coins added to your stock!')
    setCoinCart([])
    setTimeout(() => { setShowAddCoin(false); setCoinBuyMsg('') }, 1400)
  } catch (err) {
    setCoinBuyMsg('error:' + (err.response?.data?.error || 'Failed to add coins'))
  }
  setCoinBuySubmitting(false)
}

const fetchCoinStock = async () => {
  setCoinStockLoading(true)
  try {
    const res = await api.get('/coin-stock/')
    setCoinStock(res.data)
  } catch { setCoinStock([]) }
  setCoinStockLoading(false)
}

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: text, transition: 'background 0.8s ease, color 0.4s ease', fontFamily: '"Manrope","Inter",system-ui,sans-serif', position: 'relative' }}>
      <SuperAdminNavbar
        onGoldRate={() => setShowRatePopup(true)}
        onTodayRates={() => setShowTodayRates(true)}
        onAddCoins={() => { setShowAddCoin(true); setCoinCart([]); setCoinBuyMsg('') }}
        onRequests={() => { setShowRequests(true); setRequestMsg('') }}
        onBirthdays={() => setShowBirthdayList(true)}
        onAnniversaries={() => setShowAnniversaryList(true)}
        onWorkAnniversaries={() => setShowJoinDateList(true)}
        onSendAnnouncement={() => { setShowAnnouncement(true); setAnnouncementMsg('') }}
        onMyAnnouncements={() => { setShowMyAnnouncements(true); fetchMyAnnouncements() }}
      />
      <style>{`
        .lux-display{font-family:"Cormorant Garamond",Georgia,serif;letter-spacing:0;color:#073B3F}
        .lux-ui{font-family:"Manrope","Inter",system-ui,sans-serif}
        .lux-side-item{height:48px;border-radius:12px;display:flex;align-items:center;gap:12px;padding:0 16px;color:#0C4044;font-weight:800;font-size:14px;letter-spacing:.01em;cursor:pointer;transition:all .24s ease}
        .lux-side-item:hover{background:#E7EDEC;transform:translateX(3px)}
        .lux-side-item.is-active{background:linear-gradient(135deg,#0C4044,#073B3F);color:#FDFDFC;box-shadow:0 14px 32px rgba(7,59,63,.18)}
        .lux-command{min-height:52px;border-radius:14px}
        .sa-top-shell{position:sticky;top:0;margin-left:286px;z-index:30;background:rgba(253,253,252,.98);border-bottom:1px solid rgba(189,207,206,.7);box-shadow:0 18px 42px rgba(7,59,63,.06);backdrop-filter:blur(16px)}
        .sa-menu-bar{height:96px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;padding:0 34px;box-sizing:border-box}
        .sa-menu-center{height:100%;display:flex;align-items:center;justify-content:center;gap:42px}
        .sa-menu-group{height:100%;display:flex;align-items:center;gap:10px;color:#073B3F;font-family:"Cormorant Garamond",Georgia,serif;font-size:17px;font-weight:900;letter-spacing:.03em;text-transform:uppercase;cursor:pointer;position:relative;white-space:nowrap}
        .sa-menu-trigger{height:100%;display:flex;align-items:center;gap:10px;border:0;background:transparent;color:inherit;font:inherit;text-transform:inherit;letter-spacing:inherit;cursor:pointer;padding:0}
        .sa-menu-group svg{transition:transform .2s ease}
        .sa-menu-group:hover svg,.sa-menu-group:focus-within svg{transform:rotate(180deg)}
        .sa-menu-dropdown{position:absolute;top:82px;left:50%;min-width:286px;background:#FDFDFC;border:1px solid rgba(189,207,206,.78);border-radius:16px;box-shadow:0 28px 70px rgba(7,59,63,.14);padding:22px 24px 20px;opacity:0;visibility:hidden;transform:translate(-50%,10px);transition:opacity .22s ease,transform .22s ease,visibility .22s ease;z-index:40}
        .sa-menu-dropdown::before{content:"";position:absolute;left:50%;top:-8px;width:16px;height:16px;background:#FDFDFC;border-left:1px solid rgba(189,207,206,.78);border-top:1px solid rgba(189,207,206,.78);transform:translateX(-50%) rotate(45deg)}
        .sa-menu-dropdown.is-wide{min-width:340px}
        .sa-menu-group:hover .sa-menu-dropdown,.sa-menu-group:focus-within .sa-menu-dropdown{opacity:1;visibility:visible;transform:translate(-50%,0)}
        .sa-menu-title{display:flex;align-items:center;gap:12px;margin-bottom:18px;color:#073B3F;font-family:"Cormorant Garamond",Georgia,serif;font-size:25px;font-weight:900;line-height:1;text-transform:none;letter-spacing:0}
        .sa-menu-mark{color:#BB8958;font-family:"Cormorant Garamond",Georgia,serif;font-size:24px;font-weight:900}
        .sa-menu-link{display:flex;align-items:center;justify-content:space-between;width:100%;text-align:left;border:0;background:transparent;color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;font-size:13px;font-weight:850;letter-spacing:.055em;text-transform:uppercase;padding:11px 0;border-bottom:1px solid rgba(204,168,129,.22);cursor:pointer;transition:color .18s ease,transform .18s ease,padding-left .18s ease}
        .sa-menu-link:last-of-type{border-bottom:0}
        .sa-menu-link:hover{color:#0C4044;transform:translateX(3px);padding-left:4px}
        .sa-menu-foot{margin-top:16px;width:100%;min-height:42px;border-radius:999px;border:1px solid rgba(187,137,88,.42);background:linear-gradient(135deg,#F3E8DE,#FDFDFC);color:#073B3F;font-family:"Manrope","Inter",system-ui,sans-serif;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:all .18s ease}
        .sa-menu-foot:hover{background:#0C4044;color:#FDFDFC;border-color:#0C4044;box-shadow:0 14px 28px rgba(7,59,63,.16)}
        .sa-menu-right{height:100%;display:flex;align-items:center;border-left:1px solid rgba(189,207,206,.55)}
        .sa-top-action{height:100%;min-width:150px;padding:0 28px;border:0;border-right:1px solid rgba(189,207,206,.55);background:transparent;color:#BB8958;font-weight:900;font-size:14px;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;transition:background .2s ease,color .2s ease}
        .sa-top-action:hover{background:#F3F3F0;color:#073B3F}
        .sa-top-action.is-danger{color:#C92035}
        .sa-old-navbar{display:none!important}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 8px rgba(189,207,206,0.15);}50%{box-shadow:0 0 22px rgba(189,207,206,0.35);}}
        @keyframes dotPulse{0%,100%{transform:scale(1);opacity:0.7;}50%{transform:scale(1.6);opacity:1;}}
        @keyframes popupIn{from{opacity:0;transform:translateY(8px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .sa-inp:focus{border-color:#BDCFCE !important}
        .sa-grad-btn{position:relative;overflow:hidden}
        .sa-grad-btn::after{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(253,253,252,.2),transparent);transform:translateX(-100%)}
        .sa-grad-btn:hover::after{animation:shimmer 1s infinite}
        .sa-tr:hover td{background:rgba(253,253,252,.02)}
        @keyframes acpSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes acpPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
        @keyframes acpGlow{0%,100%{box-shadow:0 0 0px rgba(189,207,206,0)}50%{box-shadow:0 0 20px rgba(189,207,206,0.22)}}
        @keyframes acpShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes acpBadgePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}

        .h-card{background:rgba(253,253,252,0.03);border:1px solid rgba(165,243,252,0.18);border-radius:14px;padding:14px 18px;min-width:140px;cursor:pointer;position:relative;overflow:hidden;transition:background 0.35s ease,border-color 0.35s ease,transform 0.4s cubic-bezier(0.34,1.4,0.64,1),box-shadow 0.35s ease;}
        .h-card.h-active{background:rgba(189,207,206,0.07);border-color:rgba(189,207,206,0.65);transform:translateY(-6px) scale(1.02);box-shadow:0 12px 32px rgba(189,207,206,0.18);animation:pulseGlow 2.5s ease-in-out infinite;}
        .tree-node-enter{animation:fadeIn 0.4s ease both;}
        .sa-sidebar{position:fixed;inset:0 auto 0 0;width:286px;z-index:25;background:rgba(253,253,252,0.96);border-right:1px solid rgba(189,207,206,0.72);box-shadow:22px 0 54px rgba(7,59,63,0.06);padding:28px 18px;display:flex;flex-direction:column;box-sizing:border-box}
        .sa-main-offset{margin-left:286px;width:calc(100% - 286px)}
        .sa-navbar{position:sticky;top:0;z-index:20;background:${glass};border-bottom:1px solid ${border};padding:18px 28px;display:flex;align-items:center;justify-content:space-between;gap:18px;backdrop-filter:blur(16px);transition:background .8s ease;box-shadow:0 16px 34px rgba(7,59,63,.04)}
        .sa-search{flex:1 1 280px!important;max-width:440px!important;min-width:220px;height:52px!important;border-radius:16px;border:1px solid rgba(189,207,206,.82);background:#FDFDFC;display:flex;align-items:center;gap:12px;padding:0 18px;box-shadow:inset 0 1px 0 rgba(253,253,252,.9)}
        .sa-search span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#7A8987;font-weight:600;font-size:14px}
        .sa-navbar-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px!important;flex-wrap:wrap;min-width:0}
        .sa-role-chip{min-height:52px;color:#0C4044;font-weight:900;font-size:14px;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;background:#E7EDEC;border:1px solid #BDCFCE;border-radius:16px;padding:0 18px!important;white-space:nowrap}
        .sa-command-btn{min-height:52px;min-width:116px;padding:0 16px!important;border-radius:14px!important;justify-content:center;white-space:nowrap}
        .sa-command-btn span{line-height:1.15;text-align:left}
        .sa-icon-action{min-width:40px;height:40px;padding:0 11px!important;border-radius:12px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px;flex:0 0 auto}
        .sa-icon-action svg{flex:0 0 auto}
        .sa-icon-action span{white-space:nowrap}
        .sa-logout{height:40px;padding:0 16px!important;white-space:nowrap}
        @media (max-width:1600px){.sa-navbar{align-items:flex-start!important;flex-wrap:wrap}.sa-search{max-width:none!important;flex:1 1 320px!important}.sa-navbar-actions{flex:1 1 100%;justify-content:flex-start!important}}
        @media (max-width:1180px){.sa-navbar{padding:16px 20px!important;gap:14px!important}.sa-role-chip,.sa-command-btn{min-height:46px}.sa-command-btn{min-width:auto}.sa-main-offset{padding-left:20px!important;padding-right:20px!important}}
        @media (max-width:920px){.sa-sidebar{position:relative!important;inset:auto!important;width:100%!important;min-height:0;padding:16px!important;border-right:0!important;border-bottom:1px solid rgba(189,207,206,.72);box-shadow:0 14px 34px rgba(7,59,63,.06)}.sa-sidebar nav{display:flex!important;flex-direction:row!important;gap:8px!important;margin-top:14px!important;overflow-x:auto;padding-bottom:4px}.sa-sidebar .lux-side-item{height:40px;flex:0 0 auto;padding:0 14px}.sa-sidebar > div:last-child{display:none!important}.sa-main-offset{width:100%!important;margin-left:0!important}.sa-navbar{position:sticky!important;margin-left:0!important;width:100%!important;padding:14px 16px!important}}
        @media (max-width:640px){.sa-search{flex-basis:100%!important;min-width:0;height:46px!important}.sa-navbar-actions{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px!important;width:100%}.sa-role-chip,.sa-command-btn,.sa-icon-action,.sa-logout{width:100%;min-width:0}.sa-role-chip{grid-column:span 2;font-size:12px!important;padding:0 10px!important}.sa-command-btn{grid-column:span 2}.sa-command-btn span{font-size:11px!important}.sa-icon-action span{display:none}.sa-logout{grid-column:span 2}}
        .sa-rates-layout{display:grid!important;grid-template-columns:minmax(190px,240px) minmax(0,1fr) minmax(190px,240px);gap:0!important;overflow:visible!important;min-height:0!important}
        .sa-order-summary-panel,.sa-today-orders-panel{width:auto!important;min-width:0!important}.sa-summary-card-title{font-size:12px!important;color:#0C4044!important;letter-spacing:.11em!important}.sa-summary-metal{font-size:12px!important;font-weight:900!important;margin-bottom:7px!important}.sa-summary-row{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:10px!important;padding:3px 0!important}.sa-summary-row span:first-child{font-size:12px!important;color:#53615F!important;font-weight:650!important}.sa-summary-row span:last-child{font-size:13px!important;font-weight:900!important;color:#0C4044!important;text-align:right!important}.sa-summary-block{border-radius:10px!important;padding:7px 8px!important;margin-left:-4px!important;margin-right:-4px!important;transition:background .2s ease,transform .2s ease}.sa-summary-block:hover{background:rgba(189,207,206,.18)!important;transform:translateX(2px)}
        .sa-rates-center{width:auto!important;min-width:0!important;overflow:hidden!important}
        .sa-rates-header{gap:12px;min-width:0;flex-wrap:wrap}
        .sa-rates-header > div:first-child{min-width:0;flex:1 1 280px}
        .sa-rates-meta{flex-wrap:wrap;line-height:1.5}
        .sa-rate-card-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:8px!important;align-items:stretch}
        .sa-rate-card{min-width:0!important;display:flex;flex-direction:column}
        .sa-rate-card img{width:clamp(46px,4.8vw,64px)!important;height:clamp(46px,4.8vw,64px)!important}
        .sa-rate-card > div:first-child{padding:10px 0 6px!important;min-height:74px}
        .sa-rate-card > div:last-child{padding:6px 6px 4px!important;min-width:0}
        .sa-rate-card > div:last-child > div:first-child{font-size:10px!important;padding:2px 7px!important;max-width:100%;white-space:normal}
        .sa-rate-card > div:last-child > div:last-child{font-size:clamp(10px,.75vw,12px)!important;line-height:1.25;white-space:normal;overflow-wrap:anywhere}
        .sa-side-stat-row{gap:10px;align-items:center}
        .sa-side-stat-row span:last-child{margin-left:auto;text-align:right;overflow-wrap:anywhere}
        .sa-today-title{font-size:13px!important;color:#0C4044!important;letter-spacing:.13em!important}
        .sa-today-card{min-width:0!important;border-radius:14px!important;padding:18px 16px!important;background:linear-gradient(145deg,rgba(253,253,252,.98),rgba(243,243,240,.78))!important;box-shadow:0 12px 28px rgba(7,59,63,.07);transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
        .sa-today-card:hover{transform:translateY(-3px);box-shadow:0 18px 38px rgba(7,59,63,.11);border-color:rgba(12,64,68,.26)!important}
        .sa-today-icon{font-size:19px!important;line-height:1;margin-bottom:10px!important}
        .sa-today-metal{font-size:12px!important;font-weight:900!important;letter-spacing:.08em!important;color:#0C4044!important;margin-bottom:14px!important}
        .sa-today-card .sa-side-stat-row{padding:5px 0!important;gap:16px!important}
        .sa-today-card .sa-side-stat-row span:first-child{font-size:13px!important;color:#53615F!important;font-weight:650!important;white-space:nowrap}
        .sa-today-card .sa-side-stat-row span:last-child{font-size:14px!important;color:#BB8958!important;font-weight:900!important;white-space:nowrap}
        .sa-today-divider{height:1px!important;background:rgba(189,207,206,.72)!important;margin:11px 0!important}
                .sa-network-label{font-size:11px!important;color:#53615F!important;font-weight:700!important;letter-spacing:.02em}
        .sa-admin-tools-head{flex-wrap:wrap;gap:14px;filter:none!important;box-shadow:none!important;isolation:isolate}.sa-admin-tools-head > div{flex-wrap:wrap;filter:none!important;box-shadow:none!important}.sa-admin-tools-head button{flex:1 1 180px;justify-content:center;box-shadow:none!important;filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.sa-admin-tools-head + .sa-grad-btn,.sa-admin-tools-head .sa-grad-btn::after{display:none!important}
        .sa-form-grid3{grid-template-columns:repeat(3,1fr)}
        .sa-form-grid2{grid-template-columns:repeat(2,1fr)}
        @media(max-width:900px){.sa-form-grid3{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.sa-form-grid3,.sa-form-grid2{grid-template-columns:1fr}.sa-card,.sectionCard{padding:20px 16px!important}}
        @media (max-width:1340px){.sa-rates-layout{grid-template-columns:minmax(180px,220px) minmax(0,1fr)}.sa-today-orders-panel{grid-column:1/-1;border-left:0!important;border-top:1px solid ${border};display:grid!important;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));align-items:stretch;gap:14px!important}.sa-today-orders-panel > div:first-child,.sa-today-orders-panel > div:last-child{grid-column:1/-1}.sa-rate-card-grid{grid-template-columns:repeat(auto-fit,minmax(88px,1fr))}}
        @media (max-width:980px){.sa-rates-layout{grid-template-columns:1fr}.sa-order-summary-panel,.sa-today-orders-panel{border-right:0!important;border-left:0!important}.sa-order-summary-panel{border-bottom:1px solid ${border};display:grid!important;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));align-items:start;gap:14px!important}.sa-order-summary-panel > div:first-child,.sa-order-summary-panel > div:last-child{grid-column:1/-1}.sa-today-orders-panel{grid-template-columns:repeat(auto-fit,minmax(190px,1fr));border-top:1px solid ${border}}.sa-rates-center{padding:18px 14px!important}.sa-rate-card-grid{grid-template-columns:repeat(auto-fit,minmax(92px,1fr))}}
        @media (max-width:680px){.sa-main-offset{padding-left:12px!important;padding-right:12px!important}.sa-rates-layout{border-radius:16px!important}.sa-order-summary-panel,.sa-today-orders-panel{grid-template-columns:1fr!important;padding:16px 12px!important}.sa-rates-header{align-items:flex-start!important}.sa-rates-header > div:first-child{align-items:flex-start!important}.sa-rates-center{padding:16px 10px!important}.sa-rate-card-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px!important}.sa-rate-card img{width:56px!important;height:56px!important}.sa-admin-tools-head{align-items:stretch!important}.sa-admin-tools-head h2{font-size:19px!important}.sa-admin-tools-head > div{width:100%}.sa-admin-tools-head button{width:100%;padding:11px 14px!important}}
        .sa-sidebar{width:220px!important;padding:28px 12px!important;background:#FFFFFF!important;border-right:1px solid #E4ECEB!important;box-shadow:10px 0 28px rgba(7,59,63,.04)!important}
        .sa-main-offset{margin-left:220px!important;width:calc(100% - 220px)!important}
        .sa-navbar{margin-left:220px!important;width:calc(100% - 220px)!important;padding:20px 26px 14px!important;background:#FFFFFF!important;box-shadow:none!important;border-bottom:0!important}
        .lux-side-item{height:54px!important;border-radius:10px!important;padding:0 18px!important;font-size:13px!important}
        .lux-side-item::before{content:"";width:18px;height:18px;display:inline-block;background:currentColor;mask-size:contain;mask-position:center;mask-repeat:no-repeat;-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat}
        .lux-side-item:nth-child(1)::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M3 11.5 12 4l9 7.5'/%3E%3Cpath d='M5 10.5V20h14v-9.5'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M3 11.5 12 4l9 7.5'/%3E%3Cpath d='M5 10.5V20h14v-9.5'/%3E%3C/svg%3E")}
        .lux-side-item:nth-child(9){display:none!important}
        .sa-sidebar{width:226px!important;padding:26px 10px 18px!important;overflow-y:auto!important;overflow-x:hidden!important;background:#FFFFFF!important;border-right:1px solid #E6EEEE!important;box-shadow:8px 0 24px rgba(7,59,63,.035)!important}
        .sa-sidebar>div:first-child{gap:12px!important;padding:0 14px 25px!important;border-bottom:1px solid #E8EFEE!important}
        .sa-sidebar>div:first-child img{width:48px!important;height:48px!important}
        .sa-sidebar>div:first-child .lux-display{font-size:28px!important;line-height:.95!important;color:#073B3F!important}
        .sa-sidebar>div:first-child .lux-display+div{font-size:10px!important;letter-spacing:.22em!important;margin-top:5px!important;color:#BB8958!important}
        .sa-sidebar nav{gap:9px!important;margin-top:20px!important;padding:0 0 20px!important;border-bottom:1px solid #E8EFEE!important}
        .lux-side-item{height:48px!important;border-radius:9px!important;padding:0 18px!important;font-size:13px!important;font-weight:900!important;color:#0C4044!important;gap:14px!important;text-shadow:0 8px 18px rgba(7,59,63,.08)!important}
        .lux-side-item:hover{background:#F2F6F5!important;transform:none!important}
        .lux-side-item.is-active{height:54px!important;background:linear-gradient(135deg,#004B55,#073B3F)!important;color:#FFFFFF!important;box-shadow:0 16px 30px rgba(0,75,85,.24)!important}
        .lux-side-item::before{content:"";width:18px;height:18px;display:inline-block;background:currentColor;flex:0 0 auto;mask-size:contain;mask-position:center;mask-repeat:no-repeat;-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat}
        .lux-side-item:nth-child(1)::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M3 11.5 12 4l9 7.5'/%3E%3Cpath d='M5 10.5V20h14v-9.5'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M3 11.5 12 4l9 7.5'/%3E%3Cpath d='M5 10.5V20h14v-9.5'/%3E%3C/svg%3E")}
        .lux-side-item:nth-child(2)::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M6 8h12l-1 12H7L6 8z'/%3E%3Cpath d='M9 8V6a3 3 0 016 0v2'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M6 8h12l-1 12H7L6 8z'/%3E%3Cpath d='M9 8V6a3 3 0 016 0v2'/%3E%3C/svg%3E")}
        .lux-side-item:nth-child(3)::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Crect x='5' y='4' width='14' height='17' rx='2'/%3E%3Cpath d='M9 3h6v3H9zM8 11h8M8 15h5'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Crect x='5' y='4' width='14' height='17' rx='2'/%3E%3Cpath d='M9 3h6v3H9zM8 11h8M8 15h5'/%3E%3C/svg%3E")}
        .lux-side-item:nth-child(4)::before,.lux-side-item:nth-child(5)::before,.lux-side-item:nth-child(6)::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'/%3E%3C/svg%3E")}
        .lux-side-item:nth-child(7)::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M4 7l4-3 4 3-4 3-4-3zM12 7l4-3 4 3-4 3-4-3zM8 10l4 3 4-3M4 14l4-3 4 3-4 3-4-3zM12 14l4-3 4 3-4 3-4-3z'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M4 7l4-3 4 3-4 3-4-3zM12 7l4-3 4 3-4 3-4-3zM8 10l4 3 4-3M4 14l4-3 4 3-4 3-4-3zM12 14l4-3 4 3-4 3-4-3z'/%3E%3C/svg%3E")}
        .lux-side-item:nth-child(8)::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M6 3l12 18M18 3L6 21M12 3v18M3 12h18'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2.4'%3E%3Cpath d='M6 3l12 18M18 3L6 21M12 3v18M3 12h18'/%3E%3C/svg%3E")}
        .lux-side-item:nth-child(9){display:none!important}
        .sa-sidebar>div:nth-of-type(2){border-top:0!important;margin-top:0!important;padding:21px 16px 0!important}
        .sa-sidebar>div:nth-of-type(2)>div:first-child{font-size:10px!important;letter-spacing:.04em!important;margin-bottom:18px!important;color:#071A2D!important}
        .sa-sidebar>div:nth-of-type(2)>div:not(:first-child){grid-template-columns:30px 1fr auto!important;gap:10px!important;margin-bottom:17px!important}
        .sa-sidebar>div:nth-of-type(2)>div:not(:first-child)>div:first-child{width:24px!important;height:24px!important;color:#0C4044!important}
        .sa-sidebar>div:nth-of-type(2)>div:not(:first-child)>div:nth-child(2)>div:first-child{font-size:11px!important;color:#0C4044!important;font-weight:750!important;line-height:1.1!important}
        .sa-sidebar>div:nth-of-type(2)>div:not(:first-child)>div:nth-child(2)>div:last-child{font-size:17px!important;color:#071A2D!important;font-weight:900!important;line-height:1.1!important;margin-top:3px!important}
        .sa-sidebar>div:nth-of-type(2)>div:not(:first-child)>div:last-child{font-size:10px!important;color:#009957!important;font-weight:900!important;align-self:end!important;margin-bottom:3px!important}
        .sa-sidebar>div:nth-of-type(3){margin-top:9px!important;border-radius:8px!important;padding:18px 18px!important;border:1px solid #E2EAE9!important;box-shadow:none!important;background:#FFFFFF!important}
        .sa-sidebar>div:nth-of-type(3)>div:first-child{font-size:11px!important;margin-bottom:18px!important;color:#071A2D!important}
        .sa-sidebar>div:nth-of-type(3)>div:nth-child(2){font-size:11px!important;margin-bottom:20px!important}
        .sa-sidebar>div:nth-of-type(3)>div:nth-child(3){font-size:11px!important;margin-bottom:8px!important}
        .sa-sidebar>div:nth-of-type(3)>div:nth-child(4){font-size:11px!important;line-height:1.45!important}
        .sa-sidebar>div:nth-of-type(4){margin-top:auto!important;border-radius:8px!important;padding:28px 22px 24px!important;min-height:222px!important;background:radial-gradient(circle at 78% 18%,rgba(54,197,126,.34),transparent 24%),radial-gradient(circle at 20% 38%,rgba(107,255,184,.24),transparent 18%),linear-gradient(145deg,#004B55,#073B3F)!important;box-shadow:0 18px 32px rgba(0,75,85,.18)!important}
        .sa-sidebar>div:nth-of-type(4)>div:first-child{width:78px!important;height:78px!important;margin:0 auto 20px!important;border-color:rgba(255,255,255,.22)!important;background:rgba(255,255,255,.06)!important}
        .sa-sidebar>div:nth-of-type(4)>div:nth-child(2){font-size:15px!important;text-align:left!important;margin-bottom:10px!important}
        .sa-sidebar>div:nth-of-type(4)>div:nth-child(3){font-size:12px!important;line-height:1.75!important}
        .sa-search{height:44px!important;border-radius:10px!important;max-width:500px!important;box-shadow:none!important}
        .sa-role-chip,.sa-command-btn{height:48px!important;min-height:48px!important;border-radius:9px!important}
        .sa-icon-action,.sa-logout{height:40px!important;border-radius:9px!important;background:#FFFFFF!important;border-color:#E4ECEB!important;color:#0C4044!important}
        .sa-dashboard-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;width:100%}
        .sa-kpi-card{background:#FFFFFF;border:1px solid #E0E9E8;border-radius:10px;padding:22px 24px;min-height:150px;display:flex;gap:20px;align-items:flex-start;box-shadow:none}
        .sa-kpi-icon{width:54px;height:54px;border-radius:10px;display:grid;place-items:center;flex:0 0 auto}
        .sa-kpi-label{font-size:11px;font-weight:900;text-transform:uppercase;color:#0C4044;margin-bottom:12px}
        .sa-kpi-value{font-size:28px;font-weight:900;color:#071A2D;line-height:1}
        .sa-kpi-note{font-size:13px;color:#6E7D7B;margin-top:12px;line-height:1.5}
@keyframes skelShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.sa-kpi-skel-icon{width:54px;height:54px;border-radius:10px;flex:0 0 auto;background:linear-gradient(90deg,#E7EDEC 25%,#F3F3F0 50%,#E7EDEC 75%);background-size:200% 100%;animation:skelShimmer 1.4s ease-in-out infinite}
.sa-kpi-skel-line{border-radius:4px;background:linear-gradient(90deg,#E7EDEC 25%,#F3F3F0 50%,#E7EDEC 75%);background-size:200% 100%;animation:skelShimmer 1.4s ease-in-out infinite}
.sa-pie-skel-title{width:130px;height:14px;border-radius:4px;margin-bottom:10px;background:linear-gradient(90deg,#E7EDEC 25%,#F3F3F0 50%,#E7EDEC 75%);background-size:200% 100%;animation:skelShimmer 1.4s ease-in-out infinite}
.sa-pie-skel-total{width:100px;height:24px;border-radius:4px;margin-bottom:18px;background:linear-gradient(90deg,#E7EDEC 25%,#F3F3F0 50%,#E7EDEC 75%);background-size:200% 100%;animation:skelShimmer 1.4s ease-in-out infinite}
.sa-pie-skel-donut{width:210px;height:210px;border-radius:50%;margin:6px auto;position:relative;background:linear-gradient(90deg,#E7EDEC 25%,#F3F3F0 50%,#E7EDEC 75%);background-size:200% 100%;animation:skelShimmer 1.4s ease-in-out infinite}
.sa-pie-skel-donut::after{content:'';position:absolute;inset:38px;border-radius:50%;background:#FDFDFC}
.sa-pie-skel-legend{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px}
.sa-pie-skel-chip{width:72px;height:12px;border-radius:4px;background:linear-gradient(90deg,#E7EDEC 25%,#F3F3F0 50%,#E7EDEC 75%);background-size:200% 100%;animation:skelShimmer 1.4s ease-in-out infinite}
        .sa-dashboard-row{flex-direction:column!important;gap:14px!important;padding-top:14px!important}
        .sa-pie-row{flex:1 1 auto!important;min-width:0!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:14px!important;width:100%}
        .sa-pie-row>div{border-radius:10px!important;box-shadow:none!important;background:#FFFFFF!important}
        .sa-rates-layout{min-height:auto!important;border-radius:10px!important;margin-bottom:14px!important;background:#FFFFFF!important;box-shadow:none!important}
        .sa-order-summary-panel,.sa-rates-center{display:none!important}
        .sa-today-orders-panel{display:none!important}
        .sa-today-title{grid-column:1/-1;border-bottom:0!important;padding-bottom:0!important;margin-bottom:-10px!important}
        .sa-today-card{border-radius:10px!important;padding:22px 28px!important;background:#FFFFFF!important;border-color:#E0E9E8!important;box-shadow:none!important}
        .sa-network-label{grid-column:1/-1;border-top:1px solid #E0E9E8;padding-top:12px;margin-top:-8px}
        .sa-admin-tools-head{background:#FFFFFF;border:1px solid #E0E9E8;border-radius:12px;padding:18px 20px 16px;margin-bottom:18px!important;display:block!important;box-shadow:0 4px 16px rgba(7,59,63,0.03)}
        .sa-admin-tools-head h2{font-size:13px!important;font-weight:900!important;letter-spacing:0.08em!important;text-transform:uppercase;color:#0C4044;margin:0 0 16px!important}
        .sa-admin-tools-head>div{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:18px!important}
        .sa-admin-tools-head button{height:68px!important;border-radius:10px!important;background:#FFFFFF!important;color:#0C4044!important;border:1px solid #E0E9E8!important;justify-content:flex-start!important;padding:0 24px!important;transition:all .18s ease!important}
        .sa-admin-tools-head button:hover{background:#F7F9F8!important;border-color:rgba(12,64,68,0.3)!important}
        .sa-admin-action-split{grid-column:1/-1!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important;margin-top:6px!important;width:100%!important}
        .sa-admin-action-split button{height:42px!important;border-radius:10px!important;justify-content:center!important;display:flex!important;align-items:center!important;gap:8px!important;font-size:13.5px!important;font-weight:800!important;cursor:pointer!important;border:none!important;padding:0 18px!important;width:100%!important;transition:all .2s ease!important}
        .sa-btn-create-admin{background:#004B55!important;color:#FFFFFF!important;box-shadow:0 6px 18px rgba(0,75,85,0.18)!important}
        .sa-btn-create-admin:hover{background:#073B3F!important;transform:translateY(-1px)!important;box-shadow:0 8px 22px rgba(7,59,63,0.24)!important}
        .sa-btn-create-customer{background:#073B3F!important;color:#FFFFFF!important;box-shadow:0 6px 18px rgba(7,59,63,0.18)!important}
        .sa-btn-create-customer:hover{background:#004B55!important;transform:translateY(-1px)!important;box-shadow:0 8px 22px rgba(0,75,85,0.24)!important}
        .sa-admin-table-card{border-radius:10px!important;padding:18px 20px!important;background:#FFFFFF!important;box-shadow:none!important}
        .sa-admin-table-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px}
        .sa-admin-search{height:42px;border:1px solid #E0E9E8;border-radius:8px;min-width:320px;display:flex;align-items:center;gap:10px;padding:0 14px;color:#6E7D7B;font-size:12px}
        .sa-admin-action-cell{position:relative}.sa-admin-action-btn{width:34px;height:34px;border-radius:9px;border:1px solid #D8E3E1;background:#FFFFFF;color:#0C4044;cursor:pointer;font-weight:900;font-size:16px;transition:.2s}.sa-admin-action-btn:hover,.sa-admin-action-btn.is-open{color:#fff;background:#073B3F;border-color:#073B3F;box-shadow:0 10px 22px rgba(7,59,63,.18)}
        .sa-admin-action-menu{position:absolute;z-index:80;top:48px;right:16px;width:220px;padding:8px;border:1px solid rgba(189,207,206,.85);border-radius:14px;background:rgba(255,255,255,.98);box-shadow:0 24px 58px rgba(7,59,63,.2);backdrop-filter:blur(14px)}
        .sa-admin-action-menu button{width:100%;min-height:40px;padding:0 11px;border:0;border-radius:9px;background:transparent;color:#173230;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;font-size:12px;font-weight:750;cursor:pointer}.sa-admin-action-menu button:hover{color:#073B3F;background:#EDF3F1}.sa-admin-action-menu button span:last-child{color:#A2764C}
        .sa-admin-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.sa-admin-detail-item{padding:14px;border:1px solid #E0E9E8;border-radius:11px;background:#F8FAF9}.sa-admin-detail-item small{display:block;margin-bottom:5px;color:#83918F;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.sa-admin-detail-item strong{color:#173230;font-size:13px;overflow-wrap:anywhere}
        @media (max-width:1180px){.sa-dashboard-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sa-admin-tools-head>div{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))!important}.sa-admin-search{min-width:0;width:100%}.sa-admin-table-top{align-items:stretch;flex-direction:column}}
        @media (max-width:768px){.sa-dashboard-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.sa-admin-tools-head>div{grid-template-columns:1fr!important}.sa-kpi-card{padding:14px!important;gap:10px!important;min-height:0!important}.sa-kpi-icon{width:36px!important;height:36px!important}.sa-kpi-icon svg{width:18px!important;height:18px!important}.sa-kpi-label{font-size:9.5px!important;margin-bottom:6px!important}.sa-kpi-value{font-size:20px!important}.sa-kpi-note{font-size:11px!important;margin-top:6px!important}}
        @media (max-width:640px){.sa-admin-action-split{grid-template-columns:1fr!important;gap:10px!important}.sa-admin-tools-head{padding:14px 14px 12px!important}.sa-main-offset{padding:16px 12px 36px!important}}
        @media (max-width:520px){.sa-admin-detail-grid{grid-template-columns:1fr}}
        @media (max-width:920px){.sa-main-offset,.sa-navbar{margin-left:0!important;width:100%!important}.sa-sidebar{width:100%!important}.sa-dashboard-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.sa-navbar{padding:14px 16px!important}.sa-kpi-card{padding:14px!important;gap:10px!important;min-height:0!important}.sa-kpi-icon{width:36px!important;height:36px!important}.sa-kpi-icon svg{width:18px!important;height:18px!important}.sa-kpi-label{font-size:9.5px!important;margin-bottom:6px!important}.sa-kpi-value{font-size:20px!important}.sa-kpi-note{font-size:11px!important;margin-top:6px!important}}
        @media (max-width:420px){.sa-rate-card-grid{grid-template-columns:1fr}.sa-rate-card{min-height:0}.sa-rate-card > div:first-child{min-height:68px}.sa-search span{font-size:12px!important}.sa-navbar-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.sa-role-chip,.sa-command-btn,.sa-logout{grid-column:span 2}.sa-icon-action{height:38px}}


        .sa-pie-row{flex:1 1 100%!important;min-width:0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:24px!important;width:100%!important}
        .sa-pie-card{min-height:420px!important;padding:34px 36px!important;border-radius:18px!important;background:linear-gradient(145deg,#FDFDFC,#F3F3F0)!important;border:1px solid rgba(189,207,206,.78)!important;box-shadow:0 28px 64px rgba(7,59,63,.08)!important}
        .sa-pie-title{font-size:17px!important;font-weight:900!important;color:#0C4044!important;margin-bottom:8px!important}
        .sa-pie-total{font-size:36px!important;margin-bottom:14px!important}
        .sa-pie-legend{gap:18px!important;margin-top:18px!important}
        .sa-pie-legend-dot{width:12px!important;height:12px!important}
        .sa-pie-legend-        .modal-scroll::-webkit-scrollbar{width:0px;background:transparent}
        .modal-scroll{scrollbar-width:none;-ms-overflow-style:none}

        /* ── SaaS Redesign Reference Styles ── */
        .sa-dashboard-container {
          width: 100%;
          max-width: 1540px;
          margin: 0 auto;
          padding: 24px 28px 48px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .sa-welcome-card {
          background: #FFFFFF;
          border-radius: 18px;
          border: 1px solid #E6ECEB;
          padding: 24px 30px;
          box-shadow: 0 4px 20px rgba(7, 59, 63, 0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .sa-welcome-card::after {
          content: '';
          position: absolute;
          right: -20px;
          top: -20px;
          bottom: -20px;
          width: 260px;
          background: radial-gradient(circle at 80% 50%, rgba(204,168,129,0.14), transparent 70%);
          pointer-events: none;
        }
        .sa-welcome-left {
          display: flex;
          align-items: center;
          gap: 18px;
          position: relative;
          z-index: 2;
        }
        .sa-welcome-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #FAF1E6;
          border: 1.5px solid #F3DEC4;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #BB8958;
          flex-shrink: 0;
        }
        .sa-welcome-title {
          font-size: 24px;
          font-weight: 800;
          color: #073B3F;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .sa-welcome-sub {
          font-size: 13.5px;
          color: #6E7D7B;
          margin-top: 4px;
          font-weight: 500;
        }
        .sa-welcome-right {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #F8FAF9;
          border: 1px solid #E2EAE8;
          border-radius: 14px;
          padding: 10px 18px;
          position: relative;
          z-index: 2;
        }
        .sa-kpi-grid-v2 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          width: 100%;
        }
        .sa-kpi-card-v2 {
          background: #FFFFFF;
          border: 1px solid #E4ECEB;
          border-radius: 16px;
          padding: 22px 24px;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.025);
          display: flex;
          align-items: center;
          gap: 18px;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          position: relative;
          overflow: hidden;
        }
        .sa-kpi-card-v2:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(7, 59, 63, 0.06);
        }
        .sa-kpi-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-kpi-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .sa-kpi-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #556664;
        }
        .sa-kpi-num {
          font-size: 30px;
          font-weight: 800;
          color: #071A2D;
          line-height: 1.1;
        }
        .sa-kpi-trend {
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .sa-middle-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 18px;
          width: 100%;
          align-items: stretch;
        }
        .sa-bottom-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          width: 100%;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .sa-middle-grid {
            grid-template-columns: 1fr;
          }
          .sa-bottom-grid {
            grid-template-columns: 1fr;
          }
        }
        .sa-saas-card {
          background: #FFFFFF;
          border: 1px solid #E4ECEB;
          border-radius: 16px;
          padding: 22px 24px;
          box-shadow: 0 4px 16px rgba(7, 59, 63, 0.025);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
          position: relative;
        }
        .sa-saas-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .sa-saas-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 800;
          color: #073B3F;
        }
        .sa-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 12px;
          transition: background 0.18s ease;
          cursor: pointer;
        }
        .sa-status-row:hover {
          background: #F4F7F6;
        }
        .sa-status-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sa-status-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-status-name {
          font-size: 13.5px;
          font-weight: 750;
          color: #111817;
        }
        .sa-status-desc {
          font-size: 11.5px;
          color: #7A8987;
          margin-top: 1px;
        }
        .sa-status-right {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 800;
        }
        .sa-bottom-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          width: 100%;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .sa-bottom-grid {
            grid-template-columns: 1fr;
          }
        }
        .sa-loading-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 750;
          color: #009957;
          background: #EAF8F0;
          border: 1px solid #C4ECD7;
          padding: 3px 9px;
          border-radius: 12px;
          animation: fadeIn 0.2s ease;
        }
        .sa-loading-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #009957;
          animation: dotPulse 1.2s infinite ease-in-out;
        }
        .sa-qa-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          flex: 1;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .sa-qa-tile {
          background: #FDFDFC;
          border: 1px solid #E2EAE8;
          border-radius: 12px;
          padding: 12px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow: hidden;
        }
        .sa-qa-tile:hover {
          background: #F3F7F6;
          border-color: #BDCFCE;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(7, 59, 63, 0.06);
        }
        .sa-qa-tile-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }
        .sa-qa-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-qa-label {
          font-size: 12px;
          font-weight: 750;
          color: #0C4044;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sa-role-dist-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }
        .sa-role-table {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .sa-role-row {
          display: grid;
          grid-template-columns: 8px minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 8px;
          padding: 5px 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.18s ease;
          min-width: 0;
          box-sizing: border-box;
        }
        .sa-role-row:hover {
          background: #F4F7F6;
        }
        .sa-role-name {
          font-size: 12px;
          font-weight: 700;
          color: #172B29;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sa-role-count {
          font-size: 12.5px;
          font-weight: 800;
          color: #071A2D;
          text-align: right;
          min-width: 28px;
        }
        .sa-role-pct {
          font-size: 11.5px;
          color: #6E7D7B;
          text-align: right;
          min-width: 38px;
        }
        .sa-profit-pill {
          background: #F8FAF9;
          border: 1px solid #E4ECEB;
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .sa-profit-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.08);
          border-color: #073B3F;
        }
        .sa-profit-pill.hero-profit {
          background: linear-gradient(135deg, #073B3F 0%, #0C4044 100%);
          border: 1px solid #073B3F;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.16);
        }
        .sa-profit-pill.hero-profit:hover {
          box-shadow: 0 6px 20px rgba(7, 59, 63, 0.28);
        }
        .sa-profit-pill-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-profit-pill-icon.sales-icon {
          background: #EAF8F0;
          color: #009957;
        }
        .sa-profit-pill-icon.profit-icon {
          background: #EAF8F0;
          color: #009957;
        }
        .sa-profit-pill-icon.hero-icon {
          background: rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
        }
        .sa-revenue-income-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 14px;
          flex: 1;
          align-items: stretch;
        }
        @media (max-width: 600px) {
          .sa-revenue-income-grid {
            grid-template-columns: 1fr;
          }
        }
        .sa-revenue-breakdown-col, .sa-total-income-col {
          display: flex;
          flex-direction: column;
        }
        .sa-sub-chart-title {
          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #7A8987;
          margin-bottom: 6px;
        }
        .sa-pie-legend {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 6px;
        }
        .sa-pie-legend-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: #0C4044;
          font-weight: 700;
        }
        .sa-pie-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sa-pie-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sa-pie-pct {
          color: #7A8987;
          font-weight: 800;
        }
        .sa-footer-banner {
          background: linear-gradient(135deg, #073B3F 0%, #032326 100%);
          border-radius: 20px 20px 0 0;
          padding: 30px 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #FFFFFF;
          margin-top: 16px;
          box-shadow: 0 -8px 28px rgba(7, 59, 63, 0.08);
          position: relative;
          overflow: hidden;
        }
        .sa-footer-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #BB8958, #CCA881, #BB8958);
        }
        .sa-footer-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sa-footer-motto {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 26px;
          font-style: italic;
          font-weight: 600;
          color: #F8FAF9;
          letter-spacing: 0.02em;
        }
        .sa-footer-underline {
          width: 56px;
          height: 2px;
          background: #BB8958;
        }
        .sa-footer-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sa-footer-brand {
          text-align: right;
        }
        .sa-footer-brand-title {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: #FDFDFC;
        }
        .sa-footer-brand-sub {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.22em;
          color: #CCA881;
          margin-top: 2px;
        }
        @media (max-width: 1200px) {
          .sa-kpi-grid-v2 { grid-template-columns: repeat(2, 1fr); }
          .sa-middle-grid { grid-template-columns: 1fr; }
          .sa-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 680px) {
          .sa-dashboard-container { padding: 14px 14px 36px; }
          .sa-welcome-card { flex-direction: column; align-items: flex-start; gap: 14px; }
          .sa-kpi-grid-v2 { grid-template-columns: 1fr; }
          .sa-qa-grid { grid-template-columns: 1fr; }
          .sa-role-dist-wrap { flex-direction: column; }
          .sa-footer-banner { flex-direction: column; align-items: flex-start; gap: 18px; }
        }
      `}</style>

      {/* Main SaaS Dashboard Container */}
      <div className="sa-dashboard-container">
        {msg && (
          <div style={{ background: msg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${msg.includes('✅') ? 'rgba(12,64,68,0.25)' : 'rgba(201,32,53,0.3)'}`, color: msg.includes('✅') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', marginBottom: '8px' }}>
            {msg}
          </div>
        )}

        {/* 1. Welcome Card Banner */}
        <div className="sa-welcome-card">
          <div className="sa-welcome-left">
            <div className="sa-welcome-icon-box">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                <path d="M5 20h14" />
              </svg>
            </div>
            <div>
              <h1 className="sa-welcome-title">Welcome Back, Super Admin!</h1>
              <div className="sa-welcome-sub">Here's what's happening with your platform today.</div>
            </div>
          </div>

          <div className="sa-welcome-right">
            <div style={{ color: '#0C4044', display: 'flex', alignItems: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#073B3F' }}>
                {liveTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#6E7D7B', marginTop: '2px' }}>
                {liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>
          </div>
        </div>

        {/* 2. KPI Cards (4 Cards) */}
        <div className="sa-kpi-grid-v2">
          {/* Card 1: Yesterday Order */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#F3E8FF', color: '#9333EA' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">YESTERDAY ORDER</div>
              <div className="sa-kpi-num">{quickStats.yesterday_orders ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>↑ +12%</span>
                <span style={{ color: '#7A8987', fontWeight: 500 }}>vs yesterday</span>
              </div>
            </div>
          </div>

          {/* Card 2: Today Order */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#E6F7F0', color: '#009957' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">TODAY ORDER</div>
              <div className="sa-kpi-num">{quickStats.today_orders ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>↑ +18%</span>
                <span style={{ color: '#7A8987', fontWeight: 500 }}>vs yesterday</span>
              </div>
            </div>
          </div>

          {/* Card 3: Today New Customer */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#EAF8F0', color: '#009957' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">TODAY NEW CUSTOMER</div>
              <div className="sa-kpi-num">{quickStats.today_new_customers ?? 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>↑ +24%</span>
                <span style={{ color: '#7A8987', fontWeight: 500 }}>vs yesterday</span>
              </div>
            </div>
          </div>

          {/* Card 4: Active User */}
          <div className="sa-kpi-card-v2">
            <div className="sa-kpi-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="sa-kpi-meta">
              <div className="sa-kpi-title">ACTIVE USER</div>
              <div className="sa-kpi-num">{quickStats.active_users || loginStatus.active_count || 0}</div>
              <div className="sa-kpi-trend" style={{ color: '#059669' }}>
                <span>↑ +11%</span>
                <span style={{ color: '#7A8987', fontWeight: 500 }}>vs yesterday</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Middle Row: Order Volume & All Sales / Athirai Profit */}
        <div className="sa-middle-grid">
          {/* Column 1: Order Volume */}
          <div>
            <OrderTrendChart dark={dark} />
          </div>

          {/* Column 2: All Sales & Athirai Profit (Dynamic Toggle & Period Filter) */}
          <div className="sa-saas-card sa-sales-profit-card">
            <div className="sa-saas-card-head" style={{ marginBottom: '12px' }}>
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009957" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                <span>All Sales & Athirai Profit</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {salesProfitLoading && (
                  <div className="sa-loading-badge">
                    <span className="sa-loading-dot" />
                    <span>Loading...</span>
                  </div>
                )}
                <select
                  value={profitPeriod}
                  onChange={e => setProfitPeriod(e.target.value)}
                  style={{
                    background: '#F4F7F6', border: '1px solid #E2EAE8', color: '#0C4044',
                    borderRadius: '14px', padding: '4px 10px', fontSize: '11px', fontWeight: 800,
                    outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="month">This Month</option>
                  <option value="past_month">Past Month</option>
                  <option value="year">This Year</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                </select>
              </div>
            </div>

            {/* Top 2 Clickable & Toggleable Metric Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {/* All Sales Pill */}
              <div
                onClick={() => setActiveSalesProfitTab('sales')}
                className={`sa-profit-pill ${activeSalesProfitTab === 'sales' ? 'hero-profit' : ''}`}
                title="Click to switch graph to All Sales (or click arrow to open full page)"
              >
                <div className={`sa-profit-pill-icon ${activeSalesProfitTab === 'sales' ? 'hero-icon' : 'sales-icon'}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: activeSalesProfitTab === 'sales' ? 'rgba(255,255,255,0.85)' : '#7A8987',
                    textTransform: 'uppercase'
                  }}>
                    All Sales ({profitPeriod === 'today' ? 'Today' : (profitPeriod === 'week' ? 'This Week' : (profitPeriod === 'year' ? 'This Year' : (profitPeriod === 'past_month' ? 'Past Month' : 'This Month')))})
                  </div>
                  <div style={{
                    fontSize: '13.5px',
                    fontWeight: 850,
                    color: activeSalesProfitTab === 'sales' ? '#FFFFFF' : '#073B3F',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <AnimatedNumber value={Math.round(salesProfitData.allSales)} />
                  </div>
                </div>
                <span
                  onClick={(e) => { e.stopPropagation(); navigate('/superadmin-payments') }}
                  title="Open All Sales full page"
                  style={{
                    fontSize: '12px',
                    color: activeSalesProfitTab === 'sales' ? '#FFFFFF' : '#0C4044',
                    fontWeight: 900,
                    padding: '2px 4px',
                    cursor: 'pointer'
                  }}
                >
                  →
                </span>
              </div>

              {/* Athirai Profit Pill */}
              <div
                onClick={() => setActiveSalesProfitTab('profit')}
                className={`sa-profit-pill ${activeSalesProfitTab === 'profit' ? 'hero-profit' : ''}`}
                title="Click to switch graph to Athirai Profit (or click arrow to open full page)"
              >
                <div className={`sa-profit-pill-icon ${activeSalesProfitTab === 'profit' ? 'hero-icon' : 'profit-icon'}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: activeSalesProfitTab === 'profit' ? 'rgba(255,255,255,0.85)' : '#7A8987',
                    textTransform: 'uppercase'
                  }}>
                    Athirai Profit ({profitPeriod === 'today' ? 'Today' : (profitPeriod === 'week' ? 'This Week' : (profitPeriod === 'year' ? 'This Year' : (profitPeriod === 'past_month' ? 'Past Month' : 'This Month')))})
                  </div>
                  <div style={{
                    fontSize: '13.5px',
                    fontWeight: 850,
                    color: activeSalesProfitTab === 'profit' ? '#FFFFFF' : '#073B3F',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <AnimatedNumber value={Math.round(salesProfitData.athiraiProfit)} />
                  </div>
                </div>
                <span
                  onClick={(e) => { e.stopPropagation(); navigate('/athirai-profit') }}
                  title="Open Athirai Profit full page"
                  style={{
                    fontSize: '12px',
                    color: activeSalesProfitTab === 'profit' ? '#FFFFFF' : '#0C4044',
                    fontWeight: 900,
                    padding: '2px 4px',
                    cursor: 'pointer'
                  }}
                >
                  →
                </span>
              </div>
            </div>

            {/* 2-Panel Visual Representation: Donut & Line Graph */}
            <div className="sa-revenue-income-grid">
              {/* Left: REVENUE BREAKDOWN / SALES BREAKDOWN (Pie/Donut Chart) */}
              <div className="sa-revenue-breakdown-col">
                <div className="sa-sub-chart-title">
                  {activeSalesProfitTab === 'sales' ? 'SALES BREAKDOWN' : 'REVENUE BREAKDOWN'}
                </div>
                <div style={{ width: '100%', height: '105px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeSalesProfitTab === 'sales'
                          ? (salesProfitData.salesBreakdown || [])
                          : (salesProfitData.profitBreakdown || salesProfitData.breakdown || [])}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {(activeSalesProfitTab === 'sales'
                          ? (salesProfitData.salesBreakdown || [])
                          : (salesProfitData.profitBreakdown || salesProfitData.breakdown || [])).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div style={{ background: '#073B3F', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 800 }}>
                            <div>{d.name}</div>
                            <div style={{ color: '#009957' }}>₹ {d.value.toLocaleString('en-IN')} ({d.pct})</div>
                          </div>
                        )
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="sa-pie-legend">
                  {(activeSalesProfitTab === 'sales'
                    ? (salesProfitData.salesBreakdown || [])
                    : (salesProfitData.profitBreakdown || salesProfitData.breakdown || [])).map((b) => (
                    <div key={b.name} className="sa-pie-legend-row" title={`${b.name}: ₹${b.value.toLocaleString('en-IN')}`}>
                      <span className="sa-pie-dot" style={{ background: b.color }} />
                      <span className="sa-pie-text">{b.name}</span>
                      <b className="sa-pie-pct">{b.pct}</b>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: TOTAL SALES TREND / TOTAL INCOME TREND */}
              <div className="sa-total-income-col">
                <div className="sa-sub-chart-title">
                  {activeSalesProfitTab === 'sales' ? 'TOTAL SALES TREND' : 'TOTAL INCOME TREND'}
                </div>
                <div style={{ width: '100%', height: '135px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesProfitData.monthlyTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                      <XAxis dataKey="name" stroke="#8E9E9C" fontSize={9} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                      <YAxis
                        stroke="#8E9E9C"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v => {
                          if (v === 0) return '₹0'
                          if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
                          if (v >= 1000) return `₹${Math.round(v / 1000)}k`
                          return `₹${v}`
                        }}
                      />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const p = payload[0].payload
                        return (
                          <div style={{ background: '#073B3F', color: '#FFFFFF', borderRadius: '6px', padding: '6px 10px', fontSize: '10.5px', fontWeight: 800 }}>
                            <div style={{ color: '#BB8958' }}>{p.name}</div>
                            {activeSalesProfitTab === 'sales' ? (
                              <div style={{ color: '#EAF8F0' }}>Sales: ₹ {Number(p.sales || 0).toLocaleString('en-IN')}</div>
                            ) : (
                              <div style={{ color: '#EAF8F0' }}>Profit: ₹ {Number(p.profit || 0).toLocaleString('en-IN')}</div>
                            )}
                          </div>
                        )
                      }} />
                      <Line
                        type="monotone"
                        dataKey={activeSalesProfitTab === 'sales' ? 'sales' : 'profit'}
                        stroke="#009957"
                        strokeWidth={2.4}
                        dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                        activeDot={{ r: 5.5, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#009957', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#009957' }} />
                    {activeSalesProfitTab === 'sales' ? 'Sales Trend Curve' : 'Profit Trend Curve'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Row: 4 SaaS Cards (Role Distribution, User Growth, Network & User Status, Super Admin Quick Actions) */}
        <div className="sa-bottom-grid">
          {/* Card 1: Role Distribution */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span>Role Distribution</span>
              </div>
              <div style={{ background: '#EAEFEF', color: '#0C4044', borderRadius: '16px', padding: '4px 12px', fontSize: '11.5px', fontWeight: 800 }}>
                Total: {totalUsers.toLocaleString()}
              </div>
            </div>

            <div className="sa-role-dist-wrap">
              {/* Donut Chart */}
              <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Super Stockist', value: quickStats.admins || 0 },
                        { name: 'Distributor', value: quickStats.dealers || 0 },
                        { name: 'Wholesale Dealer', value: quickStats.sub_dealers || 0 },
                        { name: 'Retailer', value: quickStats.promotors || 0 },
                        { name: 'Customer', value: quickStats.customers || 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={2}
                    >
                      <Cell fill="#073B3F" />
                      <Cell fill="#009957" />
                      <Cell fill="#BB8958" />
                      <Cell fill="#CCA881" />
                      <Cell fill="#C92035" />
                    </Pie>
                    <Tooltip contentStyle={{ background: '#073B3F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>

                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#071A2D', lineHeight: 1 }}>{totalUsers.toLocaleString()}</div>
                  <div style={{ fontSize: '9.5px', color: '#7A8987', fontWeight: 700, marginTop: '3px' }}>Total Users</div>
                </div>
              </div>

              {/* Roles Table */}
              <div className="sa-role-table">
                {[
                  { label: 'Super Stockist', color: '#073B3F', count: quickStats.admins || 0, route: '/superadmin/manage-users/super-stockist' },
                  { label: 'Distributor', color: '#009957', count: quickStats.dealers || 0, route: '/superadmin/manage-users/distributor' },
                  { label: 'Wholesale Dealer', color: '#BB8958', count: quickStats.sub_dealers || 0, route: '/superadmin/manage-users/wholesale-dealer' },
                  { label: 'Retailer', color: '#CCA881', count: quickStats.promotors || 0, route: '/superadmin/manage-users/retailer' },
                  { label: 'Customer', color: '#C92035', count: quickStats.customers || 0, route: '/superadmin/manage-users/customer' },
                ].map(r => (
                  <div key={r.label} className="sa-role-row" onClick={() => navigate(r.route)}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                    <span className="sa-role-name">{r.label}</span>
                    <span className="sa-role-count">{r.count}</span>
                    <span className="sa-role-pct">
                      {totalUsers > 0 ? `${((r.count / totalUsers) * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: User Growth (Dynamic Period & Metrics) */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
                </svg>
                <span>User Growth</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {userGrowthLoading && (
                  <div className="sa-loading-badge">
                    <span className="sa-loading-dot" />
                    <span>Loading...</span>
                  </div>
                )}
                <select
                  value={userGrowthPeriod}
                  onChange={e => setUserGrowthPeriod(e.target.value)}
                  style={{
                    background: '#F4F7F6',
                    border: '1px solid #E2EAE8',
                    color: '#0C4044',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="3month">3 Month</option>
                  <option value="6month">6 Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </div>

            {/* Sub-header Dynamic Stats Row (Reflecting selected period) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: '#F8FAF9', border: '1px solid #E4ECEB', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7A8987', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Total Users</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#071A2D' }}>
                    <AnimatedNumber value={userGrowthStats.total || totalUsers || 0} prefix="" />
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAF9', border: '1px solid #E4ECEB', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EAF8F0', color: '#009957', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7A8987', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>New Users</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#071A2D' }}>
                    <AnimatedNumber value={userGrowthStats.newUsers ?? 0} prefix="" />
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAF9', border: '1px solid #E4ECEB', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7A8987', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Active Users</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#071A2D' }}>
                    <AnimatedNumber value={userGrowthStats.activeUsers || quickStats.active_users || loginStatus.active_count || 0} prefix="" />
                  </div>
                </div>
              </div>
            </div>

            {/* Area Chart with Emerald Gradient */}
            <div style={{ width: '100%', height: '175px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(userGrowthChartData && userGrowthChartData.length > 0) ? userGrowthChartData : userGrowthData} margin={{ top: 12, right: 14, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#009957" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#009957" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                  <XAxis dataKey="month" stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                  <YAxis stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload
                    return (
                      <div style={{ background: '#073B3F', color: '#FFFFFF', borderRadius: '8px', padding: '6px 12px', fontSize: '11.5px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>{p.month}: {p.users.toLocaleString()} users</div>
                      </div>
                    )
                  }} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#009957"
                    strokeWidth={2.4}
                    fill="url(#userGrowthGrad)"
                    dot={{ r: 3, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Network & User Status (Relocated to Bottom Row) */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Network & User Status</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EAF8F0', color: '#009957', border: '1px solid #C4ECD7', borderRadius: '16px', padding: '3px 10px', fontSize: '11px', fontWeight: 800 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#009957', animation: 'dotPulse 1.8s infinite' }} />
                Live
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-around' }}>
              {/* Active Users */}
              <div className="sa-status-row" onClick={() => navigate('/login-active')}>
                <div className="sa-status-left">
                  <div className="sa-status-icon-wrap" style={{ background: '#EAF8F0', color: '#009957' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <div className="sa-status-name">Active Users</div>
                    <div className="sa-status-desc">Currently online</div>
                  </div>
                </div>
                <div className="sa-status-right" style={{ color: '#009957' }}>
                  <span>● {(quickStats.active_users || loginStatus.active_count || 0).toLocaleString()}</span>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              </div>

              {/* Inactive Users */}
              <div className="sa-status-row" onClick={() => navigate('/login-inactive')}>
                <div className="sa-status-left">
                  <div className="sa-status-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <div className="sa-status-name">Inactive Users</div>
                    <div className="sa-status-desc">Not active today</div>
                  </div>
                </div>
                <div className="sa-status-right" style={{ color: '#C92035' }}>
                  <span>● {(quickStats.today_inactive_count || loginStatus.inactive_count || 0).toLocaleString()}</span>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              </div>

              {/* New Users Today */}
              <div className="sa-status-row" onClick={() => navigate('/superadmin/manage-users/customer')}>
                <div className="sa-status-left">
                  <div className="sa-status-icon-wrap" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </div>
                  <div>
                    <div className="sa-status-name">New Users Today</div>
                    <div className="sa-status-desc">Registered today</div>
                  </div>
                </div>
                <div className="sa-status-right" style={{ color: '#009957' }}>
                  <span>● {(quickStats.today_new_customers || 0).toLocaleString()}</span>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              </div>

              {/* Pending Actions */}
              <div className="sa-status-row" onClick={() => { setShowRequests(true); setRequestMsg('') }}>
                <div className="sa-status-left">
                  <div className="sa-status-icon-wrap" style={{ background: '#FFFBEB', color: '#D97706' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="sa-status-name">Pending Actions</div>
                    <div className="sa-status-desc">Requires attention</div>
                  </div>
                </div>
                <div className="sa-status-right" style={{ color: '#D97706' }}>
                  <span>● {(profileRequests.length + (coinRequests?.filter(r => r.status === 'pending').length || 0)).toLocaleString()}</span>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Super Admin Quick Actions (Relocated to Bottom Row) */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Super Admin Quick Actions</span>
              </div>
            </div>

            <div className="sa-qa-grid">
              {/* Tile 1: Manage Users */}
              <div className="sa-qa-tile" onClick={() => navigate('/superadmin/manage-users/customer')}>
                <div className="sa-qa-tile-left">
                  <div className="sa-qa-icon-wrap" style={{ background: '#E6F4F2', color: '#0C4044' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="sa-qa-label">Manage Users</span>
                </div>
                <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
              </div>

              {/* Tile 2: Available Jewellery */}
              <div className="sa-qa-tile" onClick={() => navigate('/available-jewellery')}>
                <div className="sa-qa-tile-left">
                  <div className="sa-qa-icon-wrap" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="6 3 18 3 22 9 12 22 2 9 6 3" />
                    </svg>
                  </div>
                  <span className="sa-qa-label">Available Jewellery</span>
                </div>
                <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
              </div>

              {/* Tile 3: Add Jewellery */}
              <div className="sa-qa-tile" onClick={() => navigate('/add-jewellery')}>
                <div className="sa-qa-tile-left">
                  <div className="sa-qa-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <span className="sa-qa-label">Add Jewellery</span>
                </div>
                <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
              </div>

              {/* Tile 4: Promotions */}
              <div className="sa-qa-tile" onClick={() => navigate('/promotions/distributor')}>
                <div className="sa-qa-tile-left">
                  <div className="sa-qa-icon-wrap" style={{ background: '#F0FDF4', color: '#10B981' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </div>
                  <span className="sa-qa-label">Promotions</span>
                </div>
                <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
              </div>

              {/* Tile 5: Coins */}
              <div className="sa-qa-tile" onClick={() => navigate('/available-coins')}>
                <div className="sa-qa-tile-left">
                  <div className="sa-qa-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                  </div>
                  <span className="sa-qa-label">Coins</span>
                </div>
                <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
              </div>

              {/* Tile 6: Hierarchy */}
              <div className="sa-qa-tile" onClick={() => navigate('/superadmin-hierarchy-grid')}>
                <div className="sa-qa-tile-left">
                  <div className="sa-qa-icon-wrap" style={{ background: '#E6F4F2', color: '#0C4044' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="3" width="6" height="4" rx="1" /><rect x="2" y="17" width="6" height="4" rx="1" /><rect x="16" y="17" width="6" height="4" rx="1" /><path d="M12 7v5M5 17v-3h14v3" />
                    </svg>
                  </div>
                  <span className="sa-qa-label">Hierarchy</span>
                </div>
                <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Super Stockist Management Section */}
        <div className="sa-saas-card" style={{ marginTop: '4px' }}>
          <div className="sa-saas-card-head" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#073B3F', margin: 0 }}>
              Super Stockist Management
            </h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/superadmin-hierarchy-grid')}
                style={{ padding: '10px 20px', background: '#FFFFFF', border: '1px solid rgba(204,168,129,0.4)', borderRadius: '10px', fontWeight: 800, color: '#BB8958', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                Hierarchy
              </button>

              <button
                onClick={() => navigate('/sales-report')}
                style={{ padding: '10px 20px', background: '#FFFFFF', border: '1px solid rgba(12,64,68,0.28)', borderRadius: '10px', fontWeight: 800, color: '#0C4044', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sales Report
              </button>

              <button
                onClick={() => navigate('/add-shop')}
                style={{ padding: '10px 20px', background: '#FFFFFF', border: '1px solid rgba(204,168,129,0.4)', borderRadius: '10px', fontWeight: 800, color: '#BB8958', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10h16l-1 12H5L4 10z"/><path d="M8 10V6a4 4 0 018 0v4" strokeLinecap="round"/></svg>
                Add Shop
              </button>

              <button
                type="button"
                onClick={() => navigate('/create-super-stockist')}
                style={{ padding: '10px 20px', background: '#004B55', border: 'none', borderRadius: '10px', fontWeight: 800, color: '#FFFFFF', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0,75,85,0.2)' }}
              >
                + Create Super Stockist
              </button>

              <button
                type="button"
                onClick={() => navigate('/create-customer')}
                style={{ padding: '10px 20px', background: '#073B3F', border: 'none', borderRadius: '10px', fontWeight: 800, color: '#FFFFFF', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(7,59,63,0.2)' }}
              >
                + Create Customer
              </button>
            </div>
          </div>
        </div>

        {/* 6. Bottom Luxury Footer Banner */}
        <div className="sa-footer-banner">
          <div className="sa-footer-left">
            <div className="sa-footer-motto">Together We Grow</div>
            <div className="sa-footer-underline" />
          </div>

          <div className="sa-footer-right">
            <img src={logo} alt="Athirai" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <div className="sa-footer-brand">
              <div className="sa-footer-brand-title">ATHIRAI</div>
              <div className="sa-footer-brand-sub">SUPER ADMIN</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        {/* ── RATE ENTRY POPUP ── */}
        {showRatePopup && (
          <div
            onClick={() => setShowRatePopup(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(17,24,23,0.45)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1300,
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
                animation: 'fadeIn 0.3s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              {/* Header */}
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
                    <div style={{ color: subtext, fontSize: '12px', marginTop: '2px' }}>
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
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {rateMsg && (
                <div style={{
                  background: rateMsg.includes('') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)',
                  border: `1px solid ${rateMsg.includes('âœ…') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`,
                  color: rateMsg.includes('') ? '#0C4044' : '#C92035',
                  borderRadius: '12px', padding: '13px 16px', fontSize: '13px', marginBottom: '18px'
                }}>
                  {rateMsg}
                </div>
              )}

              {/* Date full width */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#53615F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Date *
                </label>
                <input
                  type="date"
                  value={rateForm.date}
                  onChange={e => setRateForm({ ...rateForm, date: e.target.value })}
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#CCA881'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Grid: 2 columns for all rate fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* 22K */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#CCA881', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/>
                    </svg>
                    Gold 22K
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 12800"
                    value={rateForm.gold_22k}
                    onChange={e => setRateForm({ ...rateForm, gold_22k: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(204,168,129,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#CCA881', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#CCA881'}
                    onBlur={e => e.target.style.borderColor = 'rgba(204,168,129,0.4)'}
                  />
                  {rateForm.gold_22k && (
                    <div style={{ color: '#CCA881', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm ={parseFloat(rateForm.gold_22k).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* 24K */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#CCA881', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/>
                    </svg>
                    Gold 24K
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 13900"
                    value={rateForm.gold_24k}
                    onChange={e => setRateForm({ ...rateForm, gold_24k: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(204,168,129,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#CCA881', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#CCA881'}
                    onBlur={e => e.target.style.borderColor = 'rgba(204,168,129,0.4)'}
                  />
                  {rateForm.gold_24k && (
                    <div style={{ color: '#CCA881', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm ={parseFloat(rateForm.gold_24k).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Silver */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#53615F', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/>
                    </svg>
                    Silver 999
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 225"
                    value={rateForm.silver_999}
                    onChange={e => setRateForm({ ...rateForm, silver_999: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(192,192,192,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#53615F', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#BDCFCE'}
                    onBlur={e => e.target.style.borderColor = 'rgba(192,192,192,0.4)'}
                  />
                  {rateForm.silver_999 && (
                    <div style={{ color: '#53615F', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm ={parseFloat(rateForm.silver_999).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Diamond 18K */}
                <div style={{ display: 'none' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8987" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/>
                    </svg>
                    Diamond 18K
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={rateForm.diamond_18k}
                    onChange={e => setRateForm({ ...rateForm, diamond_18k: e.target.value })}
                    style={{ width: '100%', background: '#FFFFFF', border: `1px solid #BDCFCE`, borderRadius: '12px', padding: '13px 16px', color: '#073B3F', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#0C4044'}
                    onBlur={e => e.target.style.borderColor = '#BDCFCE'}
                  />
                  {rateForm.diamond_18k && (
                    <div style={{ color: '#D1DFDE', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm ={parseFloat(rateForm.diamond_18k).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Diamond 22K */}
                <div style={{ display: 'none' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0C4044', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/>
                    </svg>
                    Diamond 22K
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 55000"
                    value={rateForm.diamond_22k}
                    onChange={e => setRateForm({ ...rateForm, diamond_22k: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(165,243,252,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#0C4044', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#0C4044'}
                    onBlur={e => e.target.style.borderColor = 'rgba(165,243,252,0.4)'}
                  />
                  {rateForm.diamond_22k && (
                    <div style={{ color: '#0C4044', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm ={parseFloat(rateForm.diamond_22k).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Platinum 92 */}
                <div style={{ display: 'none' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8987" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="#53615F"/>
                    </svg>
                    Platinum 92
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3200"
                    value={rateForm.platinum_92}
                    onChange={e => setRateForm({ ...rateForm, platinum_92: e.target.value })}
                    style={{ width: '100%', background: '#FFFFFF', border: `1px solid #BDCFCE`, borderRadius: '12px', padding: '13px 16px', color: '#073B3F', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#0C4044'}
                    onBlur={e => e.target.style.borderColor = '#BDCFCE'}
                  />
                  {rateForm.platinum_92 && (
                    <div style={{ color: '#E7EDEC', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm ={parseFloat(rateForm.platinum_92).toFixed(2)}
                    </div>
                  )}
                </div>

              </div>

              {/* Save Button */}
              <button
                disabled={rateSaving}
                onClick={async () => {
                  if (!rateForm.date || !rateForm.gold_22k || !rateForm.gold_24k || !rateForm.silver_999) {
                    setRateMsg('âŒ Gold and Silver fields are required.')
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
                    setRateMsg('âœ… Rate saved successfully!')
                    fetchMetalPrices()
                    setTimeout(() => setShowRatePopup(false), 1400)
                  } catch (err) {
                    setRateMsg('âŒ Failed: ' + JSON.stringify(err.response?.data))
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
                  letterSpacing: '0.5px', transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: rateSaving ? 'none' : '0 14px 30px rgba(204,168,129,0.35)',
                }}
              >
                {rateSaving ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(204,168,129,0.3)', borderTop: '2px solid #CCA881', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FDFDFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save Rate
                  </>
                )}
              </button>
            </div>
          </div>
        )}


{/* â”€â”€ ADD PRODUCT POPUP â”€â”€ */}
{showAddProduct && (
  <div onClick={() => setShowAddProduct(false)} style={{ position:'fixed', inset:0, background:'rgba(17,24,23,0.88)', backdropFilter:'blur(12px)', zIndex:1400, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border:'1px solid rgba(204,168,129,0.35)', borderRadius:'24px', width:'96%', maxWidth:'620px', maxHeight:'92vh', overflowY:'auto', padding:'32px', boxShadow:'0 32px 90px rgba(17,24,23,0.8)', animation:'fadeIn 0.25s ease' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(204,168,129,0.15)', border:'1px solid rgba(204,168,129,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}></div>
          <div>
            <div style={{ color:'#CCA881', fontWeight:800, fontSize:'15px' }}>ADD JEWELRY PRODUCT</div>
            <div style={{ color:subtext, fontSize:'11px', marginTop:'2px' }}>Fill all details and upload images</div>
          </div>
        </div>
        <button onClick={() => setShowAddProduct(false)} style={{ background:'rgba(201,32,53,0.1)', border:'1px solid rgba(201,32,53,0.3)', color:'#C92035', borderRadius:'8px', padding:'6px 14px', cursor:'pointer', fontSize:'12px' }}>Close</button>
      </div>

      {productMsg && (
        <div style={{ background: productMsg.includes('âœ…') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border:`1px solid ${productMsg.includes('âœ…') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: productMsg.includes('âœ…') ? '#0C4044' : '#C92035', borderRadius:'12px', padding:'13px 16px', fontSize:'13px', marginBottom:'18px' }}>
          {productMsg}
        </div>
      )}

      {/* STEP 1: Category */}
      <div style={{ marginBottom:'20px' }}>
        <label style={{ display:'block', color:'#CCA881', fontSize:'11px', fontWeight:800, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'10px' }}>
          Step 1 Select Category
        </label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {['rings','necklaces','bangles','earrings','chains','coins'].map(cat => (
            <div key={cat} onClick={() => setProductForm(f => ({ ...f, category: cat, metal:'', grade:'' }))}
              style={{ padding:'8px 16px', borderRadius:'20px', cursor:'pointer', fontWeight:700, fontSize:'12px', textTransform:'capitalize', transition:'all 0.2s ease',
                background: productForm.category === cat ? 'rgba(204,168,129,0.25)' : 'rgba(204,168,129,0.05)',
                border: `1.5px solid ${productForm.category === cat ? 'rgba(204,168,129,0.7)' : 'rgba(204,168,129,0.2)'}`,
                color: productForm.category === cat ? '#CCA881' : subtext,
              }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><SvgIcon name={{ rings: 'ring', necklaces: 'necklace', bangles: 'bracelet', earrings: 'earring', chains: 'chain', coins: 'coin' }[cat]} size={14} />{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 2: Metal */}
      {productForm.category && (
        <div style={{ marginBottom:'20px' }}>
          <label style={{ display:'block', color:'#CCA881', fontSize:'11px', fontWeight:800, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'10px' }}>
            Step 2 Select Metal
          </label>
          <div style={{ display:'flex', gap:'10px' }}>
            {['gold','silver'].map(m => (
              <div key={m} onClick={() => setProductForm(f => ({ ...f, metal: m, grade:'' }))}
                style={{ padding:'10px 24px', borderRadius:'20px', cursor:'pointer', fontWeight:800, fontSize:'13px', textTransform:'capitalize', transition:'all 0.2s ease',
                  background: productForm.metal === m ? (m==='gold' ? 'rgba(204,168,129,0.2)' : 'rgba(192,192,192,0.15)') : 'rgba(253,253,252,0.04)',
                  border: `1.5px solid ${productForm.metal === m ? (m==='gold' ? 'rgba(204,168,129,0.7)' : 'rgba(192,192,192,0.6)') : border}`,
                  color: productForm.metal === m ? (m==='gold' ? '#CCA881' : '#BDCFCE') : subtext,
                }}>
                {m === 'gold' ? 'Gold' : 'Silver'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Grade */}
      {productForm.metal && (
        <div style={{ marginBottom:'20px' }}>
          <label style={{ display:'block', color:'#BDCFCE', fontSize:'11px', fontWeight:800, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'10px' }}>
            Step 3 Select Grade
          </label>
          <div style={{ display:'flex', gap:'10px' }}>
            {(productForm.metal === 'gold' ? ['22k','24k'] : ['999']).map(g => (
              <div key={g} onClick={() => setProductForm(f => ({ ...f, grade: g }))}
                style={{ padding:'10px 24px', borderRadius:'20px', cursor:'pointer', fontWeight:800, fontSize:'13px', textTransform:'uppercase', transition:'all 0.2s ease',
                  background: productForm.grade === g ? 'rgba(189,207,206,0.2)' : 'rgba(189,207,206,0.04)',
                  border: `1.5px solid ${productForm.grade === g ? 'rgba(189,207,206,0.7)' : 'rgba(189,207,206,0.2)'}`,
                  color: productForm.grade === g ? '#BDCFCE' : subtext,
                }}>
                {g.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: Product Details */}
      {productForm.grade && (
        <>
          <div style={{ marginBottom:'14px' }}>
            <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
              Product Name *
            </label>
            <input
              value={productForm.name}
              onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Blossom Ring"
              style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'12px', padding:'13px 16px', color:text, fontSize:'14px', outline:'none', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#CCA881'}
              onBlur={e => e.target.style.borderColor=inpBorder}
            />
          </div>

          <div style={{ marginBottom:'14px' }}>
            <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
              Description
            </label>
            <textarea
              value={productForm.description}
              onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="e.g. Floral petal design with a vintage soul"
              style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'12px', padding:'13px 16px', color:text, fontSize:'14px', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#CCA881'}
              onBlur={e => e.target.style.borderColor=inpBorder}
            />
          </div>

          <div style={{ marginBottom:'14px' }}>
            <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
              Tag (Optional)
            </label>
            <select
              value={productForm.tag}
              onChange={e => setProductForm(f => ({ ...f, tag: e.target.value }))}
              style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'12px', padding:'13px 16px', color:text, fontSize:'14px', outline:'none', cursor:'pointer' }}
            >
              <option value="" style={{ background:optionBg }}>-- Select Tag --</option>
              {['Bestseller','Bridal','Premium','Statement','Stackable','New','Limited'].map(t => (
                <option key={t} value={t} style={{ background:optionBg }}>{t}</option>
              ))}
            </select>
          </div>

          {/* Weight + Live Price */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
            <div>
              <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
                Weight (grams) *
              </label>
              <input
                type="number"
                step="0.0001"
                value={productForm.weight_grams}
                onChange={e => {
                  const val = e.target.value
                  setProductForm(f => ({ ...f, weight_grams: val }))
                  calcLivePrice(val, productForm.metal, productForm.grade)
                }}
                placeholder="e.g. 2.5"
                style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'12px', padding:'13px 16px', color:text, fontSize:'14px', outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#CCA881'}
                onBlur={e => e.target.style.borderColor=inpBorder}
              />
            </div>
            <div>
              <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
                Live Rate Price
              </label>
              <div style={{ background:inpBg, border:`1px solid ${livePrice ? 'rgba(12,64,68,0.5)' : inpBorder}`, borderRadius:'12px', padding:'13px 16px', fontFamily:'monospace', fontWeight:800, fontSize:'16px', color: livePrice ? '#0C4044' : subtext, display:'flex', alignItems:'center', minHeight:'46px' }}>
                {livePrice ? `â‚¹ ${livePrice}` : ''}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
              Product Images (Multiple allowed)
            </label>
            <label htmlFor="product-img-upload" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'14px', background:'rgba(204,168,129,0.08)', border:'2px dashed rgba(204,168,129,0.4)', borderRadius:'12px', cursor:'pointer', color:'#CCA881', fontWeight:700, fontSize:'13px', transition:'all 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(204,168,129,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(204,168,129,0.08)'}
            >
              Add Image
            </label>
            <input
              id="product-img-upload"
              type="file"
              accept="image/*"
              multiple
              style={{ display:'none' }}
              onChange={e => {
                const files = Array.from(e.target.files)
                setProductImages(prev => [...prev, ...files])
                const urls = files.map(f => URL.createObjectURL(f))
                setProductPreviewUrls(prev => [...prev, ...urls])
                e.target.value = ''
              }}
            />

            {/* Preview Grid */}
            {productPreviewUrls.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginTop:'14px' }}>
                {productPreviewUrls.map((url, idx) => (
                  <div key={idx} style={{ position:'relative', width:'90px', height:'90px', borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(204,168,129,0.3)' }}>
                    <img src={url} alt={`img-${idx}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    {/* View button */}
                    <button
                      onClick={() => setPreviewImageIdx(idx)}
                      style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(17,24,23,0.6)', color:'#FDFDFC', fontSize:'10px', fontWeight:700, padding:'4px 0', border:'none', cursor:'pointer', backdropFilter:'blur(4px)' }}
                    >
                      View
                    </button>
                    {/* Remove button */}
                    <button
                      onClick={() => {
                        setProductImages(prev => prev.filter((_,i) => i !== idx))
                        setProductPreviewUrls(prev => prev.filter((_,i) => i !== idx))
                      }}
                      style={{ position:'absolute', top:'4px', right:'4px', background:'rgba(201,32,53,0.85)', color:'#FDFDFC', fontSize:'10px', fontWeight:900, width:'18px', height:'18px', borderRadius:'50%', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                    >
                      <SvgIcon name="close" size={12} stroke="#FDFDFC" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            disabled={productSaving || !productForm.name || !productForm.weight_grams}
            onClick={async () => {
              if (!productForm.name.trim()) { setProductMsg('âŒ Product name required'); return }
              if (!productForm.weight_grams) { setProductMsg('âŒ Weight required'); return }
              setProductSaving(true)
              try {
                const fd = new FormData()
                fd.append('category', productForm.category)
                fd.append('metal', productForm.metal)
                fd.append('grade', productForm.grade)
                fd.append('name', productForm.name)
                fd.append('description', productForm.description)
                fd.append('weight_grams', productForm.weight_grams)
                fd.append('tag', productForm.tag)
                if (livePrice) fd.append('price', livePrice)
                productImages.forEach(img => fd.append('uploaded_images', img))
                await api.post('/jewelry-products/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                setProductMsg('âœ… Product added successfully!')
                setProductForm({ category:'', metal:'', grade:'', name:'', description:'', weight_grams:'', tag:'' })
                setProductImages([])
                setProductPreviewUrls([])
                setLivePrice(null)
              } catch (err) {
                setProductMsg('âŒ Failed: ' + JSON.stringify(err.response?.data || err.message))
              }
              setProductSaving(false)
            }}
            style={{ width:'100%', padding:'14px', background: productSaving ? 'rgba(204,168,129,0.3)' : 'linear-gradient(90deg,#CCA881,#BDCFCE)', border:'none', borderRadius:'12px', fontWeight:900, fontSize:'15px', color: productSaving ? '#CCA881' : '#FDFDFC', cursor: productSaving ? 'not-allowed' : 'pointer', transition:'all 0.3s ease' }}>
            {productSaving ? 'â³ Saving...' : 'âœ… Add Product'}
          </button>
        </>
      )}
    </div>
  </div>
)}

{/* Image Lightbox */}
{previewImageIdx !== null && (
  <div onClick={() => setPreviewImageIdx(null)} style={{ position:'fixed', inset:0, background:'rgba(17,24,23,0.95)', backdropFilter:'blur(16px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ position:'relative', maxWidth:'90vw', maxHeight:'90vh' }}>
      <img src={productPreviewUrls[previewImageIdx]} alt="preview" style={{ maxWidth:'100%', maxHeight:'85vh', objectFit:'contain', borderRadius:'16px', border:'1px solid rgba(204,168,129,0.3)' }} />

      {/* Left Arrow */}
      {previewImageIdx > 0 && (
        <button onClick={() => setPreviewImageIdx(i => i - 1)}
          style={{ position:'absolute', left:'-50px', top:'50%', transform:'translateY(-50%)', background:'rgba(204,168,129,0.2)', border:'1px solid rgba(204,168,129,0.4)', color:'#CCA881', width:'40px', height:'40px', borderRadius:'50%', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <SvgIcon name="chevronLeft" size={20} />
        </button>
      )}
      {/* Right Arrow */}
      {previewImageIdx < productPreviewUrls.length - 1 && (
        <button onClick={() => setPreviewImageIdx(i => i + 1)}
          style={{ position:'absolute', right:'-50px', top:'50%', transform:'translateY(-50%)', background:'rgba(204,168,129,0.2)', border:'1px solid rgba(204,168,129,0.4)', color:'#CCA881', width:'40px', height:'40px', borderRadius:'50%', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <SvgIcon name="chevronRight" size={20} />
        </button>
      )}

      {/* Counter */}
      <div style={{ position:'absolute', bottom:'-36px', left:'50%', transform:'translateX(-50%)', color:'rgba(253,253,252,0.6)', fontSize:'12px', fontWeight:600 }}>
        {previewImageIdx + 1} / {productPreviewUrls.length}
      </div>

      <button onClick={() => setPreviewImageIdx(null)}
        style={{ position:'absolute', top:'-16px', right:'-16px', background:'rgba(201,32,53,0.85)', border:'none', color:'#FDFDFC', width:'32px', height:'32px', borderRadius:'50%', fontSize:'14px', cursor:'pointer', fontWeight:900 }}>
        <SvgIcon name="close" size={16} stroke="#FDFDFC" />
      </button>
    </div>
  </div>
)}

        {/* â”€â”€ BIRTHDAY LIST MODAL â”€â”€ */}
        {showBirthdayList && (
          <div onClick={() => setShowBirthdayList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FDF0F1 100%)', border: '1px solid rgba(201,32,53,0.22)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24), 0 0 0 1px rgba(201,32,53,0.06)' }}>
              <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(201,32,53,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(201,32,53,0.16),rgba(201,32,53,0.08))', border: '1px solid rgba(201,32,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(201,32,53,0.14)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 21h16v-7a4 4 0 00-4-4H8a4 4 0 00-4 4v7z"/>
                      <path d="M4 17c1 0 1.5-1 2.5-1s1.5 1 2.5 1 1.5-1 2.5-1 1.5 1 2.5 1 1.5-1 2.5-1"/>
                      <path d="M12 10V6M9 6c0-1 1-1 1-2s-1-1-1-2M15 6c0-1-1-1-1-2s1-1 1-2"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#C92035', fontWeight: 800, fontSize: '14px' }}>TODAY'S BIRTHDAYS</div>
                    <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBirthdayList(false)}
                  style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {birthdayList.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', color: subtext, padding: '50px 0', fontSize: '14px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#53615F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 21h16v-7a4 4 0 00-4-4H8a4 4 0 00-4 4v7z"/>
                      <path d="M12 10V6"/>
                    </svg>
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
                    style={{ background: '#FFFFFF', border: '1px solid rgba(201,32,53,0.2)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 6px 18px rgba(201,32,53,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.05)'; e.currentTarget.style.borderColor = 'rgba(201,32,53,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 26px rgba(201,32,53,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = 'rgba(201,32,53,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(201,32,53,0.05)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: `rgba(${m._roleColor === '#BDCFCE' ? '34,211,238' : m._roleColor === '#0C4044' ? '74,222,128' : m._roleColor === '#BB8958' ? '245,158,11' : m._roleColor === '#CCA881' ? '167,139,250' : '244,114,182'},0.15)`, color: m._roleColor, border: `1px solid rgba(${m._roleColor === '#BDCFCE' ? '34,211,238' : m._roleColor === '#0C4044' ? '74,222,128' : m._roleColor === '#BB8958' ? '245,158,11' : m._roleColor === '#CCA881' ? '167,139,250' : '244,114,182'},0.35)` }}>{m._role}</span>
                          <span style={{ color: '#C92035', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                        </div>
                        <div style={{ color: text, fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: subtext, fontSize: '11px', marginTop: '3px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#53615F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 21h16v-7a4 4 0 00-4-4H8a4 4 0 00-4 4v7z"/><path d="M12 10V6"/>
                          </svg>
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

 {/* â”€â”€ ANNIVERSARY LIST MODAL â”€â”€ */}
        {showAnniversaryList && (
          <div onClick={() => setShowAnniversaryList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF6ED 100%)', border: '1px solid rgba(204,168,129,0.28)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24), 0 0 0 1px rgba(204,168,129,0.08)' }}>
              <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(204,168,129,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(204,168,129,0.2),rgba(204,168,129,0.1))', border: '1px solid rgba(204,168,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(204,168,129,0.16)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="15" r="6"/><path d="M9 9l3-6 3 6" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '14px' }}>TODAY'S ANNIVERSARIES</div>
                    <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnniversaryList(false)}
                  style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {anniversaryList.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', color: subtext, padding: '50px 0', fontSize: '14px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#53615F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="15" r="6"/><path d="M9 9l3-6 3 6"/>
                    </svg>
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
                    style={{ background: '#FFFFFF', border: '1px solid rgba(204,168,129,0.24)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 6px 18px rgba(204,168,129,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(204,168,129,0.06)'; e.currentTarget.style.borderColor = 'rgba(204,168,129,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 26px rgba(204,168,129,0.14)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = 'rgba(204,168,129,0.24)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(204,168,129,0.06)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(204,168,129,0.15)', color: '#CCA881', border: '1px solid rgba(204,168,129,0.35)' }}>{m._role}</span>
                          <span style={{ color: '#CCA881', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                        </div>
                        <div style={{ color: text, fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: subtext, fontSize: '11px', marginTop: '3px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#53615F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="15" r="6"/><path d="M9 9l3-6 3 6"/>
                          </svg>
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

{/* â”€â”€ JOIN DATE LIST MODAL â”€â”€ */}
        {showJoinDateList && (
          <div onClick={() => setShowJoinDateList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF3E9 100%)', border: '1px solid rgba(187,137,88,0.28)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24), 0 0 0 1px rgba(187,137,88,0.08)' }}>
              <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(187,137,88,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(187,137,88,0.2),rgba(187,137,88,0.1))', border: '1px solid rgba(187,137,88,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(187,137,88,0.16)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BB8958" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 4h8v6a4 4 0 01-8 0V4z"/>
                      <path d="M8 5H5a2 2 0 002 4M16 5h3a2 2 0 01-2 4"/>
                      <path d="M12 14v3M9 21h6M9 21l1-4h4l1 4"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '14px' }}>WORK ANNIVERSARIES</div>
                    <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowJoinDateList(false)}
                  style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {joinDateList.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(187,137,88,0.1)', border: '1px solid rgba(187,137,88,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BB8958" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 4h8v6a4 4 0 01-8 0V4z"/><path d="M12 14v3"/>
                      </svg>
                    </div>
                    <span style={{ color: subtext, fontSize: '14px', fontWeight: 600 }}>No work anniversaries today</span>
                  </div>
                ) : joinDateList.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const yrs = m._yearsCompleted
                      const ordinal = yrs === 1 ? '1st' : yrs === 2 ? '2nd' : yrs === 3 ? '3rd' : `${yrs}th`
                      setSpecialAnnForm({
                        title: `🎉 Happy ${ordinal} Work Anniversary ${m.first_name} ${m.last_name || ''} (${m._id})`,
                        message: `By BitByte Technologies — Congratulations on completing ${yrs} amazing year${yrs > 1 ? 's' : ''} with us! Your dedication and hard work are truly valued. Here's to many more years of success together!`,
                        roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                      })
                      setShowJoinDateList(false)
                      setShowSpecialAnn(true)
                      setSpecialAnnMsg('')
                    }}
                    style={{ background: '#FFFFFF', border: '1px solid rgba(187,137,88,0.24)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 6px 18px rgba(187,137,88,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(187,137,88,0.06)'; e.currentTarget.style.borderColor = 'rgba(187,137,88,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 26px rgba(187,137,88,0.14)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = 'rgba(187,137,88,0.24)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(187,137,88,0.06)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(187,137,88,0.15)', color: '#BB8958', border: '1px solid rgba(187,137,88,0.35)' }}>{m._role}</span>
                          <span style={{ color: '#BB8958', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                        </div>
                        <div style={{ color: text, fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#BB8958', fontSize: '12px', fontWeight: 700, marginTop: '3px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BB8958" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 4h8v6a4 4 0 01-8 0V4z"/><path d="M12 14v3"/>
                          </svg>
                          {m._yearsCompleted === 1 ? '1st' : m._yearsCompleted === 2 ? '2nd' : m._yearsCompleted === 3 ? '3rd' : `${m._yearsCompleted}th`} Year Anniversary
                        </div>
                        <div style={{ color: subtext, fontSize: '11px' }}>Joined: {new Date(m._joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                      </div>
                      <div style={{ color: '#BB8958', fontSize: '11px', fontWeight: 700 }}>Click to Wish</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SPECIAL ANNOUNCEMENT MODAL (Birthday/Anniversary/JoinDate) â”€â”€ */}
        {showSpecialAnn && (
          <div onClick={() => setShowSpecialAnn(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.85)', backdropFilter: 'blur(12px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(187,137,88,0.3)', borderRadius: '24px', width: '95%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(187,137,88,0.15)', border: '1px solid rgba(187,137,88,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}></div>
                  <div>
                    <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '15px' }}>SEND ANNOUNCEMENT</div>
                    <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>Review & send the wish</div>
                  </div>
                </div>
                <button onClick={() => setShowSpecialAnn(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
              </div>

              {specialAnnMsg && (
                <div style={{ background: specialAnnMsg.includes('âœ…') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${specialAnnMsg.includes('âœ…') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: specialAnnMsg.includes('âœ…') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', marginBottom: '18px' }}>
                  {specialAnnMsg}
                </div>
              )}

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Announcement Title</label>
                <input
                  value={specialAnnForm.title}
                  onChange={e => setSpecialAnnForm({ ...specialAnnForm, title: e.target.value })}
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#BB8958'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message</label>
                <textarea
                  value={specialAnnForm.message}
                  onChange={e => setSpecialAnnForm({ ...specialAnnForm, message: e.target.value })}
                  rows={4}
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                  onFocus={e => e.target.style.borderColor = '#BB8958'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Role Checkboxes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Send To</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[
                    { key: 'admin', label: 'Super Stockist', color: '#53615F' },
                    { key: 'dealer', label: 'Distributor', color: '#0C4044' },
                    { key: 'sub_dealer', label: 'Wholesale Dealer', color: '#BB8958' },
                    { key: 'promotor', label: 'Retailer', color: '#CCA881' },
                    { key: 'customer', label: 'Customer', color: '#C92035' },
                  ].map(role => {
                    const checked = specialAnnForm.roles.includes(role.key)
                    const rgb = { '#BDCFCE': '34,211,238', '#0C4044': '74,222,128', '#BB8958': '245,158,11', '#CCA881': '167,139,250', '#C92035': '244,114,182' }[role.color]
                    return (
                      <div key={role.key}
                        onClick={() => {
                          const updated = checked ? specialAnnForm.roles.filter(x => x !== role.key) : [...specialAnnForm.roles, role.key]
                          setSpecialAnnForm({ ...specialAnnForm, roles: updated })
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', background: checked ? `rgba(${rgb},0.14)` : `rgba(${rgb},0.04)`, border: `1.5px solid ${checked ? `rgba(${rgb},0.6)` : `rgba(${rgb},0.18)`}`, transition: 'all 0.2s ease', userSelect: 'none' }}
                      >
                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: `2px solid ${checked ? role.color : `rgba(${rgb},0.35)`}`, background: checked ? role.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {checked && <span style={{ color: '#FDFDFC', fontSize: '9px', fontWeight: 900 }}></span>}
                        </div>
                        <span style={{ color: checked ? role.color : subtext, fontSize: '12px', fontWeight: checked ? 700 : 500 }}>{role.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Send Button */}
              <button
                disabled={specialAnnSending}
                onClick={async () => {
                  if (!specialAnnForm.title.trim() || !specialAnnForm.message.trim()) { setSpecialAnnMsg(' Title and Message required.'); return }
                  if (specialAnnForm.roles.length === 0) { setSpecialAnnMsg(' Select at least one role.'); return }
                  setSpecialAnnSending(true)
                  // AFTER
try {
  await api.post('/announcements/', { title: specialAnnForm.title, message: specialAnnForm.message, target_roles: specialAnnForm.roles })
  setSpecialAnnMsg(' Announcement sent successfully!')
  const annData = await fetchMyAnnouncements()
  fetchAnnouncementCount(annData)
  setTimeout(() => setShowSpecialAnn(false), 1500)
} catch (err) {
  setSpecialAnnMsg(' Failed: ' + JSON.stringify(err.response?.data))
}
                  setSpecialAnnSending(false)
                }}
                style={{ width: '100%', padding: '14px', background: specialAnnSending ? 'rgba(187,137,88,0.3)' : 'linear-gradient(90deg,#BB8958,#BB8958)', border: 'none', borderRadius: '12px', fontWeight: 800, color: specialAnnSending ? '#BB8958' : '#111817', fontSize: '15px', cursor: specialAnnSending ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }}
              >
                {specialAnnSending ? ' Sending...' : ' Send Announcement'}
              </button>
            </div>
          </div>
        )}


        {/* â”€â”€ FULL HIERARCHY MODAL â”€â”€ */}
        {/* {showHierarchy && (
          <div
            onClick={() => { setShowHierarchy(false); setActiveAdmin(null); removeAdminPopup() }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.80)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
  onClick={e => e.stopPropagation()}
  style={{ background: dark ? '#F3F3F0' : '#FDFDFC', border: '1px solid rgba(103,232,249,0.2)', borderRadius: '24px', width: '98%', maxWidth: '1400px', height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
>


              <div style={{ flexShrink: 0, padding: '20px 28px', borderBottom: '1px solid rgba(103,232,249,0.1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <span style={{ color: '#0C4044', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>ðŸ¢ Full Organization Hierarchy</span>
                 {totalStats && (
  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
    {[
      { label: 'Super Admin', roleKey: 'super_admin', count: 1, color: '#CCA881' },
      { label: 'Super Stockists', roleKey: 'admin', count: totalStats.admins, color: '#53615F' },
      { label: 'Distributors', roleKey: 'dealer', count: totalStats.dealers, color: '#0C4044' },
      { label: 'Wholesale Dealers', roleKey: 'sub_dealer', count: totalStats.subDealers, color: '#BB8958' },
      { label: 'Retailers', roleKey: 'promotor', count: totalStats.promotors, color: '#CCA881' },
      { label: 'Customers', roleKey: 'customer', count: totalStats.customers, color: '#C92035' },
    ].map(s => {
      const isActive = hierarchyFilter === s.roleKey
      return (
        <div
          key={s.label}
          onClick={() => setHierarchyFilter(isActive ? null : s.roleKey)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: isActive ? `rgba(${hexToRgb(s.color)},0.22)` : `rgba(${hexToRgb(s.color)},0.08)`,
            border: `1px solid rgba(${hexToRgb(s.color)},${isActive ? 0.8 : 0.25})`,
            borderRadius: '20px', padding: '3px 12px', cursor: 'pointer',
            transform: isActive ? 'translateY(-2px)' : 'none',
            boxShadow: isActive ? `0 4px 14px rgba(${hexToRgb(s.color)},0.3)` : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <span style={{ color: s.color, fontWeight: 800, fontSize: '13px' }}>{s.count}</span>
          <span style={{ color: subtext, fontSize: '11px' }}>{s.label}</span>
        </div>
      )
    })}
  </div>
)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {(
  <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: subtext, pointerEvents: 'none' }}>ðŸ”</span>
                      <input
                        value={hierarchySearch}
                        onChange={e => setHierarchySearch(e.target.value)}
                        placeholder="Search ID, Name, Phone..."
                        style={{
                          width: '220px', background: inpBg, border: `1px solid ${inpBorder}`,
                          borderRadius: '10px', padding: '8px 12px 8px 32px', color: text,
                          fontSize: '12px', outline: 'none', boxSizing: 'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor = '#BDCFCE'}
                        onBlur={e => e.target.style.borderColor = inpBorder}
                      />
                      {hierarchySearch && (
                        <button
                          onClick={() => setHierarchySearch('')}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: subtext, cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                        >Close</button>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => { setShowHierarchy(false); setActiveAdmin(null); removeAdminPopup() }}
                    style={{ background: 'transparent', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >Close</button>
                </div>
              </div>


<div style={{ flex: 1, minHeight: '65vh', overflowX: 'auto', overflowY: 'auto', padding: '28px 32px', scrollBehavior: 'smooth', scrollbarWidth: 'thin', scrollbarColor: 'rgba(189,207,206,0.4) rgba(253,253,252,0.03)' }}>

                {hierarchyLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid rgba(189,207,206,0.2)', borderTop: '3px solid #BDCFCE', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: subtext, fontSize: '14px' }}>Loading hierarchy...</span>
                  </div>
                )}


{!hierarchyLoading && hierarchyData && (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'max-content', margin: '0 auto' }}>


    {hierarchySearch.trim() ? (() => {

  const filteredResults = hierarchyFilter && hierarchyFilter !== 'super_admin'
    ? searchResults.filter(item => item.role === hierarchyFilter)
    : searchResults

  if (debouncedSearch !== hierarchySearch.trim()) {
    return (
      <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>
        ðŸ” Searching...
      </div>
    )
  }
  if (filteredResults.length === 0) {
    return (
      <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>
        No {hierarchyFilter ? hierarchyFilter.replace('_', ' ') + ' ' : ''}results found for "{hierarchySearch}"
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1100px' }}>
      {filteredResults.map((item, idx) => (
        <TreeNode
          key={item.node.id || idx}
          node={item.node}
          role={item.role}
          depth={0}
          dark={dark}
          text={text}
          subtext={subtext}
          colorIdx={idx}
          ancestors={item.ancestors}
          superAdminEmail={localStorage.getItem('email') || ''}
          flatMode={true}
        />
      ))}
    </div>
  )
})() : (
      <>

        {hierarchyFilter && (
          <button
            onClick={() => { setHierarchyFilter(null); setHierarchySearch('') }}
            style={{ marginBottom: '20px', padding: '8px 18px', background: 'rgba(189,207,206,0.1)', border: '1px solid rgba(189,207,206,0.35)', borderRadius: '10px', color: '#53615F', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            â† Back to Full Tree
          </button>
        )}


    {(!hierarchyFilter || hierarchyFilter === 'super_admin') && (
      <>
        <div style={{ background: 'linear-gradient(135deg,rgba(204,168,129,0.12),rgba(204,168,129,0.05))', border: '1px solid rgba(204,168,129,0.5)', borderRadius: '20px', padding: '24px 64px', fontWeight: 800, fontSize: '20px', color: '#CCA881', animation: 'pulseGlow 3s ease-in-out infinite', boxShadow: '0 0 24px rgba(204,168,129,0.1)', textAlign: 'center' }}>
          ðŸ›¡ï¸ Super Admin
          <div style={{ fontSize: '13px', color: '#7A8987', fontWeight: 400, marginTop: '6px' }}>
            {localStorage.getItem('email')}
          </div>
        </div>
        {!hierarchyFilter && <div style={{ width: 2, height: 32, background: 'rgba(189,207,206,0.6)' }} />}
      </>
    )}


    {!hierarchyFilter && hierarchyData.admins.length > 0 && (
      <>
        <div style={{ height: 2, background: 'rgba(189,207,206,0.5)', width: '100%' }} />
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {hierarchyData.admins.map((admin, ai) => (
            <div key={admin.id} className="tree-node-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 2, height: 24, background: 'rgba(204,168,129,0.5)' }} />
              <TreeNode
                node={admin}
                role="admin"
                depth={0}
                dark={dark}
                text={text}
                subtext={subtext}
                colorIdx={ai}
                ancestors={[]}
                superAdminEmail={localStorage.getItem('email') || ''}
              />
            </div>
          ))}
        </div>
      </>
    )}

    {!hierarchyFilter && hierarchyData.admins.length === 0 && (
      <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No admins created yet.</div>
    )}


{hierarchyFilter && hierarchyFilter !== 'super_admin' && (() => {
  const cfg = ROLE_LABELS[hierarchyFilter]
  const idKey = cfg?.idKey || 'id'
  let flatList = flattenByRole(hierarchyFilter)

 if (hierarchySearch.trim()) {
  const q = hierarchySearch.trim().toLowerCase()
  flatList = flatList.filter(item => {
    const n = item.node
    const idVal = (n[idKey] || '').toString().toLowerCase()
    const nameVal = `${n.first_name || ''} ${n.last_name || ''}`.toLowerCase()
    const phoneVal = (n.mobile_number || '').toString().toLowerCase()
    return idVal.includes(q) || nameVal.includes(q) || phoneVal.includes(q)
  })
}

  if (flatList.length === 0) {
    return (
      <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>
        {hierarchySearch.trim() ? `No results found for "${hierarchySearch}"` : `No ${hierarchyFilter.replace('_', ' ')} found.`}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px' }}>
      {flatList.map((item, idx) => (
        <TreeNode
          key={item.node.id || idx}
          node={item.node}
          role={hierarchyFilter}
          depth={0}
          dark={dark}
          text={text}
          subtext={subtext}
          colorIdx={idx}
          ancestors={item.ancestors}
          superAdminEmail={localStorage.getItem('email') || ''}
          flatMode={true}
        />
      ))}
    </div>
  )
})()}
      </>
    )}

  </div>
)}
                {!hierarchyLoading && !hierarchyData && (
                  <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>Failed to load hierarchy.</div>
                )}

              </div>


              {!hierarchyLoading && (
                <div style={{ flexShrink: 0, padding: '14px 28px', borderTop: '1px solid rgba(103,232,249,0.08)', display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                  {[
                    { role: 'Super Admin', color: '#CCA881', emoji: 'ðŸ›¡ï¸' },
                    { role: 'Super Stockist', color: '#53615F', emoji: 'ðŸ›¡ï¸' },
                    { role: 'Distributor', color: '#0C4044', emoji: 'ðŸª' },
                    { role: 'Wholesale Dealer', color: '#BB8958', emoji: 'ðŸ”—' },
                    { role: 'Retailer', color: '#CCA881', emoji: 'ðŸŒŸ' },
                    { role: 'Customer', color: '#C92035', emoji: 'ðŸ‘¤' },
                  ].map(l => (
                    <div key={l.role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: l.color }} />
                      <span style={{ color: subtext, fontSize: '11px' }}>{l.emoji} {l.role}</span>
                    </div>
                  ))}
                  <div style={{ color: subtext, fontSize: '11px', width: '100%', textAlign: 'center' }}>
                    ¡ Click any node to expand/collapse its children
                  </div>
                </div>
              )}

            </div>
          </div>
        )} */}



        {/*TODAY RATES MODAL â”€â”€ */}
        {showTodayRates && (
          <div
            onClick={() => setShowTodayRates(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="modal-scroll"
style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF6ED 100%)', border: '1px solid rgba(204,168,129,0.28)', borderRadius: '24px', width: '95%', maxWidth: '480px', maxHeight: '95vh', overflowY: 'auto', padding: '26px 32px', boxShadow: '0 40px 90px rgba(17,24,23,0.28), 0 0 0 1px rgba(204,168,129,0.08)', animation: 'fadeIn 0.3s ease' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
<div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(145deg,rgba(12,64,68,0.14),rgba(12,64,68,0.06))', border: '1px solid rgba(12,64,68,0.26)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(12,64,68,0.12)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '15px' }}>TODAY'S METAL RATES</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>
                      {dbRateDate ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#53615F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {new Date(dbRateDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </>
                      ) : 'No rate entered yet'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowTodayRates(false)}
                  style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Rate Cards */}
              {[
                { label: 'Gold 22K', color: '#8A5A25', rgb: '204,168,129', value: metalPrices.gold22k, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A5A25" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/></svg> },
                { label: 'Gold 24K', color: '#8A5A25', rgb: '204,168,129', value: metalPrices.gold24k, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A5A25" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/></svg> },
                { label: 'Silver 999', color: '#0C4044', rgb: '12,64,68', value: metalPrices.silver, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/></svg> },
                { label: 'Diamond 18K', color: '#53615F', rgb: '209,223,222', value: metalPrices.diamond18k, hide: true, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#53615F" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/></svg> },
                { label: 'Diamond 22K', color: '#0C4044', rgb: '12,64,68', value: metalPrices.diamond22k, hide: true, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/></svg> },
                { label: 'Platinum 92', color: '#53615F', rgb: '231,237,236', value: metalPrices.platinum92, hide: true, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#53615F" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="#53615F"/></svg> },
              ].filter(item => !item.hide).map(item => (
                <div key={item.label} style={{ background: '#FFFFFF', border: `1px solid rgba(${item.rgb},0.3)`, borderRadius: '14px', padding: '12px 18px', marginBottom: '9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 4px 14px rgba(${item.rgb},0.07)`, transition: 'all 0.2s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `linear-gradient(145deg,rgba(${item.rgb},0.16),rgba(${item.rgb},0.06))`, border: `1px solid rgba(${item.rgb},0.32)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ color: item.color, fontWeight: 800, fontSize: '13px' }}>{item.label}</div>
                      <div style={{ color: '#53615F', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>per gram</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: item.color, fontWeight: 900, fontSize: '17px', fontFamily: 'monospace' }}>
                      {item.value ? item.value.toFixed(2) : <span style={{ color: subtext, fontSize: '13px' }}>Not set</span>}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => { setShowTodayRates(false); setShowRatePopup(true); setRateMsg('') }}
style={{ width: '100%', marginTop: '6px', padding: '14px', background: 'linear-gradient(135deg,#CCA881,#BB8958)', border: 'none', borderRadius: '14px', fontWeight: 800, color: '#FDFDFC', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 14px 30px rgba(204,168,129,0.32)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FDFDFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Update Rates
              </button>
            </div>
          </div>
        )}

        {showRequests && (
          <div
            onClick={() => {
              setShowRequests(false)
              setSelectedRequest(null)
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(17,24,23,0.45)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC',
                border: '1px solid rgba(204,168,129,0.3)',
                borderRadius: '24px',
                width: '95%',
                maxWidth: selectedRequest ? '900px' : '560px',
                maxHeight: '88vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 32px 80px rgba(17,24,23,0.6)'
              }}
            >
              <div style={{
                padding: '22px 28px',
                borderBottom: '1px solid rgba(204,168,129,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                    </svg>
                    PROFILE UPDATE REQUESTS
                  </div>
                  <div style={{ color: subtext, fontSize: '11px', marginTop: '3px' }}>
                    {profileRequests.length} pending requests
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowRequests(false)
                    setSelectedRequest(null)
                  }}
                  style={{
                    background: 'rgba(201,32,53,0.12)',
                    border: '1px solid rgba(201,32,53,0.3)',
                    color: '#C92035',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {requestMsg && (
                <div style={{
                  margin: '14px 28px 0',
                  background: requestMsg.includes('âœ…') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)',
                  border: `1px solid ${requestMsg.includes('âœ…') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`,
                  color: requestMsg.includes('âœ…') ? '#0C4044' : '#C92035',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px'
                }}>
                  {requestMsg}
                </div>
              )}

              {!selectedRequest ? (
                <div style={{ padding: '20px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profileRequests.length === 0 ? (
                    <div style={{ color: subtext, textAlign: 'center', padding: '50px 0' }}>
                      No pending profile requests.
                    </div>
                  ) : profileRequests.map(req => (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      style={{
                        background: dark ? 'rgba(253,253,252,0.03)' : 'rgba(17,24,23,0.03)',
                        border: '1px solid rgba(204,168,129,0.22)',
                        borderRadius: '14px',
                        padding: '16px 18px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>
                            {req.role}
                          </div>
                          <div style={{ color: text, fontWeight: 700, fontSize: '15px', marginTop: '4px' }}>
                            {req.first_name} {req.last_name}
                          </div>
                          <div style={{ color: subtext, fontSize: '12px', marginTop: '4px' }}>
                            {req.email}
                          </div>
                        </div>
                        <div style={{ color: subtext, fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {new Date(req.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>

                      {req.message && (
                        <div style={{ color: subtext, fontSize: '13px', marginTop: '10px', lineHeight: 1.5 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><SvgIcon name="note" size={14} />{req.message}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px 28px', overflowY: 'auto' }}>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    style={{
                      marginBottom: '14px',
                      background: 'rgba(204,168,129,0.1)',
                      border: '1px solid rgba(204,168,129,0.3)',
                      color: '#CCA881',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    â† Back to Requests
                  </button>

                  <div style={{ color: '#CCA881', fontWeight: 800, marginBottom: '14px' }}>
                    REQUEST DETAILS
                  </div>

                  {selectedRequest.message && (
                    <div style={{
                      background: 'rgba(189,207,206,0.06)',
                      border: '1px solid rgba(189,207,206,0.2)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      color: text,
                      fontSize: '14px',
                      marginBottom: '16px',
                      lineHeight: 1.6
                    }}>
                      
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><SvgIcon name="note" size={14} />{selectedRequest.message}</span>
                    </div>
                  )}

                  {selectedRequest.proof_document && (
                    <button
                      onClick={async () => {
                        const url = selectedRequest.proof_document
                        const fullUrl = url.startsWith('http')
                          ? url
                          : `https://bitbyte-e-commerce.onrender.com/${url.replace(/^\//, '')}`

                        setProofUrl('')
                        setProofType('')
                        setProofLoading(true)
                        setProofModal(true)

                        try {
                          const token = localStorage.getItem('token')
                          const response = await fetch(fullUrl, {
                            headers: { Authorization: `Bearer ${token}` }
                          })
                          if (!response.ok) throw new Error('fetch failed')

                          const contentType = response.headers.get('content-type') || ''
                          const blob = await response.blob()
                          const objectUrl = URL.createObjectURL(blob)

                          // PDF-à®•à¯à®•à¯ type check
                          const isPdf = contentType.includes('pdf') ||
                            fullUrl.toLowerCase().includes('.pdf')

                          setProofType(isPdf ? 'pdf' : 'image')
                          setProofUrl(objectUrl)
                        } catch {
                          // Fallback: direct URL try à®ªà®£à¯à®£à¯
                          const isPdf = fullUrl.toLowerCase().includes('.pdf')
                          setProofType(isPdf ? 'pdf' : 'image')
                          setProofUrl(fullUrl)
                        } finally {
                          setProofLoading(false)
                        }
                      }}
                      style={{
                        marginBottom: '16px',
                        background: 'rgba(187,137,88,0.1)',
                        border: '1px solid rgba(187,137,88,0.35)',
                        color: '#BB8958',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><SvgIcon name="paperclip" size={15} />View Proof Document</span>
                    </button>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', color: '#CCA881', padding: '10px', borderBottom: `1px solid ${border}` }}>Field</th>
                          <th style={{ textAlign: 'left', color: '#CCA881', padding: '10px', borderBottom: `1px solid ${border}` }}>Details To Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['initial', 'Initial'],
                          ['first_name', 'First Name'],
                          ['last_name', 'Last Name'],
                          ['mobile_number', 'Mobile Number'],
                          ['gender', 'Gender'],
                          ['dob', 'DOB'],
                          ['married_status', 'Married Status'],
                          ['anniversary_date', 'Anniversary Date'],
                          ['door_no', 'Door No'],
                          ['street_name', 'Street Name'],
                          ['town_name', 'Town Name'],
                          ['city_name', 'City Name'],
                          ['district', 'District'],
                          ['state', 'State'],
                          ['aadhaar_no', 'Aadhaar No'],
                          ['pan_no', 'PAN No'],
                          ['occupation', 'Occupation'],
                          ['occupation_detail', 'Occupation Detail'],
                          ['annual_salary', 'Annual Salary'],
                        ].map(([key, label]) => (
                          selectedRequest[key] ? (
                            <tr key={key}>
                              <td style={{ padding: '10px', color: subtext, borderBottom: `1px solid ${border}` }}>{label}</td>
                              <td style={{ padding: '10px', color: text, borderBottom: `1px solid ${border}` }}>{selectedRequest[key]}</td>
                            </tr>
                          ) : null
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => approveProfileRequest(selectedRequest.id)}
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      padding: '13px',
                      background: 'linear-gradient(90deg,#CCA881,#BDCFCE)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#FDFDFC',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    âœ… Approve Request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* â”€â”€ ANNOUNCEMENT SEND MODAL (Super Admin) â”€â”€ */}
        {showAnnouncement && (
          <div
            onClick={() => setShowAnnouncement(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="modal-scroll"
              style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF3E9 100%)', border: '1px solid rgba(187,137,88,0.28)', borderRadius: '24px', width: '95%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px 36px', boxShadow: '0 40px 90px rgba(17,24,23,0.28), 0 0 0 1px rgba(187,137,88,0.08)', animation: 'fadeIn 0.3s cubic-bezier(0.22,1,0.36,1)' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(145deg,rgba(187,137,88,0.22),rgba(187,137,88,0.1))', border: '1px solid rgba(187,137,88,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(187,137,88,0.2)' }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#BB8958" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10v4a1 1 0 001 1h2l6 4V5L6 9H4a1 1 0 00-1 1z"/>
                      <path d="M16 8a4 4 0 010 8M19 6a7 7 0 010 12"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '15px', letterSpacing: '0.05em' }}>SEND ANNOUNCEMENT</div>
                    <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>Notify selected roles instantly</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnnouncement(false)}
                  style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {announcementMsg && (
                <div style={{ background: announcementMsg.includes('âœ…') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${announcementMsg.includes('âœ…') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: announcementMsg.includes('âœ…') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', marginBottom: '18px' }}>
                  {announcementMsg}
                </div>
              )}

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Announcement Title *</label>
                <input
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g. Tomorrow Leave, Low Orders Alert..."
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#BB8958'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message *</label>
                <textarea
                  value={announcementForm.message}
                  onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  rows={4}
                  placeholder="Type your announcement here..."
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                  onFocus={e => e.target.style.borderColor = '#BB8958'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Role Checkboxes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Send To (Select Roles) *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[
                    { key: 'admin', label: 'Super Stockist', color: '#53615F', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/></svg> },
                    { key: 'dealer', label: 'Distributor', color: '#0C4044', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="6" height="10" rx="1"/><rect x="9" y="4" width="6" height="16" rx="1"/><rect x="15" y="13" width="6" height="7" rx="1"/></svg> },
                    { key: 'sub_dealer', label: 'Wholesale Dealer', color: '#BB8958', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 4.5"/><path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07L12.5 19.5"/></svg> },
                    { key: 'promotor', label: 'Retailer', color: '#CCA881', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg> },
                    { key: 'customer', label: 'Customer', color: '#C92035', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/></svg> },
                  ].map(role => {
                    const checked = announcementForm.roles.includes(role.key)
                    const r = parseInt(role.color.slice(1, 3), 16), g = parseInt(role.color.slice(3, 5), 16), b = parseInt(role.color.slice(5, 7), 16)
                    const rgb = `${r},${g},${b}`
                    return (
                      <div key={role.key}
                        onClick={() => {
                          const updated = checked ? announcementForm.roles.filter(x => x !== role.key) : [...announcementForm.roles, role.key]
                          setAnnouncementForm({ ...announcementForm, roles: updated })
                        }}
style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '999px', cursor: 'pointer', background: checked ? `rgba(${rgb},0.14)` : '#FFFFFF', border: `1.5px solid ${checked ? `rgba(${rgb},0.55)` : 'rgba(189,207,206,0.6)'}`, transition: 'all 0.2s ease', userSelect: 'none', boxShadow: checked ? `0 6px 16px rgba(${rgb},0.16)` : 'none' }}
                      >
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${checked ? role.color : `rgba(${rgb},0.35)`}`, background: checked ? role.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0 }}>
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#111817" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <span style={{ color: checked ? role.color : subtext, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {role.icon}
                          <span style={{ fontSize: '13px', fontWeight: checked ? 700 : 500 }}>{role.label}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Select All */}
                <button
                  onClick={() => {
                    const all = ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                    const allSelected = all.every(r => announcementForm.roles.includes(r))
                    setAnnouncementForm({ ...announcementForm, roles: allSelected ? [] : all })
                  }}
                  style={{ marginTop: '10px', padding: '6px 14px', fontSize: '11px', fontWeight: 700, background: 'rgba(187,137,88,0.1)', border: '1px solid rgba(187,137,88,0.3)', borderRadius: '8px', color: '#BB8958', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BB8958" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    {['admin', 'dealer', 'sub_dealer', 'promotor', 'customer'].every(r => announcementForm.roles.includes(r)) && <polyline points="8 12 11 15 16 9"/>}
                  </svg>
                  {['admin', 'dealer', 'sub_dealer', 'promotor', 'customer'].every(r => announcementForm.roles.includes(r)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Send Button */}
              <button
                disabled={announcingSending}
                onClick={async () => {
                  if (!announcementForm.title.trim() || !announcementForm.message.trim()) { setAnnouncementMsg('âŒ Title and Message are required.'); return }
                  if (announcementForm.roles.length === 0) { setAnnouncementMsg('âŒ Please select at least one role.'); return }
                  setAnnouncingSending(true)
                  try {
                    // AFTER
await api.post('/announcements/', { title: announcementForm.title, message: announcementForm.message, target_roles: announcementForm.roles })
setAnnouncementMsg('âœ… Announcement sent successfully!')
setAnnouncementForm({ title: '', message: '', roles: [] })
const annData = await fetchMyAnnouncements()
fetchAnnouncementCount(annData)
                  } catch (err) {
                    setAnnouncementMsg('âŒ Failed: ' + JSON.stringify(err.response?.data))
                  }
                  setAnnouncingSending(false)
                }}
style={{ width: '100%', padding: '15px', background: announcingSending ? 'rgba(187,137,88,0.3)' : 'linear-gradient(135deg,#CCA881,#BB8958)', border: 'none', borderRadius: '14px', fontWeight: 800, color: announcingSending ? '#BB8958' : '#FDFDFC', fontSize: '15px', cursor: announcingSending ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: announcingSending ? 'none' : '0 14px 30px rgba(187,137,88,0.32)' }}
              >
                {announcingSending ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(17,24,23,0.3)', borderTop: '2px solid #111817', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FDFDFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10v4a1 1 0 001 1h2l6 4V5L6 9H4a1 1 0 00-1 1z"/>
                      <path d="M16 8a4 4 0 010 8M19 6a7 7 0 010 12" strokeLinecap="round"/>
                    </svg>
                    Send Announcement
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ SUPER ADMIN ANNOUNCEMENT VIEW MODAL â”€â”€ */}
        {/* â”€â”€ SUPER ADMIN ANNOUNCEMENT VIEW MODAL â”€â”€ */}
        {showMyAnnouncements && (
          <div
            onClick={() => setShowMyAnnouncements(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(17,24,23,0.45)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#EEF4F3 100%)',
                border: '1px solid rgba(12,64,68,0.16)',
                borderRadius: '24px',
                width: '95%',
                maxWidth: '560px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 40px 90px rgba(17,24,23,0.24), 0 0 0 1px rgba(12,64,68,0.06)'
              }}
            >
              <div style={{
                flexShrink: 0,
                padding: '24px 28px',
                borderBottom: '1px solid rgba(12,64,68,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(145deg,rgba(12,64,68,0.14),rgba(12,64,68,0.06))',
                    border: '1px solid rgba(12,64,68,0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(12,64,68,0.14)'
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="13" rx="2"/>
                      <path d="M2 9l10 6 10-6"/>
                      <path d="M16 3l3 3-3 3"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '14px' }}>
                      MY ANNOUNCEMENTS
                    </div>
                    <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>
                      {myAnnouncements.length} total sent by Super Admin
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowMyAnnouncements(false)}
                  style={{
                    background: 'rgba(201,32,53,0.12)',
                    border: '1px solid rgba(201,32,53,0.3)',
                    color: '#C92035',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,32,53,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="modal-scroll" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {myAnnouncements.length === 0 ? (
                  <div style={{ textAlign: 'center', color: subtext, padding: '60px 0', fontSize: '15px' }}>
                    No announcements yet.
                  </div>
                ) : myAnnouncements.map((ann, idx) => (
                  <div
                    key={ann.id}
                    style={{
                      background: idx === 0 ? 'rgba(12,64,68,0.04)' : '#FFFFFF',
                      border: `1px solid ${idx === 0 ? 'rgba(12,64,68,0.3)' : 'rgba(189,207,206,0.5)'}`,
                      borderRadius: '16px',
                      padding: '18px 20px',
                      boxShadow: idx === 0 ? '0 8px 20px rgba(12,64,68,0.08)' : '0 4px 12px rgba(7,59,63,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {idx === 0 && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '20px',
                            background: 'rgba(12,64,68,0.12)',
                            color: '#0C4044',
                            border: '1px solid rgba(12,64,68,0.28)'
                          }}>
                            ● NEW
                          </span>
                        )}
                        <span style={{ color: idx === 0 ? '#073B3F' : text, fontWeight: 700, fontSize: '14px' }}>
                          {ann.title}
                        </span>
                      </div>

                      <span style={{ color: subtext, fontSize: '10px', whiteSpace: 'nowrap' }}>
                        {new Date(ann.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div style={{ color: subtext, fontSize: '13px', lineHeight: 1.6 }}>
                      {ann.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ SUPER ADMIN: VIEW REPLIES MODAL â”€â”€ */}
        {replyAnn && (
          <div
            onClick={() => { setReplyAnn(null); setReplyMsg(''); setReplyText('') }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.85)', backdropFilter: 'blur(12px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(189,207,206,0.3)', borderRadius: '20px', padding: '28px', width: '95%', maxWidth: '520px', maxHeight: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexShrink: 0 }}>
                <div>
                  <div style={{ color: '#53615F', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '7px' }}><SvgIcon name="note" size={16} />WISHES RECEIVED</div>
                  <div style={{ color: subtext, fontSize: '11px', marginTop: '4px' }}>{replyAnn.title}</div>
                </div>
                <button onClick={() => setReplyAnn(null)} aria-label="Close replies" style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><SvgIcon name="close" size={15} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(189,207,206,0.4) transparent' }}>
                {(annReplies[replyAnn.id] || []).length === 0 ? (
                  <div style={{ textAlign: 'center', color: subtext, padding: '40px 0', fontSize: '14px' }}>No wishes received yet.</div>
                ) : (annReplies[replyAnn.id] || []).map(r => (
                  <div key={r.id} style={{ background: 'rgba(253,253,252,0.03)', border: '1px solid rgba(189,207,206,0.15)', borderRadius: '12px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#53615F' }}>{r.replied_by_name}</span>
                      <span style={{ fontSize: '10px', color: subtext }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: dark ? '#111817' : '#7A8987' }}>{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}




        {/* â”€â”€ PROOF DOCUMENT PREVIEW MODAL â”€â”€ */}
        {proofModal && (
          <div
            onClick={() => {
              if (proofUrl?.startsWith('blob:')) URL.revokeObjectURL(proofUrl)
              setProofModal(false)
              setProofUrl('')
              setProofType('')
            }}

            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(17,24,23,0.92)',
              backdropFilter: 'blur(14px)',
              zIndex: 1400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC',
                border: '1px solid rgba(187,137,88,0.35)',
                borderRadius: '20px',
                width: '95%',
                maxWidth: '780px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(17,24,23,0.7)'
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid rgba(187,137,88,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(187,137,88,0.15)',
                      border: '1px solid rgba(187,137,88,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}
                  >
              
                  </div>

                  <div>
                    <div
                      style={{
                        color: '#BB8958',
                        fontWeight: 800,
                        fontSize: '13px',
                        letterSpacing: '0.05em'
                      }}
                    >
                      PROOF DOCUMENT
                    </div>

                    <div style={{ color: subtext, fontSize: '10px', marginTop: '2px' }}>
                      {selectedRequest?.first_name} {selectedRequest?.last_name} {selectedRequest?.role?.toUpperCase()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setProofModal(false); setProofUrl('') }}
                  style={{
                    background: 'rgba(201,32,53,0.1)',
                    border: '1px solid rgba(201,32,53,0.3)',
                    color: '#C92035',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Close
                </button>
              </div>

              {/* Document Preview */}
              <div style={{
                flex: 1, overflow: 'auto', padding: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '400px', flexDirection: 'column'
              }}>

                {proofLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: 40, height: 40,
                      border: '3px solid rgba(187,137,88,0.2)',
                      borderTop: '3px solid #BB8958',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ color: subtext, fontSize: '14px' }}>Loading document...</span>
                  </div>
                )}

                {/* âœ… IMAGE */}
                {!proofLoading && proofType === 'image' && proofUrl && (
                  <img
                    src={proofUrl}
                    alt="Proof"
                    style={{
                      maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain',
                      borderRadius: '12px', border: '1px solid rgba(187,137,88,0.2)',
                      display: 'block'
                    }}
                    onError={() => setProofType('error')}
                  />
                )}

                {/* âœ… PDF blob: URL-à®•à¯à®•à¯ iframe use à®ªà®£à¯à®£à¯ */}
                {!proofLoading && proofType === 'pdf' && proofUrl && (
                  <iframe
                    src={proofUrl}
                    style={{
                      width: '100%',
                      height: '65vh',
                      borderRadius: '10px',
                      border: 'none',
                      display: 'block',
                      background: '#FDFDFC'
                    }}
                    title="Proof Document"
                  />
                )}

                {/* âœ… Error fallback */}
                {!proofLoading && proofType === 'error' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '40px' }}>
                    <SvgIcon name="warning" size={40} stroke="#BB8958" />
                    <div style={{ color: subtext, fontSize: '14px', textAlign: 'center' }}>
                      Document load failed
                    </div>

                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(187,137,88,0.15)',
                        border: '1px solid rgba(187,137,88,0.4)',
                        borderRadius: '10px',
                        color: '#BB8958',
                        fontSize: '13px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      Open in New Tab
                    </a>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>

      {showAddCoin && (
  <div onClick={() => setShowAddCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0a1628', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto', padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '16px' }}>Add Coins to Stock</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>Coins added here go directly into your stock no approval needed</div>
        </div>
        <button onClick={() => setShowAddCoin(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['gold_22k', 'gold_24k', 'silver_999'].map(m => (
          <div key={m} onClick={() => { setSelCoinMetal(m); setSelCoinWeight('') }}
            style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
              background: selCoinMetal === m ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${selCoinMetal === m ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.1)'}`,
              color: selCoinMetal === m ? '#fbbf24' : '#94a3b8' }}>
            {COIN_METAL_LABELS_TEXT[m]}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>WEIGHT</label>
          <select value={selCoinWeight} onChange={e => setSelCoinWeight(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 12px', color: '#fff', fontSize: '13px', outline: 'none' }}>
            <option value="" style={{ background: '#0a1628', color: '#fff' }}>-- Select --</option>
            {(selCoinMetal === 'silver_999' ? COIN_WEIGHTS_SILVER : COIN_WEIGHTS_GOLD).map(w => (
              <option key={w.label} value={w.label} style={{ background: '#0a1628', color: '#fff' }}>{w.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>QTY</label>
          <input type="number" min="1" value={selCoinQty} onChange={e => setSelCoinQty(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 12px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={addToCoinCart}
            style={{ padding: '11px 18px', background: 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '10px', color: '#3b0024', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
            + Add
          </button>
        </div>
      </div>

      {coinCart.length > 0 && (
        <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {coinCart.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{COIN_METAL_LABELS_TEXT[item.metal_type]} {item.weight_label} Ã— {item.qty}</span>
              <button onClick={() => removeCoinCartItem(idx)} aria-label="Remove coin item" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><SvgIcon name="close" size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {coinBuyMsg && (
        <div style={{
          background: coinBuyMsg.startsWith('success:') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${coinBuyMsg.startsWith('success:') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: coinBuyMsg.startsWith('success:') ? '#4ade80' : '#f87171',
          borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px'
        }}>
          {coinBuyMsg.replace('success:', '').replace('error:', '')}
        </div>
      )}

      <button
        disabled={coinBuySubmitting || coinCart.length === 0}
        onClick={submitAddCoins}
        style={{ width: '100%', padding: '14px', background: coinBuySubmitting || coinCart.length === 0 ? 'rgba(244,114,182,0.2)' : 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', color: '#3b0024', cursor: coinBuySubmitting || coinCart.length === 0 ? 'not-allowed' : 'pointer' }}>
        {coinBuySubmitting ? 'Adding...' : 'Confirm & Add to Stock'}
      </button>
    </div>
  </div>
)}

    </div>
  )
}



























