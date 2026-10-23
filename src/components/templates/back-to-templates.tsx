import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function BackToTemplates() {
  return (
    <Link
      href="/templates"
      className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
      All templates
    </Link>
  );
}
