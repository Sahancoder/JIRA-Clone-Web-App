import { Hono } from 'hono';
import { createAdminClient } from '@/lib/appwrite';
import { MemberRepository } from './repos/member-repo';
import { Query } from 'appwrite';

const app = new Hono();

async function getCurrentUserId(cookie?: string): Promise<string> {
  const sessionCookie = cookie?.match(/jira-session=([^;]+)/)?.[1];
  if (!sessionCookie) throw new Error('Not authenticated');

  const { account } = createAdminClient();
  const user = await account.get();
  return user.$id;
}

interface TaskAnalytics {
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

// GET /workspaces/:workspaceId - Get workspace analytics
app.get('/workspaces/:workspaceId', async (c) => {
  try {
    const workspaceId = c.req.param('workspaceId');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const memberRepo = new MemberRepository(databases);

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const collectionId = process.env.COLLECTION_TASKS_ID!;

    // Get all tasks for workspace
    const tasksResult = await databases.listDocuments(
      process.env.DATABASE_ID!,
      collectionId,
      [Query.equal('workspaceId', workspaceId), Query.limit(1000)]
    );

    const tasks = tasksResult.documents;

    // Calculate analytics
    const analytics: TaskAnalytics = {
      totalTasks: tasks.length,
      tasksByStatus: {
        BACKLOG: 0,
        TODO: 0,
        IN_PROGRESS: 0,
        DONE: 0,
        CANCELED: 0,
      },
      tasksByPriority: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        URGENT: 0,
      },
      overdueTasks: 0,
      tasksByAssignee: [],
    };

    const now = new Date().toISOString();
    const assigneeMap = new Map<string, number>();

    tasks.forEach((task) => {
      // Count by status
      const status = task.status as keyof typeof analytics.tasksByStatus;
      if (status in analytics.tasksByStatus) {
        analytics.tasksByStatus[status]++;
      }

      // Count by priority
      const priority = task.priority as keyof typeof analytics.tasksByPriority;
      if (priority in analytics.tasksByPriority) {
        analytics.tasksByPriority[priority]++;
      }

      // Count overdue
      if (task.dueDate && task.dueDate < now && task.status !== 'DONE') {
        analytics.overdueTasks++;
      }

      // Count by assignee
      if (task.assigneeId) {
        assigneeMap.set(
          task.assigneeId,
          (assigneeMap.get(task.assigneeId) || 0) + 1
        );
      }
    });

    // Convert assignee map to array
    analytics.tasksByAssignee = Array.from(assigneeMap.entries()).map(
      ([assigneeId, count]) => ({
        assigneeId,
        count,
      })
    );

    return c.json({ analytics });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return c.json({ error: error.message || 'Failed to get analytics' }, 500);
  }
});

// GET /projects/:projectId - Get project analytics
app.get('/projects/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const memberRepo = new MemberRepository(databases);

    // Get project to verify workspace
    const projectResult = await databases.getDocument(
      process.env.DATABASE_ID!,
      process.env.COLLECTION_PROJECTS_ID!,
      projectId
    );

    if (!projectResult) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(
      userId,
      projectResult.workspaceId
    );
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const collectionId = process.env.COLLECTION_TASKS_ID!;

    // Get all tasks for project
    const tasksResult = await databases.listDocuments(
      process.env.DATABASE_ID!,
      collectionId,
      [Query.equal('projectId', projectId), Query.limit(1000)]
    );

    const tasks = tasksResult.documents;

    // Calculate analytics
    const analytics: TaskAnalytics = {
      totalTasks: tasks.length,
      tasksByStatus: {
        BACKLOG: 0,
        TODO: 0,
        IN_PROGRESS: 0,
        DONE: 0,
        CANCELED: 0,
      },
      tasksByPriority: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        URGENT: 0,
      },
      overdueTasks: 0,
      tasksByAssignee: [],
    };

    const now = new Date().toISOString();
    const assigneeMap = new Map<string, number>();

    tasks.forEach((task) => {
      // Count by status
      const status = task.status as keyof typeof analytics.tasksByStatus;
      if (status in analytics.tasksByStatus) {
        analytics.tasksByStatus[status]++;
      }

      // Count by priority
      const priority = task.priority as keyof typeof analytics.tasksByPriority;
      if (priority in analytics.tasksByPriority) {
        analytics.tasksByPriority[priority]++;
      }

      // Count overdue
      if (task.dueDate && task.dueDate < now && task.status !== 'DONE') {
        analytics.overdueTasks++;
      }

      // Count by assignee
      if (task.assigneeId) {
        assigneeMap.set(
          task.assigneeId,
          (assigneeMap.get(task.assigneeId) || 0) + 1
        );
      }
    });

    // Convert assignee map to array
    analytics.tasksByAssignee = Array.from(assigneeMap.entries()).map(
      ([assigneeId, count]) => ({
        assigneeId,
        count,
      })
    );

    return c.json({ analytics });
  } catch (error: any) {
    console.error('Get project analytics error:', error);
    return c.json(
      { error: error.message || 'Failed to get project analytics' },
      500
    );
  }
});

export default app;
