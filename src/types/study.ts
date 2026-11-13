export type AppTab = 'today' | 'exams' | 'focus' | 'analytics';

export type TopicStatus = 'needs_focus' | 'reviewing' | 'mastered';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TimerMode = 'focus' | 'deep' | 'short_break' | 'long_break';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface ExamTopic {
  id: string;
  name: string;
  weightPct: number;
  status: TopicStatus;
}

export interface Exam {
  id: string;
  title: string;
  code: string;
  provider: string;
  targetDate: string; // YYYY-MM-DD
  accentColor: string;
  topics: ExamTopic[];
}

export interface StudyTask {
  id: string;
  title: string;
  examId: string | null;
  topicName: string;
  scheduledDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  estimatedMinutes: number;
  targetPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  completedAt: string | null;
  notes?: string;
}

export interface FocusSession {
  id: string;
  startedAt: string; // ISO string
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  mode: TimerMode;
  examId: string | null;
  taskId: string | null;
  label: string;
}

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  totalSeconds: number;
  linkedExamId: string | null;
  linkedTaskId: string | null;
  soundEnabled: boolean;
}

export interface WorkspacePersistedData {
  exams: Exam[];
  tasks: StudyTask[];
  sessions: FocusSession[];
  dailyGoalMinutes: number;
  soundEnabled: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  tone?: 'success' | 'info' | 'warning';
}
