import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   InterviewAI — Premium Edition
   Theme: Clean White + Deep Indigo + Amber — Editorial / SaaS
   Pages: Landing → Setup → Interview → Results → History
═══════════════════════════════════════════════════════════════ */

// ── Constants ─────────────────────────────────────────────────
const DIFF_COLORS  = { Easy: "#16a34a", Medium: "#d97706", Hard: "#dc2626" };
const DIFF_BG      = { Easy: "#f0fdf4", Medium: "#fffbeb", Hard: "#fef2f2" };
const DIFF_TIME    = { Easy: 90, Medium: 120, Hard: 150 };
const DIFF_NEXT_UP   = { Easy: "Medium", Medium: "Hard", Hard: "Hard" };
const DIFF_NEXT_DOWN = { Easy: "Easy",   Medium: "Easy",  Hard: "Medium" };
const MAX_Q_DEFAULT  = 8;
const EARLY_THRESH   = 25;
const EARLY_STREAK   = 3;
const SKIP_PENALTY   = 10;
const HINT_PENALTY   = 5;
const MODEL          = "claude-sonnet-4-20250514";
const STORAGE_KEY    = "interviewai_v2_sessions";

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  // Backgrounds
  bg:       "#f8f7f4",       // warm off-white page bg
  surface:  "#ffffff",       // card / panel bg
  sunken:   "#f1f0ed",       // input bg, inset sections
  hover:    "#f5f4f1",
  // Indigo palette
  indigo:   "#4338ca",
  indigoDk: "#312e81",
  indigoLt: "#e0e7ff",
  indigoMd: "#6366f1",
  // Amber accent
  amber:    "#d97706",
  amberLt:  "#fef3c7",
  // Semantic
  success:  "#16a34a",
  successLt:"#dcfce7",
  danger:   "#dc2626",
  dangerLt: "#fee2e2",
  warn:     "#d97706",
  warnLt:   "#fef3c7",
  // Text
  text:     "#1c1917",
  muted:    "#78716c",
  subtle:   "#a8a29e",
  onIndigo: "#ffffff",
  // Border
  border:   "#e7e5e4",
  borderMd: "#d6d3d1",
  ring:     "#c7d2fe",
};

// ── Helpers ───────────────────────────────────────────────────
function scoreColor(s)  { return s >= 70 ? T.success : s >= 45 ? T.amber : T.danger; }
function scoreBg(s)     { return s >= 70 ? T.successLt : s >= 45 ? T.amberLt : T.dangerLt; }
function scoreLabel(s)  { return s >= 70 ? "Strong" : s >= 45 ? "Average" : "Needs Work"; }
function avg(arr)       { return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0; }
function parseJSON(t)   { try { return JSON.parse(t.replace(/```json|```/g,"").trim()); } catch { return null; } }
function saveSession(s) { try { const e=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); e.unshift(s); localStorage.setItem(STORAGE_KEY,JSON.stringify(e.slice(0,10))); } catch {} }
function loadSessions() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); } catch { return []; } }

async function callClaude(apiKey, messages, system, maxTokens=1200) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-calls": "true",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error?.message || `API ${res.status}`); }
  const d = await res.json();
  return d.content?.[0]?.text || "";
}

// ── Primitive Components ──────────────────────────────────────

function Badge({ label, color, bg, size="sm" }) {
  const fs = size==="xs" ? 10 : 11;
  return (
    <span style={{
      background: bg||color+"18", color, border:`1px solid ${color}30`,
      borderRadius:6, padding: size==="xs"?"1px 6px":"3px 10px",
      fontSize:fs, fontWeight:700, letterSpacing:"0.04em",
      textTransform:"uppercase", display:"inline-block", whiteSpace:"nowrap",
      fontFamily:"inherit",
    }}>{label}</span>
  );
}

function Bar({ value, max, color, height=6 }) {
  const pct = Math.min(100, Math.round((value/max)*100));
  return (
    <div style={{ background:T.sunken, borderRadius:99, height, overflow:"hidden", flex:1 }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width 0.5s ease" }} />
    </div>
  );
}

function Chip({ children, style }) {
  return (
    <span style={{
      background:T.indigoLt, color:T.indigo, borderRadius:99,
      padding:"3px 10px", fontSize:12, fontWeight:600, display:"inline-block", ...style
    }}>{children}</span>
  );
}

function Spinner({ size=16, color=T.indigo }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size,
      border:`2px solid ${color}30`, borderTopColor:color,
      borderRadius:"50%", animation:"spin 0.7s linear infinite",
      verticalAlign:"middle", marginRight:6, flexShrink:0,
    }} />
  );
}

function PrimaryBtn({ children, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? T.border : T.indigo,
      color: disabled ? T.muted : T.onIndigo,
      border:"none", borderRadius:10, padding:"13px 28px",
      fontSize:15, fontWeight:700, cursor: disabled?"default":"pointer",
      fontFamily:"inherit", display:"inline-flex", alignItems:"center",
      gap:8, transition:"background 0.2s, transform 0.1s",
      letterSpacing:"-0.01em", ...style,
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background:"transparent", color:T.muted,
      border:`1.5px solid ${T.border}`, borderRadius:10,
      padding:"11px 22px", fontSize:14, fontWeight:600,
      cursor:"pointer", fontFamily:"inherit",
      display:"inline-flex", alignItems:"center", gap:6,
      transition:"border-color 0.2s, color 0.2s", ...style,
    }}>{children}</button>
  );
}

function Card({ children, style, accent }) {
  return (
    <div style={{
      background:T.surface, borderRadius:16,
      border: accent ? `1.5px solid ${accent}40` : `1px solid ${T.border}`,
      padding:"24px 26px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
      ...style,
    }}>{children}</div>
  );
}

function Label({ children }) {
  return (
    <div style={{ color:T.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
      {children}
    </div>
  );
}

function InputField({ value, onChange, placeholder, type="text", style }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
      background:T.sunken, border:`1.5px solid ${T.border}`, borderRadius:10,
      color:T.text, padding:"11px 14px", fontSize:14, width:"100%",
      boxSizing:"border-box", outline:"none", fontFamily:"inherit",
      transition:"border-color 0.2s", ...style,
    }} onFocus={e=>e.target.style.borderColor=T.indigo}
       onBlur={e=>e.target.style.borderColor=T.border} />
  );
}

function TextArea({ value, onChange, placeholder, rows=7, style }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{
      background:T.sunken, border:`1.5px solid ${T.border}`, borderRadius:10,
      color:T.text, padding:"12px 14px", fontSize:14, width:"100%",
      boxSizing:"border-box", outline:"none", fontFamily:"inherit",
      resize:"vertical", lineHeight:1.7, ...style,
    }} onFocus={e=>e.target.style.borderColor=T.indigo}
       onBlur={e=>e.target.style.borderColor=T.border} />
  );
}

function SelectField({ value, onChange, children, style }) {
  return (
    <select value={value} onChange={onChange} style={{
      background:T.sunken, border:`1.5px solid ${T.border}`, borderRadius:10,
      color:T.text, padding:"11px 14px", fontSize:14, width:"100%",
      boxSizing:"border-box", outline:"none", fontFamily:"inherit",
      cursor:"pointer", ...style,
    }} onFocus={e=>e.target.style.borderColor=T.indigo}
       onBlur={e=>e.target.style.borderColor=T.border}>
      {children}
    </select>
  );
}

function ScoreRing({ score, size=130 }) {
  const r=size*0.38, cx=size/2, cy=size/2;
  const circ=2*Math.PI*r, dash=circ*(score/100);
  const color=scoreColor(score);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.sunken} strokeWidth={10}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition:"stroke-dasharray 1.2s ease" }}/>
        <text x={cx} y={cy-5} textAnchor="middle" fill={color} fontSize={Math.round(size*0.19)} fontWeight={700} fontFamily="inherit">{score}</text>
        <text x={cx} y={cy+13} textAnchor="middle" fill={T.subtle} fontSize={Math.round(size*0.09)} fontFamily="inherit">/ 100</text>
      </svg>
      <Badge label={scoreLabel(score)} color={color} />
    </div>
  );
}

function ConfidenceMeter({ text }) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const level = words<20?0:words<50?1:words<80?2:3;
  const labels = ["Too short","Getting there","Good length","Detailed ✓"];
  const colors = [T.danger, T.warn, T.amber, T.success];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
      <div style={{ fontSize:12, color:T.muted, whiteSpace:"nowrap" }}>Confidence</div>
      <div style={{ display:"flex", gap:3, flex:1 }}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{ flex:1, height:4, borderRadius:99, background:i<=level?colors[level]:T.border, transition:"background 0.3s" }}/>
        ))}
      </div>
      <div style={{ fontSize:11, color:colors[level], fontWeight:700, whiteSpace:"nowrap" }}>{labels[level]}</div>
      <div style={{ fontSize:11, color:T.subtle, whiteSpace:"nowrap" }}>{words}w</div>
    </div>
  );
}

function Timer({ totalSeconds, onExpire, paused }) {
  const [left, setLeft] = useState(totalSeconds);
  const ref = useRef(null);
  const fired = useRef(false);
  useEffect(() => { setLeft(totalSeconds); fired.current=false; }, [totalSeconds]);
  useEffect(() => {
    if (paused) { clearInterval(ref.current); return; }
    ref.current = setInterval(() => {
      setLeft(p => {
        if (p<=1) { clearInterval(ref.current); if(!fired.current){fired.current=true;onExpire();} return 0; }
        return p-1;
      });
    },1000);
    return () => clearInterval(ref.current);
  }, [paused, onExpire]);

  const pct = left/totalSeconds;
  const color = pct>0.5?T.success:pct>0.25?T.warn:T.danger;
  const bg    = pct>0.5?T.successLt:pct>0.25?T.warnLt:T.dangerLt;
  const mm = String(Math.floor(left/60)).padStart(2,"0");
  const ss = String(left%60).padStart(2,"0");

  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <div style={{
        fontFamily:"monospace", fontSize:26, fontWeight:700, color,
        background:bg, border:`1.5px solid ${color}30`,
        borderRadius:10, padding:"5px 16px", minWidth:84, textAlign:"center",
        transition:"color 0.4s, background 0.4s",
      }}>{mm}:{ss}</div>
      <Bar value={left} max={totalSeconds} color={color} height={8}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PAGE 1: LANDING
// ════════════════════════════════════════════════════════════════
function LandingPage({ onGetStarted, onViewHistory }) {
  const sessions = loadSessions();
  const features = [
    { icon:"🎯", title:"Adaptive Difficulty", desc:"Questions scale Easy → Hard based on your live performance in real time." },
    { icon:"⏱", title:"Timed Rounds", desc:"Countdown per question — just like a real technical interview under pressure." },
    { icon:"🤖", title:"AI-Powered Scoring", desc:"Every answer graded on 5 dimensions: Accuracy, Clarity, Depth, Relevance & Time." },
    { icon:"🎤", title:"Voice Input", desc:"Speak your answers using your microphone via the Web Speech API." },
    { icon:"💡", title:"Smart Hints", desc:"Reveal a hint when stuck — a small penalty keeps the challenge real." },
    { icon:"📋", title:"Full Report", desc:"Detailed session report with per-question breakdown, strengths and improvements." },
  ];
  const steps = [
    { num:"01", title:"Paste your resume & JD", desc:"Claude reads your profile and the job requirements to tailor every question." },
    { num:"02", title:"Answer adaptive questions", desc:"Up to 8 questions that get harder as you improve — or easier if you struggle." },
    { num:"03", title:"Get your readiness score", desc:"Receive a 0–100 score, Hire/No-Hire verdict, and actionable next steps." },
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      {/* Nav */}
      <nav style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 40px", display:"flex", alignItems:"center", height:64, position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 0 rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, background:T.indigo, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#fff", fontSize:16, fontWeight:800 }}>I</span>
          </div>
          <span style={{ fontWeight:800, fontSize:17, color:T.indigoDk, letterSpacing:"-0.02em" }}>InterviewAI</span>
          <span style={{ background:T.amberLt, color:T.amber, borderRadius:99, fontSize:10, fontWeight:700, padding:"2px 8px", marginLeft:4 }}>BETA</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:12, alignItems:"center" }}>
          {sessions.length>0 && (
            <GhostBtn onClick={onViewHistory} style={{ padding:"8px 16px", fontSize:13 }}>
              📋 Past Sessions
            </GhostBtn>
          )}
          <PrimaryBtn onClick={onGetStarted} style={{ padding:"10px 22px", fontSize:14 }}>
            Get Started →
          </PrimaryBtn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth:960, margin:"0 auto", padding:"80px 32px 64px", textAlign:"center" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:T.indigoLt, border:`1px solid ${T.ring}`, borderRadius:99, padding:"6px 16px", marginBottom:28 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:T.indigo, display:"inline-block" }}/>
          <span style={{ fontSize:12, color:T.indigo, fontWeight:700 }}>Hack2Hire 2026 · Powered by Claude Sonnet 4</span>
        </div>
        <h1 style={{ fontSize:56, fontWeight:800, color:T.indigoDk, lineHeight:1.1, letterSpacing:"-0.03em", marginBottom:22 }}>
          Ace your next<br/>
          <span style={{ color:T.indigo }}>technical interview.</span>
        </h1>
        <p style={{ fontSize:19, color:T.muted, maxWidth:560, margin:"0 auto 40px", lineHeight:1.65 }}>
          Paste your resume and job description. Our AI conducts a fully adaptive mock interview and scores you like a real hiring manager.
        </p>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <PrimaryBtn onClick={onGetStarted} style={{ padding:"16px 36px", fontSize:16, borderRadius:12 }}>
            Start Free Interview →
          </PrimaryBtn>
          {sessions.length>0 && (
            <GhostBtn onClick={onViewHistory} style={{ padding:"16px 28px", fontSize:15 }}>
              View Past Sessions
            </GhostBtn>
          )}
        </div>
        <div style={{ marginTop:20, fontSize:13, color:T.subtle }}>No sign-up · Free to try · Results in minutes</div>
      </section>

      {/* Stats bar */}
      <section style={{ background:T.indigo, padding:"28px 40px" }}>
        <div style={{ maxWidth:960, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, textAlign:"center" }}>
          {[["8","Adaptive Questions"],["5","Scoring Dimensions"],["3","Difficulty Levels"],["0–100","Readiness Score"]].map(([val,label])=>(
            <div key={label}>
              <div style={{ fontSize:34, fontWeight:800, color:"#fff", letterSpacing:"-0.03em" }}>{val}</div>
              <div style={{ fontSize:13, color:"#c7d2fe", marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth:960, margin:"0 auto", padding:"72px 32px" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:12, color:T.indigo, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>How it works</div>
          <h2 style={{ fontSize:36, fontWeight:800, color:T.indigoDk, letterSpacing:"-0.025em" }}>Three steps to interview-ready</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
          {steps.map(({num,title,desc})=>(
            <div key={num} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"28px 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize:13, fontWeight:800, color:T.indigo, letterSpacing:"0.05em", marginBottom:14, fontFamily:"monospace" }}>{num}</div>
              <div style={{ fontSize:17, fontWeight:700, color:T.indigoDk, marginBottom:10 }}>{title}</div>
              <div style={{ fontSize:14, color:T.muted, lineHeight:1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ background:T.surface, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, padding:"72px 32px" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontSize:12, color:T.indigo, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Features</div>
            <h2 style={{ fontSize:36, fontWeight:800, color:T.indigoDk, letterSpacing:"-0.025em" }}>Everything you need to prepare</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 }}>
            {features.map(({icon,title,desc})=>(
              <div key={title} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:14, padding:"22px 20px" }}>
                <div style={{ fontSize:26, marginBottom:12 }}>{icon}</div>
                <div style={{ fontSize:15, fontWeight:700, color:T.indigoDk, marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:13, color:T.muted, lineHeight:1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth:960, margin:"0 auto", padding:"72px 32px", textAlign:"center" }}>
        <div style={{ background:T.indigo, borderRadius:20, padding:"52px 40px" }}>
          <h2 style={{ fontSize:34, fontWeight:800, color:"#fff", letterSpacing:"-0.025em", marginBottom:14 }}>Ready to practice?</h2>
          <p style={{ fontSize:16, color:"#c7d2fe", marginBottom:32 }}>Takes 10–15 minutes. Get your readiness score instantly.</p>
          <PrimaryBtn onClick={onGetStarted} style={{ background:"#fff", color:T.indigo, padding:"16px 40px", fontSize:16, borderRadius:12 }}>
            Start Interview Now →
          </PrimaryBtn>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:`1px solid ${T.border}`, padding:"24px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", background:T.surface }}>
        <div style={{ fontSize:13, color:T.subtle }}>© 2026 InterviewAI · Hack2Hire · Built with Claude</div>
        <div style={{ fontSize:13, color:T.subtle }}>UnsaidTalks · info@unsaidtalks.com</div>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PAGE 2: SETUP
// ════════════════════════════════════════════════════════════════
function SetupPage({ onStart, onBack }) {
  const [apiKey,  setApiKey]  = useState(localStorage.getItem("interviewai_key")||"");
  const [name,    setName]    = useState("");
  const [resume,  setResume]  = useState("");
  const [jd,      setJd]      = useState("");
  const [maxQ,    setMaxQ]    = useState(MAX_Q_DEFAULT);
  const [focus,   setFocus]   = useState("mixed");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const keyValid = apiKey.startsWith("sk-ant");
  const canStart = keyValid && name.trim() && resume.trim().length>50 && jd.trim().length>30;

  async function handleStart() {
    setLoading(true); setError("");
    localStorage.setItem("interviewai_key", apiKey);
    try {
      const sys=`You are an AI interview analyst. Extract structured info from a candidate resume and job description.
Return ONLY valid JSON (no markdown):
{"candidateName":string,"skills":string[],"experience":string,"topSkills":string[],"roleTitle":string,"keyRequirements":string[],"suggestedFocus":"Technical"|"Behavioral"|"Mixed"}`;
      const raw=await callClaude(apiKey,[{role:"user",content:`Candidate: ${name}\n\nRESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jd}`}],sys);
      const parsed=parseJSON(raw);
      if(!parsed) throw new Error("Profile parse failed. Check your resume/JD.");
      onStart({ apiKey, resume, jd, name, profile:{...parsed,_focus:focus}, maxQ:Number(maxQ) });
    } catch(e) {
      setError(e.message||"Could not analyze. Check your API key and inputs.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      {/* Top bar */}
      <nav style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 40px", display:"flex", alignItems:"center", height:60 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:T.muted, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontFamily:"inherit" }}>
          ← Back to home
        </button>
        <div style={{ margin:"0 auto", fontWeight:800, fontSize:16, color:T.indigoDk }}>Setup Interview</div>
        <div style={{ width:120 }}/>
      </nav>

      <div style={{ maxWidth:780, margin:"0 auto", padding:"40px 24px" }}>
        {/* Progress steps */}
        <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:40, justifyContent:"center" }}>
          {[["1","Setup"],["2","Interview"],["3","Results"]].map(([n,label],i)=>(
            <div key={n} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:i===0?T.indigo:T.border, color:i===0?"#fff":T.muted, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700 }}>{n}</div>
                <span style={{ fontSize:11, color:i===0?T.indigo:T.muted, fontWeight:i===0?700:400 }}>{label}</span>
              </div>
              {i<2 && <div style={{ width:80, height:2, background:T.border, margin:"0 8px", marginBottom:18 }}/>}
            </div>
          ))}
        </div>

        {/* API Key */}
        <Card accent={keyValid?T.indigo:null} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <Label>Anthropic API Key</Label>
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ fontSize:12, color:T.indigo, textDecoration:"none", fontWeight:600 }}>Get free key →</a>
          </div>
          <InputField type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-api03-…" style={{ fontFamily:"monospace", fontSize:13 }}/>
          <div style={{ height:18, fontSize:12, marginTop:6, color:keyValid?T.success:apiKey?T.danger:T.subtle }}>
            {apiKey ? (keyValid?"✓ Key format looks good":"⚠ Should start with sk-ant…") : "Your key is never stored on any server"}
          </div>
        </Card>

        {/* Candidate info */}
        <Card style={{ marginBottom:20 }}>
          <Label>Your Name</Label>
          <InputField value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Arun Kumar" style={{ marginBottom:20 }}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
            <div>
              <Label>Resume / Profile</Label>
              <TextArea value={resume} onChange={e=>setResume(e.target.value)} rows={10} placeholder={"Paste your resume text…\n\nInclude skills, experience,\nprojects, and education."}/>
              <div style={{ fontSize:11, color:T.subtle, marginTop:5 }}>{resume.length} characters (min 50)</div>
            </div>
            <div>
              <Label>Job Description</Label>
              <TextArea value={jd} onChange={e=>setJd(e.target.value)} rows={10} placeholder={"Paste the job description…\n\nInclude role, requirements,\nand responsibilities."}/>
              <div style={{ fontSize:11, color:T.subtle, marginTop:5 }}>{jd.length} characters (min 30)</div>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card style={{ marginBottom:20 }}>
          <Label>Interview Settings</Label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
            <div>
              <div style={{ fontSize:13, color:T.muted, marginBottom:6 }}>Number of questions</div>
              <SelectField value={maxQ} onChange={e=>setMaxQ(e.target.value)}>
                <option value={5}>5 questions</option>
                <option value={8}>8 questions (default)</option>
                <option value={10}>10 questions</option>
                <option value={12}>12 questions</option>
              </SelectField>
            </div>
            <div>
              <div style={{ fontSize:13, color:T.muted, marginBottom:6 }}>Focus area</div>
              <SelectField value={focus} onChange={e=>setFocus(e.target.value)}>
                <option value="mixed">Mixed — Technical + Behavioral</option>
                <option value="technical">Technical only</option>
                <option value="behavioral">Behavioral only</option>
                <option value="scenario">Scenario / Case study</option>
              </SelectField>
            </div>
          </div>
        </Card>

        {error && (
          <div style={{ background:T.dangerLt, border:`1px solid ${T.danger}30`, borderRadius:10, padding:"12px 16px", color:T.danger, fontSize:13, marginBottom:16 }}>
            ⚠ {error}
          </div>
        )}

        <PrimaryBtn onClick={handleStart} disabled={!canStart||loading} style={{ width:"100%", justifyContent:"center", fontSize:16, padding:"15px", borderRadius:12 }}>
          {loading ? <><Spinner/>Analyzing your profile…</> : "Begin Interview →"}
        </PrimaryBtn>
        <div style={{ textAlign:"center", fontSize:12, color:T.subtle, marginTop:12 }}>
          Claude will read your resume and craft personalized questions
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PAGE 3: INTERVIEW
// ════════════════════════════════════════════════════════════════
function InterviewPage({ setup, onFinish }) {
  const { apiKey, profile, maxQ } = setup;
  const [qNum,        setQNum]       = useState(0);
  const [difficulty,  setDifficulty] = useState("Easy");
  const [question,    setQuestion]   = useState(null);
  const [answer,      setAnswer]     = useState("");
  const [loading,     setLoading]    = useState(true);
  const [evaluating,  setEvaluating] = useState(false);
  const [timeExpired, setTimeExpired]= useState(false);
  const [paused,      setPaused]     = useState(false);
  const [history,     setHistory]    = useState([]);
  const [scores,      setScores]     = useState([]);
  const [lowStreak,   setLowStreak]  = useState(0);
  const [status,      setStatus]     = useState("");
  const [timerKey,    setTimerKey]   = useState(0);
  const [hintUsed,    setHintUsed]   = useState(false);
  const [skipsLeft,   setSkipsLeft]  = useState(1);
  const [isListening, setIsListening]= useState(false);
  const [voiceAvail,  setVoiceAvail] = useState(false);
  const [showCode,    setShowCode]   = useState(false);
  const answerRef  = useRef("");
  const recognizer = useRef(null);

  useEffect(()=>{ answerRef.current=answer; },[answer]);
  useEffect(()=>{ setVoiceAvail(!!(window.SpeechRecognition||window.webkitSpeechRecognition)); },[]);

  const loadQuestion = useCallback(async (diff, hist) => {
    setLoading(true); setAnswer(""); setTimeExpired(false);
    setPaused(false); setStatus(""); setHintUsed(false); setShowCode(false);
    const fm={mixed:"Mix technical, behavioral, and scenario questions.",technical:"Only technical/coding questions.",behavioral:"Only behavioral/situational questions.",scenario:"Only scenario/case-study questions."};
    const sys=`You are a strict technical interviewer for a ${profile.roleTitle} role.
Candidate skills: ${profile.skills?.join(", ")}.
Job requires: ${profile.keyRequirements?.join(", ")}.
Previous questions asked: ${hist.map(h=>h.question).join(" | ")||"none"}.
${fm[profile._focus]||fm.mixed}
${(profile._focus==="technical"||profile._focus==="mixed")&&diff!=="Easy"?"For technical questions you MAY include a short code snippet (≤12 lines) in codeSnippet field, or leave empty.":""}
Generate ONE unique ${diff} difficulty question. Never repeat a previous question.
Return ONLY valid JSON: {"question":string,"type":"Technical"|"Behavioral"|"Scenario","hint":string,"codeSnippet":string}`;
    try {
      const raw=await callClaude(apiKey,[{role:"user",content:`Generate ${diff} ${profile._focus} question. Avoid: ${hist.map(h=>h.question).join("; ")||"none"}`}],sys);
      setQuestion(parseJSON(raw)||{question:"Tell me about a challenging project you worked on.",type:"Behavioral",hint:"Use the STAR method.",codeSnippet:""});
    } catch {
      setQuestion({question:"Describe a technical problem you recently solved. What was your approach?",type:"Technical",hint:"Be specific — tools, tradeoffs, outcome.",codeSnippet:""});
    }
    setTimerKey(k=>k+1); setLoading(false);
  },[apiKey,profile]);

  useEffect(()=>{ loadQuestion("Easy",[]); },[]);

  const submitAnswer = useCallback(async (ans,expired,skipped=false)=>{
    if(evaluating)return;
    setEvaluating(true); setStatus("Evaluating your answer…"); setPaused(true);
    const hp=hintUsed?HINT_PENALTY:0;
    let eval_;
    if(skipped){
      eval_={accuracy:SKIP_PENALTY,clarity:SKIP_PENALTY,depth:SKIP_PENALTY,relevance:SKIP_PENALTY,timeEfficiency:0,overallScore:SKIP_PENALTY,feedback:"Question skipped.",strengths:[],weaknesses:["Skipped — no answer"]};
    } else {
      const sys=`You are a strict interview evaluator for a ${profile.roleTitle} role.
Score 0–100 on: accuracy (factual correctness), clarity (communication), depth (detail/examples), relevance (addresses question), timeEfficiency (${expired?"0 — time expired":`completeness minus ${hp} for hint use`}).
overallScore = accuracy×0.3+clarity×0.2+depth×0.2+relevance×0.2+timeEfficiency×0.1
Return ONLY valid JSON: {"accuracy":number,"clarity":number,"depth":number,"relevance":number,"timeEfficiency":number,"overallScore":number,"feedback":string,"strengths":string[],"weaknesses":string[]}`;
      try {
        const raw=await callClaude(apiKey,[{role:"user",content:`Question: ${question.question}\n${question.codeSnippet?`Code:\n${question.codeSnippet}\n`:""}Answer: ${expired?"[TIME EXPIRED — NO ANSWER]":ans||"[No answer]"}`}],sys);
        eval_=parseJSON(raw)||defaultEval(expired);
        if(hp&&!expired) eval_.timeEfficiency=Math.max(0,(eval_.timeEfficiency||50)-hp);
      } catch { eval_=defaultEval(expired); }
    }
    const entry={question:question.question,type:question.type,difficulty,answer:(expired||skipped)?"":ans,eval:eval_,expired,skipped,hintUsed,codeSnippet:question.codeSnippet||""};
    const nH=[...history,entry], nS=[...scores,eval_.overallScore], nStr=eval_.overallScore<EARLY_THRESH?lowStreak+1:0;
    setHistory(nH); setScores(nS); setLowStreak(nStr);
    if(nStr>=EARLY_STREAK){
      setStatus("Interview ended: 3 consecutive low scores.");
      saveSession({profile,history:nH,scores:nS,date:new Date().toISOString(),terminated:true});
      setTimeout(()=>onFinish(nH,nS,profile),2200); setEvaluating(false); return;
    }
    if(nH.length>=maxQ){ saveSession({profile,history:nH,scores:nS,date:new Date().toISOString(),terminated:false}); onFinish(nH,nS,profile); setEvaluating(false); return; }
    const nd=eval_.overallScore>=70?DIFF_NEXT_UP[difficulty]:eval_.overallScore<=35?DIFF_NEXT_DOWN[difficulty]:difficulty;
    setDifficulty(nd); setQNum(n=>n+1); await loadQuestion(nd,nH); setEvaluating(false);
  },[evaluating,question,history,scores,difficulty,lowStreak,hintUsed,apiKey,profile,maxQ,onFinish,loadQuestion]);

  const handleExpire=useCallback(()=>{ setTimeExpired(true); submitAnswer(answerRef.current,true); },[submitAnswer]);

  function toggleVoice(){
    if(!voiceAvail)return;
    if(isListening){ recognizer.current?.stop(); setIsListening(false); return; }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR(); r.continuous=true; r.interimResults=true; r.lang="en-US";
    r.onresult=e=>{ const t=Array.from(e.results).map(r=>r[0].transcript).join(""); setAnswer(t); answerRef.current=t; };
    r.onend=()=>setIsListening(false); r.start(); recognizer.current=r; setIsListening(true);
  }

  if(loading||!question) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <Spinner size={32} color={T.indigo}/>
      <div style={{ fontSize:16, color:T.muted }}>Preparing question {qNum+1} of {maxQ}…</div>
    </div>
  );

  const avgScore=scores.length?avg(scores):null;
  const lastEval=history[history.length-1]?.eval;

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      {/* Interview nav */}
      <nav style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 32px", display:"flex", alignItems:"center", height:60, gap:16, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ fontWeight:800, fontSize:15, color:T.indigoDk }}>InterviewAI</div>
        <div style={{ height:20, width:1, background:T.border }}/>
        <div style={{ fontSize:13, color:T.muted }}>{profile.candidateName} · {profile.roleTitle}</div>
        <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
          {avgScore!==null && (
            <div style={{ fontSize:13, background:scoreBg(avgScore), color:scoreColor(avgScore), borderRadius:8, padding:"4px 12px", fontWeight:700 }}>
              Avg {avgScore}/100
            </div>
          )}
          {/* Dot tracker */}
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {Array.from({length:maxQ}).map((_,i)=>(
              <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:i<scores.length?scoreColor(scores[i]):i===qNum?T.indigo:T.border, boxShadow:i===qNum?`0 0 0 3px ${T.ring}`:"none", transition:"background 0.3s" }}/>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:780, margin:"0 auto", padding:"32px 24px" }}>
        {/* Q header */}
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:22, flexWrap:"wrap" }}>
          <Badge label={`Q ${qNum+1} / ${maxQ}`} color={T.indigo}/>
          <Badge label={difficulty} color={DIFF_COLORS[difficulty]} bg={DIFF_BG[difficulty]}/>
          <Badge label={question.type} color={T.muted} bg={T.sunken}/>
          {paused&&!evaluating&&<Badge label="Paused" color={T.warn} bg={T.warnLt}/>}
        </div>

        {/* Timer */}
        {!evaluating&&!timeExpired && (
          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:20 }}>
            <div style={{ flex:1 }}>
              <Timer key={timerKey} totalSeconds={DIFF_TIME[difficulty]} onExpire={handleExpire} paused={paused}/>
            </div>
            <GhostBtn onClick={()=>setPaused(p=>!p)} style={{ padding:"7px 16px", fontSize:13, flexShrink:0 }}>
              {paused?"▶ Resume":"⏸ Pause"}
            </GhostBtn>
          </div>
        )}

        {/* Question card */}
        <Card style={{ marginBottom:16, borderLeft:`4px solid ${DIFF_COLORS[difficulty]}` }}>
          <Label>Question</Label>
          <p style={{ fontSize:17, color:T.text, lineHeight:1.75, fontWeight:500, margin:0 }}>{question.question}</p>
          {question.codeSnippet && (
            <div style={{ marginTop:14 }}>
              <button onClick={()=>setShowCode(s=>!s)} style={{ background:"none", border:"none", color:T.indigo, fontSize:12, cursor:"pointer", padding:0, fontFamily:"inherit", fontWeight:600 }}>
                {showCode?"▼ Hide code":"▶ Show code context"}
              </button>
              {showCode && (
                <pre style={{ background:T.indigoDk, borderRadius:10, padding:"14px 16px", marginTop:10, fontSize:12, color:"#e0e7ff", overflowX:"auto", lineHeight:1.65 }}>
                  {question.codeSnippet}
                </pre>
              )}
            </div>
          )}
          {!hintUsed ? (
            <button onClick={()=>setHintUsed(true)} style={{ marginTop:14, background:"none", border:`1px dashed ${T.border}`, borderRadius:7, color:T.muted, fontSize:12, cursor:"pointer", padding:"5px 12px", fontFamily:"inherit" }}>
              💡 Reveal hint (−{HINT_PENALTY} pts from Time score)
            </button>
          ) : (
            <div style={{ marginTop:12, fontSize:13, color:T.muted, background:T.amberLt, borderRadius:8, padding:"8px 14px", borderLeft:`3px solid ${T.amber}` }}>
              💡 {question.hint}
            </div>
          )}
        </Card>

        {/* Last feedback */}
        {lastEval&&!evaluating&&history.length>0 && (
          <div style={{ background:scoreBg(lastEval.overallScore), border:`1px solid ${scoreColor(lastEval.overallScore)}30`, borderRadius:12, padding:"14px 18px", marginBottom:16 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:13, color:T.muted }}>Previous answer:</span>
              <Badge label={`${lastEval.overallScore}/100`} color={scoreColor(lastEval.overallScore)}/>
              {lowStreak>0&&<Badge label={`${lowStreak} low`} color={T.danger} size="xs"/>}
            </div>
            <div style={{ fontSize:13, color:T.text, lineHeight:1.55 }}>{lastEval.feedback}</div>
          </div>
        )}

        {/* Answer */}
        {!evaluating&&!timeExpired ? (
          <>
            <div style={{ position:"relative" }}>
              <TextArea value={answer} onChange={e=>setAnswer(e.target.value)} rows={7} placeholder="Type your answer here…" style={{ paddingBottom:50 }}/>
              {voiceAvail && (
                <button onClick={toggleVoice} style={{ position:"absolute", bottom:12, left:12, background:isListening?T.dangerLt:T.surface, border:`1px solid ${isListening?T.danger:T.border}`, borderRadius:7, color:isListening?T.danger:T.muted, fontSize:12, cursor:"pointer", padding:"5px 12px", display:"flex", alignItems:"center", gap:5, fontFamily:"inherit" }}>
                  {isListening?"🔴 Stop":"🎤 Speak"}
                </button>
              )}
            </div>
            <ConfidenceMeter text={answer}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14, gap:10, flexWrap:"wrap" }}>
              <div style={{ display:"flex", gap:8 }}>
                {skipsLeft>0 && (
                  <GhostBtn onClick={()=>{ setSkipsLeft(s=>s-1); submitAnswer("",false,true); }} style={{ fontSize:13, padding:"9px 16px" }}>
                    ⏭ Skip ({skipsLeft} left)
                  </GhostBtn>
                )}
              </div>
              <PrimaryBtn onClick={()=>submitAnswer(answer,false)}>Submit Answer →</PrimaryBtn>
            </div>
          </>
        ) : (
          <div style={{ textAlign:"center", padding:"40px", color:T.muted, fontSize:15 }}>
            {evaluating?<><Spinner color={T.indigo}/>{status}</>:(timeExpired?"⏰ Time's up! Evaluating…":status)}
          </div>
        )}

        {/* Streak warning */}
        {lowStreak===2&&!evaluating && (
          <div style={{ marginTop:16, background:T.dangerLt, border:`1px solid ${T.danger}30`, borderRadius:10, padding:"12px 16px", color:T.danger, fontSize:13 }}>
            ⚠ Warning: One more low score will end this interview early.
          </div>
        )}
      </div>
    </div>
  );
}

function defaultEval(expired){
  return{accuracy:20,clarity:20,depth:20,relevance:20,timeEfficiency:expired?0:20,overallScore:20,feedback:"Could not evaluate. Ensure your answer addresses the question clearly.",strengths:[],weaknesses:["Insufficient answer"]};
}

// ════════════════════════════════════════════════════════════════
// PAGE 4: RESULTS
// ════════════════════════════════════════════════════════════════
function ResultsPage({ history, scores, profile, onRestart }) {
  const finalScore=avg(scores), hired=finalScore>=65;
  const dims=["accuracy","clarity","depth","relevance","timeEfficiency"];
  const dimLabels={accuracy:"Accuracy",clarity:"Clarity",depth:"Depth",relevance:"Relevance",timeEfficiency:"Time Efficiency"};
  const avgDims=Object.fromEntries(dims.map(d=>[d,avg(history.filter(h=>h.eval?.[d]!==undefined).map(h=>h.eval[d]||0))]));
  const strengths=[...new Set(history.flatMap(h=>h.eval?.strengths||[]))].slice(0,5);
  const weaknesses=[...new Set(history.flatMap(h=>h.eval?.weaknesses||[]))].slice(0,5);
  const skipped=history.filter(h=>h.skipped).length;
  const expired=history.filter(h=>h.expired).length;
  const hinted=history.filter(h=>h.hintUsed).length;
  const sorted=[...history].sort((a,b)=>(b.eval?.overallScore||0)-(a.eval?.overallScore||0));
  const bestQ=sorted[0], worstQ=sorted[sorted.length-1];

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      <style>{`@media print { .no-print{display:none!important} body{background:#fff!important} }`}</style>
      {/* Results nav */}
      <nav style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 32px", display:"flex", alignItems:"center", height:60, position:"sticky", top:0, zIndex:50 }} className="no-print">
        <div style={{ fontWeight:800, fontSize:15, color:T.indigoDk }}>InterviewAI</div>
        <div style={{ margin:"0 auto", fontSize:14, color:T.muted }}>Interview Complete — {profile.candidateName}</div>
        <div style={{ display:"flex", gap:10 }}>
          <GhostBtn onClick={()=>window.print()} style={{ padding:"8px 16px", fontSize:13 }}>🖨 Print</GhostBtn>
          <PrimaryBtn onClick={onRestart} style={{ padding:"8px 20px", fontSize:13 }}>← New Interview</PrimaryBtn>
        </div>
      </nav>

      <div style={{ maxWidth:820, margin:"0 auto", padding:"40px 24px" }}>
        {/* Hero score */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:12, color:T.indigo, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Interview Complete</div>
          <h1 style={{ fontSize:32, fontWeight:800, color:T.indigoDk, letterSpacing:"-0.025em", marginBottom:4 }}>Your Results</h1>
          <div style={{ color:T.muted, fontSize:14 }}>{profile.roleTitle} · {new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
        </div>

        {/* Score + Verdict */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
          <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:18 }}>
            <Label>Readiness Score</Label>
            <ScoreRing score={finalScore}/>
          </Card>
          <Card accent={hired?T.success:T.danger} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, textAlign:"center" }}>
            <Label>Hiring Verdict</Label>
            <div style={{ fontSize:48 }}>{hired?"✅":"❌"}</div>
            <div style={{ fontSize:20, fontWeight:800, color:hired?T.success:T.danger, letterSpacing:"-0.02em" }}>
              {hired?"Recommend Hire":"Not Ready Yet"}
            </div>
            <div style={{ fontSize:13, color:T.muted, maxWidth:200, lineHeight:1.6 }}>
              {hired?"Candidate shows sufficient readiness for this role.":"Further preparation is recommended before applying."}
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
          {[["Questions",history.length,T.indigo],["Skipped",skipped,T.warn],["Timed Out",expired,T.danger],["Hints Used",hinted,T.amber]].map(([l,v,c])=>(
            <div key={l} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px", textAlign:"center" }}>
              <div style={{ fontSize:26, fontWeight:800, color:c, letterSpacing:"-0.02em" }}>{v}</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <Card style={{ marginBottom:18 }}>
          <Label>Performance Breakdown</Label>
          <div style={{ display:"grid", gap:14 }}>
            {dims.map(k=>(
              <div key={k} style={{ display:"grid", gridTemplateColumns:"130px 1fr 44px", alignItems:"center", gap:14 }}>
                <div style={{ fontSize:13, color:T.muted }}>{dimLabels[k]}</div>
                <Bar value={avgDims[k]} max={100} color={scoreColor(avgDims[k])} height={8}/>
                <div style={{ fontSize:14, fontWeight:700, color:scoreColor(avgDims[k]), textAlign:"right" }}>{avgDims[k]}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Strengths / Weaknesses */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
          {[["Strengths",strengths,T.success,"✓"],["Areas to Improve",weaknesses,T.danger,"↑"]].map(([title,items,color,icon])=>(
            <Card key={title} accent={color} style={{ borderLeft:`4px solid ${color}` }}>
              <div style={{ color, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>{title}</div>
              {items.length?items.map((s,i)=>(
                <div key={i} style={{ display:"flex", gap:10, marginBottom:10 }}>
                  <span style={{ color, flexShrink:0, fontWeight:700 }}>{icon}</span>
                  <span style={{ color:T.muted, fontSize:13, lineHeight:1.55 }}>{s}</span>
                </div>
              )):<div style={{ color:T.subtle, fontSize:13 }}>None identified.</div>}
            </Card>
          ))}
        </div>

        {/* Best / Worst */}
        {bestQ&&worstQ&&bestQ!==worstQ && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
            {[["🏆 Best Answer",bestQ,T.success],["📉 Weakest Answer",worstQ,T.danger]].map(([title,q,color])=>(
              <div key={title} style={{ background:T.surface, border:`1px solid ${color}30`, borderRadius:14, padding:"18px 20px" }}>
                <div style={{ color, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>{title}</div>
                <div style={{ fontSize:13, color:T.text, lineHeight:1.6, marginBottom:8 }}>{q.question}</div>
                <Badge label={`${q.eval?.overallScore||0}/100`} color={scoreColor(q.eval?.overallScore)}/>
              </div>
            ))}
          </div>
        )}

        {/* Q-by-Q */}
        <Card>
          <Label>Question-by-Question Review</Label>
          <div style={{ display:"grid", gap:22 }}>
            {history.map((h,i)=>(
              <div key={i} style={{ borderLeft:`3px solid ${scoreColor(h.eval?.overallScore)}`, paddingLeft:18, paddingTop:2 }}>
                <div style={{ display:"flex", gap:7, marginBottom:8, flexWrap:"wrap", alignItems:"center" }}>
                  <Badge label={`Q${i+1}`} color={T.indigo}/>
                  <Badge label={h.difficulty} color={DIFF_COLORS[h.difficulty]} bg={DIFF_BG[h.difficulty]}/>
                  <Badge label={h.type} color={T.muted} bg={T.sunken}/>
                  {h.expired&&<Badge label="Timed Out" color={T.danger} bg={T.dangerLt}/>}
                  {h.skipped&&<Badge label="Skipped" color={T.warn} bg={T.warnLt}/>}
                  {h.hintUsed&&<Badge label="Hint" color={T.amber} bg={T.amberLt}/>}
                  <Badge label={`${h.eval?.overallScore||0}/100`} color={scoreColor(h.eval?.overallScore)}/>
                </div>
                <div style={{ fontSize:14, color:T.text, fontWeight:600, marginBottom:6, lineHeight:1.55 }}>{h.question}</div>
                {h.codeSnippet && (
                  <pre style={{ background:T.indigoDk, borderRadius:8, padding:"8px 12px", fontSize:11, color:"#e0e7ff", overflowX:"auto", marginBottom:8 }}>{h.codeSnippet}</pre>
                )}
                {h.answer && (
                  <div style={{ background:T.sunken, borderRadius:8, padding:"8px 14px", fontSize:12, color:T.muted, marginBottom:8, lineHeight:1.6, fontStyle:"italic" }}>
                    "{h.answer.slice(0,220)}{h.answer.length>220?"…":""}"
                  </div>
                )}
                <div style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:8 }}>{h.eval?.feedback}</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {dims.map(d=>(
                    <span key={d} style={{ fontSize:11, color:T.subtle }}>
                      {dimLabels[d][0]}: <span style={{ color:scoreColor(h.eval?.[d]||0), fontWeight:700 }}>{h.eval?.[d]||0}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap" }} className="no-print">
          <PrimaryBtn onClick={onRestart}>← Start New Interview</PrimaryBtn>
          <GhostBtn onClick={()=>window.print()}>🖨 Save as PDF</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PAGE 5: HISTORY
// ════════════════════════════════════════════════════════════════
function HistoryPage({ onBack }) {
  const sessions=loadSessions();
  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      <nav style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 40px", display:"flex", alignItems:"center", height:60 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:T.muted, fontSize:13, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>← Back to home</button>
        <div style={{ margin:"0 auto", fontWeight:800, fontSize:16, color:T.indigoDk }}>Past Sessions</div>
        <div style={{ width:120 }}/>
      </nav>
      <div style={{ maxWidth:780, margin:"0 auto", padding:"40px 24px" }}>
        {!sessions.length ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:T.muted }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📋</div>
            <div style={{ fontSize:18, marginBottom:20 }}>No past sessions yet.</div>
            <GhostBtn onClick={onBack}>← Back to home</GhostBtn>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:24, fontWeight:800, color:T.indigoDk, letterSpacing:"-0.02em" }}>Your Interview History</h2>
              <p style={{ fontSize:14, color:T.muted, marginTop:4 }}>{sessions.length} sessions saved locally</p>
            </div>
            <div style={{ display:"grid", gap:14 }}>
              {sessions.map((s,i)=>{
                const score=avg(s.scores);
                const date=new Date(s.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
                return (
                  <Card key={i} style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:16 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:T.indigoDk, marginBottom:4 }}>{s.profile?.candidateName} — {s.profile?.roleTitle}</div>
                      <div style={{ fontSize:12, color:T.muted }}>{date} · {s.history?.length} questions{s.terminated?" · Terminated early":""}</div>
                      <div style={{ marginTop:10, display:"flex", gap:5, flexWrap:"wrap" }}>
                        {s.history?.map((h,j)=>(
                          <div key={j} style={{ width:8, height:8, borderRadius:"50%", background:scoreColor(h.eval?.overallScore||0) }}/>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:30, fontWeight:800, color:scoreColor(score), letterSpacing:"-0.03em" }}>{score}</div>
                      <div style={{ fontSize:11, color:T.subtle }}>/100</div>
                      <div style={{ marginTop:6 }}><Badge label={score>=65?"Hire":"No Hire"} color={score>=65?T.success:T.danger}/></div>
                    </div>
                  </Card>
                );
              })}
            </div>
            <div style={{ marginTop:20 }}>
              <GhostBtn onClick={()=>{ localStorage.removeItem(STORAGE_KEY); onBack(); }} style={{ color:T.danger, borderColor:T.danger+"40" }}>
                🗑 Clear All History
              </GhostBtn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [page,    setPage]    = useState("landing");
  const [setup,   setSetup]   = useState(null);
  const [results, setResults] = useState(null);

  return (
    <div style={{ fontFamily:"'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; }
        input, textarea, select, button { font-family: inherit; }
      `}</style>
      {page==="landing"   && <LandingPage onGetStarted={()=>setPage("setup")} onViewHistory={()=>setPage("history")}/>}
      {page==="setup"     && <SetupPage onStart={s=>{ setSetup(s); setPage("interview"); }} onBack={()=>setPage("landing")}/>}
      {page==="interview" && setup && <InterviewPage setup={setup} onFinish={(h,s,p)=>{ setResults({history:h,scores:s,profile:p}); setPage("results"); }}/>}
      {page==="results"   && results && <ResultsPage {...results} onRestart={()=>{ setSetup(null); setResults(null); setPage("landing"); }}/>}
      {page==="history"   && <HistoryPage onBack={()=>setPage("landing")}/>}
    </div>
  );
}