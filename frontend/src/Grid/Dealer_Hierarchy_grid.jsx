import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { SkeletonCard } from '../components/Skeleton'
import '../components/skeleton.css'

// ══════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════
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
const IconSwitchView = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3l4 4-4 4"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <path d="M7 21l-4-4 4-4"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)
const IconChevronDown = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconMessage = ({ color, size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

// ══════════════════════════════════════════════════════════════════
// ROLE CONFIG — Identical to Superadmin Hierarchy Theme
// ══════════════════════════════════════════════════════════════════
const ROLE_CFG = {
  dealer: { color: '#0284C7', Icon: IconStore, label: 'DISTRIBUTOR', idKey: 'dealer_id' },
  sub_dealer: { color: '#DC2626', Icon: IconLink, label: 'WHOLESALE DEALER', idKey: 'sub_dealer_id' },
  promotor: { color: '#CA8A04', Icon: IconStar, label: 'RETAILER', idKey: 'promotor_id' },
  customer: { color: '#DB2777', Icon: IconUser, label: 'CUSTOMER', idKey: 'customer_id' },
}
const CHILD_ROLE = { dealer: 'sub_dealer', sub_dealer: 'promotor', promotor: 'customer', customer: 'customer' }
const CHILD_KEY = { dealer: 'sub_dealers', sub_dealer: 'promotors', promotor: 'customers', customer: 'customers' }
const LEVEL_NUM = { dealer: 1, sub_dealer: 2, promotor: 3, customer: 4 }
const STATUS_COLOR = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e' }

function iconSvg(paths, color, size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}
const ICON_PATHS = {
  store: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M4 9v10h16V9"/><path d="M9 21v-6h6v6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mappin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
}
const ICON_BY_TYPE = { dealer: 'store', sub_dealer: 'link', promotor: 'star', customer: 'user' }

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function countDescendants(node, role) {
  const counts = {}
  const walk = (n, r) => {
    const ck = CHILD_KEY[r]
    const cr = CHILD_ROLE[r]
    if (!ck || !cr) return
    const arr = n[ck] || []
    counts[cr] = (counts[cr] || 0) + arr.length
    arr.forEach(child => walk(child, cr))
  }
  walk(node, role)
  return counts
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
    .chain-info { font-size:11.5px; color:#5C706E; margin-top:2px; }
    .chain-arrow { text-align:center; color:#073B3F; margin:2px 0 6px; font-size:16px; font-weight:900; line-height:1; }
    .footer { text-align:center; font-size:10.5px; color:#5C706E; margin-top:26px; border-top:1px solid #E1EBEA; padding-top:14px; }
    @media print {
      body { background:#FFFFFF !important; padding:10mm !important; }
      .wrapper { border:none !important; box-shadow:none !important; padding:0 !important; max-width:100% !important; }
    }
  `
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
      <div class="bracket-card-role" style="color: ${cfg.color}; background: ${cfg.color}18;">
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

function printHorizontalBracketTree(rootNode, role, ancestors) {
  const nodeName = [rootNode.first_name, rootNode.last_name].filter(Boolean).join(' ') || 'Dealer Tree'
  const nodeId = rootNode[ROLE_CFG[role]?.idKey] || rootNode.id || ''

  const childRole = CHILD_ROLE[role]
  const childKey = CHILD_KEY[role]
  const treeHtml = renderBracketBranch(rootNode, role, childRole, childKey)

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
      <title>Hierarchy Tree — ${nodeName} (${nodeId})</title>
      <style id="print-orientation-style">
        @page { size: A4 landscape; margin: 8mm 6mm; }
      </style>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        body {
          font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
          background:#F4F8F8; color:#111817; padding:16px 20px 40px; min-width:100%;
        }
        .print-toolbar {
          position:sticky; top:0; z-index:9999;
          background:#FFFFFF; border:1.5px solid #D6E2E1; border-radius:14px;
          padding:10px 18px; margin-bottom:14px;
          display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;
          box-shadow:0 8px 24px rgba(7,59,63,0.08);
        }
        .btn-print { background:#073B3F; color:#FFFFFF; border:none; border-radius:8px; padding:7px 18px; font-weight:800; font-size:12.5px; cursor:pointer; }
        .btn-mode { background:#F4F8F8; color:#073B3F; border:1px solid #D6E2E1; border-radius:8px; padding:7px 14px; font-weight:700; font-size:12px; cursor:pointer; }
        .btn-mode.active { background:#E6F0F0; border-color:#073B3F; color:#073B3F; font-weight:800; }
        .btn-action { background:#FFFFFF; color:#5C706E; border:1px solid #D6E2E1; border-radius:8px; padding:7px 12px; font-weight:700; font-size:12px; cursor:pointer; }
        .btn-close { background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; border-radius:8px; padding:7px 14px; font-weight:700; font-size:12px; cursor:pointer; }
        .tree-scroll-container { background:#FFFFFF; border:1.5px solid #D6E2E1; border-radius:16px; padding:24px 20px; overflow-x:auto; width:100%; box-shadow:0 4px 20px rgba(7,59,63,0.05); }
        #bracket-tree-root { display:inline-block; min-width:max-content; position:relative; }
        .bracket-branch { display:flex; align-items:center; position:relative; }
        .bracket-node-wrapper { flex-shrink:0; display:flex; align-items:center; z-index:2; position:relative; }
        .bracket-stem { width:20px; height:2px; background:#073B3F; flex-shrink:0; z-index:1; }
        .bracket-children { display:flex; flex-direction:column; justify-content:center; position:relative; flex-shrink:0; }
        .bracket-child-row { display:flex; align-items:center; position:relative; padding:3px 0; margin:0; }
        .bracket-arm { width:20px; height:2px; background:#073B3F; flex-shrink:0; position:relative; z-index:1; }
        .bracket-child-row.bracket-pos-first::before { content:''; position:absolute; left:0; top:50%; bottom:0; width:2px; background:#073B3F; z-index:1; }
        .bracket-child-row.bracket-pos-middle::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:#073B3F; z-index:1; }
        .bracket-child-row.bracket-pos-last::before { content:''; position:absolute; left:0; top:0; bottom:50%; width:2px; background:#073B3F; z-index:1; }
        .bracket-child-row.bracket-pos-only::before { display:none; }
        .bracket-card {
          width:180px; background:#FFFFFF; border:1.5px solid #E1EBEA; border-left:4px solid #073B3F;
          border-radius:10px; padding:8px 10px; box-shadow:0 2px 8px rgba(7,59,63,0.06); text-align:left;
        }
        .bracket-card-role { font-size:8.5px; font-weight:800; letter-spacing:0.8px; padding:2px 6px; border-radius:4px; display:inline-block; margin-bottom:2px; }
        .bracket-card-id { font-family:monospace; font-size:10px; font-weight:750; }
        .bracket-card-name { font-size:12px; font-weight:800; color:#111817; margin:2px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .bracket-card-sub { font-size:9.5px; color:#5C706E; margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .bracket-card-footer { display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding-top:4px; border-top:1px solid #E1EBEA; font-size:8.5px; font-weight:700; }
        @media print {
          .print-toolbar { display:none !important; }
          body { background:#FFFFFF !important; padding:0 !important; }
          .tree-scroll-container { border:none !important; box-shadow:none !important; padding:0 !important; }
        }
      </style>
    </head>
    <body>
      <div class="print-toolbar">
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn-print" onclick="window.print()">🖨️ Print Tree</button>
          <button id="btn-landscape" class="btn-mode active" onclick="setOrientation('landscape')">Landscape</button>
          <button id="btn-portrait" class="btn-mode" onclick="setOrientation('portrait')">Portrait</button>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn-action" onclick="zoomIn()">➕ Zoom In</button>
          <button class="btn-action" onclick="zoomOut()">➖ Zoom Out</button>
          <button class="btn-action" onclick="zoomFit()">🎯 Fit View</button>
          <button class="btn-close" onclick="window.close()">✕ Close</button>
        </div>
      </div>
      <div class="tree-scroll-container">
        <div id="bracket-tree-root">${treeHtml}</div>
      </div>
      <script>
        let currentScale = 1;
        function applyScale(s) {
          currentScale = s;
          const el = document.getElementById('bracket-tree-root');
          if (el) { el.style.transformOrigin = 'top left'; el.style.transform = 'scale(' + currentScale + ')'; }
        }
        function zoomIn() { applyScale(Math.min(1.5, currentScale + 0.08)); }
        function zoomOut() { applyScale(Math.max(0.35, currentScale - 0.08)); }
        function zoomFit() {
          const el = document.getElementById('bracket-tree-root');
          if (!el) return;
          const avail = window.innerWidth - 60;
          const natural = el.scrollWidth / currentScale;
          if (natural > avail) applyScale(avail / natural); else applyScale(1);
        }
        function setOrientation(mode) {
          const style = document.getElementById('print-orientation-style');
          if (style) style.textContent = mode === 'portrait' ? '@page { size: A4 portrait; margin: 8mm 6mm; }' : '@page { size: A4 landscape; margin: 8mm 6mm; }';
          document.getElementById('btn-landscape').classList.toggle('active', mode === 'landscape');
          document.getElementById('btn-portrait').classList.toggle('active', mode === 'portrait');
          zoomFit();
        }
        window.onload = () => { zoomFit(); setTimeout(() => window.print(), 200); };
      <\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// ══════════════════════════════════════════════════════════════════
// HOVER CHAIN POPUP + PRINT
// ══════════════════════════════════════════════════════════════════
let _chainHideTimer = null
function removeChainPopup() {
  document.querySelectorAll('#chain-popup').forEach(el => el.remove())
}
function scheduleHideChainPopup() {
  clearTimeout(_chainHideTimer)
  _chainHideTimer = setTimeout(() => removeChainPopup(), 200)
}

function printPersonCard(node, role, cfg, color, ancestors) {
  const chain = [...ancestors.map(a => ({ type: a.role, data: a.node })), { type: role, data: node }]
  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const r = ROLE_CFG[item.type]
    if (!r) return ''
    const d = item.data || {}
    const idVal = d[r.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || ''
    return `<div class="chain-item ${isLast ? 'current' : ''}">
      <div class="chain-role">${r.label}</div>
      <div class="chain-id">${idVal}</div>
      <div class="chain-name">${name}</div>
      <div class="chain-info">📞 ${phone}</div>
      ${city ? `<div class="chain-info">📍 ${city}</div>` : ''}
    </div>${idx < chain.length - 1 ? `<div class="chain-arrow">↓</div>` : ''}`
  }).join('')

  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || '—'
  const roleLabel = ROLE_CFG[role]?.label || role.toUpperCase()
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <!DOCTYPE html><html><head><meta charset="utf-8"/><title>${roleLabel} — ${currentName}</title>
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

function showChainPopup(anchorEl, ancestors, current, dark) {
  if (typeof window !== 'undefined' && window.innerWidth <= 860) return
  clearTimeout(_chainHideTimer)
  removeChainPopup()

  const chain = [...ancestors.map(a => ({ type: a.role, data: a.node })), { type: current.role, data: current.node }]
  const el = document.createElement('div')
  el.id = 'chain-popup'

  if (!document.getElementById('chain-popup-styles')) {
    const s = document.createElement('style')
    s.id = 'chain-popup-styles'
    s.textContent = `
      #chain-popup::-webkit-scrollbar{width:6px}
      #chain-popup::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);border-radius:10px;margin:4px 0}
      #chain-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#0284C7,#DC2626);border-radius:10px;box-shadow:0 0 6px rgba(2,132,199,0.4)}
      #chain-popup::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#38bdf8,#ef4444)}
      #chain-popup{scrollbar-color:rgba(2,132,199,0.5) rgba(255,255,255,0.03)}
      @keyframes acpSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
      @media(max-width:860px){
        #chain-popup{display:none !important; visibility:hidden !important; pointer-events:none !important;}
      }
    `
    document.head.appendChild(s)
  }

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
    font-family:'Inter',system-ui,sans-serif;
  `

  const itemsHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const arrowHtml = idx > 0 ? `
      <div style="display:flex;justify-content:center;padding:5px 0;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:7px solid rgba(2,132,199,0.5);"></div>
          <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(2,132,199,0.1),rgba(2,132,199,0.65));"></div>
        </div>
      </div>` : ''

    const cfg = ROLE_CFG[item.type]
    if (!cfg) return ''
    const d = item.data || {}
    const idVal = d[cfg.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || ''
    const rc = hexToRgb(cfg.color)
    const iconKey = ICON_BY_TYPE[item.type] || 'store'

    return `
      ${arrowHtml}
      <div style="
        border-radius:14px;padding:14px 16px;
        background:${isLast ? `linear-gradient(135deg,rgba(${rc},0.13),rgba(${rc},0.05))` : `rgba(${rc},0.04)`};
        border:${isLast ? `1.5px solid rgba(${rc},0.55)` : `1px solid rgba(${rc},0.16)`};
        position:relative;overflow:hidden;
      ">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">
          <div style="width:30px;height:30px;border-radius:9px;background:${cfg.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(${rc},0.3);">${iconSvg(ICON_PATHS[iconKey], '#FFFFFF', 15)}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:9px;color:${cfg.color};font-weight:800;letter-spacing:1.8px;">${cfg.label}</div>
            <div style="font-size:9px;color:${cfg.color};font-family:monospace;opacity:0.7;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idVal}</div>
          </div>
          ${isLast ? `
          <div style="font-size:8px;font-weight:800;padding:3px 9px;border-radius:20px;
            background:rgba(${rc},0.18);color:${cfg.color};
            border:1px solid rgba(${rc},0.4);
            white-space:nowrap;letter-spacing:0.5px;">● CURRENT</div>` : ''}
        </div>
        <div style="font-size:14px;color:#111817;font-weight:700;margin-bottom:9px;letter-spacing:-0.3px;">${name}</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${phone !== '—' ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg(ICON_PATHS.phone, cfg.color, 11)}</div>
            <span style="font-size:12px;color:#5C706E;">${phone}</span>
          </div>` : ''}
          ${city ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg(ICON_PATHS.mappin, cfg.color, 11)}</div>
            <span style="font-size:12px;color:#5C706E;">${city}</span>
          </div>` : ''}
        </div>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(12,64,68,0.12);">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:${ROLE_CFG.dealer.color};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(2,132,199,0.3);">${iconSvg(ICON_PATHS.store, '#FFFFFF', 13)}</div>
        <div>
          <div style="font-size:11px;color:#073B3F;font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:#5C706E;margin-top:2px;">${chain.length} level${chain.length !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <button class="chain-close-btn" title="Close" style="
        background: rgba(12,64,68,0.08); border: 1px solid rgba(12,64,68,0.2);
        width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: #0C4044; font-weight: 800; font-size: 12px; line-height: 1; padding: 0;
      ">✕</button>
    </div>
    ${itemsHtml}
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(12,64,68,0.10);">
      <div style="font-size:9px;color:#5C706E;text-align:center;letter-spacing:0.8px;font-weight:600;">BitByte Network • Hierarchy View</div>
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

// ══════════════════════════════════════════════════════════════════
// LANE CARD
// ══════════════════════════════════════════════════════════════════
function LaneCard({ node, role, active, onClick, ancestors, dark, text, subtext, onMessage, onPrint, activeStatusFilter, onToggleStatusFilter }) {
  const navigate = useNavigate()
  const cfg = ROLE_CFG[role]
  const sc = role === 'customer' ? STATUS_COLOR.green : (STATUS_COLOR[node.status] || cfg.color)
  const c = sc
  const Icon = cfg.Icon
  const childRole = CHILD_ROLE[role]
  const childCount = childRole
    ? (node.child_count !== undefined
        ? node.child_count
        : (node[CHILD_KEY[role]] || []).length)
    : null

  const childStatusCounts = childRole
    ? (node.child_status_counts || (() => {
        const counts = { red: 0, orange: 0, yellow: 0, green: 0 }
        ;(node[CHILD_KEY[role]] || []).forEach(ch => {
          if (ch.status && counts[ch.status] !== undefined) counts[ch.status]++
        })
        return counts
      })())
    : null

  return (
    <div
      className={`gcard ${active ? 'gcard-active' : 'gcard-dim'}`}
      style={{ '--nc': c, '--sc': sc }}
      onClick={onClick}
      onMouseEnter={e => showChainPopup(e.currentTarget, ancestors, { node, role }, dark)}
      title={node.status ? `Target status: ${node.status?.toUpperCase()} (${node.order_count ?? 0}/10)` : undefined}
      onMouseLeave={() => scheduleHideChainPopup()}
    >
      <button
        onClick={e => { e.stopPropagation(); clearTimeout(_chainHideTimer); removeChainPopup(); onMessage({ node, role }) }}
        className="gcard-msg-btn"
        style={{ '--nc': c }}
        title={`Message ${node.first_name} only`}
      >
        <IconMessage color={c} />
      </button>

      <button
        onClick={e => {
          e.stopPropagation()
          if (document.getElementById('chain-popup')) { removeChainPopup(); return }
          showChainPopup(e.currentTarget.closest('.gcard'), ancestors, { node, role }, dark)
        }}
        className="gcard-info-btn"
        style={{ '--nc': c }}
        title="View hierarchy chain"
      >
        i
      </button>

      <div className="gcard-badge" style={{ '--nc': c }}>
        <Icon color={c} size={11} /> {cfg.label}
      </div>
      <div className="gcard-id" style={{ color: c }}>{node[cfg.idKey]}</div>
      <div className="gcard-name" style={{ color: text }}>{node.first_name} {node.last_name || ''}</div>
      <div className="gcard-sub" style={{ color: subtext }}>
        <IconPhone color={subtext} /> {node.mobile_number}
      </div>
      {node.city_name && (
        <div className="gcard-sub" style={{ color: subtext }}>
          <IconMapPin color={subtext} /> {node.city_name}
        </div>
      )}

      <div className="gcard-actions">
        <button
          onClick={e => {
            e.stopPropagation()
            if (CHILD_ROLE[role]) {
              onPrint({ node, role, cfg, color: c, ancestors })
            } else {
              printPersonCard(node, role, cfg, c, ancestors)
            }
          }}
          className="gcard-btn" style={{ '--nc': c }}
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
          className="gcard-btn gcard-btn-sales"
        >
          <IconChart color="#0284C7" /> SALES ({node.order_count ?? 0})
        </button>
      </div>

      {node.status && (
        <div className="gcard-status-dots">
          {['red', 'orange', 'yellow', 'green'].map(s => {
            const count = childStatusCounts ? childStatusCounts[s] : (s === node.status ? (node.order_count ?? 0) : 0)
            const isFilterActive = activeStatusFilter && activeStatusFilter.role === role && activeStatusFilter.nodeId === node.id && activeStatusFilter.status === s
            return (
              <span
                key={s}
                onClick={e => { e.stopPropagation(); onToggleStatusFilter && onToggleStatusFilter(role, node, s) }}
                className="gcard-dot"
                style={{
                  background: STATUS_COLOR[s],
                  borderColor: STATUS_COLOR[s],
                  color: '#FFFFFF',
                  opacity: count > 0 ? 1 : 0.3,
                  outline: isFilterActive ? '2px solid #0C4044' : 'none',
                  outlineOffset: '2px',
                  cursor: onToggleStatusFilter ? 'pointer' : 'default',
                }}
                title={`${s.toUpperCase()}: ${count}`}
              >
                {count}
              </span>
            )
          })}
        </div>
      )}

      {childCount !== null && (role !== 'customer' || childCount > 0) && (
        <div className="gcard-count" style={{ background: c }}>
          {childCount} {childRole.replace('_', ' ')}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// LANE ROW
// ══════════════════════════════════════════════════════════════════
function LaneRow({ role, items, activeId, onSelect, ancestors, dark, text, subtext, emptyText, onMessage, onPrint, activeStatusFilter, onToggleStatusFilter, isLoading }) {
  const cfg = ROLE_CFG[role]
  return (
    <div className="glane">
      <div className="glane-label" style={{ '--nc': cfg.color }}>
        <span className="glane-level">LEVEL {LEVEL_NUM[role] || 4}</span>
        <span className="glane-role" style={{ color: cfg.color }}>{cfg.label}</span>
        <span className="glane-total" style={{ color: subtext }}>{items.length}</span>
      </div>
      <div className="glane-track" style={{ '--nc': cfg.color, scrollbarColor: `${cfg.color} rgba(231,237,236,0.62)` }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} color={cfg.color} />
          ))
        ) : items.length === 0 ? (
          <div className="glane-empty-pro" style={{ '--nc': cfg.color }}>
            <span style={{ color: subtext }}>{emptyText}</span>
          </div>
        ) : (
          items.map(item => (
            <LaneCard
              key={item.id}
              node={item}
              role={role}
              active={item.id === activeId}
              onClick={() => onSelect(item)}
              ancestors={ancestors}
              dark={dark} text={text} subtext={subtext}
              onMessage={onMessage}
              onPrint={onPrint}
              activeStatusFilter={activeStatusFilter}
              onToggleStatusFilter={onToggleStatusFilter}
            />
          ))
        )}
      </div>
      <div className="glane-divider" style={{ background: cfg.color }} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE — Dealer login
// ══════════════════════════════════════════════════════════════════
export default function Dealer_Hierarchy_grid() {
  const navigate = useNavigate()
  const dark = false
  const text = '#111817'
  const subtext = '#53615F'
  const inpBg = '#FFFFFF'
  const inpBorder = '#BDCFCE'

  const [root, setRoot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [subDealers, setSubDealers] = useState([])
  const [selSubDealer, setSelSubDealer] = useState(null)
  const [selPromotor, setSelPromotor] = useState(null)
  const [customerChain, setCustomerChain] = useState([])

  const [promotorCache, setPromotorCache] = useState({})
  const [customerCache, setCustomerCache] = useState({})
  const [loadingChildren, setLoadingChildren] = useState(null)

  const [activeStatusFilter, setActiveStatusFilter] = useState(null)

  const [messageTarget, setMessageTarget] = useState(null)
  const [messageTitle, setMessageTitle] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [messageSending, setMessageSending] = useState(false)
  const [messageMsg, setMessageMsg] = useState('')

  const openMessagePopup = (target) => {
    setMessageTarget(target)
    setMessageTitle('')
    setMessageBody('')
    setMessageMsg('')
  }

  const [printTarget, setPrintTarget] = useState(null)
  const openPrintPopup = (target) => setPrintTarget(target)
  const handlePrintOnly = () => {
    const { node, role, cfg, color, ancestors } = printTarget
    printPersonCard(node, role, cfg, color, ancestors)
    setPrintTarget(null)
  }
  const handlePrintHierarchy = () => {
    const { node, role, ancestors } = printTarget
    printHorizontalBracketTree(node, role, ancestors)
    setPrintTarget(null)
  }

  const sendDirectMessage = async () => {
    if (!messageTarget?.node?.user_id) {
      setMessageMsg('❌ user_id missing — hierarchy API refresh pannunga')
      return
    }
    if (!messageTitle.trim() || !messageBody.trim()) {
      setMessageMsg('❌ Title and message required')
      return
    }
    setMessageSending(true)
    try {
      await api.post('/announcements/', {
        title: messageTitle,
        message: messageBody,
        target_user: messageTarget.node.user_id,
      })
      setMessageMsg('✅ Sent! Only they will see this.')
      setTimeout(() => setMessageTarget(null), 1200)
    } catch (err) {
      setMessageMsg('❌ Failed: ' + JSON.stringify(err.response?.data))
    }
    setMessageSending(false)
  }

  const fetchChildren = async (role, parentId, cacheKey, setCache) => {
    setLoadingChildren(`${role}_${parentId}`)
    try {
      const res = await api.get(`/hierarchy/children/?role=${role}&id=${parentId}`)
      setCache(prev => ({ ...prev, [cacheKey]: res.data.items || [] }))
    } catch (err) { console.error(err) }
    setLoadingChildren(null)
  }

  const hasFetchedRef = useRef(false)
  const fetchHierarchy = async () => {
    setLoading(true)
    try {
      const res = await api.get('/my-hierarchy/')
      setRoot(res.data.root)
      const sdList = res.data.items || res.data.root?.sub_dealers || []
      setSubDealers(sdList)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    fetchHierarchy()
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(_chainHideTimer)
      removeChainPopup()
    }
  }, [])

  const currentSubDealer = useMemo(() => {
    if (!selSubDealer) return null
    return subDealers.find(sd => sd.id === selSubDealer) || null
  }, [subDealers, selSubDealer])

  const promotors = currentSubDealer ? (promotorCache[currentSubDealer.id] || []) : []
  const currentPromotor = useMemo(() => {
    if (!selPromotor) return null
    return promotors.find(p => p.id === selPromotor) || null
  }, [promotors, selPromotor])

  const customers = currentPromotor ? (customerCache[`p_${currentPromotor.id}`] || []) : []

  const filteredSubDealers = useMemo(() => {
    if (activeStatusFilter && activeStatusFilter.role === 'dealer' && activeStatusFilter.nodeId === root?.id) {
      return subDealers.filter(sd => sd.status === activeStatusFilter.status)
    }
    return subDealers
  }, [subDealers, activeStatusFilter, root])

  const filteredPromotors = useMemo(() => {
    if (activeStatusFilter && activeStatusFilter.role === 'sub_dealer' && activeStatusFilter.nodeId === currentSubDealer?.id) {
      return promotors.filter(p => p.status === activeStatusFilter.status)
    }
    return promotors
  }, [promotors, activeStatusFilter, currentSubDealer])

  const filteredCustomers = useMemo(() => {
    if (activeStatusFilter && activeStatusFilter.role === 'promotor' && activeStatusFilter.nodeId === currentPromotor?.id) {
      return customers.filter(c => c.status === activeStatusFilter.status)
    }
    return customers
  }, [customers, activeStatusFilter, currentPromotor])

  const subDealerAncestors = root ? [{ node: root, role: 'dealer' }] : []
  const promotorAncestors = currentSubDealer ? [...subDealerAncestors, { node: currentSubDealer, role: 'sub_dealer' }] : subDealerAncestors
  const customerAncestors = currentPromotor ? [...promotorAncestors, { node: currentPromotor, role: 'promotor' }] : promotorAncestors

  const selectSubDealer = (node) => {
    setSelSubDealer(node.id); setSelPromotor(null); setCustomerChain([])
    setActiveStatusFilter(null)
    if (!promotorCache[node.id]) fetchChildren('sub_dealer', node.id, node.id, setPromotorCache)
  }
  const selectPromotor = (node) => {
    setSelPromotor(node.id); setCustomerChain([])
    setActiveStatusFilter(null)
    if (!customerCache[`p_${node.id}`]) fetchChildren('promotor', node.id, `p_${node.id}`, setCustomerCache)
  }

  const selectCustomerAtDepth = (depth, node) => {
    setCustomerChain(prev => [...prev.slice(0, depth), node.id])
    if (!customerCache[`c_${node.id}`]) fetchChildren('customer', node.id, `c_${node.id}`, setCustomerCache)
  }

  const customerLanes = useMemo(() => {
    if (!currentPromotor) return []
    const lanes = []
    let levelItems = filteredCustomers
    let levelAncestors = promotorAncestors.concat([{ node: currentPromotor, role: 'promotor' }])
    lanes.push({
      depth: 0,
      items: levelItems,
      activeId: customerChain[0] ?? null,
      ancestors: levelAncestors,
    })
    for (let d = 0; d < customerChain.length; d++) {
      const selectedNode = levelItems.find(c => c.id === customerChain[d])
      if (!selectedNode) break
      levelItems = (selectedNode.customers && selectedNode.customers.length > 0)
        ? selectedNode.customers
        : (customerCache[`c_${selectedNode.id}`] || [])
      levelAncestors = levelAncestors.concat([{ node: selectedNode, role: 'customer' }])
      lanes.push({
        depth: d + 1,
        items: levelItems,
        activeId: customerChain[d + 1] ?? null,
        ancestors: levelAncestors,
        parentCustomer: selectedNode,
      })
    }
    return lanes
  }, [currentPromotor, customerChain, promotorAncestors, customerCache, filteredCustomers])

  const selectFns = { dealer: () => {}, sub_dealer: selectSubDealer, promotor: selectPromotor }
  const currentSelIds = { dealer: root?.id, sub_dealer: selSubDealer, promotor: selPromotor }
  const toggleStatusFilter = (role, node, status) => {
    if (currentSelIds[role] !== node.id) selectFns[role](node)
    setActiveStatusFilter(prev =>
      (prev && prev.role === role && prev.nodeId === node.id && prev.status === status) ? null : { role, nodeId: node.id, status }
    )
  }

  const searchOwnHierarchy = (query) => {
    if (!root || !query.trim()) return []
    const q = query.trim().toLowerCase()
    const result = []
    const checkMatch = (node, idKey) => {
      const idVal = (node[idKey] || '').toString().toLowerCase()
      const nameVal = `${node.first_name || ''} ${node.last_name || ''}`.toLowerCase()
      const phoneVal = (node.mobile_number || '').toString().toLowerCase()
      return idVal.includes(q) || nameVal.includes(q) || phoneVal.includes(q)
    }
    const searchCustomers = (cusList, ancestors) => {
      ;(cusList || []).forEach(cus => {
        if (checkMatch(cus, 'customer_id')) {
          result.push({ node: cus, role: 'customer', ancestors })
        }
        if (cus.customers && cus.customers.length > 0) {
          searchCustomers(cus.customers, ancestors.concat([{ node: cus, role: 'customer' }]))
        }
      })
    }
    ;(root.sub_dealers || []).forEach(sd => {
      if (checkMatch(sd, 'sub_dealer_id')) result.push({ node: sd, role: 'sub_dealer', ancestors: [{ node: root, role: 'dealer' }] })
      ;(sd.promotors || []).forEach(pr => {
        if (checkMatch(pr, 'promotor_id')) result.push({ node: pr, role: 'promotor', ancestors: [{ node: root, role: 'dealer' }, { node: sd, role: 'sub_dealer' }] })
        searchCustomers(pr.customers || [], [{ node: root, role: 'dealer' }, { node: sd, role: 'sub_dealer' }, { node: pr, role: 'promotor' }])
      })
    })
    return result
  }

  const searchResults = useMemo(() => {
    if (!debouncedSearch) return []
    return searchOwnHierarchy(debouncedSearch)
  }, [debouncedSearch, root])

  const jumpToSearchResult = (item) => {
    const map = {}
    const custIds = []
    item.ancestors.forEach(a => {
      if (a.role !== 'dealer' && a.role !== 'customer') map[a.role] = a.node.id
      if (a.role === 'customer') custIds.push(a.node.id)
    })
    if (item.role === 'customer') {
      custIds.push(item.node.id)
    } else {
      map[item.role] = item.node.id
    }
    setSelSubDealer(map.sub_dealer ?? null)
    setSelPromotor(map.promotor ?? null)
    setCustomerChain(custIds)
    setActiveStatusFilter(null)
    setSearch('')
  }

  const totalCounts = root ? countDescendants(root, 'dealer') : {}
  const statPills = [
    { label: 'Wholesale Dealers', roleKey: 'sub_dealer', count: totalCounts.sub_dealer || 0 },
    { label: 'Retailers', roleKey: 'promotor', count: totalCounts.promotor || 0 },
    { label: 'Customers', roleKey: 'customer', count: totalCounts.customer || 0 },
  ]

  return (
    <>
      <div className="sahg-page" style={{ minHeight: '100vh', background: '#FFFFFF', color: text, fontFamily: '"Inter",system-ui,sans-serif', padding: '28px 32px' }}>
        <style>{`
          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          .gcard{
            background:#FFFFFF;
            border:2.5px solid var(--sc); border-radius:16px; padding:14px 18px;
            min-width:172px; max-width:210px; cursor:pointer; position:relative;
            transition:opacity .2s ease, transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease;
            flex-shrink:0;
          }
          .gcard:hover{ transform:translateY(-3px); box-shadow:0 16px 34px rgba(7,59,63,0.20); }
          .gcard-msg-btn{
            position:absolute; top:8px; right:8px; z-index:2;
            width:22px; height:22px; border-radius:6px;
            background:#FFFFFF; border:1.5px solid var(--nc);
            color:var(--nc); display:flex; align-items:center; justify-content:center;
            cursor:pointer; transition:background .2s ease, transform .2s ease;
          }
          .gcard-msg-btn:hover{ background:var(--nc); color:#FFFFFF; transform:scale(1.08); }
          .gcard-info-btn{
            position:absolute; top:8px; left:8px; z-index:2;
            width:20px; height:20px; border-radius:50%;
            background:#FFFFFF; border:1.5px solid var(--nc);
            color:var(--nc); display:flex; align-items:center; justify-content:center;
            cursor:pointer; font-size:11px; font-weight:900; font-style:italic; font-family:Georgia,serif;
            transition:background .2s ease, transform .2s ease;
          }
          .gcard-info-btn:hover{ background:var(--nc); color:#FFFFFF; transform:scale(1.1); }
          .gcard-active{ opacity:1; transform:translateY(-4px); box-shadow:0 0 0 3px #0C4044, 0 18px 36px rgba(7,59,63,0.25); }
          .gcard-dim{ opacity:1; }
          .gcard-badge{ display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:900; padding:2px 8px; border-radius:20px; margin-bottom:8px; color:var(--nc); background:#FFFFFF; border:1.5px solid var(--nc); }
          .gcard-id{ font-family:monospace; font-size:11px; font-weight:800; margin-bottom:6px; word-break:break-all; }
          .gcard-name{ font-weight:900; font-size:14px; margin-bottom:8px; line-height:1.35; }
          .gcard-sub{ display:flex; align-items:center; gap:4px; font-size:12px; font-weight:650; margin-bottom:4px; }
          .gcard-actions{ margin-top:8px; display:flex; gap:6px; }
          .gcard-btn{ flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:5px 0; font-size:10px; font-weight:800; background:#FFFFFF; border:1.5px solid var(--nc); border-radius:20px; color:var(--nc); cursor:pointer; transition:background .15s ease, transform .1s ease; }
          .gcard-btn:hover{ background:var(--nc); color:#FDFDFC; transform:scale(1.03); }
          .gcard-btn-sales{ border-color:#0284C7; color:#0284C7; }
          .gcard-count{ position:absolute; bottom:-9px; left:50%; transform:translateX(-50%); color:#FDFDFC; font-size:10px; font-weight:900; padding:2px 8px; border-radius:20px; white-space:nowrap; text-shadow:0 1px 1px rgba(0,0,0,0.18); }
          .gcard-status-dots{ display:flex; gap:6px; justify-content:center; margin-top:9px; }
          .gcard-dot{ width:20px; height:20px; border-radius:50%; border:1.5px solid; box-sizing:border-box; transition:all .15s ease; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:800; }
          .gcard-dot:hover{ transform:scale(1.15); }

          .glane{ margin-bottom:26px; }
          .glane-label{ display:flex; align-items:baseline; gap:10px; margin-bottom:10px; padding-left:2px; }
          .glane-level{ font-size:11px; font-weight:900; letter-spacing:1.4px; color:var(--nc); opacity:1; }
          .glane-role{ font-size:15px; font-weight:900; letter-spacing:0.6px; }
          .glane-total{ font-size:13px; font-weight:700; }
          .glane-track{ display:flex; gap:14px; overflow-x:auto; overflow-y:visible; padding:6px 4px 14px 4px; scrollbar-width:thin; }
          .glane-track::-webkit-scrollbar{ height:7px; }
          .glane-track::-webkit-scrollbar-track{ background:rgba(12,64,68,0.10); border-radius:10px; }
          .glane-track::-webkit-scrollbar-thumb{ background:var(--nc); border-radius:10px; opacity:0.7; }
          .glane-track::-webkit-scrollbar-thumb:hover{ background:var(--nc); opacity:1; }
          .glane-empty-pro{ display:flex; align-items:center; gap:10px; padding:16px 18px; border:1.5px dashed var(--nc); border-radius:14px; opacity:0.85; font-size:12.5px; font-weight:600; }
          .glane-divider{ height:4px; border-radius:3px; margin:0 4px 4px 4px; opacity:0.9; }

          .gsa-card{
            display:inline-flex; align-items:center; gap:10px;
            background:rgba(12,64,68,0.08); border:1.5px solid #0C4044; border-radius:12px;
            padding:10px 18px; margin-bottom:22px;
          }
          @media(max-width:768px){
            .sahg-page{padding:16px!important}
            .sahg-header{flex-direction:column;align-items:stretch!important}
            .sahg-search-input{width:100%!important}
            .gcard{min-width:150px!important;max-width:180px!important}
          }
          @media(max-width:480px){
            .sahg-page{padding:10px!important}
            .gcard{min-width:118px!important;max-width:145px!important;padding:9px 10px!important;border-radius:12px!important}
            .gcard-badge{font-size:8px!important;padding:1px 6px!important;margin-bottom:5px!important}
            .gcard-id{font-size:9px!important;margin-bottom:4px!important}
            .gcard-name{font-size:11.5px!important;margin-bottom:5px!important}
            .gcard-sub{font-size:10px!important;margin-bottom:2px!important}
            .gcard-btn{font-size:8.5px!important;padding:4px 0!important}
            .gcard-msg-btn{width:18px!important;height:18px!important}
            .gcard-status-dots{margin-top:6px!important;gap:4px!important}
            .gcard-dot{width:16px!important;height:16px!important;font-size:7px!important}
            .gcard-count{font-size:8.5px!important;padding:1px 6px!important}
          }
        `}</style>

        {/* ── HEADER ── */}
        <div className="sahg-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => navigate('/dealer-hierarchy')}
                title="Switch to Tree View"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <IconSwitchView color="#0C4044" />
              </button>
              <span style={{ color: '#0C4044', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Distributor Hierarchy Grid
              </span>
            </div>
            {root && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${ROLE_CFG.dealer.color}22`, border: `1px solid ${ROLE_CFG.dealer.color}55`, borderRadius: '20px', padding: '4px 14px' }}>
                  <span style={{ color: ROLE_CFG.dealer.color, fontWeight: 800, fontSize: '13px' }}>1</span>
                  <span style={{ color: subtext, fontSize: '12px', fontWeight: 650 }}>Distributor</span>
                </div>
                {statPills.map(s => {
                  const color = ROLE_CFG[s.roleKey].color
                  return (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${color}14`, border: `1px solid ${color}44`, borderRadius: '20px', padding: '4px 14px' }}>
                      <span style={{ color, fontWeight: 800, fontSize: '13px' }}>{s.count}</span>
                      <span style={{ color: subtext, fontSize: '12px', fontWeight: 650 }}>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <IconSearch color={subtext} />
              </span>
              <input
                className="sahg-search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search ID, Name, Phone..."
                style={{ width: '240px', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '20px', padding: '9px 14px 9px 34px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s ease, box-shadow .15s ease' }}
                onFocus={e => { e.target.style.borderColor = '#0C4044'; e.target.style.boxShadow = '0 0 0 3px rgba(12,64,68,0.12)' }}
                onBlur={e => { e.target.style.borderColor = inpBorder; e.target.style.boxShadow = 'none' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}>
                  <IconX color={subtext} />
                </button>
              )}
            </div>
            <button onClick={() => navigate('/dealer')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(220,38,38,0.35)', color: '#DC2626', borderRadius: '10px', padding: '9px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
              <IconBack color="#DC2626" /> Back
            </button>
          </div>
        </div>

        {/* ── CANVAS CONTAINER ── */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(12,64,68,0.18)', borderRadius: '20px', padding: '24px 28px', minHeight: '70vh', boxShadow: '0 18px 42px rgba(7,59,63,0.08)' }}>
          {loading && (
            <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '10px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} color={ROLE_CFG.sub_dealer.color} />
              ))}
            </div>
          )}

          {!loading && !root && (
            <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>Failed to load hierarchy.</div>
          )}

          {!loading && root && debouncedSearch ? (
            searchResults.length === 0 ? (
              <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No results found for "{debouncedSearch}"</div>
            ) : (
              <div className="glane-track" style={{ flexWrap: 'wrap' }}>
                {searchResults.map((item, idx) => (
                  <LaneCard
                    key={item.node.id || idx}
                    node={item.node}
                    role={item.role}
                    active={true}
                    onClick={() => jumpToSearchResult(item)}
                    ancestors={item.ancestors}
                    dark={dark} text={text} subtext={subtext}
                    onMessage={openMessagePopup}
                    onPrint={openPrintPopup}
                  />
                ))}
              </div>
            )
          ) : !loading && root && (
            <>
              {/* Viewer's own dealer node */}
              <div className="gsa-card" style={{ borderColor: ROLE_CFG.dealer.color, background: `${ROLE_CFG.dealer.color}14` }}>
                <IconStore color={ROLE_CFG.dealer.color} size={18} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.4, color: ROLE_CFG.dealer.color }}>
                    LEVEL 1 · DISTRIBUTOR
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: text, marginTop: 2 }}>
                    {root.first_name} {root.last_name || ''} ({root.dealer_id})
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-start', color: subtext, marginBottom: 10, marginLeft: 4 }}>
                <IconChevronDown color={subtext} />
              </div>

              <LaneRow role="sub_dealer" items={filteredSubDealers} activeId={selSubDealer} onSelect={selectSubDealer}
                ancestors={subDealerAncestors} dark={dark} text={text} subtext={subtext}
                emptyText="No wholesale dealers under you yet." onMessage={openMessagePopup} onPrint={openPrintPopup}
                activeStatusFilter={activeStatusFilter} onToggleStatusFilter={toggleStatusFilter} />

              {currentSubDealer && (
                <LaneRow role="promotor" items={filteredPromotors} activeId={selPromotor} onSelect={selectPromotor}
                  ancestors={promotorAncestors} isLoading={loadingChildren === `sub_dealer_${currentSubDealer.id}`}
                  dark={dark} text={text} subtext={subtext}
                  emptyText={`No retailers under ${currentSubDealer.first_name}.`} onMessage={openMessagePopup} onPrint={openPrintPopup}
                  activeStatusFilter={activeStatusFilter} onToggleStatusFilter={toggleStatusFilter} />
              )}

              {currentPromotor && customerLanes.map((lane, idx) => (
                <LaneRow
                  key={`customer-lane-${idx}`}
                  role="customer"
                  items={lane.items}
                  activeId={lane.activeId}
                  onSelect={(node) => selectCustomerAtDepth(lane.depth, node)}
                  ancestors={lane.ancestors}
                  isLoading={lane.depth === 0
                    ? loadingChildren === `promotor_${currentPromotor.id}`
                    : loadingChildren === `customer_${customerChain[lane.depth - 1]}`}
                  dark={dark} text={text} subtext={subtext}
                  emptyText={idx === 0
                    ? `No customers under ${currentPromotor.first_name}.`
                    : `No referred customers under ${lane.parentCustomer?.first_name || 'this customer'}.`}
                  onMessage={openMessagePopup}
                  onPrint={openPrintPopup}
                  activeStatusFilter={idx === 0 ? activeStatusFilter : null}
                  onToggleStatusFilter={idx === 0 ? toggleStatusFilter : null}
                />
              ))}
            </>
          )}
        </div>

        {!loading && (
          <div style={{ marginTop: '20px', padding: '14px 0', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {['dealer', 'sub_dealer', 'promotor', 'customer'].map(l => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: ROLE_CFG[l].color }} />
                <span style={{ color: subtext, fontSize: '11px' }}>{ROLE_CFG[l].label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {messageTarget && (
        <div
          onClick={() => setMessageTarget(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', border: '1.5px solid #0C4044', borderRadius: '20px', padding: '28px', width: '95%', maxWidth: '460px', boxShadow: '0 24px 60px rgba(7,59,63,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconMessage color="#0C4044" size={14} /> SEND DIRECT MESSAGE
                </div>
                <div style={{ color: subtext, fontSize: '12px', marginTop: '4px' }}>
                  To: <span style={{ color: text, fontWeight: 700 }}>
                    {messageTarget.node.first_name} {messageTarget.node.last_name || ''}
                  </span>{' '}
                  ({ROLE_CFG[messageTarget.role]?.label}) — only they get this
                </div>
              </div>
              <button onClick={() => setMessageTarget(null)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#DC2626', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconX color="#DC2626" size={12} />
              </button>
            </div>

            {messageMsg && (
              <div style={{ background: messageMsg.includes('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.1)', border: `1px solid ${messageMsg.includes('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.3)'}`, color: messageMsg.includes('✅') ? '#16A34A' : '#DC2626', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '14px' }}>
                {messageMsg}
              </div>
            )}

            <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Subject *</label>
            <input
              value={messageTitle}
              onChange={e => setMessageTitle(e.target.value)}
              placeholder="e.g. Orders update"
              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 14px', color: text, fontSize: '14px', outline: 'none', marginBottom: '14px', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#0C4044'}
              onBlur={e => e.target.style.borderColor = inpBorder}
            />

            <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message *</label>
            <textarea
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              rows={4}
              placeholder="Type your message..."
              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 14px', color: text, fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#0C4044'}
              onBlur={e => e.target.style.borderColor = inpBorder}
            />

            <button
              disabled={messageSending || !messageTitle.trim() || !messageBody.trim()}
              onClick={sendDirectMessage}
              style={{ marginTop: '16px', width: '100%', padding: '13px', background: messageSending ? '#E1EBEA' : '#0C4044', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', color: '#FFFFFF', cursor: (messageSending || !messageTitle.trim() || !messageBody.trim()) ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {messageSending ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #FFFFFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Sending...
                </>
              ) : (
                <><IconMessage color="#FFFFFF" size={14} /> Send to this person only</>
              )}
            </button>
          </div>
        </div>
      )}

      {printTarget && (
        <div onClick={() => setPrintTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', border: `1.5px solid ${printTarget.color}`, borderRadius: '20px', padding: '26px', width: '95%', maxWidth: '380px', boxShadow: '0 24px 60px rgba(7,59,63,0.2)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <IconPrinter color={printTarget.color} size={22} />
            </div>
            <div style={{ color: text, fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>
              Print {printTarget.node.first_name}'s Profile
            </div>
            <div style={{ color: subtext, fontSize: '12px', marginBottom: '20px' }}>Select an option to print</div>

            <button onClick={handlePrintOnly} style={{ width: '100%', padding: '13px', marginBottom: '10px', background: `${printTarget.color}14`, border: `1.5px solid ${printTarget.color}`, borderRadius: '12px', color: printTarget.color, fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
              {ROLE_CFG[printTarget.role]?.label} Only
            </button>
            <button onClick={handlePrintHierarchy} style={{ width: '100%', padding: '13px', marginBottom: '10px', background: printTarget.color, border: 'none', borderRadius: '12px', color: '#FFFFFF', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
              {ROLE_CFG[printTarget.role]?.label} Hierarchy (Full Tree)
            </button>
            <button onClick={() => setPrintTarget(null)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: subtext, fontSize: '12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}