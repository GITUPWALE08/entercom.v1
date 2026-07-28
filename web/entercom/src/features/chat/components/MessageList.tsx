import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../../api/chat';
import { useAuthStore } from '../../../store/authStore';

const getBackendOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch (e) {
      return '';
    }
  }
  return '';
};

const getAttachmentUrl = (url: string) => {
  if (url.startsWith('/')) {
    const origin = getBackendOrigin();
    return origin ? `${origin}${url}` : url;
  }
  return url;
};

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onReply?: (msg: ChatMessage) => void;
  onEdit?: (msg: ChatMessage) => void;
  onDelete?: (msg: ChatMessage) => void;
  typingUsers?: Record<string, string>;
}

export function MessageList({ messages, isLoading, onReply, onEdit, onDelete, typingUsers = {} }: MessageListProps) {
  const { user } = useAuthStore();
  const listRef = useRef<HTMLDivElement>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // Sort messages oldest to newest
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Find first unread message from someone else
  const firstUnreadIndex = sortedMessages.findIndex(m => !m.read_at && m.sender && m.sender.id !== user?.id);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Scroll to bottom on new messages
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollBottom(isScrolledUp);
    }
  };

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
    <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 relative w-fit">
      {sortedMessages.map((msg, idx) => {
        const isFirstUnread = idx === firstUnreadIndex;
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
                  <React.Fragment key={att.id}>
                    {isImage ? (
                      <button onClick={() => setViewingImage(getAttachmentUrl(att.file))} className="block bg-black/10 rounded overflow-hidden">
                        <img src={getAttachmentUrl(att.file)} alt={att.file_name} className="max-w-[200px] max-h-[200px] object-cover" />
                      </button>
                    ) : (
                      <a href={getAttachmentUrl(att.file)} target="_blank" rel="noopener noreferrer" className="block bg-black/10 rounded overflow-hidden">
                        <div className="flex items-center gap-2 p-2 text-sm underline">
                          <span>📄</span>
                          <span className="truncate">{att.file_name}</span>
                        </div>
                      </a>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          );
        };
        
        return (
          <React.Fragment key={msg.id}>
            {isFirstUnread && (
              <div className="flex items-center justify-center my-4">
                <div className="h-px bg-red-200 flex-1"></div>
                <span className="px-4 text-xs font-semibold text-red-500 uppercase tracking-wider">Unread Messages</span>
                <div className="h-px bg-red-200 flex-1"></div>
              </div>
            )}
            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
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
              <div className="relative group/msg">
                <div 
                  className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap break-words ${
                    isInternal 
                      ? 'bg-yellow-50 border border-yellow-200 text-gray-800 ' + (isMine ? 'rounded-br-sm' : 'rounded-bl-sm')
                      : isMine 
                        ? 'bg-ess-purple text-white rounded-br-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.reply_to && (
                    <div className="mb-2 p-2 rounded bg-black/5 border-l-2 border-black/20 text-xs opacity-90">
                      <div className="font-semibold">{msg.reply_to.sender?.first_name || 'System'}</div>
                      <div className="truncate">{msg.reply_to.is_deleted ? 'This message was deleted' : msg.reply_to.body}</div>
                    </div>
                  )}
                  {msg.is_deleted ? <span className="italic opacity-80">This message was deleted.</span> : msg.body}
                  {renderAttachments()}
                </div>

                {/* Message Actions Menu (Hover) */}
                {!msg.is_deleted && (msg.message_type as string) !== 'system' && (
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 bg-white shadow-sm border border-gray-100 rounded-lg p-1`}>
                    <button onClick={() => onReply?.(msg)} className="p-1.5 text-gray-400 hover:text-ess-purple hover:bg-gray-50 rounded" title="Reply">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                    </button>
                    {isMine && (
                      <button onClick={() => onEdit?.(msg)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-50 rounded" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      </button>
                    )}
                    {(isMine || ['admin', 'manager'].includes(user?.role || '')) && (
                      <button onClick={() => {
                        if (window.confirm('Delete this message?')) onDelete?.(msg);
                      }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 mx-1 flex items-center">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {renderStatus()}
              </span>
            </div>
            </div>
          </React.Fragment>
        );
      })}
      
      {/* Typing Indicator */}
      {Object.values(typingUsers).length > 0 && (
        <div className="flex flex-col items-start mt-2">
          <span className="text-xs text-gray-500 mb-1 ml-1 font-medium flex items-center gap-2">
            {Object.values(typingUsers).join(', ')} {Object.values(typingUsers).length > 1 ? 'are' : 'is'} typing
          </span>
          <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Image Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setViewingImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setViewingImage(null)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img src={viewingImage} alt="Attachment Preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Jump to Latest Button */}
      {showScrollBottom && (
        <button 
          onClick={scrollToBottom}
          className="sticky bottom-4 left-1/2 -translate-x-1/2 bg-ess-purple text-white p-2 rounded-full shadow-lg hover:bg-ess-darkPurple transition-colors z-40 flex items-center justify-center w-10 h-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
        </button>
      )}
    </div>
  );
}
