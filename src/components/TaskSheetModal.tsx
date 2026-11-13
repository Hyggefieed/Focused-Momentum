import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { TaskPriority } from '../types/study';
import { getTodayString } from '../utils/dateUtils';

const DURATION_OPTIONS = [
  { label: '25m · 1 block', minutes: 25, blocks: 1 },
  { label: '50m · 2 blocks', minutes: 50, blocks: 2 },
  { label: '75m · 3 blocks', minutes: 75, blocks: 3 },
];

export const TaskSheetModal: React.FC = () => {
  const {
    taskSheetOpen,
    editingTask,
    taskPrefill,
    closeTaskSheet,
    exams,
    addTask,
    updateTask,
    selectedDate,
  } = useStudy();

  const [title, setTitle] = useState('');
  const [examId, setExamId] = useState<string>('');
  const [topicName, setTopicName] = useState('');
  const [scheduledDate, setScheduledDate] = useState(getTodayString());
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!taskSheetOpen) return;

    if (editingTask) {
      setTitle(editingTask.title);
      setExamId(editingTask.examId ?? '');
      setTopicName(editingTask.topicName);
      setScheduledDate(editingTask.scheduledDate);
      setPriority(editingTask.priority);
      setEstimatedMinutes(editingTask.estimatedMinutes);
      setNotes(editingTask.notes ?? '');
    } else {
      const defaultExamId = taskPrefill?.examId ?? exams[0]?.id ?? '';
      const linkedExam = exams.find((e) => e.id === defaultExamId);
      setTitle(taskPrefill?.title ?? '');
      setExamId(defaultExamId);
      setTopicName(taskPrefill?.topicName ?? linkedExam?.topics[0]?.name ?? 'General Review');
      setScheduledDate(taskPrefill?.scheduledDate ?? selectedDate ?? getTodayString());
      setPriority(taskPrefill?.priority ?? 'medium');
      setEstimatedMinutes(taskPrefill?.estimatedMinutes ?? 25);
      setNotes(taskPrefill?.notes ?? '');
    }
    setError('');
  }, [taskSheetOpen, editingTask, taskPrefill, exams, selectedDate]);

  useEffect(() => {
    if (!taskSheetOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTaskSheet();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [taskSheetOpen, closeTaskSheet]);

  if (!taskSheetOpen) return null;

  const selectedExam = exams.find((e) => e.id === examId) ?? null;

  const handleExamChange = (nextExamId: string) => {
    setExamId(nextExamId);
    const found = exams.find((e) => e.id === nextExamId);
    if (found && found.topics.length > 0) {
      setTopicName(found.topics[0].name);
    } else {
      setTopicName('General Review');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Enter a short description for this study task.');
      return;
    }

    const blocks = Math.max(1, Math.round(estimatedMinutes / 25));

    if (editingTask) {
      updateTask(editingTask.id, {
        title: trimmed,
        examId: examId || null,
        topicName: topicName.trim() || 'General Review',
        scheduledDate,
        priority,
        estimatedMinutes,
        targetPomodoros: blocks,
        notes: notes.trim() || undefined,
      });
    } else {
      addTask({
        title: trimmed,
        examId: examId || null,
        topicName: topicName.trim() || 'General Review',
        scheduledDate,
        priority,
        estimatedMinutes,
        targetPomodoros: blocks,
        notes: notes.trim() || undefined,
      });
    }

    closeTaskSheet();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0F172A]/40 backdrop-blur-[4px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeTaskSheet();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-sheet-title"
    >
      <div className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl border border-[#E5E7EB] shadow-[0_20px_25px_-5px_rgba(15,23,42,0.12)] max-h-[90vh] overflow-y-auto">
        {/* Mobile Drag Handle */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[#CBD5E1]" />
        </div>

        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 id="task-sheet-title" className="font-display text-lg font-bold text-[#0F172A]">
            {editingTask ? 'Edit Study Task' : 'New Study Block'}
          </h2>
          <button
            type="button"
            onClick={closeTaskSheet}
            aria-label="Close dialog"
            className="w-10 h-10 -mr-2 rounded-xl flex items-center justify-center text-[#64748B] hover:bg-[#F1F4F9] hover:text-[#0F172A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-xs font-semibold text-[#475569] mb-1.5">
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Practice VPC peering & Transit Gateway scenarios"
              className="w-full h-12 px-3.5 rounded-xl input-surface text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
              autoFocus
            />
            {error && <p className="text-xs font-medium text-[#DC2626] mt-1.5">{error}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-exam" className="block text-xs font-semibold text-[#475569] mb-1.5">
                Certification / Exam
              </label>
              <select
                id="task-exam"
                value={examId}
                onChange={(e) => handleExamChange(e.target.value)}
                className="w-full h-12 px-3 rounded-xl input-surface text-sm text-[#0F172A]"
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
              <label htmlFor="task-date" className="block text-xs font-semibold text-[#475569] mb-1.5">
                Scheduled Date
              </label>
              <input
                id="task-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full h-12 px-3 rounded-xl input-surface text-sm text-[#0F172A] tabular-nums"
              />
            </div>
          </div>

          <div>
            <label htmlFor="task-topic" className="block text-xs font-semibold text-[#475569] mb-1.5">
              Syllabus Domain / Topic
            </label>
            {selectedExam && selectedExam.topics.length > 0 ? (
              <select
                id="task-topic"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full h-12 px-3 rounded-xl input-surface text-sm text-[#0F172A]"
              >
                {selectedExam.topics.map((tp) => (
                  <option key={tp.id} value={tp.name}>
                    {tp.name}
                  </option>
                ))}
                <option value="Mock Exam & Timed Review">Mock Exam & Timed Review</option>
              </select>
            ) : (
              <input
                id="task-topic"
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g., Core Principles"
                className="w-full h-12 px-3.5 rounded-xl input-surface text-sm text-[#0F172A]"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-[#475569] mb-1.5">Priority</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F4F9] rounded-xl">
                {(['high', 'medium', 'low'] as TaskPriority[]).map((level) => {
                  const active = priority === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={`h-10 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        active
                          ? 'bg-white text-[#0F172A] shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#475569] mb-1.5">Focus Estimate</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F4F9] rounded-xl">
                {DURATION_OPTIONS.map((opt) => {
                  const active = estimatedMinutes === opt.minutes;
                  return (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => setEstimatedMinutes(opt.minutes)}
                      className={`h-10 rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                        active
                          ? 'bg-white text-[#4F46E5] shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      {opt.minutes}m
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="task-notes" className="block text-xs font-semibold text-[#475569] mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              id="task-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key chapters, lab URLs, or weak concepts to review..."
              className="w-full p-3 rounded-xl input-surface text-sm text-[#0F172A] placeholder:text-[#94A3B8] resize-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={closeTaskSheet}
              className="flex-1 h-12 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-sm font-semibold text-[#475569] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[1.5] h-12 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {editingTask ? 'Save Changes' : 'Add Study Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
