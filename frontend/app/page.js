"use client";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 relative">
      <button 
        onClick={() => router.push('/profile')}
        className="absolute top-6 right-6 flex items-center gap-3 bg-slate-900/80 border border-slate-700 px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-blue-900/20 hover:border-blue-500/50"
      >
        <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">👤</span>
        <span className="font-semibold text-slate-200 tracking-wide text-sm hidden sm:block">My Account</span>
      </button>

      <div className="max-w-3xl w-full text-center space-y-8">
        <header className="space-y-4">
          <div className="inline-block p-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 mb-2">
            <div className="bg-slate-950 rounded-full px-6 py-2 text-sm font-medium">
              v2.0 Update Active
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">EduGen AI</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Your intelligent learning companion. Generate targeted study materials from your documents or test your knowledge in exam mode.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 pt-8 w-full max-w-5xl mx-auto">
          {/* Study Mode Card */}
          <div 
            onClick={() => router.push('/study')}
            className="group cursor-pointer bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl">📚</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-blue-400 transition-colors">📘 Study Material</h2>
              <p className="text-slate-400 mb-6 relative z-10">Upload your PDFs and instantly generate comprehensive Q&A pairs. Export to Anki or listen via Audio.</p>
            </div>
            <span className="inline-flex items-center text-blue-400 font-semibold group-hover:gap-2 transition-all">
              Start Studying &rarr;
            </span>
          </div>

          {/* Exam Mode Card */}
          <div 
            onClick={() => router.push('/exam')}
            className="group cursor-pointer bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl">⏱️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-cyan-400 transition-colors">⏱️ Exam Mode</h2>
              <p className="text-slate-400 mb-6 relative z-10">Challenge yourself with custom MCQ or Theory exams. Set a timer and track your scores.</p>
            </div>
            <span className="inline-flex items-center text-cyan-400 font-semibold group-hover:gap-2 transition-all">
              Take an Exam &rarr;
            </span>
          </div>

          {/* Chat Mode Card */}
          <div 
            onClick={() => router.push('/chat')}
            className="group cursor-pointer bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl">💬</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-indigo-400 transition-colors">💬 Chat with PDF</h2>
              <p className="text-slate-400 mb-6 relative z-10">Have an intelligent conversation with your documents. Ask questions and get interactive answers.</p>
            </div>
            <span className="inline-flex items-center text-indigo-400 font-semibold group-hover:gap-2 transition-all">
              Start Chatting &rarr;
            </span>
          </div>

          {/* Analytics Card */}
          <div 
            onClick={() => router.push('/dashboard')}
            className="group cursor-pointer bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl">📊</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-purple-400 transition-colors">📊 My Analytics</h2>
              <p className="text-slate-400 mb-6 relative z-10">Track your learning progress, view historical exam scores, and monitor your study habits in one place.</p>
            </div>
            <span className="inline-flex items-center text-purple-400 font-semibold group-hover:gap-2 transition-all">
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