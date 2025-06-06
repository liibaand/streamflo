import { useRef, useEffect, useCallback } from 'react';
import type { WebSocketMessage } from '@/types';

class WebSocketManager {
  private ws: WebSocket | null = null;
  private listeners: Set<(message: WebSocketMessage) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.listeners.forEach(listener => listener(message));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => this.connect(), delay);
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  addListener(listener: (message: WebSocketMessage) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
  }
}

const wsManager = new WebSocketManager();

export function useWebSocket() {
  const listenerRef = useRef<((message: WebSocketMessage) => void) | null>(null);

  useEffect(() => {
    wsManager.connect();
    return () => {
      if (listenerRef.current) {
        wsManager.addListener(listenerRef.current)();
      }
    };
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    wsManager.send(message);
  }, []);

  const addListener = useCallback((listener: (message: WebSocketMessage) => void) => {
    listenerRef.current = listener;
    return wsManager.addListener(listener);
  }, []);

  return { sendMessage, addListener };
}
