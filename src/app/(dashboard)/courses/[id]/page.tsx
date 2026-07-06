import { notFound, redirect } from "next/navigation";
import { getSession } from "@/features/auth/server/session";
import { getCourse } from "@/features/courses/server/courses";
import {
  hasSyncedMaterials,
  listCourseMaterials,
  listTopics,
  syncCourseMaterials,
} from "@/features/materials/server/materials";
import { syncCourseMaterialsAction } from "@/features/materials/server/actions";
import { listDownloadsForCourse } from "@/features/downloads/server/downloads";
import { enqueueDownloadsAction } from "@/features/downloads/server/actions";
import { Button } from "@/components/ui/button";
import { getCallbackRedirectUri } from "@/lib/redirect-uri";
import type { FileTypeGroup, PostCategory } from "@/features/materials/types/post";
import type { DownloadStatus } from "@/features/downloads/types/download";

const DOWNLOAD_STATUS_LABEL: Record<DownloadStatus, string> = {
  QUEUED: "Na fila",
  DOWNLOADING: "Baixando...",
  DONE: "Baixado ✓",
  ERROR: "Erro",
};

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

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function CourseMaterialsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    category?: string | string[];
    fileType?: string | string[];
    topicId?: string;
    downloadStatus?: string;
  }>;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect("/");
  }

  const { id } = await params;
  const course = getCourse(id);
  if (!course) {
    notFound();
  }

  if (!hasSyncedMaterials(id)) {
    await syncCourseMaterials(id, await getCallbackRedirectUri());
  }

  const { category, fileType, topicId, downloadStatus } = await searchParams;
  const categories = toArray(category) as PostCategory[];
  const fileTypes = toArray(fileType) as FileTypeGroup[];

  const topics = listTopics(id);
  const statusByMaterial = new Map(
    listDownloadsForCourse(id).map((download) => [download.materialId, download.status])
  );

  let materials = listCourseMaterials(id, {
    category: categories.length ? categories : undefined,
    fileType: fileTypes.length ? fileTypes : undefined,
    topicId: topicId || undefined,
  });

  if (downloadStatus === "NOVO") {
    materials = materials.filter((material) => statusByMaterial.get(material.id) !== "DONE");
  } else if (downloadStatus === "BAIXADO") {
    materials = materials.filter((material) => statusByMaterial.get(material.id) === "DONE");
  }

  const downloadableIds = materials.filter((material) => material.type === "DRIVE_FILE").map((material) => material.id);


  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {course.name}
          </h1>
          {course.section && (
            <span className="text-sm text-muted-foreground">{course.section}</span>
          )}
        </div>
        <form action={syncCourseMaterialsAction.bind(null, id)}>
          <Button type="submit" variant="outline" size="sm">
            Sincronizar
          </Button>
        </form>
      </div>

      <form className="flex flex-col gap-4" method="get">
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-semibold text-muted-foreground">Categoria</legend>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <label key={c.value} className="flex items-center gap-1.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="category"
                  value={c.value}
                  defaultChecked={categories.includes(c.value)}
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
                  name="fileType"
                  value={f.value}
                  defaultChecked={fileTypes.includes(f.value)}
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
              name="topicId"
              defaultValue={topicId ?? ""}
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
            {[
              { value: "", label: "Todos" },
              { value: "NOVO", label: "Novo" },
              { value: "BAIXADO", label: "Já baixado" },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-1.5 text-sm text-foreground">
                <input
                  type="radio"
                  name="downloadStatus"
                  value={option.value}
                  defaultChecked={(downloadStatus ?? "") === option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Button type="submit" variant="secondary" size="sm" className="self-start">
          Filtrar
        </Button>
      </form>

      <form action={enqueueDownloadsAction.bind(null, downloadableIds)}>
        <Button type="submit" size="sm" disabled={downloadableIds.length === 0}>
          Baixar {downloadableIds.length} arquivo(s)
        </Button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Materiais ({materials.length})
        </h2>
        {materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum material encontrado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {materials.map((material) => {
              const label = material.title ?? material.postTitle ?? material.postText ?? "Sem título";
              const status = statusByMaterial.get(material.id);
              const meta = `${material.postCategory} · ${material.fileType} · ${status ? DOWNLOAD_STATUS_LABEL[status] : "Novo"}`;

              return material.alternateLink ? (
                <a
                  key={material.id}
                  href={material.alternateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted"
                >
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-sm text-muted-foreground">{meta}</span>
                </a>
              ) : (
                <div
                  key={material.id}
                  className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-sm text-muted-foreground">{meta}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
