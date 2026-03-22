import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";
import { getDoctors, bookAppointment, getUser } from "../api";
/* ─── Theme Palettes ─────────────────────────────────────────────────────────── */
const THEMES = {
  blue: {
    bg: "#F0F6FF", surface: "#FFFFFF", card: "#EBF3FF",
    primary: "#2255A4", accent: "#1A3F7A", muted: "#6B8BBF",
    text: "#0F2040", subtle: "#D8E8FF",
    gradient: "linear-gradient(160deg, #F7FAFF 0%, #E8F0FC 50%, #F0F6FF 100%)",
    navBg: "#2255A4", navText: "#FFFFFF", swatch: "#2255A4", label: "Soft Blue",
    emergency: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1e3a6e" },
  },
  green: {
    bg: "#F2FAF5", surface: "#FFFFFF", card: "#E3F5EB",
    primary: "#1E7A4A", accent: "#155235", muted: "#5C9B74",
    text: "#0D2D1C", subtle: "#C8EDD8",
    gradient: "linear-gradient(160deg, #F7FDF9 0%, #E8F7EE 50%, #F2FAF5 100%)",
    navBg: "#1E7A4A", navText: "#FFFFFF", swatch: "#1E7A4A", label: "Sage Green",
    emergency: { bg: "#F0FFF4", border: "#9AE6B4", text: "#1c4532" },
  },
  warm: {
    bg: "#FFF8F0", surface: "#FFFFFF", card: "#FFF0DC",
    primary: "#B85C1A", accent: "#7C3A0E", muted: "#C4875A",
    text: "#3D1F08", subtle: "#FFD9B0",
    gradient: "linear-gradient(160deg, #FFFCF8 0%, #FFF3E0 50%, #FFF8F0 100%)",
    navBg: "#B85C1A", navText: "#FFFFFF", swatch: "#B85C1A", label: "Warm Beige",
    emergency: { bg: "#FFF7ED", border: "#FED7AA", text: "#7c2d12" },
  },
  dark: {
    bg: "#111827", surface: "#1F2937", card: "#273447",
    primary: "#93C5FD", accent: "#BFDBFE", muted: "#6B8EBF",
    text: "#E2EAF4", subtle: "#2D3F55",
    gradient: "linear-gradient(160deg, #0F172A 0%, #111827 50%, #0F172A 100%)",
    navBg: "#0F172A", navText: "#E2EAF4", swatch: "#93C5FD", label: "Dark Comfort",
    emergency: { bg: "#1e2d40", border: "#2D3F55", text: "#93C5FD" },
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

  @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dropDown     { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes modalIn      { from{opacity:0;transform:scale(.95) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes stepIn       { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
  @keyframes successPop   { 0%{transform:scale(0.6)} 70%{transform:scale(1.1)} 100%{transform:scale(1)} }
  @keyframes checkDraw    { from{stroke-dashoffset:50} to{stroke-dashoffset:0} }
  @keyframes overlayIn    { from{opacity:0} to{opacity:1} }

  .nav-btn           { transition:background .2s ease; cursor:pointer; }
  .nav-btn:hover     { background:rgba(255,255,255,0.22) !important; }
  .palette-row       { transition:background .15s ease; cursor:pointer; border-radius:10px; }
  .palette-row:hover { background:rgba(128,128,128,.08) !important; }
  .doc-card          { transition:all .25s ease; }
  .doc-card:hover    { transform:translateY(-5px); }
  .cta-btn           { transition:all .2s ease; cursor:pointer; }
  .cta-btn:hover     { opacity:.88; transform:translateY(-1px); }
  .consult-opt       { transition:all .22s ease; cursor:pointer; }
  .consult-opt:hover { transform:translateY(-3px); }
  .cal-day           { transition:all .16s ease; cursor:pointer; border-radius:10px; }
  .cal-day:hover     { background:var(--cal-hover) !important; }
  .time-slot         { transition:all .16s ease; cursor:pointer; }
  .time-slot:hover   { transform:scale(1.04); }
  select:focus, input:focus { outline:none; }
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
          background:`radial-gradient(circle at 35% 30%, ${b.primary||"#2255A4"}2A, ${b.primary||"#2255A4"}06)`,
          border:`1px solid ${b.primary||"#2255A4"}18`,
          opacity:b.op,animation:b.anim,transition:"background .5s ease",
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
      <span style={{ fontFamily:"'DM Serif Display', serif",fontSize:"1.3rem",fontStyle:"italic",color:T.navText,opacity:.92 }}>
        Baymaxify
      </span>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <button className="nav-btn" style={navBtn} onClick={() => navigate("/home")}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L10 3l7 6.5"/><path d="M5 8.5v8h3.5v-4.5h3V16.5H15v-8"/>
          </svg>
          Home
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
            <svg width="9" height="9" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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

/* ─── Map Modal ──────────────────────────────────────────────────────────────── */
function MapModal({ T, doctor, onClose }) {
  if (!doctor) return null;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(doctor.location)}&output=embed`;
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.5)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:24,
      animation:"overlayIn .2s ease both",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:T.surface,borderRadius:24,width:"100%",maxWidth:720,
        boxShadow:"0 24px 64px rgba(0,0,0,.24)",border:`1px solid ${T.subtle}`,
        overflow:"hidden",animation:"modalIn .25s ease both",
      }}>
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"20px 28px",borderBottom:`1px solid ${T.subtle}`,
        }}>
          <div>
            <p style={{ fontSize:".7rem",fontWeight:500,letterSpacing:".14em",textTransform:"uppercase",color:T.muted,marginBottom:4 }}>Clinic Location</p>
            <h3 style={{ fontFamily:"'DM Serif Display', serif",fontWeight:400,fontSize:"1.2rem",color:T.accent }}>{doctor.name}</h3>
          </div>
          <button onClick={onClose} style={{
            background:T.card,border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontSize:"1rem",
          }}>✕</button>
        </div>
        <iframe src={mapSrc} width="100%" height="400" style={{ border:0,display:"block" }} loading="lazy" allowFullScreen title={`${doctor.name} map`}/>
      </div>
    </div>
  );
}

/* ─── Mini Calendar ──────────────────────────────────────────────────────────── */
function MiniCalendar({ T, selectedDate, onSelect }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); }
    else setViewMonth(m => m-1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); }
    else setViewMonth(m => m+1);
  };

  const isPast = (d) => {
    const dt = new Date(viewYear, viewMonth, d);
    dt.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return dt < t;
  };

  const isSelected = (d) => {
    if (!selectedDate) return false;
    const s = new Date(selectedDate);
    return s.getDate()===d && s.getMonth()===viewMonth && s.getFullYear()===viewYear;
  };

  const isToday = (d) => {
    return d===today.getDate() && viewMonth===today.getMonth() && viewYear===today.getFullYear();
  };

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  return (
    <div style={{ animation:"stepIn .28s ease both" }}>
      {/* Month nav */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
        <button onClick={prevMonth} style={{
          background:T.card,border:`1px solid ${T.subtle}`,borderRadius:9,
          width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.text,
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 1L3 5l4 4"/>
          </svg>
        </button>
        <span style={{ fontFamily:"'DM Serif Display', serif",fontSize:"1rem",color:T.accent,fontWeight:400 }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={{
          background:T.card,border:`1px solid ${T.subtle}`,borderRadius:9,
          width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.text,
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 1l4 4-4 4"/>
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6 }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign:"center",fontSize:"0.68rem",fontWeight:600,
            color:T.muted,letterSpacing:".06em",padding:"4px 0",
          }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <style>{`:root { --cal-hover: ${T.primary}18; }`}</style>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4 }}>
        {cells.map((d,i) => {
          if (!d) return <div key={`e${i}`}/>;
          const past = isPast(d);
          const sel  = isSelected(d);
          const tod  = isToday(d);
          return (
            <div key={d} className={past ? "" : "cal-day"}
              onClick={() => {
                if (past) return;
                onSelect(new Date(viewYear, viewMonth, d));
              }}
              style={{
                textAlign:"center",padding:"7px 4px",
                fontSize:"0.82rem",fontWeight: sel||tod ? 700 : 400,
                borderRadius:10,
                background: sel ? T.primary : tod ? `${T.primary}22` : "transparent",
                color:       sel ? "#fff"    : past ? T.muted : T.text,
                opacity:     past ? .35 : 1,
                cursor:      past ? "not-allowed" : "pointer",
                border:      tod && !sel ? `1.5px solid ${T.primary}` : "1.5px solid transparent",
              }}>{d}</div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Time Slots ─────────────────────────────────────────────────────────────── */
const TIME_SLOTS = [
  "09:00 AM","09:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","02:00 PM","02:30 PM",
  "03:00 PM","03:30 PM","04:00 PM","05:00 PM",
];

function TimePicker({ T, selectedTime, onSelect }) {
  return (
    <div style={{ animation:"stepIn .28s ease both" }}>
      <p style={{
        fontSize:"0.72rem",fontWeight:600,letterSpacing:".12em",
        textTransform:"uppercase",color:T.muted,marginBottom:14,
      }}>Available Slots</p>
      <div style={{
        display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,
      }}>
        {TIME_SLOTS.map(t => {
          const sel = selectedTime === t;
          return (
            <button key={t} className="time-slot"
              onClick={() => onSelect(t)}
              style={{
                background: sel ? T.primary : T.card,
                color:      sel ? "#fff"    : T.text,
                border:`1.5px solid ${sel ? T.primary : T.subtle}`,
                borderRadius:10,padding:"9px 6px",
                fontFamily:"'DM Sans', sans-serif",
                fontWeight: sel ? 600 : 400,
                fontSize:"0.78rem",cursor:"pointer",
                boxShadow: sel ? `0 4px 14px ${T.primary}38` : "none",
              }}>{t}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step indicator ─────────────────────────────────────────────────────────── */
function StepDots({ step, total, T }) {
  return (
    <div style={{ display:"flex",gap:6,justifyContent:"center" }}>
      {Array.from({ length:total }).map((_,i) => (
        <div key={i} style={{
          width: i===step ? 22 : 7, height:7,
          borderRadius:99,
          background: i===step ? T.primary : i<step ? `${T.primary}50` : T.subtle,
          transition:"all .25s ease",
        }}/>
      ))}
    </div>
  );
}

/* ─── Booking Modal ──────────────────────────────────────────────────────────── */
function BookingModal({ T, doctor, onClose }) {
  // step 0 = choose type, 1 = calendar, 2 = time, 3 = success
  const [step,         setStep]         = useState(0);
  const [consultType,  setConsultType]  = useState(null);   // "online" | "offline"
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);

  // Pull name from logged-in user
  const USER_NAME = getUser()?.name || "User";

  const fmtDate = (d) => {
    if (!d) return "";
    return d.toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  };

  const handleRequest = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);

    try {
      await bookAppointment({
        doctorName: doctor.name,
        specialty:  doctor.specialty,
        type:       consultType,
        date:       selectedDate.toISOString().split("T")[0],
        time:       selectedTime,
      });
      setStep(3);
    } catch (err) {
      console.error("Booking failed:", err.message);
      alert("Booking failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedToTime = !!selectedDate;
  const canSubmit        = !!selectedDate && !!selectedTime;

  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:300,
      background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:20, animation:"overlayIn .22s ease both",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:T.surface,borderRadius:28,
        width:"100%",maxWidth:480,
        boxShadow:"0 32px 80px rgba(0,0,0,.28)",
        border:`1px solid ${T.subtle}`,
        overflow:"hidden",
        animation:"modalIn .28s cubic-bezier(.25,.8,.25,1) both",
      }}>

        {/* ── Modal header ── */}
        {step < 3 && (
          <div style={{
            background:`linear-gradient(135deg, ${T.primary}18 0%, ${T.primary}06 100%)`,
            borderBottom:`1px solid ${T.subtle}`,
            padding:"22px 28px 18px",
          }}>
            <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                {/* Doctor avatar */}
                <div style={{
                  width:42,height:42,borderRadius:12,background:T.primary,
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize:".68rem",letterSpacing:".12em",textTransform:"uppercase",color:T.muted,marginBottom:2 }}>
                    {step === 0 ? "Book Appointment" : step === 1 ? "Choose Date" : "Choose Time"}
                  </p>
                  <h3 style={{
                    fontFamily:"'DM Serif Display', serif",fontSize:"1.15rem",
                    fontWeight:400,color:T.accent,lineHeight:1.2,
                  }}>{doctor.name}</h3>
                  <p style={{ fontSize:".75rem",color:T.muted,marginTop:1 }}>{doctor.specialty}</p>
                </div>
              </div>
              <button onClick={onClose} style={{
                background:T.card,border:`1px solid ${T.subtle}`,borderRadius:10,
                width:34,height:34,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:T.muted,fontSize:"0.9rem",flexShrink:0,
              }}>✕</button>
            </div>

            {/* Step dots */}
            {step > 0 && (
              <div style={{ marginTop:16 }}>
                <StepDots step={step-1} total={2} T={T}/>
              </div>
            )}
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ padding: step === 3 ? "0" : "28px" }}>

          {/* ── Step 0: Choose consultation type ── */}
          {step === 0 && (
            <div style={{ animation:"stepIn .28s ease both" }}>
              <p style={{
                fontFamily:"'DM Serif Display', serif",
                fontSize:"1.1rem",color:T.accent,marginBottom:6,
              }}>How would you like to consult?</p>
              <p style={{ fontSize:".84rem",color:T.muted,lineHeight:1.6,marginBottom:24 }}>
                Choose the type of appointment that works best for you.
              </p>

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                {/* Online */}
                <button className="consult-opt"
                  onClick={() => { setConsultType("online"); onClose(); /* TODO: open video link */ }}
                  style={{
                    background:`linear-gradient(145deg, ${T.primary}18, ${T.primary}08)`,
                    border:`2px solid ${T.primary}40`,
                    borderRadius:18,padding:"24px 16px",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:12,
                    cursor:"pointer",
                  }}>
                  <div style={{
                    width:52,height:52,borderRadius:15,background:T.primary,
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <p style={{
                      fontFamily:"'DM Serif Display', serif",fontSize:"1rem",
                      color:T.accent,fontWeight:400,marginBottom:4,
                    }}>Online</p>
                    <p style={{ fontSize:".75rem",color:T.muted,lineHeight:1.5 }}>
                      Video call from home
                    </p>
                  </div>
                  <span style={{
                    background:T.primary,color:"#fff",
                    borderRadius:99,padding:"3px 12px",
                    fontSize:".68rem",fontWeight:600,letterSpacing:".06em",
                  }}>INSTANT</span>
                </button>

                {/* Offline */}
                <button className="consult-opt"
                  onClick={() => { setConsultType("offline"); setStep(1); }}
                  style={{
                    background:T.card,
                    border:`2px solid ${T.subtle}`,
                    borderRadius:18,padding:"24px 16px",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:12,
                    cursor:"pointer",
                  }}>
                  <div style={{
                    width:52,height:52,borderRadius:15,
                    background:`${T.primary}22`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <p style={{
                      fontFamily:"'DM Serif Display', serif",fontSize:"1rem",
                      color:T.accent,fontWeight:400,marginBottom:4,
                    }}>In-Clinic</p>
                    <p style={{ fontSize:".75rem",color:T.muted,lineHeight:1.5 }}>
                      Visit the clinic
                    </p>
                  </div>
                  <span style={{
                    background:`${T.primary}18`,color:T.primary,
                    borderRadius:99,padding:"3px 12px",
                    fontSize:".68rem",fontWeight:600,letterSpacing:".06em",
                  }}>SCHEDULE</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Calendar ── */}
          {step === 1 && (
            <div style={{ animation:"stepIn .28s ease both" }}>
              <MiniCalendar T={T} selectedDate={selectedDate} onSelect={setSelectedDate}/>

              {selectedDate && (
                <div style={{
                  marginTop:16,background:`${T.primary}0E`,
                  border:`1px solid ${T.primary}30`,
                  borderRadius:12,padding:"10px 14px",
                  fontSize:".8rem",color:T.primary,fontWeight:500,
                  display:"flex",alignItems:"center",gap:8,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {fmtDate(selectedDate)}
                </div>
              )}

              <div style={{ display:"flex",gap:10,marginTop:20 }}>
                <button onClick={() => setStep(0)} style={{
                  flex:1,background:T.card,color:T.text,
                  border:`1.5px solid ${T.subtle}`,borderRadius:12,
                  padding:"11px",fontFamily:"'DM Sans', sans-serif",
                  fontWeight:500,fontSize:".85rem",cursor:"pointer",
                }}>Back</button>
                <button onClick={() => canProceedToTime && setStep(2)}
                  disabled={!canProceedToTime}
                  style={{
                    flex:2,background: canProceedToTime ? T.primary : T.subtle,
                    color: canProceedToTime ? "#fff" : T.muted,
                    border:"none",borderRadius:12,
                    padding:"11px",fontFamily:"'DM Sans', sans-serif",
                    fontWeight:600,fontSize:".85rem",
                    cursor: canProceedToTime ? "pointer" : "not-allowed",
                    boxShadow: canProceedToTime ? `0 6px 20px ${T.primary}38` : "none",
                    transition:"all .2s ease",
                  }}>
                  Choose Time →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Time picker + confirm ── */}
          {step === 2 && (
            <div style={{ animation:"stepIn .28s ease both" }}>
              {/* Selected date recap */}
              <div style={{
                display:"flex",alignItems:"center",gap:8,
                background:T.card,border:`1px solid ${T.subtle}`,
                borderRadius:12,padding:"10px 14px",marginBottom:20,
                fontSize:".8rem",color:T.muted,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span style={{ color:T.text,fontWeight:500 }}>{fmtDate(selectedDate)}</span>
                <button onClick={() => setStep(1)} style={{
                  marginLeft:"auto",background:"none",border:"none",
                  color:T.primary,fontSize:".75rem",fontWeight:600,cursor:"pointer",
                }}>Change</button>
              </div>

              <TimePicker T={T} selectedTime={selectedTime} onSelect={setSelectedTime}/>

              {/* Patient name recap */}
              <div style={{
                marginTop:20,background:T.card,
                border:`1px solid ${T.subtle}`,borderRadius:12,
                padding:"12px 16px",
                display:"flex",alignItems:"center",gap:10,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="7" r="4"/><path d="M3 21v-2a7 7 0 0 1 14 0v2"/>
                </svg>
                <div>
                  <p style={{ fontSize:".68rem",color:T.muted,letterSpacing:".08em",textTransform:"uppercase",fontWeight:500 }}>Patient</p>
                  <p style={{ fontSize:".88rem",fontWeight:600,color:T.text }}>{USER_NAME}</p>
                </div>
                {/* TODO: Allow name edit if multi-patient account */}
              </div>

              <div style={{ display:"flex",gap:10,marginTop:20 }}>
                <button onClick={() => setStep(1)} style={{
                  flex:1,background:T.card,color:T.text,
                  border:`1.5px solid ${T.subtle}`,borderRadius:12,
                  padding:"11px",fontFamily:"'DM Sans', sans-serif",
                  fontWeight:500,fontSize:".85rem",cursor:"pointer",
                }}>Back</button>
                <button onClick={handleRequest}
                  disabled={!canSubmit || submitting}
                  style={{
                    flex:2,
                    background: canSubmit ? T.primary : T.subtle,
                    color: canSubmit ? "#fff" : T.muted,
                    border:"none",borderRadius:12,padding:"11px",
                    fontFamily:"'DM Sans', sans-serif",
                    fontWeight:600,fontSize:".85rem",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    boxShadow: canSubmit ? `0 6px 20px ${T.primary}38` : "none",
                    transition:"all .2s ease",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  }}>
                  {submitting ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".7s" repeatCount="indefinite"/>
                        </path>
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      Request Appointment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div style={{
              padding:"48px 32px",
              display:"flex",flexDirection:"column",alignItems:"center",
              gap:16,textAlign:"center",
              animation:"stepIn .35s ease both",
            }}>
              {/* Animated checkmark */}
              <div style={{
                width:72,height:72,borderRadius:"50%",
                background:`${T.primary}18`,
                display:"flex",alignItems:"center",justifyContent:"center",
                animation:"successPop .45s cubic-bezier(.25,.8,.25,1) both",
              }}>
                <svg width="34" height="34" viewBox="0 0 50 50" fill="none" stroke={T.primary} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 26l10 10 16-18" strokeDasharray="50" strokeDashoffset="0"
                    style={{ animation:"checkDraw .4s ease .2s both" }}/>
                </svg>
              </div>

              <div>
                <h3 style={{
                  fontFamily:"'DM Serif Display', serif",fontSize:"1.4rem",
                  fontWeight:400,color:T.accent,marginBottom:8,
                }}>Appointment Requested!</h3>
                <p style={{ fontSize:".86rem",color:T.muted,lineHeight:1.7 }}>
                  Your appointment with <strong style={{ color:T.text }}>{doctor.name}</strong> has been sent for confirmation.
                </p>
              </div>

              {/* Summary card */}
              <div style={{
                background:T.card,border:`1px solid ${T.subtle}`,
                borderRadius:16,padding:"16px 20px",width:"100%",
                display:"flex",flexDirection:"column",gap:10,
                textAlign:"left",
              }}>
                {[
                  { label:"Patient",  value: USER_NAME },
                  { label:"Doctor",   value: doctor.name },
                  { label:"Type",     value: consultType === "online" ? "Online Consultation" : "In-Clinic Visit" },
                  { label:"Date",     value: fmtDate(selectedDate) },
                  { label:"Time",     value: selectedTime },
                ].map(row => (
                  <div key={row.label} style={{
                    display:"flex",justifyContent:"space-between",alignItems:"center",
                    paddingBottom:8,borderBottom:`1px solid ${T.subtle}`,
                  }}>
                    <span style={{ fontSize:".76rem",color:T.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:".08em" }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize:".84rem",fontWeight:600,color:T.text }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <button onClick={onClose} style={{
                background:T.primary,color:"#fff",
                border:"none",borderRadius:12,
                padding:"12px 32px",
                fontFamily:"'DM Sans', sans-serif",fontWeight:600,fontSize:".88rem",
                cursor:"pointer",
                boxShadow:`0 6px 20px ${T.primary}40`,
                marginTop:4,
              }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Doctor data ────────────────────────────────────────────────────────────── */
const DOCTORS = [
  { name:"Dr. Rahul Sharma", specialty:"Sleep & Cognitive Therapy", rating:4.8, reviews:124, status:"Online & In-Clinic", location:"Kochi, Kerala" },
  { name:"Dr. Kavya Iyer",   specialty:"Anxiety Specialist",        rating:4.6, reviews:98,  status:"Available Today",    location:"Ernakulam, Kerala" },
  { name:"Dr. Arjun Nair",   specialty:"Behavioral Therapy",        rating:4.9, reviews:211, status:"Next Slot Tomorrow",  location:"Thrissur, Kerala" },
];

const SPECIALIZATIONS = ["All","Anxiety Specialist","Sleep Therapy","Behavioral Therapy","Stress Management"];

function Stars({ rating, primary }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <svg key={n} width="13" height="13" viewBox="0 0 20 20"
          fill={n<=Math.round(rating) ? primary : "none"}
          stroke={primary} strokeWidth="1.5">
          <path d="M10 1l2.7 5.6L19 7.6l-4.5 4.4 1.1 6.3L10 15.4l-5.6 2.9 1.1-6.3L1 7.6l6.3-.9L10 1z"/>
        </svg>
      ))}
      <span style={{ fontSize:".8rem",fontWeight:600,color:primary,marginLeft:2 }}>{rating}</span>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function MedicalSupport() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("All");
  const [mapDoctor,   setMapDoctor]   = useState(null);
  const [bookDoctor,  setBookDoctor]  = useState(null);
  const [doctors,     setDoctors]     = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  /* Fetch doctors from backend on mount */
  useEffect(() => {
    getDoctors()
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDocs(false));
  }, []);

  const T = THEMES[themeKey];

  const filtered = doctors.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || d.specialty === filter;
    return matchSearch && matchFilter;
  });

  const card = {
    background:T.surface, borderRadius:22,
    border:`1px solid ${T.subtle}`,
    boxShadow:"0 6px 32px rgba(0,0,0,.05), 0 2px 10px rgba(0,0,0,.03)",
    transition:"background .4s, border .4s",
  };

  const inputStyle = {
    width:"100%",borderRadius:12,padding:"11px 16px",
    border:`1.5px solid ${T.subtle}`,background:T.surface,color:T.text,
    fontSize:"0.9rem",fontFamily:"'DM Sans', sans-serif",transition:"border .2s",
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`.login-input:focus{border-color:${T.primary}!important} select.theme-sel:focus{border-color:${T.primary}!important}`}</style>
      <BubbleCanvas primary={T.primary}/>

      <div style={{
        minHeight:"100vh",background:T.gradient,color:T.text,
        transition:"background .45s ease",position:"relative",zIndex:1,
      }}>
        <Navbar T={T} themeKey={themeKey} setThemeKey={setThemeKey}/>

        <main style={{ padding:"52px 24px 96px",position:"relative",zIndex:1 }}>
          <div style={{ maxWidth:1040,margin:"0 auto" }}>

            {/* Page header */}
            <div style={{ textAlign:"center",marginBottom:48,animation:"fadeSlideUp .5s ease both" }}>
              <p style={{ fontWeight:500,fontSize:"0.7rem",letterSpacing:"0.2em",textTransform:"uppercase",color:T.muted,marginBottom:14 }}>
                Professional Care
              </p>
              <h1 style={{
                fontFamily:"'DM Serif Display', serif",fontSize:"clamp(1.9rem,5vw,2.8rem)",
                fontWeight:400,color:T.accent,lineHeight:1.2,transition:"color .4s",
              }}>
                Medical &amp; Professional Support
              </h1>
              <p style={{ color:T.muted,fontSize:".9rem",marginTop:12,lineHeight:1.7 }}>
                Find trusted professionals and receive the right care when you need it.
              </p>
              <div style={{ width:48,height:3,borderRadius:99,background:T.primary,opacity:.45,margin:"18px auto 0",transition:"background .4s" }}/>
            </div>

            {/* Emergency banner */}
            <div style={{
              background:T.emergency.bg,border:`1.5px solid ${T.emergency.border}`,
              borderRadius:16,padding:"16px 24px",textAlign:"center",
              marginBottom:40,color:T.emergency.text,fontSize:".9rem",lineHeight:1.6,
              animation:"fadeSlideUp .55s ease .08s both",
            }}>
              <svg style={{ verticalAlign:"middle",marginRight:8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              If you are experiencing severe distress, call{" "}
              <strong><a href="tel:9152987821" style={{ color:"inherit" }}>9152987821</a></strong> immediately.
            </div>

            {/* Search & filter */}
            <div style={{
              ...card,padding:"24px 28px",marginBottom:40,
              display:"flex",gap:16,flexWrap:"wrap",
              animation:"fadeSlideUp .6s ease .12s both",
            }}>
              <div style={{ flex:"1 1 260px",position:"relative" }}>
                <svg style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:T.muted }}
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input className="login-input" placeholder="Search by doctor name..." value={search}
                  onChange={e => setSearch(e.target.value)} style={{ ...inputStyle,paddingLeft:40 }}/>
              </div>
              <div style={{ flex:"1 1 220px",position:"relative" }}>
                <select className="theme-sel" value={filter} onChange={e => setFilter(e.target.value)} style={{
                  ...inputStyle,appearance:"none",WebkitAppearance:"none",
                  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat:"no-repeat",backgroundPosition:"right 16px center",
                  paddingRight:40,cursor:"pointer",
                }}>
                  {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Doctor cards */}
            <div style={{
              display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))",
              gap:24,animation:"fadeSlideUp .65s ease .16s both",
            }}>
              {filtered.length === 0 ? (
                <p style={{ color:T.muted,gridColumn:"1/-1",textAlign:"center",padding:"40px 0" }}>
                  No doctors found matching your search.
                </p>
              ) : filtered.map((doc,i) => (
                <div key={i} className="doc-card" style={{ ...card,padding:"32px 28px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:18 }}>
                    <div style={{
                      width:50,height:50,borderRadius:16,
                      background:`radial-gradient(circle at 35% 35%, ${T.primary}40, ${T.primary}18)`,
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontFamily:"'DM Serif Display', serif",fontSize:"1.1rem",fontWeight:400,color:T.accent,lineHeight:1.2 }}>
                        {doc.name}
                      </h3>
                      <p style={{ color:T.muted,fontSize:".82rem",marginTop:2 }}>{doc.specialty}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom:12 }}>
                    <Stars rating={doc.rating} primary={T.primary}/>
                    <p style={{ color:T.muted,fontSize:".75rem",marginTop:4 }}>{doc.reviews} verified reviews</p>
                  </div>

                  <div style={{
                    display:"inline-flex",alignItems:"center",gap:6,
                    background:`${T.primary}18`,border:`1px solid ${T.primary}30`,
                    borderRadius:99,padding:"5px 12px",marginBottom:24,
                  }}>
                    <div style={{ width:7,height:7,borderRadius:"50%",background:doc.status==="Next Slot Tomorrow"?T.muted:T.primary }}/>
                    <span style={{ fontSize:".78rem",fontWeight:500,color:T.primary }}>{doc.status}</span>
                  </div>

                  <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                    <button className="cta-btn"
                      onClick={() => setBookDoctor(doc)}
                      style={{
                        flex:1,background:T.primary,color:"#fff",
                        border:"none",borderRadius:12,padding:"10px 14px",
                        fontFamily:"'DM Sans', sans-serif",fontWeight:600,fontSize:".83rem",
                        letterSpacing:".03em",boxShadow:`0 4px 16px ${T.primary}40`,
                      }}>
                      Book Appointment
                    </button>
                    <button className="cta-btn"
                      onClick={() => setMapDoctor(doc)}
                      style={{
                        background:"transparent",color:T.primary,
                        border:`1.5px solid ${T.primary}`,borderRadius:12,
                        padding:"10px 14px",fontFamily:"'DM Sans', sans-serif",
                        fontWeight:500,fontSize:".83rem",
                      }}>
                      View Location
                    </button>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(doc.location)}`}
                      target="_blank" rel="noopener noreferrer" className="cta-btn"
                      style={{
                        display:"flex",alignItems:"center",justifyContent:"center",gap:5,
                        background:T.card,color:T.accent,border:`1px solid ${T.subtle}`,
                        borderRadius:12,padding:"10px 14px",
                        fontFamily:"'DM Sans', sans-serif",fontWeight:500,fontSize:".83rem",
                        textDecoration:"none",width:"100%",
                      }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                      </svg>
                      Get Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Reassurance card */}
            <div style={{
              ...card,padding:"40px 48px",textAlign:"center",
              marginTop:52,animation:"fadeSlideUp .7s ease .2s both",
            }}>
              <div style={{
                width:52,height:52,borderRadius:16,background:`${T.primary}18`,
                display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 style={{ fontFamily:"'DM Serif Display', serif",fontSize:"1.4rem",fontWeight:400,color:T.accent,marginBottom:12 }}>
                You are taking a positive step.
              </h3>
              <p style={{ color:T.muted,fontSize:".9rem",lineHeight:1.75,maxWidth:520,margin:"0 auto" }}>
                Seeking support early improves emotional resilience and long-term well-being.
                Professional guidance can help you build healthier coping strategies.
              </p>
            </div>

          </div>
        </main>
      </div>

      {/* Modals */}
      <MapModal T={T} doctor={mapDoctor} onClose={() => setMapDoctor(null)}/>
      {bookDoctor && (
        <BookingModal T={T} doctor={bookDoctor} onClose={() => setBookDoctor(null)}/>
      )}
    </>
  );
}