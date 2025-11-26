import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/rpc';
import type { Workspace } from '@/types/domain';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await client.api.workspaces.$get();
      if (!response.ok) throw new Error('Failed to fetch workspaces');
      const data = await response.json();
      return data.workspaces as Workspace[];
    },
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: async () => {
      const response = await client.api.workspaces[':id'].$get({
        param: { id },
      });
      if (!response.ok) throw new Error('Failed to fetch workspace');
      const data = await response.json();
      return data.workspace as Workspace & { role: string };
    },
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await client.api.workspaces.$post({
        json: data,
      });
      if (!response.ok) throw new Error('Failed to create workspace');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateWorkspace(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      const response = await client.api.workspaces[':id'].$patch({
        param: { id },
        json: data,
      });
      if (!response.ok) throw new Error('Failed to update workspace');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', id] });
    },
  });
}

export function useDeleteWorkspace(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.workspaces[':id'].$delete({
        param: { id },
      });
      if (!response.ok) throw new Error('Failed to delete workspace');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useRegenerateInvite(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.workspaces[':id']['regenerate-invite'].$post({
        param: { id },
      });
      if (!response.ok) throw new Error('Failed to regenerate invite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', id] });
    },
  });
}

export function useJoinWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      inviteCode,
    }: {
      workspaceId: string;
      inviteCode: string;
    }) => {
      const response = await client.api.workspaces.join[':workspaceId'][':inviteCode'].$post({
        param: { workspaceId, inviteCode },
      });
      if (!response.ok) throw new Error('Failed to join workspace');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
