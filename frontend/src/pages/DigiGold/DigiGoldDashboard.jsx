import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  ArrowRight,
  Download,
  Copy,
  Check,
  Menu,
  FileText,
  BadgePercent,
  Zap,
  Clock,
  Repeat,
  Layers,
  Tag,
  Percent,
  Flame,
  Star,
  Trophy,
  Gem,
  PhoneCall,
  Mail,
  MessageCircle,
  MapPin
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import * as XLSX from 'xlsx'
import api from '../../api'
import './DigiGoldDashboard.css'
import goldCoinImg from '../../assets/gold-coin-transparent.png'

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
              <span>Recharge AUG Revive / Wallet</span>
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

// ── ANIMATED COUNTER COMPONENT (60FPS ZERO-JITTER EASE-OUT CUBIC) ──
function AnimatedNumber({ value, decimals = 0, prefix = '', suffix = '', duration = 650 }) {
  const target = Number(value ?? 0)
  const [displayValue, setDisplayValue] = useState(target)
  const prevRef = useRef(0)

  useEffect(() => {
    const startVal = prevRef.current
    const endVal = isNaN(target) ? 0 : target
    const diff = endVal - startVal
    if (diff === 0) {
      setDisplayValue(endVal)
      return
    }

    let startTimestamp = null
    let rafId

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = startVal + diff * ease
      setDisplayValue(current)

      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        setDisplayValue(endVal)
        prevRef.current = endVal
      }
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  const formatted = displayValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  return (
    <span style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums lining-nums' }}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

// ── RAZORPAY SCRIPT LOADER ──
const loadRazorpay = () => new Promise(resolve => {
  if (typeof window !== 'undefined' && window.Razorpay) {
    resolve(true)
    return
  }
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.async = true
  script.onload = () => resolve(true)
  script.onerror = () => resolve(false)
  document.body.appendChild(script)
})

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
  // ── INSTANT ZERO-LAG INITIAL STATE (WITH SKELETON LOADING) ──
  const [loading, setLoading] = useState(true)
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
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' | 'transactions' | 'valuation' | 'offers' | 'support'
  const [txFilter, setTxFilter] = useState('all') // 'all' | 'buy' | 'sell'
  const [valuationMetal, setValuationMetal] = useState('all') // 'all' | 'gold' | 'silver'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Support & Purity Desk State
  const [supportCategory, setSupportCategory] = useState('autopay')
  const [supportTxnId, setSupportTxnId] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportSubmitted, setSupportSubmitted] = useState(false)
  const [supportTicketId, setSupportTicketId] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  // Modals
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showSellModal, setShowSellModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)

  // Success Popup Modal State (For Buy, Sell, and Convert)
  const [actionSuccessData, setActionSuccessData] = useState(null)
  const [copiedTxn, setCopiedTxn] = useState(false)

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
  const [sellGrams, setSellGrams] = useState('')
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

  // ── AUTOPAY / OFFERS STATE ──
  const [showAutoPayModal, setShowAutoPayModal] = useState(false)
  const [autoPayFrequency, setAutoPayFrequency] = useState('daily') // 'daily' | 'weekly' | 'monthly'
  const [autoPayAmount, setAutoPayAmount] = useState('100')
  const [selectedDailyAmt, setSelectedDailyAmt] = useState('100')
  const [selectedWeeklyAmt, setSelectedWeeklyAmt] = useState('500')
  const [selectedMonthlyAmt, setSelectedMonthlyAmt] = useState('2000')
  const [submittingAutoPay, setSubmittingAutoPay] = useState(false)
  const [autoPayFeedback, setAutoPayFeedback] = useState(null)
  const [activeAutoPayPlans, setActiveAutoPayPlans] = useState(() => {
    try {
      const stored = localStorage.getItem('athirai_autopay_plans')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const handleOpenAutoPayModal = (freq = 'daily', amt = '') => {
    setAutoPayFrequency(freq)
    if (amt) {
      setAutoPayAmount(amt.toString())
    } else {
      setAutoPayAmount(freq === 'daily' ? '100' : freq === 'weekly' ? '500' : '2000')
    }
    setAutoPayFeedback(null)
    setShowAutoPayModal(true)
  }

  const handleCancelAutoPayPlan = (planId) => {
    const updated = activeAutoPayPlans.filter(p => p.id !== planId)
    setActiveAutoPayPlans(updated)
    try {
      localStorage.setItem('athirai_autopay_plans', JSON.stringify(updated))
    } catch {}
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

      // Authoritative AUG Coins balance directly from single source of truth
      const authoritativeCoins = dashData?.kpis?.aug_coins_balance !== undefined
        ? Number(dashData.kpis.aug_coins_balance)
        : walletCoins
      const authoritativeInr = +(authoritativeCoins / 100).toFixed(2)

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
          total_silver_holding_gm: dashData?.kpis?.total_silver_holding_gm || 0.0,
          total_silver_holding_mg: dashData?.kpis?.total_silver_holding_mg || 0.0,
          gold_value_inr: dashData?.kpis?.gold_value_inr || 0.0,
          silver_value_inr: dashData?.kpis?.silver_value_inr || 0.0,
          total_vault_value_inr: dashData?.kpis?.total_vault_value_inr || 0.0,
          wallet_balance_inr: dashData?.kpis?.gold_value_inr || 0.0, // strictly Digi Gold Vault Value
          digi_gold_wallet_inr: dashData?.kpis?.gold_value_inr || 0.0,
          total_invested_inr: dashData?.kpis?.total_invested_inr || 0.0,
          total_returns_inr: dashData?.kpis?.total_returns_inr || 0.0,
          returns_percentage: dashData?.kpis?.returns_percentage || 0.0,
          aug_coins_balance: authoritativeCoins,
          aug_balance_inr: authoritativeInr,
        },
        rates: liveMetalRates,
        chart_data: dashData?.chart_data?.length ? dashData.chart_data : dynamicChartData,
        chart_history: dashData?.chart_history || null,
        recent_transactions: dashData?.recent_transactions || []
      })
    } catch (err) {
      console.warn('Dashboard parallel fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // ── BUY HANDLER ──
  const handleBuyGold = async (e) => {
    e.preventDefault()
    const parsedAmt = parseFloat(buyAmount)
    if (!buyAmount || parsedAmt <= 0) return
    setSubmittingBuy(true)
    setBuyFeedback(null)

    const metalLabel = buyMetal === 'gold_22k' ? '22K Digital Gold (Athirai 916)' : 'Digi Silver (Pure 999)'

    // Direct Buy via Razorpay / UPI / Netbanking
    if (buyPaymentMethod === 'razorpay' || buyPaymentMethod === 'upi' || buyPaymentMethod === 'netbanking') {
      try {
        const loaded = await loadRazorpay()
        if (!loaded) {
          setBuyFeedback({
            type: 'error',
            title: 'Payment Gateway Unavailable',
            detail: 'Razorpay checkout script could not be loaded. Please check your internet connection.',
            code: 'sdk_load_failed'
          })
          setSubmittingBuy(false)
          return
        }

        const orderRes = await api.post('/create-razorpay-order/', { amount: parsedAmt })
        const { razorpay_order_id, key, amount: orderAmount, currency } = orderRes.data

        const options = {
          key: key || 'rzp_test_TPFG9ug3Zow5ep',
          amount: Math.round(Number(orderAmount) * 100),
          currency: currency || 'INR',
          name: 'Athirai Fine Jewellery',
          description: `Direct Buy ${metalLabel}`,
          order_id: razorpay_order_id,
          prefill: {
            name: data?.customer?.name || currentUser.name || '',
            email: data?.customer?.email || currentUser.email || '',
            contact: data?.customer?.phone || ''
          },
          theme: { color: '#0A3E42' },
          handler: async (response) => {
            try {
              const res = await api.post('/digi-gold/buy/', {
                amount: parsedAmt,
                payment_method: buyPaymentMethod,
                metal: buyMetal,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })

              const txnId = res.data?.transaction_id || ('BB' + (response.razorpay_payment_id || '').slice(-8).toUpperCase())
              const invData = res.data?.investment || {}

              setShowBuyModal(false)
              setActionSuccessData({
                actionType: 'buy',
                metal: buyMetal,
                metalLabel,
                title: 'Investment Confirmed via Razorpay!',
                message: res.data?.message || `Successfully purchased ${metalLabel} and safely credited to your digital vault.`,
                amountInr: parsedAmt,
                grams: invData.hold_gold_gm || previewGoldGm,
                milligrams: invData.hold_gold_mg || previewGoldMg,
                coins: Math.round(parsedAmt * 100),
                transactionId: txnId,
                rate: buyMetal === 'gold_22k' ? currentLiveRate : currentSilverRate,
                dateTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
              })

              fetchDashboardData()
            } catch (err) {
              const respData = err.response?.data
              setBuyFeedback({
                type: 'error',
                title: respData?.error || 'Payment Verification Incomplete',
                detail: respData?.detail || 'Payment was received but could not complete vault allocation. Support has been notified.',
                code: respData?.code || 'verification_failed'
              })
            } finally {
              setSubmittingBuy(false)
            }
          },
          modal: {
            ondismiss: () => {
              setSubmittingBuy(false)
            }
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      } catch (err) {
        setBuyFeedback({
          type: 'error',
          title: 'Order Initiation Failed',
          detail: err.response?.data?.error || err.message || 'Unable to open Razorpay gateway. Please try again.',
          code: 'rzp_init_failed'
        })
        setSubmittingBuy(false)
      }
      return
    }

    // Default: 'wallet' (AUG Revive)
    try {
      const res = await api.post('/digi-gold/buy/', {
        amount: parsedAmt,
        payment_method: 'wallet',
        metal: buyMetal
      })
      const txnId = res.data?.transaction_id
      const invData = res.data?.investment || {}
      
      // Close buy input modal & launch Success Popup Modal
      setShowBuyModal(false)
      setActionSuccessData({
        actionType: 'buy',
        metal: buyMetal,
        metalLabel,
        title: 'Investment Confirmed via AUG Revive!',
        message: res.data?.message || `Successfully purchased ${metalLabel} and safely credited to your digital vault.`,
        amountInr: parsedAmt,
        grams: invData.hold_gold_gm || previewGoldGm,
        milligrams: invData.hold_gold_mg || previewGoldMg,
        coins: Math.round(parsedAmt * 100),
        transactionId: txnId,
        rate: buyMetal === 'gold_22k' ? currentLiveRate : currentSilverRate,
        dateTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      })

      fetchDashboardData()
    } catch (err) {
      const respData = err.response?.data
      let errTitle = 'Transaction Could Not Be Processed'
      let errDetail = 'Please verify your transaction parameters and try again.'
      let errCode = 'general_error'

      if (respData?.code === 'insufficient_balance') {
        errTitle = 'Insufficient AUG Revive Balance'
        errDetail = respData.detail || 'Your AUG Revive wallet balance is lower than the required amount for this transaction.'
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

  // ── AUTOPAY SUBMIT HANDLER (RAZORPAY RECURRING / DIRECT BUY WITH ₹50 DISCOUNT) ──
  const handleAutoPaySubmit = async (e) => {
    if (e) e.preventDefault()
    const parsedAmt = parseFloat(autoPayAmount)
    if (!parsedAmt || parsedAmt <= 0) {
      setAutoPayFeedback({
        type: 'error',
        title: 'Invalid Investment Amount',
        detail: 'Please enter a valid amount for your Auto-Savings plan.',
        code: 'invalid_amount'
      })
      return
    }

    const minAmount = autoPayFrequency === 'daily' ? 10 : autoPayFrequency === 'weekly' ? 100 : 1000
    if (parsedAmt < minAmount) {
      setAutoPayFeedback({
        type: 'error',
        title: 'Minimum Amount Requirement',
        detail: `The minimum amount for ${autoPayFrequency} AutoPay is ₹${minAmount}.`,
        code: 'min_amount_failed'
      })
      return
    }

    setSubmittingAutoPay(true)
    setAutoPayFeedback(null)

    // Calculate discounted gold grams: ₹50 discount per gram on benchmark rate
    const effectiveRate = Math.max(1, currentLiveRate - 50)
    const goldGm = +(parsedAmt / effectiveRate).toFixed(4)
    const goldMg = +(goldGm * 1000).toFixed(2)
    const freqLabel = autoPayFrequency === 'daily' ? 'Daily' : autoPayFrequency === 'weekly' ? 'Weekly' : 'Monthly'

    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        setAutoPayFeedback({
          type: 'error',
          title: 'Payment Gateway Unavailable',
          detail: 'Razorpay checkout script could not be loaded. Please check your internet connection.',
          code: 'sdk_load_failed'
        })
        setSubmittingAutoPay(false)
        return
      }

      const orderRes = await api.post('/create-razorpay-order/', { amount: parsedAmt })
      const { razorpay_order_id, key, amount: orderAmount, currency } = orderRes.data

      const options = {
        key: key || 'rzp_test_TPFG9ug3Zow5ep',
        amount: Math.round(Number(orderAmount) * 100),
        currency: currency || 'INR',
        name: 'Athirai Fine Jewellery',
        description: `${freqLabel} AutoPay Gold Savings (₹50/g Off)`,
        order_id: razorpay_order_id,
        prefill: {
          name: data?.customer?.name || currentUser.name || '',
          email: data?.customer?.email || currentUser.email || '',
          contact: data?.customer?.phone || ''
        },
        theme: { color: '#0A3E42' },
        handler: async (response) => {
          try {
            const res = await api.post('/digi-gold/buy/', {
              amount: parsedAmt,
              payment_method: 'razorpay',
              metal: 'gold_22k',
              notes: `${freqLabel} AutoPay Gold SIP (₹50/g Discount Applied & 5% Off Making Charges)`,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })

            const txnId = res.data?.transaction_id || ('AP' + (response.razorpay_payment_id || '').slice(-8).toUpperCase())
            const invData = res.data?.investment || {}

            const newPlan = {
              id: 'AP-' + Date.now().toString().slice(-6),
              frequency: freqLabel,
              amount: parsedAmt,
              goldRate: effectiveRate,
              discountPerGram: 50,
              makingChargeDiscount: '5%',
              startDate: new Date().toLocaleDateString('en-GB'),
              nextDebit: autoPayFrequency === 'daily' ? 'Tomorrow at 09:00 AM' : autoPayFrequency === 'weekly' ? 'In 7 days' : 'In 30 days',
              status: 'active'
            }

            const updatedPlans = [newPlan, ...activeAutoPayPlans]
            setActiveAutoPayPlans(updatedPlans)
            try {
              localStorage.setItem('athirai_autopay_plans', JSON.stringify(updatedPlans))
            } catch {}

            setShowAutoPayModal(false)
            setActionSuccessData({
              actionType: 'buy',
              metal: 'gold_22k',
              metalLabel: `22K Gold (${freqLabel} AutoPay Plan)`,
              title: `${freqLabel} AutoPay Plan Activated!`,
              message: `Congratulations! Your ${freqLabel} AutoPay deposit for ₹${parsedAmt.toLocaleString('en-IN')} has been safely processed. Enjoy ₹50/g discount on all deposits and 5% off jewellery making charges!`,
              amountInr: parsedAmt,
              grams: invData.hold_gold_gm || goldGm,
              milligrams: invData.hold_gold_mg || goldMg,
              coins: Math.round(parsedAmt * 100),
              transactionId: txnId,
              rate: effectiveRate,
              dateTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            })

            fetchDashboardData()
          } catch (err) {
            const respData = err.response?.data
            setAutoPayFeedback({
              type: 'error',
              title: respData?.error || 'Payment Verification Incomplete',
              detail: respData?.detail || 'AutoPay authorization was received but could not complete vault allocation. Support has been notified.',
              code: respData?.code || 'verification_failed'
            })
          } finally {
            setSubmittingAutoPay(false)
          }
        },
        modal: {
          ondismiss: () => {
            setSubmittingAutoPay(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setAutoPayFeedback({
        type: 'error',
        title: 'Order Initiation Failed',
        detail: err.response?.data?.error || err.message || 'Unable to open Razorpay gateway. Please try again.',
        code: 'rzp_init_failed'
      })
      setSubmittingAutoPay(false)
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
      const metalLabel = sellMetal === 'gold_22k' ? '22K Digital Gold (Athirai 916)' : 'Digi Silver (Pure 999)'
      const txnId = res.data?.transaction_id
      const payoutVal = res.data?.payout_inr ?? previewSellPayout
      const coinsCredited = res.data?.coins_credited ?? Math.round(payoutVal * 100)

      // Close sell input modal & launch Success Popup Modal
      setShowSellModal(false)
      setActionSuccessData({
        actionType: 'sell',
        metal: sellMetal,
        metalLabel,
        title: 'Sale Executed Successfully!',
        message: res.data?.message || `Successfully sold ${parseFloat(sellGrams)}g of ${metalLabel} and credited ₹${payoutVal.toLocaleString('en-IN')} to your wallet.`,
        amountInr: payoutVal,
        grams: parseFloat(sellGrams),
        milligrams: parseFloat(sellGrams) * 1000,
        coins: coinsCredited,
        transactionId: txnId,
        rate: sellMetal === 'gold_22k' ? currentLiveRate : currentSilverRate,
        dateTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      })

      fetchDashboardData()
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
      const invData = res.data?.investment || {}

      // Close convert input modal & launch Success Popup Modal
      setShowConvertModal(false)
      setActionSuccessData({
        actionType: 'convert',
        metal: 'gold_22k',
        metalLabel: '22K Digital Gold (Athirai 916)',
        title: 'AUG Revive Converted to Digi Gold!',
        message: res.data?.message || `Successfully converted ₹${convertAmount} from your store AUG Revive into 22K Digital Gold.`,
        amountInr: parseFloat(convertAmount),
        grams: invData.hold_gold_gm || previewConvertGm,
        milligrams: invData.hold_gold_mg || previewConvertMg,
        coins: Math.round(parseFloat(convertAmount) * 100),
        transactionId: txnId,
        rate: currentLiveRate,
        dateTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      })

      fetchDashboardData()
    } catch (err) {
      const respData = err.response?.data
      let errTitle = 'Conversion Could Not Be Completed'
      let errDetail = 'Please check your parameters and try again.'
      let errCode = 'general_error'

      if (respData?.code === 'insufficient_balance') {
        errTitle = 'Insufficient AUG Revive'
        errDetail = respData.detail || 'Your AUG Revive balance is not enough to convert this amount.'
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

  // ── SUPPORT REQUEST SUBMIT HANDLER ──
  const handleSupportSubmit = (e) => {
    if (e) e.preventDefault()
    if (!supportMessage.trim()) return
    const randomSuffix = Math.floor(100000 + Math.random() * 900000)
    setSupportTicketId(`ADG-${randomSuffix}`)
    setSupportSubmitted(true)
  }

  const kpis = data?.kpis || {}
  const rates = data?.rates || {}
  const transactions = data?.recent_transactions || []
  const isNegativeReturn = Number(kpis.total_returns_inr ?? 0) < 0 || Number(kpis.returns_percentage ?? 0) < 0

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

  // Available holdings for selected sell metal
  const availableSellGm = sellMetal === 'gold_22k'
    ? Number(kpis.total_gold_holding_gm ?? 0)
    : Number(kpis.total_silver_holding_gm ?? 0)
  const availableSellMg = sellMetal === 'gold_22k'
    ? Number(kpis.total_gold_holding_mg ?? 0)
    : Number(kpis.total_silver_holding_mg ?? 0)

  // Live calculations for Sell modal
  const parsedSellGm = parseFloat(sellGrams) || 0
  const activeSellRate = sellMetal === 'gold_22k' ? currentLiveRate : currentSilverRate
  const previewSellPayout = parsedSellGm * activeSellRate
  const previewSellCoins = Math.round(previewSellPayout * 100)
  const isOverSelling = parsedSellGm > availableSellGm + 0.000001
  const hasNoHoldingsToSell = availableSellGm <= 0

  // Live calculations for Convert AUG Coins modal
  const parsedConvertAmount = parseFloat(convertAmount) || 0
  const previewConvertCoins = Math.round(parsedConvertAmount * 100)
  const previewConvertMg = currentLiveMgRate > 0 ? (parsedConvertAmount / currentLiveMgRate) : 0
  const previewConvertGm = currentLiveRate > 0 ? (parsedConvertAmount / currentLiveRate) : 0
  const userAugCoins = Number(kpis.aug_coins_balance ?? 0)
  const userAugInr = Number(kpis.aug_balance_inr ?? 0)
  const hasEnoughCoins = userAugCoins >= previewConvertCoins

  // ── FILTERED TRANSACTIONS & METRICS FOR VALUATION SHEET (GOLD & SILVER SUPPORT) ──
  const valuationTransactions = useMemo(() => {
    if (valuationMetal === 'gold') {
      return transactions.filter(tx => (tx.metal === 'gold_22k' || !tx.metal || (!tx.metal?.includes('silver') && !(tx.type || '').toLowerCase().includes('silver'))))
    }
    if (valuationMetal === 'silver') {
      return transactions.filter(tx => (tx.metal === 'silver_999' || tx.metal?.includes('silver') || (tx.type || '').toLowerCase().includes('silver')))
    }
    return transactions
  }, [transactions, valuationMetal])

  const valuationMetrics = useMemo(() => {
    if (valuationMetal === 'silver') {
      const totalRecharge = valuationTransactions.reduce((acc, tx) => acc + (Number(tx.recharge) || 0), 0)
      const totalMg = Number(kpis.total_silver_holding_mg ?? 0)
      const totalGm = Number(kpis.total_silver_holding_gm ?? 0)
      const currentRate = Number(currentSilverRate)
      const currentVal = Number(kpis.silver_value_inr ?? (totalGm * currentRate))
      const totalProfit = currentVal - totalRecharge
      return {
        title: 'Aadhirai Pure 999 Digi Silver Investment & Valuation Sheet',
        subTitle: `Live mathematical model for 999 Silver — Dynamic recalculation with Pure 999 rate (₹${currentRate.toFixed(2)}/g)`,
        totalRecharge,
        holdingMg: totalMg,
        holdingGm: totalGm,
        mgLabel: 'Ag Mg',
        gmLabel: 'Ag Gm',
        rateLabel: "Today's Silver Rate",
        rateVal: currentRate,
        rateFormatted: `₹ ${currentRate.toFixed(2)}`,
        growthVal: currentVal,
        profitVal: totalProfit,
        metalCode: 'SILVER 999'
      }
    }
    if (valuationMetal === 'gold') {
      const totalRecharge = valuationTransactions.reduce((acc, tx) => acc + (Number(tx.recharge) || 0), 0)
      const totalMg = Number(kpis.total_gold_holding_mg ?? 0)
      const totalGm = Number(kpis.total_gold_holding_gm ?? 0)
      const currentRate = Number(currentLiveRate)
      const currentVal = Number(kpis.gold_value_inr ?? (totalGm * currentRate))
      const totalProfit = currentVal - totalRecharge
      return {
        title: 'Aadhirai 22K Digi Gold Investment & Valuation Sheet',
        subTitle: `Live mathematical model for 22K Gold — Dynamic recalculation with 22K rate (₹${Number(currentRate).toLocaleString('en-IN')}/g)`,
        totalRecharge,
        holdingMg: totalMg,
        holdingGm: totalGm,
        mgLabel: 'Au Mg',
        gmLabel: 'Au Gm',
        rateLabel: "Today's 22K Rate",
        rateVal: currentRate,
        rateFormatted: `₹ ${Number(currentRate).toLocaleString('en-IN')}`,
        growthVal: currentVal,
        profitVal: totalProfit,
        metalCode: 'GOLD 22K'
      }
    }
    // 'all'
    const totalRecharge = Number(kpis.total_invested_inr ?? 0)
    const currentVal = Number(kpis.total_vault_value_inr ?? (Number(kpis.gold_value_inr || 0) + Number(kpis.silver_value_inr || 0)))
    const totalProfit = Number(kpis.total_returns_inr ?? (currentVal - totalRecharge))
    return {
      title: 'Aadhirai Consolidated Digital Vault Investment & Valuation Sheet',
      subTitle: `Live combined portfolio valuation (22K Gold + Pure 999 Silver) with real-time market recalculation`,
      totalRecharge,
      holdingMg: Number(kpis.total_gold_holding_mg || 0),
      holdingGm: Number(kpis.total_gold_holding_gm || 0),
      mgLabel: 'Au Mg',
      gmLabel: 'Au Gm',
      rateLabel: "Today's 22K Rate",
      rateVal: currentLiveRate,
      rateFormatted: `₹ ${Number(currentLiveRate).toLocaleString('en-IN')}`,
      growthVal: currentVal,
      profitVal: totalProfit,
      metalCode: 'ALL METALS'
    }
  }, [valuationMetal, valuationTransactions, kpis, currentLiveRate, currentSilverRate])

  // ── OFFICIAL PDF EXPORT WITH ATHIRAI LOGO & ALIGNED CERTIFICATE FORMAT ──
  const handleExportValuationPDF = () => {
    try {
      const printWin = window.open('', '_blank', 'width=1150,height=800')
      if (!printWin) {
        alert('Please allow popups to download/print the Valuation PDF statement.')
        return
      }

      const logoUrl = `${window.location.origin}/Aadhirai-Logo.png`
      const currentDateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      const currentTimeStr = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })

      const liveRateInfo = valuationMetal === 'silver'
        ? `₹${Number(currentSilverRate).toFixed(2)}/g (Pure 999 Silver)`
        : valuationMetal === 'gold'
        ? `₹${Number(currentLiveRate).toLocaleString('en-IN')}/g (22K Athirai 916)`
        : `Gold: ₹${Number(currentLiveRate).toLocaleString('en-IN')}/g | Silver: ₹${Number(currentSilverRate).toFixed(2)}/g`

      let rowsHtml = ''
      let sumRecharge = 0
      let sumGrams = 0
      let sumCurrentValue = 0
      let sumProfit = 0

      valuationTransactions.forEach((tx) => {
        const isSilver = tx.metal === 'silver_999' || tx.metal?.includes('silver') || (tx.type || '').toLowerCase().includes('silver')
        const recharge = Number(tx.recharge || 0)
        const buyRate = Number(tx.gold_price || (isSilver ? currentSilverRate : currentLiveRate))
        const holdMg = Number(tx.hold_gold_mg || (tx.gm ? tx.gm * 1000 : 0))
        const holdGm = Number(tx.gm || (holdMg / 1000))
        const livePrice = Number(isSilver ? currentSilverRate : currentLiveRate)
        const currVal = Number(holdGm * livePrice)
        const profit = Number(currVal - recharge)

        sumRecharge += recharge
        sumGrams += holdGm
        sumCurrentValue += currVal
        sumProfit += profit

        const metalBadgeClass = isSilver ? 'metal-silver' : 'metal-gold'
        const metalBadgeText = isSilver ? 'SILVER 999' : '22K GOLD'
        const profitClass = profit >= 0 ? 'profit-pos' : 'profit-neg'
        const profitSign = profit >= 0 ? '+' : ''

        rowsHtml += `
          <tr>
            <td style="font-family: monospace; font-weight: 700; color: #0A3E42;">${tx.transaction_id || `BB#${tx.id}`}</td>
            <td>${tx.date_excel || tx.date}</td>
            <td style="text-align: center;"><span class="badge ${metalBadgeClass}">${metalBadgeText}</span></td>
            <td style="text-align: right; font-weight: 700;">₹${recharge.toLocaleString('en-IN')}</td>
            <td style="text-align: right;">₹${buyRate.toLocaleString('en-IN')}</td>
            <td style="text-align: right; color: #008744; font-weight: 700;">${holdMg.toFixed(2)}</td>
            <td style="text-align: right; font-weight: 800; color: #0A3E42;">${holdGm.toFixed(3)}</td>
            <td style="text-align: right;">₹${livePrice.toLocaleString('en-IN')}</td>
            <td style="text-align: right; font-weight: 800; color: #008744;">₹${currVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right; font-weight: 800;" class="${profitClass}">${profitSign}₹${profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: center;"><span class="badge status-completed">${tx.status || 'Verified'}</span></td>
          </tr>
        `
      })

      const totalProfitClass = sumProfit >= 0 ? 'profit-pos' : 'profit-neg'
      const totalProfitSign = sumProfit >= 0 ? '+' : ''

      const docHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Athirai Digi Gold - Official Valuation Statement</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    
    @page {
      size: A4 landscape;
      margin: 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0A3E42;
      background: #FFFFFF;
      font-size: 11.5px;
      line-height: 1.4;
    }

    .no-print-bar {
      position: sticky;
      top: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0A3E42;
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      z-index: 999;
    }

    .btn-action {
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-print {
      background: #009957;
      color: #FFFFFF;
      box-shadow: 0 2px 8px rgba(0, 153, 87, 0.4);
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.2);
      color: #FFFFFF;
      margin-left: 10px;
    }

    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }

    /* Statement Header with Athirai Logo */
    .statement-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0A3E42;
      padding-bottom: 16px;
      margin-bottom: 18px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      height: 60px;
      width: auto;
      object-fit: contain;
    }

    .brand-title {
      font-size: 23px;
      font-weight: 900;
      color: #0A3E42;
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 11px;
      font-weight: 750;
      color: #C6924B;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 3px;
    }

    .doc-meta {
      text-align: right;
    }

    .doc-title-badge {
      display: inline-block;
      background: #E8F4F1;
      color: #0A3E42;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #C7E0D8;
      margin-bottom: 4px;
      letter-spacing: 0.05em;
    }

    .doc-date {
      font-size: 11px;
      color: #647474;
      font-weight: 600;
    }

    /* Customer & Statement Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 14px;
      background: #F8FAF9;
      border: 1px solid #DCE7E3;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-label {
      font-size: 9.5px;
      font-weight: 750;
      color: #647474;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .meta-val {
      font-size: 13px;
      font-weight: 800;
      color: #0A3E42;
    }

    /* 6 KPI Cards Grid */
    .kpi-summary-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .kpi-card {
      background: #FFFFFF;
      border: 1.5px solid #E2EBE8;
      border-radius: 10px;
      padding: 9px 10px;
      text-align: center;
    }

    .kpi-card.highlight {
      background: #F2FAF6;
      border-color: #A3E5C7;
    }

    .kpi-title {
      font-size: 9px;
      font-weight: 750;
      color: #647474;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 3px;
    }

    .kpi-number {
      font-size: 14.5px;
      font-weight: 900;
      color: #0A3E42;
    }

    .kpi-number.green { color: #009957; }
    .kpi-number.gold { color: #C6924B; }
    .kpi-number.red { color: #E45B5B; }

    /* Ledger Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 20px;
    }

    th {
      background: #0A3E42;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 8px 8px;
      border: 1px solid #0A3E42;
    }

    td {
      padding: 7px 8px;
      border: 1px solid #E2EBE8;
    }

    tr:nth-child(even) td {
      background: #FAFCFB;
    }

    tfoot tr td {
      background: #EBF4F1;
      font-weight: 900;
      font-size: 11px;
      border-top: 2px solid #0A3E42;
      padding: 9px 8px;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .metal-gold {
      background: rgba(198, 146, 75, 0.16);
      color: #9E6B24;
      border: 1px solid rgba(198, 146, 75, 0.35);
    }

    .metal-silver {
      background: rgba(10, 62, 66, 0.12);
      color: #0A3E42;
      border: 1px solid rgba(10, 62, 66, 0.3);
    }

    .status-completed {
      background: #DEF7EC;
      color: #03543F;
      border: 1px solid #BCF0DA;
    }

    .profit-pos { color: #008744; }
    .profit-neg { color: #E02424; }

    /* Official Footer & Verification Seal */
    .statement-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px dashed #C7E0D8;
      padding-top: 12px;
      margin-top: 14px;
      font-size: 10px;
      color: #647474;
    }

    .security-stamp {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #0A3E42;
      font-weight: 700;
    }

    .seal-box {
      border: 1.5px solid #C6924B;
      padding: 3px 8px;
      border-radius: 5px;
      color: #C6924B;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.06em;
      font-size: 8.5px;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <span style="font-weight: 800; font-size: 14px;">Athirai Digi Gold — Official Valuation Statement</span>
      <span style="font-size: 12px; opacity: 0.8; margin-left: 10px;">(Click "Download / Save as PDF" below)</span>
    </div>
    <div>
      <button class="btn-action btn-print" onclick="window.print()">
        🖨️ Download / Save as PDF
      </button>
      <button class="btn-action btn-close" onclick="window.close()">
        Close
      </button>
    </div>
  </div>

  <div class="statement-header">
    <div class="brand-section">
      <img src="${logoUrl}" alt="Athirai Jewelers" class="brand-logo" onerror="this.style.display='none'" />
      <div>
        <h1 class="brand-title">ATHIRAI JEWELLERS</h1>
        <div class="brand-subtitle">Digi Gold &amp; Silver Vault Valuation Certificate</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-title-badge">${valuationMetal.toUpperCase()} VAULT AUDIT</div>
      <div class="doc-date">Generated: ${currentDateStr} at ${currentTimeStr}</div>
      <div style="font-size: 10px; color: #009957; font-weight: 750; margin-top: 2px;">● 100% Insured &amp; Physical Bullion Backed</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <span class="meta-label">Customer Account</span>
      <span class="meta-val">${customerName} (${customerRole})</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Active Market Benchmark</span>
      <span class="meta-val">${liveRateInfo}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Total Verified Records</span>
      <span class="meta-val">${valuationTransactions.length} Transactions</span>
    </div>
  </div>

  <div class="kpi-summary-grid">
    <div class="kpi-card">
      <div class="kpi-title">Total Recharge</div>
      <div class="kpi-number">₹${sumRecharge.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">${valuationMetal === 'silver' ? 'Ag Milligrams' : 'Au Milligrams'}</div>
      <div class="kpi-number green">${(sumGrams * 1000).toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">${valuationMetal === 'silver' ? 'Ag Grams' : 'Au Grams'}</div>
      <div class="kpi-number green">${sumGrams.toFixed(3)} g</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Current Rate</div>
      <div class="kpi-number gold">₹${valuationMetal === 'silver' ? Number(currentSilverRate).toFixed(2) : Number(currentLiveRate).toLocaleString('en-IN')}/g</div>
    </div>
    <div class="kpi-card highlight">
      <div class="kpi-title">Current Valuation</div>
      <div class="kpi-number green">₹${sumCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="kpi-card highlight">
      <div class="kpi-title">Total Profit / Loss</div>
      <div class="kpi-number ${totalProfitClass}">${totalProfitSign}₹${sumProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: left;">Txn Reference</th>
        <th style="text-align: left;">Date</th>
        <th style="text-align: center;">Metal</th>
        <th style="text-align: right;">Recharge (₹)</th>
        <th style="text-align: right;">Buy Rate (₹/g)</th>
        <th style="text-align: right;">Holding (mg)</th>
        <th style="text-align: right;">Holding (g)</th>
        <th style="text-align: right;">Live Rate (₹/g)</th>
        <th style="text-align: right;">Current Value (₹)</th>
        <th style="text-align: right;">Net Profit (₹)</th>
        <th style="text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="11" style="text-align: center; padding: 20px;">No investment records found in this vault.</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="text-align: left;">TOTALS</td>
        <td style="text-align: right;">₹${sumRecharge.toLocaleString('en-IN')}</td>
        <td></td>
        <td style="text-align: right; color: #008744;">${(sumGrams * 1000).toFixed(2)}</td>
        <td style="text-align: right; color: #0A3E42;">${sumGrams.toFixed(3)} g</td>
        <td></td>
        <td style="text-align: right; color: #008744;">₹${sumCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right;" class="${totalProfitClass}">${totalProfitSign}₹${sumProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <div class="statement-footer">
    <div class="security-stamp">
      <div class="seal-box">ATHIRAI 916 SEAL</div>
      <span>100% Certified 22K (916) Gold &amp; Pure (999) Silver • LBMA Standard • Insured Vault Custody</span>
    </div>
    <div>
      Official system-verified statement issued by Athirai Digi Gold Portal. Page 1 of 1
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
      `

      printWin.document.open()
      printWin.document.write(docHtml)
      printWin.document.close()
    } catch (err) {
      console.error('PDF Export Error:', err)
      alert('Failed to generate PDF. Please try again.')
    }
  }

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
      {/* Mobile Drawer Backdrop */}
      <div
        className={`dg-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── 1. LEFT SIDEBAR (Dark Teal #0A3E42, Fixed on Left) ── */}
      <aside className={`dg-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dg-sidebar-top">
          {/* Logo brand & Mobile Close */}
          <div className="dg-brand-row">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}
              onClick={() => { setCurrentView('dashboard'); navigate('/digi-gold'); setSidebarOpen(false); }}
            >
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
            <button
              type="button"
              className="dg-sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
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
              {loading ? (
                <div className="dg-skel-dark" style={{ width: 75, height: 20, borderRadius: 4 }} />
              ) : sidebarRotatingMetal === 'gold' ? (
                <AnimatedNumber value={kpis.total_gold_holding_gm ?? 0} decimals={3} suffix=" g" />
              ) : (
                <AnimatedNumber value={kpis.total_silver_holding_gm ?? 0} decimals={3} suffix=" g" />
              )}
            </div>
            <div className="dg-sidebar-wallet-sub">
              {loading ? (
                <div className="dg-skel-dark" style={{ width: 110, height: 12, borderRadius: 4, marginTop: 4 }} />
              ) : sidebarRotatingMetal === 'gold' ? (
                <>≈ <AnimatedNumber value={kpis.gold_value_inr ?? 0} prefix="₹ " decimals={2} /> • Athirai 916</>
              ) : (
                <>≈ <AnimatedNumber value={kpis.silver_value_inr ?? 0} prefix="₹ " decimals={2} /> • Pure 999</>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="dg-nav">
            <button
              className={`dg-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              type="button"
              onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => { handleOpenBuyModal(); setSidebarOpen(false); }}
            >
              <ShoppingCart size={18} />
              <span>Buy Gold</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => { handleOpenSellModal(); setSidebarOpen(false); }}
            >
              <ArrowUpFromLine size={18} />
              <span>Sell Gold</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => { setConvertFeedback(null); setShowConvertModal(true); setSidebarOpen(false); }}
            >
              <ArrowLeftRight size={18} />
              <span>Convert Coins</span>
            </button>
            <button
              className={`dg-nav-btn ${currentView === 'valuation' ? 'active' : ''}`}
              type="button"
              onClick={() => { setCurrentView('valuation'); setSidebarOpen(false); }}
            >
              <WalletCards size={18} />
              <span>Valuation Sheet</span>
            </button>
            <button
              className={`dg-nav-btn ${currentView === 'transactions' ? 'active' : ''}`}
              type="button"
              onClick={() => { setCurrentView('transactions'); setSidebarOpen(false); }}
            >
              <History size={18} />
              <span>Transactions</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => { navigate('/collection/all'); setSidebarOpen(false); }}
            >
              <Package size={18} />
              <span>Orders</span>
            </button>
            <button
              className={`dg-nav-btn ${currentView === 'offers' ? 'active' : ''}`}
              type="button"
              onClick={() => { setCurrentView('offers'); setSidebarOpen(false); }}
            >
              <BadgePercent size={18} />
              <span>Offer</span>
              <span className="dg-nav-offer-tag">₹50 Off</span>
            </button>
            <button
              className="dg-nav-btn"
              type="button"
              onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
            >
              <UserRound size={18} />
              <span>Profile</span>
            </button>
            <button
              className={`dg-nav-btn ${currentView === 'support' ? 'active' : ''}`}
              type="button"
              onClick={() => { setCurrentView('support'); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
          <div className="dg-header-left">
            <button
              className="dg-menu-toggle-btn"
              type="button"
              aria-label="Toggle navigation menu"
              onClick={() => setSidebarOpen(prev => !prev)}
            >
              <Menu size={22} />
            </button>

            <div
              className="dg-header-mobile-brand"
              onClick={() => { setCurrentView('dashboard'); navigate('/digi-gold'); }}
            >
              <img
                src="/Aadhirai-Logo.png"
                alt="Athirai"
                className="dg-header-mobile-logo"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <div className="dg-header-mobile-title-wrap">
                <span className="dg-header-mobile-title">Digi Gold</span>
                <span className="dg-header-mobile-sub">Athirai 916</span>
              </div>
            </div>

            <div className="dg-search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search gold, transactions, or anything..."
              />
            </div>
          </div>

          <div className="dg-header-right">
            <button
              className="dg-back-store-btn"
              type="button"
              onClick={() => navigate('/')}
              title="Return to Jewellery Store"
            >
              <ArrowLeft size={15} />
              <span>Store</span>
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
                    <AnimatedNumber value={kpis.total_gold_holding_gm ?? 0} decimals={3} suffix=" g" />
                  </div>
                  <small style={{ color: '#647474', fontSize: 11 }}>({Number(kpis.total_gold_holding_mg ?? 0).toFixed(2)} mg)</small>
                </div>
                <div>
                  <small style={{ color: '#647474', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Current Valuation</small>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0A3E42', marginTop: 2 }}>
                    <AnimatedNumber value={kpis.gold_value_inr ?? 0} prefix="₹ " decimals={2} />
                  </div>
                  <small style={{ color: '#009957', fontWeight: 700, fontSize: 11 }}>@ ₹{currentLiveRate}/g (22K)</small>
                </div>
                <div>
                  <small style={{ color: '#647474', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Total Invested</small>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0A3E42', marginTop: 2 }}>
                    <AnimatedNumber value={kpis.total_invested_inr ?? 0} prefix="₹ " decimals={2} />
                  </div>
                </div>
                <div>
                  <small style={{ color: '#647474', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Net Profit / Growth</small>
                  <div style={{ fontSize: 20, fontWeight: 900, color: isNegativeReturn ? '#D92D20' : '#009957', marginTop: 2 }}>
                    <AnimatedNumber value={kpis.total_returns_inr ?? 0} prefix={Number(kpis.total_returns_inr ?? 0) >= 0 ? '+₹ ' : '-₹ '} decimals={2} />
                  </div>
                  <small style={{ color: isNegativeReturn ? '#D92D20' : '#009957', fontWeight: 800, fontSize: 11 }}>
                    (<AnimatedNumber value={kpis.returns_percentage ?? 0} prefix={Number(kpis.returns_percentage ?? 0) >= 0 ? '+' : ''} suffix="%" decimals={2} />)
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
                        <th>You Paid (₹)</th>
                        <th>Buy Rate (₹/g)</th>
                        <th>Vault Weight (g)</th>
                        <th>Current Value (₹)</th>
                        <th>Profit / Loss (₹)</th>
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
                            <td className="dg-table-txnid" style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <span className="dg-txnid-badge" title={tx.transaction_id || `BB#${tx.id}`}>
                                {tx.transaction_id || `BB#${tx.id}`}
                              </span>
                            </td>
                            <td className="dg-table-date" style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 750, color: '#0A3E42', fontSize: '12.5px', lineHeight: 1.25 }}>{tx.date}</div>
                              <span style={{ display: 'block', fontSize: 11, color: '#8E9E9C', marginTop: 2, fontWeight: 600 }}>{tx.time}</span>
                            </td>
                            <td className="dg-table-type" style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <span style={{
                                color: (tx.type || '').toLowerCase().includes('sell') ? '#E45B5B' : '#009957',
                                fontWeight: 800,
                                fontSize: '13px'
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
          ) : currentView === 'valuation' ? (
            /* ══════════════════════════════════════════════════════════════
               VALUATION SHEET FULL PAGE VIEW (MATCHING IMAGE 2 EXACTLY)
               ══════════════════════════════════════════════════════════════ */
            <div className="dg-valuation-shell">
              {/* Header Card */}
              <div className="dg-valuation-header-card">
                <div className="dg-valuation-title-wrap">
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
                  <h2 className="dg-valuation-main-title">
                    {valuationMetrics.title}
                  </h2>
                  <p className="dg-valuation-sub-title">
                    {valuationMetrics.subTitle}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Export PDF Button (Replaces Excel per user request) */}
                  <button
                    type="button"
                    onClick={handleExportValuationPDF}
                    className="dg-pdf-export-btn"
                    title="Download Official Valuation Statement PDF with Athirai Logo"
                  >
                    <FileText size={16} />
                    <span>Export PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBuyMetal(valuationMetal === 'silver' ? 'silver_999' : 'gold_22k')
                      handleOpenBuyModal()
                    }}
                    style={{
                      padding: '10px 18px', borderRadius: 12, background: '#009957', color: '#fff',
                      fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 3px 10px rgba(0, 153, 87, 0.25)'
                    }}
                  >
                    <ShoppingCart size={16} /> + Buy {valuationMetal === 'silver' ? 'Silver' : 'Gold'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSellMetal(valuationMetal === 'silver' ? 'silver_999' : 'gold_22k')
                      handleOpenSellModal()
                    }}
                    style={{
                      padding: '10px 18px', borderRadius: 12, background: '#FFFFFF', color: '#E45B5B',
                      border: '1.5px solid #E45B5B', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <ArrowUpFromLine size={16} /> Sell
                  </button>
                </div>
              </div>

              {/* Metal Filter Tabs (22K Gold, Pure 999 Silver, All) */}
              <div className="dg-valuation-tabs-bar">
                <button
                  type="button"
                  className={`dg-vtab-btn ${valuationMetal === 'gold' ? 'active gold' : ''}`}
                  onClick={() => setValuationMetal('gold')}
                >
                  <Coins size={16} />
                  <span>22K Digi Gold Vault</span>
                  <span className="dg-vtab-count">
                    {transactions.filter(t => t.metal === 'gold_22k' || !t.metal || (!t.metal?.includes('silver') && !(t.type || '').toLowerCase().includes('silver'))).length}
                  </span>
                </button>

                <button
                  type="button"
                  className={`dg-vtab-btn ${valuationMetal === 'silver' ? 'active silver' : ''}`}
                  onClick={() => setValuationMetal('silver')}
                >
                  <ShieldCheck size={16} />
                  <span>Pure 999 Silver Vault</span>
                  <span className="dg-vtab-count">
                    {transactions.filter(t => t.metal === 'silver_999' || t.metal?.includes('silver') || (t.type || '').toLowerCase().includes('silver')).length}
                  </span>
                </button>

                <button
                  type="button"
                  className={`dg-vtab-btn ${valuationMetal === 'all' ? 'active all' : ''}`}
                  onClick={() => setValuationMetal('all')}
                >
                  <WalletCards size={16} />
                  <span>All Vaults (Consolidated)</span>
                  <span className="dg-vtab-count">{transactions.length}</span>
                </button>
              </div>

              {/* Summary Top 6 Cards Banner (Exact Image 2 layout with dynamic live numbers) */}
              <div className="dg-valuation-kpi-grid">
                <div className="dg-valuation-kpi-item">
                  <span className="dg-valuation-kpi-label">Total Recharge</span>
                  <span className="dg-valuation-kpi-val">₹ {Number(valuationMetrics.totalRecharge).toLocaleString('en-IN')}</span>
                </div>
                <div className="dg-valuation-kpi-item">
                  <span className="dg-valuation-kpi-label">{valuationMetrics.mgLabel}</span>
                  <span className="dg-valuation-kpi-val green">{Number(valuationMetrics.holdingMg).toFixed(2)}</span>
                </div>
                <div className="dg-valuation-kpi-item">
                  <span className="dg-valuation-kpi-label">{valuationMetrics.gmLabel}</span>
                  <span className="dg-valuation-kpi-val green">{Number(valuationMetrics.holdingGm).toFixed(3)}</span>
                </div>
                <div className="dg-valuation-kpi-item">
                  <span className="dg-valuation-kpi-label">{valuationMetrics.rateLabel}</span>
                  <span className="dg-valuation-kpi-val gold">{valuationMetrics.rateFormatted}</span>
                </div>
                <div className="dg-valuation-kpi-item">
                  <span className="dg-valuation-kpi-label">Current Value</span>
                  <span className="dg-valuation-kpi-val green">₹ {Number(valuationMetrics.growthVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="dg-valuation-kpi-item">
                  <span className="dg-valuation-kpi-label">Profit / Loss</span>
                  <span className={`dg-valuation-kpi-val ${Number(valuationMetrics.profitVal) >= 0 ? 'green' : 'red'}`}>
                    {Number(valuationMetrics.profitVal) >= 0 ? '+' : ''}₹ {Number(valuationMetrics.profitVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Table Card */}
              <div className="dg-card" style={{ padding: 20 }}>
                <div className="dg-table-wrap">
                  <table className="dg-excel-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Txn ID</th>
                        <th>Date</th>
                        {valuationMetal === 'all' && <th>Metal</th>}
                        <th>You Paid (₹)</th>
                        <th>Vault Weight (g)</th>
                        <th>Buy Rate (₹/g)</th>
                        <th>Live Rate (₹/g)</th>
                        <th>Current Value (₹)</th>
                        <th>Profit / Loss (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valuationTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={valuationMetal === 'all' ? 9 : 8} style={{ textAlign: 'center', padding: '36px 16px', color: '#647474' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0A3E42', marginBottom: 6 }}>
                              No {valuationMetal === 'silver' ? 'Silver' : valuationMetal === 'gold' ? 'Gold' : ''} Holdings in this Valuation Sheet Yet
                            </div>
                            <p style={{ margin: '0 0 16px', fontSize: 13 }}>
                              Invest in {valuationMetal === 'silver' ? 'Pure 999 Silver' : '22K Digital Gold'} to start tracking your live portfolio growth.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setBuyMetal(valuationMetal === 'silver' ? 'silver_999' : 'gold_22k')
                                handleOpenBuyModal()
                              }}
                              style={{
                                padding: '9px 18px', borderRadius: 10, background: '#009957', color: '#fff',
                                fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer'
                              }}
                            >
                              + Buy {valuationMetal === 'silver' ? 'Pure 999 Silver' : '22K Gold'} Now
                            </button>
                          </td>
                        </tr>
                      ) : (
                        valuationTransactions.map((tx, idx) => {
                          const isSilver = tx.metal === 'silver_999' || tx.metal?.includes('silver') || (tx.type || '').toLowerCase().includes('silver')
                          const recharge = Number(tx.recharge || 0)
                          const buyRate = Number(tx.gold_price || (isSilver ? currentSilverRate : currentLiveRate))
                          const holdMg = Number(tx.hold_gold_mg || (tx.gm ? tx.gm * 1000 : 0))
                          const holdGm = Number(tx.gm || (holdMg / 1000))
                          const livePrice = Number(isSilver ? currentSilverRate : currentLiveRate)
                          const currentValue = Number(holdGm * livePrice)
                          const profit = Number(currentValue - recharge)

                          return (
                            <tr key={tx.id || idx}>
                              <td>
                                <span className="dg-txnid-badge" title={tx.transaction_id || `BB#${tx.id}`}>
                                  {tx.transaction_id || `BB#${tx.id}`}
                                </span>
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>{tx.date_excel || tx.date}</td>
                              {valuationMetal === 'all' && (
                                <td>
                                  <span className={`dg-metal-pill ${isSilver ? 'silver' : 'gold'}`}>
                                    {isSilver ? 'Silver 999' : 'Gold 22K'}
                                  </span>
                                </td>
                              )}
                              <td style={{ fontWeight: 800, color: '#0A3E42' }}>₹ {recharge.toLocaleString('en-IN')}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 800, color: '#0A3E42' }}>
                                    {holdGm.toFixed(3)} g
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#647474' }}>
                                    ({holdMg.toFixed(2)} mg)
                                  </span>
                                </div>
                              </td>
                              <td>₹ {buyRate.toLocaleString('en-IN')}/g</td>
                              <td style={{ fontWeight: 700, color: '#0A3E42' }}>₹ {livePrice.toLocaleString('en-IN')}/g</td>
                              <td style={{ fontWeight: 800, color: '#0A3E42' }}>
                                ₹ {currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{
                                fontWeight: 800,
                                color: profit >= 0 ? '#009957' : '#E45B5B'
                              }}>
                                {profit >= 0 ? '+' : ''}₹ {profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          ) : currentView === 'offers' ? (
            /* ══════════════════════════════════════════════════════════════
               EXCLUSIVE OFFERS & AUTOPAY / AUTO-SAVINGS VIEW
               ══════════════════════════════════════════════════════════════ */
            <div className="dg-offers-shell">
              {/* Header Navigation Card */}
              <div className="dg-offers-header-card">
                <div className="dg-offers-title-wrap">
                  <button
                    type="button"
                    onClick={() => setCurrentView('dashboard')}
                    className="dg-offers-back-btn"
                  >
                    <ArrowLeft size={16} /> Back to Dashboard
                  </button>
                  <div className="dg-offers-badge-row">
                    <span className="dg-offers-pill-badge">
                      <Sparkles size={14} /> EXCLUSIVE OFFERS &amp; AUTOPAY
                    </span>
                    <span className="dg-offers-live-tag">
                      ● LIVE 22K RATE ₹{Number(currentLiveRate).toLocaleString('en-IN')}/g
                    </span>
                  </div>
                  <h2 className="dg-offers-main-title">
                    Digi Gold Auto-Savings &amp; Special Offers
                  </h2>
                  <p className="dg-offers-sub-title">
                    Automate your 22K gold investments and unlock guaranteed discounts &amp; exclusive jewellery benefits. Save effortlessly with daily, weekly, or monthly AutoPay!
                  </p>
                </div>

                <div className="dg-offers-quick-actions">
                  <button
                    type="button"
                    className="dg-offers-cta-primary"
                    onClick={() => handleOpenAutoPayModal('daily', '100')}
                  >
                    <Zap size={16} />
                    <span>Set Up Auto Savings</span>
                  </button>
                </div>
              </div>

              {/* TOP FEATURED HERO BANNER (NO EMPTY SPACE - LUXURY 3-SECTION HIGH CONVERSION PROMO) */}
              <div className="dg-offer-hero-banner">
                {/* HERO LEFT: HEADLINE, HIGHLIGHTS & CTA */}
                <div className="dg-offer-hero-left">
                  <div className="dg-offer-hero-tag">
                    <Sparkles size={13} />
                    <span>SPECIAL AUTO-SAVINGS OFFER</span>
                  </div>
                  <h1 className="dg-offer-hero-headline">
                    ₹50 DISCOUNT <span className="dg-offer-per-gram">per gram!</span>
                  </h1>
                  <p className="dg-offer-hero-desc">
                    Setup <u>Auto Savings</u> and grab guaranteed ₹50/g instant discount on every single deposit.
                  </p>

                  <div className="dg-offer-hero-perks">
                    <div className="dg-hero-perk-badge">
                      <Tag size={13} className="dg-svg-perk-icon" />
                      <span>₹50/g Instant Discount</span>
                    </div>
                    <div className="dg-hero-perk-badge">
                      <Percent size={13} className="dg-svg-perk-icon" />
                      <span>5% Less Making Charges</span>
                    </div>
                    <div className="dg-hero-perk-badge">
                      <ShieldCheck size={13} className="dg-svg-perk-icon" />
                      <span>100% 22K Hallmarked Gold</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="dg-offer-hero-cta"
                    onClick={() => handleOpenAutoPayModal('daily', selectedDailyAmt || '100')}
                  >
                    <span>Set Up Auto Savings</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* HERO CENTER: EXCLUSIVE LIVE SAVINGS VOUCHER (ELIMINATES EMPTY GAP) */}
                <div className="dg-offer-hero-center">
                  <div className="dg-hero-deal-voucher">
                    <div className="dg-voucher-glow-aura" />
                    
                    <div className="dg-voucher-header">
                      <div className="dg-voucher-live-badge">
                        <span className="dg-live-pulse-dot" />
                        <span>LIVE SAVINGS PASS</span>
                      </div>
                      <span className="dg-voucher-code-chip">COUPON: DIGI50SAVE</span>
                    </div>

                    <div className="dg-voucher-pricing-box">
                      <div className="dg-voucher-rate-col old">
                        <span className="dg-voucher-rate-lbl">LIVE ATHIRAI RATE</span>
                        <span className="dg-voucher-rate-val strikethrough">
                          ₹{Number(currentLiveRate).toLocaleString('en-IN')}<small>/g</small>
                        </span>
                      </div>
                      <div className="dg-voucher-rate-arrow">➔</div>
                      <div className="dg-voucher-rate-col deal">
                        <span className="dg-voucher-rate-lbl">AUTOPAY OFFER RATE</span>
                        <span className="dg-voucher-rate-val offer">
                          ₹{Number(currentLiveRate - 50).toLocaleString('en-IN')}<small>/g</small>
                        </span>
                      </div>
                    </div>

                    <div className="dg-voucher-benefit-pill">
                      <Tag size={13} color="#FCD34D" />
                      <span>Instant ₹50 Discount Automatically Applied</span>
                    </div>

                    <div className="dg-voucher-perks-row">
                      <div className="dg-voucher-mini-perk">
                        <CheckCircle2 size={12} color="#4ADE80" />
                        <span>5% Less Making Charges</span>
                      </div>
                      <div className="dg-voucher-mini-perk">
                        <CheckCircle2 size={12} color="#4ADE80" />
                        <span>Instant UPI AutoPay</span>
                      </div>
                      <div className="dg-voucher-mini-perk">
                        <CheckCircle2 size={12} color="#4ADE80" />
                        <span>Zero Lock-In</span>
                      </div>
                    </div>

                    <div className="dg-voucher-footer">
                      <span className="dg-voucher-footer-guarantee">
                        <ShieldCheck size={12} color="#FCD34D" />
                        100% IDBI Trustee Insured Vaults
                      </span>
                      <span className="dg-voucher-status-pill">OFFER ACTIVE</span>
                    </div>
                  </div>
                </div>

                {/* HERO RIGHT: 22K 916 ATHIRAI GOLD BULLION & COIN SHOWCASE (REALISTIC BRAND ASSET) */}
                <div className="dg-offer-hero-bullion-card">
                  <div className="dg-bullion-ingot">
                    <div className="dg-bullion-ingot-header">
                      <span className="dg-bullion-brand">ATHIRAI JEWELLERY</span>
                      <span className="dg-bullion-stamp">22K 916</span>
                    </div>
                    <div className="dg-bullion-coin-center">
                      <img
                        src={goldCoinImg}
                        alt="Athirai 22K 916 Pure Gold Coin"
                        className="dg-bullion-coin-img"
                      />
                    </div>
                    <div className="dg-bullion-ingot-footer">
                      <div className="dg-bullion-purity">22K (916) PURE GOLD • BIS HALLMARK</div>
                      <div className="dg-bullion-trust">100% IDBI TRUSTEE SECURED VAULT</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIVE PLANS CARD (IF USER HAS ACTIVE PLANS) */}
              {activeAutoPayPlans.length > 0 && (
                <div className="dg-active-plans-card">
                  <div className="dg-active-plans-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={18} color="#009957" />
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0A3E42' }}>
                        Your Active AutoPay Plans ({activeAutoPayPlans.length})
                      </h4>
                    </div>
                    <span className="dg-active-status-badge">AUTO-DEBIT ACTIVE</span>
                  </div>
                  <div className="dg-active-plans-grid">
                    {activeAutoPayPlans.map((plan, idx) => (
                      <div key={plan.id || idx} className="dg-active-plan-item">
                        <div className="dg-plan-item-left">
                          <span className="dg-plan-freq-tag">{plan.frequency} AutoPay</span>
                          <span className="dg-plan-amt">₹{Number(plan.amount).toLocaleString('en-IN')}</span>
                          <span className="dg-plan-perk">₹50/g off applied • 5% off making charges</span>
                        </div>
                        <div className="dg-plan-item-right">
                          <span className="dg-plan-next">Next Debit: {plan.nextDebit}</span>
                          <button
                            type="button"
                            className="dg-plan-cancel-btn"
                            onClick={() => handleCancelAutoPayPlan(plan.id)}
                          >
                            Cancel Plan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FESTIVE PROMO ANNOUNCEMENT TICKER */}
              <div className="dg-offers-festive-ticker">
                <div className="dg-festive-ticker-left">
                  <span className="dg-festive-fire-badge">
                    <Flame size={14} /> SPECIAL OFFER ACTIVE
                  </span>
                  <span className="dg-festive-ticker-text">
                    <b>Guaranteed AutoPay Concession:</b> Subscribe to any plan below and get <b>flat ₹50/g off</b> on live 22K market rate + <b>5% jewellery making discount</b> on every deposit!
                  </span>
                </div>
                <div className="dg-festive-ticker-right">
                  <Sparkles size={14} color="#C6924B" />
                  <span>Instant UPI Auto-Debit • Cancel Anytime</span>
                </div>
              </div>

              {/* SECTION HEADER: CHOOSE YOUR AUTOPAY PLAN */}
              <div className="dg-offers-section-title-wrap">
                <h3 className="dg-offers-section-title">
                  Choose Your AutoPay Savings Frequency
                </h3>
                <p className="dg-offers-section-desc">
                  Pick a discipline that fits your routine. Every plan automatically applies ₹50/g savings on every transaction.
                </p>
              </div>

              {/* 3 CLEAN MINIMALIST HIGH-CONVERSION AUTOPAY CARDS (NO AI ARTWORK, ESSENTIAL HIGHLIGHTS ONLY) */}
              <div className="dg-autopay-cards-grid">
                {/* CARD 1: DAILY AUTO-SAVINGS */}
                <div className="dg-autopay-card deal-pass daily">
                  <div className="dg-plan-clean-header daily">
                    <div className="dg-plan-freq-pill daily">
                      <Clock size={12} />
                      <span>Daily SIP</span>
                    </div>
                    <h4 className="dg-plan-clean-title">Daily Auto-Savings</h4>
                    <span className="dg-plan-clean-sub">Micro-savings starting from just ₹10/day</span>
                  </div>

                  <div className="dg-autopay-card-body">
                    {/* CONCESSION CALLOUT */}
                    <div className="dg-plan-offer-callout daily">
                      <div className="dg-plan-offer-headline">Flat ₹50/g OFF Live 22K Rate</div>
                      <div className="dg-plan-offer-sub">
                        Pay ₹{Number(currentLiveRate - 50).toLocaleString('en-IN')}/g instead of ₹{Number(currentLiveRate).toLocaleString('en-IN')}/g
                      </div>
                    </div>

                    {/* INTERACTIVE AMOUNT PRESETS */}
                    <div className="dg-autopay-presets-section">
                      <div className="dg-presets-label-row">
                        <span className="dg-autopay-presets-label">Choose Daily Amount:</span>
                        <span className="dg-presets-selected-tag">Selected: ₹{selectedDailyAmt}/day</span>
                      </div>
                      <div className="dg-autopay-chips-wrap">
                        {['10', '50', '100', '200', '500', '1000'].map(amt => {
                          const isSelected = selectedDailyAmt === amt
                          return (
                            <button
                              key={amt}
                              type="button"
                              className={`dg-autopay-chip ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedDailyAmt(amt)}
                            >
                              <Coins size={11} className="dg-chip-coin-icon" />
                              <span>₹{amt}</span>
                            </button>
                          )
                        })}
                      </div>

                      <div className="dg-chip-dynamic-summary">
                        <Sparkles size={12} color="#009957" />
                        <span>
                          {selectedDailyAmt === '10' && 'Saves ₹300/mo • Builds disciplined daily gold habit'}
                          {selectedDailyAmt === '50' && 'Saves ₹1,500/mo • Accumulates ~0.11g 22K gold monthly'}
                          {selectedDailyAmt === '100' && 'Saves ₹3,000/mo • Accumulates ~0.22g pure gold monthly'}
                          {selectedDailyAmt === '200' && 'Saves ₹6,000/mo • Accumulates ~0.45g gold + instant discounts'}
                          {selectedDailyAmt === '500' && 'Saves ₹15,000/mo • Accumulates ~1.12g 22K gold monthly'}
                          {selectedDailyAmt === '1000' && 'Saves ₹30,000/mo • Accumulates ~2.25g gold with VIP discounts'}
                        </span>
                      </div>
                    </div>

                    {/* ONLY 2 ESSENTIAL SELLING POINTS */}
                    <div className="dg-plan-essential-perks">
                      <div className="dg-plan-perk-row">
                        <CheckCircle2 size={14} className="dg-perk-check-emerald" />
                        <span><b>₹50/g Instant Discount</b> credited on every auto-debit</span>
                      </div>
                      <div className="dg-plan-perk-row">
                        <CheckCircle2 size={14} className="dg-perk-check-emerald" />
                        <span><b>5% Less Making Charges</b> on showroom jewellery redemption</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      className="dg-autopay-cta-btn daily"
                      onClick={() => handleOpenAutoPayModal('daily', selectedDailyAmt)}
                    >
                      <Zap size={15} />
                      <span>Claim Offer • Set Up Daily ₹{selectedDailyAmt}</span>
                      <ArrowRight size={14} />
                    </button>
                    <span className="dg-autopay-cta-note">Instant UPI AutoPay • Pause or cancel anytime</span>
                  </div>
                </div>

                {/* CARD 2: WEEKLY AUTO-SAVINGS (FEATURED) */}
                <div className="dg-autopay-card deal-pass featured weekly">
                  <div className="dg-plan-clean-header weekly">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="dg-plan-freq-pill weekly">
                        <Star size={11} />
                        <span>Weekly SIP</span>
                      </div>
                      <span className="dg-plan-popular-badge">MOST POPULAR</span>
                    </div>
                    <h4 className="dg-plan-clean-title">Weekly Auto-Savings</h4>
                    <span className="dg-plan-clean-sub">Consistent savings for salaried budgets</span>
                  </div>

                  <div className="dg-autopay-card-body">
                    {/* CONCESSION CALLOUT */}
                    <div className="dg-plan-offer-callout weekly">
                      <div className="dg-plan-offer-headline gold">Flat ₹50/g OFF + 2X Rewards</div>
                      <div className="dg-plan-offer-sub">
                        Pay ₹{Number(currentLiveRate - 50).toLocaleString('en-IN')}/g instead of ₹{Number(currentLiveRate).toLocaleString('en-IN')}/g
                      </div>
                    </div>

                    {/* INTERACTIVE AMOUNT PRESETS */}
                    <div className="dg-autopay-presets-section">
                      <div className="dg-presets-label-row">
                        <span className="dg-autopay-presets-label">Choose Weekly Amount:</span>
                        <span className="dg-presets-selected-tag gold">Selected: ₹{selectedWeeklyAmt}/week</span>
                      </div>
                      <div className="dg-autopay-chips-wrap">
                        {['100', '200', '500', '1000', '2000'].map(amt => {
                          const isSelected = selectedWeeklyAmt === amt
                          return (
                            <button
                              key={amt}
                              type="button"
                              className={`dg-autopay-chip ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedWeeklyAmt(amt)}
                            >
                              <Coins size={11} className="dg-chip-coin-icon" />
                              <span>₹{amt}</span>
                            </button>
                          )
                        })}
                      </div>

                      <div className="dg-chip-dynamic-summary gold">
                        <Sparkles size={12} color="#D97706" />
                        <span>
                          {selectedWeeklyAmt === '100' && 'Saves ₹400/mo • Earns 2x Revive Coin Cashback'}
                          {selectedWeeklyAmt === '200' && 'Saves ₹800/mo • Accumulates ~0.7g pure gold yearly'}
                          {selectedWeeklyAmt === '500' && 'Saves ₹2,000/mo • Accumulates ~1.75g gold + 2x coin bonus'}
                          {selectedWeeklyAmt === '1000' && 'Saves ₹4,000/mo • Accumulates ~3.5g pure 22K gold yearly'}
                          {selectedWeeklyAmt === '2000' && 'Saves ₹8,000/mo • Accumulates ~7.0g gold + VIP benefits'}
                        </span>
                      </div>
                    </div>

                    {/* ONLY 2 ESSENTIAL SELLING POINTS */}
                    <div className="dg-plan-essential-perks">
                      <div className="dg-plan-perk-row">
                        <CheckCircle2 size={14} className="dg-perk-check-gold" />
                        <span><b>₹50/g Instant Discount</b> on live market rate</span>
                      </div>
                      <div className="dg-plan-perk-row">
                        <CheckCircle2 size={14} className="dg-perk-check-gold" />
                        <span><b>2x Revive Coin Cashback</b> on every weekly auto-debit</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      className="dg-autopay-cta-btn weekly"
                      onClick={() => handleOpenAutoPayModal('weekly', selectedWeeklyAmt)}
                    >
                      <Sparkles size={15} />
                      <span>Grab Offer • Set Up Weekly ₹{selectedWeeklyAmt}</span>
                      <ArrowRight size={14} />
                    </button>
                    <span className="dg-autopay-cta-note">Instant UPI AutoPay • Pause or cancel anytime</span>
                  </div>
                </div>

                {/* CARD 3: MONTHLY WEALTH PLAN */}
                <div className="dg-autopay-card deal-pass monthly">
                  <div className="dg-plan-clean-header monthly">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="dg-plan-freq-pill monthly">
                        <Trophy size={11} />
                        <span>Monthly SIP</span>
                      </div>
                      <span className="dg-plan-vip-badge">VIP WEALTH</span>
                    </div>
                    <h4 className="dg-plan-clean-title">Monthly Wealth Plan</h4>
                    <span className="dg-plan-clean-sub">High-value accumulation for family milestones</span>
                  </div>

                  <div className="dg-autopay-card-body">
                    {/* CONCESSION CALLOUT */}
                    <div className="dg-plan-offer-callout monthly">
                      <div className="dg-plan-offer-headline teal">Flat ₹50/g OFF + Free Coin Delivery</div>
                      <div className="dg-plan-offer-sub">
                        Pay ₹{Number(currentLiveRate - 50).toLocaleString('en-IN')}/g instead of ₹{Number(currentLiveRate).toLocaleString('en-IN')}/g
                      </div>
                    </div>

                    {/* INTERACTIVE AMOUNT PRESETS */}
                    <div className="dg-autopay-presets-section">
                      <div className="dg-presets-label-row">
                        <span className="dg-autopay-presets-label">Choose Monthly Amount:</span>
                        <span className="dg-presets-selected-tag vip">Selected: ₹{selectedMonthlyAmt}/mo</span>
                      </div>
                      <div className="dg-autopay-chips-wrap">
                        {['1000', '2000', '5000', '10000'].map(amt => {
                          const isSelected = selectedMonthlyAmt === amt
                          return (
                            <button
                              key={amt}
                              type="button"
                              className={`dg-autopay-chip ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedMonthlyAmt(amt)}
                            >
                              <Coins size={11} className="dg-chip-coin-icon" />
                              <span>₹{amt}</span>
                            </button>
                          )
                        })}
                      </div>

                      <div className="dg-chip-dynamic-summary vip">
                        <Sparkles size={12} color="#0A3E42" />
                        <span>
                          {selectedMonthlyAmt === '1000' && 'Saves ₹12,000/yr • Accumulates ~0.9g gold for family'}
                          {selectedMonthlyAmt === '2000' && 'Saves ₹24,000/yr • Eligible for free 1g 22K coin doorstep delivery'}
                          {selectedMonthlyAmt === '5000' && 'Saves ₹60,000/yr • Accumulates ~4.5g gold + priority privileges'}
                          {selectedMonthlyAmt === '10000' && 'Saves ₹1,20,000/yr • Accumulates ~9.0g pure 22K gold yearly'}
                        </span>
                      </div>
                    </div>

                    {/* ONLY 2 ESSENTIAL SELLING POINTS */}
                    <div className="dg-plan-essential-perks">
                      <div className="dg-plan-perk-row">
                        <CheckCircle2 size={14} className="dg-perk-check-teal" />
                        <span><b>₹50/g Instant Discount</b> on every monthly debit</span>
                      </div>
                      <div className="dg-plan-perk-row">
                        <CheckCircle2 size={14} className="dg-perk-check-teal" />
                        <span><b>Free Insured Doorstep Delivery</b> of physical 1g 22K gold coins</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      className="dg-autopay-cta-btn monthly"
                      onClick={() => handleOpenAutoPayModal('monthly', selectedMonthlyAmt)}
                    >
                      <Trophy size={15} />
                      <span>Unlock VIP Offer • Set Up Monthly ₹{selectedMonthlyAmt}</span>
                      <ArrowRight size={14} />
                    </button>
                    <span className="dg-autopay-cta-note">Instant UPI AutoPay • Pause or cancel anytime</span>
                  </div>
                </div>
              </div>

              {/* TRUST & BENEFITS ROW */}
              <div className="dg-offers-trust-grid">
                <div className="dg-offers-trust-card">
                  <div className="dg-trust-card-icon shield">
                    <ShieldCheck size={20} color="#009957" />
                  </div>
                  <div>
                    <h5 className="dg-trust-card-title">100% Insured Vaults</h5>
                    <p className="dg-trust-card-desc">Physical 22K 916 gold stored in secured IDBI trustee vaults.</p>
                  </div>
                </div>
                <div className="dg-offers-trust-card">
                  <div className="dg-trust-card-icon jewel">
                    <Gem size={20} color="#0A3E42" />
                  </div>
                  <div>
                    <h5 className="dg-trust-card-title">5% Off Jewellery Making</h5>
                    <p className="dg-trust-card-desc">Redeem for hallmarked jewellery at Athirai Jewellery anytime.</p>
                  </div>
                </div>
                <div className="dg-offers-trust-card">
                  <div className="dg-trust-card-icon bank">
                    <Zap size={20} color="#D97706" />
                  </div>
                  <div>
                    <h5 className="dg-trust-card-title">Direct Razorpay AutoPay</h5>
                    <p className="dg-trust-card-desc">Instant recurring setup via UPI, GPay, PhonePe, and Cards.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : currentView === 'support' ? (
            /* ══════════════════════════════════════════════════════════════
               ATHIRAI DIGI GOLD 24/7 SUPPORT & PURITY VERIFICATION PORTAL
               ══════════════════════════════════════════════════════════════ */
            <div className="dg-support-shell">
              {/* Header Navigation & Banner */}
              <div className="dg-support-header-card">
                <div className="dg-support-header-top">
                  <button
                    type="button"
                    onClick={() => setCurrentView('dashboard')}
                    className="dg-support-back-btn"
                  >
                    <ArrowLeft size={16} /> Back to Dashboard
                  </button>
                  <span className="dg-support-live-badge">
                    <ShieldCheck size={14} color="#009957" /> 100% Insured &amp; BIS 916 Hallmarked
                  </span>
                </div>
                <div className="dg-support-hero-content">
                  <div className="dg-support-title-wrap">
                    <h2 className="dg-support-main-title">
                      Athirai Digi Gold Customer Support &amp; Purity Desk
                    </h2>
                    <p className="dg-support-sub-title">
                      Dedicated assistance for your digital gold &amp; silver investments, 100% vault assurance, physical jewellery showroom redemption, and grievance redressal.
                    </p>
                  </div>
                  <div className="dg-support-cta-row">
                    <a
                      href="tel:18008902291"
                      className="dg-support-quick-call"
                    >
                      <PhoneCall size={16} />
                      <span>Call 1800 890 2291</span>
                    </a>
                    <a
                      href="https://wa.me/919840091691?text=Hello%20Athirai%20Digi%20Gold%20Support,%20I%20need%20assistance%20with%20my%20account"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dg-support-quick-wa"
                    >
                      <MessageCircle size={16} />
                      <span>WhatsApp Support</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 4 DIRECT CONTACT CHANNELS */}
              <div className="dg-support-channels-grid">
                <div className="dg-channel-card">
                  <div className="dg-channel-icon phone">
                    <PhoneCall size={22} />
                  </div>
                  <div className="dg-channel-body">
                    <span className="dg-channel-label">Toll-Free Helpline</span>
                    <h4 className="dg-channel-val">1800 890 2291</h4>
                    <p className="dg-channel-desc">Mon – Sun • 9:00 AM – 9:00 PM IST</p>
                    <a href="tel:18008902291" className="dg-channel-link">Call Now →</a>
                  </div>
                </div>

                <div className="dg-channel-card">
                  <div className="dg-channel-icon wa">
                    <MessageCircle size={22} />
                  </div>
                  <div className="dg-channel-body">
                    <span className="dg-channel-label">WhatsApp Priority Desk</span>
                    <h4 className="dg-channel-val">+91 98400 91691</h4>
                    <p className="dg-channel-desc">Chat with Digi Gold advisor directly</p>
                    <a
                      href="https://wa.me/919840091691?text=Hello%20Athirai%20Digi%20Gold%20Support"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dg-channel-link"
                    >
                      Open WhatsApp →
                    </a>
                  </div>
                </div>

                <div className="dg-channel-card">
                  <div className="dg-channel-icon mail">
                    <Mail size={22} />
                  </div>
                  <div className="dg-channel-body">
                    <span className="dg-channel-label">Support Email</span>
                    <h4 className="dg-channel-val" style={{ fontSize: 13 }}>support@athiraijewellery.com</h4>
                    <p className="dg-channel-desc">Guaranteed reply within 2 business hours</p>
                    <a href="mailto:support@athiraijewellery.com" className="dg-channel-link">Email Us →</a>
                  </div>
                </div>

                <div className="dg-channel-card">
                  <div className="dg-channel-icon store">
                    <MapPin size={22} />
                  </div>
                  <div className="dg-channel-body">
                    <span className="dg-channel-label">Athirai Flagship Showroom</span>
                    <h4 className="dg-channel-val" style={{ fontSize: 14 }}>T. Nagar, Chennai</h4>
                    <p className="dg-channel-desc">Walk in for showroom jewellery exchange &amp; audit</p>
                    <button
                      type="button"
                      className="dg-channel-btn"
                      onClick={() => alert('Athirai Jewellery Flagship Store: Usman Road, T. Nagar, Chennai - 600017. Phone: +91 44 2434 9161')}
                    >
                      Showroom Details →
                    </button>
                  </div>
                </div>
              </div>

              {/* 2-COLUMN MAIN SECTION: PURITY GUARANTEE & SUPPORT TICKET FORM */}
              <div className="dg-support-main-layout">
                {/* LEFT: 100% PURITY & VAULT ASSURANCE BREAKDOWN */}
                <div className="dg-support-purity-section">
                  <div className="dg-purity-head-card">
                    <div className="dg-purity-badge">
                      <ShieldCheck size={16} />
                      <span>100% Purity &amp; Security Assurance</span>
                    </div>
                    <h3 className="dg-purity-title">Why Athirai Digi Gold is 100% Safe</h3>
                    <p className="dg-purity-subtitle">
                      Every milligram of gold or silver you purchase is backed 1:1 by real 22K 916 physical bullion stored securely in institutional trustee vaults.
                    </p>
                  </div>

                  <div className="dg-purity-pillars-grid">
                    <div className="dg-purity-pillar-item">
                      <div className="dg-pillar-icon gold">
                        <Coins size={20} />
                      </div>
                      <div className="dg-pillar-content">
                        <h4 className="dg-pillar-h">100% BIS 916 Hallmarked Gold</h4>
                        <p className="dg-pillar-p">
                          Certified 22 Karat (91.6% purity) gold meeting strict Bureau of Indian Standards (BIS) specifications. Zero synthetic or paper gold.
                        </p>
                      </div>
                    </div>

                    <div className="dg-purity-pillar-item">
                      <div className="dg-pillar-icon shield">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="dg-pillar-content">
                        <h4 className="dg-pillar-h">IDBI Trusteeship Custodial Protection</h4>
                        <p className="dg-pillar-p">
                          An independent legal trustee (IDBI Trusteeship Services Limited) holds fiduciary custody on behalf of customers, safeguarding your ownership against all liabilities.
                        </p>
                      </div>
                    </div>

                    <div className="dg-purity-pillar-item">
                      <div className="dg-pillar-icon vault">
                        <Gem size={20} />
                      </div>
                      <div className="dg-pillar-content">
                        <h4 className="dg-pillar-h">100% Insured Bullion Vaults</h4>
                        <p className="dg-pillar-p">
                          Physical metal is stored in world-class Brink's &amp; Sequel security vaults with comprehensive multi-layer insurance against theft and natural calamities. Zero storage fee.
                        </p>
                      </div>
                    </div>

                    <div className="dg-purity-pillar-item">
                      <div className="dg-pillar-icon redeem">
                        <ArrowLeftRight size={20} />
                      </div>
                      <div className="dg-pillar-content">
                        <h4 className="dg-pillar-h">Physical Jewellery Showroom Redemption</h4>
                        <p className="dg-pillar-p">
                          Redeem your digital gold grams directly for exquisite hallmarked ornaments or coins at Athirai showrooms with exclusive 5% making charge discounts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: INTERACTIVE SUPPORT REQUEST / TICKET FORM */}
                <div className="dg-support-ticket-card">
                  <div className="dg-ticket-card-header">
                    <div className="dg-ticket-icon-wrap">
                      <Headphones size={20} />
                    </div>
                    <div>
                      <h3 className="dg-ticket-title">Submit a Support Request</h3>
                      <p className="dg-ticket-desc">Fill in details below and our dedicated team will assist you promptly.</p>
                    </div>
                  </div>

                  {supportSubmitted ? (
                    <div className="dg-ticket-success-box">
                      <div className="dg-ticket-success-icon">
                        <CheckCircle2 size={36} color="#009957" />
                      </div>
                      <h4 className="dg-ticket-success-title">Support Request Registered!</h4>
                      <div className="dg-ticket-success-code">
                        <span>Ticket ID: <b>{supportTicketId}</b></span>
                      </div>
                      <p className="dg-ticket-success-desc">
                        Our Athirai Digi Gold support specialist has been assigned to your ticket. We will get back to you within 2 business hours.
                      </p>
                      <button
                        type="button"
                        className="dg-ticket-reset-btn"
                        onClick={() => {
                          setSupportSubmitted(false)
                          setSupportMessage('')
                          setSupportTxnId('')
                        }}
                      >
                        Submit Another Query
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSupportSubmit} className="dg-ticket-form">
                      <div className="dg-form-group">
                        <label className="dg-form-label">Issue Category</label>
                        <select
                          className="dg-form-select"
                          value={supportCategory}
                          onChange={(e) => setSupportCategory(e.target.value)}
                        >
                          <option value="autopay">AutoPay &amp; Auto-Savings Assistance</option>
                          <option value="payment">Payment &amp; Transaction Verification</option>
                          <option value="purity">Gold Purity &amp; Vault Custody Inquiry</option>
                          <option value="redemption">Physical Jewellery Showroom Redemption</option>
                          <option value="delivery">Doorstep Coin Delivery Inquiry</option>
                          <option value="other">General Account / Other Inquiry</option>
                        </select>
                      </div>

                      <div className="dg-form-group">
                        <label className="dg-form-label">
                          Related Transaction Reference (Optional)
                        </label>
                        <input
                          type="text"
                          className="dg-form-input"
                          placeholder="e.g. BBKFQTXHUF or leave empty"
                          value={supportTxnId}
                          onChange={(e) => setSupportTxnId(e.target.value)}
                        />
                      </div>

                      <div className="dg-form-group">
                        <label className="dg-form-label">Describe your query *</label>
                        <textarea
                          rows={4}
                          className="dg-form-textarea"
                          placeholder="Provide details about your query or grievance..."
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="dg-ticket-submit-btn"
                        disabled={!supportMessage.trim()}
                      >
                        <Headphones size={16} />
                        <span>Submit Support Ticket</span>
                        <ArrowRight size={14} />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* FREQUENTLY ASKED QUESTIONS */}
              <div className="dg-support-faq-card">
                <div className="dg-faq-header">
                  <CircleHelp size={20} color="#009957" />
                  <h3 className="dg-faq-title">Frequently Asked Questions (FAQ)</h3>
                </div>

                <div className="dg-faq-list">
                  {[
                    {
                      q: 'How pure is the Digi Gold purchased on Athirai?',
                      a: 'Athirai Digi Gold is 100% 22 Karat (916) pure gold certified with official BIS hallmarking. Every transaction is physically backed 1:1 in IDBI Trustee-supervised vaults.'
                    },
                    {
                      q: 'Can I convert my Digi Gold into physical jewellery at Athirai showrooms?',
                      a: 'Yes! You can walk into any Athirai Jewellery showroom and exchange your Digi Gold vault balance for actual hallmarked jewellery or coins. You also enjoy an exclusive 5% concession on making charges.'
                    },
                    {
                      q: 'How does the AutoPay ₹50/g discount work?',
                      a: 'When you activate Daily, Weekly, or Monthly AutoPay, you automatically receive a flat ₹50/gram discount on the live market benchmark rate on every scheduled debit.'
                    },
                    {
                      q: 'Can I cancel or pause my AutoPay plan at any time?',
                      a: 'Absolutely. There is zero lock-in. You can pause, modify, or cancel your recurring AutoPay plan with one click from your dashboard without any cancellation fee.'
                    },
                    {
                      q: 'How safe is my physical gold in the vault?',
                      a: 'Your gold is stored in high-security vaults managed by Brink’s and Sequel, protected under institutional legal custody by IDBI Trusteeship Services Limited, and 100% insured against all risks.'
                    }
                  ].map((faq, idx) => {
                    const isOpen = openFaqIndex === idx
                    return (
                      <div
                        key={idx}
                        className={`dg-faq-item ${isOpen ? 'open' : ''}`}
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      >
                        <div className="dg-faq-q-row">
                          <span className="dg-faq-q">{faq.q}</span>
                          <span className="dg-faq-toggle">{isOpen ? '−' : '+'}</span>
                        </div>
                        {isOpen && <p className="dg-faq-a">{faq.a}</p>}
                      </div>
                    )
                  })}
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
                      <AnimatedNumber value={currentLiveRate} prefix="₹ " decimals={0} /> <span>/g</span>
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
                      <AnimatedNumber value={currentSilverRate} prefix="₹ " decimals={2} /> <span>/g</span>
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
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 26 }}>
                          <span className="dg-skel-dark" style={{ width: 130, height: 22, borderRadius: 6 }} />
                          <span className="dg-skel-dark" style={{ width: 90, height: 16, borderRadius: 5 }} />
                        </div>
                      ) : (
                        <>
                          <span className="dg-ccb-coins">
                            <AnimatedNumber value={kpis.aug_coins_balance ?? 0} decimals={0} suffix=" Coins" />
                          </span>
                          <span className="dg-ccb-inr">
                            (≈ <AnimatedNumber value={kpis.aug_balance_inr ?? 0} prefix="₹ " decimals={2} />)
                          </span>
                        </>
                      )}
                    </div>
                    <p className="dg-ccb-hint">
                      AUG Revive is used for jewelry shopping. Convert into 22K Digi Gold anytime to build real gold wealth with live market gains!
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

              {/* 5 KPI CARDS (Real Values from DB) */}
              <section className="dg-kpi-grid">
                {/* 1. Total Gold Holding */}
                <div className="dg-kpi-card" onClick={() => setCurrentView('transactions')}>
                  <div className="dg-kpi-icon-wrap gold">
                    <Coins size={22} />
                  </div>
                  <div className="dg-kpi-body">
                    <span className="dg-kpi-label">Total Gold Holding</span>
                    {loading ? (
                      <>
                        <div className="dg-skel" style={{ width: 85, height: 22, borderRadius: 6, margin: '2px 0' }} />
                        <div className="dg-skel" style={{ width: 95, height: 13, borderRadius: 4 }} />
                      </>
                    ) : (
                      <>
                        <span className="dg-kpi-val"><AnimatedNumber value={kpis.total_gold_holding_gm ?? 0} decimals={3} suffix=" g" /></span>
                        <span className="dg-kpi-sub">≈ <AnimatedNumber value={kpis.gold_value_inr ?? 0} prefix="₹ " decimals={2} /></span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Digi Gold Vault Valuation */}
                <div className="dg-kpi-card" onClick={() => setCurrentView('valuation')}>
                  <div className="dg-kpi-icon-wrap wallet">
                    <Wallet size={22} />
                  </div>
                  <div className="dg-kpi-body">
                    <span className="dg-kpi-label">Gold Vault Value</span>
                    {loading ? (
                      <>
                        <div className="dg-skel" style={{ width: 95, height: 22, borderRadius: 6, margin: '2px 0' }} />
                        <div className="dg-skel" style={{ width: 110, height: 13, borderRadius: 4 }} />
                      </>
                    ) : (
                      <>
                        <span className="dg-kpi-val"><AnimatedNumber value={kpis.gold_value_inr ?? 0} prefix="₹ " decimals={2} /></span>
                        <span className="dg-kpi-sub">@ ₹{Number(currentLiveRate).toLocaleString('en-IN')}/g (Live 22K)</span>
                      </>
                    )}
                  </div>
                  <ChevronRight size={16} className="dg-kpi-chevron" />
                </div>

                {/* 3. Digi Silver Vault Valuation — DEDICATED SILVER CARD */}
                <div className="dg-kpi-card silver" onClick={() => setCurrentView('valuation')}>
                  <div className="dg-kpi-icon-wrap silver">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="dg-kpi-body">
                    <span className="dg-kpi-label">Silver Vault Value</span>
                    {loading ? (
                      <>
                        <div className="dg-skel" style={{ width: 95, height: 22, borderRadius: 6, margin: '2px 0' }} />
                        <div className="dg-skel" style={{ width: 115, height: 13, borderRadius: 4 }} />
                      </>
                    ) : (
                      <>
                        <span className="dg-kpi-val"><AnimatedNumber value={kpis.silver_value_inr ?? 0} prefix="₹ " decimals={2} /></span>
                        <span className="dg-kpi-sub"><AnimatedNumber value={kpis.total_silver_holding_gm ?? 0} decimals={3} suffix=" g" /> @ ₹{Number(currentSilverRate).toFixed(0)}/g (Pure 999)</span>
                      </>
                    )}
                  </div>
                  <ChevronRight size={16} className="dg-kpi-chevron" />
                </div>

                {/* 4. Total Invested */}
                <div className="dg-kpi-card" onClick={() => setCurrentView('transactions')}>
                  <div className="dg-kpi-icon-wrap invested">
                    <TrendingUp size={22} />
                  </div>
                  <div className="dg-kpi-body">
                    <span className="dg-kpi-label">Total Invested</span>
                    {loading ? (
                      <div className="dg-skel" style={{ width: 90, height: 22, borderRadius: 6, margin: '2px 0' }} />
                    ) : (
                      <span className="dg-kpi-val"><AnimatedNumber value={kpis.total_invested_inr ?? 0} prefix="₹ " decimals={2} /></span>
                    )}
                  </div>
                  <ChevronRight size={16} className="dg-kpi-chevron" />
                </div>

                {/* 5. Total Returns */}
                <div className="dg-kpi-card" onClick={() => setCurrentView('transactions')}>
                  <div className={`dg-kpi-icon-wrap returns ${isNegativeReturn ? 'negative' : ''}`}>
                    <BarChart3 size={22} />
                  </div>
                  <div className="dg-kpi-body">
                    <span className="dg-kpi-label">Total Returns</span>
                    {loading ? (
                      <>
                        <div className="dg-skel" style={{ width: 70, height: 22, borderRadius: 6, margin: '2px 0' }} />
                        <div className="dg-skel" style={{ width: 55, height: 16, borderRadius: 999 }} />
                      </>
                    ) : (
                      <>
                        <span className={`dg-kpi-val ${isNegativeReturn ? 'negative' : ''}`}>
                          <AnimatedNumber value={kpis.total_returns_inr ?? 0} prefix="₹ " decimals={2} />
                        </span>
                        <span className={`dg-kpi-pill ${isNegativeReturn ? 'negative' : ''}`}>
                          <AnimatedNumber value={kpis.returns_percentage ?? 0} prefix={Number(kpis.returns_percentage ?? 0) >= 0 ? '+' : ''} suffix="%" decimals={2} />
                        </span>
                      </>
                    )}
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
                          isAnimationActive={false}
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
                      onClick={() => setCurrentView('valuation')}
                    >
                      <div className="dg-qa-icon transfer">
                        <ArrowLeftRight size={20} />
                      </div>
                      <span>Investment Sheet</span>
                    </button>
                  </div>
                </div>

                {/* Market Rates Card (22K Gold Athirai First) */}
                <div className="dg-card dg-market-rates-card">
                  <div className="dg-card-head">
                    <h3 className="dg-card-title">Market Rates</h3>
                    <span className="dg-link-more" onClick={() => setCurrentView('valuation')}>
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
                          <span className="dg-rate-num"><AnimatedNumber value={currentLiveRate} decimals={0} /></span>
                          <span className="dg-rate-unit">/g</span>
                        </div>
                        <div className="dg-rate-sub-mg">
                          ₹ {Number(currentLiveMgRate).toFixed(2)} /mg
                        </div>
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
                          <span className="dg-rate-num"><AnimatedNumber value={currentSilverRate} decimals={2} /></span>
                          <span className="dg-rate-unit">/g</span>
                        </div>
                        <div className="dg-rate-sub-mg">
                          ₹ {(Number(currentSilverRate) / 1000).toFixed(2)} /mg
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* High-Trust Bullion Vault Assurance Box */}
                  <div className="dg-market-rates-assurance">
                    <div className="dg-mra-head">
                      <ShieldCheck size={16} color="#009957" />
                      <span>100% Insured Bullion Vaults</span>
                    </div>
                    <p className="dg-mra-desc">
                      Physical gold &amp; silver backed by secure IDBI Trustee custody. Live benchmark rates refresh automatically.
                    </p>
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

                  {/* Desktop View Table (hidden on mobile <= 768px) */}
                  <div className="dg-desktop-tx-table dg-table-wrap">
                    <table className="dg-table dg-recent-tx-table">
                      <thead>
                        <tr>
                          <th style={{ whiteSpace: 'nowrap' }}>Txn ID</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Date &amp; Time</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Transaction Type</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Gold / Silver (g)</th>
                          <th style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          [1, 2, 3, 4].map(i => (
                            <tr key={`skel-${i}`}>
                              <td><div className="dg-skel" style={{ width: 95, height: 22, borderRadius: 6 }} /></td>
                              <td><div className="dg-skel" style={{ width: 120, height: 14, borderRadius: 4 }} /></td>
                              <td><div className="dg-skel" style={{ width: 110, height: 14, borderRadius: 4 }} /></td>
                              <td><div className="dg-skel" style={{ width: 65, height: 14, borderRadius: 4 }} /></td>
                              <td style={{ textAlign: 'center' }}><div className="dg-skel" style={{ width: 75, height: 20, borderRadius: 999, margin: '0 auto' }} /></td>
                            </tr>
                          ))
                        ) : transactions.length === 0 ? (
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
                          transactions.slice(0, 4).map((tx, idx) => (
                            <tr key={tx.id || idx}>
                              <td className="dg-table-txnid" style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                <span className="dg-txnid-badge" title={tx.transaction_id || `BB#${tx.id}`}>
                                  {tx.transaction_id || `BB#${tx.id}`}
                                </span>
                              </td>
                              <td className="dg-table-date" style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                <div style={{ fontWeight: 750, color: '#0A3E42', fontSize: '12.5px', lineHeight: 1.25 }}>{tx.date}</div>
                                <div style={{ fontSize: '11px', color: '#8E9E9C', fontWeight: 600, marginTop: 2 }}>{tx.time}</div>
                              </td>
                              <td className="dg-table-type" style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                <span style={{
                                   color: (tx.type || '').toLowerCase().includes('sell') ? '#E45B5B' : '#009957',
                                  fontWeight: 800,
                                  fontSize: '13px'
                                }}>
                                  {tx.type}
                                </span>
                              </td>
                              <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <span style={{ fontWeight: 800, color: '#0A3E42', fontSize: '13px' }}>
                                    {Number(tx.gm ?? 0).toFixed(3)} g
                                  </span>
                                  {Number(tx.recharge ?? 0) > 0 && (
                                    <span style={{ fontSize: '11px', color: '#647474', fontWeight: 600 }}>
                                      ₹{Number(tx.recharge).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <span className="dg-status-pill completed">{tx.status || 'Completed'}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Native Card List (Visible on mobile <= 768px) */}
                  <div className="dg-mobile-tx-list">
                    {loading ? (
                      [1, 2, 3, 4].map(i => (
                        <div key={`m-skel-${i}`} className="dg-mobile-tx-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span className="dg-skel" style={{ width: 36, height: 36, borderRadius: 10 }} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span className="dg-skel" style={{ width: 110, height: 14, borderRadius: 4 }} />
                                <span className="dg-skel" style={{ width: 80, height: 11, borderRadius: 4 }} />
                              </div>
                            </div>
                            <span className="dg-skel" style={{ width: 60, height: 16, borderRadius: 4 }} />
                          </div>
                          <span className="dg-skel" style={{ width: 110, height: 20, borderRadius: 6 }} />
                        </div>
                      ))
                    ) : transactions.length === 0 ? (
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
                    ) : (
                      transactions.slice(0, 4).map((tx, idx) => {
                        const isSilver = tx.metal_type === 'silver' || (tx.type || '').toLowerCase().includes('silver')
                        const isConvert = (tx.type || '').toLowerCase().includes('convert')
                        return (
                          <div key={`mtx-${tx.id || idx}`} className="dg-mobile-tx-card">
                            <div className="dg-mtx-top">
                              <div className="dg-mtx-left">
                                <div className={`dg-mtx-metal-icon ${isSilver ? 'silver' : isConvert ? 'convert' : 'gold'}`}>
                                  {isConvert ? <ArrowLeftRight size={15} /> : <Coins size={15} />}
                                </div>
                                <div className="dg-mtx-info">
                                  <span className="dg-mtx-type">{tx.type}</span>
                                  <span className="dg-mtx-date">{tx.date}, {tx.time}</span>
                                </div>
                              </div>
                              <div className="dg-mtx-right">
                                <span className="dg-mtx-amount">{Number(tx.gm ?? 0).toFixed(3)} g</span>
                                {Number(tx.recharge ?? 0) > 0 && (
                                  <span style={{ fontSize: '10.5px', color: '#647474', fontWeight: 600, textAlign: 'right' }}>
                                    ₹{Number(tx.recharge).toLocaleString('en-IN')}
                                  </span>
                                )}
                                <span className="dg-status-pill completed">{tx.status || 'Completed'}</span>
                              </div>
                            </div>
                            <div className="dg-mtx-bottom">
                              <span className="dg-mtx-label">TXN ID</span>
                              <span className="dg-txnid-badge" title={tx.transaction_id || `BB#${tx.id}`}>
                                {tx.transaction_id || `BB#${tx.id}`}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
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
                          Special AutoPay <br />
                          <span className="dg-rewards-h-highlight">₹50/g Offer &amp; 5% Off</span>
                        </h3>
                        <p className="dg-rewards-p">
                          Setup daily, weekly, or monthly Auto-Savings to enjoy ₹50/g instant discount on every deposit!
                        </p>
                      </div>
                      <div className="dg-rewards-visual">
                        <img src={goldCoinImg} alt="Athirai 22K Gold Coin" className="dg-rewards-coin-img" />
                        <div className="dg-rewards-visual-badge">SAVE ₹50/g</div>
                      </div>
                    </div>

                    <div className="dg-rewards-perks-grid">
                      <div className="dg-rewards-perk-item">
                        <span className="dg-rewards-perk-dot">✦</span>
                        <span>₹50/g Instant Discount on Live Rate</span>
                      </div>
                      <div className="dg-rewards-perk-item">
                        <span className="dg-rewards-perk-dot">✦</span>
                        <span>5% Less Making Charges on Jewellery</span>
                      </div>
                    </div>
                  </div>

                  <div className="dg-rewards-footer">
                    <button
                      className="dg-rewards-cta"
                      type="button"
                      onClick={() => setCurrentView('offers')}
                    >
                      <span>Explore Offers</span>
                      <ArrowRight size={14} />
                    </button>
                    <button
                      className="dg-rewards-secondary-btn"
                      type="button"
                      onClick={() => handleOpenAutoPayModal('daily', '100')}
                    >
                      <span>AutoPay</span>
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

                    <div
                      className="dg-info-item"
                      onClick={() => { setCurrentView('support'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
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

                    <div
                      className="dg-info-item"
                      onClick={() => { setCurrentView('support'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
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

                    <div className="dg-info-item" onClick={() => setCurrentView('valuation')}>
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

      {/* ── 4. MOBILE BOTTOM APP BAR (Fixed for mobile < 900px screens) ── */}
      <nav className="dg-mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`dg-mbn-item ${currentView === 'dashboard' && !sidebarOpen ? 'active' : ''}`}
          onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <div className="dg-mbn-icon-wrap">
            <LayoutDashboard size={20} />
          </div>
          <span className="dg-mbn-label">Home</span>
        </button>

        <button
          type="button"
          className={`dg-mbn-item ${currentView === 'valuation' && !sidebarOpen ? 'active' : ''}`}
          onClick={() => { setCurrentView('valuation'); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <div className="dg-mbn-icon-wrap">
            <WalletCards size={20} />
          </div>
          <span className="dg-mbn-label">Valuation</span>
        </button>

        {/* Central Floating Elevated Action: BUY GOLD */}
        <button
          type="button"
          className="dg-mbn-center-btn"
          onClick={() => { handleOpenBuyModal(); setSidebarOpen(false); }}
          aria-label="Buy Digital Gold"
        >
          <div className="dg-mbn-center-icon">
            <ShoppingCart size={22} />
          </div>
          <span className="dg-mbn-center-label">Buy Gold</span>
        </button>

        <button
          type="button"
          className={`dg-mbn-item ${currentView === 'transactions' && !sidebarOpen ? 'active' : ''}`}
          onClick={() => { setCurrentView('transactions'); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <div className="dg-mbn-icon-wrap">
            <History size={20} />
          </div>
          <span className="dg-mbn-label">Passbook</span>
        </button>

        <button
          type="button"
          className={`dg-mbn-item ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label="Toggle Full Menu"
        >
          <div className="dg-mbn-icon-wrap">
            <Menu size={20} />
          </div>
          <span className="dg-mbn-label">Menu</span>
        </button>
      </nav>

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

              <label className="dg-input-label">Select Payment Method:</label>
              <div className="dg-buy-payment-methods">
                {/* Option 1: AUG Revive */}
                <div
                  className={`dg-buy-pay-option ${buyPaymentMethod === 'wallet' ? 'active' : ''}`}
                  onClick={() => setBuyPaymentMethod('wallet')}
                >
                  <div className="dg-buy-option-left">
                    <input
                      type="radio"
                      name="buyPayMethod"
                      id="payMethodAugRevive"
                      checked={buyPaymentMethod === 'wallet'}
                      onChange={() => setBuyPaymentMethod('wallet')}
                    />
                    <div className="dg-buy-option-info">
                      <div className="dg-buy-option-title-row">
                        <span className="dg-aug-brand-tag">AUG</span>
                        <span className="dg-revive-title">Revive</span>
                        <span className="dg-buy-option-badge wallet">Wallet</span>
                      </div>
                      <span className="dg-buy-option-sub">
                        Available Balance: ₹{Number(kpis.aug_balance_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {Number(kpis.aug_balance_inr ?? 0) < parsedBuyAmount && (
                          <span className="dg-buy-option-warning"> (Insufficient)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Option 2: UPI (GPay, PhonePe, Paytm) */}
                <div
                  className={`dg-buy-pay-option ${buyPaymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setBuyPaymentMethod('upi')}
                >
                  <div className="dg-buy-option-left">
                    <input
                      type="radio"
                      name="buyPayMethod"
                      id="payMethodUpi"
                      checked={buyPaymentMethod === 'upi'}
                      onChange={() => setBuyPaymentMethod('upi')}
                    />
                    <div className="dg-buy-option-info">
                      <div className="dg-buy-option-title-row">
                        <span className="dg-direct-buy-title">UPI</span>
                        <span className="dg-buy-option-badge" style={{ background: '#E8F7F0', color: '#009957', fontWeight: 800 }}>Instant</span>
                      </div>
                      <span className="dg-buy-option-sub">
                        GPay, PhonePe, Paytm, BHIM UPI
                      </span>
                    </div>
                  </div>
                </div>

                {/* Option 3: Netbanking & Cards */}
                <div
                  className={`dg-buy-pay-option ${buyPaymentMethod === 'netbanking' ? 'active' : ''}`}
                  onClick={() => setBuyPaymentMethod('netbanking')}
                >
                  <div className="dg-buy-option-left">
                    <input
                      type="radio"
                      name="buyPayMethod"
                      id="payMethodNetbanking"
                      checked={buyPaymentMethod === 'netbanking'}
                      onChange={() => setBuyPaymentMethod('netbanking')}
                    />
                    <div className="dg-buy-option-info">
                      <div className="dg-buy-option-title-row">
                        <span className="dg-direct-buy-title">Netbanking &amp; Cards</span>
                      </div>
                      <span className="dg-buy-option-sub">
                        All Indian Banks, Debit / Credit Cards
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="dg-modal-submit-btn"
                disabled={submittingBuy || parsedBuyAmount <= 0}
              >
                {submittingBuy
                  ? 'Processing Purchase…'
                  : buyPaymentMethod === 'wallet'
                    ? `Buy ₹${parsedBuyAmount.toLocaleString('en-IN')} via AUG Revive`
                    : buyPaymentMethod === 'upi'
                      ? `Pay ₹${parsedBuyAmount.toLocaleString('en-IN')} via UPI`
                      : `Pay ₹${parsedBuyAmount.toLocaleString('en-IN')} via Netbanking / Cards`}
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

            {/* Available Vault Holding Card with MAX Button */}
            <div className="dg-vault-available-card">
              <div className="dg-vault-available-info">
                <span className="dg-vault-available-label">
                  Available {sellMetal === 'gold_22k' ? '22K Gold' : 'Digi Silver'} in Vault:
                </span>
                <span className="dg-vault-available-num">
                  {availableSellGm.toFixed(4)} g ({availableSellMg.toFixed(2)} mg)
                </span>
              </div>
              {availableSellGm > 0 && (
                <button
                  type="button"
                  className="dg-vault-max-btn"
                  onClick={() => setSellGrams(availableSellGm.toString())}
                  title="Sell maximum available holding"
                >
                  SELL ALL (MAX)
                </button>
              )}
            </div>

            {hasNoHoldingsToSell && (
              <div style={{
                padding: '9px 12px', background: '#FFF5F5', border: '1px solid #FEB2B2',
                borderRadius: 10, color: '#C53030', fontSize: 12, marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 7
              }}>
                <AlertCircle size={15} />
                <span>You do not have any {sellMetal === 'gold_22k' ? '22K Gold' : 'Digi Silver'} in your digital vault to sell.</span>
              </div>
            )}

            {isOverSelling && (
              <div style={{
                padding: '9px 12px', background: '#FFF5F5', border: '1px solid #FEB2B2',
                borderRadius: 10, color: '#C53030', fontSize: 12, marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 7
              }}>
                <AlertCircle size={15} />
                <span>Cannot sell more than available holding ({availableSellGm.toFixed(4)} g).</span>
              </div>
            )}

            <ModalFeedbackNotice
              feedback={sellFeedback}
              onDismiss={() => setSellFeedback(null)}
              onBuyGold={() => { setShowSellModal(false); setShowBuyModal(true); }}
            />

            <form onSubmit={handleSellGold}>
              <label className="dg-input-label">Quantity to Sell (Grams):</label>
              <input
                type="number"
                min="0.0001"
                max={availableSellGm > 0 ? availableSellGm : 0}
                step="any"
                className="dg-form-input"
                value={sellGrams}
                onChange={e => setSellGrams(e.target.value)}
                placeholder={availableSellGm > 0 ? `Enter grams (Max: ${availableSellGm.toFixed(4)}g)` : 'No vault holdings'}
                disabled={hasNoHoldingsToSell}
                required
              />

              <div className="dg-calc-preview">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="dg-calc-label">You Will Receive:</span>
                  <span className="dg-calc-val">
                    ₹ {Math.round(previewSellPayout).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#009957', fontWeight: 700 }}>
                  <span>AUG Coins Credited:</span>
                  <span>+ {previewSellCoins.toLocaleString()} Coins (100 coins = ₹1)</span>
                </div>
              </div>

              <button
                type="submit"
                className="dg-modal-submit-btn"
                style={{ background: hasNoHoldingsToSell || isOverSelling ? '#CBD5E1' : '#E45B5B' }}
                disabled={submittingSell || parsedSellGm <= 0 || isOverSelling || hasNoHoldingsToSell}
              >
                {submittingSell
                  ? 'Processing Sale…'
                  : hasNoHoldingsToSell
                  ? 'No Holdings to Sell'
                  : isOverSelling
                  ? `Exceeds Available (${availableSellGm.toFixed(4)}g Max)`
                  : `Sell ${parsedSellGm}g & Credit ₹${Math.round(previewSellPayout).toLocaleString('en-IN')}`}
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
                  <h3 className="dg-modal-title" style={{ margin: 0, fontSize: 17 }}>Convert AUG Revive to Digi Gold</h3>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#6A8280' }}>Deducts AUG Revive and creates 22K Digital Gold in your vault</p>
                </div>
              </div>
              <button className="dg-modal-close" onClick={() => setShowConvertModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Balances & Live Rate Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: '10px 12px', background: '#F8FAF9', borderRadius: 12, border: '1px solid #E6ECEA' }}>
                <span style={{ fontSize: 11, color: '#6A8280', fontWeight: 600, display: 'block' }}>Available AUG Revive</span>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0A3E42' }}>
                  {userAugCoins.toLocaleString()} <small style={{ fontSize: 11, color: '#009957', fontWeight: 700 }}>Revive</small>
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
                  <span style={{ color: '#4A5568', fontWeight: 600 }}>AUG Revive to Deduct:</span>
                  <span style={{ fontWeight: 800, color: '#E53E3E' }}>
                    - {previewConvertCoins.toLocaleString()} Revive
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
                  <span>Insufficient AUG Revive. You have {userAugCoins.toLocaleString()} Revive (need {previewConvertCoins.toLocaleString()} Revive).</span>
                </div>
              )}

              <button
                type="submit"
                className="dg-modal-submit-btn"
                disabled={submittingConvert || parsedConvertAmount <= 0 || !hasEnoughCoins}
              >
                {submittingConvert ? 'Processing Conversion…' : `Convert ${previewConvertCoins.toLocaleString()} Revive to ${previewConvertGm.toFixed(4)}g 22K Gold`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SET UP DIGI GOLD AUTOPAY / AUTO-SAVINGS (RAZORPAY RECURRING) ── */}
      {showAutoPayModal && (
        <div className="dg-modal-overlay" onClick={() => setShowAutoPayModal(false)}>
          <div className="dg-modal-box" onClick={e => e.stopPropagation()}>
            <div className="dg-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8833E'
                }}>
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="dg-modal-title" style={{ margin: 0, fontSize: 17 }}>
                    Set Up Digi Gold AutoPay
                  </h3>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#6A8280' }}>
                    Guaranteed ₹50/g discount &amp; 5% off jewellery making charges
                  </p>
                </div>
              </div>
              <button className="dg-modal-close" onClick={() => setShowAutoPayModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Frequency Switcher Tabs */}
            <div className="dg-freq-tabs-row">
              <button
                type="button"
                className={`dg-freq-tab-btn ${autoPayFrequency === 'daily' ? 'active' : ''}`}
                onClick={() => {
                  setAutoPayFrequency('daily')
                  if (!['10', '50', '100', '200', '500', '1000'].includes(autoPayAmount)) {
                    setAutoPayAmount('100')
                  }
                }}
              >
                Daily (Day)
              </button>
              <button
                type="button"
                className={`dg-freq-tab-btn ${autoPayFrequency === 'weekly' ? 'active' : ''}`}
                onClick={() => {
                  setAutoPayFrequency('weekly')
                  if (!['100', '200', '500', '1000', '2000'].includes(autoPayAmount)) {
                    setAutoPayAmount('500')
                  }
                }}
              >
                Weekly (Week)
              </button>
              <button
                type="button"
                className={`dg-freq-tab-btn ${autoPayFrequency === 'monthly' ? 'active' : ''}`}
                onClick={() => {
                  setAutoPayFrequency('monthly')
                  if (!['1000', '2000', '5000', '10000'].includes(autoPayAmount)) {
                    setAutoPayAmount('2000')
                  }
                }}
              >
                Monthly (Month)
              </button>
            </div>

            {/* Rate Badge with ₹50/g Discount */}
            <div className="dg-modal-rate-badge" style={{ background: '#FFFDF5', borderColor: '#F59E0B' }}>
              <div>
                <span className="dg-modal-rate-label" style={{ color: '#8F5E00' }}>
                  AutoPay Offer Rate (22K Gold):
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="dg-modal-rate-val" style={{ color: '#0A3E42', fontSize: 16 }}>
                    ₹ {Number(currentLiveRate - 50).toLocaleString('en-IN')}/g
                  </span>
                  <span style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: 12 }}>
                    ₹ {Number(currentLiveRate).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <span className="dg-offer-badge-pill">SAVE ₹50/g</span>
            </div>

            <ModalFeedbackNotice
              feedback={autoPayFeedback}
              onDismiss={() => setAutoPayFeedback(null)}
            />

            <form onSubmit={handleAutoPaySubmit}>
              <label className="dg-input-label">
                Select {autoPayFrequency === 'daily' ? 'Daily' : autoPayFrequency === 'weekly' ? 'Weekly' : 'Monthly'} Deposit (₹):
              </label>

              {/* Amount Presets */}
              <div className="dg-amount-presets" style={{ flexWrap: 'wrap', gap: 6 }}>
                {(autoPayFrequency === 'daily'
                  ? ['10', '50', '100', '200', '500', '1000']
                  : autoPayFrequency === 'weekly'
                  ? ['100', '200', '500', '1000', '2000']
                  : ['1000', '2000', '5000', '10000']
                ).map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`dg-preset-btn ${autoPayAmount === p ? 'active' : ''}`}
                    onClick={() => setAutoPayAmount(p)}
                  >
                    ₹{p}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min={autoPayFrequency === 'daily' ? 10 : autoPayFrequency === 'weekly' ? 100 : 1000}
                step="any"
                className="dg-form-input"
                value={autoPayAmount}
                onChange={e => setAutoPayAmount(e.target.value)}
                placeholder={`Enter custom amount in ₹ (Min: ₹${autoPayFrequency === 'daily' ? 10 : autoPayFrequency === 'weekly' ? 100 : 1000})`}
                required
              />

              {/* Live Calculation Preview */}
              <div className="dg-autopay-calc-preview">
                <div className="dg-calc-row">
                  <span style={{ color: '#647474' }}>Live Benchmark Price:</span>
                  <span>₹ {Number(currentLiveRate).toLocaleString('en-IN')}/g</span>
                </div>
                <div className="dg-calc-row">
                  <span style={{ color: '#009957', fontWeight: 700 }}>AutoPay Instant Discount:</span>
                  <span style={{ color: '#009957', fontWeight: 800 }}>-₹ 50.00 /g</span>
                </div>
                <div className="dg-calc-row">
                  <span style={{ color: '#647474' }}>Effective Offer Price:</span>
                  <span style={{ fontWeight: 800, color: '#0A3E42' }}>₹ {Number(currentLiveRate - 50).toLocaleString('en-IN')}/g</span>
                </div>
                <div className="dg-calc-row highlight">
                  <span>Vault Gold Credited per Deposit:</span>
                  <span style={{ fontSize: 14 }}>
                    {(parseFloat(autoPayAmount || 0) / Math.max(1, currentLiveRate - 50)).toFixed(4)} g
                  </span>
                </div>
              </div>

              {/* Offer Perks Checklist */}
              <div style={{
                background: 'rgba(0, 153, 87, 0.06)',
                border: '1px solid rgba(0, 153, 87, 0.2)',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#009957', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} strokeWidth={3} />
                  <span>₹50/g discount automatically applied on every deposit</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#009957', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} strokeWidth={3} />
                  <span>5% Less Making Charges on jewellery redemption</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#647474', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} strokeWidth={3} />
                  <span>Direct auto-debit via Razorpay UPI / Cards • Cancel anytime</span>
                </div>
              </div>

              <button
                type="submit"
                className="dg-modal-submit-btn"
                style={{ background: 'linear-gradient(135deg, #009957, #007A45)' }}
                disabled={submittingAutoPay || parseFloat(autoPayAmount || 0) <= 0}
              >
                {submittingAutoPay
                  ? 'Initiating AutoPay…'
                  : `Activate AutoPay ₹${parseFloat(autoPayAmount || 0).toLocaleString('en-IN')}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ULTRA-PREMIUM SUCCESS POPUP MODAL (FOR BUY, SELL, & CONVERT) ── */}
      {actionSuccessData && (
        <div className="dg-modal-overlay" onClick={() => setActionSuccessData(null)}>
          <div className="dg-modal-box dg-success-modal-box" onClick={e => e.stopPropagation()}>
            {/* Top Close Button */}
            <button
              className="dg-modal-close"
              onClick={() => setActionSuccessData(null)}
              style={{ position: 'absolute', top: 18, right: 18 }}
            >
              <X size={18} />
            </button>

            {/* Glowing Emerald Checkmark Icon */}
            <div className="dg-success-icon-wrap">
              <Check size={36} strokeWidth={3} />
            </div>

            {/* Metal Asset Badge */}
            <div className={`dg-success-badge-pill ${actionSuccessData.metal === 'gold_22k' ? 'gold' : 'silver'}`}>
              <Sparkles size={14} />
              <span>{actionSuccessData.metalLabel}</span>
            </div>

            <h3 className="dg-success-title">{actionSuccessData.title}</h3>
            <p className="dg-success-sub">{actionSuccessData.message}</p>

            {/* Hero Value Highlight Box */}
            <div className="dg-success-hero-num">
              <span className="dg-success-hero-val">
                {actionSuccessData.actionType === 'sell'
                  ? `+ ₹ ${Number(actionSuccessData.amountInr).toLocaleString('en-IN')}`
                  : `+ ${Number(actionSuccessData.grams).toFixed(4)} g`}
              </span>
              <span className="dg-success-hero-desc">
                {actionSuccessData.actionType === 'sell'
                  ? `Instant Settlement • Credited to Wallet Balance (${Number(actionSuccessData.coins).toLocaleString()} AUG Revive)`
                  : `≈ ${Number(actionSuccessData.milligrams).toFixed(2)} mg Secured in Your Digital Vault`}
              </span>
            </div>

            {/* Transaction Receipt Details */}
            <div className="dg-success-receipt">
              <div className="dg-success-receipt-row">
                <span className="dg-success-receipt-label">Transaction Type:</span>
                <span className="dg-success-receipt-val highlight">
                  {actionSuccessData.actionType === 'buy' ? 'Vault Purchase' : actionSuccessData.actionType === 'sell' ? 'Vault Sale' : 'Coins Conversion'}
                </span>
              </div>
              <div className="dg-success-receipt-row">
                <span className="dg-success-receipt-label">Amount (₹):</span>
                <span className="dg-success-receipt-val">
                  ₹ {Number(actionSuccessData.amountInr).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="dg-success-receipt-row">
                <span className="dg-success-receipt-label">Asset Quantity:</span>
                <span className="dg-success-receipt-val">
                  {Number(actionSuccessData.grams).toFixed(4)} g ({Number(actionSuccessData.milligrams).toFixed(2)} mg)
                </span>
              </div>
              <div className="dg-success-receipt-row">
                <span className="dg-success-receipt-label">Applied Rate:</span>
                <span className="dg-success-receipt-val">
                  ₹ {Number(actionSuccessData.rate).toLocaleString('en-IN')}/g (₹ {(Number(actionSuccessData.rate)/1000).toFixed(4)}/mg)
                </span>
              </div>
              <div className="dg-success-receipt-row">
                <span className="dg-success-receipt-label">AUG Revive Impact:</span>
                <span className="dg-success-receipt-val" style={{ color: actionSuccessData.actionType === 'sell' ? '#009957' : '#E53E3E' }}>
                  {actionSuccessData.actionType === 'sell' ? `+ ${Number(actionSuccessData.coins).toLocaleString()} Revive Credited` : `- ${Number(actionSuccessData.coins).toLocaleString()} Revive Deducted`}
                </span>
              </div>
              {actionSuccessData.transactionId && (
                <div className="dg-success-receipt-row">
                  <span className="dg-success-receipt-label">Transaction ID:</span>
                  <span
                    className="dg-success-receipt-val txnid"
                    onClick={() => {
                      navigator.clipboard.writeText(actionSuccessData.transactionId)
                      setCopiedTxn(true)
                      setTimeout(() => setCopiedTxn(false), 2000)
                    }}
                    title="Click to copy Transaction ID"
                  >
                    <span>{actionSuccessData.transactionId}</span>
                    {copiedTxn ? <Check size={13} color="#009957" /> : <Copy size={13} />}
                  </span>
                </div>
              )}
              <div className="dg-success-receipt-row">
                <span className="dg-success-receipt-label">Time &amp; Security:</span>
                <span className="dg-success-receipt-val" style={{ fontSize: 11.5, color: '#647474' }}>
                  {actionSuccessData.dateTime || 'Just now'} • 100% BIS Hallmarked
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="dg-success-actions-row">
              <button
                type="button"
                className="dg-success-btn-primary"
                onClick={() => {
                  setActionSuccessData(null)
                  setCurrentView('transactions')
                }}
              >
                <span>View in Transactions</span>
                <ArrowRight size={16} />
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="dg-success-btn-secondary"
                  onClick={() => {
                    setActionSuccessData(null)
                    setCurrentView('valuation')
                  }}
                  style={{ flex: 1 }}
                >
                  Valuation Sheet
                </button>
                <button
                  type="button"
                  className="dg-success-btn-secondary"
                  onClick={() => setActionSuccessData(null)}
                  style={{ flex: 1 }}
                >
                  Done
                </button>
              </div>
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
