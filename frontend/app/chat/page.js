"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MermaidBlock = ({ code }) => {
  const ref = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    import('mermaid').then((mermaid) => {
      mermaid.default.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
      mermaid.default.render(`mermaid-svg-${Math.random().toString(36).substr(2, 9)}`, code)
        .then(({ svg }) => { if (ref.current) ref.current.innerHTML = svg; })
        .catch(err => { if (ref.current) ref.current.innerHTML = `<pre class="text-red-400 text-xs text-center p-4">Invalid flowchart. Try again.</pre>`; });
    });
  }, [code]);

  const handleDownload = () => {
    if (!ref.current) return;
    const svgElement = ref.current.querySelector('svg');
    if (!svgElement) return alert("SVG not ready. Please wait.");
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'EduGen_Flowchart.svg';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-10">
        <div className="w-full max-w-7xl flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Flowchart</h2>
          <div className="flex gap-3">
            <button onClick={handleDownload} className="bg-white text-black hover:bg-slate-200 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm">⬇ Download</button>
            <button onClick={() => setIsFullscreen(false)} className="bg-[#0A0A0A] hover:bg-white/5 px-5 py-2.5 rounded-xl font-bold text-slate-300 border border-white/10 text-sm">✕ Close</button>
          </div>
        </div>
        <div className="flex-1 w-full bg-[#050505] overflow-auto flex justify-center items-center border border-white/10 rounded-3xl p-10" dangerouslySetInnerHTML={{ __html: ref.current ? ref.current.innerHTML : '' }} />
      </div>
    );
  }

  return (
    <div className="relative group my-8">
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={() => setIsFullscreen(true)} className="bg-[#0A0A0A]/90 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-slate-300 flex items-center gap-2">⛶ Expand</button>
        <button onClick={handleDownload} className="bg-white hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-black flex items-center gap-2">⬇ Save</button>
      </div>
      <div className="mermaid-wrapper flex justify-center bg-[#050505] overflow-x-auto p-8 rounded-3xl border border-white/10 shadow-inner w-full min-h-[150px]" ref={ref} />
    </div>
  );
};

export default function ChatMode() {
  const router = useRouter();
  const { globalFiles, setGlobalFiles } = useGlobalFile();
  const { user, loading: authLoading } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [files, setFiles] = useState(globalFiles || []);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [fileContextUris, setFileContextUris] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Load sessions from DB on mount
  const loadSessions = useCallback(async () => {
    if (!user) return;
    setSessionsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) setSessions(await res.json());
    } catch {
      // fall back to localStorage
      const saved = JSON.parse(localStorage.getItem('eduGenChats') || '[]');
      setSessions(saved);
    } finally {
      setSessionsLoading(false);
    }
  }, [user, apiUrl]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const saveSessionToDB = useCallback(async (sessionId, title, msgs) => {
    if (!user || !sessionId) return;
    try {
      await fetch(`${apiUrl}/api/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ id: sessionId, title, messages: msgs })
      });
    } catch { /* silent fail */ }
  }, [user, apiUrl]);

  const deleteSession = async (sessionId) => {
    try {
      await fetch(`${apiUrl}/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch { /* silent */ }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null); setMessages([]);
    }
  };

  const loadSession = (session) => {
    setMessages(session.messages);
    setActiveSessionId(session.id);
    setFiles([]); setGlobalFiles([]);
    setFileContextUris([]);
    setSidebarOpen(false);
  };

  const startNewChat = () => {
    setActiveSessionId(null); setMessages([]); setFiles([]); setGlobalFiles([]);
    setFileContextUris([]);
    setSidebarOpen(false);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || files.length === 0) return alert("Please upload a document and enter a question.");
    
    const userMsg = input.trim();
    setInput("");
    const newHistory = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setLoading(true);

    let currentSessionId = activeSessionId;
    let sessionTitle = files.length > 0 ? files[0].name.substring(0, 40) : userMsg.substring(0, 40);
    if (!currentSessionId) {
      currentSessionId = Date.now().toString();
      setActiveSessionId(currentSessionId);
    }

    let activeUris = fileContextUris;

    if (activeUris.length === 0 && files.length > 0) {
      try {
        const upData = new FormData();
        files.forEach(f => upData.append('files', f));
        const upRes = await fetch(`${apiUrl}/api/files/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${user?.token}` },
          body: upData
        });
        if (!upRes.ok) throw new Error("Failed to cache documents on server");
        const upJson = await upRes.json();
        activeUris = upJson.uris;
        setFileContextUris(activeUris);
      } catch (err) {
        alert("Upload Error: " + err.message);
        setMessages(messages);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          message: userMsg,
          history: JSON.stringify(messages),
          fileContextUris: JSON.stringify(activeUris)
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to connect to AI");
      }
      const data = await res.json();
      const finalMessages = [...newHistory, { role: 'assistant', content: data.reply }];
      setMessages(finalMessages);

      // Save to DB + update sessions list
      await saveSessionToDB(currentSessionId, sessionTitle, finalMessages);
      setSessions(prev => {
        const existing = prev.find(s => s.id === currentSessionId);
        if (existing) {
          return prev.map(s => s.id === currentSessionId ? { ...s, messages: finalMessages } : s);
        }
        return [{ id: currentSessionId, title: sessionTitle, messages: finalMessages, date: new Date().toISOString() }, ...prev];
      });
    } catch (err) {
      alert("Error: " + err.message);
      setMessages(messages);
    } finally {
      setLoading(false);
    }
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
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match && match[1] === 'mermaid') return <MermaidBlock code={String(children).replace(/\n$/, '')} />;
      return inline
        ? <code className="bg-[#050505] text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono border border-white/10" {...props}>{children}</code>
        : <pre className="bg-[#050505] border border-white/10 p-5 rounded-2xl overflow-x-auto mb-5 shadow-inner"><code className="text-[13px] font-mono text-slate-300" {...props}>{children}</code></pre>;
    },
    blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-white/20 pl-4 py-1 my-5 bg-white/[0.02] text-slate-400 italic rounded-r-lg text-sm" {...props} />
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 h-screen flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[80] md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-[#0A0A0A] border-r border-white/10 p-5 flex flex-col z-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chat History</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white transition">✕</button>
            </div>
            {/* Context */}
            {files.length > 0 ? (
              <div className="bg-[#050505] border border-white/10 p-3 rounded-xl flex justify-between items-center mb-4">
                <span className="text-slate-300 text-sm font-medium truncate">{files.length} Document(s) loaded</span>
                <button onClick={() => { setFiles([]); setGlobalFiles([]); setFileContextUris([]); }} className="text-slate-500 hover:text-red-400 transition p-1">✕</button>
              </div>
            ) : (
              <input type="file" multiple accept=".pdf,image/jpeg,image/png,image/webp" onChange={(e) => {
                const arr = [...files, ...Array.from(e.target.files)];
                setFiles(arr); setGlobalFiles(arr);
              }} className="text-xs text-slate-400 file:bg-white/5 file:text-slate-300 file:font-bold file:rounded-xl file:border-0 file:px-4 file:py-2.5 cursor-pointer w-full hover:file:bg-white/10 transition-all mb-4" />
            )}
            <button onClick={startNewChat} className="w-full bg-white text-black font-bold rounded-xl py-2.5 text-sm mb-4 hover:bg-slate-200 transition">+ New Chat</button>
            <div className="flex-1 overflow-y-auto space-y-2">
              {sessionsLoading && <p className="text-slate-600 text-xs px-2 pt-4 text-center">Loading…</p>}
              {!sessionsLoading && sessions.length === 0 && <p className="text-slate-600 text-xs font-medium px-2 mt-4">No history yet.</p>}
              {sessions.map((s) => (
                <div key={s.id} onClick={() => loadSession(s)} className={`p-3 rounded-xl cursor-pointer transition-all border group ${activeSessionId === s.id ? 'bg-[#050505] border-white/20 text-white' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5 text-slate-400'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium truncate flex-1">{s.title}</p>
                    <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs flex-none">✕</button>
                  </div>
                  <p className="text-[10px] opacity-60 font-mono tracking-widest uppercase mt-1">{new Date(s.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-[90rem] mx-auto flex justify-between items-center mb-4 flex-none">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white transition p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white transition flex items-center gap-2 text-sm font-medium h-10 px-4">
            <span>&larr;</span> Home
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" /> Context Chat
        </h1>
        <button onClick={startNewChat} className="bg-white hover:bg-slate-200 text-black font-bold h-10 px-5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg> New Chat
        </button>
      </div>

      <main className="w-full max-w-[90rem] mx-auto flex gap-4 flex-1 min-h-0 pb-2">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-72 lg:w-80 bg-[#0A0A0A] border border-white/10 rounded-3xl p-5 flex-col shadow-2xl overflow-hidden">
          <div className="flex-none mb-4">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Document Context</h2>
            {files.length > 0 ? (
              <div className="bg-[#050505] border border-white/10 p-3 rounded-xl flex justify-between items-center group shadow-inner">
                <span className="text-slate-300 text-sm font-medium truncate flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {files.length} Document(s)
                </span>
                <button onClick={() => { setFiles([]); setGlobalFiles([]); setFileContextUris([]); }} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1">✕</button>
              </div>
            ) : (
              <input type="file" multiple accept=".pdf,image/jpeg,image/png,image/webp" onChange={(e) => {
                const arr = [...files, ...Array.from(e.target.files)];
                setFiles(arr); setGlobalFiles(arr);
              }} className="text-xs text-slate-400 file:bg-white/5 file:text-slate-300 file:font-bold file:rounded-xl file:border-0 file:px-4 file:py-2.5 cursor-pointer w-full hover:file:bg-white/10 transition-all shadow-inner" />
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 sticky top-0 bg-[#0A0A0A]/90 py-2 backdrop-blur-md border-b border-white/5 z-10">History</h2>
            {sessionsLoading && <p className="text-slate-600 text-xs px-2 pt-2 text-center">Loading…</p>}
            {!sessionsLoading && sessions.length === 0 && <p className="text-slate-600 text-xs font-medium px-2 mt-4">No sessions yet.</p>}
            {sessions.map((s) => (
              <div key={s.id} onClick={() => loadSession(s)} className={`p-3 rounded-xl cursor-pointer transition-all border group ${activeSessionId === s.id ? 'bg-[#050505] border-white/20 text-white shadow-md' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5 text-slate-400'}`}>
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium truncate flex-1">{s.title}</p>
                  <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs flex-none">✕</button>
                </div>
                <p className="text-[10px] opacity-60 font-mono tracking-widest uppercase mt-1">{new Date(s.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
          
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 max-w-md mx-auto text-center">
                <div className="w-16 h-16 bg-[#050505] rounded-full border border-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <p className="text-sm font-medium leading-relaxed">Upload a document using the sidebar, then ask anything about its contents.</p>
                {/* Mobile upload shortcut */}
                <div className="md:hidden w-full bg-[#050505] p-4 rounded-2xl border border-white/5 shadow-inner">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Upload Document</p>
                  <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" multiple onChange={(e) => {
                    const arr = [...files, ...Array.from(e.target.files)];
                    setFiles(arr); setGlobalFiles(arr);
                  }} className="text-xs text-slate-400 file:bg-white/10 file:text-white file:font-bold file:rounded-xl file:border-0 file:px-4 file:py-2.5 cursor-pointer w-full" />
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center mr-3 mt-1 flex-none shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                )}
                <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-3xl shadow-md ${msg.role === 'user' ? 'bg-white text-black rounded-tr-sm font-medium' : 'bg-[#050505] text-slate-200 border border-white/10 rounded-tl-sm'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="markdown-body">
                      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap leading-relaxed text-[14px]">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center mr-3 mt-1 flex-none">
                  <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div className="bg-[#050505] border border-white/10 p-5 rounded-3xl rounded-tl-sm shadow-md flex items-center gap-1.5 h-[62px]">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}} />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-[#0A0A0A] border-t border-white/5 relative z-20">
            <div className="mb-3 flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
              <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10 bg-[#050505] px-3 py-1.5 rounded-full shadow-inner">
                <span className={`w-1.5 h-1.5 rounded-full ${files.length > 0 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-red-500"}`} />
                {files.length > 0 ? <span className="text-slate-300">{files.length} doc(s) loaded</span> : <span className="text-slate-500">No document</span>}
              </div>
              <button onClick={(e) => { e.preventDefault(); setInput("Please strictly analyze this document and generate a single, comprehensive flowchart mapping out its core sequential concepts. Output the graph using standard Mermaid.js syntax inside a ```mermaid code block. Do not use any special HTML characters in node names."); }}
                className="text-[11px] font-bold text-slate-300 bg-[#050505] hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest">
                ⟳ Generate Flowchart
              </button>
            </div>

            <form onSubmit={handleSend} className="relative flex items-center w-full">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading}
                placeholder={files.length === 0 ? "Upload a document first…" : "Ask anything about your document…"}
                className="w-full bg-[#050505] border border-white/10 text-white placeholder:text-slate-500 rounded-2xl py-4 pl-6 pr-16 outline-none focus:border-white/30 transition-all shadow-inner disabled:opacity-50 text-[14px] font-medium" />
              <button type="submit" disabled={!input.trim() || loading}
                className="absolute right-2 bg-white text-black hover:bg-slate-200 w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-20 disabled:hover:bg-white focus:scale-95 shadow-md">
                <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
