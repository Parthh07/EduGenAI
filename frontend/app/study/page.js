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
  const [files, setFiles] = useState(globalFiles || []);
  const [marks, setMarks] = useState("10");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const markdownComponents = {
    p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-300 last:mb-0 text-[15px]" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-300 marker:text-slate-500" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-300 marker:text-slate-500 font-mono text-sm" {...props} />,
    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
    h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-8 mb-4 text-white border-b border-white/10 pb-2 flex items-center gap-2" {...props}><span className="w-1.5 h-1.5 bg-white rounded-full inline-block"></span>{props.children}</h1>,
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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
        headers: { 'Authorization': `Bearer ${user?.token}` },
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
    <div className="min-h-screen bg-[#050505] text-white p-6 selection:bg-indigo-500/30 relative font-sans">
      
      {/* Sleek Minimal Background */}
      <div className="fixed top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050505] to-[#050505] pointer-events-none" />

      <button 
        onClick={() => router.push('/')}
        className="no-print absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-2 text-sm font-medium z-50"
      >
        <span>&larr;</span> Return Home
      </button>

      <main className="max-w-4xl mx-auto pt-16 pb-20 relative z-10">
        <header className="no-print text-center mb-12">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">Study Synthesis</h1>
          <p className="text-slate-400 text-sm md:text-base font-medium">Upload textbooks to automatically generate structured flashcards and accurate concepts.</p>
        </header>

        <div className="no-print bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl shadow-2xl mb-10">
          
          {/* File Dropzone */}
          <div className="relative group rounded-3xl border border-dashed border-white/20 hover:border-indigo-500/50 hover:bg-indigo-500/[0.02] bg-[#050505] transition-all p-8 md:p-10 text-center flex flex-col items-center justify-center cursor-pointer mb-8 overflow-hidden min-h-[220px]">
            <input type="file" accept=".pdf" multiple onChange={(e) => {
              const fileArray = Array.from(e.target.files);
              const merged = [...files, ...fileArray];
              const unique = Array.from(new Set(merged.map(f => f.name))).map(n => merged.find(f => f.name === n));
              setFiles(unique);
              setGlobalFiles(unique);
            }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="" />
            
            {files.length === 0 ? (
              <>
                <svg className="w-8 h-8 text-indigo-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="text-lg font-bold text-slate-300 group-hover:text-indigo-400 transition-colors z-0">
                  Select Context Material
                </p>
                <p className="text-sm text-slate-500 mt-2 font-medium z-0">Drag and drop PDFs or click to browse</p>
              </>
            ) : (
              <div className="w-full relative z-20">
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{files.length} Document(s) Ready</span>
                  <button 
                    onClick={(e) => { e.preventDefault(); setFiles([]); setGlobalFiles([]); }} 
                    className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-[#0A0A0A] border border-white/10 p-4 rounded-2xl shadow-lg hover:border-indigo-500/50 transition-colors group/file relative z-30">
                       <svg className="w-6 h-6 text-indigo-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
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
                        className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover/file:opacity-100 cursor-pointer"
                        title="Remove file"
                      >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-widest">Detail Level</label>
            <select value={marks} onChange={(e) => setMarks(e.target.value)} className="bg-[#050505] border border-white/10 rounded-xl p-4 w-full text-slate-300 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
              <option value="2">Core Summary (2 Marks)</option>
              <option value="6">Standard (6 Marks)</option>
              <option value="10">Deep Conceptual (10 Marks)</option>
            </select>
          </div>
          
          <button onClick={handleProcess} disabled={loading} className="w-full bg-white text-black hover:bg-slate-200 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> : "Synthesize Focus Material"}
          </button>
        </div>

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 bg-[#0A0A0A] border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full" /> 
                Synthesis Render
              </h2>
              <div className="no-print flex gap-2 flex-wrap">
                <button onClick={() => router.push('/exam')} className="bg-[#050505] hover:bg-white/5 text-slate-300 font-medium text-xs px-4 py-2 rounded-lg transition-all border border-white/10">  Take Exam </button>
                <button onClick={() => window.print()} className="bg-[#050505] hover:bg-white/5 text-slate-300 font-medium text-xs px-4 py-2 rounded-lg transition-all border border-white/10"> Print </button>
                <button onClick={handleCopy} className="bg-[#050505] hover:bg-white/5 text-slate-300 font-medium text-xs px-4 py-2 rounded-lg transition-all border border-white/10"> {copied ? "Copied!" : "Copy"} </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#050505] p-6 md:p-8 rounded-2xl border border-white/5">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Target Question</h3>
                <p className="text-lg text-white font-medium leading-relaxed">{result.question || "No data received"}</p>
              </div>
              
              <div className="bg-[#050505] p-6 md:p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                <h3 className="text-xs font-bold text-indigo-400 uppercase mb-3 tracking-widest">Generated Solution</h3>
                <div className="markdown-body">
                  <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                    {result.answer || "No data received"}
                  </ReactMarkdown>
                </div>
              </div>

              {result.sources && (
                <div className="bg-indigo-500/5 p-5 rounded-xl border border-indigo-500/10 flex items-start gap-4">
                   <svg className="w-5 h-5 text-indigo-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <div>
                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Context Vectors</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-medium">{result.sources}</p>
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
