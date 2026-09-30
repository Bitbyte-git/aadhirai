import { useEffect, useMemo, useRef, useState } from "react";
import api, { downloadSaleReceipt } from "../api";
import CoinTabs from "./CoinTabs";
import { SkeletonText } from "../components/Skeleton";
import {
  CartIcon,
  CoinIcon,
  JewelryIcon,
  PackageIcon,
  SearchIcon,
  UsersIcon,
  CalendarIcon,
  CrownIcon,
  CloseIcon,
  CheckIcon,
  SparkleIcon,
  DownloadIcon,
} from "../components/SvgIcons";

const ROLE_BADGE = {
  admin: { label: "Super Stockist", bg: "#F3E8FF", color: "#6B21A8" },
  dealer: { label: "Distributor", bg: "#E0F2FE", color: "#0369A1" },
  sub_dealer: { label: "Wholesale Dealer", bg: "#ECFDF5", color: "#047857" },
  promotor: { label: "Retailer", bg: "#EFF6FF", color: "#1D4ED8" },
  shop: { label: "Shop", bg: "#FFF7ED", color: "#9A3412" },
};
const ROLE_CHAIN = ["admin", "dealer", "sub_dealer", "promotor"];
const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];
const COIN_LABEL = { gold_22k: "Gold 22K", gold_24k: "Gold 24K", silver_999: "Silver 999" };
const PAGE_SIZE = 30;

// Real sale card maariye skeleton (image, seller pill, name, tags, 6 rows)
function SaleCardSkeleton() {
  return (
    <div className="ss-card" style={{ animation: "none" }}>
      <div className="ss-card-img" style={{ border: 0 }}><div className="skel-line" style={{ width: "100%", height: "100%", marginBottom: 0, borderRadius: 10 }} /></div>
      <SkeletonText width="65%" height="20px" style={{ borderRadius: 20, marginBottom: 8 }} />
      <SkeletonText width="80%" height="15px" />
      <div style={{ display: "flex", gap: 6, margin: "6px 0 10px" }}>
        <SkeletonText width="60px" height="18px" style={{ borderRadius: 20 }} />
        <SkeletonText width="80px" height="18px" style={{ borderRadius: 20 }} />
      </div>
      {[0, 1, 2, 3, 4].map((j) => (
        <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
          <SkeletonText width="32%" height="10px" style={{ marginBottom: 0 }} />
          <SkeletonText width="30%" height="10px" style={{ marginBottom: 0 }} />
        </div>
      ))}
    </div>
  );
}

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtDate = (iso) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

// ── Sales page — Jewellery / Coin sales. Seller + avanga KEEZHA irukura team sales (Super Admin-ku ellaamey).
// Summary, top sellers, role counts full backend; list 24-24-a infinite scroll ──
export default function StockSales({ kind = "jewellery" }) {
  const role = localStorage.getItem("role") || "";
  const isSuperAdmin = role === "super_admin";
  const isShop = role === "shop";
  // Shop-ku team = avanga sub-shops (shop network)
  const hasTeam = isSuperAdmin || isShop || ["admin", "dealer", "sub_dealer"].includes(role);
  const roleKeys = isSuperAdmin ? [...ROLE_CHAIN, "shop"] : isShop ? [] : ROLE_CHAIN.slice(ROLE_CHAIN.indexOf(role) + 1);
  const isCoin = kind === "coin";

  const [period, setPeriod] = useState("all");
  const [scope, setScope] = useState("all"); // all | mine | team
  const [roleFilter, setRoleFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [roleCounts, setRoleCounts] = useState({});
  const [topSellers, setTopSellers] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [cancelBox, setCancelBox] = useState(null); // { sale, busy }
  const [toast, setToast] = useState("");

  const reqIdRef = useRef(0);
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef(null);
  // Grid-la ippo evlo columns (desktop 4 / tablet 3 / mobile 2) — skeleton eppovume full rows
  const gridRef = useRef(null);
  const [gridCols, setGridCols] = useState(4);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = (offset) => ({
    kind, period, scope, role: roleFilter, status, search: debounced, offset, limit: PAGE_SIZE,
  });

  useEffect(() => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError("");
    setHasMore(false);
    loadingMoreRef.current = false;
    setLoadingMore(false);
    api.get("/stock-sales/", { params: params(0) })
      .then((res) => {
        if (reqId !== reqIdRef.current) return;
        const d = res.data || {};
        setItems(d.items || []);
        setSummary(d.summary || {});
        setRoleCounts(d.role_counts || {});
        setTopSellers(d.top_sellers || []);
        setListTotal(d.list_total || 0);
        setHasMore(!!d.has_more);
        offsetRef.current = (d.items || []).length;
      })
      .catch(() => { if (reqId === reqIdRef.current) setError("Failed to load sales."); })
      .finally(() => { if (reqId === reqIdRef.current) setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, period, scope, roleFilter, status, debounced, refreshKey]);

  const loadMore = () => {
    if (loadingMoreRef.current) return;
    const reqId = reqIdRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    api.get("/stock-sales/", { params: params(offsetRef.current) })
      .then((res) => {
        if (reqId !== reqIdRef.current) return;
        const more = res.data?.items || [];
        setItems((prev) => [...prev, ...more]);
        offsetRef.current += more.length;
        setHasMore(!!res.data?.has_more && more.length > 0);
      })
      .catch(() => { if (reqId === reqIdRef.current) setHasMore(false); })
      .finally(() => {
        if (reqId !== reqIdRef.current) return;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  };
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return undefined;
    const obs = new IntersectionObserver((e) => { if (e[0].isIntersecting) loadMoreRef.current(); }, { rootMargin: "500px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, items.length]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;
    const measure = () => {
      const n = getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean).length;
      if (n > 0) setGridCols(n);
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, [loading, items.length > 0]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  const [downloadingId, setDownloadingId] = useState(null);
  const handleReceipt = async (id) => {
    setDownloadingId(id);
    try {
      await downloadSaleReceipt(id);
    } catch {
      showToast("Receipt download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelBox || cancelBox.busy) return;
    setCancelBox((b) => ({ ...b, busy: true }));
    try {
      await api.post(`/stock-sales/${cancelBox.sale.id}/cancel/`);
      showToast("Sale cancelled · stock returned");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.response?.data?.error || "Cancel failed");
    } finally {
      setCancelBox(null);
    }
  };

  const statCards = useMemo(() => [
    { label: "Sales", value: (summary.count || 0).toLocaleString("en-IN"), Icon: CartIcon, tone: "teal" },
    { label: isCoin ? "Coins Sold" : "Pieces Sold", value: (summary.pieces || 0).toLocaleString("en-IN"), Icon: isCoin ? CoinIcon : PackageIcon, tone: "blue" },
    { label: "Sales Amount", value: fmt(summary.amount), Icon: SparkleIcon, tone: "gold" },
    { label: "Discount Given", value: fmt(summary.discount), Icon: CheckIcon, tone: "rose" },
  ], [summary, isCoin]);

  return (
    <div className="ss-page">
      <style>{`
        .ss-page { min-height: 100vh; padding: 24px 32px 64px; box-sizing: border-box; background: #F8FAF9;
          background-image: radial-gradient(at 0% 0%, rgba(7,59,63,0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(204,168,129,0.06) 0px, transparent 50%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111817; }
        .ss-wrap { max-width: 1440px; margin: 0 auto; }
        .ss-head { background: #FFFFFF; border: 1px solid #E1EBEA; border-radius: 20px; padding: 20px 26px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; box-shadow: 0 4px 20px rgba(7,59,63,0.04); }
        .ss-head h1 { margin: 0; font-size: 23px; font-weight: 850; color: #073B3F; display: flex; align-items: center; gap: 10px; }
        .ss-head p { margin: 4px 0 0; font-size: 13px; color: #5C706E; }
        .ss-seg { display: inline-flex; gap: 4px; padding: 4px; background: #EEF4F4; border: 1px solid #D9E6E5; border-radius: 12px; }
        .ss-seg button { border: none; background: transparent; padding: 8px 14px; border-radius: 9px; font-size: 12.5px; font-weight: 800; color: #5C706E; cursor: pointer; font-family: inherit; }
        .ss-seg button.active { background: #073B3F; color: #FFFFFF; box-shadow: 0 4px 12px rgba(7,59,63,0.2); }
        .ss-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          background: #FFFFFF; border: 1px solid #E1EBEA; border-radius: 16px; padding: 12px 16px; margin-bottom: 18px; }
        .ss-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .ss-pill { border: 1px solid #D6E2E1; background: #FFFFFF; color: #5C706E; padding: 7px 14px; border-radius: 999px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .ss-pill.active { background: #073B3F; border-color: #073B3F; color: #FFFFFF; }
        .ss-pill .n { margin-left: 6px; font-size: 11px; opacity: 0.8; }
        .ss-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
        .ss-stat { background: #FFFFFF; border: 1px solid #E1EBEA; border-radius: 18px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 16px rgba(7,59,63,0.03); }
        .ss-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ss-stat-icon.teal { background: #EFF6F6; } .ss-stat-icon.blue { background: #E0F2FE; } .ss-stat-icon.gold { background: #FDF3E4; } .ss-stat-icon.rose { background: #FFF1F2; }
        .ss-stat small { display: block; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #7A8987; }
        .ss-stat strong { font-size: 22px; font-weight: 900; color: #073B3F; }
        .ss-top { background: #FFFFFF; border: 1px solid #E1EBEA; border-radius: 18px; padding: 14px 16px; margin-bottom: 18px; }
        .ss-top-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 850; color: #073B3F; margin-bottom: 10px; }
        .ss-top-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
        .ss-top-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: #F8FAFA; border: 1px solid #EEF3F3; }
        .ss-rank { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; color: #FFFFFF; background: #9AA9A7; flex-shrink: 0; }
        .ss-rank.r1 { background: linear-gradient(135deg, #D4A24C, #A0713F); } .ss-rank.r2 { background: #94A3B8; } .ss-rank.r3 { background: #C08457; }
        .ss-top-name { font-size: 13px; font-weight: 800; color: #073B3F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ss-top-meta { font-size: 11.5px; color: #5C706E; font-weight: 600; }
        .ss-filter { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
        .ss-search { flex: 1; min-width: 220px; display: flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1px solid #D6E2E1; border-radius: 12px; padding: 0 12px; height: 42px; }
        .ss-search input { border: none; outline: none; flex: 1; font-size: 13px; font-family: inherit; background: transparent; }
        .ss-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
        .ss-card { background: rgba(253,253,252,0.9); border: 1px solid rgba(189,207,206,0.6); border-radius: 14px; padding: 14px;
          display: flex; flex-direction: column; min-width: 0; box-shadow: 0 10px 26px rgba(7,59,63,0.05);
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; animation: ssCardIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .ss-card:hover { border-color: rgba(204,168,129,0.55); transform: translateY(-3px); box-shadow: 0 16px 32px rgba(7,59,63,0.12); }
        .ss-card.cancelled { opacity: 0.62; }
        @keyframes ssCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .ss-card-img { position: relative; height: 140px; border-radius: 10px; overflow: hidden; margin-bottom: 10px;
          background: rgba(189,207,206,0.14); border: 1px solid rgba(189,207,206,0.55); display: flex; align-items: center; justify-content: center; }
        .ss-card-img img { width: 100%; height: 100%; object-fit: cover; }
        .ss-card-img.coin { background: radial-gradient(circle at 35% 30%, #FFF7E6, #F3DDB8); }
        .ss-card-status { position: absolute; top: 8px; right: 8px; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 999px; }
        .ss-card-status.done { background: rgba(236,253,245,0.95); color: #047857; }
        .ss-card-status.cancel { background: rgba(254,242,242,0.95); color: #B91C1C; }
        .ss-seller { align-self: flex-start; max-width: 100%; box-sizing: border-box; display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px; margin-bottom: 8px; font-size: 10.5px; font-weight: 800; }
        .ss-seller span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ss-seller em { font-style: normal; font-weight: 700; opacity: 0.75; white-space: nowrap; }
        .ss-card-name { font-size: 14px; font-weight: 850; color: #073B3F; margin-bottom: 4px; line-height: 1.3; }
        .ss-card-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .ss-card-tags span { font-size: 10px; font-weight: 800; color: #0C4044; background: rgba(12,64,68,0.08); border: 1px solid rgba(12,64,68,0.2); border-radius: 20px; padding: 2px 9px; }
        .ss-card-tags span.code { font-family: monospace; color: #A0713F; background: rgba(204,168,129,0.12); border-color: rgba(204,168,129,0.3); }
        .ss-card-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; padding: 4px 0; }
        .ss-card-row + .ss-card-row { border-top: 1px solid rgba(189,207,206,0.4); }
        .ss-card-row .k { color: #7A8987; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; flex-shrink: 0; }
        .ss-card-row .v { font-weight: 700; color: #111817; text-align: right; min-width: 0; overflow-wrap: anywhere; }
        .ss-card-row .v.off { color: #A0713F; }
        .ss-card-row.total .v { font-weight: 900; color: #BB8958; font-size: 13.5px; }
        .ss-card-row.total s { color: #9AA9A7; font-weight: 600; font-size: 11px; margin-right: 6px; }
        .ss-card-foot { margin-top: auto; padding-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap; }
        .ss-card-foot .date { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: #7A8987; font-weight: 600; }
        .ss-card-foot .btns { display: flex; gap: 6px; }
        .ss-card-foot .ss-receipt-btn, .ss-card-foot .ss-cancel-btn { margin-top: 0; }
        .ss-status { font-size: 10.5px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
        .ss-status.done { background: #ECFDF5; color: #047857; } .ss-status.cancel { background: #FEF2F2; color: #B91C1C; }
        .ss-receipt-btn { margin-top: 6px; border: 1px solid #CFE0DE; background: #FFFFFF; color: #073B3F; border-radius: 999px; padding: 4px 10px; font-size: 11.5px; font-weight: 800; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
        .ss-receipt-btn:disabled { opacity: 0.6; cursor: wait; }
        .ss-spin.dark { width: 11px; height: 11px; border: 2px solid rgba(7,59,63,0.2); border-top-color: #073B3F; }
        .ss-cancel-btn { margin-top: 6px; border: 1px solid #FECACA; background: #FFFFFF; color: #B91C1C; border-radius: 999px; padding: 4px 10px; font-size: 11.5px; font-weight: 800; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
        .ss-empty { text-align: center; padding: 56px 20px; background: #FFFFFF; border: 1px dashed #D6E2E1; border-radius: 18px; color: #7A8987; }
        .ss-cf-overlay { position: fixed; inset: 0; z-index: 1300; background: rgba(7,32,34,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .ss-cf-card { width: 100%; max-width: 340px; background: #FFFFFF; border-radius: 20px; padding: 24px 22px 20px; text-align: center; box-shadow: 0 24px 60px rgba(7,59,63,0.28); }
        .ss-cf-icon { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; background: #FEF2F2; box-shadow: 0 0 0 6px rgba(220,38,38,0.08); }
        .ss-cf-card h3 { margin: 0 0 6px; font-size: 17px; color: #073B3F; }
        .ss-cf-card p { margin: 0; font-size: 12.5px; color: #5C706E; }
        .ss-cf-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
        .ss-cf-actions button { height: 42px; border-radius: 12px; font-size: 13.5px; font-weight: 800; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
        .ss-cf-no { background: #FFFFFF; border: 1px solid #D6E2E1; color: #5C706E; }
        .ss-cf-yes { border: none; background: #DC2626; color: #FFFFFF; }
        .ss-cf-actions button:disabled { opacity: 0.55; cursor: not-allowed; }
        .ss-spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.35); border-top-color: #FFFFFF; animation: ssSpin 0.7s linear infinite; }
        @keyframes ssSpin { to { transform: rotate(360deg); } }
        .ss-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #073B3F; color: #FFFFFF; padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; z-index: 1400; box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
        @media (max-width: 1100px) { .ss-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 820px) { .ss-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } }
        @media (max-width: 1100px) { .ss-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .ss-page { padding: 14px 12px 48px; }
          .ss-card { padding: 9px; border-radius: 12px; }
          .ss-card-img { height: 104px; margin-bottom: 8px; border-radius: 8px; }
          .ss-seller { font-size: 9.5px; padding: 2px 7px; margin-bottom: 6px; }
          .ss-seller em { display: none; }
          .ss-card-name { font-size: 12px; }
          .ss-card-tags span { font-size: 9px; padding: 1px 7px; }
          .ss-card-row { font-size: 10.5px; padding: 3px 0; }
          .ss-card-row .k { font-size: 8.5px; }
          .ss-card-row.total .v { font-size: 12px; }
          .ss-card-foot { flex-direction: column; align-items: stretch; }
          .ss-card-foot .btns { justify-content: stretch; } .ss-card-foot .btns button { flex: 1; justify-content: center; }
          .ss-stats { gap: 10px; } .ss-stat { padding: 12px; } .ss-stat strong { font-size: 17px; } .ss-stat-icon { width: 36px; height: 36px; }
        }
      `}</style>

      <div className="ss-wrap">
        <CoinTabs activeTab={isCoin ? "Coin Sales" : "Jewellery Sales"} />

        <div className="ss-head">
          <div>
            <h1>{isCoin ? <CoinIcon size={24} color="#073B3F" /> : <JewelryIcon size={24} color="#073B3F" />} {isCoin ? "Coin Sales" : "Jewellery Sales"}</h1>
            <p>{isSuperAdmin ? "Every sale across the network" : isShop ? "Your shop's sales and your sub-shops' sales" : hasTeam ? "Your sales and your team's sales" : "Your sales"}</p>
          </div>
          {hasTeam && !isSuperAdmin && (
            <div className="ss-seg">
              {[["all", "All"], ["mine", "My Sales"], ["team", isShop ? "Sub-shop Sales" : "Team Sales"]].map(([k, l]) => (
                <button key={k} type="button" className={scope === k ? "active" : ""} onClick={() => setScope(k)}>{l}</button>
              ))}
            </div>
          )}
        </div>

        <div className="ss-bar">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#073B3F" }}>
            <CalendarIcon size={16} color="#073B3F" /> Period
          </span>
          <div className="ss-pills">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" className={`ss-pill ${period === p.key ? "active" : ""}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
            ))}
          </div>
        </div>

        <div className="ss-stats">
          {statCards.map((c) => (
            <div key={c.label} className="ss-stat">
              <div className={`ss-stat-icon ${c.tone}`}><c.Icon size={20} color="#073B3F" /></div>
              <div>
                <small>{c.label}</small>
                {loading ? <SkeletonText width="70px" height="24px" /> : <strong>{c.value}</strong>}
              </div>
            </div>
          ))}
        </div>

        {hasTeam && topSellers.length > 0 && (
          <div className="ss-top">
            <div className="ss-top-title"><CrownIcon size={16} color="#A0713F" /> Top Sellers</div>
            <div className="ss-top-list">
              {topSellers.map((t, i) => (
                <div key={t.seller_id} className="ss-top-item">
                  <span className={`ss-rank r${i + 1}`}>{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="ss-top-name">{t.name}</div>
                    <div className="ss-top-meta">{ROLE_BADGE[t.role]?.label || t.role} · {t.sales} sales · <strong style={{ color: "#073B3F" }}>{fmt(t.amount)}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ss-filter">
          <div className="ss-search">
            <SearchIcon size={15} color="#7A8987" />
            <input placeholder="Search seller, customer, phone or product" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {hasTeam && !isShop && (
            <div className="ss-pills">
              <button type="button" className={`ss-pill ${roleFilter === "all" ? "active" : ""}`} onClick={() => setRoleFilter("all")}>All Roles</button>
              {(isSuperAdmin ? roleKeys : [role, ...roleKeys]).map((rk) => (
                <button key={rk} type="button" className={`ss-pill ${roleFilter === rk ? "active" : ""}`} onClick={() => setRoleFilter(rk)}>
                  {ROLE_BADGE[rk]?.label}<span className="n">{roleCounts[rk] || 0}</span>
                </button>
              ))}
            </div>
          )}
          <div className="ss-pills">
            {[["all", "All"], ["completed", "Completed"], ["cancelled", "Cancelled"]].map(([k, l]) => (
              <button key={k} type="button" className={`ss-pill ${status === k ? "active" : ""}`} onClick={() => setStatus(k)}>
                {l}{k === "cancelled" && summary.cancelled ? <span className="n">{summary.cancelled}</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: "#5C706E", fontWeight: 700, marginBottom: 10 }}>
          Showing {items.length} of {listTotal} sales
        </div>

        {error && <div className="ss-empty" style={{ color: "#B91C1C" }}>{error}</div>}

        {loading ? (
          <div className="ss-grid" ref={gridRef}>
            {Array.from({ length: gridCols * 2 }, (_, i) => <SaleCardSkeleton key={i} />)}
          </div>
        ) : !error && items.length === 0 ? (
          <div className="ss-empty">
            <CartIcon size={38} color="#B4CECC" />
            <div style={{ fontSize: 16, fontWeight: 800, color: "#073B3F", marginTop: 8 }}>No sales yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Sell from {isCoin ? "Available Coins" : "Available Jewellery"} → My Vault Stock</div>
          </div>
        ) : (
          <div className="ss-grid" ref={gridRef}>
            {items.map((s, i) => {
              const rb = ROLE_BADGE[s.seller_role] || { label: s.seller_role, bg: "#F1F5F9", color: "#334155" };
              const cancelled = s.status === "cancelled";
              return (
                <div
                  key={s.id}
                  className={`ss-card${cancelled ? " cancelled" : ""}`}
                  style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 8) * 35}ms` }}
                >
                  <div className={`ss-card-img${isCoin ? " coin" : ""}`}>
                    {!isCoin && s.image
                      ? <img src={s.image} alt={s.product_name} loading="lazy" decoding="async" />
                      : isCoin ? <CoinIcon size={40} color="#A0713F" /> : <JewelryIcon size={34} color="#B4CECC" />}
                    <span className={`ss-card-status ${cancelled ? "cancel" : "done"}`}>{cancelled ? "Cancelled" : "Completed"}</span>
                  </div>
                  <div className="ss-seller" style={{ background: rb.bg, color: rb.color }}>
                    <UsersIcon size={11} color={rb.color} />
                    <span>{s.seller_name}</span>
                    <em>{rb.label}</em>
                  </div>
                  <div className="ss-card-name">
                    {isCoin ? `${COIN_LABEL[s.coin_metal_type] || s.coin_metal_type} · ${s.coin_weight_label}` : s.product_name}
                  </div>
                  <div className="ss-card-tags">
                    <span>{(s.metal || "").toUpperCase()} {(s.grade || "").toUpperCase()}</span>
                    {!isCoin && s.product_code && <span className="code">{s.product_code}</span>}
                  </div>
                  <div className="ss-card-row"><span className="k">Customer</span><span className="v">{s.customer_name}</span></div>
                  <div className="ss-card-row"><span className="k">Phone</span><span className="v">{s.customer_phone}</span></div>
                  <div className="ss-card-row"><span className="k">Weight</span><span className="v">{Number(s.net_weight).toFixed(2)} gm</span></div>
                  <div className="ss-card-row"><span className="k">Quantity</span><span className="v">{s.qty}</span></div>
                  <div className="ss-card-row"><span className="k">Rate</span><span className="v">{fmt(s.rate_per_gram)}/g</span></div>
                  {s.discount_percent > 0 && (
                    <div className="ss-card-row"><span className="k">Discount</span><span className="v off">{s.discount_percent}% · − {fmt(s.discount_amount)}</span></div>
                  )}
                  <div className="ss-card-row total">
                    <span className="k">Total</span>
                    <span className="v">
                      {s.discount_percent > 0 && <s>{fmt(s.mrp_amount)}</s>}
                      {fmt(s.final_amount)}
                    </span>
                  </div>
                  <div className="ss-card-foot">
                    <span className="date"><CalendarIcon size={11} color="#9AA9A7" /> {fmtDate(s.created_at)}</span>
                    <div className="btns">
                      <button type="button" className="ss-receipt-btn" disabled={downloadingId === s.id} onClick={() => handleReceipt(s.id)}>
                        {downloadingId === s.id ? <span className="ss-spin dark" /> : <DownloadIcon size={11} color="#073B3F" />} Receipt
                      </button>
                      {s.can_cancel && (
                        <button type="button" className="ss-cancel-btn" onClick={() => setCancelBox({ sale: s })}>
                          <CloseIcon size={11} color="#B91C1C" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Infinite scroll — kadaisi row gap fill + oru full row skeleton */}
            {loadingMore && Array.from({ length: ((gridCols - (items.length % gridCols)) % gridCols) + gridCols }, (_, i) => <SaleCardSkeleton key={`m${i}`} />)}
          </div>
        )}
        {hasMore && !loading && <div ref={sentinelRef} style={{ height: 1 }} />}      </div>

      {cancelBox && (
        <div className="ss-cf-overlay" onClick={() => !cancelBox.busy && setCancelBox(null)}>
          <div className="ss-cf-card" onClick={(e) => e.stopPropagation()}>
            <div className="ss-cf-icon"><CloseIcon size={26} color="#B91C1C" /></div>
            <h3>Cancel this sale?</h3>
            <p>{fmt(cancelBox.sale.final_amount)} · stock returns to you</p>
            <div className="ss-cf-actions">
              <button type="button" className="ss-cf-no" disabled={cancelBox.busy} onClick={() => setCancelBox(null)}>Keep</button>
              <button type="button" className="ss-cf-yes" disabled={cancelBox.busy} onClick={confirmCancel}>
                {cancelBox.busy ? <><span className="ss-spin" /> Cancelling…</> : <><CloseIcon size={14} color="#FFFFFF" /> Cancel Sale</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ss-toast">{toast}</div>}
    </div>
  );
}
