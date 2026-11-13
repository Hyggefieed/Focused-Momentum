import React from 'react';
import {
  BarChart3,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  Plus,
  Timer,
  X,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { AppTab } from '../types/study';
import { formatCountdownClock } from '../utils/dateUtils';

interface NavItem {
  id: AppTab;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'today', label: 'Today', mobileLabel: 'Today', icon: CalendarCheck2 },
  { id: 'exams', label: 'Exams', mobileLabel: 'Exams', icon: BookOpenCheck },
  { id: 'focus', label: 'Focus Timer', mobileLabel: 'Focus', icon: Timer },
  { id: 'analytics', label: 'Analytics', mobileLabel: 'Analytics', icon: BarChart3 },
];

const SCREEN_TITLES: Record<AppTab, string> = {
  today: "Today's Study Plan",
  exams: 'Exams & Readiness',
  focus: 'Focus Timer',
  analytics: 'Analytics & Momentum',
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    todayFocusMinutes,
    dailyGoalMinutes,
    currentStreak,
    timer,
    openNewTaskSheet,
    toasts,
    dismissToast,
  } = useStudy();

  const goalPct = Math.min(100, Math.round((todayFocusMinutes / Math.max(1, dailyGoalMinutes)) * 100));
  const timerActiveOutsideFocus = timer.status !== 'idle' && activeTab !== 'focus';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex flex-col md:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:w-[244px] lg:w-[260px] md:flex-col md:fixed md:inset-y-0 bg-white border-r border-[#E5E7EB] z-30">
        <div className="px-5 h-16 flex items-center border-b border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className="font-display text-[17px] font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-[#4F46E5] rounded-md"
          >
            Focused Momentum
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#4F46E5] ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#3525CD] font-semibold'
                    : 'text-[#475569] hover:bg-[#F1F4F9] hover:text-[#0F172A]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </span>
                {item.id === 'focus' && timer.status === 'running' && (
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-[#4F46E5]">
                    {formatCountdownClock(timer.remainingSeconds)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] space-y-3">
          {timerActiveOutsideFocus && (
            <button
              type="button"
              onClick={() => setActiveTab('focus')}
              className="w-full text-left p-3 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] hover:bg-[#E0E7FF]/60 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-medium text-[#3525CD]">
                <span>{timer.status === 'running' ? 'Session running' : 'Session paused'}</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatCountdownClock(timer.remainingSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-[#4F46E5] mt-1">Return to Focus Timer</p>
            </button>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#475569]">Daily Focus Goal</span>
              <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                {todayFocusMinutes}/{dailyGoalMinutes}m
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#F1F4F9] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${goalPct}%`,
                  backgroundColor: goalPct >= 100 ? '#10B981' : '#4F46E5',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-0.5">
              <span className="inline-flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="tabular-nums font-medium text-[#0F172A]">{currentStreak} day</span> streak
              </span>
              <span className="tabular-nums">{goalPct}%</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:pl-[244px] lg:pl-[260px] min-w-0">
        {/* Mobile Compact Top Header (<= 52px) */}
        <header className="md:hidden sticky top-0 z-30 h-[52px] bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display text-base font-bold tracking-tight text-[#0F172A] truncate">
              {SCREEN_TITLES[activeTab]}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {timerActiveOutsideFocus ? (
              <button
                type="button"
                onClick={() => setActiveTab('focus')}
                className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-[#EEF2FF] text-[#3525CD] font-mono text-xs font-semibold tabular-nums"
              >
                <Timer className="w-3.5 h-3.5" />
                {formatCountdownClock(timer.remainingSeconds)}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#475569] tabular-nums">
                <Flame className="w-4 h-4 text-[#10B981]" />
                {currentStreak}d
              </span>
            )}
          </div>
        </header>

        {/* Desktop 3-Zone Top Bar */}
        <header className="hidden md:flex sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-6 lg:px-8 items-center justify-between gap-8">
          <h1 className="font-display text-xl font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0">
            {SCREEN_TITLES[activeTab]}
          </h1>

          <div className="flex items-center gap-5 text-sm text-[#475569] whitespace-nowrap shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#10B981]" />
              <span className="font-semibold text-[#0F172A] tabular-nums">{currentStreak}</span>
              <span>day streak</span>
            </span>
            <span aria-hidden="true" className="text-[#CBD5E1]">·</span>
            <span className="tabular-nums">
              <strong className="font-semibold text-[#0F172A]">{todayFocusMinutes}m</strong> focused today
            </span>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => openNewTaskSheet()}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </header>

        {/* Scrollable Screen Viewport */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Floating Action Button (Quick-Add) on Today & Exams */}
      {(activeTab === 'today' || activeTab === 'exams') && (
        <button
          type="button"
          onClick={() => openNewTaskSheet()}
          aria-label="Add study task"
          className="md:hidden fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full bg-[#4F46E5] active:bg-[#4338CA] text-white flex items-center justify-center shadow-[0_10px_15px_-3px_rgba(79,70,229,0.32),0_4px_6px_-2px_rgba(15,23,42,0.08)] active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Bottom 4-Tab Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] pb-safe"
      >
        <div className="grid grid-cols-4 h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] gap-1 transition-colors ${
                  isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'
                }`}
              >
                <Icon className="w-[21px] h-[21px]" />
                <span className={`text-[11px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 flex flex-col gap-2 pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto card-surface rounded-xl px-4 py-3 flex items-start justify-between gap-3 bg-white"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <CheckCircle2
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    toast.tone === 'warning'
                      ? 'text-[#D97706]'
                      : toast.tone === 'info'
                        ? 'text-[#4F46E5]'
                        : 'text-[#10B981]'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] leading-tight">{toast.title}</p>
                  {toast.detail && (
                    <p className="text-xs text-[#475569] mt-0.5 truncate">{toast.detail}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-[#94A3B8] hover:text-[#475569] p-1 -mr-1 -mt-1 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
