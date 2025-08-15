import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import TrackOrderForm from "@/components/forms/track-order-form";

export default function HomePage() {
  return (
    <main className="container mx-auto min-h-screen flex flex-col items-center p-4 max-w-7xl">
      {/* Header with Navigation */}
      <div className="flex text-center justify-between w-full mb-20">
        <h1 className="text-3xl font-semibold tracking-tight">Order Tracker</h1>

        <nav className="flex items-center justify-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/order">Place Order</Link>
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Login</Link>
          </Button>
        </nav>
      </div>

      <TrackOrderForm />
    </main>
  );
}
