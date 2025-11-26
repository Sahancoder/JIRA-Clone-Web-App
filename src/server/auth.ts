import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createAdminClient } from '@/lib/appwrite';
import { ID } from 'appwrite';

const app = new Hono();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

// POST /login - Authenticate user
app.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const { account } = createAdminClient();

    // Create email session
    const session = await account.createEmailPasswordSession(email, password);

    // Set session cookie
    c.header(
      'Set-Cookie',
      `jira-session=${session.secret}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}` // 30 days
    );

    return c.json({ success: true, user: { $id: session.userId, email } });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ error: 'Invalid credentials' }, 401);
  }
});

// POST /register - Create new user
app.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { name, email, password } = c.req.valid('json');
    const { account } = createAdminClient();

    // Create user
    const user = await account.create(ID.unique(), email, password, name);

    // Auto-login: create session
    const session = await account.createEmailPasswordSession(email, password);

    // Set session cookie
    c.header(
      'Set-Cookie',
      `jira-session=${session.secret}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`
    );

    return c.json({
      success: true,
      user: { $id: user.$id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message?.includes('user with the same email already exists')) {
      return c.json({ error: 'Email already registered' }, 409);
    }
    
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// POST /logout - End session
app.post('/logout', async (c) => {
  try {
    const cookie = c.req.header('cookie');
    const sessionCookie = cookie?.match(/jira-session=([^;]+)/)?.[1];

    if (sessionCookie) {
      const { account } = createAdminClient();
      await account.deleteSession(sessionCookie);
    }

    // Clear cookie
    c.header(
      'Set-Cookie',
      'jira-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// GET /current - Get current user
app.get('/current', async (c) => {
  try {
    const cookie = c.req.header('cookie');
    const sessionCookie = cookie?.match(/jira-session=([^;]+)/)?.[1];

    if (!sessionCookie) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const { account } = createAdminClient();
    const user = await account.get();

    return c.json({
      user: {
        $id: user.$id,
        name: user.name,
        email: user.email,
        emailVerification: user.emailVerification,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return c.json({ error: 'Not authenticated' }, 401);
  }
});

export default app;
