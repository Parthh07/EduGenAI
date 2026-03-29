"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export const dynamic = 'force-dynamic';

export default function ExamMode() {
  const router = useRouter();
  const { globalFiles, setGlobalFiles } = useGlobalFile();
  const { user, loading: authLoading } = useAuth();

  // Setup State
  const [files, setFiles] = useState(globalFiles || []);
  const [examType, setExamType] = useState('MCQ');
  const [qCount, setQCount] = useState('5');
  const [timerMins, setTimerMins] = useState('10');
  const [loading, setLoading] = useState(false);

  // Active Exam State
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExamActive, setIsExamActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const timerRef = useRef(null);

  // Backspace Navigation & Tab Protection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isExamActive) return;
      if (e.key === 'Backspace' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        router.push('/');
      }
    };
    
    const handleBeforeUnload = (e) => {
      if (isExamActive) {
        e.preventDefault();
        e.returnValue = 'You have an active exam. Are you sure you want to leave?';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [router, isExamActive]);

  // Timer Logic
  useEffect(() => {
    if (isExamActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isExamActive, timeLeft]);

  const handleStartExam = async () => {
    if (!files || files.length === 0) return alert("Please select at least one PDF file first!");
    if (parseInt(timerMins) <= 0) return alert("Timer must be at least 1 minute.");
    
    setLoading(true);
    setQuestions(null);
    setIsSubmitted(false);
    setAnswers({});

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('examType', examType);
    formData.append('questionCount', qCount);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/generate-exam`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate exam');
      if (!data.questions || data.questions.length === 0) throw new Error("No questions generated.");

      setQuestions(data.questions);
      setTimeLeft(parseInt(timerMins) * 60);
      setIsExamActive(true);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    setAnswers({ ...answers, [index]: value });
  };

  const handleSubmitExam = () => {
    setIsExamActive(false);
    setIsSubmitted(true);
    clearInterval(timerRef.current);

    if (examType === 'MCQ') {
      let calcScore = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.answer) calcScore += 1;
      });
      setScore(calcScore);
      
      // Standout Feature: Confetti for perfect score!
      if (calcScore === questions.length) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6', '#fcd34d']
        });
      }
      // Save to Secure Cloud Database
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      fetch(`${apiUrl}/api/exams/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}` 
        },
        body: JSON.stringify({
          score: calcScore,
          total: questions.length,
          type: examType
        })
      }).catch(err => console.error("Failed to sync secure exam score", err));
    }
  };

  // Format Time (MM:SS)
  const formatTime = (seconds) => {
    if (seconds === null) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 selection:bg-cyan-500/30 relative font-sans">
      
      {/* Sleek Minimal Background */}
      <div className="fixed top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#050505] to-[#050505] pointer-events-none z-0" />

      {!isExamActive && (
        <button 
          onClick={() => router.push('/')}
          className="no-print absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-2 text-sm font-medium z-50"
        >
          <span>&larr;</span> Return Home
        </button>
      )}

      <main className="max-w-4xl mx-auto pt-16 pb-20 relative z-10">
        
        {/* --- Setup Phase --- */}
        {!isExamActive && !isSubmitted && (
          <div className="animate-in fade-in zoom-in-95">
            <header className="text-center mb-12">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                 <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">Exam Simulator</h1>
              <p className="text-slate-400 text-sm md:text-base font-medium">Generate a strict, timed theoretical or multiple-choice practice test.</p>
            </header>

            <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl shadow-2xl">
              {/* Advanced File Dropzone */}
              <div className="relative group rounded-3xl border border-dashed border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/[0.02] bg-[#050505] transition-all p-8 md:p-10 text-center flex flex-col items-center justify-center cursor-pointer mb-8 overflow-hidden min-h-[200px]">
                <input type="file" accept=".pdf" multiple onChange={(e) => {
                  const fileArray = Array.from(e.target.files);
                  const merged = [...files, ...fileArray];
                  const unique = Array.from(new Set(merged.map(f => f.name))).map(n => merged.find(f => f.name === n));
                  setFiles(unique);
                  setGlobalFiles(unique);
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="" />
                
                {files.length === 0 ? (
                  <>
                    <svg className="w-8 h-8 text-cyan-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="text-lg font-bold text-slate-300 group-hover:text-cyan-400 transition-colors z-0">
                      Select Exam Syllabus
                    </p>
                    <p className="text-sm text-slate-500 mt-2 font-medium z-0">Drag and drop PDFs or click to browse</p>
                  </>
                ) : (
                  <div className="w-full relative z-20">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{files.length} Document(s) Ready</span>
                      <button 
                        onClick={(e) => { e.preventDefault(); setFiles([]); setGlobalFiles([]); }} 
                        className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-left max-h-[250px] overflow-y-auto pr-2 pb-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-[#0A0A0A] border border-white/10 p-4 rounded-2xl shadow-lg hover:border-cyan-500/50 transition-colors group/file relative z-30">
                          <svg className="w-6 h-6 text-cyan-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          <div className="flex flex-col overflow-hidden flex-1">
                            <span className="text-sm font-bold text-slate-200 truncate pr-2">{file.name}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              const newFiles = files.filter((_, i) => i !== idx);
                              setFiles(newFiles);
                              setGlobalFiles(newFiles);
                            }}
                            className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover/file:opacity-100 cursor-pointer"
                            title="Remove file"
                          >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-slate-400 mb-2 text-xs font-semibold uppercase tracking-widest">Exam Type</label>
                  <select value={examType} onChange={(e) => setExamType(e.target.value)} className="bg-[#050505] border border-white/10 rounded-xl p-3.5 w-full outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm">
                    <option value="MCQ">Multiple Choice</option>
                    <option value="Theory">Theory / Essay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-2 text-xs font-semibold uppercase tracking-widest">Questions</label>
                  <select value={qCount} onChange={(e) => setQCount(e.target.value)} className="bg-[#050505] border border-white/10 rounded-xl p-3.5 w-full outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm">
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                    <option value="20">20 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-2 text-xs font-semibold uppercase tracking-widest">Time Limit</label>
                  <input type="number" min="1" max="120" value={timerMins} onChange={(e) => setTimerMins(e.target.value)} className="bg-[#050505] border border-white/10 rounded-xl p-3.5 w-full outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm" />
                </div>
              </div>

              <button onClick={handleStartExam} disabled={loading} className="w-full bg-white text-black hover:bg-slate-200 py-3.5 flex justify-center items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-50">
                 {loading ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> : "Begin Assessment"}
              </button>
            </div>
          </div>
        )}

        {/* --- Active Exam Phase --- */}
        {isExamActive && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="sticky top-4 z-50 bg-[#0A0A0A]/90 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center mb-8 shadow-xl">
              <div>
                <h2 className="font-bold text-white text-lg">{examType} Assessment</h2>
                <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">{questions.length} Items remaining</p>
              </div>
              <div className={`text-xl font-mono font-bold px-4 py-2 rounded-xl border ${timeLeft < 60 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#050505] text-cyan-400 border-white/5'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="space-y-8">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-[#0A0A0A] border border-white/10 p-6 md:p-8 rounded-3xl shadow-lg">
                  <h3 className="text-lg font-semibold text-slate-200 mb-6 leading-relaxed">
                    <span className="text-cyan-500 mr-2 font-mono text-sm">{idx + 1}.</span> {q.question}
                  </h3>
                  
                  {examType === 'MCQ' ? (
                    <div className="space-y-3">
                      {q.options && q.options.map((opt, oIdx) => (
                        <label key={oIdx} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${answers[idx] === opt ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-[#050505] border-white/5 hover:border-white/20'}`}>
                          <input type="radio" name={`q-${idx}`} value={opt} checked={answers[idx] === opt} onChange={() => handleAnswerChange(idx, opt)} className="w-4 h-4 accent-cyan-500 mr-4" />
                          <span className="text-slate-300 text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <textarea 
                        rows="6" 
                        placeholder="Construct your response here..."
                        value={answers[idx] || ''} 
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-slate-200 text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 resize-y"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <button onClick={handleSubmitExam} className="bg-white text-black hover:bg-slate-200 font-bold text-sm px-12 py-3.5 rounded-xl shadow-lg transition-all active:scale-95">
                Submit Assessment
              </button>
            </div>
          </div>
        )}

        {/* --- Result Phase --- */}
        {isSubmitted && (
          <div className="animate-in fade-in zoom-in-95 mt-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-white mb-6">Assessment Evaluated</h2>
              {examType === 'MCQ' ? (
                <div className="inline-block bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-2xl min-w-[200px]">
                  <p className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-3">Overall Score</p>
                  <p className="text-5xl font-black text-white">{score}<span className="text-2xl text-slate-500">/{questions.length}</span></p>
                  <p className="text-cyan-400 text-sm font-bold tracking-widest uppercase mt-4">
                    {score === questions.length ? 'Perfect Score' : score > questions.length/2 ? 'Pass Status' : 'Review Required'}
                  </p>
                </div>
              ) : (
                <div className="inline-block bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <p className="text-slate-300 text-sm font-medium">Your theory responses have been safely archived.</p>
                  <p className="text-slate-500 text-xs mt-2 font-medium">Please review against the AI baseline below.</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-sm tracking-widest uppercase text-slate-500 font-bold border-b border-white/10 pb-4 mb-2">Item Review Profile</h3>
              {questions.map((q, idx) => {
                const isCorrect = answers[idx] === q.answer;
                return (
                  <div key={idx} className={`bg-[#0A0A0A] border p-6 md:p-8 rounded-3xl shadow-lg ${examType==='MCQ' ? (isCorrect ? 'border-emerald-500/30' : 'border-red-500/30') : 'border-white/10'}`}>
                    <h4 className="text-base font-semibold text-slate-200 mb-6 flex items-start gap-2">
                       <span className="text-slate-500 font-mono text-xs mt-1">{idx + 1}.</span> <span>{q.question}</span>
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-[#050505] p-4 rounded-xl border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Submitted Candidate</p>
                        <p className={`text-sm font-medium ${examType==='MCQ' && (isCorrect ? 'text-emerald-400' : 'text-red-400')}`}>
                          {answers[idx] || (examType==='MCQ' ? "Omitted" : "No submission")}
                        </p>
                      </div>
                      
                      {examType === 'MCQ' && (
                        <div className="bg-[#050505] p-4 rounded-xl border border-white/5 relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1 h-full ${isCorrect ? 'bg-emerald-500' : 'bg-cyan-500'} `} />
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Baseline Truth</p>
                          <p className="text-slate-200 text-sm font-medium">{q.answer}</p>
                          {q.explanation && (
                            <div className="mt-4 pt-3 border-t border-white/5">
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Inference Rationale</p>
                              <p className="text-slate-400 text-[13px] leading-relaxed pr-2">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="no-print mt-12 text-center flex flex-wrap justify-center gap-3">
               <button onClick={() => window.print()} className="bg-[#0A0A0A] hover:bg-white/5 text-slate-300 font-bold px-6 py-3 rounded-xl transition-all border border-white/10 text-sm">
                Print Report
               </button>
               <button onClick={() => { setIsSubmitted(false); setQuestions(null); setFiles([]); setGlobalFiles([]); }} className="bg-white hover:bg-slate-200 text-black font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-md">
                Initialize New Assessment
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
