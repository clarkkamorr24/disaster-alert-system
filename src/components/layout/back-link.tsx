import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** A small green "← Label" link back to a list page. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 self-start text-xs font-bold text-link hover:text-primary-hover"
    >
      <ArrowLeft className="size-3.5" aria-hidden="true" />
      {label}
    </Link>
  );
}
