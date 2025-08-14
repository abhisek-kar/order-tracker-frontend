"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";

interface LocationSimulatorProps {
  orderId: string;
  storeLat: number;
  storeLon: number;
  customerLat: number;
  customerLon: number;
  onLocationUpdate: (location: { latitude: number; longitude: number }) => void;
  disabled?: boolean;
}

interface SimulatedPosition {
  latitude: number;
  longitude: number;
  progress: number; // 0-1, where 0 is store and 1 is customer
}

export function LocationSimulator({
  orderId,
  storeLat,
  storeLon,
  customerLat,
  customerLon,
  onLocationUpdate,
  disabled = false,
}: LocationSimulatorProps) {
  const [currentPosition, setCurrentPosition] = useState<SimulatedPosition>({
    latitude: storeLat,
    longitude: storeLon,
    progress: 0,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Send location update to backend
  const sendLocationToBackend = useCallback(
    async (location: { latitude: number; longitude: number }) => {
      try {
        setIsSending(true);
        await api.patch(`/orders/${orderId}`, {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        });
        console.log("✅ Simulated location sent to backend:", location);
      } catch (error: any) {
        console.error("❌ Failed to send simulated location:", error);
        toast.error("Failed to send location update");
      } finally {
        setIsSending(false);
      }
    },
    [orderId]
  );

  // Calculate position along route based on progress (0-1)
  const calculatePositionOnRoute = useCallback(
    (progress: number) => {
      // Simple linear interpolation between store and customer
      const lat = storeLat + (customerLat - storeLat) * progress;
      const lon = storeLon + (customerLon - storeLon) * progress;

      // Add some random offset to simulate realistic movement
      const randomOffset = 0.0001; // ~10 meters
      const offsetLat = lat + (Math.random() - 0.5) * randomOffset;
      const offsetLon = lon + (Math.random() - 0.5) * randomOffset;

      return {
        latitude: offsetLat,
        longitude: offsetLon,
        progress,
      };
    },
    [storeLat, storeLon, customerLat, customerLon]
  );

  // Move forward by a small step
  const moveForward = useCallback(
    async (stepSize: number = 0.05) => {
      const newProgress = Math.min(currentPosition.progress + stepSize, 1);
      const newPosition = calculatePositionOnRoute(newProgress);

      setCurrentPosition(newPosition);
      onLocationUpdate({
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
      });

      // Send to backend
      await sendLocationToBackend({
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
      });

      const progressPercent = Math.round(newProgress * 100);
      toast.success(`Moved to ${progressPercent}% of route`);

      if (newProgress >= 1) {
        toast.success("🎉 Reached customer location!");
      }
    },
    [
      currentPosition.progress,
      calculatePositionOnRoute,
      onLocationUpdate,
      sendLocationToBackend,
    ]
  );

  // Move backward by a small step
  const moveBackward = useCallback(
    async (stepSize: number = 0.05) => {
      const newProgress = Math.max(currentPosition.progress - stepSize, 0);
      const newPosition = calculatePositionOnRoute(newProgress);

      setCurrentPosition(newPosition);
      onLocationUpdate({
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
      });

      // Send to backend
      await sendLocationToBackend({
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
      });

      const progressPercent = Math.round(newProgress * 100);
      toast.success(`Moved back to ${progressPercent}% of route`);

      if (newProgress <= 0) {
        toast.success("🏪 Back at store location!");
      }
    },
    [
      currentPosition.progress,
      calculatePositionOnRoute,
      onLocationUpdate,
      sendLocationToBackend,
    ]
  );

  // Jump to specific progress
  const jumpToProgress = useCallback(
    async (progress: number) => {
      const newPosition = calculatePositionOnRoute(progress);
      setCurrentPosition(newPosition);
      onLocationUpdate({
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
      });

      // Send to backend
      await sendLocationToBackend({
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
      });

      const progressPercent = Math.round(progress * 100);
      toast.success(`Jumped to ${progressPercent}% of route`);
    },
    [calculatePositionOnRoute, onLocationUpdate, sendLocationToBackend]
  );

  // Start auto-simulation
  const startAutoSimulation = useCallback(() => {
    setIsSimulating(true);
    toast.success("🤖 Auto-simulation started");

    const interval = setInterval(() => {
      setCurrentPosition((prev) => {
        const newProgress = prev.progress + 0.02; // 2% per step

        if (newProgress >= 1) {
          clearInterval(interval);
          setIsSimulating(false);
          toast.success("🎉 Auto-simulation completed!");
          return prev;
        }

        const newPosition = calculatePositionOnRoute(newProgress);
        onLocationUpdate({
          latitude: newPosition.latitude,
          longitude: newPosition.longitude,
        });

        // Send to backend
        sendLocationToBackend({
          latitude: newPosition.latitude,
          longitude: newPosition.longitude,
        });

        return newPosition;
      });
    }, 2000); // Update every 2 seconds

    // Auto-stop after reaching destination
    setTimeout(() => {
      clearInterval(interval);
      setIsSimulating(false);
    }, 100000); // 100 seconds max
  }, [calculatePositionOnRoute, onLocationUpdate]);

  // Stop auto-simulation
  const stopAutoSimulation = useCallback(() => {
    setIsSimulating(false);
    toast.success("Auto-simulation stopped");
  }, []);

  // Reset to store
  const resetToStore = useCallback(() => {
    jumpToProgress(0);
    setIsSimulating(false);
  }, [jumpToProgress]);

  const progressPercent = Math.round(currentPosition.progress * 100);
  const distanceFromStore = calculateDistance(
    storeLat,
    storeLon,
    currentPosition.latitude,
    currentPosition.longitude
  );
  const distanceToCustomer = calculateDistance(
    currentPosition.latitude,
    currentPosition.longitude,
    customerLat,
    customerLon
  );

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🧪</span>
          <span>Location Simulator (Testing)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Position Info */}
        <div className="p-3 bg-purple-50 rounded-lg">
          <h4 className="text-sm font-medium text-purple-900 mb-2">
            🎯 Simulated Position
            {isSending && <span className="ml-2 text-xs">📤 Sending...</span>}
          </h4>
          <div className="text-sm text-purple-800 space-y-1">
            <div>
              Progress:{" "}
              <Badge className="bg-purple-100 text-purple-800">
                {progressPercent}%
              </Badge>
            </div>
            <div>Latitude: {currentPosition.latitude.toFixed(6)}</div>
            <div>Longitude: {currentPosition.longitude.toFixed(6)}</div>
            <div>Distance from store: {distanceFromStore.toFixed(2)} km</div>
            <div>Distance to customer: {distanceToCustomer.toFixed(2)} km</div>
          </div>
        </div>

        {/* Manual Movement Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Manual Movement</h4>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => moveBackward(0.1)}
              disabled={disabled || isSending || currentPosition.progress <= 0}
              size="sm"
            >
              ⬅️ Back 10%
            </Button>

            <Button
              variant="outline"
              onClick={() => moveForward(0.1)}
              disabled={disabled || isSending || currentPosition.progress >= 1}
              size="sm"
            >
              ➡️ Forward 10%
            </Button>

            <Button
              variant="outline"
              onClick={() => moveBackward(0.05)}
              disabled={disabled || isSending || currentPosition.progress <= 0}
              size="sm"
            >
              ⬅️ Back 5%
            </Button>

            <Button
              variant="outline"
              onClick={() => moveForward(0.05)}
              disabled={disabled || isSending || currentPosition.progress >= 1}
              size="sm"
            >
              ➡️ Forward 5%
            </Button>
          </div>
        </div>

        {/* Quick Jump Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Quick Jumps</h4>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => jumpToProgress(0.25)}
              disabled={disabled || isSending}
              size="sm"
            >
              25%
            </Button>

            <Button
              variant="outline"
              onClick={() => jumpToProgress(0.5)}
              disabled={disabled || isSending}
              size="sm"
            >
              50%
            </Button>

            <Button
              variant="outline"
              onClick={() => jumpToProgress(0.75)}
              disabled={disabled || isSending}
              size="sm"
            >
              75%
            </Button>
          </div>
        </div>

        {/* Auto-Simulation */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Auto-Simulation</h4>

          {!isSimulating ? (
            <Button
              onClick={startAutoSimulation}
              disabled={disabled || currentPosition.progress >= 1}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              🤖 Start Auto Movement
            </Button>
          ) : (
            <Button
              onClick={stopAutoSimulation}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              🛑 Stop Auto Movement
            </Button>
          )}
        </div>

        {/* Reset Control */}
        <div className="pt-3 border-t">
          <Button
            variant="outline"
            onClick={resetToStore}
            disabled={disabled}
            className="w-full"
          >
            🏪 Reset to Store
          </Button>
        </div>

        {/* Simulator Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            ℹ️ Simulator Info
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Use this to test real-time tracking without moving</li>
            <li>• Simulated position updates are sent to customers</li>
            <li>• Auto-simulation moves 2% every 2 seconds</li>
            <li>• Manual controls give instant feedback</li>
            <li>• Reset returns to store starting position</li>
          </ul>
        </div>

        {/* Warning */}
        <div className="p-2 bg-orange-50 rounded border border-orange-200">
          <p className="text-xs text-orange-700">
            ⚠️ <strong>Testing Only:</strong> This simulates movement for
            development. Real location tracking should be used in production.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
