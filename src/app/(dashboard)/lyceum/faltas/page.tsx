import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLyceumClient } from "@/features/lyceum/server/get-lyceum-client";
import { LyceumSessionExpiredError } from "@/features/lyceum/server/lyceum-client";
import { LyceumSessionExpiredNotice } from "@/features/lyceum/components/academic-data";
import { FilterablePeriodTable } from "@/features/lyceum/components/period-filter-table";

const FALTAS_EXCLUDED_FIELDS = ["id", "aluno", "codDisciplina", "nivelTurma", "links", "codigoTurma", "obrigatoria"];

export default async function LyceumFaltasPage() {
  const t = await getTranslations("lyceumAcademico");
  const client = await getLyceumClient();
  if (!client) redirect("/settings");

  let frequencias: unknown;
  try {
    frequencias = await client.getFrequencias();
  } catch (error) {
    if (error instanceof LyceumSessionExpiredError) {
      return <LyceumSessionExpiredNotice message={t("sessionExpired")} reconnectLabel={t("reconnect")} />;
    }
    throw error;
  }

  const content = (frequencias as { content?: unknown[] } | null)?.content ?? [];

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t("faltasTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("faltasNote")}</p>
      <FilterablePeriodTable
        data={content}
        emptyLabel={t("emptyData")}
        excludeKeys={FALTAS_EXCLUDED_FIELDS}
        allPeriodsLabel={t("allPeriods")}
        periodColumns={{ yearKey: "ano", semesterKey: "semestre" }}
      />
    </>
  );
}


