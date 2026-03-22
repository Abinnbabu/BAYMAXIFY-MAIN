import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";
import {
  adminGetDoctors, adminAddDoctor, adminUpdateDoctor,
  adminToggleDoctorStatus, adminDeleteDoctor,
  adminGetMedicines, adminAddMedicine, adminUpdateMedicine, adminDeleteMedicine,
} from "../api";

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
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dropDown    { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes modalIn     { from{opacity:0;transform:scale(.95) translateY(18px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes overlayIn   { from{opacity:0} to{opacity:1} }
  @keyframes rowIn       { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes toastSlide  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  .nav-btn           { transition:background .2s; cursor:pointer; }
  .nav-btn:hover     { background:rgba(255,255,255,0.22) !important; }
  .palette-row       { transition:background .15s; cursor:pointer; border-radius:10px; }
  .palette-row:hover { background:rgba(128,128,128,.08) !important; }
  .tab-btn           { transition:all .2s; cursor:pointer; }
  .tab-btn:hover     { opacity:1 !important; }
  .row-item          { transition:background .15s; }
  .row-item:hover    { background:var(--row-hover) !important; }
  .icon-btn          { transition:all .18s; cursor:pointer; }
  .icon-btn:hover    { transform:scale(1.12); }
  .stat-card         { transition:transform .22s, box-shadow .22s; }
  .stat-card:hover   { transform:translateY(-4px); }
  input:focus, select:focus, textarea:focus { outline:none; }
`;

/* ─── Bubble Canvas ──────────────────────────────────────────────────────────── */
function BubbleCanvas({ primary }) {
  const B = [
    { w:460,h:460,top:"-12%",left:"-10%",a:"drift1 24s ease-in-out infinite",o:.045 },
    { w:340,h:340,top:"58%",left:"72%",a:"drift2 30s ease-in-out infinite",o:.04 },
    { w:280,h:280,top:"28%",left:"52%",a:"drift3 36s ease-in-out infinite",o:.035 },
    { w:220,h:220,top:"68%",left:"8%",a:"drift4 28s ease-in-out infinite",o:.05 },
    { w:190,h:190,top:"4%",left:"68%",a:"drift5 32s ease-in-out infinite",o:.04 },
    { w:140,h:140,top:"44%",left:"88%",a:"drift1 40s ease-in-out infinite reverse",o:.035 },
  ];
  return (
    <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden" }}>
      {B.map((b,i) => (
        <div key={i} style={{
          position:"absolute",width:b.w,height:b.h,top:b.top,left:b.left,
          borderRadius:"50%",
          background:`radial-gradient(circle at 35% 30%, ${primary}28, ${primary}05)`,
          border:`1px solid ${primary}15`,opacity:b.o,animation:b.a,
          transition:"background .5s, border .5s",
        }}/>
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
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const nb = {
    display:"flex",alignItems:"center",gap:7,
    background:"rgba(255,255,255,0.13)",backdropFilter:"blur(10px)",
    border:"1.5px solid rgba(255,255,255,0.28)",borderRadius:10,
    padding:"8px 18px",color:T.navText,
    fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"0.84rem",letterSpacing:".03em",
  };

  return (
    <nav style={{
      position:"sticky",top:0,zIndex:50,background:T.navBg,
      padding:"13px 36px",display:"flex",alignItems:"center",
      justifyContent:"space-between",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",
      transition:"background .45s",
    }}>
      <div style={{ display:"flex",alignItems:"center",gap:14 }}>
        <span style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.3rem",fontStyle:"italic",color:T.navText,opacity:.92 }}>
          Baymaxify
        </span>
        <span style={{
          background:"rgba(255,255,255,0.18)",backdropFilter:"blur(8px)",
          border:"1px solid rgba(255,255,255,0.28)",
          borderRadius:99,padding:"3px 12px",
          fontSize:"0.72rem",fontWeight:700,letterSpacing:".1em",
          color:T.navText,textTransform:"uppercase",
        }}>Admin</span>
      </div>

      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <button className="nav-btn" style={nb} onClick={() => navigate()}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9.5L10 3l7 6.5"/><path d="M5 8.5v8h3.5v-4.5h3V16.5H15v-8"/></svg>
          Home
        </button>

        <div ref={dropRef} style={{ position:"relative" }}>
          <button className="nav-btn" style={nb} onClick={() => setOpen(p => !p)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
              <circle cx="8" cy="13" r="1.1" fill="currentColor" stroke="none"/>
              <circle cx="10" cy="9" r="1.1" fill="currentColor" stroke="none"/>
              <circle cx="14" cy="9" r="1.1" fill="currentColor" stroke="none"/>
              <circle cx="16" cy="13" r="1.1" fill="currentColor" stroke="none"/>
            </svg>
            Palette
            <svg width="8" height="8" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={open?"M1 5l4-4 4 4":"M1 1l4 4 4-4"}/></svg>
          </button>
          {open && (
            <div style={{
              position:"absolute",top:"calc(100% + 10px)",right:0,
              background:T.surface,border:`1px solid ${T.subtle}`,
              borderRadius:16,padding:8,width:218,
              boxShadow:"0 20px 56px rgba(0,0,0,.2)",
              animation:"dropDown .18s ease both",zIndex:100,
            }}>
              {Object.entries(THEMES).map(([key,th]) => (
                <div key={key} className="palette-row"
                  onClick={() => { setThemeKey(key); setOpen(false); }}
                  style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:key===themeKey?`${T.primary}14`:"transparent" }}>
                  <div style={{ width:22,height:22,borderRadius:"50%",background:th.swatch,flexShrink:0,boxShadow:key===themeKey?`0 0 0 3px ${th.swatch}44`:"none" }}/>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"0.88rem",fontWeight:key===themeKey?600:400,color:T.text }}>{th.label}</span>
                  {key===themeKey && <svg style={{ marginLeft:"auto" }} width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={T.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-6"/></svg>}
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="nav-btn" style={nb} onClick={() => navigate("/")}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 15l4-4-4-4"/><path d="M17 11H8"/><path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/></svg>
          Logout
        </button>
      </div>
    </nav>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────────── */
function Toast({ msg, type, T }) {
  const bg = type === "error" ? "#EF4444" : type === "warn" ? "#F59E0B" : T.primary;
  return (
    <div style={{
      position:"fixed",bottom:28,right:28,zIndex:500,
      background:bg,color:"#fff",borderRadius:14,
      padding:"12px 22px",fontFamily:"'DM Sans',sans-serif",
      fontSize:"0.85rem",fontWeight:500,
      boxShadow:`0 8px 28px ${bg}55`,
      animation:"toastSlide .3s ease both",
      display:"flex",alignItems:"center",gap:9,maxWidth:340,
    }}>
      {type === "error"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      }
      {msg}
    </div>
  );
}

/* ─── Confirm Dialog ─────────────────────────────────────────────────────────── */
function ConfirmDialog({ T, msg, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{
      position:"fixed",inset:0,zIndex:400,
      background:"rgba(0,0,0,.5)",backdropFilter:"blur(3px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      animation:"overlayIn .2s ease both",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.surface,borderRadius:22,
        border:`1px solid ${T.subtle}`,padding:"32px 32px 28px",
        width:"100%",maxWidth:380,
        boxShadow:"0 24px 60px rgba(0,0,0,.22)",
        animation:"modalIn .24s ease both",textAlign:"center",
      }}>
        <div style={{
          width:52,height:52,borderRadius:16,
          background:"rgba(239,68,68,0.12)",
          display:"flex",alignItems:"center",justifyContent:"center",
          margin:"0 auto 18px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </div>
        <h3 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.2rem",fontWeight:400,color:T.accent,marginBottom:8 }}>
          Confirm Delete
        </h3>
        <p style={{ color:T.muted,fontSize:"0.86rem",lineHeight:1.65,marginBottom:24 }}>{msg}</p>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1,background:T.card,color:T.text,border:`1.5px solid ${T.subtle}`,
            borderRadius:12,padding:"10px",fontFamily:"'DM Sans',sans-serif",
            fontWeight:500,fontSize:"0.85rem",cursor:"pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex:1,background:"#EF4444",color:"#fff",border:"none",
            borderRadius:12,padding:"10px",fontFamily:"'DM Sans',sans-serif",
            fontWeight:600,fontSize:"0.85rem",cursor:"pointer",
            boxShadow:"0 4px 14px rgba(239,68,68,.35)",
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Field component ────────────────────────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
      <label style={{
        fontFamily:"'DM Sans',sans-serif",fontSize:"0.74rem",fontWeight:600,
        letterSpacing:".1em",textTransform:"uppercase",opacity:.65,
      }}>
        {label}{required && <span style={{ color:"#EF4444",marginLeft:3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── Modal shell ────────────────────────────────────────────────────────────── */
function Modal({ T, title, subtitle, icon, onClose, children, footer }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:300,
      background:"rgba(0,0,0,.52)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      animation:"overlayIn .22s ease both",overflowY:"auto",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.surface,borderRadius:26,
        width:"100%",maxWidth:520,
        border:`1px solid ${T.subtle}`,
        boxShadow:"0 32px 80px rgba(0,0,0,.26)",
        animation:"modalIn .28s cubic-bezier(.25,.8,.25,1) both",
        overflow:"hidden",
        margin:"auto",
      }}>
        {/* Header */}
        <div style={{
          background:`linear-gradient(135deg,${T.primary}1A 0%,${T.primary}07 100%)`,
          borderBottom:`1px solid ${T.subtle}`,padding:"22px 28px 20px",
          display:"flex",alignItems:"center",justifyContent:"space-between",
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{
              width:42,height:42,borderRadius:12,background:T.primary,
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            }}>{icon}</div>
            <div>
              <p style={{ fontSize:".68rem",letterSpacing:".14em",textTransform:"uppercase",color:T.muted,marginBottom:2 }}>{subtitle}</p>
              <h3 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.15rem",fontWeight:400,color:T.accent }}>{title}</h3>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:T.card,border:`1px solid ${T.subtle}`,borderRadius:10,
            width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",
            justifyContent:"center",color:T.muted,fontSize:"0.9rem",flexShrink:0,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:"26px 28px",display:"flex",flexDirection:"column",gap:18 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ padding:"0 28px 26px",display:"flex",gap:10 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Mock data ──────────────────────────────────────────────────────────────── */
const INIT_DOCTORS = [
  { id:1, name:"Dr. Rahul Sharma",  specialty:"Sleep & Cognitive Therapy", status:"active",  location:"Kochi, Kerala",      rating:4.8, phone:"+91 98440 12345" },
  { id:2, name:"Dr. Kavya Iyer",    specialty:"Anxiety Specialist",         status:"active",  location:"Ernakulam, Kerala",  rating:4.6, phone:"+91 94470 67890" },
  { id:3, name:"Dr. Arjun Nair",    specialty:"Behavioral Therapy",         status:"active",  location:"Thrissur, Kerala",   rating:4.9, phone:"+91 93490 11223" },
  { id:4, name:"Dr. Lekha Krishnan",specialty:"Neurologist",                status:"inactive",location:"Kozhikode, Kerala",  rating:4.5, phone:"+91 91870 44556" },
  { id:5, name:"Dr. Priya Menon",   specialty:"Psychiatrist",               status:"active",  location:"Trivandrum, Kerala", rating:4.7, phone:"+91 96330 78901" },
];

const INIT_MEDICINES = [
  { id:1,  name:"Escitalopram 10mg",  category:"Psychiatry",   price:180, stock:250, status:"available",    isPrescribed:true  },
  { id:2,  name:"Clonazepam 0.5mg",   category:"Psychiatry",   price:95,  stock:180, status:"available",    isPrescribed:true  },
  { id:3,  name:"Melatonin 3mg",       category:"Sleep",        price:220, stock:320, status:"available",    isPrescribed:true  },
  { id:4,  name:"Sertraline 50mg",     category:"Psychiatry",   price:145, stock:0,   status:"out_of_stock", isPrescribed:false },
  { id:5,  name:"Paracetamol 500mg",   category:"Pain Relief",  price:28,  stock:1200,status:"available",    isPrescribed:false },
  { id:6,  name:"Ibuprofen 400mg",     category:"Pain Relief",  price:45,  stock:850, status:"available",    isPrescribed:false },
  { id:7,  name:"Vitamin D3 60K",      category:"Supplements",  price:165, stock:420, status:"available",    isPrescribed:false },
  { id:8,  name:"Omega-3 1000mg",      category:"Supplements",  price:480, stock:55,  status:"low_stock",    isPrescribed:false },
  { id:9,  name:"Azithromycin 500mg",  category:"Antibiotic",   price:195, stock:0,   status:"out_of_stock", isPrescribed:false },
  { id:10, name:"Cetirizine 10mg",     category:"Allergy",      price:55,  stock:640, status:"available",    isPrescribed:false },
];

const SPECIALTIES  = ["Psychiatrist","Sleep & Cognitive Therapy","Anxiety Specialist","Behavioral Therapy","Neurologist","General Physician","Stress Management"];
const MED_CATS     = ["Psychiatry","Sleep","Supplements","Pain Relief","Allergy","Antibiotic","Diabetes","Cardiology","Gastro"];
const DOC_STATUSES = ["active","inactive"];
const MED_STATUSES = ["available","low_stock","out_of_stock"];

/* ─── Status badge ───────────────────────────────────────────────────────────── */
function Badge({ status, T }) {
  const cfg = {
    active:        { bg:`${T.primary}18`, color:T.primary,  label:"Active"       },
    inactive:      { bg:`${T.muted}18`,   color:T.muted,    label:"Inactive"     },
    available:     { bg:`${T.primary}18`, color:T.primary,  label:"Available"    },
    low_stock:     { bg:"rgba(245,158,11,.14)", color:"#B45309", label:"Low Stock"},
    out_of_stock:  { bg:"rgba(239,68,68,.12)",  color:"#DC2626", label:"Out of Stock"},
  }[status] || { bg:T.card, color:T.muted, label:status };

  return (
    <span style={{
      background:cfg.bg,color:cfg.color,
      borderRadius:99,padding:"3px 10px",
      fontSize:"0.72rem",fontWeight:600,letterSpacing:".05em",
      whiteSpace:"nowrap",
    }}>{cfg.label}</span>
  );
}

/* ─── Section header ─────────────────────────────────────────────────────────── */
function SectionHeader({ T, icon, title, count, onAdd, addLabel, search, onSearch, filterVal, onFilter, filterOpts }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexWrap:"wrap",gap:12,marginBottom:16,
      }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{
            width:44,height:44,borderRadius:13,background:T.primary,
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          }}>{icon}</div>
          <div>
            <h2 style={{
              fontFamily:"'DM Serif Display',serif",fontSize:"1.35rem",
              fontWeight:400,color:T.accent,lineHeight:1,
            }}>{title}</h2>
            <p style={{ fontSize:"0.76rem",color:T.muted,marginTop:3 }}>{count} records</p>
          </div>
        </div>
        <button onClick={onAdd} style={{
          display:"flex",alignItems:"center",gap:7,
          background:T.primary,color:"#fff",border:"none",
          borderRadius:12,padding:"10px 18px",
          fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.84rem",
          cursor:"pointer",boxShadow:`0 5px 16px ${T.primary}40`,
          transition:"all .2s",
        }}
          onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {addLabel}
        </button>
      </div>

      {/* Search + filter bar */}
      <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
        <div style={{
          flex:"1 1 220px",display:"flex",alignItems:"center",gap:8,
          background:T.surface,border:`1.5px solid ${T.subtle}`,
          borderRadius:11,padding:"8px 14px",
          boxShadow:"0 2px 8px rgba(0,0,0,.04)",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e=>onSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            style={{ border:"none",background:"transparent",fontFamily:"'DM Sans',sans-serif",fontSize:"0.84rem",color:"inherit",width:"100%" }}/>
        </div>
        <select value={filterVal} onChange={e=>onFilter(e.target.value)} style={{
          background:T.surface,border:`1.5px solid ${T.subtle}`,
          borderRadius:11,padding:"8px 32px 8px 14px",
          fontFamily:"'DM Sans',sans-serif",fontSize:"0.84rem",color:"inherit",
          cursor:"pointer",
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",
          appearance:"none",
        }}>
          {filterOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MANAGE DOCTORS
═══════════════════════════════════════════════════════════════════════════════ */
function ManageDoctors({ T }) {
  const [doctors,    setDoctors]    = useState([]);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const [modal,      setModal]      = useState(null);
  const [editDoc,    setEditDoc]    = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast,      setToast]      = useState(null);

  const emptyForm = {
    name: "",
    specialty: SPECIALTIES[0],
    status: "active",
    location: "",
    rating: "",
    phone: "",
    email: "",
    password: "",
  };
  const [form, setForm] = useState(emptyForm);

  /* Load doctors from backend */
  useEffect(() => {
    adminGetDoctors()
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => setDoctors([]));
  }, []);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const openAdd  = () => { setForm(emptyForm); setModal("add"); };
  const openEdit = (doc) => {
    const login =
      doc.loginEmail ||
      (doc.userId && typeof doc.userId === "object" ? doc.userId.email : "") ||
      "";
    setForm({
      name: doc.name,
      specialty: doc.specialty,
      status: doc.status,
      location: doc.location || "",
      rating: String(doc.rating ?? ""),
      phone: doc.phone || "",
      email: login,
      password: "",
    });
    setEditDoc(doc);
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.location.trim()) { showToast("Name and location are required","error"); return; }
    if (modal === "add") {
      if (!form.email.trim()) { showToast("Login email is required for the doctor portal","error"); return; }
      if (!form.password || form.password.length < 6) {
        showToast("Password must be at least 6 characters","error");
        return;
      }
    }
    try {
      if (modal === "add") {
        const newDoc = await adminAddDoctor({
          name: form.name.trim(),
          specialty: form.specialty,
          status: form.status,
          location: form.location.trim(),
          phone: form.phone.trim(),
          rating: parseFloat(form.rating) || 4.5,
          email: form.email.trim(),
          password: form.password,
        });
        setDoctors(p => [...p, newDoc]);
        showToast(`Dr. ${form.name} added — they can sign in with that email.`);
      } else {
        const payload = {
          name: form.name.trim(),
          specialty: form.specialty,
          status: form.status,
          location: form.location.trim(),
          phone: form.phone.trim(),
          rating: parseFloat(form.rating) || editDoc.rating,
          email: form.email.trim(),
        };
        if (form.password.trim().length >= 6) payload.password = form.password.trim();
        const updated = await adminUpdateDoctor(editDoc._id, payload);
        setDoctors(p => p.map(d => d._id === editDoc._id ? updated : d));
        showToast(`${form.name} updated`);
      }
      setModal(null);
    } catch (err) { showToast(err.message,"error"); }
  };

  const handleDelete = async () => {
    try {
      await adminDeleteDoctor(confirmDel._id);
      setDoctors(p => p.filter(d => d._id !== confirmDel._id));
      showToast(`${confirmDel.name} removed`, "warn");
    } catch (err) { showToast(err.message,"error"); }
    setConfirmDel(null);
  };

  const toggleStatus = async (doc) => {
    const ns = doc.status === "active" ? "inactive" : "active";
    try {
      await adminToggleDoctorStatus(doc._id, ns);
      setDoctors(p => p.map(d => d._id===doc._id ? { ...d, status:ns } : d));
      showToast(`${doc.name} set to ${ns}`);
    } catch (err) { showToast(err.message,"error"); }
  };

  const filtered = doctors.filter(d => {
    const ms = d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all" || d.status===filter;
    return ms && mf;
  });

  const inputSty = {
    background:T.card,border:`1.5px solid ${T.subtle}`,borderRadius:10,
    padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:"0.86rem",
    color:T.text,width:"100%",
  };

  return (
    <div>
      <SectionHeader
        T={T}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        title="Manage Doctors"
        count={doctors.length}
        onAdd={openAdd}
        addLabel="Add Doctor"
        search={search}
        onSearch={setSearch}
        filterVal={filter}
        onFilter={setFilter}
        filterOpts={[
          { value:"all",label:"All Statuses" },
          { value:"active",label:"Active" },
          { value:"inactive",label:"Inactive" },
        ]}
      />

      {/* Table card */}
      <div style={{
        background:T.surface,borderRadius:20,border:`1px solid ${T.subtle}`,
        boxShadow:"0 6px 32px rgba(0,0,0,.05)",overflow:"hidden",
      }}>
        {/* Table header */}
        <div style={{
          display:"grid",gridTemplateColumns:"2fr 2fr 1.2fr 1fr 1.2fr 120px",
          padding:"12px 20px",
          background:`${T.primary}0C`,borderBottom:`1px solid ${T.subtle}`,
        }}>
          {["Doctor","Specialty","Location","Rating","Status","Actions"].map(h => (
            <span key={h} style={{
              fontSize:"0.68rem",fontWeight:700,letterSpacing:".1em",
              textTransform:"uppercase",color:T.muted,
            }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        <style>{`:root{--row-hover:${T.primary}07}`}</style>
        {filtered.length === 0 ? (
          <div style={{ padding:"40px 20px",textAlign:"center",color:T.muted,fontSize:"0.86rem" }}>
            No doctors match your search
          </div>
        ) : filtered.map((doc, i) => (
          <div key={doc._id || doc.id} className="row-item"
            style={{
              display:"grid",gridTemplateColumns:"2fr 2fr 1.2fr 1fr 1.2fr 120px",
              padding:"14px 20px",alignItems:"center",
              borderBottom: i<filtered.length-1 ? `1px solid ${T.subtle}` : "none",
              animation:`rowIn .25s ease ${i*0.04}s both`,
            }}>
            {/* Name */}
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{
                width:34,height:34,borderRadius:10,
                background:`${T.primary}20`,color:T.primary,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.76rem",flexShrink:0,
              }}>
                {(doc.name || "?").replace(/^Dr\.?\s*/i,"").split(/\s+/).filter(Boolean).slice(0,2).map(n=>n[0]).join("") || "?"}
              </div>
              <div>
                <p style={{ fontWeight:600,fontSize:"0.86rem",color:T.text }}>{doc.name}</p>
                <p style={{ fontSize:"0.73rem",color:T.muted,marginTop:1 }}>{doc.phone || "—"}</p>
                {(doc.loginEmail || (doc.userId && doc.userId.email)) && (
                  <p style={{ fontSize:"0.7rem",color:T.primary,marginTop:2,opacity:.9 }}>
                    {doc.loginEmail || doc.userId.email}
                  </p>
                )}
              </div>
            </div>
            {/* Specialty */}
            <span style={{ fontSize:"0.84rem",color:T.text }}>{doc.specialty}</span>
            {/* Location */}
            <span style={{ fontSize:"0.82rem",color:T.muted }}>{doc.location}</span>
            {/* Rating */}
            <div style={{ display:"flex",alignItems:"center",gap:4 }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill={T.primary} stroke={T.primary} strokeWidth="1"><path d="M10 1l2.7 5.6L19 7.6l-4.5 4.4 1.1 6.3L10 15.4l-5.6 2.9 1.1-6.3L1 7.6l6.3-.9L10 1z"/></svg>
              <span style={{ fontSize:"0.84rem",fontWeight:600,color:T.text }}>{doc.rating}</span>
            </div>
            {/* Status */}
            <div>
              <Badge status={doc.status} T={T}/>
            </div>
            {/* Actions */}
            <div style={{ display:"flex",gap:6,alignItems:"center" }}>
              {/* Toggle */}
              <button className="icon-btn" title={doc.status==="active"?"Deactivate":"Activate"} onClick={()=>toggleStatus(doc)} style={{
                background:`${doc.status==="active"?"rgba(239,68,68,.1)":"rgba(16,185,129,.1)"}`,
                border:"none",borderRadius:8,width:30,height:30,
                display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
                color:doc.status==="active"?"#DC2626":"#059669",
              }}>
                {doc.status==="active"
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                }
              </button>
              {/* Edit */}
              <button className="icon-btn" title="Edit" onClick={()=>openEdit(doc)} style={{
                background:`${T.primary}12`,border:"none",borderRadius:8,
                width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",color:T.primary,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              {/* Delete */}
              <button className="icon-btn" title="Delete" onClick={()=>setConfirmDel(doc)} style={{
                background:"rgba(239,68,68,.1)",border:"none",borderRadius:8,
                width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",color:"#DC2626",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <Modal
          T={T}
          title={modal==="add"?"Add New Doctor":"Edit Doctor"}
          subtitle={modal==="add"?"New Record":"Update Record"}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          onClose={()=>setModal(null)}
          footer={<>
            <button onClick={()=>setModal(null)} style={{
              flex:1,background:T.card,color:T.text,border:`1.5px solid ${T.subtle}`,
              borderRadius:12,padding:"11px",fontFamily:"'DM Sans',sans-serif",
              fontWeight:500,fontSize:"0.86rem",cursor:"pointer",
            }}>Cancel</button>
            <button onClick={handleSave} style={{
              flex:2,background:T.primary,color:"#fff",border:"none",
              borderRadius:12,padding:"11px",fontFamily:"'DM Sans',sans-serif",
              fontWeight:600,fontSize:"0.86rem",cursor:"pointer",
              boxShadow:`0 5px 16px ${T.primary}40`,
            }}>{modal==="add"?"Add Doctor":"Save Changes"}</button>
          </>}
        >
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Full Name" required>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  placeholder="Dr. Full Name" style={inputSty}/>
              </Field>
            </div>
            <Field label="Specialty" required>
              <select value={form.specialty} onChange={e=>setForm(p=>({...p,specialty:e.target.value}))} style={{ ...inputSty,cursor:"pointer" }}>
                {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{ ...inputSty,cursor:"pointer" }}>
                {DOC_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Location" required>
              <input value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))}
                placeholder="City, State" style={inputSty}/>
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}
                placeholder="+91 XXXXX XXXXX" style={inputSty}/>
            </Field>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Login email (doctor portal)" required={modal==="add"}>
                <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
                  placeholder="doctor@clinic.com" style={inputSty} autoComplete="off"/>
              </Field>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label={modal==="add" ? "Password (min 6 characters)" : "New password (leave blank to keep)"} required={modal==="add"}>
                <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                  placeholder={modal==="add" ? "••••••••" : "Only if changing password"} style={inputSty} autoComplete="new-password"/>
              </Field>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Initial Rating">
                <input type="number" min="1" max="5" step="0.1" value={form.rating}
                  onChange={e=>setForm(p=>({...p,rating:e.target.value}))}
                  placeholder="4.5" style={inputSty}/>
              </Field>
            </div>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog T={T}
          msg={`Are you sure you want to remove ${confirmDel.name}? Their login account will be removed too.`}
          onConfirm={handleDelete}
          onCancel={()=>setConfirmDel(null)}/>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} T={T}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MANAGE MEDICINES
═══════════════════════════════════════════════════════════════════════════════ */
function ManageMedicines({ T }) {
  const [medicines,  setMedicines]  = useState([]);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const [modal,      setModal]      = useState(null);
  const [editMed,    setEditMed]    = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast,      setToast]      = useState(null);

  const emptyForm = {
    name: "",
    category: MED_CATS[0],
    price: "",
    stock: "",
    status: "available",
    isPrescribed: false,
    color: "#6366F1",
    shape: "tablet",
  };
  const [form, setForm] = useState(emptyForm);

  /* Load medicines from backend */
  useEffect(() => {
    adminGetMedicines()
      .then(data => setMedicines(Array.isArray(data) ? data : []))
      .catch(() => setMedicines([]));
  }, []);

  const showToast = (msg, type="success") => { setToast({ msg,type }); setTimeout(()=>setToast(null),2800); };

  const openAdd  = () => { setForm(emptyForm); setModal("add"); };
  const openEdit = (m) => {
    setForm({
      name: m.name,
      category: m.category,
      price: String(m.price),
      stock: String(m.stock),
      status: m.status,
      isPrescribed: m.isPrescribed,
      color: m.color || "#6366F1",
      shape: m.shape || "tablet",
    });
    setEditMed(m);
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast("Medicine name is required","error"); return; }
    try {
      if (modal==="add") {
        const nm = await adminAddMedicine({
          ...form,
          price: parseFloat(form.price) || 0,
          stock: parseInt(form.stock, 10) || 0,
          color: form.color || "#6366F1",
          shape: form.shape || "tablet",
        });
        setMedicines(p => [...p, nm]);
        showToast(`${form.name} added`);
      } else {
        const updated = await adminUpdateMedicine(editMed._id, {
          ...form,
          price: parseFloat(form.price) || editMed.price,
          stock: parseInt(form.stock, 10) || editMed.stock,
          color: form.color || "#6366F1",
          shape: form.shape || "tablet",
        });
        setMedicines(p => p.map(m => m._id===editMed._id ? updated : m));
        showToast(`${form.name} updated`);
      }
      setModal(null);
    } catch (err) { showToast(err.message,"error"); }
  };

  const handleDelete = async () => {
    try {
      await adminDeleteMedicine(confirmDel._id);
      setMedicines(p => p.filter(m => m._id !== confirmDel._id));
      showToast(`${confirmDel.name} removed`,"warn");
    } catch (err) { showToast(err.message,"error"); }
    setConfirmDel(null);
  };

  const filtered = medicines.filter(m => {
    const ms = m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all" || m.status===filter;
    return ms && mf;
  });
  // Summary stats
  const totalMeds     = medicines.length;
  const available     = medicines.filter(m=>m.status==="available").length;
  const outOfStock    = medicines.filter(m=>m.status==="out_of_stock").length;
  const lowStock      = medicines.filter(m=>m.status==="low_stock").length;
  const prescribedCnt = medicines.filter(m=>m.isPrescribed).length;

  const inputSty = {
    background:T.card,border:`1.5px solid ${T.subtle}`,borderRadius:10,
    padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:"0.86rem",
    color:T.text,width:"100%",
  };

  return (
    <div>
      {/* Stats row */}
      <div style={{
        display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",
        gap:14,marginBottom:24,
      }}>
        {[
          { label:"Total",       val:totalMeds,  color:T.primary },
          { label:"Available",   val:available,  color:"#10B981" },
          { label:"Low Stock",   val:lowStock,   color:"#F59E0B" },
          { label:"Out of Stock",val:outOfStock, color:"#EF4444" },
          { label:"Prescribed",  val:prescribedCnt, color:"#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{
            background:T.surface,border:`1px solid ${T.subtle}`,
            borderRadius:16,padding:"16px 18px",
            boxShadow:"0 4px 16px rgba(0,0,0,.04)",
          }}>
            <p style={{ fontSize:"1.6rem",fontWeight:700,color:s.color,fontFamily:"'DM Serif Display',serif" }}>{s.val}</p>
            <p style={{ fontSize:"0.74rem",color:T.muted,marginTop:3,fontWeight:500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <SectionHeader
        T={T}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/><circle cx="18" cy="18" r="4"/><path d="M18 16v2l1 1"/></svg>}
        title="Manage Medicines"
        count={medicines.length}
        onAdd={openAdd}
        addLabel="Add Medicine"
        search={search}
        onSearch={setSearch}
        filterVal={filter}
        onFilter={setFilter}
        filterOpts={[
          { value:"all",label:"All Statuses" },
          { value:"available",label:"Available" },
          { value:"low_stock",label:"Low Stock" },
          { value:"out_of_stock",label:"Out of Stock" },
        ]}
      />

      {/* Table */}
      <div style={{
        background:T.surface,borderRadius:20,border:`1px solid ${T.subtle}`,
        boxShadow:"0 6px 32px rgba(0,0,0,.05)",overflow:"hidden",
      }}>
        <div style={{
          display:"grid",gridTemplateColumns:"2.2fr 1.4fr 0.8fr 0.8fr 1.2fr 0.9fr 110px",
          padding:"12px 20px",
          background:`${T.primary}0C`,borderBottom:`1px solid ${T.subtle}`,
        }}>
          {["Medicine","Category","Price","Stock","Status","Rx","Actions"].map(h => (
            <span key={h} style={{ fontSize:"0.68rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding:"40px 20px",textAlign:"center",color:T.muted,fontSize:"0.86rem" }}>
            No medicines match your search
          </div>
        ) : filtered.map((med, i) => (
          <div key={med.id} className="row-item"
            style={{
              display:"grid",gridTemplateColumns:"2.2fr 1.4fr 0.8fr 0.8fr 1.2fr 0.9fr 110px",
              padding:"13px 20px",alignItems:"center",
              borderBottom: i<filtered.length-1 ? `1px solid ${T.subtle}` : "none",
              animation:`rowIn .25s ease ${i*0.035}s both`,
            }}>
            {/* Name */}
            <div>
              <p style={{ fontWeight:600,fontSize:"0.86rem",color:T.text }}>{med.name}</p>
            </div>
            {/* Category */}
            <span style={{
              display:"inline-block",background:T.card,color:T.muted,
              borderRadius:99,padding:"3px 10px",fontSize:"0.73rem",fontWeight:500,
            }}>{med.category}</span>
            {/* Price */}
            <span style={{ fontSize:"0.86rem",fontWeight:600,color:T.accent }}>₹{med.price}</span>
            {/* Stock */}
            <span style={{
              fontSize:"0.84rem",fontWeight:600,
              color: med.stock===0 ? "#EF4444" : med.stock<100 ? "#F59E0B" : T.text,
            }}>{med.stock}</span>
            {/* Status */}
            <Badge status={med.status} T={T}/>
            {/* Rx */}
            <div>
              {med.isPrescribed
                ? <span style={{ background:"rgba(139,92,246,.14)",color:"#7C3AED",borderRadius:99,padding:"3px 10px",fontSize:"0.72rem",fontWeight:700 }}>Rx</span>
                : <span style={{ background:T.card,color:T.muted,borderRadius:99,padding:"3px 10px",fontSize:"0.72rem" }}>OTC</span>
              }
            </div>
            {/* Actions */}
            <div style={{ display:"flex",gap:6 }}>
              <button className="icon-btn" title="Edit" onClick={()=>openEdit(med)} style={{
                background:`${T.primary}12`,border:"none",borderRadius:8,
                width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",color:T.primary,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="icon-btn" title="Delete" onClick={()=>setConfirmDel(med)} style={{
                background:"rgba(239,68,68,.1)",border:"none",borderRadius:8,
                width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",color:"#DC2626",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <Modal
          T={T}
          title={modal==="add"?"Add New Medicine":"Edit Medicine"}
          subtitle={modal==="add"?"New Record":"Update Record"}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>}
          onClose={()=>setModal(null)}
          footer={<>
            <button onClick={()=>setModal(null)} style={{
              flex:1,background:T.card,color:T.text,border:`1.5px solid ${T.subtle}`,
              borderRadius:12,padding:"11px",fontFamily:"'DM Sans',sans-serif",
              fontWeight:500,fontSize:"0.86rem",cursor:"pointer",
            }}>Cancel</button>
            <button onClick={handleSave} style={{
              flex:2,background:T.primary,color:"#fff",border:"none",
              borderRadius:12,padding:"11px",fontFamily:"'DM Sans',sans-serif",
              fontWeight:600,fontSize:"0.86rem",cursor:"pointer",
              boxShadow:`0 5px 16px ${T.primary}40`,
            }}>{modal==="add"?"Add Medicine":"Save Changes"}</button>
          </>}
        >
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Medicine Name" required>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  placeholder="Medicine name + dosage" style={inputSty}/>
              </Field>
            </div>
            <Field label="Category" required>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{ ...inputSty,cursor:"pointer" }}>
                {MED_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{ ...inputSty,cursor:"pointer" }}>
                {MED_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Price (₹)" required>
              <input type="number" min="0" value={form.price}
                onChange={e=>setForm(p=>({...p,price:e.target.value}))}
                placeholder="0.00" style={inputSty}/>
            </Field>
            <Field label="Stock Qty">
              <input type="number" min="0" value={form.stock}
                onChange={e=>setForm(p=>({...p,stock:e.target.value}))}
                placeholder="0" style={inputSty}/>
            </Field>
            <Field label="Card color (hex)">
              <input value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))}
                placeholder="#6366F1" style={inputSty}/>
            </Field>
            <Field label="Illustration shape">
              <select value={form.shape} onChange={e=>setForm(p=>({...p,shape:e.target.value}))} style={{ ...inputSty,cursor:"pointer" }}>
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="softgel">Softgel</option>
              </select>
            </Field>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{
                display:"flex",alignItems:"center",gap:10,cursor:"pointer",
                background:T.card,border:`1.5px solid ${T.subtle}`,
                borderRadius:12,padding:"12px 16px",
              }}>
                <div style={{
                  width:22,height:22,borderRadius:6,
                  background: form.isPrescribed ? T.primary : "transparent",
                  border:`2px solid ${form.isPrescribed ? T.primary : T.muted}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  flexShrink:0,transition:"all .15s",
                }}
                  onClick={()=>setForm(p=>({...p,isPrescribed:!p.isPrescribed}))}>
                  {form.isPrescribed && <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-6"/></svg>}
                </div>
                <div>
                  <p style={{ fontSize:"0.86rem",fontWeight:600,color:T.text }}>Prescription Required</p>
                  <p style={{ fontSize:"0.74rem",color:T.muted,marginTop:1 }}>Mark if this medicine needs a doctor's prescription (Rx)</p>
                </div>
              </label>
            </div>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog T={T}
          msg={`Remove "${confirmDel.name}" from the medicine catalogue? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={()=>setConfirmDel(null)}/>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} T={T}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ADMIN PAGE
═══════════════════════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState("doctors");
  const T = THEMES[themeKey];

  const TABS = [
    {
      key: "doctors",
      label: "Manage Doctors",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      key: "medicines",
      label: "Manage Medicines",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <BubbleCanvas primary={T.primary}/>

      <div style={{
        minHeight:"100vh",background:T.gradient,color:T.text,
        transition:"background .45s",position:"relative",zIndex:1,
      }}>
        <Navbar T={T} themeKey={themeKey} setThemeKey={setThemeKey}/>

        <main style={{ padding:"44px 28px 96px",position:"relative",zIndex:1 }}>
          <div style={{ maxWidth:1200,margin:"0 auto" }}>

            {/* ── Page heading ── */}
            <div style={{ marginBottom:36,animation:"fadeSlideUp .5s ease both" }}>
              <p style={{
                fontWeight:500,fontSize:"0.7rem",letterSpacing:"0.2em",
                textTransform:"uppercase",color:T.muted,marginBottom:12,
              }}>Control Panel</p>
              <h1 style={{
                fontFamily:"'DM Serif Display',serif",
                fontSize:"clamp(1.8rem,4vw,2.6rem)",
                fontWeight:400,color:T.accent,lineHeight:1.2,
              }}>Admin Dashboard</h1>
              <div style={{ width:48,height:3,borderRadius:99,background:T.primary,opacity:.45,marginTop:14 }}/>
            </div>

            {/* ── Tab bar ── */}
            <div style={{
              display:"flex",gap:6,marginBottom:32,
              background:T.surface,borderRadius:16,padding:6,
              border:`1px solid ${T.subtle}`,
              boxShadow:"0 4px 16px rgba(0,0,0,.05)",
              width:"fit-content",
              animation:"fadeSlideUp .55s ease .06s both",
            }}>
              {TABS.map(tab => {
                const active = activeTab === tab.key;
                return (
                  <button key={tab.key} className="tab-btn"
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display:"flex",alignItems:"center",gap:8,
                      background: active ? T.primary : "transparent",
                      color:      active ? "#fff"    : T.muted,
                      border:"none",borderRadius:11,
                      padding:"10px 20px",
                      fontFamily:"'DM Sans',sans-serif",
                      fontWeight: active ? 600 : 500,
                      fontSize:"0.87rem",cursor:"pointer",
                      boxShadow: active ? `0 4px 16px ${T.primary}40` : "none",
                      transition:"all .2s",
                      opacity: active ? 1 : .75,
                      whiteSpace:"nowrap",
                    }}>
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── Tab content ── */}
            <div style={{ animation:"fadeSlideUp .6s ease .1s both" }}>
              {activeTab === "doctors"   && <ManageDoctors  T={T}/>}
              {activeTab === "medicines" && <ManageMedicines T={T}/>}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}