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
  const reconnectTimerRef = useRef<number | null>(null);

  const onMessageReceivedRef = useRef(onMessageReceived);
  const onReadReceiptRef = useRef(onReadReceipt);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
    onReadReceiptRef.current = onReadReceipt;
  }, [onMessageReceived, onReadReceipt]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !conversationId) return;

    // Close any existing connection before opening a new one
    if (ws.current) {
      ws.current.onclose = null; // Prevent reconnect from firing
      ws.current.close();
      ws.current = null;
    }
    // Clear any pending reconnect timer
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsHost = import.meta.env.VITE_WS_URL;
    if (!wsHost) {
      // Use VITE_API_URL if set, otherwise use the same default as axios.ts
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      try {
        const url = new URL(apiUrl);
        wsHost = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}`;
      } catch (e) {
        wsHost = `${wsProtocol}//${window.location.host}`;
      }
    }
    
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
          const newMsg: ChatMessage = data.message;
          
          // Emit mark_delivered if message is from someone else
          // Read user ID from zustand persisted auth store
          let currentUserId: string | null = null;
          try {
            const authRaw = localStorage.getItem('auth-storage');
            if (authRaw) {
              const parsed = JSON.parse(authRaw);
              currentUserId = parsed?.state?.user?.id || null;
            }
          } catch (_) { /* ignore parse errors */ }
          if (newMsg.sender && currentUserId && newMsg.sender.id !== currentUserId) {
             if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ action: 'mark_delivered', message_id: newMsg.id }));
             }
          }
          
          queryClient.setQueryData(
            ['chat', conversationId, 'messages'], 
            (oldData: any) => {
              if (!oldData) return oldData;
              // If the message is already in cache, ignore
              let exists = false;
              if (oldData.results) exists = oldData.results.some((m: any) => m.id === newMsg.id);
              else if (oldData.pages) exists = oldData.pages.some((p: any) => p.results.some((m: any) => m.id === newMsg.id));
              else exists = oldData.some?.((m: any) => m.id === newMsg.id);
              
              if (exists) return oldData;
              

              if (oldData.results) {
                return { ...oldData, results: [...oldData.results, newMsg] };
              }
              if (oldData.pages) {
                const newPages = [...oldData.pages];
                if (newPages.length > 0) {
                  newPages[0] = { ...newPages[0], results: [...newPages[0].results, newMsg] };
                }
                return { ...oldData, pages: newPages };
              }
              return [...(oldData || []), newMsg];
            }
          );
          queryClient.invalidateQueries({
            queryKey: ['chat', conversationId, 'messages']
          });
          if (onMessageReceivedRef.current) onMessageReceivedRef.current(newMsg);
        } else if (data.type === 'message_updated') {
          queryClient.setQueryData(['chat', conversationId, 'messages'], (oldData: any) => {
              if (!oldData) return oldData;
              const updateMsg = (msg: ChatMessage) => msg.id === data.message_id ? { ...msg, body: data.body, edited_at: data.edited_at } : msg;
              if (oldData.results) return { ...oldData, results: oldData.results.map(updateMsg) };
              if (oldData.pages) return { ...oldData, pages: oldData.pages.map((p: any) => ({ ...p, results: p.results.map(updateMsg) })) };
              return oldData.map(updateMsg);
          });
        } else if (data.type === 'message_deleted') {
          queryClient.setQueryData(['chat', conversationId, 'messages'], (oldData: any) => {
              if (!oldData) return oldData;
              const updateMsg = (msg: ChatMessage) => msg.id === data.message_id ? { ...msg, is_deleted: true } : msg;
              if (oldData.results) return { ...oldData, results: oldData.results.map(updateMsg) };
              if (oldData.pages) return { ...oldData, pages: oldData.pages.map((p: any) => ({ ...p, results: p.results.map(updateMsg) })) };
              return oldData.map(updateMsg);
          });
        } else if (data.type === 'message_delivered') {
          queryClient.setQueryData(['chat', conversationId, 'messages'], (oldData: any) => {
              if (!oldData) return oldData;
              const updateMsg = (msg: ChatMessage) => msg.id === data.message_id && !msg.delivered_at ? { ...msg, delivered_at: data.delivered_at } : msg;
              if (oldData.results) return { ...oldData, results: oldData.results.map(updateMsg) };
              if (oldData.pages) return { ...oldData, pages: oldData.pages.map((p: any) => ({ ...p, results: p.results.map(updateMsg) })) };
              return oldData.map(updateMsg);
          });
        } else if (data.type === 'read_receipt') {
          queryClient.setQueryData(['chat', conversationId, 'messages'], (oldData: any) => {
              if (!oldData) return oldData;
              const updateMsg = (msg: ChatMessage) => (!msg.read_at && msg.sender?.id !== data.user_id && new Date(msg.created_at) <= new Date(data.read_at)) ? { ...msg, read_at: data.read_at, delivered_at: msg.delivered_at || data.read_at } : msg;
              if (oldData.results) return { ...oldData, results: oldData.results.map(updateMsg) };
              if (oldData.pages) return { ...oldData, pages: oldData.pages.map((p: any) => ({ ...p, results: p.results.map(updateMsg) })) };
              return oldData.map(updateMsg);
          });
          if (onReadReceiptRef.current) onReadReceiptRef.current(data.user_id, data.read_at);
        } else if (data.type === 'typing_start' || data.type === 'typing_stop') {
          // You could pass this to a callback or manage state here
          const event = new CustomEvent('chat_typing', { detail: data });
          window.dispatchEvent(event);
        } else if (data.type === 'presence_online' || data.type === 'presence_offline') {
          const event = new CustomEvent('chat_presence', { detail: data });
          window.dispatchEvent(event);
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
        reconnectTimerRef.current = window.setTimeout(connect, timeout);
      }
    };

    ws.current.onerror = (error) => {
      console.error('Chat websocket error:', error);
    };
  }, [conversationId, queryClient]);

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
        ws.current.onclose = null; // Prevent reconnect on intentional close
        ws.current.close();
        ws.current = null;
      }
      if (reconnectTimerRef.current) {
         window.clearTimeout(reconnectTimerRef.current);
         reconnectTimerRef.current = null;
      }
      if (typingTimeoutRef.current) {
         window.clearTimeout(typingTimeoutRef.current);
         typingTimeoutRef.current = null;
      }
    };
  }, [connect]);

  const markRead = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'mark_read' }));
    }
  }, []);

  const sendTypingStart = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'typing_start' }));
      
      if (typingTimeoutRef.current) {
         window.clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
         if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ action: 'typing_stop' }));
         }
      }, 3000);
    }
  }, []);

  const sendTypingStop = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'typing_stop' }));
      if (typingTimeoutRef.current) {
         window.clearTimeout(typingTimeoutRef.current);
      }
    }
  }, []);

  return { isConnected, markRead, sendTypingStart, sendTypingStop };
}
