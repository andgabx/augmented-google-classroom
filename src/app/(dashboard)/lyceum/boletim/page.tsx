import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLyceumClient } from "@/features/lyceum/server/get-lyceum-client";
import { LyceumSessionExpiredError } from "@/features/lyceum/server/lyceum-client";
import { COMMON_EXCLUDED_FIELDS, DynamicTable, LyceumSessionExpiredNotice, toRows } from "@/features/lyceum/components/academic-data";

const FALTAS_PATTERN = /falta|frequenc/i;

function notaFor(provas: unknown, codes: string[]): unknown {
  if (!Array.isArray(provas)) return null;
  const match = provas.find(
    (p) => p && typeof p === "object" && codes.includes(String((p as Record<string, unknown>).codigoProva))
  );
  return match ? (match as Record<string, unknown>).nota ?? null : null;
}

// ponytail: "provas" traz todas as avaliações (AV1/SR1, AV2/SR2, SCH, MP, PF, MF) —
// mostra só as 3 notas que interessam pro aluno em vez do array inteiro.
function withNotaColumns(data: unknown, labels: { av1: string; av2: string; final: string }) {
  const dropped = ["provas", "mediaSubperiodos", "temNota", "temFreq"];
  return toRows(data).map((row) => {
    const rest = Object.fromEntries(Object.entries(row).filter(([key]) => !dropped.includes(key)));
    return {
      ...rest,
      [labels.av1]: notaFor(row.provas, ["AV1", "SR1"]),
      [labels.av2]: notaFor(row.provas, ["AV2", "SR2"]),
      [labels.final]: notaFor(row.provas, ["MF"]),
    };
  });
}

export default async function LyceumBoletimPage() {
  const t = await getTranslations("lyceumAcademico");
  const client = await getLyceumClient();
  if (!client) redirect("/settings");

  let data: { boletim: unknown };
  try {
    const boletim = await client.getBoletim();
    data = { boletim };
  } catch (error) {
    if (error instanceof LyceumSessionExpiredError) {
      return <LyceumSessionExpiredNotice message={t("sessionExpired")} reconnectLabel={t("reconnect")} />;
    }
    throw error;
  }

  const notas = withNotaColumns(data.boletim, {
    av1: t("notaAv1"),
    av2: t("notaAv2"),
    final: t("notaFinal"),
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("boletimTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("boletimCurrentOnlyNote")}</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">{t("notasTitle")}</h2>
        <DynamicTable data={notas} emptyLabel={t("emptyData")} excludeKeys={COMMON_EXCLUDED_FIELDS} excludePattern={FALTAS_PATTERN} />
      </section>
    </>
  );
}
