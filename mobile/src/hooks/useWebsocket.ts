import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

interface UseWebsocketProps {
  channel?: string;
  onEventReceived?: (event: any) => void;
}

export function useWebsocket({ channel = 'requests', onEventReceived }: UseWebsocketProps) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectDelay = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onEventReceivedRef = useRef(onEventReceived);
  
  useEffect(() => {
    onEventReceivedRef.current = onEventReceived;
  }, [onEventReceived]);

  const connect = useCallback(async () => {
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
      const isHttps = apiUrl.startsWith('https:');
      const host = apiUrl.split('://')[1].split('/')[0];
      wsBase = `${isHttps ? 'wss:' : 'ws:'}//${host}`;
    } catch (e) {
      wsBase = 'wss://entercom-v1.onrender.com';
    }
    
    const wsUrl = `${wsBase}/ws/${channel}/`;
    
    ws.current = new WebSocket(wsUrl, ['access_token', token]);

    ws.current.onopen = () => {
      console.log(`[Global WS] Connected to ${channel}`);
      setIsConnected(true);
      reconnectDelay.current = 1000;
      
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ action: "ping" }));
        }
      }, 30000);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onEventReceivedRef.current) {
          onEventReceivedRef.current(data);
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.current.onclose = (event) => {
      setIsConnected(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      
      console.log('[Global WS] closed', event.code);
      
      const authCodes = [4001, 4002, 4003, 4403];
      if (authCodes.includes(event.code)) return;

      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30_000);
        connect();
      }, reconnectDelay.current);
    };

    ws.current.onerror = (e) => {
      console.log('[Global WS] Error', e);
      ws.current?.close();
    };
  }, [channel]);

  useEffect(() => {
    connect();
    
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
          connect();
        }
      } else if (nextAppState === 'background') {
        if (ws.current) {
          ws.current.close();
        }
      }
    });

    return () => {
      subscription.remove();
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [connect]);

  return { isConnected };
}
