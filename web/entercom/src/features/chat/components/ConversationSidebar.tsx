import type { ChatConversation } from '../../../api/chat';
import { Link } from 'react-router-dom';

interface ConversationSidebarProps {
  conversations: ChatConversation[];
  activeId?: string;
  basePath: string; // e.g. '/portal/staff/inbox' or '/portal/customer/support'
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  queueFilter?: string;
  onQueueChange?: (q: string) => void;
  className?: string;
}

export function ConversationSidebar({ conversations, activeId, basePath, searchQuery, onSearchChange, queueFilter, onQueueChange, className = '' }: ConversationSidebarProps) {
  return (
    <div className={`w-full md:w-80 border-r border-gray-100 bg-white flex-col h-full shrink-0 ${className}`}>
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-gray-900">Conversations</h2>
        </div>
        {onSearchChange && (
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchQuery || ''}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ess-purple focus:border-transparent outline-none"
          />
        )}
        {onQueueChange && (
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {['all', 'unassigned', 'assigned', 'resolved', 'closed'].map(q => (
              <button
                key={q}
                onClick={() => onQueueChange(q)}
                className={`px-3 py-1 text-xs font-medium rounded-full shrink-0 capitalize transition-colors ${queueFilter === q ? 'bg-ess-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No active conversations.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <Link
                  key={conv.id}
                  to={`${basePath}/${conv.id}`}
                  className={`block p-4 transition-colors hover:bg-gray-50 ${isActive ? 'bg-purple-50 hover:bg-purple-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-medium truncate pr-2 ${isActive ? 'text-ess-purple' : 'text-gray-900'} ${conv.unread_count > 0 ? 'font-bold' : ''}`}>
                      {conv.subject}
                    </h3>
                    <div className="flex gap-1 items-center shrink-0">
                      {conv.status === 'resolved' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Resolved</span>}
                      {conv.status === 'closed' && <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Closed</span>}
                      {conv.unread_count > 0 && (
                        <span className="bg-ess-purple text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-gray-500 truncate pr-4">
                      {conv.last_message ? (
                        conv.last_message.message_type === 'system' 
                          ? <i>System message</i>
                          : conv.last_message.body
                      ) : (
                        <i>No messages yet</i>
                      )}
                    </p>
                    {conv.last_message && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(conv.last_message.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
