import { Exam, FocusSession, StudyTask, TopicStatus } from '../types/study';
import { addDaysToDateString, getTodayString } from './dateUtils';

const STATUS_SCORE: Record<TopicStatus, number> = {
  mastered: 1,
  reviewing: 0.55,
  needs_focus: 0.15,
};

export function calculateExamReadiness(exam: Exam): number {
  if (!exam.topics.length) return 0;
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const topic of exam.topics) {
    const w = Math.max(1, topic.weightPct || 1);
    totalWeight += w;
    earnedWeight += w * STATUS_SCORE[topic.status];
  }

  return Math.round((earnedWeight / totalWeight) * 100);
}

export function getReadinessColor(pct: number): string {
  if (pct >= 70) return '#10B981'; // Emerald Readiness
  if (pct >= 45) return '#4F46E5'; // Indigo Momentum
  return '#F59E0B'; // Amber Attention
}

export function getTopicStatusMeta(status: TopicStatus): {
  label: string;
  textClass: string;
  dotClass: string;
  surfaceClass: string;
} {
  switch (status) {
    case 'mastered':
      return {
        label: 'Mastered',
        textClass: 'text-[#059669]',
        dotClass: 'bg-[#10B981]',
        surfaceClass: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
      };
    case 'reviewing':
      return {
        label: 'Reviewing',
        textClass: 'text-[#4F46E5]',
        dotClass: 'bg-[#4F46E5]',
        surfaceClass: 'bg-[#EEF2FF] text-[#4F46E5] border-[#E0E7FF]',
      };
    case 'needs_focus':
      return {
        label: 'Needs Focus',
        textClass: 'text-[#D97706]',
        dotClass: 'bg-[#F59E0B]',
        surfaceClass: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      };
  }
}

export function getDailyFocusMinutes(sessions: FocusSession[], dateStr: string): number {
  return sessions
    .filter((s) => s.date === dateStr && (s.mode === 'focus' || s.mode === 'deep'))
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

export function calculateStudyStreak(sessions: FocusSession[], tasks: StudyTask[]): number {
  const activeDates = new Set<string>();

  for (const s of sessions) {
    if (s.mode === 'focus' || s.mode === 'deep') {
      activeDates.add(s.date);
    }
  }
  for (const t of tasks) {
    if (t.completed && t.completedAt) {
      activeDates.add(t.completedAt.slice(0, 10));
    }
  }

  const today = getTodayString();
  let cursor = activeDates.has(today) ? today : addDaysToDateString(today, -1);
  if (!activeDates.has(cursor)) return 0;

  let streak = 0;
  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDaysToDateString(cursor, -1);
  }
  return streak;
}

export function getExamLoggedMinutes(sessions: FocusSession[], examId: string): number {
  return sessions
    .filter((s) => s.examId === examId && (s.mode === 'focus' || s.mode === 'deep'))
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}
