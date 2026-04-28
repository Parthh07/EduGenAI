"use client";
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, MessageSquare, Timer, Layers, BarChart3, Settings, Home } from 'lucide-react';

const navItems = [
  { path: '/',           label: 'Home',       icon: Home,          color: 'slate' },
  { path: '/study',      label: 'Study',      icon: BookOpen,      color: 'indigo',  desc: 'Generate Q&A from your documents' },
  { path: '/exam',       label: 'Exam',       icon: Timer,         color: 'cyan',    desc: 'Timed AI-graded practice tests' },
  { path: '/chat',       label: 'Chat',       icon: MessageSquare, color: 'purple',  desc: 'Ask AI about your documents' },
  { path: '/flashcards', label: 'Flashcards', icon: Layers,        color: 'emerald', desc: 'Spaced repetition review' },
  { path: '/dashboard',  label: 'Analytics',  icon: BarChart3,     color: 'amber',   desc: 'Exam scores & progress' },
  { path: '/profile',    label: 'Settings',   icon: Settings,      color: 'slate',   desc: 'Account & data management' },
];

const colorMap = {
  slate:   { active: 'text-slate-700',     bg: 'bg-slate-100',     ring: 'ring-slate-200' },
  indigo:  { active: 'text-indigo-600',    bg: 'bg-indigo-50',     ring: 'ring-indigo-200' },
  cyan:    { active: 'text-cyan-600',      bg: 'bg-cyan-50',       ring: 'ring-cyan-200' },
  purple:  { active: 'text-purple-600',    bg: 'bg-purple-50',     ring: 'ring-purple-200' },
  emerald: { active: 'text-emerald-600',   bg: 'bg-emerald-50',    ring: 'ring-emerald-200' },
  amber:   { active: 'text-amber-600',     bg: 'bg-amber-50',      ring: 'ring-amber-200' },
};

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show on auth pages or landing page
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') return null;

  return (
    <>
      {/* ─── DESKTOP: Slim left sidebar ─── */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-[72px] bg-white/80 backdrop-blur-xl border-r border-slate-200/80 flex-col items-center py-5 z-[60] gap-1">
        {/* Logo */}
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 cursor-pointer shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
          onClick={() => router.push('/')}
          title="EduGen AI — Home"
        >
          <span className="text-white font-black text-sm">E</span>
        </div>

        {/* Nav Items */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {navItems.filter(n => n.path !== '/').map(({ path, label, icon: Icon, color, desc }) => {
            const isActive = pathname === path;
            const c = colorMap[color] || colorMap.slate;
            return (
              <button
                key={path}
                onClick={() => router.push(path)}
                title={`${label}${desc ? ` — ${desc}` : ''}`}
                className={`
                  relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group
                  ${isActive
                    ? `${c.bg} ${c.active} ring-1 ${c.ring} shadow-sm`
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-[100]">
                  {label}
                  {desc && <span className="block text-[10px] font-medium text-slate-500 mt-0.5">{desc}</span>}
                </div>
                {/* Active indicator bar */}
                {isActive && (
                  <div className={`absolute -left-[1px] top-2 bottom-2 w-[3px] rounded-full bg-current`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom label */}
        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center leading-tight mt-auto">
          Edu<br/>Gen
        </div>
      </nav>

      {/* ─── MOBILE: Bottom tab bar ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/80 z-[60] px-1 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {navItems.filter(n => n.path !== '/' && n.path !== '/profile').map(({ path, label, icon: Icon, color }) => {
            const isActive = pathname === path;
            const c = colorMap[color] || colorMap.slate;
            return (
              <button
                key={path}
                onClick={() => router.push(path)}
                className={`
                  flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all duration-200
                  ${isActive
                    ? `${c.active}`
                    : 'text-slate-400'
                  }
                `}
              >
                <div className={`relative p-1.5 rounded-lg transition-all ${isActive ? c.bg : ''}`}>
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[9px] font-bold tracking-wide ${isActive ? '' : 'text-slate-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
