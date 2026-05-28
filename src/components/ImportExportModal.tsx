import React, { useState, useRef } from 'react';
import { Task } from '../types';
import { X, Download, Upload, Copy, Check, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onImport: (importedTasks: Task[]) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function ImportExportModal({
  isOpen,
  onClose,
  tasks,
  onImport,
  addToast,
}: ImportExportModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // JSON string for exporter and copy operations
  const serializedTasks = JSON.stringify(tasks, null, 2);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(serializedTasks);
      setCopied(true);
      addToast('Tasks JSON copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy text. Please select and copy manually.', 'error');
    }
  };

  const handleDownloadFile = () => {
    try {
      const blob = new Blob([serializedTasks], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `todo-list-export-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('File download started successfully!', 'success');
    } catch {
      addToast('Export file download block occurred.', 'error');
    }
  };

  // Basic Validation Schema Checker
  const validateAndImport = (rawText: string) => {
    if (!rawText.trim()) {
      addToast('Please insert or select a valid JSON configuration first.', 'error');
      return;
    }

    try {
      const parsed = JSON.parse(rawText);

      // Must be an array (or wrap in array if single task)
      const listToCheck = Array.isArray(parsed) ? parsed : [parsed];

      if (listToCheck.length === 0) {
        throw new Error('JSON array is empty.');
      }

      // Check schemas of at least the first item or every item
      const validTasks: Task[] = [];

      for (let i = 0; i < listToCheck.length; i++) {
        const item = listToCheck[i];
        if (!item.title || typeof item.title !== 'string') {
          throw new Error(`Item at position ${i} is missing a valid string 'title'.`);
        }

        // Generate fallback attributes for missing fields to avoid corruptions
        validTasks.push({
          id: item.id || `imported-task-${Date.now()}-${idxGenerator()}`,
          title: item.title,
          description: item.description || undefined,
          category: item.category || 'work',
          priority: item.priority === 'high' || item.priority === 'medium' || item.priority === 'low' ? item.priority : 'medium',
          deadline: item.deadline || undefined,
          completed: typeof item.completed === 'boolean' ? item.completed : false,
          pinned: typeof item.pinned === 'boolean' ? item.pinned : false,
          createdAt: item.createdAt || new Date().toISOString(),
          subTasks: Array.isArray(item.subTasks)
            ? item.subTasks.map((st: any) => ({
                id: st.id || `imported-sub-${Date.now()}-${idxGenerator()}`,
                title: st.title || 'Checklist step',
                completed: typeof st.completed === 'boolean' ? st.completed : false,
              }))
            : [],
        });
      }

      onImport(validTasks);
      setJsonText('');
      onClose();
    } catch (e: any) {
      addToast(`Validation failed: ${e.message || 'Invalid JSON format.'}`, 'error');
    }
  };

  const idxGenerator = () => Math.random().toString(36).substr(2, 5);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      readFile(files[0]);
    }
  };

  const readFile = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      addToast('Invalid file format. Please select a .json file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        validateAndImport(result);
      }
    };
    reader.onerror = () => {
      addToast('Error reading the selected template file.', 'error');
    };
    reader.readAsText(file);
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto" id="import-export-overlay">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          id="import-export-backdrop"
        />

        {/* Modal content */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 md:p-8"
            id="import-export-modal-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6" id="ie-header">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-indigo-500" />
                  JSON Cloud Backup
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Import other JSON checklist configurations or local backups.
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-400 hover:text-slate-650 dark:hover:text-slate-255 flex items-center justify-center transition-colors cursor-pointer"
                id="ie-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split layout block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="ie-form-split-grid">
              {/* Left Column: Import */}
              <div className="space-y-4" id="ie-import-column">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Import Checklist</h3>

                {/* Drag and drop panel */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                      : 'border-slate-200 hover:border-slate-350 dark:border-slate-850'
                  }`}
                  id="drag-and-drop-container"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    className="hidden"
                    id="ie-file-input"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to select .json file
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    or drag & drop here
                  </p>
                </div>

                <div className="relative text-center" id="ie-middle-divider">
                  <span className="bg-white dark:bg-slate-900 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">or paste plain json</span>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                {/* Plain JSON Input area */}
                <div className="space-y-2" id="ie-plain-json-paster">
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder='Paste raw [{"title": "Buy eggs", "completed": false}, ...] array...'
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-mono text-slate-800 dark:text-slate-105 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    id="ie-paster-textarea"
                  />
                  <button
                    onClick={() => validateAndImport(jsonText)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    id="ie-validate-trigger"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Load Pasted Checklist
                  </button>
                </div>
              </div>

              {/* Right Column: Export */}
              <div className="space-y-4" id="ie-export-column">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Export Backup</h3>

                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-850 p-4 rounded-2xl flex flex-col items-center text-center justify-center h-[135px]" id="ie-export-info-box">
                  <FileJson className="w-7 h-7 text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Your database has:{' '}
                    <span className="text-emerald-500 font-bold">{tasks.length} items</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                    Includes item pinning state, categories, specific subtask progress values, and formatting parameters.
                  </p>
                </div>

                {/* Exporter buttons */}
                <div className="grid grid-cols-1 gap-2 pt-2" id="ie-exporter-buttons-stack">
                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-transparent dark:border-transparent"
                    id="ie-copy-clipboard-btn"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Markup Synced!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Task JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadFile}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-100/50 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    id="ie-download-data-btn"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download file backup</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
