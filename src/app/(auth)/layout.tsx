export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center bg-accent p-4 dark:bg-background">
      {children}
    </main>
  );
}
