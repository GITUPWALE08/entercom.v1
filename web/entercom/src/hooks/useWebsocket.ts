import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '../shared/components/ui/toastStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const WS_BASE_URL = BASE_URL.replace('/api/v1', '').replace(/^http/, 'ws');

// SINGLETON STATE
let globalWs: WebSocket | null = null;
let subscribers = 0;
let reconnectAttempt = 0;
let reconnectTimeout: number | null = null;
let pingInterval: number | null = null;
let isIntentionalClose = false;

// Let the singleton invalidate queries and show toasts
let globalQueryClient: any = null;
let globalAddToast: any = null;

function handleEvent(data: any) {
    if (!globalQueryClient) return;
    const eventType = data.event || '';
    
    // Invalidate queries
    if (eventType.startsWith('request.')) {
        globalQueryClient.invalidateQueries({ queryKey: ['requests'] });
        if (data.request_id) {
            globalQueryClient.invalidateQueries({ queryKey: ['requests', String(data.request_id)] });
        }
    } else if (eventType.startsWith('quote.')) {
        globalQueryClient.invalidateQueries({ queryKey: ['quotes'] });
    } else if (eventType.startsWith('order.')) {
        globalQueryClient.invalidateQueries({ queryKey: ['orders'] });
    } else if (eventType.startsWith('booking.')) {
        globalQueryClient.invalidateQueries({ queryKey: ['bookings'] });
    } else if (eventType.startsWith('notification.')) {
        globalQueryClient.invalidateQueries({ queryKey: ['notifications'] });
        globalQueryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
        // Realtime Toast Alert
        if (data.payload && data.payload.title) {
            globalAddToast?.(data.payload.message || data.payload.title, 'info', 5000);
        }
    } else if (eventType.startsWith('verification.')) {
        globalQueryClient.invalidateQueries({ queryKey: ['verifications'] });
    } else if (eventType.startsWith('inventory.')) {
        globalQueryClient.invalidateQueries({ queryKey: ['products'] });
    }
}

const ENABLE_WEBSOCKETS = import.meta.env.VITE_ENABLE_WEBSOCKETS !== 'false';

function connectWs(channel: string = 'requests') {
    if (!ENABLE_WEBSOCKETS) {
        console.log('[WebSocket] Disabled via environment variable');
        return;
    }

    if (globalWs && (globalWs.readyState === WebSocket.CONNECTING || globalWs.readyState === WebSocket.OPEN)) {
        return; // Already connected
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Remove token from URL query, use protocol header
    const wsUrl = `${WS_BASE_URL}/ws/${channel}/`;
    isIntentionalClose = false;
    
    try {
        globalWs = new WebSocket(wsUrl, ["access_token", token]);
    } catch (e) {
        console.error("WS error", e);
        return;
    }

    globalWs.onopen = () => {
        console.log(`[WebSocket] Connected`);
        reconnectAttempt = 0;
        
        // Start Heartbeat
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = window.setInterval(() => {
            if (globalWs?.readyState === WebSocket.OPEN) {
                globalWs.send(JSON.stringify({ action: "ping" }));
            }
        }, 30000); // 30 seconds
    };

    globalWs.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.event === 'websocket.auth_failed' || data.event === 'websocket.token_expired') {
                console.warn('[WebSocket] Auth failed, closing connection');
                isIntentionalClose = true;
                globalWs?.close();
                return;
            }
            handleEvent(data);
        } catch (err) {
            console.error('[WebSocket] Failed to parse message', err);
        }
    };

    globalWs.onclose = (event) => {
        console.log(`[WebSocket] Disconnected`, event.code);
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }
        globalWs = null;

        if (isIntentionalClose || (event.code >= 4001 && event.code <= 4004)) {
            return;
        }
        
        // Exponential backoff reconnect
        if (subscribers > 0) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
            reconnectAttempt++;
            reconnectTimeout = window.setTimeout(connectWs, delay);
        }
    };

    globalWs.onerror = (error) => {
        console.error(`[WebSocket] Error`, error);
    };
}

function disconnectWs() {
    isIntentionalClose = true;
    if (globalWs) {
        globalWs.close();
        globalWs = null;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

export function useWebsocket(channel: 'system' | 'requests' = 'requests') {
    const queryClient = useQueryClient();
    const addToast = useToastStore(state => state.addToast);
    
    useEffect(() => {
        globalQueryClient = queryClient;
        globalAddToast = addToast;
        subscribers++;
        
        if (subscribers === 1) {
            connectWs(channel);
        }
        
        return () => {
            subscribers--;
            if (subscribers === 0) {
                disconnectWs();
            }
        };
    }, [queryClient, addToast]);
    
    const subscribeToRequest = useCallback((requestId: string | number) => {
        if (globalWs && globalWs.readyState === WebSocket.OPEN) {
            globalWs.send(JSON.stringify({
                action: 'subscribe',
                request_id: requestId
            }));
        } else if (globalWs && globalWs.readyState === WebSocket.CONNECTING) {
            const checkOpen = setInterval(() => {
                if (globalWs?.readyState === WebSocket.OPEN) {
                    globalWs.send(JSON.stringify({
                        action: 'subscribe',
                        request_id: requestId
                    }));
                    clearInterval(checkOpen);
                }
            }, 100);
            setTimeout(() => clearInterval(checkOpen), 10000);
        }
    }, []);

    return { subscribeToRequest };
}
