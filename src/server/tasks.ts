import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createAdminClient } from '@/lib/appwrite';
import { TaskRepository } from './repos/task-repo';
import { MemberRepository } from './repos/member-repo';
import { ProjectRepository } from './repos/project-repo';
import { TaskStatus, TaskPriority } from '@/types/domain';

const app = new Hono();

const createTaskSchema = z.object({
  projectId: z.string(),
  content: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

const updateTaskSchema = z.object({
  content: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  position: z.number().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

async function getCurrentUserId(cookie?: string): Promise<string> {
  const sessionCookie = cookie?.match(/jira-session=([^;]+)/)?.[1];
  if (!sessionCookie) throw new Error('Not authenticated');

  const { account } = createAdminClient();
  const user = await account.get();
  return user.$id;
}

// POST / - Create task
app.post('/', zValidator('json', createTaskSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const taskRepo = new TaskRepository(databases);
    const projectRepo = new ProjectRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Get project to verify workspace
    const project = await projectRepo.getById(data.projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(
      userId,
      project.workspaceId
    );
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const task = await taskRepo.create({
      ...data,
      workspaceId: project.workspaceId,
    });

    return c.json({ task });
  } catch (error: any) {
    console.error('Create task error:', error);
    return c.json({ error: error.message || 'Failed to create task' }, 500);
  }
});

// GET / - List tasks (by project)
app.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    if (!projectId) {
      return c.json({ error: 'projectId is required' }, 400);
    }

    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const taskRepo = new TaskRepository(databases);
    const projectRepo = new ProjectRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Get project to verify workspace
    const project = await projectRepo.getById(projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(
      userId,
      project.workspaceId
    );
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const tasks = await taskRepo.getByProject(projectId);
    return c.json({ tasks });
  } catch (error: any) {
    console.error('List tasks error:', error);
    return c.json({ error: error.message || 'Failed to list tasks' }, 500);
  }
});

// GET /:id - Get task by ID
app.get('/:id', async (c) => {
  try {
    const taskId = c.req.param('id');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const taskRepo = new TaskRepository(databases);
    const memberRepo = new MemberRepository(databases);

    const task = await taskRepo.getById(taskId);
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(
      userId,
      task.workspaceId
    );
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    return c.json({ task });
  } catch (error: any) {
    console.error('Get task error:', error);
    return c.json({ error: error.message || 'Failed to get task' }, 500);
  }
});

// PATCH /:id - Update task
app.patch('/:id', zValidator('json', updateTaskSchema), async (c) => {
  try {
    const taskId = c.req.param('id');
    const updates = c.req.valid('json');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const taskRepo = new TaskRepository(databases);
    const memberRepo = new MemberRepository(databases);

    const task = await taskRepo.getById(taskId);
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(
      userId,
      task.workspaceId
    );
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const updatedTask = await taskRepo.update(taskId, updates);
    return c.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Update task error:', error);
    return c.json({ error: error.message || 'Failed to update task' }, 500);
  }
});

// POST /:id/move - Move task (Lexorank positioning)
app.post('/:id/move', async (c) => {
  try {
    const taskId = c.req.param('id');
    const { status, prevTaskId, nextTaskId } = await c.req.json();
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const taskRepo = new TaskRepository(databases);
    const memberRepo = new MemberRepository(databases);

    const task = await taskRepo.getById(taskId);
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(
      userId,
      task.workspaceId
    );
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    // Get neighbor positions
    let prevPosition: number | undefined;
    let nextPosition: number | undefined;

    if (prevTaskId) {
      const prevTask = await taskRepo.getById(prevTaskId);
      prevPosition = prevTask?.position;
    }

    if (nextTaskId) {
      const nextTask = await taskRepo.getById(nextTaskId);
      nextPosition = nextTask?.position;
    }

    // Calculate new position
    const newPosition = taskRepo.computeNewPosition(prevPosition, nextPosition);

    // Update task
    const updatedTask = await taskRepo.update(taskId, {
      status: status as TaskStatus,
      position: newPosition,
    });

    return c.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Move task error:', error);
    return c.json({ error: error.message || 'Failed to move task' }, 500);
  }
});

// DELETE /:id - Delete task
app.delete('/:id', async (c) => {
  try {
    const taskId = c.req.param('id');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const taskRepo = new TaskRepository(databases);
    const memberRepo = new MemberRepository(databases);

    const task = await taskRepo.getById(taskId);
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(
      userId,
      task.workspaceId
    );
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await taskRepo.delete(taskId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return c.json({ error: error.message || 'Failed to delete task' }, 500);
  }
});

export default app;
