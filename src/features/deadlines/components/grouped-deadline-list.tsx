"use client";

import { useTranslations } from "next-intl";
import { DeadlineItem } from "@/features/deadlines/components/deadline-list";
import { getTaskStatus } from "@/features/deadlines/lib/task-status";
import type { Task } from "@/features/deadlines/types/task";

function daysUntil(dueDate: string): number {
  const [year, month, day] = dueDate.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function GroupedDeadlineList({ tasks, showCourse = true }: { tasks: Task[]; showCourse?: boolean }) {
  const t = useTranslations("deadlines");

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  const overdue: Task[] = [];
  const thisWeek: Task[] = [];
  const later: Task[] = [];
  const done: Task[] = [];

  for (const task of tasks) {
    const status = getTaskStatus(task);
    if (status === "TURNED_IN" || status === "TURNED_IN_LATE") done.push(task);
    else if (status === "MISSING") overdue.push(task);
    else if (daysUntil(task.dueDate) <= 6) thisWeek.push(task);
    else later.push(task);
  }

  const groups = [
    { key: "overdue", label: t("groupOverdue"), tasks: overdue },
    { key: "thisWeek", label: t("groupThisWeek"), tasks: thisWeek },
    { key: "later", label: t("groupLater"), tasks: later },
    { key: "done", label: t("groupDone"), tasks: done },
  ].filter((group) => group.tasks.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {group.label} ({group.tasks.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {group.tasks.map((task, index) => (
              <DeadlineItem key={task.id} task={task} showCourse={showCourse} index={index} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
