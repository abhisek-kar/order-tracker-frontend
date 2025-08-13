"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sections/app-sidebar";
import PageLoader from "@/components/page-loader";
import AppTopbar from "@/components/sections/app-topbar";
import { useAuthStore } from "@/lib/store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoggedIn, token } = useAuthStore((state) => state);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unSub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    setHydrated(useAuthStore.persist.hasHydrated());
    return unSub;
  }, []);

  useEffect(() => {
    if (hydrated && (!isLoggedIn || !token)) {
      router.push("/login");
    }
  }, [hydrated, isLoggedIn, token, router]);

  if (!hydrated) {
    return <PageLoader />;
  }

  if (!isLoggedIn || !token) {
    return <PageLoader />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <AppTopbar />
        <div className="p-4 h-full">{children}</div>
      </main>
    </SidebarProvider>
  );
}
