import React, { useEffect, useState } from 'react';
import { CalendarPlus, Play, Plus, Trash2, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { Exam, TopicStatus } from '../types/study';
import { daysUntilDate, formatShortDate } from '../utils/dateUtils';
import { calculateExamReadiness, getReadinessColor } from '../utils/studyMetrics';
import { ProgressRing } from './ProgressRing';

interface ExamDetailModalProps {
  exam: Exam | null;
  onClose: () => void;
}

const STATUS_OPTIONS: Array<{ value: TopicStatus; label: string }> = [
  { value: 'needs_focus', label: 'Needs Focus' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'mastered', label: 'Mastered' },
];

export const ExamDetailModal: React.FC<ExamDetailModalProps> = ({ exam, onClose }) => {
  const {
    setTopicStatus,
    addTopicToExam,
    deleteTopicFromExam,
    openNewTaskSheet,
    launchFocusForExamTopic,
  } = useStudy();

  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicWeight, setNewTopicWeight] = useState(20);

  useEffect(() => {
    if (!exam) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exam, onClose]);

  if (!exam) return null;

  const readiness = calculateExamReadiness(exam);
  const ringColor = getReadinessColor(readiness);
  const daysLeft = daysUntilDate(exam.targetDate);

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTopicName.trim();
    if (!trimmed) return;
    addTopicToExam(exam.id, {
      name: trimmed,
      weightPct: Math.max(5, Math.min(100, newTopicWeight)),
      status: 'needs_focus',
    });
    setNewTopicName('');
    setNewTopicWeight(20);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0F172A]/40 backdrop-blur-[4px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-detail-title"
    >
      <div className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl border border-[#E5E7EB] shadow-[0_20px_25px_-5px_rgba(15,23,42,0.12)] max-h-[90vh] flex flex-col">
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[#CBD5E1]" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <ProgressRing percentage={readiness} size={56} strokeWidth={5} color={ringColor} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">{exam.code}</span>
                <span aria-hidden="true">·</span>
                <span>{exam.provider}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {daysLeft >= 0 ? `${daysLeft}d left` : 'Exam passed'} ({formatShortDate(exam.targetDate)})
                </span>
              </div>
              <h2 id="exam-detail-title" className="font-display text-lg font-bold text-[#0F172A] truncate mt-0.5">
                {exam.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close syllabus drawer"
            className="w-10 h-10 -mr-2 rounded-xl flex items-center justify-center text-[#64748B] hover:bg-[#F1F4F9] shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Syllabus Breakdown */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#0F172A]">
              Syllabus Domains ({exam.topics.length})
            </h3>
            <span className="text-xs text-[#64748B]">Tap a status to update exam readiness</span>
          </div>

          <div className="border border-[#E5E7EB] rounded-2xl divide-y divide-[#E5E7EB] bg-white">
            {exam.topics.map((topic) => (
              <div key={topic.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] leading-snug">{topic.name}</p>
                    <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                      Blueprint weight: {topic.weightPct}%
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        openNewTaskSheet({
                          examId: exam.id,
                          topicName: topic.name,
                          title: `Review ${topic.name}`,
                          priority: topic.status === 'needs_focus' ? 'high' : 'medium',
                        });
                      }}
                      title="Schedule study task"
                      className="h-9 px-2.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#4F46E5] hover:bg-[#F1F4F9] inline-flex items-center gap-1"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Plan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        launchFocusForExamTopic(exam.id, topic.name);
                      }}
                      title="Start focus timer"
                      className="h-9 px-2.5 rounded-lg text-xs font-medium text-[#4F46E5] hover:bg-[#EEF2FF] inline-flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Focus</span>
                    </button>
                    {exam.topics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteTopicFromExam(exam.id, topic.id)}
                        aria-label={`Delete ${topic.name}`}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Segmented Mastery Control */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1F4F9] rounded-xl">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = topic.status === opt.value;
                    let activeStyle = 'bg-white text-[#0F172A] shadow-xs';
                    if (active && opt.value === 'needs_focus') {
                      activeStyle = 'bg-white text-[#D97706] shadow-xs';
                    } else if (active && opt.value === 'reviewing') {
                      activeStyle = 'bg-white text-[#4F46E5] shadow-xs';
                    } else if (active && opt.value === 'mastered') {
                      activeStyle = 'bg-white text-[#059669] shadow-xs';
                    }

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTopicStatus(exam.id, topic.id, opt.value)}
                        className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
                          active ? activeStyle : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Domain Inline Form */}
          <form onSubmit={handleAddTopic} className="pt-2">
            <label htmlFor="new-domain-name" className="block text-xs font-semibold text-[#475569] mb-1.5">
              Add Syllabus Domain
            </label>
            <div className="flex items-center gap-2">
              <input
                id="new-domain-name"
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="e.g., Cost Optimization & Billing Controls"
                className="flex-1 h-11 px-3.5 rounded-xl input-surface text-sm text-[#0F172A]"
              />
              <input
                type="number"
                min={5}
                max={100}
                value={newTopicWeight}
                onChange={(e) => setNewTopicWeight(Number(e.target.value))}
                className="w-16 h-11 px-2 rounded-xl input-surface text-sm text-center tabular-nums"
                aria-label="Weight percentage"
              />
              <button
                type="submit"
                className="h-11 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
