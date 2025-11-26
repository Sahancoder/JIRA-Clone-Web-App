'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskTable } from '@/components/table/task-table';
import { TaskCalendar } from '@/components/calendar/task-calendar';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { AIAssistant } from '@/components/ai/ai-assistant';
import { TeamManagement } from '@/components/team/team-management';
import { useRealtimeTasks } from '@/hooks/use-realtime-tasks';
import { RealtimeIndicator } from '@/components/realtime/realtime-indicator';
import type { TaskStatus } from '@/types/domain';

type ViewType = 'board' | 'table' | 'calendar' | 'analytics' | 'ai' | 'team';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [activeView, setActiveView] = useState<ViewType>('board');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  const handleTaskUpdate = useCallback((updatedTask: any) => {
    setTasks((prev) =>
      prev.map((task) => (task.$id === updatedTask.$id ? updatedTask : task))
    );
  }, []);

  const handleTaskCreate = useCallback((newTask: any) => {
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const handleTaskDelete = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.$id !== taskId));
  }, []);

  const { isConnected } = useRealtimeTasks({
    projectId: selectedProject || '',
    onTaskUpdate: handleTaskUpdate,
    onTaskCreate: handleTaskCreate,
    onTaskDelete: handleTaskDelete,
  });

  const handleMoveTask = async (
    taskId: string,
    status: TaskStatus,
    prevTaskId?: string,
    nextTaskId?: string
  ) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, prevTaskId, nextTaskId }),
      });

      if (!response.ok) throw new Error('Failed to move task');

      // Optimistic update
      setTasks((prev) => {
        const task = prev.find((t) => t.$id === taskId);
        if (!task) return prev;

        const filtered = prev.filter((t) => t.$id !== taskId);
        let newPosition = task.position;

        if (prevTaskId && nextTaskId) {
          const prevTask = filtered.find((t) => t.$id === prevTaskId);
          const nextTask = filtered.find((t) => t.$id === nextTaskId);
          if (prevTask && nextTask) {
            newPosition = (prevTask.position + nextTask.position) / 2;
          }
        } else if (prevTaskId) {
          const prevTask = filtered.find((t) => t.$id === prevTaskId);
          if (prevTask) {
            newPosition = prevTask.position + 1000;
          }
        } else if (nextTaskId) {
          const nextTask = filtered.find((t) => t.$id === nextTaskId);
          if (nextTask) {
            newPosition = nextTask.position / 2;
          }
        }

        return [
          ...filtered,
          {
            ...task,
            status,
            position: newPosition,
          },
        ];
      });
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const views = [
    { id: 'board', label: 'Board', icon: '📋' },
    { id: 'table', label: 'Table', icon: '📊' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖' },
    { id: 'team', label: 'Team', icon: '👥' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with View Tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-navy">Workspace</h1>
          <RealtimeIndicator isConnected={isConnected} />
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex gap-6" aria-label="Tabs">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as ViewType)}
                className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeView === view.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{view.icon}</span>
                <span>{view.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* View Content */}
      <div>
        {activeView === 'board' && (
          <>
            {selectedProject ? (
              <KanbanBoard
                projectId={selectedProject}
                tasks={tasks}
                onMoveTask={handleMoveTask}
              />
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">
                  Select a project to view its Kanban board
                </p>
                <button className="text-primary hover:text-primary-hover font-medium">
                  Create your first project →
                </button>
              </div>
            )}
          </>
        )}

        {activeView === 'table' && (
          <>
            {selectedProject ? (
              <TaskTable projectId={selectedProject} tasks={tasks} />
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500">Select a project to view tasks</p>
              </div>
            )}
          </>
        )}

        {activeView === 'calendar' && (
          <>
            {selectedProject ? (
              <TaskCalendar projectId={selectedProject} tasks={tasks} />
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500">Select a project to view calendar</p>
              </div>
            )}
          </>
        )}

        {activeView === 'analytics' && (
          <AnalyticsDashboard workspaceId={workspaceId} />
        )}

        {activeView === 'ai' && <AIAssistant workspaceId={workspaceId} />}

        {activeView === 'team' && <TeamManagement workspaceId={workspaceId} />}
      </div>
    </div>
  );
}
