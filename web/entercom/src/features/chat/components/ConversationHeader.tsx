import React from 'react';
import { ChatConversation, chatApi } from '../../../api/chat';
import { useAuthStore } from '../../../store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ConversationHeaderProps {
  conversation: ChatConversation;
  onAssign?: () => void;
}

export function ConversationHeader({ conversation, onAssign }: ConversationHeaderProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const isStaff = user?.role === 'staff' || user?.role === 'manager' || user?.role === 'admin';
  const isResolved = conversation.status === 'resolved';
  const isClosed = conversation.status === 'closed';

  const resolveMutation = useMutation({
    mutationFn: () => chatApi.resolve(conversation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });

  return (
    <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shrink-0 shadow-sm z-10 relative">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg font-bold text-gray-900">{conversation.subject}</h2>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
            ${isClosed ? 'bg-gray-100 text-gray-600' : isResolved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {conversation.status}
          </span>
        </div>
        <p className="text-xs text-gray-500 flex gap-4">
          <span>ID: <span className="font-medium text-gray-700">{conversation.public_id}</span></span>
          {conversation.assigned_staff ? (
            <span>Assigned: <span className="font-medium text-gray-700">{conversation.assigned_staff.first_name} {conversation.assigned_staff.last_name}</span></span>
          ) : (
            <span>Unassigned</span>
          )}
        </p>
      </div>

      <div className="flex gap-2">
        {isStaff && !conversation.assigned_staff && !isClosed && !isResolved && (
          <button 
            onClick={onAssign}
            className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Assign Staff
          </button>
        )}
        
        {isStaff && !isClosed && !isResolved && (
          <button 
            onClick={() => {
                if (window.confirm('Are you sure you want to resolve this conversation?')) {
                    resolveMutation.mutate();
                }
            }}
            disabled={resolveMutation.isPending}
            className="px-3 py-1.5 text-sm font-medium bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50"
          >
            {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
          </button>
        )}
      </div>
    </div>
  );
}
