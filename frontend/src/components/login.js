import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";
import { login, register } from "../api";

/* ─── Theme Palettes (identical to survey.js & home.js) ─────────────────────── */
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
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes dropDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }

  .palette-row       { transition: background .15s ease; cursor: pointer; border-radius: 10px; }
  .palette-row:hover { background: rgba(128,128,128,.08) !important; }
  .login-input:focus { border-color: var(--focus-color) !important; outline: none; }
  .cta-btn           { transition: all .22s ease; cursor: pointer; }
  .cta-btn:hover     { opacity: .91; transform: translateY(-1px); }
  .toggle-link       { transition: color .2s ease; cursor: pointer; }
  .toggle-link:hover { opacity: .75; }
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

/* ─── Palette Dropdown ───────────────────────────────────────────────────────── */
function PaletteDropdown({ T, themeKey, setThemeKey }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={dropRef} style={{ position:"absolute", top:20, right:20, zIndex:10 }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            7,
          background:     "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          border:         `1.5px solid ${T.subtle}`,
          borderRadius:   12,
          padding:        "8px 16px",
          color:          T.accent,
          fontFamily:     "'DM Sans', sans-serif",
          fontWeight:     500,
          fontSize:       "0.82rem",
          letterSpacing:  ".04em",
          cursor:         "pointer",
          boxShadow:      "0 4px 16px rgba(0,0,0,.07)",
          transition:     "all .2s ease",
        }}
      >
        {/* Palette icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" />
          <circle cx="8"  cy="13" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="10" cy="9"  r="1.2" fill="currentColor" stroke="none" />
          <circle cx="14" cy="9"  r="1.2" fill="currentColor" stroke="none" />
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
          position:     "absolute",
          top:          "calc(100% + 8px)",
          right:        0,
          background:   T.surface,
          border:       `1px solid ${T.subtle}`,
          borderRadius: 16,
          padding:      8,
          width:        210,
          boxShadow:    "0 20px 56px rgba(0,0,0,.14)",
          animation:    "dropDown .18s ease both",
          zIndex:       100,
        }}>
          {Object.entries(THEMES).map(([key, th]) => (
            <div key={key} className="palette-row"
              onClick={() => { setThemeKey(key); setOpen(false); }}
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        12,
                padding:    "10px 12px",
                background: key === themeKey ? `${T.primary}14` : "transparent",
              }}>
              <div style={{
                width:        22, height: 22,
                borderRadius: "50%",
                background:   th.swatch,
                flexShrink:   0,
                boxShadow:    key === themeKey ? `0 0 0 3px ${th.swatch}44` : "none",
                transition:   "box-shadow .2s",
              }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize:   "0.88rem",
                fontWeight: key === themeKey ? 600 : 400,
                color:      T.text,
              }}>
                {th.label}
              </span>
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
  );
}

/* ─── Login Page ─────────────────────────────────────────────────────────────── */
export default function Baymaxify() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const [isLogin,   setIsLogin]   = useState(true);
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [fullName,  setFullName]  = useState("");
  const navigate = useNavigate();
  const T = THEMES[themeKey];

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const toggleForm = () => { setIsLogin(prev => !prev); setError(""); };

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        /* ── Login ── */
        const data = await login(email, password);
        // Route based on role
        if (data.user.role === "admin")  navigate("/adminpage");
        else if (data.user.role === "doctor") navigate("/doctorpage");
        else navigate("/home");
      } else {
        /* ── Register ── */
        if (!fullName || !email || !password) {
          setError("Please fill in all fields");
          return;
        }
        await register(fullName, email, password);
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:        "100%",
    borderRadius: 12,
    padding:      "12px 16px",
    border:       `1.5px solid ${T.subtle}`,
    background:   T.surface,
    color:        T.text,
    fontSize:     "0.92rem",
    fontFamily:   "'DM Sans', sans-serif",
    boxSizing:    "border-box",
    marginBottom: 12,
    transition:   "border .2s ease",
    "--focus-color": T.primary,
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Dynamic focus ring colour */}
      <style>{`
        .login-input:focus { border-color: ${T.primary} !important; }
        .cta-btn:hover     { box-shadow: 0 10px 28px ${T.primary}50 !important; }
      `}</style>

      <BubbleCanvas primary={T.primary} />

      <div style={{
        minHeight:      "100vh",
        background:     T.gradient,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontFamily:     "'DM Sans', sans-serif",
        transition:     "background .45s ease",
        position:       "relative",
        zIndex:         1,
        padding:        "24px",
      }}>

        {/* Palette switcher — top right */}
        <PaletteDropdown T={T} themeKey={themeKey} setThemeKey={setThemeKey} />

        {/* ── Auth card ── */}
        <div style={{
          background:   T.surface,
          borderRadius: 24,
          padding:      "48px 44px",
          width:        "100%",
          maxWidth:     420,
          boxShadow:    "0 16px 56px rgba(0,0,0,.08), 0 2px 16px rgba(0,0,0,.04)",
          border:       `1px solid ${T.subtle}`,
          position:     "relative",
          zIndex:       2,
          transition:   "background .4s, border .4s",
          animation:    "fadeSlideUp .55s ease both",
        }}>

          {/* Brand mark */}
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <span style={{
              fontFamily:  "'DM Serif Display', serif",
              fontSize:    "1.7rem",
              fontStyle:   "italic",
              color:       T.primary,
              letterSpacing: ".01em",
              transition:  "color .4s",
            }}>
              Baymaxify
            </span>
            <div style={{
              width:36, height:2, borderRadius:99,
              background: T.primary, opacity:.4,
              margin:"10px auto 0",
              transition:"background .4s",
            }} />
          </div>

          {/* Page label */}
          <p style={{
            fontWeight:    500,
            fontSize:      "0.7rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         T.muted,
            textAlign:     "center",
            marginBottom:  10,
          }}>
            {isLogin ? "Welcome back" : "Create account"}
          </p>

          <h2 style={{
            fontFamily:   "'DM Serif Display', serif",
            fontSize:     "1.55rem",
            fontWeight:   400,
            color:        T.accent,
            textAlign:    "center",
            marginBottom: 32,
            lineHeight:   1.2,
            transition:   "color .4s",
          }}>
            {isLogin ? "Sign in to continue" : "Join Baymaxify today"}
          </h2>

          {/* Form */}
          <form onSubmit={e => e.preventDefault()}>

            {!isLogin && (
              <input
                className="login-input"
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={inputStyle}
              />
            )}

            <input
              className="login-input"
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />

            <input
              className="login-input"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, marginBottom: 24 }}
            />

            <button
              type="button"
              className="cta-btn"
              onClick={handleLogin}
              disabled={loading}
              style={{
                width:         "100%",
                background:    loading ? T.muted : T.primary,
                color:         "#fff",
                borderRadius:  14,
                padding:       "13px",
                border:        "none",
                fontFamily:    "'DM Sans', sans-serif",
                fontWeight:    600,
                fontSize:      "0.92rem",
                letterSpacing: ".05em",
                boxShadow:     loading ? "none" : `0 6px 20px ${T.primary}45`,
                transition:    "all .22s ease",
                cursor:        loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
            </button>

            {/* Error message */}
            {error && (
              <p style={{
                marginTop: 12, textAlign: "center",
                fontSize: "0.84rem", color: "#EF4444",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {error}
              </p>
            )}

          </form>

          {/* Toggle */}
          <p style={{
            textAlign:  "center",
            marginTop:  20,
            fontSize:   "0.86rem",
            color:      T.muted,
          }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              className="toggle-link"
              onClick={toggleForm}
              style={{
                color:      T.primary,
                fontWeight: 600,
                cursor:     "pointer",
              }}
            >
              {isLogin ? "Create account" : "Sign in"}
            </span>
          </p>

        </div>
      </div>
    </>
  );
}