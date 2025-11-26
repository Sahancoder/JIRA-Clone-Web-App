import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/domain';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.$id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="space-y-3">
        {/* Title */}
        <h4 className="font-medium text-gray-900 line-clamp-2">
          {task.content}
        </h4>

        {/* Priority Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Assignee */}
        {task.assigneeId && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
              {task.assigneeId.substring(0, 2).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
