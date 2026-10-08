import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Coins,
  TrendingUp,
  Users,
  Wallet,
  ArrowUpRight,
  Search,
  Download,
  Filter,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Calendar
} from 'lucide-react'
import api from '../api'

export default function SuperAdminDigiGold() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await api.get('/digi-gold/superadmin/', { params })
      setData(res.data)
    } catch (err) {
      console.error('Failed to load Superadmin Digi Gold data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchAdminData()
  }

  const summary = data?.summary || {
    total_investors: 0,
    total_gold_mg: 0,
    total_gold_gm: 0,
    total_invested_inr: 0,
    current_valuation_inr: 0,
    total_customer_profit_inr: 0,
    todays_au_24k: 7682,
    todays_au_mg: 7.682,
  }

  const items = data?.items || []

  const exportCSV = () => {
    if (!items.length) return
    const headers = [
      'Date', 'User ID', 'Customer Name', 'Email', 'Role',
      'Recharge (INR)', 'Purchase Gold Price', 'Purchase Mg Price',
      'Hold Gold (mg)', 'Hold Gold (g)', 'Current Price', 'Current Mg Price',
      'Current Growth (INR)', 'Profit (INR)', 'Payment Method', 'Status'
    ]
    const rows = items.map(it => [
      it.date, it.user_id_str, `"${it.user_name}"`, it.user_email, it.user_role,
      it.recharge, it.gold_price, it.mg_price,
      it.hold_gold_mg, it.gm, it.current_price, it.current_mg_price,
      it.current_growth, it.profit, it.payment_method, it.status
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `digi_gold_all_records_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAF9',
      padding: '32px 36px 60px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#0A3E42',
      boxSizing: 'border-box'
    }}>
      {/* ── HEADER ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: '#0A3E42', color: '#C6924B',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#0A3E42' }}>
              Digi Gold Management
            </h1>
          </div>
          <p style={{ margin: 0, color: '#647474', fontSize: '13.5px' }}>
            Real-time digital gold holdings, live portfolio valuations, and comprehensive investor ledgers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchAdminData}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', background: '#FFFFFF',
              border: '1px solid #E6ECEA', borderRadius: '12px',
              cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: '#0A3E42'
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={exportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', background: '#009957',
              border: 'none', borderRadius: '12px',
              cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0, 153, 87, 0.25)'
            }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── LIVE RATE BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0A3E42 0%, #0E4E53 100%)',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '26px',
        boxShadow: '0 6px 20px rgba(10, 62, 66, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'rgba(198, 146, 75, 0.2)',
            border: '1px solid rgba(198, 146, 75, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#C6924B'
          }}>
            <Coins size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C6924B', fontWeight: 800 }}>
              Live Benchmark Gold Price
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              ₹ {Number(summary.todays_au_24k).toLocaleString('en-IN')}{' '}
              <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.8 }}>/ gram</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#C6924B', marginLeft: '12px' }}>
                (₹ {Number(summary.todays_au_mg).toFixed(2)} / mg)
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '12px', opacity: 0.85, textAlign: 'right' }}>
            Rates update daily from Super Admin Metal Rates<br />
            Portfolio growths recalculate automatically
          </div>
        </div>
      </div>

      {/* ── 5 SUMMARY METRICS CARDS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div style={metricCardStyle}>
          <div style={{ ...iconStyle, background: '#E8F7F0', color: '#009957' }}>
            <Users size={20} />
          </div>
          <span style={labelStyle}>Total Investors</span>
          <b style={valueStyle}>{summary.total_investors}</b>
          <span style={subStyle}>Active Digi Gold accounts</span>
        </div>

        <div style={metricCardStyle}>
          <div style={{ ...iconStyle, background: '#FFF8F0', color: '#C6924B' }}>
            <Coins size={20} />
          </div>
          <span style={labelStyle}>Total Gold Held (gm)</span>
          <b style={valueStyle}>{Number(summary.total_gold_gm).toFixed(3)} g</b>
          <span style={subStyle}>{Number(summary.total_gold_mg).toFixed(2)} mg net weight</span>
        </div>

        <div style={metricCardStyle}>
          <div style={{ ...iconStyle, background: '#EDF5FD', color: '#4B82E8' }}>
            <Wallet size={20} />
          </div>
          <span style={labelStyle}>Total Invested (INR)</span>
          <b style={valueStyle}>₹ {Number(summary.total_invested_inr).toLocaleString('en-IN')}</b>
          <span style={subStyle}>Principal inflow</span>
        </div>

        <div style={metricCardStyle}>
          <div style={{ ...iconStyle, background: '#EAF8F1', color: '#009957' }}>
            <TrendingUp size={20} />
          </div>
          <span style={labelStyle}>Current Market Valuation</span>
          <b style={{ ...valueStyle, color: '#009957' }}>₹ {Number(summary.current_valuation_inr).toLocaleString('en-IN')}</b>
          <span style={subStyle}>Live asset valuation</span>
        </div>

        <div style={metricCardStyle}>
          <div style={{ ...iconStyle, background: '#FFF8F0', color: '#009957' }}>
            <ArrowUpRight size={20} />
          </div>
          <span style={labelStyle}>Net Customer Profit</span>
          <b style={{ ...valueStyle, color: summary.total_customer_profit_inr >= 0 ? '#009957' : '#E45B5B' }}>
            {summary.total_customer_profit_inr >= 0 ? '+' : ''}₹ {Number(summary.total_customer_profit_inr).toLocaleString('en-IN')}
          </b>
          <span style={subStyle}>Total unrealized gains</span>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E6ECEA',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#F8FAF9', border: '1px solid #E6ECEA',
            borderRadius: '10px', padding: '0 12px', height: '40px', flex: 1, maxWidth: '420px'
          }}>
            <Search size={16} color="#647474" />
            <input
              type="text"
              placeholder="Search investor email, name, or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '0 16px', height: '40px', background: '#0A3E42',
              color: '#FFFFFF', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#647474' }}>Status:</span>
          {['all', 'completed', 'pending', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #E6ECEA',
                background: statusFilter === st ? '#0A3E42' : '#F8FAF9',
                color: statusFilter === st ? '#FFFFFF' : '#0A3E42',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ── DETAILED EXCEL TABLE (MATCHING IMAGE 2 EXACTLY) ── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E6ECEA',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(10, 62, 66, 0.04)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#F4F8F6', borderBottom: '1px solid #D5E5DE' }}>
                <th style={thStyleLeft}>Date</th>
                <th style={thStyleLeft}>Investor</th>
                <th style={thStyleLeft}>Role / ID</th>
                <th style={thStyleRight}>Recharge (₹)</th>
                <th style={thStyleRight}>Gold Price (₹)</th>
                <th style={thStyleRight}>Mg Price (₹)</th>
                <th style={thStyleRight}>Hold Gold (mg)</th>
                <th style={thStyleRight}>Hold Gold (g)</th>
                <th style={thStyleRight}>Current Price (₹)</th>
                <th style={thStyleRight}>Current Mg (₹)</th>
                <th style={thStyleRight}>Current Growth (₹)</th>
                <th style={thStyleRight}>Profit (₹)</th>
                <th style={thStyleCenter}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: '#647474' }}>
                    Loading Digi Gold records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: '#647474' }}>
                    No Digi Gold transactions recorded yet.
                  </td>
                </tr>
              ) : items.map((row, idx) => (
                <tr key={row.id || idx} style={{ borderBottom: '1px solid #F0F4F2' }}>
                  <td style={tdStyleLeft}>{row.date}</td>
                  <td style={tdStyleLeft}>
                    <b>{row.user_name}</b>
                    <div style={{ fontSize: '11px', color: '#647474' }}>{row.user_email}</div>
                  </td>
                  <td style={tdStyleLeft}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px',
                      background: '#F0F5F3', fontSize: '11px', fontWeight: 700, color: '#0A3E42'
                    }}>
                      {row.user_role}
                    </span>
                    <div style={{ fontSize: '10.5px', color: '#8E9E9C', marginTop: '2px' }}>{row.user_id_str}</div>
                  </td>
                  <td style={tdStyleRight}>₹ {row.recharge.toLocaleString('en-IN')}</td>
                  <td style={tdStyleRight}>₹ {row.gold_price.toLocaleString('en-IN')}</td>
                  <td style={tdStyleRight}>₹ {row.mg_price.toFixed(2)}</td>
                  <td style={tdStyleRight}>{row.hold_gold_mg.toFixed(2)}</td>
                  <td style={tdStyleRight}><b>{row.gm.toFixed(3)}</b></td>
                  <td style={tdStyleRight}>₹ {row.current_price.toLocaleString('en-IN')}</td>
                  <td style={tdStyleRight}>₹ {row.current_mg_price.toFixed(2)}</td>
                  <td style={{ ...tdStyleRight, fontWeight: 750, color: '#009957' }}>
                    ₹ {row.current_growth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{
                    ...tdStyleRight,
                    fontWeight: 750,
                    color: row.profit >= 0 ? '#009957' : '#E45B5B'
                  }}>
                    {row.profit >= 0 ? `+₹ ${row.profit.toFixed(2)}` : `-₹ ${Math.abs(row.profit).toFixed(2)}`}
                  </td>
                  <td style={tdStyleCenter}>
                    <span style={{
                      display: 'inline-flex', padding: '3px 9px', borderRadius: '999px',
                      background: row.status === 'completed' ? '#E8F7F0' : '#FFF3E0',
                      color: row.status === 'completed' ? '#009957' : '#E65100',
                      fontSize: '11px', fontWeight: 750, textTransform: 'capitalize'
                    }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const metricCardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E6ECEA',
  borderRadius: '16px',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  boxShadow: '0 4px 16px rgba(10, 62, 66, 0.03)'
}

const iconStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '4px'
}

const labelStyle = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#647474'
}

const valueStyle = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#0A3E42',
  letterSpacing: '-0.02em'
}

const subStyle = {
  fontSize: '11.5px',
  color: '#8E9E9C',
  fontWeight: 500
}

const thStyleLeft = {
  padding: '12px 14px',
  textAlign: 'left',
  fontWeight: 750,
  color: '#0A3E42',
  fontSize: '11.5px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
}

const thStyleRight = {
  ...thStyleLeft,
  textAlign: 'right'
}

const thStyleCenter = {
  ...thStyleLeft,
  textAlign: 'center'
}

const tdStyleLeft = {
  padding: '12px 14px',
  textAlign: 'left',
  color: '#0A3E42'
}

const tdStyleRight = {
  ...tdStyleLeft,
  textAlign: 'right'
}

const tdStyleCenter = {
  ...tdStyleLeft,
  textAlign: 'center'
}
