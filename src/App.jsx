import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  bg: "#0a0e1a", surface: "#111827", card: "#1a2235", border: "#1e3a5f",
  accent: "#00d4ff", accentDim: "#0099bb", gold: "#f59e0b",
  success: "#10b981", danger: "#ef4444", warn: "#f97316",
  text: "#e2e8f0", muted: "#64748b", textDim: "#94a3b8",
};

const DIFF_COLORS = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };
const DIFF_TIME = { Easy: 90, Medium: 120, Hard: 150 };
const MAX_Q = 8;
const EARLY_TERM_THRESHOLD = 25;
const EARLY_TERM_STREAK = 3;

// ── Replace with your Anthropic API key ──────────────────────────────────────
// For production: use a backend proxy (see README.md)
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

async function callClaude(messages, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-calls": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch { return null; }
}

// ── UI Primitives ─────────────────────────────────────────────────────────────

function Tag({ label, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 4, padding: "2px 10px", fontSize: 12, fontWeight: 600,
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>{label}</span>
  );
}

function Progress({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: "#1e3a5f44", borderRadius: 99, height: 8, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%", background: color,
        borderRadius: 99, transition: "width 0.4s ease",
      }} />
    </div>
  );
}

function Timer({ seconds, total, onExpire }) {
  const [left, setLeft] = useState(seconds);
  const ref = useRef(null);
  const expired = useRef(false);

  useEffect(() => {
    setLeft(seconds);
    expired.current = false;
    ref.current = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) {
          clearInterval(ref.current);
          if (!expired.current) { expired.current = true; onExpire(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [seconds]);

  const pct = left / total;
  const color = pct > 0.5 ? COLORS.success : pct > 0.25 ? COLORS.warn : COLORS.danger;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        fontFamily: "monospace", fontSize: 28, fontWeight: 700, color,
        background: color + "15", border: `2px solid ${color}44`,
        borderRadius: 8, padding: "4px 16px", minWidth: 90, textAlign: "center",
      }}>{mm}:{ss}</div>
      <div style={{ flex: 1 }}><Progress value={left} max={total} color={color} /></div>
    </div>
  );
}

function ScoreRing({ score }) {
  const color = score >= 70 ? COLORS.success : score >= 45 ? COLORS.gold : COLORS.danger;
  const label = score >= 70 ? "Strong" : score >= 45 ? "Average" : "Needs Improvement";
  const r = 54, circ = 2 * Math.PI * r, dash = circ * (score / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={r} fill="none" stroke="#1e3a5f" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 70 70)" />
        <text x={70} y={66} textAnchor="middle" fill={color} fontSize={28} fontWeight={700}>{score}</text>
        <text x={70} y={84} textAnchor="middle" fill={COLORS.muted} fontSize={12}>/ 100</text>
      </svg>
      <Tag label={label} color={color} />
    </div>
  );
}

// ── Pages ─────────────────────────────────────────────────────────────────────

function SetupPage({ onStart }) {
  const [resume, setResume] = useState("");
  const [jd, setJD] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canStart = resume.trim().length > 50 && jd.trim().length > 30 && name.trim();

  async function handleStart() {
    setLoading(true); setError("");
    try {
      const sys = `You are an AI interview analyst. Extract structured info from a candidate resume and job description.
Return ONLY valid JSON:
{ "candidateName": string, "skills": string[], "experience": string, "topSkills": string[], "roleTitle": string, "keyRequirements": string[] }
No markdown, no extra text.`;
      const raw = await callClaude([{ role: "user", content: `Candidate Name: ${name}\n\nRESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jd}` }], sys);
      const parsed = parseJSON(raw);
      if (!parsed) throw new Error("Parse failed");
      onStart({ resume, jd, name, profile: parsed });
    } catch (e) {
      setError("Could not analyze resume/JD. Check your API key and inputs.");
    }
    setLoading(false);
  }

  const inp = {
    background: "#0d1829", border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    color: COLORS.text, padding: "10px 14px", fontSize: 14, width: "100%",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit", resize: "vertical",
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.2em", color: COLORS.accent, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
          Hack2Hire · AI Interview Platform
        </div>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: COLORS.text, lineHeight: 1.2 }}>
          Mock Interview<br /><span style={{ color: COLORS.accent }}>Simulator</span>
        </h1>
        <p style={{ color: COLORS.muted, marginTop: 12, fontSize: 15 }}>
          Paste your resume and job description to begin an adaptive AI interview session.
        </p>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <div>
          <label style={{ display: "block", color: COLORS.textDim, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Your Name</label>
          <input style={{ ...inp, height: 42, resize: "none" }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Arun Kumar" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ display: "block", color: COLORS.textDim, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Resume / Profile</label>
            <textarea style={{ ...inp, height: 220 }} value={resume} onChange={e => setResume(e.target.value)} placeholder="Paste your resume text here…" />
          </div>
          <div>
            <label style={{ display: "block", color: COLORS.textDim, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Job Description</label>
            <textarea style={{ ...inp, height: 220 }} value={jd} onChange={e => setJD(e.target.value)} placeholder="Paste the target job description…" />
          </div>
        </div>
        {error && <div style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 8, padding: "10px 14px", color: COLORS.danger, fontSize: 14 }}>{error}</div>}
        <button onClick={handleStart} disabled={!canStart || loading} style={{
          background: canStart && !loading ? COLORS.accent : "#1e3a5f",
          color: canStart && !loading ? "#0a0e1a" : COLORS.muted,
          border: "none", borderRadius: 8, padding: "14px 32px",
          fontSize: 16, fontWeight: 700, cursor: canStart && !loading ? "pointer" : "default",
        }}>
          {loading ? "Analyzing profile…" : "Start Interview →"}
        </button>
      </div>

      <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          ["Adaptive Difficulty", "Questions adjust based on your real-time performance"],
          ["Timed Responses", "Each question has a countdown — just like real interviews"],
          ["AI Scoring", "Evaluated on accuracy, clarity, depth, and time efficiency"],
        ].map(([t, d]) => (
          <div key={t} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{t}</div>
            <div style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterviewPage({ setup, onFinish }) {
  const [qNum, setQNum] = useState(0);
  const [difficulty, setDifficulty] = useState("Easy");
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [history, setHistory] = useState([]);
  const [scores, setScores] = useState([]);
  const [lowStreak, setLowStreak] = useState(0);
  const [status, setStatus] = useState("");
  const [timerKey, setTimerKey] = useState(0);
  const answerRef = useRef("");

  useEffect(() => { answerRef.current = answer; }, [answer]);

  const loadQuestion = useCallback(async (diff, hist) => {
    setLoading(true); setAnswer(""); setTimeExpired(false); setStatus("");
    const sys = `You are a strict technical interviewer for a ${setup.profile.roleTitle} role.
Candidate skills: ${setup.profile.skills.join(", ")}.
Job requires: ${setup.profile.keyRequirements.join(", ")}.
Previous questions asked: ${hist.map(h => h.question).join(" | ") || "none"}.
Generate ONE unique ${diff} difficulty interview question (technical, behavioral, or scenario-based).
Return ONLY valid JSON: { "question": string, "type": "Technical"|"Behavioral"|"Scenario", "hint": string }`;
    const raw = await callClaude([{ role: "user", content: `Generate a ${diff} interview question. Don't repeat previous questions.` }], sys);
    const parsed = parseJSON(raw);
    setQuestion(parsed || { question: "Tell me about a challenging project you worked on and how you handled it.", type: "Behavioral", hint: "Focus on your specific role and outcome." });
    setTimerKey(k => k + 1);
    setLoading(false);
  }, [setup]);

  useEffect(() => { loadQuestion("Easy", []); }, []);

  const submitAnswer = useCallback(async (ans, expired) => {
    if (evaluating) return;
    setEvaluating(true); setStatus("Evaluating your answer…");
    const sys = `You are a strict technical interview evaluator for a ${setup.profile.roleTitle} role.
Score the candidate's answer on 5 dimensions (0-100 each): accuracy, clarity, depth, relevance, timeEfficiency.
timeEfficiency = ${expired ? "0 — answer was not submitted in time" : "score based on completeness vs brevity"}.
Return ONLY valid JSON:
{ "accuracy": number, "clarity": number, "depth": number, "relevance": number, "timeEfficiency": number, "overallScore": number, "feedback": string, "strengths": string[], "weaknesses": string[] }`;
    const raw = await callClaude([{ role: "user", content: `Question: ${question.question}\nAnswer: ${expired ? "[NO ANSWER — TIME EXPIRED]" : ans || "[No answer provided]"}` }], sys);
    const eval_ = parseJSON(raw) || { accuracy: 20, clarity: 20, depth: 20, relevance: 20, timeEfficiency: expired ? 0 : 20, overallScore: 20, feedback: "Could not evaluate.", strengths: [], weaknesses: ["No answer provided"] };

    const newHistory = [...history, { question: question.question, type: question.type, difficulty, answer: expired ? "" : ans, eval: eval_, expired }];
    const newScores = [...scores, eval_.overallScore];
    const newStreak = eval_.overallScore < EARLY_TERM_THRESHOLD ? lowStreak + 1 : 0;
    setLowStreak(newStreak); setHistory(newHistory); setScores(newScores);

    if (newStreak >= EARLY_TERM_STREAK) {
      setStatus("Interview terminated early: performance below threshold.");
      setTimeout(() => onFinish(newHistory, newScores, setup.profile), 2000);
      setEvaluating(false); return;
    }
    if (newHistory.length >= MAX_Q) { onFinish(newHistory, newScores, setup.profile); setEvaluating(false); return; }

    const nextDiff = eval_.overallScore >= 70 ? (difficulty === "Easy" ? "Medium" : "Hard")
      : eval_.overallScore <= 35 ? (difficulty === "Hard" ? "Medium" : "Easy") : difficulty;
    setDifficulty(nextDiff); setQNum(n => n + 1);
    await loadQuestion(nextDiff, newHistory);
    setEvaluating(false);
  }, [evaluating, question, history, scores, difficulty, lowStreak, setup, onFinish, loadQuestion]);

  const handleExpire = useCallback(() => {
    setTimeExpired(true);
    submitAnswer(answerRef.current, true);
  }, [submitAnswer]);

  if (loading || !question) return (
    <div style={{ textAlign: "center", padding: 80, color: COLORS.muted }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
      <div style={{ fontSize: 18, color: COLORS.textDim }}>Preparing question {qNum + 1}…</div>
    </div>
  );

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const lastEval = history[history.length - 1]?.eval;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Tag label={`Q ${qNum + 1} / ${MAX_Q}`} color={COLORS.accent} />
          <Tag label={difficulty} color={DIFF_COLORS[difficulty]} />
          <Tag label={question.type} color={COLORS.textDim} />
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {avgScore !== null && <div style={{ color: COLORS.muted, fontSize: 13 }}>Avg: <span style={{ color: avgScore >= 60 ? COLORS.success : COLORS.warn, fontWeight: 700 }}>{avgScore}</span></div>}
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: MAX_Q }).map((_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: "50%",
                background: i < scores.length ? (scores[i] >= 60 ? COLORS.success : scores[i] >= 35 ? COLORS.gold : COLORS.danger) : i === qNum ? COLORS.accent : "#1e3a5f",
              }} />
            ))}
          </div>
        </div>
      </div>

      {!evaluating && !timeExpired && (
        <div style={{ marginBottom: 20 }}>
          <Timer key={timerKey} seconds={DIFF_TIME[difficulty]} total={DIFF_TIME[difficulty]} onExpire={handleExpire} />
        </div>
      )}

      <div style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
        <div style={{ color: COLORS.muted, fontSize: 12, letterSpacing: "0.1em", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Question</div>
        <p style={{ margin: 0, fontSize: 18, color: COLORS.text, lineHeight: 1.7, fontWeight: 500 }}>{question.question}</p>
        {question.hint && <p style={{ margin: "12px 0 0", fontSize: 13, color: COLORS.muted, borderLeft: `3px solid ${COLORS.accent}44`, paddingLeft: 12 }}>Hint: {question.hint}</p>}
      </div>

      {lastEval && !evaluating && (
        <div style={{ background: "#0d1829", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ color: COLORS.muted }}>Last score:</span>
            <Tag label={`${lastEval.overallScore}/100`} color={lastEval.overallScore >= 60 ? COLORS.success : lastEval.overallScore >= 35 ? COLORS.gold : COLORS.danger} />
          </div>
          <div style={{ color: COLORS.textDim }}>{lastEval.feedback}</div>
        </div>
      )}

      {!evaluating && !timeExpired ? (
        <>
          <textarea style={{
            width: "100%", boxSizing: "border-box", background: "#0d1829",
            border: `1.5px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text,
            padding: "16px", fontSize: 15, fontFamily: "inherit", resize: "vertical",
            minHeight: 160, outline: "none", lineHeight: 1.7,
          }} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer here…" />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => submitAnswer(answer, false)} style={{
              background: COLORS.accent, color: "#0a0e1a", border: "none",
              borderRadius: 8, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>Submit Answer →</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "32px", color: COLORS.muted }}>
          {status || (timeExpired ? "Time's up! Moving to next question…" : "Evaluating…")}
        </div>
      )}
    </div>
  );
}

function ResultsPage({ history, scores, profile }) {
  const finalScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const hired = finalScore >= 65;
  const avgDims = ["accuracy", "clarity", "depth", "relevance", "timeEfficiency"].reduce((acc, dim) => {
    acc[dim] = Math.round(history.filter(h => h.eval?.[dim] !== undefined).reduce((s, h) => s + (h.eval[dim] || 0), 0) / (history.length || 1));
    return acc;
  }, {});
  const allStrengths = [...new Set(history.flatMap(h => h.eval?.strengths || []))].slice(0, 4);
  const allWeaknesses = [...new Set(history.flatMap(h => h.eval?.weaknesses || []))].slice(0, 4);
  const dimLabels = { accuracy: "Accuracy", clarity: "Clarity", depth: "Depth", relevance: "Relevance", timeEfficiency: "Time Efficiency" };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.2em", color: COLORS.accent, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Interview Complete</div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: COLORS.text }}>Your Results</h1>
        <div style={{ color: COLORS.muted, marginTop: 6 }}>{profile.candidateName} · {profile.roleTitle}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 12, padding: "28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ color: COLORS.muted, fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>Readiness Score</div>
          <ScoreRing score={finalScore} />
        </div>
        <div style={{ background: COLORS.card, border: `1.5px solid ${hired ? COLORS.success : COLORS.danger}55`, borderRadius: 12, padding: "28px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ color: COLORS.muted, fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>Hiring Verdict</div>
          <div style={{ fontSize: 48 }}>{hired ? "✅" : "❌"}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: hired ? COLORS.success : COLORS.danger }}>{hired ? "Recommend Hire" : "Not Ready Yet"}</div>
          <div style={{ color: COLORS.muted, fontSize: 13, textAlign: "center" }}>{hired ? "Candidate demonstrates sufficient readiness for this role." : "Further preparation recommended before applying."}</div>
        </div>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
        <div style={{ color: COLORS.textDim, fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginBottom: 18 }}>Performance Breakdown</div>
        <div style={{ display: "grid", gap: 14 }}>
          {Object.entries(avgDims).map(([key, val]) => (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "140px 1fr 40px", alignItems: "center", gap: 12 }}>
              <div style={{ color: COLORS.textDim, fontSize: 14 }}>{dimLabels[key]}</div>
              <Progress value={val} max={100} color={val >= 70 ? COLORS.success : val >= 45 ? COLORS.gold : COLORS.danger} />
              <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 600, textAlign: "right" }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[["Strengths", allStrengths, COLORS.success, "✓"], ["Areas to Improve", allWeaknesses, COLORS.danger, "↑"]].map(([title, items, color, icon]) => (
          <div key={title} style={{ background: COLORS.card, border: `1px solid ${color}33`, borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ color, fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginBottom: 14 }}>{title}</div>
            {items.length ? items.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ color: COLORS.textDim, fontSize: 14, lineHeight: 1.5 }}>{s}</span>
              </div>
            )) : <div style={{ color: COLORS.muted, fontSize: 14 }}>None identified.</div>}
          </div>
        ))}
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ color: COLORS.textDim, fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginBottom: 18 }}>Question-by-Question Review</div>
        <div style={{ display: "grid", gap: 16 }}>
          {history.map((h, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${h.eval?.overallScore >= 60 ? COLORS.success : h.eval?.overallScore >= 35 ? COLORS.gold : COLORS.danger}`, paddingLeft: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <Tag label={`Q${i + 1}`} color={COLORS.accent} />
                <Tag label={h.difficulty} color={DIFF_COLORS[h.difficulty]} />
                <Tag label={h.type} color={COLORS.muted} />
                {h.expired && <Tag label="Timed Out" color={COLORS.danger} />}
                <Tag label={`${h.eval?.overallScore || 0}/100`} color={h.eval?.overallScore >= 60 ? COLORS.success : h.eval?.overallScore >= 35 ? COLORS.gold : COLORS.danger} />
              </div>
              <div style={{ color: COLORS.text, fontSize: 14, marginBottom: 4, fontWeight: 500 }}>{h.question}</div>
              <div style={{ color: COLORS.muted, fontSize: 13 }}>{h.eval?.feedback}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => window.location.reload()} style={{
        background: COLORS.accent, color: "#0a0e1a", border: "none",
        borderRadius: 8, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer",
      }}>← Start New Interview</button>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("setup");
  const [setup, setSetup] = useState(null);
  const [results, setResults] = useState(null);

  function handleStart(s) { setSetup(s); setPage("interview"); }
  function handleFinish(history, scores, profile) { setResults({ history, scores, profile }); setPage("results"); }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "14px 28px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, letterSpacing: "0.04em" }}>InterviewAI</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: COLORS.muted }}>Hack2Hire 2026</span>
      </nav>
      {page === "setup" && <SetupPage onStart={handleStart} />}
      {page === "interview" && setup && <InterviewPage setup={setup} onFinish={handleFinish} />}
      {page === "results" && results && <ResultsPage {...results} />}
    </div>
  );
}
