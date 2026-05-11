import React, { useState, useEffect, useRef } from 'react';
import { parseBreakSchedule } from '../services/geminiService';
import { BreakSlot } from '../types';
import { Coffee, Play, Square, Bell, CheckCircle2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { useDesktopNotifications } from '../hooks/useDesktopNotifications';

// Helper to get Date object from "HH:MM"
const getTodayTime = (timeStr: string) => {
  if (typeof timeStr !== 'string') return new Date();
  const [hStr, mStr] = timeStr.split(':');
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  
  // If the parsed time is more than 12 hours in the past, it's highly likely referring to tomorrow (e.g. now=23:00, break=01:00)
  if (d.getTime() < Date.now() - 12 * 60 * 60 * 1000) {
    d.setDate(d.getDate() + 1);
  }
  
  return d;
};

// Format seconds into MM:SS
const formatTime = (totalSeconds: number) => {
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const m = Math.floor(absSeconds / 60).toString().padStart(2, '0');
  const s = (absSeconds % 60).toString().padStart(2, '0');
  return `${isNegative ? '-' : ''}${m}:${s}`;
};

const formatCountdown = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
};

interface TrackedBreak extends BreakSlot {
  status: 'pending' | 'ongoing' | 'completed';
  actualDurationMinutes: number;
}

export function BreaksTab() {
  const [input, setInput] = useState(() => {
    return localStorage.getItem('breaksTab_input') || '';
  });
  const [breaks, setBreaks] = useState<TrackedBreak[]>(() => {
    try {
      const saved = localStorage.getItem('breaksTab_breaks');
      const p = saved ? JSON.parse(saved) : null;
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeBreakId, setActiveBreakId] = useState<string | null>(() => {
    return localStorage.getItem('breaksTab_activeId') || null;
  });
  const [activeBreakStartTs, setActiveBreakStartTs] = useState<number | null>(() => {
    const saved = localStorage.getItem('breaksTab_activeTs');
    return saved ? parseInt(saved, 10) : null;
  });

  const {
    notificationPermission,
    requestPermissionManually,
    sendNotification,
    notified5Min,
    notifiedNow,
    clearNotificationCache
  } = useDesktopNotifications();

  useEffect(() => {
    localStorage.setItem('breaksTab_input', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('breaksTab_breaks', JSON.stringify(breaks));
  }, [breaks]);

  useEffect(() => {
    if (activeBreakId) {
      localStorage.setItem('breaksTab_activeId', activeBreakId);
    } else {
      localStorage.removeItem('breaksTab_activeId');
    }
  }, [activeBreakId]);

  useEffect(() => {
    if (activeBreakStartTs) {
      localStorage.setItem('breaksTab_activeTs', activeBreakStartTs.toString());
    } else {
      localStorage.removeItem('breaksTab_activeTs');
    }
  }, [activeBreakStartTs]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [nextBreak, setNextBreak] = useState<TrackedBreak | null>(null);
  const [nextBreakRemainingSeconds, setNextBreakRemainingSeconds] = useState<number | null>(null);

  // Main monitoring interval (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // 1. Check for upcoming / current breaks
      let upcoming: TrackedBreak | null = null;
      let minDiff = Infinity;

      breaks.forEach((b) => {
        if (b.status === 'completed' || b.status === 'ongoing') return;
        
        const breakDate = getTodayTime(b.startTime);
        const diffMs = breakDate.getTime() - now.getTime();
        const diffMinutes = Math.ceil(diffMs / 60000);
        const diffSeconds = Math.floor(diffMs / 1000);

        if (diffSeconds > 0 && diffSeconds < minDiff) {
          minDiff = diffSeconds;
          upcoming = b;
        }

        // 5 minute warning
        if (diffMinutes === 5 && !notified5Min.current.has(b.id)) {
          sendNotification('Break Upcoming', `Your ${b.type} break starts in 5 minutes (${b.startTime})`);
          notified5Min.current.add(b.id);
        }

        // Exact time warning (allow 1 min leeway)
        if (diffMinutes <= 0 && diffMinutes > -5 && !notifiedNow.current.has(b.id)) {
          sendNotification('Break Time!', `It is time for your ${b.type} break (${b.startTime} - ${b.endTime})`);
          notifiedNow.current.add(b.id);
        }
      });

      setNextBreak(upcoming);
      setNextBreakRemainingSeconds(upcoming ? minDiff : null);

      window.dispatchEvent(new CustomEvent('update-upcoming-break', {
        detail: upcoming && minDiff !== null ? {
          type: upcoming.type,
          startTime: upcoming.startTime,
          remainingSeconds: minDiff
        } : null
      }));

      // 2. Update stopwatch if there is an active break
      if (activeBreakId && activeBreakStartTs) {
        setElapsedSeconds(Math.floor((Date.now() - activeBreakStartTs) / 1000));
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [breaks, activeBreakId, activeBreakStartTs]);

  const handleParse = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const parsed = await parseBreakSchedule(input);
      if (parsed.length === 0) {
        toast.error('Could not find any break schedules in the text.');
      } else {
        const newBreaks = parsed.map(b => ({
          ...b,
          status: 'pending' as const,
          actualDurationMinutes: 0
        }));
        setBreaks(newBreaks);
        toast.success(`Successfully parsed ${parsed.length} breaks.`);
        
        // Reset tracking
        clearNotificationCache();
      }
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        toast.error('API quota exceeded. Please try again later.');
      } else {
        toast.error('Failed to parse schedule.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startBreak = (id: string) => {
    if (activeBreakId) {
      toast.error('A break is already in progress. Please end it first.');
      return;
    }
    setActiveBreakId(id);
    setActiveBreakStartTs(Date.now());
    setElapsedSeconds(0);
    setBreaks(prev => prev.map(b => b.id === id ? { ...b, status: 'ongoing' } : b));
    toast.success('Break started!');
  };

  const endBreak = (id: string) => {
    if (activeBreakId !== id || !activeBreakStartTs) return;
    
    // Calculate total minutes taken
    const durationMins = Math.round((Date.now() - activeBreakStartTs) / 60000);
    
    setBreaks(prev => prev.map(b => b.id === id ? { ...b, status: 'completed', actualDurationMinutes: durationMins } : b));
    setActiveBreakId(null);
    setActiveBreakStartTs(null);
    setElapsedSeconds(0);
    toast.success(`Break ended. You took ${durationMins} minutes.`);
  };

  const clearBreaks = () => {
    if (activeBreakId) {
      if (!confirm('A break is in progress. Are you sure you want to clear all breaks?')) return;
    }
    setBreaks([]);
    setActiveBreakId(null);
    setActiveBreakStartTs(null);
    setElapsedSeconds(0);
    clearNotificationCache();
    setInput('');
  };

  const totalScheduled = breaks.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalTaken = breaks.reduce((acc, curr) => acc + curr.actualDurationMinutes, 0);
  const timeDifference = totalTaken - totalScheduled;

  return (
    <div className="space-y-6">
      {notificationPermission !== 'granted' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Enable Desktop Notifications</h3>
              <p className="mt-1 text-sm text-yellow-700">
                To override other browser tabs and get world-class alerts for your breaks, allow notifications.
                <br className="hidden sm:block" />
                <strong>Note:</strong> If you are testing in a preview iframe, you must open the app in a new tab for notifications to work. Also ensure your operating system (Windows/macOS) has "Do Not Disturb" disabled.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={requestPermissionManually} className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 flex-shrink-0">
            Enable Notifications
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Coffee className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Breaks Manager</h2>
          </div>
          {breaks.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearBreaks} className="text-red-600 border-red-200 hover:bg-red-50" leftIcon={<Trash2 className="w-4 h-4" />}>
              Clear Schedule
            </Button>
          )}
        </div>

        {breaks.length === 0 ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Paste your daily schedule (with break times):</label>
            <Textarea
              className="h-40 resize-y bg-slate-50"
              placeholder="e.g.&#10;10:00 - 10:15 Short Break&#10;13:00 - 14:00 Lunch&#10;16:30 - 16:45 Coffee Break"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button
              onClick={handleParse}
              disabled={isLoading || !input.trim()}
              isLoading={isLoading}
              className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700"
            >
              {isLoading ? 'Parsing Schedule...' : 'Parse Schedule'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {nextBreak && nextBreakRemainingSeconds !== null && !activeBreakId && (
              <div className="bg-gradient-to-r from-primary-500 to-violet-600 rounded-xl p-6 text-white shadow-lg mb-6 flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h3 className="text-primary-100 font-medium tracking-wide">Next Upcoming Break</h3>
                  <p className="text-2xl font-bold mt-1">{nextBreak.type} <span className="opacity-75 font-normal ml-2">({nextBreak.startTime})</span></p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end bg-black/10 rounded-lg py-2 px-6 backdrop-blur-sm">
                  <span className="text-primary-100 text-sm font-medium mb-1 uppercase tracking-wider">Starts in</span>
                  <div className="text-5xl font-mono font-bold tracking-tight">
                    {formatCountdown(nextBreakRemainingSeconds)}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <span className="block text-sm text-slate-500 mb-1">Scheduled Breaks</span>
                <span className="text-2xl font-bold text-slate-800">{totalScheduled} min</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <span className="block text-sm text-slate-500 mb-1">Total Time Taken</span>
                <span className="text-2xl font-bold text-primary-600">{totalTaken} min</span>
              </div>
              <div className={`p-4 rounded-lg border text-center ${timeDifference > 0 ? 'bg-red-50 border-red-200' : timeDifference < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <span className="block text-sm text-slate-500 mb-1">Status</span>
                <span className={`text-2xl font-bold ${timeDifference > 0 ? 'text-red-600' : timeDifference < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {timeDifference > 0 ? `Exceeded by ${timeDifference}m` : timeDifference < 0 ? `Saved ${Math.abs(timeDifference)}m` : 'Exactly on time'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 text-lg">Your Schedule</h3>
              {breaks.map((b) => {
                const isOngoing = b.status === 'ongoing';
                const isCompleted = b.status === 'completed';
                
                // Countdown logic for ongoing break
                let remainingSeconds = b.durationMinutes * 60 - elapsedSeconds;
                
                return (
                  <div key={b.id} className={`p-4 rounded-lg border transition-all ${isOngoing ? 'bg-primary-50 border-primary-200 shadow-sm ring-1 ring-primary-500' : isCompleted ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-primary-300'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full mt-1 ${isOngoing ? 'bg-primary-100 text-primary-600 animate-pulse' : isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {isOngoing ? <Coffee className="w-5 h-5" /> : isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{b.type}</h4>
                          <p className="text-sm text-slate-500">{b.startTime} - {b.endTime} ({b.durationMinutes} mins)</p>
                          {isCompleted && (
                            <p className={`text-xs mt-1 font-medium ${b.actualDurationMinutes > b.durationMinutes ? 'text-red-600' : 'text-emerald-600'}`}>
                              Taken: {b.actualDurationMinutes} mins
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isOngoing && (
                          <div className={`text-2xl font-bold font-mono mr-2 ${remainingSeconds < 0 ? 'text-red-500' : 'text-primary-600'}`}>
                            {formatTime(remainingSeconds)}
                          </div>
                        )}
                        
                        {b.status === 'pending' && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => startBreak(b.id)}
                            disabled={!!activeBreakId}
                            leftIcon={<Play className="w-4 h-4" />}
                            className="bg-primary-50 hover:bg-primary-100 text-primary-700 w-full sm:w-auto"
                          >
                            Start
                          </Button>
                        )}
                        {isOngoing && (
                          <Button 
                            size="sm" 
                            onClick={() => endBreak(b.id)}
                            leftIcon={<Square className="w-4 h-4" />}
                            className="bg-red-500 hover:bg-red-600 w-full sm:w-auto text-white"
                          >
                            End Break
                          </Button>
                        )}
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-slate-400 text-sm font-medium px-3">
                            <CheckCircle2 className="w-4 h-4" /> Done
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
