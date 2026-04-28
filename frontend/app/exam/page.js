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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [files, setFiles] = useState(globalFiles || []);
  const [examType, setExamType] = useState('MCQ');
  const [qCount, setQCount] = useState('5');
  const [difficulty, setDifficulty] = useState('medium');
  const [timerMins, setTimerMins] = useState('10');
  const [loading, setLoading] = useState(false);
  const [gradingLoading, setGradingLoading] = useState(false);

  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExamActive, setIsExamActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [theoryGrades, setTheoryGrades] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Block accidental page leave during exam (keep this — it's useful)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isExamActive) { e.preventDefault(); e.returnValue = 'You have an active exam. Leave?'; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isExamActive]);

  // Timer
  useEffect(() => {
    if (isExamActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current); handleSubmitExam(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isExamActive]);

  const handleStartExam = async () => {
    if (!files || files.length === 0) return alert("Please select at least one file first!");
    if (parseInt(timerMins) <= 0) return alert("Timer must be at least 1 minute.");
    setLoading(true); setQuestions(null); setIsSubmitted(false); setAnswers({}); setTheoryGrades(null);

    try {
      // 1. Upload Context Once per document selection!
      const upData = new FormData();
      files.forEach(f => upData.append('files', f));
      
      const upRes = await fetch(`${apiUrl}/api/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
        body: upData
      });
      if (!upRes.ok) {
        const d = await upRes.json();
        throw new Error(d.error || "Failed to pre-process document on server.");
      }
      const upJson = await upRes.json();
      const activeUris = upJson.uris;

      // 2. Generate Generate
      const reqBody = { examType, questionCount: qCount, difficulty, fileContextUris: JSON.stringify(activeUris) };
      const res = await fetch(`${apiUrl}/generate-exam`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody),
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

  const handleAnswerChange = (index, value) => setAnswers({ ...answers, [index]: value });

  const handleSubmitExam = async () => {
    setIsExamActive(false);
    setIsSubmitted(true);
    clearInterval(timerRef.current);

    if (examType === 'MCQ') {
      let calcScore = 0;
      questions.forEach((q, idx) => { if (answers[idx] === q.answer) calcScore += 1; });
      setScore(calcScore);
      if (calcScore === questions.length) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#06b6d4', '#10b981', '#3b82f6', '#fcd34d'] });
      fetch(`${apiUrl}/api/exams/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ score: calcScore, total_questions: questions.length, exam_type: examType, difficulty })
      }).catch(err => console.error("Failed to sync exam score", err));
    } else {
      // Theory: AI grading
      setGradingLoading(true);
      try {
        const userAnswers = questions.map((_, idx) => answers[idx] || '');
        const res = await fetch(`${apiUrl}/api/exams/grade-theory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
          body: JSON.stringify({ questions, userAnswers })
        });
        const data = await res.json();
        if (res.ok) {
          setTheoryGrades(data.grades);
          setScore(data.percentage);
          if (data.percentage === 100) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          fetch(`${apiUrl}/api/exams/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
            body: JSON.stringify({ score: Math.round(data.percentage), total_questions: 100, exam_type: examType, difficulty })
          }).catch(() => {});
        }
      } catch (e) {
        console.error('Theory grading failed', e);
      } finally {
        setGradingLoading(false);
      }
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const difficultyColors = { easy: 'text-emerald-600', medium: 'text-amber-600', hard: 'text-red-600' };

  return (
    <div className="min-h-screen bg-[#FAFBFE] text-slate-900 p-6 selection:bg-cyan-500/20 relative font-sans">
      <div className="fixed top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-100/60 via-[#FAFBFE] to-[#FAFBFE] pointer-events-none z-0" />




      <main className="max-w-4xl mx-auto pt-16 pb-20 relative z-10">
        
        {/* Setup Phase */}
        {!isExamActive && !isSubmitted && (
          <div className="animate-in fade-in zoom-in-95">
            <header className="text-center mb-12">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mx-auto mb-6">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">Exam Simulator</h1>
              <p className="text-slate-500 text-sm md:text-base font-medium">Generate a timed, AI-graded practice exam from your documents.</p>
            </header>

            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
              {/* File Dropzone */}
              <div className="relative group rounded-3xl border border-dashed border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/30 bg-slate-50 transition-all p-8 md:p-10 text-center flex flex-col items-center justify-center cursor-pointer mb-8 overflow-hidden min-h-[180px]">
                <input type="file" accept=".pdf" multiple onChange={(e) => {
                  const fileArray = Array.from(e.target.files);
                  const merged = [...files, ...fileArray];
                  const unique = Array.from(new Set(merged.map(f => f.name))).map(n => merged.find(f => f.name === n));
                  setFiles(unique); setGlobalFiles(unique);
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="" />
                {files.length === 0 ? (
                  <>
                    <svg className="w-8 h-8 text-cyan-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-lg font-bold text-slate-600 group-hover:text-cyan-600 transition-colors z-0">Select Exam Syllabus</p>
                    <p className="text-sm text-slate-400 mt-2 font-medium z-0">Drag and drop PDFs or click to browse</p>
                  </>
                ) : (
                  <div className="w-full relative z-20">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{files.length} Document(s) Ready</span>
                      <button onClick={(e) => { e.preventDefault(); setFiles([]); setGlobalFiles([]); }} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer">Clear All</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-left max-h-[200px] overflow-y-auto pr-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-cyan-300 transition-colors group/file relative z-30">
                          <svg className="w-6 h-6 text-cyan-500 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <div className="flex flex-col overflow-hidden flex-1">
                            <span className="text-sm font-bold text-slate-700 truncate pr-2">{file.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <button onClick={(e) => { e.preventDefault(); const nf = files.filter((_, i) => i !== idx); setFiles(nf); setGlobalFiles(nf); }} className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover/file:opacity-100 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div>
                  <label className="block text-slate-500 mb-2 text-xs font-semibold uppercase tracking-widest">Exam Type</label>
                  <select value={examType} onChange={(e) => setExamType(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 w-full outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-slate-700">
                    <option value="MCQ">Multiple Choice</option>
                    <option value="Theory">Theory / Essay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-2 text-xs font-semibold uppercase tracking-widest">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 w-full outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-slate-700">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-2 text-xs font-semibold uppercase tracking-widest">Questions</label>
                  <select value={qCount} onChange={(e) => setQCount(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 w-full outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-slate-700">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-2 text-xs font-semibold uppercase tracking-widest">Time (mins)</label>
                  <input type="number" min="1" max="180" value={timerMins} onChange={(e) => setTimerMins(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 w-full outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-slate-700" />
                </div>
              </div>

              <button onClick={handleStartExam} disabled={loading} className="w-full bg-cyan-600 text-white hover:bg-cyan-700 py-3.5 flex justify-center items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-cyan-500/20">
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Begin Assessment"}
              </button>
            </div>
          </div>
        )}

        {/* Active Exam Phase */}
        {isExamActive && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="sticky top-4 z-50 bg-white/90 border border-slate-200 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center mb-8 shadow-lg">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">{examType} Assessment</h2>
                <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">
                  {questions.length} Questions · <span className={difficultyColors[difficulty]}>{difficulty}</span>
                </p>
              </div>
              <div className={`text-xl font-mono font-bold px-4 py-2 rounded-xl border ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-cyan-600 border-slate-200'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="space-y-8">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6 leading-relaxed">
                    <span className="text-cyan-600 mr-2 font-mono text-sm">{idx + 1}.</span> {q.question}
                  </h3>
                  {examType === 'MCQ' ? (
                    <div className="space-y-3">
                      {q.options && q.options.map((opt, oIdx) => (
                        <label key={oIdx} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${answers[idx] === opt ? 'bg-cyan-50 border-cyan-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name={`q-${idx}`} value={opt} checked={answers[idx] === opt} onChange={() => handleAnswerChange(idx, opt)} className="w-4 h-4 accent-cyan-500 mr-4" />
                          <span className="text-slate-700 text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea rows="6" placeholder="Write your answer here..." value={answers[idx] || ''} onChange={(e) => handleAnswerChange(idx, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 resize-y" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <button onClick={handleSubmitExam} className="bg-cyan-600 text-white hover:bg-cyan-700 font-bold text-sm px-12 py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
                Submit Assessment
              </button>
            </div>
          </div>
        )}

        {/* Results Phase */}
        {isSubmitted && (
          <div className="animate-in fade-in zoom-in-95 mt-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Assessment Result</h2>

              {gradingLoading ? (
                <div className="inline-flex flex-col items-center gap-4 bg-white border border-slate-200 rounded-3xl p-10 shadow-2xl">
                  <span className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm font-medium">AI is grading your answers…</p>
                </div>
              ) : examType === 'MCQ' ? (
                <div className="inline-block bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl min-w-[200px]">
                  <p className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-3">Score</p>
                  <p className="text-5xl font-black text-slate-900">{score}<span className="text-2xl text-slate-400">/{questions.length}</span></p>
                  <p className="text-cyan-600 text-sm font-bold tracking-widest uppercase mt-4">
                    {score === questions.length ? '🎉 Perfect Score!' : score > questions.length / 2 ? '✓ Passed' : '⚠ Review Required'}
                  </p>
                </div>
              ) : theoryGrades ? (
                <div className="inline-block bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl min-w-[200px]">
                  <p className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-3">AI-Graded Score</p>
                  <p className="text-5xl font-black text-slate-900">{score}<span className="text-2xl text-slate-400">%</span></p>
                  <p className={`text-sm font-bold tracking-widest uppercase mt-4 ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {score >= 80 ? '✓ Excellent' : score >= 50 ? '~ Satisfactory' : '⚠ Needs Improvement'}
                  </p>
                </div>
              ) : (
                <div className="inline-block bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
                  <p className="text-slate-600 text-sm font-medium">Exam submitted. Review your answers below.</p>
                </div>
              )}
            </div>

            {!gradingLoading && (
              <div className="space-y-6">
                <h3 className="text-sm tracking-widest uppercase text-slate-500 font-bold border-b border-slate-200 pb-4 mb-2">Question Review</h3>
                {questions.map((q, idx) => {
                  const isCorrect = examType === 'MCQ' && answers[idx] === q.answer;
                  const grade = theoryGrades ? theoryGrades[idx] : null;
                  return (
                    <div key={idx} className={`bg-white border p-6 md:p-8 rounded-3xl shadow-sm ${examType === 'MCQ' ? (isCorrect ? 'border-emerald-300' : 'border-red-300') : 'border-slate-200'}`}>
                      <h4 className="text-base font-semibold text-slate-800 mb-6 flex items-start gap-2">
                        <span className="text-slate-500 font-mono text-xs mt-1">{idx + 1}.</span>
                        <span>{q.question}</span>
                      </h4>

                      {examType === 'MCQ' ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Your Answer</p>
                            <p className={`text-sm font-medium ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>{answers[idx] || "Omitted"}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${isCorrect ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Correct Answer</p>
                            <p className="text-slate-700 text-sm font-medium">{q.answer}</p>
                            {q.explanation && (
                              <div className="mt-4 pt-3 border-t border-slate-100">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Explanation</p>
                                <p className="text-slate-400 text-[13px] leading-relaxed pr-2">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : grade ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`text-2xl font-black font-mono ${grade.score >= 8 ? 'text-emerald-400' : grade.score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{grade.score}<span className="text-sm text-slate-500">/10</span></div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div className={`h-full rounded-full transition-all ${grade.score >= 8 ? 'bg-emerald-500' : grade.score >= 5 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${grade.score * 10}%` }} />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Your Answer</p>
                              <p className="text-slate-600 text-sm leading-relaxed">{answers[idx] || "No answer provided"}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">AI Feedback</p>
                              <p className="text-slate-400 text-sm leading-relaxed">{grade.feedback}</p>
                            </div>
                          </div>
                          {grade.modelAnswer && (
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                              <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-2">Model Answer</p>
                              <p className="text-slate-600 text-sm leading-relaxed">{grade.modelAnswer}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-slate-400 text-sm">{answers[idx] || "No answer provided"}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="no-print mt-12 text-center flex flex-wrap justify-center gap-3">
              <button onClick={() => window.print()} className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-6 py-3 rounded-xl transition-all border border-slate-200 text-sm">Print Report</button>
              <button onClick={() => { setIsSubmitted(false); setQuestions(null); setFiles([]); setGlobalFiles([]); setTheoryGrades(null); }} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-md shadow-cyan-500/20">New Assessment</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
