# Copilot Guide: Building a Full-Stack JIRA Clone

**100% Free Tier Stack**: Next.js 14 + Hono + Appwrite + Google Gemini AI

---

## 0. How to Use This Guide with Copilot

**Pattern:**

* You do environment / CLI / dashboard setup yourself.
* For code, you paste the "Copilot Task" comment into the file you're editing and let Copilot write / complete the code.
* If Copilot's answer is off, **edit the comment** to be more explicit and trigger completion again.

Example:

```ts
// COPILOT TASK:
// Create a simple Hono route at /health that returns { ok: true } as JSON.
// Use TypeScript and export it as part of a Hono sub-app called healthApp.
```

---

## Feature Checklist (Track Your Progress)

* [ ] Auth: sign-up, sign-in, session cookie, middleware.
* [ ] Workspace CRUD + invite links.
* [ ] Member roles: ADMIN / MEMBER.
* [ ] Projects inside workspaces.
* [ ] Tasks with statuses, priorities, assignees, due dates, Lexorank positions.
* [ ] Kanban board with dnd-kit, optimistic updates.
* [ ] Table view (TanStack Table) with filters & URL sync.
* [ ] Calendar view (due dates).
* [ ] Analytics dashboard.
* [ ] AI task description generator (Gemini 1.5 Flash).
* [ ] AI "Project Oracle" RAG-lite assistant.
* [ ] Free-tier safety: file size limits, debounced AI calls.
* [ ] Deploy to Vercel + configure Appwrite & Google AI.

---

## 1. Stack & Free-Tier Checklist

**All free:**

* **Next.js 14, App Router** – deployed on Vercel Hobby.
* **Hono** – routers + RPC; runs inside Next API routes (no extra infra).
* **Appwrite Cloud Free Tier** – DB, auth, storage.
* **Google Gemini 1.5 Flash** – via Google AI Studio free tier.
* **UI & Utils (all OSS)**: Tailwind CSS, shadcn/ui, @tanstack/react-query, @tanstack/table, @dnd-kit/core, react-big-calendar/date-fns.

**Before coding:**

1. Create:
   * A **Vercel** account.
   * An **Appwrite Cloud** project.
   * A **Google AI Studio** project & API key.

2. In Appwrite:
   * Create **Database** + collections: `workspaces`, `members`, `projects`, `tasks`.
   * Add fields and indexes based on your architecture (we'll revisit in Phase 5).

---

## 2. Phase 1 – Bootstrapping the Next.js + Tailwind Project

### 2.1 Manual: create project

From terminal (PowerShell):

```powershell
npx create-next-app@latest jira-clone `
  --typescript `
  --eslint `
  --tailwind `
  --app `
  --src-dir `
  --import-alias "@/*"
cd jira-clone
```

Install core deps:

```powershell
npm install hono @hono/zod-validator zod appwrite `
  @tanstack/react-query @tanstack/react-table `
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers `
  @google/generative-ai `
  date-fns react-big-calendar
```

Install dev dependencies:

```powershell
npm install -D @types/react-big-calendar
```

### 2.2 Copilot Task: base layout / providers

In `src/app/layout.tsx`:

```tsx
// COPILOT TASK:
// Turn this into the root layout for a SaaS-style app.
// - Use an HTML skeleton with <body> that includes a QueryClientProvider for @tanstack/react-query.
// - Create a separate component (e.g., AppProviders) in src/components/providers/app-providers.tsx
//   that wraps children with QueryClientProvider and any future providers.
// - Keep it minimal but TypeScript-safe.
```

In `src/components/providers/app-providers.tsx` (new file):

```tsx
// COPILOT TASK:
// Implement an AppProviders component that:
// - Creates a QueryClient once (outside the component).
// - Wraps children in QueryClientProvider.
// - Is exported as default and used in layout.tsx.
```

### 2.3 Bug / Fix Notes

* If you see **"window is not defined"** errors, ensure any browser-only libraries are inside `use client` components, not Server Components.
* If Tailwind classes aren't applying, check:
  * `tailwind.config.ts` includes `./src/app/**/*.{ts,tsx}`, `./src/components/**/*.{ts,tsx}`.
  * `globals.css` is imported in `layout.tsx`.

---

## 3. Phase 2 – Hono API Layer + RPC Client

### 3.1 Hono main router

In `src/app/api/[[...route]]/route.ts`:

```ts
// COPILOT TASK:
// Implement a Hono app mounted inside Next.js App Router.
// Requirements:
// - Import { Hono } from 'hono' and { handle } from 'hono/vercel'.
// - Create const app = new Hono().basePath('/api').
// - Add a simple GET /health route returning { ok: true }.
// - Add centralized error handling with app.onError.
// - Export type AppType = typeof app.
// - Export GET, POST, PATCH, DELETE handlers using handle(app).
// Use TypeScript and the RequestHandler types that Next.js expects.
```

### 3.2 RPC client

In `src/lib/rpc.ts`:

```ts
// COPILOT TASK:
// Create a typed RPC client for the Hono app.
// Requirements:
// - Import { hc } from 'hono/client' and { AppType } from '@/app/api/[[...route]]/route'.
// - Export const client = hc<AppType>(baseUrl) where baseUrl reads from
//   process.env.NEXT_PUBLIC_APP_URL or falls back to '' for relative paths.
// - The client should be usable from the frontend to call routes like client.api.health.$get().
```

### 3.3 Bug / Fix Notes

* If you see **TypeScript circular import problems**, keep `AppType` exports minimal and avoid importing big sub-apps back into the client.
* For **404 on API routes**, double-check:
  * File path: `src/app/api/[[...route]]/route.ts` (not `routes.ts`).
  * basePath `/api` vs how you're calling (`/api/health`).

---

## 4. Phase 3 – Appwrite Client + Auth Infrastructure

### 4.1 Appwrite client wrapper

In `src/lib/appwrite.ts`:

```ts
// COPILOT TASK:
// Create helper functions to instantiate Appwrite Server and Client SDKs.
// Requirements:
// - Use appwrite SDK and environment variables:
//   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY.
// - Export:
//   - createAdminClient(): returns { account, databases, storage } configured with API key.
//   - createUserClient(cookie?: string): returns client scoped to the user session if needed.
// - Write in TypeScript with proper types from appwrite.
```

Add `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=...
APPWRITE_API_KEY=...
GOOGLE_API_KEY=...
DATABASE_ID=...
COLLECTION_WORKSPACES_ID=...
COLLECTION_MEMBERS_ID=...
COLLECTION_PROJECTS_ID=...
COLLECTION_TASKS_ID=...
```

(Never commit `.env.local`.)

### 4.2 Auth routes (Hono sub-app)

In `src/server/auth.ts`:

```ts
// COPILOT TASK:
// Implement authApp as a Hono sub-app for authentication.
// Requirements:
// - Endpoint POST /login: expects { email, password } via zod validation.
// - Uses createAdminClient() to call account.createEmailPasswordSession.
// - On success, sets an httpOnly, secure, sameSite='strict' cookie 'jira-clone-session'
//   valid for 30 days, and returns { success: true }.
// - On failure, return 401 with { error: 'Invalid credentials' }.
// - Endpoint POST /register: expects { email, password, name } via zod validation.
// - Creates a new user via account.create() then auto-login.
// - Endpoint POST /logout: clears the session cookie.
// - Endpoint GET /current: returns current user info or 401 if not authenticated.
// - Export authApp and mount it under /auth in the main API router.
```

Then, in `route.ts`:

```ts
// COPILOT TASK:
// Import authApp from '@/server/auth'.
// Mount it in the Hono app under '/auth' using .route('/auth', authApp).
// Keep the existing /health route and error handler.
```

### 4.3 Next.js middleware for auth

Create `src/middleware.ts`:

```ts
// COPILOT TASK:
// Implement authentication middleware for protected routes.
// Requirements:
// - Protect all paths under /workspaces/: check for 'jira-clone-session' cookie.
// - If missing, redirect to /sign-in.
// - Use NextRequest/NextResponse, and export config with matcher for '/workspaces/:path*'.
// - Keep it compatible with Next.js 14 App Router.
```

### 4.4 Bug / Fix Notes

* **Cookie not set in dev**:
  * In dev over `http`, you might need `secure: process.env.NODE_ENV === 'production'`.
* **Appwrite CORS errors**:
  * In Appwrite console, add allowed origins: your dev URL (`http://localhost:3000`) + Vercel domain.
* Auth loops (redirects forever) mean:
  * Middleware always thinks session is missing – check cookie name + path.

---

## 5. Phase 4 – Data Model: Workspaces, Members, Projects, Tasks

You already designed the schema; now codify it.

### 5.1 Types & repositories

In `src/types/domain.ts`:

```ts
// COPILOT TASK:
// Define TypeScript interfaces for:
// - Workspace, Member, Project, Task
// According to the architecture:
//   Workspace: id, name, imageUrl, inviteCode, adminId
//   Member: id, userId, workspaceId, role ('ADMIN' | 'MEMBER')
//   Project: id, workspaceId, name, imageUrl
//   Task: id, projectId, workspaceId, content, description, status, priority,
//         position (number), dueDate, assigneeId
// Use string literals for enums where appropriate.
// Status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELED'
// Priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
```

In `src/server/repos/tasks-repo.ts`:

```ts
// COPILOT TASK:
// Implement a TasksRepository that wraps Appwrite DB calls.
// Requirements:
// - Functions: createTask, updateTask, getTasksByProject, getTasksForWorkspace, deleteTask.
// - Use createAdminClient().databases and use environment variables for DATABASE_ID
//   and COLLECTION_TASKS_ID.
// - Each function should map Appwrite documents to the Task interface.
// - Handle Appwrite exceptions and rethrow as generic Error with message.
// - For getTasksByProject, sort by position ascending.
```

In `src/server/repos/workspace-repo.ts`:

```ts
// COPILOT TASK:
// Implement a WorkspaceRepository that wraps Appwrite DB calls.
// Requirements:
// - Functions: createWorkspace, getWorkspaceById, getWorkspacesByUserId, updateWorkspace, deleteWorkspace.
// - Use createAdminClient().databases and DATABASE_ID, COLLECTION_WORKSPACES_ID.
// - Map Appwrite documents to Workspace interface.
// - Handle errors gracefully.
```

In `src/server/repos/member-repo.ts`:

```ts
// COPILOT TASK:
// Implement a MemberRepository that wraps Appwrite DB calls.
// Requirements:
// - Functions: createMember, getMembersByWorkspace, getMemberById, updateMember, deleteMember.
// - Use createAdminClient().databases and DATABASE_ID, COLLECTION_MEMBERS_ID.
// - Map Appwrite documents to Member interface.
```

In `src/server/repos/project-repo.ts`:

```ts
// COPILOT TASK:
// Implement a ProjectRepository that wraps Appwrite DB calls.
// Requirements:
// - Functions: createProject, getProjectsByWorkspace, getProjectById, updateProject, deleteProject.
// - Use createAdminClient().databases and DATABASE_ID, COLLECTION_PROJECTS_ID.
// - Map Appwrite documents to Project interface.
```

### 5.2 Appwrite indexes (manual)

In Appwrite console, for `tasks` collection:

* Fields:
  * `projectId` (string, indexed)
  * `workspaceId` (string, indexed)
  * `status` (enum)
  * `position` (double)
  * `assigneeId` (string, indexed)
  * `dueDate` (datetime, indexed)
  * `content` (string)
  * `description` (string)
  * `priority` (enum)

* Indexes:
  * `[projectId, status]` for filtering columns of Kanban.
  * `[projectId, position]` for ordering.
  * `[workspaceId, dueDate]` for calendar.

For `workspaces` collection:
* Fields: `name` (string), `imageUrl` (string), `inviteCode` (string, indexed), `adminId` (string, indexed)

For `members` collection:
* Fields: `userId` (string, indexed), `workspaceId` (string, indexed), `role` (enum)
* Index: `[userId, workspaceId]`

For `projects` collection:
* Fields: `workspaceId` (string, indexed), `name` (string), `imageUrl` (string)

### 5.3 Bug / Fix Notes

* If you see **Appwrite "Index not found" errors**, you forgot to create or deploy an index for the fields you're querying.
* Implement a small **mapping helper**:
  * Raw `Document` → typed `Task` to avoid repeated mapping logic.

---

## 6. Phase 5 – Workspace & Onboarding UI

### 6.1 Workspace creation API

In `src/server/workspaces.ts`:

```ts
// COPILOT TASK:
// Implement workspacesApp as a Hono sub-app.
// Endpoints:
// - POST /: create workspace with { name, imageUrl? } from JSON.
//   - Generate an inviteCode (6-char alphanumeric).
//   - Create Workspace document.
//   - Create Member document for creator with role 'ADMIN'.
//   - Get userId from the session cookie (extract from c.req.header('cookie')).
// - GET /: list workspaces for the current user (based on Appwrite userId from session).
//   - Query members collection for userId, then fetch workspaces.
// - GET /:id: get a single workspace.
// - PATCH /:id: update workspace (name, imageUrl).
// - DELETE /:id: delete workspace (admin only).
// Use zod for validation, and reuse WorkspaceRepository and MemberRepository.
```

Mount in `route.ts`:

```ts
// COPILOT TASK:
// Import workspacesApp and mount it under '/workspaces' with .route('/workspaces', workspacesApp).
```

### 6.2 Auth UI

In `src/app/(auth)/sign-in/page.tsx`:

```tsx
// COPILOT TASK:
// Implement a sign-in page with a form using React Hook Form and zod resolver.
// - Fields: email, password.
// - On submit, call client.api.auth.login.$post().
// - On success, redirect to /workspaces using useRouter from next/navigation.
// - Show error toast on failure (use a simple alert or toast library).
// - Include a link to /sign-up for new users.
// Mark this as a client component ('use client').
```

In `src/app/(auth)/sign-up/page.tsx`:

```tsx
// COPILOT TASK:
// Implement a sign-up page with a form using React Hook Form and zod resolver.
// - Fields: name, email, password.
// - On submit, call client.api.auth.register.$post().
// - On success, redirect to /workspaces.
// - Show error toast on failure.
// - Include a link to /sign-in for existing users.
// Mark this as a client component.
```

### 6.3 Workspace UI

In `src/app/workspaces/page.tsx`:

```tsx
// COPILOT TASK:
// Implement a workspace listing page.
// - Fetch workspaces from client.api.workspaces.$get() using react-query.
// - Show a grid of cards with workspace name and avatar.
// - Include a "Create workspace" button that opens a modal to create one.
// - Use shadcn/ui components if available (Dialog, Button, Card).
// - On create, call client.api.workspaces.$post() and refetch list.
// Mark as a client component where necessary.
```

In `src/app/workspaces/[workspaceId]/layout.tsx`:

```tsx
// COPILOT TASK:
// Create a workspace layout that:
// - Shows a sidebar with navigation links: Dashboard, Projects, Calendar, Settings.
// - Displays workspace name at the top.
// - Renders children in the main content area.
// - Is responsive: collapsible sidebar on mobile.
```

### 6.4 Bug / Fix Notes

* Infinite reloads at `/sign-in` usually mean:
  * Middleware matcher is too broad and also catches auth routes; narrow it to `/workspaces/:path*`.
* If `client.api.workspaces.$get` type is missing:
  * Ensure `AppType` export is correct and `hc<AppType>` is used in RPC client.

---

## 7. Phase 6 – Projects & Tasks CRUD

### 7.1 Projects API

In `src/server/projects.ts`:

```ts
// COPILOT TASK:
// Implement projectsApp as a Hono sub-app for project CRUD.
// Endpoints:
// - GET /: list projects by workspaceId (query param).
// - POST /: create project with { name, imageUrl?, workspaceId } from JSON.
// - GET /:id: get a single project.
// - PATCH /:id: update project (name, imageUrl).
// - DELETE /:id: delete project.
// Use zod validators and ProjectRepository.
// Validate that user is a member of the workspace before allowing access.
```

Mount under `/projects`.

### 7.2 Tasks API with Lexorank positions

In `src/server/tasks.ts`:

```ts
// COPILOT TASK:
// Implement tasksApp as a Hono sub-app for task CRUD.
// Endpoints:
// - GET /: list tasks by projectId (query param).
// - POST /: create task with initial status and position.
//   - Determine starting position by querying max position in that column and adding 1000.
//   - Fields: content, description?, status, priority, projectId, workspaceId, assigneeId?, dueDate?
// - GET /:id: get a single task.
// - PATCH /:id: update task fields including status and position.
//   - Implement a helper function computeNewPosition(prevPosition, nextPosition) that returns
//     (prev + next) / 2 as per lexorank-like approach.
//   - If moving to end, use lastPosition + 1000.
//   - If moving to start, use firstPosition / 2.
// - DELETE /:id: delete task.
// Use zod validators and TasksRepository.
```

Mount under `/tasks`.

### 7.3 Bug / Fix Notes

* **Position conflicts**: ensure you always compute based on actual neighbor positions.
* **Query performance**: add proper indexes in Appwrite for `[projectId, position]`.

---

## 8. Phase 7 – Kanban Board with Drag & Drop

### 8.1 Kanban UI

In `src/app/workspaces/[workspaceId]/projects/[projectId]/board/page.tsx`:

```tsx
// COPILOT TASK:
// Implement a Kanban board for a project using @dnd-kit.
// Requirements:
// - Columns for statuses: BACKLOG, TODO, IN_PROGRESS, DONE, CANCELED.
// - Fetch tasks via react-query from client.api.tasks.$get({ query: { projectId } }).
// - Use DndContext, SortableContext to allow drag-and-drop of cards
//   between columns and reordering within a column.
// - On drop, compute new position between nearest neighbors and call
//   client.api.tasks[':id'].$patch() with new status + position.
// - Implement optimistic updates: update local cache immediately and roll back on error.
// - Make layout responsive with horizontal scroll for columns on mobile.
// - Each task card should show: content, assignee avatar, priority badge, due date.
// Mark as client component.
```

In `src/components/kanban/task-card.tsx`:

```tsx
// COPILOT TASK:
// Create a TaskCard component for Kanban.
// Props: task (Task type), onClick handler.
// Display:
// - Task content (title).
// - Priority badge (color-coded).
// - Due date if set.
// - Assignee avatar if assigned.
// - Use shadcn/ui Card and Badge components.
// Make it draggable-friendly (works with @dnd-kit).
```

### 8.2 Bug / Fix Notes

* **Jittery drag or wrong drop target**:
  * Check dnd-kit `collisionDetection` and that droppable/drag handles have correct ids.
* **Wrong order after refresh**:
  * Ensure tasks are fetched **sorted by `position`** from the backend.
* **Massive write load**:
  * Always update only the dragged task's `position`, not reindex all tasks.

---

## 9. Phase 8 – Table View & Calendar View

### 9.1 Data Table (TanStack Table)

In `src/app/workspaces/[workspaceId]/projects/[projectId]/table/page.tsx`:

```tsx
// COPILOT TASK:
// Implement a "Table view" for tasks using @tanstack/react-table.
// Requirements:
// - Columns: Title, Status, Priority, Assignee, Due Date, Actions (edit/delete).
// - Use react-query to fetch tasks for projectId.
// - Filtering: by status, priority (controls update URL query params via useSearchParams).
// - Keep URL as source of truth: reading searchParams and refetch based on filters.
// - Add simple pagination if many tasks (10 per page).
// - Allow inline editing: click on cell to edit, blur to save.
// Mark as client component.
```

### 9.2 Calendar view

In `src/app/workspaces/[workspaceId]/calendar/page.tsx`:

```tsx
// COPILOT TASK:
// Implement a Calendar view using react-big-calendar and date-fns.
// Requirements:
// - Map tasks with dueDate to calendar events.
// - When clicking an event, open a side panel/modal showing task details.
// - Allow changing dueDate by dragging the event (optional enhancement).
// - Fetch tasks for the workspace, not just one project.
// - Use local timezone with dateFnsLocalizer.
// - Show event title as task content and color-code by priority.
// Mark as client component.
```

### 9.3 Bug / Fix Notes

* If calendar shows wrong dates/time, check:
  * Localizer configuration for `react-big-calendar`.
  * Ensure dueDate is stored as ISO string in Appwrite.
* For table view, ensure filters trigger proper refetch with new query params.

---

## 10. Phase 9 – Analytics Dashboard

### 10.1 Analytics API

In `src/server/analytics.ts`:

```ts
// COPILOT TASK:
// Implement analyticsApp as a Hono sub-app for workspace analytics.
// Endpoint: GET /workspaces/:workspaceId/analytics
// Requirements:
// - Fetch all tasks for the workspace.
// - Compute aggregations:
//   - Task count by Status (object: { BACKLOG: 5, TODO: 10, ... }).
//   - Task count by Priority (object: { LOW: 3, MEDIUM: 7, ... }).
//   - Tasks per assignee (array: [{ userId, count }, ...]).
//   - Upcoming tasks (due in next 7 days).
// - Return JSON with these aggregations.
// Use TasksRepository and MemberRepository.
```

Mount under `/analytics`.

### 10.2 Dashboard UI

In `src/app/workspaces/[workspaceId]/dashboard/page.tsx`:

```tsx
// COPILOT TASK:
// Implement a simple analytics dashboard.
// Metrics:
// - Task count by Status (pie or donut chart).
// - Task count by Priority (bar chart).
// - Tasks per assignee (list with avatars).
// - Upcoming tasks (table of tasks due soon).
// Requirements:
// - Fetch data from client.api.analytics.workspaces[':workspaceId'].analytics.$get().
// - Create simple custom charts using SVG or a lightweight chart library.
// - Make the dashboard mobile-friendly with responsive grid layout.
// - Use shadcn/ui Card components for each metric section.
// Mark as client component.
```

### 10.3 Bug / Fix Notes

* If performance is poor:
  * Add filtered queries / counts in repository instead of pulling all tasks to client.
* For charts, consider using a lightweight library like `recharts` if custom SVG is too complex.

---

## 11. Phase 10 – AI Integration with Gemini

### 11.1 AI API route

In `src/server/ai.ts`:

```ts
// COPILOT TASK:
// Implement aiApp as a Hono sub-app for AI helpers.
// Endpoint 1: POST /generate-description
// - Body: { title: string } via zod.
// - Use GoogleGenerativeAI with model 'gemini-1.5-flash'.
// - Prompt: "Generate a detailed task description in markdown format based on this title: {title}. 
//   Return JSON with fields: description (markdown string) and tags (string array)."
// - Strip ```json fences from response and JSON.parse it safely.
// - Return { description, tags }.
// Endpoint 2: POST /project-oracle
// - Body: { workspaceId: string, question: string }.
// - Fetch relevant tasks from Appwrite (e.g. high-priority or due this week).
// - Build a prompt that includes the tasks as JSON context and the user's question.
// - Return AI's natural language summary as { answer: string }.
// Handle API errors and return 429 if rate-limited, 500 for other errors.
// Use environment variable GOOGLE_API_KEY.
```

Mount under `/ai`.

### 11.2 Task description generator UI

In the task form component (e.g. `src/components/tasks/task-form.tsx`):

```tsx
// COPILOT TASK:
// Add AI task description generation to the task form.
// Requirements:
// - Add a "Generate Description" button with a sparkles icon next to the description textarea.
// - When clicked:
//   - Call client.api.ai['generate-description'].$post({ json: { title } }) via react-query mutation.
//   - While loading, show a spinner on the button and disable it.
//   - On success, populate the description textarea with the AI-generated markdown.
//   - Also add suggested tags if returned.
// - Debounce calls so if title is changed rapidly, we don't spam the API (use a simple debounce hook).
// - Handle errors gracefully with a toast notification.
```

### 11.3 "Project Oracle" UI

In workspace sidebar or dashboard (e.g. `src/components/workspace/project-oracle.tsx`):

```tsx
// COPILOT TASK:
// Implement a "Project Oracle" panel:
// - Input textarea where user asks a question about the project (e.g., "What is due this week?").
// - Submit button to send the question.
// - On submit, call client.api.ai['project-oracle'].$post({ json: { workspaceId, question } }).
// - Show loading indicator while processing.
// - Render answer markdown in a scrollable area below the input.
// - Handle API errors gracefully, including rate limit messages (show user-friendly message).
// - Add a "Clear" button to reset the conversation.
// Use react-query mutation and markdown renderer (e.g., react-markdown).
```

### 11.4 Bug / Fix Notes

* **429 rate limit** from Gemini:
  * In aiApp, detect rate-limit errors and send a clear JSON { error: 'Rate limited, please retry.' }.
  * In UI, implement a simple retry/backoff or show a friendly message.
* If JSON parsing fails:
  * Log the raw text; update prompt to enforce strict JSON.
  * Add a fallback `try/catch` and a more robust parser (e.g., strip non-JSON preface).

---

## 12. Phase 11 – Deployment Guide (All Free)

### 12.1 Push to GitHub

```powershell
git init
git add .
git commit -m "Initial Jira Clone implementation"
git branch -M main
git remote add origin https://github.com/<username>/jira-clone.git
git push -u origin main
```

### 12.2 Vercel deployment

1. Import the repo into **Vercel**.
2. Set **Environment Variables** in Vercel project:
   * `NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>`
   * `APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1`
   * `APPWRITE_PROJECT_ID=...`
   * `APPWRITE_API_KEY=...`
   * `GOOGLE_API_KEY=...`
   * `DATABASE_ID=...`
   * `COLLECTION_WORKSPACES_ID=...`
   * `COLLECTION_MEMBERS_ID=...`
   * `COLLECTION_PROJECTS_ID=...`
   * `COLLECTION_TASKS_ID=...`

3. Build and deploy (Vercel will detect Next.js automatically).
4. Test all routes (auth, workspace, Kanban, AI).

### 12.3 Appwrite config check

* In Appwrite project:
  * Add your Vercel domain to **Allowed Origins** (e.g., `https://your-app.vercel.app`).
  * Ensure DB + collections + indexes match what your repositories expect.
  * Set document-level permissions:
    * Workspaces: `team:[workspaceId]` read/write.
    * Tasks: workspace team read/write; delete may be admins only.
  * Set up a **Team** for each workspace to manage permissions properly.

### 12.4 Google AI Studio

* Ensure your **Google AI API key** has access to Gemini 1.5 Flash.
* Restrict key via HTTP referrer or IP if possible in Google Cloud Console.
* Monitor usage in Google AI Studio dashboard.

---

## 13. Bug Fixing Strategy with Copilot

Here are general **recipes** you can reuse.

### 13.1 Backend errors (Appwrite / Hono)

When you see stack traces in terminal or logs:

```ts
// COPILOT TASK:
// I am getting this runtime error from my Hono route:
//
// <PASTE ERROR + CODE SNIPPET>
//
// - Explain what it means.
// - Suggest a minimal fix for the current function.
// - If needed, adjust types or Appwrite queries to match my collection schema.
// - Avoid adding new external services or paid tools.
```

Focus on:
* **Index errors** → Add proper indexes in Appwrite.
* **Permission errors (401/403)** → Check document ACLs and session user id extraction.
* **CORS errors** → Fix Appwrite allowed origins.

### 13.2 Frontend UI bugs

For layout / interaction issues:

```tsx
// COPILOT TASK:
// This component has a bug:
// - Problem: <describe behavior, e.g., drag-and-drop card snaps to wrong column>
// - Here is the component code:
//
// <PASTE CODE>
//
// - Identify the likely cause.
// - Propose a corrected version of the component, preserving types.
// - Do not introduce any paid libraries; keep using the same stack.
```

Common fixes:
* Correct DnD ids and `SortableContext` keys.
* Ensure state updates are immutable and revalidate react-query cache correctly.

### 13.3 Performance & Free-Tier "Cliff" Issues

* If you're hitting **Appwrite bandwidth**:
  * Use smaller images, strict file size limits, and lazy image loading.
* If **Gemini** hits rate limits:
  * Debounce input, serialize requests (1 at a time per user), and cache responses if appropriate.

Ask Copilot:

```ts
// COPILOT TASK:
// Add rate limiting and debouncing around this AI call to reduce requests:
// <PASTE FUNCTION>
// Use a simple in-memory debounce on the frontend and avoid adding new dependencies.
```

---

## 14. Additional Features & Enhancements

### 14.1 Real-time updates

```ts
// COPILOT TASK:
// Add real-time task updates using Appwrite Realtime API.
// Requirements:
// - In the Kanban board, subscribe to task collection changes for the current project.
// - When a task is created/updated/deleted by another user, update the local react-query cache.
// - Show a subtle notification when changes occur.
// - Unsubscribe on component unmount.
```

### 14.2 File attachments

```ts
// COPILOT TASK:
// Add file attachment support to tasks using Appwrite Storage.
// Requirements:
// - In task form, add a file upload input.
// - On upload, call createAdminClient().storage.createFile() and store fileId in task document.
// - In task view, display attached files with download links.
// - Limit file size to 5MB for free tier.
// - Support common formats: images, PDFs, documents.
```

### 14.3 Notifications system

```tsx
// COPILOT TASK:
// Implement a simple in-app notifications system.
// Requirements:
// - Create a notifications collection in Appwrite.
// - Trigger notifications when:
//   - User is assigned to a task.
//   - Task due date is approaching.
//   - User is mentioned in a comment (future feature).
// - Add a bell icon in header showing unread count.
// - Dropdown shows recent notifications with mark as read action.
```

---

## 15. Testing Strategy

### 15.1 API testing

```ts
// COPILOT TASK:
// Create API tests for the tasks endpoint using Vitest.
// Requirements:
// - Test file: src/server/tasks.test.ts
// - Mock createAdminClient() and TasksRepository.
// - Test cases:
//   - Creating a task returns 201 with task object.
//   - Updating task position computes correct new position.
//   - Invalid input returns 400 with validation errors.
//   - Unauthorized access returns 401.
// Use TypeScript and follow Vitest best practices.
```

### 15.2 Component testing

```tsx
// COPILOT TASK:
// Create component tests for TaskCard using Vitest and React Testing Library.
// Requirements:
// - Test file: src/components/kanban/task-card.test.tsx
// - Test cases:
//   - Renders task content correctly.
//   - Shows priority badge with correct color.
//   - Displays assignee avatar if assigned.
//   - Calls onClick handler when clicked.
// Mock the Task data and use proper TypeScript types.
```

---

## 16. Quick Reference

### Common Copilot Patterns

**Creating a new feature:**
```tsx
// COPILOT TASK:
// Implement [feature name] with the following requirements:
// - [Requirement 1]
// - [Requirement 2]
// - [Requirement 3]
// Use [tech stack] and follow [pattern/architecture].
```

**Fixing a bug:**
```tsx
// COPILOT TASK:
// Fix this bug: [describe issue]
// Current behavior: [what happens now]
// Expected behavior: [what should happen]
// Code: [paste relevant code]
```

**Refactoring:**
```tsx
// COPILOT TASK:
// Refactor this code to:
// - [Goal 1, e.g., improve performance]
// - [Goal 2, e.g., better TypeScript types]
// - [Goal 3, e.g., follow best practices]
// Keep the same functionality and API.
```

### Environment Variables Checklist

```env
# Required for all environments
NEXT_PUBLIC_APP_URL=
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
DATABASE_ID=
COLLECTION_WORKSPACES_ID=
COLLECTION_MEMBERS_ID=
COLLECTION_PROJECTS_ID=
COLLECTION_TASKS_ID=
GOOGLE_API_KEY=

# Optional
STORAGE_BUCKET_ID=
```

### Appwrite Collections Structure

**workspaces:**
- name: string
- imageUrl: string (optional)
- inviteCode: string (indexed, unique)
- adminId: string (indexed)

**members:**
- userId: string (indexed)
- workspaceId: string (indexed)
- role: enum ['ADMIN', 'MEMBER']

**projects:**
- workspaceId: string (indexed)
- name: string
- imageUrl: string (optional)

**tasks:**
- projectId: string (indexed)
- workspaceId: string (indexed)
- content: string
- description: string (optional)
- status: enum ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED']
- priority: enum ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
- position: float (indexed)
- dueDate: datetime (indexed, optional)
- assigneeId: string (indexed, optional)

---

## 17. Next Steps

After completing all phases:

1. **Polish UI/UX:**
   - Add loading skeletons.
   - Improve error messages.
   - Add empty states for lists.
   - Enhance mobile responsiveness.

2. **Optimize Performance:**
   - Implement proper caching strategies.
   - Lazy load heavy components.
   - Optimize images with Next.js Image component.
   - Add proper indexes in Appwrite.

3. **Security Hardening:**
   - Add CSRF protection.
   - Implement rate limiting.
   - Sanitize user inputs.
   - Review Appwrite permissions.

4. **Monitoring & Analytics:**
   - Add error tracking (e.g., Sentry free tier).
   - Set up Vercel Analytics.
   - Monitor Appwrite usage.
   - Track Google AI API usage.

5. **Documentation:**
   - Create user documentation.
   - Document API endpoints.
   - Add code comments.
   - Create deployment runbook.

---

**Happy coding with Copilot! 🚀**
