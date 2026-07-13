import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/server/session";
import { getLyceumConnectionStatus } from "@/features/lyceum/server/session";
import { Sidebar } from "@/features/auth/components/sidebar";

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
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="flex w-full flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
