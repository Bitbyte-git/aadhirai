import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import * as XLSX from 'xlsx'
import { SkeletonCard } from '../components/Skeleton'
import InternalRoleNavbar from '../collection/InternalRoleNavbar'

// ── Shop Report — Sales Report (Report.jsx) oda shop version.
// Sales = shop + adhu create pannina ella sub-shops place pannina orders.
// Network breakdown = shop hierarchy tree (created_by chain), lane style. ──

const TIME_RANGES = ['Today', 'Week', 'Month', 'Year']
const PERIOD_LABEL = { Today: 'today', Week: 'last 7 days', Month: 'last 4 weeks', Year: 'last 12 months' }

// One color per tree depth, same palette as Report.jsx
const LEVEL_COLORS = ['#0E5A57', '#2C4D4B', '#C99A3A', '#7BA7A3', '#B86F74']
const levelColor = depth => LEVEL_COLORS[depth % LEVEL_COLORS.length]

const TYPE_STYLE = {
  live: { label: 'Physical', color: '#0E5A57', bg: 'rgba(14,90,87,0.10)', border: 'rgba(14,90,87,0.35)' },
  virtual: { label: 'Virtual', color: '#8A623D', bg: 'rgba(201,154,58,0.16)', border: 'rgba(201,154,58,0.5)' },
}

const ACCENT = '#0E5A57'
const ACTIVE_COLOR = '#0E5A57'
const INACTIVE_COLOR = '#B86F74'

const formatINR = n => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const IconStore = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1-5h16l1 5" /><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
    <path d="M4 9v10h16V9" /><path d="M9 21v-6h6v6" />
  </svg>
)

const IconEmptyEnd = ({ color, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

function ShopTypeBadge({ type }) {
  const st = TYPE_STYLE[type] || TYPE_STYLE.live
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', border: `1px solid ${st.border}`, background: st.bg, color: st.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {st.label}
    </span>
  )
}

// ── tree helpers ──
function findPath(root, shopId) {
  if (!root || !shopId) return null
  const walk = (node, path) => {
    if (node.shop_id === shopId) return [...path, node]
    for (const c of node.children || []) {
      const r = walk(c, [...path, node])
      if (r) return r
    }
    return null
  }
  return walk(root, [])
}

function flattenTree(root, rootIsVirtual) {
  const rows = []
  const walk = (node, depth, pathNames) => {
    const isVirtualRoot = rootIsVirtual && depth === 0
    const names = isVirtualRoot ? pathNames : [...pathNames, node.shop_name]
    if (!isVirtualRoot) rows.push({ node, depth, path: names.join(' > ') })
    ;(node.children || []).forEach(c => walk(c, isVirtualRoot ? depth : depth + 1, names))
  }
  walk(root, 0, [])
  return rows
}

// ── Simple inline SVG line chart (same as Report.jsx, ₹ tooltip) ──
function TrendLineChart({ buckets, color }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  if (!buckets || buckets.length === 0) {
    return <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B', fontSize: '13px' }}>No trend data</div>
  }
  const width = 700, height = 220, padding = 36
  const max = Math.max(1, ...buckets.map(b => b.total))
  const stepX = (width - padding * 2) / Math.max(1, buckets.length - 1)

  const points = buckets.map((b, i) => ({
    x: padding + i * stepX,
    y: height - padding - (b.total / max) * (height - padding * 2),
    ...b,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
  const hp = hoverIdx !== null ? points[hoverIdx] : null
  const tipX = hp ? Math.min(Math.max(hp.x - 60, 4), width - 124) : 0
  const tipY = hp ? Math.max(hp.y - 46, 4) : 0

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '220px', overflow: 'visible' }}>
      <defs>
        <linearGradient id="shopTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i}
          x1={padding} x2={width - padding}
          y1={height - padding - f * (height - padding * 2)}
          y2={height - padding - f * (height - padding * 2)}
          stroke="rgba(14,90,87,0.10)" strokeWidth="1" />
      ))}
      <path d={areaD} fill="url(#shopTrendFill)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" />

      {points.map((p, i) => (
        <rect key={`hz-${i}`} x={p.x - stepX / 2} y={0} width={stepX} height={height}
          fill="transparent"
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)} />
      ))}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={hoverIdx === i ? 6 : 4} fill={color} style={{ pointerEvents: 'none' }} />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={height - 10} fontSize="11" fill="#6B6B6B" textAnchor="middle">{p.label}</text>
      ))}

      {hp && (
        <g style={{ pointerEvents: 'none' }}>
          <line x1={hp.x} x2={hp.x} y1={padding} y2={height - padding} stroke={color} strokeOpacity="0.3" strokeDasharray="3 3" />
          <rect x={tipX} y={tipY} width="120" height="38" rx="8" fill="#FFFCF8" stroke={color} strokeOpacity="0.5" />
          <text x={tipX + 10} y={tipY + 16} fontSize="11" fontWeight="700" fill={color}>{formatINR(hp.total)}</text>
          <text x={tipX + 10} y={tipY + 30} fontSize="10" fill="#6B6B6B">{hp.count || 0} orders</text>
        </g>
      )}
    </svg>
  )
}

// ── Shop hierarchy tree as lanes — top lane = root's children, card click
// opens that shop's sub-shops lane below + scopes the whole report to it ──
function ShopNetworkGrid({ tree, loading, selChain, onSelectAt, scopedShopId, text, subtext, periodLabel }) {
  const laneRefs = useRef({})
  const scrollLane = (depthIdx, dir) => {
    const el = laneRefs.current[depthIdx]
    if (el) el.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  if (loading && !tree) {
    return (
      <div style={{ display: 'flex', gap: '12px' }}>
        <SkeletonCard color={ACCENT} /><SkeletonCard color={ACCENT} /><SkeletonCard color={ACCENT} />
      </div>
    )
  }
  if (!tree) return null

  const lanes = []
  let items = tree.children || []
  let depth = 0
  while (true) {
    lanes.push({ items, depth })
    const selNode = items.find(n => n.shop_id === selChain[depth])
    if (!selNode) break
    items = selNode.children || []
    depth++
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', opacity: loading ? 0.6 : 1, transition: 'opacity .15s ease' }}>
      {lanes.map(lane => {
        const laneColor = levelColor(lane.depth)
        const depthIdx = lane.depth
        return (
          <div key={depthIdx} style={{ minWidth: 0, maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.2px', color: subtext, textTransform: 'uppercase' }}>
                Level {depthIdx + 1} · Sub-shops {lane.items.length}
              </div>
              {lane.items.length > 2 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => scrollLane(depthIdx, -1)} className="sr-lane-arrow" style={{ '--nc': laneColor }} aria-label="Scroll left">‹</button>
                  <button onClick={() => scrollLane(depthIdx, 1)} className="sr-lane-arrow" style={{ '--nc': laneColor }} aria-label="Scroll right">›</button>
                </div>
              )}
            </div>
            <div className="sr-lane-track" ref={el => { laneRefs.current[depthIdx] = el }} style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '14px' }}>
              {lane.items.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', border: `1.5px dashed ${laneColor}`, borderRadius: '14px', opacity: 0.85 }}>
                  <IconEmptyEnd color={laneColor} />
                  <span style={{ color: subtext, fontSize: '12.5px', fontWeight: 600 }}>No sub-shops under this one.</span>
                </div>
              ) : lane.items.map(node => {
                const active = selChain[depthIdx] === node.shop_id
                const isDim = selChain[depthIdx] && !active
                const isScoped = scopedShopId === node.shop_id
                return (
                  <div
                    className="report-lane-card" key={node.shop_id}
                    onClick={() => onSelectAt(depthIdx, node)}
                    title={`Show report for ${node.shop_name}`}
                    style={{
                      minWidth: '186px', maxWidth: '220px', flexShrink: 0, cursor: 'pointer',
                      background: 'linear-gradient(145deg,#FFFFFF,#FFFCF8)',
                      border: `1.5px solid ${laneColor}`, borderRadius: '14px', padding: '13px 16px',
                      opacity: isDim ? 0.45 : 1,
                      boxShadow: isScoped ? '0 0 0 2px #C99A3A, 0 16px 32px rgba(14,90,87,0.16)' : (active ? `0 0 0 1.5px ${laneColor}, 0 14px 28px rgba(14,90,87,0.14)` : '0 10px 22px rgba(14,90,87,0.07)'),
                      transition: 'opacity .15s ease, box-shadow .15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '7px' }}>
                      <ShopTypeBadge type={node.shop_type} />
                      <span title={node.active_today ? 'Logged in today' : 'Not logged in today'} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 800, color: node.active_today ? ACTIVE_COLOR : INACTIVE_COLOR }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: node.active_today ? ACTIVE_COLOR : INACTIVE_COLOR }} />
                        {node.active_today ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: laneColor, marginBottom: '4px' }}>{node.shop_id}</div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: text, marginBottom: '5px' }}>{node.shop_name}</div>
                    {node.owner_name && <div style={{ fontSize: '11px', color: subtext, marginBottom: '2px' }}>{node.owner_name}</div>}
                    {node.mobile_number && <div style={{ fontSize: '11px', color: subtext, marginBottom: '2px' }}>{node.mobile_number}</div>}
                    {node.city && <div style={{ fontSize: '11px', color: subtext }}>{node.city}</div>}
                    <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 800, color: laneColor, fontVariantNumeric: 'tabular-nums' }}>{formatINR(node.network_sales)}</div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: subtext }} title={periodLabel}>
                      {node.network_orders} order{node.network_orders === 1 ? '' : 's'}
                      {node.own_orders !== node.network_orders && <> · own {node.own_orders}</>}
                    </div>
                    {node.descendant_count > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 800, color: laneColor }}>
                        {node.descendant_count} sub-shop{node.descendant_count === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ height: '3px', borderRadius: '3px', background: laneColor, opacity: 0.55, margin: '0 4px 22px 4px' }} />
          </div>
        )
      })}
    </div>
  )
}

function LoginStatusPie({ activeCount, inactiveCount, scopeLabel, cardBg, border, text, subtext, onClickActive, onClickInactive }) {
  const total = activeCount + inactiveCount
  const activeFrac = total > 0 ? activeCount / total : 0
  const size = 170, stroke = 26, r = (size - stroke) / 2, c = 2 * Math.PI * r
  const activeLen = c * activeFrac

  return (
    <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <div className="report-section-title" style={{ fontSize: '11px', fontWeight: 800, color: ACCENT, letterSpacing: '1px', alignSelf: 'flex-start' }}>
        SHOP LOGIN TODAY
      </div>
      <div style={{ fontSize: '11px', color: subtext, alignSelf: 'flex-start', marginTop: '-8px' }}>
        {scopeLabel}
      </div>

      {total === 0 ? (
        <div style={{ color: subtext, fontSize: '13px', padding: '30px 0' }}>No data</div>
      ) : (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={INACTIVE_COLOR} strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ACTIVE_COLOR} strokeWidth={stroke}
            strokeDasharray={`${activeLen} ${c - activeLen}`}
            strokeDashoffset={c / 4}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
          <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill={text}>{total}</text>
          <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fontSize="10" fill={subtext}>total shops</text>
        </svg>
      )}

      <div style={{ display: 'flex', gap: '18px' }}>
        <button onClick={onClickActive} className="sr-legend-btn" style={{ color: ACTIVE_COLOR }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: ACTIVE_COLOR }} /> Active {activeCount}
        </button>
        <button onClick={onClickInactive} className="sr-legend-btn" style={{ color: INACTIVE_COLOR }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: INACTIVE_COLOR }} /> Inactive {inactiveCount}
        </button>
      </div>
    </div>
  )
}

function ShopTypePie({ physical, virtual, scopeLabel, cardBg, border, text, subtext }) {
  const total = physical + virtual
  const size = 170, stroke = 26, r = (size - stroke) / 2, c = 2 * Math.PI * r
  const physLen = total > 0 ? c * (physical / total) : 0

  return (
    <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <div className="report-section-title" style={{ fontSize: '11px', fontWeight: 800, color: ACCENT, letterSpacing: '1px', alignSelf: 'flex-start' }}>
        SHOP TYPES
      </div>
      <div style={{ fontSize: '11px', color: subtext, alignSelf: 'flex-start', marginTop: '-8px' }}>
        {scopeLabel}
      </div>
      {total === 0 ? (
        <div style={{ color: subtext, fontSize: '13px', padding: '30px 0' }}>No shops</div>
      ) : (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TYPE_STYLE.virtual.color} strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TYPE_STYLE.live.color} strokeWidth={stroke}
            strokeDasharray={`${physLen} ${c - physLen}`}
            strokeDashoffset={c / 4}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
          <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill={text}>{total}</text>
          <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fontSize="10" fill={subtext}>shops</text>
        </svg>
      )}
      <div style={{ display: 'flex', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: TYPE_STYLE.live.color }} />
          <span style={{ color: TYPE_STYLE.live.color, fontWeight: 700, fontSize: '12px' }}>Physical {physical}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: TYPE_STYLE.virtual.color }} />
          <span style={{ color: TYPE_STYLE.virtual.color, fontWeight: 700, fontSize: '12px' }}>Virtual {virtual}</span>
        </div>
      </div>
    </div>
  )
}

const COIN_LABELS = { gold_22k: 'Gold 22K', gold_24k: 'Gold 24K', silver_999: 'Silver 999' }
const COIN_COLORS = { gold_22k: '#C99A3A', gold_24k: '#D6B45F', silver_999: '#9AA5A4' }

function CoinStockPie({ stock, scopeLabel, cardBg, border, text, subtext }) {
  const total = stock.reduce((s, item) => s + item.qty, 0)
  const size = 170, stroke = 26, r = (size - stroke) / 2, c = 2 * Math.PI * r

  const grouped = ['gold_22k', 'gold_24k', 'silver_999'].map(m => ({
    metal: m,
    qty: stock.filter(s => s.metal_type === m).reduce((sum, s) => sum + s.qty, 0),
  })).filter(g => g.qty > 0)

  let offset = 0
  const segments = grouped.map(g => {
    const len = total > 0 ? c * (g.qty / total) : 0
    const seg = { ...g, len, offset }
    offset += len
    return seg
  })

  return (
    <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <div className="report-section-title" style={{ fontSize: '11px', fontWeight: 800, color: ACCENT, letterSpacing: '1px', alignSelf: 'flex-start' }}>
        COIN STOCK
      </div>
      <div style={{ fontSize: '11px', color: subtext, alignSelf: 'flex-start', marginTop: '-8px' }}>
        {scopeLabel}
      </div>

      {total === 0 ? (
        <div style={{ color: subtext, fontSize: '13px', padding: '30px 0' }}>No stock</div>
      ) : (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map(seg => (
            <circle
              key={seg.metal}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={COIN_COLORS[seg.metal]} strokeWidth={stroke}
              strokeDasharray={`${seg.len} ${c - seg.len}`}
              strokeDashoffset={-seg.offset + c / 4}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          ))}
          <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill={text}>{total}</text>
          <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fontSize="10" fill={subtext}>total coins</text>
        </svg>
      )}

      {grouped.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          {grouped.map(g => (
            <div key={g.metal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: COIN_COLORS[g.metal] }} />
                <span style={{ color: COIN_COLORS[g.metal], fontWeight: 700, fontSize: '12px' }}>{COIN_LABELS[g.metal]}</span>
              </div>
              <span style={{ color: text, fontWeight: 700, fontSize: '12px' }}>{g.qty}</span>
            </div>
          ))}
        </div>
      )}

      {stock.length > 0 && (
        <div style={{ width: '100%', borderTop: `1px solid ${border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {stock.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: subtext }}>{COIN_LABELS[item.metal_type]} = {item.weight_label}</span>
              <span style={{ color: COIN_COLORS[item.metal_type], fontWeight: 700 }}>{item.qty}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LoginListModal({ kind, list, scopeLabel, onClose, subtext, border }) {
  const color = kind === 'active' ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <div className="no-print" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.55)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFFCF8', border: `1px solid ${border}`, borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.35)' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ color, fontWeight: 900, fontSize: '14px', letterSpacing: '0.06em' }}>{kind === 'active' ? 'ACTIVE' : 'INACTIVE'} SHOPS TODAY · {list.length}</div>
            <div style={{ color: subtext, fontSize: '11px', marginTop: '3px' }}>{scopeLabel}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${border}`, color: subtext, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {list.length === 0 ? (
            <div style={{ textAlign: 'center', color: subtext, padding: '40px 0', fontSize: '13px' }}>No shops here.</div>
          ) : list.map(s => (
            <div key={s.shop_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${border}`, borderLeft: `4px solid ${color}`, borderRadius: '12px', padding: '10px 14px', background: '#FFFFFF' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#1F1F1F' }}>{s.shop_name}</div>
                <div style={{ fontSize: '11px', color: subtext }}>{s.owner_name}{s.city ? ` · ${s.city}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color }}>{s.shop_id}</div>
                <div style={{ fontSize: '11px', color: subtext }}>{s.mobile_number}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ShopReport() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const isSuperAdmin = role === 'super_admin'

  const [timeRange, setTimeRange] = useState('Week')
  const [tree, setTree] = useState(null)
  const [treeLoading, setTreeLoading] = useState(true)
  const [error, setError] = useState('')

  // selChain = drill-down path of shop_ids in the lane grid; scopedShopId = shop the stats are scoped to
  const [selChain, setSelChain] = useState([])
  const [scopedShopId, setScopedShopId] = useState(null)

  const [summaryData, setSummaryData] = useState({ total_sales: 0, total_orders: 0, shops_with_orders: 0, total_shops: 0, physical_count: 0, virtual_count: 0 })
  const [trendData, setTrendData] = useState([])
  const [trendLoading, setTrendLoading] = useState(true)
  const [loginStats, setLoginStats] = useState({ active: [], inactive: [] })
  const [coinStock, setCoinStock] = useState([])
  const [loginModal, setLoginModal] = useState(null)
  const [exporting, setExporting] = useState(false)

  const bg = 'linear-gradient(180deg,#E6F1EF 0%,#FFFCF8 38%,#FFFFFF 100%)'
  const text = '#1F1F1F'
  const subtext = '#5F6464'
  const border = 'rgba(14,90,87,0.16)'
  const cardBg = 'linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,252,248,0.90))'

  const period = timeRange.toLowerCase()

  // ── scopedNode always read from the latest tree, so period switch updates card numbers too ──
  const scopedPath = useMemo(() => findPath(tree, scopedShopId), [tree, scopedShopId])
  const scopedNode = scopedPath ? scopedPath[scopedPath.length - 1] : null
  const rootLabel = tree ? (tree.shop_id ? tree.shop_name : 'All Shops') : ''
  const scopeLabel = scopedNode ? `Shop: ${scopedNode.shop_name}` : (isSuperAdmin ? 'All Shops' : `Full Network · ${rootLabel}`)

  const scopeParams = useMemo(() => {
    const p = { period }
    if (scopedShopId) p.shop_id = scopedShopId
    return p
  }, [period, scopedShopId])

  // ── Tree (hierarchy + per-shop sales for the period) ──
  useEffect(() => {
    let cancelled = false
    setTreeLoading(true)
    api.get('/shop-report/tree/', { params: { period } })
      .then(res => { if (!cancelled) { setTree(res.data.tree); setError('') } })
      .catch(() => { if (!cancelled) setError('Failed to load shop report') })
      .finally(() => { if (!cancelled) setTreeLoading(false) })
    return () => { cancelled = true }
  }, [period])

  // ── Deep link from the Shop Hierarchy Tree (?shop=BBJS...) — scope to that shop once the tree is in ──
  const [searchParams] = useSearchParams()
  const deepLinkDone = useRef(false)
  useEffect(() => {
    if (!tree || deepLinkDone.current) return
    deepLinkDone.current = true
    const target = searchParams.get('shop')
    if (!target || target === tree.shop_id) return
    const path = findPath(tree, target)
    if (!path) return
    setScopedShopId(target)
    setSelChain(path.slice(1).map(n => n.shop_id))
  }, [tree, searchParams])

  // ── Summary cards ──
  useEffect(() => {
    let cancelled = false
    api.get('/shop-report/summary/', { params: scopeParams })
      .then(res => { if (!cancelled) setSummaryData(res.data) })
      .catch(() => { })
    return () => { cancelled = true }
  }, [scopeParams])

  // ── Trend graph ──
  useEffect(() => {
    let cancelled = false
    setTrendLoading(true)
    api.get('/shop-report/trend/', { params: scopeParams })
      .then(res => { if (!cancelled) setTrendData(res.data.data || []) })
      .catch(() => { if (!cancelled) setTrendData([]) })
      .finally(() => { if (!cancelled) setTrendLoading(false) })
    return () => { cancelled = true }
  }, [scopeParams])

  // ── Login status (not period based) ──
  useEffect(() => {
    let cancelled = false
    const params = scopedShopId ? { shop_id: scopedShopId } : {}
    api.get('/shop-report/login-status/', { params })
      .then(res => { if (!cancelled) setLoginStats({ active: res.data.active || [], inactive: res.data.inactive || [] }) })
      .catch(() => { if (!cancelled) setLoginStats({ active: [], inactive: [] }) })
    return () => { cancelled = true }
  }, [scopedShopId])

  // ── Coin stock — scoped shop or own account ──
  const scopedUserId = scopedNode?.user_id
  useEffect(() => {
    let cancelled = false
    const req = scopedUserId
      ? api.get('/coin-stock/for-user/', { params: { user_id: scopedUserId } })
      : api.get('/coin-stock/')
    req.then(res => { if (!cancelled) setCoinStock(Array.isArray(res.data) ? res.data : []) })
      .catch(() => { if (!cancelled) setCoinStock([]) })
    return () => { cancelled = true }
  }, [scopedUserId])

  const selectAt = (depthIdx, node) => {
    setScopedShopId(node.shop_id)
    setSelChain(prev => { const next = prev.slice(0, depthIdx); next[depthIdx] = node.shop_id; return next })
  }

  // breadcrumb click — jump the scope back up to that shop (or the root)
  const jumpTo = idx => {
    if (idx < 0) { setScopedShopId(null); setSelChain([]); return }
    const target = breadcrumb[idx]
    setScopedShopId(target.shop_id)
    setSelChain(selChain.slice(0, idx + 1))
  }

  const clearScope = () => { setScopedShopId(null); setSelChain([]) }

  // breadcrumb = selected lane path (excludes the tree root)
  const breadcrumb = useMemo(() => {
    if (!tree) return []
    const out = []
    let items = tree.children || []
    for (const id of selChain) {
      const n = items.find(x => x.shop_id === id)
      if (!n) break
      out.push(n)
      items = n.children || []
    }
    return out
  }, [tree, selChain])

  const handleExportExcel = async () => {
    if (!tree) return
    setExporting(true)
    try {
      const exportRoot = scopedNode || tree
      const rows = flattenTree(exportRoot, !exportRoot.shop_id)
      const wb = XLSX.utils.book_new()

      const summaryRows = [
        [`Shop Report - ${scopeLabel}`],
        [],
        ['Generated On', new Date().toLocaleString('en-IN')],
        ['Generated By', isSuperAdmin ? 'Super Admin' : rootLabel],
        ['Period', `${timeRange} (${PERIOD_LABEL[timeRange]})`],
        [],
        ['Metric', 'Value'],
        ['Total Sales', summaryData.total_sales],
        ['Total Orders', summaryData.total_orders],
        ['Shops with Orders', summaryData.shops_with_orders],
        ['Total Shops', summaryData.total_shops],
        ['Physical Shops', summaryData.physical_count],
        ['Virtual Shops', summaryData.virtual_count],
        ['Active Today', loginStats.active.length],
        ['Inactive Today', loginStats.inactive.length],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
      summarySheet['!cols'] = [{ wch: 22 }, { wch: 40 }]
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

      const trendSheet = XLSX.utils.aoa_to_sheet([
        ['Period', 'Orders', 'Sales Amount'],
        ...trendData.map(b => [b.label, b.count || 0, b.total]),
      ])
      trendSheet['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 16 }]
      XLSX.utils.book_append_sheet(wb, trendSheet, 'Sales Trend')

      const networkHeader = ['Level', 'Hierarchy Path', 'Shop ID', 'Shop Name', 'Type', 'Owner', 'Mobile', 'City', 'Active Today', 'Sub-shops', 'Own Orders', 'Own Sales', 'Network Orders', 'Network Sales']
      const networkSheet = XLSX.utils.aoa_to_sheet([
        networkHeader,
        ...rows.map(({ node, depth, path }) => [
          depth + 1, path, node.shop_id, node.shop_name,
          node.shop_type === 'virtual' ? 'Virtual' : 'Physical',
          node.owner_name || '', node.mobile_number || '', node.city || '',
          node.active_today ? 'Yes' : 'No', node.descendant_count,
          node.own_orders, node.own_sales, node.network_orders, node.network_sales,
        ]),
      ])
      networkSheet['!cols'] = [{ wch: 6 }, { wch: 44 }, { wch: 16 }, { wch: 24 }, { wch: 10 }, { wch: 20 }, { wch: 13 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 11 }, { wch: 13 }, { wch: 15 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, networkSheet, 'Shop Network')

      const loginRows = [['Status', 'Shop ID', 'Shop Name', 'Owner', 'Mobile', 'City']]
      loginStats.active.forEach(s => loginRows.push(['Active', s.shop_id, s.shop_name, s.owner_name, s.mobile_number, s.city]))
      loginStats.inactive.forEach(s => loginRows.push(['Inactive', s.shop_id, s.shop_name, s.owner_name, s.mobile_number, s.city]))
      const loginSheet = XLSX.utils.aoa_to_sheet(loginRows)
      loginSheet['!cols'] = [{ wch: 10 }, { wch: 16 }, { wch: 24 }, { wch: 20 }, { wch: 13 }, { wch: 16 }]
      XLSX.utils.book_append_sheet(wb, loginSheet, 'Login Today')

      XLSX.writeFile(wb, `Shop_Report_${(scopedNode?.shop_id || (isSuperAdmin ? 'all' : tree.shop_id))}_${timeRange}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  const handleLogout = () => { localStorage.clear(); navigate('/login') }

  return (
    <div className="sales-report-page" style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', background: bg, color: text, fontFamily: '"Manrope", "Segoe UI", system-ui, sans-serif', boxSizing: 'border-box' }}>
      {!isSuperAdmin && (
        <div className="no-print">
          <InternalRoleNavbar
            roleTitle="SHOP"
            homePath="/shop-dashboard"
            managementItems={[
              { label: 'Dashboard', path: '/shop-dashboard' },
              { label: 'Create Shop', path: '/add-shop' },
              { label: 'My Network', path: '/shop-hierarchy-grid' },
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
        </div>
      )}

      <style>{`
        html,body{overflow-x:hidden!important;max-width:100vw!important;}
        .sales-report-page{position:relative;overflow-x:hidden;width:100%;max-width:100vw;box-sizing:border-box;}
        .sales-report-page *{min-width:0;box-sizing:border-box;}
        .sr-lane-track{min-width:0!important;max-width:100%!important;}
        .sales-report-page::before{content:"";position:fixed;inset:0;background:radial-gradient(circle at 8% 0%,rgba(230,241,239,.95),transparent 34%),radial-gradient(circle at 92% 8%,rgba(201,154,58,.10),transparent 26%);pointer-events:none;z-index:0;}
        .sales-report-page > *{position:relative;z-index:1;}
        .report-control,.report-action{min-height:44px !important;border-radius:14px !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 12px 24px rgba(14,90,87,.08) !important;}
        .print-card{position:relative;overflow:hidden;background:linear-gradient(145deg,#FFFFFF 0%,#FFFCF8 56%,#F2FAF8 100%) !important;border:1px solid rgba(14,90,87,.15) !important;border-radius:22px !important;box-shadow:0 24px 58px rgba(14,90,87,.12),inset 0 1px 0 rgba(255,255,255,.98) !important;}
        .print-card::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 8% 0%,rgba(230,241,239,.8),transparent 32%);pointer-events:none;}
        .print-card > *{position:relative;z-index:1;}
        .report-kpi-value{color:#1F1F1F;text-shadow:0 8px 20px rgba(14,90,87,.10);}
        .report-section-title{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border-radius:10px;background:rgba(230,241,239,.88);border:1px solid rgba(14,90,87,.08);color:#0E5A57 !important;font-size:13px !important;font-weight:900 !important;letter-spacing:.06em;text-transform:uppercase;}
        .report-lane-card{background:linear-gradient(145deg,#FFFFFF,#FFFCF8) !important;border-radius:14px !important;box-shadow:0 14px 30px rgba(14,90,87,.08),inset 0 1px 0 rgba(255,255,255,.96) !important;}
        .sr-legend-btn{display:inline-flex;align-items:center;gap:6px;background:none;border:none;padding:0;cursor:pointer;font-weight:700;font-size:12px;font-family:inherit;}
        .sr-legend-btn:hover{text-decoration:underline;}
        .sr-crumb{background:none;border:none;padding:0;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;color:#0E5A57;}
        .sr-crumb:hover{text-decoration:underline;}
        .sr-crumb[data-current="true"]{color:#1F1F1F;cursor:default;text-decoration:none;}
        @media print {
          .no-print { display: none !important; }
          body { background: #FFFCF8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-container { color: #1F1F1F !important; background: #FFFCF8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-card {
            background: #FFFFFF !important;
            border: 1px solid rgba(14,90,87,0.16) !important;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { size: landscape; margin: 8mm; }
          .sr-main-container { flex-direction: column !important; }
          .sr-sidebar { width: 100% !important; position: static !important; display: grid !important; grid-template-columns: repeat(3, 1fr) !important; }
          .sr-kpi-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .sr-lane-track { overflow-x: visible !important; flex-wrap: wrap !important; }
          .sr-lane-arrow { display: none !important; }
          .report-lane-card { min-width: 160px !important; max-width: 200px !important; }
          .sales-report-page .print-card:has(svg) { break-inside: auto !important; page-break-inside: auto !important; }
        }
        @media(max-width:900px){
          .sr-main-container{flex-direction:column!important}
          .sr-sidebar{width:100%!important;position:static!important;display:grid!important;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))!important;gap:16px!important}
          .print-container{padding:20px 16px!important}
          .report-topbar{padding:20px 16px 0!important}
        }
        @media(max-width:640px){
          .sr-topbar{flex-direction:column;align-items:stretch!important}
          .print-container{padding:16px 12px!important}
          .report-topbar{padding:16px 12px 0!important}
          .print-card{padding:18px 14px!important;border-radius:16px!important}
          .sr-actions-wrap{display:grid!important;grid-template-columns:1fr 1fr;width:100%;gap:8px!important}
          .sr-actions-wrap > button:last-child{grid-column:1 / -1}
          .sr-kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
          .report-kpi-value{font-size:20px!important}
          .sr-sidebar{grid-template-columns:1fr!important}
          .sr-range-row{width:100%;display:grid!important;grid-template-columns:repeat(4,1fr)}
        }
        .sr-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;margin-bottom:28px}
        .sr-lane-track{
          -webkit-overflow-scrolling:touch!important;
          touch-action:pan-x!important;
          overscroll-behavior-x:contain;
          scroll-snap-type:x proximity;
        }
        .sr-lane-track .report-lane-card{ scroll-snap-align:start; }
        @media(max-width:640px){
          .sr-lane-track{gap:10px!important}
          .report-lane-card{min-width:156px!important;max-width:180px!important;padding:11px 13px!important}
        }
        .report-topbar{ position: relative !important; z-index: 5 !important; }
        .sr-actions-wrap{ position: relative !important; z-index: 5 !important; }
        .print-container{ position: relative !important; z-index: 1 !important; }
        .sr-lane-arrow{
          width:26px;height:26px;border-radius:50%;
          background:#FFFFFF;border:1.5px solid var(--nc);color:var(--nc);
          font-size:16px;font-weight:900;cursor:pointer;
          display:flex;align-items:center;justify-content:center;line-height:1;
          transition:background .15s ease,color .15s ease;
        }
        .sr-lane-arrow:hover,.sr-lane-arrow:active{background:var(--nc);color:#FFFFFF;}
      `}</style>

      {/* Page toolbar */}
      <div className="no-print report-topbar sr-topbar" style={{ padding: '24px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', maxWidth: '1500px', margin: '0 auto' }}>
        <button
          onClick={clearScope}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700, fontSize: '18px', color: ACCENT, display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}
          title="Back to full network"
        >
          <IconStore color={ACCENT} />
          {isSuperAdmin ? 'Super Admin' : 'Shop'} - Shop Report
        </button>

        <div className="sr-actions-wrap" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleExportExcel} disabled={!tree || exporting}
            style={{ background: 'linear-gradient(145deg,rgba(14,90,87,0.12),rgba(230,241,239,0.74))', border: '1px solid rgba(14,90,87,0.28)', color: ACCENT, borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: tree && !exporting ? 'pointer' : 'not-allowed', opacity: tree && !exporting ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2">
              <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button onClick={() => window.print()}
            style={{ background: 'linear-gradient(145deg,rgba(184,111,116,0.12),rgba(255,252,248,0.88))', border: '1px solid rgba(184,111,116,0.28)', color: INACTIVE_COLOR, borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INACTIVE_COLOR} strokeWidth="2">
              <path d="M6 3h9l5 5v13H6z" strokeLinejoin="round" />
              <path d="M15 3v5h5" strokeLinejoin="round" />
              <path d="M9 13h6M9 16h6M9 10h2" strokeLinecap="round" />
            </svg>
            Export PDF
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: `1px solid ${border}`, color: subtext, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}
          >Back</button>
        </div>
      </div>

      <div className="print-container sr-main-container" style={{ padding: '32px 40px', maxWidth: '1500px', margin: '0 auto', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        <div style={{ flex: '1 1 0%', minWidth: 0 }}>

          {error && (
            <div style={{ background: 'rgba(184,111,116,0.10)', border: '1px solid rgba(184,111,116,0.35)', color: INACTIVE_COLOR, borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
          )}

          {/* Scope bar — hierarchy breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', background: cardBg, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 16px' }}>
            <span style={{ color: subtext, fontSize: '12px' }}>Showing data for</span>
            <button className="sr-crumb" data-current={!scopedNode} onClick={() => jumpTo(-1)}>{rootLabel || '...'}</button>
            {breadcrumb.map((n, i) => (
              <span key={n.shop_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: subtext, fontSize: '12px' }}>›</span>
                <button className="sr-crumb" data-current={n.shop_id === scopedShopId} onClick={() => jumpTo(i)}>{n.shop_name}</button>
              </span>
            ))}
            <span style={{ color: subtext, fontSize: '11px' }}>· {PERIOD_LABEL[timeRange]}</span>
            {scopedNode && (
              <button className="no-print" onClick={clearScope}
                style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${border}`, color: subtext, borderRadius: '8px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                Clear
              </button>
            )}
          </div>

          {/* Summary cards */}
          <div className="sr-kpi-grid">
            {[
              ['Total sales', formatINR(summaryData.total_sales)],
              ['Total orders', summaryData.total_orders],
              ['Shops with orders', summaryData.shops_with_orders],
              ['Shops in network', summaryData.total_shops],
            ].map(([label, value]) => (
              <div key={label} className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '18px 20px' }}>
                <div style={{ color: subtext, fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div className="report-kpi-value" style={{ fontSize: '24px', fontWeight: 900, lineHeight: 1.2, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div className="report-section-title">Sales trend</div>
              <div className="sr-range-row" style={{ display: 'flex', gap: '6px' }}>
                {TIME_RANGES.map(r => (
                  <button key={r} onClick={() => setTimeRange(r)}
                    style={{
                      background: timeRange === r ? ACCENT : 'transparent',
                      color: timeRange === r ? '#FFFCF8' : subtext,
                      border: `1px solid ${timeRange === r ? ACCENT : border}`,
                      borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                    }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {trendLoading ? (
              <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '0 20px 10px' }}>
                {[0.5, 0.8, 0.4, 0.9, 0.6, 0.7, 0.3].map((h, i) => (
                  <div key={i} className="skel-line" style={{ flex: 1, height: `${h * 180}px`, marginBottom: 0, borderRadius: '6px 6px 0 0' }} />
                ))}
              </div>
            ) : (
              <TrendLineChart buckets={trendData} color={ACCENT} />
            )}
          </div>

          {/* Shop hierarchy tree */}
          <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '24px 28px', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
              <div className="report-section-title">Shop network</div>
              <div style={{ fontSize: '11px', color: subtext }}>Click a shop to see its report and sub-shops · sales for {PERIOD_LABEL[timeRange]}</div>
            </div>

            {tree && (
              <div
                onClick={clearScope}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(14,90,87,0.07)', border: `1.5px solid ${ACCENT}`, borderRadius: '12px', padding: '10px 16px', marginBottom: '18px', cursor: 'pointer', boxShadow: !scopedNode ? '0 0 0 2px #C99A3A' : 'none', maxWidth: '100%', flexWrap: 'wrap' }}
                title="Show full network"
              >
                <IconStore color={ACCENT} size={18} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.4, color: ACCENT }}>{tree.shop_id ? 'ROOT SHOP · FULL NETWORK' : 'ALL ROOT SHOPS'}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: text, marginTop: 2 }}>{tree.shop_name}</div>
                  {tree.shop_id && <div style={{ fontSize: 11, color: subtext, marginTop: 1 }}>{tree.owner_name} · {tree.shop_id}</div>}
                </div>
                {tree.shop_id && <ShopTypeBadge type={tree.shop_type} />}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{formatINR(tree.network_sales)}</div>
                  <div style={{ fontSize: 10.5, color: subtext, fontWeight: 700 }}>{tree.network_orders} orders · {tree.descendant_count} sub-shops</div>
                </div>
              </div>
            )}

            <ShopNetworkGrid
              tree={tree}
              loading={treeLoading}
              selChain={selChain}
              onSelectAt={selectAt}
              scopedShopId={scopedShopId}
              text={text}
              subtext={subtext}
              periodLabel={PERIOD_LABEL[timeRange]}
            />
          </div>
        </div>

        {/* RIGHT: Login status + shop types + coin stock */}
        <div className="sr-sidebar" style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <LoginStatusPie
            activeCount={loginStats.active.length}
            inactiveCount={loginStats.inactive.length}
            scopeLabel={scopeLabel}
            cardBg={cardBg} border={border} text={text} subtext={subtext}
            onClickActive={() => setLoginModal('active')}
            onClickInactive={() => setLoginModal('inactive')}
          />
          <ShopTypePie
            physical={summaryData.physical_count}
            virtual={summaryData.virtual_count}
            scopeLabel={scopeLabel}
            cardBg={cardBg} border={border} text={text} subtext={subtext}
          />
          <CoinStockPie
            stock={coinStock}
            scopeLabel={scopedNode ? scopeLabel : 'My own stock'}
            cardBg={cardBg} border={border} text={text} subtext={subtext}
          />
        </div>
      </div>

      {loginModal && (
        <LoginListModal
          kind={loginModal}
          list={loginModal === 'active' ? loginStats.active : loginStats.inactive}
          scopeLabel={scopeLabel}
          onClose={() => setLoginModal(null)}
          subtext={subtext}
          border={border}
        />
      )}
    </div>
  )
}
