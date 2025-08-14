"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAgentLocation } from "@/hooks/use-agent-location";

interface AgentLocationTrackerProps {
  orderId: string;
  orderStatus: string;
  onLocationUpdate?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
}

export function AgentLocationTracker({
  orderId,
  orderStatus,
  onLocationUpdate,
}: AgentLocationTrackerProps) {
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  const shouldTrack =
    orderStatus === "Picked Up" || orderStatus === "Out for Delivery";

  const {
    currentLocation,
    isTracking,
    isSupported,
    permission,
    error,
    startTracking,
    stopTracking,
    updateLocation,
  } = useAgentLocation({
    orderId,
    enabled: trackingEnabled && shouldTrack,
    interval: 10000,
    onLocationUpdate: useCallback(
      (location: {
        latitude: number;
        longitude: number;
        accuracy: number;
        timestamp: number;
      }) => {
        onLocationUpdate?.({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      },
      [onLocationUpdate]
    ),
  });

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
      setTrackingEnabled(false);
    } else {
      setTrackingEnabled(true);
    }
  };

  if (!isSupported) {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-700">Location Tracking</h4>
        <p className="text-xs text-red-600">Geolocation not supported</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-700">Location Tracking</h4>

      {currentLocation && (
        <div className="text-xs bg-gray-50 p-2">
          <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
          <div>Lng: {currentLocation.longitude.toFixed(6)}</div>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 p-2 bg-red-50">{error}</div>
      )}

      <div className="flex gap-1">
        {shouldTrack ? (
          <>
            <Button
              onClick={handleToggleTracking}
              size="sm"
              className={`flex-1 text-xs h-7 ${
                isTracking
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
              disabled={permission === "denied"}
            >
              {isTracking ? "Stop" : "Start"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={updateLocation}
              className="flex-1 text-xs h-7"
              disabled={!isSupported || permission === "denied"}
            >
              Update
            </Button>
          </>
        ) : (
          <div className="text-xs text-gray-600 text-center py-1 w-full">
            Available when "Picked Up" or "Out for Delivery"
          </div>
        )}
      </div>

      {permission === "denied" && (
        <div className="text-xs text-orange-600 p-2 bg-orange-50">
          Location access denied
        </div>
      )}
    </div>
  );
}
