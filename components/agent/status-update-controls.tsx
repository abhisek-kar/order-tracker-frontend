"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

interface StatusUpdateControlsProps {
  currentStatus: string;
  orderId: string;
  onStatusUpdate: (newStatus: string) => void;
  disabled?: boolean;
}

const STATUS_FLOW = [
  "Scheduled",
  "Reached Store",
  "Picked Up",
  "Out for Delivery",
  "Delivered",
];

// Agent can only update these specific transitions
const AGENT_ALLOWED_TRANSITIONS = {
  "Picked Up": "Out for Delivery",
  "Out for Delivery": "Delivered",
};

export function StatusUpdateControls({
  currentStatus,
  orderId,
  onStatusUpdate,
  disabled = false,
}: StatusUpdateControlsProps) {
  const [updating, setUpdating] = useState(false);

  const nextStatus =
    AGENT_ALLOWED_TRANSITIONS[
      currentStatus as keyof typeof AGENT_ALLOWED_TRANSITIONS
    ];
  const isCompleted = currentStatus === "Delivered";
  const canUpdate = !!nextStatus;

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      onStatusUpdate(newStatus);
      toast.success(`Status updated to: ${newStatus}`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to update status";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-700">Status</h4>

      <div className="text-xs bg-gray-50 p-2">
        <span className="font-medium">{currentStatus}</span>
      </div>

      {canUpdate && !isCompleted && (
        <Button
          onClick={() => updateStatus(nextStatus)}
          disabled={updating || disabled}
          size="sm"
          className="w-full text-xs"
        >
          {updating ? "..." : `→ ${nextStatus}`}
        </Button>
      )}

      {!canUpdate && !isCompleted && (
        <div className="text-xs text-gray-500 text-center py-1">
          Status can only be updated by system
        </div>
      )}

      {isCompleted && (
        <div className="text-center text-green-600 text-xs font-medium">
          Completed
        </div>
      )}
    </div>
  );
}
