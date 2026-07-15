"use client";

import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoogleSignInLink() {
  const t = useTranslations("signIn");

  return (
    <a href="/api/auth/login" className={cn(buttonVariants({ size: "lg" }))}>
      {t("connectButton")}
    </a>
  );
}
