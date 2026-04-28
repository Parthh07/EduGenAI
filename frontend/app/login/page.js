"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Lock, Sparkles, ArrowRight } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState(1);
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState(null);
  const [fpSuccess, setFpSuccess] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');
      login(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFpLoading(true);
    setFpError(null);
    try {
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setFpStep(2);
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFpError(null);
    if (fpNewPassword !== fpConfirmPassword) return setFpError('Passwords do not match.');
    if (fpNewPassword.length < 8) return setFpError('Password must be at least 8 characters.');
    setFpLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp, newPassword: fpNewPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setFpSuccess('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setShowForgot(false);
        setFpStep(1);
        setFpEmail(''); setFpOtp(''); setFpNewPassword(''); setFpConfirmPassword('');
        setFpSuccess(null);
      }, 2500);
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setFpStep(1);
    setFpEmail(''); setFpOtp(''); setFpNewPassword(''); setFpConfirmPassword('');
    setFpError(null); setFpSuccess(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFE] text-slate-900 flex flex-col justify-center items-center p-6 relative font-sans">
      
      {/* Background */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-[#FAFBFE] to-[#FAFBFE] pointer-events-none" />

      <button onClick={() => router.push('/')} className="absolute top-8 left-8 text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-2 font-medium z-50 text-sm">
        &larr; Return to Home
      </button>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/30 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[420px] bg-white border border-slate-200 p-8 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button onClick={closeForgot} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors text-xl leading-none">&times;</button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-none">
                <span className="text-indigo-600 text-base">🔐</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reset Password</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {fpStep === 1 ? 'Step 1 of 2 — Enter your email' : 'Step 2 of 2 — Enter OTP & new password'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <div className="h-1 flex-1 rounded-full bg-indigo-500" />
              <div className={`h-1 flex-1 rounded-full transition-all ${fpStep === 2 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            </div>

            {fpSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">✅</div>
                <p className="text-emerald-700 font-bold text-sm">{fpSuccess}</p>
              </div>
            ) : fpStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
                  <input
                    type="email" required
                    value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm"
                  />
                </div>
                {fpError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 text-center">{fpError}</p>}
                <button type="submit" disabled={fpLoading} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 text-sm">
                  {fpLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <>Send OTP <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
                <p className="text-center text-xs text-slate-400">A 6-digit OTP will be sent to your email (valid for 15 minutes).</p>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-indigo-600 text-xs">📧</span>
                  <p className="text-xs text-slate-500 font-medium">OTP sent to <span className="text-slate-900 font-bold">{fpEmail}</span></p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">6-Digit OTP</label>
                  <input
                    type="text" required maxLength={6}
                    value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm font-mono tracking-[0.4em] text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">New Password</label>
                  <input
                    type="password" required minLength={8}
                    value={fpNewPassword} onChange={e => setFpNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">Confirm Password</label>
                  <input
                    type="password" required
                    value={fpConfirmPassword} onChange={e => setFpConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm"
                  />
                </div>
                {fpError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 text-center">{fpError}</p>}
                <button type="submit" disabled={fpLoading} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 text-sm">
                  {fpLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <>Reset Password <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
                <button type="button" onClick={() => { setFpStep(1); setFpError(null); }} className="w-full text-slate-400 hover:text-slate-700 text-xs transition-colors">← Back to email</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="w-full max-w-[400px] bg-white border border-slate-200 p-10 rounded-3xl shadow-xl shadow-slate-200/50 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-6">
             <Lock className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-500 text-sm font-medium">Enter your credentials to access your workspace.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">Email address</label>
            <input 
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
              placeholder="name@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500">Password</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input 
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 mt-4 shadow-md shadow-indigo-500/20"
          >
            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm font-medium mt-8">
          Don't have an account? <a href="/signup" className="text-indigo-600 hover:text-indigo-700 transition-colors font-bold">Sign up</a>
        </p>
      </div>
    </div>
  );
}
