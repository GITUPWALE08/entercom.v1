import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../../api/chat';
import type { ChatMessage } from '../../../api/chat';
import { useChatWebsocket } from '../hooks/useChatWebsocket';
// import { PageContainer } from '../../../shared/components/PageContainer';
import { ConversationSidebar } from '../components/ConversationSidebar';
import { ConversationHeader } from '../components/ConversationHeader';
import { MessageList } from '../components/MessageList';
import { MessageComposer } from '../components/MessageComposer';
import { useParams } from 'react-router-dom';

export default function StaffInboxPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [queueFilter, setQueueFilter] = useState('all');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  const { data: conversations = [] } = useQuery({
    queryKey: ['chat', searchQuery],
    queryFn: () => searchQuery ? chatApi.search(searchQuery) : chatApi.list(),
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

  const filteredConversations = conversations.filter(c => {
    if (queueFilter === 'all') return true;
    if (queueFilter === 'resolved') return c.status === 'resolved';
    if (queueFilter === 'closed') return c.status === 'closed';
    if (queueFilter === 'unassigned') return c.status === 'open' && !c.assigned_staff;
    if (queueFilter === 'assigned') return c.status === 'open' && !!c.assigned_staff;
    return true;
  });

  // WebSocket hook ensures messages list updates in real-time.
  const { markRead, sendTypingStart, sendTypingStop } = useChatWebsocket({
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
        queryClient.setQueryData(['chat', searchQuery], (oldList: any) => {
            if (!oldList) return oldList;
            return oldList.map((c: any) => c.id === id ? { ...c, unread_count: 0 } : c);
        });
    }
  }, [id, markRead, queryClient, searchQuery]);

  useEffect(() => {
    const handleTyping = (e: CustomEvent) => {
      const { action, user_id, user_name } = e.detail;
      setTypingUsers(prev => {
        const next = { ...prev };
        if (action === 'typing_start') {
          next[user_id] = user_name;
        } else {
          delete next[user_id];
        }
        return next;
      });
      if (action === 'typing_start') {
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = { ...prev };
            delete next[user_id];
            return next;
          });
        }, 5000);
      }
    };
    window.addEventListener('chat_typing' as any, handleTyping);
    return () => window.removeEventListener('chat_typing' as any, handleTyping);
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: (args: { body: string, messageType: 'text' | 'internal_note', files: File[], replyToId?: string }) => 
      chatApi.sendMessage(id!, args.body, args.messageType, args.files, args.replyToId),
    onSuccess: (newMessage) => {
      // Manually append for immediate UI feedback
      queryClient.setQueryData(['chat', id, 'messages'], (old: any) => {
        if (!old) return { results: [newMessage] };
        if (old.results) {
          if (old.results.find((m: any) => m.id === newMessage.id)) return old;
          return { ...old, results: [...old.results, newMessage] };
        }
        return { results: [...(old || []), newMessage] };
      });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });

  const handleSend = async (body: string, messageType: 'text' | 'internal_note', files: File[], replyToId?: string) => {
    await sendMessageMutation.mutateAsync({ body, messageType, files, replyToId });
    setReplyToMessage(null);
  };

  const editMessageMutation = useMutation({
    mutationFn: (args: { messageId: string, body: string }) => 
      chatApi.editMessage(args.messageId, args.body),
    onSuccess: () => {
      setEditingMessage(null);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
  });

  const handleEditSubmit = async (body: string) => {
    if (editingMessage) {
      await editMessageMutation.mutateAsync({ messageId: editingMessage.id, body });
    }
  };

  const handleDelete = (msg: ChatMessage) => {
    deleteMessageMutation.mutate(msg.id);
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
    <div className="h-full flex flex-col pt-2 pb-4 px-2 md:px-6">
      <div className="flex h-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        
        <ConversationSidebar 
          conversations={filteredConversations} 
          activeId={id} 
          basePath="/portal/staff/inbox" 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          queueFilter={queueFilter}
          onQueueChange={setQueueFilter}
          className={id ? 'hidden md:flex' : 'flex'}
        />
        
        <div className={`flex-1 flex flex-col h-full bg-gray-50/30 ${!id ? 'hidden md:flex' : 'flex'}`}>
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
                onReply={(msg) => { setReplyToMessage(msg); setEditingMessage(null); }}
                onEdit={(msg) => { setEditingMessage(msg); setReplyToMessage(null); }}
                onDelete={handleDelete}
                typingUsers={typingUsers}
              />
              <MessageComposer 
                onSend={handleSend} 
                disabled={conversationDetail.status === 'closed'} 
                replyToMessage={replyToMessage}
                onCancelReply={() => setReplyToMessage(null)}
                editingMessage={editingMessage}
                onEditSubmit={handleEditSubmit}
                onCancelEdit={() => setEditingMessage(null)}
                sendTypingStart={sendTypingStart}
                sendTypingStop={sendTypingStop}
              />
            </>
          ) : (
             <div className="flex-1 flex items-center justify-center text-gray-500">
                 Conversation not found.
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
