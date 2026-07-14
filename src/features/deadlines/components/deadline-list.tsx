"use client";

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDue } from "@/features/deadlines/lib/format-due";
import { getTaskStatus } from "@/features/deadlines/lib/task-status";
import type { Task } from "@/features/deadlines/types/task";

const STATUS_KEY = {
  PENDING: "statusPending",
  MISSING: "statusMissing",
  TURNED_IN: "statusTurnedIn",
  TURNED_IN_LATE: "statusTurnedInLate",
} as const;

export function DeadlineItem({ task, showCourse, index }: { task: Task; showCourse: boolean; index: number }) {
  const t = useTranslations("deadlines");
  const locale = useLocale();
  const due = formatDue(task.dueDate, locale);
  const status = getTaskStatus(task);

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: "easeOut" }}
    >
      <Link
        href={`/deadlines/${task.id}`}
        className="group flex items-center justify-between gap-3 rounded-2xl bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-lg"
      >
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{task.title ?? t("untitled")}</span>
          <span className="text-xs text-muted-foreground">
            {showCourse && `${task.courseName} · `}
            <span className={status === "MISSING" ? "text-destructive" : undefined}>{due.label}</span>
            {" · "}
            {t(STATUS_KEY[status])}
          </span>
        </div>
        <ArrowRight className="size-4 shrink-0 -translate-x-1 text-primary opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
      </Link>
    </motion.li>
  );
}

export function DeadlineList({ tasks, showCourse = true }: { tasks: Task[]; showCourse?: boolean }) {
  const t = useTranslations("deadlines");

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task, index) => (
        <DeadlineItem key={task.id} task={task} showCourse={showCourse} index={index} />
      ))}
    </ul>
  );
}
