"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const dynamic = 'force-dynamic';

export default function StudyMode() {
  const router = useRouter();
  const { globalFiles, setGlobalFiles } = useGlobalFile();
  const { user, loading: authLoading } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [files, setFiles] = useState(globalFiles || []);
  const [marks, setMarks] = useState("10");
  const [difficulty, setDifficulty] = useState("medium");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [savingCard, setSavingCard] = useState(false);

  // Document Summary feature
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('study'); // 'study' | 'summary'

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const markdownComponents = {
    p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-300 last:mb-0 text-[15px]" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-300 marker:text-slate-500" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-300 marker:text-slate-500 font-mono text-sm" {...props} />,
    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
    h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-8 mb-4 text-white border-b border-white/10 pb-2" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-6 mb-3 text-white tracking-widest uppercase text-xs" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-base font-bold mt-5 mb-2 text-slate-200" {...props} />,
    strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
    code: ({node, inline, className, children, ...props}) => {
      return inline
        ? <code className="bg-[#050505] text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono border border-white/10" {...props}>{children}</code>
        : <pre className="bg-[#050505] border border-white/10 p-5 rounded-2xl overflow-x-auto mb-5 shadow-inner"><code className="text-[13px] font-mono text-slate-300" {...props}>{children}</code></pre>;
    },
    blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-white/20 pl-4 py-1 my-5 bg-white/[0.02] text-slate-400 italic rounded-r-lg text-sm" {...props} />
  };

  const handleProcess = async () => {
    if (!files || files.length === 0) return alert("Please select at least one file first!");
    setLoading(true);
    setResult(null);

    try {
      // 1. Upload exactly once using our new File API proxy
      const upData = new FormData();
      files.forEach(f => upData.append('files', f));
      
      const upRes = await fetch(`${apiUrl}/api/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
        body: upData
      });
      if (!upRes.ok) {
        const d = await upRes.json();
        throw new Error(d.error || "Failed to pre-process document.");
      }
      const upJson = await upRes.json();
      const activeUris = upJson.uris;

      // 2. Generate
      const reqBody = { marks, difficulty, fileContextUris: JSON.stringify(activeUris) };
      const res = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server returned an error');
      setResult(data);
    } catch (err) {
      alert(`Error: ${err.message || 'Backend connection failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!files || files.length === 0) return showToast('Please select at least one file first!', 'error');
    setSummaryLoading(true);
    setSummary(null);
    try {
      const upData = new FormData();
      files.forEach(f => upData.append('files', f));
      const upRes = await fetch(`${apiUrl}/api/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` },
        body: upData
      });
      if (!upRes.ok) { const d = await upRes.json(); throw new Error(d.error || 'Upload failed.'); }
      const { uris } = await upRes.json();

      const body = new FormData();
      body.append('fileContextUris', JSON.stringify(uris));
      const res = await fetch(`${apiUrl}/api/summarize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` },
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Summarization failed.');
      setSummary(data.summary);
    } catch (e) {
      showToast(e.message || 'Summarization failed.', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Question:\n${result.question}\n\nAnswer:\n${result.answer}${result.explanation ? `\n\nExplanation:\n${result.explanation}` : ''}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([`Question:\n${result.question}\n\nAnswer:\n${result.answer}${result.explanation ? `\n\nExplanation:\n${result.explanation}` : ''}`], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'EduGen_Study_Material.txt';
    link.click();
  };

  const handleReadAloud = () => {
    if (!result) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Question: ${result.question}. Answer: ${result.answer}. ${result.explanation ? `Explanation: ${result.explanation}` : ''}`);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    showToast('Reading aloud…');
  };

  const handleExportCSV = () => {
    if (!result) return;
    const csvContent = `"Question","Answer"\n"${result.question.replace(/"/g, '""')}","${result.answer.replace(/"/g, '""')}"`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'EduGen_Flashcard.csv';
    link.click();
    showToast('CSV exported!');
  };

  const handleSaveFlashcard = async () => {
    if (!result || !user) return;
    setSavingCard(true);
    try {
      const res = await fetch(`${apiUrl}/api/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ question: result.question, answer: result.answer, source: result.sources || '' })
      });
      if (res.ok) {
        showToast('✓ Saved to Flashcards!');
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to save', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingCard(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 selection:bg-indigo-500/30 relative font-sans">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl border transition-all animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
          {toast.msg}
        </div>
      )}

      <div className="fixed top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050505] to-[#050505] pointer-events-none" />



      <main className="max-w-4xl mx-auto pt-16 pb-20 relative z-10">
        <header className="no-print text-center mb-12">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">Study Synthesis</h1>
          <p className="text-slate-400 text-sm md:text-base font-medium">Upload textbooks to automatically generate structured Q&A and save flashcards.</p>
        </header>

        {/* Mode Tab Switcher */}
        <div className="no-print flex rounded-2xl bg-[#0A0A0A] border border-white/10 p-1 mb-8">
          {[{key:'study', label:'📚 Study Q&A'}, {key:'summary', label:'📋 AI Summary'}].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-black shadow-sm'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="no-print bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl shadow-2xl mb-10">
          
          {/* File Dropzone */}
          <div className="relative group rounded-3xl border border-dashed border-white/20 hover:border-indigo-500/50 hover:bg-indigo-500/[0.02] bg-[#050505] transition-all p-8 md:p-10 text-center flex flex-col items-center justify-center cursor-pointer mb-8 overflow-hidden min-h-[200px]">
            <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" multiple onChange={(e) => {
              const fileArray = Array.from(e.target.files);
              const merged = [...files, ...fileArray];
              const unique = Array.from(new Set(merged.map(f => f.name))).map(n => merged.find(f => f.name === n));
              setFiles(unique); setGlobalFiles(unique);
            }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="" />
            
            {files.length === 0 ? (
              <>
                <svg className="w-8 h-8 text-indigo-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-lg font-bold text-slate-300 group-hover:text-indigo-400 transition-colors z-0">Select Context Material</p>
                <p className="text-sm text-slate-500 mt-2 font-medium z-0">PDF, JPG, PNG or WEBP — drag & drop or click to browse</p>
              </>
            ) : (
              <div className="w-full relative z-20">
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{files.length} Document(s) Ready</span>
                  <button onClick={(e) => { e.preventDefault(); setFiles([]); setGlobalFiles([]); }} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer">Clear All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-[#0A0A0A] border border-white/10 p-4 rounded-2xl shadow-lg hover:border-indigo-500/50 transition-colors group/file relative z-30">
                      <svg className="w-6 h-6 text-indigo-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <span className="text-sm font-bold text-slate-200 truncate pr-2">{file.name}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); const nf = files.filter((_, i) => i !== idx); setFiles(nf); setGlobalFiles(nf); }} className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover/file:opacity-100 cursor-pointer" title="Remove">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls Row — only for Study Q&A tab */}
          {activeTab === 'study' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-widest">Detail Level</label>
                  <select value={marks} onChange={(e) => setMarks(e.target.value)} className="bg-[#050505] border border-white/10 rounded-xl p-4 w-full text-slate-300 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                    <option value="2">Core Summary (2 Marks)</option>
                    <option value="6">Standard (6 Marks)</option>
                    <option value="10">Deep Conceptual (10 Marks)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-widest">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="bg-[#050505] border border-white/10 rounded-xl p-4 w-full text-slate-300 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                    <option value="easy">Easy — Beginner</option>
                    <option value="medium">Medium — Intermediate</option>
                    <option value="hard">Hard — Advanced</option>
                  </select>
                </div>
              </div>
              <button onClick={handleProcess} disabled={loading} className="w-full bg-white text-black hover:bg-slate-200 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Synthesize Focus Material"}
              </button>
            </>
          )}

          {/* Summary Tab Button */}
          {activeTab === 'summary' && (
            <button onClick={handleSummarize} disabled={summaryLoading} className="w-full bg-white text-black hover:bg-slate-200 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {summaryLoading
                ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Generating AI Summary…</>
                : '📋 Generate Document Summary'
              }
            </button>
          )}
        </div>

        {result && activeTab === 'study' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 bg-[#0A0A0A] border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full" />
                Synthesis Result
              </h2>
              <div className="no-print flex flex-col gap-3 w-full md:w-auto">
                {/* Primary Action */}
                <div className="flex gap-2">
                  <button onClick={handleSaveFlashcard} disabled={savingCard} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all border border-indigo-500/50 disabled:opacity-60 flex items-center gap-2 shadow-md shadow-indigo-900/30">
                    {savingCard ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>} Save as Flashcard
                  </button>
                  <button onClick={handleReadAloud} title="Read aloud" className="bg-[#050505] hover:bg-white/5 text-slate-300 font-bold text-sm px-4 py-2.5 rounded-xl transition-all border border-white/10 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    Read Aloud
                  </button>
                </div>
                {/* Export Actions */}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest self-center mr-1">Export:</span>
                  <button onClick={handleCopy} title="Copy to clipboard" className="bg-[#050505] hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all border border-white/10 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={handleDownload} title="Download as text file" className="bg-[#050505] hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all border border-white/10 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Text File
                  </button>
                  <button onClick={handleExportCSV} title="Export as CSV for Anki/Quizlet" className="bg-[#050505] hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all border border-white/10 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    CSV
                  </button>
                  <button onClick={() => window.print()} title="Print this page" className="bg-[#050505] hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all border border-white/10 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#050505] p-6 md:p-8 rounded-2xl border border-white/5">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Question</h3>
                <p className="text-lg text-white font-medium leading-relaxed">{result.question || "No data received"}</p>
              </div>
              
              <div className="bg-[#050505] p-6 md:p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                <h3 className="text-xs font-bold text-indigo-400 uppercase mb-3 tracking-widest">Answer</h3>
                <div className="markdown-body">
                  <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                    {result.answer || "No data received"}
                  </ReactMarkdown>
                </div>
              </div>

              {result.explanation && (
                <div className="bg-[#050505] p-6 md:p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase mb-3 tracking-widest">Explanation</h3>
                  <div className="markdown-body">
                    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                      {result.explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {result.sources && (
                <div className="bg-indigo-500/5 p-5 rounded-xl border border-indigo-500/10 flex items-start gap-4">
                  <svg className="w-5 h-5 text-indigo-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Source</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-medium">{result.sources}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Result */}
        {summary && activeTab === 'summary' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 bg-[#0A0A0A] border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-amber-500 rounded-full" />
                AI Document Summary
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(summary); setSummaryCopied(true); setTimeout(() => setSummaryCopied(false), 2000); }}
                  className="bg-[#050505] hover:bg-white/5 text-slate-300 font-medium text-xs px-4 py-2 rounded-lg transition-all border border-white/10"
                >
                  {summaryCopied ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => { const blob = new Blob([summary], {type:'text/plain'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'EduGen_Summary.txt'; a.click(); }}
                  className="bg-[#050505] hover:bg-white/5 text-slate-300 font-medium text-xs px-4 py-2 rounded-lg transition-all border border-white/10"
                >
                  ⬇ Download
                </button>
              </div>
            </div>
            <div className="bg-[#050505] p-6 md:p-8 rounded-2xl border border-white/5 markdown-body">
              <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                {summary}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
