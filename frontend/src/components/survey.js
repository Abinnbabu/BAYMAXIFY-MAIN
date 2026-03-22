import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";
import { submitSurvey } from "../api";

/* ─── Theme Palettes ─────────────────────────────────────────────────────────── */
const THEMES = {
  blue: {
    bg:"#F0F6FF",surface:"#FFFFFF",card:"#EBF3FF",
    primary:"#2255A4",accent:"#1A3F7A",muted:"#6B8BBF",
    text:"#0F2040",subtle:"#D8E8FF",
    gradient:"linear-gradient(160deg,#F7FAFF 0%,#E8F0FC 50%,#F0F6FF 100%)",
    navBg:"#2255A4",navText:"#FFFFFF",swatch:"#2255A4",label:"Soft Blue",
  },
  green: {
    bg:"#F2FAF5",surface:"#FFFFFF",card:"#E3F5EB",
    primary:"#1E7A4A",accent:"#155235",muted:"#5C9B74",
    text:"#0D2D1C",subtle:"#C8EDD8",
    gradient:"linear-gradient(160deg,#F7FDF9 0%,#E8F7EE 50%,#F2FAF5 100%)",
    navBg:"#1E7A4A",navText:"#FFFFFF",swatch:"#1E7A4A",label:"Sage Green",
  },
  warm: {
    bg:"#FFF8F0",surface:"#FFFFFF",card:"#FFF0DC",
    primary:"#B85C1A",accent:"#7C3A0E",muted:"#C4875A",
    text:"#3D1F08",subtle:"#FFD9B0",
    gradient:"linear-gradient(160deg,#FFFCF8 0%,#FFF3E0 50%,#FFF8F0 100%)",
    navBg:"#B85C1A",navText:"#FFFFFF",swatch:"#B85C1A",label:"Warm Beige",
  },
  dark: {
    bg:"#111827",surface:"#1F2937",card:"#273447",
    primary:"#93C5FD",accent:"#BFDBFE",muted:"#6B8EBF",
    text:"#E2EAF4",subtle:"#2D3F55",
    gradient:"linear-gradient(160deg,#0F172A 0%,#111827 50%,#0F172A 100%)",
    navBg:"#0F172A",navText:"#E2EAF4",swatch:"#93C5FD",label:"Dark Comfort",
  },
};

/* ─── Severity config ─────────────────────────────────────────────────────────── */
const SEVERITY_CFG = {
  critical:{
    label:"Critical",icon:"🚨",
    bg:"rgba(220,38,38,0.08)",border:"rgba(220,38,38,0.30)",
    color:"#DC2626",bar:"#DC2626",
    desc:"Your responses indicate severe emotional distress. Immediate professional support is strongly recommended — please reach out today.",
    consultType:"In-Clinic (Offline)",urgency:"Seek help today",
  },
  moderate:{
    label:"Moderate",icon:"⚠️",
    bg:"rgba(245,158,11,0.08)",border:"rgba(245,158,11,0.30)",
    color:"#D97706",bar:"#F59E0B",
    desc:"Your responses suggest moderate stress or emotional strain. A timely consultation will provide significant relief and prevent escalation.",
    consultType:"Online or In-Clinic",urgency:"Within 1–2 weeks",
  },
  mild:{
    label:"Mild",icon:"💛",
    bg:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.30)",
    color:"#059669",bar:"#10B981",
    desc:"You're experiencing mild discomfort. Proactive self-care habits and light professional guidance can keep things balanced.",
    consultType:"Online Consultation",urgency:"When convenient",
  },
  stable:{
    label:"Stable",icon:"✅",
    bg:"rgba(34,85,164,0.06)",border:"rgba(34,85,164,0.20)",
    color:"#2255A4",bar:"#2255A4",
    desc:"You appear to be in a stable, healthy state. Keep up your wellness practices and check in periodically.",
    consultType:"Online (routine)",urgency:"Routine check-up",
  },
};

/* ─── Global CSS ─────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif}

  @keyframes drift1{0%{transform:translate(0,0) scale(1)}33%{transform:translate(28px,-52px) scale(1.06)}66%{transform:translate(-18px,28px) scale(0.96)}100%{transform:translate(0,0) scale(1)}}
  @keyframes drift2{0%{transform:translate(0,0) scale(1)}40%{transform:translate(-42px,58px) scale(1.08)}80%{transform:translate(18px,-28px) scale(0.94)}100%{transform:translate(0,0) scale(1)}}
  @keyframes drift3{0%{transform:translate(0,0) scale(1)}50%{transform:translate(48px,38px) scale(1.1)}100%{transform:translate(0,0) scale(1)}}
  @keyframes drift4{0%{transform:translate(0,0) scale(1)}45%{transform:translate(-28px,-58px) scale(1.05)}100%{transform:translate(0,0) scale(1)}}
  @keyframes drift5{0%{transform:translate(0,0) scale(1)}55%{transform:translate(58px,-18px) scale(1.07)}100%{transform:translate(0,0) scale(1)}}

  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes dropDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes overlayIn{from{opacity:0}to{opacity:1}}
  @keyframes modalIn{from{opacity:0;transform:scale(.93) translateY(22px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes slideRowIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes barGrow{from{width:0%}to{width:var(--bw)}}
  @keyframes successPop{0%{transform:scale(0.55)}70%{transform:scale(1.12)}100%{transform:scale(1)}}
  @keyframes scanLine{0%{top:-4px}100%{top:105%}}
  @keyframes dotBlink{0%,80%,100%{opacity:0}40%{opacity:1}}
  @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 8px rgba(100,150,255,.15)}50%{box-shadow:0 0 52px 6px rgba(100,150,255,.32)}}
  @keyframes spinAnim{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

  .chip-el{transition:all .2s;cursor:pointer;user-select:none}
  .chip-el:hover{transform:translateY(-2px)}
  .cta-btn{transition:all .22s;cursor:pointer}
  .cta-btn:hover{transform:translateY(-2px);opacity:.92}
  .nav-btn{transition:background .2s;cursor:pointer}
  .nav-btn:hover{background:rgba(255,255,255,0.22)!important}
  .palette-row{transition:background .15s;cursor:pointer;border-radius:10px}
  .palette-row:hover{background:rgba(128,128,128,.08)!important}
  .rec-card{transition:all .22s}
  .rec-card:hover{transform:translateY(-3px)}
  select:focus,textarea:focus{outline:none}
  input[type=range]{-webkit-appearance:none;width:100%;height:5px;border-radius:99px;cursor:pointer;outline:none}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;transition:transform .2s}
  input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.25)}
  ::placeholder{opacity:.45}
`;

/* ─── Bubble Canvas ──────────────────────────────────────────────────────────── */
function BubbleCanvas({primary}) {
  const B=[
    {w:460,h:460,top:"-12%",left:"-10%",a:"drift1 24s ease-in-out infinite",o:.055},
    {w:340,h:340,top:"58%",left:"72%",a:"drift2 30s ease-in-out infinite",o:.05},
    {w:280,h:280,top:"28%",left:"52%",a:"drift3 36s ease-in-out infinite",o:.045},
    {w:220,h:220,top:"68%",left:"8%",a:"drift4 28s ease-in-out infinite",o:.06},
    {w:190,h:190,top:"4%",left:"68%",a:"drift5 32s ease-in-out infinite",o:.05},
    {w:140,h:140,top:"44%",left:"88%",a:"drift1 40s ease-in-out infinite reverse",o:.045},
    {w:100,h:100,top:"82%",left:"50%",a:"drift3 22s ease-in-out infinite reverse",o:.04},
  ];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {B.map((b,i)=>(
        <div key={i} style={{position:"absolute",width:b.w,height:b.h,top:b.top,left:b.left,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%,${primary}2A,${primary}06)`,border:`1px solid ${primary}18`,opacity:b.o,animation:b.a,transition:"background .5s,border .5s"}}/>
      ))}
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────────── */
function Navbar({T,themeKey,setThemeKey}) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const navigate=useNavigate();
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  const nb={display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.13)",backdropFilter:"blur(10px)",border:"1.5px solid rgba(255,255,255,0.28)",borderRadius:10,padding:"8px 18px",color:T.navText,fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"0.84rem",letterSpacing:".03em"};
  return (
    <nav style={{position:"sticky",top:0,zIndex:50,background:T.navBg,padding:"13px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",transition:"background .45s"}}>
      <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.25rem",fontStyle:"italic",color:T.navText,opacity:.92,letterSpacing:".01em"}}>Baymaxify</span>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button className="nav-btn" style={nb} onClick={()=>navigate("/home")}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L10 3l7 6.5"/><path d="M5 8.5v8h3.5v-4.5h3V16.5H15v-8"/></svg>Home
        </button>
        <div ref={ref} style={{position:"relative"}}>
          <button className="nav-btn" style={nb} onClick={()=>setOpen(p=>!p)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/><circle cx="8" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="14" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="13" r="1.2" fill="currentColor" stroke="none"/></svg>
            Palette
            <svg width="9" height="9" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={open?"M1 5l4-4 4 4":"M1 1l4 4 4-4"}/></svg>
          </button>
          {open&&(
            <div style={{position:"absolute",top:"calc(100% + 10px)",right:0,background:T.surface,border:`1px solid ${T.subtle}`,borderRadius:16,padding:8,width:218,boxShadow:"0 20px 56px rgba(0,0,0,.18)",animation:"dropDown .18s ease both",zIndex:100}}>
              {Object.entries(THEMES).map(([key,th])=>(
                <div key={key} className="palette-row" onClick={()=>{setThemeKey(key);setOpen(false)}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:key===themeKey?`${T.primary}14`:"transparent"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:th.swatch,flexShrink:0,boxShadow:key===themeKey?`0 0 0 3px ${th.swatch}44`:"none"}}/>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.88rem",fontWeight:key===themeKey?600:400,color:T.text}}>{th.label}</span>
                  {key===themeKey&&<svg style={{marginLeft:"auto"}} width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={T.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-6"/></svg>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ─── FieldLabel & Divider ───────────────────────────────────────────────────── */
function FieldLabel({T,children}) {
  return <div style={{fontWeight:500,fontSize:"0.72rem",letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted,marginBottom:10}}>{children}</div>;
}
function Divider({T}) {
  return <div style={{height:1,background:`${T.primary}14`,margin:"30px 0"}}/>;
}

/* ─── Analysis Overlay ───────────────────────────────────────────────────────── */
function AnalysisOverlay({T,progress}) {
  const steps=["Reading emotional patterns","Evaluating intensity signals","Mapping trigger factors","Generating health summary","Finding best doctors"];
  const activeStep=Math.floor((progress/100)*steps.length);
  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.6)",backdropFilter:"blur(7px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"overlayIn .25s ease both"}}>
      <div style={{background:T.surface,borderRadius:28,width:"100%",maxWidth:420,border:`1px solid ${T.subtle}`,boxShadow:"0 40px 100px rgba(0,0,0,.32)",padding:"44px 40px",textAlign:"center",animation:"modalIn .3s cubic-bezier(.25,.8,.25,1) both"}}>

        {/* Scanner sphere */}
        <div style={{width:86,height:86,borderRadius:"50%",background:`${T.primary}12`,border:`3px solid ${T.primary}28`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px",position:"relative",overflow:"hidden"}}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          {/* Scan line */}
          <div style={{position:"absolute",left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.primary},transparent)`,animation:"scanLine 1.6s ease-in-out infinite",top:0,pointerEvents:"none"}}/>
        </div>

        <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.3rem",color:T.accent,fontWeight:400,marginBottom:8}}>Analysing your check-in…</h3>
        <p style={{fontSize:"0.82rem",color:T.muted,lineHeight:1.65,marginBottom:26}}>We're building your mental health summary and matching the right care for you.</p>

        {/* Progress bar */}
        <div style={{height:8,borderRadius:99,background:T.subtle,overflow:"hidden",marginBottom:10}}>
          <div style={{"--bw":`${progress}%`,height:"100%",borderRadius:99,background:`linear-gradient(90deg,${T.primary},${T.primary}88)`,width:`${progress}%`,transition:"width .2s ease"}}/>
        </div>
        <p style={{fontSize:"0.75rem",color:T.primary,fontWeight:600,marginBottom:22}}>{Math.round(progress)}% complete</p>

        {/* Step list */}
        <div style={{display:"flex",flexDirection:"column",gap:8,textAlign:"left"}}>
          {steps.map((s,i)=>{
            const done=i<activeStep;
            const active=i===activeStep;
            return (
              <div key={s} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:active?`${T.primary}0E`:done?`${T.primary}06`:"transparent",border:`1px solid ${active?T.primary+"30":done?T.primary+"15":T.subtle}`,transition:"all .3s"}}>
                <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:done?T.primary:active?`${T.primary}20`:T.subtle,transition:"all .3s"}}>
                  {done
                    ?<svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-6"/></svg>
                    :active
                      ?<div style={{width:6,height:6,borderRadius:"50%",background:T.primary,animation:"dotBlink .8s ease-in-out infinite"}}/>
                      :<div style={{width:5,height:5,borderRadius:"50%",background:T.muted,opacity:.4}}/>
                  }
                </div>
                <span style={{fontSize:"0.78rem",color:done?T.primary:active?T.text:T.muted,fontWeight:active||done?600:400,transition:"all .3s"}}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Severity Result Modal ───────────────────────────────────────────────────── */
function doctorInitials(name) {
  const words = String(name || "").replace(/^Dr\.?\s*/i, "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function consultTypeLabel(ct) {
  const c = String(ct || "").toLowerCase();
  if (c === "immediate") return "Urgent / immediate";
  if (c === "offline") return "In-clinic";
  if (c === "online") return "Online";
  return ct || "";
}

function modeColorFromConsult(ct) {
  const c = String(ct || "").toLowerCase();
  if (c === "online") return { background: "rgba(16,185,129,.12)", color: "#059669" };
  if (c === "offline") return { background: "rgba(239,68,68,.1)", color: "#DC2626" };
  if (c === "immediate") return { background: "rgba(220,38,38,.12)", color: "#DC2626" };
  return { background: "rgba(34,85,164,.1)", color: "#2255A4" };
}

function SeverityModal({T,result,onClose}) {
  const { severity, summary, emotions, intensity, trigger, impact, notes, doctors = [], consultType, urgency } = result;
  const cfg = SEVERITY_CFG[severity];
  const docs = doctors;
  const maxScore = 12;
  const scoreMap = { critical: 10, moderate: 7, mild: 3, stable: 0 };
  const score = scoreMap[severity] + Math.floor(Math.random() * 2);
  const pct = Math.min(Math.round((score / maxScore) * 100), 100);

  const consultBadge = modeColorFromConsult(consultType);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.62)",backdropFilter:"blur(7px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"overlayIn .22s ease both",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:28,width:"100%",maxWidth:600,border:`1px solid ${T.subtle}`,boxShadow:"0 44px 110px rgba(0,0,0,.34)",animation:"modalIn .32s cubic-bezier(.25,.8,.25,1) both",overflow:"hidden",margin:"auto"}}>

        {/* ── Severity stripe ── */}
        <div style={{background:cfg.bg,borderBottom:`2px solid ${cfg.border}`,padding:"28px 32px 22px",position:"relative",overflow:"hidden"}}>
          {/* Background watermark emoji */}
          <div style={{position:"absolute",right:18,top:-8,fontSize:"6rem",opacity:.07,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>{cfg.icon}</div>

          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{width:58,height:58,borderRadius:17,background:cfg.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.65rem",flexShrink:0,boxShadow:`0 6px 22px ${cfg.color}45`,animation:"successPop .42s cubic-bezier(.25,.8,.25,1) both"}}>{cfg.icon}</div>
              <div>
                <p style={{fontSize:"0.67rem",letterSpacing:".18em",textTransform:"uppercase",color:cfg.color,fontWeight:700,marginBottom:4}}>Mental Health Status</p>
                <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"2rem",fontWeight:400,color:cfg.color,lineHeight:1}}>{cfg.label}</h2>
              </div>
            </div>
            <button onClick={onClose} style={{background:"rgba(0,0,0,.06)",border:"none",borderRadius:10,width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:cfg.color,flexShrink:0,fontSize:"0.95rem"}}>✕</button>
          </div>

          {/* Severity bar */}
          <div style={{marginTop:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <span style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:cfg.color}}>Severity Level</span>
              <span style={{fontSize:"0.76rem",fontWeight:700,color:cfg.color}}>{score} / {maxScore}</span>
            </div>
            <div style={{height:10,borderRadius:99,background:"rgba(0,0,0,.08)",overflow:"hidden"}}>
              <div style={{"--bw":`${pct}%`,height:"100%",borderRadius:99,background:cfg.bar,width:`${pct}%`,animation:"barGrow .95s cubic-bezier(.25,.8,.25,1) .15s both"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
              {["Stable","Mild","Moderate","Critical"].map(l=>(
                <span key={l} style={{fontSize:"0.61rem",color:cfg.color,opacity:.6,fontWeight:500}}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{padding:"22px 32px",maxHeight:"60vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:18}}>

          {/* Description */}
          <div style={{background:T.card,border:`1px solid ${T.subtle}`,borderRadius:16,padding:"15px 18px"}}>
            <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Assessment Summary</p>
            <p style={{fontSize:"0.9rem",color:T.text,lineHeight:1.75}}>{summary || cfg.desc}</p>
          </div>

          {/* Survey summary recap */}
          <div>
            <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:T.muted,marginBottom:10}}>Your Check-In Snapshot</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {label:"Emotions",   value: emotions.length ? emotions.join(", ") : "Not selected"},
                {label:"Trigger",    value: trigger},
                {label:"Intensity",  value: `${intensity} / 10`},
                {label:"Impact",     value: impact},
              ].map((row,i)=>(
                <div key={row.label} style={{background:T.card,border:`1px solid ${T.subtle}`,borderRadius:12,padding:"11px 14px",animation:`slideRowIn .3s ease ${i*0.06}s both`}}>
                  <p style={{fontSize:"0.67rem",fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,marginBottom:4}}>{row.label}</p>
                  <p style={{fontSize:"0.84rem",fontWeight:600,color:T.text,lineHeight:1.35}}>{row.value}</p>
                </div>
              ))}
            </div>
            {notes && (
              <div style={{marginTop:8,background:T.card,border:`1px solid ${T.subtle}`,borderRadius:12,padding:"11px 14px"}}>
                <p style={{fontSize:"0.67rem",fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,marginBottom:4}}>Your Note</p>
                <p style={{fontSize:"0.84rem",color:T.text,lineHeight:1.6,fontStyle:"italic"}}>"{notes.length > 120 ? notes.substring(0,120)+"…" : notes}"</p>
              </div>
            )}
          </div>

          {/* Consult recommendation */}
          <div style={{background:`${cfg.color}09`,border:`1.5px solid ${cfg.border}`,borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:11,background:cfg.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:cfg.color,marginBottom:3}}>Recommended Consultation</p>
              <p style={{fontSize:"0.88rem",color:cfg.color,fontWeight:600}}>
                {consultTypeLabel(consultType) || cfg.consultType}
                <span style={{marginLeft:10,fontWeight:400,opacity:.75,fontSize:"0.82rem"}}>· {urgency || cfg.urgency}</span>
              </p>
            </div>
          </div>

          {/* Doctor recommendations — only doctors from the database who match recommended specialties */}
          <div>
            <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:T.muted,marginBottom:12}}>Matching doctors in our network</p>
            {docs.length === 0 ? (
              <p style={{fontSize:"0.86rem",color:T.muted,lineHeight:1.65,margin:0}}>
                No active doctors in the database match these specialty recommendations yet. You can still book from the Medical page or add doctors in the admin panel.
              </p>
            ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {docs.map((doc,i)=>{
                const rating = typeof doc.rating === "number" ? doc.rating.toFixed(1) : "—";
                const extra = [doc.location, doc.phone].filter(Boolean).join(" · ");
                const key = doc._id || doc.id || i;
                return (
                  <div key={key} className="rec-card" style={{background:T.card,border:`1.5px solid ${T.subtle}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 3px 12px rgba(0,0,0,.04)",animation:`slideRowIn .3s ease ${i*0.09+0.1}s both`}}>
                    <div style={{width:44,height:44,borderRadius:13,background:T.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.82rem",flexShrink:0,letterSpacing:".04em"}}>
                      {doctorInitials(doc.name)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
                        <p style={{fontWeight:600,fontSize:"0.88rem",color:T.text}}>{doc.name}</p>
                        <span style={{...consultBadge,borderRadius:99,padding:"2px 9px",fontSize:"0.68rem",fontWeight:700,letterSpacing:".05em"}}>{consultTypeLabel(consultType) || "Consult"}</span>
                      </div>
                      <p style={{fontSize:"0.76rem",color:T.muted,marginBottom:5}}>{doc.specialty}</p>
                      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:3}}>
                          <svg width="11" height="11" viewBox="0 0 20 20" fill={T.primary} stroke={T.primary} strokeWidth="1"><path d="M10 1l2.7 5.6L19 7.6l-4.5 4.4 1.1 6.3L10 15.4l-5.6 2.9 1.1-6.3L1 7.6l6.3-.9L10 1z"/></svg>
                          <span style={{fontSize:"0.72rem",fontWeight:600,color:T.primary}}>{rating}</span>
                        </div>
                        {extra ? (
                          <span style={{fontSize:"0.72rem",color:T.muted}}>{extra}</span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      onClick={()=>{/* TODO: navigate to booking */}}
                      style={{background:T.primary,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",flexShrink:0,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.76rem",cursor:"pointer",boxShadow:`0 4px 14px ${T.primary}38`,transition:"all .18s"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                      Book
                    </button>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Disclaimer */}
          <div style={{background:T.card,border:`1px solid ${T.subtle}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"flex-start",gap:10}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:2}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{fontSize:"0.75rem",color:T.muted,lineHeight:1.65}}>This is a guidance tool only and does not replace professional medical diagnosis. If you are in immediate distress, call <strong style={{color:T.text}}>9152987821</strong>.</p>
          </div>
        </div>

        {/* ── Footer buttons ── */}
        <div style={{padding:"14px 32px 24px",borderTop:`1px solid ${T.subtle}`,display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,background:T.card,color:T.text,border:`1.5px solid ${T.subtle}`,borderRadius:12,padding:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"0.86rem",cursor:"pointer"}}>Close</button>
          <button
            onClick={onClose}
            style={{flex:2,background:cfg.color,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.86rem",cursor:"pointer",boxShadow:`0 5px 20px ${cfg.color}45`,transition:"all .2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            Book a Recommended Doctor
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main SurveyPage ────────────────────────────────────────────────────────── */
export default function SurveyPage() {
  const {themeKey,setThemeKey}=useContext(ThemeContext);

  /* form state */
  const [emotions,   setEmotions]   = useState([]);
  const [trigger,    setTrigger]    = useState("Academic / Work pressure");
  const [intensity,  setIntensity]  = useState(5);
  const [impact,     setImpact]     = useState("Difficulty focusing");
  const [notes,      setNotes]      = useState("");

  /* flow state */
  const [analysing,  setAnalysing]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [result,     setResult]     = useState(null);   // populated after analysis
  const [surveyDone, setSurveyDone] = useState(false);

  /* breathing */
  const [breathPhase, setBreathPhase] = useState(null);
  const [breathScale, setBreathScale] = useState(1);
  const ivRef  = useRef(null);
  const progRef = useRef(null);

  const T = THEMES[themeKey];

  const toggleEmotion = (e) =>
    setEmotions(p => p.includes(e) ? p.filter(x => x !== e) : [...p, e]);

  /* ── Complete Check-In handler ── */
  const handleCheckIn = async () => {
    setAnalysing(true);
    setProgress(0);

    /* Animate progress bar while waiting for Gemini */
    let p = 0;
    progRef.current = setInterval(() => {
      p += Math.random() * 8 + 3;
      if (p >= 90) p = 90; // hold at 90% until API responds
      setProgress(Math.round(p));
    }, 120);

    try {
      /* Call real backend — Gemini analyses the survey */
      const data = await submitSurvey({ emotions, trigger, intensity, impact, notes });

      clearInterval(progRef.current);
      setProgress(100);

      setTimeout(() => {
        setAnalysing(false);
        setProgress(0);
        setSurveyDone(true);
        setResult({
          severity:    data.severity,
          summary:     data.summary,
          consultType: data.consultType,
          urgency:     data.urgency,
          doctors:     data.doctors || [],
          emotions,
          trigger,
          intensity,
          impact,
          notes,
        });
      }, 400);
    } catch (err) {
      clearInterval(progRef.current);
      setAnalysing(false);
      setProgress(0);
      const msg =
        (err && err.message) ||
        "Could not complete check-in. Please try again.";
      alert(msg);
    }
  };

  useEffect(() => () => {
    clearInterval(ivRef.current);
    clearInterval(progRef.current);
  }, []);

  /* breathing */
  const startBreathing = () => {
    clearInterval(ivRef.current);
    const phases = ["Inhale","Hold","Exhale","Hold"];
    let i = 0;
    setBreathPhase(phases[0]);
    setBreathScale(1.5);
    ivRef.current = setInterval(() => {
      i = (i + 1) % 4;
      setBreathPhase(phases[i]);
      if (i === 0) setBreathScale(1.5);
      if (i === 2) setBreathScale(1);
    }, 4000);
    setTimeout(() => {
      clearInterval(ivRef.current);
      setBreathPhase(null);
      setBreathScale(1);
    }, 60000);
  };

  const breathHint = {
    Inhale:"Breathe in slowly and steadily through the nose",
    Hold:"Hold — still, calm, and fully present",
    Exhale:"Release gently and completely through the mouth",
  };

  const emotionList = ["Calm","Overwhelmed","Anxious","Sad","Irritated","Motivated"];

  const selectStyle = {
    width:"100%",border:`1.5px solid ${T.subtle}`,borderRadius:12,
    padding:"11px 40px 11px 16px",background:T.surface,color:T.text,
    fontSize:"0.92rem",fontFamily:"'DM Sans',sans-serif",
    appearance:"none",WebkitAppearance:"none",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat",backgroundPosition:"right 16px center",
    boxShadow:"0 2px 8px rgba(0,0,0,.03)",transition:"border .2s",cursor:"pointer",
  };

  const card = {
    background:T.surface,borderRadius:24,border:`1px solid ${T.subtle}`,
    boxShadow:"0 8px 48px rgba(0,0,0,.06),0 2px 16px rgba(0,0,0,.04)",
    transition:"background .4s,border .4s,box-shadow .4s",
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        input[type=range]::-webkit-slider-runnable-track{background:${T.subtle};border-radius:99px}
        input[type=range]::-webkit-slider-thumb{background:${T.primary};box-shadow:0 2px 10px ${T.primary}70}
      `}</style>

      <BubbleCanvas primary={T.primary}/>

      <div style={{minHeight:"100vh",background:T.gradient,color:T.text,transition:"background .45s",position:"relative",zIndex:1}}>

        <Navbar T={T} themeKey={themeKey} setThemeKey={setThemeKey}/>

        <div style={{padding:"56px 20px 100px",position:"relative",zIndex:1}}>
          <div style={{maxWidth:720,margin:"0 auto"}}>

            {/* Page header */}
            <div style={{textAlign:"center",marginBottom:52,animation:"fadeSlideUp .55s ease both"}}>
              <p style={{fontWeight:500,fontSize:"0.7rem",letterSpacing:"0.2em",textTransform:"uppercase",color:T.muted,marginBottom:14}}>Daily Check-In</p>
              <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2rem,5vw,2.9rem)",fontWeight:400,color:T.accent,lineHeight:1.15,transition:"color .4s"}}>Wellness Survey</h1>
              <div style={{width:48,height:3,borderRadius:99,background:T.primary,opacity:.45,margin:"18px auto 0",transition:"background .4s"}}/>
            </div>

            {/* ── Form card ── */}
            <div style={{...card,padding:"44px 48px",marginBottom:20,animation:"fadeSlideUp .6s ease .08s both"}}>

              <p style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.08rem",fontStyle:"italic",color:T.muted,textAlign:"center",marginBottom:36}}>
                Understand Your Current State
              </p>

              {/* Emotional chips */}
              <FieldLabel T={T}>Emotional State</FieldLabel>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(118px,1fr))",gap:9}}>
                {emotionList.map(item=>{
                  const active=emotions.includes(item);
                  return (
                    <div key={item} className="chip-el" onClick={()=>toggleEmotion(item)} style={{padding:"10px 12px",borderRadius:12,textAlign:"center",fontSize:"0.86rem",fontWeight:active?600:400,background:active?T.primary:T.card,color:active?"#fff":T.text,border:`1.5px solid ${active?T.primary:T.subtle}`,transition:"all .2s"}}>
                      {item}
                    </div>
                  );
                })}
              </div>

              <Divider T={T}/>

              {/* Primary Trigger */}
              <FieldLabel T={T}>Primary Trigger</FieldLabel>
              <select value={trigger} onChange={e=>setTrigger(e.target.value)} style={selectStyle}>
                {["Academic / Work pressure","Relationships","Health concerns","Lack of sleep","No specific reason"].map(o=><option key={o}>{o}</option>)}
              </select>

              <Divider T={T}/>

              {/* Intensity */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}}>
                <FieldLabel T={T}>Intensity Level</FieldLabel>
                <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"2rem",color:T.primary,lineHeight:1,marginBottom:10,transition:"color .4s"}}>
                  {intensity}<span style={{fontSize:".75rem",color:T.muted,fontFamily:"'DM Sans',sans-serif"}}>&thinsp;/ 10</span>
                </span>
              </div>
              <input type="range" min="1" max="10" value={intensity} onChange={e=>setIntensity(Number(e.target.value))} style={{marginBottom:8}}/>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                  <span key={n} style={{fontSize:".66rem",fontWeight:n===intensity?700:400,color:n<=intensity?T.primary:`${T.muted}55`,transition:"color .2s"}}>{n}</span>
                ))}
              </div>

              <Divider T={T}/>

              {/* Impact */}
              <FieldLabel T={T}>Impact on You</FieldLabel>
              <select value={impact} onChange={e=>setImpact(e.target.value)} style={selectStyle}>
                {["Difficulty focusing","Low motivation","Physical tension","Racing thoughts","Emotional withdrawal"].map(o=><option key={o}>{o}</option>)}
              </select>

              <Divider T={T}/>

              {/* Notes */}
              <FieldLabel T={T}>What happened today?</FieldLabel>
              <textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="Write freely — this is your private space."
                style={{width:"100%",border:`1.5px solid ${T.subtle}`,borderRadius:14,padding:"14px 16px",background:T.surface,color:T.text,fontSize:"0.92rem",fontFamily:"'DM Sans',sans-serif",lineHeight:1.75,resize:"vertical",transition:"border .2s,background .4s,color .4s",boxShadow:"0 2px 8px rgba(0,0,0,.03)"}}/>

              {/* Submit */}
              <div style={{textAlign:"center",marginTop:38}}>
                <button className="cta-btn" onClick={handleCheckIn} disabled={analysing}
                  style={{background:T.primary,color:"#fff",border:"none",borderRadius:14,padding:"15px 54px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.92rem",letterSpacing:".05em",boxShadow:`0 8px 28px ${T.primary}45`,transition:"background .4s,box-shadow .4s",display:"inline-flex",alignItems:"center",gap:10,cursor:analysing?"not-allowed":"pointer",opacity:analysing?.7:1}}>
                  {analysing
                    ?<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".7s" repeatCount="indefinite"/></path></svg>Analysing…</>
                    :<><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Complete Check-In</>
                  }
                </button>
              </div>
            </div>

            {/* Feedback card */}
            <div style={{...card,background:surveyDone?T.primary:T.surface,padding:"28px 36px",textAlign:"center",marginBottom:20,boxShadow:surveyDone?`0 14px 44px ${T.primary}45`:"0 4px 20px rgba(0,0,0,.04)",animation:"fadeSlideUp .65s ease .16s both"}}>
              {surveyDone
                ?<><p style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.12rem",fontStyle:"italic",color:"#fff",marginBottom:8}}>Thank you for checking in.</p><p style={{color:"rgba(255,255,255,.72)",fontSize:".86rem",margin:0}}>Your awareness is a powerful first step toward balance.</p></>
                :<p style={{color:T.muted,fontSize:".86rem",margin:0}}>Complete the check-in above to receive personalised guidance.</p>
              }
            </div>

            {/* Breathing card */}
            <div style={{...card,padding:"48px 48px",textAlign:"center",animation:"fadeSlideUp .7s ease .24s both"}}>
              <p style={{fontWeight:500,fontSize:"0.7rem",letterSpacing:"0.2em",textTransform:"uppercase",color:T.muted,marginBottom:12}}>Mindfulness</p>
              <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.7rem",fontWeight:400,color:T.accent,marginBottom:10,transition:"color .4s"}}>4 · 4 · 4 · 4 Breathing</h2>
              <p style={{color:T.muted,fontSize:".87rem",lineHeight:1.75,maxWidth:460,margin:"0 auto",marginBottom:breathPhase?40:36}}>
                Inhale for 4 counts, hold for 4, exhale for 4, hold for 4 —<br/>a clinically-backed method to reduce stress instantly.
              </p>
              {breathPhase&&(
                <div style={{marginBottom:36}}>
                  <div style={{width:150,height:150,borderRadius:"50%",background:`radial-gradient(circle at 36% 34%,${T.primary}CC,${T.accent})`,margin:"0 auto 50px",transform:`scale(${breathScale})`,transition:"transform 4s ease-in-out,background .5s",animation:"pulseGlow 4s ease-in-out infinite"}}/>
                  <p style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.5rem",fontStyle:"italic",color:T.primary,marginTop:16,marginBottom:6,transition:"color .4s"}}>{breathPhase}</p>
                  <p style={{color:T.muted,fontSize:".82rem"}}>{breathHint[breathPhase]}</p>
                </div>
              )}
              <button className="cta-btn" onClick={startBreathing} style={{background:breathPhase?"transparent":T.primary,color:breathPhase?T.primary:"#fff",border:`2px solid ${T.primary}`,borderRadius:14,padding:"14px 46px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.9rem",letterSpacing:".05em",boxShadow:breathPhase?"none":`0 6px 24px ${T.primary}45`,transition:"all .3s"}}>
                {breathPhase?"Restart Session":"Begin Breathing Session"}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Analysis overlay */}
      {analysing && <AnalysisOverlay T={T} progress={progress}/>}

      {/* Severity result modal */}
      {result && <SeverityModal T={T} result={result} onClose={()=>setResult(null)}/>}
    </>
  );
}