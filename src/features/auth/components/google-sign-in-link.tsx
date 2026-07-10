"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoogleSignInLink() {
  const t = useTranslations("signIn");

  return (
    <Link
      href="/api/auth/login"
      className={cn(buttonVariants({ size: "lg" }))}
    >
      {t("connectButton")}
    </Link>
  );
}
