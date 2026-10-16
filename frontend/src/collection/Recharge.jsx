import { ArrowUpRight, ShieldCheck, WalletCards, Plus, Check, CheckCircle2, AlertCircle, RefreshCw, History, LockKeyhole, Repeat2, ChevronDown, Gem, Gift, ShoppingBag, TrendingUp, CreditCard, Landmark, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerFooter from './CustomerFooter'

const GOLD = '#BB8958'
const DARK = '#111817'
const CREAM = '#FDFDFC'
const MUTED = '#7A8987'
const RED = '#073B3F'
const COIN_RATE = 100 // 1 Rs = 100 coins

const MethodIcon = ({ type, size = 22 }) => {
  const icons = { reward: Gift, commission: TrendingUp, purchase: ShoppingBag, digi: Gem, card: CreditCard, netbanking: Landmark, upi: Smartphone, wallet: WalletCards }
  const Icon = icons[type] || History
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />
}

const RupeeIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="4" x2="18" y2="4" /><line x1="6" y1="9" x2="18" y2="9" />
    <path d="M6 4c5 0 8 2 8 5.5S11 15 6 15" /><line x1="6" y1="15" x2="18" y2="21" />
  </svg>
)
const CoinStackIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
    <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
  </svg>
)
const ReceiptIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h9l3 3v17l-3-2-3 2-3-2-3 2V2Z" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="16" y2="11" />
  </svg>
)
const DownloadIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v13" /><path d="m6 11 6 6 6-6" /><path d="M4 21h16" />
  </svg>
)
const DirectionBadge = ({ direction }) => (
  <span className={`rc-direction-badge ${direction}`}>
    {direction === 'debit' ? '− DEBIT' : '+ CREDIT'}
  </span>
)

const TransactionSkeleton = ({ count = 3 }) => (
  <div className="rc-skeleton-list" role="status" aria-label="Loading transactions">
    <span className="rc-sr-only">Loading transactions...</span>
    {Array.from({ length: count }, (_, index) => <div className="rc-skeleton-row" key={index} aria-hidden="true"><span className="rc-skeleton-block rc-skeleton-icon" /><div><span className="rc-skeleton-block rc-skeleton-title" /><span className="rc-skeleton-block rc-skeleton-detail" /></div><span className="rc-skeleton-block rc-skeleton-value" /></div>)}
  </div>
)

const PRESET_AMOUNTS = [100, 1000, 5000, 10000, 100000]

const rechargeStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .rc-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK}}
  .rc-main{width:min(1400px,calc(100% - 64px));margin:0 auto;padding:44px 0 90px;animation:fadeUp .4s ease both}
  .rc-kicker{margin:0 0 8px;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .rc-title{margin:0 0 30px;color:${RED};font-family:"Playfair Display",serif;font-size:clamp(30px,4vw,44px)}
  .rc-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:28px}
  .rc-card{border:1px solid rgba(189,207,206,.8);border-radius:10px;background:#fff;box-shadow:0 18px 46px rgba(12,64,68,.08);padding:26px}
  .rc-balance-card{background:linear-gradient(135deg,${RED},#0C4044);color:#fff;border:none;display:flex;flex-direction:column;gap:6px}
  .rc-balance-label{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;opacity:.8;font-weight:800}
  .rc-balance-value{font-family:"Playfair Display",serif;font-size:40px;display:flex;align-items:baseline;gap:8px}
  .rc-balance-value span{font-size:15px;font-weight:700;opacity:.85}
  .rc-today-row{margin-top:14px;display:flex;justify-content:space-between;font-size:12px;opacity:.85;border-top:1px dashed rgba(255,255,255,.3);padding-top:12px}
  .rc-section-title{margin:0 0 16px;font-size:14px;font-weight:900;color:${RED};letter-spacing:.6px}
  .rc-amount-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
  .rc-amount-btn{padding:14px 8px;border-radius:8px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${DARK};font-weight:800;font-size:14px;cursor:pointer;transition:.15s ease}
  .rc-amount-btn.active{border-color:${RED};background:rgba(7,59,63,.06);color:${RED}}
  .rc-coin-preview{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:8px;background:rgba(187,137,88,.1);border:1px dashed ${GOLD};margin-bottom:20px;font-size:14px;font-weight:800;color:#9F6130}
  .rc-pay-btn{width:100%;min-height:52px;border:none;border-radius:999px;background:linear-gradient(135deg,${RED},#0C4044);color:#fff;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:.2s ease}
  .rc-pay-btn:disabled{background:#BDCFCE;cursor:not-allowed}
  .rc-pay-btn:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(7,59,63,.22)}
  .rc-banner{margin-bottom:18px;padding:13px 16px;border-radius:8px;font-size:13px;font-weight:700}
  .rc-banner.success{background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.3)}
  .rc-banner.error{background:rgba(229,62,62,.1);color:#e53e3e;border:1px solid rgba(229,62,62,.3)}
  .rc-history-row{display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(189,207,206,.4);transition:background .15s ease;border-radius:8px}
  .rc-history-row:hover{background:rgba(7,59,63,.03)}
  .rc-history-row:last-child{border-bottom:none}
  .rc-history-icon{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:17px;color:#fff;font-weight:900}
  .rc-history-body{flex:1;min-width:0}
  .rc-history-amount{font-size:14px;font-weight:900;color:${DARK};margin-bottom:2px}
  .rc-history-coins{color:${GOLD};font-weight:900}
  .rc-history-date{color:${MUTED};font-size:11px;font-weight:600}
  .rc-method-tag{font-size:10px;font-weight:900;padding:5px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap;flex-shrink:0}
  .rc-method-tag.card{background:rgba(37,99,235,.12);color:#2563eb}
  .rc-method-tag.upi{background:rgba(147,51,234,.12);color:#9333ea}
  .rc-method-tag.netbanking{background:rgba(234,88,12,.12);color:#ea580c}
  .rc-method-tag.wallet{background:rgba(13,148,136,.12);color:#0d9488}
  .rc-method-tag.other{background:rgba(7,59,63,.08);color:${RED}}
  .rc-method-tag.commission{background:rgba(139,92,246,.12);color:#8b5cf6}
  .rc-method-tag.purchase{background:rgba(229,62,62,.1);color:#c0392b}
  .rc-method-tag.reward{background:rgba(22,118,79,.12);color:#16764F}
  .rc-history-source{color:${GOLD};font-size:11px;font-weight:700;margin-top:2px}
  .rc-direction-badge{display:inline-block;font-size:9px;font-weight:900;padding:3px 8px;border-radius:20px;letter-spacing:.4px;margin-left:8px}
  .rc-direction-badge.credit{background:rgba(22,163,74,.12);color:#16a34a}
  .rc-direction-badge.debit{background:rgba(229,62,62,.1);color:#c0392b}
  .rc-empty{color:${MUTED};font-size:13px;text-align:center;padding:24px 0}
  .rc-date-header{font-size:11px;font-weight:900;color:${MUTED};text-transform:uppercase;letter-spacing:1px;padding:14px 4px 6px}
  .rc-filter-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px}
  .rc-filter-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .rc-filter-tab{padding:8px 16px;border-radius:20px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${DARK};font-weight:800;font-size:12px;cursor:pointer;transition:.15s ease;white-space:nowrap}
  .rc-filter-tab.active{border-color:${RED};background:${RED};color:#fff}
  .rc-custom-date{padding:8px 12px;border-radius:8px;border:1.5px solid #D1DFDE;font-size:12px;font-weight:700;color:${DARK};height:38px;box-sizing:border-box}
  .rc-date-to-label{display:flex;align-items:center;height:38px;color:${MUTED};font-weight:800;font-size:12px}
  .rc-apply-btn{height:38px;padding:0 18px;border-radius:20px;border:none;background:${GOLD};color:#fff;font-weight:900;font-size:12px;cursor:pointer;transition:.15s ease}
  .rc-apply-btn:hover{background:#9F6130}
  .rc-apply-btn:disabled{opacity:.5;cursor:not-allowed}
  .rc-download-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:20px;border:1.5px solid ${RED};background:#fff;color:${RED};font-weight:800;font-size:12px;cursor:pointer;transition:.15s ease;white-space:nowrap}
  .rc-download-btn:hover{background:${RED};color:#fff}
  @media(max-width:600px){.rc-filter-row{flex-direction:column;align-items:stretch}.rc-download-btn{justify-content:center}}
  .rc-spend-card{background:linear-gradient(135deg,${GOLD},#9F6130);color:#fff;border:none}
  .rc-spend-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0}
  .rc-spend-row + .rc-spend-row{border-top:1px dashed rgba(255,255,255,.3)}
  .rc-spend-label{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;opacity:.92}
  .rc-spend-value{font-size:17px;font-weight:900;font-family:"Playfair Display",serif}
  .rc-spend-icon{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  @media(max-width:760px){.rc-grid{grid-template-columns:1fr}}

  /* Wallet experience: actual balances, clear payment choices, gentle motion. */
  .rc-page{--rc-ink:#073b3f;--rc-leaf:#176b66;--rc-line:#dce5e7;background:radial-gradient(ellipse at 100% 0%,#f7eddb 0,transparent 32%),#f3f6f8;color:var(--rc-ink)}
  .rc-page *,.rc-page *::before,.rc-page *::after{box-sizing:border-box}
  .rc-main{width:min(1440px,calc(100% - 64px));padding:36px 0 72px;animation:none}
  .rc-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:30px;animation:rc-enter 320ms ease-out both}
  .rc-kicker{display:flex;align-items:center;gap:8px;color:#9b7a44;font-size:10px;font-weight:700;letter-spacing:1.9px;margin-bottom:12px}.rc-kicker>span{width:6px;height:6px;border-radius:50%;background:#b99458}
  .rc-title{font-family:'Playfair Display',Georgia,serif;font-size:clamp(29px,3.2vw,44px);font-weight:700;line-height:1.15;letter-spacing:-1.1px;margin:0;color:var(--rc-ink)}
  .rc-subtitle{margin:12px 0 0;font-size:13px;line-height:1.8;color:#566b73;max-width:520px}
  .rc-hero-actions{display:flex;align-items:center;gap:10px;flex-shrink:0}
  .rc-dashboard-link,.rc-autopay-btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:43px;padding:10px 14px;border:1px solid #d5e2e5;border-radius:12px;background:#ffffffc7;color:#104a50;font-family:inherit;font-size:11px;font-weight:650;cursor:pointer;transition:background 160ms,border-color 160ms}
  .rc-dashboard-link:hover,.rc-autopay-btn:hover{background:#fff;border-color:#699b9f}.rc-dashboard-link>svg:first-child{color:#a4834f}.rc-autopay-btn strong{font-size:11px;border-radius:5px;margin-left:5px;padding:3px 5px;background:#edf2f4;color:#526b75}.rc-autopay-btn.is-on strong{color:#356b40;background:#e3efd9}
  .rc-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.95fr);grid-template-areas:'balance recharge' 'recent recharge';gap:22px;align-items:start}
  .rc-card{min-width:0;padding:26px;border:1px solid var(--rc-line);border-radius:22px;box-shadow:0 12px 32px #173f3005;background:#fff}
  .rc-balance-card{grid-area:balance;position:relative;isolation:isolate;overflow:hidden;padding:29px 30px 23px;border:1px solid #13545c;min-height:286px;background:radial-gradient(ellipse at 100% 0%,#20838b40,transparent 65%),linear-gradient(118deg,#063139,#0b4d56);color:#fff;box-shadow:0 12px 30px #163f3912;animation:rc-enter 360ms 40ms ease-out both;gap:0}
  .rc-balance-card::before{content:'';position:absolute;inset:-60% auto -60% -60%;width:40%;background:linear-gradient(90deg,transparent,#fff4cb0b,transparent);transform:rotate(25deg);animation:rc-wallet-sheen 1100ms 200ms ease-out both;z-index:-1;pointer-events:none}
  .rc-wallet-top{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:28px}
  .rc-wallet-label{display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:1.4px;font-weight:600;color:#f3e4bd}
  .rc-wallet-icon{width:35px;height:35px;border:1px solid #d3c28e3d;background:#ffffff09;color:#e6d09c;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
  .rc-wallet-mark{font-family:Georgia,serif;font-size:13px;color:#e5d4a7;border:1px solid #d8bd783b;border-radius:50%;width:38px;height:38px;display:grid;place-items:center;transform:rotate(-12deg);flex-shrink:0}
  .rc-balance-label{font-size:12px;text-transform:none;letter-spacing:0;font-weight:500;color:#d9edef;opacity:1;margin:0 0 10px}
  .rc-balance-value{position:relative;display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;font-family:'Montserrat',system-ui,sans-serif;font-size:clamp(32px,3.3vw,48px);font-weight:700;line-height:1.2;letter-spacing:-1.5px;font-variant-numeric:tabular-nums;color:#fff;overflow-wrap:anywhere}
  .rc-balance-value .rc-balance-unit{font-size:12px;letter-spacing:0;font-weight:500;color:#d9edef;opacity:1}.rc-balance-value .rc-balance-unavailable{font:inherit;font-size:28px;letter-spacing:-.5px}
  .rc-currency-value{font-size:12px;line-height:1.7;color:#d9edef;margin:9px 0 22px}
  .rc-wallet-decoration{position:absolute;z-index:-1;right:-42px;top:45px;width:180px;color:#d8c38a24;pointer-events:none}.rc-wallet-decoration svg{display:block;width:100%}
  .rc-wallet-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:17px;margin-top:auto;border-top:1px solid #ffffff20}
  .rc-today-label{display:block;font-size:10px;color:#bcd9dd;margin-bottom:6px}.rc-wallet-bottom strong{display:block;font-size:12px;font-weight:650;line-height:1.6}.rc-wallet-bottom strong small{display:block;font-size:10px;color:#d9edef;font-weight:500}
  .rc-convert-link{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 11px;min-height:40px;border:1px solid #d8bd784a;border-radius:10px;background:#ffffff08;color:#e6d4a6;font:inherit;font-size:10px;font-weight:600;cursor:pointer}.rc-convert-link:hover{background:#ffffff12}.rc-convert-link:disabled{opacity:.45;cursor:not-allowed}
  .rc-wallet-error{display:flex;align-items:center;gap:7px;font-size:11px;color:#fae7b4;line-height:1.7;margin:0 0 16px}.rc-wallet-error svg{flex-shrink:0}.rc-wallet-error button{border:1px solid #d5c17f66;border-radius:6px;background:transparent;color:#fff;padding:4px 8px;font:inherit;cursor:pointer}
  .rc-balance-skeleton{display:block;width:220px;height:44px!important;border-radius:8px;background:linear-gradient(90deg,#ffffff12,#ffffff25,#ffffff12);background-size:200% 100%;animation:rc-soft-shimmer 1.6s linear infinite}
  .rc-recharge-card{grid-area:recharge;padding:27px;animation:rc-enter 360ms 90ms ease-out both;border-color:#dce5e7}
  .rc-panel-heading{display:flex;align-items:center;gap:12px}.rc-panel-icon{display:grid;place-items:center;flex-shrink:0;width:42px;height:42px;border-radius:13px;background:#f5eedc;border:1px solid #e8daba;color:#a07b3d}
  .rc-eyebrow{display:block;color:#9c8356;font-size:10px;font-weight:650;letter-spacing:1.45px;margin-bottom:6px}
  .rc-section-title{font-size:18px;font-weight:700;color:var(--rc-ink);letter-spacing:-.4px;margin:0;line-height:1.4}
  .rc-panel-copy{font-size:12px;color:#5c7079;line-height:1.8;margin:16px 0 22px;max-width:400px}
  .rc-field-label{display:block;font-size:11px;color:#294e59;font-weight:600;margin:0 0 9px}
  .rc-amount-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:21px}
  .rc-amount-btn{position:relative;display:flex;align-items:center;justify-content:center;gap:5px;min-height:52px;padding:12px 8px;border:1px solid #d5e1e5;border-radius:12px;background:#fff;color:#173f4b;font-family:inherit;font-size:13px;font-weight:650;white-space:nowrap;transition:background 160ms,border-color 160ms,box-shadow 160ms}
  .rc-amount-btn:hover{background:#f0f8f9;border-color:#6c9ca6}.rc-amount-btn.active{color:#fff;background:#0a4650;border-color:#0a4650;box-shadow:inset 0 0 0 .5px #0a4650}.rc-amount-check{color:#f2d28b;flex-shrink:0}.rc-amount-btn:disabled{cursor:default;opacity:.65}
  .rc-rate-note{display:flex;align-items:center;gap:5px;font-size:10px;color:#5e747d;margin:9px 0 20px}
  .rc-coin-preview{display:flex;align-items:center;justify-content:flex-start;gap:12px;padding:17px 15px;margin-bottom:0;border:1px solid #cbdfe2;border-radius:14px;background:linear-gradient(110deg,#eaf5f6,#f4fafb);color:#0b4e58;transition:background 180ms}
  .rc-preview-icon{display:grid;place-items:center;flex-shrink:0;width:39px;height:39px;border-radius:12px;background:#cfe7eb;color:#125f6d}.rc-coin-preview>div{min-width:0;flex:1}.rc-coin-preview small{display:block;font-size:10px;font-weight:650;letter-spacing:1.1px;color:#496c76;margin-bottom:6px}.rc-coin-preview strong{display:block;font-size:21px;font-weight:700;color:#073b3f;letter-spacing:-.4px;line-height:1.4;overflow-wrap:anywhere}.rc-coin-preview strong>span{font-size:11px;letter-spacing:0;font-weight:550}.rc-preview-check{color:#157367;flex-shrink:0}
  .rc-after-balance{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;line-height:1.7;color:#647c84;margin:12px 0 0}.rc-after-balance strong{font-size:10px;font-weight:600;color:#264f5b;text-align:right}
  .rc-pay-btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:16px 24px;margin-top:21px;border:1px solid #b68d4d;border-radius:13px;background:linear-gradient(110deg,#b98c4e,#d5b276);color:#1f302f;font-family:inherit;font-size:13px;font-weight:750;letter-spacing:0;text-transform:none;box-shadow:0 5px 16px #a9833d18;transition:box-shadow 160ms,transform 160ms,filter 160ms}
  .rc-pay-btn>span{flex:0 1 auto}.rc-pay-btn>svg{flex-shrink:0}.rc-pay-btn:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 8px 18px #a9833d26;filter:brightness(1.025)}.rc-pay-btn:disabled{background:#e3e9da;border-color:#d7e0cc;color:#929e80;box-shadow:none}
  .rc-payment-note{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:13px;color:#4f6a75;font-size:11px;line-height:1.8;text-align:center}.rc-payment-note svg{flex-shrink:0}
  .rc-payment-options{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:16px;font-size:11px;color:#5c737c}.rc-payment-options i{width:3px;height:3px;border-radius:50%;background:#9cb4bd}.rc-payment-options small{margin-left:4px;font-size:10px;color:#667b84}
  .rc-recent-card{grid-area:recent;padding:23px 26px;animation:rc-enter 360ms 130ms ease-out both}
  .rc-activity-heading,.rc-history-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:12px}.rc-activity-heading button{display:flex;align-items:center;gap:4px;padding:8px 0 8px 10px;border:0;background:transparent;color:#0c6170;font:inherit;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap}
  .rc-history-row{gap:12px;padding:14px 0;border-bottom:1px solid #e5edef;border-radius:0}.rc-history-row:hover{background:#f5f9fa}.rc-history-icon{width:44px;height:44px;border-radius:14px;background:#e9f1f4;color:#285b70;font-weight:500}.rc-history-body{overflow-wrap:anywhere}.rc-history-amount{font-size:12px;font-weight:650;line-height:1.7;margin-bottom:3px}.rc-history-coins{font-weight:650;color:#116553}.rc-history-date{font-size:10px;font-weight:450;color:#607782}.rc-history-source{font-size:10px;font-weight:500;color:#536d78;margin-top:3px;line-height:1.6}.rc-method-tag{font-size:10px;font-weight:600;padding:4px 7px;border-radius:6px;letter-spacing:.2px;background:transparent;color:#204c59}.rc-direction-badge{font-size:9px;font-weight:650;padding:2px 6px;letter-spacing:.2px;margin-left:6px}
  .rc-transactions{margin-top:24px;padding:27px 30px;scroll-margin-top:220px;animation:rc-enter 360ms 150ms ease-out both}.rc-history-heading{margin-bottom:24px}.rc-history-heading p{font-size:11px;color:#607782;margin:7px 0 0;line-height:1.8}.rc-history-emblem{display:grid;place-items:center;width:43px;height:43px;border:1px solid #dce7ea;border-radius:13px;background:#f1f7f9;color:#2c7180;flex-shrink:0}
  .rc-filter-tabs{gap:7px}.rc-filter-tab{font-family:inherit;min-height:38px;border-radius:10px;padding:8px 13px;border:1px solid #e0e7d8;background:#f5f9fa;font-size:10px;font-weight:550;color:#45616e}.rc-filter-tab.active{background:#0a4650;color:#fff;border-color:#0a4650}.rc-download-btn{min-height:38px;padding:9px 12px;border-radius:10px;border:1px solid #cddde3;font-size:10px;font-family:inherit;font-weight:600;color:#18596b;background:#fff}.rc-download-btn:hover{background:#f1f6e8;color:#4e7135}
  .rc-date-header{font-size:11px;letter-spacing:.7px;font-weight:600;color:#526e7a;padding:17px 0 8px}.rc-history-loading,.rc-activity-loading{display:flex;align-items:center;gap:8px;font-size:11px;color:#8d9b7b;padding:16px 0}
  .rc-banner{display:flex;align-items:flex-start;gap:9px;padding:13px;border-radius:12px;font-size:11px;font-weight:500;line-height:1.8}.rc-banner>svg{flex-shrink:0;margin-top:1px}.rc-banner.success{background:#eff7e8;border-color:#c9ddb5;color:#50753c;animation:rc-enter 250ms ease-out both}.rc-banner.error{background:#fff5ef;border-color:#ebd3bd;color:#a87550}.rc-banner button{margin-left:auto;border:1px solid #d6dbc5;border-radius:7px;padding:5px 8px;background:#fff;color:#6c7e54;font:inherit;cursor:pointer}.rc-empty{font-size:12px;line-height:1.8;color:#5e7580;padding:22px 0}
  .rc-modal-backdrop{z-index:12000!important;padding:16px!important;background:#12352d80!important;backdrop-filter:blur(5px)}.rc-settings-modal{max-height:calc(100dvh - 32px);overflow-y:auto;border:1px solid #dbe4d1!important;border-radius:22px!important;box-shadow:0 24px 70px #143d3026!important;font-family:inherit}
  .rc-page button:focus-visible,.rc-page input:focus-visible{outline:2px solid #a3854b;outline-offset:3px}.rc-spin{animation:rc-spin 1s linear infinite}
  @keyframes rc-enter{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rc-spin{to{transform:rotate(360deg)}}
  @keyframes rc-soft-shimmer{to{background-position:-200% 0}}
  @keyframes rc-wallet-sheen{from{left:-60%}to{left:140%}}
  @media(max-width:1000px){.rc-main{width:calc(100% - 40px)}.rc-hero{align-items:flex-start}.rc-hero-actions{flex-wrap:wrap;justify-content:flex-end;max-width:260px}.rc-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:17px}.rc-card{padding:23px}.rc-balance-value{font-size:36px}.rc-wallet-bottom{flex-wrap:wrap}.rc-convert-link{margin-top:2px}.rc-amount-btn{font-size:11px;padding-inline:5px}}
  @media(max-width:760px){.rc-main{width:calc(100% - 28px);padding:23px 0 44px}.rc-hero{flex-direction:column;gap:18px;margin-bottom:22px}.rc-title{font-size:32px;letter-spacing:-.8px}.rc-subtitle{font-size:12px;line-height:1.8;max-width:340px}.rc-hero-actions{max-width:none;justify-content:flex-start;width:100%;gap:8px}.rc-dashboard-link,.rc-autopay-btn{min-height:41px;font-size:10px;padding:10px 12px}.rc-grid{grid-template-columns:minmax(0,1fr);grid-template-areas:'balance' 'recharge' 'recent';gap:17px}.rc-card{padding:22px;border-radius:19px}.rc-balance-card{min-height:270px;padding:24px 23px 20px}.rc-wallet-top{margin-bottom:24px}.rc-balance-value{font-size:39px}.rc-wallet-bottom{flex-wrap:nowrap}.rc-section-title{font-size:18px}.rc-recharge-card{padding:23px 21px}.rc-amount-btn{font-size:13px;min-height:52px}.rc-recent-card{padding:22px}.rc-transactions{padding:23px 20px;scroll-margin-top:170px}.rc-history-heading{gap:10px}.rc-filter-row{align-items:stretch}.rc-filter-tabs{flex-wrap:wrap}.rc-coin-preview strong{font-size:24px}}
  @media(max-width:480px){.rc-main{width:calc(100% - 24px)}.rc-title{font-size:29px}.rc-kicker{font-size:9px}.rc-wallet-label{font-size:10px;letter-spacing:1px}.rc-wallet-top{gap:8px}.rc-balance-value{font-size:clamp(27px,9vw,39px)}.rc-wallet-bottom{gap:10px;align-items:flex-end}.rc-convert-link{font-size:11px;min-height:39px;padding:9px 8px}.rc-amount-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.rc-amount-btn:last-child{grid-column:1/-1}.rc-after-balance{flex-wrap:wrap;gap:4px}.rc-pay-btn{font-size:12px;min-height:53px}.rc-payment-note{font-size:9px}.rc-history-row{gap:9px;flex-wrap:wrap}.rc-history-row .rc-history-body{min-width:calc(100% - 50px)}.rc-history-row .rc-method-tag{margin-left:45px}.rc-filter-tab{padding:8px 10px;font-size:10px}.rc-coin-preview{padding:15px 12px}.rc-coin-preview strong{font-size:21px}.rc-preview-icon{width:34px;height:37px}.rc-history-emblem{width:36px;height:36px}.rc-modal-backdrop{padding:12px!important}.rc-settings-modal{padding:22px 18px!important}}
  /* Crisp teal and champagne details, with a compact statement layout. */
  .rc-recharge-card{align-self:start}.rc-gold-discovery + .rc-pay-btn{margin-top:0}
  .rc-card{box-shadow:0 8px 30px #153a4810;border-radius:20px}
  .rc-hero{margin-bottom:26px}.rc-title{font-size:clamp(30px,3.2vw,46px)}.rc-subtitle{font-size:14px;color:#526b76}
  .rc-dashboard-link{background:#073b3f;color:#fff;border-color:#073b3f;box-shadow:0 5px 14px #073b3f18}.rc-dashboard-link:hover{background:#10535b;color:#fff;border-color:#10535b}.rc-dashboard-link>svg:first-child{color:#edc878}
  .rc-dashboard-link,.rc-autopay-btn{min-height:46px;font-size:12px}.rc-autopay-btn{background:#fff}
  .rc-balance-card{border-color:#21616b;box-shadow:0 16px 35px #073b3f20}.rc-wallet-label{font-size:12px}.rc-wallet-mark{background:radial-gradient(circle at 30% 25%,#fff2ba,#dbb85f 60%,#9c7029);color:#59401c;border:3px double #fff0ad;box-shadow:0 4px 14px #0002;font-weight:700;transform:none;width:44px;height:44px}
  .rc-wallet-icon{background:#ffffff10;color:#f3d596;border-color:#ffffff30}.rc-balance-label{font-size:13px}.rc-currency-value{color:#d9edef;font-size:14px}.rc-wallet-decoration{color:#e5c27030;width:clamp(140px,16vw,190px);right:18px;top:50%;transform:translateY(-50%)}.rc-convert-link{font-size:12px;font-weight:650;color:#f8dfaa;background:#ffffff0e;border-color:#d9b96170;min-height:44px}
  .rc-section-title{font-size:21px;letter-spacing:-.5px}.rc-panel-copy{font-size:13px;max-width:none;margin:14px 0 20px}.rc-field-label{font-size:12px}.rc-rate-note{font-size:11px}.rc-panel-icon{background:#073b3f;color:#f4d497;border-color:#073b3f}
  .rc-amount-btn{font-size:14px;min-height:54px}.rc-amount-btn.active{box-shadow:0 5px 14px #073b3f1c}.rc-amount-btn.active:hover{background:#10535b}.rc-coin-preview strong{font-size:25px}.rc-pay-btn{min-height:56px;background:linear-gradient(115deg,#e3bf7b,#f2dca9);border-color:#cfa357;color:#342817;font-size:15px;box-shadow:0 6px 20px #a57d3530}.rc-pay-btn:disabled{background:#e5ecef;border-color:#d5dfe4;color:#72838c}.rc-payment-note{font-size:11px;color:#486976}
  .rc-transactions{width:100%;max-width:none;margin:22px 0 0;padding:28px 32px}.rc-history-heading p{font-size:12px}.rc-history-heading{margin-bottom:20px}.rc-filter-tab,.rc-download-btn{font-size:12px}.rc-filter-tab:hover:not(.active){background:#eaf3f6;border-color:#a6c7d1}.rc-download-btn:hover{background:#073b3f;color:#fff}
  .rc-history-row{align-items:flex-start;gap:14px;padding:20px 8px;border-bottom:1px solid #e4ecef;border-radius:10px;transition:background 160ms}.rc-history-row:hover{background:#f5f9fa}.rc-history-icon{margin-top:2px;width:46px;height:46px;border:1px solid #dae7eb;box-shadow:inset 0 1px 0 #fff}
  .rc-history-icon.reward{color:#9b6611;background:#fff4d9;border-color:#efdcaa}.rc-history-icon.digi{color:#8b621d;background:linear-gradient(135deg,#fff6dc,#f4e4ba);border-color:#e8cf93}.rc-history-icon.commission{color:#5144a1;background:#f0edff;border-color:#dfd8fc}.rc-history-icon.purchase{color:#16596e;background:#e8f4f8;border-color:#cfe5ed}.rc-history-icon.wallet{color:#106c65;background:#e5f5f0;border-color:#c9e6df}
  .rc-history-body{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:4px 18px;min-width:0}.rc-history-body>.rc-method-tag{justify-self:start;grid-column:1;grid-row:1;padding:0;border-radius:0;margin:0;background:transparent;font-size:14px;font-weight:750;text-transform:capitalize;letter-spacing:0;color:#163f4e;line-height:1.6}
  .rc-history-body>.rc-method-tag.reward{color:#8d5a0c}.rc-history-body>.rc-method-tag.digi{color:#875c15}.rc-history-body>.rc-method-tag.commission{color:#59479e}
  .rc-history-amount{grid-column:2;grid-row:1 / 3;text-align:right;font-size:14px;line-height:1.7;font-weight:700;margin:0;max-width:360px}.rc-history-coins{color:#107461}.rc-history-row.is-debit .rc-history-coins{color:#164c60}.rc-history-date{grid-column:1;grid-row:2;font-size:11px;color:#647c88}.rc-history-source{grid-column:1 / -1;color:#526c78;font-size:12px;font-weight:500;line-height:1.7;margin-top:2px}.rc-direction-badge{font-size:9px;padding:3px 7px;vertical-align:middle}.rc-direction-badge.credit{background:#e2f3eb;color:#147049}.rc-direction-badge.debit{background:#faeaea;color:#b33535}
  .rc-recent-card .rc-history-row{padding:16px 0}.rc-recent-card .rc-history-body{grid-template-columns:minmax(0,1fr)}.rc-recent-card .rc-history-amount{grid-column:1;grid-row:2;text-align:left;max-width:none;font-size:13px}.rc-recent-card .rc-history-date{grid-row:3}.rc-recent-card .rc-history-source{font-size:11px}.rc-activity-heading button{font-size:12px;color:#145c6c}.rc-date-header{font-size:11px;font-weight:700;color:#536f7e;border-bottom:1px solid #edf2f4;margin-top:8px;padding:14px 8px 9px}
  .rc-history-sentinel{height:2px;pointer-events:none}.rc-history-end{display:flex;align-items:center;justify-content:center;gap:7px;margin:20px 0 0;padding:14px;color:#657e88;font-size:12px;border-top:1px solid #edf2f4}
  .rc-skeleton-row{display:flex;align-items:center;gap:14px;padding:20px 8px;border-bottom:1px solid #edf2f4}.rc-skeleton-row>div{flex:1;min-width:0}.rc-skeleton-block{display:block;position:relative;overflow:hidden;background:#e9eff2;border-radius:6px}.rc-skeleton-block::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,#ffffffb0,transparent);transform:translateX(-100%);animation:rc-skeleton-sweep 1.5s ease-in-out infinite}.rc-skeleton-icon{width:46px;height:46px;border-radius:14px;flex-shrink:0}.rc-skeleton-title{width:42%;max-width:170px;height:13px;margin-bottom:10px}.rc-skeleton-detail{width:65%;max-width:240px;height:10px}.rc-skeleton-value{width:110px;height:16px}.rc-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  @keyframes rc-skeleton-sweep{to{transform:translateX(100%)}}
  @media(max-width:760px){.rc-transactions{padding:24px 18px}.rc-title{font-size:32px}.rc-section-title{font-size:20px}.rc-dashboard-link,.rc-autopay-btn{font-size:12px}.rc-history-body{grid-template-columns:minmax(0,1fr)}.rc-history-amount{grid-column:1;grid-row:2;text-align:left;max-width:none;font-size:14px}.rc-history-date{grid-row:3}.rc-history-source{font-size:12px}.rc-history-row{padding:18px 0;flex-wrap:nowrap;gap:12px}.rc-history-row .rc-history-body{min-width:0}.rc-history-row .rc-method-tag{margin-left:0}.rc-history-icon{width:42px;height:42px;border-radius:12px}.rc-direction-badge{white-space:nowrap}.rc-skeleton-value{width:65px}.rc-filter-tab,.rc-download-btn{font-size:11px}.rc-amount-btn{font-size:14px}.rc-pay-btn{font-size:14px}.rc-currency-value{font-size:13px}}
  .rc-hero-with-art{position:relative;isolation:isolate;display:block;overflow:hidden;min-height:270px;padding:32px 36px;border-radius:22px;background:#062d30;border:1px solid #285252;box-shadow:0 12px 30px #073b3f15}
  .rc-hero-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:-2;pointer-events:none}
  .rc-hero-with-art::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#021c24b3 0%,#021c2470 50%,transparent 78%);pointer-events:none}
  .rc-hero-with-art .rc-hero-copy{max-width:68%}.rc-hero-with-art .rc-kicker{color:#f1d598}.rc-hero-with-art .rc-title{color:#fff8e8;font-size:clamp(29px,3vw,43px);text-wrap:balance}.rc-hero-with-art .rc-subtitle{color:#d3e4e3;max-width:490px;font-size:13px}.rc-hero-with-art .rc-hero-actions{margin-top:22px;justify-content:flex-start;max-width:none;flex-wrap:wrap}
  .rc-hero-with-art .rc-dashboard-link{background:#f3dbab;color:#342b19;border-color:#e6c78c}.rc-hero-with-art .rc-dashboard-link>svg:first-child{color:#80601e}.rc-hero-with-art .rc-dashboard-link:hover{background:#fbe8c3;color:#342b19}.rc-hero-with-art .rc-autopay-btn{background:#073b3fcc;color:#fff;border-color:#ffffff45}
  .rc-gold-discovery{display:flex;align-items:center;text-align:left;gap:14px;width:100%;padding:0 16px 0 0;margin:18px 0 22px;border:1px solid #ddc998;border-radius:14px;overflow:hidden;background:#fcf8ed;font:inherit;color:#133f49;cursor:pointer;transition:border-color 160ms,box-shadow 160ms}
  .rc-gold-discovery:hover{border-color:#b48e45;box-shadow:0 5px 15px #8a6a2312}.rc-gold-discovery>img{width:98px;height:102px;object-fit:cover;flex-shrink:0}.rc-gold-discovery>span{flex:1;min-width:0}.rc-gold-discovery small{display:block;color:#8e6c2e;font-size:9px;letter-spacing:1.3px;font-weight:700;margin-bottom:5px}.rc-gold-discovery strong{display:block;font-size:16px;font-weight:750;line-height:1.4}.rc-gold-discovery>span>span{display:block;font-size:11px;line-height:1.6;margin-top:5px;color:#5e727a}.rc-gold-discovery>svg{flex-shrink:0;color:#8e6c2e}
  @media(max-width:760px){.rc-hero-with-art{min-height:280px;padding:24px;border-radius:19px}.rc-hero-art{object-position:65% center}.rc-hero-with-art::after{background:linear-gradient(90deg,#021c24dc,#021c2490 65%,#021c2433)}.rc-hero-with-art .rc-hero-copy{max-width:90%}.rc-hero-with-art .rc-title{font-size:30px}.rc-hero-with-art .rc-subtitle{font-size:12px;max-width:290px}.rc-hero-with-art .rc-hero-actions{gap:8px;margin-top:20px}.rc-gold-discovery{gap:10px;padding-right:12px}.rc-gold-discovery>img{width:78px;height:100px}.rc-gold-discovery strong{font-size:14px}.rc-gold-discovery>span>span{font-size:10px}}
  .rc-amount-input-wrap{display:flex;align-items:center;border:1px solid #c4d5da;border-radius:12px;background:#fff;overflow:hidden;flex-shrink:0}.rc-amount-input-wrap:focus-within{border-color:#236f79;box-shadow:0 0 0 3px #236f791c}.rc-amount-input-wrap>span{padding-left:16px;font-size:14px;font-weight:650;color:#526c76}
  .rc-custom-input{width:100%;box-sizing:border-box;font-family:inherit;margin:0;min-height:54px;min-width:0;padding:14px 12px;border:0;background:transparent;font-size:19px;font-weight:650;color:#0b414b}.rc-page .rc-custom-input:focus,.rc-page .rc-custom-input:focus-visible{outline:none;box-shadow:none}.rc-custom-input::placeholder{font-size:14px;font-weight:400;color:#788d96}
  @media(prefers-reduced-motion:reduce){.rc-page *,.rc-page *::before,.rc-page *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.rc-balance-card::before{display:none}}

`

export default function Recharge() {
  const navigate = useNavigate()

  const [wallet, setWallet] = useState({
    balance_coins: 0, today_coins: 0, today_amount: 0,
    total_spent: 0, total_coins_purchased: 0, total_recharge_count: 0,
    history: [],
  })
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [walletReady, setWalletReady] = useState(false)
  const [walletError, setWalletError] = useState('')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const historyRequest = useRef(0)
  const [selectedAmount, setSelectedAmount] = useState(100)
  const [paying, setPaying] = useState(false)
  const [banner, setBanner] = useState(null) // { type: 'success' | 'error', text }
  const [goldRate22k, setGoldRate22k] = useState(7045)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertAmount, setConvertAmount] = useState('100')
  const [converting, setConverting] = useState(false)

  const [customAmount, setCustomAmount] = useState('')
  const amount = customAmount ? Number(customAmount) : selectedAmount
  const coinsPreview = amount > 0 ? Math.floor(amount * COIN_RATE) : 0
  const validAmount = Number.isFinite(amount) && amount >= 1
  const formatMoney = value => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

  const fetchWallet = async () => {
    setWalletError('')
    try {
      const { default: api } = await import('../api')
      const res = await api.get('/wallet/')
      setWallet(res.data); setWalletReady(true)
    } catch { setWalletError('Your balance could not refresh. Please try again.') }
    finally { setLoadingWallet(false) }
  }

  const [fullHistory, setFullHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const historySentinel = useRef(null)
  const historyInFlight = useRef(false)
  const historyQuery = useRef({ filter: 'today', from: '', to: '' })
  const failedHistoryPage = useRef(1)
  const [activeFilter, setActiveFilter] = useState('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [autopay, setAutopay] = useState({ exists: false, is_active: false, amount: 1000, recharge_day: 5 })
const [showAutopayModal, setShowAutopayModal] = useState(false)
const [autopayAmount, setAutopayAmount] = useState('')
const [autopayDay, setAutopayDay] = useState(5)
const [autopayFrequency, setAutopayFrequency] = useState('monthly')
const [autopayLoading, setAutopayLoading] = useState(false)


  const settingsModalRef = useRef(null)
  useEffect(() => {
    if (!showAutopayModal && !showConvertModal) return
    const opener = document.activeElement
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    settingsModalRef.current?.focus({ preventScroll: true })
    const handleKey = event => {
      if (autopayLoading || converting || paying) return
      if (event.key === 'Escape') { event.preventDefault(); setShowAutopayModal(false); setShowConvertModal(false) }
      if (event.key === 'Tab') {
        const controls = [...(settingsModalRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select') || [])].filter(element => element.getClientRects().length)
        const first = controls[0], last = controls[controls.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === settingsModalRef.current)) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === settingsModalRef.current)) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', handleKey); if (opener?.isConnected) opener.focus({ preventScroll: true }) }
  }, [showAutopayModal, showConvertModal, autopayLoading, converting, paying])

const fetchAutopayStatus = async () => {
  try {
    const { default: api } = await import('../api')
    const res = await api.get('/autopay/status/')
    if (res.data.exists) {
      setAutopay(res.data)
      setAutopayAmount(res.data.amount)
      setAutopayDay(res.data.recharge_day)
    }
  } catch {
    // silent
  }
}

const handleEnableAutopay = async () => {
  if (!autopayAmount || autopayAmount <= 0) {
    setBanner({ type: 'error', text: 'Please enter a valid amount' })
    return
  }
  setAutopayLoading(true)
  try {
    const loaded = await loadRazorpay()
    if (!loaded) {
      setBanner({ type: 'error', text: 'Payment could not load. Check your internet connection.' })
      setAutopayLoading(false)
      return
    }
    const { default: api } = await import('../api')
    const res = await api.post('/autopay/create/', { amount: autopayAmount, frequency: autopayFrequency, recharge_day: autopayDay })
    const { subscription_id, key } = res.data

    const options = {
      key,
      subscription_id,
      name: 'BitByte Wallet Autopay',
      description: autopayFrequency === 'daily'
        ? `₹${autopayAmount} every week`
        : `₹${autopayAmount} every month on day ${autopayDay}`,
      handler: async response => {
        try {
          const confirmRes = await api.post('/autopay/confirm/', {
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          setBanner({ type: 'success', text: confirmRes.data.message })
          setShowAutopayModal(false)
          fetchAutopayStatus()
        } catch {
          setBanner({ type: 'error', text: 'Autopay confirmation failed. Please try again.' })
        }
        setAutopayLoading(false)
      },
      modal: { ondismiss: () => setAutopayLoading(false) },
      theme: { color: '#073B3F' },
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch (err) {
    const msg = err?.response?.data?.error || 'Unable to start autopay setup. Please try again.'
    setBanner({ type: 'error', text: msg })
    setAutopayLoading(false)
  }
}

const handleToggleAutopay = async () => {
  setAutopayLoading(true)
  try {
    const { default: api } = await import('../api')
    const action = autopay.is_active ? 'off' : 'on'
    await api.post('/autopay/toggle/', { action })
    fetchAutopayStatus()
    setBanner({ type: 'success', text: `Autopay turned ${action.toUpperCase()}` })
  } catch {
    setBanner({ type: 'error', text: 'Unable to update autopay. Please try again.' })
  }
  setAutopayLoading(false)
}

  const fetchHistory = async (page = 1, filter = activeFilter, from = customFrom, to = customTo) => {
    const request = ++historyRequest.current
    historyInFlight.current = true
    failedHistoryPage.current = page
    if (page === 1) { historyQuery.current = { filter, from, to }; setFullHistory([]); setHasMoreHistory(false) }
    setHistoryLoading(true); setHistoryError('')
    try {
      const { default: api } = await import('../api')
      let url = `/recharge/history/?page=${page}&period=${filter}`
      if (filter === 'custom' && from && to) url += `&start_date=${from}&end_date=${to}`
      const res = await api.get(url)
      if (request !== historyRequest.current) return
      setFullHistory(prev => page === 1 ? res.data.items : [...prev, ...res.data.items])
      setHasMoreHistory(res.data.has_more)
      setHistoryPage(page)
    } catch {
      if (request === historyRequest.current) setHistoryError('Could not load your transactions. Please try again.')
    } finally {
      if (request === historyRequest.current) { historyInFlight.current = false; setHistoryLoading(false) }
    }
  }

  useEffect(() => {
    const node = historySentinel.current
    if (!node || !hasMoreHistory || historyLoading || historyError) return
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting) || historyInFlight.current) return
      const { filter, from, to } = historyQuery.current
      fetchHistory(historyPage + 1, filter, from, to)
    }, { rootMargin: '0px 0px 240px 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMoreHistory, historyLoading, historyError, historyPage])

  const handleFilterClick = filter => {
    setActiveFilter(filter)
    if (filter !== 'custom') {
      fetchHistory(1, filter, '', '')
    } else if (customFrom && customTo) {
      fetchHistory(1, 'custom', customFrom, customTo)
    }
  }

  const handleCustomFromChange = e => setCustomFrom(e.target.value)
  const handleCustomToChange = e => setCustomTo(e.target.value)

  const applyCustomRange = () => {
    if (!customFrom || !customTo) {
      setBanner({ type: 'error', text: 'Please select both From and To dates' })
      return
    }
    fetchHistory(1, 'custom', customFrom, customTo)
  }

  const downloadStatement = async () => {
    if (activeFilter === 'custom' && (!customFrom || !customTo)) {
      setBanner({ type: 'error', text: 'Please select both From and To dates' })
      return
    }
    setDownloading(true)
    try {
      const { default: api } = await import('../api')
      let url = `/recharge/statement/?period=${activeFilter}`
      if (activeFilter === 'custom') url += `&start_date=${customFrom}&end_date=${customTo}`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `recharge-statement-${activeFilter}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      setBanner({ type: 'error', text: 'Unable to download statement. Please try again.' })
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    fetchWallet()
    fetchHistory(1, 'today', '', '')
    fetchAutopayStatus()
    import('../api').then(({ default: api }) => {
      api.get('/metal-rates/').then(res => {
        if (res.data?.gold_22k) setGoldRate22k(Number(res.data.gold_22k))
      }).catch(() => {})
    })
  }, [])

  const handleConfirmConvert = async () => {
    const amt = Number(convertAmount)
    if (!amt || amt <= 0) {
      setBanner({ type: 'error', text: 'Please enter a valid amount to convert' })
      return
    }
    const neededCoins = Math.round(amt * 100)
    if ((wallet.balance_coins || 0) < neededCoins) {
      setBanner({
        type: 'error',
        text: `Insufficient recharge balance. You need ₹${amt.toLocaleString('en-IN')} but have ₹${(((wallet.balance_coins || 0) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`
      })
      return
    }
    setConverting(true)
    try {
      const { default: api } = await import('../api')
      const res = await api.post('/digi-gold/convert-from-recharge/', {
        amount: amt
      })
      setBanner({
        type: 'success',
        text: `✅ Converted ₹${amt.toLocaleString('en-IN')} to 22K Digi Gold! ${res.data.investment?.hold_gold_gm}g credited to your gold vault.`
      })
      setShowConvertModal(false)
      fetchWallet()
      setTimeout(() => navigate('/digi-gold'), 1200)
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Digi Gold conversion failed. Please try again.'
      setBanner({ type: 'error', text: msg })
    } finally {
      setConverting(false)
    }
  }

  const handleConvertToDigiGold = async () => {
    if (amount <= 0) return
    setPaying(true)
    try {
      const { default: api } = await import('../api')
      const res = await api.post('/digi-gold/buy/', {
        amount: amount,
        payment_method: 'wallet'
      })
      setBanner({
        type: 'success',
        text: `✅ Converted ₹${amount.toLocaleString('en-IN')} to Digi Gold! ${res.data.investment?.hold_gold_gm}g credited to your 24K vault.`
      })
      fetchWallet()
      setTimeout(() => navigate('/digi-gold'), 1200)
    } catch (err) {
      const msg = err.response?.data?.error || 'Digi Gold conversion failed. Please try again.'
      setBanner({ type: 'error', text: msg })
    } finally {
      setPaying(false)
    }
  }

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handleBuyRecharge = async () => {
    if (!validAmount) {
      setBanner({ type: 'error', text: 'Please enter a valid amount' })
      return
    }
    setBanner(null)
    setPaying(true)

    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        setBanner({ type: 'error', text: 'Payment could not load. Check your internet connection.' })
        setPaying(false)
        return
      }

      const { default: api } = await import('../api')
      const orderRes = await api.post('/recharge/create-order/', { amount })
      const { razorpay_order_id, amount: orderAmount, currency, key, recharge_id } = orderRes.data

      const options = {
        key,
        amount: Math.round(orderAmount * 100),
        currency,
        name: 'BitByte Wallet Recharge',
        description: `Recharge for ${coinsPreview} Revive`,
        order_id: razorpay_order_id,
        handler: async response => {
          try {
            const verifyRes = await api.post('/recharge/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              recharge_id,
            })
            if (verifyRes.data.status === 'success') {
              setBanner({ type: 'success', text: `Recharge successful! ${verifyRes.data.coins_credited} Revive added.` })
              setCustomAmount('')
              fetchWallet()
              fetchHistory(1, activeFilter, customFrom, customTo)
            } else {
              setBanner({ type: 'error', text: 'Payment verification failed. Please contact support.' })
            }
          } catch {
            setBanner({ type: 'error', text: 'Something went wrong. Please try again.' })
          }
          setPaying(false)
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: '#073B3F' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      setBanner({ type: 'error', text: 'Unable to create order. Please try again.' })
      setPaying(false)
    }
  }

  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  // ── GPay mari: Today / Yesterday / actual date nu group pannurom ──
  const dateGroupLabel = d => {
    const date = new Date(d)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const sameDay = (a, b) => a.toDateString() === b.toDateString()
    if (sameDay(date, today)) return 'Today'
    if (sameDay(date, yesterday)) return 'Yesterday'
    return fmtDate(d)
  }

  return (
    <div className="rc-page">
      <style>{rechargeStyles}</style>
      <main className="rc-main">
        <header className="rc-hero rc-hero-with-art">
          <img className="rc-hero-art" src="/wallet-banner.png" alt="" width="2048" height="768" fetchPriority="high" decoding="async" />
          <div className="rc-hero-copy"><p className="rc-kicker"><span /> YOUR EVERYDAY WALLET</p><h1 className="rc-title">Your wallet. More possibilities.</h1><p className="rc-subtitle">Your AUG Revive balance, recharges and activity. All in one place.</p></div>
          <div className="rc-hero-actions"><button type="button" className="rc-dashboard-link" onClick={() => navigate('/digi-gold')}><Gem size={17} /> Digi Gold <ArrowUpRight size={15} /></button><button type="button" className={`rc-autopay-btn ${autopay.is_active ? 'is-on' : ''}`} onClick={() => setShowAutopayModal(true)}><Repeat2 size={15} /><span>Autopay <strong>{autopay.is_active ? 'ON' : 'OFF'}</strong></span><ChevronDown size={13} /></button></div>
        </header>

        <div className="rc-grid">
            <section className="rc-card rc-balance-card" aria-label="Your available AUG Revive balance" aria-busy={loadingWallet}>
              <div className="rc-wallet-decoration" aria-hidden="true"><svg viewBox="0 0 170 170" fill="none"><circle cx="85" cy="85" r="65" stroke="currentColor" /><circle cx="85" cy="85" r="49" stroke="currentColor" /><circle cx="85" cy="85" r="32" stroke="currentColor" /><path d="M76 71h18m-18 7h18m-18-7c20 0 20 22 0 22l19 18" stroke="currentColor" strokeWidth="2" /></svg></div>
              <div className="rc-wallet-top"><span className="rc-wallet-label"><span className="rc-wallet-icon"><WalletCards size={20} /></span> YOUR AUG REVIVE WALLET</span><span className="rc-wallet-mark" aria-hidden="true">AUG</span></div>
              <p className="rc-balance-label">Available balance</p>
              <div className="rc-balance-value">{!walletReady ? loadingWallet ? <span className="rc-balance-skeleton" aria-label="Loading balance" /> : <span className="rc-balance-unavailable">Unavailable</span> : (wallet.balance_coins || 0).toLocaleString('en-IN')}<span className="rc-balance-unit">Revive</span></div>
              <div className="rc-currency-value">{walletReady ? `Equivalent to Rs. ${((wallet.balance_coins || 0) / COIN_RATE).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Your balance will appear once loaded.'}</div>
              {walletError && <div className="rc-wallet-error" role="alert"><AlertCircle size={15} /><span>{walletError}</span><button type="button" onClick={fetchWallet}>Retry</button></div>}
              <div className="rc-wallet-bottom"><div><span className="rc-today-label">Today recharged</span><strong>{walletReady ? `Rs. ${formatMoney(wallet.today_amount)} ` : '--'}<small>{walletReady ? `${(wallet.today_coins || 0).toLocaleString('en-IN')} Revive` : ''}</small></strong></div><button type="button" className="rc-convert-link" disabled={!walletReady} onClick={() => setShowConvertModal(true)}>Convert to Digi Gold <ArrowUpRight size={15} /></button></div>
            </section>
          <section className="rc-card rc-recharge-card">
            <div className="rc-panel-heading"><span className="rc-panel-icon"><Plus size={20} /></span><div><span className="rc-eyebrow">MAKE YOUR NEXT MOVE</span><h2 className="rc-section-title">Add to your wallet</h2></div></div><p className="rc-panel-copy">Choose an amount or enter your own to recharge your wallet.</p>

            {banner && <div className={`rc-banner ${banner.type}`} role={banner.type === 'error' ? 'alert' : 'status'}>{banner.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}<span>{banner.text}</span></div>}

            <span className="rc-field-label">Quick amounts</span>
            <div className="rc-amount-grid" role="group" aria-label="Choose a recharge amount">
              {PRESET_AMOUNTS.map(amt => <button key={amt} type="button" className={`rc-amount-btn ${!customAmount && selectedAmount === amt ? 'active' : ''}`} aria-pressed={!customAmount && selectedAmount === amt} disabled={paying} onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}>
                <span>Rs. {amt.toLocaleString('en-IN')}</span>{!customAmount && selectedAmount === amt && <Check size={13} className="rc-amount-check" />}
              </button>)}
            </div>

            <label className="rc-field-label" htmlFor="rc-amount">Or enter an amount</label>
            <div className="rc-amount-input-wrap"><span aria-hidden="true">Rs.</span><input id="rc-amount" className="rc-custom-input" type="text" inputMode="decimal" autoComplete="off" placeholder="Enter amount" value={customAmount} disabled={paying} maxLength={12} aria-invalid={Boolean(customAmount) && !validAmount} onChange={event => { const next = event.target.value; if (/^\d*(?:\.\d{0,2})?$/.test(next)) setCustomAmount(next) }} /></div>
            <button type="button" className="rc-gold-discovery" onClick={() => navigate('/digi-gold')} aria-label="Explore Digi Gold and Silver">
              <img src="/wallet-digi-gold.png" alt="" width="1254" height="1254" loading="lazy" decoding="async" />
              <span><small>DISCOVER MORE</small><strong>Digi Gold &amp; Silver</strong><span>Explore your digital metals dashboard</span></span><ArrowUpRight size={19} aria-hidden="true" />
            </button>
            <button type="button" className="rc-pay-btn" disabled={paying || !validAmount} onClick={handleBuyRecharge}>{paying ? <RefreshCw size={17} className="rc-spin" /> : <LockKeyhole size={16} />}<span>{paying ? 'Payment in progress...' : `Pay Rs. ${validAmount ? formatMoney(amount) : '0'} & recharge`}</span></button>
            <div className="rc-payment-note"><ShieldCheck size={14} /><span>Balance updates after your payment is verified.</span></div><div className="rc-payment-options"><span>UPI</span><i /><span>Cards</span><i /><span>Net banking</span><small>via Razorpay</small></div>
          </section>
            <section className="rc-card rc-recent-card">
              <div className="rc-activity-heading"><div><span className="rc-eyebrow">YOUR WALLET AT A GLANCE</span><h2 className="rc-section-title">Recent activity</h2></div><button type="button" onClick={() => document.getElementById('rc-transactions')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })}>View all <ArrowUpRight size={14} /></button></div>
              {loadingWallet ? <TransactionSkeleton count={2} /> : !walletReady ? <div className="rc-empty">Activity is unavailable. Retry your balance above.</div> : wallet.history.length === 0 ? (
                <div className="rc-empty">No recharges yet</div>
              ) : (
                wallet.history.slice(0, 3).map(h => {
                  return (
                    <div key={h.id} className={`rc-history-row ${h.direction === 'debit' ? 'is-debit' : 'is-credit'}`}>
                      <div className={`rc-history-icon ${h.is_digi_gold ? 'digi' : h.payment_method}`}>
                        <MethodIcon type={h.is_digi_gold ? 'digi' : h.payment_method} size={22} />
                      </div>
                      <div className="rc-history-body">
                        <span className={`rc-method-tag ${h.is_digi_gold ? 'digi' : h.payment_method}`}>{h.is_digi_gold ? 'Digi Gold' : (h.payment_method === 'admin' ? 'BBTEAM' : h.payment_method || 'Wallet')}</span>
                        <div className="rc-history-amount">
                          {h.type !== 'reward' && (
                            <>
                              {h.direction === 'debit' ? '−' : '+'}₹{h.amount_paid}{' '}
                              <span style={{ color: MUTED, fontWeight: 700 }}>→</span>{' '}
                            </>
                          )}
                          <span className="rc-history-coins">
                            {h.direction === 'debit' ? '−' : '+'}{h.coins_credited.toLocaleString('en-IN')} Revive
                          </span>
                          <DirectionBadge direction={h.direction} />
                        </div>
                        <div className="rc-history-date">{fmtDate(h.created_at)}</div>
                        {h.type === 'commission' && (
                          <div className="rc-history-source">From {h.source} · Level {h.level} · {h.order_id}</div>
                        )}
                        {h.type === 'debit' && (
                          <div className="rc-history-source" style={{ color: '#073B3F', fontWeight: 700 }}>
                            {h.order_id ? `Used for order ${h.order_id}` : (h.source || 'Digi Gold Transaction')}
                          </div>
                        )}
                        {h.type === 'admin_credit' && (
                          <div className="rc-history-source">{h.source || 'Sent by Admin'}</div>
                        )}
                        {h.type === 'reward' && (
                          <div className="rc-history-source">Login Reward</div>
                        )}
                      </div>

                    </div>
                  )
                })
              )}
            </section>
        </div>

        {/* Transaction History — grouped by date with automatic pagination */}
        <section className="rc-card rc-transactions" id="rc-transactions" aria-busy={historyLoading}>
          <div className="rc-history-heading"><div><span className="rc-eyebrow">EVERY MOVE, IN ONE PLACE</span><h2 className="rc-section-title">Your transactions</h2><p>Review credits, purchases and recharge activity.</p></div><span className="rc-history-emblem" aria-hidden="true"><History size={23} /></span></div>

          <div className="rc-filter-row">
            <div className="rc-filter-tabs">
              {[
                { key: 'today', label: 'Today' },
                { key: 'month', label: 'This Month' },
                { key: '6month', label: '6 Months' },
                { key: 'custom', label: 'Custom' },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={`rc-filter-tab ${activeFilter === f.key ? 'active' : ''}`}
                  aria-pressed={activeFilter === f.key}
                  onClick={() => handleFilterClick(f.key)}
                >
                  {f.label}
                </button>
              ))}
              {activeFilter === 'custom' && (
                <>
                  <input
                    type="date" aria-label="From date"
                    className="rc-custom-date"
                    value={customFrom}
                    max={customTo || new Date().toISOString().split('T')[0]}
                    onChange={handleCustomFromChange}
                  />
                  <span className="rc-date-to-label">to</span>
                  <input
                    type="date" aria-label="To date"
                    className="rc-custom-date"
                    value={customTo}
                    min={customFrom}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleCustomToChange}
                  />
                  <button type="button" className="rc-apply-btn" onClick={applyCustomRange}>
                    Apply
                  </button>
                </>
              )}
            </div>
            <button className="rc-download-btn" type="button" onClick={downloadStatement} disabled={downloading}>
              <DownloadIcon size={14} />
              {downloading ? 'Downloading...' : 'Download Statement'}
            </button>
          </div>

          {historyError && <div className="rc-banner error" role="alert"><AlertCircle size={18} /><span>{historyError}</span><button type="button" onClick={() => fetchHistory(failedHistoryPage.current, historyQuery.current.filter, historyQuery.current.from, historyQuery.current.to)}>Retry</button></div>}
          {fullHistory.length === 0 ? (
            historyLoading || historyError ? null : <div className="rc-empty">No transactions in this period.</div>
          ) : (
            (() => {
              let lastGroup = null
              return fullHistory.map(h => {
                const group = dateGroupLabel(h.created_at)
                const showHeader = group !== lastGroup
                lastGroup = group
                return (
                  <div key={h.id}>
                    {showHeader && <div className="rc-date-header">{group}</div>}
                    <div className={`rc-history-row ${h.direction === 'debit' ? 'is-debit' : 'is-credit'}`}>
                      <div className={`rc-history-icon ${h.is_digi_gold ? 'digi' : h.payment_method}`}>
                        <MethodIcon type={h.is_digi_gold ? 'digi' : h.payment_method} size={22} />
                      </div>
                      <div className="rc-history-body">
                        <span className={`rc-method-tag ${h.is_digi_gold ? 'digi' : h.payment_method}`}>{h.is_digi_gold ? 'Digi Gold' : (h.payment_method === 'admin' ? 'BBTEAM' : h.payment_method || 'Wallet')}</span>
                        <div className="rc-history-amount">
                          {h.type !== 'reward' && (
                            <>
                              {h.direction === 'debit' ? '−' : '+'}₹{h.amount_paid}{' '}
                              <span style={{ color: MUTED, fontWeight: 700 }}>→</span>{' '}
                            </>
                          )}
                          <span className="rc-history-coins">
                            {h.direction === 'debit' ? '−' : '+'}{h.coins_credited.toLocaleString('en-IN')} Revive
                          </span>
                          <DirectionBadge direction={h.direction} />
                        </div>
                        <div className="rc-history-date">{fmtDate(h.created_at)}</div>
                        {h.type === 'commission' && (
                          <div className="rc-history-source">From {h.source} · Level {h.level} · {h.order_id}</div>
                        )}
                        {h.type === 'debit' && (
                          <div className="rc-history-source" style={{ color: '#073B3F', fontWeight: 700 }}>
                            {h.order_id ? `Used for order ${h.order_id}` : (h.source || 'Digi Gold Transaction')}
                          </div>
                        )}
                        {h.type === 'admin_credit' && (
                          <div className="rc-history-source">{h.source || 'Sent by Admin'}</div>
                        )}
                        {h.type === 'reward' && (
                          <div className="rc-history-source">Login Reward</div>
                        )}
                      </div>

                    </div>
                  </div>
                )
              })
            })()
          )}
          {historyLoading && <TransactionSkeleton count={fullHistory.length ? 3 : 5} />}
          <div ref={historySentinel} className="rc-history-sentinel" aria-hidden="true" />
          {!hasMoreHistory && !historyLoading && !historyError && fullHistory.length > 0 && <p className="rc-history-end"><CheckCircle2 size={14} />You're all caught up for this period</p>}

        </section>
      </main>

      {showAutopayModal && (
  <div className="rc-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
    <div className="rc-settings-modal" ref={settingsModalRef} role="dialog" aria-modal="true" aria-label="Autopay settings" tabIndex={-1} style={{ background: '#fff', borderRadius: 10, padding: 24, width: 'min(420px, 90vw)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: RED }}>Autopay settings</h3>
        {autopay.exists && (
          <button
            type="button"
            onClick={handleToggleAutopay}
            disabled={autopayLoading}
            style={{
              width: 42, height: 24, borderRadius: 20, border: 'none', cursor: 'pointer',
              background: autopay.is_active ? RED : '#D1DFDE', position: 'relative'
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute',
              top: 3, left: autopay.is_active ? 21 : 3, transition: '.15s ease'
            }} />
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, fontWeight: 800, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Monthly amount (₹)</p>
      <input
  type="number" min="1" placeholder="Enter amount (₹)" value={autopayAmount}
  onChange={e => setAutopayAmount(e.target.value === '' ? '' : Number(e.target.value))}
  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #D1DFDE', borderRadius: 8, fontSize: 15, fontWeight: 700, marginBottom: 16 }}
/>

      <p style={{ fontSize: 12, fontWeight: 800, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Frequency</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[{ value: 'daily', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }].map(f => (
          <button
            key={f.value} type="button"
            onClick={() => setAutopayFrequency(f.value)}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13, textTransform: 'capitalize',
              border: autopayFrequency === f.value ? `1.5px solid ${RED}` : '1.5px solid #D1DFDE',
              background: autopayFrequency === f.value ? 'rgba(7,59,63,.06)' : '#fff',
              color: autopayFrequency === f.value ? RED : DARK,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {autopayFrequency === 'monthly' && (
        <>
          <p style={{ fontSize: 12, fontWeight: 800, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Charge day, every month</p>
          <select
            value={autopayDay}
            onChange={e => setAutopayDay(Number(e.target.value))}
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #D1DFDE', borderRadius: 8, fontSize: 14, fontWeight: 700, marginBottom: 20 }}
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button" onClick={() => setShowAutopayModal(false)}
          style={{ flex: 1, minHeight: 46, borderRadius: 999, border: '1.5px solid #D1DFDE', background: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          type="button" onClick={handleEnableAutopay} disabled={autopayLoading || autopay.is_active}
          style={{ flex: 2, minHeight: 46, borderRadius: 999, border: 'none', background: RED, color: '#fff', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', cursor: 'pointer' }}
        >
          {autopayLoading ? 'Processing...' : autopay.exists ? 'Update mandate' : 'Authorize UPI mandate'}
        </button>
      </div>
    </div>
  </div>
)}

{/* ── COMPACT CONVERT TO 22K DIGI GOLD MODAL ── */}
{showConvertModal && (
  <div className="rc-modal-backdrop" style={{
    position: 'fixed', inset: 0, background: 'rgba(7,31,34,.58)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16
  }} onClick={() => setShowConvertModal(false)}>
    <div className="rc-settings-modal" ref={settingsModalRef} role="dialog" aria-modal="true" aria-label="Convert to Digi Gold" tabIndex={-1} style={{
      background: '#fff', borderRadius: 20, maxWidth: 440, width: '100%', padding: '28px 24px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.22)', border: '1px solid #D1DFDE'
    }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: '50%', background: '#C6924B', color: '#0A3E42',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13
          }}>Au</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: DARK }}>Convert to Digi Gold (22K)</h3>
            <span style={{ fontSize: 11.5, color: MUTED }}>Aadhirai Digital Gold Vault</span>
          </div>
        </div>
        <button
          type="button" onClick={() => setShowConvertModal(false)}
          style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: MUTED }}
        >×</button>
      </div>

      <div style={{
        background: '#F8FAF9', borderRadius: 12, padding: 14, marginBottom: 16,
        border: '1px solid #E6ECEA', display: 'grid', gap: 8, fontSize: 13
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: MUTED, fontWeight: 600 }}>Available AUG Revive:</span>
          <strong style={{ color: DARK }}>{(wallet.balance_coins || 0).toLocaleString('en-IN')} Revive <span style={{ color: MUTED, fontWeight: 600, fontSize: 12 }}>(≈ ₹{(((wallet.balance_coins || 0) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span></strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: MUTED, fontWeight: 600 }}>Today's 22K Gold Rate:</span>
          <strong style={{ color: '#009957' }}>₹{goldRate22k.toLocaleString('en-IN')}/g (₹{(goldRate22k / 1000).toFixed(2)}/mg)</strong>
        </div>
      </div>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: DARK, marginBottom: 6, textTransform: 'uppercase' }}>
        Conversion Amount (₹)
      </label>
      <input
        type="number" min="1"
        value={convertAmount}
        onChange={e => setConvertAmount(e.target.value)}
        placeholder="Enter amount in ₹"
        style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #D1DFDE',
          borderRadius: 10, fontSize: 15, fontWeight: 800, color: DARK, marginBottom: 12
        }}
      />

      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10,
        background: 'rgba(0,153,87,0.08)', border: '1px dashed #009957', marginBottom: 20, fontSize: 13, fontWeight: 800
      }}>
        <span style={{ color: '#0A3E42' }}>You will receive:</span>
        <span style={{ color: '#009957' }}>
          ≈ {Number(convertAmount) > 0 && goldRate22k > 0 ? (Number(convertAmount) / (goldRate22k / 1000)).toFixed(2) : '0.00'} mg gold
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button" onClick={() => setShowConvertModal(false)}
          style={{ flex: 1, minHeight: 44, borderRadius: 999, border: '1.5px solid #D1DFDE', background: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
        >Cancel</button>
        <button
          type="button" onClick={handleConfirmConvert} disabled={converting || !Number(convertAmount) || Number(convertAmount) <= 0}
          style={{
            flex: 2, minHeight: 44, borderRadius: 999, border: 'none',
            background: 'linear-gradient(135deg, #0A3E42 0%, #009957 100%)', color: '#fff',
            fontWeight: 900, fontSize: 13, textTransform: 'uppercase', cursor: converting ? 'not-allowed' : 'pointer'
          }}
        >{converting ? 'Converting...' : 'Confirm Conversion'}</button>
      </div>
    </div>
  </div>
)}

      <CustomerFooter />
    </div>
  )
}