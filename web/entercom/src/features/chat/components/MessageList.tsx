import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../../api/chat';
import { useAuthStore } from '../../../store/authStore';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const { user } = useAuthStore();
  const listRef = useRef<HTMLDivElement>(null);
  
  // Sort messages oldest to newest
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  useEffect(() => {
    // Scroll to bottom on new messages
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ess-purple"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
        <span className="text-4xl mb-4">💬</span>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
        <p className="text-gray-500 text-sm">Send a message below to start the conversation.</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
      {sortedMessages.map((msg) => {
        if (msg.message_type === 'system' || !msg.sender) {
          return (
            <div key={msg.id} className="flex justify-center my-4">
              <div className="px-4 py-1.5 bg-gray-200/60 rounded-full text-xs font-medium text-gray-600">
                {msg.body}
              </div>
            </div>
          );
        }

        const isMine = user?.id === msg.sender.id;
        const isInternal = msg.message_type === 'internal_note';
        
        const renderStatus = () => {
          if (!isMine) return null;
          if (msg.read_at) {
            return <span className="text-blue-400 ml-1">✓✓</span>;
          }
          if (msg.delivered_at) {
            return <span className="text-gray-400 ml-1">✓✓</span>;
          }
          return <span className="text-gray-400 ml-1">✓</span>;
        };

        const renderAttachments = () => {
          if (!msg.attachments || msg.attachments.length === 0) return null;
          return (
            <div className="flex flex-col gap-2 mt-2">
              {msg.attachments.map(att => {
                const isImage = att.file_type.startsWith('image/');
                return (
                  <a 
                    key={att.id} 
                    href={att.file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block bg-black/10 rounded overflow-hidden"
                  >
                    {isImage ? (
                      <img src={att.file} alt={att.file_name} className="max-w-[200px] max-h-[200px] object-cover" />
                    ) : (
                      <div className="flex items-center gap-2 p-2 text-sm underline">
                        <span>📄</span>
                        <span className="truncate">{att.file_name}</span>
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          );
        };
        
        return (
          <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
            <div className={`flex flex-col max-w-[80%] ${isMine ? 'items-end' : 'items-start'}`}>
              {!isMine && (
                <span className="text-xs text-gray-500 mb-1 ml-1 font-medium flex items-center gap-2">
                  {msg.sender.first_name} {msg.sender.last_name}
                  {isInternal && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded-full uppercase font-bold tracking-wider">Internal</span>}
                </span>
              )}
              {isMine && isInternal && (
                 <span className="text-xs text-yellow-600 mb-1 mr-1 font-medium flex items-center gap-2">
                    Internal Note
                 </span>
              )}
              <div 
                className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap break-words ${
                  isInternal 
                    ? 'bg-yellow-50 border border-yellow-200 text-gray-800 ' + (isMine ? 'rounded-br-sm' : 'rounded-bl-sm')
                    : isMine 
                      ? 'bg-ess-purple text-white rounded-br-sm' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.is_deleted ? <span className="italic opacity-80">This message was deleted.</span> : msg.body}
                {renderAttachments()}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 mx-1 flex items-center">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {renderStatus()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
