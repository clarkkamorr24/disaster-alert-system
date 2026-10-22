import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AccountPlaceholder() {
  return (
    <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:p-0">
      <Avatar>
        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
          O
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-medium">Officer</span>
        <span className="truncate text-xs text-muted-foreground">Officer account</span>
      </div>
    </div>
  );
}
