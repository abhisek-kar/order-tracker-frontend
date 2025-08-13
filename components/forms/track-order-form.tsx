"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import PageLoader from "@/components/page-loader";
import { Label } from "@/components/ui/label";
import { MapViewer } from "@/components/map/map-viewer";

export interface OrderData {
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
}

const formSchema = z.object({
  taskId: z.string().min(1, {
    message: "Task ID is required.",
  }),
});

export default function TrackOrderForm() {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const response = await api.get(`/orders/${values.taskId.trim()}`);
      setOrderData(response?.data?.data || {});
      form.reset();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to track order.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="w-full  ">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Track Your Order</CardTitle>
          <CardDescription>
            Enter the Task ID / Order ID provided to you to see the real-time
            status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-center gap-4"
            >
              <FormField
                control={form.control}
                name="taskId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="e.g., d8a6f7b1-4c1e-4b8a-9a9c-0c6a5d4e1f7c"
                        {...field}
                      />
                    </FormControl>
                    {/* <FormMessage /> */}
                  </FormItem>
                )}
              />
              <Button type="submit" className="" disabled={loading}>
                {loading ? "Tracking..." : "Track Order"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {orderData && <OrderDetails orderData={orderData} />}
    </div>
  );
}

export function OrderDetails({ orderData }: { orderData: OrderData }) {
  return (
    <div className="p-2 mt-6">
      <div className="mb-6">
        <h1 className="text-base md:text-lg font-bold text-gray-900 mb-2">
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

        {/* Delivery Tracking Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              Delivery Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MapViewer
              customerLat={orderData.customerInfo.latitude}
              customerLon={orderData.customerInfo.longitude}
              customerAddress={orderData.customerInfo.address}
              orderStatus={orderData.status}
              orderId={orderData.taskId}
              showRoute={true}
              showPath={false}
              height="500px"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
