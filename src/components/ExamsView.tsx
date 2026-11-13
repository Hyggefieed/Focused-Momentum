import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { Exam } from '../types/study';
import { daysUntilDate, formatMinutesAsHours, formatShortDate } from '../utils/dateUtils';
import { calculateExamReadiness, getExamLoggedMinutes, getReadinessColor } from '../utils/studyMetrics';
import { ExamDetailModal } from './ExamDetailModal';
import { ExamModal } from './ExamModal';
import { ProgressRing } from './ProgressRing';

export const ExamsView: React.FC = () => {
  const {
    exams,
    sessions,
    deleteExam,
    openNewTaskSheet,
    launchFocusForExamTopic,
  } = useStudy();

  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [detailExamId, setDetailExamId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const detailExam = useMemo(
    () => exams.find((e) => e.id === detailExamId) ?? null,
    [exams, detailExamId],
  );

  const avgReadiness = useMemo(() => {
    if (exams.length === 0) return 0;
    const sum = exams.reduce((acc, ex) => acc + calculateExamReadiness(ex), 0);
    return Math.round(sum / exams.length);
  }, [exams]);

  const totalWeakTopics = useMemo(() => {
    return exams.reduce(
      (acc, ex) => acc + ex.topics.filter((t) => t.status === 'needs_focus').length,
      0,
    );
  }, [exams]);

  return (
    <div className="space-y-5">
      {/* Top Overview Bar */}
      <section className="card-surface rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A]">
            Certification Milestones
          </h2>
          <p className="text-sm text-[#64748B] tabular-nums">
            {exams.length} active {exams.length === 1 ? 'exam' : 'exams'} · {avgReadiness}% average readiness ·{' '}
            {totalWeakTopics} {totalWeakTopics === 1 ? 'domain needs' : 'domains need'} focus
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingExam(null);
            setExamModalOpen(true);
          }}
          className="h-11 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </button>
      </section>

      {/* Exam Cards Grid */}
      {exams.length === 0 ? (
        <section className="card-surface rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-[#0F172A]">No certification exams tracked</h3>
          <p className="text-sm text-[#64748B] max-w-md mx-auto">
            Add your target exam date and syllabus domains to calculate weighted readiness and pinpoint weak topics.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingExam(null);
              setExamModalOpen(true);
            }}
            className="h-11 px-5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Exam</span>
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {exams.map((exam) => {
            const readiness = calculateExamReadiness(exam);
            const ringColor = getReadinessColor(readiness);
            const daysLeft = daysUntilDate(exam.targetDate);
            const loggedMins = getExamLoggedMinutes(sessions, exam.id);

            const masteredCount = exam.topics.filter((t) => t.status === 'mastered').length;
            const reviewingCount = exam.topics.filter((t) => t.status === 'reviewing').length;
            const needsFocusTopics = exam.topics.filter((t) => t.status === 'needs_focus');

            return (
              <article key={exam.id} className="card-surface rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  {/* Card Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                        <span className="font-semibold text-[#0F172A]">{exam.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{exam.provider}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold tabular-nums ${
                            daysLeft <= 14 && daysLeft >= 0 ? 'text-[#D97706]' : 'text-[#475569]'
                          }`}
                        >
                          {daysLeft > 0
                            ? `${daysLeft} days left`
                            : daysLeft === 0
                              ? 'Exam today'
                              : 'Date passed'}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-[#0F172A] mt-1 leading-snug">
                        {exam.title}
                      </h3>

                      <p className="text-xs text-[#64748B] mt-1 tabular-nums">
                        Target {formatShortDate(exam.targetDate)} · {formatMinutesAsHours(loggedMins)} studied
                      </p>
                    </div>

                    <ProgressRing
                      percentage={readiness}
                      size={74}
                      strokeWidth={6}
                      color={ringColor}
                      subLabel="Ready"
                    />
                  </div>

                  {/* Topic Mastery Breakdown Bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#64748B] tabular-nums">
                      <span>
                        {masteredCount} mastered · {reviewingCount} reviewing · {needsFocusTopics.length} needs focus
                      </span>
                      <span className="font-semibold text-[#0F172A]">{exam.topics.length} domains</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#F1F4F9] overflow-hidden flex">
                      {exam.topics.map((tp) => {
                        const color =
                          tp.status === 'mastered'
                            ? '#10B981'
                            : tp.status === 'reviewing'
                              ? '#4F46E5'
                              : '#F59E0B';
                        return (
                          <div
                            key={tp.id}
                            style={{ width: `${tp.weightPct}%`, backgroundColor: color }}
                            className="h-full border-r border-white/70 last:border-r-0 transition-all duration-300"
                            title={`${tp.name}: ${tp.status.replace('_', ' ')}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Segregated Bottom Drawer: Needs Focus Diagnostic */}
                  <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                    {needsFocusTopics.length > 0 ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D97706]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Needs Focus</span>
                        </div>
                        <ul className="space-y-2">
                          {needsFocusTopics.slice(0, 2).map((tp) => (
                            <li
                              key={tp.id}
                              className="flex items-center justify-between gap-2 text-sm"
                            >
                              <span className="text-[#0F172A] font-medium truncate">
                                {tp.name}
                                <span className="text-xs text-[#64748B] ml-1.5 tabular-nums">({tp.weightPct}%)</span>
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openNewTaskSheet({
                                      examId: exam.id,
                                      topicName: tp.name,
                                      title: `Review ${tp.name}`,
                                      priority: 'high',
                                    })
                                  }
                                  className="h-8 px-2.5 rounded-lg text-xs font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F4F9] inline-flex items-center gap-1"
                                >
                                  <CalendarPlus className="w-3.5 h-3.5" />
                                  <span>Plan</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => launchFocusForExamTopic(exam.id, tp.name)}
                                  className="h-8 px-2.5 rounded-lg text-xs font-semibold text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] inline-flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Focus</span>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        {needsFocusTopics.length > 2 && (
                          <p className="text-xs text-[#64748B]">
                            +{needsFocusTopics.length - 2} more domain in syllabus
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-medium text-[#059669]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>No critical weak domains — keep up spaced review blocks.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-[#F1F4F9] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailExamId(exam.id)}
                    className="h-10 px-3 -ml-2 rounded-xl text-sm font-semibold text-[#4F46E5] hover:bg-[#EEF2FF] inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Manage Syllabus</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExam(exam);
                        setExamModalOpen(true);
                      }}
                      aria-label={`Edit ${exam.title}`}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F4F9]"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {confirmDeleteId === exam.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteExam(exam.id);
                            setConfirmDeleteId(null);
                          }}
                          className="h-9 px-2.5 rounded-lg bg-[#DC2626] text-white text-xs font-semibold"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-9 px-2 rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F1F4F9]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(exam.id)}
                        aria-label={`Delete ${exam.title}`}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ExamModal
        open={examModalOpen}
        editingExam={editingExam}
        onClose={() => {
          setExamModalOpen(false);
          setEditingExam(null);
        }}
      />

      <ExamDetailModal exam={detailExam} onClose={() => setDetailExamId(null)} />
    </div>
  );
};
