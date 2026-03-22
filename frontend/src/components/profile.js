import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";

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

/* ─── Simulated assessment data ──────────────────────────────────────────────── */
const USER_DATA = {
  emotion:   "Anxious",
  intensity: 8,
  pattern:   "Frequently recurring",
  cognitive: "Racing thoughts",
  physical:  "Tight chest, Fatigue",
  coping:    "Avoided the issue",
  social:    "Want to be alone",
  control:   3,
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
  @keyframes scoreCount {
    from { opacity: 0; transform: scale(.7); }
    to   { opacity: 1; transform: scale(1);  }
  }
  @keyframes arcGrow {
    from { stroke-dashoffset: 283; }
  }

  .nav-btn           { transition: background .2s ease; cursor: pointer; }
  .nav-btn:hover     { background: rgba(255,255,255,0.22) !important; }
  .palette-row       { transition: background .15s ease; cursor: pointer; border-radius: 10px; }
  .palette-row:hover { background: rgba(128,128,128,.08) !important; }
  .dash-card         { transition: all .25s ease; }
  .dash-card:hover   { transform: translateY(-3px); }
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
          border:`1px solid ${primary}18`,
          opacity:b.op, animation:b.anim,
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
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
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
      position:"sticky", top:0, zIndex:50,
      background:T.navBg, padding:"13px 36px",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      boxShadow:"0 4px 24px rgba(0,0,0,0.1)", transition:"background .45s ease",
    }}>
      <span style={{
        fontFamily:"'DM Serif Display', serif", fontSize:"1.3rem",
        fontStyle:"italic", color:T.navText, opacity:.92,
      }}>
        MindEase
      </span>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* Home */}
        <button className="nav-btn" style={navBtn} onClick={() => navigate("/home")}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L10 3l7 6.5"/><path d="M5 8.5v8h3.5v-4.5h3V16.5H15v-8"/>
          </svg>
          Home
        </button>

        {/* Palette */}
        <div ref={dropRef} style={{ position:"relative" }}>
          <button className="nav-btn" style={navBtn} onClick={() => setOpen(p => !p)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
              <circle cx="8"  cy="13" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="10" cy="9"  r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="14" cy="9"  r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="16" cy="13" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
            Palette
            <svg width="9" height="9" viewBox="0 0 10 6" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d={open ? "M1 5l4-4 4 4" : "M1 1l4 4 4-4"}/>
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
                    width:22, height:22, borderRadius:"50%",
                    background:th.swatch, flexShrink:0,
                    boxShadow: key === themeKey ? `0 0 0 3px ${th.swatch}44` : "none",
                  }}/>
                  <span style={{
                    fontFamily:"'DM Sans', sans-serif", fontSize:"0.88rem",
                    fontWeight: key === themeKey ? 600 : 400, color:T.text,
                  }}>
                    {th.label}
                  </span>
                  {key === themeKey && (
                    <svg style={{ marginLeft:"auto" }} width="13" height="13" viewBox="0 0 14 14"
                      fill="none" stroke={T.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7l4 4 6-6"/>
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
            <path d="M13 15l4-4-4-4"/><path d="M17 11H8"/>
            <path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/>
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}

/* ─── Wellness score calculation (identical logic to original) ───────────────── */
function calcScore(data) {
  let score = 100 - data.intensity * 5 - (10 - data.control) * 3;
  return Math.max(score, 10);
}

function buildRecommendation(data) {
  let rec = data.intensity > 7
    ? "High emotional intensity detected. Try guided breathing and reduce workload."
    : "Maintain current balance with mindful breaks and structured routine.";
  if (data.cognitive.includes("Racing")) {
    rec += " Slow cognitive pace through grounding exercises.";
  }
  return rec;
}

/* ─── Animated arc score circle ─────────────────────────────────────────────── */
function ScoreCircle({ score, T }) {
  const radius = 45;
  const circ   = 2 * Math.PI * radius; // ≈ 283
  const pct    = Math.min(score / 100, 1);
  const offset = circ * (1 - pct);

  const colour = score >= 70 ? "#22c55e" : score >= 40 ? T.primary : "#ef4444";

  return (
    <div style={{ position:"relative", width:160, height:160, margin:"0 auto" }}>
      <svg width="160" height="160" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r={radius} fill="none"
          stroke={`${T.primary}22`} strokeWidth="8"/>
        {/* Arc */}
        <circle cx="50" cy="50" r={radius} fill="none"
          stroke={colour} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition:"stroke-dashoffset 1.2s ease, stroke .4s", animation:"arcGrow 1.2s ease both" }}
        />
      </svg>
      {/* Number */}
      <div style={{
        position:"absolute", inset:0,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        animation:"scoreCount .6s ease .4s both",
      }}>
        <span style={{
          fontFamily:"'DM Serif Display', serif",
          fontSize:"2.4rem", fontWeight:400,
          color:colour, lineHeight:1,
          transition:"color .4s",
        }}>
          {score}
        </span>
        <span style={{ fontSize:".7rem", color:T.muted, letterSpacing:".08em", marginTop:2 }}>
          / 100
        </span>
      </div>
    </div>
  );
}

/* ─── Stat row helper ────────────────────────────────────────────────────────── */
function StatRow({ label, value, T }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      padding:"12px 0",
      borderBottom:`1px solid ${T.subtle}`,
    }}>
      <span style={{ fontSize:".82rem", color:T.muted, fontWeight:500, letterSpacing:".04em", textTransform:"uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize:".9rem", color:T.accent, fontWeight:500, textAlign:"right", maxWidth:"55%" }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Section card ───────────────────────────────────────────────────────────── */
function DashCard({ T, children, style = {} }) {
  return (
    <div className="dash-card" style={{
      background:   T.surface,
      borderRadius: 22,
      border:       `1px solid ${T.subtle}`,
      boxShadow:    "0 6px 32px rgba(0,0,0,.05), 0 2px 10px rgba(0,0,0,.03)",
      padding:      "32px 28px",
      transition:   "background .4s, border .4s",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── Card label ─────────────────────────────────────────────────────────────── */
function CardLabel({ T, children }) {
  return (
    <p style={{
      fontWeight:500, fontSize:"0.7rem",
      letterSpacing:"0.16em", textTransform:"uppercase",
      color:T.muted, marginBottom:6,
    }}>
      {children}
    </p>
  );
}

function CardTitle({ T, children }) {
  return (
    <h3 style={{
      fontFamily:"'DM Serif Display', serif",
      fontSize:"1.2rem", fontWeight:400,
      color:T.accent, marginBottom:20,
      transition:"color .4s",
    }}>
      {children}
    </h3>
  );
}

/* ─── Intensity bar ──────────────────────────────────────────────────────────── */
function IntensityBar({ value, max = 10, T }) {
  const pct = (value / max) * 100;
  const colour = value >= 8 ? "#ef4444" : value >= 5 ? T.primary : "#22c55e";
  return (
    <div style={{ marginTop:4 }}>
      <div style={{
        height:6, borderRadius:99,
        background:`${T.primary}18`, overflow:"hidden",
      }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background:colour, borderRadius:99,
          transition:"width 1s ease, background .4s",
        }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        <span style={{ fontSize:".68rem", color:T.muted }}>Low</span>
        <span style={{ fontSize:".68rem", color:colour, fontWeight:600 }}>{value} / {max}</span>
        <span style={{ fontSize:".68rem", color:T.muted }}>High</span>
      </div>
    </div>
  );
}

/* ─── Dashboard Page ─────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const T = THEMES[themeKey];

  const score          = calcScore(USER_DATA);
  const recommendation = buildRecommendation(USER_DATA);

  const card = { background:T.surface, borderRadius:22, border:`1px solid ${T.subtle}` };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <BubbleCanvas primary={T.primary} />

      <div style={{
        minHeight:"100vh", background:T.gradient,
        color:T.text, transition:"background .45s ease",
        position:"relative", zIndex:1,
      }}>
        <Navbar T={T} themeKey={themeKey} setThemeKey={setThemeKey} />

        <main style={{ padding:"52px 24px 96px", position:"relative", zIndex:1 }}>
          <div style={{ maxWidth:1060, margin:"0 auto" }}>

            {/* ── Page header ── */}
            <div style={{ textAlign:"center", marginBottom:52, animation:"fadeSlideUp .5s ease both" }}>
              <p style={{
                fontWeight:500, fontSize:"0.7rem",
                letterSpacing:"0.2em", textTransform:"uppercase",
                color:T.muted, marginBottom:14,
              }}>
                Your Progress
              </p>
              <h1 style={{
                fontFamily:"'DM Serif Display', serif",
                fontSize:"clamp(1.9rem,5vw,2.8rem)",
                fontWeight:400, color:T.accent, lineHeight:1.2,
                transition:"color .4s",
              }}>
                Wellness Dashboard
              </h1>
              <div style={{
                width:48, height:3, borderRadius:99,
                background:T.primary, opacity:.45,
                margin:"18px auto 0", transition:"background .4s",
              }}/>
            </div>

            {/* ── Top row: Emotional + Score ── */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))",
              gap:24, marginBottom:24,
              animation:"fadeSlideUp .6s ease .08s both",
            }}>

              {/* Emotional Overview */}
              <DashCard T={T}>
                <CardLabel T={T}>Assessment Result</CardLabel>
                <CardTitle T={T}>Emotional Overview</CardTitle>

                <div style={{ marginBottom:20 }}>
                  <p style={{ fontSize:".75rem", color:T.muted, fontWeight:500,
                    letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>
                    Dominant Emotion
                  </p>
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    background:`${T.primary}18`, border:`1px solid ${T.primary}30`,
                    borderRadius:99, padding:"6px 16px",
                  }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:T.primary }}/>
                    <span style={{ fontFamily:"'DM Serif Display', serif",
                      fontSize:"1rem", color:T.primary }}>
                      {USER_DATA.emotion}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom:4 }}>
                  <p style={{ fontSize:".75rem", color:T.muted, fontWeight:500,
                    letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>
                    Intensity Level
                  </p>
                  <IntensityBar value={USER_DATA.intensity} T={T} />
                </div>

                <div style={{ marginTop:20 }}>
                  <StatRow label="Recurring Pattern" value={USER_DATA.pattern} T={T} />
                </div>
              </DashCard>

              {/* Wellness Score */}
              <DashCard T={T} style={{ textAlign:"center" }}>
                <CardLabel T={T}>Balance Index</CardLabel>
                <CardTitle T={T}>Wellness Score</CardTitle>
                <ScoreCircle score={score} T={T} />
                <p style={{
                  color:T.muted, fontSize:".85rem",
                  lineHeight:1.7, marginTop:20, maxWidth:240, margin:"20px auto 0",
                }}>
                  Overall balance index based on your assessment
                </p>
              </DashCard>
            </div>

            {/* ── Middle row: Cognitive + Behavior ── */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))",
              gap:24, marginBottom:24,
              animation:"fadeSlideUp .65s ease .14s both",
            }}>

              {/* Cognitive & Physical */}
              <DashCard T={T}>
                <CardLabel T={T}>Mind & Body</CardLabel>
                <CardTitle T={T}>Cognitive & Physical Signals</CardTitle>
                <StatRow label="Cognitive State"   value={USER_DATA.cognitive} T={T} />
                <StatRow label="Physical Signals"  value={USER_DATA.physical}  T={T} />
              </DashCard>

              {/* Behavior & Social */}
              <DashCard T={T}>
                <CardLabel T={T}>Patterns</CardLabel>
                <CardTitle T={T}>Behavior & Social Insight</CardTitle>
                <StatRow label="Coping Style"  value={USER_DATA.coping} T={T} />
                <StatRow label="Social Energy" value={USER_DATA.social}  T={T} />
              </DashCard>
            </div>

            {/* ── Recommendation ── */}
            <DashCard T={T} style={{ animation:"fadeSlideUp .7s ease .2s both" }}>
              <CardLabel T={T}>Guidance</CardLabel>
              <CardTitle T={T}>Personalised Recommendation</CardTitle>

              <div style={{
                background:`${T.primary}0D`,
                border:`1.5px solid ${T.primary}28`,
                borderRadius:16, padding:"22px 24px",
                display:"flex", gap:16, alignItems:"flex-start",
              }}>
                {/* Icon */}
                <div style={{
                  width:42, height:42, borderRadius:12, flexShrink:0,
                  background:`${T.primary}20`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={T.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <p style={{
                  color:T.text, fontSize:".92rem",
                  lineHeight:1.8, fontWeight:400,
                }}>
                  {recommendation}
                </p>
              </div>
            </DashCard>

          </div>
        </main>
      </div>
    </>
  );
}