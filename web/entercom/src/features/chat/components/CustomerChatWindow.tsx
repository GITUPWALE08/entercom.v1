import { useState, useEffect } from 'react';
import { ChevronLeft, X, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../../api/chat';
import type { ChatMessage } from '../../../api/chat';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { useChatWebsocket } from '../hooks/useChatWebsocket';

interface CustomerChatWindowProps {
  conversationId: string;
  onClose: () => void;
  onBack: () => void;
  context: { type: string; id: string } | null;
}

export function CustomerChatWindow({ conversationId: initialConversationId, onClose, onBack, context }: CustomerChatWindowProps) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const queryClient = useQueryClient();
  
  const [replyTo, setReplyTo] = useState<ChatMessage | undefined>();
  const [editingMessage, setEditingMessage] = useState<ChatMessage | undefined>();
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  const isNew = conversationId === 'new';

  const { data: conversation } = useQuery({
    queryKey: ['chat', conversationId],
    queryFn: () => chatApi.get(conversationId),
    enabled: !isNew,
  });

  const { data: messagesResponse, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat', conversationId, 'messages'],
    queryFn: () => chatApi.getMessages(conversationId),
    enabled: !isNew,
  });

  const messages = messagesResponse?.results || [];

  const { sendTypingStart, sendTypingStop } = useChatWebsocket({
    conversationId: isNew ? '' : conversationId,
  });

  useEffect(() => {
    const handleTyping = (e: any) => {
      const data = e.detail;
      if (data.conversation_id === conversationId) {
        if (data.type === 'typing_start') {
          setTypingUsers(prev => ({ ...prev, [data.user_id]: data.user_name }));
        } else {
          setTypingUsers(prev => {
            const next = { ...prev };
            delete next[data.user_id];
            return next;
          });
        }
      }
    };
    window.addEventListener('chat_typing', handleTyping);
    return () => window.removeEventListener('chat_typing', handleTyping);
  }, [conversationId]);

  const createMutation = useMutation({
    mutationFn: (_text: string) => {
      let category = 'support';
      if (context?.type === 'request') category = 'request';
      if (context?.type === 'order') category = 'order';
      if (context?.type === 'payment') category = 'payment';
      if (context?.type === 'booking') category = 'booking';

      const payload: any = {
        subject: `Support conversation`,
        conversation_type: category,
      };
      if (context) {
        payload[context.type] = context.id;
      }
      return chatApi.create(payload);
    },
    onSuccess: async (newConv, textArg) => {
      setConversationId(newConv.id);
      // Immediately send the first message
      const msg = await chatApi.sendMessage(newConv.id, textArg, 'text', []);
      queryClient.setQueryData(['chat', newConv.id, 'messages'], { results: [msg], next: null });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }
  });

  const sendMutation = useMutation({
    mutationFn: (data: { text: string; files: File[]; replyToId?: string }) => {
      return chatApi.sendMessage(conversationId, data.text, 'text', data.files, data.replyToId);
    },
    onSuccess: (newMessage) => {
      setReplyTo(undefined);
      queryClient.setQueryData(['chat', conversationId, 'messages'], (old: any) => {
        if (!old) return { results: [newMessage] };
        if (old.results) {
          if (old.results.find((m: any) => m.id === newMessage.id)) return old;
          return { ...old, results: [...old.results, newMessage] };
        }
        return { results: [...(old || []), newMessage] };
      });
    }
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; text: string }) => chatApi.editMessage(data.id, data.text),
    onSuccess: () => {
      setEditingMessage(undefined);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteMessage(id),
  });

  const handleSend = async (text: string, _type: 'text' | 'internal_note', files: File[], replyToId?: string) => {
    if (isNew) {
      createMutation.mutate(text);
    } else {
      if (editingMessage) {
        editMutation.mutate({ id: editingMessage.id, text });
      } else {
        sendMutation.mutate({ text, files, replyToId });
      }
    }
  };

  const isClosed = conversation?.status === 'closed';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in slide-in-from-right md:relative md:inset-auto md:mb-4 md:w-[400px] md:h-[650px] md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:border md:border-gray-100 md:slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-ess-purple p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">Support</h3>
              {!isNew && (
                <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
                  {conversation?.status || 'Open'}
                </div>
              )}
            </div>
            {context && isNew && (
              <span className="text-xs text-white/80 capitalize">
                Re: {context.type} {context.id.substring(0, 8)}
              </span>
            )}
            {!isNew && conversation && (
               <span className="text-xs text-white/80 truncate max-w-[200px]">
                 {conversation.subject}
               </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-gray-50/50">
        {isNew ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 text-ess-purple rounded-full flex items-center justify-center mb-4">
              <User size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">We typically reply in a few minutes</h3>
            <p className="text-sm text-gray-500">Send us a message and we'll get right back to you.</p>
          </div>
        ) : (
          <MessageList
            messages={messages}
            isLoading={messagesLoading}
            onReply={setReplyTo}
            onEdit={setEditingMessage}
            onDelete={(msg) => deleteMutation.mutate(msg.id)}
            typingUsers={typingUsers}
          />
        )}
      </div>

      {/* Composer */}
      {isClosed ? (
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-gray-500 text-sm">
          This conversation is closed. Start a new one to keep chatting.
        </div>
      ) : (
        <MessageComposer
          onSend={handleSend}
          replyToMessage={replyTo}
          onCancelReply={() => setReplyTo(undefined)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(undefined)}
          sendTypingStart={sendTypingStart}
          sendTypingStop={sendTypingStop}
        />
      )}
    </div>
  );
}
