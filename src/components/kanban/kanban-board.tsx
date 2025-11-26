'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types/domain';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  onMoveTask: (
    taskId: string,
    status: TaskStatus,
    prevTaskId?: string,
    nextTaskId?: string
  ) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-gray-100' },
  { id: 'TODO', title: 'To Do', color: 'bg-blue-50' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-50' },
  { id: 'DONE', title: 'Done', color: 'bg-green-50' },
  { id: 'CANCELED', title: 'Canceled', color: 'bg-red-50' },
];

export function KanbanBoard({ projectId, tasks, onMoveTask }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>({
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
    CANCELED: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group tasks by status
  useEffect(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      CANCELED: [],
    };

    tasks.forEach((task) => {
      if (task.status in grouped) {
        grouped[task.status].push(task);
      }
    });

    // Sort by position
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => a.position - b.position);
    });

    setColumns(grouped);
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.$id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine the new status
    let newStatus: TaskStatus | null = null;
    let overTask: Task | null = null;

    // Check if dropped over a column
    if (COLUMNS.some((col) => col.id === overId)) {
      newStatus = overId as TaskStatus;
    } else {
      // Dropped over a task
      overTask = tasks.find((t) => t.$id === overId) || null;
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (!newStatus) return;

    const task = tasks.find((t) => t.$id === taskId);
    if (!task) return;

    // If status didn't change and no over task, do nothing
    if (task.status === newStatus && !overTask) return;

    // Find prev and next tasks
    const columnTasks = columns[newStatus];
    let prevTaskId: string | undefined;
    let nextTaskId: string | undefined;

    if (overTask) {
      const overIndex = columnTasks.findIndex((t) => t.$id === overTask.$id);
      if (overIndex >= 0) {
        prevTaskId = columnTasks[overIndex]?.$id;
        nextTaskId = columnTasks[overIndex + 1]?.$id;
      }
    } else {
      // Dropped at end of column
      prevTaskId = columnTasks[columnTasks.length - 1]?.$id;
    }

    onMoveTask(taskId, newStatus, prevTaskId, nextTaskId);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-12rem)]">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={columns[column.id]}
            color={column.color}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-80">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
