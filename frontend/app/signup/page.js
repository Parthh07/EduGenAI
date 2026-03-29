"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Signup() {
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Internal validation error');
      
      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center p-6 relative font-sans">
      
      {/* Sleek Minimal Background */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#050505] to-[#050505] pointer-events-none" />

      <button onClick={() => router.push('/login')} className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-medium z-50 text-sm">
        &larr; Back to Login
      </button>

      <div className="w-full max-w-[400px] bg-[#0A0A0A] border border-white/10 p-10 rounded-3xl shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
             <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm font-medium">Join EduGen AI to start studying smarter.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
           <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <input 
              type="text" required
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
              placeholder="e.g. DeveloperParth"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Email address</label>
            <input 
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
              placeholder="name@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <input 
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
              placeholder="Create a strong password"
            />
          </div>
          
          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-cyan-600 text-white hover:bg-cyan-500 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
          >
            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <>Sign Up <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm font-medium mt-8">
          Already have an account? <a href="/login" className="text-white hover:text-cyan-400 transition-colors">Log in</a>
        </p>
      </div>
    </div>
  );
}
