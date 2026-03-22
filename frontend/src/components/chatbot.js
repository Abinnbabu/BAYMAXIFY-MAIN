import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";
import { sendChatMessage, getUser } from "../api";

/* ─── THEMES (matching home.js) ───────────────────────────────── */
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

/* ─── GLOBAL CSS ──────────────────────────────────────────────── */
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

  .nav-btn           { transition: background .2s ease; cursor: pointer; }
  .nav-btn:hover     { background: rgba(255,255,255,0.22) !important; }
  .palette-row       { transition: background .15s ease; cursor: pointer; border-radius: 10px; }
  .palette-row:hover { background: rgba(128,128,128,.08) !important; }

  @keyframes micPulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.15); }
  }

  .mic-btn-active {
    animation: micPulse 1.5s ease-in-out infinite;
  }
`;

/* ─── NAVBAR COMPONENT (matching home.js exactly) ────────────────── */
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

        {/* Home — Baymaxify landing (home.js) */}
        <button
          style={{
            ...navBtn,
            opacity: .85,
            pointerEvents: "auto",
          }}
          onClick={() => navigate("/home")}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10l7-7 7 7v7a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2z" />
            <path d="M9 17v-5h2v5" />
          </svg>
          Home
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

      </div>
    </nav>
  );
}

/* ─── COMPONENT ───────────────────────────────────────────────── */
export default function BaymaxifyChat() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const currentUser = getUser();

  const [messages, setMessages] = useState([
    { sender: "bot", text: `Hello ${currentUser?.name || "there"} 👋 I'm Baymax, your mental wellness companion. How are you feeling today?` },
  ]);
  const [input,      setInput]      = useState("");
  const [typing,     setTyping]     = useState(false);
  const [listening,  setListening]  = useState(false);
  const [sessionId,  setSessionId]  = useState(null);
  const [error,      setError]      = useState("");

  const chatRef = useRef(null);
  const T = THEMES[themeKey];

  /* Auto scroll */
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing]);

  /* Send message to Gemini via backend */
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || typing) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setTyping(true);
    setError("");

    try {
      const data = await sendChatMessage(text, sessionId);

      // Save sessionId for conversation continuity
      if (!sessionId && data.sessionId) setSessionId(data.sessionId);

      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err) {
      const detail =
        err?.message ||
        (typeof err === "string" ? err : "Connection issue. Please try again.");
      setError(detail);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            detail.includes("token") || detail.includes("log")
              ? "Please sign in again to use the chat, then retry 💙"
              : "I'm having a little trouble connecting right now. Please try again in a moment 💙",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const toggleSpeechToText = () => {
    setListening(!listening);
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

        body { font-family:'DM Sans', sans-serif; }

        @keyframes blink {
          0% {opacity:.2;}
          20% {opacity:1;}
          100% {opacity:.2;}
        }

        .typing span{
          width:6px;height:6px;
          background:${T.primary};
          border-radius:50%;
          animation:blink 1.4s infinite both;
        }
        .typing span:nth-child(2){animation-delay:.2s;}
        .typing span:nth-child(3){animation-delay:.4s;}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <Navbar T={T} themeKey={themeKey} setThemeKey={setThemeKey} />

        <div
          style={{
            background: T.gradient,
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 900,
              height: "100%",
              background: T.surface,
              borderRadius: 24,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,.08)",
              overflow: "hidden",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                padding: "20px 30px",
                borderBottom: `1px solid ${T.subtle}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#4CAF50",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 20,
                    color: T.accent,
                  }}
                >
                  Baymaxify Support
                </span>
              </div>

              <small style={{ color: T.muted }}>Secure & Private</small>
            </div>

            {/* CHAT BODY */}
            <div
              ref={chatRef}
              style={{
                flex: 1,
                padding: 30,
                overflowY: "auto",
                background: T.card,
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    marginBottom: 18,
                    justifyContent:
                      msg.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background:
                        msg.sender === "user" ? T.primary : T.surface,
                      color: msg.sender === "user" ? "#fff" : T.text,
                      padding: "14px 18px",
                      borderRadius:
                        msg.sender === "user"
                          ? "20px 20px 5px 20px"
                          : "20px 20px 20px 5px",
                      maxWidth: "70%",
                      lineHeight: 1.6,
                      fontSize: 14,
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {typing && (
                <div style={{ display: "flex", marginBottom: 18 }}>
                  <div
                    style={{
                      background: T.surface,
                      padding: "14px 18px",
                      borderRadius: "20px 20px 20px 5px",
                    }}
                  >
                    <div className="typing" style={{ display: "flex", gap: 5 }}>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error ? (
              <div
                role="alert"
                style={{
                  padding: "10px 20px",
                  fontSize: 13,
                  color: "#B91C1C",
                  background: "rgba(185, 28, 28, 0.08)",
                  borderTop: `1px solid ${T.subtle}`,
                }}
              >
                {error}
              </div>
            ) : null}

            {/* INPUT */}
            <div
              style={{
                padding: 20,
                borderTop: `1px solid ${T.subtle}`,
                background: T.surface,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  borderRadius: 30,
                  border: `1px solid ${T.subtle}`,
                  padding: "12px 18px",
                  outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />

              <button
                className={listening ? "mic-btn-active" : ""}
                onClick={toggleSpeechToText}
                title={listening ? "Recording... (Tap to stop)" : "Tap to speak"}
                style={{
                  background: listening ? T.primary : "rgba(0,0,0,0.08)",
                  color: listening ? "#fff" : T.muted,
                  border: `1.5px solid ${listening ? T.primary : T.subtle}`,
                  borderRadius: 30,
                  padding: "10px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  transition: "all .2s ease",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>{listening ? "...Listening" : "Speak"}</span>
              </button>

              <button
                onClick={sendMessage}
                style={{
                  background: T.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 30,
                  padding: "12px 25px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  transition: "all .2s ease",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}