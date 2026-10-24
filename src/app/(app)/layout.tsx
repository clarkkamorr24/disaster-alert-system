import { Suspense } from "react";

import { AccountMenu } from "@/components/app-shell/account-menu";
import { ActiveAlertBadge } from "@/components/app-shell/active-alert-badge";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { TestModeBanner } from "@/components/app-shell/test-mode-banner";
import { TopBar } from "@/components/app-shell/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // From md the sidebar collapses to icons (toggle or Ctrl/⌘ B); below md it is a drawer.
    <SidebarProvider>
      <AppSidebar
        badges={{
          "/alerts": (
            <Suspense fallback={null}>
              <ActiveAlertBadge />
            </Suspense>
          ),
        }}
        footer={
          <Suspense fallback={<Skeleton className="h-15 w-full bg-white/10 group-data-[collapsible=icon]:size-11" />}>
            <AccountMenu />
          </Suspense>
        }
      />
      <SidebarInset className="min-w-0">
        <TopBar />
        <TestModeBanner />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-[clamp(16px,2.4vw,32px)] pt-1.5 pb-[34px]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
