import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../../api/chat';
import type { ChatMessage } from '../../../api/chat';
import { useChatWebsocket } from '../hooks/useChatWebsocket';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ConversationSidebar } from '../components/ConversationSidebar';
import { ConversationHeader } from '../components/ConversationHeader';
import { MessageList } from '../components/MessageList';
import { MessageComposer } from '../components/MessageComposer';
import { useParams } from 'react-router-dom';

export default function StaffInboxPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ['chat'],
    queryFn: chatApi.list,
    refetchInterval: 30000, // Background polling for new conversations
  });

  const { data: conversationDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => chatApi.get(id!),
    enabled: !!id,
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat', id, 'messages'],
    queryFn: () => chatApi.getMessages(id!),
    enabled: !!id,
  });

  // WebSocket hook ensures messages list updates in real-time.
  const { markRead } = useChatWebsocket({
    conversationId: id || '',
    onMessageReceived: (_msg: ChatMessage) => {
      // Re-fetch conversation list to update last message & unread count instantly
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    }
  });

  // Mark as read whenever we view a new conversation
  useEffect(() => {
    if (id) {
        markRead();
        // Optimistically clear unread count in sidebar
        queryClient.setQueryData(['chat'], (oldList: any) => {
            if (!oldList) return oldList;
            return oldList.map((c: any) => c.id === id ? { ...c, unread_count: 0 } : c);
        });
    }
  }, [id, markRead, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: (body: string) => chatApi.sendMessage(id!, body),
    onSuccess: () => {
      // Invalidate just in case, but websocket should have already handled appending.
      queryClient.invalidateQueries({ queryKey: ['chat', id, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });

  const handleSend = async (body: string) => {
    await sendMessageMutation.mutateAsync(body);
  };

  const handleAssign = () => {
    // Basic assignment logic for MVP - staff assigns self
    if (window.confirm('Assign yourself to this conversation?')) {
        chatApi.assignStaff(id!, 'self').then(() => {
            queryClient.invalidateQueries({ queryKey: ['chat', id] });
            queryClient.invalidateQueries({ queryKey: ['chat'] });
        }).catch(_err => {
            alert('Failed to assign staff.');
        });
    }
  };

  const messages = messagesData?.results || [];

  return (
    <PageContainer>
      <div className="flex h-[calc(100vh-160px)] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mt-2">
        
        <ConversationSidebar 
          conversations={conversations} 
          activeId={id} 
          basePath="/portal/staff/inbox" 
        />
        
        <div className="flex-1 flex flex-col h-full bg-gray-50/30">
          {!id ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <span className="text-6xl mb-4 opacity-50">📬</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Staff Inbox</h2>
              <p className="text-gray-500">Select a conversation from the sidebar to view details and send messages.</p>
            </div>
          ) : isLoadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ess-purple"></div>
            </div>
          ) : conversationDetail ? (
            <>
              <ConversationHeader 
                conversation={conversationDetail} 
                onAssign={handleAssign} 
              />
              <MessageList 
                messages={messages} 
                isLoading={isLoadingMessages} 
              />
              <MessageComposer 
                onSend={handleSend} 
                disabled={conversationDetail.status === 'closed'} 
              />
            </>
          ) : (
             <div className="flex-1 flex items-center justify-center text-gray-500">
                 Conversation not found.
             </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
}
