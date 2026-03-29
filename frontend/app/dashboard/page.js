"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function DashboardMode() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchSecureAnalytics = async () => {
      if (!user) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/me/exams`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.exams);
        }
      } catch (err) {
        console.error("Dashboard Sync Failed", err);
      }
    };
    fetchSecureAnalytics();
  }, [user, router]);

  const totalExams = history.length;
  const avgScore = totalExams > 0 
    ? (history.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / totalExams * 100).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 selection:bg-purple-500/30 relative font-sans">
      
      {/* Sleek Minimal Background */}
      <div className="fixed top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-[#050505] to-[#050505] pointer-events-none z-0" />

      <button 
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-2 text-sm font-medium z-50"
      >
        <span>&larr;</span> Return Home
      </button>

      <main className="max-w-4xl mx-auto pt-16 pb-20 relative z-10">
        <header className="text-center mb-12">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
             <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">Progress Analytics</h1>
          <p className="text-slate-400 text-sm md:text-base font-medium">Track your learning velocity and exam inference history.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2 z-10">Total Exams Evaluated</h3>
            <p className="text-6xl font-black text-white z-10">{totalExams}</p>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-500/5" />
            <h3 className="text-purple-400 font-bold uppercase tracking-widest text-xs mb-2 z-10">Average Inference Score</h3>
            <p className="text-6xl font-black text-white z-10">{avgScore}%</p>
          </div>
        </div>



        <h2 className="text-lg font-bold mb-6 text-white uppercase tracking-widest border-b border-white/10 pb-4">Exam History Archive</h2>
        
        {totalExams === 0 ? (
          <div className="bg-[#0A0A0A] border border-white/10 p-12 rounded-3xl text-center text-slate-500 text-sm font-medium shadow-xl">
            No telemetry data available. Initialize an Exam to populate analytics.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((exam, idx) => {
              const date = new Date(exam.date);
              const percentage = Math.round((exam.score / exam.total) * 100);
              return (
                <div key={idx} className="bg-[#0A0A0A] border border-white/5 p-5 md:p-6 rounded-2xl flex justify-between items-center transition-all hover:bg-[#050505] hover:border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#050505] border border-white/5 flex items-center justify-center hidden sm:flex">
                       <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-200">{exam.type || 'Custom AI'} Assessment</h3>
                      <p className="text-slate-500 text-[11px] uppercase tracking-widest font-bold mt-1">{date.toLocaleDateString()} // {date.toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`text-xl font-bold font-mono tracking-tighter ${percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-slate-300' : 'text-red-400'}`}>
                      {exam.score}/{exam.total}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                       <div className="w-16 h-1 bg-[#050505] rounded-full overflow-hidden">
                          <div className={`h-full ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-slate-400' : 'bg-red-500'}`} style={{width: `${percentage}%`}} />
                       </div>
                       <p className="text-[10px] text-slate-500 font-bold w-6 text-right">{percentage}%</p>
                    </div>
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
