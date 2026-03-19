"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardMode() {
  const router = useRouter();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Load local history, reversed so newest is first
    setHistory(JSON.parse(localStorage.getItem('eduGenExams') || '[]').reverse());
  }, []);

  const totalExams = history.length;
  const avgScore = totalExams > 0 
    ? (history.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / totalExams * 100).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 selection:bg-purple-500/30 relative">
      <button 
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-2"
      >
        <span>&larr;</span> Back
      </button>

      <main className="max-w-4xl mx-auto pt-10 pb-20">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">My Analytics</h1>
          <p className="text-slate-400">Track your learning progress and exam history</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center">
            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Total Exams Taken</h3>
            <p className="text-6xl font-black text-white">{totalExams}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/20 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center">
            <h3 className="text-purple-400 font-bold uppercase tracking-widest text-sm mb-2">Average Score</h3>
            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{avgScore}%</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-slate-200">Recent Exam History</h2>
        
        {totalExams === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-3xl text-center text-slate-400">
            No exams taken yet. Head over to Exam Mode to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((exam, idx) => {
              const date = new Date(exam.date);
              const percentage = Math.round((exam.score / exam.total) * 100);
              return (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex justify-between items-center transition-all hover:bg-slate-800/60">
                  <div>
                    <h3 className="text-lg font-bold text-slate-200">{exam.type} Exam</h3>
                    <p className="text-slate-500 text-sm">{date.toLocaleDateString()} at {date.toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {exam.score}/{exam.total}
                    </p>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
