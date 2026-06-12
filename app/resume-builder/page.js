'use client';
import { useState, useRef, useEffect } from 'react';

export default function ResumeBuilderPage() {
  const [step, setStep] = useState('upload'); // upload | enhancing | preview
  const [fileName, setFileName] = useState('');
  const [uploadState, setUploadState] = useState('idle');
  const [resumeText, setResumeText] = useState('');
  const [skills, setSkills] = useState([]);
  const [targetTier, setTargetTier] = useState('FAANG / Big Tech');
  const [targetRole, setTargetRole] = useState('');
  const [enhanced, setEnhanced] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enhanceStep, setEnhanceStep] = useState(0);
  const fileInputRef = useRef(null);

  // Animate enhance steps
  useEffect(() => {
    if (step !== 'enhancing') return;
    const timers = [
      setTimeout(() => setEnhanceStep(1), 1500),
      setTimeout(() => setEnhanceStep(2), 3500),
      setTimeout(() => setEnhanceStep(3), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const handleFileUpload = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;
    setFileName(file.name);
    setUploadState('uploading');
    const reader = new FileReader();
    reader.onload = async (e) => {
      setUploadState('processing');
      const base64 = e.target.result.split(',')[1];
      try {
        const res = await fetch('/api/parse-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData: base64 }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResumeText(data.text);
        setSkills(data.skills || []);
        setUploadState('success');
      } catch (err) {
        setUploadState('idle');
        alert('Failed to parse resume: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
  };

  const enhanceResume = async () => {
    if (!resumeText) return;
    setIsLoading(true);
    setStep('enhancing');
    setEnhanceStep(0);
    try {
      const res = await fetch('/api/enhance-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetTier, targetRole }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEnhanced(data);
      setStep('preview');
    } catch (err) {
      alert('Failed to enhance resume: ' + err.message);
      setStep('upload');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Resume HTML builder for downloads ---
  const buildResumeHTML = (forDocx = false) => {
    if (!enhanced) return '';
    const ff = forDocx ? 'Calibri, Arial, sans-serif' : "'Inter', Arial, sans-serif";
    const c = enhanced.contact || {};
    
    let html = `<div style="font-family: ${ff}; color: #1a1a1a; width: 100%; box-sizing: border-box; padding: ${forDocx ? '8px 12px' : '10px 20px'}; font-size: 9pt; line-height: 1.3;">`; 
    
    // Name & Contact Header
    if (enhanced.name) {
      html += `<div style="text-align: center; margin-bottom: 3px;">
        <h1 style="font-size: 16pt; font-weight: 800; margin: 0 0 2px; letter-spacing: 0.5px;">${enhanced.name}</h1>
        <div style="font-size: 8pt; color: #555;">`;
      const parts = [];
      if (c.email) parts.push(c.email);
      if (c.phone) parts.push(c.phone);
      if (c.location) parts.push(c.location);
      if (c.linkedin) parts.push(`<a href="${c.linkedin}" style="color: #2563eb; text-decoration: none;">${c.linkedin.replace(/https?:\/\/(www\.)?/, '')}</a>`);
      if (c.github) parts.push(`<a href="${c.github}" style="color: #2563eb; text-decoration: none;">${c.github.replace(/https?:\/\/(www\.)?/, '')}</a>`);
      if (c.portfolio) parts.push(`<a href="${c.portfolio}" style="color: #2563eb; text-decoration: none;">${c.portfolio.replace(/https?:\/\/(www\.)?/, '')}</a>`);
      html += parts.join(' | ');
      html += `</div></div><hr style="border: none; border-top: 1.5px solid #1a1a1a; margin: 0 0 4px;">`;
    }
    
    const sectionHead = (title) => `<h2 style="font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a1a; margin: 6px 0 2px; padding-bottom: 1px; border-bottom: 0.5px solid #ccc;">${title}</h2>`;

    // Summary
    if (enhanced.summary) {
      html += `${sectionHead('Summary')}<p style="font-size: 9pt; color: #333; margin: 0 0 2px;">${enhanced.summary}</p>`;
    }
    
    // Experience
    if (enhanced.experience?.length) {
      html += sectionHead('Experience');
      enhanced.experience.forEach(exp => {
        html += `<div style="margin-bottom: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 9.5pt; font-weight: 700;">${exp.role} | <span style="font-weight: 400; font-style: italic;">${exp.company}</span></span>
            <span style="font-size: 8pt; color: #777;">${exp.duration}</span>
          </div>
          <ul style="margin: 1px 0 0 14px; padding: 0;">`;
        exp.bullets?.forEach(b => { html += `<li style="font-size: 9pt; margin-bottom: 0;">${b}</li>`; });
        html += `</ul></div>`;
      });
    }

    // Projects
    if (enhanced.projects?.length) {
      html += sectionHead('Projects');
      enhanced.projects.forEach(proj => {
        html += `<div style="margin-bottom: 4px;">
          <span style="font-size: 9.5pt; font-weight: 700;">${proj.name}</span>
          <span style="font-size: 8.5pt; color: #777; margin-left: 4px;">| ${typeof proj.tech === 'object' ? (Array.isArray(proj.tech) ? proj.tech.join(', ') : Object.values(proj.tech).flat().join(', ')) : (proj.tech || '')}</span>
          <ul style="margin: 1px 0 0 14px; padding: 0;">`;
        proj.bullets?.forEach(b => { html += `<li style="font-size: 9pt; margin-bottom: 0;">${b}</li>`; });
        html += `</ul></div>`;
      });
    }
    
    // Skills
    if (enhanced.skills) {
      const hasSkills = Object.values(enhanced.skills).some(arr => arr?.length > 0);
      if (hasSkills) {
        html += sectionHead('Technical Skills');
        Object.entries(enhanced.skills).forEach(([cat, items]) => {
          if (items?.length) html += `<p style="font-size: 9pt; margin: 0 0 1px;"><strong style="text-transform: capitalize;">${cat}:</strong> ${items.join(', ')}</p>`;
        });
      }
    }
    
    // Education
    if (enhanced.education?.length) {
      html += sectionHead('Education');
      enhanced.education.forEach(edu => {
        html += `<p style="font-size: 9pt; margin: 0 0 1px;"><strong>${edu.degree}</strong> — ${edu.school}, ${edu.year}${edu.gpa ? ' | GPA: ' + edu.gpa : ''}${edu.honors ? ' | ' + edu.honors : ''}</p>`;
        if (edu.coursework) {
          const cw = typeof edu.coursework === 'string' ? edu.coursework.replace(/^Relevant Coursework:\s*/i, '') : (typeof edu.coursework === 'object' ? (Array.isArray(edu.coursework) ? edu.coursework.join(', ') : Object.values(edu.coursework).flat().join(', ')) : '');
          html += `<p style="font-size: 8.5pt; color: #555; margin: 0 0 2px;"><em>Relevant Coursework:</em> ${cw}</p>`;
        }
      });
    }
    
    // Achievements
    if (enhanced.achievements?.length) {
      html += sectionHead('Achievements');
      html += `<ul style="margin: 1px 0 0 14px; padding: 0;">`;
      enhanced.achievements.forEach(ach => {
        html += `<li style="font-size: 9pt; margin-bottom: 0;">${ach}</li>`;
      });
      html += `</ul>`;
    }
    
    // Certifications
    if (enhanced.certifications?.length) {
      html += sectionHead('Certifications');
      html += `<ul style="margin: 1px 0 0 14px; padding: 0;">`;
      enhanced.certifications.forEach(cert => {
        html += `<li style="font-size: 9pt; margin-bottom: 1px;">${cert}</li>`;
      });
      html += `</ul>`;
    }
    
    html += `</div>`;
    return html;
  };
  const downloadAsPDF = async () => {
    if (!enhanced) return;
    const html = buildResumeHTML(false);
    
    try {
      const btn = document.getElementById('pdf-download-btn');
      const oldText = btn ? btn.innerText : '';
      if (btn) btn.innerText = 'Generating PDF...';

      const html2pdf = (await import('html2pdf.js')).default;
      
      const container = document.createElement('div');
      container.innerHTML = `
        <div style="width: 210mm; padding: 0;">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          ${html}
        </div>
      `;
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      await new Promise(r => setTimeout(r, 300));

      await html2pdf().set({
        margin: [0.2, 0.2, 0.2, 0.2],
        filename: `${(enhanced.name || 'enhanced').replace(/\s+/g, '_')}_resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all'] }
      }).from(container.firstElementChild).save();

      document.body.removeChild(container);
      if (btn) btn.innerText = oldText;
    } catch (err) {
      alert('Error downloading PDF: ' + err.message);
      const btn = document.getElementById('pdf-download-btn');
      if (btn) btn.innerText = 'Download PDF';
    }
  };

  const downloadAsDOCX = async () => {
    if (!enhanced) return;
    const html = buildResumeHTML(true);
    
    try {
      // Optional: add loading state here if desired
      const res = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, title: enhanced.name || 'Enhanced' })
      });
      
      if (!res.ok) throw new Error('Failed to generate DOCX');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(enhanced.name || 'enhanced').replace(/\s+/g, '_')}_resume.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading DOCX: ' + err.message);
    }
  };

  // Decorative illustrations
  const Illustrations = () => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <img src="/resume-transform.png" alt="" style={{ position: 'absolute', top: '10%', right: '-3%', width: 280, opacity: 0.02, transform: 'rotate(8deg)' }} />
      <img src="/resume-analysis.png" alt="" style={{ position: 'absolute', bottom: '5%', left: '-2%', width: 240, opacity: 0.02, transform: 'rotate(-5deg)' }} />
    </div>
  );

  // --- ENHANCING STATE ---
  if (step === 'enhancing') {
    const steps = [
      { label: 'Analyzing current skills & experience', icon: '🔍' },
      { label: 'Rewriting achievements with STAR method', icon: '✍️' },
      { label: 'Injecting high-impact target keywords', icon: '🤖' },
      { label: 'Re-calculating final ATS criteria scores', icon: '✨' },
    ];
    return (
      <div className="page-bg-wrap">
        <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
        <Illustrations />
        <div className="page-content" style={{ maxWidth: 840, margin: '0 auto', padding: '80px 24px', animation: 'fadeInUp 0.6s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center' }} className="hero-grid">
            
            {/* Left: Steps Progress */}
            <div>
              <div className="pulse-ring" style={{ width: 64, height: 64, marginBottom: 24, position: 'relative', borderRadius: '50%' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1,
                  padding: 10,
                  animation: 'pulse 1.5s infinite alternate ease-in-out',
                }}>
                  <img src="/logo-mark.png" alt="PrepAIr Mark" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>Optimizing Your Resume</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 32 }}>
                Gemini AI is analyzing skill gaps, applying corporate STAR formatting, and structuring keywords to maximize interview success.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {steps.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    background: i === enhanceStep ? 'rgba(255,255,255,0.02)' : 'transparent',
                    border: i === enhanceStep ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: 'var(--radius)',
                    opacity: i <= enhanceStep ? 1 : 0.35,
                    transition: 'all 0.4s ease',
                  }}>
                    <span style={{ fontSize: 16, width: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {i < enhanceStep ? (
                        <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>✓</span>
                      ) : i === enhanceStep ? (
                        <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      ) : (
                        <span style={{ filter: 'grayscale(1)' }}>{s.icon}</span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: i === enhanceStep ? 600 : 400, color: i === enhanceStep ? 'var(--text)' : 'var(--text-2)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Shimmering Resume Skeleton */}
            <div className="card" style={{ padding: '24px 20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{
                background: '#ffffff',
                padding: '24px 20px',
                borderRadius: '4px',
                minHeight: '380px',
                opacity: 0.9,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              }}>
                {/* Header Skeleton */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div className="shimmer" style={{ width: 110, height: 12, borderRadius: 2 }} />
                  <div className="shimmer" style={{ width: 170, height: 7, borderRadius: 2 }} />
                </div>
                
                {/* Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="shimmer" style={{ width: 50, height: 8, borderRadius: 2, background: 'rgba(59, 130, 246, 0.25)' }} />
                  <div className="shimmer" style={{ width: '95%', height: 5, borderRadius: 2 }} />
                  <div className="shimmer" style={{ width: '85%', height: 5, borderRadius: 2 }} />
                </div>
                
                {/* Experience section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="shimmer" style={{ width: 70, height: 8, borderRadius: 2, background: 'rgba(59, 130, 246, 0.25)' }} />
                  
                  {/* Bullet line 1 (glows purple when STAR rewriting is running) */}
                  <div style={{
                    borderLeft: enhanceStep >= 1 ? '2px solid var(--purple)' : '2px solid #eee',
                    paddingLeft: 8,
                    transition: 'all 0.5s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                  }}>
                    <div className="shimmer" style={{ width: '92%', height: 5, borderRadius: 2, background: enhanceStep >= 1 ? 'rgba(99, 102, 241, 0.12)' : undefined }} />
                    <div className="shimmer" style={{ width: '70%', height: 5, borderRadius: 2, background: enhanceStep >= 1 ? 'rgba(99, 102, 241, 0.12)' : undefined }} />
                  </div>
                  
                  {/* Bullet line 2 (glows blue when keyword insertion runs) */}
                  <div style={{
                    borderLeft: enhanceStep >= 2 ? '2px solid #2563EB' : '2px solid #eee',
                    paddingLeft: 8,
                    transition: 'all 0.5s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    marginTop: 2,
                  }}>
                    <div className="shimmer" style={{ width: '96%', height: 5, borderRadius: 2, background: enhanceStep >= 2 ? 'rgba(37, 99, 235, 0.12)' : undefined }} />
                    <div className="shimmer" style={{ width: '80%', height: 5, borderRadius: 2, background: enhanceStep >= 2 ? 'rgba(37, 99, 235, 0.12)' : undefined }} />
                  </div>
                </div>
                
                {/* Section 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                  <div className="shimmer" style={{ width: 60, height: 8, borderRadius: 2, background: 'rgba(59, 130, 246, 0.25)' }} />
                  <div className="shimmer" style={{ width: '90%', height: 5, borderRadius: 2 }} />
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- PREVIEW STATE ---
  if (step === 'preview' && enhanced) {
    const c = enhanced.contact || {};
    const hasLinks = c.linkedin || c.github || c.portfolio;
    const hasSkills = enhanced.skills && Object.values(enhanced.skills).some(arr => arr?.length > 0);
    
    return (
      <div className="page-bg-wrap">
        <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
        <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="PrepAIr Logo" style={{ height: 32, width: 'auto' }} />
            </a>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => { setStep('upload'); setEnhanced(null); }} style={{ fontSize: '0.76rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Start Over
              </button>
              <button id="pdf-download-btn" className="btn btn-primary" onClick={downloadAsPDF} style={{ fontSize: '0.76rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF
              </button>
              <button className="btn btn-outline" onClick={downloadAsDOCX} style={{ fontSize: '0.76rem', borderColor: 'var(--blue)', color: 'var(--blue)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Download DOCX
              </button>
            </div>
          </div>

          {/* ATS Score Banner */}
          <div className="card" style={{ padding: '20px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderLeft: '4px solid var(--green)' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                {enhanced.name ? `${enhanced.name}'s Enhanced Resume` : 'Enhanced Resume'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: 2 }}>Optimized for {targetTier} • {targetRole || 'Software Engineer'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: (enhanced.atsScore || 0) >= 80 ? 'var(--green)' : 'var(--amber)', lineHeight: 1.1 }}>{enhanced.atsScore || 'N/A'}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>ATS Score</div>
              </div>
            </div>
          </div>

          {/* Split View */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="resume-grid">
            {/* Original */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }} />
                <span className="field-label">Original Resume</span>
              </div>
              <div style={{ padding: 20, maxHeight: 700, overflow: 'auto' }}>
                <pre style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif' }}>{resumeText}</pre>
              </div>
            </div>
            
            {/* Enhanced */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
                <span className="field-label">Enhanced Resume (A4 Print Preview)</span>
              </div>
              <div style={{ padding: '24px 16px', maxHeight: 700, overflow: 'auto', background: '#090a0e', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  background: '#ffffff',
                  color: '#1a1a1a',
                  padding: '40px 32px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  borderRadius: '2px',
                  fontFamily: "'Inter', sans-serif",
                  width: '100%',
                  minHeight: '800px',
                  boxSizing: 'border-box',
                }}>
                  {/* Name & Contact */}
                  {enhanced.name && (
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <h1 style={{ fontSize: '16pt', fontWeight: 800, margin: '0 0 2px', color: '#1a1a1a', letterSpacing: '0.5px' }}>{enhanced.name}</h1>
                      <div style={{ fontSize: '8.5pt', color: '#555', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }}>
                        {c.email && <span>{c.email}</span>}
                        {c.email && (c.phone || c.location || hasLinks) && <span>|</span>}
                        {c.phone && <span>{c.phone}</span>}
                        {c.phone && (c.location || hasLinks) && <span>|</span>}
                        {c.location && <span>{c.location}</span>}
                      </div>
                      {hasLinks && (
                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4, fontSize: '8.5pt' }}>
                          {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>LinkedIn</a>}
                          {c.linkedin && (c.github || c.portfolio) && <span style={{ color: '#555' }}>|</span>}
                          {c.github && <a href={c.github} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>GitHub</a>}
                          {c.github && c.portfolio && <span style={{ color: '#555' }}>|</span>}
                          {c.portfolio && <a href={c.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>Portfolio</a>}
                        </div>
                      )}
                      <hr style={{ border: 'none', borderTop: '1.5px solid #1a1a1a', margin: '8px 0 4px' }} />
                    </div>
                  )}

                  {/* Summary */}
                  {enhanced.summary && (
                    <div style={{ marginBottom: 10 }}>
                      <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a1a1a', margin: '8px 0 3px', paddingBottom: '1px', borderBottom: '0.5px solid #ccc' }}>Summary</h2>
                      <p style={{ fontSize: '9pt', color: '#333', margin: 0, lineHeight: 1.35 }}>{enhanced.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {enhanced.experience?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a1a1a', margin: '8px 0 3px', paddingBottom: '1px', borderBottom: '0.5px solid #ccc' }}>Experience</h2>
                      {enhanced.experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '9.5pt', fontWeight: 700, color: '#1a1a1a' }}>
                              {exp.role} | <span style={{ fontWeight: 400, fontStyle: 'italic' }}>{exp.company}</span>
                            </span>
                            <span style={{ fontSize: '8pt', color: '#777' }}>{exp.duration}</span>
                          </div>
                          <ul style={{ margin: '1px 0 0 16px', padding: 0, color: '#333' }}>
                            {exp.bullets?.map((b, j) => (
                              <li key={j} style={{ fontSize: '9pt', marginBottom: '1px', listStyleType: 'disc', color: '#333' }}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {enhanced.projects?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a1a1a', margin: '8px 0 3px', paddingBottom: '1px', borderBottom: '0.5px solid #ccc' }}>Projects</h2>
                      {enhanced.projects.map((proj, i) => (
                        <div key={i} style={{ marginBottom: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '9.5pt', fontWeight: 700, color: '#1a1a1a' }}>
                              {proj.name} <span style={{ fontSize: '8.5pt', color: '#777', fontWeight: 400 }}>| {typeof proj.tech === 'object' ? (Array.isArray(proj.tech) ? proj.tech.join(', ') : Object.values(proj.tech).flat().join(', ')) : (proj.tech || '')}</span>
                            </span>
                          </div>
                          <ul style={{ margin: '1px 0 0 16px', padding: 0, color: '#333' }}>
                            {proj.bullets?.map((b, j) => (
                              <li key={j} style={{ fontSize: '9pt', marginBottom: '1px', listStyleType: 'disc', color: '#333' }}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {hasSkills && (
                    <div style={{ marginBottom: 10 }}>
                      <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a1a1a', margin: '8px 0 3px', paddingBottom: '1px', borderBottom: '0.5px solid #ccc' }}>Technical Skills</h2>
                      {Object.entries(enhanced.skills).map(([cat, items]) => (
                        items?.length > 0 && (
                          <p key={cat} style={{ fontSize: '9pt', margin: '0 0 2px', color: '#333' }}>
                            <strong style={{ textTransform: 'capitalize', color: '#1a1a1a' }}>{cat}:</strong> {items.join(', ')}
                          </p>
                        )
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {enhanced.education?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a1a1a', margin: '8px 0 3px', paddingBottom: '1px', borderBottom: '0.5px solid #ccc' }}>Education</h2>
                      {enhanced.education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '9.5pt', fontWeight: 700, color: '#1a1a1a' }}>
                              {edu.degree} <span style={{ fontWeight: 400, fontStyle: 'italic' }}>— {edu.school}</span>
                            </span>
                            <span style={{ fontSize: '8pt', color: '#777' }}>{edu.year}</span>
                          </div>
                          {edu.gpa || edu.honors ? (
                            <p style={{ fontSize: '8.5pt', color: '#555', margin: '1px 0' }}>
                              {edu.gpa ? `GPA: ${edu.gpa}` : ''}{edu.gpa && edu.honors ? ' | ' : ''}{edu.honors ? edu.honors : ''}
                            </p>
                          ) : null}
                          {edu.coursework && (
                            <p style={{ fontSize: '8.5pt', color: '#555', margin: '1px 0', fontStyle: 'italic' }}>
                              Relevant Coursework: {typeof edu.coursework === 'string' ? edu.coursework.replace(/^Relevant Coursework:\s*/i, '') : (Array.isArray(edu.coursework) ? edu.coursework.join(', ') : '')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Achievements */}
                  {enhanced.achievements?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a1a1a', margin: '8px 0 3px', paddingBottom: '1px', borderBottom: '0.5px solid #ccc' }}>Achievements</h2>
                      <ul style={{ margin: '1px 0 0 16px', padding: 0, color: '#333' }}>
                        {enhanced.achievements.map((a, i) => (
                          <li key={i} style={{ fontSize: '9pt', marginBottom: '1px', listStyleType: 'disc', color: '#333' }}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Certifications */}
                  {enhanced.certifications?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a1a1a', margin: '8px 0 3px', paddingBottom: '1px', borderBottom: '0.5px solid #ccc' }}>Certifications</h2>
                      <ul style={{ margin: '1px 0 0 16px', padding: 0, color: '#333' }}>
                        {enhanced.certifications.map((cert, i) => (
                          <li key={i} style={{ fontSize: '9pt', marginBottom: '1px', listStyleType: 'disc', color: '#333' }}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Improvements */}
          {enhanced.improvements?.length > 0 && (
            <div className="card" style={{ padding: '28px 32px', marginTop: 24 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                What Changed
              </h3>
              {enhanced.improvements.map((imp, i) => (
                <div key={i} className="improvement-item" style={{ animation: `fadeInUp 0.4s ease ${i * 0.1}s both` }}>
                  <div className="pill pill-blue" style={{ marginBottom: 8, fontSize: '0.58rem' }}>{imp.area}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <span className="field-label" style={{ color: 'var(--amber)', marginBottom: 4, display: 'block' }}>Before</span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.55 }}>{imp.before}</p>
                    </div>
                    <div>
                      <span className="field-label" style={{ color: 'var(--green)', marginBottom: 4, display: 'block' }}>After</span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.55 }}>{imp.after}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- UPLOAD STATE ---
  return (
    <div className="page-bg-wrap">
      <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
      <Illustrations />
      <div className="page-content" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>
        <a href="/" style={{ marginBottom: 48, display: 'inline-flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="PrepAIr Logo" style={{ height: 36, width: 'auto' }} />
        </a>

        <div style={{ marginBottom: 32, animation: 'fadeInUp 0.6s ease' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
            AI Resume Builder <span style={{ fontSize: '0.6em', verticalAlign: 'super', color: 'var(--purple)' }}>✨</span>
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', maxWidth: 520, lineHeight: 1.6 }}>
            Transform your resume into a format accepted at Google, Microsoft, and top MNCs — with <strong>STAR-method bullets</strong>, <strong>ATS optimization</strong>, and <strong>quantified achievements</strong>.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, animation: 'fadeInUp 0.6s ease 0.15s both' }}>
          {['📊 ATS Score Analysis', '⭐ STAR Method Bullets', '🔢 Quantified Metrics', '🔗 Preserves Your Links'].map(f => (
            <div key={f} className="pill pill-blue" style={{ fontSize: '0.7rem', padding: '5px 12px' }}>{f}</div>
          ))}
        </div>

        <div className="card card-responsive-padding" style={{ padding: '36px 40px', animation: 'fadeInUp 0.6s ease 0.3s both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }} className="cfg-grid">
            {/* Upload */}
            <div>
              <label className="field-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Upload Current Resume
              </label>
              <div
                className={`drop-zone ${uploadState}`}
                onClick={() => uploadState !== 'success' && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                onDrop={handleDrop}
              >
                <div className="dz-icon" style={{ background: uploadState === 'success' ? 'var(--green-bg)' : 'var(--purple-bg)' }}>
                  {uploadState === 'success' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  ) : uploadState === 'idle' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  )}
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4 }}>
                  {uploadState === 'success' ? 'Resume processed successfully' : uploadState !== 'idle' ? 'Analyzing resume...' : 'Drop your resume PDF here'}
                </p>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>
                  {uploadState === 'success' ? `${fileName} — ${skills.length} skills detected` : 'or click to browse — PDF format'}
                </p>
              </div>
              <input type="file" ref={fileInputRef} accept=".pdf" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])} />
            </div>

            {/* Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="field-label">Target Company Tier</label>
                <div className="dur-group">
                  {['FAANG / Big Tech', 'Startup', 'Enterprise'].map(t => (
                    <button key={t} className={`dur-btn ${targetTier === t ? 'active' : ''}`} onClick={() => setTargetTier(t)} style={{ fontSize: '0.72rem' }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="targetRole">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Target Role
                </label>
                <input className="input" type="text" id="targetRole" placeholder="e.g., Senior Software Engineer" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
              </div>
              <div className="info-box purple">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-2)', lineHeight: 1.55 }}>
                  AI will rewrite all bullets with STAR method, add metrics, preserve your name & links, and optimize for ATS scanners.
                </p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button className="btn btn-primary" disabled={uploadState !== 'success' || isLoading} onClick={enhanceResume} style={{ padding: '14px 40px', fontSize: '0.95rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Transform Resume
            </button>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 10 }}>
              {uploadState !== 'success' ? 'Upload your resume to begin' : 'Ready to transform!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
