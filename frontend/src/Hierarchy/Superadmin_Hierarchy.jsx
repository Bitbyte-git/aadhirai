import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { SkeletonCard } from '../components/Skeleton'

// ── SVG ICONS ──
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
const IconStar = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconUser = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
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
const IconChart = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconSearch = ({ color, size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconX = ({ color, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconBack = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const IconMinus = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
  </svg>
)
const IconPlus = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" /><path d="M5 12h14" />
  </svg>
)
const IconFit = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    <path d="M9 12h6" />
  </svg>
)
const IconBuilding = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20"/><line x1="9" y1="6" x2="9" y2="6"/><line x1="15" y1="6" x2="15" y2="6"/>
    <line x1="9" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="9" y2="14"/>
    <line x1="15" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="15" y2="18"/>
  </svg>
)
const IconSwitchView = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3l4 4-4 4"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <path d="M7 21l-4-4 4-4"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)

const IconChevronDown = ({ color, size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

// ── ROLE CONFIG — every role has ONE fixed color. This color is used for the node's
// border AND for the curvy connector line that leads INTO that role's nodes. ──
const ROLE_CFG = {
  super_admin: { color: '#7C3AED', Icon: IconShield, label: 'SUPER ADMIN' },
  admin: { color: '#16A34A', Icon: IconShield, label: 'ADMIN', idKey: 'admin_id' },
  dealer: { color: '#0284C7', Icon: IconStore, label: 'DEALER', idKey: 'dealer_id' },
  sub_dealer: { color: '#DC2626', Icon: IconLink, label: 'SUB DEALER', idKey: 'sub_dealer_id' },
  promotor: { color: '#CA8A04', Icon: IconStar, label: 'PROMOTOR', idKey: 'promotor_id' },
  customer: { color: '#DB2777', Icon: IconUser, label: 'CUSTOMER', idKey: 'customer_id' },
}
const CHILD_ROLE = { admin: 'dealer', dealer: 'sub_dealer', sub_dealer: 'promotor', promotor: 'customer', customer: 'customer' }
const CHILD_KEY = { admin: 'dealers', dealer: 'sub_dealers', sub_dealer: 'promotors', promotor: 'customers', customer: 'customers' }

// ── raw SVG strings for innerHTML (DOM popup-ku react component use panna mudiyathu) ──
function iconSvg(paths, color, size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}
const ICON_PATHS = {
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  store: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M4 9v10h16V9"/><path d="M9 21v-6h6v6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mappin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
}
const ICON_BY_TYPE = { admin: 'shield', dealer: 'store', sub_dealer: 'link', promotor: 'star', customer: 'user' }

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

let _chainHideTimer = null
function removeChainPopup() {
  document.querySelectorAll('#chain-popup').forEach(el => el.remove())
}
function scheduleHideChainPopup() {
  clearTimeout(_chainHideTimer)
  _chainHideTimer = setTimeout(() => removeChainPopup(), 200)
}

function printPersonCard(node, role, cfg, color, ancestors, superAdminEmail) {
  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: role, data: node },
  ]
  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    if (item.type === 'super_admin') {
      return `<div class="chain-item ${isLast ? 'current' : ''}">
        <div class="chain-role">SUPER ADMIN</div>
        <div class="chain-email">${item.data.email || '—'}</div>
      </div>${idx < chain.length - 1 ? `<div class="chain-arrow">↓</div>` : ''}`
    }
    const r = ROLE_CFG[item.type]
    if (!r) return ''
    const d = item.data || {}
    const idVal = d[r.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || '—'
    return `<div class="chain-item ${isLast ? 'current' : ''}">
      <div class="chain-role">${r.label}</div>
      <div class="chain-id">${idVal}</div>
      <div class="chain-name">${name}</div>
      <div class="chain-info">Tel: ${phone}</div>
      <div class="chain-info">${city}</div>
    </div>${idx < chain.length - 1 ? `<div class="chain-arrow">↓</div>` : ''}`
  }).join('')
  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || '—'
  const roleLabel = ROLE_CFG[role]?.label || role.toUpperCase()
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>${roleLabel} — ${currentName}</title>
    <style>${getPrintStyles(color)}</style></head>
    <body><div class="wrapper">
      <div class="header"><h1>BitByte — ${roleLabel} Profile</h1><p>Hierarchy Chain Report</p></div>
      ${chainHtml}
      <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
    <script>window.onload = () => { window.print() }<\/script>
    </body></html>
  `)
  printWindow.document.close()
}

// ── Super Admin Page Theme Print Styles for Profile Card ──
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
    .chain-email { font-size:12px; color:#073B3F; font-weight:600; }
    .chain-info { font-size:11.5px; color:#5C706E; margin-top:2px; }
    .chain-arrow { text-align:center; color:#073B3F; margin:2px 0 6px; font-size:16px; font-weight:900; line-height:1; }
    .footer { text-align:center; font-size:10.5px; color:#5C706E; margin-top:26px; border-top:1px solid #E1EBEA; padding-top:14px; }
    @media print {
      body { background:#FFFFFF !important; padding:10mm !important; }
      .wrapper { border:none !important; box-shadow:none !important; padding:0 !important; max-width:100% !important; }
    }
  `
}

function countSubtree(adminNode) {
  const counts = { dealer: 0, sub_dealer: 0, promotor: 0, customer: 0, orders: adminNode.order_count || 0 }
  const countCust = (c) => {
    counts.customer++
    if (c.customers && c.customers.length) {
      c.customers.forEach(countCust)
    }
  }
  ;(adminNode.dealers || []).forEach(d => {
    counts.dealer++
    ;(d.sub_dealers || []).forEach(sd => {
      counts.sub_dealer++
      ;(sd.promotors || []).forEach(p => {
        counts.promotor++
        ;(p.customers || []).forEach(countCust)
      })
    })
  })
  return counts
}

function renderBracketBranch(node, role, childRole, childKey) {
  const cfg = ROLE_CFG[role] || { color: '#073B3F', label: role.toUpperCase(), idKey: 'id' }
  const idVal = node[cfg.idKey] || node.id || '—'
  const name = [node.first_name, node.last_name].filter(Boolean).join(' ') || node.name || '—'
  const phone = node.mobile_number || ''
  const city = node.city_name || ''
  const orderCount = node.order_count ?? 0
  const children = childRole && childKey ? (node[childKey] || []) : []
  const hasChildren = children.length > 0
  const nextChildRole = CHILD_ROLE[childRole]
  const nextChildKey = CHILD_KEY[childRole]

  const cardHtml = `
    <div class="bracket-card" style="border-left-color: ${cfg.color};">
      <div class="bracket-card-role" style="color: ${cfg.color}; background: ${cfg.color}15;">
        ${cfg.label}
      </div>
      <div class="bracket-card-id" style="color: ${cfg.color};">${idVal}</div>
      <div class="bracket-card-name" title="${name}">${name}</div>
      ${phone ? `<div class="bracket-card-sub">📞 ${phone}</div>` : ''}
      ${city ? `<div class="bracket-card-sub">📍 ${city}</div>` : ''}
      <div class="bracket-card-footer">
        <span class="bracket-order-badge">📦 ${orderCount} Orders</span>
        ${hasChildren ? `<span class="bracket-child-badge" style="color:${cfg.color};">${children.length} ${ROLE_CFG[childRole]?.label || 'Downlines'}</span>` : ''}
      </div>
    </div>
  `

  if (!hasChildren) {
    return `
      <div class="bracket-branch">
        <div class="bracket-node-wrapper">${cardHtml}</div>
      </div>
    `
  }

  const childrenHtml = children.map((ch, idx) => {
    const isFirst = idx === 0
    const isLast = idx === children.length - 1
    const isOnly = children.length === 1
    const posClass = isOnly ? 'bracket-pos-only' : isFirst ? 'bracket-pos-first' : isLast ? 'bracket-pos-last' : 'bracket-pos-middle'

    return `
      <div class="bracket-child-row ${posClass}">
        <div class="bracket-arm"></div>
        ${renderBracketBranch(ch, childRole, nextChildRole, nextChildKey)}
      </div>
    `
  }).join('')

  return `
    <div class="bracket-branch">
      <div class="bracket-node-wrapper">${cardHtml}</div>
      <div class="bracket-stem"></div>
      <div class="bracket-children">
        ${childrenHtml}
      </div>
    </div>
  `
}

function printHorizontalBracketTree(adminNode, role, ancestors, superAdminEmail) {
  const adminName = [adminNode.first_name, adminNode.last_name].filter(Boolean).join(' ') || 'Super Stockist'
  const adminId = adminNode.admin_id || adminNode.id || ''
  const counts = countSubtree(adminNode)

  const saCardHtml = `
    <div class="bracket-card bracket-card-root" style="border-left-color: ${ROLE_CFG.super_admin.color};">
      <div class="bracket-card-role" style="color: ${ROLE_CFG.super_admin.color}; background: ${ROLE_CFG.super_admin.color}18;">
        LEVEL 1 • SUPER ADMIN
      </div>
      <div class="bracket-card-name" style="margin-top:4px;">Main Portal</div>
      <div class="bracket-card-sub" style="font-weight:750; color:#073B3F;">${superAdminEmail}</div>
      <div class="bracket-card-footer" style="margin-top:5px;">
        <span style="color:#16A34A; font-weight:800;">● Active Root</span>
      </div>
    </div>
  `

  const adminBranchHtml = renderBracketBranch(adminNode, 'admin', 'dealer', 'dealers')

  const fullTreeHtml = `
    <div class="bracket-branch">
      <div class="bracket-node-wrapper">${saCardHtml}</div>
      <div class="bracket-stem"></div>
      <div class="bracket-children">
        <div class="bracket-child-row bracket-pos-only">
          <div class="bracket-arm"></div>
          ${adminBranchHtml}
        </div>
      </div>
    </div>
  `

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site to print.')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Hierarchy Tree — ${adminName} (${adminId})</title>
      <style id="print-orientation-style">
        @page {
          size: A4 landscape;
          margin: 8mm 6mm;
        }
      </style>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        body {
          font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
          background:#F4F8F8;
          color:#111817;
          padding:16px 20px 40px;
          min-width:100%;
        }

        .print-toolbar {
          position:sticky; top:0; z-index:9999;
          background:#FFFFFF; border:1px solid #D6E2E1; border-radius:12px;
          padding:10px 16px; margin-bottom:16px;
          display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;
          box-shadow:0 4px 18px rgba(7,59,63,0.1);
        }
        .btn-print {
          background:#073B3F; color:#FFFFFF; border:none; border-radius:8px;
          padding:8px 18px; font-weight:800; font-size:13px; cursor:pointer;
          display:inline-flex; align-items:center; gap:6px; transition:background .15s;
        }
        .btn-print:hover { background:#0C4044; }
        .btn-mode {
          background:#F4F8F8; color:#073B3F; border:1px solid #D6E2E1; border-radius:8px;
          padding:7px 14px; font-weight:700; font-size:12px; cursor:pointer;
        }
        .btn-mode.active {
          background:#E6F0F0; border-color:#073B3F; color:#073B3F; font-weight:800;
        }
        .btn-action {
          background:#FFFFFF; color:#5C706E; border:1px solid #D6E2E1; border-radius:8px;
          padding:7px 12px; font-weight:700; font-size:12px; cursor:pointer;
        }
        .btn-close {
          background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; border-radius:8px;
          padding:7px 14px; font-weight:700; font-size:12px; cursor:pointer;
        }

        .report-header {
          background:linear-gradient(135deg,#073B3F 0%,#0C4044 100%);
          color:#FFFFFF; border-radius:14px; padding:16px 20px; margin-bottom:12px;
          display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;
          box-shadow:0 4px 14px rgba(7,59,63,0.15);
        }
        .report-brand h2 { font-size:16px; font-weight:900; letter-spacing:0.5px; color:#FFFFFF; }
        .report-brand p { font-size:11.5px; color:#D6E2E1; margin-top:2px; font-weight:500; }
        .report-meta { text-align:right; font-size:11px; color:#E1EBEA; line-height:1.45; }
        .report-meta strong { color:#FFFFFF; font-weight:800; }

        .report-stats-strip {
          display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px;
        }
        .stat-pill {
          background:#FFFFFF; border:1.5px solid #D6E2E1; border-radius:9px;
          padding:6px 12px; font-size:10.5px; font-weight:700;
          display:inline-flex; align-items:center; gap:6px;
          box-shadow:0 1px 4px rgba(7,59,63,0.04);
        }
        .stat-pill strong { font-size:12px; font-weight:900; }

        .tree-scroll-container {
          background:#FFFFFF; border:1.5px solid #D6E2E1; border-radius:16px;
          padding:24px 20px; overflow-x:auto; width:100%; box-shadow:0 4px 20px rgba(7,59,63,0.05);
        }
        #bracket-tree-root {
          display:inline-block; min-width:max-content; position:relative;
        }

        /* ── BRACKET HIERARCHY TREE CSS ── */
        .bracket-branch {
          display:flex; align-items:center; position:relative;
        }
        .bracket-node-wrapper {
          flex-shrink:0; display:flex; align-items:center; z-index:2; position:relative;
        }
        .bracket-stem {
          width:20px; height:2px; background:#073B3F; flex-shrink:0; z-index:1;
        }
        .bracket-children {
          display:flex; flex-direction:column; justify-content:center;
          position:relative; flex-shrink:0;
        }
        .bracket-child-row {
          display:flex; align-items:center; position:relative; padding:3px 0; margin:0;
        }
        .bracket-arm {
          width:20px; height:2px; background:#073B3F; flex-shrink:0; position:relative; z-index:1;
        }

        .bracket-child-row.bracket-pos-first::before {
          content:''; position:absolute; left:0; top:50%; bottom:0; width:2px; background:#073B3F; z-index:1;
        }
        .bracket-child-row.bracket-pos-middle::before {
          content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:#073B3F; z-index:1;
        }
        .bracket-child-row.bracket-pos-last::before {
          content:''; position:absolute; left:0; top:0; bottom:50%; width:2px; background:#073B3F; z-index:1;
        }
        .bracket-child-row.bracket-pos-only::before {
          display:none;
        }

        .bracket-card {
          width:142px; background:#FFFFFF; border:1px solid #D6E2E1;
          border-left:3.5px solid #073B3F; border-radius:8px;
          padding:6px 8px; box-shadow:0 1px 4px rgba(7,59,63,0.06);
          box-sizing:border-box; text-align:left;
          page-break-inside:avoid; break-inside:avoid;
        }
        .bracket-card-root {
          background:#FAF5FF;
        }
        .bracket-card-role {
          display:inline-block; font-size:8px; font-weight:900;
          letter-spacing:0.5px; border-radius:4px; padding:1px 5px; text-transform:uppercase;
        }
        .bracket-card-id {
          font-family:monospace; font-size:9.5px; font-weight:800; margin:2px 0 1px;
        }
        .bracket-card-name {
          font-size:11.5px; font-weight:800; color:#111817; line-height:1.2;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .bracket-card-sub {
          font-size:9px; color:#5C706E; margin-top:1px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .bracket-card-footer {
          display:flex; justify-content:space-between; align-items:center;
          margin-top:4px; padding-top:3px; border-top:1px dashed #E1EBEA; font-size:8.5px;
        }
        .bracket-order-badge {
          color:#073B3F; font-weight:700;
        }
        .bracket-child-badge {
          font-weight:800;
        }

        @media print {
          .no-print { display:none !important; }
          body {
            background:#FFFFFF !important; padding:0 !important; margin:0 !important;
            width:100% !important; max-width:100% !important; overflow-x:hidden !important;
          }
          .report-header {
            box-shadow:none !important; border:1px solid #073B3F; margin-bottom:8px; padding:10px 14px;
          }
          .report-stats-strip { margin-bottom:10px; }
          .tree-scroll-container {
            border:none !important; padding:4px 0 !important; box-shadow:none !important;
            overflow:visible !important; width:100% !important; max-width:100% !important;
          }
          .bracket-card {
            box-shadow:none !important; page-break-inside:avoid; break-inside:avoid;
          }
          #bracket-tree-root {
            max-width:100% !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-toolbar no-print">
        <div style="display:flex; align-items:center; gap:8px;">
          <button onclick="window.print()" class="btn-print">🖨️ Print / Save as PDF</button>
          <button onclick="setOrientation('landscape')" class="btn-mode active" id="btn-landscape">📄 Landscape (Recommended)</button>
          <button onclick="setOrientation('portrait')" class="btn-mode" id="btn-portrait">📄 Portrait</button>
          <button onclick="zoomFit()" class="btn-action">↔ Fit to Page Width</button>
          <button onclick="zoomIn()" class="btn-action">🔍 +</button>
          <button onclick="zoomOut()" class="btn-action">🔍 -</button>
        </div>
        <button onclick="window.close()" class="btn-close">✖ Close</button>
      </div>

      <div class="report-header">
        <div class="report-brand">
          <h2>BitByte — Super Stockist Hierarchy Report</h2>
          <p>Full Downward Organization Network • Left-to-Right Bracket View</p>
        </div>
        <div class="report-meta">
          <div>ROOT SUPER ADMIN: <strong>${superAdminEmail}</strong></div>
          <div>SUPER STOCKIST: <strong>${adminName} (${adminId})</strong></div>
          <div>DATE: <strong>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
        </div>
      </div>

      <div class="report-stats-strip">
        <div class="stat-pill" style="border-color:#16A34A; color:#16A34A;">
          <span>SUPER STOCKIST</span> <strong>1</strong>
        </div>
        <div class="stat-pill" style="border-color:#0284C7; color:#0284C7;">
          <span>DISTRIBUTORS</span> <strong>${counts.dealer}</strong>
        </div>
        <div class="stat-pill" style="border-color:#DC2626; color:#DC2626;">
          <span>WHOLESALE DEALERS</span> <strong>${counts.sub_dealer}</strong>
        </div>
        <div class="stat-pill" style="border-color:#CA8A04; color:#CA8A04;">
          <span>RETAILERS</span> <strong>${counts.promotor}</strong>
        </div>
        <div class="stat-pill" style="border-color:#DB2777; color:#DB2777;">
          <span>CUSTOMERS</span> <strong>${counts.customer}</strong>
        </div>
        <div class="stat-pill" style="border-color:#073B3F; color:#073B3F; background:#E6F0F0;">
          <span>TOTAL ORDERS</span> <strong>${counts.orders}</strong>
        </div>
      </div>

      <div class="tree-scroll-container">
        <div id="bracket-tree-root">
          ${fullTreeHtml}
        </div>
      </div>

      <script>
        let currentScale = 1;
        function applyScale(s) {
          currentScale = s;
          const el = document.getElementById('bracket-tree-root');
          if (el) {
            el.style.transformOrigin = 'top left';
            el.style.transform = 'scale(' + currentScale + ')';
          }
        }
        function zoomIn() { applyScale(Math.min(1.5, currentScale + 0.08)); }
        function zoomOut() { applyScale(Math.max(0.35, currentScale - 0.08)); }
        function zoomFit() {
          const el = document.getElementById('bracket-tree-root');
          if (!el) return;
          const avail = window.innerWidth - 60;
          const natural = el.scrollWidth / currentScale;
          if (natural > avail) {
            applyScale(avail / natural);
          } else {
            applyScale(1);
          }
        }
        function setOrientation(mode) {
          const style = document.getElementById('print-orientation-style');
          if (style) {
            style.textContent = mode === 'portrait' ? '@page { size: A4 portrait; margin: 8mm 6mm; }' : '@page { size: A4 landscape; margin: 8mm 6mm; }';
          }
          document.getElementById('btn-landscape').classList.toggle('active', mode === 'landscape');
          document.getElementById('btn-portrait').classList.toggle('active', mode === 'portrait');
          zoomFit();
        }

        window.onload = () => {
          zoomFit();
          setTimeout(() => window.print(), 500);
        };
      <\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

function showChainPopup(anchorEl, ancestors, current, dark, text, subtext, superAdminEmail) {
  clearTimeout(_chainHideTimer)
  removeChainPopup()

  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: current.role, data: current.node },
  ]

  const el = document.createElement('div')
  el.id = 'chain-popup'

  if (!document.getElementById('chain-popup-styles')) {
    const s = document.createElement('style')
    s.id = 'chain-popup-styles'
    s.textContent = `
      #chain-popup::-webkit-scrollbar{width:6px}
      #chain-popup::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);border-radius:10px;margin:4px 0}
      #chain-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#22c55e,#38bdf8);border-radius:10px;box-shadow:0 0 6px rgba(34,197,94,0.4)}
      #chain-popup::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#4ade80,#7dd3fc)}
      #chain-popup{scrollbar-color:rgba(34,197,94,0.5) rgba(255,255,255,0.03)}
      @keyframes acpSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
      @keyframes acpPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      @keyframes acpGlow{0%,100%{box-shadow:0 0 0px rgba(34,197,94,0)}50%{box-shadow:0 0 20px rgba(34,197,94,0.22)}}
      @keyframes acpShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      @keyframes acpBadgePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
    `
    document.head.appendChild(s)
  }

  const isDark = false
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:#FFFFFF;
    border:1.5px solid rgba(12,64,68,0.18);
    border-radius:20px; padding:20px;
    box-shadow:0 24px 60px rgba(7,59,63,0.16), 0 0 0 1px rgba(12,64,68,0.05);
    animation:acpSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
    min-width:200px; max-width:260px;
    max-height:85vh; overflow-y:auto; overflow-x:hidden;
    scroll-behavior:smooth; scrollbar-width:thin;
    scroll-padding:8px;
    -webkit-overflow-scrolling:touch;
    backdrop-filter:none;
    font-family:'Inter',system-ui,sans-serif;
  `

  const totalNodes = chain.length
  const saColor = ROLE_CFG.super_admin.color
  const saRgb = hexToRgb(saColor)

  const itemsHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const isSuperAdmin = item.type === 'super_admin'

    const arrowHtml = idx > 0 ? `
      <div style="display:flex;justify-content:center;padding:5px 0;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:7px solid rgba(34,197,94,0.5);"></div>
          <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(34,197,94,0.1),rgba(34,197,94,0.65));"></div>
        </div>
      </div>` : ''

    if (isSuperAdmin) {
      return `
        ${arrowHtml}
        <div style="
          border-radius:14px;padding:14px 16px;
          background:#FFFFFF;
          border:1px solid rgba(${saRgb},0.3);
          position:relative;overflow:hidden;
        ">
          
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:30px;height:30px;border-radius:9px;background:${saColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(${saRgb},0.35);">${iconSvg(ICON_PATHS.shield, '#1a1030', 15)}</div>
            <div>
              <div style="font-size:9px;color:${saColor};font-weight:800;letter-spacing:1.8px;">SUPER ADMIN</div>
              <div style="font-size:8px;color:rgba(${saRgb},0.6);margin-top:2px;letter-spacing:0.5px;">ROOT • FULL ACCESS</div>
            </div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:5px;">
              <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;animation:acpPulse 1.8s ease-in-out infinite;box-shadow:0 0 8px rgba(34,197,94,0.9);"></div>
              <span style="font-size:9px;color:#22c55e;font-weight:700;">LIVE</span>
            </div>
          </div>
          <div style="font-size:12px;color:${isDark ? '#cbd5e1' : '#475569'};word-break:break-all;font-family:monospace;letter-spacing:0.3px;">${item.data.email || '—'}</div>
        </div>
      `
    }

    const cfg = ROLE_CFG[item.type]
    if (!cfg) return ''
    const d = item.data || {}
    const idVal = d[cfg.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || ''
    const rc = hexToRgb(cfg.color)
    const iconKey = ICON_BY_TYPE[item.type]

    return `
      ${arrowHtml}
      <div style="
        border-radius:14px;padding:14px 16px;
        background:#FFFFFF;
        border:${isLast
        ? `1.5px solid rgba(${rc},0.55)`
        : `1px solid rgba(${rc},0.16)`};
        position:relative;overflow:hidden;
        ${isLast ? `animation:acpGlow 3s ease-in-out infinite;` : ''}
      ">
        

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">
          <div style="width:30px;height:30px;border-radius:9px;background:${cfg.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(${rc},0.3);">${iconSvg(ICON_PATHS[iconKey], '#020617', 15)}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:9px;color:${cfg.color};font-weight:800;letter-spacing:1.8px;">${cfg.label}</div>
            <div style="font-size:9px;color:${cfg.color};font-family:monospace;opacity:0.6;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idVal}</div>
          </div>
          ${isLast ? `
          <div style="font-size:8px;font-weight:800;padding:3px 9px;border-radius:20px;
            background:rgba(${rc},0.18);color:${cfg.color};
            border:1px solid rgba(${rc},0.4);
            animation:acpBadgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
            white-space:nowrap;letter-spacing:0.5px;">● CURRENT</div>` : ''}
        </div>

        <div style="font-size:14px;color:${isDark ? '#f1f5f9' : '#0f172a'};font-weight:700;margin-bottom:9px;letter-spacing:-0.3px;">${name}</div>

        <div style="display:flex;flex-direction:column;gap:6px;">
          ${phone !== '—' ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg(ICON_PATHS.phone, cfg.color, 11)}</div>
            <span style="font-size:12px;color:${isDark ? '#94a3b8' : '#64748b'};">${phone}</span>
          </div>` : ''}
          ${city ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg(ICON_PATHS.mappin, cfg.color, 11)}</div>
            <span style="font-size:12px;color:${isDark ? '#94a3b8' : '#64748b'};">${city}</span>
          </div>` : ''}
        </div>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(12,64,68,0.12);">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#22c55e,#38bdf8);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(34,197,94,0.4);">${iconSvg(ICON_PATHS.link, '#020617', 13)}</div>
        <div>
          <div style="font-size:11px;color:${isDark ? '#4ade80' : '#16a34a'};font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:${isDark ? '#475569' : '#94a3b8'};margin-top:2px;">${totalNodes} level${totalNodes !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="
          font-size:9px;font-weight:800;padding:4px 9px;border-radius:20px;
          background:linear-gradient(90deg,rgba(34,197,94,0.15),rgba(56,189,248,0.12),rgba(34,197,94,0.15));
          background-size:200% auto;
          animation:acpShimmer 2.5s linear infinite;
          border:1px solid rgba(34,197,94,0.22);
          color:${isDark ? '#4ade80' : '#16a34a'};
          letter-spacing:1px;">● LIVE</div>
        <button class="chain-close-btn" title="Close" style="
          background: rgba(12,64,68,0.08); border: 1px solid rgba(12,64,68,0.2);
          width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #0C4044; font-weight: 800; font-size: 12px; line-height: 1; padding: 0;
        ">✕</button>
      </div>
    </div>

    ${itemsHtml}

    <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(12,64,68,0.10);">
      <div style="font-size:9px;color:${isDark ? '#334155' : '#cbd5e1'};text-align:center;letter-spacing:0.8px;font-weight:600;">BitByte Network • Hierarchy View</div>
    </div>
  `

  document.body.appendChild(el)
  el.style.scrollBehavior = 'auto'
  el.scrollTop = el.scrollHeight
  requestAnimationFrame(() => { el.style.scrollBehavior = 'smooth' })

  const isMobile = window.innerWidth <= 768
  const popW = isMobile ? Math.min(270, window.innerWidth - 24) : 280
  const popH = Math.min(el.scrollHeight || 460, window.innerHeight * 0.85)

  let left, top
  if (isMobile) {
    left = (window.innerWidth - popW) / 2
    top = Math.max(16, (window.innerHeight - popH) / 2)
  } else {
    const rect = anchorEl.getBoundingClientRect()
    left = rect.right + 18
    top = rect.top + (rect.height / 2) - (popH / 2)
    if (left + popW > window.innerWidth - 16) {
      left = rect.left - popW - 18
    }
  }

  if (left < 12) left = 12
  if (left + popW > window.innerWidth - 12) left = Math.max(12, window.innerWidth - popW - 12)
  if (top < 12) top = 12
  if (top + popH > window.innerHeight - 12) top = Math.max(12, window.innerHeight - popH - 12)

  el.style.left = left + 'px'
  el.style.top = top + 'px'
  el.style.width = popW + 'px'
  el.style.boxSizing = 'border-box'

  el.querySelector('.chain-close-btn')?.addEventListener('click', (e) => {
    e.stopPropagation()
    removeChainPopup()
  })

  const onDocClick = (e) => {
    if (!el.contains(e.target) && !anchorEl.contains(e.target)) {
      removeChainPopup()
      document.removeEventListener('pointerdown', onDocClick)
    }
  }
  setTimeout(() => document.addEventListener('pointerdown', onDocClick), 50)

  el.addEventListener('mouseenter', () => clearTimeout(_chainHideTimer))
  el.addEventListener('mouseleave', () => scheduleHideChainPopup())
}

function TreeNode({ node, role, depth = 0, dark, text, subtext, ancestors = [], superAdminEmail = '', flatMode = false, parentKey = null, openMap = {}, onToggle = () => {}, childrenCache = {}, loadingChildren = null, onPrint = () => {} }) {
  const navigate = useNavigate()
  const cfg = ROLE_CFG[role]
  const c = cfg.color
  const Icon = cfg.Icon
  const childRole = CHILD_ROLE[role]
  const cacheKey = role === 'customer' ? `c_${node.id}` : `${role}_${node.id}`
  const children = childrenCache[cacheKey] || []
  const childCount = role === 'admin' ? (node.dealer_count ?? 0) : (node.child_count ?? 0)
  const hasChildren = !flatMode && !!childRole && childCount > 0
  const isOpen = openMap[parentKey] === node.id
  const isLoadingChildren = loadingChildren === cacheKey

  return (
    <div className="otree-node-wrap">
       <div
        className="otree-card"
        data-role={role}
        style={{ '--nc': c }}
        onClick={() => hasChildren && onToggle(parentKey, node.id, role, cacheKey)}
        onMouseEnter={e => showChainPopup(e.currentTarget, ancestors, { node, role }, dark, text, subtext, superAdminEmail)}
        onMouseLeave={() => scheduleHideChainPopup()}
      >
        <div className="otree-badge" style={{ '--nc': c }}>
          <Icon color={c} size={11} /> {cfg.label}
        </div>
        <div className="otree-id" style={{ color: c }}>{node[cfg.idKey]}</div>
        <div className="otree-name" style={{ color: text }}>{node.first_name} {node.last_name || ''}</div>
        <div className="otree-sub" style={{ color: subtext }}>
          <IconPhone color={subtext} /> {node.mobile_number}
        </div>
        {node.city_name && (
          <div className="otree-sub" style={{ color: subtext }}>
            <IconMapPin color={subtext} /> {node.city_name}
          </div>
        )}

        <div className="otree-actions">
          <button
            onClick={e => {
              e.stopPropagation()
              // ── NEW: leaf role (customer) na direct print, mattra roles-ku "Only vs Full Hierarchy" popup ──
              if (CHILD_ROLE[role]) {
                onPrint({ node, role, cfg, color: c, ancestors })
              } else {
                printPersonCard(node, role, cfg, c, ancestors, superAdminEmail)
              }
            }}
            className="otree-btn" style={{ '--nc': c }}
          >
            <IconPrinter color={c} /> PRINT
          </button>
          <button
  onClick={e => {
    e.stopPropagation()
    clearTimeout(_chainHideTimer)
    removeChainPopup()
    navigate(`/hierarchy-sales-count?role=${role}&id=${node.id}`)
  }}
  className="otree-btn otree-btn-sales"
>
  <IconChart color="#0284C7" /> SALES ({node.order_count ?? 0})
</button>
        </div>

        {hasChildren && (
          <div className="otree-toggle" style={{ color: c, transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            <IconChevronDown color={c} />
          </div>
        )}
        {hasChildren && (
          <div className="otree-count" style={{ background: c }}>
            {childCount} {childRole.replace('_', ' ')}
          </div>
        )}
      </div>

      {hasChildren && isOpen && (
  <div className="otree-children" style={{ '--lc': ROLE_CFG[childRole].color }}>
    {isLoadingChildren ? (
      <div className="otree-item" style={{ paddingTop: 0 }}>
        <SkeletonCard color={ROLE_CFG[childRole].color} />
      </div>
    ) : (
      children.map(child => (
        <div className="otree-item" key={child.id}>
          <TreeNode
            node={child} role={childRole} depth={depth + 1}
            dark={dark} text={text} subtext={subtext}
            ancestors={[...ancestors, { node, role }]}
            superAdminEmail={superAdminEmail}
            parentKey={cacheKey}
            openMap={openMap}
            onToggle={onToggle}
            childrenCache={childrenCache}
            loadingChildren={loadingChildren}
            onPrint={onPrint}
          />
        </div>
      ))
    )}
  </div>
)}
    </div>
  )
}

export default function SuperadminHierarchy() {
  const navigate = useNavigate()
  const [dark] = useState(false)
  const [hierarchyData, setHierarchyData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState(null)
const [search, setSearch] = useState('')
const [debouncedSearch, setDebouncedSearch] = useState('')

// oru parent-ku keela ore oru child mattum open aagum
// oru parent-ku keela ore oru child mattum open aagum
const [openMap, setOpenMap] = useState({})
const [childrenCache, setChildrenCache] = useState({})
const [loadingChildren, setLoadingChildren] = useState(null)

// ── NEW: Print choice popup state — "only this / full hierarchy" select panna ──
const [printTarget, setPrintTarget] = useState(null) // { node, role, cfg, color, ancestors }
const [printLoading, setPrintLoading] = useState(false)
const openPrintPopup = (target) => setPrintTarget(target)
const handlePrintOnly = () => {
  const { node, role, cfg, color, ancestors } = printTarget
  printPersonCard(node, role, cfg, color, ancestors, superAdminEmail)
  setPrintTarget(null)
}
const handlePrintHierarchy = async () => {
  const target = printTarget
  setPrintTarget(null)
  if (!target) return

  setPrintLoading(true)
  try {
    const adminId = target.role === 'admin' ? target.node.id : (target.ancestors?.find(a => a.role === 'admin')?.node?.id || target.node.id)
    const res = await api.get(`/hierarchy/full/?admin_id=${adminId}`)
    const fullAdmin = res.data?.admins?.[0] || target.node
    printHorizontalBracketTree(fullAdmin, target.role, target.ancestors, res.data?.super_admin_email || superAdminEmail)
  } catch (err) {
    console.error('Failed to fetch full hierarchy for print:', err)
    printHorizontalBracketTree(target.node, target.role, target.ancestors, superAdminEmail)
  } finally {
    setPrintLoading(false)
  }
}

const fetchChildren = async (role, nodeId, cacheKey) => {
  setLoadingChildren(cacheKey)
  try {
    const res = await api.get(`/hierarchy/children/?role=${role}&id=${nodeId}`)
    setChildrenCache(prev => ({ ...prev, [cacheKey]: res.data.items }))
  } catch (err) { console.error(err) }
  setLoadingChildren(null)
}

const handleToggle = (parentKey, nodeId, role, cacheKey) => {
  setOpenMap(prev => ({
    ...prev,
    [parentKey]: prev[parentKey] === nodeId ? null : nodeId,
  }))
  if (!childrenCache[cacheKey]) fetchChildren(role, nodeId, cacheKey)
}

  // ADD this after your existing useState lines (near `const [debouncedSearch, ...]`)
const treeWrapperRef = useRef(null)
const scrollAreaRef = useRef(null)
const [levelTops, setLevelTops] = useState({})
const [adminAnchors, setAdminAnchors] = useState([])
const [superAdminAnchor, setSuperAdminAnchor] = useState(null)
const [treeZoom, setTreeZoom] = useState(0.72)
const zoomPercent = Math.round(treeZoom * 100)
const updateTreeZoom = (nextZoom) => {
  setTreeZoom(Math.min(1.4, Math.max(0.4, Number(nextZoom.toFixed(2)))))
}
const zoomOut = () => updateTreeZoom(treeZoom - 0.1)
const zoomIn = () => updateTreeZoom(treeZoom + 0.1)
const resetZoom = () => updateTreeZoom(0.72)
const fitHierarchy = () => updateTreeZoom(0.5)

useLayoutEffect(() => {
  const wrapper = treeWrapperRef.current
  if (!wrapper) return

 const measure = () => {
    const wrapperRect = wrapper.getBoundingClientRect()
    const roles = ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
    const tops = {}
    roles.forEach(role => {
      const el = wrapper.querySelector(`[data-role="${role}"]`)
      if (el) {
        const rect = el.getBoundingClientRect()
        tops[role] = (rect.top - wrapperRect.top) + rect.height / 2
      }
    })
    setLevelTops(tops)

    const adminEls = wrapper.querySelectorAll('[data-role="admin"]')
    const anchors = Array.from(adminEls).map(el => {
      const r = el.getBoundingClientRect()
      return {
        x: (r.left - wrapperRect.left) + r.width / 2,
        top: (r.top - wrapperRect.top),
      }
    })
    setAdminAnchors(anchors)

    const saEl = wrapper.querySelector('[data-role="super_admin"]')
    if (saEl) {
      const r = saEl.getBoundingClientRect()
      setSuperAdminAnchor({
        x: (r.right - wrapperRect.left),
        y: (r.top - wrapperRect.top) + r.height / 2,
      })
    }
  }

  // measure right away, then again after the browser finishes painting
  // (catches late layout shifts from fonts/icons/wrapping)
  measure()
  requestAnimationFrame(() => requestAnimationFrame(measure))

  const ro = new ResizeObserver(measure)
  ro.observe(wrapper)

  const scrollEl = scrollAreaRef.current
  scrollEl?.addEventListener('scroll', measure)
  window.addEventListener('resize', measure)

  return () => {
    ro.disconnect()
    scrollEl?.removeEventListener('scroll', measure)
    window.removeEventListener('resize', measure)
  }
}, [hierarchyData, filter, debouncedSearch, openMap, treeZoom])

  const text = '#111817'
  const subtext = '#53615F'
  const inpBg = '#FFFFFF'
  const inpBorder = '#BDCFCE'
  const border = 'rgba(12,64,68,0.18)'
  const superAdminEmail = localStorage.getItem('email') || ''

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 120)
    return () => clearTimeout(t)
  }, [search])

  const fetchHierarchy = async () => {
    setLoading(true)
    try {
      const res = await api.get('/hierarchy/admins/')
      setHierarchyData({ super_admin_email: res.data.super_admin_email, admins: res.data.admins })
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchHierarchy() }, [])

  useEffect(() => {
  return () => {
    clearTimeout(_chainHideTimer)
    removeChainPopup()
  }
}, [])

  const flattenByRole = (role) => {
    if (!hierarchyData) return []
    const result = []
    hierarchyData.admins.forEach(admin => {
      if (role === 'admin') { result.push({ node: admin, ancestors: [] }); return }
      admin.dealers.forEach(dealer => {
        if (role === 'dealer') { result.push({ node: dealer, ancestors: [{ node: admin, role: 'admin' }] }); return }
        dealer.sub_dealers.forEach(sd => {
          if (role === 'sub_dealer') { result.push({ node: sd, ancestors: [{ node: admin, role: 'admin' }, { node: dealer, role: 'dealer' }] }); return }
          sd.promotors.forEach(pr => {
            if (role === 'promotor') { result.push({ node: pr, ancestors: [{ node: admin, role: 'admin' }, { node: dealer, role: 'dealer' }, { node: sd, role: 'sub_dealer' }] }); return }
            pr.customers.forEach(cus => {
              if (role === 'customer') { result.push({ node: cus, ancestors: [{ node: admin, role: 'admin' }, { node: dealer, role: 'dealer' }, { node: sd, role: 'sub_dealer' }, { node: pr, role: 'promotor' }] }) }
            })
          })
        })
      })
    })
    return result
  }

  const [searchResults, setSearchResults] = useState([])
  useEffect(() => {
    if (!debouncedSearch) { setSearchResults([]); return }
    api.get(`/hierarchy/search-person/?q=${encodeURIComponent(debouncedSearch)}`)
      .then(res => {
        const mapped = res.data.results.map(r => ({
          node: { id: r.id, user_id: r.user_id, first_name: r.first_name, last_name: r.last_name, mobile_number: r.mobile_number, city_name: r.city_name, [ROLE_CFG[r.role]?.idKey]: r.public_id },
          role: r.role,
          ancestors: [],
        }))
        setSearchResults(mapped)
      })
      .catch(err => console.error(err))
  }, [debouncedSearch])

  const totalStats = hierarchyData ? { admins: hierarchyData.admins.length } : null
  const statPills = []

  return (
    <div className="sh-page-wrap">
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

        .sh-page-wrap{ min-height:100vh; background:#FFFFFF; color:${text}; fontFamily:"Inter",system-ui,sans-serif; padding:28px 32px; box-sizing:border-box; }
        .sh-topbar{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:16px; }
        .sh-controls{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
        .sh-search-wrap{ position:relative; width:240px; }
        .sh-search-input{ width:100%; background:${inpBg}; border:1px solid ${inpBorder}; border-radius:10px; padding:9px 14px 9px 34px; color:${text}; font-size:13px; outline:none; box-sizing:border-box; }
        .sh-zoom-wrap{ display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.94); border:1px solid rgba(12,64,68,0.16); border-radius:14px; padding:6px; box-shadow:0 12px 28px rgba(7,59,63,0.12); }
        .sh-canvas{ background:#FFFFFF; border:1.5px solid ${border}; border-radius:20px; padding:28px 0; overflow:hidden; min-height:100vh; position:relative; box-shadow:0 18px 42px rgba(7,59,63,0.08); }
        .sh-superadmin-col{ position:absolute; top:0; left:0; bottom:0; width:200px; z-index:40; background:#FFFFFF; display:flex; flexDirection:column; align-items:center; padding-top:20px; }
        .sh-superadmin-line{ width:2px; flex:1; background:${ROLE_CFG.super_admin.color}; margin-top:6px; }
        .sh-level-labels{ position:absolute; left:0; top:0; width:200px; height:100%; z-index:45; pointer-events:none; }
        .sh-svg-bridge{ position:absolute; top:0; left:0; width:100%; height:100%; z-index:44; pointer-events:none; }
        .sh-tree-scroll{ overflow-x:auto; overflow-y:hidden; padding:20px 32px 20px 220px; -webkit-overflow-scrolling:touch; }

        .otree-node-wrap{display:flex;flex-direction:column;align-items:center;}
        .otree-card{
          background:#FFFFFF; border:2px solid var(--nc); border-radius:12px; padding:12px 16px;
          min-width:168px; max-width:210px; cursor:pointer; position:relative; transition:all .25s ease;
        }
        .otree-card:hover{ transform:translateY(-3px); box-shadow:0 14px 30px rgba(7,59,63,0.16); }
        .otree-badge{ display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:900; padding:2px 8px; border-radius:20px; margin-bottom:8px; color:var(--nc); background:#FFFFFF; border:1.5px solid var(--nc); }
        .otree-id{ font-family:monospace; font-size:11px; font-weight:800; margin-bottom:6px; word-break:break-all; }
        .otree-name{ font-weight:900; font-size:14px; margin-bottom:8px; line-height:1.35; }
        .otree-sub{ display:flex; align-items:center; gap:4px; font-size:12px; font-weight:650; margin-bottom:4px; }
        .otree-actions{ margin-top:8px; display:flex; gap:6px; }
        .otree-btn{ flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:5px 0; font-size:10px; font-weight:800; background:#FFFFFF; border:1.5px solid var(--nc); border-radius:8px; color:var(--nc); cursor:pointer; }
        .otree-btn-sales{ border-color:#0284C7; color:#0284C7; }
        .otree-toggle{ position:absolute; top:8px; right:10px; transition:transform .25s ease; }
        .otree-count{ position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); color:#FFFFFF; font-size:10px; font-weight:900; padding:2px 8px; border-radius:20px; white-space:nowrap; text-shadow:0 1px 1px rgba(0,0,0,0.18); }

        .otree-children{ display:flex; justify-content:center; align-items:flex-start; position:relative; padding-top:28px; }
        .otree-children::before{ content:''; position:absolute; top:0; left:50%; border-left:2px solid var(--lc); width:0; height:28px; }
        .otree-item{ position:relative; padding:28px 10px 0 10px; }
        .otree-item::before, .otree-item::after{ content:''; position:absolute; top:0; right:50%; border-top:2px solid var(--lc); width:50%; height:28px; }
        .otree-item::after{ right:auto; left:50%; border-left:2px solid var(--lc); }
        .otree-item:only-child::before, .otree-item:only-child::after{ display:none; }
        .otree-item:only-child{ padding-top:0; }
        .otree-item:first-child::before, .otree-item:last-child::after{ border:0 none; }
        .otree-item:last-child::before{ border-right:2px solid var(--lc); border-radius:0 20px 0 0; }
        .otree-item:first-child::after{ border-radius:20px 0 0 0; }
        .otree-children-root::before{ display:none; }
        .otree-children-root > .otree-item::before,
        .otree-children-root > .otree-item::after{ display:none; }
        .hierarchy-zoom-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;min-width:34px;padding:0 10px;border-radius:10px;border:1px solid rgba(12,64,68,.24);background:rgba(255,255,255,.92);color:#0C4044;font-size:12px;font-weight:900;cursor:pointer;transition:all .2s ease;box-shadow:0 8px 18px rgba(7,59,63,.08);}
        .hierarchy-zoom-btn:hover{background:#E6F1EF;border-color:rgba(12,64,68,.42);transform:translateY(-1px);}
        .hierarchy-zoom-btn:disabled{opacity:.42;cursor:not-allowed;transform:none;}
        .hierarchy-zoom-chip{height:34px;min-width:62px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;background:#0C4044;border:1px solid rgba(12,64,68,.24);color:#FFFFFF;font-size:12px;font-weight:900;}
        .hierarchy-floating-zoom{position:absolute;top:16px;right:18px;z-index:80;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.94);border:1px solid rgba(12,64,68,.16);border-radius:16px;padding:8px;box-shadow:0 18px 40px rgba(7,59,63,.14);backdrop-filter:blur(14px);}

        /* Responsive Mobile & Tablet Rules */
        @media (max-width: 860px) {
          .sh-page-wrap { padding: 14px 10px 50px !important; }
          .sh-topbar { flex-direction: column; align-items: stretch; gap: 14px; margin-bottom: 16px; }
          .sh-controls { width: 100%; flex-direction: column; align-items: stretch; gap: 10px; }
          .sh-search-wrap { width: 100% !important; }
          .sh-zoom-wrap { display: flex; justify-content: space-between; width: 100% !important; box-sizing: border-box; }
          .sh-canvas { border-radius: 14px; padding: 14px 0; min-height: auto; }
          .sh-superadmin-col {
            position: static !important;
            width: 100% !important;
            padding: 10px 10px 14px !important;
            border-bottom: 1.5px dashed rgba(12,64,68,0.15);
          }
          .sh-superadmin-line { display: none !important; }
          .sh-level-labels { display: none !important; }
          .sh-svg-bridge { display: none !important; }
          .sh-tree-scroll { padding: 16px 8px !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .hierarchy-zoom-chip { min-width: 48px; }
        }
      `}</style>

      <div className="sh-topbar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => navigate('/superadmin-hierarchy-grid')}
              title="Switch to Grid View"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <IconSwitchView color="#0C4044" />
            </button>
            <span style={{ color: '#0C4044', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Full Organization Hierarchy
            </span>
          </div>
          {totalStats && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${ROLE_CFG.super_admin.color}22`, border: `1px solid ${ROLE_CFG.super_admin.color}55`, borderRadius: '20px', padding: '4px 14px' }}>
                <span style={{ color: ROLE_CFG.super_admin.color, fontWeight: 800, fontSize: '13px' }}>1</span>
                <span style={{ color: subtext, fontSize: '12px', fontWeight: 650 }}>Super Admin</span>
              </div>
              {statPills.map(s => {
                const color = ROLE_CFG[s.roleKey].color
                const isActive = filter === s.roleKey
                return (
                  <div key={s.label} onClick={() => setFilter(isActive ? null : s.roleKey)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isActive ? `${color}33` : `${color}14`, border: `1px solid ${isActive ? color : color + '44'}`, borderRadius: '20px', padding: '4px 14px', cursor: 'pointer', transition: 'all 0.25s ease' }}>
                    <span style={{ color, fontWeight: 800, fontSize: '13px' }}>{s.count}</span>
                    <span style={{ color: subtext, fontSize: '12px', fontWeight: 650 }}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="sh-controls">
          <div className="sh-search-wrap">
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <IconSearch color={subtext} />
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID, Name, Phone..."
              className="sh-search-input" />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}>
                <IconX color={subtext} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div className="sh-zoom-wrap" style={{ flex: '1 1 auto' }}>
              <button className="hierarchy-zoom-btn" onClick={zoomOut} disabled={treeZoom <= 0.4} title="Zoom out"><IconMinus color="currentColor" /></button>
              <span className="hierarchy-zoom-chip">{zoomPercent}%</span>
              <button className="hierarchy-zoom-btn" onClick={zoomIn} disabled={treeZoom >= 1.4} title="Zoom in"><IconPlus color="currentColor" /></button>
              <button className="hierarchy-zoom-btn" onClick={fitHierarchy} title="Fit more hierarchy on screen"><IconFit color="currentColor" /> Fit</button>
              <button className="hierarchy-zoom-btn" onClick={resetZoom} title="Reset hierarchy zoom">Reset</button>
            </div>
            <button onClick={() => navigate('/super-admin')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(220,38,38,0.35)', color: '#DC2626', borderRadius: '10px', padding: '9px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
              <IconBack color="#DC2626" /> Back
            </button>
          </div>
        </div>
      </div>

     <div ref={treeWrapperRef} className="sh-canvas">
        <div className="sh-superadmin-col">
          <div className="otree-card" data-role="super_admin" style={{ '--nc': ROLE_CFG.super_admin.color, minWidth: 150, cursor: 'default' }}>
            <div className="otree-badge" style={{ '--nc': ROLE_CFG.super_admin.color }}>
              <IconShield color={ROLE_CFG.super_admin.color} size={11} /> SUPER ADMIN
            </div>
            <div className="otree-name" style={{ color: text, fontSize: '12px', wordBreak: 'break-all' }}>{superAdminEmail}</div>
          </div>
          <div className="sh-superadmin-line" />
        </div>

        {!loading && hierarchyData && !filter && !debouncedSearch && (
  <div className="sh-level-labels">
    {[
      { role: 'admin', label: 'Level 1' },
      { role: 'dealer', label: 'Level 2' },
      { role: 'sub_dealer', label: 'Level 3' },
      { role: 'promotor', label: 'Level 4' },
      { role: 'customer', label: 'Level 5' },
    ].map(({ role, label }) => (
      levelTops[role] != null && (
        <div key={role} style={{
          position: 'absolute',
          top: levelTops[role],
          left: 118,
          transform: 'translateY(-50%)',
          fontSize: '11px',
          fontWeight: 700,
          color: subtext,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      )
    ))}
  </div>
)}

{!loading && hierarchyData && !filter && !debouncedSearch && adminAnchors.length > 0 && superAdminAnchor && (() => {
  const bridgeY = superAdminAnchor.y
  const bridgeStartX = superAdminAnchor.x
  const farthestX = Math.max(...adminAnchors.map(a => a.x))
  return (
    <svg className="sh-svg-bridge" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 44, pointerEvents: 'none' }}>
      <line x1={bridgeStartX} y1={bridgeY} x2={Math.max(farthestX, bridgeStartX)} y2={bridgeY} stroke={ROLE_CFG.admin.color} strokeWidth="2" />
      {adminAnchors.map((a, i) => (
        <line key={i} x1={a.x} y1={bridgeY} x2={a.x} y2={a.top} stroke={ROLE_CFG.admin.color} strokeWidth="2" />
      ))}
    </svg>
  )
})()}



        {loading && (
          <div className="sh-tree-scroll" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <SkeletonCard color={ROLE_CFG.admin.color} />
            <SkeletonCard color={ROLE_CFG.admin.color} />
            <SkeletonCard color={ROLE_CFG.admin.color} />
          </div>
        )}

        {!loading && hierarchyData && (
          debouncedSearch ? (() => {
            const filteredResults = filter ? searchResults.filter(item => item.role === filter) : searchResults
            if (filteredResults.length === 0) {
              return <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No results found for "{debouncedSearch}"</div>
            }
            return (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', padding: '0 16px' }}>
                {filteredResults.map((item, idx) => (
                  <TreeNode key={item.node.id || idx} node={item.node} role={item.role} dark={dark} text={text} subtext={subtext} ancestors={item.ancestors} superAdminEmail={superAdminEmail} flatMode={true} onPrint={openPrintPopup} />
                ))}
              </div>
            )
          })() : filter ? (() => {
            const flatList = flattenByRole(filter)
            return (
              <div style={{ padding: '0 16px' }}>
                <button onClick={() => setFilter(null)} style={{ marginBottom: '20px', padding: '8px 18px', background: `${ROLE_CFG[filter].color}22`, border: `1px solid ${ROLE_CFG[filter].color}55`, borderRadius: '10px', color: ROLE_CFG[filter].color, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  ← Back to full tree
                </button>
                {flatList.length === 0 ? (
                  <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No {filter.replace('_', ' ')} found.</div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {flatList.map((item, idx) => (
                      <TreeNode key={item.node.id || idx} node={item.node} role={filter} dark={dark} text={text} subtext={subtext} ancestors={item.ancestors} superAdminEmail={superAdminEmail} flatMode={true} onPrint={openPrintPopup} />
                    ))}
                  </div>
                )}
              </div>
            )
          })() : hierarchyData.admins.length === 0 ? (
            <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No admins created yet.</div>
          ) : (
            // ── FULL TREE — super admin sticks to the left while you scroll right on desktop, stacks on mobile ──
            <div ref={scrollAreaRef} className="sh-tree-scroll">
<div className="otree-children otree-children-root" style={{ '--lc': ROLE_CFG.admin.color, minWidth: 'max-content', transform: `scale(${treeZoom})`, transformOrigin: 'top left', width: `${100 / treeZoom}%` }}>


                {hierarchyData.admins.map(admin => (
  <div className="otree-item" key={admin.id} style={{ paddingTop: 0 }}>
    <TreeNode
      node={admin} role="admin" depth={0} dark={dark} text={text} subtext={subtext}
      ancestors={[]} superAdminEmail={superAdminEmail}
      parentKey="root"
      openMap={openMap}
      onToggle={handleToggle}
      childrenCache={childrenCache}
      loadingChildren={loadingChildren}
      onPrint={openPrintPopup}
    />
  </div>
))}
              </div>
            </div>
          )
        )}

        {!loading && !hierarchyData && (
          <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>Failed to load hierarchy.</div>
        )}

      </div> 
    

      

      {!loading && (
        <div style={{ marginTop: '20px', padding: '14px 0', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {[{ role: 'Super Admin', key: 'super_admin' }, { role: 'Admin', key: 'admin' }, { role: 'Dealer', key: 'dealer' }, { role: 'Sub Dealer', key: 'sub_dealer' }, { role: 'Promotor', key: 'promotor' }, { role: 'Customer', key: 'customer' }].map(l => (
            <div key={l.role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: ROLE_CFG[l.key].color }} />
              <span style={{ color: subtext, fontSize: '12px', fontWeight: 650 }}>{l.role}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── NEW: PRINT CHOICE POPUP — Only vs Full Hierarchy ── */}
      {printTarget && (
        <div
          onClick={() => setPrintTarget(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg,#FDFDFC,#F3F3F0)',
              border: `1px solid ${printTarget.color}55`,
              borderRadius: '20px', padding: '26px',
              width: '95%', maxWidth: '380px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <IconPrinter color={printTarget.color} size={22} />
            </div>
            <div style={{ color: '#111817', fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>
              Print {printTarget.node.first_name}'s Profile
            </div>
            <div style={{ color: subtext, fontSize: '12px', marginBottom: '20px' }}>
              Enna print pannanum nu select pannunga bro
            </div>

            <button
              onClick={handlePrintOnly}
              style={{
                width: '100%', padding: '13px', marginBottom: '10px',
                background: 'rgba(253,253,252,0.78)', border: `1.5px solid ${printTarget.color}`,
                borderRadius: '12px', color: printTarget.color, fontWeight: 800, fontSize: '13px', cursor: 'pointer',
              }}
            >
              {ROLE_CFG[printTarget.role]?.label} Only
            </button>
            <button
              onClick={handlePrintHierarchy}
              style={{
                width: '100%', padding: '13px', marginBottom: '10px',
                background: `linear-gradient(90deg, ${printTarget.color}, #0C4044)`,
                border: 'none', borderRadius: '12px', color: '#FDFDFC', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
              }}
            >
              {ROLE_CFG[printTarget.role]?.label} Hierarchy (Full Tree)
            </button>
            <button
              onClick={() => setPrintTarget(null)}
              style={{
                width: '100%', padding: '10px', background: 'none', border: 'none',
                color: subtext, fontSize: '12px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── PRINT LOADING MODAL ── */}
      {printLoading && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(7,59,63,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            style={{
              background: '#FFFFFF', border: '1.5px solid #D6E2E1', borderRadius: '20px',
              padding: '28px 36px', boxShadow: '0 24px 60px rgba(7,59,63,0.22)', textAlign: 'center', maxWidth: '380px'
            }}
          >
            <div style={{
              width: 38, height: 38, border: '3.5px solid #E1EBEA', borderTop: '3.5px solid #073B3F',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px'
            }} />
            <div style={{ color: '#073B3F', fontWeight: 800, fontSize: '15px', marginBottom: '6px' }}>
              Preparing Hierarchy Print Tree...
            </div>
            <div style={{ color: '#5C706E', fontSize: '12px', lineHeight: 1.5 }}>
              Compiling full downward tree with all distributors, wholesale dealers, retailers, and customers.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}