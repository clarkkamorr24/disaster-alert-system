import { cn } from "cn";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface OfficerAvatarProps {
  initials: string;
  /** Sets the size: `size-9` in the sidebar, `size-[34px]` in the header. */
  className?: string;
}

/** The officer's initials on the pale green circle used in the sidebar and header. */
export function OfficerAvatar({ initials, className }: OfficerAvatarProps) {
  return (
    <Avatar className={cn("after:hidden", className)} aria-hidden="true">
      <AvatarFallback className="bg-[#dcefe1] text-[11px] font-bold text-[#174d2d]">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
