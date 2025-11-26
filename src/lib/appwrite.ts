import { Client, Account, Databases, Storage } from 'appwrite';

// Environment variables
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID!;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY!;

/**
 * Creates an Appwrite admin client with API key authentication
 * Use this for server-side operations that require elevated permissions
 */
export function createAdminClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

/**
 * Creates an Appwrite client scoped to a user session
 * Use this for operations that should respect user permissions
 * 
 * @param sessionCookie - Optional session cookie for SSR
 */
export function createUserClient(sessionCookie?: string) {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

  // If a session cookie is provided, set it for SSR
  if (sessionCookie) {
    client.setSession(sessionCookie);
  }

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

/**
 * Helper to extract session cookie from request headers
 */
export function getSessionFromCookie(cookie?: string): string | undefined {
  if (!cookie) return undefined;
  
  const match = cookie.match(/chyra-session=([^;]+)/);
  return match ? match[1] : undefined;
}
