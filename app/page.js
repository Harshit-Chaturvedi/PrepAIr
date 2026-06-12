import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="page-bg-wrap">
      <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
      <div className="page-content">

        {/* ── Navigation ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(7, 8, 11, 0.75)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
        }} className="status-bar">
          <div style={{
            maxWidth: 1120, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 64,
          }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="PrepAIr Logo" style={{ height: 32, width: 'auto' }} />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <a href="#features" className="nav-link-item" style={{
                fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-2)',
                transition: 'color 0.2s', textDecoration: 'none',
              }}>Features</a>
              <a href="#how-it-works" className="nav-link-item" style={{
                fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-2)',
                transition: 'color 0.2s', textDecoration: 'none',
              }}>How it Works</a>
              <Link href="/interview" className="btn btn-primary" style={{
                padding: '8px 20px', fontSize: '0.82rem',
              }}>
                Start Free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero Section ── */}
        <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px 0' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
          }} className="hero-grid">
            <div style={{ animation: 'fadeInUp 0.7s ease forwards' }}>
              <div className="pill pill-blue" style={{ marginBottom: 20 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                AI-Powered Career Platform
              </div>

              <h1 style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.08,
                marginBottom: 20,
                color: 'var(--text)',
              }}>
                Ace every<br/>interview with<br/>
                <span className="gradient-text" style={{
                  backgroundImage: 'linear-gradient(135deg, #ffffff 40%, var(--blue-light) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>AI that coaches</span>
              </h1>

              <p style={{
                fontSize: '1.08rem', color: 'var(--text-2)',
                maxWidth: 460, lineHeight: 1.8, marginBottom: 32,
              }}>
                Practice with Sarah, your AI interviewer who gives real-time feedback.
                Build an MNC-ready resume. Land your dream job — prepared, not nervous.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                <Link href="/interview" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.9rem' }}>
                  Start Mock Interview
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
                <Link href="/resume-builder" className="btn btn-outline" style={{ padding: '12px 28px', fontSize: '0.9rem' }}>
                  Build Resume
                </Link>
              </div>

              {/* Trust pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div className="pill pill-green" style={{ fontSize: '0.64rem' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6L9 17l-5-5"/></svg>
                  Real-time Coaching
                </div>
                <div className="pill pill-blue" style={{ fontSize: '0.64rem' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4"/></svg>
                  ATS Scoring
                </div>
                <div className="pill pill-purple" style={{ fontSize: '0.64rem' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
                  Resume Builder
                </div>
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              animation: 'fadeInUp 0.7s ease 0.15s forwards',
              opacity: 0,
            }}>
              <img src="/hero.png" alt="Interview preparation" className="hero-img" />
            </div>
          </div>
        </section>

        {/* ── Stats / Trust Bar ── */}
        <section style={{ maxWidth: 1120, margin: '0 auto', padding: '56px 24px 0' }}>
          <div className="stats-grid" style={{
            background: 'var(--border)', borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
          }}>
            {[
              { value: '10K+', label: 'Resumes Built', icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              )},
              { value: '95%', label: 'Avg. ATS Score', icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              )},
              { value: 'IIT · NIT · BITS', label: 'Trusted by Students', icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              )},
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--surface)', padding: '28px 32px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: i === 0 ? 'var(--blue-bg)' : i === 1 ? 'var(--green-bg)' : 'var(--purple-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em',
                    color: 'var(--text)',
                  }}>{stat.value}</div>
                  <div style={{
                    fontSize: '0.76rem', color: 'var(--text-3)', fontWeight: 500,
                  }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
          <hr className="glow-line" style={{ margin: '56px 0' }} />
        </div>

        {/* ── Features ── */}
        <section id="features" style={{
          maxWidth: 1120, margin: '0 auto', padding: '0 24px 0',
          scrollMarginTop: 80,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="pill pill-purple" style={{ marginBottom: 12 }}>Core Features</div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800,
              letterSpacing: '-0.03em', color: 'var(--text)',
            }}>
              Everything you need to <span className="gradient-text">land the job</span>
            </h2>
            <p style={{
              fontSize: '0.95rem', color: 'var(--text-2)', maxWidth: 520,
              margin: '12px auto 0', lineHeight: 1.7,
            }}>
              Two powerful tools, one platform. Prepare with AI-driven mock interviews
              and build resumes that pass every ATS filter.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
          }} className="feat-grid-2">

            {/* Interview Card */}
            <Link href="/interview" className="feature-link-card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Subtle background pattern */}
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 140, height: 140, borderRadius: '50%',
                background: 'var(--blue-bg)', opacity: 0.5,
                pointerEvents: 'none',
              }} />
              <div className="flc-header">
                <div className="flc-icon" style={{
                  background: 'var(--blue-bg)',
                  border: '1px solid var(--blue-border)',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" className="flc-arrow">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>

              <h2 style={{
                fontSize: '1.3rem', fontWeight: 700, marginBottom: 8,
                letterSpacing: '-0.02em',
              }}>AI Mock Interview</h2>

              <p style={{
                fontSize: '0.88rem', color: 'var(--text-2)',
                lineHeight: 1.7, marginBottom: 18,
              }}>
                Practice with Sarah Mitchell — a senior AI recruiter who adapts questions
                in real-time based on your resume, coaches you after each answer, and
                generates a detailed performance scorecard.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 0 }}>
                <span className="pill pill-green" style={{ fontSize: '0.6rem' }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  Voice Recognition
                </span>
                <span className="pill pill-blue" style={{ fontSize: '0.6rem' }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  Live Coaching
                </span>
                <span className="pill pill-purple" style={{ fontSize: '0.6rem' }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  MCQ Assessment
                </span>
              </div>

              <div className="flc-persona">
                <img src="/interviewer.png" alt="Sarah" style={{
                  width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
                  border: '2px solid var(--blue-border)',
                }} />
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Sarah Mitchell</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Your AI Interviewer · Senior Recruiter</span>
                </div>
              </div>
            </Link>

            {/* Resume Builder Card */}
            <Link href="/resume-builder" className="feature-link-card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Subtle background pattern */}
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 140, height: 140, borderRadius: '50%',
                background: 'var(--purple-bg)', opacity: 0.5,
                pointerEvents: 'none',
              }} />
              <div className="flc-header">
                <div className="flc-icon" style={{
                  background: 'var(--purple-bg)',
                  border: '1px solid var(--purple-border)',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" className="flc-arrow">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>

              <h2 style={{
                fontSize: '1.3rem', fontWeight: 700, marginBottom: 8,
                letterSpacing: '-0.02em',
              }}>AI Resume Builder</h2>

              <p style={{
                fontSize: '0.88rem', color: 'var(--text-2)',
                lineHeight: 1.7, marginBottom: 18,
              }}>
                Upload your resume and AI transforms it into formats accepted at
                Google, Microsoft, and top MNCs. Quantified achievements,
                STAR-method bullets, and ATS-optimized keywords — automatically.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="pill pill-green" style={{ fontSize: '0.6rem' }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  FAANG Format
                </span>
                <span className="pill pill-blue" style={{ fontSize: '0.6rem' }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  ATS Optimized
                </span>
                <span className="pill pill-purple" style={{ fontSize: '0.6rem' }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  PDF Download
                </span>
              </div>
            </Link>
          </div>
        </section>

        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
          <hr className="glow-line" style={{ margin: '56px 0' }} />
        </div>

        {/* ── How It Works ── */}
        <section id="how-it-works" style={{
          maxWidth: 1120, margin: '0 auto', padding: '0 24px',
          scrollMarginTop: 80,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="pill pill-green" style={{ marginBottom: 12 }}>Simple Process</div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800,
              letterSpacing: '-0.03em', color: 'var(--text)',
            }}>
              How It Works
            </h2>
            <p style={{
              fontSize: '0.95rem', color: 'var(--text-2)', maxWidth: 440,
              margin: '12px auto 0', lineHeight: 1.7,
            }}>
              Three simple steps from upload to offer-ready.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
            position: 'relative',
          }} className="how-grid">
            {/* Connecting timeline line */}
            <div className="timeline-line" style={{
              position: 'absolute', top: 42, left: 'calc(16.67% + 18px)',
              right: 'calc(16.67% + 18px)', height: 2,
              background: 'linear-gradient(90deg, var(--blue), var(--purple))',
              borderRadius: 1, zIndex: 0,
              opacity: 0.3,
            }} />

            {[
              {
                num: '1',
                title: 'Upload Resume',
                desc: 'Drop your PDF resume. Our AI extracts skills, experience, and key achievements in seconds.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                ),
              },
              {
                num: '2',
                title: 'Practice or Build',
                desc: 'Start a mock interview with live voice recognition, or let AI rewrite your resume for top companies.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                ),
              },
              {
                num: '3',
                title: 'Get Results',
                desc: 'Receive detailed scoring, real-time coaching feedback, and a downloadable MNC-ready resume.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div key={i} className="step-card" style={{
                position: 'relative', zIndex: 1,
                margin: '0 12px',
                textAlign: 'center',
                padding: '32px 24px',
              }}>
                <div className="step-num" style={{
                  width: 44, height: 44, borderRadius: 12,
                  fontSize: '0',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 12px rgba(79,107,246,0.25)',
                }}>
                  {step.icon}
                </div>
                <h3 style={{
                  fontSize: '1rem', fontWeight: 700,
                  marginBottom: 8, letterSpacing: '-0.01em',
                }}>{step.title}</h3>
                <p style={{
                  fontSize: '0.84rem', color: 'var(--text-2)',
                  lineHeight: 1.7,
                }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section style={{
          maxWidth: 1120, margin: '64px auto 0', padding: '0 24px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(79,107,246,0.06), rgba(124,58,237,0.06))',
            border: '1px solid var(--blue-border)',
            borderRadius: 'var(--radius)',
            padding: '56px 48px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Background glow */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400, height: 400, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(79,107,246,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800,
              letterSpacing: '-0.03em', marginBottom: 12,
              position: 'relative',
            }}>
              Ready to <span className="gradient-text">ace your next interview?</span>
            </h2>
            <p style={{
              fontSize: '0.95rem', color: 'var(--text-2)',
              maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7,
              position: 'relative',
            }}>
              Join thousands of students who landed offers at top companies
              after preparing with PrepAIr.
            </p>
            <div style={{
              display: 'flex', gap: 12, justifyContent: 'center',
              flexWrap: 'wrap', position: 'relative',
            }}>
              <Link href="/interview" className="btn btn-primary" style={{
                padding: '14px 32px', fontSize: '0.92rem',
              }}>
                Start Mock Interview
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <Link href="/resume-builder" className="btn btn-outline" style={{
                padding: '14px 32px', fontSize: '0.92rem',
              }}>
                Build Your Resume
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          maxWidth: 1120, margin: '0 auto',
          padding: '48px 24px 40px',
        }}>
          <hr className="glow-line" style={{ marginBottom: 40 }} />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/logo.png" alt="PrepAIr Logo" style={{ height: 22, width: 'auto' }} />
              </Link>
              <span style={{
                fontSize: '0.75rem', color: 'var(--text-3)',
              }}>AI Interview &amp; Resume Platform</span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 24,
            }}>
              <Link href="/interview" style={{
                fontSize: '0.78rem', color: 'var(--text-3)',
                transition: 'color 0.2s',
              }}>Interview</Link>
              <Link href="/resume-builder" style={{
                fontSize: '0.78rem', color: 'var(--text-3)',
                transition: 'color 0.2s',
              }}>Resume Builder</Link>
              <span style={{
                fontSize: '0.72rem', color: 'var(--text-3)', opacity: 0.7,
              }}>© {new Date().getFullYear()} PrepAIr</span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
