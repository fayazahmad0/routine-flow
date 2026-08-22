/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoutineProvider, useRoutine } from './context/RoutineContext';
import { ActiveTab, Task } from './types';

// Layout & Components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Toast } from './components/common/Toast';
import { OfflineBanner } from './components/common/OfflineBanner';

// Views
import { LoginView } from './components/auth/LoginView';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { HistoryView } from './components/history/HistoryView';
import { AchievementsView } from './components/achievements/AchievementsView';
import { SettingsView } from './components/settings/SettingsView';

// Modals
import { AddTaskModal } from './components/tasks/AddTaskModal';
import { EditTaskModal } from './components/tasks/EditTaskModal';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { isOnline, toast, hideToast } = useRoutine();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#F9F8F6] dark:text-[#121212] flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F3EFEA]">
          RoutineFlow
        </h2>
        <p className="text-xs uppercase tracking-widest text-[#78716C] dark:text-[#A39E96] mt-1 font-mono">
          Loading your journal...
        </p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <LoginView />
        {!isOnline && <OfflineBanner />}
      </>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            onEditTask={(task) => setEditingTask(task)}
          />
        );
      case 'tasks':
        return (
          <TasksView
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            onEditTask={(task) => setEditingTask(task)}
          />
        );
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'history':
        return <HistoryView />;
      case 'achievements':
        return <AchievementsView />;
      case 'settings':
      case 'profile':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            onEditTask={(task) => setEditingTask(task)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] dark:bg-[#121212] text-[#1A1A1A] dark:text-[#F3EFEA] flex flex-col md:flex-row transition-colors">
      {/* Sidebar for Desktop / Tablet */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden pb-20 md:pb-8">
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAddTask={() => setIsAddTaskOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddTask={() => setIsAddTaskOpen(true)}
      />

      {/* Global Modals */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
      />

      <EditTaskModal
        task={editingTask}
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
      />

      {/* Onboarding Dialog for new users */}
      <OnboardingModal />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Offline Status Warning */}
      {!isOnline && <OfflineBanner />}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoutineProvider>
          <AppContent />
        </RoutineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

