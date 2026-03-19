"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalFile } from '../context/FileContext';
import confetti from 'canvas-confetti';

export const dynamic = 'force-dynamic';

export default function ExamMode() {
  const router = useRouter();
  const { globalFiles, setGlobalFiles } = useGlobalFile();

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

      // Save to History Dashboard
      const history = JSON.parse(localStorage.getItem('eduGenExams') || '[]');
      history.push({
        date: new Date().toISOString(),
        score: calcScore,
        total: questions.length,
        type: examType
      });
      localStorage.setItem('eduGenExams', JSON.stringify(history));
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
    <div className="min-h-screen bg-slate-950 text-white p-6 selection:bg-cyan-500/30 relative">
      {!isExamActive && (
        <button 
          onClick={() => router.push('/')}
          className="no-print absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-2"
        >
          <span>&larr;</span> Back
        </button>
      )}

      <main className="max-w-4xl mx-auto pt-10 pb-20">
        
        {/* --- Setup Phase --- */}
        {!isExamActive && !isSubmitted && (
          <div className="animate-in fade-in zoom-in-95">
            <header className="text-center mb-12 mt-6">
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-emerald-300 bg-clip-text text-transparent mb-2">Exam Simulator</h1>
              <p className="text-slate-400">Generate a timed practice test from your study materials</p>
            </header>

            <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
              {/* Advanced File Dropzone */}
              <div className="relative group rounded-[2rem] border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-800/20 hover:bg-slate-800/40 transition-all p-8 md:p-10 text-center flex flex-col items-center justify-center cursor-pointer mb-8 overflow-hidden min-h-[200px]">
                <input type="file" accept=".pdf" multiple onChange={(e) => {
                  const fileArray = Array.from(e.target.files);
                  const merged = [...files, ...fileArray];
                  const unique = Array.from(new Set(merged.map(f => f.name))).map(n => merged.find(f => f.name === n));
                  setFiles(unique);
                  setGlobalFiles(unique);
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="" />
                
                {files.length === 0 ? (
                  <>
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300 z-0">
                      <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    </div>
                    <p className="text-xl font-bold text-slate-300 group-hover:text-cyan-400 transition-colors z-0">
                      Drag & Drop your Study Materials here
                    </p>
                    <p className="text-sm text-slate-500 mt-2 font-medium z-0">or click to browse from your computer</p>
                  </>
                ) : (
                  <div className="w-full relative z-20">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{files.length} Document(s) Ready</span>
                      <button 
                        onClick={(e) => { e.preventDefault(); setFiles([]); setGlobalFiles([]); }} 
                        className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-left max-h-[250px] overflow-y-auto pr-2 pb-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-3 rounded-2xl shadow-lg hover:border-slate-500 transition-colors group/file relative z-30">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-bold text-[10px] flex-none shadow-inner border border-cyan-400/20">
                            PDF
                          </div>
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
                            className="text-slate-500 hover:text-red-400 p-2 rounded-full hover:bg-slate-800 transition-all opacity-0 group-hover/file:opacity-100 cursor-pointer"
                            title="Remove file"
                          >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-4 font-medium">+ Drop more files to add to exam syllabus</p>
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-slate-300 mb-2 text-sm font-semibold">Exam Type</label>
                  <select value={examType} onChange={(e) => setExamType(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-3 w-full outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="MCQ">Multiple Choice</option>
                    <option value="Theory">Theory / Essay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 text-sm font-semibold">No. of Questions</label>
                  <select value={qCount} onChange={(e) => setQCount(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-3 w-full outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                    <option value="20">20 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 text-sm font-semibold">Timer (Minutes)</label>
                  <input type="number" min="1" max="120" value={timerMins} onChange={(e) => setTimerMins(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-3 w-full outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              <button onClick={handleStartExam} disabled={loading} className="w-full bg-cyan-600 py-4 rounded-xl font-bold hover:bg-cyan-500 transition-all active:scale-[0.98]">
                {loading ? "Analyzing Document & Generating Exam..." : "Start Exam Now"}
              </button>
            </div>
          </div>
        )}

        {/* --- Active Exam Phase --- */}
        {isExamActive && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="sticky top-4 z-50 bg-slate-900/90 border border-slate-700 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center mb-8 shadow-xl">
              <div>
                <h2 className="font-bold text-slate-200">{examType} Exam Activity</h2>
                <p className="text-sm text-slate-400">Answer all {questions.length} questions.</p>
              </div>
              <div className={`text-3xl font-mono font-bold px-4 py-2 rounded-xl ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-cyan-400'}`}>
                ⏱ {formatTime(timeLeft)}
              </div>
            </div>

            <div className="space-y-8">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-lg">
                  <h3 className="text-xl font-semibold text-slate-200 mb-6">
                    <span className="text-cyan-500 mr-2">{idx + 1}.</span> {q.question}
                  </h3>
                  
                  {examType === 'MCQ' ? (
                    <div className="space-y-3">
                      {q.options && q.options.map((opt, oIdx) => (
                        <label key={oIdx} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${answers[idx] === opt ? 'bg-cyan-600/20 border-cyan-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                          <input type="radio" name={`q-${idx}`} value={opt} checked={answers[idx] === opt} onChange={() => handleAnswerChange(idx, opt)} className="w-5 h-5 accent-cyan-500 mr-4" />
                          <span className="text-slate-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <textarea 
                        rows="6" 
                        placeholder="Type your answer here..."
                        value={answers[idx] || ''} 
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <button onClick={handleSubmitExam} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-12 py-4 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">
                Submit Exam
              </button>
            </div>
          </div>
        )}

        {/* --- Result Phase --- */}
        {isSubmitted && (
          <div className="animate-in fade-in zoom-in-95 mt-8">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-white mb-4">Exam Completed!</h2>
              {examType === 'MCQ' ? (
                <div className="inline-block bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                  <p className="text-slate-400 uppercase tracking-widest text-sm font-bold mb-2">Final Score</p>
                  <p className="text-6xl font-black text-cyan-400">{score} <span className="text-3xl text-slate-500">/ {questions.length}</span></p>
                  <p className="text-slate-300 mt-4 text-lg">
                    {score === questions.length ? 'Perfect Score! 🎉' : score > questions.length/2 ? 'Great Job! 👍' : 'Keep Studying! 📚'}
                  </p>
                </div>
              ) : (
                <div className="inline-block bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                  <p className="text-slate-300 text-lg">Your theory answers have been recorded.</p>
                  <p className="text-slate-400 mt-2">Review your answers against the AI definitions below.</p>
                </div>
              )}
            </div>

            <div className="space-y-8">
              <h3 className="text-2xl font-bold border-b border-slate-800 pb-4">Detailed Review</h3>
              {questions.map((q, idx) => {
                const isCorrect = answers[idx] === q.answer;
                return (
                  <div key={idx} className={`bg-slate-900/50 border p-6 md:p-8 rounded-3xl shadow-lg ${examType==='MCQ' ? (isCorrect ? 'border-emerald-500/50' : 'border-red-500/50') : 'border-slate-800'}`}>
                    <h4 className="text-lg font-semibold text-slate-200 mb-4">
                      {idx + 1}. {q.question}
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-2">Your Answer</p>
                        <p className={`text-slate-300 ${examType==='MCQ' && (isCorrect ? 'text-emerald-400' : 'text-red-400')}`}>
                          {answers[idx] || (examType==='MCQ' ? "No Answer" : "Blank")}
                        </p>
                      </div>
                      
                      {examType === 'MCQ' && (
                        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20">
                          <p className="text-emerald-500 text-xs font-bold uppercase mb-2">Correct Answer</p>
                          <p className="text-emerald-400 font-bold">{q.answer}</p>
                          {q.explanation && (
                            <div className="mt-3 pt-3 border-t border-emerald-500/20">
                              <p className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-widest">Explanation</p>
                              <p className="text-emerald-200/80 text-sm leading-relaxed italic pr-2">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="no-print mt-12 text-center flex flex-wrap justify-center gap-4">
               <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-8 py-3 rounded-xl transition-all border border-slate-700 shadow-lg">
                🖨️ Print Exam Results
               </button>
               <button onClick={() => { setIsSubmitted(false); setQuestions(null); setFiles([]); setGlobalFiles([]); }} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all">
                Take Another Exam
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
