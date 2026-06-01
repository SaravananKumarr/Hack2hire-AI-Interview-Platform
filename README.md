# 🤖 InterviewAI — AI-Powered Mock Interview Platform

<div align="center">

![InterviewAI Banner](https://img.shields.io/badge/Hack2Hire-2026-00D4FF?style=for-the-badge&logo=anthropic&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4-D97706?style=for-the-badge&logo=anthropic&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)

**A fully adaptive, AI-driven mock interview platform that simulates real-world technical interviews — built for the Hack2Hire 2026 Hackathon by UnsaidTalks.**

[🚀 Live Demo](#-live-demo) • [📹 Screen Recording](#-screen-recording) • [⚙️ Setup](#%EF%B8%8F-local-setup) • [📊 How It Works](#-how-it-works)

</div>

---

## 📹 Screen Recording

> 🎥 **[https://drive.google.com/file/d/17tM-QSyD0TpgQ2XV7P49tW7WrwNUOLPL/view?usp=sharing](#)**  


---

## 🚀 Live Demo

> 🌐 **[https://college-discovery-847g.vercel.app/](#)**  


---

## 📌 Problem Statement

In today's competitive hiring ecosystem, most candidates fail interviews **not because of lack of skill — but due to lack of structured interview preparedness.**

Common pain points:
- ❌ No realistic interview practice environment
- ❌ Unstructured or subjective feedback
- ❌ No performance measurement under time pressure
- ❌ Inability to adapt to varying difficulty levels

**InterviewAI solves all of these** with a fully automated, AI-powered interview system.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Resume & JD Analysis** | Claude AI extracts skills, experience, projects, and role requirements from raw text |
| 🎯 **Adaptive Difficulty** | Questions scale Easy → Medium → Hard based on your real-time performance |
| ⏱️ **Timed Responses** | Easy: 90s • Medium: 120s • Hard: 150s — colour-coded countdown timer |
| ⚡ **Time Expiry Penalty** | Time Efficiency score = 0 if the timer expires before you submit |
| 🚨 **Early Termination** | Interview ends automatically if 3 consecutive answers score below 25/100 |
| 📊 **5-Dimension Scoring** | Each answer scored on Accuracy, Clarity, Depth, Relevance & Time Efficiency |
| 🔴🟡🟢 **Live Progress Dots** | Colour-coded dots track your score per question in real time |
| 📋 **Final Readiness Report** | Score (0–100), Hire/No-Hire verdict, breakdown, strengths, weaknesses & Q-by-Q review |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite 5 | UI, state management, component architecture |
| AI Engine | Claude Sonnet 4 API | Question generation, answer evaluation, profile analysis |
| Styling | CSS-in-JS (inline) | Zero-dependency, fully custom dark theme |
| Build Tool | Vite | Fast HMR dev server + optimised production build |
| Hosting | Vercel / Netlify | Edge deployment with environment variable support |

---

## 📁 Project Structure

```
hack2hire-interview-platform/
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Full app: SetupPage → InterviewPage → ResultsPage
├── public/
│   └── favicon.svg
├── index.html            # Vite HTML template + Google Fonts
├── vite.config.js        # Vite + React plugin config
├── package.json
├── .env.example          # Template — copy to .env and add your API key
├── .gitignore
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites

- Node.js 18 or higher
- An Anthropic API key → [console.anthropic.com](https://console.anthropic.com)
- Git

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/hack2hire-interview-platform
cd hack2hire-interview-platform
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Add your API key

```bash
cp .env.example .env
```

Open `.env` and set:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx
```

### Step 4 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5 — Build for production

```bash
npm run build
npm run preview
```

---

## 🌐 Deployment

### Option A — Vercel (Recommended, Free)

1. Push your repo to GitHub (must be **public**)
2. Go to [vercel.com](https://vercel.com) → **Import Project**
3. Select your GitHub repository
4. Set build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Go to **Settings → Environment Variables** and add:
   ```
   VITE_ANTHROPIC_API_KEY = sk-ant-api03-xxxxxxxxxxxxxxxx
   ```
6. Click **Deploy** → your live URL will be `https://your-app.vercel.app`

### Option B — Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

Add `VITE_ANTHROPIC_API_KEY` in Netlify dashboard → Site Settings → Environment Variables.

> ⚠️ **Security Note:** The API key is used directly from the browser in this demo build.  
> For production, proxy all Anthropic API calls through a backend (e.g. a Vercel Edge Function) so the key is never exposed.

---

## 📊 How It Works

### Interview Flow

```
1. Setup       →  Candidate enters name, resume, and job description
2. Analysis    →  Claude extracts skills, experience, role title, key requirements
3. Interview   →  Up to 8 adaptive questions (Technical / Behavioral / Scenario)
4. Early Exit  →  Auto-terminates if 3 consecutive answers score < 25 / 100
5. Report      →  Final readiness score, hire verdict, breakdown, Q-by-Q review
```

### Adaptive Difficulty Logic

| Score | Action | Rationale |
|---|---|---|
| ≥ 70 / 100 | Increase difficulty (Easy→Medium or Medium→Hard) | Strong performance — push the candidate |
| 36 – 69 / 100 | Maintain current difficulty | Average — stabilise and observe |
| ≤ 35 / 100 | Decrease difficulty (Hard→Medium or Medium→Easy) | Weak performance — avoid compounding failure |
| < 25 × 3 in a row | **Early interview termination** | Persistent poor performance signals unreadiness |

### Time Limits Per Difficulty

| Difficulty | Time Allowed |
|---|---|
| 🟢 Easy | 90 seconds |
| 🟡 Medium | 120 seconds |
| 🔴 Hard | 150 seconds |

---

## 📐 Scoring System

Each answer is independently evaluated by Claude AI across **5 dimensions**:

| Dimension | Range | Criteria |
|---|---|---|
| **Accuracy** | 0 – 100 | Factual correctness of the answer |
| **Clarity** | 0 – 100 | How clearly the candidate communicated |
| **Depth** | 0 – 100 | Level of detail, examples, and insight |
| **Relevance** | 0 – 100 | How directly the answer addressed the question |
| **Time Efficiency** | 0 or scaled | 0 if timer expired; otherwise based on completeness |

### Readiness Categories

| Category | Score | Verdict |
|---|---|---|
| 🟢 **Strong** | ≥ 70 | Recommend Hire |
| 🟡 **Average** | 45 – 69 | Borderline — needs improvement in specific areas |
| 🔴 **Needs Improvement** | < 45 | Not Ready — significant preparation required |

> **Hiring threshold:** ≥ 65 overall score = Recommend Hire

---

## 📋 Final Report Includes

- ✅ Final Interview Readiness Score (0–100) as an animated ring chart
- ✅ Hire / No-Hire Verdict with explanation
- ✅ Performance Breakdown — bar chart for all 5 scoring dimensions
- ✅ Strengths — areas where the candidate excelled
- ✅ Areas to Improve — actionable weaknesses across the session
- ✅ Question-by-Question Review — difficulty, type, expiry flag, score & AI feedback

---

## 🔑 Getting an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys → Create Key**
4. Copy and paste the key into your `.env` file

> New accounts get free credits to get started.

---

## ❓ FAQ

**Q: What tech stack was used?**  
A: React 18, Vite 5, and the Anthropic Claude API. No external UI libraries — all styling is pure CSS-in-JS.

**Q: Can I use this without a Claude API key?**  
A: No. A valid Anthropic API key is required. Free credits are available for new accounts.

**Q: Is the API key safe to commit?**  
A: No — never commit your `.env` file. It is gitignored by default. Only `.env.example` (with a placeholder) is committed.

**Q: How many questions does the interview ask?**  
A: Up to 8. The session may end earlier if 3 consecutive answers score below 25/100.

**Q: Can it handle any tech role?**  
A: Yes — the platform reads your resume and JD, so it adapts to any technical role (frontend, backend, data, DevOps, etc.).

---

## 📦 Hackathon Submission

- **Event:** Hack2Hire 2026 — AI-Powered Interview Hackathon by UnsaidTalks
- **Deadline:** 1st June, 2026 at 6:00 PM IST
- **Portal:** [Unstop](https://unstop.com)
- **Submission:** Public GitHub repo link on the Unstop portal

---

## 👤 Author

Built for **Hack2Hire 2026** by UnsaidTalks

> Contact UnsaidTalks: [info@unsaidtalks.com](mailto:info@unsaidtalks.com) • +91-7303573374

---

<div align="center">


</div>