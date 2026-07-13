"use client";

import { motion } from "motion/react";
import { formatLabel, formatValue, normalizeKey, toRows } from "@/features/lyceum/lib/table-utils";

// ponytail: shape das respostas do Lyceum não é documentada — renderiza colunas/labels
// dinamicamente a partir do JSON em vez de supor nomes de campo.
export function DynamicTable({
  data,
  emptyLabel,
  excludeKeys = [],
  excludePattern,
}: {
  data: unknown;
  emptyLabel: string;
  excludeKeys?: string[];
  // ponytail: RegExp instances não são serializáveis de Server para Client Component —
  // recebe a source como string e monta o RegExp aqui.
  excludePattern?: string;
}) {
  const rows = toRows(data);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;

  const excluded = new Set(excludeKeys.map(normalizeKey));
  const pattern = excludePattern ? new RegExp(excludePattern, "i") : undefined;
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter(
    (col) => !excluded.has(normalizeKey(col)) && !pattern?.test(col)
  );

  return (
    <div className="w-full overflow-x-auto rounded-2xl bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted-foreground">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium sm:px-4 sm:py-3">
                {formatLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <motion.tr
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03, ease: "easeOut" }}
              className={`text-sm ${index % 2 ? "bg-muted/40" : ""}`}
            >
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-foreground sm:px-4 sm:py-3">
                  {formatValue(row[col], col)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
