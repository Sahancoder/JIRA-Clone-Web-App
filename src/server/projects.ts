import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createAdminClient } from '@/lib/appwrite';
import { ProjectRepository } from './repos/project-repo';
import { MemberRepository } from './repos/member-repo';

const app = new Hono();

const createProjectSchema = z.object({
  name: z.string().min(2),
  workspaceId: z.string(),
  imageUrl: z.string().url().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  imageUrl: z.string().url().optional(),
});

async function getCurrentUserId(cookie?: string): Promise<string> {
  const sessionCookie = cookie?.match(/jira-session=([^;]+)/)?.[1];
  if (!sessionCookie) throw new Error('Not authenticated');

  const { account } = createAdminClient();
  const user = await account.get();
  return user.$id;
}

// POST / - Create project
app.post('/', zValidator('json', createProjectSchema), async (c) => {
  try {
    const { name, workspaceId, imageUrl } = c.req.valid('json');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const projectRepo = new ProjectRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Verify user is a member of workspace
    const member = await memberRepo.getByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const project = await projectRepo.create({ name, workspaceId, imageUrl });
    return c.json({ project });
  } catch (error: any) {
    console.error('Create project error:', error);
    return c.json({ error: error.message || 'Failed to create project' }, 500);
  }
});

// GET / - List projects (by workspace)
app.get('/', async (c) => {
  try {
    const workspaceId = c.req.query('workspaceId');
    if (!workspaceId) {
      return c.json({ error: 'workspaceId is required' }, 400);
    }

    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const projectRepo = new ProjectRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const projects = await projectRepo.getByWorkspace(workspaceId);
    return c.json({ projects });
  } catch (error: any) {
    console.error('List projects error:', error);
    return c.json({ error: error.message || 'Failed to list projects' }, 500);
  }
});

// GET /:id - Get project by ID
app.get('/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const projectRepo = new ProjectRepository(databases);
    const memberRepo = new MemberRepository(databases);

    const project = await projectRepo.getById(projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verify user is a member of workspace
    const member = await memberRepo.getByUserAndWorkspace(
      userId,
      project.workspaceId
    );
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    return c.json({ project });
  } catch (error: any) {
    console.error('Get project error:', error);
    return c.json({ error: error.message || 'Failed to get project' }, 500);
  }
});

// PATCH /:id - Update project
app.patch('/:id', zValidator('json', updateProjectSchema), async (c) => {
  try {
    const projectId = c.req.param('id');
    const updates = c.req.valid('json');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const projectRepo = new ProjectRepository(databases);
    const memberRepo = new MemberRepository(databases);

    const project = await projectRepo.getById(projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verify user is admin of workspace
    const isAdmin = await memberRepo.isAdmin(userId, project.workspaceId);
    if (!isAdmin) {
      return c.json({ error: 'Only admins can update projects' }, 403);
    }

    const updatedProject = await projectRepo.update(projectId, updates);
    return c.json({ project: updatedProject });
  } catch (error: any) {
    console.error('Update project error:', error);
    return c.json({ error: error.message || 'Failed to update project' }, 500);
  }
});

// DELETE /:id - Delete project
app.delete('/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const projectRepo = new ProjectRepository(databases);
    const memberRepo = new MemberRepository(databases);

    const project = await projectRepo.getById(projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verify user is admin of workspace
    const isAdmin = await memberRepo.isAdmin(userId, project.workspaceId);
    if (!isAdmin) {
      return c.json({ error: 'Only admins can delete projects' }, 403);
    }

    await projectRepo.delete(projectId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return c.json({ error: error.message || 'Failed to delete project' }, 500);
  }
});

export default app;
