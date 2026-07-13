"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { setUserLocale, type Locale } from "@/i18n/locale";

export function LocaleToggle({ open }: { open: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const isPt = locale === "pt";

  function toggle() {
    const next: Locale = isPt ? "en" : "pt";
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-label={isPt ? t("english") : t("portuguese")}
        className="flex h-10 w-full items-center justify-center overflow-hidden rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 disabled:opacity-50"
      >
        <div className="grid size-10 shrink-0 place-content-center text-xs font-bold">
          {isPt ? "PT" : "EN"}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPt}
      aria-label={isPt ? t("english") : t("portuguese")}
      onClick={toggle}
      disabled={isPending}
      className={`relative flex h-7 w-14 items-center rounded-full p-1 shadow-inner transition-colors disabled:opacity-50 ${
        isPt ? "justify-start bg-muted" : "justify-end bg-primary"
      }`}
    >
      <motion.span
        layout
        transition={{ duration: 0.4, type: "spring", bounce: 0.25 }}
        className="grid size-5 place-content-center rounded-full bg-background text-xs font-bold shadow"
      >
        <span className={isPt ? "text-muted-foreground" : "text-primary"}>{isPt ? "PT" : "EN"}</span>
      </motion.span>
    </button>
  );
}
