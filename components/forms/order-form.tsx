"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import api from "@/lib/api";
import { toast } from "sonner";
import { MapPicker } from "@/components/map/map-picker";
import { DateTimePicker } from "@/components/date-time-picker";

export interface OrderFormProps {
  onOrderPlaced?: (orderId: string) => void;
}

const formSchema = z.object({
  customerName: z.string().min(2, { message: "Name is required." }),
  customerPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number." }),
  customerLocation: z.object({
    latitude: z.number().min(-90).max(90, { message: "Invalid latitude." }),
    longitude: z.number().min(-180).max(180, { message: "Invalid longitude." }),
    address: z.string().min(5, { message: "Address is required." }),
  }),
  preferredDateTime: z
    .string()
    .min(1, { message: "Preferred date and time is required." }),
  deliveryItem: z.string().min(5, { message: "Delivery item is required." }),
});

export default function OrderForm({ onOrderPlaced }: OrderFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerLocation: {
        latitude: 20.26,
        longitude: 85.84,
        address: "Bhubaneswar, Odisha, India",
      },
      preferredDateTime: "",
      deliveryItem: "Package",
    },
  });

  const selectedAddress = useWatch({
    control: form.control,
    name: "customerLocation.address",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const orderData = {
        customerInfo: {
          name: values.customerName,
          address: values.customerLocation.address,
          latitude: values.customerLocation.latitude,
          longitude: values.customerLocation.longitude,
          phone: values.customerPhone,
        },
        deliveryItem: values.deliveryItem,
        preferredTime: values.preferredDateTime,
      };
      const response = await api.post("/orders", orderData);
      onOrderPlaced?.(response?.data?.taskId || "Unknown Order ID");

    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to place order. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="w-full max-w-6xl ">
        <CardHeader>
          <CardTitle className="text-2xl">Place a New Order</CardTitle>
          <CardDescription>
            Fill out the form below with your delivery details.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: Form Fields */}
                <div className="space-y-6">
                  {/* Customer Name */}
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Customer Phone */}
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter Your Mobile No</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 8093879172" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preferred Date & Time */}
                  <FormField
                    control={form.control}
                    name="preferredDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Date & Time</FormLabel>
                        <FormControl>
                          <DateTimePicker
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Delivery Item */}
                  <FormField
                    control={form.control}
                    name="deliveryItem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Item</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Electronics, Groceries, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>

                {/* RIGHT: Map Picker */}
                <div>
                  <FormLabel className="mb-2 block">
                    Pick Location on Map
                  </FormLabel>

                  <MapPicker
                    initialLat={
                      form.getValues("customerLocation.latitude") || undefined
                    }
                    initialLon={
                      form.getValues("customerLocation.longitude") || undefined
                    }
                    onLocationSelect={(lat, lon, address) => {
                      form.setValue("customerLocation.latitude", lat, {
                        shouldValidate: true,
                      });
                      form.setValue("customerLocation.longitude", lon, {
                        shouldValidate: true,
                      });
                      form.setValue("customerLocation.address", address, {
                        shouldValidate: true,
                      });
                    }}
                  />

                  {/* Show selected address */}
                  {selectedAddress && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      <strong>Selected Address:</strong> {selectedAddress}
                    </p>
                  )}

                  {/* Hidden RHF fields */}
                  <input
                    type="hidden"
                    {...form.register("customerLocation.latitude", {
                      valueAsNumber: true,
                    })}
                  />
                  <input
                    type="hidden"
                    {...form.register("customerLocation.longitude", {
                      valueAsNumber: true,
                    })}
                  />
                  <input
                    type="hidden"
                    {...form.register("customerLocation.address")}
                  />
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
