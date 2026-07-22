import React from 'react';
import { ChatConversation } from '../../../api/chat';
import { Link } from 'react-router-dom';

interface ConversationSidebarProps {
  conversations: ChatConversation[];
  activeId?: string;
  basePath: string; // e.g. '/portal/staff/inbox' or '/portal/customer/support'
}

export function ConversationSidebar({ conversations, activeId, basePath }: ConversationSidebarProps) {
  return (
    <div className="w-full md:w-80 border-r border-gray-100 bg-white flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-bold text-lg text-gray-900">Conversations</h2>
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
                    {conv.unread_count > 0 && (
                      <span className="shrink-0 bg-ess-purple text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
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
