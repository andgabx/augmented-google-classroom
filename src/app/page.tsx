import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/server/session";
import { SignInHero } from "@/features/auth/components/sign-in-hero";

export default async function Home() {
  const session = await getSession();

  if (session.isLoggedIn) {
    redirect("/courses");
  }

  return <SignInHero />;
}
