"use client";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* Ambient Canvas Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <button 
        onClick={() => router.push('/profile')}
        className="absolute top-6 right-6 flex items-center gap-3 bg-white/[0.03] border border-white/10 px-5 py-2.5 rounded-full hover:bg-white/[0.08] transition-all shadow-2xl backdrop-blur-xl group z-50 hover:border-indigo-500/50 hover:scale-105 active:scale-95 duration-300"
      >
        <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">👤</span>
        <span className="font-semibold text-slate-300 tracking-wide text-sm hidden sm:block group-hover:text-white transition-colors">My Account</span>
      </button>

      <div className="max-w-4xl w-full text-center space-y-12 z-10">
        <header className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out">
          <div className="inline-flex p-[1px] rounded-full bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-cyan-500/50 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <div className="bg-[#030712]/90 backdrop-blur-xl rounded-full px-6 py-2 text-xs font-semibold tracking-widest uppercase text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> v3.0 Update Active
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent drop-shadow-sm">
            EduGen AI
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
            Your incredibly intelligent learning companion. Generate study materials, pass exams, and chat with your documents.
          </p>
        </header>

        {/* Powered By Section */}
        <div className="pt-8 pb-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300 ease-out fill-mode-both">
          <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase mb-8 text-center">Powered by Premium Technologies</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="flex items-center gap-2.5 hover:scale-110 transition-transform duration-300">
              <img src="https://cdn.simpleicons.org/nvidia/76B900" alt="NVIDIA" className="h-6 drop-shadow-[0_0_15px_rgba(118,185,0,0.5)]" />
              <span className="font-bold text-slate-300 tracking-tight text-sm">NVIDIA NIM</span>
            </div>
            <div className="flex items-center gap-2.5 hover:scale-110 transition-transform duration-300">
              <img src="https://cdn.simpleicons.org/googlegemini/8E75B2" alt="Google Gemini" className="h-5 drop-shadow-[0_0_15px_rgba(142,117,178,0.5)]" />
              <span className="font-bold text-slate-300 tracking-tight text-sm">Google Gemini</span>
            </div>
            <div className="flex items-center gap-2.5 hover:scale-110 transition-transform duration-300">
              <img src="https://cdn.simpleicons.org/nextdotjs/white" alt="Next.js" className="h-5 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
              <span className="font-bold text-slate-300 tracking-tight text-sm">Next.js 15</span>
            </div>
            <div className="flex items-center gap-2.5 hover:scale-110 transition-transform duration-300">
              <img src="https://cdn.simpleicons.org/tailwindcss/38B2AC" alt="Tailwind CSS" className="h-5 drop-shadow-[0_0_15px_rgba(56,178,172,0.5)]" />
              <span className="font-bold text-slate-300 tracking-tight text-sm">Tailwind CSS</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 pt-12 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-500 ease-out fill-mode-both">
          {/* Study Mode Card */}
          <div 
            onClick={() => router.push('/study')}
            className="group cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-indigo-500/30 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl hover:shadow-[0_0_40px_rgba(99,102,241,0.1)] transition-all duration-500 ease-out hover:-translate-y-2 text-left relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
            <div className="absolute top-6 right-8 text-5xl opacity-80 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">📚</div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-3 group-hover:text-indigo-400 transition-colors">Study Material</h2>
              <p className="text-slate-400/90 mb-8 relative z-10 leading-relaxed text-[15px] font-medium">Upload multi-page PDFs to instantly synthesize comprehensive Q&A pairs. Export to Anki or listen via Audio.</p>
            </div>
            <span className="inline-flex items-center text-indigo-400 font-bold group-hover:gap-3 transition-all tracking-wide text-sm uppercase">
              Start Studying &rarr;
            </span>
          </div>

          {/* Exam Mode Card */}
          <div 
            onClick={() => router.push('/exam')}
            className="group cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-cyan-500/30 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl hover:shadow-[0_0_40px_rgba(6,182,212,0.1)] transition-all duration-500 ease-out hover:-translate-y-2 text-left relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors duration-500" />
            <div className="absolute top-6 right-8 text-5xl opacity-80 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">⏱️</div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-3 group-hover:text-cyan-400 transition-colors">Exam Mode</h2>
              <p className="text-slate-400/90 mb-8 relative z-10 leading-relaxed text-[15px] font-medium">Challenge yourself with dynamic, timed MCQ & Theory exams based on your syllabus. Track your logic against AI.</p>
            </div>
            <span className="inline-flex items-center text-cyan-400 font-bold group-hover:gap-3 transition-all tracking-wide text-sm uppercase">
              Take an Exam &rarr;
            </span>
          </div>

          {/* Chat Mode Card */}
          <div 
            onClick={() => router.push('/chat')}
            className="group cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-purple-500/30 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.1)] transition-all duration-500 ease-out hover:-translate-y-2 text-left relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-500" />
            <div className="absolute top-6 right-8 text-5xl opacity-80 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">💬</div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-3 group-hover:text-purple-400 transition-colors">Chat with PDF</h2>
              <p className="text-slate-400/90 mb-8 relative z-10 leading-relaxed text-[15px] font-medium">Unleash exactly Multi-Model Chat logic (Gemini & Llama) against your textbooks. Generate interactive Mermaid flows directly.</p>
            </div>
            <span className="inline-flex items-center text-purple-400 font-bold group-hover:gap-3 transition-all tracking-wide text-sm uppercase">
              Start Chatting &rarr;
            </span>
          </div>

          {/* Analytics Card */}
          <div 
            onClick={() => router.push('/dashboard')}
            className="group cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-emerald-500/30 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] transition-all duration-500 ease-out hover:-translate-y-2 text-left relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
            <div className="absolute top-6 right-8 text-5xl opacity-80 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">📊</div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-3 group-hover:text-emerald-400 transition-colors">My Analytics</h2>
              <p className="text-slate-400/90 mb-8 relative z-10 leading-relaxed text-[15px] font-medium">Locally cache and graph your learning progress, historical exam scores, and study habits in a secure dashboard.</p>
            </div>
            <span className="inline-flex items-center text-emerald-400 font-bold group-hover:gap-3 transition-all tracking-wide text-sm uppercase">
              View Dashboard &rarr;
            </span>
          </div>
        </div>

        {/* Footer / Developer Details */}
        <footer className="mt-20 border-t border-slate-800/50 pt-8 pb-4 w-full text-center fade-in">
          <p className="text-slate-400 flex items-center justify-center gap-2 text-sm sm:text-base">
            Designed & Developed with <span className="text-red-500 animate-pulse">❤️</span> by <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-wide">Parth</span>
          </p>
          <p className="text-xs text-slate-600 mt-3 font-medium tracking-widest uppercase">EduGen AI v3.0</p>
        </footer>
      </div>
    </div>
  );
}