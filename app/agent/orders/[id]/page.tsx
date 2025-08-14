"use client";

import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PageLoader from "@/components/page-loader";
import { MapViewer } from "@/components/map/map-viewer";
import { StatusUpdateControls } from "@/components/agent/status-update-controls";
import { AgentLocationTracker } from "@/components/agent/agent-location-tracker";

type OrderData = {
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
};

export default function OrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentLocation, setAgentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      const data = response.data.data;
      setOrderData(data);

      if (data.location?.latitude && data.location?.longitude) {
        setAgentLocation({
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        });
      }
    } catch (error) {
      toast.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (orderData) {
      setOrderData({ ...orderData, status: newStatus });
    }
  };

  const handleLocationUpdate = (location: {
    latitude: number;
    longitude: number;
  }) => {
    setAgentLocation(location);
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  if (loading) {
    return <PageLoader />;
  }

  if (!orderData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Order not found</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        ← Back
      </Button>

      <h1 className="text-xl font-bold">Agent - Order {orderData.taskId}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="p-3 border space-y-3">
          <h3 className="text-sm font-medium">Agent Controls</h3>

          <StatusUpdateControls
            currentStatus={orderData.status}
            orderId={orderData.taskId}
            onStatusUpdate={handleStatusUpdate}
          />

          <AgentLocationTracker
            orderId={orderData.taskId}
            orderStatus={orderData.status}
            onLocationUpdate={handleLocationUpdate}
          />
        </div>

        {/* Order Details */}
        <div className="p-4 border rounded space-y-3">
          <h3 className="font-medium">Order Details</h3>

          <div className="space-y-2 text-sm">
            <div>
              <strong>Customer:</strong> {orderData.customerInfo.name}
            </div>
            <div>
              <strong>Phone:</strong> {orderData.customerInfo.phone}
            </div>
            <div>
              <strong>Address:</strong> {orderData.customerInfo.address}
            </div>
            <div>
              <strong>Item:</strong> {orderData.deliveryItem}
            </div>
            <div>
              <strong>Preferred Time:</strong>{" "}
              {new Date(orderData.preferredTime).toLocaleString()}
            </div>
            <div>
              <strong>Status:</strong> {orderData.status}
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="border rounded p-4">
        <h3 className="font-medium mb-3">Delivery Route</h3>
        <MapViewer
          customerLat={orderData.customerInfo.latitude}
          customerLon={orderData.customerInfo.longitude}
          customerAddress={orderData.customerInfo.address}
          agentLat={agentLocation?.latitude}
          agentLon={agentLocation?.longitude}
          orderStatus={orderData.status}
          orderId={orderData._id}
          showRoute={true}
          showPath={false}
          enableRealTimeTracking={true}
          height="400px"
        />
      </div>
    </div>
  );
}
