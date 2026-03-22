import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";
import { getUser } from "../api";

/* ─── Theme Palettes (identical to survey.js) ────────────────────────────────── */
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

  .mood-pill         { transition: all .22s ease; cursor: pointer; user-select: none; }
  .mood-pill:hover   { transform: translateY(-2px) scale(1.04); }
  .feat-card         { transition: all .25s ease; cursor: pointer; }
  .feat-card:hover   { transform: translateY(-5px) !important; }
  .nav-btn           { transition: background .2s ease; cursor: pointer; }
  .nav-btn:hover     { background: rgba(255,255,255,0.22) !important; }
  .palette-row       { transition: background .15s ease; cursor: pointer; border-radius: 10px; }
  .palette-row:hover { background: rgba(128,128,128,.08) !important; }
`;

/* ─── Bubble Canvas (identical to survey.js) ─────────────────────────────────── */
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
          position:     "absolute",
          width:        b.w, height: b.h,
          top:          b.top, left: b.left,
          borderRadius: "50%",
          background:   `radial-gradient(circle at 35% 30%, ${primary}2A, ${primary}06)`,
          border:       `1px solid ${primary}18`,
          opacity:      b.op,
          animation:    b.anim,
          transition:   "background .5s ease, border .5s ease",
        }} />
      ))}
    </div>
  );
}

/* ─── Navbar (identical pattern to survey.js) ────────────────────────────────── */
function Navbar({ T, themeKey, setThemeKey }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();
  const user = getUser();
  const profileLabel =
    user?.name?.trim() ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "Profile";

  useEffect(() => {
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const navBtn = {
    display: "flex", alignItems: "center", gap: 7,
    background: "rgba(255,255,255,0.13)",
    backdropFilter: "blur(10px)",
    border: "1.5px solid rgba(255,255,255,0.28)",
    borderRadius: 10, padding: "8px 18px",
    color: T.navText,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500, fontSize: "0.84rem",
    letterSpacing: ".03em",
  };

  const IconPalette = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" />
      <circle cx="8"  cy="13" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="9"  r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9"  r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="13" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );

  const IconChevron = ({ up }) => (
    <svg width="9" height="9" viewBox="0 0 10 6" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={up ? "M1 5l4-4 4 4" : "M1 1l4 4 4-4"} />
    </svg>
  );

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: T.navBg, padding: "13px 36px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
      transition: "background .45s ease",
    }}>
      {/* Brand */}
      <span style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: "1.3rem", fontStyle: "italic",
        color: T.navText, opacity: .92, letterSpacing: ".01em",
      }}>
        Baymaxify
      </span>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

        {/* Username pill */}
        <button
          style={{
            ...navBtn,
            opacity: .85,
            pointerEvents: "auto",
          }}
          onClick={() => navigate("/profile")}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="7" r="3.5" />
            <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" />
          </svg>
          {profileLabel}
        </button>

        {/* Palette */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <button className="nav-btn" style={navBtn} onClick={() => setOpen(p => !p)}>
            <IconPalette />
            Palette
            <IconChevron up={open} />
          </button>

          {open && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              background: T.surface, border: `1px solid ${T.subtle}`,
              borderRadius: 16, padding: 8, width: 218,
              boxShadow: "0 20px 56px rgba(0,0,0,.18)",
              animation: "dropDown .18s ease both", zIndex: 100,
            }}>
              {Object.entries(THEMES).map(([key, th]) => (
                <div key={key} className="palette-row"
                  onClick={() => { setThemeKey(key); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px",
                    background: key === themeKey ? `${T.primary}14` : "transparent",
                  }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: th.swatch, flexShrink: 0,
                    boxShadow: key === themeKey ? `0 0 0 3px ${th.swatch}44` : "none",
                    transition: "box-shadow .2s",
                  }} />
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.88rem",
                    fontWeight: key === themeKey ? 600 : 400,
                    color: T.text,
                  }}>
                    {th.label}
                  </span>
                  {key === themeKey && (
                    <svg style={{ marginLeft: "auto" }} width="13" height="13" viewBox="0 0 14 14"
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
            <path d="M13 15l4-4-4-4" />
            <path d="M17 11H8" />
            <path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
          </svg>
          Logout
        </button>

      </div>
    </nav>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────────── */
const MOODS = ["Happy", "Neutral", "Sad", "Anxious"];

const FEATURES = [
  {
    key:   "chatbot",
    label: "Chatbot",
    route: "/chatbot",
    desc:  "Talk to our AI companion anytime",
    icon:  (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9"  cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key:   "survey",
    label: "Survey",
    route: "/survey",
    desc:  "Track and understand your mental wellness",
    icon:  (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    key:   "medical",
    label: "Medical Support",
    route: "/medical",
    desc:  "Connect with licensed professionals",
    icon:  (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    key:   "prescription",
    label: "Doctor Prescription",
    route: "/prescription",
    desc:  "Get AI-assisted prescription guidance from doctors",
    icon:  (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="12" y1="10" x2="12" y2="16" />
      </svg>
    ),
  },
  {
    key:   "cart",
    label: "Medicine Cart",
    route: "/medicinecart",
    desc:  "Order prescribed medicines delivered to your door",
    icon:  (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
        <line x1="12" y1="8" x2="12" y2="13" />
        <line x1="9.5" y1="10.5" x2="14.5" y2="10.5" />
      </svg>
    ),
  },
];

/* ─── Home Page ──────────────────────────────────────────────────────────────── */
export default function BaymaxifyHome() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const [selectedMood,  setSelectedMood]  = useState(null);
  const [hoveredFeature,setHoveredFeature]= useState(null);
  const navigate = useNavigate();

  const T = THEMES[themeKey];

  /* shared card style */
  const card = {
    background:   T.surface,
    borderRadius: 22,
    border:       `1px solid ${T.subtle}`,
    boxShadow:    "0 8px 40px rgba(0,0,0,.06), 0 2px 12px rgba(0,0,0,.04)",
    transition:   "background .4s, border .4s, box-shadow .3s",
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <BubbleCanvas primary={T.primary} />

      <div style={{
        minHeight:  "100vh",
        background: T.gradient,
        color:      T.text,
        transition: "background .45s ease",
        position:   "relative",
        zIndex:     1,
      }}>

        {/* ── Navbar ── */}
        <Navbar T={T} themeKey={themeKey} setThemeKey={setThemeKey} />

        {/* ── Main ── */}
        <main style={{ padding: "56px 24px 96px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1060, margin: "0 auto" }}>

            {/* Page label */}
            <div style={{ textAlign: "center", marginBottom: 52, animation: "fadeSlideUp .5s ease both" }}>
              <p style={{
                fontWeight: 500, fontSize: "0.7rem",
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: T.muted, marginBottom: 16,
              }}>
                Mental Wellness
              </p>
              <h1 style={{
                fontFamily:  "'DM Serif Display', serif",
                fontSize:    "clamp(2rem, 5vw, 3rem)",
                fontWeight:  400,
                color:       T.accent,
                lineHeight:  1.2,
                transition:  "color .4s",
              }}>
                How are you feeling today?
              </h1>
              <div style={{
                width: 48, height: 3, borderRadius: 99,
                background: T.primary, opacity: .45,
                margin: "18px auto 0",
                transition: "background .4s",
              }} />
            </div>

            {/* ── Mood pills ── */}
            <div style={{
              display: "flex", justifyContent: "center",
              gap: 12, marginBottom: 64,
              flexWrap: "wrap",
              animation: "fadeSlideUp .55s ease .08s both",
            }}>
              {MOODS.map(mood => {
                const active = selectedMood === mood;
                return (
                  <button
                    key={mood}
                    className="mood-pill"
                    onClick={() => setSelectedMood(mood)}
                    style={{
                      background:    active ? T.primary : T.surface,
                      color:         active ? "#fff"    : T.text,
                      border:        `1.5px solid ${active ? T.primary : T.subtle}`,
                      borderRadius:  99,
                      padding:       "10px 28px",
                      fontFamily:    "'DM Sans', sans-serif",
                      fontWeight:    active ? 600 : 400,
                      fontSize:      "0.9rem",
                      letterSpacing: ".02em",
                      boxShadow:     active
                        ? `0 6px 20px ${T.primary}40`
                        : "0 2px 8px rgba(0,0,0,.04)",
                      transition:    "all .22s ease",
                    }}>
                    {mood}
                  </button>
                );
              })}
            </div>

            {/* ── Feature cards ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 28,
              animation: "fadeSlideUp .65s ease .16s both",
            }}>
              {FEATURES.map((feat, i) => {
                const hovered = hoveredFeature === i;
                return (
                  <button
                    key={feat.key}
                    className="feat-card"
                    onMouseEnter={() => setHoveredFeature(i)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    onClick={() => feat.route && navigate(feat.route)}
                    style={{
                      ...card,
                      padding:   "44px 36px 40px",
                      textAlign: "left",
                      border:    `1.5px solid ${hovered ? T.primary : T.subtle}`,
                      boxShadow: hovered
                        ? `0 16px 44px ${T.primary}22, 0 4px 16px rgba(0,0,0,.08)`
                        : "0 4px 20px rgba(0,0,0,.05)",
                      display:        "flex",
                      flexDirection:  "column",
                      gap:            18,
                    }}
                  >
                    {/* Icon container */}
                    <div style={{
                      width:        56,
                      height:       56,
                      borderRadius: 16,
                      background:   hovered ? T.primary : T.card,
                      display:      "flex",
                      alignItems:   "center",
                      justifyContent: "center",
                      color:        hovered ? "#fff" : T.primary,
                      transition:   "all .25s ease",
                      flexShrink:   0,
                    }}>
                      {feat.icon}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{
                        fontFamily:  "'DM Serif Display', serif",
                        fontSize:    "1.4rem",
                        fontWeight:  400,
                        color:       T.accent,
                        lineHeight:  1.2,
                        transition:  "color .3s",
                      }}>
                        {feat.label}
                      </span>
                      <span style={{
                        color:      T.muted,
                        fontSize:   "0.88rem",
                        lineHeight: 1.65,
                        fontWeight: 400,
                      }}>
                        {feat.desc}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div style={{
                      marginTop:   "auto",
                      color:       hovered ? T.primary : T.muted,
                      opacity:     hovered ? 1 : .4,
                      transition:  "all .25s ease",
                      transform:   hovered ? "translateX(4px)" : "translateX(0)",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 10h12M11 5l5 5-5 5" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Mood feedback ── */}
            {selectedMood && (
              <div style={{
                textAlign:    "center",
                marginTop:    52,
                animation:    "fadeSlideUp .4s ease both",
              }}>
                <p style={{
                  display:      "inline-block",
                  background:   T.surface,
                  border:       `1px solid ${T.subtle}`,
                  borderRadius: 99,
                  padding:      "12px 32px",
                  color:        T.text,
                  fontSize:     "0.9rem",
                  fontWeight:   400,
                  boxShadow:    "0 4px 16px rgba(0,0,0,.05)",
                  lineHeight:   1.6,
                }}>
                  You're feeling{" "}
                  <strong style={{ color: T.primary, fontWeight: 600 }}>{selectedMood}</strong>
                  {" "}today — we're here for you.
                </p>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}