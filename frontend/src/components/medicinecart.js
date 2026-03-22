import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";
import { getMedicines, addToCart, getMyPrescriptions, getUser } from "../api";

function formatDoctorDisplayName(name) {
  if (!name || !String(name).trim()) return "";
  const t = String(name).trim();
  return /^dr\.?\s/i.test(t) ? t : `Dr. ${t}`;
}

/** Latest prescription → banner label (doctor + date) */
function prescriptionBannerFromList(prescriptions) {
  const list = Array.isArray(prescriptions) ? prescriptions : [];
  if (!list.length) return { doctor: "", date: "" };
  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const latest = sorted[0];
  const d = latest?.doctorId;
  const rawName =
    d && typeof d === "object" && d.name ? d.name : "";
  return {
    doctor: formatDoctorDisplayName(rawName),
    date: latest?.createdAt
      ? new Date(latest.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
  };
}

/* ─── Theme Palettes ─────────────────────────────────────────────────────────── */
const THEMES = {
  blue: {
    bg: "#F0F6FF", surface: "#FFFFFF", card: "#EBF3FF",
    primary: "#2255A4", accent: "#1A3F7A", muted: "#6B8BBF",
    text: "#0F2040", subtle: "#D8E8FF",
    gradient: "linear-gradient(160deg, #F7FAFF 0%, #E8F0FC 50%, #F0F6FF 100%)",
    navBg: "#2255A4", navText: "#FFFFFF", swatch: "#2255A4", label: "Soft Blue",
  },
  green: {
    bg: "#F2FAF5", surface: "#FFFFFF", card: "#E3F5EB",
    primary: "#1E7A4A", accent: "#155235", muted: "#5C9B74",
    text: "#0D2D1C", subtle: "#C8EDD8",
    gradient: "linear-gradient(160deg, #F7FDF9 0%, #E8F7EE 50%, #F2FAF5 100%)",
    navBg: "#1E7A4A", navText: "#FFFFFF", swatch: "#1E7A4A", label: "Sage Green",
  },
  warm: {
    bg: "#FFF8F0", surface: "#FFFFFF", card: "#FFF0DC",
    primary: "#B85C1A", accent: "#7C3A0E", muted: "#C4875A",
    text: "#3D1F08", subtle: "#FFD9B0",
    gradient: "linear-gradient(160deg, #FFFCF8 0%, #FFF3E0 50%, #FFF8F0 100%)",
    navBg: "#B85C1A", navText: "#FFFFFF", swatch: "#B85C1A", label: "Warm Beige",
  },
  dark: {
    bg: "#111827", surface: "#1F2937", card: "#273447",
    primary: "#93C5FD", accent: "#BFDBFE", muted: "#6B8EBF",
    text: "#E2EAF4", subtle: "#2D3F55",
    gradient: "linear-gradient(160deg, #0F172A 0%, #111827 50%, #0F172A 100%)",
    navBg: "#0F172A", navText: "#E2EAF4", swatch: "#93C5FD", label: "Dark Comfort",
  },
};

/* ─── Global CSS ─────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; }

  @keyframes drift1 { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(28px,-52px) scale(1.06)} 66%{transform:translate(-18px,28px) scale(0.96)} 100%{transform:translate(0,0) scale(1)} }
  @keyframes drift2 { 0%{transform:translate(0,0) scale(1)} 40%{transform:translate(-42px,58px) scale(1.08)} 80%{transform:translate(18px,-28px) scale(0.94)} 100%{transform:translate(0,0) scale(1)} }
  @keyframes drift3 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(48px,38px) scale(1.1)} 100%{transform:translate(0,0) scale(1)} }
  @keyframes drift4 { 0%{transform:translate(0,0) scale(1)} 45%{transform:translate(-28px,-58px) scale(1.05)} 100%{transform:translate(0,0) scale(1)} }
  @keyframes drift5 { 0%{transform:translate(0,0) scale(1)} 55%{transform:translate(58px,-18px) scale(1.07)} 100%{transform:translate(0,0) scale(1)} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dropDown    { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cartBounce  { 0%,100%{transform:scale(1)} 30%{transform:scale(1.18)} 60%{transform:scale(0.94)} }
  @keyframes rxPulse     { 0%,100%{box-shadow:0 0 0 0 rgba(255,180,0,0)} 50%{box-shadow:0 0 0 6px rgba(255,180,0,0.18)} }
  @keyframes shimmer     { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes toastIn     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  .nav-btn           { transition:background .2s ease; cursor:pointer; }
  .nav-btn:hover     { background:rgba(255,255,255,0.22) !important; }
  .palette-row       { transition:background .15s ease; cursor:pointer; border-radius:10px; }
  .palette-row:hover { background:rgba(128,128,128,.08) !important; }
  .med-card          { transition:all .26s cubic-bezier(.25,.8,.25,1); }
  .med-card:hover    { transform:translateY(-6px) !important; }
  .qty-btn           { transition:all .18s ease; cursor:pointer; }
  .qty-btn:hover     { transform:scale(1.12); }
  .cart-fab          { transition:all .24s cubic-bezier(.25,.8,.25,1); cursor:pointer; }
  .cart-fab:hover    { transform:translateY(-3px) scale(1.04); }
  .filter-chip       { transition:all .18s ease; cursor:pointer; }
  .filter-chip:hover { opacity:1 !important; }
`;

/* ─── Bubble Canvas ──────────────────────────────────────────────────────────── */
function BubbleCanvas({ primary }) {
  const bubbles = [
    { w:460,h:460,top:"-12%",left:"-10%",anim:"drift1 24s ease-in-out infinite",op:.055 },
    { w:340,h:340,top:"58%",left:"72%",anim:"drift2 30s ease-in-out infinite",op:.05 },
    { w:280,h:280,top:"28%",left:"52%",anim:"drift3 36s ease-in-out infinite",op:.045 },
    { w:220,h:220,top:"68%",left:"8%",anim:"drift4 28s ease-in-out infinite",op:.06 },
    { w:190,h:190,top:"4%",left:"68%",anim:"drift5 32s ease-in-out infinite",op:.05 },
    { w:140,h:140,top:"44%",left:"88%",anim:"drift1 40s ease-in-out infinite reverse",op:.045 },
    { w:100,h:100,top:"82%",left:"50%",anim:"drift3 22s ease-in-out infinite reverse",op:.04 },
  ];
  return (
    <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden" }}>
      {bubbles.map((b,i) => (
        <div key={i} style={{
          position:"absolute",width:b.w,height:b.h,top:b.top,left:b.left,
          borderRadius:"50%",
          background:`radial-gradient(circle at 35% 30%, ${primary}2A, ${primary}06)`,
          border:`1px solid ${primary}18`,opacity:b.op,animation:b.anim,
          transition:"background .5s ease, border .5s ease",
        }}/>
      ))}
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────────── */
function Navbar({ T, themeKey, setThemeKey, cartCount }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();
  const user = getUser();
  const profileLabel =
    user?.name?.trim() ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "Profile";

  useEffect(() => {
    const close = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const navBtn = {
    display:"flex",alignItems:"center",gap:7,
    background:"rgba(255,255,255,0.13)",backdropFilter:"blur(10px)",
    border:"1.5px solid rgba(255,255,255,0.28)",borderRadius:10,
    padding:"8px 18px",color:T.navText,
    fontFamily:"'DM Sans', sans-serif",fontWeight:500,fontSize:"0.84rem",letterSpacing:".03em",
  };

  return (
    <nav style={{
      position:"sticky",top:0,zIndex:50,background:T.navBg,
      padding:"13px 36px",display:"flex",alignItems:"center",
      justifyContent:"space-between",boxShadow:"0 4px 24px rgba(0,0,0,0.1)",
      transition:"background .45s ease",
    }}>
      <div style={{ display:"flex",alignItems:"center",gap:14 }}>
        <span style={{ fontFamily:"'DM Serif Display', serif",fontSize:"1.3rem",fontStyle:"italic",color:T.navText,opacity:.92 }}>
          Baymaxify
        </span>
      </div>

      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        {/* Cart indicator */}
        <div style={{
          display:"flex",alignItems:"center",gap:7,
          background:"rgba(255,255,255,0.18)",backdropFilter:"blur(10px)",
          border:"1.5px solid rgba(255,255,255,0.28)",borderRadius:10,
          padding:"8px 16px",color:T.navText,fontSize:"0.84rem",fontWeight:500,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {cartCount > 0 && (
            <span style={{
              background:"#FF4E4E",color:"#fff",borderRadius:99,
              padding:"1px 7px",fontSize:"0.7rem",fontWeight:700,
              animation: cartCount > 0 ? "cartBounce .4s ease" : "none",
            }}>{cartCount}</span>
          )}
          Cart
        </div>

        <button style={{ ...navBtn,opacity:.85 }} onClick={() => navigate("/profile")}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="7" r="3.5"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"/>
          </svg>
          {profileLabel}
        </button>

        <div ref={dropRef} style={{ position:"relative" }}>
          <button className="nav-btn" style={navBtn} onClick={() => setOpen(p => !p)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
              <circle cx="8" cy="13" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="10" cy="9" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="14" cy="9" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="16" cy="13" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
            Palette
            <svg width="9" height="9" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={open ? "M1 5l4-4 4 4" : "M1 1l4 4 4-4"}/>
            </svg>
          </button>
          {open && (
            <div style={{
              position:"absolute",top:"calc(100% + 10px)",right:0,
              background:T.surface,border:`1px solid ${T.subtle}`,
              borderRadius:16,padding:8,width:218,
              boxShadow:"0 20px 56px rgba(0,0,0,.18)",
              animation:"dropDown .18s ease both",zIndex:100,
            }}>
              {Object.entries(THEMES).map(([key,th]) => (
                <div key={key} className="palette-row"
                  onClick={() => { setThemeKey(key); setOpen(false); }}
                  style={{
                    display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
                    background: key===themeKey ? `${T.primary}14` : "transparent",
                  }}>
                  <div style={{
                    width:22,height:22,borderRadius:"50%",background:th.swatch,flexShrink:0,
                    boxShadow: key===themeKey ? `0 0 0 3px ${th.swatch}44` : "none",
                  }}/>
                  <span style={{ fontFamily:"'DM Sans', sans-serif",fontSize:"0.88rem",fontWeight:key===themeKey?600:400,color:T.text }}>
                    {th.label}
                  </span>
                  {key===themeKey && (
                    <svg style={{ marginLeft:"auto" }} width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={T.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7l4 4 6-6"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="nav-btn" style={navBtn} onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 15l4-4-4-4"/><path d="M17 11H8"/><path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/>
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}

const UI_COLORS = ["#6366F1","#8B5CF6","#0EA5E9","#10B981","#F59E0B","#EF4444","#EC4899","#14B8A6","#2255A4","#B85C1A"];
const UI_SHAPES = ["capsule", "tablet", "softgel"];

/** Map Mongo medicine docs to UI fields (color/shape for SVG) */
function normalizeMedicineForUi(m) {
  const id = m._id ?? m.id;
  const s = String(id);
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return {
    ...m,
    _id: id,
    color: m.color || UI_COLORS[hash % UI_COLORS.length],
    shape: m.shape || UI_SHAPES[hash % UI_SHAPES.length],
    __illId: s.replace(/[^a-fA-F0-9]/g, "") || "0",
  };
}

/* ─── Medicine image illustration (SVG pill/capsule per medicine) ────────────── */
function MedIllustration({ medicine, size = 80 }) {
  const c = medicine.color;
  const s = medicine.shape;
  const mid = medicine.__illId || String(medicine._id ?? medicine.id ?? "0").replace(/[^a-fA-F0-9]/g, "") || "0";

  if (s === "softgel") return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <defs>
        <radialGradient id={`sg-${mid}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor={c} stopOpacity=".9"/>
          <stop offset="100%" stopColor={c} stopOpacity=".45"/>
        </radialGradient>
      </defs>
      <ellipse cx="40" cy="40" rx="28" ry="22" fill={`url(#sg-${mid})`}/>
      <ellipse cx="40" cy="40" rx="28" ry="22" fill="none" stroke={c} strokeWidth="1.5" strokeOpacity=".4"/>
      <ellipse cx="33" cy="34" rx="7" ry="5" fill="#fff" fillOpacity=".25"/>
    </svg>
  );

  if (s === "capsule") return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <defs>
        <linearGradient id={`cp-${mid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c} stopOpacity=".95"/>
          <stop offset="100%" stopColor={c} stopOpacity=".5"/>
        </linearGradient>
      </defs>
      <path d="M20 40 A18 18 0 0 1 38 22 L38 58 A18 18 0 0 1 20 40 Z" fill={`url(#cp-${mid})`}/>
      <path d="M42 22 L42 58 A18 18 0 0 0 60 40 A18 18 0 0 0 42 22 Z" fill={c} fillOpacity=".35"/>
      <line x1="40" y1="22" x2="40" y2="58" stroke="#fff" strokeWidth="1.5" strokeOpacity=".5"/>
      <ellipse cx="30" cy="34" rx="5" ry="3" fill="#fff" fillOpacity=".22" transform="rotate(-20,30,34)"/>
    </svg>
  );

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <defs>
        <radialGradient id={`tb-${mid}`} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor={c} stopOpacity=".92"/>
          <stop offset="100%" stopColor={c} stopOpacity=".48"/>
        </radialGradient>
      </defs>
      <rect x="14" y="26" width="52" height="28" rx="14" fill={`url(#tb-${mid})`}/>
      <rect x="14" y="26" width="52" height="28" rx="14" fill="none" stroke={c} strokeWidth="1.5" strokeOpacity=".3"/>
      <line x1="40" y1="28" x2="40" y2="54" stroke="#fff" strokeWidth="1.5" strokeOpacity=".4"/>
      <ellipse cx="30" cy="35" rx="6" ry="4" fill="#fff" fillOpacity=".2" transform="rotate(-10,30,35)"/>
    </svg>
  );
}

/* ─── Quantity control ───────────────────────────────────────────────────────── */
function QtyControl({ qty, onDec, onInc, T }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",justifyContent:"center",gap:0,
      background:T.card,borderRadius:12,border:`1px solid ${T.subtle}`,
      overflow:"hidden",
    }}>
      <button className="qty-btn" onClick={onDec} style={{
        width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",
        background:"transparent",border:"none",
        color: qty === 0 ? T.muted : T.primary,
        fontSize:"1.2rem",fontWeight:700,cursor: qty===0?"not-allowed":"pointer",
        opacity: qty===0 ? .35 : 1,
      }}>−</button>
      <span style={{
        minWidth:28,textAlign:"center",
        fontFamily:"'DM Sans', sans-serif",fontWeight:600,
        fontSize:"0.88rem",color:T.text,
      }}>{qty}</span>
      <button className="qty-btn" onClick={onInc} style={{
        width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",
        background:"transparent",border:"none",
        color:T.primary,fontSize:"1.2rem",fontWeight:700,cursor:"pointer",
      }}>+</button>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────────── */
function Toast({ msg, T }) {
  return (
    <div style={{
      position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",
      background:T.primary,color:"#fff",
      borderRadius:99,padding:"10px 24px",
      fontFamily:"'DM Sans', sans-serif",fontSize:"0.86rem",fontWeight:500,
      boxShadow:`0 8px 28px ${T.primary}44`,
      zIndex:200,animation:"toastIn .3s ease both",
      pointerEvents:"none",whiteSpace:"nowrap",
    }}>{msg}</div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function MedicineCartPage() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const T = THEMES[themeKey];

  const [medicines,      setMedicines]      = useState([]);
  const [prescribedMeds, setPrescribedMeds] = useState([]); // names from user's prescriptions
  const [rxBanner, setRxBanner] = useState({ doctor: "", date: "" });
  const [quantities,     setQuantities]     = useState({});
  const [showRxOnly,     setShowRxOnly]     = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search,         setSearch]         = useState("");
  const [toast,          setToast]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const toastTimer = useRef(null);

  /* Fetch medicines and user's prescribed medicine names on mount */
  useEffect(() => {
    Promise.all([
      getMedicines().catch(() => []),
      getMyPrescriptions().catch(() => []),
    ]).then(([meds, prescriptions]) => {
      setMedicines(
        (Array.isArray(meds) ? meds : []).map(normalizeMedicineForUi)
      );
      const rxList = Array.isArray(prescriptions) ? prescriptions : [];
      setRxBanner(prescriptionBannerFromList(rxList));
      const names = rxList.flatMap((p) =>
        (p.medicines || []).map((m) => (m.name || "").toLowerCase()).filter(Boolean)
      );
      setPrescribedMeds([...new Set(names)]);
    }).finally(() => setLoading(false));
  }, []);

  /* Refresh catalogue when returning from another tab (e.g. after admin adds medicine) */
  useEffect(() => {
    const onFocus = () => {
      getMedicines()
        .then((meds) =>
          setMedicines((Array.isArray(meds) ? meds : []).map(normalizeMedicineForUi))
        )
        .catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const setQty = (id, delta) => {
    setQuantities(prev => {
      const cur = prev[id] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [id]: next };
    });
  };

  const cartCount = Object.values(quantities).reduce((a, b) => a + b, 0);
  const cartTotal = medicines.reduce(
    (sum, m) => sum + (quantities[m._id] || 0) * m.price, 0
  );

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const handleAddToCart = async () => {
    if (cartCount === 0) { showToast("Add at least one medicine first"); return; }
    try {
      const items = Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([id, qty]) => ({ medicineId: id, qty }));
      await addToCart(items);
      showToast(`${cartCount} item${cartCount > 1 ? "s" : ""} added to cart!`);
      setQuantities({});
    } catch (err) {
      showToast("Cart failed: " + err.message);
    }
  };

  /* Mark medicine as prescribed if its name matches any prescription */
  const isUserPrescribed = (med) =>
    prescribedMeds.includes(med.name?.toLowerCase());

  const filtered = medicines.filter(m => {
    const matchCat  = activeCategory === "All" || m.category === activeCategory;
    const matchSrch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchRx   = showRxOnly ? isUserPrescribed(m) : true;
    return matchCat && matchSrch && matchRx;
  });

  const CATEGORIES = ["All", ...Array.from(new Set(medicines.map(m => m.category).filter(Boolean)))];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <BubbleCanvas primary={T.primary} />

      <div style={{
        minHeight:"100vh", background:T.gradient, color:T.text,
        transition:"background .45s ease", position:"relative", zIndex:1,
      }}>
        <Navbar T={T} themeKey={themeKey} setThemeKey={setThemeKey} cartCount={cartCount} />

        <main style={{ padding:"48px 28px 140px", position:"relative", zIndex:1 }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>

            {/* ── Page heading ── */}
            <div style={{ marginBottom:36,animation:"fadeSlideUp .5s ease both" }}>
              <p style={{
                fontWeight:500,fontSize:"0.7rem",letterSpacing:"0.2em",
                textTransform:"uppercase",color:T.muted,marginBottom:12,
              }}>Medicine Store</p>
              <h1 style={{
                fontFamily:"'DM Serif Display', serif",
                fontSize:"clamp(1.8rem, 4vw, 2.6rem)",
                fontWeight:400,color:T.accent,lineHeight:1.2,
              }}>Browse Medicines</h1>
              <div style={{
                width:48,height:3,borderRadius:99,
                background:T.primary,opacity:.45,marginTop:14,
              }}/>
            </div>

            {/* ── Controls bar ── */}
            <div style={{
              display:"flex",alignItems:"center",gap:14,marginBottom:28,
              flexWrap:"wrap",animation:"fadeSlideUp .55s ease .06s both",
            }}>
              {/* Search */}
              <div style={{
                display:"flex",alignItems:"center",gap:10,
                background:T.surface,borderRadius:12,
                border:`1.5px solid ${T.subtle}`,padding:"10px 16px",flex:"1",minWidth:200,
                boxShadow:"0 2px 10px rgba(0,0,0,.04)",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search medicines…"
                  style={{
                    border:"none",background:"transparent",outline:"none",
                    fontFamily:"'DM Sans', sans-serif",fontSize:"0.86rem",
                    color:T.text,width:"100%",
                  }}
                />
              </div>

              {/* Prescribed toggle */}
              <button
                onClick={() => setShowRxOnly(p => !p)}
                style={{
                  display:"flex",alignItems:"center",gap:8,
                  background: showRxOnly ? "#FFA500" : T.surface,
                  color:      showRxOnly ? "#fff"    : T.text,
                  border:`1.5px solid ${showRxOnly ? "#FFA500" : T.subtle}`,
                  borderRadius:12,padding:"10px 18px",
                  fontFamily:"'DM Sans', sans-serif",fontWeight:500,fontSize:"0.84rem",
                  cursor:"pointer",transition:"all .2s ease",
                  boxShadow: showRxOnly ? "0 6px 20px rgba(255,165,0,.32)" : "0 2px 10px rgba(0,0,0,.04)",
                  animation: showRxOnly ? "rxPulse 2s ease-in-out infinite" : "none",
                  whiteSpace:"nowrap",
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                  <line x1="12" y1="10" x2="12" y2="16"/>
                </svg>
                {showRxOnly ? "Prescribed Only" : "Show Prescribed"}
              </button>

              {/* Results count */}
              <span style={{ color:T.muted,fontSize:"0.82rem",whiteSpace:"nowrap" }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* ── Category chips ── */}
            <div style={{
              display:"flex",gap:8,marginBottom:36,flexWrap:"wrap",
              animation:"fadeSlideUp .58s ease .1s both",
            }}>
              {CATEGORIES.map(cat => {
                const active = activeCategory === cat;
                return (
                  <button key={cat} className="filter-chip"
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      background: active ? T.primary : T.surface,
                      color:      active ? "#fff"    : T.text,
                      border:`1.5px solid ${active ? T.primary : T.subtle}`,
                      borderRadius:99,padding:"6px 16px",
                      fontFamily:"'DM Sans', sans-serif",fontWeight: active ? 600 : 400,
                      fontSize:"0.8rem",cursor:"pointer",
                      boxShadow: active ? `0 4px 14px ${T.primary}38` : "0 2px 8px rgba(0,0,0,.03)",
                      transition:"all .18s ease",
                      opacity: active ? 1 : .8,
                    }}>
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* ── Prescribed banner (when filter active) ── */}
            {showRxOnly && (
              <div style={{
                display:"flex",alignItems:"center",gap:10,
                background:"rgba(255,165,0,0.1)",
                border:"1.5px solid rgba(255,165,0,0.35)",
                borderRadius:14,padding:"12px 20px",marginBottom:28,
                animation:"fadeSlideUp .3s ease both",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize:"0.82rem",color:"#B45309",fontWeight:500 }}>
                  Showing <strong>{filtered.length}</strong> medicines matching your prescription
                  {rxBanner.doctor || rxBanner.date ? (
                    <>
                      {" "}from <strong>{rxBanner.doctor || "your doctor"}</strong>
                      {rxBanner.date ? <> · {rxBanner.date}</> : null}
                    </>
                  ) : prescribedMeds.length ? (
                    <> (from your prescriptions)</>
                  ) : (
                    <> — add prescriptions from your doctor to see matches</>
                  )}
                </p>
              </div>
            )}

            {/* ── Medicine grid ── */}
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center",padding:"80px 20px",color:T.muted }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:.5,marginBottom:16 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p style={{ fontFamily:"'DM Serif Display', serif",fontSize:"1.2rem",marginBottom:6 }}>No medicines found</p>
                <p style={{ fontSize:"0.84rem" }}>Try adjusting your search or filters</p>
              </div>
            ) : (
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))",
                gap:22,
                animation:"fadeSlideUp .65s ease .14s both",
              }}>
                {filtered.map((med, idx) => {
                  const qty = quantities[med._id] || 0;
                  const inCart = qty > 0;
                  const isPrescribed = isUserPrescribed(med);

                  return (
                    <div
                      key={med._id}
                      className="med-card"
                      style={{
                        background:   T.surface,
                        borderRadius: 20,
                        border: isPrescribed && showRxOnly
                          ? "2px solid #FFA500"
                          : inCart
                          ? `2px solid ${T.primary}`
                          : `1.5px solid ${T.subtle}`,
                        boxShadow: inCart
                          ? `0 8px 28px ${T.primary}22`
                          : isPrescribed && showRxOnly
                          ? "0 8px 28px rgba(255,165,0,.15)"
                          : "0 4px 18px rgba(0,0,0,.05)",
                        display:"flex",flexDirection:"column",
                        overflow:"hidden",
                        position:"relative",
                        animationDelay:`${idx * 0.03}s`,
                      }}
                    >
                      {/* Prescribed badge */}
                      {isPrescribed && (
                        <div style={{
                          position:"absolute",top:10,left:10,zIndex:2,
                          background: showRxOnly ? "#FFA500" : `${T.primary}22`,
                          color:      showRxOnly ? "#fff"    : T.primary,
                          borderRadius:99,padding:"3px 9px",
                          fontSize:"0.64rem",fontWeight:700,letterSpacing:".08em",
                          display:"flex",alignItems:"center",gap:4,
                        }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          Rx
                        </div>
                      )}

                      {/* In-cart badge */}
                      {inCart && (
                        <div style={{
                          position:"absolute",top:10,right:10,zIndex:2,
                          background:T.primary,color:"#fff",
                          borderRadius:99,padding:"3px 9px",
                          fontSize:"0.64rem",fontWeight:700,
                        }}>
                          ×{qty}
                        </div>
                      )}

                      {/* Image zone */}
                      <div style={{
                        background: `linear-gradient(145deg, ${med.color}12 0%, ${med.color}06 100%)`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        padding:"28px 20px 18px",
                        borderBottom:`1px solid ${T.subtle}`,
                        position:"relative",
                      }}>
                        {/* Decorative ring */}
                        <div style={{
                          position:"absolute",width:100,height:100,borderRadius:"50%",
                          border:`1px solid ${med.color}18`,
                        }}/>
                        <div style={{
                          position:"absolute",width:70,height:70,borderRadius:"50%",
                          border:`1px solid ${med.color}22`,
                        }}/>
                        <MedIllustration medicine={med} size={80} />
                      </div>

                      {/* Info */}
                      <div style={{ padding:"14px 16px 8px",flex:1 }}>
                        <p style={{
                          fontFamily:"'DM Sans', sans-serif",fontWeight:600,
                          fontSize:"0.86rem",color:T.text,lineHeight:1.3,marginBottom:4,
                        }}>{med.name}</p>
                        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                          <span style={{
                            fontSize:"0.72rem",color:T.muted,
                            background:T.card,borderRadius:99,
                            padding:"2px 8px",
                          }}>{med.category}</span>
                          <span style={{
                            fontSize:"0.86rem",fontWeight:700,color:T.accent,
                          }}>₹{med.price}</span>
                        </div>
                      </div>

                      {/* Qty control */}
                      <div style={{ padding:"10px 16px 16px" }}>
                        <QtyControl
                          qty={qty}
                          onDec={() => setQty(med._id, -1)}
                          onInc={() => setQty(med._id, +1)}
                          T={T}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* ── Floating Add to Cart FAB ─────────────────────────────────────────── */}
        <div style={{
          position:"fixed",bottom:32,right:32,zIndex:100,
          display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,
        }}>
          {/* Cart summary pill */}
          {cartCount > 0 && (
            <div style={{
              background:T.surface,border:`1px solid ${T.subtle}`,
              borderRadius:14,padding:"8px 16px",
              boxShadow:"0 8px 28px rgba(0,0,0,.12)",
              fontFamily:"'DM Sans', sans-serif",fontSize:"0.8rem",
              color:T.muted,animation:"fadeSlideUp .3s ease both",
            }}>
              <span style={{ fontWeight:700,color:T.text }}>{cartCount}</span> item{cartCount>1?"s":""} ·{" "}
              <span style={{ fontWeight:700,color:T.primary }}>₹{cartTotal}</span>
            </div>
          )}

          {/* FAB button */}
          <button
            className="cart-fab"
            onClick={handleAddToCart}
            style={{
              display:"flex",alignItems:"center",gap:10,
              background:T.primary,color:"#fff",
              border:"none",borderRadius:18,
              padding:"15px 28px",
              fontFamily:"'DM Sans', sans-serif",fontWeight:600,fontSize:"0.92rem",
              boxShadow:`0 12px 36px ${T.primary}50, 0 4px 12px rgba(0,0,0,.15)`,
              cursor:"pointer",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Add to Cart
            {cartCount > 0 && (
              <span style={{
                background:"rgba(255,255,255,0.25)",
                borderRadius:99,padding:"2px 9px",
                fontSize:"0.78rem",fontWeight:700,
              }}>{cartCount}</span>
            )}
          </button>
        </div>

        {/* Toast */}
        {toast && <Toast msg={toast} T={T} />}
      </div>
    </>
  );
}
