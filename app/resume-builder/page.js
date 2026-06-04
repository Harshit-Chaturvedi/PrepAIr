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
    
    let html = `<div style="font-family: ${ff}; color: #1a1a1a; width: 100%; box-sizing: border-box; padding: ${forDocx ? '12px 20px' : '20px 32px'}; font-size: 9.5pt; line-height: 1.45; min-height: ${forDocx ? 'auto' : '100vh'}; display: flex; flex-direction: column;">`;
    
    // Name & Contact Header
    if (enhanced.name) {
      html += `<div style="text-align: center; margin-bottom: 6px;">
        <h1 style="font-size: 18pt; font-weight: 700; margin: 0 0 3px; letter-spacing: 0.5px;">${enhanced.name}</h1>
        <div style="font-size: 8.5pt; color: #555;">`;
      const parts = [];
      if (c.email) parts.push(c.email);
      if (c.phone) parts.push(c.phone);
      if (c.location) parts.push(c.location);
      if (c.linkedin) parts.push(`<a href="${c.linkedin}" style="color: #2563eb; text-decoration: none;">${c.linkedin.replace(/https?:\/\/(www\.)?/, '')}</a>`);
      if (c.github) parts.push(`<a href="${c.github}" style="color: #2563eb; text-decoration: none;">${c.github.replace(/https?:\/\/(www\.)?/, '')}</a>`);
      if (c.portfolio) parts.push(`<a href="${c.portfolio}" style="color: #2563eb; text-decoration: none;">${c.portfolio.replace(/https?:\/\/(www\.)?/, '')}</a>`);
      html += parts.join(' | ');
      html += `</div></div><hr style="border: none; border-top: 1.5px solid #1a1a1a; margin: 0 0 8px;">`;
    }
    
    const sectionHead = (title) => `<h2 style="font-size: 9.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a1a; margin: 8px 0 4px; padding-bottom: 2px; border-bottom: 0.5px solid #ccc;">${title}</h2>`;

    // Summary
    if (enhanced.summary) {
      html += `${sectionHead('Summary')}<p style="font-size: 9pt; color: #333; margin: 0 0 2px;">${enhanced.summary}</p>`;
    }
    
    // Experience
    if (enhanced.experience?.length) {
      html += sectionHead('Experience');
      enhanced.experience.forEach(exp => {
        html += `<div style="margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 9.5pt; font-weight: 700;">${exp.role} | <span style="font-weight: 400; font-style: italic;">${exp.company}</span></span>
            <span style="font-size: 8pt; color: #777;">${exp.duration}</span>
          </div>
          <ul style="margin: 1px 0 0 14px; padding: 0;">`;
        exp.bullets?.forEach(b => { html += `<li style="font-size: 9pt; margin-bottom: 1px;">${b}</li>`; });
        html += `</ul></div>`;
      });
    }

    // Projects
    if (enhanced.projects?.length) {
      html += sectionHead('Projects');
      enhanced.projects.forEach(proj => {
        html += `<div style="margin-bottom: 6px;">
          <span style="font-size: 9.5pt; font-weight: 700;">${proj.name}</span>
          <span style="font-size: 8.5pt; color: #777; margin-left: 4px;">| ${proj.tech}</span>
          <ul style="margin: 1px 0 0 14px; padding: 0;">`;
        proj.bullets?.forEach(b => { html += `<li style="font-size: 9pt; margin-bottom: 1px;">${b}</li>`; });
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
        html += `<p style="font-size: 9pt; margin: 0 0 2px;"><strong>${edu.degree}</strong> — ${edu.school}, ${edu.year}${edu.gpa ? ' | GPA: ' + edu.gpa : ''}${edu.honors ? ' | ' + edu.honors : ''}</p>`;
      });
    }

    // Certifications
    if (enhanced.certifications?.length) {
      html += sectionHead('Certifications');
      html += `<p style="font-size: 9pt; margin: 0;">${enhanced.certifications.join(' • ')}</p>`;
    }
    
    html += `</div>`;
    return html;
  };

  const downloadAsPDF = () => {
    if (!enhanced) return;
    const html = buildResumeHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title> </title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; }
        @page {
          size: A4;
          margin: 0.35in 0.4in;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          height: 100%;
        }
        /* Make the resume fill the full page */
        body > div {
          min-height: calc(297mm - 0.7in);
          justify-content: space-between;
        }
      </style>
      </head><body>${html}
      </body></html>`);
    printWindow.document.close();
    
    // Give fonts more time to load on slower mobile connections
    setTimeout(() => { 
      printWindow.focus();
      printWindow.print(); 
    }, 1000);
  };

  const downloadAsDOCX = () => {
    if (!enhanced) return;
    const html = buildResumeHTML(true);
    const docContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${enhanced.name || 'Enhanced'} Resume</title>
      <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
      <style>@page { size: A4; margin: 1in; } body { font-family: Calibri, sans-serif; }</style>
      </head><body>${html}</body></html>`;
    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(enhanced.name || 'enhanced').replace(/\s+/g, '_')}_resume.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Decorative illustrations
  const Illustrations = () => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <img src="/resume-transform.png" alt="" style={{ position: 'absolute', top: '10%', right: '-3%', width: 280, opacity: 0.08, transform: 'rotate(8deg)' }} />
      <img src="/resume-analysis.png" alt="" style={{ position: 'absolute', bottom: '5%', left: '-2%', width: 240, opacity: 0.06, transform: 'rotate(-5deg)' }} />
    </div>
  );

  // --- ENHANCING STATE ---
  if (step === 'enhancing') {
    const steps = [
      { label: 'Analyzing current resume', icon: '🔍' },
      { label: 'Rewriting with STAR method', icon: '✍️' },
      { label: 'Optimizing for ATS scanners', icon: '🤖' },
      { label: 'Generating final format', icon: '✨' },
    ];
    return (
      <div className="page-bg-wrap">
        <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
        <Illustrations />
        <div className="page-content" style={{ maxWidth: 560, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <div className="pulse-ring" style={{ width: 80, height: 80, margin: '0 auto 28px', position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple), var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, position: 'relative', zIndex: 1 }}>📝</div>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Transforming your resume...</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 36 }}>
            AI is rewriting every section with quantified achievements<br/>and ATS-optimized keywords.
          </p>
          <div style={{ textAlign: 'left', maxWidth: 340, margin: '0 auto' }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                opacity: i <= enhanceStep ? 1 : 0.35,
                transition: 'all 0.5s ease',
                transform: i <= enhanceStep ? 'translateX(0)' : 'translateX(-10px)',
              }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                  {i < enhanceStep ? '✅' : i === enhanceStep ? <span className="spin" style={{ display: 'inline-block' }}>⟳</span> : s.icon}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: i === enhanceStep ? 600 : 400 }}>{s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--purple), var(--blue))', borderRadius: 4, width: `${((enhanceStep + 1) / 4) * 100}%`, transition: 'width 1s ease' }} />
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
            <a href="/" className="brand">
              <div className="brand-mark" style={{ width: 28, height: 28, borderRadius: 8 }}><svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
              <span className="brand-name" style={{ fontSize: '1.05rem' }}>PrepAIr</span>
            </a>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => { setStep('upload'); setEnhanced(null); }} style={{ fontSize: '0.76rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Start Over
              </button>
              <button className="btn btn-primary" onClick={downloadAsPDF} style={{ fontSize: '0.76rem' }}>
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
          <div className="card" style={{ padding: '20px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(59,130,246,0.06))', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {enhanced.name ? `${enhanced.name}'s Enhanced Resume` : 'Enhanced Resume'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: 2 }}>Optimized for {targetTier} • {targetRole || 'Software Engineer'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (enhanced.atsScore || 85) >= 80 ? 'var(--green)' : 'var(--amber)' }}>{enhanced.atsScore || 85}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>ATS Score</div>
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
                <span className="field-label">Enhanced Resume</span>
              </div>
              <div style={{ padding: 24, maxHeight: 700, overflow: 'auto' }}>
                {/* Name & Contact */}
                {enhanced.name && (
                  <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '2px solid var(--text)' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 6 }}>{enhanced.name}</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, fontSize: '0.72rem', color: 'var(--text-2)' }}>
                      {c.email && <span>{c.email}</span>}
                      {c.email && (c.phone || c.location || hasLinks) && <span style={{ color: 'var(--text-3)' }}>•</span>}
                      {c.phone && <span>{c.phone}</span>}
                      {c.phone && (c.location || hasLinks) && <span style={{ color: 'var(--text-3)' }}>•</span>}
                      {c.location && <span>{c.location}</span>}
                    </div>
                    {hasLinks && (
                      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 5, fontSize: '0.72rem' }}>
                        {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                          LinkedIn
                        </a>}
                        {c.github && <a href={c.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          GitHub
                        </a>}
                        {c.portfolio && <a href={c.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                          Portfolio
                        </a>}
                      </div>
                    )}
                  </div>
                )}

                {/* Summary */}
                {enhanced.summary && (
                  <div className="resume-section">
                    <h4 className="resume-heading">Summary</h4>
                    <p className="resume-text">{enhanced.summary}</p>
                  </div>
                )}

                {/* Experience */}
                {enhanced.experience?.length > 0 && (
                  <div className="resume-section">
                    <h4 className="resume-heading">Experience</h4>
                    {enhanced.experience.map((exp, i) => (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{exp.role}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{exp.duration}</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-2)', fontStyle: 'italic', marginBottom: 4 }}>{exp.company}</div>
                        <ul className="resume-bullets">
                          {exp.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {enhanced.projects?.length > 0 && (
                  <div className="resume-section">
                    <h4 className="resume-heading">Projects</h4>
                    {enhanced.projects.map((proj, i) => (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{proj.name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginLeft: 6 }}>{proj.tech}</span>
                        </div>
                        <ul className="resume-bullets">
                          {proj.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {hasSkills && (
                  <div className="resume-section">
                    <h4 className="resume-heading">Technical Skills</h4>
                    {Object.entries(enhanced.skills).map(([cat, items]) => (
                      items?.length > 0 && (
                        <div key={cat} style={{ marginBottom: 5 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' }}>{cat}: </span>
                          <span className="resume-text">{items.join(', ')}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Education */}
                {enhanced.education?.length > 0 && (
                  <div className="resume-section">
                    <h4 className="resume-heading">Education</h4>
                    {enhanced.education.map((edu, i) => (
                      <div key={i} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{edu.degree}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{edu.year}</span>
                        </div>
                        <span className="resume-text">{edu.school}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}{edu.honors ? ` | ${edu.honors}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Certifications */}
                {enhanced.certifications?.length > 0 && (
                  <div className="resume-section">
                    <h4 className="resume-heading">Certifications</h4>
                    <ul className="resume-bullets">
                      {enhanced.certifications.map((cert, i) => <li key={i}>{cert}</li>)}
                    </ul>
                  </div>
                )}
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
        <a href="/" className="brand" style={{ marginBottom: 48, display: 'inline-flex' }}>
          <div className="brand-mark" style={{ width: 28, height: 28, borderRadius: 8 }}><svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
          <span className="brand-name" style={{ fontSize: '1.05rem' }}>PrepAIr</span>
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

        <div className="card" style={{ padding: '36px 40px', animation: 'fadeInUp 0.6s ease 0.3s both' }}>
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
