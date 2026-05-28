import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Bell, BellRing, BellOff, Volume2, VolumeX, AlertCircle, Play, Calendar, Check, Clock, Sparkles } from 'lucide-react';

interface NotificationSchedulerProps {
  tasks: Task[];
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function NotificationScheduler({ tasks, addToast }: NotificationSchedulerProps) {
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('scheduler_sound_enabled') !== 'false';
  });
  const [alertInterval, setAlertInterval] = useState<number>(() => {
    return Number(localStorage.getItem('scheduler_alert_interval') || '15');
  });
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('scheduler_notified_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate local today string (YYYY-MM-DD)
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();

  // Find tasks due today that are NOT completed
  const dueTodayTasks = tasks.filter((t) => {
    if (!t.deadline || t.completed) return false;
    return t.deadline === todayStr;
  });

  // Check initial browser Notification support and status
  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
    } else {
      setPermission(Notification.permission as any);
    }
  }, []);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('scheduler_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('scheduler_alert_interval', String(alertInterval));
  }, [alertInterval]);

  useEffect(() => {
    localStorage.setItem('scheduler_notified_tasks', JSON.stringify(notifiedTaskIds));
  }, [notifiedTaskIds]);

  // Request native permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      addToast('System notifications are not supported on this browser version.', 'error');
      setPermission('unsupported');
      return;
    }

    try {
      const resp = await Notification.requestPermission();
      setPermission(resp as any);
      if (resp === 'granted') {
        addToast('Notification access authorized successfully!', 'success');
        triggerSystemNotification('Workspace Alerts Enabled', 'You will be notified here and on desktop about today\'s deadlines.');
      } else if (resp === 'denied') {
        addToast('Notification permission was declined.', 'info');
      }
    } catch (err) {
      // Chrome/Safari iframe permission rules might throw exceptions inside sandbox environments
      addToast('Permission block: Browser sandbox blocked direct permission request. Standalone tab required.', 'info');
      setPermission('denied');
    }
  };

  // Sound effect generator using clean Web Audio API synth
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Dynamic frequency design double melody chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
      osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5 chime shadow

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.55);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.warn('Audio sandbox constraint: ', e);
    }
  };

  // Single function to emit standard push or graceful fallback
  const triggerSystemNotification = (title: string, body: string) => {
    // 1. Play chime Sound
    playAlertSound();

    // 2. Spawn HTML5 System notification if permitted
    if (Notification.permission === 'granted') {
      try {
        const options: NotificationOptions = {
          body,
          icon: '/favicon.ico',
          tag: 'workspace-deadline-scheduler',
          requireInteraction: true
        };
        new Notification(title, options);
      } catch (e) {
        console.warn('Direct notification launch failed. Emitting fully responsive fallback to toast stream.', e);
      }
    }
    
    // 3. Fallback: Double confirm in active visual system toasts
    addToast(`🕒 SCHEDULED ALERT: ${title} - ${body}`, 'info');
  };

  // Perform background task monitoring
  useEffect(() => {
    // Check immediatly on compilation update / load
    if (dueTodayTasks.length === 0) return;

    const outstandingTasks = dueTodayTasks.filter(item => !notifiedTaskIds.includes(item.id));
    if (outstandingTasks.length > 0) {
      // Trigger notification for newly found unnotified tasks
      outstandingTasks.forEach(task => {
        const level = task.priority === 'high' ? '🚨 HIGH PRIORITY' : '🕒 DUE TODAY';
        triggerSystemNotification(
          `${level}: ${task.title}`,
          `Task in category [${task.category.toUpperCase()}] has a deadline slated for today. Start focus now!`
        );
      });

      // Avoid double triggering
      setNotifiedTaskIds(prev => [
        ...prev,
        ...outstandingTasks.map(ot => ot.id)
      ]);
    }
  }, [tasks, notifiedTaskIds]); // runs as users modify or append deadlines to today!

  // Instant simulation tester for preview environments
  const triggerInstantSimulationTest = () => {
    if (dueTodayTasks.length > 0) {
      const demo = dueTodayTasks[0];
      triggerSystemNotification(
        `🚨 TODAY'S DEADLINE: ${demo.title}`,
        `Simulated Alarm: Estimated block time is ${demo.estimatedMinutes || 30}m. Time spent is currently ${demo.actualMinutesSpent || 0}m.`
      );
    } else {
      triggerSystemNotification(
        '🕒 Dashboard Notification Test Chime',
        'Demonstration Notification: No active deadlines are due today. Add a goal set to today to trigger auto alarms.'
      );
    }
  };

  const handleResetFiredCache = () => {
    setNotifiedTaskIds([]);
    addToast('Reset scheduler notification fire cache. Alarms will refire.', 'success');
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 mb-6 shadow-sm relative overflow-hidden text-left"
      id="notification-scheduler-panel"
    >
      {/* Decorative gradient blur background */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100/80 dark:border-slate-800/60">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.8 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-150/40 rounded-full mb-2 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Vitals Watchdog
          </span>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
            Deadline Notification Scheduler
          </h3>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-prose leading-relaxed">
            Checks deadlines on startup and matches local dates. Alerts you automatically when tasks are due today.
          </p>
        </div>

        {/* Permission status controls */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {permission === 'unsupported' ? (
            <span className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/30 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1">
              <BellOff className="w-3.5 h-3.5" />
              Not Supported
            </span>
          ) : permission === 'granted' ? (
            <span className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border border-emerald-150/20 rounded-xl text-[10px] font-extrabold uppercase flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 stroke-3 text-emerald-500" />
              Push Enabled
            </span>
          ) : permission === 'denied' ? (
            <button
              onClick={requestNotificationPermission}
              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100/60 border border-amber-150/30 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
              title="Click to override restriction"
            >
              <BellOff className="w-3.5 h-3.5" />
              Push Blocked (Enable Custom)
            </button>
          ) : (
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/10 transition-colors"
              id="request-notifications-btn"
            >
              <BellRing className="w-3.5 h-3.5" />
              Authorize Push Alerts
            </button>
          )}

          {/* Sound enable switch */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 border rounded-xl cursor-pointer transition-colors ${
              soundEnabled
                ? 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-600'
            }`}
            title={soundEnabled ? 'Disable System Alert Sound' : 'Enable System Alert Sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-505" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Due Today Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch" id="scheduler-task-review-row">
        {/* Left pane: tasks scheduled checklist & info */}
        <div className="md:col-span-8 flex flex-col justify-between gap-3">
          {dueTodayTasks.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                🚨 {dueTodayTasks.length} Active Deadlines set for Today ({todayStr})
              </span>
              <div className="max-h-28 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar" id="scheduler-today-list">
                {dueTodayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2.5 p-2 bg-slate-50/60 dark:bg-slate-850/40 border border-slate-100/80 dark:border-slate-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        t.priority === 'high' ? 'bg-rose-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-indigo-500'
                      }`} />
                      <span className="text-xs font-semibold text-slate-850 dark:text-slate-200 truncate pr-2">
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 uppercase">
                        {t.category}
                      </span>
                      {notifiedTaskIds.includes(t.id) ? (
                        <span className="text-[8px] font-black tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/10 px-1 py-0.5 rounded">
                          Alarm Sent
                        </span>
                      ) : (
                        <span className="text-[8px] font-black tracking-wide text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-1 py-0.5 rounded animate-pulse">
                          Queued
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-5 flex flex-col items-center justify-center text-center bg-slate-50/30 dark:bg-slate-850/10 border border-dashed border-slate-200/60 dark:border-slate-800/40 rounded-2xl h-full">
              <Calendar className="w-5 h-5 text-slate-300 dark:text-slate-650 mb-1.5" />
              <p className="text-xs font-bold text-slate-450 dark:text-slate-500">No active goal deadlines set for today.</p>
              <p className="text-[9.5px] text-slate-400 dark:text-slate-600 mt-0.5">Tasks scheduled for today will auto populate with chime notifications.</p>
            </div>
          )}
        </div>

        {/* Right pane: settings / playground launcher */}
        <div className="md:col-span-4 bg-slate-50/50 dark:bg-slate-850/25 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Watch Parameters
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/65 pb-1">
                <span className="font-semibold">Re-check alarm:</span>
                <select
                  value={alertInterval}
                  onChange={(e) => setAlertInterval(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded px-1.5 py-0.5 text-[10px] text-slate-800 dark:text-slate-250 cursor-pointer outline-none font-bold"
                >
                  <option value={5}>Every 5m</option>
                  <option value={15}>Every 15m</option>
                  <option value={30}>Every 30m</option>
                  <option value={60}>Every hour</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Fired Alarms:</span>
                <span className="font-mono font-bold text-slate-500">{notifiedTaskIds.length}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={triggerInstantSimulationTest}
              className="flex-1 px-2.5 py-1.8 bg-indigo-50/60 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/40 text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
              id="test-scheduler-simulation"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Test Audio Alert</span>
            </button>

            {notifiedTaskIds.length > 0 && (
              <button
                type="button"
                onClick={handleResetFiredCache}
                className="px-2 py-1.5 border border-slate-250 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] text-slate-500 font-bold rounded-xl cursor-pointer transition-colors"
                title="Reset fired notifications to re-trigger current alarms"
              >
                Clear Cache
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Elegant Warning Alert if standard permission is blocked by frames */}
      {permission === 'denied' && (
        <div className="mt-3.5 bg-amber-500/[0.04] border border-amber-500/15 rounded-xl p-2.5 flex items-start gap-2 text-left" id="scheduler-iframe-notice">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-amber-900/80 dark:text-amber-400/80 font-medium">
            <strong>System Notice:</strong> Active Sandbox container / Iframes often restrict system push notification access. Custom high-performance audio chimes and in-app responsive alarm blocks will run securely as fallback! Open the app in its own tab for native desktop popups.
          </p>
        </div>
      )}
    </div>
  );
}
