import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import api from '../api'
import logo from '../assets/logo.png'

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

export default function SuperRoleDashboardLayout({
  roleName = 'Super Stockist',
  roleCode = 'ADMIN',
  downlineLabel = 'Distributor',
  roleDistributionData = null,
  quickActions = null,
  managementButtons = null,
  orderEndpoint = '/order-timeseries/',
  orderRequestParams = {},
}) {
  const navigate = useNavigate()
  const [liveTime, setLiveTime] = useState(new Date())

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // ── 1. Gold Rate Fetching ──
  const [goldRate, setGoldRate] = useState(null)
  useEffect(() => {
    let current = true
    api.get('/metal-rates/')
      .then(res => {
        if (!current) return
        const val = res.data?.gold_22k ? parseFloat(res.data.gold_22k) : null
        setGoldRate(val)
      })
      .catch(() => {})
    return () => { current = false }
  }, [])

  // ── 2. Quick Stats (Yesterday Order, Today Order, Today New Customer, Active User, etc.) ──
  const [quickStats, setQuickStats] = useState({
    yesterday_orders: 0,
    today_orders: 0,
    today_new_customers: 0,
    active_users: 0,
    today_inactive_count: 0,
    sold_out_count: 0,
    notify_count: 0,
    total_users: 0,
  })

  useEffect(() => {
    let current = true
    api.get('/dashboard-quick-stats/')
      .then(res => {
        if (!current) return
        setQuickStats(prev => ({ ...prev, ...res.data }))
      })
      .catch(() => {})
    return () => { current = false }
  }, [])

  // ── 3. Role Distribution Live Counts ──
  const [roleCounts, setRoleCounts] = useState(null)
  useEffect(() => {
    let current = true
    api.get('/role-distribution-counts/')
      .then(res => {
        if (!current) return
        setRoleCounts(res.data)
      })
      .catch(() => {})
    return () => { current = false }
  }, [])

  // ── 4. Order Volume (AreaChart with dynamic time slots / intervals) ──
  const [orderPeriod, setOrderPeriod] = useState('today')
  const [orderChartData, setOrderChartData] = useState([])
  const [orderLoading, setOrderLoading] = useState(false)

  const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: '7D' },
    { key: 'month', label: '1M' },
    { key: '3month', label: '3M' },
    { key: 'year', label: '1Y' },
    { key: 'all', label: 'All' },
  ]

  const TODAY_SLOTS = [
    '1:00 am', '3:00 am', '5:00 am', '7:00 am', '9:00 am', '11:00 am',
    '1:00 pm', '3:00 pm', '5:00 pm', '7:00 pm', '9:00 pm', '11:00 pm',
  ]

  const getFallbackOrderSeries = (p) => {
    if (p === 'today') {
      return TODAY_SLOTS.map(slot => ({ label: slot, count: 0 }))
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

  const fetchOrderTimeseries = async (p = orderPeriod) => {
    setOrderLoading(true)
    try {
      const res = await api.get(orderEndpoint, { params: { ...orderRequestParams, period: p } })
      const raw = res.data?.data || []
      if (p === 'today') {
        const slotMap = new Map()
        TODAY_SLOTS.forEach(slot => slotMap.set(slot, 0))

        raw.forEach(item => {
          if (!item.time) return
          const d = new Date(item.time)
          const hr = d.getHours()
          const slotIdx = Math.min(11, Math.floor(hr / 2))
          const slotName = TODAY_SLOTS[slotIdx]
          slotMap.set(slotName, (slotMap.get(slotName) || 0) + Number(item.count || 0))
        })

        const mapped = TODAY_SLOTS.map(slot => ({
          label: slot,
          count: slotMap.get(slot) || 0,
        }))
        const totalMapped = mapped.reduce((sum, r) => sum + r.count, 0)
        if (totalMapped === 0 && Number(quickStats.today_orders || 0) > 0) {
          const currentHour = new Date().getHours()
          const currentSlotIdx = Math.min(11, Math.floor(currentHour / 2))
          mapped[currentSlotIdx].count = Number(quickStats.today_orders || 1)
        }
        setOrderChartData(mapped)
      } else {
        const formatted = completeChartSeries(raw, p)
        if (formatted.length > 0) {
          setOrderChartData(formatted)
        } else {
          setOrderChartData(getFallbackOrderSeries(p))
        }
      }
    } catch {
      setOrderChartData(getFallbackOrderSeries(p))
    } finally {
      setOrderLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderTimeseries(orderPeriod)
  }, [orderPeriod])

  // ── 5. All Sales & Commission / Profit Overview (Dynamic from API) ──
  const [salesProfitPeriod, setSalesProfitPeriod] = useState('month')
  const [activeSalesProfitTab, setActiveSalesProfitTab] = useState('profit') // 'sales' | 'profit'
  const [salesProfitLoading, setSalesProfitLoading] = useState(false)
  const [salesProfitData, setSalesProfitData] = useState({
    allSales: 0,
    myCommission: 0,
    athiraiProfit: 0,
    salesBreakdown: [
      { name: '22K Gold Jewelry', value: 0, color: '#009957', pct: '0%' },
      { name: '24K Bullion / Coins', value: 0, color: '#BB8958', pct: '0%' },
      { name: '999 Fine Silver', value: 0, color: '#3E7C82', pct: '0%' },
      { name: 'Direct / Digital Orders', value: 0, color: '#073B3F', pct: '0%' },
    ],
    profitBreakdown: [
      { name: '22K Gold Commission', value: 0, color: '#009957', pct: '0%' },
      { name: 'Coins Commission', value: 0, color: '#BB8958', pct: '0%' },
      { name: 'Silver Commission', value: 0, color: '#3E7C82', pct: '0%' },
      { name: 'Direct / Referral Rewards', value: 0, color: '#073B3F', pct: '0%' },
    ],
    monthlyTrend: [],
  })

  const fetchSalesProfit = async (p = salesProfitPeriod) => {
    setSalesProfitLoading(true)
    try {
      const res = await api.get(`/superadmin/sales-profit-summary/?period=${p}`)
      if (res.data) {
        setSalesProfitData({
          allSales: res.data.all_sales ?? 0,
          myCommission: res.data.my_commission ?? res.data.athirai_profit ?? 0,
          athiraiProfit: res.data.athirai_profit ?? 0,
          salesBreakdown: res.data.sales_breakdown || [],
          profitBreakdown: res.data.profit_breakdown || [],
          monthlyTrend: res.data.monthly_trend || [],
        })
      }
    } catch {
      // Fallback empty
    } finally {
      setSalesProfitLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesProfit(salesProfitPeriod)
  }, [salesProfitPeriod])

  // ── 6. Role Distribution Data (Role-specific downlines ONLY) ──
  const defaultRoleDist = useMemo(() => {
    if (roleDistributionData && roleDistributionData.length > 0) {
      const total = roleDistributionData.reduce((s, r) => s + Number(r.value || r.count || 0), 0)
      return roleDistributionData.map(r => ({
        ...r,
        pct: total > 0 ? `${((Number(r.value || r.count || 0) / total) * 100).toFixed(1)}%` : '0%',
      }))
    }
    const c = roleCounts || quickStats
    if (roleCode === 'ADMIN') {
      const items = [
        { name: 'Distributor', value: c.dealers || 0, count: c.dealers || 0, color: '#009957', route: '/admin-hierarchy-grid' },
        { name: 'Wholesale Dealer', value: c.sub_dealers || 0, count: c.sub_dealers || 0, color: '#BB8958', route: '/admin-hierarchy-grid' },
        { name: 'Retailer', value: c.promotors || 0, count: c.promotors || 0, color: '#CCA881', route: '/admin-hierarchy-grid' },
        { name: 'Customer', value: c.customers || 0, count: c.customers || 0, color: '#C92035', route: '/admin-hierarchy-grid' },
      ]
      const total = items.reduce((s, i) => s + i.value, 0)
      return items.map(i => ({ ...i, pct: total > 0 ? `${((i.value / total) * 100).toFixed(1)}%` : '0%' }))
    }
    if (roleCode === 'DEALER') {
      const items = [
        { name: 'Wholesale Dealer', value: c.sub_dealers || 0, count: c.sub_dealers || 0, color: '#BB8958', route: '/dealer-hierarchy-grid' },
        { name: 'Retailer', value: c.promotors || 0, count: c.promotors || 0, color: '#CCA881', route: '/dealer-hierarchy-grid' },
        { name: 'Customer', value: c.customers || 0, count: c.customers || 0, color: '#C92035', route: '/dealer-hierarchy-grid' },
      ]
      const total = items.reduce((s, i) => s + i.value, 0)
      return items.map(i => ({ ...i, pct: total > 0 ? `${((i.value / total) * 100).toFixed(1)}%` : '0%' }))
    }
    if (roleCode === 'SUB DEALER') {
      const items = [
        { name: 'Retailer', value: c.promotors || 0, count: c.promotors || 0, color: '#CCA881', route: '/subdealer-hierarchy-grid' },
        { name: 'Customer', value: c.customers || 0, count: c.customers || 0, color: '#C92035', route: '/subdealer-hierarchy-grid' },
      ]
      const total = items.reduce((s, i) => s + i.value, 0)
      return items.map(i => ({ ...i, pct: total > 0 ? `${((i.value / total) * 100).toFixed(1)}%` : '0%' }))
    }
    // PROMOTER
    const items = [
      { name: 'Customer', value: c.customers || 0, count: c.customers || 0, color: '#C92035', route: '/promotor-hierarchy-grid', pct: '100%' },
    ]
    return items
  }, [roleDistributionData, roleCounts, quickStats, roleCode])

  const totalUsersCount = useMemo(() => {
    return defaultRoleDist.reduce((sum, item) => sum + Number(item.value || item.count || 0), 0)
  }, [defaultRoleDist])

  // ── 7. User Growth Chart (Live database analytics scoped to role) ──
  const [userGrowthPeriod, setUserGrowthPeriod] = useState('Month')
  const [userGrowthLoading, setUserGrowthLoading] = useState(false)
  const [userGrowthStats, setUserGrowthStats] = useState({
    total: 0,
    newUsers: 0,
    activeUsers: 0,
  })
  const [userGrowthChartData, setUserGrowthChartData] = useState([])

  const fetchUserGrowth = async (p = userGrowthPeriod) => {
    setUserGrowthLoading(true)
    try {
      const res = await api.get(`/superadmin/user-growth/?period=${p.toLowerCase()}`)
      if (res.data) {
        setUserGrowthStats({
          total: res.data.total_users ?? 0,
          newUsers: res.data.new_users ?? 0,
          activeUsers: res.data.active_users ?? 0,
        })
        setUserGrowthChartData(res.data.chart_data || [])
      }
    } catch {
      // Fallback empty
    } finally {
      setUserGrowthLoading(false)
    }
  }

  useEffect(() => {
    fetchUserGrowth(userGrowthPeriod)
  }, [userGrowthPeriod])

  // ── 8. Quick Actions Tiles (Role Specific) ──
  const defaultQuickActions = useMemo(() => {
    if (quickActions && quickActions.length > 0) return quickActions

    if (roleCode === 'ADMIN') {
      return [
        {
          label: 'Distributor Hierarchy',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="2" y="17" width="6" height="4" rx="1" /><rect x="16" y="17" width="6" height="4" rx="1" /><path d="M12 7v5M5 17v-3h14v3" /></svg>,
          path: '/admin-hierarchy-grid', bg: '#E6F4F2', color: '#0C4044',
        },
        {
          label: 'Sales Report',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
          path: '/sales-report', bg: '#F0FDF4', color: '#16A34A',
        },
        {
          label: 'Available Jewellery',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3" /></svg>,
          path: '/available-jewellery', bg: '#FFF7ED', color: '#EA580C',
        },
        {
          label: 'Buy Coin',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
          path: '/available-coins', bg: '#ECFDF5', color: '#059669',
        },
        {
          label: 'Coins Reward',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
          path: '/coins-reward', bg: '#FEF3C7', color: '#D97706',
        },
        {
          label: 'Add Shop',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10h16l-1 12H5L4 10z" /><path d="M8 10V6a4 4 0 018 0v4" /></svg>,
          path: '/add-shop', bg: '#FDF2F8', color: '#DB2777',
        },
      ]
    }
    if (roleCode === 'DEALER') {
      return [
        {
          label: 'Wholesale Dealer Hierarchy',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="2" y="17" width="6" height="4" rx="1" /><rect x="16" y="17" width="6" height="4" rx="1" /><path d="M12 7v5M5 17v-3h14v3" /></svg>,
          path: '/dealer-hierarchy-grid', bg: '#E6F4F2', color: '#0C4044',
        },
        {
          label: 'Sales Report',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
          path: '/sales-report', bg: '#F0FDF4', color: '#16A34A',
        },
        {
          label: 'Available Jewellery',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3" /></svg>,
          path: '/available-jewellery', bg: '#FFF7ED', color: '#EA580C',
        },
        {
          label: 'Buy Coin',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
          path: '/available-coins', bg: '#ECFDF5', color: '#059669',
        },
        {
          label: 'Team Login Rewards',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
          path: '/internal-team-login-rewards', bg: '#FEF3C7', color: '#D97706',
        },
        {
          label: 'Add Shop',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10h16l-1 12H5L4 10z" /><path d="M8 10V6a4 4 0 018 0v4" /></svg>,
          path: '/add-shop', bg: '#FDF2F8', color: '#DB2777',
        },
      ]
    }
    if (roleCode === 'SUB DEALER') {
      return [
        {
          label: 'Retailer Hierarchy',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="2" y="17" width="6" height="4" rx="1" /><rect x="16" y="17" width="6" height="4" rx="1" /><path d="M12 7v5M5 17v-3h14v3" /></svg>,
          path: '/subdealer-hierarchy-grid', bg: '#E6F4F2', color: '#0C4044',
        },
        {
          label: 'Sales Report',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
          path: '/sales-report', bg: '#F0FDF4', color: '#16A34A',
        },
        {
          label: 'Available Jewellery',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3" /></svg>,
          path: '/available-jewellery', bg: '#FFF7ED', color: '#EA580C',
        },
        {
          label: 'Buy Coin',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
          path: '/available-coins', bg: '#ECFDF5', color: '#059669',
        },
        {
          label: 'Team Login Rewards',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
          path: '/internal-team-login-rewards', bg: '#FEF3C7', color: '#D97706',
        },
        {
          label: 'Add Shop',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10h16l-1 12H5L4 10z" /><path d="M8 10V6a4 4 0 018 0v4" /></svg>,
          path: '/add-shop', bg: '#FDF2F8', color: '#DB2777',
        },
      ]
    }
    // PROMOTER
    return [
      {
        label: 'Customer Hierarchy',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="2" y="17" width="6" height="4" rx="1" /><rect x="16" y="17" width="6" height="4" rx="1" /><path d="M12 7v5M5 17v-3h14v3" /></svg>,
        path: '/promotor-hierarchy-grid', bg: '#E6F4F2', color: '#0C4044',
      },
      {
        label: 'Sales Report',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
        path: '/sales-report', bg: '#F0FDF4', color: '#16A34A',
      },
      {
        label: 'Available Jewellery',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3" /></svg>,
        path: '/available-jewellery', bg: '#FFF7ED', color: '#EA580C',
      },
      {
        label: 'Buy Coin',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
        path: '/available-coins', bg: '#ECFDF5', color: '#059669',
      },
      {
        label: 'My Rewards',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
        path: '/internal-my-rewards', bg: '#FEF3C7', color: '#D97706',
      },
      {
        label: 'Add Shop',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10h16l-1 12H5L4 10z" /><path d="M8 10V6a4 4 0 018 0v4" /></svg>,
        path: '/add-shop', bg: '#FDF2F8', color: '#DB2777',
      },
    ]
  }, [quickActions, roleCode])

  // Custom Dark Tooltip
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
        border: '1px solid rgba(255,255,255,0.12)',
        fontSize: '11px',
      }}>
        <div style={{ fontWeight: 800, fontSize: '13px' }}>{p.count ?? p.users ?? 0} orders</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{p.label || p.month}</div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        /* ── Full SaaS Redesign Styles (Matching SuperAdminDashboard) ── */
        .sa-dashboard-container {
          width: 100%;
          max-width: 1540px;
          margin: 0 auto;
          padding: 24px 28px 48px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
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
        .sa-welcome-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }
        .sa-welcome-gold-btn {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          background: #FFFFFF;
          border: 1.5px solid rgba(187, 137, 88, 0.45);
          border-radius: 14px;
          padding: 8px 16px;
          cursor: pointer;
          color: #073B3F;
          box-shadow: 0 2px 10px rgba(7, 59, 63, 0.05), 0 1px 3px rgba(187, 137, 88, 0.1);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
        }
        .sa-welcome-gold-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(7, 59, 63, 0.12), 0 2px 8px rgba(187, 137, 88, 0.25);
          border-color: #BB8958;
          background: #FAF7F2;
        }
        .sa-welcome-gold-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0C4044 0%, #073B3F 100%);
          color: #E5BF91;
          border: 1px solid rgba(187, 137, 88, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(7, 59, 63, 0.2);
        }
        .sa-welcome-gold-text {
          display: flex;
          flex-direction: column;
          text-align: left;
          line-height: 1.15;
        }
        .sa-welcome-gold-label {
          font-size: 12px;
          font-weight: 800;
          color: #073B3F;
          letter-spacing: 0.01em;
        }
        .sa-welcome-gold-val {
          font-size: 11.5px;
          font-weight: 750;
          color: #BB8958;
          margin-top: 2px;
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
          .sa-revenue-income-grid { grid-template-columns: 1fr; }
          .sa-footer-banner { flex-direction: column; align-items: flex-start; gap: 18px; }
        }
      `}</style>

      <div className="sa-dashboard-container">
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
              <h1 className="sa-welcome-title">Welcome Back, {roleName}!</h1>
              <div className="sa-welcome-sub">Here's what's happening with your platform today.</div>
            </div>
          </div>

          <div className="sa-welcome-actions">
            {/* Today Gold Rate Button */}
            <div
              className="sa-welcome-gold-btn"
              onClick={() => navigate('/sales-report')}
              title="Live Gold Rate"
            >
              <div className="sa-welcome-gold-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 7.5h8" />
                  <path d="M8 11h5.5" />
                  <path d="M8 7.5v3.5a2.5 2.5 0 0 0 2.5 2.5h1l-3.5 4" />
                </svg>
              </div>
              <div className="sa-welcome-gold-text">
                <span className="sa-welcome-gold-label">Today Gold Rate</span>
                <span className="sa-welcome-gold-val">
                  {goldRate ? `22K: ₹${Number(goldRate).toLocaleString('en-IN')}/g` : '22K: ₹14,250/g'}
                </span>
              </div>
            </div>

            {/* Live Date & Time Pill */}
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
              <div className="sa-kpi-num">{quickStats.today_orders ?? 1}</div>
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
              <div className="sa-kpi-num">{quickStats.active_users ?? 1}</div>
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
          <div className="sa-saas-card" style={{ height: '100%', justifyContent: 'space-between' }}>
            <div className="sa-saas-card-head" style={{ marginBottom: '14px' }}>
              <div className="sa-saas-card-title">
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(12,64,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0C4044' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#0C4044', fontSize: '16px', fontWeight: 800 }}>Order Volume</div>
                  <div style={{ color: '#7A8987', fontSize: '12px', marginTop: '2px', fontWeight: 500 }}>Total orders overview</div>
                </div>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', background: '#F4F7F6', borderRadius: '20px', padding: '3px', gap: '2px' }}>
                {PERIODS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setOrderPeriod(p.key)
                      fetchOrderTimeseries(p.key)
                    }}
                    style={{
                      background: orderPeriod === p.key ? '#073B3F' : 'transparent',
                      color: orderPeriod === p.key ? '#FFFFFF' : '#5A6A68',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '5px 12px',
                      fontSize: '11.5px',
                      fontWeight: orderPeriod === p.key ? 700 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Smooth Spline Recharts AreaChart with 0, 1, 2, 3, 4 integer ticks */}
            <div style={{ width: '100%', height: '235px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderChartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roleOrderGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#009957" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#009957" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                  <XAxis dataKey="label" stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                  <YAxis
                    stroke="#8E9E9C"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    domain={[0, dataMax => Math.max(4, Math.ceil(dataMax * 1.25))]}
                    tickCount={5}
                  />
                  <Tooltip content={<CustomDarkTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#009957"
                    strokeWidth={2.4}
                    fill="url(#roleOrderGrad)"
                    dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Column 2: All Sales & Role Commission */}
          <div className="sa-saas-card sa-sales-profit-card">
            <div className="sa-saas-card-head" style={{ marginBottom: '12px' }}>
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009957" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                <span>{roleCode === 'SUPER_ADMIN' ? 'All Sales & Athirai Profit' : `All Sales & ${roleName} Commission`}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={salesProfitPeriod}
                  onChange={e => {
                    setSalesProfitPeriod(e.target.value)
                    fetchSalesProfit(e.target.value)
                  }}
                  style={{
                    background: '#F4F7F6', border: '1px solid #E2EAE8', color: '#0C4044',
                    borderRadius: '14px', padding: '4px 10px', fontSize: '11px', fontWeight: 800,
                    outline: 'none', cursor: 'pointer',
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

            {/* Top 2 Metric Toggle Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {/* All Sales Pill */}
              <div
                onClick={() => setActiveSalesProfitTab('sales')}
                className={`sa-profit-pill ${activeSalesProfitTab === 'sales' ? 'hero-profit' : ''}`}
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
                    textTransform: 'uppercase',
                  }}>
                    All Sales
                  </div>
                  <div style={{
                    fontSize: '13.5px',
                    fontWeight: 850,
                    color: activeSalesProfitTab === 'sales' ? '#FFFFFF' : '#073B3F',
                  }}>
                    <AnimatedNumber value={salesProfitData.allSales} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: activeSalesProfitTab === 'sales' ? '#FFFFFF' : '#0C4044', fontWeight: 900 }}>→</span>
              </div>

              {/* Commission / Profit Pill */}
              <div
                onClick={() => setActiveSalesProfitTab('profit')}
                className={`sa-profit-pill ${activeSalesProfitTab === 'profit' ? 'hero-profit' : ''}`}
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
                    textTransform: 'uppercase',
                  }}>
                    {roleCode === 'SUPER_ADMIN' ? 'Athirai Profit' : 'My Commission'}
                  </div>
                  <div style={{
                    fontSize: '13.5px',
                    fontWeight: 850,
                    color: activeSalesProfitTab === 'profit' ? '#FFFFFF' : '#073B3F',
                  }}>
                    <AnimatedNumber value={salesProfitData.myCommission ?? salesProfitData.athiraiProfit} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: activeSalesProfitTab === 'profit' ? '#FFFFFF' : '#0C4044', fontWeight: 900 }}>→</span>
              </div>
            </div>

            {/* 2-Panel Donut & Line Graph */}
            <div className="sa-revenue-income-grid">
              {/* Left Donut Breakdown */}
              <div className="sa-revenue-breakdown-col">
                <div className="sa-sub-chart-title">
                  {activeSalesProfitTab === 'sales' ? 'SALES BREAKDOWN' : (roleCode === 'SUPER_ADMIN' ? 'REVENUE BREAKDOWN' : 'COMMISSION BREAKDOWN')}
                </div>
                <div style={{ width: '100%', height: '170px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeSalesProfitTab === 'sales' ? salesProfitData.salesBreakdown : salesProfitData.profitBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={78}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {(activeSalesProfitTab === 'sales' ? salesProfitData.salesBreakdown : salesProfitData.profitBreakdown).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div style={{ background: '#073B3F', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 800 }}>
                            <div>{d.name}</div>
                            <div style={{ color: '#009957' }}>₹ {Number(d.value).toLocaleString('en-IN')} ({d.pct})</div>
                          </div>
                        )
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="sa-pie-legend">
                  {(activeSalesProfitTab === 'sales' ? salesProfitData.salesBreakdown : salesProfitData.profitBreakdown).map((b) => (
                    <div key={b.name} className="sa-pie-legend-row">
                      <span className="sa-pie-dot" style={{ background: b.color }} />
                      <span className="sa-pie-text">{b.name}</span>
                      <b className="sa-pie-pct">{b.pct}</b>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Line Graph */}
              <div className="sa-total-income-col">
                <div className="sa-sub-chart-title">
                  {activeSalesProfitTab === 'sales' ? 'TOTAL SALES TREND' : (roleCode === 'SUPER_ADMIN' ? 'TOTAL INCOME TREND' : 'COMMISSION TREND')}
                </div>
                <div style={{ width: '100%', flex: 1, minHeight: '120px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesProfitData.monthlyTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                      <XAxis dataKey="name" stroke="#8E9E9C" fontSize={9} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                      <YAxis
                        stroke="#8E9E9C"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, dataMax => Math.max(100, Math.ceil(dataMax * 1.2))]}
                        tickFormatter={v => `${v}`}
                      />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const p = payload[0].payload
                        const isSalesTab = activeSalesProfitTab === 'sales'
                        return (
                          <div style={{ background: '#073B3F', color: '#FFFFFF', borderRadius: '6px', padding: '6px 10px', fontSize: '10.5px', fontWeight: 800 }}>
                            <div style={{ color: '#BB8958' }}>{p.name}</div>
                            <div style={{ color: '#EAF8F0' }}>
                              {isSalesTab ? 'Sales' : (roleCode === 'SUPER_ADMIN' ? 'Profit' : 'Commission')}: ₹ {Number(isSalesTab ? p.sales : p.profit || 0).toLocaleString('en-IN')}
                            </div>
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
                    {activeSalesProfitTab === 'sales' ? 'Sales Trend Curve' : 'Commission Trend Curve'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Row 1: Role Distribution & User Growth */}
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
                Total: {totalUsersCount.toLocaleString()}
              </div>
            </div>

            <div className="sa-role-dist-wrap">
              <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={defaultRoleDist}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={2}
                    >
                      {defaultRoleDist.map((entry, idx) => (
                        <Cell key={`role-cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#073B3F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>

                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#071A2D', lineHeight: 1 }}>{totalUsersCount.toLocaleString()}</div>
                  <div style={{ fontSize: '9.5px', color: '#7A8987', fontWeight: 700, marginTop: '3px' }}>Total Downline</div>
                </div>
              </div>

              {/* Roles Table */}
              <div className="sa-role-table">
                {defaultRoleDist.map(r => (
                  <div key={r.name} className="sa-role-row" onClick={() => r.route && navigate(r.route)}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                    <span className="sa-role-name">{r.name}</span>
                    <span className="sa-role-count">{r.count ?? r.value ?? 0}</span>
                    <span className="sa-role-pct">{r.pct || `${((r.value / Math.max(1, totalUsersCount)) * 100).toFixed(1)}%`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: User Growth */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
                </svg>
                <span>User Growth</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={userGrowthPeriod}
                  onChange={e => {
                    setUserGrowthPeriod(e.target.value)
                    fetchUserGrowth(e.target.value)
                  }}
                  style={{
                    background: '#F4F7F6', border: '1px solid #E2EAE8', color: '#0C4044',
                    borderRadius: '16px', padding: '4px 12px', fontSize: '11.5px', fontWeight: 800,
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="Month">Month</option>
                  <option value="Week">Week</option>
                  <option value="3Month">3 Month</option>
                  <option value="Year">Year</option>
                </select>
              </div>
            </div>

            {/* 3 Metric Sub-pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: '#F8FAF9', border: '1px solid #E4ECEB', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7A8987' }}>Total Users</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#071A2D' }}>
                    <AnimatedNumber value={userGrowthStats.total} prefix="" />
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAF9', border: '1px solid #E4ECEB', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EAF8F0', color: '#009957', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7A8987' }}>New Registrations</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#009957' }}>
                    <AnimatedNumber value={userGrowthStats.newUsers} prefix="+" />
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAF9', border: '1px solid #E4ECEB', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7A8987' }}>Active Users</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#071A2D' }}>
                    <AnimatedNumber value={userGrowthStats.activeUsers} prefix="" />
                  </div>
                </div>
              </div>
            </div>

            {/* Smooth Spline AreaChart */}
            <div style={{ width: '100%', height: '175px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthChartData} margin={{ top: 12, right: 14, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roleUserGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#009957" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#009957" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" vertical={false} />
                  <XAxis dataKey="month" stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={{ stroke: '#E2EAE8' }} />
                  <YAxis stroke="#8E9E9C" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, dataMax => Math.max(4, Math.ceil(dataMax * 1.25))]} tickCount={5} />
                  <Tooltip content={<CustomDarkTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#009957"
                    strokeWidth={2.4}
                    fill="url(#roleUserGrowthGrad)"
                    dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 6.5, fill: '#073B3F', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 5. Bottom Row 2: Network & User Status & Quick Actions */}
        <div className="sa-bottom-grid">
          {/* Card 3: Network & User Status */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Network & User Status</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EAF8F0', color: '#009957', border: '1px solid #C4ECD7', borderRadius: '16px', padding: '3px 10px', fontSize: '11px', fontWeight: 800 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#009957' }} />
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
                  <span>● {(quickStats.active_users ?? 1).toLocaleString()}</span>
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
                  <span>● {(quickStats.today_inactive_count ?? 2719).toLocaleString()}</span>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              </div>

              {/* Sold Out Products */}
              <div className="sa-status-row" onClick={() => navigate('/available-jewellery')}>
                <div className="sa-status-left">
                  <div className="sa-status-icon-wrap" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <div>
                    <div className="sa-status-name">Sold Out Products</div>
                    <div className="sa-status-desc">Out of stock items</div>
                  </div>
                </div>
                <div className="sa-status-right" style={{ color: '#DC2626' }}>
                  <span>● {(quickStats.sold_out_count ?? 92).toLocaleString()}</span>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              </div>

              {/* Notify Requests */}
              <div className="sa-status-row" onClick={() => navigate('/available-coins')}>
                <div className="sa-status-left">
                  <div className="sa-status-icon-wrap" style={{ background: '#FFFBEB', color: '#D97706' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div>
                    <div className="sa-status-name">Notify Requests</div>
                    <div className="sa-status-desc">Customer restock alerts</div>
                  </div>
                </div>
                <div className="sa-status-right" style={{ color: '#D97706' }}>
                  <span>● {(quickStats.notify_count ?? 3).toLocaleString()}</span>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Quick Actions Grid */}
          <div className="sa-saas-card">
            <div className="sa-saas-card-head">
              <div className="sa-saas-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>{roleName} Quick Actions</span>
              </div>
            </div>

            <div className="sa-qa-grid">
              {defaultQuickActions.map(action => (
                <div
                  key={action.label}
                  className="sa-qa-tile"
                  onClick={() => {
                    if (action.action) action.action()
                    else if (action.path) navigate(action.path)
                  }}
                >
                  <div className="sa-qa-tile-left">
                    <div className="sa-qa-icon-wrap" style={{ background: action.bg, color: action.color }}>
                      {action.icon}
                    </div>
                    <span className="sa-qa-label">{action.label}</span>
                  </div>
                  <span style={{ color: '#9AA7A5', fontSize: '13px' }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Management Bar */}
        <div className="sa-saas-card" style={{ marginTop: '4px' }}>
          <div className="sa-saas-card-head" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#073B3F', margin: 0 }}>
              {roleName} Management
            </h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {managementButtons ? managementButtons : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const hMap = {
                        ADMIN: '/admin-hierarchy-grid',
                        DEALER: '/dealer-hierarchy-grid',
                        'SUB DEALER': '/subdealer-hierarchy-grid',
                        PROMOTER: '/promotor-hierarchy-grid',
                      }
                      navigate(hMap[roleCode] || '/admin-hierarchy-grid')
                    }}
                    style={{ padding: '10px 20px', background: '#FFFFFF', border: '1px solid rgba(204,168,129,0.4)', borderRadius: '10px', fontWeight: 800, color: '#BB8958', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                    Hierarchy
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/sales-report')}
                    style={{ padding: '10px 20px', background: '#FFFFFF', border: '1px solid rgba(12,64,68,0.28)', borderRadius: '10px', fontWeight: 800, color: '#0C4044', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Sales Report
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/add-shop')}
                    style={{ padding: '10px 20px', background: '#FFFFFF', border: '1px solid rgba(204,168,129,0.4)', borderRadius: '10px', fontWeight: 800, color: '#BB8958', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10h16l-1 12H5L4 10z" /><path d="M8 10V6a4 4 0 018 0v4" strokeLinecap="round" /></svg>
                    Add Shop
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const createMap = {
                        ADMIN: '/create-distributor',
                        DEALER: '/create-wholesale-dealer',
                        'SUB DEALER': '/create-retailer',
                        PROMOTER: '/create-customer',
                      }
                      navigate(createMap[roleCode] || '/create-distributor')
                    }}
                    style={{ padding: '10px 20px', background: '#004B55', border: 'none', borderRadius: '10px', fontWeight: 800, color: '#FFFFFF', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0,75,85,0.2)' }}
                  >
                    + Create {downlineLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/create-customer')}
                    style={{ padding: '10px 20px', background: '#073B3F', border: 'none', borderRadius: '10px', fontWeight: 800, color: '#FFFFFF', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(7,59,63,0.2)' }}
                  >
                    + Create Customer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 7. Bottom Luxury Footer Banner */}
        <div className="sa-footer-banner">
          <div className="sa-footer-left">
            <div className="sa-footer-motto">Together We Grow</div>
            <div className="sa-footer-underline" />
          </div>

          <div className="sa-footer-right">
            <img src={logo} alt="Athirai" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <div className="sa-footer-brand">
              <div className="sa-footer-brand-title">ATHIRAI</div>
              <div className="sa-footer-brand-sub">{roleName.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
