import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-svh flex-1 items-center justify-center overflow-hidden bg-background p-6">
      {/* scale-110 hides the soft edges the blur leaves at the viewport border */}
      <Image
        src="/img/mi-isi.jpeg"
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-10 scale-110 object-cover blur-xs"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/70" />
      {children}
    </main>
  );
}
