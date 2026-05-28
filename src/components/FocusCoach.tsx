import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Sparkles, Brain, RefreshCw, ChevronDown, ChevronUp, Bot, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FocusCoachProps {
  tasks: Task[];
}

export function FocusCoach({ tasks }: FocusCoachProps) {
  const [advice, setAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Restore cached coach feedback on first render to save API limit requests
  useEffect(() => {
    const cached = localStorage.getItem('priorityflow_advisor_cache');
    if (cached) {
      setAdvice(cached);
    }
  }, []);

  const handleGenerateAdvice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred during generation.');
      }

      setAdvice(data.advice);
      localStorage.setItem('priorityflow_advisor_cache', data.advice);
      setIsOpen(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown network error occurred. Please check setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAdvice = () => {
    setAdvice('');
    setError(null);
    localStorage.removeItem('priorityflow_advisor_cache');
  };

  // Inline dynamic custom parser for bold text, headers, and standard lists
  const parseBold = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="font-extrabold text-indigo-950 dark:text-white">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  const renderAdviceContent = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;

      // Match headers
      if (trimmed.startsWith('###')) {
        return (
          <h4
            key={idx}
            className="text-[10px] sm:text-xs font-black tracking-widest text-indigo-700 dark:text-indigo-400 mt-5 mb-2 uppercase flex items-center gap-1.5 first:mt-1 border-t border-slate-100 dark:border-slate-800/40 pt-4 first:border-0 first:pt-0"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h3
            key={idx}
            className="text-xs sm:text-sm font-extrabold text-slate-850 dark:text-slate-100 mt-6 mb-3 border-b border-slate-100 dark:border-slate-800 pb-1.5"
          >
            {trimmed.replace(/^##\s*/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('#')) {
        return (
          <h2
            key={idx}
            className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-7 mb-4 tracking-tight"
          >
            {trimmed.replace(/^#\s*/, '')}
          </h2>
        );
      }

      // Match bullet list item
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const itemContent = trimmed.replace(/^[-*]\s*/, '');
        return (
          <li
            key={idx}
            className="ml-4 list-disc text-xs text-slate-650 dark:text-slate-350 my-1 leading-relaxed pl-1"
          >
            {parseBold(itemContent)}
          </li>
        );
      }

      // Match numbered list item
      if (/^\d+\.\s*/.test(trimmed)) {
        const itemContent = trimmed.replace(/^\d+\.\s*/, '');
        const number = trimmed.match(/^(\d+)\./)?.[1] || '1';
        return (
          <div key={idx} className="flex items-start gap-2.5 my-2.5 pl-0.5">
            <span className="flex-shrink-0 flex h-4.5 w-4.5 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black font-mono">
              {number}
            </span>
            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed flex-1">
              {parseBold(itemContent)}
            </p>
          </div>
        );
      }

      // Normal paragraph text line
      return (
        <p
          key={idx}
          className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed my-2"
        >
          {parseBold(trimmed)}
        </p>
      );
    });
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800/80 rounded-3xl p-5 mb-6 shadow-sm transition-all relative overflow-hidden"
      id="executive-focus-coach-widget"
    >
      {/* Visual background gradient accent for advisor feel */}
      <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-indigo-500/5 dark:bg-indigo-400/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header and Toggle actions */}
      <div className="flex items-center justify-between" id="focus-coach-head-section">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex-shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>PriorityFlow Advisor</span>
              <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-305 dark:bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                GenAI 3.5
              </span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-0.5">
              Elite operational coach for Tier-1 productivity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {advice && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-800 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
              title={isOpen ? "Collapse Feedback" : "Expand Feedback"}
              id="coach-collapse-toggle"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={handleGenerateAdvice}
            disabled={isLoading || tasks.length === 0}
            className={`px-3.5 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-extrabold rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-slate-950/5 disabled:opacity-40 disabled:cursor-not-allowed`}
            id="advisor-primary-generate-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{advice ? 'Refresh Coach' : 'Analyze Focus'}</span>
          </button>
        </div>
      </div>

      {tasks.length === 0 && (
        <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-2.5 italic">
          * Please populate your workspace with tasks first to unlock custom focus advice.
        </p>
      )}

      {/* Coach Content Render Box */}
      <AnimatePresence initial={false}>
        {(isLoading || error || (advice && isOpen)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="overflow-hidden"
            id="coach-dynamic-viewport"
          >
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 font-sans" id="coach-inner-scroller">
              {isLoading && (
                <div className="py-8 flex flex-col items-center justify-center gap-3" id="coach-loading-view">
                  <div className="relative">
                    <div className="h-10 w-10 border-2 border-indigo-600/20 dark:border-indigo-400/25 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
                    <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Reconstructing Operations Strategy...
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                      Synthesizing time allocations, focus quotas, and high-priority queues using our elite Generative AI models.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3" id="coach-error-box">
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-450 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-rose-800 dark:text-rose-355">Advisor Advisory Interruption</h4>
                    <p className="text-[11px] text-rose-650 dark:text-rose-400/90 mt-1 leading-relaxed">
                      We've updated your app's Gemini API calls to our recommended approach for full-stack apps. Your API key can be found in the <strong>Settings &gt; Secrets</strong> panel.
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                       Detail: {error}
                    </p>
                  </div>
                </div>
              )}

              {advice && !isLoading && !error && (
                <div className="bg-slate-50/50 dark:bg-slate-950/30 relative border border-slate-100 dark:border-slate-800/40 p-5 rounded-2xl pr-4 animate-fade-in" id="coach-response-board">
                  <div className="absolute top-4 right-4" id="clear-cache-overlay-btn">
                    <button
                      onClick={clearAdvice}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-bold underline cursor-pointer"
                      title="Clear Advisory Cache and Reset Console"
                    >
                      Reset Coach
                    </button>
                  </div>

                  <div className="prose prose-slate max-w-none text-xs" id="coach-rendered-md-container">
                    {renderAdviceContent(advice)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
