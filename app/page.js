import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="page-bg-wrap">
      <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
      <div className="page-content" style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 24px 80px' }}>
        
        {/* Brand */}
        <div className="brand" style={{ marginBottom: 48 }}>
          <div className="brand-mark"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
          <span className="brand-name">PrepAIr</span>
        </div>

        {/* Hero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 56 }} className="hero-grid">
          <div>
            <div className="pill pill-blue" style={{ marginBottom: 18 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              AI-Powered Platform
            </div>
            <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3.2rem)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.12, marginBottom: 16 }}>
              Ace your next<br/>interview with<br/>
              <span className="gradient-text">AI that coaches</span>
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-2)', maxWidth: 440, lineHeight: 1.75, marginBottom: 24 }}>
              Practice with Sarah, your AI interviewer who gives real-time feedback. Build an MNC-ready resume. Land your dream job.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div className="pill pill-green" style={{ fontSize: '0.62rem' }}>Real-time Coaching</div>
              <div className="pill pill-blue" style={{ fontSize: '0.62rem' }}>ATS Scoring</div>
              <div className="pill pill-purple" style={{ fontSize: '0.62rem' }}>Resume Builder</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <img src="/hero.png" alt="Interview preparation" className="hero-img" />
          </div>
        </div>

        <hr className="glow-line" style={{ marginBottom: 48 }} />

        {/* Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48 }} className="feat-grid-2">
          {/* Interview Card */}
          <Link href="/interview" className="feature-link-card">
            <div className="flc-header">
              <div className="flc-icon" style={{ background: 'var(--blue-bg)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" className="flc-arrow"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>AI Mock Interview</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 16 }}>
              Practice with Sarah Mitchell, a senior AI recruiter. She asks dynamic questions based on your resume, coaches you after each answer, and generates a detailed performance report.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="pill pill-green" style={{ fontSize: '0.58rem' }}>Voice Recognition</span>
              <span className="pill pill-blue" style={{ fontSize: '0.58rem' }}>Live Coaching</span>
              <span className="pill pill-purple" style={{ fontSize: '0.58rem' }}>MCQ Assessment</span>
            </div>
            <div className="flc-persona">
              <img src="/interviewer.png" alt="Sarah" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Sarah Mitchell</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Your AI Interviewer</span>
              </div>
            </div>
          </Link>

          {/* Resume Builder Card */}
          <Link href="/resume-builder" className="feature-link-card">
            <div className="flc-header">
              <div className="flc-icon" style={{ background: 'var(--purple-bg)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" className="flc-arrow"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>AI Resume Builder</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 16 }}>
              Upload your resume and AI transforms it into a format accepted at Google, Microsoft, and top MNCs. Quantified achievements, STAR-method bullets, ATS-optimized keywords.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="pill pill-green" style={{ fontSize: '0.58rem' }}>FAANG Format</span>
              <span className="pill pill-blue" style={{ fontSize: '0.58rem' }}>ATS Optimized</span>
              <span className="pill pill-purple" style={{ fontSize: '0.58rem' }}>PDF Download</span>
            </div>
          </Link>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="how-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 6 }}>Upload Resume</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>Drop your PDF resume. AI extracts skills, experience, and key achievements automatically.</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 6 }}>Practice or Build</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>Start a mock interview with voice recognition, or let AI rewrite your resume for top companies.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 6 }}>Get Results</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>Receive detailed scoring, coaching feedback, and a downloadable MNC-ready resume.</p>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 40 }}>PrepAIr · AI Interview & Resume Platform</p>
      </div>
    </div>
  );
}
