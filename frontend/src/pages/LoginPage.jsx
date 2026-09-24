import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from '../assets/logo.png'
import ActionSuccessModal from '../Coins_products/ActionSuccessModal'
import './LoginPage.css'

const Eye = ({ off }) => off ? <svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A11 11 0 0112 4c7 0 10 8 10 8a17 17 0 01-2.1 3.5M6.6 6.6C3.5 8.6 2 12 2 12s3 8 10 8a10 10 0 005.4-1.6"/></svg> : <svg viewBox="0 0 24 24"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>

export default function LoginPage() {
  const [email,setEmail]=useState(''), [password,setPassword]=useState(''), [error,setError]=useState(''), [loading,setLoading]=useState(false), [showPassword,setShowPassword]=useState(false)
  const [authFailed,setAuthFailed]=useState(false)
  const navigate=useNavigate()

  useEffect(() => {
    window.history.replaceState(null, '', '/')
    window.history.pushState(null, '', '/login')
  }, [])

  const handleLogin=async e=>{
    e.preventDefault(); setLoading(true); setError(''); setAuthFailed(false); ['token','refresh','role','email'].forEach(k=>localStorage.removeItem(k))
    const attempt=()=>api.post('/login/',{email,password})
    // sessionStorage.removeItem here matters: a cached checkout address from whoever
    // used this browser tab last must never leak into a different account's new order.
    const save=d=>{ Object.entries({token:d.access,refresh:d.refresh,role:d.role,email:d.email}).forEach(([k,v])=>localStorage.setItem(k,v)); sessionStorage.removeItem('bb_saved_address'); const paths={super_admin:'/super-admin',admin:'/admin',dealer:'/dealer',sub_dealer:'/sub-dealer',promotor:'/promotor',shop:'/shop-dashboard'}; navigate(paths[d.role]||'/customer',{replace:true}) }
    // Wrong email/password is shown as a popup (ActionSuccessModal, type="danger"); the
    // "server is starting, retrying..." messages stay as the small inline note below.
    const fail=msg=>{setError(msg);setAuthFailed(true);setLoading(false)}
    try { save((await attempt()).data); return } catch(err) { if(err.response?.status<500){fail(err.response?.data?.error||err.response?.data?.detail||'Invalid email or password');return} setError('The secure server is starting. Please wait a moment…') }
    for(let i=0;i<20;i++){ await new Promise(r=>setTimeout(r,2000)); try{save((await attempt()).data);return}catch(err){if(err.response?.status<500){fail(err.response?.data?.error||err.response?.data?.detail||'Invalid email or password');return}setError(`The secure server is starting… (${i+1}/20)`)}}
    setError('The server is unavailable right now. Please try again in a minute.');setLoading(false)
  }
  return <main className="login-page"><div className="login-glow one"/><div className="login-glow two"/><section className="login-shell">
    <ActionSuccessModal isOpen={authFailed} onClose={()=>setAuthFailed(false)} type="danger" title="Sign In Failed" message={error||'Invalid email or password.'} buttonText="Try Again"/>
    <aside className="login-story"><div className="story-grid"/><div className="brand"><span><img src={logo} alt=""/></span><div><b>ATHIRAI</b><small>Fine jewellery, elevated</small></div></div><div className="story-copy"><label><i/> PRIVATE COMMERCE SUITE</label><h1>Every detail,<br/><em>beautifully managed.</em></h1><p>A refined workspace for the people behind exceptional jewellery—built for precision, trust, and effortless growth.</p></div><div className="trust"><div><b>360°</b><span>Commerce control</span></div><div><b>24/7</b><span>Secure access</span></div><div><b>100%</b><span>Role protected</span></div></div></aside>
    <section className="login-panel"><button type="button" className="login-back" onClick={()=>navigate(-1)} aria-label="Back"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button><div className="form-wrap"><header><span className="mobile-logo"><img src={logo} alt="Athirai"/></span><p>WELCOME BACK</p><h2>Sign in to Athirai</h2><div>Enter your credentials to continue to your workspace.</div></header>{error&&!authFailed&&<div className="login-error" role="alert"><i>!</i>{error}</div>}
      <form onSubmit={handleLogin}><label className="field"><span>Email, phone or ID</span><div className="input-wrap"><svg viewBox="0 0 24 24"><path d="M4 20v-2a4 4 0 014-4h8a4 4 0 014 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg><input value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username" placeholder="Enter your email, phone or ID"/></div></label>
      <label className="field"><span>Password</span><div className="input-wrap"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password"/><button type="button" className="eye" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}><Eye off={showPassword}/></button></div></label>
      <button className="submit" disabled={loading}><span>{loading?'Signing in…':'Enter your workspace'}</span>{loading?<i className="spinner"/>:<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>}</button></form>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px', fontSize: '13px', color: '#667875' }}>
        <span>New to Athirai?</span>
        <button
          type="button"
          onClick={() => navigate('/register')}
          style={{ background: 'none', border: 'none', color: '#073B3F', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '13.5px' }}
        >
          Register / Create Account
        </button>
      </div>
      <footer><span><i/> Encrypted &amp; secure</span><span>© {new Date().getFullYear()} Athirai</span></footer></div></section>
  </section></main>
}
