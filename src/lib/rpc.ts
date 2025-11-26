import { hc } from 'hono/client';
import type { AppType } from '@/app/api/[[...route]]/route';

// Get the base URL from environment or use relative path
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';

// Create the typed RPC client
export const client = hc<AppType>(baseUrl);
