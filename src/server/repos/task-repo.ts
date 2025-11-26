import { Databases, Query, ID } from 'appwrite';
import { Task, TaskStatus, TaskPriority } from '@/types/domain';

const DATABASE_ID = process.env.DATABASE_ID!;
const COLLECTION_ID = process.env.COLLECTION_TASKS_ID!;

export class TaskRepository {
  constructor(private databases: Databases) {}

  /**
   * Calculate new position using Lexorank approach
   */
  computeNewPosition(prevPosition?: number, nextPosition?: number): number {
    if (!prevPosition && !nextPosition) {
      return 1000; // First task
    }
    if (!prevPosition) {
      return (nextPosition! - 1000) / 2; // Moving to start
    }
    if (!nextPosition) {
      return prevPosition + 1000; // Moving to end
    }
    return (prevPosition + nextPosition) / 2; // Between two tasks
  }

  /**
   * Get max position for a status column
   */
  async getMaxPosition(projectId: string, status: TaskStatus): Promise<number> {
    const response = await this.databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('projectId', projectId),
        Query.equal('status', status),
        Query.orderDesc('position'),
        Query.limit(1),
      ]
    );

    if (response.documents.length === 0) return 0;
    return response.documents[0].position || 0;
  }

  /**
   * Create a new task
   */
  async create(data: {
    projectId: string;
    workspaceId: string;
    content: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
  }): Promise<Task> {
    // Calculate initial position
    const maxPosition = await this.getMaxPosition(data.projectId, data.status);
    const position = maxPosition + 1000;

    const doc = await this.databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        ...data,
        position,
        description: data.description || '',
        assigneeId: data.assigneeId || '',
        dueDate: data.dueDate || '',
      }
    );

    return this.mapDocument(doc);
  }

  /**
   * Get task by ID
   */
  async getById(taskId: string): Promise<Task | null> {
    try {
      const doc = await this.databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        taskId
      );
      return this.mapDocument(doc);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all tasks for a project, sorted by position
   */
  async getByProject(projectId: string): Promise<Task[]> {
    const response = await this.databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('projectId', projectId),
        Query.orderAsc('position'),
        Query.limit(500),
      ]
    );
    return response.documents.map(this.mapDocument);
  }

  /**
   * Get all tasks for a workspace
   */
  async getByWorkspace(workspaceId: string): Promise<Task[]> {
    const response = await this.databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('workspaceId', workspaceId), Query.limit(500)]
    );
    return response.documents.map(this.mapDocument);
  }

  /**
   * Get tasks by status
   */
  async getByStatus(projectId: string, status: TaskStatus): Promise<Task[]> {
    const response = await this.databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('projectId', projectId),
        Query.equal('status', status),
        Query.orderAsc('position'),
        Query.limit(100),
      ]
    );
    return response.documents.map(this.mapDocument);
  }

  /**
   * Update task
   */
  async update(
    taskId: string,
    data: Partial<Omit<Task, '$id' | '$createdAt' | '$updatedAt'>>
  ): Promise<Task> {
    const doc = await this.databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      taskId,
      data
    );
    return this.mapDocument(doc);
  }

  /**
   * Delete task
   */
  async delete(taskId: string): Promise<void> {
    await this.databases.deleteDocument(DATABASE_ID, COLLECTION_ID, taskId);
  }

  /**
   * Get overdue tasks
   */
  async getOverdue(workspaceId: string): Promise<Task[]> {
    const now = new Date().toISOString();
    const response = await this.databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('workspaceId', workspaceId),
        Query.lessThan('dueDate', now),
        Query.notEqual('status', 'DONE'),
        Query.notEqual('status', 'CANCELED'),
        Query.limit(100),
      ]
    );
    return response.documents.map(this.mapDocument);
  }

  /**
   * Map Appwrite document to Task type
   */
  private mapDocument(doc: any): Task {
    return {
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      projectId: doc.projectId,
      workspaceId: doc.workspaceId,
      content: doc.content,
      description: doc.description || undefined,
      status: doc.status,
      priority: doc.priority,
      position: doc.position,
      assigneeId: doc.assigneeId || undefined,
      dueDate: doc.dueDate || undefined,
    };
  }
}
