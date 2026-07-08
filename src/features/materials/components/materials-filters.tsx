"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FileTypeGroup, PostCategory, Topic } from "@/features/materials/types/post";

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "TAREFA", label: "Tarefas" },
  { value: "MATERIAL", label: "Materiais" },
  { value: "AVISO", label: "Avisos" },
];

const FILE_TYPES: { value: FileTypeGroup; label: string }[] = [
  { value: "PDF", label: "PDF" },
  { value: "WORD", label: "Word" },
  { value: "SLIDES", label: "Slides" },
  { value: "SHEETS", label: "Planilhas" },
  { value: "IMAGE", label: "Imagens" },
  { value: "VIDEO", label: "Vídeos" },
  { value: "LINK", label: "Links" },
  { value: "OTHER", label: "Outros" },
];

const DOWNLOAD_STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "NOVO", label: "Novo" },
  { value: "BAIXADO", label: "Já baixado" },
];

const SEARCH_DEBOUNCE_MS = 400;

export function MaterialsFilters({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleListValue(name: string, value: string, checked: boolean) {
    updateParams((params) => {
      const values = params.getAll(name).filter((v) => v !== value);
      if (checked) values.push(value);
      params.delete(name);
      values.forEach((v) => params.append(name, v));
    });
  }

  function setSingleValue(name: string, value: string) {
    updateParams((params) => {
      if (value) params.set(name, value);
      else params.delete(name);
    });
  }

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setSingleValue("q", query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const categories = searchParams.getAll("category");
  const fileTypes = searchParams.getAll("fileType");
  const topicId = searchParams.get("topicId") ?? "";
  const downloadStatus = searchParams.get("downloadStatus") ?? "";

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nome"
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
      />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-semibold text-muted-foreground">Categoria</legend>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((c) => (
            <label key={c.value} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={categories.includes(c.value)}
                onChange={(e) => toggleListValue("category", c.value, e.target.checked)}
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-semibold text-muted-foreground">Tipo de arquivo</legend>
        <div className="flex flex-wrap gap-3">
          {FILE_TYPES.map((f) => (
            <label key={f.value} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={fileTypes.includes(f.value)}
                onChange={(e) => toggleListValue("fileType", f.value, e.target.checked)}
              />
              {f.label}
            </label>
          ))}
        </div>
      </fieldset>

      {topics.length > 0 && (
        <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          Tópico
          <select
            value={topicId}
            onChange={(e) => setSingleValue("topicId", e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
          >
            <option value="">Todos</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-semibold text-muted-foreground">Status de download</legend>
        <div className="flex flex-wrap gap-3">
          {DOWNLOAD_STATUS_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="radio"
                name="downloadStatus"
                checked={downloadStatus === option.value}
                onChange={() => setSingleValue("downloadStatus", option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
