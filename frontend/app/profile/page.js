"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const router = useRouter();
  const [userName, setUserName] = useState("Guest Student");
  const [email, setEmail] = useState("student@edugen.ai");

  useEffect(() => {
    const savedName = localStorage.getItem('eduGenName');
    const savedEmail = localStorage.getItem('eduGenEmail');
    if (savedName) setUserName(savedName);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleSave = () => {
    localStorage.setItem('eduGenName', userName);
    localStorage.setItem('eduGenEmail', email);
    alert("Profile settings saved successfully!");
  };

  const clearData = (key, name) => {
    if (confirm(`Are you sure you want to delete all ${name}? This action cannot be undone.`)) {
      localStorage.removeItem(key);
      alert(`${name} cleared successfully.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 selection:bg-blue-500/30 relative">
      <button 
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-2"
      >
        <span>&larr;</span> Back
      </button>

      <main className="max-w-3xl mx-auto pt-16 pb-20">
        <header className="mb-12 flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-slate-900">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-1">My Account</h1>
            <p className="text-slate-400">Manage your local profile and application data.</p>
          </div>
        </header>

        <div className="space-y-8">
          {/* Profile Details Section */}
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
              <span className="text-blue-400">👤</span> Profile Details
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Display Name</label>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md">
                Save Changes
              </button>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
              <span className="text-rose-400">⚙️</span> Data Management
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              EduGen AI stores all your personal data locally on your device for absolute privacy. Use the actions below if you wish to wipe your local application memory.
            </p>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div>
                  <h3 className="font-bold text-slate-200">Clear File Contexts</h3>
                  <p className="text-xs text-slate-500 mt-1">Removes any active PDFs from memory.</p>
                </div>
                <button 
                  onClick={() => { localStorage.removeItem('eduGenFileContexts'); alert('Cleared active contexts.'); }} 
                  className="mt-3 md:mt-0 bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Clear Files
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-amber-900/10 rounded-2xl border border-amber-900/30">
                <div>
                  <h3 className="font-bold text-amber-200">Reset Exam Analytics</h3>
                  <p className="text-xs text-amber-500/80 mt-1">Permanently deletes your entire Exam History and Dashboard scores.</p>
                </div>
                <button 
                  onClick={() => clearData('eduGenExams', 'Exam Analytics')} 
                  className="mt-3 md:mt-0 bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Wipe Analytics
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-rose-900/10 rounded-2xl border border-rose-900/30">
                <div>
                  <h3 className="font-bold text-rose-200">Delete Chat History</h3>
                  <p className="text-xs text-rose-500/80 mt-1">Permanently deletes all your saved conversations with the AI.</p>
                </div>
                <button 
                  onClick={() => clearData('eduGenChats', 'Chat History')} 
                  className="mt-3 md:mt-0 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-md shadow-rose-900/20"
                >
                  Delete Chats
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
