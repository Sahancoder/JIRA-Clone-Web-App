import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/appwrite';
import { MemberRepository } from './repos/member-repo';
import { Query } from 'appwrite';

const app = new Hono();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function getCurrentUserId(cookie?: string): Promise<string> {
  const sessionCookie = cookie?.match(/jira-session=([^;]+)/)?.[1];
  if (!sessionCookie) throw new Error('Not authenticated');

  const { account } = createAdminClient();
  const user = await account.get();
  return user.$id;
}

const generateDescriptionSchema = z.object({
  title: z.string().min(1),
  workspaceId: z.string(),
});

const projectOracleSchema = z.object({
  question: z.string().min(1),
  projectId: z.string(),
});

// POST /generate-description - Generate task description from title
app.post(
  '/generate-description',
  zValidator('json', generateDescriptionSchema),
  async (c) => {
    try {
      const { title, workspaceId } = c.req.valid('json');
      const cookie = c.req.header('cookie');
      const userId = await getCurrentUserId(cookie);

      const { databases } = createAdminClient();
      const memberRepo = new MemberRepository(databases);

      // Verify user is a member
      const member = await memberRepo.getByUserAndWorkspace(
        userId,
        workspaceId
      );
      if (!member) {
        return c.json({ error: 'Not authorized' }, 403);
      }

      // Generate description using Gemini
      const prompt = `You are a helpful assistant that generates detailed task descriptions for a project management tool.

Task Title: "${title}"

Generate a clear, concise, and professional task description in markdown format. Include:
1. A brief overview of what needs to be done
2. Key objectives or acceptance criteria (as a bullet list)
3. Any potential considerations or edge cases

Keep it under 200 words and use markdown formatting (headers, lists, bold, etc.).`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const description = response.text();

      return c.json({ description });
    } catch (error: any) {
      console.error('Generate description error:', error);
      return c.json(
        { error: error.message || 'Failed to generate description' },
        500
      );
    }
  }
);

// POST /project-oracle - Ask questions about project tasks
app.post(
  '/project-oracle',
  zValidator('json', projectOracleSchema),
  async (c) => {
    try {
      const { question, projectId } = c.req.valid('json');
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

      // Get all tasks for context
      const tasksResult = await databases.listDocuments(
        process.env.DATABASE_ID!,
        process.env.COLLECTION_TASKS_ID!,
        [Query.equal('projectId', projectId), Query.limit(500)]
      );

      const tasks = tasksResult.documents;

      // Build context from tasks
      const taskContext = tasks
        .map(
          (task) =>
            `- ${task.content} (Status: ${task.status}, Priority: ${task.priority}${task.dueDate ? `, Due: ${task.dueDate}` : ''})`
        )
        .join('\n');

      // Generate answer using Gemini
      const prompt = `You are the "Project Oracle" - an AI assistant that helps answer questions about a project's tasks and status.

Project: ${projectResult.name}
Project Description: ${projectResult.description || 'No description provided'}

Current Tasks (${tasks.length} total):
${taskContext || 'No tasks yet'}

User Question: "${question}"

Provide a helpful, concise answer based on the project's current state. If the question can't be answered with the available information, say so politely and suggest what information might be needed. Keep your response under 150 words.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const answer = response.text();

      return c.json({ answer });
    } catch (error: any) {
      console.error('Project Oracle error:', error);
      return c.json(
        { error: error.message || 'Failed to get answer from Project Oracle' },
        500
      );
    }
  }
);

export default app;
