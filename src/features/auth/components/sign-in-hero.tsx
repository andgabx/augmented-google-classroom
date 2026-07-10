"use client";

import { motion } from "motion/react";
import { GoogleSignInLink } from "@/features/auth/components/google-sign-in-link";

export function SignInHero() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6">
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-lg flex-col items-center gap-8 rounded-3xl border border-border bg-card p-10 text-center shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Augmented Classroom
          </h1>
          <p className="text-muted-foreground">
            Organize turmas, materiais e prazos do Google Classroom num só lugar.
          </p>
        </div>
        <GoogleSignInLink />
      </motion.main>
    </div>
  );
}
