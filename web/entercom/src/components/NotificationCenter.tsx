import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, AlertCircle, Info, FileText, Loader2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    isLoading,
    unreadCount, 
    markAsRead, 
    archive, 
    markAllRead,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useNotifications();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const navigate = useNavigate();

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const lastNotificationRef = useCallback((node: HTMLLIElement | null) => {
    if (isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, fetchNextPage, hasNextPage]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.read_at) {
      markAsRead.mutate(notification.id);
    }
    setIsOpen(false);
    
    // Navigate using absolute paths dynamically
    const roleMatch = window.location.pathname.match(/^\/portal\/(customer|staff|manager|admin)/);
    const rolePath = roleMatch ? roleMatch[0] : '/portal/customer';
    
    if (notification.resource_type === 'request') {
       navigate(`${rolePath}/requests/${notification.resource_id}`);
    } else if (notification.resource_type === 'order') {
       navigate(`${rolePath}/orders/${notification.resource_id}`);
    } else if (notification.resource_type === 'booking') {
       navigate(`${rolePath}/bookings/${notification.resource_id}`);
    } else if (notification.resource_type === 'payment') {
       navigate(`${rolePath}/payments/${notification.resource_id}`);
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'alerts': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'updates': return <Info className="w-5 h-5 text-blue-500" />;
      case 'marketing': return <FileText className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const activeNotifications = notifications.filter(n => n.status !== 'ARCHIVED');

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 focus:outline-none rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-ess-purple hover:text-purple-800 transition-colors flex items-center gap-1"
                disabled={unreadCount === 0 || markAllRead.isPending}
              >
                {markAllRead.isPending ? <Loader2 className="animate-spin w-3 h-3" /> : <Check size={14} />}
                Mark all read
              </button>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col p-4 space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 flex flex-col items-center">
                <Bell className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">You have no new notifications.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {activeNotifications.map((notification, index) => {
                  const isLast = index === activeNotifications.length - 1;
                  return (
                  <li 
                    ref={isLast ? lastNotificationRef : null}
                    key={notification.id} 
                    className={`relative p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${!notification.read_at ? 'bg-purple-50/30' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium text-gray-900 ${!notification.read_at ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap mt-0.5">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    {/* Archive button appears on hover */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        archive.mutate(notification.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="Archive"
                    >
                      <Trash2 size={14} />
                    </button>
                    {!notification.read_at && (
                       <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-ess-purple rounded-r-full" />
                    )}
                  </li>
                )})}
                {isFetchingNextPage && (
                  <li className="p-4 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-ess-purple" />
                  </li>
                )}
              </ul>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-gray-50">
             <button 
               onClick={() => {
                 setIsOpen(false);
                 const roleMatch = window.location.pathname.match(/^\/portal\/(customer|staff|manager|admin)/);
                 const rolePath = roleMatch ? roleMatch[0] : '/portal/customer';
                 navigate(`${rolePath}/profile`); 
               }}
               className="w-full py-2 text-sm text-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
             >
               View preferences
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
