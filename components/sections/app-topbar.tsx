import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export default function AppTopbar() {
  const pathName = usePathname();
  const segments = pathName.split("/").filter(Boolean);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const href = `/${segments.slice(0, index + 1).join("/")}`;
              return (
                <BreadcrumbItem key={href}>
                  <BreadcrumbLink href={href}>
                    {segment
                      .replace(/-/g, " ")
                      .replace(/^\w/, (c) => c.toUpperCase())}
                  </BreadcrumbLink>
                  {index < segments.length - 1 && <BreadcrumbSeparator />}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </header>
    </SidebarInset>
  );
}

