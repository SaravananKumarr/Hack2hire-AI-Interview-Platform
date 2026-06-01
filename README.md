# InterviewAI – Hack2Hire 2026

An AI-Powered Mock Interview Platform built for the **Hack2Hire: AI-Powered Interview Hackathon** by UnsaidTalks.

## 🚀 Live Demo

> *(Add your Vercel/Netlify URL here after deployment)*

## 📹 Screen Recording

> *(Add your screen recording link here — required for submission)*

## ✨ Features

| Feature | Description |
|---|---|
| Resume + JD Analysis | Claude extracts skills, experience, and role requirements |
| Adaptive Difficulty | Questions scale Easy → Medium → Hard based on your answers |
| Real-time Timers | 90s / 120s / 150s per question depending on difficulty |
| Early Termination | Interview ends if 3 consecutive scores fall below 25/100 |
| AI Scoring | Each answer scored on Accuracy, Clarity, Depth, Relevance, Time Efficiency |
| Final Report | Readiness score (0–100), Hire/No-Hire verdict, strengths & weaknesses |

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **AI**: Anthropic Claude API (claude-sonnet-4)
- **Styling**: Pure CSS-in-JS (no external UI library)
- **Hosting**: Vercel (recommended)

## 📦 Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/hack2hire-interview-platform
cd hack2hire-interview-platform

# 2. Install dependencies
npm install

# 3. Add your API key
cp .env.example .env
# Edit .env and set VITE_ANTHROPIC_API_KEY=sk-ant-...

# 4. Run locally
npm run dev
# Open http://localhost:3000
```

## 🌐 Deploy to Vercel (Free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable in Vercel dashboard:
# VITE_ANTHROPIC_API_KEY = your key
```

Or use **Netlify**:
1. Connect your GitHub repo on netlify.com
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add `VITE_ANTHROPIC_API_KEY` in Environment Variables

## 🔑 Getting an Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up / log in
3. Go to **API Keys** → **Create Key**
4. Copy and paste into your `.env` file

## 📁 Project Structure

```
hack2hire-interview-platform/
├── src/
│   ├── main.jsx        # React entry point
│   └── App.jsx         # Full application (setup → interview → results)
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── package.json
├── .env.example        # Copy to .env and add your API key
└── README.md
```

## 🧠 How It Works

1. **Setup**: Candidate pastes resume + job description + name
2. **Profile Analysis**: Claude extracts skills, experience, role requirements
3. **Interview Loop** (up to 8 questions):
   - Claude generates a question at the current difficulty level
   - Candidate answers within the time limit
   - Claude evaluates the answer across 5 dimensions
   - Difficulty adapts up/down based on the score
   - If 3 consecutive scores < 25, interview terminates early
4. **Results**: Final readiness score, hiring verdict, breakdown by skill area, Q-by-Q review

## 📊 Scoring System

| Dimension | Weight | Description |
|---|---|---|
| Accuracy | Equal | Factual correctness |
| Clarity | Equal | Communication quality |
| Depth | Equal | Level of insight and detail |
| Relevance | Equal | How well the question was addressed |
| Time Efficiency | Equal | 0 if time expired, scaled otherwise |

**Readiness categories**: Strong (≥70) · Average (45–69) · Needs Improvement (<45)  
**Hiring threshold**: ≥65 overall score

## 👤 Author

Built for Hack2Hire 2026 by UnsaidTalks
