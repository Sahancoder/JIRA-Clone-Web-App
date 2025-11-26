'use client';

import { useState, useEffect } from 'react';

interface Member {
  $id: string;
  userId: string;
  workspaceId: string;
  role: 'ADMIN' | 'MEMBER';
  $createdAt: string;
}

interface TeamManagementProps {
  workspaceId: string;
}

export function TeamManagement({ workspaceId }: TeamManagementProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchWorkspaceDetails();
  }, [workspaceId]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceDetails = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      if (!response.ok) throw new Error('Failed to fetch workspace');
      const data = await response.json();
      setInviteCode(data.workspace.inviteCode || '');
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
    }
  };

  const handleRegenerateInvite = async () => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/regenerate-invite`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to regenerate invite');
      const data = await response.json();
      setInviteCode(data.workspace.inviteCode);
      alert('Invite code regenerated successfully!');
    } catch (error) {
      console.error('Failed to regenerate invite:', error);
      alert('Failed to regenerate invite code');
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/join/${workspaceId}/${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-navy">Invite Team Members</h3>
            <p className="text-sm text-gray-600 mt-1">
              Share this link to invite people to your workspace
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
          >
            Invite
          </button>
        </div>

        {inviteCode && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Invite Link
                </label>
                <code className="text-sm text-gray-800 break-all">
                  {`${window.location.origin}/join/${workspaceId}/${inviteCode}`}
                </code>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyInviteLink}
                className="text-sm text-primary hover:text-primary-hover font-medium"
              >
                Copy Link
              </button>
              <button
                onClick={handleRegenerateInvite}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Regenerate Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-navy">Team Members</h3>
          <p className="text-sm text-gray-600 mt-1">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div
              key={member.$id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                  {member.userId.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {member.userId}
                  </div>
                  <div className="text-sm text-gray-500">
                    Joined {new Date(member.$createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    member.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No members yet. Invite someone to get started!</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-navy mb-4">Invite Team Member</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Share this invite link with your team member:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800 break-all">
                  {`${window.location.origin}/join/${workspaceId}/${inviteCode}`}
                </code>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    copyInviteLink();
                    setShowInviteModal(false);
                  }}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
