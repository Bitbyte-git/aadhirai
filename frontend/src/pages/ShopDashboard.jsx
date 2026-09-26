import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import ShopNavbar from '../collection/ShopNavbar'
import { IrdOrderTrendPanel, IrdDonutPanel, IrdIcon, irdPalette, IRD_STYLES } from './AdminDashboard'
import '../components/skeleton.css'

// ── Shop Dashboard — same layout as the Admin (Super Stockist) dashboard:
// 4 quick-stat cards → Order Volume graph → Shop Types + Today's Login Status
// → Shop Management (Hierarchy / Sales Report / Create Shop / Shop List) ──

function SectionHeader({ icon, label }) {
  const paths = {
    shop: <><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M3 10 5 3h14l2 7" /><path d="M9 21v-6h6v6" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px', background: 'linear-gradient(90deg, rgba(12,64,68,0.08), rgba(12,64,68,0.02))' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: 'linear-gradient(135deg,#0C4044,#073B3F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FDFDFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {paths[icon] || paths.shop}
        </svg>
      </div>
      <span style={{ color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  )
}

const PROFILE_FIELDS = [
  ['shop_name', 'Shop Name'], ['owner_name', 'Owner Name'],
  ['mobile_number', 'Mobile Number'], ['whatsapp_number', 'WhatsApp Number'],
  ['shop_address', 'Shop Address'], ['pincode', 'Pincode'],
  ['street_name', 'Street Name'], ['city', 'City'], ['district', 'District'], ['state', 'State'],
  ['pan_no', 'PAN'], ['gst_no', 'GST'], ['msme_no', 'MSME'],
]

// ── 4 cards — same look as AdminQuickStats ──
function ShopQuickStats() {
  const [stats, setStats] = useState({ yesterday_orders: 0, today_orders: 0, today_new_shops: 0, active_users: 0, total_sub_shops: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let current = true
    api.get('/dashboard-quick-stats/')
      .then(res => { if (current) setStats(prev => ({ ...prev, ...res.data })) })
      .catch(() => {})
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [])

  const cards = [
    { label: 'Yesterday Order', value: stats.yesterday_orders, sub: 'orders', note: 'Compared to today', color: '#9B31FF', bg: '#F5EAFF' },
    { label: 'Today Order', value: stats.today_orders, sub: 'orders', note: 'Orders placed today', color: '#00A767', bg: '#EAF8F0' },
    { label: 'Today New Shop', value: stats.today_new_shops, sub: '', note: 'Joined your network today', color: '#00A767', bg: '#EAF8F0' },
    { label: 'Active Shop', value: stats.active_users, sub: `of ${stats.total_sub_shops}`, note: 'Logged in today', color: '#2563EB', bg: '#EAF2FF' },
  ]

  return (
    <div className="shd-qstats">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={`skel-${i}`} className="shd-qcard">
            <div className="sa-kpi-skel-icon" style={{ width: '44px', height: '44px', borderRadius: '10px', marginBottom: '14px' }} />
            <div className="sa-kpi-skel-line" style={{ width: '65%', height: '11px', marginBottom: '12px' }} />
            <div className="sa-kpi-skel-line" style={{ width: '40%', height: '26px', marginBottom: '12px' }} />
            <div className="sa-kpi-skel-line" style={{ width: '55%', height: '11px' }} />
          </div>
        ))
      ) : (
        cards.map(kpi => (
          <div key={kpi.label} className="shd-qcard">
            <div className="shd-qicon" style={{ background: kpi.bg, color: kpi.color }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h15l-2 9H8L6 3H3" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
            </div>
            <div className="shd-qlabel">{kpi.label}</div>
            <div><span className="shd-qvalue">{kpi.value}</span>{kpi.sub ? <span className="shd-qsub">{kpi.sub}</span> : null}</div>
            <div className="shd-qnote">{kpi.note}</div>
          </div>
        ))
      )}
    </div>
  )
}

export default function ShopDashboard() {
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [typeCounts, setTypeCounts] = useState({ physical: 0, virtual: 0 })
  const [typeLoading, setTypeLoading] = useState(true)
  const [login, setLogin] = useState({ active: 0, inactive: 0 })
  const [loginLoading, setLoginLoading] = useState(true)

  const text = '#111817'
  const subtext = '#7A8987'
  const inp = { width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
  const lbl = { display: 'block', color: subtext, fontSize: '11px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.09em' }
  const sectionCard = { background: '#FDFDFC', border: '1px solid rgba(189,207,206,0.55)', borderRadius: '16px', padding: '22px 24px', marginBottom: '4px' }

  const fetchShopInfo = async () => {
    try {
      const res = await api.get('/my-shop-profile/')
      setShop(res.data)
    } catch (err) {
      console.error('Shop profile fetch error:', err)
    }
  }

  useEffect(() => {
    let current = true
    fetchShopInfo()
    api.get('/shop-dashboard-stats/')
      .then(res => { if (current) setTypeCounts({ physical: res.data.physical_count || 0, virtual: res.data.virtual_count || 0 }) })
      .catch(() => {})
      .finally(() => { if (current) setTypeLoading(false) })
    // sub-shops only — the logged-in shop itself isn't counted as "team" login
    api.get('/shop-list/', { params: { limit: 1 } })
      .then(res => { if (current) setLogin({ active: res.data.today_active_count || 0, inactive: res.data.today_inactive_count || 0 }) })
      .catch(() => {})
      .finally(() => { if (current) setLoginLoading(false) })
    return () => { current = false }
  }, [])

  const openProfile = () => { setShowProfile(true); fetchShopInfo() }

  const openEdit = () => {
    const next = {}
    PROFILE_FIELDS.forEach(([key]) => { next[key] = shop?.[key] || '' })
    next.shop_type = shop?.shop_type || 'live'
    setEditForm(next)
    setSaveMsg('')
    setShowEdit(true)
  }

  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value })

  const submitEdit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch('/my-shop-profile/', editForm)
      setShop(res.data)
      setSaveMsg('Profile updated successfully!')
      setTimeout(() => setShowEdit(false), 1200)
    } catch (err) {
      setSaveMsg('Error: ' + JSON.stringify(err.response?.data))
    }
    setSaving(false)
  }

  const typeData = [
    { name: 'Physical', value: typeCounts.physical, color: irdPalette.teal },
    { name: 'Virtual', value: typeCounts.virtual, color: irdPalette.gold },
  ].filter(d => d.value > 0)
  const loginData = [
    { name: 'Active', value: login.active, color: irdPalette.teal },
    { name: 'Inactive', value: login.inactive, color: irdPalette.red },
  ]
  const goShopList = status => navigate('/superadmin/manage-users/shops', { state: status ? { todayStatus: status } : undefined })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: text, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <ShopNavbar onProfile={openProfile} />
      <style>{`
        ${IRD_STYLES}
        .shd-head{max-width:1500px;margin:34px auto 0;padding:0 46px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;box-sizing:border-box}
        .shd-head p{margin:0 0 6px;color:#BB8958;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
        .shd-head h1{margin:0;font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(30px,4vw,44px);font-weight:700;color:#0C4044;line-height:1}
        .shd-head small{display:block;margin-top:6px;color:#7A8987;font-size:12.5px;font-weight:700;font-family:monospace}
        .shd-profile-btn{border:1px solid rgba(12,64,68,.28);background:#FDFDFC;color:#0C4044;border-radius:12px;padding:10px 18px;font-size:13px;font-weight:900;cursor:pointer}
        .shd-profile-btn:hover{background:#0C4044;color:#FDFDFC}
        .shd-qstats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;max-width:1500px;margin:22px auto 0;padding:0 46px;box-sizing:border-box}
        .shd-qcard{background:#FDFDFC;border:1px solid rgba(189,207,206,.78);border-radius:14px;padding:20px 22px;min-height:130px;box-shadow:0 18px 46px rgba(7,59,63,.07)}
        .shd-qicon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
        .shd-qlabel{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#0C4044;margin-bottom:8px}
        .shd-qvalue{font-size:26px;font-weight:900;color:#00152a}
        .shd-qsub{margin-left:8px;font-size:15px;color:#111817}
        .shd-qnote{font-size:12px;color:#009957;margin-top:8px}
        .shd-body{max-width:1500px;margin:0 auto;padding-bottom:46px}
        .shd-body .ird-shell{padding:24px 46px 0}
        @media(max-width:1180px){.shd-qstats{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:760px){
          .shd-head{padding:0 14px;margin-top:22px}
          .shd-qstats{padding:0 14px}
          .shd-qcard{padding:14px;min-height:0}
          .shd-qicon{width:36px;height:36px;margin-bottom:8px}
          .shd-qvalue{font-size:20px}
          .shd-body .ird-shell{padding:18px 14px 0}
          .shd-form-grid{grid-template-columns:1fr !important}
          .shd-form-grid > div{grid-column:auto !important}
        }
      `}</style>

      <div className="shd-head">
        <div>
          <p>Shop Panel</p>
          <h1>{shop?.shop_name || 'Shop Dashboard'}</h1>
          {shop?.shop_id && <small>{shop.shop_id} · {shop.shop_type === 'virtual' ? 'Virtual Shop' : 'Physical Shop'}</small>}
        </div>
        <button className="shd-profile-btn" onClick={openProfile}>My Profile</button>
      </div>

      <ShopQuickStats />

      <div className="shd-body">
        <div className="ird-shell">
          <div className="ird-grid">
            <IrdOrderTrendPanel title="Shop Order Volume" endpoint="/order-timeseries/" />
            <div className="ird-side">
              <IrdDonutPanel
                title="Shop Types"
                totalLabel={`${typeCounts.physical + typeCounts.virtual} sub-shops`}
                data={typeData}
                loading={typeLoading}
                onSliceClick={() => goShopList()}
              />
              <IrdDonutPanel
                title="Today's Login Status"
                totalLabel={`${login.active + login.inactive} total shops`}
                data={loginData}
                login
                loading={loginLoading}
                // Active → Login Active page, Inactive → Login Inactive page (shops mattum kaatum)
                onSliceClick={entry => navigate(entry?.name === 'Active' ? '/login-active' : '/login-inactive')}
              />
            </div>
          </div>

          <section className="ird-actions">
            <h3>Shop Management</h3>
            <div className="ird-action-grid">
              <button onClick={() => navigate('/shop-hierarchy-tree')}><IrdIcon type="store" />Hierarchy</button>
              <button onClick={() => navigate('/shop-report')}><IrdIcon type="report" />Sales Report</button>
            </div>
            <div className="ird-create-split">
              <button className="ird-create-action" onClick={() => navigate('/add-shop')}>+ Create Shop</button>
              <button className="ird-create-action secondary" onClick={() => navigate('/superadmin/manage-users/shops')}>Shop List</button>
            </div>
          </section>
        </div>
      </div>

      {/* ── PROFILE VIEW MODAL ── */}
      {showProfile && (
        <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '580px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '15px' }}>MY SHOP PROFILE</div>
                <div style={{ color: subtext, fontSize: '11px', marginTop: '3px', fontFamily: 'monospace' }}>{shop?.shop_id || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={openEdit} style={{ background: 'rgba(12,64,68,0.12)', border: '1px solid rgba(12,64,68,0.35)', color: '#0C4044', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}>✎ Edit</button>
                <button onClick={() => setShowProfile(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
              </div>
            </div>
            <div className="shd-form-grid" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                ['Shop Name', shop?.shop_name], ['Owner Name', shop?.owner_name],
                ['Shop Type', shop?.shop_type === 'live' ? 'Physical Shop' : 'Virtual Shop'],
                ['Email', shop?.email], ['Mobile', shop?.mobile_number], ['WhatsApp', shop?.whatsapp_number],
                ['Address', shop?.shop_address], ['Pincode', shop?.pincode], ['Street', shop?.street_name],
                ['City', shop?.city], ['District', shop?.district], ['State', shop?.state],
                ['PAN', shop?.pan_no], ['GST', shop?.gst_no], ['MSME', shop?.msme_no],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                  <div style={{ color: text, fontSize: '13px' }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE EDIT MODAL ── */}
      {showEdit && (
        <div onClick={() => setShowEdit(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.88)', backdropFilter: 'blur(12px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={submitEdit} onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.35)', borderRadius: '24px', width: '96%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 32px 90px rgba(17,24,23,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '15px' }}>✎ EDIT SHOP PROFILE</div>
              <button type="button" onClick={() => setShowEdit(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}>✕ Close</button>
            </div>

            {saveMsg && (
              <div style={{ background: saveMsg.includes('successfully') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${saveMsg.includes('successfully') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: saveMsg.includes('successfully') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
                {saveMsg}
              </div>
            )}

            <div style={sectionCard}>
              <SectionHeader icon="shop" label="Shop Info" />
              <div className="shd-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><label style={lbl}>Shop Name</label><input name="shop_name" value={editForm.shop_name || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>Owner Name</label><input name="owner_name" value={editForm.owner_name || ''} onChange={handleEditChange} style={inp} /></div>
                <div>
                  <label style={lbl}>Shop Type</label>
                  <select name="shop_type" value={editForm.shop_type || 'live'} onChange={handleEditChange} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="live">Physical Shop</option>
                    <option value="virtual">Virtual Shop</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ ...sectionCard, marginTop: '16px' }}>
              <SectionHeader icon="lock" label="Contact" />
              <div className="shd-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><label style={lbl}>Mobile Number</label><input name="mobile_number" maxLength={10} value={editForm.mobile_number || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>WhatsApp Number</label><input name="whatsapp_number" maxLength={10} value={editForm.whatsapp_number || ''} onChange={handleEditChange} style={inp} /></div>
              </div>
            </div>

            <div style={{ ...sectionCard, marginTop: '16px' }}>
              <SectionHeader icon="pin" label="Address" />
              <div className="shd-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Shop Address</label><input name="shop_address" value={editForm.shop_address || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>Pincode</label><input name="pincode" maxLength={6} value={editForm.pincode || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>Street Name</label><input name="street_name" value={editForm.street_name || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>City</label><input name="city" value={editForm.city || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>District</label><input name="district" value={editForm.district || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>State</label><input name="state" value={editForm.state || ''} onChange={handleEditChange} style={inp} /></div>
              </div>
            </div>

            <div style={{ ...sectionCard, marginTop: '16px' }}>
              <SectionHeader icon="briefcase" label="Identity (Optional)" />
              <div className="shd-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div><label style={lbl}>PAN</label><input name="pan_no" maxLength={10} value={editForm.pan_no || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>GST</label><input name="gst_no" maxLength={15} value={editForm.gst_no || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>MSME</label><input name="msme_no" maxLength={25} value={editForm.msme_no || ''} onChange={handleEditChange} style={inp} /></div>
              </div>
            </div>

            <button type="submit" disabled={saving} style={{ marginTop: '20px', width: '100%', padding: '14px', background: saving ? 'rgba(12,64,68,0.4)' : 'linear-gradient(90deg,#0C4044,#BDCFCE)', border: 'none', borderRadius: '12px', fontWeight: 900, color: '#FDFDFC', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
