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

export function StatusUpdateControls({
  currentStatus,
  orderId,
  onStatusUpdate,
  disabled = false,
}: StatusUpdateControlsProps) {
  const [updating, setUpdating] = useState(false);

  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextStatus =
    currentIndex < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIndex + 1]
      : null;
  const isCompleted = currentStatus === "Delivered";

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
    <div className="p-4 border rounded space-y-3">
      <h3 className="font-medium">Order Status</h3>

      <div className="text-sm bg-gray-50 p-2 rounded">
        Current: <span className="font-medium">{currentStatus}</span>
      </div>

      {!isCompleted && nextStatus && (
        <Button
          onClick={() => updateStatus(nextStatus)}
          disabled={updating || disabled}
          className="w-full"
        >
          {updating ? "Updating..." : `Mark as ${nextStatus}`}
        </Button>
      )}

      {isCompleted && (
        <div className="text-center text-green-600 font-medium">
          Order Completed
        </div>
      )}
    </div>
  );
}
