"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  
  const [userName, setUserName] = useState("Guest Student");
  const [email, setEmail] = useState("student@edugen.ai");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.username) {
      setUserName(user.username);
    }
    const savedEmail = localStorage.getItem('eduGenEmail');
    if (savedEmail) setEmail(savedEmail);
  }, [user]);

  const handleSave = () => {
    localStorage.setItem('eduGenEmail', email);
    alert("Profile configurations saved.");
  };

  const clearData = (key, name) => {
    if (confirm(`Execute destructive action on ${name}? This cannot be undone.`)) {
      localStorage.removeItem(key);
      alert(`${name} wiped out.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 selection:bg-indigo-500/30 relative font-sans">
      
      {/* Sleek Minimal Background */}
      <div className="fixed top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050505] to-[#050505] pointer-events-none z-0" />

      <button 
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-2 text-sm font-medium z-50"
      >
        <span>&larr;</span> Return Home
      </button>

      <main className="max-w-3xl mx-auto pt-16 pb-20 relative z-10">
        <header className="mb-12 flex items-center gap-6">
          <div className="w-20 h-20 bg-[#0A0A0A] rounded-2xl flex items-center justify-center text-4xl shadow-xl border border-white/20 font-black">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Account Architecture</h1>
            <p className="text-slate-400 text-sm font-medium">Manage localized telemetry and application identities.</p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Profile Details Section */}
          <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-white/5 pb-3">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Node Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Display Identifier</label>
                <input 
                  type="text" 
                  value={userName} 
                  disabled
                  className="w-full bg-[#050505] border border-white/10 text-slate-500 rounded-xl px-4 py-3.5 outline-none font-medium cursor-not-allowed shadow-inner text-sm"
                />
                <p className="text-[10px] text-slate-600 mt-2 font-medium tracking-wide">Display Identifier is linked to your secure JWT layer.</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Notification Vector</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 text-white rounded-xl px-4 py-3.5 outline-none focus:border-white/30 transition-all font-medium shadow-inner text-sm"
                />
              </div>
              <div className="flex gap-3">
                 <button onClick={handleSave} className="bg-white hover:bg-slate-200 text-black font-bold py-3.5 px-8 rounded-xl transition-all shadow-md text-sm">
                   Update Telemetry
                 </button>
                 <button onClick={logout} className="bg-[#050505] hover:bg-white/5 text-rose-400 border border-white/10 font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm text-sm">
                   Terminate Session
                 </button>
              </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-white/5 pb-3">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span> Destructive Sequences
            </h2>
            <p className="text-slate-400 text-[13px] mb-8 leading-relaxed font-medium">
              Data is preserved precisely within isolated system caches for extreme privacy. Engage the operations below to permanently terminate designated cache domains.
            </p>
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-[#050505] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">Purge Contextual RAM</h3>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Flush volatile PDF documents</p>
                </div>
                <button 
                  onClick={() => { localStorage.removeItem('eduGenFileContexts'); alert('Contextual array cleared.'); }} 
                  className="mt-3 md:mt-0 bg-[#0A0A0A] border border-white/10 hover:bg-white/5 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs transition-all tracking-wide"
                >
                  Execute
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-[#050505] rounded-2xl border border-amber-500/10 hover:border-amber-500/30 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">Delete Analytics Dashboard</h3>
                  <p className="text-[11px] text-amber-500/70 mt-1 uppercase tracking-widest font-bold">Wipe Inference Histories</p>
                </div>
                <button 
                  onClick={() => clearData('eduGenExams', 'Exam Analytics')} 
                  className="mt-3 md:mt-0 bg-[#0A0A0A] border border-amber-500/20 hover:bg-amber-500/10 text-amber-400 font-bold px-5 py-2.5 rounded-xl text-xs transition-all tracking-wide"
                >
                  Execute
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-[#050505] rounded-2xl border border-rose-500/10 hover:border-rose-500/30 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">Terminate Conversational Memory</h3>
                  <p className="text-[11px] text-rose-500/70 mt-1 uppercase tracking-widest font-bold">Irreversible neural wipe</p>
                </div>
                <button 
                  onClick={() => clearData('eduGenChats', 'Chat History')} 
                  className="mt-3 md:mt-0 bg-[#0A0A0A] border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 font-bold px-5 py-2.5 rounded-xl text-xs transition-all tracking-wide shadow-lg shadow-rose-900/10"
                >
                  Execute
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
