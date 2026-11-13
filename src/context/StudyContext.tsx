import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildInitialSeedData } from '../data/seedData';
import {
  AppTab,
  Exam,
  ExamTopic,
  FocusSession,
  StudyTask,
  TimerMode,
  TimerState,
  ToastMessage,
  TopicStatus,
  WorkspacePersistedData,
} from '../types/study';
import { formatCountdownClock, getTodayString } from '../utils/dateUtils';
import { playCompletionChime } from '../utils/sound';
import { calculateStudyStreak, getDailyFocusMinutes } from '../utils/studyMetrics';

const STORAGE_KEY = 'focused_momentum_workspace_v1';

export const TIMER_MODE_DURATIONS: Record<TimerMode, { label: string; minutes: number }> = {
  focus: { label: 'Pomodoro', minutes: 25 },
  deep: { label: 'Deep Work', minutes: 50 },
  short_break: { label: 'Short Break', minutes: 5 },
  long_break: { label: 'Long Break', minutes: 15 },
};

interface StudyContextValue {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  exams: Exam[];
  tasks: StudyTask[];
  sessions: FocusSession[];
  dailyGoalMinutes: number;
  setDailyGoalMinutes: (minutes: number) => void;

  todayFocusMinutes: number;
  currentStreak: number;

  // Task operations
  addTask: (task: Omit<StudyTask, 'id' | 'completed' | 'completedAt' | 'completedPomodoros'>) => StudyTask;
  updateTask: (taskId: string, patch: Partial<StudyTask>) => void;
  toggleTaskComplete: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // Exam & Topic operations
  addExam: (exam: Omit<Exam, 'id'>) => Exam;
  updateExam: (examId: string, patch: Partial<Exam>) => void;
  deleteExam: (examId: string) => void;
  cycleTopicStatus: (examId: string, topicId: string) => void;
  setTopicStatus: (examId: string, topicId: string, status: TopicStatus) => void;
  addTopicToExam: (examId: string, topic: Omit<ExamTopic, 'id'>) => void;
  deleteTopicFromExam: (examId: string, topicId: string) => void;

  // Timer operations
  timer: TimerState;
  setTimerMode: (mode: TimerMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  completeTimerEarly: () => void;
  bindTimerTarget: (examId: string | null, taskId: string | null) => void;
  launchFocusForTask: (task: StudyTask) => void;
  launchFocusForExamTopic: (examId: string, topicName?: string) => void;
  toggleSound: () => void;

  // Quick-add sheet & modals
  taskSheetOpen: boolean;
  editingTask: StudyTask | null;
  taskPrefill: Partial<StudyTask> | null;
  openNewTaskSheet: (prefill?: Partial<StudyTask>) => void;
  openEditTaskSheet: (task: StudyTask) => void;
  closeTaskSheet: () => void;

  // Data management
  restoreSampleData: () => void;
  clearAllData: () => void;
  exportWorkspaceJson: () => string;

  // Toast feedback
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  pushToast: (title: string, detail?: string, tone?: ToastMessage['tone']) => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

function loadPersistedData(): WorkspacePersistedData {
  if (typeof window === 'undefined') {
    return buildInitialSeedData();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildInitialSeedData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<WorkspacePersistedData>;
    if (!Array.isArray(parsed.exams) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.sessions)) {
      return buildInitialSeedData();
    }
    return {
      exams: parsed.exams,
      tasks: parsed.tasks,
      sessions: parsed.sessions,
      dailyGoalMinutes: typeof parsed.dailyGoalMinutes === 'number' ? parsed.dailyGoalMinutes : 90,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
    };
  } catch {
    return buildInitialSeedData();
  }
}

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const initialData = useMemo(() => loadPersistedData(), []);

  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const [exams, setExams] = useState<Exam[]>(initialData.exams);
  const [tasks, setTasks] = useState<StudyTask[]>(initialData.tasks);
  const [sessions, setSessions] = useState<FocusSession[]>(initialData.sessions);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(initialData.dailyGoalMinutes);

  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [taskPrefill, setTaskPrefill] = useState<Partial<StudyTask> | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const firstActiveTask = useMemo(
    () => initialData.tasks.find((t) => !t.completed && t.scheduledDate === getTodayString()) ?? initialData.tasks[0] ?? null,
    [initialData.tasks],
  );

  const [timer, setTimer] = useState<TimerState>({
    mode: 'focus',
    status: 'idle',
    remainingSeconds: TIMER_MODE_DURATIONS.focus.minutes * 60,
    totalSeconds: TIMER_MODE_DURATIONS.focus.minutes * 60,
    linkedExamId: firstActiveTask?.examId ?? initialData.exams[0]?.id ?? null,
    linkedTaskId: firstActiveTask?.id ?? null,
    soundEnabled: initialData.soundEnabled,
  });

  const pushToast = useCallback((title: string, detail?: string, tone: ToastMessage['tone'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, detail, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Persist workspace changes cleanly
  useEffect(() => {
    try {
      const payload: WorkspacePersistedData = {
        exams,
        tasks,
        sessions,
        dailyGoalMinutes,
        soundEnabled: timer.soundEnabled,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [exams, tasks, sessions, dailyGoalMinutes, timer.soundEnabled]);

  // Keep refs for timer completion handler without resetting interval
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const examsRef = useRef(exams);
  examsRef.current = exams;

  const recordCompletedBlock = useCallback(
    (mode: TimerMode, elapsedMinutes: number, examId: string | null, taskId: string | null) => {
      const isFocusMode = mode === 'focus' || mode === 'deep';
      if (!isFocusMode) {
        pushToast('Break complete', 'Ready for your next focused study block.', 'info');
        return;
      }

      const safeMinutes = Math.max(1, Math.round(elapsedMinutes));
      const linkedTask = taskId ? tasksRef.current.find((t) => t.id === taskId) : null;
      const linkedExam = examId ? examsRef.current.find((e) => e.id === examId) : null;
      const label = linkedTask?.title ?? (linkedExam ? `${linkedExam.code} focused review` : 'Focused study block');

      const newSession: FocusSession = {
        id: `session-${Date.now()}`,
        startedAt: new Date().toISOString(),
        date: getTodayString(),
        durationMinutes: safeMinutes,
        mode,
        examId: examId ?? linkedTask?.examId ?? null,
        taskId,
        label,
      };

      setSessions((prev) => [newSession, ...prev]);

      if (taskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t,
          ),
        );
      }

      pushToast(`${safeMinutes} min logged`, label, 'success');
    },
    [pushToast],
  );

  // Live 1-second timer ticker
  useEffect(() => {
    if (timer.status !== 'running') return;

    const interval = window.setInterval(() => {
      setTimer((prev) => {
        if (prev.status !== 'running') return prev;
        if (prev.remainingSeconds <= 1) {
          if (prev.soundEnabled) {
            playCompletionChime();
          }
          const fullMinutes = Math.round(prev.totalSeconds / 60);
          window.setTimeout(() => {
            recordCompletedBlock(prev.mode, fullMinutes, prev.linkedExamId, prev.linkedTaskId);
          }, 0);

          return {
            ...prev,
            status: 'idle',
            remainingSeconds: prev.totalSeconds,
          };
        }
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timer.status, recordCompletedBlock]);

  // Sync browser document title while timer is active
  useEffect(() => {
    const baseTitle = 'Focused Momentum — Certification & Exam Prep Planner';
    if (timer.status === 'running') {
      const modeName = TIMER_MODE_DURATIONS[timer.mode].label;
      document.title = `${formatCountdownClock(timer.remainingSeconds)} · ${modeName} — Focused Momentum`;
    } else {
      document.title = baseTitle;
    }
  }, [timer.status, timer.remainingSeconds, timer.mode]);

  const addTask = useCallback(
    (input: Omit<StudyTask, 'id' | 'completed' | 'completedAt' | 'completedPomodoros'>) => {
      const created: StudyTask = {
        ...input,
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        completed: false,
        completedAt: null,
        completedPomodoros: 0,
      };
      setTasks((prev) => [created, ...prev]);
      pushToast('Study block added', created.title, 'success');
      return created;
    },
    [pushToast],
  );

  const updateTask = useCallback((taskId: string, patch: Partial<StudyTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }, []);

  const toggleTaskComplete = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : null,
        };
      }),
    );
  }, []);

  const deleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setTimer((prev) => (prev.linkedTaskId === taskId ? { ...prev, linkedTaskId: null } : prev));
      pushToast('Task removed', undefined, 'info');
    },
    [pushToast],
  );

  const addExam = useCallback(
    (input: Omit<Exam, 'id'>) => {
      const created: Exam = {
        ...input,
        id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      setExams((prev) => [...prev, created]);
      pushToast('Exam milestone created', `${created.code} · ${created.title}`, 'success');
      return created;
    },
    [pushToast],
  );

  const updateExam = useCallback((examId: string, patch: Partial<Exam>) => {
    setExams((prev) => prev.map((e) => (e.id === examId ? { ...e, ...patch } : e)));
  }, []);

  const deleteExam = useCallback(
    (examId: string) => {
      setExams((prev) => prev.filter((e) => e.id !== examId));
      setTasks((prev) => prev.map((t) => (t.examId === examId ? { ...t, examId: null } : t)));
      setTimer((prev) => (prev.linkedExamId === examId ? { ...prev, linkedExamId: null } : prev));
      pushToast('Exam removed', undefined, 'info');
    },
    [pushToast],
  );

  const setTopicStatus = useCallback((examId: string, topicId: string, status: TopicStatus) => {
    setExams((prev) =>
      prev.map((exam) =>
        exam.id !== examId
          ? exam
          : {
              ...exam,
              topics: exam.topics.map((topic) => (topic.id === topicId ? { ...topic, status } : topic)),
            },
      ),
    );
  }, []);

  const cycleTopicStatus = useCallback((examId: string, topicId: string) => {
    const order: TopicStatus[] = ['needs_focus', 'reviewing', 'mastered'];
    setExams((prev) =>
      prev.map((exam) =>
        exam.id !== examId
          ? exam
          : {
              ...exam,
              topics: exam.topics.map((topic) => {
                if (topic.id !== topicId) return topic;
                const nextStatus = order[(order.indexOf(topic.status) + 1) % order.length];
                return { ...topic, status: nextStatus };
              }),
            },
      ),
    );
  }, []);

  const addTopicToExam = useCallback((examId: string, topic: Omit<ExamTopic, 'id'>) => {
    const newTopic: ExamTopic = {
      ...topic,
      id: `topic-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    setExams((prev) =>
      prev.map((exam) => (exam.id === examId ? { ...exam, topics: [...exam.topics, newTopic] } : exam)),
    );
  }, []);

  const deleteTopicFromExam = useCallback((examId: string, topicId: string) => {
    setExams((prev) =>
      prev.map((exam) =>
        exam.id === examId
          ? { ...exam, topics: exam.topics.filter((topic) => topic.id !== topicId) }
          : exam,
      ),
    );
  }, []);

  const setTimerMode = useCallback((mode: TimerMode) => {
    const totalSeconds = TIMER_MODE_DURATIONS[mode].minutes * 60;
    setTimer((prev) => ({
      ...prev,
      mode,
      status: 'idle',
      totalSeconds,
      remainingSeconds: totalSeconds,
    }));
  }, []);

  const startTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, status: 'running' }));
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, status: 'paused' }));
  }, []);

  const resetTimer = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      status: 'idle',
      remainingSeconds: prev.totalSeconds,
    }));
  }, []);

  const completeTimerEarly = useCallback(() => {
    const elapsedSeconds = timer.totalSeconds - timer.remainingSeconds;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    if (timer.soundEnabled) {
      playCompletionChime();
    }
    recordCompletedBlock(timer.mode, elapsedMinutes, timer.linkedExamId, timer.linkedTaskId);
    setTimer((prev) => ({
      ...prev,
      status: 'idle',
      remainingSeconds: prev.totalSeconds,
    }));
  }, [timer, recordCompletedBlock]);

  const bindTimerTarget = useCallback((examId: string | null, taskId: string | null) => {
    setTimer((prev) => ({
      ...prev,
      linkedExamId: examId,
      linkedTaskId: taskId,
    }));
  }, []);

  const launchFocusForTask = useCallback((task: StudyTask) => {
    const duration = task.estimatedMinutes >= 45 ? 'deep' : 'focus';
    const totalSeconds = TIMER_MODE_DURATIONS[duration].minutes * 60;
    setTimer((prev) => ({
      ...prev,
      mode: duration,
      status: 'running',
      totalSeconds,
      remainingSeconds: totalSeconds,
      linkedExamId: task.examId,
      linkedTaskId: task.id,
    }));
    setActiveTab('focus');
  }, []);

  const launchFocusForExamTopic = useCallback(
    (examId: string, topicName?: string) => {
      const matchingTask = tasks.find(
        (t) => !t.completed && t.examId === examId && (!topicName || t.topicName === topicName),
      );
      const totalSeconds = TIMER_MODE_DURATIONS.focus.minutes * 60;
      setTimer((prev) => ({
        ...prev,
        mode: 'focus',
        status: 'running',
        totalSeconds,
        remainingSeconds: totalSeconds,
        linkedExamId: examId,
        linkedTaskId: matchingTask?.id ?? null,
      }));
      setActiveTab('focus');
    },
    [tasks],
  );

  const toggleSound = useCallback(() => {
    setTimer((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const openNewTaskSheet = useCallback(
    (prefill?: Partial<StudyTask>) => {
      setEditingTask(null);
      setTaskPrefill({
        scheduledDate: selectedDate,
        ...prefill,
      });
      setTaskSheetOpen(true);
    },
    [selectedDate],
  );

  const openEditTaskSheet = useCallback((task: StudyTask) => {
    setEditingTask(task);
    setTaskPrefill(null);
    setTaskSheetOpen(true);
  }, []);

  const closeTaskSheet = useCallback(() => {
    setTaskSheetOpen(false);
    setEditingTask(null);
    setTaskPrefill(null);
  }, []);

  const restoreSampleData = useCallback(() => {
    const seed = buildInitialSeedData();
    setExams(seed.exams);
    setTasks(seed.tasks);
    setSessions(seed.sessions);
    setDailyGoalMinutes(seed.dailyGoalMinutes);
    setSelectedDate(getTodayString());
    pushToast('Sample workspace restored', 'Loaded certification prep tracks and study history.', 'info');
  }, [pushToast]);

  const clearAllData = useCallback(() => {
    setExams([]);
    setTasks([]);
    setSessions([]);
    setTimer((prev) => ({
      ...prev,
      status: 'idle',
      remainingSeconds: prev.totalSeconds,
      linkedExamId: null,
      linkedTaskId: null,
    }));
    pushToast('Workspace cleared', 'Ready for a fresh study plan.', 'info');
  }, [pushToast]);

  const exportWorkspaceJson = useCallback(() => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        exams,
        tasks,
        sessions,
        dailyGoalMinutes,
      },
      null,
      2,
    );
  }, [exams, tasks, sessions, dailyGoalMinutes]);

  const todayFocusMinutes = useMemo(
    () => getDailyFocusMinutes(sessions, getTodayString()),
    [sessions],
  );

  const currentStreak = useMemo(
    () => calculateStudyStreak(sessions, tasks),
    [sessions, tasks],
  );

  const value: StudyContextValue = {
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    exams,
    tasks,
    sessions,
    dailyGoalMinutes,
    setDailyGoalMinutes,
    todayFocusMinutes,
    currentStreak,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    addExam,
    updateExam,
    deleteExam,
    cycleTopicStatus,
    setTopicStatus,
    addTopicToExam,
    deleteTopicFromExam,
    timer,
    setTimerMode,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimerEarly,
    bindTimerTarget,
    launchFocusForTask,
    launchFocusForExamTopic,
    toggleSound,
    taskSheetOpen,
    editingTask,
    taskPrefill,
    openNewTaskSheet,
    openEditTaskSheet,
    closeTaskSheet,
    restoreSampleData,
    clearAllData,
    exportWorkspaceJson,
    toasts,
    dismissToast,
    pushToast,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) {
    throw new Error('useStudy must be used within StudyProvider');
  }
  return ctx;
}
