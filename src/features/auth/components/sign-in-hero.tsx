"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/brand-mark";
import { GoogleSignInLink } from "@/features/auth/components/google-sign-in-link";
import { LanguageDropdown } from "@/features/auth/components/language-dropdown";
import { ThemeToggle } from "@/features/auth/components/theme-toggle";

export function SignInHero() {
  const t = useTranslations("signIn");

  return (
    <div className="relative flex flex-1 items-center justify-center bg-background px-4 sm:px-6">
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
        <div className="rounded-full bg-card p-2 shadow-lg">
          <LanguageDropdown />
        </div>
        <div className="rounded-full bg-card p-2 shadow-lg">
          <ThemeToggle open />
        </div>
      </div>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl bg-card p-6 text-center shadow-lg sm:gap-8 sm:p-10"
      >
        <BrandMark className="size-14" />
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Augmented Google Classroom
          </h1>
          <p className="text-muted-foreground">{t("tagline")}</p>
        </div>
        <GoogleSignInLink />
      </motion.main>
    </div>
  );
}
