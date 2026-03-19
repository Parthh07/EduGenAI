"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalFile } from '../context/FileContext';

export const dynamic = 'force-dynamic';

export default function StudyMode() {
  const router = useRouter();
  const { globalFiles, setGlobalFiles } = useGlobalFile();
  const [files, setFiles] = useState(globalFiles || []);
  const [marks, setMarks] = useState("10");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Backspace' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleProcess = async () => {
    if (!files || files.length === 0) return alert("Please select at least one file first!");
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('marks', marks);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Server returned an error');
      }

      setResult(data); 
    } catch (err) {
      alert(`Error: ${err.message || 'Backend connection failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `Question:\n${result.question}\n\nAnswer:\n${result.answer}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const textToDownload = `Question:\n${result.question}\n\nAnswer:\n${result.answer}`;
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'EduGen_Study_Material.txt';
    link.click();
  };

  const handleReadAloud = () => {
    if (!result) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Generated Question: ${result.question}. Comprehensive Answer: ${result.answer}`);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportCSV = () => {
    if (!result) return;
    const csvContent = `"Question","Answer"\n"${result.question.replace(/"/g, '""')}","${result.answer.replace(/"/g, '""')}"`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'EduGen_Flashcard.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 selection:bg-blue-500/30 relative">
      <button 
        onClick={() => router.push('/')}
        className="no-print absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-2"
      >
        <span>&larr;</span> Back
      </button>

      <main className="max-w-4xl mx-auto pt-10 pb-20">
        <header className="no-print text-center mb-12">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">Study Material</h1>
          <p className="text-slate-400">Upload a PDF to generate highly-targeted Questions & Answers</p>
        </header>

        <div className="no-print bg-slate-900/40 border border-slate-800/80 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl mb-10 ring-1 ring-white/5">
          
          {/* File Dropzone */}
          <div className="relative group rounded-[2rem] border-2 border-dashed border-slate-700 hover:border-blue-500/50 bg-slate-800/20 hover:bg-slate-800/40 transition-all p-8 md:p-10 text-center flex flex-col items-center justify-center cursor-pointer mb-8 overflow-hidden min-h-[250px]">
            <input type="file" accept=".pdf" multiple onChange={(e) => {
              const fileArray = Array.from(e.target.files);
              const merged = [...files, ...fileArray];
              const unique = Array.from(new Set(merged.map(f => f.name))).map(n => merged.find(f => f.name === n));
              setFiles(unique);
              setGlobalFiles(unique);
            }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="" />
            
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300 z-0">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            
            {files.length === 0 ? (
              <>
                <p className="text-xl font-bold text-slate-300 group-hover:text-blue-400 transition-colors z-0">
                  Drag & Drop your PDFs here
                </p>
                <p className="text-sm text-slate-500 mt-2 font-medium z-0">or click to browse from your computer</p>
              </>
            ) : (
              <div className="w-full mt-2 relative z-20">
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{files.length} File(s) Ready</span>
                  <button 
                    onClick={(e) => { e.preventDefault(); setFiles([]); setGlobalFiles([]); }} 
                    className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-3 rounded-2xl shadow-lg hover:border-slate-500 transition-colors group/file relative z-30">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] flex-none shadow-inner border border-blue-400/20">
                        PDF
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <span className="text-sm font-bold text-slate-200 truncate pr-2">{file.name}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          const newFiles = files.filter((_, i) => i !== idx);
                          setFiles(newFiles);
                          setGlobalFiles(newFiles);
                        }}
                        className="text-slate-500 hover:text-red-400 p-2 rounded-full hover:bg-slate-800 transition-all opacity-0 group-hover/file:opacity-100 cursor-pointer"
                        title="Remove file"
                      >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-6 font-medium">+ Drop more files to append to context</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-8 pt-2">
            <div className="flex-1">
              <label className="block text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider">Select Difficulty</label>
              <select value={marks} onChange={(e) => setMarks(e.target.value)} className="bg-slate-950/50 border border-slate-700/80 rounded-2xl p-4 w-full text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner">
                <option value="2">Short Answer (2 Marks)</option>
                <option value="6">Standard (6 Marks)</option>
                <option value="10">Detailed Concept (10 Marks)</option>
              </select>
            </div>
          </div>
          
          <button onClick={handleProcess} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-5 rounded-2xl font-bold text-lg hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3">
            {loading ? (
              <><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating Magic...</>
            ) : "✨ Generate AI Study Material"}
          </button>
        </div>

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 bg-slate-900/60 border border-slate-800/80 p-8 md:p-10 rounded-[2.5rem] shadow-2xl ring-1 ring-white/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center gap-3">
                <span className="w-2.5 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" /> 
                Discovery Result
              </h2>
              <div className="no-print flex gap-2 flex-wrap">
                <button onClick={() => router.push('/exam')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-sm px-5 py-2.5 rounded-xl transition-all border border-emerald-500/20">
                  ⏱️ Take Exam
                </button>
                <button onClick={() => window.print()} className="bg-slate-800/80 hover:bg-slate-700 font-medium text-slate-300 text-sm px-5 py-2.5 rounded-xl transition-all border border-slate-700/80">
                  🖨️ Print
                </button>
                <button onClick={handleCopy} className="bg-slate-800/80 hover:bg-slate-700 font-medium text-slate-300 text-sm px-5 py-2.5 rounded-xl transition-all border border-slate-700/80">
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </button>
                <button onClick={handleDownload} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-medium text-sm px-5 py-2.5 rounded-xl transition-all border border-blue-500/20">
                  💾 DL TXT
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-950/50 p-6 md:p-8 rounded-3xl border border-slate-800/80 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-700" />
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-[0.2em]">Generated Question</h3>
                <p className="text-xl text-slate-100 font-medium leading-relaxed">{result.question || "No data received"}</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/10 p-6 md:p-8 rounded-3xl border border-blue-800/30 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <h3 className="text-xs font-bold text-blue-400 uppercase mb-3 tracking-[0.2em]">Comprehensive Answer</h3>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-lg">{result.answer || "No data received"}</p>
              </div>

              {result.sources && (
                <div className="bg-emerald-950/30 p-5 rounded-2xl border border-emerald-900/50 flex items-start gap-4">
                  <div className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Source Reference</h3>
                    <p className="text-emerald-300/80 text-sm leading-relaxed font-medium">{result.sources}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
