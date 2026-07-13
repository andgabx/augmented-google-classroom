"use client";

import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export function ThemeToggle({ open }: { open: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("sidebar");
  const isDark = resolvedTheme !== "light";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={t(isDark ? "themeLight" : "themeDark")}
        className="flex h-10 w-full items-center justify-center overflow-hidden rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60"
      >
        <div className="grid size-10 shrink-0 place-content-center">
          {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={t(isDark ? "themeLight" : "themeDark")}
      onClick={toggle}
      className={`relative flex h-7 w-14 items-center rounded-full p-1 shadow-inner transition-colors ${
        isDark ? "justify-start bg-primary" : "justify-end bg-muted"
      }`}
    >
      <motion.span
        layout
        transition={{ duration: 0.4, type: "spring", bounce: 0.25 }}
        className="grid size-5 place-content-center rounded-full bg-background shadow"
      >
        {isDark ? <Moon className="size-3 text-primary" /> : <Sun className="size-3 text-muted-foreground" />}
      </motion.span>
      {isDark && (
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1, 0.85] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute left-1.5 top-1 text-xs text-primary-foreground/70"
        >
          ✦
        </motion.span>
      )}
    </button>
  );
}
