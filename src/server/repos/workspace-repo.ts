import { Databases, Query, ID } from 'appwrite';
import { Workspace } from '@/types/domain';

const DATABASE_ID = process.env.DATABASE_ID!;
const COLLECTION_ID = process.env.COLLECTION_WORKSPACES_ID!;

export class WorkspaceRepository {
  constructor(private databases: Databases) {}

  /**
   * Generate a 6-character alphanumeric invite code
   */
  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Create a new workspace
   */
  async create(data: {
    name: string;
    adminId: string;
    imageUrl?: string;
  }): Promise<Workspace> {
    const inviteCode = this.generateInviteCode();

    const doc = await this.databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        name: data.name,
        adminId: data.adminId,
        imageUrl: data.imageUrl || '',
        inviteCode,
      }
    );

    return this.mapDocument(doc);
  }

  /**
   * Get workspace by ID
   */
  async getById(workspaceId: string): Promise<Workspace | null> {
    try {
      const doc = await this.databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        workspaceId
      );
      return this.mapDocument(doc);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get workspace by invite code
   */
  async getByInviteCode(inviteCode: string): Promise<Workspace | null> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('inviteCode', inviteCode), Query.limit(1)]
      );

      if (response.documents.length === 0) return null;
      return this.mapDocument(response.documents[0]);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update workspace
   */
  async update(
    workspaceId: string,
    data: Partial<Pick<Workspace, 'name' | 'imageUrl'>>
  ): Promise<Workspace> {
    const doc = await this.databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      workspaceId,
      data
    );
    return this.mapDocument(doc);
  }

  /**
   * Delete workspace
   */
  async delete(workspaceId: string): Promise<void> {
    await this.databases.deleteDocument(DATABASE_ID, COLLECTION_ID, workspaceId);
  }

  /**
   * Regenerate invite code
   */
  async regenerateInviteCode(workspaceId: string): Promise<Workspace> {
    const newCode = this.generateInviteCode();
    return this.update(workspaceId, { inviteCode: newCode } as any);
  }

  /**
   * Map Appwrite document to Workspace type
   */
  private mapDocument(doc: any): Workspace {
    return {
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      name: doc.name,
      adminId: doc.adminId,
      inviteCode: doc.inviteCode,
      imageUrl: doc.imageUrl || undefined,
    };
  }
}
