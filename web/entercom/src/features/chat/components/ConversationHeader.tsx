import type { ChatConversation } from '../../../api/chat';
import { chatApi } from '../../../api/chat';
import { useAuthStore } from '../../../store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface ConversationHeaderProps {
  conversation: ChatConversation;
  onAssign?: () => void;
}

export function ConversationHeader({ conversation, onAssign }: ConversationHeaderProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const location = useLocation();
  const basePath = location.pathname.split('/').slice(0, 4).join('/');

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

  const closeMutation = useMutation({
    mutationFn: () => chatApi.close(conversation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => chatApi.reopen(conversation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });

  return (
    <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shrink-0 shadow-sm z-10 relative flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <Link 
          to={basePath} 
          className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
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
      </div>

      <div className="flex flex-wrap gap-2">
        {isStaff && !conversation.assigned_staff && !isClosed && !isResolved && (
          <button 
            onClick={onAssign}
            className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Assign Staff
          </button>
        )}
        {isStaff && conversation.assigned_staff && !isClosed && !isResolved && (
          <button 
            onClick={() => {
                const staffId = window.prompt("Enter new Staff ID to transfer to:");
                if (staffId) {
                  const reason = window.prompt("Enter reason for transfer:") || '';
                  chatApi.transfer(conversation.id, staffId, reason).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['chat', conversation.id] });
                      queryClient.invalidateQueries({ queryKey: ['chat'] });
                  }).catch(() => {
                      alert('Failed to transfer conversation.');
                  });
                }
            }}
            className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Transfer
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
        
        {isStaff && isResolved && !isClosed && (
          <button 
            onClick={() => {
                if (window.confirm('Are you sure you want to close this conversation?')) {
                    closeMutation.mutate();
                }
            }}
            disabled={closeMutation.isPending}
            className="px-3 py-1.5 text-sm font-medium bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50"
          >
            {closeMutation.isPending ? 'Closing...' : 'Close'}
          </button>
        )}
        
        {isStaff && (isResolved || isClosed) && (
          <button 
            onClick={() => {
                if (window.confirm('Are you sure you want to reopen this conversation?')) {
                    reopenMutation.mutate();
                }
            }}
            disabled={reopenMutation.isPending}
            className="px-3 py-1.5 text-sm font-medium bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50"
          >
            {reopenMutation.isPending ? 'Reopening...' : 'Reopen'}
          </button>
        )}
      </div>
    </div>
  );
}
