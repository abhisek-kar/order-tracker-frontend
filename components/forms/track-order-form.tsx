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

const formSchema = z.object({
  taskId: z.string().min(1, {
    message: "Task ID is required.",
  }),
});

export default function TrackOrderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const response = await api.get(`/orders/${values.taskId}`);
      console.log(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to track order.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-3xl">
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
  );
}
