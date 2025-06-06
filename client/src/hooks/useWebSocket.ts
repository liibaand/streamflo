import { useEffect, useRef, useState } from "react";

export function useWebSocket(onMessage?: (message: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          wsRef.current = ws;
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            onMessage?.(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };
        
        ws.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);
          wsRef.current = null;
          
          // Reconnect after 3 seconds
          setTimeout(connect, 3000);
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error);
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onMessage]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage, isConnected };
}
