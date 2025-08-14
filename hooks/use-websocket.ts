"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketMessage = {
  type: string;
  data: any;
  orderId?: string;
  timestamp?: string;
};

export type AgentLocationUpdate = {
  agentId: string;
  latitude: number;
  longitude: number;
  status: string;
  timestamp: string;
  orderId: string;
};

export type OrderStatusUpdate = {
  orderId: string;
  status: string;
  timestamp: string;
  agentId?: string;
};

type UseWebSocketProps = {
  orderId?: string;
  onAgentLocationUpdate?: (data: AgentLocationUpdate) => void;
  onOrderStatusUpdate?: (data: OrderStatusUpdate) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
};

export function useWebSocket({
  orderId,
  onAgentLocationUpdate,
  onOrderStatusUpdate,
  onConnect,
  onDisconnect,
  onError,
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus("connecting");

      // Use environment variable or fallback to localhost
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
        onConnect?.();

        // Subscribe to order updates if orderId is provided
        if (orderId) {
          ws.current?.send(
            JSON.stringify({
              type: "subscribe",
              orderId: orderId,
            })
          );
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Handle different message types
          switch (message.type) {
            case "agent_location_update":
              onAgentLocationUpdate?.(message.data as AgentLocationUpdate);
              break;
            case "order_status_update":
              onOrderStatusUpdate?.(message.data as OrderStatusUpdate);
              break;
            default:
              console.log("Unknown message type:", message.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        setConnectionStatus("error");
        onError?.(error);
      };
    } catch (error) {
      setConnectionStatus("error");
      console.error("WebSocket connection error:", error);
    }
  }, [
    orderId,
    onAgentLocationUpdate,
    onOrderStatusUpdate,
    onConnect,
    onDisconnect,
    onError,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (orderId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [orderId, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
  };
}
