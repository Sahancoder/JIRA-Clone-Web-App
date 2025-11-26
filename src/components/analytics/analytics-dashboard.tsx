'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  totalTasks: number;
  tasksByStatus: {
    BACKLOG: number;
    TODO: number;
    IN_PROGRESS: number;
    DONE: number;
    CANCELED: number;
  };
  tasksByPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  overdueTasks: number;
  tasksByAssignee: Array<{
    assigneeId: string;
    count: number;
  }>;
}

interface AnalyticsDashboardProps {
  workspaceId: string;
}

const STATUS_COLORS = {
  BACKLOG: '#9ca3af',
  TODO: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  DONE: '#10b981',
  CANCELED: '#ef4444',
};

const PRIORITY_COLORS = {
  LOW: '#9ca3af',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

export function AnalyticsDashboard({ workspaceId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [workspaceId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/workspaces/${workspaceId}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const statusData = Object.entries(analytics.tasksByStatus).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
    color: STATUS_COLORS[name as keyof typeof STATUS_COLORS],
  }));

  const priorityData = Object.entries(analytics.tasksByPriority).map(([name, value]) => ({
    name,
    value,
    color: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS],
  }));

  const assigneeData = analytics.tasksByAssignee
    .slice(0, 10)
    .map((item) => ({
      name: item.assigneeId.substring(0, 8),
      tasks: item.count,
    }));

  const completionRate = analytics.totalTasks > 0
    ? ((analytics.tasksByStatus.DONE / analytics.totalTasks) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Total Tasks</div>
          <div className="text-3xl font-bold text-navy">{analytics.totalTasks}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Completed</div>
          <div className="text-3xl font-bold text-green-600">
            {analytics.tasksByStatus.DONE}
          </div>
          <div className="text-sm text-gray-500 mt-1">{completionRate}% completion</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">In Progress</div>
          <div className="text-3xl font-bold text-yellow-600">
            {analytics.tasksByStatus.IN_PROGRESS}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Overdue</div>
          <div className="text-3xl font-bold text-red-600">
            {analytics.overdueTasks}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-navy mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-navy mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2684FF">
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Workload by Assignee */}
        {assigneeData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-navy mb-4">
              Workload by Assignee (Top 10)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assigneeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#2684FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Status Breakdown Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-navy mb-4">Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(analytics.tasksByStatus).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-navy">{count}</div>
              <div className="text-sm text-gray-600 mt-1">
                {status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
