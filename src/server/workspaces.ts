import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createAdminClient } from '@/lib/appwrite';
import { WorkspaceRepository } from './repos/workspace-repo';
import { MemberRepository } from './repos/member-repo';

const app = new Hono();

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  imageUrl: z.string().url().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  imageUrl: z.string().url().optional(),
});

// Helper to get current user ID from session
async function getCurrentUserId(cookie?: string): Promise<string> {
  const sessionCookie = cookie?.match(/jira-session=([^;]+)/)?.[1];
  if (!sessionCookie) throw new Error('Not authenticated');

  const { account } = createAdminClient();
  const user = await account.get();
  return user.$id;
}

// POST / - Create workspace
app.post('/', zValidator('json', createWorkspaceSchema), async (c) => {
  try {
    const { name, imageUrl } = c.req.valid('json');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const workspaceRepo = new WorkspaceRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Create workspace
    const workspace = await workspaceRepo.create({
      name,
      adminId: userId,
      imageUrl,
    });

    // Add creator as admin member
    await memberRepo.create({
      userId,
      workspaceId: workspace.$id,
      role: 'ADMIN',
    });

    return c.json({ workspace });
  } catch (error: any) {
    console.error('Create workspace error:', error);
    return c.json({ error: error.message || 'Failed to create workspace' }, 500);
  }
});

// GET / - List user's workspaces
app.get('/', async (c) => {
  try {
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const memberRepo = new MemberRepository(databases);
    const workspaceRepo = new WorkspaceRepository(databases);

    // Get all workspace memberships for user
    const memberships = await memberRepo.getWorkspacesByUser(userId);

    // Fetch workspace details
    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await workspaceRepo.getById(membership.workspaceId);
        return {
          ...workspace,
          role: membership.role,
        };
      })
    );

    return c.json({ workspaces: workspaces.filter(Boolean) });
  } catch (error: any) {
    console.error('List workspaces error:', error);
    return c.json({ error: error.message || 'Failed to list workspaces' }, 500);
  }
});

// GET /:id - Get workspace by ID
app.get('/:id', async (c) => {
  try {
    const workspaceId = c.req.param('id');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const workspaceRepo = new WorkspaceRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Verify user is a member
    const member = await memberRepo.getByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const workspace = await workspaceRepo.getById(workspaceId);
    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    return c.json({ workspace, role: member.role });
  } catch (error: any) {
    console.error('Get workspace error:', error);
    return c.json({ error: error.message || 'Failed to get workspace' }, 500);
  }
});

// PATCH /:id - Update workspace
app.patch('/:id', zValidator('json', updateWorkspaceSchema), async (c) => {
  try {
    const workspaceId = c.req.param('id');
    const updates = c.req.valid('json');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const workspaceRepo = new WorkspaceRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Verify user is admin
    const isAdmin = await memberRepo.isAdmin(userId, workspaceId);
    if (!isAdmin) {
      return c.json({ error: 'Only admins can update workspace' }, 403);
    }

    const workspace = await workspaceRepo.update(workspaceId, updates);
    return c.json({ workspace });
  } catch (error: any) {
    console.error('Update workspace error:', error);
    return c.json({ error: error.message || 'Failed to update workspace' }, 500);
  }
});

// DELETE /:id - Delete workspace
app.delete('/:id', async (c) => {
  try {
    const workspaceId = c.req.param('id');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const workspaceRepo = new WorkspaceRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Verify user is admin
    const isAdmin = await memberRepo.isAdmin(userId, workspaceId);
    if (!isAdmin) {
      return c.json({ error: 'Only admins can delete workspace' }, 403);
    }

    await workspaceRepo.delete(workspaceId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete workspace error:', error);
    return c.json({ error: error.message || 'Failed to delete workspace' }, 500);
  }
});

// POST /:id/regenerate-invite - Regenerate invite code
app.post('/:id/regenerate-invite', async (c) => {
  try {
    const workspaceId = c.req.param('id');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const workspaceRepo = new WorkspaceRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Verify user is admin
    const isAdmin = await memberRepo.isAdmin(userId, workspaceId);
    if (!isAdmin) {
      return c.json({ error: 'Only admins can regenerate invite code' }, 403);
    }

    const workspace = await workspaceRepo.regenerateInviteCode(workspaceId);
    return c.json({ workspace });
  } catch (error: any) {
    console.error('Regenerate invite error:', error);
    return c.json({ error: error.message || 'Failed to regenerate invite' }, 500);
  }
});

// POST /join/:workspaceId/:inviteCode - Join workspace via invite
app.post('/join/:workspaceId/:inviteCode', async (c) => {
  try {
    const workspaceId = c.req.param('workspaceId');
    const inviteCode = c.req.param('inviteCode');
    const cookie = c.req.header('cookie');
    const userId = await getCurrentUserId(cookie);

    const { databases } = createAdminClient();
    const workspaceRepo = new WorkspaceRepository(databases);
    const memberRepo = new MemberRepository(databases);

    // Verify workspace and invite code
    const workspace = await workspaceRepo.getById(workspaceId);
    if (!workspace || workspace.inviteCode !== inviteCode) {
      return c.json({ error: 'Invalid invite link' }, 400);
    }

    // Check if already a member
    const existingMember = await memberRepo.getByUserAndWorkspace(
      userId,
      workspaceId
    );
    if (existingMember) {
      return c.json({ error: 'Already a member of this workspace' }, 400);
    }

    // Add as member
    const member = await memberRepo.create({
      userId,
      workspaceId,
      role: 'MEMBER',
    });

    return c.json({ workspace, member });
  } catch (error: any) {
    console.error('Join workspace error:', error);
    return c.json({ error: error.message || 'Failed to join workspace' }, 500);
  }
});

export default app;
