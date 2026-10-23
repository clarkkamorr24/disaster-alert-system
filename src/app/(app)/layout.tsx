import { Suspense } from "react";

import { AccountMenu } from "@/components/app-shell/account-menu";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { TestModeBanner } from "@/components/app-shell/test-mode-banner";
import { TopBar } from "@/components/app-shell/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        footer={
          <Suspense fallback={<Skeleton className="h-10" />}>
            <AccountMenu />
          </Suspense>
        }
      />
      <SidebarInset className="min-w-0">
        <TopBar />
        <TestModeBanner />
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
