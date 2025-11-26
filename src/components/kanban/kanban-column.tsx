import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '@/types/domain';
import { TaskCard } from './task-card';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

export function KanbanColumn({ id, title, tasks, color }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="shrink-0 w-80">
      <div
        className={`rounded-lg ${color} border-2 ${isOver ? 'border-primary' : 'border-gray-200'} transition-colors h-full flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-navy">{title}</h3>
            <span className="text-sm text-gray-500">{tasks.length}</span>
          </div>
        </div>

        {/* Task List */}
        <div
          ref={setNodeRef}
          className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[200px]"
        >
          <SortableContext
            items={tasks.map((t) => t.$id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard key={task.$id} task={task} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Drop tasks here
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
