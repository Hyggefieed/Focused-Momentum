/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { AppShell } from './components/AppShell';
import { ExamsView } from './components/ExamsView';
import { FocusTimerView } from './components/FocusTimerView';
import { TaskSheetModal } from './components/TaskSheetModal';
import { TodayView } from './components/TodayView';
import { StudyProvider, useStudy } from './context/StudyContext';

const ActiveScreen: React.FC = () => {
  const { activeTab } = useStudy();

  return (
    <AppShell>
      {activeTab === 'today' && <TodayView />}
      {activeTab === 'exams' && <ExamsView />}
      {activeTab === 'focus' && <FocusTimerView />}
      {activeTab === 'analytics' && <AnalyticsView />}
      <TaskSheetModal />
    </AppShell>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <ActiveScreen />
    </StudyProvider>
  );
}
