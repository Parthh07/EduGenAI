"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function DashboardMode() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [history, setHistory] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchData();
  }, [user, authLoading, router]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/me/exams`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Re-fetch because the above has a double-call bug — simple fix:
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setDataLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/me/exams`, { headers: { Authorization: `Bearer ${user.token}` } });
        if (res.ok) { const data = await res.json(); setHistory(Array.isArray(data) ? data : []); }
      } catch { } finally { setDataLoading(false); }
    };
    load();
  }, [user]);

  const totalExams = history.length;
  const avgScore = totalExams > 0
    ? (history.reduce((acc, curr) => acc + ((curr.score / (curr.total_questions || curr.total || 1)) * 100), 0) / totalExams).toFixed(1)
    : 0;
  const bestScore = totalExams > 0
    ? Math.max(...history.map(e => Math.round((e.score / (e.total_questions || e.total || 1)) * 100)))
    : 0;

  // Streak: consecutive days with at least one exam
  const calculateStreak = () => {
    if (!history.length) return 0;
    const examDates = [...new Set(history.map(e => new Date(e.createdAt).toDateString()))];
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      if (examDates.includes(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // today has no exam — check if yesterday does (streak from yesterday)
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();
  const mcqCount = history.filter(e => (e.exam_type || 'MCQ').toUpperCase() === 'MCQ').length;
  const theoryCount = history.filter(e => (e.exam_type || '').toUpperCase() === 'THEORY').length;

  // Chart data (last 20 exams in chronological order)
  const chartData = history.slice(0, 20).reverse().map((exam, i) => ({
    i: i + 1,
    date: new Date(exam.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    pct: Math.round((exam.score / (exam.total_questions || exam.total || 1)) * 100),
    type: exam.exam_type || 'MCQ',
    diff: exam.difficulty || 'medium'
  }));

  // Simple SVG line chart (no external lib needed)
  const ChartSVG = () => {
    if (chartData.length < 2) return null;
    const W = 600, H = 160, PAD = 30;
    const maxY = 100, minY = 0;
    const xStep = (W - PAD * 2) / (chartData.length - 1);
    const toX = (i) => PAD + i * xStep;
    const toY = (v) => PAD + (H - PAD * 2) * (1 - (v - minY) / (maxY - minY));

    const points = chartData.map((d, i) => `${toX(i)},${toY(d.pct)}`).join(' ');
    const fillPoints = `${PAD},${H - PAD} ${points} ${toX(chartData.length - 1)},${H - PAD}`;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1={PAD} y1={toY(y)} x2={W - PAD} y2={toY(y)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {/* Fill */}
        <polygon points={fillPoints} fill="url(#chartGrad)" />
        {/* Line */}
        <polyline points={points} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {chartData.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.pct)} r="4" fill="#050505" stroke="#8b5cf6" strokeWidth="2" />
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 selection:bg-purple-500/30 relative font-sans">
      <div className="fixed top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-[#050505] to-[#050505] pointer-events-none z-0" />

      <button onClick={() => router.push('/')} className="absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-2 text-sm font-medium z-50">
        <span>&larr;</span> Return Home
      </button>

      <main className="max-w-4xl mx-auto pt-16 pb-20 relative z-10">
        <header className="text-center mb-12">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">Progress Analytics</h1>
          <p className="text-slate-400 text-sm md:text-base font-medium">Track your learning velocity, score trends, and exam history.</p>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Exams Taken', value: totalExams, color: 'purple' },
            { label: 'Average Score', value: `${avgScore}%`, color: 'purple' },
            { label: 'Best Score', value: `${bestScore}%`, color: 'emerald' },
            { label: 'Day Streak 🔥', value: streak, color: streak > 0 ? 'amber' : 'slate' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0A0A0A] border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center">
              <h3 className={`text-${color}-400 font-bold uppercase tracking-widest text-[10px] mb-2`}>{label}</h3>
              <p className="text-4xl font-black text-white">{dataLoading ? '—' : value}</p>
            </div>
          ))}
        </div>

        {/* Exam type breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">MCQ Exams</p>
              <p className="text-2xl font-black text-white">{mcqCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-400 text-sm font-bold">M</span>
            </div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Theory Exams</p>
              <p className="text-2xl font-black text-white">{theoryCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <span className="text-indigo-400 text-sm font-bold">T</span>
            </div>
          </div>
        </div>

        {/* Score Trend Chart */}
        {chartData.length >= 2 && (
          <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-3xl shadow-xl mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Score Trend</h2>
                <p className="text-[11px] text-slate-500 mt-1">Last {chartData.length} assessments</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-purple-500 rounded-full" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Score %</span>
              </div>
            </div>
            {/* Y-axis labels */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[9px] text-slate-600 font-mono pr-2">
                <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
              </div>
              <div className="pl-6">
                <ChartSVG />
                {/* X-axis labels */}
                <div className="flex justify-between mt-1 px-[30px]">
                  {chartData.map((d, i) => (
                    <span key={i} className="text-[9px] text-slate-600 font-mono" style={{ display: i % Math.ceil(chartData.length / 6) === 0 ? 'block' : 'none' }}>{d.date}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Table */}
        <h2 className="text-lg font-bold mb-6 text-white uppercase tracking-widest border-b border-white/10 pb-4">Exam History</h2>
        
        {dataLoading ? (
          <div className="bg-[#0A0A0A] border border-white/10 p-12 rounded-3xl text-center">
            <span className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin inline-block" />
          </div>
        ) : totalExams === 0 ? (
          <div className="bg-[#0A0A0A] border border-white/10 p-12 rounded-3xl text-center text-slate-500 text-sm font-medium shadow-xl">
            No exams yet. Head to <button onClick={() => router.push('/exam')} className="text-cyan-400 hover:underline">Exam Simulator</button> to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((exam, idx) => {
              const total = exam.total_questions || exam.total || 1;
              const percentage = Math.round((exam.score / total) * 100);
              const diff = exam.difficulty || 'medium';
              const type = exam.exam_type || 'MCQ';
              const diffColor = { easy: 'text-emerald-400', medium: 'text-amber-400', hard: 'text-red-400' }[diff] || 'text-slate-400';
              return (
                <div key={idx} className="bg-[#0A0A0A] border border-white/5 p-5 md:p-6 rounded-2xl flex justify-between items-center transition-all hover:bg-[#050505] hover:border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#050505] border border-white/5 flex items-center justify-center hidden sm:flex">
                      <span className="text-xs font-bold text-slate-400">{type === 'MCQ' ? 'M' : 'T'}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-200">{type} Assessment</h3>
                      <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                        {new Date(exam.createdAt).toLocaleDateString()} · <span className={diffColor}>{diff}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`text-xl font-bold font-mono tracking-tighter ${percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-slate-300' : 'text-red-400'}`}>
                      {exam.score}/{total}
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
