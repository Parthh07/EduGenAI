"use client";
import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function EduGenHome() {
  const [file, setFile] = useState(null);
  const [marks, setMarks] = useState("10");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!file) return alert("Please select a file first!");
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('marks', marks);

    try {
      const res = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      // SUCCESS: This fills the empty UI boxes
      setResult(data); 
    } catch (err) {
      alert("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 selection:bg-blue-500/30">
      <main className="max-w-4xl mx-auto pt-10 pb-20">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">EduGen AI</h1>
          <p className="text-slate-400">Intelligent Study Material Generator</p>
        </header>

        <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl mb-10">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full mb-6 text-slate-400 file:bg-blue-600 file:text-white file:rounded-full file:border-0 file:px-6 file:py-2 cursor-pointer" />
          <div className="flex gap-4 mb-6 items-center">
            <label className="text-slate-300">Difficulty:</label>
            <select value={marks} onChange={(e) => setMarks(e.target.value)} className="bg-slate-800 border-slate-700 rounded-xl p-3 w-full outline-none focus:ring-2 focus:ring-blue-500">
              <option value="2">2 Marks (Short)</option>
              <option value="6">6 Marks (Standard)</option>
              <option value="10">10 Marks (Detailed)</option>
            </select>
          </div>
          <button onClick={handleProcess} disabled={loading} className="w-full bg-blue-600 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all active:scale-[0.98]">
            {loading ? "AI is Generating..." : "Generate Study Material"}
          </button>
        </div>

        {/* This section fixes the "No data received" issue */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full" /> Result
            </h2>
            <div className="space-y-6">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 tracking-widest">Question</h3>
                <p className="text-lg text-slate-200">{result.question || "No data received"}</p>
              </div>
              <div className="bg-blue-600/5 p-6 rounded-2xl border border-blue-500/20">
                <h3 className="text-xs font-semibold text-blue-400 uppercase mb-2 tracking-widest">Answer</h3>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result.answer || "No data received"}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}