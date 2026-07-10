"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { syncCoursesAction, type SyncCoursesState } from "@/features/courses/server/actions";

const initialState: SyncCoursesState = { success: false, message: "" };

export function SyncCoursesButton() {
  const t = useTranslations("courses");
  const [state, formAction, pending] = useActionState(syncCoursesAction, initialState);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? t("syncing") : t("sync")}
      </Button>
    </form>
  );
}
