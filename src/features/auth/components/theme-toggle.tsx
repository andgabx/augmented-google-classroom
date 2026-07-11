"use client";

import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { StaggeredDropdown, StaggeredDropdownItem } from "@/components/ui/staggered-dropdown";

const LABEL_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.15 },
} as const;

const THEME_OPTIONS = [
  { value: "light", icon: Sun, key: "themeLight" },
  { value: "dark", icon: Moon, key: "themeDark" },
  { value: "system", icon: Monitor, key: "themeSystem" },
] as const;

export function ThemeToggle({ open }: { open: boolean }) {
  const { theme = "system", setTheme } = useTheme();
  const t = useTranslations("sidebar");
  const current = THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[2];

  return (
    <StaggeredDropdown
      side="right"
      align="start"
      triggerClassName={`h-10 w-full overflow-hidden rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 ${open ? "" : "justify-center"}`}
      trigger={
        <>
          <div className="grid size-10 shrink-0 place-content-center">
            <current.icon className="size-5" />
          </div>
          <AnimatePresence>
            {open && (
              <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
                {t(current.key)}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      }
    >
      {THEME_OPTIONS.map(({ value, icon: OptionIcon, key }) => (
        <StaggeredDropdownItem key={value} icon={OptionIcon} onClick={() => setTheme(value)}>
          {t(key)}
        </StaggeredDropdownItem>
      ))}
    </StaggeredDropdown>
  );
}
