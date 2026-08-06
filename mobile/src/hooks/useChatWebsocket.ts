import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '../api/chat';

interface UseChatWebsocketProps {
  conversationId: string | null;
  onMessageReceived?: (message: ChatMessage) => void;
  onReadReceipt?: (userId: string, readAt: string) => void;
}

export function useChatWebsocket({ conversationId, onMessageReceived, onReadReceipt }: UseChatWebsocketProps) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectDelay = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMessageReceivedRef = useRef(onMessageReceived);
  const onReadReceiptRef = useRef(onReadReceipt);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
    onReadReceiptRef.current = onReadReceipt;
  }, [onMessageReceived, onReadReceipt]);

  const connect = useCallback(async () => {
    if (!conversationId) return;
    const token = await AsyncStorage.getItem('access_token');
    if (!token) return;

    if (ws.current) {
      ws.current.onclose = null;
      ws.current.close();
      ws.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://entercom-v1.onrender.com/api/v1';
    let wsBase: string;
    try {
      // Very basic URL parser logic since React Native doesn't have a full URL object in some environments
      const isHttps = apiUrl.startsWith('https:');
      const host = apiUrl.split('://')[1].split('/')[0];
      wsBase = `${isHttps ? 'wss:' : 'ws:'}//${host}`;
    } catch (e) {
      wsBase = 'wss://entercom-v1.onrender.com';
    }
    
    const wsUrl = `${wsBase}/ws/chat/${conversationId}/`;
    
    ws.current = new WebSocket(wsUrl, ['access_token', token]);

    ws.current.onopen = () => {
      console.log(`Connected to chat ${conversationId}`);
      setIsConnected(true);
      reconnectDelay.current = 1000;
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          const newMsg: ChatMessage = data.message;
          if (onMessageReceivedRef.current) onMessageReceivedRef.current(newMsg);
        } else if (data.type === 'read_receipt') {
          if (onReadReceiptRef.current) onReadReceiptRef.current(data.user_id, data.read_at);
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.current.onclose = (event) => {
      setIsConnected(false);
      console.log('Chat websocket closed', event.code);
      
      const authCodes = [4001, 4002, 4003, 4403];
      if (authCodes.includes(event.code)) {
        return;
      }

      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30_000);
        connect();
      }, reconnectDelay.current);
    };

    ws.current.onerror = (e) => {
      console.log('WS Error', e);
      ws.current?.close();
    };
  }, [conversationId]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
      if (reconnectTimerRef.current) {
         clearTimeout(reconnectTimerRef.current);
         reconnectTimerRef.current = null;
      }
    };
  }, [connect]);

  const markRead = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'mark_read' }));
    }
  }, []);

  return { isConnected, markRead };
}
