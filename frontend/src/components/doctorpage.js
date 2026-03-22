import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";
import {
  getDoctorOnlineAppointments, getDoctorOfflineAppointments,
  updateAppointmentStatus, writePrescription, getUser,
} from "../api";

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

/* ─── CSS ────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif}

  @keyframes drift1{0%{transform:translate(0,0) scale(1)}33%{transform:translate(28px,-52px) scale(1.06)}66%{transform:translate(-18px,28px) scale(0.96)}100%{transform:translate(0,0) scale(1)}}
  @keyframes drift2{0%{transform:translate(0,0) scale(1)}40%{transform:translate(-42px,58px) scale(1.08)}80%{transform:translate(18px,-28px) scale(0.94)}100%{transform:translate(0,0) scale(1)}}
  @keyframes drift3{0%{transform:translate(0,0) scale(1)}50%{transform:translate(48px,38px) scale(1.1)}100%{transform:translate(0,0) scale(1)}}
  @keyframes drift4{0%{transform:translate(0,0) scale(1)}45%{transform:translate(-28px,-58px) scale(1.05)}100%{transform:translate(0,0) scale(1)}}
  @keyframes drift5{0%{transform:translate(0,0) scale(1)}55%{transform:translate(58px,-18px) scale(1.07)}100%{transform:translate(0,0) scale(1)}}
  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes dropDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes overlayIn{from{opacity:0}to{opacity:1}}
  @keyframes rowIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}

  .nav-btn{transition:background .2s;cursor:pointer}
  .nav-btn:hover{background:rgba(255,255,255,0.22)!important}
  .palette-row{transition:background .15s;cursor:pointer;border-radius:10px}
  .palette-row:hover{background:rgba(128,128,128,.08)!important}
  .tab-pill{transition:all .2s;cursor:pointer}
  .row-card{transition:all .2s;cursor:pointer}
  .row-card:hover{transform:translateX(3px)}
  .icon-btn{transition:all .18s;cursor:pointer}
  .icon-btn:hover{transform:scale(1.1)}
  .med-row-del{transition:all .18s;cursor:pointer;opacity:.5}
  .med-row-del:hover{opacity:1;transform:scale(1.1)}
  input:focus,select:focus,textarea:focus{outline:none}
`;

/* ─── Bubble Canvas ──────────────────────────────────────────────────────────── */
function BubbleCanvas({ primary }) {
  const B = [
    {w:460,h:460,top:"-12%",left:"-10%",a:"drift1 24s ease-in-out infinite",o:.045},
    {w:340,h:340,top:"58%",left:"72%",a:"drift2 30s ease-in-out infinite",o:.04},
    {w:280,h:280,top:"28%",left:"52%",a:"drift3 36s ease-in-out infinite",o:.035},
    {w:220,h:220,top:"68%",left:"8%",a:"drift4 28s ease-in-out infinite",o:.05},
    {w:190,h:190,top:"4%",left:"68%",a:"drift5 32s ease-in-out infinite",o:.04},
    {w:140,h:140,top:"44%",left:"88%",a:"drift1 40s ease-in-out infinite reverse",o:.035},
  ];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {B.map((b,i)=>(
        <div key={i} style={{
          position:"absolute",width:b.w,height:b.h,top:b.top,left:b.left,
          borderRadius:"50%",
          background:`radial-gradient(circle at 35% 30%,${primary}28,${primary}05)`,
          border:`1px solid ${primary}15`,opacity:b.o,animation:b.a,
        }}/>
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
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  const nb={
    display:"flex",alignItems:"center",gap:7,
    background:"rgba(255,255,255,0.13)",backdropFilter:"blur(10px)",
    border:"1.5px solid rgba(255,255,255,0.28)",borderRadius:10,
    padding:"8px 18px",color:T.navText,
    fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"0.84rem",letterSpacing:".03em",
  };
  return (
    <nav style={{position:"sticky",top:0,zIndex:50,background:T.navBg,padding:"13px 36px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",transition:"background .45s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.3rem",fontStyle:"italic",color:T.navText,opacity:.92}}>Baymaxify</span>
        <span style={{background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.28)",borderRadius:99,padding:"3px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:".1em",color:T.navText,textTransform:"uppercase"}}>Doctor</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{...nb,pointerEvents:"none",opacity:.85,gap:8}}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="7" r="3.5"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>
          Dr. Priya Menon
        </div>
        <div ref={ref} style={{position:"relative"}}>
          <button className="nav-btn" style={nb} onClick={()=>setOpen(p=>!p)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/><circle cx="8" cy="13" r="1.1" fill="currentColor" stroke="none"/><circle cx="10" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="14" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="13" r="1.1" fill="currentColor" stroke="none"/></svg>
            Palette
            <svg width="8" height="8" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={open?"M1 5l4-4 4 4":"M1 1l4 4 4-4"}/></svg>
          </button>
          {open&&(
            <div style={{position:"absolute",top:"calc(100% + 10px)",right:0,background:T.surface,border:`1px solid ${T.subtle}`,borderRadius:16,padding:8,width:218,boxShadow:"0 20px 56px rgba(0,0,0,.2)",animation:"dropDown .18s ease both",zIndex:100}}>
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
        <button className="nav-btn" style={nb} onClick={()=>navigate("/")}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 15l4-4-4-4"/><path d="M17 11H8"/><path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/></svg>
          Logout
        </button>
      </div>
    </nav>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────────── */
function Toast({msg,type,T}) {
  const bg=type==="error"?"#EF4444":type==="warn"?"#F59E0B":T.primary;
  return (
    <div style={{position:"fixed",bottom:28,right:28,zIndex:600,background:bg,color:"#fff",borderRadius:14,padding:"12px 20px",fontFamily:"'DM Sans',sans-serif",fontSize:"0.84rem",fontWeight:500,boxShadow:`0 8px 28px ${bg}55`,animation:"toastIn .3s ease both",display:"flex",alignItems:"center",gap:8,maxWidth:320}}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      {msg}
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────────────────────────── */
function Badge({status,T}) {
  const map={
    waiting:   {bg:`${T.primary}18`,color:T.primary,   dot:T.primary,   label:"Waiting"},
    in_session:{bg:"rgba(16,185,129,.14)",color:"#059669",dot:"#10B981",label:"In Session"},
    completed: {bg:`${T.muted}18`,color:T.muted,       dot:T.muted,     label:"Completed"},
    scheduled: {bg:`${T.primary}18`,color:T.primary,   dot:T.primary,   label:"Scheduled"},
    cancelled: {bg:"rgba(239,68,68,.12)",color:"#DC2626",dot:"#EF4444", label:"Cancelled"},
  };
  const c=map[status]||{bg:T.card,color:T.muted,dot:T.muted,label:status};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,background:c.bg,color:c.color,borderRadius:99,padding:"4px 11px",fontSize:"0.72rem",fontWeight:600,letterSpacing:".05em",whiteSpace:"nowrap"}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:c.dot,flexShrink:0,animation:status==="in_session"?"pulse 1.8s ease-in-out infinite":"none"}}/>
      {c.label}
    </span>
  );
}

/* ─── Mock Data ──────────────────────────────────────────────────────────────── */
const ONLINE_PATIENTS = [
  {
    id:"PT-2025-001",name:"Amar Krishnan",age:28,gender:"Male",
    status:"in_session",joinedAt:"10:02 AM",
    currentComplaint:"Persistent anxiety, difficulty sleeping for the past 2 weeks. Feeling overwhelmed at work.",
    previousPrescriptions:[
      {date:"12 Jan 2025",medicines:["Escitalopram 10mg — 1×daily for 30 days","Melatonin 3mg — 1×nightly for 15 days"],remark:"Monitor for side effects. Follow up in 4 weeks."},
    ],
  },
  {
    id:"PT-2025-002",name:"Rahul Verma",age:34,gender:"Male",
    status:"waiting",joinedAt:"10:18 AM",
    currentComplaint:"Recurring panic attacks, chest tightness. Triggered by crowded spaces.",
    previousPrescriptions:[],
  },
  {
    id:"PT-2025-003",name:"Sneha Pillai",age:22,gender:"Female",
    status:"waiting",joinedAt:"10:35 AM",
    currentComplaint:"Low mood and fatigue. Struggling with motivation for the last month.",
    previousPrescriptions:[
      {date:"3 Sep 2024",medicines:["Sertraline 50mg — 1×daily for 30 days"],remark:"Continue if improvement. Re-evaluate in 6 weeks."},
    ],
  },
  {
    id:"PT-2025-004",name:"Meera Nair",age:45,gender:"Female",
    status:"completed",joinedAt:"9:15 AM",
    currentComplaint:"Stress management follow-up.",
    previousPrescriptions:[
      {date:"28 Nov 2024",medicines:["Propranolol 20mg — 1×as needed","B-Complex Forte — 1×daily"],remark:"Lifestyle modification advised."},
    ],
  },
];

const OFFLINE_APPOINTMENTS = [
  {id:"OA-001",patientName:"Suresh Kumar",   date:"2025-07-24",time:"09:00 AM",type:"In-Clinic",status:"completed"},
  {id:"OA-002",patientName:"Divya Thomas",   date:"2025-07-24",time:"09:30 AM",type:"In-Clinic",status:"completed"},
  {id:"OA-003",patientName:"Arjun Menon",    date:"2025-07-24",time:"10:00 AM",type:"In-Clinic",status:"scheduled"},
  {id:"OA-004",patientName:"Latha Suresh",   date:"2025-07-25",time:"11:00 AM",type:"In-Clinic",status:"scheduled"},
  {id:"OA-005",patientName:"Ravi Nambiar",   date:"2025-07-25",time:"02:00 PM",type:"In-Clinic",status:"scheduled"},
  {id:"OA-006",patientName:"Preethi Mohan",  date:"2025-07-26",time:"10:30 AM",type:"In-Clinic",status:"cancelled"},
  {id:"OA-007",patientName:"Jithin Raj",     date:"2025-07-28",time:"03:00 PM",type:"In-Clinic",status:"scheduled"},
  {id:"OA-008",patientName:"Ananya Gopalan", date:"2025-07-29",time:"09:00 AM",type:"In-Clinic",status:"scheduled"},
];

const MEDICINE_OPTIONS=[
  "Escitalopram 10mg","Escitalopram 20mg","Sertraline 50mg","Clonazepam 0.5mg",
  "Clonazepam 1mg","Melatonin 3mg","Propranolol 20mg","Amitriptyline 10mg",
  "Fluoxetine 20mg","Alprazolam 0.25mg","Buspirone 5mg","Zolpidem 5mg",
  "Mirtazapine 15mg","Quetiapine 25mg","B-Complex Forte","Vitamin D3 60K",
];
const FREQUENCY_OPTIONS=["Once daily","Twice daily","Thrice daily","Every 8 hours","As needed","Every night","Every morning","Every alternate day"];

/* ─── Prescription Builder ───────────────────────────────────────────────────── */
function PrescriptionBuilder({T,patient,onSubmit,onCancel}) {
  const [medicines,setMedicines]=useState([{id:Date.now(),name:MEDICINE_OPTIONS[0],days:"7",frequency:FREQUENCY_OPTIONS[0]}]);
  const [remark,setRemark]=useState("");
  const [submitting,setSubmitting]=useState(false);

  const addRow=()=>setMedicines(p=>[...p,{id:Date.now(),name:MEDICINE_OPTIONS[0],days:"",frequency:FREQUENCY_OPTIONS[0]}]);
  const removeRow=(id)=>setMedicines(p=>p.filter(m=>m.id!==id));
  const updateRow=(id,field,val)=>setMedicines(p=>p.map(m=>m.id===id?{...m,[field]:val}:m));

  const handleSubmit=async()=>{
    setSubmitting(true);
    const payload={
      patientId:patient.id,
      patientName:patient.name,
      doctorName:"Dr. Priya Menon",
      date:new Date().toISOString().split("T")[0],
      medicines:medicines.map(m=>({name:m.name,days:m.days,frequency:m.frequency})),
      remark,
    };
    /* TODO: POST /api/doctor/prescriptions  body: payload */
    console.log("Prescription payload →",payload);
    await new Promise(r=>setTimeout(r,800));
    setSubmitting(false);
    onSubmit(payload);
  };

  const iSty={
    background:T.card,border:`1.5px solid ${T.subtle}`,borderRadius:10,
    padding:"9px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:"0.84rem",
    color:T.text,transition:"border .15s",
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Column headers */}
      <div style={{
        display:"grid",gridTemplateColumns:"2.5fr 1fr 2fr 36px",gap:8,
        padding:"0 0 8px",marginBottom:4,
      }}>
        {["Medicine","Days","Frequency",""].map(h=>(
          <span key={h} style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted}}>{h}</span>
        ))}
      </div>

      {/* Medicine rows */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        {medicines.map((m,idx)=>(
          <div key={m.id} style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 2fr 36px",gap:8,alignItems:"center",animation:`rowIn .2s ease ${idx*0.05}s both`}}>
            <select value={m.name} onChange={e=>updateRow(m.id,"name",e.target.value)}
              style={{...iSty,cursor:"pointer",width:"100%",
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",
                appearance:"none",paddingRight:28,
              }}>
              {MEDICINE_OPTIONS.map(o=><option key={o}>{o}</option>)}
            </select>
            <input type="number" min="1" max="365" value={m.days}
              onChange={e=>updateRow(m.id,"days",e.target.value)}
              placeholder="Days"
              style={{...iSty,width:"100%",textAlign:"center"}}/>
            <select value={m.frequency} onChange={e=>updateRow(m.id,"frequency",e.target.value)}
              style={{...iSty,cursor:"pointer",width:"100%",
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",
                appearance:"none",paddingRight:28,
              }}>
              {FREQUENCY_OPTIONS.map(o=><option key={o}>{o}</option>)}
            </select>
            {medicines.length>1
              ? <button className="med-row-del" onClick={()=>removeRow(m.id)} style={{background:"rgba(239,68,68,.1)",border:"none",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#DC2626"}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              : <div style={{width:32}}/>
            }
          </div>
        ))}
      </div>

      {/* Add medicine row */}
      <button onClick={addRow} style={{
        display:"flex",alignItems:"center",gap:7,
        background:"transparent",color:T.primary,
        border:`1.5px dashed ${T.primary}60`,borderRadius:10,
        padding:"9px 14px",fontFamily:"'DM Sans',sans-serif",
        fontWeight:500,fontSize:"0.83rem",cursor:"pointer",
        transition:"all .18s",marginBottom:20,
        width:"fit-content",
      }}
        onMouseEnter={e=>e.currentTarget.style.background=`${T.primary}0E`}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Another Medicine
      </button>

      {/* Remark */}
      <div style={{marginBottom:20}}>
        <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>
          Doctor's Remark
        </label>
        <textarea value={remark} onChange={e=>setRemark(e.target.value)}
          placeholder="Add notes, dietary advice, follow-up instructions, or any special remarks for the patient…"
          rows={3}
          style={{
            width:"100%",background:T.card,border:`1.5px solid ${T.subtle}`,
            borderRadius:12,padding:"12px 14px",
            fontFamily:"'DM Sans',sans-serif",fontSize:"0.86rem",
            color:T.text,lineHeight:1.6,resize:"vertical",
          }}/>
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:10}}>
        <button onClick={onCancel} style={{
          flex:1,background:T.card,color:T.text,border:`1.5px solid ${T.subtle}`,
          borderRadius:12,padding:"11px",fontFamily:"'DM Sans',sans-serif",
          fontWeight:500,fontSize:"0.86rem",cursor:"pointer",
        }}>Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} style={{
          flex:2,background:submitting?T.muted:T.primary,color:"#fff",border:"none",
          borderRadius:12,padding:"11px",fontFamily:"'DM Sans',sans-serif",
          fontWeight:600,fontSize:"0.86rem",cursor:submitting?"not-allowed":"pointer",
          boxShadow:submitting?"none":`0 5px 18px ${T.primary}40`,
          transition:"all .2s",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
        }}>
          {submitting?(
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".7s" repeatCount="indefinite"/>
                </path>
              </svg>
              Submitting…
            </>
          ):(
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Submit Prescription
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Patient Detail Panel ───────────────────────────────────────────────────── */
function PatientDetailPanel({T,patient,onClose,onPrescribed}) {
  const [view,setView]=useState("summary"); // "summary" | "prescribe"
  const [toast,setToast]=useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800)};

  const handleSubmitPrescription=(payload)=>{
    showToast(`Prescription submitted for ${patient.name}`);
    setTimeout(()=>{ onPrescribed(patient.id); onClose(); },1200);
  };

  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:300,
      background:"rgba(0,0,0,.52)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:20,animation:"overlayIn .22s ease both",overflowY:"auto",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.surface,borderRadius:26,
        width:"100%",maxWidth:640,
        border:`1px solid ${T.subtle}`,
        boxShadow:"0 32px 80px rgba(0,0,0,.26)",
        animation:"modalIn .28s cubic-bezier(.25,.8,.25,1) both",
        overflow:"hidden",margin:"auto",
      }}>
        {/* Header */}
        <div style={{
          background:`linear-gradient(135deg,${T.primary}1C 0%,${T.primary}08 100%)`,
          borderBottom:`1px solid ${T.subtle}`,padding:"22px 28px 18px",
        }}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{
                width:48,height:48,borderRadius:14,background:T.primary,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"1rem",
                color:"#fff",flexShrink:0,letterSpacing:".04em",
              }}>
                {patient.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
              <div>
                <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.2rem",fontWeight:400,color:T.accent}}>{patient.name}</h3>
                <p style={{fontSize:"0.78rem",color:T.muted,marginTop:2}}>{patient.id} · {patient.age}y {patient.gender} · Joined {patient.joinedAt}</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Badge status={patient.status} T={T}/>
              <button onClick={onClose} style={{background:T.card,border:`1px solid ${T.subtle}`,borderRadius:10,width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontSize:"0.9rem",flexShrink:0}}>✕</button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div style={{display:"flex",gap:6,marginTop:18}}>
            {[
              {key:"summary",label:"Summary"},
              {key:"prescribe",label:"Prescribe"},
            ].map(t=>{
              const a=view===t.key;
              return (
                <button key={t.key} onClick={()=>setView(t.key)} style={{
                  background:a?T.primary:"transparent",
                  color:a?"#fff":T.muted,
                  border:`1.5px solid ${a?T.primary:T.subtle}`,
                  borderRadius:99,padding:"6px 16px",
                  fontFamily:"'DM Sans',sans-serif",fontWeight:a?600:400,
                  fontSize:"0.8rem",cursor:"pointer",transition:"all .18s",
                }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{padding:"26px 28px",maxHeight:"60vh",overflowY:"auto"}}>

          {/* ── Summary View ── */}
          {view==="summary"&&(
            <div style={{display:"flex",flexDirection:"column",gap:20,animation:"slideIn .25s ease both"}}>
              {/* Current complaint */}
              <div>
                <p style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:T.muted,marginBottom:10}}>Current Complaint</p>
                <div style={{background:T.card,border:`1px solid ${T.subtle}`,borderRadius:14,padding:"14px 16px"}}>
                  <p style={{fontSize:"0.9rem",color:T.text,lineHeight:1.7}}>{patient.currentComplaint}</p>
                </div>
              </div>

              {/* Previous prescriptions */}
              <div>
                <p style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:T.muted,marginBottom:10}}>
                  Previous Prescriptions
                  <span style={{background:`${T.primary}18`,color:T.primary,borderRadius:99,padding:"1px 8px",fontSize:"0.68rem",fontWeight:700,marginLeft:8}}>{patient.previousPrescriptions.length}</span>
                </p>
                {patient.previousPrescriptions.length===0?(
                  <div style={{background:T.card,border:`1.5px dashed ${T.subtle}`,borderRadius:14,padding:"20px",textAlign:"center",color:T.muted,fontSize:"0.84rem"}}>
                    No previous prescriptions on record
                  </div>
                ):patient.previousPrescriptions.map((rx,i)=>(
                  <div key={i} style={{background:T.card,border:`1px solid ${T.subtle}`,borderRadius:14,padding:"14px 16px",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <span style={{fontSize:"0.76rem",fontWeight:600,color:T.primary,background:`${T.primary}14`,borderRadius:99,padding:"3px 10px"}}>📅 {rx.date}</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                      {rx.medicines.map((m,j)=>(
                        <div key={j} style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:T.primary,flexShrink:0}}/>
                          <span style={{fontSize:"0.84rem",color:T.text}}>{m}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{borderTop:`1px solid ${T.subtle}`,paddingTop:8,marginTop:4}}>
                      <p style={{fontSize:"0.76rem",color:T.muted,fontStyle:"italic",lineHeight:1.6}}>
                        <span style={{fontWeight:600,color:T.accent,fontStyle:"normal"}}>Remark: </span>{rx.remark}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Go to prescribe */}
              <button onClick={()=>setView("prescribe")} style={{
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                background:T.primary,color:"#fff",border:"none",
                borderRadius:12,padding:"12px",
                fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.88rem",
                cursor:"pointer",boxShadow:`0 5px 18px ${T.primary}40`,
                transition:"all .2s",
              }}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="12" y1="10" x2="12" y2="16"/></svg>
                Write Prescription
              </button>
            </div>
          )}

          {/* ── Prescribe View ── */}
          {view==="prescribe"&&(
            <div style={{animation:"slideIn .25s ease both"}}>
              {/* Patient recap chip */}
              <div style={{
                display:"flex",alignItems:"center",gap:10,
                background:T.card,border:`1px solid ${T.subtle}`,
                borderRadius:12,padding:"10px 14px",marginBottom:20,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M3 21v-2a7 7 0 0 1 14 0v2"/></svg>
                <span style={{fontSize:"0.84rem",fontWeight:600,color:T.text}}>{patient.name}</span>
                <span style={{fontSize:"0.78rem",color:T.muted,marginLeft:4}}>{patient.age}y · {patient.gender}</span>
                <span style={{marginLeft:"auto",fontSize:"0.76rem",color:T.muted}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
              </div>
              <PrescriptionBuilder
                T={T}
                patient={patient}
                onSubmit={handleSubmitPrescription}
                onCancel={()=>setView("summary")}
              />
            </div>
          )}
        </div>
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} T={T}/>}
    </div>
  );
}

/* ─── Online Appointments Tab ────────────────────────────────────────────────── */
function OnlineAppointments({T}) {
  const [patients,setPatients]=useState(ONLINE_PATIENTS);
  const [selected,setSelected]=useState(null);
  const [toast,setToast]=useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800)};

  const handlePrescribed=(patientId)=>{
    setPatients(p=>p.map(pt=>pt.id===patientId?{...pt,status:"completed"}:pt));
    showToast("Prescription submitted successfully");
  };

  const waiting   =patients.filter(p=>p.status==="waiting").length;
  const inSession =patients.filter(p=>p.status==="in_session").length;
  const done      =patients.filter(p=>p.status==="completed").length;

  return (
    <div style={{animation:"slideIn .28s ease both"}}>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
        {[
          {label:"Waiting",   val:waiting,   color:T.primary},
          {label:"In Session",val:inSession, color:"#10B981"},
          {label:"Completed", val:done,      color:T.muted},
        ].map(s=>(
          <div key={s.label} style={{
            background:T.surface,border:`1px solid ${T.subtle}`,borderRadius:16,
            padding:"16px 18px",boxShadow:"0 4px 14px rgba(0,0,0,.04)",
            transition:"transform .2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
          >
            <p style={{fontSize:"1.7rem",fontWeight:700,color:s.color,fontFamily:"'DM Serif Display',serif"}}>{s.val}</p>
            <p style={{fontSize:"0.74rem",color:T.muted,marginTop:3,fontWeight:500}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Patient queue */}
      <div style={{background:T.surface,border:`1px solid ${T.subtle}`,borderRadius:20,overflow:"hidden",boxShadow:"0 6px 28px rgba(0,0,0,.05)"}}>
        {/* Table header */}
        <div style={{
          display:"grid",gridTemplateColumns:"2.5fr 1.2fr 1.5fr 3fr 1.2fr",
          padding:"12px 22px",background:`${T.primary}0C`,borderBottom:`1px solid ${T.subtle}`,
        }}>
          {["Patient","ID","Joined","Status","Action"].map(h=>(
            <span key={h} style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted}}>{h}</span>
          ))}
        </div>

        {patients.map((pt,i)=>(
          <div key={pt.id} className="row-card" style={{
            display:"grid",gridTemplateColumns:"2.5fr 1.2fr 1.5fr 3fr 1.2fr",
            padding:"16px 22px",alignItems:"center",
            borderBottom:i<patients.length-1?`1px solid ${T.subtle}`:"none",
            animation:`rowIn .22s ease ${i*0.05}s both`,
          }}>
            {/* Name + avatar */}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{
                width:36,height:36,borderRadius:10,
                background:pt.status==="in_session"?T.primary:`${T.primary}20`,
                color:pt.status==="in_session"?"#fff":T.primary,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.74rem",flexShrink:0,
                transition:"all .2s",
              }}>
                {pt.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
              <div>
                <p style={{fontWeight:600,fontSize:"0.87rem",color:T.text}}>{pt.name}</p>
                <p style={{fontSize:"0.73rem",color:T.muted,marginTop:1}}>{pt.age}y · {pt.gender}</p>
              </div>
            </div>
            {/* ID */}
            <span style={{fontSize:"0.78rem",color:T.muted,fontFamily:"monospace"}}>{pt.id}</span>
            {/* Joined */}
            <span style={{fontSize:"0.82rem",color:T.text}}>{pt.joinedAt}</span>
            {/* Status */}
            <Badge status={pt.status} T={T}/>
            {/* Action */}
            <button
              onClick={()=>setSelected(pt)}
              disabled={pt.status==="completed"}
              style={{
                background:pt.status==="completed"?T.card:T.primary,
                color:pt.status==="completed"?T.muted:"#fff",
                border:"none",borderRadius:10,padding:"7px 14px",
                fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.78rem",
                cursor:pt.status==="completed"?"not-allowed":"pointer",
                boxShadow:pt.status==="completed"?"none":`0 4px 14px ${T.primary}38`,
                transition:"all .18s",opacity:pt.status==="completed"?.6:1,
              }}>
              {pt.status==="completed"?"Done":"View"}
            </button>
          </div>
        ))}
      </div>

      {selected&&(
        <PatientDetailPanel
          T={T}
          patient={selected}
          onClose={()=>setSelected(null)}
          onPrescribed={handlePrescribed}
        />
      )}
      {toast&&<Toast msg={toast.msg} type={toast.type} T={T}/>}
    </div>
  );
}

/* ─── Offline Appointments Tab ───────────────────────────────────────────────── */
function OfflineAppointments({T}) {
  const [apts,setApts]=useState(OFFLINE_APPOINTMENTS);
  const [filterDate,setFilterDate]=useState("all");
  const [toast,setToast]=useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800)};

  const toggleComplete=(id)=>{
    setApts(p=>p.map(a=>{
      if(a.id!==id)return a;
      const ns=a.status==="completed"?"scheduled":"completed";
      /* TODO: PATCH /api/appointments/:id  body: { status: ns } */
      return {...a,status:ns};
    }));
    showToast("Appointment status updated");
  };

  // Get unique dates
  const dates=[...new Set(apts.map(a=>a.date))].sort();

  const filtered=apts.filter(a=>filterDate==="all"||a.date===filterDate);

  // Group by date
  const grouped=filtered.reduce((acc,a)=>{
    if(!acc[a.date])acc[a.date]=[];
    acc[a.date].push(a);
    return acc;
  },{});

  const fmtDate=(d)=>new Date(d).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  const total=apts.length;
  const completed=apts.filter(a=>a.status==="completed").length;
  const pending=apts.filter(a=>a.status==="scheduled").length;
  const cancelled=apts.filter(a=>a.status==="cancelled").length;

  return (
    <div style={{animation:"slideIn .28s ease both"}}>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        {[
          {label:"Total",    val:total,    color:T.primary},
          {label:"Completed",val:completed,color:"#10B981"},
          {label:"Pending",  val:pending,  color:"#F59E0B"},
          {label:"Cancelled",val:cancelled,color:"#EF4444"},
        ].map(s=>(
          <div key={s.label} style={{background:T.surface,border:`1px solid ${T.subtle}`,borderRadius:16,padding:"16px 18px",boxShadow:"0 4px 14px rgba(0,0,0,.04)",transition:"transform .2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
          >
            <p style={{fontSize:"1.7rem",fontWeight:700,color:s.color,fontFamily:"'DM Serif Display',serif"}}>{s.val}</p>
            <p style={{fontSize:"0.74rem",color:T.muted,marginTop:3,fontWeight:500}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Date filter chips */}
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        <button onClick={()=>setFilterDate("all")} style={{
          background:filterDate==="all"?T.primary:T.surface,
          color:filterDate==="all"?"#fff":T.muted,
          border:`1.5px solid ${filterDate==="all"?T.primary:T.subtle}`,
          borderRadius:99,padding:"6px 16px",
          fontFamily:"'DM Sans',sans-serif",fontWeight:filterDate==="all"?600:400,
          fontSize:"0.78rem",cursor:"pointer",transition:"all .16s",
        }}>All Dates</button>
        {dates.map(d=>(
          <button key={d} onClick={()=>setFilterDate(d)} style={{
            background:filterDate===d?T.primary:T.surface,
            color:filterDate===d?"#fff":T.muted,
            border:`1.5px solid ${filterDate===d?T.primary:T.subtle}`,
            borderRadius:99,padding:"6px 16px",
            fontFamily:"'DM Sans',sans-serif",fontWeight:filterDate===d?600:400,
            fontSize:"0.78rem",cursor:"pointer",transition:"all .16s",
            whiteSpace:"nowrap",
          }}>{new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</button>
        ))}
      </div>

      {/* Grouped appointment list */}
      <div style={{display:"flex",flexDirection:"column",gap:24}}>
        {Object.entries(grouped).map(([date,list])=>(
          <div key={date}>
            {/* Date group header */}
            <div style={{
              display:"flex",alignItems:"center",gap:12,marginBottom:12,
            }}>
              <div style={{
                background:T.primary,color:"#fff",borderRadius:10,
                padding:"6px 14px",display:"inline-flex",alignItems:"center",gap:7,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.8rem"}}>{fmtDate(date)}</span>
              </div>
              <span style={{fontSize:"0.76rem",color:T.muted}}>{list.length} appointment{list.length!==1?"s":""}</span>
            </div>

            {/* Appointment cards */}
            <div style={{background:T.surface,border:`1px solid ${T.subtle}`,borderRadius:18,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,.05)"}}>
              {/* Column header */}
              <div style={{
                display:"grid",gridTemplateColumns:"0.6fr 2.2fr 1fr 1.2fr 1.4fr 100px",
                padding:"11px 20px",background:`${T.primary}0A`,borderBottom:`1px solid ${T.subtle}`,
              }}>
                {["Slot","Patient","Time","Type","Status","Action"].map(h=>(
                  <span key={h} style={{fontSize:"0.66rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted}}>{h}</span>
                ))}
              </div>

              {list.map((apt,i)=>(
                <div key={apt.id} className="row-card" style={{
                  display:"grid",gridTemplateColumns:"0.6fr 2.2fr 1fr 1.2fr 1.4fr 100px",
                  padding:"14px 20px",alignItems:"center",
                  borderBottom:i<list.length-1?`1px solid ${T.subtle}`:"none",
                  animation:`rowIn .22s ease ${i*0.04}s both`,
                  opacity:apt.status==="cancelled"?.6:1,
                }}>
                  {/* Slot number */}
                  <div style={{
                    width:28,height:28,borderRadius:8,
                    background:`${T.primary}18`,color:T.primary,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.78rem",
                  }}>{i+1}</div>

                  {/* Patient name */}
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{
                      width:32,height:32,borderRadius:9,
                      background:apt.status==="completed"?`${T.primary}20`:`${T.primary}18`,
                      color:T.primary,display:"flex",alignItems:"center",justifyContent:"center",
                      fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.72rem",flexShrink:0,
                    }}>
                      {apt.patientName.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p style={{fontWeight:600,fontSize:"0.85rem",color:T.text}}>{apt.patientName}</p>
                      <p style={{fontSize:"0.72rem",color:T.muted,marginTop:1}}>{apt.id}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span style={{fontSize:"0.84rem",color:T.text,fontWeight:500}}>{apt.time}</span>
                  </div>

                  {/* Type */}
                  <span style={{
                    background:T.card,color:T.muted,borderRadius:99,
                    padding:"3px 10px",fontSize:"0.73rem",fontWeight:500,
                    display:"inline-block",
                  }}>{apt.type}</span>

                  {/* Status */}
                  <Badge status={apt.status} T={T}/>

                  {/* Toggle button */}
                  {apt.status==="cancelled"?(
                    <span style={{fontSize:"0.76rem",color:T.muted,fontStyle:"italic"}}>Cancelled</span>
                  ):(
                    <button
                      onClick={()=>toggleComplete(apt.id)}
                      style={{
                        display:"flex",alignItems:"center",gap:5,
                        background:apt.status==="completed"?`${T.muted}18`:T.primary,
                        color:apt.status==="completed"?T.muted:"#fff",
                        border:"none",borderRadius:9,padding:"7px 12px",
                        fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.76rem",
                        cursor:"pointer",transition:"all .18s",
                        boxShadow:apt.status==="completed"?"none":`0 3px 12px ${T.primary}35`,
                      }}
                      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
                    >
                      {apt.status==="completed"
                        ?<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Done</>
                        :<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Mark Done</>
                      }
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {toast&&<Toast msg={toast.msg} type={toast.type} T={T}/>}
    </div>
  );
}

/* ─── Doctor Page ────────────────────────────────────────────────────────────── */
export default function DoctorPage() {
  const {themeKey,setThemeKey}=useContext(ThemeContext);
  const [activeTab,setActiveTab]=useState("online");
  const T=THEMES[themeKey];

  const TABS=[
    {
      key:"online",label:"Online Appointments",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    },
    {
      key:"offline",label:"Offline Schedules",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <BubbleCanvas primary={T.primary}/>

      <div style={{minHeight:"100vh",background:T.gradient,color:T.text,transition:"background .45s",position:"relative",zIndex:1}}>
        <Navbar T={T} themeKey={themeKey} setThemeKey={setThemeKey}/>

        <main style={{padding:"44px 28px 96px",position:"relative",zIndex:1}}>
          <div style={{maxWidth:1100,margin:"0 auto"}}>

            {/* Page heading */}
            <div style={{marginBottom:34,animation:"fadeSlideUp .5s ease both"}}>
              <p style={{fontWeight:500,fontSize:"0.7rem",letterSpacing:"0.2em",textTransform:"uppercase",color:T.muted,marginBottom:12}}>Doctor Portal</p>
              <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <div>
                  <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",fontWeight:400,color:T.accent,lineHeight:1.2}}>
                    Good morning, Dr. Menon
                  </h1>
                  <p style={{color:T.muted,fontSize:"0.86rem",marginTop:6}}>
                    {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                  </p>
                </div>
                {/* Live dot */}
                <div style={{display:"flex",alignItems:"center",gap:8,background:`${T.primary}14`,border:`1px solid ${T.primary}30`,borderRadius:99,padding:"8px 16px"}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#10B981",animation:"pulse 1.8s ease-in-out infinite"}}/>
                  <span style={{fontSize:"0.8rem",fontWeight:600,color:T.primary}}>Active Session</span>
                </div>
              </div>
              <div style={{width:48,height:3,borderRadius:99,background:T.primary,opacity:.45,marginTop:16}}/>
            </div>

            {/* Tab bar */}
            <div style={{
              display:"flex",gap:6,marginBottom:32,
              background:T.surface,borderRadius:16,padding:6,
              border:`1px solid ${T.subtle}`,
              boxShadow:"0 4px 16px rgba(0,0,0,.05)",
              width:"fit-content",
              animation:"fadeSlideUp .55s ease .06s both",
            }}>
              {TABS.map(tab=>{
                const a=activeTab===tab.key;
                return (
                  <button key={tab.key} className="tab-pill"
                    onClick={()=>setActiveTab(tab.key)}
                    style={{
                      display:"flex",alignItems:"center",gap:8,
                      background:a?T.primary:"transparent",
                      color:a?"#fff":T.muted,
                      border:"none",borderRadius:11,padding:"11px 22px",
                      fontFamily:"'DM Sans',sans-serif",fontWeight:a?600:500,
                      fontSize:"0.88rem",cursor:"pointer",
                      boxShadow:a?`0 4px 16px ${T.primary}40`:"none",
                      transition:"all .2s",opacity:a?1:.72,
                      whiteSpace:"nowrap",
                    }}>
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div style={{animation:"fadeSlideUp .6s ease .1s both"}}>
              {activeTab==="online"  && <OnlineAppointments  T={T}/>}
              {activeTab==="offline" && <OfflineAppointments T={T}/>}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}