import { Databases, Query, ID } from 'appwrite';
import { Member, MemberRole } from '@/types/domain';

const DATABASE_ID = process.env.DATABASE_ID!;
const COLLECTION_ID = process.env.COLLECTION_MEMBERS_ID!;

export class MemberRepository {
  constructor(private databases: Databases) {}

  /**
   * Create a new member
   */
  async create(data: {
    userId: string;
    workspaceId: string;
    role: MemberRole;
  }): Promise<Member> {
    const doc = await this.databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      data
    );
    return this.mapDocument(doc);
  }

  /**
   * Get member by user and workspace
   */
  async getByUserAndWorkspace(
    userId: string,
    workspaceId: string
  ): Promise<Member | null> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('workspaceId', workspaceId),
          Query.limit(1),
        ]
      );

      if (response.documents.length === 0) return null;
      return this.mapDocument(response.documents[0]);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all workspaces for a user
   */
  async getWorkspacesByUser(userId: string): Promise<Member[]> {
    const response = await this.databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('userId', userId), Query.limit(100)]
    );
    return response.documents.map(this.mapDocument);
  }

  /**
   * Get all members of a workspace
   */
  async getMembersByWorkspace(workspaceId: string): Promise<Member[]> {
    const response = await this.databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('workspaceId', workspaceId), Query.limit(100)]
    );
    return response.documents.map(this.mapDocument);
  }

  /**
   * Update member role
   */
  async updateRole(memberId: string, role: MemberRole): Promise<Member> {
    const doc = await this.databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      memberId,
      { role }
    );
    return this.mapDocument(doc);
  }

  /**
   * Delete member
   */
  async delete(memberId: string): Promise<void> {
    await this.databases.deleteDocument(DATABASE_ID, COLLECTION_ID, memberId);
  }

  /**
   * Check if user is admin of workspace
   */
  async isAdmin(userId: string, workspaceId: string): Promise<boolean> {
    const member = await this.getByUserAndWorkspace(userId, workspaceId);
    return member?.role === 'ADMIN';
  }

  /**
   * Map Appwrite document to Member type
   */
  private mapDocument(doc: any): Member {
    return {
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      userId: doc.userId,
      workspaceId: doc.workspaceId,
      role: doc.role,
    };
  }
}
