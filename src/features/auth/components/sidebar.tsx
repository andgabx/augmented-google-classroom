"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import { motion } from "motion/react";
import { ChevronsRight, Download, GraduationCap, LogOut, Trash2 } from "lucide-react";
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

interface SidebarUser {
  name: string | null;
  email: string | null;
  picture: string | null;
}

const NAV_ITEMS: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/courses", label: "Turmas", icon: GraduationCap },
  { href: "/downloads", label: "Downloads", icon: Download },
];

const LABEL_MOTION = {
  layout: true,
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.1 },
} as const;

export function Sidebar({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <motion.nav
      layout
      className="sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar p-2"
      style={{ width: open ? 240 : 68 }}
    >
      <div className="mb-3 flex items-center gap-2 border-b border-sidebar-border pb-3">
        <div className="grid size-10 shrink-0 place-content-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        {open && (
          <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-semibold text-sidebar-foreground">
            Augmented Classroom
          </motion.span>
        )}
      </div>

      <div className="space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
              {open && (
                <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
                  {label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-sidebar-border pt-2">
        <div className="flex h-12 items-center overflow-hidden rounded-md px-0.5">
          <Avatar size="lg" className="shrink-0">
            <AvatarImage src={user.picture ?? undefined} alt={user.name ?? "Usuário"} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          {open && (
            <motion.div {...LABEL_MOTION} className="ml-2 flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium text-sidebar-foreground">
                {user.name ?? "Conectado"}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
            </motion.div>
          )}
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex h-10 w-full items-center overflow-hidden rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60"
          >
            <div className="grid size-10 shrink-0 place-content-center">
              <LogOut className="size-5" />
            </div>
            {open && (
              <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
                Sair
              </motion.span>
            )}
          </button>
        </form>

        <AlertDialog>
          <AlertDialogTrigger className="flex h-10 w-full items-center overflow-hidden rounded-md text-destructive transition-colors hover:bg-destructive/10">
            <div className="grid size-10 shrink-0 place-content-center">
              <Trash2 className="size-5" />
            </div>
            {open && (
              <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
                Limpar credenciais
              </motion.span>
            )}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar credenciais do Google?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso apaga o Client ID/Secret e o token de acesso salvos localmente. Você será
                desconectado agora e precisará refazer a configuração de credenciais do Google
                para voltar a usar o aplicativo. Turmas e materiais já sincronizados continuam no
                banco local.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <form action={clearCredentialsAction}>
                <AlertDialogAction type="submit" variant="destructive">
                  Limpar
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
          {open && (
            <motion.span {...LABEL_MOTION} className="whitespace-nowrap text-sm font-medium">
              Recolher
            </motion.span>
          )}
        </button>
      </div>
    </motion.nav>
  );
}
