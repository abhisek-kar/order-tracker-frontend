"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import api from "@/lib/api";
import { toast } from "sonner";

const formSchema = z.object({
  customerName: z.string().min(2, { message: "Name is required." }),
  customerPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number." }),
  customerAddress: z.string().min(10, { message: "Address is required." }),
  customerLat: z.number({
    message: "Please select a location on the map.",
  }),
  customerLon: z.number({
    message: "Please select a location on the map.",
  }),
  preferredDateTime: z
    .string()
    .min(1, { message: "Preferred date and time is required." }),
  deliveryItem: z.string().min(5, { message: "Delivery item is required." }),
});

export default function OrderPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      customerLat: 0,
      customerLon: 0,
      preferredDateTime: "",
      deliveryItem: "",
    },
  });

  const [time, setTime] = React.useState("10:30");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const orderData = {
        customerInfo: {
          name: values.customerName,
          address: values.customerAddress,
          latitude: values.customerLat,
          longitude: values.customerLon,
          phone: values.customerPhone,
        },
        deliveryItem: values.deliveryItem,
        preferredTime: values.preferredDateTime,
      };
      const response = await api.post("/orders", orderData);
      console.log(response);
      toast.success("Order placed successfully!");

      //   router.push(`/track/${taskId}`);
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
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Place a New Delivery Order</CardTitle>
          <CardDescription>
            Fill out the form below with your delivery details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Name Field */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Field */}
              <FormField
                control={form.control}
                name="customerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 Main St, Anytown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preferred Date & Time Picker */}
              <Controller
                control={form.control}
                name="preferredDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Preferred Date & Time</FormLabel>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-32 justify-between font-normal"
                          >
                            {field.value
                              ? format(new Date(field.value), "PPP")
                              : "Select date"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                const [hours, minutes] = time.split(":");
                                const combinedDate = new Date(date);
                                combinedDate.setHours(parseInt(hours, 10));
                                combinedDate.setMinutes(parseInt(minutes, 10));
                                field.onChange(combinedDate.toISOString());
                              } else {
                                field.onChange("");
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>

                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTime = e.target.value;
                          setTime(newTime);
                          const dateValue = form.getValues("preferredDateTime");
                          if (dateValue) {
                            const [hours, minutes] = newTime.split(":");
                            const combinedDate = new Date(dateValue);
                            combinedDate.setHours(parseInt(hours, 10));
                            combinedDate.setMinutes(parseInt(minutes, 10));
                            field.onChange(combinedDate.toISOString());
                          }
                        }}
                        className="w-24 bg-background"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Delivery Item Field */}
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
