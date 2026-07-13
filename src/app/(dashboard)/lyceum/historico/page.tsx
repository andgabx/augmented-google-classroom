import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLyceumClient } from "@/features/lyceum/server/get-lyceum-client";
import { LyceumSessionExpiredError } from "@/features/lyceum/server/lyceum-client";
import {
  COMMON_EXCLUDED_FIELDS,
  KeyValuePanel,
  LyceumSessionExpiredNotice,
} from "@/features/lyceum/components/academic-data";
import { FilterablePeriodTable } from "@/features/lyceum/components/period-filter-table";

export default async function LyceumHistoricoPage() {
  const t = await getTranslations("lyceumAcademico");
  const client = await getLyceumClient();
  if (!client) redirect("/settings");

  let data: { cabecalho: unknown; historico: unknown };
  try {
    const [cabecalho, historico] = await Promise.all([client.getCabecalhoHistorico(), client.getHistorico()]);
    data = { cabecalho, historico };
  } catch (error) {
    if (error instanceof LyceumSessionExpiredError) {
      return <LyceumSessionExpiredNotice message={t("sessionExpired")} reconnectLabel={t("reconnect")} />;
    }
    throw error;
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t("historicoTitle")}</h1>
      <KeyValuePanel data={data.cabecalho} emptyLabel={t("emptyData")} excludeKeys={COMMON_EXCLUDED_FIELDS} />
      <FilterablePeriodTable
        data={data.historico}
        emptyLabel={t("emptyData")}
        excludeKeys={COMMON_EXCLUDED_FIELDS}
        allPeriodsLabel={t("allPeriods")}
        periodColumns={{ yearKey: "ano", semesterKey: "semestre" }}
      />
    </>
  );
}
