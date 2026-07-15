import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const WS_BASE_URL = BASE_URL.replace('/api/v1', '').replace(/^http/, 'ws');

export function useWebsocket(channel: 'system' | 'requests' = 'requests') {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!token) return;

    // Build the WebSocket URL with authentication
    const wsUrl = `${WS_BASE_URL}/ws/${channel}/?token=${token}`;
    
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WebSocket] Connected to ${channel}`);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle explicit reconnect commands or auth errors
        if (data.event === 'websocket.auth_failed' || data.event === 'websocket.token_expired') {
            console.warn('[WebSocket] Auth failed, closing connection');
            ws.close();
            return;
        }

        // Global invalidation mapping based on event namespaces
        // e.g. "request.updated", "notification.created", "order.fulfilled"
        const eventType = data.event || '';
        
        if (eventType.startsWith('request.')) {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            if (data.request_id) {
                queryClient.invalidateQueries({ queryKey: ['requests', String(data.request_id)] });
            }
        } else if (eventType.startsWith('quote.')) {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        } else if (eventType.startsWith('order.')) {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        } else if (eventType.startsWith('booking.')) {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        } else if (eventType.startsWith('notification.')) {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } else if (eventType.startsWith('verification.')) {
            queryClient.invalidateQueries({ queryKey: ['verifications'] });
        } else if (eventType.startsWith('inventory.')) {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      } catch (err) {
        console.error('[WebSocket] Failed to parse message', err);
      }
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Disconnected from ${channel}`, event.code);
      
      // Do not reconnect if auth failed (4001, 4002, 4003, 4004)
      if (event.code >= 4001 && event.code <= 4004) {
          return;
      }

      // Try reconnecting after a delay
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error(`[WebSocket] Error on ${channel}`, error);
    };
  }, [channel, token, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Expose a method to subscribe to a specific request if on the requests channel
  const subscribeToRequest = useCallback((requestId: string | number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && channel === 'requests') {
        wsRef.current.send(JSON.stringify({
            action: 'subscribe',
            request_id: requestId
        }));
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
        // Queue it for when it opens (basic implementation)
        const checkOpen = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    action: 'subscribe',
                    request_id: requestId
                }));
                clearInterval(checkOpen);
            }
        }, 100);
    }
  }, [channel]);

  return { subscribeToRequest };
}
