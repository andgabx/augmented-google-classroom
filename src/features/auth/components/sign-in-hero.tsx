"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { GoogleSignInLink } from "@/features/auth/components/google-sign-in-link";

export function SignInHero() {
  const t = useTranslations("signIn");

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 sm:px-6">
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl bg-card p-6 text-center shadow-lg sm:gap-8 sm:p-10"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Augmented Classroom
          </h1>
          <p className="text-muted-foreground">{t("tagline")}</p>
        </div>
        <GoogleSignInLink />
      </motion.main>
    </div>
  );
}
