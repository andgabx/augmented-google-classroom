import { getTranslations } from "next-intl/server";
import { connectLyceumAction, disconnectLyceumAction } from "@/features/lyceum/server/actions";
import { loadLyceumCredentials } from "@/features/lyceum/server/credentials";
import { getLyceumClient } from "@/features/lyceum/server/get-lyceum-client";
import { LyceumSessionExpiredError } from "@/features/lyceum/server/lyceum-client";
import { Button } from "@/components/ui/button";

async function getLyceumStudentInfo(): Promise<{ nome: string } | null> {
  const client = await getLyceumClient();
  if (!client) return null;
  try {
    const dados = (await client.getDadosAluno()) as { neoAluno?: string };
    return dados.neoAluno ? { nome: dados.neoAluno } : null;
  } catch (error) {
    if (error instanceof LyceumSessionExpiredError) return null;
    throw error;
  }
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getTranslations("settings");
  const connection = loadLyceumCredentials();
  const student = connection ? await getLyceumStudentInfo() : null;
  const sessionAlive = student != null;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("title")}</h1>

      <section className="flex max-w-xl flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground">{t("lyceumTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("lyceumIntro")}</p>
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error === "missing_tenant" ? t("errorMissingTenant") : t("errorLoginFailed")}
          </p>
        )}

        {connection && sessionAlive ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-foreground">{t("connectedAs", { nome: student?.nome ?? "", ra: connection.ra })}</p>
            <form action={disconnectLyceumAction}>
              <Button type="submit" variant="destructive">
                {t("disconnectButton")}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {connection && <p className="text-sm text-destructive">{t("sessionExpiredMessage")}</p>}
            <form action={connectLyceumAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tenant" className="text-sm font-medium text-foreground">
                  {t("tenantLabel")}
                </label>
                <input
                  id="tenant"
                  name="tenant"
                  type="text"
                  required
                  defaultValue={connection?.tenant}
                  placeholder={t("tenantPlaceholder")}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                />
                <p className="text-xs text-muted-foreground">{t("tenantHint")}</p>
              </div>

              <Button type="submit" className="self-start">
                {connection ? t("reconnectButton") : t("connectButton")}
              </Button>
            </form>
            {connection && (
              <form action={disconnectLyceumAction}>
                <Button type="submit" variant="outline" size="sm">
                  {t("disconnectButton")}
                </Button>
              </form>
            )}
          </div>
        )}
      </section>
    </>
  );
}
