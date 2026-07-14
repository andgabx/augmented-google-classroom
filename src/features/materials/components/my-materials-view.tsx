"use client";

import { useMemo, useState } from "react";
import { FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { ViewItems, ViewToggle, type ViewMode } from "@/components/view-toggle";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FILE_TYPE_ICON } from "@/features/materials/lib/file-type-group";
import { revealDownloadedFileAction } from "@/features/downloads/server/actions";
import type { DownloadedMaterial } from "@/features/downloads/types/download";

export function MyMaterialsView({ materials }: { materials: DownloadedMaterial[] }) {
  const t = useTranslations("myMaterials");
  const [view, setView] = useState<ViewMode>("list");
  const [preview, setPreview] = useState<DownloadedMaterial | null>(null);
  const [courseId, setCourseId] = useState("");

  const courses = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of materials) seen.set(item.courseId, item.courseName);
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [materials]);

  const filtered = courseId ? materials.filter((item) => item.courseId === courseId) : materials;

  const byCourse = useMemo(() => {
    const groups = new Map<string, { courseName: string; items: DownloadedMaterial[] }>();
    for (const item of filtered) {
      const group = groups.get(item.courseId) ?? { courseName: item.courseName, items: [] };
      group.items.push(item);
      groups.set(item.courseId, group);
    }
    return groups;
  }, [filtered]);

  if (materials.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  function openMaterial(material: DownloadedMaterial) {
    if (material.isPreviewable) setPreview(material);
    else void revealDownloadedFileAction(material.materialId);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-lg bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-shadow focus:shadow-md"
          >
            <option value="">{t("allCourses")}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <ViewToggle value={view} onChange={setView} />
        </div>
        {Array.from(byCourse.values()).map((group) => (
          <section key={group.courseName} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{group.courseName}</h2>
            <ViewItems
              view={view}
              items={group.items}
              keyFor={(material) => material.materialId}
              renderListItem={(material) => (
                <MaterialRow material={material} onOpen={() => openMaterial(material)} />
              )}
              renderGridItem={(material) => (
                <MaterialCard material={material} onOpen={() => openMaterial(material)} />
              )}
            />
          </section>
        ))}
      </div>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        {preview && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{preview.materialLabel}</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <PreviewBody material={preview} />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function PreviewBody({ material }: { material: DownloadedMaterial }) {
  const src = `/api/materials/${material.materialId}/file`;
  if (material.fileType === "IMAGE") {
    return <img src={src} alt={material.materialLabel} className="min-h-0 flex-1 object-contain" />;
  }
  if (material.fileType === "VIDEO") {
    return <video src={src} controls className="min-h-0 flex-1" />;
  }
  return <iframe src={src} title={material.materialLabel} className="min-h-[70vh] flex-1 rounded-md border" />;
}

function MaterialRow({ material, onOpen }: { material: DownloadedMaterial; onOpen: () => void }) {
  const Icon = FILE_TYPE_ICON[material.fileType];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm transition-shadow duration-200 hover:shadow-lg"
    >
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{material.materialLabel}</span>
      {!material.isPreviewable && <FolderOpen className="size-4 shrink-0 text-muted-foreground" />}
    </button>
  );
}

function MaterialCard({ material, onOpen }: { material: DownloadedMaterial; onOpen: () => void }) {
  const Icon = FILE_TYPE_ICON[material.fileType];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col gap-2 rounded-2xl bg-card p-3 text-left shadow-sm transition-shadow duration-200 hover:shadow-lg"
    >
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <span className="line-clamp-2 text-sm font-medium text-foreground">{material.materialLabel}</span>
    </button>
  );
}
