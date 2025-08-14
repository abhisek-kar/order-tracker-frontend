"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

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

// Order update from backend (matches your IOrder interface)
export type OrderUpdate = {
  _id: string;
  taskId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  deliveryItem: string;
  preferredTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  agentInfo?: {
    name: string;
    phone: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  eta?: string;
};

type UseWebSocketProps = {
  orderId?: string;
  onAgentLocationUpdate?: (data: AgentLocationUpdate) => void;
  onOrderStatusUpdate?: (data: OrderStatusUpdate) => void;
  onOrderUpdate?: (data: OrderUpdate) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
};

export function useWebSocket({
  orderId,
  onAgentLocationUpdate,
  onOrderStatusUpdate,
  onOrderUpdate,
  onConnect,
  onDisconnect,
  onError,
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [lastMessage, setLastMessage] = useState<any>(null);

  const socket = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (socket.current?.connected) {
      return;
    }

    try {
      setConnectionStatus("connecting");

      // Use environment variable or fallback to localhost
      const serverUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      socket.current = io(serverUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      socket.current.on("connect", () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
        onConnect?.();

        // Join order room if orderId is provided
        if (orderId) {
          socket.current?.emit("joinOrderRoom", orderId);
        }
      });

      socket.current.on("orderUpdate", (orderData: OrderUpdate) => {
        setLastMessage(orderData);

        // Handle order updates (this includes location and status updates)
        onOrderUpdate?.(orderData);

        // Extract location update if available
        if (orderData.location) {
          const locationUpdate: AgentLocationUpdate = {
            agentId: orderData.agentInfo?.name || "unknown",
            latitude: orderData.location.latitude,
            longitude: orderData.location.longitude,
            status: orderData.status,
            timestamp: orderData.updatedAt,
            orderId: orderData.taskId,
          };
          onAgentLocationUpdate?.(locationUpdate);
        }

        // Extract status update
        const statusUpdate: OrderStatusUpdate = {
          orderId: orderData.taskId,
          status: orderData.status,
          timestamp: orderData.updatedAt,
          agentId: orderData.agentInfo?.name,
        };
        onOrderStatusUpdate?.(statusUpdate);
      });

      socket.current.on("disconnect", (reason) => {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();
        console.log("Socket disconnected:", reason);
      });

      socket.current.on("connect_error", (error) => {
        setConnectionStatus("error");
        onError?.(error);
        console.error("Socket connection error:", error);
      });
    } catch (error) {
      setConnectionStatus("error");
      console.error("Socket.IO connection error:", error);
    }
  }, [
    orderId,
    onAgentLocationUpdate,
    onOrderStatusUpdate,
    onOrderUpdate,
    onConnect,
    onDisconnect,
    onError,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, []);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socket.current?.connected) {
      socket.current.emit(event, data);
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
