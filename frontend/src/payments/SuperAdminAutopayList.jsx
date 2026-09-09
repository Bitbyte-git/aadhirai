import { useEffect, useState } from 'react'
import { SkeletonText } from '../components/Skeleton'
import CustomDropdown from '../components/CustomDropdown'

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'month', label: 'This Month' },
  { value: '6month', label: '6 Months' },
  { value: 'year', label: 'This Year' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Payments' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
]

export default function SuperAdminAutopayList() {
  const [mandates, setMandates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchMandates = async () => {
      try {
        const { default: api } = await import('../api')
        const res = await api.get('/autopay/mandates/')
        setMandates(res.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchMandates()
  }, [])

  const withinPeriod = (dateStr, period) => {
    if (period === 'all') return true
    if (!dateStr) return false
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = (now - date) / (1000 * 60 * 60 * 24)
    if (period === 'today') return date.toDateString() === now.toDateString()
    if (period === 'month') return diffDays <= 30
    if (period === '6month') return diffDays <= 180
    if (period === 'year') return diffDays <= 365
    return true
  }

  const filtered = mandates.filter(m => {
    const searchLower = search.trim().toLowerCase()
    const matchesSearch = !searchLower ||
      (m.customer_id || '').toLowerCase().includes(searchLower) ||
      (m.email || '').toLowerCase().includes(searchLower) ||
      (m.phone || '').toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || m.last_charge_status === statusFilter

    const matchesPeriod = withinPeriod(m.last_charge_date, periodFilter)

    return matchesSearch && matchesStatus && matchesPeriod
  })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)' }}>
      <style>{`
        .ap-page { padding: 28px 34px; box-sizing: border-box; width: 100%; max-width: 100vw; overflow-x: hidden; }
        .ap-card { background: rgba(253,253,252,0.97); border: 1px solid rgba(189,207,206,0.78); border-radius: 22px; padding: 34px 38px; box-shadow: 0 22px 58px rgba(7,59,63,0.08); box-sizing: border-box; width: 100%; max-width: 100%; }
        .ap-filter-bar { display: flex; gap: 12px; margin-top: 16px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .ap-input { height: 42px !important; min-height: 42px !important; max-height: 42px !important; flex: 1 1 240px; min-width: 200px; max-width: 100%; padding: 0 14px; border: 1.5px solid #D1DFDE; border-radius: 12px; font-size: 13px; box-sizing: border-box; outline: none; background: #fff; color: #111817; }
        .ap-input:focus { border-color: #073B3F; }
        .ap-dropdown { min-width: 160px; }
        .ap-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; border-radius: 14px; border: 1px solid rgba(189,207,206,0.78); margin-top: 20px; background: #fff; }
        .ap-table { width: 100%; border-collapse: collapse; min-width: 880px; font-size: 13.5px; }
        @media (max-width: 768px) {
          .ap-page { padding: 16px 12px !important; }
          .ap-card { padding: 20px 14px !important; border-radius: 16px !important; }
          .ap-filter-bar { flex-direction: column; align-items: stretch !important; gap: 10px !important; }
          .ap-input { width: 100% !important; flex: none !important; min-width: 0 !important; }
          .ap-dropdown { width: 100% !important; }
        }
      `}</style>
      <div className="ap-page">
        <div className="ap-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ margin: '0 0 4px', color: '#BB8958', fontSize: '11px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>PAYMENT MANDATES</p>
              <h2 style={{ color: '#073B3F', fontFamily: 'Georgia, serif', margin: 0, fontSize: '24px' }}>Autopay List</h2>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#7A8987' }}>
              Total: {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="ap-filter-bar">
            <input
              type="text"
              placeholder="Search by ID, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ap-input"
            />
            <CustomDropdown
              value={periodFilter}
              onChange={setPeriodFilter}
              options={PERIOD_OPTIONS}
              className="ap-dropdown"
            />
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              className="ap-dropdown"
            />
          </div>

          {loading ? (
            <div className="ap-table-wrap">
              <table className="ap-table">
                <thead>
                  <tr style={{ background: '#073B3F', color: '#fff' }}>
                    <th style={{ padding: 12, textAlign: 'left', width: '50px' }}>S.No</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Customer ID</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Frequency</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Charge Day</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Next Charge</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Last Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <tr key={i} style={{ borderBottom: '1px solid #E5EFEF' }}>
                      <td style={{ padding: 12 }}><SkeletonText width="24px" height="12px" /></td>
                      <td style={{ padding: 12 }}><SkeletonText width="90px" height="12px" /></td>
                      <td style={{ padding: 12 }}><SkeletonText width="110px" height="12px" /></td>
                      <td style={{ padding: 12 }}><SkeletonText width="90px" height="12px" /></td>
                      <td style={{ padding: 12 }}><SkeletonText width="50px" height="12px" /></td>
                      <td style={{ padding: 12 }}><SkeletonText width="60px" height="12px" /></td>
                      <td style={{ padding: 12 }}><SkeletonText width="40px" height="12px" /></td>
                      <td style={{ padding: 12 }}><SkeletonText width="60px" height="12px" /></td>
                      <td style={{ padding: 12 }}><SkeletonText width="80px" height="12px" /></td>
                      <td style={{ padding: 12 }}><SkeletonText width="120px" height="12px" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '50px 0', color: '#7A8987', fontSize: 14, textAlign: 'center', background: '#F8FAF9', borderRadius: 12, marginTop: 20 }}>
              {search ? `No mandates matching "${search}"` : 'No autopay mandates found.'}
            </div>
          ) : (
            <div className="ap-table-wrap">
              <table className="ap-table">
                <thead>
                  <tr style={{ background: '#073B3F', color: '#fff' }}>
                    <th style={{ padding: 12, textAlign: 'left', width: '50px' }}>S.No</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Customer ID</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Frequency</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Charge Day</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Next Charge</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Last Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #E5EFEF', transition: 'background .15s' }}>
                      <td style={{ padding: 12, color: '#7A8987', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 800, color: '#0C4044' }}>{m.customer_id || '—'}</td>
                      <td style={{ padding: 12, fontWeight: 700, color: '#111817' }}>{m.name || '—'}</td>
                      <td style={{ padding: 12, color: '#111817' }}>{m.phone || '—'}</td>
                      <td style={{ padding: 12, fontWeight: 800, color: '#0C4044' }}>₹{m.amount}</td>
                      <td style={{ padding: 12, color: '#53615F' }}>{m.frequency === 'daily' ? 'Weekly' : 'Monthly'}</td>
                      <td style={{ padding: 12, color: '#53615F' }}>{m.frequency === 'daily' ? 'N/A' : m.recharge_day}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                          background: m.status === 'active' ? 'rgba(22,163,74,0.12)' : 'rgba(122,137,135,0.14)',
                          color: m.status === 'active' ? '#16a34a' : '#53615F',
                        }}>
                          {m.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: 12, color: '#53615F' }}>{m.next_charge_date || '—'}</td>
                      <td style={{ padding: 12 }}>
                        {!m.last_charge_status ? (
                          <span style={{ color: '#7A8987' }}>— (no payment yet)</span>
                        ) : m.last_charge_status === 'success' ? (
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>
                            Success · {m.last_charge_date}
                          </span>
                        ) : (
                          <span style={{ color: '#c0392b', fontWeight: 700 }}>
                            Failed ({m.last_charge_error}) · {m.last_charge_date}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}