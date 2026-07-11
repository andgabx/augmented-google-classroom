"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type ComponentType } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronsRight, Download, GraduationCap, Globe, LogOut, Settings, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/features/auth/components/theme-toggle";
import { clearCredentialsAction, logoutAction } from "@/features/auth/server/actions";
import { setUserLocale, type Locale } from "@/i18n/locale";
import { shortName } from "@/lib/utils";

interface SidebarUser {
  name: string | null;
  email: string | null;
  picture: string | null;
}

const NAV_ITEMS: {
  href: string;
  key: "classes" | "downloads" | "settings";
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { href: "/courses", key: "classes", icon: GraduationCap },
  { href: "/downloads", key: "downloads", icon: Download },
  { href: "/settings", key: "settings", icon: Settings },
];

const LYCEUM_SUBITEMS: { href: string; key: "lyceumHistorico" | "lyceumBoletim" | "lyceumFaltas" }[] = [
  { href: "/lyceum/historico", key: "lyceumHistorico" },
  { href: "/lyceum/boletim", key: "lyceumBoletim" },
  { href: "/lyceum/faltas", key: "lyceumFaltas" },
];

const LABEL_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.15 },
} as const;

export function Sidebar({ user, lyceumConnected }: { user: SidebarUser; lyceumConnected: boolean }) {
  const [open, setOpen] = useState(true);
  const [lyceumOpen, setLyceumOpen] = useState(false);
  const pathname = usePathname();
  const lyceumActive = LYCEUM_SUBITEMS.some(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  const router = useRouter();
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();
  const t = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function toggleLocale() {
    const next: Locale = locale === "pt" ? "en" : "pt";
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  }

  return (
    <motion.nav
      initial={false}
      animate={{ width: open ? 240 : 68 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="sticky top-3 m-3 flex h-[calc(100vh-1.5rem)] shrink-0 flex-col rounded-2xl bg-sidebar p-2 shadow-lg"
    >
      <div
        className={`mb-3 flex items-center gap-2 border-b border-sidebar-border/60 pb-3 ${open ? "" : "justify-center"}`}
      >
        <div className="grid size-10 shrink-0 place-content-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        <AnimatePresence>
          {open && (
            <motion.span
              {...LABEL_MOTION}
              className="whitespace-nowrap text-sm font-semibold tracking-tight text-sidebar-foreground"
            >
              Augmented Classroom
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-1">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex h-10 items-center overflow-hidden rounded-md transition-colors ${open ? "" : "justify-center"} ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <div className="grid size-10 shrink-0 place-content-center">
                <Icon className="size-5" strokeWidth={active ? 2.25 : 2} />
              </div>
              <AnimatePresence>
                {open && (
                  <motion.span
                    {...LABEL_MOTION}
                    className={`whitespace-nowrap text-sm ${active ? "font-semibold" : "font-medium"}`}
                  >
                    {tSidebar(key)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      {lyceumConnected && (
        <div className="space-y-1">
          <div
            className={`flex h-10 w-full items-center overflow-hidden rounded-md transition-colors ${open ? "" : "justify-center"} ${
              lyceumActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            }`}
          >
            <Link href={LYCEUM_SUBITEMS[0].href} className="grid size-10 shrink-0 place-content-center">
              <GraduationCap className="size-5" strokeWidth={lyceumActive ? 2.25 : 2} />
            </Link>
            <AnimatePresence>
              {open && (
                <motion.span {...LABEL_MOTION} className="flex flex-1 items-center pr-1">
                  <Link
                    href={LYCEUM_SUBITEMS[0].href}
                    className={`flex-1 whitespace-nowrap text-sm ${lyceumActive ? "font-semibold" : "font-medium"}`}
                  >
                    Lyceum
                  </Link>
                  <button
                    type="button"
                    onClick={() => setLyceumOpen((value) => !value)}
                    aria-label={tSidebar("collapse")}
                    className="grid size-8 shrink-0 place-content-center rounded-md hover:bg-sidebar-accent"
                  >
                    <ChevronDown className={`size-4 transition-transform ${lyceumOpen ? "rotate-180" : ""}`} />
                  </button>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {open && lyceumOpen && (
            <div className="flex flex-col gap-1 pl-10">
              {LYCEUM_SUBITEMS.map(({ href, key }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex h-9 items-center whitespace-nowrap rounded-md px-2 text-sm transition-colors ${
                      active
                        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    }`}
                  >
                    {tSidebar(key)}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1 border-t border-sidebar-border/60 pt-2">
        <div className={`flex h-12 items-center overflow-hidden rounded-md px-0.5 ${open ? "" : "justify-center"}`}>
          <Avatar size="lg" className="shrink-0">
            <AvatarImage
              src={user.picture ?? undefined}
              alt={user.name ?? tSidebar("userAvatarAlt")}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {open && (
              <motion.div {...LABEL_MOTION} className="ml-2 flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-sidebar-foreground">
                  {user.name ? shortName(user.name) : tSidebar("connected")}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={toggleLocale}
          disabled={isPending}
          className={`flex h-10 w-full items-center overflow-hidden rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 ${open ? "" : "justify-center"}`}
        >
          <div className="grid size-10 shrink-0 place-content-center">
            <Globe className="size-5" />
          </div>
          <AnimatePresence>
            {open && (
              <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
                {locale === "pt" ? t("portuguese") : t("english")}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <ThemeToggle open={open} />

        <form action={logoutAction}>
          <button
            type="submit"
            className={`flex h-10 w-full items-center overflow-hidden rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 ${open ? "" : "justify-center"}`}
          >
            <div className="grid size-10 shrink-0 place-content-center">
              <LogOut className="size-5" />
            </div>
            <AnimatePresence>
              {open && (
                <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
                  {tSidebar("signOut")}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </form>

        <AlertDialog>
          <AlertDialogTrigger className={`flex h-10 w-full items-center overflow-hidden rounded-md text-destructive transition-colors hover:bg-destructive/10 ${open ? "" : "justify-center"}`}>
            <div className="grid size-10 shrink-0 place-content-center">
              <Trash2 className="size-5" />
            </div>
            <AnimatePresence>
              {open && (
                <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
                  {tSidebar("clearCredentials")}
                </motion.span>
              )}
            </AnimatePresence>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tSidebar("clearCredentialsTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{tSidebar("clearCredentialsDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tSidebar("cancel")}</AlertDialogCancel>
              <form action={clearCredentialsAction}>
                <AlertDialogAction type="submit" variant="destructive">
                  {tSidebar("confirm")}
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`flex h-10 w-full items-center overflow-hidden rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 ${open ? "" : "justify-center"}`}
        >
          <div className="grid size-10 shrink-0 place-content-center">
            <ChevronsRight className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
          <AnimatePresence>
            {open && (
              <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
                {tSidebar("collapse")}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.nav>
  );
}
