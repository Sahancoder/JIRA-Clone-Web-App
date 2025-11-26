'use client';

import { useEffect, useState } from 'react';
import { createUserClient } from '@/lib/appwrite';
import type { RealtimeResponseEvent } from 'appwrite';

interface UseRealtimeTasksProps {
  projectId: string;
  onTaskUpdate: (task: any) => void;
  onTaskCreate: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
}

export function useRealtimeTasks({
  projectId,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
}: UseRealtimeTasksProps) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const { client } = createUserClient();
    const collectionId = process.env.NEXT_PUBLIC_COLLECTION_TASKS_ID;
    const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID;

    if (!collectionId || !databaseId) {
      console.error('Missing Appwrite configuration for realtime');
      return;
    }

    // Subscribe to collection events
    const unsubscribe = client.subscribe(
      `databases.${databaseId}.collections.${collectionId}.documents`,
      (response: RealtimeResponseEvent<any>) => {
        const payload = response.payload;

        // Filter by projectId
        if (payload.projectId !== projectId) return;

        // Handle different event types
        if (
          response.events.includes(
            `databases.${databaseId}.collections.${collectionId}.documents.*.create`
          )
        ) {
          onTaskCreate(payload);
        } else if (
          response.events.includes(
            `databases.${databaseId}.collections.${collectionId}.documents.*.update`
          )
        ) {
          onTaskUpdate(payload);
        } else if (
          response.events.includes(
            `databases.${databaseId}.collections.${collectionId}.documents.*.delete`
          )
        ) {
          onTaskDelete(payload.$id);
        }
      }
    );

    setIsConnected(true);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [projectId, onTaskUpdate, onTaskCreate, onTaskDelete]);

  return { isConnected };
}
