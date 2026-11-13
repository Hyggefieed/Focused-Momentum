import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarPlus,
  Check,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { StudyTask } from '../types/study';
import {
  addDaysToDateString,
  daysUntilDate,
  formatCountdownClock,
  formatDayPill,
  formatFullDate,
  getTodayString,
} from '../utils/dateUtils';
import { calculateExamReadiness, getReadinessColor } from '../utils/studyMetrics';
import { ProgressRing } from './ProgressRing';

type TaskFilter = 'all' | 'remaining' | 'completed';

export const TodayView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    tasks,
    exams,
    todayFocusMinutes,
    dailyGoalMinutes,
    toggleTaskComplete,
    deleteTask,
    openNewTaskSheet,
    openEditTaskSheet,
    launchFocusForTask,
    setActiveTab,
    timer,
    startTimer,
    pauseTimer,
  } = useStudy();

  const [filter, setFilter] = useState<TaskFilter>('all');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const today = getTodayString();

  // 7-day date strip centered around today (-2 to +4 days)
  const dateStrip = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDaysToDateString(today, i - 2));
  }, [today]);

  const examMap = useMemo(() => {
    const map = new Map<string, (typeof exams)[number]>();
    for (const ex of exams) map.set(ex.id, ex);
    return map;
  }, [exams]);

  const tasksForDay = useMemo(() => {
    return tasks.filter((t) => t.scheduledDate === selectedDate);
  }, [tasks, selectedDate]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasksForDay
      .filter((t) => {
        if (filter === 'remaining' && t.completed) return false;
        if (filter === 'completed' && !t.completed) return false;
        if (examFilter !== 'all' && t.examId !== examFilter) return false;
        if (q) {
          const exam = t.examId ? examMap.get(t.examId) : null;
          const haystack = `${t.title} ${t.topicName} ${exam?.code ?? ''} ${exam?.title ?? ''}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const rank = { high: 0, medium: 1, low: 2 };
        return rank[a.priority] - rank[b.priority];
      });
  }, [tasksForDay, filter, examFilter, searchQuery, examMap]);

  const completedCount = tasksForDay.filter((t) => t.completed).length;
  const totalCount = tasksForDay.length;
  const dayCompletionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const topNextTask = useMemo(() => {
    return (
      tasks.find((t) => !t.completed && t.scheduledDate === today) ??
      tasks.find((t) => !t.completed) ??
      null
    );
  }, [tasks, today]);

  const renderPriorityLabel = (priority: StudyTask['priority']) => {
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[#DC2626] font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          High priority
        </span>
      );
    }
    if (priority === 'medium') {
      return <span className="text-[#D97706] font-medium">Medium priority</span>;
    }
    return <span className="text-[#64748B]">Standard</span>;
  };

  return (
    <div className="space-y-5">
      {/* Horizontal 7-Day Date Scroller */}
      <section aria-label="Study schedule dates" className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {dateStrip.map((dateStr) => {
          const { weekday, dayNum, isToday } = formatDayPill(dateStr);
          const isSelected = dateStr === selectedDate;
          const dayTasks = tasks.filter((t) => t.scheduledDate === dateStr);
          const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.completed);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`min-w-[64px] sm:min-w-[74px] flex-1 py-2.5 px-3 rounded-2xl border text-center transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                isSelected
                  ? 'bg-[#0F172A] border-[#0F172A] text-white'
                  : 'bg-white border-[#E5E7EB] text-[#475569] hover:border-[#CBD5E1]'
              }`}
            >
              <span
                className={`text-[11px] font-semibold tracking-wide ${
                  isSelected ? 'text-[#CBD5E1]' : 'text-[#64748B]'
                }`}
              >
                {isToday ? 'Today' : weekday}
              </span>
              <span className="font-display text-base font-bold tabular-nums leading-tight">{dayNum}</span>
              <span className="h-1.5 flex items-center justify-center mt-0.5">
                {dayTasks.length > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      allDone
                        ? 'bg-[#10B981]'
                        : isSelected
                          ? 'bg-[#818CF8]'
                          : 'bg-[#4F46E5]'
                    }`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </section>

      {/* Responsive 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-5 items-start">
        {/* Left Column: Daily Action Stream */}
        <div className="space-y-4">
          {/* Daily Progress Card */}
          <section className="card-surface rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#64748B]">
                  {formatFullDate(selectedDate)}
                </p>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] mt-0.5">
                  {totalCount === 0
                    ? 'No study blocks scheduled'
                    : completedCount === totalCount
                      ? 'All planned blocks complete'
                      : `${totalCount - completedCount} study ${totalCount - completedCount === 1 ? 'block' : 'blocks'} remaining`}
                </h2>
              </div>

              <div className="text-right shrink-0">
                <span className="font-display text-2xl font-bold text-[#0F172A] tabular-nums">
                  {dayCompletionPct}%
                </span>
                <p className="text-xs text-[#64748B] tabular-nums">
                  {completedCount} of {totalCount} done
                </p>
              </div>
            </div>

            <div className="mt-3.5 h-2 w-full rounded-full bg-[#F1F4F9] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${dayCompletionPct}%`,
                  backgroundColor: dayCompletionPct === 100 && totalCount > 0 ? '#10B981' : '#4F46E5',
                }}
              />
            </div>
          </section>

          {/* Search & Filter Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, topics, or exam codes..."
                  aria-label="Search study tasks"
                  className="w-full h-12 pl-10 pr-4 rounded-xl input-surface text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>

              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                aria-label="Filter by certification"
                className="h-12 px-3.5 rounded-xl input-surface text-sm font-medium text-[#0F172A] sm:w-44"
              >
                <option value="all">All Exams</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center p-1 bg-[#F1F4F9] rounded-xl" role="tablist" aria-label="Task status filter">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'remaining', label: 'Remaining' },
                    { id: 'completed', label: 'Completed' },
                  ] as const
                ).map((tab) => {
                  const active = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilter(tab.id)}
                      className={`px-3.5 h-9 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => openNewTaskSheet({ scheduledDate: selectedDate })}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] hover:text-[#3525CD] px-2 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add block for {formatDayPill(selectedDate).isToday ? 'today' : formatDayPill(selectedDate).weekday}</span>
              </button>
            </div>
          </div>

          {/* Task Stream List */}
          <section className="card-surface rounded-2xl overflow-hidden">
            {filteredTasks.length === 0 ? (
              <div className="p-8 sm:p-10 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="font-display text-base font-bold text-[#0F172A]">
                    {tasksForDay.length === 0 ? 'Nothing scheduled for this day' : 'No matching tasks'}
                  </p>
                  <p className="text-sm text-[#64748B]">
                    {tasksForDay.length === 0
                      ? 'Add a focused 25m or 50m study block linked to one of your exam domains.'
                      : 'Try clearing your search filter or switching to All tasks.'}
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-center gap-2">
                  {tasksForDay.length > 0 && (filter !== 'all' || examFilter !== 'all' || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilter('all');
                        setExamFilter('all');
                        setSearchQuery('');
                      }}
                      className="h-10 px-4 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#475569] hover:bg-[#F8F9FA]"
                    >
                      Reset Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openNewTaskSheet({ scheduledDate: selectedDate })}
                    className="h-10 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Schedule Study Block</span>
                  </button>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[#E5E7EB]">
                {filteredTasks.map((task) => {
                  const linkedExam = task.examId ? examMap.get(task.examId) : null;
                  return (
                    <li
                      key={task.id}
                      className={`px-4 py-3.5 sm:px-5 flex items-start gap-2 sm:gap-3 transition-colors ${
                        task.completed ? 'bg-[#F8F9FA]/70' : 'bg-white hover:bg-[#F8F9FA]/50'
                      }`}
                    >
                      {/* 44x44 tap hitbox around 22px circular checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleTaskComplete(task.id)}
                        aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
                        className="w-11 h-11 -ml-2 -mt-1.5 flex items-center justify-center shrink-0 rounded-full cursor-pointer group"
                      >
                        <span
                          className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all duration-150 ${
                            task.completed
                              ? 'bg-[#10B981] border-[1.5px] border-[#10B981] text-white scale-100'
                              : 'border-[1.5px] border-[#CBD5E1] bg-white group-hover:border-[#4F46E5]'
                          }`}
                        >
                          {task.completed && <Check className="w-3.5 h-3.5 stroke-[2.75]" />}
                        </span>
                      </button>

                      {/* Task Details */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p
                          className={`text-[15px] font-medium leading-snug transition-colors ${
                            task.completed ? 'line-through text-[#94A3B8]' : 'text-[#0F172A]'
                          }`}
                        >
                          {task.title}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
                          {linkedExam && (
                            <>
                              <span className="font-semibold text-[#4F46E5]">{linkedExam.code}</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span className="truncate max-w-[220px]">{task.topicName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{task.estimatedMinutes}m</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {task.completedPomodoros}/{task.targetPomodoros} blocks
                          </span>
                          {!task.completed && (
                            <>
                              <span aria-hidden="true">·</span>
                              {renderPriorityLabel(task.priority)}
                            </>
                          )}
                        </div>

                        {task.notes && !task.completed && (
                          <p className="mt-1.5 text-xs text-[#64748B] line-clamp-1">{task.notes}</p>
                        )}
                      </div>

                      {/* Inline Action Controls */}
                      <div className="flex items-center gap-0.5 shrink-0 -mr-1">
                        {!task.completed && (
                          <button
                            type="button"
                            onClick={() => launchFocusForTask(task)}
                            title="Start Focus Timer on this task"
                            aria-label={`Start focus timer for ${task.title}`}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditTaskSheet(task)}
                          title="Edit task"
                          aria-label={`Edit ${task.title}`}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F4F9] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          title="Delete task"
                          aria-label={`Delete ${task.title}`}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Right Column: Focus Snapshot & Exam Readiness */}
        <aside className="space-y-4">
          {/* Focus Quick-Launch Card */}
          <section className="card-surface rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#0F172A]">Focus Session</h3>
                <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                  {todayFocusMinutes} / {dailyGoalMinutes} min logged today
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('focus')}
                className="text-xs font-semibold text-[#4F46E5] hover:text-[#3525CD] inline-flex items-center gap-1"
              >
                <span>Open Timer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {timer.status !== 'idle' ? (
              <div className="p-4 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#3525CD]">
                    {timer.status === 'running' ? 'Focus in progress' : 'Focus paused'}
                  </p>
                  <p className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums mt-0.5">
                    {formatCountdownClock(timer.remainingSeconds)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={timer.status === 'running' ? pauseTimer : startTimer}
                  className="h-11 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold"
                >
                  {timer.status === 'running' ? 'Pause' : 'Resume'}
                </button>
              </div>
            ) : topNextTask ? (
              <div className="space-y-3">
                <div className="pt-1 border-t border-[#F1F4F9]">
                  <p className="text-[11px] font-semibold text-[#64748B]">Up next</p>
                  <p className="text-sm font-semibold text-[#0F172A] mt-0.5 line-clamp-2">
                    {topNextTask.title}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">
                    {topNextTask.topicName} · {topNextTask.estimatedMinutes}m
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => launchFocusForTask(topNextTask)}
                  className="w-full h-12 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start {topNextTask.estimatedMinutes >= 45 ? '50m Deep' : '25m'} Focus</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('focus')}
                className="w-full h-12 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Free Focus Block</span>
              </button>
            )}
          </section>

          {/* Exam Readiness Snapshot Card */}
          <section className="card-surface rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#0F172A]">Exam Readiness</h3>
              <button
                type="button"
                onClick={() => setActiveTab('exams')}
                className="text-xs font-semibold text-[#4F46E5] hover:text-[#3525CD] inline-flex items-center gap-1"
              >
                <span>All Exams</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {exams.length === 0 ? (
              <p className="text-sm text-[#64748B]">
                No certifications added yet. Open the Exams tab to add your next test milestone.
              </p>
            ) : (
              <div className="divide-y divide-[#F1F4F9]">
                {exams.map((exam) => {
                  const pct = calculateExamReadiness(exam);
                  const daysLeft = daysUntilDate(exam.targetDate);
                  const weakTopic = exam.topics.find((t) => t.status === 'needs_focus');

                  return (
                    <div key={exam.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3.5">
                      <ProgressRing
                        percentage={pct}
                        size={50}
                        strokeWidth={5}
                        color={getReadinessColor(pct)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">{exam.code}</p>
                          <span className="text-xs font-medium text-[#64748B] tabular-nums shrink-0">
                            {daysLeft >= 0 ? `${daysLeft}d left` : 'Passed'}
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] truncate">{exam.title}</p>
                        {weakTopic && (
                          <p className="text-[11px] font-medium text-[#D97706] truncate mt-0.5">
                            Focus: {weakTopic.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};
