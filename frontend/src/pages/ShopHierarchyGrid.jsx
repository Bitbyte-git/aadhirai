import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import InternalRoleNavbar from '../collection/InternalRoleNavbar'

const TYPE_STYLE = {
  live: { label: 'Physical Shop', bg: 'rgba(12,64,68,0.10)', border: 'rgba(12,64,68,0.38)', color: '#0C4044' },
  virtual: { label: 'Virtual Shop', bg: 'rgba(204,168,129,0.18)', border: 'rgba(204,168,129,0.5)', color: '#8A623D' },
}

function ShopTypeBadge({ type }) {
  const st = TYPE_STYLE[type] || TYPE_STYLE.live
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: st.bg, border: `1px solid ${st.border}`, color: st.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {st.label}
    </span>
  )
}

const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function ShopNode({ node, depth }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = node.children && node.children.length > 0
  const border = 'rgba(189,207,206,0.72)'

  return (
    <div style={{ marginLeft: depth > 0 ? 26 : 0, marginTop: depth > 0 ? 10 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FDFDFC', border: `1px solid ${border}`, borderRadius: 14, padding: '14px 18px', boxShadow: depth === 0 ? '0 18px 40px rgba(7,59,63,0.10)' : 'none' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          disabled={!hasChildren}
          style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8, border: `1px solid ${border}`, background: hasChildren ? 'rgba(189,207,206,0.2)' : 'transparent', color: '#0C4044', cursor: hasChildren ? 'pointer' : 'default', fontSize: 12, opacity: hasChildren ? 1 : 0.25 }}
        >
          {hasChildren ? (expanded ? '▾' : '▸') : '•'}
        </button>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 14px' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0C4044' }}>{node.shop_name}</div>
            <div style={{ fontSize: 11, color: '#7A8987', fontFamily: 'monospace', marginTop: 2 }}>{node.shop_id}</div>
          </div>
          <ShopTypeBadge type={node.shop_type} />
          <div style={{ fontSize: 12, color: '#5C706E' }}>{node.owner_name}</div>
          <div style={{ fontSize: 12, color: '#7A8987' }}>{node.mobile_number}</div>
          <div style={{ fontSize: 12, color: '#7A8987' }}>{node.city}</div>
          <div style={{ fontSize: 11, color: '#7A8987' }}>Since {formatDate(node.created_at)}</div>
          {hasChildren && (
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0C4044', background: 'rgba(12,64,68,0.08)', borderRadius: 20, padding: '2px 10px' }}>
              {node.descendant_count} in network
            </div>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div style={{ borderLeft: `2px dashed ${border}`, marginLeft: 13, paddingLeft: 0 }}>
          {node.children.map(child => (
            <ShopNode key={child.shop_id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ShopHierarchyGrid() {
  const navigate = useNavigate()
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/shop-hierarchy/')
        setTree(res.data)
      } catch {
        setError('Failed to load your shop network.')
      }
      setLoading(false)
    }
    fetchTree()
  }, [])

  const handleLogout = () => { localStorage.clear(); navigate('/login') }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: '#111817', fontFamily: '"Inter",system-ui,sans-serif' }}>
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
        reportItems={[]}
        actionItems={[
          { label: 'Dashboard', icon: 'user', path: '/shop-dashboard' },
          { label: 'Logout', icon: 'logout', variant: 'danger', action: handleLogout },
        ]}
      />

      <div style={{ padding: '42px 46px 56px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '26px' }}>
          <div style={{ color: '#BB8958', fontSize: '12px', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px' }}>Shop Panel</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', lineHeight: 0.95, fontFamily: 'Georgia, serif', color: '#0C4044', fontWeight: 500, margin: 0 }}>
            My Network
          </h2>
          <p style={{ color: '#7A8987', fontSize: 13, marginTop: 10 }}>Every shop created under you, and everyone they've created — Physical or Virtual, clearly marked.</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: 12, padding: '14px 18px', fontSize: 13, marginBottom: 20 }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7A8987' }}>Loading your network...</div>
        ) : tree ? (
          <ShopNode node={tree} depth={0} />
        ) : !error ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7A8987' }}>No data available.</div>
        ) : null}
      </div>
    </div>
  )
}
