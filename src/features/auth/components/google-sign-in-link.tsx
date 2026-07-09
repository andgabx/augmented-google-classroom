import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoogleSignInLink() {
  return (
    <Link
      href="/api/auth/login"
      className={cn(buttonVariants({ size: "lg" }))}
    >
      Conectar com Google
    </Link>
  );
}
