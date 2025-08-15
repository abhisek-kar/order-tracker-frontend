import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackHome from "@/components/back-home";

export interface OrderSuccessProps {
  orderId: string;
  onPlaceNewOrder: () => void;
}

export default function OrderSuccess({
  orderId,
  onPlaceNewOrder,
}: OrderSuccessProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      <Card className="rounded-2xl shadow-lg border border-foreground/10">
        <CardContent className="p-6 sm:p-8 text-center ">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <CheckCircle className="text-green-500 w-16 h-16 sm:w-20 sm:h-20" />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl font-bold text-foreground mb-6"
          >
            Order Placed Successfully!
          </motion.h2>

          {/* Order ID */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 mb-8"
          >
            Here is your Order ID:
            <span className="block font-mono font-semibold text-foreground/90 text-lg sm:text-xl mt-2">
              #{orderId}
            </span>
          </motion.p>

          {/* Extra Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-1 mt-2  "
          >
            <p className="text-foreground/70">
              Thank you for your order! We will process it shortly.
            </p>
            <p className="text-foreground/70 text-sm">
              We have sent you an email with your order details.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 mt-8 justify-center"
          >
            <BackHome />
            <Button
              onClick={onPlaceNewOrder}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Place New Order
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
