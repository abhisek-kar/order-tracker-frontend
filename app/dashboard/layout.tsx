"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sections/app-sidebar";
import PageLoader from "@/components/page-loader";
import AppTopbar from "@/components/sections/app-topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <AppTopbar />
        <div className="p-4  h-full">{children}</div>
      </main>
    </SidebarProvider>
  );
}
