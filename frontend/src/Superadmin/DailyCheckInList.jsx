import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Users, CalendarCheck2, UserRoundX, Clock3, Check, Search, RefreshCw, AlertCircle, Phone, ChevronRight } from 'lucide-react'
import api from '../api'

const roleLabels = { admin: 'Admin / Super Stockist', dealer: 'Dealer / Distributor', sub_dealer: 'Subdealer / Wholesale Dealer', promotor: 'Promotor / Retailer' }
const slotLabels = ['12 PM', '4 PM', '8 PM']
const statusLabels = { success: 'Success', missed: 'Missed', available: 'Open now', upcoming: 'Upcoming' }
const timeLabel = value => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value))

function LoadingRows({ count = 6 }) {
  return Array.from({ length: count }, (_, index) => <tr className="dcl-loading-row" key={`loading-${index}`} aria-hidden="true">
    <td><span className="dcl-skeleton" style={{ width: '80%', height: 13 }} /></td>
    <td><span className="dcl-skeleton" style={{ width: '75%', height: 13 }} /><span className="dcl-skeleton" style={{ width: '45%', height: 9, marginTop: 9 }} /></td>
    <td><span className="dcl-skeleton" style={{ width: '80%', height: 12 }} /></td>
    {slotLabels.map(label => <td key={label} data-label={label}><span className="dcl-skeleton" style={{ width: 68, maxWidth: '100%', height: 25 }} /></td>)}
  </tr>)
}

export default function DailyCheckInList() {
  const [date, setDate] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [nextCursor, setNextCursor] = useState(null)
  const [pending, setPending] = useState('initial')
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const generation = useRef(0)
  const inFlight = useRef(false)
  const controller = useRef(null)
  const sentinel = useRef(null)
  const query = useMemo(() => ({ ...(date ? { date } : {}), role, status, search }), [date, role, status, search])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const loadPage = useCallback(async (cursor = null) => {
    if (inFlight.current) return
    inFlight.current = true
    const current = generation.current
    const abort = new AbortController()
    controller.current = abort
    setPending(cursor ? 'more' : 'initial'); setError('')
    try {
      const response = await api.get('/daily-work-check-in/report/', { params: { ...query, ...(cursor ? { cursor } : {}) }, signal: abort.signal })
      if (current !== generation.current) return
      const data = response.data
      setRows(previous => cursor ? [...previous, ...data.items] : data.items)
      if (!cursor) setSummary(data.summary)
      setMetadata({ date: data.date, serverNow: data.server_now })
      setNextCursor(data.next_cursor)
    } catch (failure) {
      if (current !== generation.current || abort.signal.aborted) return
      setError(failure.response?.data?.error || 'Could not load check-ins. Please try again.')
    } finally {
      if (current === generation.current) { inFlight.current = false; setPending(null) }
    }
  }, [query])

  useEffect(() => {
    generation.current++; controller.current?.abort(); inFlight.current = false
    setRows([]); setSummary(null); setMetadata(null); setNextCursor(null)
    loadPage()
    return () => { generation.current++; controller.current?.abort(); inFlight.current = false }
  }, [loadPage, refreshVersion])

  useEffect(() => {
    if (!sentinel.current || !nextCursor || pending || error) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadPage(nextCursor)
    }, { rootMargin: '0px 0px 300px 0px' })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [nextCursor, pending, error, loadPage])

  const matchingCount = summary ? status === 'checked_in' ? summary.daily_check_in : status === 'no_check_in' ? summary.no_check_in : summary.all_users : null
  const cards = [
    { key: 'all', title: 'All Users', value: summary?.all_users, copy: 'Active worker accounts', icon: Users },
    { key: 'checked_in', title: 'Daily Check-In', value: summary?.daily_check_in, copy: 'At least one slot submitted', icon: CalendarCheck2 },
    { key: 'no_check_in', title: 'No Check-In', value: summary?.no_check_in, copy: 'No slots submitted', icon: UserRoundX },
  ]
  const resetFilters = () => { setSearchInput(''); setSearch(''); setRole('all'); setStatus('all'); setDate('') }

  return <div className="dcl-page">
    <style>{styles}</style>
    <main className="dcl-shell">
      <header className="dcl-header"><div><span className="dcl-kicker"><CalendarCheck2 size={15} /> WORKFORCE ATTENDANCE</span><h1>Daily Check-In List</h1><p>One view of your team's daily check-ins. All times are India Standard Time.</p></div><button type="button" className="dcl-refresh" onClick={() => setRefreshVersion(value => value + 1)} disabled={Boolean(pending)}><RefreshCw size={16} />Refresh</button></header>
      <section className="dcl-cards" aria-label="Check-in counts">
        {cards.map(card => <button type="button" key={card.key} className={`dcl-card ${card.key} ${status === card.key ? 'selected' : ''}`} aria-pressed={status === card.key} onClick={() => setStatus(card.key)}><span className="dcl-card-top"><span>{card.title}</span><span className="dcl-card-icon"><card.icon size={22} /></span></span>{summary ? <strong>{Number(card.value).toLocaleString('en-IN')}</strong> : <span className="dcl-skeleton dcl-count-skeleton" />}<span className="dcl-card-copy">{card.copy}<ChevronRight size={13} /></span></button>)}
      </section>
      <section className="dcl-panel" aria-label="Daily worker attendance">
        <div className="dcl-toolbar"><div className="dcl-search"><Search size={17} /><input type="search" value={searchInput} maxLength={100} onChange={event => setSearchInput(event.target.value)} aria-label="Search member ID, name or phone" placeholder="Search ID, name or phone" /></div><label className="dcl-filter"><span>Date (IST)</span><input type="date" value={date || metadata?.date || ''} max={metadata?.serverNow?.slice(0, 10)} onChange={event => setDate(event.target.value)} /></label><label className="dcl-filter"><span>Role</span><select value={role} onChange={event => setRole(event.target.value)}><option value="all">All worker roles</option>{Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
        <div className="dcl-table-heading"><div><h2>{status === 'checked_in' ? 'Users with check-ins' : status === 'no_check_in' ? 'Users without check-ins' : 'All worker check-ins'}</h2><p>{matchingCount === null ? 'Loading attendance...' : `${rows.length.toLocaleString('en-IN')} loaded of ${matchingCount.toLocaleString('en-IN')} matching users`}</p></div><span className="dcl-window-note"><Clock3 size={14} />30-minute submission windows</span></div>
        <div className="dcl-table-wrap"><table className="dcl-table" aria-busy={Boolean(pending)}><caption className="dcl-sr-only">Check-in status by worker for {metadata?.date || 'the selected date'}: 12 PM, 4 PM and 8 PM IST.</caption><thead><tr><th scope="col">ID</th><th scope="col">Name</th><th scope="col">Phone</th>{slotLabels.map(label => <th scope="col" key={label}>{label} <small>IST</small></th>)}</tr></thead><tbody>
          {rows.map(row => <tr key={row.user_id}><td data-label="ID" className="dcl-member-id">{row.member_id}</td><td className="dcl-person"><strong>{row.name}</strong><small>{roleLabels[row.role]}</small></td><td className="dcl-phone">{row.phone ? <a href={`tel:${row.phone}`}><Phone size={13} />{row.phone}</a> : <span className="dcl-unavailable">Not provided</span>}</td>{row.slots.map(slot => <td key={slot.id} data-label={slot.label}><span className={`dcl-badge ${slot.status}`}>{slot.status === 'success' && <Check size={12} />}{statusLabels[slot.status]}</span>{slot.submitted_at && <time className="dcl-submitted" dateTime={slot.submitted_at}>{timeLabel(slot.submitted_at)}</time>}</td>)}</tr>)}
          {pending && <LoadingRows count={pending === 'more' ? 3 : 6} />}
        </tbody></table></div>
        {pending && <span className="dcl-sr-only" role="status">{pending === 'more' ? 'Loading more users' : 'Loading daily check-ins'}</span>}
        {error && <div className="dcl-error" role="alert"><AlertCircle size={18} /><div><p>{error}</p><button type="button" disabled={Boolean(pending)} onClick={() => error.includes('cursor') ? setRefreshVersion(value => value + 1) : loadPage(rows.length ? nextCursor : null)}>Try again</button></div></div>}
        {!pending && !error && rows.length === 0 && <div className="dcl-empty"><Users size={30} /><h3>No matching users</h3><p>Try another name, role or date, or choose All Users.</p><button type="button" onClick={resetFilters}>Reset filters</button></div>}
        <div ref={sentinel} className="dcl-sentinel" aria-hidden="true" />
        {!pending && !error && rows.length > 0 && !nextCursor && <p className="dcl-end"><Check size={14} />All matching users loaded</p>}
        <footer className="dcl-legend"><span><i className="success" />Success: submitted</span><span><i className="missed" />Missed: window closed</span><span><i className="available" />Open now: awaiting submission</span><span><i className="upcoming" />Upcoming: window not started</span></footer>
      </section>
      <p className="dcl-scope">Counts cover active Admin, Dealer, Subdealer and Promotor accounts matching your search and role. Daily Check-In means one or more submissions on the selected day. Refresh to see new submissions.</p>
    </main>
  </div>
}

const styles = `
.dcl-page{min-height:100vh;background:radial-gradient(ellipse at 100% 0%,#f7eedc,transparent 35%),#f3f6f8;color:#173f4b;font-family:'Montserrat',system-ui,sans-serif}.dcl-page *{box-sizing:border-box}.dcl-shell{max-width:1480px;margin:0 auto;padding:34px 28px 64px}.dcl-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:26px}.dcl-kicker{display:inline-flex;gap:8px;align-items:center;font-size:10px;font-weight:700;letter-spacing:1.7px;color:#987137}.dcl-header h1{font:700 clamp(29px,3.3vw,43px) Georgia,serif;color:#073b3f;line-height:1.2;margin:12px 0}.dcl-header p{font-size:12px;line-height:1.9;color:#607782;margin:0}.dcl-refresh{display:flex;align-items:center;justify-content:center;gap:8px;min-height:43px;padding:10px 15px;border:1px solid #ccdde2;border-radius:11px;background:#fff;font-family:inherit;font-weight:600;font-size:12px;color:#155b67;cursor:pointer;flex-shrink:0}.dcl-refresh:hover{border-color:#8eb3bd}.dcl-refresh:disabled{opacity:.5;cursor:default}
.dcl-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-bottom:24px}.dcl-card{padding:22px 24px;min-width:0;text-align:left;border:1px solid #d9e4e8;border-radius:18px;background:#fff;color:#173f4b;font:inherit;cursor:pointer;box-shadow:0 5px 18px #173e4906;transition:border-color 160ms,box-shadow 160ms}.dcl-card:hover{border-color:#b8a16e;box-shadow:0 8px 22px #173e4910}.dcl-card.selected{border-color:#b79960;box-shadow:inset 0 0 0 1px #b7996030}.dcl-card-top{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:650}.dcl-card-icon{width:43px;height:43px;display:grid;place-items:center;flex-shrink:0;border-radius:13px;background:#eaf3f5;color:#1e6777}.dcl-card.checked_in .dcl-card-icon{background:#e8f5ed;color:#237b53}.dcl-card.no_check_in .dcl-card-icon{background:#fbefeb;color:#aa644b}.dcl-card>strong{display:block;font-size:35px;font-weight:750;font-variant-numeric:tabular-nums;line-height:1.2;margin:10px 0;color:#073b3f}.dcl-card-copy{display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:10px;line-height:1.8;color:#71858f}.dcl-count-skeleton{height:36px;width:100px;margin:10px 0}
.dcl-panel{border:1px solid #d8e4e8;border-radius:20px;background:#fff;box-shadow:0 8px 24px #173e4907;overflow:hidden}.dcl-toolbar{display:flex;align-items:flex-end;gap:14px;padding:22px 24px;border-bottom:1px solid #e6edf0;background:#fcfdfd}.dcl-search{display:flex;align-items:center;gap:10px;flex:1;min-height:44px;border:1px solid #cddde3;border-radius:10px;padding:0 13px;color:#718893;background:#fff}.dcl-search input{width:100%;min-width:0;padding:12px 0;border:0;outline:none;background:transparent;color:#173f4b;font:inherit;font-size:12px}.dcl-search:focus-within{outline:2px solid #b49a64;outline-offset:2px}.dcl-filter{display:grid;gap:7px;min-width:155px;font-size:10px;font-weight:600;color:#5e7580}.dcl-filter input,.dcl-filter select{height:44px;max-width:260px;min-width:0;border:1px solid #cddde3;border-radius:10px;padding:10px 12px;background:#fff;color:#173f4b;font:inherit;font-size:11px}.dcl-table-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 24px 18px}.dcl-table-heading h2{font-size:18px;letter-spacing:-.3px;color:#073b3f;margin:0}.dcl-table-heading p{font-size:10px;color:#71858f;margin:7px 0 0}.dcl-window-note{display:flex;align-items:center;gap:6px;font-size:10px;color:#7a6748;white-space:nowrap}
.dcl-table-wrap{overflow-x:auto}.dcl-table{width:100%;border-collapse:collapse;text-align:left;table-layout:fixed}.dcl-table th{padding:14px 20px;border-top:1px solid #e2ebef;border-bottom:1px solid #e2ebef;background:#f1f6f8;color:#536f7d;font-size:10px;letter-spacing:.5px;font-weight:650}.dcl-table th:nth-child(1){width:18%}.dcl-table th:nth-child(2){width:25%}.dcl-table th:nth-child(3){width:18%}.dcl-table th small{font-size:8px;letter-spacing:0;font-weight:500;color:#7a909b}.dcl-table td{padding:18px 20px;border-bottom:1px solid #eaf0f3;vertical-align:middle;font-size:12px;overflow-wrap:anywhere}.dcl-table tbody tr:not(.dcl-loading-row):hover{background:#fafcfb}.dcl-member-id{font-size:10px!important;color:#57717e;font-weight:600}.dcl-person strong{display:block;font-size:12px;line-height:1.7;font-weight:650;color:#123e4a}.dcl-person small{display:block;font-size:9px;line-height:1.7;color:#7d8f98;margin-top:4px}.dcl-phone a{display:inline-flex;align-items:center;gap:6px;color:#456573;text-decoration:none;font-size:11px}.dcl-unavailable{font-size:10px;color:#81939d}.dcl-badge{display:inline-flex;align-items:center;justify-content:center;gap:4px;border-radius:7px;padding:5px 8px;font-size:9px;line-height:1.6;font-weight:650;white-space:nowrap}.dcl-badge.success{background:#e4f4eb;color:#20754f}.dcl-badge.missed{background:#fbebea;color:#a8504d}.dcl-badge.available{background:#e5f2f6;color:#216b83}.dcl-badge.upcoming{background:#eef1f4;color:#6e808c}.dcl-submitted{display:block;font-size:9px;line-height:1.7;margin-top:6px;color:#607c88}
.dcl-skeleton{display:block;border-radius:6px;background:linear-gradient(90deg,#e9eff2,#f8fafb,#e9eff2);background-size:200% 100%;animation:dcl-shimmer 1.5s linear infinite}.dcl-loading-row{height:83px}.dcl-error{display:flex;align-items:flex-start;gap:10px;padding:22px 24px;color:#a65b3c;background:#fff8f1;font-size:12px}.dcl-error svg{flex-shrink:0}.dcl-error p{margin:0;line-height:1.8}.dcl-error button,.dcl-empty button{margin-top:10px;padding:9px 13px;border:1px solid #d6bf93;border-radius:8px;background:#fff;color:#80632f;font:inherit;font-size:11px;cursor:pointer}.dcl-empty{text-align:center;padding:45px 20px;color:#748c97}.dcl-empty h3{font-size:18px;color:#173f4b;margin:14px 0 8px}.dcl-empty p{font-size:12px;line-height:1.8;margin:0}.dcl-sentinel{height:2px}.dcl-end{display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;color:#738b97;margin:0;padding:17px}.dcl-legend{display:flex;flex-wrap:wrap;gap:14px 20px;padding:17px 24px;border-top:1px solid #e8eff2;background:#fcfdfd}.dcl-legend span{display:flex;align-items:center;gap:6px;font-size:9px;color:#728995}.dcl-legend i{width:7px;height:7px;border-radius:50%;background:#b4bfca}.dcl-legend i.success{background:#57a882}.dcl-legend i.missed{background:#d99892}.dcl-legend i.available{background:#65a6ba}.dcl-scope{font-size:10px;color:#7b8d97;line-height:1.9;margin:18px 2px 0;max-width:900px}.dcl-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.dcl-page button:focus-visible,.dcl-page select:focus-visible,.dcl-page input:focus-visible{outline:2px solid #b2955b;outline-offset:3px}@keyframes dcl-shimmer{to{background-position:-200% 0}}
@media(max-width:1000px){.dcl-shell{padding:26px 20px 50px}.dcl-toolbar{flex-wrap:wrap}.dcl-search{flex-basis:100%}.dcl-filter{flex:1}.dcl-filter select,.dcl-filter input{max-width:none;width:100%}.dcl-table th,.dcl-table td{padding-left:12px;padding-right:12px}.dcl-card{padding:18px}.dcl-card-copy{font-size:9px}}
@media(max-width:700px){.dcl-shell{padding:22px 12px 44px}.dcl-header{align-items:flex-start;gap:12px;margin-bottom:20px}.dcl-header h1{font-size:29px}.dcl-header p{font-size:11px;line-height:1.8}.dcl-kicker{font-size:8px;letter-spacing:1.1px}.dcl-refresh{min-height:40px;font-size:10px;padding:9px}.dcl-cards{gap:9px;margin-bottom:17px}.dcl-card{padding:13px 11px;border-radius:13px}.dcl-card-top{flex-direction:column-reverse;align-items:flex-start;gap:10px;font-size:10px;line-height:1.5}.dcl-card-icon{width:32px;height:32px;border-radius:10px}.dcl-card-icon svg{width:18px;height:18px}.dcl-card>strong{font-size:27px}.dcl-card-copy{font-size:8px;line-height:1.7;align-items:flex-end}.dcl-card-copy svg{display:none}.dcl-count-skeleton{width:50px;height:29px}.dcl-panel{border-radius:16px}.dcl-toolbar{padding:17px 14px;gap:12px}.dcl-filter{min-width:0}.dcl-filter input,.dcl-filter select{font-size:10px;padding:9px 8px;min-width:0}.dcl-table-heading{padding:18px 14px;flex-wrap:wrap;gap:9px}.dcl-table-heading h2{font-size:16px}.dcl-window-note{font-size:9px}.dcl-table-wrap{overflow:visible}.dcl-table,.dcl-table tbody{display:block}.dcl-table thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.dcl-table tbody tr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 7px;padding:18px 15px;border-top:1px solid #e5edf0}.dcl-table td{display:block;border:0;padding:0;min-width:0}.dcl-table td:nth-child(-n+3){grid-column:1/-1}.dcl-table td[data-label]::before{display:block;content:attr(data-label);font-size:9px;font-weight:600;color:#83959f;margin-bottom:6px}.dcl-table td.dcl-member-id::before{display:inline;margin-right:7px}.dcl-person strong{font-size:14px}.dcl-person small{font-size:10px}.dcl-phone a{font-size:12px}.dcl-badge{font-size:9px;padding:5px 7px}.dcl-submitted{font-size:9px}.dcl-loading-row{height:auto!important}.dcl-legend{padding:16px 14px;gap:12px}.dcl-legend span{font-size:8px}.dcl-scope{font-size:9px}.dcl-skeleton{max-width:100%}.dcl-header>div{min-width:0}}
@media(prefers-reduced-motion:reduce){.dcl-page *{animation:none!important;transition:none!important}}
`
