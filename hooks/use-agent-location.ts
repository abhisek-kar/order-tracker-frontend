"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseAgentLocationOptions {
  orderId?: string;
  enabled?: boolean;
  interval?: number; // in milliseconds
  onLocationUpdate?: (location: LocationData) => void;
  onError?: (error: string) => void;
}

interface LocationState {
  currentLocation: LocationData | null;
  isTracking: boolean;
  isSupported: boolean;
  permission: PermissionState | null;
  error: string | null;
  lastUpdateTime: number | null;
}

export function useAgentLocation({
  orderId,
  enabled = false,
  interval = 10000, // 10 seconds default
  onLocationUpdate,
  onError,
}: UseAgentLocationOptions = {}) {
  const [state, setState] = useState<LocationState>({
    currentLocation: null,
    isTracking: false,
    isSupported: typeof navigator !== "undefined" && "geolocation" in navigator,
    permission: null,
    error: null,
    lastUpdateTime: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const isTrackingRef = useRef<boolean>(false);

  // Check geolocation permission
  const checkPermission = useCallback(async () => {
    if (!state.isSupported) return;

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      setState((prev) => ({ ...prev, permission: permission.state }));

      permission.onchange = () => {
        setState((prev) => ({ ...prev, permission: permission.state }));
      };
    } catch (error) {
      console.warn("Permission API not supported");
    }
  }, [state.isSupported]);

  // Send location to backend
  const sendLocationUpdate = useCallback(
    async (location: LocationData) => {
      if (!orderId) return;

      try {
        console.log("Sending location update:", {
          orderId,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        });

        const response = await api.patch(`/orders/${orderId}/location`, {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        });

        console.log("Location update successful:", response.data);

        setState((prev) => ({
          ...prev,
          lastUpdateTime: Date.now(),
          error: null,
        }));
        onLocationUpdate?.(location);
      } catch (error: any) {
        console.error("Failed to send location update:", error);
        console.error("Error details:", {
          status: error?.response?.status,
          data: error?.response?.data,
          orderId,
          payload: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        });

        const errorMessage =
          error?.response?.data?.message ||
          `Failed to update location (${
            error?.response?.status || "Network Error"
          })`;
        setState((prev) => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);
      }
    },
    [orderId, onLocationUpdate, onError]
  );

  // Get current position
  const getCurrentPosition = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!state.isSupported) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          resolve(locationData);
        },
        (error) => {
          let errorMessage = "Location access denied";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: false, // Use less accurate but faster location
          timeout: 10000, // Reduced timeout to 10 seconds
          maximumAge: 120000, // Allow 2 minute old location data
        }
      );
    });
  }, [state.isSupported]);

  // Start location tracking
  const startTracking = useCallback(async () => {
    if (!state.isSupported || !orderId) {
      const error = !state.isSupported
        ? "Geolocation not supported"
        : "Order ID required";
      setState((prev) => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    try {
      setState((prev) => ({ ...prev, isTracking: true, error: null }));
      isTrackingRef.current = true;

      // Get initial position with retry logic
      let initialLocation;
      try {
        initialLocation = await getCurrentPosition();
      } catch (error: any) {
        // If initial location fails, try once more with lower accuracy
        console.warn(
          "Initial location failed, retrying with lower accuracy:",
          error.message
        );
        try {
          // Temporary override for fallback
          const fallbackLocation = await new Promise<LocationData>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                  });
                },
                reject,
                {
                  enableHighAccuracy: false,
                  timeout: 5000,
                  maximumAge: 300000, // Allow 5 minute old location
                }
              );
            }
          );
          initialLocation = fallbackLocation;
        } catch (fallbackError: any) {
          throw new Error(`Unable to get location: ${error.message}`);
        }
      }

      setState((prev) => ({ ...prev, currentLocation: initialLocation }));
      lastLocationRef.current = initialLocation;

      // Send initial location
      await sendLocationUpdate(initialLocation);

      // Set up periodic updates
      intervalIdRef.current = setInterval(async () => {
        try {
          const location = await getCurrentPosition();

          // Only update if location has changed significantly (> 10 meters)
          const lastLocation = lastLocationRef.current;
          if (lastLocation) {
            const distance = calculateDistance(
              lastLocation.latitude,
              lastLocation.longitude,
              location.latitude,
              location.longitude
            );

            // Skip update if distance is less than 10 meters
            if (distance < 0.01) {
              // ~10 meters
              return;
            }
          }

          setState((prev) => ({
            ...prev,
            currentLocation: location,
            error: null,
          }));
          lastLocationRef.current = location;
          await sendLocationUpdate(location);
        } catch (error: any) {
          // Don't show timeout errors in UI - they're common and temporary
          if (error.message.includes("timeout")) {
            console.warn(
              "Location request timed out, will retry on next interval"
            );
          } else {
            console.error("Periodic location update failed:", error);
            setState((prev) => ({
              ...prev,
              error: `Location error: ${error.message}`,
            }));
          }
        }
      }, interval);

      toast.success("Location tracking started");
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isTracking: false,
        error: error.message,
      }));
      isTrackingRef.current = false;
      onError?.(error.message);
      toast.error(`Failed to start tracking: ${error.message}`);
    }
  }, [
    state.isSupported,
    orderId,
    getCurrentPosition,
    sendLocationUpdate,
    interval,
    onError,
  ]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    setState((prev) => {
      const wasTracking = prev.isTracking;
      const newState = {
        ...prev,
        isTracking: false,
        error: null,
      };

      isTrackingRef.current = false;

      // Show toast only if tracking was actually active
      if (wasTracking) {
        setTimeout(() => toast.success("Location tracking stopped"), 0);
      }

      return newState;
    });
  }, []); // Remove state.isTracking dependency

  // Manually update location
  const updateLocation = useCallback(async () => {
    if (!orderId) return;

    try {
      const location = await getCurrentPosition();
      setState((prev) => ({ ...prev, currentLocation: location }));
      await sendLocationUpdate(location);
      toast.success("Location updated");
    } catch (error: any) {
      const errorMessage = error.message;
      setState((prev) => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      toast.error(`Failed to update location: ${errorMessage}`);
    }
  }, [orderId, getCurrentPosition, sendLocationUpdate, onError]);

  // Calculate distance between two points in kilometers
  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Auto-start tracking when enabled
  useEffect(() => {
    if (enabled && orderId && !isTrackingRef.current) {
      startTracking();
    } else if (!enabled && isTrackingRef.current) {
      stopTracking();
    }
  }, [enabled, orderId, startTracking, stopTracking]);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
    updateLocation,
    sendLocationUpdate: (location: LocationData) =>
      sendLocationUpdate(location),
  };
}
