"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api from "@/lib/api";
import { toast } from "sonner";

type Order = {
  _id: string;
  taskId: string;
  customerInfo: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  deliveryItem: string;
  preferredTime: string;
  status:
    | "Scheduled"
    | "Reached Store"
    | "Picked Up"
    | "Out for Delivery"
    | "Delivered";
  createdAt: string;
  updatedAt: string;
  __v: number;
};

const statusColumns = [
  { id: "Scheduled", title: "Scheduled" },
  { id: "Reached Store", title: "Reached Store" },
  { id: "Picked Up", title: "Picked Up" },
  { id: "Out for Delivery", title: "Out for Delivery" },
  { id: "Delivered", title: "Delivered" },
];

export default function OrdersKanban() {
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const response = await api.get("/orders");
      setOrders(response?.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const updatedOrders = orders.map((order) =>
      order.taskId === draggableId
        ? { ...order, status: destination.droppableId as Order["status"] }
        : order
    );
    setOrders(updatedOrders);

    if (destination.droppableId !== source.droppableId) {
      try {
        await api.patch(`/orders/${draggableId}/status`, {
          status: destination.droppableId,
        });
        toast.success("Order status updated successfully");
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to update order";
        toast.error(message);
        fetchOrders();
      }
    }
  };

  const handleCardClick = (orderId: string, event: React.MouseEvent) => {
    if (event.defaultPrevented) return;
    router.push(`/dashboard/orders/${orderId}`);
  };

  return (
    <div className="p-4 md:p-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
          {statusColumns.map((column) => (
            <div key={column.id} className="flex flex-col">
              <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-700 text-center">
                {column.title}
              </h2>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    className={` rounded-lg p-3 md:p-4 shadow min-h-[400px] md:min-h-[500px] w-full border border-gray-200`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {orders
                      .filter((order) => order.status === column.id)
                      .map((order, index) => (
                        <Draggable
                          key={order._id}
                          draggableId={order.taskId}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              className="bg-white rounded-md p-3 mb-3 shadow cursor-pointer hover:shadow-md transition-shadow"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={(e) => handleCardClick(order.taskId, e)}
                            >
                              <div className="font-semibold text-sm mb-1">
                                {order.customerInfo.name}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {order.deliveryItem}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  order.preferredTime
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
