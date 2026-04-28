"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import { BookOpen, MessagesSquare, BarChart3, Timer, Menu, X, ArrowRight, ChevronDown, Sparkles, Layers, Zap, Shield, Globe } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import SpotlightCard from './components/SpotlightCard';

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
    <div className="bg-[#FAFBFE] text-slate-900 h-screen w-full font-sans selection:bg-indigo-500/20 overflow-hidden relative">
      
      {/* Subtle Background Gradient */}
      <div className="absolute top-0 inset-x-0 h-[700px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/80 via-[#FAFBFE] to-[#FAFBFE] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f108_1px,transparent_1px),linear-gradient(to_bottom,#6366f108_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Clean Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
             const box = document.getElementById('snap-container');
             if(box) box.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
             <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Sparkles className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-xl tracking-tight text-slate-900">EduGen AI</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Desktop Nav */}
             <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
                {user ? (
                  <>
                    <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
                    <Link href="/profile" className="hover:text-slate-900 transition-colors">Settings</Link>
                    <button onClick={logout} className="hover:text-slate-900 transition-colors">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="hover:text-slate-900 transition-colors">Login</Link>
                    <Link href="/signup" className="bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition-colors font-bold shadow-md shadow-indigo-500/20 inline-block">Sign Up</Link>
                  </>
                )}
             </div>

             {/* Mobile Hamburger Icon */}
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-slate-500 hover:text-slate-900 transition-colors">
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
              className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-200/60 overflow-hidden"
            >
              <div className="flex flex-col px-6 py-4 gap-4 text-sm font-medium text-slate-600">
                {user ? (
                  <>
                    <div className="text-slate-900 pb-2 border-b border-slate-100 font-bold">{user.username}</div>
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-left py-2 hover:text-slate-900 block">Dashboard</Link>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="text-left py-2 hover:text-slate-900 block">Settings</Link>
                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-left py-2 hover:text-slate-900 border-t border-slate-100 mt-2 pt-4">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-left py-2 hover:text-slate-900 block">Login</Link>
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="text-left py-2 text-indigo-600 font-bold block">Sign Up</Link>
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
          <motion.div initial="hidden" animate="show" variants={staggerContainer} className="flex flex-col items-center w-full max-w-5xl mx-auto text-center mt-8">
            
            <motion.a 
              variants={fadeUp}
              href="/exam"
              className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              EduGen AI Engine V3 is live <ArrowRight className="w-3 h-3" />
            </motion.a>

            <motion.h1 
              variants={fadeUp}
              className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.08] max-w-4xl text-slate-900"
            >
              Master your knowledge.<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500">Faster than ever.</span>
            </motion.h1>

            <motion.p 
              variants={fadeUp}
              className="mt-6 text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed"
            >
              The intelligent study toolkit. Synthesize massive PDFs, simulate timed exams, and chat natively with AI — all in one workspace.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
               <Link 
                 href={user ? '/study' : '/signup'}
                 className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/25 text-base active:scale-[0.98]"
               >
                 Launch Workspace <ArrowRight className="w-4 h-4 ml-2" />
               </Link>
               <button 
                 onClick={() => {
                     const box = document.getElementById('snap-container');
                     if(box) box.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
                 }}
                 className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 text-base group shadow-sm active:scale-[0.98]"
               >
                 View Features <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-y-1 transition-transform" />
               </button>
            </motion.div>

            {/* Social Proof Stats Bar */}
            <motion.div 
              variants={fadeUp}
              className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
            >
              {[
                { icon: <Zap className="w-4 h-4" />, text: "AI-Powered Grading" },
                { icon: <Shield className="w-4 h-4" />, text: "Cloud Synced" },
                { icon: <Globe className="w-4 h-4" />, text: "Access Anywhere" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <span className="text-indigo-400">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </motion.div>

          </motion.div>
          {/* Scroll Down Indicator */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center animate-bounce opacity-30 pointer-events-none">
             <ChevronDown className="w-6 h-6 text-slate-400" />
          </div>
        </section>

        {/* === SLIDE 2: FEATURES === */}
        <section className="min-h-screen w-full snap-start flex flex-col items-center justify-start px-4 md:px-6 py-16 md:py-20 relative shrink-0 bg-white">
          <div className="max-w-6xl mx-auto w-full">
            
            <div className="text-center mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-600 uppercase tracking-widest mb-5">
                <Sparkles className="w-3 h-3" /> Platform
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">Everything you need to learn</h2>
              <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto">Five powerful AI modules designed to accelerate your learning from upload to mastery.</p>
            </div>

            {/* Feature Cards — 2×3 balanced grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 w-full">
               
               {/* Feature 1 — Study */}
               <SpotlightCard>
                 <Link href="/study" className="group cursor-pointer p-7 md:p-8 transition-all flex flex-col h-full w-full block">
                   <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-5">
                     <BookOpen className="w-5 h-5 text-indigo-600" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">Study Synthesis</h3>
                   <p className="text-slate-500 mb-6 flex-1 text-sm leading-relaxed">Upload textbooks — generate Q&A, flashcards, and study material at any detail level.</p>
                   <div className="flex items-center text-indigo-600 text-sm font-bold transition-colors uppercase tracking-wider">
                     Open Synthesis <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </Link>
               </SpotlightCard>

               {/* Feature 2 — Exam */}
               <SpotlightCard spotlightColor="rgba(6, 182, 212, 0.15)">
                 <Link href="/exam" className="group cursor-pointer p-7 md:p-8 transition-all flex flex-col h-full w-full block">
                   <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-5">
                     <Timer className="w-5 h-5 text-cyan-600" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">Exam Simulator</h3>
                   <p className="text-slate-500 mb-6 flex-1 text-sm leading-relaxed">Timed MCQ and theory exams with AI grading — Easy, Medium, or Hard difficulty.</p>
                   <div className="flex items-center text-cyan-600 text-sm font-bold transition-colors uppercase tracking-wider">
                     Start Exam <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </Link>
               </SpotlightCard>

               {/* Feature 3 — Chat */}
               <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.15)">
                 <Link href="/chat" className="group cursor-pointer p-7 md:p-8 transition-all flex flex-col h-full w-full block">
                   <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center mb-5">
                     <MessagesSquare className="w-5 h-5 text-purple-600" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">Contextual AI Chat</h3>
                   <p className="text-slate-500 mb-6 flex-1 text-sm leading-relaxed">Chat with AI about your documents. Sessions saved to the cloud. Mermaid diagrams supported.</p>
                   <div className="flex items-center text-purple-600 text-sm font-bold transition-colors uppercase tracking-wider">
                     Open Chat <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </Link>
               </SpotlightCard>

               {/* Feature 4 — Flashcards */}
               <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.15)">
                 <Link href="/flashcards" className="group cursor-pointer p-7 md:p-8 transition-all flex flex-col h-full w-full block">
                   <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
                     <Layers className="w-5 h-5 text-emerald-600" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">Flashcard Review</h3>
                   <p className="text-slate-500 mb-6 flex-1 text-sm leading-relaxed">Spaced repetition system built on your saved Q&A cards. Again, Good, Easy — review smart.</p>
                   <div className="flex items-center text-emerald-600 text-sm font-bold transition-colors uppercase tracking-wider">
                     Review Cards <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </Link>
               </SpotlightCard>

               {/* Feature 5 — Dashboard */}
               <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.15)">
                 <Link href="/dashboard" className="group cursor-pointer p-7 md:p-8 transition-all flex flex-col h-full w-full block">
                   <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
                     <BarChart3 className="w-5 h-5 text-amber-600" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">Progress Analytics</h3>
                   <p className="text-slate-500 mb-6 flex-1 text-sm leading-relaxed">Score trends, study streaks, best scores, and full exam history — synced across devices.</p>
                   <div className="flex items-center text-amber-600 text-sm font-bold transition-colors uppercase tracking-wider">
                     View Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </Link>
               </SpotlightCard>

               {/* Feature 6 — CTA Card */}
               <SpotlightCard className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/20 border-0" spotlightColor="rgba(255,255,255,0.2)">
                 <Link href={user ? '/study' : '/signup'} className="group cursor-pointer p-7 md:p-8 transition-all flex flex-col h-full w-full justify-between hover:scale-[1.02] block">
                   <div>
                     <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-5">
                       <Sparkles className="w-5 h-5 text-white" />
                     </div>
                     <h3 className="text-lg font-bold text-white mb-2">Start Learning Now</h3>
                     <p className="text-indigo-200 mb-6 flex-1 text-sm leading-relaxed">Upload your first document and experience the full power of AI-assisted learning.</p>
                   </div>
                   <div className="flex items-center text-white text-sm font-bold transition-colors uppercase tracking-wider">
                     Get Started Free <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </Link>
               </SpotlightCard>

            </div>

            {/* Footer */}
            <footer className="w-full mt-12 md:mt-16 pb-6">
              <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-400">EduGen AI</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">© 2026 EduGen AI. Built for students, by students.</p>
                <div className="flex flex-col md:flex-row items-center gap-4 text-xs font-medium text-slate-400">
                  <Link href="/study" className="hover:text-slate-600 transition-colors">Study</Link>
                  <Link href="/exam" className="hover:text-slate-600 transition-colors">Exams</Link>
                  <Link href="/chat" className="hover:text-slate-600 transition-colors">Chat</Link>
                  <Link href="/flashcards" className="hover:text-slate-600 transition-colors">Flashcards</Link>
                </div>
              </div>
            </footer>

          </div>
        </section>

      </div>
    </div>
  );
}