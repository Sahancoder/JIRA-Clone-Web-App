/**
 * Domain types for Chyra application
 */

// User role within a workspace
export type MemberRole = 'ADMIN' | 'MEMBER';

// Task status in workflow
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';

// Task priority levels
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Workspace - top-level organizational unit
 */
export interface Workspace {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  imageUrl?: string;
  inviteCode: string;
  adminId: string;
}

/**
 * Member - user membership in a workspace
 */
export interface Member {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  workspaceId: string;
  role: MemberRole;
}

/**
 * Project - container for tasks within a workspace
 */
export interface Project {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  workspaceId: string;
  name: string;
  imageUrl?: string;
}

/**
 * Task - individual work item
 */
export interface Task {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  projectId: string;
  workspaceId: string;
  content: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number; // Lexorank-style position for ordering
  dueDate?: string; // ISO date string
  assigneeId?: string;
}

/**
 * User info from Appwrite
 */
export interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  prefs: Record<string, unknown>;
}
