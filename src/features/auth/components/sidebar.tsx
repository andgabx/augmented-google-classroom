"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type ComponentType } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronsRight, Download, GraduationCap, Globe, LogOut, Trash2 } from "lucide-react";
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
import { clearCredentialsAction, logoutAction } from "@/features/auth/server/actions";
import { setUserLocale, type Locale } from "@/i18n/locale";
import { shortName } from "@/lib/utils";

interface SidebarUser {
  name: string | null;
  email: string | null;
  picture: string | null;
}

const NAV_ITEMS: { href: string; key: "classes" | "downloads"; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/courses", key: "classes", icon: GraduationCap },
  { href: "/downloads", key: "downloads", icon: Download },
];

const LABEL_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.15 },
} as const;

export function Sidebar({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
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
      className="sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar p-2"
    >
      <div className="mb-3 flex items-center gap-2 border-b border-sidebar-border pb-3">
        <div className="grid size-10 shrink-0 place-content-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        <AnimatePresence>
          {open && (
            <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-semibold text-sidebar-foreground">
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
              className={`flex h-10 items-center overflow-hidden rounded-md transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
              }`}
            >
              <div className="grid size-10 shrink-0 place-content-center">
                <Icon className="size-5" />
              </div>
              <AnimatePresence>
                {open && (
                  <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
                    {tSidebar(key)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-sidebar-border pt-2">
        <div className="flex h-12 items-center overflow-hidden rounded-md px-0.5">
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
                <span className="truncate text-xs font-medium text-sidebar-foreground">
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
          className="flex h-10 w-full items-center overflow-hidden rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60"
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

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex h-10 w-full items-center overflow-hidden rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60"
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
          <AlertDialogTrigger className="flex h-10 w-full items-center overflow-hidden rounded-md text-destructive transition-colors hover:bg-destructive/10">
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
          className="flex h-10 w-full items-center overflow-hidden rounded-md border-t border-sidebar-border text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60"
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
