import { Databases, Query, ID } from 'appwrite';
import { Project } from '@/types/domain';

const DATABASE_ID = process.env.DATABASE_ID!;
const COLLECTION_ID = process.env.COLLECTION_PROJECTS_ID!;

export class ProjectRepository {
  constructor(private databases: Databases) {}

  /**
   * Create a new project
   */
  async create(data: {
    name: string;
    workspaceId: string;
    imageUrl?: string;
  }): Promise<Project> {
    const doc = await this.databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        name: data.name,
        workspaceId: data.workspaceId,
        imageUrl: data.imageUrl || '',
      }
    );
    return this.mapDocument(doc);
  }

  /**
   * Get project by ID
   */
  async getById(projectId: string): Promise<Project | null> {
    try {
      const doc = await this.databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        projectId
      );
      return this.mapDocument(doc);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all projects in a workspace
   */
  async getByWorkspace(workspaceId: string): Promise<Project[]> {
    const response = await this.databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('workspaceId', workspaceId), Query.limit(100)]
    );
    return response.documents.map(this.mapDocument);
  }

  /**
   * Update project
   */
  async update(
    projectId: string,
    data: Partial<Pick<Project, 'name' | 'imageUrl'>>
  ): Promise<Project> {
    const doc = await this.databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      projectId,
      data
    );
    return this.mapDocument(doc);
  }

  /**
   * Delete project
   */
  async delete(projectId: string): Promise<void> {
    await this.databases.deleteDocument(DATABASE_ID, COLLECTION_ID, projectId);
  }

  /**
   * Map Appwrite document to Project type
   */
  private mapDocument(doc: any): Project {
    return {
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      workspaceId: doc.workspaceId,
      name: doc.name,
      imageUrl: doc.imageUrl || undefined,
    };
  }
}
