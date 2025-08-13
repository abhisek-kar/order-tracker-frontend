"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Power, ShoppingCart } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useAuthStore } from "@/lib/store";
import { Button } from "../ui/button";
import { useState } from "react";
import { LogoutDialog } from "../dialogs/logout-dialog";

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore((state) => state);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <Sidebar>
        <Link href="/dashboard" className=" text-xl font-bold p-4">
          H! {user?.name || "User"}
        </Link>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel></SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2",
                            pathname === item.href && "text-primary"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button
            variant="ghost"
            className="w-full flex items-center gap-2 cursor-pointer my-4"
            onClick={() => setShowLogoutModal(true)}
          >
            <Power /> Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
      {showLogoutModal && (
        <LogoutDialog
          open={showLogoutModal}
          onClose={() => setShowLogoutModal((prev) => !prev)}
          onLogout={logout}
        />
      )}
    </>
  );
}
