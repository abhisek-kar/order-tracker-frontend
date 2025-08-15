"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAgentLocation } from "@/hooks/use-agent-location";
import { toast } from "sonner";

interface AgentLocationTrackerProps {
  orderId: string;
  orderStatus: string;
  customerLocation?: {
    latitude: number;
    longitude: number;
  };
  onLocationUpdate?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
}

export function AgentLocationTracker({
  orderId,
  orderStatus,
  customerLocation,
  onLocationUpdate,
}: AgentLocationTrackerProps) {
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [simulatedLocation, setSimulatedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const shouldTrack =
    orderStatus !== "Delivered" &&
    (orderStatus === "Picked Up" || orderStatus === "Out for Delivery");

  const {
    currentLocation,
    isTracking,
    isSupported,
    permission,
    error,
    startTracking,
    stopTracking,
    updateLocation,
    sendLocationUpdate,
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

  const simulateMovement = useCallback(async () => {
    if (!customerLocation) {
      toast.error("Customer location not available");
      return;
    }

    // Use simulated location if available, otherwise use current location
    const baseLocation = simulatedLocation || currentLocation;

    if (!baseLocation) {
      toast.error(
        "Current location not available. Please start tracking first."
      );
      return;
    }

    try {
      // Simulate movement 10% closer to customer
      const currentLat = baseLocation.latitude;
      const currentLon = baseLocation.longitude;
      const targetLat = customerLocation.latitude;
      const targetLon = customerLocation.longitude;

      const newLat = currentLat + (targetLat - currentLat) * 0.1;
      const newLon = currentLon + (targetLon - currentLon) * 0.1;

      // Update simulated location state immediately
      const newLocation = { latitude: newLat, longitude: newLon };
      setSimulatedLocation(newLocation);

      // Send the simulated location to backend
      await sendLocationUpdate({
        latitude: newLat,
        longitude: newLon,
        accuracy: 10,
        timestamp: Date.now(),
      });

      // Update local callback
      onLocationUpdate?.(newLocation);

      toast.success("Simulated movement towards customer");
    } catch (error) {
      toast.error("Failed to simulate movement");
    }
  }, [
    simulatedLocation,
    currentLocation,
    customerLocation,
    sendLocationUpdate,
    onLocationUpdate,
  ]);

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

      {(currentLocation || simulatedLocation) && (
        <div className="text-xs bg-gray-50 p-2">
          <div>
            Lat: {(simulatedLocation || currentLocation)?.latitude.toFixed(6)}
          </div>
          <div>
            Lng: {(simulatedLocation || currentLocation)?.longitude.toFixed(6)}
          </div>
          {simulatedLocation && (
            <div className="text-purple-600 font-medium">📍 Simulated</div>
          )}
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

            <Button
              variant="outline"
              size="sm"
              onClick={simulateMovement}
              className="flex-1 text-xs h-7"
              disabled={
                !customerLocation && !(currentLocation || simulatedLocation)
              }
            >
              🚚 Simulate
            </Button>
          </>
        ) : (
          <div className="text-xs text-gray-600 text-center py-1 w-full">
            {orderStatus === "Delivered"
              ? "Tracking disabled - Order delivered"
              : "Available when 'Picked Up' or 'Out for Delivery'"}
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
