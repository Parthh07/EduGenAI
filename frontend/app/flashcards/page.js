"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function FlashcardsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState({ again: 0, good: 0, easy: 0 });
  const [toast, setToast] = useState(null);

  // AI Generate from Document
  const [genFiles, setGenFiles] = useState([]);
  const [genCount, setGenCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const loadCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/flashcards`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) setCards(await res.json());
    } catch {
      showToast('Failed to load flashcards.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, apiUrl]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const dueCards = cards.filter(c => new Date(c.next_review) <= new Date());
  const masteredCards = cards.filter(c => c.interval >= 14);
  const learningCards = cards.filter(c => c.interval > 0 && c.interval < 14);

  const startReview = () => {
    if (dueCards.length === 0) return showToast('No cards due for review!', 'error');
    setReviewQueue([...dueCards]);
    setReviewIdx(0);
    setShowAnswer(false);
    setSessionStats({ again: 0, good: 0, easy: 0 });
    setReviewMode(true);
  };

  const handleRating = async (rating) => {
    const card = reviewQueue[reviewIdx];
    if (!card) return;
    setRatingLoading(true);

    try {
      await fetch(`${apiUrl}/api/flashcards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ rating })
      });
    } catch { /* silent */ }

    setSessionStats(prev => ({ ...prev, [rating]: prev[rating] + 1 }));

    const nextIdx = reviewIdx + 1;
    if (nextIdx >= reviewQueue.length) {
      // Session complete
      await loadCards();
      setReviewMode(false);
    } else {
      setReviewIdx(nextIdx);
      setShowAnswer(false);
    }
    setRatingLoading(false);
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Delete this flashcard?')) return;
    try {
      await fetch(`${apiUrl}/api/flashcards/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCards(prev => prev.filter(c => c.id !== cardId));
      showToast('Card deleted.');
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  const handleGenerateFlashcards = async () => {
    if (genFiles.length === 0) return showToast('Please select a PDF or image first.', 'error');
    setGenerating(true);
    try {
      // Step 1: upload via File API
      const upData = new FormData();
      genFiles.forEach(f => upData.append('files', f));
      const upRes = await fetch(`${apiUrl}/api/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body: upData
      });
      if (!upRes.ok) {
        const d = await upRes.json();
        throw new Error(d.error || 'Failed to upload document.');
      }
      const { uris } = await upRes.json();

      // Step 2: generate flashcards
      const body = new FormData();
      body.append('count', genCount);
      body.append('fileContextUris', JSON.stringify(uris));
      const res = await fetch(`${apiUrl}/api/flashcards/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed.');

      showToast(`✨ ${data.created} flashcards generated!`);
      setGenFiles([]);
      setShowGenPanel(false);
      await loadCards();
    } catch (e) {
      showToast(e.message || 'Generation failed.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const currentCard = reviewQueue[reviewIdx];
  const progress = reviewQueue.length > 0 ? ((reviewIdx) / reviewQueue.length) * 100 : 0;

  const ratingColors = {
    again: 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30',
    good: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30',
    easy: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30',
  };

  const formatNextReview = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Due now';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 selection:bg-emerald-500/30 relative font-sans">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl border animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
          {toast.msg}
        </div>
      )}

      <div className="fixed top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#050505] to-[#050505] pointer-events-none z-0" />




      <main className="max-w-3xl mx-auto pt-16 pb-20 relative z-10">

        {/* Review Session */}
        {reviewMode && currentCard ? (
          <div className="animate-in fade-in">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{reviewIdx + 1} of {reviewQueue.length}</span>
                <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-red-400">✕ {sessionStats.again}</span>
                  <span className="text-indigo-400">◎ {sessionStats.good}</span>
                  <span className="text-emerald-400">✓ {sessionStats.easy}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Card */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden mb-8 min-h-[320px] flex flex-col" onClick={() => !showAnswer && setShowAnswer(true)}>
              {/* Question side */}
              <div className="p-8 md:p-10 flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">Question</p>
                <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed">{currentCard.question}</p>
                {currentCard.source && (
                  <p className="mt-4 text-[11px] text-slate-500 font-medium">Source: {currentCard.source}</p>
                )}
              </div>

              {/* Answer reveal */}
              {showAnswer ? (
                <div className="border-t border-white/10 bg-[#050505] p-8 md:p-10">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Answer</p>
                  <p className="text-base text-slate-200 leading-relaxed whitespace-pre-wrap">{currentCard.answer}</p>
                </div>
              ) : (
                <div className="border-t border-white/10 bg-white/[0.02] p-6 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
                  <p className="text-slate-500 text-sm font-medium">Click to reveal answer</p>
                </div>
              )}
            </div>

            {/* Rating buttons */}
            {showAnswer && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">How well did you know this?</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'again', label: 'Again', desc: 'Show tomorrow', icon: '✕' },
                    { key: 'good', label: 'Good', desc: 'Show in ~3 days', icon: '◎' },
                    { key: 'easy', label: 'Easy', desc: 'Show in ~7 days', icon: '✓' },
                  ].map(({ key, label, desc, icon }) => (
                    <button key={key} onClick={() => handleRating(key)} disabled={ratingLoading}
                      className={`p-4 rounded-2xl border font-bold transition-all disabled:opacity-60 text-center ${ratingColors[key]}`}>
                      <div className="text-2xl mb-1">{icon}</div>
                      <div className="text-sm">{label}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setReviewMode(false)} className="mt-8 w-full text-center text-slate-500 hover:text-white text-sm transition font-medium">
              ✕ End Session
            </button>
          </div>
        ) : reviewMode && !currentCard ? (
          /* Session Complete */
          <div className="animate-in fade-in zoom-in-95 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-4">Session Complete!</h2>
            <p className="text-slate-400 text-sm mb-8">You reviewed {reviewQueue.length} card{reviewQueue.length !== 1 ? 's' : ''}.</p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-10">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-red-400">{sessionStats.again}</p>
                <p className="text-[10px] font-bold text-red-400/70 uppercase mt-1">Again</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-indigo-400">{sessionStats.good}</p>
                <p className="text-[10px] font-bold text-indigo-400/70 uppercase mt-1">Good</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-emerald-400">{sessionStats.easy}</p>
                <p className="text-[10px] font-bold text-emerald-400/70 uppercase mt-1">Easy</p>
              </div>
            </div>
            <button onClick={() => { setReviewMode(false); }} className="bg-white text-black font-bold px-8 py-3.5 rounded-xl hover:bg-slate-200 transition">Back to Cards</button>
          </div>
        ) : (
          /* Main Cards View */
          <>
            <header className="text-center mb-12">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-emerald-400 text-xl">🗂</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">Flashcard Review</h1>
              <p className="text-slate-400 text-sm font-medium">Spaced repetition system — review cards at the right time to maximize retention.</p>
            </header>

            {/* ─── AI Generate Panel ─── */}
            <div className="mb-8">
              <button
                onClick={() => setShowGenPanel(v => !v)}
                className="w-full flex items-center justify-between bg-[#0A0A0A] border border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl px-6 py-4 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-base">✨</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">AI Generate from Document</p>
                    <p className="text-xs text-slate-500">Upload a PDF and let AI create flashcards automatically</p>
                  </div>
                </div>
                <span className={`text-slate-500 transition-transform duration-200 ${showGenPanel ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {showGenPanel && (
                <div className="mt-2 bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2">
                  {/* File picker */}
                  <div className="relative rounded-xl border border-dashed border-white/20 hover:border-emerald-500/50 bg-[#050505] transition-all p-6 text-center cursor-pointer mb-4">
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      multiple
                      onChange={e => setGenFiles(Array.from(e.target.files))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {genFiles.length === 0 ? (
                      <>
                        <p className="text-sm font-bold text-slate-400">📄 Drop PDF or image here</p>
                        <p className="text-xs text-slate-600 mt-1">PDF, JPG, PNG, WEBP supported</p>
                      </>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {genFiles.map((f, i) => (
                          <p key={i} className="text-xs font-bold text-emerald-400">✓ {f.name}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card count */}
                  <div className="flex items-center gap-4 mb-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Cards to generate</label>
                    <select
                      value={genCount}
                      onChange={e => setGenCount(Number(e.target.value))}
                      className="flex-1 bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 text-sm outline-none focus:border-emerald-500 transition-all"
                    >
                      {[5, 10, 15, 20].map(n => (
                        <option key={n} value={n}>{n} flashcards</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={generating || genFiles.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {generating
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating {genCount} flashcards…</>
                      : `✨ Generate ${genCount} Flashcards`
                    }
                  </button>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Cards', value: cards.length, color: 'slate' },
                { label: 'Due Now', value: dueCards.length, color: dueCards.length > 0 ? 'amber' : 'emerald' },
                { label: 'Mastered', value: masteredCards.length, color: 'emerald' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl text-center">
                  <p className={`text-${color}-400 text-[10px] font-bold uppercase tracking-widest mb-2`}>{label}</p>
                  <p className="text-3xl font-black text-white">{loading ? '—' : value}</p>
                </div>
              ))}
            </div>

            {/* Start Review */}
            <button onClick={startReview} disabled={dueCards.length === 0 || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-base shadow-lg shadow-emerald-900/30 mb-10">
              {dueCards.length > 0 ? `▶ Start Review — ${dueCards.length} Card${dueCards.length !== 1 ? 's' : ''} Due` : '✓ All caught up! No cards due'}
            </button>

            {/* All Cards */}
            {!loading && cards.length === 0 ? (
              <div className="bg-[#0A0A0A] border border-white/10 p-12 rounded-3xl text-center shadow-xl">
                <p className="text-slate-500 text-sm font-medium mb-4">No flashcards yet.</p>
                <button onClick={() => router.push('/study')} className="text-indigo-400 hover:text-indigo-300 text-sm font-bold underline">
                  Go to Study Synthesis to generate and save cards →
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-3">All Cards ({cards.length})</h2>
                <div className="space-y-3">
                  {loading && (
                    <div className="text-center py-10">
                      <span className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin inline-block" />
                    </div>
                  )}
                  {cards.map((card) => {
                    const isDue = new Date(card.next_review) <= new Date();
                    return (
                      <div key={card.id} className={`bg-[#0A0A0A] border rounded-2xl p-5 transition-all hover:bg-[#050505] group ${isDue ? 'border-amber-500/20' : 'border-white/5'}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-200 leading-relaxed mb-2 truncate">{card.question}</p>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{card.answer}</p>
                          </div>
                          <button onClick={() => handleDeleteCard(card.id)}
                            className="opacity-0 group-hover:opacity-100 transition text-slate-600 hover:text-red-400 p-1 flex-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDue ? 'text-amber-400' : 'text-slate-500'}`}>
                            {isDue ? '⚡ Due now' : `⏱ ${formatNextReview(card.next_review)}`}
                          </span>
                          <span className="text-[10px] text-slate-600 font-medium">·</span>
                          <span className="text-[10px] text-slate-600 font-medium">{card.review_count} review{card.review_count !== 1 ? 's' : ''}</span>
                          {card.interval >= 14 && <span className="ml-auto text-[10px] font-bold text-emerald-400 uppercase tracking-widest">✓ Mastered</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
