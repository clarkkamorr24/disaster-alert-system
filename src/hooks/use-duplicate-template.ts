import { duplicateTemplate } from "@/actions/templates";
import { useTransition } from "react";
import { toast } from "sonner";

export function useDuplicateTemplate(id: string) {
  const [pending, startTransition] = useTransition();

  function duplicate() {
    startTransition(async () => {
      const result = await duplicateTemplate(id);
      if (result.success) toast.success("Template duplicated.");
      else toast.error(result.error);
    });
  }

  return { duplicate, pending };
}