import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScratchpadNote, Task } from '../types';
import {
  FileText,
  Copy,
  Check,
  Trash2,
  Plus,
  Pin,
  Search,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  Sparkles,
  ClipboardCheck,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Scratchpad structures definition
interface QuickScratchpadProps {
  onAddTasks: (titles: string[]) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const NOTE_PRESETS = [
  {
    title: '💡 Brainstorm Spec Checklist',
    category: 'Ideas',
    content: `### Sprint Specification Goals
- [ ] Investigate system scaling bottlenecks
- [ ] Conduct type-safety sanity checks
- [ ] Pair design rules with fluid columns
- [ ] Finalize responsive padding buffers`
  },
  {
    title: '📞 Executive Call Summary',
    category: 'Work',
    content: `### Client Agenda 
- Point 1: Transitioning to the new multi-tenant database config.
- Point 2: Standardize performance metrics tracking metrics.
- Action: Schedule a tech audit next Monday.`
  },
  {
    title: '🧠 Deep Reflection Memo',
    category: 'Personal',
    content: `Focus Strategy: Avoid rapid context-switching. Allocate contiguous block chunks of 45 minutes to code generation, followed by 5 minutes of mindful posture alignment.`
  }
];

export function QuickScratchpad({ onAddTasks, addToast }: QuickScratchpadProps) {
  const [notes, setNotes] = useState<ScratchpadNote[]>(() => {
    const saved = localStorage.getItem('priorityflow_scratchpad_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'initial-welcome-note',
        title: '🚀 Workspace Quick Guide & Scratchpad',
        category: 'Guide',
        content: `### Welcome to your PriorityFlow Scratchpad!
Draft templates, copy temporary text lines, or list ideas directly alongside your dashboard.

💡 **Task Extractor Mode**:
Type task items on separate lines prefixed with "- [ ]" or simply list them like items, to unlock our workspace optimizer below:

- [ ] Complete executive financial blueprint audit
- [ ] Review typographies on mobile layouts
- [ ] Audit Firestore authentication routes

Click the "⚡ Extract tasks to checklist" button below write-ups to instantly queue them into your PriorityFlow agenda!`,
        pinned: true,
        updatedAt: new Date().toISOString()
      }
    ];
  });

  const [activeNoteId, setActiveNoteId] = useState<string>('initial-welcome-note');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Note formulation parameters
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteCategory, setNoteCategory] = useState<string>('General');
  const [isPinned, setIsPinned] = useState<boolean>(false);

  const [copyState, setCopyState] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('priorityflow_scratchpad_notes', JSON.stringify(notes));
  }, [notes]);

  // Load active note to buffers
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId);
  }, [notes, activeNoteId]);

  useEffect(() => {
    if (activeNote) {
      setNoteTitle(activeNote.title);
      setNoteContent(activeNote.content);
      setNoteCategory(activeNote.category || 'General');
      setIsPinned(activeNote.pinned || false);
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteCategory('General');
      setIsPinned(false);
    }
  }, [activeNoteId, activeNote]);

  // Search filter matching
  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return notes
      .filter((note) => {
        if (!query) return true;
        return (
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.category.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, searchQuery]);

  // Extract check action points
  const extractableTasks = useMemo(() => {
    if (!noteContent) return [];
    const lines = noteContent.split('\n');
    const tasksFound: string[] = [];
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      // Match starts with "- [ ]", "*- [ ]", "[ ]", "- ", "* "
      let match = trimmed.replace(/^[\s*-]*\[\s*\]\s*/, '').trim();
      
      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('* [ ]')) {
        if (match) tasksFound.push(match);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const item = trimmed.substring(2).trim();
        // Exclude standard header structures or italic instructions
        if (item && !item.startsWith('###') && !item.startsWith('##') && !item.startsWith('#') && !item.startsWith('**')) {
          tasksFound.push(item);
        }
      }
    });

    return tasksFound;
  }, [noteContent]);

  // Handlers
  const handleCreateNote = (preset?: typeof NOTE_PRESETS[0]) => {
    const newId = `note-${Date.now()}`;
    const newNote: ScratchpadNote = {
      id: newId,
      title: preset ? preset.title : 'New Scratchpad Note',
      category: preset ? preset.category : 'General',
      content: preset ? preset.content : '',
      pinned: false,
      updatedAt: new Date().toISOString()
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);
    setIsExpanded(true);
    addToast(preset ? `Applied template: "${preset.title}"` : 'New scratchpad note initialized.', 'success');
  };

  const handleUpdateNoteField = (fields: Partial<ScratchpadNote>) => {
    if (!activeNoteId) return;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeNoteId) {
          return {
            ...n,
            ...fields,
            updatedAt: new Date().toISOString()
          };
        }
        return n;
      })
    );
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to discard this scratchpad memo?');
    if (!confirmed) return;

    setNotes((prev) => prev.filter((n) => n.id !== id));
    addToast('Scratchpad note removed successfully.', 'info');

    // Reset current active note pointers
    if (activeNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      if (remaining.length > 0) {
        setActiveNoteId(remaining[0].id);
      } else {
        const fallbackId = 'note-fallback';
        const fallback: ScratchpadNote = {
          id: fallbackId,
          title: '📝 Quick Dashboard Notes',
          category: 'General',
          content: 'Keep code instructions, todo drafts, or notes in this playground block.',
          pinned: false,
          updatedAt: new Date().toISOString()
        };
        setNotes([fallback]);
        setActiveNoteId(fallbackId);
      }
    }
  };

  const handleCopyToClipboard = () => {
    if (!noteContent) return;
    navigator.clipboard.writeText(noteContent);
    setCopyState(true);
    addToast('Note content copied to clipboard!', 'success');
    setTimeout(() => setCopyState(false), 2000);
  };

  const handleExtractTasksTrigger = () => {
    if (extractableTasks.length === 0) return;
    onAddTasks(extractableTasks);
    addToast(`Successfully extracted and created ${extractableTasks.length} active tasks!`, 'success');
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800/80 rounded-3xl p-5 mb-6 shadow-sm transition-all relative overflow-hidden"
      id="workspace-notepad-memo-container"
    >
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-400/5 blur-3xl rounded-full pointer-events-none" />

      {/* Main Header Row */}
      <div className="flex items-center justify-between" id="scratchpad-header-zone">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/10 text-indigo-600 dark:text-indigo-405 rounded-2xl flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>Interactive Notepad</span>
              <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                Sync Enabled
              </span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-0.5">
              Draft operational templates & capture instantaneous thoughts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick collapse/expand whole scratch panel */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-800 dark:hover:bg-slate-800 rounded-xl text-slate-550 dark:text-slate-400 cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title={isExpanded ? 'Collapse Scratchpad' : 'Open Scratchpad Panel'}
            id="scratchpad-expand-toggle"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">Unfocus</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">Write Memo ({notes.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Container Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="overflow-hidden"
            id="scratchpad-expanded-wrapper animate-fade-in"
          >
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-12 gap-5" id="scratchpad-inner-content-grid">
              
              {/* Left Column: Note Directory Drawer (Span 4) */}
              <div className="md:col-span-4 flex flex-col gap-3 border-r border-slate-50 dark:border-slate-800/40 pr-0 md:pr-4" id="scratchpad-notes-directory">
                <div className="flex items-center justify-between gap-2" id="directory-actions">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Quick Memos
                  </span>
                  
                  {/* Create New Memo Trigger */}
                  <button
                    onClick={() => handleCreateNote()}
                    className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                    id="directory-new-note-btn"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Memo</span>
                  </button>
                </div>

                {/* Directory Searching */}
                <div className="relative" id="directory-search-form">
                  <input
                    type="text"
                    placeholder="Search note tags, text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.8 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] text-slate-700 dark:text-slate-350 outline-none focus:ring-1.5 focus:ring-indigo-500/20"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Vertical lists database */}
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin flex-1" id="directory-note-item-feed">
                  {filteredNotes.map((note) => {
                    const isSelected = note.id === activeNoteId;
                    const previewText = note.content ? note.content.replace(/[#*\[\]-]/g, '').trim().substring(0, 48) : 'No content drafted yet.';
                    const noteTime = new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    return (
                      <div
                        key={note.id}
                        onClick={() => setActiveNoteId(note.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative ${
                          isSelected
                            ? 'bg-indigo-50/55 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/50 text-indigo-950 dark:text-white'
                            : 'bg-white hover:bg-slate-50/50 dark:bg-slate-900 dark:hover:bg-slate-850/50 border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wider uppercase leading-none ${
                            isSelected
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {note.category || 'General'}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {note.pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            <span className="text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500">{noteTime}</span>
                          </div>
                        </div>

                        <h4 className="text-xs font-extrabold tracking-tight mt-1 truncate pr-4">
                          {note.title || 'Untitled note'}
                        </h4>

                        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 truncate leading-tight">
                          {previewText}...
                        </p>

                        {/* Trigger Delete Action Overlay */}
                        <button
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="absolute bottom-2.5 right-2 h-5 w-5 rounded hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:text-slate-500 dark:hover:text-rose-400 flex items-center justify-center transition-colors opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
                          title="Discard Note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}

                  {filteredNotes.length === 0 && (
                    <div className="text-center py-4 text-[11px] text-slate-400">
                      No matching notes.
                    </div>
                  )}
                </div>

                {/* Dynamic Presets suggestions */}
                <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40" id="scratchpad-note-presets">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Suggested templates
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {NOTE_PRESETS.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => handleCreateNote(preset)}
                        className="text-[10px] font-semibold px-2 py-1 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-100 dark:border-slate-800 rounded-lg cursor-pointer transition-all"
                      >
                        {preset.category} template
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Note Editor Interface (Span 8) */}
              <div className="md:col-span-8 flex flex-col gap-3.5" id="scratchpad-note-editor-console">
                {activeNote ? (
                  <div className="space-y-3" id="main-active-editor-view">
                    
                    {/* Title and Pin configuration line */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/30 p-2.5 border border-slate-100/60 dark:border-slate-800/40 rounded-2xl" id="editor-header-control-strip">
                      <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                        <input
                          type="text"
                          value={noteTitle}
                          onChange={(e) => {
                            setNoteTitle(e.target.value);
                            handleUpdateNoteField({ title: e.target.value });
                          }}
                          placeholder="Note title..."
                          className="bg-transparent text-xs font-extrabold text-slate-900 dark:text-white border-0 focus:ring-0 p-0 outline-none w-full"
                          id="active-note-title-input"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Selector tag */}
                        <div className="relative">
                          <select
                            value={noteCategory}
                            onChange={(e) => {
                              setNoteCategory(e.target.value);
                              handleUpdateNoteField({ category: e.target.value });
                            }}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-2 pr-6 py-0.8 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none appearance-none cursor-pointer"
                          >
                            {['General', 'Ideas', 'Work', 'Personal', 'Meeting', 'Guide'].map((catName) => (
                              <option key={catName} value={catName}>
                                {catName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Favorite Pin Trigger */}
                        <button
                          onClick={() => {
                            const nextPin = !isPinned;
                            setIsPinned(nextPin);
                            handleUpdateNoteField({ pinned: nextPin });
                            addToast(nextPin ? 'Memo pinned to topmost list!' : 'Memo unpinned.', 'info');
                          }}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isPinned
                              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/45 dark:border-amber-900 text-amber-500'
                              : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-450 hover:text-slate-600'
                          }`}
                          title="Pin note to directory top"
                          id="active-note-pin-btn"
                        >
                          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-505' : ''}`} />
                        </button>

                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

                        {/* Copy Content trigger */}
                        <button
                          onClick={handleCopyToClipboard}
                          disabled={!noteContent}
                          className="px-2.5 py-1.2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                          title="Copy whole note markdown"
                          id="active-note-copy-btn"
                        >
                          {copyState ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copyState ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Rich text area canvas */}
                    <div className="relative" id="editor-body-textarea-box">
                      <textarea
                        value={noteContent}
                        onChange={(e) => {
                          setNoteContent(e.target.value);
                          handleUpdateNoteField({ content: e.target.value });
                        }}
                        placeholder="Draft ideas, outline bullet action lists, or paste specification guidelines here..."
                        rows={6}
                        className="w-full bg-slate-55 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1.5 focus:ring-indigo-500/20 font-mono tracking-wide leading-relaxed scrollbar-thin outline-none resize-y"
                        id="active-note-main-textarea"
                      />
                      <div className="absolute bottom-2 right-3 text-[9px] text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-100/50 dark:border-slate-800/40">
                        {noteContent.length} chars • {noteContent.split(/\s+/).filter(Boolean).length} words
                      </div>
                    </div>

                    {/* ⚡ Dynamic Checklist Parser & Task Injector Banner */}
                    <AnimatePresence>
                      {extractableTasks.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-indigo-50/50 border border-indigo-100/40 dark:bg-indigo-950/20 dark:border-indigo-900/40 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in"
                          id="task-extractor-banner-notification"
                        >
                          <div className="flex items-center gap-2.5 text-left">
                            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                              ⚡
                            </div>
                            <div>
                              <h5 className="text-[11px] font-extrabold text-indigo-950 dark:text-indigo-200">
                                Checklist Items Extractor ({extractableTasks.length} detected)
                              </h5>
                              <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-tight">
                                Transform list memos starting with "- [ ]" or lists directly into workspace checklist tasks.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleExtractTasksTrigger}
                            className="bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-extrabold text-[10px] px-3.5 py-1.8 rounded-xl flex items-center gap-1 shadow-md cursor-pointer transition-all"
                            id="extractor-confirm-btn"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Inject Tasks</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2" id="empty-editor-fallback">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-semibold text-slate-500">No active scratch memo selected</p>
                    <button
                      onClick={() => handleCreateNote()}
                      className="mt-2 text-xs font-semibold text-indigo-600 underline"
                    >
                      Initialize a new note
                    </button>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
