import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '../../../api/chat';

interface UseChatWebsocketProps {
  conversationId: string;
  onMessageReceived?: (message: ChatMessage) => void;
  onReadReceipt?: (userId: string, readAt: string) => void;
}

export function useChatWebsocket({ conversationId, onMessageReceived, onReadReceipt }: UseChatWebsocketProps) {
  const queryClient = useQueryClient();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !conversationId) return;

    // Use wss:// in production, ws:// in dev based on your environment
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}`;
    
    // Connect with token in protocol (or query param if server supports it).
    // Assuming token is passed via protocols array as standard for JWT in websockets
    const wsUrl = `${wsHost}/ws/chat/${conversationId}/`;
    
    ws.current = new WebSocket(wsUrl, ['access_token', token]);

    ws.current.onopen = () => {
      console.log(`Connected to chat ${conversationId}`);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          const newMsg: ChatMessage = {
            id: data.message_id,
            conversation: conversationId,
            sender: data.sender_id ? { id: data.sender_id, first_name: '', last_name: '', email: '' } : null,
            body: data.body,
            message_type: data.message_type,
            created_at: data.created_at,
            edited_at: null,
            is_deleted: false,
          };
          
          // Update React Query Cache
          queryClient.setQueryData(
            ['chat', conversationId, 'messages'], 
            (oldData: any) => {
              if (!oldData) return oldData;
              // Handle infinite query pages vs normal list
              if (oldData.pages) {
                const newPages = [...oldData.pages];
                if (newPages.length > 0) {
                  // Prepend to first page assuming desc ordering, or append to last
                  // (Depends on how pagination is structured. We'll append to first for simplicity)
                  newPages[0].results = [newMsg, ...newPages[0].results];
                }
                return { ...oldData, pages: newPages };
              }
              // Flat array fallback
              return [newMsg, ...(oldData || [])];
            }
          );
          
          if (onMessageReceived) onMessageReceived(newMsg);
        } else if (data.type === 'read_receipt') {
          if (onReadReceipt) onReadReceipt(data.user_id, data.read_at);
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.current.onclose = (event) => {
      setIsConnected(false);
      console.log('Chat websocket closed', event.code);
      
      // 4403 is our custom unauthorized code, don't reconnect
      if (event.code !== 4403 && reconnectAttempts.current < maxReconnectAttempts) {
        const timeout = Math.pow(2, reconnectAttempts.current) * 1000;
        reconnectAttempts.current += 1;
        setTimeout(connect, timeout);
      }
    };

    ws.current.onerror = (error) => {
      console.error('Chat websocket error:', error);
    };
  }, [conversationId, queryClient, onMessageReceived, onReadReceipt]);

  useEffect(() => {
    connect();

    const handleTokenRefreshed = () => {
      if (ws.current) ws.current.close();
      connect();
    };
    window.addEventListener('token_refreshed', handleTokenRefreshed);

    return () => {
      window.removeEventListener('token_refreshed', handleTokenRefreshed);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const markRead = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'mark_read' }));
    }
  };

  return { isConnected, markRead };
}
