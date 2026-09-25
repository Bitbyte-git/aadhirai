import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { SkeletonCard } from '../components/Skeleton'
import '../components/skeleton.css'
import InternalRoleNavbar from '../collection/InternalRoleNavbar'

// ── Shop Hierarchy Tree — same top-down org-chart style as the other
// *_Hierarchy.jsx tree pages, built on the shop created_by chain.
// Full tree comes in one call (/shop-report/tree/?period=all), so
// expand / search / print all work client-side. ──

// ── SVG ICONS ──
const IconShield = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const IconStore = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1-5h16l1 5" /><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
    <path d="M4 9v10h16V9" /><path d="M9 21v-6h6v6" />
  </svg>
)
const IconLink = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)
const IconPhone = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const IconMapPin = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IconUser = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconPrinter = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)
const IconChart = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)
const IconSearch = ({ color, size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IconX = ({ color, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconBack = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
const IconMinus = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
)
const IconPlus = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
)
const IconFit = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /><path d="M9 12h6" />
  </svg>
)
const IconSwitchView = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 21l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
)
const IconChevronDown = ({ color, size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// ── colors — same per-depth palette as ShopHierarchyGrid (depth 1 = root) ──
const LEVEL_COLORS = ['#0C4044', '#16A34A', '#0284C7', '#7C3AED', '#CA8A04', '#DB2777', '#DC2626']
const levelColor = depth => LEVEL_COLORS[(depth - 1) % LEVEL_COLORS.length]
const ACTIVE_COLOR = '#16A34A'
const INACTIVE_COLOR = '#B86F74'

const TYPE_STYLE = {
  live: { label: 'Physical', Icon: IconStore, bg: 'rgba(12,64,68,0.10)', border: 'rgba(12,64,68,0.38)', color: '#0C4044' },
  virtual: { label: 'Virtual', Icon: IconLink, bg: 'rgba(204,168,129,0.18)', border: 'rgba(204,168,129,0.5)', color: '#8A623D' },
}

const formatINR = n => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// shop names / addresses are user-entered — escape before writing into print windows
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))

function ShopTypeBadge({ type, size = 'sm' }) {
  const st = TYPE_STYLE[type] || TYPE_STYLE.live
  const Icon = st.Icon
  return (
    <span className={`stree-type stree-type-${size}`} style={{ color: st.color, background: st.bg, borderColor: st.border }}>
      <Icon color={st.color} size={10} /> {st.label}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════════
// PRINT helpers
// ══════════════════════════════════════════════════════════════════
function chainPrintStyles(accent) {
  return `
    * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:'Inter',system-ui,-apple-system,sans-serif; background:#F4F8F8; color:#111817; padding:32px 20px; }
    .wrapper { max-width:540px; margin:0 auto; background:#FFFFFF; border:1.5px solid #D6E2E1; border-radius:20px; padding:32px; box-shadow:0 12px 36px rgba(7,59,63,0.08); }
    .header { text-align:center; margin-bottom:26px; border-bottom:1.5px solid #E1EBEA; padding-bottom:18px; }
    .header h1 { font-size:20px; font-weight:800; color:#073B3F; margin-bottom:4px; }
    .header p { font-size:12.5px; color:#5C706E; font-weight:600; }
    .chain-item { background:#FFFFFF; border:1.5px solid #E1EBEA; border-left:4px solid #5C706E; border-radius:12px; padding:12px 16px; margin-bottom:10px; }
    .chain-item.current { border-color:${accent}; border-left:5px solid ${accent}; background:${accent}0A; }
    .chain-role { font-size:9.5px; font-weight:800; color:#5C706E; letter-spacing:1.2px; margin-bottom:3px; text-transform:uppercase; }
    .chain-item.current .chain-role { color:${accent}; font-weight:900; }
    .chain-id { font-family:monospace; font-size:11px; font-weight:700; color:${accent}; margin-bottom:3px; }
    .chain-name { font-size:15px; font-weight:800; color:#111817; margin-bottom:4px; }
    .chain-info { font-size:11.5px; color:#5C706E; margin-top:2px; }
    .chain-arrow { text-align:center; color:#073B3F; margin:2px 0 6px; font-size:16px; font-weight:900; line-height:1; }
    .footer { text-align:center; font-size:10.5px; color:#5C706E; margin-top:26px; border-top:1px solid #E1EBEA; padding-top:14px; }
    @media print { body { background:#FFFFFF !important; padding:10mm !important; } .wrapper { border:none !important; box-shadow:none !important; padding:0 !important; max-width:100% !important; } }
  `
}

function printShopChain(chain) {
  const current = chain[chain.length - 1]
  const html = chain.map((node, idx) => `
    <div class="chain-item ${idx === chain.length - 1 ? 'current' : ''}">
      <div class="chain-role">LEVEL ${idx + 1} · ${node.shop_type === 'virtual' ? 'VIRTUAL' : 'PHYSICAL'} SHOP</div>
      <div class="chain-id">${esc(node.shop_id)}</div>
      <div class="chain-name">${esc(node.shop_name)}</div>
      <div class="chain-info">Owner: ${esc(node.owner_name || '—')}</div>
      <div class="chain-info">Tel: ${esc(node.mobile_number || '—')}</div>
      ${node.city ? `<div class="chain-info">${esc(node.city)}</div>` : ''}
      <div class="chain-info">Sales: ${esc(formatINR(node.network_sales))} · ${node.network_orders} orders</div>
    </div>${idx < chain.length - 1 ? '<div class="chain-arrow">↓</div>' : ''}`).join('')

  const w = window.open('', '_blank')
  if (!w) { alert('Pop-up blocked! Please allow pop-ups for this site to print.'); return }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Shop Chain — ${esc(current.shop_name)}</title>
    <style>${chainPrintStyles(levelColor(chain.length))}</style></head>
    <body><div class="wrapper">
      <div class="header"><h1>BitByte — Shop Hierarchy Chain</h1><p>${esc(current.shop_name)} (${esc(current.shop_id)})</p></div>
      ${html}
      <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div><script>window.onload = () => { window.print() }<\/script></body></html>`)
  w.document.close()
}

function bracketBranch(node, depth) {
  const c = levelColor(depth)
  const kids = node.children || []
  const card = `
    <div class="bracket-card" style="border-left-color:${c};">
      <div class="bracket-card-role" style="color:${c};background:${c}18;">LEVEL ${depth} · ${node.shop_type === 'virtual' ? 'VIRTUAL' : 'PHYSICAL'}</div>
      <div class="bracket-card-id" style="color:${c};">${esc(node.shop_id)}</div>
      <div class="bracket-card-name">${esc(node.shop_name)}</div>
      ${node.owner_name ? `<div class="bracket-card-sub">${esc(node.owner_name)}</div>` : ''}
      ${node.mobile_number ? `<div class="bracket-card-sub">📞 ${esc(node.mobile_number)}</div>` : ''}
      ${node.city ? `<div class="bracket-card-sub">📍 ${esc(node.city)}</div>` : ''}
      <div class="bracket-card-footer">
        <span>${esc(formatINR(node.network_sales))} · ${node.network_orders} orders</span>
        ${kids.length ? `<span style="color:${c};">${kids.length} sub</span>` : ''}
      </div>
    </div>`
  if (!kids.length) return `<div class="bracket-branch"><div class="bracket-node-wrapper">${card}</div></div>`
  const rows = kids.map((k, i) => {
    const pos = kids.length === 1 ? 'only' : i === 0 ? 'first' : i === kids.length - 1 ? 'last' : 'middle'
    return `<div class="bracket-child-row bracket-pos-${pos}"><div class="bracket-arm"></div>${bracketBranch(k, depth + 1)}</div>`
  }).join('')
  return `<div class="bracket-branch"><div class="bracket-node-wrapper">${card}</div><div class="bracket-stem"></div><div class="bracket-children">${rows}</div></div>`
}

function printShopTree(node, depth) {
  const w = window.open('', '_blank')
  if (!w) { alert('Pop-up blocked! Please allow pop-ups for this site to print.'); return }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>Shop Tree — ${esc(node.shop_name)} (${esc(node.shop_id)})</title>
    <style id="print-orientation-style">@page { size: A4 landscape; margin: 8mm 6mm; }</style>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      body { font-family:'Inter',-apple-system,'Segoe UI',Roboto,sans-serif; background:#F4F8F8; color:#111817; padding:16px 20px 40px; }
      .print-toolbar { position:sticky; top:0; z-index:9999; background:#FFFFFF; border:1.5px solid #D6E2E1; border-radius:14px; padding:10px 18px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; box-shadow:0 8px 24px rgba(7,59,63,0.08); }
      .btn-print { background:#073B3F; color:#FFFFFF; border:none; border-radius:8px; padding:7px 18px; font-weight:800; font-size:12.5px; cursor:pointer; }
      .btn-mode { background:#F4F8F8; color:#073B3F; border:1px solid #D6E2E1; border-radius:8px; padding:7px 14px; font-weight:700; font-size:12px; cursor:pointer; }
      .btn-mode.active { background:#E6F0F0; border-color:#073B3F; font-weight:800; }
      .btn-action { background:#FFFFFF; color:#5C706E; border:1px solid #D6E2E1; border-radius:8px; padding:7px 12px; font-weight:700; font-size:12px; cursor:pointer; }
      .btn-close { background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; border-radius:8px; padding:7px 14px; font-weight:700; font-size:12px; cursor:pointer; }
      .title { font-size:13px; font-weight:800; color:#073B3F; }
      .tree-scroll-container { background:#FFFFFF; border:1.5px solid #D6E2E1; border-radius:16px; padding:24px 20px; overflow-x:auto; width:100%; }
      #bracket-tree-root { display:inline-block; min-width:max-content; position:relative; }
      .bracket-branch { display:flex; align-items:center; position:relative; }
      .bracket-node-wrapper { flex-shrink:0; display:flex; align-items:center; z-index:2; position:relative; }
      .bracket-stem { width:20px; height:2px; background:#073B3F; flex-shrink:0; }
      .bracket-children { display:flex; flex-direction:column; justify-content:center; position:relative; flex-shrink:0; }
      .bracket-child-row { display:flex; align-items:center; position:relative; padding:3px 0; }
      .bracket-arm { width:20px; height:2px; background:#073B3F; flex-shrink:0; }
      .bracket-child-row.bracket-pos-first::before { content:''; position:absolute; left:0; top:50%; bottom:0; width:2px; background:#073B3F; }
      .bracket-child-row.bracket-pos-middle::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:#073B3F; }
      .bracket-child-row.bracket-pos-last::before { content:''; position:absolute; left:0; top:0; bottom:50%; width:2px; background:#073B3F; }
      .bracket-card { width:190px; background:#FFFFFF; border:1.5px solid #E1EBEA; border-left:4px solid #073B3F; border-radius:10px; padding:8px 10px; box-shadow:0 2px 8px rgba(7,59,63,0.06); }
      .bracket-card-role { font-size:8.5px; font-weight:800; letter-spacing:0.8px; padding:2px 6px; border-radius:4px; display:inline-block; margin-bottom:2px; }
      .bracket-card-id { font-family:monospace; font-size:10px; font-weight:750; }
      .bracket-card-name { font-size:12px; font-weight:800; margin:2px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .bracket-card-sub { font-size:9.5px; color:#5C706E; margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .bracket-card-footer { display:flex; justify-content:space-between; align-items:center; gap:6px; margin-top:4px; padding-top:4px; border-top:1px solid #E1EBEA; font-size:8.5px; font-weight:700; }
      @media print { .print-toolbar { display:none !important; } body { background:#FFFFFF !important; padding:0 !important; } .tree-scroll-container { border:none !important; padding:0 !important; } }
    </style></head>
    <body>
      <div class="print-toolbar">
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="btn-print" onclick="window.print()">🖨️ Print Tree</button>
          <button id="btn-landscape" class="btn-mode active" onclick="setOrientation('landscape')">Landscape</button>
          <button id="btn-portrait" class="btn-mode" onclick="setOrientation('portrait')">Portrait</button>
          <span class="title">${esc(node.shop_name)} · Shop Network</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button class="btn-action" onclick="zoomIn()">➕ Zoom In</button>
          <button class="btn-action" onclick="zoomOut()">➖ Zoom Out</button>
          <button class="btn-action" onclick="zoomFit()">🎯 Fit View</button>
          <button class="btn-close" onclick="window.close()">✕ Close</button>
        </div>
      </div>
      <div class="tree-scroll-container"><div id="bracket-tree-root">${bracketBranch(node, depth)}</div></div>
      <script>
        let s = 1;
        function apply(v) { s = v; const el = document.getElementById('bracket-tree-root'); el.style.transformOrigin = 'top left'; el.style.transform = 'scale(' + s + ')'; }
        function zoomIn() { apply(Math.min(1.5, s + 0.08)); }
        function zoomOut() { apply(Math.max(0.3, s - 0.08)); }
        function zoomFit() { const el = document.getElementById('bracket-tree-root'); const avail = window.innerWidth - 60; const nat = el.scrollWidth / s; apply(nat > avail ? avail / nat : 1); }
        function setOrientation(m) {
          document.getElementById('print-orientation-style').textContent = '@page { size: A4 ' + m + '; margin: 8mm 6mm; }';
          document.getElementById('btn-landscape').classList.toggle('active', m === 'landscape');
          document.getElementById('btn-portrait').classList.toggle('active', m === 'portrait');
          zoomFit();
        }
        window.onload = () => { zoomFit(); };
      <\/script>
    </body></html>`)
  w.document.close()
}

// ══════════════════════════════════════════════════════════════════
// HIERARCHY CHAIN popup (click the "i" on any card)
// ══════════════════════════════════════════════════════════════════
function ChainPopup({ chain, rect, onClose }) {
  const isMobile = window.innerWidth <= 860
  const popW = isMobile ? Math.min(290, window.innerWidth - 24) : 290
  const popH = Math.min(120 + chain.length * 150, window.innerHeight * 0.85)
  let left, top
  if (isMobile) {
    left = (window.innerWidth - popW) / 2
    top = Math.max(16, (window.innerHeight - popH) / 2)
  } else {
    left = rect.right + 18
    top = rect.top + rect.height / 2 - popH / 2
    if (left + popW > window.innerWidth - 16) left = rect.left - popW - 18
  }
  left = Math.min(Math.max(12, left), Math.max(12, window.innerWidth - popW - 12))
  top = Math.min(Math.max(12, top), Math.max(12, window.innerHeight - popH - 12))

  return (
    <>
      <div className="stree-pop-overlay" onClick={onClose} />
      <div className="stree-pop" style={{ left, top, width: popW, maxHeight: popH }}>
        <div className="stree-pop-head">
          <div>
            <div className="stree-pop-title">HIERARCHY CHAIN</div>
            <div className="stree-pop-sub">{chain.length} level{chain.length !== 1 ? 's' : ''} deep</div>
          </div>
          <button className="stree-pop-close" onClick={onClose} title="Close"><IconX color="#0C4044" /></button>
        </div>
        {chain.map((node, idx) => {
          const c = levelColor(idx + 1)
          const isCurrent = idx === chain.length - 1
          return (
            <div key={node.shop_id}>
              {idx > 0 && <div className="stree-pop-arrow" style={{ color: c }}>↓</div>}
              <div className="stree-pop-item" style={{ borderColor: isCurrent ? c : `${c}33`, background: isCurrent ? `${c}0D` : '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.4, color: c }}>{idx === 0 ? 'ROOT SHOP' : `LEVEL ${idx + 1}`}</span>
                  {isCurrent && idx > 0 && <span style={{ fontSize: 8, fontWeight: 900, color: c, border: `1px solid ${c}66`, borderRadius: 20, padding: '2px 7px' }}>● CURRENT</span>}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: c, marginTop: 3 }}>{node.shop_id}</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111817', margin: '3px 0 6px' }}>{node.shop_name}</div>
                <ShopTypeBadge type={node.shop_type} />
                <div style={{ fontSize: 11.5, color: '#53615F', marginTop: 6 }}>{node.owner_name} · {node.mobile_number || '—'}</div>
                {node.city && <div style={{ fontSize: 11.5, color: '#53615F' }}>{node.city}</div>}
                <div style={{ fontSize: 11.5, fontWeight: 800, color: c, marginTop: 4 }}>{formatINR(node.network_sales)} · {node.network_orders} orders</div>
              </div>
            </div>
          )
        })}
        <div className="stree-pop-foot">BitByte Shop Network · Hierarchy Chain</div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════
// TREE NODE — card + (if expanded) its children row with connectors
// ══════════════════════════════════════════════════════════════════
// oru parent-ku keela ore oru child mattum open aagum — sibling B click pannina A-oda sub-shops hide aagum
function ShopTreeNode({ node, depth, chain, parentKey, openMap, onToggle, onInfo, onPrint, onReport, highlightId }) {
  const c = levelColor(depth)
  const kids = node.children || []
  const hasKids = kids.length > 0
  const isOpen = hasKids && openMap[parentKey] === node.shop_id
  const myChain = [...chain, node]

  return (
    <div className="otree-node-wrap">
      <div
        id={`shop-node-${node.shop_id}`}
        data-depth={depth}
        className={`otree-card ${highlightId === node.shop_id ? 'stree-hl' : ''}`}
        style={{ '--nc': c, cursor: hasKids ? 'pointer' : 'default' }}
        onClick={() => hasKids && onToggle(parentKey, node.shop_id)}
        title={hasKids ? (isOpen ? 'Hide sub-shops' : 'Show sub-shops') : 'No sub-shops under this one'}
      >
        <button className="stree-info" style={{ '--nc': c }} title="View hierarchy chain"
          onClick={e => { e.stopPropagation(); onInfo(e.currentTarget, myChain) }}>i</button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8, paddingLeft: 22 }}>
          <ShopTypeBadge type={node.shop_type} />
          <span className="stree-dot" title={node.active_today ? 'Logged in today' : 'Not logged in today'}
            style={{ background: node.active_today ? ACTIVE_COLOR : INACTIVE_COLOR }} />
        </div>
        <div className="otree-id" style={{ color: c }}>{node.shop_id}</div>
        <div className="otree-name">{node.shop_name}</div>
        {node.owner_name && <div className="otree-sub"><IconUser color="#53615F" /> {node.owner_name}</div>}
        {node.mobile_number && <div className="otree-sub"><IconPhone color="#53615F" /> {node.mobile_number}</div>}
        {node.city && <div className="otree-sub"><IconMapPin color="#53615F" /> {node.city}</div>}
        <div className="stree-sales" style={{ color: c }}>
          {formatINR(node.network_sales)}
          <span>{node.network_orders} order{node.network_orders === 1 ? '' : 's'}</span>
        </div>
        <div className="stree-since">Since {formatDate(node.created_at)}</div>

        <div className="otree-actions">
          <button className="otree-btn" style={{ '--nc': c }}
            onClick={e => { e.stopPropagation(); onPrint(node, depth, myChain) }}>
            <IconPrinter color={c} /> PRINT
          </button>
          <button className="otree-btn otree-btn-sales"
            onClick={e => { e.stopPropagation(); onReport(node) }}>
            <IconChart color="#0284C7" /> REPORT
          </button>
        </div>

        {hasKids && (
          <div className="otree-toggle" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            <IconChevronDown color={c} />
          </div>
        )}
        {hasKids && (
          <div className="otree-count" style={{ background: c }}>
            {node.descendant_count} sub-shop{node.descendant_count === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="otree-children" style={{ '--lc': levelColor(depth + 1) }}>
          {kids.map(k => (
            <div className="otree-item" key={k.shop_id}>
              <ShopTreeNode
                node={k} depth={depth + 1} chain={myChain}
                parentKey={node.shop_id} openMap={openMap} onToggle={onToggle} onInfo={onInfo}
                onPrint={onPrint} onReport={onReport} highlightId={highlightId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function ShopHierarchy() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const isSuperAdmin = role === 'super_admin'

  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // openMap[parentKey] = the one child shop_id open under that parent ('root' = level-1 row)
  const [openMap, setOpenMap] = useState({})
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [highlightId, setHighlightId] = useState(null)
  const [chainPopup, setChainPopup] = useState(null)
  const [printTarget, setPrintTarget] = useState(null)

  const DEFAULT_ZOOM = 0.85
  const [treeZoom, setTreeZoom] = useState(DEFAULT_ZOOM)
  const treeWrapperRef = useRef(null)
  const scrollAreaRef = useRef(null)
  const updateTreeZoom = z => setTreeZoom(Math.min(1.4, Math.max(0.3, Number(z.toFixed(2)))))
  const zoomIn = () => updateTreeZoom(treeZoom + 0.1)
  const zoomOut = () => updateTreeZoom(treeZoom - 0.1)
  const resetZoom = () => updateTreeZoom(DEFAULT_ZOOM)
  const fitHierarchy = () => {
    const el = scrollAreaRef.current
    const content = el?.firstElementChild
    if (!el || !content) return
    const avail = el.clientWidth - 260
    const natural = content.scrollWidth
    if (natural > 0 && avail > 0) updateTreeZoom(Math.min(1, Math.max(0.3, avail / natural)))
  }

  const text = '#111817'
  const subtext = '#53615F'
  const border = 'rgba(12,64,68,0.18)'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get('/shop-report/tree/', { params: { period: 'all' } })
      .then(res => { if (!cancelled) { setTree(res.data.tree); setError('') } })
      .catch(() => { if (!cancelled) setError('Failed to load your shop network.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 150)
    return () => clearTimeout(t)
  }, [search])

  // flat index: every shop (excluding the virtual "All Shops" root) with its ancestor chain
  const flat = useMemo(() => {
    if (!tree) return []
    const out = []
    const walk = (node, chain, depth) => {
      const isVirtualRoot = !node.shop_id
      const nextChain = isVirtualRoot ? chain : [...chain, node]
      if (!isVirtualRoot) out.push({ node, chain: nextChain, depth })
      ;(node.children || []).forEach(k => walk(k, nextChain, isVirtualRoot ? depth : depth + 1))
    }
    walk(tree, [], 1)
    return out
  }, [tree])

  const stats = useMemo(() => {
    const s = { total: flat.length, physical: 0, virtual: 0, active: 0, levels: 0 }
    flat.forEach(({ node, depth }) => {
      if (node.shop_type === 'virtual') s.virtual++; else s.physical++
      if (node.active_today) s.active++
      s.levels = Math.max(s.levels, depth)
    })
    return s
  }, [flat])

  const searchResults = useMemo(() => {
    if (!debouncedSearch) return []
    return flat.filter(({ node }) =>
      (node.shop_id || '').toLowerCase().includes(debouncedSearch) ||
      (node.shop_name || '').toLowerCase().includes(debouncedSearch) ||
      (node.owner_name || '').toLowerCase().includes(debouncedSearch) ||
      (node.mobile_number || '').includes(debouncedSearch) ||
      (node.city || '').toLowerCase().includes(debouncedSearch)
    ).slice(0, 40)
  }, [debouncedSearch, flat])

  const toggle = (parentKey, shopId) => setOpenMap(prev => ({
    ...prev,
    [parentKey]: prev[parentKey] === shopId ? null : shopId,
  }))
  const collapseAll = () => setOpenMap({})

  // search result click → open the path down to that shop (one per level), highlight + scroll to it
  const revealShop = ({ node, chain }) => {
    const treeChain = tree?.shop_id ? chain.slice(1) : chain   // own root shop sits in the left column
    const next = {}
    for (let i = 0; i < treeChain.length - 1; i++) {
      next[i === 0 ? 'root' : treeChain[i - 1].shop_id] = treeChain[i].shop_id
    }
    setOpenMap(next)
    setHighlightId(node.shop_id)
    setSearch('')
    setDebouncedSearch('')
  }

  useEffect(() => {
    if (!highlightId) return
    const t = setTimeout(() => {
      document.getElementById(`shop-node-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }, 80)
    const clear = setTimeout(() => setHighlightId(null), 3500)
    return () => { clearTimeout(t); clearTimeout(clear) }
  }, [highlightId])

  const openInfo = (el, chain) => setChainPopup({ chain, rect: el.getBoundingClientRect() })
  const goReport = node => navigate(`/shop-report?shop=${encodeURIComponent(node.shop_id)}`)
  const handleLogout = () => { localStorage.clear(); navigate('/login') }

  // left column = root (own shop, or Super Admin); tree area starts from its children
  const rootIsShop = !!tree?.shop_id
  const topLevel = tree ? (tree.children || []) : []
  const firstDepth = rootIsShop ? 2 : 1
  const rootChain = rootIsShop ? [tree] : []
  const rootColor = rootIsShop ? levelColor(1) : '#0C4044'

  // ── same measuring as Superadmin_Hierarchy: "Level N" labels in the left column
  // + the bridge line from the root card across to every level-1 card ──
  const [levelTops, setLevelTops] = useState({})
  const [rowAnchors, setRowAnchors] = useState([])
  const [rootAnchor, setRootAnchor] = useState(null)

  useLayoutEffect(() => {
    const wrapper = treeWrapperRef.current
    if (!wrapper) return
    const measure = () => {
      const wr = wrapper.getBoundingClientRect()
      const tops = {}
      for (let d = firstDepth; d <= firstDepth + 30; d++) {
        const el = wrapper.querySelector(`.sh-tree-scroll [data-depth="${d}"]`)
        if (!el) break
        const r = el.getBoundingClientRect()
        tops[d] = (r.top - wr.top) + r.height / 2
      }
      setLevelTops(tops)
      setRowAnchors(Array.from(wrapper.querySelectorAll(`.sh-tree-scroll [data-depth="${firstDepth}"]`)).map(el => {
        const r = el.getBoundingClientRect()
        return { x: (r.left - wr.left) + r.width / 2, top: r.top - wr.top }
      }))
      const rootEl = wrapper.querySelector('[data-role="shop-root"]')
      if (rootEl) {
        const r = rootEl.getBoundingClientRect()
        setRootAnchor({ x: r.right - wr.left, y: (r.top - wr.top) + r.height / 2 })
      }
    }
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
  }, [tree, loading, openMap, treeZoom, firstDepth])

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      {!isSuperAdmin && (
        <InternalRoleNavbar
          roleTitle="SHOP"
          homePath="/shop-dashboard"
          managementItems={[
            { label: 'Dashboard', path: '/shop-dashboard' },
            { label: 'Create Shop', path: '/add-shop' },
            { label: 'My Network', path: '/shop-hierarchy-grid' },
            { label: 'Network Tree', path: '/shop-hierarchy-tree' },
          ]}
          celebrationItems={[]}
          announcementItems={[]}
          coinItems={[]}
          reportItems={[
            { label: 'Shop Report', path: '/shop-report' },
            { label: 'Network Grid', path: '/shop-hierarchy-grid' },
            { label: 'Network Tree', path: '/shop-hierarchy-tree' },
          ]}
          actionItems={[
            { label: 'Profile', icon: 'user', action: () => navigate('/shop-dashboard') },
            { label: 'My Network', icon: 'user', action: () => navigate('/shop-hierarchy-grid') },
            { label: 'Logout', icon: 'logout', variant: 'danger', action: handleLogout },
          ]}
        />
      )}

      <div className="sh-page-wrap">
        <style>{`
          .sh-page-wrap{ min-height:100vh; background:#FFFFFF; color:${text}; font-family:"Inter",system-ui,sans-serif; padding:28px 32px; box-sizing:border-box; }
          .sh-topbar{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:16px; }
          .sh-controls{ display:flex; flex-direction:column; align-items:flex-end; gap:10px; }
          .sh-search-wrap{ position:relative; width:300px; max-width:100%; }
          .sh-search-input{ width:100%; background:#FFFFFF; border:1px solid #BDCFCE; border-radius:10px; padding:9px 34px 9px 34px; color:${text}; font-size:13px; outline:none; box-sizing:border-box; }
          .sh-search-input:focus{ border-color:#0C4044; box-shadow:0 0 0 3px rgba(12,64,68,0.10); }
          .sh-search-results{ position:absolute; top:calc(100% + 6px); right:0; width:360px; max-width:calc(100vw - 24px); max-height:360px; overflow-y:auto; background:#FFFFFF; border:1px solid ${border}; border-radius:14px; box-shadow:0 24px 50px rgba(7,59,63,0.18); z-index:60; padding:6px; }
          .sh-search-item{ display:block; width:100%; text-align:left; background:none; border:none; border-radius:10px; padding:9px 12px; cursor:pointer; font-family:inherit; }
          .sh-search-item:hover{ background:#E6F1EF; }
          .sh-zoom-wrap{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; background:rgba(255,255,255,0.94); border:1px solid rgba(12,64,68,0.16); border-radius:14px; padding:6px; box-shadow:0 12px 28px rgba(7,59,63,0.12); }
          .sh-canvas{ background:#FFFFFF; border:1.5px solid ${border}; border-radius:20px; padding:28px 0; overflow:hidden; min-height:80vh; position:relative; box-shadow:0 18px 42px rgba(7,59,63,0.08); }
          .sh-superadmin-col{ position:absolute; top:0; left:0; bottom:0; width:200px; z-index:40; background:#FFFFFF; display:flex; flex-direction:column; align-items:center; padding-top:20px; }
          .sh-superadmin-line{ width:2px; flex:1; margin-top:6px; }
          .sh-level-labels{ position:absolute; left:0; top:0; width:200px; height:100%; z-index:45; pointer-events:none; }
          .sh-svg-bridge{ position:absolute; top:0; left:0; width:100%; height:100%; z-index:44; pointer-events:none; }
          .sh-tree-scroll{ overflow-x:auto; overflow-y:hidden; padding:72px 32px 40px 220px; -webkit-overflow-scrolling:touch; }
          .sh-chip{ display:flex; align-items:center; gap:6px; border-radius:20px; padding:4px 14px; }

          .otree-node-wrap{ display:flex; flex-direction:column; align-items:center; }
          .otree-card{ background:#FFFFFF; border:2px solid var(--nc); border-radius:12px; padding:12px 16px; min-width:188px; max-width:220px; position:relative; transition:transform .25s ease, box-shadow .25s ease; }
          .otree-card:hover{ transform:translateY(-3px); box-shadow:0 14px 30px rgba(7,59,63,0.16); }
          .otree-id{ font-family:monospace; font-size:11px; font-weight:800; margin-bottom:6px; word-break:break-all; }
          .otree-name{ font-weight:900; font-size:14px; margin-bottom:8px; line-height:1.35; color:${text}; }
          .otree-sub{ display:flex; align-items:center; gap:4px; font-size:12px; font-weight:650; margin-bottom:4px; color:${subtext}; }
          .otree-actions{ margin-top:8px; display:flex; gap:6px; }
          .otree-btn{ flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:5px 0; font-size:10px; font-weight:800; background:#FFFFFF; border:1.5px solid var(--nc); border-radius:8px; color:var(--nc); cursor:pointer; font-family:inherit; }
          .otree-btn:hover{ background:var(--nc); color:#FFFFFF; }
          .otree-btn:hover svg{ stroke:#FFFFFF; }
          .otree-btn-sales{ --nc:#0284C7; }
          .otree-toggle{ position:absolute; top:10px; right:10px; transition:transform .25s ease; }
          .otree-count{ position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); color:#FFFFFF; font-size:10px; font-weight:900; padding:2px 8px; border-radius:20px; white-space:nowrap; }

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
          .otree-children-root{ padding-top:0; }
          .otree-children-root::before{ display:none; }
          .otree-children-root > .otree-item::before,
          .otree-children-root > .otree-item::after{ display:none; }

          .stree-type{ display:inline-flex; align-items:center; gap:4px; font-size:9.5px; font-weight:800; padding:2px 8px; border-radius:20px; border:1px solid; text-transform:uppercase; letter-spacing:0.04em; }
          .stree-dot{ width:9px; height:9px; border-radius:50%; box-shadow:0 0 0 3px #FFFFFF, 0 0 0 4px rgba(12,64,68,0.12); flex-shrink:0; }
          .stree-info{ position:absolute; top:10px; left:10px; width:20px; height:20px; border-radius:50%; background:#FFFFFF; border:1.5px solid var(--nc); color:var(--nc); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:11px; font-weight:900; font-style:italic; font-family:Georgia,serif; padding:0; }
          .stree-info:hover{ background:var(--nc); color:#FFFFFF; }
          .stree-sales{ display:flex; align-items:baseline; justify-content:space-between; gap:8px; font-size:13.5px; font-weight:900; margin-top:6px; padding-top:6px; border-top:1px dashed rgba(12,64,68,0.16); font-variant-numeric:tabular-nums; }
          .stree-sales span{ font-size:10.5px; font-weight:700; color:${subtext}; }
          .stree-since{ font-size:10.5px; color:#7A8987; margin-top:2px; }
          .stree-hl{ animation:streeHl 1.1s ease-in-out 3; }
          @keyframes streeHl{ 0%,100%{ box-shadow:0 0 0 0 rgba(201,154,58,0); } 50%{ box-shadow:0 0 0 6px rgba(201,154,58,0.55); } }

          .stree-pop-overlay{ position:fixed; inset:0; z-index:9998; }
          .stree-pop{ position:fixed; z-index:9999; background:#FFFFFF; border:1.5px solid rgba(12,64,68,0.18); border-radius:20px; padding:18px; box-shadow:0 24px 60px rgba(7,59,63,0.18); overflow-y:auto; box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; animation:streePop .25s cubic-bezier(0.22,1,0.36,1) both; }
          @keyframes streePop{ from{ opacity:0; transform:translateY(8px) scale(0.97); } to{ opacity:1; transform:none; } }
          .stree-pop-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid rgba(12,64,68,0.12); }
          .stree-pop-title{ font-size:11px; color:#0C4044; font-weight:900; letter-spacing:1.8px; }
          .stree-pop-sub{ font-size:9.5px; color:#7A8987; margin-top:2px; }
          .stree-pop-close{ background:rgba(12,64,68,0.08); border:1px solid rgba(12,64,68,0.2); width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; }
          .stree-pop-item{ border:1.5px solid; border-radius:14px; padding:12px 14px; }
          .stree-pop-arrow{ text-align:center; font-weight:900; font-size:15px; line-height:1; padding:5px 0; }
          .stree-pop-foot{ margin-top:12px; padding-top:10px; border-top:1px solid rgba(12,64,68,0.10); font-size:9px; color:#94A3A2; text-align:center; letter-spacing:0.8px; font-weight:600; }

          .hierarchy-zoom-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; height:34px; min-width:34px; padding:0 10px; border-radius:10px; border:1px solid rgba(12,64,68,.24); background:rgba(255,255,255,.92); color:#0C4044; font-size:12px; font-weight:900; cursor:pointer; transition:all .2s ease; font-family:inherit; }
          .hierarchy-zoom-btn:hover{ background:#E6F1EF; border-color:rgba(12,64,68,.42); }
          .hierarchy-zoom-btn:disabled{ opacity:.42; cursor:not-allowed; }
          .hierarchy-zoom-chip{ height:34px; min-width:58px; display:inline-flex; align-items:center; justify-content:center; border-radius:10px; background:#0C4044; color:#FFFFFF; font-size:12px; font-weight:900; }

          @media (max-width: 860px) {
            .sh-page-wrap{ padding:14px 10px 50px !important; }
            .sh-topbar{ flex-direction:column; align-items:stretch; gap:14px; margin-bottom:16px; }
            .sh-controls{ align-items:stretch; }
            .sh-search-wrap{ width:100% !important; }
            .sh-search-results{ left:0; right:auto; width:100%; }
            .sh-canvas{ border-radius:14px; padding:14px 0; min-height:auto; }
            .sh-superadmin-col{ position:static !important; width:100% !important; padding:10px 10px 14px !important; border-bottom:1.5px dashed rgba(12,64,68,0.15); }
            .sh-superadmin-line, .sh-level-labels, .sh-svg-bridge{ display:none !important; }
            .sh-tree-scroll{ padding:16px 8px 30px !important; }
            .hierarchy-zoom-chip{ min-width:48px; }
          }
          @media (max-width: 480px) {
            .otree-card{ min-width:160px; max-width:180px; padding:10px 12px; }
            .otree-name{ font-size:12.5px; }
            .stree-since{ display:none; }
          }
        `}</style>

        <div className="sh-topbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => navigate('/shop-hierarchy-grid')} title="Switch to Grid View"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                <IconSwitchView color="#0C4044" />
              </button>
              <span style={{ color: '#0C4044', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Shop Hierarchy Tree
              </span>
            </div>
            <div style={{ color: subtext, fontSize: 12.5, marginTop: 6 }}>
              {isSuperAdmin ? 'Every shop in the system and the shops they created.' : 'Your shop and every shop created under you.'} Click a card to open its sub-shops.
            </div>
            {tree && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                <div className="sh-chip" style={{ background: 'rgba(12,64,68,0.08)', border: '1px solid rgba(12,64,68,0.3)' }}>
                  <span style={{ color: '#0C4044', fontWeight: 800, fontSize: 13 }}>{stats.total}</span>
                  <span style={{ color: subtext, fontSize: 12, fontWeight: 650 }}>Shops</span>
                </div>
                <div className="sh-chip" style={{ background: TYPE_STYLE.live.bg, border: `1px solid ${TYPE_STYLE.live.border}` }}>
                  <span style={{ color: TYPE_STYLE.live.color, fontWeight: 800, fontSize: 13 }}>{stats.physical}</span>
                  <span style={{ color: subtext, fontSize: 12, fontWeight: 650 }}>Physical</span>
                </div>
                <div className="sh-chip" style={{ background: TYPE_STYLE.virtual.bg, border: `1px solid ${TYPE_STYLE.virtual.border}` }}>
                  <span style={{ color: TYPE_STYLE.virtual.color, fontWeight: 800, fontSize: 13 }}>{stats.virtual}</span>
                  <span style={{ color: subtext, fontSize: 12, fontWeight: 650 }}>Virtual</span>
                </div>
                <div className="sh-chip" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)' }}>
                  <span style={{ color: ACTIVE_COLOR, fontWeight: 800, fontSize: 13 }}>{stats.active}</span>
                  <span style={{ color: subtext, fontSize: 12, fontWeight: 650 }}>Active today</span>
                </div>
                <div className="sh-chip" style={{ background: 'rgba(12,64,68,0.05)', border: '1px solid rgba(12,64,68,0.2)' }}>
                  <span style={{ color: '#0C4044', fontWeight: 800, fontSize: 13 }}>{formatINR(tree.network_sales)}</span>
                  <span style={{ color: subtext, fontSize: 12, fontWeight: 650 }}>Total sales · {tree.network_orders} orders</span>
                </div>
              </div>
            )}
          </div>

          <div className="sh-controls">
            <div className="sh-search-wrap">
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                <IconSearch color={subtext} />
              </span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shop ID, name, owner, phone, city..." className="sh-search-input" />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <IconX color={subtext} />
                </button>
              )}
              {debouncedSearch && (
                <div className="sh-search-results">
                  {searchResults.length === 0 ? (
                    <div style={{ padding: '14px', color: subtext, fontSize: 12.5, textAlign: 'center' }}>No shops match "{search}".</div>
                  ) : searchResults.map(r => (
                    <button key={r.node.shop_id} className="sh-search-item" onClick={() => revealShop(r)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: text }}>{r.node.shop_name}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: levelColor(r.depth) }}>{r.node.shop_id}</span>
                      </div>
                      <div style={{ fontSize: 11, color: subtext, marginTop: 2 }}>
                        Level {r.depth} · {r.chain.map(a => a.shop_name).join(' › ')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div className="sh-zoom-wrap">
                <button className="hierarchy-zoom-btn" onClick={zoomOut} disabled={treeZoom <= 0.3} title="Zoom out"><IconMinus color="currentColor" /></button>
                <span className="hierarchy-zoom-chip">{Math.round(treeZoom * 100)}%</span>
                <button className="hierarchy-zoom-btn" onClick={zoomIn} disabled={treeZoom >= 1.4} title="Zoom in"><IconPlus color="currentColor" /></button>
                <button className="hierarchy-zoom-btn" onClick={fitHierarchy} title="Fit tree on screen"><IconFit color="currentColor" /> Fit</button>
                <button className="hierarchy-zoom-btn" onClick={resetZoom}>Reset</button>
                <button className="hierarchy-zoom-btn" onClick={collapseAll} disabled={!Object.values(openMap).some(Boolean)}>Collapse</button>
              </div>
              <button onClick={() => navigate(isSuperAdmin ? '/super-admin' : '/shop-dashboard')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(220,38,38,0.35)', color: '#DC2626', borderRadius: '10px', padding: '9px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                <IconBack color="#DC2626" /> Back
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: 12, padding: '14px 18px', fontSize: 13, marginBottom: 20 }}>{error}</div>
        )}

        <div ref={treeWrapperRef} className="sh-canvas">
          {/* ── LEFT-TOP: Super Admin (or own root shop) — stays fixed while the tree scrolls right ── */}
          <div className="sh-superadmin-col">
            {tree && rootIsShop ? (
              <div className="otree-card" id={`shop-node-${tree.shop_id}`} data-role="shop-root"
                style={{ '--nc': rootColor, minWidth: 160, maxWidth: 176, cursor: 'default', padding: '10px 12px' }}>
                <button className="stree-info" style={{ '--nc': rootColor }} title="View hierarchy chain"
                  onClick={e => openInfo(e.currentTarget, [tree])}>i</button>
                <div style={{ paddingLeft: 22, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="stree-type" style={{ color: rootColor, borderColor: rootColor, background: '#FFFFFF' }}><IconShield color={rootColor} size={10} /> ROOT SHOP</span>
                </div>
                <div className="otree-id" style={{ color: rootColor }}>{tree.shop_id}</div>
                <div className="otree-name" style={{ fontSize: 12.5, marginBottom: 4 }}>{tree.shop_name}</div>
                <div className="otree-sub" style={{ fontSize: 11 }}><IconPhone color={subtext} /> {tree.mobile_number}</div>
                <div className="stree-sales" style={{ color: rootColor, fontSize: 12 }}>
                  {formatINR(tree.network_sales)}<span>{tree.network_orders} orders</span>
                </div>
                <div className="otree-actions">
                  <button className="otree-btn" style={{ '--nc': rootColor }}
                    onClick={() => setPrintTarget({ node: tree, depth: 1, chain: [tree] })}>
                    <IconPrinter color={rootColor} /> PRINT
                  </button>
                  <button className="otree-btn otree-btn-sales" onClick={() => navigate('/shop-report')}>
                    <IconChart color="#0284C7" /> REPORT
                  </button>
                </div>
              </div>
            ) : (
              <div className="otree-card" data-role="shop-root" style={{ '--nc': rootColor, minWidth: 150, cursor: 'default' }}>
                <div className="stree-type" style={{ color: rootColor, borderColor: rootColor, background: '#FFFFFF', marginBottom: 8 }}>
                  <IconShield color={rootColor} size={10} /> SUPER ADMIN
                </div>
                <div className="otree-name" style={{ fontSize: 12.5, marginBottom: 2 }}>All Shops</div>
                <div style={{ fontSize: 11, color: subtext }}>{topLevel.length} root shop{topLevel.length === 1 ? '' : 's'}</div>
              </div>
            )}
            <div className="sh-superadmin-line" style={{ background: rootColor }} />
          </div>

          {/* ── "Level N" labels beside the left column ── */}
          {!loading && tree && (
            <div className="sh-level-labels">
              {Object.entries(levelTops).map(([d, top]) => (
                <div key={d} style={{ position: 'absolute', top, left: 118, transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: levelColor(Number(d)), letterSpacing: '0.04em', whiteSpace: 'nowrap', background: '#FFFFFF', padding: '0 4px' }}>
                  Level {d}
                </div>
              ))}
            </div>
          )}

          {/* ── bridge: root card → every level-1 card ── */}
          {!loading && tree && rowAnchors.length > 0 && rootAnchor && (() => {
            const farthestX = Math.max(...rowAnchors.map(a => a.x))
            const lc = levelColor(firstDepth)
            return (
              <svg className="sh-svg-bridge">
                <line x1={rootAnchor.x} y1={rootAnchor.y} x2={Math.max(farthestX, rootAnchor.x)} y2={rootAnchor.y} stroke={lc} strokeWidth="2" />
                {rowAnchors.map((a, i) => (
                  <line key={i} x1={a.x} y1={rootAnchor.y} x2={a.x} y2={a.top} stroke={lc} strokeWidth="2" />
                ))}
              </svg>
            )
          })()}

          {loading ? (
            <div className="sh-tree-scroll" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <SkeletonCard color="#16A34A" /><SkeletonCard color="#16A34A" /><SkeletonCard color="#16A34A" />
            </div>
          ) : !tree ? null : topLevel.length === 0 ? (
            <div className="sh-tree-scroll" style={{ color: subtext, fontSize: 13, paddingTop: 90 }}>
              {rootIsShop ? 'No sub-shops created under your shop yet.' : 'No shops yet.'}
            </div>
          ) : (
            <div className="sh-tree-scroll" ref={scrollAreaRef}>
              <div className="otree-children otree-children-root"
                style={{ '--lc': levelColor(firstDepth), minWidth: 'max-content', justifyContent: 'flex-start', transform: `scale(${treeZoom})`, transformOrigin: 'top left', width: `${100 / treeZoom}%` }}>
                {topLevel.map(n => (
                  <div className="otree-item" key={n.shop_id} style={{ paddingTop: 0 }}>
                    <ShopTreeNode
                      node={n} depth={firstDepth} chain={rootChain}
                      parentKey="root" openMap={openMap} onToggle={toggle} onInfo={openInfo}
                      onPrint={(node, depth, chain) => setPrintTarget({ node, depth, chain })}
                      onReport={goReport} highlightId={highlightId}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {chainPopup && <ChainPopup chain={chainPopup.chain} rect={chainPopup.rect} onClose={() => setChainPopup(null)} />}

      {printTarget && (
        <div onClick={() => setPrintTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.55)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 18, width: '100%', maxWidth: 380, padding: 22, boxShadow: '0 30px 70px rgba(17,24,23,0.35)', fontFamily: 'Inter,system-ui,sans-serif' }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, color: levelColor(printTarget.depth) }}>PRINT</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: text, margin: '4px 0 2px' }}>{printTarget.node.shop_name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: subtext, marginBottom: 16 }}>{printTarget.node.shop_id}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="hierarchy-zoom-btn" style={{ height: 42, justifyContent: 'flex-start', padding: '0 14px' }}
                onClick={() => { printShopChain(printTarget.chain); setPrintTarget(null) }}>
                <IconPrinter color="#0C4044" size={14} /> Print shop card (hierarchy chain)
              </button>
              <button className="hierarchy-zoom-btn" style={{ height: 42, justifyContent: 'flex-start', padding: '0 14px' }}
                disabled={!(printTarget.node.children || []).length}
                onClick={() => { printShopTree(printTarget.node, printTarget.depth); setPrintTarget(null) }}>
                <IconPrinter color="#0C4044" size={14} /> Print full sub-shop tree
              </button>
              <button onClick={() => setPrintTarget(null)} style={{ background: 'none', border: 'none', color: subtext, fontSize: 12.5, cursor: 'pointer', marginTop: 4 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
