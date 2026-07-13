import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/server/session";
import { getLyceumConnectionStatus } from "@/features/lyceum/server/session";
import { Sidebar } from "@/features/auth/components/sidebar";
import { ThemeToggle } from "@/features/auth/components/theme-toggle";
import { LocaleToggle } from "@/features/auth/components/locale-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={{
          name: session.name ?? null,
          email: session.email ?? null,
          picture: session.picture ?? null,
        }}
        lyceumStatus={getLyceumConnectionStatus()}
      />
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2 rounded-full bg-card px-3 py-2 shadow-lg">
        <ThemeToggle open />
        <LocaleToggle open />
      </div>
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="flex w-full flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
