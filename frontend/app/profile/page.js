"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Load real profile from DB
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/me/profile`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.username || user.username || '');
          setEmail(data.email || user.email || '');
        }
      } catch {
        setUserName(user.username || '');
        setEmail(user.email || '');
      }
    };
    loadProfile();
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveEmail = async () => {
    if (!email.trim()) return showToast('Email cannot be empty.', 'error');
    setSaveLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/me/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Email updated successfully!');
        // Update localStorage cache
        localStorage.setItem('edugen_email', email.trim());
      } else {
        showToast(data.error || 'Update failed.', 'error');
      }
    } catch {
      showToast('Network error. Try again.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClearExams = async () => {
    if (!confirm('Delete all exam history from the database? This cannot be undone.')) return;
    try {
      const res = await fetch(`${apiUrl}/api/me/exams`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) showToast('Exam history cleared from database.');
      else showToast('Failed to clear exam history.', 'error');
    } catch {
      showToast('Network error.', 'error');
    }
  };

  const handleClearChats = async () => {
    if (!confirm('Delete all chat sessions from the database? This cannot be undone.')) return;
    try {
      const res = await fetch(`${apiUrl}/api/chat/sessions/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        localStorage.removeItem('eduGenChats');
        showToast('All chat sessions cleared.');
      } else {
        showToast('Failed to clear chat sessions.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
  };

  const handleClearFlashcards = async () => {
    if (!confirm('Delete ALL flashcards? This cannot be undone.')) return;
    try {
      // Delete all one by one isn't ideal — for now we note this limitation
      // A batch delete endpoint would need to be added for a cleaner UX
      showToast('Please delete cards individually from the Flashcards page.', 'error');
    } catch {
      showToast('Error.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFE] text-slate-900 p-6 selection:bg-indigo-500/20 relative font-sans">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3 rounded-2xl font-bold text-sm shadow-lg border transition-all animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {toast.msg}
        </div>
      )}

      <div className="fixed top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-[#FAFBFE] to-[#FAFBFE] pointer-events-none z-0" />




      <main className="max-w-3xl mx-auto pt-16 pb-20 relative z-10">
        <header className="mb-12 flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-indigo-200 font-black text-indigo-600">
            {(userName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Account Settings</h1>
            <p className="text-slate-500 text-sm font-medium">Manage your profile and data.</p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Profile Details */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-slate-100 pb-3">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" /> Profile Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Username</label>
                <input type="text" value={userName} disabled
                  className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl px-4 py-3.5 outline-none font-medium cursor-not-allowed text-sm" />
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Username cannot be changed after registration.</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm" />
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleSaveEmail} disabled={saveLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md shadow-indigo-500/20 text-sm disabled:opacity-60 flex items-center gap-2">
                  {saveLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  Save Email
                </button>
                <button onClick={logout} className="bg-slate-50 hover:bg-red-50 text-rose-600 border border-slate-200 hover:border-red-200 font-bold py-3.5 px-8 rounded-xl transition-all text-sm">
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase tracking-widest border-b border-slate-100 pb-3">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" /> Data Management
            </h2>
            <p className="text-slate-500 text-[13px] mb-8 leading-relaxed font-medium mt-3">
              Permanently delete your data from the database. These actions cannot be undone.
            </p>
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-amber-50 rounded-2xl border border-amber-200 hover:border-amber-300 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Delete Exam History</h3>
                  <p className="text-[11px] text-amber-600 mt-1 uppercase tracking-widest font-bold">Removes all exam scores from database</p>
                </div>
                <button onClick={handleClearExams} className="mt-3 md:mt-0 bg-white border border-amber-300 hover:bg-amber-100 text-amber-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-all tracking-wide">
                  Delete
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-red-50 rounded-2xl border border-red-200 hover:border-red-300 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Delete All Chat Sessions</h3>
                  <p className="text-[11px] text-rose-600 mt-1 uppercase tracking-widest font-bold">Removes all chat history from database</p>
                </div>
                <button onClick={handleClearChats} className="mt-3 md:mt-0 bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-all tracking-wide">
                  Delete
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Manage Flashcards</h3>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Delete individual cards from review page</p>
                </div>
                <button onClick={() => router.push('/flashcards')} className="mt-3 md:mt-0 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-xs transition-all tracking-wide">
                  Go to Flashcards
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
