'use client';

import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Task } from '@/types/domain';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TaskCalendarProps {
  tasks: Task[];
  projectId: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
}

const EVENT_COLORS = {
  LOW: 'bg-gray-200 border-gray-400 text-gray-800',
  MEDIUM: 'bg-blue-200 border-blue-400 text-blue-800',
  HIGH: 'bg-orange-200 border-orange-400 text-orange-800',
  URGENT: 'bg-red-200 border-red-400 text-red-800',
};

export function TaskCalendar({ tasks, projectId }: TaskCalendarProps) {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  const events = useMemo<CalendarEvent[]>(() => {
    return tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: task.$id,
        title: task.content,
        start: new Date(task.dueDate!),
        end: new Date(task.dueDate!),
        resource: task,
      }));
  }, [tasks]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const priority = event.resource.priority;
    return {
      className: `${EVENT_COLORS[priority]} border-l-4 rounded px-2 py-1`,
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    // TODO: Open task detail modal
    console.log('Selected task:', event.resource);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // TODO: Create new task with selected date
    console.log('Create task on:', start);
  };

  return (
    <div className="h-[calc(100vh-16rem)] bg-white rounded-lg border border-gray-200 p-4">
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          color: #253858;
          border-bottom: 2px solid #e5e7eb;
        }
        .rbc-today {
          background-color: #eff6ff;
        }
        .rbc-event {
          padding: 4px;
          font-size: 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .rbc-event:hover {
          opacity: 0.8;
        }
        .rbc-toolbar {
          padding: 12px 0;
          margin-bottom: 12px;
        }
        .rbc-toolbar button {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rbc-toolbar button:hover {
          background: #f9fafb;
          border-color: #2684FF;
          color: #2684FF;
        }
        .rbc-toolbar button.rbc-active {
          background: #2684FF;
          border-color: #2684FF;
          color: white;
        }
        .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .rbc-day-bg {
          border-color: #f3f4f6;
        }
        .rbc-off-range-bg {
          background: #fafafa;
        }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        popup
        views={['month', 'week', 'day', 'agenda']}
        style={{ height: '100%' }}
      />
    </div>
  );
}
