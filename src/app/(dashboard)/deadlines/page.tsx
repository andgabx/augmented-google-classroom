import { getTranslations } from "next-intl/server";
import { listTasks } from "@/features/deadlines/server/deadlines";
import { DEFAULT_TASK_STATUSES, type TaskStatus } from "@/features/deadlines/lib/task-status";
import { GroupedDeadlineList } from "@/features/deadlines/components/grouped-deadline-list";
import { DeadlineFilters } from "@/features/deadlines/components/deadline-filters";
import { SyncDeadlinesButton } from "@/features/deadlines/components/sync-deadlines-button";

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function DeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; q?: string }>;
}) {
  const t = await getTranslations("deadlines");
  const { status, q } = await searchParams;
  const statuses = toArray(status) as TaskStatus[];
  const tasks = listTasks({ status: statuses.length ? statuses : DEFAULT_TASK_STATUSES, query: q || undefined });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-3 pt-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t("title")}</h1>
          <SyncDeadlinesButton />
        </div>
        <DeadlineFilters />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
        <GroupedDeadlineList tasks={tasks} />
      </div>
    </div>
  );
}
