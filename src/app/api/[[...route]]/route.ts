import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import authApp from '@/server/auth';
import workspacesApp from '@/server/workspaces';
import projectsApp from '@/server/projects';
import tasksApp from '@/server/tasks';
import analyticsApp from '@/server/analytics';
import aiApp from '@/server/ai';

// Create the main Hono app with base path
const app = new Hono().basePath('/api');

// Mount all routes
app.route('/auth', authApp);
app.route('/workspaces', workspacesApp);
app.route('/projects', projectsApp);
app.route('/tasks', tasksApp);
app.route('/analytics', analyticsApp);
app.route('/ai', aiApp);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ ok: true, timestamp: new Date().toISOString() });
});

// Centralized error handling
app.onError((err, c) => {
  console.error('API Error:', err);
  
  return c.json(
    {
      error: err.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not found',
      path: c.req.path,
    },
    404
  );
});

// Export the app type for RPC client
export type AppType = typeof app;

// Export HTTP method handlers for Next.js
export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
