import { TopBar } from "@/components/app-shell/top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar p-4 text-sidebar-foreground md:block">
        <h2>Sidebar</h2>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
