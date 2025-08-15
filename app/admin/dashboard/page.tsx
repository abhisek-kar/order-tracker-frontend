"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

type Order = {
  _id: string;
  status:
    | "Scheduled"
    | "Reached Store"
    | "Picked Up"
    | "Out for Delivery"
    | "Delivered";
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };
  deliveryItem: string;
  createdAt: string;
};

type OrderStats = {
  scheduled: number;
  reachedStore: number;
  pickedUp: number;
  outForDelivery: number;
  delivered: number;
  total: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<OrderStats>({
    scheduled: 0,
    reachedStore: 0,
    pickedUp: 0,
    outForDelivery: 0,
    delivered: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const response = await api.get("/orders");
        const orders: Order[] = response?.data?.data || [];

        const newStats = orders.reduce(
          (acc, order) => {
            acc.total++;
            switch (order.status) {
              case "Scheduled":
                acc.scheduled++;
                break;
              case "Reached Store":
                acc.reachedStore++;
                break;
              case "Picked Up":
                acc.pickedUp++;
                break;
              case "Out for Delivery":
                acc.outForDelivery++;
                break;
              case "Delivered":
                acc.delivered++;
                break;
            }
            return acc;
          },
          {
            scheduled: 0,
            reachedStore: 0,
            pickedUp: 0,
            outForDelivery: 0,
            delivered: 0,
            total: 0,
          }
        );

        setStats(newStats);
      } catch (error) {
        console.error("Failed to fetch order stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStats();
  }, []);

  const statCards = [
    {
      title: "Total Orders",
      value: stats.total,
      className: "bg-blue-50 border-blue-200",
      textClass: "text-blue-700",
    },
    {
      title: "Scheduled",
      value: stats.scheduled,
      className: "bg-gray-50 border-gray-200",
      textClass: "text-gray-700",
    },
    {
      title: "Reached Store",
      value: stats.reachedStore,
      className: "bg-yellow-50 border-yellow-200",
      textClass: "text-yellow-700",
    },
    {
      title: "Picked Up",
      value: stats.pickedUp,
      className: "bg-orange-50 border-orange-200",
      textClass: "text-orange-700",
    },
    {
      title: "Out for Delivery",
      value: stats.outForDelivery,
      className: "bg-purple-50 border-purple-200",
      textClass: "text-purple-700",
    },
    {
      title: "Delivered",
      value: stats.delivered,
      className: "bg-green-50 border-green-200",
      textClass: "text-green-700",
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className={card.className}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${card.textClass}`}>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.textClass}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
