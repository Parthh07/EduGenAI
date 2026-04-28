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
    <div className="min-h-screen bg-[#FAFBFE] text-slate-900 flex flex-col justify-center items-center p-6 relative font-sans">
      
      <div className="absolute top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-100/60 via-[#FAFBFE] to-[#FAFBFE] pointer-events-none" />

      <button onClick={() => router.push('/login')} className="absolute top-8 left-8 text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-2 font-medium z-50 text-sm">
        &larr; Back to Login
      </button>

      <div className="w-full max-w-[400px] bg-white border border-slate-200 p-10 rounded-3xl shadow-xl shadow-slate-200/50 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-6">
             <ShieldCheck className="w-6 h-6 text-cyan-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Create Account</h1>
          <p className="text-slate-500 text-sm font-medium">Join EduGen AI to start studying smarter.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
           <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">Username</label>
            <input 
              type="text" required
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
              placeholder="e.g. DeveloperParth"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">Email address</label>
            <input 
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
              placeholder="name@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">Password</label>
            <input 
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
              placeholder="Create a strong password"
            />
          </div>
          
          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-cyan-600 text-white hover:bg-cyan-700 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 mt-4 shadow-md shadow-cyan-500/20"
          >
            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <>Sign Up <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm font-medium mt-8">
          Already have an account? <a href="/login" className="text-indigo-600 hover:text-indigo-700 transition-colors font-bold">Log in</a>
        </p>
      </div>
    </div>
  );
}
