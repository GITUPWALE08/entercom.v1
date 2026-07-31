import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, ChevronRight, FileText, ShoppingBag, CreditCard, PenTool, User } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../../api/chat';
import type { ChatConversation } from '../../../api/chat';
import { CustomerChatWindow } from './CustomerChatWindow';

export function SupportWidget() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const { data: conversationsResponse } = useQuery({
    queryKey: ['chat-conversations', { role: 'customer' }],
    queryFn: () => chatApi.list(),
    enabled: !!user && isOpen,
  });

  // Hidden on authentication pages
  const hiddenPaths = ['/login', '/register', '/forgot-password'];
  if (hiddenPaths.includes(location.pathname)) return null;

  const conversations = Array.isArray(conversationsResponse) ? conversationsResponse : [];
  const activeConversations = conversations.filter((c: ChatConversation) => c.status !== 'closed');
  
  const totalUnread = activeConversations.reduce((acc: number, c: ChatConversation) => acc + (c.unread_count || 0), 0);

  const smartContext = () => {
    // Basic regex matching for smart context
    const reqMatch = location.pathname.match(/\/requests\/([a-zA-Z0-9-]+)/);
    if (reqMatch) return { type: 'request', id: reqMatch[1] };
    
    const orderMatch = location.pathname.match(/\/orders\/([a-zA-Z0-9-]+)/);
    if (orderMatch) return { type: 'order', id: orderMatch[1] };
    
    const paymentMatch = location.pathname.match(/\/payments\/([a-zA-Z0-9-]+)/);
    if (paymentMatch) return { type: 'payment', id: paymentMatch[1] };
    
    return null;
  };

  const context = smartContext();

  const startNewConversation = async (_category: string) => {
    // In a real implementation, we'd create the conversation here, or open a composer with the category pre-filled.
    // For now, we'll just open the chat window with a "new" ID that CustomerChatWindow will handle.
    setActiveConversationId('new');
  };

  if (activeConversationId) {
    return (
      <CustomerChatWindow 
        conversationId={activeConversationId} 
        onClose={() => setIsOpen(false)} 
        onBack={() => setActiveConversationId(null)}
        context={context}
        
      />
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in slide-in-from-bottom md:relative md:inset-auto md:mb-4 md:w-[380px] md:h-auto md:max-h-[80vh] md:rounded-2xl md:shadow-2xl md:border md:border-gray-100 md:slide-in-from-bottom-5">
          <div className="bg-ess-purple p-6 text-white relative shrink-0">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-1">Hi there 👋</h3>
            <p className="text-white/80 text-sm">How can we help you today?</p>
          </div>
          
          <div className="p-4 bg-gray-50 flex-1 md:max-h-[450px] overflow-y-auto">
            {!user ? (
              <div className="flex flex-col items-center justify-center p-6 text-center h-48">
                <div className="w-12 h-12 bg-purple-100 text-ess-purple rounded-full flex items-center justify-center mb-3">
                  <User size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Sign in to get support</h4>
                <p className="text-xs text-gray-500 mb-4">You need an account to start a conversation with our support team.</p>
                <a href="/login" className="px-6 py-2 bg-ess-purple text-white text-sm font-medium rounded-lg hover:bg-ess-darkPurple transition-colors w-full">
                  Sign in
                </a>
              </div>
            ) : (
              <>
                {activeConversations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Your active chats</h4>
                    <div className="space-y-2">
                      {activeConversations.map((conv: ChatConversation) => (
                        <button
                          key={conv.id}
                          onClick={() => setActiveConversationId(conv.id)}
                          className="w-full bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-ess-purple/30 hover:shadow-md transition-all text-left flex items-center justify-between group"
                        >
                          <div className="overflow-hidden">
                            <div className="font-medium text-sm text-gray-900 truncate pr-4">{conv.subject}</div>
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {conv.last_message ? conv.last_message.body : 'No messages yet'}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-400 group-hover:text-ess-purple shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Start a conversation</h4>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  <button onClick={() => startNewConversation('request')} className="w-full flex items-center justify-between p-3 hover:bg-purple-50 transition-colors text-left group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 group-hover:text-ess-purple">I need help with a request</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-ess-purple shrink-0" />
                  </button>
                  <button onClick={() => startNewConversation('payment')} className="w-full flex items-center justify-between p-3 hover:bg-purple-50 transition-colors text-left group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <CreditCard size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 group-hover:text-ess-purple">Payment Issue</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-ess-purple shrink-0" />
                  </button>
                  <button onClick={() => startNewConversation('order')} className="w-full flex items-center justify-between p-3 hover:bg-purple-50 transition-colors text-left group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <ShoppingBag size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 group-hover:text-ess-purple">Order Support</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-ess-purple shrink-0" />
                  </button>
                  <button onClick={() => startNewConversation('technical')} className="w-full flex items-center justify-between p-3 hover:bg-purple-50 transition-colors text-left group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <PenTool size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 group-hover:text-ess-purple">Technical Support</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-ess-purple shrink-0" />
                  </button>
                  <button onClick={() => startNewConversation('general')} className="w-full flex items-center justify-between p-3 hover:bg-purple-50 transition-colors text-left group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                        <MessageSquare size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 group-hover:text-ess-purple">General Question</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-ess-purple shrink-0" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-ess-purple hover:bg-ess-darkPurple text-white p-4 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-300"
          aria-label="Open support chat"
        >
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse border-2 border-white">
              {totalUnread}
            </span>
          )}
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
