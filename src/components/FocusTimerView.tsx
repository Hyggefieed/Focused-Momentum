import React, { useMemo } from 'react';
import { Check, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { TIMER_MODE_DURATIONS, useStudy } from '../context/StudyContext';
import { TimerMode } from '../types/study';
import {
  formatCountdownClock,
  formatMinutesAsHours,
  formatSessionTimestamp,
  getTodayString,
} from '../utils/dateUtils';

const MODE_ORDER: TimerMode[] = ['focus', 'deep', 'short_break', 'long_break'];

export const FocusTimerView: React.FC = () => {
  const {
    timer,
    setTimerMode,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimerEarly,
    bindTimerTarget,
    toggleSound,
    exams,
    tasks,
    sessions,
    todayFocusMinutes,
    dailyGoalMinutes,
  } = useStudy();

  const today = getTodayString();

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === today),
    [sessions, today],
  );

  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.completed),
    [tasks],
  );

  const examMap = useMemo(() => {
    const map = new Map<string, (typeof exams)[number]>();
    for (const ex of exams) map.set(ex.id, ex);
    return map;
  }, [exams]);

  const progressRatio =
    timer.totalSeconds > 0
      ? (timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds
      : 0;

  const isBreak = timer.mode === 'short_break' || timer.mode === 'long_break';
  const strokeColor = isBreak ? '#10B981' : '#4F46E5';

  // SVG Radial Timer Geometry
  const size = 252;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const elapsedSeconds = timer.totalSeconds - timer.remainingSeconds;
  const canLogEarly = !isBreak && elapsedSeconds >= 60;

  const handleTaskChange = (nextTaskId: string) => {
    if (!nextTaskId) {
      bindTimerTarget(timer.linkedExamId, null);
      return;
    }
    const foundTask = tasks.find((t) => t.id === nextTaskId);
    bindTimerTarget(foundTask?.examId ?? timer.linkedExamId, nextTaskId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5 items-start">
      {/* Main Distraction-Free Pomodoro Card */}
      <section className="card-surface rounded-2xl p-5 sm:p-7 flex flex-col items-center">
        {/* Segmented Mode Picker */}
        <div className="w-full flex items-center justify-between gap-3">
          <div
            className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[#F1F4F9] rounded-xl"
            role="tablist"
            aria-label="Timer preset mode"
          >
            {MODE_ORDER.map((mode) => {
              const active = timer.mode === mode;
              const info = TIMER_MODE_DURATIONS[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTimerMode(mode)}
                  className={`h-10 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    active ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {info.label} · {info.minutes}m
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleSound}
            aria-label={timer.soundEnabled ? 'Mute completion chime' : 'Unmute completion chime'}
            title={timer.soundEnabled ? 'Chime on' : 'Chime muted'}
            className="w-11 h-11 rounded-xl border border-[#E5E7EB] flex items-center justify-center text-[#475569] hover:text-[#0F172A] hover:bg-[#F8F9FA] shrink-0 cursor-pointer"
          >
            {timer.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#94A3B8]" />}
          </button>
        </div>

        {/* Radial Countdown Clock */}
        <div className="relative my-7 flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 350ms linear',
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <span className="text-xs font-semibold text-[#64748B]">
              {timer.status === 'running'
                ? isBreak
                  ? 'Resting'
                  : 'Deep Focus'
                : timer.status === 'paused'
                  ? 'Paused'
                  : TIMER_MODE_DURATIONS[timer.mode].label}
            </span>
            <span className="font-mono text-[46px] font-bold tracking-tight text-[#0F172A] tabular-nums leading-none mt-2">
              {formatCountdownClock(timer.remainingSeconds)}
            </span>
            <span className="text-xs text-[#64748B] mt-2 truncate max-w-[180px]">
              {timer.linkedExamId ? examMap.get(timer.linkedExamId)?.code ?? 'Study Block' : 'Unassigned Block'}
            </span>
          </div>
        </div>

        {/* Primary Timer Controls */}
        <div className="w-full max-w-sm flex items-center gap-3">
          <button
            type="button"
            onClick={resetTimer}
            aria-label="Reset timer"
            className="w-12 h-12 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] flex items-center justify-center text-[#475569] shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={timer.status === 'running' ? pauseTimer : startTimer}
            className="flex-1 h-12 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {timer.status === 'running' ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{timer.status === 'paused' ? 'Resume Session' : 'Start Focus'}</span>
              </>
            )}
          </button>

          {canLogEarly && (
            <button
              type="button"
              onClick={completeTimerEarly}
              title="Complete and log elapsed minutes"
              className="h-12 px-3.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Log</span>
            </button>
          )}
        </div>

        {/* Task & Certification Binding */}
        <div className="w-full mt-7 pt-5 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="timer-exam-select" className="block text-xs font-semibold text-[#475569] mb-1.5">
              Credit to Certification
            </label>
            <select
              id="timer-exam-select"
              value={timer.linkedExamId ?? ''}
              onChange={(e) => bindTimerTarget(e.target.value || null, timer.linkedTaskId)}
              className="w-full h-11 px-3 rounded-xl input-surface text-sm text-[#0F172A]"
            >
              <option value="">General Study</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.code} · {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="timer-task-select" className="block text-xs font-semibold text-[#475569] mb-1.5">
              Linked Study Task
            </label>
            <select
              id="timer-task-select"
              value={timer.linkedTaskId ?? ''}
              onChange={(e) => handleTaskChange(e.target.value)}
              className="w-full h-11 px-3 rounded-xl input-surface text-sm text-[#0F172A]"
            >
              <option value="">None (Free Study)</option>
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Today's Focus Log Card */}
      <aside className="card-surface rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-[#0F172A]">Today's Study Log</h2>
            <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
              {formatMinutesAsHours(todayFocusMinutes)} completed of {formatMinutesAsHours(dailyGoalMinutes)} daily goal
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-[#4F46E5] tabular-nums">
            {Math.min(100, Math.round((todayFocusMinutes / Math.max(1, dailyGoalMinutes)) * 100))}%
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-[#F1F4F9] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.round((todayFocusMinutes / Math.max(1, dailyGoalMinutes)) * 100))}%`,
              backgroundColor: todayFocusMinutes >= dailyGoalMinutes ? '#10B981' : '#4F46E5',
            }}
          />
        </div>

        <div className="pt-2">
          {todaySessions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-[#475569]">No sessions logged today yet</p>
              <p className="text-xs text-[#94A3B8] mt-1">
                Start a 25m or 50m focus block to build today's streak.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F1F4F9]">
              {todaySessions.map((session) => {
                const exam = session.examId ? examMap.get(session.examId) : null;
                return (
                  <li key={session.id} className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{session.label}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {exam ? `${exam.code} · ` : ''}
                        {formatSessionTimestamp(session.startedAt)}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#059669] tabular-nums shrink-0">
                      +{session.durationMinutes}m
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};
