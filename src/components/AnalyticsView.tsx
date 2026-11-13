import React, { useMemo, useState } from 'react';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import {
  addDaysToDateString,
  formatMinutesAsHours,
  formatShortDate,
  getTodayString,
} from '../utils/dateUtils';
import {
  calculateExamReadiness,
  getDailyFocusMinutes,
  getExamLoggedMinutes,
  getReadinessColor,
} from '../utils/studyMetrics';

const GOAL_OPTIONS = [60, 90, 120, 180];

export const AnalyticsView: React.FC = () => {
  const {
    exams,
    tasks,
    sessions,
    currentStreak,
    dailyGoalMinutes,
    setDailyGoalMinutes,
    exportWorkspaceJson,
    restoreSampleData,
    clearAllData,
    pushToast,
  } = useStudy();

  const [chartWindow, setChartWindow] = useState<7 | 14>(7);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; minutes: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const today = getTodayString();

  const totalFocusMinutes = useMemo(() => {
    return sessions
      .filter((s) => s.mode === 'focus' || s.mode === 'deep')
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [sessions]);

  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks],
  );

  const avgReadiness = useMemo(() => {
    if (exams.length === 0) return 0;
    const sum = exams.reduce((acc, ex) => acc + calculateExamReadiness(ex), 0);
    return Math.round(sum / exams.length);
  }, [exams]);

  // Daily bar chart series
  const barSeries = useMemo(() => {
    return Array.from({ length: chartWindow }, (_, idx) => {
      const offset = idx - (chartWindow - 1);
      const dateStr = addDaysToDateString(today, offset);
      const minutes = getDailyFocusMinutes(sessions, dateStr);
      const dateObj = new Date(`${dateStr}T12:00:00`);
      const shortDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
      return {
        date: dateStr,
        label: chartWindow === 7 ? shortDay : String(dateObj.getDate()),
        minutes,
      };
    });
  }, [chartWindow, sessions, today]);

  const maxBarMinutes = useMemo(() => {
    const peak = Math.max(dailyGoalMinutes, ...barSeries.map((b) => b.minutes), 60);
    return Math.ceil(peak / 30) * 30;
  }, [barSeries, dailyGoalMinutes]);

  // 12-week (84-day) consistency heatmap
  const heatmapWeeks = useMemo(() => {
    const totalDays = 84;
    const days = Array.from({ length: totalDays }, (_, idx) => {
      const dateStr = addDaysToDateString(today, idx - (totalDays - 1));
      return {
        date: dateStr,
        minutes: getDailyFocusMinutes(sessions, dateStr),
      };
    });

    const weeks: Array<typeof days> = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [sessions, today]);

  const handleDownloadBackup = () => {
    const content = exportWorkspaceJson();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focused-momentum-${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushToast('Study log exported', `Saved focused-momentum-${today}.json`, 'info');
  };

  const getHeatmapCellColor = (minutes: number) => {
    if (minutes === 0) return 'bg-[#F1F4F9]';
    if (minutes < 30) return 'bg-[#C7D2FE]';
    if (minutes < 60) return 'bg-[#818CF8]';
    if (minutes < dailyGoalMinutes) return 'bg-[#4F46E5]';
    return 'bg-[#10B981]';
  };

  return (
    <div className="space-y-5">
      {/* 4-Card KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-surface rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-[#64748B]">Total Focus Time</p>
          <p className="font-display text-2xl sm:text-[28px] font-bold text-[#0F172A] tabular-nums mt-1.5">
            {formatMinutesAsHours(totalFocusMinutes)}
          </p>
          <p className="text-xs text-[#64748B] mt-1 tabular-nums">{sessions.length} blocks logged</p>
        </div>

        <div className="card-surface rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-[#64748B]">Study Streak</p>
          <p className="font-display text-2xl sm:text-[28px] font-bold text-[#10B981] tabular-nums mt-1.5">
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Consecutive daily activity</p>
        </div>

        <div className="card-surface rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-[#64748B]">Tasks Completed</p>
          <p className="font-display text-2xl sm:text-[28px] font-bold text-[#0F172A] tabular-nums mt-1.5">
            {completedTasksCount}
          </p>
          <p className="text-xs text-[#64748B] mt-1 tabular-nums">of {tasks.length} scheduled</p>
        </div>

        <div className="card-surface rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-[#64748B]">Avg Exam Readiness</p>
          <p className="font-display text-2xl sm:text-[28px] font-bold text-[#4F46E5] tabular-nums mt-1.5">
            {avgReadiness}%
          </p>
          <p className="text-xs text-[#64748B] mt-1 tabular-nums">Across {exams.length} certifications</p>
        </div>
      </section>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily Focus Hours Bar Chart */}
        <section className="card-surface rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A]">Focus Minutes</h2>
              <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                {hoveredDay
                  ? `${formatShortDate(hoveredDay.date)} · ${hoveredDay.minutes} minutes`
                  : `Daily goal: ${dailyGoalMinutes}m dashed line`}
              </p>
            </div>

            <div className="inline-flex p-1 bg-[#F1F4F9] rounded-xl">
              {([7, 14] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setChartWindow(days)}
                  className={`px-3 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    chartWindow === days ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>

          <div className="relative pt-2">
            {/* Goal Threshold Guide */}
            <div
              className="relative h-44 flex items-end gap-1.5 sm:gap-2.5 border-b border-[#E5E7EB] pb-1"
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className="absolute left-0 right-0 border-t border-dashed border-[#CBD5E1] pointer-events-none"
                style={{ bottom: `${Math.min(96, (dailyGoalMinutes / maxBarMinutes) * 100)}%` }}
              />

              {barSeries.map((bar) => {
                const heightPct = Math.max(bar.minutes > 0 ? 6 : 2, (bar.minutes / maxBarMinutes) * 100);
                const metGoal = bar.minutes >= dailyGoalMinutes;
                const isToday = bar.date === today;

                return (
                  <button
                    key={bar.date}
                    type="button"
                    onMouseEnter={() => setHoveredDay({ date: bar.date, minutes: bar.minutes })}
                    onFocus={() => setHoveredDay({ date: bar.date, minutes: bar.minutes })}
                    onClick={() => setHoveredDay({ date: bar.date, minutes: bar.minutes })}
                    aria-label={`${formatShortDate(bar.date)}: ${bar.minutes} minutes`}
                    className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer focus:outline-none"
                  >
                    <div
                      className="w-full max-w-[32px] rounded-t-lg transition-all duration-200 group-hover:opacity-90"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor:
                          bar.minutes === 0
                            ? '#F1F4F9'
                            : metGoal
                              ? '#10B981'
                              : isToday
                                ? '#4F46E5'
                                : '#818CF8',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 mt-2">
              {barSeries.map((bar) => (
                <span
                  key={bar.date}
                  className={`flex-1 text-center text-[11px] tabular-nums ${
                    bar.date === today ? 'font-bold text-[#4F46E5]' : 'text-[#64748B]'
                  }`}
                >
                  {bar.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 12-Week Study Consistency Heatmap */}
        <section className="card-surface rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A]">12-Week Consistency</h2>
              <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                {hoveredDay
                  ? `${formatShortDate(hoveredDay.date)} · ${hoveredDay.minutes}m studied`
                  : 'Hover or tap any day to inspect focus minutes'}
              </p>
            </div>
          </div>

          <div
            className="grid grid-cols-12 gap-1.5 py-2"
            onMouseLeave={() => setHoveredDay(null)}
          >
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-rows-7 gap-1.5">
                {week.map((cell) => (
                  <button
                    key={cell.date}
                    type="button"
                    onMouseEnter={() => setHoveredDay(cell)}
                    onClick={() => setHoveredDay(cell)}
                    aria-label={`${formatShortDate(cell.date)}: ${cell.minutes} minutes`}
                    className={`aspect-square w-full rounded-[4px] transition-transform hover:scale-110 ${getHeatmapCellColor(
                      cell.minutes,
                    )} ${cell.date === today ? 'ring-1 ring-[#0F172A] ring-offset-1' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
            <span>12 weeks ago</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <span className="w-3 h-3 rounded-[3px] bg-[#F1F4F9]" />
              <span className="w-3 h-3 rounded-[3px] bg-[#C7D2FE]" />
              <span className="w-3 h-3 rounded-[3px] bg-[#818CF8]" />
              <span className="w-3 h-3 rounded-[3px] bg-[#4F46E5]" />
              <span className="w-3 h-3 rounded-[3px] bg-[#10B981]" />
              <span>Goal</span>
            </div>
          </div>
        </section>
      </div>

      {/* Certification Breakdown + Workspace Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-5">
        <section className="card-surface rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-[#0F172A]">Certification Progress</h2>

          {exams.length === 0 ? (
            <p className="text-sm text-[#64748B]">Add exams in the Exams tab to track per-certification focus time.</p>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => {
                const readiness = calculateExamReadiness(exam);
                const mins = getExamLoggedMinutes(sessions, exam.id);
                const color = getReadinessColor(readiness);

                return (
                  <div key={exam.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#0F172A] truncate">
                        {exam.code} · {exam.title}
                      </span>
                      <span className="text-xs text-[#64748B] tabular-nums shrink-0 ml-2">
                        {formatMinutesAsHours(mins)} · <strong className="text-[#0F172A]">{readiness}%</strong>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#F1F4F9] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${readiness}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Daily Goal & Local Data Controls */}
        <section className="card-surface rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#0F172A]">Daily Goal & Data</h2>
            <p className="text-xs text-[#64748B] mt-0.5">Stored locally in your browser for offline use.</p>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#475569] mb-2">Daily Focus Target</span>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#F1F4F9] rounded-xl">
              {GOAL_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyGoalMinutes(mins)}
                  className={`h-9 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                    dailyGoalMinutes === mins
                      ? 'bg-white text-[#4F46E5] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#F1F4F9] flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="h-10 px-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-xs font-semibold text-[#0F172A] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={restoreSampleData}
              className="h-10 px-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Sample</span>
            </button>

            {confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    clearAllData();
                    setConfirmClear(false);
                  }}
                  className="h-10 px-3 rounded-xl bg-[#DC2626] text-white text-xs font-semibold cursor-pointer"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="h-10 px-2.5 rounded-xl text-xs font-medium text-[#64748B] hover:bg-[#F1F4F9]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="h-10 px-3.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-xs font-semibold text-[#DC2626] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
