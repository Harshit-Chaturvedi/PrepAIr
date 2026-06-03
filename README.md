# PrepAIr — AI Interview & Resume Platform

A full-stack AI-powered interview preparation and resume builder platform.

## Features

### 🎤 AI Mock Interview
- Practice with **Sarah Mitchell**, an AI interviewer powered by Gemini Pro
- Real-time **speech recognition** for natural conversation
- **Voice responses** — Sarah speaks questions aloud
- **Inline coaching** after every answer
- Dynamic questions based on your resume (no repeats)
- MCQ assessments scaled to interview duration
- Comprehensive AI-generated performance dashboard

### 📄 AI Resume Builder
- Upload your resume PDF → AI rewrites it for top MNCs
- STAR-method bullets with quantified achievements
- ATS-optimized keywords and formatting
- Side-by-side comparison (original vs enhanced)
- Download enhanced resume

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| AI | Google Gemini Pro |
| PDF Parsing | pdf-parse |
| Speech | Web Speech API (browser) |
| Styling | Vanilla CSS |
| Deploy | Vercel |

## Getting Started

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd prepair
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
```
Get your key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add `GEMINI_API_KEY` in Settings → Environment Variables
4. Deploy

## Interview Duration Scaling

| Duration | Questions | MCQs |
|----------|----------|------|
| 5 min | 3 | 2 |
| 10 min | 5 | 3 |
| 15 min | 6 | 3 |
| 20 min | 8 | 4 |
| 30 min | 10 | 5 |
| 45 min | 14 | 6 |
| 60 min | 18 | 8 |

## License
MIT
