"use client";

import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PageLoader from "@/components/page-loader";
import { MapPicker } from "@/components/map/map-picker";
import { MapViewer } from "@/components/map/map-viewer";

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
  location?: {
    latitude: number;
    longitude: number;
  };
};

export default function OrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      const data = response.data.data;
      setOrderData(data);
    } catch (error) {
      toast.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
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
    <div className="p-4 md:p-6  mx-auto">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back to Orders
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Order Details
        </h1>
        <p className="text-gray-600">Order ID: {orderData.taskId}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Order & Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              Order & Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Name
                  </Label>
                  <p className="text-gray-900">{orderData.customerInfo.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <p className="text-gray-900">
                    {orderData.customerInfo.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Phone
                  </Label>
                  <p className="text-gray-900">
                    {orderData.customerInfo.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Address
                  </Label>
                  <p className="text-gray-900">
                    {orderData.customerInfo.address}
                  </p>
                </div>
              </div>

              {/* Order Information */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Delivery Item
                  </Label>
                  <p className="text-gray-900">{orderData.deliveryItem}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Preferred Time
                  </Label>
                  <p className="text-gray-900">
                    {new Date(orderData.preferredTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Current Status
                  </Label>
                  <p
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      orderData.status === "Delivered"
                        ? "bg-green-100 text-green-800"
                        : orderData.status === "Out for Delivery"
                        ? "bg-purple-100 text-purple-800"
                        : orderData.status === "Picked Up"
                        ? "bg-orange-100 text-orange-800"
                        : orderData.status === "Reached Store"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {orderData.status}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Created
                  </Label>
                  <p className="text-gray-900">
                    {new Date(orderData.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Location Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📍</span>
              <span>Customer Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MapViewer
              customerLat={orderData.customerInfo.latitude}
              customerLon={orderData.customerInfo.longitude}
              customerAddress={orderData.customerInfo.address}
              orderStatus={orderData.status}
              agentLat={orderData?.location?.latitude}
              agentLon={orderData?.location?.longitude}
              orderId={orderData.taskId}
              showRoute={true}
              showPath={false}
              enableRealTimeTracking={true}
              height="500px"
            />
            <div className="mt-2 text-xs text-gray-500">
              Coordinates: {orderData.customerInfo.latitude.toFixed(6)},{" "}
              {orderData.customerInfo.longitude.toFixed(6)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
