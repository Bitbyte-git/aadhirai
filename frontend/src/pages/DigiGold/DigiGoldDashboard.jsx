import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowUpFromLine,
  WalletCards,
  History,
  Package,
  Gift,
  UserRound,
  Headphones,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  BarChart3,
  ArrowLeftRight,
  ShieldCheck,
  CircleHelp,
  Sparkles,
  CheckCircle2,
  X,
  Wallet,
  Coins,
  ArrowLeft,
  Calendar,
  Filter,
  AlertCircle,
  CreditCard,
  ArrowRight
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import api from '../../api'
import './DigiGoldDashboard.css'

// ── LUXURY ENTERPRISE FEEDBACK / NOTICE COMPONENT ──
function ModalFeedbackNotice({ feedback, onDismiss, onRecharge, onSwitchUPI, onBuyGold }) {
  if (!feedback) return null

  const isError = feedback.type === 'error'

  return (
    <div className={`dg-feedback-card ${isError ? 'error' : 'success'}`}>
      <div className="dg-feedback-header">
        <div className={`dg-feedback-icon-box ${isError ? 'error' : 'success'}`}>
          {isError ? <AlertCircle size={22} strokeWidth={2.4} /> : <CheckCircle2 size={22} strokeWidth={2.4} />}
        </div>
        <div className="dg-feedback-content">
          <div className="dg-feedback-title">{feedback.title}</div>
          <div className="dg-feedback-detail">{feedback.detail}</div>
          {feedback.transaction_id && (
            <div className="dg-feedback-txnid">
              <span className="dg-feedback-txnid-label">Txn ID:</span>
              <code className="dg-feedback-txnid-val">{feedback.transaction_id}</code>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            className="dg-feedback-close"
            onClick={onDismiss}
            title="Dismiss notice"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Contextual Action Buttons */}
      {isError && feedback.code === 'insufficient_balance' && (
        <div className="dg-feedback-actions">
          {onRecharge && (
            <button
              type="button"
              className="dg-feedback-btn primary"
              onClick={onRecharge}
            >
              <Coins size={14} />
              <span>Recharge AUG Coins / Wallet</span>
              <ArrowRight size={13} />
            </button>
          )}
          {onSwitchUPI && (
            <button
              type="button"
              className="dg-feedback-btn secondary"
              onClick={onSwitchUPI}
            >
              <CreditCard size={14} />
              <span>Pay via UPI / Netbanking Instead</span>
            </button>
          )}
        </div>
      )}

      {isError && feedback.code === 'insufficient_holdings' && onBuyGold && (
        <div className="dg-feedback-actions">
          <button
            type="button"
            className="dg-feedback-btn primary"
            onClick={onBuyGold}
          >
            <ShoppingCart size={14} />
            <span>Buy 22K Digi Gold</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function DigiGoldDashboard() {
  const navigate = useNavigate()

  // ── USER INFO ──
  const getLoggedInUser = () => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const u = JSON.parse(stored)
        const fullName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : ''
        return {
          name: fullName || u.username || u.name || (u.email ? u.email.split('@')[0] : 'Senthil'),
          role: (u.role || localStorage.getItem('role') || 'Customer').replace('_', ' '),
          email: u.email || localStorage.getItem('email') || '',
          phone: u.phone || ''
        }
      }
    } catch {}
    const storedEmail = localStorage.getItem('email') || ''
    const fallbackName = storedEmail ? storedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Senthil'
    const name = localStorage.getItem('name') || localStorage.getItem('username') || fallbackName
    const role = (localStorage.getItem('role') || 'Customer').replace('_', ' ')
    return { name, role, email: storedEmail }
  }

  const currentUser = getLoggedInUser()

  // ── STATE ──
  // ── INSTANT ZERO-LAG INITIAL STATE ──
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(() => {
    let cachedRates = null
    try {
      const s = sessionStorage.getItem('athirai_rates')
      if (s) cachedRates = JSON.parse(s)
    } catch {}

    const liveRates = cachedRates || {
      gold_22k: 14250,
      gold_22k_mg: 14.25,
      diff_22k: 110,
      pct_22k: 0.78,
      silver_999: 275.0,
      diff_silver: 8.0,
      pct_silver: 3.0,
    }

    const basePrice = liveRates.gold_22k
    return {
      customer: {
        name: currentUser.name,
        role: currentUser.role,
        email: currentUser.email
      },
      kpis: {
        total_gold_holding_gm: 0.0,
        total_gold_holding_mg: 0.0,
        gold_value_inr: 0.0,
        wallet_balance_inr: 0.0,
        total_invested_inr: 0.0,
        total_returns_inr: 0.0,
        returns_percentage: 0.0,
      },
      rates: liveRates,
      chart_data: [
        { time: '8 AM', price: Math.round(basePrice - 110) },
        { time: '10 AM', price: Math.round(basePrice - 85) },
        { time: '12 PM', price: Math.round(basePrice - 60) },
        { time: '2 PM', price: Math.round(basePrice - 40) },
        { time: '4 PM', price: Math.round(basePrice - 20) },
        { time: '6 PM', price: Math.round(basePrice - 5) },
        { time: '8 PM', price: Math.round(basePrice) },
      ],
      recent_transactions: []
    }
  })
  const [activeTab, setActiveTab] = useState('1D')
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' | 'transactions'
  const [txFilter, setTxFilter] = useState('all') // 'all' | 'buy' | 'sell'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Modals
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showSellModal, setShowSellModal] = useState(false)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)

  // Metal selection for Buy & Sell
  const [buyMetal, setBuyMetal] = useState('gold_22k') // 'gold_22k' | 'silver_999'
  const [sellMetal, setSellMetal] = useState('gold_22k') // 'gold_22k' | 'silver_999'

  // Buy form
  const [buyAmount, setBuyAmount] = useState('1000')
  const [buyPaymentMethod, setBuyPaymentMethod] = useState('wallet')
  const [submittingBuy, setSubmittingBuy] = useState(false)
  const [buyFeedback, setBuyFeedback] = useState(null)
  const [buyMessage, setBuyMessage] = useState('')

  // Sell form
  const [sellGrams, setSellGrams] = useState('0.5')
  const [submittingSell, setSubmittingSell] = useState(false)
  const [sellFeedback, setSellFeedback] = useState(null)
  const [sellMessage, setSellMessage] = useState('')

  // Convert AUG Coins to 22K Digi Gold form
  const [convertAmount, setConvertAmount] = useState('1000')
  const [submittingConvert, setSubmittingConvert] = useState(false)
  const [convertFeedback, setConvertFeedback] = useState(null)

  const handleOpenBuyModal = () => {
    setBuyFeedback(null)
    setBuyMessage('')
    setShowBuyModal(true)
  }

  const handleOpenSellModal = () => {
    setSellFeedback(null)
    setSellMessage('')
    setShowSellModal(true)
  }

  // Auto-rotating Sidebar Vault Mode (3s 22K Gold <-> 3s Digi Silver)
  const [sidebarRotatingMetal, setSidebarRotatingMetal] = useState('gold')
  useEffect(() => {
    const timer = setInterval(() => {
      setSidebarRotatingMetal(prev => prev === 'gold' ? 'silver' : 'gold')
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  // ── LIGHTNING FAST PARALLEL FETCH ──
  const fetchDashboardData = async () => {
    try {
      const [rateRes, walletRes, dashRes] = await Promise.allSettled([
        api.get('/metal-rates/'),
        api.get('/wallet/'),
        api.get('/digi-gold/dashboard/')
      ])

      let liveMetalRates = {
        gold_22k: 14250,
        gold_22k_mg: 14.25,
        diff_22k: 110,
        pct_22k: 0.78,
        silver_999: 275.0,
        diff_silver: 8.0,
        pct_silver: 3.0,
      }

      if (rateRes.status === 'fulfilled' && rateRes.value?.data) {
        const rData = Array.isArray(rateRes.value.data) ? rateRes.value.data[0] : rateRes.value.data
        if (rData && rData.gold_22k) {
          const g22 = parseFloat(rData.gold_22k) || 14250
          const s999 = parseFloat(rData.silver_999) || 275
          liveMetalRates = {
            gold_22k: g22,
            gold_22k_mg: +(g22 / 1000).toFixed(4),
            diff_22k: 110,
            pct_22k: 0.78,
            silver_999: s999,
            diff_silver: 8.0,
            pct_silver: 3.0,
          }
          try { sessionStorage.setItem('athirai_rates', JSON.stringify(liveMetalRates)) } catch {}
        }
      }

      let walletCoins = 0
      let userWalletBalance = 0.0
      if (walletRes.status === 'fulfilled' && walletRes.value?.data) {
        walletCoins = Number(walletRes.value.data.balance_coins ?? walletRes.value.data.balance ?? 0)
        userWalletBalance = Math.round((walletCoins / 100) * 100) / 100
      }

      const dashData = dashRes.status === 'fulfilled' ? dashRes.value?.data : null
      const dashCoins = Number(dashData?.kpis?.aug_coins_balance ?? 0)

      // Always pick the accurate balance (either from /wallet/ or /digi-gold/dashboard/)
      const finalAugCoins = Math.max(dashCoins, walletCoins)
      const finalAugInr = finalAugCoins > 0 ? +(finalAugCoins / 100).toFixed(2) : (Number(dashData?.kpis?.aug_balance_inr ?? userWalletBalance))

      const basePrice = liveMetalRates.gold_22k
      const dynamicChartData = [
        { time: '8 AM', price: Math.round(basePrice - 110) },
        { time: '10 AM', price: Math.round(basePrice - 85) },
        { time: '12 PM', price: Math.round(basePrice - 60) },
        { time: '2 PM', price: Math.round(basePrice - 40) },
        { time: '4 PM', price: Math.round(basePrice - 20) },
        { time: '6 PM', price: Math.round(basePrice - 5) },
        { time: '8 PM', price: Math.round(basePrice) },
      ]

      setData({
        customer: {
          name: dashData?.customer?.name || currentUser.name,
          role: dashData?.customer?.role || currentUser.role,
          email: dashData?.customer?.email || currentUser.email,
        },
        kpis: {
          total_gold_holding_gm: dashData?.kpis?.total_gold_holding_gm || 0.0,
          total_gold_holding_mg: dashData?.kpis?.total_gold_holding_mg || 0.0,
          gold_value_inr: dashData?.kpis?.gold_value_inr || 0.0,
          wallet_balance_inr: dashData?.kpis?.gold_value_inr || 0.0, // strictly Digi Gold Vault Value (0.00 until bought/converted)
          digi_gold_wallet_inr: dashData?.kpis?.gold_value_inr || 0.0,
          total_invested_inr: dashData?.kpis?.total_invested_inr || 0.0,
          total_returns_inr: dashData?.kpis?.total_returns_inr || 0.0,
          returns_percentage: dashData?.kpis?.returns_percentage || 0.0,
          aug_coins_balance: finalAugCoins,
          aug_balance_inr: finalAugInr,
        },
        rates: liveMetalRates,
        chart_data: dashData?.chart_data?.length ? dashData.chart_data : dynamicChartData,
        chart_history: dashData?.chart_history || null,
        recent_transactions: dashData?.recent_transactions || []
      })
    } catch (err) {
      console.warn('Dashboard parallel fetch error:', err)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // ── BUY HANDLER ──
  const handleBuyGold = async (e) => {
    e.preventDefault()
    if (!buyAmount || parseFloat(buyAmount) <= 0) return
    setSubmittingBuy(true)
    setBuyFeedback(null)
    try {
      const res = await api.post('/digi-gold/buy/', {
        amount: parseFloat(buyAmount),
        payment_method: buyPaymentMethod,
        metal: buyMetal
      })
      const metalLabel = buyMetal === 'gold_22k' ? '22K Digital Gold' : 'Digi Silver (Pure 999)'
      const txnId = res.data?.transaction_id
      setBuyFeedback({
        type: 'success',
        title: 'Investment Confirmed!',
        detail: res.data?.message || `${metalLabel} was successfully purchased and credited to your vault.`,
        code: 'success',
        transaction_id: txnId
      })
      setTimeout(() => {
        fetchDashboardData()
      }, 1000)
    } catch (err) {
      const respData = err.response?.data
      let errTitle = 'Transaction Could Not Be Processed'
      let errDetail = 'Please verify your transaction parameters and try again.'
      let errCode = 'general_error'

      if (respData?.code === 'insufficient_balance') {
        errTitle = 'Insufficient Recharge Balance'
        errDetail = respData.detail || 'Your wallet balance is lower than the required amount for this transaction.'
        errCode = 'insufficient_balance'
      } else if (respData?.error) {
        errTitle = respData.error
        errDetail = respData.detail || 'Please check your inputs and try again.'
        errCode = respData.code || 'general_error'
      } else if (respData?.detail) {
        errTitle = 'Transaction Notice'
        errDetail = respData.detail
      }

      setBuyFeedback({
        type: 'error',
        title: errTitle,
        detail: errDetail,
        code: errCode
      })
    } finally {
      setSubmittingBuy(false)
    }
  }

  // ── SELL HANDLER ──
  const handleSellGold = async (e) => {
    e.preventDefault()
    if (!sellGrams || parseFloat(sellGrams) <= 0) return
    setSubmittingSell(true)
    setSellFeedback(null)
    try {
      const res = await api.post('/digi-gold/sell/', {
        grams: parseFloat(sellGrams),
        metal: sellMetal
      })
      const metalLabel = sellMetal === 'gold_22k' ? '22K Digital Gold' : 'Digi Silver (Pure 999)'
      const txnId = res.data?.transaction_id
      setSellFeedback({
        type: 'success',
        title: 'Sale Executed Successfully!',
        detail: res.data?.message || `${metalLabel} sold and payout credited directly to your wallet balance.`,
        code: 'success',
        transaction_id: txnId
      })
      setTimeout(() => {
        fetchDashboardData()
      }, 1000)
    } catch (err) {
      const respData = err.response?.data
      let errTitle = 'Sale Order Incomplete'
      let errDetail = 'Unable to complete your sale at this time. Please check your vault balance.'
      let errCode = 'general_error'

      if (respData?.code === 'insufficient_holdings') {
        errTitle = 'Insufficient Vault Holdings'
        errDetail = respData.detail || 'You do not have enough quantity in your vault for this sale.'
        errCode = 'insufficient_holdings'
      } else if (respData?.error) {
        errTitle = respData.error
        errDetail = respData.detail || 'Please verify the quantity and try again.'
        errCode = respData.code || 'general_error'
      } else if (respData?.detail) {
        errTitle = 'Transaction Notice'
        errDetail = respData.detail
      }

      setSellFeedback({
        type: 'error',
        title: errTitle,
        detail: errDetail,
        code: errCode
      })
    } finally {
      setSubmittingSell(false)
    }
  }

  // ── CONVERT AUG COINS HANDLER ──
  const handleConvertCoins = async (e) => {
    e.preventDefault()
    if (!convertAmount || parseFloat(convertAmount) <= 0) return
    setSubmittingConvert(true)
    setConvertFeedback(null)
    try {
      const res = await api.post('/digi-gold/convert-from-recharge/', {
        amount: parseFloat(convertAmount)
      })
      const txnId = res.data?.transaction_id
      setConvertFeedback({
        type: 'success',
        title: 'Conversion Confirmed!',
        detail: res.data?.message || `Successfully converted ₹${convertAmount} from your AUG Coins into 22K Digi Gold!`,
        code: 'success',
        transaction_id: txnId
      })
      setTimeout(() => {
        fetchDashboardData()
      }, 900)
    } catch (err) {
      const respData = err.response?.data
      let errTitle = 'Conversion Could Not Be Completed'
      let errDetail = 'Please check your parameters and try again.'
      let errCode = 'general_error'

      if (respData?.code === 'insufficient_balance') {
        errTitle = 'Insufficient AUG Coins'
        errDetail = respData.detail || 'Your AUG coins balance is not enough to convert this amount.'
        errCode = 'insufficient_balance'
      } else if (respData?.error) {
        errTitle = respData.error
        errDetail = respData.detail || 'Please check your inputs and try again.'
        errCode = respData.code || 'general_error'
      } else if (respData?.detail) {
        errTitle = 'Conversion Notice'
        errDetail = respData.detail
      }

      setConvertFeedback({
        type: 'error',
        title: errTitle,
        detail: errDetail,
        code: errCode
      })
    } finally {
      setSubmittingConvert(false)
    }
  }

  const kpis = data?.kpis || {}
  const rates = data?.rates || {}
  const transactions = data?.recent_transactions || []

  // Dynamic Real Chart Data per Active Tab (1D, 1W, 1M, 3M, 1Y)
  const activeChartData = useMemo(() => {
    if (data?.chart_history && data.chart_history[activeTab] && data.chart_history[activeTab].length > 0) {
      return data.chart_history[activeTab]
    }
    const base = Number(rates.gold_22k) || 14250
    if (activeTab === '1D') {
      return [
        { time: '9 AM', fullDate: 'Today, 09:00 AM', price: Math.round(base - 105) },
        { time: '11 AM', fullDate: 'Today, 11:00 AM', price: Math.round(base - 75) },
        { time: '1 PM', fullDate: 'Today, 01:00 PM', price: Math.round(base - 45) },
        { time: '3 PM', fullDate: 'Today, 03:00 PM', price: Math.round(base - 20) },
        { time: '5 PM', fullDate: 'Today, 05:00 PM', price: Math.round(base - 10) },
        { time: '7 PM', fullDate: 'Today, 07:00 PM', price: Math.round(base - 5) },
        { time: 'Live', fullDate: 'Today, Live Market', price: Math.round(base) },
      ]
    }
    if (activeTab === '1W') {
      return [
        { time: '02 Oct', fullDate: '02 Oct 2026', price: Math.round(base - 95) },
        { time: '03 Oct', fullDate: '03 Oct 2026', price: Math.round(base - 70) },
        { time: '04 Oct', fullDate: '04 Oct 2026', price: Math.round(base - 55) },
        { time: '05 Oct', fullDate: '05 Oct 2026', price: Math.round(base - 35) },
        { time: '06 Oct', fullDate: '06 Oct 2026', price: Math.round(base - 40) },
        { time: '07 Oct', fullDate: '07 Oct 2026', price: Math.round(base - 15) },
        { time: 'Today', fullDate: 'Today, Live Market', price: Math.round(base) },
      ]
    }
    if (activeTab === '1M') {
      return [
        { time: '08 Sep', fullDate: '08 Sep 2026', price: 14140 },
        { time: '14 Sep', fullDate: '14 Sep 2026', price: 14250 },
        { time: '20 Sep', fullDate: '20 Sep 2026', price: 14190 },
        { time: '26 Sep', fullDate: '26 Sep 2026', price: 14215 },
        { time: '02 Oct', fullDate: '02 Oct 2026', price: 14230 },
        { time: '05 Oct', fullDate: '05 Oct 2026', price: 14240 },
        { time: 'Today', fullDate: 'Today, Live Market', price: Math.round(base) },
      ]
    }
    if (activeTab === '3M') {
      return [
        { time: '10 Jul', fullDate: '10 Jul 2026', price: 13240 },
        { time: '27 Jul', fullDate: '27 Jul 2026', price: 14225 },
        { time: '13 Aug', fullDate: '13 Aug 2026', price: 14200 },
        { time: '08 Sep', fullDate: '08 Sep 2026', price: 14140 },
        { time: '14 Sep', fullDate: '14 Sep 2026', price: 14250 },
        { time: 'Today', fullDate: 'Today, Live Market', price: Math.round(base) },
      ]
    }
    // 1Y
    return [
      { time: "Oct '25", fullDate: 'October 2025', price: 12200 },
      { time: "Dec '25", fullDate: 'December 2025', price: 12550 },
      { time: "Feb '26", fullDate: 'February 2026', price: 12890 },
      { time: "Apr '26", fullDate: 'April 2026', price: 13080 },
      { time: "Jul '26", fullDate: '10 Jul 2026', price: 13240 },
      { time: "Aug '26", fullDate: '13 Aug 2026', price: 14200 },
      { time: "Sep '26", fullDate: '08 Sep 2026', price: 14140 },
      { time: 'Today', fullDate: 'Today, Live Market', price: Math.round(base) },
    ]
  }, [activeTab, data?.chart_history, rates.gold_22k])

  const chartYDomain = useMemo(() => {
    if (!activeChartData || activeChartData.length === 0) return ['auto', 'auto']
    const prices = activeChartData.map(d => Number(d.price) || 0).filter(p => p > 0)
    if (prices.length === 0) return ['auto', 'auto']
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const diff = maxP - minP
    const pad = diff > 400 ? Math.round(diff * 0.1) : Math.max(25, Math.round(diff * 0.2))
    return [Math.floor((minP - pad) / 10) * 10, Math.ceil((maxP + pad) / 10) * 10]
  }, [activeChartData])

  // 22K Primary Rate for Athirai Digi Gold & Digi Silver Rate
  const currentLiveRate = rates.gold_22k || 14250
  const currentLiveMgRate = rates.gold_22k_mg || (currentLiveRate / 1000)
  const currentSilverRate = rates.silver_999 || 275.0

  // Live calculations for Buy modal
  const parsedBuyAmount = parseFloat(buyAmount) || 0
  const activeBuyRate = buyMetal === 'gold_22k' ? currentLiveRate : currentSilverRate
  const activeBuyMgRate = buyMetal === 'gold_22k' ? currentLiveMgRate : (currentSilverRate / 1000)
  const previewGoldMg = activeBuyMgRate > 0 ? (parsedBuyAmount / activeBuyMgRate) : 0
  const previewGoldGm = activeBuyRate > 0 ? (parsedBuyAmount / activeBuyRate) : 0

  // Live calculations for Sell modal
  const parsedSellGm = parseFloat(sellGrams) || 0
  const activeSellRate = sellMetal === 'gold_22k' ? currentLiveRate : currentSilverRate
  const previewSellPayout = parsedSellGm * activeSellRate

  // Live calculations for Convert AUG Coins modal
  const parsedConvertAmount = parseFloat(convertAmount) || 0
  const previewConvertCoins = Math.round(parsedConvertAmount * 100)
  const previewConvertMg = currentLiveMgRate > 0 ? (parsedConvertAmount / currentLiveMgRate) : 0
  const previewConvertGm = currentLiveRate > 0 ? (parsedConvertAmount / currentLiveRate) : 0
  const userAugCoins = Number(kpis.aug_coins_balance ?? 0)
  const userAugInr = Number(kpis.aug_balance_inr ?? 0)
  const hasEnoughCoins = userAugCoins >= previewConvertCoins

  // Filtered transactions for Transactions View
  const filteredTransactions = transactions.filter(tx => {
    if (txFilter === 'all') return true
    const typeStr = (tx.type || '').toLowerCase()
    if (txFilter === 'buy') return typeStr.includes('buy') || typeStr.includes('convert') || typeStr.includes('recharge')
    if (txFilter === 'sell') return typeStr.includes('sell')
    return true
  })

  const customerName = data?.customer?.name || currentUser.name
  const customerRole = data?.customer?.role || currentUser.role

  return (
    <div className="dg-layout">
      {/* ── 1. LEFT SIDEBAR (Dark Teal #0A3E42, Fixed on Left) ── */}
      <aside className={`dg-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dg-sidebar-top">
          {/* Logo brand */}
          <div className="dg-brand-row" onClick={() => { setCurrentView('dashboard'); navigate('/digi-gold'); }}>
            <img
              src="/Aadhirai-Logo.png"
              alt="Athirai"
              style={{ height: 38, width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div>
              <div className="dg-brand-title">Athirai Digi Gold</div>
              <div className="dg-brand-subtitle">Secure Your Tomorrow</div>
            </div>
          </div>

          {/* Live Holdings Mini Badge in Sidebar (Auto-rotating 3s Gold <-> 3s Silver) */}
          <div className={`dg-sidebar-wallet-badge rotating ${sidebarRotatingMetal}`}>
            <div className="dg-sidebar-wallet-top">
              <span className="dg-sidebar-wallet-label">
                <span className={`dg-badge-pulse-dot ${sidebarRotatingMetal}`} />
                {sidebarRotatingMetal === 'gold' ? '22K Gold Vault' : 'Digi Silver Vault'}
              </span>
              <span className={`dg-sidebar-wallet-tag ${sidebarRotatingMetal}`}>
                {sidebarRotatingMetal === 'gold'
                  ? `₹${Number(currentLiveRate).toLocaleString('en-IN')}/g`
                  : `₹${Number(currentSilverRate).toFixed(2)}/g`}
              </span>
            </div>
            <div className="dg-sidebar-wallet-val">
              {sidebarRotatingMetal === 'gold'
                ? `${Number(kpis.total_gold_holding_gm ?? 0).toFixed(3)} g`
                : '0.000 g'}
            </div>
            <div className="dg-sidebar-wallet-sub">
              {sidebarRotatingMetal === 'gold'
                ? `≈ ₹ ${Number(kpis.gold_value_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} • Athirai 916`
                : '≈ ₹ 0.00 • Pure 999 Hallmark'}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="dg-nav">
            <button
              className={`dg-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              type="button"
              onClick={() => setCurrentView('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={handleOpenBuyModal}
            >
              <ShoppingCart size={18} />
              <span>Buy Gold</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={handleOpenSellModal}
            >
              <ArrowUpFromLine size={18} />
              <span>Sell Gold</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => { setConvertFeedback(null); setShowConvertModal(true) }}
            >
              <ArrowLeftRight size={18} />
              <span>Convert Coins</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => setShowExcelModal(true)}
            >
              <WalletCards size={18} />
              <span>Gold Vault Sheet</span>
            </button>
            <button
              className={`dg-nav-btn ${currentView === 'transactions' ? 'active' : ''}`}
              type="button"
              onClick={() => setCurrentView('transactions')}
            >
              <History size={18} />
              <span>Transactions</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => navigate('/collection/all')}
            >
              <Package size={18} />
              <span>Orders</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => alert('Digi Gold Rewards: Earn coins & purity bonus on every 22K gold transaction!')}
            >
              <Gift size={18} />
              <span>Rewards</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => navigate('/profile')}
            >
              <UserRound size={18} />
              <span>Profile</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => alert('24/7 Dedicated Digi Gold Support: support@athirai.com')}
            >
              <Headphones size={18} />
              <span>Support</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Promotional Card */}
        <div>
          <div className="dg-sidebar-promo">
            <div className="dg-promo-img-wrap">
              <img src="/digi-gold/bangles.jpg" alt="Athirai 22K Gold" />
            </div>
            <div className="dg-promo-h">Real Gold.<br />Digital Convenience.</div>
            <div className="dg-promo-p">Invest in 22K gold, build your family's future.</div>
            <button
              className="dg-promo-cta"
              type="button"
              onClick={() => navigate('/collection/coins')}
            >
              <span>Explore Gold</span>
              <span>→</span>
            </button>
          </div>

          <div className="dg-sidebar-footer">
            <span className="dg-footer-version">Digi Gold v1.0</span>
            <span className="dg-footer-cr">© 2026 Athirai. All rights reserved.</span>
          </div>
        </div>
      </aside>

      {/* ── 2. MAIN SHELL ── */}
      <div className="dg-main-shell">
        {/* TOP HEADER */}
        <header className="dg-header">
          <div className="dg-search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search gold, transactions, or anything..."
            />
          </div>

          <div className="dg-header-right">
            <button
              className="dg-back-store-btn"
              type="button"
              onClick={() => navigate('/')}
              title="Return to Jewellery Store"
            >
              <ArrowLeft size={15} />
              <span>Athirai Store</span>
            </button>

            <button
              className="dg-bell-btn"
              type="button"
              aria-label="Notifications"
              onClick={() => alert('No new notifications')}
            >
              <Bell size={18} />
              <span className="dg-red-dot" />
            </button>

            {/* Profile Chip (Navigates to /profile on click) */}
            <div
              className="dg-profile-chip"
              onClick={() => navigate('/profile')}
              title="View Profile Details"
            >
              <div className="dg-avatar">
                {customerName ? customerName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="dg-profile-info">
                <span className="dg-profile-name">{customerName}</span>
                <span className="dg-profile-role">{customerRole}</span>
              </div>
              <ChevronDown size={14} color="#647474" />
            </div>
          </div>
        </header>

        {/* ── 3. MAIN DASHBOARD CONTENT (SWITCHES BETWEEN DASHBOARD AND TRANSACTIONS VIEW) ── */}
        <main className="dg-content">
          {currentView === 'transactions' ? (
            /* ══════════════════════════════════════════════════════════════
               DEDICATED TRANSACTIONS VIEW (Real-Time Holdings & Records)
               ══════════════════════════════════════════════════════════════ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('dashboard')}
                    style={{
                      background: 'none', border: 'none', color: '#009957', fontWeight: 800,
                      fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6
                    }}
                  >
                    <ArrowLeft size={16} /> Back to Dashboard
                  </button>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0A3E42' }}>
                    Digi Gold Transactions &amp; Vault History
                  </h2>
                  <p style={{ margin: '4px 0 0', color: '#647474', fontSize: 13 }}>
                    Live records of all 22K gold purchases, recharge conversions, and sales.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleOpenBuyModal}
                    style={{
                      padding: '10px 18px', borderRadius: 12, background: '#009957', color: '#fff',
                      fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <ShoppingCart size={16} /> + Buy Gold
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSellModal}
                    style={{
                      padding: '10px 18px', borderRadius: 12, background: '#FFFFFF', color: '#E45B5B',
                      border: '1.5px solid #E45B5B', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <ArrowUpFromLine size={16} /> Sell Gold
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExcelModal(true)}
                    style={{
                      padding: '10px 18px', borderRadius: 12, background: '#0A3E42', color: '#C6924B',
                      border: '1px solid #C6924B', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <ArrowLeftRight size={16} /> Valuation Sheet
                  </button>
                </div>
              </div>

              {/* KPI Summary Strip */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14,
                background: '#FFFFFF', padding: 18, borderRadius: 16, border: '1px solid #E6ECEA',
                boxShadow: '0 4px 16px rgba(10,62,66,0.04)'
              }}>
                <div>
                  <small style={{ color: '#647474', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Vault Holdings</small>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#009957', marginTop: 2 }}>
                    {Number(kpis.total_gold_holding_gm ?? 0).toFixed(3)} g
                  </div>
                  <small style={{ color: '#647474', fontSize: 11 }}>({Number(kpis.total_gold_holding_mg ?? 0).toFixed(2)} mg)</small>
                </div>
                <div>
                  <small style={{ color: '#647474', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Current Valuation</small>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0A3E42', marginTop: 2 }}>
                    ₹ {Number(kpis.gold_value_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <small style={{ color: '#009957', fontWeight: 700, fontSize: 11 }}>@ ₹{currentLiveRate}/g (22K)</small>
                </div>
                <div>
                  <small style={{ color: '#647474', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Total Invested</small>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0A3E42', marginTop: 2 }}>
                    ₹ {Number(kpis.total_invested_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <small style={{ color: '#647474', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Net Profit / Growth</small>
                  <div style={{ fontSize: 20, fontWeight: 900, color: Number(kpis.total_returns_inr ?? 0) >= 0 ? '#009957' : '#E45B5B', marginTop: 2 }}>
                    {Number(kpis.total_returns_inr ?? 0) >= 0 ? '+' : ''}₹ {Number(kpis.total_returns_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <small style={{ color: '#009957', fontWeight: 800, fontSize: 11 }}>
                    ({Number(kpis.returns_percentage ?? 0) >= 0 ? '+' : ''}{Number(kpis.returns_percentage ?? 0).toFixed(2)}%)
                  </small>
                </div>
              </div>

              {/* Transactions Table Card */}
              <div className="dg-card" style={{ padding: 20 }}>
                {/* Filters */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ id: 'all', label: `All Transactions (${transactions.length})` }, { id: 'buy', label: 'Purchases & Converts' }, { id: 'sell', label: 'Sales' }].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTxFilter(tab.id)}
                        style={{
                          padding: '7px 14px', borderRadius: 999, border: txFilter === tab.id ? '1.5px solid #009957' : '1px solid #D1DFDE',
                          background: txFilter === tab.id ? '#E8F7F0' : '#FFFFFF', color: txFilter === tab.id ? '#009957' : '#0A3E42',
                          fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s ease'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="dg-table-wrap">
                  <table className="dg-table">
                    <thead>
                      <tr>
                        <th>Txn ID</th>
                        <th>Date &amp; Time</th>
                        <th>Transaction Type</th>
                        <th>Amount (₹)</th>
                        <th>Gold Rate (₹/g)</th>
                        <th>Hold Gold (g)</th>
                        <th>Current Valuation (₹)</th>
                        <th>Growth / Profit (₹)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#647474' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0A3E42', marginBottom: 6 }}>
                              No Transactions Found
                            </div>
                            <div style={{ fontSize: 12.5, marginBottom: 16 }}>
                              You haven't made any 22K digital gold transactions yet. Start investing today from ₹10!
                            </div>
                            <button
                              type="button"
                              onClick={handleOpenBuyModal}
                              style={{
                                padding: '9px 18px', borderRadius: 10, background: '#009957', color: '#fff',
                                fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer'
                              }}
                            >
                              + Buy 22K Gold Now
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx, idx) => (
                          <tr key={tx.id || idx}>
                            <td className="dg-table-txnid">
                              <span className="dg-txnid-badge" title={tx.transaction_id || `BB#${tx.id}`}>
                                {tx.transaction_id || `BB#${tx.id}`}
                              </span>
                            </td>
                            <td className="dg-table-date">
                              <strong>{tx.date}</strong>
                              <span style={{ display: 'block', fontSize: 11, color: '#8E9E9C' }}>{tx.time}</span>
                            </td>
                            <td className="dg-table-type">
                              <span style={{
                                color: (tx.type || '').toLowerCase().includes('sell') ? '#E45B5B' : '#009957',
                                fontWeight: 800
                              }}>
                                {tx.type}
                              </span>
                            </td>
                            <td style={{ fontWeight: 800 }}>
                              ₹ {Number(tx.recharge || 0).toLocaleString('en-IN')}
                            </td>
                            <td>
                              ₹ {Number(tx.gold_price || currentLiveRate).toLocaleString('en-IN')}/g
                            </td>
                            <td style={{ fontWeight: 800, color: '#0A3E42' }}>
                              {Number(tx.gm || (tx.hold_gold_mg ? tx.hold_gold_mg / 1000 : 0)).toFixed(3)} g
                            </td>
                            <td>
                              ₹ {Number(tx.current_growth || (tx.hold_gold_mg ? tx.hold_gold_mg * currentLiveMgRate : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{
                              fontWeight: 800,
                              color: Number(tx.profit || 0) >= 0 ? '#009957' : '#E45B5B'
                            }}>
                              {Number(tx.profit || 0) >= 0 ? '+' : ''}₹ {Number(tx.profit || 0).toFixed(2)}
                            </td>
                            <td>
                              <span className="dg-status-pill completed">{tx.status || 'Completed'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               STANDARD DASHBOARD OVERVIEW
               ══════════════════════════════════════════════════════════════ */
            <>
              {/* TOP HERO WELCOME CARD */}
              <section className="dg-hero-card">
                <div className="dg-hero-left">
                  <span className="dg-hero-kicker">WELCOME BACK</span>
                  <h1 className="dg-hero-title">{customerName}!</h1>
                  <p className="dg-hero-sub">Your trusted partner in digital gold investment.</p>
                  <div className="dg-hero-tags">Buy • Sell • Save • Grow</div>
                  <button
                    className="dg-hero-cta"
                    type="button"
                    onClick={() => navigate('/collection/coins')}
                  >
                    <span>Explore Gold</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="dg-hero-visual">
                  <img src="/digi-gold/hero.jpg" alt="Athirai 22K Digital Gold" />
                </div>

                <div className="dg-hero-rate-pill">
                  {/* 22K Gold Price */}
                  <div className="dg-hero-rate-item">
                    <div className="dg-rate-pill-head">
                      <span className="dg-rate-pill-label">Gold Price (22K)</span>
                      <span className="dg-rate-pill-badge gold">ATHIRAI 916</span>
                    </div>
                    <div className="dg-rate-pill-val">
                      ₹ {Number(currentLiveRate).toLocaleString('en-IN')} <span>/g</span>
                    </div>
                    <div className="dg-rate-pill-change">
                      ▲ +{rates.pct_22k || 0.78}% (₹ {(rates.diff_22k || 110.00).toFixed(2)})
                    </div>
                  </div>

                  <div className="dg-hero-rate-divider" />

                  {/* Digi Silver Price */}
                  <div className="dg-hero-rate-item">
                    <div className="dg-rate-pill-head">
                      <span className="dg-rate-pill-label">Digi Silver Price</span>
                      <span className="dg-rate-pill-badge silver">PURE 999</span>
                    </div>
                    <div className="dg-rate-pill-val">
                      ₹ {Number(currentSilverRate).toFixed(2)} <span>/g</span>
                    </div>
                    <div className="dg-rate-pill-change">
                      ▲ +{rates.pct_silver || 3.00}% (₹ {(rates.diff_silver || 8.00).toFixed(2)})
                    </div>
                  </div>
                </div>
              </section>

              {/* AUG STORE COINS TO DIGI GOLD CONVERT STRIP */}
              <div className="dg-coin-convert-banner">
                <div className="dg-ccb-left">
                  <div className="dg-ccb-badge">
                    <Coins size={18} />
                    <span>AUG STORE COINS</span>
                  </div>
                  <div className="dg-ccb-text">
                    <div className="dg-ccb-balance-line">
                      <span className="dg-ccb-coins">{Number(kpis.aug_coins_balance ?? 0).toLocaleString()} Coins</span>
                      <span className="dg-ccb-inr">(≈ ₹{Number(kpis.aug_balance_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                    </div>
                    <p className="dg-ccb-hint">
                      AUG Coins are used for jewelry shopping. Convert into 22K Digi Gold anytime to build real gold wealth with live market gains!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dg-ccb-action-btn"
                  onClick={() => { setConvertFeedback(null); setShowConvertModal(true); }}
                >
                  <ArrowLeftRight size={16} />
                  <span>Convert to 22K Digi Gold</span>
                </button>
              </div>

              {/* 4 KPI CARDS (Real Values from DB) */}
              <section className="dg-kpi-grid">
                {/* 1. Total Gold Holding */}
                <div className="dg-kpi-card" onClick={() => setCurrentView('transactions')}>
                  <div className="dg-kpi-icon-wrap gold">
                    <Coins size={24} />
                  </div>
                  <div className="dg-kpi-body">
                    <span className="dg-kpi-label">Total Gold Holding</span>
                    <span className="dg-kpi-val">{Number(kpis.total_gold_holding_gm ?? 0).toFixed(3)} g</span>
                    <span className="dg-kpi-sub">≈ ₹ {Number(kpis.gold_value_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 2. Digi Gold Vault Valuation */}
                <div className="dg-kpi-card" onClick={() => setShowExcelModal(true)}>
                  <div className="dg-kpi-icon-wrap wallet">
                    <Wallet size={24} />
                  </div>
                  <div className="dg-kpi-body">
                    <span className="dg-kpi-label">Gold Vault Value</span>
                    <span className="dg-kpi-val">₹ {Number(kpis.gold_value_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className="dg-kpi-sub">@ ₹{Number(currentLiveRate).toLocaleString('en-IN')}/g (Live 22K)</span>
                  </div>
                  <ChevronRight size={18} className="dg-kpi-chevron" />
                </div>

                {/* 3. Total Invested */}
                <div className="dg-kpi-card" onClick={() => setCurrentView('transactions')}>
                  <div className="dg-kpi-icon-wrap invested">
                    <TrendingUp size={24} />
                  </div>
                  <div className="dg-kpi-body">
                    <span className="dg-kpi-label">Total Invested</span>
                    <span className="dg-kpi-val">₹ {Number(kpis.total_invested_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <ChevronRight size={18} className="dg-kpi-chevron" />
                </div>

                {/* 4. Total Returns */}
                <div className="dg-kpi-card" onClick={() => setCurrentView('transactions')}>
                  <div className="dg-kpi-icon-wrap returns">
                    <BarChart3 size={24} />
                  </div>
                  <div className="dg-kpi-body">
                    <span className="dg-kpi-label">Total Returns</span>
                    <span className="dg-kpi-val">₹ {Number(kpis.total_returns_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className="dg-kpi-pill">
                      {Number(kpis.returns_percentage ?? 0) >= 0 ? '+' : ''}{Number(kpis.returns_percentage ?? 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </section>

              {/* MIDDLE GRID: CHART + QUICK ACTIONS + MARKET RATES */}
              <section className="dg-middle-grid">
                {/* Gold Price Trend Card */}
                <div className="dg-card">
                  <div className="dg-card-head">
                    <div className="dg-card-title-group">
                      <div className="dg-card-icon-pill">
                        <TrendingUp size={16} />
                      </div>
                      <h3 className="dg-card-title">Gold Price Trend (22K)</h3>
                    </div>
                    <div className="dg-pill-tabs">
                      {['1D', '1W', '1M', '3M', '1Y'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          className={`dg-pill-tab ${activeTab === tab ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="dg-chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        key={activeTab}
                        data={activeChartData}
                        margin={{ top: 12, right: 14, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#009957" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#009957" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="time"
                          stroke="#8E9E9C"
                          fontSize={11.5}
                          tickLine={false}
                          axisLine={{ stroke: '#E6ECEA' }}
                        />
                        <YAxis
                          stroke="#8E9E9C"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#E6ECEA' }}
                          domain={chartYDomain}
                          tickFormatter={val => '₹' + Number(val).toLocaleString('en-IN')}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload
                              return (
                                <div style={{
                                  backgroundColor: '#FFFFFF',
                                  borderRadius: '12px',
                                  border: '1.5px solid rgba(0, 153, 87, 0.22)',
                                  boxShadow: '0 8px 24px rgba(10, 62, 66, 0.12)',
                                  padding: '10px 14px',
                                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                                }}>
                                  <div style={{ fontSize: '11px', color: '#6A8280', fontWeight: 600, marginBottom: '4px' }}>
                                    {item.fullDate || item.time}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0A3E42' }}>22K Gold :</span>
                                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#009957' }}>
                                      ₹ {Number(item.price).toLocaleString('en-IN')} <span style={{ fontSize: '11px', fontWeight: 600, color: '#6A8280' }}>/g</span>
                                    </span>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#009957"
                          strokeWidth={2.8}
                          fillOpacity={1}
                          fill="url(#goldGradient)"
                          isAnimationActive={true}
                          animationDuration={650}
                          animationEasing="ease-in-out"
                          dot={{ r: 3.5, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                          activeDot={{ r: 6, fill: '#009957', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="dg-card">
                  <div className="dg-card-head">
                    <h3 className="dg-card-title">Quick Actions</h3>
                  </div>
                  <div className="dg-qa-grid">
                    <button
                      className="dg-qa-btn"
                      type="button"
                      onClick={handleOpenBuyModal}
                    >
                      <div className="dg-qa-icon buy">
                        <ShoppingCart size={20} />
                      </div>
                      <span>Buy Gold</span>
                    </button>

                    <button
                      className="dg-qa-btn"
                      type="button"
                      onClick={handleOpenSellModal}
                    >
                      <div className="dg-qa-icon sell">
                        <ArrowUpFromLine size={20} />
                      </div>
                      <span>Sell Gold</span>
                    </button>

                    <button
                      className="dg-qa-btn"
                      type="button"
                      onClick={() => { setConvertFeedback(null); setShowConvertModal(true); }}
                    >
                      <div className="dg-qa-icon wallet" style={{ background: 'rgba(0,153,87,0.12)', color: '#009957' }}>
                        <Coins size={20} />
                      </div>
                      <span>Convert Coins</span>
                    </button>

                    <button
                      className="dg-qa-btn"
                      type="button"
                      onClick={() => setShowExcelModal(true)}
                    >
                      <div className="dg-qa-icon transfer">
                        <ArrowLeftRight size={20} />
                      </div>
                      <span>Investment Sheet</span>
                    </button>
                  </div>
                </div>

                {/* Market Rates Card (22K Gold Athirai First) */}
                <div className="dg-card">
                  <div className="dg-card-head">
                    <h3 className="dg-card-title">Market Rates</h3>
                    <span className="dg-link-more" onClick={() => setShowExcelModal(true)}>
                      View All →
                    </span>
                  </div>

                  <div className="dg-rates-list">
                    {/* 22K Gold (Athirai Primary Digi Gold) */}
                    <div className="dg-rate-card-item gold">
                      <div className="dg-rate-item-left">
                        <div className="dg-rate-coin gold">22K</div>
                        <div className="dg-rate-item-info">
                          <div className="dg-rate-item-name">Gold (22K)</div>
                          <div className="dg-rate-hallmark-tag gold">ATHIRAI 916 HALLMARK</div>
                        </div>
                      </div>
                      <div className="dg-rate-item-right">
                        <div className="dg-rate-item-price">
                          <span className="dg-rate-currency">₹</span>
                          <span className="dg-rate-num">{Number(currentLiveRate).toLocaleString('en-IN')}</span>
                          <span className="dg-rate-unit">/g</span>
                        </div>
                        <div className="dg-rate-item-pct positive">▲ +{rates.pct_22k || 0.78}%</div>
                      </div>
                    </div>

                    {/* Digi Silver */}
                    <div className="dg-rate-card-item silver">
                      <div className="dg-rate-item-left">
                        <div className="dg-rate-coin silver">Ag</div>
                        <div className="dg-rate-item-info">
                          <div className="dg-rate-item-name">Digi Silver</div>
                          <div className="dg-rate-hallmark-tag silver">PURE 999 HALLMARK</div>
                        </div>
                      </div>
                      <div className="dg-rate-item-right">
                        <div className="dg-rate-item-price">
                          <span className="dg-rate-currency">₹</span>
                          <span className="dg-rate-num">{Number(currentSilverRate).toFixed(2)}</span>
                          <span className="dg-rate-unit">/g</span>
                        </div>
                        <div className="dg-rate-item-pct positive">▲ +{rates.pct_silver || 3.00}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* BOTTOM GRID: RECENT TRANSACTIONS + REWARDS + QUICK INFO */}
              <section className="dg-bottom-grid">
                {/* Recent Transactions Card */}
                <div className="dg-card">
                  <div className="dg-card-head">
                    <h3 className="dg-card-title">Recent Transactions</h3>
                    <span className="dg-link-more" onClick={() => setCurrentView('transactions')}>
                      View All →
                    </span>
                  </div>

                  <div className="dg-table-wrap">
                    <table className="dg-table">
                      <thead>
                        <tr>
                          <th>Txn ID</th>
                          <th>Date &amp; Time</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '24px 16px' }}>
                              <div className="dg-empty-tx-container">
                                <div className="dg-empty-tx-icon-wrap">
                                  <Coins size={28} strokeWidth={2.2} />
                                </div>
                                <div className="dg-empty-tx-title">No Transactions Yet</div>
                                <p className="dg-empty-tx-desc">
                                  Convert your store coins or invest in 22K Digital Gold from just ₹10!
                                </p>
                                <div className="dg-empty-tx-actions">
                                  <button
                                    type="button"
                                    className="dg-empty-btn convert"
                                    onClick={() => { setConvertFeedback(null); setShowConvertModal(true); }}
                                  >
                                    <ArrowLeftRight size={13} />
                                    <span>Convert Coins</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="dg-empty-btn buy"
                                    onClick={handleOpenBuyModal}
                                  >
                                    <ShoppingCart size={13} />
                                    <span>Buy 22K Gold</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          transactions.slice(0, 5).map((tx, idx) => (
                            <tr key={tx.id || idx}>
                              <td className="dg-table-txnid">
                                <span className="dg-txnid-badge" title={tx.transaction_id || `BB#${tx.id}`}>
                                  {tx.transaction_id || `BB#${tx.id}`}
                                </span>
                              </td>
                              <td className="dg-table-date">
                                {tx.date}, {tx.time}
                              </td>
                              <td className="dg-table-type">{tx.type}</td>
                              <td>{tx.amount_str || `${tx.gm} g`}</td>
                              <td>
                                <span className="dg-status-pill completed">{tx.status || 'Completed'}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Digi Gold Rewards Card (Athirai Privilege Club - Full Height & Ultra-Luxury) */}
                <div className="dg-rewards-card">
                  <div className="dg-rewards-glow-orb" />

                  <div>
                    <div className="dg-rewards-card-header">
                      <div className="dg-rewards-badge">
                        <Sparkles size={13} className="dg-rewards-badge-icon" />
                        <span>Athirai Privilege Club</span>
                      </div>
                      <span className="dg-rewards-tier-tag">VIP BENEFITS</span>
                    </div>

                    <div className="dg-rewards-hero-row">
                      <div className="dg-rewards-title-area">
                        <h3 className="dg-rewards-h">
                          Earn More with <br />
                          <span className="dg-rewards-h-highlight">Digi Gold Rewards</span>
                        </h3>
                        <p className="dg-rewards-p">
                          Exclusive benefits &amp; insured vault storage on every 22K gold purchase.
                        </p>
                      </div>
                      <div className="dg-rewards-visual">
                        <img src="/digi-gold/rewards.jpg" alt="Digi Gold Rewards" />
                        <div className="dg-rewards-visual-badge">916 BIS</div>
                      </div>
                    </div>

                    <div className="dg-rewards-perks-grid">
                      <div className="dg-rewards-perk-item">
                        <span className="dg-rewards-perk-dot">✦</span>
                        <span>100% BIS Hallmarked 22K Purity</span>
                      </div>
                      <div className="dg-rewards-perk-item">
                        <span className="dg-rewards-perk-dot">✦</span>
                        <span>Zero Making &amp; Free Vault Storage</span>
                      </div>
                    </div>
                  </div>

                  <div className="dg-rewards-footer">
                    <button
                      className="dg-rewards-cta"
                      type="button"
                      onClick={() => navigate('/collection/coins')}
                    >
                      <span>Explore Rewards</span>
                      <ArrowRight size={14} />
                    </button>
                    <button
                      className="dg-rewards-secondary-btn"
                      type="button"
                      onClick={handleOpenBuyModal}
                    >
                      <span>Buy Gold</span>
                    </button>
                  </div>
                </div>

                {/* Quick Info Card */}
                <div className="dg-card">
                  <div className="dg-card-head">
                    <h3 className="dg-card-title">Quick Info</h3>
                  </div>

                  <div className="dg-info-list">
                    <div className="dg-info-item" onClick={handleOpenBuyModal}>
                      <div className="dg-info-left">
                        <div className="dg-info-icon">
                          <ShoppingCart size={15} />
                        </div>
                        <div>
                          <div className="dg-info-title">How to Buy Gold?</div>
                          <div className="dg-info-sub">Learn more</div>
                        </div>
                      </div>
                      <ChevronRight size={15} className="dg-info-chevron" />
                    </div>

                    <div className="dg-info-item" onClick={() => alert('100% Guaranteed 22K BIS Hallmarked physical gold stored safely in insured vaults.')}>
                      <div className="dg-info-left">
                        <div className="dg-info-icon">
                          <ShieldCheck size={15} />
                        </div>
                        <div>
                          <div className="dg-info-title">Gold Purity &amp; Safety</div>
                          <div className="dg-info-sub">100% Assured</div>
                        </div>
                      </div>
                      <ChevronRight size={15} className="dg-info-chevron" />
                    </div>

                    <div className="dg-info-item" onClick={() => alert('24/7 Dedicated Support: support@athirai.com')}>
                      <div className="dg-info-left">
                        <div className="dg-info-icon">
                          <Headphones size={15} />
                        </div>
                        <div>
                          <div className="dg-info-title">Customer Support</div>
                          <div className="dg-info-sub">24/7 Help</div>
                        </div>
                      </div>
                      <ChevronRight size={15} className="dg-info-chevron" />
                    </div>

                    <div className="dg-info-item" onClick={() => setShowExcelModal(true)}>
                      <div className="dg-info-left">
                        <div className="dg-info-icon">
                          <CircleHelp size={15} />
                        </div>
                        <div>
                          <div className="dg-info-title">Formula &amp; FAQ</div>
                          <div className="dg-info-sub">Get Answers</div>
                        </div>
                      </div>
                      <ChevronRight size={15} className="dg-info-chevron" />
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* ── MODAL: BUY 22K GOLD / DIGI SILVER ── */}
      {showBuyModal && (
        <div className="dg-modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="dg-modal-box" onClick={e => e.stopPropagation()}>
            <div className="dg-modal-head">
              <h3 className="dg-modal-title">Buy {buyMetal === 'gold_22k' ? '22K Digital Gold' : 'Digi Silver'}</h3>
              <button className="dg-modal-close" onClick={() => setShowBuyModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Metal Selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setBuyMetal('gold_22k')}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 10,
                  border: `2px solid ${buyMetal === 'gold_22k' ? '#009957' : '#E6ECEA'}`,
                  background: buyMetal === 'gold_22k' ? 'rgba(0,153,87,0.1)' : '#FFF',
                  color: buyMetal === 'gold_22k' ? '#009957' : '#647474',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer'
                }}
              >
                22K Gold (Athirai 916)
              </button>
              <button
                type="button"
                onClick={() => setBuyMetal('silver_999')}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 10,
                  border: `2px solid ${buyMetal === 'silver_999' ? '#0A3E42' : '#E6ECEA'}`,
                  background: buyMetal === 'silver_999' ? 'rgba(10,62,66,0.1)' : '#FFF',
                  color: buyMetal === 'silver_999' ? '#0A3E42' : '#647474',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer'
                }}
              >
                Digi Silver (Pure 999)
              </button>
            </div>

            <div className="dg-modal-rate-badge">
              <span className="dg-modal-rate-label">Live {buyMetal === 'gold_22k' ? '22K Gold' : 'Digi Silver'} Rate:</span>
              <span className="dg-modal-rate-val">
                {buyMetal === 'gold_22k'
                  ? `₹ ${currentLiveRate.toLocaleString('en-IN')}/g (₹ ${currentLiveMgRate.toFixed(2)}/mg)`
                  : `₹ ${currentSilverRate.toFixed(2)}/g`}
              </span>
            </div>

            <ModalFeedbackNotice
              feedback={buyFeedback}
              onDismiss={() => setBuyFeedback(null)}
              onRecharge={() => { setShowBuyModal(false); navigate('/recharge'); }}
              onSwitchUPI={() => { setBuyPaymentMethod('razorpay'); setBuyFeedback(null); }}
            />

            <form onSubmit={handleBuyGold}>
              <label className="dg-input-label">Select Amount (₹):</label>
              <div className="dg-amount-presets">
                {['100', '500', '1000', '5000'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`dg-preset-btn ${buyAmount === p ? 'active' : ''}`}
                    onClick={() => setBuyAmount(p)}
                  >
                    ₹{p}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                step="any"
                className="dg-form-input"
                value={buyAmount}
                onChange={e => setBuyAmount(e.target.value)}
                placeholder="Enter custom amount in ₹"
                required
              />

              <div className="dg-calc-preview">
                <span className="dg-calc-label">You Will Receive:</span>
                <span className="dg-calc-val">
                  {buyMetal === 'gold_22k'
                    ? `${previewGoldGm.toFixed(4)} g (${previewGoldMg.toFixed(2)} mg) of 22K pure gold`
                    : `${previewGoldGm.toFixed(3)} g of Pure 999 silver`}
                </span>
              </div>

              <label className="dg-input-label">Payment Method:</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <label style={{
                  flex: 1, padding: '10px 12px', border: `1.5px solid ${buyPaymentMethod === 'wallet' ? '#009957' : '#E6ECEA'}`,
                  borderRadius: '10px', background: buyPaymentMethod === 'wallet' ? '#E8F7F0' : '#FFF',
                  cursor: 'pointer', fontSize: '12.5px', fontWeight: '700', color: '#0A3E42', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <input
                    type="radio"
                    name="payMethod"
                    checked={buyPaymentMethod === 'wallet'}
                    onChange={() => setBuyPaymentMethod('wallet')}
                  />
                  Recharge Balance (₹)
                </label>
                <label style={{
                  flex: 1, padding: '10px 12px', border: `1.5px solid ${buyPaymentMethod === 'razorpay' ? '#009957' : '#E6ECEA'}`,
                  borderRadius: '10px', background: buyPaymentMethod === 'razorpay' ? '#E8F7F0' : '#FFF',
                  cursor: 'pointer', fontSize: '12.5px', fontWeight: '700', color: '#0A3E42', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <input
                    type="radio"
                    name="payMethod"
                    checked={buyPaymentMethod === 'razorpay'}
                    onChange={() => setBuyPaymentMethod('razorpay')}
                  />
                  UPI / Netbanking
                </label>
              </div>

              <button
                type="submit"
                className="dg-modal-submit-btn"
                disabled={submittingBuy || parsedBuyAmount <= 0}
              >
                {submittingBuy ? 'Processing Purchase…' : `Pay ₹${parsedBuyAmount.toLocaleString('en-IN')} & Invest in ${buyMetal === 'gold_22k' ? '22K Gold' : 'Digi Silver'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SELL 22K GOLD / DIGI SILVER ── */}
      {showSellModal && (
        <div className="dg-modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="dg-modal-box" onClick={e => e.stopPropagation()}>
            <div className="dg-modal-head">
              <h3 className="dg-modal-title">Sell {sellMetal === 'gold_22k' ? '22K Digital Gold' : 'Digi Silver'}</h3>
              <button className="dg-modal-close" onClick={() => setShowSellModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Metal Selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setSellMetal('gold_22k')}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 10,
                  border: `2px solid ${sellMetal === 'gold_22k' ? '#009957' : '#E6ECEA'}`,
                  background: sellMetal === 'gold_22k' ? 'rgba(0,153,87,0.1)' : '#FFF',
                  color: sellMetal === 'gold_22k' ? '#009957' : '#647474',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer'
                }}
              >
                22K Gold (Athirai 916)
              </button>
              <button
                type="button"
                onClick={() => setSellMetal('silver_999')}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 10,
                  border: `2px solid ${sellMetal === 'silver_999' ? '#0A3E42' : '#E6ECEA'}`,
                  background: sellMetal === 'silver_999' ? 'rgba(10,62,66,0.1)' : '#FFF',
                  color: sellMetal === 'silver_999' ? '#0A3E42' : '#647474',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer'
                }}
              >
                Digi Silver (Pure 999)
              </button>
            </div>

            <div className="dg-modal-rate-badge">
              <span className="dg-modal-rate-label">Live Selling Price ({sellMetal === 'gold_22k' ? '22K Gold' : 'Digi Silver'}):</span>
              <span className="dg-modal-rate-val">
                ₹ {sellMetal === 'gold_22k' ? Number(currentLiveRate).toLocaleString('en-IN') : Number(currentSilverRate).toFixed(2)}/g
              </span>
            </div>

            <ModalFeedbackNotice
              feedback={sellFeedback}
              onDismiss={() => setSellFeedback(null)}
              onBuyGold={() => { setShowSellModal(false); setShowBuyModal(true); }}
            />

            <form onSubmit={handleSellGold}>
              <label className="dg-input-label">Quantity to Sell (Grams):</label>
              <input
                type="number"
                min="0.001"
                step="any"
                className="dg-form-input"
                value={sellGrams}
                onChange={e => setSellGrams(e.target.value)}
                placeholder="e.g. 0.500"
                required
              />

              <div className="dg-calc-preview">
                <span className="dg-calc-label">You Will Receive:</span>
                <span className="dg-calc-val">
                  ₹ {Math.round(previewSellPayout).toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="submit"
                className="dg-modal-submit-btn"
                style={{ background: '#E45B5B' }}
                disabled={submittingSell || parsedSellGm <= 0}
              >
                {submittingSell ? 'Processing Sale…' : `Sell ${parsedSellGm}g & Credit ₹${Math.round(previewSellPayout).toLocaleString('en-IN')}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONVERT AUG COINS TO 22K DIGI GOLD ── */}
      {showConvertModal && (
        <div className="dg-modal-overlay" onClick={() => setShowConvertModal(false)}>
          <div className="dg-modal-box" onClick={e => e.stopPropagation()}>
            <div className="dg-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0, 153, 87, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#009957' }}>
                  <ArrowLeftRight size={20} />
                </div>
                <div>
                  <h3 className="dg-modal-title" style={{ margin: 0, fontSize: 17 }}>Convert AUG Coins to Digi Gold</h3>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#6A8280' }}>Deducts store coins and creates 22K Digital Gold in your vault</p>
                </div>
              </div>
              <button className="dg-modal-close" onClick={() => setShowConvertModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Balances & Live Rate Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: '10px 12px', background: '#F8FAF9', borderRadius: 12, border: '1px solid #E6ECEA' }}>
                <span style={{ fontSize: 11, color: '#6A8280', fontWeight: 600, display: 'block' }}>Available AUG Coins</span>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0A3E42' }}>
                  {userAugCoins.toLocaleString()} <small style={{ fontSize: 11, color: '#009957', fontWeight: 700 }}>Coins</small>
                </span>
                <span style={{ fontSize: 11, color: '#8E9E9C', display: 'block' }}>≈ ₹ {userAugInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(0,153,87,0.06)', borderRadius: 12, border: '1px solid rgba(0,153,87,0.2)' }}>
                <span style={{ fontSize: 11, color: '#009957', fontWeight: 700, display: 'block' }}>Today's 22K Live Rate</span>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0A3E42' }}>
                  ₹ {Number(currentLiveRate).toLocaleString('en-IN')} <small style={{ fontSize: 11, color: '#6A8280' }}>/g</small>
                </span>
                <span style={{ fontSize: 11, color: '#009957', fontWeight: 600, display: 'block' }}>₹ {Number(currentLiveMgRate).toFixed(2)} /mg • Athirai 916</span>
              </div>
            </div>

            <ModalFeedbackNotice
              feedback={convertFeedback}
              onDismiss={() => setConvertFeedback(null)}
              onRecharge={() => { setShowConvertModal(false); navigate('/recharge'); }}
            />

            <form onSubmit={handleConvertCoins}>
              <label className="dg-input-label">Select Amount to Convert (₹):</label>
              <div className="dg-amount-presets">
                {['500', '1000', '2500', '5000'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`dg-preset-btn ${convertAmount === p ? 'active' : ''}`}
                    onClick={() => setConvertAmount(p)}
                  >
                    ₹{p}
                  </button>
                ))}
                {userAugInr > 0 && (
                  <button
                    type="button"
                    className={`dg-preset-btn ${convertAmount === String(Math.floor(userAugInr)) ? 'active' : ''}`}
                    onClick={() => setConvertAmount(String(Math.floor(userAugInr)))}
                  >
                    Max (₹{Math.floor(userAugInr).toLocaleString()})
                  </button>
                )}
              </div>

              <input
                type="number"
                min="1"
                step="any"
                className="dg-form-input"
                value={convertAmount}
                onChange={e => setConvertAmount(e.target.value)}
                placeholder="Enter custom amount in ₹"
                required
              />

              {/* Conversion Math Breakdown */}
              <div style={{
                background: '#F0F9F5',
                border: '1.5px solid rgba(0,153,87,0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                  <span style={{ color: '#4A5568', fontWeight: 600 }}>AUG Coins to Deduct:</span>
                  <span style={{ fontWeight: 800, color: '#E53E3E' }}>
                    - {previewConvertCoins.toLocaleString()} Coins
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                  <span style={{ color: '#4A5568', fontWeight: 600 }}>22K Digital Gold Added:</span>
                  <span style={{ fontWeight: 800, color: '#009957' }}>
                    + {previewConvertGm.toFixed(4)} g ({previewConvertMg.toFixed(2)} mg)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed rgba(0,153,87,0.3)', fontSize: 12 }}>
                  <span style={{ color: '#6A8280' }}>Purity &amp; Hallmark:</span>
                  <span style={{ fontWeight: 700, color: '#0A3E42' }}>Athirai 916 Hallmark (22K)</span>
                </div>
              </div>

              {!hasEnoughCoins && parsedConvertAmount > 0 && (
                <div style={{
                  padding: '9px 12px',
                  background: '#FFF5F5',
                  border: '1px solid #FEB2B2',
                  borderRadius: 10,
                  color: '#C53030',
                  fontSize: 12,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={15} />
                  <span>Insufficient AUG coins. You have {userAugCoins.toLocaleString()} coins (need {previewConvertCoins.toLocaleString()} coins).</span>
                </div>
              )}

              <button
                type="submit"
                className="dg-modal-submit-btn"
                disabled={submittingConvert || parsedConvertAmount <= 0 || !hasEnoughCoins}
              >
                {submittingConvert ? 'Processing Conversion…' : `Convert ${previewConvertCoins.toLocaleString()} Coins to ${previewConvertGm.toFixed(4)}g 22K Gold`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DETAILED INVESTMENT CALCULATION SHEET (MATCHING IMAGE 2 EXACTLY) ── */}
      {showExcelModal && (
        <div className="dg-modal-overlay" onClick={() => setShowExcelModal(false)}>
          <div className="dg-modal-box large" onClick={e => e.stopPropagation()}>
            <div className="dg-modal-head">
              <div>
                <h3 className="dg-modal-title">Aadhirai Digi Gold Investment &amp; Valuation Sheet</h3>
                <small style={{ color: '#647474', fontSize: '12px' }}>
                  Live mathematical model matching Image 2 reference — Dynamic recalculation with 22K rate
                </small>
              </div>
              <button className="dg-modal-close" onClick={() => setShowExcelModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Summary Top Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '10px',
              background: '#F8FAF9',
              border: '1px solid #D5E5DE',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div>
                <small style={{ color: '#647474', fontSize: '11px', display: 'block' }}>Total Recharge</small>
                <b style={{ color: '#0A3E42', fontSize: '15px' }}>₹ {Number(kpis.total_invested_inr ?? 0).toLocaleString('en-IN')}</b>
              </div>
              <div>
                <small style={{ color: '#647474', fontSize: '11px', display: 'block' }}>Au Mg</small>
                <b style={{ color: '#009957', fontSize: '15px' }}>{Number(kpis.total_gold_holding_mg ?? 0).toFixed(2)}</b>
              </div>
              <div>
                <small style={{ color: '#647474', fontSize: '11px', display: 'block' }}>Au Gm</small>
                <b style={{ color: '#009957', fontSize: '15px' }}>{Number(kpis.total_gold_holding_gm ?? 0).toFixed(3)}</b>
              </div>
              <div>
                <small style={{ color: '#647474', fontSize: '11px', display: 'block' }}>Today's 22K Rate</small>
                <b style={{ color: '#C6924B', fontSize: '15px' }}>₹ {currentLiveRate.toLocaleString('en-IN')}</b>
              </div>
              <div>
                <small style={{ color: '#647474', fontSize: '11px', display: 'block' }}>Current Growth</small>
                <b style={{ color: '#009957', fontSize: '15px' }}>₹ {Number(kpis.gold_value_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
              </div>
              <div>
                <small style={{ color: '#647474', fontSize: '11px', display: 'block' }}>Total Profit</small>
                <b style={{ color: Number(kpis.total_returns_inr ?? 0) >= 0 ? '#009957' : '#E45B5B', fontSize: '15px' }}>
                  {Number(kpis.total_returns_inr ?? 0) >= 0 ? '+' : ''}₹ {Number(kpis.total_returns_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </b>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="dg-excel-table">
                <thead>
                  <tr>
                    <th>Txn ID</th>
                    <th>Date</th>
                    <th>Recharge (₹)</th>
                    <th>Gold Price (₹)</th>
                    <th>Mg Price (₹)</th>
                    <th>Hold Gold (mg)</th>
                    <th>Hold Gold (g)</th>
                    <th>Current Price (₹)</th>
                    <th>Current Mg Price (₹)</th>
                    <th>Current Growth (₹)</th>
                    <th>Profit / Loss (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: '#647474' }}>
                        No investment records yet. Purchases will appear here with live dynamic calculations!
                      </td>
                    </tr>
                  ) : (
                    transactions.map((row, idx) => {
                      const rechargeVal = Number(row.recharge || 0)
                      const goldPriceVal = Number(row.gold_price || currentLiveRate)
                      const mgPriceVal = Number(row.mg_price || (goldPriceVal / 1000))
                      const holdMgVal = Number(row.hold_gold_mg || (mgPriceVal > 0 ? rechargeVal / mgPriceVal : 0))
                      const holdGmVal = Number(row.gm || (holdMgVal / 1000))
                      const currPriceVal = currentLiveRate
                      const currMgPriceVal = currentLiveMgRate
                      const currGrowthVal = roundNum(holdMgVal * currMgPriceVal, 2)
                      const profitVal = roundNum(currGrowthVal - rechargeVal, 2)

                      return (
                        <tr key={row.id || idx}>
                          <td className="dg-table-txnid">
                            <span className="dg-txnid-badge">
                              {row.transaction_id || `BB#${row.id}`}
                            </span>
                          </td>
                          <td>{row.date_excel || row.date}</td>
                          <td>₹ {rechargeVal.toLocaleString('en-IN')}</td>
                          <td>₹ {goldPriceVal.toLocaleString('en-IN')}</td>
                          <td>₹ {mgPriceVal.toFixed(2)}</td>
                          <td>{holdMgVal.toFixed(2)}</td>
                          <td>{holdGmVal.toFixed(3)}</td>
                          <td>₹ {currPriceVal.toLocaleString('en-IN')}</td>
                          <td>₹ {currMgPriceVal.toFixed(2)}</td>
                          <td>₹ {currGrowthVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className={profitVal >= 0 ? 'dg-profit-pos' : 'dg-profit-neg'}>
                            {profitVal >= 0 ? `+₹ ${profitVal.toFixed(2)}` : `-₹ ${Math.abs(profitVal).toFixed(2)}`}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function roundNum(num, dec) {
  return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec)
}
