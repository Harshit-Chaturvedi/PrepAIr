'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const DURATION_MAP = {
  5: { questions: 3, mcqs: 2 },
  10: { questions: 5, mcqs: 3 },
  15: { questions: 6, mcqs: 3 },
  20: { questions: 8, mcqs: 4 },
  30: { questions: 10, mcqs: 5 },
  45: { questions: 14, mcqs: 6 },
  60: { questions: 18, mcqs: 8 },
};

export default function InterviewPage() {
  // Phase: 'setup' | 'interview' | 'mcq' | 'dashboard'
  const [phase, setPhase] = useState('setup');
  const [duration, setDuration] = useState(15);
  const [role, setRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [skills, setSkills] = useState([]);
  const [fileName, setFileName] = useState('');
  const [uploadState, setUploadState] = useState('idle'); // idle|uploading|processing|success
  
  // Interview state
  const [conversationHistory, setConversationHistory] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [aiState, setAiState] = useState('idle'); // idle|speaking|listening|processing
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const bestVoiceRef = useRef(null);
  
  // MCQ state
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqSelected, setMcqSelected] = useState(-1);
  const [mcqAnswered, setMcqAnswered] = useState(false);
  const [mcqScore, setMcqScore] = useState(0);
  const [mcqTriggered, setMcqTriggered] = useState(false);
  
  // Dashboard state
  const [report, setReport] = useState(null);
  
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const transcriptEndRef = useRef(null);
  
  // --- SETUP PHASE ---
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
        console.error(err);
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
  
  // --- INTERVIEW PHASE ---
  const startInterview = async () => {
    if (uploadState !== 'success') return;
    setIsLoading(true);
    const qCount = DURATION_MAP[duration]?.questions || 6;
    
    try {
      const res = await fetch('/api/start-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, role, duration, questionCount: qCount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setConversationHistory(data.conversationHistory);
      setCurrentQuestion(data.question);
      setTranscript([{ role: 'ai', text: data.question }]);
      setQuestionNumber(1);
      setTimeLeft(duration * 60);
      setPhase('interview');
      setAiState('speaking');
      speak(data.question);
    } catch (err) {
      alert('Failed to start interview: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Timer
  useEffect(() => {
    if (phase !== 'interview' || isPaused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, isPaused]);
  
  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);
  
  // Auto-pick the best soft Indian female voice
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pickBestVoice = () => {
      const voices = speechSynthesis.getVoices();
      // Priority order: best Indian female neural/natural voice
      const pick =
        voices.find(v => v.name.includes('Neerja') && v.name.includes('Natural')) ||
        voices.find(v => v.name.includes('Neerja')) ||
        voices.find(v => v.lang === 'en-IN' && (v.name.includes('Natural') || v.name.includes('Neural'))) ||
        voices.find(v => v.lang === 'en-IN' && v.name.includes('Google')) ||
        voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.name.includes('Heera')) ||
        voices.find(v => v.name.includes('Samantha')) ||
        voices.find(v => v.name.includes('Google') && v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.name.includes('Zira')) ||
        null;
      if (pick) bestVoiceRef.current = pick;
    };
    pickBestVoice();
    speechSynthesis.onvoiceschanged = pickBestVoice;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);
  
  // TTS — soft Indian female voice
  const speak = useCallback((text) => {
    if (!voiceEnabled || typeof window === 'undefined') {
      setTimeout(() => {
        setAiState('listening');
        startRecognition();
      }, 500);
      return;
    }
    setAiState('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.82;
    utterance.pitch = 1.15;
    utterance.volume = 0.85;
    if (bestVoiceRef.current) {
      utterance.voice = bestVoiceRef.current;
    }
    utterance.onend = () => {
      setAiState('listening');
      startRecognition();
    };
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }, [voiceEnabled]);
  
  // Speech Recognition
  const startRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalText = '';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + ' ';
        else interim = t;
      }
      setLiveTranscript(finalText + interim);
    };
    recognition.onerror = (e) => console.log('Speech error:', e.error);
    recognition.onend = () => {
      // Restart if still recording
      if (isRecording && !isMuted) {
        try { recognition.start(); } catch(e) {}
      }
    };
    
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch(e) { console.log('Could not start recognition'); }
  }, [isRecording, isMuted]);
  
  const stopRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };
  
  const submitAnswer = async () => {
    if (aiState === 'speaking' || aiState === 'processing' || !liveTranscript.trim()) return;
    stopRecognition();
    speechSynthesis.cancel();
    
    const answer = liveTranscript.trim();
    setTranscript(prev => [...prev, { role: 'user', text: answer }]);
    setLiveTranscript('');
    setAiState('processing');
    
    const totalQs = DURATION_MAP[duration]?.questions || 6;
    
    try {
      const res = await fetch('/api/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer,
          conversationHistory,
          questionNumber,
          totalQuestions: totalQs,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setConversationHistory(data.conversationHistory);
      
      // Show coaching
      if (data.coaching) {
        setTranscript(prev => [...prev, { role: 'coaching', text: data.coaching }]);
      }
      
      if (data.isComplete) {
        // All interview questions done → now trigger MCQ round
        const mcqCount = DURATION_MAP[duration]?.mcqs || 3;
        await triggerMCQ(mcqCount);
        return;
      }
      
      // Continue with next interview question
      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setTranscript(prev => [...prev, { role: 'ai', text: data.nextQuestion }]);
        setQuestionNumber(prev => prev + 1);
        setAiState('speaking');
        speak(data.nextQuestion);
      }
    } catch (err) {
      console.error(err);
      setAiState('listening');
      startRecognition();
    }
  };
  
  // MCQ
  const triggerMCQ = async (count) => {
    clearInterval(timerRef.current);
    setAiState('idle');
    stopRecognition();
    speechSynthesis.cancel();
    
    try {
      const res = await fetch('/api/generate-mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, role, count }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMcqQuestions(data.questions);
      setMcqIndex(0);
      setMcqSelected(-1);
      setMcqAnswered(false);
      setMcqScore(0);
      setPhase('mcq');
    } catch (err) {
      console.error('MCQ failed:', err);
    }
  };
  
  const handleMcqSelect = (idx) => {
    if (mcqAnswered) return;
    setMcqSelected(idx);
  };
  
  const handleMcqNext = () => {
    if (mcqSelected === -1) return;
    
    if (!mcqAnswered) {
      // Show answer
      setMcqAnswered(true);
      if (mcqSelected === mcqQuestions[mcqIndex].correctIndex) {
        setMcqScore(prev => prev + 1);
      }
      return;
    }
    
    // Move to next question or end MCQ → go to dashboard
    if (mcqIndex + 1 >= mcqQuestions.length) {
      endInterview();
      return;
    }
    setMcqIndex(prev => prev + 1);
    setMcqSelected(-1);
    setMcqAnswered(false);
  };
  
  // End Interview
  const endInterview = async () => {
    clearInterval(timerRef.current);
    stopRecognition();
    speechSynthesis.cancel();
    setAiState('idle');
    setIsLoading(true);
    setPhase('dashboard');
    
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, resumeText, role }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch (err) {
      console.error('Report failed:', err);
      setReport({
        interviewScore: 0, atsScore: 0, summaryQuote: 'Report generation failed.',
        technical: { systemDesign: 0, dsa: 0, apiDesign: 0, devops: 0, database: 0 },
        communication: { clarity: 0, structure: 0, conciseness: 0, fillerAvoidance: 0, confidence: 0 },
        star: { situation: 0, task: 0, action: 0, result: 0 },
        fillerWords: [], feedback: [], bestAnswer: null
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  
  const totalQs = DURATION_MAP[duration]?.questions || 6;
  
  // ===== RENDER =====
  
  // --- SETUP ---
  if (phase === 'setup') {
    return (
      <div className="page-bg-wrap">
        <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
        <div className="page-content" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>
          <a href="/" className="brand" style={{ marginBottom: 48, display: 'inline-flex' }}>
            <div className="brand-mark" style={{ width: 28, height: 28, borderRadius: 8 }}>
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="brand-name" style={{ fontSize: '1.05rem' }}>PrepAIr</span>
          </a>
          
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>AI Mock Interview</h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', maxWidth: 500 }}>Upload your resume and practice with Sarah Mitchell, your AI interviewer.</p>
          </div>
          
          <div className="card" style={{ padding: '36px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <img src="/interviewer.png" alt="Sarah Mitchell" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 600 }}>Sarah Mitchell</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Senior Technical Recruiter</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }} className="cfg-grid">
              {/* Upload */}
              <div>
                <label className="field-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Resume Upload
                </label>
                <div
                  className={`drop-zone ${uploadState}`}
                  onClick={() => uploadState !== 'success' && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                  onDrop={handleDrop}
                >
                  <div className="dz-icon" style={{ background: uploadState === 'success' ? 'var(--green-bg)' : 'var(--blue-bg)' }}>
                    {uploadState === 'success' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    ) : uploadState === 'processing' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    ) : uploadState === 'uploading' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4 }}>
                    {uploadState === 'success' ? 'Resume processed successfully' : uploadState === 'processing' ? 'AI analyzing your resume…' : uploadState === 'uploading' ? 'Uploading resume…' : 'Drop your resume PDF here'}
                  </p>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>
                    {uploadState === 'success' ? `${fileName} — ${skills.length} skills detected` : uploadState === 'processing' ? 'Extracting skills & experience' : 'or click to browse — PDF format'}
                  </p>
                </div>
                <input type="file" ref={fileInputRef} accept=".pdf" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])} />
              </div>
              
              {/* Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label className="field-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Interview Duration
                  </label>
                  <div className="dur-group">
                    {[5,10,15,20,30,45,60].map(d => (
                      <button key={d} className={`dur-btn ${duration === d ? 'active' : ''}`} onClick={() => setDuration(d)}>{d} min</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="roleInp">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    Target Job Role
                  </label>
                  <input className="input" type="text" id="roleInp" placeholder="e.g., Senior Software Engineer at Google" value={role} onChange={(e) => setRole(e.target.value)} />
                </div>

                <div className="info-box blue">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-2)', lineHeight: 1.55 }}>
                    {DURATION_MAP[duration]?.questions} questions + {DURATION_MAP[duration]?.mcqs} MCQs. Sarah will coach you after each answer.
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button className="btn btn-primary" disabled={uploadState !== 'success' || isLoading} onClick={startInterview} style={{ padding: '14px 40px', fontSize: '0.95rem' }}>
                {isLoading ? (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Connecting to Sarah...</>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Interview</>
                )}
              </button>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 10 }}>
                {uploadState !== 'success' ? 'Upload your resume to begin' : 'Ready to start!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // --- MCQ PHASE ---
  if (phase === 'mcq' && mcqQuestions.length > 0) {
    const q = mcqQuestions[mcqIndex];
    return (
      <div className="page-bg-wrap">
        <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
        <div className="mcq-overlay active">
          <div className="mcq-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div className="pill pill-purple" style={{ marginBottom: 6 }}>MCQ Assessment</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Question {mcqIndex + 1} of {mcqQuestions.length}</span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--green)' }}>Score: {mcqScore}/{mcqIndex + (mcqAnswered ? 1 : 0)}</div>
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 600, marginBottom: 20, lineHeight: 1.55 }}>{q.question}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  className={`mcq-opt ${mcqSelected === i ? 'selected' : ''} ${mcqAnswered && i === q.correctIndex ? 'correct' : ''} ${mcqAnswered && mcqSelected === i && i !== q.correctIndex ? 'incorrect' : ''}`}
                  onClick={() => handleMcqSelect(i)}
                  disabled={mcqAnswered}
                >
                  <div className="rc"><div className="ri" /></div>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <div className="mcq-track" style={{ flex: 1, marginRight: 16 }}>
                <div className="mcq-fill" style={{ width: `${((mcqIndex + (mcqAnswered ? 1 : 0)) / mcqQuestions.length) * 100}%` }} />
              </div>
              <button className="btn btn-primary" disabled={mcqSelected === -1} onClick={handleMcqNext} style={{ padding: '9px 22px', fontSize: '0.82rem' }}>
                {mcqAnswered ? (mcqIndex + 1 >= mcqQuestions.length ? 'Continue Interview' : 'Next Question') : 'Check Answer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // --- DASHBOARD PHASE ---
  if (phase === 'dashboard') {
    return (
      <div className="page-bg-wrap">
        <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
        <div className="page-content" style={{ maxWidth: 1060, margin: '0 auto', padding: '40px 24px 64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <a href="/" className="brand">
              <div className="brand-mark" style={{ width: 28, height: 28, borderRadius: 8 }}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <span className="brand-name" style={{ fontSize: '1.05rem' }}>PrepAIr</span>
            </a>
            <a href="/interview" className="btn btn-outline" style={{ textDecoration: 'none', fontSize: '0.78rem' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              New Interview
            </a>
          </div>
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: 20 }}>Generating your report...</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: 8 }}>Sarah is analyzing your interview performance</p>
            </div>
          ) : report ? (
            <>
              {/* Sarah's Summary */}
              <div className="card" style={{ padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 18 }}>
                <img src="/interviewer.png" alt="Sarah" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--green-border)' }} />
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Sarah Mitchell&apos;s Assessment</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6, fontStyle: 'italic' }}>&ldquo;{report.summaryQuote}&rdquo;</p>
                </div>
              </div>
              
              <h2 style={{ fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Performance Report</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginBottom: 32 }}>AI-generated analysis of your interview session</p>
              
              <hr className="glow-line" style={{ marginBottom: 32 }} />
              
              {/* Scores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
                <ScoreRing label="Interview Score" value={report.interviewScore} color="green" sub="Overall performance" />
                <ScoreRing label="ATS Resume Score" value={report.atsScore} color="blue" sub={`${skills.length} matching keywords`} />
                <div className="card" style={{ padding: 28 }}>
                  <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 18 }}>Session Summary</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <SummaryRow label="Questions" value={`${questionNumber}/${totalQs}`} color="var(--green)" />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <SummaryRow label="MCQ Accuracy" value={`${mcqScore}/${mcqQuestions.length}`} color="var(--blue)" />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <SummaryRow label="Duration" value={`${duration} min`} />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <SummaryRow label="Filler Words" value={report.fillerWords?.reduce((a, f) => a + f.count, 0) || 0} color="var(--amber)" />
                  </div>
                </div>
              </div>
              
              {/* Skill Bars */}
              <div className="card" style={{ padding: '28px 32px', marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>Technical Accuracy</h3>
                {report.technical && Object.entries(report.technical).map(([key, val]) => (
                  <SkillBar key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={val} />
                ))}
              </div>
              
              <div className="card" style={{ padding: '28px 32px', marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>Communication</h3>
                {report.communication && Object.entries(report.communication).map(([key, val]) => (
                  <SkillBar key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={val} />
                ))}
                {report.fillerWords?.length > 0 && (
                  <div className="info-box amber" style={{ marginTop: 16 }}>
                    <p className="field-label" style={{ marginBottom: 6 }}>Detected Filler Words</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {report.fillerWords.map((f, i) => (
                        <span key={i} className="filler-tag">"{f.word}" ×{f.count}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="card" style={{ padding: '28px 32px', marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>Behavioral (STAR Method)</h3>
                {report.star && Object.entries(report.star).map(([key, val]) => (
                  <SkillBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} />
                ))}
              </div>
              
              {/* Feedback */}
              <div className="card" style={{ padding: '28px 32px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>Detailed Feedback</h3>
                {report.feedback?.map((fb, i) => (
                  <div key={i} className="fb-item" style={{ borderBottom: i < report.feedback.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className={`pill pill-${fb.type === 'strength' ? 'green' : fb.type === 'critical' ? 'red' : 'warn'}`} style={{ marginBottom: 8, fontSize: '0.6rem' }}>
                      {fb.type.charAt(0).toUpperCase() + fb.type.slice(1)}
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                      <strong style={{ color: 'var(--text)' }}>{fb.title}.</strong> {fb.detail}
                    </p>
                  </div>
                ))}
                {report.bestAnswer && (
                  <div className="info-box green" style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span className="field-label" style={{ color: 'var(--green)' }}>Best Answer</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                      <strong>{report.bestAnswer.questionText}</strong><br/>
                      <em>{report.bestAnswer.answerSummary}</em>
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }
  
  // --- INTERVIEW PHASE ---
  return (
    <div className="page-bg-wrap">
      <div className="page-bg"><div className="orb" /><div className="orb" /><div className="orb" /></div>
      
      {/* Status Bar */}
      <div className="status-bar">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <a href="/" className="brand" style={{ fontSize: '1rem' }}>
              <div className="brand-mark" style={{ width: 28, height: 28, borderRadius: 8 }}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <span className="brand-name" style={{ fontSize: '1.05rem' }}>PrepAIr</span>
            </a>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className={`timer ${timeLeft <= 60 ? 'crit' : timeLeft <= 180 ? 'warn' : ''}`}>{formatTime(timeLeft)}</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Question {questionNumber} of {totalQs}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="live-tag"><span className="ld" />LIVE</div>
          </div>
        </div>
      </div>
      
      {/* Workspace */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, minHeight: 'calc(100vh - 180px)' }} className="int-grid">
          {/* Sarah Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div className={`avatar-ring ${aiState}`}>
              <img src="/interviewer.png" alt="Sarah Mitchell" className="avatar-img" />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 16 }}>Sarah Mitchell</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 16 }}>Senior Technical Recruiter</p>
            <div className={`ai-status ${aiState}`}>
              <span className="ai-dot" />
              <span>{aiState === 'speaking' ? 'Speaking…' : aiState === 'listening' ? 'Listening…' : aiState === 'processing' ? 'Thinking…' : 'Ready'}</span>
            </div>
            {/* Voice toggle */}
            <button className="voice-toggle" onClick={() => setVoiceEnabled(!voiceEnabled)} title={voiceEnabled ? 'Mute Sarah' : 'Unmute Sarah'}>
              {voiceEnabled ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              )}
            </button>
          </div>
          
          {/* Transcript Panel */}
          <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className="field-label">Live Transcript</span>
            </div>
            <div className="msg-list">
              {transcript.map((msg, i) => (
                <div key={i} className={`msg msg-${msg.role}`}>
                  <div className="msg-tag">{msg.role === 'ai' ? 'Sarah' : msg.role === 'coaching' ? 'Sarah — Tip' : 'You'}</div>
                  <div className="msg-body">{msg.text}</div>
                </div>
              ))}
              {liveTranscript && (
                <div className="msg msg-user live">
                  <div className="msg-tag">You (live)</div>
                  <div className="msg-body">{liveTranscript}</div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
            {isRecording && (
              <div className="speech-bar">
                <span className="sd" />
                <span>{liveTranscript ? 'Listening...' : 'Speak your answer...'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="ctrl">
        <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <button className={`mic-btn ${isRecording && !isMuted ? 'active' : ''} ${isMuted ? 'muted' : ''}`} onClick={() => {
            if (isMuted) { setIsMuted(false); startRecognition(); }
            else { setIsMuted(true); stopRecognition(); }
          }}>
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            )}
          </button>
          <button className="btn btn-primary" onClick={submitAnswer} disabled={!liveTranscript.trim() || aiState === 'processing'} style={{ padding: '11px 28px', fontSize: '0.88rem' }}>
            {aiState === 'processing' ? 'Processing...' : 'Submit Answer'}
            {aiState !== 'processing' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>
          <button className="btn btn-outline" onClick={() => setIsPaused(!isPaused)} style={{ fontSize: '0.78rem' }}>
            {isPaused ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause</>
            )}
          </button>
          <button className="btn btn-danger" onClick={endInterview} style={{ fontSize: '0.78rem' }}>End</button>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---
function ScoreRing({ label, value, color, sub }) {
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="card" style={{ padding: 32, textAlign: 'center' }}>
      <div className="score-wrap" style={{ margin: '0 auto 14px' }}>
        <svg className="score-svg" viewBox="0 0 150 150">
          <circle className="r-bg" cx="75" cy="75" r="60" />
          <circle className={`r-val ${color}`} cx="75" cy="75" r="60" style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s ease' }} />
        </svg>
        <div className="score-center">
          <span className={`s-num ${color}`}>{value}</span>
          <span className="s-sub">out of 100</span>
        </div>
      </div>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</h3>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 3 }}>{sub}</p>
    </div>
  );
}

function SkillBar({ label, value }) {
  const color = value >= 80 ? 'green' : value >= 60 ? 'blue' : value >= 40 ? 'purple' : 'warn';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.85rem' }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: `var(--${color === 'warn' ? 'amber' : color})` }}>{value}%</span>
      </div>
      <div className="bar-track"><div className={`bar-fill ${color}`} style={{ width: `${value}%`, transition: 'width 1s ease' }} /></div>
    </div>
  );
}

function SummaryRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}
