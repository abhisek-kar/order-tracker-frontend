"use client";

import OrderForm from "@/components/forms/order-form";
import OrderSuccess from "@/components/order-success";
import * as React from "react";
import { useState } from "react";

export default function OrderPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  return (
    <div className="flex justify-center items-center min-h-screen  p-4">
     {
      orderId ? (
        <OrderSuccess orderId={orderId} />
      ) : (
        <OrderForm onOrderPlaced={(id:string) => setOrderId(id)} />
      )
     }

    </div>
  );
}
