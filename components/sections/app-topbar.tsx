import { AppSidebar } from "@/components/sections/app-sidebar";
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
  const segments = pathName.split("/");
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
              if (segment) {
                return (
                  <div key={index} className="flex items-center">
                    <BreadcrumbItem key={index}>
                      <BreadcrumbLink
                        href={`/${segments.slice(0, index + 1).join("/")}`}
                      >
                        {segment.charAt(0).toUpperCase() + segment.slice(1)}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {index < segments.length - 1 && (
                      <BreadcrumbSeparator key={`separator-${index}`} />
                    )}
                  </div>
                );
              }
              return null;
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </header>
    </SidebarInset>
  );
}
