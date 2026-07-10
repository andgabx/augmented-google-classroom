"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setCoursePeriodAction, type SetCoursePeriodState } from "@/features/courses/server/actions";

const initialState: SetCoursePeriodState = { success: false, message: "" };

export function PeriodForm({ courseId, periodId }: { courseId: string; periodId: string | null }) {
  const [year, term] = periodId?.split(".") ?? ["", "1"];
  const [state, formAction, pending] = useActionState(
    setCoursePeriodAction.bind(null, courseId),
    initialState
  );

  useEffect(() => {
    if (!state.message) return;
    if (state.success) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex items-center gap-2 pt-1">
      <select
        name="term"
        defaultValue={term}
        className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-ring"
      >
        <option value="1">Primeiro semestre</option>
        <option value="2">Segundo semestre</option>
      </select>
      <input
        type="number"
        name="year"
        defaultValue={year}
        placeholder="Ano"
        className="w-20 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-ring"
      />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Salvar período
      </Button>
    </form>
  );
}
