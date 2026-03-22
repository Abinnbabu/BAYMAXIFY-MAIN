import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";
import { getMyPrescriptions, downloadPrescriptionPDF } from "../api";

/* ─── Theme Palettes (identical to home.js) ─────────────────────────────────── */
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

  @keyframes drift1 {
    0%   { transform: translate(0px,   0px)  scale(1);    }
    33%  { transform: translate(28px, -52px) scale(1.06); }
    66%  { transform: translate(-18px, 28px) scale(0.96); }
    100% { transform: translate(0px,   0px)  scale(1);    }
  }
  @keyframes drift2 {
    0%   { transform: translate(0px,   0px)  scale(1);    }
    40%  { transform: translate(-42px, 58px) scale(1.08); }
    80%  { transform: translate(18px, -28px) scale(0.94); }
    100% { transform: translate(0px,   0px)  scale(1);    }
  }
  @keyframes drift3 {
    0%   { transform: translate(0px,  0px)  scale(1);   }
    50%  { transform: translate(48px, 38px) scale(1.1); }
    100% { transform: translate(0px,  0px)  scale(1);   }
  }
  @keyframes drift4 {
    0%   { transform: translate(0px,   0px)  scale(1);    }
    45%  { transform: translate(-28px,-58px) scale(1.05); }
    100% { transform: translate(0px,   0px)  scale(1);    }
  }
  @keyframes drift5 {
    0%   { transform: translate(0px,  0px)  scale(1);    }
    55%  { transform: translate(58px,-18px) scale(1.07); }
    100% { transform: translate(0px,  0px)  scale(1);    }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes dropDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0;  }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }

  .nav-btn           { transition: background .2s ease; cursor: pointer; }
  .nav-btn:hover     { background: rgba(255,255,255,0.22) !important; }
  .palette-row       { transition: background .15s ease; cursor: pointer; border-radius: 10px; }
  .palette-row:hover { background: rgba(128,128,128,.08) !important; }
  .hist-row          { transition: all .2s ease; cursor: pointer; }
  .hist-row:hover    { transform: translateX(4px); }
  .rx-tab            { transition: all .2s ease; cursor: pointer; }
  .rx-tab:hover      { opacity: 1 !important; }
  .action-btn        { transition: all .22s ease; cursor: pointer; }
  .action-btn:hover  { transform: translateY(-2px); }
`;

/* ─── Bubble Canvas ──────────────────────────────────────────────────────────── */
function BubbleCanvas({ primary }) {
  const bubbles = [
    { w:460, h:460, top:"-12%", left:"-10%", anim:"drift1 24s ease-in-out infinite",         op:.055 },
    { w:340, h:340, top:"58%",  left:"72%",  anim:"drift2 30s ease-in-out infinite",         op:.05  },
    { w:280, h:280, top:"28%",  left:"52%",  anim:"drift3 36s ease-in-out infinite",         op:.045 },
    { w:220, h:220, top:"68%",  left:"8%",   anim:"drift4 28s ease-in-out infinite",         op:.06  },
    { w:190, h:190, top:"4%",   left:"68%",  anim:"drift5 32s ease-in-out infinite",         op:.05  },
    { w:140, h:140, top:"44%",  left:"88%",  anim:"drift1 40s ease-in-out infinite reverse", op:.045 },
    { w:100, h:100, top:"82%",  left:"50%",  anim:"drift3 22s ease-in-out infinite reverse", op:.04  },
  ];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position:"absolute", width:b.w, height:b.h,
          top:b.top, left:b.left, borderRadius:"50%",
          background:`radial-gradient(circle at 35% 30%, ${primary}2A, ${primary}06)`,
          border:`1px solid ${primary}18`, opacity:b.op, animation:b.anim,
          transition:"background .5s ease, border .5s ease",
        }} />
      ))}
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────────── */
function Navbar({ T, themeKey, setThemeKey }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const navBtn = {
    display:"flex", alignItems:"center", gap:7,
    background:"rgba(255,255,255,0.13)", backdropFilter:"blur(10px)",
    border:"1.5px solid rgba(255,255,255,0.28)", borderRadius:10,
    padding:"8px 18px", color:T.navText,
    fontFamily:"'DM Sans', sans-serif", fontWeight:500,
    fontSize:"0.84rem", letterSpacing:".03em",
  };

  return (
    <nav style={{
      position:"sticky", top:0, zIndex:50, background:T.navBg,
      padding:"13px 36px", display:"flex", alignItems:"center",
      justifyContent:"space-between", boxShadow:"0 4px 24px rgba(0,0,0,0.1)",
      transition:"background .45s ease",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <span style={{
          fontFamily:"'DM Serif Display', serif", fontSize:"1.3rem",
          fontStyle:"italic", color:T.navText, opacity:.92, letterSpacing:".01em",
        }}>Baymaxify</span>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* Username */}
        <button style={{ ...navBtn, opacity:.85, pointerEvents:"auto" }}
          onClick={() => navigate("/profile")}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="7" r="3.5" />
            <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" />
          </svg>
          Amar
        </button>

        {/* Palette */}
        <div ref={dropRef} style={{ position:"relative" }}>
          <button className="nav-btn" style={navBtn} onClick={() => setOpen(p => !p)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" />
              <circle cx="8" cy="13" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="10" cy="9" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="14" cy="9" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="16" cy="13" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            Palette
            <svg width="9" height="9" viewBox="0 0 10 6" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={open ? "M1 5l4-4 4 4" : "M1 1l4 4 4-4"} />
            </svg>
          </button>
          {open && (
            <div style={{
              position:"absolute", top:"calc(100% + 10px)", right:0,
              background:T.surface, border:`1px solid ${T.subtle}`,
              borderRadius:16, padding:8, width:218,
              boxShadow:"0 20px 56px rgba(0,0,0,.18)",
              animation:"dropDown .18s ease both", zIndex:100,
            }}>
              {Object.entries(THEMES).map(([key, th]) => (
                <div key={key} className="palette-row"
                  onClick={() => { setThemeKey(key); setOpen(false); }}
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"10px 12px",
                    background: key === themeKey ? `${T.primary}14` : "transparent",
                  }}>
                  <div style={{
                    width:22, height:22, borderRadius:"50%", background:th.swatch, flexShrink:0,
                    boxShadow: key === themeKey ? `0 0 0 3px ${th.swatch}44` : "none",
                    transition:"box-shadow .2s",
                  }} />
                  <span style={{
                    fontFamily:"'DM Sans', sans-serif", fontSize:"0.88rem",
                    fontWeight: key === themeKey ? 600 : 400, color:T.text,
                  }}>{th.label}</span>
                  {key === themeKey && (
                    <svg style={{ marginLeft:"auto" }} width="13" height="13" viewBox="0 0 14 14"
                      fill="none" stroke={T.primary} strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7l4 4 6-6" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button className="nav-btn" style={navBtn} onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 15l4-4-4-4" /><path d="M17 11H8" />
            <path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}

/* ─── Mock prescription history data ────────────────────────────────────────── */
/* TODO: Replace with real API call → GET /api/prescriptions?userId=:id          */
const MOCK_HISTORY = [
  {
    id: "RX-2024-001",
    doctor: "Dr. Priya Menon",
    specialty: "Psychiatrist",
    date: "12 Jan 2025",
    diagnosis: "Generalised Anxiety Disorder",
    medicines: ["Escitalopram 10mg", "Clonazepam 0.5mg", "Melatonin 3mg"],
    status: "active",
    avatar: "PM",
  },
  {
    id: "RX-2024-002",
    doctor: "Dr. Arjun Nair",
    specialty: "General Physician",
    date: "28 Nov 2024",
    diagnosis: "Mild Depression, Insomnia",
    medicines: ["Sertraline 50mg", "Zolpidem 5mg"],
    status: "completed",
    avatar: "AN",
  },
  {
    id: "RX-2024-003",
    doctor: "Dr. Lekha Krishnan",
    specialty: "Neurologist",
    date: "3 Sep 2024",
    diagnosis: "Tension Headache, Stress",
    medicines: ["Propranolol 20mg", "Amitriptyline 10mg", "B-Complex"],
    status: "completed",
    avatar: "LK",
  },
];

/* ─── Status badge ───────────────────────────────────────────────────────────── */
function StatusBadge({ status, T }) {
  const cfg = status === "active"
    ? { bg: `${T.primary}18`, color: T.primary, dot: T.primary, label: "Active" }
    : { bg: `${T.muted}18`,   color: T.muted,   dot: T.muted,   label: "Completed" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:cfg.bg, color:cfg.color,
      borderRadius:99, padding:"3px 10px",
      fontSize:"0.72rem", fontWeight:600, letterSpacing:".05em",
    }}>
      <span style={{
        width:6, height:6, borderRadius:"50%", background:cfg.dot, flexShrink:0,
        animation: status === "active" ? "pulse 2s ease-in-out infinite" : "none",
      }} />
      {cfg.label}
    </span>
  );
}

/* ─── Prescription Detail Panel ─────────────────────────────────────────────── */
function PrescriptionPanel({ rx, T }) {
  if (!rx) return (
    <div style={{
      height:"100%", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16,
      opacity:.45,
    }}>
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
        stroke={T.muted} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="12" y1="10" x2="12" y2="16" />
      </svg>
      <p style={{ fontFamily:"'DM Sans', sans-serif", color:T.muted, fontSize:"0.9rem" }}>
        Select a prescription to view details
      </p>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, height:"100%", animation:"fadeSlideUp .35s ease both" }}>

      {/* Header strip */}
      <div style={{
        background: `linear-gradient(135deg, ${T.primary}18 0%, ${T.primary}08 100%)`,
        borderBottom: `1px solid ${T.subtle}`,
        padding:"28px 32px 24px",
        borderRadius:"0 0 0 0",
      }}>
        {/* Rx watermark */}
        <div style={{
          position:"absolute", top:24, right:28,
          fontFamily:"'DM Serif Display', serif",
          fontSize:"5rem", fontWeight:400, fontStyle:"italic",
          color:T.primary, opacity:.07, lineHeight:1, pointerEvents:"none",
          userSelect:"none",
        }}>Rx</div>

        <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
          {/* Doctor avatar */}
          <div style={{
            width:52, height:52, borderRadius:14,
            background:T.primary, color:"#fff",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'DM Sans', sans-serif", fontWeight:600, fontSize:"1rem",
            flexShrink:0, letterSpacing:".04em",
          }}>
            {rx.avatar}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:"0.7rem", fontWeight:500, letterSpacing:".15em",
              textTransform:"uppercase", color:T.muted, marginBottom:4 }}>
              Prescription
            </p>
            <h2 style={{
              fontFamily:"'DM Serif Display', serif", fontSize:"1.5rem",
              fontWeight:400, color:T.accent, lineHeight:1.2,
            }}>{rx.doctor}</h2>
            <p style={{ color:T.muted, fontSize:"0.82rem", marginTop:3 }}>{rx.specialty}</p>
          </div>
          <StatusBadge status={rx.status} T={T} />
        </div>

        {/* Meta row */}
        <div style={{
          display:"flex", gap:24, marginTop:20, flexWrap:"wrap",
        }}>
          {[
            { label:"Prescription ID", value: rx.id },
            { label:"Date Issued",     value: rx.date },
            { label:"Diagnosis",       value: rx.diagnosis },
          ].map(m => (
            <div key={m.label}>
              <p style={{ fontSize:"0.68rem", letterSpacing:".1em", textTransform:"uppercase",
                color:T.muted, fontWeight:500, marginBottom:3 }}>{m.label}</p>
              <p style={{ fontSize:"0.88rem", color:T.text, fontWeight:500 }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Medicines list */}
      <div style={{ padding:"24px 32px", flex:1, overflowY:"auto" }}>
        <p style={{
          fontSize:"0.7rem", fontWeight:600, letterSpacing:".15em",
          textTransform:"uppercase", color:T.muted, marginBottom:16,
        }}>
          Prescribed Medicines
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {rx.medicines.map((med, idx) => (
            <div key={idx} style={{
              display:"flex", alignItems:"center", gap:14,
              background:T.card, borderRadius:12,
              border:`1px solid ${T.subtle}`,
              padding:"14px 18px",
            }}>
              <div style={{
                width:32, height:32, borderRadius:9,
                background:`${T.primary}20`,
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke={T.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3" />
                  <circle cx="18" cy="18" r="4" /><path d="M18 16v2l1 1" />
                </svg>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:"0.9rem", fontWeight:500, color:T.text }}>{med}</p>
                {/* TODO: Add dosage instructions from backend */}
                <p style={{ fontSize:"0.75rem", color:T.muted, marginTop:2 }}>
                  Dosage instructions — <span style={{ fontStyle:"italic" }}>connect backend</span>
                </p>
              </div>
              <div style={{
                fontSize:"0.7rem", fontWeight:600, letterSpacing:".08em",
                color:T.muted, background:`${T.muted}12`,
                borderRadius:99, padding:"3px 10px",
              }}>
                #{idx + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Doctor's notes placeholder */}
        <div style={{ marginTop:24 }}>
          <p style={{
            fontSize:"0.7rem", fontWeight:600, letterSpacing:".15em",
            textTransform:"uppercase", color:T.muted, marginBottom:12,
          }}>Doctor's Notes</p>
          <div style={{
            background:T.card, borderRadius:14,
            border:`1.5px dashed ${T.subtle}`,
            padding:"18px 20px", minHeight:80,
            display:"flex", alignItems:"center", gap:10,
          }}>
            {/* TODO: Fetch doctor notes from GET /api/prescriptions/:id/notes */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={T.muted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M4 12a1 1 0 0 0-2 0v3a7 7 0 0 0 14 0v-3a1 1 0 0 0-2 0" />
            </svg>
            <p style={{ color:T.muted, fontSize:"0.84rem", fontStyle:"italic" }}>
              Notes will appear here — backend integration pending
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:12, marginTop:28, flexWrap:"wrap" }}>
          {/* TODO: Wire download to GET /api/prescriptions/:id/pdf */}
          <button className="action-btn" style={{
            display:"flex", alignItems:"center", gap:8,
            background:T.primary, color:"#fff",
            border:"none", borderRadius:12,
            padding:"11px 22px", fontFamily:"'DM Sans', sans-serif",
            fontWeight:500, fontSize:"0.86rem", cursor:"pointer",
            boxShadow:`0 6px 20px ${T.primary}40`,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
          {/* TODO: Wire to POST /api/cart/add-prescription/:id */}
          <button className="action-btn" style={{
            display:"flex", alignItems:"center", gap:8,
            background:"transparent", color:T.primary,
            border:`1.5px solid ${T.primary}`, borderRadius:12,
            padding:"11px 22px", fontFamily:"'DM Sans', sans-serif",
            fontWeight:500, fontSize:"0.86rem", cursor:"pointer",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function PrescriptionPage() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedRx,    setSelectedRx]    = useState(null);
  const [activeTab,     setActiveTab]     = useState("all");
  const [loading,       setLoading]       = useState(true);

  const T = THEMES[themeKey];

  /* Fetch prescriptions from backend on mount */
  useEffect(() => {
    getMyPrescriptions()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setPrescriptions(list);
        if (list.length > 0) setSelectedRx(list[0]);
      })
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false));
  }, []);

  /* Handle PDF download */
  const handleDownloadPDF = async (id) => {
    try {
      await downloadPrescriptionPDF(id);
    } catch (err) {
      alert("PDF download failed: " + err.message);
    }
  };

  const card = {
    background:   T.surface,
    borderRadius: 22,
    border:       `1px solid ${T.subtle}`,
    boxShadow:    "0 8px 40px rgba(0,0,0,.06), 0 2px 12px rgba(0,0,0,.04)",
    transition:   "background .4s, border .4s, box-shadow .3s",
    overflow:     "hidden",
  };

  const filtered = prescriptions.filter(rx =>
    activeTab === "all" ? true : rx.status === activeTab
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <BubbleCanvas primary={T.primary} />

      <div style={{
        minHeight:"100vh", background:T.gradient, color:T.text,
        transition:"background .45s ease", position:"relative", zIndex:1,
      }}>
        <Navbar T={T} themeKey={themeKey} setThemeKey={setThemeKey} />

        <main style={{ padding:"48px 24px 80px", position:"relative", zIndex:1 }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>

            {/* ── Page heading ── */}
            <div style={{ marginBottom:40, animation:"fadeSlideUp .5s ease both" }}>
              <p style={{
                fontWeight:500, fontSize:"0.7rem", letterSpacing:"0.2em",
                textTransform:"uppercase", color:T.muted, marginBottom:12,
              }}>
                Medical Records
              </p>
              <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
                <h1 style={{
                  fontFamily:"'DM Serif Display', serif",
                  fontSize:"clamp(1.8rem, 4vw, 2.6rem)",
                  fontWeight:400, color:T.accent, lineHeight:1.2,
                }}>
                  Doctor Prescriptions
                </h1>
                {/* TODO: "Request New" → POST /api/prescriptions/request */}
                <button className="action-btn" style={{
                  display:"flex", alignItems:"center", gap:8,
                  background:T.primary, color:"#fff", border:"none",
                  borderRadius:12, padding:"11px 22px",
                  fontFamily:"'DM Sans', sans-serif",
                  fontWeight:500, fontSize:"0.86rem", cursor:"pointer",
                  boxShadow:`0 6px 20px ${T.primary}38`,
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Request New
                </button>
              </div>
              <div style={{
                width:48, height:3, borderRadius:99,
                background:T.primary, opacity:.45, marginTop:16,
                transition:"background .4s",
              }} />
            </div>

            {/* ── Two-panel layout ── */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"360px 1fr",
              gap:24,
              alignItems:"start",
              animation:"fadeSlideUp .6s ease .1s both",
            }}>

              {/* ── LEFT: History list ── */}
              <div style={{ ...card, display:"flex", flexDirection:"column" }}>

                {/* Search bar */}
                {/* TODO: Wire to GET /api/prescriptions/search?q=:query */}
                <div style={{
                  padding:"20px 20px 16px",
                  borderBottom:`1px solid ${T.subtle}`,
                }}>
                  <div style={{
                    display:"flex", alignItems:"center", gap:10,
                    background:T.card, borderRadius:12,
                    border:`1px solid ${T.subtle}`,
                    padding:"9px 14px",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      placeholder="Search prescriptions…"
                      style={{
                        border:"none", background:"transparent", outline:"none",
                        fontFamily:"'DM Sans', sans-serif", fontSize:"0.85rem",
                        color:T.text, width:"100%",
                      }}
                    />
                  </div>
                </div>

                {/* Tab filters */}
                <div style={{
                  display:"flex", gap:4, padding:"14px 20px 10px",
                  borderBottom:`1px solid ${T.subtle}`,
                }}>
                  {["all","active","completed"].map(tab => (
                    <button key={tab} className="rx-tab"
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: activeTab === tab ? T.primary : "transparent",
                        color:      activeTab === tab ? "#fff" : T.muted,
                        border:     activeTab === tab ? "none" : `1px solid ${T.subtle}`,
                        borderRadius:99, padding:"5px 14px",
                        fontFamily:"'DM Sans', sans-serif",
                        fontWeight: activeTab === tab ? 600 : 400,
                        fontSize:"0.76rem", letterSpacing:".04em",
                        textTransform:"capitalize", cursor:"pointer",
                        opacity: activeTab === tab ? 1 : .7,
                        transition:"all .2s ease",
                      }}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* History rows */}
                {/* TODO: Replace MOCK_HISTORY with GET /api/prescriptions?userId=:id */}
                <div style={{ overflowY:"auto", maxHeight:520 }}>
                  {filtered.length === 0 ? (
                    <div style={{
                      padding:"40px 20px", textAlign:"center",
                      color:T.muted, fontSize:"0.85rem",
                    }}>
                      No prescriptions found
                    </div>
                  ) : filtered.map((rx, i) => {
                    const active = selectedRx?.id === rx.id;
                    return (
                      <div key={rx.id} className="hist-row"
                        onClick={() => setSelectedRx(rx)}
                        style={{
                          padding:"16px 20px",
                          borderBottom: i < filtered.length - 1 ? `1px solid ${T.subtle}` : "none",
                          background: active ? `${T.primary}0D` : "transparent",
                          borderLeft: active ? `3px solid ${T.primary}` : "3px solid transparent",
                          transition:"all .2s ease",
                        }}>
                        <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                          {/* Avatar */}
                          <div style={{
                            width:38, height:38, borderRadius:10,
                            background: active ? T.primary : `${T.primary}22`,
                            color: active ? "#fff" : T.primary,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontFamily:"'DM Sans', sans-serif", fontWeight:600,
                            fontSize:"0.78rem", flexShrink:0,
                            transition:"all .2s ease",
                          }}>
                            {rx.avatar}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                              <p style={{
                                fontWeight:600, fontSize:"0.86rem", color:T.text,
                                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                              }}>{rx.doctor}</p>
                              <span style={{ fontSize:"0.72rem", color:T.muted, flexShrink:0, marginLeft:8 }}>
                                {rx.date}
                              </span>
                            </div>
                            <p style={{ fontSize:"0.78rem", color:T.muted, marginBottom:6,
                              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                              {rx.specialty}
                            </p>
                            <p style={{
                              fontSize:"0.78rem", color:T.text, opacity:.7,
                              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                            }}>
                              {rx.diagnosis}
                            </p>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                              <span style={{
                                fontSize:"0.7rem", color:T.muted,
                              }}>
                                {rx.medicines.length} medicine{rx.medicines.length !== 1 ? "s" : ""}
                              </span>
                              <StatusBadge status={rx.status} T={T} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer count */}
                <div style={{
                  padding:"12px 20px", borderTop:`1px solid ${T.subtle}`,
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                }}>
                  <p style={{ fontSize:"0.76rem", color:T.muted }}>
                    {filtered.length} prescription{filtered.length !== 1 ? "s" : ""}
                  </p>
                  {/* TODO: Pagination → GET /api/prescriptions?page=:n */}
                  <button style={{
                    background:"none", border:"none", cursor:"pointer",
                    fontSize:"0.76rem", color:T.primary, fontFamily:"'DM Sans', sans-serif",
                    fontWeight:500,
                  }}>
                    Load more
                  </button>
                </div>
              </div>

              {/* ── RIGHT: Detail panel ── */}
              <div style={{
                ...card,
                minHeight:600,
                position:"relative",
              }}>
                <PrescriptionPanel rx={selectedRx} T={T} />
              </div>

            </div>

            {/* ── Backend integration note ── */}
            <div style={{
              marginTop:28,
              background:`${T.primary}0A`,
              border:`1px dashed ${T.primary}40`,
              borderRadius:14, padding:"14px 20px",
              display:"flex", alignItems:"center", gap:12,
              animation:"fadeSlideUp .7s ease .2s both",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ fontSize:"0.8rem", color:T.primary, fontWeight:500 }}>
                <strong>Backend placeholder:</strong> Connect{" "}
                <code style={{ background:`${T.primary}15`, borderRadius:4, padding:"1px 6px", fontSize:"0.76rem" }}>
                  GET /api/prescriptions
                </code>{" "}
                and{" "}
                <code style={{ background:`${T.primary}15`, borderRadius:4, padding:"1px 6px", fontSize:"0.76rem" }}>
                  GET /api/prescriptions/:id
                </code>{" "}
                to replace mock data. Doctor notes, dosage, and PDF download endpoints are also marked in-code.
              </p>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
