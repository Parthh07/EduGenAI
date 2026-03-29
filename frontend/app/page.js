"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { BookOpen, MessagesSquare, BarChart3, Timer, Menu, X, ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScroll = (e) => {
    setScrolled(e.target.scrollTop > 20);
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="bg-[#050505] text-white h-screen w-full font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Subtle Background Glow fixed behind the scroller */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050505] to-[#050505] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Clean Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-[#050505]/80 backdrop-blur-md border-b border-white/5" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
             const box = document.getElementById('snap-container');
             if(box) box.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
             <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
               <Sparkles className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-xl tracking-tight text-white">EduGen AI</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Desktop Nav */}
             <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                {user ? (
                  <>
                    <button onClick={() => router.push('/dashboard')} className="hover:text-white transition-colors">Dashboard</button>
                    <button onClick={() => router.push('/profile')} className="hover:text-white transition-colors">Settings</button>
                    <button onClick={logout} className="hover:text-white transition-colors">Sign Out</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Login</button>
                    <button onClick={() => router.push('/signup')} className="bg-white text-black px-5 py-2 rounded-full hover:bg-slate-200 transition-colors font-bold shadow-md hover:shadow-white/10">Sign Up</button>
                  </>
                )}
             </div>

             {/* Mobile Hamburger Icon */}
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-slate-300 hover:text-white transition-colors">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[#0a0a0a] border-b border-white/5 overflow-hidden"
            >
              <div className="flex flex-col px-6 py-4 gap-4 text-sm font-medium text-slate-300">
                {user ? (
                  <>
                    <div className="text-white pb-2 border-b border-white/5">{user.username}</div>
                    <button onClick={() => { router.push('/dashboard'); setIsMenuOpen(false); }} className="text-left py-2 hover:text-white">Dashboard</button>
                    <button onClick={() => { router.push('/profile'); setIsMenuOpen(false); }} className="text-left py-2 hover:text-white">Settings</button>
                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-left py-2 hover:text-white border-t border-white/5 mt-2 pt-4">Sign Out</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { router.push('/login'); setIsMenuOpen(false); }} className="text-left py-2 hover:text-white">Login</button>
                    <button onClick={() => { router.push('/signup'); setIsMenuOpen(false); }} className="text-left py-2 text-white">Sign Up</button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* FULL-SCREEN VERTICAL SNAP SLIDER */}
      <div 
        id="snap-container" 
        onScroll={handleScroll}
        className="h-screen w-full overflow-y-auto snap-y snap-mandatory relative z-10 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        
        {/* === SLIDE 1: HERO === */}
        <section className="h-screen w-full snap-start flex flex-col items-center justify-center px-6 relative shrink-0">
          <motion.div initial="hidden" animate="show" variants={staggerContainer} className="flex flex-col items-center w-full max-w-5xl mx-auto text-center mt-12">
            
            <motion.a 
              variants={fadeUp}
              href="/exam"
              className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-sm font-medium text-indigo-300 hover:text-white hover:bg-indigo-500/20 transition-colors"
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
              EduGen AI Engine V3 is live <ArrowRight className="w-3 h-3" />
            </motion.a>

            <motion.h1 
              variants={fadeUp}
              className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.1] max-w-4xl"
            >
              Master your knowledge.<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Faster than ever.</span>
            </motion.h1>

            <motion.p 
              variants={fadeUp}
              className="mt-6 text-xl text-slate-300 max-w-2xl leading-relaxed font-medium"
            >
              The intelligent study toolkit. Synthesize massive PDFs, simulate timed exams, and chat natively with AI about your personal context.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
               <button 
                 onClick={() => router.push(user ? '/dashboard' : '/signup')}
                 className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-500 transition-colors flex items-center justify-center shadow-lg shadow-indigo-500/25 text-base"
               >
                 Launch Workspace
               </button>
               <button 
                 onClick={() => {
                     const box = document.getElementById('snap-container');
                     if(box) box.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
                 }}
                 className="w-full sm:w-auto bg-white/[0.03] border border-white/10 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-base group"
               >
                 View Features <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-y-1 transition-transform" />
               </button>
            </motion.div>

          </motion.div>
          {/* Scroll Down Indicator */}
          <div className="absolute bottom-10 inset-x-0 flex justify-center animate-bounce opacity-50 pointer-events-none">
             <ChevronDown className="w-6 h-6 text-white" />
          </div>
        </section>

        {/* === SLIDE 2: FEATURES === */}
        <section className="min-h-screen w-full snap-start flex flex-col items-center justify-center px-4 md:px-6 py-20 relative shrink-0 bg-[#050505]">
          <div className="max-w-6xl mx-auto w-full">
            
            <div className="text-center mb-10 md:mb-14">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">Core Capabilities</h2>
              <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-medium">Four powerful AI modules designed to accelerate your learning.</p>
            </div>

            {/* Tight 2x2 Grid optimized for single viewport height on desktop */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 w-full">
               
               {/* Feature 1 */}
               <div 
                onClick={() => router.push('/study')}
                className="group cursor-pointer bg-[#0A0A0A] border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] p-6 md:p-8 rounded-[1.5rem] transition-all flex flex-col h-full shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
                  <BookOpen className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Study Synthesis</h3>
                <p className="text-slate-400 mb-6 flex-1 text-sm md:text-base leading-relaxed font-medium">Upload massive document textbooks and let the AI generate perfect flashcards and Q&A sets automatically.</p>
                <div className="flex items-center text-indigo-400 group-hover:text-indigo-300 text-sm font-bold transition-colors uppercase tracking-wider">
                  Open Synthesis <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Feature 2 */}
              <div 
                onClick={() => router.push('/exam')}
                className="group cursor-pointer bg-[#0A0A0A] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/[0.02] p-6 md:p-8 rounded-[1.5rem] transition-all flex flex-col h-full shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
                  <Timer className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Exam Simulation</h3>
                <p className="text-slate-400 mb-6 flex-1 text-sm md:text-base leading-relaxed font-medium">Test your knowledge with strictly timed, AI-generated multiple choice and theoretical exams.</p>
                <div className="flex items-center text-cyan-400 group-hover:text-cyan-300 text-sm font-bold transition-colors uppercase tracking-wider">
                  Start Exam <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Feature 3 */}
              <div 
                onClick={() => router.push('/chat')}
                className="group cursor-pointer bg-[#0A0A0A] border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/[0.02] p-6 md:p-8 rounded-[1.5rem] transition-all flex flex-col h-full shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
                  <MessagesSquare className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Contextual AI Chat</h3>
                <p className="text-slate-400 mb-6 flex-1 text-sm md:text-base leading-relaxed font-medium">Discuss study material dynamically with the AI. Includes full robust Mermaid architecture diagram rendering.</p>
                <div className="flex items-center text-purple-400 group-hover:text-purple-300 text-sm font-bold transition-colors uppercase tracking-wider">
                  Open Chat <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Feature 4 */}
              <div 
                onClick={() => router.push('/dashboard')}
                className="group cursor-pointer bg-[#0A0A0A] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] p-6 md:p-8 rounded-[1.5rem] transition-all flex flex-col h-full shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                  <BarChart3 className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Progress Analytics</h3>
                <p className="text-slate-400 mb-6 flex-1 text-sm md:text-base leading-relaxed font-medium">Track all your past chat sessions and exam attempts securely within your personal encrypted dashboard.</p>
                <div className="flex items-center text-emerald-400 group-hover:text-emerald-300 text-sm font-bold transition-colors uppercase tracking-wider">
                  View Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>

            <footer className="w-full flex justify-center opacity-60 mt-12 md:mt-16 pb-4">
              <p className="text-xs md:text-sm font-medium text-slate-400 tracking-wide">© 2026 EduGen AI. Designed for knowledge.</p>
            </footer>

          </div>
        </section>

      </div>
    </div>
  );
}